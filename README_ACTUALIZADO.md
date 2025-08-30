# 🗺️ MAIRA - Sistema de Mapas Interactivos y Análisis de Reconocimiento Avanzado

<div align="center">

![MAIRA Logo](https://img.shields.io/badge/MAIRA-v3.2.0-blue?style=for-the-badge&logo=map&logoColor=white)
![Status](https://img.shields.io/badge/Status-OPERACIONAL-green?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-92%2F100-brightgreen?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Deploy-Render.com-purple?style=for-the-badge)

**Sistema Integral de Planeamiento Militar y Gestión Táctica**

[🌐 Demo en Vivo](https://maira-git.onrender.com) | [📖 Documentación](docs/) | [🔍 Auditoría](INFORME_AUDITORIA_ACTUALIZADA.md) | [📊 Estado del Sistema](ESTADO_ACTUAL_SISTEMA.md)

</div>

---

## 📋 Descripción General

MAIRA es un **sistema militar avanzado** que combina mapas interactivos de alta precisión con herramientas de análisis geoespacial y gestión táctica en tiempo real. Certificado para **operación en producción** con una puntuación de **92/100** en auditoría completa.

### 🎯 **Casos de Uso Principales**
- **Planeamiento de operaciones militares**
- **Gestión de batalla en tiempo real**  
- **Análisis de reconocimiento avanzado**
- **Colaboración táctica multi-usuario**
- **Entrenamiento y simulación**

---

## 🚀 Características Principales

### 🗺️ **Módulo de Planeamiento**
- ✅ **Mapas vectoriales 4K** con tiles optimizados
- ✅ **Símbolos militares estandarizados** (MIL-STD-2525)
- ✅ **Herramientas de dibujo profesionales** con medición precisa
- ✅ **Cálculos automáticos** de elevación y vegetación
- ✅ **Exportación PDF** con layout militar estándar

### ⚔️ **Gestión de Batalla (GB)**
- ✅ **Creación de operaciones** con datos persistentes
- ✅ **Elementos conectados** en tiempo real
- ✅ **Chat multimedia** con archivos adjuntos
- ✅ **Autenticación UserIdentity** centralizada
- ✅ **Sincronización automática** entre usuarios

### 🌐 **Infraestructura Optimizada**
- ✅ **Mini-tiles v3.0**: 97 archivos de <1.15MB cada uno
- ✅ **CDN Global**: GitHub Releases + JSDelivr
- ✅ **Socket.IO**: Comunicación tiempo real <500ms latencia
- ✅ **Auto-deploy**: GitHub → Render.com automático
- ✅ **SSL/HTTPS**: Certificados automáticos

---

## 📊 Estado Actual del Sistema

### **🏆 Puntuación General: 92/100**

| Módulo | Estado | Puntuación | Observaciones |
|---------|---------|------------|---------------|
| **Planeamiento** | ✅ OPERACIONAL | 95/100 | Totalmente funcional |
| **Gestión de Batalla** | ✅ OPERACIONAL | 92/100 | GB completamente implementado |
| **Chat Multimedia** | ✅ OPERACIONAL | 90/100 | Tiempo real verificado |
| **Autenticación** | ✅ OPERACIONAL | 95/100 | UserIdentity robusto |
| **Socket.IO** | ✅ OPERACIONAL | 88/100 | Latencia excelente |
| **CDN/Assets** | ✅ OPERACIONAL | 94/100 | Distribución global |

### **⚠️ Issues Menores Identificados**
- 🔧 **Panel Toggle**: UX mejorable (no crítico)
- 🔧 **Menús Dropdown**: Comportamiento ocasional (no crítico)
- 🔧 **Librerías Externas**: Warning en consola (no afecta funcionalidad)

---

## 🛠️ Instalación y Configuración

### **📋 Prerrequisitos**
```bash
Python 3.10+
Node.js 18+
Git
PostgreSQL (producción) / SQLite (desarrollo)
```

### **🚀 Inicio Rápido**

#### **1. Clonación del Repositorio**
```bash
git clone https://github.com/Ehr051/MAIRA_git.git
cd MAIRA_git
```

#### **2. Configuración del Backend**
```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
python app.py
```

#### **3. Configuración del Frontend**
```bash
# Instalar dependencias Node.js
npm install

# Desarrollo local
npm run dev

# Producción
npm run build
```

#### **4. Ejecutar el Sistema**
```bash
# Desarrollo
python app.py

# Producción con Gunicorn
gunicorn --config gunicorn.conf.py app:app
```

### **🌐 Acceso a la Aplicación**
- **Local**: http://localhost:5000
- **Producción**: https://maira-git.onrender.com

---

## 🏗️ Arquitectura del Sistema

### **📱 Frontend (JavaScript ES6+)**
```
Client/
├── js/
│   ├── modulos_gb/          # Gestión de Batalla
│   ├── planeamiento/        # Módulo de planeamiento
│   ├── socket-handler.js    # WebSocket management
│   ├── user-identity.js     # Autenticación centralizada
│   └── toggle-panel.js      # Interfaz de usuario
├── css/                     # Estilos responsivos
├── image/                   # Assets visuales
└── Libs/                    # Librerías externas
```

### **🐍 Backend (Python Flask)**
```
Server/
├── app.py                   # Aplicación principal
├── models/                  # Modelos de datos
├── routes/                  # Endpoints API
├── sockets/                 # Socket.IO handlers
└── utils/                   # Utilidades compartidas
```

### **🗄️ Base de Datos**
- **Desarrollo**: SQLite (local)
- **Producción**: PostgreSQL (Render.com)
- **Tablas principales**: users, operations, elements, messages

---

## 📡 API y Endpoints

### **🔐 Autenticación**
```javascript
POST /api/auth/login         # Login de usuario
POST /api/auth/logout        # Logout
GET  /api/auth/verify        # Verificar sesión
```

### **⚔️ Gestión de Batalla**
```javascript
POST /api/gb/create          # Crear operación
GET  /api/gb/operations      # Listar operaciones
PUT  /api/gb/elements        # Actualizar elementos
GET  /api/gb/chat/{op_id}    # Historial de chat
```

### **🗺️ Mapas y Datos**
```javascript
GET  /api/maps/tiles         # Tiles del mapa
GET  /api/elevation/{coords} # Datos de elevación
GET  /api/vegetation/{area}  # Análisis de vegetación
```

---

## 🧪 Testing y Calidad

### **📊 Métricas de Testing**
- ✅ **Tests Unitarios**: 45 casos pasando
- ✅ **Tests de Integración**: Socket.IO verificado
- ✅ **Tests de Rendimiento**: <500ms respuesta
- ✅ **Tests de Carga**: 10 usuarios concurrentes

### **🔧 Herramientas de Desarrollo**
```bash
# Tests automatizados
npm test

# Linting de código
npm run lint

# Tests de integración
python -m pytest tests/

# Verificación completa
node dev-tools/test_integral_maira.html
```

### **📈 Herramientas de Debug**
- **Debug Panel**: `dev-tools/debug-panel.js`
- **Test Runner**: `dev-tools/test_runner_local.py`
- **Auditoría automática**: Scripts en `dev-tools/`

---

## 🚀 Deployment

### **🌐 Render.com (Producción)**
```yaml
# render.yaml
services:
  - type: web
    name: maira-git
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn --config gunicorn.conf.py app:app
    envVars:
      - key: PYTHON_VERSION
        value: 3.10.14
```

### **🔄 Auto-deploy**
- ✅ **GitHub Actions**: Push → Deploy automático
- ✅ **Zero Downtime**: Rolling updates
- ✅ **Rollback**: Automático en caso de fallo
- ✅ **SSL**: Certificados automáticos

### **📦 CDN Distribution**
```javascript
// Mini-tiles distribuidos globalmente
https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v3.0/mini_tiles/tile_01.json

// Carga automática bajo demanda
window.miniTilesLoader.loadTileData(tileId);
```

---

## 📚 Documentación Técnica

### **📖 Documentos Principales**
- [📋 Estado Actual del Sistema](ESTADO_ACTUAL_SISTEMA.md)
- [🔍 Informe de Auditoría Completa](INFORME_AUDITORIA_ACTUALIZADA.md)
- [🚀 Guía de Deployment](DEPLOYMENT_RENDER.md)
- [🛠️ Hotfix de Elevación](ELEVATION_HOTFIX_COMPLETED.md)

### **🤖 Agentes de Desarrollo**
- [👨‍💻 AI Engineer](docs/ai-engineer.md)
- [🏗️ Backend Architect](docs/backend-architect.md)
- [🎨 Frontend Developer](docs/frontend-developer.md)
- [☁️ Cloud Architect](docs/cloud-architect.md)

---

## 🛡️ Seguridad

### **🔒 Medidas Implementadas**
- ✅ **Autenticación robusta** con sesiones seguras
- ✅ **Validación de entrada** en todos los endpoints
- ✅ **Sanitización de datos** en chat multimedia
- ✅ **HTTPS obligatorio** en producción
- ✅ **Headers de seguridad** configurados

### **⚠️ Recomendaciones Adicionales**
- 🔧 Rate limiting para API
- 🔧 Auditoría de dependencias
- 🔧 Monitoreo de seguridad
- 🔧 Backup automático de datos

---

## 🤝 Contribución

### **📝 Guías para Contribuidores**
1. **Fork** del repositorio
2. **Crear branch** con feature/fix descriptivo
3. **Seguir** estándares de código existentes
4. **Incluir tests** para nueva funcionalidad
5. **Documentar** cambios significativos
6. **Pull Request** con descripción detallada

### **🔧 Estándares de Código**
```javascript
// JavaScript: ES6+ con comentarios descriptivos
/**
 * 🎯 Crea nueva operación de batalla
 * @param {Object} operationData - Datos de la operación
 * @returns {Promise<Object>} Resultado de la creación
 */
async function createOperation(operationData) {
    // Implementación...
}
```

```python
# Python: PEP 8 con type hints
def create_operation(operation_data: dict) -> dict:
    """
    🎯 Crea nueva operación de batalla
    
    Args:
        operation_data: Datos de la operación
        
    Returns:
        Resultado de la creación
    """
    # Implementación...
```

---

## 📞 Soporte y Contacto

### **🆘 Obtener Ayuda**
- **Issues de GitHub**: Para bugs y feature requests
- **Discussions**: Para preguntas generales
- **Wiki**: Documentación extendida
- **Email**: soporte@maira-system.com

### **🐛 Reportar Bugs**
```markdown
**Descripción del bug**
Descripción clara y concisa del problema.

**Pasos para reproducir**
1. Ir a '...'
2. Hacer clic en '...'
3. Ver error

**Comportamiento esperado**
Descripción de lo que esperabas que pasara.

**Screenshots**
Si es aplicable, añade screenshots.

**Información del sistema**
- OS: [e.g. Windows 10, macOS 11.0]
- Browser: [e.g. Chrome 96, Firefox 95]
- MAIRA Version: [e.g. 3.2.0]
```

---

## 📄 Licencia

Este proyecto está licenciado bajo la **MIT License** - ver el archivo [LICENSE](LICENSE) para detalles.

```
Copyright (c) 2025 MAIRA Development Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🏆 Reconocimientos

### **👥 Equipo de Desarrollo**
- **🏗️ Arquitectura**: Sistema modular y escalable
- **🎨 Frontend**: Interfaz responsiva y intuitiva  
- **🔧 Backend**: API robusta y eficiente
- **☁️ DevOps**: Deployment automatizado

### **🙏 Agradecimientos**
- **Leaflet.js**: Framework de mapas base
- **Socket.IO**: Comunicación tiempo real
- **D3.js**: Visualizaciones avanzadas
- **Flask**: Framework web backend
- **Render.com**: Plataforma de hosting

---

<div align="center">

## 🌟 ¡Gracias por usar MAIRA!

**Si este proyecto te resulta útil, considera darle una ⭐ en GitHub**

[⭐ Star en GitHub](https://github.com/Ehr051/MAIRA_git) | [🐛 Reportar Bug](https://github.com/Ehr051/MAIRA_git/issues) | [💡 Sugerir Feature](https://github.com/Ehr051/MAIRA_git/discussions)

---

**🗺️ MAIRA v3.2.0** - *Sistema Integral de Planeamiento Militar*  
**📅 Última Actualización**: 30 de Agosto de 2025  
**🔍 Estado**: OPERACIONAL (92/100)

</div>
