/**
 * 📱 MAIRA Mobile Touch Manager
 * Gestión avanzada de touch para dispositivos móviles
 * Optimizada para elementos militares y mapas tácticos
 */

class MobileTouchManager {
    constructor() {
        this.touchTargetSize = 44; // Mínimo Apple/Google guidelines
        this.gestureThresholds = {
            tap: 300,        // ms
            doubleTap: 400,  // ms  
            longPress: 800,  // ms
            swipeDistance: 50, // px
            pinchThreshold: 10 // px
        };
        
        this.activeGestures = new Map();
        this.touchHistory = [];
        this.isEnabled = false;
        this.currentTouch = null;
        
        console.log('📱 MobileTouchManager initialized');
        this.initializeTouchManager();
    }

    /**
     * Inicializa el gestor de touch
     */
    initializeTouchManager() {
        // Detectar si es dispositivo móvil
        this.isMobile = this.detectMobileDevice();
        
        if (this.isMobile) {
            this.setupTouchHandlers();
            this.setupGestureRecognition();
            this.optimizeTouchTargets();
            this.setupHapticFeedback();
            this.isEnabled = true;
            
            console.log('✅ Mobile touch system enabled');
        } else {
            console.log('📱 Desktop device detected, touch system disabled');
        }
    }

    /**
     * Detecta si es dispositivo móvil
     * @returns {boolean} True si es móvil
     */
    detectMobileDevice() {
        const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUA = mobileUA.test(navigator.userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        
        return isMobileUA || (isTouchDevice && isSmallScreen);
    }

    /**
     * Configura manejadores de touch básicos
     */
    setupTouchHandlers() {
        // Configurar eventos touch para el documento
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

        // Configurar gesturestart/gesturechange para iOS
        document.addEventListener('gesturestart', this.handleGestureStart.bind(this), { passive: false });
        document.addEventListener('gesturechange', this.handleGestureChange.bind(this), { passive: false });
        document.addEventListener('gestureend', this.handleGestureEnd.bind(this), { passive: false });

        // Prevenir zoom por defecto
        this.preventDefaultZoom();
    }

    /**
     * Configura reconocimiento de gestos avanzados
     */
    setupGestureRecognition() {
        // Si Hammer.js está disponible, usarlo para gestos avanzados
        if (typeof Hammer !== 'undefined') {
            this.setupHammerJS();
        } else {
            // Implementación nativa de gestos básicos
            this.setupNativeGestures();
        }
    }

    /**
     * Configura Hammer.js si está disponible
     */
    setupHammerJS() {
        // Configurar Hammer.js para el body
        this.hammer = new Hammer(document.body);
        
        // Configurar reconocimiento multi-touch
        this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        this.hammer.get('pinch').set({ enable: true });
        this.hammer.get('rotate').set({ enable: true });
        
        // Configurar gestos específicos
        this.hammer.on('tap', this.handleTap.bind(this));
        this.hammer.on('doubletap', this.handleDoubleTap.bind(this));
        this.hammer.on('press', this.handleLongPress.bind(this));
        this.hammer.on('swipe', this.handleSwipe.bind(this));
        this.hammer.on('pan', this.handlePan.bind(this));
        this.hammer.on('pinch', this.handlePinch.bind(this));
        this.hammer.on('rotate', this.handleRotate.bind(this));

        console.log('📱 Hammer.js gestures configured');
    }

    /**
     * Configura gestos nativos básicos
     */
    setupNativeGestures() {
        this.gestureState = {
            startTime: 0,
            startPosition: { x: 0, y: 0 },
            currentPosition: { x: 0, y: 0 },
            isMoving: false,
            gestureType: null
        };

        console.log('📱 Native gestures configured');
    }

    /**
     * Maneja touchstart
     * @param {TouchEvent} event - Evento touch
     */
    handleTouchStart(event) {
        if (!this.isEnabled) return;

        const touch = event.touches[0];
        this.currentTouch = {
            id: touch.identifier,
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
            startTime: Date.now(),
            target: event.target
        };

        // Agregar al historial
        this.addToTouchHistory('start', touch);

        // Encontrar el target militar más cercano
        const militaryTarget = this.findNearestMilitaryTarget(touch.clientX, touch.clientY);
        if (militaryTarget) {
            this.currentTouch.militaryTarget = militaryTarget;
            this.highlightTarget(militaryTarget);
        }

        // Prevenir scroll si es en elemento interactivo
        if (this.isInteractiveElement(event.target)) {
            event.preventDefault();
        }
    }

    /**
     * Maneja touchmove
     * @param {TouchEvent} event - Evento touch
     */
    handleTouchMove(event) {
        if (!this.isEnabled || !this.currentTouch) return;

        const touch = this.findTouch(event.touches, this.currentTouch.id);
        if (!touch) return;

        // Actualizar posición
        this.currentTouch.currentX = touch.clientX;
        this.currentTouch.currentY = touch.clientY;

        // Calcular distancia
        const distance = this.calculateDistance(
            this.currentTouch.startX, this.currentTouch.startY,
            touch.clientX, touch.clientY
        );

        // Detectar movimiento significativo
        if (distance > 10) {
            this.currentTouch.isMoving = true;
            
            // Si hay target militar, manejar drag
            if (this.currentTouch.militaryTarget) {
                this.handleMilitaryElementDrag(touch);
            }
        }

        // Prevenir scroll en elementos militares
        if (this.currentTouch.militaryTarget || this.isInteractiveElement(event.target)) {
            event.preventDefault();
        }
    }

    /**
     * Maneja touchend
     * @param {TouchEvent} event - Evento touch
     */
    handleTouchEnd(event) {
        if (!this.isEnabled || !this.currentTouch) return;

        const duration = Date.now() - this.currentTouch.startTime;
        const distance = this.calculateDistance(
            this.currentTouch.startX, this.currentTouch.startY,
            this.currentTouch.currentX, this.currentTouch.currentY
        );

        // Determinar tipo de gesto
        this.determineGestureType(duration, distance);

        // Agregar al historial
        this.addToTouchHistory('end', {
            clientX: this.currentTouch.currentX,
            clientY: this.currentTouch.currentY
        });

        // Limpiar highlight
        if (this.currentTouch.militaryTarget) {
            this.removeTargetHighlight(this.currentTouch.militaryTarget);
        }

        // Limpiar estado
        this.currentTouch = null;
    }

    /**
     * Maneja touchcancel
     * @param {TouchEvent} event - Evento touch
     */
    handleTouchCancel(event) {
        if (this.currentTouch?.militaryTarget) {
            this.removeTargetHighlight(this.currentTouch.militaryTarget);
        }
        this.currentTouch = null;
    }

    /**
     * Determina el tipo de gesto realizado
     * @param {number} duration - Duración del touch
     * @param {number} distance - Distancia recorrida
     */
    determineGestureType(duration, distance) {
        if (!this.currentTouch) return;

        if (distance < 10) {
            // Tap o long press
            if (duration < this.gestureThresholds.tap) {
                this.executeTap();
            } else if (duration > this.gestureThresholds.longPress) {
                this.executeLongPress();
            }
        } else if (distance > this.gestureThresholds.swipeDistance) {
            // Swipe
            this.executeSwipe();
        }
    }

    /**
     * Ejecuta acción de tap
     */
    executeTap() {
        if (this.currentTouch.militaryTarget) {
            this.selectMilitaryElement(this.currentTouch.militaryTarget);
            this.triggerHapticFeedback('light');
        } else {
            // Tap en mapa
            this.handleMapTap(this.currentTouch.currentX, this.currentTouch.currentY);
        }

        // Emitir evento
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.emit('mobile:tap', {
                x: this.currentTouch.currentX,
                y: this.currentTouch.currentY,
                target: this.currentTouch.militaryTarget,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Ejecuta acción de long press
     */
    executeLongPress() {
        if (this.currentTouch.militaryTarget) {
            this.showMilitaryContextMenu(
                this.currentTouch.militaryTarget,
                this.currentTouch.currentX,
                this.currentTouch.currentY
            );
            this.triggerHapticFeedback('medium');
        } else {
            // Long press en mapa
            this.showMapContextMenu(this.currentTouch.currentX, this.currentTouch.currentY);
        }

        // Emitir evento
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.emit('mobile:longpress', {
                x: this.currentTouch.currentX,
                y: this.currentTouch.currentY,
                target: this.currentTouch.militaryTarget,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Ejecuta acción de swipe
     */
    executeSwipe() {
        const deltaX = this.currentTouch.currentX - this.currentTouch.startX;
        const deltaY = this.currentTouch.currentY - this.currentTouch.startY;
        
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }

        // Manejar swipe según dirección
        this.handleSwipeGesture(direction);

        // Emitir evento
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.emit('mobile:swipe', {
                direction,
                deltaX,
                deltaY,
                target: this.currentTouch.militaryTarget,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Encuentra el target militar más cercano
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {Element|null} Elemento más cercano
     */
    findNearestMilitaryTarget(x, y) {
        const militaryElements = document.querySelectorAll('.military-element, .leaflet-marker-icon, [data-military-element]');
        let nearest = null;
        let minDistance = Infinity;

        militaryElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const distance = this.calculateDistance(x, y, centerX, centerY);

            // Expandir área de touch para elementos pequeños
            const expandedTouchArea = Math.max(this.touchTargetSize, rect.width + 20);
            
            if (distance <= expandedTouchArea / 2 && distance < minDistance) {
                minDistance = distance;
                nearest = element;
            }
        });

        return nearest;
    }

    /**
     * Optimiza targets de touch para cumplir con guidelines
     */
    optimizeTouchTargets() {
        // Aplicar estilos CSS para mejorar touch targets
        const style = document.createElement('style');
        style.textContent = `
            /* Touch target optimization */
            .military-element,
            .leaflet-marker-icon,
            [data-military-element] {
                min-width: ${this.touchTargetSize}px !important;
                min-height: ${this.touchTargetSize}px !important;
                cursor: pointer;
                position: relative;
            }

            /* Pseudo-elemento para expandir área de touch */
            .military-element::before,
            .leaflet-marker-icon::before,
            [data-military-element]::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: ${this.touchTargetSize}px;
                min-height: ${this.touchTargetSize}px;
                z-index: -1;
            }

            /* Feedback visual para touch */
            .military-element.touch-highlighted {
                transform: scale(1.1);
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
                transition: all 0.2s ease;
            }

            /* Optimización para botones pequeños */
            .toolbar-btn,
            .control-btn,
            .map-control {
                min-width: ${this.touchTargetSize}px !important;
                min-height: ${this.touchTargetSize}px !important;
                padding: 8px;
                margin: 2px;
            }

            /* Menú contextual móvil */
            .mobile-context-menu {
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                border-radius: 8px;
                padding: 8px;
                z-index: 10000;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .mobile-context-menu .menu-item {
                display: block;
                padding: 12px 16px;
                min-height: ${this.touchTargetSize}px;
                border: none;
                background: transparent;
                color: white;
                text-align: left;
                cursor: pointer;
                border-radius: 4px;
                margin: 2px 0;
            }

            .mobile-context-menu .menu-item:active {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        
        document.head.appendChild(style);
        console.log('📱 Touch targets optimized');
    }

    /**
     * Configura feedback háptico
     */
    setupHapticFeedback() {
        // Verificar soporte para Vibration API
        this.supportsVibration = 'vibrate' in navigator;
        
        // Patrones de vibración
        this.hapticPatterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 50, 10],
            error: [50, 50, 50],
            selection: [5]
        };

        console.log(`📱 Haptic feedback ${this.supportsVibration ? 'enabled' : 'not available'}`);
    }

    /**
     * Trigger haptic feedback
     * @param {string} type - Tipo de feedback
     */
    triggerHapticFeedback(type = 'light') {
        if (!this.supportsVibration) return;

        const pattern = this.hapticPatterns[type] || this.hapticPatterns.light;
        
        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.warn('📱 Haptic feedback failed:', error);
        }
    }

    /**
     * Maneja tap en mapa
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    handleMapTap(x, y) {
        // Convertir coordenadas de pantalla a coordenadas de mapa
        if (window.mapa && window.mapa.containerPointToLatLng) {
            const latlng = window.mapa.containerPointToLatLng([x, y]);
            
            // Emitir evento de click en mapa
            if (window.MAIRA?.Events) {
                window.MAIRA.Events.emit('map:mobile:tap', {
                    latlng,
                    clientX: x,
                    clientY: y
                });
            }
        }
    }

    /**
     * Selecciona elemento militar
     * @param {Element} element - Elemento a seleccionar
     */
    selectMilitaryElement(element) {
        // Remover selección anterior
        document.querySelectorAll('.military-element.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Agregar selección
        element.classList.add('selected');

        // Obtener datos del elemento
        const elementData = this.extractElementData(element);

        // Emitir evento de selección
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.emit('element:mobile:selected', elementData);
        }

        // Actualizar estado global si existe
        if (window.MAIRA?.State) {
            window.MAIRA.State.actions.selectElement(elementData.id);
        }
    }

    /**
     * Muestra menú contextual para elemento militar
     * @param {Element} element - Elemento
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    showMilitaryContextMenu(element, x, y) {
        const elementData = this.extractElementData(element);
        
        const menu = document.createElement('div');
        menu.className = 'mobile-context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // Opciones del menú según tipo de elemento
        const menuOptions = this.getMilitaryMenuOptions(elementData);
        
        menuOptions.forEach(option => {
            const button = document.createElement('button');
            button.className = 'menu-item';
            button.textContent = option.label;
            button.onclick = () => {
                option.action(elementData);
                this.closeContextMenu(menu);
            };
            menu.appendChild(button);
        });

        // Agregar botón de cerrar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'menu-item';
        closeBtn.textContent = 'Cerrar';
        closeBtn.onclick = () => this.closeContextMenu(menu);
        menu.appendChild(closeBtn);

        document.body.appendChild(menu);

        // Auto-cerrar después de 10 segundos
        setTimeout(() => {
            if (menu.parentNode) {
                this.closeContextMenu(menu);
            }
        }, 10000);
    }

    /**
     * Obtiene opciones de menú para elemento militar
     * @param {Object} elementData - Datos del elemento
     * @returns {Array} Opciones del menú
     */
    getMilitaryMenuOptions(elementData) {
        const baseOptions = [
            {
                label: 'Seleccionar',
                action: (data) => this.selectMilitaryElement(elementData.element)
            },
            {
                label: 'Información',
                action: (data) => this.showElementInfo(data)
            }
        ];

        // Opciones adicionales según tipo
        if (elementData.type === 'unit') {
            baseOptions.push(
                {
                    label: 'Mover',
                    action: (data) => this.startMoveMode(data)
                },
                {
                    label: 'Atacar',
                    action: (data) => this.startAttackMode(data)
                }
            );
        }

        return baseOptions;
    }

    /**
     * Cierra menú contextual
     * @param {Element} menu - Elemento del menú
     */
    closeContextMenu(menu) {
        if (menu && menu.parentNode) {
            menu.style.opacity = '0';
            menu.style.transform = 'scale(0.8)';
            setTimeout(() => {
                if (menu.parentNode) {
                    menu.parentNode.removeChild(menu);
                }
            }, 200);
        }
    }

    /**
     * Extrae datos del elemento
     * @param {Element} element - Elemento DOM
     * @returns {Object} Datos del elemento
     */
    extractElementData(element) {
        return {
            element,
            id: element.dataset.elementId || element.id,
            type: element.dataset.elementType || 'unknown',
            name: element.dataset.elementName || element.title,
            position: element.getBoundingClientRect()
        };
    }

    /**
     * Resalta target
     * @param {Element} target - Target a resaltar
     */
    highlightTarget(target) {
        target.classList.add('touch-highlighted');
    }

    /**
     * Remueve resaltado
     * @param {Element} target - Target
     */
    removeTargetHighlight(target) {
        target.classList.remove('touch-highlighted');
    }

    /**
     * Verifica si es elemento interactivo
     * @param {Element} element - Elemento
     * @returns {boolean} Si es interactivo
     */
    isInteractiveElement(element) {
        const interactiveSelectors = [
            '.military-element',
            '.leaflet-marker-icon',
            '[data-military-element]',
            '.toolbar-btn',
            '.control-btn',
            '.map-control',
            'button',
            'input',
            'select',
            'textarea'
        ];

        return interactiveSelectors.some(selector => 
            element.matches(selector) || element.closest(selector)
        );
    }

    /**
     * Calcula distancia entre dos puntos
     * @param {number} x1 - X1
     * @param {number} y1 - Y1
     * @param {number} x2 - X2
     * @param {number} y2 - Y2
     * @returns {number} Distancia
     */
    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * Encuentra touch por ID
     * @param {TouchList} touches - Lista de touches
     * @param {number} id - ID del touch
     * @returns {Touch|null} Touch encontrado
     */
    findTouch(touches, id) {
        for (let i = 0; i < touches.length; i++) {
            if (touches[i].identifier === id) {
                return touches[i];
            }
        }
        return null;
    }

    /**
     * Agrega al historial de touch
     * @param {string} type - Tipo de evento
     * @param {Touch} touch - Touch event
     */
    addToTouchHistory(type, touch) {
        this.touchHistory.push({
            type,
            x: touch.clientX,
            y: touch.clientY,
            timestamp: Date.now()
        });

        // Mantener solo los últimos 100 eventos
        if (this.touchHistory.length > 100) {
            this.touchHistory.shift();
        }
    }

    /**
     * Previene zoom por defecto
     */
    preventDefaultZoom() {
        // Prevenir zoom con doble tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevenir zoom con gestos
        document.addEventListener('gesturestart', (event) => {
            event.preventDefault();
        });
    }

    /**
     * Habilita/deshabilita el touch manager
     * @param {boolean} enabled - Si habilitar
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`📱 Mobile touch ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Obtiene estadísticas de touch
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            isEnabled: this.isEnabled,
            isMobile: this.isMobile,
            supportsVibration: this.supportsVibration,
            touchTargetSize: this.touchTargetSize,
            recentTouches: this.touchHistory.slice(-10),
            activeGestures: this.activeGestures.size
        };
    }
}

// Inicializar MobileTouchManager globalmente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.MobileTouch = new MobileTouchManager();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileTouchManager;
}

console.log('📱 MAIRA Mobile Touch Manager loaded and active');
