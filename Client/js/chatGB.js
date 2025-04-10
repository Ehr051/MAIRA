/**
 * chatGB.js
 * Chat module for Gestión de Batalla in MAIRA
 * @version 1.0.0
 */

// Namespace principal
window.MAIRA = window.MAIRA || {};

// Módulo de chat
MAIRA.Chat = (function() {
    // Variables privadas
    let socket = null;
    let usuarioInfo = null;
    let operacionActual = "";
    let elementosConectados = {};
    let mensajesEnviados = new Set();
    let mensajesRecibidos = new Set();
    let estadosUI = {
        chatPrivado: false
    };
    
    /**
     * Inicializa el módulo de chat
     * @param {Object} config - Configuración del módulo
     */
    function inicializar(config) {
        console.log("Inicializando módulo de chat");
        
        // Guardar referencias
        socket = config.socket;
        usuarioInfo = config.usuarioInfo;
        operacionActual = config.operacionActual;
        elementoTrabajo = config.elementoTrabajo; // Añadir esta línea
        elementosConectados = config.elementosConectados || {};
        
        // Inicializar componentes UI
        inicializarInterfazChat();
        configurarEventosSocket();
        // Configurar eventos
        configurarEventosChat();
        
        // Configurar multimedia
        inicializarComponenteMultimediaChat();
        
        // Mostrar mensaje de bienvenida
        agregarMensajeChat("Sistema", "Bienvenido al chat. Ya puedes enviar mensajes, incluyendo fotos, audios y videos.", "sistema");
        
        console.log("Módulo de chat inicializado");
    }
    
    /**
     * Configura los eventos del chat
     */
    function configurarEventosChat() {
        console.log("Configurando eventos del chat");
        
        // Verificar elementos necesarios
        const elements = verificarElementosChat();
        if (!elements.todosExisten) {
            console.warn("No se pudieron encontrar todos los elementos necesarios para el chat");
        }
        
        // Cambio entre chat general y privado
        const btnChatGeneral = document.getElementById('btn-chat-general');
        const btnChatPrivado = document.getElementById('btn-chat-privado');
        const chatDestinario = document.getElementById('chat-destinatario');
        
        if (btnChatGeneral && btnChatPrivado && chatDestinario) {
            // Limpiar listeners anteriores
            const nuevoBtnGeneral = btnChatGeneral.cloneNode(true);
            btnChatGeneral.parentNode.replaceChild(nuevoBtnGeneral, btnChatGeneral);
            
            const nuevoBtnPrivado = btnChatPrivado.cloneNode(true);
            btnChatPrivado.parentNode.replaceChild(nuevoBtnPrivado, btnChatPrivado);
            
            // Añadir nuevos listeners
            nuevoBtnGeneral.addEventListener('click', function() {
                console.log("Cambiando a chat general");
                nuevoBtnGeneral.classList.add('active');
                nuevoBtnPrivado.classList.remove('active');
                chatDestinario.classList.add('d-none');
                estadosUI.chatPrivado = false;
            });
            
            nuevoBtnPrivado.addEventListener('click', function() {
                console.log("Cambiando a chat privado");
                nuevoBtnPrivado.classList.add('active');
                nuevoBtnGeneral.classList.remove('active');
                chatDestinario.classList.remove('d-none');
                estadosUI.chatPrivado = true;
                actualizarListaDestinatarios();
            });
        } else {
            console.warn("Elementos para cambiar tipo de chat no encontrados");
        }
        
        // Envío de mensajes
        const enviarMensaje = document.getElementById('enviar-mensaje');
        const mensajeInput = document.getElementById('mensaje-chat');
        
        if (enviarMensaje && mensajeInput) {
            // Limpiar eventos anteriores
            const nuevoBoton = enviarMensaje.cloneNode(true);
            enviarMensaje.parentNode.replaceChild(nuevoBoton, enviarMensaje);
            
            // Añadir nuevo evento
            nuevoBoton.addEventListener('click', function() {
                console.log("Botón enviar mensaje clickeado");
                enviarMensajeChat();
            });
            
            // Para el input, también reemplazar para evitar duplicados
            const nuevoInput = mensajeInput.cloneNode(true);
            mensajeInput.parentNode.replaceChild(nuevoInput, mensajeInput);
            
            nuevoInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    console.log("Enter presionado en input de chat");
                    enviarMensajeChat();
                }
            });
            
            console.log("Eventos de envío de mensajes configurados");
        } else {
            console.warn("Elementos para envío de mensajes no encontrados", {
                enviarMensaje: !!enviarMensaje,
                mensajeInput: !!mensajeInput
            });
        }
    }
    
    // In chatGB.js, add function to initiate private chat
function iniciarChatPrivado(elementoId) {
    // Change to chat tab
    const btnTabChat = document.querySelector('.tab-btn[data-tab="tab-chat"]');
    if (btnTabChat) {
        btnTabChat.click();
    }
    
    // Verify the element exists
    if (!window.MAIRA.GestionBatalla.elementosConectados[elementoId] && 
        !elementosConectados[elementoId]) {
        MAIRA.Utils.mostrarNotificacion("No se encontró el destinatario seleccionado", "error");
        return;
    }
    
    // Switch to private chat mode
    const btnChatPrivado = document.getElementById('btn-chat-privado');
    if (btnChatPrivado) {
        btnChatPrivado.click();
    }
    
    // Select recipient
    const selectDestinatario = document.getElementById('select-destinatario');
    if (selectDestinatario) {
        selectDestinatario.value = elementoId;
        
        // If option doesn't exist, update recipient list
        if (!selectDestinatario.value) {
            actualizarListaDestinatarios();
            setTimeout(() => {
                selectDestinatario.value = elementoId;
            }, 500);
        }
    }
    
    // Focus message input
    const mensajeInput = document.getElementById('mensaje-chat');
    if (mensajeInput) {
        mensajeInput.focus();
    }
}

    /**
     * Verifica que los elementos del chat están disponibles
     * @returns {Object} Estado de los elementos del chat
     */
    function verificarElementosChat() {
        // Elementos principales del chat
        const chatMessages = document.getElementById('chat-messages');
        const mensajeInput = document.getElementById('mensaje-chat');
        const enviarBtn = document.getElementById('enviar-mensaje');
        
        console.log("Verificando elementos del chat:");
        console.log("- chat-messages:", !!chatMessages);
        console.log("- mensaje-chat:", !!mensajeInput);
        console.log("- enviar-mensaje:", !!enviarBtn);
        
        // Si falta algún elemento crítico, intentar encontrarlos por clase o selector alternativo
        if (!chatMessages) {
            const posiblesContenedores = document.querySelectorAll('.chat-messages');
            console.log("Posibles contenedores por clase:", posiblesContenedores.length);
        }
        
        // Verificar panel del chat
        const panelChat = document.getElementById('tab-chat');
        console.log("- tab-chat:", !!panelChat);
        
        return {
            chatMessages,
            mensajeInput,
            enviarBtn,
            panelChat,
            todosExisten: !!chatMessages && !!mensajeInput && !!enviarBtn
        };
    }
    
    /**
     * Inicializa la interfaz del chat
     */
    function inicializarInterfazChat() {
        console.log("Inicializando interfaz del chat");
        
        // Limpiar mensajes anteriores
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Actualizar HTML del chat (agregar elementos que puedan faltar)
        actualizarHTML_Chat();
        
        // Configurar estilos de mensajes privados
        configurarEstilosMensajesPrivados();
        
        console.log("Interfaz de chat inicializada");
    }
    
    /**
     * Actualiza el HTML del panel de chat para incorporar nuevas funcionalidades
     */
    function actualizarHTML_Chat() {
        // 1. Mejorar el selector de destinatarios para chat privado
        const selectDestinatario = document.getElementById('select-destinatario');
        if (selectDestinatario) {
            // Añadir clases para mejor estilo
            selectDestinatario.className = 'form-control custom-select';
            
            // Asegurar que tiene las opciones base
            if (selectDestinatario.options.length <= 1) {
                selectDestinatario.innerHTML = `
                    <option value="">Seleccionar destinatario...</option>
                    <option value="todos">Todos los participantes</option>
                    <option value="comando">Comando/Central</option>
                    <option disabled>───────────────</option>
                `;
                
                // Actualizar con elementos conectados
                setTimeout(actualizarListaDestinatarios, 500);
            }
        }
        
        // 2. Agregar soporte para adjuntos en chat
        const chatInput = document.getElementById('mensaje-chat');
        const chatInputContainer = chatInput ? chatInput.parentNode : null;
        
        // Si el contenedor existe y no tiene ya los botones de multimedia
        if (chatInputContainer && !document.getElementById('chat-multimedia-buttons')) {
            // Crear contenedor para botones
            const botonesMultimedia = document.createElement('div');
            botonesMultimedia.id = 'chat-multimedia-buttons';
            botonesMultimedia.className = 'd-flex align-items-center ml-2';
            botonesMultimedia.innerHTML = `
                <button type="button" id="btn-foto-chat" class="btn-foto-chat mr-2" title="Enviar foto">
                    <i class="fas fa-camera"></i>
                </button>
                <button type="button" id="btn-audio-chat" class="btn-audio-chat mr-2" title="Enviar audio">
                    <i class="fas fa-microphone"></i>
                </button>
                <button type="button" id="btn-video-chat" class="btn-video-chat mr-2" title="Enviar video">
                    <i class="fas fa-video"></i>
                </button>
            `;
            
            // Reorganizar el contenedor
            chatInputContainer.style.display = 'flex';
            chatInputContainer.style.alignItems = 'center';
            
            // Insertar después del input
            chatInput.style.flexGrow = '1';
            chatInputContainer.insertBefore(botonesMultimedia, chatInput.nextSibling);
            
            // Configurar eventos
            setTimeout(implementarBotonesMultimediaChat, 500);
        }
    }
    
    /**
     * Configura los eventos de Socket.io para el módulo de chat
     * @param {Object} socket - Objeto socket.io
     */
    function configurarEventosSocket(socket) {
        if (!socket) return;
        
        // Limpiar eventos anteriores
        socket.off('mensajeChat');
        socket.off('mensajePrivado');
        socket.off('mensajeMultimedia');
        
        // Configurar eventos de mensajes
        socket.on('mensajeChat', function(mensaje) {
            console.log('Mensaje global recibido:', mensaje);
            recibirMensajeChat(mensaje);
        });
        
        socket.on('mensajePrivado', function(mensaje) {
            console.log('Mensaje privado recibido:', mensaje);
            recibirMensajePrivado(mensaje);
        });
        
        socket.on('mensajeMultimedia', function(mensaje) {
            console.log('Mensaje multimedia recibido:', mensaje);
            recibirMensajeMultimedia(mensaje);
        });
        
/**
 * Añade al módulo GB.js - Función para incluir en configurarEventosSocket
 */

    socket.on('listaElementos', function(elementos) {
        console.log("Recibida lista de elementos:", elementos?.length || 0);
        
        if (!elementos || !Array.isArray(elementos)) {
            console.warn("Lista de elementos inválida");
            return;
        }
        
        // Procesar elementos
        const elementosActualizados = {};
        elementos.forEach(elemento => {
            if (elemento?.id) {
                elementosActualizados[elemento.id] = {
                    datos: elemento,
                    marcador: elementosConectados[elemento.id]?.marcador
                };
            }
        });
    
        // Actualizar lista global
        elementosConectados = elementosActualizados;
        
        // Actualizar destinatarios chat
        actualizarListaDestinatarios();
    });
    }
    /**
     * Agrega un mensaje al chat
     * @param {string|Object} emisor - Nombre del emisor o mensaje completo
     * @param {string} mensaje - Contenido del mensaje (si emisor es string)
     * @param {string} tipo - Tipo de mensaje (enviado, recibido, sistema)
     * @param {string} estado - Estado del mensaje (enviando, enviado, error)
     * @param {string} id - ID único del mensaje
     */
    function agregarMensajeChat(emisor, mensaje, tipo, estado, id) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) {
            console.error("Contenedor de chat no encontrado (chat-messages)");
            return;
        }
        
        // Si el primer parámetro es un objeto, extraer sus propiedades
        if (typeof emisor === 'object' && emisor !== null) {
            id = mensaje;
            estado = tipo;
            tipo = mensaje;
            mensaje = emisor.mensaje || emisor.contenido || '';
            emisor = emisor.usuario || emisor.emisor || 'Desconocido';
        }
        
        // Valores por defecto si no se proporcionan
        tipo = tipo || 'recibido';
        
        // Determinar la clase CSS según el tipo
        let claseCSS = '';
        if (tipo === "enviado") {
            claseCSS = "message-usuario";
        } else if (tipo === "sistema") {
            claseCSS = "message-sistema";
        } else {
            claseCSS = "message-recibido";
        }
        
        // Formatear hora actual
        const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Convertir URLs en enlaces clicables si el mensaje es texto
        let mensajeFormateado = '';
        if (mensaje && typeof mensaje === 'string') {
            mensajeFormateado = mensaje.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        } else if (mensaje) {
            mensajeFormateado = mensaje.toString();
        } else {
            mensajeFormateado = ""; // Para evitar 'undefined'
        }
        
        // Si ya existe un mensaje con este ID, actualizar su estado en lugar de crear uno nuevo
        if (id) {
            const mensajeExistente = document.getElementById(`msg-${id}`);
            if (mensajeExistente) {
                // Solo actualizar el estado si se proporciona
                if (estado) {
                    const estadoElement = mensajeExistente.querySelector('.estado');
                    if (estadoElement) {
                        estadoElement.textContent = estado;
                        estadoElement.className = `estado ${estado}`;
                    } else {
                        // Si no existe elemento de estado, crearlo
                        const nuevoEstado = document.createElement('span');
                        nuevoEstado.className = `estado ${estado}`;
                        nuevoEstado.textContent = estado;
                        mensajeExistente.appendChild(nuevoEstado);
                    }
                }
                // No crear un mensaje nuevo si ya existe
                return;
            }
        }
        
        // Crear elemento de mensaje
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `message ${claseCSS}`;
        if (id) {
            mensajeDiv.id = `msg-${id}`;
        }
        
        // HTML interno del mensaje
        if (tipo === "sistema") {
            // Mensaje del sistema (más simple)
            mensajeDiv.textContent = mensajeFormateado;
        } else {
            // Mensaje normal con emisor y hora
            mensajeDiv.innerHTML = `
                <div><strong>${emisor}</strong> <small>${hora}</small></div>
                <div>${mensajeFormateado}</div>
                ${estado ? `<span class="estado ${estado}">${estado}</span>` : ''}
            `;
        }
        
        // Añadir al contenedor
        chatContainer.appendChild(mensajeDiv);
        
        // Scroll al final
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Log para depuración
        console.log(`Mensaje agregado: ${emisor} - ${mensaje ? mensaje.substring(0, 20) + '...' : ''}`);
    }
    
        /**
     * Envía un mensaje de chat (texto, multimedia, privado o global)
     */
   function enviarMensajeChat() {
    if (!socket?.connected) {
        console.error("No hay conexión con el servidor");
        return;
    }

    const mensajeInput = document.getElementById('mensaje-chat');
    const contenido = mensajeInput?.value?.trim();
    
    if (!contenido) return;

    const esPrivado = document.getElementById('btn-chat-privado')?.classList.contains('active');
    const destinatarioId = esPrivado ? document.getElementById('select-destinatario')?.value : null;

    const mensaje = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario
        },
        contenido: contenido,
        sala: operacionActual,
        timestamp: new Date().toISOString(),
        tipo: esPrivado ? 'privado' : 'global',
        destinatario: destinatarioId
    };

    // Mostrar localmente
    agregarMensajeChat(
        esPrivado ? `Tú → ${obtenerNombreDestinatario(destinatarioId)}` : 'Tú',
        contenido,
        "enviado"
    );

    // Emitir mensaje
    socket.emit(esPrivado ? 'mensajePrivado' : 'mensajeChat', mensaje);

    mensajeInput.value = '';
    mensajeInput.focus();
}
    
    /**
     * Maneja mensajes privados recibidos
     * @param {Object} mensaje - Mensaje privado recibido
     */
    function recibirMensajePrivado(mensaje) {
        if (!mensaje || !mensaje.emisor || !mensaje.contenido) {
            console.warn("Mensaje privado inválido recibido:", mensaje);
            return;
        }
        
        console.log("Mensaje privado recibido:", mensaje);
        
        // Determinar si es un mensaje enviado por nosotros (eco)
        const esPropio = mensaje.emisor.id === usuarioInfo?.id;
        
        // Evitar duplicados si ya tenemos este mensaje
        if (mensaje.id && mensajesRecibidos && mensajesRecibidos.has(mensaje.id)) {
            console.log("Mensaje privado duplicado ignorado:", mensaje.id);
            return;
        }
        
        // Si es nuestro propio mensaje (eco), ignorarlo
        if (esPropio && mensaje.id && mensajesEnviados && mensajesEnviados.has(mensaje.id)) {
            console.log("Mensaje privado propio (eco) ignorado:", mensaje.id);
            return;
        }
        
        // Registrar ID para evitar duplicados
        if (mensaje.id && mensajesRecibidos) {
            mensajesRecibidos.add(mensaje.id);
        }
        
        // Determinar el emisor para mostrar correctamente
        let nombreEmisor;
        if (esPropio) {
            // Si es nuestro mensaje, mostrar 'Tú'
            nombreEmisor = 'Tú';
        } else {
            // Si es de otro usuario, mostrar su nombre
            nombreEmisor = typeof mensaje.emisor === 'object' ? 
                mensaje.emisor.nombre || mensaje.emisor.usuario : 
                mensaje.emisor;
        }
        
        // Determinar el destinatario para mostrar correctamente
        let nombreDestinatario = "";
        if (mensaje.destinatario === "todos") {
            nombreDestinatario = "Todos";
        } else if (mensaje.destinatario === "comando") {
            nombreDestinatario = "Comando";
        } else if (mensaje.destinatario && elementosConectados[mensaje.destinatario]?.datos?.usuario) {
            nombreDestinatario = elementosConectados[mensaje.destinatario].datos.usuario;
        } else if (mensaje.destinatario === usuarioInfo?.id) {
            nombreDestinatario = "Ti";
        }
        
        // Construir texto de mensaje con remitente y destinatario
        let encabezadoMensaje;
        if (esPropio) {
            encabezadoMensaje = `${nombreEmisor} → ${nombreDestinatario}`;
        } else {
            encabezadoMensaje = `${nombreEmisor} → ${nombreDestinatario ? "Ti" : ""}`;
        }
        
        // Notificar al usuario sobre el mensaje privado con sonido y notificación
        if (!esPropio) {
            // Sólo notificar mensajes que recibimos, no los que enviamos
            notificarMensajePrivado(mensaje);
        }
        
        // Mostrar el mensaje en el chat
        agregarMensajeChat(
            encabezadoMensaje,
            mensaje.contenido,
            esPropio ? "enviado" : "privado",
            mensaje.estado || (esPropio ? "enviado" : "recibido"),
            mensaje.id
        );
    }
    
    /**
     * Mejora en la notificación de mensajes privados
     * @param {Object} mensaje - Mensaje privado recibido
     */
    function notificarMensajePrivado(mensaje) {
        // Asegurarse de que los estilos están configurados
        configurarEstilosMensajesPrivados();
        
        // Reproducir sonido de notificación si está disponible
        try {
            const audio = new Audio('/Client/audio/private_message.mp3');
            audio.play().catch(err => {
                console.log("No se pudo reproducir el sonido específico, usando genérico", err);
                // Fallback al sonido genérico
                const audioGenerico = new Audio('/Client/audio/notification.mp3');
                audioGenerico.play().catch(e => console.log("No se pudo reproducir ningún sonido", e));
            });
        } catch (e) {
            console.warn("Error al reproducir sonido de notificación:", e);
        }
        
        // Mostrar notificación con más énfasis
        MAIRA.Utils.mostrarNotificacion(`Mensaje privado de ${mensaje.emisor.nombre || mensaje.emisor}`, "info", 5000, true);
        
        // Si no estamos en la pestaña de chat o el panel está oculto, mostrar notificación especial
        const panelLateral = document.getElementById('panel-lateral');
        const tabChat = document.getElementById('tab-chat');
        
        if (!document.hidden && (
                (panelLateral && panelLateral.classList.contains('oculto')) || 
                (tabChat && !tabChat.classList.contains('active'))
            )) {
            // Crear notificación flotante
            const notificacion = document.createElement('div');
            notificacion.className = 'notificacion-privado';
            notificacion.innerHTML = `
                <div><i class="fas fa-envelope"></i> <strong>Mensaje privado</strong></div>
                <div>De: ${mensaje.emisor.nombre || mensaje.emisor}</div>
                <button id="btn-ir-chat-privado">Ver mensaje</button>
            `;
            
            document.body.appendChild(notificacion);
            
            // Configurar botón para ir al chat
            document.getElementById('btn-ir-chat-privado').addEventListener('click', function() {
                // Mostrar panel si estaba oculto
                if (panelLateral && panelLateral.classList.contains('oculto') && MAIRA.GestionBatalla.togglePanel) {
                    MAIRA.GestionBatalla.togglePanel(true);
                }
                
                // Cambiar a pestaña de chat
                const btnTabChat = document.querySelector('.tab-btn[data-tab="tab-chat"]');
                if (btnTabChat) {
                    btnTabChat.click();
                }
                
                // Eliminar notificación
                document.body.removeChild(notificacion);
            });
            
            // Auto ocultar después de 8 segundos
            setTimeout(() => {
                if (document.body.contains(notificacion)) {
                    document.body.removeChild(notificacion);
                }
            }, 8000);
        }
    }
    
    /**
     * Mejora para la función de enviar chat y CSS de mensajes privados
     */
    function configurarEstilosMensajesPrivados() {
        // Verificar si ya existe la hoja de estilos
        if (document.getElementById('estilos-chat-privado')) {
            return;
        }
        
        // Crear hoja de estilos
        const style = document.createElement('style');
        style.id = 'estilos-chat-privado';
        style.textContent = `
            .message.message-privado {
                background-color: #e1f5fe;
                border-left: 4px solid #03a9f4;
                margin-bottom: 10px;
                padding: 8px 12px;
                border-radius: 4px;
                max-width: 90%;
                margin-left: 10px;
                position: relative;
            }
            
            .message.message-usuario.privado {
                background-color: #e8f5e9;
                border-left: 4px solid #4caf50;
            }
            
            .chat-privado-icon {
                display: inline-block;
                margin-right: 5px;
                color: #0288d1;
            }
            
            .notificacion-privado {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background-color: rgba(3, 169, 244, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 9999;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .notificacion-privado button {
                background-color: white;
                color: #0288d1;
                border: none;
                padding: 5px 10px;
                border-radius: 4px;
                margin-top: 8px;
                cursor: pointer;
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(style);
    }
    

    
    /**
     * Inicializa el componente de mensajes multimedia en el chat
     */
    function inicializarComponenteMultimediaChat() {
        // Agregar estilos
        agregarEstilosMensajesMultimedia();
        
        // Configurar botones
        configurarBotonesMultimediaChat();
        
        // Registrar eventos Socket.IO
        registrarEventosMensajesMultimedia();
        
        console.log("Componente de mensajes multimedia inicializado");
    }
    
    /**
     * Configura los botones de multimedia en el chat
     */
    function configurarBotonesMultimediaChat() {
        // Buscar el contenedor de botones de envío
        const inputContainer = document.querySelector('.chat-input');
        if (!inputContainer) return;
        
        // Verificar si ya existe
        if (document.getElementById('chat-multimedia-buttons')) return;
        
        // Crear contenedor de botones
        const botonesContainer = document.createElement('div');
        botonesContainer.id = 'chat-multimedia-buttons';
        botonesContainer.className = 'chat-multimedia-buttons';
        botonesContainer.style.display = 'flex';
        botonesContainer.style.marginRight = '5px';
        
        botonesContainer.innerHTML = `
            <button type="button" id="btn-foto-chat" class="btn-multimedia" title="Enviar foto">
                <i class="fas fa-camera"></i>
            </button>
            <button type="button" id="btn-audio-chat" class="btn-multimedia" title="Enviar audio">
                <i class="fas fa-microphone"></i>
            </button>
            <button type="button" id="btn-video-chat" class="btn-multimedia" title="Enviar video">
                <i class="fas fa-video"></i>
            </button>
        `;
        
        // Insertar antes del input
        inputContainer.insertBefore(botonesContainer, inputContainer.firstChild);
        
        // Añadir estilos
        const style = document.createElement('style');
        style.textContent = `
            .chat-input {
                display: flex;
                align-items: center;
            }
            
            .chat-multimedia-buttons {
                display: flex;
                margin-right: 8px;
            }
            
            .btn-multimedia {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 1px solid #ddd;
                background: none;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 5px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-multimedia:hover {
                background-color: #f0f0f0;
                transform: scale(1.1);
            }
            
            .btn-multimedia i {
                font-size: 14px;
                color: #555;
            }
        `;
        document.head.appendChild(style);
        
        // Configurar eventos
        document.getElementById('btn-foto-chat').addEventListener('click', capturarFotoParaChat);
        document.getElementById('btn-audio-chat').addEventListener('click', grabarAudioParaChat);
        document.getElementById('btn-video-chat').addEventListener('click', grabarVideoParaChat);
    }
    
    /**
     * Implementa los botones multimedia para el chat
     */
    function implementarBotonesMultimediaChat() {
        const btnFotoChat = document.getElementById('btn-foto-chat');
        const btnAudioChat = document.getElementById('btn-audio-chat');
        const btnVideoChat = document.getElementById('btn-video-chat');
        
        if (btnFotoChat) {
            btnFotoChat.addEventListener('click', function() {
                capturarFotoParaChat();
            });
        }
        
        if (btnAudioChat) {
            btnAudioChat.addEventListener('click', function() {
                grabarAudioParaChat();
            });
        }
        
        if (btnVideoChat) {
            btnVideoChat.addEventListener('click', function() {
                grabarVideoParaChat();
            });
        }
    }
    
    /**
     * Registra el evento para mensajes multimedia
     */
    function registrarEventosMensajesMultimedia() {
        if (!socket) return;
        
        // Eliminar listener previo si existe
        socket.off('mensajeMultimedia');
        
        // Registrar nuevo listener
        socket.on('mensajeMultimedia', function(mensaje) {
            recibirMensajeMultimedia(mensaje);
        });
        
        console.log("Eventos de mensajes multimedia registrados");
    }
    
    /**
     * Añade estilos CSS para mensajes multimedia
     */
    function agregarEstilosMensajesMultimedia() {
        // Verificar si ya existe
        if (document.getElementById('estilos-mensajes-multimedia')) return;
        
        // Crear elemento de estilo
        const style = document.createElement('style');
        style.id = 'estilos-mensajes-multimedia';
        style.textContent = `
            /* Contenedores multimedia */
            .multimedia-container {
                max-width: 100%;
                margin: 5px 0;
                border-radius: 8px;
                overflow: hidden;
            }
            
            /* Imágenes */
            .multimedia-container.imagen {
                display: inline-block;
                max-width: 250px;
                background-color: #f8f9fa;
            }
            
            .mensaje-imagen {
                max-width: 100%;
                max-height: 200px;
                object-fit: contain;
                border-radius: 8px;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            
            .mensaje-imagen:hover {
                opacity: 0.9;
            }
            
            /* Audio */
            .multimedia-container.audio {
                width: 250px;
                background-color: #f0f2f5;
                padding: 5px;
                border-radius: 16px;
            }
            
            .multimedia-container.audio audio {
                width: 100%;
                height: 40px;
                border-radius: 16px;
            }
            
            /* Video */
            .multimedia-container.video {
                max-width: 250px;
                background-color: #000;
                border-radius: 8px;
            }
            
            .multimedia-container.video video {
                max-width: 100%;
                max-height: 200px;
                border-radius: 8px;
            }
            
            /* Mensajes de texto adjuntos */
            .mensaje-texto {
                margin-top: 5px;
                word-break: break-word;
            }
            
            /* Modal de imagen ampliada */
            .modal-imagen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* Indicador de carga */
            .mensaje-multimedia-loading {
                display: flex;
                align-items: center;
                gap: 8px;
                font-style: italic;
                color: #666;
            }
            
            /* Mensaje privado */
            .message.privado {
                background-color: #e1f5fe;
                border-left: 4px solid #03a9f4;
            }
            
            .message.message-usuario.privado {
                background-color: #e8f5e9;
                border-left: 4px solid #4caf50;
            }
        `;
        
        // Añadir al documento
        document.head.appendChild(style);
        console.log("Estilos de mensajes multimedia agregados");
    }
    
    /**
     * Captura una foto para enviar en el chat
     */
    function capturarFotoParaChat() {
        // Verificar soporte de getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta acceso a la cámara", "error");
            return;
        }
        
        // Crear elementos para la captura
        const modalCaptura = document.createElement('div');
        modalCaptura.className = 'modal-captura-multimedia';
        modalCaptura.style.position = 'fixed';
        modalCaptura.style.top = '0';
        modalCaptura.style.left = '0';
        modalCaptura.style.width = '100%';
        modalCaptura.style.height = '100%';
        modalCaptura.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalCaptura.style.zIndex = '10000';
        modalCaptura.style.display = 'flex';
        modalCaptura.style.flexDirection = 'column';
        modalCaptura.style.alignItems = 'center';
        modalCaptura.style.justifyContent = 'center';
        
        modalCaptura.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Capturar foto para chat</h3>
            </div>
            <video id="camera-preview" style="max-width: 90%; max-height: 60vh; background: #000; border: 3px solid #fff;" autoplay></video>
            <canvas id="photo-canvas" style="display: none;"></canvas>
            <div style="margin-top: 20px;">
                <button id="btn-capturar" class="btn btn-primary mx-2">
                    <i class="fas fa-camera"></i> Capturar
                </button>
                <button id="btn-cambiar-camara" class="btn btn-info mx-2">
                    <i class="fas fa-sync"></i> Cambiar cámara
                </button>
                <button id="btn-cancelar-captura" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <div style="margin-top: 20px; display: none;" id="preview-container">
                <img id="preview-image" style="max-width: 300px; max-height: 200px; border: 2px solid white;">
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                    <input type="text" id="texto-imagen" placeholder="Añadir mensaje (opcional)" class="form-control" style="width: 300px;">
                    <div>
                        <button id="btn-enviar-imagen" class="btn btn-success mx-2">
                            <i class="fas fa-paper-plane"></i> Enviar
                        </button>
                        <button id="btn-cancelar-imagen" class="btn btn-secondary mx-2">
                            <i class="fas fa-redo"></i> Volver a capturar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalCaptura);
        
        // Variables para la captura
        let stream = null;
        let facingMode = 'environment'; // Comenzar con cámara trasera en móviles
        let imagenCapturada = null;
        
        // Función para iniciar la cámara
        function iniciarCamara() {
            const constraints = {
                video: {
                    facingMode: facingMode
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(videoStream) {
                    stream = videoStream;
                    const video = document.getElementById('camera-preview');
                    video.srcObject = stream;
                })
                .catch(function(error) {
                    console.error("Error accediendo a la cámara:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder a la cámara: " + error.message, "error");
                    cerrarModalCaptura();
                });
        }
        
        // Función para cambiar de cámara
        function cambiarCamara() {
            if (stream) {
                // Detener stream actual
                stream.getTracks().forEach(track => track.stop());
                
                // Cambiar modo
                facingMode = facingMode === 'user' ? 'environment' : 'user';
                
                // Reiniciar cámara
                iniciarCamara();
            }
        }
        
        // Función para capturar foto
        function capturar() {
            const video = document.getElementById('camera-preview');
            const canvas = document.getElementById('photo-canvas');
            
            // Configurar canvas con dimensiones del video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Dibujar frame actual del video en el canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir a data URL (formato JPEG)
            imagenCapturada = canvas.toDataURL('image/jpeg', 0.8);
            
            // Mostrar previsualización
            document.getElementById('preview-image').src = imagenCapturada;
            document.getElementById('preview-container').style.display = 'block';
            document.getElementById('camera-preview').style.display = 'none';
            document.getElementById('btn-capturar').style.display = 'none';
            document.getElementById('btn-cambiar-camara').style.display = 'none';
        }
        
        // Función para enviar la imagen al chat
        function enviarImagen() {
            const textoImagen = document.getElementById('texto-imagen').value;
            
            // Enviar mediante la función de mensaje multimedia
            enviarMensajeMultimedia(
                'image', 
                imagenCapturada, 
                `foto_${new Date().toISOString().replace(/:/g, '-')}.jpg`, 
                'image/jpeg',
                textoImagen
            );
            
            // Cerrar el modal
            cerrarModalCaptura();
        }
        
        // Función para cerrar el modal de captura
        function cerrarModalCaptura() {
            // Detener stream si existe
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Eliminar modal
            if (document.body.contains(modalCaptura)) {
                document.body.removeChild(modalCaptura);
            }
        }
        
        // Configurar eventos
        iniciarCamara();
        
        document.getElementById('btn-capturar').addEventListener('click', capturar);
        document.getElementById('btn-cambiar-camara').addEventListener('click', cambiarCamara);
        document.getElementById('btn-cancelar-captura').addEventListener('click', cerrarModalCaptura);
        document.getElementById('btn-enviar-imagen').addEventListener('click', enviarImagen);
        document.getElementById('btn-cancelar-imagen').addEventListener('click', function() {
            // Volver a mostrar la cámara
            document.getElementById('preview-container').style.display = 'none';
            document.getElementById('camera-preview').style.display = 'block';
            document.getElementById('btn-capturar').style.display = 'inline-block';
            document.getElementById('btn-cambiar-camara').style.display = 'inline-block';
        });
    }
    
    /**
     * Graba audio para enviar en el chat
     */
    function grabarAudioParaChat() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta grabación de audio", "error");
            return;
        }
        
        // Crear elementos para la grabación
        const modalGrabacion = document.createElement('div');
        modalGrabacion.className = 'modal-grabacion-audio';
        modalGrabacion.style.position = 'fixed';
        modalGrabacion.style.top = '0';
        modalGrabacion.style.left = '0';
        modalGrabacion.style.width = '100%';
        modalGrabacion.style.height = '100%';
        modalGrabacion.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalGrabacion.style.zIndex = '10000';
        modalGrabacion.style.display = 'flex';
        modalGrabacion.style.flexDirection = 'column';
        modalGrabacion.style.alignItems = 'center';
        modalGrabacion.style.justifyContent = 'center';
        
        modalGrabacion.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Grabar audio para chat</h3>
            </div>
            <div id="visualizador-audio" style="width: 300px; height: 60px; background: #333; border-radius: 8px; margin-bottom: 15px; position: relative;">
                <div class="audio-wave" style="position: absolute; bottom: 0; left: 0; right: 0; height: 0px; background: #4caf50; border-radius: 0 0 8px 8px;"></div>
            </div>
            <div id="tiempo-grabacion" style="font-size: 24px; color: white; margin-bottom: 20px;">00:00</div>
            <div>
                <button id="btn-iniciar-grabacion" class="btn btn-primary mx-2">
                    <i class="fas fa-microphone"></i> Iniciar grabación
                </button>
                <button id="btn-detener-grabacion" class="btn btn-warning mx-2" disabled>
                    <i class="fas fa-stop"></i> Detener
                </button>
                <button id="btn-cancelar-grabacion" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <div id="reproductor-audio" style="margin-top: 20px; display: none;">
                <audio id="audio-preview" controls style="width: 300px;"></audio>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                    <input type="text" id="texto-audio" placeholder="Añadir mensaje (opcional)" class="form-control" style="width: 300px;">
                    <div>
                        <button id="btn-enviar-audio" class="btn btn-success mx-2">
                            <i class="fas fa-paper-plane"></i> Enviar
                        </button>
                        <button id="btn-descartar-audio" class="btn btn-secondary mx-2">
                            <i class="fas fa-trash"></i> Descartar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalGrabacion);
        
        // Variables para la grabación
        let stream = null;
        let mediaRecorder = null;
        let chunks = [];
        let tiempoInicio = null;
        let timerInterval = null;
        let audioURL = null;
        let audioBlob = null;
        let visualizerInterval = null;
        
        // Función para actualizar el visualizador de audio
        function actualizarVisualizador() {
            if (!stream) return;
            
            // Crear un analizador de audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Actualizar visualizador
            visualizerInterval = setInterval(() => {
                if (!mediaRecorder || mediaRecorder.state !== 'recording') {
                    clearInterval(visualizerInterval);
                    return;
                }
                
                analyser.getByteFrequencyData(dataArray);
                
                // Calcular volumen promedio
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                
                // Actualizar visualizador
                const wave = document.querySelector('.audio-wave');
                if (wave) {
                    const height = Math.min(60, average * 0.5); // Max 60px
                    wave.style.height = `${height}px`;
                }
            }, 50);
        }
        
        // Función para iniciar grabación
        function iniciarGrabacion() {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(audioStream) {
                    stream = audioStream;
                    
                    // Crear MediaRecorder con mejor tipo de MIME
                    const tiposMIME = [
                        'audio/webm',
                        'audio/ogg',
                        'audio/mp4'
                    ];
                    
                    let tipoSeleccionado = '';
                    for (const tipo of tiposMIME) {
                        if (MediaRecorder.isTypeSupported(tipo)) {
                            tipoSeleccionado = tipo;
                            break;
                        }
                    }
                    
                    if (!tipoSeleccionado) {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta ningún formato de audio compatible", "error");
                        cerrarModalGrabacion();
                        return;
                    }
                    
                    mediaRecorder = new MediaRecorder(stream, { mimeType: tipoSeleccionado });
                    
                    // Evento para capturar datos
                    mediaRecorder.ondataavailable = function(e) {
                        chunks.push(e.data);
                    };
                    
                    // Evento para cuando se completa la grabación
                    mediaRecorder.onstop = function() {
                        audioBlob = new Blob(chunks, { type: tipoSeleccionado });
                        audioURL = URL.createObjectURL(audioBlob);
                        
                        const audioPreview = document.getElementById('audio-preview');
                        audioPreview.src = audioURL;
                        audioPreview.style.display = 'block';
                        
                        document.getElementById('reproductor-audio').style.display = 'block';
                        document.getElementById('visualizador-audio').style.display = 'none';
                        
                        // Detener temporizador
                        clearInterval(timerInterval);
                    };
                    
                    // Iniciar grabación
                    mediaRecorder.start(100); // Guardar en fragmentos de 100ms
                    tiempoInicio = Date.now();
                    
                    // Iniciar temporizador
                    timerInterval = setInterval(actualizarTiempo,1000);
                    
                    // Iniciar visualizador
                    actualizarVisualizador();
                    
                    // Actualizar botones
                    document.getElementById('btn-iniciar-grabacion').disabled = true;
                    document.getElementById('btn-detener-grabacion').disabled = false;
                })
                .catch(function(error) {
                    console.error("Error accediendo al micrófono:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder al micrófono: " + error.message, "error");
                    cerrarModalGrabacion();
                });
        }
        
        // Función para actualizar el tiempo de grabación
        function actualizarTiempo() {
            if (!tiempoInicio) return;
            
            const tiempoActual = Date.now();
            const duracion = Math.floor((tiempoActual - tiempoInicio) / 1000);
            const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
            const segundos = (duracion % 60).toString().padStart(2, '0');
            
            document.getElementById('tiempo-grabacion').textContent = `${minutos}:${segundos}`;
            
            // Limitar grabación a 60 segundos
            if (duracion >= 60) {
                detenerGrabacion();
                MAIRA.Utils.mostrarNotificacion("Límite de 1 minuto alcanzado", "info");
            }
        }
        
        // Función para detener grabación
        function detenerGrabacion() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                
                // Actualizar botones
                document.getElementById('btn-iniciar-grabacion').disabled = false;
                document.getElementById('btn-detener-grabacion').disabled = true;
            }
        }
        
        // Función para cerrar el modal de grabación
        function cerrarModalGrabacion() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            if (visualizerInterval) {
                clearInterval(visualizerInterval);
            }
            
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Función para enviar el audio
        function enviarAudio() {
            const textoAudio = document.getElementById('texto-audio').value;
            
            // Convertir Blob a base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = function() {
                const base64data = reader.result;
                
                // Obtener la extensión correcta según el tipo MIME
                let extension = 'webm';
                if (audioBlob.type.includes('ogg')) {
                    extension = 'ogg';
                } else if (audioBlob.type.includes('mp4')) {
                    extension = 'm4a';
                }
                
                // Enviar mediante la función de mensaje multimedia
                enviarMensajeMultimedia(
                    'audio', 
                    base64data, 
                    `audio_${new Date().toISOString().replace(/:/g, '-')}.${extension}`, 
                    audioBlob.type,
                    textoAudio
                );
                
                // Cerrar el modal
                cerrarModalGrabacion();
            };
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion').addEventListener('click', iniciarGrabacion);
        document.getElementById('btn-detener-grabacion').addEventListener('click', detenerGrabacion);
        document.getElementById('btn-cancelar-grabacion').addEventListener('click', cerrarModalGrabacion);
        document.getElementById('btn-enviar-audio').addEventListener('click', enviarAudio);
        document.getElementById('btn-descartar-audio').addEventListener('click', cerrarModalGrabacion);
    }
    
    /**
     * Graba video para enviar en el chat
     */
    function grabarVideoParaChat() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta grabación de video", "error");
            return;
        }
        
        // Crear elementos para la grabación
        const modalGrabacion = document.createElement('div');
        modalGrabacion.className = 'modal-grabacion-video';
        modalGrabacion.style.position = 'fixed';
        modalGrabacion.style.top = '0';
        modalGrabacion.style.left = '0';
        modalGrabacion.style.width = '100%';
        modalGrabacion.style.height = '100%';
        modalGrabacion.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalGrabacion.style.zIndex = '10000';
        modalGrabacion.style.display = 'flex';
        modalGrabacion.style.flexDirection = 'column';
        modalGrabacion.style.alignItems = 'center';
        modalGrabacion.style.justifyContent = 'center';
        
        modalGrabacion.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Grabar video para chat</h3>
            </div>
            <video id="video-preview" style="max-width: 90%; max-height: 60vh; background: #000; border: 3px solid #fff;" autoplay muted></video>
            <div id="tiempo-grabacion-video" style="font-size: 24px; color: white; margin: 10px 0;">00:00</div>
            <div>
                <button id="btn-iniciar-grabacion-video" class="btn btn-primary mx-2">
                    <i class="fas fa-video"></i> Iniciar grabación
                </button>
                <button id="btn-detener-grabacion-video" class="btn btn-warning mx-2" disabled>
                    <i class="fas fa-stop"></i> Detener
                </button>
                <button id="btn-cancelar-grabacion-video" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <div id="reproductor-video" style="margin-top: 20px; display: none;">
                <video id="video-grabado" controls style="max-width: 300px; max-height: 200px;"></video>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                    <input type="text" id="texto-video" placeholder="Añadir mensaje (opcional)" class="form-control" style="width: 300px;">
                    <div>
                        <button id="btn-enviar-video" class="btn btn-success mx-2">
                            <i class="fas fa-paper-plane"></i> Enviar
                        </button>
                        <button id="btn-descartar-video" class="btn btn-secondary mx-2">
                            <i class="fas fa-trash"></i> Descartar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalGrabacion);
        
        // Variables para la grabación
        let stream = null;
        let mediaRecorder = null;
        let chunks = [];
        let tiempoInicio = null;
        let timerInterval = null;
        let videoURL = null;
        let videoBlob = null;
        
        // Función para iniciar grabación
        function iniciarGrabacionVideo() {
            const constraints = {
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(videoStream) {
                    stream = videoStream;
                    
                    // Mostrar preview
                    const video = document.getElementById('video-preview');
                    video.srcObject = stream;
                    
                    // Crear MediaRecorder con mejor tipo de MIME
                    const tiposMIME = [
                        'video/webm;codecs=vp9,opus',
                        'video/webm;codecs=vp8,opus',
                        'video/webm',
                        'video/mp4'
                    ];
                    
                    let tipoSeleccionado = '';
                    for (const tipo of tiposMIME) {
                        if (MediaRecorder.isTypeSupported(tipo)) {
                            tipoSeleccionado = tipo;
                            break;
                        }
                    }
                    
                    if (!tipoSeleccionado) {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta ningún formato de video compatible", "error");
                        cerrarModalGrabacionVideo();
                        return;
                    }
                    
                    mediaRecorder = new MediaRecorder(stream, { mimeType: tipoSeleccionado });
                    
                    // Evento para capturar datos
                    mediaRecorder.ondataavailable = function(e) {
                        if (e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };
                    
                    // Evento para cuando se completa la grabación
                    mediaRecorder.onstop = function() {
                        videoBlob = new Blob(chunks, { type: tipoSeleccionado });
                        videoURL = URL.createObjectURL(videoBlob);
                        
                        const videoGrabado = document.getElementById('video-grabado');
                        videoGrabado.src = videoURL;
                        videoGrabado.style.display = 'block';
                        
                        document.getElementById('reproductor-video').style.display = 'block';
                        document.getElementById('video-preview').style.display = 'none';
                        
                        // Detener temporizador
                        clearInterval(timerInterval);
                    };
                    
                    // Iniciar grabación
                    mediaRecorder.start(1000); // Guardar en fragmentos de 1 segundo
                    tiempoInicio = Date.now();
                    
                    // Iniciar temporizador
                    timerInterval = setInterval(actualizarTiempoVideo, 1000);
                    
                    // Actualizar botones
                    document.getElementById('btn-iniciar-grabacion-video').disabled = true;
                    document.getElementById('btn-detener-grabacion-video').disabled = false;
                })
                .catch(function(error) {
                    console.error("Error accediendo a la cámara o micrófono:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder a la cámara o micrófono: " + error.message, "error");
                    cerrarModalGrabacionVideo();
                });
        }
        
        // Función para actualizar el tiempo de grabación
        function actualizarTiempoVideo() {
            if (!tiempoInicio) return;
            
            const tiempoActual = Date.now();
            const duracion = Math.floor((tiempoActual - tiempoInicio) / 1000);
            const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
            const segundos = (duracion % 60).toString().padStart(2, '0');
            
            document.getElementById('tiempo-grabacion-video').textContent = `${minutos}:${segundos}`;
            
            // Limitar grabación a 30 segundos para evitar archivos demasiado grandes
            if (duracion >= 30) {
                detenerGrabacionVideo();
                MAIRA.Utils.mostrarNotificacion("Límite de 30 segundos alcanzado", "info");
            }
        }
        
        // Función para detener grabación
        function detenerGrabacionVideo() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                
                // Detener preview
                const video = document.getElementById('video-preview');
                video.pause();
                video.style.display = 'none';
                
                // Actualizar botones
                document.getElementById('btn-iniciar-grabacion-video').disabled = false;
                document.getElementById('btn-detener-grabacion-video').disabled = true;
            }
        }
        
        // Función para cerrar el modal de grabación
        function cerrarModalGrabacionVideo() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Función para enviar el video
        function enviarVideo() {
            const textoVideo = document.getElementById('texto-video').value;
            
            // Verificar tamaño máximo (5MB)
            if (videoBlob.size > 5 * 1024 * 1024) {
                MAIRA.Utils.mostrarNotificacion("El video excede el tamaño máximo permitido de 5MB. La calidad será reducida.", "warning");
                
                // Comprimir video
                MAIRA.Utils.comprimirVideo(videoBlob).then(videoComprimido => {
                    procesarEnvioVideo(videoComprimido, textoVideo);
                }).catch(error => {
                    console.error("Error al comprimir video:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al comprimir el video. Intente una grabación más corta.", "error");
                });
            } else {
                procesarEnvioVideo(videoBlob, textoVideo);
            }
        }
        
        // Función auxiliar para procesar y enviar el video
        function procesarEnvioVideo(blob, texto) {
            // Convertir Blob a base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function() {
                const base64data = reader.result;
                
                // Obtener la extensión correcta según el tipo MIME
                let extension = 'webm';
                if (blob.type.includes('mp4')) {
                    extension = 'mp4';
                }
                
                // Enviar mediante la función de mensaje multimedia
                enviarMensajeMultimedia(
                    'video', 
                    base64data, 
                    `video_${new Date().toISOString().replace(/:/g, '-')}.${extension}`, 
                    blob.type,
                    texto
                );
                
                // Cerrar el modal
                cerrarModalGrabacionVideo();
            };
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion-video').addEventListener('click', iniciarGrabacionVideo);
        document.getElementById('btn-detener-grabacion-video').addEventListener('click', detenerGrabacionVideo);
        document.getElementById('btn-cancelar-grabacion-video').addEventListener('click', cerrarModalGrabacionVideo);
        document.getElementById('btn-enviar-video').addEventListener('click', enviarVideo);
        document.getElementById('btn-descartar-video').addEventListener('click', cerrarModalGrabacionVideo);
        
        // Permitir cerrar con Escape
        document.addEventListener('keydown', function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                cerrarModalGrabacionVideo();
                document.removeEventListener('keydown', cerrarConEscape);
            }
        });
    }
    
    /**
     * Envía un mensaje multimedia (imagen, audio, video) al chat
     * @param {string} tipoContenido - Tipo de contenido ('image', 'audio', 'video')
     * @param {string} contenidoBase64 - Datos en formato base64
     * @param {string} nombreArchivo - Nombre del archivo
     * @param {string} mimeType - Tipo MIME del archivo
     * @param {string} [texto] - Texto opcional para acompañar el contenido
     */
    
// Reemplazar en chatGB.js - Función para enviar contenido multimedia
function enviarMensajeMultimedia(tipoContenido, contenidoBase64, nombreArchivo, mimeType, texto) {
    console.log(`Preparando envío de mensaje multimedia: ${tipoContenido}`);
    
    if (!contenidoBase64) {
        console.error("Contenido multimedia vacío");
        MAIRA.Utils.mostrarNotificacion("No hay contenido para enviar", "error");
        return;
    }
    
    // Generar ID único para el mensaje
    const mensajeId = `media_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Determinar si es mensaje privado
    const btnChatPrivado = document.getElementById('btn-chat-privado');
    let destinatario = null;
    
    if (btnChatPrivado && btnChatPrivado.classList.contains('active')) {
        const selectDestinatario = document.getElementById('select-destinatario');
        if (!selectDestinatario || !selectDestinatario.value) {
            MAIRA.Utils.mostrarNotificacion("Selecciona un destinatario para el mensaje privado", "error");
            return;
        }
        destinatario = selectDestinatario.value;
    }
    
    // Mostrar mensaje de carga
    const esPrivado = destinatario !== null;
    const loadingId = `loading_${mensajeId}`;
    
    agregarMensajeChat(
        esPrivado ? `Tú → ${obtenerNombreDestinatario(destinatario)}` : 'Tú',
        `<div id="${loadingId}" class="mensaje-multimedia-loading">
            <i class="fas fa-spinner fa-spin"></i> Enviando ${tipoContenido}...
        </div>`,
        "enviado",
        "enviando",
        mensajeId
    );
    
    // Crear mensaje multimedia
    const mensaje = {
        id: mensajeId,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
            elemento: usuarioInfo.elemento || (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementoTrabajo) || {}
        },
        tipo_contenido: tipoContenido,
        contenido: contenidoBase64,
        nombre_archivo: nombreArchivo,
        mime_type: mimeType,
        texto: texto || '',
        sala: operacionActual,
        destinatario: destinatario,
        timestamp: new Date().toISOString(),
        tipo: destinatario ? 'privado' : 'global'
    };
    
    // Enviar mensaje al servidor con timeout para evitar bloqueos
    const timeoutId = setTimeout(() => {
        // Si pasaron 30 segundos sin respuesta, consideramos que falló
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error al enviar: Timeout`;
        }
        agregarMensajeChat(null, null, null, "error", mensajeId);
        MAIRA.Utils.mostrarNotificacion("Error al enviar contenido multimedia: Timeout", "error");
    }, 30000);
    
    // IMPORTANTE: Enviar con retry si falla
    const intentarEnviar = (intentosRestantes = 3) => {
        if (intentosRestantes <= 0) {
            clearTimeout(timeoutId);
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                loadingElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error al enviar: Máximos intentos`;
            }
            agregarMensajeChat(null, null, null, "error", mensajeId);
            MAIRA.Utils.mostrarNotificacion("Error al enviar contenido multimedia: Máximos intentos", "error");
            return;
        }
        
        socket.emit('mensajeMultimedia', mensaje, function(respuesta) {
            if (respuesta && respuesta.error) {
                console.log(`Error en intento ${4-intentosRestantes}/3, reintentando...`);
                // Reintento con delay
                setTimeout(() => intentarEnviar(intentosRestantes - 1), 2000);
            } else {
                // Éxito
                clearTimeout(timeoutId);
                const loadingElement = document.getElementById(loadingId);
                if (loadingElement) {
                    loadingElement.remove();
                }
                agregarMensajeChat(null, null, null, "enviado", mensajeId);
                
                // Actualizar vista con contenido multimedia
                actualizarVistaMultimedia(mensajeId, tipoContenido, contenidoBase64, texto);
                
                // Registrar en mensajes enviados para evitar duplicados
                if (mensajesEnviados) {
                    mensajesEnviados.add(mensajeId);
                }
            }
        });
    };
    
    // Iniciar envío
    if (socket && socket.connected) {
        intentarEnviar();
    } else {
        clearTimeout(timeoutId);
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: Sin conexión`;
        }
        agregarMensajeChat(null, null, null, "pendiente", mensajeId);
        MAIRA.Utils.mostrarNotificacion("No hay conexión con el servidor. Se guardará para enviar más tarde.", "warning");
        
        // Guardar para enviar cuando se conecte
        const mensajesPendientes = JSON.parse(localStorage.getItem('mensajes_multimedia_pendientes') || '[]');
        mensajesPendientes.push(mensaje);
        localStorage.setItem('mensajes_multimedia_pendientes', JSON.stringify(mensajesPendientes));
    }
}



// Función auxiliar para estimar tamaño
function estimarTamanyoBase64(base64String) {
    const base64 = base64String.replace(/^data:.*;base64,/, '');
    return Math.ceil((base64.length * 3) / 4);
}

// Función para comprimir imagen
function comprimirImagen(base64Image, calidad, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            
            // Redimensionar si es necesario
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Comprimir
            resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        
        img.onerror = function() {
            reject(new Error("Error al cargar imagen para compresión"));
        };
        
        img.src = base64Image;
    });
}

// Función para dividir y enviar en partes
function dividirYEnviarMultimedia(tipoContenido, contenidoBase64, nombreArchivo, mimeType, texto) {
    // Extraer datos base64 (sin encabezado)
    const matches = contenidoBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        MAIRA.Utils.mostrarNotificacion("Formato de datos inválido", "error");
        return;
    }
    
    const data = matches[2];
    const headerMime = matches[1]; // En caso de que mimeType sea incorrecto
    const mimeTypeActual = mimeType || headerMime;
    
    // Dividir en partes de 500KB
    const chunkSize = 500 * 1024;
    const chunks = Math.ceil(data.length / chunkSize);
    
    if (chunks > 5) {
        MAIRA.Utils.mostrarNotificacion("El archivo es demasiado grande para enviar por chat", "error");
        return;
    }
    
    MAIRA.Utils.mostrarNotificacion(`Enviando ${tipoContenido} en ${chunks} partes...`, "info");
    
    // Identificador único para este grupo de mensajes
    const grupoId = `mult_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Enviar cada parte
    for (let i = 0; i < chunks; i++) {
        const inicio = i * chunkSize;
        const fin = Math.min(data.length, inicio + chunkSize);
        const chunk = data.substring(inicio, fin);
        
        // Reconstruir el base64 con encabezado
        const chunkBase64 = `data:${mimeTypeActual};base64,${chunk}`;
        
        // Crear mensaje con metadatos para reconstrucción
        const mensajeChunk = {
            tipo_contenido: tipoContenido,
            contenido: chunkBase64,
            nombre_archivo: nombreArchivo,
            mime_type: mimeTypeActual,
            texto: i === 0 ? texto : '', // Solo incluir texto en la primera parte
            parte: i + 1,
            total_partes: chunks,
            grupo_id: grupoId
        };
        
        // Enviar parte
        setTimeout(() => {
            enviarContenidoMultimedia(
                tipoContenido, 
                chunkBase64, 
                nombreArchivo, 
                mimeTypeActual, 
                i === 0 ? texto : '',
                mensajeChunk
            );
        }, i * 1000); // Esperar 1 segundo entre envíos para evitar saturación
    }
}

// Función para enviar el contenido multimedia
function enviarContenidoMultimedia(tipoContenido, contenidoBase64, nombreArchivo, mimeType, texto, datosAdicionales = null) {
    // Verificar conexión al servidor
    if (!socket || !socket.connected) {
        MAIRA.Utils.mostrarNotificacion("No hay conexión con el servidor", "error");
        return;
    }
    
    // Determinar si es mensaje privado
    const btnChatPrivado = document.getElementById('btn-chat-privado');
    let destinatario = null;
    
    if (btnChatPrivado && btnChatPrivado.classList.contains('active')) {
        const selectDestinatario = document.getElementById('select-destinatario');
        if (!selectDestinatario || !selectDestinatario.value) {
            MAIRA.Utils.mostrarNotificacion("Selecciona un destinatario para el mensaje privado", "error");
            return;
        }
        destinatario = selectDestinatario.value;
    }
    
    // Crear mensaje
    const mensajeId = `media_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    const mensaje = {
        id: mensajeId,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
            elemento: usuarioInfo.elemento || (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementoTrabajo) || {}
        },
        tipo_contenido: tipoContenido,
        contenido: contenidoBase64,
        nombre_archivo: nombreArchivo,
        mime_type: mimeType,
        texto: texto || '',
        sala: operacionActual,
        destinatario: destinatario,
        timestamp: new Date().toISOString(),
        tipo: destinatario ? 'privado' : 'global'
    };
    
    // Agregar datos adicionales si existen
    if (datosAdicionales) {
        Object.assign(mensaje, datosAdicionales);
    }
    
    // Mostrar indicador de carga
    const loadingId = `loading_${mensajeId}`;
    const esPrivado = destinatario !== null;
    
    agregarMensajeChat(
        esPrivado ? `Tú → ${obtenerNombreDestinatario(destinatario)}` : 'Tú',
        `<div id="${loadingId}" class="mensaje-multimedia-loading">
            <i class="fas fa-spinner fa-spin"></i> Enviando ${tipoContenido}...
        </div>`,
        "enviado",
        "enviando",
        mensajeId
    );
    
    // Enviar mensaje al servidor con timeout para evitar bloqueos
    const timeoutId = setTimeout(() => {
        // Si pasaron 30 segundos sin respuesta, consideramos que falló
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error al enviar: Timeout`;
        }
        agregarMensajeChat(null, null, null, "error", mensajeId);
        MAIRA.Utils.mostrarNotificacion("Error al enviar contenido multimedia: Timeout", "error");
    }, 30000);
    
    // Enviar mensaje
    socket.emit('mensajeMultimedia', mensaje, function(respuesta) {
        clearTimeout(timeoutId);
        console.log("Respuesta del servidor:", respuesta);
        
        // Eliminar indicador de carga
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
        
        if (respuesta && respuesta.error) {
            MAIRA.Utils.mostrarNotificacion(`Error al enviar: ${respuesta.error}`, "error");
            agregarMensajeChat(null, null, null, "error", mensajeId);
        } else {
            // Mensaje enviado correctamente
            agregarMensajeChat(null, null, null, "enviado", mensajeId);
            
            // Actualizar vista con contenido multimedia
            actualizarVistaMultimedia(mensajeId, tipoContenido, contenidoBase64, texto);
            
            // Registrar en mensajes enviados para evitar duplicados
            if (mensajesEnviados) {
                mensajesEnviados.add(mensajeId);
            }
        }
    });
}
    
    /**
     * Recibe un mensaje multimedia y lo muestra en el chat
     * @param {Object} mensaje - Mensaje multimedia recibido
     */
    function recibirMensajeMultimedia(mensaje) {
        try {
            console.log("Recibiendo mensaje multimedia:", mensaje);
            
            // Validar mensaje
            if (!mensaje || !mensaje.tipo_contenido) {
                console.error("Mensaje multimedia inválido:", mensaje);
                return;
            }
            
            // Obtener información básica
            const tipo = mensaje.tipo_contenido; // image, audio, video
            const adjunto = mensaje.adjunto || {};
            const esPropio = mensaje.emisor && mensaje.emisor.id === usuarioInfo?.id;
            
            // Preparar contenido HTML según tipo
            let contenidoHTML = '';
            
            switch (tipo) {
                case 'image':
                    // Imagen
                    contenidoHTML = `
                        <div class="multimedia-container imagen">
                            <img src="${mensaje.contenido}" alt="Imagen" class="mensaje-imagen" onclick="ampliarImagen(this.src)">
                        </div>
                    `;
                    break;
                    
                case 'audio':
                    // Audio
                    contenidoHTML = `
                        <div class="multimedia-container audio">
                            <audio controls>
                                <source src="${mensaje.contenido}" type="${mensaje.mime_type || 'audio/webm'}">
                                Tu navegador no soporta la reproducción de audio.
                            </audio>
                        </div>
                    `;
                    break;
                    
                case 'video':
                    // Video
                    contenidoHTML = `
                        <div class="multimedia-container video">
                            <video controls>
                                <source src="${mensaje.contenido}" type="${mensaje.mime_type || 'video/webm'}">
                                Tu navegador no soporta la reproducción de video.
                            </video>
                        </div>
                    `;
                    break;
                    
                default:
                    // Tipo desconocido
                    contenidoHTML = `
                        <div class="multimedia-container desconocido">
                            <div class="mensaje-desconocido">
                                <i class="fas fa-file"></i> Contenido multimedia no soportado
                            </div>
                        </div>
                    `;
            }
            
            // Agregar texto si existe
            if (mensaje.texto) {
                contenidoHTML += `<div class="mensaje-texto">${mensaje.texto}</div>`;
            }
            
            // Determinar si es mensaje privado
            const esPrivado = mensaje.tipo === 'privado' || mensaje.destinatario;
            let claseCSS = esPropio ? "message-usuario" : "message-recibido";
            if (esPrivado) {
                claseCSS += " privado";
            }
            
            // Determinar emisor para mostrar
            let nombreEmisor;
            if (esPropio) {
                nombreEmisor = 'Tú';
                if (esPrivado && mensaje.destinatario) {
                    nombreEmisor += ` → ${obtenerNombreDestinatario(mensaje.destinatario)}`;
                }
            } else {
                nombreEmisor = mensaje.emisor ? 
                    (typeof mensaje.emisor === 'object' ? mensaje.emisor.nombre || mensaje.emisor.usuario : mensaje.emisor) 
                    : 'Desconocido';
                
                if (esPrivado) {
                    nombreEmisor += ' → Ti';
                }
            }
            
            // Agregar el mensaje al chat
            agregarMensajeChat(
                nombreEmisor, 
                contenidoHTML,
                esPropio ? "enviado" : (esPrivado ? "privado" : "recibido"), 
                mensaje.estado || "recibido", 
                mensaje.id
            );
            
            // Reproducir sonido de notificación si no es propio
            if (!esPropio) {
                reproducirSonidoNotificacion(tipo);
            }
            
        } catch (error) {
            console.error("Error al procesar mensaje multimedia:", error);
        }
    }
    
    /**
     * Actualiza la vista de un mensaje con contenido multimedia
     */
    function actualizarVistaMultimedia(mensajeId, tipoContenido, contenidoBase64, texto) {
        const mensajeElement = document.querySelector(`#msg-${mensajeId}`);
        if (!mensajeElement) return;
        
        // Contenedor para el contenido multimedia
        let contenidoHTML = '';
        
        // Agregar contenido según tipo
        switch (tipoContenido) {
            case 'image':
                contenidoHTML = `
                    <div class="multimedia-container imagen">
                        <img src="${contenidoBase64}" alt="Imagen" class="mensaje-imagen" onclick="window.MAIRA.Chat.ampliarImagen('${contenidoBase64}')">
                    </div>
                `;
                break;
            case 'audio':
                contenidoHTML = `
                    <div class="multimedia-container audio">
                        <audio controls>
                            <source src="${contenidoBase64}" type="audio/webm">
                            Tu navegador no soporta la reproducción de audio.
                        </audio>
                    </div>
                `;
                break;
            case 'video':
                contenidoHTML = `
                    <div class="multimedia-container video">
                        <video controls>
                            <source src="${contenidoBase64}" type="video/webm">
                            Tu navegador no soporta la reproducción de video.
                        </video>
                    </div>
                `;
                break;
        }
        
        // Agregar texto si existe
        if (texto) {
            contenidoHTML += `<div class="mensaje-texto">${texto}</div>`;
        }
        
        // Actualizar contenido del mensaje
        const contenidoDiv = mensajeElement.querySelector('div:nth-child(2)');
        if (contenidoDiv) {
            contenidoDiv.innerHTML = contenidoHTML;
        }
    }
    
    /**
     * Ampliar imagen en modal
     * @param {string} src - URL o Data URL de la imagen
     */
    function ampliarImagen(src) {
        // Crear modal para ver la imagen ampliada
        const modal = document.createElement('div');
        modal.className = 'modal-imagen';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        // Imagen
        const imagen = document.createElement('img');
        imagen.src = src;
        imagen.style.maxWidth = '90%';
        imagen.style.maxHeight = '90%';
        imagen.style.border = '2px solid white';
        
        // Botón cerrar
        const btnCerrar = document.createElement('button');
        btnCerrar.innerHTML = '&times;';
        btnCerrar.style.position = 'absolute';
        btnCerrar.style.top = '15px';
        btnCerrar.style.right = '15px';
        btnCerrar.style.backgroundColor = 'transparent';
        btnCerrar.style.border = 'none';
        btnCerrar.style.color = 'white';
        btnCerrar.style.fontSize = '28px';
        btnCerrar.style.cursor = 'pointer';
        
        btnCerrar.onclick = function() {
            document.body.removeChild(modal);
        };
        
        // Cerrar con escape
        function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', cerrarConEscape);
            }
        }
        document.addEventListener('keydown', cerrarConEscape);
        
        // Cerrar al hacer clic fuera de la imagen
        modal.onclick = function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
        
        // Agregar elementos al modal
        modal.appendChild(imagen);
        modal.appendChild(btnCerrar);
        document.body.appendChild(modal);
    }
    
    /**
     * Reproduce un sonido de notificación según el tipo de mensaje
     * @param {string} tipo - Tipo de mensaje (image, audio, video)
     */
    function reproducirSonidoNotificacion(tipo) {
        try {
            let rutaSonido = '/Client/audio/notification.mp3'; // Sonido por defecto
            
            // Seleccionar sonido según tipo
            switch (tipo) {
                case 'image':
                    rutaSonido = '/Client/audio/image_notification.mp3';
                    break;
                case 'audio':
                    rutaSonido = '/Client/audio/audio_notification.mp3';
                    break;
                case 'video':
                    rutaSonido = '/Client/audio/video_notification.mp3';
                    break;
            }
            
            // Intentar reproducir sonido específico
            const audio = new Audio(rutaSonido);
            audio.play().catch(err => {
                console.log("Error al reproducir sonido específico, usando genérico", err);
                // Sonido genérico como fallback
                const audioGenerico = new Audio('/Client/audio/notification.mp3');
                audioGenerico.play().catch(e => console.log("No se pudo reproducir ningún sonido", e));
            });
        } catch (e) {
            console.warn("Error al reproducir sonido:", e);
        }
    }
    
    /**
     * Obtiene el nombre de un destinatario a partir de su ID
     * @param{string} destinatarioId - ID del destinatario
     * @returns {string} Nombre del destinatario
     */
    function obtenerNombreDestinatario(destinatarioId) {
        if (destinatarioId === "todos") return "Todos";
        if (destinatarioId === "comando") return "Comando";
        
        const elemento = elementosConectados[destinatarioId];
        if (elemento && elemento.datos && elemento.datos.usuario) {
            return elemento.datos.usuario;
        }
        
        // Buscar en el select por si tiene el texto
        const selectDestinatario = document.getElementById('select-destinatario');
        if (selectDestinatario) {
            const option = selectDestinatario.querySelector(`option[value="${destinatarioId}"]`);
            if (option) return option.textContent;
        }
        
        return "Desconocido";
    }
    
    /**
     * Actualiza el estado de un mensaje
     * @param {string} mensajeId - ID del mensaje
     * @param {string} estado - Nuevo estado
     */
    function actualizarEstadoMensaje(mensajeId, estado) {
        const elementoMensaje = document.querySelector(`#msg-${mensajeId}`);
        if (!elementoMensaje) {
            console.warn(`Mensaje con ID ${mensajeId} no encontrado para actualizar estado`);
            return;
        }
        
        const estadoElement = elementoMensaje.querySelector('.estado');
        if (estadoElement) {
            estadoElement.textContent = estado;
            estadoElement.className = `estado ${estado}`;
        } else {
            // Si no existe elemento de estado, crearlo
            const nuevoEstado = document.createElement('span');
            nuevoEstado.className = `estado ${estado}`;
            nuevoEstado.textContent = estado;
            elementoMensaje.appendChild(nuevoEstado);
        }
    }
    
    /**
     * Limpia el historial de chat
     */
    function limpiarHistorialChat() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            agregarMensajeChat("Sistema", "Historial de chat limpiado", "sistema");
        }
        
        // Limpiar conjuntos de control de duplicados
        mensajesEnviados.clear();
        mensajesRecibidos.clear();
    }
    
    /**
     * Exporta el historial de chat a un archivo
     * @param {string} formato - Formato de exportación ('txt', 'json', 'html')
     */
    function exportarHistorialChat(formato = 'txt') {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages || !chatMessages.children.length) {
            MAIRA.Utils.mostrarNotificacion("No hay mensajes para exportar", "warning");
            return;
        }
        
        const mensajes = Array.from(chatMessages.children);
        let contenido = '';
        let nombreArchivo = `chat_${operacionActual}_${new Date().toISOString().slice(0, 10)}.${formato}`;
        let tipoMIME = 'text/plain';
        
        switch (formato) {
            case 'txt':
                mensajes.forEach(msg => {
                    if (msg.classList.contains('message-sistema')) {
                        contenido += `[SISTEMA] ${msg.textContent}\n`;
                    } else {
                        const emisor = msg.querySelector('strong')?.textContent || 'Desconocido';
                        const hora = msg.querySelector('small')?.textContent || '';
                        const texto = msg.querySelector('div:nth-child(2)')?.textContent || '';
                        contenido += `[${hora}] ${emisor}: ${texto}\n`;
                    }
                });
                break;
                
            case 'json':
                const datosJSON = mensajes.map(msg => {
                    if (msg.classList.contains('message-sistema')) {
                        return {
                            tipo: 'sistema',
                            mensaje: msg.textContent,
                            timestamp: new Date().toISOString()
                        };
                    } else {
                        return {
                            tipo: msg.classList.contains('message-usuario') ? 'enviado' : 'recibido',
                            emisor: msg.querySelector('strong')?.textContent || 'Desconocido',
                            hora: msg.querySelector('small')?.textContent || '',
                            mensaje: msg.querySelector('div:nth-child(2)')?.textContent || '',
                            id: msg.id ? msg.id.replace('msg-', '') : null,
                            estado: msg.querySelector('.estado')?.textContent || null
                        };
                    }
                });
                contenido = JSON.stringify(datosJSON, null, 2);
                tipoMIME = 'application/json';
                break;
                
            case 'html':
                contenido = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Historial de Chat - ${operacionActual}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .message { padding: 8px 12px; margin-bottom: 10px; border-radius: 8px; }
        .system { background-color: #f0f0f0; color: #555; font-style: italic; }
        .sent { background-color: #e3f7df; text-align: right; margin-left: 20%; }
        .received { background-color: #f0f8ff; margin-right: 20%; }
        .sender { font-weight: bold; }
        .time { font-size: 12px; color: #777; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Historial de Chat</h1>
        <p>Operación: ${operacionActual}</p>
        <p>Fecha de exportación: ${new Date().toLocaleString()}</p>
    </div>
    <div class="chat-container">`;
                
                mensajes.forEach(msg => {
                    if (msg.classList.contains('message-sistema')) {
                        contenido += `
        <div class="message system">${msg.textContent}</div>`;
                    } else {
                        const emisor = msg.querySelector('strong')?.textContent || 'Desconocido';
                        const hora = msg.querySelector('small')?.textContent || '';
                        const texto = msg.querySelector('div:nth-child(2)')?.textContent || '';
                        const clase = msg.classList.contains('message-usuario') ? 'sent' : 'received';
                        
                        contenido += `
        <div class="message ${clase}">
            <span class="sender">${emisor}</span> <span class="time">${hora}</span>
            <div class="content">${texto}</div>
        </div>`;
                    }
                });
                
                contenido += `
    </div>
</body>
</html>`;
                tipoMIME = 'text/html';
                break;
        }
        
        // Crear y descargar el archivo
        const blob = new Blob([contenido], { type: tipoMIME });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        MAIRA.Utils.mostrarNotificacion(`Historial de chat exportado a ${formato.toUpperCase()}`, "success");
    }
    
    /**
     * Copia el historial de chat al portapapeles
     */
    function copiarHistorialChat() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages || !chatMessages.children.length) {
            MAIRA.Utils.mostrarNotificacion("No hay mensajes para copiar", "warning");
            return;
        }
        
        const mensajes = Array.from(chatMessages.children);
        let contenido = `=== HISTORIAL DE CHAT ===\nOperación: ${operacionActual}\nFecha: ${new Date().toLocaleString()}\n\n`;
        
        mensajes.forEach(msg => {
            if (msg.classList.contains('message-sistema')) {
                contenido += `[SISTEMA] ${msg.textContent}\n`;
            } else {
                const emisor = msg.querySelector('strong')?.textContent || 'Desconocido';
                const hora = msg.querySelector('small')?.textContent || '';
                const texto = msg.querySelector('div:nth-child(2)')?.textContent || '';
                contenido += `[${hora}] ${emisor}: ${texto}\n`;
            }
        });
        
        // Copiar al portapapeles
        if (navigator.clipboard) {
            navigator.clipboard.writeText(contenido)
                .then(() => MAIRA.Utils.mostrarNotificacion("Historial copiado al portapapeles", "success"))
                .catch(err => {
                    console.error("Error al copiar al portapapeles:", err);
                    MAIRA.Utils.mostrarNotificacion("Error al copiar al portapapeles", "error");
                });
        } else {
            // Fallback para navegadores que no soportan clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = contenido;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                MAIRA.Utils.mostrarNotificacion(
                    successful ? "Historial copiado al portapapeles" : "No se pudo copiar al portapapeles", 
                    successful ? "success" : "error"
                );
            } catch (err) {
                console.error("Error al ejecutar copy:", err);
                MAIRA.Utils.mostrarNotificacion("Error al copiar al portapapeles", "error");
            }
            
            document.body.removeChild(textArea);
        }
    }
    
    /**
 * Función para actualizar los destinatarios de mensajes privados
 * Debe ser añadida al módulo Chat
 */
function actualizarDestinatarios(elementosConectados) {
    console.log("Actualizando lista de destinatarios para mensajes privados");
    const destinatariosSelect = document.getElementById('destinatario-mensaje');
    
    if (!destinatariosSelect) {
        console.error("Selector de destinatarios no encontrado");
        return;
    }
    
    // Guardar selección actual
    const seleccionActual = destinatariosSelect.value;
    
    // Vaciar lista actual dejando solo las opciones predeterminadas
    const opcionesFijas = Array.from(destinatariosSelect.options)
        .filter(opt => ['comando', 'todos'].includes(opt.value));
    
    // Limpiar y restaurar opciones fijas
    destinatariosSelect.innerHTML = '';
    opcionesFijas.forEach(opt => destinatariosSelect.appendChild(opt));
    
    // Si no hay elementos conectados o está vacío
    if (!elementosConectados || Object.keys(elementosConectados).length === 0) {
        const mensajeOption = document.createElement('option');
        mensajeOption.disabled = true;
        mensajeOption.textContent = "No hay participantes disponibles";
        destinatariosSelect.appendChild(mensajeOption);
        
        // Mostrar mensaje en la consola para debug
        console.log("No se encontraron elementos conectados para mensajes privados");
        return;
    }
    
    console.log(`Procesando ${Object.keys(elementosConectados).length} elementos para mensajes privados`);
    
    // Añadir cada elemento como opción
    Object.entries(elementosConectados).forEach(([id, elemento]) => {
        // Asegurarse de que el elemento tiene los datos necesarios
        if (!elemento || (!elemento.datos && !elemento.usuario)) {
            return;
        }
        
        // Crear opción
        const option = document.createElement('option');
        option.value = id;
        
        // Determinar el nombre a mostrar
        let nombreMostrar = '';
        
        // Si tiene formato directo
        if (elemento.usuario) {
            nombreMostrar = elemento.usuario;
        }
        // Si tiene formato con datos anidados
        else if (elemento.datos) {
            nombreMostrar = elemento.datos.usuario || 'Sin nombre';
            
            // Añadir designación del elemento si está disponible
            if (elemento.datos.elemento && elemento.datos.elemento.designacion) {
                nombreMostrar += ' (' + elemento.datos.elemento.designacion;
                
                if (elemento.datos.elemento.dependencia) {
                    nombreMostrar += '/' + elemento.datos.elemento.dependencia;
                }
                
                nombreMostrar += ')';
            }
        }
        
        option.textContent = nombreMostrar;
        destinatariosSelect.appendChild(option);
    });
    
    // Restaurar selección previa si existe
    if (seleccionActual && Array.from(destinatariosSelect.options).some(opt => opt.value === seleccionActual)) {
        destinatariosSelect.value = seleccionActual;
    } else {
        // Seleccionar la primera opción disponible
        destinatariosSelect.selectedIndex = 0;
    }
    
    console.log("Lista de destinatarios actualizada correctamente");
}

/**
 * Función para el módulo chat que envía mensaje privado
 */
function enviarMensajePrivado(destinatarioId, contenido) {
    if (!socket) {
        console.error("No hay conexión con el servidor");
        MAIRA.Utils.mostrarNotificacion("No hay conexión con el servidor", "error");
        return false;
    }
    
    if (!usuarioInfo) {
        console.error("No hay información de usuario");
        MAIRA.Utils.mostrarNotificacion("No hay información de usuario", "error");
        return false;
    }
    
    // Crear objeto de mensaje
    const mensaje = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
        },
        destinatario: destinatarioId,
        contenido: contenido,
        tipo: "privado",
        timestamp: new Date().toISOString(),
        operacion: operacionActual
    };
    
    // Enviar al servidor
    socket.emit('mensajePrivado', mensaje);
    
    // También manejarlo localmente
    agregarMensajeChat("Tú", contenido, "self", new Date(), { destinatario: destinatarioId });
    
    return true;
}
    /**
     * Inicializa el menú contextual del chat
     */
    function inicializarMenuContextualChat() {
        // Verificar si ya existe
        if (document.getElementById('menu-contextual-chat')) return;
        
        // Crear elemento para el menú contextual
        const menu = document.createElement('div');
        menu.id = 'menu-contextual-chat';
        menu.className = 'menu-contextual';
        menu.style.position = 'absolute';
        menu.style.display = 'none';
        menu.style.zIndex = '1000';
        menu.style.backgroundColor = '#fff';
        menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        menu.style.borderRadius = '4px';
        menu.style.padding = '8px 0';
        menu.style.minWidth = '150px';
        
        // Agregar opciones
        menu.innerHTML = `
            <div class="menu-item" data-action="copiar">
                <i class="fas fa-copy"></i> Copiar mensaje
            </div>
            <div class="menu-item" data-action="responder">
                <i class="fas fa-reply"></i> Responder
            </div>
            <div class="menu-item" data-action="eliminar">
                <i class="fas fa-trash"></i> Eliminar mensaje
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(menu);
        
        // Estilo para los elementos del menú
        const style = document.createElement('style');
        style.textContent = `
            .menu-contextual .menu-item {
                padding: 8px 16px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .menu-contextual .menu-item:hover {
                background-color: #f0f0f0;
            }
            
            .menu-contextual .menu-item i {
                margin-right: 8px;
                width: 16px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
        
        // Variable para almacenar el mensaje seleccionado
        let mensajeSeleccionado = null;
        
        // Agregar listener para clic derecho en mensajes
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.addEventListener('contextmenu', function(e) {
                // Buscar el mensaje más cercano
                const mensaje = e.target.closest('.message');
                if (!mensaje) return;
                
                // Prevenir menú contextual por defecto
                e.preventDefault();
                
                // Guardar referencia al mensaje seleccionado
                mensajeSeleccionado = mensaje;
                
                // Mostrar menú en la posición del clic
                menu.style.left = `${e.pageX}px`;
                menu.style.top = `${e.pageY}px`;
                menu.style.display = 'block';
            });
        }
        
        // Configurar acciones del menú
        menu.addEventListener('click', function(e) {
            const item = e.target.closest('.menu-item');
            if (!item || !mensajeSeleccionado) return;
            
            const accion = item.getAttribute('data-action');
            
            switch (accion) {
                case 'copiar':
                    // Copiar contenido del mensaje
                    const contenido = mensajeSeleccionado.querySelector('div:nth-child(2)')?.textContent || '';
                    navigator.clipboard.writeText(contenido)
                        .then(() => MAIRA.Utils.mostrarNotificacion("Mensaje copiado al portapapeles", "success"))
                        .catch(err => MAIRA.Utils.mostrarNotificacion("Error al copiar mensaje", "error"));
                    break;
                    
                case 'responder':
                    // Implementar respuesta
                    const emisor = mensajeSeleccionado.querySelector('strong')?.textContent || '';
                    const textoMensaje = mensajeSeleccionado.querySelector('div:nth-child(2)')?.textContent || '';
                    
                    // Insertar referencia al mensaje en el input
                    const mensajeInput = document.getElementById('mensaje-chat');
                    if (mensajeInput) {
                        mensajeInput.value = `@${emisor}: ${mensajeInput.value}`;
                        mensajeInput.focus();
                    }
                    break;
                    
                case 'eliminar':
                    // Solo permitir eliminar mensajes propios
                    if (mensajeSeleccionado.classList.contains('message-usuario')) {
                        mensajeSeleccionado.remove();
                        MAIRA.Utils.mostrarNotificacion("Mensaje eliminado", "success");
                    } else {
                        MAIRA.Utils.mostrarNotificacion("Solo puedes eliminar tus propios mensajes", "warning");
                    }
                    break;
            }
            
            // Ocultar menú
            menu.style.display = 'none';
        });
        
        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', function() {
            menu.style.display = 'none';
        });
    }
    


/**
 * Mejorar la sincronización de elementos con el chat
 */
function sincronizarElementosChat(elementos) {
    if (!elementos) {
        console.warn("No se proporcionaron elementos para sincronizar en el chat");
        return;
    }
    
    console.log(`Sincronizando módulo Chat con ${Object.keys(elementos).length} elementos`);
    
    // Actualizar referencia local a elementos conectados
    elementosConectados = elementos;
    
    // Actualizar la referencia global para coherencia
    window.elementosConectados = elementos;
    
    // Actualizar lista de destinatarios
    actualizarListaDestinatarios();
    
    // Actualizar estado de elementos en la interfaz si existe una función para ello
    if (typeof actualizarEstadoElementosChat === 'function') {
        actualizarEstadoElementosChat();
    }
}

/**
 * Función mejorada para actualizar la lista de destinatarios
 */

function actualizarListaDestinatarios() {
    console.log("Actualizando lista de destinatarios para mensajes privados...");
    
    // Obtener el select
    const selectDestinatario = document.getElementById('select-destinatario');
    if (!selectDestinatario) {
        console.error("No se encontró el selector de destinatarios");
        return;
    }
    
    // Guardar selección actual
    const seleccionActual = selectDestinatario.value;
    
    // Mantener opciones fijas (comando, todos)
    const opcionesFijas = Array.from(selectDestinatario.querySelectorAll('option:not([data-elemento])'));
    
    // Limpiar select
    selectDestinatario.innerHTML = '';
    
    // Restaurar opciones fijas
    opcionesFijas.forEach(opcion => {
        selectDestinatario.appendChild(opcion);
    });
    
    // Si no hay opciones fijas, crear las básicas
    if (opcionesFijas.length === 0) {
        const opcionTodos = document.createElement('option');
        opcionTodos.value = 'todos';
        opcionTodos.textContent = 'Todos los participantes';
        selectDestinatario.appendChild(opcionTodos);
        
        const opcionComando = document.createElement('option');
        opcionComando.value = 'comando';
        opcionComando.textContent = 'Comando/Central';
        selectDestinatario.appendChild(opcionComando);
        
        const separador = document.createElement('option');
        separador.disabled = true;
        separador.textContent = '───────────────';
        selectDestinatario.appendChild(separador);
    }
    
    // Obtener ID propio para excluirlo
    const idUsuarioActual = (window.usuarioInfo && window.usuarioInfo.id) || 
                           (window.MAIRA && window.MAIRA.GestionBatalla && 
                            window.MAIRA.GestionBatalla.usuarioInfo && 
                            window.MAIRA.GestionBatalla.usuarioInfo.id);
    
    // Obtener lista actualizada de elementos
    const elementos = window.elementosConectados || 
                     (window.MAIRA && window.MAIRA.GestionBatalla && 
                      window.MAIRA.GestionBatalla.elementosConectados) || {};
    
    console.log("Elementos disponibles para chat privado:", Object.keys(elementos).length, elementos);
    
    // Añadir cada elemento como opción (excluyendo al usuario actual)
    Object.entries(elementos).forEach(([id, elemento]) => {
        // No añadir al usuario actual a la lista
        if (id === idUsuarioActual) {
            console.log(`Omitiendo usuario propio (${id}) como destinatario`);
            return;
        }
        
        // Datos del elemento
        const datos = elemento.datos || elemento;
        if (!datos) return;
        
        console.log(`-> Elemento ${id}: ${datos.usuario || 'Sin nombre'}`);
        
        // Crear formato de nombre
        let nombreMostrado = datos.usuario || 'Usuario';
        
        // Añadir designación/dependencia si está disponible
        if (datos.elemento) {
            if (datos.elemento.designacion) {
                nombreMostrado = `${datos.elemento.designacion} (${nombreMostrado})`;
                
                if (datos.elemento.dependencia) {
                    nombreMostrado = `${datos.elemento.designacion} / ${datos.elemento.dependencia} (${nombreMostrado})`;
                }
            }
        }
        
        // Crear opción
        const option = document.createElement('option');
        option.value = id;
        option.textContent = nombreMostrado;
        option.dataset.elemento = 'true';
        
        selectDestinatario.appendChild(option);
    });
    
    // Restaurar selección anterior si es posible
    if (seleccionActual && Array.from(selectDestinatario.options).some(opt => opt.value === seleccionActual)) {
        selectDestinatario.value = seleccionActual;
    }
    
    console.log(`Lista de destinatarios actualizada con ${selectDestinatario.options.length - opcionesFijas.length} participantes disponibles`);
}


/**
 * Procesa un mensaje de chat para extraer información de elementos
 */
function procesarMensajeParaElementos(mensaje) {
    if (!mensaje || !mensaje.emisor) return;
    
    // Verificar si hay información de emisor en el mensaje
    if (mensaje.emisor && mensaje.emisor.id && mensaje.emisor.nombre) {
        console.log("Extrayendo información de elemento desde mensaje de chat:", mensaje.emisor);
        
        // Construir objeto de elemento
        const elementoDesdeChat = {
            id: mensaje.emisor.id,
            usuario: mensaje.emisor.nombre,
            elemento: mensaje.emisor.elemento || {},
            timestamp: mensaje.timestamp || new Date().toISOString(),
            conectado: true
        };
        
        // Procesar como un elemento recibido
        if (typeof procesarElementosRecibidos === 'function') {
            procesarElementosRecibidos(elementoDesdeChat);
        } else if (typeof MAIRA?.Elementos?.procesarElementosRecibidos === 'function') {
            MAIRA.Elementos.procesarElementosRecibidos(elementoDesdeChat);
        } else if (window.elementosConectados) {
            // Solución manual si no hay función específica
            window.elementosConectados[elementoDesdeChat.id] = {
                datos: elementoDesdeChat
            };
            
            // Actualizar destinatarios
            actualizarListaDestinatarios();
        }
    }
}


/**
 * Solución para evitar mensajes duplicados en el chat
 * Añade esta función en chatGB.js o modifica la existente
 */

// Mejora para evitar mensajes duplicados
function recibirMensajeChat(mensaje) {
    if (!mensaje) {
        console.warn("Mensaje vacío recibido");
        return;
    }
    
    try {
        console.log("Procesando mensaje recibido:", mensaje);
        
        // Obtener el ID del usuario actual
        const usuarioActualId = usuarioInfo?.id || 
                               (window.MAIRA?.GestionBatalla?.usuarioInfo?.id) || 
                               (window.usuarioInfo?.id);
        
        // Normalizar el formato del mensaje para mostrar
        let emisorId = '';
        let emisorNombre = '';
        let contenidoMensaje = '';
        let tipoMensaje = 'recibido';
        
        // Extraer el ID del emisor según el formato del mensaje
        if (mensaje.emisor && mensaje.emisor.id) {
            emisorId = mensaje.emisor.id;
            emisorNombre = mensaje.emisor.nombre || mensaje.emisor.usuario || 'Desconocido';
            contenidoMensaje = mensaje.contenido || mensaje.mensaje || '';
        } else if (mensaje.usuarioId) {
            emisorId = mensaje.usuarioId;
            emisorNombre = mensaje.usuario || 'Desconocido';
            contenidoMensaje = mensaje.mensaje || '';
        } else {
            emisorNombre = mensaje.usuario || 'Desconocido';
            contenidoMensaje = mensaje.mensaje || '';
        }
        
        // IMPORTANTE: Detectar si es un mensaje propio según el ID
        const esMensajePropio = (emisorId && emisorId === usuarioActualId) || 
                               (emisorNombre === usuarioInfo?.usuario);
        
        // IMPORTANTE: Verificar si este mensaje ya fue procesado antes para evitar duplicados
        if (mensaje.id && mensajesRecibidos && mensajesRecibidos.has(mensaje.id)) {
            console.log(`Mensaje duplicado ignorado: ${mensaje.id}`);
            return;
        }
        
        // Registrar ID de mensaje para evitar duplicados futuros
        if (mensaje.id && mensajesRecibidos) {
            mensajesRecibidos.add(mensaje.id);
        }
        
        // CASO 1: Mensaje propio que ya mostramos al enviarlo
        if (esMensajePropio && mensaje.id && mensajesEnviados && mensajesEnviados.has(mensaje.id)) {
            console.log(`Mensaje propio ya mostrado (echo del servidor), ignorando: ${mensaje.id}`);
            return;
        }
        
        // CASO 2: Mensaje del sistema
        if (emisorNombre === "Sistema" || emisorNombre === "Servidor") {
            tipoMensaje = "sistema";
        }
        // CASO 3: Mensaje propio que aún no hemos mostrado
        else if (esMensajePropio) {
            tipoMensaje = "enviado";
            
            // Registrar como mensaje enviado para evitar duplicados
            if (mensaje.id && mensajesEnviados) {
                mensajesEnviados.add(mensaje.id);
            }
        }
        
        // Mostrar el mensaje
        console.log(`Mostrando mensaje ${esMensajePropio ? 'propio' : 'recibido'}: ${emisorNombre} - ${contenidoMensaje.substring(0, 20)}`);
        
        agregarMensajeChat(
            emisorNombre, 
            contenidoMensaje, 
            tipoMensaje, 
            mensaje.estado || 'recibido', 
            mensaje.id
        );
        
        // Extraer información de elemento
        extraerInfoElementoDesdeChat(mensaje);
        
    } catch (error) {
        console.error("Error al procesar mensaje:", error);
    }
}

// Función auxiliar para extraer información de elemento desde el chat
function extraerInfoElementoDesdeChat(mensaje) {
    // Si hay información de emisor con ID
    if (mensaje.emisor && mensaje.emisor.id) {
        console.log("Extrayendo información de elemento desde mensaje:", mensaje.emisor);
        
        const elementoDatos = {
            id: mensaje.emisor.id,
            usuario: mensaje.emisor.nombre || mensaje.emisor.usuario,
            elemento: mensaje.emisor.elemento || {},
            timestamp: mensaje.timestamp,
            conectado: true
        };
        
        // Si hay información de posición, añadirla
        if (mensaje.emisor.posicion || mensaje.posicion) {
            elementoDatos.posicion = mensaje.emisor.posicion || mensaje.posicion;
        }
        
        // Actualizar en elementosConectados si existe
        actualizarElementoEnLista(elementoDatos);
    }
    // O si hay userId directo
    else if (mensaje.usuarioId && mensaje.usuario) {
        const elementoDatos = {
            id: mensaje.usuarioId,
            usuario: mensaje.usuario,
            timestamp: mensaje.timestamp,
            conectado: true
        };
        
        // Actualizar en elementosConectados si existe
        actualizarElementoEnLista(elementoDatos);
    }
}

/**
 * Procesa un elemento específico para detección de mensajes o notificaciones
 * @param {Object} elemento - El elemento a procesar
 * @param {boolean} [esNuevo=false] - Indica si es un elemento recién conectado
 */
function procesarElementoParaChat(elemento, esNuevo = false) {
    if (!elemento || !elemento.id) return;
    
    // Si es un elemento nuevo, mostrar notificación en el chat
    if (esNuevo && elemento.id !== usuarioInfo?.id) {
        const nombreElemento = elemento.usuario || 
                              elemento.nombre || 
                              (elemento.elemento && elemento.elemento.designacion) || 
                              'Elemento';
                              
        agregarMensajeChat("Sistema", `${nombreElemento} se ha conectado`, "sistema");
        
        // Si tiene permisos de notificación, mostrar una notificación nativa
        if (Notification && Notification.permission === "granted") {
            const notificacion = new Notification("Nuevo participante", {
                body: `${nombreElemento} se ha conectado a la operación`,
                icon: "/images/icon.png"
            });
            
            // Cerrar automáticamente después de 5 segundos
            setTimeout(() => notificacion.close(), 5000);
        }
    }
}

/**
 * Inicializa permiso de notificaciones para el chat
 * Debe llamarse durante la inicialización del módulo
 */
function inicializarNotificacionesChat() {
    // Verificar si el navegador soporta notificaciones
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones desktop");
        return;
    }
    
    // Comprobar si ya tenemos permisos
    if (Notification.permission === "granted") {
        console.log("Permisos de notificación ya concedidos");
        return;
    }
    
    // Si no se ha decidido, pedir permiso
    if (Notification.permission !== "denied") {
        // Intentar solicitar permiso en respuesta a una acción del usuario
        document.addEventListener('click', function solicitarPermiso() {
            Notification.requestPermission().then(function(permission) {
                if (permission === "granted") {
                    console.log("Permiso de notificaciones concedido");
                }
                // Eliminar el listener después de la primera solicitud
                document.removeEventListener('click', solicitarPermiso);
            });
        });
    }
}

/**
 * Mejora para la reconexión y reenvío de mensajes pendientes
 * Esta función debe ser llamada cuando se detecte una reconexión
 */
function manejarReconexionChat() {
    console.log("Manejando reconexión para el chat");
    
    // Actualizar lista de destinatarios
    setTimeout(actualizarListaDestinatarios, 1000);
    
    // Intentar reenviar mensajes pendientes
    const mensajesPendientes = JSON.parse(localStorage.getItem('gb_mensajes_pendientes') || '[]');
    if (mensajesPendientes.length > 0) {
        console.log(`Intentando reenviar ${mensajesPendientes.length} mensajes pendientes`);
        
        // Filtrar mensajes para esta operación
        const mensajesOperacion = mensajesPendientes.filter(m => m.sala === operacionActual);
        
        let reenviados = 0;
        mensajesOperacion.forEach(mensaje => {
            if (socket && socket.connected) {
                try {
                    // Marcar como enviando
                    actualizarEstadoMensaje(mensaje.id, "enviando");
                    
                    // Seleccionar evento correcto según tipo
                    if (mensaje.tipo === 'privado' || mensaje.destinatario) {
                        socket.emit('mensajePrivado', mensaje);
                    } else if (mensaje.tipo_contenido) {
                        socket.emit('mensajeMultimedia', mensaje);
                    } else {
                        socket.emit('mensajeChat', mensaje);
                    }
                    
                    reenviados++;
                } catch (error) {
                    console.error(`Error al reenviar mensaje ${mensaje.id}:`, error);
                    actualizarEstadoMensaje(mensaje.id, "error");
                }
            }
        });
        
        // Guardar solo los mensajes no reenviados o de otras operaciones
        const mensajesRestantes = mensajesPendientes.filter(m => 
            m.sala !== operacionActual || (m.sala === operacionActual && reenviados === 0)
        );
        
        localStorage.setItem('gb_mensajes_pendientes', JSON.stringify(mensajesRestantes));
        
        if (reenviados > 0) {
            agregarMensajeChat("Sistema", `Se han reenviado ${reenviados} mensajes pendientes`, "sistema");
            MAIRA.Utils.mostrarNotificacion(`${reenviados} mensajes reenviados`, "success");
        }
    }
}   
    function manejarMensajeNoEntregado(mensaje) {
    // Marcar mensaje como pendiente
    mensaje.estado = "pendiente";
    
    // Almacenar en localStorage para reintento posterior
    const mensajesPendientes = JSON.parse(localStorage.getItem('gb_mensajes_pendientes') || '[]');
    mensajesPendientes.push(mensaje);
    localStorage.setItem('gb_mensajes_pendientes', JSON.stringify(mensajesPendientes));
    
    // Actualizar interfaz
    actualizarEstadoMensaje(mensaje.id, "pendiente");
    
    console.log("Mensaje guardado para reenvío cuando se recupere la conexión");
}

// Función para reintentar envío
function reenviarMensajesPendientes() {
    const mensajesPendientes = JSON.parse(localStorage.getItem('gb_mensajes_pendientes') || '[]');
    if (!mensajesPendientes.length) return;
    
    console.log(`Reintentando envío de ${mensajesPendientes.length} mensajes pendientes`);
    
    // Filtrar mensajes para esta operación
    const mensajesOperacion = mensajesPendientes.filter(m => m.sala === operacionActual);
    
    mensajesOperacion.forEach(mensaje => {
        if (socket && socket.connected) {
            // Intentar reenviar
            if (mensaje.tipo === 'privado') {
                socket.emit('mensajePrivado', mensaje);
            } else {
                socket.emit('mensajeChat', mensaje);
            }
            
            // Actualizar estado en la interfaz
            actualizarEstadoMensaje(mensaje.id, "enviando");
        }
    });
    
    // Guardar solo los mensajes de otras operaciones
    const mensajesRestantes = mensajesPendientes.filter(m => m.sala !== operacionActual);
    localStorage.setItem('gb_mensajes_pendientes', JSON.stringify(mensajesRestantes));
}
/**
     * Envía los mensajes, informes y posiciones pendientes cuando se conecta
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
        socket.emit('actualizarPosicionGBGB', ultimaPosicionPendiente);
        
        // Limpiar posiciones enviadas
        colaPendiente.posiciones = [];
    }
}


return {
        // ... otras funciones ...
        sincronizarElementosChat: sincronizarElementosChat,
        actualizarListaDestinatarios: actualizarListaDestinatarios,
        procesarMensajeParaElementos: procesarMensajeParaElementos,
        recibirMensajeChat: recibirMensajeChat,

        // Funciones principales
        inicializar: inicializar,
        configurarEventosSocket: configurarEventosSocket,
        agregarMensajeChat: agregarMensajeChat,
        enviarMensajeChat: enviarMensajeChat,
        
        // Funciones multimedia
        capturarFotoParaChat: capturarFotoParaChat,
        grabarAudioParaChat: grabarAudioParaChat,
        grabarVideoParaChat: grabarVideoParaChat,
        enviarMensajeMultimedia: enviarMensajeMultimedia,
        enviarPendientes: enviarPendientes,
        ampliarImagen: ampliarImagen,
        
        sincronizarElementosChat: sincronizarElementosChat,
        procesarElementoParaChat: procesarElementoParaChat,
        inicializarNotificacionesChat: inicializarNotificacionesChat,
        manejarReconexionChat: manejarReconexionChat,
        
        // Utilidades
        actualizarListaDestinatarios: actualizarListaDestinatarios,
        limpiarHistorialChat: limpiarHistorialChat,
        exportarHistorialChat: exportarHistorialChat,
        copiarHistorialChat: copiarHistorialChat
    };
})();

// Registrar como módulo global
window.MAIRA.Chat = window.MAIRA.Chat || MAIRA.Chat;