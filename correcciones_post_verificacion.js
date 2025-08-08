// correcciones_post_verificacion.js
// Correcciones específicas post-verificación para los problemas restantes

(function() {
    console.log('🔧 Iniciando correcciones post-verificación...');

    // 1. Forzar carga de NetworkConfig
    function forzarNetworkConfig() {
        // Verificar si ya está cargado
        if (typeof window.SERVER_URL !== 'undefined' && typeof window.CLIENT_URL !== 'undefined') {
            console.log('✅ NetworkConfig ya está disponible');
            return true;
        }

        console.log('⚠️ Forzando carga de NetworkConfig...');
        
        // Detectar entorno automáticamente
        const currentHost = window.location.hostname;
        const currentProtocol = window.location.protocol;
        const isRender = currentHost.includes('onrender.com');
        const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
        
        if (isRender) {
            // Configuración para Render
            window.SERVER_URL = `${currentProtocol}//${currentHost}`;
            window.CLIENT_URL = `${currentProtocol}//${currentHost}`;
        } else if (isLocalhost) {
            // Configuración para desarrollo local
            window.SERVER_URL = `${currentProtocol}//${currentHost}:5000`;
            window.CLIENT_URL = `${currentProtocol}//${currentHost}:8080`;
        } else {
            // Configuración genérica
            window.SERVER_URL = `${currentProtocol}//${currentHost}`;
            window.CLIENT_URL = `${currentProtocol}//${currentHost}`;
        }
        
        // Agregar función getServerUrl global
        window.getServerUrl = function() {
            return window.SERVER_URL;
        };
        
        console.log('✅ NetworkConfig configurado:', {
            SERVER_URL: window.SERVER_URL,
            CLIENT_URL: window.CLIENT_URL,
            detected_env: isRender ? 'render' : isLocalhost ? 'localhost' : 'other'
        });
        
        return true;
    }

    // 2. Crear fallbacks para índices JSON
    function crearFallbacksJSON() {
        console.log('🔧 Creando fallbacks para índices JSON...');
        
        // Índice de altimetría fallback
        window.altimetriaIndexFallback = {
            "bounds": {
                "north": -22.0,
                "south": -55.0,
                "east": -53.0,
                "west": -74.0
            },
            "tiles": [],
            "total_tiles": 0,
            "status": "fallback",
            "message": "Usando datos de emergencia - índices no disponibles"
        };
        
        // Índice de vegetación fallback
        window.vegetacionIndexFallback = {
            "bounds": {
                "north": -22.0,
                "south": -55.0,
                "east": -53.0,
                "west": -74.0
            },
            "tiles": [],
            "total_tiles": 0,
            "status": "fallback",
            "message": "Usando datos de emergencia - vegetación no disponible"
        };
        
        console.log('✅ Fallbacks JSON creados');
    }

    // 3. Verificar y cargar bibliotecas CDN si faltan
    function verificarBibliotecasCDN() {
        console.log('📚 Verificando bibliotecas CDN...');
        
        // Lista de bibliotecas requeridas
        const bibliotecas = [
            {
                name: 'Leaflet',
                check: () => typeof L !== 'undefined',
                css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
                js: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            },
            {
                name: 'MilSymbol',
                check: () => typeof ms !== 'undefined',
                js: 'https://cdn.jsdelivr.net/npm/milsymbol@2.1.1/dist/milsymbol.js'
            },
            {
                name: 'D3.js',
                check: () => typeof d3 !== 'undefined',
                js: 'https://d3js.org/d3.v7.min.js'
            }
        ];

        bibliotecas.forEach(lib => {
            if (!lib.check()) {
                console.log(`⚠️ ${lib.name} no encontrado, cargando...`);
                
                // Cargar CSS si existe
                if (lib.css) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = lib.css;
                    document.head.appendChild(link);
                }
                
                // Cargar JS
                if (lib.js) {
                    const script = document.createElement('script');
                    script.src = lib.js;
                    script.onload = () => console.log(`✅ ${lib.name} cargado exitosamente`);
                    script.onerror = () => console.error(`❌ Error cargando ${lib.name}`);
                    document.head.appendChild(script);
                }
            } else {
                console.log(`✅ ${lib.name} ya está disponible`);
            }
        });
    }

    // 4. Función de diagnóstico mejorado
    function diagnosticoCompleto() {
        console.log('🔍 Ejecutando diagnóstico completo...');
        
        const diagnostico = {
            timestamp: new Date().toISOString(),
            networkConfig: {
                available: typeof window.SERVER_URL !== 'undefined',
                serverUrl: window.SERVER_URL || 'NO DEFINIDO',
                clientUrl: window.CLIENT_URL || 'NO DEFINIDO'
            },
            bibliotecas: {
                leaflet: typeof L !== 'undefined',
                milsymbol: typeof ms !== 'undefined',
                d3: typeof d3 !== 'undefined'
            },
            handlers: {
                elevation: typeof window.cargarDatosElevacion !== 'undefined',
                vegetacion: typeof window.vegetacionHandler !== 'undefined'
            },
            entorno: {
                host: window.location.hostname,
                protocol: window.location.protocol,
                isRender: window.location.hostname.includes('onrender.com'),
                isLocalhost: ['localhost', '127.0.0.1'].includes(window.location.hostname)
            }
        };
        
        console.log('📊 Diagnóstico completo:', diagnostico);
        return diagnostico;
    }

    // 5. Función principal de inicialización
    async function inicializarCorrecciones() {
        console.log('🚀 Iniciando secuencia de correcciones...');
        
        // Paso 1: NetworkConfig
        forzarNetworkConfig();
        
        // Paso 2: Fallbacks JSON
        crearFallbacksJSON();
        
        // Paso 3: Bibliotecas CDN
        verificarBibliotecasCDN();
        
        // Paso 4: Esperar un momento para que se carguen las bibliotecas
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Paso 5: Diagnóstico final
        const diagnostico = diagnosticoCompleto();
        
        // Paso 6: Emitir evento de correcciones completadas
        window.dispatchEvent(new CustomEvent('correccionesPostVerificacionCompletadas', {
            detail: { 
                diagnostico,
                timestamp: new Date().toISOString()
            }
        }));
        
        console.log('✅ Correcciones post-verificación completadas');
    }

    // 6. Exponer funciones globalmente para debugging
    window.correccionesPostVerificacion = {
        forzarNetworkConfig,
        crearFallbacksJSON,
        verificarBibliotecasCDN,
        diagnosticoCompleto,
        reinicializar: inicializarCorrecciones
    };

    // Ejecutar automáticamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarCorrecciones);
    } else {
        inicializarCorrecciones();
    }

})();
