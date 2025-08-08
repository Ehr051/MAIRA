# 🗄️ PLAN DE MIGRACIÓN DE DATOS GEOGRÁFICOS

## 📊 Situación Actual
- **Total de datos:** 6.3GB
- **Archivos TIF:** 5,514 archivos
- **Altimetría:** 1.6GB (2,565 tiles SRTM)
- **Vegetación:** 4.8GB (2,949 tiles NDVI)
- **Problema:** GitHub limita a 100MB por archivo, Render tiene límites de almacenamiento

## 🎯 Soluciones Propuestas

### 1. **AWS S3 (Recomendado) 💰 $5-10/mes**
```
Ventajas:
✅ CDN global con CloudFront
✅ Acceso directo desde Render
✅ Escalable y confiable
✅ Costos predecibles

Configuración:
- Bucket público para tiles
- CloudFront para cache global
- CORS configurado para acceso web
```

### 2. **Google Cloud Storage 💰 $8-12/mes**
```
Ventajas:
✅ Integración con Google Drive
✅ CDN global incluido
✅ Buena velocidad

Configuración:
- Bucket público
- CDN automático
- Acceso directo HTTP
```

### 3. **GitHub LFS + CDN Externo 💰 $5/mes**
```
Ventajas:
✅ Mantiene estructura en GitHub
✅ CDN mediante JSDelivr/unpkg

Limitaciones:
⚠️ GitHub LFS tiene cuotas
⚠️ Puede ser más lento
```

### 4. **Render Static Files + External Storage 💰 Gratis**
```
Ventajas:
✅ Usar Render como proxy
✅ Almacenamiento en Dropbox/Drive público

Limitaciones:
⚠️ Más complejo de mantener
⚠️ Dependiente de servicios gratuitos
```

## 🚀 Implementación Recomendada: AWS S3

### Paso 1: Estructura de URLs
```
https://maira-tiles.s3.amazonaws.com/
├── altimetria/
│   ├── index_tiles_altimetria.json
│   └── tiles/
│       ├── alt_-34_-58.tif
│       └── ...
└── vegetacion/
    ├── vegetacion_tile_index.json
    └── tiles/
        ├── ndvi_-34_-58.json
        └── ...
```

### Paso 2: Modificar Handlers
```javascript
// Nuevas URLs base
const TILES_BASE_URL = 'https://maira-tiles.s3.amazonaws.com';
const ALTIMETRIA_URL = `${TILES_BASE_URL}/altimetria`;
const VEGETACION_URL = `${TILES_BASE_URL}/vegetacion`;
```

### Paso 3: Upload Script
```bash
aws s3 sync Client/Libs/datos_argentina/ s3://maira-tiles/ --public-read
```

## 💡 Solución Inmediata: GitHub Releases

### Ventaja Temporal
- Subir como .zip en GitHub Releases
- Descargar dinámicamente cuando sea necesario
- Mantener estructura local para desarrollo

## 🔧 Plan de Acción

1. **Inmediato:** Crear configuración AWS S3
2. **Migrar:** Subir tiles a S3 con estructura organizada
3. **Actualizar:** Modificar handlers para usar URLs externas
4. **Optimizar:** Implementar cache y compresión
5. **Testing:** Verificar funcionalidad completa

## 💰 Estimación de Costos

### AWS S3 (6.3GB)
- **Almacenamiento:** ~$0.15/mes
- **Transferencia:** ~$5-10/mes (dependiendo uso)
- **CloudFront:** ~$2-5/mes
- **Total:** ~$7-15/mes

### Alternativa Económica
- **GitHub LFS:** $5/mes (50GB)
- **CDN gratuito:** JSDelivr
- **Total:** $5/mes

## 🎯 Próximos Pasos
1. ¿Prefiere AWS S3 o alguna alternativa?
2. ¿Cuenta con acceso a AWS/Google Cloud?
3. ¿Presupuesto máximo mensual para almacenamiento?
