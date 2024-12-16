// atajosP.js

var atajos = {
    'Ctrl+Z': { descripcion: 'Deshacer', funcion: 'deshacerAccion' },
    'Ctrl+Y': { descripcion: 'Rehacer', funcion: 'rehacerAccion' },
    'Ctrl+S': { descripcion: 'Guardar calco', funcion: 'guardarCalco' },
    'Ctrl+O': { descripcion: 'Abrir calco', funcion: 'cargarCalco' },
    'Ctrl+N': { descripcion: 'Nuevo calco', funcion: 'crearNuevoCalco' },
    'Ctrl+M': { descripcion: 'Medir distancia', funcion: 'medirDistancia' },
    'Ctrl+E': { descripcion: 'Mostrar perfil de elevación', funcion: 'mostrarPerfilElevacion' },
    'Delete': { descripcion: 'Eliminar elemento seleccionado', funcion: 'eliminarElementoSeleccionado' },
    'Ctrl+C': { descripcion: 'Copiar elemento', funcion: 'copiarElemento' },
    'Ctrl+V': { descripcion: 'Pegar elemento', funcion: 'pegarElemento' }
};

document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    var tecla = '';
    if (e.ctrlKey) tecla += 'Ctrl+';
    tecla += e.key.toUpperCase();

    if (atajos[tecla]) {
        e.preventDefault();
        if (typeof window[atajos[tecla].funcion] === 'function') {
            window[atajos[tecla].funcion]();
        } else {
            console.warn('Función ' + atajos[tecla].funcion + ' no encontrada');
        }
    }
});

function mostrarAyudaAtajos() {
    var ayuda = 'Atajos de teclado:\n\n';
    for (var atajo in atajos) {
        ayuda += atajo + ': ' + atajos[atajo].descripcion + '\n';
    }
    alert(ayuda);
}

// Funciones de copiar y pegar (implementación básica)
window.copiarElemento = function() {
    if (window.elementoSeleccionado) {
        window.elementoCopiado = window.elementoSeleccionado;
        console.log('Elemento copiado');
    } else {
        console.log('No hay elemento seleccionado para copiar');
    }
};

window.pegarElemento = function() {
    if (window.elementoCopiado) {
        // Aquí deberías implementar la lógica para pegar el elemento
        console.log('Elemento pegado (implementación pendiente)');
    } else {
        console.log('No hay elemento para pegar');
    }
};

// Hacer disponible globalmente
window.mostrarAyudaAtajos = mostrarAyudaAtajos;