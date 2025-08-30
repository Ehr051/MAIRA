# MAIRA - Sistema de Mapas Interactivos y Gestión de Batalla

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Mini-tiles](https://img.shields.io/badge/Mini--tiles-v3.0-success)](https://github.com/Ehr051/MAIRA/releases/tag/tiles-v3.0)
[![Deployment](https://img.shields.io/badge/Deploy-Render.com-purple)](https://maira-3e76.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)

MAIRA es un sistema avanzado de mapas interactivos con capacidades de gestión de batalla, análisis de terreno y simulación táctica en tiempo real.

## 🎯 Características Principales

### 🗺️ **Sistema de Mapas Avanzado**
- **Mini-tiles v3.0**: 97 archivos optimizados de <1.15MB cada uno
- **Cobertura completa de Argentina**: 9,501 tiles de 25km × 25km
- **CDN Global**: GitHub Releases + JSDelivr para distribución mundial
- **Carga inteligente**: Sistema de caching y pre-carga bajo demanda

### ⚔️ **Gestión de Batalla en Tiempo Real**
- **Partidas multijugador**: Socket.IO para comunicación en tiempo real
- **Modo local y online**: Flexibilidad total de juego
- **Gestión de turnos**: Sistema completo de turnos con temporizadores
- **Chat integrado**: Comunicación entre jugadores durante las partidas
- **Salas de espera**: Sistema de lobbies para organizar partidas

### 📊 **Análisis de Terreno**
- **Datos de elevación**: Información altimétrica detallada
- **Análisis de vegetación**: Cobertura vegetal y características del terreno
- **Perfiles de elevación**: Gráficos D3.js para análisis vertical
- **Herramientas de medición**: Distancias, áreas y perfiles

### 🎮 **Interfaz Interactiva**
- **Responsive design**: Optimizada para desktop y dispositivos móviles
- **Panel lateral dinámico**: Gestión de elementos y herramientas
- **MiRadial menu**: Sistema de menús contextuales avanzado
- **Símbolos militares**: Biblioteca completa de simbología táctica

## � Instalación y Configuración

### Prerrequisitos
```bash
# Software requerido
Python 3.10+
Node.js 18+
Git
```

### Configuración Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/Ehr051/MAIRA.git
cd MAIRA

# 2. Configurar entorno Python
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Instalar dependencias Node.js
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### Ejecución Local

```bash
# Servidor de desarrollo con CORS
python scripts/servidor_demo.py
# Acceso: http://localhost:8000

# Aplicación Flask completa
python app.py
# Acceso: http://localhost:5000

# Servidor Node.js (alternativo)
npm start
# Acceso: http://localhost:8080
```

## 🌐 Deployment en Producción

### Render.com (Recomendado)

MAIRA está optimizado para deployment automático en Render.com:

```yaml
# render.yaml incluido - deployment automático
services:
  - type: web
    name: maira-server
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: PYTHON_VERSION
        value: 3.10.6
```

**Ver**: [DEPLOYMENT_RENDER.md](DEPLOYMENT_RENDER.md) para instrucciones completas.

### Variables de Entorno Requeridas

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@host:port/db

# Configuración del servidor
PORT=10000
FLASK_ENV=production
SECRET_KEY=tu-clave-secreta-aqui

# Socket.IO (opcional - para configuración avanzada)
CORS_ORIGINS=*
SOCKETIO_TRANSPORT=polling
```

## 📁 Estructura del Proyecto

```
MAIRA/
├── 📄 README.md                    # Documentación principal
├── 🌐 app.py                       # Aplicación Flask principal
├── ⚙️ requirements.txt             # Dependencias Python
├── 📦 package.json                 # Dependencias Node.js
├── 🔧 render.yaml                  # Configuración deployment
├── 📁 Client/                      # Frontend completo
│   ├── 🎨 css/                     # Estilos CSS
│   ├── ⚡ js/                      # JavaScript modules
│   ├── 🖼️ image/                   # Recursos gráficos
│   ├── 🔊 audio/                   # Efectos de sonido
│   ├── 📚 Libs/                    # Librerías externas
│   └── 📤 uploads/                 # Archivos subidos
├── 🖥️ Server/                      # Backend Python
│   ├── 🔌 socketio_handlers.py    # Manejadores Socket.IO
│   ├── 🎮 game_manager.py          # Lógica de juego
│   └── 🗄️ database.py             # Gestión de base de datos
├── 🗂️ static/                      # Páginas estáticas
│   ├── 🎯 iniciarpartida.html      # Lobby de partidas
│   ├── ⚔️ gestionbatalla.html      # Interfaz de batalla
│   └── 🧪 test_*.html              # Páginas de testing
├── 🗺️ mini_tiles_github/           # Sistema mini-tiles
├── 📊 indices/                     # Índices JSON provinciales
├── 🔧 scripts/                     # Scripts Python
├── 🛠️ dev-tools/                   # Herramientas desarrollo
└── 📚 docs/                        # Documentación técnica
```

## 🎮 Modos de Juego

### 🏠 Modo Local
- **Sin conexión**: Juega sin internet
- **Un jugador**: Perfecto para entrenamiento
- **Datos persistentes**: Se guardan en localStorage
- **Inicio rápido**: Sin configuración de servidor

### 🌐 Modo Online
- **Multijugador**: Hasta 8 jugadores por partida
- **Tiempo real**: Socket.IO para sincronización
- **Salas de espera**: Sistema de lobbies completo
- **Chat integrado**: Comunicación durante partidas

## 🔧 API y Endpoints

### Endpoints Principales

```javascript
// 🗺️ Sistema de Tiles
GET /api/tiles/{provincia}/{x}/{y}/{z}          // Obtener tile específico
GET /api/indices/{provincia}                    // Índice provincial
GET /mini_tiles_github/{provincia}_tiles.tar   // Archivo TAR completo

// 🎮 Gestión de Partidas
POST /api/partidas/crear                        // Crear nueva partida
POST /api/partidas/unirse                       // Unirse a partida
GET /api/partidas/lista                         // Listar partidas activas

// 👤 Gestión de Usuarios
POST /api/auth/login                            // Autenticación
POST /api/auth/register                         // Registro
GET /api/user/profile                           // Perfil de usuario

// 📊 Datos del Sistema
GET /api/status                                 // Estado del sistema
GET /api/health                                 // Health check
```

### Uso en JavaScript

```javascript
// Cargar sistema de tiles
import { MiniTilesLoader } from './Client/js/mini_tiles_loader.js';

const loader = new MiniTilesLoader();
const tile = await loader.getTile('centro', 1234, 5678, 12);

// Gestión de partidas
import { GestionPartidas } from './Client/js/partidas.js';

const partidas = new GestionPartidas();
await partidas.crearPartida({
    nombre: 'Mi Partida',
    duracion: 30,
    objetivo: 'Capturar la bandera'
});

// Socket.IO para tiempo real
import io from 'socket.io-client';

const socket = io('https://maira-3e76.onrender.com');
socket.emit('unirseAPartida', { codigo: 'ABC123' });
```

## 🧪 Testing y Calidad

### Ejecutar Tests

```bash
# Tests automáticos completos
python dev-tools/test_runner_local.py

# Verificar URLs y conectividad
python scripts/test_urls.py

# Test base de datos
python dev-tools/test_db_connection.py

# Tests del frontend
npm test
```

### Páginas de Testing Incluidas

- **🧪 test_integral_maira.html**: Tests completos del sistema
- **🔍 debug_console.html**: Consola de debugging avanzada
- **📊 estado_sistema_maira.html**: Monitoreo del sistema
- **✅ verificacion_post_deploy.html**: Verificación post-deployment

## 📊 Monitoreo y Analytics

### Dashboard de Sistema
Accede a `/static/estado_sistema_maira.html` para:
- ✅ Estado de conectividad de tiles
- ⚡ Métricas de rendimiento 
- 📈 Estadísticas de uso
- 🔍 Logs del sistema en tiempo real

### Debugging Avanzado
- **Panel debug**: `/static/debug_console.html`
- **Logs detallados**: Consola del navegador
- **Métricas Socket.IO**: Panel de conexiones
- **Performance profiling**: DevTools integration

## 🔒 Seguridad

### Medidas Implementadas
- ✅ **CORS configurado**: Orígenes permitidos específicos
- ✅ **Sanitización de datos**: Validación en cliente y servidor
- ✅ **Rate limiting**: Prevención de abuso de API
- ✅ **Autenticación JWT**: Tokens seguros para sesiones
- ✅ **HTTPS enforced**: Comunicaciones encriptadas

### Variables Sensibles
```bash
# Nunca incluir en el repositorio
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
```

## 🤝 Contribución

### Proceso de Contribución
1. **Fork** el repositorio
2. **Crea rama**: `git checkout -b feature/nueva-funcionalidad`
3. **Desarrolla**: Implementa tu funcionalidad
4. **Tests**: Ejecuta tests y verifica que pasen
5. **Commit**: `git commit -am 'Agregar nueva funcionalidad'`
6. **Push**: `git push origin feature/nueva-funcionalidad`
7. **Pull Request**: Crea PR con descripción detallada

### Estándares de Código
- **Python**: PEP 8 compliance
- **JavaScript**: ES6+ features
- **Comentarios**: Documentación clara en español
- **Tests**: Coverage mínimo 80%

## 📈 Roadmap

### 🔥 Próximas Características
- [ ] **IA Táctica**: Asistente de decisiones con ML
- [ ] **Realidad Aumentada**: Integración con dispositivos AR
- [ ] **Análisis Predictivo**: Simulaciones meteorológicas
- [ ] **API REST completa**: Endpoints para terceros
- [ ] **Mobile Apps**: Aplicaciones nativas iOS/Android

### 🐛 Issues Conocidos
- Socket.IO puede desconectarse en redes inestables
- Algunos navegadores requieren HTTPS para geolocalización
- Performance en dispositivos con <4GB RAM

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver [LICENSE](LICENSE) para detalles completos.

```
MIT License - Libre para uso comercial y personal
Copyright (c) 2025 MAIRA Team
```

## 🆘 Soporte y Contacto

### Documentación
- **📚 Docs técnicos**: `/docs/`
- **🧪 Testing guide**: `/docs/TESTING_GUIDE.md`
- **🔧 Dependency mgmt**: `/docs/DEPENDENCY_MANAGEMENT.md`

### Reportar Issues
- **🐛 Bug reports**: [GitHub Issues](https://github.com/Ehr051/MAIRA/issues)
- **💡 Feature requests**: [GitHub Discussions](https://github.com/Ehr051/MAIRA/discussions)
- **❓ Preguntas**: [Wiki del proyecto](https://github.com/Ehr051/MAIRA/wiki)

### Enlaces Útiles
- **🌐 Demo en vivo**: [https://maira-3e76.onrender.com](https://maira-3e76.onrender.com)
- **📦 Releases**: [GitHub Releases](https://github.com/Ehr051/MAIRA/releases)
- **📊 CDN Status**: [JSDelivr](https://www.jsdelivr.com/package/gh/Ehr051/MAIRA)

---

**🎖️ Versión**: 3.0.0 - Sistema completo de gestión de batalla  
**📅 Última actualización**: Agosto 2025  
**🚀 Estado**: Producción - Desplegado en Render.com  
**👥 Desarrolladores**: [Lista de contribuidores](https://github.com/Ehr051/MAIRA/graphs/contributors)

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
import { MiniTilesLoader } from './Client/js/mini_tiles_loader.js';

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
