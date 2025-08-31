// 🔍 MAIRA Debug Console Script - Diagnóstico de Partidas Online
// Ejecutar paso a paso en la consola del navegador

// ========== FUNCIÓN PARA ENCONTRAR EL SOCKET ==========
function findSocket() {
    console.log('🔍 Buscando socket en diferentes ubicaciones...');
    
    // Buscar en diferentes ubicaciones posibles
    if (window.socket) {
        console.log('✅ Socket encontrado en window.socket');
        return window.socket;
    }
    if (window.socketManager?.socket) {
        console.log('✅ Socket encontrado en window.socketManager.socket');
        return window.socketManager.socket;
    }
    if (window.io?.socket) {
        console.log('✅ Socket encontrado en window.io.socket');
        return window.io.socket;
    }
    if (window.partidasSocket) {
        console.log('✅ Socket encontrado en window.partidasSocket');
        return window.partidasSocket;
    }
    
    // Buscar en iniciarpartida.js específicamente
    if (window.iniciarpartida && window.iniciarpartida.socket) {
        console.log('✅ Socket encontrado en window.iniciarpartida.socket');
        return window.iniciarpartida.socket;
    }
    
    // Buscar en el namespace global cualquier objeto que parezca un socket
    console.log('🔍 Buscando en el namespace global...');
    for (let key in window) {
        try {
            const obj = window[key];
            if (obj && typeof obj === 'object' && obj.id && obj.connected !== undefined && obj.emit) {
                console.log(`🔍 Socket encontrado en window.${key}`);
                return obj;
            }
        } catch (e) {
            // Ignorar errores de acceso a propiedades
        }
    }
    
    // Buscar en document para elementos que puedan tener referencias al socket
    const scripts = document.querySelectorAll('script');
    console.log(`🔍 Verificando ${scripts.length} scripts en la página...`);
    
    // Intentar acceso directo desde el contexto de Socket.IO
    if (window.io && window.io.managers) {
        for (let url in window.io.managers) {
            const manager = window.io.managers[url];
            if (manager.socket) {
                console.log(`🔍 Socket encontrado en io.managers[${url}].socket`);
                return manager.socket;
            }
            // También verificar sockets individuales
            const sockets = manager.nsps;
            for (let namespace in sockets) {
                const sock = sockets[namespace];
                if (sock && sock.id && sock.connected !== undefined && sock.emit) {
                    console.log(`🔍 Socket encontrado en io.managers[${url}].nsps[${namespace}]`);
                    return sock;
                }
            }
        }
    }
    
    console.log('❌ No se encontró socket en ninguna ubicación conocida');
    return null;
}

// ========== PASO 1: VERIFICAR ESTADO ACTUAL ==========
function debugStep1_CheckCurrentState() {
    console.log('🔍 PASO 1: Verificando estado actual...');
    
    // Verificar Socket con búsqueda mejorada
    const socket = findSocket();
    if (socket) {
        console.log('✅ Socket encontrado:', socket.id);
        console.log('📡 Socket conectado:', socket.connected);
        console.log('🔧 Transporte:', socket.io?.engine?.transport?.name || 'desconocido');
        window.debugSocket = socket; // Guardar referencia para uso posterior
    } else {
        console.log('❌ Socket no encontrado en ninguna ubicación');
    }
    
    // Verificar UserIdentity
    if (window.MAIRA?.UserIdentity) {
        const userId = window.MAIRA.UserIdentity.getUserId();
        const username = window.MAIRA.UserIdentity.getUsername();
        console.log('👤 Usuario ID:', userId);
        console.log('👤 Username:', username);
        
        if (userId && username) {
            console.log('✅ Datos de usuario disponibles');
            return { socket, userId, username };
        } else {
            console.log('❌ Datos de usuario incompletos');
        }
    } else {
        console.log('❌ MAIRA.UserIdentity no encontrado');
    }
    
    // Verificar localStorage
    const userInfo = localStorage.getItem('usuario_info');
    if (userInfo) {
        console.log('💾 Info en localStorage:', JSON.parse(userInfo));
    } else {
        console.log('❌ No hay usuario_info en localStorage');
    }
    
    return { socket, userId: null, username: null };
}

// ========== PASO 2: FORZAR AUTENTICACIÓN ==========
function debugStep2_ForceAuthentication() {
    console.log('🔑 PASO 2: Forzando autenticación...');
    
    const socket = window.debugSocket || findSocket();
    if (!socket || !socket.connected) {
        console.log('❌ Socket no conectado, no se puede autenticar');
        return false;
    }
    
    // Obtener datos de usuario
    let userId, username;
    
    if (window.MAIRA?.UserIdentity) {
        userId = window.MAIRA.UserIdentity.getUserId();
        username = window.MAIRA.UserIdentity.getUsername();
    }
    
    if (!userId || !username) {
        const userInfo = JSON.parse(localStorage.getItem('usuario_info') || '{}');
        userId = userInfo.id;
        username = userInfo.username;
    }
    
    if (!userId || !username) {
        console.log('❌ No se pueden obtener datos de usuario');
        // Usar datos de prueba
        userId = 'debug_user_' + Date.now();
        username = 'DebugUser';
        console.log('🧪 Usando datos de prueba:', { userId, username });
    }
    
    console.log('📤 Enviando autenticación:', { userId, username });
    
    // Limpiar listeners anteriores para evitar duplicados
    socket.off('loginExitoso');
    socket.off('errorLogin');
    
    // Escuchar respuesta de autenticación
    socket.on('loginExitoso', function(data) {
        console.log('✅ Login exitoso recibido:', data);
    });
    
    socket.on('errorLogin', function(error) {
        console.log('❌ Error de login recibido:', error);
    });
    
    // Enviar autenticación - probemos diferentes formatos
    socket.emit('login', {
        userId: userId,
        username: username
    });
    
    // También enviar authenticate (por si acaso)
    socket.emit('authenticate', {
        userId: userId,
        username: username,
        token: localStorage.getItem('authToken') || 'debug_token'
    });
    
    // Y probar el formato que usa la aplicación
    socket.emit('autenticarUsuario', {
        userId: userId,
        username: username
    });
    
    console.log('📨 Autenticación enviada, esperando respuesta...');
    return true;
}

// ========== PASO 3: PROBAR LISTA DE PARTIDAS ==========
function debugStep3_TestGameList() {
    console.log('📋 PASO 3: Probando lista de partidas...');
    
    const socket = window.debugSocket || findSocket();
    if (!socket || !socket.connected) {
        console.log('❌ Socket no conectado');
        return false;
    }
    
    // Limpiar listeners anteriores
    socket.off('listaPartidas');
    socket.off('errorObtenerPartidas');
    
    // Escuchar respuestas
    socket.on('listaPartidas', function(partidas) {
        console.log('✅ Lista de partidas recibida:', partidas);
        if (partidas.length === 0) {
            console.log('ℹ️ No hay partidas disponibles');
        } else {
            partidas.forEach((partida, i) => {
                console.log(`  #${i+1}: ${partida.nombre} (${partida.codigo})`);
            });
        }
    });
    
    socket.on('errorObtenerPartidas', function(error) {
        console.log('❌ Error obteniendo partidas:', error);
    });
    
    // Solicitar lista
    console.log('📤 Solicitando lista de partidas...');
    socket.emit('obtenerPartidasDisponibles');
    
    return true;
}

// ========== PASO 4: CREAR PARTIDA DE PRUEBA ==========
function debugStep4_CreateTestGame() {
    console.log('🎮 PASO 4: Creando partida de prueba...');
    
    const socket = window.debugSocket || findSocket();
    if (!socket || !socket.connected) {
        console.log('❌ Socket no conectado');
        return false;
    }
    
    // Obtener userId actual
    let userId = 'debug_user_' + Date.now();
    if (window.MAIRA?.UserIdentity) {
        userId = window.MAIRA.UserIdentity.getUserId() || userId;
    }
    
    const configuracion = {
        nombrePartida: 'Debug Test - ' + new Date().toLocaleTimeString(),
        duracionPartida: 60,
        duracionTurno: 30,
        objetivoPartida: 'Prueba de diagnóstico',
        modo: 'online',
        creadorId: userId
    };
    
    // Limpiar listeners anteriores
    socket.off('partidaCreada');
    socket.off('errorCrearPartida');
    
    // Escuchar respuestas
    socket.on('partidaCreada', function(partida) {
        console.log('✅ Partida creada exitosamente:', partida);
        console.log(`🎯 Código de partida: ${partida.codigo}`);
        
        // Guardar código para pruebas adicionales
        window.debugGameCode = partida.codigo;
    });
    
    socket.on('errorCrearPartida', function(error) {
        console.log('❌ Error creando partida:', error);
    });
    
    console.log('📤 Enviando crear partida:', configuracion);
    socket.emit('crearPartida', {
        configuracion: configuracion
    });
    
    return true;
}

// ========== PASO 5: UNIRSE A PARTIDA ==========
function debugStep5_JoinGame(codigo) {
    console.log('🚪 PASO 5: Uniéndose a partida...');
    
    if (!codigo) {
        codigo = window.debugGameCode || prompt('Ingresa el código de la partida:');
    }
    
    if (!codigo) {
        console.log('❌ No se proporcionó código de partida');
        return false;
    }
    
    const socket = window.debugSocket || findSocket();
    if (!socket || !socket.connected) {
        console.log('❌ Socket no conectado');
        return false;
    }
    
    // Limpiar listeners anteriores
    socket.off('unidoAPartida');
    socket.off('errorunirseAPartida');
    
    // Escuchar respuestas
    socket.on('unidoAPartida', function(partida) {
        console.log('✅ Unido a partida exitosamente:', partida);
    });
    
    socket.on('errorunirseAPartida', function(error) {
        console.log('❌ Error uniéndose a partida:', error);
    });
    
    console.log('📤 Enviando unirse a partida:', codigo);
    socket.emit('unirseAPartida', {
        codigo: codigo
    });
    
    return true;
}

// ========== FUNCIÓN PARA ESPERAR SOCKET ==========
async function waitForSocket(maxWaitTime = 10000) {
    console.log('⏳ Esperando a que el socket se conecte...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        const socket = findSocket();
        if (socket && socket.connected) {
            console.log('✅ Socket conectado encontrado:', socket.id);
            window.debugSocket = socket;
            return socket;
        }
        
        // Esperar 500ms antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('❌ Timeout esperando socket');
    return null;
}

// ========== FUNCIÓN PRINCIPAL: DIAGNÓSTICO COMPLETO MEJORADO ==========
async function debugFullDiagnostic() {
    console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO DE PARTIDAS ONLINE v2.0');
    console.log('=' + '='.repeat(55));
    
    // Paso 1: Verificar estado inicial
    let result = debugStep1_CheckCurrentState();
    
    if (!result.socket) {
        console.log('⏳ Socket no encontrado, esperando conexión...');
        const socket = await waitForSocket(15000);
        if (!socket) {
            console.log('❌ No se pudo encontrar socket después de esperar');
            return;
        }
        result.socket = socket;
    }
    
    // Configurar listeners para todos los eventos
    debugListenAllEvents();
    
    console.log('\n⏱️ Esperando 2 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Paso 2: Autenticar
    debugStep2_ForceAuthentication();
    
    console.log('\n⏱️ Esperando 3 segundos para autenticación...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Paso 3: Lista de partidas
    debugStep3_TestGameList();
    
    console.log('\n⏱️ Esperando 3 segundos para lista...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Paso 4: Crear partida
    debugStep4_CreateTestGame();
    
    console.log('\n⏱️ Esperando 5 segundos para creación...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Paso 5: Lista actualizada
    console.log('📋 Solicitando lista actualizada...');
    debugStep3_TestGameList();
    
    console.log('\n🏁 DIAGNÓSTICO COMPLETO FINALIZADO');
    console.log('📊 Revisar los logs anteriores para resultados');
}

// ========== FUNCIONES DE UTILIDAD ==========
function debugCheckSocket() {
    const socket = findSocket();
    if (socket) {
        console.log('Socket ID:', socket.id);
        console.log('Conectado:', socket.connected);
        console.log('Transporte:', socket.io?.engine?.transport?.name || 'desconocido');
        console.log('Eventos registrados:', Object.keys(socket._callbacks || {}));
    } else {
        console.log('❌ No hay socket disponible');
    }
}

function debugForceLogin() {
    const socket = findSocket();
    if (!socket) {
        console.log('❌ No se encontró socket');
        return;
    }
    
    const userId = prompt('User ID:', '5');
    const username = prompt('Username:', 'nova2');
    
    if (socket && userId && username) {
        // Limpiar listeners anteriores
        socket.off('loginExitoso');
        socket.off('errorLogin');
        
        socket.on('loginExitoso', (data) => {
            console.log('✅ Login manual exitoso:', data);
        });
        
        socket.on('errorLogin', (error) => {
            console.log('❌ Error login manual:', error);
        });
        
        socket.emit('login', { userId, username });
        console.log('✅ Login manual enviado:', { userId, username });
    }
}

// ========== NUEVA FUNCIÓN: ESCUCHAR TODOS LOS EVENTOS ==========
function debugListenAllEvents() {
    const socket = findSocket();
    if (!socket) {
        console.log('❌ No se encontró socket');
        return;
    }
    
    console.log('🎯 Configurando listeners para todos los eventos...');
    
    // Lista de eventos comunes para escuchar
    const events = [
        'loginExitoso', 'errorLogin', 'authenticated', 'unauthorized',
        'listaPartidas', 'errorObtenerPartidas', 
        'partidaCreada', 'errorCrearPartida',
        'unidoAPartida', 'errorunirseAPartida',
        'partidaIniciada', 'errorIniciarPartida',
        'connect', 'disconnect', 'reconnect',
        'error', 'connect_error'
    ];
    
    events.forEach(event => {
        socket.off(event); // Limpiar listener anterior
        socket.on(event, (data) => {
            console.log(`📨 Evento recibido [${event}]:`, data);
        });
    });
    
    console.log('✅ Listeners configurados para eventos:', events);
}

// ========== INSTRUCCIONES ==========
console.log(`
🔍 MAIRA Debug Console v2.0 - Herramientas Disponibles:

📋 FUNCIONES PASO A PASO:
debugStep1_CheckCurrentState()    - Verificar estado actual
debugStep2_ForceAuthentication()  - Forzar autenticación  
debugStep3_TestGameList()         - Probar lista de partidas
debugStep4_CreateTestGame()       - Crear partida de prueba
debugStep5_JoinGame(codigo)       - Unirse a partida

🚀 FUNCIÓN COMPLETA:
debugFullDiagnostic()            - Ejecutar diagnóstico completo (MEJORADO)
waitForSocket()                  - Esperar a que el socket se conecte

🔧 UTILIDADES:
debugCheckSocket()               - Verificar estado del socket
debugForceLogin()                - Login manual interactivo
debugListenAllEvents()           - Escuchar todos los eventos del socket
findSocket()                     - Buscar socket en diferentes ubicaciones

📖 EJEMPLO DE USO:
1. debugFullDiagnostic()         - Para diagnóstico automático (ahora espera socket)
2. O ejecutar paso a paso:
   waitForSocket()
   debugListenAllEvents()
   debugStep2_ForceAuthentication()
   debugStep3_TestGameList()
   etc...

🎯 NUEVAS FUNCIONALIDADES v2.0:
- findSocket() con búsqueda exhaustiva en io.managers
- waitForSocket() espera activamente la conexión 
- debugFullDiagnostic() ahora espera a que el socket se conecte
- window.socket ahora se expone desde iniciarpartida.js
- Mejor manejo de referencias y limpieza de listeners
`);
