/**
 * 🎓 SISTEMA DE TUTORIAL INTERACTIVO - MAIRA 4.0
 * Tutorial paso a paso para cada modo de juego
 * Incluye modo planeamiento, preparación y combate
 */

class InteractiveTutorialManager {
    constructor() {
        this.tutorialesDisponibles = {
            'planeamiento': 'Tutorial de Modo Planeamiento',
            'preparacion': 'Tutorial de Fase Preparación',
            'combate': 'Tutorial de Fase Combate',
            'director': 'Tutorial de Rol Director',
            'creador': 'Tutorial de Rol Creador'
        };
        
        this.tutorialActivo = null;
        this.pasoActual = 0;
        this.configuracionUsuario = {
            primerUso: true,
            tutorialesCompletados: [],
            mostrarAyudas: true
        };
        
        this.overlay = null;
        this.tooltip = null;
        
        console.log('🎓 Interactive Tutorial Manager inicializado');
        this.inicializar();
    }

    inicializar() {
        this.cargarConfiguracionUsuario();
        this.crearElementosUI();
        this.configurarEventos();
        this.verificarPrimerUso();
    }

    /**
     * Carga configuración del usuario desde localStorage
     */
    cargarConfiguracionUsuario() {
        try {
            const config = localStorage.getItem('maira_tutorial_config');
            if (config) {
                this.configuracionUsuario = { ...this.configuracionUsuario, ...JSON.parse(config) };
            }
        } catch (error) {
            console.warn('Error cargando configuración de tutorial:', error);
        }
    }

    /**
     * Guarda configuración del usuario
     */
    guardarConfiguracionUsuario() {
        try {
            localStorage.setItem('maira_tutorial_config', JSON.stringify(this.configuracionUsuario));
        } catch (error) {
            console.warn('Error guardando configuración de tutorial:', error);
        }
    }

    /**
     * Verifica si es el primer uso y muestra tutorial inicial
     */
    verificarPrimerUso() {
        if (this.configuracionUsuario.primerUso) {
            setTimeout(() => {
                this.mostrarDialogoInicial();
            }, 2000); // Esperar 2 segundos después de cargar
        }
    }

    /**
     * Muestra diálogo inicial de bienvenida
     */
    mostrarDialogoInicial() {
        const dialogo = this.crearDialogo({
            titulo: '¡Bienvenido a MAIRA 4.0!',
            contenido: `
                <div class="tutorial-welcome">
                    <p>Sistema Militar Argentino de Entrenamiento Interactivo</p>
                    <p>¿Te gustaría realizar un tutorial para aprender las funcionalidades básicas?</p>
                    <div class="tutorial-options">
                        <label>
                            <input type="checkbox" id="no-mostrar-mas"> 
                            No mostrar este mensaje de nuevo
                        </label>
                    </div>
                </div>
            `,
            botones: [
                {
                    texto: 'Realizar Tutorial',
                    clase: 'btn-primary',
                    accion: () => {
                        this.cerrarDialogo();
                        this.iniciarTutorial('planeamiento');
                    }
                },
                {
                    texto: 'Tal vez después',
                    clase: 'btn-secondary',
                    accion: () => {
                        this.cerrarDialogo();
                        this.mostrarMenuTutoriales();
                    }
                },
                {
                    texto: 'Omitir',
                    clase: 'btn-tertiary',
                    accion: () => {
                        const noMostrar = document.getElementById('no-mostrar-mas')?.checked;
                        if (noMostrar) {
                            this.configuracionUsuario.primerUso = false;
                            this.guardarConfiguracionUsuario();
                        }
                        this.cerrarDialogo();
                    }
                }
            ]
        });
    }

    /**
     * Muestra menú de tutoriales disponibles
     */
    mostrarMenuTutoriales() {
        const contenidoMenu = `
            <div class="tutorial-menu">
                <h3>Tutoriales Disponibles</h3>
                <div class="tutorial-list">
                    ${Object.entries(this.tutorialesDisponibles).map(([id, nombre]) => `
                        <div class="tutorial-item">
                            <span class="tutorial-name">${nombre}</span>
                            <span class="tutorial-status">
                                ${this.configuracionUsuario.tutorialesCompletados.includes(id) ? '✅ Completado' : '📚 Disponible'}
                            </span>
                            <button class="btn-tutorial" onclick="window.MAIRA.InteractiveTutorialManager.iniciarTutorial('${id}')">
                                ${this.configuracionUsuario.tutorialesCompletados.includes(id) ? 'Repetir' : 'Iniciar'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const dialogo = this.crearDialogo({
            titulo: 'Centro de Tutoriales MAIRA',
            contenido: contenidoMenu,
            botones: [
                {
                    texto: 'Cerrar',
                    clase: 'btn-secondary',
                    accion: () => this.cerrarDialogo()
                }
            ]
        });
    }

    /**
     * Inicia un tutorial específico
     */
    iniciarTutorial(tipoTutorial) {
        if (!this.tutorialesDisponibles[tipoTutorial]) {
            console.error('Tutorial no encontrado:', tipoTutorial);
            return;
        }
        
        this.tutorialActivo = tipoTutorial;
        this.pasoActual = 0;
        
        console.log(`🎓 Iniciando tutorial: ${this.tutorialesDisponibles[tipoTutorial]}`);
        
        // Cargar pasos del tutorial específico
        const pasos = this.obtenerPasosTutorial(tipoTutorial);
        
        this.crearOverlay();
        this.ejecutarPaso(pasos[0]);
    }

    /**
     * Obtiene los pasos de un tutorial específico
     */
    obtenerPasosTutorial(tipo) {
        const tutoriales = {
            'planeamiento': this.getPasosPlaneamiento(),
            'preparacion': this.getPasosPreparacion(),
            'combate': this.getPasosCombate(),
            'director': this.getPasosDirector(),
            'creador': this.getPasosCreador()
        };
        
        return tutoriales[tipo] || [];
    }

    /**
     * Pasos del tutorial de planeamiento
     */
    getPasosPlaneamiento() {
        return [
            {
                titulo: 'Bienvenido al Modo Planeamiento',
                contenido: 'El modo planeamiento te permite analizar terreno, colocar elementos y preparar ejercicios militares.',
                selector: '#map',
                posicion: 'center',
                accion: () => console.log('Paso 1: Introducción')
            },
            {
                titulo: 'Panel de Herramientas',
                contenido: 'Aquí encontrarás todas las herramientas para agregar elementos militares, líneas, polígonos y calcos.',
                selector: '.leaflet-bar',
                posicion: 'right',
                accion: () => this.resaltarElemento('.leaflet-bar')
            },
            {
                titulo: 'Menú Radial',
                contenido: 'Haz clic derecho en el mapa para acceder al menú radial con opciones contextuales.',
                selector: '#map',
                posicion: 'center',
                accion: () => this.mostrarDemostracionClick()
            },
            {
                titulo: 'Información de Terreno',
                contenido: 'Los hexágonos muestran información detallada del terreno incluyendo elevación y vegetación.',
                selector: '.hex-grid',
                posicion: 'top',
                accion: () => this.activarModoHexagono()
            },
            {
                titulo: 'Gestión de Calcos',
                contenido: 'Puedes crear, editar y gestionar diferentes calcos para organizar tu planeamiento.',
                selector: '#calco-selector',
                posicion: 'left',
                accion: () => this.mostrarGestionCalcos()
            },
            {
                titulo: 'Guardar Trabajo',
                contenido: 'No olvides guardar tu trabajo regularmente usando las opciones del menú.',
                selector: '.save-button',
                posicion: 'bottom',
                accion: () => this.resaltarElemento('.save-button')
            }
        ];
    }

    /**
     * Pasos del tutorial de preparación
     */
    getPasosPreparacion() {
        return [
            {
                titulo: 'Fase de Preparación',
                contenido: 'En esta fase, el director establece el sector de trabajo y las zonas de despliegue.',
                selector: '#map',
                posicion: 'center'
            },
            {
                titulo: 'Rol del Director',
                contenido: 'Como director o director temporal, debes definir el área de operaciones para limitar el terreno de juego.',
                selector: '.director-controls',
                posicion: 'right'
            },
            {
                titulo: 'Sector de Trabajo',
                contenido: 'Dibuja el sector de trabajo. Ningún elemento podrá colocarse fuera de este área.',
                selector: '.sector-trabajo-btn',
                posicion: 'bottom',
                accion: () => this.activarModoDibujoSector()
            },
            {
                titulo: 'Zonas de Despliegue',
                contenido: 'Define zonas separadas para equipos azul y rojo. Cada equipo solo puede desplegar en su zona asignada.',
                selector: '.zonas-despliegue-btn',
                posicion: 'bottom',
                accion: () => this.activarModoZonasDespliegue()
            },
            {
                titulo: 'Turnos de Despliegue',
                contenido: 'Los equipos se alternan para desplegar sus elementos. El orden es importante para mantener el realismo.',
                selector: '.turnos-info',
                posicion: 'left'
            },
            {
                titulo: 'Niebla de Guerra',
                contenido: 'Los equipos no pueden ver los elementos enemigos hasta estar en línea de visión directa.',
                selector: '.fog-of-war-info',
                posicion: 'top'
            }
        ];
    }

    /**
     * Pasos del tutorial de combate
     */
    getPasosCombate() {
        return [
            {
                titulo: 'Fase de Combate',
                contenido: 'La fase de combate usa mecánicas de juego por turnos similares a Panzer Corps y Total War.',
                selector: '#map',
                posicion: 'center'
            },
            {
                titulo: 'Sistema de Turnos',
                contenido: 'Cada turno representa tiempo real. Puedes mover elementos según su velocidad y capacidades.',
                selector: '.turnos-panel',
                posicion: 'right'
            },
            {
                titulo: 'Movimiento Realista',
                contenido: 'Los elementos se mueven según su tipo: infantería 4km/turno, blindados 30-40km/turno.',
                selector: '.movimiento-info',
                posicion: 'bottom'
            },
            {
                titulo: 'Línea de Visión',
                contenido: 'La visibilidad depende del tipo de unidad, terreno, vegetación y condiciones meteorológicas.',
                selector: '.vision-controls',
                posicion: 'left'
            },
            {
                titulo: 'Logística Realista',
                contenido: 'Cada elemento tiene autonomía limitada, munición y composición específica según la base de datos.',
                selector: '.logistica-panel',
                posicion: 'top'
            },
            {
                titulo: 'Estadísticas de Combate',
                contenido: 'El sistema registra todas las acciones para generar estadísticas detalladas al final.',
                selector: '.stats-panel',
                posicion: 'right'
            }
        ];
    }

    /**
     * Pasos del tutorial de director
     */
    getPasosDirector() {
        return [
            {
                titulo: 'Rol de Director',
                contenido: 'Como director, supervisas el ejercicio y tienes control total sobre la configuración.',
                selector: '#map',
                posicion: 'center'
            },
            {
                titulo: 'Configuración de Escenario',
                contenido: 'Establece parámetros del ejercicio: duración, condiciones meteorológicas, reglas especiales.',
                selector: '.scenario-config',
                posicion: 'right'
            },
            {
                titulo: 'Control de Fases',
                contenido: 'Puedes avanzar entre fases del ejercicio y pausar cuando sea necesario.',
                selector: '.phase-controls',
                posicion: 'bottom'
            },
            {
                titulo: 'Monitoreo Total',
                contenido: 'Ves todos los elementos de ambos equipos y puedes evaluar el desarrollo del ejercicio.',
                selector: '.monitor-panel',
                posicion: 'left'
            },
            {
                titulo: 'Generación de Reportes',
                contenido: 'Al finalizar, puedes generar reportes detallados para análisis posterior.',
                selector: '.reports-btn',
                posicion: 'top'
            }
        ];
    }

    /**
     * Pasos del tutorial de creador
     */
    getPasosCreador() {
        return [
            {
                titulo: 'Rol de Creador',
                contenido: 'El creador configura los parámetros iniciales del ejercicio antes de que inicie.',
                selector: '#map',
                posicion: 'center'
            },
            {
                titulo: 'Configuración de Tiempo',
                contenido: 'Define la duración de turnos y tiempo total del ejercicio.',
                selector: '.time-config',
                posicion: 'right'
            },
            {
                titulo: 'Selección de Mapa',
                contenido: 'Elige el área geográfica y las capas de terreno a utilizar.',
                selector: '.map-selector',
                posicion: 'bottom'
            },
            {
                titulo: 'Configuración IA',
                contenido: 'Establece qué elementos serán controlados por IA si es necesario.',
                selector: '.ai-config',
                posicion: 'left'
            },
            {
                titulo: 'Reglas del Ejercicio',
                contenido: 'Define reglas específicas, limitaciones y objetivos del ejercicio.',
                selector: '.rules-config',
                posicion: 'top'
            }
        ];
    }

    /**
     * Ejecuta un paso específico del tutorial
     */
    ejecutarPaso(paso) {
        if (!paso) return;
        
        // Ejecutar acción del paso si existe
        if (paso.accion) {
            paso.accion();
        }
        
        // Mostrar tooltip con información
        this.mostrarTooltip(paso);
        
        // Resaltar elemento si existe
        if (paso.selector && paso.selector !== '#map') {
            this.resaltarElemento(paso.selector);
        }
    }

    /**
     * Muestra tooltip con información del paso
     */
    mostrarTooltip(paso) {
        this.removerTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tutorial-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>${paso.titulo}</h4>
                <button class="tooltip-close" onclick="window.MAIRA.InteractiveTutorialManager.cerrarTutorial()">×</button>
            </div>
            <div class="tooltip-content">
                <p>${paso.contenido}</p>
            </div>
            <div class="tooltip-footer">
                <div class="tutorial-progress">
                    Paso ${this.pasoActual + 1} de ${this.obtenerPasosTutorial(this.tutorialActivo).length}
                </div>
                <div class="tooltip-buttons">
                    ${this.pasoActual > 0 ? '<button class="btn-prev" onclick="window.MAIRA.InteractiveTutorialManager.pasoAnterior()">Anterior</button>' : ''}
                    <button class="btn-next" onclick="window.MAIRA.InteractiveTutorialManager.siguientePaso()">
                        ${this.pasoActual < this.obtenerPasosTutorial(this.tutorialActivo).length - 1 ? 'Siguiente' : 'Finalizar'}
                    </button>
                    <button class="btn-skip" onclick="window.MAIRA.InteractiveTutorialManager.cerrarTutorial()">Omitir Tutorial</button>
                </div>
            </div>
        `;
        
        // Posicionar tooltip
        this.posicionarTooltip(tooltip, paso);
        
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
        
        // Animación de entrada
        setTimeout(() => tooltip.classList.add('show'), 100);
    }

    /**
     * Posiciona el tooltip según el elemento objetivo
     */
    posicionarTooltip(tooltip, paso) {
        if (paso.selector && paso.selector !== '#map') {
            const elemento = document.querySelector(paso.selector);
            if (elemento) {
                const rect = elemento.getBoundingClientRect();
                let top, left;
                
                switch (paso.posicion) {
                    case 'top':
                        top = rect.top - 10;
                        left = rect.left + rect.width / 2;
                        tooltip.classList.add('tooltip-top');
                        break;
                    case 'bottom':
                        top = rect.bottom + 10;
                        left = rect.left + rect.width / 2;
                        tooltip.classList.add('tooltip-bottom');
                        break;
                    case 'left':
                        top = rect.top + rect.height / 2;
                        left = rect.left - 10;
                        tooltip.classList.add('tooltip-left');
                        break;
                    case 'right':
                        top = rect.top + rect.height / 2;
                        left = rect.right + 10;
                        tooltip.classList.add('tooltip-right');
                        break;
                    default:
                        top = rect.bottom + 10;
                        left = rect.left + rect.width / 2;
                        tooltip.classList.add('tooltip-bottom');
                }
                
                tooltip.style.position = 'fixed';
                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
                tooltip.style.transform = 'translateX(-50%)';
                
                return;
            }
        }
        
        // Posición central por defecto
        tooltip.style.position = 'fixed';
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.classList.add('tooltip-center');
    }

    /**
     * Avanza al siguiente paso
     */
    siguientePaso() {
        const pasos = this.obtenerPasosTutorial(this.tutorialActivo);
        
        if (this.pasoActual < pasos.length - 1) {
            this.pasoActual++;
            this.ejecutarPaso(pasos[this.pasoActual]);
        } else {
            // Tutorial completado
            this.completarTutorial();
        }
    }

    /**
     * Retrocede al paso anterior
     */
    pasoAnterior() {
        if (this.pasoActual > 0) {
            this.pasoActual--;
            const pasos = this.obtenerPasosTutorial(this.tutorialActivo);
            this.ejecutarPaso(pasos[this.pasoActual]);
        }
    }

    /**
     * Completa el tutorial actual
     */
    completarTutorial() {
        if (this.tutorialActivo && !this.configuracionUsuario.tutorialesCompletados.includes(this.tutorialActivo)) {
            this.configuracionUsuario.tutorialesCompletados.push(this.tutorialActivo);
            this.configuracionUsuario.primerUso = false;
            this.guardarConfiguracionUsuario();
        }
        
        this.mostrarDialogo({
            titulo: '¡Tutorial Completado!',
            contenido: `
                <div class="tutorial-completion">
                    <p>Has completado exitosamente el tutorial de <strong>${this.tutorialesDisponibles[this.tutorialActivo]}</strong>.</p>
                    <p>¿Te gustaría realizar otro tutorial o comenzar a usar MAIRA?</p>
                </div>
            `,
            botones: [
                {
                    texto: 'Otro Tutorial',
                    clase: 'btn-primary',
                    accion: () => {
                        this.cerrarDialogo();
                        this.mostrarMenuTutoriales();
                    }
                },
                {
                    texto: 'Comenzar a Usar MAIRA',
                    clase: 'btn-secondary',
                    accion: () => {
                        this.cerrarDialogo();
                        this.cerrarTutorial();
                    }
                }
            ]
        });
    }

    /**
     * Cierra el tutorial actual
     */
    cerrarTutorial() {
        this.removerOverlay();
        this.removerTooltip();
        this.limpiarResaltados();
        
        this.tutorialActivo = null;
        this.pasoActual = 0;
        
        console.log('🎓 Tutorial cerrado');
    }

    /**
     * Crea overlay de tutorial
     */
    crearOverlay() {
        this.removerOverlay();
        
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            pointer-events: none;
        `;
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    /**
     * Remueve overlay
     */
    removerOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    /**
     * Remueve tooltip
     */
    removerTooltip() {
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    /**
     * Resalta un elemento específico
     */
    resaltarElemento(selector) {
        this.limpiarResaltados();
        
        const elemento = document.querySelector(selector);
        if (elemento) {
            elemento.classList.add('tutorial-highlight');
            elemento.style.position = 'relative';
            elemento.style.zIndex = '9999';
        }
    }

    /**
     * Limpia todos los resaltados
     */
    limpiarResaltados() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            el.style.zIndex = '';
            el.style.position = '';
        });
    }

    /**
     * Crea un diálogo modal
     */
    crearDialogo(config) {
        const dialogo = document.createElement('div');
        dialogo.className = 'tutorial-dialog';
        dialogo.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>${config.titulo}</h3>
                </div>
                <div class="dialog-body">
                    ${config.contenido}
                </div>
                <div class="dialog-footer">
                    ${config.botones.map(btn => 
                        `<button class="dialog-btn ${btn.clase}" data-action="${btn.accion}">${btn.texto}</button>`
                    ).join('')}
                </div>
            </div>
        `;
        
        // Agregar event listeners
        config.botones.forEach((btn, index) => {
            const botonEl = dialogo.querySelectorAll('.dialog-btn')[index];
            botonEl.addEventListener('click', btn.accion);
        });
        
        document.body.appendChild(dialogo);
        return dialogo;
    }

    /**
     * Cierra diálogo actual
     */
    cerrarDialogo() {
        const dialogo = document.querySelector('.tutorial-dialog');
        if (dialogo) {
            dialogo.remove();
        }
    }

    /**
     * Crear elementos UI necesarios
     */
    crearElementosUI() {
        // Agregar botón de ayuda/tutorial en la interfaz
        if (!document.getElementById('tutorial-help-btn')) {
            const botonAyuda = document.createElement('button');
            botonAyuda.id = 'tutorial-help-btn';
            botonAyuda.className = 'tutorial-help-button';
            botonAyuda.innerHTML = '🎓';
            botonAyuda.title = 'Tutoriales y Ayuda';
            botonAyuda.onclick = () => this.mostrarMenuTutoriales();
            
            // Posicionar en esquina superior derecha
            botonAyuda.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: var(--maira-primary, #2563eb);
                color: white;
                border: none;
                font-size: 20px;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(botonAyuda);
        }
        
        // Agregar estilos CSS
        this.agregarEstilosCSS();
    }

    /**
     * Agregar estilos CSS para tutorial
     */
    agregarEstilosCSS() {
        if (!document.getElementById('tutorial-styles')) {
            const style = document.createElement('style');
            style.id = 'tutorial-styles';
            style.textContent = `
                .tutorial-highlight {
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.5) !important;
                    border-radius: 4px !important;
                    background: rgba(37, 99, 235, 0.1) !important;
                }
                
                .tutorial-tooltip {
                    position: fixed;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    max-width: 350px;
                    z-index: 10000;
                    opacity: 0;
                    transform: scale(0.9);
                    transition: all 0.3s ease;
                }
                
                .tutorial-tooltip.show {
                    opacity: 1;
                    transform: scale(1);
                }
                
                .tooltip-header {
                    padding: 15px 15px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .tooltip-header h4 {
                    margin: 0;
                    color: var(--maira-primary, #2563eb);
                }
                
                .tooltip-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                }
                
                .tooltip-content {
                    padding: 15px;
                }
                
                .tooltip-content p {
                    margin: 0;
                    line-height: 1.5;
                    color: #333;
                }
                
                .tooltip-footer {
                    padding: 0 15px 15px;
                    border-top: 1px solid #eee;
                    padding-top: 15px;
                }
                
                .tutorial-progress {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 10px;
                }
                
                .tooltip-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .tooltip-buttons button {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .btn-next {
                    background: var(--maira-primary, #2563eb);
                    color: white;
                }
                
                .btn-prev {
                    background: #6b7280;
                    color: white;
                }
                
                .btn-skip {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .tutorial-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10001;
                }
                
                .dialog-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                }
                
                .dialog-content {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80%;
                    overflow-y: auto;
                }
                
                .dialog-header {
                    padding: 20px 20px 0;
                }
                
                .dialog-header h3 {
                    margin: 0;
                    color: var(--maira-primary, #2563eb);
                }
                
                .dialog-body {
                    padding: 20px;
                }
                
                .dialog-footer {
                    padding: 0 20px 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                }
                
                .dialog-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .btn-primary {
                    background: var(--maira-primary, #2563eb);
                    color: white;
                }
                
                .btn-secondary {
                    background: #6b7280;
                    color: white;
                }
                
                .btn-tertiary {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .tutorial-help-button:hover {
                    transform: scale(1.1);
                }
                
                .tutorial-menu {
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .tutorial-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                
                .tutorial-name {
                    font-weight: bold;
                }
                
                .tutorial-status {
                    font-size: 12px;
                    color: #666;
                }
                
                .btn-tutorial {
                    background: var(--maira-primary, #2563eb);
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Configurar eventos del sistema
     */
    configurarEventos() {
        // Escuchar eventos del sistema MAIRA
        if (window.MAIRA && window.MAIRA.Events) {
            // Mostrar tutorial específico según contexto
            window.MAIRA.Events.on('modo_cambiado', (data) => {
                if (this.configuracionUsuario.mostrarAyudas && !this.configuracionUsuario.tutorialesCompletados.includes(data.modo)) {
                    this.sugerirTutorial(data.modo);
                }
            });
        }
        
        // Tecla F1 para ayuda
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.mostrarMenuTutoriales();
            }
        });
    }

    /**
     * Sugiere tutorial contextual
     */
    sugerirTutorial(modo) {
        if (this.tutorialesDisponibles[modo]) {
            setTimeout(() => {
                const dialogo = this.crearDialogo({
                    titulo: 'Tutorial Disponible',
                    contenido: `¿Te gustaría ver el tutorial para ${this.tutorialesDisponibles[modo]}?`,
                    botones: [
                        {
                            texto: 'Sí, mostrar tutorial',
                            clase: 'btn-primary',
                            accion: () => {
                                this.cerrarDialogo();
                                this.iniciarTutorial(modo);
                            }
                        },
                        {
                            texto: 'No, gracias',
                            clase: 'btn-secondary',
                            accion: () => this.cerrarDialogo()
                        }
                    ]
                });
            }, 1000);
        }
    }

    /**
     * Funciones de demostración para tutorial
     */
    mostrarDemostracionClick() {
        console.log('🎓 Demostración: Click derecho en el mapa');
        // Simular demostración de click derecho
    }

    activarModoHexagono() {
        console.log('🎓 Activando modo hexágono para demostración');
        // Activar vista de hexágonos si existe
        if (window.HexGrid) {
            window.HexGrid.mostrarGrid();
        }
    }

    mostrarGestionCalcos() {
        console.log('🎓 Mostrando gestión de calcos');
        // Resaltar área de calcos
    }

    activarModoDibujoSector() {
        console.log('🎓 Activando modo dibujo de sector');
        // Activar herramienta de dibujo
    }

    activarModoZonasDespliegue() {
        console.log('🎓 Activando modo zonas de despliegue');
        // Activar herramienta de zonas
    }

    /**
     * Obtiene estadísticas del tutorial
     */
    obtenerEstadisticas() {
        return {
            tutorialActivo: this.tutorialActivo,
            pasoActual: this.pasoActual,
            tutorialesCompletados: this.configuracionUsuario.tutorialesCompletados.length,
            tutorialesDisponibles: Object.keys(this.tutorialesDisponibles).length,
            primerUso: this.configuracionUsuario.primerUso
        };
    }
}

// Singleton global
window.MAIRA = window.MAIRA || {};
window.MAIRA.InteractiveTutorialManager = new InteractiveTutorialManager();

console.log('[MAIRA] 🎓 Interactive Tutorial Manager cargado - Sistema de tutoriales paso a paso');
