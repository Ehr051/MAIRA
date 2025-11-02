# 🚀 ENDPOINT BATCH COMPLETO
# Insertar en app.py después de la línea 762 (después del endpoint serve_elevation_tile)

@app.route('/api/elevation/batch', methods=['POST'])
def get_elevation_batch():
    """
    Recibe un array de coordenadas y devuelve todas las elevaciones de una vez.
    Esto evita hacer miles de requests individuales.
    
    Body: {
        "points": [
            {"lat": -38.07, "lon": -62.00, "index": 0},
            {"lat": -38.08, "lon": -62.01, "index": 1},
            ...
        ]
    }
    
    Response: {
        "elevations": [478.5, 482.3, ...],
        "tiles_loaded": 3,
        "processing_time": 1.234
    }
    """
    import time
    start_time = time.time()
    
    try:
        # Importar rasterio
        try:
            import rasterio
            import numpy as np
        except ImportError:
            return jsonify({
                'error': 'rasterio no instalado',
                'message': 'pip install rasterio'
            }), 500
        
        data = request.get_json()
        if not data or 'points' not in data:
            return jsonify({'error': 'Se requiere points'}), 400
        
        points = data['points']
        print(f'📊 Batch: {len(points)} puntos')
        
        # Calcular bounds
        lats = [p['lat'] for p in points]
        lons = [p['lon'] for p in points]
        bounds = {
            'north': max(lats),
            'south': min(lats),
            'east': max(lons),
            'west': min(lons)
        }
        
        # Determinar provincia (simplificado)
        provincia = 'centro'
        
        # Path a tiles
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_dir = os.path.join(base_dir, 'Client', 'Libs', 'datos_argentina', 
                                 'Altimetria_Mini_Tiles', provincia)
        
        if not os.path.exists(tiles_dir):
            return jsonify({'error': f'Tiles dir no existe: {tiles_dir}'}), 404
        
        # Cargar tiles y procesar
        loaded_tiles = {}
        elevations = [None] * len(points)
        
        for point in points:
            lat = point['lat']
            lon = point['lon']
            idx = point.get('index', 0)
            
            # Por ahora, usar tile fijo
            tile_name = 'centro_tile_0406.tif'
            tile_path = os.path.join(tiles_dir, tile_name)
            
            # Cargar tile si no está en caché
            if tile_name not in loaded_tiles:
                if os.path.exists(tile_path):
                    try:
                        loaded_tiles[tile_name] = rasterio.open(tile_path)
                        print(f'✅ Tile: {tile_name}')
                    except Exception as e:
                        print(f'❌ Error: {e}')
                        continue
            
            # Leer elevación
            if tile_name in loaded_tiles:
                src = loaded_tiles[tile_name]
                try:
                    py, px = src.index(lon, lat)
                    if 0 <= py < src.height and 0 <= px < src.width:
                        elevation = float(src.read(1)[py, px])
                        elevations[idx] = elevation
                except Exception as e:
                    print(f'⚠️ Error punto: {e}')
        
        # Cerrar tiles
        for src in loaded_tiles.values():
            src.close()
        
        processing_time = time.time() - start_time
        valid_count = sum(1 for e in elevations if e is not None)
        
        print(f'✅ {valid_count}/{len(points)} en {processing_time:.2f}s')
        
        return jsonify({
            'elevations': elevations,
            'count': len(elevations),
            'valid_count': valid_count,
            'tiles_loaded': len(loaded_tiles),
            'processing_time': processing_time
        })
        
    except Exception as e:
        print(f'❌ Error batch: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
