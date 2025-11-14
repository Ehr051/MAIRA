# 🗺️ Sistema de Tiles GIS On-Demand

Sistema de carga selectiva de capas geográficas del IGN (Instituto Geográfico Nacional) para MAIRA 4.0.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso](#uso)
- [API](#api)
- [Testing](#testing)
- [Regenerar Tiles](#regenerar-tiles)

---

## 🏗️ Arquitectura

### División Espacial

El sistema divide el territorio argentino en una grilla de tiles espaciales:

- **Tamaño**: 0.5° × 0.5° (~55km × 55km por tile)
- **Grilla**: 40 columnas × 67 filas = 2,680 tiles teóricos
- **Tiles con datos**: 5,357 tiles (tiles vacíos omitidos automáticamente)

### Estructura de Archivos

```
Client/Libs/datos_argentina/
├── gis_tiles_master_index.json         # 240 KB - Metadata de todos los tiles
├── Transporte_Tiles/                   # 87 MB
│   ├── ruta_nacional/                  # 720 tiles
│   ├── ruta_provincial/                # 1,128 tiles
│   └── caminos/                        # 793 tiles
├── Hidrografia_Tiles/                  # 97 MB
│   ├── curso_agua_permanente/          # 994 tiles
│   └── espejo_agua_permanente/         # 947 tiles
└── Areas_Urbanas_Tiles/                # 3.8 MB
    └── localidades/                    # 775 tiles
```

### Master Index

El archivo `gis_tiles_master_index.json` contiene metadata de cada tile:

```json
{
  "version": "1.0",
  "tile_size_degrees": 0.5,
  "tile_size_km_approx": 55.5,
  "total_tiles": 5357,
  "tiles": {
    "tile_10_25": {
      "id": "tile_10_25",
      "bounds": {
        "west": -68.5,
        "east": -68.0,
        "south": -42.0,
        "north": -41.5
      },
      "filename": "tile_10_25.geojson",
      "feature_count": 47,
      "size_bytes": 23456
    }
  }
}
```

---

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
# Instalar geopandas (necesario para crear tiles)
pip3 install geopandas
```

### 2. Descargar Capas del IGN

Opción A - **Script automático** (recomendado):

```bash
cd tools
chmod +x descargar_capas_ign.sh
./descargar_capas_ign.sh
```

Opción B - **Descarga manual**:

Ver URLs en: `docs/URLS_DESCARGA_CAPAS_IGN.md`

Descargar los siguientes archivos en `Client/Libs/datos_argentina/`:
- vial_nacional.zip
- vial_provincial.zip
- vial_AP010.zip (caminos)
- lineas_de_aguas_continentales_perenne.zip
- areas_de_aguas_continentales_perenne.zip
- localidad_bahra.zip

### 3. Generar Tiles

```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0

# Paso 1: Convertir Shapefiles a GeoJSON
python3 tools/convert_shapefiles_to_geojson.py

# Paso 2: Dividir GeoJSON en tiles espaciales
python3 tools/create_gis_tiles.py
```

**Output esperado**:

```
📐 Grilla: 40 columnas × 67 filas = 2680 tiles

✅ Procesando ruta_nacional...
   2723 features → 720 tiles (3736 features)

✅ Procesando ruta_provincial...
   12936 features → 1128 tiles (16176 features)

✅ Procesando caminos...
   84606 features → 793 tiles (89481 features)

[...]

✅ Capas procesadas: 6
📦 Tiles creados: 5357
📊 Features totales: 177,927

💾 Master index guardado: gis_tiles_master_index.json (0.24 MB)
```

---

## 💻 Uso

### Backend - Endpoint

El servidor expone el endpoint `/api/capas_gis/consultar`:

```python
# Server/serverhttps.py (línea ~3757)

@app.route('/api/capas_gis/consultar', methods=['POST'])
def consultar_capas_gis():
    """
    Carga selectiva de tiles GIS según bounds del área
    
    Request:
    {
        "bounds": {
            "north": -34.0,
            "south": -35.0,
            "east": -58.0,
            "west": -59.0
        },
        "capas": ["transporte", "hidrografia", "areas_urbanas"]
    }
    
    Response:
    {
        "success": true,
        "capas": {
            "transporte": {
                "rutas_nacionales": { "type": "FeatureCollection", "features": [...] },
                "rutas_provinciales": { "type": "FeatureCollection", "features": [...] },
                "caminos": { "type": "FeatureCollection", "features": [...] }
            },
            "hidrografia": {
                "cursos_agua": { "type": "FeatureCollection", "features": [...] },
                "espejos_agua": { "type": "FeatureCollection", "features": [...] }
            },
            "areas_urbanas": {
                "localidades": { "type": "FeatureCollection", "features": [...] }
            }
        },
        "tiles_cargados": 12,
        "features_totales": 543,
        "tiempo_ms": 123.4
    }
    """
```

### Frontend - Módulo Análisis de Terreno

```javascript
// Client/js/modules/analisisTerreno.js

// Cargar capas GIS para el área visible del mapa
const data = await window.analisisTerreno.cargarCapasGISArea([
    'transporte', 
    'hidrografia', 
    'areas_urbanas'
]);

// Activar/desactivar capa individual
window.analisisTerreno.toggleCapaGIS('transporte');

// Limpiar todas las capas
window.analisisTerreno.limpiarCapasGIS();
```

### Estilos de Capas

```javascript
// Configuración en analisisTerreno.js
estilosGIS: {
    ruta_nacional: {
        color: '#ff0000',      // Rojo
        weight: 3,
        opacity: 0.8
    },
    ruta_provincial: {
        color: '#ff9900',      // Naranja
        weight: 2,
        opacity: 0.7
    },
    caminos: {
        color: '#996633',      // Marrón
        weight: 1.5,
        opacity: 0.6
    },
    curso_agua_permanente: {
        color: '#0066cc',      // Azul
        weight: 2,
        opacity: 0.7
    },
    espejo_agua_permanente: {
        color: '#0099ff',      // Celeste
        weight: 0.5,
        fillColor: '#66ccff',
        fillOpacity: 0.3
    },
    localidades: {
        radius: 5,
        fillColor: '#ff6600',  // Naranja
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
    }
}
```

---

## 🧪 Testing

### Script de Prueba Automático

```bash
# Asegurarse de que el servidor esté corriendo
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
python3 Server/serverhttps.py

# En otra terminal, ejecutar tests
python3 tools/test_capas_gis_endpoint.py
```

**Output esperado**:

```
╔════════════════════════════════════════════════════════════════════╗
║  🧪 TEST ENDPOINT /api/capas_gis/consultar                        ║
║  Sistema de tiles GIS on-demand                                   ║
╚════════════════════════════════════════════════════════════════════╝

======================================================================
🧪 Probando: Buenos Aires
======================================================================
📍 Bounds: {'north': -34.0, 'south': -35.0, 'east': -58.0, 'west': -59.0}
🗺️  Capas solicitadas: transporte, hidrografia, areas_urbanas

⏱️  Tiempo de respuesta: 145.3 ms
✅ Respuesta exitosa
📦 Tiles cargados: 12
📊 Features totales: 543

🗂️  TRANSPORTE:
   • rutas_nacionales: 47 features
   • rutas_provinciales: 123 features
   • caminos: 234 features

🗂️  HIDROGRAFIA:
   • cursos_agua: 89 features
   • espejos_agua: 23 features

🗂️  AREAS_URBANAS:
   • localidades: 27 features

🚀 Performance EXCELENTE (< 200ms)

[... más tests ...]

📊 RESUMEN DE PRUEBAS
======================================================================
✅ PASS - Buenos Aires
✅ PASS - Mendoza
✅ PASS - Patagonia Sur
✅ PASS - Área pequeña (Córdoba)

🎯 Total: 4/4 pruebas exitosas
🎉 ¡Todas las pruebas pasaron!
```

### Prueba Manual en Navegador

1. Abrir DevTools (F12)
2. Ir a la consola
3. Ejecutar:

```javascript
// Cargar capas para el área visible
await window.analisisTerreno.cargarCapasGISArea(['transporte']);

// Ver capas activas
console.log(window.analisisTerreno.capasGISActivas);

// Limpiar
window.analisisTerreno.limpiarCapasGIS();
```

---

## 🔧 Regenerar Tiles

Si necesitas regenerar los tiles (por ejemplo, con nuevas capas):

### 1. Actualizar Configuración

Editar `tools/convert_shapefiles_to_geojson.py`:

```python
LAYERS = {
    'Transporte': {
        'vial_nacional/vial_nacionalLine.shp': 'Transporte_GeoJSON/ruta_nacional.geojson',
        # Agregar nueva capa aquí
        'nueva_capa/nueva_capaLine.shp': 'Transporte_GeoJSON/nueva_capa.geojson',
    },
    # ...
}
```

Editar `tools/create_gis_tiles.py`:

```python
CAPAS_CONFIG = {
    'Transporte': {
        'ruta_nacional': 'Transporte_GeoJSON/ruta_nacional.geojson',
        # Agregar nueva capa aquí
        'nueva_capa': 'Transporte_GeoJSON/nueva_capa.geojson',
    },
    # ...
}
```

### 2. Ejecutar Scripts

```bash
# Convertir nuevas capas
python3 tools/convert_shapefiles_to_geojson.py

# Regenerar tiles
python3 tools/create_gis_tiles.py
```

### 3. Actualizar .gitignore

Los tiles **NO** se incluyen en el repositorio (son ~188 MB). Para compartir:

Opción A - **Incluir en .gitignore** (actual):
```gitignore
# Tiles GIS (generados por script)
Client/Libs/datos_argentina/*_Tiles/
```

Opción B - **Incluir en repo** (si el equipo lo necesita):
```bash
# Comentar línea en .gitignore
# Client/Libs/datos_argentina/*_Tiles/

git add Client/Libs/datos_argentina/*_Tiles/
git commit -m "feat: Agregar tiles GIS pre-generados"
```

---

## 📊 Performance

### Benchmarks

| Área | Bounds (grados) | Tiles | Features | Tiempo |
|------|----------------|-------|----------|---------|
| Buenos Aires (grande) | 1° × 1° | 12-15 | 500-600 | ~150ms |
| Mendoza (mediana) | 1° × 1° | 8-10 | 300-400 | ~100ms |
| Córdoba (pequeña) | 0.2° × 0.2° | 2-3 | 50-100 | ~50ms |
| Patagonia (dispersa) | 2° × 2° | 15-20 | 200-300 | ~180ms |

### Comparación

| Método | Tamaño | Tiempo | Features |
|--------|--------|--------|----------|
| **Tiles on-demand** | 50-600 KB | 50-200ms | Solo área visible |
| GeoJSON completo | 133 MB | 2-5 seg | País completo (177K) |

**Mejora**: ~25x más rápido, ~200x menos datos transferidos

---

## 🐛 Troubleshooting

### Error: "No se pudo conectar al servidor"

```bash
# Verificar que el servidor esté corriendo
ps aux | grep serverhttps

# Iniciar servidor
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
python3 Server/serverhttps.py
```

### Error: "Master index not found"

```bash
# Regenerar master index
python3 tools/create_gis_tiles.py
```

### Error: "Tiles vacíos (0 features)"

```bash
# Verificar que los tiles existen
ls -lh Client/Libs/datos_argentina/Transporte_Tiles/ruta_nacional/*.geojson | head -5

# Regenerar tiles si es necesario
python3 tools/create_gis_tiles.py
```

### Performance lenta (>500ms)

- Reducir área de consulta (bounds más pequeños)
- Verificar que solo se soliciten capas necesarias
- Comprobar tamaño de tiles individuales (`du -sh tile_*.geojson`)

---

## 📝 Notas Técnicas

### Algoritmo de Filtrado

```python
# Intersección espacial de tiles con bounds
def bounds_intersect(tile_bounds, query_bounds):
    return (
        tile_bounds['north'] >= query_bounds['south'] and
        tile_bounds['south'] <= query_bounds['north'] and
        tile_bounds['east'] >= query_bounds['west'] and
        tile_bounds['west'] <= query_bounds['east']
    )
```

### Optimizaciones

1. **Spatial Index**: GeoPandas usa R-tree para filtrado rápido
2. **Tiles Vacíos**: Omitidos automáticamente (no se guardan)
3. **Master Index**: Cargado una sola vez en memoria
4. **Lazy Loading**: Solo se cargan tiles relevantes

### Limitaciones

- Tiles fijos (0.5°) - no adaptativos por zoom
- No hay cache de tiles entre requests
- Simplificación de geometrías básica (Douglas-Peucker)

---

## 🚀 Próximas Mejoras

- [ ] Control UI para activar/desactivar capas (checkboxes)
- [ ] Aplicar modificadores GIS en análisis terreno:
  - Rutas: +velocidad, +transitabilidad
  - Ríos: -transitabilidad, obstáculos
  - Urbanas: +cobertura, -velocidad
- [ ] Cache de tiles en localStorage
- [ ] Tiles adaptativos por nivel de zoom
- [ ] Simplificación de geometrías por zoom
- [ ] Más capas: ferrocarriles, puentes, aeródromos

---

## 📚 Referencias

- **IGN**: https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG
- **GeoJSON Spec**: https://geojson.org/
- **Leaflet.js**: https://leafletjs.com/
- **GeoPandas**: https://geopandas.org/

---

**Última actualización**: 14 de noviembre de 2025  
**Versión**: 1.0  
**Autor**: MAIRA Team
