#!/bin/bash
# BACKUP SIMPLE - SOLO BASE DE DATOS POSTGRESQL
# Fecha: 29 agosto 2025 - Antes del vencimiento 7 septiembre

echo "🗄️  BACKUP POSTGRESQL MAIRA"
echo "=========================="
echo ""

# Crear directorio de backup con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_db_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo "📁 Directorio: $BACKUP_DIR"
echo ""

# Solicitar DATABASE_URL
echo "🔗 Necesito la DATABASE_URL de PostgreSQL de Render"
echo "   (La encuentras en Render Dashboard > PostgreSQL > Info > External Database URL)"
echo ""
read -p "🔑 DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL requerida"
    exit 1
fi

echo ""
echo "⏳ Creando backup completo..."

# BACKUP COMPLETO usando pg_dump
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/maira_database_completo.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup creado: $BACKUP_DIR/maira_database_completo.sql"
    
    # Mostrar tamaño del archivo
    SIZE=$(ls -lh "$BACKUP_DIR/maira_database_completo.sql" | awk '{print $5}')
    echo "📊 Tamaño: $SIZE"
    
    # Crear script simple de restauración
    cat > "$BACKUP_DIR/restaurar.sh" << EOF
#!/bin/bash
# Restaurar base de datos MAIRA
echo "🔄 RESTAURANDO BASE DE DATOS MAIRA"
read -p "Nueva DATABASE_URL: " NEW_URL
psql "\$NEW_URL" < maira_database_completo.sql
echo "✅ Restauración completada"
EOF
    
    chmod +x "$BACKUP_DIR/restaurar.sh"
    
    # Crear archivo de información
    cat > "$BACKUP_DIR/README.txt" << EOF
BACKUP BASE DE DATOS MAIRA
=========================
Fecha: $(date)
Origen: Render.com PostgreSQL
Vencimiento: 7 septiembre 2025

ARCHIVOS:
- maira_database_completo.sql  -> Backup completo (estructura + datos)
- restaurar.sh                 -> Script de restauración automática
- README.txt                   -> Este archivo

COMO RESTAURAR:
1. Crear nueva base PostgreSQL
2. Ejecutar: ./restaurar.sh
3. Ingresar nueva DATABASE_URL cuando se solicite

RESTAURACIÓN MANUAL:
psql "nueva_database_url" < maira_database_completo.sql
EOF
    
    echo ""
    echo "📋 Archivos creados:"
    ls -la "$BACKUP_DIR"
    
    echo ""
    echo "🎉 BACKUP COMPLETADO"
    echo "📁 Ubicación: $(pwd)/$BACKUP_DIR"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - Guarda esta carpeta en lugar seguro"
    echo "   - Antes del 7 septiembre, crea nueva base PostgreSQL"
    echo "   - Usa restaurar.sh para migrar los datos"
    
else
    echo "❌ Error al crear backup"
    echo "   Verifica que pg_dump esté instalado:"
    echo "   brew install postgresql"
fi

echo ""
