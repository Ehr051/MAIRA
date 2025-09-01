#!/usr/bin/env python3
"""
Debug específico para operaciones y partidas de MAIRA
Diagnóstica problemas de sincronización entre frontend y backend
"""

import psycopg2
import psycopg2.extras
import json
import os
from datetime import datetime

def get_db_connection():
    """Establecer conexión con PostgreSQL"""
    try:
        # Intentar con DATABASE_URL primero
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if DATABASE_URL:
            conn = psycopg2.connect(
                DATABASE_URL, 
                cursor_factory=psycopg2.extras.DictCursor,
                sslmode='require'
            )
            print("✅ Conexión exitosa via DATABASE_URL")
            return conn
        
        # Fallback a credenciales individuales
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            user=os.environ.get('DB_USER', 'postgres'),
            password=os.environ.get('DB_PASSWORD', ''),
            database=os.environ.get('DB_NAME', 'maira'),
            port=os.environ.get('DB_PORT', 5432),
            cursor_factory=psycopg2.extras.DictCursor
        )
        print("✅ Conexión exitosa via credenciales individuales")
        return conn
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def diagnosticar_esquema_bd():
    """Diagnosticar el esquema de la base de datos"""
    print("\n" + "="*60)
    print("🔍 DIAGNÓSTICO ESQUEMA BASE DE DATOS")
    print("="*60)
    
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # 1. Listar todas las tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tablas = [row['table_name'] for row in cursor.fetchall()]
        print(f"📋 Tablas encontradas ({len(tablas)}):")
        for tabla in tablas:
            print(f"  • {tabla}")
        
        # 2. Verificar estructura tabla partidas
        if 'partidas' in tablas:
            print(f"\n🗂️ ESTRUCTURA TABLA 'partidas':")
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'partidas' 
                ORDER BY ordinal_position
            """)
            columnas = cursor.fetchall()
            for col in columnas:
                default_text = f"DEFAULT {col['column_default']}" if col['column_default'] else ""
                print(f"  • {col['column_name']}: {col['data_type']} "
                      f"({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'}) "
                      f"{default_text}")
        
        # 3. Verificar estructura tabla usuarios_partida
        if 'usuarios_partida' in tablas:
            print(f"\n🗂️ ESTRUCTURA TABLA 'usuarios_partida':")
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'usuarios_partida' 
                ORDER BY ordinal_position
            """)
            columnas = cursor.fetchall()
            for col in columnas:
                default_text = f"DEFAULT {col['column_default']}" if col['column_default'] else ""
                print(f"  • {col['column_name']}: {col['data_type']} "
                      f"({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'}) "
                      f"{default_text}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error diagnosticando esquema: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def diagnosticar_datos_partidas():
    """Diagnosticar datos en tabla partidas"""
    print("\n" + "="*60)
    print("📊 DIAGNÓSTICO DATOS PARTIDAS")
    print("="*60)
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # 1. Contar registros por tipo
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN configuracion::text LIKE '%"tipo":"gestion_batalla"%' THEN 'Gestión Batalla'
                    WHEN configuracion::text LIKE '%"modo"%' THEN 'Juego Guerra'
                    ELSE 'Otro/Sin clasificar'
                END as tipo,
                COUNT(*) as cantidad,
                STRING_AGG(estado, ', ') as estados
            FROM partidas 
            GROUP BY 1
            ORDER BY cantidad DESC
        """)
        tipos = cursor.fetchall()
        
        print("📈 Distribución por tipo:")
        for tipo in tipos:
            print(f"  • {tipo['tipo']}: {tipo['cantidad']} registros (estados: {tipo['estados']})")
        
        # 2. Partidas recientes
        cursor.execute("""
            SELECT 
                codigo, 
                estado,
                fecha_creacion,
                configuracion::text as config_preview
            FROM partidas 
            ORDER BY fecha_creacion DESC 
            LIMIT 10
        """)
        recientes = cursor.fetchall()
        
        print(f"\n📅 Últimas 10 partidas:")
        for partida in recientes:
            config_preview = partida['config_preview'][:100] + "..." if len(partida['config_preview']) > 100 else partida['config_preview']
            print(f"  • {partida['codigo']} | {partida['estado']} | {partida['fecha_creacion']} | {config_preview}")
        
        # 3. Operaciones GB específicamente
        cursor.execute("""
            SELECT 
                codigo,
                estado,
                fecha_creacion,
                configuracion
            FROM partidas 
            WHERE configuracion::text LIKE '%"tipo":"gestion_batalla"%'
            ORDER BY fecha_creacion DESC
        """)
        operaciones_gb = cursor.fetchall()
        
        print(f"\n🎖️ Operaciones Gestión Batalla ({len(operaciones_gb)}):")
        for op in operaciones_gb:
            config = json.loads(op['configuracion']) if op['configuracion'] else {}
            nombre = config.get('nombre', 'Sin nombre')
            creador = config.get('creador', 'Desconocido')
            print(f"  • {op['codigo']} | {op['estado']} | '{nombre}' por {creador} | {op['fecha_creacion']}")
        
    except Exception as e:
        print(f"❌ Error diagnosticando datos partidas: {e}")
    finally:
        cursor.close()
        conn.close()

def diagnosticar_usuarios_partida():
    """Diagnosticar datos en tabla usuarios_partida"""
    print("\n" + "="*60)
    print("👥 DIAGNÓSTICO USUARIOS_PARTIDA")
    print("="*60)
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # 1. Estadísticas generales
        cursor.execute("""
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT partida_id) as partidas_con_usuarios,
                COUNT(DISTINCT usuario_id) as usuarios_unicos,
                STRING_AGG(DISTINCT equipo, ', ') as equipos_diferentes
            FROM usuarios_partida
        """)
        stats = cursor.fetchone()
        
        print("📊 Estadísticas generales:")
        print(f"  • Total registros: {stats['total_registros']}")
        print(f"  • Partidas con usuarios: {stats['partidas_con_usuarios']}")
        print(f"  • Usuarios únicos: {stats['usuarios_unicos']}")
        print(f"  • Equipos diferentes: {stats['equipos_diferentes']}")
        
        # 2. Distribución por equipo
        cursor.execute("""
            SELECT equipo, COUNT(*) as cantidad
            FROM usuarios_partida 
            GROUP BY equipo 
            ORDER BY cantidad DESC
        """)
        equipos = cursor.fetchall()
        
        print(f"\n🏷️ Distribución por equipo:")
        for equipo in equipos:
            print(f"  • {equipo['equipo']}: {equipo['cantidad']} usuarios")
        
        # 3. Partidas con problemas (sin usuarios o usuarios huérfanos)
        cursor.execute("""
            SELECT p.codigo, p.estado, COUNT(up.usuario_id) as usuarios_count
            FROM partidas p
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id
            GROUP BY p.id, p.codigo, p.estado
            HAVING COUNT(up.usuario_id) = 0
            ORDER BY p.fecha_creacion DESC
        """)
        sin_usuarios = cursor.fetchall()
        
        if sin_usuarios:
            print(f"\n⚠️ Partidas sin usuarios ({len(sin_usuarios)}):")
            for partida in sin_usuarios:
                print(f"  • {partida['codigo']} | {partida['estado']} | {partida['usuarios_count']} usuarios")
        
    except Exception as e:
        print(f"❌ Error diagnosticando usuarios_partida: {e}")
    finally:
        cursor.close()
        conn.close()

def simular_creacion_operacion():
    """Simular creación de operación para verificar el flujo"""
    print("\n" + "="*60)
    print("🧪 SIMULACIÓN CREACIÓN OPERACIÓN")
    print("="*60)
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Datos de prueba
        timestamp = datetime.now()
        codigo_test = f"TEST_{int(timestamp.timestamp())}"
        configuracion_test = {
            'tipo': 'gestion_batalla',
            'nombre': 'Operación Diagnóstico',
            'descripcion': 'Operación creada para diagnosticar problemas',
            'area': 'Test Area',
            'creador': 'Sistema Debug'
        }
        
        print(f"🔬 Creando operación de prueba: {codigo_test}")
        
        # 1. Insertar en partidas
        cursor.execute("""
            INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (codigo_test, json.dumps(configuracion_test), 'preparacion', timestamp))
        
        operacion_id = cursor.fetchone()['id']
        print(f"✅ Operación insertada con ID: {operacion_id}")
        
        # 2. Simular usuario creador (sin usuario real, solo test)
        cursor.execute("""
            INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
            VALUES (%s, %s, 'director', false, true)
        """, (operacion_id, 999))  # Usuario ID ficticio
        
        print("✅ Usuario creador simulado agregado")
        
        # 3. Verificar que se puede recuperar
        cursor.execute("""
            SELECT p.*, up.equipo, up.esCreador
            FROM partidas p
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id
            WHERE p.codigo = %s
        """, (codigo_test,))
        
        resultado = cursor.fetchone()
        if resultado:
            config = json.loads(resultado['configuracion'])
            print(f"✅ Operación recuperada exitosamente:")
            print(f"  • Código: {resultado['codigo']}")
            print(f"  • Estado: {resultado['estado']}")
            print(f"  • Nombre: {config.get('nombre')}")
            print(f"  • Creador en equipo: {resultado['equipo']}")
            print(f"  • Es creador: {resultado['escreador']}")
        
        # 4. Limpiar datos de prueba
        cursor.execute("DELETE FROM usuarios_partida WHERE partida_id = %s", (operacion_id,))
        cursor.execute("DELETE FROM partidas WHERE id = %s", (operacion_id,))
        
        conn.commit()
        print("🧹 Datos de prueba limpiados")
        
    except Exception as e:
        print(f"❌ Error en simulación: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def main():
    """Ejecutar diagnóstico completo"""
    print("🔍 DIAGNÓSTICO COMPLETO OPERACIONES Y PARTIDAS MAIRA")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Ejecutar todos los diagnósticos
    if diagnosticar_esquema_bd():
        diagnosticar_datos_partidas()
        diagnosticar_usuarios_partida()
        simular_creacion_operacion()
    
    print("\n" + "="*80)
    print("✅ DIAGNÓSTICO COMPLETADO")
    print("="*80)

if __name__ == "__main__":
    main()
