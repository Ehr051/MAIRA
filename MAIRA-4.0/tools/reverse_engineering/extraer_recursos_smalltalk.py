#!/usr/bin/env python3
"""
Extractor de Recursos Smalltalk de Ejecutables BV8
Extrae y descomprime Smalltalk images de todos los ejecutables HEM
"""

import subprocess
import zlib
from pathlib import Path
from typing import Dict, Tuple

# Ejecutables a procesar
EJECUTABLES = {
    "CCOO": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Administración de CCOO/8/HACCOO_7_01_004.exe",
    "Logistica": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Planeamiento Logístico/8/HPL_7_01_004.exe",
    "Bajas": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Estimación de Bajas de Combate/8/HEBC_7_01_004.exe",
    "Fallas": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Estimación de Fallas/8/HEF_7_01_003.exe",
    "Terreno": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Estudio del Terreno/8/HET_7_01_005.exe"
}

OUTPUT_DIR = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa/recursos_extraidos")


def extraer_rcdata(ejecutable: str, nombre: str) -> Tuple[bool, str]:
    """Extrae recurso RCDATA del ejecutable usando wrestool"""
    print(f"\n{'='*60}")
    print(f"Extrayendo recursos de: {nombre}")
    print(f"{'='*60}")
    
    try:
        # Listar recursos
        result = subprocess.run(
            ["wrestool", "--list", ejecutable],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Buscar RCDATA (tipo 10)
        rcdata_lines = [line for line in result.stdout.split('\n') if '--type=10' in line]
        
        if not rcdata_lines:
            print(f"❌ No se encontró recurso RCDATA en {nombre}")
            return False, ""
        
        # Extraer primer RCDATA encontrado
        print(f"✅ Encontrado recurso RCDATA")
        
        # Parsear nombre del recurso
        import re
        match = re.search(r'--name=(\d+)', rcdata_lines[0])
        if not match:
            print(f"❌ No se pudo parsear nombre del recurso")
            return False, ""
        
        resource_id = match.group(1)
        output_file = OUTPUT_DIR / f"{nombre.lower()}_rcdata_{resource_id}.bin"
        
        # Extraer recurso
        subprocess.run(
            ["wrestool", "--raw", "-x", "-t", "10", "-n", resource_id, ejecutable],
            stdout=open(output_file, 'wb'),
            check=True
        )
        
        size_mb = output_file.stat().st_size / (1024 * 1024)
        print(f"✅ Extraído: {output_file.name} ({size_mb:.2f} MB)")
        
        return True, str(output_file)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error extrayendo de {nombre}: {e}")
        return False, ""


def descomprimir_smalltalk_image(rcdata_file: str, nombre: str) -> Tuple[bool, str]:
    """Descomprime Smalltalk image desde archivo RCDATA"""
    print(f"\n📦 Descomprimiendo Smalltalk image de {nombre}...")
    
    try:
        with open(rcdata_file, 'rb') as f:
            data = f.read()
        
        # Buscar firma gzip (1f 8b)
        gzip_start = data.find(b'\x1f\x8b')
        
        if gzip_start == -1:
            print(f"❌ No se encontró datos comprimidos en {nombre}")
            return False, ""
        
        print(f"  Firma gzip en offset: 0x{gzip_start:x}")
        
        # Extraer datos comprimidos (skip gzip header de 10 bytes)
        compressed = data[gzip_start + 10:]
        
        # Descomprimir con zlib (formato raw DEFLATE)
        decompressed = zlib.decompress(compressed, -zlib.MAX_WBITS)
        
        size_mb = len(decompressed) / (1024 * 1024)
        print(f"✅ Descomprimido: {size_mb:.2f} MB ({len(decompressed):,} bytes)")
        
        # Guardar
        output_file = Path(rcdata_file).parent / f"{nombre.lower()}_smalltalk.img"
        with open(output_file, 'wb') as f:
            f.write(decompressed)
        
        print(f"💾 Guardado en: {output_file.name}")
        
        return True, str(output_file)
        
    except Exception as e:
        print(f"❌ Error descomprimiendo {nombre}: {e}")
        import traceback
        traceback.print_exc()
        return False, ""


def analizar_smalltalk_image(img_file: str, nombre: str):
    """Análisis rápido del Smalltalk image"""
    print(f"\n🔍 Analizando {nombre}...")
    
    try:
        # Extraer strings
        result = subprocess.run(
            ["strings", img_file],
            capture_output=True,
            text=True,
            check=True
        )
        
        strings_list = result.stdout.splitlines()
        
        # Buscar clases importantes
        clases = [s for s in strings_list if s and len(s) > 3 and s[0].isupper() and s.isalpha()]
        clases_unicas = sorted(set(clases))
        
        # Filtrar clases relevantes
        clases_relevantes = [
            c for c in clases_unicas 
            if any(keyword in c.lower() for keyword in 
                   ['dotacion', 'persona', 'elemento', 'tropa', 'armamento', 
                    'municion', 'agua', 'viveres', 'combustible', 'vehiculo',
                    'baja', 'falla', 'mtbf', 'consumo', 'terreno'])
        ]
        
        print(f"  Total strings: {len(strings_list):,}")
        print(f"  Clases encontradas: {len(clases_unicas)}")
        
        if clases_relevantes:
            print(f"\n  📋 Clases relevantes ({len(clases_relevantes)}):")
            for clase in clases_relevantes[:20]:
                print(f"    - {clase}")
        
    except Exception as e:
        print(f"❌ Error analizando {nombre}: {e}")


def main():
    """Procesa todos los ejecutables"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("🚀 EXTRACTOR DE RECURSOS SMALLTALK BV8")
    print(f"📁 Output: {OUTPUT_DIR}\n")
    
    resultados = {}
    
    for nombre, ruta in EJECUTABLES.items():
        # Extraer RCDATA
        exito_ext, rcdata_file = extraer_rcdata(ruta, nombre)
        
        if not exito_ext:
            continue
        
        # Descomprimir Smalltalk image
        exito_dec, img_file = descomprimir_smalltalk_image(rcdata_file, nombre)
        
        if not exito_dec:
            continue
        
        # Análisis rápido
        analizar_smalltalk_image(img_file, nombre)
        
        resultados[nombre] = {
            "rcdata": rcdata_file,
            "image": img_file,
            "exito": True
        }
    
    print(f"\n{'='*60}")
    print(f"✅ EXTRACCIÓN COMPLETADA")
    print(f"{'='*60}")
    print(f"\nResultados:")
    for nombre, datos in resultados.items():
        if datos["exito"]:
            print(f"  ✅ {nombre}: {Path(datos['image']).name}")
    
    print(f"\n📁 Todos los archivos en: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
