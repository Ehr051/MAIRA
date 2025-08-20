#!/usr/bin/env python3
"""
Script simplificado para crear tablas PostgreSQL en Render
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# URL con las credenciales correctas
DATABASE_URL = "postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database?sslmode=require"

def main():
    print("🏗️ MAIRA - Configuración PostgreSQL")
    print("====================================")
    
    try:
        print("🔗 Conectando a PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        print("✅ Conectado exitosamente")
        
        print("\n📋 Verificando tablas existentes...")
        cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
        rows = cursor.fetchall()
        existing = [row['tablename'] for row in rows]
        print(f"Tablas actuales: {existing}")
        
        print("\n👥 Creando tabla usuarios...")
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
        print("✅ Tabla usuarios OK")
        
        print("\n🎯 Creando tabla partidas...")
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
        print("✅ Tabla partidas OK")
        
        print("\n🔗 Creando tabla usuarios_partida...")
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
        print("✅ Tabla usuarios_partida OK")
        
        print("\n🚀 Creando índices...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_partidas_codigo ON partidas(codigo);")
        print("✅ Índices OK")
        
        conn.commit()
        print("\n💾 Cambios guardados")
        
        # Verificar resultado final
        cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
        rows = cursor.fetchall()
        final_tables = [row['tablename'] for row in rows]
        print(f"\n📋 Tablas finales: {final_tables}")
        
        required = ['usuarios', 'partidas', 'usuarios_partida']
        missing = [t for t in required if t not in final_tables]
        
        if not missing:
            print("🎉 ¡TODO LISTO! Base de datos configurada correctamente")
        else:
            print(f"⚠️ Faltan tablas: {missing}")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"Tipo de error: {type(e).__name__}")

if __name__ == "__main__":
    main()
