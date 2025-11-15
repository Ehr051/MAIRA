#!/usr/bin/env python3
"""
🗺️ SCRIPT MAESTRO - Procesamiento Completo Capas IGN

Extrae ZIPs → Convierte a GeoJSON → Corta en Tiles → Actualiza Índice

Autor: MAIRA Team
Fecha: 14 de noviembre 2025
"""

import os
import sys
import zipfile
import geopandas as gpd
import json
from pathlib import Path
from datetime import datetime

# Directorios
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'Client' / 'Libs' / 'datos_argentina'
TEMP_DIR = DATA_DIR / 'temp_shapefiles'
TILES_DIR = DATA_DIR

# Configuración de capas con categorías tácticas
LAYER_CONFIG = {
    # 🛣️ TRANSPORTE
    'vial_AP010.zip': {
        'categoria': 'Transporte',
        'nombre_salida': 'caminos',
        'descripcion': 'Caminos generales',
        'tolerancia': 0.0001,
        'modificador_tactico': '+20% transitabilidad'
    },
    'lineas_de_transporte_ferroviario_AN010.zip': {
        'categoria': 'Transporte',
        'nombre_salida': 'ferrocarril',
        'descripcion': 'Vías férreas',
        'tolerancia': 0.0001,
        'modificador_tactico': 'Corredor logístico'
    },
    'infraestructura_de_transporte_AQ170.zip': {
        'categoria': 'Transporte',
        'nombre_salida': 'infraestructura_vial',
        'descripcion': 'Puentes, túneles, pasos',
        'tolerancia': 0.00005,
        'modificador_tactico': 'Punto crítico'
    },
    'puntos_de_cruces_y_enlaces_AQ040.zip': {
        'categoria': 'Transporte',
        'nombre_salida': 'cruces_enlaces',
        'descripcion': 'Intersecciones viales',
        'tolerancia': 0.00005,
        'modificador_tactico': 'Nodo estratégico'
    },
    
    # 📡 COMUNICACIONES
    'puntos_de_comunicacion_AT010.zip': {
        'categoria': 'Comunicaciones',
        'nombre_salida': 'torres_comunicacion',
        'descripcion': 'Torres/antenas',
        'tolerancia': 0.0,  # Puntos exactos
        'modificador_tactico': 'Objetivo prioritario'
    },
    'puntos_de_comunicacion_AT080.zip': {
        'categoria': 'Comunicaciones',
        'nombre_salida': 'nodos_comunicacion',
        'descripcion': 'Nodos/repetidoras',
        'tolerancia': 0.0,
        'modificador_tactico': 'Objetivo secundario'
    },
    
    # 🌍 EDAFOLOGÍA (SUELOS)
    'edafologia_afloramiento_rocoso.zip': {
        'categoria': 'Suelos',
        'nombre_salida': 'afloramiento_rocoso',
        'descripcion': 'Afloramientos rocosos',
        'tolerancia': 0.0003,
        'modificador_tactico': '-60% transitabilidad'
    },
    'edafologia_arenal.zip': {
        'categoria': 'Suelos',
        'nombre_salida': 'arenal',
        'descripcion': 'Arenales/médanos',
        'tolerancia': 0.0003,
        'modificador_tactico': '-40% transitabilidad'
    },
    'edafologia_barrial_barrizal.zip': {
        'categoria': 'Suelos',
        'nombre_salida': 'barrial',
        'descripcion': 'Barrial/barrizal',
        'tolerancia': 0.0003,
        'modificador_tactico': '-70% transitabilidad'
    },
    'edafologia_cumbre_rocosa.zip': {
        'categoria': 'Suelos',
        'nombre_salida': 'cumbre_rocosa',
        'descripcion': 'Cumbres rocosas',
        'tolerancia': 0.0003,
        'modificador_tactico': '-90% transitabilidad, +observación'
    },
    'edafologia_pedregal.zip': {
        'categoria': 'Suelos',
        'nombre_salida': 'pedregal',
        'descripcion': 'Pedregales',
        'tolerancia': 0.0003,
        'modificador_tactico': '-50% transitabilidad'
    },
    'edafologia_salina.zip': {
        'categoria': 'Suelos',
        'nombre_salida': 'salina',
        'descripcion': 'Salinas',
        'tolerancia': 0.0003,
        'modificador_tactico': '-30% transitabilidad'
    },
    'edafologia_sedimento_fluvial.zip': {
        'categoria': 'Suelos',
        'nombre_salida': 'sedimento_fluvial',
        'descripcion': 'Sedimentos fluviales',
        'tolerancia': 0.0003,
        'modificador_tactico': '-20% transitabilidad'
    },
    
    # 🌳 VEGETACIÓN
    'vegetacion_arborea_060301.zip': {
        'categoria': 'Vegetacion',
        'nombre_salida': 'bosque_nativo_1',
        'descripcion': 'Bosque nativo tipo 1',
        'tolerancia': 0.0002,
        'modificador_tactico': '+ocultamiento, -movilidad'
    },
    'vegetacion_arborea_060302.zip': {
        'categoria': 'Vegetacion',
        'nombre_salida': 'bosque_nativo_2',
        'descripcion': 'Bosque nativo tipo 2',
        'tolerancia': 0.0002,
        'modificador_tactico': '+ocultamiento, -movilidad'
    },
    'vegetacion_arborea_AK120.zip': {
        'categoria': 'Vegetacion',
        'nombre_salida': 'cultivo_arboreo',
        'descripcion': 'Cultivos arbóreos',
        'tolerancia': 0.0002,
        'modificador_tactico': '+cobertura ligera'
    },
    'vegetacion_arborea_EC015.zip': {
        'categoria': 'Vegetacion',
        'nombre_salida': 'bosque_tipo_3',
        'descripcion': 'Bosque tipo 3',
        'tolerancia': 0.0002,
        'modificador_tactico': '+ocultamiento, -movilidad'
    },
    'vegetacion_arbustiva_EB015.zip': {
        'categoria': 'Vegetacion',
        'nombre_salida': 'vegetacion_arbustiva',
        'descripcion': 'Vegetación arbustiva',
        'tolerancia': 0.0002,
        'modificador_tactico': '+cobertura media'
    },
    'vegetacion_hidrofila_ED020.zip': {
        'categoria': 'Vegetacion',
        'nombre_salida': 'vegetacion_hidrofila',
        'descripcion': 'Vegetación hidrófila (pantanos)',
        'tolerancia': 0.0002,
        'modificador_tactico': '-80% transitabilidad'
    },
    
    # 🗻 GEOMORFOLOGÍA
    'lineas_de_geomorfologia_CA010.zip': {
        'categoria': 'Geomorfologia',
        'nombre_salida': 'lineas_geomorfologia',
        'descripcion': 'Líneas geomorfológicas',
        'tolerancia': 0.0002,
        'modificador_tactico': 'Referencia terreno'
    }
}


def extract_shapefile_from_zip(zip_path, temp_dir):
    """Extrae shapefile de ZIP."""
    print(f'\n📦 Extrayendo {zip_path.name}...')
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Listar archivos
        files = zip_ref.namelist()
        shp_files = [f for f in files if f.endswith('.shp')]
        
        if not shp_files:
            print(f'   ⚠️  No hay .shp en {zip_path.name}')
            return None
        
        # Extraer todos los archivos relacionados
        extract_dir = temp_dir / zip_path.stem
        extract_dir.mkdir(parents=True, exist_ok=True)
        
        zip_ref.extractall(extract_dir)
        
        # Retornar ruta al primer .shp
        shp_path = extract_dir / shp_files[0]
        print(f'   ✅ Extraído: {shp_path.name}')
        return shp_path
    

def convert_to_geojson(shp_path, output_path, tolerance=0.0001):
    """Convierte SHP a GeoJSON simplificado."""
    print(f'\n🔄 Convirtiendo a GeoJSON...')
    
    try:
        # Leer shapefile
        gdf = gpd.read_file(shp_path)
        original_features = len(gdf)
        
        print(f'   ├─ Features: {original_features:,}')
        print(f'   ├─ CRS: {gdf.crs}')
        print(f'   ├─ Tipo: {gdf.geometry.geom_type.unique()}')
        
        # Simplificar si tolerance > 0
        if tolerance > 0:
            print(f'   ✂️  Simplificando (tolerancia={tolerance}°)...')
            gdf['geometry'] = gdf['geometry'].simplify(tolerance, preserve_topology=True)
        
        # Convertir a WGS84
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            print(f'   🗺️  Reproyectando a WGS84...')
            gdf = gdf.to_crs(epsg=4326)
        
        # Guardar GeoJSON
        output_path.parent.mkdir(parents=True, exist_ok=True)
        gdf.to_file(output_path, driver='GeoJSON')
        
        size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f'   ✅ {original_features:,} features → {size_mb:.2f} MB')
        
        return {
            'success': True,
            'features': original_features,
            'size_mb': size_mb,
            'geom_types': gdf.geometry.geom_type.unique().tolist()
        }
        
    except Exception as e:
        print(f'   ❌ Error: {e}')
        return {'success': False, 'error': str(e)}


def create_tiles_for_layer(geojson_path, layer_name, categoria):
    """Crea tiles para una capa (llamando al script existente)."""
    print(f'\n🔪 Creando tiles para {layer_name}...')
    
    # Importar funciones del script de tiles
    sys.path.insert(0, str(Path(__file__).parent))
    from create_gis_tiles import create_grid, split_geojson_into_tiles
    
    try:
        tiles_output_dir = TILES_DIR / f'{categoria}_Tiles' / layer_name
        tiles_output_dir.mkdir(parents=True, exist_ok=True)
        
        # Leer GeoJSON para obtener bounds
        gdf = gpd.read_file(geojson_path)
        bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
        bounds_dict = {
            'west': bounds[0],
            'south': bounds[1],
            'east': bounds[2],
            'north': bounds[3]
        }
        
        # Crear grid de tiles (0.5° x 0.5°)
        tiles = create_grid(bounds_dict, tile_size=0.5)
        
        # Dividir en tiles
        result = split_geojson_into_tiles(
            str(geojson_path),
            str(tiles_output_dir),
            tiles,
            layer_name
        )
        
        print(f'   ✅ {result["tiles_created"]:,} tiles creados')
        print(f'   📊 {result["features_saved"]:,} features guardados')
        
        return {
            'success': True,
            'tiles_created': result['tiles_created'],
            'features_saved': result['features_saved']
        }
            
    except Exception as e:
        print(f'   ❌ Error: {e}')
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}


def update_master_index():
    """Actualiza el índice maestro con todas las capas."""
    print(f'\n📝 Actualizando índice maestro...')
    
    index_path = TILES_DIR / 'gis_tiles_master_index.json'
    
    # Leer índice actual o crear nuevo
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            index = json.load(f)
    else:
        index = {
            'version': '2.0',
            'description': 'Índice maestro capas GIS IGN Argentina - MAIRA',
            'ultima_actualizacion': datetime.now().isoformat(),
            'layers': {},
            'categorias': {}
        }
    
    # Escanear todas las carpetas de tiles
    categorias = {}
    total_layers = 0
    
    for cat_dir in TILES_DIR.glob('*_Tiles'):
        if not cat_dir.is_dir():
            continue
            
        categoria = cat_dir.stem.replace('_Tiles', '')
        categorias[categoria] = []
        
        for layer_dir in cat_dir.iterdir():
            if not layer_dir.is_dir():
                continue
                
            layer_name = layer_dir.name
            
            # Contar tiles
            tiles = list(layer_dir.glob('*.geojson'))
            total_features = 0
            
            for tile in tiles:
                try:
                    with open(tile, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        total_features += len(data.get('features', []))
                except:
                    pass
            
            # Buscar config
            config = None
            for zip_name, cfg in LAYER_CONFIG.items():
                if cfg['nombre_salida'] == layer_name:
                    config = cfg
                    break
            
            layer_info = {
                'nombre': layer_name,
                'descripcion': config['descripcion'] if config else layer_name,
                'modificador_tactico': config['modificador_tactico'] if config else '',
                'tiles_count': len(tiles),
                'features_count': total_features,
                'ruta': str(layer_dir.relative_to(TILES_DIR))
            }
            
            categorias[categoria].append(layer_info)
            index['layers'][layer_name] = layer_info
            total_layers += 1
    
    index['categorias'] = categorias
    index['total_capas'] = total_layers
    index['ultima_actualizacion'] = datetime.now().isoformat()
    
    # Guardar índice
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    
    print(f'   ✅ Índice actualizado: {total_layers} capas en {len(categorias)} categorías')
    return index


def main():
    """Procesamiento completo."""
    
    print('='*70)
    print('🗺️  PROCESAMIENTO AUTOMÁTICO CAPAS IGN → MAIRA')
    print('='*70)
    print(f'\nDirectorio datos: {DATA_DIR}')
    
    # Crear directorio temporal
    TEMP_DIR.mkdir(exist_ok=True)
    
    # Estadísticas
    stats = {
        'procesados': 0,
        'exitosos': 0,
        'fallidos': 0,
        'total_features': 0,
        'total_size_mb': 0.0
    }
    
    # Procesar cada ZIP
    for zip_name, config in LAYER_CONFIG.items():
        print(f'\n{"="*70}')
        print(f'📦 {zip_name}')
        print(f'   Categoría: {config["categoria"]}')
        print(f'   Salida: {config["nombre_salida"]}')
        print(f'   {config["descripcion"]}')
        print(f'   🎯 {config["modificador_tactico"]}')
        print('='*70)
        
        zip_path = DATA_DIR / zip_name
        
        if not zip_path.exists():
            print(f'⚠️  ZIP no encontrado: {zip_path}')
            stats['fallidos'] += 1
            continue
        
        stats['procesados'] += 1
        
        # 1. Extraer
        shp_path = extract_shapefile_from_zip(zip_path, TEMP_DIR)
        if not shp_path:
            stats['fallidos'] += 1
            continue
        
        # 2. Convertir a GeoJSON
        geojson_path = DATA_DIR / f'{config["categoria"]}_GeoJSON' / f'{config["nombre_salida"]}.geojson'
        result = convert_to_geojson(shp_path, geojson_path, config['tolerancia'])
        
        if not result['success']:
            stats['fallidos'] += 1
            continue
        
        stats['total_features'] += result['features']
        stats['total_size_mb'] += result['size_mb']
        
        # 3. Crear tiles
        tiles_result = create_tiles_for_layer(
            geojson_path, 
            config['nombre_salida'],
            config['categoria']
        )
        
        if tiles_result['success']:
            stats['exitosos'] += 1
        else:
            stats['fallidos'] += 1
    
    # 4. Actualizar índice maestro
    index = update_master_index()
    
    # Resumen final
    print(f'\n{"="*70}')
    print('📊 RESUMEN FINAL')
    print('='*70)
    print(f'✅ Exitosos: {stats["exitosos"]}')
    print(f'❌ Fallidos: {stats["fallidos"]}')
    print(f'📊 Total features: {stats["total_features"]:,}')
    print(f'💾 Peso GeoJSON: {stats["total_size_mb"]:.2f} MB')
    print(f'🗂️ Categorías: {len(index.get("categorias", {}))}')
    print(f'🗺️ Total capas: {index.get("total_capas", 0)}')
    
    # Limpiar temporales
    print(f'\n🧹 Limpiando archivos temporales...')
    import shutil
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    print(f'   ✅ Limpieza completada')
    
    print(f'\n🎉 ¡PROCESAMIENTO COMPLETADO!')
    print(f'\n📋 Próximos pasos:')
    print(f'   1. Actualizar frontend con nuevas capas')
    print(f'   2. Probar carga en analisisTerreno.js')
    print(f'   3. Commit cambios al repositorio')


if __name__ == '__main__':
    # Verificar dependencias
    try:
        import geopandas
        import shapely
    except ImportError:
        print('❌ Faltan dependencias. Instala con:')
        print('   pip3 install geopandas shapely fiona')
        sys.exit(1)
    
    main()
