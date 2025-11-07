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
            // ✅ PRIORIDAD 1: Configuración desde iniciarpartida.js
            const configLocal = localStorage.getItem('configuracionPartidaLocal');
            if (configLocal) {
                console.log('✅ Configuración encontrada en configuracionPartidaLocal');
                const config = JSON.parse(configLocal);
                return this.convertirConfiguracionLocal(config);
            }

            // PRIORIDAD 2: Intentar obtener desde URL
            const urlParams = new URLSearchParams(window.location.search);
            const codigoPartida = urlParams.get('codigo');

            if (codigoPartida) {
                // Buscar en sessionStorage
                const datosSession = sessionStorage.getItem('datosPartidaActual');
                if (datosSession) {
                    const parsed = JSON.parse(datosSession);
                    const datosPartida = parsed.partidaActual || parsed;

                    if (datosPartida && datosPartida.codigo === codigoPartida) {
                        return this.convertirDatosPartida(datosPartida);
                    }
                }

                // Buscar en localStorage
                const datosLocal = localStorage.getItem('datosPartida');
                if (datosLocal) {
                    const datosPartida = JSON.parse(datosLocal);
                    if (datosPartida && datosPartida.codigo === codigoPartida) {
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
     * Crea el contenedor para el panel de coordinación
     */
    crearContenedorPanelCoordinacion() {
        // Verificar si ya existe
        if (document.getElementById('panel-coordinacion-container')) {
            console.log('✅ Contenedor Panel Coordinación ya existe');
            return;
        }

        // Crear contenedor
        const contenedor = document.createElement('div');
        contenedor.id = 'panel-coordinacion-container';
        contenedor.style.cssText = `
            position: fixed;
            bottom: 60px;
            left: 0;
            right: 0;
            height: 250px;
            background: rgba(0, 0, 0, 0.9);
            border-top: 2px solid #00ff00;
            z-index: 1000;
            display: block;
        `;

        document.body.appendChild(contenedor);
        console.log('✅ Contenedor Panel Coordinación creado');
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

                    // Si entramos en fase COMBATE, activar gestor de órdenes
                    if (fase === 'combate' && this.gestorOrdenesV2) {
                        console.log('⚔️ Activando GestorOrdenesV2 para fase COMBATE');
                        this.gestorOrdenesV2.iniciarPlanificacion();
                    }
                },

                onSubfaseChange: (subfase) => {
                    console.log(`📍 Subfase cambió: ${subfase}`);
                },

                onTurnoChange: (turno) => {
                    console.log(`🔄 Turno cambió: ${turno}`);

                    // Iniciar nuevo turno en TurnosManager
                    if (this.turnosManager) {
                        this.turnosManager.iniciarTurno(turno);
                    }
                }
            });

            await this.faseManager.inicializar();

            // Exponer globalmente
            window.faseManager = this.faseManager;

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
                },

                onTimeout: (turno) => {
                    console.log(`⏰ TIMEOUT en turno ${turno}`);

                    // Auto-confirmar órdenes por timeout
                    if (this.faseManager && this.faseManager.subfaseActual === 'planificacion') {
                        this.faseManager.confirmarOrdenes();
                    }
                },

                onTick: (segundos) => {
                    // Se ejecuta cada segundo - útil para actualizaciones
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
     */
    actualizarUISegunSubfase(subfase) {
        const indicador = document.getElementById('indicador-fase-v2');
        if (!indicador) return;

        switch (subfase) {
            case 'planificacion':
                indicador.textContent = '📋 Planificación';
                indicador.style.background = '#0066cc';
                break;
            case 'ejecucion':
                indicador.textContent = '⚡ Ejecución';
                indicador.style.background = '#cc6600';
                break;
            case 'revision':
                indicador.textContent = '📊 Revisión';
                indicador.style.background = '#00cc66';
                break;
        }
    }

    /**
     * Configura interfaz distintiva V2
     */
    configurarInterfazV2() {
        // Crear indicador de fase V2
        const indicador = document.createElement('div');
        indicador.id = 'indicador-fase-v2';
        indicador.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 25px;
            background: #0066cc;
            color: white;
            font-weight: bold;
            font-size: 16px;
            border-radius: 8px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            border: 2px solid #00ff00;
        `;
        indicador.textContent = '📋 Planificación';
        document.body.appendChild(indicador);

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
            // ✅ Buscar TODOS los elementos del panel inferior
            const panelInferiorUnificado = document.getElementById('panelInferiorUnificado');
            const panelCoordinacionContainer = document.getElementById('panel-coordinacion-container');
            const botonesControlV2 = document.getElementById('botones-control-v2');
            const indicadorFase = document.getElementById('indicador-fase-v2');
            const btnToggleCoordinacion = document.getElementById('btn-toggle-coordinacion');

            // Toggle estado
            panelVisible = !panelVisible;

            // ✅ Aplicar a TODOS los elementos del panel inferior (incluyendo botones)
            const elementos = [
                panelInferiorUnificado,
                panelCoordinacionContainer,
                botonesControlV2,
                indicadorFase,
                btnToggleCoordinacion
            ];

            elementos.forEach(elemento => {
                if (elemento) {
                    elemento.style.display = panelVisible ? 'block' : 'none';
                }
            });

            // Actualizar flecha
            if (panelVisible) {
                // Panel VISIBLE: flecha a media altura, apuntando hacia abajo (▼) para OCULTAR
                flechaTogglePanelInferior.innerHTML = '▼';
                flechaTogglePanelInferior.style.bottom = '250px';
                console.log('📖 Panel inferior MOSTRADO (incluyendo botones de control)');
            } else {
                // Panel OCULTO: flecha abajo, apuntando hacia arriba (▲) para MOSTRAR
                flechaTogglePanelInferior.innerHTML = '▲';
                flechaTogglePanelInferior.style.bottom = '0';
                console.log('📕 Panel inferior OCULTADO (incluyendo botones de control)');
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
                    z-index: 2002;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(153, 102, 255, 0.3);
                `;

                btnToggleCoordinacion.addEventListener('click', () => {
                    // ✅ Toggle SOLO el panel de coordinación interno (el timeline)
                    const panelCoordinacion = document.getElementById('panelCoordinacionOrdenes');

                    if (panelCoordinacion) {
                        // Verificar estado actual
                        const estaOculto = window.getComputedStyle(panelCoordinacion).display === 'none';

                        if (estaOculto) {
                            // Mostrar panel
                            panelCoordinacion.style.display = 'flex';
                            btnToggleCoordinacion.innerHTML = '📊 Ocultar Matriz';
                            console.log('📊 Matriz de coordinación MOSTRADA');
                        } else {
                            // Ocultar panel
                            panelCoordinacion.style.display = 'none';
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
}

// Exportar globalmente
window.InicializadorJuegoV2 = InicializadorJuegoV2;
console.log('📦 InicializadorJuegoV2.js cargado');
