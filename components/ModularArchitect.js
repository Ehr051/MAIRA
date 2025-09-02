/**
 * MAIRA Modular Architect
 * Redefine la arquitectura del sistema con patrones modulares modernos
 * Implementa dependency injection, lazy loading y comunicación entre módulos
 */

class ModularArchitect {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.moduleConfig = new Map();
        this.eventBus = new EventTarget();
        this.injector = new DependencyInjector();
        
        this.initializeCoreModules();
        this.setupModuleLoader();
        
        console.log('[ModularArchitect] Sistema de arquitectura modular inicializado');
    }

    /**
     * Define la estructura modular del sistema MAIRA
     */
    initializeCoreModules() {
        // Módulo de mapas y visualización
        this.registerModule('MapRenderer', {
            path: '/Client/js/mapas.js',
            dependencies: ['EventSystem', 'MemoryManager'],
            lazy: false, // Core module
            config: {
                defaultZoom: 10,
                maxZoom: 18,
                enableTiles: true
            },
            interfaces: ['IRenderer', 'IEventEmitter']
        });

        // Módulo de símbolos militares
        this.registerModule('MilitarySymbols', {
            path: '/Client/js/simbolosP.js',
            dependencies: ['MapRenderer', 'EventSystem'],
            lazy: true,
            config: {
                symbolLibrary: 'milsymbol',
                defaultScale: 1.0,
                cacheSymbols: true
            },
            interfaces: ['ISymbolRenderer', 'ISymbolManager']
        });

        // Módulo de gestión de turnos
        this.registerModule('TurnManager', {
            path: '/Client/js/gestorTurnos.js',
            dependencies: ['EventSystem', 'GamingMechanics'],
            lazy: true,
            config: {
                turnDuration: 300, // 5 minutos
                autoAdvance: false
            },
            interfaces: ['ITurnManager', 'IEventEmitter']
        });

        // Módulo de mecánicas de juego
        this.registerModule('GamingMechanics', {
            path: '/components/GamingMechanicsManager.js',
            dependencies: ['EventSystem', 'SecurityManager'],
            lazy: false,
            config: {
                enableActionLogging: true,
                maxParticipants: 50
            },
            interfaces: ['IGamingManager', 'IActionLogger']
        });

        // Módulo de elevación y TIF
        this.registerModule('ElevationManager', {
            path: '/Client/js/elevation.js',
            dependencies: ['MemoryManager', 'ErrorRecovery'],
            lazy: true,
            config: {
                tileSize: 512,
                cacheSize: 100,
                compressionLevel: 0.8
            },
            interfaces: ['IElevationProvider', 'ITIFProcessor']
        });

        // Módulo de hexágonos
        this.registerModule('HexagonSystem', {
            path: '/Client/js/hexagonos.js',
            dependencies: ['MapRenderer', 'MemoryManager'],
            lazy: true,
            config: {
                hexSize: 20,
                enableSelection: true,
                maxHexagons: 10000
            },
            interfaces: ['IHexagonManager', 'ISelectable']
        });

        // Módulo de UI y controles
        this.registerModule('UIManager', {
            path: '/Client/js/ui.js',
            dependencies: ['EventSystem'],
            lazy: false,
            config: {
                theme: 'military',
                responsive: true
            },
            interfaces: ['IUIManager', 'INotificationSystem']
        });

        // Módulo de archivos y uploads
        this.registerModule('FileManager', {
            path: '/Client/js/files.js',
            dependencies: ['SecurityManager', 'MemoryManager'],
            lazy: true,
            config: {
                maxFileSize: 50 * 1024 * 1024, // 50MB
                allowedTypes: ['.tif', '.tiff', '.json'],
                enableCompression: true
            },
            interfaces: ['IFileManager', 'IUploadHandler']
        });

        // Sistema de eventos (core)
        this.registerModule('EventSystem', {
            path: '/components/EventSystem.js',
            dependencies: [],
            lazy: false,
            config: {
                maxListeners: 100,
                enableLogging: true
            },
            interfaces: ['IEventSystem', 'IEventEmitter', 'IEventListener'],
            singleton: true
        });
    }

    /**
     * Registra un nuevo módulo en el sistema
     */
    registerModule(name, config) {
        this.modules.set(name, {
            name: name,
            ...config,
            instance: null,
            loaded: false,
            loading: false
        });

        // Registrar dependencias
        if (config.dependencies && config.dependencies.length > 0) {
            this.dependencies.set(name, config.dependencies);
        }

        // Guardar configuración
        if (config.config) {
            this.moduleConfig.set(name, config.config);
        }

        console.log(`[ModularArchitect] Módulo '${name}' registrado`);
    }

    /**
     * Configura el sistema de carga de módulos
     */
    setupModuleLoader() {
        // Cargar módulos core inmediatamente
        this.loadCoreModules();

        // Configurar lazy loading para módulos opcionales
        this.setupLazyLoading();
    }

    /**
     * Carga módulos esenciales del sistema
     */
    async loadCoreModules() {
        const coreModules = Array.from(this.modules.values())
            .filter(module => !module.lazy)
            .map(module => module.name);

        console.log('[ModularArchitect] Cargando módulos core:', coreModules);

        try {
            await this.loadModules(coreModules);
            console.log('[ModularArchitect] Módulos core cargados exitosamente');
            
            this.emitEvent('core_modules_loaded', { modules: coreModules });
        } catch (error) {
            console.error('[ModularArchitect] Error cargando módulos core:', error);
            throw error;
        }
    }

    /**
     * Configura lazy loading para módulos opcionales
     */
    setupLazyLoading() {
        // Observar eventos que requieren módulos específicos
        this.eventBus.addEventListener('module_required', async (event) => {
            const { moduleName, context } = event.detail;
            
            if (!this.isModuleLoaded(moduleName)) {
                try {
                    await this.loadModule(moduleName);
                    this.emitEvent('module_lazy_loaded', { 
                        module: moduleName, 
                        context: context 
                    });
                } catch (error) {
                    console.error(`[ModularArchitect] Error en lazy loading de ${moduleName}:`, error);
                    this.emitEvent('module_load_failed', { 
                        module: moduleName, 
                        error: error.message 
                    });
                }
            }
        });

        // Interceptors para detectar uso de módulos
        this.setupModuleInterceptors();
    }

    /**
     * Configura interceptors para detectar cuando se necesita un módulo
     */
    setupModuleInterceptors() {
        // Interceptor para símbolos militares
        const originalCreateSymbol = window.crearSimbolo;
        if (originalCreateSymbol) {
            window.crearSimbolo = async (...args) => {
                await this.requireModule('MilitarySymbols');
                return originalCreateSymbol.apply(this, args);
            };
        }

        // Interceptor para archivos TIF
        const originalProcessTIF = window.procesarTIF;
        if (originalProcessTIF) {
            window.procesarTIF = async (...args) => {
                await this.requireModule('ElevationManager');
                return originalProcessTIF.apply(this, args);
            };
        }

        // Interceptor para hexágonos
        const originalHexagon = window.mostrarHexagonos;
        if (originalHexagon) {
            window.mostrarHexagonos = async (...args) => {
                await this.requireModule('HexagonSystem');
                return originalHexagon.apply(this, args);
            };
        }
    }

    /**
     * Carga múltiples módulos respetando dependencias
     */
    async loadModules(moduleNames) {
        const loadOrder = this.resolveDependencies(moduleNames);
        
        for (const moduleName of loadOrder) {
            if (!this.isModuleLoaded(moduleName)) {
                await this.loadModule(moduleName);
            }
        }
    }

    /**
     * Carga un módulo específico
     */
    async loadModule(moduleName) {
        const moduleConfig = this.modules.get(moduleName);
        if (!moduleConfig) {
            throw new Error(`Módulo '${moduleName}' no registrado`);
        }

        // Si ya está cargado, retornar instancia
        if (moduleConfig.loaded && moduleConfig.instance) {
            return moduleConfig.instance;
        }

        // Si está en proceso de carga, esperar
        if (this.loadingPromises.has(moduleName)) {
            return await this.loadingPromises.get(moduleName);
        }

        // Iniciar carga
        const loadingPromise = this.performModuleLoad(moduleConfig);
        this.loadingPromises.set(moduleName, loadingPromise);

        try {
            const instance = await loadingPromise;
            this.loadingPromises.delete(moduleName);
            return instance;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Realiza la carga efectiva del módulo
     */
    async performModuleLoad(moduleConfig) {
        console.log(`[ModularArchitect] Cargando módulo: ${moduleConfig.name}`);

        try {
            // Marcar como cargándose
            moduleConfig.loading = true;

            // Cargar dependencias primero
            if (moduleConfig.dependencies && moduleConfig.dependencies.length > 0) {
                await this.loadModules(moduleConfig.dependencies);
            }

            // Cargar el script del módulo
            const moduleClass = await this.loadModuleScript(moduleConfig);

            // Crear instancia con dependency injection
            const dependencies = this.resolveDependencyInstances(moduleConfig.dependencies || []);
            const config = this.moduleConfig.get(moduleConfig.name) || {};
            
            const instance = this.injector.createInstance(moduleClass, dependencies, config);

            // Configurar instancia
            if (instance && typeof instance.initialize === 'function') {
                await instance.initialize();
            }

            // Marcar como cargado
            moduleConfig.instance = instance;
            moduleConfig.loaded = true;
            moduleConfig.loading = false;
            this.loadedModules.add(moduleConfig.name);

            console.log(`[ModularArchitect] Módulo '${moduleConfig.name}' cargado exitosamente`);
            
            this.emitEvent('module_loaded', { 
                module: moduleConfig.name, 
                instance: instance 
            });

            return instance;

        } catch (error) {
            moduleConfig.loading = false;
            console.error(`[ModularArchitect] Error cargando módulo '${moduleConfig.name}':`, error);
            throw error;
        }
    }

    /**
     * Carga el script de un módulo
     */
    async loadModuleScript(moduleConfig) {
        // Si es un módulo interno ya cargado
        if (moduleConfig.path.startsWith('/components/')) {
            const moduleName = moduleConfig.path.split('/').pop().replace('.js', '');
            if (window[moduleName]) {
                return window[moduleName];
            }
        }

        // Cargar script dinámicamente
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = moduleConfig.path;
            script.async = true;
            
            script.onload = () => {
                // Intentar obtener la clase/función del módulo
                const moduleName = moduleConfig.name;
                const moduleClass = window[moduleName] || window.MAIRA?.[moduleName];
                
                if (moduleClass) {
                    resolve(moduleClass);
                } else {
                    reject(new Error(`Clase '${moduleName}' no encontrada después de cargar script`));
                }
            };
            
            script.onerror = () => {
                reject(new Error(`Error cargando script: ${moduleConfig.path}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Resuelve las dependencias de instancias de módulos
     */
    resolveDependencyInstances(dependencies) {
        const instances = {};
        
        for (const depName of dependencies) {
            const depModule = this.modules.get(depName);
            if (depModule && depModule.instance) {
                instances[depName] = depModule.instance;
            }
        }
        
        return instances;
    }

    /**
     * Resuelve el orden de carga basado en dependencias
     */
    resolveDependencies(moduleNames) {
        const resolved = [];
        const resolving = new Set();
        
        const resolve = (moduleName) => {
            if (resolved.includes(moduleName)) {
                return;
            }
            
            if (resolving.has(moduleName)) {
                throw new Error(`Dependencia circular detectada: ${moduleName}`);
            }
            
            resolving.add(moduleName);
            
            const dependencies = this.dependencies.get(moduleName) || [];
            for (const dep of dependencies) {
                resolve(dep);
            }
            
            resolving.delete(moduleName);
            resolved.push(moduleName);
        };
        
        for (const moduleName of moduleNames) {
            resolve(moduleName);
        }
        
        return resolved;
    }

    /**
     * Requiere un módulo (carga si es necesario)
     */
    async requireModule(moduleName) {
        if (this.isModuleLoaded(moduleName)) {
            return this.getModule(moduleName);
        }

        this.emitEvent('module_required', { moduleName: moduleName });
        return await this.loadModule(moduleName);
    }

    /**
     * Verifica si un módulo está cargado
     */
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Obtiene instancia de un módulo cargado
     */
    getModule(moduleName) {
        const moduleConfig = this.modules.get(moduleName);
        return moduleConfig ? moduleConfig.instance : null;
    }

    /**
     * Obtiene configuración de un módulo
     */
    getModuleConfig(moduleName) {
        return this.moduleConfig.get(moduleName) || {};
    }

    /**
     * Actualiza configuración de un módulo
     */
    updateModuleConfig(moduleName, newConfig) {
        const existingConfig = this.moduleConfig.get(moduleName) || {};
        const mergedConfig = { ...existingConfig, ...newConfig };
        this.moduleConfig.set(moduleName, mergedConfig);

        // Notificar al módulo si está cargado
        const module = this.getModule(moduleName);
        if (module && typeof module.updateConfig === 'function') {
            module.updateConfig(mergedConfig);
        }

        this.emitEvent('module_config_updated', { 
            module: moduleName, 
            config: mergedConfig 
        });
    }

    /**
     * Emite eventos del sistema modular
     */
    emitEvent(eventType, data) {
        const event = new CustomEvent(eventType, { detail: data });
        this.eventBus.dispatchEvent(event);

        // También emitir en el sistema global de eventos si existe
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit(`modular_${eventType}`, data);
        }
    }

    /**
     * Obtiene estado del sistema modular
     */
    getSystemState() {
        return {
            registeredModules: Array.from(this.modules.keys()),
            loadedModules: Array.from(this.loadedModules),
            loadingModules: Array.from(this.loadingPromises.keys()),
            dependencyGraph: Object.fromEntries(this.dependencies),
            memoryUsage: this.calculateMemoryUsage()
        };
    }

    /**
     * Calcula uso de memoria aproximado
     */
    calculateMemoryUsage() {
        let totalSize = 0;
        
        for (const [name, module] of this.modules.entries()) {
            if (module.instance) {
                // Estimación básica
                totalSize += 1024; // Base overhead
                if (module.instance.constructor) {
                    totalSize += module.instance.constructor.toString().length;
                }
            }
        }

        return {
            estimated: totalSize,
            loadedModules: this.loadedModules.size,
            totalRegistered: this.modules.size
        };
    }
}

/**
 * Dependency Injector para gestión de dependencias
 */
class DependencyInjector {
    constructor() {
        this.singletons = new Map();
    }

    createInstance(ClassConstructor, dependencies = {}, config = {}) {
        // Para singletons, verificar si ya existe
        if (ClassConstructor.isSingleton && this.singletons.has(ClassConstructor)) {
            return this.singletons.get(ClassConstructor);
        }

        // Crear nueva instancia
        const instance = new ClassConstructor(dependencies, config);

        // Guardar singleton si es necesario
        if (ClassConstructor.isSingleton) {
            this.singletons.set(ClassConstructor, instance);
        }

        return instance;
    }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.ModularArchitect = new ModularArchitect();

console.log('[MAIRA] ModularArchitect cargado y operativo');
