// Test específico para verificar las 3 pestañas del panel
console.log('🧪 TEST DE PESTAÑAS - GESTIÓN DE BATALLA');
console.log('=====================================');

// Lista de pestañas esperadas
const pestanasEsperadas = [
    { id: 'tab-elementos', nombre: 'Elementos', icono: '👥' },
    { id: 'tab-chat', nombre: 'Chat', icono: '💬' },
    { id: 'tab-informes', nombre: 'Informes', icono: '📋' }
];

console.log('\n1. 🔍 Verificando existencia de pestañas...');
let pestañasEncontradas = 0;

pestanasEsperadas.forEach(pestaña => {
    // Verificar botón de pestaña
    const botonPestaña = document.querySelector(`[data-tab="${pestaña.id}"]`);
    // Verificar contenido de pestaña
    const contenidoPestaña = document.getElementById(pestaña.id);
    
    if (botonPestaña && contenidoPestaña) {
        console.log(`✅ ${pestaña.icono} ${pestaña.nombre} - Completa`);
        pestañasEncontradas++;
    } else {
        console.log(`❌ ${pestaña.icono} ${pestaña.nombre} - Incompleta`);
        if (!botonPestaña) console.log(`   - Falta botón: [data-tab="${pestaña.id}"]`);
        if (!contenidoPestaña) console.log(`   - Falta contenido: #${pestaña.id}`);
    }
});

console.log(`\n📊 Resultado: ${pestañasEncontradas}/${pestanasEsperadas.length} pestañas operativas`);

// Test de funcionalidad de cambio de pestañas
console.log('\n2. 🔄 Test de cambio de pestañas...');
if (typeof cambiarTab === 'function') {
    console.log('✅ Función cambiarTab disponible');
    
    // Test cada pestaña
    pestanasEsperadas.forEach((pestaña, index) => {
        setTimeout(() => {
            try {
                cambiarTab(pestaña.id);
                console.log(`✅ ${pestaña.icono} Cambio a ${pestaña.nombre} - OK`);
            } catch (error) {
                console.log(`❌ ${pestaña.icono} Error al cambiar a ${pestaña.nombre}:`, error.message);
            }
        }, index * 500);
    });
    
} else {
    console.log('❌ Función cambiarTab NO disponible');
}

// Verificar que no existan referencias a tab-Documentos
console.log('\n3. 🗑️ Verificando eliminación de pestaña Documentos...');
const documentosBoton = document.querySelector('[data-tab="tab-Documentos"]');
const documentosContenido = document.getElementById('tab-Documentos');

if (!documentosBoton && !documentosContenido) {
    console.log('✅ Pestaña Documentos eliminada correctamente');
} else {
    console.log('⚠️ Aún existen referencias a pestaña Documentos:');
    if (documentosBoton) console.log('   - Botón encontrado');
    if (documentosContenido) console.log('   - Contenido encontrado');
}

console.log('\n🎯 TEST DE PESTAÑAS COMPLETADO');
console.log('=====================================');
