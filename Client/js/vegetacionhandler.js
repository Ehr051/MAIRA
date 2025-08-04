const vegetacionHandler = (function() {
    let tileIndex = null;
    const tileCache = new Map();
    const BASE_PATH = '../Client/Libs/datos_argentina/Vegetacion';

    async function cargarIndice() {
        try {
            const response = await fetch(`${BASE_PATH}/vegetacion_tile_index.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            tileIndex = await response.json();
            console.log("Índice de vegetación cargado correctamente");
            console.log(`Tiles disponibles: ${Object.keys(tileIndex.tiles).length}`);
            console.log(`Muestra de tiles disponibles: ${Object.keys(tileIndex.tiles).slice(0, 5).join(', ')}...`);
        } catch (error) {
            console.error("Error al cargar el índice de vegetación:", error);
            tileIndex = null;
        }
    }

    function encontrarTileParaPunto(lat, lng) {
        for (const [tileKey, tileInfo] of Object.entries(tileIndex.tiles)) {
            const bounds = tileInfo[0].bounds; // Asumimos que todos los tipos de tile tienen los mismos límites
            if (lat <= bounds.north && lat >= bounds.south && lng >= bounds.west && lng <= bounds.east) {
                return tileKey;
            }
        }
        return null;
    }

    async function cargarTile(tileKey) {
        // Verificar caché primero sin log para evitar spam
        if (tileCache.has(tileKey)) {
            return tileCache.get(tileKey);
        }

        console.log(`Iniciando carga de tile: ${tileKey}`);

        if (!tileIndex.tiles[tileKey]) {
            console.warn(`No se encontró información para el tile ${tileKey} en el índice`);
            return null;
        }

        const ndviInfo = tileIndex.tiles[tileKey].find(info => info.filename.includes('VI_NDVI'));
        if (!ndviInfo) {
            console.error(`No se encontró información NDVI para el tile ${tileKey}`);
            return null;
        }

        try {
            const url = `${BASE_PATH}/${ndviInfo.filename}`;
            console.log(`Intentando cargar archivo desde: ${url}`);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
            const image = await tiff.getImage();
            const tileData = await image.readRasters();

            const tileResult = {
                data: tileData[0],
                bounds: ndviInfo.bounds,
                width: image.getWidth(),
                height: image.getHeight()
            };

            tileCache.set(tileKey, tileResult);
            console.log(`Tile ${tileKey} guardado en caché`);

            return tileResult;
        } catch (error) {
            console.error(`Error al cargar el tile ${tileKey}:`, error);
            return null;
        }
    }

    async function obtenerVegetacionEnPunto(lat, lng) {
        if (!tileIndex) {
            await cargarIndice();
        }

        const tileKey = encontrarTileParaPunto(lat, lng);
        if (!tileKey) {
            console.warn(`No se encontró un tile para el punto (${lat}, ${lng})`);
            return null;
        }

        // Solo log si el tile no está en caché
        if (!tileCache.has(tileKey)) {
            console.log(`Tile encontrado para lat: ${lat}, lng: ${lng}. Tile: ${tileKey}`);
        }

        const tile = await cargarTile(tileKey);
        if (!tile) {
            console.warn(`No se pudo obtener información para el punto (${lat}, ${lng})`);
            return null;
        }

        const pixelX = Math.floor((lng - tile.bounds.west) / (tile.bounds.east - tile.bounds.west) * tile.width);
        const pixelY = Math.floor((tile.bounds.north - lat) / (tile.bounds.north - tile.bounds.south) * tile.height);

        // Solo log detalles de píxel para tiles nuevos
        if (!tileCache.has(tileKey)) {
            console.log(`Píxel calculado: X = ${pixelX}, Y = ${pixelY}`);
        }

        if (pixelX < 0 || pixelX >= tile.width || pixelY < 0 || pixelY >= tile.height) {
            console.error(`Índices de píxel fuera de rango: X = ${pixelX}, Y = ${pixelY}`);
            return null;
        }

        const ndviValue = tile.data[pixelY * tile.width + pixelX] / 10000;
        
        // Solo log valores NDVI para tiles nuevos
        if (!tileCache.has(tileKey)) {
            console.log(`Valor NDVI calculado: ${ndviValue}`);
        }

        return interpretarNDVI(ndviValue);
    }

    function interpretarNDVI(ndvi) {
        if (ndvi < 0) return { tipo: 'Agua o nube', altura: 'N/A', densidad: 'N/A' };
        if (ndvi < 0.2) return { tipo: 'Suelo desnudo o urbano', altura: 'Baja', densidad: 'Muy baja' };
        if (ndvi < 0.4) return { tipo: 'Vegetación escasa', altura: 'Baja', densidad: 'Baja' };
        if (ndvi < 0.6) return { tipo: 'Pradera o arbustos', altura: 'Media', densidad: 'Media' };
        if (ndvi < 0.8) return { tipo: 'Bosque poco denso', altura: 'Alta', densidad: 'Media' };
        return { tipo: 'Bosque denso', altura: 'Alta', densidad: 'Alta' };
    }

    async function cargarDatosVeg() {
        await cargarIndice();
        console.log("Datos de vegetación cargados");
    }

    async function probarVegetacionHandler() {
        await cargarIndice();
        
        const puntosPrueba = [
            {lat: -34.6037, lng: -58.3816},  // Buenos Aires
            {lat: -31.4201, lng: -64.1888},  // Córdoba
            {lat: -32.8908, lng: -68.8272},  // Mendoza
            {lat: -54.8019, lng: -68.3030},  // Ushuaia
            {lat: -25.2867, lng: -57.3333},  // Asunción (fuera de Argentina)
        ];

        for (let punto of puntosPrueba) {
            console.log(`Probando punto: ${punto.lat}, ${punto.lng}`);
            const resultado = await obtenerVegetacionEnPunto(punto.lat, punto.lng);
            console.log(`Vegetación en ${punto.lat}, ${punto.lng}:`, resultado);
        }
    }
        async function calcularVegetacionPromedio(poligono) {
            if (!tileIndex) {
                await cargarIndice();
            }
    
            let sumaNDVI = 0;
            let puntosTotales = 0;
    
            for (let i = 0; i < poligono.length; i++) {
                const punto = poligono[i];
                const tileKey = encontrarTileParaPunto(punto.lat, punto.lng);
                
                if (!tileKey) {
                    console.warn(`No se encontró un tile para el punto (${punto.lat}, ${punto.lng})`);
                    continue;
                }
    
                const tile = await cargarTile(tileKey);
                if (!tile) {
                    console.warn(`No se pudo obtener información para el punto (${punto.lat}, ${punto.lng})`);
                    continue;
                }
    
                const pixelX = Math.floor((punto.lng - tile.bounds.west) / (tile.bounds.east - tile.bounds.west) * tile.width);
                const pixelY = Math.floor((tile.bounds.north - punto.lat) / (tile.bounds.north - tile.bounds.south) * tile.height);
    
                if (pixelX < 0 || pixelX >= tile.width || pixelY < 0 || pixelY >= tile.height) {
                    console.error(`Índices de píxel fuera de rango: X = ${pixelX}, Y = ${pixelY}`);
                    continue;
                }
    
                const ndviValue = tile.data[pixelY * tile.width + pixelX] / 10000;
                sumaNDVI += ndviValue;
                puntosTotales++;
            }
    
            if (puntosTotales === 0) {
                return null;
            }
    
            const ndviPromedio = sumaNDVI / puntosTotales;
            return interpretarNDVI(ndviPromedio);
        }
    
        // Función interna para calcular pendiente usando elevationHandler si está disponible
        async function calcularPendiente(puntoA, puntoB) {
            let elevacionA = puntoA.elevation;
            let elevacionB = puntoB.elevation;
            
            // ✅ USAR elevationHandler.obtenerElevacion si está disponible
            if (window.elevationHandler && window.elevationHandler.obtenerElevacion) {
                try {
                    if (!elevacionA) {
                        elevacionA = await window.elevationHandler.obtenerElevacion(puntoA.lat, puntoA.lng);
                    }
                    if (!elevacionB) {
                        elevacionB = await window.elevationHandler.obtenerElevacion(puntoB.lat, puntoB.lng);
                    }
                } catch (error) {
                    console.warn('Error obteniendo elevaciones:', error);
                }
            }
            
            // Si no hay elevaciones, retornar 0 (terreno plano)
            if (!elevacionA || !elevacionB) {
                console.warn('Elevaciones no disponibles para cálculo de pendiente');
                return 0;
            }
            
            // Calcular distancia horizontal usando Leaflet
            const distanciaHorizontal = L.latLng(puntoA.lat, puntoA.lng).distanceTo(L.latLng(puntoB.lat, puntoB.lng));
            
            if (distanciaHorizontal === 0) {
                return 0; // Mismo punto
            }
            
            const diferenciaElevacion = Math.abs(elevacionB - elevacionA);
            const pendientePorcentaje = (diferenciaElevacion / distanciaHorizontal) * 100;
            
            console.log(`Pendiente calculada: ${pendientePorcentaje.toFixed(2)}% (Δh: ${diferenciaElevacion}m, d: ${distanciaHorizontal.toFixed(0)}m)`);
            
            return pendientePorcentaje;
        }

        // ✅ MODIFICAR calcularTransitabilidad para usar función async:
        async function calcularTransitabilidad(vegetacion, puntoA, puntoB) {
            let factorVegetacion = 1;
            let factorPendiente = 1;

            // ✅ CALCULAR PENDIENTE DE FORMA ASYNC
            const pendientePorcentaje = await calcularPendiente(puntoA, puntoB);

            // Factor de vegetación
            switch (vegetacion.tipo) {
                case 'Suelo desnudo o urbano':
                    factorVegetacion = 1;
                    break;
                case 'Vegetación escasa':
                    factorVegetacion = 0.9;
                    break;
                case 'Pradera o arbustos':
                    factorVegetacion = 0.75;
                    break;
                case 'Bosque poco denso':
                    factorVegetacion = 0.6;
                    break;
                case 'Bosque denso':
                    factorVegetacion = 0.4;
                    break;
                default:
                    factorVegetacion = 0;  // Agua o nube (intransitable)
            }

            // Mapeo de porcentaje de pendiente a un factor de transitabilidad
            if (pendientePorcentaje < 5) {
                factorPendiente = 1; // Llano
            } else if (pendientePorcentaje < 15) {
                factorPendiente = 0.9; // Pendiente leve
            } else if (pendientePorcentaje < 30) {
                factorPendiente = 0.6; // Pendiente moderada
            } else if (pendientePorcentaje < 50) {
                factorPendiente = 0.4; // Pendiente fuerte
            } else if (pendientePorcentaje < 100) {
                factorPendiente = 0.2; // Muy fuerte
            } else {
                factorPendiente = 0; // Intransitable
            }

            return factorVegetacion * factorPendiente;
        }
        
        
    
        return {
            cargarIndice,
            obtenerVegetacionEnPunto,
            calcularVegetacionPromedio,
            calcularTransitabilidad,    // ✅ AHORA ES ASYNC
            calcularPendiente,          // ✅ NUEVA FUNCIÓN
            probarVegetacionHandler,
            cargarDatosVeg
        };
    })();
    
    window.vegetacionHandler = vegetacionHandler;
    window.vegetacionHandler.calcularTransitabilidad = vegetacionHandler.calcularTransitabilidad;

        // ✅ AGREGAR AL FINAL DEL ARCHIVO:
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.Vegetacion = {
        instancia: window.vegetacionHandler,
        
        // ✅ API PRINCIPAL
        inicializar: async function() {
            await this.instancia.cargarDatosVeg();
            console.log('✅ MAIRA.Vegetacion inicializado');
            return true;
        },
        
        analisis: {
            // ✅ ANÁLISIS INDIVIDUAL
            punto: async function(lat, lng) {
                return await this.instancia.obtenerVegetacionEnPunto(lat, lng);
            },
            
            // ✅ ANÁLISIS MÚLTIPLE
            ruta: async function(puntos) {
                const resultados = [];
                for (const punto of puntos) {
                    try {
                        const vegetacion = await this.analisis.punto(punto.lat, punto.lng);
                        resultados.push({
                            coordenadas: { lat: punto.lat, lng: punto.lng },
                            vegetacion: vegetacion,
                            distancia: punto.distanciaAcumulada || 0
                        });
                    } catch (error) {
                        console.warn(`Error analizando punto ${punto.lat}, ${punto.lng}:`, error);
                        resultados.push({
                            coordenadas: { lat: punto.lat, lng: punto.lng },
                            vegetacion: null,
                            error: error.message
                        });
                    }
                }
                return resultados;
            },
            
            // ✅ ANÁLISIS ÁREA
            poligono: async function(poligono) {
                return await this.instancia.calcularVegetacionPromedio(poligono);
            }
        },
        
        transitabilidad: {
            // ✅ CALCULAR FACTOR TRANSITABILIDAD (AHORA ASYNC)
            calcular: async function(vegetacion, puntoA, puntoB) {
                return await window.MAIRA.Vegetacion.instancia.calcularTransitabilidad(vegetacion, puntoA, puntoB);
            },
            
            // ✅ NUEVA: Calcular pendiente con elevationHandler
            calcularPendiente: async function(puntoA, puntoB) {
                return await window.MAIRA.Vegetacion.instancia.calcularPendiente(puntoA, puntoB);
            },
            
            // ✅ NUEVA: Análisis completo de ruta con elevaciones reales
            analizarRuta: async function(puntos) {
                const analisis = [];
                
                for (let i = 0; i < puntos.length - 1; i++) {
                    const puntoA = puntos[i];
                    const puntoB = puntos[i + 1];
                    
                    try {
                        // Obtener vegetación
                        const vegA = await window.MAIRA.Vegetacion.analisis.punto(puntoA.lat, puntoA.lng);
                        const vegB = await window.MAIRA.Vegetacion.analisis.punto(puntoB.lat, puntoB.lng);
                        
                        // Obtener elevaciones usando elevationHandler
                        let elevA = puntoA.elevation;
                        let elevB = puntoB.elevation;
                        
                        if (window.elevationHandler) {
                            if (!elevA) elevA = await window.elevationHandler.obtenerElevacion(puntoA.lat, puntoA.lng);
                            if (!elevB) elevB = await window.elevationHandler.obtenerElevacion(puntoB.lat, puntoB.lng);
                        }
                        
                        // Calcular transitabilidad con elevaciones reales
                        const transitabilidad = await this.calcular(vegA, 
                            { ...puntoA, elevation: elevA }, 
                            { ...puntoB, elevation: elevB }
                        );
                        
                        // Calcular pendiente
                        const pendiente = await this.calcularPendiente(
                            { ...puntoA, elevation: elevA }, 
                            { ...puntoB, elevation: elevB }
                        );
                        
                        analisis.push({
                            segmento: i + 1,
                            puntoA: { ...puntoA, vegetacion: vegA, elevation: elevA },
                            puntoB: { ...puntoB, vegetacion: vegB, elevation: elevB },
                            transitabilidad: transitabilidad,
                            pendiente: pendiente.toFixed(2) + '%',
                            clasificacion: this.clasificar(transitabilidad),
                            distancia: L.latLng(puntoA.lat, puntoA.lng).distanceTo(L.latLng(puntoB.lat, puntoB.lng))
                        });
                        
                    } catch (error) {
                        console.warn(`Error analizando segmento ${i + 1}:`, error);
                        analisis.push({
                            segmento: i + 1,
                            error: error.message
                        });
                    }
                }
                
                return analisis;
            },
            
            // ✅ OBTENER FACTORES POR TIPO
            obtenerFactor: function(tipoVegetacion) {
                const factores = {
                    'Suelo desnudo o urbano': 1.0,
                    'Vegetación escasa': 0.9,
                    'Pradera o arbustos': 0.75,
                    'Bosque poco denso': 0.6,
                    'Bosque denso': 0.4,
                    'Agua o nube': 0
                };
                return factores[tipoVegetacion] || 0.5;
            },
            
            // ✅ CLASIFICAR TRANSITABILIDAD
            clasificar: function(factor) {
                if (factor >= 0.9) return { nivel: 'Excelente', color: '#00ff00' };
                if (factor >= 0.7) return { nivel: 'Buena', color: '#80ff00' };
                if (factor >= 0.5) return { nivel: 'Regular', color: '#ffff00' };
                if (factor >= 0.3) return { nivel: 'Difícil', color: '#ff8000' };
                if (factor > 0) return { nivel: 'Muy difícil', color: '#ff0000' };
                return { nivel: 'Intransitable', color: '#800000' };
            }
        },
        
        cache: {
            // ✅ GESTIÓN CACHE
            limpiar: function() {
                if (this.instancia.tileCache) {
                    this.instancia.tileCache.clear();
                    console.log('🧹 Cache de vegetación limpiado');
                }
            },
            
            estado: function() {
                const cache = this.instancia.tileCache;
                return {
                    tiles: cache ? cache.size : 0,
                    memoria: cache ? Array.from(cache.values())
                        .reduce((total, tile) => total + (tile.data?.length || 0), 0) : 0
                };
            }
        },
        
        utilidades: {
            // ✅ PRUEBAS Y DIAGNÓSTICO
            probar: async function() {
                await this.instancia.probarVegetacionHandler();
            },
            
            // ✅ INFORMACIÓN SISTEMA
            info: function() {
                return {
                    tilesDisponibles: this.instancia.tileIndex ? 
                        Object.keys(this.instancia.tileIndex.tiles).length : 0,
                    cacheActivo: this.cache.estado(),
                    version: '1.0.0'
                };
            },
            
            // ✅ ESTADÍSTICAS NDVI
            estadisticasNDVI: function(valores) {
                if (!Array.isArray(valores) || valores.length === 0) return null;
                
                const validos = valores.filter(v => v !== null && !isNaN(v));
                if (validos.length === 0) return null;
                
                const suma = validos.reduce((a, b) => a + b, 0);
                const promedio = suma / validos.length;
                const minimo = Math.min(...validos);
                const maximo = Math.max(...validos);
                
                return {
                    promedio: promedio.toFixed(3),
                    minimo: minimo.toFixed(3),
                    maximo: maximo.toFixed(3),
                    muestras: validos.length,
                    cobertura: (validos.length / valores.length * 100).toFixed(1) + '%'
                };
            }
        },
        
        integracion: {
            // ✅ INTEGRACIÓN CORREGIDA CON OTROS MÓDULOS
            conectarConCalculoMarcha: function() {
                // VERIFICAR ESTRUCTURAS CORRECTAS
                if (window.CalculoMarcha && window.CalculoMarcha.factores) {
                    // ✅ USAR LA FUNCIÓN CORRECTA:
                    window.CalculoMarcha.factores.vegetacion = function(tipoVegetacion) {
                        const factores = {
                            'Suelo desnudo o urbano': 1.0,
                            'Vegetación escasa': 1.05,
                            'Pradera o arbustos': 1.1,
                            'Bosque poco denso': 1.5,
                            'Bosque denso': 0,  // Intransitable
                            'Agua o nube': 0    // Intransitable
                        };
                        return factores[tipoVegetacion] || 1.0;
                    };
                    
                    console.log('🔗 Vegetación integrada con CalculoMarcha');
                    return true;
                } else {
                    console.warn('⚠️ CalculoMarcha no disponible o estructura incorrecta');
                    console.log('- CalculoMarcha:', typeof window.CalculoMarcha);
                    console.log('- factores:', typeof window.CalculoMarcha?.factores);
                    return false;
                }
            }
        },
        
        version: '1.0.0'
    };
    
    // ✅ AUTO-INICIALIZACIÓN
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            await window.MAIRA.Vegetacion.inicializar();
            
            // Intentar conectar con otros módulos
            setTimeout(() => {
                window.MAIRA.Vegetacion.integracion.conectarConCalculoMarcha();
            }, 1000);
            
        } catch (error) {
            console.warn('⚠️ Error inicializando MAIRA.Vegetacion:', error);
        }
    });