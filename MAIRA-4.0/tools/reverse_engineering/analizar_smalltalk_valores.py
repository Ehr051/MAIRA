#!/usr/bin/env python3
"""
Analizador de Smalltalk Images BV8
Busca valores numéricos cerca de métodos clave (dotacionInicial, consumoCombustible, etc.)
"""

import struct
import re
from pathlib import Path
from typing import List, Dict, Tuple

# Métodos clave a buscar
METODOS_CLAVE = [
    b'dotacionInicial',
    b'consumoCombustibleBase',
    b'consumoPorVehiculo',
    b'obtenerConsumoCada100km',
    b'cantidadDotacionInicial',
    b'calcularAsignacionCombustible'
]

# Patrones de valores sospechosos
VALORES_SOSPECHOSOS = {
    'agua_viveres': [3, 4, 5],  # litros/raciones por día
    'municion_fal': [100, 120, 140, 160],  # cartuchos FAL
    'municion_mag': [200, 400, 600, 800],  # cartuchos MAG
    'combustible_tam': [620, 640, 660],  # litros diesel TAM
    'combustible_m113': [360, 380, 400],  # litros nafta M113
    'consumo_100km': [20, 25, 30, 35, 40, 50]  # litros cada 100km
}

IMAGE_FILE = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa/recursos_extraidos/logistica_smalltalk.img")


def buscar_metodo_con_contexto(data: bytes, metodo: bytes, ventana: int = 200) -> List[Dict]:
    """Busca un método y extrae contexto numérico"""
    resultados = []
    
    for match in re.finditer(metodo, data):
        offset = match.start()
        
        # Contexto antes y después
        start = max(0, offset - ventana)
        end = min(len(data), offset + ventana)
        context = data[start:end]
        
        # Buscar números enteros (4 bytes little-endian)
        numeros_int = []
        for i in range(0, len(context) - 4, 1):
            try:
                valor = struct.unpack('<i', context[i:i+4])[0]
                # Filtrar valores razonables (0 a 10000)
                if 0 < valor < 10000:
                    numeros_int.append((i + start, valor))
            except:
                pass
        
        # Buscar números float (4 bytes little-endian)
        numeros_float = []
        for i in range(0, len(context) - 4, 1):
            try:
                valor = struct.unpack('<f', context[i:i+4])[0]
                # Filtrar valores razonables
                if 0 < valor < 10000 and not (valor != valor):  # NaN check
                    numeros_float.append((i + start, valor))
            except:
                pass
        
        # Buscar strings ASCII cercanos
        try:
            text = context.decode('latin-1', errors='ignore')
            strings = re.findall(r'[a-zA-Z]{3,}', text)
        except:
            strings = []
        
        resultados.append({
            'offset': f'0x{offset:x}',
            'metodo': metodo.decode('latin-1'),
            'numeros_int': numeros_int[:20],  # Primeros 20
            'numeros_float': numeros_float[:20],
            'strings_cercanos': strings[:10]
        })
    
    return resultados


def analizar_valores_sospechosos(data: bytes) -> Dict[str, List[Tuple[int, int]]]:
    """Busca valores sospechosos específicos en el image"""
    encontrados = {}
    
    for categoria, valores in VALORES_SOSPECHOSOS.items():
        encontrados[categoria] = []
        
        for valor in valores:
            # Buscar como int32 little-endian
            valor_bytes = struct.pack('<i', valor)
            
            for match in re.finditer(re.escape(valor_bytes), data):
                offset = match.start()
                encontrados[categoria].append((offset, valor))
    
    return encontrados


def extraer_contexto_texto(data: bytes, offset: int, ventana: int = 100) -> str:
    """Extrae contexto de texto alrededor de un offset"""
    start = max(0, offset - ventana)
    end = min(len(data), offset + ventana)
    context = data[start:end]
    
    try:
        return context.decode('latin-1', errors='ignore')
    except:
        return "<no decodificable>"


def main():
    print("🔍 ANALIZADOR DE SMALLTALK IMAGE - BV8 LOGÍSTICA")
    print("=" * 70)
    
    if not IMAGE_FILE.exists():
        print(f"❌ Archivo no encontrado: {IMAGE_FILE}")
        return
    
    # Cargar image
    print(f"\n📂 Cargando: {IMAGE_FILE.name}")
    with open(IMAGE_FILE, 'rb') as f:
        data = f.read()
    
    print(f"✅ Cargado: {len(data):,} bytes ({len(data)/1024/1024:.2f} MB)")
    
    # Analizar cada método clave
    print(f"\n{'='*70}")
    print("BÚSQUEDA DE MÉTODOS CLAVE")
    print(f"{'='*70}\n")
    
    for metodo in METODOS_CLAVE:
        print(f"\n🔍 Buscando: {metodo.decode('latin-1')}")
        resultados = buscar_metodo_con_contexto(data, metodo)
        
        if not resultados:
            print(f"   ❌ No encontrado")
            continue
        
        print(f"   ✅ Encontrado {len(resultados)} veces\n")
        
        for i, res in enumerate(resultados[:3], 1):  # Primeras 3 ocurrencias
            print(f"   Ocurrencia {i} en {res['offset']}:")
            
            # Mostrar números enteros únicos y razonables
            numeros_unicos = list(set([v for _, v in res['numeros_int']]))
            numeros_razonables = [n for n in numeros_unicos if n in range(1, 1000)]
            
            if numeros_razonables:
                print(f"      Números cercanos: {', '.join(map(str, sorted(numeros_razonables)[:15]))}")
            
            # Mostrar floats únicos
            floats_unicos = list(set([round(v, 2) for _, v in res['numeros_float']]))
            floats_razonables = [f for f in floats_unicos if 0 < f < 1000]
            
            if floats_razonables:
                print(f"      Floats cercanos: {', '.join(map(str, sorted(floats_razonables)[:10]))}")
            
            # Mostrar strings
            if res['strings_cercanos']:
                print(f"      Strings: {', '.join(res['strings_cercanos'][:5])}")
            print()
    
    # Buscar valores sospechosos específicos
    print(f"\n{'='*70}")
    print("BÚSQUEDA DE VALORES SOSPECHOSOS")
    print(f"{'='*70}\n")
    
    valores_encontrados = analizar_valores_sospechosos(data)
    
    for categoria, lista in valores_encontrados.items():
        if lista:
            print(f"\n📊 {categoria.replace('_', ' ').title()}:")
            
            # Agrupar por valor
            por_valor = {}
            for offset, valor in lista:
                if valor not in por_valor:
                    por_valor[valor] = []
                por_valor[valor].append(offset)
            
            for valor, offsets in sorted(por_valor.items()):
                print(f"   Valor {valor}: {len(offsets)} ocurrencias")
                
                # Mostrar contexto de las primeras 2 ocurrencias
                for offset in offsets[:2]:
                    contexto = extraer_contexto_texto(data, offset, 50)
                    # Limpiar contexto
                    contexto_limpio = ''.join(c if 32 <= ord(c) < 127 else ' ' for c in contexto)
                    contexto_limpio = ' '.join(contexto_limpio.split())[:80]
                    
                    if contexto_limpio.strip():
                        print(f"      0x{offset:x}: ...{contexto_limpio}...")
    
    print(f"\n{'='*70}")
    print("✅ ANÁLISIS COMPLETADO")
    print(f"{'='*70}")
    
    print("\n💡 PRÓXIMOS PASOS:")
    print("1. Revisar números cerca de métodos clave")
    print("2. Correlacionar valores con documentación BV8")
    print("3. Validar contra ejercicios BV8 conocidos")
    print("4. Documentar en ALGORITMOS_BV8.md")


if __name__ == "__main__":
    main()
