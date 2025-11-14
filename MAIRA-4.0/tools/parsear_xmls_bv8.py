#!/usr/bin/env python3
"""
Parser universal de XMLs Smalltalk de BV8
Convierte formato Dolphin Smalltalk XML a JSON limpio
"""
import xml.etree.ElementTree as ET
import json
from pathlib import Path

def parse_smalltalk_value(element):
    """Convierte un elemento XML Smalltalk a valor Python"""
    class_name = element.get('class', '')
    
    # String
    if class_name == 'String':
        return element.text or ''
    
    # Float
    elif class_name == 'Float':
        return float(element.text) if element.text else 0.0
    
    # Integer
    elif class_name in ['SmallInteger', 'Integer']:
        return int(element.text) if element.text else 0
    
    # Boolean
    elif class_name in ['True', 'False']:
        return class_name == 'True'
    
    # Association (key-value pair)
    elif class_name == 'Association':
        key_elem = element.find('key')
        value_elem = element.find('value')
        return {
            'key': parse_smalltalk_value(key_elem) if key_elem is not None else None,
            'value': parse_smalltalk_value(value_elem) if value_elem is not None else None
        }
    
    # Array/Collection
    elif class_name in ['OrderedCollection', 'Array']:
        size = int(element.get('size', 0))
        items = []
        for child in element:
            items.append(parse_smalltalk_value(child))
        return items
    
    # Objeto personalizado
    else:
        obj = {'_class': class_name}
        for child in element:
            tag = child.tag
            obj[tag] = parse_smalltalk_value(child)
        return obj

def parse_smalltalk_xml(xml_path):
    """Parsea un XML Smalltalk completo"""
    tree = ET.parse(xml_path)
    root = tree.getroot()
    return parse_smalltalk_value(root)

def convert_all_xmls():
    """Convierte todos los XMLs encontrados a JSON"""
    base_path = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/configuracion")
    
    xmls = {
        'configuracionCajones.xml': 'cajones.json',
        'configuracionTransporte.xml': 'transporte.json',
        'idRelacionCajonEfecto.xml': 'relacion_cajon_efecto.json',
        'arbol.xml': 'estimacion_bajas_arbol.json',
        'traductor.xml': 'terreno_tipos_suelo.json'
    }
    
    results = {}
    
    for xml_file, json_file in xmls.items():
        xml_path = base_path / xml_file
        if not xml_path.exists():
            print(f"⚠️  No encontrado: {xml_file}")
            continue
        
        print(f"\n📄 Procesando: {xml_file}")
        try:
            data = parse_smalltalk_xml(xml_path)
            
            # Guardar JSON
            json_path = base_path / json_file
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"   ✅ Convertido a: {json_file}")
            
            # Estadísticas
            if isinstance(data, list):
                print(f"   📊 {len(data)} elementos")
                if len(data) > 0 and isinstance(data[0], dict):
                    if 'key' in data[0]:
                        # Es una lista de Associations
                        print(f"   🔑 Claves: {', '.join(str(item['key']) for item in data[:5])}...")
            
            results[xml_file] = {
                'json_file': json_file,
                'size': len(json.dumps(data)),
                'success': True
            }
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results[xml_file] = {
                'error': str(e),
                'success': False
            }
    
    # Resumen
    print("\n" + "="*60)
    print("📊 RESUMEN DE CONVERSIÓN")
    print("="*60)
    for xml_file, result in results.items():
        if result['success']:
            print(f"✅ {xml_file} → {result['json_file']} ({result['size']:,} bytes)")
        else:
            print(f"❌ {xml_file}: {result['error']}")
    
    print(f"\n💾 JSONs guardados en: {base_path}")

if __name__ == '__main__':
    convert_all_xmls()
