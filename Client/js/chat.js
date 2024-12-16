// chat.js: Contiene toda la lógica relacionada con el chat


let salaActual = 'lobby';

function inicializarChat(socketInstance) {
    socket = socketInstance;
    
    socket.on('mensajeChat', recibirMensajeChat);
    socket.on('historialChat', cargarHistorialChat);
    socket.on('errorChat', manejarErrorChat);
    socket.on('salaActualizada', manejarSalaActualizada);
    socket.on('enviarMensajeGeneral', (mensaje) => {
        socket.broadcast.to('general').emit('mensajeGeneralRecibido', mensaje);
    });

    socket.on('enviarMensajeSalaEspera', (mensaje) => {
        socket.broadcast.to(`salaEspera_${partidaActual.codigo}`).emit('mensajeRecibido', mensaje);
    });

    inicializarEventListenersChat();
}

function inicializarEventListenersChat() {
    document.getElementById("btnEnviarMensaje").addEventListener("click", enviarMensajeChat);
    document.getElementById("inputChat").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            enviarMensajeChat();
        }
    });
}

function crearElementoMensaje(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'mensaje-chat';
    if (data.usuario === userName) {
        messageElement.classList.add('mensaje-propio');
    }
    messageElement.innerHTML = `
        <span class="usuario-chat">${data.usuario}:</span>
        <span class="contenido-chat">${escapeHTML(data.mensaje)}</span>
        <span class="tiempo-chat">${new Date().toLocaleTimeString()}</span>
    `;
    return messageElement;
}

function cambiarSalaChat(sala) {
    if (sala !== salaActual) {
        socket.emit('cambiarSala', { salaAnterior: salaActual, nuevaSala: sala });
        salaActual = sala;
        limpiarChat();
        socket.emit('obtenerHistorialChat', { sala: salaActual });
    }
}

function limpiarChat() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
}

function cargarHistorialChat(historial) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && Array.isArray(historial)) {
        historial.forEach(mensaje => {
            const messageElement = crearElementoMensaje(mensaje);
            chatMessages.appendChild(messageElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function manejarErrorChat(error) {
    console.error('Error en el chat:', error);
    mostrarMensajeError('Hubo un error en el chat. Por favor, intenta de nuevo.');
}

function mostrarMensajeError(mensaje) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-chat';
    errorElement.textContent = mensaje;
    document.getElementById('chatContainer').prepend(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function manejarSalaActualizada(data) {
    console.log(`Cambiado a la sala: ${data.sala}`);
    limpiarChat();
    salaActual = data.sala;
}

function actualizarInterfazChat() {
    // Actualizar la interfaz del chat según el estado actual
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        chatContainer.style.display = partidaActual ? 'block' : 'none';
    }
}
function enviarMensajeChat() {
    const inputChat = document.getElementById('inputChat');
    const mensaje = inputChat.value.trim();
    if (mensaje) {
        const sala = partidaActual ? partidaActual.codigo : 'general';
        socket.emit('mensajeChat', { usuario: userName, mensaje, sala });
        inputChat.value = '';
        // Añadir el mensaje a la interfaz local inmediatamente
    }
}

function recibirMensajeChat(data) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        const messageElement = crearElementoMensaje(data);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Asegúrate de que esta función esté siendo llamada cuando se recibe un mensaje

window.inicializarChat = inicializarChat;
window.enviarMensajeChat = enviarMensajeChat;
window.cambiarSalaChat = cambiarSalaChat;
window.actualizarInterfazChat = actualizarInterfazChat;
window.inicializarEventListenersChat = inicializarEventListenersChat;
window.crearElementoMensaje = crearElementoMensaje;
window.limpiarChat = limpiarChat;
window.cargarHistorialChat = cargarHistorialChat;
window.manejarErrorChat = manejarErrorChat;
window.mostrarMensajeError = mostrarMensajeError;
window.escapeHTML = escapeHTML;
window.manejarSalaActualizada = manejarSalaActualizada;
window.recibirMensajeChat = recibirMensajeChat;
