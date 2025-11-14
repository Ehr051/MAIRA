#!/bin/bash
# Script helper para instalar y extraer datos de BV8 con Wine
# Ejecutar después de instalar Wine

set -e  # Exit on error

echo "🍷 BV8 Installation Helper con Wine"
echo "===================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
BV8_BASE="/Users/mac/Downloads/Batalla Virtual 8 2019"
SERVIDOR_DATOS="$BV8_BASE/1 Componentes Base/Servidor de Datos 2019 rev 4.02.02.exe"
WINE_PREFIX="$HOME/.wine"
OUTPUT_DIR="$(pwd)/bv8_mysql_export"

# Verificar Wine instalado
echo -e "${BLUE}[1/7]${NC} Verificando Wine..."
if ! command -v wine &> /dev/null; then
    echo -e "${RED}✗ Wine no está instalado${NC}"
    echo "Instalar con: brew install --cask wine-stable"
    exit 1
fi

WINE_VERSION=$(wine --version)
echo -e "${GREEN}✓ Wine instalado: $WINE_VERSION${NC}"
echo ""

# Verificar instalador existe
echo -e "${BLUE}[2/7]${NC} Verificando instalador BV8..."
if [ ! -f "$SERVIDOR_DATOS" ]; then
    echo -e "${RED}✗ Instalador no encontrado:${NC}"
    echo "  $SERVIDOR_DATOS"
    exit 1
fi

FILE_SIZE=$(du -h "$SERVIDOR_DATOS" | cut -f1)
echo -e "${GREEN}✓ Instalador encontrado ($FILE_SIZE)${NC}"
echo ""

# Preparar Wine environment
echo -e "${BLUE}[3/7]${NC} Preparando ambiente Wine..."
if [ ! -d "$WINE_PREFIX" ]; then
    echo "Inicializando Wine prefix..."
    WINEARCH=win32 WINEPREFIX="$WINE_PREFIX" wineboot --init
    echo -e "${GREEN}✓ Wine prefix creado${NC}"
else
    echo -e "${GREEN}✓ Wine prefix existente${NC}"
fi
echo ""

# Instalar BV8 Servidor de Datos
echo -e "${BLUE}[4/7]${NC} Instalando BV8 Servidor de Datos..."
echo -e "${YELLOW}⚠️  Se abrirá instalador Windows${NC}"
echo "   Usar clave de instalación cuando se solicite"
echo ""
echo "Ejecutando instalador..."

# Ejecutar instalador
wine "$SERVIDOR_DATOS"

# Esperar a que termine
echo ""
echo -e "${YELLOW}→ Presiona ENTER cuando la instalación haya finalizado...${NC}"
read

echo -e "${GREEN}✓ Instalación completada${NC}"
echo ""

# Buscar archivos MySQL
echo -e "${BLUE}[5/7]${NC} Buscando archivos MySQL..."

# Buscar en Wine prefix
MYSQL_DIRS=$(find "$WINE_PREFIX/drive_c" -type d -iname "*mysql*" 2>/dev/null || true)

if [ -z "$MYSQL_DIRS" ]; then
    echo -e "${YELLOW}⚠️  No se encontraron directorios MySQL automáticamente${NC}"
    echo "Buscando archivos de tablas..."
    
    # Buscar archivos .frm (tablas MySQL)
    FRM_FILES=$(find "$WINE_PREFIX/drive_c" -name "*.frm" 2>/dev/null | head -5)
    
    if [ -n "$FRM_FILES" ]; then
        echo -e "${GREEN}✓ Archivos de tablas encontrados:${NC}"
        echo "$FRM_FILES"
    else
        echo -e "${RED}✗ No se encontraron archivos MySQL${NC}"
        echo "Posibles causas:"
        echo "  - Instalación incompleta"
        echo "  - MySQL no se instaló"
        echo "  - Archivos en ubicación no estándar"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Directorios MySQL encontrados:${NC}"
    echo "$MYSQL_DIRS"
fi
echo ""

# Listar tablas encontradas
echo -e "${BLUE}[6/7]${NC} Analizando tablas MySQL..."

FRM_COUNT=$(find "$WINE_PREFIX/drive_c" -name "*.frm" 2>/dev/null | wc -l)
MYD_COUNT=$(find "$WINE_PREFIX/drive_c" -name "*.MYD" 2>/dev/null | wc -l)
MYI_COUNT=$(find "$WINE_PREFIX/drive_c" -name "*.MYI" 2>/dev/null | wc -l)

echo "Archivos encontrados:"
echo "  - .frm (estructura): $FRM_COUNT"
echo "  - .MYD (datos): $MYD_COUNT"
echo "  - .MYI (índices): $MYI_COUNT"
echo ""

# Crear directorio de exportación
echo -e "${BLUE}[7/7]${NC} Preparando exportación..."

mkdir -p "$OUTPUT_DIR"

# Copiar archivos MySQL
echo "Copiando archivos a: $OUTPUT_DIR"

# Buscar directorio data de MySQL
DATA_DIR=$(find "$WINE_PREFIX/drive_c" -type d -path "*/mysql/data" 2>/dev/null | head -1)

if [ -n "$DATA_DIR" ]; then
    echo -e "${GREEN}✓ Directorio data encontrado:${NC} $DATA_DIR"
    
    # Copiar todo el directorio data
    cp -r "$DATA_DIR" "$OUTPUT_DIR/"
    
    echo -e "${GREEN}✓ Archivos copiados${NC}"
else
    echo -e "${YELLOW}⚠️  Directorio data no encontrado, copiando archivos individualmente...${NC}"
    
    # Copiar archivos uno por uno
    find "$WINE_PREFIX/drive_c" -name "*.frm" -o -name "*.MYD" -o -name "*.MYI" | while read file; do
        cp "$file" "$OUTPUT_DIR/"
    done
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Archivos MySQL exportados a:"
echo "  $OUTPUT_DIR"
echo ""
echo "Próximos pasos:"
echo "  1. Instalar MySQL 5.7 en Mac: brew install mysql@5.7"
echo "  2. Importar tablas BV8"
echo "  3. Exportar dump SQL"
echo ""
echo "Ver instrucciones detalladas en:"
echo "  tools/reverse_engineering/WINE_GUIDE.md"
echo ""
