// Modificación para getServerUrl.js
async function inicializarConexion() {
    try {
        // Intentar obtener la URL del servidor
        const currentHost = window.location.hostname;
        const baseUrl = `http://${currentHost}:5000`;
        
        // Configurar Socket.IO con opciones explícitas
        const socket = io(baseUrl, {
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            path: '/socket.io',
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            autoConnect: true,
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Manejadores de eventos de conexión
        socket.on('connect', () => {
            console.log('Conectado al servidor:', socket.id);
        });

        socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
            // Intentar reconectar con polling si falla websocket
            if (socket.io.opts.transports.includes('websocket')) {
                console.log('Cambiando a polling...');
                socket.io.opts.transports = ['polling'];
            }
        });

        return socket;
    } catch (error) {
        console.error('Error al inicializar la conexión:', error);
        throw error;
    }
}

// Agregar verificación de estado de conexión
function verificarConexion() {
    const socket = window.socket;
    if (!socket || !socket.connected) {
        console.log('Reconectando...');
        return inicializarConexion();
    }
    return socket;
}

// Exportar para uso en otros archivos
window.inicializarConexion = inicializarConexion;
window.verificarConexion = verificarConexion;