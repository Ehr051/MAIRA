#!/bin/bash
# setup_internet_archive_storage.sh
# Configuración de almacenamiento gratuito usando Internet Archive

echo "🏛️ MAIRA - Configuración Internet Archive (Almacenamiento Gratuito Ilimitado)"
echo "=========================================================================="

# Verificar si tenemos internetarchive CLI
if ! command -v ia &> /dev/null; then
    echo "📦 Instalando Internet Archive CLI..."
    
    # Instalar via pip
    if command -v pip3 &> /dev/null; then
        pip3 install internetarchive
    elif command -v pip &> /dev/null; then
        pip install internetarchive
    else
        echo "❌ Error: pip no encontrado"
        echo "   Instale Python y pip primero"
        exit 1
    fi
fi

# Crear directorio de trabajo
mkdir -p internet_archive_prep
cd internet_archive_prep

echo ""
echo "📊 Preparando datos para Internet Archive..."

# Información de los datos
ORIGINAL_SIZE=$(du -sh ../Client/Libs/datos_argentina/ | cut -f1)
echo "- Tamaño original: $ORIGINAL_SIZE"

# Crear archivo de metadata para Internet Archive
cat > metadata.json << EOF
{
    "title": "MAIRA Geographic Tiles - Argentina",
    "description": "Geographic tiles for MAIRA military simulation system. Includes altimetry (SRTM) and vegetation (NDVI) data for Argentina territory.",
    "creator": "MAIRA Development Team",
    "subject": ["geographic", "tiles", "argentina", "altimetry", "vegetation", "SRTM", "NDVI"],
    "collection": "opensource_data",
    "mediatype": "data",
    "license": "Open Source",
    "language": "spa"
}
EOF

# Comprimir datos en chunks apropiados para IA
echo "📦 Comprimiendo altimetría..."
tar -czf maira_altimetria_tiles.tar.gz -C ../Client/Libs/datos_argentina Altimetria/

echo "📦 Comprimiendo vegetación..."
tar -czf maira_vegetacion_tiles.tar.gz -C ../Client/Libs/datos_argentina Vegetacion/

# Verificar tamaños
ALT_SIZE=$(du -h maira_altimetria_tiles.tar.gz | cut -f1)
VEG_SIZE=$(du -h maira_vegetacion_tiles.tar.gz | cut -f1)

echo "✅ Archivos preparados:"
echo "  - Altimetría: $ALT_SIZE"
echo "  - Vegetación: $VEG_SIZE"

# Crear script de subida
cat > upload_to_internet_archive.sh << 'EOF'
#!/bin/bash
# Upload to Internet Archive

echo "🏛️ Subiendo a Internet Archive..."

# Configurar credenciales (si no están configuradas)
if [ ! -f ~/.config/internetarchive/ia.ini ]; then
    echo "🔑 Configuración de credenciales necesaria"
    echo "1. Crear cuenta en archive.org"
    echo "2. Ejecutar: ia configure"
    echo "3. Luego ejecutar este script nuevamente"
    exit 1
fi

# Crear item en Internet Archive
ITEM_ID="maira-geographic-tiles-argentina"

echo "📤 Creando item: $ITEM_ID"
ia upload $ITEM_ID \
    maira_altimetria_tiles.tar.gz \
    maira_vegetacion_tiles.tar.gz \
    metadata.json \
    --metadata="title:MAIRA Geographic Tiles - Argentina" \
    --metadata="description:Geographic tiles for MAIRA military simulation - Argentina altimetry and vegetation data" \
    --metadata="subject:geographic;tiles;argentina;military;simulation"

if [ $? -eq 0 ]; then
    echo "✅ ¡Subida exitosa!"
    echo ""
    echo "🌐 URLs de acceso:"
    echo "- Item page: https://archive.org/details/$ITEM_ID"
    echo "- Altimetría: https://archive.org/download/$ITEM_ID/maira_altimetria_tiles.tar.gz"
    echo "- Vegetación: https://archive.org/download/$ITEM_ID/maira_vegetacion_tiles.tar.gz"
    echo ""
    echo "🔧 Configurar en external_tiles_adapter.js:"
    echo "current_provider: 'internet_archive'"
else
    echo "❌ Error en la subida"
    exit 1
fi
EOF

chmod +x upload_to_internet_archive.sh

# Crear configuración para el adaptador
cat > internet_archive_config.js << EOF
// Configuración para Internet Archive
const INTERNET_ARCHIVE_CONFIG = {
    item_id: 'maira-geographic-tiles-argentina',
    base_url: 'https://archive.org/download/maira-geographic-tiles-argentina',
    files: {
        altimetria: 'maira_altimetria_tiles.tar.gz',
        vegetacion: 'maira_vegetacion_tiles.tar.gz'
    },
    urls: {
        altimetria: 'https://archive.org/download/maira-geographic-tiles-argentina/maira_altimetria_tiles.tar.gz',
        vegetacion: 'https://archive.org/download/maira-geographic-tiles-argentina/maira_vegetacion_tiles.tar.gz'
    }
};

// Función para configurar el adaptador
function configureInternetArchiveStorage() {
    if (window.externalTilesAdapter) {
        // Actualizar configuración
        const config = window.externalTilesAdapter.getConfig();
        config.providers.internet_archive = {
            base_url: INTERNET_ARCHIVE_CONFIG.base_url,
            cdn_url: INTERNET_ARCHIVE_CONFIG.base_url,
            type: 'compressed_files'
        };
        
        // Cambiar a Internet Archive
        window.externalTilesAdapter.switchStorageProvider('internet_archive');
        
        console.log('✅ Configurado Internet Archive como proveedor de almacenamiento');
        console.log('🌐 Base URL:', INTERNET_ARCHIVE_CONFIG.base_url);
    }
}

// Auto-configurar cuando se carga
if (typeof window !== 'undefined') {
    window.INTERNET_ARCHIVE_CONFIG = INTERNET_ARCHIVE_CONFIG;
    window.configureInternetArchiveStorage = configureInternetArchiveStorage;
    
    // Si el adaptador ya está cargado, configurar inmediatamente
    if (window.externalTilesAdapter) {
        configureInternetArchiveStorage();
    }
    
    // Si no, configurar cuando se cargue
    window.addEventListener('externalTilesAdapterReady', configureInternetArchiveStorage);
}
EOF

echo ""
echo "🎯 RESUMEN DE CONFIGURACIÓN"
echo "=========================="
echo "- Archivos comprimidos listos"
echo "- Metadata para Internet Archive creada"
echo "- Scripts de subida preparados"
echo ""
echo "📁 Archivos en $(pwd):"
ls -lh *.tar.gz *.json *.js *.sh

echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "1. Instalar IA CLI: pip install internetarchive"
echo "2. Configurar credenciales: ia configure"
echo "3. Subir archivos: ./upload_to_internet_archive.sh"
echo "4. Cargar internet_archive_config.js en MAIRA"
echo ""
echo "💰 COSTO: ¡COMPLETAMENTE GRATUITO!"
echo "📊 VENTAJAS:"
echo "  ✅ Almacenamiento ilimitado"
echo "  ✅ Sin límites de ancho de banda"
echo "  ✅ URLs HTTP directas"
echo "  ✅ Permanente y confiable"

cd ..
