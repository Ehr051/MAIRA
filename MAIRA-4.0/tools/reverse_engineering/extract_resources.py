#!/usr/bin/env python3
"""
BV8 Resource Extractor
======================
Extrae recursos de los ejecutables BV8 (tablas, diálogos, strings de recursos)
Los ejecutables Delphi guardan mucha información en la sección de recursos

Uso:
    python extract_resources.py <archivo.exe>
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List

try:
    import pefile
    from rich.console import Console
    from rich.tree import Tree
    import pandas as pd
except ImportError:
    print("Instalando dependencias...")
    os.system("pip install pefile rich pandas")
    import pefile
    from rich.console import Console
    from rich.tree import Tree
    import pandas as pd

console = Console()


class BV8ResourceExtractor:
    """Extrae recursos de ejecutables Delphi/BV8"""
    
    # Tipos de recursos comunes en Windows PE
    RESOURCE_TYPES = {
        1: 'RT_CURSOR',
        2: 'RT_BITMAP',
        3: 'RT_ICON',
        4: 'RT_MENU',
        5: 'RT_DIALOG',
        6: 'RT_STRING',
        7: 'RT_FONTDIR',
        8: 'RT_FONT',
        9: 'RT_ACCELERATOR',
        10: 'RT_RCDATA',      # Datos personalizados (¡importantes!)
        11: 'RT_MESSAGETABLE',
        12: 'RT_GROUP_CURSOR',
        14: 'RT_GROUP_ICON',
        16: 'RT_VERSION',
        17: 'RT_DLGINCLUDE',
        19: 'RT_PLUGPLAY',
        20: 'RT_VXD',
        21: 'RT_ANICURSOR',
        22: 'RT_ANIICON',
        23: 'RT_HTML',
        24: 'RT_MANIFEST'
    }
    
    def __init__(self, exe_path: str):
        self.exe_path = Path(exe_path)
        self.pe = None
        self.resources = {}
        
    def load_pe(self):
        """Cargar ejecutable PE"""
        try:
            self.pe = pefile.PE(str(self.exe_path))
            console.print(f"[green]✓[/green] Cargado: {self.exe_path.name}")
            return True
        except Exception as e:
            console.print(f"[red]✗[/red] Error: {e}")
            return False
    
    def extract_resources(self):
        """Extraer todos los recursos"""
        if not hasattr(self.pe, 'DIRECTORY_ENTRY_RESOURCE'):
            console.print("[yellow]⚠[/yellow] No hay recursos en este ejecutable")
            return {}
        
        tree = Tree(f"[bold cyan]Recursos: {self.exe_path.name}[/bold cyan]")
        
        for resource_type in self.pe.DIRECTORY_ENTRY_RESOURCE.entries:
            # Tipo de recurso
            if resource_type.name is not None:
                type_name = str(resource_type.name)
            else:
                type_id = resource_type.struct.Id
                type_name = self.RESOURCE_TYPES.get(type_id, f"UNKNOWN_{type_id}")
            
            type_branch = tree.add(f"[yellow]{type_name}[/yellow]")
            self.resources[type_name] = []
            
            # Entradas del tipo de recurso
            if hasattr(resource_type, 'directory'):
                for resource_id in resource_type.directory.entries:
                    if hasattr(resource_id, 'directory'):
                        for resource_lang in resource_id.directory.entries:
                            data_rva = resource_lang.data.struct.OffsetToData
                            size = resource_lang.data.struct.Size
                            data = self.pe.get_memory_mapped_image()[data_rva:data_rva + size]
                            
                            resource_info = {
                                'type': type_name,
                                'id': resource_id.id if hasattr(resource_id, 'id') else str(resource_id.name),
                                'size': size,
                                'data': data
                            }
                            
                            self.resources[type_name].append(resource_info)
                            type_branch.add(f"ID: {resource_info['id']} | Size: {size} bytes")
        
        console.print(tree)
        return self.resources
    
    def extract_rcdata(self, output_dir: str = "rcdata_output"):
        """Extraer RT_RCDATA (datos personalizados - aquí pueden estar las tablas)"""
        os.makedirs(output_dir, exist_ok=True)
        
        if 'RT_RCDATA' not in self.resources:
            console.print("[yellow]⚠[/yellow] No hay RT_RCDATA")
            return
        
        console.print(f"\n[bold cyan]Extrayendo RT_RCDATA...[/bold cyan]")
        
        for idx, resource in enumerate(self.resources['RT_RCDATA']):
            data = resource['data']
            resource_id = resource['id']
            
            # Intentar detectar el tipo de datos
            output_file = os.path.join(output_dir, f"rcdata_{resource_id}.bin")
            
            with open(output_file, 'wb') as f:
                f.write(data)
            
            console.print(f"  [green]✓[/green] {output_file} ({len(data)} bytes)")
            
            # Intentar parsear como texto
            try:
                text = data.decode('ascii', errors='ignore')
                if len([c for c in text if c.isprintable()]) / len(text) > 0.7:
                    text_file = output_file.replace('.bin', '.txt')
                    with open(text_file, 'w') as f:
                        f.write(text)
                    console.print(f"    [blue]→[/blue] También guardado como texto: {text_file}")
            except:
                pass
    
    def extract_strings_table(self):
        """Extraer tabla de strings (RT_STRING)"""
        if 'RT_STRING' not in self.resources:
            return []
        
        strings = []
        for resource in self.resources['RT_STRING']:
            data = resource['data']
            # Las string tables de Windows tienen formato especial
            # Cada entrada: [len:WORD][string:len*WCHAR]
            offset = 0
            while offset < len(data):
                if offset + 2 > len(data):
                    break
                length = int.from_bytes(data[offset:offset+2], 'little')
                offset += 2
                if length > 0 and offset + length * 2 <= len(data):
                    string_data = data[offset:offset + length * 2]
                    try:
                        string = string_data.decode('utf-16le')
                        strings.append(string)
                    except:
                        pass
                    offset += length * 2
                else:
                    break
        
        return strings
    
    def analyze_dialog_resources(self):
        """Analizar recursos de diálogos (pueden contener labels de tablas)"""
        if 'RT_DIALOG' not in self.resources:
            return []
        
        dialogs = []
        for resource in self.resources['RT_DIALOG']:
            # Los diálogos tienen estructura DLGTEMPLATE
            # Por ahora solo extraemos las strings
            data = resource['data']
            strings = []
            
            # Buscar strings Unicode
            import re
            unicode_strings = re.findall(b'(?:[\x20-\x7E]\x00){4,}', data)
            for s in unicode_strings:
                try:
                    strings.append(s.decode('utf-16le'))
                except:
                    pass
            
            if strings:
                dialogs.append({
                    'id': resource['id'],
                    'strings': strings
                })
        
        return dialogs
    
    def export_summary(self, output_path: str):
        """Exportar resumen de recursos"""
        summary = {
            'executable': str(self.exe_path),
            'resource_types': list(self.resources.keys()),
            'total_resources': sum(len(v) for v in self.resources.values()),
            'strings': self.extract_strings_table(),
            'dialogs': self.analyze_dialog_resources()
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        console.print(f"\n[green]✓[/green] Resumen exportado: {output_path}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Extraer recursos de ejecutables BV8")
    parser.add_argument('exe_path', help='Ruta al ejecutable .exe')
    parser.add_argument('--output', '-o', default='resources_output', help='Directorio de salida')
    parser.add_argument('--rcdata', action='store_true', help='Extraer RT_RCDATA')
    
    args = parser.parse_args()
    
    extractor = BV8ResourceExtractor(args.exe_path)
    
    if not extractor.load_pe():
        sys.exit(1)
    
    console.print("\n[bold cyan]Extrayendo recursos...[/bold cyan]")
    extractor.extract_resources()
    
    if args.rcdata:
        extractor.extract_rcdata(os.path.join(args.output, 'rcdata'))
    
    output_file = os.path.join(args.output, f"{Path(args.exe_path).stem}_resources.json")
    os.makedirs(args.output, exist_ok=True)
    extractor.export_summary(output_file)


if __name__ == "__main__":
    main()
