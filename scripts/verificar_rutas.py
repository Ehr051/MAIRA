#!/usr/bin/env python3
"""
Verificador de Rutas para MAIRA
Verifica que todas las rutas de archivos estén correctas después de la reorganización
"""

import os
import sys
import json
from pathlib import Path

def verificar_archivo(ruta, descripcion):
    """Verifica que un archivo exista"""
    if os.path.exists(ruta):
        print(f"✅ {descripcion}: {ruta}")
        return True
    else:
        print(f"❌ {descripcion}: {ruta} - NO ENCONTRADO")
        return False

def verificar_rutas_en_archivo(archivo, rutas_buscar):
    """Verifica rutas dentro de un archivo"""
    if not os.path.exists(archivo):
        print(f"⚠️ Archivo no encontrado: {archivo}")
        return
    
    print(f"\n📄 Verificando {archivo}:")
    with open(archivo, 'r', encoding='utf-8') as f:
        contenido = f.read()
        
    for ruta_buscar, descripcion in rutas_buscar.items():
        if ruta_buscar in contenido:
            # Extraer la ruta referenciada
            rutas_encontradas = []
            lineas = contenido.split('\n')
            for i, linea in enumerate(lineas):
                if ruta_buscar in linea:
                    rutas_encontradas.append(f"  Línea {i+1}: {linea.strip()}")
            
            print(f"  🔍 {descripcion}:")
            for ruta in rutas_encontradas:
                print(ruta)

def main():
    print("🔧 VERIFICADOR DE RUTAS MAIRA")
    print("=" * 50)
    
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)
    
    print(f"📁 Directorio del proyecto: {project_dir}")
    
    # Verificar archivos principales
    print("\n🎯 ARCHIVOS PRINCIPALES:")
    archivos_principales = {
        "Client/js/mini_tiles_loader.js": "Mini-tiles Loader (Frontend)",
        "dev-tools/mini_tiles_loader.js": "Mini-tiles Loader (Dev)",
        "dev-tools/maira_minitiles_integration.js": "Integración MAIRA",
        "static/demo_minitiles.html": "Demo HTML",
        "scripts/servidor_demo.py": "Servidor Demo", 
        "scripts/crear_mini_tiles.py": "Generador Mini-tiles",
        "mini_tiles_github/master_mini_tiles_index.json": "Índice Maestro",
        "README.md": "Documentación Principal"
    }
    
    errores = 0
    for ruta, descripcion in archivos_principales.items():
        if not verificar_archivo(ruta, descripcion):
            errores += 1
    
    # Verificar directorios principales
    print("\n📁 DIRECTORIOS PRINCIPALES:")
    directorios = [
        "Client/", "Server/", "scripts/", "dev-tools/", "tools/", 
        "static/", "docs/", "mini_tiles_github/", "indices/"
    ]
    
    for directorio in directorios:
        if os.path.isdir(directorio):
            print(f"✅ {directorio}")
        else:
            print(f"❌ {directorio} - NO ENCONTRADO")
            errores += 1
    
    # Verificar rutas en archivos específicos
    print("\n🔍 VERIFICANDO RUTAS EN ARCHIVOS:")
    
    # Verificar demo HTML
    verificar_rutas_en_archivo("static/demo_minitiles.html", {
        "mini_tiles_loader.js": "Referencia al loader JS",
        "../Client/js/": "Ruta al frontend"
    })
    
    # Verificar servidor demo
    verificar_rutas_en_archivo("scripts/servidor_demo.py", {
        "static/demo_minitiles.html": "Ruta al demo HTML",
        "Client/js/mini_tiles_loader.js": "Ruta al loader frontend",
        "mini_tiles_github/": "Ruta a mini-tiles"
    })
    
    # Verificar README
    verificar_rutas_en_archivo("README.md", {
        "Client/js/mini_tiles_loader.js": "Ejemplo de importación",
        "scripts/": "Referencias a scripts",
        "dev-tools/": "Referencias a dev-tools"
    })
    
    # Verificar mini-tiles loader frontend
    if os.path.exists("Client/js/mini_tiles_loader.js"):
        verificar_rutas_en_archivo("Client/js/mini_tiles_loader.js", {
            "../../mini_tiles_github/": "Ruta relativa a mini-tiles desde frontend"
        })
    
    # Verificar mini-tiles loader dev
    if os.path.exists("dev-tools/mini_tiles_loader.js"):
        verificar_rutas_en_archivo("dev-tools/mini_tiles_loader.js", {
            "../mini_tiles_github/": "Ruta relativa a mini-tiles desde dev-tools"
        })
    
    # Resultado final
    print("\n" + "=" * 50)
    if errores == 0:
        print("🎉 VERIFICACIÓN EXITOSA")
        print("✅ Todas las rutas están correctas")
        print("🚀 El sistema debería funcionar correctamente")
        return 0
    else:
        print(f"❌ ERRORES ENCONTRADOS: {errores}")
        print("🔧 Revisa los archivos faltantes y rutas incorrectas")
        return 1

if __name__ == "__main__":
    sys.exit(main())
