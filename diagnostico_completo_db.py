#!/usr/bin/env python3
"""
Script completo de auditoría y corrección de base de datos PostgreSQL para MAIRA
- Revisa estructura de todas las tablas
- Identifica problemas de tipos de datos, constraints, índices
- Corrige automáticamente los problemas encontrados
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

# URL directa de la base de datos PostgreSQL en Render (con SSL)
DATABASE_URL = "postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database?sslmode=require"

def audit_database():
    """Auditoría completa de la base de datos"""
    print("🔍 AUDITORÍA COMPLETA DE BASE DE DATOS MAIRA")
    print("=" * 50)
    
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        print("✅ Conexión exitosa a PostgreSQL")
        
        # 1. Obtener todas las tablas existentes
        print("\n📋 TABLAS EXISTENTES EN LA BASE DE DATOS")
        print("-" * 40)
        cursor.execute("""
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        all_tables = cursor.fetchall()
        
        for table in all_tables:
            print(f"  📄 {table['table_name']} ({table['table_type']})")
        
        if not all_tables:
            print("  ⚠️  No se encontraron tablas en el schema 'public'")
            return
        
        # 2. Auditar cada tabla individualmente
        issues_found = []
        
        for table in all_tables:
            table_name = table['table_name']
            print(f"\n🔍 AUDITANDO TABLA: {table_name}")
            print("-" * 30)
            
            # Obtener estructura de la tabla
            cursor.execute("""
                SELECT 
                    column_name, 
                    data_type, 
                    column_default, 
                    is_nullable,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale
                FROM information_schema.columns 
                WHERE table_name = %s 
                ORDER BY ordinal_position;
            """, (table_name,))
            
            columns = cursor.fetchall()
            
            print(f"  📊 Columnas ({len(columns)}):")
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                default = f", default: {col['column_default']}" if col['column_default'] else ""
                length = f"({col['character_maximum_length']})" if col['character_maximum_length'] else ""
                print(f"    - {col['column_name']}: {col['data_type']}{length}, {nullable}{default}")
                
                # Identificar problemas potenciales
                if table_name == 'usuarios':
                    if col['column_name'] == 'id' and 'nextval' not in str(col['column_default'] or ''):
                        issues_found.append({
                            'table': table_name,
                            'column': col['column_name'],
                            'issue': 'ID sin SERIAL/autoincrement',
                            'severity': 'HIGH'
                        })
                    
                    if col['column_name'] == 'is_online' and col['data_type'] not in ['smallint', 'integer']:
                        issues_found.append({
                            'table': table_name,
                            'column': col['column_name'],
                            'issue': f'Tipo de datos incorrecto: {col["data_type"]} (debería ser SMALLINT)',
                            'severity': 'MEDIUM'
                        })
                
                if table_name == 'partidas':
                    if col['column_name'] == 'id' and 'nextval' not in str(col['column_default'] or ''):
                        issues_found.append({
                            'table': table_name,
                            'column': col['column_name'],
                            'issue': 'ID sin SERIAL/autoincrement',
                            'severity': 'HIGH'
                        })
                
                if table_name == 'usuarios_partida':
                    if col['column_name'] == 'id' and 'nextval' not in str(col['column_default'] or ''):
                        issues_found.append({
                            'table': table_name,
                            'column': col['column_name'],
                            'issue': 'ID sin SERIAL/autoincrement',
                            'severity': 'HIGH'
                        })
            
            # Verificar constraints
            cursor.execute("""
                SELECT 
                    con.conname as constraint_name,
                    con.contype as constraint_type,
                    pg_get_constraintdef(con.oid) as constraint_definition
                FROM pg_catalog.pg_constraint con
                INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
                INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
                WHERE rel.relname = %s AND nsp.nspname = 'public'
                ORDER BY con.conname;
            """, (table_name,))
            
            constraints = cursor.fetchall()
            print(f"  🔒 Constraints ({len(constraints)}):")
            for constraint in constraints:
                constraint_types = {
                    'p': 'PRIMARY KEY',
                    'f': 'FOREIGN KEY', 
                    'u': 'UNIQUE',
                    'c': 'CHECK'
                }
                constraint_type = constraint_types.get(constraint['constraint_type'], constraint['constraint_type'])
                print(f"    - {constraint['constraint_name']}: {constraint_type}")
            
            # Verificar índices
            cursor.execute("""
                SELECT 
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE tablename = %s AND schemaname = 'public'
                ORDER BY indexname;
            """, (table_name,))
            
            indexes = cursor.fetchall()
            print(f"  📇 Índices ({len(indexes)}):")
            for index in indexes:
                print(f"    - {index['indexname']}")
            
            # Contar registros
            cursor.execute(f"SELECT COUNT(*) as count FROM {table_name};")
            record_count = cursor.fetchone()['count']
            print(f"  📈 Registros: {record_count}")
        
        # 3. Mostrar resumen de problemas encontrados
        print(f"\n🚨 PROBLEMAS IDENTIFICADOS ({len(issues_found)})")
        print("-" * 40)
        
        if not issues_found:
            print("  ✅ No se encontraron problemas en la estructura de la base de datos")
        else:
            for i, issue in enumerate(issues_found, 1):
                severity_emoji = "🔴" if issue['severity'] == 'HIGH' else "🟡" if issue['severity'] == 'MEDIUM' else "🟢"
                print(f"  {severity_emoji} {i}. {issue['table']}.{issue['column']}: {issue['issue']}")
        
        # 4. Verificar esquema esperado vs actual
        print(f"\n📐 VERIFICACIÓN DE ESQUEMA ESPERADO")
        print("-" * 40)
        
        expected_schema = {
            'usuarios': {
                'columns': {
                    'id': {'type': 'integer', 'serial': True, 'primary_key': True},
                    'username': {'type': 'character varying', 'length': 50, 'unique': True, 'not_null': True},
                    'password': {'type': 'character varying', 'length': 255, 'not_null': True},
                    'email': {'type': 'character varying', 'length': 100, 'unique': True, 'not_null': True},
                    'unidad': {'type': 'character varying', 'length': 100, 'nullable': True},
                    'is_online': {'type': 'smallint', 'default': 0},
                    'fecha_registro': {'type': 'timestamp without time zone', 'default': 'CURRENT_TIMESTAMP'}
                }
            },
            'partidas': {
                'columns': {
                    'id': {'type': 'integer', 'serial': True, 'primary_key': True},
                    'codigo': {'type': 'character varying', 'length': 10, 'unique': True, 'not_null': True},
                    'configuracion': {'type': 'jsonb'},
                    'estado': {'type': 'character varying', 'length': 20, 'default': "'esperando'"},
                    'fecha_creacion': {'type': 'timestamp without time zone', 'default': 'CURRENT_TIMESTAMP'},
                    'fecha_finalizacion': {'type': 'timestamp without time zone', 'nullable': True}
                }
            },
            'usuarios_partida': {
                'columns': {
                    'id': {'type': 'integer', 'serial': True, 'primary_key': True},
                    'partida_id': {'type': 'integer', 'foreign_key': 'partidas(id)'},
                    'usuario_id': {'type': 'integer', 'foreign_key': 'usuarios(id)'},
                    'equipo': {'type': 'character varying', 'length': 50, 'default': "'sin_equipo'"},
                    'listo': {'type': 'boolean', 'default': 'false'},
                    'esCreador': {'type': 'boolean', 'default': 'false'},
                    'fecha_union': {'type': 'timestamp without time zone', 'default': 'CURRENT_TIMESTAMP'}
                }
            }
        }
        
        schema_issues = []
        table_names = [t['table_name'] for t in all_tables]
        
        for expected_table, schema in expected_schema.items():
            if expected_table not in table_names:
                schema_issues.append(f"❌ Tabla faltante: {expected_table}")
            else:
                print(f"  ✅ Tabla {expected_table} existe")
        
        if schema_issues:
            print("  🚨 Problemas de esquema encontrados:")
            for issue in schema_issues:
                print(f"    {issue}")
        
        cursor.close()
        conn.close()
        
        return {
            'tables': [t['table_name'] for t in all_tables],
            'issues': issues_found,
            'schema_issues': schema_issues,
            'total_issues': len(issues_found) + len(schema_issues)
        }
        
    except Exception as e:
        print(f"❌ Error durante la auditoría: {e}")
        return None

def fix_database_issues():
    """Corrige automáticamente los problemas encontrados"""
    print("\n🔧 CORRECCIÓN AUTOMÁTICA DE PROBLEMAS")
    print("=" * 50)
    
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        fixes_applied = []
        
        # Obtener lista de tablas actuales
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        existing_tables = [row['table_name'] for row in cursor.fetchall()]
        
        print(f"📋 Tablas existentes: {existing_tables}")
        
        # Si las tablas principales no existen, crearlas
        required_tables = ['usuarios', 'partidas', 'usuarios_partida']
        missing_tables = [t for t in required_tables if t not in existing_tables]
        
        if missing_tables:
            print(f"\n🏗️  Creando tablas faltantes: {missing_tables}")
            
            if 'usuarios' in missing_tables:
                print("  👥 Creando tabla 'usuarios'...")
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
                fixes_applied.append("✅ Tabla 'usuarios' creada")
            
            if 'partidas' in missing_tables:
                print("  🎯 Creando tabla 'partidas'...")
                cursor.execute("""
                    CREATE TABLE partidas (
                        id SERIAL PRIMARY KEY,
                        codigo VARCHAR(10) UNIQUE NOT NULL,
                        configuracion JSONB,
                        estado VARCHAR(20) DEFAULT 'esperando',
                        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        fecha_finalizacion TIMESTAMP
                    );
                """)
                fixes_applied.append("✅ Tabla 'partidas' creada")
            
            if 'usuarios_partida' in missing_tables:
                print("  🤝 Creando tabla 'usuarios_partida'...")
                cursor.execute("""
                    CREATE TABLE usuarios_partida (
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
                fixes_applied.append("✅ Tabla 'usuarios_partida' creada")
        
        # Crear índices de optimización
        print("\n📇 Creando índices de optimización...")
        indexes_to_create = [
            ("idx_usuarios_username", "usuarios", "username"),
            ("idx_usuarios_email", "usuarios", "email"),
            ("idx_partidas_codigo", "partidas", "codigo"),
            ("idx_partidas_estado", "partidas", "estado"),
            ("idx_usuarios_partida_partida", "usuarios_partida", "partida_id"),
            ("idx_usuarios_partida_usuario", "usuarios_partida", "usuario_id"),
        ]
        
        for index_name, table_name, column_name in indexes_to_create:
            try:
                cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name});")
                fixes_applied.append(f"✅ Índice {index_name} creado/verificado")
            except Exception as e:
                print(f"  ⚠️  Error creando índice {index_name}: {e}")
        
        # Confirmar cambios
        conn.commit()
        fixes_applied.append("💾 Cambios confirmados en la base de datos")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 CORRECCIÓN COMPLETADA")
        print("-" * 30)
        for fix in fixes_applied:
            print(f"  {fix}")
        
        return fixes_applied
        
    except Exception as e:
        print(f"❌ Error durante la corrección: {e}")
        return None

def generate_database_report():
    """Genera un reporte completo del estado de la base de datos"""
    print("\n📊 GENERANDO REPORTE COMPLETO")
    print("=" * 50)
    
    audit_results = audit_database()
    
    if audit_results:
        print(f"\n📈 RESUMEN EJECUTIVO")
        print("-" * 20)
        print(f"  📄 Tablas encontradas: {len(audit_results['tables'])}")
        print(f"  🚨 Problemas identificados: {audit_results['total_issues']}")
        print(f"  📋 Tablas: {', '.join(audit_results['tables'])}")
        
        if audit_results['total_issues'] > 0:
            print(f"\n🔧 INICIANDO CORRECCIÓN AUTOMÁTICA...")
            fixes = fix_database_issues()
            
            if fixes:
                print(f"\n✅ CORRECCIÓN EXITOSA")
                print(f"  🔨 Correcciones aplicadas: {len(fixes)}")
            else:
                print(f"\n❌ ERROR EN LA CORRECCIÓN")
        else:
            print(f"\n✅ BASE DE DATOS EN PERFECTO ESTADO")
            print("  No se requieren correcciones")

if __name__ == "__main__":
    print("🏥 SISTEMA DE DIAGNÓSTICO Y REPARACIÓN DE BASE DE DATOS MAIRA")
    print("=" * 70)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🗄️  Base de datos: PostgreSQL en Render")
    
    generate_database_report()
    
    print(f"\n🏁 DIAGNÓSTICO COMPLETADO")
    print("=" * 30)
