/**
 * 🗺️ ELEVATION FAJAS ADAPTER
 * 
 * Adaptador inteligente que carga tiles por fajas geográficas
 * Solo descarga las fajas necesarias según la región consultada
 */

class ElevationFajasAdapter {
    constructor() {
        this.baseUrl = 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v2.0/';
        this.cdnUrl = 'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v2.0/';
        this.masterIndex = null;
        this.fajasCache = new Map();
        this.loadedFajas = new Set();
        this.useCdn = false; // Empezar con GitHub directo
        
        console.log('🗺️ ElevationFajasAdapter inicializado');
    }
    
    /**
     * Carga el índice maestro de fajas
     */
    async loadMasterIndex() {
        if (this.masterIndex) return this.masterIndex;
        
        console.log('📖 Cargando índice maestro de fajas...');
        
        try {
            const url = (this.useCdn ? this.cdnUrl : this.baseUrl) + 'master_index_fajas.json';
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            this.masterIndex = await response.json();
            console.log(`✅ Índice maestro cargado: ${Object.keys(this.masterIndex.fajas).length} fajas disponibles`);
            
            return this.masterIndex;
            
        } catch (error) {
            console.warn(`⚠️ Error cargando desde ${this.useCdn ? 'CDN' : 'GitHub'}:`, error);
            
            // Intentar con el otro método
            if (!this.useCdn) {
                this.useCdn = true;
                return this.loadMasterIndex();
            }
            
            // Fallback: crear índice mínimo
            console.log('🔄 Usando índice mínimo de fallback');
            this.masterIndex = {
                fajas: {
                    centro: {
                        json_file: 'index_tiles_altimetria_centro.json',
                        lat_range: [-44, -37],
                        tiles_count: 399
                    }
                }
            };
            
            return this.masterIndex;
        }
    }
    
    /**
     * Determina qué faja necesitamos para una coordenada
     */
    getFajaForCoordinate(lat, lon) {
        if (!this.masterIndex) return null;
        
        for (const [fajaName, fajaInfo] of Object.entries(this.masterIndex.fajas)) {
            const [latMin, latMax] = fajaInfo.lat_range;
            if (lat >= latMin && lat < latMax) {
                return fajaName;
            }
        }
        
        // Si no encuentra exacta, buscar la más cercana
        let closestFaja = null;
        let minDistance = Infinity;
        
        for (const [fajaName, fajaInfo] of Object.entries(this.masterIndex.fajas)) {
            const [latMin, latMax] = fajaInfo.lat_range;
            const latCenter = (latMin + latMax) / 2;
            const distance = Math.abs(lat - latCenter);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestFaja = fajaName;
            }
        }
        
        return closestFaja;
    }
    
    /**
     * Carga una faja específica
     */
    async loadFaja(fajaName) {
        if (this.fajasCache.has(fajaName)) {
            return this.fajasCache.get(fajaName);
        }
        
        if (!this.masterIndex) {
            await this.loadMasterIndex();
        }
        
        const fajaInfo = this.masterIndex.fajas[fajaName];
        if (!fajaInfo) {
            console.warn(`⚠️ Faja ${fajaName} no encontrada`);
            return null;
        }
        
        console.log(`📦 Cargando faja ${fajaName} (${fajaInfo.tiles_count} tiles)...`);
        
        try {
            const url = (this.useCdn ? this.cdnUrl : this.baseUrl) + fajaInfo.json_file;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const fajaData = await response.json();
            this.fajasCache.set(fajaName, fajaData);
            this.loadedFajas.add(fajaName);
            
            console.log(`✅ Faja ${fajaName} cargada: ${Object.keys(fajaData.tiles).length} tiles`);
            return fajaData;
            
        } catch (error) {
            console.warn(`❌ Error cargando faja ${fajaName}:`, error);
            
            // Intentar con el otro método
            if (!this.useCdn) {
                this.useCdn = true;
                return this.loadFaja(fajaName);
            }
            
            return null;
        }
    }
    
    /**
     * Busca un tile específico (carga fajas bajo demanda)
     */
    async findTile(lat, lon) {
        // Determinar qué faja necesitamos
        const fajaName = this.getFajaForCoordinate(lat, lon);
        if (!fajaName) {
            console.warn(`⚠️ No se encontró faja para coordenada ${lat}, ${lon}`);
            return null;
        }
        
        // Cargar la faja si no está cargada
        const fajaData = await this.loadFaja(fajaName);
        if (!fajaData) {
            return null;
        }
        
        // Buscar el tile en la faja
        for (const [tileId, tileInfo] of Object.entries(fajaData.tiles)) {
            const bounds = tileInfo.bounds;
            
            if (lat >= bounds.south && lat <= bounds.north &&
                lon >= bounds.west && lon <= bounds.east) {
                
                console.log(`🎯 Tile encontrado en faja ${fajaName}: ${tileId}`);
                return {
                    ...tileInfo,
                    id: tileId,
                    faja: fajaName
                };
            }
        }
        
        console.warn(`⚠️ No se encontró tile para ${lat}, ${lon} en faja ${fajaName}`);
        return null;
    }
    
    /**
     * Pre-carga fajas para una región específica
     */
    async preloadRegion(centerLat, centerLon, radiusKm = 100) {
        console.log(`🔄 Pre-cargando región: ${centerLat}, ${centerLon} (radio: ${radiusKm}km)`);
        
        const latDelta = radiusKm / 111; // Aproximadamente 1 grado = 111km
        const minLat = centerLat - latDelta;
        const maxLat = centerLat + latDelta;
        
        const fajasToLoad = new Set();
        
        // Determinar todas las fajas que intersectan con la región
        for (let lat = minLat; lat <= maxLat; lat += latDelta / 2) {
            const faja = this.getFajaForCoordinate(lat, centerLon);
            if (faja) fajasToLoad.add(faja);
        }
        
        // Cargar todas las fajas necesarias
        const promises = Array.from(fajasToLoad).map(faja => this.loadFaja(faja));
        await Promise.all(promises);
        
        console.log(`✅ Pre-carga completada: ${fajasToLoad.size} fajas cargadas`);
    }
    
    /**
     * Obtiene estadísticas de uso
     */
    getStats() {
        return {
            masterIndexLoaded: !!this.masterIndex,
            fajasInCache: this.fajasCache.size,
            loadedFajas: Array.from(this.loadedFajas),
            usingCdn: this.useCdn,
            totalFajasAvailable: this.masterIndex ? Object.keys(this.masterIndex.fajas).length : 0
        };
    }
}

// Instancia global
window.elevationFajasAdapter = new ElevationFajasAdapter();

console.log('🗺️ ElevationFajasAdapter disponible globalmente');
