#!/usr/bin/env python3
"""
Script para verificar la estructura real de las tablas en PostgreSQL
"""

import os
import psycopg2
from psycopg2.extras import DictCursor

def verificar_estructura():
    """Verifica la estructura real de las tablas en PostgreSQL"""
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL no encontrada")
        return
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        print("🔍 VERIFICANDO ESTRUCTURA DE TABLAS EN POSTGRESQL")
        print("="*60)
        
        # Verificar tabla usuarios
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios' 
            ORDER BY ordinal_position;
        """)
        
        print("\n📊 TABLA 'usuarios':")
        columns = cursor.fetchall()
        if columns:
            for col in columns:
                print(f"  ✅ {col['column_name']:<20} | {col['data_type']:<15} | NULL: {col['is_nullable']:<3} | DEFAULT: {col['column_default']}")
        else:
            print("  ❌ Tabla 'usuarios' no existe")
        
        # Verificar tabla partidas
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'partidas' 
            ORDER BY ordinal_position;
        """)
        
        print("\n📊 TABLA 'partidas':")
        columns = cursor.fetchall()
        if columns:
            for col in columns:
                print(f"  ✅ {col['column_name']:<20} | {col['data_type']:<15} | NULL: {col['is_nullable']:<3} | DEFAULT: {col['column_default']}")
        else:
            print("  ❌ Tabla 'partidas' no existe")
        
        # Verificar tabla usuarios_partida
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios_partida' 
            ORDER BY ordinal_position;
        """)
        
        print("\n📊 TABLA 'usuarios_partida':")
        columns = cursor.fetchall()
        if columns:
            for col in columns:
                print(f"  ✅ {col['column_name']:<20} | {col['data_type']:<15} | NULL: {col['is_nullable']:<3} | DEFAULT: {col['column_default']}")
        else:
            print("  ❌ Tabla 'usuarios_partida' no existe")
        
        print("\n" + "="*60)
        print("✅ VERIFICACIÓN COMPLETADA")
        
    except Exception as e:
        print(f"❌ Error verificando estructura: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    verificar_estructura()
