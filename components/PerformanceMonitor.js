/**
 * MAIRA Performance Monitor
 * Sistema avanzado de monitoreo y optimización de rendimiento
 * Rastrea métricas críticas y optimiza automáticamente el sistema
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.thresholds = new Map();
        this.optimizations = new Map();
        this.measurements = new Map();
        this.observers = new Map();
        this.isMonitoring = false;
        this.reportInterval = 30000; // 30 segundos
        
        this.initializeMetrics();
        this.initializeThresholds();
        this.initializeOptimizations();
        this.startMonitoring();
        
        console.log('[PerformanceMonitor] Sistema de monitoreo iniciado');
    }

    /**
     * Inicializa métricas de rendimiento a monitorear
     */
    initializeMetrics() {
        // Métricas de memoria
        this.metrics.set('memory', {
            name: 'Uso de Memoria',
            unit: 'MB',
            getValue: () => {
                if ('memory' in performance) {
                    return {
                        used: performance.memory.usedJSHeapSize / 1024 / 1024,
                        total: performance.memory.totalJSHeapSize / 1024 / 1024,
                        limit: performance.memory.jsHeapSizeLimit / 1024 / 1024
                    };
                }
                return null;
            },
            critical: true
        });

        // Métricas de FPS
        this.metrics.set('fps', {
            name: 'Frames por Segundo',
            unit: 'FPS',
            getValue: () => this.getCurrentFPS(),
            critical: true
        });

        // Tiempo de respuesta de red
        this.metrics.set('network', {
            name: 'Latencia de Red',
            unit: 'ms',
            getValue: () => this.getNetworkLatency(),
            critical: false
        });

        // Tiempo de renderizado de mapas
        this.metrics.set('mapRender', {
            name: 'Renderizado de Mapas',
            unit: 'ms',
            getValue: () => this.getMapRenderTime(),
            critical: true
        });

        // Carga de CPU (aproximada)
        this.metrics.set('cpu', {
            name: 'Carga de CPU',
            unit: '%',
            getValue: () => this.getCPUUsage(),
            critical: true
        });

        // Métricas de TIF processing
        this.metrics.set('tifProcessing', {
            name: 'Procesamiento TIF',
            unit: 'ms',
            getValue: () => this.getTIFProcessingTime(),
            critical: false
        });

        // Número de hexágonos renderizados
        this.metrics.set('hexagonCount', {
            name: 'Hexágonos Activos',
            unit: 'count',
            getValue: () => this.getActiveHexagonCount(),
            critical: false
        });

        // Número de símbolos militares
        this.metrics.set('symbolCount', {
            name: 'Símbolos Militares',
            unit: 'count',
            getValue: () => this.getActiveSymbolCount(),
            critical: false
        });
    }

    /**
     * Define umbrales de rendimiento
     */
    initializeThresholds() {
        this.thresholds.set('memory', {
            warning: 512,   // 512MB
            critical: 1024  // 1GB
        });

        this.thresholds.set('fps', {
            warning: 30,    // < 30 FPS
            critical: 15    // < 15 FPS
        });

        this.thresholds.set('mapRender', {
            warning: 100,   // > 100ms
            critical: 500   // > 500ms
        });

        this.thresholds.set('cpu', {
            warning: 70,    // > 70%
            critical: 90    // > 90%
        });

        this.thresholds.set('network', {
            warning: 200,   // > 200ms
            critical: 1000  // > 1000ms
        });

        this.thresholds.set('hexagonCount', {
            warning: 5000,  // > 5000 hexágonos
            critical: 10000 // > 10000 hexágonos
        });
    }

    /**
     * Define optimizaciones automáticas
     */
    initializeOptimizations() {
        // Optimización de memoria
        this.optimizations.set('memory', {
            trigger: 'critical',
            action: () => {
                console.log('[PerformanceMonitor] Ejecutando optimización de memoria...');
                
                // Limpiar caches
                if (window.MAIRA.MemoryManager) {
                    window.MAIRA.MemoryManager.emergencyCleanup();
                }
                
                // Reducir calidad de renderizado
                this.reduceRenderQuality();
                
                return 'Memoria optimizada - cache limpiado y calidad reducida';
            }
        });

        // Optimización de FPS
        this.optimizations.set('fps', {
            trigger: 'warning',
            action: () => {
                console.log('[PerformanceMonitor] Optimizando FPS...');
                
                // Reducir frecuencia de actualización
                this.reduceFPS();
                
                // Simplificar símbolos
                this.simplifySymbols();
                
                return 'FPS optimizado - actualización reducida y símbolos simplificados';
            }
        });

        // Optimización de renderizado de mapas
        this.optimizations.set('mapRender', {
            trigger: 'warning',
            action: () => {
                console.log('[PerformanceMonitor] Optimizando renderizado de mapas...');
                
                // Reducir resolución de tiles
                this.reduceTileResolution();
                
                // Limitar hexágonos visibles
                this.limitVisibleHexagons();
                
                return 'Renderizado optimizado - resolución y hexágonos limitados';
            }
        });

        // Optimización de hexágonos
        this.optimizations.set('hexagonCount', {
            trigger: 'warning',
            action: () => {
                console.log('[PerformanceMonitor] Optimizando cantidad de hexágonos...');
                
                // Ocultar hexágonos lejanos
                this.cullDistantHexagons();
                
                // Usar LOD (Level of Detail)
                this.enableHexagonLOD();
                
                return 'Hexágonos optimizados - culling y LOD activado';
            }
        });
    }

    /**
     * Inicia el monitoreo continuo
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.lastFPSCheck = performance.now();
        this.frameCount = 0;
        this.currentFPS = 60;

        // Monitor principal
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
            this.applyOptimizations();
        }, this.reportInterval);

        // Monitor de FPS más frecuente
        this.fpsMonitorLoop();

        // Observer para long tasks
        this.setupLongTaskObserver();

        // Observer para recursos
        this.setupResourceObserver();

        console.log('[PerformanceMonitor] Monitoreo continuo iniciado');
    }

    /**
     * Recolecta todas las métricas
     */
    collectMetrics() {
        const timestamp = Date.now();
        const currentMetrics = {};

        for (const [key, metric] of this.metrics.entries()) {
            try {
                const value = metric.getValue();
                if (value !== null) {
                    currentMetrics[key] = {
                        value: value,
                        timestamp: timestamp,
                        unit: metric.unit,
                        critical: metric.critical
                    };
                }
            } catch (error) {
                console.warn(`[PerformanceMonitor] Error recolectando métrica ${key}:`, error);
            }
        }

        // Guardar en historial
        this.measurements.set(timestamp, currentMetrics);
        this.limitMeasurementHistory();

        return currentMetrics;
    }

    /**
     * Analiza el rendimiento y detecta problemas
     */
    analyzePerformance() {
        const latest = this.getLatestMeasurements();
        const issues = [];

        for (const [metricName, data] of Object.entries(latest)) {
            const threshold = this.thresholds.get(metricName);
            if (!threshold) continue;

            const value = typeof data.value === 'object' ? data.value.used || data.value : data.value;
            
            if (value > threshold.critical) {
                issues.push({
                    metric: metricName,
                    level: 'critical',
                    value: value,
                    threshold: threshold.critical,
                    message: `${data.unit === 'FPS' ? 'Bajó de' : 'Excedió'} umbral crítico`
                });
            } else if (value > threshold.warning) {
                issues.push({
                    metric: metricName,
                    level: 'warning',
                    value: value,
                    threshold: threshold.warning,
                    message: `${data.unit === 'FPS' ? 'Bajó de' : 'Excedió'} umbral de advertencia`
                });
            }
        }

        if (issues.length > 0) {
            console.warn('[PerformanceMonitor] Problemas de rendimiento detectados:', issues);
            this.reportIssues(issues);
        }

        return issues;
    }

    /**
     * Aplica optimizaciones automáticas
     */
    applyOptimizations() {
        const issues = this.analyzePerformance();
        const appliedOptimizations = [];

        for (const issue of issues) {
            const optimization = this.optimizations.get(issue.metric);
            
            if (optimization && issue.level === optimization.trigger) {
                try {
                    const result = optimization.action();
                    appliedOptimizations.push({
                        metric: issue.metric,
                        result: result,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    console.error(`[PerformanceMonitor] Error aplicando optimización para ${issue.metric}:`, error);
                }
            }
        }

        if (appliedOptimizations.length > 0) {
            console.log('[PerformanceMonitor] Optimizaciones aplicadas:', appliedOptimizations);
            this.reportOptimizations(appliedOptimizations);
        }
    }

    /**
     * Métodos para obtener métricas específicas
     */
    getCurrentFPS() {
        return this.currentFPS || 60;
    }

    getNetworkLatency() {
        // Usar Navigation Timing API si está disponible
        if (performance.timing) {
            return performance.timing.responseEnd - performance.timing.requestStart;
        }
        return null;
    }

    getMapRenderTime() {
        // Buscar mediciones de renderizado recientes
        const mapMeasures = performance.getEntriesByName('map-render');
        if (mapMeasures.length > 0) {
            return mapMeasures[mapMeasures.length - 1].duration;
        }
        return null;
    }

    getCPUUsage() {
        // Aproximación basada en tareas largas
        const longTasks = performance.getEntriesByType('longtask');
        if (longTasks.length > 0) {
            const recentTasks = longTasks.filter(task => 
                performance.now() - task.startTime < 5000
            );
            
            const totalDuration = recentTasks.reduce((sum, task) => sum + task.duration, 0);
            return Math.min(100, (totalDuration / 5000) * 100);
        }
        return null;
    }

    getTIFProcessingTime() {
        const tifMeasures = performance.getEntriesByName('tif-processing');
        if (tifMeasures.length > 0) {
            return tifMeasures[tifMeasures.length - 1].duration;
        }
        return null;
    }

    getActiveHexagonCount() {
        // Intentar obtener del sistema de hexágonos
        if (window.hexagonos && Array.isArray(window.hexagonos)) {
            return window.hexagonos.filter(hex => hex.visible !== false).length;
        }
        return null;
    }

    getActiveSymbolCount() {
        // Intentar obtener del sistema de símbolos
        if (window.simbolosMilitares && Array.isArray(window.simbolosMilitares)) {
            return window.simbolosMilitares.filter(sym => sym.visible !== false).length;
        }
        return null;
    }

    /**
     * Loop de monitoreo de FPS
     */
    fpsMonitorLoop() {
        const now = performance.now();
        this.frameCount++;

        if (now - this.lastFPSCheck >= 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSCheck));
            this.frameCount = 0;
            this.lastFPSCheck = now;
        }

        requestAnimationFrame(() => this.fpsMonitorLoop());
    }

    /**
     * Configura observer para tareas largas
     */
    setupLongTaskObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) { // Tareas > 50ms
                            console.warn('[PerformanceMonitor] Tarea larga detectada:', {
                                duration: entry.duration,
                                startTime: entry.startTime,
                                name: entry.name
                            });
                        }
                    }
                });

                observer.observe({ entryTypes: ['longtask'] });
                this.observers.set('longtask', observer);
            } catch (error) {
                console.warn('[PerformanceMonitor] Long Task Observer no soportado');
            }
        }
    }

    /**
     * Configura observer para recursos
     */
    setupResourceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.transferSize > 1024 * 1024) { // Recursos > 1MB
                            console.info('[PerformanceMonitor] Recurso grande cargado:', {
                                name: entry.name,
                                size: (entry.transferSize / 1024 / 1024).toFixed(2) + 'MB',
                                duration: entry.duration
                            });
                        }
                    }
                });

                observer.observe({ entryTypes: ['resource'] });
                this.observers.set('resource', observer);
            } catch (error) {
                console.warn('[PerformanceMonitor] Resource Observer no soportado');
            }
        }
    }

    /**
     * Métodos de optimización específicos
     */
    reduceRenderQuality() {
        // Reducir calidad de renderizado del mapa
        if (window.MAIRA && window.MAIRA.MapRenderer) {
            window.MAIRA.MapRenderer.setQuality('low');
        }
    }

    reduceFPS() {
        // Reducir frecuencia de actualización de animaciones
        if (window.requestAnimationFrame.originalDelay !== undefined) {
            window.requestAnimationFrame.originalDelay = 1000 / 30; // 30 FPS
        }
    }

    simplifySymbols() {
        // Usar versiones simplificadas de símbolos militares
        if (window.MAIRA && window.MAIRA.MilitarySymbols) {
            window.MAIRA.MilitarySymbols.setDetailLevel('low');
        }
    }

    reduceTileResolution() {
        // Reducir resolución de tiles del mapa
        if (window.map && window.map.setMaxZoom) {
            const currentMaxZoom = window.map.getMaxZoom();
            window.map.setMaxZoom(Math.max(10, currentMaxZoom - 2));
        }
    }

    limitVisibleHexagons() {
        // Limitar número de hexágonos visibles
        const maxVisible = 1000;
        if (window.hexagonos && window.hexagonos.length > maxVisible) {
            // Ocultar hexágonos lejanos del centro
            const center = window.map ? window.map.getCenter() : { lat: -34, lng: -64 };
            
            window.hexagonos.forEach(hex => {
                const distance = this.calculateDistance(center, hex);
                hex.visible = distance < 100; // 100km radius
            });
        }
    }

    cullDistantHexagons() {
        // Algoritmo más agresivo de culling
        if (window.hexagonos) {
            const viewport = this.getViewportBounds();
            
            window.hexagonos.forEach(hex => {
                hex.visible = this.isInViewport(hex, viewport);
            });
        }
    }

    enableHexagonLOD() {
        // Implementar Level of Detail para hexágonos
        if (window.hexagonos) {
            const zoom = window.map ? window.map.getZoom() : 10;
            
            window.hexagonos.forEach(hex => {
                if (zoom < 12) {
                    hex.detail = 'low';
                } else if (zoom < 15) {
                    hex.detail = 'medium';
                } else {
                    hex.detail = 'high';
                }
            });
        }
    }

    /**
     * Utilidades de cálculo
     */
    calculateDistance(point1, point2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lng - point1.lng) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    getViewportBounds() {
        if (window.map && window.map.getBounds) {
            const bounds = window.map.getBounds();
            return {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest()
            };
        }
        
        return { north: -21, south: -55, east: -53, west: -73 }; // Argentina bounds
    }

    isInViewport(hex, viewport) {
        return hex.lat >= viewport.south && hex.lat <= viewport.north &&
               hex.lng >= viewport.west && hex.lng <= viewport.east;
    }

    /**
     * Reportes y notificaciones
     */
    reportIssues(issues) {
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('performance_issues', issues);
        }
    }

    reportOptimizations(optimizations) {
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('performance_optimizations', optimizations);
        }
    }

    /**
     * Gestión de datos
     */
    getLatestMeasurements() {
        const timestamps = Array.from(this.measurements.keys()).sort().reverse();
        return timestamps.length > 0 ? this.measurements.get(timestamps[0]) : {};
    }

    limitMeasurementHistory() {
        const maxEntries = 100;
        if (this.measurements.size > maxEntries) {
            const timestamps = Array.from(this.measurements.keys()).sort();
            const toRemove = timestamps.slice(0, timestamps.length - maxEntries);
            
            toRemove.forEach(timestamp => {
                this.measurements.delete(timestamp);
            });
        }
    }

    /**
     * API pública para obtener estadísticas
     */
    getPerformanceReport() {
        const latest = this.getLatestMeasurements();
        const issues = this.analyzePerformance();
        
        return {
            timestamp: Date.now(),
            metrics: latest,
            issues: issues,
            systemHealth: this.calculateSystemHealth(latest, issues),
            recommendations: this.generateRecommendations(issues)
        };
    }

    calculateSystemHealth(metrics, issues) {
        let health = 100;
        
        issues.forEach(issue => {
            if (issue.level === 'critical') {
                health -= 25;
            } else if (issue.level === 'warning') {
                health -= 10;
            }
        });
        
        return Math.max(0, health);
    }

    generateRecommendations(issues) {
        const recommendations = [];
        
        issues.forEach(issue => {
            switch (issue.metric) {
                case 'memory':
                    recommendations.push('Considere reducir la resolución de mapas o limpiar cache');
                    break;
                case 'fps':
                    recommendations.push('Reduzca el número de elementos visibles en pantalla');
                    break;
                case 'mapRender':
                    recommendations.push('Use menos detalles en el zoom actual');
                    break;
                case 'hexagonCount':
                    recommendations.push('Limite el área visible o use menor resolución');
                    break;
            }
        });
        
        return recommendations;
    }

    /**
     * Control del sistema
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        // Desconectar observers
        for (const observer of this.observers.values()) {
            observer.disconnect();
        }
        this.observers.clear();
        
        console.log('[PerformanceMonitor] Monitoreo detenido');
    }

    restartMonitoring() {
        this.stopMonitoring();
        setTimeout(() => this.startMonitoring(), 1000);
    }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.PerformanceMonitor = new PerformanceMonitor();

console.log('[MAIRA] PerformanceMonitor cargado y operativo');
