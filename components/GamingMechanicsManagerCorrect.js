/**
 * 🎖️ MAIRA Gaming Mechanics Manager
 * Sistema de mecánicas de juego integrado con el sistema existente
 * Roles: azul, rojo, director (como ya está definido en iniciarpartida.js)
 */

class GamingMechanicsManager {
    constructor() {
        this.partidaActiva = null;
        this.participantes = new Map(); // Jugadores en la partida
        this.accionesRegistradas = []; // Registro estilo "ajedrez militar"
        
        this.estadisticasPartida = {
            partidasJugadas: 0,
            tiempoTotalJuego: 0,
            accionesEjecutadas: 0,
            elementosDesplegados: 0,
            movimientosRealizados: 0
        };

        // Solo los roles que ya existen: azul, rojo, director
        this.rolesPermitidos = ['azul', 'rojo', 'director'];

        console.log('🎮 Gaming Mechanics Manager initialized');
        this.inicializarSistema();
    }

    /**
     * Inicializa el sistema integrado con Juego de Guerra
     */
    inicializarSistema() {
        this.configurarInterfazJuego();
        this.vincularEventosExistentes();
        
        console.log('✅ Gaming Mechanics activo');
    }

    /**
     * Se ejecuta cuando se inicia una partida desde iniciarpartida.js
     * @param {Object} datosPartida - Datos de la partida iniciada
     */
    onPartidaIniciada(datosPartida) {
        this.partidaActiva = {
            id: datosPartida.codigo,
            nombre: datosPartida.configuracion?.nombrePartida || 'Partida MAIRA',
            tipo: datosPartida.configuracion?.modo || 'online',
            horaInicio: new Date(),
            fase: 'preparacion', // preparacion, combate, finalizada
            jugadores: datosPartida.jugadores || [],
            director: datosPartida.director || null
        };

        this.accionesRegistradas = [];
        this.configurarParticipantes(datosPartida.jugadores);

        console.log(`🎯 Partida iniciada: ${this.partidaActiva.nombre}`);
        this.emitirEventoJuego('partida:iniciada', this.partidaActiva);
    }

    /**
     * Configura participantes con sus roles (azul/rojo/director)
     * @param {Array} jugadores - Lista de jugadores
     */
    configurarParticipantes(jugadores) {
        jugadores.forEach(jugador => {
            this.participantes.set(jugador.id, {
                id: jugador.id,
                nombre: jugador.username || jugador.nombre,
                equipo: jugador.equipo, // 'azul', 'rojo', o null para director
                rol: jugador.equipo === 'director' ? 'director' : jugador.equipo,
                horaIngreso: new Date(),
                acciones: [],
                estado: 'activo',
                elementosDesplegados: 0,
                movimientos: 0
            });
        });

        console.log(`👥 ${this.participantes.size} participantes configurados`);
    }

    /**
     * Registra una acción militar (estilo ajedrez)
     * @param {Object} accion - Acción a registrar
     */
    registrarAccion(accion) {
        const accionCompleta = {
            id: `accion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            turno: this.obtenerTurnoActual(),
            fase: this.partidaActiva?.fase || 'sin_partida',
            usuario: accion.usuario,
            equipo: accion.equipo, // azul, rojo, director
            tipo: accion.tipo, // 'mover', 'atacar', 'desplegar', 'eliminar'
            elemento: accion.elemento, // Elemento militar involucrado
            origen: accion.origen, // Coordenadas de origen
            destino: accion.destino, // Coordenadas de destino
            descripcion: accion.descripcion,
            resultado: accion.resultado || 'completado'
        };

        this.accionesRegistradas.push(accionCompleta);
        this.estadisticasPartida.accionesEjecutadas++;

        // Actualizar estadísticas del participante
        const participante = this.participantes.get(accion.usuario);
        if (participante) {
            participante.acciones.push(accionCompleta);
            
            if (accion.tipo === 'desplegar') {
                participante.elementosDesplegados++;
                this.estadisticasPartida.elementosDesplegados++;
            } else if (accion.tipo === 'mover') {
                participante.movimientos++;
                this.estadisticasPartida.movimientosRealizados++;
            }
        }

        console.log(`📝 Acción registrada:`, accionCompleta);
        this.emitirEventoJuego('accion:registrada', accionCompleta);

        return accionCompleta;
    }

    /**
     * Integración con gestorTurnos.js - cuando cambia el turno
     */
    onCambioTurno(nuevoTurno) {
        if (!this.partidaActiva) return;

        this.registrarAccion({
            usuario: 'sistema',
            equipo: 'sistema',
            tipo: 'cambio_turno',
            descripcion: `Turno ${nuevoTurno.numero} - Equipo ${nuevoTurno.equipo}`,
            elemento: null,
            origen: null,
            destino: null
        });
    }

    /**
     * Integración con simbolosP.js - cuando se despliega un elemento
     */
    onElementoDesplegado(elemento, usuario) {
        if (!this.partidaActiva) return;

        this.registrarAccion({
            usuario: usuario.id,
            equipo: usuario.equipo,
            tipo: 'desplegar',
            elemento: {
                id: elemento.id,
                tipo: elemento.tipo,
                sidc: elemento.sidc,
                designacion: elemento.designacion || elemento.tipo
            },
            origen: null,
            destino: elemento.coordenadas,
            descripcion: `Desplegó ${elemento.designacion || elemento.tipo} (${usuario.equipo})`
        });
    }

    /**
     * Integración con gestorAcciones.js - cuando se mueve un elemento
     */
    onElementoMovido(elemento, origen, destino, usuario) {
        if (!this.partidaActiva) return;

        this.registrarAccion({
            usuario: usuario.id,
            equipo: usuario.equipo,
            tipo: 'mover',
            elemento: {
                id: elemento.id,
                designacion: elemento.designacion || elemento.tipo,
                tipo: elemento.tipo
            },
            origen: origen,
            destino: destino,
            descripcion: `Movió ${elemento.designacion || elemento.tipo}`
        });
    }

    /**
     * Métodos de utilidad simplificados
     */
    configurarInterfazJuego() {
        console.log('🎨 Interfaz gaming configurada');
    }

    vincularEventosExistentes() {
        // Integración con eventos existentes de MAIRA
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.on('partida:iniciada', (data) => this.onPartidaIniciada(data));
            window.MAIRA.Events.on('turno:cambiado', (data) => this.onCambioTurno(data));
            window.MAIRA.Events.on('elemento:desplegado', (data) => this.onElementoDesplegado(data.elemento, data.usuario));
            window.MAIRA.Events.on('elemento:movido', (data) => this.onElementoMovido(data.elemento, data.origen, data.destino, data.usuario));
        }
        console.log('🔗 Eventos vinculados con sistemas existentes');
    }

    obtenerTurnoActual() {
        if (window.gestorTurnos) {
            return {
                numero: window.gestorTurnos.turnoActual || 1,
                jugador: window.gestorTurnos.jugadorActual || 'unknown',
                fase: window.gestorTurnos.fase || 'preparacion'
            };
        }
        return { numero: 1, jugador: 'unknown', fase: 'preparacion' };
    }

    emitirEventoJuego(evento, datos) {
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.emit(`gaming:${evento}`, datos);
        }
        console.log(`📡 Gaming evento: ${evento}`, datos);
    }
}

// Inicializar globalmente - se integra con el sistema existente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.GamingMechanics = new GamingMechanicsManager();

console.log('🎮 MAIRA Gaming Mechanics Manager loaded and active');
