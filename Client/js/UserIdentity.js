/**
 * UserIdentity.js - Sistema centralizado de gestión de identidad de usuario
 * Módulo para gestionar la identidad del usuario de manera consistente en todo el sistema
 * @version 2.0.0 - Optimizado para MAIRA con Socket.IO
 */

// Namespace global
window.MAIRA = window.MAIRA || {};

// Módulo de identidad de usuario
MAIRA.UserIdentity = (function() {
    // Datos del usuario almacenados en memoria
    let userData = null;
    let isInitialized = false;
    
    // Event emitter para cambios de estado
    const events = {};

    /**
     * Inicializa la identidad del usuario con los datos proporcionados
     * @param {string|number} userId - Identificador único del usuario
     * @param {string} username - Nombre de usuario
     * @param {Object} elementoTrabajo - Datos del elemento asociado al usuario
     * @returns {Object} - Datos del usuario inicializados
     */
    function initialize(userId, username, elementoTrabajo) {
        console.log("🔐 UserIdentity: Inicializando identidad:", userId, username);
        
        // Convertir userId a número si viene como string
        const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        
        userData = {
            id: userIdNum,
            username: username,
            loginTime: new Date().toISOString(),
            elementoTrabajo: elementoTrabajo || {},
            sessionId: generateSessionId()
        };
        
        // Guardar en localStorage para consistencia entre recargas
        localStorage.setItem('usuario_info', JSON.stringify(userData));
        
        // También guardar de forma individual para compatibilidad con código antiguo
        localStorage.setItem('userId', userIdNum.toString());
        localStorage.setItem('username', username);
        
        // Si hay elementoTrabajo, guardarlo por separado
        if (elementoTrabajo) {
            localStorage.setItem('elemento_trabajo', JSON.stringify(elementoTrabajo));
        }
        
        // Marcar como inicializado
        isInitialized = true;
        
        // Exponer globalmente para compatibilidad
        window.userId = userIdNum;
        window.userName = username;
        
        // Emitir evento de inicialización
        emitEvent('initialized', userData);
        
        console.log("✅ UserIdentity: Usuario inicializado correctamente");
        return userData;
    }
    
    /**
     * Genera un ID de sesión único
     */
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Sistema de eventos simple
     */
    function emitEvent(eventName, data) {
        if (events[eventName]) {
            events[eventName].forEach(callback => callback(data));
        }
    }
    
    function on(eventName, callback) {
        if (!events[eventName]) {
            events[eventName] = [];
        }
        events[eventName].push(callback);
    }
    
    /**
     * Obtiene el ID del usuario (función principal para uso en toda la app)
     * @returns {number|null} - ID del usuario o null si no existe
     */
    function getUserId() {
        if (userData && userData.id) {
            return userData.id;
        }
        
        // Intentar cargar desde localStorage
        const savedUserId = localStorage.getItem('userId');
        if (savedUserId) {
            return parseInt(savedUserId, 10);
        }
        
        return null;
    }
    
    /**
     * Obtiene el nombre del usuario
     * @returns {string|null} - Nombre del usuario o null si no existe
     */
    function getUserName() {
        if (userData && userData.username) {
            return userData.username;
        }
        
        // Intentar cargar desde localStorage
        return localStorage.getItem('username');
    }
    
    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} - true si está autenticado
     */
    function isAuthenticated() {
        const userId = getUserId();
        const userName = getUserName();
        return !!(userId && userName);
    }
    
    /**
     * Obtiene toda la información del usuario
     * @returns {Object|null} - Datos completos del usuario
     */
    function getUserData() {
        if (!userData) {
            loadFromStorage();
        }
        return userData;
    }

    /**
     * Carga los datos del usuario desde el almacenamiento local
     * @returns {Object|null} - Datos del usuario o null si no existen
     */
    function loadFromStorage() {
        if (!userData) {
            try {
                // Intentar cargar desde formato moderno primero
                const storedData = localStorage.getItem('usuario_info');
                if (storedData) {
                    userData = JSON.parse(storedData);
                    console.log("Identidad de usuario cargada desde 'usuario_info'");
                } else {
                    // Intentar con formato antiguo
                    const oldData = localStorage.getItem('gb_usuario_info');
                    if (oldData) {
                        const parsed = JSON.parse(oldData);
                        userData = {
                            id: parsed.id,
                            username: parsed.usuario || parsed.username,
                            loginTime: parsed.loginTime || new Date().toISOString()
                        };
                        console.log("Identidad de usuario cargada desde 'gb_usuario_info'");
                    } else {
                        // Último intento con valores individuales
                        const id = localStorage.getItem('userId');
                        const username = localStorage.getItem('username');
                        if (id && username) {
                            userData = {
                                id: id,
                                username: username,
                                loginTime: new Date().toISOString()
                            };
                            console.log("Identidad de usuario cargada desde valores individuales");
                        } else {
                            console.warn("No se encontró información de usuario en localStorage");
                        }
                    }
                }
                
                // Intentar cargar elementoTrabajo
                try {
                    const elementoTrabajoData = localStorage.getItem('elemento_trabajo');
                    if (elementoTrabajoData && userData) {
                        userData.elementoTrabajo = JSON.parse(elementoTrabajoData);
                    }
                } catch (e) {
                    console.warn("Error al cargar elementoTrabajo:", e);
                }
            } catch (e) {
                console.error("Error al cargar datos de usuario desde localStorage:", e);
                return null;
            }
        }
        
        return userData;
    }

    /**
     * Limpia todos los datos del usuario
     */
    function clear() {
        userData = null;
        isInitialized = false;
        
        // Limpiar localStorage
        localStorage.removeItem('usuario_info');
        localStorage.removeItem('gb_usuario_info');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('elemento_trabajo');
        
        // Limpiar variables globales
        if (window.userId) delete window.userId;
        if (window.userName) delete window.userName;
        
        // Emitir evento de limpieza
        emitEvent('cleared', null);
        
        console.log("✅ UserIdentity: Datos de usuario limpiados");
    }

    /**
     * Verifica si los datos de usuario son válidos
     * @returns {boolean} - True si los datos son válidos
     */
    function isValid() {
        const info = loadFromStorage();
        return !!(info && info.id && info.username);
    }

    /**
     * Obtiene el ID del usuario de forma consistente
     * @returns {string|null} - ID del usuario o null si no existe
     */
    function getUserId() {
        const info = loadFromStorage();
        return info ? info.id : null;
    }

    /**
     * Obtiene el nombre del usuario de forma consistente
     * @returns {string} - Nombre del usuario o "Usuario" si no existe
     */
    function getUsername() {
        const info = loadFromStorage();
        return info ? (info.username || "Usuario") : "Usuario";
    }

    /**
     * Obtiene el elemento de trabajo del usuario
     * @returns {Object|null} - Datos del elemento de trabajo o null si no existe
     */
    function getElementoTrabajo() {
        const info = loadFromStorage();
        
        // Si no hay elementoTrabajo en el objeto de usuario, intentar cargarlo directamente
        if (info && !info.elementoTrabajo) {
            try {
                const elementoTrabajoData = localStorage.getItem('elemento_trabajo');
                if (elementoTrabajoData) {
                    info.elementoTrabajo = JSON.parse(elementoTrabajoData);
                    
                    // Actualizar el objeto almacenado
                    userData = info;
                }
            } catch (e) {
                console.warn("Error al cargar elementoTrabajo:", e);
            }
        }
        
        return info && info.elementoTrabajo ? info.elementoTrabajo : null;
    }

    /**
     * Actualiza el elemento de trabajo del usuario
     * @param {Object} elementoTrabajo - Nuevos datos del elemento de trabajo
     * @returns {Object} - Datos actualizados del usuario
     */
    function updateElementoTrabajo(elementoTrabajo) {
        if (!elementoTrabajo) return userData;
        
        // Cargar datos actuales
        loadFromStorage();
        
        if (userData) {
            // Actualizar elementoTrabajo
            userData.elementoTrabajo = elementoTrabajo;
            
            // Guardar en localStorage
            localStorage.setItem('usuario_info', JSON.stringify(userData));
            localStorage.setItem('elemento_trabajo', JSON.stringify(elementoTrabajo));
            
            console.log("ElementoTrabajo actualizado:", elementoTrabajo);
        }
        
        return userData;
    }

    /**
     * Aplica la identidad del usuario a un objeto de datos
     * @param {Object} datos - Objeto al que aplicar la identidad
     * @returns {Object} - Objeto con la identidad aplicada
     */
    function applyToData(datos) {
        if (!datos) return {};
        
        const info = loadFromStorage();
        if (!info) return datos;
        
        // Aplicar datos de identidad al objeto
        datos.id = datos.id || info.id;
        datos.usuario = datos.usuario || info.username;
        datos.usuarioId = datos.usuarioId || info.id;
        datos.jugadorId = datos.jugadorId || info.id;
        
        // Aplicar datos de elemento si existen
        if (info.elementoTrabajo) {
            datos.elemento = datos.elemento || info.elementoTrabajo;
            
            // Asegurar que el SIDC, designación, etc. estén disponibles directamente
            if (info.elementoTrabajo.sidc && !datos.sidc) {
                datos.sidc = info.elementoTrabajo.sidc;
            }
            
            if (info.elementoTrabajo.designacion && !datos.designacion) {
                datos.designacion = info.elementoTrabajo.designacion;
            }
            
            if (info.elementoTrabajo.dependencia && !datos.dependencia) {
                datos.dependencia = info.elementoTrabajo.dependencia;
            }
            
            if (info.elementoTrabajo.magnitud && !datos.magnitud) {
                datos.magnitud = info.elementoTrabajo.magnitud;
            }
        }
        
        return datos;
    }

    // API público
    return {
        initialize,
        loadFromStorage,
        clear,
        isValid,
        getElementoTrabajo,
        updateElementoTrabajo,
        applyToData,
        // ✅ NUEVAS FUNCIONES CENTRALIZADAS
        getUserId,
        getUserName,
        getUsername,  // Versión con fallback
        isAuthenticated,
        getUserData,
        on  // Para eventos
    };
})();

// Inicializar automáticamente
document.addEventListener("DOMContentLoaded", function() {
    MAIRA.UserIdentity.loadFromStorage();
    console.log("Módulo UserIdentity inicializado automáticamente");
});

// Exponer globalmente para compatibilidad
window.UserIdentity = MAIRA.UserIdentity;
