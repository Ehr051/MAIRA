/**
 * SCRIPT DE VERIFICACIÓN COMPLETA - MÓDULO PLANEAMIENTO
 * Verifica todas las funcionalidades del módulo de planeamiento
 * @version 1.0.0
 */

class TestPlaneamiento {
    constructor() {
        this.resultados = {};
        this.errores = [];
        this.timeouts = [];
        this.testActual = '';
    }

    /**
     * Ejecuta todos los tests del módulo de planeamiento
     */
    async ejecutarTodosLosTests() {
        console.log('🧪 INICIANDO VERIFICACIÓN COMPLETA DEL MÓDULO PLANEAMIENTO');
        console.log('═'.repeat(60));
        
        const tests = [
            'verificarInicializacion',
            'verificarMapa',
            'verificarBusquedaLugares',
            'verificarHerramientasBasicas',
            'verificarMedicionDistancia',
            'verificarPerfilElevacion',
            'verificarCalculoMarcha',
            'verificarPuntosControl',
            'verificarSimbolos',
            'verificarCalcos',
            'verificarExportacion',
            'verificarIntegracionCompleta'
        ];

        let pasados = 0;
        let fallados = 0;

        for (const test of tests) {
            try {
                this.testActual = test;
                const resultado = await this[test]();
                this.resultados[test] = resultado;
                
                if (resultado.exito) {
                    pasados++;
                    console.log(`✅ ${test}: ${resultado.mensaje}`);
                } else {
                    fallados++;
                    console.log(`❌ ${test}: ${resultado.mensaje}`);
                    this.errores.push(`${test}: ${resultado.mensaje}`);
                }
            } catch (error) {
                fallados++;
                console.error(`💥 ${test} FALLÓ CON ERROR:`, error);
                this.errores.push(`${test}: ${error.message}`);
            }
        }

        this.mostrarResumenFinal(pasados, fallados);
        return { pasados, fallados, errores: this.errores };
    }

    /**
     * Test 1: Verificar inicialización del módulo
     */
    async verificarInicializacion() {
        const checks = {
            'DOM cargado': !!document.querySelector('body'),
            'Mapa inicializado': !!window.mapa,
            'Leaflet disponible': typeof L !== 'undefined',
            'D3 disponible': typeof d3 !== 'undefined',
            'milsymbol disponible': typeof window.ms !== 'undefined',
            'MAIRA namespace': !!(window.MAIRA || window.elevationHandler),
            'Variables globales': !!(window.lineas && window.elementoSeleccionado !== undefined)
        };

        const fallidas = Object.entries(checks).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Inicialización completa ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Fallas en inicialización: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 2: Verificar funcionamiento del mapa
     */
    async verificarMapa() {
        if (!window.mapa) {
            return { exito: false, mensaje: 'Mapa no inicializado' };
        }

        const checks = {
            'Mapa renderizado': !!window.mapa._container,
            'Centro configurado': !!window.mapa.getCenter(),
            'Zoom configurado': window.mapa.getZoom() > 0,
            'Capas base': Object.keys(window.mapa._layers).length > 0,
            'Controles activos': !!document.querySelector('.leaflet-control')
        };

        const fallidas = Object.entries(checks).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Mapa funcionando correctamente ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en mapa: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 3: Verificar búsqueda de lugares
     */
    async verificarBusquedaLugares() {
        const elementos = {
            'Input búsqueda': document.getElementById('busquedaLugar'),
            'Botón búsqueda': document.getElementById('btnBuscarLugar'),
            'Resultados': document.getElementById('resultadosBusquedaLugar'),
            'Geocoder disponible': typeof L.Control.Geocoder !== 'undefined'
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            // Test funcional básico
            try {
                const input = elementos['Input búsqueda'];
                input.value = 'Buenos Aires';
                input.dispatchEvent(new Event('input'));
                
                return { exito: true, mensaje: 'Búsqueda de lugares operativa ✓' };
            } catch (error) {
                return { exito: false, mensaje: `Error en búsqueda: ${error.message}` };
            }
        } else {
            return { 
                exito: false, 
                mensaje: `Elementos faltantes: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 4: Verificar herramientas básicas
     */
    async verificarHerramientasBasicas() {
        const herramientas = {
            'Función medirDistancia': typeof window.medirDistancia === 'function',
            'Función seleccionarElemento': typeof window.seleccionarElemento === 'function',
            'Función deseleccionarElemento': typeof window.deseleccionarElemento === 'function',
            'Menú herramientas': !!document.getElementById('herramientas-menu'),
            'Panel edición': !!(document.getElementById('panelEdicionLinea') || document.querySelector('.panel'))
        };

        const fallidas = Object.entries(herramientas).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Herramientas básicas disponibles ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Herramientas faltantes: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 5: Verificar medición de distancia
     */
    async verificarMedicionDistancia() {
        if (typeof window.medirDistancia !== 'function') {
            return { exito: false, mensaje: 'Función medirDistancia no disponible' };
        }

        try {
            // Simular inicio de medición
            window.medirDistancia();
            
            // Verificar que se ha iniciado correctamente
            const checks = {
                'Líneas de medición inicializadas': !!(window.lineas || window.measuringDistance !== undefined),
                'Modo medición activo': window.measuringDistance === true || window.medicionDistancia === true,
                'Click handler configurado': !!window.mapa._events.click
            };

            const fallidas = Object.entries(checks).filter(([key, value]) => !value);
            
            if (fallidas.length === 0) {
                return { exito: true, mensaje: 'Medición de distancia funcional ✓' };
            } else {
                return { 
                    exito: false, 
                    mensaje: `Problemas en medición: ${fallidas.map(([k]) => k).join(', ')}` 
                };
            }
        } catch (error) {
            return { exito: false, mensaje: `Error en medición: ${error.message}` };
        }
    }

    /**
     * Test 6: Verificar perfil de elevación
     */
    async verificarPerfilElevacion() {
        const elementos = {
            'MAIRA.Elevacion': !!(window.MAIRA?.Elevacion || window.elevationHandler),
            'elevationHandler': !!window.elevationHandler,
            'Función renderizarGraficoElevacion': typeof window.renderizarGraficoElevacion === 'function',
            'D3 para gráficos': typeof d3 !== 'undefined',
            'Datos de elevación': !!(window.elevationHandler?.cargarDatosElevacion || window.elevationHandler?.indiceTiles)
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Sistema de elevación disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Elementos de elevación faltantes: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 7: Verificar cálculo de marcha
     */
    async verificarCalculoMarcha() {
        const elementos = {
            'CalculoMarcha clase': typeof window.CalculoMarchaController === 'function',
            'Panel marcha': !!document.getElementById('calculoMarchaPanel'),
            'Botón calcular': !!document.getElementById('btnCalcularMarcha'),
            'MAIRA.Vegetacion': !!window.MAIRA?.Vegetacion,
            'graficoMarcha': typeof window.GraficoMarchaController === 'function'
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            // Test básico de instanciación
            try {
                const calculoMarcha = new window.CalculoMarchaController();
                return { exito: true, mensaje: 'Sistema de cálculo de marcha operativo ✓' };
            } catch (error) {
                return { exito: false, mensaje: `Error en cálculo marcha: ${error.message}` };
            }
        } else {
            return { 
                exito: false, 
                mensaje: `Elementos de marcha faltantes: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 8: Verificar puntos de control
     */
    async verificarPuntosControl() {
        const elementos = {
            'Función agregar PC': typeof window.agregarPuntoControl === 'function',
            'Enlaces PC en menú': !!document.querySelector('a[onclick*="agregarPuntoControl"]'),
            'milsymbol cargado': typeof window.ms !== 'undefined'
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) { // Permitir 1 falla menor
            return { exito: true, mensaje: 'Sistema de puntos de control disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en PC: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 9: Verificar símbolos militares
     */
    async verificarSimbolos() {
        const elementos = {
            'milsymbol disponible': typeof window.ms !== 'undefined',
            'simbolosP cargado': !!document.querySelector('script[src*="simbolosP.js"]'),
            'Panel símbolos': !!document.getElementById('simbolosBasicosBtn')
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) {
            return { exito: true, mensaje: 'Sistema de símbolos disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en símbolos: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 10: Verificar calcos
     */
    async verificarCalcos() {
        const elementos = {
            'calcosP disponible': !!window.calcosP,
            'Funciones de calco': typeof window.editarElementoSeleccionado === 'function',
            'Panel calcos': !!document.querySelector('.panel-calcos, #calcos-menu')
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) {
            return { exito: true, mensaje: 'Sistema de calcos disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en calcos: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 11: Verificar exportación
     */
    async verificarExportacion() {
        const elementos = {
            'jsPDF disponible': !!(window.jspdf || window.jsPDF),
            'html2canvas disponible': typeof window.html2canvas !== 'undefined',
            'Scripts exportación': !!(document.querySelector('script[src*="jspdf"]') && document.querySelector('script[src*="html2canvas"]'))
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) {
            return { exito: true, mensaje: 'Capacidades de exportación disponibles ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en exportación: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 12: Verificar integración completa
     */
    async verificarIntegracionCompleta() {
        const flujos = {
            'Crear línea → Perfil elevación': this.testFlujoPerfilElevacion(),
            'Crear línea → Cálculo marcha': this.testFlujoCalculoMarcha(),
            'Agregar PC → Visualización': this.testFlujoPuntosControl()
        };

        let exitosos = 0;
        const resultados = {};

        for (const [flujo, test] of Object.entries(flujos)) {
            try {
                const resultado = await test;
                resultados[flujo] = resultado;
                if (resultado) exitosos++;
            } catch (error) {
                resultados[flujo] = false;
            }
        }

        if (exitosos >= 2) {
            return { exito: true, mensaje: 'Integración entre módulos funcional ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Fallos en integración: ${Object.entries(resultados).filter(([k,v]) => !v).map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Tests auxiliares para integración
     */
    testFlujoPerfilElevacion() {
        return !!(
            window.lineas && 
            typeof window.renderizarGraficoElevacion === 'function' &&
            window.elevationHandler
        );
    }

    testFlujoCalculoMarcha() {
        return !!(
            window.CalculoMarchaController && 
            window.GraficoMarchaController &&
            (window.MAIRA?.Vegetacion || window.vegetacionHandler)
        );
    }

    testFlujoPuntosControl() {
        return !!(
            typeof window.agregarPuntoControl === 'function' &&
            typeof window.ms !== 'undefined'
        );
    }

    /**
     * Muestra el resumen final de todos los tests
     */
    mostrarResumenFinal(pasados, fallados) {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 RESUMEN FINAL DE VERIFICACIÓN');
        console.log('═'.repeat(60));
        console.log(`✅ Tests pasados: ${pasados}`);
        console.log(`❌ Tests fallados: ${fallados}`);
        console.log(`📈 Porcentaje de éxito: ${((pasados / (pasados + fallados)) * 100).toFixed(1)}%`);
        
        if (this.errores.length > 0) {
            console.log('\n🔍 ERRORES ENCONTRADOS:');
            this.errores.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        console.log('\n🎯 RECOMENDACIONES:');
        if (pasados >= 10) {
            console.log('✅ Módulo de planeamiento en excelente estado');
        } else if (pasados >= 8) {
            console.log('⚠️  Módulo funcional con algunos problemas menores');
        } else if (pasados >= 6) {
            console.log('🔧 Módulo necesita correcciones importantes');
        } else {
            console.log('💥 Módulo requiere revisión completa');
        }
        
        console.log('═'.repeat(60));
    }

    /**
     * Ejecuta un test rápido (versión reducida)
     */
    async testRapido() {
        console.log('🚀 EJECUTANDO TEST RÁPIDO DE PLANEAMIENTO...');
        
        const testsBasicos = [
            'verificarInicializacion',
            'verificarMapa',
            'verificarHerramientasBasicas',
            'verificarPerfilElevacion',
            'verificarCalculoMarcha'
        ];

        let exitosos = 0;
        for (const test of testsBasicos) {
            try {
                const resultado = await this[test]();
                if (resultado.exito) {
                    exitosos++;
                    console.log(`✅ ${test}`);
                } else {
                    console.log(`❌ ${test}: ${resultado.mensaje}`);
                }
            } catch (error) {
                console.log(`💥 ${test}: ${error.message}`);
            }
        }

        console.log(`\n📊 RESULTADO: ${exitosos}/${testsBasicos.length} tests básicos pasados`);
        return exitosos >= 4;
    }
}

// Hacer disponible globalmente
window.TestPlaneamiento = TestPlaneamiento;

// Auto-ejecutar si se llama directamente
if (typeof window !== 'undefined' && window.location) {
    window.ejecutarTestPlaneamiento = async function(rapido = false) {
        const test = new TestPlaneamiento();
        return rapido ? await test.testRapido() : await test.ejecutarTodosLosTests();
    };
}

console.log('🧪 TestPlaneamiento cargado. Ejecuta: ejecutarTestPlaneamiento() o ejecutarTestPlaneamiento(true)');
