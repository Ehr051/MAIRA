/**
 * MAIRA 4.0 - Pantalla de Carga Vista 3D
 * ========================================
 * 
 * Pantalla de carga profesional que se muestra mientras se genera el escenario 3D
 * Incluye:
 * - Spinner animado
 * - Mensajes de progreso
 * - Barra de progreso
 * - Información de estado
 */

class LoadingScreen3D {
    constructor() {
        this.container = null;
        this.progressBar = null;
        this.statusText = null;
        this.currentProgress = 0;
        this.steps = [
            'Inicializando sistema 3D...',
            'Cargando bibliotecas Three.js...',
            'Procesando elevación del terreno...',
            'Generando geometría 3D...',
            'Aplicando texturas...',
            'Configurando iluminación...',
            'Cargando modelos militares...',
            'Optimizando renderizado...',
            'Finalizando escenario 3D...'
        ];
        this.currentStep = 0;
    }

    /**
     * CREAR HTML DE LA PANTALLA DE CARGA
     */
    createLoadingHTML() {
        return `
            <div id="loading3DScreen" class="loading-3d-screen">
                <div class="loading-3d-container">
                    <!-- Logo/Icon -->
                    <div class="loading-3d-icon">
                        <i class="fas fa-cube"></i>
                    </div>

                    <!-- Spinner -->
                    <div class="loading-3d-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>

                    <!-- Título -->
                    <h2 class="loading-3d-title">Generando Escenario 3D</h2>

                    <!-- Mensaje de estado -->
                    <p class="loading-3d-status" id="loading3DStatus">
                        Inicializando sistema 3D...
                    </p>

                    <!-- Barra de progreso -->
                    <div class="loading-3d-progress-container">
                        <div class="loading-3d-progress-bar" id="loading3DProgress">
                            <div class="loading-3d-progress-fill"></div>
                        </div>
                        <span class="loading-3d-progress-text" id="loading3DProgressText">0%</span>
                    </div>

                    <!-- Info adicional -->
                    <div class="loading-3d-info">
                        <i class="fas fa-info-circle"></i>
                        <span>Este proceso puede tardar unos segundos según la configuración</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * CREAR ESTILOS CSS
     */
    createLoadingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Pantalla de carga */
            .loading-3d-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.98) 100%);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }

            /* Container */
            .loading-3d-container {
                text-align: center;
                max-width: 500px;
                padding: 40px;
            }

            /* Icon */
            .loading-3d-icon {
                font-size: 60px;
                color: #e94560;
                margin-bottom: 20px;
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }

            /* Spinner */
            .loading-3d-spinner {
                position: relative;
                width: 100px;
                height: 100px;
                margin: 0 auto 30px;
            }

            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid transparent;
                border-top-color: #e94560;
                border-radius: 50%;
                animation: spin 1.5s linear infinite;
            }

            .spinner-ring:nth-child(2) {
                width: 80%;
                height: 80%;
                top: 10%;
                left: 10%;
                border-top-color: #0f3460;
                animation-duration: 2s;
                animation-direction: reverse;
            }

            .spinner-ring:nth-child(3) {
                width: 60%;
                height: 60%;
                top: 20%;
                left: 20%;
                border-top-color: #e94560;
                animation-duration: 2.5s;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Título */
            .loading-3d-title {
                color: #fff;
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 15px;
                text-shadow: 0 2px 10px rgba(233, 69, 96, 0.3);
            }

            /* Status */
            .loading-3d-status {
                color: #e94560;
                font-size: 16px;
                margin: 0 0 25px;
                min-height: 24px;
                animation: fadeInOut 0.5s ease;
            }

            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-5px); }
                100% { opacity: 1; transform: translateY(0); }
            }

            /* Progress bar container */
            .loading-3d-progress-container {
                position: relative;
                margin-bottom: 20px;
            }

            .loading-3d-progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(15, 52, 96, 0.5);
                border-radius: 10px;
                overflow: hidden;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
            }

            .loading-3d-progress-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #e94560 0%, #d63447 100%);
                border-radius: 10px;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(233, 69, 96, 0.6);
            }

            .loading-3d-progress-text {
                display: block;
                color: #fff;
                font-size: 14px;
                margin-top: 8px;
                font-weight: 500;
            }

            /* Info */
            .loading-3d-info {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                color: #aaa;
                font-size: 13px;
                margin-top: 25px;
            }

            .loading-3d-info i {
                color: #0f3460;
                font-size: 16px;
            }

            /* Fade animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        return style;
    }

    /**
     * MOSTRAR PANTALLA DE CARGA
     */
    show() {
        // Inyectar estilos si no existen
        if (!document.getElementById('loading3DStyles')) {
            const styles = this.createLoadingStyles();
            styles.id = 'loading3DStyles';
            document.head.appendChild(styles);
        }

        // Crear pantalla de carga
        const loadingContainer = document.createElement('div');
        loadingContainer.innerHTML = this.createLoadingHTML();
        document.body.appendChild(loadingContainer.firstElementChild);

        this.container = document.getElementById('loading3DScreen');
        this.statusText = document.getElementById('loading3DStatus');
        this.progressBar = document.getElementById('loading3DProgress').querySelector('.loading-3d-progress-fill');
        this.progressText = document.getElementById('loading3DProgressText');

        this.currentProgress = 0;
        this.currentStep = 0;

        console.log('🔄 Pantalla de carga 3D mostrada');

        // Iniciar simulación de progreso automático
        this.startAutoProgress();
    }

    /**
     * INICIAR PROGRESO AUTOMÁTICO
     * (simula progreso mientras se carga realmente)
     */
    startAutoProgress() {
        this.autoProgressInterval = setInterval(() => {
            if (this.currentProgress < 90) {
                // Incremento variable para simular pasos
                const increment = Math.random() * 15 + 5;
                this.updateProgress(Math.min(90, this.currentProgress + increment));
            }
        }, 800);
    }

    /**
     * DETENER PROGRESO AUTOMÁTICO
     */
    stopAutoProgress() {
        if (this.autoProgressInterval) {
            clearInterval(this.autoProgressInterval);
            this.autoProgressInterval = null;
        }
    }

    /**
     * ACTUALIZAR PROGRESO
     */
    updateProgress(progress) {
        this.currentProgress = Math.min(100, progress);
        
        if (this.progressBar) {
            this.progressBar.style.width = `${this.currentProgress}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = `${Math.floor(this.currentProgress)}%`;
        }

        // Actualizar mensaje según progreso
        const stepIndex = Math.floor((this.currentProgress / 100) * this.steps.length);
        if (stepIndex !== this.currentStep && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.updateStatus(this.steps[stepIndex]);
        }

        console.log(`📊 Progreso 3D: ${Math.floor(this.currentProgress)}%`);
    }

    /**
     * ACTUALIZAR MENSAJE DE ESTADO
     */
    updateStatus(message) {
        if (this.statusText) {
            // Animación de fade
            this.statusText.style.animation = 'none';
            setTimeout(() => {
                this.statusText.textContent = message;
                this.statusText.style.animation = 'fadeInOut 0.5s ease';
            }, 50);
        }
        console.log(`ℹ️ Estado 3D: ${message}`);
    }

    /**
     * COMPLETAR CARGA
     */
    complete() {
        this.stopAutoProgress();
        this.updateProgress(100);
        this.updateStatus('¡Escenario 3D generado exitosamente!');

        setTimeout(() => {
            this.hide();
        }, 500);
    }

    /**
     * OCULTAR PANTALLA DE CARGA
     */
    hide() {
        if (this.container) {
            this.stopAutoProgress();
            
            this.container.style.animation = 'fadeOut 0.3s ease';
            
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.container = null;
                this.progressBar = null;
                this.statusText = null;
                this.progressText = null;
                console.log('✅ Pantalla de carga 3D ocultada');
            }, 300);
        }
    }

    /**
     * MOSTRAR ERROR
     */
    showError(errorMessage) {
        this.stopAutoProgress();
        
        if (this.statusText) {
            this.statusText.textContent = `❌ Error: ${errorMessage}`;
            this.statusText.style.color = '#ff6b6b';
        }

        if (this.progressBar) {
            this.progressBar.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #ff4757 100%)';
        }

        setTimeout(() => {
            this.hide();
        }, 3000);
    }
}

// Exportar clase globalmente
window.LoadingScreen3D = LoadingScreen3D;

console.log('✅ LoadingScreen3D cargado y disponible globalmente');
