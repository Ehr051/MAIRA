/**
 * 📦 Sistema de Módulos MAIRA 4.0
 * Carga y gestión modular preservando compatibilidad total
 */

class ModuleSystem {
    constructor() {
        this.modules = new Map();
        this.dependencies = new Map();
        this.loadOrder = [];
        this.loaded = new Set();
        this.loading = new Set();
        this.failed = new Set();
        
        this.stats = {
            modules_registered: 0,
            modules_loaded: 0,
            load_time_total: 0,
            errors: []
        };
        
        console.log('📦 Sistema de Módulos inicializado');
        this.configurarModulosBase();
    }

    /**
     * Configurar módulos base del sistema MAIRA
     */
    configurarModulosBase() {
        // Módulos críticos que deben cargarse primero
        this.modulosCriticos = [
            'EventBus',
            'SocketHandler', 
            'IniciarPartida',
            'GestorTurnos',
            'GestorFases',
            'JuegoGuerra'
        ];

        // Nuevos módulos especializados
        this.modulosEspecializados = [
            'DirectorManager',
            'DeploymentZoneManager',
            'FogOfWarEngine', 
            'MovementEngine',
            'StatisticsTracker'
        ];

        console.log('📋 Configuración módulos base completada');
    }

    /**
     * Registrar módulo con sus dependencias
     */
    register(name, moduleFactory, dependencies = [], options = {}) {
        // Validar entrada
        if (!name || typeof name !== 'string') {
            throw new Error('Nombre de módulo requerido');
        }

        if (typeof moduleFactory !== 'function' && typeof moduleFactory !== 'object') {
            throw new Error('Módulo debe ser función o objeto');
        }

        const moduleConfig = {
            name: name,
            factory: moduleFactory,
            dependencies: dependencies,
            priority: options.priority || 0,
            lazy: options.lazy || false,
            critical: options.critical || false,
            registered_at: new Date().toISOString()
        };

        this.modules.set(name, moduleConfig);
        this.dependencies.set(name, dependencies);
        this.stats.modules_registered++;
        
        console.log(`📦 Módulo registrado: ${name} (deps: ${dependencies.join(', ') || 'ninguna'})`);
        
        // Auto-cargar si es crítico y no es lazy
        if (moduleConfig.critical && !moduleConfig.lazy) {
            setTimeout(() => this.load(name), 0);
        }
    }

    /**
     * Cargar módulo con sus dependencias
     */
    async load(name) {
        const startTime = performance.now();
        
        try {
            // Verificar si ya está cargado
            if (this.loaded.has(name)) {
                return this.getModule(name);
            }

            // Verificar si está fallando
            if (this.failed.has(name)) {
                throw new Error(`Módulo ${name} falló anteriormente`);
            }

            // Verificar si está cargando (evitar carga circular)
            if (this.loading.has(name)) {
                throw new Error(`Dependencia circular detectada con módulo ${name}`);
            }

            // Verificar que el módulo esté registrado
            if (!this.modules.has(name)) {
                throw new Error(`Módulo ${name} no está registrado`);
            }

            console.log(`📦 Cargando módulo: ${name}...`);
            this.loading.add(name);

            // Cargar dependencias primero
            const deps = this.dependencies.get(name) || [];
            const dependencyInstances = {};

            for (const dep of deps) {
                try {
                    dependencyInstances[dep] = await this.load(dep);
                } catch (error) {
                    throw new Error(`Error cargando dependencia ${dep} para ${name}: ${error.message}`);
                }
            }

            // Cargar el módulo actual
            const moduleConfig = this.modules.get(name);
            let moduleInstance;

            if (typeof moduleConfig.factory === 'function') {
                // Factory function - pasarle las dependencias
                moduleInstance = await moduleConfig.factory(dependencyInstances);
            } else {
                // Objeto directo
                moduleInstance = moduleConfig.factory;
            }

            // Ejecutar inicialización si existe
            if (moduleInstance && typeof moduleInstance.initialize === 'function') {
                await moduleInstance.initialize();
            }

            // Marcar como cargado
            this.loading.delete(name);
            this.loaded.add(name);
            this.loadOrder.push(name);

            // Actualizar estadísticas
            const loadTime = performance.now() - startTime;
            this.stats.modules_loaded++;
            this.stats.load_time_total += loadTime;

            // Emitir evento de módulo cargado
            if (window.MAIRA?.EventBus) {
                window.MAIRA.EventBus.emit('module_loaded', {
                    name: name,
                    instance: moduleInstance,
                    loadTime: loadTime,
                    dependencies: deps
                });
            }

            console.log(`✅ Módulo cargado: ${name} (${loadTime.toFixed(2)}ms)`);
            return moduleInstance;

        } catch (error) {
            this.loading.delete(name);
            this.failed.add(name);
            
            const errorInfo = {
                module: name,
                error: error.message,
                timestamp: new Date().toISOString(),
                loadTime: performance.now() - startTime
            };
            
            this.stats.errors.push(errorInfo);

            console.error(`❌ Error cargando módulo ${name}:`, error);
            
            // Emitir evento de error
            if (window.MAIRA?.EventBus) {
                window.MAIRA.EventBus.emit('module_load_error', errorInfo);
            }

            throw error;
        }
    }

    /**
     * Cargar múltiples módulos en paralelo
     */
    async loadMultiple(moduleNames) {
        const promises = moduleNames.map(name => this.load(name));
        
        try {
            const results = await Promise.allSettled(promises);
            
            const loaded = [];
            const failed = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    loaded.push(moduleNames[index]);
                } else {
                    failed.push({
                        module: moduleNames[index],
                        error: result.reason.message
                    });
                }
            });
            
            console.log(`📦 Carga múltiple completada: ${loaded.length} exitosos, ${failed.length} fallidos`);
            
            return { loaded, failed };
            
        } catch (error) {
            console.error('❌ Error en carga múltiple:', error);
            throw error;
        }
    }

    /**
     * Cargar todos los módulos registrados
     */
    async loadAll() {
        console.log('📦 Iniciando carga de todos los módulos...');
        
        const moduleNames = Array.from(this.modules.keys());
        
        // Separar por prioridad
        const criticos = moduleNames.filter(name => 
            this.modules.get(name).critical
        );
        
        const normales = moduleNames.filter(name => 
            !this.modules.get(name).critical && !this.modules.get(name).lazy
        );
        
        try {
            // Cargar críticos primero
            if (criticos.length > 0) {
                console.log(`📦 Cargando ${criticos.length} módulos críticos...`);
                await this.loadMultiple(criticos);
            }
            
            // Cargar normales después
            if (normales.length > 0) {
                console.log(`📦 Cargando ${normales.length} módulos normales...`);
                await this.loadMultiple(normales);
            }
            
            console.log(`✅ Todos los módulos cargados: ${this.loaded.size}/${moduleNames.length}`);
            
            // Emitir evento de sistema listo
            if (window.MAIRA?.EventBus) {
                window.MAIRA.EventBus.emit('system_ready', {
                    modules_loaded: this.loaded.size,
                    load_order: this.loadOrder,
                    total_time: this.stats.load_time_total
                });
            }
            
        } catch (error) {
            console.error('❌ Error cargando todos los módulos:', error);
            throw error;
        }
    }

    /**
     * Obtener instancia de módulo cargado
     */
    getModule(name) {
        if (!this.loaded.has(name)) {
            console.warn(`⚠️ Módulo ${name} no está cargado`);
            return null;
        }

        // Buscar en instancias globales
        if (window.MAIRA && window.MAIRA[name]) {
            return window.MAIRA[name];
        }

        // Buscar en el módulo registrado
        const moduleConfig = this.modules.get(name);
        return moduleConfig ? moduleConfig.factory : null;
    }

    /**
     * Verificar si módulo está cargado
     */
    isLoaded(name) {
        return this.loaded.has(name);
    }

    /**
     * Verificar si módulo falló al cargar
     */
    hasFailed(name) {
        return this.failed.has(name);
    }

    /**
     * Reintentar cargar módulo fallido
     */
    async retry(name) {
        if (this.failed.has(name)) {
            this.failed.delete(name);
            console.log(`🔄 Reintentando cargar módulo: ${name}`);
            return await this.load(name);
        } else {
            console.warn(`⚠️ Módulo ${name} no ha fallado`);
            return null;
        }
    }

    /**
     * Descargar módulo (para recarga)
     */
    unload(name) {
        if (this.loaded.has(name)) {
            // Ejecutar cleanup si existe
            const moduleInstance = this.getModule(name);
            if (moduleInstance && typeof moduleInstance.cleanup === 'function') {
                moduleInstance.cleanup();
            }

            this.loaded.delete(name);
            this.loadOrder = this.loadOrder.filter(m => m !== name);
            
            console.log(`📦 Módulo descargado: ${name}`);
            
            // Emitir evento
            if (window.MAIRA?.EventBus) {
                window.MAIRA.EventBus.emit('module_unloaded', { name });
            }
        }
    }

    /**
     * Obtener estadísticas del sistema
     */
    getStats() {
        return {
            ...this.stats,
            modules_total: this.modules.size,
            modules_loaded: this.loaded.size,
            modules_failed: this.failed.size,
            load_order: [...this.loadOrder],
            average_load_time: this.stats.modules_loaded > 0 ? 
                (this.stats.load_time_total / this.stats.modules_loaded).toFixed(2) + 'ms' : '0ms',
            memory_usage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estimar uso de memoria
     */
    estimateMemoryUsage() {
        // Estimación básica basada en número de módulos
        const baseMemory = this.loaded.size * 50; // ~50KB por módulo
        return `${baseMemory} KB (estimado)`;
    }

    /**
     * Obtener dependencias de un módulo
     */
    getDependencies(name) {
        return this.dependencies.get(name) || [];
    }

    /**
     * Obtener módulos que dependen de uno específico
     */
    getDependents(name) {
        const dependents = [];
        
        this.dependencies.forEach((deps, moduleName) => {
            if (deps.includes(name)) {
                dependents.push(moduleName);
            }
        });
        
        return dependents;
    }

    /**
     * Verificar integridad del sistema de módulos
     */
    verificarIntegridad() {
        const problemas = [];
        
        // Verificar dependencias circulares
        this.dependencies.forEach((deps, name) => {
            if (this.tieneDependenciaCircular(name, new Set())) {
                problemas.push(`Dependencia circular detectada: ${name}`);
            }
        });
        
        // Verificar dependencias no registradas
        this.dependencies.forEach((deps, name) => {
            deps.forEach(dep => {
                if (!this.modules.has(dep)) {
                    problemas.push(`Dependencia no registrada: ${dep} (requerida por ${name})`);
                }
            });
        });
        
        if (problemas.length === 0) {
            console.log('✅ ModuleSystem: Integridad verificada correctamente');
        } else {
            console.warn('⚠️ ModuleSystem: Problemas detectados:', problemas);
        }
        
        return problemas;
    }

    /**
     * Detectar dependencia circular
     */
    tieneDependenciaCircular(name, visitados) {
        if (visitados.has(name)) {
            return true;
        }
        
        visitados.add(name);
        const deps = this.dependencies.get(name) || [];
        
        for (const dep of deps) {
            if (this.tieneDependenciaCircular(dep, new Set(visitados))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Exportar configuración del sistema
     */
    export() {
        return {
            modules: Array.from(this.modules.keys()),
            dependencies: Object.fromEntries(this.dependencies),
            loaded: Array.from(this.loaded),
            failed: Array.from(this.failed),
            load_order: this.loadOrder,
            stats: this.getStats(),
            timestamp: new Date().toISOString()
        };
    }
}

// Instancia global
window.MAIRA = window.MAIRA || {};
window.MAIRA.ModuleSystem = new ModuleSystem();

console.log('[MAIRA] Sistema de Módulos cargado y operativo');
