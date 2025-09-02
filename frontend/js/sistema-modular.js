/**
 * 🚀 INICIALIZADOR SISTEMA MODULAR - MAIRA 4.0
 * Archivo principal que coordina la carga de todos los módulos
 * Reemplaza múltiples imports en HTML por un único archivo
 */

class SistemaModularMAIRA {
    constructor() {
        this.modulos_inicializados = new Map();
        this.orden_carga = [
            'GestorHerramientas',
            'ModuloControlGestos', 
            'ModuloNavegacionMapa',
            'ModuloHerramientasDibujo',
            'ModuloPerfilElevacion',
            'ModuloMedicion',
            'ModuloGeocoder'
        ];
        
        this.estado_sistema = 'inicializando';
        console.log('🚀 SistemaModularMAIRA iniciando...');
    }

    /**
     * INICIALIZAR SISTEMA COMPLETO
     */
    async inicializar() {
        try {
            console.log('🔧 Iniciando sistema modular...');
            
            // 1. Verificar dependencias básicas
            await this.verificarDependenciasBasicas();
            
            // 2. Inicializar EventBus si no existe
            await this.inicializarEventBus();
            
            // 3. Cargar y configurar GestorHerramientas
            await this.inicializarGestorHerramientas();
            
            // 4. Cargar módulos en orden
            await this.cargarModulosEnOrden();
            
            // 5. Configurar integración entre módulos
            await this.configurarIntegracion();
            
            // 6. Registrar eventos globales
            await this.registrarEventosGlobales();
            
            this.estado_sistema = 'listo';
            console.log('✅ Sistema modular MAIRA 4.0 inicializado correctamente');
            console.log(`📊 Módulos cargados: ${this.modulos_inicializados.size}`);
            
            // Notificar que el sistema está listo
            this.emitirEvento('sistema-listo', {
                modulos: Array.from(this.modulos_inicializados.keys()),
                timestamp: Date.now()
            });
            
        } catch (error) {
            this.estado_sistema = 'error';
            console.error('❌ Error inicializando sistema modular:', error);
            throw error;
        }
    }

    /**
     * VERIFICAR DEPENDENCIAS BÁSICAS
     */
    async verificarDependenciasBasicas() {
        const dependencias = {
            'Leaflet': () => typeof L !== 'undefined',
            'Mapa': () => typeof window.mapa !== 'undefined',
            'jQuery': () => typeof $ !== 'undefined'
        };

        const dependencias_faltantes = [];
        
        for (const [nombre, verificador] of Object.entries(dependencias)) {
            if (!verificador()) {
                dependencias_faltantes.push(nombre);
            }
        }

        if (dependencias_faltantes.length > 0) {
            throw new Error(`Dependencias faltantes: ${dependencias_faltantes.join(', ')}`);
        }

        console.log('✅ Dependencias básicas verificadas');
    }

    /**
     * INICIALIZAR EVENTBUS
     */
    async inicializarEventBus() {
        if (typeof window.EventBus === 'undefined') {
            // Crear EventBus simple si no existe
            window.EventBus = {
                eventos: new Map(),
                
                on(evento, callback) {
                    if (!this.eventos.has(evento)) {
                        this.eventos.set(evento, []);
                    }
                    this.eventos.get(evento).push(callback);
                },
                
                emit(evento, datos) {
                    if (this.eventos.has(evento)) {
                        this.eventos.get(evento).forEach(callback => {
                            try {
                                callback(datos);
                            } catch (error) {
                                console.error('Error en callback de evento:', error);
                            }
                        });
                    }
                },
                
                off(evento, callback) {
                    if (this.eventos.has(evento)) {
                        const callbacks = this.eventos.get(evento);
                        const indice = callbacks.indexOf(callback);
                        if (indice > -1) {
                            callbacks.splice(indice, 1);
                        }
                    }
                }
            };
            
            console.log('📡 EventBus creado');
        } else {
            console.log('📡 EventBus ya disponible');
        }
    }

    /**
     * INICIALIZAR GESTOR DE HERRAMIENTAS
     */
    async inicializarGestorHerramientas() {
        if (typeof window.GestorHerramientas === 'undefined') {
            console.warn('⚠️ GestorHerramientas no encontrado, debe cargarse primero');
            return;
        }

        await window.GestorHerramientas.init();
        this.modulos_inicializados.set('GestorHerramientas', window.GestorHerramientas);
        console.log('🛠️ GestorHerramientas inicializado');
    }

    /**
     * CARGAR MÓDULOS EN ORDEN
     */
    async cargarModulosEnOrden() {
        for (const nombre_modulo of this.orden_carga) {
            if (nombre_modulo === 'GestorHerramientas') continue; // Ya cargado
            
            try {
                await this.cargarModulo(nombre_modulo);
            } catch (error) {
                console.warn(`⚠️ Error cargando módulo ${nombre_modulo}:`, error);
                // Continuar con otros módulos
            }
        }
    }

    /**
     * CARGAR MÓDULO INDIVIDUAL
     */
    async cargarModulo(nombre_modulo) {
        const modulo_window = window[nombre_modulo];
        
        if (!modulo_window) {
            console.warn(`⚠️ Módulo ${nombre_modulo} no encontrado en window`);
            return;
        }

        // Inicializar si tiene método init
        if (typeof modulo_window.init === 'function') {
            await modulo_window.init();
        }

        this.modulos_inicializados.set(nombre_modulo, modulo_window);
        console.log(`✅ Módulo ${nombre_modulo} cargado`);
    }

    /**
     * CONFIGURAR INTEGRACIÓN ENTRE MÓDULOS
     */
    async configurarIntegracion() {
        // Configurar comunicación entre módulos vía EventBus
        this.configurarEventosIntegracion();
        
        // Registrar métodos de utilidad globales
        this.registrarUtilidadesGlobales();
        
        console.log('🔗 Integración entre módulos configurada');
    }

    /**
     * CONFIGURAR EVENTOS DE INTEGRACIÓN
     */
    configurarEventosIntegracion() {
        // Eventos de medición → perfil elevación
        window.EventBus.on('medicion:linea-creada', (datos) => {
            if (window.ModuloPerfilElevacion) {
                window.ModuloPerfilElevacion.procesarLinea(datos.puntos);
            }
        });

        // Eventos de dibujo → navegación
        window.EventBus.on('herramientas-dibujo:elemento-creado', (datos) => {
            if (window.ModuloNavegacionMapa && datos.auto_centrar) {
                window.ModuloNavegacionMapa.centrarEnElemento(datos);
            }
        });

        // Eventos de gestos → herramientas
        window.EventBus.on('control-gestos:doble-click', (datos) => {
            if (window.GestorHerramientas) {
                window.GestorHerramientas.manejarDobleClick(datos);
            }
        });

        // Eventos globales del sistema
        window.EventBus.on('sistema:cambio-modo', (datos) => {
            this.manejarCambioModo(datos.modo);
        });
    }

    /**
     * REGISTRAR UTILIDADES GLOBALES
     */
    registrarUtilidadesGlobales() {
        // Utilidades de coordenadas
        window.UtilsMAIRA = {
            convertirCoordenadas: (lat, lng, formato = 'decimal') => {
                // Implementar conversión de coordenadas
                return { lat, lng, formato };
            },
            
            calcularDistancia: (punto1, punto2) => {
                if (window.L) {
                    return L.latLng(punto1).distanceTo(L.latLng(punto2));
                }
                return 0;
            },
            
            formatearDistancia: (metros) => {
                if (metros < 1000) {
                    return `${metros.toFixed(1)} m`;
                } else {
                    return `${(metros / 1000).toFixed(2)} km`;
                }
            },
            
            obtenerEstadoSistema: () => {
                return {
                    estado: this.estado_sistema,
                    modulos: Array.from(this.modulos_inicializados.keys()),
                    timestamp: Date.now()
                };
            }
        };

        console.log('🧰 Utilidades globales registradas');
    }

    /**
     * REGISTRAR EVENTOS GLOBALES
     */
    async registrarEventosGlobales() {
        // Escuchar cambios de modo MAIRA
        if (typeof cambiarModo === 'function') {
            const cambiarModoOriginal = window.cambiarModo;
            window.cambiarModo = (modo) => {
                this.emitirEvento('cambio-modo', { modo });
                return cambiarModoOriginal(modo);
            };
        }

        // Escuchar cambios de mapa
        if (window.mapa) {
            window.mapa.on('zoomend moveend', () => {
                this.emitirEvento('mapa-actualizado', {
                    centro: window.mapa.getCenter(),
                    zoom: window.mapa.getZoom()
                });
            });
        }

        console.log('🎧 Eventos globales registrados');
    }

    /**
     * MANEJAR CAMBIO DE MODO
     */
    manejarCambioModo(modo) {
        console.log(`🔄 Cambio de modo: ${modo}`);
        
        // Notificar a todos los módulos
        for (const [nombre, modulo] of this.modulos_inicializados) {
            if (typeof modulo.onCambioModo === 'function') {
                try {
                    modulo.onCambioModo(modo);
                } catch (error) {
                    console.warn(`⚠️ Error en ${nombre}.onCambioModo:`, error);
                }
            }
        }
    }

    /**
     * OBTENER ESTADO DEL SISTEMA
     */
    obtenerEstado() {
        return {
            estado: this.estado_sistema,
            modulos_cargados: Array.from(this.modulos_inicializados.keys()),
            total_modulos: this.modulos_inicializados.size,
            gestor_herramientas: window.GestorHerramientas ? window.GestorHerramientas.obtenerEstadisticas() : null,
            timestamp: Date.now()
        };
    }

    /**
     * REINICIALIZAR SISTEMA
     */
    async reinicializar() {
        console.log('🔄 Reinicializando sistema...');
        
        // Limpiar módulos
        for (const [nombre, modulo] of this.modulos_inicializados) {
            if (typeof modulo.cleanup === 'function') {
                try {
                    await modulo.cleanup();
                } catch (error) {
                    console.warn(`⚠️ Error limpiando ${nombre}:`, error);
                }
            }
        }
        
        this.modulos_inicializados.clear();
        
        // Reinicializar
        await this.inicializar();
    }

    /**
     * OBTENER MÓDULO
     */
    obtenerModulo(nombre) {
        return this.modulos_inicializados.get(nombre) || window[nombre];
    }

    /**
     * VERIFICAR SI MÓDULO ESTÁ CARGADO
     */
    moduloCargado(nombre) {
        return this.modulos_inicializados.has(nombre);
    }

    /**
     * UTILIDADES
     */
    emitirEvento(tipo, datos) {
        if (window.EventBus) {
            window.EventBus.emit(`sistema:${tipo}`, datos);
        }
    }

    log(mensaje, datos = null) {
        console.log(`🚀 [Sistema] ${mensaje}`, datos);
    }
}

// Inicializar sistema automáticamente cuando se carga
window.SistemaModularMAIRA = new SistemaModularMAIRA();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.SistemaModularMAIRA.inicializar();
    });
} else {
    // DOM ya está listo
    setTimeout(() => {
        window.SistemaModularMAIRA.inicializar();
    }, 100);
}

console.log('🚀 SistemaModularMAIRA disponible');
