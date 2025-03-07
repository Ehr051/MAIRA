class GestorChat extends GestorBase {
    constructor() {
        super();
        this.contenedor = null;
        this.mensajes = new Set(); // Para evitar duplicados
        this.minimizado = true; 
        this.equipoJugador = window.equipoJugador;
        this.socket = null;
        this.mensajesPendientes = new Set();
        this.idsMensajesMostrados = new Set(); // Para rastrear mensajes ya mostrados
    }

    async inicializar(config) {
        try {
            console.log('Inicializando GestorChat...');
            this.gestorJuego = config.gestorJuego;
            this.equipoJugador = window.equipoJugador;
            this.socket = this.gestorJuego?.gestorComunicacion?.socket;
            
            if (!this.socket) {
                throw new Error('Socket no disponible para chat');
            }
            
            const chatExistente = document.getElementById('panel-chat');
            if (chatExistente) chatExistente.remove();

            await this.crearEstructuraChat();
            this.configurarEventos();
            this.configurarSocket();

            console.log('GestorChat inicializado:', {
                equipoJugador: this.equipoJugador,
                socketConnected: this.socket.connected
            });

            return true;
        } catch (error) {
            console.error('Error al inicializar GestorChat:', error);
            throw error;
        }
    }

    async crearEstructuraChat() {
        const contenedor = document.createElement('div');
        contenedor.id = 'panel-chat';
        contenedor.className = 'panel-chat minimizado';

        contenedor.innerHTML = `
            <div class="chat-header">
                <span>Chat</span>
                <button class="btn-minimizar">_</button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <select id="chat-destino" class="chat-select">
                    <option value="global">Global</option>
                    <option value="equipo">Equipo</option>
                </select>
                <input type="text" placeholder="Escribe un mensaje..." class="chat-textbox">
                <button class="btn-enviar"></button>
            </div>
        `;

        const estilos = document.createElement('style');
        estilos.textContent = `
            /* Estilos mejorados para el panel de chat */
            .panel-chat {
                position: fixed;
                bottom: 0;
                right: 20px;
                width: 320px;
                background: rgba(10, 15, 20, 0.9);
                border: 1px solid rgba(2, 129, 168, 0.3);
                border-radius: 10px 10px 0 0;
                z-index: 1000;
                font-family: 'Recursive', sans-serif;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .panel-chat.minimizado .chat-messages,
            .panel-chat.minimizado .chat-input {
                display: none;
            }

            .chat-header {
                padding: 12px 15px;
                background: linear-gradient(135deg, #0281a8 0%, #026d8f 100%);
                color: white;
                border-radius: 10px 10px 0 0;
                border-bottom: 1px solid rgba(2, 129, 168, 0.5);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .chat-header span {
                font-weight: 600;
                letter-spacing: 0.5px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }

            .chat-header button {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0 5px;
                font-size: 16px;
                opacity: 0.8;
                transition: opacity 0.2s;
                outline: none;
            }

            .chat-header button:hover {
                opacity: 1;
            }

            .chat-messages {
                height: 250px;
                overflow-y: auto;
                padding: 12px;
                background: rgba(15, 20, 25, 0.95);
                display: flex;
                flex-direction: column;
            }

            .chat-input {
                padding: 10px;
                background: rgba(20, 25, 30, 0.9);
                border-top: 1px solid rgba(2, 129, 168, 0.2);
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .chat-select {
                padding: 8px;
                border: 1px solid rgba(2, 129, 168, 0.3);
                border-radius: 5px;
                background: rgba(255, 255, 255, 0.05);
                color: #e0e0e0;
                font-size: 0.9em;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
                background-repeat: no-repeat;
                background-position: right 5px center;
                padding-right: 25px;
            }

            .chat-select option {
                background-color: #131414;
                color: #e0e0e0;
            }

            .chat-textbox {
                flex-grow: 1;
                padding: 8px 12px;
                border: 1px solid rgba(2, 129, 168, 0.3);
                border-radius: 30px;
                background: rgba(255, 255, 255, 0.05);
                color: #ffffff;
                font-family: 'Recursive', sans-serif;
                transition: all 0.3s ease;
                outline: none;
            }

            .chat-textbox:focus {
                background: rgba(255, 255, 255, 0.1);
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
                padding: 0;
                position: relative;
            }

            /* Ícono de flecha para el botón Enviar */
            .btn-enviar::before {
                content: '→';
                display: inline-block;
                font-size: 16px;
            }

            .btn-enviar:hover {
                background: linear-gradient(135deg, #026d8f 0%, #025b77 100%);
                transform: translateY(-2px);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
            }

            .btn-enviar:active {
                transform: translateY(1px);
            }

            .mensaje {
                margin: 5px 0;
                padding: 10px 12px;
                border-radius: 8px;
                font-size: 0.95em;
                color: #e0e0e0;
                word-wrap: break-word;
                max-width: 95%;
                align-self: flex-start;
                width: auto;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            .mensaje.equipo {
                background: rgba(2, 129, 168, 0.2);
                border-left: 3px solid #0281a8;
            }

            .mensaje.global {
                background: rgba(255, 255, 255, 0.05);
                border-left: 3px solid rgba(255, 255, 255, 0.2);
            }

            .mensaje.sistema {
                background: rgba(255, 152, 0, 0.1);
                border-left: 3px solid #ff9800;
                font-style: italic;
                align-self: center;
                width: 90%;
            }

            .hora {
                color: rgba(255, 255, 255, 0.5);
                font-size: 0.8em;
                margin-right: 5px;
            }

            .emisor {
                color: #0281a8;
                font-weight: bold;
                margin-right: 5px;
            }

            .contenido {
                display: inline-block;
                margin-top: 3px;
                line-height: 1.4;
            }

            .estado {
                font-size: 0.8em;
                margin-left: 8px;
                margin-top: 2px;
                display: block;
                text-align: right;
                opacity: 0.8;
            }

            .estado.enviando { color: #FFA000; }
            .estado.error { color: #D32F2F; }
            .estado.enviado { color: #4CAF50; }

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

            /* Animación suave para mostrar/minimizar */
            @keyframes slideIn {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }

            .panel-chat:not(.minimizado) {
                animation: slideIn 0.3s ease;
            }
            
            /* Responsive para dispositivos móviles */
            @media (max-width: 480px) {
                .panel-chat {
                    width: 280px;
                    right: 10px;
                }
                
                .chat-messages {
                    height: 200px;
                }
                
                .chat-select {
                    padding: 6px;
                    font-size: 0.85em;
                }
                
                .btn-enviar {
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                }
            }
        `;

        document.head.appendChild(estilos);
        document.body.appendChild(contenedor);
        this.contenedor = contenedor;
    }

    configurarEventos() {
        if (!this.contenedor) return;

        const btnMinimizar = this.contenedor.querySelector('.btn-minimizar');
        const chatHeader = this.contenedor.querySelector('.chat-header');
        const input = this.contenedor.querySelector('.chat-textbox');
        const btnEnviar = this.contenedor.querySelector('.btn-enviar');
        const selectDestino = this.contenedor.querySelector('#chat-destino');

        // Añadir evento de clic al header para minimizar/maximizar (excluyendo el botón)
        chatHeader?.addEventListener('click', (e) => {
            if (e.target !== btnMinimizar) {
                this.toggleMinimizar();
                btnMinimizar.textContent = this.minimizado ? '+' : '_';
            }
        });

        btnMinimizar?.addEventListener('click', () => {
            this.toggleMinimizar();
            btnMinimizar.textContent = this.minimizado ? '+' : '_';
        });

        const enviarMensaje = () => {
            const mensaje = input?.value.trim();
            if (!mensaje) return;

            const datos = {
                contenido: mensaje,
                tipo: selectDestino?.value || 'global',
                equipo: this.equipoJugador,
                emisor: window.userName,
                timestamp: new Date().toISOString(),
                partidaCodigo: window.codigoPartida || window.partidaActual?.codigo
            };

            this.enviarMensaje(datos);
            if (input) input.value = '';
        };

        btnEnviar?.addEventListener('click', enviarMensaje);
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                enviarMensaje();
            }
        });
    }

    configurarSocket() {
        if (!this.socket) return;
        
        const codigoPartida = window.codigoPartida || window.partidaActual?.codigo;
        
        const unirseASalas = () => {
            if (codigoPartida) {
                this.socket.emit('joinRoom', codigoPartida);
                if (this.equipoJugador) {
                    this.socket.emit('joinRoom', `equipo_${this.equipoJugador}`);
                }
            }
        };

        this.socket.on('connect', unirseASalas);

        this.socket.on('mensajeJuego', (mensaje) => {
            console.log('Mensaje recibido:', mensaje);
            
            // Verificar si ya mostramos este mensaje (evitar duplicados)
            if (mensaje.id && this.idsMensajesMostrados.has(mensaje.id)) {
                // Si es nuestro mensaje, actualizar el estado
                if (mensaje.emisor === window.userName && mensaje.estado) {
                    this.actualizarEstadoMensaje(mensaje.id, mensaje.estado);
                }
                return;
            }

            // Verificar si el mensaje es para nosotros
            if (mensaje.tipo === 'global' || 
                (mensaje.tipo === 'equipo' && mensaje.equipo === this.equipoJugador)) {
                
                // Marcar como mostrado
                if (mensaje.id) {
                    this.idsMensajesMostrados.add(mensaje.id);
                    this.mensajes.add(mensaje.id);
                }
                
                // Mostrar el mensaje
                this.mostrarMensaje({
                    ...mensaje,
                    // Solo mostrar estado para mensajes propios
                    estado: mensaje.emisor === window.userName ? mensaje.estado : undefined
                });
            }
        });

        if (this.socket.connected) {
            unirseASalas();
        }
    }

    enviarMensaje(datos) {
        if (!this.socket?.connected) {
            this.mostrarMensajeSistema('Error: No hay conexión disponible');
            return;
        }
        
        try {
            const mensajeId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const mensajeCompleto = {
                ...datos,
                id: mensajeId,
                estado: 'enviando'
            };

            // Registro de mensajes enviados
            this.mensajes.add(mensajeId);
            
            // IMPORTANTE: No mostrar localmente el mensaje, esperar que el servidor lo devuelva
            // para evitar duplicados
            
            // Enviar al servidor
            this.socket.emit('mensajeJuego', mensajeCompleto);
            
            // Marcar como ya mostrado para no duplicar cuando vuelva del servidor
            this.idsMensajesMostrados.add(mensajeId);

            // Establecer un timeout para marcar como error si no se recibe confirmación
            setTimeout(() => {
                const elementoMensaje = this.contenedor?.querySelector(`#msg-${mensajeId}`);
                if (elementoMensaje) {
                    const estadoElement = elementoMensaje.querySelector('.estado');
                    if (estadoElement && estadoElement.textContent === 'enviando') {
                        estadoElement.textContent = 'error';
                        estadoElement.className = 'estado error';
                    }
                }
            }, 5000);

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            this.mostrarMensajeSistema('Error al enviar el mensaje');
        }
    }

    toggleMinimizar() {
        this.minimizado = !this.minimizado;
        this.contenedor?.classList.toggle('minimizado', this.minimizado);
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    mostrarMensajeSistema(texto) {
        const mensaje = {
            contenido: texto,
            tipo: 'sistema',
            emisor: 'Sistema',
            timestamp: new Date().toISOString()
        };
        this.mostrarMensaje(mensaje);
    }

    mostrarMensaje(mensaje) {
        const contenedorMensajes = this.contenedor?.querySelector('.chat-messages');
        if (!contenedorMensajes) return;

        const elementoMensaje = document.createElement('div');
        elementoMensaje.className = `mensaje ${mensaje.tipo}`;
        if (mensaje.id) {
            elementoMensaje.id = `msg-${mensaje.id}`;
        }

        // Formatear hora
        const hora = new Date(mensaje.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        elementoMensaje.innerHTML = `
            <span class="hora">[${hora}]</span>
            <strong class="emisor">${this.escapeHTML(mensaje.emisor)}</strong>
            <span class="contenido">${this.escapeHTML(mensaje.contenido)}</span>
            ${mensaje.estado ? `<span class="estado ${mensaje.estado}">${mensaje.estado}</span>` : ''}
        `;

        contenedorMensajes.appendChild(elementoMensaje);
        contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;

        // Mostrar notificación si está minimizado
        if (this.minimizado) {
            this.mostrarNotificacion(`${mensaje.emisor}: ${mensaje.contenido}`);
        }
    }

    actualizarEstadoMensaje(mensajeId, estado) {
        const elementoMensaje = this.contenedor?.querySelector(`#msg-${mensajeId}`);
        if (elementoMensaje) {
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
    }

    mostrarNotificacion(texto) {
        // Si el navegador soporta notificaciones
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification("Nuevo mensaje", { body: texto });
        }
        // Si no se han pedido permisos aún
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Nuevo mensaje", { body: texto });
                }
            });
        }
    }

    destruir() {
        if (this.socket) {
            this.socket.off('connect');
            this.socket.off('mensajeJuego');
        }

        if (this.contenedor) {
            this.contenedor.remove();
        }

        this.mensajes.clear();
        this.mensajesPendientes.clear();
        this.idsMensajesMostrados.clear();
        super.destruir();
    }
}

window.GestorChat = GestorChat;