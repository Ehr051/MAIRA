// toolsInitializer.js - Inicializador de herramientas
// Archivo básico para evitar errores 500
console.log('toolsInitializer.js loaded');

class ToolsInitializer {
    static init() {
        console.log('Tools initialized');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    ToolsInitializer.init();
});
