/**
 * 🔒 MAIRA Security Manager
 * Gestión de seguridad para sistema militar
 * Protege contra XSS, injection attacks y exposición de datos sensibles
 */

class SecurityManager {
    constructor() {
        this.encryptionKey = this.generateSessionKey();
        this.xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /onload\s*=/gi,
            /onerror\s*=/gi,
            /onclick\s*=/gi,
            /onmouseover\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /<link/gi,
            /<meta/gi
        ];
        
        console.log('🔒 SecurityManager initialized');
        this.initializeSecurity();
    }

    /**
     * Inicializa configuraciones de seguridad
     */
    initializeSecurity() {
        // Configurar Content Security Policy
        this.setupCSP();
        
        // Limpiar variables globales sensibles
        this.cleanupGlobalExposure();
        
        // Configurar headers de seguridad
        this.setupSecurityHeaders();
        
        console.log('✅ Security configuration applied');
    }

    /**
     * Sanitiza input para prevenir XSS
     * @param {string} input - Texto a sanitizar
     * @returns {string} Texto sanitizado
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        let sanitized = input;
        
        // Escapar HTML entities
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        // Detectar y eliminar patrones XSS
        this.xssPatterns.forEach(pattern => {
            if (pattern.test(sanitized)) {
                console.warn('🚨 XSS attempt detected and blocked:', input.substring(0, 100));
                sanitized = sanitized.replace(pattern, '[BLOCKED]');
            }
        });

        return sanitized;
    }

    /**
     * Sanitiza datos del chat para prevenir XSS
     * @param {Object} messageData - Datos del mensaje
     * @returns {Object} Datos sanitizados
     */
    sanitizeChatMessage(messageData) {
        if (!messageData) return messageData;

        const sanitized = { ...messageData };
        
        // Sanitizar mensaje
        if (sanitized.mensaje) {
            sanitized.mensaje = this.sanitizeInput(sanitized.mensaje);
        }
        
        // Sanitizar nombre de usuario
        if (sanitized.usuario) {
            sanitized.usuario = this.sanitizeInput(sanitized.usuario);
        }
        
        // Sanitizar cualquier HTML content
        if (sanitized.contenido) {
            sanitized.contenido = this.sanitizeInput(sanitized.contenido);
        }

        return sanitized;
    }

    /**
     * Limpia exposición de variables globales sensibles
     */
    cleanupGlobalExposure() {
        // Mover variables sensibles del scope global
        if (window.socket) {
            console.warn('🔒 Moving exposed socket to secure scope');
            // Mantener referencia interna, eliminar global
            this.secureSocket = window.socket;
            delete window.socket;
        }

        if (window.usuarios_conectados) {
            console.warn('🔒 Moving exposed user list to secure scope');
            this.secureUserList = new Map(Object.entries(window.usuarios_conectados));
            delete window.usuarios_conectados;
        }

        if (window.codigoPartida) {
            console.warn('🔒 Moving exposed game code to secure scope');
            this.secureGameCode = window.codigoPartida;
            delete window.codigoPartida;
        }
    }

    /**
     * Configura Content Security Policy
     */
    setupCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Necesario para Leaflet/D3
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' ws: wss:",
            "font-src 'self' data:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');
        
        document.head.appendChild(meta);
    }

    /**
     * Configura headers de seguridad adicionales
     */
    setupSecurityHeaders() {
        // X-Frame-Options para prevenir clickjacking
        const frameOptions = document.createElement('meta');
        frameOptions.httpEquiv = 'X-Frame-Options';
        frameOptions.content = 'DENY';
        document.head.appendChild(frameOptions);

        // X-Content-Type-Options
        const contentType = document.createElement('meta');
        contentType.httpEquiv = 'X-Content-Type-Options';
        contentType.content = 'nosniff';
        document.head.appendChild(contentType);
    }

    /**
     * Genera clave de sesión segura
     * @returns {string} Clave de cifrado
     */
    generateSessionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Cifra datos sensibles
     * @param {string} data - Datos a cifrar
     * @returns {string} Datos cifrados
     */
    encryptSensitiveData(data) {
        if (!data) return data;
        
        try {
            // Implementación básica de cifrado para datos sensibles
            const encoder = new TextEncoder();
            const encoded = encoder.encode(data);
            
            // XOR simple con clave de sesión (para demonstration)
            const keyBytes = this.encryptionKey.match(/.{2}/g).map(hex => parseInt(hex, 16));
            const encrypted = encoded.map((byte, index) => 
                byte ^ keyBytes[index % keyBytes.length]
            );
            
            return btoa(String.fromCharCode(...encrypted));
        } catch (error) {
            console.error('🔒 Encryption error:', error);
            return data;
        }
    }

    /**
     * Valida permisos de usuario
     * @param {string} userId - ID del usuario
     * @param {string} action - Acción a validar
     * @returns {boolean} Si tiene permisos
     */
    validateUserPermissions(userId, action) {
        // Implementar validación de permisos militares
        const userPermissions = this.getUserPermissions(userId);
        
        const actionPermissions = {
            'create_game': ['director', 'admin'],
            'delete_elements': ['director', 'admin', 'owner'],
            'modify_map': ['director', 'admin'],
            'access_chat': ['all'],
            'upload_files': ['verified']
        };

        const requiredRoles = actionPermissions[action] || ['admin'];
        
        if (requiredRoles.includes('all')) {
            return true;
        }

        return requiredRoles.some(role => userPermissions.includes(role));
    }

    /**
     * Obtiene permisos de usuario (mock - implementar con base de datos)
     * @param {string} userId - ID del usuario
     * @returns {Array} Lista de permisos
     */
    getUserPermissions(userId) {
        // TODO: Implementar consulta real a base de datos
        return ['verified', 'user'];
    }

    /**
     * Log de eventos de seguridad
     * @param {string} event - Tipo de evento
     * @param {Object} details - Detalles del evento
     */
    logSecurityEvent(event, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.warn('🔒 Security Event:', logEntry);
        
        // TODO: Enviar a sistema de logging centralizado
        if (this.secureSocket) {
            this.secureSocket.emit('security_log', logEntry);
        }
    }

    /**
     * Wrapper seguro para mostrar mensajes
     * @param {string} message - Mensaje a mostrar
     * @param {HTMLElement} container - Contenedor
     */
    displaySecureMessage(message, container) {
        const sanitizedMessage = this.sanitizeInput(message);
        
        // Usar textContent en lugar de innerHTML
        container.textContent = sanitizedMessage;
        
        // Si necesita HTML, usar createTextNode
        if (container.innerHTML && container.innerHTML !== sanitizedMessage) {
            container.innerHTML = '';
            container.appendChild(document.createTextNode(sanitizedMessage));
        }
    }
}

// Inicializar SecurityManager globalmente pero de forma segura
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.Security = new SecurityManager();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
}

console.log('🔒 MAIRA Security Manager loaded and active');
