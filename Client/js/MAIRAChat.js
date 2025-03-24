/**
 * MAIRAchat.js - Módulo unificado de chat para MAIRA
 * 
 * Este módulo proporciona una interfaz de chat consistente y reutilizable
 * para todos los contextos dentro de la aplicación MAIRA.
 * 
 * @version 1.0.0
 * @author MAIRA Team
 */

// Define el módulo como objeto global
window.MAIRAchat = (function() {
    // Variables privadas
    let socket = null;
    let contenedor = null;
    let config = {
        modulo: 'general',       // Módulo actual (juegoguerra, gestionbatalla, etc.)
        minimizado: false,       // Estado inicial
        posicion: 'derecha',     // Posición en pantalla (derecha, izquierda)
        salas: ['general'],      // Salas disponibles
        salaActual: 'general',   // Sala seleccionada
        usuario: null,           // Información del usuario
        modoPrivado: false,      // Modo de chat privado
        mensajesPorPagina: 50,   // Cantidad de mensajes a cargar
        autoScroll: true,        // Scroll automático al recibir mensajes
        notificaciones: true,    // Notificaciones de escritorio
        persistencia: true,      // Guardar mensajes en localStorage
        tema: 'oscuro'           // Tema visual (oscuro, claro)
    };
    
    // Colecciones para gestión de mensajes y usuarios
    let mensajes = new Set();        // Mensajes enviados (para evitar duplicados)
    let mensajesRecibidos = new Set(); // Mensajes recibidos (para evitar duplicados)
    let mensajesPendientes = [];     // Cola para mensajes sin conexión
    let destinatarios = [];          // Lista de posibles destinatarios
    
    /**
     * Inicializa el módulo de chat
     * @param {Object} opciones - Opciones de configuración
     * @returns {Promise} - Promesa que se resuelve cuando el chat está listo
     */
    async function inicializar(opciones = {}) {
        console.log('Inicializando MAIRAchat...');
        
        try {
            // Combinar configuración por defecto con opciones proporcionadas
            config = { ...config, ...opciones };
            
            // Validar configuración mínima
            if (!config.socket && !window.socket) {
                throw new Error('Se requiere una conexión socket para el chat');
            }
            
            // Asignar socket
            socket = config.socket || window.socket;
            
            // Crear estructura de chat
            await crearEstructura();
            
            // Configurar eventos
            configurarEventos();
            
            // Configurar comunicación con el servidor
            configurarSocket();
            
            // Unirse a las salas correspondientes
            unirseASalas();
            
            // Cargar mensajes antiguos si hay persistencia
            if (config.persistencia) {
                cargarMensajesGuardados();
            }
            
            console.log('MAIRAchat inicializado correctamente');
            return true;
        } catch (error) {
            console.error('Error al inicializar MAIRAchat:', error);
            mostrarError('Error al inicializar el chat: ' + error.message);
            return false;
        }
    }
    /**
     * Crea la estructura HTML del chat
     * @returns {Promise} - Promesa que se resuelve cuando la estructura está lista
     */
    async function crearEstructura() {
        return new Promise((resolve) => {
            // Verificar si el chat ya existe
            const chatExistente = document.getElementById('maira-chat-container');
            if (chatExistente) {
                chatExistente.remove();
            }
            
            // Crear contenedor principal
            contenedor = document.createElement('div');
            contenedor.id = 'maira-chat-container';
            contenedor.className = `maira-chat ${config.modulo} ${config.minimizado ? 'minimizado' : ''} tema-${config.tema} posicion-${config.posicion}`;
            
            // Generar HTML interno
            contenedor.innerHTML = `
                <div class="chat-header">
                    <div class="chat-title">
                        <i class="fas fa-comments"></i>
                        <span>Chat</span>
                    </div>
                    <div class="chat-controls">
                        <button class="btn-minimizar" title="${config.minimizado ? 'Expandir' : 'Minimizar'}">
                            ${config.minimizado ? '<i class="fas fa-chevron-up"></i>' : '<i class="fas fa-chevron-down"></i>'}
                        </button>
                    </div>
                </div>
                <div class="chat-body">
                    <div class="chat-messages" id="chat-messages"></div>
                    <div class="chat-input-area">
                        <div class="chat-destinatario ${!config.modoPrivado ? 'oculto' : ''}">
                            <select id="chat-destinatario">
                                <option value="">Seleccionar destinatario...</option>
                            </select>
                        </div>
                        <div class="chat-controles-mensaje">
                            <div class="chat-selector-sala">
                                <select id="chat-sala">
                                    ${generarOpcionesSala()}
                                </select>
                            </div>
                            <input type="text" id="chat-mensaje" placeholder="Escribe un mensaje..." class="chat-textbox">
                            <button class="btn-enviar" title="Enviar">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div class="chat-opciones">
                            <button id="btn-modo-privado" class="${config.modoPrivado ? 'activo' : ''}" title="Modo privado">
                                <i class="fas fa-user-secret"></i>
                            </button>
                            <button id="btn-notificaciones" class="${config.notificaciones ? 'activo' : ''}" title="Notificaciones">
                                <i class="fas fa-bell"></i>
                            </button>
                            <button id="btn-limpiar" title="Limpiar chat">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Añadir estilos CSS
            agregarEstilos();
            
            // Añadir al DOM
            document.body.appendChild(contenedor);
            
            // Simular pequeño retraso para efectos visuales
            setTimeout(() => {
                if (!config.minimizado) {
                    contenedor.classList.add('show');
                }
                resolve();
            }, 100);
        });
    }
    
    /**
     * Genera las opciones para el selector de salas
     * @returns {string} - HTML con las opciones
     */
    function generarOpcionesSala() {
        if (!config.salas || config.salas.length === 0) {
            return '<option value="general">General</option>';
        }
        
        return config.salas.map(sala => {
            const selected = sala === config.salaActual ? 'selected' : '';
            let nombreSala = sala;
            
            // Formatear nombre para mejor visualización
            if (sala.startsWith('equipo_')) {
                nombreSala = 'Equipo ' + sala.replace('equipo_', '');
            } else if (sala === 'general') {
                nombreSala = 'General';
            }
            
            return `<option value="${sala}" ${selected}>${nombreSala}</option>`;
        }).join('');
    }
    
    /**
     * Añade los estilos CSS necesarios para el chat
     */
    function agregarEstilos() {
        // Comprobar si los estilos ya existen
        if (document.getElementById('maira-chat-styles')) {
            return;
        }
        
        const estilosCSS = `
            /* Estilos para MAIRAchat */
            #maira-chat-container {
                position: fixed;
                bottom: 0;
                z-index: 9999;
                width: 320px;
                background-color: rgba(25, 30, 35, 0.95);
                border-radius: 8px 8px 0 0;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                font-family: 'Arial', sans-serif;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(2, 129, 168, 0.4);
                opacity: 0;
                transform: translateY(20px);
            }
            
            #maira-chat-container.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            #maira-chat-container.posicion-derecha {
                right: 20px;
            }
            
            #maira-chat-container.posicion-izquierda {
                left: 20px;
            }
            
            /* Header del chat */
            .chat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: linear-gradient(135deg, #0281a8 0%, #026d8f 100%);
                color: white;
                cursor: pointer;
                border-radius: 8px 8px 0 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .chat-title {
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .chat-controls button {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 14px;
                opacity: 0.8;
                transition: all 0.2s;
            }
            
            .chat-controls button:hover {
                opacity: 1;
            }
            
            /* Cuerpo del chat */
            .chat-body {
                display: flex;
                flex-direction: column;
                height: 100%;
                transition: all 0.3s ease;
            }
            
            .minimizado .chat-body {
                display: none;
            }
            
            /* Área de mensajes */
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-height: 200px;
                max-height: 350px;
                background-color: rgba(15, 20, 25, 0.9);
            }
            
            /* Estilos para mensajes */
            .mensaje {
                padding: 8px 12px;
                border-radius: 8px;
                max-width: 85%;
                word-break: break-word;
                font-size: 0.9em;
                line-height: 1.4;
                position: relative;
                animation: fadeIn 0.2s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .mensaje-emisor {
                font-weight: bold;
                color: #0281a8;
                margin-bottom: 3px;
                font-size: 0.85em;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .mensaje-hora {
                font-size: 0.75em;
                opacity: 0.7;
                font-weight: normal;
            }
            
            .mensaje-contenido {
                color: #e0e0e0;
            }
            
            .mensaje-estado {
                font-size: 0.7em;
                text-align: right;
                margin-top: 2px;
                font-style: italic;
            }
            
            .mensaje.enviado {
                background-color: rgba(2, 129, 168, 0.2);
                border-left: 3px solid #0281a8;
                align-self: flex-end;
            }
            
            .mensaje.recibido {
                background-color: rgba(255, 255, 255, 0.05);
                border-left: 3px solid rgba(255, 255, 255, 0.2);
                align-self: flex-start;
            }
            
            .mensaje.sistema {
                background-color: rgba(255, 152, 0, 0.1);
                border-left: 3px solid #ff9800;
                width: 90%;
                align-self: center;
                font-style: italic;
                text-align: center;
            }
            
            .mensaje.privado {
                background-color: rgba(128, 0, 128, 0.2);
                border-left: 3px solid #800080;
            }
            
            .mensaje.error {
                background-color: rgba(220, 53, 69, 0.2);
                border-left: 3px solid #dc3545;
                color: #ff6b6b;
                width: 90%;
                align-self: center;
            }
            
            .estado-enviando { color: #FFA000; }
            .estado-enviado { color: #4CAF50; }
            .estado-error { color: #f44336; }
            .estado-pendiente { color: #9E9E9E; }
            
            /* Área de entrada de mensaje */
            .chat-input-area {
                padding: 10px;
                background-color: rgba(20, 25, 30, 0.9);
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .chat-controles-mensaje {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .chat-selector-sala {
                width: 100px;
                flex-shrink: 0;
            }
            
            .chat-selector-sala select,
            .chat-destinatario select {
                width: 100%;
                padding: 6px;
                border: 1px solid rgba(2, 129, 168, 0.3);
                border-radius: 4px;
                background-color: rgba(255, 255, 255, 0.05);
                color: #e0e0e0;
                font-size: 0.85em;
                appearance: none;
                background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
                background-repeat: no-repeat;
                background-position: right 5px center;
                padding-right: 25px;
            }
            
            .chat-textbox {
                flex-grow: 1;
                padding: 8px 12px;
                border: 1px solid rgba(2, 129, 168, 0.3);
                border-radius: 20px;
                background-color: rgba(255, 255, 255, 0.05);
                color: #ffffff;
                transition: all 0.3s ease;
                outline: none;
            }
            
            .chat-textbox:focus {
                background-color: rgba(255, 255, 255, 0.1);
                border-color: #0281a8;
                box-shadow: 0 0 8px rgba(2, 129, 168, 0.3);
            }
            
            .btn-enviar {
                width: 36px;
                height: 36px;
                min-width: 36px;
                background: linear-gradient(135deg, #0281a8 0%, #026d8f 100%);
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .btn-enviar:hover {
                transform: translateY(-2px);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
            }
            
            .btn-enviar:active {
                transform: translateY(1px);
            }
            
            /* Opciones del chat */
            .chat-opciones {
                display: flex;
                justify-content: space-between;
                padding: 0 5px;
            }
            
            .chat-opciones button {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                font-size: 14px;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .chat-opciones button:hover {
                color: white;
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .chat-opciones button.activo {
                color: #0281a8;
            }
            
            /* Destinatario (para chat privado) */
            .chat-destinatario {
                margin-bottom: 6px;
            }
            
            .chat-destinatario.oculto {
                display: none;
            }
            
            /* Scrollbar personalizado */
            .chat-messages::-webkit-scrollbar {
                width: 6px;
            }
            
            .chat-messages::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 3px;
            }
            
            .chat-messages::-webkit-scrollbar-thumb {
                background: rgba(2, 129, 168, 0.5);
                border-radius: 3px;
            }
            
            .chat-messages::-webkit-scrollbar-thumb:hover {
                background: rgba(2, 129, 168, 0.7);
            }
            
            /* Variantes de temas */
            .tema-claro {
                background-color: rgba(240, 245, 250, 0.95);
                border-color: rgba(2, 129, 168, 0.3);
            }
            
            .tema-claro .chat-messages {
                background-color: rgba(230, 235, 240, 0.9);
            }
            
            .tema-claro .chat-input-area {
                background-color: rgba(220, 225, 230, 0.9);
            }
            
            .tema-claro .mensaje-contenido {
                color: #333;
            }
            
            .tema-claro .mensaje.enviado {
                background-color: rgba(2, 129, 168, 0.1);
            }
            
            .tema-claro .mensaje.recibido {
                background-color: rgba(255, 255, 255, 0.5);
                border-left-color: rgba(0, 0, 0, 0.2);
            }
            
            .tema-claro .chat-textbox {
                background-color: rgba(255, 255, 255, 0.5);
                color: #333;
            }
            
            .tema-claro .chat-selector-sala select,
            .tema-claro .chat-destinatario select {
                background-color: rgba(255, 255, 255, 0.5);
                color: #333;
                background-image: url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
            }
            
            /* Responsive */
            @media (max-width: 480px) {
                #maira-chat-container {
                    width: 290px;
                    right: 10px;
                }
                
                .chat-selector-sala {
                    width: 80px;
                }
                
                .btn-enviar {
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                }
            }
        `;
        
        const estilosElement = document.createElement('style');
        estilosElement.id = 'maira-chat-styles';
        estilosElement.textContent = estilosCSS;
        document.head.appendChild(estilosElement);
    }
    /**
     * Configura los eventos de la interfaz
     */
    function configurarEventos() {
        if (!contenedor) return;
        
        // Referencias a elementos
        const header = contenedor.querySelector('.chat-header');
        const btnMinimizar = contenedor.querySelector('.btn-minimizar');
        const inputMensaje = contenedor.querySelector('#chat-mensaje');
        const btnEnviar = contenedor.querySelector('.btn-enviar');
        const selectorSala = contenedor.querySelector('#chat-sala');
        const btnModoPrivado = contenedor.querySelector('#btn-modo-privado');
        const btnNotificaciones = contenedor.querySelector('#btn-notificaciones');
        const btnLimpiar = contenedor.querySelector('#btn-limpiar');
        const selectorDestinatario = contenedor.querySelector('#chat-destinatario');
        
        // Minimizar/maximizar chat
        header.addEventListener('click', (e) => {
            if (e.target === btnMinimizar || e.target.parentElement === btnMinimizar) return;
            toggleMinimizar();
        });
        
        btnMinimizar.addEventListener('click', toggleMinimizar);
        
        // Enviar mensaje
        const enviarMensaje = () => {
            const texto = inputMensaje.value.trim();
            if (!texto) return;
            
            const tipo = config.modoPrivado ? 'privado' : 'normal';
            const sala = selectorSala.value;
            const destinatario = config.modoPrivado ? selectorDestinatario.value : null;
            
            if (config.modoPrivado && !destinatario) {
                mostrarError('Selecciona un destinatario para enviar un mensaje privado');
                return;
            }
            
            enviarMensajeChat(texto, tipo, sala, destinatario);
            inputMensaje.value = '';
            inputMensaje.focus();
        };
        
        btnEnviar.addEventListener('click', enviarMensaje);
        inputMensaje.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                enviarMensaje();
            }
        });
        
        // Cambio de sala
        selectorSala.addEventListener('change', (e) => {
            cambiarSala(e.target.value);
        });
        
        // Modo privado
        btnModoPrivado.addEventListener('click', () => {
            toggleModoPrivado();
            btnModoPrivado.classList.toggle('activo', config.modoPrivado);
            contenedor.querySelector('.chat-destinatario').classList.toggle('oculto', !config.modoPrivado);
        });
        
        // Notificaciones
        btnNotificaciones.addEventListener('click', () => {
            toggleNotificaciones();
            btnNotificaciones.classList.toggle('activo', config.notificaciones);
        });
        
        // Limpiar chat
        btnLimpiar.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas limpiar el historial del chat?')) {
                limpiarChat();
            }
        });
    }
    
    /**
     * Configura los eventos del socket
     */
    function configurarSocket() {
        if (!socket) return;
        
        // Compatibilidad con otros eventos de mensajes en distintos módulos
        socket.on('mensajeJuego', recibirMensaje);
        socket.on('nuevoMensaje', recibirMensaje);
        
        // Reconexión
        socket.on('connect', () => {
            mostrarMensajeSistema('Conexión restablecida');
            
            // Solicitar mensajes recientes
            if (config.salaActual) {
                socket.emit('obtenerMensajesRecientes', { sala: config.salaActual, cantidad: config.mensajesPorPagina });
            }
            
            // Enviar mensajes pendientes
            enviarMensajesPendientes();
        });
        
        // Desconexión
        socket.on('disconnect', () => {
            mostrarMensajeSistema('Conexión perdida. Intentando reconectar...');
        });
        
        // Unirse a sala (confirmación)
        socket.on('salaActualizada', (data) => {
            console.log('Sala actualizada:', data);
            if (data && data.sala) {
                config.salaActual = data.sala;
                
                // Actualizar interfaz
                const selector = contenedor.querySelector('#chat-sala');
                if (selector) {
                    selector.value = data.sala;
                }
            }
        });
        
        // Actualización de usuarios
        socket.on('usuariosConectados', (data) => {
            actualizarDestinatarios(data);
        });
        
        // Historial de mensajes
        socket.on('historialChat', (data) => {
            if (data && Array.isArray(data.mensajes)) {
                data.mensajes.forEach(mensaje => {
                    mostrarMensaje(mensaje, true); // true indica que es mensaje histórico
                });
            }
        });
    }
    
    /**
     * Se une a las salas configuradas
     */
    function unirseASalas() {
        if (!socket || !socket.connected) return;
        
        // Unirse a la sala principal según el módulo
        if (config.modulo === 'juegoguerra') {
            // Obtener el código de la partida
            const codigoPartida = config.partidaId || window.codigoPartida || window.partidaActual?.codigo;
            if (codigoPartida) {
                socket.emit('joinRoom', codigoPartida);
                
                // Si hay equipo, unirse a la sala del equipo
                if (config.equipo || window.equipoJugador) {
                    const equipo = config.equipo || window.equipoJugador;
                    socket.emit('joinRoom', `equipo_${equipo}`);
                }
            }
        } else if (config.modulo === 'gestionbatalla') {
            // Unirse a la sala de la operación
            const operacion = config.operacion || window.operacionActual;
            if (operacion) {
                socket.emit('joinRoom', operacion);
            }
        } else if (config.modulo === 'partidaespera') {
            // Unirse a la sala de espera
            const codigoPartida = config.partidaId || window.codigoPartida || window.partidaActual?.codigo;
            if (codigoPartida) {
                socket.emit('joinRoom', `salaEspera_${codigoPartida}`);
            }
        } else {
            // Por defecto, unirse a sala general
            socket.emit('joinRoom', 'general');
        }
    }
    
    /**
     * Envía un mensaje al servidor
     * @param {string} texto - Contenido del mensaje
     * @param {string} tipo - Tipo de mensaje (normal, privado)
     * @param {string} sala - Sala a la que se envía
     * @param {string} destinatario - ID del destinatario (para mensajes privados)
     */
    function enviarMensajeChat(texto, tipo = 'normal', sala = null, destinatario = null) {
        if (!texto) return;
        
        // Usar sala actual si no se especifica
        const salaDestino = sala || config.salaActual;
        
        // Generar ID único para el mensaje
        const mensajeId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Crear objeto de mensaje
        const mensaje = {
            id: mensajeId,
            contenido: texto,
            tipo: tipo,
            sala: salaDestino,
            timestamp: new Date().toISOString(),
            emisor: config.usuario?.usuario || 'Usuario',
            emisorId: config.usuario?.id,
            privado: tipo === 'privado',
            destinatario: destinatario,
            estado: 'enviando'
        };
        
        // Registrar mensaje para evitar duplicados
        mensajes.add(mensajeId);
        
        // Mostrar mensaje en interfaz con estado "enviando"
        mostrarMensaje({
            ...mensaje,
            emisor: 'Tú', // Cambiar emisor para diferenciar visualmente
        });
        
        // Intentar enviar al servidor
        if (socket && socket.connected) {
            // Determinar qué evento usar según el módulo
            let eventoSocket = 'mensajeChat'; // Evento por defecto
            
            if (config.modulo === 'juegoguerra') {
                eventoSocket = 'mensajeJuego';
                mensaje.partidaCodigo = config.partidaId || window.codigoPartida;
                mensaje.equipo = config.equipo || window.equipoJugador;
            } else if (config.modulo === 'gestionbatalla') {
                mensaje.operacion = config.operacion || window.operacionActual;
            }
            
            // Enviar mensaje al servidor
            socket.emit(eventoSocket, mensaje);
            
            // Establecer timeout para actualizar estado si no recibimos confirmación
            setTimeout(() => {
                const elementoMensaje = document.querySelector(`#msg-${mensajeId}`);
                if (elementoMensaje) {
                    const estadoElement = elementoMensaje.querySelector('.mensaje-estado');
                    if (estadoElement && estadoElement.textContent === 'enviando') {
                        estadoElement.textContent = 'error';
                        estadoElement.className = 'mensaje-estado estado-error';
                    }
                }
            }, 5000);
        } else {
            // Guardar mensaje para enviar cuando se recupere la conexión
            mensaje.estado = 'pendiente';
            mensajesPendientes.push(mensaje);
            
            // Actualizar estado en la interfaz
            actualizarEstadoMensaje(mensajeId, 'pendiente');
            
            // Mostrar mensaje de error
            mostrarMensajeSistema('Mensaje guardado. Se enviará cuando se restablezca la conexión.');
        }
        
        // Guardar en localStorage si la persistencia está activada
        if (config.persistencia) {
            guardarMensajeLocal(mensaje);
        }
        
        return mensajeId;
    }
    
    /**
     * Envía los mensajes pendientes cuando se recupera la conexión
     */
    function enviarMensajesPendientes() {
        if (!socket || !socket.connected || mensajesPendientes.length === 0) return;
        
        console.log(`Intentando enviar ${mensajesPendientes.length} mensajes pendientes`);
        mostrarMensajeSistema(`Enviando ${mensajesPendientes.length} mensajes pendientes...`);
        
        // Crear una copia de la lista para iterar
        const pendientes = [...mensajesPendientes];
        mensajesPendientes = [];
        
        // Enviar cada mensaje pendiente
        let enviados = 0;
        pendientes.forEach(mensaje => {
            // Actualizar timestamp
            mensaje.timestamp = new Date().toISOString();
            mensaje.estado = 'enviando';
            
            // Determinar qué evento usar según el módulo
            let eventoSocket = 'mensajeChat';
            
            if (config.modulo === 'juegoguerra') {
                eventoSocket = 'mensajeJuego';
            }
            
            // Enviar mensaje
            socket.emit(eventoSocket, mensaje);
            
            // Actualizar estado en la interfaz
            actualizarEstadoMensaje(mensaje.id, 'enviando');
            enviados++;
        });
        
        if (enviados > 0) {
            mostrarMensajeSistema(`Se enviaron ${enviados} mensajes pendientes`);
        }
    }
    /**
     * Recibe un mensaje del servidor
     * @param {Object} mensaje - Mensaje recibido
     */
    function recibirMensaje(mensaje) {
        if (!mensaje) return;
        
        try {
            console.log('Mensaje recibido:', mensaje);
            
            // Verificar si ya se mostró este mensaje (evitar duplicados)
            if (mensaje.id && mensajesRecibidos.has(mensaje.id)) {
                // Puede ser mensaje propio con actualización de estado
                if ((mensaje.emisor === 'Tú' || mensaje.emisor === config.usuario?.usuario) && mensaje.estado) {
                    actualizarEstadoMensaje(mensaje.id, mensaje.estado);
                }
                return;
            }
            
            // Normalizar el formato del mensaje (para compatibilidad entre módulos)
            const mensajeNormalizado = normalizarMensaje(mensaje);
            
            // Registrar ID para evitar duplicados
            if (mensajeNormalizado.id) {
                mensajesRecibidos.add(mensajeNormalizado.id);
            }
            
            // Determinar si es un mensaje propio
            const esPropio = esEmisorPropio(mensajeNormalizado.emisor, mensajeNormalizado.emisorId);
            
            // Actualizar estado si es mensaje propio
            if (esPropio && mensajes.has(mensajeNormalizado.id)) {
                actualizarEstadoMensaje(mensajeNormalizado.id, 'enviado');
                return; // No mostrar duplicado
            }
            
            // Verificar si el mensaje pertenece a la sala actual
            if (!perteneceASalaActual(mensajeNormalizado)) {
                // Guardar en localStorage pero no mostrar
                if (config.persistencia) {
                    guardarMensajeLocal(mensajeNormalizado);
                }
                return;
            }
            
            // Mostrar el mensaje
            mostrarMensaje(mensajeNormalizado);
            
            // Reproducir sonido de notificación si está minimizado o es privado
            if ((config.minimizado || mensajeNormalizado.tipo === 'privado') && !esPropio) {
                reproducirSonidoNotificacion();
                
                // Mostrar notificación del navegador si está habilitado
                if (config.notificaciones) {
                    mostrarNotificacionEscritorio(mensajeNormalizado);
                }
            }
            
            // Guardar mensaje en localStorage si la persistencia está activada
            if (config.persistencia) {
                guardarMensajeLocal(mensajeNormalizado);
            }
        } catch (error) {
            console.error('Error al procesar mensaje recibido:', error);
        }
    }
    
    /**
     * Normaliza el formato de un mensaje para compatibilidad entre módulos
     * @param {Object} mensaje - Mensaje a normalizar
     * @returns {Object} - Mensaje normalizado
     */
    function normalizarMensaje(mensaje) {
        // Crear objeto base con propiedades comunes
        const normalizado = {
            id: mensaje.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            tipo: mensaje.tipo || 'normal',
            sala: mensaje.sala || config.salaActual,
            timestamp: mensaje.timestamp || new Date().toISOString(),
            estado: mensaje.estado || 'recibido'
        };
        
        // Normalizar emisor (múltiples formatos)
        if (typeof mensaje.emisor === 'object' && mensaje.emisor !== null) {
            normalizado.emisorId = mensaje.emisor.id;
            normalizado.emisor = mensaje.emisor.nombre || mensaje.emisor.usuario || 'Desconocido';
        } else {
            normalizado.emisor = mensaje.emisor || mensaje.usuario || 'Desconocido';
            normalizado.emisorId = mensaje.emisorId || mensaje.idUsuario;
        }
        
        // Normalizar contenido (múltiples propiedades)
        normalizado.contenido = mensaje.contenido || mensaje.mensaje || mensaje.texto || '';
        
        // Normalizar propiedades de privado/destinatario
        normalizado.privado = mensaje.privado || mensaje.tipo === 'privado';
        normalizado.destinatario = mensaje.destinatario;
        
        // Propiedades específicas por módulo
        if (mensaje.partidaCodigo) normalizado.partidaCodigo = mensaje.partidaCodigo;
        if (mensaje.equipo) normalizado.equipo = mensaje.equipo;
        if (mensaje.operacion) normalizado.operacion = mensaje.operacion;
        
        return normalizado;
    }
    
    /**
     * Verifica si el emisor del mensaje es el usuario actual
     * @param {string} emisor - Nombre del emisor
     * @param {string} emisorId - ID del emisor
     * @returns {boolean} - Verdadero si el emisor es el usuario actual
     */
    function esEmisorPropio(emisor, emisorId) {
        if (!config.usuario) return false;
        
        // Verificar por ID (más confiable)
        if (emisorId && config.usuario.id && emisorId === config.usuario.id) {
            return true;
        }
        
        // Verificar por nombre (menos confiable)
        if (emisor === config.usuario.usuario || emisor === 'Tú') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Verifica si un mensaje pertenece a la sala actual o es relevante
     * @param {Object} mensaje - Mensaje a verificar
     * @returns {boolean} - Verdadero si pertenece a la sala actual
     */
    function perteneceASalaActual(mensaje) {
        // Los mensajes del sistema siempre se muestran
        if (mensaje.tipo === 'sistema') return true;
        
        // Mensajes privados se muestran si somos emisor o destinatario
        if (mensaje.privado && mensaje.destinatario) {
            const soyEmisor = esEmisorPropio(mensaje.emisor, mensaje.emisorId);
            const soyDestinatario = config.usuario && config.usuario.id === mensaje.destinatario;
            return soyEmisor || soyDestinatario;
        }
        
        // Verificar sala
        if (mensaje.sala) {
            return mensaje.sala === config.salaActual;
        }
        
        // Si no hay criterios claros, mostrar por defecto
        return true;
    }
    
    /**
     * Muestra un mensaje en la interfaz
     * @param {Object} mensaje - Mensaje a mostrar
     * @param {boolean} esHistorico - Indica si es un mensaje histórico
     */
    function mostrarMensaje(mensaje, esHistorico = false) {
        // Obtener el contenedor de mensajes
        const chatMessages = contenedor.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        // Crear elemento de mensaje
        const mensajeElement = document.createElement('div');
        mensajeElement.className = `mensaje ${determinarClaseMensaje(mensaje)}`;
        
        if (mensaje.id) {
            mensajeElement.id = `msg-${mensaje.id}`;
        }
        
        // Determinar si debe mostrar información de emisor
        const mostrarEmisor = mensaje.tipo !== 'sistema' && mensaje.tipo !== 'error';
        
        // Formatear fecha para mostrar
        const hora = formatearFecha(mensaje.timestamp);
        
        // Escapar contenido para prevenir XSS
        const contenidoSeguro = escapeHTML(mensaje.contenido);
        
        // Contenido HTML del mensaje según su tipo
        if (mensaje.tipo === 'sistema' || mensaje.tipo === 'error') {
            mensajeElement.innerHTML = `
                <div class="mensaje-contenido">${contenidoSeguro}</div>
            `;
        } else {
            mensajeElement.innerHTML = `
                ${mostrarEmisor ? `
                <div class="mensaje-emisor">
                    <span>${mensaje.emisor}</span>
                    <span class="mensaje-hora">${hora}</span>
                </div>` : ''}
                <div class="mensaje-contenido">${formatearTextoMensaje(contenidoSeguro)}</div>
                ${mensaje.estado ? `<div class="mensaje-estado estado-${mensaje.estado}">${mensaje.estado}</div>` : ''}
            `;
        }
        
        // Determinar posición para insertar (históricos al principio, nuevos al final)
        if (esHistorico) {
            chatMessages.prepend(mensajeElement);
        } else {
            chatMessages.appendChild(mensajeElement);
            
            // Scroll al final solo para mensajes nuevos
            if (config.autoScroll) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    }
    
    /**
     * Determina la clase CSS para un mensaje según su tipo
     * @param {Object} mensaje - Mensaje a clasificar
     * @returns {string} - Clase CSS
     */
    function determinarClaseMensaje(mensaje) {
        if (mensaje.tipo === 'sistema') return 'sistema';
        if (mensaje.tipo === 'error') return 'error';
        if (mensaje.privado) return 'privado';
        if (mensaje.emisor === 'Tú' || esEmisorPropio(mensaje.emisor, mensaje.emisorId)) return 'enviado';
        return 'recibido';
    }
    
    /**
     * Actualiza el estado de un mensaje
     * @param {string} mensajeId - ID del mensaje
     * @param {string} estado - Nuevo estado
     */
    function actualizarEstadoMensaje(mensajeId, estado) {
        const elementoMensaje = document.querySelector(`#msg-${mensajeId}`);
        if (!elementoMensaje) return;
        
        let estadoElement = elementoMensaje.querySelector('.mensaje-estado');
        
        if (estadoElement) {
            estadoElement.textContent = estado;
            estadoElement.className = `mensaje-estado estado-${estado}`;
        } else {
            // Crear elemento de estado si no existe
            estadoElement = document.createElement('div');
            estadoElement.className = `mensaje-estado estado-${estado}`;
            estadoElement.textContent = estado;
            elementoMensaje.appendChild(estadoElement);
        }
    }
    
    /**
     * Formatea un texto de mensaje para mostrar enlaces clicables
     * @param {string} texto - Texto a formatear
     * @returns {string} - Texto formateado
     */
    function formatearTextoMensaje(texto) {
        if (!texto) return '';
        
        // Convertir URLs en enlaces clicables
        return texto.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }
    
    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} texto - Texto a escapar
     * @returns {string} - Texto seguro
     */
    function escapeHTML(texto) {
        if (!texto) return '';
        
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
    
    /**
     * Formatea una fecha ISO a formato legible
     * @param {string} fecha - Fecha en formato ISO
     * @returns {string} - Fecha formateada
     */
    function formatearFecha(fecha) {
        if (!fecha) return '';
        
        try {
            const date = new Date(fecha);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.warn('Error al formatear fecha:', error);
            return '';
        }
    }
    
    /**
     * Muestra un mensaje del sistema
     * @param {string} texto - Texto del mensaje
     */
    function mostrarMensajeSistema(texto) {
        mostrarMensaje({
            tipo: 'sistema',
            contenido: texto,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} texto - Texto del error
     */
    function mostrarError(texto) {
        mostrarMensaje({
            tipo: 'error',
            contenido: texto,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Reproduce un sonido de notificación
     */
    function reproducirSonidoNotificacion() {
        try {
            // Intentar usar sonido personalizado
            const audio = new Audio('/Client/audio/notification.mp3');
            
            // Si falla, usar un sonido alternativo
            audio.onerror = () => {
                const backupAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAkJCQkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg4ODg4ODg//////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAUHg//MvRkAAAAAAAAAAAAAAAAAAAAAQOkDQAAAAAAAAAGwj/9hcwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABhpQ0NQIENQTCBnZW5lcmF0ZWQgYnkgbmV3bWF0cm9za2EuY29tAP/jOMAAAAAAAAAAAABJbmZvAAAADwAAAAMAAAGwAJCQkJCQkJCQkJCQkJCQkJCQkMDAwMDAwMDAwMDAwMDAwMDAwODg4ODg4ODg4ODg4ODg4ODg4P//////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQFB4P/zL0ZAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAALCP/2FzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jOMAAAAAAAAAAAABJbmZvAAAADwAAAAMAAAGwAJCQkJCQkJCQkJCQkJCQkJCQkMDAwMDAwMDAwMDAwMDAwMDAwODg4ODg4ODg4ODg4ODg4ODg4P//////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQFB4P/zL0ZAAAAAAAAAAAAAAAAAAAAAE17cEkAAAAAAAAAAFc1VFeg/+MYxAAAAABSqgAAAAdJbnRlcmx1ZGUATGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+MYxBYAAAKaVsAAAABJbnRlcmx1ZGUAVGFnZ2VkIGJ5IG5ld21hdHJvc2thLmNvbQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
                backupAudio.play().catch(e => console.warn('Error al reproducir sonido de backup:', e));
            };
            
            // Reproducir
            audio.play().catch(e => console.warn('Error al reproducir sonido:', e));
        } catch (error) {
            console.warn('Error al reproducir sonido de notificación:', error);
        }
    }
    
    /**
     * Muestra una notificación del navegador
     * @param {Object} mensaje - Mensaje a notificar
     */
    function mostrarNotificacionEscritorio(mensaje) {
        if (!config.notificaciones || !("Notification" in window)) return;
        
        const titulo = mensaje.privado ? 
            `Mensaje privado de ${mensaje.emisor}` : 
            `Nuevo mensaje de ${mensaje.emisor}`;
            
        // Verificar permisos
        if (Notification.permission === "granted") {
            crearNotificacion(titulo, mensaje.contenido);
        } 
        // Solicitar permisos si no se han pedido antes
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    crearNotificacion(titulo, mensaje.contenido);
                }
            });
        }
    }
    
    /**
     * Crea una notificación del navegador
     * @param {string} titulo - Título de la notificación
     * @param {string} cuerpo - Cuerpo del mensaje
     */
    function crearNotificacion(titulo, cuerpo) {
        try {
            const notification = new Notification(titulo, {
                body: cuerpo,
                icon: '/Client/image/favicon_logoai/favicon-32x32.png'
            });
            
            // Cerrar automáticamente después de 5 segundos
            setTimeout(() => notification.close(), 5000);
            
            // Al hacer clic, enfocar la ventana y abrir el chat
            notification.onclick = function() {
                window.focus();
                if (config.minimizado) {
                    toggleMinimizar();
                }
            };
        } catch (error) {
            console.warn('Error al crear notificación:', error);
        }
    }
    
    /**
     * Cambia la sala actual del chat
     * @param {string} nuevaSala - Nombre de la nueva sala
     */
    function cambiarSala(nuevaSala) {
        if (!nuevaSala || nuevaSala === config.salaActual) return;
        
        // Notificar al servidor
        if (socket && socket.connected) {
            socket.emit('cambiarSala', {
                salaAnterior: config.salaActual,
                nuevaSala: nuevaSala
            });
        }
        
        // Actualizar variable local
        config.salaActual = nuevaSala;
        
        // Limpiar mensajes antiguos
        const chatMessages = contenedor.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Mostrar mensaje informativo
        mostrarMensajeSistema(`Has cambiado a la sala: ${formatearNombreSala(nuevaSala)}`);
        
        // Solicitar historial de la nueva sala
        if (socket && socket.connected) {
            socket.emit('obtenerMensajesRecientes', {
                sala: nuevaSala,
                cantidad: config.mensajesPorPagina
            });
        }
    }
    
    /**
     * Formatea el nombre de una sala para mostrar
     * @param {string} sala - Nombre de la sala
     * @returns {string} - Nombre formateado
     */
    function formatearNombreSala(sala) {
        if (!sala) return 'General';
        
        if (sala.startsWith('equipo_')) {
            return 'Equipo ' + sala.replace('equipo_', '');
        } else if (sala.startsWith('salaEspera_')) {
            return 'Sala de Espera';
        } else if (sala === 'general') {
            return 'General';
        }
        
        return sala;
    }
    
    /**
     * Actualiza la lista de destinatarios para mensajes privados
     * @param {Array} usuarios - Lista de usuarios conectados
     */
    function actualizarDestinatarios(usuarios) {
        if (!Array.isArray(usuarios)) return;
        
        destinatarios = usuarios.filter(u => 
            u.id !== config.usuario?.id && 
            u.nombre !== config.usuario?.usuario
        );
        
        // Actualizar selector en la interfaz
        const selectorDestinatario = contenedor.querySelector('#chat-destinatario');
        if (!selectorDestinatario) return;
        
        // Guardar selección actual
        const seleccionActual = selectorDestinatario.value;
        
        // Limpiar opciones actuales
        selectorDestinatario.innerHTML = '<option value="">Seleccionar destinatario...</option>';
        
        // Añadir nuevas opciones
        destinatarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.id;
            
            // Formatear nombre con información adicional si está disponible
            let nombreMostrar = usuario.nombre || usuario.usuario;
            if (usuario.operacion) {
                nombreMostrar += ` (${usuario.operacion})`;
            } else if (usuario.elemento) {
                nombreMostrar += ` (${usuario.elemento})`;
            }
            
            option.textContent = nombreMostrar;
            selectorDestinatario.appendChild(option);
        });
        
        // Restaurar selección si todavía está disponible
        if (seleccionActual) {
            selectorDestinatario.value = seleccionActual;
        }
    }
    /**
     * Guarda un mensaje en localStorage para persistencia
     * @param {Object} mensaje - Mensaje a guardar
     */
    function guardarMensajeLocal(mensaje) {
        if (!config.persistencia) return;
        
        try {
            // Obtener mensajes actuales
            const claveMensajes = `maira_chat_mensajes_${config.modulo}_${mensaje.sala}`;
            let mensajesGuardados = [];
            
            const mensajesJSON = localStorage.getItem(claveMensajes);
            if (mensajesJSON) {
                mensajesGuardados = JSON.parse(mensajesJSON);
            }
            
            // Comprobar si el mensaje ya existe
            const existe = mensajesGuardados.some(m => m.id === mensaje.id);
            if (!existe) {
                // Añadir mensaje limitando a un máximo
                mensajesGuardados.push(mensaje);
                
                // Limitar a un máximo de mensajes (los más recientes)
                if (mensajesGuardados.length > 100) {
                    mensajesGuardados = mensajesGuardados.slice(-100);
                }
                
                // Guardar en localStorage
                localStorage.setItem(claveMensajes, JSON.stringify(mensajesGuardados));
            }
        } catch (error) {
            console.warn('Error al guardar mensaje en localStorage:', error);
        }
    }
    
    /**
     * Carga mensajes guardados en localStorage
     */
    function cargarMensajesGuardados() {
        if (!config.persistencia) return;
        
        try {
            const claveMensajes = `maira_chat_mensajes_${config.modulo}_${config.salaActual}`;
            const mensajesJSON = localStorage.getItem(claveMensajes);
            
            if (!mensajesJSON) return;
            
            const mensajesGuardados = JSON.parse(mensajesJSON);
            
            // Mostrar los mensajes más recientes (limitar a 50)
            const mensajesRecientes = mensajesGuardados.slice(-50);
            
            if (mensajesRecientes.length > 0) {
                mostrarMensajeSistema(`Mostrando los últimos ${mensajesRecientes.length} mensajes guardados`);
                
                // Mostrar mensajes con un pequeño retraso para permitir que la interfaz se cargue completamente
                setTimeout(() => {
                    mensajesRecientes.forEach(mensaje => {
                        mensajesRecibidos.add(mensaje.id); // Evitar duplicados
                        mostrarMensaje(mensaje, true);
                    });
                    
                    // Scroll al final
                    const chatMessages = contenedor.querySelector('.chat-messages');
                    if (chatMessages) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }, 100);
            }
        } catch (error) {
            console.warn('Error al cargar mensajes de localStorage:', error);
        }
    }
    
    /**
     * Limpia todos los mensajes del chat
     */
    function limpiarChat() {
        // Limpiar mensajes en la interfaz
        const chatMessages = contenedor.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Limpiar mensajes guardados en localStorage
        if (config.persistencia) {
            try {
                const claveMensajes = `maira_chat_mensajes_${config.modulo}_${config.salaActual}`;
                localStorage.removeItem(claveMensajes);
            } catch (error) {
                console.warn('Error al limpiar mensajes de localStorage:', error);
            }
        }
        
        // Mostrar mensaje de confirmación
        mostrarMensajeSistema('El historial de chat ha sido limpiado');
    }
    
    /**
     * Alterna entre modo privado y normal
     */
    function toggleModoPrivado() {
        config.modoPrivado = !config.modoPrivado;
        
        // Actualizar UI
        contenedor.querySelector('.chat-destinatario').classList.toggle('oculto', !config.modoPrivado);
        
        // Guardar preferencia
        try {
            localStorage.setItem('maira_chat_modo_privado', config.modoPrivado ? 'true' : 'false');
        } catch (e) {}
        
        // Mostrar mensaje informativo
        mostrarMensajeSistema(config.modoPrivado ? 
            'Modo privado activado. Selecciona un destinatario.' : 
            'Modo privado desactivado.'
        );
    }
    
    /**
     * Alterna entre notificaciones activadas y desactivadas
     */
    function toggleNotificaciones() {
        config.notificaciones = !config.notificaciones;
        
        // Verificar permisos si se activan
        if (config.notificaciones && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
        
        // Guardar preferencia
        try {
            localStorage.setItem('maira_chat_notificaciones', config.notificaciones ? 'true' : 'false');
        } catch (e) {}
        
        // Mostrar mensaje informativo
        mostrarMensajeSistema(config.notificaciones ? 
            'Notificaciones activadas.' : 
            'Notificaciones desactivadas.'
        );
    }
    
    /**
     * Alterna entre chat minimizado y expandido
     */
    function toggleMinimizar() {
        config.minimizado = !config.minimizado;
        contenedor.classList.toggle('minimizado', config.minimizado);
        
        // Actualizar icono del botón
        const btnMinimizar = contenedor.querySelector('.btn-minimizar');
        if (btnMinimizar) {
            btnMinimizar.innerHTML = config.minimizado ? 
                '<i class="fas fa-chevron-up"></i>' : 
                '<i class="fas fa-chevron-down"></i>';
            btnMinimizar.title = config.minimizado ? 'Expandir' : 'Minimizar';
        }
        
        // Si se expande, hacer scroll al último mensaje
        if (!config.minimizado) {
            setTimeout(() => {
                const chatMessages = contenedor.querySelector('.chat-messages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 300);
            
            // Enfocar el input de texto
            const inputMensaje = contenedor.querySelector('#chat-mensaje');
            if (inputMensaje) {
                inputMensaje.focus();
            }
        }
        
        // Guardar preferencia
        try {
            localStorage.setItem('maira_chat_minimizado', config.minimizado ? 'true' : 'false');
        } catch (e) {
            console.warn('Error al guardar preferencia de minimizado:', e);
        }
    }
    
    /**
     * Cambia el tema del chat
     * @param {string} tema - Nuevo tema ('oscuro' o 'claro')
     */
    function cambiarTema(tema) {
        if (tema !== 'oscuro' && tema !== 'claro') return;
        
        config.tema = tema;
        contenedor.classList.remove('tema-oscuro', 'tema-claro');
        contenedor.classList.add(`tema-${tema}`);
        
        // Guardar preferencia
        try {
            localStorage.setItem('maira_chat_tema', tema);
        } catch (e) {
            console.warn('Error al guardar preferencia de tema:', e);
        }
        
        // Mostrar mensaje informativo
        mostrarMensajeSistema(`Tema ${tema} aplicado.`);
    }
    
    /**
     * Cambia la posición del chat en la pantalla
     * @param {string} posicion - Nueva posición ('derecha' o 'izquierda')
     */
    function cambiarPosicion(posicion) {
        if (posicion !== 'derecha' && posicion !== 'izquierda') return;
        
        config.posicion = posicion;
        contenedor.classList.remove('posicion-derecha', 'posicion-izquierda');
        contenedor.classList.add(`posicion-${posicion}`);
        
        // Guardar preferencia
        try {
            localStorage.setItem('maira_chat_posicion', posicion);
        } catch (e) {
            console.warn('Error al guardar preferencia de posición:', e);
        }
    }
    
    /**
     * Configura información del usuario
     * @param {Object} usuario - Información del usuario
     */
    function setUsuario(usuario) {
        config.usuario = usuario;
    }
    
    /**
     * Restaura las preferencias guardadas
     */
    function restaurarPreferencias() {
        try {
            // Restaurar tema
            const temaGuardado = localStorage.getItem('maira_chat_tema');
            if (temaGuardado && (temaGuardado === 'oscuro' || temaGuardado === 'claro')) {
                config.tema = temaGuardado;
            }
            
            // Restaurar posición
            const posicionGuardada = localStorage.getItem('maira_chat_posicion');
            if (posicionGuardada && (posicionGuardada === 'derecha' || posicionGuardada === 'izquierda')) {
                config.posicion = posicionGuardada;
            }
            
            // Restaurar estado minimizado
            const minimizadoGuardado = localStorage.getItem('maira_chat_minimizado');
            if (minimizadoGuardado !== null) {
                config.minimizado = minimizadoGuardado === 'true';
            }
            
            // Restaurar modo privado
            const modoPrivadoGuardado = localStorage.getItem('maira_chat_modo_privado');
            if (modoPrivadoGuardado !== null) {
                config.modoPrivado = modoPrivadoGuardado === 'true';
            }
            
            // Restaurar notificaciones
            const notificacionesGuardadas = localStorage.getItem('maira_chat_notificaciones');
            if (notificacionesGuardadas !== null) {
                config.notificaciones = notificacionesGuardadas === 'true';
            }
            
            console.log('Preferencias de chat restauradas');
        } catch (error) {
            console.warn('Error al restaurar preferencias:', error);
        }
    }
    
    /**
     * Destruye el chat y limpia recursos
     */
    function destruir() {
        // Desconectar eventos del socket
        if (socket) {
            socket.off('mensajeChat');
            socket.off('mensajeJuego');
            socket.off('nuevoMensaje');
        }
        
        // Eliminar el contenedor del DOM
        if (contenedor && contenedor.parentNode) {
            contenedor.parentNode.removeChild(contenedor);
        }
        
        // Limpiar colecciones
        mensajes.clear();
        mensajesRecibidos.clear();
        mensajesPendientes = [];
        destinatarios = [];
        
        console.log('MAIRAchat destruido');
    }
    
    // API pública del módulo
    return {
        inicializar,
        enviarMensajeChat,
        mostrarMensaje,
        mostrarMensajeSistema,
        mostrarError,
        toggleMinimizar,
        cambiarTema,
        cambiarSala,
        cambiarPosicion,
        toggleModoPrivado,
        toggleNotificaciones,
        limpiarChat,
        setUsuario,
        actualizarDestinatarios,
        destruir
    };
})();

/**
 * Inicialización automática si se proporciona un contenedor con ID 'chat'
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si existe el contenedor simple
    const chatSimple = document.getElementById('chat');
    
    if (chatSimple) {
        console.log('Contenedor de chat simple detectado');
        
        // Esperar a que el socket esté disponible
        const checkSocketInterval = setInterval(function() {
            if (window.socket) {
                clearInterval(checkSocketInterval);
                inicializarMAIRAchat(chatSimple);
            }
        }, 500);
        
        // Establecer un timeout para evitar esperar indefinidamente
        setTimeout(function() {
            clearInterval(checkSocketInterval);
            console.warn('No se pudo inicializar MAIRAchat: timeout esperando socket');
        }, 10000); // 10 segundos de timeout
    }
});

function inicializarMAIRAchat(chatSimple) {
    console.log('Inicializando MAIRAchat automáticamente');
    
    // Determinar módulo según la clase del contenedor
    let modulo = 'general';
    if (chatSimple.classList.contains('modo-juegoguerra')) {
        modulo = 'juegoguerra';
    } else if (chatSimple.classList.contains('modo-gestionbatalla')) {
        modulo = 'gestionbatalla';
    } else if (chatSimple.classList.contains('modo-partidaespera')) {
        modulo = 'partidaespera';
    } else if (chatSimple.classList.contains('modo-planeamiento')) {
        modulo = 'planeamiento';
    } else {
        // Determinar por URL si no hay clase específica
        if (window.location.pathname.includes('juegoguerra')) {
            modulo = 'juegoguerra';
        } else if (window.location.pathname.includes('gestionbatalla')) {
            modulo = 'gestionbatalla';
        } else if (window.location.pathname.includes('inicioGB')) {
            modulo = 'inicioGB';
        } else if (window.location.pathname.includes('iniciarpartida')) {
            modulo = 'partidaespera';
        }
    }
    
    // Crear configuración a partir de datos globales
    const config = {
        modulo: modulo,
        socket: window.socket,
        usuario: window.usuarioInfo || {
            id: window.userId || 'usuario_' + Math.random().toString(36).substr(2, 9),
            usuario: window.userName || 'Usuario'
        },
        equipo: window.equipoJugador,
        partidaId: window.codigoPartida || window.partidaActual?.codigo,
        operacion: window.operacionActual
    };
    
    // Inicializar
    MAIRAchat.inicializar(config).then(success => {
        if (success) {
            console.log('MAIRAchat inicializado correctamente en modo automático');
            
            // Reemplazar el contenedor simple con un mensaje
            chatSimple.innerHTML = '<p class="text-center text-muted mt-3">Chat integrado activado</p>';
        }
    }).catch(error => {
        console.error('Error al inicializar MAIRAchat:', error);
    });
}