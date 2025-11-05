/**
 * 🎯 ORDEN BASE - Clase abstracta para todas las órdenes
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * Inspiración: Total War - Sistema de órdenes con cola y ejecución
 */

class OrdenBase {
    constructor(unidad, tipo) {
        if (this.constructor === OrdenBase) {
            throw new Error('OrdenBase es una clase abstracta y no puede ser instanciada directamente');
        }

        // Identificación
        this.id = this.generarId();
        this.tipo = tipo; // 'movimiento', 'ataque', 'defensa', 'reconocimiento'
        this.unidad = unidad;

        // Estado
        this.estado = 'pendiente'; // 'pendiente', 'validando', 'valida', 'invalida', 'ejecutando', 'completada', 'cancelada'
        this.prioridad = 1; // 1-10, donde 10 es máxima prioridad

        // Timestamps
        this.timestampCreacion = Date.now();
        this.timestampValidacion = null;
        this.timestampEjecucion = null;
        this.timestampCompletada = null;

        // Validación
        this.esValida = false;
        this.mensajesValidacion = [];

        // Visualización
        this.elementosVisuales = [];
        this.color = unidad.equipo === 'azul' ? '#0066ff' : '#ff0000';

        // Metadatos
        this.equipo = unidad.equipo;
        this.jugadorId = unidad.jugadorId || window.userId;

        // Logger
        this.log(`Orden ${this.tipo} creada para unidad ${unidad.id || unidad.nombre}`);
    }

    /**
     * Genera un ID único para la orden
     */
    generarId() {
        return `orden_${this.tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Valida la orden - DEBE ser implementado por subclases
     * @returns {boolean} true si la orden es válida
     */
    async validar() {
        throw new Error('El método validar() debe ser implementado por la subclase');
    }

    /**
     * Ejecuta la orden - DEBE ser implementado por subclases
     * @returns {Object} resultado de la ejecución
     */
    async ejecutar() {
        throw new Error('El método ejecutar() debe ser implementado por la subclase');
    }

    /**
     * Dibuja la orden en el mapa - DEBE ser implementado por subclases
     */
    dibujarEnMapa() {
        throw new Error('El método dibujarEnMapa() debe ser implementado por la subclase');
    }

    /**
     * Cancela la orden
     */
    cancelar() {
        this.estado = 'cancelada';
        this.limpiarVisualizacion();
        this.log('Orden cancelada');

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenCancelada', {
                ordenId: this.id,
                tipo: this.tipo,
                unidadId: this.unidad.id
            });
        }
    }

    /**
     * Limpia todos los elementos visuales de la orden
     */
    limpiarVisualizacion() {
        this.elementosVisuales.forEach(elemento => {
            if (elemento && elemento.remove) {
                elemento.remove();
            } else if (elemento && window.map && window.map.removeLayer) {
                window.map.removeLayer(elemento);
            }
        });
        this.elementosVisuales = [];
    }

    /**
     * Serializa la orden para sincronización online
     */
    serializar() {
        return {
            id: this.id,
            tipo: this.tipo,
            unidadId: this.unidad.id,
            estado: this.estado,
            prioridad: this.prioridad,
            timestampCreacion: this.timestampCreacion,
            equipo: this.equipo,
            jugadorId: this.jugadorId,
            // Las subclases deben agregar sus propios datos
        };
    }

    /**
     * Deserializa una orden desde datos JSON
     */
    static deserializar(data) {
        throw new Error('El método deserializar() debe ser implementado por la subclase');
    }

    /**
     * Actualiza el estado de la orden
     */
    actualizarEstado(nuevoEstado, mensaje = null) {
        const estadoAnterior = this.estado;
        this.estado = nuevoEstado;

        // Actualizar timestamps
        switch(nuevoEstado) {
            case 'validando':
            case 'valida':
            case 'invalida':
                this.timestampValidacion = Date.now();
                break;
            case 'ejecutando':
                this.timestampEjecucion = Date.now();
                break;
            case 'completada':
            case 'cancelada':
                this.timestampCompletada = Date.now();
                break;
        }

        this.log(`Estado: ${estadoAnterior} → ${nuevoEstado}${mensaje ? ': ' + mensaje : ''}`);

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenEstadoCambiado', {
                ordenId: this.id,
                tipo: this.tipo,
                estadoAnterior,
                estadoNuevo: nuevoEstado,
                mensaje
            });
        }
    }

    /**
     * Verifica si la orden puede ser ejecutada
     */
    puedeEjecutarse() {
        return this.estado === 'valida' && this.esValida;
    }

    /**
     * Obtiene duración estimada de la orden (en ms)
     */
    getDuracionEstimada() {
        return 1000; // Override en subclases
    }

    /**
     * Logging con prefijo de orden
     */
    log(mensaje) {
        console.log(`[Orden ${this.tipo} #${this.id.substr(-8)}]`, mensaje);
    }

    /**
     * Obtiene un resumen legible de la orden
     */
    getResumen() {
        return `Orden ${this.tipo} para ${this.unidad.nombre || 'unidad'} - Estado: ${this.estado}`;
    }

    /**
     * Destructor - limpia recursos
     */
    destruir() {
        this.limpiarVisualizacion();
        this.unidad = null;
        this.log('Orden destruida');
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenBase;
}
window.OrdenBase = OrdenBase;

console.log('✅ OrdenBase.js cargado - Sistema de Órdenes V2');
