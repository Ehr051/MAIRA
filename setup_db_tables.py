#!/usr/bin/env python3
"""
Script para crear las tablas necesarias en PostgreSQL
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import sys

# URL de conexión directa
DATABASE_URL = "postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database"

def crear_tablas():
    """Crear las tablas necesarias para MAIRA"""
    
    # Scripts SQL para crear las tablas
    tablas_sql = [
        """
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            unidad VARCHAR(100),
            is_online BOOLEAN DEFAULT FALSE,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS partidas (
            id SERIAL PRIMARY KEY,
            codigo VARCHAR(10) UNIQUE NOT NULL,
            configuracion JSONB,
            estado VARCHAR(20) DEFAULT 'esperando',
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_finalizacion TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS usuarios_partida (
            id SERIAL PRIMARY KEY,
            partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
            usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
            equipo VARCHAR(50) DEFAULT 'sin_equipo',
            listo BOOLEAN DEFAULT FALSE,
            esCreador BOOLEAN DEFAULT FALSE,
            fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(partida_id, usuario_id)
        );
        """
    ]
    
    try:
        print("🔄 Conectando a PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        print("🗄️ Creando tablas...")
        for i, sql in enumerate(tablas_sql, 1):
            print(f"  Creando tabla {i}/3...")
            cursor.execute(sql)
        
        conn.commit()
        print("✅ Todas las tablas creadas exitosamente")
        
        # Verificar las tablas creadas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tablas = cursor.fetchall()
        print(f"\n📊 Tablas en la base de datos ({len(tablas)}):")
        for tabla in tablas:
            print(f"  ✓ {tabla[0]}")
            
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        return False

def verificar_conexion():
    """Verificar que la conexión funciona"""
    try:
        print("🔍 Verificando conexión...")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        
        with conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Conectado a: {version[0]}")
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def main():
    print("🏗️ CONFIGURACIÓN DE BASE DE DATOS MAIRA")
    print("=" * 50)
    
    # Verificar conexión
    if not verificar_conexion():
        print("❌ No se puede conectar a la base de datos")
        return 1
    
    # Crear tablas
    if not crear_tablas():
        print("❌ Error creando tablas")
        return 1
    
    print("\n🎉 BASE DE DATOS CONFIGURADA CORRECTAMENTE")
    print("✅ La aplicación debería funcionar ahora")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
