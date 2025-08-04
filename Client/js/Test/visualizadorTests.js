/**
 * VISUALIZADOR DE RESULTADOS DE TESTS
 * Muestra los resultados de tests en la página además de la consola
 */

// Crear panel de resultados visual
function crearPanelResultados() {
    // Eliminar panel existente si existe
    const panelExistente = document.getElementById('panelResultadosTest');
    if (panelExistente) {
        panelExistente.remove();
    }

    // Crear nuevo panel
    const panel = document.createElement('div');
    panel.id = 'panelResultadosTest';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 500px;
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #00ff00;
        z-index: 10000;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
    `;

    // Botón de cerrar
    const btnCerrar = document.createElement('button');
    btnCerrar.innerHTML = '×';
    btnCerrar.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: #ff0000;
        color: white;
        border: none;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        cursor: pointer;
        font-weight: bold;
    `;
    btnCerrar.onclick = () => panel.remove();

    // Título
    const titulo = document.createElement('div');
    titulo.innerHTML = '🧪 RESULTADOS DE TESTS - PLANEAMIENTO';
    titulo.style.cssText = `
        font-weight: bold;
        margin-bottom: 10px;
        color: #00ffff;
        border-bottom: 1px solid #00ff00;
        padding-bottom: 5px;
    `;

    // Contenido
    const contenido = document.createElement('div');
    contenido.id = 'contenidoResultados';

    panel.appendChild(btnCerrar);
    panel.appendChild(titulo);
    panel.appendChild(contenido);
    document.body.appendChild(panel);

    return panel;
}

// Función para mostrar resultados en el panel
function mostrarResultadoEnPanel(mensaje, tipo = 'info') {
    const panel = document.getElementById('panelResultadosTest') || crearPanelResultados();
    const contenido = document.getElementById('contenidoResultados');
    
    const linea = document.createElement('div');
    linea.style.marginBottom = '3px';
    
    let color = '#00ff00';
    let icono = 'ℹ️';
    
    switch(tipo) {
        case 'success':
            color = '#00ff00';
            icono = '✅';
            break;
        case 'error':
            color = '#ff4444';
            icono = '❌';
            break;
        case 'warning':
            color = '#ffaa00';
            icono = '⚠️';
            break;
        case 'info':
            color = '#00ffff';
            icono = 'ℹ️';
            break;
    }
    
    linea.style.color = color;
    linea.innerHTML = `${icono} ${mensaje}`;
    
    contenido.appendChild(linea);
    contenido.scrollTop = contenido.scrollHeight;
}

// Función mejorada para ejecutar tests con visualización
window.ejecutarTestPlaneamientoVisual = async function(rapido = false) {
    // Limpiar consola y crear panel
    console.clear();
    crearPanelResultados();
    
    mostrarResultadoEnPanel('Iniciando sistema de tests...', 'info');
    mostrarResultadoEnPanel(`Modo: ${rapido ? 'RÁPIDO' : 'COMPLETO'}`, 'info');
    mostrarResultadoEnPanel('═'.repeat(40), 'info');
    
    try {
        if (typeof window.TestPlaneamiento === 'undefined') {
            mostrarResultadoEnPanel('❌ ERROR: TestPlaneamiento no disponible', 'error');
            return false;
        }
        
        const test = new window.TestPlaneamiento();
        
        if (rapido) {
            mostrarResultadoEnPanel('Ejecutando tests básicos...', 'info');
            const resultado = await test.testRapido();
            
            if (resultado) {
                mostrarResultadoEnPanel('🎉 TESTS BÁSICOS EXITOSOS', 'success');
                mostrarResultadoEnPanel('Sistema de planeamiento funcionando correctamente', 'success');
            } else {
                mostrarResultadoEnPanel('⚠️ Se detectaron problemas en tests básicos', 'warning');
                mostrarResultadoEnPanel('Ver consola para detalles específicos', 'info');
            }
            
            return resultado;
        } else {
            mostrarResultadoEnPanel('Ejecutando suite completa de tests...', 'info');
            const resultados = await test.ejecutarTodosLosTests();
            
            mostrarResultadoEnPanel('═'.repeat(40), 'info');
            mostrarResultadoEnPanel(`✅ Tests exitosos: ${resultados.pasados}`, 'success');
            mostrarResultadoEnPanel(`❌ Tests fallidos: ${resultados.fallados}`, resultados.fallados > 0 ? 'error' : 'success');
            
            const porcentaje = ((resultados.pasados / (resultados.pasados + resultados.fallados)) * 100).toFixed(1);
            mostrarResultadoEnPanel(`📊 Porcentaje de éxito: ${porcentaje}%`, porcentaje >= 80 ? 'success' : 'warning');
            
            if (resultados.errores.length > 0) {
                mostrarResultadoEnPanel('🔍 Errores encontrados:', 'warning');
                resultados.errores.slice(0, 3).forEach(error => {
                    mostrarResultadoEnPanel(`• ${error}`, 'error');
                });
                if (resultados.errores.length > 3) {
                    mostrarResultadoEnPanel(`... y ${resultados.errores.length - 3} más (ver consola)`, 'info');
                }
            }
            
            // Recomendación final
            if (resultados.pasados >= 10) {
                mostrarResultadoEnPanel('🎯 RECOMENDACIÓN: Módulo en excelente estado', 'success');
            } else if (resultados.pasados >= 8) {
                mostrarResultadoEnPanel('🎯 RECOMENDACIÓN: Funcional con problemas menores', 'warning');
            } else {
                mostrarResultadoEnPanel('🎯 RECOMENDACIÓN: Requiere correcciones importantes', 'error');
            }
            
            return resultados;
        }
    } catch (error) {
        mostrarResultadoEnPanel(`💥 ERROR CRÍTICO: ${error.message}`, 'error');
        console.error('Error en test:', error);
        return false;
    }
};

// Sobrescribir funciones originales para usar visualización
window.ejecutarTestPlaneamiento = window.ejecutarTestPlaneamientoVisual;

// Mostrar mensaje de carga del visualizador
console.log('🎨 Visualizador de tests cargado - Los resultados aparecerán en pantalla y consola');

// Auto-ejecutar con visualización si está configurado
if (window.location.search.includes('autotest=true')) {
    setTimeout(() => {
        mostrarResultadoEnPanel('Auto-test activado por URL', 'info');
        window.ejecutarTestPlaneamientoVisual(true);
    }, 3000);
}
