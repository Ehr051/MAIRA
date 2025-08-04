/**
 * SCRIPT DE VERIFICACIÓN COMPLETA - MÓDULO GESTIÓN DE BATALLA
 * Verifica todas las funcionalidades del módulo de gestión de batalla
 * @version 1.0.0
 */

class TestGestionBatalla {
    constructor() {
        this.resultados = {};
        this.errores = [];
        this.timeouts = [];
        this.testActual = '';
    }

    /**
     * Ejecuta todos los tests del módulo de gestión de batalla
     */
    async ejecutarTodosLosTests() {
        console.log('🧪 INICIANDO VERIFICACIÓN COMPLETA DEL MÓDULO GESTIÓN DE BATALLA');
        console.log('═'.repeat(60));
        
        const tests = [
            'verificarInicializacion',
            'verificarMapa',
            'verificarElementosGB',
            'verificarSocket',
            'verificarChat',
            'verificarInformes',
            'verificarPosicionamiento',
            'verificarElementosConectados',
            'verificarEdicionGB',
            'verificarUtilsGB',
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
            'MAIRA namespace': !!window.MAIRA,
            'MAIRA.GestionBatalla': !!window.MAIRA?.GestionBatalla,
            'Socket.io cargado': typeof io !== 'undefined',
            'milsymbol disponible': typeof window.ms !== 'undefined',
            'Variables globales GB': !!(window.elementosConectados !== undefined && window.usuarioInfo !== undefined),
            'Mapa inicializado': !!window.mapa
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
            'Controles activos': !!document.querySelector('.leaflet-control'),
            'Eventos de mapa': !!window.mapa._events?.click
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
     * Test 3: Verificar elementos de gestión de batalla
     */
    async verificarElementosGB() {
        const elementos = {
            'elementosGB.js cargado': !!document.querySelector('script[src*="elementosGB"]'),
            'Panel elementos': !!document.getElementById('tab-elementos'),
            'Lista elementos conectados': !!document.getElementById('elementosConectados'),
            'Funciones GB disponibles': !!(window.MAIRA?.GestionBatalla?.agregarElemento || typeof window.agregarElemento === 'function')
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Elementos GB disponibles ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Elementos GB faltantes: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 4: Verificar conexión Socket.io
     */
    async verificarSocket() {
        const elementos = {
            'Socket.io librería': typeof io !== 'undefined',
            'Socket global': !!window.socket || !!window.MAIRA?.GestionBatalla?.socket,
            'Configuración socket': !!window.MAIRA?.GestionBatalla?.configurarSocket,
            'Event listeners': !!(window.MAIRA?.GestionBatalla && typeof window.MAIRA.GestionBatalla.configurarEventosSocket === 'function')
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) { // Permitir 1 falla (conexión puede no estar activa)
            return { exito: true, mensaje: 'Sistema Socket disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en Socket: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 5: Verificar sistema de chat
     */
    async verificarChat() {
        const elementos = {
            'Panel chat': !!document.getElementById('tab-chat'),
            'Input mensaje': !!document.getElementById('mensaje-chat'),
            'Área mensajes': !!document.getElementById('chat-messages'),
            'Botón enviar': !!document.getElementById('enviar-mensaje'),
            'Botón toggle panel': !!document.getElementById('toggle-panel-btn'),
            'Funciones chat': !!(window.enviarMensaje || window.MAIRA?.GestionBatalla?.enviarMensaje)
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Sistema de chat disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en chat: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 6: Verificar sistema de informes
     */
    async verificarInformes() {
        const elementos = {
            'informesGB.js cargado': !!document.querySelector('script[src*="informesGB"]'),
            'Panel informes': !!document.getElementById('tab-informes'),
            'Panel lateral': !!document.getElementById('panel-lateral'),
            'Funciones informes': !!(window.crearInforme || window.MAIRA?.GestionBatalla?.crearInforme || window.MAIRA?.Informes)
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Sistema de informes disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en informes: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 7: Verificar posicionamiento y GPS
     */
    async verificarPosicionamiento() {
        const elementos = {
            'Geolocation API': !!navigator.geolocation,
            'Marcador usuario': !!(window.marcadorUsuario || window.MAIRA?.GestionBatalla?.marcadorUsuario),
            'Seguimiento GPS': !!(window.iniciarSeguimiento || window.MAIRA?.GestionBatalla?.iniciarSeguimiento),
            'Panel posición': !!document.querySelector('#posicionActual, .posicion-info')
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) { // Permitir 1 falla (GPS puede no estar disponible)
            return { exito: true, mensaje: 'Sistema de posicionamiento disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en posicionamiento: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 8: Verificar elementos conectados
     */
    async verificarElementosConectados() {
        const elementos = {
            'elementosConectados global': window.elementosConectados !== undefined,
            'Lista UI elementos': !!document.getElementById('elementosConectados'),
            'Actualizar elementos': !!(window.actualizarElementosConectados || window.MAIRA?.GestionBatalla?.actualizarElementosConectados),
            'Mostrar/ocultar elementos': !!(window.toggleElemento || window.MAIRA?.GestionBatalla?.toggleElemento)
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length === 0) {
            return { exito: true, mensaje: 'Gestión elementos conectados operativa ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas elementos conectados: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 9: Verificar edición GB
     */
    async verificarEdicionGB() {
        const elementos = {
            'edicionGB.js cargado': !!document.querySelector('script[src*="edicionGB"]'),
            'Panel edición GB': !!document.querySelector('.panel-edicion-gb, #panelEdicionGB'),
            'Funciones edición': !!(window.editarElementoGB || window.MAIRA?.GestionBatalla?.editarElemento),
            'Guardar cambios': !!(window.guardarCambiosGB || window.MAIRA?.GestionBatalla?.guardarCambios)
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) {
            return { exito: true, mensaje: 'Sistema de edición GB disponible ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en edición GB: ${fallidas.map(([k]) => k).join(', ')}` 
            };
        }
    }

    /**
     * Test 10: Verificar utilidades GB
     */
    async verificarUtilsGB() {
        const elementos = {
            'utilsGB.js cargado': !!document.querySelector('script[src*="utilsGB"]'),
            'Exportar datos': !!(window.exportarDatos || window.MAIRA?.GestionBatalla?.exportarDatos),
            'Validar elementos': !!(window.validarElemento || window.MAIRA?.GestionBatalla?.validarElemento),
            'Formatear datos': !!(window.formatearDatos || window.MAIRA?.GestionBatalla?.formatearDatos)
        };

        const fallidas = Object.entries(elementos).filter(([key, value]) => !value);
        
        if (fallidas.length <= 1) {
            return { exito: true, mensaje: 'Utilidades GB disponibles ✓' };
        } else {
            return { 
                exito: false, 
                mensaje: `Problemas en utilidades GB: ${fallidas.map(([k]) => k).join(', ')}` 
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
            'Exportar PDF': !!(window.exportarPDF || window.MAIRA?.GestionBatalla?.exportarPDF),
            'Exportar imagen': !!(window.exportarImagen || window.MAIRA?.GestionBatalla?.exportarImagen)
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
            'Conectar → Mostrar en mapa': this.testFlujoConexion(),
            'Crear informe → Enviar por socket': this.testFlujoInforme(),
            'Chat → Comunicación tiempo real': this.testFlujoChat(),
            'GPS → Actualizar posición': this.testFlujoPosicion(),
            'Panel → Toggle y notificaciones': this.testFlujoPanelCompleto()
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

        if (exitosos >= 3) {
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
    testFlujoConexion() {
        return !!(
            window.socket &&
            window.elementosConectados !== undefined &&
            (window.actualizarElementosConectados || window.MAIRA?.GestionBatalla?.actualizarElementosConectados)
        );
    }

    testFlujoInforme() {
        return !!(
            (window.crearInforme || window.MAIRA?.GestionBatalla?.crearInforme) &&
            window.socket &&
            document.getElementById('listaInformes')
        );
    }

    testFlujoChat() {
        return !!(
            (window.enviarMensaje || window.MAIRA?.GestionBatalla?.enviarMensaje) &&
            document.getElementById('mensajesArea') &&
            window.socket
        );
    }

    testFlujoPosicion() {
        return !!(
            navigator.geolocation &&
            (window.iniciarSeguimiento || window.MAIRA?.GestionBatalla?.iniciarSeguimiento) &&
            window.mapa
        );
    }

    testFlujoPanelCompleto() {
        return !!(
            document.getElementById('toggle-panel-btn') &&
            document.getElementById('panel-lateral') &&
            typeof window.MAIRA?.GestionBatalla?.togglePanel === 'function' &&
            document.querySelector('.tab-btn') &&
            document.getElementById('tab-chat')
        );
    }

    /**
     * Muestra el resumen final de todos los tests
     */
    mostrarResumenFinal(pasados, fallados) {
        console.log('\n' + '═'.repeat(60));
        console.log('📊 RESUMEN FINAL DE VERIFICACIÓN - GESTIÓN DE BATALLA');
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
            console.log('✅ Módulo de gestión de batalla en excelente estado');
            console.log('💡 Sistema listo para operaciones en tiempo real');
        } else if (pasados >= 8) {
            console.log('⚠️  Módulo funcional con algunos problemas menores');
            console.log('🔧 Revisar conexiones de red y socket');
        } else if (pasados >= 6) {
            console.log('🔧 Módulo necesita correcciones importantes');
            console.log('⚡ Priorizar: Socket, Chat e Informes');
        } else {
            console.log('💥 Módulo requiere revisión completa');
            console.log('🚨 Sistema no operativo para batalla');
        }
        
        console.log('═'.repeat(60));
    }

    /**
     * Ejecuta un test rápido (versión reducida)
     */
    async testRapido() {
        console.log('🚀 EJECUTANDO TEST RÁPIDO DE GESTIÓN DE BATALLA...');
        
        const testsBasicos = [
            'verificarInicializacion',
            'verificarMapa',
            'verificarSocket',
            'verificarChat',
            'verificarElementosGB'
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
        return exitosos >= 3;
    }

    /**
     * Demo interactiva de funcionalidades
     */
    async demoFuncionalidades() {
        console.log('🎮 INICIANDO DEMO INTERACTIVA DE GESTIÓN DE BATALLA...');
        console.log('═'.repeat(60));
        
        if (!window.MAIRA?.GestionBatalla) {
            console.error('❌ MAIRA.GestionBatalla no disponible');
            return false;
        }

        const pasos = [
            {
                nombre: '1. Mostrar Panel',
                accion: () => {
                    if (window.MAIRA.GestionBatalla.togglePanel) {
                        window.MAIRA.GestionBatalla.togglePanel(true);
                        console.log('✅ Panel mostrado');
                        return true;
                    }
                    return false;
                }
            },
            {
                nombre: '2. Enviar mensaje de prueba',
                accion: () => {
                    try {
                        if (window.MAIRA.GestionBatalla.agregarMensajeChat) {
                            window.MAIRA.GestionBatalla.agregarMensajeChat('Test', 'Mensaje de prueba desde demo', 'recibido');
                            console.log('✅ Mensaje de prueba enviado');
                            return true;
                        }
                    } catch (error) {
                        console.error('❌ Error enviando mensaje:', error);
                    }
                    return false;
                }
            },
            {
                nombre: '3. Cambiar a pestaña Documentos',
                accion: () => {
                    try {
                        if (window.MAIRA.GestionBatalla.cambiarTab) {
                            window.MAIRA.GestionBatalla.cambiarTab('tab-informes');
                            console.log('✅ Cambiado a pestaña Documentos');
                            return true;
                        }
                    } catch (error) {
                        console.error('❌ Error cambiando pestaña:', error);
                    }
                    return false;
                }
            },
            {
                nombre: '4. Volver a Chat',
                accion: () => {
                    try {
                        if (window.MAIRA.GestionBatalla.cambiarTab) {
                            window.MAIRA.GestionBatalla.cambiarTab('tab-chat');
                            console.log('✅ Cambiado a pestaña Chat');
                            return true;
                        }
                    } catch (error) {
                        console.error('❌ Error cambiando pestaña:', error);
                    }
                    return false;
                }
            },
            {
                nombre: '5. Ocultar Panel',
                accion: () => {
                    if (window.MAIRA.GestionBatalla.togglePanel) {
                        window.MAIRA.GestionBatalla.togglePanel(false);
                        console.log('✅ Panel ocultado');
                        return true;
                    }
                    return false;
                }
            }
        ];

        let exitosos = 0;
        for (const paso of pasos) {
            console.log(`\n🎯 ${paso.nombre}...`);
            try {
                const resultado = paso.accion();
                if (resultado) {
                    exitosos++;
                    console.log(`   ✅ Completado`);
                } else {
                    console.log(`   ❌ Falló`);
                }
                // Pausa entre pasos
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`   💥 Error: ${error.message}`);
            }
        }

        console.log('\n' + '═'.repeat(60));
        console.log(`📊 DEMO COMPLETADA: ${exitosos}/${pasos.length} pasos exitosos`);
        console.log('🎮 Prueba el botón flotante en el lado derecho para mostrar/ocultar el panel');
        console.log('💬 Envía mensajes para ver las notificaciones en las pestañas');
        console.log('═'.repeat(60));
        
        return exitosos >= 4;
    }
}

// Hacer disponible globalmente
window.TestGestionBatalla = TestGestionBatalla;

// Auto-ejecutar si se llama directamente
if (typeof window !== 'undefined' && window.location) {
    window.ejecutarTestGestionBatalla = async function(rapido = false) {
        const test = new TestGestionBatalla();
        return rapido ? await test.testRapido() : await test.ejecutarTodosLosTests();
    };
    
    window.demoGestionBatalla = async function() {
        const test = new TestGestionBatalla();
        return await test.demoFuncionalidades();
    };
}

console.log('🧪 TestGestionBatalla cargado.');
console.log('📋 Comandos disponibles:');
console.log('  - ejecutarTestGestionBatalla() : Test completo');
console.log('  - ejecutarTestGestionBatalla(true) : Test rápido');
console.log('  - demoGestionBatalla() : Demo interactiva');
