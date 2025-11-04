# 🧪 GUÍA DE TESTING - Batch Elevation API

**Fecha:** 19 oct 2025  
**Estado:** 🟢 SISTEMA LISTO PARA PROBAR

---

## ✅ PRE-REQUISITOS (VERIFICADOS)

```bash
✅ Flask corriendo: PID 71485
✅ Puerto 5000: ESCUCHANDO
✅ Endpoint batch: FUNCIONAL
✅ Archivos guardados: TerrainController3D.js, terrain3d-init.js
```

---

## 🎯 PASOS PARA PROBAR

### PASO 1: Abrir la aplicación

**En tu navegador favorito, abre:**
```
http://127.0.0.1:5000/Client/planeamiento_integrado.html
```

**Espera a que cargue completamente. Deberías ver:**
- ✅ map Leaflet visible con tiles
- ✅ Sidebar izquierdo con menú
- ✅ NO hay canvas 3D tapando el map

---

### PASO 2: Abrir la consola del navegador

**Presiona:**
- **Chrome/Edge:** `F12` o `Cmd+Option+I` (Mac)
- **Firefox:** `F12` o `Cmd+Option+K` (Mac)
- **Safari:** `Cmd+Option+C` (Mac)

**Ve a la pestaña "Console"**

**Verifica que aparezca:**
```javascript
✅ Sistema 3D listo - esperando clic en "Generar Vista 3D"
```

---

### PASO 3: Hacer clic en "Generar Vista 3D"

**Busca el botón en el sidebar izquierdo:**
- 📍 Icono: 🧊 (cubo)
- 📍 Texto: "Generar Vista 3D"

**Haz clic UNA VEZ**

---

### PASO 4: Observar el proceso

**Deberías ver en la CONSOLA (en orden):**

```javascript
🎬 Iniciando generación de vista 3D...

// INICIALIZACIÓN (primera vez)
🚀 Primera vez: Inicializando sistema 3D...
🗺️ Inicializando map...
♻️ Reutilizando map Leaflet existente
🛰️ Agregando capa satelital al map existente
✅ Sistema inicializado correctamente

// CAPTURA
📸 Capturando map...
✅ map capturado correctamente
📍 Dimensiones: 512x512
📍 Zoom: 13, Bounds: -34.XXXX, -58.XXXX

// ANÁLISIS
🔍 Analizando imagen...
✅ Análisis completado
📊 XX features detectadas

// GENERACIÓN (OPTIMIZADA CON BATCH)
🚀 Iniciando workflow completo (modo optimizado)...
📐 Calculando grid de coordenadas...
📍 Grid generado: 4225 coordenadas (64x64)
📡 Solicitando 4225 elevaciones al servidor...
✅ Recibidas 4225 elevaciones en 0.XXs
📦 Tiles usados: simulado
🏗️ Construyendo geometría 3D...
📊 Rango elevación: XXm - XXm
🎨 Aplicando textura satelital...
✅ Terreno 3D generado exitosamente (batch API)
📏 Dimensiones: XXXXm x XXXXm
```

**Deberías ver en la PANTALLA:**

1. **Modal de progreso** (barra azul moviéndose):
   ```
   🚀 Generando terreno 3D (modo optimizado)...
   [████████░░░░] 60%
   ```

2. **Canvas 3D activándose** (fondo negro/celeste)

3. **Terreno 3D apareciendo** con:
   - 🗺️ Textura del map satelital
   - 🏔️ Elevación (montañas/valles)
   - 🎨 Material con iluminación

---

### PASO 5: Interactuar con el terreno

**Controles del mouse:**
- **Rotar:** Clic izquierdo + arrastrar
- **Zoom:** Rueda del mouse
- **Pan:** Clic derecho + arrastrar

**Controles del teclado:**
- **W/A/S/D:** Mover cámara
- **Q/E:** Subir/bajar
- **R/F:** Rotar

---

## ✅ CRITERIOS DE ÉXITO

### Funcionalidad
- [ ] Modal de progreso aparece inmediatamente
- [ ] Progress bar se mueve suavemente (NO tildado)
- [ ] Consola muestra "Solicitando 4225 elevaciones"
- [ ] Terreno aparece en **~2-3 segundos** (máximo 5s)
- [ ] Mesh 3D es visible
- [ ] Tiene textura del map satelital
- [ ] Tiene elevación (NO es plano)

### Rendimiento
- [ ] NO hay "tildado" durante generación
- [ ] FPS fluido después de generar (30+ fps)
- [ ] Controles responden bien
- [ ] Zoom funciona suavemente

### Consola
- [ ] NO hay errores en rojo
- [ ] Logs en orden correcto
- [ ] Tiempo de batch API: < 1 segundo
- [ ] Metadata muestra "simulado" en tiles

---

## ❌ POSIBLES ERRORES Y SOLUCIONES

### Error: "Failed to fetch"
**Causa:** Flask no responde  
**Solución:**
```bash
# Verificar Flask
ps aux | grep python3.*app.py

# Si no corre, reiniciar
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
python3 app.py
```

### Error: "Primero captura el map"
**Causa:** Workflow interrumpido  
**Solución:** Recargar página (F5) e intentar de nuevo

### Error: CORS
**Causa:** Abriste desde file:// en vez de http://  
**Solución:** SIEMPRE usar `http://127.0.0.1:5000/Client/...`

### Error: "THREE is not defined"
**Causa:** Three.js no cargó  
**Solución:** Recargar página y esperar a que cargue completamente

### Error: Canvas negro sin terreno
**Causa:** Geometría no se agregó a escena  
**Solución:** Compartir log completo de consola

---

## 📊 MÉTRICAS ESPERADAS

### Tiempos (aprox.)
```
Captura map:     ~1.0s
Análisis imagen:  ~0.5s
Grid 64x64:       ~0.1s
Batch API:        ~0.3s  ← CRÍTICO: Debe ser < 1s
Geometría 3D:     ~0.5s
Textura:          ~0.2s
-------------------------
TOTAL:            ~2.6s
```

### Requests de red
```
HTTP Requests durante generación:
- leaflet-image (tiles): ~10-20 requests
- /api/elevation/batch: 1 request  ← ÚNICO request de elevación
- Textures/models: 0-5 requests

Total: ~15-30 requests (antes: 4000+)
```

### Geometría
```
Resolución: 64x64
Vértices: 4,225 (65 × 65)
Triángulos: 8,192 (64 × 64 × 2)
Textura: 512×512 px (del map)
```

---

## 🐛 QUÉ REPORTAR SI FALLA

**Copia y pega esto en tu respuesta:**

```markdown
## 🐛 REPORTE DE ERROR

### Navegador
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### ¿En qué paso falló?
- [ ] No carga el map inicial
- [ ] Click en botón no hace nada
- [ ] Modal aparece pero se queda tildado
- [ ] Batch API falla
- [ ] Geometría no se crea
- [ ] Canvas negro sin terreno
- [ ] Otro: ___________

### Log de consola
```javascript
// Pegar TODO el log de la consola aquí
```

### Screenshot (opcional)
// Pegar screenshot del error

### Observaciones
// ¿Qué esperabas vs qué pasó?
```

---

## 🎉 SI TODO FUNCIONA

**Comparte esto:**
```markdown
✅ FUNCIONA!

- Tiempo total: ~X segundos
- Terreno visible: SÍ
- Tiene elevación: SÍ
- Textura OK: SÍ
- Controles OK: SÍ
- Performance: XX FPS

Screenshot: [adjuntar]

Próximo paso: Integrar tiles TIF reales 🚀
```

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DEL TEST

### Si funciona:
1. ✅ Marcar test como exitoso
2. 🔥 Integrar tiles TIF reales en backend
3. 🌳 Agregar vegetación con NDVI
4. 🎮 Preparar para juego de guerra

### Si falla:
1. 📋 Compartir log completo
2. 🔍 Diagnosticar issue específico
3. 🛠️ Fix aplicado
4. 🔄 Re-test

---

**¿LISTO? ¡Vamos a probarlo!** 🎯

Abre: `http://127.0.0.1:5000/Client/planeamiento_integrado.html`
