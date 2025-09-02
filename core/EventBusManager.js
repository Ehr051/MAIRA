/**
 * 🏗️ MAIRA Event Bus Manager
 * Sistema de comunicación desacoplada entre módulos
 * Implementa patrón Publisher-Subscriber para arquitectura modular
 */

class EventBusManager {
    constructor() {
        this.events = new Map();
        this.globalListeners = new Set();
        this.eventHistory = [];
        this.maxHistorySize = 1000;
        this.debugging = false;
        this.eventStats = {
            totalEmitted: 0,
            totalListeners: 0,
            byEventType: new Map()
        };
        
        console.log('🏗️ EventBusManager initialized');
        this.initializeEventBus();
    }

    /**
     * Inicializa el sistema de eventos
     */
    initializeEventBus() {
        // Configurar debugging si está en modo desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.debugging = true;
            console.log('🏗️ Event Bus debugging enabled');
        }
        
        // Configurar eventos especiales del sistema
        this.setupSystemEvents();
        
        // Configurar limpieza periódica del historial
        this.setupHistoryCleanup();
        
        console.log('✅ Event Bus system active');
    }

    /**
     * Configura eventos especiales del sistema
     */
    setupSystemEvents() {
        // Eventos de aplicación
        this.defineEventTypes({
            // Sistema
            'system:ready': 'Sistema completamente inicializado',
            'system:error': 'Error del sistema',
            'system:warning': 'Advertencia del sistema',
            
            // Usuario
            'user:login': 'Usuario autenticado',
            'user:logout': 'Usuario desconectado',
            'user:permissions:changed': 'Permisos de usuario cambiados',
            
            // Juego
            'game:created': 'Partida creada',
            'game:started': 'Partida iniciada',
            'game:ended': 'Partida terminada',
            'game:turn:changed': 'Turno cambiado',
            'game:phase:changed': 'Fase del juego cambiada',
            
            // Elementos
            'element:created': 'Elemento militar creado',
            'element:updated': 'Elemento militar actualizado',
            'element:deleted': 'Elemento militar eliminado',
            'element:selected': 'Elemento militar seleccionado',
            
            // Mapa
            'map:ready': 'Mapa inicializado',
            'map:clicked': 'Click en el mapa',
            'map:zoom:changed': 'Zoom del mapa cambiado',
            'map:center:changed': 'Centro del mapa cambiado',
            
            // Chat
            'chat:message:received': 'Mensaje de chat recibido',
            'chat:message:sent': 'Mensaje de chat enviado',
            'chat:user:joined': 'Usuario se unió al chat',
            'chat:user:left': 'Usuario salió del chat',
            
            // Red
            'network:connected': 'Conexión establecida',
            'network:disconnected': 'Conexión perdida',
            'network:reconnecting': 'Intentando reconectar',
            'network:recovered': 'Conexión recuperada',
            
            // UI
            'ui:panel:opened': 'Panel de UI abierto',
            'ui:panel:closed': 'Panel de UI cerrado',
            'ui:modal:opened': 'Modal abierto',
            'ui:modal:closed': 'Modal cerrado'
        });
    }

    /**
     * Define tipos de eventos disponibles
     * @param {Object} eventTypes - Mapa de tipos de eventos y descripciones
     */
    defineEventTypes(eventTypes) {
        this.eventTypes = { ...this.eventTypes, ...eventTypes };
    }

    /**
     * Suscribe un listener a un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function} listener - Función listener
     * @param {Object} options - Opciones del listener
     * @returns {Function} Función para desuscribir
     */
    on(eventName, listener, options = {}) {
        if (typeof listener !== 'function') {
            throw new Error('🏗️ Listener must be a function');
        }

        // Crear entrada para el evento si no existe
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }

        // Crear objeto listener con metadata
        const listenerObj = {
            fn: listener,
            once: options.once || false,
            priority: options.priority || 0,
            context: options.context || null,
            id: this.generateListenerId(),
            createdAt: Date.now(),
            callCount: 0
        };

        // Agregar listener
        this.events.get(eventName).add(listenerObj);
        this.eventStats.totalListeners++;

        if (this.debugging) {
            console.log(`🏗️ Listener registered for '${eventName}' (ID: ${listenerObj.id})`);
        }

        // Registrar con memory manager para cleanup
        if (window.MAIRA?.MemoryManager) {
            window.MAIRA.MemoryManager.registerCleanupTask(() => {
                this.off(eventName, listener);
            }, `EventBus listener for ${eventName}`);
        }

        // Función para desuscribir
        return () => this.off(eventName, listener);
    }

    /**
     * Suscribe un listener que se ejecuta solo una vez
     * @param {string} eventName - Nombre del evento
     * @param {Function} listener - Función listener
     * @param {Object} options - Opciones adicionales
     * @returns {Function} Función para desuscribir
     */
    once(eventName, listener, options = {}) {
        return this.on(eventName, listener, { ...options, once: true });
    }

    /**
     * Desuscribe un listener de un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function} listener - Función listener a remover
     */
    off(eventName, listener) {
        const listeners = this.events.get(eventName);
        if (!listeners) return;

        // Encontrar y remover el listener
        for (const listenerObj of listeners) {
            if (listenerObj.fn === listener) {
                listeners.delete(listenerObj);
                this.eventStats.totalListeners--;
                
                if (this.debugging) {
                    console.log(`🏗️ Listener removed from '${eventName}' (ID: ${listenerObj.id})`);
                }
                break;
            }
        }

        // Limpiar entrada si no hay más listeners
        if (listeners.size === 0) {
            this.events.delete(eventName);
        }
    }

    /**
     * Remueve todos los listeners de un evento
     * @param {string} eventName - Nombre del evento
     */
    removeAllListeners(eventName) {
        if (eventName) {
            const listeners = this.events.get(eventName);
            if (listeners) {
                this.eventStats.totalListeners -= listeners.size;
                this.events.delete(eventName);
                
                if (this.debugging) {
                    console.log(`🏗️ All listeners removed from '${eventName}'`);
                }
            }
        } else {
            // Remover todos los listeners de todos los eventos
            let totalRemoved = 0;
            for (const [name, listeners] of this.events) {
                totalRemoved += listeners.size;
            }
            this.events.clear();
            this.eventStats.totalListeners = 0;
            
            if (this.debugging) {
                console.log(`🏗️ All listeners removed (${totalRemoved} total)`);
            }
        }
    }

    /**
     * Emite un evento
     * @param {string} eventName - Nombre del evento
     * @param {*} data - Datos del evento
     * @param {Object} options - Opciones de emisión
     */
    emit(eventName, data = null, options = {}) {
        const listeners = this.events.get(eventName);
        
        // Crear objeto de evento
        const eventObj = {
            name: eventName,
            data,
            timestamp: Date.now(),
            source: options.source || 'unknown',
            id: this.generateEventId()
        };

        // Agregar al historial
        this.addToHistory(eventObj);

        // Actualizar estadísticas
        this.eventStats.totalEmitted++;
        this.eventStats.byEventType.set(
            eventName,
            (this.eventStats.byEventType.get(eventName) || 0) + 1
        );

        if (this.debugging) {
            console.log(`🏗️ Event emitted: '${eventName}'`, data);
        }

        // Ejecutar listeners si existen
        if (listeners && listeners.size > 0) {
            this.executeListeners(eventName, eventObj, listeners);
        }

        // Ejecutar listeners globales
        this.executeGlobalListeners(eventObj);

        // Emitir evento especial para debugging
        if (this.debugging && eventName !== 'debug:event:emitted') {
            this.emit('debug:event:emitted', eventObj, { source: 'EventBus' });
        }
    }

    /**
     * Ejecuta listeners para un evento específico
     * @param {string} eventName - Nombre del evento
     * @param {Object} eventObj - Objeto del evento
     * @param {Set} listeners - Set de listeners
     */
    executeListeners(eventName, eventObj, listeners) {
        // Convertir a array y ordenar por prioridad
        const sortedListeners = Array.from(listeners).sort((a, b) => b.priority - a.priority);
        
        const listenersToRemove = [];

        for (const listenerObj of sortedListeners) {
            try {
                // Ejecutar listener en el contexto apropiado
                const context = listenerObj.context || null;
                listenerObj.fn.call(context, eventObj.data, eventObj);
                
                listenerObj.callCount++;

                // Marcar para remoción si es 'once'
                if (listenerObj.once) {
                    listenersToRemove.push(listenerObj);
                }

            } catch (error) {
                console.error(`🏗️ Error in event listener for '${eventName}':`, error);
                
                // Reportar error usando el error handler si está disponible
                if (window.MAIRA?.ErrorHandler) {
                    window.MAIRA.ErrorHandler.handleError({
                        type: 'event_listener',
                        message: `Error in event listener for '${eventName}': ${error.message}`,
                        error,
                        stack: error.stack,
                        eventName,
                        listenerInfo: {
                            id: listenerObj.id,
                            callCount: listenerObj.callCount,
                            createdAt: listenerObj.createdAt
                        }
                    });
                }
            }
        }

        // Remover listeners 'once'
        listenersToRemove.forEach(listener => {
            listeners.delete(listener);
            this.eventStats.totalListeners--;
        });
    }

    /**
     * Ejecuta listeners globales
     * @param {Object} eventObj - Objeto del evento
     */
    executeGlobalListeners(eventObj) {
        for (const globalListener of this.globalListeners) {
            try {
                globalListener(eventObj);
            } catch (error) {
                console.error('🏗️ Error in global event listener:', error);
            }
        }
    }

    /**
     * Registra un listener global que recibe todos los eventos
     * @param {Function} listener - Función listener
     * @returns {Function} Función para desuscribir
     */
    onAny(listener) {
        this.globalListeners.add(listener);
        
        return () => this.globalListeners.delete(listener);
    }

    /**
     * Emite múltiples eventos de forma asíncrona
     * @param {Array} events - Array de eventos a emitir
     */
    async emitAsync(events) {
        const promises = events.map(event => {
            return new Promise(resolve => {
                // Usar setTimeout para hacer asíncrono
                setTimeout(() => {
                    this.emit(event.name, event.data, event.options);
                    resolve();
                }, 0);
            });
        });

        await Promise.all(promises);
    }

    /**
     * Espera a que se emita un evento específico
     * @param {string} eventName - Nombre del evento
     * @param {number} timeout - Timeout en ms
     * @returns {Promise} Promesa que se resuelve cuando se emite el evento
     */
    waitFor(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            
            const unsubscribe = this.once(eventName, (data, event) => {
                clearTimeout(timeoutId);
                resolve({ data, event });
            });

            timeoutId = setTimeout(() => {
                unsubscribe();
                reject(new Error(`Timeout waiting for event '${eventName}'`));
            }, timeout);
        });
    }

    /**
     * Agrega evento al historial
     * @param {Object} eventObj - Objeto del evento
     */
    addToHistory(eventObj) {
        this.eventHistory.push(eventObj);
        
        // Mantener tamaño del historial
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * Configura limpieza periódica del historial
     */
    setupHistoryCleanup() {
        setInterval(() => {
            // Limpiar eventos del historial más antiguos que 1 hora
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            this.eventHistory = this.eventHistory.filter(event => 
                event.timestamp > oneHourAgo
            );
        }, 10 * 60 * 1000); // Cada 10 minutos
    }

    /**
     * Genera ID único para listener
     * @returns {string} ID único
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Genera ID único para evento
     * @returns {string} ID único
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtiene estadísticas del event bus
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            ...this.eventStats,
            activeEventTypes: this.events.size,
            totalActiveListeners: Array.from(this.events.values())
                .reduce((total, listeners) => total + listeners.size, 0),
            historySize: this.eventHistory.length,
            byEventType: Object.fromEntries(this.eventStats.byEventType),
            recentEvents: this.eventHistory.slice(-10)
        };
    }

    /**
     * Obtiene el historial de eventos
     * @param {string} eventName - Filtrar por nombre (opcional)
     * @param {number} limit - Límite de resultados
     * @returns {Array} Historial de eventos
     */
    getEventHistory(eventName = null, limit = 50) {
        let history = this.eventHistory;
        
        if (eventName) {
            history = history.filter(event => event.name === eventName);
        }
        
        return history.slice(-limit);
    }

    /**
     * Habilita/deshabilita debugging
     * @param {boolean} enabled - Si habilitar debugging
     */
    setDebugging(enabled) {
        this.debugging = enabled;
        console.log(`🏗️ Event Bus debugging ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Limpia el event bus completamente
     */
    clear() {
        this.removeAllListeners();
        this.globalListeners.clear();
        this.eventHistory = [];
        this.eventStats = {
            totalEmitted: 0,
            totalListeners: 0,
            byEventType: new Map()
        };
        
        console.log('🏗️ Event Bus cleared');
    }

    /**
     * Namespace para crear event buses específicos
     * @param {string} namespace - Nombre del namespace
     * @returns {Object} Event bus con namespace
     */
    namespace(namespace) {
        return {
            on: (eventName, listener, options) => 
                this.on(`${namespace}:${eventName}`, listener, options),
            
            once: (eventName, listener, options) => 
                this.once(`${namespace}:${eventName}`, listener, options),
            
            off: (eventName, listener) => 
                this.off(`${namespace}:${eventName}`, listener),
            
            emit: (eventName, data, options) => 
                this.emit(`${namespace}:${eventName}`, data, { ...options, source: namespace }),
            
            waitFor: (eventName, timeout) => 
                this.waitFor(`${namespace}:${eventName}`, timeout)
        };
    }
}

// Inicializar EventBusManager globalmente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.Events = new EventBusManager();

// Crear namespaces comunes
window.MAIRA.GameEvents = window.MAIRA.Events.namespace('game');
window.MAIRA.UIEvents = window.MAIRA.Events.namespace('ui');
window.MAIRA.MapEvents = window.MAIRA.Events.namespace('map');
window.MAIRA.ChatEvents = window.MAIRA.Events.namespace('chat');

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBusManager;
}

console.log('🏗️ MAIRA Event Bus Manager loaded and active');
