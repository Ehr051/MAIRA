#!/usr/bin/env python3
"""
Analizador de Ejecutables BV8 - Fase 1
Extrae strings y busca patrones relacionados con dotaciones, consumos y algoritmos
"""

import subprocess
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set

# Rutas de ejecutables BV8
EJECUTABLES = {
    "CCOO": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Administración de CCOO/8/HACCOO_7_01_004.exe",
    "Logistica": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Planeamiento Logístico/8/HPL_7_01_004.exe",
    "Bajas": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Estimación de Bajas de Combate/8/HEBC_7_01_004.exe",
    "Fallas": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Estimación de Fallas/8/HEF_7_01_003.exe",
    "Terreno": "/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares/Estudio del Terreno/8/HET_7_01_005.exe"
}

# Patrones de búsqueda
PATRONES = {
    "dotaciones": [
        r"dotacion",
        r"agua",
        r"viveres",
        r"racion",
        r"municion",
        r"combustible",
        r"gasoil",
        r"nafta",
        r"diesel"
    ],
    "municiones": [
        r"cargador",
        r"cartucho",
        r"proyectil",
        r"cohete",
        r"granada",
        r"cart\s*7\.?62",
        r"cart\s*9\s*x\s*19",
        r"cart\s*12\.?7",
        r"proy\s*\d+"
    ],
    "consumos": [
        r"consumo",
        r"tasa.*consumo",
        r"litros.*dia",
        r"raciones.*dia",
        r"km.*litro"
    ],
    "bajas": [
        r"probabilidad.*baja",
        r"calcul.*baja",
        r"muerto",
        r"herido",
        r"ileso",
        r"eficiencia.*combate",
        r"moral"
    ],
    "fallas": [
        r"mtbf",
        r"mean.*time",
        r"falla",
        r"reparacion",
        r"tiempo.*reparacion",
        r"kilometros.*recorridos"
    ],
    "numeros_sospechosos": [
        r"\b3\b",       # Agua/víveres por día
        r"\b20\b",      # Cartuchos por cargador FAL
        r"\b100\b",     # Munición total FAL
        r"\b200\b",     # Cartuchos por cinta MAG
        r"\b400\b",     # Munición total MAG
        r"\b620\b",     # Combustible TAM
        r"\b360\b"      # Combustible M113
    ]
}

# Nombres de funciones probables
FUNCIONES_SOSPECHOSAS = [
    "calcular", "inicializar", "asignar", "obtener", "crear",
    "dotacion", "municion", "consumo", "baja", "falla",
    "Calcular", "Inicializar", "Asignar", "Obtener", "Crear"
]

OUTPUT_DIR = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa")


def extraer_strings(ejecutable: str) -> List[str]:
    """Extrae todos los strings de un ejecutable usando 'strings'"""
    try:
        result = subprocess.run(
            ["strings", "-a", ejecutable],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.splitlines()
    except subprocess.CalledProcessError as e:
        print(f"❌ Error extrayendo strings de {ejecutable}: {e}")
        return []


def buscar_patrones(strings: List[str], patrones: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """Busca patrones en la lista de strings"""
    resultados = {categoria: [] for categoria in patrones.keys()}
    
    for string in strings:
        for categoria, lista_patrones in patrones.items():
            for patron in lista_patrones:
                if re.search(patron, string, re.IGNORECASE):
                    if string not in resultados[categoria]:
                        resultados[categoria].append(string)
                    break
    
    return resultados


def buscar_funciones(strings: List[str]) -> List[str]:
    """Busca nombres de funciones sospechosas"""
    funciones = []
    for string in strings:
        # Funciones C++: Name@Class@@Signature
        if re.search(r"@@[A-Z]", string):
            funciones.append(string)
        # Funciones con nombres sospechosos
        elif any(func in string for func in FUNCIONES_SOSPECHOSAS):
            if len(string) < 100:  # Filtrar strings muy largos
                funciones.append(string)
    
    return list(set(funciones))[:100]  # Limitar a 100 resultados


def buscar_numeros_contexto(strings: List[str], numero: int, ventana: int = 5) -> List[Dict]:
    """Busca un número específico y retorna contexto (líneas antes/después)"""
    resultados = []
    
    for i, string in enumerate(strings):
        if re.search(rf"\b{numero}\b", string):
            contexto = {
                "linea": i,
                "string": string,
                "antes": strings[max(0, i-ventana):i],
                "despues": strings[i+1:min(len(strings), i+ventana+1)]
            }
            resultados.append(contexto)
    
    return resultados


def analizar_ejecutable(nombre: str, ruta: str) -> Dict:
    """Análisis completo de un ejecutable"""
    print(f"\n{'='*60}")
    print(f"ANALIZANDO: {nombre}")
    print(f"Ruta: {ruta}")
    print(f"{'='*60}")
    
    if not Path(ruta).exists():
        print(f"❌ Archivo no encontrado: {ruta}")
        return None
    
    # Extraer strings
    print("📝 Extrayendo strings...")
    strings_list = extraer_strings(ruta)
    print(f"✅ {len(strings_list):,} strings extraídos")
    
    # Buscar patrones
    print("🔍 Buscando patrones...")
    patrones_encontrados = buscar_patrones(strings_list, PATRONES)
    
    # Buscar funciones
    print("🔍 Buscando funciones...")
    funciones = buscar_funciones(strings_list)
    
    # Buscar números con contexto
    print("🔍 Buscando números sospechosos con contexto...")
    numeros_contexto = {}
    for numero in [3, 20, 100, 200, 400, 620, 360]:
        contextos = buscar_numeros_contexto(strings_list, numero)
        if contextos:
            numeros_contexto[str(numero)] = contextos[:10]  # Limitar a 10 resultados
    
    # Resumen
    print(f"\n📊 RESUMEN:")
    for categoria, resultados in patrones_encontrados.items():
        if resultados:
            print(f"  - {categoria}: {len(resultados)} coincidencias")
    print(f"  - funciones: {len(funciones)} encontradas")
    print(f"  - números con contexto: {len(numeros_contexto)} tipos")
    
    return {
        "nombre": nombre,
        "ruta": ruta,
        "fecha_analisis": datetime.now().isoformat(),
        "total_strings": len(strings_list),
        "strings_completos": strings_list,
        "patrones": patrones_encontrados,
        "funciones": funciones,
        "numeros_contexto": numeros_contexto,
        "estadisticas": {
            cat: len(res) for cat, res in patrones_encontrados.items()
        }
    }


def main():
    """Ejecuta análisis de todos los ejecutables"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("🚀 INICIANDO ANÁLISIS DE EJECUTABLES BV8")
    print(f"📁 Resultados en: {OUTPUT_DIR}\n")
    
    resultados_globales = {
        "version": "1.0.0",
        "fecha_analisis": datetime.now().isoformat(),
        "ejecutables": {}
    }
    
    for nombre, ruta in EJECUTABLES.items():
        resultado = analizar_ejecutable(nombre, ruta)
        if resultado:
            resultados_globales["ejecutables"][nombre] = resultado
            
            # Guardar resultado individual
            archivo_salida = OUTPUT_DIR / f"analisis_{nombre.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(archivo_salida, 'w', encoding='utf-8') as f:
                json.dump(resultado, f, indent=2, ensure_ascii=False)
            print(f"💾 Guardado en: {archivo_salida.name}")
    
    # Guardar resumen global
    archivo_resumen = OUTPUT_DIR / f"resumen_global_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # Crear versión sin strings completos (más compacto)
    resumen_compacto = {
        "version": resultados_globales["version"],
        "fecha_analisis": resultados_globales["fecha_analisis"],
        "ejecutables": {}
    }
    
    for nombre, datos in resultados_globales["ejecutables"].items():
        resumen_compacto["ejecutables"][nombre] = {
            "nombre": datos["nombre"],
            "ruta": datos["ruta"],
            "total_strings": datos["total_strings"],
            "estadisticas": datos["estadisticas"],
            "top_patrones": {
                cat: res[:20] for cat, res in datos["patrones"].items() if res
            },
            "top_funciones": datos["funciones"][:20],
            "numeros_contexto": datos["numeros_contexto"]
        }
    
    with open(archivo_resumen, 'w', encoding='utf-8') as f:
        json.dump(resumen_compacto, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"✅ ANÁLISIS COMPLETADO")
    print(f"📄 Resumen global: {archivo_resumen.name}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
