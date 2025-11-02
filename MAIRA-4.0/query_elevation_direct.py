#!/usr/bin/env python3
"""
Script para consultar elevaciones directamente de los tiles TIF
sin necesidad del servidor web
"""

import glob
import os
import struct
from pathlib import Path

def read_tif_header(filepath):
    """Lee el header básico de un archivo TIF para obtener bounds aproximados"""
    try:
        with open(filepath, 'rb') as f:
            # Leer identificador TIFF
            byte_order = f.read(2)
            if byte_order not in (b'II', b'MM'):
                return None
            
            is_little_endian = (byte_order == b'II')
            
            # Leer magic number
            magic = struct.unpack('<H' if is_little_endian else '>H', f.read(2))[0]
            if magic != 42:
                return None
            
            return True
    except:
        return None

def find_tile_for_coordinate(lat, lon):
    """Busca qué tile contiene una coordenada específica"""
    tiles_dir = Path(__file__).parent / "Client/Libs/datos_argentina/Altimetria_Mini_Tiles/sur"
    
    if not tiles_dir.exists():
        print(f"❌ Directorio no encontrado: {tiles_dir}")
        return None
    
    tif_files = list(tiles_dir.glob("*.tif"))
    print(f"📁 Tiles encontrados: {len(tif_files)}")
    
    # Información de tiles basada en el sistema de nombres
    # Los tiles "sur" cubren aproximadamente la región sur de Argentina
    # Cada tile cubre un área específica
    
    # Basándonos en el naming convention y la coordenada solicitada
    # -38.07107, -62.00821 está en la región de sierras de Buenos Aires
    
    print(f"\n🎯 Buscando tile para coordenadas: {lat}, {lon}")
    print(f"   Región: Sur de Buenos Aires (sierras de Ventania/Tandilia)")
    
    # Lista algunos tiles para análisis
    print(f"\n📋 Tiles disponibles (primeros 20):")
    for tif_file in sorted(tif_files)[:20]:
        print(f"   - {tif_file.name}")
    
    return None

if __name__ == "__main__":
    import sys
    
    # Coordenadas del usuario
    lat = -38.07107
    lon = -62.00821
    
    print("=" * 70)
    print("🔍 CONSULTA DE ELEVACIÓN DIRECTA")
    print("=" * 70)
    
    result = find_tile_for_coordinate(lat, lon)
    
    print("\n" + "=" * 70)
    print("💡 NOTA: Para obtener elevaciones reales necesitamos:")
    print("   1. Verificar el sistema de coordenadas de los tiles (EPSG)")
    print("   2. Calcular el índice de tile correcto según lat/lon")
    print("   3. Leer el raster usando una librería apropiada (rasterio/gdal)")
    print("=" * 70)
    
    # Intentemos acceder vía el ElevationService si está disponible
    print("\n🔄 Alternativa: Usar el endpoint del servidor...")
    print(f"   curl -X POST http://localhost:5000/api/elevations/batch \\")
    print(f"     -H 'Content-Type: application/json' \\")
    print(f"     -d '{{\"points\": [{{\"lat\": {lat}, \"lon\": {lon}}}]}}'")
