#!/usr/bin/env python3
"""
Script simplificado para dividir tiles por provincias
Solo crea los JSON, no los TAR.GZ (esos se crean después)
"""

import json
import os
from pathlib import Path

def crear_tiles_por_provincias():
    # Archivos de entrada
    INPUT_JSON = "external_storage/indices/index_tiles_altimetria.json"
    INPUT_VEG_JSON = "external_storage/indices/vegetacion_tile_index.json"
    OUTPUT_DIR = "tiles_por_provincias"
    
    print("🗺️  DIVISIÓN POR PROVINCIAS ARGENTINAS (Solo JSON)")
    print("=" * 50)
    
    # Leer datos
    data = {}
    veg_data = {}
    
    if os.path.exists(INPUT_JSON):
        with open(INPUT_JSON, 'r') as f:
            data = json.load(f)
        print(f"📄 Altimetría: {len(data.get('tiles', {}))} tiles")
    
    if os.path.exists(INPUT_VEG_JSON):
        with open(INPUT_VEG_JSON, 'r') as f:
            veg_data = json.load(f)
        print(f"🌿 Vegetación: {len(veg_data.get('tiles', {}))} tiles")
    
    # Provincias argentinas (simplificado)
    provincias = {
        'norte': {'lat_range': [-30, -21], 'lon_range': [-70, -53], 'alt': {}, 'veg': {}},
        'centro_norte': {'lat_range': [-37, -30], 'lon_range': [-68, -55], 'alt': {}, 'veg': {}},
        'centro': {'lat_range': [-42, -37], 'lon_range': [-70, -56], 'alt': {}, 'veg': {}},
        'sur': {'lat_range': [-50, -42], 'lon_range': [-73, -62], 'alt': {}, 'veg': {}},
        'patagonia': {'lat_range': [-56, -50], 'lon_range': [-75, -63], 'alt': {}, 'veg': {}},
        'otros': {'lat_range': [-60, -20], 'lon_range': [-80, -50], 'alt': {}, 'veg': {}}
    }
    
    def asignar_provincia(lat, lon):
        for prov, info in provincias.items():
            if prov == 'otros':
                continue
            lat_min, lat_max = info['lat_range']
            lon_min, lon_max = info['lon_range']
            if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
                return prov
        return 'otros'
    
    # Clasificar altimetría
    if 'tiles' in data:
        for tile_id, tile_info in data['tiles'].items():
            bounds = tile_info['bounds']
            lat = (bounds['north'] + bounds['south']) / 2
            lon = (bounds['east'] + bounds['west']) / 2
            
            prov = asignar_provincia(lat, lon)
            provincias[prov]['alt'][tile_id] = tile_info
    
    # Clasificar vegetación (estructura diferente)
    if 'tiles' in veg_data:
        for tile_id, tile_array in veg_data['tiles'].items():
            # Cada tile puede tener múltiples archivos, tomar el primero
            if isinstance(tile_array, list) and len(tile_array) > 0:
                tile_info = tile_array[0]  # Tomar el primer elemento
                bounds = tile_info['bounds']
                lat = (bounds['north'] + bounds['south']) / 2
                lon = (bounds['east'] + bounds['west']) / 2
                
                prov = asignar_provincia(lat, lon)
                # Guardar toda la info del array, no solo el primer elemento
                provincias[prov]['veg'][tile_id] = tile_array
    
    # Crear directorio
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Crear archivos por provincia
    for prov_name, prov_data in provincias.items():
        alt_count = len(prov_data['alt'])
        veg_count = len(prov_data['veg'])
        
        if alt_count == 0 and veg_count == 0:
            continue
            
        print(f"📦 {prov_name}: {alt_count} altimetría, {veg_count} vegetación")
        
        # JSON altimetría
        if alt_count > 0:
            alt_json = {
                'tiles': prov_data['alt'],
                'metadata': {
                    'provincia': prov_name,
                    'tipo': 'altimetria',
                    'total_tiles': alt_count
                }
            }
            
            with open(f"{OUTPUT_DIR}/altimetria_{prov_name}.json", 'w') as f:
                json.dump(alt_json, f, indent=2)
        
        # JSON vegetación
        if veg_count > 0:
            veg_json = {
                'tiles': prov_data['veg'],
                'metadata': {
                    'provincia': prov_name,
                    'tipo': 'vegetacion',
                    'total_tiles': veg_count
                }
            }
            
            with open(f"{OUTPUT_DIR}/vegetacion_{prov_name}.json", 'w') as f:
                json.dump(veg_json, f, indent=2)
    
    # Índice maestro
    master = {
        'provincias': {},
        'metadata': {
            'description': 'Tiles divididos por provincias argentinas',
            'tipos': ['altimetria', 'vegetacion']
        }
    }
    
    for prov_name, prov_data in provincias.items():
        alt_count = len(prov_data['alt'])
        veg_count = len(prov_data['veg'])
        
        if alt_count > 0 or veg_count > 0:
            master['provincias'][prov_name] = {
                'altimetria_tiles': alt_count,
                'vegetacion_tiles': veg_count,
                'archivos': []
            }
            
            if alt_count > 0:
                master['provincias'][prov_name]['archivos'].extend([
                    f"altimetria_{prov_name}.json",
                    f"altimetria_{prov_name}.tar.gz"
                ])
            
            if veg_count > 0:
                master['provincias'][prov_name]['archivos'].extend([
                    f"vegetacion_{prov_name}.json",
                    f"vegetacion_{prov_name}.tar.gz"
                ])
    
    with open(f"{OUTPUT_DIR}/master_index_provincias.json", 'w') as f:
        json.dump(master, f, indent=2)
    
    print("✅ División por provincias completada!")
    print(f"📊 {len(master['provincias'])} provincias con datos")
    print(f"📁 Archivos creados en: {OUTPUT_DIR}/")

if __name__ == "__main__":
    crear_tiles_por_provincias()
