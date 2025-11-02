/**
 * 🚀 terrain3d-init.js
 * =======================
 * Inicialización del sistema de terreno 3D modular.
 * 
 * Este archivo coordina la carga y arranque de todos los módulos.
 */

// Variable global del controlador
let terrainController = null;

/**
 * 🎬 Inicializar sistema completo
 */
async function inicializarSistema() {
    try {
        log('🚀 Iniciando sistema de terreno 3D...', 'info');
        
        // ✅ Exponer funciones temporales mientras se inicializa
        exposeTemporaryFunctions();
        
        // ✅ Verificar que Leaflet (L) esté disponible
        if (typeof L === 'undefined') {
            log('⏳ Esperando a que Leaflet se cargue...', 'info');
            await waitForLeaflet();
        }
        
        // Crear controlador principal
        terrainController = new TerrainController3D();
        
        // Inicializar todos los subsistemas
        await terrainController.init();
        
        log('✅ Sistema inicializado correctamente', 'success');
        
        // Exponer globalmente para acceso desde HTML
        window.terrainController = terrainController;
        
        // Exponer map para compatibilidad con botones onclick
        window.map = terrainController.map;
        
        // Exponer funciones para botones onclick
        exposeGlobalFunctions();
        
    } catch (error) {
        log(`❌ Error fatal inicializando sistema: ${error.message}`, 'error');
        console.error(error);
    }
}

/**
 * 🔧 Exponer funciones temporales para evitar errores de undefined
 */
function exposeTemporaryFunctions() {
    window.createFullView3D = () => {
        log('⏳ Sistema aún inicializando, espera un momento...', 'warning');
    };
    window.clearAll = () => {
        log('⏳ Sistema aún inicializando, espera un momento...', 'warning');
    };
}

/**
 * ⏳ Esperar a que Leaflet esté disponible
 */
function waitForLeaflet() {
    return new Promise((resolve) => {
        const checkLeaflet = () => {
            if (typeof L !== 'undefined') {
                log('✅ Leaflet detectado', 'success');
                resolve();
            } else {
                setTimeout(checkLeaflet, 100);
            }
        };
        checkLeaflet();
    });
}

/**
 * 🌐 Exponer funciones globalmente para compatibilidad con HTML
 */
function exposeGlobalFunctions() {
    // Funciones de map
    window.captureMap = () => terrainController.captureMap();
    window.captureTiles = () => terrainController.captureTiles();
    window.analyzeMap = () => terrainController.analyzeMap();
    window.generateTerrain = (autoFullscreen) => terrainController.generateTerrain(autoFullscreen);
    
    // Aliases para compatibilidad
    window.captureMapImage = () => terrainController.captureMap();
    window.analyzeImageColors = () => terrainController.analyzeMap();
    
    // Funciones de UI
    window.toggleFullscreen3D = () => terrainController.toggleFullscreen3D();
    
    // Función de vista 3D completa (workflow automatizado - BATCH OPTIMIZADO)
    window.createFullView3D = async () => {
        try {
            console.log('🚀 [WORKFLOW] Iniciando workflow completo (modo optimizado)...');
            console.time('⏱️ Tiempo total workflow');
            
            console.log('📸 [WORKFLOW] PASO 1/4: Capturando mapa...');
            console.time('⏱️ Captura mapa');
            await terrainController.captureMap();
            console.timeEnd('⏱️ Captura mapa');
            console.log('✅ [WORKFLOW] Mapa capturado');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('🔍 [WORKFLOW] PASO 2/4: Analizando imagen...');
            console.time('⏱️ Análisis imagen');
            await terrainController.analyzeMap();
            console.timeEnd('⏱️ Análisis imagen');
            console.log('✅ [WORKFLOW] Imagen analizada');
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('🏗️ [WORKFLOW] PASO 3/4: Generando terreno 3D (con TIF y vegetación)...');
            console.time('⏱️ Generación terreno');
            await terrainController.generateTerrain(true);
            console.timeEnd('⏱️ Generación terreno');
            console.log('✅ [WORKFLOW] Terreno generado');
            
            console.timeEnd('⏱️ Tiempo total workflow');
            console.log('✅ [WORKFLOW] Workflow completo finalizado');
            
        } catch (error) {
            console.error('❌ [WORKFLOW] Error en workflow:', error);
            console.trace();
            log(`❌ Error en workflow: ${error.message}`, 'error');
        }
    };
    
    // Función de limpiar
    window.clearAll = () => {
        if (confirm('¿Estás seguro de limpiar todo el terreno 3D?')) {
            if (terrainController.currentTerrain) {
                terrainController.scene.remove(terrainController.currentTerrain.terrain);
                terrainController.currentTerrain = null;
            }
            if (terrainController.unitManager) {
                terrainController.unitManager.placedUnits.forEach(unit => {
                    terrainController.scene.remove(unit);
                });
                terrainController.unitManager.placedUnits = [];
            }
            log('🗑️ Todo limpiado', 'success');
        }
    };
    
    // Funciones de unidades
    window.selectUnitType = (type) => {
        if (terrainController.unitManager) {
            terrainController.unitManager.selectUnitType(type);
        }
    };
    
    window.deleteSelectedUnit = () => {
        if (terrainController.unitManager && terrainController.unitManager.selectedUnit) {
            const unit = terrainController.unitManager.selectedUnit;
            terrainController.scene.remove(unit);
            const index = terrainController.unitManager.placedUnits.indexOf(unit);
            if (index > -1) {
                terrainController.unitManager.placedUnits.splice(index, 1);
            }
            terrainController.unitManager.selectedUnit = null;
            log('🗑️ Unidad eliminada', 'success');
        }
    };
    
    // Funciones de órdenes (placeholders)
    window.setOrderMode = (mode) => {
        if (terrainController.unitManager) {
            terrainController.unitManager.currentOrderMode = mode;
            document.getElementById('order-mode').textContent = `Modo: ${mode.toUpperCase()}`;
            log(`🎯 Modo cambiado a: ${mode}`, 'info');
        }
    };
    
    window.toggleVisibilityCircle = () => {
        log('👁️ Círculo de visibilidad no implementado aún', 'warning');
    };
    
    window.loadCustomModel = (event) => {
        log('📦 Carga de modelos personalizados no implementada aún', 'warning');
    };
    
    // Funciones de vegetación
    window.selectVegetationType = (type) => {
        if (terrainController.unitManager) {
            terrainController.unitManager.currentVegetationType = type;
            document.getElementById('selected-veg-type').textContent = 
                terrainController.unitManager.vegetationModels[type]?.name || 'Ninguna';
            log(`🌳 Vegetación seleccionada: ${type}`, 'info');
        }
    };
    
    // Funciones de turnos (placeholders)
    window.endTurn = () => {
        log('⏭️ Sistema de turnos no implementado aún', 'warning');
    };
    
    window.switchPlayer = () => {
        log('🔄 Cambio de jugador no implementado aún', 'warning');
    };
    
    // Funciones de debug
    window.showCapturedImage = () => {
        const img = document.getElementById('map-preview');
        if (img && img.src) {
            createImagePreviewModal(img.src);
        } else {
            log('⚠️ No hay imagen capturada', 'warning');
        }
    };
    
    window.showDebugCanvas = () => {
        log('🎨 Canvas de debug no implementado aún', 'warning');
    };
    
    // Función de prueba de vegetación
    window.testVegetationType = function(type) {
        console.log(`🧪 Filtrando vegetación tipo: ${type}`);
        
        if (!window.terrainGenerator || !window.terrainGenerator.vegetationObjects) {
            alert('⚠️ Primero genera el terreno 3D');
            return;
        }
        
        const vegetation = window.terrainGenerator.vegetationObjects;
        let visibleCount = 0;
        let hiddenCount = 0;
        
        vegetation.forEach(mesh => {
            if (type === 'all') {
                mesh.visible = true;
                visibleCount++;
            } else {
                const meshType = mesh.userData?.vegetationType || 'unknown';
                
                if (meshType === type) {
                    mesh.visible = true;
                    visibleCount++;
                } else {
                    mesh.visible = false;
                    hiddenCount++;
                }
            }
        });
        
        const typeNames = {
            'tree_tall': '🌲 ÁRBOLES (arbol.glb)',
            'tree_medium': '🌳 ÁRBOLES LOW POLY (trees_low.glb)',
            'tree_oak': '🌲 OAK ANIMADO (AnimatedOak.glb)',
            'bush': '🌿 ARBUSTOS (arbusto.glb)',
            'grass': '🌾 PASTO (simple_grass_chunks.glb)',
            'all': '🌍 TODOS'
        };
        
        const activeTypeEl = document.getElementById('active-type');
        if (activeTypeEl) {
            activeTypeEl.textContent = typeNames[type] || type.toUpperCase();
        }
        
        console.log(`✅ Visibles: ${visibleCount}, Ocultos: ${hiddenCount}`);
    };
    
    log('✅ Funciones globales expuestas', 'info');
}

/**
 * 🎯 Event listeners globales
 */
function setupGlobalEventListeners() {
    // Resize handler
    window.addEventListener('resize', () => {
        if (terrainController && terrainController.terrainRenderer) {
            terrainController.terrainRenderer.handleResize();
        }
    });
}

// 🚀 NO auto-inicializar - esperar interacción del usuario
window.addEventListener('load', () => {
    log('🌍 MAIRA Terrain 3D cargado', 'info');
    
    // ✅ Solo exponer funciones temporales, NO inicializar sistema
    exposeTemporaryFunctions();
    setupGlobalEventListeners();
    
    log('✅ Sistema 3D listo - esperando clic en "Generar Vista 3D"', 'info');
});

// 🌐 Exponer globalmente
window.terrainController = null;
window.inicializarSistema = inicializarSistema;
