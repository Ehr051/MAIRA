#!/bin/bash
# BACKUP AUTOMÁTICO MAIRA PostgreSQL - 29 agosto 2025
# Este script crea un backup completo antes del vencimiento del 7 septiembre

echo "🔄 CREANDO BACKUP COMPLETO DE MAIRA PostgreSQL..."
echo "Fecha: $(date)"

# Crear directorio de backup
BACKUP_DIR="backup_maira_$(date +%Y%m%d_%H%M%S)_COMPLETO"
mkdir -p "$BACKUP_DIR"

echo "📁 Directorio creado: $BACKUP_DIR"

# Solicitar DATABASE_URL
echo ""
echo "🔗 Para crear el backup, necesito la DATABASE_URL de Render PostgreSQL"
echo "Puedes encontrarla en:"
echo "   1. Dashboard de Render.com"
echo "   2. Tu servicio PostgreSQL"
echo "   3. Pestaña 'Info'"
echo "   4. Campo 'External Database URL'"
echo ""
read -p "🔑 Ingresa la DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL requerida. Saliendo..."
    exit 1
fi

echo ""
echo "📊 Creando backup completo con pg_dump..."

# 1. DUMP COMPLETO (estructura + datos)
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/maira_completo.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup completo creado: $BACKUP_DIR/maira_completo.sql"
else
    echo "❌ Error al crear backup completo"
fi

# 2. DUMP SOLO ESTRUCTURA
pg_dump --schema-only "$DATABASE_URL" > "$BACKUP_DIR/maira_estructura.sql"

if [ $? -eq 0 ]; then
    echo "✅ Estructura creada: $BACKUP_DIR/maira_estructura.sql"
else
    echo "❌ Error al crear backup de estructura"
fi

# 3. DUMP SOLO DATOS
pg_dump --data-only "$DATABASE_URL" > "$BACKUP_DIR/maira_datos.sql"

if [ $? -eq 0 ]; then
    echo "✅ Datos creados: $BACKUP_DIR/maira_datos.sql"
else
    echo "❌ Error al crear backup de datos"
fi

# 4. BACKUP CUSTOM FORMAT (más eficiente)
pg_dump --format=custom "$DATABASE_URL" > "$BACKUP_DIR/maira_custom.backup"

if [ $? -eq 0 ]; then
    echo "✅ Backup custom creado: $BACKUP_DIR/maira_custom.backup"
else
    echo "❌ Error al crear backup custom"
fi

# 5. CREAR SCRIPT DE RESTAURACIÓN
cat > "$BACKUP_DIR/restaurar.sh" << 'EOF'
#!/bin/bash
# SCRIPT DE RESTAURACIÓN MAIRA
echo "🔄 RESTAURANDO BASE DE DATOS MAIRA"
echo "Elige una opción:"
echo "1) Restaurar completo (estructura + datos)"
echo "2) Restaurar solo estructura"
echo "3) Restaurar solo datos"
echo "4) Restaurar desde backup custom"
read -p "Opción [1-4]: " opcion

read -p "🔑 Nueva DATABASE_URL: " NEW_DATABASE_URL

case $opcion in
    1)
        echo "📥 Restaurando backup completo..."
        psql "$NEW_DATABASE_URL" < maira_completo.sql
        ;;
    2)
        echo "📥 Restaurando estructura..."
        psql "$NEW_DATABASE_URL" < maira_estructura.sql
        ;;
    3)
        echo "📥 Restaurando datos..."
        psql "$NEW_DATABASE_URL" < maira_datos.sql
        ;;
    4)
        echo "📥 Restaurando desde custom..."
        pg_restore --dbname="$NEW_DATABASE_URL" maira_custom.backup
        ;;
    *)
        echo "❌ Opción inválida"
        ;;
esac
EOF

chmod +x "$BACKUP_DIR/restaurar.sh"

# 6. CREAR INFORMACIÓN DEL BACKUP
cat > "$BACKUP_DIR/INFO.txt" << EOF
BACKUP COMPLETO MAIRA PostgreSQL
================================
Fecha: $(date)
Sistema: Render.com PostgreSQL
Vencimiento original: 7 septiembre 2025

ARCHIVOS INCLUIDOS:
- maira_completo.sql      -> Estructura + Datos completos
- maira_estructura.sql    -> Solo estructura de tablas
- maira_datos.sql         -> Solo datos
- maira_custom.backup     -> Formato custom PostgreSQL (más eficiente)
- restaurar.sh           -> Script de restauración automática

CÓMO RESTAURAR EN NUEVO SERVIDOR:
1. Crear nueva base PostgreSQL
2. Ejecutar: ./restaurar.sh
3. Seguir las instrucciones

ALTERNATIVA MANUAL:
psql "nueva_database_url" < maira_completo.sql

TAMAÑOS:
$(ls -lh *.sql *.backup 2>/dev/null | awk '{print $5 " - " $9}')
EOF

echo ""
echo "📋 Información del backup:"
cat "$BACKUP_DIR/INFO.txt"

echo ""
echo "🎉 BACKUP COMPLETO TERMINADO"
echo "📁 Ubicación: $BACKUP_DIR"
echo "📊 Archivos generados:"
ls -la "$BACKUP_DIR"

echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Guarda este directorio en lugar seguro"
echo "   - Antes del 7 septiembre, crea nuevo PostgreSQL"
echo "   - Ejecuta restaurar.sh en el nuevo servidor"
echo ""
