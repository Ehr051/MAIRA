

// Contenido completo del archivo gestorMapa.js ajustado para depender de map inicializado
class GestorMapa extends GestorBase {
    constructor() {
        super();
            // Verificar que el map global existe y está inicializado
            if (!window.map) {
                console.error('[GestorMapa] window.map no existe');
                throw new Error('El map debe estar inicializado antes de usar GestorMapa');
            }
            
            // Verificar que el map tiene métodos básicos (está inicializado)
            if (!window.map.getCenter || typeof window.map.getCenter !== 'function') {
                console.error('[GestorMapa] window.map existe pero no está inicializado completamente');
                console.log('[GestorMapa] Tipo de map:', typeof window.map);
                console.log('[GestorMapa] Propiedades disponibles:', Object.keys(window.map || {}));
                throw new Error('El map debe estar completamente inicializado antes de usar GestorMapa');
            }
            this.map = window.map;
            this.calcoGlobal = null;
            this.calcoActivo = null;
            this.hexGrid = null;
            this.emisorEventos = new EventEmitter();
        }
    
        async inicializar(config) {
            console.log('Inicializando GestorMapa...');
            
            try {
                // Crear calco global
                this.crearCalcoGlobal();
                
                // Inicializar HexGrid
                await this.inicializarHexGrid();
    
                console.log('GestorMapa inicializado correctamente');
                return true;
            } catch (error) {
                console.error('Error al inicializar GestorMapa:', error);
                throw error;
            }
        }
    
        async inicializarHexGrid() {
            return new Promise((resolve, reject) => {
                try {
                    console.log('Generando grid hexagonal...');
                    if (!window.HexGrid) {
                        throw new Error('Módulo HexGrid no encontrado');
                    }
                    // Verificar si la hexgrid ya fue inicializada
                    if (window.hexGridInitialized) {
                        console.warn('HexGrid ya está inicializada.');
                        return resolve();
                    }
        
                    // Código de inicialización del hexgrid
                    window.HexGrid.initialize(this.map);
                    window.hexGridInitialized = true;
        
                    console.log('Grid hexagonal inicializado correctamente');
                    resolve();
                } catch (error) {
                    console.error('Error al generar hexágonos:', error);
                    reject(error);
                }
            });
        }
    
        configurarEventosMapa() {
            this.map.on('dblclick contextmenu', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                // Reemplazar menú contextual por menú radial
                if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
                    window.MiRadial.selectedUnit = null;
                    window.MiRadial.selectedHex = null;
                    window.MiRadial.mostrarMenu(e.containerPoint.x, e.containerPoint.y, 'map', e.latlng);
                } else {
                    console.warn('❌ MiRadial no disponible para menú contextual del map');
                }
            });

            this.map.on('click', (e) => {
                const gestorFases = this.gestorJuego?.gestorFases;
                
                // SI está dibujando sector o zona, NO mostrar menú radial
                // (L.Draw maneja automáticamente los clicks durante el dibujo)
                if (gestorFases && (gestorFases.dibujandoSector || gestorFases.dibujandoZona)) {
                    console.log('🎨 Modo dibujo activo - L.Draw manejando clicks');
                    return; // Dejar que L.Draw procese el click sin interferir
                }
                
                // SI NO está en modo dibujo, mostrar menú radial con click izquierdo
                if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
                    const point = this.map.latLngToContainerPoint(e.latlng);
                    window.MiRadial.mostrarMenu(point.x, point.y, 'map', e.latlng);
                }
            });
        }
    crearCalcoGlobal() {
        this.calcoGlobal = L.layerGroup().addTo(this.map);
        this.calcoActivo = this.calcoGlobal;
        window.calcoGlobal = this.calcoGlobal;
        window.calcoActivo = this.calcoActivo;
    }

    // En GestorMapa.js
    async inicializarHexGrid() {
        try {
            console.log('Generando grid hexagonal...');
            if (!window.HexGrid) {
                throw new Error('Módulo HexGrid no encontrado');
            }
            // Verificar si la hexgrid ya fue inicializada
            if (window.hexGridInitialized) {
                console.warn('HexGrid ya está inicializada.');
                return;
            }

            // Corrección del método initialize
            window.HexGrid.initialize(this.map);  // Cambio de initalize a initialize
            window.hexGridInitialized = true;

            console.log('Grid hexagonal inicializado correctamente');

        } catch (error) {
            console.error('Error al inicializar HexGrid:', error);
            // No lanzamos el error para permitir que la aplicación continúe
            console.warn('Continuando sin HexGrid...');
        }
    }

    getHexagonoEn(latlng) {
        if (!this.hexGrid) {
            console.warn('HexGrid no inicializada');
            return null;
        }
        return this.hexGrid.getHexagonAt(latlng);
    }

    marcarHexagono(hexagono, estilo) {
        if (!hexagono) return;
        hexagono.setStyle(estilo || {
            color: '#ff4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff4444',
            fillOpacity: 0.3
        });
    }

    limpiarMarcadoHexagono(hexagono) {
        if (!hexagono) return;
        hexagono.setStyle({
            color: '#3388ff',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0
        });
    }

    destruir() {
        this.map.off();

        if (this.calcoGlobal) {
            this.calcoGlobal.clearLayers();
        }

        if (this.herramientasDibujo) {
            this.map.removeControl(this.herramientasDibujo);
        }

        if (this.hexGrid) {
            this.hexGrid.clear();
        }

        window.calcoGlobal = null;
        window.calcoActivo = null;
    }
}

window.GestorMapa = GestorMapa;

