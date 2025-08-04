// Test de verificación de correcciones en Gestión de Batalla
console.log('🔧 VERIFICANDO CORRECCIONES - GESTIÓN DE BATALLA');
console.log('==============================================');

// 1. Test del panel lateral
console.log('\n1. 🏠 Test del Panel Lateral...');
const panel = document.getElementById('panel-lateral');
const botonFlotante = document.getElementById('toggle-panel-btn');
const botonCerrar = document.getElementById('cerrar-panel');

if (panel && botonFlotante && botonCerrar) {
    console.log('✅ Elementos del panel encontrados');
    
    // Test de visibilidad inicial
    const panelOculto = panel.classList.contains('oculto');
    console.log(`   - Panel oculto inicialmente: ${panelOculto ? 'SÍ' : 'NO'}`);
    console.log(`   - Botón flotante visible: ${getComputedStyle(botonFlotante).display !== 'none' ? 'SÍ' : 'NO'}`);
} else {
    console.log('❌ Faltan elementos del panel');
}

// 2. Test de función togglePanel
console.log('\n2. 🔄 Test de Función togglePanel...');
if (typeof togglePanel === 'function') {
    console.log('✅ Función togglePanel disponible');
} else {
    console.log('❌ Función togglePanel NO disponible');
}

// 3. Test de pestañas
console.log('\n3. 📑 Test de Pestañas...');
const pestanas = ['tab-elementos', 'tab-chat', 'tab-informes'];
let pestanasOK = 0;

pestanas.forEach(id => {
    const contenido = document.getElementById(id);
    const boton = document.querySelector(`[data-tab="${id}"]`);
    
    if (contenido && boton) {
        pestanasOK++;
        console.log(`✅ ${id.replace('tab-', '').toUpperCase()} - Completa`);
    } else {
        console.log(`❌ ${id.replace('tab-', '').toUpperCase()} - Incompleta`);
    }
});

console.log(`   Total: ${pestanasOK}/3 pestañas operativas`);

// 4. Test de edición de elementos
console.log('\n4. ✏️ Test de Edición de Elementos...');
if (typeof editarElementoSeleccionadoGB === 'function') {
    console.log('✅ Función editarElementoSeleccionadoGB disponible');
} else {
    console.log('❌ Función editarElementoSeleccionadoGB NO disponible');
}

// 5. Test de MAIRA.Informes
console.log('\n5. 📋 Test de MAIRA.Informes...');
if (window.MAIRA && window.MAIRA.Informes) {
    console.log('✅ MAIRA.Informes disponible');
    const funciones = Object.keys(window.MAIRA.Informes);
    console.log(`   - Funciones disponibles: ${funciones.length}`);
    console.log(`   - Lista: ${funciones.slice(0, 5).join(', ')}${funciones.length > 5 ? '...' : ''}`);
} else {
    console.log('❌ MAIRA.Informes NO disponible');
}

// 6. Test del contenido de informes
console.log('\n6. 🗂️ Test de Contenido de Informes...');
const tabInformes = document.getElementById('tab-informes');
if (tabInformes) {
    const contenidoHtml = tabInformes.innerHTML.trim();
    if (contenidoHtml.includes('dinámicamente') || contenidoHtml.length > 100) {
        console.log('✅ Pestaña informes tiene contenido');
    } else {
        console.log('⚠️ Pestaña informes parece vacía - esperando carga dinámica');
    }
} else {
    console.log('❌ Pestaña informes NO encontrada');
}

// 7. Test de funciones de test
console.log('\n7. 🧪 Test de Funciones de Test...');
const funcionesTest = [
    'ejecutarTestGestionBatalla',
    'demoGestionBatalla'
];

funcionesTest.forEach(func => {
    if (typeof window[func] === 'function') {
        console.log(`✅ ${func} disponible`);
    } else {
        console.log(`❌ ${func} NO disponible`);
    }
});

console.log('\n🎯 VERIFICACIÓN COMPLETADA');
console.log('=========================');

// Comando para test completo
console.log('\n💡 Comandos disponibles:');
console.log('   ejecutarTestGestionBatalla() - Test completo');
console.log('   demoGestionBatalla() - Demo interactiva');
console.log('   togglePanel() - Alternar panel lateral');
