// networkConfig.js
// Versión optimizada para RENDIMIENTO y configuración de cloud

// Detectar automáticamente protocolo y host
var currentHost = window.location.hostname;
var currentProtocol = window.location.protocol;

// Variables globales para ser usadas en toda la aplicación
var SERVER_URL, CLIENT_URL;

// ✅ OPTIMIZACIÓN: Configuración específica para servicios en la nube
if (currentHost.includes('ngrok') || currentHost.includes('trycloudflare.com') || currentHost.includes('onrender.com')) {
    SERVER_URL = `${currentProtocol}//${currentHost}`;
    CLIENT_URL = `${currentProtocol}//${currentHost}`;
    console.log("Detectado servicio en la nube: usando configuración optimizada");
    
    // ✅ NUEVO: Configuración de Socket.IO optimizada para la nube
    window.SOCKET_CONFIG = {
        reconnectionAttempts: 3,  // ✅ Reducido de 5 a 3 para reconexión más rápida
        timeout: 20000,           // ✅ Reducido de 30000 a 20000 (20 segundos)
        transports: ['polling'],  // ✅ Solo polling para estabilidad
        upgrade: false,           // ✅ No intentar upgrade a websocket
        forceNew: false,          // ✅ Reutilizar conexiones
        autoConnect: true         // ✅ Conectar automáticamente
    };

} else {
    // URLs locales con puertos específicos
    SERVER_URL = `${currentProtocol}//${currentHost}:5000`;
    CLIENT_URL = `${currentProtocol}//${currentHost}:8080`;
    
    // ✅ Configuración local (desarrollo)
    window.SOCKET_CONFIG = {
        reconnectionAttempts: 5,
        timeout: 30000,
        transports: ['polling', 'websocket'],
        upgrade: true,
        forceNew: false,
        autoConnect: true
    };
}

// ✅ NUEVO: Función para obtener configuración optimizada de Socket.IO
window.getSocketConfig = function() {
    return window.SOCKET_CONFIG || {
        reconnectionAttempts: 3,
        timeout: 20000,
        transports: ['polling'],
        upgrade: false
    };
};

// Log de las URLs configuradas
console.log("URLs configuradas:", {
    SERVER_URL: SERVER_URL,
    CLIENT_URL: CLIENT_URL
});

// Asegurar que las variables están disponibles globalmente
window.SERVER_URL = SERVER_URL;
window.CLIENT_URL = CLIENT_URL;