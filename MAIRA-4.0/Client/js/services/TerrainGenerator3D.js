/**
 * ═══════════════════════════════════════════════════════════════════════
 * TERRAIN GENERATOR 3D - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Sistema de generación de terreno 3D basado en:
 * - Muestreo de puntos con heightmap (DEM)
 * - Valores NDVI para vegetación
 * - Interpolación de superficie
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-04
 */

class TerrainGenerator3D {
    constructor(config = {}) {
        this.config = {
            // Resolución del terreno
            resolution: config.resolution || 60, // Puntos por lado (60x60 = 3600 puntos)
            minResolution: 20,
            maxResolution: 500,
            
            // Escala vertical (exageración)
            verticalScale: config.verticalScale || 2.0,
            
            // Tamaño en metros
            realWorldSize: config.realWorldSize || 1000, // 1km por defecto
            
            // Vegetación - ✅ ULTRA OPTIMIZADO para no explotar la PC
            vegetationDensity: config.vegetationDensity || 0.05, // ✅ 0.5% (antes 5%) = ~50-100 árboles max
            vegetationMinNDVI: config.vegetationMinNDVI || 0.35,  // ✅ Aumentado de 0.2 a 0.35 (filtrar césped débil)
            
            // Colores del terreno según altura
            colorMap: config.colorMap || {
                water: 0x0066cc,      // < 0m
                beach: 0xf4e7b8,      // 0-2m
                grass: 0x7cbc4b,      // 2-50m
                forest: 0x2d5016,     // 50-100m
                mountain: 0x8b7355,   // 100-200m
                snow: 0xffffff        // > 200m
            },
            
            // Umbrales de vegetación NDVI
            ndviThresholds: {
                grass: { min: 0.2, max: 0.4 },
                bush: { min: 0.4, max: 0.6 },
                tree_medium: { min: 0.6, max: 0.75 },
                tree_tall: { min: 0.75, max: 1.0 }
            }
        };
        
        this.terrainMesh = null;
        this.vegetationObjects = [];
        this.pointGrid = null;
        this.bounds = null;
        this.satelliteAnalyzer = null; // Analyzer de imagen satelital
        this.modelLoader = null; // Loader de modelos GLTF
        this.vegetationInstancer = null; // Instancer para vegetación
        this.useInstancing = config.useInstancing !== false; // Default: true
        
        // 🌍 Detectar entorno automáticamente
        this.isLocal = this._detectEnvironment();
        
        // 🚀 OPTIMIZACIÓN: Caché de geometrías y materiales
        this.geometryCache = new Map(); // { 'bush': geometry }
        this.materialCache = new Map(); // { 'bush': material }
        
        // 📊 Estadísticas de caché
        this.cacheStats = {
            hits: 0,
            misses: 0,
            getTotalAccesses() {
                return this.hits + this.misses;
            },
            getHitRate() {
                const total = this.getTotalAccesses();
                return total > 0 ? ((this.hits / total) * 100).toFixed(1) : 0;
            }
        };
        
        this.initialized = false;
        
        console.log('🏔️ TerrainGenerator3D inicializado', this.config);
    }
    
    /**
     * 🔧 Validar y corregir offset Y para modelos de vegetación
     * @param {string} type - Tipo de vegetación
     * @param {number} calculatedOffset - Offset calculado del bounding box
     * @param {number} modelHeight - Altura total del modelo
     * @returns {number} Offset validado
     */
    validateModelYOffset(type, calculatedOffset, modelHeight) {
        // Offsets manuales como fallback para modelos problemáticos
        const manualOffsets = {
            'grass': 0.05,         // Pasto muy pequeño, casi a nivel
            'bush': 0.2,           // Arbustos bajos
            'tree_tall': 0,        // Árboles altos bien modelados
            'tree_medium': 0,      // Árboles medianos bien modelados  
            'tree': 0              // Árboles genéricos bien modelados
        };
        
        // Validar si el offset es sospechoso
        if (modelHeight < 0.05 || calculatedOffset < -1 || calculatedOffset > 15) {
            const fallback = manualOffsets[type] !== undefined ? manualOffsets[type] : 0.2;
            console.warn(`⚠️ Offset inválido para '${type}': ${calculatedOffset.toFixed(2)}m (altura=${modelHeight.toFixed(2)}m), usando fallback=${fallback}`);
            return fallback;
        }
        
        return calculatedOffset;
    }
    
    /**
     * 🔥 MAPEO DE PROVINCIAS A REGIONES - ESTRUCTURA REAL DE DATOS
     * @param {string} provincia - Nombre de la provincia
     * @returns {string} Nombre de la región correspondiente
     */
    _getRegionForProvincia(provincia) {
        // Mapeo basado en la estructura real de archivos
        const regionMap = {
            // Región CENTRO
            'buenos_aires': 'centro',
            'caba': 'centro', 
            'cordoba': 'centro',
            'santa_fe': 'centro',
            'entre_rios': 'centro',
            'la_pampa': 'centro',
            'san_luis': 'centro',
            
            // Región CENTRO_NORTE  
            'santiago_del_estero': 'centro_norte',
            'tucuman': 'centro_norte',
            'salta': 'centro_norte',
            'jujuy': 'centro_norte',
            'catamarca': 'centro_norte',
            'la_rioja': 'centro_norte',
            
            // Región NORTE
            'chaco': 'norte',
            'formosa': 'norte',
            'corrientes': 'norte',
            'misiones': 'norte',
            
            // Región PATAGONIA
            'neuquen': 'patagonia',
            'rio_negro': 'patagonia',
            'chubut': 'patagonia',
            'santa_cruz': 'patagonia',
            'tierra_del_fuego': 'patagonia',
            
            // Región SUR
            'mendoza': 'sur',
            'san_juan': 'sur'
        };
        
        // Normalizar el nombre de la provincia
        const normalized = provincia.toLowerCase().replace(/\s+/g, '_');
        return regionMap[normalized] || 'centro'; // Default a centro si no se encuentra
    }
    
    /**
     * Inicializar con handlers necesarios
     */
    initialize(heightmapHandler, vegetationHandler, maira3DSystem, satelliteAnalyzer = null) {
        this.heightmapHandler = heightmapHandler;
        this.vegetationHandler = vegetationHandler;
        this.maira3DSystem = maira3DSystem;
        this.satelliteAnalyzer = satelliteAnalyzer; // Opcional
        
        // Inicializar loader de modelos GLTF
        if (window.GLTFModelLoader) {
            this.modelLoader = new GLTFModelLoader();
            this.modelLoader.initialize();
            console.log('✅ GLTFModelLoader inicializado');
            
            // ✅ FASE 2: Inicializar VegetationInstancer
            if (window.VegetationInstancer && this.useInstancing) {
                // Necesitamos la escena de maira3DSystem
                const scene = this.maira3DSystem?.scene;
                if (scene) {
                    this.vegetationInstancer = new VegetationInstancer(scene, this.modelLoader);
                    console.log('✅ VegetationInstancer inicializado (modo: INSTANCING)');
                } else {
                    console.warn('⚠️ No se pudo inicializar VegetationInstancer (scene no disponible)');
                    this.useInstancing = false;
                }
            } else if (!this.useInstancing) {
                console.log('ℹ️ Instancing deshabilitado (modo: meshes individuales)');
            }
        } else {
            console.warn('⚠️ GLTFModelLoader no disponible - usando geometrías procedurales');
        }
        
        if (!this.heightmapHandler) {
            console.warn('⚠️ HeightmapHandler no disponible - usando alturas planas');
        }
        
        if (!this.vegetationHandler) {
            console.warn('⚠️ VegetationHandler no disponible - vegetación deshabilitada');
        }
        
        if (!this.satelliteAnalyzer) {
            console.warn('⚠️ SatelliteAnalyzer no disponible - textura procedural');
        }
        
        this.initialized = true;
        console.log('🏔️ TerrainGenerator3D inicializado completamente');
    }
    
    /**
     * Inicializar VegetationInstancer cuando la escena esté disponible
     */
    initializeVegetationInstancer() {
        if (!this.useInstancing || !window.VegetationInstancer || !this.modelLoader) {
            return;
        }
        
        if (this.vegetationInstancer) {
            console.log('ℹ️ VegetationInstancer ya inicializado');
            return;
        }
        
        const scene = this.maira3DSystem?.scene;
        if (scene) {
            try {
                this.vegetationInstancer = new VegetationInstancer(scene, this.modelLoader);
                console.log('✅ VegetationInstancer inicializado (modo: INSTANCING)');
            } catch (error) {
                console.error('❌ Error inicializando VegetationInstancer:', error);
                this.useInstancing = false;
            }
        } else {
            console.warn('⚠️ Scene no disponible para VegetationInstancer');
        }
    }
    
    /**
     * 🔧 Validar y corregir offset Y para modelos de vegetación
     * @param {string} type - Tipo de vegetación
     * @param {number} calculatedOffset - Offset calculado del bounding box
     * @param {number} modelHeight - Altura total del modelo
     * @returns {number} Offset validado
     */
    validateModelYOffset(type, calculatedOffset, modelHeight) {
        // Offsets manuales como fallback para modelos problemáticos
        const manualOffsets = {
            'grass': 0.05,         // Pasto muy pequeño, casi a nivel
            'bush': 0.2,           // Arbustos bajos
            'tree_tall': 0,        // Árboles altos bien modelados
            'tree_medium': 0,      // Árboles medianos bien modelados  
            'tree': 0              // Árboles genéricos bien modelados
        };
        
        // Validar si el offset es sospechoso
        if (modelHeight < 0.05 || calculatedOffset < -1 || calculatedOffset > 15) {
            const fallback = manualOffsets[type] !== undefined ? manualOffsets[type] : 0.2;
            console.warn(`⚠️ Offset inválido para '${type}': ${calculatedOffset.toFixed(2)}m (altura=${modelHeight.toFixed(2)}m), usando fallback=${fallback}`);
            return fallback;
        }
        
        return calculatedOffset;
    }
    
    /**
     * 🔥 MAPEO DE PROVINCIAS A REGIONES - ESTRUCTURA REAL DE DATOS
     * @param {string} provincia - Nombre de la provincia
     * @returns {string} Nombre de la región correspondiente
     */
    _getRegionForProvincia(provincia) {
        // Mapeo basado en la estructura real de archivos
        const regionMap = {
            // Región CENTRO
            'buenos_aires': 'centro',
            'caba': 'centro', 
            'cordoba': 'centro',
            'santa_fe': 'centro',
            'entre_rios': 'centro',
            'la_pampa': 'centro',
            'san_luis': 'centro',
            
            // Región CENTRO_NORTE  
            'santiago_del_estero': 'centro_norte',
            'tucuman': 'centro_norte',
            'salta': 'centro_norte',
            'jujuy': 'centro_norte',
            'catamarca': 'centro_norte',
            'la_rioja': 'centro_norte',
            
            // Región NORTE
            'chaco': 'norte',
            'formosa': 'norte',
            'corrientes': 'norte',
            'misiones': 'norte',
            
            // Región PATAGONIA
            'neuquen': 'patagonia',
            'rio_negro': 'patagonia',
            'chubut': 'patagonia',
            'santa_cruz': 'patagonia',
            'tierra_del_fuego': 'patagonia',
            
            // Región SUR
            'mendoza': 'sur',
            'san_juan': 'sur'
        };
        
        // Normalizar el nombre de la provincia
        const normalized = provincia.toLowerCase().replace(/\s+/g, '_');
        return regionMap[normalized] || 'centro'; // Default a centro si no se encuentra
    }
    
    /**
     * Inicializar con handlers necesarios
     */
    initialize(heightmapHandler, vegetationHandler, maira3DSystem, satelliteAnalyzer = null) {
        this.heightmapHandler = heightmapHandler;
        this.vegetationHandler = vegetationHandler;
        this.maira3DSystem = maira3DSystem;
        this.satelliteAnalyzer = satelliteAnalyzer; // Opcional
        
        // Inicializar loader de modelos GLTF
        if (window.GLTFModelLoader) {
            this.modelLoader = new GLTFModelLoader();
            this.modelLoader.initialize();
            console.log('✅ GLTFModelLoader inicializado');
            
            // ✅ FASE 2: Inicializar VegetationInstancer
            if (window.VegetationInstancer && this.useInstancing) {
                // Necesitamos la escena de maira3DSystem
                const scene = this.maira3DSystem?.scene;
                if (scene) {
                    this.vegetationInstancer = new VegetationInstancer(scene, this.modelLoader);
                    console.log('✅ VegetationInstancer inicializado (modo: INSTANCING)');
                } else {
                    console.warn('⚠️ No se pudo inicializar VegetationInstancer (scene no disponible)');
                    this.useInstancing = false;
                }
            } else if (!this.useInstancing) {
                console.log('ℹ️ Instancing deshabilitado (modo: meshes individuales)');
            }
        } else {
            console.warn('⚠️ GLTFModelLoader no disponible - usando geometrías procedurales');
        }
        
        if (!this.heightmapHandler) {
            console.warn('⚠️ HeightmapHandler no disponible - usando alturas planas');
        }
        
        if (!this.vegetationHandler) {
            console.warn('⚠️ VegetationHandler no disponible - vegetación deshabilitada');
        }
        
        if (!this.satelliteAnalyzer) {
            console.warn('⚠️ SatelliteAnalyzer no disponible - textura procedural');
        }
        
        this.initialized = true;
        console.log('🏔️ TerrainGenerator3D inicializado completamente');
    }
    
    /**
     * Inicializar VegetationInstancer cuando la escena esté disponible
     */
    initializeVegetationInstancer() {
        if (!this.useInstancing || !window.VegetationInstancer || !this.modelLoader) {
            return;
        }
        
        if (this.vegetationInstancer) {
            console.log('ℹ️ VegetationInstancer ya inicializado');
            return;
        }
        
        const scene = this.maira3DSystem?.scene;
        if (scene) {
            try {
                this.vegetationInstancer = new VegetationInstancer(scene, this.modelLoader);
                console.log('✅ VegetationInstancer inicializado (modo: INSTANCING)');
            } catch (error) {
                console.error('❌ Error inicializando VegetationInstancer:', error);
                this.useInstancing = false;
            }
        } else {
            console.warn('⚠️ Scene no disponible para VegetationInstancer');
        }
    }
    
    /**
     * Generar terreno 3D desde bounds de Leaflet
     */
    async generateTerrain(bounds, options = {}) {
        if (!this.initialized) {
            throw new Error('TerrainGenerator3D no inicializado - llama a initialize() primero');
        }
        
        console.log('🏗️ Generando terreno 3D...', bounds);
        
        // ✅ CALCULAR TAMAÑO REAL EN METROS usando Haversine
        const realDimensions = this.calculateRealWorldDimensions(bounds);
        console.log(`📏 Dimensiones reales: ${realDimensions.widthMeters.toFixed(0)}m x ${realDimensions.heightMeters.toFixed(0)}m`);
        
        // 🎯 CALCULAR FACTOR DE ESCALA BASADO EN ZOOM DEL map
        const mapZoom = options.mapZoom || 15; // Zoom por defecto si no se pasa
        const zoomScaleFactor = this.calculateZoomScaleFactor(mapZoom);
        console.log(`🔍 Zoom del map: ${mapZoom}, Factor de escala: ${zoomScaleFactor.toFixed(2)}x`);
        
        // 🔥 Aplicar factor de escala a las dimensiones
        const scaledWidth = realDimensions.widthMeters * zoomScaleFactor;
        const scaledHeight = realDimensions.heightMeters * zoomScaleFactor;
        
        // 🔥 Guardar dimensiones escaladas (no forzar cuadrado)
        this.config.realWorldWidth = scaledWidth;
        this.config.realWorldHeight = scaledHeight;
        this.config.realWorldSize = Math.max(scaledWidth, scaledHeight); // Para referencia
        this.bounds = bounds;
        
        // 🚀 OPTIMIZACIÓN: Resolución adaptativa según zoom
        let resolution;
        if (options.resolution) {
            // Si se especifica resolución manualmente, usarla
            resolution = options.resolution;
        } else {
            // 🎯 Resolución optimizada para vistas tácticas (6km ≈ zoom 15)
            if (mapZoom < 13) {
                resolution = 32; // 32×32 = 1,024 puntos - Vista estratégica (aumentado de 20)
                console.log('⚡ Resolución MEDIA (zoom <13, estratégica): 32×32 = 1,024 puntos');
            } else if (mapZoom >= 13 && mapZoom < 15) {
                resolution = 128; // 128×128 = 16,384 puntos - DETALLE ULTRA ✅ (era 64)
                console.log('⚡ Resolución ULTRA-ALTA (zoom 13-14): 128×128 = 16,384 puntos (terreno ultra-suave) 🏔️');
            } else if (mapZoom >= 15 && mapZoom < 17) {
                resolution = 128; // 128×128 = 16,384 puntos - Máximo detalle (era 64)
                console.log('⚡ Resolución TÁCTICA ULTRA (zoom 15-16): 128×128 = 16,384 puntos (detalle máximo) ⚔️');
            } else if (mapZoom >= 17 && mapZoom < 19) {
                resolution = 64; // 64×64 = 4,096 puntos - Alta calidad (antes 28)
                console.log('⚡ Resolución ALTA (zoom 17-18): 64×64 = 4,096 puntos (equilibrio)');
            } else {
                // 🚨 Zoom demasiado alto: mantener calidad decente
                resolution = 32; // 32×32 = 1,024 puntos (antes 20)
                console.warn('⚠️ Resolución MEDIA (zoom 19+): 32×32 = 1,024 puntos');
                console.warn('💡 Sugerencia: Zoom 19+ puede tener menor detalle. Para mejor calidad, mantenga zoom 13-18');
            }
        }
        
        // 🔍 Verificar si la resolución es viable para el área
        const areaKm2 = (scaledWidth / 1000) * (scaledHeight / 1000);
        const pointsPerKm2 = ((resolution + 1) * (resolution + 1)) / areaKm2;
        console.log(`📊 Densidad: ${pointsPerKm2.toFixed(0)} puntos/km² (área: ${areaKm2.toFixed(2)} km²)`);
        
        if (pointsPerKm2 > 1000) {
            console.warn(`⚠️ DENSIDAD MUY ALTA: ${pointsPerKm2.toFixed(0)} puntos/km² puede causar lag. Considere reducir zoom o área.`);
        }
        
        const includeVegetation = options.includeVegetation !== false;
        
        // 🚀 Callback de progreso (si existe window.updateProgressBar)
        const updateProgress = (msg, pct) => {
            if (typeof window.updateProgressBar === 'function') {
                window.updateProgressBar(msg, pct);
            }
        };
        
        try {
            // Paso 1: Generar grid de puntos
            updateProgress('🏗️ Generando grid de puntos...', 5);
            const points = await this.generatePointGrid(bounds, resolution);
            console.log(`✅ Grid generado: ${points.length} puntos`);
            
            // DEBUG: Verificar estructura de puntos
            if (points.length > 0) {
                const firstPoint = points[0];
                console.log(`📊 Estructura de punto: normX=${firstPoint.normX}, normY=${firstPoint.normY}, x=${firstPoint.x}, y=${firstPoint.y}`);
            }
            
            updateProgress('📊 Grid generado', 15);
            
            // Paso 2: Obtener datos de elevación y vegetación
            updateProgress('🗻 Cargando datos de elevación...', 25);
            const enrichedPoints = await this.enrichPointsWithData(points);
            console.log(`✅ Puntos enriquecidos con elevación y NDVI`);
            updateProgress('✅ Datos de elevación cargados', 55);
            
            // Paso 3: Crear malla de terreno
            updateProgress('🏔️ Creando geometría del terreno...', 65);
            this.terrainMesh = this.createTerrainMesh(enrichedPoints, resolution);
            console.log('✅ Malla de terreno creada');
            updateProgress('✅ Terreno creado', 75);
            
            // Paso 4: Agregar vegetación
            if (includeVegetation && this.vegetationHandler) {
                updateProgress('🌳 Generando vegetación...', 80);
                await this.addVegetationLayer(enrichedPoints);
                console.log(`✅ Vegetación agregada: ${this.vegetationObjects.length} objetos`);
                updateProgress('✅ Vegetación agregada', 90);
            }
            
            // Paso 5: Agregar caminos 3D desde SatelliteAnalyzer
            const roads = [];
            // TEMPORALMENTE DESACTIVADO - Función no implementada
            /*
            if (this.satelliteAnalyzer && options.includeRoads !== false) {
                const roadObjects = this.addRoadsLayer();
                roads.push(...roadObjects);
                console.log(`✅ Caminos agregados: ${roadObjects.length} segmentos`);
            }
            */
            console.log(`⚠️ Caminos desactivados temporalmente`);
            
            // Paso 6: Agregar edificios 3D desde SatelliteAnalyzer
            const buildings = [];
            // TEMPORALMENTE DESACTIVADO - Causan confusión visual
            /*
            if (this.satelliteAnalyzer && options.includeBuildings !== false) {
                const buildingObjects = this.addBuildingsLayer();
                buildings.push(...buildingObjects);
                console.log(`✅ Edificios agregados: ${buildingObjects.length} cubos`);
            }
            */
            console.log(`⚠️ Edificios desactivados temporalmente`);
            
            // Paso 7: Agregar agua 3D desde SatelliteAnalyzer
            const water = [];
            // TEMPORALMENTE DESACTIVADO - Simplificar vista
            /*
            if (this.satelliteAnalyzer && options.includeWater !== false) {
                const waterObjects = this.addWaterLayer();
                water.push(...waterObjects);
                console.log(`✅ Agua agregada: ${waterObjects.length} planos`);
            }
            */
            console.log(`⚠️ Agua desactivada temporalmente`);
            
            updateProgress('✅ Terreno 3D completado', 100);
            
            return {
                terrain: this.terrainMesh,
                vegetation: this.vegetationObjects,
                roads: roads,
                buildings: buildings,
                water: water,
                points: enrichedPoints,
                stats: this.calculateStats(enrichedPoints)
            };
            
        } catch (error) {
            console.error('❌ Error generando terreno:', error);
            if (typeof window.updateProgressBar === 'function') {
                window.updateProgressBar('❌ Error generando terreno', 0);
            }
            throw error;
        }
    }
    
    /**
     * Crear malla de terreno 3D desde puntos enriquecidos
     */
    createTerrainMesh(enrichedPoints, resolution) {
        if (!enrichedPoints || enrichedPoints.length === 0) {
            throw new Error('No hay puntos para crear la malla de terreno');
        }

        console.log(`🏗️ Creando malla de terreno: ${enrichedPoints.length} puntos, resolución ${resolution}`);

        // Crear geometría base (plano)
        const geometry = new THREE.PlaneGeometry(
            this.config.realWorldWidth,
            this.config.realWorldHeight,
            resolution,
            resolution
        );

        // Obtener arrays de vértices y UVs
        const vertices = geometry.attributes.position.array;
        const uvs = geometry.attributes.uv.array;

        // Organizar puntos por grid para acceso rápido
        const gridPoints = [];
        for (let i = 0; i <= resolution; i++) {
            gridPoints[i] = [];
            for (let j = 0; j <= resolution; j++) {
                // Encontrar punto correspondiente en enrichedPoints
                const point = enrichedPoints.find(p =>
                    Math.abs(p.gridX - j) < 0.1 && Math.abs(p.gridY - i) < 0.1
                );
                gridPoints[i][j] = point || { elevation: 0, x: 0, y: 0, z: 0 };
            }
        }

        // 🎯 CALCULAR ELEVACIÓN MÍNIMA para usar como base (no 0)
        let minElevation = Infinity;
        let maxElevation = -Infinity;
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const point = gridPoints[i][j];
                if (point.elevation < minElevation) minElevation = point.elevation;
                if (point.elevation > maxElevation) maxElevation = point.elevation;
            }
        }
        
        // Si no hay datos válidos, usar 0
        if (minElevation === Infinity) minElevation = 0;
        if (maxElevation === -Infinity) maxElevation = 0;
        
        console.log(`📊 Rango de elevación: ${minElevation.toFixed(1)}m a ${maxElevation.toFixed(1)}m`);
        
        // 🐛 DEBUG: Verificar elevaciones en los 4 bordes CON MÁS DETALLE
        console.log('🔍 DEBUG DETALLADO - Elevaciones en bordes:');
        const checkPoints = [0, Math.floor(resolution/4), Math.floor(resolution/2), Math.floor(3*resolution/4), resolution];
        
        // Borde Norte
        const norteValues = checkPoints.map(j => gridPoints[resolution][j].elevation);
        console.log(`  🧭 Norte (i=${resolution}): ${checkPoints.map((j, idx) => `j=${j}:${norteValues[idx].toFixed(1)}m`).join(', ')}`);
        if (Math.max(...norteValues) - Math.min(...norteValues) > 100) {
            console.error(`  🚨 SALTO EXTREMO EN BORDE NORTE: ${(Math.max(...norteValues) - Math.min(...norteValues)).toFixed(1)}m de diferencia`);
        }
        
        // Borde Sur
        const surValues = checkPoints.map(j => gridPoints[0][j].elevation);
        console.log(`  🧭 Sur (i=0): ${checkPoints.map((j, idx) => `j=${j}:${surValues[idx].toFixed(1)}m`).join(', ')}`);
        if (Math.max(...surValues) - Math.min(...surValues) > 100) {
            console.error(`  🚨 SALTO EXTREMO EN BORDE SUR: ${(Math.max(...surValues) - Math.min(...surValues)).toFixed(1)}m de diferencia`);
        }
        
        // Borde Este
        const esteValues = checkPoints.map(i => gridPoints[i][resolution].elevation);
        console.log(`  🧭 Este (j=${resolution}): ${checkPoints.map((i, idx) => `i=${i}:${esteValues[idx].toFixed(1)}m`).join(', ')}`);
        if (Math.max(...esteValues) - Math.min(...esteValues) > 100) {
            console.error(`  🚨 SALTO EXTREMO EN BORDE ESTE: ${(Math.max(...esteValues) - Math.min(...esteValues)).toFixed(1)}m de diferencia`);
        }
        
        // Borde Oeste
        const oesteValues = checkPoints.map(i => gridPoints[i][0].elevation);
        console.log(`  🧭 Oeste (j=0): ${checkPoints.map((i, idx) => `i=${i}:${oesteValues[idx].toFixed(1)}m`).join(', ')}`);
        if (Math.max(...oesteValues) - Math.min(...oesteValues) > 100) {
            console.error(`  🚨 SALTO EXTREMO EN BORDE OESTE: ${(Math.max(...oesteValues) - Math.min(...oesteValues)).toFixed(1)}m de diferencia`);
        }
        
        // 🔍 Verificar centro del terreno
        const centerI = Math.floor(resolution / 2);
        const centerJ = Math.floor(resolution / 2);
        const centerElevation = gridPoints[centerI][centerJ].elevation;
        console.log(`  🎯 Centro [${centerI},${centerJ}]: ${centerElevation.toFixed(1)}m`);
        
        // Guardar para uso posterior (vegetación, modelos)
        this.terrainMinElevation = minElevation;
        this.terrainMaxElevation = maxElevation;

        // Modificar vértices según elevación
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const vertexIndex = (i * (resolution + 1) + j) * 3;
                const point = gridPoints[i][j];

                // ✅ SIN SUAVIZADO DE BORDES - elevationHandler ya suaviza con threshold 5m
                let elevation = point.elevation - minElevation;

                // Aplicar elevación con escala vertical
                vertices[vertexIndex + 2] = elevation * this.config.verticalScale;
            }
        }

        // 🎨 PASO CRÍTICO: Calcular normales ANTES de crear material
        // Esto asegura que el smooth shading funcione correctamente
        geometry.computeVertexNormals();
        
        // 🔧 Normalizar las normales (asegurar vectores unitarios)
        geometry.normalizeNormals();

        // Crear material con textura procedural o básica
        let material;
        
        // 🔍 DEBUG: Verificar estado del satelliteAnalyzer
        console.log('🔍 DEBUG Textura:', {
            hasSatelliteAnalyzer: !!this.satelliteAnalyzer,
            hasGetTexture: this.satelliteAnalyzer && typeof this.satelliteAnalyzer.getTexture === 'function',
            hasCanvas: this.satelliteAnalyzer && !!this.satelliteAnalyzer.canvas,
            hasImageData: this.satelliteAnalyzer && !!this.satelliteAnalyzer.imageData
        });
        
        if (this.satelliteAnalyzer && this.satelliteAnalyzer.getTexture) {
            // Usar textura del satellite analyzer si está disponible
            const texture = this.satelliteAnalyzer.getTexture();
            
            if (texture) {
                console.log('✅ Usando textura satelital real');
                material = new THREE.MeshPhongMaterial({
                    map: texture,
                    transparent: false,
                    flatShading: false, // ✅ CRÍTICO: false para smooth shading
                    shininess: 10,
                    // 🔧 Agregar smooth shading explícito
                    side: THREE.FrontSide
                });
            } else {
                console.warn('⚠️ getTexture() devolvió null, usando color procedural');
                // Fallback a material procedural
                material = new THREE.MeshPhongMaterial({
                    color: 0x4a7c59, // Verde terreno
                    transparent: false,
                    side: THREE.DoubleSide,
                    flatShading: false,
                    shininess: 5,
                    specular: 0x222222
                });
            }
        } else {
            console.warn('⚠️ SatelliteAnalyzer no disponible o sin getTexture(), usando color procedural');
            // Material procedural básico
            material = new THREE.MeshPhongMaterial({
                color: 0x4a7c59, // Verde terreno
                transparent: false,
                side: THREE.DoubleSide,
                flatShading: false, // ✅ CRÍTICO: false para terreno suave (no "piña")
                shininess: 5,
                // 🔧 Especular para mejor visualización de relieve
                specular: 0x222222
            });
        }

        // Crear mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        // Rotar para que quede horizontal
        mesh.rotation.x = -Math.PI / 2;

        // Centrar el terreno
        mesh.position.set(0, 0, 0);

        console.log('✅ Malla de terreno creada exitosamente');
        return mesh;
    }

    /**
     * Generar terreno virtual sin coordenadas geográficas
     * Útil para demos y testing sin map
     */
    async generateVirtualTerrain(options = {}) {
        if (!this.initialized) {
            throw new Error('TerrainGenerator3D no inicializado - llama a initialize() primero');
        }

        console.log('🎮 Generando terreno 3D virtual (sin coordenadas)...');

        // Configurar tamaño virtual
        const virtualSize = options.virtualSize || this.config.realWorldSize || 1500; // 1500m por defecto
        this.config.realWorldWidth = virtualSize;
        this.config.realWorldHeight = virtualSize;
        this.config.realWorldSize = virtualSize;

        // Aplicar opciones
        const resolution = options.resolution || this.config.resolution;
        const includeVegetation = options.includeVegetation !== false;

        try {
            // Paso 1: Generar grid de puntos virtuales
            const points = this.generateVirtualPointGrid(virtualSize, resolution);
            console.log(`✅ Grid virtual generado: ${points.length} puntos`);

            // Paso 2: Enriquecer con datos procedurales
            const enrichedPoints = await this.enrichVirtualPointsWithData(points);
            console.log(`✅ Puntos virtuales enriquecidos con elevación y NDVI procedurales`);

            // Paso 3: Crear malla de terreno
            this.terrainMesh = this.createTerrainMesh(enrichedPoints, resolution);
            console.log('✅ Malla de terreno virtual creada');

            // Paso 4: Agregar vegetación procedural
            if (includeVegetation && this.vegetationHandler) {
                await this.addVegetationLayer(enrichedPoints);
                console.log(`✅ Vegetación virtual agregada: ${this.vegetationObjects.length} objetos`);
            }

            return {
                terrain: this.terrainMesh,
                vegetation: this.vegetationObjects,
                roads: [],
                buildings: [],
                water: [],
                points: enrichedPoints,
                stats: this.calculateStats(enrichedPoints),
                isVirtual: true
            };

        } catch (error) {
            console.error('❌ Error generando terreno virtual:', error);
            throw error;
        }
    }

    /**
     * 🔥 MÉTODO CRÍTICO: Enriquecer puntos con datos REALES de TIF + NDVI
     * OPTIMIZADO: Usa muestreo reducido + interpolación bilineal
     * 
     * @param {Array} points - Todos los puntos del grid
     * @param {Number} samplingRate - Cada cuántos puntos muestrear (default: 5)
     * @returns {Array} - Puntos con elevación y NDVI (interpolados)
     */
    async enrichPointsWithData(points, samplingRate = 5) {
        const startTime = performance.now();
        console.log(`🔄 Enriqueciendo ${points.length} puntos con muestreo inteligente (1/${samplingRate})...`);
        
        // � DEBUG: Mostrar coordenadas geográficas del terreno
        if (points.length > 0) {
            const lats = points.map(p => p.lat).filter(v => v !== undefined);
            const lons = points.map(p => p.lon).filter(v => v !== undefined);
            if (lats.length > 0 && lons.length > 0) {
                const latMin = Math.min(...lats);
                const latMax = Math.max(...lats);
                const lonMin = Math.min(...lons);
                const lonMax = Math.max(...lons);
                console.log(`%c📍 BOUNDS GEOGRÁFICOS DEL TERRENO`, 'background: #4ec9b0; color: #000; padding: 4px 8px; font-weight: bold;');
                console.log(`   Latitud:  ${latMin.toFixed(6)} a ${latMax.toFixed(6)}`);
                console.log(`   Longitud: ${lonMin.toFixed(6)} a ${lonMax.toFixed(6)}`);
                console.log(`   Centro: ${((latMin + latMax) / 2).toFixed(6)}, ${((lonMin + lonMax) / 2).toFixed(6)}`);
            }
        }
        
        // �🚀 OPTIMIZACIÓN: Caché de elevaciones (reduce llamadas redundantes a TIF)
        const elevationCache = new Map();
        const vegetationCache = new Map();
        const cacheKey = (lat, lon) => `${lat.toFixed(5)}_${lon.toFixed(5)}`; // Precisión 5 decimales (~1m)
        
        // Calcular resolución del grid (asumiendo cuadrado)
        // Si tenemos (resolution+1)² puntos, gridSize = resolution+1
        const gridSize = Math.sqrt(points.length); // Tamaño del grid (ej: 129 para resolution=128)
        const gridResolution = gridSize - 1; // Resolution original (ej: 128)
        
        console.log(`📐 Grid: ${gridSize}×${gridSize} puntos (resolution=${gridResolution})`);
        
        // 🎯 PASO 1: Muestrear solo algunos puntos de los TIF
        const sampledPoints = [];
        const sampledIndices = new Set();
        
        for (let i = 0; i < points.length; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Muestrear cada N puntos + siempre los bordes
            if (row % samplingRate === 0 || col % samplingRate === 0 || 
                row === gridSize - 1 || col === gridSize - 1) {
                sampledPoints.push({ ...points[i], originalIndex: i });
                sampledIndices.add(i);
            }
        }
        
        console.log(`� Muestreando ${sampledPoints.length}/${points.length} puntos de los TIF (${Math.round(sampledPoints.length/points.length*100)}%)`);
        
        // 🎯 PASO 2: Obtener datos REALES solo para puntos muestreados (en paralelo)
        const samplingStart = performance.now();
        const sampledData = new Map(); // Almacenar datos de puntos muestreados
        
        // � DEBUG: Verificar disponibilidad de batch API
        console.log(`🔍 DEBUG heightmapHandler:`, {
            exists: !!this.heightmapHandler,
            type: typeof this.heightmapHandler,
            hasBatch: this.heightmapHandler && typeof this.heightmapHandler.getElevationBatch === 'function',
            constructor: this.heightmapHandler ? this.heightmapHandler.constructor.name : 'N/A'
        });
        
        // �🚀 OPTIMIZACIÓN: Batch reducido para evitar lag
        // 🚀 Usar batch API si está disponible
        if (this.heightmapHandler && typeof this.heightmapHandler.getElevationBatch === 'function') {
            console.log(`🚀 Batch API: ${sampledPoints.length} puntos`);
            
            try {
                const elevations = await this.heightmapHandler.getElevationBatch(sampledPoints);
                
                if (elevations && elevations.length === sampledPoints.length) {
                    sampledPoints.forEach((point, i) => {
                        let elevation = elevations[i];
                        
                        if (elevation === null || elevation === undefined || isNaN(elevation) || !isFinite(elevation)) {
                            elevation = this.generateProceduralHeight(point.lat, point.lon);
                        }
                        
                        const key = cacheKey(point.lat, point.lon);
                        elevationCache.set(key, elevation);
                        
                        let ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                        vegetationCache.set(key, ndvi);
                        
                        sampledData.set(point.originalIndex, { elevation, ndvi });
                    });
                    
                    console.log(`✅ Batch completado`);
                }
            } catch (error) {
                console.error(`❌ Batch falló:`, error);
            }
        }
        
        const samplingTime = ((performance.now() - samplingStart) / 1000).toFixed(2);
        // ELIMINADO LOG: console.log(`⚡ Muestreo completado en ${samplingTime}s`);
        
        // 🎯 PASO 3: Interpolar valores para puntos intermedios
        const interpolationStart = performance.now();
        // ELIMINADO LOG: console.log(`🔄 Interpolando ${points.length - sampledPoints.length} puntos intermedios...`);
        
        // 🔍 Contador de NaN detectados y corregidos
        let nanCount = 0;
        const nanLocations = [];
        
        const enrichedPoints = points.map((point, index) => {
            let elevation, ndvi;
            
            if (sampledIndices.has(index)) {
                // Punto muestreado: usar valor real
                const data = sampledData.get(index);
                elevation = data.elevation;
                ndvi = data.ndvi;
            } else {
                // Punto intermedio: interpolar BILINEALMENTE (simple y predecible) 📐
                const row = Math.floor(index / gridSize);
                const col = index % gridSize;
                
                // 🔥 INTERPOLACIÓN BILINEAR con gridSize correcto
                const interpolated = this.bilinearInterpolate(
                    row, col, gridResolution, samplingRate, sampledData
                );
                
                elevation = interpolated.elevation;
                ndvi = interpolated.ndvi;
            }
            
            // 🛡️ VALIDACIÓN Y CORRECCIÓN DE NaN
            if (isNaN(elevation) || elevation === null || elevation === undefined || !isFinite(elevation)) {
                nanCount++;
                if (nanLocations.length < 10) { // Guardar solo primeros 10 para log
                    nanLocations.push({ lat: point.lat, lon: point.lon, index });
                }
                
                // 🔧 CORRECCIÓN: Interpolar con vecinos válidos
                const row = Math.floor(index / gridSize);
                const col = index % gridSize;
                elevation = this.fixNaNElevation(row, col, gridSize, sampledData, samplingRate);
                
                // Si aún es NaN (todos vecinos inválidos), usar nivel del mar
                if (isNaN(elevation) || !isFinite(elevation)) {
                    elevation = 0; // Nivel del mar como fallback seguro
                }
            }
            
            // Validar NDVI también
            if (isNaN(ndvi) || ndvi === null || ndvi === undefined || !isFinite(ndvi)) {
                ndvi = 0.3; // NDVI medio como fallback
            }
            
            return {
                ...point,
                elevation: elevation,
                ndvi: ndvi,
                x: (point.normX - 0.5) * this.config.realWorldWidth,
                y: elevation * this.config.verticalScale,
                z: (point.normY - 0.5) * this.config.realWorldHeight
            };
        });

        const interpolationTime = ((performance.now() - interpolationStart) / 1000).toFixed(2);
        const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ ${enrichedPoints.length} puntos enriquecidos en ${totalTime}s (muestreo: ${samplingTime}s, interpolación: ${interpolationTime}s)`);
        console.log(`📊 Desglose: ${sampledPoints.length} muestreados, ${enrichedPoints.length - sampledPoints.length} interpolados`);
        
        // 🔍 DEBUG: Exportar TODOS los puntos con coordenadas y elevaciones a JSON
        console.log(`%c📦 EXPORTANDO DATOS COMPLETOS`, 'background: #f48771; color: #000; padding: 4px 8px; font-weight: bold;');
        const exportData = {
            metadata: {
                total_points: enrichedPoints.length,
                sampled_points: sampledPoints.length,
                interpolated_points: enrichedPoints.length - sampledPoints.length,
                generation_time: totalTime + 's',
                timestamp: new Date().toISOString()
            },
            bounds: {
                lat_min: Math.min(...enrichedPoints.map(p => p.lat)),
                lat_max: Math.max(...enrichedPoints.map(p => p.lat)),
                lon_min: Math.min(...enrichedPoints.map(p => p.lon)),
                lon_max: Math.max(...enrichedPoints.map(p => p.lon))
            },
            points: enrichedPoints.map((p, idx) => ({
                index: idx,
                lat: p.lat,
                lon: p.lon,
                elevation: p.elevation,
                ndvi: p.ndvi,
                x: p.x,
                y: p.y,
                z: p.z,
                normX: p.normX,
                normY: p.normY
            }))
        };
        
        // Guardar en variable global para acceso desde consola
        window.TERRAIN_DATA_EXPORT = exportData;
        
        console.log(`✅ Datos exportados a window.TERRAIN_DATA_EXPORT`);
        console.log(`💾 Para descargar como JSON, ejecuta en consola:`);
        console.log(`   const blob = new Blob([JSON.stringify(window.TERRAIN_DATA_EXPORT, null, 2)], {type: 'application/json'});`);
        console.log(`   const url = URL.createObjectURL(blob);`);
        console.log(`   const a = document.createElement('a'); a.href = url; a.download = 'terrain_data.json'; a.click();`);
        console.log(`📊 Primeros 10 puntos:`, exportData.points.slice(0, 10));
        
        // Reportar eficiencia del caché
        const cacheHits = sampledPoints.length - elevationCache.size; // Hits = puntos que ya estaban en caché
        const cacheEfficiency = elevationCache.size > 0 ? ((cacheHits / sampledPoints.length) * 100).toFixed(1) : 0;
        console.log(`⚡ Caché de elevaciones: ${elevationCache.size} únicos, ${cacheHits} hits (${cacheEfficiency}% eficiencia)`);
        
        // Reportar NaN detectados y corregidos
        if (nanCount > 0) {
            console.warn(`⚠️ NaN detectados y corregidos: ${nanCount} puntos (${(nanCount/enrichedPoints.length*100).toFixed(2)}%)`);
            if (nanLocations.length > 0) {
                console.warn(`📍 Primeras ${nanLocations.length} ubicaciones con NaN:`);
                nanLocations.forEach(loc => {
                    console.warn(`   - [${loc.index}] lat=${loc.lat.toFixed(6)}, lon=${loc.lon.toFixed(6)}`);
                });
            }
        }
        
        // ANÁLISIS ESTADÍSTICO (SOLO REPORTE - SIN CLAMP)
        const elevations = enrichedPoints.map(p => p.elevation).filter(e => isFinite(e));
        if (elevations.length > 0) {
            const mean = elevations.reduce((a, b) => a + b) / elevations.length;
            const variance = elevations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / elevations.length;
            const stdDev = Math.sqrt(variance);
            const min = Math.min(...elevations);
            const max = Math.max(...elevations);
            
            console.log(`📊 ESTADÍSTICAS DE ELEVACIÓN (TIF REAL - SIN FILTROS):`);
            console.log(`   📈 Media: ${mean.toFixed(2)}m | Desv. Estándar: ${stdDev.toFixed(2)}m`);
            console.log(`   📉 Mín: ${min.toFixed(2)}m | Máx: ${max.toFixed(2)}m | Rango: ${(max - min).toFixed(2)}m`);
            console.log(`   ✅ USANDO ELEVACIONES REALES DEL TIF (sin clamp ni normalización)`);
            
            // ℹ️ Solo detectar variaciones extremas para información (NO modificar datos)
            const lowerBound = mean - (3 * stdDev);
            const upperBound = mean + (3 * stdDev);
            const extremeCount = enrichedPoints.filter(p => 
                p.elevation < lowerBound || p.elevation > upperBound
            ).length;
            
            if (extremeCount > 0) {
                console.log(`   ℹ️ Variaciones naturales detectadas: ${extremeCount} puntos fuera de ±3σ (${(extremeCount/enrichedPoints.length*100).toFixed(2)}%)`);
                console.log(`   🏔️ Esto es NORMAL en terrenos montañosos - datos preservados sin modificar`);
            }
        }
        
        return enrichedPoints;
    }
    
    /**
     * 🔧 Corregir elevación NaN interpolando con vecinos válidos (8 direcciones)
     * Búsqueda ampliada hasta 4 saltos con peso por distancia
     */
    fixNaNElevation(row, col, gridResolution, sampledData, samplingRate) {
        const neighbors = [];
        
        // 8 direcciones: N, NE, E, SE, S, SW, W, NW
        const directions = [
            [-1, 0], [-1, 1], [0, 1], [1, 1],
            [1, 0], [1, -1], [0, -1], [-1, -1]
        ];
        
        // 🔍 Buscar vecinos válidos en radio ampliado (hasta 4 saltos)
        for (const [dr, dc] of directions) {
            let distance = samplingRate;
            // 🚀 MEJORA: Buscar hasta 4 saltos en lugar de 2
            while (distance <= samplingRate * 4) {
                const neighborRow = row + dr * distance;
                const neighborCol = col + dc * distance;
                
                // Verificar bounds
                if (neighborRow >= 0 && neighborRow < gridResolution && 
                    neighborCol >= 0 && neighborCol < gridResolution) {
                    
                    // Verificar si es punto muestreado
                    if (neighborRow % samplingRate === 0 || neighborCol % samplingRate === 0 ||
                        neighborRow === gridResolution - 1 || neighborCol === gridResolution - 1) {
                        
                        const neighborIndex = neighborRow * gridResolution + neighborCol;
                        const data = sampledData.get(neighborIndex);
                        
                        if (data && !isNaN(data.elevation) && isFinite(data.elevation)) {
                            // 🎯 Peso inversamente proporcional a la distancia
                            const weight = 1.0 / distance;
                            neighbors.push({ elevation: data.elevation, weight });
                            break; // Encontrado vecino válido en esta dirección
                        }
                    }
                }
                distance += samplingRate;
            }
        }
        
        // Si encontramos vecinos válidos, promediar con pesos
        if (neighbors.length > 0) {
            const totalWeight = neighbors.reduce((sum, n) => sum + n.weight, 0);
            const weightedSum = neighbors.reduce((sum, n) => sum + n.elevation * n.weight, 0);
            return weightedSum / totalWeight;
        }
        
        // No hay vecinos válidos, retornar NaN para fallback a nivel del mar
        return NaN;
    }
    
    /**
     * Interpolación bilineal para puntos intermedios
     */
    /**
     * 🎨 Interpolación BICÚBICA (Catmull-Rom) para superficies ultra-suaves
     * Usa 16 puntos vecinos (4×4) en lugar de 4 (2×2) de bilinear
     * Elimina el efecto "piña" y "escalones"
     * @param {number} row - Fila del punto a interpolar
     * @param {number} col - Columna del punto a interpolar
     * @param {number} gridResolution - Resolución total del grid
     * @param {number} samplingRate - Cada cuántos puntos se muestreó
     * @param {Map} sampledData - Mapa de datos muestreados
     * @returns {Object} { elevation, ndvi }
     */
    bicubicInterpolate(row, col, gridResolution, samplingRate, sampledData) {
        // Encontrar los 16 puntos muestreados más cercanos (4×4 grid)
        const row0 = Math.floor(row / samplingRate) * samplingRate;
        const col0 = Math.floor(col / samplingRate) * samplingRate;
        
        // Grid 4×4: [-1, 0, 1, 2] relativo a row0/col0
        const points = [];
        for (let i = -1; i <= 2; i++) {
            for (let j = -1; j <= 2; j++) {
                const r = Math.max(0, Math.min(gridResolution - 1, row0 + i * samplingRate));
                const c = Math.max(0, Math.min(gridResolution - 1, col0 + j * samplingRate));
                const idx = r * gridResolution + c;
                points.push(sampledData.get(idx) || { elevation: 0, ndvi: 0 });
            }
        }
        
        // Factores de interpolación (0-1)
        const tx = (row - row0) / samplingRate;
        const ty = (col - col0) / samplingRate;
        
        // Función de interpolación Catmull-Rom (cúbica suave)
        const catmullRom = (t, p0, p1, p2, p3) => {
            const t2 = t * t;
            const t3 = t2 * t;
            return 0.5 * (
                (2 * p1) +
                (-p0 + p2) * t +
                (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
                (-p0 + 3 * p1 - 3 * p2 + p3) * t3
            );
        };
        
        // Interpolar elevación en 4 filas
        const elevRows = [];
        for (let i = 0; i < 4; i++) {
            const row = catmullRom(
                ty,
                points[i * 4 + 0].elevation,
                points[i * 4 + 1].elevation,
                points[i * 4 + 2].elevation,
                points[i * 4 + 3].elevation
            );
            elevRows.push(row);
        }
        
        // Interpolar entre las 4 filas
        const elevation = catmullRom(tx, elevRows[0], elevRows[1], elevRows[2], elevRows[3]);
        
        // Interpolar NDVI en 4 filas
        const ndviRows = [];
        for (let i = 0; i < 4; i++) {
            const row = catmullRom(
                ty,
                points[i * 4 + 0].ndvi,
                points[i * 4 + 1].ndvi,
                points[i * 4 + 2].ndvi,
                points[i * 4 + 3].ndvi
            );
            ndviRows.push(row);
        }
        
        // Interpolar entre las 4 filas
        const ndvi = catmullRom(tx, ndviRows[0], ndviRows[1], ndviRows[2], ndviRows[3]);
        
        return { elevation, ndvi };
    }
    
    /**
     * 🔧 INTERPOLACIÓN BILINEAR CLAMPEADA (sin overshooting)
     * Garantiza que los valores interpolados NUNCA excedan los límites de los puntos vecinos
     * @param {number} row - Fila del punto (0 a gridSize-1)
     * @param {number} col - Columna del punto (0 a gridSize-1)
     * @param {number} resolution - Resolución original del grid (gridSize - 1)
     * @param {number} samplingRate - Cada cuántos puntos se muestreó
     * @param {Map} sampledData - Mapa de índice → {elevation, ndvi}
     */
    bilinearInterpolate(row, col, resolution, samplingRate, sampledData) {
        const gridSize = resolution + 1; // Tamaño real del grid
        
        // Encontrar los 4 puntos muestreados más cercanos
        const row0 = Math.floor(row / samplingRate) * samplingRate;
        const row1 = Math.min(row0 + samplingRate, resolution);
        const col0 = Math.floor(col / samplingRate) * samplingRate;
        const col1 = Math.min(col0 + samplingRate, resolution);
        
        // Índices de los 4 puntos en el grid lineal
        const idx00 = row0 * gridSize + col0;
        const idx01 = row0 * gridSize + col1;
        const idx10 = row1 * gridSize + col0;
        const idx11 = row1 * gridSize + col1;
        
        // Obtener datos (con fallback)
        const data00 = sampledData.get(idx00);
        const data01 = sampledData.get(idx01);
        const data10 = sampledData.get(idx10);
        const data11 = sampledData.get(idx11);
        
        // Si faltan datos, usar interpolación simple con los disponibles
        if (!data00 && !data01 && !data10 && !data11) {
            // Sin datos, retornar valores por defecto
            return { elevation: 0, ndvi: 0.3 };
        }
        
        // Usar el primer dato disponible como fallback
        const fallback = data00 || data01 || data10 || data11;
        const d00 = data00 || fallback;
        const d01 = data01 || fallback;
        const d10 = data10 || fallback;
        const d11 = data11 || fallback;
        
        // Factores de interpolación (0-1) con smoothstep para transiciones más suaves
        const tx = row1 > row0 ? (row - row0) / (row1 - row0) : 0;
        const ty = col1 > col0 ? (col - col0) / (col1 - col0) : 0;
        
        // 🎨 Smoothstep para curvas más naturales (opcional, desactivado por defecto)
        // const txSmooth = tx * tx * (3 - 2 * tx);
        // const tySmooth = ty * ty * (3 - 2 * ty);
        
        // Interpolar elevación - FÓRMULA ESTÁNDAR BILINEAR
        const elev0 = d00.elevation * (1 - ty) + d01.elevation * ty;
        const elev1 = d10.elevation * (1 - ty) + d11.elevation * ty;
        let elevation = elev0 * (1 - tx) + elev1 * tx;
        
        // 🛡️ CLAMPEAR: asegurar que el valor interpolado esté dentro del rango de los 4 puntos
        const elevMin = Math.min(d00.elevation, d01.elevation, d10.elevation, d11.elevation);
        const elevMax = Math.max(d00.elevation, d01.elevation, d10.elevation, d11.elevation);
        elevation = Math.max(elevMin, Math.min(elevMax, elevation));
        
        // Interpolar NDVI
        const ndvi0 = d00.ndvi * (1 - ty) + d01.ndvi * ty;
        const ndvi1 = d10.ndvi * (1 - ty) + d11.ndvi * ty;
        let ndvi = ndvi0 * (1 - tx) + ndvi1 * tx;
        
        // Clampear NDVI también
        const ndviMin = Math.min(d00.ndvi, d01.ndvi, d10.ndvi, d11.ndvi);
        const ndviMax = Math.max(d00.ndvi, d01.ndvi, d10.ndvi, d11.ndvi);
        ndvi = Math.max(ndviMin, Math.min(ndviMax, ndvi));
        
        return { elevation, ndvi };
    }

    /**
     * 🎯 MÉTODO CRÍTICO: Generar grid de puntos con coordenadas geográficas reales
     * Este método crea el grid basado en bounds de Leaflet
     */
    async generatePointGrid(bounds, resolution) {
        const points = [];
        const { _southWest, _northEast } = bounds;
        
        const south = _southWest.lat;
        const west = _southWest.lng;
        const north = _northEast.lat;
        const east = _northEast.lng;

        const latStep = (north - south) / resolution;
        const lonStep = (east - west) / resolution;

        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const lat = south + (i * latStep);
                const lon = west + (j * lonStep);

                points.push({
                    lat: lat,
                    lon: lon,
                    gridX: j,
                    gridY: i,
                    normX: j / resolution,
                    normY: i / resolution
                });
            }
        }

        return points;
    }

    /**
     * Generar grid de puntos virtuales (sin coordenadas geográficas)
     */
    generateVirtualPointGrid(size, resolution) {
        const points = [];
        const centerLat = -34.6; // Centro aproximado de Buenos Aires
        const centerLon = -58.4;

        // Calcular bounds virtuales centrados
        const halfSize = size / 2;
        const latRange = halfSize / 111000; // Aproximadamente metros a grados latitud
        const lonRange = halfSize / (111000 * Math.cos(centerLat * Math.PI / 180)); // Ajuste por latitud

        const north = centerLat + latRange;
        const south = centerLat - latRange;
        const east = centerLon + lonRange;
        const west = centerLon - lonRange;

        const latStep = (north - south) / resolution;
        const lonStep = (east - west) / resolution;

        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const lat = south + (i * latStep);
                const lon = west + (j * lonStep);

                points.push({
                    lat: lat,
                    lon: lon,
                    gridX: j,
                    gridY: i,
                    normX: j / resolution,
                    normY: i / resolution
                });
            }
        }

        return points;
    }

    /**
     * Enriquecer puntos virtuales con datos procedurales
     */
    async enrichVirtualPointsWithData(points) {
        const enrichedPoints = [];

        for (const point of points) {
            // Generar elevación procedural
            const elevation = this.generateProceduralHeight(point.lat, point.lon);

            // Generar NDVI procedural
            const ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);

            enrichedPoints.push({
                ...point,
                elevation: elevation,
                ndvi: ndvi,
                // Coordenadas 3D calculadas
                x: (point.normX - 0.5) * this.config.realWorldWidth,
                y: elevation * this.config.verticalScale,
                z: (point.normY - 0.5) * this.config.realWorldHeight
            });
        }

        return enrichedPoints;
    }

    /**
     * Generar altura procedural usando ruido simple
     */
    generateProceduralHeight(lat, lon) {
        // Usar coordenadas para generar variación pseudo-aleatoria
        const seed1 = Math.sin(lat * 0.1) * Math.cos(lon * 0.1);
        const seed2 = Math.sin(lat * 0.05 + lon * 0.07) * 0.5;
        const seed3 = Math.sin(lat * 0.02 + lon * 0.03) * 0.25;

        // Combinar para crear terreno variado
        let height = (seed1 + seed2 + seed3) * 50; // -150m a +150m

        // Agregar algo de elevación base
        height += 10;

        // Limitar rango razonable
        return Math.max(-50, Math.min(200, height));
    }

    /**
     * Generar NDVI procedural basado en elevación y coordenadas
     */
    generateProceduralNDVI(lat, lon, elevation) {
        // NDVI típico: -1 (agua) a +1 (vegetación densa)
        // Usar elevación y coordenadas para variar

        let ndvi = 0.2; // Valor base (suelo)

        // Vegetación más densa en áreas elevadas
        if (elevation > 20) {
            ndvi += 0.3;
        }

        // Variación pseudo-aleatoria por coordenadas
        const variation = Math.sin(lat * 0.01) * Math.cos(lon * 0.01) * 0.2;
        ndvi += variation;

        // Limitar rango NDVI
        return Math.max(-0.5, Math.min(0.8, ndvi));
    }

    /**
     * Detectar entorno automáticamente
     */
    _detectEnvironment() {
        if (typeof window === 'undefined') return false;
        
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Considerar local cualquier puerto de desarrollo común
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname === '' ||
                           hostname.startsWith('192.168.') ||
                           hostname.startsWith('10.') ||
                           port === '5501' || 
                           port === '5500' ||
                           port === '8000' ||
                           port === '3000' ||
                           port === '4000' ||
                           port === '5000' ||
                           port === '8080' ||
                           port === '9000' ||
                           // También considerar cualquier puerto que no sea el de producción
                           (hostname.includes('localhost') || hostname.includes('127.0.0.1'));
        
        console.log(`🌍 TerrainGenerator3D entorno detectado: ${isLocalhost ? 'LOCAL' : 'PRODUCCIÓN'} (host: ${hostname}, port: ${port})`);
        return isLocalhost;
    }
    
    /**
     * Agregar capa de vegetación basada en features
     */
    async addVegetationLayer(enrichedPoints) {
        if (!window.THREE) {
            console.warn('⚠️ THREE.js no disponible - vegetación omitida');
            return;
        }
        
        // ✅ Sistema basado en features (RECUPERADO - funcionaba bien)
        if (this.satelliteAnalyzer && this.satelliteAnalyzer.getFeatures) {
            console.log('🎯 Usando sistema basado en FEATURES AGRUPADOS');
            return await this.addVegetationByFeatures(enrichedPoints);
        }
        
        console.warn('⚠️ SatelliteAnalyzer no disponible - vegetación omitida');
    }
    
    /**
     * ✅ Sistema basado en features (RECUPERADO - funcionaba bien)
     */
    async addVegetationByFeatures(enrichedPoints) {
        console.log('🗺️ Iniciando sistema basado en features agrupados...');
        
        try {
            const imageData = this.satelliteAnalyzer.imageData;
            const features = this.satelliteAnalyzer.getFeatures();
            
            if (!imageData || !features || features.length === 0) {
                console.warn('⚠️ No hay datos de imagen satelital - vegetación omitida');
                return [];
            }
            
            console.log(`📊 Features disponibles: ${features.length}`);
            
            // Agrupar features por tipo
            const featuresByType = this.groupFeaturesByType(features);
            console.log(`📊 Features agrupados:`, Object.keys(featuresByType).map(k => `${k}=${featuresByType[k].length}`).join(', '));
            
            // Generar instancias desde features agrupados
            const instances = this.createInstancesFromFeatures(featuresByType, imageData);
            
            console.log(`✅ ${instances.length} instancias preparadas desde features`);
            
            if (instances.length === 0) {
                console.warn('⚠️ No se generaron instancias');
                return [];
            }
            
            // 🔥 AJUSTAR ALTURA Y con elevación PRECISA del terreno
            console.log('📏 Ajustando altura de árboles según terreno...');
            
            instances.forEach((inst, idx) => {
                // 🎯 MÉTODO 1: Usar elevationHandler si está disponible
                let terrainY = 0;
                let method = 'fallback';
                
                if (this.elevationHandler && typeof this.elevationHandler.getHeightAt === 'function') {
                    try {
                        // Convertir posición 3D a lat/lng
                        const worldPos = inst.position;
                        
                        // Usar elevationHandler para obtener altura EXACTA
                        const elevation = this.elevationHandler.getHeightAt(worldPos.x, worldPos.z);
                        
                        if (elevation !== null && elevation !== undefined) {
                            terrainY = (elevation - (this.terrainMinElevation || 0)) * this.config.verticalScale;
                            method = 'elevationHandler';
                        }
                    } catch (e) {
                        // Silenciar error, usar fallback
                    }
                }
                
                // 🎯 MÉTODO 2: Usar enrichedPoints (punto más cercano con elevación)
                if (method === 'fallback' && enrichedPoints && enrichedPoints.length > 0) {
                    const closest = enrichedPoints.reduce((prev, curr) => {
                        const distPrev = Math.hypot(prev.x - inst.position.x, prev.z - inst.position.z);
                        const distCurr = Math.hypot(curr.x - inst.position.x, curr.z - inst.position.z);
                        return distCurr < distPrev ? curr : prev;
                    });
                    
                    terrainY = (closest.elevation - (this.terrainMinElevation || 0)) * this.config.verticalScale;
                    method = 'enrichedPoints';
                }
                
                // 🎯 CRÍTICO: Agregar offset mínimo para que troncos NO se entierren
                // Árboles necesitan estar SOBRE el piso, no hundidos
                const yOffset = 0.5; // Offset pequeño (antes era 3.0, demasiado alto)
                inst.position.y = terrainY + yOffset;
                
                // Debug primeros 5
                if (idx < 5) {
                    console.log(`🌳 Árbol ${idx}: terrainY=${terrainY.toFixed(2)}, offset=+${yOffset}, final Y=${inst.position.y.toFixed(2)} (método: ${method})`);
                }
            });
            
            console.log('✅ Alturas ajustadas para todos los árboles');
            
            // Convertir instancias a objetos 3D
            console.log(`🔨 Convirtiendo ${instances.length} instancias a objetos 3D...`);
            const vegetationObjects = await this.createVegetationFromInstances(instances);
            
            console.log(`✅ ${vegetationObjects.length} objetos 3D creados y listos para renderizar`);
            
            // 🔍 Debug: Mostrar primeros 3 objetos
            vegetationObjects.slice(0, 3).forEach((obj, idx) => {
                console.log(`🌲 Objeto ${idx}: pos=(${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)}), visible=${obj.visible}`);
            });
            
            return vegetationObjects;
            
        } catch (error) {
            console.error('❌ Error en sistema basado en features:', error);
            return [];
        }
    }
    
    /**
     * Agrupar features por tipo
     */
    groupFeaturesByType(features) {
        const grouped = {};
        
        features.forEach(feature => {
            if (!grouped[feature.type]) {
                grouped[feature.type] = [];
            }
            grouped[feature.type].push(feature);
        });
        
        return grouped;
    }
    
    /**
     * Crear instancias de vegetación desde features agrupados (RECUPERADO)
     */
    createInstancesFromFeatures(featuresByType, imageData) {
        const instances = [];
        const width = imageData.width;
        const height = imageData.height;
        
        console.log(`🎨 createInstancesFromFeatures - imageData: ${width}×${height}`);
        
        // 🌳 CONFIGURACIÓN DE VEGETACIÓN ADAPTATIVA
        // FILOSOFÍA: BAJA densidad para evitar sobrecarga visual
        // - FOREST (verde oscuro): BAJA densidad (bosque ralo)
        // - VEGETATION (verde medio): MUY BAJA densidad (vegetación dispersa)
        // - GRASS (verde claro): DESACTIVADO
        //
        // 🔥 DENSIDADES REDUCIDAS DRAMÁTICAMENTE para evitar sobrecarga
        const densityConfig = {
            'vegetation': { 
                density: 0.02,          // 🔥 2% densidad - REDUCIDO DRAMÁTICAMENTE (antes 30%)
                models: [
                    // trees_low.glb - PRINCIPAL (50% árboles bajos)
                    { type: 'trees_low', weight: 5, scale: [0.2, 0.3] }, // REDUCIDO 10x
                    
                    // trees_low.glb - MEDIANOS (30% escalados más grandes)
                    { type: 'trees_low', weight: 3, scale: [0.35, 0.45] }, // REDUCIDO 10x
                    
                    // arbol.glb - ALTOS (20% árboles grandes)
                    { type: 'arbol', weight: 2, scale: [0.8, 1.2] } // REDUCIDO 10x
                ],
                priority: 2
            },
            'forest': { 
                density: 0.03,          // 🔥 3% densidad - REDUCIDO DRAMÁTICAMENTE (antes 40%)
                models: [
                    // trees_low.glb - BAJO (40%)
                    { type: 'trees_low', weight: 4, scale: [0.25, 0.35] }, // REDUCIDO 10x
                    
                    // trees_low.glb - MEDIANO (30%)  
                    { type: 'trees_low', weight: 3, scale: [0.4, 0.55] }, // REDUCIDO 10x
                    
                    // arbol.glb - ALTO (30%)
                    { type: 'arbol', weight: 3, scale: [1.0, 1.5] } // REDUCIDO 10x
                ],
                priority: 1
            },
            'grass': { 
                density: 0.00,          // ❌ DESACTIVADO (solo árboles)
                models: [
                    { type: 'grass', weight: 1, scale: [0.00005, 0.0001] } // REDUCIDO 10x
                ],
                priority: 3
            },
            'crops': { 
                density: 0.00,          // ❌ DESACTIVADO (solo árboles)
                models: [
                    { type: 'trees_low', weight: 1, scale: [0.15, 0.2] }   // REDUCIDO 10x
                ],
                priority: 2
            }
        };
        
        console.log(`📊 Configuración de diversidad por tipo:`);
        Object.entries(densityConfig).forEach(([type, config]) => {
            const modelList = config.models.map(m => `${m.type}(${m.weight})`).join(', ');
            console.log(`  ${type}: ${(config.density * 100).toFixed(0)}% - [${modelList}]`);
        });
        
        const instanceCounts = {};
        
        // 🎲 Función para seleccionar modelo según pesos
        const selectModelByWeight = (models) => {
            const totalWeight = models.reduce((sum, m) => sum + m.weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const model of models) {
                random -= model.weight;
                if (random <= 0) return model;
            }
            return models[models.length - 1]; // Fallback
        };
        
        // Para cada tipo relevante
        for (const [featureType, features] of Object.entries(featuresByType)) {
            const config = densityConfig[featureType];
            if (!config) {
                console.log(`⏭️ Ignorando tipo no vegetal: '${featureType}'`);
                continue;
            }
            
            console.log(`🌿 Procesando ${features.length} features de tipo '${featureType}' (densidad: ${(config.density * 100).toFixed(0)}%)...`);
            
            let createdCount = 0;
            const typeModelCounts = {};
            
            features.forEach((feature, idx) => {
                // Decidir si colocar instancia
                if (Math.random() > config.density) return;
                
                createdCount++;
                
                // 🎲 Seleccionar modelo según sistema de pesos
                const selectedModel = selectModelByWeight(config.models);
                
                // Convertir píxel a coordenadas 3D
                const pos3D = this.imageToTerrainCoords(feature.x, feature.y);
                
                // ❌ NO agregar variación de posición - posicionar exactamente donde OSM indica
                // Los árboles deben estar sobre las manchas verdes de OpenStreetMap
                // const jitter = 2.0;
                // pos3D.x += (Math.random() - 0.5) * jitter;
                // pos3D.z += (Math.random() - 0.5) * jitter;
                
                // Crear instancia con modelo seleccionado
                instances.push({
                    type: selectedModel.type,
                    position: pos3D,
                    scale: selectedModel.scale[0] + Math.random() * (selectedModel.scale[1] - selectedModel.scale[0]),
                    rotation: Math.random() * Math.PI * 2
                });
                
                // Contar por tipo de modelo
                typeModelCounts[selectedModel.type] = (typeModelCounts[selectedModel.type] || 0) + 1;
            });
            
            instanceCounts[featureType] = { total: createdCount, models: typeModelCounts };
            console.log(`  ✅ ${featureType}: ${createdCount}/${features.length} instancias (${(createdCount / features.length * 100).toFixed(1)}%)`);
            console.log(`     Distribución:`, typeModelCounts);
        }
        
        console.log(`📊 Resumen de instancias por tipo:`, instanceCounts);
        console.log(`🎯 Total de instancias: ${instances.length}`);
        
        return instances;
    }
    
    /**
     * Crear objetos 3D desde instancias preparadas (RECUPERADO)
     */
    async createVegetationFromInstances(instances) {
        console.log(`🌳 Creando ${instances.length} objetos 3D desde instancias...`);
        
        // Las instancias ya tienen position como Vector3
        const instancesWith3D = instances.map(inst => {
            const position = inst.position.clone();
            
            // Obtener elevación en esa posición (ya ajustada arriba)
            // position.y ya está ajustado con la elevación correcta
            
            return {
                ...inst,
                position: position
            };
        });
        
        // Usar VegetationInstancer si está disponible
        if (this.vegetationInstancer && this.useInstancing) {
            console.log('✅ Usando VegetationInstancer');
            const result = await this.vegetationInstancer.addInstances(instancesWith3D);
            
            if (result && result.length > 0) {
                this.vegetationObjects = result;
                return result;
            }
        }
        
        // 🚀 OPTIMIZADO: Crear meshes individuales en LOTES PARALELOS
        console.log('📍 Creando meshes individuales (sistema optimizado)');
        console.time('⏱️ Creación vegetación');
        const objects = [];
        
        let successCount = 0;
        let errorCount = 0;
        
        // 🔥 PROCESAR EN LOTES DE 50 (balance entre memoria y velocidad)
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < instancesWith3D.length; i += BATCH_SIZE) {
            batches.push(instancesWith3D.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`🎯 Procesando ${instancesWith3D.length} instancias en ${batches.length} lotes de ${BATCH_SIZE}`);
        
        for (let b = 0; b < batches.length; b++) {
            const batch = batches[b];
            
            console.log(`⏳ Lote ${b + 1}/${batches.length} (${batch.length} instancias)...`);
            
            // ✅ PARALELO: Crear todos los objetos del lote simultáneamente
            const batchPromises = batch.map(async (inst) => {
                try {
                    const obj = await this.createVegetationObject(inst, inst.type);
                    if (obj) {
                        successCount++;
                        return obj;
                    } else {
                        errorCount++;
                        return null;
                    }
                } catch (error) {
                    console.error(`❌ Error en instancia tipo ${inst.type}:`, error);
                    errorCount++;
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            objects.push(...batchResults.filter(obj => obj !== null));
            
            // Pequeña pausa entre lotes para no bloquear UI
            if (b < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        console.timeEnd('⏱️ Creación vegetación');
        console.log(`✅ Vegetación completada: ${successCount} objetos creados, ${errorCount} errores`);
        this.vegetationObjects = objects;
        return objects;
    }

    /**
     * Determinar tipo de vegetación basado en NDVI
     */
    determineVegetationType(ndvi) {
        const thresholds = this.config.ndviThresholds;

        if (ndvi >= thresholds.tree_tall.min) return 'tree_tall';
        if (ndvi >= thresholds.tree_medium.min) return 'tree_medium';
        if (ndvi >= thresholds.bush.min) return 'bush';
        if (ndvi >= thresholds.grass.min) return 'grass';

        return 'grass'; // Fallback
    }

    /**
     * Crear objeto de vegetación en una posición específica
     */
    async createVegetationObject(point, type) {
        try {
            // Generar ID único
            const id = `veg_${type}_${Math.random().toString(36).substr(2, 9)}`;

            // 🚫 DESACTIVAR VegetationInstancer temporalmente (problema con texturas)
            // Usar meshes individuales que cargan texturas correctamente
            const forceIndividualMeshes = false;
            
            if (this.vegetationInstancer && this.useInstancing && !forceIndividualMeshes) {
                const instances = await this.vegetationInstancer.addInstances([{
                    id,
                    type,
                    position: new THREE.Vector3(point.x, point.y, point.z),
                    scale: this.getVegetationScale(type),
                    rotation: Math.random() * Math.PI * 2
                }]);

                if (instances && instances.length > 0) {
                    const instance = instances[0]; // Tomar la primera instancia del array
                    return {
                        id,
                        type: 'vegetation',
                        vegetationType: type,
                        mesh: instance,
                        position: new THREE.Vector3(point.x, point.y, point.z),
                        isInstanced: true
                    };
                }
            }

            // Fallback: crear mesh individual usando modelLoader
            if (this.modelLoader) {
                console.log(`🔍 Cargando modelo ${type}...`);
                const mesh = await this.modelLoader.loadModel(type);

                if (mesh) {
                    console.log(`✅ Modelo ${type} cargado correctamente`);
                    // Configurar posición
                    mesh.position.set(point.x, point.y, point.z);

                    // Aplicar escala
                    const scale = this.getVegetationScale(type);
                    mesh.scale.setScalar(scale);

                    // Rotación aleatoria
                    mesh.rotation.y = Math.random() * Math.PI * 2;

                    // Configurar sombras
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    // Agregar a escena si tenemos acceso
                    if (this.maira3DSystem && this.maira3DSystem.scene) {
                        this.maira3DSystem.scene.add(mesh);
                        // Log solo primeros 5 para no saturar consola
                        console.log(`➕ Mesh ${type} agregado a escena en pos=(${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)})`);
                    } else {
                        console.warn(`⚠️ No hay escena disponible para agregar ${type}`);
                    }

                    // ✅ SIMPLIFICADO: Retornar mesh directamente (como test-terrain-from-map-OPTIMIZADO.html)
                    // Ya no necesitamos wrapper object
                    mesh.userData = {
                        id,
                        type: 'vegetation',
                        vegetationType: type,
                        isInstanced: false
                    };
                    
                    return mesh;  // ✅ Retorno directo del mesh THREE.Object3D
                } else {
                    console.warn(`⚠️ modelLoader.loadModel(${type}) devolvió null`);
                }
            } else {
                console.warn(`⚠️ No hay modelLoader disponible`);
            }

            // Último fallback: geometría procedural básica
            console.warn(`⚠️ Creando geometría procedural para ${type} (modelos no disponibles)`);
            return this.createProceduralVegetation(point, type, id);

        } catch (error) {
            console.error(`❌ Error creando objeto de vegetación ${type}:`, error);
            return null;
        }
    }

    /**
     * Obtener escala apropiada para tipo de vegetación
     */
    getVegetationScale(type) {
        // 🔧 ESCALAS AJUSTADAS PARA VegetationInstancer - Más razonables con escala base 0.00001 en modelos
        const scales = {
            grass: 50 + Math.random() * 20,         // 50-70 (tamaño pasto) - REDUCIDO 10x
            bush: 60 + Math.random() * 20,          // 60-80 (tamaño arbusto) - REDUCIDO 10x
            tree_medium: 80 + Math.random() * 30,   // 80-110 (árbol mediano) - REDUCIDO 10x
            tree_tall: 100 + Math.random() * 40     // 100-140 (árbol alto) - REDUCIDO 10x
        };

        return scales[type] || 80; // Fallback
    }

    /**
     * Crear geometría procedural de vegetación como último recurso
     */
    createProceduralVegetation(point, type, id) {
        let geometry, material, mesh;

        switch (type) {
            case 'grass':
                // Crear pasto simple (cilindro delgado)
                geometry = new THREE.CylinderGeometry(0.0005, 0.0005, 0.003, 6);
                material = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
                mesh = new THREE.Mesh(geometry, material);
                break;

            case 'bush':
                // Crear arbusto (esfera achatada)
                geometry = new THREE.SphereGeometry(0.004, 8, 6);
                geometry.scale(1, 0.6, 1); // Achatado
                material = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
                mesh = new THREE.Mesh(geometry, material);
                break;

            case 'tree_medium':
            case 'tree_tall':
                // Crear árbol simple (tronco + copa)
                const trunkGeometry = new THREE.CylinderGeometry(0.001, 0.0015, 0.02, 8);
                const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

                const crownGeometry = new THREE.SphereGeometry(0.012, 8, 6);
                const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const crown = new THREE.Mesh(crownGeometry, crownMaterial);
                crown.position.y = 0.015;

                mesh = new THREE.Group();
                mesh.add(trunk);
                mesh.add(crown);
                break;

            default:
                // Fallback genérico
                geometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
                material = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
                mesh = new THREE.Mesh(geometry, material);
        }

        // Configurar posición
        mesh.position.set(point.x, point.y, point.z);

        // Rotación aleatoria
        mesh.rotation.y = Math.random() * Math.PI * 2;

        // Configurar sombras
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Agregar a escena si tenemos acceso
        if (this.maira3DSystem && this.maira3DSystem.scene) {
            this.maira3DSystem.scene.add(mesh);
        }

        return {
            id,
            type: 'vegetation',
            vegetationType: type,
            mesh,
            position: new THREE.Vector3(point.x, point.y, point.z),
            isInstanced: false,
            isProcedural: true
        };
    }

    /**
     * Limpiar toda la vegetación
     */
    clearVegetation() {
        // Remover de escena
        this.vegetationObjects.forEach(veg => {
            if (veg.mesh) {
                if (this.maira3DSystem && this.maira3DSystem.scene) {
                    this.maira3DSystem.scene.remove(veg.mesh);
                }
                // Liberar geometría/material si es necesario
                if (veg.mesh.geometry) veg.mesh.geometry.dispose();
                if (veg.mesh.material) {
                    if (Array.isArray(veg.mesh.material)) {
                        veg.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        veg.mesh.material.dispose();
                    }
                }
            }
        });

        // Limpiar array
        this.vegetationObjects = [];
        console.log('🧹 Vegetación limpiada');
    }

    /**
     * Calcular estadísticas de los puntos del terreno
     */
    calculateStats(points) {
        if (!points || points.length === 0) {
            return {
                points: 0,
                elevation: { min: 0, max: 0, avg: 0 },
                ndvi: { min: 0, max: 0, avg: 0 },
                vegetation: { total: 0, types: {} },
                realDimensions: { widthMeters: 0, heightMeters: 0 }
            };
        }

        let minElevation = Infinity;
        let maxElevation = -Infinity;
        let sumElevation = 0;
        let minNDVI = Infinity;
        let maxNDVI = -Infinity;
        let sumNDVI = 0;
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLon = Infinity;
        let maxLon = -Infinity;

        points.forEach(point => {
            // Elevación
            if (point.elevation !== undefined) {
                minElevation = Math.min(minElevation, point.elevation);
                maxElevation = Math.max(maxElevation, point.elevation);
                sumElevation += point.elevation;
            }

            // NDVI
            if (point.ndvi !== undefined) {
                minNDVI = Math.min(minNDVI, point.ndvi);
                maxNDVI = Math.max(maxNDVI, point.ndvi);
                sumNDVI += point.ndvi;
            }

            // Coordenadas
            if (point.lat !== undefined) {
                minLat = Math.min(minLat, point.lat);
                maxLat = Math.max(maxLat, point.lat);
            }
            if (point.lon !== undefined) {
                minLon = Math.min(minLon, point.lon);
                maxLon = Math.max(maxLon, point.lon);
            }
        });

        const avgElevation = sumElevation / points.length;
        const avgNDVI = sumNDVI / points.length;

        return {
            points: points.length,
            elevation: {
                min: minElevation === Infinity ? 0 : minElevation,
                max: maxElevation === -Infinity ? 0 : maxElevation,
                avg: isNaN(avgElevation) ? 0 : avgElevation
            },
            ndvi: {
                min: minNDVI === Infinity ? 0 : minNDVI,
                max: maxNDVI === -Infinity ? 0 : maxNDVI,
                avg: isNaN(avgNDVI) ? 0 : avgNDVI
            },
            vegetation: {
                total: this.vegetationObjects.length,
                types: this._countVegetationTypes()
            },
            bounds: {
                minLat: minLat === Infinity ? 0 : minLat,
                maxLat: maxLat === -Infinity ? 0 : maxLat,
                minLon: minLon === Infinity ? 0 : minLon,
                maxLon: maxLon === -Infinity ? 0 : maxLon
            },
            realDimensions: {
                widthMeters: this.config.realWorldWidth || 0,
                heightMeters: this.config.realWorldHeight || 0
            }
        };
    }

    /**
     * Contar tipos de vegetación
     */
    _countVegetationTypes() {
        const counts = {};
        this.vegetationObjects.forEach(veg => {
            const type = veg.vegetationType || 'unknown';
            counts[type] = (counts[type] || 0) + 1;
        });
        return counts;
    }

    /**
     * 📏 Calcular dimensiones reales en metros usando fórmula de Haversine
     */
    calculateRealWorldDimensions(bounds) {
        const { _southWest, _northEast } = bounds;
        
        // Calcular ancho (distancia este-oeste)
        const widthMeters = this.haversineDistance(
            _southWest.lat,
            _southWest.lng,
            _southWest.lat,
            _northEast.lng
        );
        
        // Calcular alto (distancia norte-sur)
        const heightMeters = this.haversineDistance(
            _southWest.lat,
            _southWest.lng,
            _northEast.lat,
            _southWest.lng
        );
        
        return { widthMeters, heightMeters };
    }

    /**
     * 🌍 Fórmula de Haversine para calcular distancia entre dos puntos geográficos
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distancia en metros
    }

    /**
     * Convertir coordenadas de píxel imagen a coordenadas 3D del terreno
     */
    imageToTerrainCoords(imgX, imgY) {
        if (!this.satelliteAnalyzer || !this.satelliteAnalyzer.imageData) {
            console.warn('⚠️ No hay imageData disponible');
            return new THREE.Vector3(0, 0, 0);
        }
        
        const imageWidth = this.satelliteAnalyzer.imageData.width;
        const imageHeight = this.satelliteAnalyzer.imageData.height;
        
        // Normalizar coordenadas de imagen (0-1)
        const normX = imgX / imageWidth;
        const normY = imgY / imageHeight;
        
        // Usar dimensiones rectangulares reales
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const height = this.config.realWorldHeight || this.config.realWorldSize;
        
        // Mapear a coordenadas del terreno con dimensiones correctas
        const x = (normX - 0.5) * width;
        const z = (normY - 0.5) * height;
        
        return new THREE.Vector3(x, 0, z);
    }

    /**
     * 🔍 Calcular factor de escala basado en zoom del map
     */
    calculateZoomScaleFactor(zoom) {
        // Zoom 10 = 1x (escala real)
        // Zoom 15 = 2x (más detalle)
        // Zoom 20 = 4x (máximo detalle)
        // Zoom 5 = 0.5x (vista amplia)
        
        const baseZoom = 10;
        const zoomDiff = zoom - baseZoom;
        
        // Escala exponencial: cada nivel de zoom duplica/mitad el tamaño
        const scaleFactor = Math.pow(1.5, zoomDiff / 5);
        
        // Limitar entre 0.5x y 4x
        return Math.max(0.5, Math.min(4.0, scaleFactor));
    }

    /**
     * Actualizar configuración del terreno
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        console.log('🔧 Configuración actualizada:', this.config);
    }

    /**
     * Limpiar terreno completo
     */
    clearTerrain() {
        // Limpiar vegetación
        this.clearVegetation();

        // Limpiar malla de terreno
        if (this.terrainMesh) {
            if (this.maira3DSystem && this.maira3DSystem.scene) {
                this.maira3DSystem.scene.remove(this.terrainMesh);
            }
            
            // Liberar recursos
            if (this.terrainMesh.geometry) {
                this.terrainMesh.geometry.dispose();
            }
            if (this.terrainMesh.material) {
                if (this.terrainMesh.material.map) {
                    this.terrainMesh.material.map.dispose();
                }
                this.terrainMesh.material.dispose();
            }
            
            this.terrainMesh = null;
        }

        this.bounds = null;
        console.log('🧹 Terreno limpiado completamente');
    }
    
    /**
     * 🎯 Obtener NDVI real de TIF para puntos específicos (usado por sistemas de marcha/transitabilidad)
     * @param {Array<{lat: number, lon: number}>} points - Puntos a consultar
     * @returns {Promise<Array<{lat, lon, ndvi, elevation}>>} - Datos de cada punto
     */
    async getTerrainDataForPoints(points) {
        if (!this.vegetationHandler) {
            console.warn('⚠️ VegetationHandler no disponible, usando valores procedurales');
            return points.map(p => ({
                lat: p.lat,
                lon: p.lon,
                ndvi: 0.3,
                elevation: 0
            }));
        }
        
        const results = [];
        
        for (const point of points) {
            try {
                // Obtener NDVI real del TIF
                let ndvi = 0.3; // Default
                if (typeof this.vegetationHandler.getNDVI === 'function') {
                    ndvi = await this.vegetationHandler.getNDVI(point.lat, point.lon);
                    if (isNaN(ndvi) || ndvi === null) {
                        ndvi = 0.3;
                    }
                }
                
                // Obtener elevación real del TIF
                let elevation = 0; // Default
                if (this.heightmapHandler && typeof this.heightmapHandler.getElevation === 'function') {
                    elevation = await this.heightmapHandler.getElevation(point.lat, point.lon);
                    if (isNaN(elevation) || elevation === null) {
                        elevation = 0;
                    }
                }
                
                results.push({
                    lat: point.lat,
                    lon: point.lon,
                    ndvi: ndvi,
                    elevation: elevation
                });
            } catch (error) {
                console.warn(`⚠️ Error obteniendo datos para punto (${point.lat}, ${point.lon}):`, error);
                results.push({
                    lat: point.lat,
                    lon: point.lon,
                    ndvi: 0.3,
                    elevation: 0
                });
            }
        }
        
        return results;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.TerrainGenerator3D = TerrainGenerator3D;
    console.log('✅ TerrainGenerator3D registrado globalmente');
}