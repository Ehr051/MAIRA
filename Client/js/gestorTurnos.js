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
            this.socket.on('jugadorListo', (datos) => this.manejarJugadorListo(datos));
            this.socket.on('finTurno', (datos) => this.manejarFinTurnoRemoto(datos));
        }
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

    marcarJugadorListo(jugadorId) {
        const jugador = this.jugadores.find(j => j.id === jugadorId);
        if (!jugador) return false;

        jugador.listo = true;
        jugador.despliegueListo = true;

        // Verificar si todos los jugadores están listos
        if (this.todosJugadoresListos()) {
            this.emisorEventos.emit('todosListos');
        }

        return true;
    }

    todosJugadoresListos() {
        return this.jugadores.every(jugador => jugador.listo);
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
    

    manejarJugadorListo(datos) {
        if (this.marcarJugadorListo(datos.jugadorId)) {
            this.emisorEventos.emit('jugadorListo', datos);
        }
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