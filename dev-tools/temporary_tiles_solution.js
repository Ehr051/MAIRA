// temporary_tiles_solution.js
// Solución temporal para tiles mientras se configura almacenamiento externo

(function() {
    console.log('⏳ Inicializando solución temporal de tiles...');

    // Crear banner informativo para usuarios
    function createTilesBanner() {
        // Verificar si ya existe el banner
        if (document.getElementById('tiles-status-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'tiles-status-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #ff6b35, #f7931e);
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            border-bottom: 2px solid #e85a00;
        `;
        
        banner.innerHTML = `
            <span style="margin-right: 15px;">🗺️ ESTADO TILES:</span>
            <span id="tiles-status-text">Configurando almacenamiento externo...</span>
            <button onclick="hideTilesBanner()" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 4px 8px;
                margin-left: 15px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            ">✕ Cerrar</button>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Ajustar el contenido para que no quede oculto detrás del banner
        document.body.style.paddingTop = '50px';
    }

    // Función para ocultar banner
    window.hideTilesBanner = function() {
        const banner = document.getElementById('tiles-status-banner');
        if (banner) {
            banner.remove();
            document.body.style.paddingTop = '0';
        }
    };

    // Función para actualizar estado del banner
    window.updateTilesStatus = function(status, type = 'info') {
        const statusText = document.getElementById('tiles-status-text');
        const banner = document.getElementById('tiles-status-banner');
        
        if (statusText) {
            statusText.textContent = status;
        }
        
        if (banner) {
            // Cambiar color según tipo
            const colors = {
                info: 'linear-gradient(90deg, #3498db, #2980b9)',
                warning: 'linear-gradient(90deg, #f39c12, #e67e22)',
                error: 'linear-gradient(90deg, #e74c3c, #c0392b)',
                success: 'linear-gradient(90deg, #27ae60, #229954)'
            };
            
            banner.style.background = colors[type] || colors.info;
        }
    };

    // Detectar estado actual de tiles
    function detectTilesStatus() {
        // Verificar si hay datos locales
        const hasLocalData = typeof window.cargarDatosElevacion !== 'undefined' || 
                            typeof window.vegetacionHandler !== 'undefined';
        
        // Verificar configuración de almacenamiento externo
        const hasExternalConfig = typeof window.externalTilesAdapter !== 'undefined';
        
        // Verificar proveedor actual
        let currentProvider = 'unknown';
        let providerStatus = 'No configurado';
        
        if (hasExternalConfig) {
            const config = window.externalTilesAdapter.getConfig();
            currentProvider = config.current_provider;
            
            switch(currentProvider) {
                case 'fallback_local':
                    providerStatus = 'Modo local (desarrollo)';
                    break;
                case 'github_releases_cdn':
                    providerStatus = 'GitHub Releases + CDN (gratuito)';
                    break;
                case 'internet_archive':
                    providerStatus = 'Internet Archive (gratuito)';
                    break;
                case 'aws_s3':
                    providerStatus = 'AWS S3 (pago)';
                    break;
                default:
                    providerStatus = 'Configurando...';
            }
        }
        
        return {
            hasLocalData,
            hasExternalConfig,
            currentProvider,
            providerStatus
        };
    }

    // Crear handlers de emergencia mejorados
    function createEmergencyHandlers() {
        // Handler de elevación mejorado
        if (typeof window.cargarDatosElevacion === 'undefined') {
            window.cargarDatosElevacion = async function(bounds) {
                console.warn('📊 ElevationHandler en modo emergencia');
                updateTilesStatus('Datos de elevación no disponibles - usando valores simulados', 'warning');
                
                // Simular datos de elevación para Argentina
                const mockElevations = [];
                const { north, south, east, west } = bounds;
                
                // Generar datos simulados basados en geografía conocida de Argentina
                for (let lat = south; lat <= north; lat += 0.1) {
                    for (let lng = west; lng <= east; lng += 0.1) {
                        // Simular elevación basada en coordenadas
                        let elevation = 0;
                        
                        // Andes (oeste)
                        if (lng < -65) elevation = Math.random() * 3000 + 1000;
                        // Patagonia (sur)
                        else if (lat < -40) elevation = Math.random() * 500 + 200;
                        // Pampa (centro)
                        else if (lat > -40 && lng > -65) elevation = Math.random() * 200 + 100;
                        // Mesopotamia (noreste)
                        else elevation = Math.random() * 300 + 50;
                        
                        mockElevations.push({ lat, lng, elevation });
                    }
                }
                
                return { 
                    elevations: mockElevations.slice(0, 100), // Limitar para performance
                    message: 'Datos simulados - configurar almacenamiento externo para datos reales',
                    simulated: true
                };
            };
            
            window.obtenerElevacion = function(lat, lng) {
                // Elevación simulada basada en geografía argentina
                if (lng < -65) return Math.random() * 3000 + 1000; // Andes
                if (lat < -40) return Math.random() * 500 + 200;   // Patagonia
                if (lat > -40 && lng > -65) return Math.random() * 200 + 100; // Pampa
                return Math.random() * 300 + 50; // Resto
            };
        }
        
        // Handler de vegetación mejorado
        if (typeof window.vegetacionHandler === 'undefined') {
            window.vegetacionHandler = {
                obtenerVegetacion: function(lat, lng) {
                    // NDVI simulado basado en geografía argentina
                    let ndvi = 0.3; // Valor base
                    let tipo = 'pradera';
                    
                    if (lng < -65) {
                        ndvi = 0.1; tipo = 'montaña'; // Andes
                    } else if (lat < -40) {
                        ndvi = 0.2; tipo = 'estepa'; // Patagonia
                    } else if (lat > -30 && lng > -60) {
                        ndvi = 0.7; tipo = 'selva'; // Mesopotamia
                    } else {
                        ndvi = 0.5; tipo = 'pampa'; // Pampa
                    }
                    
                    return { 
                        ndvi: ndvi + (Math.random() - 0.5) * 0.2, 
                        tipo,
                        simulated: true
                    };
                },
                cargarIndice: async function() {
                    console.warn('🌿 VegetacionHandler en modo emergencia');
                    updateTilesStatus('Datos de vegetación simulados - configurar almacenamiento externo', 'warning');
                    return true;
                }
            };
        }
    }

    // Función principal de inicialización
    function initTemporarySolution() {
        // Crear banner informativo
        createTilesBanner();
        
        // Detectar estado
        const status = detectTilesStatus();
        
        // Actualizar banner con estado actual
        updateTilesStatus(`${status.providerStatus} | Datos: ${status.hasLocalData ? 'Disponibles' : 'Simulados'}`, 
                         status.currentProvider === 'fallback_local' ? 'warning' : 'info');
        
        // Crear handlers de emergencia si es necesario
        createEmergencyHandlers();
        
        // Log de estado
        console.log('📊 Estado temporal de tiles:', status);
        
        // Programar verificación periódica
        setInterval(() => {
            const newStatus = detectTilesStatus();
            if (newStatus.currentProvider !== 'fallback_local') {
                updateTilesStatus('Almacenamiento externo configurado correctamente', 'success');
                setTimeout(hideTilesBanner, 3000); // Ocultar banner después de 3 segundos
            }
        }, 10000); // Verificar cada 10 segundos
    }

    // Función para mostrar opciones de configuración
    window.showTilesConfigOptions = function() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 600px;
                color: black;
                font-family: Arial, sans-serif;
            ">
                <h2>🗺️ Configuración de Almacenamiento de Tiles</h2>
                <p>Seleccione una opción para configurar el almacenamiento externo:</p>
                
                <div style="margin: 20px 0;">
                    <button onclick="configureInternetArchive()" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">🏛️ Internet Archive (Gratuito)</button>
                    
                    <button onclick="configureGitHubReleases()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">📦 GitHub Releases (Gratuito)</button>
                    
                    <button onclick="configureAWS()" style="
                        background: #f39c12;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">☁️ AWS S3 (Pago ~$7/mes)</button>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Cerrar</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    };

    // Funciones de configuración
    window.configureInternetArchive = function() {
        window.open('setup_internet_archive_storage.sh', '_blank');
        updateTilesStatus('Configurando Internet Archive - siga las instrucciones', 'info');
    };

    window.configureGitHubReleases = function() {
        window.open('prepare_free_storage.sh', '_blank');
        updateTilesStatus('Configurando GitHub Releases - siga las instrucciones', 'info');
    };

    window.configureAWS = function() {
        window.open('AWS_S3_SETUP_GUIDE.md', '_blank');
        updateTilesStatus('Configurando AWS S3 - siga la guía', 'info');
    };

    // Inicializar cuando esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTemporarySolution);
    } else {
        initTemporarySolution();
    }

    // Emitir evento de inicialización
    window.dispatchEvent(new CustomEvent('temporaryTilesSolutionReady', {
        detail: { timestamp: new Date().toISOString() }
    }));

    console.log('✅ Solución temporal de tiles inicializada');

})();
