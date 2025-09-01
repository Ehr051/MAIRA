/**
 * Auto-ejecutor de tests para desarrollo
 * Se ejecuta automáticamente al cargar la página
 */

// Ejecutar test automático después de que todo se haya cargado
window.addEventListener('load', function() {
    // Esperar un poco más para que todo se inicialice
    setTimeout(async function() {
        console.log('🔄 Ejecutando test automático de planeamiento...');
        
        // Verificar si el test está disponible
        if (typeof window.ejecutarTestPlaneamiento === 'function') {
            try {
                // Ejecutar test rápido automáticamente
                const resultado = await window.ejecutarTestPlaneamiento(true);
                
                if (resultado) {
                    console.log('✅ Test automático completado - Sistema funcionando');
                } else {
                    console.warn('⚠️ Test automático detectó problemas - Ver detalles arriba');
                }
            } catch (error) {
                console.error('❌ Error en test automático:', error);
            }
        } else {
            console.warn('⚠️ Script de test no cargado correctamente');
        }
    }, 5000); // 5 segundos después de cargar la página
});

// Agregar shortcut de teclado para ejecutar test
document.addEventListener('keydown', function(event) {
    // Ctrl + Shift + T = Test completo
    if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        console.log('🧪 Ejecutando test completo por shortcut...');
        if (typeof window.ejecutarTestPlaneamiento === 'function') {
            window.ejecutarTestPlaneamiento(false);
        }
    }
    
    // Ctrl + Alt + T = Test rápido
    if (event.ctrlKey && event.altKey && event.key === 't') {
        event.preventDefault();
        console.log('⚡ Ejecutando test rápido por shortcut...');
        if (typeof window.ejecutarTestPlaneamiento === 'function') {
            window.ejecutarTestPlaneamiento(true);
        }
    }
});

// Agregar función de ayuda
window.ayudaTests = function() {
    console.log('🆘 AYUDA - TESTS DE PLANEAMIENTO');
    console.log('═'.repeat(50));
    console.log('Funciones disponibles:');
    console.log('• ejecutarTestPlaneamiento() - Test completo');
    console.log('• ejecutarTestPlaneamiento(true) - Test rápido');
    console.log('• ayudaTests() - Esta ayuda');
    console.log('\nShortcuts de teclado:');
    console.log('• Ctrl + Shift + T - Test completo');
    console.log('• Ctrl + Alt + T - Test rápido');
    console.log('\nEl test automático se ejecuta 5 segundos después de cargar la página');
    console.log('═'.repeat(50));
};

console.log('🧪 Sistema de tests cargado. Escribe ayudaTests() para ver comandos disponibles');
