/**
 * 🎖️ UnitManager3D.js
 * ========================
 * Gestión completa de unidades militares en el terreno 3D.
 * 
 * Funcionalidades:
 * - Colocación de unidades
 * - Selección y control
 * - Movimiento y órdenes
 * - Sistema de combate
 * - Detección de colisiones
 */

class UnitManager3D {
    constructor(controller) {
        this.controller = controller;

        // Estado de unidades
        this.placedUnits = [];
        this.selectedUnit = null;
        this.currentUnitType = null;
        this.currentVegetationType = null;

        // Three.js tools
        this.raycaster = null;
        this.mouse = null;
        this.gltfLoader = null;

        // Sistema de órdenes
        this.currentOrderMode = null;
        this.isCreatingWaypoints = false;

        // 🔗 Sistema SIDC → 3D
        this.sidcMapper = null;

        // Configuración de modelos de unidades
        this.unitModels = {
            // 🇦🇷 ARGENTINA
            'tam': {
                path: 'Client/assets/models/gbl_new/tam_tank.glb',
                scale: 1.0,
                yOffset: 0,
                name: 'TAM (Tanque)',
                maxSpeed: 19.44 // 70 km/h → 19.44 m/s
            },
            'tam_2c': {
                path: 'Client/assets/models/gbl_new/tam_2c_war_thunder.glb',
                scale: 1.0,
                yOffset: 0,
                name: 'TAM 2C (Modernizado)',
                maxSpeed: 19.44
            },
            'tam_2ip': {
                path: 'Client/assets/models/gbl_new/tam_2ip_war_thunder.glb',
                scale: 1.0,
                yOffset: 0,
                name: 'TAM 2IP',
                maxSpeed: 19.44
            },
            'm113': {
                path: 'Client/assets/models/gbl_new/m113.glb',
                scale: 0.0018,
                yOffset: 0,
                name: 'M113 (APC)',
                maxSpeed: 17.22
            },
            'soldier': {
                path: 'Client/assets/models/gbl_new/a_solider_poin_weapon.glb',
                scale: 1,
                yOffset: 0.9,
                name: 'Soldado',
                maxSpeed: 1.39
            },
            
            // 🇷🇺 RUSIA
            'soldier_ru': {
                path: 'Client/assets/models/gbl_new/russian_soldier.glb',
                scale: 0.001,
                yOffset: 0,
                name: 'Soldado Ruso',
                maxSpeed: 1.39
            },
            
            // 🌍 OTROS
            'jeep': {
                path: 'Client/assets/models/gbl_new/jeep.glb',
                scale: 1,
                yOffset: 0,
                name: 'Jeep',
                maxSpeed: 27.78
            },
            'humvee': {
                path: 'Client/assets/models/gbl_new/low_poly_humvee_vehicle.glb',
                scale: 1.0,
                yOffset: 0,
                name: 'Humvee',
                maxSpeed: 25.00
            }
        };
        
                // 🌳 Modelos de vegetación
        this.vegetationModels = {
            'tree_tall': {
                path: 'Client/assets/models/gbl_new/tree_tall.glb',
                scale: 0.01, // CORREGIDO: de 0.00001 a 0.01 para árboles visibles
                yOffset: 0,
                name: 'Árboles Bajos (Low Poly)'
            },
            'tree_medium': {
                path: 'Client/assets/models/gbl_new/arbusto.glb',
                scale: 0.05, // CORREGIDO: de 0.00005 a 0.05 para arbustos visibles
                yOffset: 0,
                name: 'Arbusto'
            },
            'trees_low': {
                path: 'Client/assets/models/gbl_new/trees_low.glb',
                scale: 0.01, // CORREGIDO: de 0.00001 a 0.01 para árboles visibles
                yOffset: 0,
                name: 'Árboles Bajos (Low Poly)'
            }
        };
    }
    
    /**
     * 🚀 Inicializar gestor de unidades
     */
    init() {
        // Inicializar herramientas Three.js
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.gltfLoader = new THREE.GLTFLoader();

        // 🔗 Inicializar sistema SIDC → 3D
        this.sidcMapper = new SIDCToModel3D();

        // Configurar event listeners
        this.setupEventListeners();

        log('✅ UnitManager3D inicializado con sistema SIDC→3D', 'success');
    }
    
    /**
     * 🖱️ Configurar event listeners para mouse
     */
    setupEventListeners() {
        const canvas = this.controller.renderer.domElement;
        
        // Click para colocar/seleccionar unidades
        canvas.addEventListener('click', (event) => this.handleClick(event));
        
        // Doble click para finalizar waypoints
        canvas.addEventListener('dblclick', (event) => this.handleDoubleClick(event));
        
        // Click derecho para menú contextual
        canvas.addEventListener('contextmenu', (event) => this.handleContextMenu(event));
    }
    
    /**
     * 🖱️ Manejar click en canvas
     */
    handleClick(event) {
        // Modo mover: agregar waypoint
        if (this.currentOrderMode === 'move' && this.selectedUnit) {
            this.handleMoveOrder(event);
            return;
        }
        
        // Modo ataque: seleccionar objetivo
        if (this.currentOrderMode === 'attack' && this.selectedUnit) {
            this.handleAttackOrder(event);
            return;
        }
        
        // Intentar seleccionar unidad
        const unitSelected = this.selectUnitWithClick(event.clientX, event.clientY);
        
        // Modo vegetación: colocar vegetación
        if (!unitSelected && this.currentVegetationType) {
            this.placeVegetationOnTerrain(event.clientX, event.clientY);
            return;
        }
        
        // Modo colocar unidad: colocar nueva unidad
        if (!unitSelected && this.currentUnitType) {
            this.placeUnitOnTerrain(event.clientX, event.clientY);
            // Desactivar modo inserción después de colocar
            this.currentUnitType = null;
            document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('active'));
            log('💡 Modo inserción desactivado', 'info');
        } else if (!unitSelected && !this.currentUnitType && this.selectedUnit) {
            // Deseleccionar si click en terreno vacío
            this.deselectUnit();
        }
    }
    
    /**
     * 🖱️ Manejar doble click (finalizar waypoints)
     */
    handleDoubleClick(event) {
        if (this.isCreatingWaypoints && this.currentOrderMode === 'move' && this.selectedUnit) {
            event.preventDefault();
            this.finishWaypointRoute();
        }
    }
    
    /**
     * 🖱️ Manejar click derecho (menú contextual)
     */
    handleContextMenu(event) {
        event.preventDefault();
        
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Seleccionar y mostrar menú contextual
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            if (this.selectedUnit !== unitObj) {
                this.selectedUnit = unitObj;
                this.createSelectionRing(this.selectedUnit);
            }
            
            // TODO: Mostrar menú contextual radial
            console.log('🎯 Menú contextual para unidad:', unitObj.userData.unitName);
        }
    }
    
    /**
     * 🎯 Seleccionar tipo de unidad para colocar
     */
    selectUnitType(type) {
        this.currentUnitType = type;
        this.currentOrderMode = null;
        
        const info = this.unitModels[type];
        if (document.getElementById('selected-unit-type')) {
            document.getElementById('selected-unit-type').textContent = info ? info.name : 'Ninguna';
        }
        if (document.getElementById('order-mode')) {
            document.getElementById('order-mode').textContent = 'Modo: Selección';
        }
        
        log(`🎖️ Unidad seleccionada: ${info.name}`, 'info');
    }
    
    /**
     * 📍 Colocar unidad en el terreno
     */
    placeUnitOnTerrain(x, y) {
        if (!this.currentUnitType) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }
        
        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }
        
        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // TODO: Verificar colisiones
            // if (this.checkCollisionAtPosition(point, 5, this.currentUnitType)) {
            //     log('⚠️ Posición ocupada o bloqueada', 'warning');
            //     return;
            // }
            
            this.loadAndPlaceUnit(this.currentUnitType, point);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }
    
    /**
     * 📦 Cargar y colocar modelo de unidad
     */
    loadAndPlaceUnit(type, position) {
        const config = this.unitModels[type];
        
        if (!config) {
            log(`❌ Tipo de unidad desconocido: ${type}`, 'error');
            return;
        }
        
        showLoadingModal(`Cargando ${config.name}...`, 10);
        
        this.gltfLoader.load(
            config.path,
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar posición y escala
                model.position.copy(position);
                model.position.y += config.yOffset;
                model.scale.setScalar(config.scale);
                
                // Configurar userData
                model.userData.unitType = type;
                model.userData.unitName = config.name;
                model.userData.maxSpeed = config.maxSpeed;
                model.userData.faction = 'friendly';
                model.userData.currentHealth = 100;
                model.userData.maxHealth = 100;
                
                // Sistema de órdenes
                model.userData.order = null;
                model.userData.waypoints = [];
                model.userData.isMoving = false;
                
                // Agregar a escena y lista
                this.controller.scene.add(model);
                this.placedUnits.push(model);
                
                hideLoadingModal();
                log(`✅ ${config.name} colocado en terreno`, 'success');
                
                // Seleccionar automáticamente
                this.selectedUnit = model;
                this.createSelectionRing(model);
                
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                updateProgressBar(`Cargando ${config.name}...`, percent);
            },
            (error) => {
                hideLoadingModal();
                log(`❌ Error cargando modelo: ${error.message}`, 'error');
                console.error(error);
            }
        );
    }
    
    /**
     * 🎯 Seleccionar unidad con click
     */
    selectUnitWithClick(x, y) {
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            
            // Buscar el objeto raíz con userData
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Deseleccionar unidad anterior
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            // Seleccionar nueva unidad
            this.selectedUnit = unitObj;
            this.createSelectionRing(unitObj);
            
            log(`🎯 Unidad seleccionada: ${unitObj.userData.unitName}`, 'info');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 🔄 Deseleccionar unidad actual
     */
    deselectUnit() {
        if (this.selectedUnit) {
            this.removeSelectionRing(this.selectedUnit);
            this.selectedUnit = null;
            
            if (document.getElementById('active-unit-info')) {
                document.getElementById('active-unit-info').textContent = 'Ninguna unidad seleccionada';
            }
            
            log('ℹ️ Unidad deseleccionada', 'info');
        }
    }
    
    /**
     * ⭕ Crear anillo de selección
     */
    createSelectionRing(unit) {
        // Remover anillo anterior si existe
        this.removeSelectionRing(unit);
        
        // Crear geometría de anillo
        const ringGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.name = 'selectionRing';
        
        unit.add(ring);
    }
    
    /**
     * ❌ Remover anillo de selección
     */
    removeSelectionRing(unit) {
        const ring = unit.getObjectByName('selectionRing');
        if (ring) {
            unit.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    
    /**
     * 🔄 Actualizar movimiento de unidades (llamado cada frame)
     */
    updateMovement(delta) {
        // TODO: Implementar sistema de movimiento
        // Por ahora solo un placeholder
        if (this.placedUnits.length > 0) {
            // Actualizar unidades en movimiento
        }
    }
    
    /**
     * 🗺️ Manejar orden de movimiento
     */
    handleMoveOrder(event) {
        // TODO: Implementar sistema de waypoints
        console.log('🗺️ Orden de movimiento');
    }
    
    /**
     * ⚔️ Manejar orden de ataque
     */
    handleAttackOrder(event) {
        // TODO: Implementar sistema de combate
        console.log('⚔️ Orden de ataque');
    }
    
    /**
     * 🌳 Colocar vegetación en terreno
     */
    placeVegetationOnTerrain(x, y) {
        // TODO: Implementar sistema de vegetación
        console.log('🌳 Colocar vegetación');
    }
    
    /**
     * 🗺️ Finalizar ruta de waypoints
     */
    finishWaypointRoute() {
        this.isCreatingWaypoints = false;
        this.currentOrderMode = null;
        log('✅ Ruta de waypoints finalizada', 'success');
   }

    /**
     * 🎯 Colocar unidad en terreno usando código SIDC (método público)
     * @param {string} sidc - Código SIDC de la unidad
     * @param {number} x - Coordenada X del mouse
     * @param {number} y - Coordenada Y del mouse
     * @param {Object} additionalData - Datos adicionales (opcional)
     */
    placeUnitOnTerrainBySIDC(sidc, x, y, additionalData = {}) {
        if (!sidc) {
            log('⚠️ Código SIDC requerido', 'warning');
            return;
        }

        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.placeUnitBySIDC(sidc, point, additionalData);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }

    /**
     * 📊 Obtener estadísticas del sistema SIDC→3D
     * @returns {Object} - Estadísticas del sistema
     */
    getSIDCStats() {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getStats();
    }

    /**
     * 🔍 Obtener información de tipo de unidad desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object} - Información del tipo de unidad
     */
    getUnitInfoFromSIDC(sidc) {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getUnitTypeInfo(sidc);
    }

    /**
     * 📍 Colocar unidad en el terreno
     */
    placeUnitOnTerrain(x, y) {
        if (!this.currentUnitType) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }
        
        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }
        
        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // TODO: Verificar colisiones
            // if (this.checkCollisionAtPosition(point, 5, this.currentUnitType)) {
            //     log('⚠️ Posición ocupada o bloqueada', 'warning');
            //     return;
            // }
            
            this.loadAndPlaceUnit(this.currentUnitType, point);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }
    
    /**
     * 📦 Cargar y colocar modelo de unidad
     */
    loadAndPlaceUnit(type, position) {
        const config = this.unitModels[type];
        
        if (!config) {
            log(`❌ Tipo de unidad desconocido: ${type}`, 'error');
            return;
        }
        
        showLoadingModal(`Cargando ${config.name}...`, 10);
        
        this.gltfLoader.load(
            config.path,
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar posición y escala
                model.position.copy(position);
                model.position.y += config.yOffset;
                model.scale.setScalar(config.scale);
                
                // Configurar userData
                model.userData.unitType = type;
                model.userData.unitName = config.name;
                model.userData.maxSpeed = config.maxSpeed;
                model.userData.faction = 'friendly';
                model.userData.currentHealth = 100;
                model.userData.maxHealth = 100;
                
                // Sistema de órdenes
                model.userData.order = null;
                model.userData.waypoints = [];
                model.userData.isMoving = false;
                
                // Agregar a escena y lista
                this.controller.scene.add(model);
                this.placedUnits.push(model);
                
                hideLoadingModal();
                log(`✅ ${config.name} colocado en terreno`, 'success');
                
                // Seleccionar automáticamente
                this.selectedUnit = model;
                this.createSelectionRing(model);
                
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                updateProgressBar(`Cargando ${config.name}...`, percent);
            },
            (error) => {
                hideLoadingModal();
                log(`❌ Error cargando modelo: ${error.message}`, 'error');
                console.error(error);
            }
        );
    }
    
    /**
     * 🎯 Seleccionar unidad con click
     */
    selectUnitWithClick(x, y) {
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            
            // Buscar el objeto raíz con userData
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Deseleccionar unidad anterior
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            // Seleccionar nueva unidad
            this.selectedUnit = unitObj;
            this.createSelectionRing(unitObj);
            
            log(`🎯 Unidad seleccionada: ${unitObj.userData.unitName}`, 'info');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 🔄 Deseleccionar unidad actual
     */
    deselectUnit() {
        if (this.selectedUnit) {
            this.removeSelectionRing(this.selectedUnit);
            this.selectedUnit = null;
            
            if (document.getElementById('active-unit-info')) {
                document.getElementById('active-unit-info').textContent = 'Ninguna unidad seleccionada';
            }
            
            log('ℹ️ Unidad deseleccionada', 'info');
        }
    }
    
    /**
     * ⭕ Crear anillo de selección
     */
    createSelectionRing(unit) {
        // Remover anillo anterior si existe
        this.removeSelectionRing(unit);
        
        // Crear geometría de anillo
        const ringGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.name = 'selectionRing';
        
        unit.add(ring);
    }
    
    /**
     * ❌ Remover anillo de selección
     */
    removeSelectionRing(unit) {
        const ring = unit.getObjectByName('selectionRing');
        if (ring) {
            unit.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    
    /**
     * 🔄 Actualizar movimiento de unidades (llamado cada frame)
     */
    updateMovement(delta) {
        // TODO: Implementar sistema de movimiento
        // Por ahora solo un placeholder
        if (this.placedUnits.length > 0) {
            // Actualizar unidades en movimiento
        }
    }
    
    /**
     * 🗺️ Manejar orden de movimiento
     */
    handleMoveOrder(event) {
        // TODO: Implementar sistema de waypoints
        console.log('🗺️ Orden de movimiento');
    }
    
    /**
     * ⚔️ Manejar orden de ataque
     */
    handleAttackOrder(event) {
        // TODO: Implementar sistema de combate
        console.log('⚔️ Orden de ataque');
    }
    
    /**
     * 🌳 Colocar vegetación en terreno
     */
    placeVegetationOnTerrain(x, y) {
        // TODO: Implementar sistema de vegetación
        console.log('🌳 Colocar vegetación');
    }
    
    /**
     * 🗺️ Finalizar ruta de waypoints
     */
    finishWaypointRoute() {
        this.isCreatingWaypoints = false;
        this.currentOrderMode = null;
        log('✅ Ruta de waypoints finalizada', 'success');
   }

    /**
     * 🎯 Colocar unidad en terreno usando código SIDC (método público)
     * @param {string} sidc - Código SIDC de la unidad
     * @param {number} x - Coordenada X del mouse
     * @param {number} y - Coordenada Y del mouse
     * @param {Object} additionalData - Datos adicionales (opcional)
     */
    placeUnitOnTerrainBySIDC(sidc, x, y, additionalData = {}) {
        if (!sidc) {
            log('⚠️ Código SIDC requerido', 'warning');
            return;
        }

        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.placeUnitBySIDC(sidc, point, additionalData);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }

    /**
     * 📊 Obtener estadísticas del sistema SIDC→3D
     * @returns {Object} - Estadísticas del sistema
     */
    getSIDCStats() {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getStats();
    }

    /**
     * 🔍 Obtener información de tipo de unidad desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object} - Información del tipo de unidad
     */
    getUnitInfoFromSIDC(sidc) {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getUnitTypeInfo(sidc);
    }

    /**
     * 📍 Colocar unidad en el terreno
     */
    placeUnitOnTerrain(x, y) {
        if (!this.currentUnitType) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }
        
        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }
        
        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // TODO: Verificar colisiones
            // if (this.checkCollisionAtPosition(point, 5, this.currentUnitType)) {
            //     log('⚠️ Posición ocupada o bloqueada', 'warning');
            //     return;
            // }
            
            this.loadAndPlaceUnit(this.currentUnitType, point);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }
    
    /**
     * 📦 Cargar y colocar modelo de unidad
     */
    loadAndPlaceUnit(type, position) {
        const config = this.unitModels[type];
        
        if (!config) {
            log(`❌ Tipo de unidad desconocido: ${type}`, 'error');
            return;
        }
        
        showLoadingModal(`Cargando ${config.name}...`, 10);
        
        this.gltfLoader.load(
            config.path,
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar posición y escala
                model.position.copy(position);
                model.position.y += config.yOffset;
                model.scale.setScalar(config.scale);
                
                // Configurar userData
                model.userData.unitType = type;
                model.userData.unitName = config.name;
                model.userData.maxSpeed = config.maxSpeed;
                model.userData.faction = 'friendly';
                model.userData.currentHealth = 100;
                model.userData.maxHealth = 100;
                
                // Sistema de órdenes
                model.userData.order = null;
                model.userData.waypoints = [];
                model.userData.isMoving = false;
                
                // Agregar a escena y lista
                this.controller.scene.add(model);
                this.placedUnits.push(model);
                
                hideLoadingModal();
                log(`✅ ${config.name} colocado en terreno`, 'success');
                
                // Seleccionar automáticamente
                this.selectedUnit = model;
                this.createSelectionRing(model);
                
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                updateProgressBar(`Cargando ${config.name}...`, percent);
            },
            (error) => {
                hideLoadingModal();
                log(`❌ Error cargando modelo: ${error.message}`, 'error');
                console.error(error);
            }
        );
    }
    
    /**
     * 🎯 Seleccionar unidad con click
     */
    selectUnitWithClick(x, y) {
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            
            // Buscar el objeto raíz con userData
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Deseleccionar unidad anterior
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            // Seleccionar nueva unidad
            this.selectedUnit = unitObj;
            this.createSelectionRing(unitObj);
            
            log(`🎯 Unidad seleccionada: ${unitObj.userData.unitName}`, 'info');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 🔄 Deseleccionar unidad actual
     */
    deselectUnit() {
        if (this.selectedUnit) {
            this.removeSelectionRing(this.selectedUnit);
            this.selectedUnit = null;
            
            if (document.getElementById('active-unit-info')) {
                document.getElementById('active-unit-info').textContent = 'Ninguna unidad seleccionada';
            }
            
            log('ℹ️ Unidad deseleccionada', 'info');
        }
    }
    
    /**
     * ⭕ Crear anillo de selección
     */
    createSelectionRing(unit) {
        // Remover anillo anterior si existe
        this.removeSelectionRing(unit);
        
        // Crear geometría de anillo
        const ringGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.name = 'selectionRing';
        
        unit.add(ring);
    }
    
    /**
     * ❌ Remover anillo de selección
     */
    removeSelectionRing(unit) {
        const ring = unit.getObjectByName('selectionRing');
        if (ring) {
            unit.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    
    /**
     * 🔄 Actualizar movimiento de unidades (llamado cada frame)
     */
    updateMovement(delta) {
        // TODO: Implementar sistema de movimiento
        // Por ahora solo un placeholder
        if (this.placedUnits.length > 0) {
            // Actualizar unidades en movimiento
        }
    }
    
    /**
     * 🗺️ Manejar orden de movimiento
     */
    handleMoveOrder(event) {
        // TODO: Implementar sistema de waypoints
        console.log('🗺️ Orden de movimiento');
    }
    
    /**
     * ⚔️ Manejar orden de ataque
     */
    handleAttackOrder(event) {
        // TODO: Implementar sistema de combate
        console.log('⚔️ Orden de ataque');
    }
    
    /**
     * 🌳 Colocar vegetación en terreno
     */
    placeVegetationOnTerrain(x, y) {
        // TODO: Implementar sistema de vegetación
        console.log('🌳 Colocar vegetación');
    }
    
    /**
     * 🗺️ Finalizar ruta de waypoints
     */
    finishWaypointRoute() {
        this.isCreatingWaypoints = false;
        this.currentOrderMode = null;
        log('✅ Ruta de waypoints finalizada', 'success');
   }

    /**
     * 🎯 Colocar unidad en terreno usando código SIDC (método público)
     * @param {string} sidc - Código SIDC de la unidad
     * @param {number} x - Coordenada X del mouse
     * @param {number} y - Coordenada Y del mouse
     * @param {Object} additionalData - Datos adicionales (opcional)
     */
    placeUnitOnTerrainBySIDC(sidc, x, y, additionalData = {}) {
        if (!sidc) {
            log('⚠️ Código SIDC requerido', 'warning');
            return;
        }

        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.placeUnitBySIDC(sidc, point, additionalData);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }

    /**
     * 📊 Obtener estadísticas del sistema SIDC→3D
     * @returns {Object} - Estadísticas del sistema
     */
    getSIDCStats() {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getStats();
    }

    /**
     * 🔍 Obtener información de tipo de unidad desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object} - Información del tipo de unidad
     */
    getUnitInfoFromSIDC(sidc) {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getUnitTypeInfo(sidc);
    }

    /**
     * 📍 Colocar unidad en el terreno
     */
    placeUnitOnTerrain(x, y) {
        if (!this.currentUnitType) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }
        
        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }
        
        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // TODO: Verificar colisiones
            // if (this.checkCollisionAtPosition(point, 5, this.currentUnitType)) {
            //     log('⚠️ Posición ocupada o bloqueada', 'warning');
            //     return;
            // }
            
            this.loadAndPlaceUnit(this.currentUnitType, point);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }
    
    /**
     * 📦 Cargar y colocar modelo de unidad
     */
    loadAndPlaceUnit(type, position) {
        const config = this.unitModels[type];
        
        if (!config) {
            log(`❌ Tipo de unidad desconocido: ${type}`, 'error');
            return;
        }
        
        showLoadingModal(`Cargando ${config.name}...`, 10);
        
        this.gltfLoader.load(
            config.path,
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar posición y escala
                model.position.copy(position);
                model.position.y += config.yOffset;
                model.scale.setScalar(config.scale);
                
                // Configurar userData
                model.userData.unitType = type;
                model.userData.unitName = config.name;
                model.userData.maxSpeed = config.maxSpeed;
                model.userData.faction = 'friendly';
                model.userData.currentHealth = 100;
                model.userData.maxHealth = 100;
                
                // Sistema de órdenes
                model.userData.order = null;
                model.userData.waypoints = [];
                model.userData.isMoving = false;
                
                // Agregar a escena y lista
                this.controller.scene.add(model);
                this.placedUnits.push(model);
                
                hideLoadingModal();
                log(`✅ ${config.name} colocado en terreno`, 'success');
                
                // Seleccionar automáticamente
                this.selectedUnit = model;
                this.createSelectionRing(model);
                
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                updateProgressBar(`Cargando ${config.name}...`, percent);
            },
            (error) => {
                hideLoadingModal();
                log(`❌ Error cargando modelo: ${error.message}`, 'error');
                console.error(error);
            }
        );
    }
    
    /**
     * 🎯 Seleccionar unidad con click
     */
    selectUnitWithClick(x, y) {
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            
            // Buscar el objeto raíz con userData
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Deseleccionar unidad anterior
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            // Seleccionar nueva unidad
            this.selectedUnit = unitObj;
            this.createSelectionRing(unitObj);
            
            log(`🎯 Unidad seleccionada: ${unitObj.userData.unitName}`, 'info');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 🔄 Deseleccionar unidad actual
     */
    deselectUnit() {
        if (this.selectedUnit) {
            this.removeSelectionRing(this.selectedUnit);
            this.selectedUnit = null;
            
            if (document.getElementById('active-unit-info')) {
                document.getElementById('active-unit-info').textContent = 'Ninguna unidad seleccionada';
            }
            
            log('ℹ️ Unidad deseleccionada', 'info');
        }
    }
    
    /**
     * ⭕ Crear anillo de selección
     */
    createSelectionRing(unit) {
        // Remover anillo anterior si existe
        this.removeSelectionRing(unit);
        
        // Crear geometría de anillo
        const ringGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.name = 'selectionRing';
        
        unit.add(ring);
    }
    
    /**
     * ❌ Remover anillo de selección
     */
    removeSelectionRing(unit) {
        const ring = unit.getObjectByName('selectionRing');
        if (ring) {
            unit.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    
    /**
     * 🔄 Actualizar movimiento de unidades (llamado cada frame)
     */
    updateMovement(delta) {
        // TODO: Implementar sistema de movimiento
        // Por ahora solo un placeholder
        if (this.placedUnits.length > 0) {
            // Actualizar unidades en movimiento
        }
    }
    
    /**
     * 🗺️ Manejar orden de movimiento
     */
    handleMoveOrder(event) {
        // TODO: Implementar sistema de waypoints
        console.log('🗺️ Orden de movimiento');
    }
    
    /**
     * ⚔️ Manejar orden de ataque
     */
    handleAttackOrder(event) {
        // TODO: Implementar sistema de combate
        console.log('⚔️ Orden de ataque');
    }
    
    /**
     * 🌳 Colocar vegetación en terreno
     */
    placeVegetationOnTerrain(x, y) {
        // TODO: Implementar sistema de vegetación
        console.log('🌳 Colocar vegetación');
    }
    
    /**
     * 🗺️ Finalizar ruta de waypoints
     */
    finishWaypointRoute() {
        this.isCreatingWaypoints = false;
        this.currentOrderMode = null;
        log('✅ Ruta de waypoints finalizada', 'success');
   }

    /**
     * 🎯 Colocar unidad en terreno usando código SIDC (método público)
     * @param {string} sidc - Código SIDC de la unidad
     * @param {number} x - Coordenada X del mouse
     * @param {number} y - Coordenada Y del mouse
     * @param {Object} additionalData - Datos adicionales (opcional)
     */
    placeUnitOnTerrainBySIDC(sidc, x, y, additionalData = {}) {
        if (!sidc) {
            log('⚠️ Código SIDC requerido', 'warning');
            return;
        }

        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.placeUnitBySIDC(sidc, point, additionalData);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }

    /**
     * 📊 Obtener estadísticas del sistema SIDC→3D
     * @returns {Object} - Estadísticas del sistema
     */
    getSIDCStats() {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getStats();
    }

    /**
     * 🔍 Obtener información de tipo de unidad desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object} - Información del tipo de unidad
     */
    getUnitInfoFromSIDC(sidc) {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getUnitTypeInfo(sidc);
    }

    /**
     * 📍 Colocar unidad en el terreno
     */
    placeUnitOnTerrain(x, y) {
        if (!this.currentUnitType) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }
        
        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }
        
        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // TODO: Verificar colisiones
            // if (this.checkCollisionAtPosition(point, 5, this.currentUnitType)) {
            //     log('⚠️ Posición ocupada o bloqueada', 'warning');
            //     return;
            // }
            
            this.loadAndPlaceUnit(this.currentUnitType, point);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }
    
    /**
     * 📦 Cargar y colocar modelo de unidad
     */
    loadAndPlaceUnit(type, position) {
        const config = this.unitModels[type];
        
        if (!config) {
            log(`❌ Tipo de unidad desconocido: ${type}`, 'error');
            return;
        }
        
        showLoadingModal(`Cargando ${config.name}...`, 10);
        
        this.gltfLoader.load(
            config.path,
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar posición y escala
                model.position.copy(position);
                model.position.y += config.yOffset;
                model.scale.setScalar(config.scale);
                
                // Configurar userData
                model.userData.unitType = type;
                model.userData.unitName = config.name;
                model.userData.maxSpeed = config.maxSpeed;
                model.userData.faction = 'friendly';
                model.userData.currentHealth = 100;
                model.userData.maxHealth = 100;
                
                // Sistema de órdenes
                model.userData.order = null;
                model.userData.waypoints = [];
                model.userData.isMoving = false;
                
                // Agregar a escena y lista
                this.controller.scene.add(model);
                this.placedUnits.push(model);
                
                hideLoadingModal();
                log(`✅ ${config.name} colocado en terreno`, 'success');
                
                // Seleccionar automáticamente
                this.selectedUnit = model;
                this.createSelectionRing(model);
                
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                updateProgressBar(`Cargando ${config.name}...`, percent);
            },
            (error) => {
                hideLoadingModal();
                log(`❌ Error cargando modelo: ${error.message}`, 'error');
                console.error(error);
            }
        );
    }
    
    /**
     * 🎯 Seleccionar unidad con click
     */
    selectUnitWithClick(x, y) {
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            
            // Buscar el objeto raíz con userData
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Deseleccionar unidad anterior
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            // Seleccionar nueva unidad
            this.selectedUnit = unitObj;
            this.createSelectionRing(unitObj);
            
            log(`🎯 Unidad seleccionada: ${unitObj.userData.unitName}`, 'info');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 🔄 Deseleccionar unidad actual
     */
    deselectUnit() {
        if (this.selectedUnit) {
            this.removeSelectionRing(this.selectedUnit);
            this.selectedUnit = null;
            
            if (document.getElementById('active-unit-info')) {
                document.getElementById('active-unit-info').textContent = 'Ninguna unidad seleccionada';
            }
            
            log('ℹ️ Unidad deseleccionada', 'info');
        }
    }
    
    /**
     * ⭕ Crear anillo de selección
     */
    createSelectionRing(unit) {
        // Remover anillo anterior si existe
        this.removeSelectionRing(unit);
        
        // Crear geometría de anillo
        const ringGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.name = 'selectionRing';
        
        unit.add(ring);
    }
    
    /**
     * ❌ Remover anillo de selección
     */
    removeSelectionRing(unit) {
        const ring = unit.getObjectByName('selectionRing');
        if (ring) {
            unit.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    
    /**
     * 🔄 Actualizar movimiento de unidades (llamado cada frame)
     */
    updateMovement(delta) {
        // TODO: Implementar sistema de movimiento
        // Por ahora solo un placeholder
        if (this.placedUnits.length > 0) {
            // Actualizar unidades en movimiento
        }
    }
    
    /**
     * 🗺️ Manejar orden de movimiento
     */
    handleMoveOrder(event) {
        // TODO: Implementar sistema de waypoints
        console.log('🗺️ Orden de movimiento');
    }
    
    /**
     * ⚔️ Manejar orden de ataque
     */
    handleAttackOrder(event) {
        // TODO: Implementar sistema de combate
        console.log('⚔️ Orden de ataque');
    }
    
    /**
     * 🌳 Colocar vegetación en terreno
     */
    placeVegetationOnTerrain(x, y) {
        // TODO: Implementar sistema de vegetación
        console.log('🌳 Colocar vegetación');
    }
    
    /**
     * 🗺️ Finalizar ruta de waypoints
     */
    finishWaypointRoute() {
        this.isCreatingWaypoints = false;
        this.currentOrderMode = null;
        log('✅ Ruta de waypoints finalizada', 'success');
   }

    /**
     * 🎯 Colocar unidad en terreno usando código SIDC (método público)
     * @param {string} sidc - Código SIDC de la unidad
     * @param {number} x - Coordenada X del mouse
     * @param {number} y - Coordenada Y del mouse
     * @param {Object} additionalData - Datos adicionales (opcional)
     */
    placeUnitOnTerrainBySIDC(sidc, x, y, additionalData = {}) {
        if (!sidc) {
            log('⚠️ Código SIDC requerido', 'warning');
            return;
        }

        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.placeUnitBySIDC(sidc, point, additionalData);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }

    /**
     * 📊 Obtener estadísticas del sistema SIDC→3D
     * @returns {Object} - Estadísticas del sistema
     */
    getSIDCStats() {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getStats();
    }

    /**
     * 🔍 Obtener información de tipo de unidad desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object} - Información del tipo de unidad
     */
    getUnitInfoFromSIDC(sidc) {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getUnitTypeInfo(sidc);
    }

    /**
     * 📍 Colocar unidad en el terreno
     */
    placeUnitOnTerrain(x, y) {
        if (!this.currentUnitType) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }
        
        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }
        
        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // TODO: Verificar colisiones
            // if (this.checkCollisionAtPosition(point, 5, this.currentUnitType)) {
            //     log('⚠️ Posición ocupada o bloqueada', 'warning');
            //     return;
            // }
            
            this.loadAndPlaceUnit(this.currentUnitType, point);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }
    
    /**
     * 📦 Cargar y colocar modelo de unidad
     */
    loadAndPlaceUnit(type, position) {
        const config = this.unitModels[type];
        
        if (!config) {
            log(`❌ Tipo de unidad desconocido: ${type}`, 'error');
            return;
        }
        
        showLoadingModal(`Cargando ${config.name}...`, 10);
        
        this.gltfLoader.load(
            config.path,
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar posición y escala
                model.position.copy(position);
                model.position.y += config.yOffset;
                model.scale.setScalar(config.scale);
                
                // Configurar userData
                model.userData.unitType = type;
                model.userData.unitName = config.name;
                model.userData.maxSpeed = config.maxSpeed;
                model.userData.faction = 'friendly';
                model.userData.currentHealth = 100;
                model.userData.maxHealth = 100;
                
                // Sistema de órdenes
                model.userData.order = null;
                model.userData.waypoints = [];
                model.userData.isMoving = false;
                
                // Agregar a escena y lista
                this.controller.scene.add(model);
                this.placedUnits.push(model);
                
                hideLoadingModal();
                log(`✅ ${config.name} colocado en terreno`, 'success');
                
                // Seleccionar automáticamente
                this.selectedUnit = model;
                this.createSelectionRing(model);
                
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                updateProgressBar(`Cargando ${config.name}...`, percent);
            },
            (error) => {
                hideLoadingModal();
                log(`❌ Error cargando modelo: ${error.message}`, 'error');
                console.error(error);
            }
        );
    }
    
    /**
     * 🎯 Seleccionar unidad con click
     */
    selectUnitWithClick(x, y) {
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            
            // Buscar el objeto raíz con userData
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Deseleccionar unidad anterior
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            // Seleccionar nueva unidad
            this.selectedUnit = unitObj;
            this.createSelectionRing(unitObj);
            
            log(`🎯 Unidad seleccionada: ${unitObj.userData.unitName}`, 'info');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 🔄 Deseleccionar unidad actual
     */
    deselectUnit() {
        if (this.selectedUnit) {
            this.removeSelectionRing(this.selectedUnit);
            this.selectedUnit = null;
            
            if (document.getElementById('active-unit-info')) {
                document.getElementById('active-unit-info').textContent = 'Ninguna unidad seleccionada';
            }
            
            log('ℹ️ Unidad deseleccionada', 'info');
        }
    }
    
    /**
     * ⭕ Crear anillo de selección
     */
    createSelectionRing(unit) {
        // Remover anillo anterior si existe
        this.removeSelectionRing(unit);
        
        // Crear geometría de anillo
        const ringGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.name = 'selectionRing';
        
        unit.add(ring);
    }
    
    /**
     * ❌ Remover anillo de selección
     */
    removeSelectionRing(unit) {
        const ring = unit.getObjectByName('selectionRing');
        if (ring) {
            unit.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    
    /**
     * 🔄 Actualizar movimiento de unidades (llamado cada frame)
     */
    updateMovement(delta) {
        // TODO: Implementar sistema de movimiento
        // Por ahora solo un placeholder
        if (this.placedUnits.length > 0) {
            // Actualizar unidades en movimiento
        }
    }
    
    /**
     * 🗺️ Manejar orden de movimiento
     */
    handleMoveOrder(event) {
        // TODO: Implementar sistema de waypoints
        console.log('🗺️ Orden de movimiento');
    }
    
    /**
     * ⚔️ Manejar orden de ataque
     */
    handleAttackOrder(event) {
        // TODO: Implementar sistema de combate
        console.log('⚔️ Orden de ataque');
    }
    
    /**
     * 🌳 Colocar vegetación en terreno
     */
    placeVegetationOnTerrain(x, y) {
        // TODO: Implementar sistema de vegetación
        console.log('🌳 Colocar vegetación');
    }
    
    /**
     * 🗺️ Finalizar ruta de waypoints
     */
    finishWaypointRoute() {
        this.isCreatingWaypoints = false;
        this.currentOrderMode = null;
        log('✅ Ruta de waypoints finalizada', 'success');
   }

    /**
     * 🎯 Colocar unidad en terreno usando código SIDC (método público)
     * @param {string} sidc - Código SIDC de la unidad
     * @param {number} x - Coordenada X del mouse
     * @param {number} y - Coordenada Y del mouse
     * @param {Object} additionalData - Datos adicionales (opcional)
     */
    placeUnitOnTerrainBySIDC(sidc, x, y, additionalData = {}) {
        if (!sidc) {
            log('⚠️ Código SIDC requerido', 'warning');
            return;
        }

        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.placeUnitBySIDC(sidc, point, additionalData);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }

    /**
     * 📊 Obtener estadísticas del sistema SIDC→3D
     * @returns {Object} - Estadísticas del sistema
     */
    getSIDCStats() {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getStats();
    }

    /**
     * 🔍 Obtener información de tipo de unidad desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object} - Información del tipo de unidad
     */
    getUnitInfoFromSIDC(sidc) {
        if (!this.sidcMapper) {
            return { error: 'Sistema SIDC no inicializado' };
        }
        return this.sidcMapper.getUnitTypeInfo(sidc);
    }

    /**
     * 📍 Colocar unidad en el terreno
     */
    placeUnitOnTerrain(x, y) {
        if (!this.currentUnitType) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }
        
        if (!this.controller.currentTerrain || !this.controller.currentTerrain.terrain) {
            log('⚠️ Genera el terreno primero', 'warning');
            return;
        }
        
        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // TODO: Verificar colisiones
            // if (this.checkCollisionAtPosition(point, 5, this.currentUnitType)) {
            //     log('⚠️ Posición ocupada o bloqueada', 'warning');
            //     return;
            // }
            
            this.loadAndPlaceUnit(this.currentUnitType, point);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }
    
    /**
     * 📦 Cargar y colocar modelo de unidad
     */
    loadAndPlaceUnit(type, position) {
        const config = this.unitModels[type];
        
        if (!config) {
            log(`❌ Tipo de unidad desconocido: ${type}`, 'error');
            return;
        }
        
        showLoadingModal(`Cargando ${config.name}...`, 10);
        
        this.gltfLoader.load(
            config.path,
            (gltf) => {
                const model = gltf.scene;
                
                // Configurar posición y escala
                model.position.copy(position);
                model.position.y += config.yOffset;
                model.scale.setScalar(config.scale);
                
                // Configurar userData
                model.userData.unitType = type;
                model.userData.unitName = config.name;
                model.userData.maxSpeed = config.maxSpeed;
                model.userData.faction = 'friendly';
                model.userData.currentHealth = 100;
                model.userData.maxHealth = 100;
                
                // Sistema de órdenes
                model.userData.order = null;
                model.userData.waypoints = [];
                model.userData.isMoving = false;
                
                // Agregar a escena y lista
                this.controller.scene.add(model);
                this.placedUnits.push(model);
                
                hideLoadingModal();
                log(`✅ ${config.name} colocado en terreno`, 'success');
                
                // Seleccionar automáticamente
                this.selectedUnit = model;
                this.createSelectionRing(model);
                
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                updateProgressBar(`Cargando ${config.name}...`, percent);
            },
            (error) => {
                hideLoadingModal();
                log(`❌ Error cargando modelo: ${error.message}`, 'error');
                console.error(error);
            }
        );
    }
    
    /**
     * 🎯 Seleccionar unidad con click
     */
    selectUnitWithClick(x, y) {
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);
        
        if (intersects.length > 0) {
            let unitObj = intersects[0].object;
            
            // Buscar el objeto raíz con userData
            while (unitObj.parent && !unitObj.userData.unitType) {
                unitObj = unitObj.parent;
            }
            
            // Deseleccionar unidad anterior
            if (this.selectedUnit && this.selectedUnit !== unitObj) {
                this.removeSelectionRing(this.selectedUnit);
            }
            
            // Seleccionar nueva unidad
            this.selectedUnit = unitObj;
            this.createSelectionRing(unitObj);
            
            log(`🎯 Unidad seleccionada: ${unitObj.userData.unitName}`, 'info');
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 🔄 Deseleccionar unidad actual
     */
    deselectUnit() {
        if (this.selectedUnit) {
            this.removeSelectionRing(this.selectedUnit);
            this.selectedUnit = null;
            
            if (document.getElementById('active-unit-info')) {
                document.getElementById('active-unit-info').textContent = 'Ninguna unidad seleccionada';
            }
            
            log('ℹ️ Unidad deseleccionada', 'info');
        }
    }
    
    /**
     * ⭕ Crear anillo de selección
     */
    createSelectionRing(unit) {
        // Remover anillo anterior si existe
        this.removeSelectionRing(unit);
        
        // Crear geometría de anillo
        const ringGeometry = new THREE.RingGeometry(3, 3.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        ring.name = 'selectionRing';
        
        unit.add(ring);
    }
    
    /**
     * ❌ Remover anillo de selección
     */
    removeSelectionRing(unit) {
        const ring = unit.getObjectByName('selectionRing');
        if (ring) {
            unit.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
    }
    
    /**
     * 🔄 Actualizar movimiento de unidades (llamado cada frame)
     */
    updateMovement(delta) {
        // TODO: Implementar sistema de movimiento
        // Por ahora solo un placeholder
        if (this.placedUnits.length > 0) {
            // Actualizar unidades en movimiento
        }
    }
    
    /**
     * 🗺️ Manejar orden de movimiento
     */
    /**
     * 🗺️ Manejar orden de movimiento
     */
    handleMoveOrder(event) {
        if (!this.selectedUnit) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycasting para obtener punto de destino
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const destination = intersects[0].point;

            // Verificar si estamos creando una ruta de waypoints
            if (this.isCreatingWaypoints) {
                // Agregar waypoint a la ruta existente
                this.selectedUnit.userData.waypoints.push(destination);
                log(`📍 Waypoint agregado a ${this.selectedUnit.userData.unitName}`, 'info');

                // Crear marcador visual del waypoint
                this.createWaypointMarker(destination);
            } else {
                // Crear nueva ruta de movimiento
                this.selectedUnit.userData.waypoints = [destination];
                this.selectedUnit.userData.currentWaypointIndex = 0;
                this.selectedUnit.userData.isMoving = true;
                this.selectedUnit.userData.order = 'move';

                log(`🗺️ Orden de movimiento asignada a ${this.selectedUnit.userData.unitName}`, 'info');

                // Crear marcador visual del destino
                this.createWaypointMarker(destination);
            }
        }
    }
    
    /**
     * ⚔️ Manejar orden de ataque
     */
    handleAttackOrder(event) {
        if (!this.selectedUnit) {
            log('⚠️ Selecciona una unidad primero', 'warning');
            return;
        }

        // Calcular coordenadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar unidades objetivo
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObjects(this.placedUnits, true);

        if (intersects.length > 0) {
            let targetUnit = intersects[0].object;

            // Buscar el objeto raíz con userData
            while (targetUnit.parent && !targetUnit.userData.unitType) {
                targetUnit = targetUnit.parent;
            }

            if (targetUnit.userData.unitType && targetUnit !== this.selectedUnit) {
                // Asignar orden de ataque
                this.selectedUnit.userData.order = 'attack';
                this.selectedUnit.userData.target = targetUnit;
                this.selectedUnit.userData.isMoving = false;

                log(`⚔️ ${this.selectedUnit.userData.unitName} atacará a ${targetUnit.userData.unitName}`, 'info');

                // Efecto visual de orden de ataque
                this.createAttackOrderEffect(this.selectedUnit, targetUnit);
            } else {
                log('⚠️ No se puede atacar esa unidad', 'warning');
            }
        } else {
            log('⚠️ Haz click en una unidad enemiga para atacarla', 'warning');
        }
    }
    
    /**
     * 📍 Crear marcador visual de waypoint
     * @param {THREE.Vector3} position - Posición del waypoint
     */
    createWaypointMarker(position) {
        // Crear esfera como marcador
        const geometry = new THREE.SphereGeometry(1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        });

        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        marker.position.y += 2; // Elevar ligeramente
        marker.name = 'waypointMarker';

        this.controller.scene.add(marker);

        // Almacenar referencia para limpieza
        if (!this.waypointMarkers) this.waypointMarkers = [];
        this.waypointMarkers.push(marker);

        // Auto-remover después de un tiempo
        setTimeout(() => {
            if (marker.parent) {
                marker.parent.remove(marker);
                marker.geometry.dispose();
                marker.material.dispose();
            }
            // Remover de la lista
            const index = this.waypointMarkers.indexOf(marker);
            if (index > -1) {
                this.waypointMarkers.splice(index, 1);
            }
        }, 5000); // 5 segundos
    }
    
    /**
     * ⚔️ Crear efecto visual de orden de ataque
     * @param {THREE.Object3D} attacker - Unidad atacante
     * @param {THREE.Object3D} target - Objetivo
     */
    createAttackOrderEffect(attacker, target) {
        // Crear flecha de ataque
        const startPos = attacker.position.clone();
        startPos.y += 5;
        const endPos = target.position.clone();
        endPos.y += 5;

        const direction = endPos.clone().sub(startPos).normalize();
        const length = startPos.distanceTo(endPos);

        // Crear geometría de flecha
        const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.copy(startPos).add(direction.multiplyScalar(length / 2));
        arrow.lookAt(endPos);
        arrow.rotateX(Math.PI / 2);

        this.controller.scene.add(arrow);

        // Remover después de un tiempo
        setTimeout(() => {
            if (arrow.parent) {
                arrow.parent.remove(arrow);
                arrow.geometry.dispose();
                arrow.material.dispose();
            }
        }, 3000);
    }
    
    /**
     * 🌳 Colocar vegetación en terreno
     */
    placeVegetationOnTerrain(x, y) {
        // TODO: Implementar sistema de vegetación
        console.log('🌳 Colocar vegetación');
    }
    
    /**
     * 🗺️ Finalizar ruta de waypoints
     */
    finishWaypointRoute() {
        this.isCreatingWaypoints = false;
        this.currentOrderMode = null;
        log('✅ Ruta de waypoints finalizada', 'success');
   }

    /**
     * 🎯 Colocar unidad en terreno usando código SIDC (método público)
     * @param {string} sidc - Código SIDC de la unidad
     * @param {number} x - Coordenada X del mouse
     * @param {number} y - Coordenada Y del mouse
     * @param {Object} additionalData - Datos adicionales (opcional)
     */
    placeUnitOnTerrainBySIDC(sidc, x, y, additionalData = {}) {
        if (!sidc) {
            log('❌ SIDC requerido para colocar unidad', 'error');
            return;
        }

        // Calcular coordenadas normalizadas del mouse
        const rect = this.controller.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;

        // Raycasting para detectar intersección con terreno
        this.raycaster.setFromCamera(this.mouse, this.controller.camera);
        const intersects = this.raycaster.intersectObject(this.controller.currentTerrain.terrain, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;

            // Verificar colisiones
            if (this.checkCollisionAtPosition(point, 5, sidc)) {
                log('⚠️ Posición ocupada o bloqueada', 'warning');
                return;
            }

            // Cargar y colocar unidad usando SIDC
            this.loadAndPlaceUnitBySIDC(sidc, point, additionalData);
        } else {
            log('⚠️ Click fuera del terreno', 'warning');
        }
    }

    /**
     * 🎯 Cargar y colocar unidad usando SIDC
     * @param {string} sidc - Código SIDC de la unidad
     * @param {THREE.Vector3} position - Posición 3D
     * @param {Object} additionalData - Datos adicionales
     */
    loadAndPlaceUnitBySIDC(sidc, position, additionalData = {}) {
        try {
            // Usar el sistema SIDC para determinar el modelo
            const modelData = this.getModelDataFromSIDC(sidc);

            if (!modelData) {
                log(`❌ No se pudo determinar modelo para SIDC: ${sidc}`, 'error');
                return;
            }

            showLoadingModal(`Cargando ${modelData.name}...`, 10);

            this.gltfLoader.load(
                modelData.path,
                (gltf) => {
                    const model = gltf.scene;

                    // Configurar posición y escala
                    model.position.copy(position);
                    model.position.y += modelData.yOffset;
                    model.scale.setScalar(modelData.scale);

                    // Configurar userData
                    model.userData.unitType = modelData.unitType;
                    model.userData.unitName = modelData.name;
                    model.userData.sidc = sidc;
                    model.userData.maxSpeed = modelData.maxSpeed;
                    model.userData.faction = additionalData.faction || (sidc.charAt(1) === 'F' ? 'friendly' : 'enemy');
                    model.userData.currentHealth = modelData.maxHealth || 100;
                    model.userData.maxHealth = modelData.maxHealth || 100;
                    model.userData.designation = additionalData.designation || modelData.name;

                    // Sistema de órdenes
                    model.userData.order = null;
                    model.userData.waypoints = [];
                    model.userData.isMoving = false;

                    // Agregar a escena y lista
                    this.controller.scene.add(model);
                    this.placedUnits.push(model);

                    hideLoadingModal();
                    log(`✅ ${modelData.name} colocado en terreno (SIDC: ${sidc})`, 'success');
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    updateProgressBar(`Cargando ${modelData.name}...`, percent);
                },
                (error) => {
                    hideLoadingModal();
                    log(`❌ Error cargando modelo: ${error.message}`, 'error');
                    console.error(error);
                }
            );
        } catch (error) {
            log(`❌ Error en loadAndPlaceUnitBySIDC: ${error.message}`, 'error');
            console.error(error);
        }
    }

    /**
     * 🎯 Obtener datos del modelo desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object|null} Datos del modelo
     */
    getModelDataFromSIDC(sidc) {
        if (!sidc || typeof sidc !== 'string') return null;

        const sidcUpper = sidc.toUpperCase();

        // Mapeo SIDC → Modelos basado en la lógica del sistema
        const sidcMappings = {
            // Tanques y vehículos blindados
            'SFGPUCII------': { unitType: 'tank_tam', name: 'Tanque TAM', path: '/backup_gltf_models/gltf_new/tam2c_3d_model/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 70, maxHealth: 100 },
            'SFGPUCII------': { unitType: 'tank_tam_war', name: 'Tanque TAM (War Thunder)', path: '/backup_gltf_models/gltf_new/tam_war_thunder/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 70, maxHealth: 100 },

            // Vehículos de combate de infantería
            'SFGPUCV-------': { unitType: 'm113', name: 'M113 APC', path: '/backup_gltf_models/gltf_new/m113/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 65, maxHealth: 80 },

            // Vehículos logísticos
            'SFGPUCR-------': { unitType: 'ural', name: 'Camión Ural', path: '/backup_gltf_models/gltf_new/ural_4320/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 80, maxHealth: 60 },

            // Vehículos ligeros
            'SFGPUCR-------': { unitType: 'humvee', name: 'Humvee', path: '/backup_gltf_models/gltf_new/humvee/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 90, maxHealth: 40 },

            // Infantería
            'SHGPUCII------': { unitType: 'soldier', name: 'Soldado', path: '/backup_gltf_models/gltf_new/soldier/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 5, maxHealth: 10 },
            'SFGPUCII------': { unitType: 'russian_soldier', name: 'Soldado Ruso', path: '/backup_gltf_models/gltf_new/russian_soldier/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 5, maxHealth: 10 },

            // Estructuras
            'GHGPGPA-------': { unitType: 'tent_military', name: 'Tienda Militar', path: '/backup_gltf_models/gltf_new/tent_military/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 0, maxHealth: 50 },
            'GHGPGPA-------': { unitType: 'medical_tent', name: 'Tienda Médica', path: '/backup_gltf_models/gltf_new/medical_tent/scene.gltf', scale: 1.0, yOffset: 0, maxSpeed: 0, maxHealth: 50 }
        };

        // Buscar coincidencia exacta
        if (sidcMappings[sidcUpper]) {
            return sidcMappings[sidcUpper];
        }

        // Búsqueda por patrones (más flexible)
        for (const [pattern, data] of Object.entries(sidcMappings)) {
            if (sidcUpper.includes(pattern.substring(0, 4))) {
                return { ...data, sidc: sidcUpper };
            }
        }

        // Fallback basado en tipo de unidad
        if (sidcUpper.includes('T') || sidcUpper.includes('TANK')) {
            return sidcMappings['SFGPUCII------'];
        } else if (sidcUpper.includes('W') || sidcUpper.includes('APC')) {
            return sidcMappings['SFGPUCV-------'];
        } else if (sidcUpper.includes('I') || sidcUpper.includes('INF')) {
            return sidcMappings['SHGPUCII------'];
        }

        // Último fallback
        return sidcMappings['SHGPUCII------'];
    }

    /**
     * ⚔️ Verificar colisiones en posición
     * @param {THREE.Vector3} position - Posición a verificar
     * @param {number} radius - Radio de colisión
     * @param {string} sidc - SIDC de la unidad a colocar
     * @returns {boolean} true si hay colisión
     */
    checkCollisionAtPosition(position, radius, sidc) {
        for (const unit of this.placedUnits) {
            const distance = position.distanceTo(unit.position);
            if (distance < radius) {
                return true;
            }
        }
        return false;
    }

    /**
     * 🎯 Integrar con sistema de órdenes 2D
     * @param {string} unitId - ID de la unidad
     * @param {Object} order - Orden del sistema 2D
     */
    receiveOrderFrom2D(unitId, order) {
        // Buscar unidad por ID
        const unit = this.placedUnits.find(u => u.userData.id === unitId);
        if (!unit) {
            log(`⚠️ Unidad ${unitId} no encontrada en 3D`, 'warning');
            return;
        }

        // Procesar orden según tipo
        switch (order.type) {
            case 'move': this.handleMoveOrder3D(unit, order); break;
            case 'attack': this.handleAttackOrder3D(unit, order); break;
            case 'defend': this.handleDefendOrder3D(unit, order); break;
            default: log(`⚠️ Tipo de orden no soportado: ${order.type}`, 'warning');
        }
    }

    /**
     * 🗺️ Manejar orden de movimiento en 3D
     * @param {THREE.Object3D} unit - Unidad 3D
     * @param {Object} order - Datos de la orden
     */
    handleMoveOrder3D(unit, order) {
        if (!order.waypoints || order.waypoints.length === 0) return;

        // Convertir waypoints 2D a posiciones 3D
        const waypoints3D = order.waypoints.map(wp => {
            if (wp.lat && wp.lng) {
                return this.latLngToPosition3D(wp.lat, wp.lng);
            }
            return new THREE.Vector3(wp.x, wp.y, wp.z);
        });

        // Asignar waypoints a la unidad
        unit.userData.waypoints = waypoints3D;
        unit.userData.currentWaypointIndex = 0;
        unit.userData.isMoving = true;
        unit.userData.order = 'move';
    }

    /**
     * ⚔️ Manejar orden de ataque en 3D
     * @param {THREE.Object3D} unit - Unidad 3D
     * @param {Object} order - Datos de la orden
     */
    handleAttackOrder3D(unit, order) {
        if (!order.targetId) return;

        // Buscar unidad objetivo
        const target = this.placedUnits.find(u => u.userData.id === order.targetId);
        if (!target) {
            log(`⚠️ Objetivo ${order.targetId} no encontrado`, 'warning');
            return;
        }

        // Asignar orden de ataque
        unit.userData.order = 'attack';
        unit.userData.target = target;
        unit.userData.isMoving = false;
    }

    /**
     * 🛡️ Manejar orden de defensa en 3D
     * @param {THREE.Object3D} unit - Unidad 3D
     * @param {Object} order - Datos de la orden
     */
    handleDefendOrder3D(unit, order) {
        unit.userData.order = 'defend';
        unit.userData.defendPosition = unit.position.clone();
        unit.userData.isMoving = false;
    }

    /**
     * 🌍 Convertir coordenadas lat/lng a posición 3D
     * @param {number} lat - Latitud
     * @param {number} lng - Longitud
     * @returns {THREE.Vector3} Posición 3D
     */
    latLngToPosition3D(lat, lng) {
        const centerLat = this.centerLat || 0;
        const centerLng = this.centerLng || 0;

        const x = (lng - centerLng) * 111320;
        const z = (lat - centerLat) * 111320;
        const y = this.getTerrainHeightAt(x, z);

        return new THREE.Vector3(x, y, z);
    }

    /**
     * 🏔️ Obtener altura del terreno en posición
     * @param {number} x - Coordenada X
     * @param {number} z - Coordenada Z
     * @returns {number} Altura del terreno
     */
    getTerrainHeightAt(x, z) {
        if (!this.controller || !this.controller.currentTerrain) return 0;
        return Math.sin(x * 0.002) * Math.cos(z * 0.002) * 50 * 0.002;
    }

    /**
     * 🎯 Colocar unidad usando SIDC
     * @param {string} sidc - Código SIDC
     * @param {THREE.Vector3} position - Posición 3D
     * @param {Object} additionalData - Datos adicionales
     */
    placeUnitBySIDC(sidc, position, additionalData = {}) {
        try {
            // Usar el sistema SIDC para determinar el modelo
            const modelData = this.sidcMapper ? this.sidcMapper.getModelForSIDC(sidc) : null;

            if (!modelData) {
                log(`❌ No se pudo determinar modelo para SIDC: ${sidc}`, 'error');
                return;
            }

            showLoadingModal(`Cargando ${modelData.name}...`, 10);

            this.gltfLoader.load(
                modelData.path,
                (gltf) => {
                    const model = gltf.scene;

                    // Configurar posición y escala
                    model.position.copy(position);
                    model.position.y += modelData.yOffset || 0;
                    model.scale.setScalar(modelData.scale || 1.0);

                    // Configurar userData
                    model.userData.unitType = modelData.unitType;
                    model.userData.unitName = modelData.name;
                    model.userData.sidc = sidc;
                    model.userData.maxSpeed = modelData.maxSpeed || 10;
                    model.userData.faction = additionalData.faction || (sidc.charAt(1) === 'F' ? 'friendly' : 'enemy');
                    model.userData.currentHealth = modelData.maxHealth || 100;
                    model.userData.maxHealth = modelData.maxHealth || 100;
                    model.userData.designation = additionalData.designation || modelData.name;

                    // Sistema de órdenes
                    model.userData.order = null;
                    model.userData.waypoints = [];
                    model.userData.isMoving = false;

                    // Agregar a escena y lista
                    this.controller.scene.add(model);
                    this.placedUnits.push(model);

                    hideLoadingModal();
                    log(`✅ ${modelData.name} colocado en terreno (SIDC: ${sidc})`, 'success');
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    updateProgressBar(`Cargando ${modelData.name}...`, percent);
                },
                (error) => {
                    hideLoadingModal();
                    log(`❌ Error cargando modelo: ${error.message}`, 'error');
                    console.error(error);
                }
            );
        } catch (error) {
            log(`❌ Error en placeUnitBySIDC: ${error.message}`, 'error');
            console.error(error);
        }
    }
};
