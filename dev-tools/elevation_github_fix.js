
// elevation_github_fix.js
/**
 * 🔧 ELEVATION GITHUB FIX - VERSION FAJAS
 * 
 * Intercepta requests de elevación y usa el sistema de fajas
 * para cargar solo las regiones necesarias
 */

console.log('🔧 Aplicando fix para elevación con GitHub Releases (Sistema de Fajas)');

// URLs base actualizadas para tiles v3.0
const GITHUB_BASE = 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/';
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v3.0/';

// Sistema de fajas cargado
let fajasAdapter = null;

// Función para inicializar el adaptador de fajas
async function initializeFajasAdapter() {
    if (fajasAdapter) return fajasAdapter;
    
    // Esperar a que esté disponible el adaptador
    if (typeof window.elevationFajasAdapter !== 'undefined') {
        fajasAdapter = window.elevationFajasAdapter;
        await fajasAdapter.loadMasterIndex();
        return fajasAdapter;
    }
    
    console.warn('⚠️ ElevationFajasAdapter no disponible, creando adaptador básico');
    
    // Adaptador básico de fallback
    fajasAdapter = {
        async findTile(lat, lon) {
            // Fallback simple - usar índice original
            try {
                const response = await fetch(GITHUB_BASE + 'index_tiles_altimetria.json');
                const data = await response.json();
                
                for (const [tileId, tileInfo] of Object.entries(data.tiles)) {
                    const bounds = tileInfo.bounds;
                    if (lat >= bounds.south && lat <= bounds.north &&
                        lon >= bounds.west && lon <= bounds.east) {
                        return { ...tileInfo, id: tileId };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error en adaptador fallback:', error);
            }
            return null;
        }
    };
    
    return fajasAdapter;
}

// Interceptor fetch original
const originalFetch = window.fetch;

window.fetch = async function(url, options) {
    const urlStr = url.toString();
    
    // 🎯 Interceptar carga del índice principal
    if (urlStr.includes('index_tiles_altimetria.json') && 
        !urlStr.includes('tiles-v3.0') && 
        !urlStr.includes('jsdelivr')) {
        
        console.log('🎯 Interceptando carga de índice de tiles - usando sistema de fajas');
        
        try {
            // Usar el adaptador de fajas para crear un índice unificado
            const adapter = await initializeFajasAdapter();
            await adapter.loadMasterIndex();
            
            // Crear respuesta con índice maestro que incluye información de fajas
            const masterData = {
                tiles: {},
                metadata: {
                    system: 'fajas',
                    message: 'Índice usando sistema de fajas - tiles se cargan bajo demanda'
                },
                fajas: adapter.masterIndex ? adapter.masterIndex.fajas : {}
            };
            
            const response = new Response(JSON.stringify(masterData), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Índice de fajas proporcionado al sistema de elevación');
            return response;
            
        } catch (error) {
            console.warn('⚠️ Error interceptando índice, intentando GitHub directo:', error);
            
            // Fallback a GitHub directo
            const newUrl = GITHUB_BASE + 'index_tiles_altimetria.json';
            return originalFetch(newUrl, options);
        }
    }
    
    // 🎯 Interceptar requests de archivos .tif
    if (urlStr.includes('.tif') && 
        !urlStr.includes('github.com') && 
        !urlStr.includes('jsdelivr')) {
        
        console.log('🎯 Interceptando request de archivo TIF');
        
        // Extraer nombre del archivo
        const filename = urlStr.split('/').pop();
        console.log(`🔍 Buscando archivo: ${filename}`);
        
        // Intentar encontrar en qué faja está este archivo
        try {
            const adapter = await initializeFajasAdapter();
            
            // Por ahora, intentar con GitHub directo
            // TODO: Implementar búsqueda por faja específica
            const newUrl = GITHUB_BASE + filename;
            console.log(`🔄 Redirigiendo TIF a: ${newUrl}`);
            
            return originalFetch(newUrl, options);
            
        } catch (error) {
            console.warn('⚠️ Error buscando TIF, usando GitHub directo:', error);
            const newUrl = GITHUB_BASE + filename;
            return originalFetch(newUrl, options);
        }
    }
    
    // Para otros requests, usar fetch original
    return originalFetch(url, options);
};

// Función para obtener elevación usando fajas
window.getElevationFromFajas = async function(lat, lon) {
    try {
        const adapter = await initializeFajasAdapter();
        const tile = await adapter.findTile(lat, lon);
        
        if (!tile) {
            console.warn(`⚠️ No se encontró tile para coordenada ${lat}, ${lon}`);
            return null;
        }
        
        console.log(`✅ Tile encontrado para ${lat}, ${lon}:`, tile.id);
        return tile;
        
    } catch (error) {
        console.error('❌ Error obteniendo elevación desde fajas:', error);
        return null;
    }
};

// Función para pre-cargar región
window.preloadElevationRegion = async function(centerLat, centerLon, radiusKm = 50) {
    try {
        const adapter = await initializeFajasAdapter();
        await adapter.preloadRegion(centerLat, centerLon, radiusKm);
        console.log(`✅ Región pre-cargada: ${centerLat}, ${centerLon} (${radiusKm}km)`);
    } catch (error) {
        console.error('❌ Error pre-cargando región:', error);
    }
};

console.log('🎯 Sistema de fajas para elevación activado');
console.log('📚 Funciones disponibles: getElevationFromFajas(), preloadElevationRegion()');
