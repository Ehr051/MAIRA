// networkConfig.js
// Versión simplificada compatible con el código existente

// Detectar automáticamente protocolo y host
var currentHost = window.location.hostname;
var currentProtocol = window.location.protocol;

// Variables globales para ser usadas en toda la aplicación
var SERVER_URL, CLIENT_URL, API_BASE_URL;

// Si estamos en un dominio ngrok, NO añadir puerto
if (currentHost.includes('ngrok')) {
    SERVER_URL = `${currentProtocol}//${currentHost}`;
    CLIENT_URL = `${currentProtocol}//${currentHost}`;
    API_BASE_URL = `${currentProtocol}//${currentHost}`;
    console.log("Detectado ngrok: usando configuración optimizada");
} else {
    // URLs locales con puertos específicos
    SERVER_URL = `${currentProtocol}//${currentHost}:5000`;
    CLIENT_URL = `${currentProtocol}//${currentHost}:8080`;
    API_BASE_URL = `${currentProtocol}//${currentHost}:5000`;
}

// Log de las URLs configuradas
console.log("URLs configuradas:", {
    SERVER_URL: SERVER_URL,
    CLIENT_URL: CLIENT_URL,
    API_BASE_URL: API_BASE_URL
});

// Asegurar que las variables están disponibles globalmente
window.SERVER_URL = SERVER_URL;
window.CLIENT_URL = CLIENT_URL;
window.API_BASE_URL = API_BASE_URL;