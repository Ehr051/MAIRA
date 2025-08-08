// correcciones_servidor_502.js
// Auto-corrección para errores 502 del servidor

(function() {
    console.log('🔧 Iniciando correcciones para errores 502...');
    
    // Lista de archivos críticos que pueden fallar
    const archivosCriticos = [
        '/Client/js/networkConfig.js',
        '/Client/js/elevationHandler.js',
        '/Client/js/vegetacionhandler.js',
        '/Client/js/indexP.js',
        '/Client/js/miradial.js',
        '/Client/js/graficoMarcha.js',
        '/Client/js/panelMarcha.js',
        '/Client/js/calcosP.js'
    ];
    
    // Función para verificar si un script se cargó correctamente
    function verificarScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => reject(false);
            document.head.appendChild(script);
        });
    }
    
    // Crear contenido de emergencia para networkConfig.js
    function crearNetworkConfigEmergencia() {
        if (typeof window.SERVER_URL === 'undefined') {
            console.log('⚠️ Creando networkConfig de emergencia...');
            
            const currentHost = window.location.hostname;
            const currentProtocol = window.location.protocol;
            
            if (currentHost.includes('onrender.com')) {
                window.SERVER_URL = `${currentProtocol}//${currentHost}`;
                window.CLIENT_URL = `${currentProtocol}//${currentHost}`;
            } else {
                window.SERVER_URL = `${currentProtocol}//${currentHost}:5000`;
                window.CLIENT_URL = `${currentProtocol}//${currentHost}:8080`;
            }
            
            console.log('✅ NetworkConfig de emergencia creado:', {
                SERVER_URL: window.SERVER_URL,
                CLIENT_URL: window.CLIENT_URL
            });
        }
    }
    
    // Crear fallback para elevationHandler
    function crearElevationHandlerEmergencia() {
        if (typeof window.cargarDatosElevacion === 'undefined') {
            console.log('⚠️ Creando elevationHandler de emergencia...');
            
            window.cargarDatosElevacion = async function(bounds) {
                console.warn('🚨 ElevationHandler no disponible - usando fallback');
                return { elevations: [], message: 'Servidor no disponible' };
            };
            
            window.obtenerElevacion = function(lat, lng) {
                console.warn('🚨 ElevationHandler no disponible - retornando 0');
                return 0;
            };
            
            console.log('✅ ElevationHandler de emergencia creado');
        }
    }
    
    // Crear fallback para vegetacionHandler
    function crearVegetacionHandlerEmergencia() {
        if (typeof window.vegetacionHandler === 'undefined') {
            console.log('⚠️ Creando vegetacionHandler de emergencia...');
            
            window.vegetacionHandler = {
                obtenerVegetacion: function(lat, lng) {
                    console.warn('🚨 VegetacionHandler no disponible - retornando valor por defecto');
                    return { ndvi: 0.5, tipo: 'desconocido' };
                },
                cargarIndice: async function() {
                    console.warn('🚨 No se puede cargar índice de vegetación');
                    return false;
                }
            };
            
            console.log('✅ VegetacionHandler de emergencia creado');
        }
    }
    
    // Función principal de corrección
    async function aplicarCorrecciones() {
        console.log('🔄 Aplicando correcciones de emergencia...');
        
        // Siempre crear networkConfig de emergencia primero
        crearNetworkConfigEmergencia();
        
        // Esperar un momento para que se establezcan las variables
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Crear otros handlers de emergencia
        crearElevationHandlerEmergencia();
        crearVegetacionHandlerEmergencia();
        
        console.log('✅ Todas las correcciones aplicadas');
        
        // Enviar evento personalizado para notificar que las correcciones están listas
        window.dispatchEvent(new CustomEvent('correcciones502Aplicadas', {
            detail: { timestamp: new Date().toISOString() }
        }));
    }
    
    // Aplicar correcciones inmediatamente
    aplicarCorrecciones();
    
    // También aplicar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicarCorrecciones);
    }
    
})();
