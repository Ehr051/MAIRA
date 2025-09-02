/**
 * 🗺️ MÓDULO NAVEGACIÓN DEL MAPA - MAIRA 4.0
 * Control de navegación, zoom, centrado y vistas del mapa
 * Separado de herramientasP.js para mejor modularización
 */

class ModuloNavegacionMapa {
    constructor() {
        this.vistas_guardadas = new Map();
        this.historial_navegacion = [];
        this.indice_historial = -1;
        this.animaciones_activas = new Map();
        
        this.configuracion = {
            zoom_minimo: 5,
            zoom_maximo: 18,
            zoom_defecto: 10,
            velocidad_animacion: 500,
            centro_defecto: { lat: -34.6118, lng: -58.3960 }, // Buenos Aires
            limites_argentina: {
                norte: -21.7,
                sur: -55.1,
                este: -53.6,
                oeste: -73.6
            },
            auto_ajustar_limites: true,
            mostrar_coordenadas: true,
            precision_coordenadas: 6
        };

        console.log('🗺️ ModuloNavegacionMapa inicializado');
    }

    /**
     * INICIALIZAR MÓDULO
     */
    async init() {
        try {
            await this.configurarControles();
            await this.configurarEventos();
            await this.configurarVistasRapidas();
            console.log('✅ ModuloNavegacionMapa listo');
        } catch (error) {
            console.error('❌ Error inicializando ModuloNavegacionMapa:', error);
        }
    }

    /**
     * CONFIGURAR CONTROLES DE NAVEGACIÓN
     */
    async configurarControles() {
        this.controles_disponibles = {
            zoom_in: {
                nombre: 'Acercar',
                icono: '🔍+',
                accion: () => this.zoomIn()
            },
            
            zoom_out: {
                nombre: 'Alejar',
                icono: '🔍-',
                accion: () => this.zoomOut()
            },
            
            centrar_argentina: {
                nombre: 'Centrar Argentina',
                icono: '🇦🇷',
                accion: () => this.centrarArgentina()
            },
            
            ir_ubicacion: {
                nombre: 'Ir a Ubicación',
                icono: '📍',
                accion: (coordenadas) => this.irAUbicacion(coordenadas)
            },
            
            vista_completa: {
                nombre: 'Vista Completa',
                icono: '🌍',
                accion: () => this.vistaCompleta()
            },
            
            navegacion_anterior: {
                nombre: 'Vista Anterior',
                icono: '⬅️',
                accion: () => this.navegarAtras()
            },
            
            navegacion_siguiente: {
                nombre: 'Vista Siguiente',
                icono: '➡️',
                accion: () => this.navegarAdelante()
            },
            
            guardar_vista: {
                nombre: 'Guardar Vista',
                icono: '💾',
                accion: (nombre) => this.guardarVista(nombre)
            },
            
            cargar_vista: {
                nombre: 'Cargar Vista',
                icono: '📂',
                accion: (nombre) => this.cargarVista(nombre)
            }
        };

        console.log('🎮 Controles de navegación configurados');
    }

    /**
     * ZOOM IN (ACERCAR)
     */
    async zoomIn(nivel = 1) {
        if (!window.mapa) return;

        const zoom_actual = window.mapa.getZoom();
        const nuevo_zoom = Math.min(zoom_actual + nivel, this.configuracion.zoom_maximo);
        
        await this.animarZoom(nuevo_zoom);
        this.log(`🔍+ Zoom In: ${zoom_actual} → ${nuevo_zoom}`);
    }

    /**
     * ZOOM OUT (ALEJAR)
     */
    async zoomOut(nivel = 1) {
        if (!window.mapa) return;

        const zoom_actual = window.mapa.getZoom();
        const nuevo_zoom = Math.max(zoom_actual - nivel, this.configuracion.zoom_minimo);
        
        await this.animarZoom(nuevo_zoom);
        this.log(`🔍- Zoom Out: ${zoom_actual} → ${nuevo_zoom}`);
    }

    /**
     * ANIMAR ZOOM
     */
    async animarZoom(nuevo_zoom, centro = null) {
        if (!window.mapa) return;

        return new Promise((resolve) => {
            const opciones = {
                zoom: nuevo_zoom,
                animate: true,
                duration: this.configuracion.velocidad_animacion / 1000
            };

            if (centro) {
                window.mapa.setView(centro, nuevo_zoom, opciones);
            } else {
                window.mapa.setZoom(nuevo_zoom, opciones);
            }

            setTimeout(() => {
                this.agregarAlHistorial();
                this.emitirEvento('zoom-cambiado', { nuevo_zoom, centro });
                resolve();
            }, this.configuracion.velocidad_animacion);
        });
    }

    /**
     * IR A UBICACIÓN ESPECÍFICA
     */
    async irAUbicacion(coordenadas, zoom = null) {
        if (!window.mapa || !coordenadas) return;

        const lat = parseFloat(coordenadas.lat);
        const lng = parseFloat(coordenadas.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.error('❌ Coordenadas inválidas:', coordenadas);
            return;
        }

        const centro = L.latLng(lat, lng);
        const zoom_objetivo = zoom || window.mapa.getZoom();

        await this.animarVista(centro, zoom_objetivo);
        this.log(`📍 Navegando a: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }

    /**
     * ANIMAR VISTA (CENTRO + ZOOM)
     */
    async animarVista(centro, zoom) {
        if (!window.mapa) return;

        return new Promise((resolve) => {
            window.mapa.setView(centro, zoom, {
                animate: true,
                duration: this.configuracion.velocidad_animacion / 1000
            });

            setTimeout(() => {
                this.agregarAlHistorial();
                this.emitirEvento('vista-cambiada', { centro, zoom });
                resolve();
            }, this.configuracion.velocidad_animacion);
        });
    }

    /**
     * CENTRAR EN ARGENTINA
     */
    async centrarArgentina() {
        const limites = this.configuracion.limites_argentina;
        const bounds = L.latLngBounds(
            [limites.sur, limites.oeste],
            [limites.norte, limites.este]
        );

        if (window.mapa) {
            window.mapa.fitBounds(bounds, {
                animate: true,
                duration: this.configuracion.velocidad_animacion / 1000,
                padding: [20, 20]
            });

            setTimeout(() => {
                this.agregarAlHistorial();
                this.emitirEvento('argentina-centrada', { bounds });
            }, this.configuracion.velocidad_animacion);
        }

        this.log('🇦🇷 Argentina centrada');
    }

    /**
     * OBTENER COORDENADAS ACTUALES
     */
    obtenerCoordenadas() {
        if (!window.mapa) return null;

        const centro = window.mapa.getCenter();
        const zoom = window.mapa.getZoom();
        const bounds = window.mapa.getBounds();

        return {
            centro: {
                lat: parseFloat(centro.lat.toFixed(this.configuracion.precision_coordenadas)),
                lng: parseFloat(centro.lng.toFixed(this.configuracion.precision_coordenadas))
            },
            zoom: zoom,
            bounds: {
                norte: parseFloat(bounds.getNorth().toFixed(this.configuracion.precision_coordenadas)),
                sur: parseFloat(bounds.getSouth().toFixed(this.configuracion.precision_coordenadas)),
                este: parseFloat(bounds.getEast().toFixed(this.configuracion.precision_coordenadas)),
                oeste: parseFloat(bounds.getWest().toFixed(this.configuracion.precision_coordenadas))
            }
        };
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        if (!window.mapa) return;

        // Eventos de zoom
        window.mapa.on('zoomend', () => {
            this.emitirEvento('zoom-finalizado', {
                zoom: window.mapa.getZoom()
            });
        });

        // Eventos de movimiento
        window.mapa.on('moveend', () => {
            this.emitirEvento('movimiento-finalizado', {
                centro: window.mapa.getCenter()
            });
        });

        console.log('🎮 Eventos de navegación configurados');
    }

    /**
     * CONTROL DEL MÓDULO
     */
    async activar(opciones = {}) {
        this.configuracion = { ...this.configuracion, ...opciones };
        
        console.log('🗺️ Módulo navegación del mapa activado');
        this.emitirEvento('modulo-activado', opciones);
    }

    async desactivar() {
        this.animaciones_activas.clear();
        
        console.log('🔄 Módulo navegación del mapa desactivado');
        this.emitirEvento('modulo-desactivado', {});
    }

    /**
     * UTILIDADES
     */
    emitirEvento(tipo, datos) {
        if (window.EventBus) {
            window.EventBus.emit(`navegacion-mapa:${tipo}`, datos);
        }
    }

    log(mensaje, datos = null) {
        console.log(mensaje, datos);
    }

    agregarAlHistorial() {
        // Implementación básica del historial
        if (!window.mapa) return;
        
        const estado = {
            centro: window.mapa.getCenter(),
            zoom: window.mapa.getZoom(),
            timestamp: Date.now()
        };
        
        this.historial_navegacion.push(estado);
        this.indice_historial = this.historial_navegacion.length - 1;
    }

    async configurarVistasRapidas() {
        this.vistas_rapidas = {
            'argentina_completa': {
                nombre: 'Argentina Completa',
                centro: { lat: -38.4161, lng: -63.6167 },
                zoom: 5
            },
            
            'buenos_aires': {
                nombre: 'Buenos Aires',
                centro: { lat: -34.6118, lng: -58.3960 },
                zoom: 10
            }
        };
        console.log('⚡ Vistas rápidas configuradas');
    }
}

// Registrar módulo globalmente
window.ModuloNavegacionMapa = new ModuloNavegacionMapa();

console.log('🗺️ ModuloNavegacionMapa disponible');
