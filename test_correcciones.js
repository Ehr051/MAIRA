// Test rápido para verificar las correcciones
console.log('🧪 VERIFICANDO CORRECCIONES...');

// 1. Verificar variable global MAIRA_UI_STATES
console.log('\n1. Verificando MAIRA_UI_STATES...');
if (window.MAIRA_UI_STATES) {
    console.log('✅ MAIRA_UI_STATES está disponible');
    console.log('   - Propiedades:', Object.keys(window.MAIRA_UI_STATES));
} else {
    console.log('❌ MAIRA_UI_STATES NO disponible');
}

// 2. Verificar funciones de test
console.log('\n2. Verificando funciones de test...');
if (typeof window.ejecutarTestGestionBatalla === 'function') {
    console.log('✅ ejecutarTestGestionBatalla disponible');
} else {
    console.log('❌ ejecutarTestGestionBatalla NO disponible');
}

if (typeof window.demoGestionBatalla === 'function') {
    console.log('✅ demoGestionBatalla disponible');
} else {
    console.log('❌ demoGestionBatalla NO disponible');
}

// 3. Verificar funciones de notificaciones
console.log('\n3. Verificando funciones de notificaciones...');
if (typeof incrementarNotificacionTab === 'function') {
    console.log('✅ incrementarNotificacionTab disponible');
} else {
    console.log('❌ incrementarNotificacionTab NO disponible');
}

if (typeof limpiarNotificacionesTab === 'function') {
    console.log('✅ limpiarNotificacionesTab disponible');
} else {
    console.log('❌ limpiarNotificacionesTab NO disponible');
}

// 4. Verificar pestañas
console.log('\n4. Verificando pestañas...');
const pestanas = ['tab-elementos', 'tab-chat', 'tab-informes'];
pestanas.forEach(tabId => {
    const tab = document.getElementById(tabId);
    if (tab) {
        console.log(`✅ ${tabId} encontrada`);
    } else {
        console.log(`❌ ${tabId} NO encontrada`);
    }
});

// 5. Test de funcionalidad
console.log('\n5. Test de funcionalidad de notificaciones...');
try {
    // Simular incremento de notificación
    incrementarNotificacionTab('tab-chat');
    console.log('✅ incrementarNotificacionTab ejecutada sin errores');
    
    // Simular limpieza de notificación
    limpiarNotificacionesTab('tab-chat');
    console.log('✅ limpiarNotificacionesTab ejecutada sin errores');
    
} catch (error) {
    console.log('❌ Error en test de notificaciones:', error.message);
}

console.log('\n🎯 VERIFICACIÓN COMPLETADA');
