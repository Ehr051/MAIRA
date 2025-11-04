/**
 * 🎮 TerrainController3D.js
 * ===========================
 * Controlador principal del sistema 3D de terreno.
 * Coordina todos los módulos y gestiona el estado global.
 * 
 * Inspirado en arquitectura Google Maps/Earth:
 * - Estado centralizado
 * - Coordinación modular
 * - Event-driven communication
 */

class TerrainController3D {
    constructor() {
        // 🗺️ Estado del map
        this.map = null;
        this.capturedBounds = null;
        this.capturedZoom = null;
        
        // 🎬 Estado de Three.js (gestionado por TerrainRenderer3D)
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // 🌍 Servicios de terreno
        this.terrainGenerator = null;
        this.satelliteAnalyzer = null; // Objeto simple {canvas, features, getTexture}
        this.currentTerrain = null;
        
        // 🎖️ Gestión de unidades (delegado a UnitManager3D)
        this.unitManager = null;
        
        // 📹 Controles de cámara (delegado a CameraController3D)
        this.cameraController = null;
        
        // 🎨 Renderer (delegado a TerrainRenderer3D)
        this.terrainRenderer = null;
        
        // 🌳 Vegetación
        this.currentVegetationType = null;
        
        // 🖥️ UI State
        this.isFullscreen3D = false;
        
        // 🎯 Modo de orden actual ('move', 'attack', etc.)
        this.currentOrderMode = null;
        
        // 🗺️ Sistema de waypoints
        this.isCreatingWaypoints = false;
        
        // 🏁 Flag de inicialización
        this.initialized = false;
    }
    
    /**
     * 🚀 Inicializar el sistema completo
     */
    async init() {
        if (this.initialized) {
            console.warn('⚠️ TerrainController3D ya inicializado');
            return;
        }
        
        try {
            // 1️⃣ Inicializar map Leaflet
            this.initMap();
            
            // 2️⃣ Inicializar renderer Three.js (crea scene, camera, renderer)
            this.terrainRenderer = new TerrainRenderer3D(this);
            await this.terrainRenderer.init();
            
            // 3️⃣ Inicializar controlador de cámara
            this.cameraController = new CameraController3D(this);
            this.cameraController.init();
            
            // 4️⃣ Inicializar gestor de unidades
            this.unitManager = new UnitManager3D(this);
            this.unitManager.init();
            
            // 5️⃣ Inicializar servicios de elevación y vegetación (TIF)
            await this.initializeServices();
            
            // 6️⃣ terrainGenerator se inicializa on-demand en generateTerrain()
            // (como test-terrain-from-map-OPTIMIZADO.html)
            
            // 7️⃣ Detectar ambiente y configurar TIF
            this.detectEnvironmentAndConfigureTIF();
            
            // 8️⃣ Iniciar loop de renderizado
            this.terrainRenderer.startAnimationLoop();
            
            this.initialized = true;
            log('✅ TerrainController3D inicializado completamente', 'success');
            
        } catch (error) {
            console.error('❌ Error inicializando TerrainController3D:', error);
            log(`❌ Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * 🌍 Inicializar servicios de elevación y vegetación
     */
    async initializeServices() {
        log('🌍 Inicializando servicios de elevación y vegetación...', 'info');
        
        const useTIF = true; // Usar TIF por defecto
        
        // Inicializar ElevationService
        if (window.ElevationService) {
            try {
                log('🗻 Inicializando ElevationService...', 'info');
                window.elevationService = new ElevationService();
                await window.elevationService.initialize(useTIF);
                log('✅ ElevationService inicializado con TIF', 'success');
            } catch (err) {
                console.warn('⚠️ Error inicializando ElevationService:', err);
                log(`⚠️ ElevationService falló: ${err.message}`, 'warning');
            }
        } else {
            console.warn('⚠️ ElevationService no disponible');
        }
        
        // Inicializar VegetationService
        if (window.VegetationService) {
            try {
                log('🌳 Inicializando VegetationService...', 'info');
                window.vegetationService = new VegetationService();
                await window.vegetationService.initialize(useTIF, this.satelliteAnalyzer);
                log('✅ VegetationService inicializado', 'success');
            } catch (err) {
                console.warn('⚠️ Error inicializando VegetationService:', err);
                log(`⚠️ VegetationService falló: ${err.message}`, 'warning');
            }
        } else {
            console.warn('⚠️ VegetationService no disponible');
        }
        
        // 🚀 PRECARGAR MODELOS DE VEGETACIÓN (CRÍTICO para performance)
        if (this.terrainGenerator && this.terrainGenerator.modelLoader) {
            try {
                log('📦 Precargando modelos de vegetación...', 'info');
                await this.terrainGenerator.modelLoader.preloadVegetation();
                log('✅ Modelos precargados y listos para clonar', 'success');
            } catch (err) {
                console.warn('⚠️ Error precargando modelos:', err);
                log(`⚠️ Precarga falló: ${err.message}`, 'warning');
            }
        }
    }
    
    /**
     * 🗺️ Inicializar map Leaflet
     */
    initMap() {
        log('🗺️ Inicializando map...', 'info');
        
        // ✅ REUTILIZAR map existente si ya está inicializado (planeamiento_integrado.html)
        if (window.map && typeof window.map.getCenter === 'function') {
            log('♻️ Reutilizando map Leaflet existente', 'info');
            this.map = window.map;
            
            // Verificar si ya tiene capa satelital, si no agregarla
            let hasSatelliteLayer = false;
            this.map.eachLayer((layer) => {
                if (layer._url && layer._url.includes('World_Imagery')) {
                    hasSatelliteLayer = true;
                }
            });
            
            if (!hasSatelliteLayer) {
                log('🛰️ Agregando capa satelital al map existente', 'info');
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '© Esri',
                    maxZoom: 19,
                    crossOrigin: true
                }).addTo(this.map);
            }
            
            log('✅ map satelital inicializado', 'success');
            return;
        }
        
        // Si no existe, crear nuevo map
        log('🆕 Creando nuevo map Leaflet', 'info');
        this.map = L.map('map').setView([-34.6, -58.4], 12);
        
        // 🛰️ TILES SATELITALES (ESRI World Imagery - permite CORS)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19,
            crossOrigin: true  // ✅ CRÍTICO: Habilita CORS para captura
        }).addTo(this.map);
        
        // Capa de labels (opcional, comentada por ahora)
        // L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        //     attribution: '© Esri',
        //     maxZoom: 19
        // }).addTo(this.map);
        
        // Actualizar displays cuando el map se mueve
        this.map.on('moveend', () => this.updateDisplays());
        this.map.on('zoomend', () => this.updateDisplays());
        
        this.updateDisplays();
        log('✅ map satelital inicializado', 'success');
    }
    
    /**
     * 📊 Actualizar displays de coordenadas y zoom
     */
    updateDisplays() {
        if (!this.map) return;
        
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        const bounds = this.map.getBounds();
        
        // Verificar que los elementos existan antes de actualizar
        const coordsEl = document.getElementById('coords');
        const zoomEl = document.getElementById('zoom');
        const boundsEl = document.getElementById('bounds');
        
        if (coordsEl) {
            coordsEl.textContent = `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;
        }
        if (zoomEl) {
            zoomEl.textContent = zoom;
        }
        if (boundsEl) {
            boundsEl.textContent = `N:${bounds.getNorth().toFixed(4)} S:${bounds.getSouth().toFixed(4)} E:${bounds.getEast().toFixed(4)} W:${bounds.getWest().toFixed(4)}`;
        }
    }
    
    /**
     * 📸 Capturar vista actual del map (compatible con test-terrain-from-map-OPTIMIZADO.html)
     */
    async captureMap() {
        return new Promise((resolve, reject) => {
            log('📸 Capturando map...', 'info');
            showLoadingModal('Capturando vista del map...', 10);
            
            try {
                // Guardar bounds y zoom
                this.capturedBounds = this.map.getBounds();
                this.capturedZoom = this.map.getZoom();
                
                updateProgressBar('Capturando tiles satelitales...', 30);
                
                // ✅ USAR LEAFLET-IMAGE (como test-terrain-from-map-OPTIMIZADO.html)
                if (typeof leafletImage === 'undefined') {
                    throw new Error('leaflet-image no disponible');
                }
                
                leafletImage(this.map, (err, canvas) => {
                    if (err) {
                        hideLoadingModal();
                        log(`❌ Error con leaflet-image: ${err.message}`, 'error');
                        reject(err);
                        return;
                    }
                    
                    const imageData = canvas.toDataURL('image/png');
                    
                    // 🖼️ CREAR elemento #map-preview para que generateTerrainBatch() pueda cargar la textura
                    let previewImg = document.getElementById('map-preview');
                    if (!previewImg) {
                        previewImg = document.createElement('img');
                        previewImg.id = 'map-preview';
                        previewImg.style.display = 'none'; // Ocultar elemento (solo para THREE.js)
                        document.body.appendChild(previewImg);
                    }
                    previewImg.src = imageData;
                    console.log('🖼️ Elemento #map-preview creado con imagen satelital');
                    
                    // ✅ Inicializar SatelliteImageAnalyzer (como test-terrain-from-map-OPTIMIZADO.html)
                    if (!this.satelliteAnalyzer) {
                        this.satelliteAnalyzer = new SatelliteImageAnalyzer({
                            samplingRate: parseInt(document.getElementById('lod')?.value || 8)
                        });
                    }
                    
                    updateProgressBar('Procesando imagen...', 70);
                    
                    // ✅ Cargar imagen en el analyzer
                    this.satelliteAnalyzer.loadImage(imageData).then(() => {
                        hideLoadingModal();
                        log('✅ map capturado correctamente', 'success');
                        log(`📍 Dimensiones: ${canvas.width}x${canvas.height}`, 'info');
                        log(`📍 Zoom: ${this.capturedZoom}, Bounds: ${this.capturedBounds.getNorth().toFixed(4)}, ${this.capturedBounds.getWest().toFixed(4)}`, 'info');
                        
                        resolve();
                    }).catch((loadErr) => {
                        hideLoadingModal();
                        log(`❌ Error cargando imagen: ${loadErr.message}`, 'error');
                        reject(loadErr);
                    });
                });
                
            } catch (error) {
                hideLoadingModal();
                log(`❌ Error capturando map: ${error.message}`, 'error');
                reject(error);
            }
        });
    }
    
    /**
     * 🖼️ Mostrar imagen capturada en modal
     */
    showCapturedImage() {
        const modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
        `;
        
        const img = document.createElement('img');
        img.src = document.getElementById('map-preview').src;
        img.style.cssText = 'max-width: 100%; height: auto;';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖ Cerrar (ESC)';
        closeBtn.className = 'secondary';
        closeBtn.style.cssText = 'margin-top: 10px; width: 100%;';
        closeBtn.onclick = () => modal.remove();
        
        content.appendChild(img);
        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
    
    /**
     * 🧩 Capturar tiles individuales (método alternativo)
     */
    async captureTiles() {
        try {
            showLoadingModal('Capturando tiles individuales...', 10);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.capturedBounds = this.map.getBounds();
            this.capturedZoom = this.map.getZoom();
            
            const tiles = document.getElementById('map').querySelectorAll('.leaflet-tile-loaded');
            const tilesArray = Array.from(tiles).map(tile => tile.src);
            
            updateProgressBar('Procesando tiles...', 50);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            hideProgressBar();
            log(`✅ ${tilesArray.length} tiles capturados`, 'success');
            
        } catch (error) {
            hideProgressBar();
            log(`❌ Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * 🔍 Analizar imágenes satelitales (compatible con test-terrain-from-map-OPTIMIZADO.html)
     */
    async analyzeMap() {
        try {
            if (!this.satelliteAnalyzer || !this.satelliteAnalyzer.imageData) {
                throw new Error('Primero captura el map');
            }
            
            log('🔍 Analizando imagen...', 'info');
            showLoadingModal('Analizando imagen satelital...', 20);
            
            // ✅ Usar método analyzeImageSync del SatelliteImageAnalyzer
            let samplingRate = parseInt(document.getElementById('lod')?.value || 8);
            
            if (samplingRate < 5) {
                log(`⚠️ samplingRate ${samplingRate} muy bajo, ajustando a 5`, 'warning');
                samplingRate = 5;
            }
            
            this.satelliteAnalyzer.analyzeImageSync({ samplingRate });
            
            const features = this.satelliteAnalyzer.getFeatures();
            
            hideLoadingModal();
            log('✅ Análisis completado', 'success');
            log(`📊 ${features.length} features detectadas`, 'info');
            
            return features;
            
        } catch (error) {
            hideLoadingModal();
            log(`❌ Error en análisis: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * 🚀 BATCH API: Obtener múltiples elevaciones en 1 request
     */
    async getBatchElevations(coordinates, bounds) {
        try {
            const serverUrl = 'http://127.0.0.1:5000';
            log(`📡 Solicitando ${coordinates.length} elevaciones al servidor...`, 'info');
            
            const response = await fetch(`${serverUrl}/api/elevation/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coordinates: coordinates,
                    options: {
                        cacheKey: `terrain_${Date.now()}`,
                        bounds: bounds
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            log(`✅ Recibidas ${data.elevations.length} elevaciones en ${data.metadata.processTime}`, 'success');
            log(`📦 Tiles usados: ${data.metadata.tilesUsed.join(', ')}`, 'info');
            
            return data.elevations;
            
        } catch (error) {
            log(`❌ Error obteniendo elevaciones batch: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * 🌍🚀 Generar terreno 3D usando BATCH API (OPTIMIZADO)
     * Este método reemplaza el flujo lento de requests individuales
     */
    async generateTerrainBatch(autoActivateFullscreen = true) {
        try {
            console.log('🏁 [BATCH] Iniciando generateTerrainBatch()');
            
            if (!this.capturedBounds) {
                throw new Error('Primero captura el map');
            }
            
            if (!this.satelliteAnalyzer || !this.satelliteAnalyzer.imageData) {
                throw new Error('Primero analiza el map');
            }
            
            console.log('📊 [BATCH] Bounds:', this.capturedBounds);
            
            showLoadingModal('🚀 Generando terreno 3D (modo optimizado)...', 0);
            
            // Activar canvas 3D
            console.log('🎨 [BATCH] Activando canvas container...');
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.classList.add('active');
                console.log('✅ [BATCH] Canvas activado');
            }
            
            // 🚫 BLOQUEAR clicks del map (el 3D está encima)
            if (this.map && this.map.getContainer()) {
                this.map.getContainer().style.pointerEvents = 'none';
                console.log('🚫 [BATCH] Clicks del map bloqueados');
            }
            
            // Auto-activar fullscreen
            if (autoActivateFullscreen && !this.isFullscreen3D) {
                console.log('🖥️ [BATCH] Activando fullscreen...');
                this.toggleFullscreen3D();
            }
            
            updateProgressBar('📐 Calculando grid de coordenadas...', 10);
            console.log('📐 [BATCH] Calculando grid de coordenadas...');
            console.time('⏱️ [BATCH] Generación grid');
            
            // 🔥 EXTRAER bounds de Leaflet LatLngBounds (usar en todo el método)
            const bounds = this.capturedBounds._southWest ? {
                north: this.capturedBounds._northEast.lat,
                south: this.capturedBounds._southWest.lat,
                east: this.capturedBounds._northEast.lng,
                west: this.capturedBounds._southWest.lng
            } : this.capturedBounds;
            
            console.log('📊 [BATCH] Bounds extraídos:', bounds);
            
            // 🔥 PASO 1: Generar grid de coordenadas (ASÍNCRONO para no bloquear UI)
            const resolution = 32; // 32x32 = 1,089 puntos (reducido para performance)
            const coordinates = [];
            
            const latStep = (bounds.north - bounds.south) / resolution;
            const lonStep = (bounds.east - bounds.west) / resolution;
            
            log(`📐 Generando grid ${resolution}x${resolution}...`, 'info');
            
            // Generar en chunks para no bloquear el navegador
            const chunkSize = 10; // Procesar 10 filas a la vez
            for (let i = 0; i <= resolution; i += chunkSize) {
                const maxI = Math.min(i + chunkSize, resolution + 1);
                
                for (let ii = i; ii < maxI; ii++) {
                    for (let j = 0; j <= resolution; j++) {
                        const lat = bounds.south + (ii * latStep);
                        const lon = bounds.west + (j * lonStep);
                        coordinates.push({ lat, lon });
                    }
                }
                
                // Yield al event loop cada chunk
                await new Promise(resolve => setTimeout(resolve, 0));
                
                // Update progress (usar 'i' que está en scope, no 'ii')
                const progress = 10 + (i / resolution) * 10;
                updateProgressBar(`📐 Grid: ${i}/${resolution} filas...`, progress);
            }
            
            log(`📍 Grid generado: ${coordinates.length} coordenadas (${resolution}x${resolution})`, 'info');
            console.timeEnd('⏱️ [BATCH] Generación grid');
            console.log(`✅ [BATCH] Grid generado: ${coordinates.length} coordenadas`);
            
            updateProgressBar('📡 Solicitando elevaciones al servidor...', 20);
            console.log('📡 [BATCH] Iniciando request batch al servidor...');
            console.time('⏱️ [BATCH] Request API');
            
            // 🔥 PASO 2: Solicitar TODAS las elevaciones en 1 request
            const elevations = await this.getBatchElevations(coordinates, bounds);
            console.timeEnd('⏱️ [BATCH] Request API');
            console.log(`✅ [BATCH] Recibidas ${elevations.length} elevaciones`);
            
            updateProgressBar('🏗️ Construyendo geometría 3D...', 60);
            console.log('🏗️ [BATCH] Construyendo geometría THREE.js...');
            console.time('⏱️ [BATCH] Construcción geometría');
            
            // 🔥 PASO 3: Construir geometría THREE.js
            // 🐛 DEBUG: Verificar bounds (ya extraídos arriba)
            console.log('🐛 [DEBUG] bounds en geometría:', bounds);
            
            const latDiff = bounds.north - bounds.south;
            const lonDiff = bounds.east - bounds.west;
            
            console.log('🐛 [DEBUG] latDiff:', latDiff, 'lonDiff:', lonDiff);
            
            const centerLat = (bounds.north + bounds.south) / 2;
            
            const metersPerDegreeLat = 111320;
            const metersPerDegreeLon = 111320 * Math.cos(centerLat * Math.PI / 180);
            
            const widthMeters = lonDiff * metersPerDegreeLon;
            const heightMeters = latDiff * metersPerDegreeLat;
            
            console.log('🐛 [DEBUG] widthMeters:', widthMeters, 'heightMeters:', heightMeters);
            
            const geometry = new THREE.PlaneGeometry(
                widthMeters, heightMeters,
                resolution, resolution
            );
            
            const vertices = geometry.attributes.position.array;
            
            // Aplicar elevaciones a vértices (en chunks para no bloquear)
            let minElevation = Infinity;
            let maxElevation = -Infinity;
            
            log(`🎨 Aplicando ${elevations.length} elevaciones a geometría...`, 'info');
            
            const vertexChunkSize = 500; // Procesar 500 vértices a la vez
            for (let i = 0; i < elevations.length; i += vertexChunkSize) {
                const maxI = Math.min(i + vertexChunkSize, elevations.length);
                
                for (let ii = i; ii < maxI; ii++) {
                    const elevation = elevations[ii].elevation || 0;
                    
                    // Z es la altura en THREE.js
                    // 🔥 ESCALA VERTICAL AUMENTADA: 5x en lugar de 2x para terrenos con relieve real
                    vertices[ii * 3 + 2] = elevation * 5; // vertical scale
                    
                    minElevation = Math.min(minElevation, elevation);
                    maxElevation = Math.max(maxElevation, elevation);
                }
                
                // Yield al event loop
                await new Promise(resolve => setTimeout(resolve, 0));
                
                // Update progress (usar 'i' que está en scope, no 'ii')
                const progress = 60 + (i / elevations.length) * 15;
                updateProgressBar(`🏗️ Geometría: ${i}/${elevations.length} vértices...`, progress);
            }
            
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
            console.timeEnd('⏱️ [BATCH] Construcción geometría');
            console.log(`✅ [BATCH] Geometría construida con ${elevations.length} vértices`);
            
            log(`📊 Rango elevación: ${minElevation.toFixed(1)}m - ${maxElevation.toFixed(1)}m`, 'info');
            
            updateProgressBar('🎨 Aplicando textura satelital...', 80);
            console.log('🎨 [BATCH] Cargando textura...');
            console.time('⏱️ [BATCH] Carga textura');
            
            // Crear textura desde imagen capturada
            const img = document.getElementById('map-preview');
            let texture = null;
            
            if (img && img.src) {
                texture = new THREE.TextureLoader().load(img.src);
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
            }
            
            // Crear material
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                side: THREE.DoubleSide,
                roughness: 0.8,
                metalness: 0.2
            });
            
            // Crear mesh
            const terrainMesh = new THREE.Mesh(geometry, material);
            terrainMesh.rotation.x = -Math.PI / 2; // Rotar para que sea horizontal
            terrainMesh.name = 'terrain_batch';
            console.timeEnd('⏱️ [BATCH] Carga textura');
            console.log('✅ [BATCH] Material y mesh creados');
            
            // Agregar a escena
            console.log('🎬 [BATCH] Agregando mesh a escena...');
            this.scene.add(terrainMesh);
            this.currentTerrain = { terrain: terrainMesh };
            console.log('✅ [BATCH] Mesh agregado a escena');
            
            // Ajustar cámara
            this.camera.position.set(0, maxElevation * 4, widthMeters / 2);
            this.camera.lookAt(0, 0, 0);
            
            if (this.controls) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
            
            updateProgressBar('✅ ¡Terreno generado!', 100);
            
            // 🎯 MOSTRAR botón de cierre
            const closeButton = document.getElementById('close-3d-button');
            if (closeButton) {
                closeButton.style.display = 'block';
                closeButton.onclick = () => this.closeTerrain3D();
                console.log('✅ [BATCH] Botón de cierre mostrado');
            }
            
            setTimeout(() => {
                hideLoadingModal();
                log('✅ Terreno 3D generado exitosamente (batch API)', 'success');
                log(`📏 Dimensiones: ${widthMeters.toFixed(0)}m x ${heightMeters.toFixed(0)}m`, 'info');
            }, 500);
            
        } catch (error) {
            hideLoadingModal();
            log(`❌ Error generando terreno batch: ${error.message}`, 'error');
            console.error(error);
            throw error;
        }
    }
    
    /**
     * 🌍 Generar terreno 3D (compatible con test-terrain-from-map-OPTIMIZADO.html)
     */
    async generateTerrain(autoActivateFullscreen = true) {
        try {
            if (!this.capturedBounds) {
                throw new Error('Primero captura el map con "📸 Capturar map"');
            }
            
            showLoadingModal('Generando terreno 3D...', 0);
            
            // 🔥 Inicializar terrainGenerator si no existe (como test-terrain-from-map-OPTIMIZADO.html)
            if (!this.terrainGenerator) {
                const config = {
                    resolution: 128,
                    verticalScale: 2.0,  // 🗻 Escala 2.0x para visualizar mejor relieve (rango pequeño ~4m)
                    textureQuality: 'high',
                    vegetationDensity: 0.5  // 🌳 Densidad moderada (0.5 = 50%)
                };
                
                this.terrainGenerator = new TerrainGenerator3D(config);
                
                showLoadingModal('Inicializando servicios...', 10);
                
                // 🔥 CRÍTICO: Pasar la escena THREE.js real
                const maira3DSystem = { 
                    scene: this.scene,
                    camera: this.camera,
                    renderer: this.renderer,
                    controls: this.controls
                };
                
                // Inicializar con servicios globales
                this.terrainGenerator.initialize(
                    window.elevationService || null,
                    window.vegetationService || null,
                    maira3DSystem,
                    this.satelliteAnalyzer
                );
                
                log('✅ TerrainGenerator3D inicializado', 'success');
            }
            
            showLoadingModal('Generando terreno 3D...', 40);
            
            // Activar canvas 3D
            const canvasContainer = document.getElementById('canvas-container');
            if (canvasContainer) {
                canvasContainer.classList.add('active');
                console.log('✅ canvas-container activado');
                console.log('   z-index:', window.getComputedStyle(canvasContainer).zIndex);
                console.log('   display:', window.getComputedStyle(canvasContainer).display);
                console.log('   visibility:', window.getComputedStyle(canvasContainer).visibility);
            } else {
                console.error('❌ canvas-container NO encontrado!');
            }
            
            // Verificar si hay contenedores conflictivos
            const vista3dContainer = document.getElementById('vista3d-container');
            const canvas3d = document.getElementById('canvas3d');
            if (vista3dContainer || canvas3d) {
                console.warn('⚠️ CONTENEDORES CONFLICTIVOS DETECTADOS:');
                if (vista3dContainer) console.warn('   - vista3d-container existe');
                if (canvas3d) console.warn('   - canvas3d existe');
                console.warn('   Estos pueden estar bloqueando la vista del terreno real');
            }
            
            // Auto-activar fullscreen
            if (autoActivateFullscreen && !this.isFullscreen3D) {
                this.toggleFullscreen3D();
            }
            
            updateProgressBar('Calculando dimensiones...', 5);
            
            // Calcular centro y dimensiones
            const centerLat = (this.capturedBounds.north + this.capturedBounds.south) / 2;
            const centerLon = (this.capturedBounds.east + this.capturedBounds.west) / 2;
            
            const latDiff = this.capturedBounds.north - this.capturedBounds.south;
            const lonDiff = this.capturedBounds.east - this.capturedBounds.west;
            
            const metersPerDegreeLat = 111320;
            const metersPerDegreeLon = 111320 * Math.cos(centerLat * Math.PI / 180);
            
            const widthMeters = lonDiff * metersPerDegreeLon;
            const heightMeters = latDiff * metersPerDegreeLat;
            
            // Parámetros de generación
            const terrainParams = {
                center: { lat: centerLat, lon: centerLon },
                bounds: this.capturedBounds,
                width: widthMeters,
                height: heightMeters,
                resolution: Math.min(128, Math.floor(Math.max(widthMeters, heightMeters) / 50))
            };
            
            updateProgressBar('Generando geometría del terreno...', 10);
            
            // Generar terreno (compatible con test-terrain-from-map-OPTIMIZADO.html)
            const result = await this.terrainGenerator.generateTerrain(this.capturedBounds, {
                includeVegetation: true,
                includeRoads: true,
                includeBuildings: true,
                includeWater: true,
                mapZoom: this.capturedZoom
            });
            
            // ✅ Validar que terrain se generó correctamente
            if (!result || !result.terrain) {
                console.error('❌ ERROR CRÍTICO: Terreno no generado', result);
                throw new Error('Terreno no se pudo generar correctamente (terrain es null)');
            }
            
            if (!this.scene) {
                console.error('❌ ERROR CRÍTICO: Scene no inicializado');
                throw new Error('Scene de THREE.js no está inicializado');
            }
            
            console.log('✅ Validación OK - terrain:', result.terrain, 'scene:', this.scene);
            
            // ✅ Agregar terreno a la escena
            this.scene.add(result.terrain);
            log('✅ Terreno agregado a la escena', 'success');
            
            // ✅ Agregar vegetación (ahora son meshes directos, no wrappers)
            if (result.vegetation && result.vegetation.length > 0) {
                result.vegetation.forEach(vegMesh => {
                    if (vegMesh && vegMesh.isObject3D) {
                        this.scene.add(vegMesh);
                    }
                });
                log(`🌳 ${result.vegetation.length} modelos de vegetación agregados`, 'success');
            }
            
            // ✅ Agregar caminos
            if (result.roads && result.roads.length > 0) {
                result.roads.forEach(road => this.scene.add(road));
                log(`🛣️ ${result.roads.length} segmentos de caminos agregados`, 'success');
            }
            
            // ✅ Agregar edificios
            if (result.buildings && result.buildings.length > 0) {
                result.buildings.forEach(building => this.scene.add(building));
                log(`🏢 ${result.buildings.length} edificios agregados`, 'success');
            }
            
            // ✅ Agregar agua
            if (result.water && result.water.length > 0) {
                result.water.forEach(w => this.scene.add(w));
                log(`💧 ${result.water.length} planos de agua agregados`, 'success');
            }
            
            this.currentTerrain = result;
            
            // 🔍 DEBUG: Verificar qué hay en la escena
            console.log('🔍 DEBUG ESCENA:');
            console.log('   Total objetos en escena:', this.scene.children.length);
            console.log('   Terreno:', result.terrain ? 'SÍ' : 'NO');
            console.log('   Vegetación:', result.vegetation ? result.vegetation.length : 0);
            console.log('   Caminos:', result.roads ? result.roads.length : 0);
            console.log('   Edificios:', result.buildings ? result.buildings.length : 0);
            console.log('   Agua:', result.water ? result.water.length : 0);
            
            // Listar objetos en la escena
            this.scene.children.forEach((obj, i) => {
                console.log(`   [${i}] ${obj.type} (name: "${obj.name || 'sin nombre'}")`);
            });
            
            // Posicionar cámara
            this.positionCameraForTerrain(result, this.capturedBounds);
            
            hideProgressBar();
            log('✅ Terreno 3D generado exitosamente', 'success');
            
        } catch (error) {
            hideProgressBar();
            log(`❌ Error generando terreno: ${error.message}`, 'error');
            console.error(error);
            throw error;
        }
    }
    
    /**
     * 📹 Posicionar cámara para vista óptima del terreno
     */
    positionCameraForTerrain(terrain, bounds) {
        if (!terrain || !terrain.terrain || !this.camera) {
            console.warn('⚠️ Terrain o cámara no disponible');
            return;
        }
        
        // Calcular dimensiones del terreno
        const box = new THREE.Box3().setFromObject(terrain.terrain);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Calcular altura de cámara basada en zoom
        const zoomLevel = this.capturedZoom || 12;
        const zoomFactor = Math.pow(2, 15 - zoomLevel);
        const cameraHeight = Math.max(size.x, size.z) * zoomFactor * 0.5;
        
        // Posicionar cámara con ángulo top-down
        this.camera.position.set(
            center.x,
            cameraHeight,
            center.z + cameraHeight * 0.4
        );
        
        this.camera.lookAt(center);
        
        // Actualizar controles
        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
        
        log(`📹 Cámara posicionada: altura=${cameraHeight.toFixed(0)}m`, 'info');
    }
    
    /**
     * 🖥️ Toggle pantalla completa 3D
     */
    toggleFullscreen3D() {
        const mainContainer = document.getElementById('main-container');
        const button = document.getElementById('toggle-fullscreen-3d');
        const closeButton = document.getElementById('close-3d-button');
        
        // ⚠️ Verificar que los elementos existan (defensivo)
        if (!mainContainer) {
            console.warn('⚠️ [FULLSCREEN] #main-container no encontrado - saltando fullscreen');
            return;
        }
        
        this.isFullscreen3D = !this.isFullscreen3D;
        
        if (this.isFullscreen3D) {
            mainContainer.classList.add('fullscreen-3d');
            if (button) {
                button.textContent = '↩️ Salir Pantalla Completa';
                button.style.background = 'rgba(255, 100, 100, 0.9)';
            }
            // ✅ Mostrar botón de cerrar cuando activa fullscreen
            if (closeButton) {
                closeButton.style.display = 'block';
                closeButton.onclick = () => this.closeTerrain3D();
                console.log('✅ [FULLSCREEN] Botón Cerrar Vista 3D mostrado');
            }
            log('🖥️ Modo pantalla completa activado', 'success');
        } else {
            mainContainer.classList.remove('fullscreen-3d');
            if (button) {
                button.textContent = '🖥️ Pantalla Completa';
                button.style.background = 'rgba(79, 209, 197, 0.9)';
            }
            // ✅ Ocultar botón cuando desactiva fullscreen
            if (closeButton) {
                closeButton.style.display = 'none';
            }
            log('↩️ Modo pantalla completa desactivado', 'info');
        }
        
        // Forzar resize del renderer
        setTimeout(() => {
            if (this.renderer && this.camera && this.terrainRenderer) {
                this.terrainRenderer.handleResize();
            }
        }, 100);
    }
    
    /**
     * ❌ Cerrar vista 3D y restaurar map
     */
    closeTerrain3D() {
        console.log('❌ [CLOSE] Cerrando vista 3D...');
        
        // Desactivar canvas 3D
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.classList.remove('active');
            console.log('✅ [CLOSE] Canvas desactivado');
        }
        
        // Desactivar fullscreen si está activo
        const mainContainer = document.getElementById('main-container');
        if (mainContainer && this.isFullscreen3D) {
            mainContainer.classList.remove('fullscreen-3d');
            this.isFullscreen3D = false;
            console.log('✅ [CLOSE] Fullscreen desactivado');
        }
        
        // Ocultar botón de cierre
        const closeButton = document.getElementById('close-3d-button');
        if (closeButton) {
            closeButton.style.display = 'none';
            console.log('✅ [CLOSE] Botón de cierre ocultado');
        }
        
        // Restaurar clicks del map
        if (this.map && this.map.getContainer()) {
            this.map.getContainer().style.pointerEvents = 'auto';
            console.log('✅ [CLOSE] Clicks del map restaurados');
        }
        
        // Limpiar terreno de la escena
        if (this.currentTerrain && this.currentTerrain.terrain) {
            this.scene.remove(this.currentTerrain.terrain);
            this.currentTerrain = null;
            console.log('✅ [CLOSE] Terreno removido de escena');
        }
        
        log('✅ Vista 3D cerrada', 'success');
    }
    
    /**
     * 🔧 Detectar ambiente y configurar TIF
     */
    detectEnvironmentAndConfigureTIF() {
        const isProduction = window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        
        if (isProduction) {
            console.log('🌐 Ambiente: PRODUCCIÓN (Render)');
            log('🌐 Modo producción - usando datos remotos', 'info');
        } else {
            console.log('💻 Ambiente: DESARROLLO (localhost)');
            log('💻 Modo desarrollo - usando datos locales', 'info');
        }
    }
}

// 🌐 Exponer globalmente para compatibilidad con HTML
window.TerrainController3D = TerrainController3D;
