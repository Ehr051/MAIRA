/**
 * 📋 COLA DE ÓRDENES V2 - Múltiples órdenes secuenciales por unidad
 * Sistema de tiempo real: 1 turno = 1 hora en el terreno
 *
 * Permite:
 * - Cola secuencial de órdenes por unidad
 * - Coordinación temporal entre órdenes de diferentes unidades
 * - Órdenes paralelas (apoyo de fuego mientras avance)
 * - Cálculo de tiempo real de ejecución
 */

class OrdenesQueueV2 {
    constructor(equipoOJugador) {
        this.equipo = equipoOJugador;

        // Estructura: Map<unidadId, Array<orden>> - COLA SECUENCIAL POR UNIDAD
        this.ordenesPorUnidad = new Map();

        // Índice de órdenes por ID
        this.ordenesById = new Map();

        // Historial
        this.historial = [];

        // Estado
        this.ejecutando = false;
        this.pausada = false;

        // SISTEMA DE TIEMPO REAL
        this.tiempoConfig = {
            turnoEnHoras: 1.0,          // 1 turno = 1 hora en el terreno
            turnoEnSegundos: 3600,      // 1 hora = 3600 segundos
            turnoEnMinutos: 60          // 1 hora = 60 minutos
        };

        // Configuración
        this.config = {
            permitirOrdenesParalelas: true,     // Órdenes de diferentes unidades en paralelo
            permitirOrdenesSecuenciales: true,  // Múltiples órdenes por unidad
            maxOrdenesPorUnidad: 10,            // Límite de órdenes en cola por unidad
            validarAntesDeEjecutar: true
        };

        // Timeline para coordinación
        this.timeline = {
            duracionTotalTurno: 3600,  // 1 hora en segundos
            ordenesEnTimeline: []      // Array de { orden, inicio, fin, unidad }
        };

        // Estadísticas
        this.stats = {
            totalCreadas: 0,
            totalEjecutadas: 0,
            totalCanceladas: 0,
            totalFallidas: 0,
            ordenesMultiturno: 0
        };
    }

    /**
     * Agrega una orden a la cola SECUENCIAL de una unidad
     */
    agregarOrden(orden, posicion = null) {
        if (!(orden instanceof OrdenBase)) {
            console.error('Solo se pueden agregar instancias de OrdenBase');
            return false;
        }

        const unidadId = orden.unidad.id || orden.unidad.nombre;

        // Obtener o crear cola de la unidad
        if (!this.ordenesPorUnidad.has(unidadId)) {
            this.ordenesPorUnidad.set(unidadId, []);
        }

        const colaUnidad = this.ordenesPorUnidad.get(unidadId);

        // Verificar límite
        if (colaUnidad.length >= this.config.maxOrdenesPorUnidad) {
            console.warn(`La unidad ${unidadId} alcanzó el límite de ${this.config.maxOrdenesPorUnidad} órdenes`);
            return false;
        }

        // Agregar en posición específica o al final
        if (posicion !== null && posicion >= 0 && posicion <= colaUnidad.length) {
            colaUnidad.splice(posicion, 0, orden);
        } else {
            colaUnidad.push(orden);
        }

        // Indexar
        this.ordenesById.set(orden.id, orden);
        this.stats.totalCreadas++;

        // Calcular tiempo de la orden
        orden.tiempoRealSegundos = this.calcularTiempoReal(orden);
        orden.turnosNecesarios = this.calcularTurnosNecesarios(orden.tiempoRealSegundos);

        console.log(`✅ Orden agregada: ${orden.tipo} para ${unidadId} (posición ${posicion || colaUnidad.length}, ~${orden.tiempoRealSegundos}s, ${orden.turnosNecesarios} turnos)`);

        // Recalcular timeline
        this.recalcularTimeline();

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenAgregada', {
                ordenId: orden.id,
                tipo: orden.tipo,
                unidadId: unidadId,
                posicionEnCola: colaUnidad.length - 1,
                tiempoReal: orden.tiempoRealSegundos,
                turnosNecesarios: orden.turnosNecesarios
            });
        }

        return true;
    }

    /**
     * Calcula tiempo REAL que tomará la orden en el terreno (en segundos)
     * Basado en distancia, velocidad de unidad, tipo de terreno, etc.
     */
    calcularTiempoReal(orden) {
        switch(orden.tipo) {
            case 'movimiento':
                return this.calcularTiempoMovimiento(orden);
            case 'ataque':
                return this.calcularTiempoAtaque(orden);
            case 'defensa':
                return this.calcularTiempoDefensa(orden);
            case 'ingeniero':
                return this.calcularTiempoIngeniero(orden);
            default:
                return 60; // 1 minuto por defecto
        }
    }

    /**
     * Calcula tiempo de movimiento real
     */
    calcularTiempoMovimiento(orden) {
        if (!orden.distanciaTotal || !window.pathfinding) {
            return 600; // 10 minutos por defecto
        }

        const distanciaKm = orden.distanciaTotal / 1000;
        const tipoUnidad = orden.unidad.tipoUnidad || 'infanteria';

        // Velocidades en km/h (ajustadas por terreno)
        const velocidades = {
            infanteria: 4,    // 4 km/h a pie
            vehiculo: 30,     // 30 km/h
            blindado: 20,     // 20 km/h
            aereo: 150        // 150 km/h
        };

        const velocidadBase = velocidades[tipoUnidad] || 4;

        // Factor de terreno (ya calculado en pathfinding)
        // Si la ruta tiene muchos obstáculos, será más larga y tomará más tiempo
        let velocidadReal = velocidadBase;

        // Ajustar por condiciones
        if (orden.unidad.moral && orden.unidad.moral < 50) {
            velocidadReal *= 0.7; // -30% si moral baja
        }

        if (orden.unidad.fatiga && orden.unidad.fatiga > 70) {
            velocidadReal *= 0.8; // -20% si muy fatigada
        }

        // Tiempo = distancia / velocidad (en horas) → convertir a segundos
        const tiempoHoras = distanciaKm / velocidadReal;
        return Math.ceil(tiempoHoras * 3600);
    }

    /**
     * Calcula tiempo de ataque
     */
    calcularTiempoAtaque(orden) {
        // Ataque directo: 2-5 minutos
        // Ataque de artillería: 5-15 minutos

        if (orden.opciones && orden.opciones.fuegoDirecto) {
            return 180; // 3 minutos para fuego directo
        } else {
            // Fuego indirecto (artillería)
            const municionGastar = orden.opciones?.municionGastar || 1;
            return 300 + (municionGastar * 120); // Base 5 min + 2 min por disparo
        }
    }

    /**
     * Calcula tiempo de defensa
     */
    calcularTiempoDefensa(orden) {
        // Fortificar posición: 15-45 minutos según nivel
        const nivel = orden.nivelFortificacion || 1;
        return 900 * nivel; // 15 min por nivel
    }

    /**
     * Calcula tiempo de ingeniero
     */
    calcularTiempoIngeniero(orden) {
        const tipoTrabajo = orden.tipoTrabajo || 'campo_minado';

        const tiempos = {
            campo_minado: 1800,      // 30 minutos
            alambrada: 1200,         // 20 minutos
            fortificacion: 2700,     // 45 minutos
            mejorar_camino: 3600,    // 1 hora
            puente: 7200,            // 2 horas
            demolicion: 600          // 10 minutos
        };

        return tiempos[tipoTrabajo] || 1800;
    }

    /**
     * Calcula cuántos turnos necesita una orden
     * 1 turno = 1 hora = 3600 segundos
     */
    calcularTurnosNecesarios(tiempoSegundos) {
        return Math.ceil(tiempoSegundos / this.tiempoConfig.turnoEnSegundos);
    }

    /**
     * Recalcula el timeline de todas las órdenes
     * Determina qué órdenes se ejecutan en paralelo
     */
    recalcularTimeline() {
        this.timeline.ordenesEnTimeline = [];

        // Por cada unidad, agregar sus órdenes secuenciales al timeline
        for (const [unidadId, ordenes] of this.ordenesPorUnidad) {
            let tiempoAcumulado = 0;

            for (const orden of ordenes) {
                if (orden.estado === 'pendiente' || orden.estado === 'valida') {
                    const duracion = orden.tiempoRealSegundos || this.calcularTiempoReal(orden);

                    this.timeline.ordenesEnTimeline.push({
                        orden: orden,
                        unidadId: unidadId,
                        inicio: tiempoAcumulado,
                        fin: tiempoAcumulado + duracion,
                        duracion: duracion,
                        turnoInicio: Math.floor(tiempoAcumulado / this.tiempoConfig.turnoEnSegundos) + 1,
                        turnoFin: Math.ceil((tiempoAcumulado + duracion) / this.tiempoConfig.turnoEnSegundos)
                    });

                    tiempoAcumulado += duracion;
                }
            }
        }

        // Ordenar por tiempo de inicio
        this.timeline.ordenesEnTimeline.sort((a, b) => a.inicio - b.inicio);

        console.log(`📅 Timeline recalculado: ${this.timeline.ordenesEnTimeline.length} órdenes`);
    }

    /**
     * Obtiene órdenes que se ejecutan en el turno actual
     */
    getOrdenesDelTurno(numeroTurno = 1) {
        return this.timeline.ordenesEnTimeline.filter(item =>
            item.turnoInicio <= numeroTurno && item.turnoFin >= numeroTurno
        );
    }

    /**
     * Obtiene las órdenes de una unidad
     */
    getOrdenesDeUnidad(unidadId) {
        return this.ordenesPorUnidad.get(unidadId) || [];
    }

    /**
     * Obtiene la orden actual de una unidad (primera pendiente)
     */
    getOrdenActualDeUnidad(unidadId) {
        const ordenes = this.getOrdenesDeUnidad(unidadId);
        return ordenes.find(o => o.estado === 'ejecutando') ||
               ordenes.find(o => o.estado === 'valida' || o.estado === 'pendiente');
    }

    /**
     * Reordena órdenes de una unidad
     */
    reordenarOrdenes(unidadId, ordenIds) {
        const ordenes = this.ordenesPorUnidad.get(unidadId);
        if (!ordenes) return false;

        const nuevasCola = ordenIds.map(id =>
            ordenes.find(o => o.id === id)
        ).filter(o => o !== undefined);

        this.ordenesPorUnidad.set(unidadId, nuevasCola);
        this.recalcularTimeline();

        console.log(`🔄 Órdenes reordenadas para ${unidadId}`);
        return true;
    }

    /**
     * Cancela una orden específica de una unidad
     */
    cancelarOrden(ordenId) {
        const orden = this.ordenesById.get(ordenId);
        if (!orden) return false;

        const unidadId = orden.unidad.id || orden.unidad.nombre;
        const ordenes = this.ordenesPorUnidad.get(unidadId);

        if (ordenes) {
            const index = ordenes.findIndex(o => o.id === ordenId);
            if (index >= 0) {
                ordenes.splice(index, 1);
            }
        }

        orden.cancelar();
        this.ordenesById.delete(ordenId);
        this.moverAHistorial(orden);
        this.stats.totalCanceladas++;
        this.recalcularTimeline();

        return true;
    }

    /**
     * Cancela todas las órdenes de una unidad
     */
    cancelarOrdenesDeUnidad(unidadId) {
        const ordenes = this.ordenesPorUnidad.get(unidadId);
        if (!ordenes) return 0;

        let canceladas = 0;
        ordenes.forEach(orden => {
            orden.cancelar();
            this.ordenesById.delete(orden.id);
            this.moverAHistorial(orden);
            canceladas++;
        });

        this.ordenesPorUnidad.delete(unidadId);
        this.stats.totalCanceladas += canceladas;
        this.recalcularTimeline();

        console.log(`🗑️ ${canceladas} órdenes canceladas para ${unidadId}`);
        return canceladas;
    }

    /**
     * Valida todas las órdenes pendientes
     */
    async validarOrdenes() {
        console.log('🔍 Validando todas las órdenes...');

        const resultados = [];

        for (const [unidadId, ordenes] of this.ordenesPorUnidad) {
            for (const orden of ordenes) {
                if (orden.estado === 'pendiente') {
                    try {
                        const esValida = await orden.validar();
                        resultados.push({
                            ordenId: orden.id,
                            unidadId: unidadId,
                            tipo: orden.tipo,
                            esValida,
                            mensajes: orden.mensajesValidacion
                        });
                    } catch (error) {
                        console.error(`Error validando orden ${orden.id}:`, error);
                        orden.actualizarEstado('invalida', error.message);
                        resultados.push({
                            ordenId: orden.id,
                            unidadId: unidadId,
                            tipo: orden.tipo,
                            esValida: false,
                            error: error.message
                        });
                    }
                }
            }
        }

        const validas = resultados.filter(r => r.esValida).length;
        const invalidas = resultados.length - validas;
        console.log(`✅ Validación completa: ${validas} válidas, ${invalidas} inválidas`);

        return resultados;
    }

    /**
     * Ejecuta órdenes del turno actual
     */
    async ejecutarTurno(numeroTurno = 1) {
        if (this.ejecutando) {
            console.warn('Ya hay una ejecución en curso');
            return { exito: false, error: 'Ejecución en curso' };
        }

        // Validar si está configurado
        if (this.config.validarAntesDeEjecutar) {
            await this.validarOrdenes();
        }

        // Obtener órdenes del turno
        const ordenesDelTurno = this.getOrdenesDelTurno(numeroTurno);

        if (ordenesDelTurno.length === 0) {
            console.log('⏭️ No hay órdenes para ejecutar en este turno');
            return { exito: true, ejecutadas: 0 };
        }

        console.log(`🚀 Ejecutando ${ordenesDelTurno.length} órdenes del turno ${numeroTurno}...`);
        this.ejecutando = true;

        const resultados = [];

        // Agrupar por tiempo de inicio para ejecutar en paralelo las que inician juntas
        const gruposPorInicio = this.agruparPorInicio(ordenesDelTurno);

        for (const grupo of gruposPorInicio) {
            // Ejecutar en paralelo las órdenes del grupo
            const promesas = grupo.map(item => this.ejecutarOrdenItem(item));
            const resultadosGrupo = await Promise.all(promesas);
            resultados.push(...resultadosGrupo);
        }

        this.ejecutando = false;

        // Actualizar estadísticas
        resultados.forEach(resultado => {
            if (resultado.exito) {
                this.stats.totalEjecutadas++;
            } else {
                this.stats.totalFallidas++;
            }
        });

        console.log(`✅ Turno ${numeroTurno} completado: ${this.stats.totalEjecutadas} exitosas, ${this.stats.totalFallidas} fallidas`);

        return { exito: true, resultados, turno: numeroTurno };
    }

    /**
     * Ejecuta un item del timeline
     */
    async ejecutarOrdenItem(item) {
        const orden = item.orden;

        try {
            console.log(`⚡ Ejecutando: ${orden.getResumen()}`);
            const resultado = await orden.ejecutar();

            // Si completada, remover de la cola de la unidad
            if (orden.estado === 'completada') {
                this.removerOrdenDeUnidad(item.unidadId, orden.id);
                this.moverAHistorial(orden);
            }

            return {
                ordenId: orden.id,
                unidadId: item.unidadId,
                tipo: orden.tipo,
                ...resultado
            };

        } catch (error) {
            console.error(`Error ejecutando orden ${orden.id}:`, error);
            return {
                ordenId: orden.id,
                unidadId: item.unidadId,
                tipo: orden.tipo,
                exito: false,
                error: error.message
            };
        }
    }

    /**
     * Agrupa órdenes por tiempo de inicio (para ejecución paralela)
     */
    agruparPorInicio(ordenesDelTurno) {
        const grupos = new Map();

        for (const item of ordenesDelTurno) {
            const inicio = item.inicio;
            if (!grupos.has(inicio)) {
                grupos.set(inicio, []);
            }
            grupos.get(inicio).push(item);
        }

        // Convertir a array y ordenar
        return Array.from(grupos.values()).sort((a, b) => a[0].inicio - b[0].inicio);
    }

    /**
     * Remueve una orden de la cola de una unidad
     */
    removerOrdenDeUnidad(unidadId, ordenId) {
        const ordenes = this.ordenesPorUnidad.get(unidadId);
        if (!ordenes) return false;

        const index = ordenes.findIndex(o => o.id === ordenId);
        if (index >= 0) {
            ordenes.splice(index, 1);
            this.ordenesById.delete(ordenId);

            // Si no quedan órdenes, eliminar entrada
            if (ordenes.length === 0) {
                this.ordenesPorUnidad.delete(unidadId);
            }

            this.recalcularTimeline();
            return true;
        }

        return false;
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
     * Obtiene estadísticas completas
     */
    getEstadisticas() {
        let totalOrdenesPendientes = 0;
        this.ordenesPorUnidad.forEach(ordenes => {
            totalOrdenesPendientes += ordenes.length;
        });

        return {
            ...this.stats,
            pendientes: totalOrdenesPendientes,
            unidadesConOrdenes: this.ordenesPorUnidad.size,
            enHistorial: this.historial.length,
            ejecutando: this.ejecutando,
            pausada: this.pausada
        };
    }

    /**
     * Obtener TODAS las órdenes de la cola (para timeline/matriz)
     */
    obtenerTodasLasOrdenes() {
        const todas = [];
        this.ordenesPorUnidad.forEach((ordenes, unidadId) => {
            ordenes.forEach(orden => {
                todas.push({
                    ...orden,
                    unidadId: unidadId
                });
            });
        });
        return todas;
    }

    /**
     * Debug completo
     */
    debug() {
        console.log('=== COLA DE ÓRDENES V2 DEBUG ===');
        console.log('Equipo:', this.equipo);
        console.log('Unidades con órdenes:', this.ordenesPorUnidad.size);
        console.log('Estadísticas:', this.getEstadisticas());
        console.log('\nÓrdenes por unidad:');
        this.ordenesPorUnidad.forEach((ordenes, unidadId) => {
            console.log(`  ${unidadId}:`);
            ordenes.forEach((orden, index) => {
                console.log(`    ${index + 1}. ${orden.getResumen()} (${orden.tiempoRealSegundos}s, ${orden.turnosNecesarios} turnos)`);
            });
        });
        console.log('\nTimeline:');
        this.timeline.ordenesEnTimeline.forEach(item => {
            console.log(`  T${item.turnoInicio}-${item.turnoFin}: ${item.unidadId} - ${item.orden.tipo} (${item.duracion}s)`);
        });
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenesQueueV2;
}
window.OrdenesQueueV2 = OrdenesQueueV2;

console.log('✅ OrdenesQueueV2.js cargado - Sistema de Órdenes Secuenciales y Tiempo Real');
