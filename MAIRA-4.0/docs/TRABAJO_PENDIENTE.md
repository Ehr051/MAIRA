# 🚧 MAIRA 4.0 - TRABAJO PENDIENTE

**Fecha creación**: 17 de octubre de 2025  
**Última actualización**: 17 de octubre de 2025 19:15  
**Estado**: Documento consolidado único

---

## 🎯 ESTADO ACTUAL

**Última acción**: Sistema 3D completo con Modal + Loading + Luz Alta
**Archivos modificados**: 
- `Client/js/modules/modal3DConfiguration.js` (NUEVO)
- `Client/js/modules/loadingScreen3D.js` (NUEVO)
- `Client/js/services/maira3DMaster.js` (luz + método activarVista3DConModal)
- `Client/planeamiento_integrado.html` (imports + botón actualizado)

**🎉 SISTEMA COMPLETO IMPLEMENTADO**:
1. ✅ Modal de configuración con 4 opciones (terreno, calidad, vegetación, luz)
2. ✅ Pantalla de carga profesional con spinner + barra progreso
3. ✅ Luz alta por defecto (ambient: 1.2, directional: 1.8)
4. ✅ Método `activarVista3DConModal()` con flujo completo
5. ✅ Botón "Generar Vista 3D" en menú Herramientas

**� ACCIÓN REQUERIDA**: **RECARGA LA PÁGINA**
```
http://172.16.3.225:5000/planeamiento_integrado.html
```

**Flujo esperado**:
1. Click en "Generar Vista 3D" (menú Herramientas)
2. → Modal aparece con opciones de configuración
3. → Usuario selecciona y confirma
4. → Pantalla de carga con spinner (2-3 segundos)
5. → Vista 3D se activa con escenario generado
6. → Botón cambia a "Cerrar Vista 3D"
7. → Click nuevamente para cerrar

---

## ✅ COMPLETADO HOY (17 octubre 2025)

### 1. Backend TIF con rasterio ✅
- Endpoint `/api/elevation/process/<filepath>` → 5x más rápido
- Fallback automático: Backend → Frontend → Procedimental
- Archivos: `app.py`, `elevationBackendAdapter.js`, `TerrainGenerator3D.js`

### 2. Interpolación Optimizada ✅
- 70-30 → 50-50 balance para terreno más suave
- Archivo: `elevationHandler.js` línea 977

### 3. Limpieza Vista 3D ✅
- 10 pasos de disposal exhaustivo
- Archivo: `vista3DManager.js` líneas 133-220
- Sin memory leaks

### 4. Botón Vista 3D Unificado ✅
- UN SOLO botón en menú lateral
- Toggle: "Generar Vista 3D" ↔ "Cerrar Vista 3D"
- Eliminados: botones en zoom control, modal automático
- Archivos: `planeamiento.html`, `mapaP.js`, `detectorZoom3D.js`

---

## 🔴 CRÍTICO - PENDIENTE

### 1. Testing Botón Vista 3D ⚠️ **BLOQUEADO - EN FIX**
**Problema identificado**: THREE.js no está definido cuando se carga maira3DMaster.js

**Error en consola**:
```
maira3DMaster.js:48 Uncaught ReferenceError: THREE is not defined
⚠️ Sistema 3D MAIRA no disponible - maira3DMaster.js no cargado
```

**Causa raíz**: 
- THREE.js carga asíncrono desde CDN (línea 137)
- maira3DMaster.js carga síncrono (línea 176) → SE EJECUTA PRIMERO
- Línea 48 de maira3DMaster.js: `new THREE.Raycaster()` → ERROR: THREE is not defined
- `window.maira3DSystem` nunca se crea → Botón falla

**Fix aplicado** (17 octubre 19:15 - SEGUNDA ITERACIÓN):
1. ✅ Implementado sistema de callbacks encadenado (líneas 54-145)
2. ✅ Contador de dependencias: 2/2 (GLTFLoader + OrbitControls)
3. ✅ Función `loadMaira3DMaster()` solo ejecuta cuando counter === 2
4. ✅ Comentada carga síncrona línea 176: `<!-- <script src="js/services/maira3DMaster.js"></script> -->`
5. ✅ Flag `window.threeJsReady` para tracking de estado

**Orden de carga correcto**:
```
THREE.js (CDN/local) → 
  GLTFLoader loads → counter++ (1/2) → 
  OrbitControls loads → counter++ (2/2) → 
  checkAllLoaded() detecta 2/2 → 
  loadMaira3DMaster() ejecuta → 
  window.maira3DSystem creado → 
  Botón Vista 3D funcional ✅
```

**Próximo paso**: 🔄 **RECARGA LA PÁGINA** `http://172.16.3.225:5000/planeamiento_integrado.html` y verifica consola:
- ✅ Debe mostrar: `✅ maira3DMaster.js cargado correctamente`
- ✅ NO debe mostrar: `THREE is not defined`
- ✅ Botón "Generar Vista 3D" debe funcionar sin errores

### 1. Unificar Botones Vista 3D ✅ **COMPLETADO**
**Implementado**: Botón único de toggle en menú lateral

**Cambios realizados**:
1. ✅ Botón en `planeamiento.html` (línea 308) cambiado a "Generar Vista 3D"
2. ✅ Event listener actualizado para toggle con cambio de texto (líneas 1117-1145)
3. ✅ Botones duplicados eliminados en `mapaP.js` (líneas 700-710)
4. ✅ Activación automática deshabilitada en `detectorZoom3D.js` (línea 14)
5. ✅ Cambios sincronizados a `planeamiento_integrado.html`

**Funcionamiento**:
- Texto inicial: **"Generar Vista 3D"**
- Al hacer clic → Oculta map, genera terreno 3D, cambia a **"Cerrar Vista 3D"**
- Al volver a hacer clic → Cierra vista 3D, muestra map, cambia a **"Generar Vista 3D"**

**Archivos modificados**:
- `Client/planeamiento.html` (líneas 308, 1117-1145)
- `planeamiento_integrado.html` (sincronizado)
- `Client/js/common/mapaP.js` (líneas 700-710)
- `Client/js/modules/gaming/detectorZoom3D.js` (líneas 1-40)

**Sistema usado**:
- `window.maira3DSystem.toggleVista3DModular()` (definido en maira3DMaster.js línea 1850)
- Método ya existente, solo se unificó el punto de entrada

---

## ⚠️ ALTA PRIORIDAD

### 2. Renderizado a Ciertas Alturas
**Problema**: map desaparece o se corta a ciertas alturas de cámara
**Posibles causas**:
- Límites de cámara incorrectos
- Frustum culling demasiado agresivo
- Clipping planes (near/far) mal configurados
**Archivos a investigar**:
- `Client/js/services/TerrainGenerator3D.js` (configuración cámara)
- `Client/js/modules/gaming/vista3DManager.js` (renderer settings)
**Estado**: NO INICIADO

### 3. Testing Integración Completa
**Pendiente validar**:
- ✅ Backend TIF funciona (instalado rasterio + numpy)
- ⏳ Carga de terreno < 500ms
- ⏳ Sin saltos de elevación
- ✅ Limpieza recursos (sin memory leaks)
- ⏳ Botón único vista 3D
- ⏳ Compatible Local + Render

**Script de testing**: `./test-backend-integration.sh`

**Resultado actual**:
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

## 📋 MEDIA PRIORIDAD

### 4. Reemplazar planeamiento.html
**Después de validar todo**:
```bash
cp planeamiento.html planeamiento_backup.html
cp planeamiento_integrado.html planeamiento.html
```
**Estado**: PENDIENTE (esperando validación)

### 5. Deploy a Render
**Pendiente**:
- Verificar rutas de tiles en producción
- Testing en ambiente Render
- Verificar rasterio se instala correctamente
**Estado**: NO INICIADO

---

## 📚 DOCUMENTACIÓN (Consolidar después)

### Archivos MD a Revisar/Eliminar
Total encontrado: **164 archivos .md**

**Candidatos para ELIMINAR** (información ya incluida aquí):
- ❌ `INTEGRACION_BACKEND_TIF.md` (técnico, ya implementado)
- ❌ `RESUMEN_INTEGRACION_COMPLETA.md` (duplicado)
- ❌ `GUIA_PRUEBAS_BACKEND_TIF.md` (solo para testing inicial)
- ❌ `OPTIMIZACIONES_SESION_OCT15.md` (histórico)
- ❌ `FIX_ELEVACIONES_EXTREMAS.md` (ya solucionado)
- ❌ `FIX_FONT_AWESOME_PLANEAMIENTO.md` (específico, resuelto)
- ❌ `POST_IMPLEMENTACION_FIX_CLICKS_MAPA.md` (histórico)
- ❌ `POST_FIX_EDICION_COMPLETO.md` (histórico)

**Candidatos para MANTENER**:
- ✅ `README.md` (principal del proyecto)
- ✅ `TODO_PENDIENTE.md` → **FUSIONAR CON ESTE DOCUMENTO**
- ✅ `AUDITORIA_COMPLETA_MAIRA_16OCT2025.md` (referencia técnica)
- ✅ `SISTEMA_HIBRIDO_TERRENO_README.md` (arquitectura)

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### HOY (17 de octubre)
1. ✅ Consolidar documentación (este archivo)
2. 🔄 **Unificar botón Vista 3D** (EN PROGRESO)
   - Investigar sistema actual
   - Crear botón único funcional
   - Eliminar activación automática
3. ⏳ Testing integración backend
4. ⏳ Fix renderizado alturas

### ESTA SEMANA
1. Deploy a Render
2. Testing en producción
3. Limpiar archivos MD obsoletos
4. Optimizaciones adicionales si es necesario

---

## 📝 NOTAS TÉCNICAS

### Sistema 3D Actual
**Problema identificado**:
- Todos los archivos llaman a `window.maira3DSystem.cambiarAVista3D()`
- Pero `maira3DSystem.js` **NO EXISTE**
- Existe `maira3DMaster.js` pero no exporta `maira3DSystem`

**Archivos que llaman a maira3DSystem**:
- `planeamiento.html` (líneas 1123-1124)
- `mapaP.js` (líneas 714-715, 742-743)
- `TerrainGenerator3D.js` (múltiples referencias al objeto)

**Investigación pendiente**:
- ¿`maira3DMaster.js` debe exportar `window.maira3DSystem`?
- ¿O hay otro archivo que lo hace?
- ¿O necesitamos crear el sistema desde cero?

### Backend TIF - Rutas Producción
```python
# Local
'Client/Libs/mapbox-terrain/mapbox-terrain-rgb/data_argentina/Altimetria_Mini_Tiles'

# Render
'/opt/render/project/src/static/tiles/data_argentina/Altimetria'

# Fallback
'static/tiles/data_argentina/Altimetria'
```

---

## 🔄 HISTORIAL DE CAMBIOS

### 17 de octubre de 2025
- ✅ Backend TIF completo
- ✅ Interpolación optimizada 50-50
- ✅ Limpieza recursos vista 3D
- ✅ Documento consolidado creado
- 🔄 Iniciado unificación botón 3D

### 16 de octubre de 2025
- ✅ Auditoría completa sistema
- ✅ Identificación problemas elevación
- ✅ Fix clicks en map

### 15 de octubre de 2025
- ✅ Optimizaciones varias
- ✅ Sistema logs debugging

---

**ESTE ES EL ÚNICO DOCUMENTO DE TRABAJO**  
Actualizar aquí todo el progreso. No crear más .md
