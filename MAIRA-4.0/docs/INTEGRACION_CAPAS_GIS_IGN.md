# Integración Capas GIS del IGN Argentina

## 📋 Resumen Ejecutivo

**Objetivo**: Integrar capas vectoriales del IGN para mejorar precisión del análisis táctico de terreno.

**Balance**: Peso vs Rendimiento vs Utilidad Táctica

---

## 🎯 Capas PRIORITARIAS (Impacto Directo en Operaciones)

### 1️⃣ **TRANSPORTE** - CRÍTICO ⚠️
**Uso táctico**: Avenidas de aproximación, movilidad, itinerarios

| Capa | Formato | Peso Aprox | Prioridad | Integración |
|------|---------|------------|-----------|-------------|
| **Ruta nacional** (línea) | Shapefile | ~2 MB | **ALTA** | Modifica velocidad +50%, transitabilidad +30% |
| **Ruta provincial** (línea) | Shapefile | ~5 MB | **ALTA** | Modifica velocidad +30%, transitabilidad +20% |
| **Camino** (línea) | Shapefile | ~15 MB | MEDIA | Modifica velocidad +15%, transitabilidad +10% |
| **Ferrocarril** (línea) | Shapefile | ~3 MB | BAJA | Obstáculo o recurso logístico |
| **Puente** (punto/línea) | Shapefile | ~500 KB | MEDIA | Punto crítico, capacidad toneladas |

**Peso Total**: ~25 MB  
**Conversión**: Shapefile → GeoJSON (1 sola vez)  
**Almacenamiento**: `Client/Libs/datos_argentina/Transporte_GeoJSON/`

---

### 2️⃣ **HIDROGRAFÍA** - CRÍTICO ⚠️
**Uso táctico**: Obstáculos, vadeabilidad, puntos de cruce

| Capa | Formato | Peso Aprox | Prioridad | Integración |
|------|---------|------------|-----------|-------------|
| **Curso de agua permanente** (línea) | Shapefile | ~40 MB | **ALTA** | Obstáculo según ancho: <5m vadeable, >5m requiere puente |
| **Espejo de agua permanente** (polígono) | Shapefile | ~20 MB | **ALTA** | Obstáculo absoluto, bordear |
| **Arroyo estacional** (línea) | Shapefile | ~10 MB | MEDIA | Obstáculo si clima=húmedo |
| **Humedal** (polígono) | Shapefile | ~8 MB | MEDIA | Reduce velocidad -70%, transitabilidad -50% |

**Peso Total**: ~78 MB  
**Optimización**: Simplificar geometrías (Tolerancia Douglas-Peucker 0.0001°)  
**Peso Optimizado**: ~30 MB

---

### 3️⃣ **ÁREAS URBANAS** - IMPORTANTE 🏙️
**Uso táctico**: MOUT (Military Operations Urban Terrain), obstáculos, puntos críticos

| Capa | Formato | Peso Aprox | Prioridad | Integración |
|------|---------|------------|-----------|-------------|
| **Localidad simple** (polígono) | Shapefile | ~15 MB | **ALTA** | Reduce velocidad -40%, cobertura +50% |
| **Localidad compuesta** (polígono) | Shapefile | ~5 MB | MEDIA | Reduce velocidad -60%, cobertura +70% |
| **Asentamiento** (punto) | Shapefile | ~2 MB | BAJA | Referencia situacional |

**Peso Total**: ~22 MB

---

### 4️⃣ **VEGETACIÓN NATURAL** - COMPLEMENTO 🌳
**Uso táctico**: Complementar NDVI con tipos específicos

| Capa | Formato | Peso Aprox | Prioridad | Integración |
|------|---------|------------|-----------|-------------|
| **Bosque** (polígono) | Shapefile | ~50 MB | MEDIA | Cobertura +60%, reduce velocidad -30% |
| **Monte** (polígono) | Shapefile | ~30 MB | BAJA | Cobertura +40%, reduce velocidad -20% |
| **Pastizal** (polígono) | Shapefile | ~20 MB | BAJA | Complementa NDVI |

**Peso Total**: ~100 MB  
**Recomendación**: **OMITIR** - Ya tenemos NDVI que cubre esto mejor

---

### 5️⃣ **RELIEVE** - OPCIONAL ⛰️
**Uso táctico**: Ya cubierto por altimetría TIF

| Capa | Prioridad | Decisión |
|------|-----------|----------|
| Curva de nivel | BAJA | ❌ **OMITIR** - Ya tenemos elevación SRTM |
| Pico | BAJA | ❌ **OMITIR** - Calculamos desde TIF |
| Cumbres | BAJA | ❌ **OMITIR** - Redundante |

---

## 📊 Resumen de Descarga

### ✅ DESCARGAR (Total: ~77 MB comprimido → ~120 MB GeoJSON)

```
TRANSPORTE/
├── ruta_nacional.geojson          (~3 MB)
├── ruta_provincial.geojson        (~7 MB)
├── camino.geojson                 (~20 MB)
└── puente.geojson                 (~1 MB)

HIDROGRAFIA/
├── curso_agua_permanente.geojson  (~50 MB) *simplificado
├── espejo_agua_permanente.geojson (~25 MB) *simplificado
└── humedal.geojson                (~10 MB)

AREAS_URBANAS/
├── localidad_simple.geojson       (~20 MB)
└── localidad_compuesta.geojson    (~7 MB)
```

---

## 🔧 Proceso de Integración

### PASO 1: Descargar Shapefiles del IGN

```bash
# Crear directorio temporal
mkdir -p ~/Downloads/IGN_Shapefiles

# Descargar desde: https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG

TRANSPORTE:
- Ruta nacional (línea)
- Ruta provincial (línea) 
- Camino (línea)
- Puente (punto/línea)

HIDROGRAFÍA:
- Curso de agua permanente (línea)
- Espejo de agua permanente (polígono)
- Humedal (polígono)

ÁREAS URBANAS:
- Localidad simple (polígono)
- Localidad compuesta (polígono)
```

### PASO 2: Convertir a GeoJSON + Simplificar

**Instalar herramientas** (una sola vez):
```bash
pip3 install geopandas shapely fiona
```

**Script de conversión**: `tools/convert_shapefiles_to_geojson.py`

```python
import geopandas as gpd
import os
from pathlib import Path

# Configuración
INPUT_DIR = os.path.expanduser('~/Downloads/IGN_Shapefiles')
OUTPUT_DIR = 'Client/Libs/datos_argentina/'

# Mapeo de archivos
LAYERS = {
    'Transporte': {
        'ruta_nacional.shp': 'Transporte_GeoJSON/ruta_nacional.geojson',
        'ruta_provincial.shp': 'Transporte_GeoJSON/ruta_provincial.geojson',
        'camino.shp': 'Transporte_GeoJSON/camino.geojson',
        'puente.shp': 'Transporte_GeoJSON/puente.geojson',
    },
    'Hidrografia': {
        'curso_agua_permanente.shp': 'Hidrografia_GeoJSON/curso_agua_permanente.geojson',
        'espejo_agua_permanente.shp': 'Hidrografia_GeoJSON/espejo_agua_permanente.geojson',
        'humedal.shp': 'Hidrografia_GeoJSON/humedal.geojson',
    },
    'Areas_Urbanas': {
        'localidad_simple.shp': 'Areas_Urbanas_GeoJSON/localidad_simple.geojson',
        'localidad_compuesta.shp': 'Areas_Urbanas_GeoJSON/localidad_compuesta.geojson',
    }
}

def convert_and_simplify(shp_path, geojson_path, tolerance=0.0001):
    """
    Convierte Shapefile a GeoJSON y simplifica geometrías.
    
    tolerance: Tolerancia Douglas-Peucker en grados decimales
               0.0001° ≈ 11 metros (suficiente para escala táctica)
    """
    print(f'📂 Leyendo {shp_path}...')
    gdf = gpd.read_file(shp_path)
    
    # Simplificar geometrías (reduce peso ~50-70%)
    print(f'✂️  Simplificando geometrías (tolerancia={tolerance})...')
    gdf['geometry'] = gdf['geometry'].simplify(tolerance, preserve_topology=True)
    
    # Convertir a WGS84 si no lo está
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        print(f'🗺️  Reproyectando a WGS84...')
        gdf = gdf.to_crs(epsg=4326)
    
    # Guardar GeoJSON
    os.makedirs(os.path.dirname(geojson_path), exist_ok=True)
    print(f'💾 Guardando {geojson_path}...')
    gdf.to_file(geojson_path, driver='GeoJSON')
    
    # Estadísticas
    size_mb = os.path.getsize(geojson_path) / (1024 * 1024)
    print(f'✅ {len(gdf)} features, {size_mb:.2f} MB\n')

# Ejecutar conversión
for category, files in LAYERS.items():
    print(f'\n{'='*50}')
    print(f'📁 {category}')
    print('='*50)
    
    for shp_file, geojson_file in files.items():
        shp_path = os.path.join(INPUT_DIR, shp_file)
        geojson_path = os.path.join(OUTPUT_DIR, geojson_file)
        
        if os.path.exists(shp_path):
            convert_and_simplify(shp_path, geojson_path)
        else:
            print(f'⚠️  No encontrado: {shp_path}')
```

### PASO 3: Integrar en Backend (serverhttps.py)

**Nuevo endpoint**: `/api/capas_vectoriales/consultar`

```python
@app.route('/api/capas_vectoriales/consultar', methods=['POST'])
def consultar_capas_vectoriales():
    """
    Consulta capas vectoriales (transporte, hidrografía, urbanas) 
    dentro de un área de operaciones.
    
    Request:
    {
        "bounds": {
            "north": -38.0,
            "south": -38.1,
            "east": -61.8,
            "west": -62.0
        },
        "capas": ["transporte", "hidrografia", "areas_urbanas"]
    }
    
    Response:
    {
        "transporte": {
            "rutas_nacionales": [...features...],
            "rutas_provinciales": [...features...],
            "caminos": [...features...],
            "puentes": [...features...]
        },
        "hidrografia": {
            "cursos_agua": [...features...],
            "espejos_agua": [...features...],
            "humedales": [...features...]
        },
        "areas_urbanas": {
            "localidades": [...features...]
        }
    }
    """
    try:
        data = request.get_json()
        bounds = data.get('bounds')
        capas_solicitadas = data.get('capas', [])
        
        # Construir bbox para filtro espacial
        from shapely.geometry import box
        bbox = box(bounds['west'], bounds['south'], 
                   bounds['east'], bounds['north'])
        
        resultado = {}
        
        # TRANSPORTE
        if 'transporte' in capas_solicitadas:
            transporte = {}
            
            ruta_nacional_path = os.path.join(BASE_DIR, 'Client', 'Libs', 
                'datos_argentina', 'Transporte_GeoJSON', 'ruta_nacional.geojson')
            
            if os.path.exists(ruta_nacional_path):
                gdf = gpd.read_file(ruta_nacional_path, bbox=bbox)
                transporte['rutas_nacionales'] = json.loads(gdf.to_json())
            
            # Repetir para rutas provinciales, caminos, puentes...
            
            resultado['transporte'] = transporte
        
        # HIDROGRAFÍA
        if 'hidrografia' in capas_solicitadas:
            # Similar a transporte
            pass
        
        # ÁREAS URBANAS
        if 'areas_urbanas' in capas_solicitadas:
            # Similar a transporte
            pass
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### PASO 4: Integrar en Análisis de Terreno

**Modificar** `analizar_terreno()` en `serverhttps.py`:

```python
# Después de calcular transitabilidad base...

# Aplicar modificadores de capas vectoriales
capas_vector = consultar_capas_vectoriales_interno(bounds_area)

for idx, punto in enumerate(puntos_detalle):
    lat, lon = punto['lat'], punto['lon']
    
    # TRANSPORTE: Aumenta transitabilidad si está cerca de ruta
    for ruta in capas_vector.get('transporte', {}).get('rutas_nacionales', []):
        if distancia_punto_linea(lat, lon, ruta) < 50:  # 50 metros
            puntos_detalle[idx]['transitabilidad'] += 0.30
            puntos_detalle[idx]['velocidad_factor'] = 1.50  # +50% velocidad
            puntos_detalle[idx]['tipo_via'] = 'Ruta Nacional'
            break
    
    # HIDROGRAFÍA: Reduce transitabilidad si hay agua
    for curso in capas_vector.get('hidrografia', {}).get('cursos_agua', []):
        if distancia_punto_linea(lat, lon, curso) < 10:  # 10 metros
            ancho = curso.get('properties', {}).get('ancho', 5)
            if ancho > 5:  # No vadeable
                puntos_detalle[idx]['transitabilidad'] = 0.0
                puntos_detalle[idx]['obstáculo'] = f'Curso agua {ancho}m'
            else:  # Vadeable
                puntos_detalle[idx]['transitabilidad'] *= 0.7
                puntos_detalle[idx]['obstáculo'] = f'Arroyo vadeable {ancho}m'
            break
    
    # ÁREAS URBANAS: Modifica cobertura y velocidad
    for localidad in capas_vector.get('areas_urbanas', {}).get('localidades', []):
        if punto_dentro_poligono(lat, lon, localidad):
            puntos_detalle[idx]['cobertura'] += 0.50
            puntos_detalle[idx]['velocidad_factor'] = 0.60  # -40% velocidad
            puntos_detalle[idx]['area_urbana'] = localidad.get('properties', {}).get('nombre')
            break
```

---

## 🚀 Implementación Práctica

### Opción A: INMEDIATA (Sin GeoJSON pesados)

**Usar NDVI + Descomprimir tiles vegetación existentes**

```bash
cd Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/

# Descomprimir los 16 batches (3 minutos)
for i in {01..16}; do
    echo "📦 Descomprimiendo batch $i..."
    tar -xzf vegetation_ndvi_batch_$i/vegetation_ndvi_batch_$i.tar.gz \
        -C vegetation_ndvi_batch_$i/
done

echo "✅ Listo! $(find . -name '*.tif' | wc -l) archivos TIF disponibles"
```

**Ventajas**:
- ✅ Funciona en 5 minutos
- ✅ 0 MB adicionales descargados
- ✅ NDVI real funcional

**Desventajas**:
- ❌ Sin datos de rutas/ríos/urbanas (solo terreno natural)

---

### Opción B: COMPLETA (Con capas IGN)

**1. Descomprimir NDVI** (igual que Opción A)

**2. Descargar + Convertir capas IGN** (~2 horas primera vez)

```bash
# Ejecutar script conversión
cd tools/
python3 convert_shapefiles_to_geojson.py
```

**3. Modificar backend** (agregar endpoint + integración)

**Ventajas**:
- ✅ Precisión máxima (rutas, ríos, urbanas)
- ✅ Análisis táctico completo
- ✅ ~120 MB total (aceptable)

**Desventajas**:
- ❌ Setup inicial largo (2 horas)
- ❌ Requiere geopandas instalado

---

## 🎯 Mi Recomendación

### FASE 1 (HOY): Descomprimir NDVI
```bash
# 5 minutos, NDVI funcional
cd Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/
for i in {01..16}; do
    tar -xzf vegetation_ndvi_batch_$i/vegetation_ndvi_batch_$i.tar.gz \
        -C vegetation_ndvi_batch_$i/
done
```

### FASE 2 (DESPUÉS): Integrar IGN prioritario
**Solo 3 capas críticas** (peso total: ~40 MB):
- ✅ Rutas nacionales (navegabilidad)
- ✅ Cursos de agua permanentes (obstáculos)
- ✅ Localidades simples (áreas urbanas)

**Descartar**: caminos secundarios, vegetación (tenemos NDVI), relieves (tenemos SRTM)

---

## 📝 Compatibilidad

**Formato**: Shapefile (IGN) → GeoJSON (MAIRA)  
**CRS**: POSGAR 07 / WGS84 (EPSG:4326) ✅ Compatible  
**Librerías**: GeoPandas, Shapely ✅ Python nativo  
**Peso**: ~40-120 MB según selección ✅ Aceptable para HDD/SSD  
**Velocidad**: Consulta espacial <0.5s con bbox indexing ✅ Real-time OK

---

## ❓ Decisión Final

**¿Qué hacemos AHORA?**

1. **OPCIÓN RÁPIDA**: Solo descomprimir NDVI (5 min) → NDVI funcional YA
2. **OPCIÓN COMPLETA**: Descomprimir NDVI + descargar/convertir IGN (2h) → Sistema full

**Yo empezaría con OPCIÓN RÁPIDA** para que veas NDVI funcionar, y luego agregamos IGN si ves que lo necesitas.

¿Qué prefieres?
