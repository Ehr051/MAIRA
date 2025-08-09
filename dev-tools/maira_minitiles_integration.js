/**
 * Integración de Mini-tiles con MAIRA v3.0
 * Actualización del sistema de elevación para usar tiles-v3.0
 */

// Actualizar la función existente de elevación en app.py o el archivo JS principal
const MairaElevationIntegration = {
    
    /**
     * Inicializar el sistema de mini-tiles
     */
    async init() {
        try {
            console.log('🔧 Inicializando sistema de mini-tiles v3.0...');
            
            // Cargar el script del loader si no está disponible
            if (!window.miniTilesLoader) {
                await this.loadMiniTilesScript();
            }
            
            // Inicializar el loader
            await window.miniTilesLoader.initialize();
            
            console.log('✅ Sistema de mini-tiles inicializado exitosamente');
            
            // Mostrar estadísticas
            const stats = window.miniTilesLoader.getStats();
            console.log('📊 Estadísticas mini-tiles:', stats);
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando mini-tiles:', error);
            return false;
        }
    },

    /**
     * Cargar el script del loader dinámicamente
     */
    loadMiniTilesScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = './mini_tiles_loader.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * Obtener elevación para coordenadas específicas
     * Reemplaza la función original que usaba tiles grandes
     */
    async getElevation(lat, lon) {
        try {
            const tile = await window.miniTilesLoader.getTile(lat, lon, 'altimetria');
            
            if (!tile) {
                console.warn(`⚠️ No se encontró tile de elevación para ${lat}, ${lon}`);
                return null;
            }

            // Aquí necesitarías procesar el archivo TIF del tile
            // Por ahora retornamos información del tile encontrado
            return {
                elevation: null, // Procesar TIF para obtener valor exacto
                tileInfo: tile,
                success: true
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo elevación:', error);
            return { elevation: null, success: false, error };
        }
    },

    /**
     * Pre-cargar tiles para el área visible del mapa
     */
    async preloadMapArea(map) {
        if (!map) return;
        
        const bounds = map.getBounds();
        const mapBounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };

        console.log('🗺️ Pre-cargando tiles para área del mapa...');
        
        try {
            const loadedCount = await window.miniTilesLoader.preloadRegion(mapBounds);
            console.log(`✅ Pre-carga completada: ${loadedCount} tiles`);
            return loadedCount;
        } catch (error) {
            console.error('❌ Error en pre-carga:', error);
            return 0;
        }
    },

    /**
     * Actualizar función de click en mapa para usar mini-tiles
     */
    async handleMapClick(lat, lon) {
        console.log(`🎯 Click en mapa: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        
        // Mostrar indicador de carga
        this.showLoadingIndicator();
        
        try {
            // Obtener información de elevación
            const elevationResult = await this.getElevation(lat, lon);
            
            if (elevationResult.success) {
                console.log('✅ Tile encontrado:', elevationResult.tileInfo);
                
                // Actualizar UI con información del tile
                this.updateElevationDisplay(elevationResult);
                
                // Mostrar información detallada en consola
                console.log('📊 Información del tile:', {
                    id: elevationResult.tileInfo.id,
                    provincia: elevationResult.tileInfo.provincia,
                    bounds: elevationResult.tileInfo.bounds
                });
                
            } else {
                console.warn('⚠️ No se pudo obtener elevación para esta ubicación');
                this.showNoDataMessage();
            }
            
        } catch (error) {
            console.error('❌ Error procesando click:', error);
            this.showErrorMessage(error);
        } finally {
            this.hideLoadingIndicator();
        }
    },

    /**
     * Mostrar indicador de carga
     */
    showLoadingIndicator() {
        // Implementar indicador visual de carga
        console.log('⏳ Cargando tile...');
    },

    /**
     * Ocultar indicador de carga
     */
    hideLoadingIndicator() {
        console.log('✅ Carga completada');
    },

    /**
     * Actualizar display de elevación
     */
    updateElevationDisplay(elevationResult) {
        const tileInfo = elevationResult.tileInfo;
        
        // Actualizar elementos UI existentes
        const infoElement = document.getElementById('elevation-info');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="tile-info">
                    <h3>🗺️ Información del Tile</h3>
                    <p><strong>ID:</strong> ${tileInfo.id}</p>
                    <p><strong>Provincia:</strong> ${tileInfo.provincia}</p>
                    <p><strong>Archivo:</strong> ${tileInfo.filename}</p>
                    <p><strong>Sistema:</strong> Mini-tiles v3.0</p>
                </div>
            `;
        }

        console.log('📊 Display de elevación actualizado');
    },

    /**
     * Mostrar mensaje de no datos
     */
    showNoDataMessage() {
        const infoElement = document.getElementById('elevation-info');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="no-data">
                    <p>⚠️ No hay datos de elevación disponibles para esta ubicación</p>
                </div>
            `;
        }
    },

    /**
     * Mostrar mensaje de error
     */
    showErrorMessage(error) {
        const infoElement = document.getElementById('elevation-info');
        if (infoElement) {
            infoElement.innerHTML = `
                <div class="error">
                    <p>❌ Error cargando datos: ${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Obtener estadísticas del sistema
     */
    getSystemStats() {
        if (!window.miniTilesLoader) {
            return { error: 'Mini-tiles loader no disponible' };
        }

        return window.miniTilesLoader.getStats();
    },

    /**
     * Limpiar cache de tiles
     */
    clearCache() {
        if (window.miniTilesLoader) {
            window.miniTilesLoader.clearCache();
            console.log('🧹 Cache de mini-tiles limpiada');
        }
    }
};

// Inicializar automáticamente cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando integración MAIRA con mini-tiles v3.0...');
    
    try {
        const success = await MairaElevationIntegration.init();
        if (success) {
            console.log('✅ MAIRA mini-tiles v3.0 listo para usar');
            
            // Exponer funciones globalmente para depuración
            window.mairaElevation = MairaElevationIntegration;
            
        } else {
            console.error('❌ Error inicializando MAIRA mini-tiles');
        }
    } catch (error) {
        console.error('❌ Error fatal inicializando mini-tiles:', error);
    }
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MairaElevationIntegration;
}
