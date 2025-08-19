/**
 * PARCHE PARA RESOLVER PROBLEMAS DE PARTIDAS LAN
 * Aplica correcciones al flujo de creación de partidas
 */

console.log('🔧 Aplicando parche para partidas LAN...');

// 1. MEJORAR EL MANEJO DE EVENTOS partidaCreada
if (typeof manejarPartidaCreada === 'function') {
    const manejarPartidaCreadaOriginal = manejarPartidaCreada;
    
    window.manejarPartidaCreada = function(partida) {
        console.log('🎯 PARCHE: partidaCreada recibido:', partida);
        
        // Verificar que estamos en la página correcta
        if (!window.location.href.includes('iniciarpartida.html')) {
            console.log('🔄 PARCHE: Redirigiendo a iniciarpartida.html...');
            sessionStorage.setItem('partidaPendiente', JSON.stringify(partida));
            window.location.href = `iniciarpartida.html?partida=${partida.codigo}`;
            return;
        }
        
        // Verificar elementos DOM con retry
        function verificarYMostrarSala(reintentos = 3) {
            const salaEspera = document.getElementById('salaEspera');
            const nombrePartidaSala = document.getElementById('nombrePartidaSala');
            const codigoPartidaSala = document.getElementById('codigoPartidaSala');
            
            if (salaEspera && nombrePartidaSala && codigoPartidaSala) {
                console.log('✅ PARCHE: Elementos DOM encontrados, mostrando sala...');
                return manejarPartidaCreadaOriginal(partida);
            }
            
            if (reintentos > 0) {
                console.log(`⏳ PARCHE: Elementos no encontrados, reintentando... (${reintentos} restantes)`);
                setTimeout(() => verificarYMostrarSala(reintentos - 1), 500);
            } else {
                console.error('❌ PARCHE: No se pudieron encontrar elementos DOM después de varios intentos');
                alert('Error: No se puede mostrar la sala de espera. Recargar página.');
            }
        }
        
        verificarYMostrarSala();
    };
}

// 2. VERIFICAR PARTIDA PENDIENTE AL CARGAR PÁGINA
window.addEventListener('DOMContentLoaded', function() {
    const partidaPendiente = sessionStorage.getItem('partidaPendiente');
    if (partidaPendiente) {
        console.log('🔄 PARCHE: Procesando partida pendiente...');
        sessionStorage.removeItem('partidaPendiente');
        
        try {
            const partida = JSON.parse(partidaPendiente);
            setTimeout(() => {
                if (typeof manejarPartidaCreada === 'function') {
                    manejarPartidaCreada(partida);
                }
            }, 1000); // Dar tiempo para que el DOM se configure
        } catch (error) {
            console.error('❌ PARCHE: Error al procesar partida pendiente:', error);
        }
    }
});

// 3. MEJORAR MOSTRAR SALA DE ESPERA con validaciones adicionales
if (typeof mostrarSalaEspera === 'function') {
    const mostrarSalaEsperaOriginal = mostrarSalaEspera;
    
    window.mostrarSalaEspera = function(partida) {
        console.log('👥 PARCHE: Iniciando mostrarSalaEspera mejorado...');
        
        // Verificar elementos requeridos
        const elementosRequeridos = [
            'salaEspera',
            'nombrePartidaSala', 
            'codigoPartidaSala',
            'jugadoresSala'
        ];
        
        const elementosNoEncontrados = elementosRequeridos.filter(id => !document.getElementById(id));
        
        if (elementosNoEncontrados.length > 0) {
            console.error('❌ PARCHE: Elementos DOM faltantes:', elementosNoEncontrados);
            console.log('📍 URL actual:', window.location.href);
            
            // Intentar redirigir si no estamos en la página correcta
            if (!window.location.href.includes('iniciarpartida.html')) {
                console.log('🔄 PARCHE: Redirigiendo a página correcta...');
                sessionStorage.setItem('partidaPendiente', JSON.stringify(partida));
                window.location.href = `iniciarpartida.html?partida=${partida.codigo}`;
                return;
            }
            
            // Si estamos en la página correcta pero faltan elementos, es un error
            alert(`Error: Elementos DOM faltantes: ${elementosNoEncontrados.join(', ')}`);
            return;
        }
        
        console.log('✅ PARCHE: Todos los elementos DOM presentes, continuando...');
        return mostrarSalaEsperaOriginal(partida);
    };
}

// 4. AÑADIR VALIDACIÓN ANTES DE CREAR PARTIDA
if (typeof crearPartida === 'function') {
    const crearPartidaOriginal = crearPartida;
    
    window.crearPartida = function() {
        console.log('🎮 PARCHE: Validando antes de crear partida...');
        
        // Verificar conexión de socket
        if (!socket || !socket.connected) {
            console.error('❌ PARCHE: Socket no conectado');
            alert('Error: No hay conexión con el servidor. Intentar reconectar.');
            return;
        }
        
        // Verificar datos de usuario
        if (!window.userId || !window.userName) {
            console.error('❌ PARCHE: Datos de usuario no configurados');
            alert('Error: Datos de usuario no configurados. Redirigir a inicio.');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ PARCHE: Validaciones pasadas, creando partida...');
        return crearPartidaOriginal();
    };
}

// 5. LOG DE EVENTOS SOCKET PARA DEBUGGING
if (typeof socket !== 'undefined' && socket) {
    console.log('🔍 PARCHE: Configurando monitoreo de eventos socket...');
    
    // Monitorear evento partidaCreada específicamente
    socket.off('partidaCreada'); // Remover listeners existentes
    socket.on('partidaCreada', function(partida) {
        console.log('📥 PARCHE: Evento partidaCreada interceptado:', partida);
        if (typeof manejarPartidaCreada === 'function') {
            manejarPartidaCreada(partida);
        } else {
            console.error('❌ PARCHE: manejarPartidaCreada no disponible');
        }
    });
    
    // Monitorear errores
    socket.on('errorCrearPartida', function(error) {
        console.error('❌ PARCHE: Error al crear partida:', error);
        alert(`Error al crear partida: ${error.mensaje || error}`);
    });
}

console.log('✅ Parche para partidas LAN aplicado exitosamente');
