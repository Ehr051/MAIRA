// iniciarpartida.js: Interacción con la interfaz y conexión de sockets

let partidaActual = null;
let usuariosConectados = new Map();
let listaAmigos = new Set();
let modoSeleccionado = null;
let socket = null;
let userId = null;
let userName = null;

// 🎯 EJECUTAR INMEDIATAMENTE - El DOM ya está cargado cuando el bootstrap llega aquí
console.log('🚀 Inicializando iniciarpartida (ejecución inmediata)');

// Verificar si el DOM está listo, si no esperar
if (document.readyState === 'loading') {
    console.log("⏳ DOM aún cargando, esperando...");
    document.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
    console.log("✅ DOM ya cargado, inicializando iniciarpartida inmediatamente");
    inicializarAplicacion();
}

// Función auxiliar para generar ID de usuario
function generateUserId() {
    return Math.floor(Math.random() * 10000) + 1;
}

function inicializarAplicacion() {
    console.log('🚀 Ejecutando inicialización de iniciarpartida');

    // Verificar si MAIRA.UserIdentity está disponible
    if (!window.MAIRA || !window.MAIRA.UserIdentity) {
        console.warn('⚠️ MAIRA.UserIdentity no disponible, usando datos de localStorage');
        userId = localStorage.getItem('userId') || generateUserId();
        userName = localStorage.getItem('username') || 'Usuario';
        console.log('📝 Usuario fallback:', { userId, userName });
        return;
    }

    // Usar UserIdentity como fuente principal (coherencia en todo MAIRA)
    const userData = MAIRA.UserIdentity.getUserData();

    if (userData && userData.id) {
        userId = userData.id;
        userName = userData.nombre || userData.username;

        // Sincronizar con localStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', userName);

        console.log('✅ Datos de usuario obtenidos desde UserIdentity:', { userId, userName });
    } else {
        console.warn('⚠️ UserIdentity no tiene datos, usando fallback');
        userId = localStorage.getItem('userId') || generateUserId();
        userName = localStorage.getItem('username') || 'Usuario';
    }

    // Asegurar disponibilidad global para otros módulos
    window.userId = userId;
    window.userName = userName;

    console.log('📝 Variables configuradas:', { userId, userName });

    // Inicializar conexión Socket.IO
    inicializarSocket();

    // Inicializar UI y eventos
    inicializarInterfaz();
}

function inicializarSocket() {
    console.log('🔌 Inicializando socket...');

    if (!io) {
        console.error('❌ Socket.IO no está cargado');
        mostrarError('Error: Socket.IO no disponible');
        return;
    }

    // Configurar conexión Socket.IO
    socket = io('https://localhost:5001', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
    });

    // Evento: Conectado exitosamente
    socket.on('connect', function() {
        console.log('✅ Socket conectado exitosamente. ID:', socket.id);
        actualizarEstadoConexion(true);

        // Enviar datos de usuario al servidor
        socket.emit('registrarUsuario', {
            userId: userId,
            userName: userName
        });

        // Solicitar lista de partidas disponibles
        obtenerPartidasDisponibles();
    });

    // Evento: Login exitoso (desde servidor)
    socket.on('loginExitoso', function(data) {
        console.log('✅ Login exitoso recibido:', data);

        if (data.userId) {
            userId = data.userId;
            userName = data.userName;
            window.userId = userId;
            window.userName = userName;

            // Actualizar UI con datos del usuario
            actualizarInfoUsuario(data);

            // Inicializar partidas DESPUÉS de login exitoso
            if (typeof inicializarPartidas === 'function') {
                inicializarPartidas(socket);
            }

            // Inicializar chat DESPUÉS de login exitoso
            if (window.MAIRAChat && typeof window.MAIRAChat.inicializar === 'function') {
                window.MAIRAChat.inicializar({
                    socket: socket,
                    usuario: userName
                });
                console.log('✅ Chat inicializado');
            }

            // Actualizar lista de usuarios conectados
            obtenerUsuariosConectados();
        }
    });

    // Evento: Desconexión
    socket.on('disconnect', function(reason) {
        console.warn('⚠️ Socket desconectado. Razón:', reason);
        actualizarEstadoConexion(false);
        mostrarMensaje('Desconectado del servidor. Reintentando conexión...');
    });

    // Evento: Error de conexión
    socket.on('connect_error', function(error) {
        console.error('❌ Error de conexión socket:', error);
        actualizarEstadoConexion(false);
        mostrarError('Error al conectar con el servidor. Verifica tu conexión.');
    });

    // Evento: Lista de usuarios actualizada
    socket.on('listaUsuarios', function(usuarios) {
        console.log('👥 Lista de usuarios recibida:', usuarios);
        actualizarListaUsuarios(usuarios);
    });

    // Evento: Usuario conectado
    socket.on('usuarioConectado', function(data) {
        console.log('👤 Usuario conectado:', data);
        if (usuariosConectados) {
            usuariosConectados.set(data.userId, data.userName);
            actualizarListaUsuarios(Array.from(usuariosConectados.values()));
        }
    });

    // Evento: Usuario desconectado
    socket.on('usuarioDesconectado', function(data) {
        console.log('👤 Usuario desconectado:', data);
        if (usuariosConectados) {
            usuariosConectados.delete(data.userId);
            actualizarListaUsuarios(Array.from(usuariosConectados.values()));
        }
    });

    // Guardar socket globalmente
    window.socket = socket;
    console.log('✅ Socket configurado y disponible globalmente');
}

function inicializarInterfaz() {
    console.log('🎨 Inicializando interfaz de usuario');

    // Botón para seleccionar modo local
    const btnModoLocal = document.getElementById('btnModoLocal');
    if (btnModoLocal) {
        btnModoLocal.addEventListener('click', function() {
            seleccionarModo('local');
        });
    }

    // Botón para seleccionar modo online
    const btnModoOnline = document.getElementById('btnModoOnline');
    if (btnModoOnline) {
        btnModoOnline.addEventListener('click', function() {
            seleccionarModo('online');
        });
    }

    // Botón volver desde modoLocal
    const btnVolverLocal = document.getElementById('btnVolverLocal');
    if (btnVolverLocal) {
        btnVolverLocal.addEventListener('click', function() {
            volverASeleccionModo();
        });
    }

    // Botón volver desde modoOnline
    const btnVolverOnline = document.getElementById('btnVolverOnline');
    if (btnVolverOnline) {
        btnVolverOnline.addEventListener('click', function() {
            volverASeleccionModo();
        });
    }

    // Botón para mostrar formulario de crear partida
    const btnMostrarCrearPartida = document.getElementById('btnMostrarCrearPartida');
    if (btnMostrarCrearPartida) {
        btnMostrarCrearPartida.addEventListener('click', function() {
            mostrarFormularioCrearPartida();
        });
    }

    // Botón para mostrar formulario de unirse a partida
    const btnMostrarUnirsePartida = document.getElementById('btnMostrarUnirseAPartida');
    if (btnMostrarUnirsePartida) {
        btnMostrarUnirsePartida.addEventListener('click', function() {
            mostrarFormulariounirseAPartida();
        });
    }

    // Botón volver desde formCrearPartida
    const btnVolverCrearPartida = document.getElementById('btnVolverCrearPartida');
    if (btnVolverCrearPartida) {
        btnVolverCrearPartida.addEventListener('click', volverAModoOnline);
    }

    // Botón volver desde formunirseAPartida
    const btnVolverUnirsePartida = document.getElementById('btnVolverunirseAPartida');
    if (btnVolverUnirsePartida) {
        btnVolverUnirsePartida.addEventListener('click', volverAModoOnline);
    }

    console.log('✅ Interfaz inicializada');
}

function seleccionarModo(modo) {
    console.log('🎮 Modo seleccionado:', modo);
    modoSeleccionado = modo;

    // Ocultar selección de modo
    document.getElementById('modoSeleccion').style.display = 'none';

    if (modo === 'local') {
        // Mostrar pantalla de modo local
        document.getElementById('modoLocal').style.display = 'block';
    } else if (modo === 'online') {
        // Mostrar pantalla de modo online
        document.getElementById('modoOnline').style.display = 'block';
        // Solicitar lista de partidas disponibles
        obtenerPartidasDisponibles();
    }
}

function volverASeleccionModo() {
    console.log('🔙 Volviendo a selección de modo');

    // Ocultar ambas pantallas de modo
    document.getElementById('modoLocal').style.display = 'none';
    document.getElementById('modoOnline').style.display = 'none';

    // Mostrar selección de modo
    document.getElementById('modoSeleccion').style.display = 'block';

    modoSeleccionado = null;
}

function mostrarFormularioCrearPartida() {
    console.log('📝 Mostrando formulario crear partida');
    document.getElementById('modoOnline').style.display = 'none';
    document.getElementById('formCrearPartida').style.display = 'block';
}

function mostrarFormulariounirseAPartida() {
    console.log('📝 Mostrando formulario unirse a partida');
    document.getElementById('modoOnline').style.display = 'none';
    document.getElementById('formunirseAPartida').style.display = 'block';
}

function volverAModoOnline() {
    console.log('🔙 Volviendo a modo online');
    document.getElementById('formCrearPartida').style.display = 'none';
    document.getElementById('formunirseAPartida').style.display = 'none';
    document.getElementById('modoOnline').style.display = 'block';

    // Actualizar lista de partidas
    obtenerPartidasDisponibles();
}

function actualizarEstadoConexion(conectado) {
    const estadoElement = document.getElementById('estadoUsuario');
    if (estadoElement) {
        estadoElement.textContent = conectado ? 'Conectado' : 'Desconectado';
        estadoElement.className = conectado ? 'badge bg-success' : 'badge bg-danger';
    }
}

function actualizarInfoUsuario(data) {
    console.log('📝 Actualizando info de usuario:', data);

    const nombreElement = document.getElementById('nombreUsuario');
    if (nombreElement) {
        nombreElement.textContent = data.userName || userName;
    }

    const idElement = document.getElementById('idUsuario');
    if (idElement) {
        idElement.textContent = data.userId || userId;
    }
}

function obtenerUsuariosConectados() {
    if (socket && socket.connected) {
        console.log('📡 Solicitando lista de usuarios conectados');
        socket.emit('obtenerUsuarios');
    }
}

function actualizarListaUsuarios(usuarios) {
    console.log('👥 Actualizando lista de usuarios:', usuarios);

    const listaUsuariosElement = document.getElementById('listaUsuariosConectados');
    if (!listaUsuariosElement) {
        console.warn('⚠️ Elemento listaUsuariosConectados no encontrado');
        return;
    }

    // Limpiar lista actual
    listaUsuariosElement.innerHTML = '';

    // Verificar que usuarios sea un array
    if (!Array.isArray(usuarios)) {
        console.warn('⚠️ La lista de usuarios no es un array:', usuarios);
        return;
    }

    // Agregar cada usuario a la lista
    usuarios.forEach(usuario => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';

        const nombreUsuario = typeof usuario === 'object' ? (usuario.userName || usuario.nombre) : usuario;

        li.innerHTML = `
            <span>${nombreUsuario}</span>
            <span class="badge bg-success rounded-pill">En línea</span>
        `;

        listaUsuariosElement.appendChild(li);
    });

    console.log(`✅ Lista de usuarios actualizada (${usuarios.length} usuarios)`);
}

function obtenerPartidasDisponibles() {
    if (socket && socket.connected) {
        console.log('📡 Solicitando lista de partidas disponibles');
        socket.emit('obtenerPartidas');
    } else {
        console.warn('⚠️ Socket no conectado, no se puede obtener partidas');
    }
}

function crearFilaPartida(partida) {
    const tr = document.createElement('tr');

    const configuracion = typeof partida.configuracion === 'string'
        ? JSON.parse(partida.configuracion)
        : partida.configuracion;

    tr.innerHTML = `
        <td>${configuracion.nombrePartida || 'Sin nombre'}</td>
        <td>${partida.jugadores?.length || 0}/${partida.maxJugadores || 10}</td>
        <td>${configuracion.duracionPartida || 'N/A'} min</td>
        <td>${configuracion.duracionTurno || 'N/A'} min</td>
        <td>
            <button class="btn btn-sm btn-primary" onclick="unirseAPartida('${partida.codigo}')">
                Unirse
            </button>
        </td>
    `;

    return tr;
}

function mostrarMensaje(mensaje) {
    console.log('📢 Mensaje:', mensaje);
    // Implementar notificación visual si es necesario
}

function ocultarTodosLosFormularios() {
    ['modoSeleccion', 'modoLocal', 'modoOnline', 'formCrearPartida', 'formunirseAPartida', 'salaEspera'].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = 'none';
        }
    });
}

// Exportar funciones necesarias
window.inicializarAplicacion = inicializarAplicacion;
window.seleccionarModo = seleccionarModo;
window.volverASeleccionModo = volverASeleccionModo;
window.mostrarFormularioCrearPartida = mostrarFormularioCrearPartida;
window.mostrarFormulariounirseAPartida = mostrarFormulariounirseAPartida;
window.volverAModoOnline = volverAModoOnline;
window.obtenerPartidasDisponibles = obtenerPartidasDisponibles;
window.crearFilaPartida = crearFilaPartida;
window.ocultarTodosLosFormularios = ocultarTodosLosFormularios;
