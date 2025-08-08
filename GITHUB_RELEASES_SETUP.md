# 🚀 INSTRUCCIONES PASO A PASO: GitHub Releases para MAIRA

## ✅ Estado Actual
- ✅ Archivos comprimidos preparados (1.3GB total)
- ✅ GitHub CLI instalado
- ✅ Repositorio configurado
- ⏳ **SIGUIENTE:** Crear release y subir archivos

## 📦 Archivos Preparados
```
free_storage_prep/
├── altimetria_tiles.tar.gz     (199MB - Datos de elevación)
├── vegetacion_part_aa.tar.gz   (1.1GB - Datos de vegetación)
├── files_manifest.json         (Índice de archivos)
└── upload_to_github_releases.sh (Script automático)
```

## 🚀 MÉTODO 1: Automático (Recomendado)

### Paso 1: Autenticar GitHub CLI
```bash
# Abrir en navegador para autenticar
gh auth login --web
```

### Paso 2: Ejecutar script automático
```bash
cd free_storage_prep
./upload_to_github_releases.sh
```

## 🌐 MÉTODO 2: Manual (Si GitHub CLI falla)

### Paso 1: Ir a GitHub
1. Abrir: https://github.com/Ehr051/MAIRA/releases
2. Click "Create a new release"

### Paso 2: Configurar Release
- **Tag version:** `tiles-v1.0`
- **Release title:** `🗺️ MAIRA Geographic Tiles v1.0`
- **Description:**
```markdown
# 🗺️ MAIRA Geographic Tiles v1.0

Tiles geográficas de Argentina para el sistema MAIRA.

## 📊 Contenido
- 📏 **Altimetría:** Datos SRTM de elevación (199MB comprimido)
- 🌿 **Vegetación:** Datos NDVI satelitales (1.1GB comprimido)
- 📋 **Total original:** 6.3GB → 1.3GB comprimido
- 🌐 **CDN:** Acceso automático vía JSDelivr

## 🔗 URLs de Acceso CDN
- **Base:** https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/
- **Altimetría:** https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/altimetria_tiles.tar.gz
- **Vegetación:** https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/vegetacion_part_aa.tar.gz
- **Manifest:** https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/files_manifest.json

## 💻 Configuración
1. Configurar `external_tiles_adapter.js` con provider `github_releases_cdn`
2. Los archivos se descomprimen automáticamente según necesidad
3. Cache local para optimizar rendimiento
```

### Paso 3: Subir Archivos
- Arrastrar y soltar desde `free_storage_prep/`:
  - `altimetria_tiles.tar.gz`
  - `vegetacion_part_aa.tar.gz`
  - `files_manifest.json`

### Paso 4: Publicar Release
- Click "Publish release"

## ✅ URLs Resultantes

Una vez publicado, las tiles estarán disponibles en:

### URLs Directas GitHub
- https://github.com/Ehr051/MAIRA/releases/download/tiles-v1.0/altimetria_tiles.tar.gz
- https://github.com/Ehr051/MAIRA/releases/download/tiles-v1.0/vegetacion_part_aa.tar.gz

### URLs CDN JSDelivr (Más rápidas)
- https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/altimetria_tiles.tar.gz
- https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0/vegetacion_part_aa.tar.gz

## 🔧 Configuración Automática MAIRA

El `external_tiles_adapter.js` ya está configurado para usar GitHub Releases:

```javascript
current_provider: 'github_releases_cdn'
```

## ✅ Verificación

1. **Test URLs:** Verificar que los archivos se descarguen
2. **CDN:** Probar URLs de JSDelivr (pueden tardar 5-10 minutos en activarse)
3. **MAIRA:** Acceder a planeamiento.html y verificar carga de mapas

## 💡 Ventajas de esta Solución

- ✅ **Gratuito:** Sin costos
- ✅ **CDN Global:** JSDelivr CDN automático
- ✅ **Velocidad:** Cache en múltiples ubicaciones
- ✅ **Confiabilidad:** GitHub + JSDelivr son muy estables
- ✅ **Escalabilidad:** Sin límites de ancho de banda
- ✅ **Versionado:** Control de versiones de tiles

## 🚨 Próximo Paso

**¿Prefiere método automático o manual?**

- **Automático:** Ejecutar `gh auth login --web` y luego el script
- **Manual:** Seguir los pasos de interfaz web de GitHub
