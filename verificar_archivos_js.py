#!/usr/bin/env python3
"""
Script para verificar archivos JavaScript faltantes en MAIRA
Identifica rutas que devuelven 404 y necesitan ser corregidas
"""

import os
import re
from pathlib import Path

def encontrar_referencias_js():
    """Encuentra todas las referencias a archivos JS en HTML"""
    archivos_html = []
    rutas_js = set()
    
    # Buscar archivos HTML
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                archivos_html.append(os.path.join(root, file))
    
    print(f"🔍 Analizando {len(archivos_html)} archivos HTML...")
    
    for archivo in archivos_html:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
            # Buscar referencias a JS
            patrones = [
                r'src=["\']([^"\']+\.js)["\']',  # src="archivo.js"
                r'src=["\']([^"\']+\.min\.js)["\']',  # src="archivo.min.js"
            ]
            
            for patron in patrones:
                matches = re.findall(patron, contenido)
                for match in matches:
                    if not match.startswith('http'):  # Solo rutas locales
                        rutas_js.add((match, archivo))
                        
        except Exception as e:
            print(f"❌ Error leyendo {archivo}: {e}")
    
    return rutas_js

def verificar_archivos_existentes(rutas_js):
    """Verifica qué archivos existen y cuáles faltan"""
    faltantes = []
    existentes = []
    
    print(f"\n📋 Verificando {len(rutas_js)} referencias JavaScript...")
    
    base_dir = Path('.')
    
    for ruta_js, archivo_origen in rutas_js:
        # Normalizar ruta
        if ruta_js.startswith('/'):
            ruta_completa = base_dir / ruta_js[1:]  # Quitar / inicial
        else:
            # Ruta relativa al archivo HTML
            dir_origen = Path(archivo_origen).parent
            ruta_completa = dir_origen / ruta_js
        
        ruta_normalizada = ruta_completa.resolve()
        
        if ruta_normalizada.exists():
            existentes.append((ruta_js, archivo_origen))
        else:
            faltantes.append((ruta_js, archivo_origen, str(ruta_normalizada)))
    
    return existentes, faltantes

def generar_reporte(existentes, faltantes):
    """Genera reporte de archivos faltantes"""
    print(f"\n✅ ARCHIVOS EXISTENTES: {len(existentes)}")
    for ruta, origen in existentes[:5]:  # Solo primeros 5
        print(f"   {ruta} (en {origen})")
    if len(existentes) > 5:
        print(f"   ... y {len(existentes) - 5} más")
    
    print(f"\n❌ ARCHIVOS FALTANTES: {len(faltantes)}")
    
    if faltantes:
        # Agrupar por tipo de problema
        externos = []
        locales_faltantes = []
        
        for ruta, origen, ruta_completa in faltantes:
            if 'node_modules' in ruta:
                externos.append((ruta, origen))
            else:
                locales_faltantes.append((ruta, origen, ruta_completa))
        
        if externos:
            print(f"\n🔗 LIBRERÍAS EXTERNAS ({len(externos)}):")
            for ruta, origen in externos:
                print(f"   {ruta} (en {origen})")
        
        if locales_faltantes:
            print(f"\n📁 ARCHIVOS LOCALES FALTANTES ({len(locales_faltantes)}):")
            for ruta, origen, ruta_completa in locales_faltantes:
                print(f"   {ruta}")
                print(f"      Origen: {origen}")
                print(f"      Buscado en: {ruta_completa}")
                print()

def main():
    print("🔍 VERIFICADOR DE ARCHIVOS JAVASCRIPT - MAIRA")
    print("=" * 50)
    
    rutas_js = encontrar_referencias_js()
    existentes, faltantes = verificar_archivos_existentes(rutas_js)
    generar_reporte(existentes, faltantes)
    
    print(f"\n📊 RESUMEN:")
    print(f"   ✅ Existentes: {len(existentes)}")
    print(f"   ❌ Faltantes: {len(faltantes)}")
    print(f"   📈 Total: {len(rutas_js)}")
    
    if faltantes:
        print(f"\n💡 RECOMENDACIÓN:")
        print(f"   - Instalar librerías faltantes con npm")
        print(f"   - Copiar archivos locales necesarios")
        print(f"   - Actualizar rutas en archivos HTML")

if __name__ == "__main__":
    main()
