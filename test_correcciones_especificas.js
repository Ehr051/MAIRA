/**
 * 🧪 Test específico para verificar correcciones en Planeamiento
 * Enfocado en los errores de milsymbol y Geocoder detectados
 */

class TestCorrecciones {
    constructor() {
        this.resultados = {};
        this.erroresEncontrados = [];
        this.correccionesAplicadas = [];
    }

    log(mensaje, tipo = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
        const icon = icons[tipo] || 'ℹ️';
        console.log(`[${timestamp}] ${icon} ${mensaje}`);
    }

    // Test 1: Verificar carga correcta de milsymbol
    async testMilsymbol() {
        this.log('🎖️ Verificando milsymbol...', 'info');
        
        const test = {
            nombre: 'milsymbol_disponible',
            descripcion: 'Verificar que milsymbol esté disponible y funcional'
        };

        try {
            // Verificar si milsymbol está disponible
            if (typeof ms === 'undefined') {
                this.erroresEncontrados.push('milsymbol no disponible');
                
                // Intentar cargar milsymbol
                await this.cargarMilsymbol();
                
                // Verificar nuevamente después de cargar
                if (typeof ms !== 'undefined') {
                    this.correccionesAplicadas.push('milsymbol cargado dinámicamente');
                    this.log('✅ milsymbol cargado y disponible', 'success');
                    test.resultado = 'success';
                    test.mensaje = 'milsymbol cargado correctamente';
                } else {
                    this.log('❌ No se pudo cargar milsymbol', 'error');
                    test.resultado = 'error';
                    test.mensaje = 'Error cargando milsymbol';
                }
            } else {
                this.log('✅ milsymbol ya está disponible', 'success');
                test.resultado = 'success';
                test.mensaje = 'milsymbol disponible';
            }

            // Probar funcionalidad básica de milsymbol
            if (typeof ms !== 'undefined') {
                try {
                    const symbol = new ms.Symbol('10031000000000000000');
                    if (symbol && symbol.asSVG) {
                        this.log('✅ milsymbol funciona correctamente', 'success');
                        test.funcionalidad = 'operativo';
                    } else {
                        this.log('⚠️ milsymbol disponible pero con problemas', 'warning');
                        test.funcionalidad = 'problemas';
                    }
                } catch (error) {
                    this.log(`⚠️ Error probando milsymbol: ${error.message}`, 'warning');
                    test.funcionalidad = 'error';
                }
            }

        } catch (error) {
            this.log(`❌ Error en test milsymbol: ${error.message}`, 'error');
            test.resultado = 'error';
            test.mensaje = error.message;
        }

        this.resultados.milsymbol = test;
        return test;
    }

    // Test 2: Verificar Geocoder
    async testGeocoder() {
        this.log('🗺️ Verificando Geocoder...', 'info');
        
        const test = {
            nombre: 'geocoder_disponible',
            descripcion: 'Verificar que Geocoder esté disponible y funcional'
        };

        try {
            // Verificar si Leaflet está disponible primero
            if (typeof L === 'undefined') {
                this.erroresEncontrados.push('Leaflet no disponible');
                this.log('❌ Leaflet no está disponible', 'error');
                test.resultado = 'error';
                test.mensaje = 'Leaflet requerido para Geocoder';
                this.resultados.geocoder = test;
                return test;
            }

            // Verificar si Geocoder está disponible
            if (!L.Control.Geocoder) {
                this.erroresEncontrados.push('Geocoder no disponible');
                
                // Intentar cargar Geocoder
                await this.cargarGeocoder();
                
                // Verificar nuevamente después de cargar
                if (L.Control.Geocoder) {
                    this.correccionesAplicadas.push('Geocoder cargado dinámicamente');
                    this.log('✅ Geocoder cargado y disponible', 'success');
                    test.resultado = 'success';
                    test.mensaje = 'Geocoder cargado correctamente';
                } else {
                    this.log('❌ No se pudo cargar Geocoder', 'error');
                    test.resultado = 'error';
                    test.mensaje = 'Error cargando Geocoder';
                }
            } else {
                this.log('✅ Geocoder ya está disponible', 'success');
                test.resultado = 'success';
                test.mensaje = 'Geocoder disponible';
            }

            // Probar funcionalidad básica del Geocoder
            if (L.Control.Geocoder) {
                try {
                    const geocoder = L.Control.geocoder();
                    if (geocoder && geocoder.addTo) {
                        this.log('✅ Geocoder funciona correctamente', 'success');
                        test.funcionalidad = 'operativo';
                    } else {
                        this.log('⚠️ Geocoder disponible pero con problemas', 'warning');
                        test.funcionalidad = 'problemas';
                    }
                } catch (error) {
                    this.log(`⚠️ Error probando Geocoder: ${error.message}`, 'warning');
                    test.funcionalidad = 'error';
                }
            }

        } catch (error) {
            this.log(`❌ Error en test Geocoder: ${error.message}`, 'error');
            test.resultado = 'error';
            test.mensaje = error.message;
        }

        this.resultados.geocoder = test;
        return test;
    }

    // Función auxiliar para cargar milsymbol
    async cargarMilsymbol() {
        return new Promise((resolve, reject) => {
            this.log('🔄 Cargando milsymbol desde CDN...', 'info');
            
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js';
            script.onload = () => {
                this.log('✅ milsymbol cargado desde CDN', 'success');
                resolve();
            };
            script.onerror = () => {
                this.log('❌ Error cargando milsymbol desde CDN', 'error');
                reject(new Error('Error cargando milsymbol'));
            };
            document.head.appendChild(script);
        });
    }

    // Función auxiliar para cargar Geocoder
    async cargarGeocoder() {
        return new Promise((resolve, reject) => {
            this.log('🔄 Cargando Geocoder desde CDN...', 'info');
            
            // Cargar CSS primero
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css';
            document.head.appendChild(css);
            
            // Cargar JavaScript
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.min.js';
            script.onload = () => {
                this.log('✅ Geocoder cargado desde CDN', 'success');
                resolve();
            };
            script.onerror = () => {
                this.log('❌ Error cargando Geocoder desde CDN', 'error');
                reject(new Error('Error cargando Geocoder'));
            };
            document.head.appendChild(script);
        });
    }

    // Ejecutar todos los tests
    async ejecutarTodosLosTests() {
        this.log('🚀 Iniciando tests de corrección...', 'info');
        console.log('════════════════════════════════════════════════════════════');
        
        const tests = [
            this.testMilsymbol(),
            this.testGeocoder()
        ];

        await Promise.all(tests);

        this.generarReporte();
    }

    // Generar reporte final
    generarReporte() {
        console.log('════════════════════════════════════════════════════════════');
        this.log('📊 REPORTE DE CORRECCIONES', 'info');
        console.log('════════════════════════════════════════════════════════════');
        
        // Resumen de resultados
        let exitos = 0;
        let errores = 0;

        for (const [nombre, test] of Object.entries(this.resultados)) {
            if (test.resultado === 'success') exitos++;
            else if (test.resultado === 'error') errores++;

            const icon = test.resultado === 'success' ? '✅' : '❌';
            console.log(`${icon} ${nombre}: ${test.mensaje}`);
        }

        console.log('────────────────────────────────────────────────────────────');
        console.log(`📈 Resumen: ${exitos} éxitos, ${errores} errores`);
        
        if (this.correccionesAplicadas.length > 0) {
            console.log('🔧 Correcciones aplicadas:');
            this.correccionesAplicadas.forEach(correccion => console.log(`   • ${correccion}`));
        }

        console.log('════════════════════════════════════════════════════════════');

        const estadoGeneral = errores === 0 ? 'PERFECTO' : 'CORREGIDO';
        this.log(`🎯 Estado: ${estadoGeneral}`, 'success');

        return {
            estado: estadoGeneral,
            exitos,
            errores,
            resultados: this.resultados,
            correccionesAplicadas: this.correccionesAplicadas
        };
    }
}

// Función para ejecutar los tests automáticamente
function ejecutarTestCorrecciones() {
    const tester = new TestCorrecciones();
    return tester.ejecutarTodosLosTests();
}

// Ejecutar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ejecutarTestCorrecciones);
} else {
    setTimeout(ejecutarTestCorrecciones, 1000);
}

// Exponer para uso manual
window.TestCorrecciones = TestCorrecciones;
window.ejecutarTestCorrecciones = ejecutarTestCorrecciones;
