// 🔧 Script de corrección para errores detectados en Planeamiento
// Soluciona los problemas de milsymbol y Geocoder

console.log('🔧 Iniciando corrección de errores detectados...');

// 1. Corrección para milsymbol
function corregirMilsymbol() {
    console.log('🎖️ Verificando milsymbol...');
    
    if (typeof ms === 'undefined') {
        console.log('⚠️ milsymbol no encontrado, cargando desde CDN...');
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js';
        script.onload = () => {
            console.log('✅ milsymbol cargado correctamente');
            if (typeof window.verificarInicializacion === 'function') {
                window.verificarInicializacion();
            }
        };
        script.onerror = () => {
            console.log('❌ Error cargando milsymbol');
        };
        document.head.appendChild(script);
    } else {
        console.log('✅ milsymbol ya está disponible');
    }
}

// 2. Corrección para Geocoder
function corregirGeocoder() {
    console.log('🗺️ Verificando Geocoder...');
    
    if (typeof L === 'undefined') {
        console.log('❌ Leaflet no está disponible');
        return;
    }
    
    if (!L.Control.Geocoder) {
        console.log('⚠️ Geocoder no encontrado, cargando desde CDN...');
        
        // Cargar CSS del geocoder
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css';
        document.head.appendChild(css);
        
        // Cargar JS del geocoder
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.min.js';
        script.onload = () => {
            console.log('✅ Geocoder cargado correctamente');
            inicializarGeocoder();
        };
        script.onerror = () => {
            console.log('❌ Error cargando Geocoder');
        };
        document.head.appendChild(script);
    } else {
        console.log('✅ Geocoder ya está disponible');
        inicializarGeocoder();
    }
}

// 3. Función para inicializar el geocoder en el mapa
function inicializarGeocoder() {
    if (typeof map !== 'undefined' && map && L.Control.Geocoder) {
        try {
            const geocoder = L.Control.geocoder({
                defaultMarkGeocode: false,
                position: 'topright',
                placeholder: 'Buscar lugar...',
                errorMessage: 'No se encontró el lugar'
            }).on('markgeocode', function(e) {
                const latlng = e.geocode.center;
                L.marker(latlng).addTo(map)
                    .bindPopup(e.geocode.name)
                    .openPopup();
                map.setView(latlng, 15);
            });
            
            geocoder.addTo(map);
            console.log('✅ Geocoder agregado al mapa');
        } catch (error) {
            console.log('❌ Error inicializando geocoder:', error);
        }
    }
}

// 4. Función de verificación completa
function verificarYCorregirDependencias() {
    console.log('🔍 Verificando dependencias críticas...');
    
    const dependencias = [
        { nombre: 'Leaflet', verificar: () => typeof L !== 'undefined' },
        { nombre: 'jQuery', verificar: () => typeof $ !== 'undefined' },
        { nombre: 'Bootstrap', verificar: () => typeof bootstrap !== 'undefined' || document.querySelector('link[href*="bootstrap"]') },
        { nombre: 'D3', verificar: () => typeof d3 !== 'undefined' },
        { nombre: 'MilSymbol', verificar: () => typeof ms !== 'undefined' },
        { nombre: 'Geocoder', verificar: () => typeof L !== 'undefined' && L.Control && L.Control.Geocoder }
    ];
    
    const faltantes = [];
    
    dependencias.forEach(dep => {
        if (dep.verificar()) {
            console.log(`✅ ${dep.nombre}: Disponible`);
        } else {
            console.log(`❌ ${dep.nombre}: No disponible`);
            faltantes.push(dep.nombre);
        }
    });
    
    if (faltantes.length > 0) {
        console.log(`⚠️ Dependencias faltantes: ${faltantes.join(', ')}`);
        
        // Aplicar correcciones específicas
        if (faltantes.includes('MilSymbol')) {
            corregirMilsymbol();
        }
        
        if (faltantes.includes('Geocoder')) {
            setTimeout(corregirGeocoder, 1000); // Esperar un poco
        }
    } else {
        console.log('✅ Todas las dependencias están disponibles');
    }
    
    return faltantes;
}

// 5. Función para forzar recarga de recursos problemáticos
function forzarRecargaRecursos() {
    console.log('🔄 Forzando recarga de recursos problemáticos...');
    
    const recursosProblematicos = [
        {
            url: 'https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js',
            test: () => typeof ms !== 'undefined',
            nombre: 'MilSymbol'
        },
        {
            url: 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.min.js',
            test: () => typeof L !== 'undefined' && L.Control && L.Control.Geocoder,
            nombre: 'Geocoder'
        }
    ];
    
    recursosProblematicos.forEach(recurso => {
        if (!recurso.test()) {
            console.log(`🔄 Recargando ${recurso.nombre}...`);
            
            const script = document.createElement('script');
            script.src = recurso.url;
            script.onload = () => {
                console.log(`✅ ${recurso.nombre} recargado exitosamente`);
            };
            script.onerror = () => {
                console.log(`❌ Error recargando ${recurso.nombre}`);
            };
            document.head.appendChild(script);
        }
    });
}

// 6. Función de auto-corrección que se ejecuta automáticamente
function autoCorreccion() {
    console.log('🤖 Iniciando auto-corrección...');
    
    // Verificar inmediatamente
    const faltantes = verificarYCorregirDependencias();
    
    // Si hay faltantes, intentar corrección después de un tiempo
    if (faltantes.length > 0) {
        setTimeout(() => {
            console.log('🔄 Segundo intento de corrección...');
            forzarRecargaRecursos();
            
            // Verificación final después de un tiempo
            setTimeout(() => {
                const faltantesFinal = verificarYCorregirDependencias();
                if (faltantesFinal.length === 0) {
                    console.log('🎉 Auto-corrección completada exitosamente');
                } else {
                    console.log('⚠️ Algunas dependencias siguen faltando:', faltantesFinal);
                }
            }, 3000);
        }, 2000);
    }
}

// 7. Función para mostrar reporte de estado
function mostrarReporteEstado() {
    const reporte = {
        timestamp: new Date().toISOString(),
        leaflet: typeof L !== 'undefined',
        milsymbol: typeof ms !== 'undefined',
        geocoder: typeof L !== 'undefined' && L.Control && L.Control.Geocoder,
        jquery: typeof $ !== 'undefined',
        d3: typeof d3 !== 'undefined',
        bootstrap: typeof bootstrap !== 'undefined' || document.querySelector('link[href*="bootstrap"]') !== null
    };
    
    console.log('📊 Reporte de estado de dependencias:');
    console.table(reporte);
    
    return reporte;
}

// 8. Inicialización automática cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoCorreccion);
} else {
    autoCorreccion();
}

// 9. Exponer funciones globalmente para uso manual
window.correccionDependencias = {
    corregirMilsymbol,
    corregirGeocoder,
    verificarYCorregirDependencias,
    forzarRecargaRecursos,
    autoCorreccion,
    mostrarReporteEstado
};

console.log('🔧 Script de corrección cargado. Funciones disponibles en window.correccionDependencias');
