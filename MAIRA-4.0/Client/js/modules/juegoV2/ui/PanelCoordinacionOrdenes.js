/**
 * 🎬 PANEL DE COORDINACIÓN DE ÓRDENES - Timeline Style
 * Estilo PowerPoint Animations Panel
 *
 * Permite coordinar visualmente:
 * - Órdenes secuenciales por unidad
 * - Órdenes paralelas entre unidades
 * - Timeline temporal (1 turno = 1 hora)
 * - Drag & drop para reordenar
 * - Sincronización (ej: apoyo de fuego → movimiento → ataque)
 */

class PanelCoordinacionOrdenes {
    constructor(opciones = {}) {
        // Aceptar cola de órdenes o null (se asignará después)
        this.cola = opciones.cola || null;
        this.gestorOrdenes = opciones.gestorOrdenes || null; // ✅ CRÍTICO: Referencia al gestor
        this.container = null;
        this.timelineCanvas = null;
        this.ctx = null;

        // ID del contenedor
        this.contenedorId = opciones.contenedor || 'panel-coordinacion-container';

        // Configuración visual - ✅ TEMA OSCURO TÁCTICO
        this.config = {
            alturaUnidad: 60,           // Altura de cada fila de unidad
            pixelesPorSegundo: 0.2,     // 0.2 px = 1 segundo (3600s = 720px por turno)
            anchoPanelLateral: 200,     // Ancho del panel de unidades
            alturaCabecera: 50,         // Altura de la cabecera con escala de tiempo
            duracionTurnoMinutos: opciones.duracionTurnoMinutos || 60,
            coloresOrden: {
                movimiento: 'rgba(33, 100, 180, 0.9)',      // Azul oscuro
                ataque: 'rgba(180, 40, 30, 0.9)',           // Rojo oscuro
                defensa: 'rgba(50, 120, 200, 0.8)',         // Azul medio
                ingeniero: 'rgba(200, 120, 30, 0.8)',       // Naranja oscuro
                comunicaciones: 'rgba(120, 50, 150, 0.8)',  // Púrpura oscuro
                pendiente: 'rgba(100, 100, 100, 0.7)',      // Gris oscuro
                ejecutando: 'rgba(200, 180, 0, 0.9)',       // Amarillo oscuro
                completada: 'rgba(50, 150, 50, 0.9)',       // Verde oscuro
                invalida: 'rgba(150, 30, 30, 0.9)'          // Rojo muy oscuro
            }
        };

        // Estado
        this.ordenSeleccionada = null;
        this.dragging = null;
        this.zoom = 1.0;
        this.scrollX = 0;

        // NO inicializar automáticamente - esperar a que se asigne la cola
        // this.inicializar();
    }

    /**
     * Asigna una cola de órdenes al panel
     */
    asignarCola(cola) {
        this.cola = cola;
        return this;
    }

    /**
     * ✅ Asigna el gestor de órdenes (necesario para acceder a equipoActual y colasOrdenes)
     */
    setGestorOrdenes(gestor) {
        this.gestorOrdenes = gestor;
        console.log('✅ PanelCoordinacion: GestorOrdenes asignado');
        return this;
    }

    /**
     * Inicializa el panel
     */
    inicializar() {
        if (!this.cola) {
            console.warn('⚠️ PanelCoordinacionOrdenes: No se puede inicializar sin cola de órdenes');
            return;
        }
        this.crearEstructuraHTML();
        this.configurarEventos();
        this.renderizar();

        // ⚠️ OCULTAR inicialmente - solo mostrar cuando se inicie fase COMBATE
        this.ocultar();
    }

    /**
     * Crea la estructura HTML del panel
     */
    crearEstructuraHTML() {
        // Contenedor principal
        this.container = document.createElement('div');
        this.container.id = 'panelCoordinacionOrdenes';
        this.container.className = 'panel-coordinacion-ordenes';
        this.container.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <i class="fas fa-tasks"></i>
                    <span>Coordinación de Órdenes</span>
                    <span class="equipo-badge">${this.cola.equipo}</span>
                </div>
                <div class="panel-controls">
                    <button class="btn-icon" id="btnZoomIn" title="Acercar">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="btn-icon" id="btnZoomOut" title="Alejar">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <button class="btn-icon" id="btnResetZoom" title="Reset Zoom">
                        <i class="fas fa-compress"></i>
                    </button>
                    <button class="btn-icon" id="btnValidarOrdenes" title="Validar Órdenes">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="btn-icon" id="btnCerrarPanel" title="Cerrar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="panel-body">
                <!-- Panel lateral con lista de unidades -->
                <div class="panel-unidades" id="panelUnidades">
                    <div class="unidades-header">
                        <span>Unidades</span>
                    </div>
                    <div class="unidades-lista" id="unidadesLista">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>

                <!-- Timeline canvas -->
                <div class="panel-timeline" id="panelTimeline">
                    <canvas id="timelineCanvas"></canvas>
                </div>
            </div>

            <div class="panel-footer">
                <div class="footer-info">
                    <span id="infoTiempoTotal">Tiempo Total: 0:00</span>
                    <span id="infoTurnos">Turnos: 1</span>
                    <span id="infoOrdenesTotal">Órdenes: 0</span>
                </div>
                <div class="footer-leyenda">
                    <span class="leyenda-item">
                        <span class="color-box" style="background: ${this.config.coloresOrden.movimiento}"></span>
                        Movimiento
                    </span>
                    <span class="leyenda-item">
                        <span class="color-box" style="background: ${this.config.coloresOrden.ataque}"></span>
                        Ataque
                    </span>
                    <span class="leyenda-item">
                        <span class="color-box" style="background: ${this.config.coloresOrden.defensa}"></span>
                        Defensa
                    </span>
                    <span class="leyenda-item">
                        <span class="color-box" style="background: ${this.config.coloresOrden.ingeniero}"></span>
                        Ingeniero
                    </span>
                </div>
            </div>
        `;

        // Agregar al body
        document.body.appendChild(this.container);

        // Obtener canvas
        this.timelineCanvas = document.getElementById('timelineCanvas');
        this.ctx = this.timelineCanvas.getContext('2d');

        // Ajustar tamaño del canvas
        this.ajustarTamañoCanvas();

        // Aplicar estilos CSS
        this.aplicarEstilos();
    }

    /**
     * Aplica estilos CSS al panel
     */
    aplicarEstilos() {
        const style = document.createElement('style');
        style.textContent = `
            .panel-coordinacion-ordenes {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 50vh;
                background: rgba(10, 10, 10, 0.95);
                border-top: 3px solid rgba(0, 255, 0, 0.6);
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.8);
                z-index: 1350; /* ✅ Paneles Flotantes (antes 10000) */
                display: flex;
                flex-direction: column;
                font-family: 'Courier New', monospace;
            }

            .panel-header {
                background: linear-gradient(135deg, rgba(0, 80, 0, 0.8), rgba(0, 50, 0, 0.9));
                color: #00ff00;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(0, 255, 0, 0.3);
            }

            .panel-title {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 18px;
                font-weight: bold;
            }

            .equipo-badge {
                background: rgba(255, 255, 255, 0.3);
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                text-transform: uppercase;
            }

            .panel-controls {
                display: flex;
                gap: 8px;
            }

            .btn-icon {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-icon:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
            }

            .btn-primary {
                background: #4CAF50;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            }

            .btn-primary:hover {
                background: #45a049;
                transform: translateY(-2px);
            }

            .panel-body {
                flex: 1;
                display: flex;
                overflow: hidden;
            }

            .panel-unidades {
                width: ${this.config.anchoPanelLateral}px;
                border-right: 2px solid rgba(0, 255, 0, 0.2);
                background: rgba(20, 20, 20, 0.9);
                display: flex;
                flex-direction: column;
            }

            .unidades-header {
                background: rgba(0, 80, 0, 0.5);
                color: #00ff00;
                padding: 12px;
                font-weight: bold;
                border-bottom: 1px solid rgba(0, 255, 0, 0.3);
            }

            .unidades-lista {
                flex: 1;
                overflow-y: auto;
            }

            .unidad-item {
                padding: 12px;
                border-bottom: 1px solid rgba(0, 255, 0, 0.15);
                cursor: pointer;
                transition: background 0.2s;
                height: ${this.config.alturaUnidad}px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                color: rgba(0, 255, 0, 0.7);
            }

            .unidad-item:hover {
                background: rgba(0, 100, 0, 0.3);
            }

            .unidad-item.selected {
                background: rgba(0, 150, 0, 0.4);
                border-left: 4px solid #00ff00;
            }

            .unidad-nombre {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 4px;
                color: #00ff00;
            }

            .unidad-ordenes {
                font-size: 11px;
                color: rgba(0, 255, 0, 0.6);
            }

            .panel-timeline {
                flex: 1;
                overflow: auto;
                position: relative;
            }

            #timelineCanvas {
                display: block;
            }

            .panel-footer {
                background: rgba(20, 20, 20, 0.9);
                border-top: 1px solid rgba(0, 255, 0, 0.3);
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .footer-info {
                display: flex;
                gap: 20px;
                font-size: 13px;
                color: rgba(0, 255, 0, 0.8);
            }

            .footer-leyenda {
                display: flex;
                gap: 15px;
            }

            .leyenda-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: rgba(0, 255, 0, 0.7);
            }

            .color-box {
                width: 16px;
                height: 16px;
                border-radius: 3px;
                border: 1px solid rgba(0, 0, 0, 0.2);
            }

            /* Tooltip para órdenes */
            .orden-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                pointer-events: none;
                z-index: 2500; /* ✅ Tooltips Globales (antes 10001) */
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Ajusta el tamaño del canvas al contenedor
     */
    ajustarTamañoCanvas() {
        const container = document.getElementById('panelTimeline');
        if (!container) {
            console.warn('⚠️ Container panelTimeline no encontrado');
            return;
        }

        // Validar que cola y ordenesPorUnidad existan
        if (!this.cola || !this.cola.ordenesPorUnidad) {
            console.warn('⚠️ Cola de órdenes no disponible para ajustar canvas');
            this.timelineCanvas.width = container.clientWidth;
            this.timelineCanvas.height = container.clientHeight || 400;
            return;
        }

        const unidades = Array.from(this.cola.ordenesPorUnidad.keys());

        this.timelineCanvas.width = container.clientWidth;
        this.timelineCanvas.height = Math.max(
            container.clientHeight,
            unidades.length * this.config.alturaUnidad + this.config.alturaCabecera
        );
    }

    /**
     * Configura eventos del panel
     */
    configurarEventos() {
        // Botones
        document.getElementById('btnZoomIn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('btnZoomOut')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('btnResetZoom')?.addEventListener('click', () => this.resetZoom());
        document.getElementById('btnValidarOrdenes')?.addEventListener('click', () => this.validarOrdenes());
        // ✅ CAMBIAR: Ocultar en lugar de cerrar (para que el toggle pueda volver a mostrar)
        document.getElementById('btnCerrarPanel')?.addEventListener('click', () => this.ocultar());

        // Canvas eventos
        this.timelineCanvas.addEventListener('click', (e) => this.onCanvasClick(e));
        this.timelineCanvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        this.timelineCanvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
        this.timelineCanvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));

        // Resize
        window.addEventListener('resize', () => {
            this.ajustarTamañoCanvas();
            this.renderizar();
        });

        // Escuchar cambios en la cola
        if (window.eventBus) {
            window.eventBus.on('ordenAgregada', () => this.renderizar());
            window.eventBus.on('ordenCancelada', () => this.renderizar());
        }

        // ✅ NUEVO: Escuchar cambios de fase/turno/jugador
        document.addEventListener('cambioFase', () => {
            console.log('📡 PanelCoordinacion: Cambio de fase detectado');
            this.renderizar();
        });

        document.addEventListener('cambioTurno', () => {
            console.log('📡 PanelCoordinacion: Cambio de turno detectado');
            this.renderizar();
        });

        // ✅ NUEVO: Escuchar eventos de elementos (agregar/eliminar/modificar)
        document.addEventListener('elementoAgregado', () => {
            console.log('📡 PanelCoordinacion: Elemento agregado');
            this.renderizar();
        });

        document.addEventListener('elementoModificado', () => {
            console.log('📡 PanelCoordinacion: Elemento modificado');
            this.renderizar();
        });

        document.addEventListener('elementoEliminado', () => {
            console.log('📡 PanelCoordinacion: Elemento eliminado');
            this.renderizar();
        });

        document.addEventListener('subordinadosDesplegados', () => {
            console.log('📡 PanelCoordinacion: Subordinados desplegados');
            this.renderizar();
        });

        document.addEventListener('subordinadosReagrupados', () => {
            console.log('📡 PanelCoordinacion: Subordinados reagrupados');
            this.renderizar();
        });
    }

    /**
     * Renderiza todo el panel
     */
    renderizar() {
        
        
        // 🎯 FILTRAR ÓRDENES POR EQUIPO ACTIVO
        // ✅ Usar this.cola si gestorOrdenes no está disponible
        let equipoActual = 'azul';
        let colaEquipo = null;
        
        if (this.gestorOrdenes) {
            // Modo completo: usar gestor de órdenes
            equipoActual = this.gestorOrdenes.equipoActual || 'azul';
            colaEquipo = this.gestorOrdenes.colasOrdenes?.get(equipoActual);
        } else if (this.cola) {
            // Modo fallback: usar cola asignada directamente
            equipoActual = this.cola.equipo || 'azul';
            colaEquipo = this.cola;
            console.log('📊 Panel Matriz: Usando cola directa (sin gestorOrdenes)');
        }
        
        if (!colaEquipo || !colaEquipo.ordenesPorUnidad || colaEquipo.ordenesPorUnidad.size === 0) {
            // Si no hay órdenes del equipo activo, limpiar canvas
            this.limpiarCanvas();
            this.actualizarListaUnidades();
            console.log(`📊 Panel Matriz: Sin órdenes para equipo ${equipoActual} (cola:${!!colaEquipo}, gestor:${!!this.gestorOrdenes})`);
            return;
        }
        
        // Agrupar órdenes por unidadId (cada unidad = 1 carril)
        const ordenesAgrupadas = new Map();
        for (const [unidadId, ordenes] of colaEquipo.ordenesPorUnidad.entries()) {
            if (ordenes && ordenes.length > 0) {
                ordenesAgrupadas.set(unidadId, ordenes);
            }
        }
        
        console.log(`📊 Panel Matriz: ${ordenesAgrupadas.size} elementos del equipo ${equipoActual}`);

        this.limpiarCanvas();
        this.renderizarCabecera();
        this.renderizarFilasUnidades();
        this.renderizarOrdenes();
        this.renderizarMarcadorTiempo();
        this.actualizarListaUnidades();
        this.actualizarFooter();
    }
    /**
     * ✅ Limpia el canvas - TEMA OSCURO
     */
    limpiarCanvas() {
        this.ctx.clearRect(0, 0, this.timelineCanvas.width, this.timelineCanvas.height);
        this.ctx.fillStyle = 'rgba(15, 15, 15, 1)';
        this.ctx.fillRect(0, 0, this.timelineCanvas.width, this.timelineCanvas.height);
    }

    /**
     * ✅ Renderiza la cabecera con escala de tiempo - TEMA OSCURO
     */
    renderizarCabecera() {
        const ctx = this.ctx;
        const h = this.config.alturaCabecera;

        // Fondo oscuro
        ctx.fillStyle = 'rgba(30, 30, 30, 1)';
        ctx.fillRect(0, 0, this.timelineCanvas.width, h);

        // Línea divisoria verde
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(this.timelineCanvas.width, h);
        ctx.stroke();

        // Escala de tiempo (cada 5 minutos) - Texto verde
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';

        const pixelesPorMinuto = (this.config.pixelesPorSegundo * 60) * this.zoom;
        const intervaloMinutos = 5;

        for (let minutos = 0; minutos <= 120; minutos += intervaloMinutos) {
            const x = minutos * pixelesPorMinuto;

            if (x > this.timelineCanvas.width) break;

            // Marca
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x, h - 10);
            ctx.lineTo(x, h);
            ctx.stroke();

            // Texto
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            ctx.fillText(`${horas}:${mins.toString().padStart(2, '0')}`, x, h - 15);
        }

        // Marcas de turnos (cada hora) - Verde brillante
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 2;

        for (let turno = 1; turno <= 5; turno++) {
            const x = turno * 60 * pixelesPorMinuto;

            if (x > this.timelineCanvas.width) break;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            // Etiqueta de turno
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.fillText(`Turno ${turno}`, x, 20);
        }
    }

    /**
     * 🎯 Renderiza carriles separados por elemento - MATRIZ
     * Cada elemento tiene su propia fila horizontal con separación visual clara
     */
    renderizarFilasUnidades() {
        const ctx = this.ctx;
        const unidades = Array.from(this.cola.ordenesPorUnidad.keys());
        const h = this.config.alturaUnidad;
        const yInicio = this.config.alturaCabecera;
        const margen = 4; // Margen entre carriles

        unidades.forEach((unidadId, index) => {
            const y = yInicio + (index * h);

            // 🎨 Fondo de carril con borde
            ctx.fillStyle = index % 2 === 0 ? 'rgba(25, 25, 35, 0.7)' : 'rgba(15, 15, 25, 0.7)';
            ctx.fillRect(0, y + margen, this.timelineCanvas.width, h - (margen * 2));

            // 📏 Borde superior del carril (más visible)
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, y + margen);
            ctx.lineTo(this.timelineCanvas.width, y + margen);
            ctx.stroke();

            // 📏 Borde inferior del carril (separación entre elementos)
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y + h - margen);
            ctx.lineTo(this.timelineCanvas.width, y + h - margen);
            ctx.stroke();

            // 🏷️ Etiqueta de elemento (izquierda del canvas)
            const elemento = window.elementosPorId?.get(unidadId);
            if (elemento) {
                const nombre = elemento.options?.nombre || unidadId;
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.textAlign = 'left';
                ctx.fillText(nombre, 5, y + h / 2 + 4);
            }
        });
    }

    /**
     * Renderiza las órdenes en el timeline
     */
    renderizarOrdenes() {
        const ctx = this.ctx;
        const h = this.config.alturaUnidad;
        const yInicio = this.config.alturaCabecera;
        const pixelesPorSegundo = this.config.pixelesPorSegundo * this.zoom;

        const unidades = Array.from(this.cola.ordenesPorUnidad.keys());

        unidades.forEach((unidadId, index) => {
            const ordenes = this.cola.getOrdenesDeUnidad(unidadId);
            const y = yInicio + (index * h);

            let tiempoAcumulado = 0;

            ordenes.forEach(orden => {
                const duracion = orden.tiempoRealSegundos || 600;
                const x = tiempoAcumulado * pixelesPorSegundo;
                const width = duracion * pixelesPorSegundo;

                // Color según tipo y estado
                let color = this.config.coloresOrden[orden.tipo] || '#999';
                if (orden.estado === 'invalida') {
                    color = this.config.coloresOrden.invalida;
                } else if (orden.estado === 'ejecutando') {
                    color = this.config.coloresOrden.ejecutando;
                }

                // Dibujar barra de orden
                ctx.fillStyle = color;
                ctx.fillRect(x, y + 5, width - 2, h - 10);

                // Borde verde tenue
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y + 5, width - 2, h - 10);

                // Texto (si hay espacio) - Blanco para mejor contraste
                if (width > 50) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 11px "Courier New", monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(orden.tipo.toUpperCase(), x + 5, y + h / 2 + 4);
                }

                // Guardar bounds para detección de clicks
                orden._bounds = { x, y: y + 5, width: width - 2, height: h - 10 };

                tiempoAcumulado += duracion;
            });
        });
    }

    /**
     * Renderiza un marcador de tiempo actual
     */
    renderizarMarcadorTiempo() {
        // TODO: Implementar marcador de tiempo actual del juego
    }

    /**
     * Actualiza la lista de unidades en el panel lateral
     */
    actualizarListaUnidades() {
        const lista = document.getElementById('unidadesLista');
        if (!lista) return;

        lista.innerHTML = '';

        for (const [unidadId, ordenes] of this.cola.ordenesPorUnidad) {
            const item = document.createElement('div');
            item.className = 'unidad-item';
            // Obtener nombre de la primera orden (todas deberían tener el mismo unidadNombre)
            const marcador = window.buscarMarcadorPorId(unidadId);
            if (marcador) {
                const datosElemento = window.obtenerDatosElemento(marcador);
                nombreUnidad = datosElemento.nombreCompleto; // ✅ Del marcador REAL
            }
            item.innerHTML = `
                <div class="unidad-nombre">${nombreUnidad}</div>
                <div class="unidad-ordenes">${ordenes.length} orden(es)</div>
            `;

            item.addEventListener('click', () => {
                // Seleccionar unidad
                document.querySelectorAll('.unidad-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
            });

            lista.appendChild(item);
        }
    }

    /**
     * Actualiza el footer con información
     */
    actualizarFooter() {
        const stats = this.cola.getEstadisticas();

        // Calcular tiempo total
        let tiempoMaxSegundos = 0;
        for (const [unidadId, ordenes] of this.cola.ordenesPorUnidad) {
            let tiempoUnidad = 0;
            ordenes.forEach(orden => {
                tiempoUnidad += orden.tiempoRealSegundos || 600;
            });
            tiempoMaxSegundos = Math.max(tiempoMaxSegundos, tiempoUnidad);
        }

        const horas = Math.floor(tiempoMaxSegundos / 3600);
        const minutos = Math.floor((tiempoMaxSegundos % 3600) / 60);
        const turnos = Math.ceil(tiempoMaxSegundos / 3600);

        document.getElementById('infoTiempoTotal').textContent = `Tiempo Total: ${horas}:${minutos.toString().padStart(2, '0')}`;
        document.getElementById('infoTurnos').textContent = `Turnos: ${turnos}`;
        document.getElementById('infoOrdenesTotal').textContent = `Órdenes: ${stats.pendientes}`;
    }

    /**
     * Eventos del canvas
     */
    onCanvasClick(e) {
        const rect = this.timelineCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Buscar orden clickeada
        for (const [unidadId, ordenes] of this.cola.ordenesPorUnidad) {
            for (const orden of ordenes) {
                if (orden._bounds) {
                    const b = orden._bounds;
                    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                        this.seleccionarOrden(orden);
                        return;
                    }
                }
            }
        }
    }

    onCanvasMouseMove(e) {
        const rect = this.timelineCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Si estamos arrastrando
        if (this.dragging) {
            this.previsualizarDrag(x, y);
            return;
        }

        // Si no estamos arrastrando, mostrar tooltip
        this.mostrarTooltip(e, x, y);
    }

    onCanvasMouseDown(e) {
        const rect = this.timelineCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Buscar orden clickeada
        for (const [unidadId, ordenes] of this.cola.ordenesPorUnidad) {
            for (const orden of ordenes) {
                if (orden._bounds) {
                    const b = orden._bounds;
                    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                        // Iniciar drag
                        this.dragging = {
                            orden: orden,
                            unidadId: unidadId,
                            ordenesArray: ordenes,
                            offsetX: x - b.x,
                            offsetY: y - b.y,
                            posicionOriginal: ordenes.indexOf(orden),
                            tiempoOriginal: this.calcularTiempoAcumuladoHasta(ordenes, orden)
                        };

                        console.log(`🎯 Drag iniciado: ${orden.tipo} de ${unidadId}`);
                        this.timelineCanvas.style.cursor = 'grabbing';
                        return;
                    }
                }
            }
        }
    }

    onCanvasMouseUp(e) {
        if (!this.dragging) return;

        const rect = this.timelineCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Calcular nueva posición temporal
        const pixelesPorSegundo = this.config.pixelesPorSegundo * this.zoom;
        const nuevoTiempoSegundos = Math.max(0, (x - this.dragging.offsetX) / pixelesPorSegundo);

        console.log(`🎯 Drag finalizado: tiempo nuevo = ${nuevoTiempoSegundos}s`);

        // Calcular nueva posición en el array basada en tiempo
        const nuevaPosicion = this.calcularNuevaPosicionEnCola(
            this.dragging.ordenesArray,
            this.dragging.orden,
            nuevoTiempoSegundos
        );

        // Reordenar
        this.reordenarOrdenEnCola(
            this.dragging.unidadId,
            this.dragging.posicionOriginal,
            nuevaPosicion
        );

        // Limpiar drag
        this.dragging = null;
        this.timelineCanvas.style.cursor = 'default';

        // Re-renderizar
        this.renderizar();

        console.log(`✅ Orden reordenada a posición ${nuevaPosicion}`);
    }

    /**
     * Selecciona una orden
     */
    seleccionarOrden(orden) {
        this.ordenSeleccionada = orden;
        console.log('Orden seleccionada:', orden.getResumen());

        // TODO: Mostrar panel de detalles de la orden
    }

    /**
     * Zoom
     */
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.renderizar();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.2);
        this.renderizar();
    }

    resetZoom() {
        this.zoom = 1.0;
        this.scrollX = 0;
        this.renderizar();
    }

    /**
     * Valida todas las órdenes
     */
    async validarOrdenes() {
        console.log('🔍 Validando órdenes...');
        await this.cola.validarOrdenes();
        this.renderizar();
    }

    /**
     * Ejecuta el turno actual
     */
    async ejecutarTurno() {
        if (!confirm('¿Ejecutar turno actual?')) return;

        console.log('🚀 Ejecutando turno...');
        // TODO: Integrar con gestor de turnos
        await this.cola.ejecutarTurno(1);
        this.renderizar();
    }

    /**
     * Cierra el panel
     */
    cerrar() {
        this.container.remove();
    }

    /**
     * Muestra el panel
     */
    mostrar() {
        this.container.style.display = 'flex';
        this.ajustarTamañoCanvas();
        this.renderizar();
    }

    /**
     * Oculta el panel
     */
    ocultar() {
        this.container.style.display = 'none';
    }

    /**
     * 🎯 Previsualizar posición durante drag
     */
    previsualizarDrag(x, y) {
        // Calcular nueva posición temporal
        const pixelesPorSegundo = this.config.pixelesPorSegundo * this.zoom;
        const nuevoTiempoSegundos = (x - this.dragging.offsetX) / pixelesPorSegundo;

        // Renderizar con preview
        this.renderizar();

        // Dibujar orden en posición de drag (semi-transparente)
        const ctx = this.ctx;
        const b = this.dragging.orden._bounds;
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = this.config.coloresOrden[this.dragging.orden.tipo] || '#999';
        ctx.fillRect(x - this.dragging.offsetX, y - this.dragging.offsetY, b.width, b.height);
        
        // Borde amarillo indicando drag
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - this.dragging.offsetX, y - this.dragging.offsetY, b.width, b.height);
        ctx.restore();

        // Mostrar tiempo calculado
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText(`T+${Math.floor(nuevoTiempoSegundos / 60)}min`, x + 5, y - 10);

        this.timelineCanvas.style.cursor = 'grabbing';
    }

    /**
     * 🎯 Mostrar tooltip al pasar sobre orden
     */
    mostrarTooltip(e, x, y) {
        // Buscar orden bajo el cursor
        let ordenEncontrada = null;
        let unidadIdEncontrada = null;

        for (const [unidadId, ordenes] of this.cola.ordenesPorUnidad) {
            for (const orden of ordenes) {
                if (orden._bounds) {
                    const b = orden._bounds;
                    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                        ordenEncontrada = orden;
                        unidadIdEncontrada = unidadId;
                        break;
                    }
                }
            }
            if (ordenEncontrada) break;
        }

        // Actualizar o eliminar tooltip
        this.actualizarTooltip(e, ordenEncontrada, unidadIdEncontrada);
        
        // Cambiar cursor
        this.timelineCanvas.style.cursor = ordenEncontrada ? 'grab' : 'default';
    }

    /**
     * 🎯 Actualizar tooltip
     */
    actualizarTooltip(e, orden, unidadId) {
        let tooltip = document.getElementById('orden-tooltip');

        if (!orden) {
            // Eliminar tooltip si existe
            if (tooltip) {
                tooltip.remove();
            }
            return;
        }

        // Crear tooltip si no existe
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'orden-tooltip';
            tooltip.className = 'orden-tooltip';
            document.body.appendChild(tooltip);
        }

        // Calcular tiempo de inicio
        const ordenes = this.cola.getOrdenesDeUnidad(unidadId);
        const tiempoInicio = this.calcularTiempoAcumuladoHasta(ordenes, orden);
        const tiempoFin = tiempoInicio + (orden.tiempoRealSegundos || 600);

        // Formatear tiempos
        const formatoTiempo = (segundos) => {
            const horas = Math.floor(segundos / 3600);
            const minutos = Math.floor((segundos % 3600) / 60);
            return `${horas}h ${minutos}m`;
        };

        // Contenido del tooltip
        const elemento = window.elementosPorId?.get(unidadId);
        // 🎯 BUSCAR MARCADOR REAL
            const marcador = window.buscarMarcadorPorId(unidadId);
            let nombreUnidad = unidadId;
            
            if (marcador) {
                const datosElemento = window.obtenerDatosElemento(marcador);
                if (datosElemento) {
                    nombreUnidad = datosElemento.nombreCompleto; // ✅ Del marcador REAL
                }
            } else if (ordenes[0]) {
                nombreUnidad = ordenes[0].unidadNombre || unidadId;
                console.warn(`⚠️ Marcador no encontrado para ${unidadId}, usando datos de orden`);
            }

        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">
                ${orden.tipo.toUpperCase()} - ${nombreUnidad}
            </div>
            <div style="font-size: 11px; opacity: 0.9;">
                📍 Inicio: ${formatoTiempo(tiempoInicio)}<br>
                ⏱️ Duración: ${formatoTiempo(orden.tiempoRealSegundos || 600)}<br>
                🏁 Fin: ${formatoTiempo(tiempoFin)}<br>
                📊 Estado: ${orden.estado || 'pendiente'}
            </div>
        `;

        // Posicionar tooltip
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
        tooltip.style.display = 'block';
    }

    /**
     * 🎯 Calcula tiempo acumulado hasta una orden
     */
    calcularTiempoAcumuladoHasta(ordenes, ordenBuscada) {
        let tiempoAcumulado = 0;

        for (const orden of ordenes) {
            if (orden === ordenBuscada) {
                return tiempoAcumulado;
            }
            tiempoAcumulado += orden.tiempoRealSegundos || 600;
        }

        return tiempoAcumulado;
    }

    /**
     * 🎯 Calcula nueva posición en cola basada en tiempo deseado
     */
    calcularNuevaPosicionEnCola(ordenes, ordenArrastrada, tiempoDeseadoSegundos) {
        let tiempoAcumulado = 0;
        let nuevaPosicion = 0;

        for (let i = 0; i < ordenes.length; i++) {
            const orden = ordenes[i];
            
            // Ignorar la orden que estamos arrastrando
            if (orden === ordenArrastrada) {
                continue;
            }

            const duracionOrden = orden.tiempoRealSegundos || 600;

            // Si el tiempo deseado cae antes de esta orden, insertamos aquí
            if (tiempoDeseadoSegundos < tiempoAcumulado + duracionOrden) {
                return nuevaPosicion;
            }

            tiempoAcumulado += duracionOrden;
            nuevaPosicion++;
        }

        // Si llegamos al final, va al último
        return ordenes.length - 1;
    }

    /**
     * 🎯 Reordena una orden en la cola
     */
    reordenarOrdenEnCola(unidadId, posicionVieja, posicionNueva) {
        const ordenes = this.cola.ordenesPorUnidad.get(unidadId);
        if (!ordenes) return false;

        // Validar posiciones
        if (posicionVieja === posicionNueva) {
            console.log('⚠️ Posición sin cambios');
            return false;
        }

        // Mover orden
        const [orden] = ordenes.splice(posicionVieja, 1);
        ordenes.splice(posicionNueva, 0, orden);

        // Recalcular timeline
        this.cola.recalcularTimeline();

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('ordenReordenada', {
                unidadId,
                ordenId: orden.id,
                posicionVieja,
                posicionNueva
            });
        }

        return true;
    }

}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelCoordinacionOrdenes;
}
window.PanelCoordinacionOrdenes = PanelCoordinacionOrdenes;

console.log('✅ PanelCoordinacionOrdenes.js cargado - Timeline Style para Coordinación');
