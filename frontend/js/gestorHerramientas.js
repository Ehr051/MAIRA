/**
 * 🔧 GESTOR DE HERRAMIENTAS CENTRALIZADO - MAIRA 4.0
 * Gestión inteligente y lazy loading de herramientas específicas
 * Reemplaza la funcionalidad dispersa de herramientasP.js
 */

class GestorHerramientas {
    constructor() {
        this.herramientas_cargadas = new Map();
        this.herramientas_activas = new Set();
        this.dependencias_cache = new Map();
        this.configuracion = {};
        
        console.log('🔧 GestorHerramientas inicializado');
        this.inicializar();
    }

    /**
     * INICIALIZAR GESTOR
     */
    async inicializar() {
        // Configurar herramientas disponibles
        this.configurarHerramientas();
        
        // Precargar herramientas críticas
        await this.precargarCriticas();
        
        // Configurar eventos
        this.configurarEventos();
        
        console.log('✅ GestorHerramientas listo');
    }

    /**
     * CONFIGURAR HERRAMIENTAS DISPONIBLES
     */
    configurarHerramientas() {
        this.herramientas_disponibles = {
            geocoder: {
                archivo: '/frontend/js/herramientas/geocoder.js',
                dependencias: ['leaflet'],
                critica: true,
                descripcion: 'Funcionalidades de geolocalización y búsqueda'
            },
            
            medicion: {
                archivo: '/frontend/js/herramientas/medicion-distancias.js',
                dependencias: ['leaflet', 'turf'],
                critica: true,
                descripcion: 'Medición de distancias y cálculos geográficos'
            },
            
            dibujo: {
                archivo: '/frontend/js/herramientas/herramientas-dibujo.js',
                dependencias: ['leaflet-draw', 'leaflet'],
                critica: false,
                descripcion: 'Herramientas de dibujo y anotación'
            },
            
            edicion: {
                archivo: '/frontend/js/herramientas/herramientas-edicion.js',
                dependencias: ['leaflet'],
                critica: false,
                descripcion: 'Edición de elementos existentes'
            },
            
            navegacion: {
                archivo: '/frontend/js/herramientas/herramientas-navegacion.js',
                dependencias: ['leaflet'],
                critica: true,
                descripcion: 'Navegación y control de mapa'
            },
            
            marcha: {
                archivo: '/frontend/js/herramientas/calculo-marcha.js',
                dependencias: ['medicion'],
                critica: true,
                descripcion: 'Cálculos de marcha y movimiento'
            },
            
            elevacion: {
                archivo: '/frontend/js/herramientas/herramientas-elevacion.js',
                dependencias: ['elevationHandler'],
                critica: false,
                descripcion: 'Análisis de elevación y perfil terreno'
            },
            
            vegetacion: {
                archivo: '/frontend/js/herramientas/herramientas-vegetacion.js',
                dependencias: ['vegetacionhandler'],
                critica: false,
                descripcion: 'Análisis de vegetación y cobertura'
            }
        };

        console.log('🔧 Herramientas configuradas:', Object.keys(this.herramientas_disponibles).length);
    }

    /**
     * PRECARGAR HERRAMIENTAS CRÍTICAS
     */
    async precargarCriticas() {
        console.log('⚡ Precargando herramientas críticas...');
        
        const criticas = Object.entries(this.herramientas_disponibles)
            .filter(([_, config]) => config.critica)
            .map(([nombre, _]) => nombre);

        for (const herramienta of criticas) {
            try {
                await this.cargarHerramienta(herramienta);
                console.log(`✅ ${herramienta} precargada`);
            } catch (error) {
                console.warn(`⚠️ Error precargando ${herramienta}:`, error);
            }
        }
    }

    /**
     * CARGAR HERRAMIENTA ESPECÍFICA
     */
    async cargarHerramienta(nombre) {
        if (this.herramientas_cargadas.has(nombre)) {
            return this.herramientas_cargadas.get(nombre);
        }

        const config = this.herramientas_disponibles[nombre];
        if (!config) {
            throw new Error(`Herramienta '${nombre}' no encontrada`);
        }

        console.log(`📦 Cargando herramienta: ${nombre}`);

        try {
            // Cargar dependencias primero
            await this.cargarDependencias(config.dependencias);

            // Cargar la herramienta
            const modulo = await this.cargarScript(config.archivo);
            
            // Inicializar si tiene método init
            if (modulo && typeof modulo.init === 'function') {
                await modulo.init();
            }

            this.herramientas_cargadas.set(nombre, modulo);
            
            // Emitir evento de carga
            this.emitirEvento('herramienta-cargada', { nombre, modulo });
            
            return modulo;

        } catch (error) {
            console.error(`❌ Error cargando herramienta ${nombre}:`, error);
            throw error;
        }
    }

    /**
     * CARGAR DEPENDENCIAS
     */
    async cargarDependencias(dependencias) {
        for (const dep of dependencias) {
            if (!this.dependencias_cache.has(dep)) {
                // Si es otra herramienta, cargarla recursivamente
                if (this.herramientas_disponibles[dep]) {
                    await this.cargarHerramienta(dep);
                } else {
                    // Verificar si está disponible globalmente
                    if (typeof window !== 'undefined' && !window[dep]) {
                        console.warn(`⚠️ Dependencia '${dep}' no disponible`);
                    }
                }
                this.dependencias_cache.set(dep, true);
            }
        }
    }

    /**
     * CARGAR SCRIPT DINÁMICAMENTE
     */
    async cargarScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                console.log(`✅ Script cargado: ${url}`);
                resolve(window.HerramientaModule || true);
            };
            script.onerror = () => {
                console.error(`❌ Error cargando script: ${url}`);
                reject(new Error(`No se pudo cargar ${url}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * ACTIVAR HERRAMIENTA
     */
    async activarHerramienta(nombre, opciones = {}) {
        try {
            console.log(`🎯 Activando herramienta: ${nombre}`);
            
            // Cargar si no está cargada
            if (!this.herramientas_cargadas.has(nombre)) {
                await this.cargarHerramienta(nombre);
            }

            const herramienta = this.herramientas_cargadas.get(nombre);
            
            // Activar la herramienta
            if (herramienta && typeof herramienta.activar === 'function') {
                await herramienta.activar(opciones);
            }

            this.herramientas_activas.add(nombre);
            
            // Emitir evento
            this.emitirEvento('herramienta-activada', { nombre, opciones });
            
            console.log(`✅ Herramienta activada: ${nombre}`);
            return herramienta;

        } catch (error) {
            console.error(`❌ Error activando herramienta ${nombre}:`, error);
            throw error;
        }
    }

    /**
     * DESACTIVAR HERRAMIENTA
     */
    async desactivarHerramienta(nombre) {
        if (!this.herramientas_activas.has(nombre)) {
            return;
        }

        console.log(`🎯 Desactivando herramienta: ${nombre}`);

        const herramienta = this.herramientas_cargadas.get(nombre);
        if (herramienta && typeof herramienta.desactivar === 'function') {
            await herramienta.desactivar();
        }

        this.herramientas_activas.delete(nombre);
        
        // Emitir evento
        this.emitirEvento('herramienta-desactivada', { nombre });
        
        console.log(`✅ Herramienta desactivada: ${nombre}`);
    }

    /**
     * OBTENER HERRAMIENTA ACTIVA
     */
    obtenerHerramienta(nombre) {
        if (!this.herramientas_cargadas.has(nombre)) {
            console.warn(`⚠️ Herramienta '${nombre}' no está cargada`);
            return null;
        }
        return this.herramientas_cargadas.get(nombre);
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        // Escuchar eventos del sistema
        if (window.EventBus) {
            window.EventBus.on('mapa-listo', () => {
                this.activarHerramienta('navegacion');
            });

            window.EventBus.on('modo-planeamiento', () => {
                this.activarHerramienta('medicion');
                this.activarHerramienta('marcha');
            });

            window.EventBus.on('modo-combate', () => {
                this.activarHerramienta('dibujo');
                this.activarHerramienta('edicion');
            });
        }
    }

    /**
     * EMITIR EVENTO
     */
    emitirEvento(evento, datos) {
        if (window.EventBus) {
            window.EventBus.emit(evento, datos);
        }
        
        // También emitir evento DOM personalizado
        const customEvent = new CustomEvent(evento, { detail: datos });
        document.dispatchEvent(customEvent);
    }

    /**
     * OBTENER ESTADO HERRAMIENTAS
     */
    obtenerEstado() {
        return {
            disponibles: Object.keys(this.herramientas_disponibles),
            cargadas: Array.from(this.herramientas_cargadas.keys()),
            activas: Array.from(this.herramientas_activas),
            estadisticas: {
                total_disponibles: Object.keys(this.herramientas_disponibles).length,
                total_cargadas: this.herramientas_cargadas.size,
                total_activas: this.herramientas_activas.size
            }
        };
    }

    /**
     * LIMPIAR HERRAMIENTAS INACTIVAS
     */
    limpiarInactivas() {
        const inactivas = Array.from(this.herramientas_cargadas.keys())
            .filter(nombre => !this.herramientas_activas.has(nombre));

        for (const nombre of inactivas) {
            const config = this.herramientas_disponibles[nombre];
            if (!config.critica) {
                this.herramientas_cargadas.delete(nombre);
                console.log(`🧹 Herramienta limpiada: ${nombre}`);
            }
        }
    }

    /**
     * RECARGAR HERRAMIENTA
     */
    async recargarHerramienta(nombre) {
        console.log(`🔄 Recargando herramienta: ${nombre}`);
        
        // Desactivar si está activa
        if (this.herramientas_activas.has(nombre)) {
            await this.desactivarHerramienta(nombre);
        }
        
        // Limpiar cache
        this.herramientas_cargadas.delete(nombre);
        
        // Cargar nuevamente
        await this.cargarHerramienta(nombre);
        
        console.log(`✅ Herramienta recargada: ${nombre}`);
    }
}

// Inicializar gestor global
window.GestorHerramientas = new GestorHerramientas();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestorHerramientas;
}

console.log('🔧 GestorHerramientas cargado y disponible globalmente');
