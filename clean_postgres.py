#!/usr/bin/env python3
"""
Script para limpiar el archivo SQL convertido y hacerlo compatible con PostgreSQL
"""
import re
import sys

def clean_postgresql_sql(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remover secciones problemáticas completas
    patterns_to_remove = [
        # Remover todas las líneas ALTER TABLE con problemas
        r'ALTER TABLE.*?ADD KEY.*?;',
        r'ALTER TABLE.*?MODIFY.*?;',
        r'ALTER TABLE.*?ADD UNIQUE KEY.*?;',
        
        # Remover COMMIT sin transacción
        r'COMMIT;',
        
        # Remover referencias a tablas que fallan
        r'ALTER TABLE.*?FOREIGN KEY.*?;',
    ]
    
    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content, flags=re.MULTILINE | re.DOTALL)
    
    # Correcciones específicas
    fixes = [
        # Arreglar tipos ENUM
        (r"enum\('esperando','en_curso','finalizada'\)", "VARCHAR(20) CHECK (estado IN ('esperando','en_curso','finalizada'))"),
        (r"enum\('pendiente','aceptada','rechazada'\)", "VARCHAR(20) CHECK (estado IN ('pendiente','aceptada','rechazada'))"),
        
        # Remover CHECK json_valid
        (r'CHECK \(json_valid\([^)]+\)\)', ''),
        
        # Remover COMMENT
        (r"COMMENT '[^']*'", ''),
        
        # Arreglar ON UPDATE
        (r'ON UPDATE CURRENT_TIMESTAMP', ''),
        
        # Limpiar espacios extra
        (r'\n\s*\n\s*\n', '\n\n'),
        (r',\s*\)', ')'),
    ]
    
    for pattern, replacement in fixes:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Escribir archivo limpio
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Archivo limpiado guardado en: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python clean_postgres.py input.sql output.sql")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    clean_postgresql_sql(input_file, output_file)
