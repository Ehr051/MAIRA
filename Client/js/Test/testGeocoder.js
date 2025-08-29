// 🔧 DIAGNÓSTICO GEOCODER EN PLANEAMIENTO.HTML
console.log('🚀 Iniciando diagnóstico del geocoder...');

// 1. Verificar dependencias
console.log('📋 Estado de dependencias:');
console.log('  - Leaflet:', typeof L !== 'undefined' ? '✅' : '❌');
console.log('  - L.Control:', typeof L !== 'undefined' && L.Control ? '✅' : '❌'); 
console.log('  - L.Control.Geocoder:', typeof L !== 'undefined' && L.Control && L.Control.Geocoder ? '✅' : '❌');
console.log('  - Nominatim:', typeof L !== 'undefined' && L.Control && L.Control.Geocoder && L.Control.Geocoder.nominatim ? '✅' : '❌');

// 2. Verificar elementos del DOM
console.log('📋 Estado de elementos DOM:');
console.log('  - Input búsqueda:', document.getElementById('busquedaLugar') ? '✅' : '❌');
console.log('  - Botón búsqueda:', document.getElementById('btnBuscarLugar') ? '✅' : '❌');
console.log('  - Resultados:', document.getElementById('resultadosBusquedaLugar') ? '✅' : '❌');
console.log('  - Mapa global:', window.mapa ? '✅' : '❌');

// 3. Test directo del geocoder
if (typeof L !== 'undefined' && L.Control && L.Control.Geocoder) {
    console.log('🧪 Probando geocoder directamente...');
    
    try {
        const testGeocoder = L.Control.Geocoder.nominatim({
            serviceUrl: 'https://nominatim.openstreetmap.org/'
        });
        
        console.log('✅ Geocoder creado exitosamente');
        
        // Test de búsqueda
        testGeocoder.geocode('Buenos Aires', function(results) {
            console.log('🎯 Resultados de test:', results);
            if (results && results.length > 0) {
                console.log('✅ Geocoder funciona correctamente!');
                console.log('📍 Primer resultado:', {
                    name: results[0].name,
                    center: results[0].center,
                    bbox: results[0].bbox
                });
            } else {
                console.log('⚠️ No se obtuvieron resultados');
            }
        }, function(error) {
            console.error('❌ Error en test de geocoder:', error);
        });
        
    } catch (error) {
        console.error('❌ Error creando geocoder:', error);
    }
} else {
    console.error('❌ Geocoder no disponible para test');
}

// 4. Verificar eventos en el input
const inputBusqueda = document.getElementById('busquedaLugar');
if (inputBusqueda) {
    console.log('🔍 Verificando eventos del input...');
    
    // Clonar y reemplazar para limpiar eventos
    const nuevoInput = inputBusqueda.cloneNode(true);
    inputBusqueda.parentNode.replaceChild(nuevoInput, inputBusqueda);
    
    // Agregar event listener de prueba
    nuevoInput.addEventListener('input', function() {
        console.log('⌨️ Input detectado:', this.value);
        if (this.value.length > 2) {
            console.log('🔄 Deberían empezar las sugerencias...');
        }
    });
    
    console.log('✅ Event listener de test agregado');
} else {
    console.error('❌ Input de búsqueda no encontrado');
}

// 5. Función de test manual
window.testGeocoderManual = function(texto) {
    console.log('🧪 Test manual para:', texto);
    
    if (typeof L !== 'undefined' && L.Control && L.Control.Geocoder) {
        const geocoder = L.Control.Geocoder.nominatim({
            serviceUrl: 'https://nominatim.openstreetmap.org/'
        });
        
        geocoder.geocode(texto, function(results) {
            console.log('📍 Resultados manual:', results);
            const resultadosDiv = document.getElementById('resultadosBusquedaLugar');
            if (resultadosDiv) {
                resultadosDiv.innerHTML = '';
                if (results && results.length > 0) {
                    results.slice(0, 5).forEach(function(result, index) {
                        const li = document.createElement('li');
                        li.textContent = result.name || result.display_name || `Resultado ${index + 1}`;
                        li.style.cursor = 'pointer';
                        li.style.padding = '8px';
                        li.style.borderBottom = '1px solid #eee';
                        resultadosDiv.appendChild(li);
                    });
                } else {
                    resultadosDiv.innerHTML = '<li>No se encontraron resultados</li>';
                }
            }
        }, function(error) {
            console.error('❌ Error en test manual:', error);
        });
    } else {
        console.error('❌ Geocoder no disponible para test manual');
    }
};

console.log('🎯 Para probar manualmente, ejecuta: testGeocoderManual("Buenos Aires")');
console.log('🔧 Diagnóstico del geocoder completado.');
