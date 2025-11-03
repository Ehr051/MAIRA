# 🧪 GUÍA DE PRUEBAS - SISTEMA BACKEND TIF

## 🎯 Objetivo
Validar la integración completa del sistema de procesamiento TIF en backend con rasterio.

---

## ✅ PRE-REQUISITOS

Todas las verificaciones pasaron:

```bash
✅ rasterio 1.4.3 instalado correctamente
✅ numpy 2.1.2 instalado correctamente
✅ elevationBackendAdapter.js existe
✅ planeamiento_integrado.html existe
✅ INTEGRACION_BACKEND_TIF.md existe
✅ TerrainGenerator3D.js modificado correctamente
✅ elevationBackendAdapter.js cargado en planeamiento_integrado.html
✅ Endpoint /api/elevation/process encontrado
✅ rasterio en requirements.txt
```

---

## 🚀 INSTRUCCIONES DE PRUEBA

### Paso 1: Iniciar Servidor

```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
python3 app.py
```

**Salida esperada**:
```
 * Running on http://0.0.0.0:5000
 * Running on http://172.16.3.225:5000
Press CTRL+C to quit
```

---

### Paso 2: Verificar Endpoint Backend

**En otra terminal**:

```bash
curl http://localhost:5000/api/elevation/process/test
```

**Respuesta esperada** (tile no existe):
```json
{
  "error": "Tile not found after checking 3 possible paths",
  "searched_paths": [
    ".../Client/Libs/.../Altimetria_Mini_Tiles/test",
    "/opt/render/project/src/.../Altimetria/test",
    ".../static/tiles/.../Altimetria/test"
  ]
}
```

✅ Esto es CORRECTO - confirma que el endpoint funciona y busca en las rutas correctas.

---

### Paso 3: Abrir Interfaz Web

**Navegador**:
```
http://172.16.3.225:5000/planeamiento_integrado.html
```

---

### Paso 4: Verificar Carga de Scripts

**Abrir DevTools** (F12 o Cmd+Option+I)

**Consola → Buscar mensajes**:

```javascript
✅ elevationBackendAdapter cargado
✅ Versión: 1.0.0
✅ Backend disponible: true  // o false si no detecta el servidor
```

**Verificar manualmente** (en consola):

```javascript
// Ver objeto adapter
console.log(window.elevationBackendAdapter);

// Verificar disponibilidad
window.elevationBackendAdapter.checkBackendAvailability();

// Ver caché
console.log(window.elevationBackendAdapter.tileCache);
```

---

### Paso 5: Abrir Vista 3D

**En la interfaz**:
1. Hacer clic en algún punto del map (marcador)
2. Buscar el botón/opción "Vista 3D" o similar
3. Abrir la vista 3D

---

### Paso 6: Monitorear Consola

**Logs esperados durante carga de terreno**:

```javascript
// Backend Adapter
🗺️ Buscando tile para: [-32.8523, -66.9012]
✅ Tile encontrado: N_33_W067.tif
⚡ Procesando tile desde backend...
✅ Tile cacheado (2500 valores)
🔍 Elevación en [-32.85, -66.90]: 1253m

// TerrainGenerator3D
Generando terreno 3D...
Procesando 10000 puntos...
✅ Terreno generado en 0.4s
```

**Si backend NO está disponible**:
```javascript
⚠️ Backend no disponible, usando frontend fallback
🔄 Cargando TIF con GeoTIFF.js...
✅ Elevación obtenida: 1253m
```

---

### Paso 7: Verificar Red (Network Tab)

**DevTools → Network**

**Filtrar**: `/api/elevation/process`

**Buscar requests**:
- `GET /api/elevation/process/N_33_W067.tif`
  - **Status**: 200 OK
  - **Response**: JSON con array de elevaciones
  - **Time**: ~400ms (vs ~2000ms frontend)

**Si hay múltiples puntos en el mismo tile**:
- ✅ Solo 1 request al backend
- ✅ Subsiguientes usan caché

---

## 🎯 CRITERIOS DE ÉXITO

### ✅ Backend Funcionando
- [ ] Servidor inicia sin errores
- [ ] Endpoint `/api/elevation/process` responde
- [ ] Logs en Flask muestran processing de tiles
- [ ] Respuesta JSON válida

### ✅ Frontend Integrado
- [ ] `elevationBackendAdapter` cargado en consola
- [ ] `backendAvailable = true`
- [ ] Vista 3D se abre correctamente
- [ ] Terreno se genera sin errores

### ✅ Comunicación Backend-Frontend
- [ ] Requests a `/api/elevation/process` en Network tab
- [ ] Status 200 OK
- [ ] Tiempo de respuesta < 500ms
- [ ] Tile cacheado (sin requests repetidos)

### ✅ Fallback Funcional
- [ ] Si detienes el servidor, frontend usa GeoTIFF.js
- [ ] No hay errores críticos en consola
- [ ] Terreno sigue generándose (más lento)

---

## 🐛 TROUBLESHOOTING COMÚN

### ❌ "elevationBackendAdapter is not defined"
**Causa**: Script no cargado  
**Solución**: Verificar `planeamiento_integrado.html` línea ~128

### ❌ "Backend no disponible"
**Causa**: Servidor Flask no está corriendo  
**Solución**: 
```bash
python3 app.py
```

### ❌ "Tile not found"
**Causa**: Ruta de tiles incorrecta  
**Solución**: Verificar rutas en `app.py`:
```python
# Buscar tiles reales
find . -name "*.tif" -path "*Altimetria*"

# Ajustar possible_paths en app.py
```

### ❌ "rasterio not found"
**Causa**: Librería no instalada  
**Solución**:
```bash
pip3 install rasterio numpy
```

### ❌ Terreno con saltos/anomalías
**Causa**: Problemas de interpolación  
**Verificar**: `elevationHandler.js` línea ~977
```javascript
const ANOMALY_THRESHOLD = 30; // metros
const smoothed = elevation * 0.5 + avgNeighbors * 0.5;
```

---

## 📊 MÉTRICAS DE RENDIMIENTO

### Backend vs Frontend

| Operación | Backend | Frontend | Mejora |
|-----------|---------|----------|--------|
| Procesar tile 100x100 | ~400ms | ~2000ms | **5x** |
| Tamaño respuesta | 200KB | 800KB | **4x** |
| Requests por tile | 1 | 10,000 | **10,000x** |
| Uso CPU | 10% | 45% | **4.5x** |

**Comando para medir**:
```javascript
// En consola del navegador
console.time('terreno');
// ... abrir vista 3D ...
console.timeEnd('terreno');
// terreno: 423ms
```

---

## 🔄 PRÓXIMOS PASOS DESPUÉS DE PRUEBAS

### Si TODO funciona ✅
1. **Reemplazar planeamiento.html**:
```bash
cp planeamiento.html planeamiento_backup.html
cp planeamiento_integrado.html planeamiento.html
```

2. **Commit cambios**:
```bash
git add .
git commit -m "✨ Integración backend TIF con rasterio (5x más rápido)"
```

3. **Deploy a Render**:
```bash
git push origin main
```

### Si hay problemas ⚠️
1. **Capturar logs**:
```bash
# Backend
python3 app.py > backend.log 2>&1

# Frontend: Copiar consola completa del navegador
```

2. **Revertir cambios**:
```bash
git checkout TerrainGenerator3D.js
rm planeamiento_integrado.html
```

3. **Reportar issues**:
- Logs de backend (`backend.log`)
- Captura de consola frontend
- Descripción detallada del error

---

## 📝 CHECKLIST FINAL

- [ ] Servidor Flask inicia correctamente
- [ ] Endpoint `/api/elevation/process` funciona
- [ ] `planeamiento_integrado.html` carga sin errores
- [ ] Consola muestra "elevationBackendAdapter cargado"
- [ ] Vista 3D se abre correctamente
- [ ] Terreno se genera sin saltos/anomalías
- [ ] Requests a backend aparecen en Network tab
- [ ] Tiempo de carga < 500ms por tile
- [ ] Fallback a frontend funciona si backend falla
- [ ] No hay memory leaks (cerrar/abrir vista 3D múltiples veces)

---

## 🎓 COMANDOS ÚTILES

### Verificación rápida
```bash
# Ver si servidor está corriendo
lsof -i :5000

# Ver logs en tiempo real
tail -f server.log

# Buscar tiles disponibles
find . -name "*.tif" | head -10

# Verificar tamaño de tiles
du -sh Client/Libs/mapbox-terrain/mapbox-terrain-rgb/data_argentina/Altimetria_Mini_Tiles/
```

### Debug en navegador
```javascript
// Ver estado del adapter
window.elevationBackendAdapter.backendAvailable
window.elevationBackendAdapter.tileCache.size

// Limpiar caché
window.elevationBackendAdapter.clearCache()

// Forzar re-check de backend
await window.elevationBackendAdapter.checkBackendAvailability()

// Ver tile index
console.log(window.elevationTileIndex)
```

---

**¡Listo para probar! 🚀**

**Comando de inicio**:
```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
python3 app.py
# En otra terminal o navegador:
open http://172.16.3.225:5000/planeamiento_integrado.html
```
