/**
 * MAIRA 4.0 - Modal de Configuración Vista 3D
 * ============================================
 * 
 * Modal compacto para configuración inicial del escenario 3D
 * Se muestra al hacer clic en "Generar Vista 3D"
 * 
 * Opciones mínimas que el usuario puede modificar:
 * - Tamaño del terreno (pequeño, mediano, grande)
 * - Calidad de renderizado (bajo, medio, alto)
 * - Nivel de detalle vegetación (ninguno, bajo, alto)
 * - Iluminación (día, atardecer, noche)
 * 
 * El resto de parámetros están preconfigurados en valores óptimos
 */

class Modal3DConfiguration {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.onConfirm = null;
        this.config = {
            terrainSize: 'medium', // small, medium, large
            renderQuality: 'high', // low, medium, high
            vegetationLevel: 'low', // none, low, high
            lighting: 'day' // day, sunset, night
        };
    }

    /**
     * CREAR HTML DEL MODAL
     */
    createModalHTML() {
        return `
            <div id="modal3DOverlay" class="modal-3d-overlay">
                <div class="modal-3d-container">
                    <!-- Header -->
                    <div class="modal-3d-header">
                        <h3><i class="fas fa-cube"></i> Configuración Vista 3D</h3>
                        <button class="modal-3d-close" id="closeModal3D">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="modal-3d-body">
                        <!-- Tamaño del terreno -->
                        <div class="modal-3d-option">
                            <label>
                                <i class="fas fa-map"></i> Tamaño del Terreno
                            </label>
                            <select id="terrainSize" class="modal-3d-select">
                                <option value="small">Pequeño (1000m × 1000m)</option>
                                <option value="medium" selected>Mediano (2000m × 2000m)</option>
                                <option value="large">Grande (4000m × 4000m)</option>
                            </select>
                            <small>Mayor tamaño = más tiempo de carga</small>
                        </div>

                        <!-- Calidad de renderizado -->
                        <div class="modal-3d-option">
                            <label>
                                <i class="fas fa-star"></i> Calidad de Renderizado
                            </label>
                            <select id="renderQuality" class="modal-3d-select">
                                <option value="low">Bajo (mejor rendimiento)</option>
                                <option value="medium">Medio (equilibrado)</option>
                                <option value="high" selected>Alto (mejor calidad)</option>
                            </select>
                            <small>Mayor calidad = mayor consumo de GPU</small>
                        </div>

                        <!-- Vegetación -->
                        <div class="modal-3d-option">
                            <label>
                                <i class="fas fa-tree"></i> Nivel de Vegetación
                            </label>
                            <select id="vegetationLevel" class="modal-3d-select">
                                <option value="none">Sin vegetación</option>
                                <option value="low" selected>Bajo (vegetación básica)</option>
                                <option value="high">Alto (vegetación densa)</option>
                            </select>
                            <small>Vegetación densa puede reducir FPS</small>
                        </div>

                        <!-- Iluminación -->
                        <div class="modal-3d-option">
                            <label>
                                <i class="fas fa-sun"></i> Iluminación
                            </label>
                            <select id="lighting" class="modal-3d-select">
                                <option value="day" selected>Día (máxima visibilidad)</option>
                                <option value="sunset">Atardecer (luz cálida)</option>
                                <option value="night">Noche (iluminación artificial)</option>
                            </select>
                            <small>Luz del día recomendada para planeamiento</small>
                        </div>

                        <!-- Info adicional -->
                        <div class="modal-3d-info">
                            <i class="fas fa-info-circle"></i>
                            <span>Tiempo estimado de generación: <strong id="estimatedTime">2-3 segundos</strong></span>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="modal-3d-footer">
                        <button class="modal-3d-btn modal-3d-btn-cancel" id="cancelModal3D">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button class="modal-3d-btn modal-3d-btn-confirm" id="confirmModal3D">
                            <i class="fas fa-check"></i> Generar Escenario 3D
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * CREAR ESTILOS CSS DEL MODAL
     */
    createModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Overlay */
            .modal-3d-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* Container */
            .modal-3d-container {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #0f3460;
                border-radius: 12px;
                width: 500px;
                max-width: 90%;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            /* Header */
            .modal-3d-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 2px solid #0f3460;
            }

            .modal-3d-header h3 {
                margin: 0;
                color: #e94560;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .modal-3d-close {
                background: transparent;
                border: none;
                color: #aaa;
                font-size: 20px;
                cursor: pointer;
                padding: 5px 10px;
                transition: color 0.2s;
            }

            .modal-3d-close:hover {
                color: #e94560;
            }

            /* Body */
            .modal-3d-body {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }

            .modal-3d-option {
                margin-bottom: 20px;
            }

            .modal-3d-option label {
                display: block;
                color: #fff;
                font-weight: 500;
                margin-bottom: 8px;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .modal-3d-option label i {
                color: #e94560;
                font-size: 16px;
            }

            .modal-3d-select {
                width: 100%;
                padding: 10px 12px;
                background: #16213e;
                border: 1px solid #0f3460;
                border-radius: 6px;
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .modal-3d-select:hover {
                border-color: #e94560;
            }

            .modal-3d-select:focus {
                outline: none;
                border-color: #e94560;
                box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.2);
            }

            .modal-3d-option small {
                display: block;
                color: #aaa;
                font-size: 12px;
                margin-top: 5px;
                font-style: italic;
            }

            .modal-3d-info {
                background: rgba(233, 69, 96, 0.1);
                border: 1px solid rgba(233, 69, 96, 0.3);
                border-radius: 6px;
                padding: 12px;
                margin-top: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
                font-size: 13px;
            }

            .modal-3d-info i {
                color: #e94560;
                font-size: 18px;
            }

            /* Footer */
            .modal-3d-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 20px;
                border-top: 2px solid #0f3460;
            }

            .modal-3d-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
            }

            .modal-3d-btn-cancel {
                background: transparent;
                border: 1px solid #0f3460;
                color: #aaa;
            }

            .modal-3d-btn-cancel:hover {
                background: #0f3460;
                color: #fff;
            }

            .modal-3d-btn-confirm {
                background: linear-gradient(135deg, #e94560 0%, #d63447 100%);
                color: #fff;
            }

            .modal-3d-btn-confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(233, 69, 96, 0.4);
            }

            .modal-3d-btn:active {
                transform: translateY(0);
            }

            /* Scrollbar personalizada */
            .modal-3d-body::-webkit-scrollbar {
                width: 8px;
            }

            .modal-3d-body::-webkit-scrollbar-track {
                background: #16213e;
                border-radius: 4px;
            }

            .modal-3d-body::-webkit-scrollbar-thumb {
                background: #0f3460;
                border-radius: 4px;
            }

            .modal-3d-body::-webkit-scrollbar-thumb:hover {
                background: #e94560;
            }
        `;
        return style;
    }

    /**
     * MOSTRAR MODAL
     */
    show(onConfirm) {
        this.onConfirm = onConfirm;

        // Inyectar estilos si no existen
        if (!document.getElementById('modal3DStyles')) {
            const styles = this.createModalStyles();
            styles.id = 'modal3DStyles';
            document.head.appendChild(styles);
        }

        // Crear modal
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = this.createModalHTML();
        document.body.appendChild(modalContainer.firstElementChild);

        this.overlay = document.getElementById('modal3DOverlay');
        this.modal = this.overlay.querySelector('.modal-3d-container');

        // Event listeners
        this.setupEventListeners();

        console.log('📋 Modal de configuración 3D mostrado');
    }

    /**
     * CONFIGURAR EVENT LISTENERS
     */
    setupEventListeners() {
        // Botón cerrar
        document.getElementById('closeModal3D').addEventListener('click', () => {
            this.close();
        });

        // Botón cancelar
        document.getElementById('cancelModal3D').addEventListener('click', () => {
            this.close();
        });

        // Botón confirmar
        document.getElementById('confirmModal3D').addEventListener('click', () => {
            this.confirm();
        });

        // Cerrar al hacer clic en overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Actualizar tiempo estimado al cambiar opciones
        ['terrainSize', 'renderQuality', 'vegetationLevel'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateEstimatedTime();
            });
        });

        // Escape key para cerrar
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    /**
     * ACTUALIZAR TIEMPO ESTIMADO
     */
    updateEstimatedTime() {
        const terrainSize = document.getElementById('terrainSize').value;
        const renderQuality = document.getElementById('renderQuality').value;
        const vegetationLevel = document.getElementById('vegetationLevel').value;

        let baseTime = 2;
        
        // Ajustar por tamaño
        if (terrainSize === 'small') baseTime *= 0.7;
        else if (terrainSize === 'large') baseTime *= 1.5;
        
        // Ajustar por calidad
        if (renderQuality === 'high') baseTime *= 1.2;
        
        // Ajustar por vegetación
        if (vegetationLevel === 'high') baseTime *= 1.3;

        const minTime = Math.floor(baseTime);
        const maxTime = Math.ceil(baseTime + 1);

        document.getElementById('estimatedTime').textContent = `${minTime}-${maxTime} segundos`;
    }

    /**
     * CONFIRMAR Y CERRAR
     */
    confirm() {
        // Recopilar configuración
        this.config = {
            terrainSize: document.getElementById('terrainSize').value,
            renderQuality: document.getElementById('renderQuality').value,
            vegetationLevel: document.getElementById('vegetationLevel').value,
            lighting: document.getElementById('lighting').value
        };

        console.log('✅ Configuración 3D confirmada:', this.config);

        // Cerrar modal
        this.close(false);

        // Ejecutar callback
        if (this.onConfirm) {
            this.onConfirm(this.config);
        }
    }

    /**
     * CERRAR MODAL
     */
    close(skipCallback = true) {
        if (this.overlay) {
            this.overlay.style.animation = 'fadeOut 0.2s ease';
            this.modal.style.animation = 'slideDown 0.2s ease';

            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
                this.modal = null;
            }, 200);
        }

        // Remover handler de escape
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }

        console.log('📋 Modal de configuración 3D cerrado');
    }

    /**
     * OBTENER CONFIGURACIÓN ACTUAL
     */
    getConfig() {
        return { ...this.config };
    }
}

// Animaciones adicionales
const additionalStyles = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(30px); opacity: 0; }
    }
`;

// Exportar clase globalmente
window.Modal3DConfiguration = Modal3DConfiguration;

console.log('✅ Modal3DConfiguration cargado y disponible globalmente');
