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
        this.container = null;
        this.timelineCanvas = null;
        this.ctx = null;

        // ID del contenedor
        this.contenedorId = opciones.contenedor || 'panel-coordinacion-container';

        // Configuración visual
        this.config = {
            alturaUnidad: 60,           // Altura de cada fila de unidad
            pixelesPorSegundo: 0.2,     // 0.2 px = 1 segundo (3600s = 720px por turno)
            anchoPanelLateral: 200,     // Ancho del panel de unidades
            alturaCabecera: 50,         // Altura de la cabecera con escala de tiempo
            duracionTurnoMinutos: opciones.duracionTurnoMinutos || 60,
            coloresOrden: {
                movimiento: '#4CAF50',
                ataque: '#f44336',
                defensa: '#2196F3',
                ingeniero: '#FF9800',
                comunicaciones: '#9C27B0',
                pendiente: '#999',
                ejecutando: '#FFD700',
                completada: '#4CAF50',
                invalida: '#f44336'
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
                    <button class="btn-primary" id="btnEjecutarTurno">
                        <i class="fas fa-play"></i> Ejecutar Turno
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
                background: rgba(255, 255, 255, 0.98);
                border-top: 3px solid #2196F3;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                font-family: 'Segoe UI', Arial, sans-serif;
            }

            .panel-header {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
                border-right: 2px solid #ddd;
                background: #f5f5f5;
                display: flex;
                flex-direction: column;
            }

            .unidades-header {
                background: #e0e0e0;
                padding: 12px;
                font-weight: bold;
                border-bottom: 1px solid #ccc;
            }

            .unidades-lista {
                flex: 1;
                overflow-y: auto;
            }

            .unidad-item {
                padding: 12px;
                border-bottom: 1px solid #ddd;
                cursor: pointer;
                transition: background 0.2s;
                height: ${this.config.alturaUnidad}px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .unidad-item:hover {
                background: #e3f2fd;
            }

            .unidad-item.selected {
                background: #bbdefb;
                border-left: 4px solid #2196F3;
            }

            .unidad-nombre {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 4px;
            }

            .unidad-ordenes {
                font-size: 11px;
                color: #666;
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
                background: #f5f5f5;
                border-top: 1px solid #ddd;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .footer-info {
                display: flex;
                gap: 20px;
                font-size: 13px;
                color: #666;
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
                z-index: 10001;
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
        document.getElementById('btnEjecutarTurno')?.addEventListener('click', () => this.ejecutarTurno());
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
    }

    /**
     * Renderiza todo el panel
     */
    renderizar() {
        this.limpiarCanvas();
        this.renderizarCabecera();
        this.renderizarFilasUnidades();
        this.renderizarOrdenes();
        this.renderizarMarcadorTiempo();
        this.actualizarListaUnidades();
        this.actualizarFooter();
    }

    /**
     * Limpia el canvas
     */
    limpiarCanvas() {
        this.ctx.clearRect(0, 0, this.timelineCanvas.width, this.timelineCanvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.timelineCanvas.width, this.timelineCanvas.height);
    }

    /**
     * Renderiza la cabecera con escala de tiempo
     */
    renderizarCabecera() {
        const ctx = this.ctx;
        const h = this.config.alturaCabecera;

        // Fondo
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, this.timelineCanvas.width, h);

        // Línea divisoria
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(this.timelineCanvas.width, h);
        ctx.stroke();

        // Escala de tiempo (cada 5 minutos)
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';

        const pixelesPorMinuto = (this.config.pixelesPorSegundo * 60) * this.zoom;
        const intervaloMinutos = 5;

        for (let minutos = 0; minutos <= 120; minutos += intervaloMinutos) {
            const x = minutos * pixelesPorMinuto;

            if (x > this.timelineCanvas.width) break;

            // Marca
            ctx.beginPath();
            ctx.moveTo(x, h - 10);
            ctx.lineTo(x, h);
            ctx.stroke();

            // Texto
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            ctx.fillText(`${horas}:${mins.toString().padStart(2, '0')}`, x, h - 15);
        }

        // Marcas de turnos (cada hora)
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;

        for (let turno = 1; turno <= 5; turno++) {
            const x = turno * 60 * pixelesPorMinuto;

            if (x > this.timelineCanvas.width) break;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            // Etiqueta de turno
            ctx.fillStyle = '#2196F3';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`Turno ${turno}`, x, 20);
        }
    }

    /**
     * Renderiza las filas de unidades (fondo)
     */
    renderizarFilasUnidades() {
        const ctx = this.ctx;
        const unidades = Array.from(this.cola.ordenesPorUnidad.keys());
        const h = this.config.alturaUnidad;
        const yInicio = this.config.alturaCabecera;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ddd';

        unidades.forEach((unidadId, index) => {
            const y = yInicio + (index * h);

            // Fondo alternado
            if (index % 2 === 0) {
                ctx.fillStyle = '#fafafa';
                ctx.fillRect(0, y, this.timelineCanvas.width, h);
            }

            // Línea divisoria
            ctx.beginPath();
            ctx.moveTo(0, y + h);
            ctx.lineTo(this.timelineCanvas.width, y + h);
            ctx.stroke();
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

                // Borde
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y + 5, width - 2, h - 10);

                // Texto (si hay espacio)
                if (width > 50) {
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(orden.tipo, x + 5, y + h / 2 + 4);
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
            item.innerHTML = `
                <div class="unidad-nombre">${unidadId}</div>
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
        // TODO: Implementar tooltip al pasar sobre órdenes
    }

    onCanvasMouseDown(e) {
        // TODO: Implementar drag & drop de órdenes
    }

    onCanvasMouseUp(e) {
        // TODO: Finalizar drag & drop
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
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelCoordinacionOrdenes;
}
window.PanelCoordinacionOrdenes = PanelCoordinacionOrdenes;

console.log('✅ PanelCoordinacionOrdenes.js cargado - Timeline Style para Coordinación');
