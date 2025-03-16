// networkConfig.js
if (typeof SERVER_URL === 'undefined') {
    var currentHost = window.location.hostname;
    var currentProtocol = window.location.protocol;
    
    // Si estamos en un dominio ngrok, no añadir puerto
    if (currentHost.includes('ngrok')) {
        var SERVER_URL = currentProtocol + "//" + currentHost;
        var CLIENT_URL = currentProtocol + "//" + currentHost;
    } else {
        // URLs locales con puertos específicos
        var SERVER_URL = "https://" + currentHost + ":5000";
        var CLIENT_URL = "https://" + currentHost + ":8080";
    }
}




