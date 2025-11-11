/**
 * 🔍 ORDEN DE RECONOCIMIENTO - Implementación concreta
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * Reconocimiento de área objetivo con recolección de inteligencia
 */

class OrdenReconocimiento extends OrdenBase {
    constructor(unidad, objetivo, opciones = {}) {
        super(unidad, 'reconocimiento');

        // Objetivo del reconocimiento
        this.objetivo = objetivo; // posición {lat, lng} o área (polígono)
        this.tipoObjetivo = objetivo.getBounds ? 'area' : 'punto';
        this.hexObjetivo = null;

        // Tipo de reconocimiento
        this.tipoReconocimiento = opciones.tipo || 'observacion'; // observacion, infiltracion, combate
        this.modalidad = opciones.modalidad || 'sigiloso'; // sigiloso, agresivo

        // Parámetros
        this.radioObservacion = opciones.radioObservacion || 500; // metros
        this.duracionObservacion = opciones.duracionObservacion || 300; // segundos
        this.retornar = opciones.retornar !== false; // retornar a posición original

        // Rutas
        this.posicionOriginal = unidad.getLatLng ? unidad.getLatLng() : null;
        this.rutaIda = null;
        this.rutaVuelta = null;

        // Información recolectada
        this.inteligencia = {
            unidadesDetectadas: [],
            posicionesDefensivas: [],
            obstaculos: [],
            rutasAcceso: [],
            nivelActividad: 'desconocido' // bajo, medio, alto
        };

        // Visualización
        this.lineaRutaIda = null;
        this.lineaRutaVuelta = null;
        this.circuloObservacion = null;
        this.marcadorObjetivo = null;

        // Estado
        this.faseReconocimiento = 'planificacion'; // planificacion, aproximacion, observacion, retorno, completado
        this.detectado = false; // si fue detectado por el enemigo
        this.progresoObservacion = 0; // 0-100%

        // Inicializar
        this.inicializar();
    }

    /**
     * Inicializa la orden
     */
    async inicializar() {
        // Verificar objetivo
        if (!this.objetivo) {
            this.actualizarEstado('invalida', 'Objetivo no especificado');
            return;
        }

        // Obtener posición objetivo
        const posObjetivo = this.tipoObjetivo === 'area' ?
            this.objetivo.getBounds().getCenter() :
            this.objetivo;

        this.hexObjetivo = window.HexGrid.pixelToHex(posObjetivo);

        if (!this.hexObjetivo) {
            this.actualizarEstado('invalida', 'Objetivo inválido');
            return;
        }

        // ✅ Verificar que objetivo está dentro del sector
        if (window.faseManager && window.faseManager.sectorLayer && typeof ValidacionesGeometricas !== 'undefined') {
            if (!ValidacionesGeometricas.puntoEnPoligono(posObjetivo, window.faseManager.sectorLayer)) {
                this.actualizarEstado('invalida', 'Objetivo fuera del sector');
                this.log('❌ Objetivo fuera del sector');
                return;
            }
        }

        // Calcular rutas
        await this.calcularRutas();

        // Dibujar visualización
        this.dibujarEnMapa();

        this.log(`Reconocimiento ${this.tipoReconocimiento} (${this.modalidad}) a objetivo`);
    }

    /**
     * Calcula rutas de ida y vuelta
     */
    async calcularRutas() {
        if (!window.pathfinding || !this.posicionOriginal) {
            return false;
        }

        try {
            const hexOrigen = window.HexGrid.pixelToHex(this.posicionOriginal);
            const tipoUnidad = this.unidad.tipoUnidad || 'infanteria';

            // Ruta de ida
            this.rutaIda = await window.pathfinding.calcularRuta(
                hexOrigen,
                this.hexObjetivo,
                tipoUnidad,
                {
                    considerarTerreno: true,
                    evitarEnemigos: this.modalidad === 'sigiloso',
                    preferirCobertura: this.modalidad === 'sigiloso'
                }
            );

            // Ruta de vuelta (si se requiere retorno)
            if (this.retornar) {
                this.rutaVuelta = await window.pathfinding.calcularRuta(
                    this.hexObjetivo,
                    hexOrigen,
                    tipoUnidad,
                    {
                        considerarTerreno: true,
                        evitarEnemigos: true,
                        preferirCobertura: true
                    }
                );
            }

            this.log(`Rutas calculadas: Ida ${this.rutaIda?.length || 0} hex, Vuelta ${this.rutaVuelta?.length || 0} hex`);

            return true;

        } catch (error) {
            console.error('Error calculando rutas:', error);
            return false;
        }
    }

    /**
     * Valida la orden
     */
    async validar() {
        this.mensajesValidacion = [];

        // Verificar que la unidad puede moverse
        if (this.unidad.estado === 'inmovilizada' || this.unidad.estado === 'destruida') {
            this.mensajesValidacion.push('La unidad no puede realizar reconocimiento');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Unidad no disponible');
            return false;
        }

        // Verificar que hay ruta
        if (!this.rutaIda || this.rutaIda.length === 0) {
            this.mensajesValidacion.push('No hay ruta al objetivo');
            this.esValida = false;
            this.actualizarEstado('invalida', 'Sin ruta');
            return false;
        }

        // Verificar movimiento suficiente
        const movimientoNecesario = this.rutaIda.length + (this.retornar ? (this.rutaVuelta?.length || 0) : 0);
        if (this.unidad.movimientoRestante !== undefined && this.unidad.movimientoRestante < movimientoNecesario) {
            this.mensajesValidacion.push(`Movimiento insuficiente (necesario: ${movimientoNecesario}, disponible: ${this.unidad.movimientoRestante})`);
            this.esValida = false;
            this.actualizarEstado('invalida', 'Sin movimiento');
            return false;
        }

        // ✅ Verificar que la ruta está dentro del sector
        if (window.faseManager && window.faseManager.sectorLayer && typeof ValidacionesGeometricas !== 'undefined') {
            for (const hex of this.rutaIda) {
                const hexKey = `${hex.q},${hex.r},${hex.s}`;
                const hexData = window.HexGrid.grid.get(hexKey);
                if (hexData && hexData.center) {
                    if (!ValidacionesGeometricas.puntoEnPoligono(L.latLng(hexData.center), window.faseManager.sectorLayer)) {
                        this.mensajesValidacion.push('Ruta sale del sector de operaciones');
                        this.esValida = false;
                        this.actualizarEstado('invalida', 'Ruta fuera del sector');
                        return false;
                    }
                }
            }
        }

        this.esValida = true;
        this.actualizarEstado('valida', `Reconocimiento ${this.tipoReconocimiento} válido`);
        return true;
    }

    /**
     * Ejecuta la orden (movimiento + observación + retorno)
     */
    async ejecutar() {
        if (!this.puedeEjecutarse()) {
            console.warn('La orden no puede ejecutarse en su estado actual:', this.estado);
            return { exito: false, error: 'Estado inválido' };
        }

        this.actualizarEstado('ejecutando', 'Iniciando reconocimiento');

        try {
            // Fase 1: Aproximación al objetivo
            this.faseReconocimiento = 'aproximacion';
            await this.faseAproximacion();

            // Fase 2: Observación del área
            this.faseReconocimiento = 'observacion';
            await this.faseObservacion();

            // Fase 3: Retorno a posición original (si se requiere)
            if (this.retornar && this.rutaVuelta) {
                this.faseReconocimiento = 'retorno';
                await this.faseRetorno();
            }

            // Completado
            this.faseReconocimiento = 'completado';
            this.actualizarEstado('completada', 'Reconocimiento completado');

            return {
                exito: true,
                inteligencia: this.inteligencia,
                detectado: this.detectado,
                distanciaRecorrida: this.calcularDistanciaTotal()
            };

        } catch (error) {
            console.error('Error ejecutando reconocimiento:', error);
            this.actualizarEstado('invalida', 'Error en ejecución: ' + error.message);
            return { exito: false, error: error.message };
        }
    }

    /**
     * Fase 1: Aproximación al objetivo
     */
    async faseAproximacion() {
        if (!this.rutaIda) return;

        this.log('🚶 Fase: Aproximación al objetivo');

        // Animar movimiento a lo largo de la ruta
        for (let i = 0; i < this.rutaIda.length; i++) {
            const hex = this.rutaIda[i];
            const hexKey = `${hex.q},${hex.r},${hex.s}`;
            const hexData = window.HexGrid.grid.get(hexKey);

            if (hexData && hexData.center) {
                // Mover unidad
                if (this.unidad.setLatLng) {
                    this.unidad.setLatLng(hexData.center);
                }

                // Actualizar hexágono actual
                this.unidad.hexActual = hex;

                // Chequear detección (en modalidad sigilosa)
                if (this.modalidad === 'sigiloso') {
                    this.chequearDeteccion(hexData);
                }

                await this.sleep(300); // 300ms por hexágono
            }
        }

        this.log('✅ Aproximación completada');
    }

    /**
     * Fase 2: Observación del área
     */
    async faseObservacion() {
        this.log('👁️ Fase: Observación del área');

        const duracionMs = this.duracionObservacion * 1000;
        const pasos = 10; // 10 pasos de observación
        const tiempoPorPaso = duracionMs / pasos;

        for (let i = 0; i < pasos; i++) {
            this.progresoObservacion = ((i + 1) / pasos) * 100;

            // Recolectar información
            this.recolectarInteligencia();

            // Chequear detección
            this.chequearDeteccion(null, true); // observando = true

            await this.sleep(tiempoPorPaso);
        }

        // Analizar información recolectada
        this.analizarInteligencia();

        this.log(`✅ Observación completada (${this.inteligencia.unidadesDetectadas.length} unidades detectadas)`);
    }

    /**
     * Fase 3: Retorno a posición original
     */
    async faseRetorno() {
        if (!this.rutaVuelta) return;

        this.log('🔙 Fase: Retorno a posición');

        // Animar movimiento de regreso
        for (let i = 0; i < this.rutaVuelta.length; i++) {
            const hex = this.rutaVuelta[i];
            const hexKey = `${hex.q},${hex.r},${hex.s}`;
            const hexData = window.HexGrid.grid.get(hexKey);

            if (hexData && hexData.center) {
                // Mover unidad
                if (this.unidad.setLatLng) {
                    this.unidad.setLatLng(hexData.center);
                }

                this.unidad.hexActual = hex;

                await this.sleep(300);
            }
        }

        this.log('✅ Retorno completado');
    }

    /**
     * Recolecta inteligencia del área
     */
    recolectarInteligencia() {
        // Simular detección de unidades enemigas en el radio de observación
        // TODO: Implementar detección real de unidades enemigas

        // Por ahora, simulación simple
        const probabilidadDeteccion = this.modalidad === 'sigiloso' ? 0.3 : 0.7;

        if (Math.random() < probabilidadDeteccion) {
            // Detectar unidad enemiga simulada
            const unidadDetectada = {
                tipo: 'infanteria',
                posicion: this.generarPosicionAleatoria(),
                timestamp: Date.now()
            };

            this.inteligencia.unidadesDetectadas.push(unidadDetectada);
        }
    }

    /**
     * Analiza la inteligencia recolectada
     */
    analizarInteligencia() {
        const cantidadUnidades = this.inteligencia.unidadesDetectadas.length;

        // Determinar nivel de actividad
        if (cantidadUnidades === 0) {
            this.inteligencia.nivelActividad = 'bajo';
        } else if (cantidadUnidades < 5) {
            this.inteligencia.nivelActividad = 'medio';
        } else {
            this.inteligencia.nivelActividad = 'alto';
        }

        this.log(`📊 Inteligencia: ${cantidadUnidades} unidades, actividad ${this.inteligencia.nivelActividad}`);
    }

    /**
     * Chequea si la unidad es detectada
     */
    chequearDeteccion(hexData, observando = false) {
        if (this.detectado) return; // Ya fue detectado

        // Probabilidad de detección según modalidad
        const probabilidadBase = this.modalidad === 'sigiloso' ? 0.05 : 0.15;
        const multiplicador = observando ? 2 : 1; // Mayor probabilidad mientras observa

        if (Math.random() < (probabilidadBase * multiplicador)) {
            this.detectado = true;
            this.log('⚠️ ¡Unidad detectada por el enemigo!');

            // TODO: Disparar evento de detección
        }
    }

    /**
     * Genera posición aleatoria dentro del radio de observación
     */
    generarPosicionAleatoria() {
        const posObjetivo = this.tipoObjetivo === 'area' ?
            this.objetivo.getBounds().getCenter() :
            this.objetivo;

        const angulo = Math.random() * 2 * Math.PI;
        const distancia = Math.random() * this.radioObservacion;

        return {
            lat: posObjetivo.lat + (distancia / 111000) * Math.cos(angulo),
            lng: posObjetivo.lng + (distancia / (111000 * Math.cos(posObjetivo.lat * Math.PI / 180))) * Math.sin(angulo)
        };
    }

    /**
     * Calcula distancia total recorrida
     */
    calcularDistanciaTotal() {
        let distancia = 0;

        if (this.rutaIda && window.pathfinding) {
            distancia += window.pathfinding.calcularDistanciaRuta(this.rutaIda);
        }

        if (this.retornar && this.rutaVuelta && window.pathfinding) {
            distancia += window.pathfinding.calcularDistanciaRuta(this.rutaVuelta);
        }

        return distancia;
    }

    /**
     * Dibuja la orden en el mapa
     */
    dibujarEnMapa() {
        if (!window.map) return;

        this.limpiarVisualizacion();

        // Convertir rutas a LatLngs
        if (this.rutaIda) {
            const rutaLatLngs = this.rutaIda.map(hex => {
                const hexKey = `${hex.q},${hex.r},${hex.s}`;
                const hexData = window.HexGrid.grid.get(hexKey);
                return hexData ? hexData.center : null;
            }).filter(coord => coord !== null);

            // Línea de ruta ida
            this.lineaRutaIda = L.polyline(rutaLatLngs, {
                color: this.color,
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 5',
                interactive: false
            }).addTo(window.map);

            this.elementosVisuales.push(this.lineaRutaIda);
        }

        // Círculo de observación en objetivo
        const posObjetivo = this.tipoObjetivo === 'area' ?
            this.objetivo.getBounds().getCenter() :
            this.objetivo;

        this.circuloObservacion = L.circle(posObjetivo, {
            radius: this.radioObservacion,
            color: this.color,
            fillColor: this.color,
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10',
            interactive: false
        }).addTo(window.map);

        this.elementosVisuales.push(this.circuloObservacion);

        // Marcador objetivo
        this.marcadorObjetivo = L.marker(posObjetivo, {
            icon: L.divIcon({
                className: 'orden-reconocimiento-marker',
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
                ">🔍</div>`,
                iconSize: [30, 30]
            }),
            interactive: false
        }).addTo(window.map);

        this.elementosVisuales.push(this.marcadorObjetivo);
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
            objetivo: this.tipoObjetivo === 'punto' ? this.objetivo : null,
            tipoObjetivo: this.tipoObjetivo,
            tipoReconocimiento: this.tipoReconocimiento,
            modalidad: this.modalidad,
            radioObservacion: this.radioObservacion,
            duracionObservacion: this.duracionObservacion,
            retornar: this.retornar,
            faseReconocimiento: this.faseReconocimiento,
            inteligencia: this.inteligencia,
            detectado: this.detectado,
            progresoObservacion: this.progresoObservacion
        };
    }

    /**
     * Override: obtener duración estimada
     */
    getDuracionEstimada() {
        const tiempoMovimiento = (this.rutaIda?.length || 0) * 300 + (this.retornar ? (this.rutaVuelta?.length || 0) * 300 : 0);
        const tiempoObservacion = this.duracionObservacion * 1000;
        return tiempoMovimiento + tiempoObservacion;
    }

    /**
     * Override: obtener resumen
     */
    getResumen() {
        return `Reconocimiento ${this.tipoReconocimiento} (${this.modalidad}) - Fase: ${this.faseReconocimiento} - ${this.estado}`;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrdenReconocimiento;
}
window.OrdenReconocimiento = OrdenReconocimiento;

console.log('✅ OrdenReconocimiento.js cargado - Sistema de Reconocimiento V2');
