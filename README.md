# MAIRA - Sistema de Mapas Interactivos

MAIRA es un sistema de gestión de mapas interactivos con sistema de mini-tiles optimizado para la web.

## 🚀 Características

- **Sistema Mini-Tiles v3.0**: Tiles optimizados de <1.15MB para carga rápida
- **CDN Global**: Distribución mediante GitHub Releases + JSDelivr
- **División Provincial**: Cobertura de Argentina por regiones (Norte, Centro Norte, Centro, Patagonia, Sur)
- **Interfaz Web Responsiva**: Cliente HTML5 con controles interactivos
- **API Backend**: Servidor Flask con funcionalidades avanzadas

## 📁 Estructura del Proyecto

```
MAIRA_git/
├── Client/                    # Frontend web (HTML, CSS, JS, recursos)
├── Server/                    # Backend Flask y APIs
├── scripts/                   # Scripts principales de Python
│   ├── crear_mini_tiles.py   # Generador de mini-tiles
│   ├── servidor_demo.py      # Servidor de desarrollo con CORS
│   └── app.py               # Aplicación principal
├── tools/                     # Herramientas de deployment y configuración
├── dev-tools/                # Herramientas de desarrollo y testing
├── static/                   # Páginas HTML estáticas y demos
├── docs/                     # Documentación técnica
├── mini_tiles_github/        # Mini-tiles generados (97 archivos TAR)
├── indices/                  # Índices JSON por provincia
├── tiles_por_provincias/     # Tiles originales por provincia
└── external_storage/         # Almacenamiento externo
```

## 🛠️ Instalación

### Prerrequisitos
- Python 3.10+
- Node.js (para dependencias frontend)
- Rasterio (procesamiento geoespacial)

### Configuración del Entorno

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/MAIRA_git.git
cd MAIRA_git

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

## 🚀 Uso Rápido

### Servidor de Desarrollo

```bash
# Activar entorno virtual
source .venv/bin/activate

# Iniciar servidor con CORS habilitado
python scripts/servidor_demo.py

# Acceder a http://localhost:8000
```

### Aplicación Principal

```bash
# Ejecutar aplicación Flask principal
python scripts/app.py
```

### Generar Mini-Tiles

```bash
# Procesar todas las provincias y crear mini-tiles
python scripts/crear_mini_tiles.py
```

## 📊 Sistema Mini-Tiles v3.0

El sistema mini-tiles optimiza la distribución de mapas:

- **97 archivos TAR** de <1.15MB cada uno
- **9,501 tiles** individuales de 25km x 25km
- **Cobertura completa** de Argentina
- **Carga bajo demanda** con fallbacks automáticos

### URLs de Acceso

- **Primario**: GitHub Releases (`https://github.com/tu-usuario/MAIRA_git/releases/download/tiles-v3.0/`)
- **CDN**: JSDelivr (`https://cdn.jsdelivr.net/gh/tu-usuario/MAIRA_git@tiles-v3.0/`)
- **Local**: Servidor de desarrollo (`http://localhost:8000/`)

## 🗺️ División Geográfica

| Región | Archivos | Cobertura |
|--------|----------|-----------|
| Norte | 15 TAR | Jujuy, Salta, Formosa, Chaco |
| Centro Norte | 20 TAR | Tucumán, Santiago del Estero, Catamarca, La Rioja, San Juan, Mendoza |
| Centro | 25 TAR | Córdoba, Santa Fe, Entre Ríos, Buenos Aires, CABA |
| Patagonia | 20 TAR | La Pampa, Neuquén, Río Negro |
| Sur | 17 TAR | Chubut, Santa Cruz, Tierra del Fuego |

## 🔧 API Principal

### Endpoints Disponibles

```javascript
// Cargar tile específico
GET /api/tiles/{provincia}/{x}/{y}/{z}

// Obtener índice de provincia
GET /api/indices/{provincia}

// Listar regiones disponibles
GET /api/regiones

// Estado del sistema
GET /api/status
```

### Uso en JavaScript

```javascript
// Cargar sistema mini-tiles
import { MiniTilesLoader } from './mini_tiles_loader.js';

const loader = new MiniTilesLoader();

// Obtener tile
const tile = await loader.getTile('centro', 1234, 5678, 12);

// Precargar región
await loader.preloadRegion('patagonia');
```

## 🧪 Testing y Desarrollo

### Ejecutar Tests

```bash
# Tests automáticos
python dev-tools/test_runner_local.py

# Verificar URLs
python scripts/test_urls.py

# Test de conexión a base de datos
python dev-tools/test_db_connection.py
```

### Herramientas de Desarrollo

- `dev-tools/`: Scripts de testing y verificación
- `tools/`: Herramientas de deployment y configuración
- `static/`: Páginas de demo y documentación

## 📈 Monitoreo

### Estado del Sistema

Visita `/static/estado_sistema_maira.html` para:
- Estado de conectividad de tiles
- Rendimiento de carga
- Estadísticas de uso
- Logs del sistema

### Debugging

- Panel de debug: `/static/debug_console.html`
- Verificación post-deploy: `/static/verificacion_post_deploy.html`
- Tests integrales: `/static/test_integral_maira.html`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: Carpeta `docs/`
- **Issues**: GitHub Issues
- **Demos**: Carpeta `static/`

---

**Versión**: Mini-Tiles v3.0  
**Última actualización**: Enero 2025  
**Estado**: Producción - Desplegado en GitHub Releases
