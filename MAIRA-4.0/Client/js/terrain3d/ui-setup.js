/**
 * 🎛️ ui-setup.js
 * ==================
 * Configuración de controles UI (sliders, checkboxes, etc.)
 */

// Setup de sliders y sus displays
function setupUIControls() {
    // LOD slider
    const lodSlider = document.getElementById('lod');
    const lodValue = document.getElementById('lod-value');
    if (lodSlider && lodValue) {
        lodSlider.addEventListener('input', (e) => {
            lodValue.textContent = e.target.value;
        });
    }
    
    // Resolution slider
    const resSlider = document.getElementById('resolution');
    const resValue = document.getElementById('resolution-value');
    if (resSlider && resValue) {
        resSlider.addEventListener('input', (e) => {
            resValue.textContent = e.target.value;
        });
    }
    
    // Vertical Scale slider
    const vScaleSlider = document.getElementById('verticalScale');
    const vScaleValue = document.getElementById('verticalScale-value');
    if (vScaleSlider && vScaleValue) {
        vScaleSlider.addEventListener('input', (e) => {
            vScaleValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
    }
    
    // Terrain Size slider
    const sizeSlider = document.getElementById('terrainSize');
    const sizeValue = document.getElementById('terrainSize-value');
    if (sizeSlider && sizeValue) {
        sizeSlider.addEventListener('input', (e) => {
            sizeValue.textContent = e.target.value;
        });
    }
    
    // Vegetation Density slider
    const vegDensitySlider = document.getElementById('vegetationDensity');
    const vegDensityValue = document.getElementById('vegetationDensity-value');
    if (vegDensitySlider && vegDensityValue) {
        vegDensitySlider.addEventListener('input', (e) => {
            const percent = Math.round(parseFloat(e.target.value) * 100);
            vegDensityValue.textContent = percent;
        });
    }
    
    // TIF checkbox
    const tifCheckbox = document.getElementById('useTIF');
    const tifStatus = document.getElementById('tif-status');
    if (tifCheckbox && tifStatus) {
        tifCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                tifStatus.textContent = 'Usar archivos TIF para elevación real';
                tifStatus.style.color = '#4ade80';
            } else {
                tifStatus.textContent = 'Usando elevación procedural (más rápido)';
                tifStatus.style.color = '#fbbf24';
            }
        });
    }
    
    console.log('✅ Controles UI configurados');
}

// Configurar navegación del map
function setupMapNavigation() {
    // Esta función será llamada después de que el map se inicialice
    // Los botones de ubicación ya tienen onclick inline
    console.log('✅ Navegación de map lista');
}

// Exponer globalmente
window.setupUIControls = setupUIControls;
window.setupMapNavigation = setupMapNavigation;

// Auto-ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUIControls);
} else {
    setupUIControls();
}
