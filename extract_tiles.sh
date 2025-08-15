#!/bin/bash
# extract_tiles_to_original_structure.sh
# Extrae mini-tiles y las organiza en estructura original

echo "🗺️ Extrayendo tiles a estructura original..."

# Crear directorios si no existen
mkdir -p tiles/altimetria
mkdir -p tiles/vegetacion

# Contador de archivos procesados
total_tiles=0

# Procesar cada región
for region in mini_tiles_github/*/; do
    region_name=$(basename "$region")
    echo "📂 Procesando región: $region_name"
    
    # Procesar cada archivo TAR en la región
    for tar_file in "$region"*.tar.gz; do
        if [ -f "$tar_file" ]; then
            echo "📦 Extrayendo: $(basename "$tar_file")"
            
            # Extraer a directorio temporal
            temp_dir="/tmp/tiles_temp_$$"
            mkdir -p "$temp_dir"
            
            # Extraer TAR
            tar -xzf "$tar_file" -C "$temp_dir" 2>/dev/null
            
            # Mover tiles a estructura original
            if [ -d "$temp_dir" ]; then
                # Buscar archivos de tiles y moverlos
                find "$temp_dir" -name "*.png" -o -name "*.jpg" -o -name "*.tif" | while read tile_file; do
                    filename=$(basename "$tile_file")
                    
                    # Determinar si es altimetría o vegetación por el nombre
                    if echo "$filename" | grep -qi "alt\|elev\|height\|dem"; then
                        cp "$tile_file" tiles/altimetria/
                    elif echo "$filename" | grep -qi "veg\|green\|ndvi\|land"; then
                        cp "$tile_file" tiles/vegetacion/
                    else
                        # Si no está claro, copiar a ambos (serán pocos)
                        cp "$tile_file" tiles/altimetria/
                        cp "$tile_file" tiles/vegetacion/
                    fi
                    ((total_tiles++))
                done
            fi
            
            # Limpiar directorio temporal
            rm -rf "$temp_dir"
        fi
    done
done

echo "✅ Extracción completada!"
echo "📊 Total de tiles procesadas: $total_tiles"
echo "📁 Estructura:"
echo "   - tiles/altimetria/: $(ls tiles/altimetria 2>/dev/null | wc -l) archivos"
echo "   - tiles/vegetacion/: $(ls tiles/vegetacion 2>/dev/null | wc -l) archivos"
