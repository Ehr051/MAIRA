/**
 * ⚔️ ORDEN DE ATAQUE - Implementación concreta
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * Maneja el ataque de unidades enemigas con cálculo de línea de vista
 */

class OrdenAtaque extends OrdenBase {
    constructor(unidad, objetivo, opciones = {}) {
        super(unidad, 'ataque');

        // Objetivo
        this.objetivo = objetivo; // Unidad enemiga o posición
        this.esUnidad = objetivo && objetivo.id !== undefined;

        // Cálculos
        this.distancia = 0;
        this.tieneLineaVista = false;
        this.enRango = false;
        this.probabilidadImpacto = 0;
        this.dañoEstimado = 0;

        // Opciones
        this.opciones = {
            fuegoDirecto: opciones.fuegoDirecto !== false,
            fuegoContinuo: opciones.fuegoContinuo || false,
            municionGastar: opciones.municionGastar || 1,
            ...opciones
        };

        // Visualización
        this.lineaAtaque = null;
        this.efectosVisuales = [];

        // Resultado del ataque
        this.resultado = null;

        // Inicializar
        this.inicializar();
    }

    /**
     * Inicializa la orden
     */
    async inicializar() {
        // Verificar que el objetivo es válido
        if (!this.objetivo) {
            this.actualizarEstado('invalida', 'Objetivo no especificado');
            return;
        }

        // Verificar que es un objetivo enemigo
        if (this.esUnidad) {
            if (this.objetivo.equipo === this.unidad.equipo) {
                this.actualizarEstado('invalida', 'No se puede atacar unidades amigas');
                return;
            }
        }

        // Calcular datos del ataque
        await this.calcularDatosAtaque();

        // Dibujar visualización
        this.dibujarEnMapa();
    }

    /**
     * Calcula los datos necesarios para el ataque
     */
    async calcularDatosAtaque() {
        // Calcular distancia
        const posUnidad = this.unidad.getLatLng ? this.unidad.getLatLng() : this.unidad.latlng;
        const posObjetivo = this.objetivo.getLatLng ? this.objetivo.getLatLng() : this.objetivo.latlng;

        if (!posUnidad || !posObjetivo) {
            this.actualizarEstado('invalida', 'No se puede determinar posiciones');
            return false;
        }

        this.distancia = window.map.distance(posUnidad, posObjetivo);

        // Verificar rango
        const rangoMax = this.unidad.rangoAtaque || this.getRangoSegunTipo();
        this.enRango = this.distancia <= rangoMax;

        if (!this.enRango) {
            this.actualizarEstado('invalida', `Objetivo fuera de rango (${(this.distancia/1000).toFixed(2)}km > ${(rangoMax/1000).toFixed(2)}km)`);
            return false;
        }

        // Calcular línea de vista
        await this.calcularLineaVista(posUnidad, posObjetivo);

        // Calcular probabilidad de impacto
        this.probabilidadImpacto = this.calcularProbabilidadImpacto();

        // Calcular daño estimado
        this.dañoEstimado = this.calcularDañoEstimado();

        this.log(`Ataque calculado: ${(this.distancia/1000).toFixed(2)}km, LOS: ${this.tieneLineaVista}, P(hit): ${this.probabilidadImpacto.toFixed(2)}`);

        return true;
    }

    /**
     * Calcula línea de vista entre unidad y objetivo
     */
    async calcularLineaVista(posUnidad, posObjetivo) {
        // Si no se requiere fuego directo, siempre tiene LOS (fuego indirecto)
        if (!this.opciones.fuegoDirecto) {
            this.tieneLineaVista = true;
            return true;
        }

        // Obtener hexágonos
        const hexUnidad = window.HexGrid.pixelToHex(posUnidad);
        const hexObjetivo = window.HexGrid.pixelToHex(posObjetivo);

        if (!hexUnidad || !hexObjetivo) {
            this.tieneLineaVista = false;
            return false;
        }

        // Calcular LOS usando raycast sobre hexgrid
        this.tieneLineaVista = this.raycastLOS(hexUnidad, hexObjetivo);

        return this.tieneLineaVista;
    }

    /**
     * Raycast simple para LOS entre hexágonos
     */
    raycastLOS(hexInicio, hexFin) {
        // Implementación simplificada
        // TODO: Implementar raycast completo considerando elevación y vegetación

        const distancia = this.heuristicaHex(hexInicio, hexFin);

        // Por ahora, LOS bloqueada solo si hay muchos hexágonos con vegetación densa
        let hexagonosBloqueantes = 0;
        const umbral = Math.floor(distancia * 0.7); // 70% de la distancia

        // Interpolar hexágonos entre inicio y fin
        for (let i = 1; i < distancia; i++) {
            const t = i / distancia;
            const hexIntermedio = this.interpolarHex(hexInicio, hexFin, t);
            const hexKey = `${hexIntermedio.q},${hexIntermedio.r},${hexIntermedio.s}`;
            const hexData = window.HexGrid.grid.get(hexKey);

            if (hexData) {
                // Vegetación densa bloquea LOS
                if (hexData.vegetacion === 'bosque_denso') {
                    hexagonosBloqueantes++;
                }

                // Edificios/obstáculos también bloquean
                if (hexData.edificio || hexData.obstaculo) {
                    hexagonosBloqueantes += 2;
                }
            }
        }

        return hexagonosBloqueantes < umbral;
    }

    /**
     * Interpola entre dos hexágonos
     */
    interpolarHex(hexA, hexB, t) {
        const q = Math.round(hexA.q + (hexB.q - hexA.q) * t);
        const r = Math.round(hexA.r + (hexB.r - hexA.r) * t);
        const s = -q - r; // s = -(q + r)

        return { q, r, s };
    }

    /**
     * Heurística de distancia en hexágonos
     */
    heuristicaHex(hexA, hexB) {
        return (Math.abs(hexA.q - hexB.q) +
                Math.abs(hexA.r - hexB.r) +
                Math.abs(hexA.s - hexB.s)) / 2;
    }

    /**
     * Obtiene rango según tipo de unidad
     */
    getRangoSegunTipo() {
        if (!this.unidad.sidc) return 1000; // 1km por defecto

        const sidc = this.unidad.sidc;
        const tipo = sidc.charAt(10);

        switch(tipo) {
            case 'A': // Armor (tanques)
                return 3000; // 3km
            case 'F': // Field Artillery
                return 20000; // 20km
            case 'I': // Infantry
                return 500; // 500m
            default:
                return 1000;
        }
    }

    /**
     * Calcula probabilidad de impacto
     */
    calcularProbabilidadImpacto() {
        let prob = 0.7; // Base 70%

        // Modificador por distancia
        const rangoMax = this.unidad.rangoAtaque || this.getRangoSegunTipo();
        const factorDistancia = 1 - (this.distancia / rangoMax);
        prob *= (0.5 + 0.5 * factorDistancia); // Entre 50% y 100% del base

        // Modificador por LOS
        if (!this.tieneLineaVista) {
            prob *= 0.3; // -70% si no hay LOS
        }

        // Modificador por cobertura del objetivo
        if (this.objetivo.cobertura) {
            switch(this.objetivo.cobertura) {
                case 'total':
                    prob *= 0.2;
                    break;
                case 'pesada':
                    prob *= 0.4;
                    break;
                case 'ligera':
                    prob *= 0.7;
                    break;
            }
        }

        // Modificador por estado de la unidad atacante
        if (this.unidad.moral) {
            prob *= (this.unidad.moral / 100);
        }

        return Math.max(0.01, Math.min(0.99, prob)); // Entre 1% y 99%
    }

    /**
     * Calcula daño estimado
     */
    calcularDañoEstimado() {
        const potenciaFuego = this.unidad.potenciaFuego || 10;
        const factorProbabilidad = this.probabilidadImpacto;

        return Math.round(potenciaFuego * factorProbabilidad);
    }

    /**
     * Valida la orden
     */
    async validar() {
        this.mensajesValidacion = [];

        // Verificar munición
        if (this.unidad.municion !== undefined && this.unidad.municion < this.opciones.municionGastar) {
            this.mensajesValidacion.push('Munición insuficiente');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Sin munición');
            return false;
        }

        // Verificar rango
        if (!this.enRango) {
            this.mensajesValidacion.push('Objetivo fuera de rango');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Fuera de rango');
            return false;
        }

        // Verificar LOS si es fuego directo
        if (this.opciones.fuegoDirecto && !this.tieneLineaVista) {
            this.mensajesValidacion.push('Sin línea de vista');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Sin LOS');
            return false;
        }

        // Verificar que el objetivo sigue existiendo y es enemigo
        if (this.esUnidad) {
            if (!this.objetivo || this.objetivo.destruida) {
                this.mensajesValidacion.push('Objetivo no existe');
                this.esValida = false;
                this.actualizarEstado('invalida', 'Sin objetivo');
                return false;
            }
        }

        this.esValida = true;
        this.actualizarEstado('valida', `Ataque válido - P(hit): ${(this.probabilidadImpacto * 100).toFixed(0)}%`);
        return true;
    }

    /**
     * Ejecuta la orden (realiza el ataque)
     */
    async ejecutar() {
        if (!this.puedeEjecutarse()) {
            return { exito: false, error: 'Estado inválido' };
        }

        this.actualizarEstado('ejecutando', 'Disparando...');

        try {
            // Gastar munición
            if (this.unidad.municion !== undefined) {
                this.unidad.municion -= this.opciones.municionGastar;
            }

            // Determinar si impacta
            const impacta = Math.random() < this.probabilidadImpacto;

            // Animación de ataque
            await this.animarAtaque(impacta);

            if (impacta) {
                // Calcular daño real
                const dañoReal = this.calcularDañoReal();

                // Aplicar daño al objetivo
                this.aplicarDaño(dañoReal);

                this.resultado = {
                    impacto: true,
                    daño: dañoReal,
                    objetivoDestruido: this.objetivo.salud <= 0
                };

                this.actualizarEstado('completada', `Impacto - ${dañoReal} daño`);
            } else {
                this.resultado = {
                    impacto: false,
                    daño: 0
                };

                this.actualizarEstado('completada', 'Fallo - sin impacto');
            }

            return { exito: true, ...this.resultado };

        } catch (error) {
            console.error('Error ejecutando ataque:', error);
            this.actualizarEstado('invalida', 'Error en ejecución');
            return { exito: false, error: error.message };
        }
    }

    /**
     * Calcula el daño real del ataque
     */
    calcularDañoReal() {
        const potencia = this.unidad.potenciaFuego || 10;
        const variacion = 0.2; // ±20%
        const factor = 1 + (Math.random() * 2 - 1) * variacion;

        return Math.round(potencia * factor);
    }

    /**
     * Aplica daño al objetivo
     */
    aplicarDaño(daño) {
        if (!this.objetivo.salud) {
            this.objetivo.salud = 100; // Salud inicial si no tiene
        }

        this.objetivo.salud -= daño;

        if (this.objetivo.salud <= 0) {
            this.objetivo.salud = 0;
            this.objetivo.destruida = true;
            this.log(`Objetivo destruido!`);

            // Emitir evento
            if (window.eventBus) {
                window.eventBus.emit('unidadDestruida', {
                    unidadId: this.objetivo.id,
                    atacanteId: this.unidad.id
                });
            }
        }
    }

    /**
     * Anima el ataque
     */
    async animarAtaque(impacta) {
        // TODO: Implementar animación de proyectil/trazador
        // Por ahora, solo un delay
        await this.sleep(500);

        // Efecto visual de impacto
        if (impacta && window.map) {
            const posObjetivo = this.objetivo.getLatLng ? this.objetivo.getLatLng() : this.objetivo.latlng;

            // Crear marcador de impacto temporal
            const impactoMarker = L.circle(posObjetivo, {
                radius: 50,
                color: '#ff0000',
                fillColor: '#ff6600',
                fillOpacity: 0.8
            }).addTo(window.map);

            // Remover después de 1 segundo
            setTimeout(() => {
                window.map.removeLayer(impactoMarker);
            }, 1000);
        }
    }

    /**
     * Dibuja la orden en el mapa
     */
    dibujarEnMapa() {
        if (!window.map) return;

        const posUnidad = this.unidad.getLatLng ? this.unidad.getLatLng() : this.unidad.latlng;
        const posObjetivo = this.objetivo.getLatLng ? this.objetivo.getLatLng() : this.objetivo.latlng;

        if (!posUnidad || !posObjetivo) return;

        // Línea de ataque
        this.lineaAtaque = L.polyline([posUnidad, posObjetivo], {
            color: this.color,
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10',
            interactive: false
        }).addTo(window.map);

        this.elementosVisuales.push(this.lineaAtaque);
    }

    /**
     * Serializa la orden
     */
    serializar() {
        return {
            ...super.serializar(),
            objetivoId: this.objetivo.id,
            distancia: this.distancia,
            tieneLineaVista: this.tieneLineaVista,
            probabilidadImpacto: this.probabilidadImpacto,
            resultado: this.resultado
        };
    }

    /**
     * Override: obtener duración estimada
     */
    getDuracionEstimada() {
        return 2000; // 2 segundos por ataque
    }

    /**
     * Override: obtener resumen
     */
    getResumen() {
        const dist = (this.distancia / 1000).toFixed(2);
        const prob = (this.probabilidadImpacto * 100).toFixed(0);
        return `Ataque a ${this.objetivo.nombre || 'objetivo'} - ${dist}km - ${prob}% - ${this.estado}`;
    }

    /**
     * Helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenAtaque;
}
window.OrdenAtaque = OrdenAtaque;

console.log('✅ OrdenAtaque.js cargado - Sistema de Ataque V2');
