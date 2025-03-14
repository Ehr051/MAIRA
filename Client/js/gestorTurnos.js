// gestorTurnos.js
class GestorTurnos extends GestorBase {
    constructor() {
        super();
        this.socket = null; // Agregar esta línea
        this.jugadores = [];
        this.fase = 'preparacion';
        this.subfase = 'definicion_sector';
        this.director = null;
        this.directorTemporal = null;
        this.turnoActual = 1;
        this.jugadorActualIndex = 0;
        this.tiempoRestante = 0;
        this.intervalReloj = null;
        this.eventos = new EventEmitter();
        this.zonasDefinidas = false;
        this.todosListosParaDespliegue = false;
    }

    async inicializar(configuracion) {
        try {
            // Validar configuración
            this.validarConfiguracion(configuracion);
            
            // Configurar jugadores
            this.jugadores = configuracion.jugadores;
            this.duracionTurno = configuracion.duracionTurno || 300; // 5 minutos por defecto
            
            // Establecer director
            this.establecerDirector();

            // Inicializar estados de jugadores
            this.inicializarEstadosJugadores();
            
            // Configurar eventos
            this.configurarEventos();

            return true;
        } catch (error) {
            console.error('Error al inicializar GestorTurnos:', error);
            return false;
        }
    }

    validarConfiguracion(config) {
        // Verificar campos mínimos necesarios
        if (!config) {
            throw new Error('La configuración es requerida');
        }
    
        console.log('Validando configuración en GestorTurnos:', config); // Debug
    
        // Validar jugadores de forma más flexible
        if (!Array.isArray(config.jugadores)) {
            config.jugadores = [];
        }
    
        // Validar y ajustar duración del turno
        let duracionTurno = parseInt(config.duracionTurno);
        
        if (isNaN(duracionTurno)) {
            duracionTurno = 300; // 5 minutos por defecto en segundos
        } else if (duracionTurno < 30) { // Si es menor a 30 segundos
            duracionTurno = 300; // Usar valor por defecto
        } else if (duracionTurno > 3600) { // Si es mayor a 1 hora
            duracionTurno = 3600; // Limitar a 1 hora
        }
    
        // Actualizar la configuración con el valor validado
        config.duracionTurno = duracionTurno;
    
        console.log('Configuración validada:', config); // Debug
        return true;
    }
    
    async inicializar(configuracion) {
        try {
            console.log('Iniciando GestorTurnos con configuración:', configuracion); // Debug
            
            // Validar configuración
            this.validarConfiguracion(configuracion);
            
            // Configurar jugadores
            this.jugadores = configuracion.jugadores;
            this.duracionTurno = configuracion.duracionTurno;
            
            // Establecer director
            this.establecerDirector();
    
            // Inicializar estados de jugadores
            this.inicializarEstadosJugadores();
            
            // Configurar eventos
            this.configurarEventos();
    
            return true;
        } catch (error) {
            console.error('Error al inicializar GestorTurnos:', error);
            return false;
        }
    }

    establecerDirector() {
        this.director = this.jugadores.find(j => j.rol === 'director');
        this.esDirectorTemporal = !this.director;
        
        if (this.esDirectorTemporal) {
            this.primerJugador = this.jugadores.find(j => j.equipo === 'azul') || this.jugadores[0];
            this.primerJugador.rolTemporal = 'director';
            this.directorTemporalEquipo = this.primerJugador.equipo;
            console.log('Director temporal establecido:', this.primerJugador.nombre);
        }
    }

    inicializarEstadosJugadores() {
        this.jugadores.forEach(jugador => {
            jugador.listo = false;
            jugador.despliegueListo = false;
            jugador.turnosCompletados = 0;
        });
    }

    actualizarSegunFase(fase, subfase) {
        if (fase === 'preparacion') {
            // Durante preparación no hay turnos activos
            this.detenerReloj();
            this.turnoActual = 0; // Indicar que no hay turno activo
            
            if (subfase === 'despliegue') {
                // En despliegue todos pueden actuar simultáneamente
                this.modoDespliegue = true;
            }
        } else if (fase === 'combate') {
            // Iniciar sistema de turnos para fase de combate
            this.modoDespliegue = false;
            this.turnoActual = 1;
            this.iniciarReloj();
        }
        
        this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
    }

    obtenerJugadorActual() {
        if (this.fase === 'preparacion') {
            if (this.subfase === 'definicion_sector' || this.subfase === 'definicion_zonas') {
                return this.director || this.directorTemporal;
            }
            // En despliegue no hay jugador "actual", todos pueden actuar
            return null;
        }
        
        // En fase de combate, retornar el jugador del turno actual
        return this.jugadores[this.jugadorActualIndex];
    }

    configurarEventos() {
        if (this.socket) {
            this.socket.on('cambioTurno', (datos) => this.manejarCambioTurnoRemoto(datos));
            this.socket.on('jugadorListoDespliegue', (datos) => this.manejarJugadorListo(datos));
            this.socket.on('iniciarCombate', (datos) => this.manejarInicioCombate(datos));
            this.socket.on('finTurno', (datos) => this.manejarFinTurnoRemoto(datos));
        }
    }

inicializarTurnos() {
    console.log('Iniciando sistema de turnos');
    this.turnoActual = 1;
    this.jugadorActualIndex = 0;
    this.tiempoRestante = this.duracionTurno;
    
    // Iniciar reloj
    this.iniciarReloj();
    
    // Emitir evento de inicio de turnos
    this.emisorEventos.emit('inicioTurnos', {
        turnoActual: this.turnoActual,
        jugadorActual: this.obtenerJugadorActual(),
        timestamp: new Date().toISOString()
    });
}
    reiniciarTurnos() {
        this.jugadorActualIndex = 0;
        this.turnoActual = 1;
    }

    iniciarReloj() {
        if (this.intervalReloj) {
            clearInterval(this.intervalReloj);
        }

        this.tiempoRestante = this.duracionTurno;
        
        this.intervalReloj = setInterval(() => {
            if (this.tiempoRestante > 0) {
                this.tiempoRestante--;
                this.emisorEventos.emit('actualizacionReloj', this.tiempoRestante);
            } else {
                this.finalizarTurnoActual();
            }
        }, 1000);

        this.emisorEventos.emit('inicioCuentaRegresiva', this.tiempoRestante);
    }

    detenerReloj() {
        if (this.intervalReloj) {
            clearInterval(this.intervalReloj);
            this.intervalReloj = null;
        }
    }

    cambiarTurno() {
        // Guardar estado del jugador actual
        const jugadorActual = this.obtenerJugadorActual();
        if (jugadorActual) {
            jugadorActual.turnosCompletados++;
        }

        // Avanzar al siguiente jugador
        this.jugadorActualIndex = this.obtenerSiguienteJugadorIndex();
        this.tiempoRestante = this.duracionTurno;

        // Si volvemos al primer jugador, incrementar el número de turno
        if (this.jugadorActualIndex === 0) {
            this.turnoActual++;
        }

        // Emitir evento de cambio de turno
        this.emisorEventos.emit('cambioTurno', {
            jugadorAnterior: jugadorActual,
            jugadorActual: this.obtenerJugadorActual(),
            turno: this.turnoActual,
            timestamp: new Date().toISOString()
        });

        // Reiniciar reloj
        this.iniciarReloj();
    }

    obtenerSiguienteJugadorIndex() {
        let siguienteIndex = (this.jugadorActualIndex + 1) % this.jugadores.length;

        // Saltar al director si existe y no es su turno específico
        while (this.director && this.esDirector(this.jugadores[siguienteIndex].id)) {
            siguienteIndex = (siguienteIndex + 1) % this.jugadores.length;
        }

        return siguienteIndex;
    }

    finalizarTurnoActual(forzado = false) {
        const jugadorActual = this.obtenerJugadorActual();
        
        if (!jugadorActual) {
            console.error('No se pudo obtener el jugador actual');
            return;
        }

        // Emitir evento de fin de turno
        this.emisorEventos.emit('finTurno', {
            jugador: jugadorActual,
            turno: this.turnoActual,
            forzado: forzado,
            timestamp: new Date().toISOString()
        });

        // Si estamos en modo online, notificar al servidor
        if (this.socket) {
            this.socket.emit('finTurno', {
                jugadorId: jugadorActual.id,
                turno: this.turnoActual,
                forzado: forzado
            });
        } else {
            // En modo local, cambiar turno directamente
            this.cambiarTurno();
        }
    }

    marcarJugadorListo() {
        try {
            // 1. Primero verificar elementos antes de continuar
            if (!this.verificarElementosAntesDeEnviarListo()) {
                console.warn('No hay elementos válidos para enviar al servidor');
                if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                    this.gestorJuego.gestorInterfaz.mostrarMensaje(
                        'No se encontraron elementos para marcar como listo',
                        'error'
                    );
                }
                return false;
            }
    
            // 2. Validar que estamos en la fase correcta
            if (this.fase !== 'preparacion' || this.subfase !== 'despliegue') {
                console.warn('[GestorFases] No se puede marcar como listo: fase incorrecta');
                return false;
            }
            
            // 3. Validar elementos desplegados
            if (!this.validarElementosJugador(window.userId)) {
                console.warn('[GestorFases] Validación de elementos fallida');
                return false;
            }
            
            console.log('[GestorFases] Elementos validados, marcando jugador como listo');
            
            // 4. Buscar y actualizar el jugador en la lista
            const jugadorIndex = this.jugadores.findIndex(j => j.id === window.userId);
            if (jugadorIndex === -1) {
                console.error('[GestorFases] Jugador no encontrado en la lista de jugadores');
                return false;
            }
            
            this.jugadores[jugadorIndex].listo = true;
            this.jugadores[jugadorIndex].despliegueListo = true;
            
            // 5. Emitir al servidor
            if (this.gestorJuego?.gestorComunicacion?.socket) {
                console.log('[GestorFases] Enviando estado listo al servidor');
                this.gestorJuego.gestorComunicacion.socket.emit('jugadorListoDespliegue', {
                    jugadorId: window.userId,
                    partidaCodigo: window.codigoPartida,
                    timestamp: new Date().toISOString()
                });
            } else {
                console.warn('[GestorFases] No hay conexión al servidor disponible');
            }
            
            // 6. Actualizar interfaz
            const btnListo = document.getElementById('btn-listo-despliegue');
            if (btnListo) {
                btnListo.disabled = true;
                btnListo.textContent = 'Listo ✓';
            }
            
            // 7. Verificar si todos están listos para iniciar combate
            if (this.todosJugadoresListos() && this.esDirector(window.userId)) {
                console.log('[GestorFases] Todos los jugadores listos, iniciando combate');
                setTimeout(() => this.iniciarFaseCombate(), 1000);
            }
            
            return true;
        } catch (error) {
            console.error('[GestorFases] Error al marcar jugador como listo:', error);
            if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                this.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'Error al marcar como listo: ' + (error.message || 'Error desconocido'),
                    'error'
                );
            }
            return false;
        }
    }
    
    // Añadir este método a la clase GestorFases
    verificarElementosAntesDeEnviarListo() {
        const jugadorId = window.userId;
        if (!jugadorId) {
            console.error('No hay ID de jugador disponible');
            return false;
        }
        
        // Obtener y mostrar todos los elementos
        const elementos = [];
        if (window.calcoActivo) {
            window.calcoActivo.eachLayer(layer => {
                if (layer.options && 
                    (layer.options.jugadorId === jugadorId || layer.options.jugador === jugadorId)) {
                    elementos.push(layer);
                }
            });
        }
        
        console.group(`[Diagnóstico] Elementos para jugador ${jugadorId} antes de marcar como listo`);
        console.log(`Total elementos: ${elementos.length}`);
        
        elementos.forEach((elem, i) => {
            const esEquipo = elem.options?.sidc?.charAt(4) === 'E';
            console.log(`Elemento #${i+1}:`, {
                id: elem.options?.id,
                tipo: elem.options?.tipo,
                designacion: elem.options?.designacion,
                dependencia: elem.options?.dependencia,
                magnitud: elem.options?.magnitud,
                sidc: elem.options?.sidc,
                esEquipo
            });
        });
        
        console.groupEnd();
        return elementos.length > 0;
    }
    
    esJugadorActual(jugadorId) {
        const jugadorActual = this.obtenerJugadorActual();
        return jugadorActual && jugadorActual.id === jugadorId;
    }

    esDirector(jugadorId) {
        return this.director && this.director.id === jugadorId;
    }

    puedeActuar(jugadorId) {
        // En fase de preparación todos pueden actuar en su turno
        if (this.fase === 'preparacion') {
            return true;
        }

        // En fase de combate solo el jugador actual puede actuar
        return this.esJugadorActual(jugadorId);
    }

    // Manejadores de eventos remotos
    manejarCambioTurnoRemoto(datos) {
        this.jugadorActualIndex = this.jugadores.findIndex(j => j.id === datos.jugadorActualId);
        // No se valida si se encontró el jugador (podría ser -1)
    }
    

        manejarJugadorListoDespliegue(datos) {
        const jugador = this.jugadores.find(j => j.id === datos.jugadorId);
        if (!jugador) return;
        
        // Marcar jugador como listo
        jugador.despliegueListo = true;
        
        // Emitir evento local
        this.emisorEventos.emit('jugadorListoDespliegue', datos);
    
        // Verificar si todos están listos para iniciar combate
        if (this.todosJugadoresListos() && 
            (this.esDirector(window.userId) || 
            (this.esDirectorTemporal && this.primerJugador.id === window.userId))) {
            
            this.gestorJuego?.gestorComunicacion?.socket.emit('iniciarCombate', {
                partidaCodigo: window.codigoPartida,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    todosJugadoresListos() {
        return this.jugadores.every(j => j.despliegueListo);
    }

    manejarFinTurnoRemoto(datos) {
        // Solo procesar si coincide con el turno actual
        if (datos.turno === this.turnoActual) {
            this.cambiarTurno();
        }
    }

    obtenerEstadoTurnos() {
        return {
            fase: this.fase,
            subfase: this.subfase,
            turnoActual: this.turnoActual,
            jugadorActualIndex: this.jugadorActualIndex,
            tiempoRestante: this.tiempoRestante,
            jugadores: this.jugadores.map(j => ({
                id: j.id,
                nombre: j.nombre,
                equipo: j.equipo,
                listo: j.listo,
                turnosCompletados: j.turnosCompletados
            }))
        };
    }

    destruir() {
        // Limpiar interval del reloj
        if (this.intervalReloj) {
            clearInterval(this.intervalReloj);
            this.intervalReloj = null;
        }

        // Limpiar eventos del socket
        if (this.socket) {
            this.socket.off('cambioTurno');
            this.socket.off('jugadorListo');
            this.socket.off('finTurno');
        }

        // Llamar al destruir del padre
        super.destruir();
    }
}

// Exportar la clase
window.GestorTurnos = GestorTurnos;