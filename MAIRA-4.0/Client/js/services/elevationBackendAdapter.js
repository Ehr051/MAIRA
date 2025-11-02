/**
 * 🚀 MAIRA 4.0 - Adaptador de Elevación con Backend Optimizado
 * 
 * Prioridad:
 * 1. Backend Python (más rápido) → /api/elevation/process/<filepath>
 * 2. Frontend JavaScript (fallback) → elevationHandler.obtenerElevacion()
 * 
 * Detecta automáticamente disponibilidad del backend
 */

class ElevationBackendAdapter {
    constructor() {
        this.useBackend = true; // Intentar backend primero
        this.backendAvailable = null; // null = no testeado, true/false = resultado
        this.cache = new Map(); // Cache de tiles procesados
        this.maxCacheSize = 50; // Máximo 50 tiles en cache
        
        console.log('🚀 ElevationBackendAdapter inicializado');
    }

    /**
     * Verificar si el backend está disponible
     */
    async checkBackendAvailability() {
        if (this.backendAvailable !== null) {
            return this.backendAvailable;
        }

        try {
            // Test con tile dummy o endpoint de health check
            const response = await fetch('/api/elevation/process/test', {
                method: 'HEAD',
                timeout: 2000
            });
            
            this.backendAvailable = response.status !== 404;
            console.log(`🔍 Backend disponible: ${this.backendAvailable}`);
            return this.backendAvailable;
        } catch (error) {
            console.log('⚠️ Backend no disponible, usando frontend');
            this.backendAvailable = false;
            return false;
        }
    }

    /**
     * Obtener elevación usando backend (optimizado)
     */
    async getElevationFromBackend(lat, lon, tileInfo) {
        try {
            // Construir filepath del tile
            const filepath = tileInfo.filepath || `${tileInfo.provincia}/${tileInfo.filename}`;
            
            // Verificar cache
            const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            console.log(`⚡ Backend: Solicitando elevación para ${filepath}`);
            
            const response = await fetch(`/api/elevation/process/${filepath}`);
            
            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }

            const tileData = await response.json();

            if (!tileData.success) {
                throw new Error(tileData.error || 'Unknown backend error');
            }

            // Procesar datos del backend
            const { data, width, height, bounds, sampled, step } = tileData;

            // Calcular índice del píxel
            const pixelX = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * width);
            const pixelY = Math.floor(((bounds.north - lat) / (bounds.north - bounds.south)) * height);

            if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
                console.warn(`⚠️ Coordenadas fuera de rango: ${lat}, ${lon}`);
                return null;
            }

            const elevation = data[pixelY * width + pixelX];

            // Guardar en cache
            this.cache.set(cacheKey, elevation);
            
            // Limitar tamaño del cache
            if (this.cache.size > this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            console.log(`✅ Backend elevación: ${elevation}m para (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
            return elevation;

        } catch (error) {
            console.warn(`⚠️ Error backend, cayendo a frontend: ${error.message}`);
            throw error; // Re-throw para que el caller intente fallback
        }
    }

    /**
     * Obtener elevación con fallback automático
     */
    async getElevation(lat, lon) {
        // Verificar disponibilidad del backend (solo primera vez)
        if (this.useBackend && this.backendAvailable === null) {
            await this.checkBackendAvailability();
        }

        // Intentar backend si está disponible
        if (this.useBackend && this.backendAvailable) {
            try {
                // Necesitamos encontrar el tile correspondiente
                // Usamos elevationHandler para obtener info del tile
                const tileInfo = await this.findTileForCoordinates(lat, lon);
                
                if (tileInfo) {
                    const elevation = await this.getElevationFromBackend(lat, lon, tileInfo);
                    if (elevation !== null) {
                        return elevation;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Backend falló, usando frontend');
            }
        }

        // Fallback a frontend (elevationHandler tradicional)
        console.log('🔄 Usando elevationHandler frontend');
        if (window.elevationHandler && typeof window.elevationHandler.obtenerElevacion === 'function') {
            return await window.elevationHandler.obtenerElevacion(lat, lon);
        }

        console.error('❌ No hay sistema de elevación disponible');
        return null;
    }

    /**
     * Encontrar información del tile para coordenadas
     */
    async findTileForCoordinates(lat, lon) {
        // Usar el sistema de tiles existente para encontrar el tile
        if (!window.elevationTileIndex) {
            console.warn('⚠️ Índice de tiles no disponible');
            return null;
        }

        // Buscar en el índice de provincias
        const index = window.elevationTileIndex;
        
        if (index.provincias) {
            // Formato mini-tiles
            for (const [provincia, tiles] of Object.entries(index.provincias)) {
                for (const tile of tiles) {
                    const bounds = tile.bounds;
                    if (lat >= bounds.south && lat <= bounds.north &&
                        lon >= bounds.west && lon <= bounds.east) {
                        return {
                            provincia: tile.provincia || provincia,
                            filename: tile.filename,
                            filepath: tile.filepath || `${provincia}/${tile.filename}`,
                            bounds: bounds
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Procesar múltiples puntos de elevación (batch)
     * Más eficiente que llamadas individuales
     */
    async getElevationBatch(points) {
        const results = [];
        
        for (const point of points) {
            try {
                const elevation = await this.getElevation(point.lat, point.lng || point.lon);
                results.push({ ...point, elevation });
            } catch (error) {
                console.warn(`Error obteniendo elevación para punto:`, point, error);
                results.push({ ...point, elevation: null });
            }
        }

        return results;
    }

    /**
     * Limpiar cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache de elevaciones limpiado');
    }

    /**
     * Forzar uso de backend o frontend
     */
    setBackendPreference(useBackend) {
        this.useBackend = useBackend;
        console.log(`⚙️ Preferencia backend: ${useBackend ? 'Activado' : 'Desactivado'}`);
    }
}

// 🌍 Instancia global
window.elevationBackendAdapter = new ElevationBackendAdapter();

// 🔗 Alias para compatibilidad
window.getElevationOptimized = (lat, lon) => {
    return window.elevationBackendAdapter.getElevation(lat, lon);
};

console.log('✅ elevationBackendAdapter cargado y disponible globalmente');
