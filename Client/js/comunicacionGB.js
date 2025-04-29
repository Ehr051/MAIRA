/**
 * comunicacionGB.js
 * Módulo centralizado para la gestión de conexiones y comunicaciones en MAIRA
 * @version 1.0.0
 */

// Namespace principal
window.MAIRA = window.MAIRA || {};

// Módulo de comunicación
MAIRA.ComunicacionGB = (function() {
    // Variables privadas
    let socket = null;
    let usuarioInfo = null;
    let operacionActual = "";
    let elementoTrabajo = null;
    let posicionActual = null;
    let colaPendiente = {
        mensajes: [],
        informes: [],
        posiciones: []
    };
    let estadoConexion = false;
    let callbacksConexion = {
        onConnect: [],
        onDisconnect: [],
        onReconnect: []
    };
    let eventosRegistrados = new Set();
    let modulosRegistrados = {};
    let ultimoReintento = 0;
    const INTERVALO_REINTENTO = 5000; // 5 segundos entre reintentos
    
    /**
     * Inicializa el módulo de comunicación
     * @param {Object} config - Configuración del módulo
     */
    function inicializar(config) {
        console.log("Inicializando módulo de comunicación");
        
        // Validar configuración
        if (!config) {
            console.error("No se proporcionó configuración para inicializar el módulo");
            return false;
        }
        
        // Almacenar referencias
        usuarioInfo = config.usuarioInfo;
        operacionActual = config.operacionActual;
        elementoTrabajo = config.elementoTrabajo;
        posicionActual = config.posicionActual;
        
        // Si ya existe una conexión, cerrarla
        if (socket && socket.connected) {
            socket.disconnect();
        }
        
        // Obtener URL del servidor
        const SERVER_URL = obtenerServerURL();
        
        try {
            // Configurar nueva conexión Socket.IO
            socket = io(SERVER_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 10,
                query: {
                    usuarioId: usuarioInfo ? usuarioInfo.id : 'visitante',
                    operacion: operacionActual,
                    elemento: elementoTrabajo ? elementoTrabajo.id : 'sin_elemento'
                }
            });
            
            // Configurar eventos básicos del socket
            configurarEventosBase();
            
            // Exportar socket a la variable global para compatibilidad
            window.socket = socket;
            
            // Auto-detectar e integrar módulos disponibles
            if (window.MAIRA) {
                if (window.MAIRA.Chat) {
                    console.log("Chat detectado, integrando con ComunicacionGB");
                    window.MAIRA.Chat.socket = socket;
                }
                
                if (window.MAIRA.Elementos) {
                    console.log("Módulo Elementos detectado, integrando con ComunicacionGB");
                    window.MAIRA.Elementos.socket = socket;
                }
                
                if (window.MAIRA.GestionBatalla) {
                    window.MAIRA.GestionBatalla.socket = socket;
                }
            }
            
            console.log("Módulo de comunicación inicializado correctamente");
            return true;
        } catch (error) {
            console.error("Error al inicializar módulo de comunicación:", error);
            return false;
        }
    }
    
    /**
     * Obtiene la URL del servidor
     * @returns {string} URL del servidor
     */
    function obtenerServerURL() {
        // Intentar obtener de la configuración global
        if (window.SERVER_URL) {
            return window.SERVER_URL;
        }
        
        // Obtener URL base del servidor
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        let port = window.location.port;
        
        // Si es localhost, usar puerto específico
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            port = port || '5000';
            return `${protocol}//${hostname}:${port}`;
        }
        
        // Si no hay puerto, usar el mismo protocolo y host
        if (!port) {
            return `${protocol}//${hostname}`;
        }
        
        return `${protocol}//${hostname}:${port}`;
    }
    
    /**
     * Configura los eventos base del socket
     */
    function configurarEventosBase() {
        if (!socket) return;
        
        // Evento de conexión
        socket.on('connect', function() {
            console.log("Conectado al servidor. Socket ID:", socket.id);
            estadoConexion = true;
            
            // Registrar en la sala de operación
            unirseOperacion();
            
            // Notificar a módulos
            callbacksConexion.onConnect.forEach(callback => {
                try {
                    callback(socket);
                } catch (error) {
                    console.error("Error en callback de conexión:", error);
                }
            });
            
            // Enviar datos pendientes
            enviarPendientes();
        });
        
        // Evento de error de conexión
        socket.on('connect_error', function(error) {
            console.error("Error de conexión:", error);
            estadoConexion = false;
            actualizarEstadoConexionUI(false);
        });
        
        // Evento de desconexión
        socket.on('disconnect', function(reason) {
            console.warn("Desconectado del servidor:", reason);
            estadoConexion = false;
            
            // Notificar a módulos
            callbacksConexion.onDisconnect.forEach(callback => {
                try {
                    callback(reason);
                } catch (error) {
                    console.error("Error en callback de desconexión:", error);
                }
            });
            
            actualizarEstadoConexionUI(false);
        });
        
        // Evento de reconexión
        socket.on('reconnect', function(attemptNumber) {
            console.log("Reconexión exitosa después de", attemptNumber, "intentos");
            estadoConexion = true;
            
            // Unirse nuevamente a la sala
            unirseOperacion();
            
            // Notificar a módulos
            callbacksConexion.onReconnect.forEach(callback => {
                try {
                    callback(socket, attemptNumber);
                } catch (error) {
                    console.error("Error en callback de reconexión:", error);
                }
            });
            
            actualizarEstadoConexionUI(true);
            
            // Enviar datos pendientes
            enviarPendientes();
        });
    }
    
    /**
     * Actualiza la representación visual del estado de conexión
     * @param {boolean} conectado - Estado de la conexión
     */
    function actualizarEstadoConexionUI(conectado) {
        // Actualizar variable global para compatibilidad
        window.estaConectado = conectado;
        
        // Actualizar indicador visual si existe
        const indicadorConexion = document.getElementById('indicador-conexion');
        if (indicadorConexion) {
            indicadorConexion.className = conectado ? 'conectado' : 'desconectado';
            indicadorConexion.innerHTML = conectado 
                ? '<i class="fas fa-wifi"></i> Conectado' 
                : '<i class="fas fa-exclamation-triangle"></i> Desconectado';
        }
        
        // Actualizar botones que dependen de la conexión
        const botonesConexion = document.querySelectorAll('.requiere-conexion');
        botonesConexion.forEach(boton => {
            boton.disabled = !conectado;
            if (conectado) {
                boton.classList.remove('desactivado');
            } else {
                boton.classList.add('desactivado');
            }
        });
        
        // Actualizar mensaje en panel lateral si existe
        const estadoConexionPanel = document.getElementById('estado-conexion-panel');
        if (estadoConexionPanel) {
            estadoConexionPanel.innerHTML = conectado 
                ? '<span class="badge bg-success">Conectado</span>' 
                : '<span class="badge bg-danger">Desconectado</span>';
        }
        
        // Notificar a otros módulos
        if (window.MAIRA.Chat && window.MAIRA.Chat.actualizarEstadoConexion) {
            window.MAIRA.Chat.actualizarEstadoConexion(conectado);
        }
        
        if (window.MAIRA.Elementos && window.MAIRA.Elementos.actualizarEstadoConexion) {
            window.MAIRA.Elementos.actualizarEstadoConexion(conectado);
        }
        
        // Marcar elementos como desconectados si perdimos conexión
        if (!conectado && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.marcarElementosDesconectados) {
            window.MAIRA.GestionBatalla.marcarElementosDesconectados();
        }
    }
    
    /**
     * Une al usuario a la sala de operación
     */
    function unirseOperacion() {
        if (!socket || !socket.connected || !operacionActual) return;
        
        console.log("Uniéndose a la operación:", operacionActual);
        
        socket.emit('unirseOperacion', {
            operacion: operacionActual,
            usuarioId: usuarioInfo ? usuarioInfo.id : 'visitante',
            usuario: usuarioInfo ? usuarioInfo.usuario : 'Visitante',
            elemento: elementoTrabajo || { designacion: 'Sin elemento asignado' }
        });
        
        // Registrar elemento si tenemos uno asociado
        if (elementoTrabajo && usuarioInfo) {
            socket.emit('registrarElemento', {
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                sidc: elementoTrabajo.sidc || 'SFGPEVC-------',
                designacion: elementoTrabajo.designacion || 'Sin designación',
                dependencia: elementoTrabajo.dependencia || '',
                magnitud: elementoTrabajo.magnitud || 'equipo',
                posicion: posicionActual,
                operacion: operacionActual,
                timestamp: new Date().toISOString(),
                conectado: true
            });
        }
        
        // Solicitar lista de elementos actuales
        socket.emit('solicitarElementos', { operacion: operacionActual });
    }
    
    /**
     * Envía los datos pendientes cuando se recupera la conexión
     */
    function enviarPendientes() {
        console.log("Intentando enviar datos pendientes");
        
        if (!socket || !socket.connected) {
            console.warn("No se pueden enviar datos pendientes: sin conexión");
            return;
        }
        
        // Enviar mensajes pendientes
        if (colaPendiente.mensajes && colaPendiente.mensajes.length > 0) {
            console.log(`Enviando ${colaPendiente.mensajes.length} mensajes pendientes`);
            
            colaPendiente.mensajes.forEach(mensaje => {
                socket.emit('mensajeChat', mensaje);
            });
            
            // Limpiar mensajes enviados
            colaPendiente.mensajes = [];
        }
        
        // Enviar informes pendientes
        if (colaPendiente.informes && colaPendiente.informes.length > 0) {
            console.log(`Enviando ${colaPendiente.informes.length} informes pendientes`);
            
            colaPendiente.informes.forEach(informe => {
                socket.emit('nuevoInforme', informe);
            });
            
            // Limpiar informes enviados
            colaPendiente.informes = [];
        }
        
        // Enviar posiciones pendientes
        if (colaPendiente.posiciones && colaPendiente.posiciones.length > 0) {
            console.log(`Enviando ${colaPendiente.posiciones.length} posiciones pendientes`);
            
            // Solo enviar la última posición para no sobrecargar
            const ultimaPosicionPendiente = colaPendiente.posiciones[colaPendiente.posiciones.length - 1];
            socket.emit('actualizarPosicionGB', ultimaPosicionPendiente);
            
            // Limpiar posiciones enviadas
            colaPendiente.posiciones = [];
        }
        
        // Verificar si hay datos pendientes en otros módulos
        if (window.MAIRA.Chat && typeof window.MAIRA.Chat.enviarPendientes === 'function') {
            window.MAIRA.Chat.enviarPendientes();
        }
        
        if (window.MAIRA.Informes && typeof window.MAIRA.Informes.enviarInformesPendientes === 'function') {
            window.MAIRA.Informes.enviarInformesPendientes();
        }
    }
    
    /**
     * Registra un evento de socket con manejo de duplicados
     * @param {string} evento - Nombre del evento
     * @param {Function} callback - Función a ejecutar cuando ocurre el evento
     */
    // En comunicacionGB.js, añade esta variable al inicio del módulo
let eventosPendientes = {};

function registrarEvento(evento, callback) {
    // Si no hay socket, guardar callbacks para registrar cuando la conexión esté disponible
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
     * Desregistra un evento de socket
     * @param {string} evento - Nombre del evento
     */
    function desregistrarEvento(evento) {
        if (!socket) return false;
        
        socket.off(evento);
        
        // Eliminar todos los registros para este evento
        const eventosEliminar = Array.from(eventosRegistrados)
            .filter(id => id.startsWith(evento + '_'));
        
        eventosEliminar.forEach(id => eventosRegistrados.delete(id));
        
        console.log(`Evento ${evento} desregistrado correctamente`);
        return true;
    }
    
    /**
     * Registra un módulo para recibir eventos de socket
     * @param {string} nombreModulo - Nombre del módulo
     * @param {Object} configuracion - Configuración de eventos
     */
    function registrarModulo(nombreModulo, configuracion) {
        if (!configuracion || !configuracion.eventos) {
            console.error(`Configuración inválida para el módulo ${nombreModulo}`);
            return false;
        }
        
        console.log(`Registrando módulo ${nombreModulo} para eventos de socket`);
        
        // Guardar referencia del módulo
        modulosRegistrados[nombreModulo] = configuracion;
        
        // Registrar los eventos específicos del módulo
        Object.entries(configuracion.eventos).forEach(([evento, callback]) => {
            registrarEvento(evento, callback);
        });
        
        // Registrar callbacks de conexión si están definidos
        if (configuracion.onConnect) {
            callbacksConexion.onConnect.push(configuracion.onConnect);
        }
        
        if (configuracion.onDisconnect) {
            callbacksConexion.onDisconnect.push(configuracion.onDisconnect);
        }
        
        if (configuracion.onReconnect) {
            callbacksConexion.onReconnect.push(configuracion.onReconnect);
        }
        
        // Si ya estamos conectados, ejecutar onConnect inmediatamente
        if (socket && socket.connected && configuracion.onConnect) {
            configuracion.onConnect(socket);
        }
        
        return true;
    }
    
    /**
     * Desregistra un módulo
     * @param {string} nombreModulo - Nombre del módulo a desregistrar
     */
    function desregistrarModulo(nombreModulo) {
        if (!modulosRegistrados[nombreModulo]) {
            console.warn(`Módulo ${nombreModulo} no registrado`);
            return false;
        }
        
        const configuracion = modulosRegistrados[nombreModulo];
        
        // Desregistrar eventos
        if (configuracion.eventos) {
            Object.keys(configuracion.eventos).forEach(evento => {
                desregistrarEvento(evento);
            });
        }
        
        // Eliminar callbacks de conexión
        if (configuracion.onConnect) {
            const index = callbacksConexion.onConnect.indexOf(configuracion.onConnect);
            if (index >= 0) callbacksConexion.onConnect.splice(index, 1);
        }
        
        if (configuracion.onDisconnect) {
            const index = callbacksConexion.onDisconnect.indexOf(configuracion.onDisconnect);
            if (index >= 0) callbacksConexion.onDisconnect.splice(index, 1);
        }
        
        if (configuracion.onReconnect) {
            const index = callbacksConexion.onReconnect.indexOf(configuracion.onReconnect);
            if (index >= 0) callbacksConexion.onReconnect.splice(index, 1);
        }
        
        // Eliminar referencia del módulo
        delete modulosRegistrados[nombreModulo];
        
        console.log(`Módulo ${nombreModulo} desregistrado correctamente`);
        return true;
    }
    
    /**
     * Envía un evento al servidor con reintentos
     * @param {string} evento - Nombre del evento
     * @param {Object} datos - Datos a enviar
     * @param {Function} [callback] - Función de callback para la respuesta
     * @param {Object} [opciones] - Opciones adicionales
     * @returns {Promise} Promesa que se resuelve con la respuesta del servidor
     */
    function enviarEvento(evento, datos, callback, opciones = {}) {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("No hay conexión disponible"));
                return;
            }
            
            // Opciones predeterminadas
            const config = {
                reintentos: opciones.reintentos || 3,
                timeout: opciones.timeout || 10000,
                enCola: opciones.enCola !== undefined ? opciones.enCola : true
            };
            
            // Si no hay conexión, encolar si está configurado
            if (!socket.connected && config.enCola) {
                console.log(`Sin conexión, encolando evento ${evento}`);
                
                // Determinar la cola según el tipo de evento
                let cola;
                if (evento.includes('mensaje') || evento.includes('chat')) {
                    cola = colaPendiente.mensajes;
                } else if (evento.includes('informe')) {
                    cola = colaPendiente.informes;
                } else if (evento.includes('posicion')) {
                    cola = colaPendiente.posiciones;
                } else {
                    // Cola general (mensajes por defecto)
                    cola = colaPendiente.mensajes;
                }
                
                // Añadir a la cola correspondiente
                cola.push({
                    evento: evento,
                    datos: datos,
                    timestamp: new Date().toISOString()
                });
                
                reject(new Error("Sin conexión, evento encolado"));
                return;
            }
            
            // Control de timeout
            let timeoutId = null;
            if (config.timeout > 0) {
                timeoutId = setTimeout(() => {
                    if (timeoutId) {
                        timeoutId = null;
                        reject(new Error("Timeout alcanzado"));
                    }
                }, config.timeout);
            }
            
            // Función de reintento
            const intentar = (intentosRestantes) => {
                if (intentosRestantes <= 0) {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    reject(new Error(`Máximo de reintentos alcanzado (${config.reintentos})`));
                    return;
                }
                
                try {
                    if (callback) {
                        // Con callback para respuesta
                        socket.emit(evento, datos, function(respuesta) {
                            if (timeoutId) {
                                clearTimeout(timeoutId);
                                timeoutId = null;
                            }
                            
                            // Si hay error en la respuesta y quedan reintentos
                            if (respuesta && respuesta.error && intentosRestantes > 1) {
                                console.log(`Error en evento ${evento}, reintentando (${intentosRestantes-1} restantes)...`);
                                setTimeout(() => intentar(intentosRestantes - 1), 1000);
                                return;
                            }
                            
                            // Resolver con la respuesta
                            resolve(respuesta);
                        });
                    } else {
                        // Sin callback
                        socket.emit(evento, datos);
                        
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                        
                        resolve(true);
                    }
                } catch (error) {
                    console.error(`Error al enviar evento ${evento}:`, error);
                    
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    
                    if (intentosRestantes > 1) {
                        console.log(`Reintentando evento ${evento} (${intentosRestantes-1} restantes)...`);
                        setTimeout(() => intentar(intentosRestantes - 1), 1000);
                    } else {
                        reject(error);
                    }
                }
            };
            
            // Iniciar el primer intento
            intentar(config.reintentos);
        });
    }
    
    /**
     * Envía la posición actual al servidor
     * @param {Object} posicion - Objeto con lat, lng, precision, rumbo, velocidad
     * @param {Object} [opciones] - Opciones adicionales para el envío
     * @returns {Promise} Promesa que se resuelve cuando se envía la posición
     */
    function enviarPosicion(posicion, opciones = {}) {
        // Verificación más flexible de posición
        if (!posicion) {
            console.warn("Posición no proporcionada, usando posición predeterminada");
            // Usar posición por defecto si está disponible
            posicion = posicionActual || {
                lat: -34.6037, // Buenos Aires como predeterminado
                lng: -58.3816,
                precision: 1000,
                rumbo: 0,
                timestamp: new Date()
            };
        }
        
        // Si no tiene lat/lng, intentar obtenerlos
        if (!posicion.lat || !posicion.lng) {
            console.warn("Posición incompleta, intentando usar valores predeterminados");
            posicion = {
                ...posicion,
                lat: posicion.lat || -34.6037,
                lng: posicion.lng || -58.3816,
                precision: posicion.precision || 1000,
                rumbo: posicion.rumbo || 0
            };
        }
        
        if (!usuarioInfo || !usuarioInfo.id) {
            console.warn("No hay información de usuario, no se puede enviar posición");
            return Promise.resolve(false);
        }
        
        // Guardar referencia
        posicionActual = posicion;
        window.posicionActual = posicion;
        
        // Si se especificó un elemento, usarlo, sino usar el global
        const elemento = opciones.elemento || elementoTrabajo;
        
        // Crear paquete de datos
        const datosPosicion = {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            elemento: elemento,
            posicion: posicion,
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            conectado: true
        };
        
        // Enviar por múltiples canales si hay conexión
        if (socket && socket.connected) {
            try {
                socket.emit('actualizarPosicionGB', datosPosicion);
                socket.emit('actualizacionPosicion', datosPosicion);
                socket.emit('actualizarPosicionDB', datosPosicion);
                return Promise.resolve(true);
            } catch (e) {
                console.error("Error enviando posición:", e);
                
                // Encolar para reintento
                colaPendiente.posiciones.push(datosPosicion);
                return Promise.resolve(false);
            }
        } else {
            // Encolar para enviar cuando haya conexión
            colaPendiente.posiciones.push(datosPosicion);
            console.log("Sin conexión, posición encolada para envío posterior");
            return Promise.resolve(false);
        }
    }
    
    /**
     * Envía un heartbeat al servidor para mantener la conexión activa
     */
    function enviarHeartbeat() {
        if (!socket || !socket.connected || !usuarioInfo) {
            return Promise.reject(new Error("No hay conexión disponible"));
        }
        
        const datos = {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            elemento: elementoTrabajo,
            posicion: posicionActual,
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            conectado: true
        };
        
        return enviarEvento('heartbeat', datos, null, {
            reintentos: 1, // Solo un intento para el heartbeat
            enCola: false  // No encolar heartbeats
        });
    }
    
    /**
     * Inicia un envío periódico de heartbeat
     * @param {number} intervalo - Intervalo en milisegundos
     */
    function iniciarHeartbeatPeriodico(intervalo = 30000) {
        // Limpiar intervalo existente
        if (window.heartbeatInterval) {
            clearInterval(window.heartbeatInterval);
        }
        
        // Configurar nuevo intervalo
        window.heartbeatInterval = setInterval(() => {
            if (socket && socket.connected) {
                enviarHeartbeat()
                    .catch(error => console.warn("Error en heartbeat:", error));
            }
        }, intervalo);
        
        console.log(`Heartbeat periódico iniciado (cada ${intervalo}ms)`);
    }
    
    /**
     * Solicita la lista de elementos al servidor
     */
    function solicitarElementos() {
        if (!socket || !socket.connected) {
            console.warn("No se puede solicitar lista de elementos: sin conexión");
            return Promise.reject(new Error("Sin conexión"));
        }
        
        console.log("Solicitando lista de elementos para la operación:", operacionActual);
        
        // Múltiples eventos para máxima compatibilidad
        const promesas = [
            enviarEvento('solicitarElementos', { 
                operacion: operacionActual,
                solicitante: usuarioInfo?.id
            }),
            enviarEvento('listaElementos', { 
                operacion: operacionActual 
            }, null, {enCola: false})
        ];
        
        // También solicitar elementos desde la base de datos si está disponible
        if (socket.hasListeners('solicitarElementosDB')) {
            promesas.push(
                enviarEvento('solicitarElementosDB', {
                    operacion: operacionActual,
                    solicitante: usuarioInfo?.id
                }, null, {enCola: false})
            );
        }
        
        return Promise.all(promesas)
            .then(() => {
                console.log("Solicitud de elementos enviada correctamente");
                return true;
            })
            .catch(error => {
                console.warn("Error solicitando elementos:", error);
                return false;
            });
    }
    
    /**
     * Forzar sincronización completa con el servidor
     */
    function forzarSincronizacion() {
        if (!socket || !socket.connected) {
            return Promise.reject(new Error("Sin conexión al servidor"));
        }
        
        console.log("Forzando sincronización completa con el servidor");
        
        // Solicitar lista completa de elementos
        return solicitarElementos()
            .then(() => {
                // Anunciar nuestra presencia para que otros nos vean
                const datos = {
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: posicionActual,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString(),
                    conectado: true
                };
                
                // Enviar por múltiples canales para asegurar recepción
                return Promise.all([
                    enviarEvento('anunciarElemento', datos),
                    enviarEvento('nuevoElemento', datos, null, {enCola: false}),
                    enviarEvento('heartbeat', datos, null, {enCola: false})
                ]);
            })
            .then(() => {
                console.log("Sincronización forzada completada");
                
                // Notificar a todos los módulos
                Object.entries(modulosRegistrados).forEach(([nombre, config]) => {
                    if (config.onSyncForced && typeof config.onSyncForced === 'function') {
                        try {
                            config.onSyncForced();
                        } catch (error) {
                            console.error(`Error en callback onSyncForced del módulo ${nombre}:`, error);
                        }
                    }
                });
                
                return true;
            })
            .catch(error => {
                console.error("Error en sincronización forzada:", error);
                return false;
            });
    }
    
    /**
     * Comprueba el estado de la conexión
     * @returns {boolean} Estado de la conexión
     */
    function estaConectado() {
        return socket && socket.connected;
    }
    
    /**
     * Intenta reconectar manualmente al servidor
     * @returns {Promise} Promesa que se resuelve cuando se intenta la reconexión
     */
    function reconectar() {
        // Evitar múltiples intentos simultáneos
        const ahora = Date.now();
        if (ahora - ultimoReintento < INTERVALO_REINTENTO) {
            return Promise.reject(new Error("Demasiados intentos en poco tiempo"));
        }
        
        ultimoReintento = ahora;
        
        if (!socket) {
            return Promise.reject(new Error("No hay socket disponible"));
        }
        
        console.log("Intentando reconectar manualmente...");
        
        // Si ya está conectado, no hacer nada
        if (socket.connected) {
            console.log("Ya estamos conectados");
            actualizarEstadoConexionUI(true);
            return Promise.resolve(true);
        }
        
        return new Promise((resolve) => {
            // Evento temporal para detectar conexión
            const onConnect = () => {
                socket.off('connect', onConnect);
                console.log("Reconexión manual exitosa");
                actualizarEstadoConexionUI(true);
                resolve(true);
            };
            
            // Registrar evento temporal
            socket.once('connect', onConnect);
            
            // Intentar reconectar
            socket.connect();
            
            // Si no se conecta en 10 segundos, rechazar
            setTimeout(() => {
                if (!socket.connected) {
                    socket.off('connect', onConnect);
                    console.log("Timeout en reconexión manual");
                    resolve(false);
                }
            }, 10000);
        });
    }
    
    /**
     * Obtiene información sobre la conexión actual
     * @returns {Object} Información detallada sobre la conexión
     */
    function obtenerInfoConexion() {
        return {
            conectado: socket ? socket.connected : false,
            socketId: socket ? socket.id : null,
            ultimaConexion: socket && socket.connected ? new Date() : null,
            ultimoReintento: ultimoReintento ? new Date(ultimoReintento) : null,
            servidor: obtenerServerURL(),
            operacion: operacionActual,
            usuario: usuarioInfo ? usuarioInfo.id : null,
            elemento: elementoTrabajo ? elementoTrabajo.id : null,
            mensajesPendientes: colaPendiente.mensajes.length,
            informesPendientes: colaPendiente.informes.length,
            posicionesPendientes: colaPendiente.posiciones.length
        };
    }
    
    // API Pública del módulo
    return {
        // Inicialización y configuración
        inicializar: inicializar,
        forzarSincronizacion: forzarSincronizacion,
        reconectar: reconectar,
        estaConectado: estaConectado,
        enviarPendientes: enviarPendientes,
        
        // Registro de módulos y eventos
        registrarModulo: registrarModulo,
        desregistrarModulo: desregistrarModulo,
        registrarEvento: registrarEvento,
        desregistrarEvento: desregistrarEvento,
        
        // Envío de datos
        enviarEvento: enviarEvento,
        enviarPosicion: enviarPosicion,
        solicitarElementos: solicitarElementos,
        
        // Heartbeat para mantener conexión
        enviarHeartbeat: enviarHeartbeat,
        iniciarHeartbeatPeriodico: iniciarHeartbeatPeriodico,
        
        // Información y diagnóstico
        obtenerInfoConexion: obtenerInfoConexion,
        obtenerSocket: function() { return socket; },
        
        // Compatibilidad con versiones anteriores
        getSocket: function() { return socket; },
        actualizarEstadoConexionUI: actualizarEstadoConexionUI
    };
})();

// Registro global para compatibilidad
window.MAIRA.ComunicacionGB = window.MAIRA.ComunicacionGB || MAIRA.ComunicacionGB;