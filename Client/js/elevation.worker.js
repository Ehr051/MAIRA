// elevation.worker.js
// elevation.worker.js
const carpetaBase = '/Client/Libs/datos_argentina/Altimetria';
let tileCache = new Map();
const CACHE_SIZE_LIMIT = 10;

onmessage = async function(e) {
    const { type, data } = e.data;
    try {
        switch (type) {
            case 'LOAD_TILE':
                const tileData = await cargarYProcesarTile(data.tileName, data.url);
                postMessage({
                    type: 'TILE_LOADED',
                    data: {
                        tileName: data.tileName,
                        tileData
                    }
                });
                break;
            case 'GET_ELEVATION':
                const elevation = calcularElevacion(data.lat, data.lng, data.tileData);
                postMessage({
                    type: 'ELEVATION_RESULT',
                    data: {
                        lat: data.lat,
                        lng: data.lng,
                        elevation,
                        requestId: data.requestId
                    }
                });
                break;
        }
    } catch (error) {
        postMessage({
            type: 'ERROR',
            error: error.message
        });
    }
};

async function cargarYProcesarTile(tileName, url) {
    if (tileCache.has(tileName)) {
        return tileCache.get(tileName);
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const rasters = await image.readRasters();
    const metadata = await image.getFileDirectory();

    const tileData = {
        data: rasters[0],
        width: image.getWidth(),
        height: image.getHeight(),
        tiepoint: metadata.ModelTiepoint,
        scale: metadata.ModelPixelScale
    };

    // Gestionar caché
    if (tileCache.size >= CACHE_SIZE_LIMIT) {
        const firstKey = tileCache.keys().next().value;
        tileCache.delete(firstKey);
    }
    tileCache.set(tileName, tileData);

    return tileData;
}

function calcularElevacion(lat, lng, tileData) {
    const { data, width, height, tiepoint, scale } = tileData;
    
    const x = Math.floor((lng - tiepoint[3]) / scale[0]);
    const y = Math.floor((tiepoint[4] - lat) / scale[1]);

    if (x >= 0 && x < width && y >= 0 && y < height) {
        const elevation = data[y * width + x];
        return isFinite(elevation) ? elevation : null;
    }
    
    return null;
}