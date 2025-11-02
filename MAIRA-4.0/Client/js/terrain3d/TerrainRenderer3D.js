/**
 * 🎨 TerrainRenderer3D.js
 * ===========================
 * Gestión del renderizado Three.js y loop de animación.
 * 
 * Responsabilidades:
 * - Inicialización de scene, camera, renderer
 * - Loop de animación
 * - Frustum culling
 * - Gestión de ventana (resize)
 * - Iluminación de escena
 */

class TerrainRenderer3D {
    constructor(controller) {
        this.controller = controller;
        
        // Estado de rendering
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Performance
        this.lastTime = performance.now();
        this.frustum = null;
        this.frustumMatrix = null;
        this.frameCount = 0;
        
        // Container
        this.container = null;
    }
    
    /**
     * 🚀 Inicializar sistema de renderizado
     */
    async init() {
        try {
            // 1️⃣ Crear/obtener container
            this.container = document.getElementById('canvas-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'canvas-container';
                this.container.className = 'active';
                document.getElementById('main-container').appendChild(this.container);
                log('🎨 Canvas container creado dinámicamente', 'info');
            } else {
                // ✅ Si el container ya existe, activarlo y habilitar eventos
                this.container.classList.add('active');
                this.container.style.pointerEvents = 'auto';
                this.container.style.zIndex = '1000';
                log('🎨 Canvas container existente activado', 'info');
            }
            
            // 2️⃣ Crear escena
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB);
            
            // 3️⃣ Crear cámara
            this.camera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                0.1,
                50000
            );
            this.camera.position.set(0, 1000, 400);
            this.camera.lookAt(0, 0, 0);
            
            // 4️⃣ Crear renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            
            // Configuración de color (THREE.js r150+)
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            
            this.container.appendChild(this.renderer.domElement);
            
            // 5️⃣ Configurar iluminación
            this.setupLighting();
            
            // 6️⃣ Crear controles orbital
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2;
            
            // 7️⃣ Configurar resize handler
            window.addEventListener('resize', () => this.handleResize());
            
            // 8️⃣ Exponer a controller
            this.controller.scene = this.scene;
            this.controller.camera = this.camera;
            this.controller.renderer = this.renderer;
            this.controller.controls = this.controls;
            
            log('✅ TerrainRenderer3D inicializado', 'success');
            
        } catch (error) {
            console.error('❌ Error inicializando TerrainRenderer3D:', error);
            throw error;
        }
    }
    
    /**
     * 💡 Configurar iluminación de escena
     */
    setupLighting() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        this.scene.add(ambientLight);
        
        // Luz hemisférica (cielo + suelo)
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.6);
        hemisphereLight.position.set(0, 500, 0);
        this.scene.add(hemisphereLight);
        
        // Luz direccional (sol)
        const sunLight = new THREE.DirectionalLight(0xffffee, 2.5);
        sunLight.position.set(1000, 1000, 500);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
    }
    
    /**
     * 🔄 Iniciar loop de animación
     */
    startAnimationLoop() {
        this.animate();
    }
    
    /**
     * 🎬 Loop principal de animación
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const delta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Actualizar controles de cámara
        if (this.controller.cameraController) {
            this.controller.cameraController.update();
        }
        
        // Actualizar movimiento de unidades
        if (this.controller.unitManager) {
            this.controller.unitManager.updateMovement(delta);
        }
        
        // Frustum culling
        this.performFrustumCulling();
        
        // Renderizar escena
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * 🚀 Frustum culling para optimizar renderizado
     */
    performFrustumCulling() {
        if (!this.scene || !this.camera) return;
        
        // Inicializar frustum la primera vez
        if (!this.frustum) {
            this.frustum = new THREE.Frustum();
            this.frustumMatrix = new THREE.Matrix4();
        }
        
        // Actualizar matrices
        this.camera.updateMatrixWorld(true);
        this.scene.updateMatrixWorld(true);
        
        this.frustumMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.frustumMatrix);
        
        // Recorrer escena y ocultar objetos fuera del frustum
        let visibleCount = 0;
        let hiddenCount = 0;
        
        this.scene.traverse((object) => {
            if (object.isMesh && object.geometry) {
                // Calcular bounding box
                if (!object.geometry.boundingBox) {
                    object.geometry.computeBoundingBox();
                }
                
                const boundingBox = object.geometry.boundingBox.clone();
                boundingBox.applyMatrix4(object.matrixWorld);
                
                // Verificar si está en frustum
                if (this.frustum.intersectsBox(boundingBox)) {
                    object.visible = true;
                    visibleCount++;
                } else {
                    object.visible = false;
                    hiddenCount++;
                }
            }
        });
        
        // Log cada 100 frames
        this.frameCount++;
        if (this.frameCount % 100 === 0) {
            console.log(`🎯 Frustum Culling: ${visibleCount} visible, ${hiddenCount} ocultos`);
        }
    }
    
    /**
     * 📐 Manejar resize de ventana
     */
    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        console.log(`📐 Resize: ${width}x${height}`);
    }
    
    /**
     * 🗑️ Limpiar recursos
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        
        window.removeEventListener('resize', () => this.handleResize());
    }
}

// 🌐 Exponer globalmente
window.TerrainRenderer3D = TerrainRenderer3D;
