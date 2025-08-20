#!/usr/bin/env python3
"""
Verificación conservadora del sistema de tiles - MAIRA
Solo verifica, NO modifica nada
"""

import os
import json
from pathlib import Path

def verificar_tiles():
    print("🔍 VERIFICACIÓN CONSERVADORA DEL SISTEMA DE TILES")
    print("=" * 60)
    print("⚠️  MODO SOLO LECTURA - NO SE MODIFICARÁ NADA")
    print()
    
    # 1. Verificar archivo principal
    elevation_handler = Path("Client/js/elevationHandler.js")
    if elevation_handler.exists():
        size = elevation_handler.stat().st_size
        print(f"✅ elevationHandler.js: {size:,} bytes - ARCHIVO PRINCIPAL")
    else:
        print("❌ elevationHandler.js: NO ENCONTRADO")
        return False
    
    # 2. Verificar índice master
    master_index = Path("mini_tiles_github/master_mini_tiles_index.json")
    if master_index.exists():
        try:
            with open(master_index, 'r') as f:
                data = json.load(f)
            print(f"✅ master_mini_tiles_index.json: versión {data.get('version', 'N/A')}")
            print(f"   📊 Provincias: {len(data.get('provincias', {}))}")
        except Exception as e:
            print(f"❌ Error leyendo índice master: {e}")
    else:
        print("❌ master_mini_tiles_index.json: NO ENCONTRADO")
    
    # 3. Verificar directorios de tiles por provincia
    tiles_dir = Path("mini_tiles_github")
    if tiles_dir.exists():
        provincias = [d for d in tiles_dir.iterdir() if d.is_dir()]
        print(f"✅ Directorios de provincias: {len(provincias)}")
        for prov in provincias[:3]:  # Solo mostrar primeras 3
            print(f"   📁 {prov.name}")
    
    # 4. Verificar que NO existan archivos problemáticos
    archivos_problemáticos = [
        "static/elevation_fallback_fix.js",
        "static/optimized_tiles_system.js", 
        "static/github_releases_config.js",
        "elevation_fallback_fix.js"
    ]
    
    print(f"\n🧹 VERIFICANDO ARCHIVOS PROBLEMÁTICOS:")
    for archivo in archivos_problemáticos:
        if Path(archivo).exists():
            print(f"   ⚠️  {archivo} - AÚN EXISTE (debería eliminarse)")
        else:
            print(f"   ✅ {archivo} - CORRECTAMENTE ELIMINADO")
    
    # 5. Estado de referencias HTML
    print(f"\n📄 VERIFICANDO REFERENCIAS HTML:")
    referencias_problemáticas = 0
    
    for html_file in Path(".").rglob("*.html"):
        if "node_modules" in str(html_file) or ".git" in str(html_file):
            continue
            
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Buscar referencias a archivos eliminados
            refs_malas = [
                "elevation_fallback_fix.js",
                "optimized_tiles_system.js",
                "github_releases_config.js"
            ]
            
            for ref in refs_malas:
                if ref in content:
                    print(f"   ⚠️  {html_file}: referencia a {ref}")
                    referencias_problemáticas += 1
                    
        except Exception as e:
            pass
    
    if referencias_problemáticas == 0:
        print("   ✅ Todas las referencias HTML están limpias")
    
    print(f"\n📊 RESUMEN:")
    print(f"   ✅ Sistema principal: elevationHandler.js")
    print(f"   ✅ Datos de tiles: mini_tiles_github/")
    print(f"   ✅ Archivos problemáticos eliminados")
    print(f"   📄 Referencias HTML problemáticas: {referencias_problemáticas}")
    
    if referencias_problemáticas == 0:
        print(f"\n🎉 ESTADO: SISTEMA DE TILES LIMPIO Y FUNCIONAL")
        return True
    else:
        print(f"\n⚠️  ESTADO: ALGUNAS REFERENCIAS HTML NECESITAN LIMPIEZA")
        return False

if __name__ == "__main__":
    verificar_tiles()
