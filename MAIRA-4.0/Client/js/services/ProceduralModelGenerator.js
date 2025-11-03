/**
 * PROCEDURAL MODEL GENERATOR - MAIRA 4.0
 * ========================================
 * Genera modelos 3D procedurales cuando los archivos GLTF no están disponibles
 * Garantiza que el sistema 3D siempre funcione, incluso sin assets externos
 */

class ProceduralModelGenerator {
    constructor() {
        if (typeof THREE === 'undefined') {
            console.error('❌ THREE.js no disponible - ProceduralModelGenerator no puede inicializarse');
            return;
        }

        this.cache = new Map();
        console.log('🔨 ProceduralModelGenerator inicializado');
    }

    /**
     * Obtiene o genera un modelo procedural
     * @param {string} type - Tipo de modelo
     * @param {object} options - Opciones de generación
     * @returns {THREE.Group}
     */
    getModel(type, options = {}) {
        const cacheKey = `${type}_${JSON.stringify(options)}`;

        if (this.cache.has(cacheKey)) {
            return this.cloneModel(this.cache.get(cacheKey));
        }

        let model = null;

        // Determinar categoría y generar modelo apropiado
        if (this.isVegetation(type)) {
            model = this.generateVegetation(type, options);
        } else if (this.isVehicle(type)) {
            model = this.generateVehicle(type, options);
        } else if (this.isStructure(type)) {
            model = this.generateStructure(type, options);
        } else if (this.isInfantry(type)) {
            model = this.generateInfantry(type, options);
        } else {
            model = this.generateGeneric(type, options);
        }

        this.cache.set(cacheKey, model);
        return this.cloneModel(model);
    }

    /**
     * Determina si el tipo es vegetación
     */
    isVegetation(type) {
        const vegTypes = ['tree', 'trees_low', 'arbol', 'tree_tall', 'tree_medium', 'tree_oak',
                          'bush', 'arbusto', 'bush_alt', 'grass', 'vegetation'];
        return vegTypes.some(v => type.toLowerCase().includes(v));
    }

    /**
     * Determina si el tipo es vehículo
     */
    isVehicle(type) {
        const vehicleTypes = ['tank', 'tam', 'humvee', 'm113', 'truck', 'jeep', 'vehicle',
                              'ambulance', 'command_vehicle'];
        return vehicleTypes.some(v => type.toLowerCase().includes(v));
    }

    /**
     * Determina si el tipo es estructura
     */
    isStructure(type) {
        const structureTypes = ['tent', 'building', 'structure', 'command_tent', 'medical_tent'];
        return structureTypes.some(s => type.toLowerCase().includes(s));
    }

    /**
     * Determina si el tipo es infantería
     */
    isInfantry(type) {
        const infantryTypes = ['soldier', 'soldado', 'infantry', 'personnel'];
        return infantryTypes.some(i => type.toLowerCase().includes(i));
    }

    /**
     * Genera vegetación procedural
     */
    generateVegetation(type, options = {}) {
        const group = new THREE.Group();
        const typeLower = type.toLowerCase();

        if (typeLower.includes('tree') || typeLower.includes('arbol')) {
            // ÁRBOL PROCEDURAL
            const trunkHeight = options.height || 3.0;
            const trunkRadius = options.trunkRadius || 0.15;
            const crownRadius = options.crownRadius || 1.5;

            // Tronco
            const trunkGeometry = new THREE.CylinderGeometry(
                trunkRadius * 0.9,
                trunkRadius * 1.1,
                trunkHeight,
                8
            );
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3828 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            group.add(trunk);

            // Copa (esfera de hojas)
            const crownGeometry = new THREE.SphereGeometry(crownRadius, 8, 6);
            const crownMaterial = new THREE.MeshLambertMaterial({
                color: 0x2d5a1e,
                flatShading: true
            });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = trunkHeight + crownRadius * 0.7;
            crown.castShadow = true;
            group.add(crown);

            // Variación: Añadir segunda copa más pequeña para realismo
            if (Math.random() > 0.5) {
                const crown2Geometry = new THREE.SphereGeometry(crownRadius * 0.6, 6, 4);
                const crown2 = new THREE.Mesh(crown2Geometry, crownMaterial);
                crown2.position.y = trunkHeight + crownRadius * 1.3;
                crown2.position.x = (Math.random() - 0.5) * 0.5;
                crown2.position.z = (Math.random() - 0.5) * 0.5;
                crown2.castShadow = true;
                group.add(crown2);
            }

        } else if (typeLower.includes('bush') || typeLower.includes('arbusto')) {
            // ARBUSTO PROCEDURAL
            const bushRadius = options.radius || 0.8;
            const bushGeometry = new THREE.DodecahedronGeometry(bushRadius, 0);
            const bushMaterial = new THREE.MeshLambertMaterial({
                color: 0x3a6625,
                flatShading: true
            });
            const bush = new THREE.Mesh(bushGeometry, bushMaterial);
            bush.position.y = bushRadius * 0.7;
            bush.castShadow = true;
            group.add(bush);

        } else if (typeLower.includes('grass')) {
            // PASTO PROCEDURAL (cilindros muy delgados)
            for (let i = 0; i < 5; i++) {
                const grassHeight = 0.3 + Math.random() * 0.2;
                const grassGeometry = new THREE.CylinderGeometry(0.01, 0.02, grassHeight, 3);
                const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c4a });
                const grass = new THREE.Mesh(grassGeometry, grassMaterial);

                grass.position.x = (Math.random() - 0.5) * 0.4;
                grass.position.z = (Math.random() - 0.5) * 0.4;
                grass.position.y = grassHeight / 2;
                grass.rotation.z = (Math.random() - 0.5) * 0.2;

                group.add(grass);
            }
        }

        return group;
    }

    /**
     * Genera vehículo procedural
     */
    generateVehicle(type, options = {}) {
        const group = new THREE.Group();
        const typeLower = type.toLowerCase();

        if (typeLower.includes('tank') || typeLower.includes('tam')) {
            // TANQUE PROCEDURAL
            const hullWidth = 2.5;
            const hullLength = 5.0;
            const hullHeight = 1.2;

            // Casco
            const hullGeometry = new THREE.BoxGeometry(hullWidth, hullHeight, hullLength);
            const hullMaterial = new THREE.MeshStandardMaterial({
                color: 0x556b2f,
                roughness: 0.8,
                metalness: 0.3
            });
            const hull = new THREE.Mesh(hullGeometry, hullMaterial);
            hull.position.y = hullHeight / 2 + 0.3;
            hull.castShadow = true;
            group.add(hull);

            // Torreta
            const turretSize = 1.8;
            const turretGeometry = new THREE.CylinderGeometry(turretSize, turretSize, 0.8, 8);
            const turret = new THREE.Mesh(turretGeometry, hullMaterial);
            turret.position.y = hullHeight + 0.4;
            turret.castShadow = true;
            group.add(turret);

            // Cañón
            const cannonGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8);
            const cannon = new THREE.Mesh(cannonGeometry, hullMaterial);
            cannon.rotation.z = Math.PI / 2;
            cannon.position.y = hullHeight + 0.4;
            cannon.position.z = 2.0;
            cannon.castShadow = true;
            group.add(cannon);

            // Ruedas (simplificadas)
            this.addWheels(group, hullLength, hullWidth, 0.5);

        } else if (typeLower.includes('truck') || typeLower.includes('logistics')) {
            // CAMIÓN PROCEDURAL
            const cabinWidth = 2.0;
            const cabinLength = 2.0;
            const cabinHeight = 2.5;

            // Cabina
            const cabinGeometry = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
            const cabinMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a5a3a,
                roughness: 0.7
            });
            const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
            cabin.position.y = cabinHeight / 2 + 0.4;
            cabin.position.z = 2.0;
            cabin.castShadow = true;
            group.add(cabin);

            // Caja de carga
            const cargoGeometry = new THREE.BoxGeometry(2.2, 1.8, 4.0);
            const cargo = new THREE.Mesh(cargoGeometry, cabinMaterial);
            cargo.position.y = 0.9;
            cargo.position.z = -1.5;
            cargo.castShadow = true;
            group.add(cargo);

            // Ruedas
            this.addWheels(group, 5.0, 2.0, 0.4);

        } else if (typeLower.includes('humvee') || typeLower.includes('jeep')) {
            // VEHÍCULO LIGERO PROCEDURAL
            const bodyGeometry = new THREE.BoxGeometry(1.8, 1.5, 3.5);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x3d4a2f,
                roughness: 0.6
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 1.0;
            body.castShadow = true;
            group.add(body);

            this.addWheels(group, 3.0, 1.8, 0.35);
        }

        return group;
    }

    /**
     * Añade ruedas a un vehículo
     */
    addWheels(group, length, width, radius) {
        const wheelGeometry = new THREE.CylinderGeometry(radius, radius, 0.3, 8);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });

        const positions = [
            { x: width / 2 + 0.2, z: length / 3 },
            { x: -width / 2 - 0.2, z: length / 3 },
            { x: width / 2 + 0.2, z: -length / 3 },
            { x: -width / 2 - 0.2, z: -length / 3 }
        ];

        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos.x, radius, pos.z);
            wheel.castShadow = true;
            group.add(wheel);
        });
    }

    /**
     * Genera estructura procedural
     */
    generateStructure(type, options = {}) {
        const group = new THREE.Group();
        const typeLower = type.toLowerCase();

        if (typeLower.includes('tent')) {
            // CARPA MILITAR PROCEDURAL
            const width = options.width || 4.0;
            const height = options.height || 2.5;
            const length = options.length || 5.0;

            // Techo (prisma triangular)
            const roofShape = new THREE.Shape();
            roofShape.moveTo(0, 0);
            roofShape.lineTo(width, 0);
            roofShape.lineTo(width / 2, height);
            roofShape.lineTo(0, 0);

            const extrudeSettings = {
                steps: 1,
                depth: length,
                bevelEnabled: false
            };

            const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
            const tentMaterial = new THREE.MeshLambertMaterial({
                color: 0x6b7f5a,
                side: THREE.DoubleSide
            });
            const roof = new THREE.Mesh(roofGeometry, tentMaterial);
            roof.rotation.y = Math.PI / 2;
            roof.position.set(-length / 2, 0, -width / 2);
            roof.castShadow = true;
            group.add(roof);

            // Suelo
            const floorGeometry = new THREE.PlaneGeometry(width, length);
            const floorMaterial = new THREE.MeshLambertMaterial({
                color: 0x4a5a3a,
                side: THREE.DoubleSide
            });
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.receiveShadow = true;
            group.add(floor);
        }

        return group;
    }

    /**
     * Genera infantería procedural
     */
    generateInfantry(type, options = {}) {
        const group = new THREE.Group();

        const bodyHeight = 1.6;
        const bodyRadius = 0.25;

        // Cuerpo (cilindro)
        const bodyGeometry = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = bodyHeight / 2;
        body.castShadow = true;
        group.add(body);

        // Cabeza (esfera)
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xddb892 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = bodyHeight + 0.2;
        head.castShadow = true;
        group.add(head);

        // Rifle (cilindro delgado)
        const rifleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6);
        const rifleMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
        rifle.rotation.z = Math.PI / 4;
        rifle.position.set(0.3, bodyHeight * 0.7, 0.2);
        rifle.castShadow = true;
        group.add(rifle);

        return group;
    }

    /**
     * Genera modelo genérico procedural
     */
    generateGeneric(type, options = {}) {
        const group = new THREE.Group();

        const size = options.size || 1.0;
        const boxGeometry = new THREE.BoxGeometry(size, size, size);
        const boxMaterial = new THREE.MeshLambertMaterial({
            color: 0x888888,
            wireframe: false
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.y = size / 2;
        box.castShadow = true;
        group.add(box);

        console.warn(`⚠️ Modelo genérico creado para tipo: ${type}`);

        return group;
    }

    /**
     * Clona un modelo para reutilización
     */
    cloneModel(model) {
        return model.clone();
    }

    /**
     * Libera cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache de modelos procedurales limpiado');
    }
}

// Exponer globalmente
window.ProceduralModelGenerator = ProceduralModelGenerator;
console.log('✅ ProceduralModelGenerator cargado');
