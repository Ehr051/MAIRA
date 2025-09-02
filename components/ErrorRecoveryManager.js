/**
 * MAIRA Error Recovery Manager
 * Sistema robusto de manejo y recuperación de errores
 * Implementa patrones de recuperación automática y logging detallado
 */

class ErrorRecoveryManager {
    constructor() {
        this.errorHandlers = new Map();
        this.recoveryStrategies = new Map();
        this.errorHistory = [];
        this.recoveryAttempts = new Map();
        this.criticalErrors = new Set();
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 segundo inicial
        
        this.initializeErrorHandlers();
        this.initializeRecoveryStrategies();
        this.setupGlobalErrorHandling();
        
        console.log('[ErrorRecoveryManager] Sistema de recuperación de errores inicializado');
    }

    /**
     * Inicializa manejadores de errores específicos
     */
    initializeErrorHandlers() {
        // Errores de conexión de red
        this.errorHandlers.set('NetworkError', {
            classify: (error) => error.name === 'NetworkError' || 
                                error.message.includes('fetch') ||
                                error.message.includes('network'),
            severity: 'medium',
            autoRecover: true,
            maxRetries: 5
        });

        // Errores de archivos TIF
        this.errorHandlers.set('TIFError', {
            classify: (error) => error.message.includes('TIF') ||
                                error.message.includes('elevation') ||
                                error.message.includes('GDAL'),
            severity: 'high',
            autoRecover: true,
            maxRetries: 3
        });

        // Errores de coordenadas
        this.errorHandlers.set('CoordinateError', {
            classify: (error) => error.message.includes('coordinate') ||
                                error.message.includes('latitude') ||
                                error.message.includes('longitude'),
            severity: 'medium',
            autoRecover: true,
            maxRetries: 2
        });

        // Errores de memoria
        this.errorHandlers.set('MemoryError', {
            classify: (error) => error.name === 'RangeError' ||
                                error.message.includes('memory') ||
                                error.message.includes('Maximum call stack'),
            severity: 'critical',
            autoRecover: true,
            maxRetries: 1
        });

        // Errores de símbolos militares
        this.errorHandlers.set('SymbolError', {
            classify: (error) => error.message.includes('symbol') ||
                                error.message.includes('milsymbol') ||
                                error.message.includes('military'),
            severity: 'medium',
            autoRecover: true,
            maxRetries: 3
        });

        // Errores de base de datos
        this.errorHandlers.set('DatabaseError', {
            classify: (error) => error.message.includes('database') ||
                                error.message.includes('SQL') ||
                                error.message.includes('connection'),
            severity: 'critical',
            autoRecover: true,
            maxRetries: 3
        });

        // Errores de partida/gaming
        this.errorHandlers.set('GameError', {
            classify: (error) => error.message.includes('partida') ||
                                error.message.includes('game') ||
                                error.message.includes('participante'),
            severity: 'high',
            autoRecover: true,
            maxRetries: 2
        });
    }

    /**
     * Inicializa estrategias de recuperación
     */
    initializeRecoveryStrategies() {
        // Estrategia para errores de red
        this.recoveryStrategies.set('NetworkError', async (error, context) => {
            console.log('[ErrorRecovery] Intentando recuperación de error de red...');
            
            // Verificar conectividad
            if (!navigator.onLine) {
                await this.waitForConnection();
            }

            // Retry con backoff exponencial
            const delay = this.retryDelay * Math.pow(2, context.attemptCount || 0);
            await this.delay(delay);

            // Reintentar la operación original
            if (context.originalOperation) {
                return await context.originalOperation();
            }
        });

        // Estrategia para errores de TIF
        this.recoveryStrategies.set('TIFError', async (error, context) => {
            console.log('[ErrorRecovery] Intentando recuperación de error TIF...');
            
            // Intentar con resolución menor
            if (context.tifOptions && context.tifOptions.resolution) {
                context.tifOptions.resolution *= 0.5; // Reducir resolución
                console.log(`[ErrorRecovery] Reduciendo resolución TIF a ${context.tifOptions.resolution}`);
            }

            // Limpiar cache de TIF
            if (window.MAIRA && window.MAIRA.MemoryManager) {
                window.MAIRA.MemoryManager.clearObjectType('tifData');
            }

            // Reintentar operación
            if (context.originalOperation) {
                return await context.originalOperation(context.tifOptions);
            }
        });

        // Estrategia para errores de memoria
        this.recoveryStrategies.set('MemoryError', async (error, context) => {
            console.log('[ErrorRecovery] Iniciando recuperación de error de memoria...');
            
            // Limpiar memoria agresivamente
            if (window.MAIRA && window.MAIRA.MemoryManager) {
                window.MAIRA.MemoryManager.emergencyCleanup();
            }

            // Reducir calidad/resolución si es posible
            if (context.qualityLevel && context.qualityLevel > 1) {
                context.qualityLevel = Math.max(1, context.qualityLevel - 1);
                console.log(`[ErrorRecovery] Reduciendo nivel de calidad a ${context.qualityLevel}`);
            }

            await this.delay(2000); // Esperar a que se libere memoria

            if (context.originalOperation) {
                return await context.originalOperation(context);
            }
        });

        // Estrategia para errores de coordenadas
        this.recoveryStrategies.set('CoordinateError', async (error, context) => {
            console.log('[ErrorRecovery] Corrigiendo error de coordenadas...');
            
            // Validar y corregir coordenadas
            if (context.coordinates) {
                context.coordinates = this.validateAndCorrectCoordinates(context.coordinates);
            }

            if (context.originalOperation) {
                return await context.originalOperation(context.coordinates);
            }
        });

        // Estrategia para errores de símbolos
        this.recoveryStrategies.set('SymbolError', async (error, context) => {
            console.log('[ErrorRecovery] Recuperando error de símbolo militar...');
            
            // Usar símbolo por defecto si falla el específico
            if (context.symbolType) {
                context.symbolType = 'default';
                console.log('[ErrorRecovery] Usando símbolo por defecto');
            }

            // Limpiar cache de símbolos
            if (window.MAIRA && window.MAIRA.MemoryManager) {
                window.MAIRA.MemoryManager.clearObjectType('symbols');
            }

            if (context.originalOperation) {
                return await context.originalOperation(context);
            }
        });
    }

    /**
     * Configura manejo global de errores
     */
    setupGlobalErrorHandling() {
        // Errores JavaScript no capturados
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                type: 'uncaught',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandled_promise',
                promise: event.promise
            });
        });

        // Interceptar errores de fetch
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            } catch (error) {
                return this.handleError(error, {
                    type: 'fetch',
                    url: args[0],
                    options: args[1]
                });
            }
        };
    }

    /**
     * Maneja cualquier error y intenta recuperación
     */
    async handleError(error, context = {}) {
        const errorId = this.generateErrorId();
        const timestamp = new Date().toISOString();
        
        // Clasificar el error
        const classification = this.classifyError(error);
        
        // Crear registro de error
        const errorRecord = {
            id: errorId,
            timestamp: timestamp,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            classification: classification,
            context: context,
            recovery: {
                attempted: false,
                successful: false,
                attempts: 0
            }
        };

        // Agregar a historial
        this.errorHistory.push(errorRecord);
        this.limitErrorHistory();

        console.error('[ErrorRecovery] Error detectado:', errorRecord);

        // Determinar si intentar recuperación automática
        if (this.shouldAttemptRecovery(classification, errorRecord)) {
            try {
                const result = await this.attemptRecovery(error, classification, context, errorRecord);
                errorRecord.recovery.successful = true;
                
                console.log('[ErrorRecovery] Recuperación exitosa para error:', errorId);
                
                // Emitir evento de recuperación exitosa
                this.emitRecoveryEvent('recovery_success', errorRecord);
                
                return result;
                
            } catch (recoveryError) {
                errorRecord.recovery.successful = false;
                errorRecord.recovery.finalError = recoveryError.message;
                
                console.error('[ErrorRecovery] Fallo en recuperación:', recoveryError);
                
                // Emitir evento de fallo en recuperación
                this.emitRecoveryEvent('recovery_failed', errorRecord);
            }
        }

        // Si llegamos aquí, no se pudo recuperar
        this.handleUnrecoverableError(errorRecord);
        
        // Re-lanzar el error si no se pudo recuperar
        throw error;
    }

    /**
     * Clasifica un error según los manejadores registrados
     */
    classifyError(error) {
        for (let [type, handler] of this.errorHandlers.entries()) {
            if (handler.classify(error)) {
                return {
                    type: type,
                    severity: handler.severity,
                    autoRecover: handler.autoRecover,
                    maxRetries: handler.maxRetries
                };
            }
        }

        // Error no clasificado
        return {
            type: 'Unknown',
            severity: 'medium',
            autoRecover: false,
            maxRetries: 1
        };
    }

    /**
     * Determina si se debe intentar recuperación automática
     */
    shouldAttemptRecovery(classification, errorRecord) {
        if (!classification.autoRecover) {
            return false;
        }

        const errorKey = `${classification.type}_${errorRecord.context.type || 'general'}`;
        const attempts = this.recoveryAttempts.get(errorKey) || 0;

        if (attempts >= classification.maxRetries) {
            console.warn(`[ErrorRecovery] Máximo de reintentos alcanzado para ${errorKey}`);
            return false;
        }

        return true;
    }

    /**
     * Intenta recuperación del error
     */
    async attemptRecovery(error, classification, context, errorRecord) {
        const errorKey = `${classification.type}_${context.type || 'general'}`;
        const attempts = this.recoveryAttempts.get(errorKey) || 0;
        
        // Incrementar contador de intentos
        this.recoveryAttempts.set(errorKey, attempts + 1);
        errorRecord.recovery.attempted = true;
        errorRecord.recovery.attempts = attempts + 1;

        console.log(`[ErrorRecovery] Intento de recuperación ${attempts + 1}/${classification.maxRetries} para ${classification.type}`);

        // Obtener estrategia de recuperación
        const strategy = this.recoveryStrategies.get(classification.type);
        if (!strategy) {
            throw new Error(`No hay estrategia de recuperación para ${classification.type}`);
        }

        // Ejecutar estrategia con contexto ampliado
        const recoveryContext = {
            ...context,
            attemptCount: attempts,
            maxRetries: classification.maxRetries,
            errorRecord: errorRecord
        };

        return await strategy(error, recoveryContext);
    }

    /**
     * Maneja errores irrecuperables
     */
    handleUnrecoverableError(errorRecord) {
        console.error('[ErrorRecovery] Error irrecuperable:', errorRecord);

        // Agregar a lista de errores críticos
        this.criticalErrors.add(errorRecord.id);

        // Notificar al usuario si es crítico
        if (errorRecord.classification.severity === 'critical') {
            this.notifyUser({
                type: 'critical_error',
                message: 'Se ha producido un error crítico en el sistema',
                details: errorRecord.error.message,
                timestamp: errorRecord.timestamp
            });
        }

        // Emitir evento para componentes del sistema
        this.emitRecoveryEvent('unrecoverable_error', errorRecord);
    }

    /**
     * Funciones utilitarias para recuperación
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async waitForConnection() {
        return new Promise((resolve) => {
            const checkConnection = () => {
                if (navigator.onLine) {
                    resolve();
                } else {
                    setTimeout(checkConnection, 1000);
                }
            };
            checkConnection();
        });
    }

    validateAndCorrectCoordinates(coords) {
        // Límites de Argentina
        const bounds = {
            lat: { min: -55, max: -21 },
            lng: { min: -73, max: -53 }
        };

        let corrected = { ...coords };

        // Corregir latitud
        if (corrected.lat < bounds.lat.min) corrected.lat = bounds.lat.min;
        if (corrected.lat > bounds.lat.max) corrected.lat = bounds.lat.max;

        // Corregir longitud
        if (corrected.lng < bounds.lng.min) corrected.lng = bounds.lng.min;
        if (corrected.lng > bounds.lng.max) corrected.lng = bounds.lng.max;

        return corrected;
    }

    /**
     * Notifica al usuario sobre errores críticos
     */
    notifyUser(notification) {
        // Mostrar notificación en UI
        if (window.MAIRA && window.MAIRA.UI && window.MAIRA.UI.showNotification) {
            window.MAIRA.UI.showNotification(notification);
        } else {
            // Fallback a alert si no hay sistema de notificaciones
            alert(`${notification.type.toUpperCase()}: ${notification.message}`);
        }
    }

    /**
     * Emite eventos de recuperación para otros componentes
     */
    emitRecoveryEvent(eventType, data) {
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit(`error_recovery_${eventType}`, data);
        }
    }

    /**
     * Genera ID único para cada error
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Limita el historial de errores para evitar memory leaks
     */
    limitErrorHistory() {
        const maxHistory = 1000;
        if (this.errorHistory.length > maxHistory) {
            this.errorHistory.splice(0, this.errorHistory.length - maxHistory);
        }
    }

    /**
     * Obtiene estadísticas de errores y recuperación
     */
    getErrorStats() {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const recentErrors = this.errorHistory.filter(
            err => new Date(err.timestamp).getTime() > last24h
        );

        const stats = {
            total: {
                errors: this.errorHistory.length,
                recent: recentErrors.length,
                critical: this.criticalErrors.size
            },
            byType: {},
            recovery: {
                attempted: 0,
                successful: 0,
                failed: 0
            }
        };

        // Contar por tipo
        recentErrors.forEach(error => {
            const type = error.classification.type;
            if (!stats.byType[type]) {
                stats.byType[type] = 0;
            }
            stats.byType[type]++;

            // Contar recuperaciones
            if (error.recovery.attempted) {
                stats.recovery.attempted++;
                if (error.recovery.successful) {
                    stats.recovery.successful++;
                } else {
                    stats.recovery.failed++;
                }
            }
        });

        return stats;
    }

    /**
     * Limpia datos antiguos de recuperación
     */
    cleanup() {
        // Limpiar intentos de recuperación antiguos
        const cutoff = Date.now() - (60 * 60 * 1000); // 1 hora
        
        // Reset de contadores de recuperación periódicamente
        if (Math.random() < 0.1) { // 10% de probabilidad
            this.recoveryAttempts.clear();
            console.log('[ErrorRecovery] Contadores de recuperación limpiados');
        }

        // Limpiar errores muy antiguos del historial
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.errorHistory = this.errorHistory.filter(
            err => new Date(err.timestamp).getTime() > weekAgo
        );
    }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.ErrorRecoveryManager = new ErrorRecoveryManager();

// Limpieza periódica cada hora
setInterval(() => {
    window.MAIRA.ErrorRecoveryManager.cleanup();
}, 3600000);

console.log('[MAIRA] ErrorRecoveryManager cargado y operativo');
