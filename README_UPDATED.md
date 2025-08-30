# MAIRA - Sistema de Mapas Interactivos y Gestión de Batalla

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Mini-tiles](https://img.shields.io/badge/Mini--tiles-v3.0-success)](https://github.com/Ehr051/MAIRA/releases/tag/tiles-v3.0)
[![Deployment](https://img.shields.io/badge/Deploy-Render.com-purple)](https://maira-3e76.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen)](#)

MAIRA es un sistema avanzado de mapas interactivos con capacidades de gestión de batalla, análisis de terreno y simulación táctica en tiempo real. Desarrollado específicamente para entornos militares y de planificación táctica con cobertura completa de Argentina.

## 🎯 Características Principales

### 🗺️ **Sistema de Mapas Avanzado**
- **Mini-tiles v3.0**: 97 archivos optimizados de <1.15MB cada uno
- **Cobertura completa de Argentina**: 9,501 tiles de 25km × 25km  
- **CDN Global**: GitHub Releases + JSDelivr para distribución mundial
- **Carga inteligente**: Sistema de caching y pre-carga bajo demanda
- **Múltiples capas**: Topográfico, satelital, híbrido
- **Soporte offline**: Tiles pre-descargados para uso sin conexión

### ⚔️ **Gestión de Batalla en Tiempo Real**
- **Dos modos operativos**:
  - **Modo Planeamiento**: Análisis táctico y preparación de operaciones
  - **Modo Gestión de Batalla**: Ejecución y control en tiempo real
- **Partidas multijugador**: Socket.IO para comunicación instantánea
- **Sistema de turnos**: Gestión temporal con temporizadores automáticos
- **Chat integrado**: MAIRAChat v3.0 con soporte multimedia
- **Salas de espera**: Lobbies para organizar y configurar partidas
- **Sincronización de elementos**: Posiciones y estados en tiempo real

### 🎯 **Módulos Especializados**
- **Inicio de Gestión de Batalla**: Creación y gestión de operaciones
- **Planeamiento Táctico**: Herramientas de análisis y preparación
- **Gestión de Elementos**: Control de unidades y recursos
- **Sistema de Informes**: Generación y gestión de documentos operacionales
- **Chat Multimedia**: Comunicación con archivos, imágenes y coordenadas

### 📊 **Análisis de Terreno**
- **Datos de elevación**: Información altimétrica de alta precisión
- **Análisis de vegetación**: 9,501 tiles de cobertura vegetal
- **Perfiles de elevación**: Gráficos D3.js interactivos
- **Herramientas de medición**: Distancias, áreas, azimuts y perfiles
- **Cálculo de marchas**: Estimaciones de tiempo y rutas óptimas

### 🎮 **Interfaz Avanzada**
- **Responsive design**: Optimizada para desktop, tablet y móvil
- **Panel lateral dinámico**: Toggle funcional con múltiples pestañas
- **MiRadial menu**: Sistema de menús contextuales avanzado
- **Símbolos militares**: Biblioteca MilSymbol 2.0 completa
- **Atajos de teclado**: 27 atajos optimizados para macOS
- **UI adaptativa**: Detección automática de plataforma

## 🚀 Estados de Funcionamiento

### ✅ **Completamente Funcional**
- ✅ Sistema de mapas con mini-tiles v3.0
- ✅ Carga y visualización de elevación
- ✅ Sistema de vegetación integrado
- ✅ Herramientas de medición y análisis
- ✅ Panel lateral con toggle funcional
- ✅ Chat MAIRAChat v3.0 con multimedia
- ✅ Autenticación y gestión de usuarios
- ✅ Modo Planeamiento completo
- ✅ Inicio de Gestión de Batalla
- ✅ Conectividad Socket.IO
- ✅ Creación y gestión de operaciones
- ✅ Sincronización básica de elementos

### 🔧 **En Desarrollo/Optimización**
- 🔧 Sistema completo de turnos en Gestión de Batalla
- 🔧 Sincronización de heartbeat entre usuarios
- 🔧 Partidas online multijugador (crear/unirse)
- 🔧 Prevención de cierre de menús al hacer clic interno
- 🔧 Optimización de carga inicial de elementos
- 🔧 Resolución de timeouts en conexiones Socket.IO

### 📋 **Próximas Implementaciones**
- 📋 Sistema de roles y permisos granular
- 📋 Modo espectador para observadores
- 📋 Grabación y replay de partidas
- 📋 API REST para integración externa
- 📋 Dashboard de administración
- 📋 Mejoras en sincronización multi-usuario

## 🏗️ Instalación y Configuración

### Prerrequisitos
```bash
# Software requerido
Python 3.10+
Node.js 18+
Git
PostgreSQL (para producción)
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

### Render.com (Configuración Actual)

MAIRA está desplegado automáticamente en Render.com:

```yaml
# render.yaml - deployment automático
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

**URL de producción**: https://maira-3e76.onrender.com

### Variables de Entorno

```bash
# Desarrollo
DATABASE_URL=sqlite:///local.db
DEBUG=True
SECRET_KEY=dev-secret-key

# Producción
DATABASE_URL=postgresql://...
DEBUG=False
SECRET_KEY=production-secret-key
```

## 📱 Modos de Uso

### 🎯 **Modo Planeamiento**
Acceso directo desde la página principal:
- Análisis de terreno y rutas
- Preparación de operaciones
- Marcación de objetivos
- Cálculo de marchas

### ⚔️ **Modo Gestión de Batalla**
Dos vías de acceso:

1. **Crear Nueva Operación**:
   - Desde `inicioGB.html`
   - Definir nombre y descripción
   - Configurar parámetros iniciales

2. **Unirse a Operación Existente**:
   - Desde `iniciarpartida.html`
   - Código de acceso
   - Modo local o multijugador

## 🔧 Problemas Conocidos y Soluciones

### ❌ **Problemas Identificados**
1. **Menús que se cierran al hacer clic interno**
   - Afecta menús dropdown principales
   - JavaScript stopPropagation necesita optimización

2. **Sincronización de elementos**
   - Heartbeat inicia tarde en algunas conexiones
   - Elementos aparecen con retraso en lista

3. **Toggle del panel lateral**
   - Funciona pero puede tener conflictos CSS
   - Necesita verificación de interferencias

### ✅ **Soluciones Implementadas**
- Toggle panel completamente funcional con logging
- Sistema robusto de carga de datos para modo local
- Logging detallado para debugging de partidas
- Conexión Socket.IO estabilizada

## 📚 Documentación Técnica

### Estructura del Proyecto

```
MAIRA/
├── app.py                      # Servidor Flask principal
├── requirements.txt            # Dependencias Python
├── package.json               # Dependencias Node.js
├── render.yaml                # Configuración deployment
├── static/                    # Páginas HTML principales
│   ├── index.html            # Página principal
│   ├── inicioGB.html         # Inicio Gestión Batalla
│   ├── gestionbatalla.html   # Interface GB principal
│   └── iniciarpartida.html   # Lobby multijugador
├── Client/                   # Código cliente
│   ├── js/                  # JavaScript modules
│   ├── css/                 # Estilos
│   ├── audio/              # Assets audio
│   ├── image/              # Imágenes
│   └── Libs/               # Librerías externas
├── Server/                  # Lógica servidor
├── docs/                   # Documentación
└── tools/                  # Herramientas desarrollo
```

### APIs y Endpoints

```javascript
// Principales endpoints de la aplicación
GET  /                      // Página principal
GET  /inicioGB.html        // Inicio Gestión Batalla
GET  /gestionbatalla.html  // Interface principal GB
GET  /iniciarpartida.html  // Lobby multijugador

// API endpoints
GET  /api/operaciones      // Lista operaciones
POST /api/operaciones      // Crear operación
GET  /api/elementos        // Lista elementos
POST /api/elementos        // Actualizar elemento

// Socket.IO events
'login'                    // Autenticación usuario
'crearOperacion'          // Crear nueva operación
'unirseOperacion'         // Unirse a operación
'actualizarElemento'      // Sync elementos tiempo real
```

## 🧪 Testing y Debugging

### Logging Integrado
El sistema incluye logging detallado en:
- `console.log` para desarrollo
- Socket.IO events tracking
- User authentication flow
- Element synchronization
- Error handling

### Herramientas de Debug
```javascript
// Verificar estado del sistema
console.log(window.MAIRA);              // Namespace principal
console.log(window.UserIdentity);       // Sistema autenticación
console.log(window.socket);             // Conexión Socket.IO
```

## 🤝 Contribución

### Áreas de Desarrollo Activo
1. **Sistema de turnos completo**
2. **Optimización de sincronización**
3. **Mejoras en UI/UX**
4. **Testing automatizado**
5. **Documentación API**

### Proceso de Contribución
1. Fork del repositorio
2. Crear branch feature
3. Desarrollar con logging detallado
4. Testing exhaustivo
5. Pull request con descripción completa

## 📄 Licencia

Distribuido bajo licencia MIT. Ver `LICENSE` para más información.

## 🔗 Enlaces Importantes

- **Producción**: https://maira-3e76.onrender.com
- **Repositorio**: https://github.com/Ehr051/MAIRA
- **Issues**: https://github.com/Ehr051/MAIRA/issues
- **Mini-tiles**: https://github.com/Ehr051/MAIRA/releases/tag/tiles-v3.0

## 📞 Soporte

Para soporte técnico o consultas:
- Crear issue en GitHub
- Revisar documentación en `/docs`
- Verificar logs del navegador para debugging

---

**Última actualización**: Agosto 2025 | **Versión**: 3.0 Production
