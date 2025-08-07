#!/usr/bin/env python3
"""
Script para convertir backup MySQL de XAMPP a PostgreSQL para Render
"""

import re
import sys

def convert_mysql_to_postgresql(mysql_file, postgres_file):
    """
    Convierte un dump de MySQL a formato PostgreSQL
    """
    print("🔄 Convirtiendo MySQL → PostgreSQL...")
    
    with open(mysql_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Conversiones MySQL → PostgreSQL
    conversions = [
        # Comentarios y configuraciones MySQL específicas
        (r'\/\*!.*?\*\/;?', ''),  # Comentarios con directivas MySQL
        (r'SET SQL_MODE.*?;', ''),
        (r'START TRANSACTION;', ''),
        (r'SET time_zone.*?;', ''),
        (r'SET @OLD_.*?;', ''),
        (r'SET NAMES.*?;', ''),
        (r'LOCK TABLES.*?;', ''),
        (r'UNLOCK TABLES;', ''),
        
        # CURRENT_TIMESTAMP() → CURRENT_TIMESTAMP (sin paréntesis)
        (r'current_timestamp\(\)', 'CURRENT_TIMESTAMP'),
        (r'CURRENT_TIMESTAMP\(\)', 'CURRENT_TIMESTAMP'),
        (r'DEFAULT current_timestamp\(\)', 'DEFAULT CURRENT_TIMESTAMP'),
        
        # Tipos de datos específicos
        (r'AUTO_INCREMENT', 'SERIAL'),
        (r'TINYINT\(\d+\)', 'SMALLINT'),
        (r'INT\(\d+\)', 'INTEGER'),
        (r'BIGINT\(\d+\)', 'BIGINT'),
        (r'DECIMAL\((\d+),(\d+)\)', r'DECIMAL(\1,\2)'),
        (r'longTEXT', 'TEXT'),
        (r'LONGTEXT', 'TEXT'),
        (r'MEDIUMTEXT', 'TEXT'),
        (r'DATETIME', 'TIMESTAMP'),
        
        # ENUM types - convertir a VARCHAR con CHECK constraint
        (r"enum\('([^']+)','([^']+)','([^']+)'\)", r"VARCHAR(20) CHECK (\1 IN ('\1','\2','\3'))"),
        (r"enum\('([^']+)','([^']+)'\)", r"VARCHAR(20) CHECK (\1 IN ('\1','\2'))"),
        
        # JSON validation - remover json_valid checks
        (r'CHECK \(json_valid\([^)]+\)\)', ''),
        
        # ON UPDATE current_timestamp() - remover porque PostgreSQL no lo soporta así
        (r'ON UPDATE current_timestamp\(\)', ''),
        (r'ON UPDATE CURRENT_TIMESTAMP', ''),
        
        # COMMENT - remover comentarios de columnas
        (r"COMMENT '[^']*'", ''),
        (r'COMMENT "[^"]*"', ''),
        
        # ALTER TABLE modificaciones
        (r'ALTER TABLE ([^\s]+)\s+MODIFY', r'ALTER TABLE \1 ALTER COLUMN'),
        (r'SERIAL, SERIAL=\d+', 'SERIAL'),
        (r'ADD UNIQUE KEY', 'ADD CONSTRAINT'),
        (r'ADD KEY "[^"]+" \("([^"]+)"\)', r'CREATE INDEX ON \1 (\1)'),
        
        # Eliminar opciones de charset y collation
        (r'CHARACTER SET \w+', ''),
        (r'COLLATE \w+', ''),
        (r'DEFAULT CHARSET=\w+', ''),
        
        # ENGINE y otras opciones MySQL
        (r'ENGINE=\w+[^;]*', ''),
        
        # BOOLEAN
        (r'TINYINT\(1\)', 'BOOLEAN'),
        
        # Comillas invertidas → comillas normales (al final para no interferir)
        (r'`([^`]+)`', r'"\1"'),
        
        # Inserción de datos
        (r'INSERT INTO `([^`]+)`', r'INSERT INTO "\1"'),
        
        # Limpiar líneas vacías múltiples
        (r'\n\s*\n\s*\n', '\n\n'),
    ]
    
    # Aplicar conversiones
    for pattern, replacement in conversions:
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE | re.DOTALL)
    
    # Limpiar líneas vacías múltiples
    content = re.sub(r'\n\n+', '\n\n', content)
    
    # Escribir archivo convertido
    with open(postgres_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Conversión completada: {postgres_file}")
    return postgres_file

def main():
    if len(sys.argv) != 3:
        print("Uso: python convert_mysql_to_postgres.py archivo_mysql.sql archivo_postgres.sql")
        sys.exit(1)
    
    mysql_file = sys.argv[1]
    postgres_file = sys.argv[2]
    
    try:
        convert_mysql_to_postgresql(mysql_file, postgres_file)
        print("\n🎯 Próximos pasos:")
        print("1. Sube el archivo convertido a PostgreSQL")
        print("2. Configura las variables de entorno en Render")
        print("3. ¡Tu aplicación tendrá todos los datos!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
