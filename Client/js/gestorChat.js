class GestorChat extends GestorBase {
    constructor() {
        super();
        this.contenedor = null;
        this.mensajes = new Set(); // Cambiado a Set para evitar duplicados
        this.minimizado = true; 
        this.equipoJugador = window.equipoJugador;
        this.socket = null;
        this.mensajesPendientes = new Set();
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
                <button class="btn-enviar">Enviar</button>
            </div>
        `;

        const estilos = document.createElement('style');
        estilos.textContent = `
            .panel-chat {
                position: fixed;
                bottom: 0;
                right: 20px;
                width: 300px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 5px 5px 0 0;
                z-index: 1000;
                font-family: Arial, sans-serif;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .panel-chat.minimizado .chat-messages,
            .panel-chat.minimizado .chat-input {
                display: none;
            }
            .chat-header {
                padding: 10px;
                background: #2196F3;
                color: white;
                border-radius: 5px 5px 0 0;
                border-bottom: 1px solid #1976D2;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .chat-header button {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0 5px;
            }
            .chat-messages {
                height: 200px;
                overflow-y: auto;
                padding: 10px;
                background: white;
            }
            .chat-input {
                padding: 10px;
                background: #f5f5f5;
                border-top: 1px solid #ddd;
                display: flex;
                gap: 5px;
                align-items: center;
            }
            .chat-select {
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 3px;
                background: white;
            }
            .chat-textbox {
                flex-grow: 1;
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 3px;
            }
            .btn-enviar {
                padding: 5px 10px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            .btn-enviar:hover {
                background: #1976D2;
            }
            .mensaje {
                margin: 5px 0;
                padding: 8px;
                border-radius: 5px;
                font-size: 0.9em;
                color: #333;
                word-wrap: break-word;
            }
            .mensaje.equipo {
                background: #e3f2fd;
                border-left: 3px solid #2196F3;
            }
            .mensaje.global {
                background: #f5f5f5;
                border-left: 3px solid #9e9e9e;
            }
            .mensaje.sistema {
                background: #fff3e0;
                border-left: 3px solid #ff9800;
                font-style: italic;
            }
            .hora {
                color: #666;
                font-size: 0.8em;
                margin-right: 5px;
            }
            .emisor {
                color: #2196F3;
                font-weight: bold;
                margin-right: 5px;
            }
            .estado {
                font-size: 0.8em;
                margin-left: 5px;
                float: right;
            }
            .estado.enviando { color: #FFA000; }
            .estado.error { color: #D32F2F; }
            .estado.enviado { color: #388E3C; }
            
            /* Scrollbar personalizado */
            .chat-messages::-webkit-scrollbar {
                width: 6px;
            }
            .chat-messages::-webkit-scrollbar-track {
                background: #f1f1f1;
            }
            .chat-messages::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 3px;
            }
            .chat-messages::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
        `;

        document.head.appendChild(estilos);
        document.body.appendChild(contenedor);
        this.contenedor = contenedor;
    }

    configurarEventos() {
        if (!this.contenedor) return;

        const btnMinimizar = this.contenedor.querySelector('.btn-minimizar');
        const input = this.contenedor.querySelector('input');
        const btnEnviar = this.contenedor.querySelector('.btn-enviar');
        const selectDestino = this.contenedor.querySelector('#chat-destino');

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
            
            // Solo verificamos duplicados para mensajes propios
            if (mensaje.emisor === window.userName) {
                if (mensaje.id && this.mensajes.has(mensaje.id)) {
                    return;
                }
            }

            // Verificar si el mensaje es para nosotros
            if (mensaje.tipo === 'global' || 
                (mensaje.tipo === 'equipo' && mensaje.equipo === this.equipoJugador)) {
                
                // Guardar ID si existe
                if (mensaje.id) {
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

            // Solo guardamos IDs de mensajes propios
            this.mensajes.add(mensajeId);
            
            // No mostramos el mensaje localmente, esperamos el eco del servidor
            this.socket.emit('mensajeJuego', mensajeCompleto);

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
            const hora = new Date(mensaje.timestamp).toLocaleTimeString();
    
            elementoMensaje.innerHTML = `
                <span class="hora">[${hora}]</span>
                <strong class="emisor">${this.escapeHTML(mensaje.emisor)}</strong>: 
                <span class="contenido">${this.escapeHTML(mensaje.contenido)}</span>
                ${mensaje.estado ? `<span class="estado">${mensaje.estado}</span>` : ''}
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
        super.destruir();
    }
}

window.GestorChat = GestorChat;

