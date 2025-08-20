#!/usr/bin/env python3
"""
Script para configurar las tablas de la base de datos PostgreSQL en Render
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# URL directa de la base de datos PostgreSQL en Render (con SSL)
DATABASE_URL = "postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database?sslmode=require"

def create_tables():
    """Crear las tablas necesarias para MAIRA"""
    print("🏗️ CONFIGURACIÓN DE BASE DE DATOS MAIRA EN RENDER")
    print("==================================================")
    
    try:
        print("🔍 Conectando a PostgreSQL en Render...")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        print("✅ Conexión exitosa")
        
        # Verificar tablas existentes
        print("\n📋 Verificando tablas existentes...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        existing_tables = [row[0] for row in cursor.fetchall()]
        print(f"📋 Tablas existentes: {existing_tables}")
        
        # Crear tabla usuarios
        print("\n👥 Creando tabla 'usuarios'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                unidad VARCHAR(100),
                is_online BOOLEAN DEFAULT false,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Tabla 'usuarios' creada/verificada")
        
        # Crear tabla partidas
        print("\n🎯 Creando tabla 'partidas'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS partidas (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(10) UNIQUE NOT NULL,
                configuracion JSONB,
                estado VARCHAR(20) DEFAULT 'esperando',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_finalizacion TIMESTAMP
            );
        """)
        print("✅ Tabla 'partidas' creada/verificada")
        
        # Crear tabla usuarios_partida (relación muchos a muchos)
        print("\n🔗 Creando tabla 'usuarios_partida'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios_partida (
                id SERIAL PRIMARY KEY,
                partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                equipo VARCHAR(50) DEFAULT 'sin_equipo',
                listo BOOLEAN DEFAULT false,
                esCreador BOOLEAN DEFAULT false,
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(partida_id, usuario_id)
            );
        """)
        print("✅ Tabla 'usuarios_partida' creada/verificada")
        
        # Crear índices para optimización
        print("\n🏃 Creando índices de optimización...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_partidas_codigo ON partidas(codigo);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_partidas_estado ON partidas(estado);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_partida_partida ON usuarios_partida(partida_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_partida_usuario ON usuarios_partida(usuario_id);")
        print("✅ Índices creados/verificados")
        
        # Confirmar cambios
        conn.commit()
        print("\n💾 Cambios confirmados en la base de datos")
        
        # Verificar configuración final
        print("\n🔍 Verificación final...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('usuarios', 'partidas', 'usuarios_partida')
            ORDER BY table_name;
        """)
        final_tables = [row[0] for row in cursor.fetchall()]
        
        required_tables = ['usuarios', 'partidas', 'usuarios_partida']
        missing_tables = [t for t in required_tables if t not in final_tables]
        
        if not missing_tables:
            print("✅ TODAS LAS TABLAS NECESARIAS ESTÁN PRESENTES")
            print(f"📋 Tablas confirmadas: {final_tables}")
        else:
            print(f"❌ Faltan tablas: {missing_tables}")
            
        cursor.close()
        conn.close()
        print("\n🎉 Configuración de base de datos completada exitosamente")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error de PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

if __name__ == "__main__":
    success = create_tables()
    if success:
        print("\n🚀 ¡Base de datos lista para MAIRA!")
        print("Ahora puedes probar el login en: https://maira-frontend.onrender.com")
    else:
        print("\n💥 Error configurando la base de datos")
