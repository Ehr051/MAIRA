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
        console.log(`Iniciando carga de tile: ${tileKey}`);

        if (tileCache.has(tileKey)) {
            console.log(`Tile ${tileKey} encontrado en caché`);
            return tileCache.get(tileKey);
        }

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

        console.log(`Tile encontrado para lat: ${lat}, lng: ${lng}. Tile: ${tileKey}`);

        const tile = await cargarTile(tileKey);
        if (!tile) {
            console.warn(`No se pudo obtener información para el punto (${lat}, ${lng})`);
            return null;
        }

        const pixelX = Math.floor((lng - tile.bounds.west) / (tile.bounds.east - tile.bounds.west) * tile.width);
        const pixelY = Math.floor((tile.bounds.north - lat) / (tile.bounds.north - tile.bounds.south) * tile.height);

        console.log(`Píxel calculado: X = ${pixelX}, Y = ${pixelY}`);

        if (pixelX < 0 || pixelX >= tile.width || pixelY < 0 || pixelY >= tile.height) {
            console.error(`Índices de píxel fuera de rango: X = ${pixelX}, Y = ${pixelY}`);
            return null;
        }

        const ndviValue = tile.data[pixelY * tile.width + pixelX] / 10000;
        console.log(`Valor NDVI calculado: ${ndviValue}`);

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
    
        function calcularTransitabilidad(vegetacion, puntoA, puntoB) {
            let factorVegetacion = 1;
            let factorPendiente = 1;
        
            // Calcular la pendiente como porcentaje entre los dos puntos
            const distanciaHorizontal = L.latLng(puntoA.lat, puntoA.lng).distanceTo(L.latLng(puntoB.lat, puntoB.lng));
            const pendientePorcentaje = calcularPendiente(
                { distancia: distanciaHorizontal, elevation: puntoA.elevation },
                { distancia: distanciaHorizontal, elevation: puntoB.elevation }
            );
        
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
            calcularTransitabilidad,
            probarVegetacionHandler,
            cargarDatosVeg
        };
    })();
    
    window.vegetacionHandler = vegetacionHandler;
    window.vegetacionHandler.calcularTransitabilidad = vegetacionHandler.calcularTransitabilidad;