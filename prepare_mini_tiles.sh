#!/bin/bash

# 🔧 SCRIPT PARA PREPARAR MINI-TILES
# 
# Este script toma los tiles actuales y los re-corta en piezas más pequeñas
# compatibles con el límite de GitHub de 100MB

echo "🚀 PREPARANDO MINI-TILES PARA GITHUB"
echo "======================================"

# Configuración
BASE_DIR="/Users/mac/Documents/GitHub/MAIRA_git"
PROVINCIAS_DIR="$BASE_DIR/tiles_por_provincias"
OUTPUT_DIR="$BASE_DIR/mini_tiles_github"
TEMP_DIR="/tmp/maira_tiles_temp"

# Crear directorios
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "📁 Directorios:"
echo "   Provincias JSON: $PROVINCIAS_DIR"
echo "   Salida: $OUTPUT_DIR"
echo "   Temporal: $TEMP_DIR"
echo ""

# Verificar si tenemos los JSON de provincias
if [ ! -d "$PROVINCIAS_DIR" ]; then
    echo "❌ No se encontró directorio de provincias"
    exit 1
fi

# Contar archivos de altimetría
altimetria_count=$(find "$PROVINCIAS_DIR" -name "altimetria_*.json" | wc -l)
vegetacion_count=$(find "$PROVINCIAS_DIR" -name "vegetacion_*.json" | wc -l)

echo "📊 Archivos encontrados:"
echo "   🗻 Altimetría: $altimetria_count provincias"
echo "   🌿 Vegetación: $vegetacion_count provincias"
echo ""

# Función para estimar tamaño por provincia
estimar_tiles_por_provincia() {
    local json_file="$1"
    local provincia=$(basename "$json_file" .json | sed 's/altimetria_//')
    
    if [ -f "$json_file" ]; then
        local tile_count=$(jq '.tiles | length' "$json_file" 2>/dev/null || echo "0")
        echo "   📦 $provincia: $tile_count tiles"
        
        # Estimar cuántos mini-tiles serían necesarios (aprox 25-50 tiles por archivo)
        local estimated_files=$((($tile_count + 25) / 25))
        echo "      → Estimado: $estimated_files archivos TAR (~${estimated_files}x45MB = $((estimated_files * 45))MB total)"
    fi
}

echo "📈 Estimación de división:"
for json_file in "$PROVINCIAS_DIR"/altimetria_*.json; do
    if [ -f "$json_file" ]; then
        estimar_tiles_por_provincia "$json_file"
    fi
done

echo ""
echo "💡 ESTRATEGIA DE MINI-TILES:"
echo "   • Dividir cada provincia en archivos de ~45MB máximo"
echo "   • Cada archivo contendrá ~25-50 tiles individuales"
echo "   • Total estimado: ~20-30 archivos TAR para toda Argentina"
echo "   • Todos compatibles con GitHub (< 100MB)"

echo ""
echo "🔄 PASOS SIGUIENTES:"
echo "   1. Extraer tiles originales desde altimetria_tiles.tar.gz"
echo "   2. Ejecutar script de división por mini-tiles"
echo "   3. Crear Release tiles-v3.0 con archivos pequeños"
echo "   4. Actualizar sistema para cargar mini-tiles bajo demanda"

echo ""
echo "🚀 ¿Quieres continuar con la extracción de tiles originales?"
echo "   Esto creará archivos temporales para el procesamiento."

read -p "Continuar? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Buscando archivo altimetria_tiles.tar.gz..."
    
    # Buscar el archivo TAR original
    TAR_FILE=$(find . -name "altimetria_tiles.tar.gz" 2>/dev/null | head -1)
    
    if [ -n "$TAR_FILE" ]; then
        echo "✅ Encontrado: $TAR_FILE"
        echo "📦 Extrayendo en $TEMP_DIR..."
        
        tar -xzf "$TAR_FILE" -C "$TEMP_DIR" 2>/dev/null && \
        echo "✅ Extracción completada" || \
        echo "❌ Error en extracción"
        
        echo "📊 Archivos extraídos:"
        find "$TEMP_DIR" -name "*.tif" | wc -l | xargs echo "   TIF files:"
        
        echo ""
        echo "🎯 Ahora puedes ejecutar:"
        echo "   python3 crear_mini_tiles.py"
        echo "   (Modificar la ruta TIF en el script: $TEMP_DIR)"
        
    else
        echo "❌ No se encontró altimetria_tiles.tar.gz"
        echo "💡 Descárgalo desde GitHub Release tiles-v1.1:"
        echo "   wget https://github.com/Ehr051/MAIRA/releases/download/tiles-v1.1/altimetria_tiles.tar.gz"
    fi
else
    echo "⏸️  Operación cancelada"
fi

echo ""
echo "📋 RESUMEN:"
echo "   El sistema de mini-tiles solucionará el problema de tamaño"
echo "   permitiendo subir toda Argentina en archivos < 50MB cada uno"
echo "   ¡Tu aplicación podrá cargar solo las regiones necesarias!"
