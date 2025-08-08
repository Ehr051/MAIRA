// external_tiles_adapter.js
// Adaptador para usar tiles desde almacenamiento externo

(function() {
    console.log('🌐 Iniciando adaptador de tiles externas...');

    // Configuración de almacenamiento externo
    const EXTERNAL_CONFIG = {
        // URLs de almacenamiento externo (se actualizarán cuando se configure el proveedor)
        providers: {
            aws_s3: {
                base_url: 'https://maira-tiles.s3.amazonaws.com',
                cdn_url: 'https://d1234567890.cloudfront.net' // CloudFront CDN
            },
            google_cloud: {
                base_url: 'https://storage.googleapis.com/maira-tiles',
                cdn_url: 'https://storage.googleapis.com/maira-tiles'
            },
            github_releases: {
                base_url: 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v1.0',
                cdn_url: 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v1.0'
            },
            fallback_local: {
                base_url: window.location.origin + '/Client/Libs/datos_argentina',
                cdn_url: window.location.origin + '/Client/Libs/datos_argentina'
            }
        },
        current_provider: 'fallback_local', // Cambiar cuando se configure almacenamiento externo
        cache_enabled: true,
        compression_enabled: true
    };

    // Cache en memoria para tiles accedidas
    const tilesCache = new Map();
    const indexCache = new Map();

    // Función para obtener URL base actual
    function getCurrentBaseUrl() {
        const provider = EXTERNAL_CONFIG.providers[EXTERNAL_CONFIG.current_provider];
        return provider ? provider.base_url : EXTERNAL_CONFIG.providers.fallback_local.base_url;
    }

    // Función para obtener URL de CDN actual
    function getCurrentCDNUrl() {
        const provider = EXTERNAL_CONFIG.providers[EXTERNAL_CONFIG.current_provider];
        return provider ? provider.cdn_url : EXTERNAL_CONFIG.providers.fallback_local.cdn_url;
    }

    // Interceptor de requests para redirigir a almacenamiento externo
    function setupTilesInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = function(url, options) {
            // Si es un request a datos locales, redirigir a almacenamiento externo
            if (typeof url === 'string' && url.includes('/Client/Libs/datos_argentina/')) {
                const externalUrl = redirectToExternalStorage(url);
                console.log(`🔄 Redirigiendo tiles: ${url} → ${externalUrl}`);
                return originalFetch(externalUrl, options);
            }
            
            return originalFetch.apply(this, arguments);
        };
    }

    // Función para convertir URL local a externa
    function redirectToExternalStorage(localUrl) {
        const baseUrl = getCurrentCDNUrl();
        
        // Mapear rutas locales a externas
        const pathMappings = {
            '/Client/Libs/datos_argentina/Altimetria/index_tiles_altimetria.json': '/indices/index_tiles_altimetria.json',
            '/Client/Libs/datos_argentina/Vegetacion/vegetacion_tile_index.json': '/indices/vegetacion_tile_index.json',
            '/Client/Libs/datos_argentina/Altimetria/': '/altimetria/',
            '/Client/Libs/datos_argentina/Vegetacion/': '/vegetacion/'
        };

        // Buscar mapeo exacto primero
        for (const [localPath, externalPath] of Object.entries(pathMappings)) {
            if (localUrl.includes(localPath)) {
                return baseUrl + externalPath + localUrl.split(localPath)[1];
            }
        }

        // Fallback: reemplazar ruta base
        return localUrl.replace('/Client/Libs/datos_argentina/', baseUrl + '/');
    }

    // Función para cargar índice con fallback
    async function loadIndexWithFallback(indexType) {
        const cacheKey = `index_${indexType}`;
        
        // Verificar cache primero
        if (EXTERNAL_CONFIG.cache_enabled && indexCache.has(cacheKey)) {
            console.log(`📋 Usando índice ${indexType} desde cache`);
            return indexCache.get(cacheKey);
        }

        const urls = [
            `${getCurrentCDNUrl()}/indices/${indexType === 'altimetria' ? 'index_tiles_altimetria.json' : 'vegetacion_tile_index.json'}`,
            `${getCurrentBaseUrl()}/indices/${indexType === 'altimetria' ? 'index_tiles_altimetria.json' : 'vegetacion_tile_index.json'}`,
            // Fallback local
            `/Client/Libs/datos_argentina/${indexType === 'altimetria' ? 'Altimetria/index_tiles_altimetria.json' : 'Vegetacion/vegetacion_tile_index.json'}`
        ];

        for (const url of urls) {
            try {
                console.log(`🔍 Intentando cargar índice desde: ${url}`);
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Guardar en cache
                    if (EXTERNAL_CONFIG.cache_enabled) {
                        indexCache.set(cacheKey, data);
                    }
                    
                    console.log(`✅ Índice ${indexType} cargado exitosamente desde ${url}`);
                    return data;
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando desde ${url}:`, error.message);
            }
        }

        // Si todo falla, usar datos de emergencia
        console.error(`❌ No se pudo cargar índice ${indexType}, usando datos de emergencia`);
        return createEmergencyIndex(indexType);
    }

    // Crear índice de emergencia
    function createEmergencyIndex(indexType) {
        const baseIndex = {
            metadata: {
                descripcion: `Índice de emergencia para ${indexType}`,
                generado: new Date().toISOString(),
                version: "emergency-1.0",
                fuente: "Datos locales no disponibles"
            },
            bounds: {
                north: -22.0,
                south: -55.0,
                east: -53.0,
                west: -74.0
            },
            status: "emergency",
            message: `Datos de ${indexType} no disponibles - modo emergencia activado`
        };

        if (indexType === 'altimetria') {
            return {
                ...baseIndex,
                configuracion: {
                    tamanio_tile: 1.0,
                    formato: "GeoTIFF",
                    sistema_coordenadas: "EPSG:4326"
                },
                tiles: [],
                total_tiles: 0
            };
        } else {
            return {
                ...baseIndex,
                configuracion: {
                    resolucion: "250m",
                    formato: "JSON",
                    rango_ndvi: [-1.0, 1.0]
                },
                datos_disponibles: false,
                total_registros: 0
            };
        }
    }

    // Función para cargar tile individual con fallback
    async function loadTileWithFallback(tileUrl) {
        const cacheKey = tileUrl;
        
        // Verificar cache
        if (EXTERNAL_CONFIG.cache_enabled && tilesCache.has(cacheKey)) {
            return tilesCache.get(cacheKey);
        }

        const externalUrl = redirectToExternalStorage(tileUrl);
        const fallbackUrls = [externalUrl, tileUrl];

        for (const url of fallbackUrls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.arrayBuffer();
                    
                    // Guardar en cache
                    if (EXTERNAL_CONFIG.cache_enabled) {
                        tilesCache.set(cacheKey, data);
                    }
                    
                    return data;
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando tile desde ${url}:`, error.message);
            }
        }

        throw new Error(`No se pudo cargar tile: ${tileUrl}`);
    }

    // Función para cambiar proveedor de almacenamiento
    function switchStorageProvider(providerName) {
        if (EXTERNAL_CONFIG.providers[providerName]) {
            EXTERNAL_CONFIG.current_provider = providerName;
            console.log(`🔄 Cambiado a proveedor: ${providerName}`);
            
            // Limpiar cache al cambiar proveedor
            tilesCache.clear();
            indexCache.clear();
            
            // Emitir evento
            window.dispatchEvent(new CustomEvent('storageProviderChanged', {
                detail: { provider: providerName, baseUrl: getCurrentBaseUrl() }
            }));
        } else {
            console.error(`❌ Proveedor no encontrado: ${providerName}`);
        }
    }

    // Función de diagnóstico
    function diagnoseStorageAccess() {
        console.log('🔍 Diagnosticando acceso a almacenamiento...');
        
        const diagnosis = {
            current_provider: EXTERNAL_CONFIG.current_provider,
            base_url: getCurrentBaseUrl(),
            cdn_url: getCurrentCDNUrl(),
            cache_status: {
                enabled: EXTERNAL_CONFIG.cache_enabled,
                tiles_cached: tilesCache.size,
                indices_cached: indexCache.size
            },
            providers_available: Object.keys(EXTERNAL_CONFIG.providers)
        };
        
        console.log('📊 Diagnóstico de almacenamiento:', diagnosis);
        return diagnosis;
    }

    // Exponer API global
    window.externalTilesAdapter = {
        loadIndexWithFallback,
        loadTileWithFallback,
        switchStorageProvider,
        diagnoseStorageAccess,
        getCurrentBaseUrl,
        getCurrentCDNUrl,
        redirectToExternalStorage,
        clearCache: () => {
            tilesCache.clear();
            indexCache.clear();
            console.log('🗑️ Cache de tiles limpiado');
        },
        getConfig: () => EXTERNAL_CONFIG
    };

    // Instalar interceptor
    setupTilesInterceptor();

    // Evento de inicialización
    window.dispatchEvent(new CustomEvent('externalTilesAdapterReady', {
        detail: { 
            provider: EXTERNAL_CONFIG.current_provider,
            baseUrl: getCurrentBaseUrl()
        }
    }));

    console.log('✅ Adaptador de tiles externas inicializado');
    console.log(`🌐 Proveedor actual: ${EXTERNAL_CONFIG.current_provider}`);
    console.log(`📍 URL base: ${getCurrentBaseUrl()}`);

})();
