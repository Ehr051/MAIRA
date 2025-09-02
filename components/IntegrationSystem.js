/**
 * MAIRA Integration System
 * Sistema central que integra todos los componentes de la transformación
 * Coordina la comunicación y gestiona el ciclo de vida del sistema
 */

class IntegrationSystem {
    constructor() {
        this.components = new Map();
        this.initializationOrder = [];
        this.isInitialized = false;
        this.eventSystem = null;
        this.healthCheckInterval = null;
        
        this.setupEventSystem();
        this.registerComponents();
        this.setupHealthMonitoring();
        
        console.log('[IntegrationSystem] Sistema de integración inicializado');
    }

    /**
     * Configura el sistema de eventos central
     */
    setupEventSystem() {
        // Crear un sistema de eventos robusto
        this.eventSystem = new EventTarget();
        
        // Proxy para facilitar el uso
        window.MAIRA = window.MAIRA || {};
        window.MAIRA.Events = {
            emit: (eventType, data) => {
                const event = new CustomEvent(eventType, { detail: data });
                this.eventSystem.dispatchEvent(event);
                console.log(`[Events] Emitido: ${eventType}`, data);
            },
            
            on: (eventType, callback) => {
                this.eventSystem.addEventListener(eventType, callback);
            },
            
            off: (eventType, callback) => {
                this.eventSystem.removeEventListener(eventType, callback);
            },
            
            once: (eventType, callback) => {
                const wrapper = (event) => {
                    callback(event);
                    this.eventSystem.removeEventListener(eventType, wrapper);
                };
                this.eventSystem.addEventListener(eventType, wrapper);
            }
        };
    }

    /**
     * Registra todos los componentes del sistema
     */
    registerComponents() {
        // Orden de inicialización (dependencias primero)
        const componentConfigs = [
            {
                name: 'MemoryManager',
                instance: null,
                dependencies: [],
                critical: true,
                healthCheck: () => this.checkMemoryManagerHealth()
            },
            {
                name: 'SecurityManager',
                instance: null,
                dependencies: [],
                critical: true,
                healthCheck: () => this.checkSecurityManagerHealth()
            },
            {
                name: 'ErrorRecoveryManager',
                instance: null,
                dependencies: ['MemoryManager'],
                critical: true,
                healthCheck: () => this.checkErrorRecoveryHealth()
            },
            {
                name: 'PerformanceMonitor',
                instance: null,
                dependencies: ['MemoryManager', 'ErrorRecoveryManager'],
                critical: true,
                healthCheck: () => this.checkPerformanceMonitorHealth()
            },
            {
                name: 'ModularArchitect',
                instance: null,
                dependencies: ['MemoryManager', 'SecurityManager', 'ErrorRecoveryManager'],
                critical: true,
                healthCheck: () => this.checkModularArchitectHealth()
            },
            {
                name: 'GamingMechanicsManager',
                instance: null,
                dependencies: ['SecurityManager', 'ErrorRecoveryManager'],
                critical: false,
                healthCheck: () => this.checkGamingMechanicsHealth()
            }
        ];

        // Registrar componentes
        componentConfigs.forEach(config => {
            this.components.set(config.name, config);
        });

        // Determinar orden de inicialización
        this.initializationOrder = this.resolveInitializationOrder();
        
        console.log('[IntegrationSystem] Orden de inicialización:', this.initializationOrder);
    }

    /**
     * Resuelve el orden de inicialización basado en dependencias
     */
    resolveInitializationOrder() {
        const resolved = [];
        const resolving = new Set();
        
        const resolve = (componentName) => {
            if (resolved.includes(componentName)) {
                return;
            }
            
            if (resolving.has(componentName)) {
                throw new Error(`Dependencia circular detectada: ${componentName}`);
            }
            
            const component = this.components.get(componentName);
            if (!component) {
                throw new Error(`Componente no encontrado: ${componentName}`);
            }
            
            resolving.add(componentName);
            
            // Resolver dependencias primero
            component.dependencies.forEach(dep => resolve(dep));
            
            resolving.delete(componentName);
            resolved.push(componentName);
        };
        
        // Resolver todos los componentes
        Array.from(this.components.keys()).forEach(name => resolve(name));
        
        return resolved;
    }

    /**
     * Inicializa todo el sistema
     */
    async initializeSystem() {
        if (this.isInitialized) {
            console.warn('[IntegrationSystem] Sistema ya inicializado');
            return;
        }

        console.log('[IntegrationSystem] Iniciando inicialización del sistema...');

        try {
            // Inicializar componentes en orden
            for (const componentName of this.initializationOrder) {
                await this.initializeComponent(componentName);
            }

            // Configurar comunicación entre componentes
            this.setupInterComponentCommunication();

            // Configurar integración con sistema existente
            this.setupLegacyIntegration();

            this.isInitialized = true;
            
            console.log('[IntegrationSystem] ¡Sistema completamente inicializado!');
            
            // Emitir evento de sistema listo
            window.MAIRA.Events.emit('system_ready', {
                timestamp: Date.now(),
                components: Array.from(this.components.keys()),
                version: '2.0.0'
            });

        } catch (error) {
            console.error('[IntegrationSystem] Error en inicialización:', error);
            
            // Intentar recuperación
            await this.attemptSystemRecovery(error);
            
            throw error;
        }
    }

    /**
     * Inicializa un componente específico
     */
    async initializeComponent(componentName) {
        const component = this.components.get(componentName);
        if (!component) {
            throw new Error(`Componente no encontrado: ${componentName}`);
        }

        console.log(`[IntegrationSystem] Inicializando ${componentName}...`);

        try {
            // Verificar que las dependencias estén listas
            for (const depName of component.dependencies) {
                const dependency = this.components.get(depName);
                if (!dependency || !dependency.instance) {
                    throw new Error(`Dependencia ${depName} no está lista para ${componentName}`);
                }
            }

            // Obtener instancia del componente
            let instance = window.MAIRA?.[componentName];
            
            if (!instance) {
                throw new Error(`Instancia de ${componentName} no encontrada en window.MAIRA`);
            }

            // Configurar referencias a dependencias
            if (component.dependencies.length > 0) {
                const dependencies = {};
                component.dependencies.forEach(depName => {
                    dependencies[depName] = this.components.get(depName).instance;
                });
                
                // Si el componente tiene método para configurar dependencias
                if (typeof instance.setDependencies === 'function') {
                    instance.setDependencies(dependencies);
                }
            }

            // Ejecutar inicialización específica si existe
            if (typeof instance.initialize === 'function') {
                await instance.initialize();
            }

            component.instance = instance;
            
            console.log(`[IntegrationSystem] ${componentName} inicializado exitosamente`);
            
            // Emitir evento de componente listo
            window.MAIRA.Events.emit('component_ready', {
                component: componentName,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(`[IntegrationSystem] Error inicializando ${componentName}:`, error);
            
            if (component.critical) {
                throw error; // Re-lanzar si es crítico
            } else {
                console.warn(`[IntegrationSystem] Componente no crítico ${componentName} falló, continuando...`);
            }
        }
    }

    /**
     * Configura comunicación entre componentes
     */
    setupInterComponentCommunication() {
        console.log('[IntegrationSystem] Configurando comunicación entre componentes...');

        // Gaming Mechanics ↔ Security Manager
        window.MAIRA.Events.on('gaming_action', (event) => {
            const { action, user, data } = event.detail;
            
            // Validar acción con SecurityManager
            const validation = window.MAIRA.SecurityManager.validateData('partidaData', data);
            if (!validation.valid) {
                window.MAIRA.Events.emit('gaming_action_rejected', {
                    reason: validation.error,
                    action: action,
                    user: user
                });
                return;
            }
            
            // Verificar rate limiting
            const rateLimitOk = window.MAIRA.SecurityManager.checkRateLimit('partidaCreation', user);
            if (!rateLimitOk) {
                window.MAIRA.Events.emit('gaming_action_rate_limited', { user, action });
                return;
            }
        });

        // Performance Monitor ↔ Memory Manager
        window.MAIRA.Events.on('memory_status', (event) => {
            const { ratio } = event.detail;
            
            if (ratio > 0.9) { // 90% de memoria usada
                window.MAIRA.Events.emit('performance_optimization_needed', {
                    type: 'memory',
                    severity: 'critical',
                    ratio: ratio
                });
            }
        });

        // Error Recovery ↔ Performance Monitor
        window.MAIRA.Events.on('error_recovery_unrecoverable_error', (event) => {
            // Notificar al performance monitor sobre errores críticos
            window.MAIRA.Events.emit('system_health_degraded', {
                source: 'error_recovery',
                details: event.detail
            });
        });

        // Modular Architect ↔ Memory Manager
        window.MAIRA.Events.on('modular_module_loaded', (event) => {
            // Informar al memory manager sobre nuevos módulos cargados
            const { module } = event.detail;
            console.log(`[IntegrationSystem] Módulo ${module} cargado y comunicado al sistema`);
        });

        console.log('[IntegrationSystem] Comunicación entre componentes configurada');
    }

    /**
     * Configura integración con el sistema MAIRA existente
     */
    setupLegacyIntegration() {
        console.log('[IntegrationSystem] Configurando integración con sistema existente...');

        // Integrar con iniciarpartida.js
        this.integrateWithIniciarPartida();

        // Integrar con gestorTurnos.js
        this.integrateWithGestorTurnos();

        // Integrar con simbolosP.js
        this.integrateWithSimbolos();

        // Integrar con sistema de mapas
        this.integrateWithMapSystem();

        console.log('[IntegrationSystem] Integración con sistema existente completada');
    }

    /**
     * Integración específica con iniciarpartida.js
     */
    integrateWithIniciarPartida() {
        // Interceptar creación de partidas para añadir gaming mechanics
        const originalIniciarPartida = window.iniciarPartida;
        
        if (originalIniciarPartida) {
            window.iniciarPartida = async function(tipoPartida, participantes, configuracion) {
                console.log('[Integration] Interceptando iniciarPartida...');
                
                // Validar con SecurityManager
                const validation = window.MAIRA.SecurityManager.validateData('partidaData', {
                    tipoPartida: tipoPartida,
                    participantes: participantes,
                    duracion: configuracion?.duracion || 120
                });

                if (!validation.valid) {
                    throw new Error(`Validación de partida falló: ${validation.error}`);
                }

                // Inicializar gaming mechanics si está disponible
                if (window.MAIRA.GamingMechanicsManager) {
                    window.MAIRA.GamingMechanicsManager.initializeExercise(
                        tipoPartida, 
                        participantes, 
                        configuracion
                    );
                }

                // Ejecutar función original
                const result = await originalIniciarPartida.call(this, tipoPartida, participantes, configuracion);

                // Emitir evento de partida iniciada
                window.MAIRA.Events.emit('partida_iniciada', {
                    tipo: tipoPartida,
                    participantes: participantes.length,
                    timestamp: Date.now()
                });

                return result;
            };
        }
    }

    /**
     * Integración con gestorTurnos.js
     */
    integrateWithGestorTurnos() {
        // Interceptar cambios de turno
        window.MAIRA.Events.on('turno_cambiado', (event) => {
            // Actualizar gaming mechanics
            if (window.MAIRA.GamingMechanicsManager) {
                window.MAIRA.GamingMechanicsManager.processTurnChange(event.detail);
            }

            // Limpiar memoria si es necesario
            if (window.MAIRA.MemoryManager) {
                window.MAIRA.MemoryManager.scheduleGarbageCollection();
            }
        });
    }

    /**
     * Integración con simbolosP.js
     */
    integrateWithSimbolos() {
        // Interceptar creación de símbolos para optimización
        const originalCrearSimbolo = window.crearSimbolo;
        
        if (originalCrearSimbolo) {
            window.crearSimbolo = function(tipo, posicion, opciones) {
                // Verificar rendimiento antes de crear símbolo
                const performanceReport = window.MAIRA.PerformanceMonitor.getPerformanceReport();
                
                if (performanceReport.systemHealth < 50) {
                    // Sistema con baja salud, usar símbolos simplificados
                    opciones = { ...opciones, simplified: true };
                }

                // Obtener símbolo del pool de memoria si es posible
                let simbolo = null;
                if (window.MAIRA.MemoryManager) {
                    simbolo = window.MAIRA.MemoryManager.getFromPool('symbols');
                }

                if (!simbolo) {
                    simbolo = originalCrearSimbolo.call(this, tipo, posicion, opciones);
                } else {
                    // Resetear símbolo del pool
                    simbolo.type = tipo;
                    simbolo.position = posicion;
                    Object.assign(simbolo, opciones);
                }

                // Emitir evento de símbolo creado
                window.MAIRA.Events.emit('simbolo_creado', {
                    tipo: tipo,
                    posicion: posicion,
                    fromPool: simbolo !== null
                });

                return simbolo;
            };
        }
    }

    /**
     * Integración con sistema de mapas
     */
    integrateWithMapSystem() {
        // Monitorear eventos del mapa para optimización
        if (window.map) {
            window.map.on('zoomend', () => {
                window.MAIRA.Events.emit('map_zoom_changed', {
                    zoom: window.map.getZoom(),
                    timestamp: Date.now()
                });
            });

            window.map.on('moveend', () => {
                // Limpiar elementos fuera del viewport
                if (window.MAIRA.PerformanceMonitor) {
                    window.MAIRA.PerformanceMonitor.cullDistantHexagons();
                }
            });
        }
    }

    /**
     * Configura monitoreo de salud del sistema
     */
    setupHealthMonitoring() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Cada minuto

        console.log('[IntegrationSystem] Monitoreo de salud configurado');
    }

    /**
     * Realiza verificación de salud del sistema
     */
    performHealthCheck() {
        const healthReport = {
            timestamp: Date.now(),
            overall: 'healthy',
            components: {},
            issues: []
        };

        // Verificar cada componente
        for (const [componentName, component] of this.components.entries()) {
            if (component.instance && component.healthCheck) {
                try {
                    const componentHealth = component.healthCheck();
                    healthReport.components[componentName] = componentHealth;
                    
                    if (componentHealth.status !== 'healthy') {
                        healthReport.issues.push({
                            component: componentName,
                            status: componentHealth.status,
                            message: componentHealth.message
                        });
                    }
                } catch (error) {
                    healthReport.components[componentName] = {
                        status: 'error',
                        message: error.message
                    };
                    healthReport.issues.push({
                        component: componentName,
                        status: 'error',
                        message: error.message
                    });
                }
            }
        }

        // Determinar salud general
        if (healthReport.issues.length > 0) {
            const criticalIssues = healthReport.issues.filter(issue => 
                issue.status === 'critical' || issue.status === 'error'
            );
            
            if (criticalIssues.length > 0) {
                healthReport.overall = 'critical';
            } else {
                healthReport.overall = 'degraded';
            }
        }

        // Emitir reporte de salud
        window.MAIRA.Events.emit('system_health_report', healthReport);

        // Log si hay problemas
        if (healthReport.overall !== 'healthy') {
            console.warn('[IntegrationSystem] Problemas de salud detectados:', healthReport);
        }
    }

    /**
     * Métodos de verificación de salud por componente
     */
    checkMemoryManagerHealth() {
        const memoryManager = window.MAIRA.MemoryManager;
        if (!memoryManager) {
            return { status: 'error', message: 'MemoryManager no disponible' };
        }

        const stats = memoryManager.getMemoryStats();
        if (stats.system.usagePercentage > 90) {
            return { status: 'critical', message: 'Uso de memoria crítico' };
        } else if (stats.system.usagePercentage > 75) {
            return { status: 'warning', message: 'Uso de memoria alto' };
        }

        return { status: 'healthy', message: 'Memoria funcionando correctamente' };
    }

    checkSecurityManagerHealth() {
        const securityManager = window.MAIRA.SecurityManager;
        if (!securityManager) {
            return { status: 'error', message: 'SecurityManager no disponible' };
        }

        const config = securityManager.getSecurityConfig();
        if (!config.features.csrfProtection) {
            return { status: 'warning', message: 'Protección CSRF deshabilitada' };
        }

        return { status: 'healthy', message: 'Seguridad funcionando correctamente' };
    }

    checkErrorRecoveryHealth() {
        const errorRecovery = window.MAIRA.ErrorRecoveryManager;
        if (!errorRecovery) {
            return { status: 'error', message: 'ErrorRecoveryManager no disponible' };
        }

        const stats = errorRecovery.getErrorStats();
        if (stats.total.critical > 5) {
            return { status: 'warning', message: 'Múltiples errores críticos recientes' };
        }

        return { status: 'healthy', message: 'Recuperación de errores funcionando correctamente' };
    }

    checkPerformanceMonitorHealth() {
        const performanceMonitor = window.MAIRA.PerformanceMonitor;
        if (!performanceMonitor) {
            return { status: 'error', message: 'PerformanceMonitor no disponible' };
        }

        const report = performanceMonitor.getPerformanceReport();
        if (report.systemHealth < 50) {
            return { status: 'critical', message: 'Salud del sistema baja' };
        } else if (report.systemHealth < 75) {
            return { status: 'warning', message: 'Salud del sistema degradada' };
        }

        return { status: 'healthy', message: 'Rendimiento funcionando correctamente' };
    }

    checkModularArchitectHealth() {
        const modularArchitect = window.MAIRA.ModularArchitect;
        if (!modularArchitect) {
            return { status: 'error', message: 'ModularArchitect no disponible' };
        }

        const state = modularArchitect.getSystemState();
        const loadedRatio = state.loadedModules.length / state.registeredModules.length;
        
        if (loadedRatio < 0.5) {
            return { status: 'warning', message: 'Menos del 50% de módulos cargados' };
        }

        return { status: 'healthy', message: 'Arquitectura modular funcionando correctamente' };
    }

    checkGamingMechanicsHealth() {
        const gamingMechanics = window.MAIRA.GamingMechanicsManager;
        if (!gamingMechanics) {
            return { status: 'warning', message: 'GamingMechanicsManager no disponible (opcional)' };
        }

        return { status: 'healthy', message: 'Gaming mechanics funcionando correctamente' };
    }

    /**
     * Intenta recuperación del sistema
     */
    async attemptSystemRecovery(error) {
        console.log('[IntegrationSystem] Intentando recuperación del sistema...');

        try {
            // Limpiar memoria
            if (window.MAIRA.MemoryManager) {
                window.MAIRA.MemoryManager.emergencyCleanup();
            }

            // Reinicializar componentes no críticos
            const nonCriticalComponents = Array.from(this.components.entries())
                .filter(([name, config]) => !config.critical)
                .map(([name]) => name);

            for (const componentName of nonCriticalComponents) {
                try {
                    await this.initializeComponent(componentName);
                } catch (componentError) {
                    console.warn(`[IntegrationSystem] No se pudo recuperar ${componentName}:`, componentError);
                }
            }

            console.log('[IntegrationSystem] Recuperación del sistema completada parcialmente');

        } catch (recoveryError) {
            console.error('[IntegrationSystem] Fallo en recuperación del sistema:', recoveryError);
            throw recoveryError;
        }
    }

    /**
     * API pública para obtener estado del sistema
     */
    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            components: Array.from(this.components.entries()).map(([name, config]) => ({
                name: name,
                loaded: !!config.instance,
                critical: config.critical,
                dependencies: config.dependencies
            })),
            initializationOrder: this.initializationOrder,
            version: '2.0.0'
        };
    }

    /**
     * Limpieza y cierre del sistema
     */
    shutdown() {
        console.log('[IntegrationSystem] Iniciando cierre del sistema...');

        // Detener monitoreo de salud
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        // Cerrar componentes en orden inverso
        const shutdownOrder = [...this.initializationOrder].reverse();
        
        for (const componentName of shutdownOrder) {
            const component = this.components.get(componentName);
            if (component.instance && typeof component.instance.shutdown === 'function') {
                try {
                    component.instance.shutdown();
                } catch (error) {
                    console.warn(`[IntegrationSystem] Error cerrando ${componentName}:`, error);
                }
            }
        }

        this.isInitialized = false;
        console.log('[IntegrationSystem] Sistema cerrado');
    }
}

// Inicializar el sistema de integración
window.MAIRA = window.MAIRA || {};
window.MAIRA.IntegrationSystem = new IntegrationSystem();

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await window.MAIRA.IntegrationSystem.initializeSystem();
        } catch (error) {
            console.error('[MAIRA] Error en inicialización automática:', error);
        }
    });
} else {
    // DOM ya está listo, inicializar inmediatamente
    setTimeout(async () => {
        try {
            await window.MAIRA.IntegrationSystem.initializeSystem();
        } catch (error) {
            console.error('[MAIRA] Error en inicialización automática:', error);
        }
    }, 1000);
}

console.log('[MAIRA] IntegrationSystem cargado y listo para inicialización');
