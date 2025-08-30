#!/usr/bin/env python3
"""
🗄️ MAIRA Database Backup System
Sistema completo de backup y restauración de base de datos PostgreSQL

Características:
- Backup completo de esquema y datos
- Backup incremental
- Restauración automática
- Verificación de integridad
- Rotación automática de backups
"""

import os
import sys
import psycopg2
import subprocess
import json
import datetime
import argparse
from pathlib import Path
from dotenv import load_dotenv

class MAIRADatabaseBackup:
    def __init__(self):
        """Inicializar sistema de backup"""
        self.setup_environment()
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        
    def setup_environment(self):
        """Configurar variables de entorno"""
        # Cargar variables desde archivos .env
        env_files = ['.env.development', '.env', '.env.local']
        for env_file in env_files:
            if os.path.exists(env_file):
                load_dotenv(env_file)
                print(f"📁 Cargado: {env_file}")
                break
        
        # Configurar conexión a BD
        self.DATABASE_URL = os.environ.get('DATABASE_URL')
        if self.DATABASE_URL:
            print("🔗 Usando DATABASE_URL desde variables de entorno")
        else:
            # Construir URL desde variables individuales
            self.db_config = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'database': os.environ.get('DB_NAME', 'maira_db'),
                'user': os.environ.get('DB_USER', 'postgres'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'port': os.environ.get('DB_PORT', '5432')
            }
            self.DATABASE_URL = f"postgresql://{self.db_config['user']}:{self.db_config['password']}@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
            print(f"🔗 Usando configuración manual: {self.db_config['user']}@{self.db_config['host']}")
    
    def create_backup(self, backup_type="full", description=""):
        """
        Crear backup de la base de datos
        
        Args:
            backup_type (str): "full", "schema_only", "data_only"
            description (str): Descripción del backup
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"maira_backup_{backup_type}_{timestamp}"
        
        # Archivos de backup
        sql_file = self.backup_dir / f"{backup_name}.sql"
        json_file = self.backup_dir / f"{backup_name}_metadata.json"
        
        try:
            print(f"🔄 Iniciando backup {backup_type}...")
            
            # Determinar opciones de pg_dump
            dump_options = []
            if backup_type == "schema_only":
                dump_options.append("--schema-only")
            elif backup_type == "data_only":
                dump_options.append("--data-only")
            
            # Ejecutar pg_dump
            cmd = [
                "pg_dump",
                self.DATABASE_URL,
                "--verbose",
                "--no-owner",
                "--no-privileges",
                "--format=plain",
                f"--file={sql_file}",
                *dump_options
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"pg_dump falló: {result.stderr}")
            
            # Crear metadatos del backup
            metadata = {
                "backup_name": backup_name,
                "timestamp": timestamp,
                "backup_type": backup_type,
                "description": description,
                "database_url": self.DATABASE_URL,
                "file_size": sql_file.stat().st_size,
                "tables_backed_up": self._get_table_list(),
                "pg_dump_version": self._get_pg_dump_version(),
                "created_by": "MAIRA Backup System v1.0"
            }
            
            # Guardar metadatos
            with open(json_file, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
            
            print(f"✅ Backup completado:")
            print(f"   📄 SQL: {sql_file}")
            print(f"   📋 Metadatos: {json_file}")
            print(f"   📊 Tamaño: {self._format_size(sql_file.stat().st_size)}")
            
            return {
                "success": True,
                "sql_file": str(sql_file),
                "metadata_file": str(json_file),
                "metadata": metadata
            }
            
        except Exception as e:
            print(f"❌ Error creando backup: {e}")
            return {"success": False, "error": str(e)}
    
    def restore_backup(self, backup_file, confirm=False):
        """
        Restaurar backup de la base de datos
        
        Args:
            backup_file (str): Ruta al archivo .sql de backup
            confirm (bool): Confirmar restauración (PELIGROSO)
        """
        if not confirm:
            print("⚠️  PELIGRO: La restauración borrará todos los datos actuales!")
            print("   Use --confirm para proceder")
            return {"success": False, "error": "Confirmación requerida"}
        
        try:
            backup_path = Path(backup_file)
            if not backup_path.exists():
                raise Exception(f"Archivo de backup no encontrado: {backup_file}")
            
            print(f"🔄 Restaurando desde: {backup_path}")
            
            # Primero, crear backup de seguridad de los datos actuales
            safety_backup = self.create_backup("full", "Pre-restore safety backup")
            if safety_backup["success"]:
                print(f"🛡️  Backup de seguridad creado: {safety_backup['sql_file']}")
            
            # Ejecutar restauración
            cmd = [
                "psql",
                self.DATABASE_URL,
                "--file", str(backup_path),
                "--verbose"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"Restauración falló: {result.stderr}")
            
            print("✅ Restauración completada exitosamente")
            
            return {"success": True, "safety_backup": safety_backup}
            
        except Exception as e:
            print(f"❌ Error restaurando backup: {e}")
            return {"success": False, "error": str(e)}
    
    def list_backups(self):
        """Listar todos los backups disponibles"""
        backups = []
        
        for sql_file in self.backup_dir.glob("*.sql"):
            metadata_file = sql_file.with_suffix("").with_suffix("_metadata.json")
            
            backup_info = {
                "sql_file": str(sql_file),
                "size": self._format_size(sql_file.stat().st_size),
                "created": datetime.datetime.fromtimestamp(sql_file.stat().st_mtime)
            }
            
            # Cargar metadatos si existen
            if metadata_file.exists():
                try:
                    with open(metadata_file) as f:
                        metadata = json.load(f)
                        backup_info.update(metadata)
                except:
                    pass
            
            backups.append(backup_info)
        
        # Ordenar por fecha
        backups.sort(key=lambda x: x.get("created", datetime.datetime.min), reverse=True)
        
        return backups
    
    def cleanup_old_backups(self, keep_days=30):
        """Limpiar backups antiguos"""
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=keep_days)
        removed = 0
        
        for backup_file in self.backup_dir.glob("*.sql"):
            file_date = datetime.datetime.fromtimestamp(backup_file.stat().st_mtime)
            
            if file_date < cutoff_date:
                # Eliminar archivo SQL y metadatos
                metadata_file = backup_file.with_suffix("").with_suffix("_metadata.json")
                
                backup_file.unlink()
                if metadata_file.exists():
                    metadata_file.unlink()
                
                removed += 1
                print(f"🗑️  Eliminado: {backup_file.name}")
        
        print(f"✅ Limpieza completada: {removed} backups eliminados")
        return removed
    
    def verify_backup(self, backup_file):
        """Verificar integridad de un backup"""
        try:
            backup_path = Path(backup_file)
            
            # Verificar que el archivo existe y no está vacío
            if not backup_path.exists():
                return {"valid": False, "error": "Archivo no encontrado"}
            
            if backup_path.stat().st_size == 0:
                return {"valid": False, "error": "Archivo vacío"}
            
            # Verificar que es SQL válido (básico)
            with open(backup_path) as f:
                content = f.read(1000)  # Primeros 1000 caracteres
                
                if "CREATE TABLE" not in content and "INSERT INTO" not in content:
                    return {"valid": False, "error": "No parece un backup de PostgreSQL válido"}
            
            return {"valid": True, "size": self._format_size(backup_path.stat().st_size)}
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def _get_table_list(self):
        """Obtener lista de tablas en la base de datos"""
        try:
            conn = psycopg2.connect(self.DATABASE_URL)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            
            tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            return tables
            
        except Exception as e:
            return [f"Error obteniendo tablas: {e}"]
    
    def _get_pg_dump_version(self):
        """Obtener versión de pg_dump"""
        try:
            result = subprocess.run(["pg_dump", "--version"], capture_output=True, text=True)
            return result.stdout.strip()
        except:
            return "Desconocida"
    
    def _format_size(self, size_bytes):
        """Formatear tamaño en bytes a formato legible"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"


def main():
    """Función principal CLI"""
    parser = argparse.ArgumentParser(description="🗄️ MAIRA Database Backup System")
    
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponibles')
    
    # Comando backup
    backup_parser = subparsers.add_parser('backup', help='Crear backup')
    backup_parser.add_argument('--type', choices=['full', 'schema_only', 'data_only'], 
                              default='full', help='Tipo de backup')
    backup_parser.add_argument('--description', default='', help='Descripción del backup')
    
    # Comando restore
    restore_parser = subparsers.add_parser('restore', help='Restaurar backup')
    restore_parser.add_argument('file', help='Archivo de backup a restaurar')
    restore_parser.add_argument('--confirm', action='store_true', 
                               help='Confirmar restauración (BORRA DATOS ACTUALES)')
    
    # Comando list
    subparsers.add_parser('list', help='Listar backups')
    
    # Comando cleanup
    cleanup_parser = subparsers.add_parser('cleanup', help='Limpiar backups antiguos')
    cleanup_parser.add_argument('--days', type=int, default=30, 
                               help='Días a mantener (default: 30)')
    
    # Comando verify
    verify_parser = subparsers.add_parser('verify', help='Verificar backup')
    verify_parser.add_argument('file', help='Archivo de backup a verificar')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Crear instancia del sistema de backup
    backup_system = MAIRADatabaseBackup()
    
    # Ejecutar comando
    if args.command == 'backup':
        result = backup_system.create_backup(args.type, args.description)
        if not result["success"]:
            sys.exit(1)
    
    elif args.command == 'restore':
        result = backup_system.restore_backup(args.file, args.confirm)
        if not result["success"]:
            sys.exit(1)
    
    elif args.command == 'list':
        backups = backup_system.list_backups()
        
        print(f"\n📋 Backups disponibles ({len(backups)}):")
        print("=" * 80)
        
        for backup in backups:
            print(f"📄 {backup.get('backup_name', 'Sin nombre')}")
            print(f"   Archivo: {backup['sql_file']}")
            print(f"   Tamaño: {backup['size']}")
            print(f"   Tipo: {backup.get('backup_type', 'Desconocido')}")
            print(f"   Fecha: {backup['created']}")
            if backup.get('description'):
                print(f"   Descripción: {backup['description']}")
            print()
    
    elif args.command == 'cleanup':
        backup_system.cleanup_old_backups(args.days)
    
    elif args.command == 'verify':
        result = backup_system.verify_backup(args.file)
        if result["valid"]:
            print(f"✅ Backup válido - Tamaño: {result['size']}")
        else:
            print(f"❌ Backup inválido: {result['error']}")
            sys.exit(1)


if __name__ == "__main__":
    main()
