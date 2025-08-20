#!/usr/bin/env python3
"""
Script para corregir el schema de la base de datos PostgreSQL en Render
- Agregar SERIAL autoincrement a la columna id
- Corregir tipo de datos is_online
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# URL directa de la base de datos PostgreSQL en Render (con SSL)
DATABASE_URL = "postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database?sslmode=require"

def fix_database_schema():
    """Corregir el schema de la base de datos"""
    print("🔧 CORRECCIÓN DE SCHEMA DE BASE DE DATOS MAIRA")
    print("=============================================")
    
    try:
        print("🔍 Conectando a PostgreSQL en Render...")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        print("✅ Conexión exitosa")
        
        # Verificar estructura actual de la tabla usuarios
        print("\n📋 Verificando estructura actual de tabla 'usuarios'...")
        cursor.execute("""
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("📋 Estructura actual:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']}, default: {col['column_default']}, nullable: {col['is_nullable']}")
        
        # Verificar si hay datos en la tabla
        cursor.execute("SELECT COUNT(*) as count FROM usuarios;")
        user_count = cursor.fetchone()['count']
        print(f"\n📊 Número de usuarios existentes: {user_count}")
        
        if user_count > 0:
            print("⚠️  Hay usuarios existentes. Eliminando para recrear tabla...")
            cursor.execute("DELETE FROM usuarios;")
            conn.commit()
            print("✅ Usuarios eliminados")
        
        # Eliminar la tabla usuarios para recrearla correctamente
        print("\n🗑️  Eliminando tabla 'usuarios' para recrearla...")
        cursor.execute("DROP TABLE IF EXISTS usuarios CASCADE;")
        conn.commit()
        print("✅ Tabla eliminada")
        
        # Recrear tabla usuarios con la estructura correcta
        print("\n👥 Recreando tabla 'usuarios' con estructura correcta...")
        cursor.execute("""
            CREATE TABLE usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                unidad VARCHAR(100),
                is_online SMALLINT DEFAULT 0,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        print("✅ Tabla 'usuarios' recreada correctamente")
        
        # Verificar la nueva estructura
        print("\n📋 Verificando nueva estructura...")
        cursor.execute("""
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("📋 Nueva estructura:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']}, default: {col['column_default']}, nullable: {col['is_nullable']}")
        
        # Verificar que otras tablas existan
        print("\n📋 Verificando otras tablas...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        all_tables = [row[0] for row in cursor.fetchall()]
        print(f"📋 Todas las tablas: {all_tables}")
        
        # Crear tabla partidas si no existe
        if 'partidas' not in all_tables:
            print("\n🎯 Creando tabla 'partidas'...")
            cursor.execute("""
                CREATE TABLE partidas (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    creador_id INTEGER REFERENCES usuarios(id),
                    estado VARCHAR(20) DEFAULT 'esperando',
                    modo VARCHAR(20) NOT NULL,
                    mapa VARCHAR(100),
                    configuracion TEXT,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            print("✅ Tabla 'partidas' creada")
        
        # Crear tabla usuarios_partida si no existe
        if 'usuarios_partida' not in all_tables:
            print("\n🤝 Creando tabla 'usuarios_partida'...")
            cursor.execute("""
                CREATE TABLE usuarios_partida (
                    id SERIAL PRIMARY KEY,
                    usuario_id INTEGER REFERENCES usuarios(id),
                    partida_id INTEGER REFERENCES partidas(id),
                    rol VARCHAR(50),
                    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(usuario_id, partida_id)
                );
            """)
            conn.commit()
            print("✅ Tabla 'usuarios_partida' creada")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE")
        print("====================================")
        print("✅ Schema de base de datos corregido")
        print("✅ Columna 'id' ahora es SERIAL (autoincrement)")
        print("✅ Columna 'is_online' es SMALLINT (0/1)")
        print("✅ Todas las tablas verificadas")
        
    except Exception as e:
        print(f"❌ Error durante la corrección: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = fix_database_schema()
    if success:
        print("\n✅ Base de datos lista para crear usuarios")
    else:
        print("\n❌ Error en la corrección de la base de datos")
