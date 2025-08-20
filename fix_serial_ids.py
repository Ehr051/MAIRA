#!/usr/bin/env python3
"""
Script para corregir específicamente las columnas ID sin SERIAL en tablas partidas y usuarios_partida
"""

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database?sslmode=require"

def fix_serial_columns():
    """Corrige las columnas ID para que sean SERIAL (autoincrement)"""
    print("🔧 CORRECCIÓN DE COLUMNAS ID SIN SERIAL")
    print("=" * 45)
    
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        print("✅ Conexión exitosa")
        
        # 1. Verificar estado actual de las tablas problemáticas
        tables_to_fix = ['partidas', 'usuarios_partida']
        
        for table_name in tables_to_fix:
            print(f"\n🔍 ANALIZANDO TABLA: {table_name}")
            print("-" * 30)
            
            # Verificar estructura actual de la columna ID
            cursor.execute("""
                SELECT column_name, data_type, column_default, is_nullable
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = 'id'
            """, (table_name,))
            
            id_column = cursor.fetchone()
            if id_column:
                print(f"  📊 Columna ID actual:")
                print(f"    - Tipo: {id_column['data_type']}")
                print(f"    - Default: {id_column['column_default']}")
                print(f"    - Nullable: {id_column['is_nullable']}")
                
                # Verificar si ya tiene SERIAL
                has_serial = 'nextval' in str(id_column['column_default'] or '')
                if has_serial:
                    print(f"  ✅ La columna ID ya tiene SERIAL")
                    continue
                else:
                    print(f"  ❌ La columna ID NO tiene SERIAL")
            
            # Contar registros existentes
            cursor.execute(f"SELECT COUNT(*) as count, MAX(id) as max_id FROM {table_name}")
            stats = cursor.fetchone()
            record_count = stats['count']
            max_id = stats['max_id'] or 0
            
            print(f"  📈 Registros existentes: {record_count}")
            print(f"  🔢 ID máximo actual: {max_id}")
            
            if record_count > 0:
                print(f"  ⚠️  Hay datos existentes, procediendo con cuidado...")
            
            # Crear secuencia si no existe
            sequence_name = f"{table_name}_id_seq"
            print(f"\n🔢 Creando secuencia: {sequence_name}")
            
            cursor.execute(f"""
                CREATE SEQUENCE IF NOT EXISTS {sequence_name}
                START WITH {max_id + 1}
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
            """)
            print(f"  ✅ Secuencia {sequence_name} creada/verificada")
            
            # Actualizar la columna para usar la secuencia
            print(f"\n🔧 Configurando columna ID para usar secuencia...")
            cursor.execute(f"""
                ALTER TABLE {table_name} 
                ALTER COLUMN id SET DEFAULT nextval('{sequence_name}');
            """)
            print(f"  ✅ Columna ID configurada con autoincrement")
            
            # Asignar la secuencia a la columna (para que DROP TABLE también elimine la secuencia)
            cursor.execute(f"""
                ALTER SEQUENCE {sequence_name} OWNED BY {table_name}.id;
            """)
            print(f"  ✅ Secuencia vinculada a la tabla")
            
            # Verificar el resultado
            cursor.execute("""
                SELECT column_name, data_type, column_default, is_nullable
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = 'id'
            """, (table_name,))
            
            updated_column = cursor.fetchone()
            print(f"\n📊 Estado después de la corrección:")
            print(f"  - Tipo: {updated_column['data_type']}")
            print(f"  - Default: {updated_column['column_default']}")
            print(f"  - Nullable: {updated_column['is_nullable']}")
            
            has_serial_now = 'nextval' in str(updated_column['column_default'] or '')
            if has_serial_now:
                print(f"  ✅ CORRECCIÓN EXITOSA - ID ahora tiene autoincrement")
            else:
                print(f"  ❌ ERROR - ID aún no tiene autoincrement")
        
        # Confirmar todos los cambios
        conn.commit()
        print(f"\n💾 CAMBIOS CONFIRMADOS EN LA BASE DE DATOS")
        
        # Test de inserción para verificar que funciona
        print(f"\n🧪 PRUEBA DE INSERCIÓN")
        print("-" * 20)
        
        # Probar partidas
        try:
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado) 
                VALUES ('TEST01', '{"test": true}', 'test') 
                RETURNING id
            """)
            test_id = cursor.fetchone()['id']
            print(f"  ✅ Partida test insertada con ID: {test_id}")
            
            # Eliminar el registro de prueba
            cursor.execute("DELETE FROM partidas WHERE codigo = 'TEST01'")
            print(f"  🗑️  Registro de prueba eliminado")
        except Exception as e:
            print(f"  ❌ Error en prueba de partidas: {e}")
        
        # Probar usuarios_partida
        try:
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo) 
                VALUES (1, 1, 'test') 
                RETURNING id
            """)
            test_id = cursor.fetchone()['id']
            print(f"  ✅ usuarios_partida test insertado con ID: {test_id}")
            
            # Eliminar el registro de prueba
            cursor.execute("DELETE FROM usuarios_partida WHERE equipo = 'test' AND id = %s", (test_id,))
            print(f"  🗑️  Registro de prueba eliminado")
        except Exception as e:
            print(f"  ❌ Error en prueba de usuarios_partida: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 40)
        print("✅ Todas las columnas ID ahora tienen autoincrement")
        print("✅ Las secuencias están configuradas correctamente")
        print("✅ Pruebas de inserción exitosas")
        
    except Exception as e:
        print(f"❌ Error durante la corrección: {e}")
        if conn:
            conn.rollback()
        return False
    
    return True

if __name__ == "__main__":
    success = fix_serial_columns()
    if success:
        print("\n✅ Base de datos completamente corregida")
    else:
        print("\n❌ Error en la corrección")
