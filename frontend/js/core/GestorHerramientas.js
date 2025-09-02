/**
 * 🛠️ GESTOR DE HERRAMIENTAS - MAIRA 4.0
 * Gestor centralizado que maneja todas las herramientas del mapa
 * Reduce importaciones directas en HTML y gestiona dependencias
 */

class GestorHerramientas {
    constructor() {
        this.herramientas_registradas = new Map();
        this.herramienta_activa = null;
        this.dependencias_cargadas = new Set();
        this.configuracion = {
            auto_cleanup: true,
            debug_mode: false,
            lazy_loading: true
        };
        
        console.log('🛠️ GestorHerramientas inicializado');
    }

    /**
     * INICIALIZAR GESTOR
     */
    async init() {
        try {
            await this.verificarDependencias();
            await this.cargarHerramientasCore();
            await this.configurarEventos();
            console.log('✅ GestorHerramientas listo con', this.herramientas_registradas.size, 'herramientas');
        } catch (error) {
            console.error('❌ Error inicializando GestorHerramientas:', error);
        }
    }

    /**
     * VERIFICAR DEPENDENCIAS BÁSICAS
     */
    async verificarDependencias() {
        const dependencias_requeridas = ['L', 'mapa', 'EventBus'];
        
        for (const dep of dependencias_requeridas) {
            if (typeof window[dep] === 'undefined') {
                throw new Error(`Dependencia requerida no encontrada: ${dep}`);
            }
        }
        
        this.dependencias_cargadas.add('core');
        console.log('✅ Dependencias básicas verificadas');
    }

    /**
     * CARGAR HERRAMIENTAS CORE
     */
    async cargarHerramientasCore() {
        // Registrar herramientas disponibles
        const herramientas_core = [
            {
                id: 'medicion_distancias',
                nombre: 'Medición de Distancias',
                archivo: '/frontend/js/herramientas/medicion-distancias.js',
                clase: 'ModuloMedicion',
                dependencias: ['L', 'mapa'],
                carga_lazy: false // Crítica, cargar inmediatamente
            },
            {
                id: 'geocoder',
                nombre: 'Geocoder y Búsqueda',
                archivo: '/frontend/js/herramientas/geocoder.js',
                clase: 'ModuloGeocoder',
                dependencias: ['L', 'mapa'],
                carga_lazy: true
            },
            {
                id: 'perfil_elevacion',
                nombre: 'Perfil de Elevación',
                archivo: '/frontend/js/herramientas/perfil-elevacion.js',
                clase: 'ModuloPerfilElevacion',
                dependencias: ['L', 'mapa', 'elevationHandler'],
                carga_lazy: true
            },
            {
                id: 'herramientas_dibujo',
                nombre: 'Herramientas de Dibujo',
                archivo: '/frontend/js/herramientas/herramientas-dibujo.js',
                clase: 'ModuloHerramientasDibujo',
                dependencias: ['L', 'mapa'],
                carga_lazy: true
            },
            {
                id: 'navegacion_mapa',
                nombre: 'Navegación del Mapa',
                archivo: '/frontend/js/herramientas/navegacion-mapa.js',
                clase: 'ModuloNavegacion',
                dependencias: ['L', 'mapa'],
                carga_lazy: true
            },
            {
                id: 'control_gestos',
                nombre: 'Control de Gestos Táctiles',
                archivo: '/frontend/js/herramientas/control-gestos.js',
                clase: 'ModuloControlGestos',
                dependencias: ['L', 'mapa'],
                carga_lazy: true
            }
        ];

        // Cargar herramientas no-lazy primero
        for (const herramienta of herramientas_core) {
            if (!herramienta.carga_lazy) {
                await this.cargarHerramienta(herramienta);
            } else {
                // Solo registrar para carga posterior
                this.herramientas_registradas.set(herramienta.id, {
                    ...herramienta,
                    cargada: false,
                    instancia: null
                });
            }
        }

        console.log('🔄 Herramientas core registradas');
    }

    /**
     * CARGAR HERRAMIENTA ESPECÍFICA
     */
    async cargarHerramienta(config) {
        try {
            console.log(`🔄 Cargando herramienta: ${config.nombre}`);

            // Verificar dependencias específicas
            for (const dep of config.dependencias) {
                if (typeof window[dep] === 'undefined') {
                    console.warn(`⚠️ Dependencia ${dep} no disponible para ${config.nombre}`);
                }
            }

            // Cargar dinámicamente si es necesario
            if (config.archivo && !this.dependencias_cargadas.has(config.id)) {
                await this.cargarScript(config.archivo);
                this.dependencias_cargadas.add(config.id);
            }

            // Instanciar clase
            if (config.clase && window[config.clase]) {
                const instancia = new window[config.clase]();
                
                // Inicializar si tiene método init
                if (typeof instancia.init === 'function') {
                    await instancia.init();
                }

                // Registrar herramienta
                this.herramientas_registradas.set(config.id, {
                    ...config,
                    cargada: true,
                    instancia: instancia
                });

                console.log(`✅ ${config.nombre} cargada exitosamente`);
                return instancia;
            }

        } catch (error) {
            console.error(`❌ Error cargando ${config.nombre}:`, error);
            return null;
        }
    }

    /**
     * ACTIVAR HERRAMIENTA
     */
    async activarHerramienta(id, opciones = {}) {
        try {
            const config = this.herramientas_registradas.get(id);
            if (!config) {
                throw new Error(`Herramienta no registrada: ${id}`);
            }

            // Cargar si no está cargada (lazy loading)
            if (!config.cargada) {
                await this.cargarHerramienta(config);
            }

            // Desactivar herramienta actual
            if (this.herramienta_activa && this.herramienta_activa !== id) {
                await this.desactivarHerramientaActiva();
            }

            // Activar nueva herramienta
            const instancia = config.instancia;
            if (instancia && typeof instancia.activar === 'function') {
                await instancia.activar(opciones);
                this.herramienta_activa = id;
                
                // Emitir evento
                this.emitirEvento('herramienta-activada', {
                    id: id,
                    nombre: config.nombre,
                    opciones: opciones
                });

                console.log(`🎯 Herramienta activada: ${config.nombre}`);
                return instancia;
            }

        } catch (error) {
            console.error(`❌ Error activando herramienta ${id}:`, error);
            return null;
        }
    }

    /**
     * DESACTIVAR HERRAMIENTA ACTIVA
     */
    async desactivarHerramientaActiva() {
        if (!this.herramienta_activa) return;

        try {
            const config = this.herramientas_registradas.get(this.herramienta_activa);
            const instancia = config?.instancia;

            if (instancia && typeof instancia.desactivar === 'function') {
                await instancia.desactivar();
            }

            // Cleanup automático si está habilitado
            if (this.configuracion.auto_cleanup && instancia) {
                if (typeof instancia.limpiar === 'function') {
                    await instancia.limpiar();
                }
            }

            this.emitirEvento('herramienta-desactivada', {
                id: this.herramienta_activa,
                nombre: config?.nombre
            });

            console.log(`🔄 Herramienta desactivada: ${config?.nombre}`);
            this.herramienta_activa = null;

        } catch (error) {
            console.error('❌ Error desactivando herramienta:', error);
        }
    }

    /**
     * OBTENER HERRAMIENTA
     */
    obtenerHerramienta(id) {
        const config = this.herramientas_registradas.get(id);
        return config?.instancia || null;
    }

    /**
     * LISTAR HERRAMIENTAS DISPONIBLES
     */
    listarHerramientas() {
        const lista = [];
        for (const [id, config] of this.herramientas_registradas) {
            lista.push({
                id: id,
                nombre: config.nombre,
                cargada: config.cargada,
                activa: this.herramienta_activa === id
            });
        }
        return lista;
    }

    /**
     * CONFIGURAR EVENTOS
     */
    async configurarEventos() {
        // Escuchar eventos del EventBus
        if (window.EventBus) {
            window.EventBus.on('activar-herramienta', (data) => {
                this.activarHerramienta(data.id, data.opciones);
            });

            window.EventBus.on('desactivar-herramientas', () => {
                this.desactivarHerramientaActiva();
            });

            window.EventBus.on('cargar-herramienta', (data) => {
                this.cargarHerramientaPorDemanda(data.id);
            });
        }

        // Eventos del mapa
        if (window.mapa) {
            window.mapa.on('click', (e) => {
                this.emitirEvento('mapa-click', e);
            });
        }

        console.log('📡 Eventos configurados');
    }

    /**
     * CARGAR HERRAMIENTA POR DEMANDA
     */
    async cargarHerramientaPorDemanda(id) {
        const config = this.herramientas_registradas.get(id);
        if (config && !config.cargada) {
            return await this.cargarHerramienta(config);
        }
        return config?.instancia || null;
    }

    /**
     * UTILIDADES
     */
    async cargarScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    emitirEvento(tipo, datos) {
        if (window.EventBus) {
            window.EventBus.emit(`gestor-herramientas:${tipo}`, datos);
        }

        // También emitir evento DOM
        const evento = new CustomEvent(`gestor-herramientas:${tipo}`, { 
            detail: datos 
        });
        document.dispatchEvent(evento);
    }

    /**
     * OBTENER ESTADÍSTICAS
     */
    obtenerEstadisticas() {
        return {
            total_herramientas: this.herramientas_registradas.size,
            herramientas_cargadas: Array.from(this.herramientas_registradas.values())
                                        .filter(h => h.cargada).length,
            herramienta_activa: this.herramienta_activa,
            dependencias_cargadas: this.dependencias_cargadas.size
        };
    }
}

// Instancia global
window.GestorHerramientas = new GestorHerramientas();

// Auto-inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.GestorHerramientas.init();
    });
} else {
    window.GestorHerramientas.init();
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestorHerramientas;
}

console.log('🛠️ GestorHerramientas disponible globalmente');
