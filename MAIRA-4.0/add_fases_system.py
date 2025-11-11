#!/usr/bin/env python3
"""
Agregar sistema de fases a OrdenBase.js
- Fases: array de objetos con tipo, origen dinámico, destino, duración
- Métodos: agregarFase(), calcularDuracionTotal(), ejecutarFase()
- getPosicionActual() para origen dinámico
"""

archivo = "Client/js/modules/juegoV2/ordenes/OrdenBase.js"

# Leer contenido actual
with open(archivo, 'r', encoding='utf-8') as f:
    contenido = f.read()

# 1. AGREGAR propiedades de fases en constructor (después de // Metadatos)
old_constructor_metadatos = """        // Metadatos
        this.equipo = unidad.equipo;
        this.jugadorId = unidad.jugadorId || window.userId;

        // Logger
        this.log(`Orden ${this.tipo} creada para unidad ${unidad.id || unidad.nombre}`);"""

new_constructor_metadatos = """        // Metadatos
        this.equipo = unidad.equipo;
        this.jugadorId = unidad.jugadorId || window.userId;

        // 🆕 SISTEMA DE FASES - Órdenes complejas multi-fase
        this.fases = []; // Array de objetos fase
        this.faseActual = -1; // -1 = no iniciada, 0+ = índice fase actual
        this.estadoFase = 'sin_iniciar'; // 'sin_iniciar', 'en_progreso', 'completada', 'pausada'
        this.turnoInicioFaseActual = null; // Turno cuando comenzó la fase actual
        this.duracionTotal = 0; // Turnos totales (suma de todas las fases)

        // Logger
        this.log(`Orden ${this.tipo} creada para unidad ${unidad.id || unidad.nombre}`);"""

contenido = contenido.replace(old_constructor_metadatos, new_constructor_metadatos)

# 2. AGREGAR métodos de sistema de fases (después del método getDuracionEstimada)
old_duracion = """    /**
     * Obtiene duración estimada de la orden (en ms)
     */
    getDuracionEstimada() {
        return 1000; // Override en subclases
    }

    /**
     * Logging con prefijo de orden
     */
    log(mensaje) {"""

new_duracion = """    /**
     * Obtiene duración estimada de la orden (en ms)
     */
    getDuracionEstimada() {
        return 1000; // Override en subclases
    }

    // ================================
    // 🆕 SISTEMA DE FASES
    // ================================

    /**
     * Obtiene la posición actual de la unidad en tiempo real
     * @returns {L.LatLng} Posición actual
     */
    getPosicionActual() {
        if (this.unidad && this.unidad.getLatLng) {
            return this.unidad.getLatLng();
        }
        // Fallback: buscar marcador por ID
        if (window.mapaUnidades && this.unidad && this.unidad.id) {
            const marcador = window.mapaUnidades.get(this.unidad.id);
            if (marcador && marcador.getLatLng) {
                return marcador.getLatLng();
            }
        }
        console.warn(`[OrdenBase] No se pudo obtener posición actual de unidad ${this.unidad?.id}`);
        return null;
    }

    /**
     * Agrega una fase a la orden
     * @param {Object} fase - Objeto con estructura:
     *   {
     *     tipo: 'marcha'|'aproximacion'|'ataque'|'instalacion'|'fuego'|'ajuste_tiro'|'mantener',
     *     obtenerOrigen: () => LatLng, // Función que retorna origen dinámico
     *     destino: LatLng | Hex,
     *     calcularDuracion: () => Number, // Función que calcula turnos
     *     condiciones: ['enAlcance', 'municionDisponible'], // Condiciones para ejecutar
     *     metadata: {} // Datos adicionales específicos de la fase
     *   }
     */
    agregarFase(fase) {
        // Validar estructura mínima
        if (!fase.tipo) {
            console.error('[OrdenBase] Fase sin tipo definido');
            return;
        }

        // Agregar defaults
        const faseCompleta = {
            tipo: fase.tipo,
            obtenerOrigen: fase.obtenerOrigen || (() => this.getPosicionActual()),
            destino: fase.destino || null,
            calcularDuracion: fase.calcularDuracion || (() => 1), // 1 turno por defecto
            condiciones: fase.condiciones || [],
            metadata: fase.metadata || {},
            estado: 'pendiente', // 'pendiente', 'en_ejecucion', 'completada', 'fallida'
            turnoInicio: null,
            turnoFin: null
        };

        this.fases.push(faseCompleta);
        this.log(`Fase ${this.fases.length} agregada: ${fase.tipo}`);

        // Recalcular duración total
        this.calcularDuracionTotal();
    }

    /**
     * Calcula la duración total sumando todas las fases
     * @returns {Number} Turnos totales
     */
    calcularDuracionTotal() {
        this.duracionTotal = 0;
        this.fases.forEach((fase, idx) => {
            const turnos = fase.calcularDuracion();
            this.duracionTotal += turnos;
            this.log(`Fase ${idx + 1} (${fase.tipo}): ${turnos} turnos`);
        });
        this.log(`Duración total: ${this.duracionTotal} turnos`);
        return this.duracionTotal;
    }

    /**
     * Ejecuta una fase específica por índice
     * @param {Number} indice - Índice de la fase a ejecutar
     * @returns {Promise<Object>} Resultado de la ejecución
     */
    async ejecutarFase(indice) {
        if (indice < 0 || indice >= this.fases.length) {
            throw new Error(`Índice de fase inválido: ${indice}`);
        }

        const fase = this.fases[indice];
        this.log(`Ejecutando fase ${indice + 1}/${this.fases.length}: ${fase.tipo}`);

        // Actualizar estado
        fase.estado = 'en_ejecucion';
        fase.turnoInicio = window.turnosManager?.turnoActual || 0;
        this.faseActual = indice;
        this.estadoFase = 'en_progreso';

        try {
            // Obtener origen dinámico
            const origenDinamico = fase.obtenerOrigen();
            this.log(`Origen dinámico: ${origenDinamico?.lat}, ${origenDinamico?.lng}`);

            // Verificar condiciones
            const condicionesCumplidas = this.verificarCondiciones(fase.condiciones);
            if (!condicionesCumplidas) {
                fase.estado = 'fallida';
                throw new Error(`Condiciones no cumplidas: ${fase.condiciones.join(', ')}`);
            }

            // Ejecutar lógica específica según tipo (override en subclases)
            const resultado = await this.ejecutarLogicaFase(fase, origenDinamico);

            // Marcar como completada
            fase.estado = 'completada';
            fase.turnoFin = window.turnosManager?.turnoActual || 0;

            return resultado;

        } catch (error) {
            fase.estado = 'fallida';
            this.log(`Error en fase ${indice + 1}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Ejecuta la lógica específica de una fase
     * DEBE ser implementado por subclases para cada tipo de fase
     * @param {Object} fase - Fase a ejecutar
     * @param {L.LatLng} origenDinamico - Origen calculado dinámicamente
     * @returns {Promise<Object>} Resultado
     */
    async ejecutarLogicaFase(fase, origenDinamico) {
        // Override en subclases (OrdenAtaque, OrdenMovimiento, etc.)
        this.log(`ejecutarLogicaFase() no implementado para tipo: ${fase.tipo}`);
        return { exito: true };
    }

    /**
     * Verifica si se cumplen las condiciones para ejecutar una fase
     * @param {Array<String>} condiciones - Array de condiciones a verificar
     * @returns {Boolean} true si todas las condiciones se cumplen
     */
    verificarCondiciones(condiciones) {
        if (!condiciones || condiciones.length === 0) return true;

        // Implementar verificaciones específicas
        for (const condicion of condiciones) {
            switch(condicion) {
                case 'enAlcance':
                    // Verificar si está en alcance de arma
                    // TODO: Implementar verificación real
                    break;
                case 'municionDisponible':
                    // Verificar munición
                    // TODO: Implementar verificación real
                    break;
                case 'moralSuficiente':
                    // Verificar moral > umbral
                    // TODO: Implementar verificación real
                    break;
                default:
                    this.log(`Condición desconocida: ${condicion}`);
            }
        }

        return true; // Por ahora asumir que se cumplen
    }

    /**
     * Avanza a la siguiente fase
     * @returns {Boolean} true si hay siguiente fase
     */
    avanzarFase() {
        if (this.faseActual + 1 < this.fases.length) {
            this.faseActual++;
            this.estadoFase = 'sin_iniciar';
            this.log(`Avanzando a fase ${this.faseActual + 1}/${this.fases.length}`);
            return true;
        }
        this.log('No hay más fases');
        return false;
    }

    /**
     * Inserta una fase en una posición específica
     * Útil para modificar órdenes en ejecución (ej: insertar "mantener posición")
     * @param {Number} indice - Posición donde insertar
     * @param {Object} fase - Fase a insertar
     */
    insertarFase(indice, fase) {
        this.fases.splice(indice, 0, fase);
        this.log(`Fase insertada en posición ${indice}: ${fase.tipo}`);
        this.calcularDuracionTotal();

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenModificada', {
                ordenId: this.id,
                accion: 'insertar_fase',
                indice,
                tipo: fase.tipo
            });
        }
    }

    /**
     * Elimina una fase en una posición específica
     * @param {Number} indice - Posición de la fase a eliminar
     */
    eliminarFase(indice) {
        if (indice < 0 || indice >= this.fases.length) {
            console.error(`Índice inválido: ${indice}`);
            return;
        }

        const faseEliminada = this.fases.splice(indice, 1)[0];
        this.log(`Fase eliminada en posición ${indice}: ${faseEliminada.tipo}`);
        this.calcularDuracionTotal();

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenModificada', {
                ordenId: this.id,
                accion: 'eliminar_fase',
                indice,
                tipo: faseEliminada.tipo
            });
        }
    }

    // ================================
    // FIN SISTEMA DE FASES
    // ================================

    /**
     * Logging con prefijo de orden
     */
    log(mensaje) {"""

contenido = contenido.replace(old_duracion, new_duracion)

# Escribir archivo modificado
with open(archivo, 'w', encoding='utf-8') as f:
    f.write(contenido)

print("✅ Sistema de fases agregado a OrdenBase.js")
print("   - Propiedades: fases[], faseActual, estadoFase, duracionTotal")
print("   - Métodos: agregarFase(), calcularDuracionTotal(), ejecutarFase()")
print("   - Métodos: insertarFase(), eliminarFase(), avanzarFase()")
print("   - Método: getPosicionActual() para origen dinámico")
