class VegetationInstancer {
    constructor(scene, modelLoader) {
        this.scene = scene;
        this.modelLoader = modelLoader;

        // Cache de modelos por tipo: { meshes: [{geometry, material}], materials: [] }
        this.modelCache = new Map();

        // InstancedMesh por tipo y mesh: { 'tree_tall_mesh0': InstancedMesh }
        this.instancedMeshes = new Map();

        // Contadores de instancias
        this.instanceCounts = new Map();

        // 📏 SISTEMA LOD (Level of Detail)
        this.lodEnabled = true;
        this.lodDistances = {
            high: 100,    // 0-100m: detalle máximo
            medium: 300,  // 100-300m: detalle medio
            low: 600,     // 300-600m: detalle bajo
            hide: 1000    // >600m: ocultar
        };
        this.camera = null; // Se setea desde TerrainGenerator3D
        
        // 📍 Almacenar posiciones de instancias para LOD
        this.instancePositions = new Map(); // { meshKey: [positions] }
        this.instanceData = new Map(); // { meshKey: [{position, scale, rotation}] }

        console.log('VegetationInstancer OPTIMIZADO con LOD inicializado');
    }

    /**
     * Configurar cámara para sistema LOD
     */
    setCamera(camera) {
        this.camera = camera;
        console.log('📷 Cámara configurada para LOD');
    }

    /**
     * Configurar distancias LOD
     */
    setLODDistances(distances) {
        this.lodDistances = { ...this.lodDistances, ...distances };
        console.log('📏 Distancias LOD actualizadas:', this.lodDistances);
    }

    /**
     * Habilitar/deshabilitar LOD
     */
    setLODEnabled(enabled) {
        this.lodEnabled = enabled;
        console.log(`📏 LOD ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    /**
     * Cargar modelo base y preparar datos para InstancedMesh multiple
     */
    async loadModelBase(modelType) {
        // Si ya esta cargado, retornar del cache
        if (this.modelCache.has(modelType)) {
            return this.modelCache.get(modelType);
        }

        console.log(`Cargando modelo base optimizado: ${modelType}...`);

        try {
            const model = await this.modelLoader.loadModel(modelType);

            if (!model) {
                throw new Error(`Modelo ${modelType} no encontrado`);
            }

            // ESTRATEGIA OPTIMIZADA: Extraer TODOS los meshes con sus materiales
            const meshData = [];
            const allMaterials = [];

            model.traverse((child) => {
                if (child.isMesh) {
                    meshData.push({
                        geometry: child.geometry.clone(),
                        material: child.material.clone(),
                        name: child.name || `mesh_${meshData.length}`
                    });

                    // Recopilar materiales unicos
                    if (!allMaterials.includes(child.material)) {
                        allMaterials.push(child.material);
                    }
                }
            });

            if (meshData.length === 0) {
                throw new Error(`No se encontraron meshes en ${modelType}`);
            }

            console.log(`Modelo ${modelType} optimizado: ${meshData.length} meshes, ${allMaterials.length} materiales`);

            // Preparar datos para InstancedMesh multiple
            const modelData = {
                meshes: meshData,           // Array de {geometry, material, name}
                materials: allMaterials,    // Array de materiales unicos
                meshCount: meshData.length,
                materialCount: allMaterials.length
            };

            // Configurar materiales para mejor rendimiento
            allMaterials.forEach((material, index) => {
                material.needsUpdate = true;
                material.side = THREE.FrontSide;
                material.transparent = false;
                material.alphaTest = 0.1; // Para vegetacion con transparencias

                // Configurar texturas si existen
                if (material.map) {
                    material.map.needsUpdate = true;
                    material.map.colorSpace = THREE.SRGBColorSpace;
                }
            });

            this.modelCache.set(modelType, modelData);
            console.log(`Modelo ${modelType} preparado para InstancedMesh multiple`);
            return modelData;

        } catch (error) {
            console.error(`Error cargando modelo ${modelType}:`, error);
            return null;
        }
    }

    /**
     * Agregar multiples instancias usando InstancedMesh optimizado
     */
    async addInstances(instances) {
        console.log(`VegetationInstancer OPTIMIZADO llamado con ${instances.length} instancias`);

        if (!instances || instances.length === 0) {
            console.warn('No hay instancias para agregar');
            return [];
        }

        const startTime = performance.now();

        // Agrupar instancias por tipo
        const instancesByType = new Map();
        instances.forEach(inst => {
            if (!instancesByType.has(inst.type)) {
                instancesByType.set(inst.type, []);
            }
            instancesByType.get(inst.type).push(inst);
        });

        console.log(`Tipos de vegetacion:`, Array.from(instancesByType.entries()).map(([type, insts]) => `${type}=${insts.length}`).join(', '));

        const createdMeshes = [];

        // OPTIMIZACION: Crear InstancedMesh multiple para cada tipo
        for (const [modelType, typeInstances] of instancesByType.entries()) {
            console.log(`Procesando ${modelType} con ${typeInstances.length} instancias...`);

            try {
                // Cargar modelo base optimizado
                const modelData = await this.loadModelBase(modelType);
                if (!modelData) continue;

                // ESTRATEGIA: Un InstancedMesh por cada mesh del modelo
                // Esto preserva materiales multiples pero mantiene rendimiento de instancing
                for (let meshIndex = 0; meshIndex < modelData.meshes.length; meshIndex++) {
                    const meshInfo = modelData.meshes[meshIndex];
                    const meshKey = `${modelType}_mesh${meshIndex}`;

                    // Crear InstancedMesh para este mesh especifico
                    const instancedMesh = new THREE.InstancedMesh(
                        meshInfo.geometry,
                        meshInfo.material,
                        typeInstances.length
                    );

                    // Configurar propiedades del InstancedMesh
                    instancedMesh.name = meshKey;
                    instancedMesh.frustumCulled = true; // Importante para rendimiento
                    instancedMesh.castShadow = true;
                    instancedMesh.receiveShadow = true;

                    // OPTIMIZACION CRITICA: Configurar cada instancia
                    const matrix = new THREE.Matrix4();
                    const position = new THREE.Vector3();
                    const rotation = new THREE.Quaternion();
                    const scale = new THREE.Vector3();

                    // 📍 Almacenar datos de instancias para LOD
                    const instanceData = [];

                    typeInstances.forEach((inst, instanceIndex) => {
                        // Posicion
                        position.set(
                            inst.position.x || 0,
                            inst.position.y || 0,
                            inst.position.z || 0
                        );

                        // Rotacion (solo Y para arboles)
                        rotation.setFromAxisAngle(
                            new THREE.Vector3(0, 1, 0),
                            inst.rotation || 0
                        );

                        // Escala
                        const scaleValue = inst.scale || 1.0;
                        scale.set(scaleValue, scaleValue, scaleValue);

                        // Aplicar transformaciones
                        matrix.compose(position, rotation, scale);
                        instancedMesh.setMatrixAt(instanceIndex, matrix);

                        // 📍 Guardar datos para LOD
                        instanceData.push({
                            position: position.clone(),
                            scale: scaleValue,
                            rotation: inst.rotation || 0,
                            originalIndex: instanceIndex
                        });
                    });

                    // Actualizar el InstancedMesh
                    instancedMesh.instanceMatrix.needsUpdate = true;

                    // Agregar a escena
                    this.scene.add(instancedMesh);

                    // Guardar referencias para LOD
                    this.instancedMeshes.set(meshKey, instancedMesh);
                    this.instanceData.set(meshKey, instanceData);
                    createdMeshes.push(instancedMesh);

                    console.log(`InstancedMesh creado: ${meshKey} (${typeInstances.length} instancias)`);
                }                // Actualizar contador
                this.instanceCounts.set(modelType, (this.instanceCounts.get(modelType) || 0) + typeInstances.length);

            } catch (error) {
                console.error(`Error procesando ${modelType}:`, error);
            }
        }

        const endTime = performance.now();
        console.log(`VegetationInstancer completado en ${(endTime - startTime).toFixed(1)}ms`);
        console.log(`Total InstancedMesh creados: ${createdMeshes.length}`);

        return createdMeshes;
    }

    /**
     * Obtener estadisticas de rendimiento
     */
    getStats() {
        const stats = {
            totalInstancedMeshes: this.instancedMeshes.size,
            totalInstances: Array.from(this.instanceCounts.values()).reduce((a, b) => a + b, 0),
            instancesByType: Object.fromEntries(this.instanceCounts),
            cachedModels: this.modelCache.size
        };
        console.log('VegetationInstancer Stats:', stats);
        return stats;
    }

    /**
     * Limpiar todos los InstancedMesh
     */
    clear() {
        console.log('Limpiando VegetationInstancer...');

        for (const [key, mesh] of this.instancedMeshes) {
            this.scene.remove(mesh);
            mesh.dispose();
        }

        this.instancedMeshes.clear();
        this.instanceCounts.clear();
        this.modelCache.clear();
        this.instanceData.clear();

        console.log('VegetationInstancer limpiado');
    }

    /**
     * 📏 Actualizar Level of Detail basado en distancia a la cámara
     * Se debe llamar en cada frame desde el loop de animación
     */
    updateLOD() {
        if (!this.lodEnabled || !this.camera) {
            return;
        }

        const cameraPosition = this.camera.position;
        let totalVisible = 0;
        let totalHidden = 0;

        for (const [meshKey, instancedMesh] of this.instancedMeshes) {
            const instanceData = this.instanceData.get(meshKey);
            if (!instanceData) continue;

            // Crear array de visibilidad (inicialmente todas visibles)
            const visibility = new Array(instanceData.length).fill(true);

            // Calcular distancia para cada instancia
            instanceData.forEach((data, index) => {
                const distance = cameraPosition.distanceTo(data.position);
                
                // Aplicar LOD basado en distancia
                if (distance > this.lodDistances.hide) {
                    visibility[index] = false; // Ocultar muy lejos
                } else if (distance > this.lodDistances.low) {
                    // Para distancias medias, reducir densidad (ocultar algunas)
                    visibility[index] = (index % 3) !== 0; // Mostrar 2/3
                } else if (distance > this.lodDistances.medium) {
                    // Para distancias cercanas-medias, mostrar todas
                    visibility[index] = true;
                }
                // Para distancias cercanas (< medium), mostrar todas
            });

            // Aplicar visibilidad al InstancedMesh
            visibility.forEach((visible, index) => {
                instancedMesh.setVisibilityAt(index, visible);
                if (visible) totalVisible++;
                else totalHidden++;
            });

            // Marcar para actualización
            instancedMesh.instanceVisibility.needsUpdate = true;
        }

        // Loggear estadísticas cada 60 frames (aprox 1 segundo a 60fps)
        if (Math.random() < 0.016) { // ~1/60
            console.log(`📏 LOD: ${totalVisible} visible, ${totalHidden} ocultos (${((totalVisible/(totalVisible+totalHidden))*100).toFixed(1)}%)`);
        }
    }

    /**
     * Remover un tipo especifico de vegetacion
     */
    removeType(modelType) {
        console.log(`Removiendo tipo: ${modelType}`);

        const keysToRemove = [];
        for (const [key, mesh] of this.instancedMeshes) {
            if (key.startsWith(`${modelType}_`)) {
                this.scene.remove(mesh);
                mesh.dispose();
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => this.instancedMeshes.delete(key));
        this.instanceCounts.delete(modelType);

        console.log(`Removido ${keysToRemove.length} InstancedMesh para ${modelType}`);
    }
}

// Exponer la clase globalmente para compatibilidad
window.VegetationInstancer = VegetationInstancer;
