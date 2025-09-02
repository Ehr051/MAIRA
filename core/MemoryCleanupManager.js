/**
 * 🧹 MAIRA Memory Cleanup Manager
 * Gestión de memoria y cleanup de event listeners
 * Previene memory leaks en aplicaciones de larga duración
 */

class MemoryCleanupManager {
    constructor() {
        this.activeListeners = new Set();
        this.activeTimers = new Set();
        this.activeIntervals = new Set();
        this.activeDOMRefs = new WeakMap();
        this.cleanupTasks = new Set();
        
        console.log('🧹 MemoryCleanupManager initialized');
        this.initializeCleanup();
    }

    /**
     * Inicializa el sistema de cleanup
     */
    initializeCleanup() {
        // Interceptar addEventListener para tracking
        this.interceptEventListeners();
        
        // Interceptar timers para tracking
        this.interceptTimers();
        
        // Configurar cleanup automático en beforeunload
        this.setupAutomaticCleanup();
        
        // Configurar cleanup periódico
        this.setupPeriodicCleanup();
        
        console.log('✅ Memory cleanup system active');
    }

    /**
     * Intercepta addEventListener para hacer tracking automático
     */
    interceptEventListeners() {
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
        const manager = this;

        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // Llamar al método original
            originalAddEventListener.call(this, type, listener, options);
            
            // Registrar para cleanup
            const listenerInfo = {
                target: this,
                type,
                listener,
                options,
                timestamp: Date.now(),
                stack: new Error().stack
            };
            
            manager.activeListeners.add(listenerInfo);
            
            // Debug para desarrollo
            if (manager.activeListeners.size > 100) {
                console.warn('🧹 Warning: Many active listeners detected:', manager.activeListeners.size);
            }
        };

        EventTarget.prototype.removeEventListener = function(type, listener, options) {
            originalRemoveEventListener.call(this, type, listener, options);
            
            // Remover del tracking
            for (const listenerInfo of manager.activeListeners) {
                if (listenerInfo.target === this && 
                    listenerInfo.type === type && 
                    listenerInfo.listener === listener) {
                    manager.activeListeners.delete(listenerInfo);
                    break;
                }
            }
        };
    }

    /**
     * Intercepta timers para tracking automático
     */
    interceptTimers() {
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const originalClearTimeout = window.clearTimeout;
        const originalClearInterval = window.clearInterval;
        const manager = this;

        window.setTimeout = function(callback, delay, ...args) {
            const timerId = originalSetTimeout.call(this, callback, delay, ...args);
            
            manager.activeTimers.add({
                id: timerId,
                type: 'timeout',
                callback,
                delay,
                timestamp: Date.now(),
                stack: new Error().stack
            });
            
            return timerId;
        };

        window.setInterval = function(callback, delay, ...args) {
            const timerId = originalSetInterval.call(this, callback, delay, ...args);
            
            manager.activeIntervals.add({
                id: timerId,
                type: 'interval',
                callback,
                delay,
                timestamp: Date.now(),
                stack: new Error().stack
            });
            
            return timerId;
        };

        window.clearTimeout = function(timerId) {
            originalClearTimeout.call(this, timerId);
            
            for (const timer of manager.activeTimers) {
                if (timer.id === timerId) {
                    manager.activeTimers.delete(timer);
                    break;
                }
            }
        };

        window.clearInterval = function(timerId) {
            originalClearInterval.call(this, timerId);
            
            for (const timer of manager.activeIntervals) {
                if (timer.id === timerId) {
                    manager.activeIntervals.delete(timer);
                    break;
                }
            }
        };
    }

    /**
     * Registra un elemento DOM para cleanup
     * @param {HTMLElement} element - Elemento DOM
     * @param {Function} cleanupFunction - Función de cleanup
     */
    registerDOMElement(element, cleanupFunction) {
        if (!element || !cleanupFunction) return;
        
        this.activeDOMRefs.set(element, cleanupFunction);
        
        // Observer para detectar cuando el elemento es removido del DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === element) {
                        this.cleanupDOMElement(element);
                        observer.disconnect();
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Limpia un elemento DOM específico
     * @param {HTMLElement} element - Elemento a limpiar
     */
    cleanupDOMElement(element) {
        const cleanupFunction = this.activeDOMRefs.get(element);
        if (cleanupFunction) {
            try {
                cleanupFunction();
                console.log('🧹 DOM element cleaned up');
            } catch (error) {
                console.error('🧹 Error during DOM cleanup:', error);
            }
            this.activeDOMRefs.delete(element);
        }
    }

    /**
     * Registra una tarea de cleanup personalizada
     * @param {Function} cleanupFunction - Función de cleanup
     * @param {string} description - Descripción de la tarea
     */
    registerCleanupTask(cleanupFunction, description = 'Custom cleanup') {
        this.cleanupTasks.add({
            function: cleanupFunction,
            description,
            timestamp: Date.now()
        });
    }

    /**
     * Configura cleanup automático en beforeunload
     */
    setupAutomaticCleanup() {
        window.addEventListener('beforeunload', () => {
            console.log('🧹 Executing automatic cleanup...');
            this.executeFullCleanup();
        });

        // También cleanup en cambios de página para SPAs
        if (window.addEventListener) {
            window.addEventListener('popstate', () => {
                this.executePartialCleanup();
            });
        }
    }

    /**
     * Configura cleanup periódico cada 5 minutos
     */
    setupPeriodicCleanup() {
        setInterval(() => {
            this.executePeriodicCleanup();
        }, 5 * 60 * 1000); // 5 minutos
    }

    /**
     * Ejecuta cleanup periódico ligero
     */
    executePeriodicCleanup() {
        console.log('🧹 Executing periodic cleanup...');
        
        // Limpiar listeners antiguos (más de 1 hora)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        for (const listener of this.activeListeners) {
            if (listener.timestamp < oneHourAgo && !document.contains(listener.target)) {
                try {
                    listener.target.removeEventListener(listener.type, listener.listener, listener.options);
                    this.activeListeners.delete(listener);
                    console.log('🧹 Removed stale listener');
                } catch (error) {
                    // Listener target ya no existe
                    this.activeListeners.delete(listener);
                }
            }
        }

        // Forzar garbage collection si está disponible
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }

        this.logMemoryStats();
    }

    /**
     * Ejecuta cleanup parcial para transiciones de página
     */
    executePartialCleanup() {
        console.log('🧹 Executing partial cleanup...');
        
        // Limpiar elementos DOM que ya no están en el documento
        for (const [element, cleanupFn] of this.activeDOMRefs) {
            if (!document.contains(element)) {
                try {
                    cleanupFn();
                } catch (error) {
                    console.error('🧹 Error in partial cleanup:', error);
                }
                this.activeDOMRefs.delete(element);
            }
        }
    }

    /**
     * Ejecuta cleanup completo
     */
    executeFullCleanup() {
        console.log('🧹 Executing full cleanup...');

        // Limpiar todos los event listeners
        let cleanedListeners = 0;
        for (const listener of this.activeListeners) {
            try {
                listener.target.removeEventListener(listener.type, listener.listener, listener.options);
                cleanedListeners++;
            } catch (error) {
                // Target ya no existe, está bien
            }
        }
        this.activeListeners.clear();

        // Limpiar todos los timers
        let cleanedTimers = 0;
        for (const timer of this.activeTimers) {
            clearTimeout(timer.id);
            cleanedTimers++;
        }
        this.activeTimers.clear();

        // Limpiar todos los intervals
        let cleanedIntervals = 0;
        for (const interval of this.activeIntervals) {
            clearInterval(interval.id);
            cleanedIntervals++;
        }
        this.activeIntervals.clear();

        // Ejecutar tareas de cleanup personalizadas
        let cleanedTasks = 0;
        for (const task of this.cleanupTasks) {
            try {
                task.function();
                cleanedTasks++;
            } catch (error) {
                console.error('🧹 Error in cleanup task:', task.description, error);
            }
        }
        this.cleanupTasks.clear();

        // Limpiar referencias DOM
        let cleanedDOM = 0;
        for (const [element, cleanupFn] of this.activeDOMRefs) {
            try {
                cleanupFn();
                cleanedDOM++;
            } catch (error) {
                console.error('🧹 Error cleaning DOM element:', error);
            }
        }
        this.activeDOMRefs = new WeakMap();

        console.log(`🧹 Full cleanup completed:
            - Listeners: ${cleanedListeners}
            - Timers: ${cleanedTimers} 
            - Intervals: ${cleanedIntervals}
            - Tasks: ${cleanedTasks}
            - DOM Elements: ${cleanedDOM}`);
    }

    /**
     * Obtiene estadísticas de memoria
     */
    getMemoryStats() {
        return {
            activeListeners: this.activeListeners.size,
            activeTimers: this.activeTimers.size,
            activeIntervals: this.activeIntervals.size,
            activeDOMRefs: this.activeDOMRefs.size || 0,
            cleanupTasks: this.cleanupTasks.size,
            performanceMemory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    /**
     * Log de estadísticas de memoria
     */
    logMemoryStats() {
        const stats = this.getMemoryStats();
        console.log('🧹 Memory Stats:', stats);
        
        // Alerta si hay demasiados listeners activos
        if (stats.activeListeners > 200) {
            console.warn('🧹 ⚠️ High number of active listeners detected!', stats.activeListeners);
        }
        
        if (stats.activeIntervals > 10) {
            console.warn('🧹 ⚠️ High number of active intervals detected!', stats.activeIntervals);
        }
    }

    /**
     * Cleanup específico para elementos de mapa Leaflet
     * @param {Object} leafletMap - Instancia del mapa Leaflet
     */
    cleanupLeafletMap(leafletMap) {
        if (!leafletMap) return;

        this.registerCleanupTask(() => {
            // Remover todos los layers
            leafletMap.eachLayer((layer) => {
                leafletMap.removeLayer(layer);
            });

            // Remover event listeners del mapa
            leafletMap.off();

            // Destruir el mapa
            leafletMap.remove();
            
            console.log('🧹 Leaflet map cleaned up');
        }, 'Leaflet map cleanup');
    }

    /**
     * Cleanup específico para Socket.IO
     * @param {Object} socket - Instancia de Socket.IO
     */
    cleanupSocket(socket) {
        if (!socket) return;

        this.registerCleanupTask(() => {
            // Remover todos los listeners
            socket.removeAllListeners();
            
            // Desconectar
            socket.disconnect();
            
            console.log('🧹 Socket.IO cleaned up');
        }, 'Socket.IO cleanup');
    }
}

// Inicializar MemoryCleanupManager globalmente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.MemoryManager = new MemoryCleanupManager();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryCleanupManager;
}

console.log('🧹 MAIRA Memory Cleanup Manager loaded and active');
