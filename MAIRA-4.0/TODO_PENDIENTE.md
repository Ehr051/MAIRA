# 🎯 MAIRA 4.0 - TODO PENDIENTE (Consolidado)

**Fecha:** 15 de octubre de 2025  
**Última actualización:** Consolidación de todos los .md  
**Estado:** Documento maestro de funcionalidades pendientes

---

## 📊 ESTADO GENERAL DEL PROYECTO

### ✅ **LO QUE YA FUNCIONA**

#### **Sistema de Terreno 3D** ✅
- ✅ Generación de terreno desde map Leaflet
- ✅ Elevación real con archivos TIF/Copernicus
- ✅ Resolución adaptativa por zoom (20×20 a 60×60)
- ✅ Vegetación con modelos GLB (trees_low, arbol, bush, grass)
- ✅ Densidad adaptativa (35% vegetación, 50% bosques)
- ✅ Frustum culling para optimización FPS
- ✅ Sistema de progress bar detallado
- ✅ Integración DetectorZoom3D (sugerencia automática)
- ✅ Camera fija 3km altura para vista táctica
- ✅ NaN interpolation para coordenadas sin datos
- ✅ samplingRate validation (mínimo 5)
- ✅ Solo formato GLB (GLTF eliminado por problemas de carga)

#### **Sistema 2D Base** ✅
- ✅ map Leaflet con múltiples capas
- ✅ Planeamiento (MCC/MCCF/elementos)
- ✅ Gestión de turnos (gestorTurnos.js)
- ✅ Gestión de fases (gestorFases.js)
- ✅ Sistema de zoom multi-nivel (estratégico/táctico/operacional)

#### **Modelos 3D Disponibles** ✅
**Formato:** Solo GLB (ubicación: `Client/assets/models/gbl_new/`)

**Vegetación:**
- `trees_low.glb` - 2.4MB - Árboles principales ✅
- `arbol.glb` - 8.9MB - Árbol alto ✅
- `AnimatedOak.glb` - 81MB - Roble animado (NO USAR - muy pesado) ⚠️
- `arbusto.glb` - Arbusto principal ✅
- `bush.glb` - Arbusto alternativo ✅
- `grass.glb` - Pasto bajo ✅

**Unidades (sin animaciones esqueléticas aún):**
- `a_solider_poin_weapon.glb` - Soldado argentino ⚠️
- `russian_soldier.glb` - Soldado ruso ⚠️
- `fsb_operator.glb` - Operador FSB ⚠️
- `tam_tank.glb` - Tanque TAM ⚠️

⚠️ = Modelo existe pero sin animaciones ni texturas correctas

---

## 🚨 PROBLEMAS CRÍTICOS A RESOLVER

### ❌ **1. Sistema de Renderizado de Unidades 3D desde SIDC**
**Prioridad:** 🔴 CRÍTICA  
**Estado:** No implementado  
**Descripción:** 
Actualmente NO se renderizan unidades 3D en el terreno según su código SIDC. El sistema debe:
- Leer SIDC de cada unidad (ej: `SFGPUCII---` = infantería)
- Determinar qué modelo GLB usar según SIDC
- Aplicar escala correcta según magnitud de la unidad
- Renderizar en posición geográfica correcta
- Diferenciar por tipo (infantería, tanques, vehículos)

**Archivos a crear:**
- `Client/js/modules/shared/sidcToModel3D.js` - Mapeo SIDC → modelo GLB

**Ejemplo de implementación:**
```javascript
const SIDC_TO_MODEL = {
    // Infantería
    'SFGPUCII---': { model: 'a_solider_poin_weapon', scale: 1.0 },
    'SFGPUCIM---': { model: 'russian_soldier', scale: 1.0 },
    
    // Blindados
    'SFGPUCTA---': { model: 'tam_tank', scale: 1.0 },
    
    // Según magnitud:
    // Team (4-6 soldados): scale 0.8, 1 modelo
    // Squad (8-10): scale 1.0, 2-3 modelos agrupados
    // Platoon (30-40): scale 1.2, formación táctica
    // Company (100+): símbolo 2D, no 3D individual
};
```

**Testing:**
- [ ] Crear función `getModelFromSIDC(sidc)`
- [ ] Integrar en `test-terrain-from-map-OPTIMIZADO.html`
- [ ] Probar con diferentes tipos de unidades
- [ ] Verificar escalas según magnitud

---

### ❌ **2. Medidas de Coordinación (MCC y MCCF) en 3D**
**Prioridad:** 🔴 ALTA  
**Estado:** No implementado  
**Descripción:**
MCC y MCCF son elementos de planeamiento (líneas de coordinación, zonas de control). Deben renderizarse en 3D:
- **MCC (Medida de Coordinación):** Líneas verticales en terreno (ej: Línea de Control, Límite de Avance)
- **MCCF (Medida de Coordinación y Fuego):** Zonas 3D (ej: Zona de Fuego Libre, No-Go Area)

**Visualización requerida:**
- MCC: Tubos verticales tipo "muro de luz" siguiendo path 2D
- MCCF: Áreas sombreadas con transparencia, elevadas sobre terreno
- Colores según tipo (rojo=restricción, verde=permiso, amarillo=precaución)

**Archivos a modificar:**
- `Client/js/services/TerrainGenerator3D.js` - Agregar `renderMCC()` y `renderMCCF()`

**Ejemplo:**
```javascript
function renderMCC(mccData) {
    mccData.forEach(mcc => {
        const points = mcc.coordinates.map(coord => 
            latLngToTerrainPosition(coord.lat, coord.lng)
        );
        
        // Crear tubo vertical
        const geometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(points),
            100, // segments
            2,   // radius
            8,   // radial segments
            false
        );
        
        const material = new THREE.MeshBasicMaterial({
            color: mcc.color,
            transparent: true,
            opacity: 0.7
        });
        
        scene.add(new THREE.Mesh(geometry, material));
    });
}
```

---

### ❌ **3. Animaciones de Unidades 3D (Mixamo)**
**Prioridad:** 🟡 MEDIA (después de renderizar unidades)  
**Estado:** Guía disponible, no implementado  
**Descripción:**
Las unidades 3D actualmente NO tienen animaciones esqueléticas. Son "estatuas deslizantes".

**Problema identificado por usuario:**
> "un soldado de infanteria marcha a 4km por hora... tienen una ametralladora o un rifle.. la animacion no deberia ser igual que la del tanque.. jaja"

**Animaciones necesarias:**

**Infantería:**
- `idle.fbx` - Parado en posición
- `walk.fbx` - Caminando 4-5 km/h
- `run.fbx` - Corriendo (futuro)
- `shoot.fbx` - Disparando
- `death.fbx` - Muerte

**Tanques:**
- Rotación de torreta independiente del chasis
- Retroceso al disparar
- NO necesitan animación de "caminar"

**Proceso (documentado en GUIA_ANIMACIONES_MIXAMO.md):**
1. Convertir GLB → FBX con Blender
2. Subir a Mixamo (https://www.mixamo.com)
3. Aplicar auto-rigging
4. Descargar animaciones en FBX
5. Convertir FBX+animaciones → GLB con script Python
6. Implementar AnimationMixer en `test-terrain-from-map-OPTIMIZADO.html`

**Script disponible:**
- `convert_mixamo_to_glb.py` - Ya existe en raíz

**Archivos a modificar:**
- `test-terrain-from-map-OPTIMIZADO.html` - Agregar THREE.AnimationMixer
- `GLTFModelLoader.js` - Detectar y cargar clips de animación

---

### ⚠️ **4. Contenedor de Zoom (DetectorZoom3D) Incorrecto**
**Prioridad:** 🟡 BAJA (funcional pero mejorable)  
**Estado:** Usuario reporta que activa "contenedor diferente"  
**Descripción:**
Usuario dice: "el zoom si aparece el carte... pero no es nuestra generacion de 3d"

**Problema:**
DetectorZoom3D actualmente llama a `window.createFullView3D()` pero puede estar usando un contenedor diferente al esperado.

**Investigación necesaria:**
- [ ] Revisar qué contenedor HTML usa DetectorZoom3D
- [ ] Verificar si `#loading-modal` es el correcto o hay otro activo
- [ ] Comparar con flujo manual "Generar Terreno 3D"

**Archivos a revisar:**
- `Client/js/modules/gaming/detectorZoom3D.js`
- `test-terrain-from-map-OPTIMIZADO.html` líneas 887-892, 1780, 1950-1969

---

### ⚠️ **5. Panel Integrado - Clicks no Responden (Juego de Guerra)**
**Prioridad:** 🟠 ALTA (afecta planeamiento en juego)  
**Estado:** Regresión reciente  
**Descripción:**
En `juegodeguerra.html`:
- ✅ ANTES: Clicks en map funcionaban (marcar sector, zonas despliegue)
- ❌ AHORA: Clicks no responden
- ✅ Consola: Cambios de fase se logean pero UI no actualiza
- ❌ Botones: No se habilitan/deshabilitan según fase

**Causa probable:**
Event listeners Leaflet conflicto con Panel Integrado agregado recientemente

**Acción requerida:**
Usuario traerá archivos ANTES Panel Integrado para comparar

---

## 🎯 FUNCIONALIDADES PENDIENTES (Por Prioridad)

### 🔴 **PRIORIDAD CRÍTICA**

#### 1. ⚠️ Sistema SIDC → Modelos 3D
- [ ] Crear `sidcToModel3D.js` con mapeo completo
- [ ] Implementar función `getModelFromSIDC(sidc)`
- [ ] Implementar escalado según magnitud de unidad
- [ ] Integrar en generación de terreno
- [ ] Testing con diferentes tipos (infantería, tanques, artillería)

**Tiempo estimado:** 2-3 horas  
**Dependencias:** Ninguna (todo el código base ya existe)  
**Archivos nuevos:** 1 (`sidcToModel3D.js`)  
**Archivos a modificar:** 1 (`TerrainGenerator3D.js`)

---

#### 2. ⚠️ Renderizado MCC/MCCF en 3D
- [ ] Implementar `renderMCC()` - Líneas verticales de coordinación
- [ ] Implementar `renderMCCF()` - Zonas 3D con transparencia
- [ ] Sistema de colores según tipo de medida
- [ ] Etiquetas 3D para identificación
- [ ] Testing con diferentes tipos de medidas

**Tiempo estimado:** 3-4 horas  
**Dependencias:** Sistema SIDC terminado (para contexto)  
**Archivos a modificar:** 1 (`TerrainGenerator3D.js`)

---

### 🟠 **PRIORIDAD ALTA**

#### 3. ⚠️ Sistema de Gestión de Órdenes Híbrido 2D/3D
- [ ] Crear `gestorOrdenes.js` unificado 2D/3D
- [ ] Implementar cola de órdenes por equipo
- [ ] Sistema de sincronización 2D ↔ 3D
- [ ] Protocolo de comunicación (localStorage o postMessage)
- [ ] Testing flujo completo: orden en 2D → ejecución en 3D

**Tiempo estimado:** 4-6 horas  
**Dependencias:** Sistema SIDC terminado  
**Archivos nuevos:** 1 (`gestorOrdenes.js`)  
**Archivos a modificar:** 2 (`juegodeguerra.html`, `test-terrain-from-map-OPTIMIZADO.html`)

**Detalle:**
El sistema debe permitir:
- Dar órdenes en 2D (juegodeguerra.html)
- Entrar a 3D (test-terrain-from-map-OPTIMIZADO.html)
- Ver órdenes dadas en 2D renderizadas en 3D
- Dar órdenes NUEVAS en 3D considerando terreno/vegetación
- Salir de 3D y ver órdenes actualizadas en 2D
- Ejecutar TODAS las órdenes al cambio de turno

---

#### 4. ⚠️ Fix Panel Integrado (juegodeguerra.html)
- [ ] Comparar versión ANTES vs DESPUÉS Panel Integrado
- [ ] Identificar event listeners que causan conflicto
- [ ] Restaurar funcionalidad de clicks en map
- [ ] Testing: marcar sectores, zonas de despliegue
- [ ] Verificar habilitación/deshabilitación de botones por fase

**Tiempo estimado:** 1-2 horas  
**Dependencias:** Archivos históricos (usuario debe proveerlos)  
**Archivos a modificar:** 1 (`juegodeguerra.html`)

---

### 🟡 **PRIORIDAD MEDIA**

#### 5. ⚠️ Animaciones de Unidades (Mixamo Pipeline)
- [ ] Convertir modelos existentes GLB → FBX
- [ ] Subir a Mixamo y aplicar auto-rigging
- [ ] Descargar animaciones: idle, walk, shoot, death
- [ ] Convertir FBX+anims → GLB con script Python
- [ ] Implementar THREE.AnimationMixer en carga de modelos
- [ ] Sistema de transición de estados (idle ↔ walk ↔ shoot)
- [ ] Rotación de torreta para tanques (procedural)
- [ ] Testing con diferentes tipos de unidades

**Tiempo estimado:** 6-8 horas (incluye aprendizaje Mixamo)  
**Dependencias:** Sistema SIDC terminado (para saber cuándo animar qué)  
**Archivos a modificar:** 2 (`GLTFModelLoader.js`, `test-terrain-from-map-OPTIMIZADO.html`)  
**Scripts a usar:** `convert_mixamo_to_glb.py` (ya existe)

---

#### 6. ⚠️ Sistema de Efectos Visuales de Combate
- [ ] Explosiones con sistema de partículas (THREE.Points)
- [ ] Humo persistente en zona de impacto
- [ ] Trazas de proyectiles (balas, cohetes)
- [ ] Efectos de impacto en terreno
- [ ] Daño visual progresivo en modelos
- [ ] Efectos ambientales (polvo al moverse, lluvia, niebla)

**Tiempo estimado:** 8-10 horas  
**Dependencias:** Animaciones terminadas (para sincronizar efectos)  
**Archivos nuevos:** 1 (`BattleEffects.js`)  
**Archivos a modificar:** 1 (`test-terrain-from-map-OPTIMIZADO.html`)

---

#### 7. ⚠️ Sistema de Audio Contextual
- [ ] Audio dinámico según nivel de zoom
- [ ] Audio 3D posicional (Web Audio API)
- [ ] Sonidos de combate (disparos, explosiones)
- [ ] Sonidos de movimiento (motores, pasos)
- [ ] Música dinámica según situación
- [ ] Radio chatter (comunicaciones)

**Tiempo estimado:** 4-6 horas  
**Dependencias:** Ninguna (independiente)  
**Archivos nuevos:** 1 (`AudioManager.js`)

---

### 🟢 **PRIORIDAD BAJA (Futuro)**

#### 8. ⚠️ IA de Comportamiento de Unidades
- [ ] Pathfinding con A* algorithm
- [ ] Formaciones automáticas según terreno
- [ ] Reacción a contacto enemigo
- [ ] Sistema de moral y comportamiento
- [ ] Reabastecimiento automático

**Tiempo estimado:** 10-15 horas  
**Dependencias:** Todo lo anterior terminado

---

#### 9. ⚠️ Sistema LOD (Level of Detail) Avanzado
- [ ] 3 niveles de detalle por distancia
- [ ] Cambio dinámico de geometría
- [ ] LOD para vegetación también
- [ ] Occlusion culling (objetos detrás de colinas)

**Tiempo estimado:** 6-8 horas  
**Dependencias:** Sistema base funcionando completamente  
**Nota:** Frustum culling actual ya da +30-40% FPS, LOD es opcional

---

## 🗑️ TAREAS DE LIMPIEZA

### 1. ⚠️ Eliminar Referencias a GLTF
**Descripción:** El formato GLTF fue eliminado, solo se usa GLB ahora por problemas de carga de texturas.

**Archivos a limpiar:**
- [ ] Buscar todos los `.md` con referencias a GLTF
- [ ] Actualizar documentación mencionando solo GLB
- [ ] Eliminar scripts obsoletos de conversión GLTF
- [ ] Limpiar comentarios en código que mencionen GLTF

**Comando sugerido:**
```bash
grep -r "gltf\|GLTF" --include="*.md" docs/
grep -r "gltf\|GLTF" --include="*.js" Client/js/
```

---

### 2. ⚠️ Consolidar Documentación
**Descripción:** Hay muchos .md con información duplicada o desactualizada.

**Archivos a revisar:**
- [ ] `ESTRATEGIA_OPTIMIZACION_3D.md` - Muchas optimizaciones ya implementadas
- [ ] `OPTIMIZACIONES_SESION_OCT15.md` - Session log, archivar
- [ ] `SISTEMA_HIBRIDO_TERRENO_README.md` - Modo virtual no se usa
- [ ] `docs/ROADMAP_FUNCIONALIDADES.md` - Duplica este documento
- [ ] `docs/SISTEMA_ANIMACIONES_UNIDADES.md` - Incorporar aquí

**Acción:**
- [ ] Archivar logs de sesiones en `docs/sessions/`
- [ ] Consolidar roadmaps en este archivo único
- [ ] Marcar funcionalidades completadas con ✅
- [ ] Eliminar documentos obsoletos

---

### 3. ⚠️ Eliminar Código/Archivos Muertos
**Descripción:** Hay archivos HTML de test antiguos y código comentado.

**Archivos a revisar:**
- [ ] `backup_gltf_models/` - Solo si NO se usan más
- [ ] Scripts de conversión GLTF si GLB es definitivo
- [ ] Test files antiguos (MAIRA-*.html en raíz)

---

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### **FASE 1: Renderizado Básico (1-2 días)**
```
1. Sistema SIDC → Modelos 3D           [CRÍTICO] ✅ Primero
2. Renderizado MCC/MCCF en 3D          [CRÍTICO] ✅ Segundo
3. Testing exhaustivo de ambos         [CRÍTICO] ✅ Tercero
```

### **FASE 2: Integración 2D/3D (2-3 días)**
```
4. gestorOrdenes híbrido 2D/3D         [ALTA] ✅ Cuarto
5. Protocolo comunicación localStorage [ALTA] ✅ Quinto
6. Testing flujo completo              [ALTA] ✅ Sexto
```

### **FASE 3: Animaciones (3-4 días)**
```
7. Pipeline Mixamo setup               [MEDIA] ✅ Séptimo
8. Animaciones infantería              [MEDIA] ✅ Octavo
9. Rotación torretas tanques           [MEDIA] ✅ Noveno
10. Testing animaciones                [MEDIA] ✅ Décimo
```

### **FASE 4: Efectos y Pulido (1-2 semanas)**
```
11. Efectos visuales de combate        [MEDIA] ✅ Opcional
12. Sistema de audio                   [MEDIA] ✅ Opcional
13. IA de comportamiento               [BAJA] ✅ Futuro
14. LOD avanzado                       [BAJA] ✅ Futuro
```

---

## 🎓 RECURSOS DISPONIBLES

### **Documentos de Referencia**
- `docs/ARQUITECTURA_INTEGRACION_2D_3D.md` - Flujo completo 2D ↔ 3D
- `docs/GUIA_ANIMACIONES_MIXAMO.md` - Pipeline completo Mixamo
- `docs/SISTEMA_ANIMACIONES_UNIDADES.md` - Spec técnica animaciones
- `OPTIMIZACIONES_SESION_OCT15.md` - Optimizaciones ya aplicadas

### **Scripts Disponibles**
- `convert_mixamo_to_glb.py` - FBX+anims → GLB
- `convert_glb_to_fbx.py` - GLB → FBX para Mixamo
- `embed_textures.py` - Embedder de texturas (si necesario)

### **Modelos 3D Actuales**
- **Ubicación:** `Client/assets/models/gbl_new/`
- **Formato:** Solo GLB (GLTF eliminado)
- **Vegetación:** 6 modelos funcionales (trees_low, arbol, bush, grass, etc)
- **Unidades:** 4 modelos base (soldados + tanque) SIN animaciones aún

---

## 🐛 BUGS CONOCIDOS (Sin prioridad asignada)

### 1. ⚠️ DetectorZoom3D usa contenedor incorrecto
**Descripción:** Usuario reporta que activa "contenedor diferente"  
**Impacto:** Baja funcionalidad (3D se genera pero en lugar equivocado)  
**Investigación pendiente:** Comparar con flujo manual

### 2. ⚠️ Panel Integrado rompe clicks de map
**Descripción:** Regresión reciente en juegodeguerra.html  
**Impacto:** Alta funcionalidad (impide planeamiento en juego)  
**Necesita:** Archivos históricos para comparación

### 3. ⚠️ AnimatedOak.glb muy pesado (81MB)
**Descripción:** Modelo de roble animado causa lentitud  
**Solución:** ✅ YA REMOVIDO de densityConfig  
**Estado:** Cerrado ✅

---

## ✅ FUNCIONALIDADES COMPLETADAS (Última Sesión)

**Fecha:** 15 de octubre de 2025  
**Commits:** 6 commits (05900664, b8f6b53f, 41d155e4, 061eaafa, fc9fd8d8, 2c4f5818)

1. ✅ **NaN Interpolation** - Elevaciones sin datos ahora interpolan con vecinos
2. ✅ **DetectorZoom3D Integration** - Sugerencia automática al hacer zoom ≥14
3. ✅ **Timing Fix Vista 3D** - Ya no se cierra sola al terminar generación
4. ✅ **Resolution Optimization** - 30×30 para zoom 15-16 táctica (40-50 FPS)
5. ✅ **Vegetation Models** - Solo 2 modelos livianos (11MB vs 90MB antes)
6. ✅ **Camera Fixed Height** - 3km fija para vista táctica consistente
7. ✅ **Vegetation Density** - 35-50% para visibilidad desde vista aérea
8. ✅ **samplingRate Validation** - Mínimo 5 para evitar HANG

---

## 📞 CONTACTO Y DECISIONES

**Decisiones pendientes:**
- ¿Implementar IA de comportamiento o dejarlo para v2.0?
- ¿Sistema LOD avanzado necesario o frustum culling suficiente?
- ¿Audio 3D prioritario o puede esperar?

**Usuario debe decidir:**
- Orden de prioridades si difiere de recomendado
- Presupuesto de tiempo para cada fase
- Funcionalidades "must-have" vs "nice-to-have"

---

**FIN DEL DOCUMENTO**  
*Este es el documento maestro consolidado. Todos los .md antiguos pueden archivarse.*
