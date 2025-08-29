/**
 * UserIdentityLoader.js - Helper para cargar UserIdentity de manera consistente
 * Versión: 1.0.0
 * Última actualización: 2025-08-29
 */

/**
 * Asegura que UserIdentity esté disponible y cargado
 * @returns {Promise<boolean>} true si está disponible, false si falla
 */
async function ensureUserIdentityLoaded() {
    return new Promise((resolve) => {
        // Si UserIdentity ya está disponible
        if (window.MAIRA && window.MAIRA.UserIdentity) {
            console.log('✅ UserIdentity ya disponible');
            resolve(true);
            return;
        }

        // Esperar hasta que esté disponible (máximo 5 segundos)
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos con intervalos de 100ms
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.MAIRA && window.MAIRA.UserIdentity) {
                console.log('✅ UserIdentity cargado después de', attempts * 100, 'ms');
                clearInterval(checkInterval);
                resolve(true);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('❌ UserIdentity no se cargó en el tiempo esperado');
                clearInterval(checkInterval);
                resolve(false);
                return;
            }
        }, 100);
    });
}

/**
 * Obtiene el ID del usuario de manera segura
 * @returns {number|null} ID del usuario o null si no está disponible
 */
function safeGetUserId() {
    if (window.MAIRA && window.MAIRA.UserIdentity) {
        return window.MAIRA.UserIdentity.getUserId();
    }
    
    // Fallback a localStorage si UserIdentity no está disponible
    const userIdStr = localStorage.getItem('userId');
    return userIdStr ? parseInt(userIdStr, 10) : null;
}

/**
 * Obtiene el nombre del usuario de manera segura
 * @returns {string|null} Nombre del usuario o null si no está disponible
 */
function safeGetUsername() {
    if (window.MAIRA && window.MAIRA.UserIdentity) {
        return window.MAIRA.UserIdentity.getUsername();
    }
    
    // Fallback a localStorage si UserIdentity no está disponible
    return localStorage.getItem('username');
}

/**
 * Verifica si el usuario está autenticado de manera segura
 * @returns {boolean} true si está autenticado
 */
function safeIsAuthenticated() {
    if (window.MAIRA && window.MAIRA.UserIdentity) {
        return window.MAIRA.UserIdentity.isAuthenticated();
    }
    
    // Fallback manual
    const userId = safeGetUserId();
    const username = safeGetUsername();
    return !!(userId && username && !isNaN(userId));
}

// Hacer funciones disponibles globalmente
window.ensureUserIdentityLoaded = ensureUserIdentityLoaded;
window.safeGetUserId = safeGetUserId;
window.safeGetUsername = safeGetUsername;
window.safeIsAuthenticated = safeIsAuthenticated;

console.log('🔧 UserIdentityLoader inicializado');
