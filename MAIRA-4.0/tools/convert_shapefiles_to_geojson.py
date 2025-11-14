#!/usr/bin/env python3
"""
Script de conversión Shapefiles IGN → GeoJSON para MAIRA

Convierte capas vectoriales del IGN Argentina de Shapefile a GeoJSON,
simplificando geometrías para reducir peso manteniendo precisión táctica.

Autor: MAIRA Team
Fecha: Noviembre 2025
"""

import geopandas as gpd
import os
import sys
from pathlib import Path

# Configuración
INPUT_DIR = os.path.expanduser('~/Downloads/IGN_Shapefiles')
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'Client', 'Libs', 'datos_argentina'
)

# Mapeo de archivos (ajustar según nombres reales descargados)
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

# Tolerancias de simplificación por tipo de capa
TOLERANCES = {
    'Transporte': 0.0001,      # ~11 metros (rutas pueden ser más precisas)
    'Hidrografia': 0.0002,     # ~22 metros (cursos de agua pueden simplificarse más)
    'Areas_Urbanas': 0.00015,  # ~17 metros (localidades balance)
}


def convert_and_simplify(shp_path, geojson_path, tolerance=0.0001):
    """
    Convierte Shapefile a GeoJSON y simplifica geometrías.
    
    Args:
        shp_path: Ruta al archivo .shp
        geojson_path: Ruta de salida .geojson
        tolerance: Tolerancia Douglas-Peucker en grados decimales
                   0.0001° ≈ 11 metros (suficiente para escala táctica)
    
    Returns:
        dict: Estadísticas de conversión
    """
    try:
        print(f'\n📂 Leyendo {os.path.basename(shp_path)}...')
        gdf = gpd.read_file(shp_path)
        
        original_features = len(gdf)
        print(f'   ├─ Features: {original_features:,}')
        print(f'   ├─ CRS: {gdf.crs}')
        
        # Simplificar geometrías (reduce peso ~50-70%)
        print(f'✂️  Simplificando geometrías (tolerancia={tolerance}°)...')
        gdf['geometry'] = gdf['geometry'].simplify(tolerance, preserve_topology=True)
        
        # Convertir a WGS84 si no lo está
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            print(f'🗺️  Reproyectando a WGS84 (EPSG:4326)...')
            gdf = gdf.to_crs(epsg=4326)
        
        # Guardar GeoJSON
        os.makedirs(os.path.dirname(geojson_path), exist_ok=True)
        print(f'💾 Guardando {os.path.basename(geojson_path)}...')
        gdf.to_file(geojson_path, driver='GeoJSON')
        
        # Estadísticas
        size_mb = os.path.getsize(geojson_path) / (1024 * 1024)
        print(f'✅ {original_features:,} features → {size_mb:.2f} MB')
        
        return {
            'success': True,
            'features': original_features,
            'size_mb': size_mb,
            'output': geojson_path
        }
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return {
            'success': False,
            'error': str(e)
        }


def main():
    """Ejecuta conversión de todas las capas."""
    
    print('='*70)
    print('🗺️  CONVERSIÓN SHAPEFILES IGN → GEOJSON PARA MAIRA')
    print('='*70)
    
    print(f'\n📁 Directorio entrada: {INPUT_DIR}')
    print(f'📁 Directorio salida: {OUTPUT_DIR}')
    
    # Verificar directorio entrada
    if not os.path.exists(INPUT_DIR):
        print(f'\n❌ ERROR: No existe {INPUT_DIR}')
        print(f'\n💡 Crea el directorio y descarga los Shapefiles del IGN:')
        print(f'   https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG')
        sys.exit(1)
    
    # Estadísticas globales
    total_converted = 0
    total_failed = 0
    total_size_mb = 0.0
    
    # Procesar por categoría
    for category, files in LAYERS.items():
        print(f'\n{'='*70}')
        print(f'📁 {category}')
        print('='*70)
        
        tolerance = TOLERANCES.get(category, 0.0001)
        
        for shp_file, geojson_file in files.items():
            shp_path = os.path.join(INPUT_DIR, shp_file)
            geojson_path = os.path.join(OUTPUT_DIR, geojson_file)
            
            if os.path.exists(shp_path):
                result = convert_and_simplify(shp_path, geojson_path, tolerance)
                
                if result['success']:
                    total_converted += 1
                    total_size_mb += result['size_mb']
                else:
                    total_failed += 1
            else:
                print(f'\n⚠️  No encontrado: {shp_file}')
                print(f'   Ruta buscada: {shp_path}')
                total_failed += 1
    
    # Resumen final
    print(f'\n{'='*70}')
    print('📊 RESUMEN')
    print('='*70)
    print(f'✅ Convertidos: {total_converted}')
    print(f'❌ Fallidos: {total_failed}')
    print(f'💾 Peso total: {total_size_mb:.2f} MB')
    print(f'📁 Ubicación: {OUTPUT_DIR}')
    
    if total_converted > 0:
        print(f'\n🎉 ¡Listo! Capas GeoJSON disponibles en MAIRA')
        print(f'\n🔧 Próximo paso: Integrar en serverhttps.py')
        print(f'   Ver: docs/INTEGRACION_CAPAS_GIS_IGN.md')
    else:
        print(f'\n⚠️  No se convirtió ninguna capa')
        print(f'\n💡 Verifica:')
        print(f'   1. Descargaste los Shapefiles del IGN')
        print(f'   2. Los archivos están en: {INPUT_DIR}')
        print(f'   3. Los nombres coinciden con LAYERS en este script')


if __name__ == '__main__':
    # Verificar dependencias
    try:
        import geopandas
        import shapely
    except ImportError as e:
        print('❌ Error: Falta instalar dependencias')
        print('\n💡 Ejecuta:')
        print('   pip3 install geopandas shapely fiona')
        sys.exit(1)
    
    main()
