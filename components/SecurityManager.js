/**
 * MAIRA Security Manager
 * Gestiona la seguridad del sistema, validación de datos y prevención de vulnerabilidades
 * Implementa parches de seguridad críticos identificados en la auditoría
 */

class SecurityManager {
    constructor() {
        this.validationRules = new Map();
        this.sanitizationPatterns = new Map();
        this.rateLimits = new Map();
        this.sessionTokens = new Map();
        this.csrfTokens = new Set();
        
        this.initializeSecurityRules();
        this.initializeSanitization();
        this.initializeRateLimiting();
        
        console.log('[SecurityManager] Sistema de seguridad inicializado');
    }

    /**
     * Inicializa las reglas de validación de datos
     */
    initializeSecurityRules() {
        // Validación de coordenadas geográficas
        this.validationRules.set('coordinates', {
            lat: { min: -55, max: -21, type: 'number' }, // Argentina bounds
            lng: { min: -73, max: -53, type: 'number' },
            required: true
        });

        // Validación de archivos TIF
        this.validationRules.set('tifFile', {
            maxSize: 50 * 1024 * 1024, // 50MB
            allowedExtensions: ['.tif', '.tiff'],
            mimeTypes: ['image/tiff', 'application/octet-stream'],
            required: false
        });

        // Validación de configuración de partida (como ya existe en el sistema)
        this.validationRules.set('configuracionPartida', {
            nombrePartida: { type: 'string', required: true, maxLength: 100 },
            duracionPartida: { min: 30, max: 240, type: 'number', required: true }, // minutos
            duracionTurno: { min: 1, max: 30, type: 'number', required: true }, // minutos
            objetivoPartida: { type: 'string', required: true, maxLength: 500 },
            modo: { allowed: ['local', 'online'], type: 'string', required: true }
        });

        // Validación de roles de usuario (solo los que existen en el sistema)
        this.validationRules.set('userRole', {
            equipo: { 
                allowed: ['azul', 'rojo', 'sin_equipo'], 
                type: 'string',
                required: true 
            },
            esCreador: { type: 'boolean', required: false },
            esDirector: { type: 'boolean', required: false },
            listo: { type: 'boolean', required: false }
        });
    }

    /**
     * Inicializa patrones de sanitización
     */
    initializeSanitization() {
        // Prevenir XSS
        this.sanitizationPatterns.set('xss', [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
        ]);

        // Prevenir SQL injection
        this.sanitizationPatterns.set('sql', [
            /(\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC)\b)/gi,
            /(\-\-|\#|\/\*|\*\/)/g,
            /(;|\||&)/g
        ]);

        // Sanitización de nombres de archivo
        this.sanitizationPatterns.set('filename', [
            /[<>:"\/\\|?*]/g,
            /\.\./g,
            /^\.+/g
        ]);
    }

    /**
     * Inicializa límites de velocidad por IP/usuario
     */
    initializeRateLimiting() {
        this.rateLimits.set('fileUpload', { max: 5, window: 60000 }); // 5 uploads por minuto
        this.rateLimits.set('crearPartida', { max: 3, window: 300000 }); // 3 partidas por 5 min
        this.rateLimits.set('coordinates', { max: 100, window: 60000 }); // 100 consultas por minuto
        this.rateLimits.set('tifQuery', { max: 20, window: 60000 }); // 20 consultas TIF por minuto
        this.rateLimits.set('joinPartida', { max: 10, window: 60000 }); // 10 intentos unirse por minuto
    }

    /**
     * Valida datos según las reglas establecidas
     */
    validateData(dataType, data, context = {}) {
        try {
            const rules = this.validationRules.get(dataType);
            if (!rules) {
                console.warn(`[SecurityManager] No hay reglas para tipo: ${dataType}`);
                return { valid: false, error: 'Tipo de datos no válido' };
            }

            const result = this.performValidation(data, rules, context);
            
            if (!result.valid) {
                console.warn(`[SecurityManager] Validación fallida para ${dataType}:`, result.error);
                this.logSecurityEvent('validation_failed', { dataType, error: result.error, context });
            }

            return result;
        } catch (error) {
            console.error('[SecurityManager] Error en validación:', error);
            return { valid: false, error: 'Error interno de validación' };
        }
    }

    /**
     * Realiza la validación específica según reglas
     */
    performValidation(data, rules, context) {
        if (rules.required && (data === null || data === undefined)) {
            return { valid: false, error: 'Dato requerido faltante' };
        }

        // Validación de coordenadas
        if (rules.lat && rules.lng) {
            if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
                return { valid: false, error: 'Coordenadas deben ser números' };
            }
            
            if (data.lat < rules.lat.min || data.lat > rules.lat.max ||
                data.lng < rules.lng.min || data.lng > rules.lng.max) {
                return { valid: false, error: 'Coordenadas fuera del rango permitido' };
            }
        }

        // Validación de archivos
        if (rules.maxSize && data.size > rules.maxSize) {
            return { valid: false, error: 'Archivo excede tamaño máximo' };
        }

        // Validación de arrays
        if (rules.type === 'array' && Array.isArray(data)) {
            if (rules.min && data.length < rules.min) {
                return { valid: false, error: `Mínimo ${rules.min} elementos requeridos` };
            }
            if (rules.max && data.length > rules.max) {
                return { valid: false, error: `Máximo ${rules.max} elementos permitidos` };
            }
        }

        // Validación de valores permitidos
        if (rules.allowed && !rules.allowed.includes(data)) {
            return { valid: false, error: 'Valor no permitido' };
        }

        return { valid: true };
    }

    /**
     * Sanitiza datos de entrada
     */
    sanitizeInput(input, type = 'general') {
        if (typeof input !== 'string') {
            return input;
        }

        let sanitized = input;

        // Aplicar patrones de sanitización
        const patterns = this.sanitizationPatterns.get(type) || 
                        this.sanitizationPatterns.get('xss');

        patterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        // Escape de caracteres especiales para HTML
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        return sanitized.trim();
    }

    /**
     * Verifica límites de velocidad
     */
    checkRateLimit(actionType, identifier) {
        const limit = this.rateLimits.get(actionType);
        if (!limit) return true;

        const key = `${actionType}_${identifier}`;
        const now = Date.now();
        
        if (!this.rateLimitTracking) {
            this.rateLimitTracking = new Map();
        }

        let userActions = this.rateLimitTracking.get(key) || [];
        
        // Filtrar acciones dentro de la ventana de tiempo
        userActions = userActions.filter(timestamp => 
            now - timestamp < limit.window
        );

        if (userActions.length >= limit.max) {
            this.logSecurityEvent('rate_limit_exceeded', { 
                actionType, 
                identifier, 
                attempts: userActions.length 
            });
            return false;
        }

        userActions.push(now);
        this.rateLimitTracking.set(key, userActions);
        return true;
    }

    /**
     * Genera token CSRF para prevenir ataques de falsificación
     */
    generateCSRFToken() {
        const token = this.generateSecureToken(32);
        this.csrfTokens.add(token);
        
        // Limpiar tokens antiguos después de 1 hora
        setTimeout(() => {
            this.csrfTokens.delete(token);
        }, 3600000);

        return token;
    }

    /**
     * Valida token CSRF
     */
    validateCSRFToken(token) {
        return this.csrfTokens.has(token);
    }

    /**
     * Genera token seguro para sesiones
     */
    generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result + '_' + Date.now();
    }

    /**
     * Valida origen de archivo TIF
     */
    validateTIFOrigin(filename, metadata = {}) {
        // Verificar extensión
        const validExtensions = ['.tif', '.tiff'];
        const hasValidExtension = validExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            return { valid: false, error: 'Extensión de archivo no válida' };
        }

        // Verificar tamaño de metadatos si están disponibles
        if (metadata.size && metadata.size > 50 * 1024 * 1024) {
            return { valid: false, error: 'Archivo TIF excede tamaño máximo' };
        }

        // Verificar nombre de archivo por patrones sospechosos
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return { valid: false, error: 'Nombre de archivo contiene caracteres no válidos' };
        }

        return { valid: true };
    }

    /**
     * Registra eventos de seguridad para auditoría
     */
    logSecurityEvent(eventType, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent || 'unknown',
            url: window.location?.href || 'unknown'
        };

        console.warn('[SecurityManager] Evento de seguridad:', logEntry);

        // Aquí se podría enviar a un endpoint de logging
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('security_event', logEntry);
        }
    }

    /**
     * Limpia recursos de seguridad periódicamente
     */
    cleanup() {
        const now = Date.now();
        
        // Limpiar tracking de rate limiting (conservar solo última hora)
        if (this.rateLimitTracking) {
            for (let [key, actions] of this.rateLimitTracking.entries()) {
                const filtered = actions.filter(timestamp => 
                    now - timestamp < 3600000
                );
                
                if (filtered.length === 0) {
                    this.rateLimitTracking.delete(key);
                } else {
                    this.rateLimitTracking.set(key, filtered);
                }
            }
        }

        // Limpiar tokens de sesión expirados
        for (let [token, timestamp] of this.sessionTokens.entries()) {
            if (now - timestamp > 86400000) { // 24 horas
                this.sessionTokens.delete(token);
            }
        }

        console.log('[SecurityManager] Limpieza de seguridad completada');
    }

    /**
     * Obtiene configuración de seguridad para el cliente
     */
    getSecurityConfig() {
        return {
            rateLimit: {
                fileUpload: this.rateLimits.get('fileUpload'),
                partidaCreation: this.rateLimits.get('partidaCreation')
            },
            validation: {
                coordinates: this.validationRules.get('coordinates'),
                maxFileSize: this.validationRules.get('tifFile')?.maxSize
            },
            features: {
                csrfProtection: true,
                rateLimiting: true,
                inputSanitization: true,
                fileValidation: true
            }
        };
    }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.SecurityManager = new SecurityManager();

// Auto-limpieza cada 30 minutos
setInterval(() => {
    window.MAIRA.SecurityManager.cleanup();
}, 1800000);

console.log('[MAIRA] SecurityManager cargado y operativo');
