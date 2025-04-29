/**
 * ComunicacionGB.js - Módulo de Comunicación
 * Gestiona todas las comunicaciones con el servidor mediante Socket.IO
 * @version 2.0.0
 */

// Namespace global
window.MAIRA = window.MAIRA || {};

// Módulo de Comunicación
MAIRA.ComunicacionGB = (function() {
    // Variables privadas
    let socket = null;
    let usuarioInfo = null;
    let operacionActual = null;
    let elementoTrabajo = null;
    let intentosReconexion = 0;
    let modulosRegistrados = {};
    let eventosRegistrados = new Set();
    let eventosPendientes = {};
    let colaPendiente = {
        mensajes: [],
        posiciones: [],
        elementos: []
    };
    let intervaloPing = null;
    let tiempoUltimaConexion = null;
    let estadoConexion = 'desconectado';
    
    /**
     * Inicializa el módulo de comunicación
     * @param {Object} config - Configuración del módulo
     * @returns {boolean} Éxito de la inicialización
     */
    function inicializar(config = {}) {
        console.log("Inicializando módulo de comunicación");
        
        try {
            // Guardar información básica
            usuarioInfo = config.usuarioInfo || window.usuarioInfo;
            operacionActual = config.operacionActual || window.operacionActual || MAIRA.Core.Utils.obtenerOperacionActual();
            elementoTrabajo = config.elementoTrabajo || window.elementoTrabajo;
            
            // Si no hay usuarioInfo, intentar obtenerla
            if (!usuarioInfo && MAIRA.UserIdentity) {
                const userId = MAIRA.UserIdentity.getUserId();
                const username = MAIRA.UserIdentity.getUsername();
                
                if (userId && username) {
                    usuarioInfo = {
                        id: userId,
                        usuario: username
                    };
                }
            }
            
            // Si no hay elementoTrabajo, intentar obtenerlo
            if (!elementoTrabajo && MAIRA.UserIdentity) {
                elementoTrabajo = MAIRA.UserIdentity.getElementoTrabajo();
            }
            
            // Inicializar Socket.IO
            inicializarSocket();
            
            // Inicializar ping periódico para mantener conexión
            iniciarPingPeriodico();
            
            console.log("Módulo de comunicación inicializado correctamente");
            return true;
        } catch (error) {
            console.error("Error al inicializar módulo de comunicación:", error);
            if (MAIRA.Core) {
                MAIRA.Core.reportarError("INICIALIZACION_COMUNICACION", error);
            }
            return false;
        }
    }
    
    /**
     * Inicializa la conexión Socket.IO
     */
    function inicializarSocket() {
        // Si ya hay socket, desconectar primero
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        
        // Determinar URL del servidor
        const serverUrl = MAIRA.Core.Utils.obtenerServerURL();
        
        // Datos para query string
        const queryData = {
            usuarioId: usuarioInfo?.id || 'visitante',
            usuario: usuarioInfo?.usuario || 'Anónimo',
            operacion: operacionActual || 'general',
            elemento: elementoTrabajo?.id || 'sin_elemento',
            timestamp: Date.now()
        };
        
        // Opciones de conexión
        const opciones = {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 10000,
            query: queryData
        };
        
        console.log(`Conectando a Socket.IO en ${serverUrl}...`, opciones);
        
        try {
            // Crear socket
            socket = io(serverUrl, opciones);
            
            // Configurar eventos principales
            configurarEventosSocket();
            
            // Guardar globalmente para compatibilidad
            window.socket = socket;
            
            return true;
        } catch (error) {
            console.error("Error al inicializar Socket.IO:", error);
            socket = null;
            window.socket = null;
            return false;
        }
    }
    
    /**
     * Configura los eventos básicos del socket
     */
    function configurarEventosSocket() {
        // Asegurar que existe socket
        if (!socket) {
            console.error("No hay conexión socket para configurar eventos");
            return false;
        }
        
        // Conexión establecida
        socket.on('connect', function() {
            console.log("Conexión Socket.IO establecida");
            estadoConexion = 'conectado';
            tiempoUltimaConexion = Date.now();
            intentosReconexion = 0;
            
            // Notificar conexión
            MAIRA.Core.Utils.mostrarNotificacion("Conexión establecida con el servidor", "success");
            MAIRA.Core.Utils.agregarMensajeChat("Sistema", "Conexión establecida", "sistema");
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:establecida', {
                    timestamp: tiempoUltimaConexion
                });
            }
            
            // Anunciar presencia
            anunciarPresencia();
            
            // Registrar eventos pendientes
            registrarEventosPendientes();
            
            // Procesar cola pendiente
            procesarColaPendiente();
        });
        
        // Error de conexión
        socket.on('connect_error', function(error) {
            console.error("Error de conexión Socket.IO:", error);
            estadoConexion = 'error';
            
            // Notificar error después del primer intento
            if (intentosReconexion === 0) {
                MAIRA.Core.Utils.mostrarNotificacion("Error de conexión al servidor", "error");
                MAIRA.Core.Utils.agregarMensajeChat("Sistema", "Error de conexión al servidor", "error");
            }
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:error', {
                    error: error,
                    intentos: intentosReconexion
                });
            }
            
            intentosReconexion++;
        });
        
        // Desconexión
        socket.on('disconnect', function(reason) {
            console.log("Desconexión Socket.IO:", reason);
            estadoConexion = 'desconectado';
            
            // Notificar solo si es una desconexión no esperada
            if (reason !== 'io client disconnect') {
                MAIRA.Core.Utils.mostrarNotificacion("Desconectado del servidor", "warning");
                MAIRA.Core.Utils.agregarMensajeChat("Sistema", "Desconectado del servidor: " + reason, "sistema");
                
                // Marcar elementos como desconectados
                if (typeof window.marcarElementosDesconectados === 'function') {
                    window.marcarElementosDesconectados();
                } else if (MAIRA.GestionBatalla && typeof MAIRA.GestionBatalla.marcarElementosDesconectados === 'function') {
                    MAIRA.GestionBatalla.marcarElementosDesconectados();
                } else if (MAIRA.Elementos && typeof MAIRA.Elementos.marcarElementosDesconectados === 'function') {
                    MAIRA.Elementos.marcarElementosDesconectados();
                }
            }
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:desconectado', {
                    razon: reason
                });
            }
        });
        
        // Intento de reconexión
        socket.on('reconnect_attempt', function(attempt) {
            console.log(`Intento de reconexión ${attempt}...`);
            estadoConexion = 'reconectando';
            
            // Notificar cada 3 intentos para no molestar demasiado
            if (attempt === 1 || attempt % 3 === 0) {
                MAIRA.Core.Utils.mostrarNotificacion(`Intentando reconectar (${attempt})...`, "info");
            }
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:reconectando', {
                    intento: attempt
                });
            }
        });
        
        // Reconexión exitosa
        socket.on('reconnect', function(attempt) {
            console.log(`Reconexión exitosa después de ${attempt} intentos`);
            estadoConexion = 'conectado';
            tiempoUltimaConexion = Date.now();
            intentosReconexion = 0;
            
            // Notificar
            MAIRA.Core.Utils.mostrarNotificacion("Reconexión exitosa", "success");
            MAIRA.Core.Utils.agregarMensajeChat("Sistema", "Conexión restablecida", "sistema");
            
            // Anunciar presencia
            anunciarPresencia();
            
            // Procesar cola pendiente
            procesarColaPendiente();
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:reconectado', {
                    intentos: attempt,
                    timestamp: tiempoUltimaConexion
                });
            }
        });
        
        // Error de reconexión
        socket.on('reconnect_error', function(error) {
            console.error("Error de reconexión:", error);
            
            // Notificar cada 3 intentos
            if (intentosReconexion % 3 === 0) {
                MAIRA.Core.Utils.mostrarNotificacion("Error al intentar reconectar", "error");
            }
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:error_reconexion', {
                    error: error,
                    intentos: intentosReconexion
                });
            }
            
            intentosReconexion++;
        });
        
        // Reconexión fallida después de todos los intentos
        socket.on('reconnect_failed', function() {
            console.error("Reconexión fallida después de todos los intentos");
            estadoConexion = 'fallido';
            
            // Notificar
            MAIRA.Core.Utils.mostrarNotificacion("No se pudo reconectar al servidor", "error");
            MAIRA.Core.Utils.agregarMensajeChat("Sistema", "Todos los intentos de reconexión han fallado", "error");
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:fallida', {
                    intentos: intentosReconexion
                });
            }
        });
        
        // Evento de ping/heartbeat del servidor
        socket.on('ping', function() {
            // Actualizar tiempo de última conexión
            tiempoUltimaConexion = Date.now();
            
            // Responder con pong y datos básicos
            socket.emit('pong', {
                id: usuarioInfo?.id,
                timestamp: Date.now(),
                operacion: operacionActual
            });
        });
        
        // Evento de error
        socket.on('error', function(error) {
            console.error("Error Socket.IO:", error);
            
            // Notificar
            MAIRA.Core.Utils.mostrarNotificacion("Error en la conexión", "error");
            
            // Emitir evento para otros módulos
            if (MAIRA.Eventos) {
                MAIRA.Eventos.emitir('conexion:error', {
                    error: error
                });
            }
        });
        
        return true;
    }
    
    /**
     * Anuncia presencia al servidor
     */
    function anunciarPresencia() {
        if (!socket || !socket.connected) return false;
        
        // Preparar datos básicos
        const datos = {
            id: usuarioInfo?.id || 'visitante_' + Date.now(),
            usuario: usuarioInfo?.usuario || 'Anónimo',
            elemento: elementoTrabajo,
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            conectado: true,
            navegador: navigator.userAgent,
            tipo: 'cliente'
        };
        
        console.log("Anunciando presencia al servidor:", datos);
        
        // Enviar por varios canales para compatibilidad
        socket.emit('anunciarElemento', datos);
        socket.emit('nuevoElemento', datos);
        socket.emit('elementoConectado', datos);
        socket.emit('conectado', datos);
        
        // Solicitar lista de elementos
        solicitarElementos();
        
        return true;
    }
    
    /**
     * Inicia el ping periódico para mantener la conexión
     */
    function iniciarPingPeriodico() {
        // Limpiar intervalo existente
        if (intervaloPing) {
            clearInterval(intervaloPing);
        }
        
        // Configurar nuevo intervalo
        intervaloPing = setInterval(function() {
            if (socket && socket.connected) {
                // Enviar ping
                socket.emit('heartbeat', {
                    id: usuarioInfo?.id,
                    usuario: usuarioInfo?.usuario,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString()
                });
                
                console.log("Ping enviado al servidor");
            }
        }, 30000); // Cada 30 segundos
    }
    
    /**
     * Procesa la cola de mensajes y eventos pendientes
     */
    function procesarColaPendiente() {
        if (!socket || !socket.connected) return;
        
        console.log(`Procesando cola pendiente: ${colaPendiente.mensajes.length} mensajes, ${colaPendiente.posiciones.length} posiciones, ${colaPendiente.elementos.length} elementos`);
        
        // Procesar mensajes
        while (colaPendiente.mensajes.length > 0) {
            const mensaje = colaPendiente.mensajes.shift();
            socket.emit('mensajeChat', mensaje);
            console.log("Mensaje pendiente enviado:", mensaje.id);
        }
        
        // Procesar posiciones
        while (colaPendiente.posiciones.length > 0) {
            const posicion = colaPendiente.posiciones.shift();
            socket.emit('actualizarPosicionGB', posicion);
            console.log("Posición pendiente enviada:", posicion.id);
        }
        
        // Procesar elementos
        while (colaPendiente.elementos.length > 0) {
            const elemento = colaPendiente.elementos.shift();
            socket.emit('nuevoElemento', elemento);
            socket.emit('anunciarElemento', elemento);
            console.log("Elemento pendiente enviado:", elemento.id);
        }
        
        console.log("Cola pendiente procesada completamente");
    }
    
    /**
     * Registra los eventos pendientes una vez establecida la conexión
     */
    function registrarEventosPendientes() {
        if (!socket) return;
        
        // Registrar eventos pendientes
        for (const evento in eventosPendientes) {
            if (eventosPendientes[evento] && eventosPendientes[evento].length > 0) {
                console.log(`Registrando ${eventosPendientes[evento].length} manejadores pendientes para evento ${evento}`);
                
                for (const callback of eventosPendientes[evento]) {
                    registrarEvento(evento, callback);
                }
                
                // Limpiar
                eventosPendientes[evento] = [];
            }
        }
    }
    
    /**
     * Registra un evento en el socket con manejo de duplicados
     * @param {string} evento - Nombre del evento
     * @param {Function} callback - Función a ejecutar cuando ocurre el evento
     * @returns {boolean} Éxito del registro
     */
    function registrarEvento(evento, callback) {
        // Si no hay socket, guardar para registrar cuando la conexión esté disponible
        if (!socket) {
            console.log(`Socket no disponible, evento ${evento} será registrado cuando haya conexión`);
            
            // Agregar a cola de eventos pendientes
            if (!eventosPendientes[evento]) eventosPendientes[evento] = [];
            eventosPendientes[evento].push(callback);
            
            return true;
        }
        
        // Identificador único para este evento y callback
        const id = evento + '_' + callback.toString().slice(0, 50);
        
        // Evitar duplicados
        if (eventosRegistrados.has(id)) {
            console.log(`Evento ${evento} ya registrado, se omite`);
            return false;
        }
        
        // Registrar evento
        socket.on(evento, callback);
        eventosRegistrados.add(id);
        
        console.log(`Evento ${evento} registrado correctamente`);
        return true;
    }
    
    /**
     * Obtiene el objeto socket
     * @returns {Object|null} Objeto socket o null si no hay conexión
     */
    function obtenerSocket() {
        return socket;
    }
    
    /**
     * Desconecta del servidor
     */
    function desconectar() {
        if (socket) {
            console.log("Desconectando socket manualmente...");
            socket.disconnect();
            socket = null;
            window.socket = null;
        }
        
        // Limpiar ping periódico
        if (intervaloPing) {
            clearInterval(intervaloPing);
            intervaloPing = null;
        }
        
        // Actualizar estado
        estadoConexion = 'desconectado';
        
        // Emitir evento
        if (MAIRA.Eventos) {
            MAIRA.Eventos.emitir('conexion:manual_desconexion', {
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Verifica si hay conexión al servidor
     * @returns {boolean} Estado de la conexión
     */
    function estaConectado() {
        return !!(socket && socket.connected);
    }
    
    /**
     * Obtiene estadísticas de la conexión
     * @returns {Object} Estadísticas
     */
    function obtenerEstadisticas() {
        return {
            conectado: estaConectado(),
            estado: estadoConexion,
            ultimaConexion: tiempoUltimaConexion,
            tiempoDesdeUltimaConexion: tiempoUltimaConexion ? Date.now() - tiempoUltimaConexion : null,
            intentosReconexion: intentosReconexion,
            eventosRegistrados: eventosRegistrados.size,
            pendientes: {
                mensajes: colaPendiente.mensajes.length,
                posiciones: colaPendiente.posiciones.length,
                elementos: colaPendiente.elementos.length
            }
        };
    }
    
    /**
     * Registra un módulo para recibir eventos del socket
     * @param {string} nombreModulo - Nombre del módulo
     * @param {Object} config - Configuración con eventos y callbacks
     * @returns {boolean} Éxito del registro
     */
    function registrarModulo(nombreModulo, config) {
        if (!nombreModulo || !config) {
            console.error("No se puede registrar módulo sin nombre o configuración");
            return false;
        }
        
        console.log(`Registrando módulo ${nombreModulo} para comunicación`);
        
        // Guardar en lista de módulos registrados
        modulosRegistrados[nombreModulo] = config;
        
        // Configurar eventos si están definidos
        if (config.eventos && typeof config.eventos === 'object') {
            for (const evento in config.eventos) {
                registrarEvento(evento, config.eventos[evento]);
            }
        }
        
        // Ejecutar callback onRegister si existe
        if (typeof config.onRegister === 'function') {
            config.onRegister(socket);
        }
        
        // Si ya está conectado y existe onConnect, ejecutarlo
        if (socket && socket.connected && typeof config.onConnect === 'function') {
            config.onConnect(socket);
        }
        
        return true;
    }
    
    /**
     * Solicita la lista de elementos al servidor
     * @returns {boolean} Éxito de la solicitud
     */
    function solicitarElementos() {
        if (!socket || !socket.connected) {
            console.warn("No se puede solicitar lista de elementos: sin conexión");
            return false;
        }
        
        // Determinar operación actual
        const operacion = operacionActual || MAIRA.Core.Utils.obtenerOperacionActual();
        
        console.log(`Solicitando lista de elementos para operación: ${operacion}`);
        
        // Enviar por múltiples canales para compatibilidad
        socket.emit('solicitarElementos', { 
            operacion: operacion,
            solicitante: usuarioInfo?.id || 'visitante'
        });
        
        socket.emit('solicitarElementosDB', {
            operacion: operacion
        });
        
        socket.emit('listaElementos', { 
            operacion: operacion 
        });
        
        return true;
    }
    
    /**
     * Envía un mensaje al servidor
     * @param {string} tipo - Tipo de mensaje
     * @param {Object} datos - Datos del mensaje
     * @returns {boolean} Éxito del envío
     */
    function enviarMensaje(tipo, datos) {
        if (!socket || !socket.connected) {
            console.warn(`No se puede enviar mensaje ${tipo}: sin conexión`);
            
            // Guardar en cola pendiente según tipo
            switch(tipo) {
                case 'chat':
                    colaPendiente.mensajes.push(datos);
                    break;
                case 'posicion':
                    colaPendiente.posiciones.push(datos);
                    break;
                case 'elemento':
                    colaPendiente.elementos.push(datos);
                    break;
            }
            
            return false;
        }
        
        try {
            // Determinar evento según tipo
            let evento = '';
            switch(tipo) {
                case 'chat':
                    evento = 'mensajeChat';
                    break;
                case 'posicion':
                    evento = 'actualizarPosicionGB';
                    break;
                case 'elemento':
                    evento = 'anunciarElemento';
                    break;
                default:
                    evento = tipo;
            }
            
            // Enviar datos
            if (evento) {
                socket.emit(evento, datos);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Error al enviar mensaje ${tipo}:`, error);
            return false;
        }
    }
    
    /**
     * Obtiene el estado de la conexión
     * @returns {string} Estado (conectado, desconectado, reconectando, error, fallido)
     */
    function obtenerEstadoConexion() {
        return estadoConexion;
    }
    
    // API pública
    return {
        inicializar,
        registrarEvento,
        obtenerSocket,
        desconectar,
        estaConectado,
        obtenerEstadisticas,
        registrarModulo,
        solicitarElementos,
        enviarMensaje,
        obtenerEstadoConexion,
        // Para compatibilidad con código antiguo
        colaPendiente
    };
})();

// Exponer globalmente
window.MAIRA.ComunicacionGB = MAIRA.ComunicacionGB;

// Compatibilidad con código antiguo
window.registrarEvento = function(evento, callback) {
    return MAIRA.ComunicacionGB.registrarEvento(evento, callback);
};

window.obtenerSocket = function() {
    return MAIRA.ComunicacionGB.obtenerSocket();
};