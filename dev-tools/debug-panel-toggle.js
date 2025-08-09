// 🛠️ @debugger - Fix para el problema de toggle del panel
// Ejecuta esto en la consola del navegador para probar:

function debugTogglePanel() {
    const panel = document.getElementById('panel-lateral');
    
    console.log('🔍 Estado actual del panel:');
    console.log('- Elemento encontrado:', !!panel);
    console.log('- Clases:', panel ? Array.from(panel.classList) : 'NO ENCONTRADO');
    console.log('- Tiene clase "oculto":', panel ? panel.classList.contains('oculto') : false);
    console.log('- Style display:', panel ? panel.style.display : 'NO ENCONTRADO');
    console.log('- Computed transform:', panel ? getComputedStyle(panel).transform : 'NO ENCONTRADO');
    console.log('- Posición en pantalla:', panel ? panel.getBoundingClientRect() : 'NO ENCONTRADO');
    
    if (panel) {
        const isHidden = panel.classList.contains('oculto');
        console.log(`\n🔄 Aplicando toggle - Panel está ${isHidden ? 'OCULTO' : 'VISIBLE'}`);
        
        if (isHidden) {
            panel.classList.remove('oculto');
            console.log('✅ Removida clase "oculto" - Panel debería mostrarse');
        } else {
            panel.classList.add('oculto');
            console.log('✅ Agregada clase "oculto" - Panel debería ocultarse');
        }
        
        // Verificar después del cambio
        setTimeout(() => {
            console.log('🔍 Estado después del toggle:');
            console.log('- Clases:', Array.from(panel.classList));
            console.log('- Transform:', getComputedStyle(panel).transform);
        }, 100);
    }
}

// Para usar: debugTogglePanel()
