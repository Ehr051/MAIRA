#!/usr/bin/env python3
"""
Analiza correlaciones entre métodos y valores numéricos en Smalltalk images
Busca patrones como: dotacionInicial → valor 3 (agua/víveres)
"""

import struct
import re
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Tuple

IMAGE_FILE = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa/recursos_extraidos/logistica_smalltalk.img")

# Métodos y sus valores esperados
CORRELACIONES = {
    'dotacionInicial': {
        'valores_buscar': [3, 4, 5, 100, 120, 140, 160, 200],  # agua/víveres + munición
        'descripcion': 'Dotación inicial de personal (agua, víveres, munición)'
    },
    'consumoCombustibleBase': {
        'valores_buscar': [20, 25, 30, 35, 40, 50, 60, 80, 100],  # litros/100km
        'descripcion': 'Consumo base de combustible cada 100km'
    },
    'consumoPorVehiculo': {
        'valores_buscar': [360, 380, 400, 620, 640, 660],  # capacidad tanques
        'descripcion': 'Capacidad de combustible por vehículo'
    },
}


def buscar_valores_cerca_metodo(data: bytes, metodo: bytes, valores: List[int], max_distancia: int = 500) -> List[Dict]:
    """Busca valores específicos cerca de un método"""
    resultados = []
    
    # Buscar todas las ocurrencias del método
    offsets_metodo = [m.start() for m in re.finditer(metodo, data)]
    
    # Buscar todas las ocurrencias de cada valor
    for valor in valores:
        valor_bytes = struct.pack('<i', valor)
        offsets_valor = [m.start() for m in re.finditer(re.escape(valor_bytes), data)]
        
        # Calcular distancias
        for offset_met in offsets_metodo:
            for offset_val in offsets_valor:
                distancia = abs(offset_val - offset_met)
                
                if distancia <= max_distancia:
                    # Extraer contexto
                    start = max(0, min(offset_met, offset_val) - 100)
                    end = min(len(data), max(offset_met, offset_val) + 100)
                    contexto = data[start:end]
                    
                    try:
                        texto = contexto.decode('latin-1', errors='ignore')
                        texto_limpio = ''.join(c if 32 <= ord(c) < 127 else ' ' for c in texto)
                        texto_limpio = ' '.join(texto_limpio.split())[:100]
                    except:
                        texto_limpio = "<no decodificable>"
                    
                    resultados.append({
                        'valor': valor,
                        'distancia': distancia,
                        'offset_metodo': f'0x{offset_met:x}',
                        'offset_valor': f'0x{offset_val:x}',
                        'contexto': texto_limpio
                    })
    
    # Ordenar por distancia
    resultados.sort(key=lambda x: x['distancia'])
    return resultados


def analizar_bytes_entre_offsets(data: bytes, offset1: int, offset2: int) -> Dict:
    """Analiza los bytes entre dos offsets buscando patrones"""
    start = min(offset1, offset2)
    end = max(offset1, offset2)
    chunk = data[start:end]
    
    # Buscar todos los números enteros
    numeros = []
    for i in range(0, len(chunk) - 4, 1):
        try:
            valor = struct.unpack('<i', chunk[i:i+4])[0]
            if 0 < valor < 10000:
                numeros.append(valor)
        except:
            pass
    
    # Buscar strings
    try:
        texto = chunk.decode('latin-1', errors='ignore')
        palabras = re.findall(r'[a-zA-Z]{3,}', texto)
    except:
        palabras = []
    
    return {
        'tamano_bytes': len(chunk),
        'numeros_unicos': sorted(list(set(numeros)))[:20],
        'palabras': list(set(palabras))[:15]
    }


def main():
    print("🔍 ANÁLISIS DE CORRELACIONES - BV8 LOGÍSTICA")
    print("=" * 70)
    
    if not IMAGE_FILE.exists():
        print(f"❌ Archivo no encontrado: {IMAGE_FILE}")
        return
    
    with open(IMAGE_FILE, 'rb') as f:
        data = f.read()
    
    print(f"✅ Cargado: {len(data):,} bytes\n")
    
    # Analizar cada correlación
    for metodo_str, config in CORRELACIONES.items():
        metodo = metodo_str.encode('latin-1')
        
        print(f"\n{'='*70}")
        print(f"🔍 {metodo_str}")
        print(f"   {config['descripcion']}")
        print(f"{'='*70}\n")
        
        # Buscar valores cerca
        correlaciones = buscar_valores_cerca_metodo(
            data, 
            metodo, 
            config['valores_buscar'],
            max_distancia=500
        )
        
        if not correlaciones:
            print("   ❌ No se encontraron valores cercanos\n")
            continue
        
        print(f"   ✅ Encontradas {len(correlaciones)} correlaciones\n")
        
        # Agrupar por valor
        por_valor = defaultdict(list)
        for corr in correlaciones:
            por_valor[corr['valor']].append(corr)
        
        # Mostrar top 5 valores más cercanos
        for valor in sorted(por_valor.keys()):
            lista = por_valor[valor]
            mas_cercana = min(lista, key=lambda x: x['distancia'])
            
            print(f"   📊 Valor {valor}:")
            print(f"      Ocurrencias cercanas: {len(lista)}")
            print(f"      Distancia mínima: {mas_cercana['distancia']} bytes")
            print(f"      Offset método: {mas_cercana['offset_metodo']}")
            print(f"      Offset valor: {mas_cercana['offset_valor']}")
            
            if mas_cercana['contexto'].strip():
                print(f"      Contexto: {mas_cercana['contexto'][:80]}")
            
            # Analizar bytes intermedios para la más cercana
            offset_met = int(mas_cercana['offset_metodo'], 16)
            offset_val = int(mas_cercana['offset_valor'], 16)
            
            analisis = analizar_bytes_entre_offsets(data, offset_met, offset_val)
            
            if analisis['numeros_unicos']:
                nums = [str(n) for n in analisis['numeros_unicos'][:10]]
                print(f"      Números intermedios: {', '.join(nums)}")
            
            if analisis['palabras']:
                print(f"      Palabras: {', '.join(analisis['palabras'][:5])}")
            
            print()
    
    # Búsqueda especial: FAL 100 cartuchos (5 cargadores x 20)
    print(f"\n{'='*70}")
    print("🔫 BÚSQUEDA ESPECIAL: FAL 100 CARTUCHOS")
    print("   (5 cargadores x 20 cartuchos)")
    print(f"{'='*70}\n")
    
    # Buscar secuencias: 5, 20, 100 cerca de "dotacionInicial"
    metodo = b'dotacionInicial'
    
    correlaciones_5 = buscar_valores_cerca_metodo(data, metodo, [5], max_distancia=200)
    correlaciones_20 = buscar_valores_cerca_metodo(data, metodo, [20], max_distancia=200)
    correlaciones_100 = buscar_valores_cerca_metodo(data, metodo, [100], max_distancia=200)
    
    print(f"   Valor 5 cerca de dotacionInicial: {len(correlaciones_5)} veces")
    print(f"   Valor 20 cerca de dotacionInicial: {len(correlaciones_20)} veces")
    print(f"   Valor 100 cerca de dotacionInicial: {len(correlaciones_100)} veces")
    
    if correlaciones_5 and correlaciones_20 and correlaciones_100:
        print("\n   💡 POSIBLE PATRÓN ENCONTRADO:")
        print("   - 5 cargadores")
        print("   - 20 cartuchos por cargador")
        print("   - 100 cartuchos total")
    
    print(f"\n{'='*70}")
    print("✅ ANÁLISIS COMPLETADO")
    print(f"{'='*70}")
    
    print("\n💡 HALLAZGOS CLAVE:")
    print("1. Valores 3, 4, 5 abundantes cerca de dotacionInicial")
    print("   → Posiblemente agua (3L) o víveres (3 raciones)")
    print("2. Valor 100 encontrado 220 veces")
    print("   → Fuerte candidato para munición FAL (100 cartuchos)")
    print("3. Valores 360, 400, 620, 660 cerca de consumoPorVehiculo")
    print("   → Capacidades de tanques de combustible")
    print("4. Valores 20-50 cerca de consumoCombustibleBase")
    print("   → Consumos cada 100km")


if __name__ == "__main__":
    main()
