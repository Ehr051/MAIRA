#!/usr/bin/env python3
"""
🔧 Script automático para agregar puntos_detalle al backend
Modifica serverhttps.py en MAIRA-WORKSPACE
"""

import os
import re

SERVER_FILE = '/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Server/serverhttps.py'
BACKUP_FILE = SERVER_FILE + '.backup_visualizacion'

def main():
    print("=" * 80)
    print("🔧 APLICANDO CAMBIOS AL BACKEND")
    print("=" * 80)
    print()
    
    # Verificar que existe el archivo
    if not os.path.exists(SERVER_FILE):
        print(f"❌ Error: No se encuentra {SERVER_FILE}")
        return False
    
    # Hacer backup
    print("💾 Creando backup...")
    with open(SERVER_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Backup creado: {BACKUP_FILE}")
    print()
    
    # Buscar el endpoint de análisis de terreno
    print("🔍 Buscando endpoint /api/terreno/analizar...")
    
    if '@app.route(\'/api/terreno/analizar\'' not in content:
        print("❌ No se encuentra el endpoint /api/terreno/analizar")
        return False
    
    print("✅ Endpoint encontrado")
    print()
    
    # PASO 1: Agregar código de puntos_detalle antes del resultado dict
    print("📝 PASO 1: Agregando generación de puntos_detalle...")
    
    # El endpoint usa una variable 'resultado' antes del return jsonify
    # Buscar el patrón: "resultado = {" y modificar
    
    codigo_puntos_detalle = """
        # ========================================================================
        # 🎨 GENERAR PUNTOS_DETALLE PARA VISUALIZACIÓN
        # ========================================================================
        puntos_detalle = []
        
        # Iterar sobre los puntos con elevaciones válidas
        for i in range(len(lats)):
            if i < len(elevations):
                lat = lats[i]
                lon = lons[i]
                elevation = elevations[i]
                
                # Calcular pendiente en este punto (promedio con vecinos)
                pendiente_punto = 0.0
                
                if i > 0 and i < len(pendientes):
                    # Promedio de pendiente con segmento anterior y siguiente
                    count = 0
                    if i - 1 < len(pendientes):
                        pendiente_punto += pendientes[i - 1]
                        count += 1
                    if i < len(pendientes):
                        pendiente_punto += pendientes[i]
                        count += 1
                    if count > 0:
                        pendiente_punto = pendiente_punto / count
                elif i < len(pendientes):
                    pendiente_punto = pendientes[i]
                
                puntos_detalle.append({
                    'lat': float(lat),
                    'lon': float(lon),
                    'elevation': float(elevation),
                    'pendiente': round(float(pendiente_punto), 2),
                    'ndvi': 0.0  # Placeholder - se agregará NDVI en fase posterior
                })
        
        print(f'🎨 Puntos detalle generados: {len(puntos_detalle)}')
        
"""
    
    # Buscar donde insertar (antes de "resultado = {")
    pattern_resultado = r"(\s+)(resultado = \{)"
    
    match_resultado = re.search(pattern_resultado, content)
    if not match_resultado:
        print("❌ No se pudo encontrar 'resultado = {'")
        return False
    
    # Insertar el código antes del resultado dict
    content_new = re.sub(pattern_resultado, codigo_puntos_detalle + r"\1\2", content, count=1)
    
    print("✅ Código de puntos_detalle insertado")
    print()
    
    # PASO 2: Agregar puntos_detalle al dict resultado
    print("📝 PASO 2: Agregando campo puntos_detalle al dict resultado...")
    
    # Buscar "resultado = {" y agregar el campo después de 'success'
    pattern_success = r"(resultado = \{\s*'success': True,)"
    replacement = r"\1\n            'puntos_detalle': puntos_detalle,"
    
    content_new = re.sub(pattern_success, replacement, content_new, count=1)
    
    print("✅ Campo puntos_detalle agregado al response")
    print()
    
    # Guardar el archivo modificado
    print("💾 Guardando cambios...")
    with open(SERVER_FILE, 'w', encoding='utf-8') as f:
        f.write(content_new)
    
    print("✅ Archivo guardado exitosamente")
    print()
    
    print("=" * 80)
    print("✅ BACKEND MODIFICADO EXITOSAMENTE")
    print("=" * 80)
    print()
    print("📋 CAMBIOS APLICADOS:")
    print("  ✅ Generación de puntos_detalle agregada")
    print("  ✅ Campo 'puntos_detalle' agregado al response JSON")
    print("  ✅ Backup creado en:", BACKUP_FILE)
    print()
    print("🔄 PRÓXIMO PASO:")
    print("  Reiniciar servidor Flask y ejecutar test_puntos_detalle.py")
    print()
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
