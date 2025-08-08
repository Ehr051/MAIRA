#!/bin/bash
# prepare_free_storage.sh
# Prepara tiles para almacenamiento gratuito en GitHub Releases + JSDelivr CDN

echo "🆓 MAIRA - Preparación para Almacenamiento Gratuito"
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [ ! -d "Client/Libs/datos_argentina" ]; then
    echo "❌ Error: No se encontró el directorio de datos"
    echo "   Ejecute desde el directorio raíz de MAIRA"
    exit 1
fi

# Crear directorio de trabajo
mkdir -p free_storage_prep
cd free_storage_prep

echo "📊 Analizando datos originales..."
ORIGINAL_SIZE=$(du -sh ../Client/Libs/datos_argentina/ | cut -f1)
ALT_SIZE=$(du -sh ../Client/Libs/datos_argentina/Altimetria/ | cut -f1)
VEG_SIZE=$(du -sh ../Client/Libs/datos_argentina/Vegetacion/ | cut -f1)

echo "- Altimetría: $ALT_SIZE"
echo "- Vegetación: $VEG_SIZE"
echo "- Total original: $ORIGINAL_SIZE"

# Comprimir altimetría
echo ""
echo "📦 Comprimiendo datos de altimetría..."
tar -czf altimetria_tiles.tar.gz -C ../Client/Libs/datos_argentina Altimetria/ 2>/dev/null
if [ $? -eq 0 ]; then
    ALT_COMPRESSED=$(du -h altimetria_tiles.tar.gz | cut -f1)
    echo "✅ Altimetría comprimida: $ALT_COMPRESSED"
else
    echo "❌ Error comprimiendo altimetría"
    exit 1
fi

# Verificar tamaño de altimetría
ALT_SIZE_BYTES=$(stat -f%z altimetria_tiles.tar.gz 2>/dev/null || stat -c%s altimetria_tiles.tar.gz)
ALT_SIZE_GB=$(echo "scale=2; $ALT_SIZE_BYTES/1024/1024/1024" | bc)

if (( $(echo "$ALT_SIZE_GB > 2" | bc -l) )); then
    echo "⚠️ Altimetría muy grande ($ALT_SIZE_GB GB), dividiendo..."
    split -b 1500m altimetria_tiles.tar.gz altimetria_part_
    rm altimetria_tiles.tar.gz
    for file in altimetria_part_*; do
        mv "$file" "${file}.tar.gz"
    done
    echo "✅ Altimetría dividida en chunks"
else
    echo "✅ Altimetría OK para GitHub Releases ($ALT_SIZE_GB GB)"
fi

# Comprimir vegetación
echo ""
echo "📦 Comprimiendo datos de vegetación..."
echo "⏳ Esto puede tardar varios minutos..."

# Crear archivo temporal comprimido y dividirlo inmediatamente
tar -czf - -C ../Client/Libs/datos_argentina Vegetacion/ | split -b 1500m - vegetacion_part_

# Renombrar archivos
for file in vegetacion_part_*; do
    mv "$file" "${file}.tar.gz"
done

VEG_FILES=$(ls vegetacion_part_*.tar.gz | wc -l | tr -d ' ')
echo "✅ Vegetación dividida en $VEG_FILES chunks de 1.5GB"

# Copiar índices importantes
echo ""
echo "📋 Copiando índices JSON..."
mkdir -p indices
cp ../Client/Libs/datos_argentina/Altimetria/index_tiles_altimetria.json indices/ 2>/dev/null || echo "⚠️ Índice altimetría no encontrado"
cp ../Client/Libs/datos_argentina/Vegetacion/vegetacion_tile_index.json indices/ 2>/dev/null || echo "⚠️ Índice vegetación no encontrado"

# Crear manifest de archivos
echo ""
echo "📝 Creando manifest de archivos..."
cat > files_manifest.json << EOF
{
  "version": "1.0",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "description": "MAIRA Geographic Tiles for GitHub Releases",
  "original_size_gb": $(echo "scale=2; $(du -s ../Client/Libs/datos_argentina/ | cut -f1)/1024/1024" | bc),
  "files": {
    "altimetria": [
EOF

# Agregar archivos de altimetría al manifest
first_alt=true
for file in altimetria*.tar.gz; do
    if [ "$first_alt" = true ]; then
        first_alt=false
    else
        echo "," >> files_manifest.json
    fi
    SIZE=$(du -h "$file" | cut -f1)
    echo "      {\"filename\": \"$file\", \"size\": \"$SIZE\", \"type\": \"altimetria\"}" >> files_manifest.json
done

echo "    ]," >> files_manifest.json
echo "    \"vegetacion\": [" >> files_manifest.json

# Agregar archivos de vegetación al manifest
first_veg=true
for file in vegetacion*.tar.gz; do
    if [ "$first_veg" = true ]; then
        first_veg=false
    else
        echo "," >> files_manifest.json
    fi
    SIZE=$(du -h "$file" | cut -f1)
    echo "      {\"filename\": \"$file\", \"size\": \"$SIZE\", \"type\": \"vegetacion\"}" >> files_manifest.json
done

echo "    ]" >> files_manifest.json
echo "  }," >> files_manifest.json

# Agregar estadísticas
TOTAL_FILES=$(ls *.tar.gz | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh . | cut -f1)

cat >> files_manifest.json << EOF
  "statistics": {
    "total_files": $TOTAL_FILES,
    "total_compressed_size": "$TOTAL_SIZE",
    "compression_ratio": "~4:1"
  },
  "cdn_urls": {
    "base": "https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/",
    "altimetria": "https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/altimetria_tiles.tar.gz",
    "vegetacion_base": "https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/vegetacion_part_"
  }
}
EOF

echo "✅ Manifest creado: files_manifest.json"

# Crear script de subida a GitHub Releases
echo ""
echo "🚀 Creando script de subida..."
cat > upload_to_github_releases.sh << 'EOF'
#!/bin/bash
# upload_to_github_releases.sh
# Sube archivos a GitHub Releases usando GitHub CLI

echo "🚀 Subiendo tiles a GitHub Releases..."

# Verificar que GitHub CLI esté instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI no está instalado"
    echo "   Instalar con: brew install gh"
    echo "   O descargar desde: https://cli.github.com/"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ No está autenticado en GitHub"
    echo "   Ejecute: gh auth login"
    exit 1
fi

# Crear release
echo "📋 Creando release tiles-v1.0..."
gh release create tiles-v1.0 \
  --title "🗺️ MAIRA Geographic Tiles v1.0" \
  --notes "Tiles geográficas de Argentina para MAIRA
  
## Contenido
- 📏 Altimetría: Datos SRTM de elevación
- 🌿 Vegetación: Datos NDVI satelitales
- 📊 Total: 6.3GB comprimidos a ~1.5GB
- 🌐 CDN: Acceso automático vía JSDelivr

## URLs de Acceso
- Base CDN: https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/
- Manifest: https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/files_manifest.json

## Uso
Configurar external_tiles_adapter.js con provider 'github_releases'
" \
  --draft=false

# Subir todos los archivos
echo "📦 Subiendo archivos comprimidos..."
for file in *.tar.gz; do
    echo "⬆️ Subiendo $file..."
    gh release upload tiles-v1.0 "$file"
done

# Subir manifest e índices
echo "📋 Subiendo manifest e índices..."
gh release upload tiles-v1.0 files_manifest.json
if [ -d "indices" ]; then
    gh release upload tiles-v1.0 indices/*
fi

echo "✅ ¡Subida completada!"
echo ""
echo "🌐 URLs de acceso CDN:"
echo "- https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/files_manifest.json"
echo "- https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/altimetria_tiles.tar.gz"
echo "- https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/vegetacion_part_aa.tar.gz"
echo ""
echo "🔧 Próximo paso: Actualizar external_tiles_adapter.js"
EOF

chmod +x upload_to_github_releases.sh

# Resumen final
echo ""
echo "📊 RESUMEN DE PREPARACIÓN"
echo "========================"
echo "- Archivos originales: $ORIGINAL_SIZE"
echo "- Archivos comprimidos: $TOTAL_SIZE"
echo "- Total de chunks: $TOTAL_FILES"
echo "- Directorio: $(pwd)"
echo ""
echo "📁 Archivos preparados:"
ls -lh *.tar.gz

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Instalar GitHub CLI: brew install gh"
echo "2. Autenticar: gh auth login"
echo "3. Subir archivos: ./upload_to_github_releases.sh"
echo "4. Actualizar external_tiles_adapter.js"
echo ""
echo "✅ Preparación completada. Listo para almacenamiento gratuito!"

cd ..
