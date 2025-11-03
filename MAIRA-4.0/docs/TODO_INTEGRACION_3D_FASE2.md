# TODO: Integración 3D - Fase 2
**Fecha Inicio:** 19 de octubre de 2025

## 🎯 Objetivo General
Integrar el sistema de terreno 3D optimizado en `planeamiento_integrado.html` siguiendo las mejores prácticas de renderizado de Google Maps/Google Earth/MapArmy.

---

## 📋 FASE 1: Refactorización y Limpieza (ACTUAL)

### ✅ Paso 1.1: Análisis del HTML Actual
- [ ] Identificar todos los scripts inline en `test-terrain-from-map-OPTIMIZADO.html`
- [ ] Mapear dependencias entre funciones
- [ ] Documentar configuraciones críticas

### ✅ Paso 1.2: Migración a Archivos JS Modulares
- [ ] Crear estructura de archivos:
  - [ ] `Client/js/terrain3d/TerrainController3D.js` - Controlador principal
  - [ ] `Client/js/terrain3d/TerrainRenderer3D.js` - Motor de renderizado
  - [ ] `Client/js/terrain3d/TerrainConfigModal.js` - Modal de configuración
  - [ ] `Client/js/terrain3d/CameraController3D.js` - Control de cámara
  - [ ] `Client/js/terrain3d/TerrainOptimizer3D.js` - Optimizaciones de rendimiento
  - [ ] `Client/js/terrain3d/TerrainUI3D.js` - UI y controles

### ✅ Paso 1.3: Testing Post-Migración
- [ ] Verificar que `test-terrain-from-map-OPTIMIZADO.html` funciona igual
- [ ] Comprobar carga de modelos GLTF
- [ ] Validar sistema de vegetación
- [ ] Confirmar elevaciones TIF
- [ ] Probar texturas satelitales

---

## 📋 FASE 2: Integración en Planeamiento

### ✅ Paso 2.1: Diseño de UI en Planeamiento
- [ ] Crear botón "Vista 3D" debajo del control de zoom
  - Mostrar solo a partir de zoom >= 15
- [ ] Agregar opción "Vista 3D" en menú Herramientas
- [ ] Diseñar modal de configuración 3D minimalista

### ✅ Paso 2.2: Modal de Configuración 3D
**Opciones Mínimas:**
- [ ] Resolución (20-100 puntos)
- [ ] Escala vertical (1x - 5x)
- [ ] Densidad vegetación (Baja/Media/Alta)
- [ ] Incluir vegetación (Sí/No)
- [ ] Botón "Generar Terreno 3D"
- [ ] Botón "Cancelar"

### ✅ Paso 2.3: Integración de Scripts
- [ ] Incluir scripts terrain3d en `planeamiento_integrado.html`
- [ ] Conectar con servicios geoespaciales existentes
- [ ] Integrar con `window.map` de Leaflet
- [ ] Configurar eventos de botones

### ✅ Paso 2.4: Testing de Integración
- [ ] Probar generación desde botón de zoom
- [ ] Probar generación desde menú herramientas
- [ ] Verificar modal de configuración
- [ ] Confirmar compatibilidad con panel de edición
- [ ] Validar que no interfiere con funcionalidad 2D

---

## 📋 FASE 3: Optimizaciones (Futuro)

### 🚀 Optimizaciones Inspiradas en Google Maps/Earth
- [ ] **LOD (Level of Detail):** Implementar diferentes niveles según distancia cámara
- [ ] **Tile-based Loading:** Cargar terreno por tiles, no todo de una vez
- [ ] **Frustum Culling:** Solo renderizar lo visible por cámara
- [ ] **Instancing Mejorado:** Usar InstancedMesh para vegetación masiva
- [ ] **Texture Atlasing:** Combinar texturas para reducir draw calls
- [ ] **Web Workers:** Procesamiento en paralelo de elevaciones
- [ ] **Streaming:** Carga progresiva de datos mientras usuario navega

### 🌳 Optimizaciones de Vegetación
- [ ] Sistema de Billboard sprites para vegetación lejana
- [ ] Impostors para árboles distantes
- [ ] Pool de objetos reusables
- [ ] Reducción de polígonos según distancia

---

## 📊 Métricas de Éxito

### Performance Target:
- Carga inicial: < 3 segundos
- FPS mínimo: 30 fps
- Memoria máxima: < 500 MB
- Renderizado terreno 1km²: < 5 segundos

### Funcionalidad:
- ✅ Elevación TIF real
- ✅ Texturas satelitales
- ✅ Vegetación 3D con modelos GLB
- ✅ Navegación fluida (WASD + mouse)
- ✅ Zoom funcional

---

## 🔄 Estado Actual

**Última Actualización:** 19 Oct 2025

### ✅ Completado:
1. Reversión de integración problemática
2. Sistema `test-terrain-from-map-OPTIMIZADO.html` funcional
3. Modelos GLTF cargando correctamente
4. Vegetación renderizando
5. Elevaciones TIF operativas

### 🔨 En Progreso:
- **FASE 1:** Refactorización de HTML a JS modulares

### ⏳ Pendiente:
- FASE 2: Integración en planeamiento
- FASE 3: Optimizaciones avanzadas

---

## 📝 Notas Técnicas

### Referencia Google Maps/Earth:
```
Técnicas de Renderizado:
1. Tile Pyramid: Múltiples niveles de detalle
2. Quadtree: Subdivisión espacial inteligente
3. GPU Instancing: Renderizado masivo eficiente
4. Adaptive Mesh: Densidad según importancia
5. Streaming: Carga just-in-time
```

### Arquitectura Propuesta:
```
TerrainController3D
├── TerrainRenderer3D (motor renderizado)
│   ├── LODManager (niveles detalle)
│   ├── TileManager (gestión tiles)
│   └── FrustumCuller (culling)
├── CameraController3D (navegación)
├── VegetationManager3D (optimizado)
└── TerrainConfigModal (UI)
```

---

## 🎬 Próximos Pasos Inmediatos

1. **AHORA:** Analizar y extraer scripts de `test-terrain-from-map-OPTIMIZADO.html`
2. **SIGUIENTE:** Crear estructura de archivos JS modulares
3. **DESPUÉS:** Testing exhaustivo post-migración
4. **LUEGO:** Integración en `planeamiento_integrado.html`
