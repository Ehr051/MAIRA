/**
 * MAIRA - Sistema Avanzado de Detección Móvil y Gestos Táctiles
 * Optimizado para dispositivos móviles, tablets y desktop
 */

class MAIRAMobileOptimizer {
    constructor() {
        this.deviceInfo = this.detectDeviceCapabilities();
        this.gestureHandlers = new Map();
        this.touchStartTime = 0;
        this.touchStartPosition = { x: 0, y: 0 };
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Detección avanzada de capacidades del dispositivo
     */
    detectDeviceCapabilities() {
        const userAgent = navigator.userAgent.toLowerCase();
        const devicePixelRatio = window.devicePixelRatio || 1;
        const screenWidth = screen.width;
        const screenHeight = screen.height;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        return {
            // Detección de tipo de dispositivo
            isMobile: /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent),
            isTablet: /ipad|android(?!.*mobile)|kindle|silk/i.test(userAgent) || 
                     (windowWidth >= 768 && windowWidth <= 1024),
            isDesktop: windowWidth > 1024,
            
            // Características específicas
            isIOS: /ipad|iphone|ipod/i.test(userAgent),
            isAndroid: /android/i.test(userAgent),
            
            // Capacidades táctiles
            hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            hasHover: window.matchMedia('(hover: hover)').matches,
            hasPointerCoarse: window.matchMedia('(pointer: coarse)').matches,
            
            // Información de pantalla
            screenWidth,
            screenHeight,
            windowWidth,
            windowHeight,
            devicePixelRatio,
            
            // Capacidades de red
            hasSlowConnection: navigator.connection?.effectiveType === '2g' || 
                              navigator.connection?.effectiveType === 'slow-2g',
            
            // Performance
            hardwareConcurrency: navigator.hardwareConcurrency || 2,
            memoryLimit: navigator.deviceMemory || 2
        };
    }

    /**
     * Inicialización del optimizador móvil
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('🔥 MAIRA Mobile Optimizer iniciado:', this.deviceInfo);
        
        // Configurar viewport dinámico
        this.setupDynamicViewport();
        
        // Aplicar optimizaciones específicas del dispositivo
        this.applyDeviceOptimizations();
        
        // Configurar gestos táctiles avanzados
        this.setupAdvancedGestures();
        
        // Optimizar rendimiento
        this.optimizePerformance();
        
        // Configurar manejo de orientación
        this.setupOrientationHandling();
        
        // Aplicar tema móvil si es necesario
        this.applyMobileTheme();
        
        this.isInitialized = true;
        
        // Emitir evento de inicialización completa
        window.dispatchEvent(new CustomEvent('maira:mobile:ready', { 
            detail: this.deviceInfo 
        }));
    }

    /**
     * Configuración dinámica del viewport
     */
    setupDynamicViewport() {
        if (this.deviceInfo.isMobile || this.deviceInfo.isTablet) {
            let viewport = document.querySelector('meta[name="viewport"]');
            
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
            }
            
            // Configuración específica para iOS
            if (this.deviceInfo.isIOS) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no';
            } else {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            }
        }
    }

    /**
     * Aplicar optimizaciones específicas por dispositivo
     */
    applyDeviceOptimizations() {
        const deviceClass = this.deviceInfo.isMobile ? 'mobile' : 
                           this.deviceInfo.isTablet ? 'tablet' : 'desktop';
        
        document.body.classList.add(`device-${deviceClass}`);
        
        if (this.deviceInfo.hasTouch) {
            document.body.classList.add('touch-device');
        }
        
        if (!this.deviceInfo.hasHover) {
            document.body.classList.add('no-hover');
        }
        
        if (this.deviceInfo.hasSlowConnection) {
            document.body.classList.add('slow-connection');
        }
        
        // Configurar variables CSS dinámicas
        document.documentElement.style.setProperty('--device-pixel-ratio', this.deviceInfo.devicePixelRatio);
        document.documentElement.style.setProperty('--screen-width', `${this.deviceInfo.screenWidth}px`);
        document.documentElement.style.setProperty('--screen-height', `${this.deviceInfo.screenHeight}px`);
        document.documentElement.style.setProperty('--window-width', `${this.deviceInfo.windowWidth}px`);
        document.documentElement.style.setProperty('--window-height', `${this.deviceInfo.windowHeight}px`);
    }

    /**
     * Configuración de gestos táctiles avanzados
     */
    setupAdvancedGestures() {
        if (!this.deviceInfo.hasTouch) return;
        
        let hammer;
        
        // Verificar si Hammer.js está disponible
        if (typeof Hammer !== 'undefined') {
            hammer = new Hammer(document.body);
            
            // Configurar gestos específicos
            hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
            hammer.get('pinch').set({ enable: true });
            hammer.get('rotate').set({ enable: true });
            
            // Swipe para navegación
            hammer.on('swipeleft', (e) => this.handleSwipe('left', e));
            hammer.on('swiperight', (e) => this.handleSwipe('right', e));
            hammer.on('swipeup', (e) => this.handleSwipe('up', e));
            hammer.on('swipedown', (e) => this.handleSwipe('down', e));
            
            // Pinch para zoom
            hammer.on('pinchstart pinchend', (e) => this.handlePinch(e));
            
            // Doble tap
            hammer.on('doubletap', (e) => this.handleDoubleTap(e));
            
        } else {
            // Fallback a gestos básicos
            this.setupBasicTouchGestures();
        }
        
        // Prevenir comportamientos por defecto no deseados
        this.preventDefaultTouchBehaviors();
    }

    /**
     * Gestos básicos sin librerías externas
     */
    setupBasicTouchGestures() {
        let touchStartX, touchStartY, touchStartTime;
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            this.touchStartTime = touchStartTime;
            this.touchStartPosition = { x: touchStartX, y: touchStartY };
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            const touchEndTime = Date.now();
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = touchEndTime - touchStartTime;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Detectar swipe
            if (distance > 50 && deltaTime < 300) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.handleSwipe(deltaX > 0 ? 'right' : 'left', { originalEvent: e });
                } else {
                    this.handleSwipe(deltaY > 0 ? 'down' : 'up', { originalEvent: e });
                }
            }
            
            // Detectar tap rápido (posible doble tap)
            if (distance < 10 && deltaTime < 300) {
                setTimeout(() => {
                    this.handleDoubleTap({ originalEvent: e });
                }, 10);
            }
            
            touchStartX = null;
            touchStartY = null;
        }, { passive: true });
    }

    /**
     * Manejo de swipe gestures
     */
    handleSwipe(direction, event) {
        console.log(`🔄 Swipe detectado: ${direction}`);
        
        // Emitir evento personalizado
        window.dispatchEvent(new CustomEvent('maira:gesture:swipe', {
            detail: { direction, originalEvent: event }
        }));
        
        // Lógica específica por dirección
        switch (direction) {
            case 'left':
                // Cerrar panel lateral si está abierto
                this.closeSidePanel();
                break;
            case 'right':
                // Abrir panel lateral
                this.openSidePanel();
                break;
            case 'up':
                // Minimizar elementos flotantes
                this.minimizeFloatingElements();
                break;
            case 'down':
                // Expandir elementos flotantes
                this.expandFloatingElements();
                break;
        }
    }

    /**
     * Manejo de doble tap
     */
    handleDoubleTap(event) {
        console.log('👆 Doble tap detectado');
        
        const target = event.originalEvent?.target || event.target;
        
        // Zoom en el mapa si es doble tap en área de mapa
        if (target.closest('#map, .leaflet-container')) {
            this.handleMapDoubleTap(event);
        }
        
        window.dispatchEvent(new CustomEvent('maira:gesture:doubletap', {
            detail: { originalEvent: event }
        }));
    }

    /**
     * Manejo de pinch gestures
     */
    handlePinch(event) {
        console.log('🤏 Pinch detectado:', event.type);
        
        window.dispatchEvent(new CustomEvent('maira:gesture:pinch', {
            detail: { type: event.type, scale: event.scale, originalEvent: event }
        }));
    }

    /**
     * Prevenir comportamientos táctiles no deseados
     */
    preventDefaultTouchBehaviors() {
        // Prevenir zoom por pinch en toda la página (excepto en el mapa)
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1 && !e.target.closest('.leaflet-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevenir scroll elástico en iOS
        if (this.deviceInfo.isIOS) {
            document.addEventListener('touchmove', (e) => {
                if (e.target.closest('body') && !e.target.closest('.scrollable')) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // Prevenir menú contextual en touch prolongado
        document.addEventListener('contextmenu', (e) => {
            if (this.deviceInfo.hasTouch) {
                e.preventDefault();
            }
        });
    }

    /**
     * Optimizaciones de rendimiento
     */
    optimizePerformance() {
        if (this.deviceInfo.isMobile || this.deviceInfo.hasSlowConnection) {
            // Reducir animaciones
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
            document.documentElement.style.setProperty('--transition-duration', '0.1s');
            
            // Lazy loading para imágenes
            this.setupLazyLoading();
            
            // Throttle de eventos de scroll y resize
            this.setupEventThrottling();
        }
    }

    /**
     * Configurar lazy loading
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Throttling de eventos
     */
    setupEventThrottling() {
        let scrollTimeout, resizeTimeout;
        
        const throttledScroll = () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('maira:scroll:throttled'));
                scrollTimeout = null;
            }, 100);
        };
        
        const throttledResize = () => {
            if (resizeTimeout) return;
            resizeTimeout = setTimeout(() => {
                this.handleResize();
                resizeTimeout = null;
            }, 250);
        };
        
        window.addEventListener('scroll', throttledScroll, { passive: true });
        window.addEventListener('resize', throttledResize, { passive: true });
    }

    /**
     * Manejo de cambios de orientación
     */
    setupOrientationHandling() {
        const handleOrientationChange = () => {
            setTimeout(() => {
                // Actualizar información del dispositivo
                this.deviceInfo = this.detectDeviceCapabilities();
                
                // Reconfigurar viewport
                this.setupDynamicViewport();
                
                // Ajustar elementos según nueva orientación
                this.adjustForOrientation();
                
                console.log('📱 Orientación cambiada:', this.deviceInfo);
                
                window.dispatchEvent(new CustomEvent('maira:orientation:changed', {
                    detail: this.deviceInfo
                }));
            }, 100);
        };
        
        window.addEventListener('orientationchange', handleOrientationChange);
        screen.orientation?.addEventListener('change', handleOrientationChange);
    }

    /**
     * Ajustar elementos para la orientación actual
     */
    adjustForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
        
        // Ajustar paneles en landscape
        if (isLandscape && this.deviceInfo.isMobile) {
            this.adjustPanelsForLandscape();
        }
    }

    /**
     * Aplicar tema móvil
     */
    applyMobileTheme() {
        if (this.deviceInfo.isMobile || this.deviceInfo.isTablet) {
            document.body.classList.add('mobile-theme');
            
            // Aumentar contraste en pantallas pequeñas
            if (this.deviceInfo.isMobile) {
                document.documentElement.style.setProperty('--contrast-boost', '1.2');
            }
        }
    }

    /**
     * Métodos de utilidad para gestos
     */
    closeSidePanel() {
        const panel = document.querySelector('.panel-lateral:not(.oculto)');
        if (panel) {
            panel.classList.add('oculto');
        }
    }

    openSidePanel() {
        const panel = document.querySelector('.panel-lateral.oculto');
        if (panel) {
            panel.classList.remove('oculto');
        }
    }

    minimizeFloatingElements() {
        document.querySelectorAll('.medicion-display, .coordenadas-display').forEach(el => {
            el.style.opacity = '0.3';
        });
    }

    expandFloatingElements() {
        document.querySelectorAll('.medicion-display, .coordenadas-display').forEach(el => {
            el.style.opacity = '1';
        });
    }

    handleMapDoubleTap(event) {
        if (window.map && typeof window.map.zoomIn === 'function') {
            window.map.zoomIn();
        }
    }

    adjustPanelsForLandscape() {
        const panels = document.querySelectorAll('.panel-lateral');
        panels.forEach(panel => {
            panel.style.height = '70vh';
            panel.style.width = '50%';
        });
    }

    handleResize() {
        this.deviceInfo = this.detectDeviceCapabilities();
        this.applyDeviceOptimizations();
        
        window.dispatchEvent(new CustomEvent('maira:resize:complete', {
            detail: this.deviceInfo
        }));
    }

    /**
     * API pública
     */
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    isMobileDevice() {
        return this.deviceInfo.isMobile;
    }

    isTabletDevice() {
        return this.deviceInfo.isTablet;
    }

    hasTouchCapability() {
        return this.deviceInfo.hasTouch;
    }

    registerGestureHandler(gestureType, handler) {
        if (!this.gestureHandlers.has(gestureType)) {
            this.gestureHandlers.set(gestureType, []);
        }
        this.gestureHandlers.get(gestureType).push(handler);
    }
}

// Inicialización automática cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MAIRAMobile = new MAIRAMobileOptimizer();
    });
} else {
    window.MAIRAMobile = new MAIRAMobileOptimizer();
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAIRAMobileOptimizer;
}
