// 🔍 @debugger - Script de debugging para Panel Toggle MAIRA

console.log('🚀 INICIANDO DEBUGGING DEL PANEL TOGGLE');

// 1. Verificar existencia de elementos
function debugElementos() {
    console.log('\n📋 VERIFICANDO ELEMENTOS:');
    console.log('=========================');
    
    const panel = document.getElementById('panel-lateral');
    const botonFlotante = document.getElementById('toggle-panel-btn');
    const botonCerrar = document.getElementById('cerrar-panel');
    
    console.log('Panel lateral:', panel ? '✅ EXISTE' : '❌ NO EXISTE');
    console.log('Botón flotante:', botonFlotante ? '✅ EXISTE' : '❌ NO EXISTE');
    console.log('Botón cerrar:', botonCerrar ? '✅ EXISTE' : '❌ NO EXISTE');
    
    if (panel) {
        console.log('📊 Estado del panel:');
        console.log('  - Classes:', Array.from(panel.classList));
        console.log('  - Está oculto:', panel.classList.contains('oculto'));
        console.log('  - Display:', getComputedStyle(panel).display);
        console.log('  - Transform:', getComputedStyle(panel).transform);
        console.log('  - Visibility:', getComputedStyle(panel).visibility);
    }
    
    return { panel, botonFlotante, botonCerrar };
}

// 2. Verificar eventos
function debugEventos() {
    console.log('\n🎯 VERIFICANDO EVENTOS:');
    console.log('=======================');
    
    const elementos = debugElementos();
    
    if (elementos.botonCerrar) {
        // Crear un test event listener temporalmente
        const testHandler = (e) => {
            console.log('🔴 EVENTO CERRAR DETECTADO:', e);
            e.preventDefault();
            e.stopPropagation();
        };
        
        elementos.botonCerrar.addEventListener('click', testHandler);
        console.log('✅ Test handler agregado al botón cerrar');
        
        // Removerlo después de 10 segundos
        setTimeout(() => {
            elementos.botonCerrar.removeEventListener('click', testHandler);
            console.log('🗑️ Test handler removido');
        }, 10000);
    }
    
    if (elementos.botonFlotante) {
        const testHandler2 = (e) => {
            console.log('🔵 EVENTO FLOTANTE DETECTADO:', e);
            e.preventDefault();
            e.stopPropagation();
        };
        
        elementos.botonFlotante.addEventListener('click', testHandler2);
        console.log('✅ Test handler agregado al botón flotante');
        
        setTimeout(() => {
            elementos.botonFlotante.removeEventListener('click', testHandler2);
            console.log('🗑️ Test handler removido');
        }, 10000);
    }
}

// 3. Test manual del toggle
function testToggleManual() {
    console.log('\n⚡ TEST MANUAL DEL TOGGLE:');
    console.log('==========================');
    
    const panel = document.getElementById('panel-lateral');
    if (!panel) {
        console.error('❌ Panel no encontrado');
        return;
    }
    
    const estadoInicial = panel.classList.contains('oculto');
    console.log('📊 Estado inicial - Oculto:', estadoInicial);
    
    // Test 1: Toggle directo
    if (estadoInicial) {
        panel.classList.remove('oculto');
        console.log('🔧 Removiendo clase "oculto"...');
    } else {
        panel.classList.add('oculto');
        console.log('🔧 Agregando clase "oculto"...');
    }
    
    setTimeout(() => {
        const estadoFinal = panel.classList.contains('oculto');
        console.log('📊 Estado final - Oculto:', estadoFinal);
        
        if (estadoInicial !== estadoFinal) {
            console.log('✅ Toggle funcionó correctamente');
        } else {
            console.log('❌ Toggle NO funcionó');
        }
    }, 500);
}

// 4. Verificar CSS
function debugCSS() {
    console.log('\n🎨 VERIFICANDO CSS:');
    console.log('===================');
    
    const panel = document.getElementById('panel-lateral');
    if (!panel) return;
    
    const styles = getComputedStyle(panel);
    const estilosRelevantes = {
        position: styles.position,
        right: styles.right,
        top: styles.top,
        width: styles.width,
        height: styles.height,
        transform: styles.transform,
        transition: styles.transition,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility
    };
    
    console.table(estilosRelevantes);
    
    // Verificar regla CSS específica para .oculto
    const testDiv = document.createElement('div');
    testDiv.className = 'panel-lateral oculto';
    testDiv.style.visibility = 'hidden';
    testDiv.style.position = 'absolute';
    testDiv.style.top = '-9999px';
    document.body.appendChild(testDiv);
    
    const stylesOculto = getComputedStyle(testDiv);
    console.log('🔍 Transform cuando está oculto:', stylesOculto.transform);
    
    document.body.removeChild(testDiv);
}

// 5. Función de toggle mejorada para debugging
function debugToggle(forzarEstado) {
    console.log('\n🔄 DEBUGGING TOGGLE FUNCTION:');
    console.log('==============================');
    console.log('Parámetro forzarEstado:', forzarEstado);
    
    const panel = document.getElementById('panel-lateral');
    const botonFlotante = document.getElementById('toggle-panel-btn');
    const botonCerrar = document.getElementById('cerrar-panel');
    
    if (!panel) {
        console.error("❌ Panel lateral no encontrado");
        return;
    }
    
    console.log('✅ Panel encontrado');
    
    // Determinar el estado actual y el estado deseado
    const panelEstaOculto = panel.classList.contains('oculto');
    console.log('📊 Panel está oculto:', panelEstaOculto);
    
    let mostrarPanel;
    
    if (forzarEstado !== undefined) {
        mostrarPanel = forzarEstado;
        console.log('🎯 Usando estado forzado:', mostrarPanel);
    } else {
        // Toggle: si está oculto, mostrarlo; si está visible, ocultarlo
        mostrarPanel = panelEstaOculto;
        console.log('🔄 Toggle automático - mostrarPanel:', mostrarPanel);
    }
    
    console.log('⚙️ Acción a realizar:', mostrarPanel ? 'MOSTRAR' : 'OCULTAR');
    
    if (mostrarPanel) {
        console.log('➕ Removiendo clase "oculto"...');
        panel.classList.remove('oculto');
        
        // Actualizar botón de cerrar
        if (botonCerrar) {
            botonCerrar.innerHTML = '<i class="fas fa-chevron-right"></i>';
            botonCerrar.title = 'Ocultar panel';
            console.log('🔧 Botón cerrar actualizado');
        }
        
        console.log('📱 Panel lateral mostrado');
    } else {
        console.log('➖ Agregando clase "oculto"...');
        panel.classList.add('oculto');
        console.log('📱 Panel lateral ocultado');
    }
    
    // Verificar el resultado
    setTimeout(() => {
        const nuevoEstado = panel.classList.contains('oculto');
        console.log('✅ Verificación final - Panel oculto:', nuevoEstado);
        console.log('🎯 Cambio exitoso:', panelEstaOculto !== nuevoEstado);
    }, 100);
}

// 🚀 EJECUTAR DEBUGGING AUTOMÁTICO
console.log('🔍 Ejecutando debugging automático...');
debugElementos();
debugCSS();

// Hacer funciones disponibles globalmente para testing manual
window.debugMAIRA = {
    elementos: debugElementos,
    eventos: debugEventos,
    toggleTest: testToggleManual,
    css: debugCSS,
    toggle: debugToggle
};

console.log('\n🎮 COMANDOS DISPONIBLES:');
console.log('========================');
console.log('debugMAIRA.elementos() - Verificar elementos');
console.log('debugMAIRA.eventos() - Verificar eventos');
console.log('debugMAIRA.toggleTest() - Test manual del toggle');
console.log('debugMAIRA.css() - Verificar CSS');
console.log('debugMAIRA.toggle() - Toggle con debugging');
console.log('\n💡 Prueba hacer click en los botones ahora...');
