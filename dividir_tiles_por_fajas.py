#!/usr/bin/env python3
"""
Script para dividir el índice de tiles por PROVINCIAS ARGENTINAS
y crear archivos tar.gz pequeños por región específica
INCLUYE VEGETACIÓN también
"""

import json
import os
import tarfile
import shutil
from pathlib import Path

def dividir_tiles_por_provincias(input_json_path, input_veg_json_path, tiles_dir, veg_dir, output_dir):
    """
    Divide los tiles por provincias argentinas según coordenadas
    """
    
    # Leer índices
    data = {}
    veg_data = {}
    
    # Leer altimetría
    if os.path.exists(input_json_path):
        with open(input_json_path, 'r') as f:
            data = json.load(f)
        print(f"🗺️  Altimetría: {len(data.get('tiles', {}))} tiles")
    
    # Leer vegetación
    if input_veg_json_path and os.path.exists(input_veg_json_path):
        with open(input_veg_json_path, 'r') as f:
            veg_data = json.load(f)
        print(f"🌿 Vegetación: {len(veg_data.get('tiles', {}))} tiles")
    
    # Definir provincias argentinas por coordenadas (aproximadas)
    provincias = {
        # NORTE
        'jujuy': {'lat_min': -24.5, 'lat_max': -21.5, 'lon_min': -67.0, 'lon_max': -64.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'salta': {'lat_min': -26.0, 'lat_max': -21.5, 'lon_min': -68.5, 'lon_max': -62.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'formosa': {'lat_min': -26.5, 'lat_max': -22.0, 'lon_min': -62.5, 'lon_max': -57.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'chaco': {'lat_min': -28.0, 'lat_max': -24.0, 'lon_min': -63.5, 'lon_max': -58.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'tucuman': {'lat_min': -28.0, 'lat_max': -26.0, 'lon_min': -66.5, 'lon_max': -64.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'catamarca': {'lat_min': -29.5, 'lat_max': -25.5, 'lon_min': -69.0, 'lon_max': -65.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'santiago_del_estero': {'lat_min': -30.0, 'lat_max': -26.0, 'lon_min': -65.5, 'lon_max': -61.0, 'tiles_alt': {}, 'tiles_veg': {}},
        
        # CENTRO-NORTE
        'misiones': {'lat_min': -28.0, 'lat_max': -25.5, 'lon_min': -56.5, 'lon_max': -53.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'corrientes': {'lat_min': -30.5, 'lat_max': -27.0, 'lon_min': -59.5, 'lon_max': -55.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'entre_rios': {'lat_min': -34.0, 'lat_max': -30.0, 'lon_min': -60.5, 'lon_max': -57.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'santa_fe': {'lat_min': -34.0, 'lat_max': -28.0, 'lon_min': -63.0, 'lon_max': -59.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'cordoba': {'lat_min': -35.0, 'lat_max': -29.5, 'lon_min': -66.0, 'lon_max': -62.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'san_luis': {'lat_min': -34.5, 'lat_max': -32.0, 'lon_min': -67.5, 'lon_max': -65.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'la_rioja': {'lat_min': -31.5, 'lat_max': -28.0, 'lon_min': -69.5, 'lon_max': -66.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'san_juan': {'lat_min': -33.0, 'lat_max': -30.0, 'lon_min': -70.0, 'lon_max': -67.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'mendoza': {'lat_min': -37.5, 'lat_max': -32.0, 'lon_min': -70.5, 'lon_max': -66.5, 'tiles_alt': {}, 'tiles_veg': {}},
        
        # CENTRO
        'buenos_aires': {'lat_min': -39.5, 'lat_max': -33.5, 'lon_min': -63.5, 'lon_max': -56.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'la_pampa': {'lat_min': -39.0, 'lat_max': -35.0, 'lon_min': -68.0, 'lon_max': -63.0, 'tiles_alt': {}, 'tiles_veg': {}},
        
        # SUR
        'rio_negro': {'lat_min': -42.0, 'lat_max': -37.5, 'lon_min': -71.5, 'lon_max': -62.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'neuquen': {'lat_min': -41.0, 'lat_max': -36.0, 'lon_min': -71.5, 'lon_max': -68.0, 'tiles_alt': {}, 'tiles_veg': {}},
        'chubut': {'lat_min': -46.5, 'lat_max': -42.0, 'lon_min': -72.0, 'lon_max': -63.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'santa_cruz': {'lat_min': -52.5, 'lat_max': -46.0, 'lon_min': -73.5, 'lon_max': -65.5, 'tiles_alt': {}, 'tiles_veg': {}},
        'tierra_del_fuego': {'lat_min': -55.5, 'lat_max': -52.5, 'lon_min': -69.0, 'lon_max': -63.5, 'tiles_alt': {}, 'tiles_veg': {}},
        
        # RESTO (para tiles que no encajen exactamente)
        'otros': {'lat_min': -60, 'lat_max': -20, 'lon_min': -80, 'lon_max': -50, 'tiles_alt': {}, 'tiles_veg': {}}
    }
    
    def asignar_provincia(lat, lon):
        """Determina la provincia según coordenadas"""
        for prov_name, prov_info in provincias.items():
            if prov_name == 'otros':
                continue
            if (prov_info['lat_min'] <= lat <= prov_info['lat_max'] and 
                prov_info['lon_min'] <= lon <= prov_info['lon_max']):
                return prov_name
        return 'otros'  # Si no encaja en ninguna
    
    # Clasificar tiles de altimetría
    if 'tiles' in data:
        for tile_id, tile_info in data['tiles'].items():
            bounds = tile_info['bounds']
            lat_center = (bounds['north'] + bounds['south']) / 2
            lon_center = (bounds['east'] + bounds['west']) / 2
            
            provincia = asignar_provincia(lat_center, lon_center)
            provincias[provincia]['tiles_alt'][tile_id] = tile_info
    
    # Clasificar tiles de vegetación
    if 'tiles' in veg_data:
        for tile_id, tile_info in veg_data['tiles'].items():
            bounds = tile_info['bounds']
            lat_center = (bounds['north'] + bounds['south']) / 2
            lon_center = (bounds['east'] + bounds['west']) / 2
            
            provincia = asignar_provincia(lat_center, lon_center)
            provincias[provincia]['tiles_veg'][tile_id] = tile_info
    
    # Crear directorio de salida
    os.makedirs(output_dir, exist_ok=True)
    
    # Procesar cada provincia
    for prov_name, prov_data in provincias.items():
        total_tiles = len(prov_data['tiles_alt']) + len(prov_data['tiles_veg'])
        
        if total_tiles == 0:
            continue
            
        print(f"📦 Procesando {prov_name}: {len(prov_data['tiles_alt'])} altimetría + {len(prov_data['tiles_veg'])} vegetación")
        
        # === ALTIMETRÍA ===
        if prov_data['tiles_alt']:
            # JSON altimetría
            alt_json = {
                'tiles': prov_data['tiles_alt'],
                'metadata': {
                    'provincia': prov_name,
                    'tipo': 'altimetria',
                    'total_tiles': len(prov_data['tiles_alt'])
                }
            }
            
            alt_json_filename = f"altimetria_{prov_name}.json"
            alt_json_path = os.path.join(output_dir, alt_json_filename)
            
            with open(alt_json_path, 'w') as f:
                json.dump(alt_json, f, indent=2)
            
            # TAR.GZ altimetría
            if tiles_dir and os.path.exists(tiles_dir):
                alt_tar_filename = f"altimetria_{prov_name}.tar.gz"
                alt_tar_path = os.path.join(output_dir, alt_tar_filename)
                
                with tarfile.open(alt_tar_path, 'w:gz') as tar:
                    for tile_id, tile_info in prov_data['tiles_alt'].items():
                        tif_filename = tile_info['filename']
                        tif_path = os.path.join(tiles_dir, tif_filename)
                        
                        if os.path.exists(tif_path):
                            tar.add(tif_path, arcname=tif_filename)
                
                # Mostrar tamaño
                if os.path.exists(alt_tar_path):
                    size_mb = os.path.getsize(alt_tar_path) / (1024 * 1024)
                    print(f"   ✅ Altimetría: {alt_tar_filename} ({size_mb:.1f} MB)")
        
        # === VEGETACIÓN ===
        if prov_data['tiles_veg']:
            # JSON vegetación
            veg_json = {
                'tiles': prov_data['tiles_veg'],
                'metadata': {
                    'provincia': prov_name,
                    'tipo': 'vegetacion',
                    'total_tiles': len(prov_data['tiles_veg'])
                }
            }
            
            veg_json_filename = f"vegetacion_{prov_name}.json"
            veg_json_path = os.path.join(output_dir, veg_json_filename)
            
            with open(veg_json_path, 'w') as f:
                json.dump(veg_json, f, indent=2)
            
            # TAR.GZ vegetación
            if veg_dir and os.path.exists(veg_dir):
                veg_tar_filename = f"vegetacion_{prov_name}.tar.gz"
                veg_tar_path = os.path.join(output_dir, veg_tar_filename)
                
                with tarfile.open(veg_tar_path, 'w:gz') as tar:
                    for tile_id, tile_info in prov_data['tiles_veg'].items():
                        tif_filename = tile_info['filename']
                        tif_path = os.path.join(veg_dir, tif_filename)
                        
                        if os.path.exists(tif_path):
                            tar.add(tif_path, arcname=tif_filename)
                
                # Mostrar tamaño
                if os.path.exists(veg_tar_path):
                    size_mb = os.path.getsize(veg_tar_path) / (1024 * 1024)
                    print(f"   ✅ Vegetación: {veg_tar_filename} ({size_mb:.1f} MB)")
    
    # Crear índice maestro por provincias
    master_index = {
        'provincias': {},
        'metadata': {
            'description': 'Índice maestro de tiles divididos por provincias argentinas',
            'incluye': ['altimetria', 'vegetacion']
        }
    }
    
    for prov_name, prov_data in provincias.items():
        if len(prov_data['tiles_alt']) > 0 or len(prov_data['tiles_veg']) > 0:
            master_index['provincias'][prov_name] = {
                'altimetria': {
                    'json_file': f"altimetria_{prov_name}.json",
                    'tar_file': f"altimetria_{prov_name}.tar.gz",
                    'tiles_count': len(prov_data['tiles_alt'])
                } if prov_data['tiles_alt'] else None,
                'vegetacion': {
                    'json_file': f"vegetacion_{prov_name}.json", 
                    'tar_file': f"vegetacion_{prov_name}.tar.gz",
                    'tiles_count': len(prov_data['tiles_veg'])
                } if prov_data['tiles_veg'] else None
            }
    
    master_path = os.path.join(output_dir, 'master_index_provincias.json')
    with open(master_path, 'w') as f:
        json.dump(master_index, f, indent=2)
    
    print(f"🎯 Índice maestro creado: master_index_provincias.json")
    print(f"📊 Resumen: {len(master_index['provincias'])} provincias con datos")

if __name__ == "__main__":
    # Configuración actualizada para trabajar con archivos disponibles
    import sys
    
    # Buscar archivos JSON disponibles
    json_files = list(Path("/Users/mac/Documents/GitHub/MAIRA_git").rglob("*index_tiles_altimetria*.json"))
    veg_json_files = list(Path("/Users/mac/Documents/GitHub/MAIRA_git").rglob("*vegetacion*.json"))
    
    INPUT_JSON = None
    INPUT_VEG_JSON = None
    
    # Seleccionar el mejor archivo de altimetría
    for json_file in json_files:
        if 'sample' not in str(json_file) and 'fajas' not in str(json_file):
            INPUT_JSON = str(json_file)
            break
    
    # Seleccionar archivo de vegetación
    for veg_file in veg_json_files:
        if 'index' in str(veg_file) or 'tile' in str(veg_file):
            INPUT_VEG_JSON = str(veg_file)
            break
    
    TILES_DIR = None  # Los TIF están en los tar.gz, no extraídos
    VEG_DIR = None    # Los TIF están en los tar.gz, no extraídos
    OUTPUT_DIR = "/Users/mac/Documents/GitHub/MAIRA_git/tiles_por_provincias"
    
    print("🗺️  DIVISIÓN DE TILES POR PROVINCIAS ARGENTINAS")
    print("=" * 60)
    print(f"📄 Altimetría: {INPUT_JSON}")
    print(f"🌿 Vegetación: {INPUT_VEG_JSON}")
    print()
    
    if INPUT_JSON or INPUT_VEG_JSON:
        dividir_tiles_por_provincias(INPUT_JSON, INPUT_VEG_JSON, TILES_DIR, VEG_DIR, OUTPUT_DIR)
        print("✅ ¡División por provincias completada!")
        print()
        print("📝 Resultado: Archivos pequeños por provincia")
        print("   - Cada provincia tiene sus propios JSON y TAR.GZ")
        print("   - Archivos compatibles con GitHub (< 100MB)")
        print("   - Sistema de carga bajo demanda por región")
    else:
        print("❌ No se encontraron archivos de índice")
        print("Archivos encontrados:")
        for json_file in json_files:
            print(f"   📄 {json_file}")
        for veg_file in veg_json_files:
            print(f"   🌿 {veg_file}")
