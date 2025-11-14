#!/usr/bin/env python3
"""
Divide capas GeoJSON grandes en tiles espaciales para carga on-demand

Similar al sistema de mini-tiles de altimetría, divide los GeoJSON
de transporte, hidrografía y áreas urbanas en grillas pequeñas
para cargar solo las features relevantes según el área de operaciones.

Autor: MAIRA Team
Fecha: Noviembre 2025
"""

import geopandas as gpd
import json
import os
import sys
from pathlib import Path
from shapely.geometry import box
import math

# Configuración
BASE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'Client', 'Libs', 'datos_argentina'
)

# Tamaño de tile en grados (aprox 1° = 111 km)
# 0.5° × 0.5° ≈ 55km × 55km (suficiente para operaciones tácticas)
TILE_SIZE_DEGREES = 0.5

# Bounds de Argentina
ARGENTINA_BOUNDS = {
    'west': -73.5,    # Oeste (Andes)
    'east': -53.5,    # Este (Atlántico)
    'south': -55.0,   # Sur (Tierra del Fuego)
    'north': -21.5    # Norte (frontera Bolivia)
}

# Capas a procesar
LAYERS_TO_TILE = {
    'Transporte_GeoJSON/ruta_nacional.geojson': 'Transporte_Tiles',
    'Transporte_GeoJSON/ruta_provincial.geojson': 'Transporte_Tiles',
    'Transporte_GeoJSON/caminos.geojson': 'Transporte_Tiles',
    'Hidrografia_GeoJSON/curso_agua_permanente.geojson': 'Hidrografia_Tiles',
    'Hidrografia_GeoJSON/espejo_agua_permanente.geojson': 'Hidrografia_Tiles',
    'Areas_Urbanas_GeoJSON/localidades.geojson': 'Areas_Urbanas_Tiles',
}


def create_grid(bounds, tile_size):
    """
    Crea grilla de tiles cubriendo el área.
    
    Args:
        bounds: Dict con west, east, south, north
        tile_size: Tamaño del tile en grados
    
    Returns:
        List de dicts con info de cada tile
    """
    tiles = []
    
    lon_start = bounds['west']
    lon_end = bounds['east']
    lat_start = bounds['south']
    lat_end = bounds['north']
    
    # Calcular número de tiles
    n_cols = math.ceil((lon_end - lon_start) / tile_size)
    n_rows = math.ceil((lat_end - lat_start) / tile_size)
    
    print(f'📐 Grilla: {n_cols} columnas × {n_rows} filas = {n_cols * n_rows} tiles')
    
    tile_id = 0
    for col in range(n_cols):
        for row in range(n_rows):
            west = lon_start + (col * tile_size)
            east = min(west + tile_size, lon_end)
            south = lat_start + (row * tile_size)
            north = min(south + tile_size, lat_end)
            
            tiles.append({
                'id': f'tile_{col}_{row}',
                'tile_id': tile_id,
                'col': col,
                'row': row,
                'bounds': {
                    'west': round(west, 4),
                    'east': round(east, 4),
                    'south': round(south, 4),
                    'north': round(north, 4)
                },
                'geometry': box(west, south, east, north)
            })
            tile_id += 1
    
    return tiles


def split_geojson_into_tiles(geojson_path, output_dir, tiles, layer_name):
    """
    Divide GeoJSON en tiles espaciales.
    
    Args:
        geojson_path: Ruta al GeoJSON original
        output_dir: Directorio de salida para tiles
        tiles: Lista de tiles de create_grid()
        layer_name: Nombre de la capa (para logging)
    
    Returns:
        Dict con estadísticas
    """
    print(f'\n📂 Procesando: {layer_name}')
    print(f'   Leyendo {os.path.basename(geojson_path)}...')
    
    # Leer GeoJSON original
    gdf = gpd.read_file(geojson_path)
    print(f'   ├─ {len(gdf)} features totales')
    
    # Asegurar CRS
    if gdf.crs is None or gdf.crs.to_epsg() != 4326:
        print(f'   ├─ Convirtiendo a WGS84...')
        gdf = gdf.to_crs(epsg=4326)
    
    # Crear directorio de salida
    os.makedirs(output_dir, exist_ok=True)
    
    # Estadísticas
    tiles_created = 0
    total_features_saved = 0
    empty_tiles = 0
    
    # Procesar cada tile
    for tile_info in tiles:
        tile_geom = tile_info['geometry']
        tile_id = tile_info['id']
        
        # Filtrar features que intersectan el tile
        # Usar spatial index para eficiencia
        features_in_tile = gdf[gdf.intersects(tile_geom)]
        
        if len(features_in_tile) > 0:
            # Guardar tile
            tile_filename = f'{tile_id}.geojson'
            tile_path = os.path.join(output_dir, tile_filename)
            
            features_in_tile.to_file(tile_path, driver='GeoJSON')
            
            tiles_created += 1
            total_features_saved += len(features_in_tile)
            
            # Actualizar metadata del tile
            tile_info['filename'] = tile_filename
            tile_info['feature_count'] = len(features_in_tile)
            tile_info['size_bytes'] = os.path.getsize(tile_path)
        else:
            empty_tiles += 1
            tile_info['filename'] = None
            tile_info['feature_count'] = 0
            tile_info['size_bytes'] = 0
    
    print(f'   ✅ {tiles_created} tiles creados')
    print(f'   ⚪ {empty_tiles} tiles vacíos (omitidos)')
    print(f'   📊 {total_features_saved} features guardadas')
    
    return {
        'total_features': len(gdf),
        'tiles_created': tiles_created,
        'empty_tiles': empty_tiles,
        'features_saved': total_features_saved
    }


def create_master_index(tiles, output_path, stats_by_layer):
    """
    Crea índice maestro JSON con metadata de todos los tiles.
    
    Args:
        tiles: Lista de tiles con metadata
        output_path: Ruta para guardar master_index.json
        stats_by_layer: Dict con estadísticas por capa
    """
    # Filtrar tiles vacíos
    tiles_with_data = [t for t in tiles if t.get('feature_count', 0) > 0]
    
    # Crear índice
    master_index = {
        'version': '1.0',
        'description': 'Índice maestro de tiles GIS para MAIRA',
        'tile_size_degrees': TILE_SIZE_DEGREES,
        'tile_size_km_approx': round(TILE_SIZE_DEGREES * 111, 1),
        'bounds': ARGENTINA_BOUNDS,
        'total_tiles': len(tiles_with_data),
        'layers': stats_by_layer,
        'tiles': {}
    }
    
    # Agregar metadata de cada tile
    for tile in tiles_with_data:
        tile_id = tile['id']
        # Remover geometría (no serializable en JSON)
        tile_data = {k: v for k, v in tile.items() if k != 'geometry'}
        master_index['tiles'][tile_id] = tile_data
    
    # Guardar índice
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(master_index, f, indent=2, ensure_ascii=False)
    
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f'\n💾 Master index guardado: {os.path.basename(output_path)} ({size_mb:.2f} MB)')


def main():
    """Ejecuta división de capas en tiles."""
    
    print('='*70)
    print('🗺️  DIVISIÓN DE CAPAS GIS EN TILES ESPACIALES')
    print('='*70)
    
    print(f'\n📁 Directorio base: {BASE_DIR}')
    print(f'📐 Tamaño tile: {TILE_SIZE_DEGREES}° (~{TILE_SIZE_DEGREES * 111:.1f} km)')
    
    # Crear grilla de tiles
    print(f'\n🌎 Generando grilla para Argentina...')
    tiles = create_grid(ARGENTINA_BOUNDS, TILE_SIZE_DEGREES)
    
    # Procesar cada capa
    stats_by_layer = {}
    
    for geojson_rel_path, output_subdir in LAYERS_TO_TILE.items():
        geojson_path = os.path.join(BASE_DIR, geojson_rel_path)
        
        if not os.path.exists(geojson_path):
            print(f'\n⚠️  Archivo no encontrado: {geojson_rel_path}')
            continue
        
        # Directorio de salida
        output_dir = os.path.join(BASE_DIR, output_subdir)
        
        # Dividir en tiles
        layer_name = os.path.basename(geojson_rel_path).replace('.geojson', '')
        stats = split_geojson_into_tiles(
            geojson_path,
            os.path.join(output_dir, layer_name),
            tiles,
            layer_name
        )
        
        stats_by_layer[layer_name] = stats
    
    # Crear índice maestro
    master_index_path = os.path.join(BASE_DIR, 'gis_tiles_master_index.json')
    create_master_index(tiles, master_index_path, stats_by_layer)
    
    # Resumen final
    print('\n' + '='*70)
    print('📊 RESUMEN FINAL')
    print('='*70)
    
    total_tiles = sum(s['tiles_created'] for s in stats_by_layer.values())
    total_features = sum(s['total_features'] for s in stats_by_layer.values())
    
    print(f'✅ Capas procesadas: {len(stats_by_layer)}')
    print(f'📦 Tiles creados: {total_tiles}')
    print(f'📊 Features totales: {total_features:,}')
    
    print(f'\n📁 Estructura generada:')
    print(f'   {BASE_DIR}/')
    print(f'   ├── gis_tiles_master_index.json')
    for output_dir in set(LAYERS_TO_TILE.values()):
        print(f'   └── {output_dir}/')
        for layer in [k.split('/')[-1].replace('.geojson', '') 
                      for k, v in LAYERS_TO_TILE.items() if v == output_dir]:
            print(f'       └── {layer}/')
            print(f'           ├── tile_0_0.geojson')
            print(f'           ├── tile_0_1.geojson')
            print(f'           └── ...')
    
    print(f'\n🎉 ¡Listo! Tiles GIS disponibles para carga on-demand')


if __name__ == '__main__':
    # Verificar dependencias
    try:
        import geopandas
        import shapely
    except ImportError as e:
        print('❌ Error: Falta instalar dependencias')
        print('\n💡 Ejecuta:')
        print('   pip3 install geopandas shapely')
        sys.exit(1)
    
    main()
