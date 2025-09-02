/**
 * 🚌 EventBus Central MAIRA 4.0
 * Sistema de comunicación entre todos los módulos
 * Compatibilidad total con sistema existente
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
        this.debug = false;
        this.stats = {
            events_emitted: 0,
            listeners_registered: 0,
            errors_caught: 0
        };
        
        console.log('🚌 EventBus Central inicializado');
        this.configurarEventosCompatibilidad();
    }

    /**
     * Configurar compatibilidad con eventos existentes
     */
    configurarEventosCompatibilidad() {
        // Eventos críticos del sistema actual que deben seguir funcionando
        this.eventosCriticos = [
            // Gestión partidas
            'partidaCreada', 'partidaIniciada', 'partidaFinalizada',
            'jugadorUnido', 'jugadorDesconectado', 'jugadorListo',
            
            // Sistema turnos
            'cambioTurno', 'finTurno', 'inicioTurnos',
            'tiempoAgotado', 'pausarTurnos', 'reanudarTurnos',
            
            // Fases del juego
            'cambioFase', 'faseCompletada', 'inicioPreparacion',
            'inicioDespliegue', 'inicioCombate',
            
            // Elementos del mapa
            'elementoAgregado', 'elementoMovido', 'elementoEliminado',
            'marcadorCreado', 'coordenadasClick',
            
            // Chat y comunicación
            'nuevoMensajeChat', 'mensajePrivado', 'notificacionSistema',
            
            // Sistema director (NUEVOS)
            'directorAsignado', 'creadorDefinido', 'estadoListo',
            'sectorDefinido', 'zonaDespliegueCreada', 'nieblaGuerraActualizada'
        ];
        
        console.log(`📡 ${this.eventosCriticos.length} eventos críticos identificados`);
    }

    /**
     * Registrar listener para evento
     */
    on(event, callback, context = null, options = {}) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const listener = {
            callback: callback,
            context: context,
            id: this.generateListenerId(),
            priority: options.priority || 0,
            once: options.once || false,
            registered_at: new Date().toISOString()
        };
        
        this.listeners.get(event).push(listener);
        this.stats.listeners_registered++;

        // Ordenar por prioridad (mayor prioridad primero)
        this.listeners.get(event).sort((a, b) => b.priority - a.priority);

        if (this.debug) {
            console.log(`📡 Listener registrado: ${event} (ID: ${listener.id})`);
        }

        return listener.id; // Retornar ID para poder removearlo después
    }

    /**
     * Registrar listener que se ejecuta una sola vez
     */
    once(event, callback, context = null) {
        return this.on(event, callback, context, { once: true });
    }

    /**
     * Emitir evento a todos los listeners
     */
    emit(event, data = null) {
        this.stats.events_emitted++;
        
        if (this.debug) {
            console.log(`📤 Emitiendo evento: ${event}`, data);
        }

        if (this.listeners.has(event)) {
            const listeners = [...this.listeners.get(event)]; // Copia para evitar modificaciones durante iteración
            
            listeners.forEach(listener => {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                    
                    // Remover listener si es de una sola vez
                    if (listener.once) {
                        this.off(event, listener.id);
                    }
                    
                } catch (error) {
                    this.stats.errors_caught++;
                    console.error(`❌ Error en listener ${event} (ID: ${listener.id}):`, error);
                    
                    // Emitir evento de error para debugging
                    this.emit('eventbus_error', {
                        event: event,
                        listener_id: listener.id,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        }

        // Emitir evento especial para monitoreo si está habilitado
        if (this.debug && event !== 'eventbus_monitor') {
            this.emit('eventbus_monitor', {
                event: event,
                data: data,
                listeners_count: this.listeners.get(event)?.length || 0,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Remover listener específico
     */
    off(event, listenerId = null) {
        if (this.listeners.has(event)) {
            if (listenerId) {
                const listeners = this.listeners.get(event);
                const newListeners = listeners.filter(l => l.id !== listenerId);
                this.listeners.set(event, newListeners);
                
                if (this.debug) {
                    console.log(`📡 Listener removido: ${event} (ID: ${listenerId})`);
                }
            } else {
                // Remover todos los listeners del evento
                this.listeners.delete(event);
                
                if (this.debug) {
                    console.log(`📡 Todos los listeners removidos para: ${event}`);
                }
            }
        }
    }

    /**
     * Generar ID único para listener
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtener estadísticas del EventBus
     */
    getStats() {
        const listenersByEvent = {};
        this.listeners.forEach((listeners, event) => {
            listenersByEvent[event] = listeners.length;
        });

        return {
            ...this.stats,
            eventos_registrados: this.listeners.size,
            listeners_totales: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
            eventos_activos: Array.from(this.listeners.keys()),
            listeners_por_evento: listenersByEvent,
            memoria_estimada: this.calcularUsoMemoria()
        };
    }

    /**
     * Calcular uso aproximado de memoria
     */
    calcularUsoMemoria() {
        let totalListeners = 0;
        this.listeners.forEach(listeners => {
            totalListeners += listeners.length;
        });
        
        // Estimación aproximada: cada listener ~1KB
        return `${(totalListeners * 1).toFixed(1)} KB`;
    }

    /**
     * Limpiar listeners antiguos o no utilizados
     */
    cleanup() {
        let removidos = 0;
        const ahora = new Date().getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        this.listeners.forEach((listeners, event) => {
            const listenersFiltrados = listeners.filter(listener => {
                const edad = ahora - new Date(listener.registered_at).getTime();
                if (edad > maxAge) {
                    removidos++;
                    return false;
                }
                return true;
            });
            
            if (listenersFiltrados.length === 0) {
                this.listeners.delete(event);
            } else {
                this.listeners.set(event, listenersFiltrados);
            }
        });
        
        console.log(`🧹 EventBus cleanup: ${removidos} listeners antiguos removidos`);
    }

    /**
     * Activar/desactivar modo debug
     */
    setDebug(enabled) {
        this.debug = enabled;
        console.log(`🐛 EventBus debug: ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
    }

    /**
     * Exportar configuración actual
     */
    export() {
        return {
            eventos_registrados: Array.from(this.listeners.keys()),
            stats: this.getStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Verificar integridad del sistema
     */
    verificarIntegridad() {
        const problemas = [];
        
        // Verificar eventos críticos
        this.eventosCriticos.forEach(eventoCritico => {
            if (!this.listeners.has(eventoCritico)) {
                problemas.push(`Evento crítico sin listeners: ${eventoCritico}`);
            }
        });
        
        // Verificar listeners duplicados
        this.listeners.forEach((listeners, event) => {
            const ids = listeners.map(l => l.id);
            const idsUnicos = new Set(ids);
            if (ids.length !== idsUnicos.size) {
                problemas.push(`Listeners duplicados en evento: ${event}`);
            }
        });
        
        if (problemas.length === 0) {
            console.log('✅ EventBus: Integridad verificada correctamente');
        } else {
            console.warn('⚠️ EventBus: Problemas detectados:', problemas);
        }
        
        return problemas;
    }
}

// Instancia global compatible con sistema existente
window.MAIRA = window.MAIRA || {};
window.MAIRA.EventBus = new EventBus();

// Compatibilidad con posibles sistemas existentes
if (!window.EventBus) {
    window.EventBus = window.MAIRA.EventBus;
}

console.log('[MAIRA] EventBus Central cargado y operativo');
