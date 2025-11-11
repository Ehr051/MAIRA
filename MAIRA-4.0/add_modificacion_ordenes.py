#!/usr/bin/env python3
archivo = "Client/js/modules/juegoV2/core/GestorOrdenesV2.js"

with open(archivo, 'r', encoding='utf-8') as f:
    contenido = f.read()

old_eliminar = """    /**
     * Elimina una orden específica
     */
    eliminarOrden(ordenId) {
        // TODO: Implementar eliminación de orden
        console.log(`🗑️ Eliminar orden ${ordenId}`);
    }

    /**
     * Obtiene todas las órdenes activas
     */
    obtenerOrdenesActivas() {"""

new_eliminar = """    /**
     * Elimina una orden específica
     */
    eliminarOrden(ordenId) {
        // TODO: Implementar eliminación de orden
        console.log(`🗑️ Eliminar orden ${ordenId}`);
    }

    /**
     * 🆕 Modifica una orden existente - Permite cambiar desde/hasta, insertar fases intermedias
     */
    modificarOrden(ordenId, modificaciones) {
        console.log(`🔧 Modificar orden ${ordenId}`, modificaciones);
        let ordenEncontrada = null, equipoOrden = null;

        for (const [equipo, queue] of this.ordenesQueues.entries()) {
            const orden = queue.ordenes.find(o => o.id === ordenId);
            if (orden) { ordenEncontrada = orden; equipoOrden = equipo; break; }
        }

        if (!ordenEncontrada) return console.error(`❌ Orden ${ordenId} no encontrada`);

        // 1. Cambiar turno inicio
        if (modificaciones.turnoInicio !== undefined) {
            ordenEncontrada.turnoInicio = modificaciones.turnoInicio;
        }

        // 2. Insertar fase (ej: mantener posición entre marcha y ataque)
        if (modificaciones.insertarFase) {
            const { indice, fase } = modificaciones.insertarFase;
            ordenEncontrada.insertarFase && ordenEncontrada.insertarFase(indice, fase);
        }

        // 3. Modificar fase existente
        if (modificaciones.modificarFase) {
            const { indice, cambios } = modificaciones.modificarFase;
            if (ordenEncontrada.fases?.[indice]) {
                Object.assign(ordenEncontrada.fases[indice], cambios);
                ordenEncontrada.calcularDuracionTotal?.();
            }
        }

        // 4. Eliminar fase
        if (modificaciones.eliminarFase !== undefined) {
            ordenEncontrada.eliminarFase?.(modificaciones.eliminarFase);
        }

        // 5. Nuevo destino
        if (modificaciones.nuevoDestino) {
            ordenEncontrada.destino = modificaciones.nuevoDestino;
            ordenEncontrada.inicializar?.();
        }

        window.eventBus?.emit('ordenModificada', { ordenId, equipo: equipoOrden, modificaciones });
        this.panelCoordinacion?.renderizar();
        return true;
    }

    /**
     * 🆕 Cancela una orden - Detiene ejecución si está corriendo
     */
    cancelarOrden(ordenId, motivo = 'Cancelada por jugador') {
        console.log(`❌ Cancelar orden ${ordenId}: ${motivo}`);
        let ordenEncontrada = null, queueOrden = null, equipoOrden = null;

        for (const [equipo, queue] of this.ordenesQueues.entries()) {
            const orden = queue.ordenes.find(o => o.id === ordenId);
            if (orden) { ordenEncontrada = orden; equipoOrden = equipo; queueOrden = queue; break; }
        }

        if (!ordenEncontrada) return console.error(`❌ Orden ${ordenId} no encontrada`);

        ordenEncontrada.cancelar?.();

        if (ordenEncontrada.estado === 'ejecutando' && ordenEncontrada.faseActual >= 0) {
            ordenEncontrada.fases?.[ordenEncontrada.faseActual] && (ordenEncontrada.fases[ordenEncontrada.faseActual].estado = 'fallida');
        }

        const indice = queueOrden.ordenes.indexOf(ordenEncontrada);
        indice !== -1 && queueOrden.ordenes.splice(indice, 1);

        window.eventBus?.emit('ordenCancelada', { ordenId, equipo: equipoOrden, motivo });
        this.panelCoordinacion?.renderizar();
        return true;
    }

    /**
     * Obtiene todas las órdenes activas
     */
    obtenerOrdenesActivas() {"""

contenido = contenido.replace(old_eliminar, new_eliminar)

with open(archivo, 'w', encoding='utf-8') as f:
    f.write(contenido)

print("✅ Métodos agregados a GestorOrdenesV2.js")
