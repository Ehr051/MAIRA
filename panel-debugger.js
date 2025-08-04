// 🤖 @debugger - Script de debugging visual para panel toggle
// Ejecutar en la consola del navegador para diagnosticar el problema

console.log('🔍 @debugger - Iniciando diagnóstico visual del panel');

function debugPanel() {
    const panel = document.getElementById('panel-lateral');
    const toggleBtn = document.getElementById('toggle-panel-btn');
    const cerrarBtn = document.getElementById('cerrar-panel');
    
    console.log('📋 Estado de elementos:');
    console.log('  Panel:', panel ? '✅ Encontrado' : '❌ No encontrado');
    console.log('  Botón toggle:', toggleBtn ? '✅ Encontrado' : '❌ No encontrado');
    console.log('  Botón cerrar:', cerrarBtn ? '✅ Encontrado' : '❌ No encontrado');
    
    if (panel) {
        const rect = panel.getBoundingClientRect();
        const styles = window.getComputedStyle(panel);
        
        console.log('📐 Dimensiones del panel:');
        console.log('  Width:', rect.width + 'px');
        console.log('  Height:', rect.height + 'px');
        console.log('  Top:', rect.top + 'px');
        console.log('  Right:', rect.right + 'px');
        console.log('  Left:', rect.left + 'px');
        
        console.log('🎨 Estilos CSS aplicados:');
        console.log('  Position:', styles.position);
        console.log('  Transform:', styles.transform);
        console.log('  Right:', styles.right);
        console.log('  Z-index:', styles.zIndex);
        console.log('  Display:', styles.display);
        console.log('  Visibility:', styles.visibility);
        
        console.log('📝 Clases CSS:');
        console.log('  Lista de clases:', Array.from(panel.classList));
        console.log('  Tiene "oculto":', panel.classList.contains('oculto'));
        
        // Verificar si está visible en viewport
        const isVisible = rect.right > 0 && rect.left < window.innerWidth;
        console.log('👁️ Panel visible en viewport:', isVisible);
        
        // Resaltar el panel temporalmente
        panel.style.border = '5px solid red';
        panel.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        setTimeout(() => {
            panel.style.border = '';
            panel.style.backgroundColor = '';
        }, 3000);
        
        return {
            elemento: panel,
            dimensiones: rect,
            estilos: {
                position: styles.position,
                transform: styles.transform,
                right: styles.right,
                zIndex: styles.zIndex
            },
            clases: Array.from(panel.classList),
            tieneOculto: panel.classList.contains('oculto'),
            visibleEnViewport: isVisible
        };
    }
    
    return null;
}

// Función para testear el toggle manualmente
function testToggle() {
    console.log('🧪 Testeando toggle manual...');
    const panel = document.getElementById('panel-lateral');
    
    if (panel) {
        const estabOculto = panel.classList.contains('oculto');
        console.log('Estado actual:', estabOculto ? 'OCULTO' : 'VISIBLE');
        
        if (estabOculto) {
            panel.classList.remove('oculto');
            console.log('➡️ Panel MOSTRADO');
        } else {
            panel.classList.add('oculto');
            console.log('⬅️ Panel OCULTADO');
        }
        
        // Mostrar nuevo estado
        setTimeout(() => {
            const rect = panel.getBoundingClientRect();
            console.log('Nueva posición:', rect.left, rect.right);
        }, 500);
    }
}

// Función para verificar CSS
function verificarCSS() {
    console.log('🎨 Verificando reglas CSS para .panel-lateral.oculto');
    
    const stylesheets = Array.from(document.styleSheets);
    let reglasEncontradas = [];
    
    stylesheets.forEach((sheet, index) => {
        try {
            const rules = Array.from(sheet.cssRules || sheet.rules || []);
            rules.forEach(rule => {
                if (rule.selectorText && rule.selectorText.includes('.panel-lateral.oculto')) {
                    reglasEncontradas.push({
                        hoja: index,
                        selector: rule.selectorText,
                        estilos: rule.style.cssText
                    });
                }
            });
        } catch (e) {
            console.log('No se puede acceder a la hoja de estilos:', index);
        }
    });
    
    console.log('📋 Reglas CSS encontradas:', reglasEncontradas);
    return reglasEncontradas;
}

// Ejecutar diagnóstico
const diagnostico = debugPanel();
const reglasCSS = verificarCSS();

console.log('🎯 RESUMEN DEL DIAGNÓSTICO:');
console.log('========================');
if (diagnostico) {
    console.log('✅ Panel encontrado');
    console.log('📍 Posición:', diagnostico.visibleEnViewport ? 'VISIBLE' : 'FUERA DE VISTA');
    console.log('🏷️ Estado:', diagnostico.tieneOculto ? 'OCULTO' : 'VISIBLE');
    console.log('🎨 Transform:', diagnostico.estilos.transform);
} else {
    console.log('❌ Panel no encontrado');
}

console.log('📊 Reglas CSS:', reglasCSS.length > 0 ? 'ENCONTRADAS' : 'NO ENCONTRADAS');

// Exponer funciones para testing manual
window.debugPanel = debugPanel;
window.testToggle = testToggle;
window.verificarCSS = verificarCSS;

console.log('🔧 Funciones disponibles:');
console.log('  debugPanel() - Diagnosticar panel');
console.log('  testToggle() - Probar toggle manual');
console.log('  verificarCSS() - Verificar reglas CSS');
