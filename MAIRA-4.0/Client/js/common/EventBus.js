// EventBus.js - Sistema de eventos para comunicación entre componentes
class EventBus {
    constructor() {
        this.events = {};
    }

    // Suscribirse a un evento
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    // Desuscribirse de un evento
    off(event, callback) {
        if (!this.events[event]) return;
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    }

    // Emitir un evento
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error en callback de evento ${event}:`, error);
            }
        });
    }

    // Limpiar todos los eventos
    clear() {
        this.events = {};
    }
}

// Instancia global del EventBus
const eventBus = new EventBus();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, eventBus };
}

// Hacer disponible globalmente
window.EventBus = EventBus;
window.eventBus = eventBus;
