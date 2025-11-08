/**
 * ⏸️ ORDEN DE ESPERA - Implementación concreta
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * La unidad espera en su posición actual, puede estar en alerta o descanso
 */

class OrdenEspera extends OrdenBase {
    constructor(unidad, opciones = {}) {
        super(unidad, 'espera');

        // Duración de la espera
        this.duracion = opciones.duracion || 60; // segundos
        this.duracionTurnos = opciones.duracionTurnos || 1; // turnos alternativos

        // Modalidad
        this.modalidad = opciones.modalidad || 'alerta'; // alerta, descanso, oculto

        // Posición
        this.posicion = unidad.getLatLng ? unidad.getLatLng() : null;
        this.hexPosicion = null;

        // Recuperación
        this.recuperarMoral = opciones.recuperarMoral !== false;
        this.recuperarMunicion = opciones.recuperarMunicion || false;
        this.reorganizar = opciones.reorganizar || false;

        // Estado de espera
        this.tiempoTranscurrido = 0;
        this.turnosTranscurridos = 0;
        this.enEspera = false;

        // Bonificaciones según modalidad
        this.bonificaciones = this.calcularBonificaciones();

        // Recuperación acumulada
        this.moralRecuperado = 0;
        this.municionRecuperada = 0;

        // Visualización
        this.marcadorEspera = null;
        this.circuloAlerta = null;

        // Inicializar
        this.inicializar();
    }

    /**
     * Inicializa la orden
     */
    async inicializar() {
        // Verificar posición
        if (!this.posicion) {
            this.actualizarEstado('invalida', 'No se pudo determinar posición');
            return;
        }

        // Obtener hexágono
        this.hexPosicion = window.HexGrid.getHexAtLatLng(this.posicion);

        if (!this.hexPosicion) {
            this.actualizarEstado('invalida', 'Posición inválida');
            return;
        }

        // ✅ Verificar que está dentro del sector
        if (window.faseManager && window.faseManager.sectorLayer && typeof ValidacionesGeometricas !== 'undefined') {
            if (!ValidacionesGeometricas.puntoEnPoligono(this.posicion, window.faseManager.sectorLayer)) {
                this.actualizarEstado('invalida', 'Posición fuera del sector');
                this.log('❌ Posición fuera del sector');
                return;
            }
        }

        // Dibujar visualización
        this.dibujarEnMapa();

        this.log(`Espera ${this.modalidad}: ${this.duracion}s (${this.duracionTurnos} turnos)`);
    }

    /**
     * Calcula bonificaciones según modalidad
     */
    calcularBonificaciones() {
        const bonificaciones = {
            alerta: {
                vision: 20,          // +20% alcance visual
                reaccion: 30,        // +30% velocidad de reacción
                defensaContacto: 15, // +15% defensa si es atacado
                fatigaRecuperacion: 5  // 5% recuperación de fatiga
            },
            descanso: {
                vision: -10,         // -10% alcance visual
                reaccion: -20,       // -20% velocidad de reacción
                defensaContacto: -10,// -10% defensa si es atacado
                fatigaRecuperacion: 25, // 25% recuperación de fatiga
                moralRecuperacion: 15  // 15% recuperación de moral
            },
            oculto: {
                vision: 30,          // +30% alcance visual
                ocultamiento: 50,    // +50% dificultar detección
                reaccion: 40,        // +40% velocidad de reacción primera descarga
                defensaContacto: 25, // +25% defensa si es atacado
                fatigaRecuperacion: 10 // 10% recuperación de fatiga
            }
        };

        return bonificaciones[this.modalidad] || bonificaciones.alerta;
    }

    /**
     * Valida la orden
     */
    async validar() {
        this.mensajesValidacion = [];

        // Verificar que la unidad puede esperar
        if (this.unidad.estado === 'destruida') {
            this.mensajesValidacion.push('La unidad no puede esperar (destruida)');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Unidad destruida');
            return false;
        }

        // En modalidad descanso, no debe estar bajo fuego
        if (this.modalidad === 'descanso' && this.unidad.bajoFuego) {
            this.mensajesValidacion.push('No se puede descansar bajo fuego enemigo');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Bajo fuego');
            return false;
        }

        this.esValida = true;
        this.actualizarEstado('valida', `Espera ${this.modalidad} válida`);
        return true;
    }

    /**
     * Ejecuta la orden (espera durante X tiempo)
     */
    async ejecutar() {
        if (!this.puedeEjecutarse()) {
            console.warn('La orden no puede ejecutarse en su estado actual:', this.estado);
            return { exito: false, error: 'Estado inválido' };
        }

        this.actualizarEstado('ejecutando', 'En espera');
        this.enEspera = true;

        try {
            // Aplicar bonificaciones de modalidad
            this.aplicarBonificaciones();

            // Iniciar contador de tiempo
            const inicio = Date.now();
            const duracionMs = this.duracion * 1000;

            // Esperar duración especificada
            while (this.tiempoTranscurrido < duracionMs && this.enEspera) {
                await this.sleep(1000); // 1 segundo

                this.tiempoTranscurrido = Date.now() - inicio;

                // Proceso de recuperación
                this.procesarRecuperacion(1); // 1 segundo

                // Emitir progreso cada 5 segundos
                if (this.tiempoTranscurrido % 5000 < 1000) {
                    this.emitirProgreso();
                }
            }

            // Remover bonificaciones
            this.removerBonificaciones();

            this.enEspera = false;
            this.actualizarEstado('completada', 'Espera finalizada');

            return {
                exito: true,
                tiempoEsperado: this.tiempoTranscurrido / 1000,
                moralRecuperado: this.moralRecuperado,
                municionRecuperada: this.municionRecuperada
            };

        } catch (error) {
            console.error('Error ejecutando espera:', error);
            this.actualizarEstado('invalida', 'Error en ejecución: ' + error.message);
            return { exito: false, error: error.message };
        }
    }

    /**
     * Aplica bonificaciones de modalidad a la unidad
     */
    aplicarBonificaciones() {
        if (!this.unidad.bonificacionesActivas) {
            this.unidad.bonificacionesActivas = {};
        }

        // Aplicar cada bonificación
        for (const [tipo, valor] of Object.entries(this.bonificaciones)) {
            this.unidad.bonificacionesActivas[tipo] = {
                valor: valor,
                origen: 'orden_espera',
                modalidad: this.modalidad
            };
        }

        this.log(`Bonificaciones ${this.modalidad} aplicadas`);
    }

    /**
     * Remueve bonificaciones al terminar espera
     */
    removerBonificaciones() {
        if (!this.unidad.bonificacionesActivas) return;

        // Remover bonificaciones de espera
        for (const tipo of Object.keys(this.bonificaciones)) {
            if (this.unidad.bonificacionesActivas[tipo]?.origen === 'orden_espera') {
                delete this.unidad.bonificacionesActivas[tipo];
            }
        }

        this.log('Bonificaciones removidas');
    }

    /**
     * Procesa recuperación de moral/munición/fatiga
     */
    procesarRecuperacion(segundos) {
        // Recuperación de moral
        if (this.recuperarMoral && this.bonificaciones.moralRecuperacion) {
            const tasaRecuperacion = this.bonificaciones.moralRecuperacion / 100; // % por turno
            const recuperacionPorSegundo = tasaRecuperacion / this.duracion;
            this.moralRecuperado += recuperacionPorSegundo * segundos * 100;

            if (this.unidad.moral !== undefined) {
                this.unidad.moral = Math.min(100, this.unidad.moral + (recuperacionPorSegundo * segundos * 100));
            }
        }

        // Recuperación de munición (si se reorganiza)
        if (this.recuperarMunicion && this.reorganizar) {
            const recuperacionPorSegundo = 0.5; // 0.5% por segundo al reorganizar
            this.municionRecuperada += recuperacionPorSegundo * segundos;

            if (this.unidad.municion !== undefined) {
                this.unidad.municion = Math.min(100, this.unidad.municion + (recuperacionPorSegundo * segundos));
            }
        }

        // Reducir fatiga
        if (this.bonificaciones.fatigaRecuperacion && this.unidad.fatiga !== undefined) {
            const tasaRecuperacion = this.bonificaciones.fatigaRecuperacion / 100;
            const recuperacionPorSegundo = tasaRecuperacion / this.duracion;
            this.unidad.fatiga = Math.max(0, this.unidad.fatiga - (recuperacionPorSegundo * segundos * 100));
        }
    }

    /**
     * Emite progreso de la espera
     */
    emitirProgreso() {
        if (window.eventBus) {
            window.eventBus.emit('ordenEsperaProgreso', {
                ordenId: this.id,
                tiempoTranscurrido: this.tiempoTranscurrido / 1000,
                duracionTotal: this.duracion,
                progreso: (this.tiempoTranscurrido / (this.duracion * 1000)) * 100,
                moralRecuperado: this.moralRecuperado,
                municionRecuperada: this.municionRecuperada
            });
        }
    }

    /**
     * Interrumpe la espera (por ejemplo, si es atacado)
     */
    interrumpir(razon = 'Espera interrumpida') {
        if (!this.enEspera) return;

        this.enEspera = false;
        this.removerBonificaciones();
        this.actualizarEstado('completada', razon);

        this.log(`⚠️ ${razon}`);
    }

    /**
     * Avanza un turno (para modo por turnos)
     */
    avanzarTurno() {
        if (!this.enEspera) return;

        this.turnosTranscurridos++;

        // Procesar recuperación por turno completo
        this.procesarRecuperacion(this.duracion);

        if (this.turnosTranscurridos >= this.duracionTurnos) {
            this.interrumpir('Espera completada (turnos)');
        }
    }

    /**
     * Dibuja la orden en el mapa
     */
    dibujarEnMapa() {
        if (!window.map || !this.posicion) return;

        this.limpiarVisualizacion();

        // Icono según modalidad
        const iconos = {
            alerta: '👁️',
            descanso: '💤',
            oculto: '🤫'
        };

        // Marcador de espera
        this.marcadorEspera = L.marker(this.posicion, {
            icon: L.divIcon({
                className: 'orden-espera-marker',
                html: `<div style="
                    background: ${this.color};
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                ">${iconos[this.modalidad] || '⏸️'}</div>`,
                iconSize: [30, 30]
            }),
            interactive: false
        }).addTo(window.map);

        this.elementosVisuales.push(this.marcadorEspera);

        // Círculo de alerta (solo para modalidad alerta u oculto)
        if (this.modalidad === 'alerta' || this.modalidad === 'oculto') {
            const radio = this.modalidad === 'alerta' ? 300 : 400; // metros

            this.circuloAlerta = L.circle(this.posicion, {
                radius: radio,
                color: this.color,
                fillColor: this.color,
                fillOpacity: 0.05,
                weight: 1,
                dashArray: '5, 10',
                interactive: false
            }).addTo(window.map);

            this.elementosVisuales.push(this.circuloAlerta);
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
            duracion: this.duracion,
            duracionTurnos: this.duracionTurnos,
            modalidad: this.modalidad,
            posicion: { lat: this.posicion.lat, lng: this.posicion.lng },
            hexPosicion: this.hexPosicion,
            recuperarMoral: this.recuperarMoral,
            recuperarMunicion: this.recuperarMunicion,
            reorganizar: this.reorganizar,
            tiempoTranscurrido: this.tiempoTranscurrido,
            turnosTranscurridos: this.turnosTranscurridos,
            enEspera: this.enEspera,
            moralRecuperado: this.moralRecuperado,
            municionRecuperada: this.municionRecuperada
        };
    }

    /**
     * Override: obtener duración estimada
     */
    getDuracionEstimada() {
        return this.duracion * 1000; // ms
    }

    /**
     * Override: obtener resumen
     */
    getResumen() {
        const progreso = ((this.tiempoTranscurrido / (this.duracion * 1000)) * 100).toFixed(0);
        return `Espera ${this.modalidad} - ${progreso}% (${(this.tiempoTranscurrido / 1000).toFixed(0)}/${this.duracion}s) - ${this.estado}`;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenEspera;
}
window.OrdenEspera = OrdenEspera;

console.log('✅ OrdenEspera.js cargado - Sistema de Espera V2');
