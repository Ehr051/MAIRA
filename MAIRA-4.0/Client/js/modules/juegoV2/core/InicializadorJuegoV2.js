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
            { nombre: 'GestorOrdenesV2', variable: 'GestorOrdenesV2' }
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

        return {
            modo: 'juego_guerra_v2',
            nombrePartida: config.nombre || 'Partida Local',
            codigo: config.codigo || `LOCAL-${Date.now()}`,
            duracionTurnoMinutos: parseInt(config.duracionTurno) || 60,
            mapaCentro: config.centro || [-34.6037, -58.3816],
            zoomInicial: parseInt(config.zoom) || 13,
            equipos: config.equipos || ['azul', 'rojo'],
            jugadores: config.jugadores || [],
            director: config.director || null,
            modoJuego: config.modoJuego || 'local',
            // Configuraciones adicionales específicas de V2
            configuracionOriginal: config
        };
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
        // Verificar si ya existe HexGrid
        if (window.HexGrid) {
            this.hexGrid = window.HexGrid;
            console.log('✅ HexGrid existente reutilizado');
            return;
        }

        // Si no existe, intentar inicializarlo
        if (typeof window.inicializarHexGrid === 'function') {
            await window.inicializarHexGrid();
            this.hexGrid = window.HexGrid;
            console.log('✅ HexGrid inicializado');
        } else {
            console.warn('⚠️ HexGrid no disponible - funcionalidad limitada');
        }
    }

    /**
     * Inicializa el menú radial
     */
    async inicializarMenuRadial() {
        if (window.MiRadial && this.map) {
            window.MiRadial.init(this.map);
            // Configurar fase a 'combate' para que ejecute acciones V2
            window.MiRadial.faseJuego = 'combate';
            this.menuRadial = window.MiRadial;
            console.log('✅ Menú Radial inicializado (fase: combate)');
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

            // Iniciar en fase de planificación
            this.gestorOrdenesV2.iniciarPlanificacion();

            console.log('✅ GestorOrdenesV2 inicializado');

        } catch (error) {
            console.error('❌ Error inicializando GestorOrdenesV2:', error);
            throw error;
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
     */
    crearBotonesControlV2() {
        const contenedor = document.createElement('div');
        contenedor.id = 'botones-control-v2';
        contenedor.style.cssText = `
            position: fixed;
            top: 130px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 2000;
        `;

        // Botón Confirmar Órdenes
        const btnConfirmar = this.crearBoton('✅ Confirmar Órdenes', '#00cc66', () => {
            if (this.gestorOrdenesV2) {
                this.gestorOrdenesV2.confirmarOrdenes();
            }
        });

        // Botón Siguiente Turno
        const btnSiguienteTurno = this.crearBoton('⏭️ Siguiente Turno', '#cc6600', () => {
            if (this.gestorOrdenesV2) {
                this.gestorOrdenesV2.finalizarTurno();
            }
        });

        // Botón Toggle Panel
        const btnTogglePanel = this.crearBoton('📊 Toggle Panel', '#6600cc', () => {
            const panel = document.getElementById('panel-coordinacion-container');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });

        contenedor.appendChild(btnConfirmar);
        contenedor.appendChild(btnSiguienteTurno);
        contenedor.appendChild(btnTogglePanel);

        document.body.appendChild(contenedor);
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
