#!/usr/bin/env python3
"""
Script para convertir datos de BV8 (XMLs + otros) a JSONs para MAIRA
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path

# Directorios
HEM_DATA_DIR = Path(__file__).parent / "hem_data"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "Server" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("🔄 Convirtiendo datos BV8 a JSONs MAIRA...")
print("=" * 60)

# ============================================================================
# 1. FACTORES DE BAJAS (bajas_arbol.xml)
# ============================================================================
print("\n📊 Procesando factores de bajas...")

bajas_xml = HEM_DATA_DIR / "bajas_arbol.xml"
if bajas_xml.exists():
    tree = ET.parse(bajas_xml)
    root = tree.getroot()
    
    factores_bajas = {
        "version": "1.0.0",
        "fuente": "Batalla Virtual 8 - Estimación de Bajas de Combate",
        "descripcion": "Factores y porcentajes de bajas de combate del sistema BV8",
        "porcentajes": {}
    }
    
    for obj in root.findall(".//object[@class='Association']"):
        key_elem = obj.find("key")
        value_elem = obj.find("value")
        
        if key_elem is not None and value_elem is not None:
            key = key_elem.text
            
            # Extraer valor (puede ser Float o String)
            if value_elem.get('class') == 'Float':
                value = float(value_elem.text)
            else:
                value = value_elem.text
            
            factores_bajas["porcentajes"][key] = value
    
    output_file = OUTPUT_DIR / "factores_bajas.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(factores_bajas, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {output_file.name} - {len(factores_bajas['porcentajes'])} factores")

# ============================================================================
# 2. TIPOS DE TERRENO (terreno_traductor.xml)
# ============================================================================
print("\n🗺️  Procesando tipos de terreno...")

terreno_xml = HEM_DATA_DIR / "terreno_traductor.xml"
if terreno_xml.exists():
    tree = ET.parse(terreno_xml)
    root = tree.getroot()
    
    factores_terreno = {
        "version": "1.0.0",
        "fuente": "Batalla Virtual 8 - Estudio del Terreno",
        "descripcion": "Tipos de terreno y sus características del sistema BV8",
        "tipos": []
    }
    
    for tipo_suelo in root.findall(".//object[@class='TipoSueloModelado']"):
        nombre_elem = tipo_suelo.find("nombre")
        if nombre_elem is not None:
            tipo = {
                "nombre": nombre_elem.text,
                "variantes": []
            }
            
            # Obtener suelos reales
            suelos_reales = tipo_suelo.find("suelosReales")
            if suelos_reales is not None:
                for suelo in suelos_reales.findall(".//object[@class='String']"):
                    if suelo.text:
                        tipo["variantes"].append(suelo.text)
            
            factores_terreno["tipos"].append(tipo)
    
    output_file = OUTPUT_DIR / "tipos_terreno_bv8.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(factores_terreno, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {output_file.name} - {len(factores_terreno['tipos'])} tipos de terreno")

# ============================================================================
# 3. MUNICIONES Y LOGÍSTICA (logistica_cajones.xml)
# ============================================================================
print("\n📦 Procesando cajones de municiones...")

cajones_xml = HEM_DATA_DIR / "logistica_cajones.xml"
if cajones_xml.exists():
    tree = ET.parse(cajones_xml)
    root = tree.getroot()
    
    municiones_logistica = {
        "version": "1.0.0",
        "fuente": "Batalla Virtual 8 - Planeamiento Logístico",
        "descripcion": "Volúmenes y características de cajones de municiones del sistema BV8",
        "cajones": []
    }
    
    for cajon in root.findall(".//object[@class='Cajon']"):
        id_elem = cajon.find("id")
        volumen_elem = cajon.find("volumen")
        peso_elem = cajon.find("peso")
        nombre_elem = cajon.find("nombre")
        desc_elem = cajon.find("descripcion")
        
        if nombre_elem is not None and volumen_elem is not None:
            cajon_data = {
                "id": int(id_elem.text) if id_elem is not None else None,
                "nombre": nombre_elem.text,
                "descripcion": desc_elem.text if desc_elem is not None else "",
                "volumen_m3": float(volumen_elem.text),
                "peso_kg": float(peso_elem.text) if peso_elem is not None else 0.0
            }
            municiones_logistica["cajones"].append(cajon_data)
    
    output_file = OUTPUT_DIR / "municiones_logistica_bv8.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(municiones_logistica, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {output_file.name} - {len(municiones_logistica['cajones'])} tipos de cajones")

# ============================================================================
# 4. TRANSPORTE LOGÍSTICO (logistica_transporte.xml)
# ============================================================================
print("\n🚛 Procesando configuración de transporte...")

transporte_xml = HEM_DATA_DIR / "logistica_transporte.xml"
if transporte_xml.exists():
    tree = ET.parse(transporte_xml)
    root = tree.getroot()
    
    transporte_logistica = {
        "version": "1.0.0",
        "fuente": "Batalla Virtual 8 - Planeamiento Logístico",
        "descripcion": "Configuración de transporte logístico del sistema BV8",
        "configuracion": {}
    }
    
    # Extraer todos los valores del XML
    for elem in root.iter():
        if elem.text and elem.text.strip() and elem.tag not in ['object']:
            transporte_logistica["configuracion"][elem.tag] = elem.text.strip()
    
    output_file = OUTPUT_DIR / "transporte_logistica_bv8.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(transporte_logistica, f, indent=2, ensure_ascii=False)
    
    print(f"✅ {output_file.name} - Configuración procesada")

# ============================================================================
# RESUMEN
# ============================================================================
print("\n" + "=" * 60)
print("✅ Conversión completada")
print(f"📂 Archivos generados en: {OUTPUT_DIR}")
print("\nArchivos creados:")
for json_file in sorted(OUTPUT_DIR.glob("*bv8.json")) + sorted(OUTPUT_DIR.glob("factores_bajas.json")):
    size_kb = json_file.stat().st_size / 1024
    print(f"  📄 {json_file.name} ({size_kb:.1f} KB)")
