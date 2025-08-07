#!/usr/bin/env python3
"""
Script de prueba para verificar la conexión a PostgreSQL en Render
"""
import psycopg2
import os

# Configuración de PostgreSQL para Render
DATABASE_URL = "postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database"

def test_database_connection():
    try:
        # Conectar a la base de datos
        print("🔗 Conectando a PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Probar algunas consultas
        print("📊 Probando consultas...")
        
        # 1. Contar usuarios
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        user_count = cursor.fetchone()[0]
        print(f"✅ Usuarios en BD: {user_count}")
        
        # 2. Verificar usuarios específicos
        cursor.execute("SELECT id, username, email FROM usuarios LIMIT 3")
        users = cursor.fetchall()
        print("👥 Usuarios disponibles:")
        for user in users:
            print(f"   - ID: {user[0]}, Usuario: {user[1]}, Email: {user[2]}")
        
        # 3. Probar login con usuario conocido
        cursor.execute("SELECT id, username FROM usuarios WHERE username = %s", ('EHR051',))
        user = cursor.fetchone()
        if user:
            print(f"🎯 Usuario de prueba encontrado: {user[1]} (ID: {user[0]})")
        
        # 4. Contar tablas
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
        table_count = cursor.fetchone()[0]
        print(f"📋 Tablas en BD: {table_count}")
        
        cursor.close()
        conn.close()
        print("✅ ¡Conexión a base de datos exitosa!")
        return True
        
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Probando conexión a PostgreSQL en Render...")
    test_database_connection()
