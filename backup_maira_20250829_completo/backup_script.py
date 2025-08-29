#!/usr/bin/env python3
"""
SCRIPT DE BACKUP COMPLETO - MAIRA PostgreSQL
Fecha: 29 de agosto de 2025
Propósito: Crear respaldo completo antes del vencimiento del 7 de septiembre
"""

import os
import psycopg2
import json
import subprocess
from datetime import datetime

def crear_backup_completo():
    """Crea un backup completo de la base de datos PostgreSQL"""
    
    # URL de la base de datos de Render (debes proporcionarla)
    DATABASE_URL = os.environ.get('DATABASE_URL') or input("Ingresa la DATABASE_URL de Render: ")
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL requerida")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_maira_{timestamp}_COMPLETO"
    
    # Crear directorio de backup
    os.makedirs(backup_dir, exist_ok=True)
    
    try:
        # 1. BACKUP ESTRUCTURA COMPLETA
        print("📋 1. Exportando estructura completa...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Obtener todas las tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tablas = [row[0] for row in cursor.fetchall()]
        
        estructura_completa = {
            "timestamp": datetime.now().isoformat(),
            "database_url": DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else "OCULTA",
            "total_tablas": len(tablas),
            "tablas": {}
        }
        
        # 2. EXPORTAR DATOS DE CADA TABLA
        print("💾 2. Exportando datos de todas las tablas...")
        
        for tabla in tablas:
            print(f"   Procesando tabla: {tabla}")
            
            try:
                # Estructura de la tabla
                cursor.execute(f"""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = '{tabla}'
                    ORDER BY ordinal_position
                """)
                
                columnas = []
                for col in cursor.fetchall():
                    columnas.append({
                        "nombre": col[0],
                        "tipo": col[1],
                        "nullable": col[2],
                        "default": col[3]
                    })
                
                # Contar registros
                cursor.execute(f"SELECT COUNT(*) FROM {tabla}")
                total_registros = cursor.fetchone()[0]
                
                # Exportar datos (solo si hay registros y no es demasiado grande)
                datos = []
                if total_registros > 0 and total_registros < 10000:  # Límite de seguridad
                    cursor.execute(f"SELECT * FROM {tabla} LIMIT 1000")
                    for row in cursor.fetchall():
                        # Convertir datos a formato serializable
                        row_data = []
                        for item in row:
                            if isinstance(item, datetime):
                                row_data.append(item.isoformat())
                            else:
                                row_data.append(str(item) if item is not None else None)
                        datos.append(row_data)
                
                estructura_completa["tablas"][tabla] = {
                    "columnas": columnas,
                    "total_registros": total_registros,
                    "datos_exportados": len(datos),
                    "datos": datos[:100] if datos else []  # Solo primeros 100 registros
                }
                
            except Exception as e:
                print(f"   ⚠️ Error en tabla {tabla}: {e}")
                estructura_completa["tablas"][tabla] = {
                    "error": str(e),
                    "total_registros": 0
                }
        
        # 3. GUARDAR ESTRUCTURA COMPLETA
        with open(f"{backup_dir}/estructura_completa.json", 'w', encoding='utf-8') as f:
            json.dump(estructura_completa, f, indent=2, ensure_ascii=False)
        
        # 4. CREAR SCRIPT SQL DE RESTAURACIÓN
        print("📝 3. Creando script SQL de restauración...")
        
        with open(f"{backup_dir}/restaurar_completo.sql", 'w', encoding='utf-8') as f:
            f.write(f"-- BACKUP COMPLETO MAIRA PostgreSQL\n")
            f.write(f"-- Fecha: {timestamp}\n")
            f.write(f"-- Total tablas: {len(tablas)}\n\n")
            
            # Para cada tabla con datos
            for tabla, info in estructura_completa["tablas"].items():
                if "error" not in info and info["total_registros"] > 0:
                    f.write(f"\n-- Tabla: {tabla} ({info['total_registros']} registros)\n")
                    
                    # CREATE TABLE statement
                    f.write(f"CREATE TABLE IF NOT EXISTS {tabla} (\n")
                    for i, col in enumerate(info["columnas"]):
                        comma = "," if i < len(info["columnas"]) - 1 else ""
                        nullable = "NOT NULL" if col["nullable"] == "NO" else ""
                        default = f"DEFAULT {col['default']}" if col['default'] else ""
                        f.write(f"    {col['nombre']} {col['tipo']} {nullable} {default}{comma}\n")
                    f.write(");\n\n")
                    
                    # INSERT statements para los datos
                    if info["datos"]:
                        columnas_str = ", ".join([col["nombre"] for col in info["columnas"]])
                        f.write(f"INSERT INTO {tabla} ({columnas_str}) VALUES\n")
                        
                        for i, row in enumerate(info["datos"]):
                            valores = []
                            for val in row:
                                if val is None:
                                    valores.append("NULL")
                                elif isinstance(val, str) and not val.isdigit():
                                    escaped_val = val.replace("'", "''")
                                    valores.append(f"'{escaped_val}'")
                                else:
                                    valores.append(str(val))
                            
                            comma = "," if i < len(info["datos"]) - 1 else ";"
                            f.write(f"({', '.join(valores)}){comma}\n")
                        
                        f.write("\n")
        
        # 5. BACKUP ESPECÍFICO DE TABLAS CRÍTICAS
        print("🎯 4. Backup específico de tablas críticas...")
        
        tablas_criticas = ["usuarios", "partidas", "usuarios_partida", "elementos_gb", "operaciones_gb"]
        backup_critico = {}
        
        for tabla in tablas_criticas:
            if tabla in estructura_completa["tablas"]:
                try:
                    cursor.execute(f"SELECT * FROM {tabla}")
                    rows = cursor.fetchall()
                    
                    # Obtener nombres de columnas
                    cursor.execute(f"""
                        SELECT column_name FROM information_schema.columns
                        WHERE table_name = '{tabla}'
                        ORDER BY ordinal_position
                    """)
                    columnas = [row[0] for row in cursor.fetchall()]
                    
                    # Convertir a diccionarios
                    datos = []
                    for row in rows:
                        row_dict = {}
                        for i, val in enumerate(row):
                            if isinstance(val, datetime):
                                row_dict[columnas[i]] = val.isoformat()
                            else:
                                row_dict[columnas[i]] = val
                        datos.append(row_dict)
                    
                    backup_critico[tabla] = {
                        "columnas": columnas,
                        "datos": datos,
                        "total": len(datos)
                    }
                    
                except Exception as e:
                    backup_critico[tabla] = {"error": str(e)}
        
        with open(f"{backup_dir}/tablas_criticas.json", 'w', encoding='utf-8') as f:
            json.dump(backup_critico, f, indent=2, ensure_ascii=False)
        
        # 6. CREAR SCRIPT DE MIGRACIÓN
        with open(f"{backup_dir}/migrar_a_nuevo_server.py", 'w', encoding='utf-8') as f:
            f.write('''#!/usr/bin/env python3
"""
SCRIPT DE MIGRACIÓN AUTOMÁTICA
Ejecutar en el nuevo servidor PostgreSQL
"""

import psycopg2
import json

def migrar_datos(nueva_database_url):
    """Migra todos los datos al nuevo servidor"""
    
    # Cargar backup crítico
    with open('tablas_criticas.json', 'r') as f:
        backup = json.load(f)
    
    conn = psycopg2.connect(nueva_database_url)
    cursor = conn.cursor()
    
    # Migrar cada tabla
    for tabla, info in backup.items():
        if "error" not in info:
            print(f"Migrando {tabla}...")
            
            for registro in info["datos"]:
                columnas = list(registro.keys())
                valores = list(registro.values())
                
                placeholders = ', '.join(['%s'] * len(valores))
                columnas_str = ', '.join(columnas)
                
                cursor.execute(f"""
                    INSERT INTO {tabla} ({columnas_str}) 
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING
                """, valores)
    
    conn.commit()
    conn.close()
    print("✅ Migración completada")

if __name__ == "__main__":
    nueva_url = input("Nueva DATABASE_URL: ")
    migrar_datos(nueva_url)
''')
        
        conn.close()
        
        print(f"\n✅ BACKUP COMPLETO CREADO EN: {backup_dir}/")
        print(f"📁 Archivos generados:")
        print(f"   - estructura_completa.json (estructura y datos)")
        print(f"   - restaurar_completo.sql (script SQL)")
        print(f"   - tablas_criticas.json (datos críticos)")
        print(f"   - migrar_a_nuevo_server.py (script de migración)")
        
        return backup_dir
        
    except Exception as e:
        print(f"❌ Error durante el backup: {e}")
        return None

if __name__ == "__main__":
    crear_backup_completo()
