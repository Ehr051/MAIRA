# 🏗️ INTEGRACIÓN TERRENO 3D - FASE 1

**Fecha**: 17 octubre 2025  
**Objetivo**: Integrar SOLO generación de terreno 3D desde map en planeamiento_integrado.html

---

## 📋 CONTEXTO

### Sistema de Prueba (test-terrain-from-map-OPTIMIZADO.html)
✅ Sistema aislado para desarrollo sin romper producción  
✅ Genera terreno 3D desde captura de map Leaflet  
✅ Workflow: Captura → Análisis → Generación → Fullscreen  
✅ Modal simple con barra de progreso  

### Sistema de Producción (planeamiento_integrado.html)
⚠️ Actualmente llama a `maira3DMaster.js` (sistema de batalla)  
⚠️ Necesita integrar TerrainGenerator3D.js (generación terreno)  
⚠️ Botón: `#btnVista3D` (línea 360)  

---

## 🎯 FASES DE INTEGRACIÓN

### FASE 1: Terreno 3D (ACTUAL)
- Copiar sistema de generación desde test-terrain
- Modal de carga simple
- Funciones: createFullView3D(), captureMap(), analyzeMap(), generateTerrain()
- Fullscreen con terreno generado
- NO incluir SIDC ni MCC todavía

### FASE 2: SIDC + MCC para Planeamiento (FUTURA)
- Bridge SIDC → Sprites 2D flotantes en 3D
- Bridge MCC → Líneas/polígonos 3D
- NO modelos 3D, solo símbolos 2D en espacio 3D

### FASE 3: Modelos 3D para Juego de Guerra (FUTURA)
- Bridge SIDC → Modelos 3D (tanques, infantería)
- GLTFLoader y catálogo de modelos
- Animaciones
- Sistema separado del planeamiento

---

## 📦 COMPONENTES A COPIAR

### 1. Modal HTML (test-terrain líneas 299-312)
```html
<div id="loading-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px); z-index: 10000; display: flex; justify-content: center; align-items: center;">
    <div style="background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); padding: 40px 60px; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); text-align: center; max-width: 500px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🏗️</div>
        <h2 style="color: #4fd1c5; margin: 0 0 20px 0; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 24px; font-weight: 600;">CREANDO VISTA 3D</h2>
        <p id="loading-step" style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 16px; min-height: 24px;">Iniciando...</p>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
            <div id="loading-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4fd1c5 0%, #667eea 100%); transition: width 0.3s ease; border-radius: 4px;"></div>
        </div>
        <div id="loading-percentage" style="color: #a0aec0; font-size: 14px; font-family: 'Courier New', monospace;">0%</div>
    </div>
</div>
```

### 2. Funciones Auxiliares (test-terrain líneas 784-820)
```javascript
// === MODAL DE CARGA ===
function showLoadingModal(step = 'Iniciando...', progress = 0) {
    const modal = document.getElementById('loading-modal');
    const stepEl = document.getElementById('loading-step');
    const progressBar = document.getElementById('loading-progress-bar');
    const percentage = document.getElementById('loading-percentage');
    
    modal.style.display = 'flex';
    stepEl.textContent = step;
    progressBar.style.width = `${progress}%`;
    percentage.textContent = `${Math.round(progress)}%`;
}

function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    modal.style.display = 'none';
}

function updateProgressBar(message, progress) {
    showLoadingModal(message, progress);
    console.log(`📊 Progress: ${message} (${Math.round(progress)}%)`);
}

function hideProgressBar() {
    hideLoadingModal();
}
```

### 3. Función Principal (test-terrain líneas 1892-1970)
```javascript
async function createFullView3D() {
    try {
        showLoadingModal('Iniciando creación de vista 3D...', 0);
        
        console.log('🚀 Iniciando creación automática de vista 3D...');
        
        // Paso 1: Capturar map
        showLoadingModal('📸 Capturando imagen satelital...', 10);
        console.log('📸 Paso 1/3: Capturando map...');
        await captureMap();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!satelliteAnalyzer || !satelliteAnalyzer.canvas) {
            hideLoadingModal();
            console.error('❌ Error: No se pudo capturar el map');
            return;
        }
        
        // Paso 2: Analizar imagen
        showLoadingModal('🔍 Analizando imagen satelital...', 35);
        console.log('🔍 Paso 2/3: Analizando imagen...');
        await analyzeMap();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!satelliteAnalyzer.features || !satelliteAnalyzer.features.vegetation) {
            hideLoadingModal();
            console.error('❌ Error: No se pudo analizar la imagen');
            return;
        }
        
        // Paso 3: Generar terreno 3D
        showLoadingModal('🏗️ Generando terreno 3D...', 50);
        console.log('🏗️ Paso 3/3: Generando terreno 3D...');
        await generateTerrain(false); // false = no auto-activar fullscreen
        
        if (!currentTerrain || !currentTerrain.terrain) {
            hideLoadingModal();
            hideProgressBar();
            console.error('❌ Error: No se pudo generar el terreno');
            return;
        }
        
        console.log('✅ Vista 3D creada exitosamente!');
        
        showLoadingModal('¡Vista 3D completada! ✅', 100);
        
        setTimeout(() => {
            hideLoadingModal();
            hideProgressBar();
            
            setTimeout(() => {
                activateFullscreen3D();
                console.log('💡 Vista 3D lista. Próxima fase: SIDC + MCC');
            }, 100);
        }, 1500);
        
    } catch (error) {
        hideLoadingModal();
        console.error(`❌ Error en creación: ${error.message}`);
    }
}
```

### 4. Fullscreen (test-terrain líneas 1975-2020)
```javascript
function activateFullscreen3D() {
    const mainContainer = document.getElementById('main-container');
    const closeButton = document.getElementById('close-3d-button');
    
    mainContainer.classList.add('fullscreen-3d');
    closeButton.style.display = 'block';
    
    if (renderer && camera) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    
    console.log('🖥️ Modo fullscreen 3D activado');
}

function closeFullscreen3D() {
    const mainContainer = document.getElementById('main-container');
    const closeButton = document.getElementById('close-3d-button');
    
    mainContainer.classList.remove('fullscreen-3d');
    closeButton.style.display = 'none';
    
    // Limpiar terreno y liberar memoria
    if (currentTerrain) clearTerrain();
    
    if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement = null;
        renderer = null;
    }
    
    if (scene) {
        scene.traverse(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        scene.clear();
        scene = null;
    }
    
    camera = null;
    controls = null;
    currentTerrain = null;
    
    console.log('🧹 Vista 3D cerrada y memoria liberada');
}
```

---

## 🔧 MODIFICACIONES NECESARIAS

### 1. Agregar scripts (después de línea 53)
```html
<!-- 🏗️ TERRENO 3D - FASE 1 -->
<script src="https://unpkg.com/leaflet-image@0.4.0/leaflet-image.js"></script>
<script src="Client/js/services/TerrainGenerator3D.js"></script>
<script src="Client/js/handlers/elevationHandler.js"></script>
<script src="Client/js/handlers/vegetacionhandler.js"></script>
<script src="Client/js/services/GeospatialDataService.js"></script>
<script src="Client/js/services/ElevationService.js"></script>
```

### 2. Agregar modal antes de </body>
Copiar HTML del punto 1

### 3. Modificar botón (línea 1170-1195)
```javascript
// ANTES (INCORRECTO):
btnVista3D.addEventListener('click', function(e) {
    window.maira3DSystem.activarVista3DConModal(); // ❌ Sistema equivocado
});

// DESPUÉS (CORRECTO):
btnVista3D.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (!window.THREE) {
        alert('⚠️ THREE.js no cargado. Recarga la página.');
        return;
    }
    
    // ✅ Llamar al sistema correcto
    await createFullView3D();
    
    // Actualizar texto del botón
    setTimeout(() => {
        btnVista3D.innerHTML = '<i class="fas fa-cube"></i> Cerrar Vista 3D';
    }, 2500);
});
```

### 4. Agregar funciones antes de </script> final
Copiar funciones de puntos 2, 3 y 4

### 5. CSS Fullscreen
```css
.fullscreen-3d #canvas-container {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999 !important;
}

.fullscreen-3d #sidebar,
.fullscreen-3d #map-container {
    display: none !important;
}

#close-3d-button {
    display: none;
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    background: rgba(220, 38, 38, 0.9);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}
```

---

## ✅ CHECKLIST

- [ ] Agregar scripts de dependencias
- [ ] Agregar modal HTML
- [ ] Agregar funciones auxiliares
- [ ] Agregar createFullView3D()
- [ ] Agregar fullscreen functions
- [ ] Modificar evento botón
- [ ] Agregar CSS fullscreen
- [ ] Probar workflow completo

---

## 🚀 PRÓXIMOS PASOS (FASE 2)

1. ✅ FASE 1 completada: Terreno 3D funcional
2. ⏳ Bridge SIDC → THREE.Sprite (símbolos 2D flotantes)
3. ⏳ Bridge MCC → THREE.Line/Shape (líneas y polígonos)
4. ⏳ Sistema de actualización en tiempo real
5. ⏳ FASE 3 (juego guerra): Modelos 3D de unidades

---

## 📝 NOTAS IMPORTANTES

- ⚠️ NO modificar maira3DMaster.js (es sistema de batalla)
- ⚠️ NO crear modal3DConfiguration.js (innecesario)
- ⚠️ NO crear loadingScreen3D.js (innecesario)
- ✅ USAR código existente de test-terrain (ya funciona)
- ✅ Mantener sistema simple y directo
- ✅ Un archivo, una funcionalidad
