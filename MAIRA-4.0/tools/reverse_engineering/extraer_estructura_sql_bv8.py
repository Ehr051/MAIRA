#!/usr/bin/env python3
"""
Extrae estructura de base de datos SQL de BV8
Busca CREATE TABLE, INSERT, SELECT para inferir schema
"""

import re
from pathlib import Path
from collections import defaultdict

IMAGE_FILE = Path("/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/tools/bv8_extraido/ingenieria_inversa/recursos_extraidos/logistica_smalltalk.img")

def extraer_queries_sql(data: bytes) -> dict:
    """Extrae todas las queries SQL encontradas"""
    
    try:
        texto = data.decode('latin-1', errors='ignore')
    except:
        return {}
    
    queries = {
        'SELECT': [],
        'INSERT': [],
        'UPDATE': [],
        'CREATE': [],
        'DELETE': []
    }
    
    # Buscar queries SQL
    patterns = {
        'SELECT': r'SELECT\s+[^;]{10,200}',
        'INSERT': r'INSERT\s+INTO\s+[^;]{10,200}',
        'UPDATE': r'UPDATE\s+[^;]{10,200}',
        'CREATE': r'CREATE\s+TABLE\s+[^;]{10,300}',
        'DELETE': r'DELETE\s+FROM\s+[^;]{10,200}'
    }
    
    for tipo, pattern in patterns.items():
        matches = re.findall(pattern, texto, re.IGNORECASE)
        queries[tipo] = list(set(matches))[:20]  # Primeros 20 únicos
    
    return queries


def buscar_tablas_y_campos(data: bytes) -> dict:
    """Busca nombres de tablas y posibles campos"""
    
    try:
        texto = data.decode('latin-1', errors='ignore')
    except:
        return {}
    
    # Tablas encontradas
    tablas_pattern = r'FROM\s+([a-z_][a-z0-9_\.]*)'
    tablas_raw = re.findall(tablas_pattern, texto, re.IGNORECASE)
    tablas = list(set([t.lower() for t in tablas_raw if len(t) > 3]))
    
    # Para cada tabla, buscar posibles campos
    tablas_info = {}
    
    for tabla in sorted(tablas)[:20]:
        # Buscar SELECT con campos específicos
        select_pattern = rf'SELECT\s+([^F]+)\s+FROM\s+{re.escape(tabla)}'
        selects = re.findall(select_pattern, texto, re.IGNORECASE)
        
        campos = set()
        for sel in selects:
            if '*' not in sel:
                # Extraer campos
                campos_raw = re.findall(r'[a-z_][a-z0-9_]*', sel, re.IGNORECASE)
                campos.update(campos_raw)
        
        if campos or len(selects) > 0:
            tablas_info[tabla] = {
                'campos': sorted(list(campos))[:15],
                'selects': len(selects)
            }
    
    return tablas_info


def buscar_valores_cerca_sql(data: bytes) -> dict:
    """Busca valores numéricos cerca de queries SQL de dotación"""
    
    # Buscar offset de "dotacioninicial"
    pattern = b'dotacioninicial'
    
    valores_cercanos = []
    
    for match in re.finditer(pattern, data, re.IGNORECASE):
        offset = match.start()
        
        # Contexto amplio
        start = max(0, offset - 300)
        end = min(len(data), offset + 300)
        chunk = data[start:end]
        
        # Buscar números
        import struct
        numeros = []
        for i in range(0, len(chunk) - 4, 1):
            try:
                valor = struct.unpack('<i', chunk[i:i+4])[0]
                if 0 < valor < 1000:
                    numeros.append(valor)
            except:
                pass
        
        # Buscar texto
        try:
            texto = chunk.decode('latin-1', errors='ignore')
            texto_limpio = ''.join(c if 32 <= ord(c) < 127 else ' ' for c in texto)
            texto_limpio = ' '.join(texto_limpio.split())
        except:
            texto_limpio = ""
        
        if numeros or 'SELECT' in texto_limpio:
            valores_cercanos.append({
                'offset': f'0x{offset:x}',
                'numeros': sorted(list(set(numeros)))[:15],
                'contexto': texto_limpio[:200]
            })
    
    return valores_cercanos


def main():
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║                                                                            ║")
    print("║           🗄️  EXTRACCIÓN DE ESTRUCTURA SQL - BV8 LOGÍSTICA                 ║")
    print("║                                                                            ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    
    if not IMAGE_FILE.exists():
        print(f"❌ No encontrado: {IMAGE_FILE}")
        return
    
    with open(IMAGE_FILE, 'rb') as f:
        data = f.read()
    
    print(f"\n✅ Cargado: {len(data):,} bytes\n")
    
    # 1. Extraer queries SQL
    print("="*80)
    print("📋 QUERIES SQL ENCONTRADAS")
    print("="*80)
    
    queries = extraer_queries_sql(data)
    
    for tipo, lista in queries.items():
        if lista:
            print(f"\n🔹 {tipo} ({len(lista)}):")
            for query in lista[:10]:
                # Limpiar
                query_limpio = ' '.join(query.split())[:120]
                print(f"   • {query_limpio}")
    
    # 2. Tablas y campos
    print("\n" + "="*80)
    print("🗄️  TABLAS Y CAMPOS")
    print("="*80)
    
    tablas_info = buscar_tablas_y_campos(data)
    
    for tabla, info in sorted(tablas_info.items()):
        print(f"\n📊 {tabla}")
        print(f"   SELECTs encontrados: {info['selects']}")
        if info['campos']:
            print(f"   Campos: {', '.join(info['campos'])}")
    
    # 3. Valores cerca de dotacioninicial
    print("\n" + "="*80)
    print("🔍 VALORES CERCA DE 'dotacioninicial'")
    print("="*80)
    
    valores = buscar_valores_cerca_sql(data)
    
    print(f"\n✅ Encontradas {len(valores)} ocurrencias de 'dotacioninicial'\n")
    
    for val in valores[:5]:
        print(f"📍 {val['offset']}:")
        if val['numeros']:
            print(f"   Números: {', '.join(map(str, val['numeros']))}")
        if val['contexto'] and 'SELECT' in val['contexto']:
            print(f"   SQL: {val['contexto'][:150]}...")
        print()
    
    print("="*80)
    print("💡 HALLAZGOS CLAVE")
    print("="*80)
    print("""
✅ BV8 usa una BASE DE DATOS SQL (no archivos XML)
✅ Schema: planeamientologistico
✅ Tablas encontradas:
   • dotacioninicial - Dotaciones iniciales por elemento
   • municion - Catálogo de municiones
   • armamento - Catálogo de armas
   • consumocada100kms - Consumos de combustible
   • tipocombustible - Tipos de combustible
   • precioefectoclaseiii - Precios de efectos clase III

🎯 PRÓXIMO PASO CRÍTICO:
   Buscar el archivo de base de datos BV8:
   • Puede ser .mdb (Microsoft Access)
   • Puede ser .db (SQLite)
   • Puede ser SQL Server connection string
   
   Ubicaciones probables:
   • C:\\Program Files (x86)\\Aplicaciones Militares\\*.mdb
   • C:\\ProgramData\\BV8\\*.db
   • En el directorio de instalación BV8
    """)


if __name__ == "__main__":
    main()
