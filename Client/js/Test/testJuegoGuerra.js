/**
 * TEST ESPECÍFICO - JUEGO DE GUERRA
 * Verifica funcionalidades específicas del modo Juego de Guerra
 * @version 1.0.0
 */

class TestJuegoGuerra {
    constructor() {
        this.resultados = {};
        this.errores = [];
    }

    /**
     * Test completo del modo Juego de Guerra
     */
    async ejecutarTestCompleto() {
        console.log('🎮 INICIANDO TEST JUEGO DE GUERRA');
        console.log('═'.repeat(50));
        
        const tests = [
            'verificarSocket',
            'verificarCreacionPartida',
            'verificarUnirsePartida',
            'verificarSeleccionEquipo',
            'verificarChat',
            'verificarElementosUnidades',
            'verificarComandos',
            'verificarTurnos'
        ];

        let pasados = 0;
        let fallados = 0;

        for (const test of tests) {
            try {
                const resultado = await this[test]();
                this.resultados[test] = resultado;
                
                if (resultado.exito) {
                    pasados++;
                    console.log(`✅ ${test}: ${resultado.mensaje}`);
                } else {
                    fallados++;
                    console.log(`❌ ${test}: ${resultado.mensaje}`);
                }
            } catch (error) {
                fallados++;
                console.error(`💥 ${test} - Error: ${error.message}`);
                this.errores.push({test, error: error.message});
            }
        }

        const resumen = {
            total: tests.length,
            pasados,
            fallados,
            porcentaje: Math.round((pasados / tests.length) * 100)
        };

        console.log('\n📊 RESUMEN TEST JUEGO DE GUERRA:');
        console.log(`Total: ${resumen.total} | ✅ ${resumen.pasados} | ❌ ${resumen.fallados} | 📈 ${resumen.porcentaje}%`);
        
        return resumen;
    }

    async verificarSocket() {
        try {
            if (typeof io === 'undefined') {
                return {exito: false, mensaje: 'Socket.IO no disponible'};
            }
            
            if (window.socket && window.socket.connected) {
                return {exito: true, mensaje: 'Socket conectado correctamente'};
            }
            
            return {exito: false, mensaje: 'Socket no conectado'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando socket: ${error.message}`};
        }
    }

    async verificarCreacionPartida() {
        try {
            // Verificar si existen las funciones de creación
            if (typeof crearPartida === 'function') {
                return {exito: true, mensaje: 'Función crearPartida disponible'};
            }
            
            return {exito: false, mensaje: 'Función crearPartida no encontrada'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando creación: ${error.message}`};
        }
    }

    async verificarUnirsePartida() {
        try {
            if (typeof unirsePartida === 'function') {
                return {exito: true, mensaje: 'Función unirsePartida disponible'};
            }
            
            return {exito: false, mensaje: 'Función unirsePartida no encontrada'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando unirse: ${error.message}`};
        }
    }

    async verificarSeleccionEquipo() {
        try {
            // Verificar elementos de UI para selección de equipo
            const selectores = [
                '#equipoSelector',
                '.equipo-button',
                '#btnListo'
            ];
            
            let encontrados = 0;
            for (const selector of selectores) {
                if (document.querySelector(selector)) {
                    encontrados++;
                }
            }
            
            if (encontrados > 0) {
                return {exito: true, mensaje: `${encontrados}/${selectores.length} elementos de equipo encontrados`};
            }
            
            return {exito: false, mensaje: 'No se encontraron elementos de selección de equipo'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando equipo: ${error.message}`};
        }
    }

    async verificarChat() {
        try {
            if (typeof MAIRAChat !== 'undefined' && MAIRAChat.version) {
                return {exito: true, mensaje: `MAIRAChat ${MAIRAChat.version} disponible`};
            }
            
            return {exito: false, mensaje: 'MAIRAChat no disponible'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando chat: ${error.message}`};
        }
    }

    async verificarElementosUnidades() {
        try {
            // Verificar si los elementos militares están disponibles
            const elementos = [
                'MAIRA.GestionBatalla',
                'milsymbol',
                'unidadesMilitares'
            ];
            
            let disponibles = 0;
            for (const elemento of elementos) {
                if (window[elemento] || eval(`typeof ${elemento} !== 'undefined'`)) {
                    disponibles++;
                }
            }
            
            if (disponibles >= 2) {
                return {exito: true, mensaje: `${disponibles}/${elementos.length} elementos militares disponibles`};
            }
            
            return {exito: false, mensaje: 'Elementos militares insuficientes'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando elementos: ${error.message}`};
        }
    }

    async verificarComandos() {
        try {
            // Verificar panel de comandos
            const panelComandos = document.querySelector('#panelComandos') || 
                                 document.querySelector('.comandos-panel');
            
            if (panelComandos) {
                return {exito: true, mensaje: 'Panel de comandos encontrado'};
            }
            
            return {exito: false, mensaje: 'Panel de comandos no encontrado'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando comandos: ${error.message}`};
        }
    }

    async verificarTurnos() {
        try {
            // Verificar sistema de turnos
            if (typeof iniciarTurno === 'function' || typeof procesarTurno === 'function') {
                return {exito: true, mensaje: 'Sistema de turnos disponible'};
            }
            
            return {exito: false, mensaje: 'Sistema de turnos no encontrado'};
        } catch (error) {
            return {exito: false, mensaje: `Error verificando turnos: ${error.message}`};
        }
    }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.TestJuegoGuerra = TestJuegoGuerra;
    window.ejecutarTestJuegoGuerra = async function() {
        const test = new TestJuegoGuerra();
        return await test.ejecutarTestCompleto();
    };
}

console.log('🎮 TestJuegoGuerra cargado. Ejecuta: ejecutarTestJuegoGuerra()');
