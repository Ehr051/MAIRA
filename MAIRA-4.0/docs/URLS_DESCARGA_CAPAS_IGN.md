# URLs de Descarga - Capas SIG IGN Argentina

**Fuente**: https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG  
**Formato**: Shapefile (ZIP)  
**Licencia**: Uso libre con atribución (verificar términos en sitio oficial)

---

## 🚨 IMPORTANTE

El IGN Argentina **NO permite descarga automática** sin aceptar términos de uso en su sitio web. Las URLs cambian periódicamente y requieren sesión en algunos casos.

**Método recomendado**: Descarga manual desde la web oficial.

---

## 📍 TRANSPORTE

### Ruta Nacional (Línea)
- **Tab**: Transporte
- **Búsqueda en página**: "Ruta nacional" + "Línea" + "Shapefile"
- **URL típica**: `https://www.ign.gob.ar/descargas/capas/transporte/ruta_nacional_linea.zip`
- **Peso aprox**: 2-3 MB comprimido

### Ruta Provincial (Línea)
- **Tab**: Transporte
- **Búsqueda**: "Ruta provincial" + "Línea"
- **Peso aprox**: 5-7 MB comprimido

### Camino (Línea)
- **Tab**: Transporte
- **Búsqueda**: "Camino" + "Línea"
- **Peso aprox**: 15-20 MB comprimido

### Puente (Punto/Línea)
- **Tab**: Transporte
- **Búsqueda**: "Puente"
- **Peso aprox**: 500 KB comprimido

---

## 💧 HIDROGRAFÍA Y OCEANOGRAFÍA

### Curso de Agua Permanente (Línea)
- **Tab**: Hidrografía y oceanografía
- **Búsqueda**: "Curso de agua permanente" + "Línea"
- **Peso aprox**: 40-50 MB comprimido

### Espejo de Agua Permanente (Polígono)
- **Tab**: Hidrografía y oceanografía
- **Búsqueda**: "Espejo de agua permanente" + "Polígono"
- **Peso aprox**: 20-25 MB comprimido

### Humedal (Polígono)
- **Tab**: Hidrografía y oceanografía
- **Búsqueda**: "Humedal" + "Polígono"
- **Peso aprox**: 8-10 MB comprimido

---

## 🏙️ HÁBITAT E INFRAESTRUCTURA SOCIAL

### Localidad Simple (Polígono)
- **Tab**: Hábitat e infraestructura social
- **Búsqueda**: "Localidad simple" + "Polígono"
- **Peso aprox**: 15-18 MB comprimido

### Localidad Compuesta (Polígono)
- **Tab**: Hábitat e infraestructura social
- **Búsqueda**: "Localidad compuesta" + "Polígono"
- **Peso aprox**: 5-7 MB comprimido

---

## 📥 PROCESO DE DESCARGA MANUAL

### Paso 1: Navegar al sitio
```
https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG
```

### Paso 2: Seleccionar Tab
Busca la pestaña correspondiente a cada categoría:
- **Transporte**
- **Hidrografía y oceanografía**
- **Hábitat e infraestructura social**

### Paso 3: Filtrar por tipo de geometría
Cada tab tiene una tabla con columnas:
- **Tipo** (Polígono, Línea, Punto)
- **Nombre**
- **Formato**
- **Descarga**

### Paso 4: Descargar
1. Busca la fila correspondiente en la tabla
2. Haz clic en el botón **"Descargar Capa"**
3. Acepta términos de uso (si aparece popup)
4. El archivo ZIP se descargará a tu carpeta de Descargas

### Paso 5: Mover a directorio trabajo
```bash
mkdir -p ~/Downloads/IGN_Shapefiles
mv ~/Downloads/*.zip ~/Downloads/IGN_Shapefiles/
```

### Paso 6: Descomprimir
```bash
cd ~/Downloads/IGN_Shapefiles
for f in *.zip; do unzip -o "$f" -d "${f%.zip}/"; done
```

---

## 🤖 INTENTO DE DESCARGA AUTOMÁTICA (Experimental)

**ADVERTENCIA**: Puede no funcionar si el IGN implementa protección CSRF o requiere login.

```bash
#!/bin/bash

# Directorio destino
DEST="$HOME/Downloads/IGN_Shapefiles"
mkdir -p "$DEST"

# Función para intentar descarga
download_layer() {
    local url="$1"
    local name="$2"
    
    echo "📥 Intentando descargar: $name"
    
    curl -L -o "$DEST/$name.zip" \
         -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" \
         -H "Accept: application/zip" \
         --fail \
         "$url" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Descargado: $name.zip"
    else
        echo "   ❌ Error descargando $name"
        echo "   💡 Descarga manualmente desde: https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG"
    fi
}

# NOTA: Las URLs exactas pueden variar. Verificar en el sitio oficial.

# Transporte
download_layer "https://www.ign.gob.ar/descargas/capas/transporte/ruta_nacional_linea.zip" "ruta_nacional"
download_layer "https://www.ign.gob.ar/descargas/capas/transporte/ruta_provincial_linea.zip" "ruta_provincial"
download_layer "https://www.ign.gob.ar/descargas/capas/transporte/camino_linea.zip" "camino"
download_layer "https://www.ign.gob.ar/descargas/capas/transporte/puente.zip" "puente"

# Hidrografía
download_layer "https://www.ign.gob.ar/descargas/capas/hidrografia/curso_agua_permanente_linea.zip" "curso_agua_permanente"
download_layer "https://www.ign.gob.ar/descargas/capas/hidrografia/espejo_agua_permanente_poligono.zip" "espejo_agua_permanente"
download_layer "https://www.ign.gob.ar/descargas/capas/hidrografia/humedal_poligono.zip" "humedal"

# Áreas urbanas
download_layer "https://www.ign.gob.ar/descargas/capas/habitat/localidad_simple_poligono.zip" "localidad_simple"
download_layer "https://www.ign.gob.ar/descargas/capas/habitat/localidad_compuesta_poligono.zip" "localidad_compuesta"

echo ""
echo "✅ Proceso completado"
echo "📁 Archivos en: $DEST"
```

---

## 🔗 ALTERNATIVA: Portal de Datos Abiertos

El IGN también publica datos en:
- **Datos Abiertos Argentina**: https://datos.gob.ar/
- **IDERA**: https://www.idera.gob.ar/

Buscar por "IGN" o "Instituto Geográfico Nacional".

---

## 📊 VERIFICACIÓN POST-DESCARGA

```bash
cd ~/Downloads/IGN_Shapefiles

# Contar archivos descargados
echo "📦 Archivos ZIP: $(ls -1 *.zip 2>/dev/null | wc -l)"

# Listar
ls -lh *.zip

# Descomprimir todos
for f in *.zip; do
    echo "📂 Descomprimiendo: $f"
    unzip -o "$f" -d "${f%.zip}/"
done

# Contar Shapefiles
echo "📊 Shapefiles (.shp): $(find . -name '*.shp' | wc -l)"

# Listar nombres
find . -name "*.shp" -exec basename {} \;
```

---

## 🎯 PESO TOTAL ESTIMADO

```
Comprimido:   ~100-120 MB
Descomprimido: ~250-300 MB
Convertido a GeoJSON: ~120-150 MB (con simplificación)
```

---

## 🚀 PRÓXIMO PASO

Una vez descargados y descomprimidos los Shapefiles:

```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
python3 tools/convert_shapefiles_to_geojson.py
```

El script buscará automáticamente los archivos en `~/Downloads/IGN_Shapefiles/` y los convertirá a GeoJSON optimizado.
