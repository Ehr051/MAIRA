/**
 * 🌍 MÓDULO GEOCODER - MAIRA 4.0
 * Funcionalidades específicas de geolocalización y búsqueda geográfica
 * Extraído y optimizado desde herramientasP.js
 */

class ModuloGeocoder {
    constructor() {
        this.geocoder = null;
        this.cache_busquedas = new Map();
        this.configuracion = {
            proveedor: 'nominatim', // nominatim, mapbox, google
            idioma: 'es',
            pais: 'AR', // Argentina
            limite_resultados: 5,
            cache_ttl: 300000 // 5 minutos
        };
        
        console.log('🌍 ModuloGeocoder inicializado');
    }

    /**
     * INICIALIZAR MÓDULO
     */
    async init() {
        try {
            await this.configurarProveedor();
            await this.configurarInterfaz();
            console.log('✅ ModuloGeocoder listo');
        } catch (error) {
            console.error('❌ Error inicializando ModuloGeocoder:', error);
        }
    }

    /**
     * CONFIGURAR PROVEEDOR DE GEOCODING
     */
    async configurarProveedor() {
        // Verificar si Leaflet está disponible
        if (typeof L === 'undefined') {
            throw new Error('Leaflet no está disponible');
        }

        // Configurar geocoder según proveedor
        switch (this.configuracion.proveedor) {
            case 'nominatim':
                this.geocoder = L.Control.Geocoder.nominatim({
                    geocodingQueryParams: {
                        countrycodes: this.configuracion.pais.toLowerCase(),
                        'accept-language': this.configuracion.idioma,
                        limit: this.configuracion.limite_resultados
                    }
                });
                break;

            case 'mapbox':
                // Requiere API key
                if (window.CONFIG && window.CONFIG.MAPBOX_TOKEN) {
                    this.geocoder = L.Control.Geocoder.mapbox(window.CONFIG.MAPBOX_TOKEN);
                } else {
                    console.warn('⚠️ Token Mapbox no configurado, usando Nominatim');
                    this.configuracion.proveedor = 'nominatim';
                    return this.configurarProveedor();
                }
                break;

            default:
                this.geocoder = L.Control.Geocoder.nominatim();
        }

        console.log(`🌍 Proveedor configurado: ${this.configuracion.proveedor}`);
    }

    /**
     * CONFIGURAR INTERFAZ
     */
    async configurarInterfaz() {
        // Crear control de búsqueda si no existe
        if (window.mapa && !document.getElementById('geocoder-search')) {
            this.crearControlBusqueda();
        }

        // Configurar eventos
        this.configurarEventos();
    }

    /**
     * CREAR CONTROL DE BÚSQUEDA
     */
    crearControlBusqueda() {
        const searchControl = L.Control.geocoder({
            geocoder: this.geocoder,
            position: 'topright',
            placeholder: 'Buscar ubicación...',
            errorMessage: 'No se encontraron resultados',
            showResultIcons: true,
            suggestMinLength: 3,
            suggestTimeout: 250,
            queryMinLength: 3
        });

        // Personalizar eventos del control
        searchControl.on('markgeocode', (e) => {
            this.manejarResultadoBusqueda(e);
        });

        searchControl.addTo(window.mapa);
        
        // Guardar referencia
        this.controlBusqueda = searchControl;
        
        console.log('🔍 Control de búsqueda agregado al mapa');
    }

    /**
     * BUSCAR UBICACIÓN
     */
    async buscarUbicacion(query, opciones = {}) {
        try {
            // Verificar cache primero
            const cacheKey = `${query}_${JSON.stringify(opciones)}`;
            const cached = this.obtenerDeCache(cacheKey);
            if (cached) {
                console.log('📋 Resultado desde cache:', query);
                return cached;
            }

            console.log('🔍 Buscando ubicación:', query);

            return new Promise((resolve, reject) => {
                this.geocoder.geocode(query, (results) => {
                    if (results && results.length > 0) {
                        // Guardar en cache
                        this.guardarEnCache(cacheKey, results);
                        
                        // Procesar resultados
                        const procesados = this.procesarResultados(results);
                        
                        console.log(`✅ Encontrados ${procesados.length} resultados para: ${query}`);
                        resolve(procesados);
                    } else {
                        console.warn(`⚠️ No se encontraron resultados para: ${query}`);
                        resolve([]);
                    }
                });
            });

        } catch (error) {
            console.error('❌ Error en búsqueda:', error);
            throw error;
        }
    }

    /**
     * BUSCAR COORDENADAS INVERSAS
     */
    async buscarCoordenadas(lat, lng, opciones = {}) {
        try {
            const cacheKey = `reverse_${lat}_${lng}`;
            const cached = this.obtenerDeCache(cacheKey);
            if (cached) {
                return cached;
            }

            console.log(`🔍 Búsqueda inversa: ${lat}, ${lng}`);

            return new Promise((resolve, reject) => {
                this.geocoder.reverse(
                    L.latLng(lat, lng),
                    window.mapa.getZoom(),
                    (results) => {
                        if (results && results.length > 0) {
                            this.guardarEnCache(cacheKey, results);
                            resolve(this.procesarResultados(results));
                        } else {
                            resolve([]);
                        }
                    }
                );
            });

        } catch (error) {
            console.error('❌ Error en búsqueda inversa:', error);
            throw error;
        }
    }

    /**
     * PROCESAR RESULTADOS
     */
    procesarResultados(results) {
        return results.map(result => ({
            nombre: result.name || result.properties?.display_name || 'Ubicación',
            coordenadas: {
                lat: result.center ? result.center.lat : result.lat,
                lng: result.center ? result.center.lng : result.lng
            },
            bbox: result.bbox,
            tipo: result.properties?.type || 'ubicacion',
            importancia: result.properties?.importance || 0,
            direccion: result.properties?.display_name || '',
            original: result
        }));
    }

    /**
     * MANEJAR RESULTADO DE BÚSQUEDA
     */
    manejarResultadoBusqueda(evento) {
        const resultado = evento.geocode;
        
        console.log('📍 Ubicación seleccionada:', resultado.name);

        // Centrar mapa en resultado
        if (window.mapa) {
            window.mapa.setView(resultado.center, 15);
            
            // Crear marcador si no existe
            if (this.marcadorBusqueda) {
                window.mapa.removeLayer(this.marcadorBusqueda);
            }
            
            this.marcadorBusqueda = L.marker(resultado.center)
                .addTo(window.mapa)
                .bindPopup(`
                    <div>
                        <h4>${resultado.name}</h4>
                        <p>${resultado.html || resultado.properties?.display_name || ''}</p>
                        <small>Lat: ${resultado.center.lat.toFixed(6)}, Lng: ${resultado.center.lng.toFixed(6)}</small>
                    </div>
                `)
                .openPopup();
        }

        // Emitir evento para otros módulos
        this.emitirEvento('ubicacion-encontrada', {
            resultado: resultado,
            coordenadas: resultado.center
        });
    }

    /**
     * OBTENER UBICACIÓN ACTUAL
     */
    async obtenerUbicacionActual() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    console.log('📍 Ubicación actual obtenida:', coords);

                    // Buscar información de la ubicación
                    try {
                        const info = await this.buscarCoordenadas(coords.lat, coords.lng);
                        resolve({
                            coordenadas: coords,
                            precision: position.coords.accuracy,
                            info: info[0] || null
                        });
                    } catch (error) {
                        resolve({
                            coordenadas: coords,
                            precision: position.coords.accuracy,
                            info: null
                        });
                    }
                },
                (error) => {
                    console.error('❌ Error obteniendo ubicación:', error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutos
                }
            );
        });
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        // Escuchar eventos del mapa
        if (window.mapa) {
            window.mapa.on('click', (e) => {
                // Opcionalmente mostrar búsqueda inversa en click
                if (this.configuracion.busqueda_en_click) {
                    this.buscarCoordenadas(e.latlng.lat, e.latlng.lng);
                }
            });
        }

        // Escuchar eventos del EventBus
        if (window.EventBus) {
            window.EventBus.on('buscar-ubicacion', (data) => {
                this.buscarUbicacion(data.query, data.opciones);
            });

            window.EventBus.on('obtener-ubicacion-actual', () => {
                this.obtenerUbicacionActual();
            });
        }
    }

    /**
     * GESTIÓN DE CACHE
     */
    obtenerDeCache(key) {
        const cached = this.cache_busquedas.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.configuracion.cache_ttl) {
            return cached.data;
        }
        return null;
    }

    guardarEnCache(key, data) {
        this.cache_busquedas.set(key, {
            data: data,
            timestamp: Date.now()
        });

        // Limpiar cache si tiene muchas entradas
        if (this.cache_busquedas.size > 100) {
            this.limpiarCache();
        }
    }

    limpiarCache() {
        const ahora = Date.now();
        for (const [key, value] of this.cache_busquedas.entries()) {
            if ((ahora - value.timestamp) > this.configuracion.cache_ttl) {
                this.cache_busquedas.delete(key);
            }
        }
    }

    /**
     * ACTIVAR MÓDULO
     */
    async activar(opciones = {}) {
        Object.assign(this.configuracion, opciones);
        
        if (!this.controlBusqueda && window.mapa) {
            this.crearControlBusqueda();
        }
        
        console.log('✅ ModuloGeocoder activado');
    }

    /**
     * DESACTIVAR MÓDULO
     */
    async desactivar() {
        if (this.controlBusqueda && window.mapa) {
            window.mapa.removeControl(this.controlBusqueda);
            this.controlBusqueda = null;
        }
        
        if (this.marcadorBusqueda && window.mapa) {
            window.mapa.removeLayer(this.marcadorBusqueda);
            this.marcadorBusqueda = null;
        }
        
        console.log('✅ ModuloGeocoder desactivado');
    }

    /**
     * EMITIR EVENTO
     */
    emitirEvento(evento, datos) {
        if (window.EventBus) {
            window.EventBus.emit(evento, datos);
        }
    }

    /**
     * OBTENER ESTADÍSTICAS
     */
    obtenerEstadisticas() {
        return {
            proveedor: this.configuracion.proveedor,
            busquedas_en_cache: this.cache_busquedas.size,
            control_activo: !!this.controlBusqueda,
            marcador_activo: !!this.marcadorBusqueda
        };
    }
}

// Registrar módulo globalmente
window.HerramientaModule = new ModuloGeocoder();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloGeocoder;
}

console.log('🌍 ModuloGeocoder disponible');
