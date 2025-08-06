# Guía de Deployment MAIRA en Render.com con MySQL

## 🚀 Configuración Completa para Render + MySQL

### 1. **Preparación del Repositorio**

Tu proyecto ya está configurado con:
- ✅ `render.yaml` - Configuración de servicios
- ✅ `app.py` - Servidor optimizado para MySQL
- ✅ `requirements.txt` - Dependencias Python + MySQL
- ✅ `Client/js/config.js` - Configuración frontend
- ✅ Scripts de build en `package.json`

### 2. **🗄️ PASO 1: Configurar Base de Datos MySQL (GRATIS)**

**Opciones recomendadas (todas gratuitas):**

#### **A. PlanetScale (Recomendado) 🌟**
- Visita: [planetscale.com](https://planetscale.com)
- Plan gratuito: 1GB, 1 billón de lecturas/mes
- Compatible con MySQL 8.0
- Dashboard visual excelente

#### **B. Railway MySQL**
- Visita: [railway.app](https://railway.app)
- Plan gratuito: 500 horas/mes
- MySQL incluido en la plataforma

#### **C. Clever Cloud MySQL**  
- Visita: [clever-cloud.com](https://clever-cloud.com)
- Plan gratuito: 256MB MySQL
- Ubicado en Europa

#### **D. FreeSQLDatabase**
- Visita: [freesqldatabase.com](https://freesqldatabase.com)
- Gratis permanente: 5MB
- Solo para testing/demo

### 3. **🔧 PASO 2: Obtener Credenciales MySQL**

Después de crear tu base de datos, obtendrás:

```
Host: [tu-host-mysql]
Usuario: [tu-usuario]
Password: [tu-password]  
Database: maira
Puerto: 3306
```

### 4. **📡 PASO 3: Deployment en Render**

#### **Opción A: Deployment Automático (Recomendado)**

1. **Subir cambios a GitHub:**
```bash
git add .
git commit -m "🚀 RENDER: Configuración MySQL + deployment"
git push origin main
```

2. **Conectar con Render:**
- Ve a [render.com](https://render.com)
- Conecta tu cuenta de GitHub
- Selecciona el repositorio `MAIRA`
- Render detectará automáticamente `render.yaml`

3. **Configurar variables de entorno en Render:**
```env
FLASK_ENV=production
CLIENT_URL=https://maira-frontend.onrender.com
SERVER_URL=https://maira-backend.onrender.com
SECRET_KEY=[auto-generada]

# MySQL Configuration (usar tus credenciales)
MYSQL_HOST=tu-host-mysql
MYSQL_USER=tu-usuario-mysql
MYSQL_PASSWORD=tu-password-mysql
MYSQL_DATABASE=maira
MYSQL_PORT=3306
```

### 5. **🛠️ PASO 4: Configurar Estructura de Base de Datos**

Una vez deployado, crear las tablas necesarias en MySQL:

```sql
-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de operaciones
CREATE TABLE operaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado ENUM('activa', 'pausada', 'finalizada') DEFAULT 'activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de elementos del mapa
CREATE TABLE elementos_mapa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operacion_id INT,
    tipo VARCHAR(100),
    sidc VARCHAR(50),
    coordenadas JSON,
    propiedades JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operacion_id) REFERENCES operaciones(id)
);

-- Tabla de chat
CREATE TABLE mensajes_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operacion_id INT,
    usuario VARCHAR(255),
    mensaje TEXT,
    tipo ENUM('general', 'privado') DEFAULT 'general',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operacion_id) REFERENCES operaciones(id)
);
```

### 6. **🌐 URLs Finales**

- **Frontend:** `https://maira-frontend.onrender.com`
- **Backend API:** `https://maira-backend.onrender.com`
- **Health Check:** `https://maira-backend.onrender.com/health`

### 7. **✅ Verificación Post-Deployment**

1. **Backend funcionando:**
```bash
curl https://maira-backend.onrender.com/health
```

2. **Frontend conectando:**
- Abrir `https://maira-frontend.onrender.com`
- Verificar console del navegador
- Comprobar conexión Socket.IO

3. **Base de datos conectada:**
- Health check debe mostrar `"database": "connected"`

### 8. **🎯 Características Incluidas**

- ✅ **Real-time:** Socket.IO funcional
- ✅ **Base de datos:** MySQL externa
- ✅ **SSL:** Certificados automáticos
- ✅ **Escalado:** Automático
- ✅ **Monitoreo:** Health checks
- ✅ **CORS:** Configurado para dominios Render

### 9. **⚠️ Limitaciones Tier Gratuito**

**Render:**
- **Backend:** 750 horas/mes
- **Sleep:** Después de 15min sin actividad
- **Bandwidth:** 100GB/mes

**Bases de datos MySQL gratuitas:**
- **PlanetScale:** 1GB storage, 1B lecturas
- **Railway:** 500 horas/mes
- **Clever Cloud:** 256MB
- **FreeSQLDatabase:** 5MB (solo testing)

### 10. **🚀 Próximos Pasos**

1. **✅ Elegir proveedor MySQL** (recomiendo PlanetScale)
2. **✅ Crear base de datos y obtener credenciales**
3. **✅ Hacer commit y push de archivos configurados**
4. **✅ Crear cuenta en Render.com**
5. **✅ Conectar repositorio GitHub**
6. **✅ Configurar variables de entorno MySQL**
7. **✅ Crear estructura de tablas**
8. **✅ ¡Compartir tu MAIRA con el mundo!** 🌍

### 🆘 **Troubleshooting**

- **Build falla:** Verificar `requirements.txt`
- **MySQL connection:** Revisar credenciales en variables
- **Frontend no conecta:** Verificar CORS en variables
- **Sleep mode:** Usar [UptimeRobot](https://uptimerobot.com)

---

**¿Listo para deployar con MySQL?** 🚀💾
