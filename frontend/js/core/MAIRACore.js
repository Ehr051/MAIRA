/**
 * 🎯 MAIRA CORE - Sistema Central Unificado
 * Gestiona la estructura base para todos los modos
 * Rutas, navegación, estado global y comunicación entre módulos
 */

class MAIRACore {
    constructor() {
        this.version = '4.0.0';
        this.modoActual = null;
        this.usuarioActual = null;
        this.configuracionGlobal = null;
        this.estadoGlobal = {};
        this.gestores = new Map();
        this.rutas = new Map();
        this.eventBus = new EventTarget();
        
        console.log('🎯 MAIRA Core 4.0 inicializado');
        this.inicializarCore();
    }

    /**
     * INICIALIZAR CORE SYSTEM
     */
    inicializarCore() {
        this.configurarRutas();
        this.configurarGestores();
        this.configurarEventos();
        this.cargarConfiguracionGlobal();
        
        console.log('✅ MAIRA Core configurado');
    }

    /**
     * CONFIGURAR RUTAS UNIFICADAS
     */
    configurarRutas() {
        // Rutas principales del sistema
        this.rutas.set('landing', {
            path: 'index.html',
            titulo: 'MAIRA - Sistema de Entrenamiento Militar',
            modulo: 'landing',
            requiereAuth: false
        });

        this.rutas.set('login', {
            path: 'index.html#login',
            titulo: 'Iniciar Sesión',
            modulo: 'auth',
            requiereAuth: false
        });

        this.rutas.set('seleccionModo', {
            path: 'index.html#modos',
            titulo: 'Selección de Modo',
            modulo: 'selector',
            requiereAuth: true
        });

        // Modos principales
        this.rutas.set('planeamiento', {
            path: 'planeamiento.html',
            titulo: 'Modo Planeamiento',
            modulo: 'planeamiento',
            requiereAuth: true,
            gestor: 'PlaneamientoManager'
        });

        this.rutas.set('iniciarpartida', {
            path: 'iniciarpartida.html',
            titulo: 'Simulador Táctico',
            modulo: 'simulador',
            requiereAuth: true,
            gestor: 'SimuladorManager'
        });

        this.rutas.set('juegodeguerra', {
            path: 'juegodeguerra.html',
            titulo: 'Juego de Guerra',
            modulo: 'combate',
            requiereAuth: true,
            gestor: 'GestorJuego'
        });

        this.rutas.set('CO', {
            path: 'CO.html',
            titulo: 'Cuadro de Organización',
            modulo: 'organizacion',
            requiereAuth: true,
            gestor: 'COManager'
        });

        this.rutas.set('GB', {
            path: 'inicioGB.html',
            titulo: 'Gestión de Batalla',
            modulo: 'batalla',
            requiereAuth: true,
            gestor: 'GBManager'
        });

        console.log('🗺️ Rutas configuradas:', this.rutas.size);
    }

    /**
     * CONFIGURAR GESTORES CORE
     */
    configurarGestores() {
        // Gestores globales disponibles para todos los modos
        this.gestores.set('UserIdentity', null);
        this.gestores.set('SessionManager', null);
        this.gestores.set('CommunicationManager', null);
        this.gestores.set('StateManager', null);
        
        // Gestores específicos por modo
        this.gestores.set('PlaneamientoManager', null);
        this.gestores.set('SimuladorManager', null);
        this.gestores.set('GestorJuego', null);
        this.gestores.set('COManager', null);
        this.gestores.set('GBManager', null);
        
        console.log('⚙️ Gestores registrados:', this.gestores.size);
    }

    /**
     * NAVEGACIÓN ENTRE MODOS
     */
    navegarA(ruta, parametros = {}) {
        const rutaInfo = this.rutas.get(ruta);
        
        if (!rutaInfo) {
            console.error('❌ Ruta no encontrada:', ruta);
            return false;
        }

        // Verificar autenticación
        if (rutaInfo.requiereAuth && !this.usuarioAutenticado()) {
            console.warn('⚠️ Ruta requiere autenticación, redirigiendo a login');
            this.navegarA('login');
            return false;
        }

        // Guardar estado actual antes de cambiar
        this.guardarEstadoActual();

        // Cambiar de modo
        this.cambiarModo(rutaInfo.modulo, parametros);

        // Navegar físicamente
        if (window.location.pathname !== rutaInfo.path) {
            window.location.href = rutaInfo.path;
        }

        return true;
    }

    /**
     * CAMBIAR MODO ACTIVO
     */
    cambiarModo(nuevoModo, parametros = {}) {
        const modoAnterior = this.modoActual;
        
        // Limpiar modo anterior
        if (modoAnterior && this.gestores.has(modoAnterior)) {
            this.limpiarModo(modoAnterior);
        }

        // Establecer nuevo modo
        this.modoActual = nuevoModo;
        this.estadoGlobal.modoActual = nuevoModo;
        this.estadoGlobal.parametros = parametros;

        // Emitir evento de cambio
        this.emitirEvento('modoChanged', {
            anterior: modoAnterior,
            actual: nuevoModo,
            parametros: parametros
        });

        console.log(`🔄 Modo cambiado: ${modoAnterior} → ${nuevoModo}`);
    }

    /**
     * GESTIÓN DE ESTADO GLOBAL
     */
    obtenerEstado(clave) {
        return this.estadoGlobal[clave];
    }

    establecerEstado(clave, valor) {
        const valorAnterior = this.estadoGlobal[clave];
        this.estadoGlobal[clave] = valor;

        this.emitirEvento('estadoChanged', {
            clave: clave,
            valorAnterior: valorAnterior,
            valorNuevo: valor
        });
    }

    /**
     * GESTIÓN DE USUARIOS
     */
    usuarioAutenticado() {
        return this.usuarioActual !== null && 
               this.gestores.get('UserIdentity')?.isAuthenticated?.() === true;
    }

    establecerUsuario(userData) {
        this.usuarioActual = userData;
        this.estadoGlobal.usuario = userData;
        
        this.emitirEvento('usuarioChanged', userData);
        
        console.log('👤 Usuario establecido:', userData.username);
    }

    /**
     * COMUNICACIÓN ENTRE GESTORES
     */
    registrarGestor(nombre, instancia) {
        this.gestores.set(nombre, instancia);
        
        console.log(`📝 Gestor registrado: ${nombre}`);
        
        this.emitirEvento('gestorRegistrado', {
            nombre: nombre,
            instancia: instancia
        });
    }

    obtenerGestor(nombre) {
        return this.gestores.get(nombre);
    }

    /**
     * SISTEMA DE EVENTOS GLOBAL
     */
    emitirEvento(tipoEvento, datos) {
        const evento = new CustomEvent(tipoEvento, {
            detail: {
                timestamp: new Date().toISOString(),
                datos: datos
            }
        });
        
        this.eventBus.dispatchEvent(evento);
        
        console.log(`📡 Evento emitido: ${tipoEvento}`, datos);
    }

    escucharEvento(tipoEvento, callback) {
        this.eventBus.addEventListener(tipoEvento, callback);
    }

    /**
     * CONFIGURACIÓN GLOBAL
     */
    cargarConfiguracionGlobal() {
        // Configuración default
        this.configuracionGlobal = {
            servidor: {
                url: window.SERVER_URL || 'http://localhost:3000',
                timeout: 30000
            },
            mapa: {
                centroDefault: [-34.9964963, -64.9672817],
                zoomDefault: 4,
                tilesPath: '/tiles'
            },
            juego: {
                duracionTurnoDefault: 300,
                maxJugadores: 6,
                equipos: ['azul', 'rojo']
            },
            interfaz: {
                tema: 'claro',
                idioma: 'es',
                notificaciones: true
            }
        };

        // Cargar desde localStorage si existe
        const configGuardada = localStorage.getItem('maira_config_global');
        if (configGuardada) {
            try {
                const config = JSON.parse(configGuardada);
                this.configuracionGlobal = { ...this.configuracionGlobal, ...config };
            } catch (error) {
                console.warn('⚠️ Error cargando configuración guardada:', error);
            }
        }

        console.log('⚙️ Configuración global cargada');
    }

    guardarConfiguracionGlobal() {
        localStorage.setItem('maira_config_global', JSON.stringify(this.configuracionGlobal));
        console.log('💾 Configuración global guardada');
    }

    /**
     * UTILIDADES CORE
     */
    limpiarModo(modo) {
        const gestor = this.gestores.get(modo);
        if (gestor && typeof gestor.limpiar === 'function') {
            gestor.limpiar();
        }
    }

    guardarEstadoActual() {
        const estado = {
            modo: this.modoActual,
            usuario: this.usuarioActual,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        sessionStorage.setItem('maira_estado_anterior', JSON.stringify(estado));
    }

    restaurarEstadoAnterior() {
        const estadoString = sessionStorage.getItem('maira_estado_anterior');
        if (estadoString) {
            try {
                const estado = JSON.parse(estadoString);
                return estado;
            } catch (error) {
                console.warn('⚠️ Error restaurando estado anterior:', error);
            }
        }
        return null;
    }

    /**
     * CONFIGURAR EVENTOS CORE
     */
    configurarEventos() {
        // Eventos de navegación del navegador
        window.addEventListener('beforeunload', () => {
            this.guardarEstadoActual();
            this.guardarConfiguracionGlobal();
        });

        // Eventos de error global
        window.addEventListener('error', (event) => {
            console.error('❌ Error global capturado:', event.error);
            this.emitirEvento('errorGlobal', {
                mensaje: event.message,
                archivo: event.filename,
                linea: event.lineno,
                error: event.error
            });
        });

        console.log('🔗 Eventos core configurados');
    }

    /**
     * INFORMACIÓN DEL SISTEMA
     */
    obtenerInfoSistema() {
        return {
            version: this.version,
            modoActual: this.modoActual,
            usuario: this.usuarioActual?.username,
            gestoresActivos: Array.from(this.gestores.keys()).filter(
                key => this.gestores.get(key) !== null
            ),
            rutasDisponibles: Array.from(this.rutas.keys()),
            estadoGlobal: { ...this.estadoGlobal }
        };
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.Core = new MAIRACore();
    
    console.log('🌟 MAIRA Core 4.0 disponible globalmente');
}

// Export para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAIRACore;
}
