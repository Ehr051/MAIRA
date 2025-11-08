/**
 * 🎮 GESTOR DE ÓRDENES V2
 *
 * Sistema central que integra:
 * - OrdenesQueueV2 (cola de órdenes con tiempo real)
 * - PanelCoordinacionOrdenes (visualización timeline)
 * - Menú Radial (interfaz para dar órdenes)
 * - HexGrid (mapa hexagonal)
 * - Subfases de combate (planificación → ejecución → revisión)
 *
 * @author MAIRA Team
 * @version 2.0
 */

class GestorOrdenesV2 {
    constructor(opciones = {}) {
        // Configuración
        this.config = {
            modoDebug: opciones.debug || true,
            duracionTurnoMinutos: opciones.duracionTurnoMinutos || 60, // 1 hora por turno
            velocidadEjecucion: opciones.velocidadEjecucion || 1.0, // 1x = tiempo real
            permitirDeshacer: opciones.permitirDeshacer !== false,
            maxHistorialOrdenes: opciones.maxHistorialOrdenes || 100,
            ...opciones
        };

        // Referencias a sistemas
        this.map = null;
        this.hexGrid = null;
        this.pathfinding = null;
        this.colasOrdenes = new Map(); // Map<equipoId, OrdenesQueueV2>
        this.panelCoordinacion = null;
        this.menuRadial = null;

        // Estado del juego
        this.subfaseActual = 'planificacion'; // planificacion | ejecucion | revision
        this.turnoActual = 1;
        this.tiempoSimuladoMinutos = 0;
        this.jugadorActual = null;
        this.equipoActual = null;

        // Estado de interacción
        this.unidadSeleccionada = null;
        this.modoOrden = null; // null | 'movimiento' | 'ataque' | 'defensa'
        this.origenOrden = null;
        this.destinoOrden = null;
        this.previewRuta = null;
        this.previewLinea = null;

        // Listeners de eventos
        this.eventListeners = new Map();

        // Estado de órdenes
        this.ordenesValidadas = [];
        this.ordenesEjecutadas = [];
        this.logEventosTurno = [];

        this.log('✅ GestorOrdenesV2 creado');
    }

    /**
     * Inicializa el gestor con las dependencias necesarias
     */
    async inicializar(opciones = {}) {
        this.log('🚀 Inicializando GestorOrdenesV2...');

        try {
            // Obtener referencias a sistemas existentes
            this.map = opciones.map || window.map;
            this.hexGrid = opciones.hexGrid || window.HexGrid;
            this.menuRadial = opciones.menuRadial || window.MiRadial;

            if (!this.map) throw new Error('Map no disponible');
            if (!this.hexGrid) throw new Error('HexGrid no disponible');

            // Inicializar pathfinding
            if (typeof Pathfinding !== 'undefined') {
                this.pathfinding = new Pathfinding(this.hexGrid);
                this.log('✅ Pathfinding inicializado');
            }

            // Inicializar colas de órdenes por equipo
            const equipos = opciones.equipos || ['azul', 'rojo'];
            for (const equipo of equipos) {
                const cola = new OrdenesQueueV2(equipo, {
                    debug: this.config.modoDebug,
                    duracionTurnoMinutos: this.config.duracionTurnoMinutos
                });
                this.colasOrdenes.set(equipo, cola);
                this.log(`✅ Cola de órdenes creada para equipo ${equipo}`);
            }

            // Inicializar panel de coordinación
            if (typeof PanelCoordinacionOrdenes !== 'undefined') {
                this.panelCoordinacion = new PanelCoordinacionOrdenes({
                    contenedor: opciones.contenedorPanel || 'panel-coordinacion-container',
                    duracionTurnoMinutos: this.config.duracionTurnoMinutos
                });

                // Asignar la cola del primer equipo (típicamente 'azul')
                // El panel mostrará todas las órdenes de ese equipo
                const primerEquipo = equipos[0];
                const colaEquipo = this.colasOrdenes.get(primerEquipo);
                if (colaEquipo) {
                    this.panelCoordinacion.asignarCola(colaEquipo);
                    this.panelCoordinacion.inicializar();
                    this.log(`✅ Panel de coordinación inicializado (equipo: ${primerEquipo})`);
                } else {
                    this.log('⚠️ No se pudo asignar cola al panel de coordinación');
                }
            }

            // Configurar menú radial
            this.configurarMenuRadial();

            // Configurar eventos de mapa
            this.configurarEventosMapa();

            // Configurar eventos de teclado
            this.configurarAtajosTeclado();

            // Emitir evento de inicialización
            this.emit('inicializado');

            this.log('✅ GestorOrdenesV2 inicializado correctamente');
            return true;

        } catch (error) {
            console.error('❌ Error inicializando GestorOrdenesV2:', error);
            return false;
        }
    }

    /**
     * Configura el menú radial para crear órdenes
     */
    configurarMenuRadial() {
        if (!this.menuRadial) {
            this.log('⚠️ Menú radial no disponible');
            return;
        }

        // Verificar si MENU_ITEMS existe en MiRadial
        if (typeof window.MENU_ITEMS !== 'undefined') {
            // Agregar items V2 para elementos (unidades)
            if (!window.MENU_ITEMS.elemento) {
                window.MENU_ITEMS.elemento = [];
            }

            // Inyectar opciones de órdenes V2
            window.MENU_ITEMS.elemento = [
                {
                    title: 'Mover',
                    action: 'ordenMovimiento',
                    icon: 'fas fa-arrows-alt',
                    tooltip: 'Dar orden de movimiento'
                },
                {
                    title: 'Atacar',
                    action: 'ordenAtaque',
                    icon: 'fas fa-crosshairs',
                    tooltip: 'Dar orden de ataque'
                },
                {
                    title: 'Defender',
                    action: 'ordenDefensa',
                    icon: 'fas fa-shield-alt',
                    tooltip: 'Dar orden de defensa'
                },
                {
                    title: 'Ver Órdenes',
                    action: 'verOrdenesUnidad',
                    icon: 'fas fa-list',
                    tooltip: 'Ver órdenes de esta unidad'
                },
                {
                    title: 'Cerrar',
                    action: 'close',
                    icon: 'fas fa-times',
                    tooltip: 'Cerrar menú'
                }
            ];

            this.log('✅ Items de menú V2 inyectados en MENU_ITEMS.elemento');
        }

        // Registrar acciones del menú globalmente
        this.registrarAccionesMenu();

        this.log('✅ Menú radial configurado para órdenes V2');
    }

    /**
     * Registra las acciones del menú radial
     */
    registrarAccionesMenu() {
        // Registrar acciones globalmente para que MiRadial las encuentre
        window.ordenMovimiento = (elemento) => {
            this.iniciarOrdenMovimiento({ elemento: elemento || window.elementoSeleccionado });
        };

        window.ordenAtaque = (elemento) => {
            this.iniciarOrdenAtaque({ elemento: elemento || window.elementoSeleccionado });
        };

        window.ordenDefensa = (elemento) => {
            this.iniciarOrdenDefensa({ elemento: elemento || window.elementoSeleccionado });
        };

        window.ordenEspera = (elemento) => {
            this.iniciarOrdenEspera({ elemento: elemento || window.elementoSeleccionado });
        };

        window.ordenReconocimiento = (elemento) => {
            this.iniciarOrdenReconocimiento({ elemento: elemento || window.elementoSeleccionado });
        };

        window.verOrdenesUnidad = (elemento) => {
            this.mostrarOrdenesUnidad({ elemento: elemento || window.elementoSeleccionado });
        };

        // También crear window.acciones para compatibilidad con miradial.js
        if (!window.acciones) {
            window.acciones = {};
        }

        window.acciones.ejecutarAccion = (action, elemento) => {
            this.log(`🎬 Ejecutando acción: ${action}`);

            switch(action) {
                case 'ordenMovimiento':
                    window.ordenMovimiento(elemento);
                    break;
                case 'ordenAtaque':
                    window.ordenAtaque(elemento);
                    break;
                case 'ordenDefensa':
                    window.ordenDefensa(elemento);
                    break;
                case 'ordenEsperar':
                    window.ordenEsperar(elemento);
                    break;
                case 'verOrdenesUnidad':
                    window.verOrdenesUnidad(elemento);
                    break;
                default:
                    this.log(`⚠️ Acción desconocida: ${action}`);
            }
        };

        this.log('✅ Acciones de menú registradas globalmente');
    }

    /**
     * Configura eventos del mapa para interacción
     */
    configurarEventosMapa() {
        if (!this.map) return;

        // Click en el mapa durante modo orden
        this.map.on('click', (e) => {
            if (this.modoOrden) {
                this.procesarClickOrden(e);
            }
        });

        // Mousemove para preview de ruta
        this.map.on('mousemove', (e) => {
            if (this.modoOrden === 'movimiento' && this.unidadSeleccionada) {
                this.actualizarPreviewRuta(e.latlng);
            } else if (this.modoOrden === 'ataque' && this.unidadSeleccionada) {
                this.actualizarPreviewAtaque(e.latlng);
            }
        });

        this.log('✅ Eventos de mapa configurados');
    }

    /**
     * Configura atajos de teclado
     */
    configurarAtajosTeclado() {
        document.addEventListener('keydown', (e) => {
            // ESC para cancelar orden actual
            if (e.key === 'Escape' && this.modoOrden) {
                this.cancelarOrdenActual();
            }

            // Z para deshacer última orden (si permitido)
            if (e.ctrlKey && e.key === 'z' && this.config.permitirDeshacer) {
                this.deshacerUltimaOrden();
            }

            // Espacio para pausar/resumir ejecución
            if (e.key === ' ' && this.subfaseActual === 'ejecucion') {
                this.togglePausaEjecucion();
            }
        });

        this.log('✅ Atajos de teclado configurados');
    }

    // =====================================================
    // CREACIÓN DE ÓRDENES
    // =====================================================

    /**
     * Inicia el proceso de dar una orden de movimiento
     */
    iniciarOrdenMovimiento(contexto) {
        this.log('📍 Iniciando orden de movimiento...');

        // Obtener unidad desde contexto
        const unidad = contexto.elemento || contexto.unidad || this.unidadSeleccionada;
        if (!unidad) {
            this.mostrarNotificacion('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }

        this.unidadSeleccionada = unidad;
        this.modoOrden = 'movimiento';
        this.origenOrden = this.obtenerPosicionUnidad(unidad);

        // Cambiar cursor
        this.map.getContainer().style.cursor = 'crosshair';

        // Notificar usuario
        this.mostrarNotificacion('📍 Click en el destino para mover', 'info');

        // Ocultar menú radial
        if (this.menuRadial) {
            this.menuRadial.hideMenu();
        }
    }

    /**
     * Inicia el proceso de dar una orden de ataque
     */
    iniciarOrdenAtaque(contexto) {
        this.log('🎯 Iniciando orden de ataque...');

        const unidad = contexto.elemento || contexto.unidad || this.unidadSeleccionada;
        if (!unidad) {
            this.mostrarNotificacion('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }

        this.unidadSeleccionada = unidad;
        this.modoOrden = 'ataque';
        this.origenOrden = this.obtenerPosicionUnidad(unidad);

        this.map.getContainer().style.cursor = 'crosshair';
        this.mostrarNotificacion('🎯 Click en el objetivo a atacar', 'info');

        if (this.menuRadial) {
            this.menuRadial.hideMenu();
        }
    }

    /**
     * Inicia orden de defensa
     */
    iniciarOrdenDefensa(contexto) {
        this.log('🛡️ Iniciando orden de defensa...');

        const unidad = contexto.elemento || contexto.unidad || this.unidadSeleccionada;
        if (!unidad) {
            this.mostrarNotificacion('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }

        // Crear orden de defensa directamente (no requiere selección)
        this.crearOrdenDefensa(unidad);
    }

    /**
     * Inicia orden de espera
     */
    iniciarOrdenEspera(contexto) {
        this.log('⏱️ Iniciando orden de espera...');

        const unidad = contexto.elemento || contexto.unidad || this.unidadSeleccionada;
        if (!unidad) {
            this.mostrarNotificacion('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }

        // Mostrar diálogo para especificar duración y modalidad
        this.mostrarDialogoEspera((opciones) => {
            this.crearOrdenEspera(unidad, opciones);
        });
    }

    /**
     * Inicia orden de reconocimiento
     */
    iniciarOrdenReconocimiento(contexto) {
        this.log('🔍 Iniciando orden de reconocimiento...');

        const unidad = contexto.elemento || contexto.unidad || this.unidadSeleccionada;
        if (!unidad) {
            this.mostrarNotificacion('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }

        this.mostrarNotificacion('🗺️ Haz click en el área objetivo para reconocimiento', 'info');
        this.modoOrden = 'reconocimiento';
        this.unidadSeleccionada = unidad;

        // Cambiar cursor
        if (this.map) {
            this.map.getContainer().style.cursor = 'crosshair';
        }
    }

    /**
     * Procesa el click para completar una orden
     */
    procesarClickOrden(e) {
        const latlng = e.latlng;

        if (this.modoOrden === 'movimiento') {
            this.crearOrdenMovimiento(this.unidadSeleccionada, latlng);
        } else if (this.modoOrden === 'ataque') {
            this.crearOrdenAtaque(this.unidadSeleccionada, latlng);
        } else if (this.modoOrden === 'reconocimiento') {
            this.crearOrdenReconocimiento(this.unidadSeleccionada, latlng);
        }

        // Limpiar modo orden
        this.cancelarOrdenActual();
    }

    /**
     * Crea una orden de movimiento
     */
    crearOrdenMovimiento(unidad, destino) {
        try {
            const origen = this.obtenerPosicionUnidad(unidad);
            const hexDestino = this.hexGrid ? this.hexGrid.getHexagonAt(destino) : destino;

            if (!hexDestino) {
                this.mostrarNotificacion('⚠️ Posición inválida', 'warning');
                return;
            }

            // Obtener ID y equipo del marcador
            const unidadId = unidad.options?.id || unidad.id || `unidad_${Date.now()}`;
            const equipo = unidad.options?.equipo || unidad.equipo || 'azul';

            // Crear instancia de OrdenMovimiento
            const orden = new OrdenMovimiento({
                unidadId: unidadId,
                origen: origen,
                destino: hexDestino,
                prioridad: 1,
                unidadRef: unidad // Guardar referencia al marcador
            });

            // Agregar a cola del equipo
            const cola = this.colasOrdenes.get(equipo);
            if (cola) {
                cola.agregarOrden(orden);
                this.log(`✅ Orden de movimiento agregada para ${unidadId}`);

                // Actualizar panel
                this.actualizarPanelCoordinacion();

                // Notificar
                this.mostrarNotificacion(`✅ Orden de movimiento agregada`, 'success');
            } else {
                this.mostrarNotificacion(`⚠️ Equipo ${equipo} no encontrado`, 'warning');
            }

        } catch (error) {
            console.error('❌ Error creando orden de movimiento:', error);
            this.mostrarNotificacion('❌ Error creando orden', 'error');
        }
    }

    /**
     * Crea una orden de ataque
     */
    crearOrdenAtaque(unidad, objetivo) {
        try {
            const origen = this.obtenerPosicionUnidad(unidad);
            const hexObjetivo = this.hexGrid ? this.hexGrid.getHexagonAt(objetivo) : objetivo;

            if (!hexObjetivo) {
                this.mostrarNotificacion('⚠️ Objetivo inválido', 'warning');
                return;
            }

            // Obtener ID y equipo del marcador
            const unidadId = unidad.options?.id || unidad.id || `unidad_${Date.now()}`;
            const equipo = unidad.options?.equipo || unidad.equipo || 'azul';

            // Crear instancia de OrdenAtaque
            const orden = new OrdenAtaque({
                unidadId: unidadId,
                origen: origen,
                objetivo: hexObjetivo,
                prioridad: 2,
                unidadRef: unidad // Guardar referencia al marcador
            });

            // Agregar a cola
            const cola = this.colasOrdenes.get(equipo);
            if (cola) {
                cola.agregarOrden(orden);
                this.log(`✅ Orden de ataque agregada para ${unidadId}`);

                this.actualizarPanelCoordinacion();
                this.mostrarNotificacion(`✅ Orden de ataque agregada`, 'success');
            } else {
                this.mostrarNotificacion(`⚠️ Equipo ${equipo} no encontrado`, 'warning');
            }

        } catch (error) {
            console.error('❌ Error creando orden de ataque:', error);
            this.mostrarNotificacion('❌ Error creando orden', 'error');
        }
    }

    /**
     * Crea orden de defensa
     */
    crearOrdenDefensa(unidad, opciones = {}) {
        this.log('🛡️ Creando orden de defensa');

        if (typeof OrdenDefensa === 'undefined') {
            this.mostrarNotificacion('❌ OrdenDefensa no disponible', 'error');
            return null;
        }

        try {
            // Obtener posición actual de la unidad
            const posicion = unidad.getLatLng ? unidad.getLatLng() : null;

            if (!posicion) {
                this.mostrarNotificacion('❌ No se pudo determinar la posición de la unidad', 'error');
                return null;
            }

            // Crear instancia de orden
            const orden = new OrdenDefensa(unidad, posicion, opciones);

            // Validar orden
            orden.validar().then(esValida => {
                if (esValida) {
                    // Agregar a la cola del equipo
                    const equipo = unidad.options?.equipo || 'azul';
                    this.agregarOrden(orden, equipo);
                    this.mostrarNotificacion(`✅ Orden de defensa agregada (${orden.tipoDefensa})`, 'success');
                } else {
                    this.mostrarNotificacion(`❌ Orden inválida: ${orden.mensajesValidacion.join(', ')}`, 'error');
                }
            });

            return orden;

        } catch (error) {
            console.error('Error creando orden de defensa:', error);
            this.mostrarNotificacion('❌ Error al crear orden de defensa', 'error');
            return null;
        }
    }

    /**
     * Crea orden de espera
     */
    crearOrdenEspera(unidad, opciones = {}) {
        this.log('⏱️ Creando orden de espera');

        if (typeof OrdenEspera === 'undefined') {
            this.mostrarNotificacion('❌ OrdenEspera no disponible', 'error');
            return null;
        }

        try {
            // Crear instancia de orden
            const orden = new OrdenEspera(unidad, opciones);

            // Validar orden
            orden.validar().then(esValida => {
                if (esValida) {
                    // Agregar a la cola del equipo
                    const equipo = unidad.options?.equipo || 'azul';
                    this.agregarOrden(orden, equipo);
                    this.mostrarNotificacion(`✅ Orden de espera agregada (${orden.modalidad}, ${orden.duracion}s)`, 'success');
                } else {
                    this.mostrarNotificacion(`❌ Orden inválida: ${orden.mensajesValidacion.join(', ')}`, 'error');
                }
            });

            return orden;

        } catch (error) {
            console.error('Error creando orden de espera:', error);
            this.mostrarNotificacion('❌ Error al crear orden de espera', 'error');
            return null;
        }
    }

    /**
     * Crea orden de reconocimiento
     */
    crearOrdenReconocimiento(unidad, objetivo, opciones = {}) {
        this.log('🔍 Creando orden de reconocimiento');

        if (typeof OrdenReconocimiento === 'undefined') {
            this.mostrarNotificacion('❌ OrdenReconocimiento no disponible', 'error');
            return null;
        }

        try {
            // Crear instancia de orden
            const orden = new OrdenReconocimiento(unidad, objetivo, opciones);

            // Validar orden
            orden.validar().then(esValida => {
                if (esValida) {
                    // Agregar a la cola del equipo
                    const equipo = unidad.options?.equipo || 'azul';
                    this.agregarOrden(orden, equipo);
                    this.mostrarNotificacion(`✅ Orden de reconocimiento agregada (${orden.tipoReconocimiento})`, 'success');
                } else {
                    this.mostrarNotificacion(`❌ Orden inválida: ${orden.mensajesValidacion.join(', ')}`, 'error');
                }
            });

            return orden;

        } catch (error) {
            console.error('Error creando orden de reconocimiento:', error);
            this.mostrarNotificacion('❌ Error al crear orden de reconocimiento', 'error');
            return null;
        }
    }

    // =====================================================
    // VISUALIZACIÓN Y PREVIEW
    // =====================================================

    /**
     * Actualiza preview de ruta durante movimiento del mouse
     */
    actualizarPreviewRuta(destino) {
        if (!this.pathfinding || !this.unidadSeleccionada) return;

        const origen = this.obtenerPosicionUnidad(this.unidadSeleccionada);
        const hexDestino = this.hexGrid.getHexagonAt(destino);

        if (!hexDestino) return;

        // Calcular ruta
        const resultado = this.pathfinding.encontrarRuta(origen, hexDestino, this.unidadSeleccionada);

        if (resultado && resultado.ruta.length > 0) {
            // Dibujar preview de ruta
            this.dibujarPreviewRuta(resultado.ruta);
        }
    }

    /**
     * Actualiza preview de línea de ataque
     */
    actualizarPreviewAtaque(objetivo) {
        if (!this.unidadSeleccionada) return;

        const origen = this.obtenerPosicionUnidad(this.unidadSeleccionada);
        const hexObjetivo = this.hexGrid.getHexagonAt(objetivo);

        if (!hexObjetivo) return;

        // Dibujar preview de línea
        this.dibujarPreviewLinea(origen, hexObjetivo);
    }

    /**
     * Dibuja preview de ruta en el mapa
     */
    dibujarPreviewRuta(ruta) {
        // Limpiar preview anterior
        if (this.previewRuta) {
            this.map.removeLayer(this.previewRuta);
        }

        // Convertir ruta a LatLngs
        const latlngs = ruta.map(hex => this.hexGrid.hexToLatLng(hex));

        // Crear polyline
        this.previewRuta = L.polyline(latlngs, {
            color: '#00ff00',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 5'
        }).addTo(this.map);
    }

    /**
     * Dibuja preview de línea de ataque
     */
    dibujarPreviewLinea(origen, destino) {
        // Limpiar preview anterior
        if (this.previewLinea) {
            this.map.removeLayer(this.previewLinea);
        }

        const origenLatLng = this.hexGrid.hexToLatLng(origen);
        const destinoLatLng = this.hexGrid.hexToLatLng(destino);

        // Crear polyline
        this.previewLinea = L.polyline([origenLatLng, destinoLatLng], {
            color: '#ff0000',
            weight: 2,
            opacity: 0.7,
            dashArray: '5, 5'
        }).addTo(this.map);
    }

    /**
     * Limpia previews visuales
     */
    limpiarPreviews() {
        if (this.previewRuta) {
            this.map.removeLayer(this.previewRuta);
            this.previewRuta = null;
        }
        if (this.previewLinea) {
            this.map.removeLayer(this.previewLinea);
            this.previewLinea = null;
        }
    }

    /**
     * Cancela la orden actual en progreso
     */
    cancelarOrdenActual() {
        this.modoOrden = null;
        this.origenOrden = null;
        this.destinoOrden = null;
        this.limpiarPreviews();
        this.map.getContainer().style.cursor = '';
        this.mostrarNotificacion('❌ Orden cancelada', 'info');
    }

    // =====================================================
    // SUBFASES DE COMBATE
    // =====================================================

    /**
     * Cambia a subfase de planificación
     */
    iniciarPlanificacion() {
        this.log('📋 Iniciando fase de PLANIFICACIÓN');
        this.subfaseActual = 'planificacion';
        this.logEventosTurno = [];

        // Habilitar interfaz para dar órdenes
        this.habilitarInterfazOrdenes(true);

        // ✅ NO mostrar panel automáticamente - el usuario lo abrirá con el botón
        // if (this.panelCoordinacion) {
        //     this.panelCoordinacion.mostrar();
        // }

        this.emit('subfaseCambiada', { subfase: 'planificacion', turno: this.turnoActual });
        this.mostrarNotificacion(`📋 Turno ${this.turnoActual} - Planificación`, 'info');
    }

    /**
     * Confirma órdenes y pasa a ejecución
     */
    async confirmarOrdenes() {
        this.log('✅ Confirmando órdenes...');

        // Validar todas las órdenes
        let todasValidas = true;
        for (const [equipo, cola] of this.colasOrdenes) {
            const resultado = await cola.validarTodasLasOrdenes();
            if (!resultado.exito) {
                todasValidas = false;
                this.mostrarNotificacion(`⚠️ Errores en órdenes del equipo ${equipo}`, 'warning');
                console.log('Errores:', resultado.errores);
            }
        }

        if (!todasValidas) {
            this.mostrarNotificacion('❌ Corrige los errores antes de confirmar', 'error');
            return false;
        }

        // Pasar a ejecución
        await this.iniciarEjecucion();
        return true;
    }

    /**
     * Inicia fase de ejecución de órdenes
     */
    async iniciarEjecucion() {
        this.log('⚡ Iniciando fase de EJECUCIÓN');
        this.subfaseActual = 'ejecucion';

        // Deshabilitar interfaz
        this.habilitarInterfazOrdenes(false);

        this.emit('subfaseCambiada', { subfase: 'ejecucion', turno: this.turnoActual });
        this.mostrarNotificacion(`⚡ Turno ${this.turnoActual} - Ejecutando órdenes...`, 'info');

        // Ejecutar órdenes de todos los equipos simultáneamente
        const promesas = [];
        for (const [equipo, cola] of this.colasOrdenes) {
            promesas.push(this.ejecutarOrdenesEquipo(equipo, cola));
        }

        await Promise.all(promesas);

        // Pasar a revisión
        this.iniciarRevision();
    }

    /**
     * Ejecuta órdenes de un equipo
     */
    async ejecutarOrdenesEquipo(equipo, cola) {
        this.log(`⚡ Ejecutando órdenes del equipo ${equipo}`);

        const resultado = await cola.ejecutarOrdenesSecuencialmente();

        // Registrar en log
        this.logEventosTurno.push({
            equipo: equipo,
            eventos: resultado.resultados
        });

        return resultado;
    }

    /**
     * Inicia fase de revisión
     */
    iniciarRevision() {
        this.log('📊 Iniciando fase de REVISIÓN');
        this.subfaseActual = 'revision';

        this.emit('subfaseCambiada', { subfase: 'revision', turno: this.turnoActual });
        this.mostrarNotificacion(`📊 Turno ${this.turnoActual} - Revisión de resultados`, 'info');

        // Mostrar log de eventos
        this.mostrarLogTurno();

        // Actualizar panel con resultados
        this.actualizarPanelCoordinacion();
    }

    /**
     * Finaliza turno y pasa al siguiente
     */
    finalizarTurno() {
        this.log(`✅ Finalizando turno ${this.turnoActual}`);

        // Incrementar turno
        this.turnoActual++;
        this.tiempoSimuladoMinutos += this.config.duracionTurnoMinutos;

        // Limpiar órdenes ejecutadas
        for (const [equipo, cola] of this.colasOrdenes) {
            cola.limpiarOrdenesCompletadas();
        }

        this.emit('turnoFinalizado', { turno: this.turnoActual - 1 });

        // Volver a planificación
        this.iniciarPlanificacion();
    }

    // =====================================================
    // INTERFAZ Y PANEL
    // =====================================================

    /**
     * Actualiza el panel de coordinación
     */
    actualizarPanelCoordinacion() {
        if (!this.panelCoordinacion) return;

        // Recopilar todas las órdenes de todos los equipos
        const todasLasOrdenes = [];
        for (const [equipo, cola] of this.colasOrdenes) {
            const ordenes = cola.obtenerTodasLasOrdenes();
            todasLasOrdenes.push(...ordenes);
        }

        // Actualizar panel
        this.panelCoordinacion.actualizarOrdenes(todasLasOrdenes);
    }

    /**
     * Habilita/deshabilita interfaz de órdenes
     */
    habilitarInterfazOrdenes(habilitar) {
        // TODO: Implementar bloqueo de UI durante ejecución
        if (habilitar) {
            this.log('🔓 Interfaz de órdenes habilitada');
        } else {
            this.log('🔒 Interfaz de órdenes deshabilitada');
        }
    }

    /**
     * Muestra el log de eventos del turno
     */
    mostrarLogTurno() {
        console.group(`📊 LOG TURNO ${this.turnoActual}`);
        for (const log of this.logEventosTurno) {
            console.log(`\n🎯 Equipo: ${log.equipo}`);
            console.table(log.eventos);
        }
        console.groupEnd();

        // TODO: Mostrar en UI panel de revisión
    }

    /**
     * Muestra las órdenes de una unidad
     */
    mostrarOrdenesUnidad(contexto) {
        const unidad = contexto.elemento || contexto.unidad;
        if (!unidad) return;

        const cola = this.colasOrdenes.get(unidad.equipo);
        if (!cola) return;

        const ordenesUnidad = cola.obtenerOrdenesDeUnidad(unidad.id);

        console.group(`📋 Órdenes de ${unidad.id}`);
        console.table(ordenesUnidad.map(o => ({
            tipo: o.tipo,
            estado: o.estado,
            prioridad: o.prioridad,
            duracionMin: o.duracionEstimadaMinutos
        })));
        console.groupEnd();

        // TODO: Mostrar en UI panel
        this.mostrarNotificacion(`📋 ${ordenesUnidad.length} orden(es) - Ver consola`, 'info');
    }

    // =====================================================
    // UTILIDADES
    // =====================================================

    /**
     * Obtiene la posición de una unidad (marcador L.marker)
     */
    obtenerPosicionUnidad(unidad) {
        // Si es un marcador de Leaflet (sistema SIDC existente)
        if (unidad && typeof unidad.getLatLng === 'function') {
            const latlng = unidad.getLatLng();
            if (this.hexGrid && typeof this.hexGrid.getHexagonAt === 'function') {
                return this.hexGrid.getHexagonAt(latlng);
            }
            return latlng;
        }

        // Fallback para otros formatos
        if (unidad.hex) return unidad.hex;
        if (unidad.posicion) return unidad.posicion;
        if (unidad.latlng) {
            return this.hexGrid ? this.hexGrid.getHexagonAt(unidad.latlng) : unidad.latlng;
        }

        return null;
    }

    /**
     * Muestra una notificación al usuario
     */
    mostrarNotificacion(mensaje, tipo = 'info') {
        // Integrar con sistema de notificaciones existente
        if (window.notificationSystem) {
            window.notificationSystem.show(mensaje, tipo);
        } else {
            console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
        }
    }

    /**
     * Muestra diálogo para especificar duración
     */
    mostrarDialogoDuracion(callback) {
        const minutos = prompt('¿Cuántos minutos esperar?', '30');
        if (minutos && !isNaN(minutos)) {
            callback(parseInt(minutos));
        }
    }

    /**
     * Deshace la última orden agregada
     */
    deshacerUltimaOrden() {
        if (!this.config.permitirDeshacer) return;

        // TODO: Implementar lógica de deshacer
        this.mostrarNotificacion('🚧 Deshacer en desarrollo', 'info');
    }

    /**
     * Pausa/reanuda la ejecución
     */
    togglePausaEjecucion() {
        // TODO: Implementar pausa
        this.mostrarNotificacion('🚧 Pausa en desarrollo', 'info');
    }

    /**
     * Sistema de eventos
     */
    on(evento, callback) {
        if (!this.eventListeners.has(evento)) {
            this.eventListeners.set(evento, []);
        }
        this.eventListeners.get(evento).push(callback);
    }

    emit(evento, datos) {
        if (this.eventListeners.has(evento)) {
            for (const callback of this.eventListeners.get(evento)) {
                callback(datos);
            }
        }
    }

    /**
     * Logging
     */
    log(...args) {
        if (this.config.modoDebug) {
            console.log('[GestorOrdenesV2]', ...args);
        }
    }

    /**
     * Limpieza
     */
    destruir() {
        this.limpiarPreviews();
        this.eventListeners.clear();
        this.colasOrdenes.clear();
        if (this.panelCoordinacion) {
            this.panelCoordinacion.destruir();
        }
        this.log('🗑️ GestorOrdenesV2 destruido');
    }
}

// Exportar para uso global
window.GestorOrdenesV2 = GestorOrdenesV2;
console.log('📦 GestorOrdenesV2.js cargado');
