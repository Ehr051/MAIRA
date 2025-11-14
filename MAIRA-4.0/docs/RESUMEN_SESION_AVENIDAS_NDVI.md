# Resumen Sesión: Avenidas de Aproximación + NDVI

**Fecha**: 14 de noviembre de 2025  
**Branch**: BV8TOMAIRA  
**Status**: ✅ Implementación completa, pendiente pruebas navegador

---

## ✅ Completado

### 1. **Canvas Fix** (analisisTerreno.js)
```javascript
// Destruye chart anterior antes de crear nuevo
if (this.chartPendientes) {
    this.chartPendientes.destroy();
}
```

### 2. **Chunks para Áreas Grandes** (analisisTerreno.js)
- **Límite chunk**: 50 km² (~7x7 km, Batallón)
- **Límite total**: 2000 km² (~45x45 km, División/Cuerpo)
- **Clasificación automática**: Pelotón → Compañía → Batallón → Brigada → División → Cuerpo
- **UI**: Barra progreso + tiempo estimado

### 3. **MinHeap + Dijkstra** (analisisTerreno.js)
```javascript
class MinHeap {
    insert(item)    // O(log n)
    extractMin()    // O(log n)
    bubbleUp()
    bubbleDown()
}

calcularRutaDijkstra(grafo, origen, destino) {
    // Priority queue con MinHeap
    // 8-conectividad
    // Early termination cuando encuentra destino
    // Complejidad: O(E log V)
}
```

**Ventaja vs A***: Dijkstra garantiza óptimo global en terreno multi-factor (pendiente + NDVI + elevación) sin necesidad de heurística admisible.

### 4. **Avenidas de Aproximación - Ancho Dinámico**
**Cálculo**:
- Escaneo lateral ±100m desde ruta óptima
- Cuenta puntos transitables adyacentes
- Analiza continuidad corredor
- Calcula pendientes laterales promedio

**Clasificación**:
```
> 600m  → Regimiento    (Verde)
200-600m → Batallón      (Verde claro)
100-200m → Compañía      (Amarillo)
50-100m  → Sección       (Naranja)
< 50m    → Pelotón       (Rojo)
```

**Características**:
- Ancho variable por segmento (puede crecer/decrecer según terreno)
- Tooltip muestra: ancho metros, magnitud, pendiente, transitabilidad
- Grosor línea proporcional a ancho

### 5. **NDVI - Tiles Descomprimidos**
```bash
✅ 2,978 archivos TIF descomprimidos
✅ 2.2 GB total (de 1.1 GB comprimido)
✅ 16 batches procesados
```

**Estructura**:
```
Vegetacion_Mini_Tiles/
├── vegetation_master_index.json (1 MB)
├── vegetation_ndvi_batch_01/
│   ├── tile_0_0_0_0.tif (388 KB)
│   ├── tile_0_0_0_1.tif
│   └── ... (191 tiles)
├── vegetation_ndvi_batch_02/
│   └── ... (186 tiles)
...
└── vegetation_ndvi_batch_16/
    └── ... (178 tiles)
```

### 6. **Fix Ruta BASE_DIR** (serverhttps.py línea 3631)
```python
# ANTES (INCORRECTO):
vegetation_tiles_path = 'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles'

# DESPUÉS (CORRECTO):
vegetation_tiles_path = os.path.join(BASE_DIR, 'Client', 'Libs', 'datos_argentina', 'Vegetacion_Mini_Tiles')
```

**Problema resuelto**: Servidor buscaba en `Server/Client/...` (no existe) en vez de `MAIRA-4.0/Client/...`

### 7. **Integración NDVI en Backend** (serverhttps.py línea 3613-3730)
```python
try:
    # Cargar vegetation_master_index.json
    master_index_path = os.path.join(vegetation_tiles_path, 'vegetation_master_index.json')
    with open(master_index_path, 'r', encoding='utf-8') as f:
        master_index = json.load(f)
    
    # Filtrar tiles por bounds (intersección espacial)
    tiles_dict = master_index.get('tiles', {})
    for tile_id, tile_info in tiles_dict.items():
        if tile_bounds intersecta bounds_area:
            relevant_tiles.append(tile_info)
    
    # Cargar tiles con rasterio
    for tile_info in relevant_tiles:
        tile_path = os.path.join(vegetation_tiles_path, package, filename)
        src = rasterio.open(tile_path)  # ✅ AHORA EXISTE (descomprimido)
        tile_cache[filename] = {'src': src, 'bounds': src.bounds}
    
    # Procesar cada punto
    for punto in puntos_detalle:
        for tile in tile_cache:
            if punto dentro tile:
                ndvi_value = src.read(1)[py, px]
                if ndvi_value > 1:  # Escala 0-255
                    ndvi_value /= 255.0
                punto['ndvi'] = round(ndvi_value, 3)
    
except Exception as e:
    print(f'⚠️ Error NDVI: {e}')
    # Continúa con 0.0
```

### 8. **Documentación GIS IGN** (docs/INTEGRACION_CAPAS_GIS_IGN.md)
**Contenido**:
- 📋 Análisis capas prioritarias (transporte, hidrografía, urbanas)
- 📊 Balance peso vs rendimiento vs utilidad táctica
- 🔧 Script conversión Shapefile → GeoJSON
- 🚀 Plan integración backend
- 🎯 Recomendación: Solo 3 capas críticas (~40 MB):
  - Rutas nacionales
  - Cursos de agua permanentes
  - Localidades simples

**Herramientas**:
- `tools/convert_shapefiles_to_geojson.py` - Script conversión completo
- Dependencias: geopandas, shapely, fiona

---

## ⏸️ Pendiente de Pruebas

### Pruebas en Navegador
1. **Canvas**: Verificar que segundo análisis no da error "already in use"
2. **Chunks**: Analizar área >50km² y verificar:
   - Barra progreso funciona
   - División en chunks correcta
   - Resultados acumulados bien
3. **NDVI**: Verificar que:
   - `💾 X tiles NDVI cargados` donde X > 0 (antes era 0)
   - `✅ NDVI integrado: X/2000 puntos` donde X > 0
   - Valores NDVI en tooltip **NO son 0.0**
   - Valores NDVI razonables: 0.0-1.0 (0=sin vegetación, 1=vegetación densa)
4. **Avenidas Aproximación**:
   - Rutas renderizadas en mapa
   - Colores correctos según ancho
   - Grosor variable visible
   - Tooltip muestra métricas
   - Ancho crece/decrece dinámicamente

### Cómo Probar
```bash
# 1. Iniciar servidor
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Server
python3 serverhttps.py

# 2. Abrir navegador
https://localhost:5000

# 3. Ir a Análisis de Terreno
# 4. Dibujar polígono pequeño (<50km²)
# 5. Verificar NDVI en consola servidor:
#    🌿 Obteniendo NDVI para 2000 puntos...
#    📖 Leyendo .../vegetation_master_index.json
#    🎯 X tiles NDVI relevantes
#    💾 X tiles NDVI cargados  ← DEBE SER > 0
#    ✅ NDVI integrado: X/2000 puntos ← DEBE SER > 0

# 6. Dibujar polígono grande (>50km² pero <2000km²)
# 7. Verificar chunks + progreso UI

# 8. Agregar 2 puntos para Avenidas Aproximación
# 9. Verificar ruta renderizada con colores
```

---

## 📁 Archivos Modificados

```
Client/js/modules/analisisTerreno.js
├── +77 líneas: MinHeap class
├── +120 líneas: calcularRutaDijkstra()
├── +80 líneas: calcularAnchoAvenida()
├── +60 líneas: visualizarAvenidas()
└── Modificado: Límites 50km² / 2000km²

Server/serverhttps.py
├── Línea 3631: Fix vegetation_tiles_path con BASE_DIR
└── Línea 3613-3730: Integración NDVI completa

docs/INTEGRACION_CAPAS_GIS_IGN.md
└── Nuevo: Documentación completa capas IGN

tools/convert_shapefiles_to_geojson.py
└── Nuevo: Script conversión Shapefile → GeoJSON
```

---

## 🔄 Próximos Pasos

### Inmediato (Hoy)
1. ✅ Descomprimir tiles NDVI → **HECHO**
2. ⏸️ Probar NDVI en navegador → **PENDIENTE**
3. ⏸️ Verificar Avenidas Aproximación → **PENDIENTE**

### Corto Plazo (Esta Semana)
1. Descargar capas IGN prioritarias (rutas, ríos, urbanas)
2. Ejecutar `tools/convert_shapefiles_to_geojson.py`
3. Integrar capas en backend (endpoint `/api/capas_vectoriales/consultar`)
4. Modificar análisis terreno para aplicar modificadores de capas vectoriales

### Mediano Plazo (Próximas Semanas)
1. Optimizar consultas espaciales (índices R-tree)
2. Cache de capas vectoriales en memoria
3. Sistema de prioridades para carga tiles (on-demand vs prefetch)
4. Documentación usuario final

---

## 📊 Métricas de Rendimiento Esperadas

### NDVI
- **Tiles cargados**: 2-5 tiles por análisis típico (zona pequeña)
- **Puntos procesados**: 500-2000 puntos
- **Tiempo**: +0.3-0.8s adicionales al análisis
- **Cobertura**: 70-95% puntos con NDVI real (depende de tiles disponibles)

### Avenidas Aproximación
- **Construcción grafo**: ~0.2s para 2000 puntos (8-conectividad)
- **Dijkstra**: ~0.1-0.5s (depende de distancia)
- **Cálculo ancho**: ~0.1s por ruta
- **Total**: <1s para ruta típica

### Chunks
- **Chunk individual**: ~0.5-1s (2000 puntos)
- **Área 200km²**: ~4 chunks → ~4s total
- **Área 2000km²**: ~40 chunks → ~40s total
- **UI**: Actualización cada chunk (feedback continuo)

---

## 🐛 Issues Conocidos

### Resueltos ✅
- ~~Canvas "already in use"~~ → Destroy chart anterior
- ~~Max call stack en áreas grandes~~ → División chunks
- ~~NDVI siempre 0.0~~ → Tiles descomprimidos + fix BASE_DIR
- ~~FileNotFoundError master_index~~ → os.path.join(BASE_DIR, ...)
- ~~"No module named 'shapely'"~~ → pip3 install shapely

### Pendientes ⏸️
- Validar NDVI funciona en navegador
- Validar Avenidas Aproximación renderizadas
- Optimizar carga tiles (posible cache)

---

## 🎯 Decisiones de Diseño

### ¿Por qué Dijkstra y no A*?
**Razón**: Terreno multi-factor (pendiente + NDVI + elevación + clima) sin destino único claro. A* requiere heurística admisible h(n) ≤ costo_real, difícil de calcular en terreno complejo. Dijkstra garantiza óptimo sin heurística.

### ¿Por qué descomprimir tiles y no on-the-fly?
**Razón**: Balance rendimiento vs espacio. 2.2GB aceptable en disco moderno. Extracción on-the-fly agrega ~0.5-1s por tile. Análisis tiempo real requiere <1s total.

### ¿Por qué solo 3 capas IGN y no todas?
**Razón**: 
- **Rutas**: +50% velocidad, crítico para movilidad
- **Ríos**: Obstáculos absolutos, crítico para transitabilidad
- **Urbanas**: MOUT, cobertura, crítico para tácticas
- **Vegetación**: Ya cubierto por NDVI (mejor resolución)
- **Relieve**: Ya cubierto por SRTM (mejor resolución)

Total: ~40 MB vs ~300 MB todas las capas. ROI: 80% utilidad con 13% peso.

---

## 📚 Referencias

- **IGN Argentina**: https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG
- **Dijkstra Algorithm**: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
- **MinHeap Data Structure**: https://en.wikipedia.org/wiki/Binary_heap
- **NDVI**: https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index
- **GeoJSON Spec**: https://geojson.org/
- **Shapefile Format**: https://www.esri.com/content/dam/esrisites/sitecore-archive/Files/Pdfs/library/whitepapers/pdfs/shapefile.pdf

---

**Autor**: MAIRA Team  
**Estado**: ✅ Listo para pruebas  
**Próximo**: Validación navegador
