/**
 * MAIRA Memory Manager
 * Gestiona la memoria del sistema, previene memory leaks y optimiza el rendimiento
 * Especialmente crítico para el manejo de archivos TIF y operaciones con hexágonos
 */

class MemoryManager {
    constructor() {
        this.memoryPools = new Map();
        this.objectCache = new Map();
        this.weakReferences = new WeakMap();
        this.gcScheduled = false;
        this.memoryThresholds = {
            warning: 0.85,  // 85% de memoria usada
            critical: 0.95  // 95% de memoria usada
        };
        
        this.initializeMemoryPools();
        this.startMemoryMonitoring();
        
        console.log('[MemoryManager] Sistema de gestión de memoria inicializado');
    }

    /**
     * Inicializa pools de memoria para objetos comunes
     */
    initializeMemoryPools() {
        // Pool para hexágonos del mapa
        this.memoryPools.set('hexagons', {
            pool: [],
            maxSize: 10000,
            factory: () => ({
                x: 0, y: 0, z: 0,
                elevation: 0,
                vegetation: '',
                symbol: null,
                unit: null,
                selected: false,
                highlighted: false
            }),
            reset: (obj) => {
                obj.x = obj.y = obj.z = 0;
                obj.elevation = 0;
                obj.vegetation = '';
                obj.symbol = null;
                obj.unit = null;
                obj.selected = false;
                obj.highlighted = false;
                return obj;
            }
        });

        // Pool para elementos de símbolos militares
        this.memoryPools.set('symbols', {
            pool: [],
            maxSize: 1000,
            factory: () => ({
                id: '',
                type: '',
                position: { x: 0, y: 0 },
                scale: 1,
                rotation: 0,
                visible: true,
                element: null
            }),
            reset: (obj) => {
                obj.id = '';
                obj.type = '';
                obj.position.x = obj.position.y = 0;
                obj.scale = 1;
                obj.rotation = 0;
                obj.visible = true;
                if (obj.element && obj.element.remove) {
                    obj.element.remove();
                }
                obj.element = null;
                return obj;
            }
        });

        // Pool para datos de elevación TIF
        this.memoryPools.set('tifData', {
            pool: [],
            maxSize: 100,
            factory: () => ({
                buffer: null,
                width: 0,
                height: 0,
                bounds: null,
                processed: false,
                lastAccess: 0
            }),
            reset: (obj) => {
                if (obj.buffer) {
                    obj.buffer = null;
                }
                obj.width = obj.height = 0;
                obj.bounds = null;
                obj.processed = false;
                obj.lastAccess = 0;
                return obj;
            }
        });

        // Pool para eventos de juego
        this.memoryPools.set('gameEvents', {
            pool: [],
            maxSize: 5000,
            factory: () => ({
                type: '',
                timestamp: 0,
                data: null,
                processed: false
            }),
            reset: (obj) => {
                obj.type = '';
                obj.timestamp = 0;
                obj.data = null;
                obj.processed = false;
                return obj;
            }
        });
    }

    /**
     * Obtiene un objeto del pool de memoria
     */
    getFromPool(poolName) {
        const pool = this.memoryPools.get(poolName);
        if (!pool) {
            console.warn(`[MemoryManager] Pool '${poolName}' no encontrado`);
            return null;
        }

        if (pool.pool.length > 0) {
            return pool.pool.pop();
        }

        // Si el pool está vacío, crear nuevo objeto
        return pool.factory();
    }

    /**
     * Devuelve un objeto al pool de memoria
     */
    returnToPool(poolName, obj) {
        const pool = this.memoryPools.get(poolName);
        if (!pool || !obj) return;

        // Verificar que no excedamos el tamaño máximo del pool
        if (pool.pool.length >= pool.maxSize) {
            // Pool lleno, descartar objeto
            return;
        }

        // Resetear el objeto y devolverlo al pool
        const resetObj = pool.reset(obj);
        pool.pool.push(resetObj);
    }

    /**
     * Cache inteligente con TTL y límites de memoria
     */
    cacheObject(key, object, ttl = 300000) { // 5 minutos por defecto
        const cacheEntry = {
            data: object,
            timestamp: Date.now(),
            ttl: ttl,
            size: this.estimateObjectSize(object),
            accessCount: 0
        };

        this.objectCache.set(key, cacheEntry);
        this.cleanExpiredCache();
    }

    /**
     * Obtiene objeto del cache
     */
    getCachedObject(key) {
        const entry = this.objectCache.get(key);
        if (!entry) return null;

        // Verificar si ha expirado
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.objectCache.delete(key);
            return null;
        }

        entry.accessCount++;
        return entry.data;
    }

    /**
     * Estima el tamaño de un objeto en memoria
     */
    estimateObjectSize(obj) {
        let size = 0;
        
        if (obj === null || obj === undefined) {
            return 0;
        }

        switch (typeof obj) {
            case 'boolean':
                size = 4;
                break;
            case 'number':
                size = 8;
                break;
            case 'string':
                size = obj.length * 2; // UTF-16
                break;
            case 'object':
                if (obj instanceof ArrayBuffer) {
                    size = obj.byteLength;
                } else if (obj instanceof Array) {
                    size = obj.length * 8; // Aproximación
                    for (let item of obj) {
                        size += this.estimateObjectSize(item);
                    }
                } else {
                    // Objeto genérico
                    size = Object.keys(obj).length * 16; // Overhead de propiedades
                    for (let key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            size += this.estimateObjectSize(obj[key]);
                            size += key.length * 2; // Nombre de la propiedad
                        }
                    }
                }
                break;
        }

        return size;
    }

    /**
     * Limpia cache expirado automáticamente
     */
    cleanExpiredCache() {
        const now = Date.now();
        let deletedCount = 0;

        for (let [key, entry] of this.objectCache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.objectCache.delete(key);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(`[MemoryManager] Limpiados ${deletedCount} objetos expirados del cache`);
        }
    }

    /**
     * Fuerza la recolección de basura cuando sea necesario
     */
    scheduleGarbageCollection() {
        if (this.gcScheduled) return;

        this.gcScheduled = true;
        setTimeout(() => {
            this.performGarbageCollection();
            this.gcScheduled = false;
        }, 100);
    }

    /**
     * Realiza recolección de basura manual
     */
    performGarbageCollection() {
        // Limpiar cache expirado
        this.cleanExpiredCache();

        // Limpiar pools de memoria con objetos no utilizados
        for (let [poolName, pool] of this.memoryPools.entries()) {
            if (pool.pool.length > pool.maxSize * 0.8) {
                const toRemove = Math.floor(pool.pool.length * 0.3);
                pool.pool.splice(0, toRemove);
                console.log(`[MemoryManager] Reducido pool '${poolName}' en ${toRemove} objetos`);
            }
        }

        // Forzar garbage collection si está disponible
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }

        console.log('[MemoryManager] Recolección de basura completada');
    }

    /**
     * Monitorea el uso de memoria del sistema
     */
    startMemoryMonitoring() {
        if (!('memory' in performance)) {
            console.warn('[MemoryManager] API de memoria no disponible en este navegador');
            return;
        }

        setInterval(() => {
            const memInfo = performance.memory;
            const used = memInfo.usedJSHeapSize;
            const total = memInfo.totalJSHeapSize;
            const limit = memInfo.jsHeapSizeLimit;

            const usageRatio = used / limit;

            // Verificar umbrales de memoria
            if (usageRatio > this.memoryThresholds.critical) {
                console.error('[MemoryManager] Uso crítico de memoria:', {
                    used: (used / 1024 / 1024).toFixed(2) + 'MB',
                    total: (total / 1024 / 1024).toFixed(2) + 'MB',
                    limit: (limit / 1024 / 1024).toFixed(2) + 'MB',
                    ratio: (usageRatio * 100).toFixed(1) + '%'
                });

                this.emergencyCleanup();
                
            } else if (usageRatio > this.memoryThresholds.warning) {
                console.warn('[MemoryManager] Advertencia de memoria:', {
                    used: (used / 1024 / 1024).toFixed(2) + 'MB',
                    ratio: (usageRatio * 100).toFixed(1) + '%'
                });

                this.scheduleGarbageCollection();
            }

            // Emitir evento de memoria para otros componentes
            if (window.MAIRA && window.MAIRA.Events) {
                window.MAIRA.Events.emit('memory_status', {
                    used: used,
                    total: total,
                    limit: limit,
                    ratio: usageRatio,
                    cacheSize: this.objectCache.size,
                    poolsSize: this.getPoolsStatus()
                });
            }

        }, 30000); // Verificar cada 30 segundos
    }

    /**
     * Limpieza de emergencia cuando la memoria está crítica
     */
    emergencyCleanup() {
        console.log('[MemoryManager] Iniciando limpieza de emergencia...');

        // Limpiar todo el cache
        this.objectCache.clear();

        // Reducir drásticamente los pools
        for (let [poolName, pool] of this.memoryPools.entries()) {
            const keepCount = Math.floor(pool.maxSize * 0.1); // Mantener solo 10%
            pool.pool.splice(keepCount);
            console.log(`[MemoryManager] Pool '${poolName}' reducido a ${pool.pool.length} objetos`);
        }

        // Notificar a otros componentes para que liberen memoria
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('memory_emergency', {
                action: 'cleanup_required',
                timestamp: Date.now()
            });
        }

        // Forzar garbage collection
        this.performGarbageCollection();

        console.log('[MemoryManager] Limpieza de emergencia completada');
    }

    /**
     * Optimización específica para archivos TIF grandes
     */
    optimizeTIFMemory(tifData, options = {}) {
        const {
            maxCacheSize = 50 * 1024 * 1024, // 50MB
            compressionLevel = 0.8,
            tileSize = 512
        } = options;

        // Si el archivo es muy grande, procesarlo por tiles
        if (tifData.size > maxCacheSize) {
            return this.processTIFByTiles(tifData, tileSize);
        }

        // Para archivos más pequeños, aplicar compresión si es necesario
        if (compressionLevel < 1.0) {
            return this.compressTIFData(tifData, compressionLevel);
        }

        return tifData;
    }

    /**
     * Procesa archivos TIF grandes por segmentos
     */
    processTIFByTiles(tifData, tileSize) {
        console.log(`[MemoryManager] Procesando TIF por tiles de ${tileSize}x${tileSize}`);
        
        // Esta función sería implementada con la lógica específica de tiles
        // Por ahora retornamos un placeholder que indica el procesamiento por tiles
        return {
            type: 'tiled',
            tileSize: tileSize,
            originalSize: tifData.size,
            tiles: [], // Se llenaría con los tiles procesados
            getTile: (x, y) => {
                // Función para obtener un tile específico cuando sea necesario
                return this.getFromPool('tifData');
            }
        };
    }

    /**
     * Aplica compresión a datos TIF
     */
    compressTIFData(tifData, level) {
        // Placeholder para compresión de datos TIF
        // En implementación real usaríamos algoritmos de compresión apropiados
        console.log(`[MemoryManager] Aplicando compresión nivel ${level} a datos TIF`);
        
        return {
            ...tifData,
            compressed: true,
            compressionLevel: level,
            originalSize: tifData.size,
            compressedSize: Math.floor(tifData.size * level)
        };
    }

    /**
     * Obtiene el estado de los pools de memoria
     */
    getPoolsStatus() {
        const status = {};
        for (let [poolName, pool] of this.memoryPools.entries()) {
            status[poolName] = {
                available: pool.pool.length,
                maxSize: pool.maxSize,
                usage: ((pool.maxSize - pool.pool.length) / pool.maxSize * 100).toFixed(1) + '%'
            };
        }
        return status;
    }

    /**
     * Obtiene estadísticas detalladas de memoria
     */
    getMemoryStats() {
        const stats = {
            pools: this.getPoolsStatus(),
            cache: {
                entries: this.objectCache.size,
                estimatedSize: 0
            },
            system: {}
        };

        // Calcular tamaño estimado del cache
        for (let [key, entry] of this.objectCache.entries()) {
            stats.cache.estimatedSize += entry.size || 0;
        }

        // Información del sistema si está disponible
        if ('memory' in performance) {
            const memInfo = performance.memory;
            stats.system = {
                used: memInfo.usedJSHeapSize,
                total: memInfo.totalJSHeapSize,
                limit: memInfo.jsHeapSizeLimit,
                usagePercentage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit * 100).toFixed(1)
            };
        }

        return stats;
    }

    /**
     * Limpia completamente un tipo específico de objetos
     */
    clearObjectType(type) {
        // Limpiar del cache
        for (let [key, entry] of this.objectCache.entries()) {
            if (key.startsWith(type + '_')) {
                this.objectCache.delete(key);
            }
        }

        // Limpiar pool específico
        const pool = this.memoryPools.get(type);
        if (pool) {
            pool.pool.length = 0;
        }

        console.log(`[MemoryManager] Limpiados todos los objetos de tipo: ${type}`);
    }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.MemoryManager = new MemoryManager();

console.log('[MAIRA] MemoryManager cargado y operativo');
