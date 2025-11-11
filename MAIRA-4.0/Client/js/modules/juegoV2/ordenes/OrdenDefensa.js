/**
 * 🛡️ ORDEN DE DEFENSA - Implementación concreta
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * Postura defensiva que otorga bonificaciones y crea zona de control
 */

class OrdenDefensa extends OrdenBase {
    constructor(unidad, posicion, opciones = {}) {
        super(unidad, 'defensa');

        // Posición defensiva (puede ser la actual de la unidad)
        this.posicion = posicion || (unidad.getLatLng ? unidad.getLatLng() : null);
        this.hexPosicion = null;

        // Características de la defensa
        this.tipoDefensa = opciones.tipoDefensa || 'hasty'; // hasty, prepared, fortified
        this.orientacion = opciones.orientacion || null; // dirección principal de defensa (en grados)
        this.duracionTurnos = opciones.duracionTurnos || 3; // duración en turnos
        this.turnosRestantes = this.duracionTurnos;

        // Bonificaciones
        this.bonificaciones = {
            defensaBase: this.getBonificacionDefensa(),
            alcanceVision: this.getBonificacionVision(),
            primeraDescarga: this.getBonificacionPrimeraDescarga()
        };

        // Zona de control
        this.radioControl = opciones.radioControl || 200; // metros
        this.zonaControl = null; // círculo Leaflet
        this.zonaControlHex = []; // hexágonos dentro de zona de control

        // Visualización
        this.marcadorPosicion = null;
        this.lineaOrientacion = null;
        this.elementosVisuales = [];

        // Estado
        this.preparacionCompletada = false;
        this.interrumpida = false;

        // Inicializar
        this.inicializar();
    }

    /**
     * Inicializa la orden
     */
    async inicializar() {
        // Verificar posición
        if (!this.posicion) {
            this.actualizarEstado('invalida', 'No se especificó posición defensiva');
            return;
        }

        // Obtener hexágono
        this.hexPosicion = window.HexGrid.pixelToHex(this.posicion);

        if (!this.hexPosicion) {
            this.actualizarEstado('invalida', 'Posición inválida');
            return;
        }

        // ✅ Verificar que está dentro del sector
        if (window.faseManager && window.faseManager.sectorLayer && typeof ValidacionesGeometricas !== 'undefined') {
            if (!ValidacionesGeometricas.puntoEnPoligono(this.posicion, window.faseManager.sectorLayer)) {
                this.actualizarEstado('invalida', 'Posición defensiva fuera del sector');
                this.log('❌ Posición fuera del sector');
                return;
            }
        }

        // Calcular zona de control
        this.calcularZonaControl();

        // Dibujar visualización
        this.dibujarEnMapa();

        this.log(`Defensa ${this.tipoDefensa}: +${this.bonificaciones.defensaBase}% defensa, ${this.duracionTurnos} turnos`);
    }

    /**
     * Obtiene bonificación de defensa según tipo
     */
    getBonificacionDefensa() {
        const bonificaciones = {
            hasty: 15,      // Defensa apresurada: +15%
            prepared: 35,   // Defensa preparada: +35%
            fortified: 60   // Defensa fortificada: +60%
        };

        return bonificaciones[this.tipoDefensa] || 15;
    }

    /**
     * Obtiene bonificación de visión según tipo
     */
    getBonificacionVision() {
        const bonificaciones = {
            hasty: 10,      // +10% alcance visual
            prepared: 25,   // +25% alcance visual
            fortified: 40   // +40% alcance visual
        };

        return bonificaciones[this.tipoDefensa] || 10;
    }

    /**
     * Obtiene bonificación de primera descarga (fuego desde posiciones preparadas)
     */
    getBonificacionPrimeraDescarga() {
        const bonificaciones = {
            hasty: 5,       // +5% primera descarga
            prepared: 15,   // +15% primera descarga
            fortified: 30   // +30% primera descarga
        };

        return bonificaciones[this.tipoDefensa] || 5;
    }

    /**
     * Calcula la zona de control alrededor de la posición
     */
    calcularZonaControl() {
        if (!this.hexPosicion || !window.HexGrid) {
            return;
        }

        this.zonaControlHex = [];

        // Obtener todos los hexágonos dentro del radio
        window.HexGrid.grid.forEach((hexData, hexKey) => {
            const distancia = this.posicion.distanceTo(hexData.center);

            if (distancia <= this.radioControl) {
                this.zonaControlHex.push({
                    q: hexData.q,
                    r: hexData.r,
                    s: hexData.s,
                    distancia: distancia
                });
            }
        });

        this.log(`Zona de control: ${this.zonaControlHex.length} hexágonos`);
    }

    /**
     * Valida la orden
     */
    async validar() {
        this.mensajesValidacion = [];

        // Verificar que la unidad puede defender
        if (this.unidad.estado === 'inmovilizada' || this.unidad.estado === 'destruida') {
            this.mensajesValidacion.push('La unidad no puede tomar postura defensiva');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Unidad no disponible');
            return false;
        }

        // Verificar munición (defensa requiere munición para fuego defensivo)
        if (this.unidad.municion !== undefined && this.unidad.municion < 10) {
            this.mensajesValidacion.push('Munición insuficiente para sostener defensa');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Sin munición');
            return false;
        }

        // Verificar que no está en movimiento
        if (this.unidad.enMovimiento) {
            this.mensajesValidacion.push('La unidad no puede defender mientras se mueve');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Unidad en movimiento');
            return false;
        }

        this.esValida = true;
        this.actualizarEstado('valida', `Defensa ${this.tipoDefensa} válida`);
        return true;
    }

    /**
     * Ejecuta la orden (establece postura defensiva)
     */
    async ejecutar() {
        if (!this.puedeEjecutarse()) {
            console.warn('La orden no puede ejecutarse en su estado actual:', this.estado);
            return { exito: false, error: 'Estado inválido' };
        }

        this.actualizarEstado('ejecutando', 'Estableciendo postura defensiva');

        try {
            // Animar transición a defensa
            await this.animarPreparacionDefensiva();

            // Aplicar bonificaciones a la unidad
            this.aplicarBonificaciones();

            // Marcar como preparación completada
            this.preparacionCompletada = true;
            this.turnosRestantes = this.duracionTurnos;

            this.actualizarEstado('completada', 'Postura defensiva establecida');

            return {
                exito: true,
                tipoDefensa: this.tipoDefensa,
                bonificaciones: this.bonificaciones,
                zonaControl: this.zonaControlHex.length,
                turnosRestantes: this.turnosRestantes
            };

        } catch (error) {
            console.error('Error ejecutando defensa:', error);
            this.actualizarEstado('invalida', 'Error en ejecución: ' + error.message);
            return { exito: false, error: error.message };
        }
    }

    /**
     * Anima la preparación defensiva
     */
    async animarPreparacionDefensiva() {
        const duracion = this.tipoDefensa === 'hasty' ? 500 :
                        this.tipoDefensa === 'prepared' ? 1500 : 3000;

        // Efecto visual de preparación
        if (this.marcadorPosicion) {
            // Animar pulsación
            for (let i = 0; i < 3; i++) {
                if (this.marcadorPosicion._icon) {
                    this.marcadorPosicion._icon.style.transform = 'scale(1.2)';
                }
                await this.sleep(duracion / 6);
                if (this.marcadorPosicion._icon) {
                    this.marcadorPosicion._icon.style.transform = 'scale(1.0)';
                }
                await this.sleep(duracion / 6);
            }
        }

        await this.sleep(duracion);
    }

    /**
     * Aplica bonificaciones a la unidad
     */
    aplicarBonificaciones() {
        if (!this.unidad.bonificacionesActivas) {
            this.unidad.bonificacionesActivas = {};
        }

        this.unidad.bonificacionesActivas.defensa = {
            valor: this.bonificaciones.defensaBase,
            origen: 'orden_defensa',
            turnosRestantes: this.turnosRestantes
        };

        this.unidad.bonificacionesActivas.vision = {
            valor: this.bonificaciones.alcanceVision,
            origen: 'orden_defensa',
            turnosRestantes: this.turnosRestantes
        };

        this.unidad.bonificacionesActivas.primeraDescarga = {
            valor: this.bonificaciones.primeraDescarga,
            origen: 'orden_defensa',
            usada: false
        };

        this.log('Bonificaciones aplicadas a unidad');
    }

    /**
     * Reduce turnos restantes (llamar al inicio de cada turno)
     */
    reducirTurno() {
        if (this.turnosRestantes > 0) {
            this.turnosRestantes--;

            if (this.turnosRestantes === 0) {
                this.finalizarDefensa();
            }
        }
    }

    /**
     * Finaliza la postura defensiva
     */
    finalizarDefensa() {
        // Remover bonificaciones
        if (this.unidad.bonificacionesActivas) {
            delete this.unidad.bonificacionesActivas.defensa;
            delete this.unidad.bonificacionesActivas.vision;
            delete this.unidad.bonificacionesActivas.primeraDescarga;
        }

        this.actualizarEstado('completada', 'Defensa finalizada');
        this.limpiarVisualizacion();

        this.log('Postura defensiva terminada');
    }

    /**
     * Dibuja la orden en el mapa
     */
    dibujarEnMapa() {
        if (!window.map || !this.posicion) return;

        this.limpiarVisualizacion();

        // Marcador de posición defensiva
        this.marcadorPosicion = L.marker(this.posicion, {
            icon: L.divIcon({
                className: 'orden-defensa-marker',
                html: `<div style="
                    background: ${this.color};
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                ">🛡️</div>`,
                iconSize: [30, 30]
            }),
            interactive: false
        }).addTo(window.map);

        this.elementosVisuales.push(this.marcadorPosicion);

        // Zona de control (círculo)
        this.zonaControl = L.circle(this.posicion, {
            radius: this.radioControl,
            color: this.color,
            fillColor: this.color,
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10',
            interactive: false
        }).addTo(window.map);

        this.elementosVisuales.push(this.zonaControl);

        // Línea de orientación (si está especificada)
        if (this.orientacion !== null) {
            const distancia = this.radioControl * 1.5;
            const rad = (this.orientacion * Math.PI) / 180;
            const lat2 = this.posicion.lat + (distancia / 111000) * Math.cos(rad);
            const lng2 = this.posicion.lng + (distancia / (111000 * Math.cos(this.posicion.lat * Math.PI / 180))) * Math.sin(rad);

            this.lineaOrientacion = L.polyline(
                [this.posicion, [lat2, lng2]],
                {
                    color: this.color,
                    weight: 3,
                    dashArray: '10, 5',
                    interactive: false
                }
            ).addTo(window.map);

            this.elementosVisuales.push(this.lineaOrientacion);
        }
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
            posicion: { lat: this.posicion.lat, lng: this.posicion.lng },
            hexPosicion: this.hexPosicion,
            tipoDefensa: this.tipoDefensa,
            orientacion: this.orientacion,
            duracionTurnos: this.duracionTurnos,
            turnosRestantes: this.turnosRestantes,
            bonificaciones: this.bonificaciones,
            radioControl: this.radioControl,
            zonaControlHex: this.zonaControlHex,
            preparacionCompletada: this.preparacionCompletada
        };
    }

    /**
     * Override: obtener duración estimada
     */
    getDuracionEstimada() {
        const tiempoPreparacion = this.tipoDefensa === 'hasty' ? 500 :
                                 this.tipoDefensa === 'prepared' ? 1500 : 3000;
        return tiempoPreparacion;
    }

    /**
     * Override: obtener resumen
     */
    getResumen() {
        return `Defensa ${this.tipoDefensa} (+${this.bonificaciones.defensaBase}%) - ${this.turnosRestantes}/${this.duracionTurnos} turnos - ${this.estado}`;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenDefensa;
}
window.OrdenDefensa = OrdenDefensa;

console.log('✅ OrdenDefensa.js cargado - Sistema de Defensa V2');
