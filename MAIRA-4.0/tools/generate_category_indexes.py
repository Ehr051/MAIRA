#!/usr/bin/env python3
"""
Generar master_index.json individual para cada categoría de tiles
Patrón: {categoria}_master_index.json (ej: transporte_master_index.json)
"""

import json
import os
from pathlib import Path

# Directorios
BASE_DIR = Path(__file__).parent.parent / 'Client' / 'Libs' / 'datos_argentina'

# Categorías de tiles a procesar
TILE_CATEGORIES = [
    'Transporte_Tiles',
    'Hidrografia_Tiles',
    'Areas_Urbanas_Tiles',
    'Comunicaciones_Tiles',
    'Suelos_Tiles',
    'Vegetacion_Tiles',
    'Geomorfologia_Tiles'
]

def calculate_bounds_from_tiles(layer_dir):
    """Calcular bounds geográficos leyendo los tiles"""
    min_lon, min_lat = float('inf'), float('inf')
    max_lon, max_lat = float('-inf'), float('-inf')
    
    for tile_file in layer_dir.glob('*.geojson'):
        try:
            with open(tile_file, 'r', encoding='utf-8') as f:
                tile_data = json.load(f)
                
                # Leer bounds del tile si existen
                if 'bbox' in tile_data:
                    bbox = tile_data['bbox']
                    min_lon = min(min_lon, bbox[0])
                    min_lat = min(min_lat, bbox[1])
                    max_lon = max(max_lon, bbox[2])
                    max_lat = max(max_lat, bbox[3])
                else:
                    # Calcular de features
                    for feature in tile_data.get('features', []):
                        geom = feature.get('geometry', {})
                        coords = geom.get('coordinates', [])
                        if coords:
                            # Simplificado - asumir Point/LineString
                            if geom.get('type') == 'Point':
                                min_lon = min(min_lon, coords[0])
                                max_lon = max(max_lon, coords[0])
                                min_lat = min(min_lat, coords[1])
                                max_lat = max(max_lat, coords[1])
        except:
            pass
    
    if min_lon == float('inf'):
        return None
    
    return {
        'west': round(min_lon, 2),
        'east': round(max_lon, 2),
        'south': round(min_lat, 2),
        'north': round(max_lat, 2)
    }

def process_category(category_name):
    """Procesar una categoría completa y generar su master_index.json"""
    category_path = BASE_DIR / category_name
    
    if not category_path.exists():
        print(f'  ⏭️  {category_name:30s} → No existe')
        return None
    
    # Información de las capas
    layers = {}
    total_features = 0
    total_tiles = 0
    category_bounds = {
        'west': float('inf'),
        'east': float('-inf'),
        'south': float('inf'),
        'north': float('-inf')
    }
    
    # Procesar cada subcapa
    for layer_dir in category_path.iterdir():
        if not layer_dir.is_dir():
            continue
        
        layer_name = layer_dir.name
        
        # Contar tiles y features
        tiles_created = 0
        layer_features = 0
        
        for tile_file in layer_dir.glob('*.geojson'):
            tiles_created += 1
            
            try:
                with open(tile_file, 'r', encoding='utf-8') as f:
                    tile_data = json.load(f)
                    layer_features += len(tile_data.get('features', []))
            except:
                pass
        
        # Calcular bounds de la capa
        layer_bounds = calculate_bounds_from_tiles(layer_dir)
        
        # Actualizar bounds generales
        if layer_bounds:
            category_bounds['west'] = min(category_bounds['west'], layer_bounds['west'])
            category_bounds['east'] = max(category_bounds['east'], layer_bounds['east'])
            category_bounds['south'] = min(category_bounds['south'], layer_bounds['south'])
            category_bounds['north'] = max(category_bounds['north'], layer_bounds['north'])
        
        layers[layer_name] = {
            'total_features': layer_features,
            'tiles_created': tiles_created,
            'bounds': layer_bounds
        }
        
        total_features += layer_features
        total_tiles += tiles_created
    
    # Validar bounds
    if category_bounds['west'] == float('inf'):
        category_bounds = {
            'west': -73.5,
            'east': -53.5,
            'south': -55.0,
            'north': -21.5
        }
    
    # Crear master index para esta categoría
    category_clean = category_name.replace('_Tiles', '').lower()
    
    master_index = {
        'version': '1.0',
        'category': category_name.replace('_Tiles', ''),
        'description': f'Índice maestro de capas {category_clean}',
        'tile_size_degrees': 0.5,
        'tile_size_km_approx': 55.5,
        'bounds': category_bounds,
        'total_layers': len(layers),
        'total_features': total_features,
        'total_tiles': total_tiles,
        'layers': layers
    }
    
    # Guardar archivo
    output_file = category_path / f'{category_clean}_master_index.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(master_index, f, indent=2, ensure_ascii=False)
    
    print(f'  ✅ {category_name:30s} → {len(layers)} capas, {total_features:,} features, {total_tiles:,} tiles')
    return output_file

def main():
    print('\n🔧 GENERANDO MASTER INDEX POR CATEGORÍA')
    print('=' * 80)
    
    created_files = []
    
    for category in TILE_CATEGORIES:
        result = process_category(category)
        if result:
            created_files.append(result)
    
    print('\n' + '=' * 80)
    print('📊 RESUMEN:')
    print(f'   Categorías procesadas: {len(created_files)}')
    print(f'\n   Archivos creados:')
    for f in created_files:
        print(f'     • {f.name}')
    print('\n✅ ¡Master indexes individuales generados exitosamente!')

if __name__ == '__main__':
    main()
