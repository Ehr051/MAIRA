# 🚀 CONFIGURACIÓN RÁPIDA AWS S3 PARA TILES MAIRA

## 📋 Requisitos Previos
1. Cuenta AWS (capa gratuita disponible)
2. AWS CLI instalado
3. Acceso a los datos de tiles (6.3GB)

## ⚡ Setup Rápido (15 minutos)

### Paso 1: Crear Bucket S3
```bash
# Crear bucket (cambiar por nombre único)
aws s3 mb s3://maira-tiles-argentina --region us-east-1

# Configurar bucket como público para lectura
aws s3api put-bucket-cors --bucket maira-tiles-argentina --cors-configuration file://cors-config.json

# Aplicar política pública de lectura
aws s3api put-bucket-policy --bucket maira-tiles-argentina --policy file://bucket-policy.json
```

### Paso 2: Subir Datos
```bash
# Sync todos los datos (puede tardar 1-2 horas con 6.3GB)
aws s3 sync Client/Libs/datos_argentina/ s3://maira-tiles-argentina/ --acl public-read

# Verificar subida
aws s3 ls s3://maira-tiles-argentina/ --recursive --summarize
```

### Paso 3: Configurar CloudFront CDN (Opcional pero recomendado)
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## 📁 Archivos de Configuración Necesarios

### cors-config.json
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": [],
            "MaxAgeSeconds": 3600
        }
    ]
}
```

### bucket-policy.json
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::maira-tiles-argentina/*"
        }
    ]
}
```

## 🎯 URLs Resultantes
- **Bucket directo:** `https://maira-tiles-argentina.s3.amazonaws.com/`
- **CloudFront CDN:** `https://d1234567890.cloudfront.net/` (se genera automáticamente)

## 🔧 Actualizar MAIRA para usar S3

### 1. Modificar external_tiles_adapter.js
```javascript
// Cambiar configuración
current_provider: 'aws_s3'

// Actualizar URLs en providers.aws_s3
base_url: 'https://maira-tiles-argentina.s3.amazonaws.com',
cdn_url: 'https://d1234567890.cloudfront.net' // Tu CloudFront URL
```

### 2. Test de conectividad
```bash
# Verificar acceso directo
curl -I https://maira-tiles-argentina.s3.amazonaws.com/Altimetria/index_tiles_altimetria.json

# Verificar un tile específico
curl -I https://maira-tiles-argentina.s3.amazonaws.com/Altimetria/tiles/alt_-34_-58.tif
```

## 💰 Estimación de Costos Mensuales

### Escenario Típico (100 usuarios/día)
- **Almacenamiento (6.3GB):** $0.15/mes
- **Requests GET (30K/mes):** $0.12/mes  
- **Transferencia (50GB/mes):** $4.50/mes
- **CloudFront (opcional):** $2.00/mes
- **TOTAL:** ~$7/mes

### Escenario Alto Uso (1000 usuarios/día)
- **Almacenamiento:** $0.15/mes
- **Requests GET (300K/mes):** $1.20/mes
- **Transferencia (500GB/mes):** $45/mes
- **CloudFront:** $8/mes
- **TOTAL:** ~$55/mes

## 🔄 Alternativa Económica: GitHub LFS

### Pros
- $5/mes por 50GB de almacenamiento
- Integrado con repositorio
- CDN gratuito vía JSDelivr

### Contras
- Cuotas de ancho de banda
- Velocidad limitada
- No optimizado para tiles geográficas

## ⚠️ Migración Temporal

Mientras se configura S3, usar:
1. **GitHub Releases** para archivo comprimido de tiles
2. **Adaptador con fallback** local para desarrollo
3. **Cache agresivo** en navegador

## 🎯 Comandos de Setup Automático

```bash
# Ejecutar desde directorio MAIRA
./setup_aws_s3.sh
```

¿Quiere que cree el script automatizado para AWS S3 o prefiere explorar una alternativa más económica?
