# Guía de Servidores MAIRA 4.0

**Fecha:** 3 de noviembre de 2025
**Estado:** ✅ COMPLETO Y SINCRONIZADO

---

## 📋 RESUMEN

MAIRA 4.0 tiene **dos servidores Python** con funcionalidad idéntica:

| Servidor | Propósito | URL | Puerto | Certificado |
|----------|-----------|-----|--------|-------------|
| **serverhttps.py** | Desarrollo LOCAL | https://localhost:5001 | 5001 | Autofirmado |
| **app.py** | Producción RENDER | https://maira40.onrender.com | 10000 | Let's Encrypt |

---

## 🔧 CORRECCIONES APLICADAS

### **Problema Detectado:**
`serverhttps.py` **NO tenía** endpoints para:
- ❌ Modelos 3D GLB/GLTF (`/assets/models/`)
- ❌ Node modules (`/node_modules/`)
- ❌ Assets generales (`/Client/assets/`)

### **Solución:**
✅ Añadidos **3 endpoints críticos** a `serverhttps.py`:

1. **`@app.route('/Client/assets/models/<path:filename>')`**
   - Sirve modelos GLB/GLTF
   - Content-Type correcto: `model/gltf-binary`, `model/gltf+json`
   - Cache: 1 hora

2. **`@app.route('/Client/assets/<path:filename>')`**
   - Sirve assets generales (texturas, imágenes, sonidos)
   - Cache: 30 minutos

3. **`@app.route('/node_modules/<path:filename>')`**
   - Sirve dependencias JavaScript (Leaflet, THREE.js, etc.)
   - Content-Type correcto por extensión
   - Cache: 1 hora

---

## 🚀 INICIO RÁPIDO

### **Opción 1: Script Automático (Recomendado)**

**Linux/Mac:**
```bash
./start_local.sh
```

**Windows:**
```cmd
start_local.bat
```

### **Opción 2: Manual**

```bash
cd Server
python3 serverhttps.py
```

**Luego abre en navegador:**
- https://localhost:5001/Client/planeamiento_integrado.html

⚠️ **IMPORTANTE:** Acepta la advertencia del certificado autofirmado (es normal para desarrollo local)

---

## 📁 ESTRUCTURA DE DIRECTORIOS

```
MAIRA-4.0/
├── Server/
│   ├── serverhttps.py          # ✅ Servidor local (ACTUALIZADO)
│   ├── app.py                  # Servidor Render
│   ├── config.py               # Configuración
│   ├── .env                    # Variables de entorno (DB)
│   └── requirements.txt        # Dependencias Python
│
├── Client/
│   ├── planeamiento_integrado.html  # ✅ HTML principal (ACTUALIZADO)
│   ├── assets/
│   │   └── models/            # ✅ MODELOS GLB/GLTF AQUÍ
│   │       ├── vegetation/    # Árboles, arbustos, pasto
│   │       ├── vehicles/      # Tanques, camiones
│   │       ├── structures/    # Carpas, edificios
│   │       ├── infantry/      # Soldados
│   │       └── README.md
│   ├── js/
│   │   └── services/
│   │       ├── ProceduralModelGenerator.js  # ✅ NUEVO fallback
│   │       ├── GLTFModelLoader.js           # ✅ ACTUALIZADO
│   │       ├── maira3DMaster.js             # ✅ ACTUALIZADO
│   │       └── ...
│   └── Libs/
│       ├── mythree/           # THREE.js local
│       └── datos_argentina/   # Tiles elevación
│
├── node_modules/              # Dependencias JS (Leaflet, etc.)
├── start_local.sh             # ✅ NUEVO script inicio Mac/Linux
├── start_local.bat            # ✅ NUEVO script inicio Windows
└── docs/
    ├── GUIA_SERVIDORES.md          # Este archivo
    └── SOLUCION_PROBLEMAS_3D_COMPLETA.md
```

---

## 🔍 ENDPOINTS CRÍTICOS

### **1. Modelos 3D**

**Rutas:**
- `/Client/assets/models/<path>`
- `/assets/models/<path>` (alias)

**Ejemplos:**
```
✅ https://localhost:5001/Client/assets/models/vegetation/tree.glb
✅ https://localhost:5001/assets/models/vehicles/tank.glb
✅ https://localhost:5001/assets/models/structures/tent.glb
```

**Content-Type:**
- `.glb` → `model/gltf-binary`
- `.gltf` → `model/gltf+json`

---

### **2. Node Modules**

**Ruta:**
- `/node_modules/<path>`

**Ejemplos:**
```
✅ https://localhost:5001/node_modules/leaflet/dist/leaflet.js
✅ https://localhost:5001/node_modules/three/build/three.min.js
✅ https://localhost:5001/node_modules/socket.io/client-dist/socket.io.min.js
```

---

### **3. Elevación y Vegetación**

**Rutas:**
- `/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/<path>`
- `/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/<path>`
- `/api/tiles/elevation/<path>`

**Ejemplos:**
```
✅ https://localhost:5001/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/master_index.json
✅ https://localhost:5001/api/tiles/elevation/tile_-34.6_-58.4.tif
```

---

### **4. APIs REST**

**Autenticación:**
- `POST /api/login` - Login usuario
- `POST /api/crear-usuario` - Registro

**Partidas:**
- `POST /api/crear_partida` - Nueva partida
- `GET /api/partidas_disponibles` - Listar partidas
- `POST /api/unirse_partida` - Unirse a partida

**Tiles:**
- `GET /tiles/<provider>/<z>/<x>/<y>.<ext>` - Tiles mapas (OSM, Google, etc.)
- `POST /api/tiles/clean_cache` - Limpiar caché tiles
- `GET /api/tiles/diagnostic` - Diagnóstico sistema tiles

---

## 🧪 TESTING DE MODELOS 3D

### **Test 1: Verificar Servidor**

Abre navegador y va a:
```
https://localhost:5001/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-03T..."
}
```

---

### **Test 2: Verificar Endpoint Modelos**

```bash
# Test con curl (acepta certificado autofirmado)
curl -k https://localhost:5001/assets/models/vegetation/tree.glb
```

**Si hay modelo:** Descargará binario GLB
**Si NO hay modelo:** 404 - Usará fallback procedural

---

### **Test 3: Probar Sistema 3D Completo**

1. Abre: https://localhost:5001/Client/planeamiento_integrado.html
2. Acepta advertencia certificado
3. Haz zoom >= 15 en el map
4. Click en "Generar Vista 3D"
5. **Espera** a que cargue THREE.js (ver consola)
6. Verifica que aparece canvas 3D con terreno
7. Verifica vegetación (árboles, arbustos)
8. Prueba controles:
   - **WASD** - Movimiento cámara
   - **Mouse drag** - Rotar vista
   - **Scroll** - Zoom

---

### **Test 4: Consola del Navegador**

Abre DevTools (F12) y ejecuta:

```javascript
// Verificar THREE.js
console.log('THREE.js:', typeof THREE !== 'undefined' ? '✅' : '❌');

// Verificar modelos procedurales
console.log('Fallback:', typeof ProceduralModelGenerator !== 'undefined' ? '✅' : '❌');

// Probar generación procedural
if (typeof ProceduralModelGenerator !== 'undefined') {
  const gen = new ProceduralModelGenerator();
  const tree = gen.getModel('tree');
  console.log('Árbol generado:', tree.children.length, 'partes');
}
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Problema: "Certificado no confiable"**

**Causa:** Certificado autofirmado en desarrollo local

**Solución:**
1. Chrome/Edge: Click "Avanzado" → "Continuar a localhost"
2. Firefox: "Avanzado" → "Aceptar el riesgo"
3. Safari: "Mostrar detalles" → "Visitar este sitio web"

---

### **Problema: "node_modules no encontrado"**

**Causa:** Dependencias JS no instaladas

**Solución:**
```bash
cd MAIRA-4.0
npm install
```

---

### **Problema: "Error conectando a base de datos"**

**Causa:** MySQL no está corriendo o credenciales incorrectas

**Solución:**
1. Inicia MySQL:
   ```bash
   # Mac
   brew services start mysql

   # Linux
   sudo systemctl start mysql

   # Windows
   net start MySQL
   ```

2. Verifica `.env` en `Server/`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=maira
   DB_PORT=3306
   ```

---

### **Problema: "Modelos 3D no cargan"**

**Causa:** Archivos GLB no existen

**Solución:**
1. ✅ **El sistema usa fallback automático** - Se generan modelos procedurales
2. (Opcional) Añade modelos reales a `Client/assets/models/`
3. Verifica consola: Debe decir "🔨 Generando modelo procedural"

---

### **Problema: "Terreno 3D no tiene elevación"**

**Causa:** Tiles de elevación no disponibles

**Solución:**
1. Verifica `Client/Libs/datos_argentina/Altimetria_Mini_Tiles/`
2. Descarga tiles desde GitHub LFS o fuente externa
3. Endpoint: `/api/tiles/elevation/`

---

## 📊 COMPARACIÓN DE SERVIDORES

| Característica | serverhttps.py | app.py |
|----------------|----------------|--------|
| **Propósito** | Desarrollo local | Producción Render |
| **Puerto** | 5001 | 10000 |
| **Protocolo** | HTTPS | HTTPS |
| **Certificado** | Autofirmado | Let's Encrypt |
| **Base de Datos** | MySQL local | PostgreSQL Render |
| **Node Modules** | ✅ Local | ✅ Instalados en build |
| **Modelos GLB** | ✅ (NUEVO) | ✅ |
| **Elevación Tiles** | ✅ | ✅ |
| **Socket.IO** | ✅ Websocket + polling | ✅ Polling (ngrok compat) |
| **CORS** | ✅ Permitido | ✅ Permitido |
| **Hot Reload** | ✅ Manual restart | ❌ Rebuild completo |

---

## 🔐 SEGURIDAD

### **Desarrollo Local (serverhttps.py):**
- ⚠️ Certificado autofirmado (SOLO para desarrollo)
- ⚠️ CORS permitido desde cualquier origen
- ⚠️ NO usar en producción

### **Producción (app.py en Render):**
- ✅ Certificado Let's Encrypt válido
- ✅ Variables de entorno seguras
- ✅ CORS configurado apropiadamente
- ✅ Rate limiting
- ✅ Logs de seguridad

---

## 📝 LOGS Y DEBUGGING

### **Logs del Servidor:**

El servidor muestra logs detallados:
```
🎮 Sirviendo modelo 3D: vegetation/tree.glb
🔍 Directorio modelos: /path/to/Client/assets/models
🔍 ¿Existe archivo?: True
✅ Modelo servido correctamente: vegetation/tree.glb (model/gltf-binary)
```

### **Logs del Cliente:**

Consola del navegador muestra:
```
✅ THREE.js cargado correctamente
📦 Cargando modelo GLB desde: assets/models/vegetation/tree.glb
✅ Modelo cargado: tree (1234 vértices)
```

O si usa fallback:
```
❌ Error cargando GLB desde assets/models/vegetation/tree.glb
🔨 Generando modelo procedural para: tree
✅ Modelo procedural generado: tree
```

---

## 🚀 DEPLOYMENT A RENDER

**No requiere cambios** - `app.py` ya tiene todos los endpoints.

**Build Command:**
```bash
pip install -r requirements.txt && npm install
```

**Start Command:**
```bash
python Server/app.py
```

---

## 📚 RECURSOS ADICIONALES

- [SOLUCION_PROBLEMAS_3D_COMPLETA.md](SOLUCION_PROBLEMAS_3D_COMPLETA.md) - Solución problemas 3D
- [Client/assets/models/README.md](../Client/assets/models/README.md) - Guía modelos 3D
- [TODO_INTEGRACION_3D_FASE2.md](TODO_INTEGRACION_3D_FASE2.md) - Roadmap 3D

---

## ✅ CHECKLIST PRE-INICIO

Antes de iniciar el servidor, verifica:

- [ ] MySQL está corriendo
- [ ] Archivo `.env` configurado en `Server/`
- [ ] `node_modules/` instalado (`npm install`)
- [ ] Python 3.8+ instalado
- [ ] Dependencias Python instaladas (`pip install -r requirements.txt`)
- [ ] Puerto 5001 libre (o cambiar en `serverhttps.py`)

---

**¿Todo listo?** Ejecuta:
```bash
./start_local.sh
```

Y abre:
```
https://localhost:5001/Client/planeamiento_integrado.html
```

🎉 **¡A disfrutar del sistema 3D!**
