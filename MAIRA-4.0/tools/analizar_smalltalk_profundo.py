#!/usr/bin/env python3
"""
Analizador Profundo de Smalltalk Images BV8
Extrae: clases, métodos, valores numéricos, strings relevantes
"""
import re
import json
from pathlib import Path
from collections import defaultdict, Counter

class SmallTalkAnalyzer:
    def __init__(self, img_path):
        self.img_path = Path(img_path)
        self.module_name = self.img_path.stem.replace('_smalltalk', '')
        
        with open(img_path, 'rb') as f:
            self.data = f.read()
        
        # Extraer strings (separados por null bytes)
        self.strings = [
            s.decode('latin1', errors='ignore') 
            for s in self.data.split(b'\x00') 
            if 3 < len(s) < 200
        ]
        
        self.results = {
            'module': self.module_name,
            'size_mb': len(self.data) / 1024 / 1024,
            'total_strings': len(self.strings),
            'classes': {},
            'numeric_values': {},
            'keywords_found': {},
            'methods_of_interest': []
        }
    
    def find_classes(self):
        """Busca clases Smalltalk (nombres capitalizados, alfanuméricos)"""
        # Clases típicas: CamelCase, empiezan con mayúscula
        class_pattern = re.compile(r'^[A-Z][a-zA-Z0-9]{2,40}$')
        
        classes = defaultdict(int)
        for s in self.strings:
            if class_pattern.match(s):
                classes[s] += 1
        
        # Filtrar clases más probables (aparecen múltiples veces)
        self.results['classes'] = {
            cls: count 
            for cls, count in classes.items() 
            if count >= 2  # Aparece al menos 2 veces
        }
        
        return len(self.results['classes'])
    
    def find_numeric_values(self):
        """Busca valores numéricos en contexto (método: valor)"""
        # Patrones de asignación/retorno
        patterns = [
            r'(\w+):\s*(\d+(?:\.\d+)?)',  # metodo: 123 o metodo: 123.45
            r'(\w+)\s*:=\s*(\d+(?:\.\d+)?)',  # metodo := 123
            r'^(\d+(?:\.\d+)?)$',  # Solo números
        ]
        
        numeric_contexts = []
        
        for s in self.strings:
            for pattern in patterns:
                matches = re.findall(pattern, s)
                if matches:
                    for match in matches:
                        if len(match) == 2:  # (método, valor)
                            numeric_contexts.append({
                                'method': match[0],
                                'value': float(match[1]),
                                'context': s[:100]
                            })
                        else:  # Solo valor
                            try:
                                val = float(match)
                                if 0 < val < 1000000:  # Rango razonable
                                    numeric_contexts.append({
                                        'method': 'unknown',
                                        'value': val,
                                        'context': s[:100]
                                    })
                            except:
                                pass
        
        self.results['numeric_values'] = numeric_contexts[:500]  # Limitar
        return len(numeric_contexts)
    
    def find_keywords(self):
        """Busca keywords específicos relevantes para MAIRA"""
        keywords = {
            # Logística
            'dotacion': ['dotacion', 'dotación', 'Dotacion'],
            'combustible': ['combustible', 'Combustible', 'consumoCombustible'],
            'municion': ['municion', 'munición', 'Municion', 'Munición'],
            'abastecimiento': ['abastecimiento', 'Abastecimiento'],
            'cajon': ['cajon', 'cajón', 'Cajon'],
            'transporte': ['transporte', 'Transporte'],
            'capacidad': ['capacidad', 'Capacidad'],
            'volumen': ['volumen', 'Volumen'],
            
            # CCOO
            'elemento': ['Elemento', 'elemento'],
            'organizacion': ['organizacion', 'organización', 'Organizacion'],
            'cuadro': ['cuadro', 'Cuadro', 'CCOO'],
            'personal': ['personal', 'Personal'],
            'efectivo': ['efectivo', 'Efectivo'],
            
            # Bajas
            'baja': ['baja', 'Baja', 'bajas', 'Bajas'],
            'herido': ['herido', 'Herido', 'heridos'],
            'muerto': ['muerto', 'Muerto', 'muertos'],
            'desaparecido': ['desaparecido', 'Desaparecido'],
            'prisionero': ['prisionero', 'Prisionero', 'PG'],
            'combate': ['combate', 'Combate'],
            
            # Fallas
            'falla': ['falla', 'Falla', 'fallas'],
            'mtbf': ['mtbf', 'MTBF'],
            'mantenimiento': ['mantenimiento', 'Mantenimiento'],
            'reparacion': ['reparacion', 'reparación', 'Reparacion'],
            
            # Terreno
            'terreno': ['terreno', 'Terreno'],
            'transitabilidad': ['transitabilidad', 'Transitabilidad'],
            'suelo': ['suelo', 'Suelo'],
            'pendiente': ['pendiente', 'Pendiente'],
            
            # Vehículos/Material
            'vehiculo': ['vehiculo', 'vehículo', 'Vehiculo'],
            'velocidad': ['velocidad', 'Velocidad'],
            'autonomia': ['autonomia', 'autonomía', 'Autonomia'],
            'peso': ['peso', 'Peso'],
        }
        
        found = defaultdict(list)
        
        for category, terms in keywords.items():
            for s in self.strings:
                for term in terms:
                    if term in s and len(s) < 150:
                        found[category].append(s)
                        break  # Solo una coincidencia por string
        
        # Limitar a 20 ejemplos por categoría
        self.results['keywords_found'] = {
            cat: examples[:20] 
            for cat, examples in found.items() 
            if examples
        }
        
        return len(found)
    
    def find_methods_of_interest(self):
        """Busca métodos específicos de interés"""
        methods_of_interest = [
            'dotacionInicial',
            'dotacionInicialDe',
            'consumoCombustibleBase',
            'consumoCombustible',
            'consumoMunicion',
            'capacidadCarga',
            'capacidadTransporte',
            'velocidadMaxima',
            'autonomia',
            'mtbf',
            'tasaFalla',
            'porcentajeBajas',
            'porcentajeHeridos',
            'porcentajeMuertos',
            'transitabilidad',
            'volumen',
            'peso',
        ]
        
        found_methods = []
        
        for method in methods_of_interest:
            for i, s in enumerate(self.strings):
                if method in s:
                    # Buscar contexto (strings cercanos)
                    context_before = self.strings[max(0, i-2):i]
                    context_after = self.strings[i+1:min(len(self.strings), i+3)]
                    
                    found_methods.append({
                        'method': method,
                        'string': s,
                        'context_before': context_before,
                        'context_after': context_after
                    })
        
        self.results['methods_of_interest'] = found_methods[:100]  # Limitar
        return len(found_methods)
    
    def analyze(self):
        """Ejecuta todos los análisis"""
        print(f"\n{'='*60}")
        print(f"🔍 ANALIZANDO: {self.module_name.upper()}")
        print(f"{'='*60}")
        print(f"📦 Tamaño: {self.results['size_mb']:.2f} MB")
        print(f"📝 Total strings: {self.results['total_strings']:,}")
        
        print(f"\n1️⃣  Buscando clases...")
        num_classes = self.find_classes()
        print(f"   ✅ {num_classes:,} clases únicas encontradas")
        
        print(f"\n2️⃣  Buscando valores numéricos...")
        num_values = self.find_numeric_values()
        print(f"   ✅ {num_values:,} valores numéricos encontrados")
        
        print(f"\n3️⃣  Buscando keywords relevantes...")
        num_keywords = self.find_keywords()
        print(f"   ✅ {num_keywords} categorías con coincidencias")
        
        for category, examples in sorted(self.results['keywords_found'].items()):
            print(f"      📌 {category}: {len(examples)} coincidencias")
        
        print(f"\n4️⃣  Buscando métodos de interés...")
        num_methods = self.find_methods_of_interest()
        print(f"   ✅ {num_methods} métodos de interés encontrados")
        
        if self.results['methods_of_interest']:
            print(f"\n   📋 Métodos encontrados:")
            seen = set()
            for m in self.results['methods_of_interest'][:10]:
                method = m['method']
                if method not in seen:
                    print(f"      - {method}")
                    seen.add(method)
        
        return self.results
    
    def save_report(self, output_dir):
        """Guarda el reporte en JSON"""
        output_path = output_dir / f"{self.module_name}_analisis.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Reporte guardado: {output_path}")
        return output_path


def analyze_all_modules():
    """Analiza todos los módulos Smalltalk extraídos"""
    base_path = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa/recursos_extraidos")
    output_dir = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/analisis")
    output_dir.mkdir(exist_ok=True)
    
    modules = [
        'ccoo_smalltalk.img',
        'logistica_smalltalk.img',
        'bajas_smalltalk.img',
        'fallas_smalltalk.img',
        'terreno_smalltalk.img'
    ]
    
    all_results = {}
    
    for module_file in modules:
        module_path = base_path / module_file
        if not module_path.exists():
            print(f"⚠️  No encontrado: {module_file}")
            continue
        
        analyzer = SmallTalkAnalyzer(module_path)
        results = analyzer.analyze()
        analyzer.save_report(output_dir)
        
        all_results[analyzer.module_name] = results
    
    # Resumen comparativo
    print("\n" + "="*60)
    print("📊 RESUMEN COMPARATIVO")
    print("="*60)
    
    print(f"\n{'Módulo':<15} {'Clases':<10} {'Valores':<10} {'Métodos':<10}")
    print("-" * 60)
    
    for module, results in all_results.items():
        print(f"{module:<15} {len(results['classes']):<10} "
              f"{len(results['numeric_values']):<10} "
              f"{len(results['methods_of_interest']):<10}")
    
    # Guardar resumen maestro
    summary_path = output_dir / "resumen_maestro.json"
    summary = {
        'fecha_analisis': '2025-11-13',
        'modulos_analizados': len(all_results),
        'resultados': all_results
    }
    
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Resumen maestro guardado: {summary_path}")
    print(f"\n✅ ANÁLISIS COMPLETADO - {len(all_results)} módulos procesados")


if __name__ == '__main__':
    analyze_all_modules()
