/**
 * 📋 COLA DE ÓRDENES - Gestor de órdenes por jugador/equipo
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * Gestiona la cola de órdenes pendientes, validación y ejecución
 */

class OrdenesQueue {
    constructor(equipoOJugador) {
        this.equipo = equipoOJugador;
        this.ordenes = new Map(); // Map<ordenId, orden>
        this.ordenPorUnidad = new Map(); // Map<unidadId, ordenId>
        this.historial = []; // Array de órdenes completadas/canceladas

        // Estado
        this.ejecutando = false;
        this.pausada = false;
        this.ordenEnEjecucion = null;

        // Configuración
        this.config = {
            ejecutarEnParalelo: false, // Si true, ejecuta múltiples órdenes simultáneamente
            maxOrdenesParalelas: 5,
            validarAntesDeEjecutar: true
        };

        // Estadísticas
        this.stats = {
            totalCreadas: 0,
            totalEjecutadas: 0,
            totalCanceladas: 0,
            totalFallidas: 0
        };
    }

    /**
     * Agrega una orden a la cola
     */
    agregarOrden(orden) {
        if (!(orden instanceof OrdenBase)) {
            console.error('Solo se pueden agregar instancias de OrdenBase');
            return false;
        }

        // Verificar si la unidad ya tiene una orden pendiente
        const unidadId = orden.unidad.id || orden.unidad.nombre;
        if (this.ordenPorUnidad.has(unidadId)) {
            const ordenAnteriorId = this.ordenPorUnidad.get(unidadId);
            const ordenAnterior = this.ordenes.get(ordenAnteriorId);

            if (ordenAnterior && ordenAnterior.estado !== 'completada' && ordenAnterior.estado !== 'cancelada') {
                console.warn(`La unidad ${unidadId} ya tiene una orden pendiente. Cancelando orden anterior.`);
                this.cancelarOrden(ordenAnteriorId);
            }
        }

        // Agregar orden
        this.ordenes.set(orden.id, orden);
        this.ordenPorUnidad.set(unidadId, orden.id);
        this.stats.totalCreadas++;

        console.log(`✅ Orden agregada a cola: ${orden.tipo} para unidad ${unidadId}`);

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenAgregada', {
                ordenId: orden.id,
                tipo: orden.tipo,
                unidadId: unidadId,
                equipo: this.equipo
            });
        }

        return true;
    }

    /**
     * Remueve una orden de la cola
     */
    removerOrden(ordenId) {
        const orden = this.ordenes.get(ordenId);
        if (!orden) return false;

        const unidadId = orden.unidad.id || orden.unidad.nombre;

        this.ordenes.delete(ordenId);
        this.ordenPorUnidad.delete(unidadId);

        console.log(`🗑️ Orden removida: ${ordenId}`);
        return true;
    }

    /**
     * Cancela una orden
     */
    cancelarOrden(ordenId) {
        const orden = this.ordenes.get(ordenId);
        if (!orden) return false;

        orden.cancelar();
        this.moverAHistorial(orden);
        this.removerOrden(ordenId);
        this.stats.totalCanceladas++;

        return true;
    }

    /**
     * Obtiene una orden por ID
     */
    getOrden(ordenId) {
        return this.ordenes.get(ordenId);
    }

    /**
     * Obtiene la orden de una unidad
     */
    getOrdenDeUnidad(unidadId) {
        const ordenId = this.ordenPorUnidad.get(unidadId);
        return ordenId ? this.ordenes.get(ordenId) : null;
    }

    /**
     * Obtiene todas las órdenes pendientes
     */
    getOrdenesPendientes() {
        return Array.from(this.ordenes.values()).filter(orden =>
            orden.estado === 'pendiente' || orden.estado === 'valida'
        );
    }

    /**
     * Obtiene todas las órdenes por estado
     */
    getOrdenesPorEstado(estado) {
        return Array.from(this.ordenes.values()).filter(orden => orden.estado === estado);
    }

    /**
     * Valida todas las órdenes pendientes
     */
    async validarOrdenes() {
        console.log('🔍 Validando órdenes pendientes...');

        const ordenesPendientes = this.getOrdenesPendientes();
        const resultados = [];

        for (const orden of ordenesPendientes) {
            try {
                const esValida = await orden.validar();
                resultados.push({
                    ordenId: orden.id,
                    tipo: orden.tipo,
                    esValida,
                    mensajes: orden.mensajesValidacion
                });
            } catch (error) {
                console.error(`Error validando orden ${orden.id}:`, error);
                orden.actualizarEstado('invalida', error.message);
                resultados.push({
                    ordenId: orden.id,
                    tipo: orden.tipo,
                    esValida: false,
                    error: error.message
                });
            }
        }

        const validas = resultados.filter(r => r.esValida).length;
        const invalidas = resultados.length - validas;

        console.log(`✅ Validación completa: ${validas} válidas, ${invalidas} inválidas`);

        return resultados;
    }

    /**
     * Ejecuta todas las órdenes válidas
     */
    async ejecutarOrdenes() {
        if (this.ejecutando) {
            console.warn('Ya hay una ejecución en curso');
            return { exito: false, error: 'Ejecución en curso' };
        }

        // Validar primero si está configurado
        if (this.config.validarAntesDeEjecutar) {
            await this.validarOrdenes();
        }

        // Obtener órdenes válidas
        const ordenesValidas = Array.from(this.ordenes.values()).filter(orden =>
            orden.puedeEjecutarse()
        );

        if (ordenesValidas.length === 0) {
            console.warn('No hay órdenes válidas para ejecutar');
            return { exito: false, error: 'Sin órdenes válidas' };
        }

        // Ordenar por prioridad (mayor prioridad primero)
        ordenesValidas.sort((a, b) => b.prioridad - a.prioridad);

        console.log(`🚀 Ejecutando ${ordenesValidas.length} órdenes...`);
        this.ejecutando = true;

        const resultados = [];

        try {
            if (this.config.ejecutarEnParalelo) {
                // Ejecución en paralelo (limitada)
                resultados.push(...await this.ejecutarEnParalelo(ordenesValidas));
            } else {
                // Ejecución secuencial
                resultados.push(...await this.ejecutarEnSecuencia(ordenesValidas));
            }
        } catch (error) {
            console.error('Error durante ejecución de órdenes:', error);
            this.ejecutando = false;
            return { exito: false, error: error.message };
        }

        this.ejecutando = false;
        this.ordenEnEjecucion = null;

        // Actualizar estadísticas
        resultados.forEach(resultado => {
            if (resultado.exito) {
                this.stats.totalEjecutadas++;
            } else {
                this.stats.totalFallidas++;
            }
        });

        console.log(`✅ Ejecución completa: ${this.stats.totalEjecutadas} exitosas, ${this.stats.totalFallidas} fallidas`);

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenesEjecutadas', {
                equipo: this.equipo,
                total: resultados.length,
                exitosas: resultados.filter(r => r.exito).length
            });
        }

        return { exito: true, resultados };
    }

    /**
     * Ejecuta órdenes en secuencia
     */
    async ejecutarEnSecuencia(ordenes) {
        const resultados = [];

        for (const orden of ordenes) {
            // Verificar pausa
            while (this.pausada) {
                await this.sleep(100);
            }

            this.ordenEnEjecucion = orden;

            try {
                console.log(`⚡ Ejecutando: ${orden.getResumen()}`);
                const resultado = await orden.ejecutar();

                resultados.push({
                    ordenId: orden.id,
                    tipo: orden.tipo,
                    ...resultado
                });

                // Mover a historial si completada
                if (orden.estado === 'completada') {
                    this.moverAHistorial(orden);
                    this.removerOrden(orden.id);
                }

            } catch (error) {
                console.error(`Error ejecutando orden ${orden.id}:`, error);
                resultados.push({
                    ordenId: orden.id,
                    tipo: orden.tipo,
                    exito: false,
                    error: error.message
                });
            }
        }

        return resultados;
    }

    /**
     * Ejecuta órdenes en paralelo (con límite)
     */
    async ejecutarEnParalelo(ordenes) {
        const resultados = [];
        const chunks = this.dividirEnChunks(ordenes, this.config.maxOrdenesParalelas);

        for (const chunk of chunks) {
            const promesas = chunk.map(async (orden) => {
                this.ordenEnEjecucion = orden;
                try {
                    const resultado = await orden.ejecutar();

                    if (orden.estado === 'completada') {
                        this.moverAHistorial(orden);
                        this.removerOrden(orden.id);
                    }

                    return {
                        ordenId: orden.id,
                        tipo: orden.tipo,
                        ...resultado
                    };
                } catch (error) {
                    console.error(`Error ejecutando orden ${orden.id}:`, error);
                    return {
                        ordenId: orden.id,
                        tipo: orden.tipo,
                        exito: false,
                        error: error.message
                    };
                }
            });

            const resultadosChunk = await Promise.all(promesas);
            resultados.push(...resultadosChunk);
        }

        return resultados;
    }

    /**
     * Pausa la ejecución
     */
    pausar() {
        this.pausada = true;
        console.log('⏸️ Ejecución pausada');
    }

    /**
     * Reanuda la ejecución
     */
    reanudar() {
        this.pausada = false;
        console.log('▶️ Ejecución reanudada');
    }

    /**
     * Cancela todas las órdenes pendientes
     */
    cancelarTodas() {
        const ordenesPendientes = Array.from(this.ordenes.values());
        ordenesPendientes.forEach(orden => this.cancelarOrden(orden.id));
        console.log(`🗑️ ${ordenesPendientes.length} órdenes canceladas`);
    }

    /**
     * Mueve una orden al historial
     */
    moverAHistorial(orden) {
        this.historial.push({
            ...orden.serializar(),
            timestampHistorial: Date.now()
        });

        // Limitar tamaño del historial
        if (this.historial.length > 100) {
            this.historial.shift();
        }
    }

    /**
     * Obtiene el historial
     */
    getHistorial(limite = 20) {
        return this.historial.slice(-limite);
    }

    /**
     * Obtiene estadísticas
     */
    getEstadisticas() {
        return {
            ...this.stats,
            pendientes: this.ordenes.size,
            enHistorial: this.historial.length,
            ejecutando: this.ejecutando,
            pausada: this.pausada
        };
    }

    /**
     * Limpia la cola y el historial
     */
    limpiar() {
        this.cancelarTodas();
        this.ordenes.clear();
        this.ordenPorUnidad.clear();
        this.historial = [];
        console.log('🧹 Cola limpiada');
    }

    /**
     * Helpers
     */
    dividirEnChunks(array, tamañoChunk) {
        const chunks = [];
        for (let i = 0; i < array.length; i += tamañoChunk) {
            chunks.push(array.slice(i, i + tamañoChunk));
        }
        return chunks;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Debug info
     */
    debug() {
        console.log('=== COLA DE ÓRDENES DEBUG ===');
        console.log('Equipo:', this.equipo);
        console.log('Órdenes activas:', this.ordenes.size);
        console.log('Historial:', this.historial.length);
        console.log('Estadísticas:', this.stats);
        console.log('Estado:', {
            ejecutando: this.ejecutando,
            pausada: this.pausada,
            ordenEnEjecucion: this.ordenEnEjecucion?.id
        });
        console.log('Órdenes:');
        this.ordenes.forEach((orden, id) => {
            console.log(`  - ${id}: ${orden.getResumen()}`);
        });
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenesQueue;
}
window.OrdenesQueue = OrdenesQueue;

console.log('✅ OrdenesQueue.js cargado - Gestor de Cola de Órdenes V2');
