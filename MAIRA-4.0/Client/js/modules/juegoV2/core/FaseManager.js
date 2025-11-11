/**
 * 🎮 FASE MANAGER - Gestor de Fases y Subfases del Juego de Guerra V2
 *
 * Controla el flujo completo del juego:
 * - PREPARACIÓN: Director delimita sector y zonas
 * - DESPLIEGUE: Jugadores colocan unidades en sus zonas
 * - COMBATE: Subfases de Impartición de Órdenes → Ejecución → Revisión
 *
 * @version 2.0
 * @date 2025-11-07
 */

class FaseManager {
    constructor(opciones = {}) {
        // Referencias necesarias
        this.map = opciones.map || null;
        this.hexGrid = opciones.hexGrid || null;
        this.gestorOrdenes = opciones.gestorOrdenes || null;
        this.configuracion = opciones.configuracion || {};

        // Estado actual
        this.faseActual = 'preparacion'; // preparacion | despliegue | combate
        this.subfaseActual = null; // Para combate: imparticion | ejecucion | revision
        this.turnoActual = 0;

        // Datos de la partida
        this.sector = null; // Polígono del sector
        this.sectorLayer = null; // ✅ Layer de Leaflet del sector
        this.sectorConfirmado = false; // ✅ Flag para saber si se confirmó
        this.zonaAzul = null; // Polígono zona azul
        this.zonaAzulLayer = null; // ✅ Layer de Leaflet zona azul
        this.zonaAzulConfirmada = false; // ✅ Flag para saber si se confirmó
        this.zonaRoja = null; // Polígono zona roja
        this.zonaRojaLayer = null; // ✅ Layer de Leaflet zona roja
        this.zonaRojaConfirmada = false; // ✅ Flag para saber si se confirmó
        this.jugadores = opciones.jugadores || [];
        this.director = opciones.director || null;

        // ✅ Control de turnos de despliegue
        this.modoJuego = opciones.configuracion?.modoJuego || 'local'; // 'local' o 'online'
        this.turnoDespliegueActual = 0; // Índice del jugador actual en modo LOCAL
        this.jugadoresListos = new Set(); // Set de jugadores que confirmaron despliegue
        
        // 🔄 Control de turnos en COMBATE
        this.jugadorCombateActual = 0; // Índice del jugador actual en fase COMBATE
        this.ordenJugadoresCombate = []; // Array ordenado: primero azules, luego rojos
        
        // 🔄 Control de turnos en COMBATE
        this.jugadorCombateActual = 0; // Índice del jugador actual en fase COMBATE
        this.ordenJugadoresCombate = []; // Array ordenado: primero azules, luego rojos

        // Callbacks para eventos
        this.callbacks = {
            onFaseChange: opciones.onFaseChange || (() => {}),
            onSubfaseChange: opciones.onSubfaseChange || (() => {}),
            onTurnoChange: opciones.onTurnoChange || (() => {})
        };

        // UI Elements
        this.indicadorFase = null;

        // ✅ Herramientas de dibujo (Leaflet.Draw)
        this.herramientasDibujo = {};
        this.dibujandoActivo = false; // Flag para controlar cuando se está dibujando
        this.sectorLayer = null; // Layer del sector dibujado
        this.zonaAzulLayer = null; // Layer de zona azul
        this.zonaRojaLayer = null; // Layer de zona roja

        console.log('🎯 FaseManager creado - Fase inicial: PREPARACIÓN');
    }

    /**
     * Inicializa el gestor de fases
     */
    async inicializar() {
        console.log('🔄 Inicializando FaseManager...');

        // ✅ NO crear indicador flotante - se renderiza en panelInferiorUnificado
        // this.crearIndicadorFase();

        // Inicializar herramientas de dibujo (Leaflet.Draw)
        await this.inicializarHerramientasDibujo();

        // Iniciar en fase de preparación
        await this.iniciarPreparacion();

        console.log('✅ FaseManager inicializado (indicador integrado en panel)');
    }

    /**
     * ✅ Inicializa las herramientas de dibujo usando Leaflet.Draw
     */
    async inicializarHerramientasDibujo() {
        if (!this.map) {
            console.error('❌ Mapa no disponible para inicializar herramientas de dibujo');
            return;
        }

        if (!L.Draw) {
            console.error('❌ Leaflet.Draw no está cargado');
            return;
        }

        try {
            // Definir estilos para cada tipo de polígono
            const estilosSector = {
                color: '#ffff00',
                weight: 3,
                opacity: 0.8,
                fill: true,
                fillColor: '#ffff00',
                fillOpacity: 0.1,
                clickable: true
            };

            const estilosZonaAzul = {
                color: '#0066ff',
                weight: 2,
                opacity: 0.8,
                fill: true,
                fillColor: '#0066ff',
                fillOpacity: 0.2,
                clickable: true
            };

            const estilosZonaRoja = {
                color: '#ff0000',
                weight: 2,
                opacity: 0.8,
                fill: true,
                fillColor: '#ff0000',
                fillOpacity: 0.2,
                clickable: true
            };

            // Crear herramientas de dibujo
            this.herramientasDibujo = {
                sector: new L.Draw.Polygon(this.map, {
                    showArea: true,
                    shapeOptions: estilosSector
                }),
                zonaAzul: new L.Draw.Polygon(this.map, {
                    showArea: true,
                    shapeOptions: estilosZonaAzul
                }),
                zonaRoja: new L.Draw.Polygon(this.map, {
                    showArea: true,
                    shapeOptions: estilosZonaRoja
                })
            };

            // Configurar eventos de dibujo
            this.map.on(L.Draw.Event.DRAWSTART, () => {
                this.dibujandoActivo = true;
                console.log('🖊️ Dibujo iniciado');
            });

            this.map.on(L.Draw.Event.DRAWSTOP, () => {
                this.dibujandoActivo = false;
                console.log('🖊️ Dibujo detenido');
            });

            console.log('✅ Herramientas de dibujo inicializadas (Leaflet.Draw)');
        } catch (error) {
            console.error('❌ Error al inicializar herramientas de dibujo:', error);
        }
    }

    /**
     * Crea el indicador visual de fase en la UI
     */
    crearIndicadorFase() {
        this.indicadorFase = document.createElement('div');
        this.indicadorFase.id = 'indicador-fase-v2';
        this.indicadorFase.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #2196F3, #1976D2);
            border: 2px solid #fff;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            font-size: 16px;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(this.indicadorFase);
        this.actualizarIndicadorFase();
    }

    /**
     * Actualiza el texto y color del indicador de fase
     */
    actualizarIndicadorFase() {
        if (!this.indicadorFase) return;

        let texto = '';
        let gradiente = '';

        switch (this.faseActual) {
            case 'preparacion':
                texto = '📋 PREPARACIÓN';
                gradiente = 'linear-gradient(135deg, #9C27B0, #7B1FA2)';
                break;
            case 'despliegue':
                texto = '🎯 DESPLIEGUE';
                gradiente = 'linear-gradient(135deg, #FF9800, #F57C00)';
                break;
            case 'combate':
                switch (this.subfaseActual) {
                    case 'imparticion':
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual} - 📋 Impartición de Órdenes`;
                        gradiente = 'linear-gradient(135deg, #2196F3, #1976D2)';
                        break;
                    case 'ejecucion':
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual} - ⚡ Ejecución`;
                        gradiente = 'linear-gradient(135deg, #f44336, #d32f2f)';
                        break;
                    case 'revision':
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual} - 📊 Revisión`;
                        gradiente = 'linear-gradient(135deg, #4CAF50, #388E3C)';
                        break;
                    default:
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual}`;
                        gradiente = 'linear-gradient(135deg, #2196F3, #1976D2)';
                }
                break;
        }

        this.indicadorFase.innerHTML = texto;
        this.indicadorFase.style.background = gradiente;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FASE 1: PREPARACIÓN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Inicia la fase de PREPARACIÓN
     * - Director delimita sector
     * - Director delimita zonas azul y roja
     */
    async iniciarPreparacion() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 INICIANDO FASE: PREPARACIÓN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.faseActual = 'preparacion';
        this.actualizarIndicadorFase();

        // Mostrar instrucciones
        this.mostrarNotificacion({
            tipo: 'info',
            titulo: 'Fase de Preparación',
            mensaje: `
                <strong>Director:</strong><br>
                1. Delimita el SECTOR de combate (polígono)<br>
                2. Delimita la ZONA AZUL<br>
                3. Delimita la ZONA ROJA<br>
                <br>
                Usa Leaflet.Draw para dibujar los polígonos.
            `,
            duracion: 10000
        });

        // Activar herramientas de dibujo si están disponibles
        if (window.activarHerramientasDibujo) {
            window.activarHerramientasDibujo();
        }

        // Callback
        this.callbacks.onFaseChange('preparacion', null);

        // Evento para panelInferiorUnificado
        this.dispatchCambioFase();

        console.log('✅ Fase PREPARACIÓN iniciada');
    }

    /**
     * ✅ Inicia la herramienta de dibujo para definir el sector (Leaflet.Draw)
     */
    iniciarDefinicionSector() {
        console.log('🗺️ Iniciando herramienta de dibujo para sector...');

        this.mostrarNotificacion({
            tipo: 'info',
            titulo: 'Definir Sector',
            mensaje: 'Dibuja un polígono en el mapa para definir el sector de combate. Doble click para finalizar.'
        });

        // Activar herramienta de dibujo (Leaflet.Draw)
        if (this.herramientasDibujo.sector) {
            this.herramientasDibujo.sector.enable();

            // Escuchar evento de creación UNA SOLA VEZ
            this.map.once(L.Draw.Event.CREATED, (e) => {
                const layer = e.layer;
                this.sectorLayer = layer; // Guardar referencia al layer
                layer.addTo(this.map); // Agregar al mapa
                this.definirSector(layer);
                this.herramientasDibujo.sector.disable();
            });
        } else {
            console.error('❌ Herramienta de dibujo de sector no disponible');
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Las herramientas de dibujo no están inicializadas correctamente.'
            });
        }
    }

    /**
     * Define el sector de combate
     */
    definirSector(layer) {
        console.log('🗺️ Definiendo sector...');

        // Calcular área (sin validación de tamaño - libre)
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const areaKm2 = area / 1000000;

        this.sector = layer.toGeoJSON();
        layer.setStyle({ 
            color: '#000000',      // NEGRO
            weight: 3,
            fillOpacity: 0         // SIN RELLENO
        });

        console.log(`✅ Sector definido: ${areaKm2.toFixed(2)} km²`);

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Sector definido',
            mensaje: `Sector de ${areaKm2.toFixed(2)} km² establecido.<br>Haz click en "Confirmar Sector" para continuar.`
        });

        // ✅ Disparar evento para actualizar UI
        this.dispatchCambioEstado();

        return true;
    }

    /**
     * Confirma el sector definido
     */
    confirmarSector() {
        if (!this.sector) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Debes definir el sector primero'
            });
            return false;
        }

        // ✅ Marcar como confirmado
        this.sectorConfirmado = true;

        console.log('✅ Sector confirmado - Puedes delimitar zonas');

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Sector confirmado',
            mensaje: 'Ahora delimita las zonas azul y roja DENTRO del sector.'
        });

        // ✅ Disparar evento para actualizar UI
        this.dispatchCambioEstado();

        return true;
    }

    /**
     * ✅ Inicia la herramienta de dibujo para definir una zona (azul o roja) - Leaflet.Draw
     */
    iniciarDefinicionZona(equipo) {
        console.log(`🎨 Iniciando herramienta de dibujo para zona ${equipo}...`);

        if (!this.sector) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Primero debes definir y confirmar el sector'
            });
            return;
        }

        const nombreZona = equipo === 'azul' ? 'Azul' : 'Roja';
        const herramienta = equipo === 'azul' ? this.herramientasDibujo.zonaAzul : this.herramientasDibujo.zonaRoja;

        this.mostrarNotificacion({
            tipo: 'info',
            titulo: `Definir Zona ${nombreZona}`,
            mensaje: `Dibuja un polígono DENTRO del sector para la zona ${nombreZona.toLowerCase()}. Doble click para finalizar.`
        });

        // Activar herramienta de dibujo
        if (herramienta) {
            herramienta.enable();

            // Escuchar evento de creación UNA SOLA VEZ
            this.map.once(L.Draw.Event.CREATED, (e) => {
                const layer = e.layer;
                layer.addTo(this.map); // Agregar al mapa

                if (equipo === 'azul') {
                    this.zonaAzulLayer = layer; // Guardar referencia
                    this.definirZonaAzul(layer);
                } else {
                    this.zonaRojaLayer = layer; // Guardar referencia
                    this.definirZonaRoja(layer);
                }

                herramienta.disable();
            });
        } else {
            console.error(`❌ Herramienta de dibujo para zona ${equipo} no disponible`);
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Las herramientas de dibujo no están inicializadas correctamente.'
            });
        }
    }

    /**
     * Define la zona azul
     */
    definirZonaAzul(layer) {
        console.log('🔵 Definiendo zona azul...');

        if (!this.sector || !this.sectorLayer) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Primero debes definir el sector'
            });
            return false;
        }

        // ✅ Validar que la zona azul esté completamente dentro del sector
        if (typeof ValidacionesGeometricas !== 'undefined') {
            const validacion = ValidacionesGeometricas.validarZonaEnSector(
                layer,
                this.sectorLayer,
                'Zona Azul'
            );

            if (!validacion.valido) {
                console.error('❌ Zona azul fuera del sector:', validacion.mensaje);
                this.mostrarNotificacion({
                    tipo: 'error',
                    titulo: 'Zona azul inválida',
                    mensaje: validacion.mensaje
                });
                // Remover el layer del mapa
                this.map.removeLayer(layer);
                return false;
            }

            console.log('✅ Validación zona azul:', validacion.mensaje);
        }

        this.zonaAzul = layer.toGeoJSON();
        this.zonaAzulLayer = layer; // ✅ Guardar referencia al layer
        layer.setStyle({ color: '#0066ff', fillColor: '#0066ff', fillOpacity: 0.2, weight: 2 });

        console.log('✅ Zona azul definida - Esperando confirmación');

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Zona azul definida',
            mensaje: 'Haz click en "Confirmar Zona Azul" para continuar.'
        });

        // ✅ Disparar evento para actualizar UI
        this.dispatchCambioEstado();

        return true;
    }

    /**
     * Confirma la zona azul
     */
    confirmarZonaAzul() {
        if (!this.zonaAzul) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Debes definir la zona azul primero'
            });
            return false;
        }

        // ✅ Marcar como confirmada
        this.zonaAzulConfirmada = true;

        console.log('✅ Zona azul confirmada');

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Zona azul confirmada',
            mensaje: 'Zona azul lista. Ahora delimita la zona roja.'
        });

        // ✅ Disparar evento para actualizar UI
        this.dispatchCambioEstado();

        return true;
    }

    /**
     * Define la zona roja
     */
    definirZonaRoja(layer) {
        console.log('🔴 Definiendo zona roja...');

        if (!this.sector || !this.sectorLayer) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Primero debes definir el sector'
            });
            return false;
        }

        // ✅ Validar que la zona roja esté completamente dentro del sector
        if (typeof ValidacionesGeometricas !== 'undefined') {
            const validacionSector = ValidacionesGeometricas.validarZonaEnSector(
                layer,
                this.sectorLayer,
                'Zona Roja'
            );

            if (!validacionSector.valido) {
                console.error('❌ Zona roja fuera del sector:', validacionSector.mensaje);
                this.mostrarNotificacion({
                    tipo: 'error',
                    titulo: 'Zona roja inválida',
                    mensaje: validacionSector.mensaje
                });
                // Remover el layer del mapa
                this.map.removeLayer(layer);
                return false;
            }

            console.log('✅ Validación zona roja (sector):', validacionSector.mensaje);

            // ✅ Validar que no se superponga con la zona azul
            if (this.zonaAzulLayer) {
                const validacionSuperposicion = ValidacionesGeometricas.validarZonasNoSuperpuestas(
                    this.zonaAzulLayer,
                    layer,
                    100 // Distancia mínima 100 metros
                );

                if (!validacionSuperposicion.valido) {
                    console.error('❌ Zonas superpuestas:', validacionSuperposicion.mensaje);
                    this.mostrarNotificacion({
                        tipo: 'error',
                        titulo: 'Zonas superpuestas',
                        mensaje: validacionSuperposicion.mensaje
                    });
                    // Remover el layer del mapa
                    this.map.removeLayer(layer);
                    return false;
                }

                console.log('✅ Validación zona roja (superposición):', validacionSuperposicion.mensaje);
            }
        }

        this.zonaRoja = layer.toGeoJSON();
        this.zonaRojaLayer = layer; // ✅ Guardar referencia al layer
        layer.setStyle({ color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.2, weight: 2 });

        console.log('✅ Zona roja definida - Esperando confirmación');

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Zona roja definida',
            mensaje: 'Haz click en "Confirmar Zona Roja" para continuar.'
        });

        // ✅ Disparar evento para actualizar UI
        this.dispatchCambioEstado();

        return true;
    }

    /**
     * Confirma la zona roja
     */
    confirmarZonaRoja() {
        if (!this.zonaRoja) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Debes definir la zona roja primero'
            });
            return false;
        }

        // ✅ Marcar como confirmada
        this.zonaRojaConfirmada = true;

        console.log('✅ Zona roja confirmada');

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Zona roja confirmada',
            mensaje: 'Ambas zonas listas. Puedes iniciar el despliegue.'
        });

        // ✅ Disparar evento para actualizar UI
        this.dispatchCambioEstado();

        return true;
    }

    /**
     * Confirma ambas zonas y permite pasar a despliegue
     */
    confirmarZonas() {
        if (!this.zonaAzul || !this.zonaRoja) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Debes definir y confirmar ambas zonas primero'
            });
            return false;
        }

        console.log('✅ Ambas zonas confirmadas - Pasando a Despliegue');

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Preparación completa',
            mensaje: 'Todas las zonas están confirmadas.<br>Pasando a DESPLIEGUE...'
        });

        // Pasar automáticamente a despliegue después de 1 segundo
        setTimeout(() => {
            this.finalizarPreparacion();
        }, 1000);

        return true;
    }

    /**
     * Finaliza la preparación y pasa a despliegue
     */
    async finalizarPreparacion() {
        if (!this.sector || !this.zonaAzul || !this.zonaRoja) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Debes definir el sector y ambas zonas antes de continuar'
            });
            return;
        }

        console.log('✅ Preparación finalizada - Pasando a DESPLIEGUE');
        await this.iniciarDespliegue();
    }

    // ✅ HexGrid ya existe desde el inicio - NO se genera aquí

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FASE 2: DESPLIEGUE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Inicia la fase de DESPLIEGUE
     */
    async iniciarDespliegue() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 INICIANDO FASE: DESPLIEGUE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.faseActual = 'despliegue';
        this.turnoDespliegueActual = 0; // Resetear turnos
        this.jugadoresListos.clear(); // Limpiar jugadores listos
        this.actualizarIndicadorFase();

        // ✅ Mensaje diferente según modo
        if (this.modoJuego === 'local') {
            const primerJugador = this.jugadores[0];
            this.mostrarNotificacion({
                tipo: 'info',
                titulo: 'Fase de Despliegue - MODO LOCAL',
                mensaje: `
                    <strong>Turno de: ${primerJugador.nombre} (${primerJugador.equipo.toUpperCase()})</strong><br>
                    <br>
                    Coloca y edita tus unidades en tu zona asignada.<br>
                    <br>
                    <strong>Validación requerida:</strong><br>
                    - Magnitud, Designación, Asignación<br>
                    <br>
                    Cuando termines, haz click en "Jugador Listo".
                `,
                duracion: 8000
            });
        } else {
            this.mostrarNotificacion({
                tipo: 'info',
                titulo: 'Fase de Despliegue - MODO ONLINE',
                mensaje: `
                    <strong>Despliega tus unidades</strong><br>
                    <br>
                    Coloca y edita tus unidades en tu zona asignada.<br>
                    <br>
                    <strong>Validación requerida:</strong><br>
                    - Magnitud, Designación, Asignación<br>
                    <br>
                    Cuando termines, haz click en "Listo para Combate".
                `,
                duracion: 8000
            });
        }

        // Callback
        this.callbacks.onFaseChange('despliegue', null);

        // Evento para panelInferiorUnificado
        this.dispatchCambioFase();

        console.log('✅ Fase DESPLIEGUE iniciada');
        console.log(`📋 Modo: ${this.modoJuego.toUpperCase()}`);
        if (this.modoJuego === 'local') {
            console.log(`👤 Turno actual: ${this.jugadores[this.turnoDespliegueActual]?.nombre}`);
        }
    }

    /**
     * ✅ Obtiene el jugador que debe desplegar actualmente (LOCAL)
     */
    obtenerJugadorActual() {
        if (this.modoJuego !== 'local') {
            return null;
        }
        
        if (this.faseActual === 'despliegue') {
            return this.jugadores[this.turnoDespliegueActual] || null;
        } else if (this.faseActual === 'combate') {
            return this.ordenJugadoresCombate[this.jugadorCombateActual] || null;
        }
        
        return null;
    }
    
    /**
     * 🔄 Inicializa el orden de jugadores para combate: primero azules, luego rojos
     */
    inicializarOrdenJugadores() {
        console.log('🔍 DEBUG: inicializarOrdenJugadores() llamado');
        console.log('📊 this.jugadores:', this.jugadores);
        console.log('📊 Cantidad de jugadores:', this.jugadores ? this.jugadores.length : 0);
        
        const azules = this.jugadores.filter(j => j.equipo === 'azul');
        const rojos = this.jugadores.filter(j => j.equipo === 'rojo');
        
        console.log(`👥 Azules: ${azules.length}, Rojos: ${rojos.length}`);
        
        this.ordenJugadoresCombate = [...azules, ...rojos];
        this.jugadorCombateActual = 0;
        
        console.log('🔄 Orden de jugadores inicializado:', 
            this.ordenJugadoresCombate.map(j => `${j.nombre} (${j.equipo})`).join(' → '));
        
        return this.ordenJugadoresCombate;
    }
    
    /**
     * 🔄 Avanza al siguiente jugador en fase COMBATE
     */
    siguienteJugador() {
        if (this.faseActual !== 'combate') {
            console.warn('⚠️ siguienteJugador() solo disponible en fase COMBATE');
            return null;
        }
        
        // Avanzar índice
        this.jugadorCombateActual++;
        
        // Si llegamos al final, volver al principio (ciclo completo)
        if (this.jugadorCombateActual >= this.ordenJugadoresCombate.length) {
            this.jugadorCombateActual = 0;
            console.log('🔄 Ciclo de jugadores completado, volviendo al primero');
        }
        
        
        // 🔒 VALIDAR que haya jugadores en el orden
        if (!this.ordenJugadoresCombate || this.ordenJugadoresCombate.length === 0) {
            console.error('❌ No hay jugadores en ordenJugadoresCombate');
            return null;
        }
        
        const jugador = this.ordenJugadoresCombate[this.jugadorCombateActual];
        
        if (!jugador) {
            console.error('❌ Jugador undefined en índice:', this.jugadorCombateActual);
            return null;
        }
        
        console.log(`🎯 Ahora es turno de: ${jugador.nombre} (${jugador.equipo})`);
        
        // Actualizar window.jugadorActual para los filtros
        window.jugadorActual = jugador.nombre;
        
        // Disparar evento
        this.dispatchCambioEstado();
        
        return jugador;
    }

    /**
     * ✅ Jugador confirma que terminó de desplegar
     */
    jugadorListo() {
        if (this.faseActual !== 'despliegue') {
            console.warn('⚠️ jugadorListo() solo disponible en fase DESPLIEGUE');
            return false;
        }

        const jugadorActual = this.obtenerJugadorActual();

        // ✅ Validar que haya al menos 1 elemento del equipo actual en el mapa
        let cantidadElementos = 0;
        let equipoActual = null;

        // Determinar equipo actual
        if (this.modoJuego === 'local' && jugadorActual) {
            equipoActual = jugadorActual.equipo; // 'azul' o 'rojo'
        }

        // Contar marcadores con SIDC del equipo actual
        if (window.map) {
            window.map.eachLayer(function(layer) {
                if (layer instanceof L.Marker && layer.options && layer.options.sidc) {
                    // Verificar afiliación SIDC (posición 1, index 1)
                    const afiliacion = layer.options.sidc.charAt(1);

                    // F = Friend (azul), J = Joker/Enemigo (rojo en doctrina argentina)
                    if (equipoActual) {
                        if ((equipoActual === 'azul' && afiliacion === 'F') ||
                            (equipoActual === 'rojo' && afiliacion === 'J')) {
                            cantidadElementos++;
                        }
                    } else {
                        // Modo online o sin equipo específico
                        cantidadElementos++;
                    }
                }
            });
        }

        if (cantidadElementos === 0) {
            const equipoTexto = equipoActual ? ` del equipo ${equipoActual.toUpperCase()}` : '';
            console.warn(`⚠️ No hay elementos${equipoTexto} en el mapa`);
            this.mostrarNotificacion({
                tipo: 'warning',
                titulo: 'Sin elementos',
                mensaje: `Debes desplegar al menos 1 elemento${equipoTexto} antes de marcar como listo`,
                duracion: 5000
            });
            return false;
        }

        console.log(`✅ Validación OK: ${cantidadElementos} elementos${equipoActual ? ' del equipo ' + equipoActual.toUpperCase() : ''} en el mapa`);

        if (this.modoJuego === 'local') {
            // LOCAL: Avanzar al siguiente jugador
            if (!jugadorActual) {
                console.error('❌ No hay jugador actual');
                return false;
            }

            console.log(`✅ Jugador ${jugadorActual.nombre} confirmó despliegue`);
            this.jugadoresListos.add(jugadorActual.nombre);

            // Verificar si hay más jugadores
            if (this.turnoDespliegueActual < this.jugadores.length - 1) {
                // Hay más jugadores, pasar al siguiente
                this.turnoDespliegueActual++;
                const siguienteJugador = this.jugadores[this.turnoDespliegueActual];

                this.mostrarNotificacion({
                    tipo: 'success',
                    titulo: `${jugadorActual.nombre} listo`,
                    mensaje: `Ahora es el turno de <strong>${siguienteJugador.nombre} (${siguienteJugador.equipo.toUpperCase()})</strong>`,
                    duracion: 5000
                });

                // Disparar evento para actualizar UI
                this.dispatchCambioEstado();

                return true;
            } else {
                // Todos los jugadores terminaron
                console.log('✅ Todos los jugadores terminaron el despliegue');
                this.finalizarDespliegue();
                return true;
            }
        } else {
            // ONLINE: Marcar jugador como listo y verificar si todos están listos
            const jugadorId = window.userId || 'jugador1'; // TODO: Obtener ID real
            this.jugadoresListos.add(jugadorId);

            console.log(`✅ Jugador ${jugadorId} listo (${this.jugadoresListos.size}/${this.jugadores.length})`);

            if (this.jugadoresListos.size >= this.jugadores.length) {
                // Todos listos
                this.finalizarDespliegue();
            } else {
                this.mostrarNotificacion({
                    tipo: 'info',
                    titulo: 'Esperando otros jugadores',
                    mensaje: `Listos: ${this.jugadoresListos.size}/${this.jugadores.length}`,
                    duracion: 3000
                });
            }

            return true;
        }
    }

    /**
     * Valida que una posición esté dentro de la zona del jugador
     */
    validarPosicionDespliegue(latLng, equipo) {
        const zona = equipo === 'azul' ? this.zonaAzul : this.zonaRoja;

        if (!zona) {
            console.error('❌ Zona no definida para equipo:', equipo);
            return false;
        }

        // TODO: Implementar verificación geométrica point-in-polygon
        // Por ahora, retornar true
        return true;
    }

    /**
     * Valida que un elemento tenga todos los campos obligatorios
     */
    validarElemento(elemento) {
        const camposObligatorios = ['magnitud', 'designacion', 'asignacion'];
        const faltantes = [];

        for (const campo of camposObligatorios) {
            if (!elemento[campo] || elemento[campo].trim() === '') {
                faltantes.push(campo);
            }
        }

        if (faltantes.length > 0) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Elemento incompleto',
                mensaje: `Faltan campos obligatorios:<br>- ${faltantes.join('<br>- ')}`
            });
            return false;
        }

        return true;
    }

    /**
     * Valida todos los elementos del equipo antes de finalizar despliegue
     */
    validarElementosEquipo(equipo) {
        // TODO: Obtener todos los elementos del equipo del mapa
        // Por ahora, retornar true para testing
        console.log(`🔍 Validando elementos de equipo ${equipo}...`);
        return true;
    }

    /**
     * Finaliza el despliegue y pasa a combate
     */
    async finalizarDespliegue() {
        console.log('✅ Despliegue finalizado - Pasando a COMBATE');
        await this.iniciarCombate();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FASE 3: COMBATE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Inicia la fase de COMBATE
     */
    async iniciarCombate() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚔️ INICIANDO FASE: COMBATE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.faseActual = 'combate';
        this.turnoActual = 1;
        this.actualizarIndicadorFase();

        // 🎯 INICIALIZAR ORDEN DE JUGADORES (azules → rojos)
        this.inicializarOrdenJugadores();
        
        // Establecer jugador actual como window.jugadorActual
        const primerJugador = this.ordenJugadoresCombate[0];
        if (primerJugador) {
            window.jugadorActual = primerJugador.nombre;
            console.log(`👤 Turno inicial: ${primerJugador.nombre} (${primerJugador.equipo})`);
        }

        // 🗺️ Ocultar zonas de despliegue (azules no deben ver dónde desplegaron rojos)
        if (this.zonaAzulLayer) {
            this.map.removeLayer(this.zonaAzulLayer);
            console.log('🔒 Zona azul ocultada');
        }
        if (this.zonaRojaLayer) {
            this.map.removeLayer(this.zonaRojaLayer);
            console.log('🔒 Zona roja ocultada');
        }

        // Iniciar subfase de impartición de órdenes
        await this.iniciarPlanificacion();

        // Callback
        this.callbacks.onFaseChange('combate', 'imparticion');

        console.log('✅ Fase COMBATE iniciada - Turno 1');
    }

    /**
     * Subfase de Impartición de Órdenes
     */
    async iniciarPlanificacion() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📋 SUBFASE: IMPARTICIÓN DE ÓRDENES - Turno ${this.turnoActual}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.subfaseActual = 'imparticion';
        this.actualizarIndicadorFase();

        this.mostrarNotificacion({
            tipo: 'info',
            titulo: `Impartición de Órdenes - Turno ${this.turnoActual}`,
            mensaje: `
                Da órdenes a tus unidades:<br>
                - Doble-click en unidad → Menú radial<br>
                - Selecciona acción (Mover, Atacar, Defender)<br>
                - Confirma cuando termines<br>
            `,
            duracion: 8000
        });

        // Activar gestor de órdenes
        if (this.gestorOrdenes) {
            this.gestorOrdenes.iniciarPlanificacion();
        }

        // Callback
        this.callbacks.onSubfaseChange('imparticion');

        // Evento para panelInferiorUnificado
        this.dispatchCambioFase();

        console.log('✅ Impartición de Órdenes iniciada');
    }

    /**
     * Confirmar órdenes y pasar a ejecución
     */
    async confirmarOrdenes() {
        console.log('✅ Órdenes confirmadas - Pasando a EJECUCIÓN');
        await this.iniciarEjecucion();
    }

    /**
     * Subfase de Ejecución
     */
    async iniciarEjecucion() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`⚡ SUBFASE: EJECUCIÓN - Turno ${this.turnoActual}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.subfaseActual = 'ejecucion';
        this.actualizarIndicadorFase();

        this.mostrarNotificacion({
            tipo: 'warning',
            titulo: 'Ejecución en curso',
            mensaje: 'Las órdenes se están ejecutando automáticamente...',
            duracion: 3000
        });

        // Ejecutar órdenes
        if (this.gestorOrdenes) {
            await this.gestorOrdenes.ejecutarTurno();
        }

        // Callback
        this.callbacks.onSubfaseChange('ejecucion');

        // Evento para panelInferiorUnificado
        this.dispatchCambioFase();

        console.log('✅ Ejecución completa - Pasando a REVISIÓN');

        // Pasar automáticamente a revisión
        await this.iniciarRevision();
    }

    /**
     * Subfase de Revisión (activa durante turno enemigo)
     */
    async iniciarRevision() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 SUBFASE: REVISIÓN - Turno ${this.turnoActual}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.subfaseActual = 'revision';
        this.actualizarIndicadorFase();

        // Mostrar resultados
        this.mostrarNotificacion({
            tipo: 'success',
            titulo: `Turno ${this.turnoActual} completado`,
            mensaje: `
                Revisa los resultados:<br>
                - Unidades movidas<br>
                - Combates resueltos<br>
                - Bajas reportadas<br>
                <br>
                Durante el turno enemigo puedes seleccionar elementos para revisarlos.<br>
                <br>
                <button onclick="window.faseManager.siguienteTurno()">Siguiente Turno</button>
            `,
            duracion: null // No auto-cerrar
        });

        // Callback
        this.callbacks.onSubfaseChange('revision');

        // Evento para panelInferiorUnificado
        this.dispatchCambioFase();

        console.log('✅ Revisión iniciada - Puedes seleccionar elementos durante turno enemigo');
    }

    /**
     * Avanza al siguiente turno
     */
    async siguienteTurno() {
        this.turnoActual++;

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔄 SIGUIENTE TURNO: ${this.turnoActual}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Callback
        this.callbacks.onTurnoChange(this.turnoActual);

        // Volver a impartición de órdenes
        await this.iniciarPlanificacion();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // UTILIDADES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Muestra una notificación en pantalla
     */
    mostrarNotificacion(opciones) {
        const { tipo, titulo, mensaje, duracion = 5000 } = opciones;

        // Crear elemento de notificación
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            max-width: 400px;
            padding: 16px;
            background: ${this.getColorNotificacion(tipo)};
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 4000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;

        notif.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">${titulo}</div>
            <div>${mensaje}</div>
        `;

        document.body.appendChild(notif);

        // Auto-cerrar si tiene duración
        if (duracion) {
            setTimeout(() => {
                notif.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notif.remove(), 300);
            }, duracion);
        }

        // Agregar estilos de animación si no existen
        if (!document.getElementById('notif-animations')) {
            const style = document.createElement('style');
            style.id = 'notif-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Obtiene el color para un tipo de notificación
     */
    getColorNotificacion(tipo) {
        const colores = {
            info: 'linear-gradient(135deg, #2196F3, #1976D2)',
            success: 'linear-gradient(135deg, #4CAF50, #388E3C)',
            warning: 'linear-gradient(135deg, #FF9800, #F57C00)',
            error: 'linear-gradient(135deg, #f44336, #d32f2f)'
        };
        return colores[tipo] || colores.info;
    }

    /**
     * Obtiene el estado actual del juego
     */
    getEstado() {
        return {
            fase: this.faseActual,
            subfase: this.subfaseActual,
            turno: this.turnoActual,
            sector: this.sector,
            zonaAzul: this.zonaAzul,
            zonaRoja: this.zonaRoja
        };
    }

    /**
     * Dispara evento de cambio de fase para integración con panelInferiorUnificado
     */
    dispatchCambioFase() {
        const evento = new CustomEvent('cambioFase', {
            detail: {
                fase: this.faseActual,
                subfase: this.subfaseActual,
                turno: this.turnoActual
            }
        });
        document.dispatchEvent(evento);
        console.log(`📡 Evento 'cambioFase' disparado:`, evento.detail);
    }

    /**
     * Dispara evento de cambio de estado (sector/zonas definidas/confirmadas)
     */
    dispatchCambioEstado() {
        const evento = new CustomEvent('cambioEstadoPreparacion', {
            detail: {
                fase: this.faseActual,
                sector: this.sector !== null,
                sectorConfirmado: this.sectorConfirmado,
                zonaAzul: this.zonaAzul !== null,
                zonaAzulConfirmada: this.zonaAzulConfirmada,
                zonaRoja: this.zonaRoja !== null,
                zonaRojaConfirmada: this.zonaRojaConfirmada,
                // ✅ Info de turnos de despliegue
                modoJuego: this.modoJuego,
                turnoDespliegueActual: this.turnoDespliegueActual,
                jugadorActual: this.obtenerJugadorActual(),
                jugadoresListos: this.jugadoresListos.size,
                totalJugadores: this.jugadores.length
            }
        });
        document.dispatchEvent(evento);
        console.log(`📡 Evento 'cambioEstadoPreparacion' disparado:`, evento.detail);
    }
}

// Exportar globalmente
window.FaseManager = FaseManager;
console.log('✅ FaseManager.js cargado');
