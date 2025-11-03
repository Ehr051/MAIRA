#!/usr/bin/env python3
"""
Script para poblar la base de datos MySQL con datos de ejemplo
"""

import pymysql
import os
from dotenv import load_dotenv

# Cargar configuración desde .env
load_dotenv()

def get_db_connection():
    """Conectar a MySQL usando configuración del .env"""
    return pymysql.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'maira_db'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def populate_database():
    """Poblar la base de datos con datos de ejemplo"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("🔄 Poblando base de datos con datos de ejemplo...")
        
        # Insertar usuarios de ejemplo
        usuarios_data = [
            ('admin', 'admin@maira.local', 'admin123'),
            ('jugador1', 'jugador1@test.local', 'pass123'),
            ('jugador2', 'jugador2@test.local', 'pass123'),
            ('test_user', 'test@example.com', 'test123'),
            ('demo_user', 'demo@maira.local', 'demo123')
        ]
        
        for username, email, password in usuarios_data:
            try:
                cursor.execute("""
                    INSERT INTO usuarios (username, email, password, is_online)
                    VALUES (%s, %s, %s, FALSE)
                    ON DUPLICATE KEY UPDATE email=email
                """, (username, email, password))
                print(f"✅ Usuario {username} insertado/actualizado")
            except Exception as e:
                print(f"⚠️  Error con usuario {username}: {e}")
        
        # Insertar partidas de ejemplo
        partidas_data = [
            ('DEMO01', '{"nombre": "Partida Demo", "descripcion": "Partida de demostración", "max_jugadores": 4}', 'esperando'),
            ('TEST01', '{"nombre": "Partida Test", "descripcion": "Partida de prueba", "max_jugadores": 2}', 'esperando'),
            ('GAME001', '{"nombre": "Juego Estratégico", "descripcion": "Partida completa", "max_jugadores": 6}', 'activa'),
            ('TRAINING', '{"nombre": "Entrenamiento", "descripcion": "Sesión de práctica", "max_jugadores": 1}', 'esperando')
        ]
        
        for codigo, config, estado in partidas_data:
            try:
                cursor.execute("""
                    INSERT INTO partidas (codigo, configuracion, estado)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE configuracion=configuracion
                """, (codigo, config, estado))
                print(f"✅ Partida {codigo} insertada/actualizada")
            except Exception as e:
                print(f"⚠️  Error con partida {codigo}: {e}")
        
        # Obtener IDs de usuarios y partidas para crear relaciones
        cursor.execute("SELECT id, username FROM usuarios")
        usuarios = {row['username']: row['id'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT id, codigo FROM partidas")
        partidas = {row['codigo']: row['id'] for row in cursor.fetchall()}
        
        # Insertar relaciones usuario-partida
        relaciones_data = [
            ('admin', 'DEMO01', 'azul', True, True),
            ('jugador1', 'DEMO01', 'rojo', True, False),
            ('jugador2', 'TEST01', 'azul', False, True),
            ('test_user', 'GAME001', 'verde', True, False),
            ('demo_user', 'TRAINING', 'azul', True, True)
        ]
        
        for username, codigo_partida, equipo, listo, es_creador in relaciones_data:
            try:
                if username in usuarios and codigo_partida in partidas:
                    cursor.execute("""
                        INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                        VALUES (%s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE equipo=equipo
                    """, (partidas[codigo_partida], usuarios[username], equipo, listo, es_creador))
                    print(f"✅ Relación {username} -> {codigo_partida} insertada")
            except Exception as e:
                print(f"⚠️  Error con relación {username} -> {codigo_partida}: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Base de datos poblada exitosamente!")
        print("\n📊 Resumen de datos insertados:")
        print("- 5 usuarios de ejemplo")
        print("- 4 partidas de ejemplo") 
        print("- 5 relaciones usuario-partida")
        
    except Exception as e:
        print(f"❌ Error poblando base de datos: {e}")

if __name__ == "__main__":
    populate_database()
