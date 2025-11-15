#!/usr/bin/env python3
"""
Regenerar índice maestro de todas las capas GIS procesadas
"""

import json
import os
from pathlib import Path

# Directorios
BASE_DIR = Path(__file__).parent.parent / 'Client' / 'Libs' / 'datos_argentina'
OUTPUT_FILE = BASE_DIR / 'gis_tiles_master_index.json'

# Categorías de tiles
TILE_CATEGORIES = [
    'Transporte_Tiles',
    'Hidrografia_Tiles',
    'Areas_Urbanas_Tiles',
    'Comunicaciones_Tiles',
    'Suelos_Tiles',
    'Vegetacion_Tiles',
    'Geomorfologia_Tiles'
]

def scan_all_layers():
    """Escanear todas las carpetas de tiles y contar features"""
    layers = {}
    total_tiles_count = 0
    
    for category in TILE_CATEGORIES:
        category_path = BASE_DIR / category
        
        if not category_path.exists():
            continue
            
        # Iterar por cada capa dentro de la categoría
        for layer_dir in category_path.iterdir():
            if not layer_dir.is_dir():
                continue
                
            layer_name = layer_dir.name
            
            # Contar tiles y features
            tiles_created = 0
            total_features = 0
            
            for tile_file in layer_dir.glob('*.geojson'):
                tiles_created += 1
                total_tiles_count += 1
                
                # Leer features del tile
                try:
                    with open(tile_file, 'r', encoding='utf-8') as f:
                        tile_data = json.load(f)
                        total_features += len(tile_data.get('features', []))
                except:
                    pass
            
            layers[layer_name] = {
                'total_features': total_features,
                'tiles_created': tiles_created,
                'category': category.replace('_Tiles', '')
            }
            
            print(f'  ✅ {layer_name:35s} → {total_features:6,d} features ({tiles_created:4d} tiles)')
    
    return layers, total_tiles_count

def main():
    print('🔄 REGENERANDO ÍNDICE MAESTRO DE CAPAS GIS')
    print('=' * 70)
    
    layers, total_tiles = scan_all_layers()
    
    # Crear índice maestro
    master_index = {
        'version': '2.0',
        'description': 'Índice maestro completo de capas GIS para MAIRA',
        'tile_size_degrees': 0.5,
        'tile_size_km_approx': 55.5,
        'bounds': {
            'west': -73.5,
            'east': -53.5,
            'south': -55.0,
            'north': -21.5
        },
        'total_tiles': total_tiles,
        'total_layers': len(layers),
        'layers': layers,
        'categories': {
            'Transporte': [k for k, v in layers.items() if v['category'] == 'Transporte'],
            'Hidrografia': [k for k, v in layers.items() if v['category'] == 'Hidrografia'],
            'Areas_Urbanas': [k for k, v in layers.items() if v['category'] == 'Areas_Urbanas'],
            'Comunicaciones': [k for k, v in layers.items() if v['category'] == 'Comunicaciones'],
            'Suelos': [k for k, v in layers.items() if v['category'] == 'Suelos'],
            'Vegetacion': [k for k, v in layers.items() if v['category'] == 'Vegetacion'],
            'Geomorfologia': [k for k, v in layers.items() if v['category'] == 'Geomorfologia']
        }
    }
    
    # Guardar índice
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(master_index, f, indent=2, ensure_ascii=False)
    
    print('\n' + '=' * 70)
    print('📊 RESUMEN FINAL:')
    print(f'   Total capas: {len(layers)}')
    print(f'   Total tiles: {total_tiles:,}')
    print(f'   Archivo: {OUTPUT_FILE}')
    print('\n✅ ¡Índice maestro regenerado exitosamente!')

if __name__ == '__main__':
    main()
