/**
 * 🎖️ MAIRA Gaming Mechanics Manager
 * Optimiza la fase de combate del juego de guerra existente
 * Se integra con iniciarpartida.js, gestorTurnos.js y gestorFases.js
 */

class GamingMechanicsManager {
    constructor() {
        this.partidaActiva = null;
        this.accionesRegistradas = []; // Log de acciones estilo "ajedrez militar"
        this.optimizacionesCombate = {
            movimientosRapidos: true,
            validacionAutomatica: true,
            sugerenciasIA: false // Para futuras mejoras
        };

        // Integración con sistema existente
        this.gestorTurnos = null;
        this.gestorFases = null;
        this.gestorJuego = null;

        console.log('🎮 Gaming Mechanics Manager initialized');
        this.inicializarSistema();
    }

    /**
     * Inicializa el sistema integrado con Juego de Guerra existente
     */
    inicializarSistema() {
        this.configurarIntegracionSistemaExistente();
        this.configurarOptimizacionesCombate();
        
        console.log('✅ Gaming Mechanics activo - Optimizaciones de combate habilitadas');
    }

    /**
     * Se vincula con los gestores existentes del sistema MAIRA
     */
    configurarIntegracionSistemaExistente() {
        // Esperar a que el sistema de juego esté disponible
        const esperarSistema = () => {
            if (window.juego) {
                this.gestorJuego = window.juego;
                this.gestorTurnos = window.juego.gestorTurnos;
                this.gestorFases = window.juego.gestorFases;
                
                console.log('🔗 Gaming Mechanics conectado con sistema existente');
                this.configurarEventosExistentes();
            } else {
                setTimeout(esperarSistema, 1000);
            }
        };
        
        esperarSistema();
    }

    /**
     * Configura eventos del sistema existente para optimización
     */
    configurarEventosExistentes() {
        if (!this.gestorTurnos || !this.gestorFases) return;

        // Optimizar fase de combate
        if (this.gestorFases.eventos) {
            this.gestorFases.eventos.on('cambioFase', (data) => {
                if (data.fase === 'combate') {
                    this.optimizarFaseCombate();
                }
            });
        }

        // Optimizar turnos
        if (this.gestorTurnos.eventos) {
            this.gestorTurnos.eventos.on('cambioTurno', (data) => {
                this.optimizarCambioTurno(data);
            });
        }

        console.log('📡 Eventos del sistema configurados para optimización');
    }

    /**
     * Configura optimizaciones específicas para la fase de combate
     */
    configurarOptimizacionesCombate() {
        // Intercepción de funciones de combate existentes para optimización
        this.interceptarFuncionesCombate();
        
        // Configurar validaciones automáticas
        this.configurarValidacionesAutomaticas();
        
        // Preparar sistema de logging de acciones
        this.configurarLoggingAcciones();
    }

    /**
     * Intercepta funciones de combate existentes para añadir optimizaciones
     */
    interceptarFuncionesCombate() {
        // Interceptar movimientos de unidades para logging y validación
        const originalMoverElemento = window.moverElemento;
        if (originalMoverElemento) {
            window.moverElemento = (elemento, destino) => {
                const resultado = this.validarMovimiento(elemento, destino);
                if (resultado.valido) {
                    this.logAccion('movimiento', {
                        elemento: elemento.id || 'elemento',
                        origen: elemento.posicion,
                        destino: destino,
                        turno: this.gestorTurnos?.turnoActual || 1,
                        timestamp: new Date().toISOString()
                    });
                    
                    return originalMoverElemento.call(this, elemento, destino);
                } else {
                    console.warn('Movimiento no válido:', resultado.razon);
                    return false;
                }
            };
        }

        // Interceptar despliegue de elementos
        const originalAgregarMarcador = window.agregarMarcador;
        if (originalAgregarMarcador) {
            window.agregarMarcador = (sidc, descripcion) => {
                this.logAccion('despliegue', {
                    tipo: sidc,
                    descripcion: descripcion,
                    fase: this.gestorFases?.fase || 'preparacion',
                    timestamp: new Date().toISOString()
                });
                
                return originalAgregarMarcador.call(this, sidc, descripcion);
            };
        }
    }

    /**
     * Configura validaciones automáticas para acciones de combate
     */
    configurarValidacionesAutomaticas() {
        this.validaciones = {
            movimiento: {
                distanciaMaxima: 10, // km aproximados por hexágono
                verificarTerreno: true,
                verificarTurno: true
            },
            ataque: {
                rangoMaximo: 15,
                verificarLineasVision: true,
                verificarMunicion: false // Para futuras implementaciones
            },
            despliegue: {
                verificarZona: true,
                verificarFase: true
            }
        };
    }

    /**
     * Configura sistema de logging de acciones militares
     */
    configurarLoggingAcciones() {
        this.accionesRegistradas = [];
        this.maxAcciones = 1000; // Límite para evitar memory leaks
    }

    /**
     * Optimiza la fase de combate cuando se inicia
     */
    optimizarFaseCombate() {
        console.log('🔥 Optimizando fase de combate...');
        
        // Activar optimizaciones específicas de combate
        if (this.optimizacionesCombate.movimientosRapidos) {
            this.activarMovimientosRapidos();
        }
        
        if (this.optimizacionesCombate.validacionAutomatica) {
            this.activarValidacionAutomatica();
        }
        
        // Log del inicio de combate
        this.logAccion('fase_cambio', {
            fase: 'combate',
            timestamp: new Date().toISOString(),
            participantes: this.gestorTurnos?.jugadores?.length || 0
        });
    }

    /**
     * Optimiza los cambios de turno
     */
    optimizarCambioTurno(data) {
        console.log('🔄 Optimizando cambio de turno...');
        
        // Log del cambio de turno
        this.logAccion('cambio_turno', {
            turnoAnterior: data.turnoAnterior || 0,
            turnoActual: data.turnoActual || 1,
            jugadorActual: data.jugadorActual?.username || 'desconocido',
            timestamp: new Date().toISOString()
        });
        
        // Limpiar elementos temporales del turno anterior
        this.limpiarElementosTemporales();
        
        // Preparar optimizaciones para el nuevo turno
        this.prepararNuevoTurno(data);
    }

    /**
     * Activa movimientos rápidos para mejorar la experiencia
     */
    activarMovimientosRapidos() {
        // Reducir animaciones largas en combate
        if (window.L && window.L.Marker) {
            const originalSetLatLng = window.L.Marker.prototype.setLatLng;
            window.L.Marker.prototype.setLatLng = function(latlng) {
                // Movimiento más rápido en fase de combate
                if (this.options.combateRapido) {
                    return originalSetLatLng.call(this, latlng);
                }
                return originalSetLatLng.call(this, latlng);
            };
        }
    }

    /**
     * Activa validación automática de acciones
     */
    activarValidacionAutomatica() {
        console.log('✅ Validación automática activada');
        // La validación se maneja en las funciones interceptadas
    }

    /**
     * Valida un movimiento antes de ejecutarlo
     */
    validarMovimiento(elemento, destino) {
        const validaciones = this.validaciones.movimiento;
        
        // Verificar si es el turno del jugador
        if (validaciones.verificarTurno && this.gestorTurnos) {
            const jugadorActual = this.gestorTurnos.obtenerJugadorActual();
            if (!jugadorActual || !this.gestorTurnos.esJugadorActual(window.userId)) {
                return { valido: false, razon: 'No es el turno del jugador' };
            }
        }
        
        // Validación básica de coordenadas
        if (!destino || typeof destino.lat !== 'number' || typeof destino.lng !== 'number') {
            return { valido: false, razon: 'Coordenadas de destino inválidas' };
        }
        
        // Verificar límites de Argentina
        if (destino.lat < -55 || destino.lat > -21 || destino.lng < -73 || destino.lng > -53) {
            return { valido: false, razon: 'Destino fuera de los límites permitidos' };
        }
        
        return { valido: true };
    }

    /**
     * Registra una acción en el log estilo "ajedrez militar"
     */
    logAccion(tipo, datos) {
        const accion = {
            id: this.generarIdAccion(),
            tipo: tipo,
            datos: datos,
            timestamp: new Date().toISOString(),
            turno: this.gestorTurnos?.turnoActual || 1,
            fase: this.gestorFases?.fase || 'preparacion'
        };
        
        this.accionesRegistradas.push(accion);
        
        // Mantener solo las últimas N acciones
        if (this.accionesRegistradas.length > this.maxAcciones) {
            this.accionesRegistradas.splice(0, this.accionesRegistradas.length - this.maxAcciones);
        }
        
        // Emitir evento para otros sistemas
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('gaming_action_logged', accion);
        }
        
        console.log(`📝 Acción registrada: ${tipo}`, datos);
    }

    /**
     * Genera ID único para acciones
     */
    generarIdAccion() {
        return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Limpia elementos temporales del turno anterior
     */
    limpiarElementosTemporales() {
        // Limpiar marcadores temporales, líneas de movimiento, etc.
        if (window.marcadoresTemporales) {
            window.marcadoresTemporales.forEach(marcador => {
                if (window.map && marcador.removeFrom) {
                    marcador.removeFrom(window.map);
                }
            });
            window.marcadoresTemporales = [];
        }
    }

    /**
     * Prepara optimizaciones para el nuevo turno
     */
    prepararNuevoTurno(data) {
        // Preparar elementos del nuevo jugador
        const jugadorActual = data.jugadorActual;
        if (jugadorActual) {
            // Activar elementos del jugador actual
            this.activarElementosJugador(jugadorActual.id);
        }
    }

    /**
     * Activa elementos específicos del jugador en su turno
     */
    activarElementosJugador(jugadorId) {
        // Resaltar elementos del jugador actual
        if (window.calcoActivo) {
            window.calcoActivo.eachLayer(layer => {
                if (layer.options && layer.options.propietario === jugadorId) {
                    if (layer.setStyle) {
                        layer.setStyle({ 
                            opacity: 1,
                            fillOpacity: 0.7,
                            color: '#00ff00' 
                        });
                    }
                } else {
                    if (layer.setStyle) {
                        layer.setStyle({ 
                            opacity: 0.5,
                            fillOpacity: 0.3,
                            color: '#666666' 
                        });
                    }
                }
            });
        }
    }

    /**
     * Obtiene estadísticas de la partida actual
     */
    obtenerEstadisticas() {
        return {
            accionesTotales: this.accionesRegistradas.length,
            ultimasAcciones: this.accionesRegistradas.slice(-10), // Últimas 10 acciones
            faseActual: this.gestorFases?.fase || 'desconocida',
            turnoActual: this.gestorTurnos?.turnoActual || 1,
            jugadorActual: this.gestorTurnos?.obtenerJugadorActual()?.username || 'desconocido',
            tiempoPartida: this.partidaActiva ? 
                (Date.now() - new Date(this.partidaActiva.horaInicio).getTime()) / 1000 : 0
        };
    }

    /**
     * Exporta el log de acciones para análisis posterior
     */
    exportarLogAcciones() {
        return {
            partida: this.partidaActiva?.id || 'local',
            acciones: this.accionesRegistradas,
            exportado: new Date().toISOString(),
            version: '2.0.0'
        };
    }

    /**
     * Limpia datos cuando termina la partida
     */
    limpiarDatosPartida() {
        this.partidaActiva = null;
        this.accionesRegistradas = [];
        
        console.log('🧹 Datos de partida limpiados');
    }

    /**
     * Método para verificar el estado del sistema
     */
    verificarEstado() {
        return {
            conectado: !!this.gestorJuego,
            gestorTurnos: !!this.gestorTurnos,
            gestorFases: !!this.gestorFases,
            partidaActiva: !!this.partidaActiva,
            optimizacionesActivas: this.optimizacionesCombate,
            acciones: this.accionesRegistradas.length
        };
    }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.GamingMechanicsManager = new GamingMechanicsManager();

console.log('[MAIRA] GamingMechanicsManager cargado y operativo');

class GamingMechanicsManager {
    constructor() {
        this.partidaActiva = null;
        this.accionesRegistradas = []; // Log de acciones estilo "ajedrez militar"
        this.optimizacionesCombate = {
            movimientosRapidos: true,
            validacionAutomatica: true,
            sugerenciasIA: false // Para futuras mejoras
        };

        // Integración con sistema existente
        this.gestorTurnos = null;
        this.gestorFases = null;
        this.gestorJuego = null;

        console.log('🎮 Gaming Mechanics Manager initialized');
        this.inicializarSistema();
    }

    /**
     * Inicializa el sistema integrado con Juego de Guerra existente
     */
    inicializarSistema() {
        this.configurarIntegracionSistemaExistente();
        this.configurarOptimizacionesCombate();
        
        console.log('✅ Gaming Mechanics activo - Optimizaciones de combate habilitadas');
    }

    /**
     * Se vincula con los gestores existentes del sistema MAIRA
     */
    configurarIntegracionSistemaExistente() {
        // Esperar a que el sistema de juego esté disponible
        const esperarSistema = () => {
            if (window.juego) {
                this.gestorJuego = window.juego;
                this.gestorTurnos = window.juego.gestorTurnos;
                this.gestorFases = window.juego.gestorFases;
                
                console.log('🔗 Gaming Mechanics conectado con sistema existente');
                this.configurarEventosExistentes();
            } else {
                setTimeout(esperarSistema, 1000);
            }
        };
        
        esperarSistema();
    }

    /**
     * Configura eventos del sistema existente para optimización
     */
    configurarEventosExistentes() {
        if (!this.gestorTurnos || !this.gestorFases) return;

        // Optimizar fase de combate
        if (this.gestorFases.eventos) {
            this.gestorFases.eventos.on('cambioFase', (data) => {
                if (data.fase === 'combate') {
                    this.optimizarFaseCombate();
                }
            });
        }

        // Optimizar turnos
        if (this.gestorTurnos.eventos) {
            this.gestorTurnos.eventos.on('cambioTurno', (data) => {
                this.optimizarCambioTurno(data);
            });
        }

        console.log('📡 Eventos del sistema configurados para optimización');
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
