/**
 * 🕐 TURNOS MANAGER - Gestor de Turnos y Reloj para Juego de Guerra V2
 *
 * Controla:
 * - Duración de turnos con cuenta regresiva
 * - Timer visual en pantalla
 * - Fin automático de turno por timeout
 * - Pausa/Reanudación del reloj
 *
 * @version 2.0
 * @date 2025-11-07
 */

class TurnosManager {
    constructor(opciones = {}) {
        // Configuración
        this.duracionTurnoSegundos = opciones.duracionTurnoSegundos || 300; // 5 minutos por defecto
        this.autoFinalizarTurno = opciones.autoFinalizarTurno !== undefined ? opciones.autoFinalizarTurno : true;

        // Estado
        this.turnoActual = 0;
        this.tiempoRestante = this.duracionTurnoSegundos;
        this.pausado = false;
        this.intervalo = null;

        // Callbacks
        this.callbacks = {
            onTurnoInicio: opciones.onTurnoInicio || (() => {}),
            onTurnoFin: opciones.onTurnoFin || (() => {}),
            onTimeout: opciones.onTimeout || (() => {}),
            onTick: opciones.onTick || (() => {})
        };

        // UI Elements
        this.relojElement = null;

        console.log(`🕐 TurnosManager creado - Duración: ${this.duracionTurnoSegundos}s`);
    }

    /**
     * Inicializa el gestor de turnos
     */
    inicializar() {
        console.log('🔄 Inicializando TurnosManager...');

        // ✅ NO crear reloj flotante - se renderiza en panelInferiorUnificado
        // this.crearReloj();

        console.log('✅ TurnosManager inicializado (reloj integrado en panel)');
    }

    /**
     * Crea el reloj visual en pantalla
     */
    crearReloj() {
        this.relojElement = document.createElement('div');
        this.relojElement.id = 'reloj-turno-v2';
        this.relojElement.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 12px 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 8px;
            color: #00ff00;
            font-weight: bold;
            font-size: 24px;
            font-family: 'Courier New', monospace;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
        `;

        this.relojElement.innerHTML = `
            <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">Turno ${this.turnoActual}</div>
            <div id="tiempo-display">${this.formatearTiempo(this.tiempoRestante)}</div>
            <div style="display: flex; gap: 8px;">
                <button id="btn-finalizar-turno" style="
                    padding: 4px 12px;
                    background: rgba(76, 175, 80, 0.8);
                    border: 1px solid #4CAF50;
                    border-radius: 4px;
                    color: white;
                    font-size: 12px;
                    cursor: pointer;
                    font-weight: bold;
                ">✅ Pasar Turno</button>
            </div>
        `;

        document.body.appendChild(this.relojElement);

        // Event listeners (sin pausa - una vez iniciado, se juega)
        document.getElementById('btn-finalizar-turno').addEventListener('click', () => this.finalizarTurnoManual());
    }

    /**
     * Actualiza el display del reloj
     */
    actualizarReloj() {
        const tiempoDisplay = document.getElementById('tiempo-display');
        if (tiempoDisplay) {
            tiempoDisplay.textContent = this.formatearTiempo(this.tiempoRestante);

            // Cambiar color según tiempo restante
            if (this.tiempoRestante <= 30) {
                tiempoDisplay.style.color = '#ff0000';
                if (this.tiempoRestante % 2 === 0) {
                    tiempoDisplay.style.animation = 'pulse 0.5s ease';
                }
            } else if (this.tiempoRestante <= 60) {
                tiempoDisplay.style.color = '#ff9800';
            } else {
                tiempoDisplay.style.color = '#00ff00';
            }
        }

        const turnoDisplay = this.relojElement.querySelector('div:first-child');
        if (turnoDisplay) {
            turnoDisplay.textContent = `Turno ${this.turnoActual}`;
        }

        // Agregar animación pulse si no existe
        if (!document.getElementById('pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Formatea el tiempo en formato MM:SS
     */
    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }

    /**
     * Inicia un nuevo turno
     */
    iniciarTurno(numeroTurno) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🕐 INICIANDO TURNO ${numeroTurno}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.turnoActual = numeroTurno;
        this.tiempoRestante = this.duracionTurnoSegundos;
        this.pausado = false;

        // Actualizar UI
        this.actualizarReloj();

        // Iniciar cuenta regresiva
        this.iniciarCuentaRegresiva();

        // Callback
        this.callbacks.onTurnoInicio(numeroTurno);

        // Evento para panelInferiorUnificado
        this.dispatchCambioTurno();

        console.log(`✅ Turno ${numeroTurno} iniciado - Duración: ${this.duracionTurnoSegundos}s`);
    }

    /**
     * Inicia la cuenta regresiva
     */
    iniciarCuentaRegresiva() {
        // Limpiar intervalo anterior si existe
        if (this.intervalo) {
            clearInterval(this.intervalo);
        }

        this.intervalo = setInterval(() => {
            if (!this.pausado) {
                this.tiempoRestante--;

                // Actualizar UI
                this.actualizarReloj();

                // Callback de tick
                this.callbacks.onTick(this.tiempoRestante);

                // Sonido de advertencia a los 30 segundos
                if (this.tiempoRestante === 30) {
                    this.reproducirSonidoAdvertencia();
                }

                // Finalizar turno por timeout
                if (this.tiempoRestante <= 0) {
                    console.log('⏰ TIMEOUT - Finalizando turno automáticamente');
                    this.finalizarTurnoPorTimeout();
                }
            }
        }, 1000);
    }

    /**
     * Detiene la cuenta regresiva
     */
    detenerCuentaRegresiva() {
        if (this.intervalo) {
            clearInterval(this.intervalo);
            this.intervalo = null;
        }
    }

    // ✅ SIN PAUSA - Una vez iniciada la partida, se juega sin pausas

    /**
     * Finaliza el turno manualmente
     */
    finalizarTurnoManual() {
        console.log('✅ Turno finalizado manualmente');

        this.detenerCuentaRegresiva();

        // Callback
        this.callbacks.onTurnoFin(this.turnoActual, 'manual');
    }

    /**
     * Finaliza el turno por timeout
     */
    finalizarTurnoPorTimeout() {
        this.detenerCuentaRegresiva();

        // Callback
        this.callbacks.onTimeout(this.turnoActual);
        this.callbacks.onTurnoFin(this.turnoActual, 'timeout');
    }

    /**
     * Reproduce sonido de advertencia
     */
    reproducirSonidoAdvertencia() {
        // TODO: Implementar reproducción de sonido
        console.log('🔔 ¡30 segundos restantes!');

        // Notificación visual
        if (this.relojElement) {
            this.relojElement.style.animation = 'shake 0.5s';
            setTimeout(() => {
                this.relojElement.style.animation = '';
            }, 500);
        }

        // Agregar animación shake si no existe
        if (!document.getElementById('shake-animation')) {
            const style = document.createElement('style');
            style.id = 'shake-animation';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Agrega tiempo al turno actual
     */
    agregarTiempo(segundos) {
        this.tiempoRestante += segundos;
        this.actualizarReloj();
        console.log(`⏰ Agregados ${segundos}s al turno - Nuevo tiempo: ${this.tiempoRestante}s`);
    }

    /**
     * Reinicia el turno (reset timer)
     */
    reiniciarTurno() {
        this.tiempoRestante = this.duracionTurnoSegundos;
        this.pausado = false;
        this.actualizarReloj();
        console.log('🔄 Turno reiniciado');
    }

    /**
     * Oculta/Muestra el reloj
     */
    toggleVisibilidad() {
        if (this.relojElement) {
            this.relojElement.style.display = this.relojElement.style.display === 'none' ? 'flex' : 'none';
        }
    }

    /**
     * Obtiene el tiempo restante en segundos
     */
    getTiempoRestante() {
        return this.tiempoRestante;
    }

    /**
     * Obtiene el turno actual
     */
    getTurnoActual() {
        return this.turnoActual;
    }

    /**
     * Verifica si el reloj está pausado
     */
    estaPausado() {
        return this.pausado;
    }

    /**
     * Dispara evento de cambio de turno para integración con panelInferiorUnificado
     */
    dispatchCambioTurno() {
        const evento = new CustomEvent('cambioTurno', {
            detail: {
                turno: this.turnoActual,
                tiempoRestante: this.tiempoRestante,
                jugadorActual: null // TODO: Obtener de configuración de partida
            }
        });
        document.dispatchEvent(evento);
        console.log(`📡 Evento 'cambioTurno' disparado:`, evento.detail);
    }

    /**
     * Destruye el gestor de turnos
     */
    destruir() {
        this.detenerCuentaRegresiva();

        if (this.relojElement) {
            this.relojElement.remove();
        }

        console.log('🗑️ TurnosManager destruido');
    }
}

// Exportar globalmente
window.TurnosManager = TurnosManager;
console.log('✅ TurnosManager.js cargado');
