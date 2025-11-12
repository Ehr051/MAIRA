#!/usr/bin/env python3
"""
BV8 String Extractor
====================
Extrae todas las strings de los ejecutables de Batalla Virtual 8
y las organiza por categorías (números, factores, nombres, etc.)

Uso:
    python extract_strings.py <archivo.exe>
    python extract_strings.py --all  # Analiza todos los .exe de BV8
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Set
from collections import defaultdict

try:
    import pefile
    from rich.console import Console
    from rich.table import Table
    from rich.progress import track
    import pandas as pd
except ImportError:
    print("ERROR: Instalando dependencias...")
    os.system("pip install pefile rich pandas")
    import pefile
    from rich.console import Console
    from rich.table import Table
    from rich.progress import track
    import pandas as pd

console = Console()


class BV8StringExtractor:
    """Extractor de strings de ejecutables BV8"""
    
    def __init__(self, exe_path: str):
        self.exe_path = Path(exe_path)
        self.pe = None
        self.strings = {
            'numeros_flotantes': [],      # 0.5, 1.2, etc.
            'factores': [],                # Números que parecen factores
            'nombres_terreno': [],         # BOSQUE, URBANO, etc.
            'nombres_clima': [],           # LLUVIA, NIEVE, etc.
            'nombres_armas': [],           # FAL, TAM, etc.
            'tablas_datos': [],            # Estructuras tabulares
            'constantes': [],              # Constantes importantes
            'otros': []
        }
        
    def load_pe(self):
        """Cargar ejecutable PE"""
        try:
            self.pe = pefile.PE(str(self.exe_path))
            console.print(f"[green]✓[/green] Cargado: {self.exe_path.name}")
            return True
        except Exception as e:
            console.print(f"[red]✗[/red] Error cargando {self.exe_path.name}: {e}")
            return False
    
    def extract_strings(self, min_length: int = 4) -> List[str]:
        """Extraer todas las strings del ejecutable"""
        strings = []
        
        # Método 1: Desde secciones del PE
        for section in self.pe.sections:
            data = section.get_data()
            # Buscar strings ASCII
            ascii_strings = re.findall(b'[\x20-\x7E]{%d,}' % min_length, data)
            strings.extend([s.decode('ascii', errors='ignore') for s in ascii_strings])
            
            # Buscar strings Unicode (UTF-16LE)
            unicode_strings = re.findall(b'(?:[\x20-\x7E]\x00){%d,}' % min_length, data)
            strings.extend([s.decode('utf-16le', errors='ignore') for s in unicode_strings])
        
        return list(set(strings))  # Eliminar duplicados
    
    def classify_strings(self, strings: List[str]):
        """Clasificar strings por tipo"""
        
        # Patrones de detección
        patterns = {
            'numero_flotante': r'^[-+]?\d*\.\d+$',
            'factor': r'^[01]\.\d{1,2}$',  # 0.5, 1.2, etc.
            'terreno': r'(BOSQUE|URBANO|MONTAÑA|COLINA|ABIERTO|PANTANO|DESIERTO)',
            'clima': r'(DESPEJADO|LLUVIA|NIEBLA|NIEVE|NUBLADO|TORMENTA|VENTISCA)',
            'arma': r'(FAL|FN|MAG|TAM|VCTP|MORTERO|CAÑON|OBÚS)',
        }
        
        for string in strings:
            string_upper = string.upper()
            
            # Números flotantes
            if re.match(patterns['numero_flotante'], string):
                self.strings['numeros_flotantes'].append(float(string))
            
            # Factores (números entre 0.0 y 2.0)
            elif re.match(patterns['factor'], string):
                factor = float(string)
                if 0.0 <= factor <= 2.0:
                    self.strings['factores'].append(factor)
            
            # Nombres de terreno
            elif re.search(patterns['terreno'], string_upper):
                self.strings['nombres_terreno'].append(string)
            
            # Nombres de clima
            elif re.search(patterns['clima'], string_upper):
                self.strings['nombres_clima'].append(string)
            
            # Nombres de armas
            elif re.search(patterns['arma'], string_upper):
                self.strings['nombres_armas'].append(string)
            
            # Otros
            else:
                if len(string) > 3 and len(string) < 100:
                    self.strings['otros'].append(string)
    
    def find_constants(self):
        """Buscar constantes numéricas en el código"""
        # Buscar en sección .data (datos inicializados)
        for section in self.pe.sections:
            if b'.data' in section.Name:
                data = section.get_data()
                
                # Buscar floats de 32 bits
                import struct
                for i in range(0, len(data) - 4, 4):
                    try:
                        value = struct.unpack('<f', data[i:i+4])[0]
                        # Filtrar valores que parecen factores
                        if 0.0 <= value <= 2.0 and not (value == 0.0 or value == 1.0):
                            self.strings['constantes'].append(round(value, 3))
                    except:
                        pass
    
    def export_json(self, output_path: str):
        """Exportar resultados a JSON"""
        # Eliminar duplicados y ordenar
        for key in self.strings:
            if isinstance(self.strings[key][0] if self.strings[key] else None, (int, float)):
                self.strings[key] = sorted(list(set(self.strings[key])))
            else:
                self.strings[key] = sorted(list(set(self.strings[key])))
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.strings, f, indent=2, ensure_ascii=False)
        
        console.print(f"[green]✓[/green] Exportado: {output_path}")
    
    def print_summary(self):
        """Imprimir resumen en consola"""
        table = Table(title=f"Análisis: {self.exe_path.name}")
        table.add_column("Categoría", style="cyan")
        table.add_column("Cantidad", justify="right", style="magenta")
        table.add_column("Ejemplos", style="green")
        
        for category, items in self.strings.items():
            if items:
                ejemplos = str(items[:3])[:50] + "..."
                table.add_row(category, str(len(items)), ejemplos)
        
        console.print(table)


def analyze_executable(exe_path: str, output_dir: str = "output"):
    """Analizar un ejecutable BV8"""
    extractor = BV8StringExtractor(exe_path)
    
    if not extractor.load_pe():
        return None
    
    console.print("[yellow]→[/yellow] Extrayendo strings...")
    strings = extractor.extract_strings()
    console.print(f"[green]✓[/green] {len(strings)} strings encontradas")
    
    console.print("[yellow]→[/yellow] Clasificando strings...")
    extractor.classify_strings(strings)
    
    console.print("[yellow]→[/yellow] Buscando constantes...")
    extractor.find_constants()
    
    # Exportar
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"{Path(exe_path).stem}_strings.json")
    extractor.export_json(output_file)
    
    extractor.print_summary()
    
    return extractor.strings


def analyze_all_bv8(bv8_dir: str = "/Users/mac/Downloads/Batalla Virtual 8 2019"):
    """Analizar todos los ejecutables de BV8"""
    console.print(f"[bold cyan]Analizando todos los ejecutables en:[/bold cyan] {bv8_dir}")
    
    exe_files = []
    for root, dirs, files in os.walk(bv8_dir):
        for file in files:
            if file.endswith('.exe') and not file.startswith('Componente'):
                exe_files.append(os.path.join(root, file))
    
    console.print(f"[green]Encontrados {len(exe_files)} ejecutables[/green]\n")
    
    results = {}
    for exe_file in track(exe_files, description="Analizando..."):
        result = analyze_executable(exe_file, output_dir="bv8_analysis")
        if result:
            results[Path(exe_file).stem] = result
    
    # Consolidar resultados
    console.print("\n[bold green]✓ Análisis completado[/bold green]")
    console.print(f"Resultados en: bv8_analysis/")
    
    return results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Extraer strings de ejecutables BV8")
    parser.add_argument('exe_path', nargs='?', help='Ruta al ejecutable .exe')
    parser.add_argument('--all', action='store_true', help='Analizar todos los ejecutables de BV8')
    parser.add_argument('--output', '-o', default='output', help='Directorio de salida')
    
    args = parser.parse_args()
    
    if args.all:
        analyze_all_bv8()
    elif args.exe_path:
        analyze_executable(args.exe_path, args.output)
    else:
        parser.print_help()
        sys.exit(1)
