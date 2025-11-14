#!/usr/bin/env python3
"""
Búsqueda PROFUNDA de dotación inicial vs dotación total
Diferenciando:
- DI (Dotación Inicial 24hs combate) - lo que lleva ENCIMA
- Dotación Total - lo que lleva en MOCHILA + chaleco
"""

import struct
import re
from pathlib import Path
from typing import List, Dict, Tuple

IMAGE_FILE = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa/recursos_extraidos/logistica_smalltalk.img")

# Términos clave a buscar
TERMINOS_CLAVE = [
    # Dotación Inicial (24hs)
    b'dotacionInicial',
    b'dotacion inicial',
    b'DI',
    b'24hs',
    b'24 hs',
    b'veinticuatro',
    
    # Dotación Total
    b'dotacionTotal',
    b'dotacion total',
    b'mochila',
    b'chaleco',
    b'portamuniciones',
    
    # Munición específica
    b'FAL',
    b'Fusil',
    b'cartuchos',
    b'cargadores',
    b'municiones',
    
    # Cantidades sospechosas
    b'100',
    b'300',
    b'200',
    b'140',
    b'160',
]

def buscar_contexto_amplio(data: bytes, termino: bytes, ventana: int = 500) -> List[Dict]:
    """Busca término con contexto muy amplio"""
    resultados = []
    
    for match in re.finditer(termino, data, re.IGNORECASE):
        offset = match.start()
        
        # Contexto grande
        start = max(0, offset - ventana)
        end = min(len(data), offset + ventana)
        context = data[start:end]
        
        try:
            # Decodificar contexto
            texto = context.decode('latin-1', errors='ignore')
            texto_limpio = ''.join(c if 32 <= ord(c) < 127 else ' ' for c in texto)
            texto_limpio = ' '.join(texto_limpio.split())
            
            # Buscar números en contexto
            numeros_texto = re.findall(r'\b\d+\b', texto_limpio)
            numeros_unicos = sorted(list(set([int(n) for n in numeros_texto if 0 < int(n) < 10000])))
            
            # Buscar palabras clave
            palabras_clave = []
            for keyword in [b'dotacion', b'inicial', b'total', b'mochila', b'chaleco', 
                           b'FAL', b'cartuchos', b'cargadores', b'24']:
                if keyword.lower() in context.lower():
                    palabras_clave.append(keyword.decode('latin-1'))
            
            resultados.append({
                'offset': f'0x{offset:x}',
                'termino': termino.decode('latin-1', errors='ignore'),
                'contexto': texto_limpio[:200],
                'numeros_cercanos': numeros_unicos[:15],
                'palabras_clave': list(set(palabras_clave))
            })
        except:
            pass
    
    return resultados


def buscar_metodos_relacionados(data: bytes) -> Dict[str, List[str]]:
    """Busca métodos relacionados con dotaciones"""
    
    # Extraer todos los métodos (pattern: palabra:)
    metodos_raw = re.findall(rb'[a-z][a-zA-Z0-9]*:', data)
    metodos = list(set([m.decode('latin-1', errors='ignore') for m in metodos_raw]))
    
    # Filtrar por palabras clave
    categorias = {
        'dotacion': [],
        'municion': [],
        'calculo': [],
        'cantidad': [],
        'total': [],
        'inicial': [],
        'mochila': [],
        'personal': []
    }
    
    for metodo in metodos:
        metodo_lower = metodo.lower()
        for categoria, lista in categorias.items():
            if categoria in metodo_lower:
                lista.append(metodo)
    
    return categorias


def analizar_secuencias_100_300(data: bytes) -> Dict:
    """Analiza relación entre valores 100 y 300"""
    
    # Buscar todas las ocurrencias de 100 y 300
    valor_100 = struct.pack('<i', 100)
    valor_300 = struct.pack('<i', 300)
    
    offsets_100 = [m.start() for m in re.finditer(re.escape(valor_100), data)]
    offsets_300 = [m.start() for m in re.finditer(re.escape(valor_300), data)]
    
    print(f"\n🔍 ANÁLISIS DE VALORES:")
    print(f"   Valor 100: {len(offsets_100)} ocurrencias")
    print(f"   Valor 300: {len(offsets_300)} ocurrencias")
    
    # Buscar pares cercanos (100 y 300 a menos de 200 bytes)
    pares_cercanos = []
    
    for off_100 in offsets_100:
        for off_300 in offsets_300:
            distancia = abs(off_100 - off_300)
            if distancia < 200:
                # Extraer contexto
                start = min(off_100, off_300) - 50
                end = max(off_100, off_300) + 50
                contexto = data[start:end]
                
                try:
                    texto = contexto.decode('latin-1', errors='ignore')
                    texto_limpio = ''.join(c if 32 <= ord(c) < 127 else ' ' for c in texto)
                    texto_limpio = ' '.join(texto_limpio.split())
                    
                    pares_cercanos.append({
                        'offset_100': f'0x{off_100:x}',
                        'offset_300': f'0x{off_300:x}',
                        'distancia': distancia,
                        'contexto': texto_limpio[:150]
                    })
                except:
                    pass
    
    return {
        'total_100': len(offsets_100),
        'total_300': len(offsets_300),
        'pares_cercanos': pares_cercanos[:10]  # Primeros 10
    }


def main():
    print("🔍 BÚSQUEDA PROFUNDA: DOTACIÓN INICIAL vs DOTACIÓN TOTAL")
    print("="*80)
    print("Hipótesis:")
    print("  • DI (Dotación Inicial 24hs): 100 cartuchos FAL (chaleco)")
    print("  • Dotación Total: 300 cartuchos FAL (chaleco + mochila)")
    print("="*80)
    
    if not IMAGE_FILE.exists():
        print(f"❌ No encontrado: {IMAGE_FILE}")
        return
    
    with open(IMAGE_FILE, 'rb') as f:
        data = f.read()
    
    print(f"\n✅ Cargado: {len(data):,} bytes\n")
    
    # 1. Buscar métodos relacionados
    print("="*80)
    print("📋 MÉTODOS RELACIONADOS CON DOTACIONES")
    print("="*80)
    
    metodos = buscar_metodos_relacionados(data)
    
    for categoria, lista in metodos.items():
        if lista:
            print(f"\n🔹 {categoria.upper()}:")
            for metodo in sorted(lista)[:10]:
                print(f"   • {metodo}")
    
    # 2. Buscar "dotacionInicial" con contexto amplio
    print("\n" + "="*80)
    print("🎯 BÚSQUEDA: 'dotacionInicial' (contexto 500 bytes)")
    print("="*80)
    
    resultados_di = buscar_contexto_amplio(data, b'dotacionInicial', ventana=500)
    
    for i, res in enumerate(resultados_di[:5], 1):
        print(f"\n📍 Ocurrencia {i} en {res['offset']}:")
        print(f"   Números cercanos: {', '.join(map(str, res['numeros_cercanos']))}")
        print(f"   Palabras clave: {', '.join(res['palabras_clave'])}")
        if res['contexto'].strip():
            print(f"   Contexto: {res['contexto'][:150]}...")
    
    # 3. Buscar "dotacionTotal" o "mochila"
    print("\n" + "="*80)
    print("🎯 BÚSQUEDA: 'dotacionTotal' / 'mochila'")
    print("="*80)
    
    for termino in [b'dotacionTotal', b'mochila', b'chaleco']:
        resultados = buscar_contexto_amplio(data, termino, ventana=300)
        if resultados:
            print(f"\n🔍 '{termino.decode()}': {len(resultados)} ocurrencias")
            for res in resultados[:2]:
                print(f"   {res['offset']}: números {res['numeros_cercanos'][:8]}")
        else:
            print(f"\n❌ '{termino.decode()}': No encontrado")
    
    # 4. Analizar relación 100-300
    print("\n" + "="*80)
    print("🔢 ANÁLISIS: Relación entre valores 100 y 300")
    print("="*80)
    
    analisis = analizar_secuencias_100_300(data)
    
    if analisis['pares_cercanos']:
        print(f"\n✅ Encontrados {len(analisis['pares_cercanos'])} pares 100-300 cercanos:\n")
        for par in analisis['pares_cercanos'][:5]:
            print(f"   100 en {par['offset_100']}, 300 en {par['offset_300']}")
            print(f"   Distancia: {par['distancia']} bytes")
            if par['contexto'].strip():
                print(f"   Contexto: {par['contexto'][:120]}...")
            print()
    else:
        print("\n❌ No se encontraron pares 100-300 cercanos")
    
    # 5. Buscar "24" o "veinticuatro" (duración DI)
    print("\n" + "="*80)
    print("🎯 BÚSQUEDA: '24 hs' / 'veinticuatro horas'")
    print("="*80)
    
    for termino in [b'24', b'veinticuatro']:
        resultados = buscar_contexto_amplio(data, termino, ventana=200)
        if resultados:
            print(f"\n🔍 '{termino.decode()}': {len(resultados)} ocurrencias")
            # Filtrar solo los que tengan palabras relacionadas
            relevantes = [r for r in resultados if any(k in r['palabras_clave'] for k in ['dotacion', 'inicial', 'horas', 'combate'])]
            for res in relevantes[:3]:
                print(f"   {res['offset']}: {res['palabras_clave']}")
                print(f"   Números: {res['numeros_cercanos'][:10]}")
    
    print("\n" + "="*80)
    print("💡 RECOMENDACIONES")
    print("="*80)
    print("""
1. Si encontramos pares 100-300 cercanos:
   → Posiblemente 100 = DI (24hs combate)
   → 300 = Dotación total (con mochila)

2. Buscar en otros módulos:
   → ccoo_smalltalk.img (organización)
   → bajas_smalltalk.img (consumos en combate)

3. Ejecutar BV8 y observar:
   → Crear un pelotón de fusileros
   → Ver dotaciones en UI/reportes
   → Capturar valores exactos
    """)


if __name__ == "__main__":
    main()
