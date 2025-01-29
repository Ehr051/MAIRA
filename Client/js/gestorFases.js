
// Agregar estas constantes al inicio de GestorFases
const ESTILOS_DIBUJO = {
    sector: {
        stroke: true,
        color: '#ff7800',
        weight: 2,
        opacity: 0.8,
        fill: true,
        fillColor: '#ff7800',
        fillOpacity: 0.2,
        clickable: true
    },
    zonaRoja: {
        stroke: true,
        color: '#ff0000',
        weight: 2,
        opacity: 0.8,
        fill: true,
        fillColor: '#ff0000',
        fillOpacity: 0.2,
        clickable: true
    },
    zonaAzul: {
        stroke: true,
        color: '#0000ff',
        weight: 2,
        opacity: 0.8,
        fill: true,
        fillColor: '#0000ff',
        fillOpacity: 0.2,
        clickable: true
    }
};

// Modificar el método inicializarHerramientasDibujo


class GestorFases extends GestorBase {
    constructor() {
        super();
        this.fase = 'preparacion';
        this.subfase = 'definicion_sector';
        this.sectorDefinido = false;
        this.zonasDespliegue = {
            azul: null,
            rojo: null
        };
        this.herramientasDibujo = {};
        this.sectorTemporal = null;
        this.sectorConfirmado = false;
        this.zonaPendiente = null;
        this.dibujandoZona = null;
        this.jugadores = [];
        this.director = null;
        this.esDirectorTemporal = false;
        this.primerJugador = null;
        this.zonasLayers = {}; // Añadido para manejar las capas de zonas
        this.elementosVisibles = {
            sector: null,
            zonaRoja: null,
            zonaAzul: null
        };
    }


    configurarEventosSocket() {
        const socket = this.gestorJuego?.gestorComunicacion?.socket;
        if (!socket) return;
    
        // Eventos de Sector
        // Modificar la configuración de eventos socket para incluir jugadorId y partidaCodigo en todas las emisiones
        socket.on('sectorConfirmado', (datos) => {
            console.log('Sector confirmado recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.actualizarSectorRemoto({
                    ...datos,
                    partidaCodigo: window.codigoPartida
                });
            }
        });

        socket.on('cambioFase', (datos) => {
            console.log('Cambio de fase recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                // Forzar limpieza de UI
                const confirmaciones = document.querySelectorAll('.botones-confirmacion-zona, .botones-confirmacion-sector');
                confirmaciones.forEach(elem => elem.remove());

                this.fase = datos.nuevaFase;
                this.subfase = datos.nuevaSubfase;
                this.actualizarInterfazFase(datos);
            }
        });
    
        // Eventos de Zonas
        socket.on('zonaConfirmada', (datos) => {
            console.log('Zona confirmada recibida:', datos);
            if (datos.jugadorId !== window.userId) {
                this.actualizarZonaRemota(datos.zona);
                if (datos.zona.equipo === 'rojo') {
                    this.habilitarZonaAzul();
                } else if (datos.zona.equipo === 'azul') {
                    this.finalizarDefinicionZonas();
                }
            }
        });
    
        // Eventos de Despliegue
        socket.on('unidadDesplegada', (datos) => {
            console.log('Unidad desplegada recibida:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorAcciones?.crearUnidadRemota(datos.unidad);
            }
        });
    
        socket.on('unidadMovida', (datos) => {
            console.log('Movimiento de unidad recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorAcciones?.moverUnidadRemota(datos.unidadId, datos.nuevaPosicion);
            }
        });
    
        socket.on('unidadEliminada', (datos) => {
            console.log('Eliminación de unidad recibida:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorAcciones?.eliminarUnidadRemota(datos.unidadId);
            }
        });
    
        // Eventos de Estado de Jugadores
        socket.on('jugadorListo', (datos) => {
            console.log('Jugador listo recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.marcarJugadorListoRemoto(datos.jugadorId, datos.equipo);
            }
        });
    
        socket.on('inicioDespliegue', (datos) => {
            console.log('Inicio de despliegue recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.iniciarDespliegueRemoto();
            }
        });
    
        // Eventos de Combate
        socket.on('inicioCombate', (datos) => {
            console.log('Inicio de combate recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.iniciarFaseCombateRemoto();
            }
        });
    
        // Eventos de Sincronización
        socket.on('solicitarEstado', (datos) => {
            console.log('Solicitud de estado recibida');
            if (this.esDirector(window.userId)) {
                this.enviarEstadoActual();
            }
        });
    
        socket.on('estadoActual', (datos) => {
            console.log('Estado actual recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.actualizarEstadoCompleto(datos);
            }
        });
    
        // Al conectar, solicitar estado actual si no es director
        if (!this.esDirector(window.userId)) {
            socket.emit('solicitarEstado', {
                partidaCodigo: window.codigoPartida,
                jugadorId: window.userId
            });
        }
    
        // Emitir unión a las salas necesarias
        socket.emit('unirsePartida', {
            codigo: window.codigoPartida,
            userId: window.userId,
            equipo: window.equipoJugador
        });
    
        // También unirse a la sala de su equipo
        socket.emit('joinRoom', `equipo_${window.equipoJugador}`);
    }
    
    // Métodos auxiliares para el manejo de eventos remotos
    enviarEstadoActual() {
        const estado = {
            fase: this.fase,
            subfase: this.subfase,
            sectorConfirmado: this.sectorConfirmado,
            sector: this.sectorLayer ? {
                bounds: this.sectorJuego.toBBoxString(),
                coordenadas: this.sectorLayer.getLatLngs()
            } : null,
            zonas: Object.fromEntries(
                Object.entries(this.zonasLayers).map(([equipo, layer]) => [
                    equipo,
                    layer ? {
                        coordenadas: layer.getLatLngs(),
                        bounds: layer.getBounds()
                    } : null
                ])
            ),
            jugadores: this.jugadores,
            timestamp: new Date().toISOString()
        };
    
        this.gestorJuego?.gestorComunicacion?.socket.emit('estadoActual', {
            estado,
            partidaCodigo: window.codigoPartida,
            jugadorId: window.userId
        });
    }
    

    
    // En gestorFases.js
    actualizarSectorRemoto(datos) {
        console.log('[FASES] Inicio actualizarSectorRemoto:', datos);
    
        try {
            // 1. Validaciones
            if (!window.calcoActivo) {
                console.error('[FASES] calcoActivo no disponible');
                return false;
            }
    
            if (!datos.coordenadas) {
                console.error('[FASES] Datos de coordenadas no válidos:', datos);
                return false;
            }
    
            // 2. Limpiar sector existente
            if (this.sectorLayer) {
                window.calcoActivo.removeLayer(this.sectorLayer);
                this.sectorLayer = null;
            }
    
            // 3. Crear y configurar nuevo sector
            this.sectorLayer = L.polygon(datos.coordenadas, ESTILOS_DIBUJO.sector);
            this.sectorLayer.addTo(window.calcoActivo);
            
            // 4. Actualizar estado
            this.sectorJuego = this.sectorLayer.getBounds();
            this.sectorDefinido = true;
            this.sectorConfirmado = true;
            this.sectorTemporal = null;
            this.dibujandoSector = false;
    
            // 5. Zoom al sector
            window.mapa.flyToBounds(this.sectorJuego, {
                padding: [50, 50],
                duration: 0.5
            });
    
            console.log('[FASES] Sector actualizado correctamente');
            return true;
    
        } catch (error) {
            console.error('[FASES] Error crítico actualizando sector:', error);
            return false;
        }
    }
    
    // En gestorFases.js
    confirmarZona(equipo) {
        if (!this.puedeDefinirZonas(window.userId)) return;
    
        try {
            if (!this.zonaTemporalLayer) return;
    
            const zonaData = {
                tipo: 'zona',
                equipo: equipo,
                coordenadas: this.zonaTemporalLayer.getLatLngs(),
                bounds: this.zonaTemporalLayer.getBounds(),
                estilo: equipo === 'azul' ? ESTILOS_DIBUJO.zonaAzul : ESTILOS_DIBUJO.zonaRoja
            };
    
            // Emitir al servidor con todos los datos necesarios
            if (this.gestorJuego?.gestorComunicacion?.socket) {
                this.gestorJuego.gestorComunicacion.socket.emit('zonaConfirmada', {
                    zona: zonaData,
                    jugadorId: window.userId,
                    partidaCodigo: window.codigoPartida,
                    cambiarFase: equipo === 'azul'  // Indicar si debe cambiar fase
                });
            }
    
            // Establecer zona
            this.zonasLayers[equipo] = this.zonaTemporalLayer;
            this.zonasDespliegue[equipo] = zonaData.bounds;
    
            // Limpiar estado temporal
            this.zonaTemporalLayer = null;
            this.zonaPendiente = null;
    
            // Enviar evento de cambio de fase si es necesario
            if (equipo === 'azul') {
                this.gestorJuego?.gestorComunicacion?.socket.emit('inicioDespliegue', {
                    jugadorId: window.userId,
                    partidaCodigo: window.codigoPartida,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error al confirmar zona:', error);
        }
    }



// En gestorFases.js
actualizarZonaRemota(zonaData) {
    const equipo = zonaData.equipo;
    
    if (!equipo) return false;

    try {
        // Limpiar zona existente
        if (this.zonasLayers[equipo]) {
            window.calcoActivo.removeLayer(this.zonasLayers[equipo]);
        }

        // Crear nueva zona
        this.zonasLayers[equipo] = L.polygon(zonaData.coordenadas, zonaData.estilo);
        this.zonasLayers[equipo].addTo(window.calcoActivo);
        this.zonasDespliegue[equipo] = zonaData.bounds;

        return true;
    } catch (error) {
        console.error('Error actualizando zona remota:', error);
        return false;
    }
}
    


    actualizarEstadoCompleto(datos) {
        const estado = datos.estado;
        
        // Actualizar fase y subfase
        this.fase = estado.fase;
        this.subfase = estado.subfase;
        
        // Actualizar sector si existe
        if (estado.sector) {
            this.actualizarSectorRemoto(estado.sector);
        }
        
        // Actualizar zonas si existen
        if (estado.zonas) {
            Object.entries(estado.zonas).forEach(([equipo, zonaData]) => {
                if (zonaData) {
                    this.actualizarZonaRemota({ equipo, ...zonaData });
                }
            });
        }
        
        // Actualizar estado de jugadores
        this.jugadores = estado.jugadores;
        
        // Actualizar interfaz
        this.actualizarInterfazFase({
            nuevaFase: estado.fase,
            nuevaSubfase: estado.subfase,
            timestamp: estado.timestamp
        });
    }

    // Métodos de inicialización y configuración
    async inicializar(config) {
        try {
            console.log('Inicializando GestorFases con config:', config);
            
            // Validar configuración
            this.validarConfiguracion(config);
            this.jugadores = config.jugadores;
            this.gestorJuego = config.gestorJuego;
            
            // Determinar director
            this.establecerDirector();
            
            await this.inicializarHerramientasDibujo();
            this.configurarEventos();
            
            // Crear interfaz inicial
            this.crearInterfazFases();
            
            // Iniciar en fase de preparación
            this.cambiarFase('preparacion', 'definicion_sector');
            
            this.configurarEventosSocket();
            return true;
        } catch (error) {
            console.error('Error en inicialización de GestorFases:', error);
            return false;
        }
    }

    // Métodos de gestión de jugadores
    obtenerJugadorActual() {
        if (!window.userId) return null;
        return this.jugadores.find(j => j.id === window.userId);
    }

    esDirector(jugadorId) {
        return (this.director && this.director.id === jugadorId) ||
               (this.esDirectorTemporal && this.primerJugador && this.primerJugador.id === jugadorId);
    }


    async inicializarHerramientasDibujo() {
        if (!window.mapa) {
            throw new Error('Mapa no inicializado');
        }
    
        try {
            this.herramientasDibujo = {
                sector: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: ESTILOS_DIBUJO.sector
                }),
                zonaRoja: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: ESTILOS_DIBUJO.zonaRoja
                }),
                zonaAzul: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: ESTILOS_DIBUJO.zonaAzul
                })
            };
    
            

            // Asegurarse de que los estilos se apliquen al crear
            window.mapa.on(L.Draw.Event.CREATED, (e) => {
                const tipo = this.dibujandoSector ? 'sector' : 
                            this.dibujandoZona === 'rojo' ? 'zonaRoja' : 'zonaAzul';
                e.layer.setStyle(ESTILOS_DIBUJO[tipo]);
            });
    
            console.log('Herramientas de dibujo inicializadas');
        } catch (error) {
            console.error('Error al inicializar herramientas de dibujo:', error);
            throw error;
        }
    }


    habilitarZonaAzul() {
        // Habilitar la definición de la zona azul
        this.zonaPendiente = null;
        this.dibujandoZona = null;
        this.mostrarMensajeAyuda('Zona roja confirmada. Ahora puedes definir la zona azul.');
        this.actualizarBotonesFase(); // Esto habilitará el botón de zona azul
    }

    // En GestorFases

    finalizarDefinicionZonas() {
        // Limpiar botones primero - esto está bien pero no es suficiente
        const botonesConfirmacion = document.querySelectorAll('.botones-confirmacion-zona, .botones-confirmacion-sector');
        botonesConfirmacion.forEach(elem => elem.remove());
    
        // Necesitamos limpiar también el panel de fases
        const panelFases = document.getElementById('panel-fases');
        if (panelFases) {
            panelFases.innerHTML = ''; // Limpiar contenido actual
        }
    
        // Cambiar fase a despliegue y emitir
        this.cambiarFase('preparacion', 'despliegue');
    
        // Notificar al servidor
        if (this.gestorJuego?.gestorComunicacion?.socket) {
            this.gestorJuego.gestorComunicacion.socket.emit('inicioDespliegue', {
                jugadorId: window.userId,
                partidaCodigo: window.codigoPartida,
                timestamp: new Date().toISOString()
            });
        }
    
        // Actualizar interfaz para fase de despliegue
        this.actualizarInterfazDespliegue();
    }
    
    // Agregar este nuevo método
    actualizarInterfazDespliegue() {
        const panelFases = document.getElementById('panel-fases');
        if (!panelFases) return;
    
        // Crear nueva interfaz de despliegue
        panelFases.innerHTML = `
            <div class="fase-actual">Fase: preparación - despliegue</div>
            <div class="botones-fase">
                ${this.obtenerBotonesDespliegue()}
            </div>
        `;
    
        // Mostrar mensaje de ayuda
        this.mostrarMensajeAyuda('Despliega tus unidades en la zona asignada');
    }
    
    obtenerBotonesDespliegue() {
        const jugadorActual = this.obtenerJugadorActual();
        if (!jugadorActual) return '';
    
        return `
            <button id="btn-listo-despliegue" ${jugadorActual.listo ? 'disabled' : ''}>
                Listo para combate
            </button>
        `;
    }

// Añadir método para debug que podemos llamar para verificar emisiones
verificarSincronizacion() {
    const estado = {
        fase: this.fase,
        subfase: this.subfase,
        sectorConfirmado: this.sectorConfirmado,
        zonasDefinidas: Object.keys(this.zonasDespliegue).filter(k => this.zonasDespliegue[k]),
        sectorVisible: !!this.sectorLayer,
        socket: !!this.gestorJuego?.gestorComunicacion?.socket?.connected
    };
    console.log('Estado sincronización:', estado);
}
limpiarInterfazAnterior() {
    // Limpiar paneles de confirmación
    const confirmaciones = document.querySelectorAll(
        '.botones-confirmacion-zona, .botones-confirmacion-sector'
    );
    confirmaciones.forEach(elem => elem.remove());

    // Limpiar panel de control de fases
    const panelFases = document.getElementById('panel-fases');
    if (panelFases) {
        panelFases.innerHTML = '';
    }

    // Deshabilitar herramientas de dibujo
    Object.values(this.herramientasDibujo).forEach(herramienta => {
        if (herramienta?.disable) {
            herramienta.disable();
        }
    });
}
    establecerDirector() {
        this.director = this.jugadores.find(j => j.rol === 'director');
        this.esDirectorTemporal = !this.director;
        
        if (this.esDirectorTemporal) {
            this.primerJugador = this.jugadores.find(j => j.equipo === 'azul') || this.jugadores[0];
            if (this.primerJugador) {
                this.primerJugador.rolTemporal = 'director';
                console.log('Director temporal establecido:', this.primerJugador);
            }
        }
    }

    puedeDefinirSector(jugadorId) {
        return this.esDirector(jugadorId) && 
               this.fase === 'preparacion' && 
               this.subfase === 'definicion_sector';
    }

    puedeDefinirZonas(jugadorId) {
        return this.esDirector(jugadorId) && 
               this.fase === 'preparacion' && 
               this.subfase === 'definicion_zonas' &&
               this.sectorConfirmado;
    }

    // Métodos de interfaz y mensajes
    mostrarMensajeAyuda(mensaje) {
        if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            this.gestorJuego.gestorInterfaz.mostrarMensaje(mensaje);
        } else {
            console.log('Mensaje de ayuda:', mensaje);
        }
    }

    // Métodos de manejo de dibujo y herramientas
    async inicializarHerramientasDibujo() {
        if (!window.mapa) {
            throw new Error('Mapa no inicializado');
        }

        try {
            this.herramientasDibujo = {
                sector: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: {
                        stroke: true,
                        color: '#ff7800',
                        weight: 2,
                        opacity: 0.8,
                        fill: false,
                        clickable: true,
                        editable: true
                    }
                }),
                zonaRoja: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: {
                        stroke: true,
                        color: '#ff0000',
                        weight: 2,
                        opacity: 0.8,
                        fill: true,
                        fillColor: '#ff0000',
                        fillOpacity: 0.1,
                        clickable: true
                    }
                }),
                zonaAzul: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    shapeOptions: {
                        stroke: true,
                        color: '#0000ff',
                        weight: 2,
                        opacity: 0.8,
                        fill: true,
                        fillColor: '#0000ff',
                        fillOpacity: 0.1,
                        clickable: true
                    }
                })
            };

            console.log('Herramientas de dibujo inicializadas');
        } catch (error) {
            console.error('Error al inicializar herramientas de dibujo:', error);
            throw error;
        }
    }

    configurarEventos() {
        if (window.mapa) {
            window.mapa.on(L.Draw.Event.CREATED, this.manejarDibujoCreado.bind(this));
            window.mapa.on(L.Draw.Event.DRAWSTART, this.manejarInicioDibujo.bind(this));
            window.mapa.on(L.Draw.Event.DRAWSTOP, this.manejarFinDibujo.bind(this));
        }
    }

    

    manejarInicioDibujo(e) {
        const mensaje = this.dibujandoSector ? 
            'Dibujando sector de juego...' :
            `Dibujando zona de despliegue ${this.dibujandoZona}...`;
        this.mostrarMensajeAyuda(mensaje);
    }



    // Métodos de manejo de sector
    iniciarDefinicionSector() {
        if (!this.puedeDefinirSector(window.userId)) {
            this.mostrarMensajeAyuda('No tienes permisos para definir el sector');
            return;
        }

        // Limpiar sector anterior
        if (this.sectorLayer) {
            window.calcoActivo.removeLayer(this.sectorLayer);
            this.sectorLayer = null;
        }

        // Activar herramienta de dibujo
        if (this.herramientasDibujo.sector) {
            this.dibujandoSector = true;
            this.dibujandoZona = null;
            this.herramientasDibujo.sector.enable();
            this.mostrarMensajeAyuda('Dibuja un polígono para definir el sector de juego');
        }
    }

    // Métodos de manejo de zonas
    iniciarDefinicionZona(equipo) {
        if (!this.sectorConfirmado) {
            this.mostrarMensajeAyuda('Primero debe confirmarse el sector');
            return false;
        }

        if (equipo === 'azul' && !this.zonasDespliegue.rojo) {
            this.mostrarMensajeAyuda('Primero debe definirse la zona roja');
            return false;
        }

        const herramienta = this.herramientasDibujo[equipo === 'rojo' ? 'zonaRoja' : 'zonaAzul'];
        if (!herramienta) return false;

        this.zonaPendiente = equipo;
        this.dibujandoZona = equipo;
        herramienta.enable();
        
        this.mostrarMensajeAyuda(`Dibuja la zona de despliegue para el equipo ${equipo}`);
        return true;
    }

    


    // Métodos de cambio de fase
    

    validarConfiguracion(config) {
        if (!config || !Array.isArray(config.jugadores) || config.jugadores.length === 0) {
            throw new Error("Configuración inválida: La lista de jugadores es obligatoria");
        }
    }

    validarZonaEnSector(bounds) {
        if (!this.sectorJuego) return false;
        return this.sectorJuego.contains(bounds);
    }


    actualizarFaseRemota(datos) {
        if (datos.timestamp <= this.ultimaActualizacion) return;
        
        this.fase = datos.nuevaFase;
        this.subfase = datos.nuevaSubfase;
        this.actualizarInterfazFase(datos);
        this.ultimaActualizacion = datos.timestamp;
    }

    actualizarInterfazFase(datos) {
        // Actualizar estado interno
        this.fase = datos.nuevaFase;
        this.subfase = datos.nuevaSubfase;
    
        // Actualizar mensajes según la fase
        if (!this.esDirector(window.userId)) {
            switch (datos.nuevaFase) {
                case 'preparacion':
                    switch (datos.nuevaSubfase) {
                        case 'definicion_sector':
                            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                                'El director está definiendo el sector de juego'
                            );
                            break;
                        case 'definicion_zonas':
                            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                                'El director está definiendo las zonas de despliegue'
                            );
                            break;
                        case 'despliegue':
                            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                                'Fase de despliegue - Despliega tus unidades en tu zona asignada'
                            );
                            break;
                    }
                    break;
                case 'combate':
                    this.gestorJuego.gestorInterfaz.mostrarMensaje(
                        'Fase de combate iniciada'
                    );
                    break;
            }
        }
    
        // Forzar actualización de interfaz completa
        this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
    
        // Notificar a otros gestores
        this.emisorEventos.emit('faseCambiada', datos);
    }

// 1. En gestorFases.js - Modificar confirmarSector()
confirmarSector() {
    if (!this.puedeDefinirSector(window.userId)) {
        this.mostrarMensajeAyuda('No tienes permisos para definir el sector');
        return false;
    }

    try {
        if (!this.sectorTemporal && !this.sectorLayer) {
            this.mostrarMensajeAyuda('No hay sector para confirmar');
            return false;
        }

        // 1. Preparar y guardar el sector localmente
        const layerParaConfirmar = this.sectorLayer || this.sectorTemporal;
        this.sectorLayer = layerParaConfirmar;
        this.sectorJuego = this.sectorLayer.getBounds();
        
        // 2. Configurar el sector
        if (this.sectorLayer.editing) {
            this.sectorLayer.editing.disable();
        }
        this.sectorLayer.setStyle({
            color: '#ff7800',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2,
            interactive: false
        });

        // 3. Actualizar estado local
        this.sectorDefinido = true;
        this.sectorConfirmado = true;
        this.sectorTemporal = null;
        this.dibujandoSector = false;

        // 4. Emitir al servidor
        if (this.gestorJuego?.gestorComunicacion?.socket) {
            this.gestorJuego.gestorComunicacion.socket.emit('sectorConfirmado', {
                
                coordenadas: this.sectorLayer.getLatLngs(),
                bounds: this.sectorJuego.toBBoxString(),
                jugadorId: window.userId,
                partidaCodigo: window.codigoPartida,
                cambiarFase: true
            });
        }

        // 5. Actualizar interfaz local
        this.cambiarFase('preparacion', 'definicion_zonas');
        this.actualizarBotonesFase();
        
        return true;

    } catch (error) {
        console.error('Error al confirmar sector:', error);
        this.mostrarMensajeAyuda('Error al confirmar el sector');
        return false;
    }
}

// Modificar el manejador de sectorConfirmado
manejarSectorConfirmado(datos) {
    console.log('sectorConfirmado recibido:', datos);
    
    if (datos.jugadorId === window.userId) return;

    try {
        // 1. Actualizar el sector físicamente
        const exito = this.actualizarSectorRemoto(datos);
        if (!exito) return;

        // 2. Si se debe cambiar fase, hacerlo
        if (datos.cambiarFase) {
            // Cambiar fase
            this.cambiarFase('preparacion', 'definicion_zonas');
            
            // Actualizar interfaz
            this.actualizarBotonesFase();
            
            // Actualizar mensaje según rol
            const esDirector = this.esDirector(window.userId);
            const mensaje = esDirector ? 
                'Define la zona de despliegue del equipo rojo' : 
                'El director está definiendo las zonas de despliegue';
            this.mostrarMensajeAyuda(mensaje);
        }
    } catch (error) {
        console.error('Error procesando sectorConfirmado:', error);
    }
}

actualizarBotonesFase() {
    const panelFases = document.getElementById('panel-fases');
    if (!panelFases) return;

    const esDirector = this.esDirector(window.userId);
    const jugadorActual = this.obtenerJugadorActual();

    console.log('Actualizando botones fase:', {
        fase: this.fase,
        subfase: this.subfase,
        esDirector,
        sectorConfirmado: this.sectorConfirmado,
        zonasDefinidas: this.zonasDespliegue
    });

    // Limpiar panel
    panelFases.innerHTML = '';

    // Fase actual
    const faseActual = document.createElement('div');
    faseActual.className = 'fase-actual';
    faseActual.textContent = `Fase: ${this.fase} - ${this.subfase}`;
    panelFases.appendChild(faseActual);

    // Contenedor de botones
    const botonesFase = document.createElement('div');
    botonesFase.className = 'botones-fase';
    
    // Generar contenido según fase
    let contenido = '';
    if (this.fase === 'preparacion') {
        switch (this.subfase) {
            case 'definicion_sector':
                if (esDirector) {
                    contenido = `
                        <button id="btn-definir-sector" ${this.dibujandoSector ? 'disabled' : ''}>
                            Definir Sector
                        </button>
                        ${this.sectorTemporal || this.sectorLayer ? 
                            '<button id="btn-confirmar-sector">Confirmar Sector</button>' : 
                            ''}
                    `;
                } else {
                    contenido = '<div class="estado-fase">El director está definiendo el sector de juego...</div>';
                }
                break;

            case 'definicion_zonas':
                if (esDirector) {
                    contenido = `
                        <button id="btn-zona-roja" ${this.zonasDespliegue.rojo ? 'disabled' : ''}>
                            Definir Zona Roja
                        </button>
                        <button id="btn-zona-azul" 
                            ${!this.zonasDespliegue.rojo || this.zonasDespliegue.azul ? 'disabled' : ''}>
                            Definir Zona Azul
                        </button>
                    `;
                } else {
                    contenido = '<div class="estado-fase">El director está definiendo las zonas de despliegue...</div>';
                }
                break;
                case 'despliegue':
                    const btnListo = document.createElement('button');
                    btnListo.textContent = 'Listo para combate';
                    btnListo.disabled = jugadorActual?.listo;
                    btnListo.onclick = () => this.marcarJugadorListo();
                    panelFases.appendChild(btnListo);
                    break;
        }
    }

    botonesFase.innerHTML = contenido;
    panelFases.appendChild(botonesFase);

    // Reconfigurar eventos
    this.configurarEventosBotones();
}

cambiarFase(fase, subfase) {
    this.log(`Cambiando fase a: ${fase}, subfase: ${subfase}`);
    
    // 1. Limpiar estado anterior
    this.limpiarEstadoFaseAnterior(this.fase, this.subfase);
    
    // 2. Actualizar estado interno
    this.fase = fase;
    this.subfase = subfase;
    
    // 3. Actualizar otros gestores
    this.gestorJuego?.gestorTurnos?.actualizarSegunFase(fase, subfase);
    this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
    
    // 4. Emitir evento de cambio
    this.emisorEventos.emit('cambioFase', {
        fase,
        subfase,
        timestamp: new Date().toISOString()
    });

    // 5. Log para debug
    this.mostrarEstadoActual();
}

limpiarEstadoFaseAnterior(faseAnterior, subfaseAnterior) {
    // Deshabilitar todas las herramientas de dibujo
    Object.values(this.herramientasDibujo).forEach(herramienta => {
        if (herramienta?.disable) {
            herramienta.disable();
        }
    });

    // Limpiar estado temporal
    if (subfaseAnterior === 'definicion_sector') {
        this.sectorTemporal = null;
        this.dibujandoSector = false;
    } else if (subfaseAnterior === 'definicion_zonas') {
        this.zonaTemporalLayer = null;
        this.dibujandoZona = null;
        this.zonaPendiente = null;
    }

    // Limpiar cualquier botón de confirmación existente
    const confirmacionSector = document.querySelector('.botones-confirmacion-sector');
    const confirmacionZona = document.querySelector('.botones-confirmacion-zona');
    if (confirmacionSector) confirmacionSector.remove();
    if (confirmacionZona) confirmacionZona.remove();
}


validarFaseActual() {
    console.log('Estado actual:', {
        fase: this.fase,
        subfase: this.subfase,
        sectorConfirmado: this.sectorConfirmado,
        zonasConfirmadas: Object.keys(this.zonasDespliegue).filter(k => this.zonasDespliegue[k]),
        esDirector: this.esDirector(window.userId)
    });
}

    // Añadir método para debug
    mostrarEstadoActual() {
        console.log('Estado actual de la fase:', {
            fase: this.fase,
            subfase: this.subfase,
            sectorConfirmado: this.sectorConfirmado,
            zonasConfirmadas: this.zonasDespliegue,
            director: this.director?.username,
            timestamp: new Date().toISOString()
        });
    }

    actualizarVisibilidadZonas() {
        const esDirector = this.esDirector(window.userId);
        
        Object.entries(this.zonasLayers).forEach(([equipo, layer]) => {
            if (!layer) return;
            
            // Director ve todas las zonas
            if (esDirector) {
                layer.setStyle({ opacity: 1, fillOpacity: 0.2 });
                return;
            }
    
            // Jugadores solo ven su zona
            if (equipo === window.equipoJugador) {
                layer.setStyle({ opacity: 1, fillOpacity: 0.2 });
            } else {
                layer.setStyle({ opacity: 0, fillOpacity: 0 });
            }
        });
    }

    actualizarInterfaz() {
        this.actualizarBotonesFase();
        if (this.gestorJuego?.gestorInterfaz) {
            this.gestorJuego.gestorInterfaz.actualizarInterfazCompleta();
        }
    }

    crearInterfazFases() {
        // Crear el panel de control de fases si no existe
        let panelFases = document.getElementById('panel-fases');
        if (!panelFases) {
            panelFases = document.createElement('div');
            panelFases.id = 'panel-fases';
            panelFases.className = 'panel-control';
            document.body.appendChild(panelFases);
        }

        // Agregar estilos
        const estilos = document.createElement('style');
        estilos.textContent = `
            .panel-control {
                position: fixed;
                top: 20px;
                left: 20px;
                background: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
            }
            .panel-control button {
                margin: 5px;
                padding: 8px 15px;
                border: none;
                border-radius: 3px;
                background: #2196F3;
                color: white;
                cursor: pointer;
            }
            .panel-control button:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .fase-actual {
                font-weight: bold;
                margin-bottom: 10px;
            }
            .botones-confirmacion,
            .botones-confirmacion-zona {
                margin-top: 10px;
                display: flex;
                gap: 10px;
            }
            .btn-confirmar {
                background: #4CAF50;
            }
            .btn-cancelar {
                background: #f44336;
            }
        `;
        document.head.appendChild(estilos);

        this.actualizarBotonesFase();
    }


    obtenerBotonesFase(esDirector, jugador) {
        if (this.fase === 'preparacion') {
            switch (this.subfase) {
                case 'definicion_sector':
                    if (esDirector || this.esDirectorTemporal && this.primerJugador?.id === jugador?.id) {
                        return `
                            <button id="btn-definir-sector">Definir Sector</button>
                            ${this.sectorTemporal ? '<button id="btn-confirmar-sector">Confirmar Sector</button>' : ''}
                        `;
                    } else {
                        return `<div class="estado-fase">El director está definiendo el sector de juego...</div>`;
                    }
                    break;
                case 'definicion_zonas':
                    if (esDirector || this.esDirectorTemporal) {
                        return `
                            <button id="btn-zona-roja" ${this.zonasDespliegue.rojo ? 'disabled' : ''}>
                                Definir Zona Roja
                            </button>
                            <button id="btn-zona-azul" ${!this.zonasDespliegue.rojo || this.zonasDespliegue.azul ? 'disabled' : ''}>
                                Definir Zona Azul
                            </button>
                            ${this.zonasDespliegue.azul && this.zonasDespliegue.rojo ? '<button id="btn-iniciar-despliegue">Iniciar Despliegue</button>' : ''}
                        `;
                    }
                    break;
                case 'despliegue':
                    return `
                        <button id="btn-listo-despliegue" ${jugador?.listo ? 'disabled' : ''}>
                            Listo para combate
                        </button>
                    `;
            }
        }
        return '';
    }

    configurarEventosBotones() {
        const btnDefinirSector = document.getElementById('btn-definir-sector');
        if (btnDefinirSector) {
            btnDefinirSector.onclick = () => this.iniciarDefinicionSector();
        }

        const btnConfirmarSector = document.getElementById('btn-confirmar-sector');
        if (btnConfirmarSector) {
            btnConfirmarSector.onclick = () => this.confirmarSector();
        }

        const btnZonaRoja = document.getElementById('btn-zona-roja');
        if (btnZonaRoja) {
            btnZonaRoja.onclick = () => this.iniciarDefinicionZona('rojo');
        }

        const btnZonaAzul = document.getElementById('btn-zona-azul');
        if (btnZonaAzul) {
            btnZonaAzul.onclick = () => this.iniciarDefinicionZona('azul');
        }

        const btnIniciarDespliegue = document.getElementById('btn-iniciar-despliegue');
        if (btnIniciarDespliegue) {
            btnIniciarDespliegue.onclick = () => this.iniciarDespliegue();
        }

        const btnListoDespliegue = document.getElementById('btn-listo-despliegue');
            if (btnListoDespliegue) {
                btnListoDespliegue.onclick = () => {
                    // Deshabilitar el botón
                    btnListoDespliegue.disabled = true;
                    
                    // Marcar jugador como listo
                    this.marcarJugadorListo();
                    
                    // Emitir al servidor
                    if (this.gestorJuego?.gestorComunicacion?.socket) {
                        this.gestorJuego.gestorComunicacion.socket.emit('jugadorListo', {
                            jugadorId: window.userId,
                            partidaCodigo: window.codigoPartida,
                            equipo: window.equipoJugador
                        });
                    }
                };
            }
    }

    mostrarBotonFinalizarFase() {
        const container = document.querySelector('.botones-fase');
        if (container && !document.getElementById('btn-finalizar-fase')) {
            const btn = document.createElement('button');
            btn.id = 'btn-finalizar-fase';
            btn.className = 'btn-success';
            btn.textContent = 'Iniciar Fase de Despliegue';
            btn.onclick = () => this.iniciarDespliegue();
            container.appendChild(btn);
        }
    }

    configurarNuevaFase() {
        switch(this.fase) {
            case 'preparacion':
                if (!this.sectorConfirmado && this.subfase === 'definicion_sector') {
                    this.mostrarMensajeAyuda('Define el sector de juego');
                }
                break;
            case 'combate':
                this.iniciarFaseCombate();
                break;
        }
    }
    actualizarBotonesConfirmacionSector() {
        // Primero eliminar botones de confirmación existentes si los hay
        const confirmacionExistente = document.querySelector('.botones-confirmacion-sector');
        if (confirmacionExistente) {
            confirmacionExistente.remove();
        }

        if (!this.sectorTemporal) return;

        const botonesContainer = document.createElement('div');
        botonesContainer.className = 'botones-confirmacion-sector';
        botonesContainer.innerHTML = `
            <div class="mensaje-confirmacion">¿Confirmar este sector?</div>
            <div class="botones">
                <button class="btn-confirmar">Confirmar Sector</button>
                <button class="btn-cancelar">Cancelar</button>
            </div>
        `;

        // Agregar estilos específicos si no existen
        if (!document.getElementById('estilos-confirmacion')) {
            const estilos = document.createElement('style');
            estilos.id = 'estilos-confirmacion';
            estilos.textContent = `
                .botones-confirmacion-sector,
                .botones-confirmacion-zona {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 1000;
                    text-align: center;
                }
                .mensaje-confirmacion {
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                .botones {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                .btn-confirmar, 
                .btn-cancelar {
                    padding: 8px 15px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    color: white;
                    font-weight: bold;
                }
                .btn-confirmar {
                    background-color: #4CAF50;
                }
                .btn-confirmar:hover {
                    background-color: #45a049;
                }
                .btn-cancelar {
                    background-color: #f44336;
                }
                .btn-cancelar:hover {
                    background-color: #da190b;
                }
            `;
            document.head.appendChild(estilos);
        }

        // Agregar eventos
        const btnConfirmar = botonesContainer.querySelector('.btn-confirmar');
        const btnCancelar = botonesContainer.querySelector('.btn-cancelar');

        btnConfirmar.addEventListener('click', () => {
            this.confirmarSector();
            botonesContainer.remove();
        });

        btnCancelar.addEventListener('click', () => {
            if (this.sectorTemporal) {
                window.calcoActivo.removeLayer(this.sectorTemporal);
                this.sectorTemporal = null;
            }
            this.dibujandoSector = false;
            botonesContainer.remove();
            // Reactivar el botón de definir sector
            this.actualizarBotonesFase();
        });

        document.body.appendChild(botonesContainer);
    }

    actualizarBotonesConfirmacionZona(equipo) {
        // Primero eliminar botones de confirmación existentes si los hay
        const confirmacionSector = document.querySelector('.botones-confirmacion-sector');
        if (confirmacionSector) confirmacionSector.remove();


        if (!this.zonaTemporalLayer) return;

        const botonesContainer = document.createElement('div');
        botonesContainer.className = 'botones-confirmacion-zona';
        botonesContainer.innerHTML = `
            <div class="mensaje-confirmacion">¿Confirmar zona ${equipo}?</div>
            <div class="botones">
                <button class="btn-confirmar">Confirmar Zona</button>
                <button class="btn-cancelar">Cancelar</button>
            </div>
        `;

        // Agregar eventos
        const btnConfirmar = botonesContainer.querySelector('.btn-confirmar');
        const btnCancelar = botonesContainer.querySelector('.btn-cancelar');

        btnConfirmar.addEventListener('click', () => {
            this.confirmarZona(equipo);
            botonesContainer.remove();
        });

        btnCancelar.addEventListener('click', () => {
            if (this.zonaTemporalLayer) {
                window.calcoActivo.removeLayer(this.zonaTemporalLayer);
                this.zonaTemporalLayer = null;
            }
            this.dibujandoZona = null;
            this.zonaPendiente = null;
            botonesContainer.remove();
            // Reactivar los botones de zona
            this.actualizarBotonesFase();
        });

        document.body.appendChild(botonesContainer);
    }

    marcarJugadorListo() {
        const jugadorActual = this.obtenerJugadorActual();
        if (!jugadorActual) return;
    
        jugadorActual.listo = true;
    
        // Notificar al servidor
        if (this.gestorJuego?.gestorComunicacion?.socket) {
            this.gestorJuego.gestorComunicacion.socket.emit('jugadorListo', {
                jugadorId: window.userId,
                equipoId: jugadorActual.equipo,
                partidaCodigo: window.codigoPartida // Agregar partidaCodigo
            });
        }
    
        this.actualizarBotonesFase();
        
        // Verificar si todos los jugadores están listos para pasar a fase de combate
        if (this.todosJugadoresListos()) {
            this.iniciarFaseCombate();
        }
    }

    todosJugadoresListos() {
        return this.jugadores.every(jugador => jugador.listo);
    }

    iniciarFaseCombate() {
        this.fase = 'combate';
        this.subfase = 'movimiento';
        
        // Coordinar con GestorTurnos
        if (this.gestorJuego?.gestorTurnos) {
            this.gestorJuego.gestorTurnos.reiniciarTurnos();
            this.gestorJuego.gestorTurnos.iniciarReloj();
        }
        
        this.emisorEventos.emit('faseCombateIniciada', {
            mensaje: 'Iniciando fase de combate'
        });
        
        this.actualizarInterfaz();
    }

    iniciarDespliegue() {
        if (!this.zonasDespliegue.azul || !this.zonasDespliegue.rojo) {
            this.mostrarMensajeAyuda('Deben definirse ambas zonas antes de iniciar el despliegue');
            return false;
        }

        this.subfase = 'despliegue';
        this.actualizarInterfazCompleta();
        this.mostrarMensajeAyuda('Fase de despliegue iniciada');

        return true;
    }

    actualizarPermisosSegunFase(datos) {
        const { nuevaFase, nuevaSubfase } = datos;
        const jugadorActual = this.obtenerJugadorActual();
        
        if (!jugadorActual) return;
        
        switch (nuevaFase) {
            case 'preparacion':
                switch (nuevaSubfase) {
                    case 'definicion_sector':
                        this.mostrarMensajeEstadoSegunRol(jugadorActual);
                        this.actualizarVisibilidadElementos('sector');
                        break;
                    case 'definicion_zonas':
                        this.mostrarMensajeEstadoSegunRol(jugadorActual);
                        this.actualizarVisibilidadElementos('zonas');
                        break;
                    case 'despliegue':
                        this.actualizarVisibilidadElementos('despliegue');
                        break;
                }
                break;
            case 'combate':
                this.actualizarVisibilidadElementos('combate');
                break;
        }
    }

    mostrarMensajeEstadoSegunRol(jugador) {
        if (this.esDirector(jugador.id) || 
            (this.esDirectorTemporal && this.primerJugador.id === jugador.id)) {
            // El director ve los botones de acción
            return;
        }

        // Los demás jugadores ven mensajes de estado
        let mensaje = '';
        switch (this.subfase) {
            case 'definicion_sector':
                mensaje = 'El director está definiendo el sector de juego...';
                break;
            case 'definicion_zonas':
                mensaje = 'El director está definiendo las zonas de despliegue...';
                break;
        }
        
        if (mensaje) {
            this.mostrarMensajeAyuda(mensaje);
        }
    }

    actualizarVisibilidadElementos(contexto) {
        switch (contexto) {
            case 'sector':
                if (this.sectorLayer) {
                    // El sector es visible para todos una vez confirmado
                    this.sectorLayer.setStyle({
                        opacity: 1,
                        fillOpacity: 0.2
                    });
                    // Emitir a todos los jugadores
                    this.emitirCambioElemento('sector', this.sectorLayer);
                }
                break;
            
            case 'zonas':
                // Mostrar zonas solo a los equipos correspondientes
                Object.entries(this.zonasLayers).forEach(([equipo, layer]) => {
                    const esEquipoJugador = this.obtenerJugadorActual()?.equipo === equipo;
                    const esDirector = this.esDirector(window.userId) || this.esDirectorTemporal;
                    
                    if (layer) {
                        if (esEquipoJugador || esDirector) {
                            layer.setStyle({
                                opacity: 1,
                                fillOpacity: 0.2
                            });
                        } else {
                            layer.setStyle({
                                opacity: 0,
                                fillOpacity: 0
                            });
                        }
                        
                        // Emitir solo al equipo correspondiente
                        this.emitirCambioElemento('zona', layer, equipo);
                    }
                });
                break;
        }
    }

    emitirCambioElemento(tipo, elemento, equipo = null) {
        if (!this.gestorJuego?.gestorComunicacion?.socket) return;

        const datos = {
            tipo,
            coordenadas: elemento instanceof L.Marker ? 
                elemento.getLatLng() : 
                elemento.getLatLngs(),
            estilo: elemento.options,
            equipo
        };

        if (equipo) {
            // Emitir solo al equipo específico
            this.gestorJuego.gestorComunicacion.socket.emit('elementoEquipo', {
                ...datos,
                equipoDestino: equipo
            });
        } else {
            // Emitir a todos
            this.gestorJuego.gestorComunicacion.socket.emit('elementoGlobal', datos);
        }
    }

    // Modificar procesarDibujoSector
    procesarDibujoSector(layer) {
        if (!this.puedeDefinirSector(window.userId)) {
            this.mostrarMensajeAyuda('No tienes permisos para definir el sector');
            if (layer) {
                window.calcoActivo.removeLayer(layer);
            }
            return;
        }
        
        this.sectorTemporal = layer;
        this.sectorTemporal.addTo(window.calcoActivo);
        this.actualizarBotonesConfirmacionSector();
    }



    

    // En GestorFases
manejarFinDibujo() {
    if (this.dibujandoSector) {
        this.actualizarBotonesConfirmacionSector();
    } else if (this.dibujandoZona) {
        this.actualizarBotonesConfirmacionZona(this.dibujandoZona);
    }
}

manejarDibujoCreado(e) {
    console.log('Manejando dibujo:', {
        dibujandoSector: this.dibujandoSector,
        dibujandoZona: this.dibujandoZona,
        sectorConfirmado: this.sectorConfirmado
    });

    const layer = e.layer;
    if (this.dibujandoSector && !this.sectorConfirmado) {
        this.procesarDibujoSector(layer);
    } else if (this.dibujandoZona && this.sectorConfirmado) {
        this.procesarDibujoZona(layer);
    } else {
        // Si llegamos aquí es un estado inválido
        window.calcoActivo.removeLayer(layer);
        this.mostrarMensajeAyuda('Estado inválido para dibujo');
    }
}

procesarDibujoZona(layer) {
    if (this.sectorConfirmado && this.dibujandoZona) {
        // Verificar que esté dentro del sector
        const zonaBounds = layer.getBounds();
        if (!this.validarZonaEnSector(zonaBounds)) {
            this.mostrarMensajeAyuda('La zona debe estar dentro del sector de juego');
            window.calcoActivo.removeLayer(layer);
            return;
        }

        this.zonaTemporalLayer = layer;
        this.zonaTemporalLayer.addTo(window.calcoActivo);
        this.actualizarBotonesConfirmacionZona(this.dibujandoZona);
    }
}
destruir() {
    // Limpiar eventos
    window.mapa?.off(L.Draw.Event.CREATED);
    window.mapa?.off(L.Draw.Event.DRAWSTART);
    window.mapa?.off(L.Draw.Event.DRAWSTOP);

    // Deshabilitar herramientas
    Object.values(this.herramientasDibujo).forEach(herramienta => {
        if (herramienta && herramienta.disable) {
            herramienta.disable();
        }
    });

    // Limpiar capas
    if (this.sectorLayer) this.sectorLayer.remove();
    if (this.sectorTemporal) this.sectorTemporal.remove();
    Object.values(this.zonasLayers || {}).forEach(layer => {
        if (layer) layer.remove();
    });

    const panelFases = document.getElementById('panel-fases');
    if (panelFases) {
        panelFases.remove();
    }

    super.destruir();
}
}

window.GestorFases = GestorFases;