/**
 * 🚀 INICIALIZADOR JUEGO DE GUERRA V2
 *
 * Inicializa todos los sistemas necesarios para el Juego de Guerra V2:
 * - Sistema de órdenes con tiempo real
 * - Panel de coordinación temporal
 * - Menú radial integrado
 * - HexGrid y mapa base
 * - Subfases de combate
 *
 * Este inicializador es específico para la V2 y reemplaza el flujo del V1
 *
 * @author MAIRA Team
 * @version 2.0
 */

class InicializadorJuegoV2 {
    constructor() {
        this.config = null;
        this.sistemasInicializados = false;
        this.gestorOrdenesV2 = null;
        this.hexGrid = null;
        this.map = null;
        this.menuRadial = null;

        // ✅ NUEVOS MANAGERS V2
        this.faseManager = null;
        this.turnosManager = null;

        // ✅ Lista de elementos agregados (por equipo)
        this.elementos = {
            azul: [],
            rojo: []
        };
    }

    /**
     * Inicializa todos los sistemas V2
     */
    async inicializar() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎮 JUEGO DE GUERRA V2 - INICIANDO');
        console.log('📋 Sistema de Órdenes con Tiempo Real');
        console.log('⏱️  1 Turno = 1 Hora en el Terreno');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            // 1. Verificar dependencias críticas
            if (!this.verificarDependencias()) {
                throw new Error('Dependencias críticas no cargadas');
            }

            // 2. Obtener configuración de partida
            this.config = this.obtenerConfiguracion();
            console.log('📋 Configuración:', this.config);

            // 3. Inicializar UserIdentity
            await this.inicializarUserIdentity();

            // 4. Inicializar mapa base
            await this.inicializarMapaBase();

            // 5. Inicializar HexGrid
            await this.inicializarHexGrid();

            // 6. Inicializar Menú Radial
            await this.inicializarMenuRadial();

            // 7. Inicializar Panel de Coordinación (crear contenedor)
            this.crearContenedorPanelCoordinacion();

            // 8. Inicializar GestorOrdenesV2 (corazón del sistema)
            await this.inicializarGestorOrdenesV2();

            // 8.5. Inicializar FaseManager (gestión de fases)
            await this.inicializarFaseManager();

            // 8.6. Inicializar TurnosManager (gestión de turnos y reloj)
            await this.inicializarTurnosManager();

            // 8.7. Conectar panelInferiorUnificado con gestores V2
            await this.conectarPanelInferiorUnificado();

            // 8.8. Actualizar panel integrado con estado inicial
            setTimeout(() => {
                this.actualizarPanelEstado();
                this.actualizarListaElementos();
                console.log('✅ Panel integrado actualizado con estado inicial');
            }, 500);

            // 9. Configurar interfaz distintiva V2
            this.configurarInterfazV2();

            // 10. Inicializar chat si disponible
            await this.inicializarChat();

            this.sistemasInicializados = true;

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ JUEGO DE GUERRA V2 LISTO');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Mostrar instrucciones
            this.mostrarInstruccionesIniciales();

            return true;

        } catch (error) {
            console.error('❌ Error inicializando Juego V2:', error);
            this.mostrarError(error);
            return false;
        }
    }

    /**
     * Verifica que todas las dependencias estén cargadas
     */
    verificarDependencias() {
        const dependencias = [
            { nombre: 'jQuery', variable: '$' },
            { nombre: 'Leaflet', variable: 'L' },
            { nombre: 'Milsymbol', variable: 'ms' },
            { nombre: 'OrdenBase', variable: 'OrdenBase' },
            { nombre: 'OrdenMovimiento', variable: 'OrdenMovimiento' },
            { nombre: 'OrdenAtaque', variable: 'OrdenAtaque' },
            { nombre: 'Pathfinding', variable: 'Pathfinding' },
            { nombre: 'OrdenesQueueV2', variable: 'OrdenesQueueV2' },
            { nombre: 'PanelCoordinacionOrdenes', variable: 'PanelCoordinacionOrdenes' },
            { nombre: 'GestorOrdenesV2', variable: 'GestorOrdenesV2' },
            { nombre: 'FaseManager', variable: 'FaseManager' },
            { nombre: 'TurnosManager', variable: 'TurnosManager' }
        ];

        let todasPresentes = true;
        for (const dep of dependencias) {
            if (typeof window[dep.variable] === 'undefined') {
                console.error(`❌ ${dep.nombre} no cargado`);
                todasPresentes = false;
            } else {
                console.log(`✅ ${dep.nombre}`);
            }
        }

        return todasPresentes;
    }

    /**
     * Obtiene configuración de la partida
     */
    obtenerConfiguracion() {
        try {
            // ✅ PRIORIDAD 1: Configuración LOCAL desde iniciarpartida.js
            const configLocal = localStorage.getItem('configuracionPartidaLocal');
            if (configLocal) {
                console.log('✅ Configuración LOCAL encontrada en configuracionPartidaLocal');
                const config = JSON.parse(configLocal);
                return this.convertirConfiguracionLocal(config);
            }

            // ✅ PRIORIDAD 2: Configuración ONLINE desde iniciarpartida.js
            const configOnline = localStorage.getItem('configuracionPartidaOnline');
            if (configOnline) {
                console.log('✅ Configuración ONLINE encontrada en configuracionPartidaOnline');
                const config = JSON.parse(configOnline);
                return this.convertirConfiguracionOnline(config);
            }

            // PRIORIDAD 3: Intentar obtener desde URL (legacy)
            const urlParams = new URLSearchParams(window.location.search);
            const codigoPartida = urlParams.get('codigo');

            if (codigoPartida) {
                // Buscar en sessionStorage
                const datosSession = sessionStorage.getItem('datosPartidaActual');
                if (datosSession) {
                    const parsed = JSON.parse(datosSession);
                    const datosPartida = parsed.partidaActual || parsed;

                    if (datosPartida && datosPartida.codigo === codigoPartida) {
                        console.log('✅ Configuración encontrada en sessionStorage (legacy)');
                        return this.convertirDatosPartida(datosPartida);
                    }
                }

                // Buscar en localStorage
                const datosLocal = localStorage.getItem('datosPartida');
                if (datosLocal) {
                    const datosPartida = JSON.parse(datosLocal);
                    if (datosPartida && datosPartida.codigo === codigoPartida) {
                        console.log('✅ Configuración encontrada en localStorage (legacy)');
                        return this.convertirDatosPartida(datosPartida);
                    }
                }
            }

            console.warn('⚠️ No se encontró configuración, usando valores por defecto');

            // Configuración por defecto
            return {
                modo: 'juego_guerra_v2',
                nombrePartida: 'Partida V2',
                codigo: 'TEST-V2',
                duracionTurnoMinutos: 60, // 1 hora por turno
                mapaCentro: [-34.6037, -58.3816], // Buenos Aires
                zoomInicial: 13,
                equipos: ['azul', 'rojo'],
                jugadores: [
                    { id: 'jugador1', nombre: 'Jugador 1', equipo: 'azul' },
                    { id: 'jugador2', nombre: 'Jugador 2', equipo: 'rojo' }
                ]
            };

        } catch (error) {
            console.warn('⚠️ Error obteniendo configuración, usando defaults');
            return {
                modo: 'juego_guerra_v2',
                duracionTurnoMinutos: 60,
                mapaCentro: [-34.6037, -58.3816],
                zoomInicial: 13,
                equipos: ['azul', 'rojo']
            };
        }
    }

    /**
     * Convierte datos de partida al formato de configuración V2
     */
    convertirDatosPartida(datosPartida) {
        return {
            modo: 'juego_guerra_v2',
            nombrePartida: datosPartida.nombre,
            codigo: datosPartida.codigo,
            duracionTurnoMinutos: datosPartida.configuracion?.duracionTurno || 60,
            mapaCentro: datosPartida.configuracion?.centro || [-34.6037, -58.3816],
            zoomInicial: datosPartida.configuracion?.zoom || 13,
            equipos: ['azul', 'rojo'],
            jugadores: datosPartida.jugadores || [],
            director: datosPartida.director,
            modoJuego: datosPartida.modoJuego || 'local'
        };
    }

    /**
     * Convierte configuración local desde iniciarpartida.js
     */
    convertirConfiguracionLocal(config) {
        console.log('🔄 Convirtiendo configuración local:', config);

        const configConvertida = {
            modo: 'juego_guerra_v2',
            nombrePartida: config.nombrePartida || config.nombre || 'Partida Local',
            codigo: config.codigo || `LOCAL-${Date.now()}`,
            duracionTurnoMinutos: parseInt(config.duracionTurno) || 60,
            duracionPartidaMinutos: parseInt(config.duracionPartida) || 120,
            objetivoPartida: config.objetivoPartida || config.objetivo || 'Objetivo no especificado',
            cantidadJugadores: parseInt(config.cantidadJugadores) || 2,
            mapaCentro: config.centro || config.mapaCentro || [-34.6037, -58.3816],
            zoomInicial: parseInt(config.zoom) || 13,
            equipos: config.equipos || ['azul', 'rojo'],
            jugadores: config.jugadores || [],
            director: config.director || null,
            modoJuego: config.modoJuego || 'local',
            // Configuraciones adicionales específicas de V2
            configuracionOriginal: config
        };

        // ✅ LOGS DETALLADOS PARA VERIFICAR CARGA
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 CONFIGURACIÓN CARGADA DESDE iniciarpartida.js:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎮 Nombre Partida:', configConvertida.nombrePartida);
        console.log('🔑 Código Partida:', configConvertida.codigo);
        console.log('⏱️  Duración Turno:', configConvertida.duracionTurnoMinutos, 'minutos');
        console.log('⏰ Duración Partida:', configConvertida.duracionPartidaMinutos, 'minutos');
        console.log('🎯 Objetivo:', configConvertida.objetivoPartida);
        console.log('👥 Cantidad Jugadores:', configConvertida.cantidadJugadores);
        console.log('🎨 Equipos:', configConvertida.equipos.join(', '));
        console.log('👤 Jugadores:');
        configConvertida.jugadores.forEach((jugador, index) => {
            console.log(`   ${index + 1}. ${jugador.nombre || jugador.username} (${jugador.equipo})${jugador.ia ? ' [IA]' : ''}`);
        });
        console.log('🗺️  Centro Mapa:', configConvertida.mapaCentro);
        console.log('🔍 Zoom Inicial:', configConvertida.zoomInicial);
        console.log('🎲 Modo Juego:', configConvertida.modoJuego);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return configConvertida;
    }

    /**
     * ✅ Convierte configuración ONLINE desde iniciarpartida.js
     */
    convertirConfiguracionOnline(config) {
        console.log('🔄 Convirtiendo configuración ONLINE:', config);

        const configConvertida = {
            modo: 'juego_guerra_v2',
            nombrePartida: config.nombrePartida || config.nombre || 'Partida Online',
            codigo: config.codigo || `ONLINE-${Date.now()}`,
            duracionTurnoMinutos: parseInt(config.duracionTurno) || 60,
            duracionPartidaMinutos: parseInt(config.duracionPartida) || 120,
            objetivoPartida: config.objetivoPartida || config.objetivo || 'Objetivo no especificado',
            mapaCentro: config.centro || config.mapaCentro || [-34.6037, -58.3816],
            zoomInicial: parseInt(config.zoom) || 13,
            equipos: config.equipos || ['azul', 'rojo'],
            jugadores: config.jugadores || [],
            director: config.director || null,
            modoJuego: 'online', // ✅ Siempre online
            creadorId: config.creadorId,
            socket: config.socket || true,
            // Configuraciones adicionales específicas de V2
            configuracionOriginal: config
        };

        // ✅ LOGS DETALLADOS PARA VERIFICAR CARGA
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📡 CONFIGURACIÓN ONLINE CARGADA:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎮 Nombre Partida:', configConvertida.nombrePartida);
        console.log('🔑 Código Partida:', configConvertida.codigo);
        console.log('⏱️  Duración Turno:', configConvertida.duracionTurnoMinutos, 'minutos');
        console.log('⏰ Duración Partida:', configConvertida.duracionPartidaMinutos, 'minutos');
        console.log('🎯 Objetivo:', configConvertida.objetivoPartida);
        console.log('👥 Jugadores conectados:', configConvertida.jugadores.length);
        configConvertida.jugadores.forEach((jugador, index) => {
            console.log(`   ${index + 1}. ${jugador.nombre || jugador.username} (${jugador.equipo || 'Sin asignar'})`);
        });
        console.log('🗺️  Centro Mapa:', configConvertida.mapaCentro);
        console.log('🔍 Zoom Inicial:', configConvertida.zoomInicial);
        console.log('🌐 Creador:', configConvertida.creadorId);
        console.log('🔌 Socket:', configConvertida.socket ? 'Activo' : 'Inactivo');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return configConvertida;
    }

    /**
     * Inicializa UserIdentity
     */
    async inicializarUserIdentity() {
        if (typeof MAIRA !== 'undefined' && MAIRA.UserIdentity) {
            try {
                await MAIRA.UserIdentity.initialize();
                console.log('✅ UserIdentity inicializado');
            } catch (error) {
                console.warn('⚠️ UserIdentity no disponible:', error);
            }
        }
    }

    /**
     * Inicializa el mapa base de Leaflet
     */
    async inicializarMapaBase() {
        // Verificar si ya existe map global
        if (window.map) {
            this.map = window.map;
            console.log('✅ Mapa existente reutilizado');
            return;
        }

        // Si no existe, llamar a inicializarMapa() (de mapaP.js)
        if (typeof inicializarMapa === 'function') {
            inicializarMapa();
            this.map = window.map;
            console.log('✅ Mapa base inicializado');
        } else {
            throw new Error('Función inicializarMapa no disponible');
        }
    }

    /**
     * Inicializa el HexGrid sobre el mapa
     */
    async inicializarHexGrid() {
        // Verificar si HexGrid está disponible
        if (!window.HexGrid) {
            console.warn('⚠️ HexGrid no disponible - funcionalidad limitada');
            return;
        }

        // Si HexGrid existe, inicializarlo con el mapa si no está inicializado
        if (!window.HexGrid.map || !window.HexGrid.hexLayer) {
            console.log('🔄 Inicializando HexGrid con el mapa...');
            window.HexGrid.initialize(this.map);
        }

        this.hexGrid = window.HexGrid;
        console.log('✅ HexGrid inicializado y listo');
    }

    /**
     * Inicializa el menú radial
     */
    async inicializarMenuRadial() {
        if (window.MiRadial && this.map) {
            window.MiRadial.init(this.map);
            // ⚠️ NO cambiar la fase - debe mantenerse en 'preparacion' inicialmente
            // El jugador cambiará manualmente a través del flujo: preparación → despliegue → combate
            // window.MiRadial.faseJuego = 'combate';
            this.menuRadial = window.MiRadial;
            console.log(`✅ Menú Radial inicializado (fase: ${window.MiRadial.faseJuego || 'preparacion'})`);
        } else {
            console.warn('⚠️ Menú Radial no disponible');
        }
    }

    /**
     * Crea el contenedor del panel de coordinación con estructura de 3 secciones
     */
    crearContenedorPanelCoordinacion() {
        // Verificar si ya existe
        if (document.getElementById('panel-coordinacion-container')) {
            console.log('✅ Contenedor Panel Coordinación ya existe');
            return;
        }

        // Crear contenedor principal
        const contenedor = document.createElement('div');
        contenedor.id = 'panel-coordinacion-container';
        contenedor.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 250px;
            background: rgba(0, 0, 0, 0.9);
            border-top: 2px solid #00ff00;
            z-index: 1000;
            display: none;
            flex-direction: row;
            gap: 0;
            padding: 0;
        `;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SECCIÓN IZQUIERDA: Estado del Juego
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const seccionIzquierda = document.createElement('div');
        seccionIzquierda.id = 'panel-seccion-estado';
        seccionIzquierda.style.cssText = `
            width: 250px;
            height: 100%;
            background: rgba(20, 20, 20, 0.95);
            border-right: 1px solid rgba(0, 255, 0, 0.3);
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow-y: auto;
        `;

        seccionIzquierda.innerHTML = `
            <!-- Indicador de Fase -->
            <div style="
                background: rgba(0, 255, 0, 0.1);
                border: 1px solid rgba(0, 255, 0, 0.4);
                border-radius: 6px;
                padding: 8px;
            ">
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">FASE ACTUAL</div>
                <div id="panel-fase-actual" style="
                    font-size: 14px;
                    font-weight: bold;
                    color: #00ff00;
                    text-transform: uppercase;
                    font-family: 'Courier New', monospace;
                ">PREPARACIÓN</div>
                <div id="panel-subfase-actual" style="
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    margin-top: 4px;
                    display: none;
                "></div>
            </div>

            <!-- Información de Jugador y Equipo -->
            <div style="
                background: rgba(255, 152, 0, 0.1);
                border: 1px solid rgba(255, 152, 0, 0.4);
                border-radius: 6px;
                padding: 8px;
            ">
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">JUGADOR</div>
                <div id="panel-jugador-actual" style="
                    font-size: 11px;
                    font-weight: bold;
                    color: #ff9800;
                    font-family: 'Courier New', monospace;
                ">Director</div>

                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 8px; margin-bottom: 4px;">EQUIPO</div>
                <div id="panel-equipo-actual" style="
                    font-size: 11px;
                    font-weight: bold;
                    color: #ff9800;
                    font-family: 'Courier New', monospace;
                ">--</div>
            </div>

            <!-- Reloj y Turno -->
            <div style="
                background: rgba(0, 100, 255, 0.1);
                border: 1px solid rgba(0, 100, 255, 0.4);
                border-radius: 6px;
                padding: 8px;
            ">
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">TURNO</div>
                <div id="panel-turno-actual" style="
                    font-size: 12px;
                    font-weight: bold;
                    color: #00aaff;
                    font-family: 'Courier New', monospace;
                ">0</div>

                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-top: 8px; margin-bottom: 4px;">TIEMPO RESTANTE</div>
                <div id="panel-tiempo-restante" style="
                    font-size: 20px;
                    font-weight: bold;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    text-align: center;
                ">05:00</div>
            </div>

            <!-- Contenedor de Botones Dinámicos -->
            <div id="panel-botones-dinamicos" style="
                display: flex;
                flex-direction: column;
                gap: 8px;
            ">
                <!-- Botones se agregan dinámicamente según fase -->
            </div>
        `;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SECCIÓN CENTRAL: Lista de Elementos
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const seccionCentral = document.createElement('div');
        seccionCentral.id = 'panel-seccion-elementos';
        seccionCentral.style.cssText = `
            flex: 1;
            height: 100%;
            background: rgba(10, 10, 10, 0.95);
            padding: 15px;
            overflow-y: auto;
        `;

        seccionCentral.innerHTML = `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <div style="
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">Elementos en Mapa</div>
                <div id="panel-contador-elementos" style="
                    font-size: 12px;
                    color: #00ff00;
                    font-weight: bold;
                ">0 elementos</div>
            </div>
            <div id="panel-lista-elementos" style="
                display: flex;
                flex-direction: column;
                gap: 8px;
            ">
                <!-- Elementos se agregarán dinámicamente aquí -->
                <div style="
                    text-align: center;
                    color: rgba(255, 255, 255, 0.3);
                    padding: 40px 20px;
                    font-size: 13px;
                ">
                    No hay elementos en el mapa todavía.
                    <br>
                    <span style="font-size: 11px; margin-top: 8px; display: block;">
                        Los elementos aparecerán aquí durante la fase de DESPLIEGUE
                    </span>
                </div>
            </div>
        `;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SECCIÓN DERECHA: MAIRAChat
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const seccionDerecha = document.createElement('div');
        seccionDerecha.id = 'panel-seccion-chat';
        seccionDerecha.style.cssText = `
            width: 300px;
            height: 100%;
            background: rgba(20, 20, 20, 0.95);
            border-left: 1px solid rgba(0, 255, 0, 0.3);
            display: flex;
            flex-direction: column;
        `;

        seccionDerecha.innerHTML = `
            <div style="
                padding: 12px 15px;
                background: rgba(0, 255, 0, 0.1);
                border-bottom: 1px solid rgba(0, 255, 0, 0.3);
                font-size: 12px;
                color: #00ff00;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
            ">
                M.A.I.R.A. Chat
            </div>
            <div id="panel-maira-chat-contenido" style="
                flex: 1;
                padding: 15px;
                overflow-y: auto;
            ">
                <div style="
                    text-align: center;
                    color: rgba(255, 255, 255, 0.3);
                    padding: 40px 20px;
                    font-size: 13px;
                ">
                    Chat no disponible aún
                    <br>
                    <span style="font-size: 11px; margin-top: 8px; display: block;">
                        Esta sección se integrará con MAIRAChat
                    </span>
                </div>
            </div>
        `;

        // Ensamblar las 3 secciones
        contenedor.appendChild(seccionIzquierda);
        contenedor.appendChild(seccionCentral);
        contenedor.appendChild(seccionDerecha);

        document.body.appendChild(contenedor);
        console.log('✅ Panel Integrado creado con 3 secciones (Estado | Elementos | Chat)');

        // Inicializar botones dinámicos después de un breve delay
        setTimeout(() => {
            this.actualizarBotonesDinamicos();
        }, 100);
    }

    /**
     * Actualiza los botones dinámicos según la fase actual
     */
    actualizarBotonesDinamicos() {
        const contenedor = document.getElementById('panel-botones-dinamicos');
        if (!contenedor) return;

        // Limpiar botones existentes
        contenedor.innerHTML = '';

        if (!this.faseManager) return;

        const fase = this.faseManager.faseActual;
        const subfase = this.faseManager.subfaseActual;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // FASE: PREPARACIÓN (FLUJO SECUENCIAL - UN BOTÓN A LA VEZ)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (fase === 'preparacion') {
            // 1. Delimitar Sector
            if (!this.faseManager.sector) {
                this.agregarBoton(contenedor, {
                    texto: '🗺️ Delimitar Sector',
                    color: 'rgba(255, 193, 7, 0.8)',
                    colorHover: 'rgba(255, 193, 7, 1)',
                    border: '#FFC107',
                    onClick: () => {
                        console.log('🗺️ Iniciando definición de sector...');
                        this.faseManager.iniciarDefinicionSector();
                    }
                });
            }
            // 2. Confirmar Sector
            else if (this.faseManager.sector && !this.faseManager.sectorConfirmado) {
                this.agregarBoton(contenedor, {
                    texto: '✅ Confirmar Sector',
                    color: 'rgba(76, 175, 80, 0.8)',
                    colorHover: 'rgba(76, 175, 80, 1)',
                    border: '#4CAF50',
                    onClick: () => {
                        console.log('✅ Confirmando sector...');
                        this.faseManager.confirmarSector();
                    }
                });
            }
            // 3. Delimitar Zona Azul
            else if (this.faseManager.sectorConfirmado && !this.faseManager.zonaAzul) {
                this.agregarBoton(contenedor, {
                    texto: '🔵 Delimitar Zona Azul',
                    color: 'rgba(33, 150, 243, 0.8)',
                    colorHover: 'rgba(33, 150, 243, 1)',
                    border: '#2196F3',
                    onClick: () => {
                        console.log('🔵 Iniciando definición zona azul...');
                        this.faseManager.iniciarDefinicionZona('azul');
                    }
                });
            }
            // 4. Confirmar Zona Azul
            else if (this.faseManager.zonaAzul && !this.faseManager.zonaAzulConfirmada) {
                this.agregarBoton(contenedor, {
                    texto: '✅ Confirmar Zona Azul',
                    color: 'rgba(76, 175, 80, 0.8)',
                    colorHover: 'rgba(76, 175, 80, 1)',
                    border: '#4CAF50',
                    onClick: () => {
                        console.log('✅ Confirmando zona azul...');
                        this.faseManager.confirmarZonaAzul();
                    }
                });
            }
            // 5. Delimitar Zona Roja
            else if (this.faseManager.zonaAzulConfirmada && !this.faseManager.zonaRoja) {
                this.agregarBoton(contenedor, {
                    texto: '🔴 Delimitar Zona Roja',
                    color: 'rgba(244, 67, 54, 0.8)',
                    colorHover: 'rgba(244, 67, 54, 1)',
                    border: '#F44336',
                    onClick: () => {
                        console.log('🔴 Iniciando definición zona roja...');
                        this.faseManager.iniciarDefinicionZona('rojo');
                    }
                });
            }
            // 6. Confirmar Zona Roja
            else if (this.faseManager.zonaRoja && !this.faseManager.zonaRojaConfirmada) {
                this.agregarBoton(contenedor, {
                    texto: '✅ Confirmar Zona Roja',
                    color: 'rgba(76, 175, 80, 0.8)',
                    colorHover: 'rgba(76, 175, 80, 1)',
                    border: '#4CAF50',
                    onClick: () => {
                        console.log('✅ Confirmando zona roja...');
                        this.faseManager.confirmarZonaRoja();
                    }
                });
            }
            // 7. Iniciar Despliegue (ambas zonas confirmadas)
            else if (this.faseManager.zonaAzulConfirmada && this.faseManager.zonaRojaConfirmada) {
                this.agregarBoton(contenedor, {
                    texto: '🎯 Iniciar Despliegue',
                    color: 'rgba(156, 39, 176, 0.8)',
                    colorHover: 'rgba(156, 39, 176, 1)',
                    border: '#9C27B0',
                    onClick: () => {
                        console.log('🎯 Pasando a despliegue...');
                        this.faseManager.finalizarPreparacion();
                    }
                });
            }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // FASE: DESPLIEGUE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        else if (fase === 'despliegue') {
            const modoJuego = this.faseManager.modoJuego;
            const jugadorActual = this.faseManager.obtenerJugadorActual();

            let textoBoton = '⚔️ Listo para Combate';
            if (modoJuego === 'local' && jugadorActual) {
                textoBoton = `✅ ${jugadorActual.nombre} Listo`;
            }

            this.agregarBoton(contenedor, {
                texto: textoBoton,
                color: 'rgba(76, 175, 80, 0.8)',
                colorHover: 'rgba(76, 175, 80, 1)',
                border: '#4CAF50',
                onClick: () => {
                    console.log('✅ Jugador confirmó despliegue...');
                    this.faseManager.jugadorListo();
                }
            });
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // FASE: COMBATE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        else if (fase === 'combate') {
            // Solo mostrar "Pasar Turno" durante imparticion
            if (subfase === 'imparticion') {
                this.agregarBoton(contenedor, {
                    texto: '✅ Pasar Turno',
                    color: 'rgba(76, 175, 80, 0.8)',
                    colorHover: 'rgba(76, 175, 80, 1)',
                    border: '#4CAF50',
                    onClick: () => {
                        console.log('✅ Pasando turno...');
                        if (this.turnosManager) {
                            this.turnosManager.finalizarTurnoManual();
                        }
                    }
                });
            }
        }
    }

    /**
     * Agrega un botón al contenedor de botones dinámicos
     */
    agregarBoton(contenedor, config) {
        const btn = document.createElement('button');
        btn.textContent = config.texto;
        btn.style.cssText = `
            padding: 12px 20px;
            background: ${config.color};
            border: 2px solid ${config.border};
            border-radius: 6px;
            color: white;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.background = config.colorHover;
            btn.style.transform = 'scale(1.05)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.background = config.color;
            btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', config.onClick);

        contenedor.appendChild(btn);
    }

    /**
     * Actualiza el panel de estado (fase, turno, tiempo)
     */
    actualizarPanelEstado() {
        // Actualizar fase
        const faseElement = document.getElementById('panel-fase-actual');
        const subfaseElement = document.getElementById('panel-subfase-actual');

        if (faseElement && this.faseManager) {
            faseElement.textContent = this.faseManager.faseActual.toUpperCase();

            if (subfaseElement && this.faseManager.subfaseActual) {
                subfaseElement.textContent = `└─ ${this.faseManager.subfaseActual}`;
                subfaseElement.style.display = 'block';
            } else if (subfaseElement) {
                subfaseElement.style.display = 'none';
            }
        }

        // Actualizar turno
        const turnoElement = document.getElementById('panel-turno-actual');
        if (turnoElement && this.turnosManager) {
            turnoElement.textContent = this.turnosManager.getTurnoActual();
        }

        // Actualizar tiempo restante
        const tiempoElement = document.getElementById('panel-tiempo-restante');
        if (tiempoElement && this.turnosManager) {
            const segundos = this.turnosManager.getTiempoRestante();
            const minutos = Math.floor(segundos / 60);
            const segs = segundos % 60;
            tiempoElement.textContent = `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;

            // Cambiar color según tiempo restante
            if (segundos <= 30) {
                tiempoElement.style.color = '#ff0000';
            } else if (segundos <= 60) {
                tiempoElement.style.color = '#ff9800';
            } else {
                tiempoElement.style.color = '#00ff00';
            }
        }

        // Actualizar información de jugador y equipo
        const jugadorElement = document.getElementById('panel-jugador-actual');
        const equipoElement = document.getElementById('panel-equipo-actual');

        if (jugadorElement && equipoElement) {
            // Determinar jugador actual y equipo
            let jugadorTexto = 'Director';
            let equipoTexto = '--';
            let colorEquipo = '#ff9800'; // Naranja por defecto

            // En fase PREPARACIÓN: siempre Director
            if (this.faseManager && this.faseManager.faseActual === 'preparacion') {
                jugadorTexto = 'Director';
                equipoTexto = '--';
                colorEquipo = '#ff9800';
            }
            // En DESPLIEGUE: usar turnoDespliegueActual
            else if (this.faseManager && this.faseManager.faseActual === 'despliegue') {
                const jugadorActual = this.faseManager.obtenerJugadorActual();

                if (jugadorActual) {
                    // Modo LOCAL - usar jugador actual de despliegue
                    jugadorTexto = `${this.faseManager.turnoDespliegueActual + 1} - ${jugadorActual.nombre || jugadorActual.username}`;
                    equipoTexto = jugadorActual.equipo.charAt(0).toUpperCase() + jugadorActual.equipo.slice(1); // Capitalizar
                    colorEquipo = jugadorActual.equipo === 'azul' ? '#0066ff' : '#ff0000';
                } else {
                    // Modo ONLINE o error
                    equipoTexto = 'DESPLIEGUE';
                    colorEquipo = '#ff9800';
                    jugadorTexto = 'Jugador';
                }
            }
            // En COMBATE: mostrar jugador y equipo basado en turnos
            else if (this.faseManager && this.faseManager.faseActual === 'combate') {
                // Obtener turno actual (par = azul, impar = rojo en local)
                const turno = this.turnosManager ? this.turnosManager.getTurnoActual() : 0;
                const esAzul = turno % 2 === 0;

                // Determinar equipo
                equipoTexto = esAzul ? 'Azul' : 'Rojo';
                colorEquipo = esAzul ? '#0066ff' : '#ff0000';

                // Intentar obtener info del jugador desde config
                if (this.config && this.config.jugadores && this.config.jugadores.length > 0) {
                    const jugadoresEquipo = this.config.jugadores.filter(j => j.equipo === (esAzul ? 'azul' : 'rojo'));
                    if (jugadoresEquipo.length > 0) {
                        const jugadorIndex = Math.floor(turno / 2) % jugadoresEquipo.length;
                        const jugador = jugadoresEquipo[jugadorIndex];
                        jugadorTexto = `${jugadorIndex + 1} - ${jugador.nombre || jugador.username || 'Jugador'}`;
                    } else {
                        jugadorTexto = esAzul ? 'Jugador Azul' : 'Jugador Rojo';
                    }
                } else {
                    jugadorTexto = esAzul ? 'Jugador Azul' : 'Jugador Rojo';
                }
            }

            jugadorElement.textContent = jugadorTexto;
            equipoElement.textContent = equipoTexto;
            equipoElement.style.color = colorEquipo;
            jugadorElement.style.color = colorEquipo;
        }

        // Actualizar botones dinámicos según fase
        this.actualizarBotonesDinamicos();
    }

    /**
     * Actualiza la lista de elementos en el panel central
     */
    actualizarListaElementos() {
        const listaContainer = document.getElementById('panel-lista-elementos');
        const contador = document.getElementById('panel-contador-elementos');

        if (!listaContainer) return;

        // TODO: Obtener elementos del mapa (desde hexGrid o gestorUnidades)
        // Por ahora, mostrar placeholder
        const elementos = []; // Aquí irían los elementos reales

        if (contador) {
            contador.textContent = `${elementos.length} elemento${elementos.length !== 1 ? 's' : ''}`;
        }

        if (elementos.length === 0) {
            listaContainer.innerHTML = `
                <div style="
                    text-align: center;
                    color: rgba(255, 255, 255, 0.3);
                    padding: 40px 20px;
                    font-size: 13px;
                ">
                    No hay elementos en el mapa todavía.
                    <br>
                    <span style="font-size: 11px; margin-top: 8px; display: block;">
                        Los elementos aparecerán aquí durante la fase de DESPLIEGUE
                    </span>
                </div>
            `;
        } else {
            // TODO: Renderizar elementos con SIDC
            listaContainer.innerHTML = elementos.map(elem => `
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background: rgba(0, 255, 0, 0.2);
                        border: 1px solid rgba(0, 255, 0, 0.5);
                        border-radius: 4px;
                    ">
                        <!-- Aquí iría el símbolo SIDC -->
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 13px; color: white; font-weight: bold;">${elem.nombre}</div>
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">${elem.tipo}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Inicializa el GestorOrdenesV2 (corazón del sistema)
     */
    async inicializarGestorOrdenesV2() {
        try {
            this.gestorOrdenesV2 = new GestorOrdenesV2({
                debug: true,
                duracionTurnoMinutos: this.config.duracionTurnoMinutos,
                permitirDeshacer: true
            });

            const exito = await this.gestorOrdenesV2.inicializar({
                map: this.map,
                hexGrid: this.hexGrid,
                menuRadial: this.menuRadial,
                equipos: this.config.equipos,
                contenedorPanel: 'panel-coordinacion-container'
            });

            if (!exito) {
                throw new Error('GestorOrdenesV2 no se pudo inicializar');
            }

            // Exponer globalmente
            window.gestorOrdenesV2 = this.gestorOrdenesV2;

            // Configurar eventos
            this.configurarEventosGestor();

            // ⚠️ NO iniciar automáticamente - esperar a que el jugador cambie a fase combate
            // El juego tiene fases previas: preparación → despliegue → combate
            // this.gestorOrdenesV2.iniciarPlanificacion();

            console.log('⏸️ GestorOrdenesV2 listo - esperando fase COMBATE para activarse');

            console.log('✅ GestorOrdenesV2 inicializado');

        } catch (error) {
            console.error('❌ Error inicializando GestorOrdenesV2:', error);
            throw error;
        }
    }

    /**
     * Inicializa el FaseManager (gestión de fases del juego)
     */
    async inicializarFaseManager() {
        try {
            console.log('🎯 Inicializando FaseManager...');

            this.faseManager = new FaseManager({
                map: this.map,
                hexGrid: this.hexGrid,
                gestorOrdenes: this.gestorOrdenesV2,
                configuracion: this.config,
                jugadores: this.config.jugadores || [],
                director: this.config.director || null,

                // Callbacks
                onFaseChange: (fase, subfase) => {
                    console.log(`🎯 Fase cambió: ${fase} ${subfase ? `(${subfase})` : ''}`);

                    // ✅ Actualizar fase del menú radial
                    if (this.menuRadial && this.menuRadial.setFaseJuego) {
                        this.menuRadial.setFaseJuego(fase);
                        console.log(`📋 Menú radial actualizado a fase: ${fase}`);
                    }

                    // Si entramos en fase COMBATE, activar gestor de órdenes y reloj
                    if (fase === 'combate') {
                        console.log('⚔️ Activando GestorOrdenesV2 y TurnosManager para fase COMBATE');

                        if (this.gestorOrdenesV2) {
                            this.gestorOrdenesV2.iniciarPlanificacion();
                        }

                        // ⏱️ Iniciar reloj del turno 1
                        if (this.turnosManager) {
                            console.log('⏱️ Iniciando reloj - Turno 1');
                            this.turnosManager.iniciarTurno(1);
                        }
                    }

                    // Actualizar panel integrado
                    this.actualizarPanelEstado();

                    // Actualizar botones dinámicos
                    this.actualizarBotonesDinamicos();
                },

                onSubfaseChange: (subfase) => {
                    console.log(`📍 Subfase cambió: ${subfase}`);

                    // Actualizar panel integrado
                    this.actualizarPanelEstado();
                },

                onTurnoChange: (turno) => {
                    console.log(`🔄 Turno cambió: ${turno}`);

                    // Iniciar nuevo turno en TurnosManager
                    if (this.turnosManager) {
                        this.turnosManager.iniciarTurno(turno);
                    }

                    // Actualizar panel integrado
                    this.actualizarPanelEstado();
                }
            });

            await this.faseManager.inicializar();

            // Exponer globalmente
            window.faseManager = this.faseManager;

            // ✅ Escuchar eventos de cambio de estado (sector/zonas y cambio de jugador en despliegue)
            document.addEventListener('cambioEstadoPreparacion', () => {
                console.log('📡 Evento cambioEstadoPreparacion recibido - actualizando panel y botones');
                this.actualizarPanelEstado(); // ✅ Actualizar panel cuando cambia jugador en despliegue
                this.actualizarBotonesDinamicos();
            });

            // ✅ Escuchar eventos de elementos agregados
            document.addEventListener('elementoAgregado', (e) => {
                console.log('📡 Evento elementoAgregado recibido:', e.detail);
                this.agregarElementoAPanel(e.detail);
            });

            console.log('✅ FaseManager inicializado');

        } catch (error) {
            console.error('❌ Error inicializando FaseManager:', error);
            throw error;
        }
    }

    /**
     * Inicializa el TurnosManager (gestión de turnos y reloj)
     */
    async inicializarTurnosManager() {
        try {
            console.log('🕐 Inicializando TurnosManager...');

            this.turnosManager = new TurnosManager({
                duracionTurnoSegundos: (this.config.duracionTurnoMinutos || 5) * 60,
                autoFinalizarTurno: true,

                // Callbacks
                onTurnoInicio: (turno) => {
                    console.log(`🕐 Turno ${turno} iniciado`);

                    // Actualizar panel integrado
                    this.actualizarPanelEstado();
                },

                onTurnoFin: (turno, tipo) => {
                    console.log(`✅ Turno ${turno} finalizado (${tipo})`);

                    // Si es en fase COMBATE, pasar a ejecución
                    if (this.faseManager && this.faseManager.faseActual === 'combate') {
                        if (tipo === 'timeout') {
                            console.log('⏰ Timeout alcanzado - ejecutando órdenes automáticamente');
                        }
                        // this.faseManager.confirmarOrdenes(); // Esto se llama manualmente
                    }

                    // Actualizar panel integrado
                    this.actualizarPanelEstado();
                },

                onTimeout: (turno) => {
                    console.log(`⏰ TIMEOUT en turno ${turno}`);

                    // Auto-confirmar órdenes por timeout
                    if (this.faseManager && this.faseManager.subfaseActual === 'imparticion') {
                        this.faseManager.confirmarOrdenes();
                    }

                    // Actualizar panel integrado
                    this.actualizarPanelEstado();
                },

                onTick: (segundos) => {
                    // Actualizar reloj cada segundo
                    this.actualizarPanelEstado();
                }
            });

            this.turnosManager.inicializar();

            // Exponer globalmente
            window.turnosManager = this.turnosManager;

            console.log('✅ TurnosManager inicializado');

        } catch (error) {
            console.error('❌ Error inicializando TurnosManager:', error);
            throw error;
        }
    }

    /**
     * Conecta panelInferiorUnificado con FaseManager y TurnosManager V2
     */
    async conectarPanelInferiorUnificado() {
        console.log('🔗 Conectando panelInferiorUnificado con gestores V2...');

        try {
            // Esperar a que panelInferiorUnificado esté disponible
            if (!window.panelInferiorUnificado) {
                console.warn('⚠️ panelInferiorUnificado no disponible - se inicializará automáticamente');
                return;
            }

            // Conectar FaseManager con el panel
            if (this.faseManager) {
                window.gestorFases = this.faseManager; // Exponer para compatibilidad con panelInferiorUnificado
                console.log('✅ FaseManager conectado con panel');
            }

            // Conectar TurnosManager con el panel
            if (this.turnosManager) {
                window.gestorTurnos = this.turnosManager; // Exponer para compatibilidad con panelInferiorUnificado
                console.log('✅ TurnosManager conectado con panel');
            }

            // Forzar actualización inicial del panel
            if (window.panelInferiorUnificado.forzarActualizacionCompleta) {
                window.panelInferiorUnificado.forzarActualizacionCompleta();
                console.log('✅ Panel actualizado con estado inicial');
            }

            console.log('✅ panelInferiorUnificado conectado con gestores V2');

        } catch (error) {
            console.error('❌ Error conectando panelInferiorUnificado:', error);
            // No lanzar error - el panel puede inicializarse después
        }
    }

    /**
     * Configura eventos del gestor
     */
    configurarEventosGestor() {
        this.gestorOrdenesV2.on('subfaseCambiada', (datos) => {
            console.log(`📍 Subfase cambiada: ${datos.subfase} (Turno ${datos.turno})`);
            this.actualizarUISegunSubfase(datos.subfase);
        });

        this.gestorOrdenesV2.on('turnoFinalizado', (datos) => {
            console.log(`✅ Turno ${datos.turno} finalizado`);
        });
    }

    /**
     * Actualiza UI según subfase
     * ✅ Ahora actualiza el panel integrado
     */
    actualizarUISegunSubfase(subfase) {
        // Actualizar el panel integrado
        this.actualizarPanelEstado();
    }

    /**
     * Configura interfaz distintiva V2
     */
    configurarInterfazV2() {
        // ✅ NO crear indicador flotante - ahora se renderiza en panel integrado
        // El indicador de fase ya está dentro del panel-coordinacion-container
        console.log('✅ Indicador de fase integrado en panel (no flotante)');

        // Crear badge V2
        const badge = document.createElement('div');
        badge.id = 'badge-v2';
        badge.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-radius: 20px;
            z-index: 2001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        badge.textContent = '🎮 JUEGO V2';
        document.body.appendChild(badge);

        // Crear botones de control V2
        this.crearBotonesControlV2();

        console.log('✅ Interfaz V2 configurada');
    }

    /**
     * Crea botones de control específicos de V2
     * Los botones ahora se crean dinámicamente dentro de panelInferiorUnificado
     */
    crearBotonesControlV2() {
        // ✅ BOTONES AHORA DENTRO DEL PANEL INFERIOR UNIFICADO
        // panelInferiorUnificado.js los crea dinámicamente según la fase
        console.log('✅ Botones de control ahora manejados por panelInferiorUnificado');

        // ✅ CREAR CONTROLES DE PANEL (FLECHA TOGGLE Y BOTÓN TIMELINE)
        this.crearControlesPanelInferior();
    }

    /**
     * Crea controles de panel inferior estilo Total War Rome III
     */
    crearControlesPanelInferior() {
        // 1. FLECHA TOGGLE PARA PANEL INFERIOR INTEGRADO
        const flechaTogglePanelInferior = document.createElement('button');
        flechaTogglePanelInferior.id = 'flecha-toggle-panel-inferior';
        flechaTogglePanelInferior.innerHTML = '▼'; // ✅ Inicialmente ▼ (flecha hacia abajo oculta el panel)
        flechaTogglePanelInferior.title = 'Mostrar/Ocultar Panel Inferior';

        // ✅ Estado inicial: panel VISIBLE, flecha a media altura
        let panelVisible = true;

        flechaTogglePanelInferior.style.cssText = `
            position: fixed;
            bottom: 250px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 30px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-bottom: none;
            border-radius: 10px 10px 0 0;
            color: #00ff00;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            z-index: 2001;
            transition: all 0.3s ease;
            box-shadow: 0 -4px 12px rgba(0, 255, 0, 0.3);
        `;

        flechaTogglePanelInferior.addEventListener('click', () => {
            // ✅ Buscar elementos del panel inferior V2
            const panelCoordinacionContainer = document.getElementById('panel-coordinacion-container');
            const btnToggleCoordinacion = document.getElementById('btn-toggle-coordinacion');
            const badgeV2 = document.getElementById('badge-v2');

            // Toggle estado
            panelVisible = !panelVisible;

            // Aplicar a panel integrado (usa flex!)
            if (panelCoordinacionContainer) {
                panelCoordinacionContainer.style.display = panelVisible ? 'flex' : 'none';
            }

            // Aplicar a botones auxiliares
            if (btnToggleCoordinacion) {
                btnToggleCoordinacion.style.display = panelVisible ? 'block' : 'none';
            }

            if (badgeV2) {
                badgeV2.style.display = panelVisible ? 'block' : 'none';
            }

            // Actualizar flecha
            if (panelVisible) {
                // Panel VISIBLE: flecha a media altura, apuntando hacia abajo (▼) para OCULTAR
                flechaTogglePanelInferior.innerHTML = '▼';
                flechaTogglePanelInferior.style.bottom = '250px';
                console.log('📖 Panel inferior MOSTRADO');
            } else {
                // Panel OCULTO: flecha abajo, apuntando hacia arriba (▲) para MOSTRAR
                flechaTogglePanelInferior.innerHTML = '▲';
                flechaTogglePanelInferior.style.bottom = '0';
                console.log('📕 Panel inferior OCULTADO');
            }
        });

        flechaTogglePanelInferior.addEventListener('mouseenter', () => {
            flechaTogglePanelInferior.style.background = 'rgba(0, 255, 0, 0.2)';
            flechaTogglePanelInferior.style.transform = 'translateX(-50%) scale(1.1)';
        });

        flechaTogglePanelInferior.addEventListener('mouseleave', () => {
            flechaTogglePanelInferior.style.background = 'rgba(0, 0, 0, 0.8)';
            flechaTogglePanelInferior.style.transform = 'translateX(-50%) scale(1)';
        });

        document.body.appendChild(flechaTogglePanelInferior);
        window.flechaTogglePanelInferior = flechaTogglePanelInferior; // ✅ Exponer globalmente

        // 2. BOTÓN DENTRO DEL PANEL PARA TOGGLE PANEL DE COORDINACIÓN
        setTimeout(() => {
            const panelCoordinacionContainer = document.getElementById('panel-coordinacion-container');

            if (panelCoordinacionContainer) {
                const btnToggleCoordinacion = document.createElement('button');
                btnToggleCoordinacion.id = 'btn-toggle-coordinacion';
                btnToggleCoordinacion.innerHTML = '📊 Matriz de Coordinación';
                btnToggleCoordinacion.title = 'Mostrar/Ocultar Matriz de Coordinación de Órdenes';
                btnToggleCoordinacion.style.cssText = `
                    position: fixed;
                    bottom: 260px;
                    right: 20px;
                    padding: 8px 16px;
                    background: rgba(102, 0, 204, 0.8);
                    border: 2px solid #9966ff;
                    border-radius: 6px;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    cursor: pointer;
                    z-index: 1351; /* ✅ Sobre panel coordinación (antes 2002) */
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(153, 102, 255, 0.3);
                `;

                btnToggleCoordinacion.addEventListener('click', () => {
                    // ✅ Usar métodos del panel en lugar de manipular DOM directamente
                    const panelCoordinacion = document.getElementById('panelCoordinacionOrdenes');

                    if (panelCoordinacion && window.gestorOrdenes?.panelCoordinacion) {
                        // Verificar estado actual
                        const estaOculto = window.getComputedStyle(panelCoordinacion).display === 'none';

                        if (estaOculto) {
                            // Mostrar panel usando el método correcto
                            window.gestorOrdenes.panelCoordinacion.mostrar();
                            btnToggleCoordinacion.innerHTML = '📊 Ocultar Matriz';
                            console.log('📊 Matriz de coordinación MOSTRADA');
                        } else {
                            // Ocultar panel usando el método correcto
                            window.gestorOrdenes.panelCoordinacion.ocultar();
                            btnToggleCoordinacion.innerHTML = '📊 Matriz de Coordinación';
                            console.log('📕 Matriz de coordinación OCULTADA');
                        }
                    } else {
                        console.warn('⚠️ Timeline de coordinación no encontrado aún - se creará cuando inicies fase COMBATE');
                    }
                });

                btnToggleCoordinacion.addEventListener('mouseenter', () => {
                    btnToggleCoordinacion.style.background = 'rgba(153, 102, 255, 0.9)';
                    btnToggleCoordinacion.style.transform = 'scale(1.05)';
                });

                btnToggleCoordinacion.addEventListener('mouseleave', () => {
                    btnToggleCoordinacion.style.background = 'rgba(102, 0, 204, 0.8)';
                    btnToggleCoordinacion.style.transform = 'scale(1)';
                });

                document.body.appendChild(btnToggleCoordinacion); // ✅ Agregar al body, no al panel
                console.log('✅ Botón toggle timeline agregado');
            }
        }, 1500); // Esperar a que se cree todo

        console.log('✅ Controles de panel inferior estilo Total War creados');
    }

    /**
     * Crea un botón con estilo V2
     */
    crearBoton(texto, color, onClick) {
        const btn = document.createElement('button');
        btn.textContent = texto;
        btn.style.cssText = `
            padding: 10px 20px;
            background: ${color};
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        });

        btn.addEventListener('click', onClick);

        return btn;
    }

    /**
     * Inicializa chat
     */
    async inicializarChat() {
        try {
            const socketDisponible = window.socket || window.clientSocket;

            if (socketDisponible && socketDisponible.connected) {
                if (typeof MAIRAChat !== 'undefined') {
                    const exito = MAIRAChat.inicializar({
                        socket: socketDisponible,
                        usuario: window.userName || 'Jugador',
                        modulo: 'juegodeguerraV2'
                    });

                    if (exito) {
                        console.log('✅ Chat inicializado');
                    }
                }
            } else {
                console.log('💬 Modo local - chat en modo básico');
            }
        } catch (error) {
            console.warn('⚠️ Chat no disponible:', error);
        }
    }

    /**
     * Muestra instrucciones iniciales
     */
    mostrarInstruccionesIniciales() {
        console.log('\n📖 INSTRUCCIONES JUEGO V2:');
        console.log('1. Haz doble-click en una unidad para abrir menú radial');
        console.log('2. Selecciona "Mover" o "Atacar"');
        console.log('3. Click en destino/objetivo');
        console.log('4. Click "Confirmar Órdenes" cuando termines');
        console.log('5. Las órdenes se ejecutarán simultáneamente');
        console.log('6. Revisa resultados y click "Siguiente Turno"\n');

        // Mostrar en pantalla
        setTimeout(() => {
            if (window.notificationSystem) {
                window.notificationSystem.show('🎮 Juego V2 listo - Ver consola para instrucciones', 'success');
            } else {
                alert('🎮 Juego V2 listo!\n\nVer consola (F12) para instrucciones.');
            }
        }, 1000);
    }

    /**
     * Muestra error en pantalla
     */
    mostrarError(error) {
        const mensaje = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 0, 0, 0.95);
                color: white;
                padding: 30px;
                border-radius: 10px;
                z-index: 9999;
                max-width: 500px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            ">
                <h2>❌ Error Juego V2</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="
                    padding: 10px 20px;
                    background: white;
                    color: red;
                    border: none;
                    border-radius: 5px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 15px;
                ">🔄 Reintentar</button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', mensaje);
    }

    /**
     * Obtiene estadísticas del sistema V2
     */
    obtenerEstadisticas() {
        if (!this.gestorOrdenesV2) return null;

        const stats = {
            turno: this.gestorOrdenesV2.turnoActual,
            subfase: this.gestorOrdenesV2.subfaseActual,
            tiempoSimulado: this.gestorOrdenesV2.tiempoSimuladoMinutos,
            equipos: {}
        };

        for (const [equipo, cola] of this.gestorOrdenesV2.colasOrdenes) {
            stats.equipos[equipo] = cola.obtenerEstadisticas();
        }

        return stats;
    }

    /**
     * ✅ Agrega un elemento al panel inferior central
     * @param {Object} detalle - Detalles del elemento agregado (desde evento)
     */
    agregarElementoAPanel(detalle) {
        const { marcador, sidc, nombre, equipo, jugador } = detalle;

        if (!equipo) {
            console.warn('⚠️ Elemento sin equipo asignado, no se agregará al panel');
            return;
        }

        // Agregar al array de elementos
        const elemento = {
            marcador,
            sidc,
            nombre,
            equipo,
            jugador,
            timestamp: Date.now()
        };

        this.elementos[equipo].push(elemento);
        console.log(`✅ Elemento agregado a lista ${equipo}:`, elemento);

        // Actualizar visualización del panel
        this.actualizarListaElementosPanel();
    }

    /**
     * ✅ Actualiza la lista visual de elementos en el panel central
     */
    actualizarListaElementosPanel() {
        const listaContainer = document.getElementById('panel-lista-elementos');
        if (!listaContainer) return;

        // ✅ DIFERENCIA LOCAL vs ONLINE
        let elementosAMostrar = [];

        if (this.config?.modoJuego === 'online') {
            // ONLINE: Mostrar solo elementos del jugador actual
            const equipoJugador = window.equipoJugador || 'azul';
            const jugadorNombre = window.jugadorActual;
            
            const todosDelEquipo = this.elementos[equipoJugador] || [];
            if (jugadorNombre) {
                elementosAMostrar = todosDelEquipo.filter(elem => elem.jugador === jugadorNombre);
                console.log(`🎮 ONLINE: Mostrando solo elementos de ${jugadorNombre} (${elementosAMostrar.length}/${todosDelEquipo.length})`);
            } else {
                elementosAMostrar = todosDelEquipo;
            }
        } else {
            // LOCAL: Mostrar elementos según turno del jugador actual
            const jugadorActual = this.faseManager?.obtenerJugadorActual();

            if (jugadorActual && jugadorActual.equipo) {
                const todosDelEquipo = this.elementos[jugadorActual.equipo] || [];
                if (jugadorActual.nombre) {
                    elementosAMostrar = todosDelEquipo.filter(elem => elem.jugador === jugadorActual.nombre);
                    console.log(`🎮 LOCAL: Mostrando solo elementos de ${jugadorActual.nombre} (${elementosAMostrar.length}/${todosDelEquipo.length})`);
                } else {
                    elementosAMostrar = todosDelEquipo;
                    console.log(`🎮 LOCAL: Mostrando elementos de ${jugadorActual.equipo} (sin filtro por jugador)`);
                }
            } else {
                // Si no hay jugador actual definido (ej: fase preparación completa),
                // mostrar todos los elementos
                elementosAMostrar = [
                    ...this.elementos.azul,
                    ...this.elementos.rojo
                ];
                console.log('🎮 LOCAL: Mostrando todos los elementos (sin jugador activo)');
            }
        }

        if (elementosAMostrar.length === 0) {
            listaContainer.innerHTML = `
                <div style="
                    text-align: center;
                    color: rgba(255, 255, 255, 0.3);
                    padding: 40px 20px;
                    font-size: 13px;
                ">
                    <i class="fas fa-chess-knight" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i>
                    <br>
                    No hay elementos desplegados
                    <br>
                    <span style="font-size: 11px; margin-top: 8px; display: block;">
                        Los elementos aparecerán aquí durante la fase de DESPLIEGUE
                    </span>
                </div>
            `;
        } else {
            listaContainer.innerHTML = elementosAMostrar.map((elem, index) => `
                <div style="
                    background: rgba(${elem.equipo === 'azul' ? '0, 102, 255' : '255, 0, 0'}, 0.1);
                    border-left: 3px solid ${elem.equipo === 'azul' ? '#0066ff' : '#ff0000'};
                    border-radius: 4px;
                    padding: 8px 12px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.2s;
                    cursor: pointer;
                " onmouseenter="this.style.background='rgba(${elem.equipo === 'azul' ? '0, 102, 255' : '255, 0, 0'}, 0.2)'"
                   onmouseleave="this.style.background='rgba(${elem.equipo === 'azul' ? '0, 102, 255' : '255, 0, 0'}, 0.1)'"
                   onclick="window.inicializadorV2.centrarElemento(${index}, '${elem.equipo}')">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background: rgba(${elem.equipo === 'azul' ? '0, 102, 255' : '255, 0, 0'}, 0.3);
                        border: 1px solid ${elem.equipo === 'azul' ? '#0066ff' : '#ff0000'};
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                    ">
                        ${elem.equipo === 'azul' ? '🔵' : '🔴'}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 13px; color: white; font-weight: bold;">${elem.nombre || 'Sin nombre'}</div>
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                            ${elem.equipo.toUpperCase()}
                            ${elem.sidc ? ` | SIDC: <span style="font-family: monospace; color: rgba(255, 255, 255, 0.7);">${elem.sidc}</span>` : ''}
                            ${elem.jugador ? ` | Jugador: ${elem.jugador}` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * ✅ Centra el mapa en un elemento al hacer click
     */
    centrarElemento(index, equipo) {
        const elemento = this.elementos[equipo][index];
        if (elemento && elemento.marcador && this.map) {
            const latlng = elemento.marcador.getLatLng();
            this.map.setView(latlng, 14, { animate: true });
            console.log(`🎯 Centrando en elemento: ${elemento.nombre}`);
        }
    }
}

// Exportar globalmente
window.InicializadorJuegoV2 = InicializadorJuegoV2;
console.log('📦 InicializadorJuegoV2.js cargado');
