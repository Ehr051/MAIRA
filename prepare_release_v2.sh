#!/bin/bash

# 🚀 SCRIPT PARA PREPARAR GITHUB RELEASE tiles-v2.0
# 
# Este script prepara los archivos de fajas para subir al nuevo release
# manteniendo los archivos bajo el límite de 100MB de GitHub

echo "🚀 Preparando GitHub Release tiles-v2.0 con Sistema de Fajas"
echo "============================================================"

# Crear directorio para el release
mkdir -p github_release_v2

# Copiar índices JSON (son pequeños)
echo "📋 Copiando índices JSON..."
cp tiles_por_fajas/*.json github_release_v2/
echo "✅ Índices copiados:"
ls -lh github_release_v2/*.json

echo ""
echo "📦 INSTRUCCIONES PARA COMPLETAR EL RELEASE:"
echo ""
echo "1. Ve a GitHub: https://github.com/Ehr051/MAIRA/releases"
echo "2. Crea un nuevo release con tag: tiles-v2.0"
echo "3. Sube los siguientes archivos desde github_release_v2/:"

echo ""
echo "📄 ARCHIVOS JSON (subir directamente):"
for file in github_release_v2/*.json; do
    size=$(du -h "$file" | cut -f1)
    echo "   - $(basename "$file") ($size)"
done

echo ""
echo "📦 ARCHIVOS TAR.GZ NECESARIOS (crear manualmente):"
echo "   Cada faja necesita su archivo TAR.GZ con los TIF correspondientes:"
echo ""
echo "   Para cada faja, crear:"
echo "   - altimetria_tiles_norte.tar.gz (con TIF de faja norte)"
echo "   - altimetria_tiles_centro_norte.tar.gz (con TIF de faja centro_norte)"
echo "   - altimetria_tiles_centro.tar.gz (con TIF de faja centro)"
echo "   - altimetria_tiles_sur.tar.gz (con TIF de faja sur)"
echo "   - altimetria_tiles_patagonia.tar.gz (con TIF de faja patagonia)"

echo ""
echo "💡 MÉTODO RECOMENDADO:"
echo "   1. Extraer el altimetria_tiles.tar.gz original"
echo "   2. Usar dividir_tiles_por_fajas.py con directorio de TIF"
echo "   3. Crear TAR.GZ separados por faja"
echo "   4. Verificar que cada archivo sea < 100MB"

echo ""
echo "🎯 RESULTADO ESPERADO:"
echo "   Release tiles-v2.0 con:"
echo "   - master_index_fajas.json (índice maestro)"
echo "   - 5 archivos JSON de fajas individuales"
echo "   - 5 archivos TAR.GZ de fajas (cada uno < 100MB)"

echo ""
echo "🔧 VENTAJAS DEL SISTEMA DE FAJAS:"
echo "   ✅ Archivos compatibles con límite GitHub (100MB)"
echo "   ✅ Carga bajo demanda según región"
echo "   ✅ Reducción significativa de transferencia"
echo "   ✅ Pre-carga inteligente de regiones"

echo ""
echo "📱 TESTING:"
echo "   Después del release, el sistema detectará automáticamente"
echo "   qué faja necesita según las coordenadas consultadas"
echo "   y solo descargará esa región específica."

echo ""
echo "🎉 ¡Listo para crear el release tiles-v2.0!"
