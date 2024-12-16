// elevationHandler.js - Adaptado para manejar el nuevo sistema de tiles e integrando funciones anteriores y elevation.worker.js

// Ruta de la carpeta que contiene los tiles
const TILE_FOLDER_PATH = 'Client/Libs/datos_argentina/Altimetria';

// Índice de tiles
let tileIndex;
let indiceCargado = false;

// Cargar el índice de tiles al iniciar
const cargarIndiceTiles = new Promise((resolve, reject) => {
  fetch(`${TILE_FOLDER_PATH}/index_tiles_altimetria.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Error al cargar el índice de tiles.');
      }
      return response.json();
    })
    .then((data) => {
      // Validar la estructura del índice
      if (!data.tiles || typeof data.tiles !== 'object') {
        throw new Error('El índice de tiles no tiene la estructura esperada.');
      }
      for (const key in data.tiles) {
        const tile = data.tiles[key];
        if (!tile.filename || !tile.bounds || typeof tile.bounds !== 'object') {
          throw new Error(`El tile con clave '${key}' no tiene la estructura correcta.`);
        }
      }
      tileIndex = data.tiles;
      indiceCargado = true;
      console.log('Índice de tiles cargado correctamente.');
      resolve();
    })
    .catch((error) => {
      console.error('Error al cargar el índice de tiles:', error);
      generarIndiceNuevo();
      reject();
    });
});

// Función para generar un nuevo índice de tiles
function generarIndiceNuevo() {
  console.warn('Generando un nuevo índice de tiles debido a una estructura incorrecta.');
  // Aquí se podría agregar lógica para generar el índice dinámicamente si es posible.
  // Por ahora, simplemente se informa al usuario.
}

// Función para cargar datos de elevación
async function cargarDatosElevacion(bounds) {
  if (!indiceCargado) {
    console.warn('Esperando a que el índice de tiles se cargue.');
    await cargarIndiceTiles;
  }

  if (!tileIndex) {
    console.warn('El índice de tiles no se ha cargado aún.');
    return null;
  }

  try {
    // Buscar el tile que corresponde a la región especificada
    const tile = buscarTileCorrespondiente(bounds);

    if (!tile) {
      console.warn('No se encontró un tile correspondiente a la región especificada.');
      return null;
    }

    // Cargar los datos de elevación del tile encontrado
    const tilePath = `${TILE_FOLDER_PATH}/${tile.filename}`;
    const tileData = await loadTileData(tilePath);
    return tileData;
  } catch (error) {
    console.error('Error al cargar datos de elevación:', error);
    return null;
  }
}

// Función para cargar un archivo GeoTIFF
async function loadTileData(tilePath) {
  try {
    const response = await fetch(tilePath);
    if (!response.ok) {
      throw new Error(`Error al cargar el tile: ${tilePath}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const rasters = await image.readRasters();
    const metadata = await image.getFileDirectory();

    console.log(`Tile cargado desde: ${tilePath}`, metadata);
    return {
      data: rasters[0],
      width: image.getWidth(),
      height: image.getHeight(),
      tiepoint: metadata.ModelTiepoint,
      scale: metadata.ModelPixelScale,
    };
  } catch (error) {
    console.error('Error al cargar el archivo GeoTIFF:', error);
    return null;
  }
}

// Función para buscar el tile correspondiente en el índice de tiles
function buscarTileCorrespondiente(bounds) {
  for (const tileKey in tileIndex) {
    const tile = tileIndex[tileKey];
    if (!tile.bounds) {
      continue;
    }
    const { north, south, east, west } = tile.bounds;

    if (
      bounds.north <= north &&
      bounds.south >= south &&
      bounds.east <= east &&
      bounds.west >= west
    ) {
      return tile;
    }
  }
  return null;
}

// Inicializar los datos de elevación
async function inicializarDatosElevacion(bounds) {
  console.log('Inicializando datos de elevación con bounds:', bounds);
  const datosElevacion = await cargarDatosElevacion(bounds);
  if (datosElevacion) {
    console.log('Datos de elevación cargados correctamente.');
  } else {
    console.warn('Los datos de elevación no se pudieron cargar o no están disponibles.');
  }
}

// Función para procesar datos de elevación usando el worker
function procesarDatosElevacion(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('elevation.worker.js');
    worker.postMessage(data);

    worker.onmessage = (event) => {
      resolve(event.data);
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
  });
}

// Función para calcular el perfil de elevación
async function calcularPerfilElevacion(ruta) {
  try {
    console.log('Calculando perfil de elevación para la ruta:', ruta);
    const bounds = calcularBoundsRuta(ruta);
    const datosElevacion = await cargarDatosElevacion(bounds);

    if (!datosElevacion) {
      console.warn('No se pudieron cargar los datos de elevación para el perfil.');
      return null;
    }

    const perfil = await procesarDatosElevacion({ ruta, datosElevacion });
    console.log('Perfil de elevación calculado correctamente.');
    return perfil;
  } catch (error) {
    console.error('Error al calcular el perfil de elevación:', error);
    return null;
  }
}

// Función para calcular los bounds de una ruta
function calcularBoundsRuta(ruta) {
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  ruta.forEach((punto) => {
    if (punto.lat > north) north = punto.lat;
    if (punto.lat < south) south = punto.lat;
    if (punto.lng > east) east = punto.lng;
    if (punto.lng < west) west = punto.lng;
  });

  return { north, south, east, west };
}

// Función para obtener la elevación de una coordenada
async function obtenerElevacion(lat, lon) {
  if (!isFinite(lat) || !isFinite(lon)) {
    console.warn('Coordenadas inválidas en obtenerElevacion:', lat, lon);
    return null;
  }

  if (!indiceCargado) {
    console.warn('Esperando a que el índice de tiles se cargue.');
    await cargarIndiceTiles;
  }

  const tile = buscarTileCorrespondiente({ north: lat, south: lat, east: lon, west: lon });
  if (!tile) {
    console.log(`No se encontró tile para lat=${lat}, lon=${lon}`);
    return null;
  }

  const tileData = await loadTileData(`${TILE_FOLDER_PATH}/${tile.filename}`);
  if (!tileData) {
    console.warn(`No se pudieron cargar los datos del tile para lat=${lat}, lon=${lon}`);
    return null;
  }

  const { data, width, height, tiepoint, scale } = tileData;
  const x = Math.round((lon - tiepoint[3]) / scale[0]);
  const y = Math.round((tiepoint[4] - lat) / scale[1]);

  if (x < 0 || x >= width || y < 0 || y >= height) {
    console.log(`Coordenadas fuera de rango: lat=${lat}, lon=${lon}`);
    return null;
  }

  const elevation = data[y * width + x];
  if (elevation === undefined || isNaN(elevation)) {
    console.warn(`Elevación inválida para lat=${lat}, lon=${lon}`);
    return null;
  }

  return parseFloat(elevation.toFixed(2));
}

// Función para obtener el estado del sistema (agregada para evitar errores)
function obtenerEstadoSistema() {
  return {
    indiceCargado: !!indiceCargado,
    tileIndex: tileIndex ? 'Cargado' : 'No cargado',
  };
}



// Exponer funciones necesarias en el objeto global
window.elevationHandler = {
  cargarDatosElevacion,
  inicializarDatosElevacion,
  procesarDatosElevacion,
  calcularPerfilElevacion,
  obtenerElevacion,
  obtenerEstadoSistema,
};
