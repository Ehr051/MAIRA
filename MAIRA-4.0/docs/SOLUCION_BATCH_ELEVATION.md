# 🚀 SOLUCIÓN: Batch Elevation API

**Problema actual:** 
- Frontend hace 1 request por cada coordenada (puede ser 100-1000 requests)
- Usuario ve "tildado" porque no hay feedback
- Carga tiles múltiples veces innecesariamente
- Ineficiente para producción y juego

**Solución:**
- Backend recibe TODAS las coordenadas en 1 request
- Backend carga tiles UNA SOLA VEZ
- Backend procesa todas las coordenadas usando tiles en memoria
- Backend devuelve array con todas las elevaciones
- Frontend recibe todo de una vez y renderiza

---

## 📦 ARQUITECTURA

### Frontend → Backend
```javascript
POST /api/elevation/batch
{
  "coordinates": [
    {"lat": -34.6037, "lon": -58.3816},
    {"lat": -34.6038, "lon": -58.3817},
    // ... 100-1000 coordenadas
  ],
  "options": {
    "cacheKey": "terrain_123456", // Para cachear tiles
    "bounds": {
      "north": -34.6,
      "south": -34.65,
      "east": -58.35,
      "west": -58.40
    }
  }
}
```

### Backend → Frontend
```javascript
{
  "elevations": [
    {"lat": -34.6037, "lon": -58.3816, "elevation": 25.5},
    {"lat": -34.6038, "lon": -58.3817, "elevation": 26.2},
    // ... mismo orden que input
  ],
  "metadata": {
    "totalPoints": 1000,
    "processTime": "1.2s",
    "tilesUsed": ["centro_norte_part_11"],
    "cached": false
  }
}
```

---

## 🔧 IMPLEMENTACIÓN BACKEND (app.py)

### Endpoint Batch

```python
@app.route('/api/elevation/batch', methods=['POST'])
def get_batch_elevations():
    """
    Obtener elevaciones para múltiples coordenadas en un solo request.
    
    Request:
    {
      "coordinates": [{"lat": -34.6, "lon": -58.4}, ...],
      "options": {
        "cacheKey": "terrain_123",
        "bounds": {"north": ..., "south": ..., "east": ..., "west": ...}
      }
    }
    
    Response:
    {
      "elevations": [{"lat": -34.6, "lon": -58.4, "elevation": 25.5}, ...],
      "metadata": {"totalPoints": 100, "processTime": "0.5s", ...}
    }
    """
    import time
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        if not data or 'coordinates' not in data:
            return jsonify({
                'error': 'Falta campo "coordinates"',
                'example': {
                    'coordinates': [{'lat': -34.6, 'lon': -58.4}],
                    'options': {'cacheKey': 'terrain_123', 'bounds': {...}}
                }
            }), 400
        
        coordinates = data['coordinates']
        options = data.get('options', {})
        cache_key = options.get('cacheKey', None)
        bounds = options.get('bounds', None)
        
        print(f"🔥 BATCH REQUEST: {len(coordinates)} coordenadas")
        
        # 🗺️ PASO 1: Determinar tiles necesarios
        if bounds:
            tiles_needed = determine_tiles_for_bounds(bounds)
            print(f"📦 Tiles necesarios: {tiles_needed}")
        else:
            # Sin bounds, determinar tiles desde coordenadas
            tiles_needed = determine_tiles_for_coordinates(coordinates)
        
        # 🗺️ PASO 2: Cargar tiles UNA SOLA VEZ (con cache)
        tiles_data = load_tiles_batch(tiles_needed, cache_key)
        print(f"✅ {len(tiles_data)} tiles cargados en memoria")
        
        # 🗺️ PASO 3: Procesar TODAS las coordenadas usando tiles en memoria
        elevations = []
        for coord in coordinates:
            lat = coord.get('lat')
            lon = coord.get('lon')
            
            if lat is None or lon is None:
                elevations.append({
                    'lat': lat,
                    'lon': lon,
                    'elevation': None,
                    'error': 'Coordenadas inválidas'
                })
                continue
            
            # Buscar elevación en tiles cargados
            elevation = get_elevation_from_loaded_tiles(lat, lon, tiles_data)
            
            elevations.append({
                'lat': lat,
                'lon': lon,
                'elevation': elevation
            })
        
        process_time = time.time() - start_time
        
        return jsonify({
            'elevations': elevations,
            'metadata': {
                'totalPoints': len(coordinates),
                'processTime': f"{process_time:.2f}s",
                'tilesUsed': list(tiles_data.keys()),
                'cached': cache_key is not None
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error en batch elevations: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'elevations': []
        }), 500


def determine_tiles_for_bounds(bounds):
    """Determinar qué tiles TIF se necesitan para cubrir bounds"""
    tiles = []
    
    # TODO: Implementar lógica según tu sistema de tiles
    # Ejemplo básico:
    north = bounds['north']
    south = bounds['south']
    east = bounds['east']
    west = bounds['west']
    
    # Buscar en índice master qué tiles cubren este área
    # Por ahora, ejemplo hardcoded:
    tiles.append('centro_norte/centro_norte_part_11')
    
    return tiles


def determine_tiles_for_coordinates(coordinates):
    """Determinar tiles necesarios desde lista de coordenadas"""
    # Calcular bounds mínimos
    lats = [c['lat'] for c in coordinates if 'lat' in c]
    lons = [c['lon'] for c in coordinates if 'lon' in c]
    
    if not lats or not lons:
        return []
    
    bounds = {
        'north': max(lats),
        'south': min(lats),
        'east': max(lons),
        'west': min(lons)
    }
    
    return determine_tiles_for_bounds(bounds)


# Cache global para tiles (evitar recargar en requests consecutivos)
_tiles_cache = {}

def load_tiles_batch(tile_names, cache_key=None):
    """Cargar múltiples tiles TIF en memoria"""
    global _tiles_cache
    
    tiles_data = {}
    
    for tile_name in tile_names:
        # Verificar cache
        if cache_key and f"{cache_key}_{tile_name}" in _tiles_cache:
            print(f"♻️ Tile en cache: {tile_name}")
            tiles_data[tile_name] = _tiles_cache[f"{cache_key}_{tile_name}"]
            continue
        
        # Cargar tile desde disco
        tile_path = os.path.join(
            app.root_path,
            'Client',
            'Libs',
            'datos_argentina',
            'Altimetria_Mini_Tiles',
            f"{tile_name}.tar.gz"
        )
        
        if not os.path.exists(tile_path):
            print(f"⚠️ Tile no encontrado: {tile_path}")
            continue
        
        try:
            # Cargar datos del tile (TIF)
            import tarfile
            import rasterio
            from io import BytesIO
            
            with tarfile.open(tile_path, 'r:gz') as tar:
                # Extraer primer TIF
                for member in tar.getmembers():
                    if member.name.endswith('.tif'):
                        file_obj = tar.extractfile(member)
                        tif_bytes = file_obj.read()
                        
                        # Abrir con rasterio
                        with rasterio.open(BytesIO(tif_bytes)) as dataset:
                            # Leer datos de elevación
                            elevation_array = dataset.read(1)
                            transform = dataset.transform
                            
                            tiles_data[tile_name] = {
                                'data': elevation_array,
                                'transform': transform,
                                'bounds': dataset.bounds
                            }
                            
                            # Guardar en cache
                            if cache_key:
                                _tiles_cache[f"{cache_key}_{tile_name}"] = tiles_data[tile_name]
                            
                            print(f"✅ Tile cargado: {tile_name} ({elevation_array.shape})")
                        break
        
        except Exception as e:
            print(f"❌ Error cargando tile {tile_name}: {e}")
    
    return tiles_data


def get_elevation_from_loaded_tiles(lat, lon, tiles_data):
    """Obtener elevación desde tiles ya cargados en memoria"""
    for tile_name, tile_info in tiles_data.items():
        bounds = tile_info['bounds']
        
        # Verificar si coordenada está dentro de este tile
        if (bounds.left <= lon <= bounds.right and
            bounds.bottom <= lat <= bounds.top):
            
            # Convertir lat/lon a pixel dentro del tile
            transform = tile_info['transform']
            data = tile_info['data']
            
            # Calcular row, col usando transform inverso
            from rasterio.transform import rowcol
            row, col = rowcol(transform, lon, lat)
            
            # Validar índices
            if 0 <= row < data.shape[0] and 0 <= col < data.shape[1]:
                elevation = float(data[row, col])
                
                # Filtrar valores inválidos (NoData)
                if elevation < -10000 or elevation > 10000:
                    return None
                
                return elevation
    
    return None  # No encontrado en ningún tile
```

---

## 🎨 IMPLEMENTACIÓN FRONTEND

### Modificar TerrainController3D.js

```javascript
/**
 * 🗻 Obtener elevaciones en batch (NUEVO)
 */
async getBatchElevations(coordinates, bounds) {
    try {
        log(`📡 Solicitando ${coordinates.length} elevaciones al servidor...`, 'info');
        
        const response = await fetch('http://127.0.0.1:5000/api/elevation/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coordinates: coordinates,
                options: {
                    cacheKey: `terrain_${Date.now()}`,
                    bounds: bounds
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        log(`✅ Recibidas ${data.elevations.length} elevaciones en ${data.metadata.processTime}`, 'success');
        log(`📦 Tiles usados: ${data.metadata.tilesUsed.join(', ')}`, 'info');
        
        return data.elevations;
        
    } catch (error) {
        log(`❌ Error obteniendo elevaciones batch: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * 🏔️ Generar terreno usando batch API (REEMPLAZA método actual)
 */
async generateTerrain(autoActivateFullscreen = true) {
    try {
        if (!this.capturedBounds) {
            throw new Error('Primero captura el map');
        }
        
        showLoadingModal('Generando terreno 3D...', 0);
        
        // ... código de inicialización existente ...
        
        updateProgressBar('Calculando coordenadas...', 10);
        
        // 🔥 PASO 1: Generar grid de coordenadas
        const resolution = 64; // 64x64 = 4096 puntos
        const coordinates = [];
        
        const latStep = (this.capturedBounds.north - this.capturedBounds.south) / resolution;
        const lonStep = (this.capturedBounds.east - this.capturedBounds.west) / resolution;
        
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const lat = this.capturedBounds.south + (i * latStep);
                const lon = this.capturedBounds.west + (j * lonStep);
                
                coordinates.push({ lat, lon });
            }
        }
        
        log(`📍 Generadas ${coordinates.length} coordenadas (${resolution}x${resolution})`, 'info');
        
        updateProgressBar('Solicitando elevaciones al servidor...', 20);
        
        // 🔥 PASO 2: Solicitar TODAS las elevaciones en 1 request
        const elevations = await this.getBatchElevations(coordinates, this.capturedBounds);
        
        updateProgressBar('Construyendo geometría 3D...', 60);
        
        // 🔥 PASO 3: Construir geometría THREE.js
        const geometry = new THREE.PlaneGeometry(
            1000, 1000,
            resolution, resolution
        );
        
        const vertices = geometry.attributes.position.array;
        
        // Aplicar elevaciones a vértices
        for (let i = 0; i < elevations.length; i++) {
            const elevation = elevations[i].elevation || 0;
            
            // Z es la altura en THREE.js
            vertices[i * 3 + 2] = elevation * 2; // vertical scale
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        updateProgressBar('Aplicando textura satelital...', 80);
        
        // Crear mesh
        const material = new THREE.MeshStandardMaterial({
            map: this.satelliteTexture, // Textura capturada
            side: THREE.DoubleSide
        });
        
        const terrainMesh = new THREE.Mesh(geometry, material);
        this.scene.add(terrainMesh);
        
        updateProgressBar('¡Terreno generado!', 100);
        hideLoadingModal();
        
        log('✅ Terreno 3D generado exitosamente', 'success');
        
    } catch (error) {
        hideLoadingModal();
        log(`❌ Error generando terreno: ${error.message}`, 'error');
        throw error;
    }
}
```

---

## 📊 COMPARACIÓN ANTES/DESPUÉS

### ANTES (Actual - requests individuales)
```
1 coordenada = 1 request
100 coordenadas = 100 requests secuenciales
1000 coordenadas = 1000 requests secuenciales

Tiempo: ~10-30 segundos (dependiendo de red)
Carga tiles: 100-1000 veces (innecesario)
UI: "Tildado" sin feedback
```

### DESPUÉS (Batch API)
```
1000 coordenadas = 1 request
Tiles: Carga 1 sola vez
Procesa: En memoria (rápido)

Tiempo: ~1-2 segundos
Carga tiles: 1 vez (eficiente)
UI: Feedback con progress bar
```

---

## 🧪 TESTING

### Test endpoint con curl:
```bash
curl -X POST http://127.0.0.1:5000/api/elevation/batch \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": [
      {"lat": -34.6037, "lon": -58.3816},
      {"lat": -34.6038, "lon": -58.3817},
      {"lat": -34.6039, "lon": -58.3818}
    ],
    "options": {
      "bounds": {
        "north": -34.6,
        "south": -34.61,
        "east": -58.38,
        "west": -58.39
      }
    }
  }'
```

### Resultado esperado:
```json
{
  "elevations": [
    {"lat": -34.6037, "lon": -58.3816, "elevation": 25.5},
    {"lat": -34.6038, "lon": -58.3817, "elevation": 26.2},
    {"lat": -34.6039, "lon": -58.3818, "elevation": 27.1}
  ],
  "metadata": {
    "totalPoints": 3,
    "processTime": "0.15s",
    "tilesUsed": ["centro_norte/centro_norte_part_11"],
    "cached": false
  }
}
```

---

## 🚀 IMPLEMENTACIÓN PASO A PASO

1. **Backend:** Agregar endpoint `/api/elevation/batch` en `app.py`
2. **Backend:** Implementar funciones helper (load_tiles_batch, etc.)
3. **Frontend:** Modificar `TerrainController3D.js` con `getBatchElevations()`
4. **Frontend:** Reemplazar `generateTerrain()` para usar batch API
5. **Testing:** Probar con curl primero
6. **Testing:** Probar desde frontend con modal de progreso
7. **Optimización:** Agregar cache de tiles para requests subsecuentes

---

## 📝 NOTAS ADICIONALES

### Cache de tiles
- Tiles se mantienen en memoria durante la sesión
- `cacheKey` permite agrupar tiles por usuario/sesión
- Limpiar cache después de X minutos o Y MB

### Límites recomendados
- Max coordenadas por request: 10,000
- Max tiles simultáneos en memoria: 10
- Timeout: 30 segundos

### Fallback
- Si batch API falla, caer en método individual (legacy)
- Mostrar advertencia al usuario

---

**Siguiente paso:** ¿Empezamos por implementar el endpoint backend en `app.py`?
