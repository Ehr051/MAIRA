// ⚡ elevationHandlerBackend.js - VERSIÓN OPTIMIZADA QUE USA BACKEND
// ANTES: Frontend descargaba 2.5MB tar.gz → FPS crítico (2-4 FPS)
// AHORA: Backend Python+GDAL procesa todo → Esperado: 60 FPS

let elevationHandlerIndiceCargado = false;

// 🎯 Obtener elevación individual
async function obtenerElevacion(lat, lon) {
  if (!isFinite(lat) || !isFinite(lon)) {
    console.warn('Coordenadas inválidas:', lat, lon);
    return null;
  }

  try {
    const response = await fetch('/api/elevation/batch', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        points: [{lat: lat, lon: lon, index: 0}]
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    if (data.elevations && data.elevations[0] !== null) {
      return parseFloat(data.elevations[0].toFixed(2));
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo elevación:', error);
    return null;
  }
}

// 🚀 Obtener múltiples elevaciones en batch
async function obtenerElevacionBatch(points) {
  if (!Array.isArray(points) || points.length === 0) return [];

  console.log(`📡 Backend: Solicitando ${points.length} elevaciones...`);
  const startTime = performance.now();

  try {
    const formattedPoints = points.map((point, index) => ({
      lat: point.lat,
      lon: point.lon || point.lng,
      index: index
    }));

    const response = await fetch('/api/elevation/batch', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({points: formattedPoints})
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const elapsed = performance.now() - startTime;
    
    console.log(`✅ Backend: ${data.valid_count}/${data.count} en ${elapsed.toFixed(0)}ms`);
    console.log(`   Tiles: ${data.tiles_loaded} | Velocidad: ${(data.count/(elapsed/1000)).toFixed(0)} pts/s`);
    
    return data.elevations;
  } catch (error) {
    console.error('❌ Error en batch:', error);
    return points.map(() => null);
  }
}

// 🔧 Calcular distancia Haversine
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos((lat1*Math.PI)/180) * Math.cos((lat2*Math.PI)/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 📊 Calcular perfil de elevación
async function calcularPerfilElevacion(ruta) {
  try {
    console.log('📊 Perfil:', ruta.length, 'puntos');
    const elevations = await obtenerElevacionBatch(ruta);
    
    const perfil = [];
    let distanciaAcumulada = 0;
    
    for (let i = 0; i < ruta.length; i++) {
      const punto = ruta[i];
      
      if (i > 0) {
        const anterior = ruta[i-1];
        distanciaAcumulada += calcularDistanciaHaversine(
          anterior.lat, anterior.lng || anterior.lon,
          punto.lat, punto.lng || punto.lon
        );
      }
      
      perfil.push({
        lat: punto.lat,
        lng: punto.lng || punto.lon,
        elevation: elevations[i],
        distancia: Math.round(distanciaAcumulada),
        indice: i,
        pendiente: 0
      });
    }
    
    // Calcular pendientes
    for (let i = 1; i < perfil.length; i++) {
      const actual = perfil[i];
      const anterior = perfil[i-1];
      const dist = actual.distancia - anterior.distancia;
      const elev = actual.elevation - anterior.elevation;
      
      if (dist > 0) {
        actual.pendiente = (elev / dist) * 100;
        if (Math.abs(actual.pendiente) > 100) {
          actual.pendiente = Math.sign(actual.pendiente) * 100;
        }
      }
    }
    
    return perfil;
  } catch (error) {
    console.error('Error perfil:', error);
    return null;
  }
}

// 🔄 Compatibilidad legacy
async function procesarDatosElevacion(puntosInterpolados) {
  if (!puntosInterpolados || !Array.isArray(puntosInterpolados)) {
    throw new Error('Datos inválidos');
  }
  
  const elevations = await obtenerElevacionBatch(puntosInterpolados);
  
  const resultados = [];
  let distanciaAcumulada = 0;
  
  for (let i = 0; i < puntosInterpolados.length; i++) {
    const punto = puntosInterpolados[i];
    
    if (i > 0) {
      const anterior = puntosInterpolados[i-1];
      distanciaAcumulada += calcularDistanciaHaversine(
        anterior.lat, anterior.lng || anterior.lon,
        punto.lat, punto.lng || punto.lon
      );
    }
    
    resultados.push({
      distancia: Math.round(distanciaAcumulada),
      elevation: elevations[i] || 0,
      lat: punto.lat,
      lng: punto.lng || punto.lon,
      pendiente: 0
    });
  }
  
  for (let i = 1; i < resultados.length; i++) {
    const actual = resultados[i];
    const anterior = resultados[i-1];
    const dist = actual.distancia - anterior.distancia;
    const elev = actual.elevation - anterior.elevation;
    
    if (dist > 0) {
      actual.pendiente = (elev / dist) * 100;
      if (Math.abs(actual.pendiente) > 100) {
        actual.pendiente = Math.sign(actual.pendiente) * 100;
      }
    }
  }
  
  return resultados;
}

function obtenerEstadoSistema() {
  return {
    elevationHandlerIndiceCargado: true,
    modo: 'backend-optimizado',
    version: '2.0.0',
    endpoint: '/api/elevation/batch'
  };
}

// 🎯 EXPORTAR API
window.elevationHandler = {
  obtenerElevacion,
  obtenerElevacionBatch,
  calcularPerfilElevacion,
  procesarDatosElevacion,
  obtenerEstadoSistema,
  getElevation: obtenerElevacion,
  getElevationBatch: obtenerElevacionBatch,
};

// 🌐 ESTRUCTURA MAIRA
window.MAIRA = window.MAIRA || {};
window.MAIRA.Elevacion = {
  instancia: window.elevationHandler,
  inicializar: async function() {
    console.log('✅ MAIRA.Elevacion (backend) inicializado');
    elevationHandlerIndiceCargado = true;
    return true;
  },
  analisis: {
    punto: obtenerElevacion,
    ruta: calcularPerfilElevacion
  },
  clearCache: function() {
    console.log('🧹 Cache en backend');
    return true;
  },
  version: '2.0.0-backend'
};

console.log('⚡ elevationHandlerBackend.js cargado');
console.log('📊 Backend Python+GDAL | Frontend solo JSON');
