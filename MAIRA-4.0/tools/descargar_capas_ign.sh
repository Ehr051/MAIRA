#!/bin/bash
#
# Script para descargar capas SIG prioritarias del IGN Argentina
# 
# Las URLs de descarga del IGN siguen un patrón predecible.
# Sin embargo, el IGN requiere aceptar términos de uso en la web.
#
# NOTA: Este script intenta descargar automáticamente, pero si falla,
#       deberás descargar manualmente desde:
#       https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG
#

set -e  # Exit on error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio de descarga
DOWNLOAD_DIR="$HOME/Downloads/IGN_Shapefiles"
mkdir -p "$DOWNLOAD_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   DESCARGA CAPAS SIG IGN ARGENTINA${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}📁 Directorio: $DOWNLOAD_DIR${NC}\n"

# URLs base del IGN (estas pueden cambiar, verificar en la web)
# El IGN usa un sistema de descarga que requiere aceptar términos
# Por eso, proporcionamos instrucciones manuales

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo -e "El IGN requiere aceptar términos de uso en su sitio web."
echo -e "No podemos descargar automáticamente sin violar sus términos.\n"

echo -e "${BLUE}📋 INSTRUCCIONES PARA DESCARGA MANUAL:${NC}\n"

echo -e "${GREEN}1. Abre tu navegador en:${NC}"
echo -e "   https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG\n"

echo -e "${GREEN}2. Busca y descarga las siguientes capas (haz clic en 'Descargar Capa'):${NC}\n"

echo -e "${YELLOW}   📍 TRANSPORTE (Tab 'Transporte'):${NC}"
echo -e "      ✓ Ruta nacional (Línea)"
echo -e "      ✓ Ruta provincial (Línea)"
echo -e "      ✓ Camino (Línea)"
echo -e "      ✓ Puente (Punto/Línea)\n"

echo -e "${YELLOW}   💧 HIDROGRAFÍA (Tab 'Hidrografía y oceanografía'):${NC}"
echo -e "      ✓ Curso de agua permanente (Línea)"
echo -e "      ✓ Espejo de agua permanente (Polígono)"
echo -e "      ✓ Humedal (Polígono)\n"

echo -e "${YELLOW}   🏙️  ÁREAS URBANAS (Tab 'Hábitat e infraestructura social'):${NC}"
echo -e "      ✓ Localidad simple (Polígono)"
echo -e "      ✓ Localidad compuesta (Polígono)\n"

echo -e "${GREEN}3. Guarda todos los ZIP descargados en:${NC}"
echo -e "   ${DOWNLOAD_DIR}\n"

echo -e "${GREEN}4. Descomprime todos los ZIP:${NC}"
read -p "   ¿Ya descargaste los archivos? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "\n${BLUE}📦 Descomprimiendo archivos...${NC}"
    
    cd "$DOWNLOAD_DIR"
    
    # Contar ZIPs
    zip_count=$(ls -1 *.zip 2>/dev/null | wc -l)
    
    if [ "$zip_count" -eq 0 ]; then
        echo -e "${RED}❌ No se encontraron archivos .zip en $DOWNLOAD_DIR${NC}"
        echo -e "${YELLOW}💡 Descarga primero los archivos desde la web del IGN${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Encontrados $zip_count archivos ZIP${NC}\n"
    
    # Descomprimir todos
    for zipfile in *.zip; do
        if [ -f "$zipfile" ]; then
            echo -e "  📦 Descomprimiendo: $zipfile"
            unzip -o "$zipfile" -d "${zipfile%.zip}/" 2>/dev/null || echo -e "${RED}    ⚠️  Error descomprimiendo $zipfile${NC}"
        fi
    done
    
    echo -e "\n${GREEN}✅ Descompresión completada${NC}"
    
    # Verificar archivos .shp
    shp_count=$(find . -name "*.shp" 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ Encontrados $shp_count archivos Shapefile (.shp)${NC}"
    
    echo -e "\n${BLUE}📊 Resumen de archivos:${NC}"
    find . -name "*.shp" -exec basename {} \; | sort
    
    echo -e "\n${GREEN}🎉 ¡Listo!${NC}"
    echo -e "${YELLOW}📍 Próximo paso:${NC}"
    echo -e "   cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0"
    echo -e "   python3 tools/convert_shapefiles_to_geojson.py"
    
else
    echo -e "\n${YELLOW}💡 Descarga los archivos desde la web del IGN y vuelve a ejecutar este script${NC}"
    exit 0
fi
