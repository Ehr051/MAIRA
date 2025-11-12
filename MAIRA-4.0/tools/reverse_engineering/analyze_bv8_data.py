#!/usr/bin/env python3
"""
Análisis exhaustivo de archivos de datos BV8
Documenta estructura, relaciones y uso de cada archivo
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import json

# Directorios
BV8_DIR = Path.home() / ".wine/drive_c/Program Files (x86)/Aplicaciones Militares"
OUTPUT_DIR = Path(__file__).parent / "bv8_analysis"
OUTPUT_DIR.mkdir(exist_ok=True)

print("🔍 ANÁLISIS EXHAUSTIVO DE DATOS BV8")
print("=" * 80)

# Inventario completo
inventory = {
    "batalla_virtual": {
        "servidor": [],
        "simulador": [],
        "usuario": [],
        "cdt": []
    },
    "hem": {
        "bajas": [],
        "logistica": [],
        "ingenieros": [],
        "fallas": [],
        "terreno": []
    },
    "otros": []
}

def analyze_xml(file_path):
    """Analiza estructura de un XML"""
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        analysis = {
            "archivo": str(file_path.relative_to(BV8_DIR)),
            "root_tag": root.tag,
            "root_attribs": root.attrib,
            "elementos_unicos": set(),
            "estructura": {},
            "muestra_datos": []
        }
        
        # Obtener todos los tags únicos
        for elem in root.iter():
            analysis["elementos_unicos"].add(elem.tag)
        
        analysis["elementos_unicos"] = sorted(list(analysis["elementos_unicos"]))
        
        # Analizar primer nivel
        for child in root:
            tag = child.tag
            if tag not in analysis["estructura"]:
                analysis["estructura"][tag] = {
                    "count": 0,
                    "attribs": set(),
                    "children": set()
                }
            
            analysis["estructura"][tag]["count"] += 1
            if child.attrib:
                analysis["estructura"][tag]["attribs"].update(child.attrib.keys())
            
            for subchild in child:
                analysis["estructura"][tag]["children"].add(subchild.tag)
        
        # Convertir sets a lists para JSON
        for tag in analysis["estructura"]:
            analysis["estructura"][tag]["attribs"] = sorted(list(analysis["estructura"][tag]["attribs"]))
            analysis["estructura"][tag]["children"] = sorted(list(analysis["estructura"][tag]["children"]))
        
        # Obtener muestra de primeros 3 elementos
        for i, child in enumerate(root[:3]):
            sample = {
                "tag": child.tag,
                "attribs": child.attrib,
                "text": child.text[:100] if child.text else None
            }
            
            # Si tiene hijos, mostrar algunos
            if len(child) > 0:
                sample["children_sample"] = []
                for subchild in child[:5]:
                    sample["children_sample"].append({
                        "tag": subchild.tag,
                        "attribs": subchild.attrib,
                        "text": subchild.text[:50] if subchild.text else None
                    })
            
            analysis["muestra_datos"].append(sample)
        
        return analysis
    
    except Exception as e:
        return {
            "archivo": str(file_path.relative_to(BV8_DIR)),
            "error": str(e)
        }

# ============================================================================
# ANÁLISIS POR COMPONENTE
# ============================================================================

print("\n📂 Analizando XMLs de Batalla Virtual...")
bv_xmls = list((BV8_DIR / "Batalla Virtual").rglob("*.xml"))
for xml_file in bv_xmls:
    analysis = analyze_xml(xml_file)
    
    if "Servidor" in str(xml_file):
        inventory["batalla_virtual"]["servidor"].append(analysis)
    elif "Simulador" in str(xml_file):
        inventory["batalla_virtual"]["simulador"].append(analysis)
    elif "Usuario" in str(xml_file):
        inventory["batalla_virtual"]["usuario"].append(analysis)
    elif "CDT" in str(xml_file):
        inventory["batalla_virtual"]["cdt"].append(analysis)
    
    print(f"  ✓ {xml_file.name}")

print("\n📊 Analizando XMLs de HEM...")

# Bajas
bajas_xmls = list((BV8_DIR / "Estimación de Bajas de Combate").rglob("*.xml"))
for xml_file in bajas_xmls:
    analysis = analyze_xml(xml_file)
    inventory["hem"]["bajas"].append(analysis)
    print(f"  ✓ Bajas: {xml_file.name}")

# Logística
log_xmls = list((BV8_DIR / "Planeamiento Logístico").rglob("*.xml"))
for xml_file in log_xmls:
    analysis = analyze_xml(xml_file)
    inventory["hem"]["logistica"].append(analysis)
    print(f"  ✓ Logística: {xml_file.name}")

# Terreno
terreno_xmls = list((BV8_DIR / "Estudio del Terreno").rglob("*.xml"))
for xml_file in terreno_xmls:
    analysis = analyze_xml(xml_file)
    inventory["hem"]["terreno"].append(analysis)
    print(f"  ✓ Terreno: {xml_file.name}")

# ============================================================================
# GUARDAR ANÁLISIS
# ============================================================================

output_file = OUTPUT_DIR / "inventario_completo.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(inventory, f, indent=2, ensure_ascii=False)

print(f"\n✅ Análisis guardado en: {output_file}")

# ============================================================================
# RESUMEN
# ============================================================================

print("\n" + "=" * 80)
print("📋 RESUMEN DEL ANÁLISIS")
print("=" * 80)

total_xmls = sum([
    len(inventory["batalla_virtual"]["servidor"]),
    len(inventory["batalla_virtual"]["simulador"]),
    len(inventory["batalla_virtual"]["usuario"]),
    len(inventory["batalla_virtual"]["cdt"]),
    len(inventory["hem"]["bajas"]),
    len(inventory["hem"]["logistica"]),
    len(inventory["hem"]["terreno"])
])

print(f"\n📊 Total XMLs analizados: {total_xmls}")
print("\n🔹 Batalla Virtual:")
print(f"   - Servidor: {len(inventory['batalla_virtual']['servidor'])} archivos")
print(f"   - Simulador: {len(inventory['batalla_virtual']['simulador'])} archivos")
print(f"   - Usuario: {len(inventory['batalla_virtual']['usuario'])} archivos")
print(f"   - CDT: {len(inventory['batalla_virtual']['cdt'])} archivos")

print("\n🔹 HEM:")
print(f"   - Bajas: {len(inventory['hem']['bajas'])} archivos")
print(f"   - Logística: {len(inventory['hem']['logistica'])} archivos")
print(f"   - Terreno: {len(inventory['hem']['terreno'])} archivos")

print("\n📄 Ver análisis detallado en:")
print(f"   {output_file}")
