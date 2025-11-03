# ⚠️ IMPORTANTE: Usa el Servidor Correcto

**Fecha:** 3 de noviembre de 2025

---

## 🚨 PROBLEMA IDENTIFICADO EN logs.txt

Los errores 404 que ves en `logs.txt` son porque estás usando **Live Server de VSCode** en lugar del servidor Python de MAIRA.

### **Errores en logs.txt:**
```
planeamiento.html:35  GET http://127.0.0.1:5500/node_modules/html2canvas/dist/html2canvas.min.js net::ERR_ABORTED 404
planeamiento.html:34  GET http://127.0.0.1:5500/node_modules/jspdf/dist/jspdf.umd.min.js net::ERR_ABORTED 404
planeamiento.html:37  GET http://127.0.0.1:5500/node_modules/leaflet/dist/leaflet.js net::ERR_ABORTED 404
```

### **Causa:**
- **Puerto 5500** = Live Server de VSCode (extensión)
- Live Server **NO tiene** endpoint `/node_modules/`
- Live Server **NO puede** servir modelos GLB con Content-Type correcto
- Live Server **NO tiene** endpoints de elevación/vegetación

---

## ✅ SOLUCIÓN: Usa serverhttps.py

### **Servidor Correcto:**
- **Puerto 5001** = serverhttps.py (servidor Python de MAIRA)
- ✅ Tiene endpoint `/node_modules/`
- ✅ Tiene endpoint `/assets/models/` para GLB
- ✅ Tiene endpoints de elevación/vegetación
- ✅ Content-Type correcto para todos los archivos

---

## 🚀 CÓMO INICIAR EL SERVIDOR CORRECTO

### **Opción 1: Script Automático (Recomendado)**

**Mac/Linux:**
```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
./start_local.sh
```

**Windows:**
```cmd
cd C:\path\to\MAIRA-4.0
start_local.bat
```

### **Opción 2: Manual**
```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Server
python3 serverhttps.py
```

---

## 🌐 URLs CORRECTAS

### **❌ INCORRECTO (Live Server):**
```
http://127.0.0.1:5500/Client/planeamiento.html
http://127.0.0.1:5500/Client/planeamiento_integrado.html
http://127.0.0.1:5500/Client/juegodeguerra.html
```

### **✅ CORRECTO (serverhttps.py):**
```
https://localhost:5001/Client/planeamiento.html
https://localhost:5001/Client/planeamiento_integrado.html
https://localhost:5001/Client/juegodeguerra.html
```

---

## 📋 CHECKLIST ANTES DE PROBAR

- [ ] **Detener Live Server de VSCode** (si está corriendo)
  - Click en "Port: 5500" en barra inferior de VSCode
  - Selecciona "Stop Server"

- [ ] **Iniciar serverhttps.py**
  - `./start_local.sh` (Mac/Linux)
  - `start_local.bat` (Windows)

- [ ] **Verificar que está corriendo**
  - Debe mostrar: `Running on https://127.0.0.1:5001`
  - Prueba: https://localhost:5001/health

- [ ] **Abrir en navegador correcto**
  - https://localhost:5001/Client/planeamiento_integrado.html
  - **Acepta advertencia de certificado** (es normal para desarrollo)

---

## 🔍 VERIFICACIÓN RÁPIDA

### **Test 1: Health Check**
```
https://localhost:5001/health
```
**Debe retornar:** `{"status": "ok"}`

### **Test 2: Node Modules**
```
https://localhost:5001/node_modules/leaflet/dist/leaflet.js
```
**Debe retornar:** Código JavaScript de Leaflet

### **Test 3: Modelos GLB**
```
https://localhost:5001/assets/models/vegetation/tree.glb
```
**Debe retornar:** Archivo binario GLB (o 404 si no existe, pero el endpoint funciona)

---

## 🐛 SI AÚN VES ERRORES 404

### **1. Verifica el puerto en la URL del navegador:**
```
✅ https://localhost:5001/...    (Correcto)
❌ http://127.0.0.1:5500/...     (Live Server)
```

### **2. Verifica que serverhttps.py está corriendo:**
```bash
# En terminal debe mostrar:
🚀 Iniciando MAIRA 4.0 - Servidor Local
🌐 Iniciando servidor HTTPS...
   URL: https://localhost:5001
 * Running on https://127.0.0.1:5001
```

### **3. Verifica que MySQL está corriendo:**
```bash
# Mac
brew services list | grep mysql

# Linux
systemctl status mysql

# Windows
net start | findstr MySQL
```

### **4. Verifica node_modules:**
```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
ls -la node_modules/leaflet
```
Debe existir el directorio.

---

## 📊 COMPARACIÓN DE SERVIDORES

| Característica | Live Server (VSCode) | serverhttps.py |
|----------------|---------------------|----------------|
| **Puerto** | 5500 | 5001 |
| **Protocolo** | HTTP | HTTPS |
| **Endpoint `/node_modules/`** | ❌ NO | ✅ SÍ |
| **Endpoint `/assets/models/`** | ❌ NO | ✅ SÍ |
| **Endpoint elevación** | ❌ NO | ✅ SÍ |
| **Content-Type GLB** | ❌ Incorrecto | ✅ Correcto |
| **Socket.IO** | ❌ NO | ✅ SÍ |
| **Base de datos** | ❌ NO | ✅ SÍ |
| **APIs REST** | ❌ NO | ✅ SÍ |

---

## 💡 TIPS

### **Desactivar Live Server automático:**
1. Abre VSCode Settings (Cmd+,)
2. Busca: "Live Server"
3. Desactiva: "Live Server > Auto Open"

### **Usar serverhttps.py siempre:**
- Añade al `.vscode/settings.json`:
```json
{
  "liveServer.settings.donotShowInfoMsg": true,
  "liveServer.settings.donotVerifyTags": true,
  "liveServer.settings.ignoreFiles": [
    "**/Client/**"
  ]
}
```

### **Atajo para iniciar servidor:**
Crea alias en `.bash_profile` o `.zshrc`:
```bash
alias maira-start='cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0 && ./start_local.sh'
```

Luego solo escribe:
```bash
maira-start
```

---

## 🎯 RESUMEN

### **Para que TODO funcione correctamente:**

1. **NUNCA uses Live Server** para MAIRA
2. **SIEMPRE usa serverhttps.py** (`./start_local.sh`)
3. **Abre en:** https://localhost:5001 (puerto 5001, NO 5500)
4. **Acepta el certificado** autofirmado cuando el navegador te lo pida

### **Si ves errores 404 en logs:**
- ✅ Verifica que estás en `https://localhost:5001`
- ✅ Verifica que serverhttps.py está corriendo
- ✅ Detén Live Server si está activo

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [GUIA_SERVIDORES.md](GUIA_SERVIDORES.md) - Guía completa de servidores
- [SOLUCION_PROBLEMAS_3D_COMPLETA.md](SOLUCION_PROBLEMAS_3D_COMPLETA.md) - Solución problemas 3D
- [start_local.sh](../start_local.sh) - Script de inicio

---

**¿Dudas?** Revisa que:
1. Puerto 5001 (NO 5500)
2. HTTPS (NO HTTP)
3. serverhttps.py corriendo
4. MySQL activo

🎉 **¡Con esto TODOS los errores 404 desaparecerán!**
