#!/usr/bin/env python3
"""Script para parchear serverhttps.py con soporte para grilla de puntos"""

# Leer archivo
with open('Server/serverhttps.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Buscar la línea que contiene "lons = [p[0] for p in poligono_coords]"
for i, line in enumerate(lines):
    if 'lons = [p[0] for p in poligono_coords]' in line and i > 3300:
        print(f"✅ Encontrado en línea {i+1}")
        
        # Reemplazar las líneas 3330-3332 con el nuevo código
        nuevo_codigo = """        # ====================================================================
        # PASO 1: Obtener puntos para análisis (grilla o vértices)
        # ====================================================================
        grid_points = data.get('puntos', None)
        
        if grid_points and len(grid_points) > 0:
            # Usar grilla enviada desde frontend
            lats = [p['lat'] for p in grid_points]
            lons = [p['lon'] for p in grid_points]
            print(f'📐 Usando grilla: {len(grid_points)} puntos')
        else:
            # Fallback: usar solo vértices del polígono
            lons = [p[0] for p in poligono_coords]
            lats = [p[1] for p in poligono_coords]
            print(f'📐 Usando vértices: {len(poligono_coords)} puntos')
"""
        
        # Reemplazar 3 líneas
        lines[i:i+3] = [nuevo_codigo]
        
        # Guardar
        with open('Server/serverhttps.py', 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print("✅ Archivo actualizado exitosamente")
        break
else:
    print("❌ No se encontró la línea a reemplazar")
