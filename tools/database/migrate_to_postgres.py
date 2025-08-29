#!/usr/bin/env python3
"""
MAIRA Database Migration Script
================================
Este script asegura que la base de datos PostgreSQL tenga la estructura correcta
y migra cualquier columna BOOLEAN a SMALLINT para compatibilidad total.
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def get_database_url():
    """Obtiene la URL de la base de datos"""
    return os.environ.get('DATABASE_URL')

def connect_to_db():
    """Conecta a la base de datos PostgreSQL"""
    database_url = get_database_url()
    if not database_url:
        print("❌ DATABASE_URL no encontrada en variables de entorno")
        return None
    
    try:
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        print("✅ Conexión exitosa a PostgreSQL")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return None

def check_table_structure(cursor, table_name):
    """Verifica la estructura actual de una tabla"""
    cursor.execute("""
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = %s 
        ORDER BY ordinal_position;
    """, (table_name,))
    return cursor.fetchall()

def migrate_boolean_columns(cursor, conn):
    """Migra columnas BOOLEAN problemáticas a SMALLINT"""
    migrations = []
    
    # Verificar si usuarios_partida existe y tiene columnas BOOLEAN
    try:
        structure = check_table_structure(cursor, 'usuarios_partida')
        boolean_columns = [col for col in structure if col['data_type'] == 'boolean']
        
        if boolean_columns:
            print(f"🔄 Encontradas {len(boolean_columns)} columnas BOOLEAN en usuarios_partida")
            
            for col in boolean_columns:
                col_name = col['column_name']
                print(f"   🔧 Migrando columna: {col_name}")
                
                # Crear columna temporal SMALLINT
                cursor.execute(f"""
                    ALTER TABLE usuarios_partida 
                    ADD COLUMN IF NOT EXISTS {col_name}_temp SMALLINT DEFAULT 0;
                """)
                
                # Copiar datos: true → 1, false → 0
                cursor.execute(f"""
                    UPDATE usuarios_partida 
                    SET {col_name}_temp = CASE WHEN {col_name} = true THEN 1 ELSE 0 END;
                """)
                
                # Eliminar columna original
                cursor.execute(f"""
                    ALTER TABLE usuarios_partida DROP COLUMN IF EXISTS {col_name};
                """)
                
                # Renombrar columna temporal
                cursor.execute(f"""
                    ALTER TABLE usuarios_partida 
                    RENAME COLUMN {col_name}_temp TO {col_name};
                """)
                
                migrations.append(f"✅ {col_name}: BOOLEAN → SMALLINT")
        
        else:
            print("✅ No se encontraron columnas BOOLEAN problemáticas")
            
    except Exception as e:
        print(f"⚠️ Error verificando estructura: {e}")
    
    return migrations

def create_complete_schema(cursor):
    """Crea el esquema completo con tipos correctos"""
    
    # Tabla usuarios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            is_online SMALLINT DEFAULT 0,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✅ Tabla usuarios verificada/creada")
    
    # Tabla partidas
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS partidas (
            id SERIAL PRIMARY KEY,
            codigo VARCHAR(10) UNIQUE NOT NULL,
            configuracion TEXT,
            estado VARCHAR(20) DEFAULT 'esperando',
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✅ Tabla partidas verificada/creada")
    
    # Tabla usuarios_partida (CORREGIDA)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios_partida (
            id SERIAL PRIMARY KEY,
            partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
            usuario_id INTEGER NOT NULL,
            equipo VARCHAR(50) DEFAULT 'sin_equipo',
            listo SMALLINT DEFAULT 0,
            "esCreador" SMALLINT DEFAULT 0,
            fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(partida_id, usuario_id)
        );
    """)
    print("✅ Tabla usuarios_partida verificada/creada")
    
    # Tabla amistades
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS amistades (
            id SERIAL PRIMARY KEY,
            usuario1_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            usuario2_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            estado VARCHAR(20) DEFAULT 'pendiente',
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(usuario1_id, usuario2_id)
        );
    """)
    print("✅ Tabla amistades verificada/creada")
    
    # Tabla mensajes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mensajes (
            id SERIAL PRIMARY KEY,
            remitente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            destinatario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            contenido TEXT NOT NULL,
            leido SMALLINT DEFAULT 0,
            fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✅ Tabla mensajes verificada/creada")
    
    # Tabla salas_gb
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS salas_gb (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            codigo VARCHAR(10) UNIQUE NOT NULL,
            creador_id INTEGER REFERENCES usuarios(id),
            estado VARCHAR(20) DEFAULT 'activa',
            configuracion TEXT,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("✅ Tabla salas_gb verificada/creada")

def create_indexes(cursor):
    """Crea índices para optimizar rendimiento"""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);",
        "CREATE INDEX IF NOT EXISTS idx_usuarios_is_online ON usuarios(is_online);",
        "CREATE INDEX IF NOT EXISTS idx_partidas_codigo ON partidas(codigo);",
        "CREATE INDEX IF NOT EXISTS idx_partidas_estado ON partidas(estado);",
        "CREATE INDEX IF NOT EXISTS idx_usuarios_partida_partida ON usuarios_partida(partida_id);",
        "CREATE INDEX IF NOT EXISTS idx_usuarios_partida_usuario ON usuarios_partida(usuario_id);",
        "CREATE INDEX IF NOT EXISTS idx_amistades_usuario1 ON amistades(usuario1_id);",
        "CREATE INDEX IF NOT EXISTS idx_amistades_usuario2 ON amistades(usuario2_id);",
        "CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON mensajes(remitente_id);",
        "CREATE INDEX IF NOT EXISTS idx_mensajes_destinatario ON mensajes(destinatario_id);",
        "CREATE INDEX IF NOT EXISTS idx_salas_gb_codigo ON salas_gb(codigo);",
    ]
    
    for index_sql in indexes:
        try:
            cursor.execute(index_sql)
            index_name = index_sql.split("idx_")[1].split(" ")[0]
            print(f"✅ Índice idx_{index_name} verificado/creado")
        except Exception as e:
            print(f"⚠️ Error creando índice: {e}")

def backup_schema(cursor):
    """Genera un backup del esquema actual"""
    timestamp = __import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f"maira_schema_backup_{timestamp}.sql"
    
    try:
        # Obtener estructura de todas las tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        """)
        tables = [row['table_name'] for row in cursor.fetchall()]
        
        with open(backup_file, 'w') as f:
            f.write(f"-- MAIRA Database Schema Backup\n")
            f.write(f"-- Generated: {timestamp}\n")
            f.write(f"-- PostgreSQL Compatible\n\n")
            
            for table in tables:
                # Obtener estructura de cada tabla
                cursor.execute("""
                    SELECT column_name, data_type, column_default, is_nullable,
                           character_maximum_length, numeric_precision
                    FROM information_schema.columns 
                    WHERE table_name = %s 
                    ORDER BY ordinal_position;
                """, (table,))
                columns = cursor.fetchall()
                
                # Obtener constraints
                cursor.execute("""
                    SELECT constraint_name, constraint_type
                    FROM information_schema.table_constraints 
                    WHERE table_name = %s;
                """, (table,))
                constraints = cursor.fetchall()
                
                f.write(f"-- Tabla: {table}\n")
                f.write(f"CREATE TABLE {table} (\n")
                
                col_definitions = []
                for col in columns:
                    col_def = f"    {col['column_name']} {col['data_type']}"
                    
                    if col['character_maximum_length']:
                        col_def += f"({col['character_maximum_length']})"
                    elif col['numeric_precision']:
                        col_def += f"({col['numeric_precision']})"
                    
                    if col['is_nullable'] == 'NO':
                        col_def += " NOT NULL"
                    
                    if col['column_default']:
                        col_def += f" DEFAULT {col['column_default']}"
                    
                    col_definitions.append(col_def)
                
                f.write(",\n".join(col_definitions))
                f.write("\n);\n\n")
                
                # Agregar constraints
                for constraint in constraints:
                    f.write(f"-- {constraint['constraint_type']}: {constraint['constraint_name']}\n")
                
                f.write("\n")
        
        print(f"✅ Schema backup creado: {backup_file}")
        return backup_file
        
    except Exception as e:
        print(f"❌ Error creando backup: {e}")
        return None

def main():
    """Función principal de migración"""
    print("🚀 MAIRA Database Migration Script")
    print("=" * 50)
    
    conn = connect_to_db()
    if not conn:
        sys.exit(1)
    
    try:
        cursor = conn.cursor()
        
        # 1. Crear backup del esquema actual
        print("\n📋 1. Creando backup del esquema...")
        backup_file = backup_schema(cursor)
        
        # 2. Migrar columnas problemáticas
        print("\n🔄 2. Migrando columnas BOOLEAN...")
        migrations = migrate_boolean_columns(cursor, conn)
        
        # 3. Crear/verificar esquema completo
        print("\n🏗️ 3. Verificando esquema completo...")
        create_complete_schema(cursor)
        
        # 4. Crear índices
        print("\n📇 4. Creando índices...")
        create_indexes(cursor)
        
        # 5. Commit final
        conn.commit()
        print("\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!")
        
        if migrations:
            print("\n🔄 Migraciones realizadas:")
            for migration in migrations:
                print(f"   {migration}")
        
        if backup_file:
            print(f"\n💾 Backup del esquema: {backup_file}")
        
        print("\n🎯 La base de datos está ahora 100% compatible con PostgreSQL")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error durante la migración: {e}")
        sys.exit(1)
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
