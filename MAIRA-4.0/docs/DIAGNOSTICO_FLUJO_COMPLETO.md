# 🔍 DIAGNÓSTICO - Flujo completo con logs detallados

## 📋 CAMBIOS APLICADOS:

### 1. Logs detallados agregados en:
- `terrain3d-init.js` → `createFullView3D()` 
- `TerrainController3D.js` → `generateTerrainBatch()`

### 2. Reducción de resolución:
- **ANTES:** 64x64 = 4,225 puntos
- **AHORA:** 32x32 = 1,089 puntos (75% menos datos)

### 3. Loops asíncronos:
- Grid se genera en chunks de 10 filas
- Vértices se procesan en chunks de 500
- Yields al event loop para no bloquear UI

---

## 🧪 CÓMO PROBAR:

### PASO 1: Recargar página
```
http://127.0.0.1:5000/Client/planeamiento_integrado.html
```
**Presiona F5** para que cargue el código nuevo

### PASO 2: Abrir consola
**Chrome/Edge:** F12 → pestaña "Console"

### PASO 3: Hacer clic en "Generar Vista 3D"

---

## 📊 LOGS ESPERADOS (en orden):

```javascript
// INICIO DEL WORKFLOW
🎬 Iniciando generación de vista 3D...
🚀 [WORKFLOW] Iniciando workflow completo (modo optimizado)...
⏱️ Tiempo total workflow: timer started

// PASO 1: CAPTURA
📸 [WORKFLOW] PASO 1/4: Capturando mapa...
⏱️ Captura mapa: timer started
// ... logs de leaflet-image ...
⏱️ Captura mapa: XXXms
✅ [WORKFLOW] Mapa capturado

// PASO 2: ANÁLISIS
🔍 [WORKFLOW] PASO 2/4: Analizando imagen...
⏱️ Análisis imagen: timer started
// ... logs del analyzer ...
⏱️ Análisis imagen: XXXms
✅ [WORKFLOW] Imagen analizada

// PASO 3: GENERACIÓN (CRÍTICO - AQUÍ PUEDE TRABARSE)
🏗️ [WORKFLOW] PASO 3/4: Generando terreno 3D (BATCH API)...
⏱️ Generación terreno: timer started

🏁 [BATCH] Iniciando generateTerrainBatch()
📊 [BATCH] Bounds: {north: -XX, south: -XX, ...}
🎨 [BATCH] Activando canvas container...
✅ [BATCH] Canvas activado
🖥️ [BATCH] Activando fullscreen...
📐 [BATCH] Calculando grid de coordenadas...
⏱️ [BATCH] Generación grid: timer started

// GRID GENERATION (asíncrono en chunks)
📐 Grid: 10/32 filas...
📐 Grid: 20/32 filas...
📐 Grid: 30/32 filas...

⏱️ [BATCH] Generación grid: XXXms
✅ [BATCH] Grid generado: 1089 coordenadas

// REQUEST AL SERVIDOR (CRÍTICO)
📡 [BATCH] Iniciando request batch al servidor...
⏱️ [BATCH] Request API: timer started
📡 Solicitando 1089 elevaciones al servidor...

// ⚠️ SI SE TRABA AQUÍ, EL PROBLEMA ES:
// - Fetch no está saliendo
// - CORS bloqueando
// - Network timeout
// - Servidor no responde

✅ Recibidas 1089 elevaciones en 0.XXs
📦 Tiles usados: [...]
⏱️ [BATCH] Request API: XXXms
✅ [BATCH] Recibidas 1089 elevaciones

// CONSTRUCCIÓN GEOMETRÍA
🏗️ [BATCH] Construyendo geometría THREE.js...
⏱️ [BATCH] Construcción geometría: timer started

// APLICAR ELEVACIONES (asíncrono en chunks)
🎨 Aplicando 1089 elevaciones a geometría...
🏗️ Geometría: 500/1089 vértices...
🏗️ Geometría: 1000/1089 vértices...

⏱️ [BATCH] Construcción geometría: XXXms
✅ [BATCH] Geometría construida con 1089 vértices
📊 Rango elevación: XXm - XXm

// TEXTURA
🎨 [BATCH] Cargando textura...
⏱️ [BATCH] Carga textura: timer started
⏱️ [BATCH] Carga textura: XXXms
✅ [BATCH] Material y mesh creados

// AGREGAR A ESCENA
🎬 [BATCH] Agregando mesh a escena...
✅ [BATCH] Mesh agregado a escena

// FIN
⏱️ Generación terreno: XXXms
✅ [WORKFLOW] Terreno generado
⏱️ Tiempo total workflow: XXXms
✅ [WORKFLOW] Workflow completo finalizado
✅ Terreno 3D generado exitosamente (batch API)
📏 Dimensiones: XXXXm x XXXXm
```

---

## 🔍 IDENTIFICAR DÓNDE SE TRABA:

### Si se traba en "Grid generado":
**Problema:** Generación de coordenadas bloqueante
**Solución:** Ya aplicada (chunks asíncronos)

### Si se traba en "Iniciando request batch":
**Problema:** Fetch bloqueado o no sale
**Causas posibles:**
- CORS issue
- Flask no responde
- URL incorrecta
- Network timeout

**Verificar:**
1. Pestaña "Network" en DevTools
2. ¿Aparece request a `/api/elevation/batch`?
3. ¿Status code? (200 OK, 404, 500, etc)

### Si se traba en "Construyendo geometría":
**Problema:** Loop de vértices bloqueante
**Solución:** Ya aplicada (chunks asíncronos)

### Si se traba en "Cargando textura":
**Problema:** Imagen muy pesada
**Solución:** Reducir calidad de captura

---

## 🚨 EN LA TERMINAL DEL SERVIDOR:

**Si el request llega correctamente, deberías ver:**

```python
🔥 BATCH REQUEST: 1089 coordenadas
📦 PASO 1: Determinando tiles necesarias para bounds: {...}
📍 Tiles identificadas: ['tile_simulated_1']
💾 PASO 2: Cargando 1 tiles en memoria...
✅ Tiles cargadas en memoria
🔍 PASO 3: Consultando elevaciones desde tiles cargadas...
✅ BATCH RESPONSE: 1089 elevaciones procesadas en 0.XXs
📊 Performance: XXXXX puntos/segundo
```

**Si NO ves nada en la terminal:**
❌ **El request NO está llegando al servidor**
→ Problema en el frontend (fetch bloqueado/no ejecutado)

---

## 📊 COMPARACIÓN ESPERADA:

### ANTES (sin optimizaciones):
```
Grid: 4225 puntos
Tiempo: 15-35 segundos
UI: Tildada, sin respuesta
Requests: 4000+ individuales
```

### AHORA (con optimizaciones):
```
Grid: 1089 puntos (reducido)
Tiempo: 2-3 segundos
UI: Fluida, con progress
Requests: 1 batch único
```

---

## ✅ CRITERIOS DE ÉXITO:

- [ ] Modal aparece inmediatamente
- [ ] Progress bar se mueve suavemente
- [ ] Logs aparecen en orden en consola
- [ ] Se ve "Iniciando request batch" en ~1 segundo
- [ ] Se ve log en terminal Flask
- [ ] Se completa en < 5 segundos
- [ ] Terreno aparece visible

---

## 🐛 SI FALLA:

**Copia TODOS los logs de la consola** desde:
```
🎬 Iniciando generación de vista 3D...
```

Hasta el último mensaje (o donde se trabe).

También verifica **pestaña Network** en DevTools:
- Filter: `batch`
- ¿Aparece el request?
- ¿Qué status code tiene?
- ¿Cuánto tardó?

---

**¡Ahora sí, probá y pegame los logs completos!** 🚀
