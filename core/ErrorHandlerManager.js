/**
 * ⚡ MAIRA Error Handler Manager
 * Sistema comprehensivo de manejo de errores
 * Logging, recovery y notificaciones de errores
 */

class ErrorHandlerManager {
    constructor() {
        this.errorQueue = [];
        this.errorStats = {
            total: 0,
            byType: new Map(),
            bySource: new Map(),
            critical: 0
        };
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.errorCallbacks = new Map();
        
        console.log('⚡ ErrorHandlerManager initialized');
        this.initializeErrorHandling();
    }

    /**
     * Inicializa el sistema de manejo de errores
     */
    initializeErrorHandling() {
        // Interceptar errores globales de JavaScript
        this.setupGlobalErrorHandling();
        
        // Interceptar errores de promesas no manejadas
        this.setupUnhandledPromiseRejection();
        
        // Interceptar errores de recursos
        this.setupResourceErrorHandling();
        
        // Configurar notificación de errores
        this.setupErrorNotification();
        
        console.log('✅ Global error handling active');
    }

    /**
     * Configura manejo global de errores JavaScript
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        });

        // También interceptar errores de console.error para logging
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.handleError({
                type: 'console',
                message: args.join(' '),
                args: args,
                stack: new Error().stack,
                timestamp: new Date().toISOString()
            });
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Configura manejo de promesas rechazadas no manejadas
     */
    setupUnhandledPromiseRejection() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'unhandled_promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                reason: event.reason,
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                promise: event.promise
            });

            // Prevenir que aparezca en la consola (ya lo manejamos nosotros)
            event.preventDefault();
        });
    }

    /**
     * Configura manejo de errores de recursos (imágenes, scripts, etc.)
     */
    setupResourceErrorHandling() {
        document.addEventListener('error', (event) => {
            if (event.target && event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    src: event.target.src || event.target.href,
                    timestamp: new Date().toISOString()
                });
            }
        }, true); // Use capture phase
    }

    /**
     * Maneja un error específico
     * @param {Object} errorInfo - Información del error
     */
    handleError(errorInfo) {
        // Incrementar estadísticas
        this.errorStats.total++;
        this.errorStats.byType.set(
            errorInfo.type,
            (this.errorStats.byType.get(errorInfo.type) || 0) + 1
        );
        
        if (errorInfo.filename || errorInfo.src) {
            const source = errorInfo.filename || errorInfo.src || 'unknown';
            this.errorStats.bySource.set(
                source,
                (this.errorStats.bySource.get(source) || 0) + 1
            );
        }

        // Determinar severidad
        const severity = this.determineSeverity(errorInfo);
        errorInfo.severity = severity;

        if (severity === 'critical') {
            this.errorStats.critical++;
        }

        // Agregar a la cola de errores
        this.errorQueue.push(errorInfo);

        // Mantener solo los últimos 100 errores
        if (this.errorQueue.length > 100) {
            this.errorQueue.shift();
        }

        // Log del error
        this.logError(errorInfo);

        // Intentar recovery automático si es posible
        this.attemptErrorRecovery(errorInfo);

        // Notificar a callbacks registrados
        this.notifyErrorCallbacks(errorInfo);

        // Enviar a servidor si es crítico
        if (severity === 'critical') {
            this.reportCriticalError(errorInfo);
        }
    }

    /**
     * Determina la severidad del error
     * @param {Object} errorInfo - Información del error
     * @returns {string} Nivel de severidad
     */
    determineSeverity(errorInfo) {
        // Errores críticos
        const criticalPatterns = [
            /socket.*disconnect/i,
            /database.*connection/i,
            /authentication.*failed/i,
            /cannot read prop.*undefined/i,
            /network.*error/i,
            /cors/i
        ];

        // Errores de advertencia
        const warningPatterns = [
            /deprecated/i,
            /console\.warn/i,
            /404/i,
            /resource.*not.*found/i
        ];

        const message = errorInfo.message || '';

        if (criticalPatterns.some(pattern => pattern.test(message))) {
            return 'critical';
        }

        if (warningPatterns.some(pattern => pattern.test(message))) {
            return 'warning';
        }

        // Por defecto es error normal
        return 'error';
    }

    /**
     * Log estructurado del error
     * @param {Object} errorInfo - Información del error
     */
    logError(errorInfo) {
        const logLevel = errorInfo.severity === 'critical' ? 'error' : 
                        errorInfo.severity === 'warning' ? 'warn' : 'log';

        const logMessage = `⚡ ${errorInfo.severity.toUpperCase()}: ${errorInfo.message}`;
        
        console[logLevel](logMessage, {
            type: errorInfo.type,
            timestamp: errorInfo.timestamp,
            stack: errorInfo.stack,
            additionalInfo: {
                url: errorInfo.url,
                line: errorInfo.lineno,
                column: errorInfo.colno,
                source: errorInfo.filename || errorInfo.src
            }
        });
    }

    /**
     * Intenta recuperación automática del error
     * @param {Object} errorInfo - Información del error
     */
    attemptErrorRecovery(errorInfo) {
        const errorKey = `${errorInfo.type}_${errorInfo.message}`;
        const attempts = this.retryAttempts.get(errorKey) || 0;

        if (attempts >= this.maxRetries) {
            console.warn(`⚡ Max retry attempts reached for error: ${errorInfo.message}`);
            return;
        }

        // Estrategias de recovery específicas
        switch (errorInfo.type) {
            case 'resource':
                this.recoverResourceError(errorInfo);
                break;
            case 'javascript':
                this.recoverJavaScriptError(errorInfo);
                break;
            case 'unhandled_promise':
                this.recoverPromiseError(errorInfo);
                break;
        }

        this.retryAttempts.set(errorKey, attempts + 1);
    }

    /**
     * Recuperación de errores de recursos
     * @param {Object} errorInfo - Información del error
     */
    recoverResourceError(errorInfo) {
        if (errorInfo.src && errorInfo.element === 'IMG') {
            // Intentar recargar imagen con timestamp para evitar cache
            setTimeout(() => {
                const img = document.querySelector(`img[src="${errorInfo.src}"]`);
                if (img) {
                    const newSrc = errorInfo.src + (errorInfo.src.includes('?') ? '&' : '?') + 
                                  `retry=${Date.now()}`;
                    img.src = newSrc;
                    console.log(`⚡ Retrying image load: ${newSrc}`);
                }
            }, 1000);
        }
    }

    /**
     * Recuperación de errores JavaScript
     * @param {Object} errorInfo - Información del error
     */
    recoverJavaScriptError(errorInfo) {
        // Si es un error de variable no definida, intentar inicializarla
        if (errorInfo.message.includes('is not defined')) {
            const variableName = errorInfo.message.match(/(\w+) is not defined/)?.[1];
            if (variableName && !window[variableName]) {
                console.log(`⚡ Attempting to recover undefined variable: ${variableName}`);
                // Estrategias específicas según la variable
                this.initializeMissingVariable(variableName);
            }
        }
    }

    /**
     * Inicializa variables faltantes comunes
     * @param {string} variableName - Nombre de la variable
     */
    initializeMissingVariable(variableName) {
        const recoveryStrategies = {
            'mapa': () => {
                console.log('⚡ Initializing missing map variable');
                window.mapa = null; // Will be properly initialized later
            },
            'socket': () => {
                console.log('⚡ Initializing missing socket variable');
                // Don't auto-initialize socket, just prevent errors
                window.socket = null;
            },
            'gestorJuego': () => {
                console.log('⚡ Initializing missing gestorJuego variable');
                window.gestorJuego = null;
            }
        };

        const strategy = recoveryStrategies[variableName];
        if (strategy) {
            try {
                strategy();
                console.log(`⚡ Successfully recovered variable: ${variableName}`);
            } catch (recoveryError) {
                console.error(`⚡ Failed to recover variable ${variableName}:`, recoveryError);
            }
        }
    }

    /**
     * Recuperación de errores de promesas
     * @param {Object} errorInfo - Información del error
     */
    recoverPromiseError(errorInfo) {
        // Log adicional para promesas no manejadas
        console.warn('⚡ Unhandled promise rejection detected, consider adding .catch()');
        
        // Si es un error de red, intentar reconexión
        if (errorInfo.reason?.message?.includes('fetch') || 
            errorInfo.reason?.message?.includes('network')) {
            this.attemptNetworkRecovery();
        }
    }

    /**
     * Intenta recuperación de red
     */
    attemptNetworkRecovery() {
        console.log('⚡ Attempting network recovery...');
        
        // Verificar conectividad
        if (navigator.onLine) {
            // Intentar ping al servidor
            fetch('/api/health', { method: 'HEAD' })
                .then(() => {
                    console.log('⚡ Network recovery successful');
                    this.notifyNetworkRecovery();
                })
                .catch(() => {
                    console.warn('⚡ Network recovery failed');
                });
        } else {
            console.warn('⚡ Device is offline');
        }
    }

    /**
     * Notifica recuperación de red
     */
    notifyNetworkRecovery() {
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.emit('network:recovered');
        }
    }

    /**
     * Configura sistema de notificación de errores
     */
    setupErrorNotification() {
        // Mostrar notificaciones críticas al usuario
        this.registerErrorCallback('critical', (errorInfo) => {
            this.showUserNotification({
                type: 'error',
                title: 'Error Crítico',
                message: 'Se ha producido un error. La aplicación intentará recuperarse automáticamente.',
                timeout: 5000
            });
        });
    }

    /**
     * Registra callback para tipos específicos de errores
     * @param {string} errorType - Tipo de error
     * @param {Function} callback - Función callback
     */
    registerErrorCallback(errorType, callback) {
        if (!this.errorCallbacks.has(errorType)) {
            this.errorCallbacks.set(errorType, []);
        }
        this.errorCallbacks.get(errorType).push(callback);
    }

    /**
     * Notifica a callbacks registrados
     * @param {Object} errorInfo - Información del error
     */
    notifyErrorCallbacks(errorInfo) {
        const callbacks = this.errorCallbacks.get(errorInfo.severity) || [];
        callbacks.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (callbackError) {
                console.error('⚡ Error in error callback:', callbackError);
            }
        });
    }

    /**
     * Muestra notificación al usuario
     * @param {Object} notification - Datos de la notificación
     */
    showUserNotification(notification) {
        // Crear notificación visual
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.type}`;
        notificationEl.innerHTML = `
            <div class="notification-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;

        // Estilos inline para no depender de CSS externo
        notificationEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 300px;
            background: ${notification.type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        // Agregar al DOM
        document.body.appendChild(notificationEl);

        // Configurar cierre automático
        const closeNotification = () => {
            notificationEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notificationEl.parentNode) {
                    notificationEl.parentNode.removeChild(notificationEl);
                }
            }, 300);
        };

        // Botón de cierre
        notificationEl.querySelector('.notification-close').addEventListener('click', closeNotification);

        // Auto-close
        if (notification.timeout) {
            setTimeout(closeNotification, notification.timeout);
        }
    }

    /**
     * Reporta errores críticos al servidor
     * @param {Object} errorInfo - Información del error
     */
    reportCriticalError(errorInfo) {
        if (window.MAIRA?.Security?.secureSocket) {
            try {
                window.MAIRA.Security.secureSocket.emit('critical_error', {
                    error: errorInfo,
                    sessionId: this.getSessionId(),
                    timestamp: errorInfo.timestamp
                });
            } catch (reportError) {
                console.error('⚡ Failed to report critical error:', reportError);
            }
        }
    }

    /**
     * Obtiene ID de sesión
     * @returns {string} ID de sesión
     */
    getSessionId() {
        return sessionStorage.getItem('sessionId') || 'unknown';
    }

    /**
     * Obtiene estadísticas de errores
     * @returns {Object} Estadísticas
     */
    getErrorStats() {
        return {
            ...this.errorStats,
            recentErrors: this.errorQueue.slice(-10),
            byType: Object.fromEntries(this.errorStats.byType),
            bySource: Object.fromEntries(this.errorStats.bySource)
        };
    }

    /**
     * Limpia estadísticas de errores
     */
    clearErrorStats() {
        this.errorQueue = [];
        this.errorStats = {
            total: 0,
            byType: new Map(),
            bySource: new Map(),
            critical: 0
        };
        this.retryAttempts.clear();
        console.log('⚡ Error stats cleared');
    }

    /**
     * Wrapper para funciones async con manejo de errores
     * @param {Function} asyncFunction - Función async
     * @param {string} context - Contexto de la función
     * @returns {Function} Función wrapper
     */
    wrapAsync(asyncFunction, context = 'async operation') {
        return async (...args) => {
            try {
                return await asyncFunction(...args);
            } catch (error) {
                this.handleError({
                    type: 'wrapped_async',
                    message: `Error in ${context}: ${error.message}`,
                    stack: error.stack,
                    context,
                    timestamp: new Date().toISOString(),
                    originalError: error
                });
                throw error; // Re-throw after logging
            }
        };
    }
}

// Inicializar ErrorHandlerManager globalmente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.ErrorHandler = new ErrorHandlerManager();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandlerManager;
}

console.log('⚡ MAIRA Error Handler Manager loaded and active');
