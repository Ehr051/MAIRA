
// test_juego_guerra_flow.js - Test del flujo completo

function testJuegoGuerraFlow() {
    console.log('🧪 INICIANDO TEST: Flujo Juego de Guerra');
    
    const tests = [
        {
            name: 'Verificar gestorTurnos existe',
            test: () => typeof window.gestorTurnos !== 'undefined'
        },
        {
            name: 'Verificar método iniciarFaseCombate',
            test: () => typeof window.gestorTurnos?.iniciarFaseCombate === 'function'
        },
        {
            name: 'Verificar método todosJugadoresListos', 
            test: () => typeof window.gestorTurnos?.todosJugadoresListos === 'function'
        },
        {
            name: 'Verificar conexión socket',
            test: () => typeof socket !== 'undefined' && socket.connected
        }
    ];
    
    tests.forEach((test, index) => {
        const result = test.test();
        const status = result ? '✅' : '❌';
        console.log(`${status} Test ${index + 1}: ${test.name}`);
    });
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testJuegoGuerraFlow, 2000);
});
