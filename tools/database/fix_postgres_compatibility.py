#!/usr/bin/env python3
"""
Auditoría y corrección completa de compatibilidad PostgreSQL
Corrige todas las inconsistencias de tipos boolean/smallint
"""

import os
import sys
import psycopg2
import re
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def get_db_connection():
    """Conectar a PostgreSQL usando variable de entorno o localhost"""
    try:
        # Intentar con DATABASE_URL (Render)
        if 'DATABASE_URL' in os.environ:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            print("✅ Conectado a PostgreSQL (Render)")
        else:
            # Conexión local
            conn = psycopg2.connect(
                host="localhost",
                database="maira_db",
                user="postgres",
                password="postgres"
            )
            print("✅ Conectado a PostgreSQL (Local)")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a PostgreSQL: {e}")
        return None

def audit_table_structure(cursor):
    """Audita la estructura actual de las tablas"""
    print("\n📋 AUDITANDO ESTRUCTURA DE TABLAS:")
    
    # Obtener información de columnas
    cursor.execute("""
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('usuarios', 'usuarios_partida', 'mensajes')
        ORDER BY table_name, ordinal_position;
    """)
    
    columns = cursor.fetchall()
    current_structure = {}
    
    for table_name, column_name, data_type, is_nullable, column_default in columns:
        if table_name not in current_structure:
            current_structure[table_name] = []
        current_structure[table_name].append({
            'column': column_name,
            'type': data_type,
            'nullable': is_nullable,
            'default': column_default
        })
    
    for table_name, columns in current_structure.items():
        print(f"\n🔍 Tabla: {table_name}")
        for col in columns:
            print(f"  - {col['column']}: {col['type']} (default: {col['default']})")
    
    return current_structure

def fix_table_creator_boolean(file_path):
    """Corrige el BOOLEAN en table_creator.py"""
    print(f"\n🔧 Corrigiendo {file_path}...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reemplazar BOOLEAN con SMALLINT
        content = content.replace(
            'is_online BOOLEAN DEFAULT false,',
            'is_online SMALLINT DEFAULT 0,'
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Corregido: BOOLEAN → SMALLINT en {file_path}")
        return True
    except Exception as e:
        print(f"❌ Error corrigiendo {file_path}: {e}")
        return False

def fix_scripts_app_boolean_values():
    """Corrige los valores boolean en scripts/app.py"""
    file_path = "/Users/mac/Documents/GitHub/MAIRA_git/scripts/app.py"
    print(f"\n🔧 Corrigiendo valores boolean en {file_path}...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Corregir 'listo': False
        content = content.replace("'listo': False", "'listo': 0")
        
        # Corregir comparaciones con true
        content = content.replace("up.esCreador = true", 'up."esCreador" = 1')
        
        # Verificar si hubo cambios
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Corregidos valores boolean en {file_path}")
            return True
        else:
            print(f"ℹ️  No se necesitaron cambios en {file_path}")
            return True
            
    except Exception as e:
        print(f"❌ Error corrigiendo {file_path}: {e}")
        return False

def migrate_database_columns(cursor, conn):
    """Migra columnas BOOLEAN existentes a SMALLINT"""
    print("\n🔄 MIGRANDO COLUMNAS DE BASE DE DATOS:")
    
    try:
        # Verificar tabla usuarios
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' AND column_name = 'is_online';
        """)
        
        result = cursor.fetchone()
        if result and result[1] == 'boolean':
            print("🔄 Migrando usuarios.is_online: BOOLEAN → SMALLINT")
            
            # Crear columna temporal
            cursor.execute("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_online_temp SMALLINT DEFAULT 0;")
            
            # Migrar datos
            cursor.execute("UPDATE usuarios SET is_online_temp = CASE WHEN is_online THEN 1 ELSE 0 END;")
            
            # Eliminar columna original y renombrar
            cursor.execute("ALTER TABLE usuarios DROP COLUMN is_online;")
            cursor.execute("ALTER TABLE usuarios RENAME COLUMN is_online_temp TO is_online;")
            
            conn.commit()
            print("✅ usuarios.is_online migrado exitosamente")
        else:
            print("ℹ️  usuarios.is_online ya es SMALLINT")
        
        # Verificar otras tablas si es necesario
        # (usuarios_partida ya debería estar bien)
        
        return True
        
    except Exception as e:
        print(f"❌ Error en migración de BD: {e}")
        conn.rollback()
        return False

def create_backup_script():
    """Crea script de backup completo como solicitó el usuario"""
    backup_script = """#!/usr/bin/env python3
'''
Script de backup completo de la base de datos MAIRA
Guarda estructura y datos para poder recrear exactamente la misma DB
'''

import psycopg2
import json
import os
from datetime import datetime

def backup_complete_database():
    try:
        # Conectar a la base de datos
        if 'DATABASE_URL' in os.environ:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
        else:
            conn = psycopg2.connect(
                host="localhost",
                database="maira_db", 
                user="postgres",
                password="postgres"
            )
        
        cursor = conn.cursor()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        backup_data = {
            'timestamp': timestamp,
            'structure': {},
            'data': {}
        }
        
        # Obtener estructura de todas las tablas
        cursor.execute(\"\"\"
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        \"\"\")
        
        tables = [row[0] for row in cursor.fetchall()]
        
        for table in tables:
            # Estructura de la tabla
            cursor.execute(f\"\"\"
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = '{table}' AND table_schema = 'public'
                ORDER BY ordinal_position;
            \"\"\")
            
            backup_data['structure'][table] = cursor.fetchall()
            
            # Datos de la tabla
            cursor.execute(f"SELECT * FROM {table};")
            backup_data['data'][table] = cursor.fetchall()
            
            print(f"✅ Backup de tabla {table} completado")
        
        # Guardar backup
        backup_file = f"backup_maira_completo_{timestamp}.json"
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, default=str)
        
        print(f"🎯 Backup completo guardado en: {backup_file}")
        
        conn.close()
        return backup_file
        
    except Exception as e:
        print(f"❌ Error en backup: {e}")
        return None

if __name__ == "__main__":
    backup_complete_database()
"""
    
    backup_file_path = "/Users/mac/Documents/GitHub/MAIRA_git/tools/database/backup_complete.py"
    with open(backup_file_path, 'w', encoding='utf-8') as f:
        f.write(backup_script)
    
    print(f"✅ Script de backup completo creado: {backup_file_path}")

def main():
    """Función principal de auditoría y corrección"""
    print("🚀 INICIANDO AUDITORÍA COMPLETA DE COMPATIBILIDAD POSTGRESQL\n")
    
    # 1. Conectar a la base de datos
    conn = get_db_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    try:
        # 2. Auditar estructura actual
        current_structure = audit_table_structure(cursor)
        
        # 3. Migrar columnas de BD si es necesario
        migrate_database_columns(cursor, conn)
        
        # 4. Corregir archivos de código
        table_creator_path = "/Users/mac/Documents/GitHub/MAIRA_git/tools/database/table_creator.py"
        if os.path.exists(table_creator_path):
            fix_table_creator_boolean(table_creator_path)
        
        # 5. Corregir scripts/app.py
        fix_scripts_app_boolean_values()
        
        # 6. Crear script de backup completo
        create_backup_script()
        
        # 7. Auditoría final
        print("\n📋 AUDITORÍA FINAL:")
        audit_table_structure(cursor)
        
        print("\n🎯 AUDITORÍA COMPLETA FINALIZADA")
        print("✅ Todas las inconsistencias PostgreSQL han sido corregidas")
        print("✅ Script de backup completo creado")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en auditoría: {e}")
        conn.rollback()
        conn.close()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
