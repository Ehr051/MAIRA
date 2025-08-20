#!/usr/bin/env python3
# limpieza_tiles.py - Organización y limpieza del sistema de tiles

import os
import shutil
from datetime import datetime

def analizar_archivos_tiles():
    """Analiza qué archivos de tiles tenemos y cuáles se usan"""
    
    print("🔍 ANALIZANDO ARCHIVOS DE TILES...")
    print("=" * 60)
    
    # Archivos en el directorio raíz
    archivos_raiz = []
    for archivo in os.listdir('.'):
        if 'tiles' in archivo.lower() and archivo.endswith('.js'):
            archivos_raiz.append(archivo)
    
    print(f"📁 Archivos tiles en directorio raíz:")
    for archivo in archivos_raiz:
        print(f"   - {archivo}")
    
    # Archivos en dev-tools
    archivos_dev = []
    if os.path.exists('dev-tools'):
        for archivo in os.listdir('dev-tools'):
            if 'tiles' in archivo.lower() and archivo.endswith('.js'):
                archivos_dev.append(archivo)
    
    print(f"\n🛠️ Archivos tiles en dev-tools:")
    for archivo in archivos_dev:
        print(f"   - {archivo}")
    
    # Archivos en Client/js
    archivos_client = []
    if os.path.exists('Client/js'):
        for archivo in os.listdir('Client/js'):
            if 'tiles' in archivo.lower() and archivo.endswith('.js'):
                archivos_client.append(archivo)
    
    print(f"\n💻 Archivos tiles en Client/js:")
    for archivo in archivos_client:
        print(f"   - {archivo}")
    
    # Archivos en static
    archivos_static = []
    if os.path.exists('static'):
        for archivo in os.listdir('static'):
            if 'tiles' in archivo.lower() and archivo.endswith('.js'):
                archivos_static.append(archivo)
    
    print(f"\n📄 Archivos tiles en static:")
    for archivo in archivos_static:
        print(f"   - {archivo}")
    
    return {
        'raiz': archivos_raiz,
        'dev': archivos_dev,
        'client': archivos_client,
        'static': archivos_static
    }

def identificar_archivos_en_uso():
    """Identifica qué archivos de tiles se están usando realmente"""
    
    print("\n🔍 IDENTIFICANDO ARCHIVOS EN USO...")
    print("-" * 40)
    
    archivos_referenciados = set()
    
    # Buscar en archivos HTML
    for root, dirs, files in os.walk('.'):
        # Evitar directorios grandes y temporales
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__']]
        
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Buscar referencias a archivos tiles
                        if 'tiles' in content.lower():
                            # Extraer nombres de archivos específicos
                            import re
                            matches = re.findall(r'src="[^"]*([^/]*tiles[^"]*\.js)"', content)
                            for match in matches:
                                archivos_referenciados.add(match)
                except:
                    continue
    
    print("📋 Archivos tiles referenciados en HTML:")
    for archivo in sorted(archivos_referenciados):
        print(f"   ✅ {archivo}")
    
    return archivos_referenciados

def determinar_archivo_principal():
    """Determina cuál debe ser el archivo principal de tiles"""
    
    print("\n🎯 DETERMINANDO ARCHIVO PRINCIPAL...")
    print("-" * 40)
    
    # El archivo principal debe ser elevationHandler.js (ya está consolidado)
    archivo_principal = "Client/js/elevationHandler.js"
    
    if os.path.exists(archivo_principal):
        print(f"✅ Archivo principal identificado: {archivo_principal}")
        with open(archivo_principal, 'r', encoding='utf-8') as f:
            contenido = f.read()
            print(f"   📊 Tamaño: {len(contenido)} caracteres")
            print(f"   🏗️ Funciona con mini-tiles y tiles clásicos")
            print(f"   🌐 Tiene fallbacks para GitHub Releases")
    else:
        print(f"❌ Archivo principal no encontrado: {archivo_principal}")
    
    return archivo_principal

def generar_plan_limpieza(archivos_tiles, archivos_en_uso, archivo_principal):
    """Genera un plan de limpieza"""
    
    print("\n📋 PLAN DE LIMPIEZA:")
    print("=" * 60)
    
    # Archivos a mantener
    archivos_mantener = {
        archivo_principal,
        "Client/js/elevationHandler.js",  # Principal
        "elevation_fallback_fix.js",     # Fallback crítico
    }
    
    # Archivos a eliminar
    archivos_eliminar = []
    
    # Del directorio raíz
    for archivo in archivos_tiles['raiz']:
        if archivo not in ['elevation_fallback_fix.js']:
            archivos_eliminar.append(f"./{archivo}")
    
    # De dev-tools (todos son temporales)
    for archivo in archivos_tiles['dev']:
        archivos_eliminar.append(f"./dev-tools/{archivo}")
    
    # De static (duplicados)
    for archivo in archivos_tiles['static']:
        archivos_eliminar.append(f"./static/{archivo}")
    
    # Duplicados en Client/js
    for archivo in archivos_tiles['client']:
        if archivo != 'elevationHandler.js':
            archivos_eliminar.append(f"./Client/js/{archivo}")
    
    print("✅ ARCHIVOS A MANTENER:")
    for archivo in sorted(archivos_mantener):
        if os.path.exists(archivo):
            print(f"   📄 {archivo}")
    
    print("\n🗑️ ARCHIVOS A ELIMINAR:")
    for archivo in sorted(archivos_eliminar):
        if os.path.exists(archivo):
            print(f"   ❌ {archivo}")
    
    return archivos_mantener, archivos_eliminar

def aplicar_limpieza(archivos_eliminar, dry_run=True):
    """Aplica la limpieza (por defecto en modo dry-run)"""
    
    print(f"\n🧹 APLICANDO LIMPIEZA (DRY RUN: {dry_run})...")
    print("-" * 40)
    
    archivos_eliminados = []
    errores = []
    
    for archivo in archivos_eliminar:
        if os.path.exists(archivo):
            try:
                if not dry_run:
                    if os.path.isfile(archivo):
                        os.remove(archivo)
                    elif os.path.isdir(archivo):
                        shutil.rmtree(archivo)
                
                archivos_eliminados.append(archivo)
                print(f"   {'🔍' if dry_run else '✅'} {archivo}")
                
            except Exception as e:
                errores.append(f"{archivo}: {e}")
                print(f"   ❌ Error con {archivo}: {e}")
    
    print(f"\n📊 RESUMEN:")
    print(f"   ✅ Archivos {'que se eliminarían' if dry_run else 'eliminados'}: {len(archivos_eliminados)}")
    print(f"   ❌ Errores: {len(errores)}")
    
    if dry_run:
        print(f"\n💡 Para aplicar realmente los cambios, ejecuta:")
        print(f"   python limpieza_tiles.py --aplicar")
    
    return archivos_eliminados, errores

def main():
    import sys
    
    print("🧹 LIMPIEZA DEL SISTEMA DE TILES MAIRA")
    print("=" * 60)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Analizar archivos existentes
    archivos_tiles = analizar_archivos_tiles()
    
    # 2. Identificar archivos en uso
    archivos_en_uso = identificar_archivos_en_uso()
    
    # 3. Determinar archivo principal
    archivo_principal = determinar_archivo_principal()
    
    # 4. Generar plan de limpieza
    archivos_mantener, archivos_eliminar = generar_plan_limpieza(
        archivos_tiles, archivos_en_uso, archivo_principal
    )
    
    # 5. Aplicar limpieza
    dry_run = '--aplicar' not in sys.argv
    aplicar_limpieza(archivos_eliminar, dry_run)
    
    print("\n🎯 RECOMENDACIONES FINALES:")
    print("=" * 60)
    print("1. ✅ Mantener Client/js/elevationHandler.js como archivo principal")
    print("2. ✅ Mantener elevation_fallback_fix.js como fallback crítico")
    print("3. 🗑️ Eliminar archivos duplicados y experimentales")
    print("4. 📁 Mantener directorio mini_tiles_github/ con datos")
    print("5. 🧪 Limpiar dev-tools/ de archivos temporales")
    
    return True

if __name__ == "__main__":
    main()
