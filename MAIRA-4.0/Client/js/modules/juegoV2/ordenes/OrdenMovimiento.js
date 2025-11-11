/**
 * 🚶 ORDEN DE MOVIMIENTO - Implementación concreta
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * Maneja el movimiento de unidades sobre el hexgrid con pathfinding A*
 */

class OrdenMovimiento extends OrdenBase {
    constructor(unidad, destino, opciones = {}) {
        super(unidad, 'movimiento');

        // Destino
        this.destino = destino; // {lat, lng} o hexágono {q, r, s}
        this.hexDestino = null;
        this.hexOrigen = null;

        // Ruta
        this.ruta = null; // Array de hexágonos
        this.rutaLatLngs = null; // Array de coordenadas Leaflet
        this.distanciaTotal = 0;
        this.tiempoEstimado = 0;

        // Opciones
        this.opciones = {
            mostrarRuta: opciones.mostrarRuta !== false,
            considerarTerreno: opciones.considerarTerreno !== false,
            evitarEnemigos: opciones.evitarEnemigos !== false,
            ...opciones
        };

        // Visualización
        this.lineaRuta = null;
        this.marcadorDestino = null;
        this.decoradores = [];

        // Estado de animación
        this.animacion = {
            enCurso: false,
            pausada: false,
            paso: 0,
            velocidad: 1.0 // Multiplicador de velocidad
        };

        // Inicializar
        this.inicializar();
    }

    /**
     * Inicializa la orden
     */
    async inicializar() {
        // Convertir destino a hexágono si es necesario
        if (this.destino.lat && this.destino.lng) {
            this.hexDestino = window.HexGrid.pixelToHex(this.destino);
        } else if (this.destino.q !== undefined) {
            this.hexDestino = this.destino;
        }

        // Obtener hexágono origen
        if (this.unidad.hexActual) {
            this.hexOrigen = this.unidad.hexActual;
        } else if (this.unidad.getLatLng) {
            this.hexOrigen = window.HexGrid.pixelToHex(this.unidad.getLatLng());
        }

        // Verificar que tenemos lo necesario
        if (!this.hexDestino || !this.hexOrigen) {
            this.actualizarEstado('invalida', 'No se pudo determinar origen o destino');
            return;
        }

        // ✅ VALIDACIÓN: Verificar que el destino esté dentro del sector
        if (window.faseManager && window.faseManager.sectorLayer && typeof ValidacionesGeometricas !== 'undefined') {
            // Obtener coordenadas del destino
            const hexKey = `${this.hexDestino.q},${this.hexDestino.r},${this.hexDestino.s}`;
            const hexData = window.HexGrid.grid.get(hexKey);

            if (hexData && hexData.center) {
                const destinoLatLng = L.latLng(hexData.center);

                if (!ValidacionesGeometricas.puntoEnPoligono(destinoLatLng, window.faseManager.sectorLayer)) {
                    this.actualizarEstado('invalida', 'El destino está fuera del sector de operaciones');
                    this.log('❌ Destino fuera del sector');
                    return;
                }
            }
        }

        // Dibujar visualización inicial
        if (this.opciones.mostrarRuta) {
            this.dibujarEnMapa();
        }

        // Calcular ruta automáticamente
        await this.calcularRuta();
    }

    /**
     * Calcula la ruta usando pathfinding
     */
    async calcularRuta() {
        if (!window.pathfinding) {
            console.error('Sistema de pathfinding no disponible');
            this.actualizarEstado('invalida', 'Sistema de pathfinding no disponible');
            return false;
        }

        try {
            // Obtener tipo de unidad
            const tipoUnidad = this.unidad.tipoUnidad || this.inferirTipoUnidad();

            // Calcular ruta
            this.actualizarEstado('validando', 'Calculando ruta...');

            this.ruta = await window.pathfinding.calcularRuta(
                this.hexOrigen,
                this.hexDestino,
                tipoUnidad,
                this.opciones
            );

            if (!this.ruta || this.ruta.length === 0) {
                this.actualizarEstado('invalida', 'No se encontró ruta al destino');
                return false;
            }

            // Convertir ruta a coordenadas Leaflet
            this.rutaLatLngs = this.ruta.map(hex => {
                const hexKey = `${hex.q},${hex.r},${hex.s}`;
                const hexData = window.HexGrid.grid.get(hexKey);
                return hexData ? hexData.center : null;
            }).filter(coord => coord !== null);

            // Calcular métricas
            this.distanciaTotal = window.pathfinding.calcularDistanciaRuta(this.ruta);
            this.tiempoEstimado = window.pathfinding.calcularTiempoRuta(this.ruta, tipoUnidad);

            this.log(`Ruta calculada: ${this.ruta.length} hexágonos, ${(this.distanciaTotal/1000).toFixed(2)}km, ${Math.ceil(this.tiempoEstimado/60)} min`);

            // Actualizar visualización
            if (this.opciones.mostrarRuta) {
                this.actualizarVisualizacion();
            }

            return true;

        } catch (error) {
            console.error('Error calculando ruta:', error);
            this.actualizarEstado('invalida', 'Error al calcular ruta: ' + error.message);
            return false;
        }
    }

    /**
     * Infiere el tipo de unidad desde su SIDC
     */
    inferirTipoUnidad() {
        if (!this.unidad.sidc) return 'infanteria';

        const sidc = this.unidad.sidc;
        // Posición 10 del SIDC indica tipo de equipo
        const tipo = sidc.charAt(10);

        switch(tipo) {
            case 'A': // Armor (blindados)
                return 'blindado';
            case 'U': // Utility vehicle
            case 'E': // Equipment
                return 'vehiculo';
            case 'R': // Rotary wing
            case 'F': // Fixed wing
                return 'aereo';
            default:
                return 'infanteria';
        }
    }

    /**
     * Valida la orden
     */
    async validar() {
        this.mensajesValidacion = [];

        // Verificar que la ruta fue calculada
        if (!this.ruta || this.ruta.length === 0) {
            this.mensajesValidacion.push('No hay ruta calculada');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Sin ruta');
            return false;
        }

        // Verificar que la unidad puede moverse
        if (this.unidad.estado === 'inmovilizada') {
            this.mensajesValidacion.push('La unidad está inmovilizada');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Unidad inmovilizada');
            return false;
        }

        // Verificar que tiene suficiente movimiento
        if (this.unidad.movimientoRestante !== undefined) {
            if (this.unidad.movimientoRestante < this.ruta.length) {
                this.mensajesValidacion.push('Movimiento insuficiente');
                this.esValida = false;
                this.actualizarEstado('invalida', 'Sin movimiento');
                return false;
            }
        }

        // ✅ VALIDACIÓN: Verificar que toda la ruta esté dentro del sector
        if (window.faseManager && window.faseManager.sectorLayer && typeof ValidacionesGeometricas !== 'undefined') {
            for (let i = 0; i < this.ruta.length; i++) {
                const hex = this.ruta[i];
                const hexKey = `${hex.q},${hex.r},${hex.s}`;
                const hexData = window.HexGrid.grid.get(hexKey);

                if (hexData && hexData.center) {
                    const puntoLatLng = L.latLng(hexData.center);

                    if (!ValidacionesGeometricas.puntoEnPoligono(puntoLatLng, window.faseManager.sectorLayer)) {
                        this.mensajesValidacion.push(`Hexágono ${i + 1}/${this.ruta.length} está fuera del sector`);
                        this.esValida = false;
                        this.actualizarEstado('invalida', 'Ruta sale del sector de operaciones');
                        this.log(`❌ Ruta sale del sector en hexágono ${i + 1}`);
                        return false;
                    }
                }
            }
            this.log('✅ Ruta completamente dentro del sector');
        }

        // TODO: Verificar zona de control enemiga
        // TODO: Verificar restricciones de fase

        this.esValida = true;
        this.actualizarEstado('valida', `Ruta válida de ${this.ruta.length} hexágonos`);
        return true;
    }

    /**
     * Ejecuta la orden (mueve la unidad)
     */
    async ejecutar() {
        if (!this.puedeEjecutarse()) {
            console.warn('La orden no puede ejecutarse en su estado actual:', this.estado);
            return { exito: false, error: 'Estado inválido' };
        }

        this.actualizarEstado('ejecutando', 'Iniciando movimiento');

        try {
            // Animar movimiento
            await this.animarMovimiento();

            // Actualizar posición final
            this.actualizarPosicionUnidad();

            // Marcar como completada
            this.actualizarEstado('completada', 'Movimiento finalizado');

            return {
                exito: true,
                hexFinal: this.hexDestino,
                distanciaRecorrida: this.distanciaTotal,
                tiempoEmpleado: this.tiempoEstimado
            };

        } catch (error) {
            console.error('Error ejecutando movimiento:', error);
            this.actualizarEstado('invalida', 'Error en ejecución: ' + error.message);
            return { exito: false, error: error.message };
        }
    }

    /**
     * Anima el movimiento de la unidad a lo largo de la ruta
     */
    async animarMovimiento() {
        if (!this.ruta || this.ruta.length < 2) return;

        this.animacion.enCurso = true;
        this.animacion.paso = 0;

        const duracionPorHex = 500 / this.animacion.velocidad; // 500ms por hexágono

        for (let i = 0; i < this.ruta.length; i++) {
            if (!this.animacion.enCurso) break;

            // Esperar si está pausada
            while (this.animacion.pausada) {
                await this.sleep(100);
            }

            this.animacion.paso = i;

            // Obtener posición del hexágono
            const hex = this.ruta[i];
            const hexKey = `${hex.q},${hex.r},${hex.s}`;
            const hexData = window.HexGrid.grid.get(hexKey);

            if (hexData && hexData.center) {
                // Mover la unidad visualmente
                if (this.unidad.setLatLng) {
                    this.unidad.setLatLng(hexData.center);
                } else if (this.unidad.marker && this.unidad.marker.setLatLng) {
                    this.unidad.marker.setLatLng(hexData.center);
                }

                // Actualizar hexágono actual
                this.unidad.hexActual = hex;

                // Emit evento de progreso
                if (window.eventBus) {
                    window.eventBus.emit('ordenMovimientoProgreso', {
                        ordenId: this.id,
                        paso: i,
                        total: this.ruta.length,
                        progreso: (i / this.ruta.length) * 100
                    });
                }
            }

            // Esperar antes del siguiente paso
            await this.sleep(duracionPorHex);
        }

        this.animacion.enCurso = false;
    }

    /**
     * Actualiza la posición final de la unidad
     */
    actualizarPosicionUnidad() {
        if (!this.hexDestino) return;

        // Actualizar hexágono actual
        this.unidad.hexActual = this.hexDestino;

        // Actualizar posición en el mapa
        const hexKey = `${this.hexDestino.q},${this.hexDestino.r},${this.hexDestino.s}`;
        const hexData = window.HexGrid.grid.get(hexKey);

        if (hexData && hexData.center) {
            if (this.unidad.setLatLng) {
                this.unidad.setLatLng(hexData.center);
            } else if (this.unidad.marker && this.unidad.marker.setLatLng) {
                this.unidad.marker.setLatLng(hexData.center);
            }
        }

        // Reducir movimiento restante
        if (this.unidad.movimientoRestante !== undefined) {
            this.unidad.movimientoRestante -= this.ruta.length;
        }
    }

    /**
     * Dibuja la orden en el mapa
     */
    dibujarEnMapa() {
        if (!window.map) return;

        // Limpiar visualización anterior
        this.limpiarVisualizacion();

        // Marcador de destino
        if (this.destino.lat && this.destino.lng) {
            this.marcadorDestino = L.marker([this.destino.lat, this.destino.lng], {
                icon: L.divIcon({
                    className: 'orden-destino-marker',
                    html: `<div style="background: ${this.color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
                    iconSize: [20, 20]
                }),
                interactive: false
            }).addTo(window.map);

            this.elementosVisuales.push(this.marcadorDestino);
        }
    }

    /**
     * Actualiza la visualización con la ruta calculada
     */
    actualizarVisualizacion() {
        if (!this.rutaLatLngs || this.rutaLatLngs.length === 0) return;

        // Remover línea anterior
        if (this.lineaRuta) {
            window.map.removeLayer(this.lineaRuta);
        }

        // Dibujar línea de ruta
        this.lineaRuta = L.polyline(this.rutaLatLngs, {
            color: this.color,
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
            interactive: false
        }).addTo(window.map);

        this.elementosVisuales.push(this.lineaRuta);

        // Agregar decorador con flechas
        if (typeof L.polylineDecorator !== 'undefined') {
            const decorador = L.polylineDecorator(this.lineaRuta, {
                patterns: [{
                    offset: 25,
                    repeat: 50,
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 10,
                        polygon: false,
                        pathOptions: {
                            stroke: true,
                            color: this.color,
                            weight: 2
                        }
                    })
                }]
            }).addTo(window.map);

            this.decoradores.push(decorador);
            this.elementosVisuales.push(decorador);
        }
    }

    /**
     * Pausa la animación
     */
    pausar() {
        this.animacion.pausada = true;
        this.log('Animación pausada');
    }

    /**
     * Reanuda la animación
     */
    reanudar() {
        this.animacion.pausada = false;
        this.log('Animación reanudada');
    }

    /**
     * Establece la velocidad de animación
     */
    setVelocidadAnimacion(multiplicador) {
        this.animacion.velocidad = multiplicador;
        this.log(`Velocidad de animación: ${multiplicador}x`);
    }

    /**
     * Helper para sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Serializa la orden
     */
    serializar() {
        return {
            ...super.serializar(),
            destino: this.destino,
            hexDestino: this.hexDestino,
            hexOrigen: this.hexOrigen,
            ruta: this.ruta,
            distanciaTotal: this.distanciaTotal,
            tiempoEstimado: this.tiempoEstimado
        };
    }

    /**
     * Override: obtener duración estimada
     */
    getDuracionEstimada() {
        return this.tiempoEstimado * 1000; // Convertir a ms
    }

    /**
     * Override: obtener resumen
     */
    getResumen() {
        const distKm = (this.distanciaTotal / 1000).toFixed(2);
        const tiempoMin = Math.ceil(this.tiempoEstimado / 60);
        return `Movimiento a destino - ${distKm}km (~${tiempoMin} min) - ${this.estado}`;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenMovimiento;
}
window.OrdenMovimiento = OrdenMovimiento;

console.log('✅ OrdenMovimiento.js cargado - Sistema de Movimiento V2');
