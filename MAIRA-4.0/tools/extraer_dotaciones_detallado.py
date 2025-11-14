#!/usr/bin/env python3
"""
Extractor de dotaciones iniciales desde Smalltalk de Logística
Busca patrones específicos de dotacionInicial con valores
"""
import re
from pathlib import Path

def extract_dotaciones_from_logistica():
    """Extrae dotaciones del módulo de logística"""
    
    img_path = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa/recursos_extraidos/logistica_smalltalk.img")
    
    with open(img_path, 'rb') as f:
        data = f.read()
    
    # Extraer strings
    strings = [
        s.decode('latin1', errors='ignore') 
        for s in data.split(b'\x00') 
        if 3 < len(s) < 500
    ]
    
    print("🔍 BUSCANDO DOTACIONES EN LOGÍSTICA\n")
    print("="*80)
    
    # 1. Buscar patrones de dotacionInicial con valores numéricos cercanos
    dotacion_patterns = [
        r'dotacionInicial.*?(\d+(?:\.\d+)?)',  # dotacionInicial seguido de número
        r'(\d+(?:\.\d+)?).*?dotacionInicial',  # número antes de dotacionInicial
    ]
    
    dotaciones_encontradas = []
    
    for i, s in enumerate(strings):
        if 'dotacionInicial' in s.lower():
            # Contexto: 5 strings antes y después
            context_before = strings[max(0, i-5):i]
            context_after = strings[i+1:min(len(strings), i+6)]
            
            # Buscar números en contexto
            all_context = ' '.join(context_before + [s] + context_after)
            numbers = re.findall(r'\b\d+(?:\.\d+)?\b', all_context)
            
            dotaciones_encontradas.append({
                'string': s,
                'context_before': context_before,
                'context_after': context_after,
                'numbers_in_context': [float(n) for n in numbers if 0 < float(n) < 10000]
            })
    
    print(f"✅ Encontrados {len(dotaciones_encontradas)} strings con 'dotacionInicial'\n")
    
    # Mostrar ejemplos con más contexto
    print("📋 EJEMPLOS CON CONTEXTO:\n")
    
    for i, dot in enumerate(dotaciones_encontradas[:30], 1):
        print(f"\n{i}. String principal:")
        print(f"   {dot['string'][:150]}")
        
        if dot['numbers_in_context']:
            print(f"   Números en contexto: {dot['numbers_in_context'][:10]}")
        
        if dot['context_before']:
            print(f"   Antes: {' | '.join(s[:80] for s in dot['context_before'][-2:])}")
        
        if dot['context_after']:
            print(f"   Después: {' | '.join(s[:80] for s in dot['context_after'][:2])}")
    
    # 2. Buscar clases específicas de Elemento (vehículos, unidades)
    print("\n\n" + "="*80)
    print("🚗 BUSCANDO ELEMENTOS (VEHÍCULOS/UNIDADES)\n")
    
    # Buscar patrones de definición de elementos
    elemento_keywords = ['Elemento', 'Vehiculo', 'Unidad', 'Material']
    
    elementos = []
    for s in strings:
        for keyword in elemento_keywords:
            if keyword in s and len(s) < 100:
                elementos.append(s)
                break
    
    print(f"✅ Encontrados {len(elementos)} strings relacionados con elementos\n")
    print("📋 EJEMPLOS:\n")
    
    for i, elem in enumerate(elementos[:20], 1):
        print(f"{i:2}. {elem}")
    
    # 3. Buscar valores de combustible
    print("\n\n" + "="*80)
    print("⛽ BUSCANDO VALORES DE COMBUSTIBLE\n")
    
    combustible_strings = [s for s in strings if 'combustible' in s.lower() and len(s) < 200]
    
    print(f"✅ Encontrados {len(combustible_strings)} strings con 'combustible'\n")
    print("📋 EJEMPLOS CON NÚMEROS:\n")
    
    for i, s in enumerate(combustible_strings[:30], 1):
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', s)
        if numbers:
            print(f"{i:2}. {s[:120]}")
            print(f"    Números: {', '.join(numbers[:5])}")
    
    # 4. Buscar municiones
    print("\n\n" + "="*80)
    print("💣 BUSCANDO VALORES DE MUNICIÓN\n")
    
    municion_strings = [s for s in strings if 'municion' in s.lower() or 'munición' in s.lower()]
    
    print(f"✅ Encontrados {len(municion_strings)} strings con 'municion'\n")
    print("📋 EJEMPLOS:\n")
    
    for i, s in enumerate(municion_strings[:20], 1):
        print(f"{i:2}. {s[:120]}")
    
    return {
        'dotaciones': dotaciones_encontradas,
        'elementos': elementos,
        'combustible': combustible_strings,
        'municion': municion_strings
    }


if __name__ == '__main__':
    results = extract_dotaciones_from_logistica()
    print(f"\n\n{'='*80}")
    print("📊 RESUMEN:")
    print(f"  - Dotaciones: {len(results['dotaciones'])} referencias")
    print(f"  - Elementos: {len(results['elementos'])} strings")
    print(f"  - Combustible: {len(results['combustible'])} strings")
    print(f"  - Munición: {len(results['municion'])} strings")
