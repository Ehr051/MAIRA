/**
 * 🗂️ MAIRA Module Organization System
 * Sistema avanzado de organización modular para MAIRA
 * Implementa arquitectura limpia y separación de responsabilidades
 */

class ModuleOrganizationSystem {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
        this.loadOrder = [];
        this.isInitialized = false;
        this.moduleStates = new Map();
        this.loadingPromises = new Map();
        
        console.log('🗂️ ModuleOrganizationSystem initialized');
        this.initializeSystem();
    }

    /**
     * Inicializa el sistema de organización modular
     */
    initializeSystem() {
        this.setupModuleStructure();
        this.defineModuleCategories();
        this.createModuleLoader();
        this.setupDependencyResolver();
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('✅ Module organization system active');
    }

    /**
     * Define la estructura modular de MAIRA
     */
    setupModuleStructure() {
        this.moduleStructure = {
            // Módulos Core - Fundamentales del sistema
            core: {
                path: 'core/',
                dependencies: [],
                priority: 1,
                modules: [
                    'SecurityManager',
                    'ErrorHandlerManager', 
                    'MemoryCleanupManager',
                    'EventBusManager',
                    'StateManager'
                ]
            },

            // Módulos de Utilidades - Herramientas comunes
            utils: {
                path: 'utils/',
                dependencies: ['core'],
                priority: 2,
                modules: [
                    'CamelCaseConverter',
                    'ConfigurationManager',
                    'LoggingSystem',
                    'PerformanceMonitor',
                    'LocalStorageManager'
                ]
            },

            // Módulos de UI - Interfaz de usuario
            ui: {
                path: 'components/',
                dependencies: ['core', 'utils'],
                priority: 3,
                modules: [
                    'MobileTouchManager',
                    'ResponsiveUIManager',
                    'ToolbarManager',
                    'ModalSystem',
                    'NotificationSystem'
                ]
            },

            // Módulos de Juego - Mecánicas de gamificación
            gaming: {
                path: 'components/',
                dependencies: ['core', 'utils', 'ui'],
                priority: 4,
                modules: [
                    'GamingMechanicsManager',
                    'AchievementSystem',
                    'MissionSystem',
                    'LeaderboardManager'
                ]
            },

            // Módulos Militares - Funcionalidad específica militar
            military: {
                path: 'modules/military/',
                dependencies: ['core', 'utils', 'ui'],
                priority: 5,
                modules: [
                    'UnitManager',
                    'BattleSystem',
                    'TacticalPlanning',
                    'CommunicationSystem',
                    'IntelligenceModule'
                ]
            },

            // Módulos de Mapa - Funcionalidad cartográfica
            mapping: {
                path: 'modules/mapping/',
                dependencies: ['core', 'utils', 'military'],
                priority: 6,
                modules: [
                    'MapRenderer',
                    'LayerManager',
                    'CoordinateSystem',
                    'ElevationManager',
                    'TileManager'
                ]
            },

            // Módulos de Comunicación - Chat y transmisiones
            communication: {
                path: 'modules/communication/',
                dependencies: ['core', 'utils', 'military'],
                priority: 7,
                modules: [
                    'ChatSystem',
                    'RadioProtocol',
                    'EncryptionModule',
                    'BroadcastManager'
                ]
            },

            // Módulos de Datos - Gestión de información
            data: {
                path: 'modules/data/',
                dependencies: ['core', 'utils'],
                priority: 3,
                modules: [
                    'DatabaseManager',
                    'CacheSystem',
                    'SyncManager',
                    'BackupSystem'
                ]
            }
        };

        console.log('🏗️ Module structure defined');
    }

    /**
     * Define categorías de módulos
     */
    defineModuleCategories() {
        this.moduleCategories = {
            // Módulos críticos - Se cargan primero y son indispensables
            critical: [
                'SecurityManager',
                'ErrorHandlerManager',
                'MemoryCleanupManager',
                'EventBusManager',
                'StateManager'
            ],

            // Módulos esenciales - Necesarios para operación básica
            essential: [
                'CamelCaseConverter',
                'ConfigurationManager',
                'LoggingSystem',
                'MapRenderer',
                'UnitManager'
            ],

            // Módulos de mejora - Agregan funcionalidad pero no son críticos
            enhancement: [
                'GamingMechanicsManager',
                'MobileTouchManager',
                'ResponsiveUIManager',
                'AchievementSystem'
            ],

            // Módulos opcionales - Se pueden cargar bajo demanda
            optional: [
                'LeaderboardManager',
                'EncryptionModule',
                'BackupSystem'
            ]
        };

        console.log('📂 Module categories defined');
    }

    /**
     * Crea el sistema de carga de módulos
     */
    createModuleLoader() {
        this.moduleLoader = {
            /**
             * Carga un módulo específico
             * @param {string} moduleName - Nombre del módulo
             * @param {string} category - Categoría del módulo
             * @returns {Promise} Promesa de carga
             */
            async loadModule(moduleName, category) {
                try {
                    const moduleInfo = this.findModuleInfo(moduleName);
                    if (!moduleInfo) {
                        throw new Error(`Module ${moduleName} not found in structure`);
                    }

                    // Verificar dependencias
                    await this.resolveDependencies(moduleInfo.category);

                    // Cargar módulo si no está ya cargado
                    if (!this.modules.has(moduleName)) {
                        const modulePath = `${moduleInfo.path}${moduleName}.js`;
                        const moduleInstance = await this.loadModuleFile(modulePath, moduleName);
                        
                        this.modules.set(moduleName, moduleInstance);
                        this.moduleStates.set(moduleName, 'loaded');
                        
                        console.log(`✅ Module loaded: ${moduleName}`);
                    }

                    return this.modules.get(moduleName);
                } catch (error) {
                    console.error(`❌ Failed to load module ${moduleName}:`, error);
                    this.moduleStates.set(moduleName, 'error');
                    throw error;
                }
            },

            /**
             * Carga archivo de módulo
             * @param {string} path - Ruta del archivo
             * @param {string} name - Nombre del módulo
             * @returns {Promise} Instancia del módulo
             */
            async loadModuleFile(path, name) {
                // Si ya está en window.MAIRA, usar esa instancia
                if (window.MAIRA && window.MAIRA[name]) {
                    return window.MAIRA[name];
                }

                // Intentar cargar dinámicamente
                try {
                    const script = document.createElement('script');
                    script.src = path;
                    script.async = true;

                    const loadPromise = new Promise((resolve, reject) => {
                        script.onload = () => {
                            // Verificar si el módulo está disponible
                            if (window.MAIRA && window.MAIRA[name]) {
                                resolve(window.MAIRA[name]);
                            } else {
                                reject(new Error(`Module ${name} not found after load`));
                            }
                        };
                        script.onerror = () => reject(new Error(`Failed to load ${path}`));
                    });

                    document.head.appendChild(script);
                    return await loadPromise;
                } catch (error) {
                    console.warn(`Could not dynamically load ${name}, checking if already available`);
                    
                    // Verificar si está disponible globalmente
                    if (window[name]) {
                        return window[name];
                    }
                    
                    throw error;
                }
            }
        };
    }

    /**
     * Configura el resolvedor de dependencias
     */
    setupDependencyResolver() {
        this.dependencyResolver = {
            /**
             * Resuelve dependencias de una categoría
             * @param {string} category - Categoría a resolver
             * @returns {Promise} Promesa de resolución
             */
            async resolveDependencies(category) {
                const categoryInfo = this.moduleStructure[category];
                if (!categoryInfo || !categoryInfo.dependencies) return;

                // Cargar dependencias en orden
                for (const dep of categoryInfo.dependencies) {
                    await this.loadCategory(dep);
                }
            },

            /**
             * Calcula el orden de carga óptimo
             * @returns {Array} Orden de carga
             */
            calculateLoadOrder() {
                const ordered = [];
                const visited = new Set();
                const visiting = new Set();

                const visit = (category) => {
                    if (visiting.has(category)) {
                        throw new Error(`Circular dependency detected: ${category}`);
                    }
                    if (visited.has(category)) return;

                    visiting.add(category);
                    
                    const categoryInfo = this.moduleStructure[category];
                    if (categoryInfo && categoryInfo.dependencies) {
                        categoryInfo.dependencies.forEach(dep => visit(dep));
                    }

                    visiting.delete(category);
                    visited.add(category);
                    ordered.push(category);
                };

                // Visitar todas las categorías
                Object.keys(this.moduleStructure).forEach(category => visit(category));
                
                return ordered;
            }
        };
    }

    /**
     * Vincula eventos del sistema
     */
    bindEvents() {
        // Escuchar eventos de carga de módulos
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.on('module:request', async (data) => {
                await this.loadModule(data.name, data.category);
            });

            window.MAIRA.Events.on('module:unload', (data) => {
                this.unloadModule(data.name);
            });

            window.MAIRA.Events.on('system:initialization', () => {
                this.initializeAllModules();
            });
        }

        console.log('🔗 Module organization events bound');
    }

    /**
     * Carga todos los módulos en orden
     * @returns {Promise} Promesa de carga completa
     */
    async initializeAllModules() {
        console.log('🚀 Starting module initialization...');
        
        try {
            // Calcular orden de carga
            this.loadOrder = this.dependencyResolver.calculateLoadOrder();
            console.log('📋 Load order calculated:', this.loadOrder);

            // Cargar por categorías en orden
            for (const category of this.loadOrder) {
                await this.loadCategory(category);
            }

            // Inicializar módulos críticos primero
            await this.initializeCriticalModules();

            console.log('✅ All modules initialized successfully');
            this.emitEvent('modules:initialized', { 
                loadOrder: this.loadOrder,
                loadedModules: Array.from(this.modules.keys())
            });

        } catch (error) {
            console.error('❌ Module initialization failed:', error);
            this.emitEvent('modules:initialization:failed', { error });
            throw error;
        }
    }

    /**
     * Carga una categoría completa de módulos
     * @param {string} category - Categoría a cargar
     * @returns {Promise} Promesa de carga
     */
    async loadCategory(category) {
        const categoryInfo = this.moduleStructure[category];
        if (!categoryInfo) {
            console.warn(`Category ${category} not found`);
            return;
        }

        console.log(`📂 Loading category: ${category}`);

        // Resolver dependencias primero
        await this.dependencyResolver.resolveDependencies(category);

        // Cargar módulos de la categoría
        const loadPromises = categoryInfo.modules.map(async (moduleName) => {
            try {
                await this.moduleLoader.loadModule(moduleName, category);
            } catch (error) {
                console.error(`Failed to load ${moduleName} in ${category}:`, error);
                // No detener la carga de otros módulos
            }
        });

        await Promise.allSettled(loadPromises);
        console.log(`✅ Category ${category} loaded`);
    }

    /**
     * Inicializa módulos críticos
     * @returns {Promise} Promesa de inicialización
     */
    async initializeCriticalModules() {
        console.log('🔒 Initializing critical modules...');

        for (const moduleName of this.moduleCategories.critical) {
            const module = this.modules.get(moduleName);
            if (module && typeof module.initialize === 'function') {
                try {
                    await module.initialize();
                    console.log(`✅ Critical module initialized: ${moduleName}`);
                } catch (error) {
                    console.error(`❌ Failed to initialize critical module ${moduleName}:`, error);
                }
            }
        }
    }

    /**
     * Carga un módulo específico bajo demanda
     * @param {string} moduleName - Nombre del módulo
     * @param {string} category - Categoría del módulo
     * @returns {Promise} Instancia del módulo
     */
    async loadModule(moduleName, category = null) {
        // Si ya está cargando, esperar
        if (this.loadingPromises.has(moduleName)) {
            return await this.loadingPromises.get(moduleName);
        }

        // Si ya está cargado, retornar
        if (this.modules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        // Iniciar carga
        const loadPromise = this.moduleLoader.loadModule(moduleName, category);
        this.loadingPromises.set(moduleName, loadPromise);

        try {
            const module = await loadPromise;
            this.loadingPromises.delete(moduleName);
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Descarga un módulo
     * @param {string} moduleName - Nombre del módulo
     */
    unloadModule(moduleName) {
        const module = this.modules.get(moduleName);
        
        if (module) {
            // Llamar cleanup si existe
            if (typeof module.cleanup === 'function') {
                try {
                    module.cleanup();
                } catch (error) {
                    console.error(`Error cleaning up module ${moduleName}:`, error);
                }
            }

            this.modules.delete(moduleName);
            this.moduleStates.set(moduleName, 'unloaded');
            
            console.log(`🗑️ Module unloaded: ${moduleName}`);
            this.emitEvent('module:unloaded', { name: moduleName });
        }
    }

    /**
     * Obtiene información de un módulo
     * @param {string} moduleName - Nombre del módulo
     * @returns {Object|null} Información del módulo
     */
    getModuleInfo(moduleName) {
        return this.findModuleInfo(moduleName);
    }

    /**
     * Busca información de un módulo en la estructura
     * @param {string} moduleName - Nombre del módulo
     * @returns {Object|null} Información encontrada
     */
    findModuleInfo(moduleName) {
        for (const [categoryName, categoryInfo] of Object.entries(this.moduleStructure)) {
            if (categoryInfo.modules.includes(moduleName)) {
                return {
                    name: moduleName,
                    category: categoryName,
                    path: categoryInfo.path,
                    dependencies: categoryInfo.dependencies,
                    priority: categoryInfo.priority
                };
            }
        }
        return null;
    }

    /**
     * Verifica el estado de un módulo
     * @param {string} moduleName - Nombre del módulo
     * @returns {string} Estado del módulo
     */
    getModuleState(moduleName) {
        return this.moduleStates.get(moduleName) || 'not-loaded';
    }

    /**
     * Verifica si un módulo está cargado
     * @param {string} moduleName - Nombre del módulo
     * @returns {boolean} Si está cargado
     */
    isModuleLoaded(moduleName) {
        return this.modules.has(moduleName) && this.moduleStates.get(moduleName) === 'loaded';
    }

    /**
     * Obtiene lista de módulos cargados
     * @returns {Array} Lista de módulos cargados
     */
    getLoadedModules() {
        return Array.from(this.modules.keys()).filter(name => 
            this.moduleStates.get(name) === 'loaded'
        );
    }

    /**
     * Obtiene lista de módulos por categoría
     * @param {string} category - Categoría
     * @returns {Array} Módulos de la categoría
     */
    getModulesByCategory(category) {
        const categoryInfo = this.moduleStructure[category];
        return categoryInfo ? categoryInfo.modules : [];
    }

    /**
     * Verifica dependencias de un módulo
     * @param {string} moduleName - Nombre del módulo
     * @returns {Object} Estado de dependencias
     */
    checkDependencies(moduleName) {
        const moduleInfo = this.findModuleInfo(moduleName);
        if (!moduleInfo) return { satisfied: false, missing: [] };

        const missing = [];
        const dependencies = this.moduleStructure[moduleInfo.category]?.dependencies || [];

        for (const dep of dependencies) {
            const depModules = this.getModulesByCategory(dep);
            const loadedDepModules = depModules.filter(mod => this.isModuleLoaded(mod));
            
            if (loadedDepModules.length === 0) {
                missing.push(dep);
            }
        }

        return {
            satisfied: missing.length === 0,
            missing,
            required: dependencies
        };
    }

    /**
     * Recarga un módulo
     * @param {string} moduleName - Nombre del módulo
     * @returns {Promise} Promesa de recarga
     */
    async reloadModule(moduleName) {
        console.log(`🔄 Reloading module: ${moduleName}`);
        
        this.unloadModule(moduleName);
        
        // Pequeña pausa para asegurar limpieza
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const moduleInfo = this.findModuleInfo(moduleName);
        return await this.loadModule(moduleName, moduleInfo?.category);
    }

    /**
     * Emite evento
     * @param {string} eventName - Nombre del evento
     * @param {Object} data - Datos del evento
     */
    emitEvent(eventName, data) {
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.emit(`modules:${eventName}`, data);
        }
    }

    /**
     * Obtiene estadísticas del sistema
     * @returns {Object} Estadísticas
     */
    getStats() {
        const totalModules = Object.values(this.moduleStructure)
            .reduce((total, category) => total + category.modules.length, 0);
        
        const loadedCount = this.getLoadedModules().length;
        const errorCount = Array.from(this.moduleStates.values())
            .filter(state => state === 'error').length;

        return {
            isInitialized: this.isInitialized,
            totalModules,
            loadedModules: loadedCount,
            loadingModules: this.loadingPromises.size,
            errorModules: errorCount,
            loadOrder: this.loadOrder,
            moduleStates: Object.fromEntries(this.moduleStates),
            categories: Object.keys(this.moduleStructure),
            loadProgress: Math.round((loadedCount / totalModules) * 100)
        };
    }

    /**
     * Obtiene mapa de dependencias visual
     * @returns {Object} Mapa de dependencias
     */
    getDependencyMap() {
        const map = {};
        
        Object.entries(this.moduleStructure).forEach(([category, info]) => {
            map[category] = {
                modules: info.modules,
                dependencies: info.dependencies,
                dependents: []
            };
        });

        // Calcular dependientes
        Object.entries(this.moduleStructure).forEach(([category, info]) => {
            if (info.dependencies) {
                info.dependencies.forEach(dep => {
                    if (map[dep]) {
                        map[dep].dependents.push(category);
                    }
                });
            }
        });

        return map;
    }

    /**
     * Exporta configuración del sistema
     * @returns {Object} Configuración completa
     */
    exportConfiguration() {
        return {
            moduleStructure: this.moduleStructure,
            moduleCategories: this.moduleCategories,
            loadOrder: this.loadOrder,
            moduleStates: Object.fromEntries(this.moduleStates),
            dependencyMap: this.getDependencyMap()
        };
    }
}

// Inicializar ModuleOrganizationSystem globalmente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.Modules = new ModuleOrganizationSystem();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleOrganizationSystem;
}

console.log('🗂️ MAIRA Module Organization System loaded and active');
