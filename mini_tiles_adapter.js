/**
 * 🔧 MINI-TILES ADAPTER v3.0
 * 
 * Adaptador para cargar mini-tiles de ~25km desde GitHub Releases
 * Cada provincia está dividida en múltiples archivos TAR pequeños
 */

class MiniTilesAdapter {
    constructor() {
        this.baseUrl = 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/';
        this.cdnUrl = 'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v3.0/';
        this.masterIndex = null;
        this.provinciaCache = new Map();
        this.miniTilesCache = new Map();
        this.loadedTarFiles = new Set();
        this.useCdn = false;
        
        console.log('🔧 MiniTilesAdapter v3.0 inicializado');
    }
    
    /**
     * Carga el índice maestro de mini-tiles
     */
    async loadMasterIndex() {
        if (this.masterIndex) return this.masterIndex;
        
        console.log('📖 Cargando índice maestro de mini-tiles...');
        
        try {
            const url = (this.useCdn ? this.cdnUrl : this.baseUrl) + 'master_mini_tiles_index.json';
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            this.masterIndex = await response.json();
            console.log(`✅ Índice maestro cargado: ${Object.keys(this.masterIndex.provincias).length} provincias`);
            
            return this.masterIndex;
            
        } catch (error) {
            console.warn(`⚠️ Error cargando desde ${this.useCdn ? 'CDN' : 'GitHub'}:`, error);
            
            // Intentar con el otro método
            if (!this.useCdn) {
                this.useCdn = true;
                return this.loadMasterIndex();
            }
            
            // Fallback: índice básico
            console.log('🔄 Usando índice básico de fallback');
            this.masterIndex = {
                provincias: {
                    'buenos_aires': {
                        total_tiles: 100,
                        tar_files: ['buenos_aires_part_01.tar.gz'],
                        index_file: 'buenos_aires_mini_tiles_index.json'
                    }
                }
            };
            
            return this.masterIndex;
        }
    }
    
    /**
     * Determina la provincia para una coordenada
     */
    getProvinciaForCoordinate(lat, lon) {
        // Mapa simplificado de provincias argentinas
        const provinciasMap = {
            'buenos_aires': {lat: [-39.5, -33.5], lon: [-63.5, -56.5]},
            'cordoba': {lat: [-35.0, -29.5], lon: [-66.0, -62.0]},
            'santa_fe': {lat: [-34.0, -28.0], lon: [-63.0, -59.0]},
            'mendoza': {lat: [-37.5, -32.0], lon: [-70.5, -66.5]},
            'tucuman': {lat: [-28.0, -26.0], lon: [-66.5, -64.5]},
            'entre_rios': {lat: [-34.0, -30.0], lon: [-60.5, -57.5]},
            'salta': {lat: [-26.0, -21.5], lon: [-68.5, -62.0]},
            'misiones': {lat: [-28.0, -25.5], lon: [-56.5, -53.5]},
            'chaco': {lat: [-28.0, -24.0], lon: [-63.5, -58.5]},
            'corrientes': {lat: [-30.5, -27.0], lon: [-59.5, -55.5]},
            'santiago_del_estero': {lat: [-30.0, -26.0], lon: [-65.5, -61.0]},
            'san_luis': {lat: [-34.5, -32.0], lon: [-67.5, -65.0]},
            'formosa': {lat: [-26.5, -22.0], lon: [-62.5, -57.5]},
            'neuquen': {lat: [-41.0, -36.0], lon: [-71.5, -68.0]},
            'chubut': {lat: [-46.5, -42.0], lon: [-72.0, -63.5]},
            'rio_negro': {lat: [-42.0, -37.5], lon: [-71.5, -62.5]},
            'santa_cruz': {lat: [-52.5, -46.0], lon: [-73.5, -65.5]},
            'la_pampa': {lat: [-39.0, -35.0], lon: [-68.0, -63.0]},
            'catamarca': {lat: [-29.5, -25.5], lon: [-69.0, -65.0]},
            'la_rioja': {lat: [-31.5, -28.0], lon: [-69.5, -66.0]},
            'san_juan': {lat: [-33.0, -30.0], lon: [-70.0, -67.0]},
            'jujuy': {lat: [-24.5, -21.5], lon: [-67.0, -64.0]},
            'tierra_del_fuego': {lat: [-55.5, -52.5], lon: [-69.0, -63.5]}
        };
        
        for (const [provincia, bounds] of Object.entries(provinciasMap)) {
            const [latMin, latMax] = bounds.lat;
            const [lonMin, lonMax] = bounds.lon;
            
            if (lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax) {
                return provincia;
            }
        }
        
        return 'otros'; // Si no encaja en ninguna provincia específica
    }
    
    /**
     * Carga el índice de mini-tiles de una provincia
     */
    async loadProvinciaIndex(provincia) {
        if (this.provinciaCache.has(provincia)) {
            return this.provinciaCache.get(provincia);
        }
        
        if (!this.masterIndex) {
            await this.loadMasterIndex();
        }
        
        const provinciaInfo = this.masterIndex.provincias[provincia];
        if (!provinciaInfo) {
            console.warn(`⚠️ Provincia ${provincia} no encontrada`);
            return null;
        }
        
        console.log(`📦 Cargando índice de provincia ${provincia}...`);
        
        try {
            const url = (this.useCdn ? this.cdnUrl : this.baseUrl) + provinciaInfo.index_file;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const provinciaIndex = await response.json();
            this.provinciaCache.set(provincia, provinciaIndex);
            
            console.log(`✅ Provincia ${provincia} cargada: ${provinciaIndex.total_tiles} mini-tiles`);
            return provinciaIndex;
            
        } catch (error) {
            console.warn(`❌ Error cargando provincia ${provincia}:`, error);
            return null;
        }
    }
    
    /**
     * Busca un mini-tile específico para una coordenada
     */
    async findMiniTile(lat, lon) {
        // Determinar provincia
        const provincia = this.getProvinciaForCoordinate(lat, lon);
        if (!provincia) {
            console.warn(`⚠️ No se encontró provincia para ${lat}, ${lon}`);
            return null;
        }
        
        // Cargar índice de la provincia
        const provinciaIndex = await this.loadProvinciaIndex(provincia);
        if (!provinciaIndex) {
            return null;
        }
        
        // Buscar mini-tile que contenga la coordenada
        for (const [tileId, tileInfo] of Object.entries(provinciaIndex.tiles)) {
            const bounds = tileInfo.bounds;
            
            if (lat >= bounds.south && lat <= bounds.north &&
                lon >= bounds.west && lon <= bounds.east) {
                
                console.log(`🎯 Mini-tile encontrado: ${tileId} en provincia ${provincia}`);
                
                // Verificar si necesitamos cargar el archivo TAR
                await this.ensureTarFileLoaded(tileInfo.tar_file);
                
                return {
                    ...tileInfo,
                    id: tileId,
                    provincia: provincia
                };
            }
        }
        
        console.warn(`⚠️ No se encontró mini-tile para ${lat}, ${lon} en provincia ${provincia}`);
        return null;
    }
    
    /**
     * Asegura que un archivo TAR esté "cargado" (disponible)
     */
    async ensureTarFileLoaded(tarFileName) {
        if (this.loadedTarFiles.has(tarFileName)) {
            return true; // Ya está "cargado"
        }
        
        console.log(`📦 Preparando archivo TAR: ${tarFileName}`);
        
        // En una implementación real, aquí se descargaría y extraería el TAR
        // Por ahora, solo marcamos como "disponible"
        this.loadedTarFiles.add(tarFileName);
        
        // Simular verificación de disponibilidad
        const tarUrl = (this.useCdn ? this.cdnUrl : this.baseUrl) + tarFileName;
        
        try {
            const response = await fetch(tarUrl, { method: 'HEAD' });
            if (response.ok) {
                console.log(`✅ TAR disponible: ${tarFileName}`);
                return true;
            } else {
                console.warn(`⚠️ TAR no disponible: ${tarFileName}`);
                return false;
            }
        } catch (error) {
            console.warn(`❌ Error verificando TAR ${tarFileName}:`, error);
            return false;
        }
    }
    
    /**
     * Pre-carga mini-tiles para una región específica
     */
    async preloadRegion(centerLat, centerLon, radiusKm = 50) {
        console.log(`🔄 Pre-cargando región: ${centerLat}, ${centerLon} (radio: ${radiusKm}km)`);
        
        // Calcular bounds de la región
        const latDelta = radiusKm / 111; // Aproximadamente 1 grado = 111km
        const lonDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));
        
        const minLat = centerLat - latDelta;
        const maxLat = centerLat + latDelta;
        const minLon = centerLon - lonDelta;
        const maxLon = centerLon + lonDelta;
        
        // Determinar provincias que intersectan con la región
        const provinciasToLoad = new Set();
        
        // Muestrear varios puntos en la región
        for (let lat = minLat; lat <= maxLat; lat += latDelta / 4) {
            for (let lon = minLon; lon <= maxLon; lon += lonDelta / 4) {
                const provincia = this.getProvinciaForCoordinate(lat, lon);
                if (provincia) {
                    provinciasToLoad.add(provincia);
                }
            }
        }
        
        // Cargar índices de todas las provincias necesarias
        const loadPromises = Array.from(provinciasToLoad).map(provincia => 
            this.loadProvinciaIndex(provincia)
        );
        
        await Promise.all(loadPromises);
        
        console.log(`✅ Pre-carga completada: ${provinciasToLoad.size} provincias`);
    }
    
    /**
     * Obtiene estadísticas del adaptador
     */
    getStats() {
        return {
            masterIndexLoaded: !!this.masterIndex,
            provinciasInCache: this.provinciaCache.size,
            loadedTarFiles: this.loadedTarFiles.size,
            usingCdn: this.useCdn,
            totalProvincias: this.masterIndex ? Object.keys(this.masterIndex.provincias).length : 0
        };
    }
}

// Instancia global
window.miniTilesAdapter = new MiniTilesAdapter();

console.log('🔧 MiniTilesAdapter v3.0 disponible globalmente');
