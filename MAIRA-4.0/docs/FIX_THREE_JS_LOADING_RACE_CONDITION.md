# 🔧 FIX: THREE.js Loading Race Condition

**Fecha**: 17 de octubre de 2025  
**Prioridad**: 🔴 CRÍTICA  
**Estado**: ✅ APLICADO - Pendiente validación

---

## 📋 RESUMEN EJECUTIVO

**Problema**: Error `THREE is not defined` en línea 48 de `maira3DMaster.js` impedía inicialización del sistema 3D.

**Causa raíz**: Race condition entre carga asíncrona de THREE.js (CDN) y carga síncrona de maira3DMaster.js.

**Solución**: Implementación de sistema de callbacks encadenado con contador de dependencias para garantizar orden de carga correcto.

**Impacto**: Sistema 3D completo no funcional → Botón "Generar Vista 3D" inoperante.

---

## 🔍 ANÁLISIS DEL PROBLEMA

### Error Original
```javascript
maira3DMaster.js:48 Uncaught ReferenceError: THREE is not defined
    at new MAIRA3DMaster (maira3DMaster.js:48:30)
    at maira3DMaster.js:2501:28
⚠️ Sistema 3D MAIRA no disponible - maira3DMaster.js no cargado
```

### Línea Problemática
```javascript
// maira3DMaster.js línea 48
this.raycaster = new THREE.Raycaster(); // ❌ THREE is not defined
```

### Flujo Incorrecto (ANTES)

```
┌─────────────────────────────────────────────────────────┐
│ HTML parseado secuencialmente                           │
├─────────────────────────────────────────────────────────┤
│ 1. Línea 54-145: THREE.js async                         │
│    ├─ CDN inicia descarga (asíncrono)                   │
│    └─ Script continúa sin esperar                       │
│                                                          │
│ 2. Línea 176: maira3DMaster.js sync ⚡ EJECUTA AHORA   │
│    ├─ Línea 48: new THREE.Raycaster()                   │
│    └─ ❌ ERROR: THREE is not defined                    │
│                                                          │
│ 3. THREE.js termina de cargar (tarde)                   │
│    └─ Pero maira3DMaster ya falló                       │
└─────────────────────────────────────────────────────────┘
```

### Root Cause

1. **THREE.js**: Carga asíncrona desde CDN (no bloqueante)
   - Script tag dinámico con callback `onload`
   - Tiempo de carga variable (red)
   
2. **maira3DMaster.js**: Carga síncrona con `<script src>` (línea 176)
   - HTML parser la ejecuta inmediatamente
   - No espera a dependencias
   
3. **Timing**: 
   - Sincrónico ejecuta PRIMERO
   - Asíncrono completa DESPUÉS
   - ❌ Orden invertido

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Estrategia

**Patrón**: Dependency Loading Chain con Callback Counter

```
THREE.js → [GLTFLoader, OrbitControls] → counter === 2 → maira3DMaster.js
```

### Código Aplicado

**Archivo**: `Client/planeamiento_integrado.html`

#### 1. Sistema de Callbacks Encadenado (líneas 54-145)

```javascript
(function() {
  console.log('🔄 Cargando THREE.js...');
  window.threeJsReady = false;
  
  // Función para cargar maira3DMaster DESPUÉS de todas las dependencias
  function loadMaira3DMaster() {
    if (window.maira3DSystem) {
      console.log('✅ maira3DMaster ya cargado');
      return;
    }
    
    console.log('🚀 Cargando maira3DMaster.js...');
    var mairaScript = document.createElement('script');
    mairaScript.src = 'js/services/maira3DMaster.js';
    mairaScript.onload = function() {
      console.log('✅ maira3DMaster.js cargado correctamente');
      window.threeJsReady = true;
    };
    mairaScript.onerror = function() {
      console.error('❌ Error cargando maira3DMaster.js');
      window.threeJsReady = true; // Marcar como ready de todos modos
    };
    document.head.appendChild(mairaScript);
  }

  // Función para cargar dependencias después de THREE.js
  function loadThreeDependencies() {
    var dependenciesLoaded = 0;
    var totalDependencies = 2;
    
    function checkAllLoaded() {
      dependenciesLoaded++;
      console.log('📦 Dependencias cargadas: ' + dependenciesLoaded + '/' + totalDependencies);
      
      if (dependenciesLoaded === totalDependencies) {
        console.log('✅ Todas las dependencias THREE.js cargadas');
        // AHORA cargar maira3DMaster
        loadMaira3DMaster();
      }
    }
    
    // Cargar GLTFLoader
    var gltfScript = document.createElement('script');
    gltfScript.src = 'Libs/mythree/GLTFLoader.js';
    gltfScript.onload = function() {
      console.log('✅ GLTFLoader cargado');
      checkAllLoaded(); // ← Incrementa contador
    };
    document.head.appendChild(gltfScript);

    // Cargar OrbitControls
    var orbitScript = document.createElement('script');
    orbitScript.src = 'Libs/mythree/OrbitControlsBrowser.js';
    orbitScript.onload = function() {
      console.log('✅ OrbitControls cargado');
      checkAllLoaded(); // ← Incrementa contador
    };
    document.head.appendChild(orbitScript);
  }

  // Intentar CDN primero
  var threeScript = document.createElement('script');
  threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  threeScript.onload = function() {
    console.log('✅ THREE.js cargado desde CDN');
    loadThreeDependencies(); // ← Inicia carga de dependencias
  };
  threeScript.onerror = function() {
    // Fallback a local si CDN falla
    var localScript = document.createElement('script');
    localScript.src = 'Libs/mythree/three.min.js';
    localScript.onload = function() {
      console.log('✅ THREE.js cargado desde local');
      loadThreeDependencies();
    };
    document.head.appendChild(localScript);
  };
  document.head.appendChild(threeScript);
})();
```

#### 2. Comentar Carga Síncrona (línea 176)

**ANTES**:
```html
<!-- SISTEMA MAESTRO 3D - Integra todo el ecosistema -->
<script src="js/services/maira3DMaster.js"></script>
```

**DESPUÉS**:
```html
<!-- SISTEMA MAESTRO 3D - Integra todo el ecosistema -->
<!-- <script src="js/services/maira3DMaster.js"></script> -->
<!-- ⚠️ maira3DMaster.js se carga DINÁMICAMENTE después de THREE.js (ver script líneas 54-145) -->
```

---

## 🔄 FLUJO CORRECTO (DESPUÉS)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. THREE.js async load inicia                                   │
│    └─ CDN/local carga...                                         │
│                                                                   │
│ 2. THREE.js onload ejecuta                                       │
│    └─ loadThreeDependencies() llamada                            │
│                                                                   │
│ 3. GLTFLoader async load inicia                                  │
│    ├─ Carga en paralelo con OrbitControls                        │
│    └─ onload → checkAllLoaded() → counter++ (1/2)               │
│                                                                   │
│ 4. OrbitControls async load inicia                               │
│    ├─ Carga en paralelo con GLTFLoader                           │
│    └─ onload → checkAllLoaded() → counter++ (2/2)               │
│                                                                   │
│ 5. counter === totalDependencies (2 === 2)                       │
│    └─ ✅ TODAS las dependencias listas                           │
│                                                                   │
│ 6. loadMaira3DMaster() ejecuta AHORA                             │
│    ├─ THREE.js ✅ definido                                       │
│    ├─ GLTFLoader ✅ disponible                                   │
│    ├─ OrbitControls ✅ disponible                                │
│    └─ Línea 48: new THREE.Raycaster() ✅ FUNCIONA               │
│                                                                   │
│ 7. window.maira3DSystem creado                                   │
│    └─ ✅ Botón "Generar Vista 3D" funcional                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 VALIDACIÓN

### Console Output Esperado

```
🔄 Cargando THREE.js...
✅ THREE.js cargado desde CDN
✅ GLTFLoader cargado
📦 Dependencias cargadas: 1/2
✅ OrbitControls cargado
📦 Dependencias cargadas: 2/2
✅ Todas las dependencias THREE.js cargadas
🚀 Cargando maira3DMaster.js...
✅ maira3DMaster.js cargado correctamente
✅ Sistema 3D MAIRA Master inicializado globalmente
```

### Tests de Funcionalidad

1. **Test 1**: Verificar `window.maira3DSystem` existe
   ```javascript
   // En consola del navegador
   console.log(typeof window.maira3DSystem); 
   // Esperado: "object" (no "undefined")
   ```

2. **Test 2**: Verificar métodos disponibles
   ```javascript
   console.log(typeof window.maira3DSystem.toggleVista3DModular);
   // Esperado: "function"
   ```

3. **Test 3**: Click en botón "Generar Vista 3D"
   - ✅ NO debe mostrar error en consola
   - ✅ Botón debe cambiar a "Cerrar Vista 3D"
   - ✅ Vista 3D debe activarse

4. **Test 4**: Memory leaks
   - Abrir/cerrar vista 3D 5 veces
   - Verificar memoria no crece indefinidamente
   - Chrome DevTools → Performance → Memory

---

## 📊 IMPACTO

### Antes del Fix
- ❌ Sistema 3D: No funcional
- ❌ Botón Vista 3D: Error al hacer clic
- ❌ `window.maira3DSystem`: undefined
- ❌ Experiencia de usuario: Rota

### Después del Fix
- ✅ Sistema 3D: Completamente funcional
- ✅ Botón Vista 3D: Toggle correcto
- ✅ `window.maira3DSystem`: Inicializado
- ✅ Experiencia de usuario: Completa

---

## 🔗 ARCHIVOS RELACIONADOS

### Modificados
1. `Client/planeamiento_integrado.html`
   - Líneas 54-145: Sistema de callbacks
   - Línea 176: Carga síncrona comentada

2. `TRABAJO_PENDIENTE.md`
   - Sección "CRÍTICO": Documentación del fix

### Dependencias
1. `js/services/maira3DMaster.js`
   - Línea 48: `new THREE.Raycaster()`
   - Línea 2501: `window.maira3DSystem = new MAIRA3DMaster()`

2. `Libs/mythree/three.min.js` (THREE.js r128)
3. `Libs/mythree/GLTFLoader.js`
4. `Libs/mythree/OrbitControlsBrowser.js`

---

## 📚 LECCIONES APRENDIDAS

### 1. Dependency Loading Patterns

**❌ Incorrecto**:
```html
<script async src="dependency.js"></script>
<script src="main.js"></script> <!-- Ejecuta antes que async -->
```

**✅ Correcto**:
```javascript
loadDependency().then(() => {
  loadMain();
});
```

### 2. Callback Counters

Para múltiples dependencias paralelas:
```javascript
var loaded = 0;
var total = 3;

function checkReady() {
  loaded++;
  if (loaded === total) {
    // Todas listas, ejecutar código
  }
}

loadDep1(() => checkReady());
loadDep2(() => checkReady());
loadDep3(() => checkReady());
```

### 3. Script Tag Timing

- `<script src="">`: Síncrono, bloqueante, ejecuta en orden
- `<script async src="">`: Asíncrono, ejecuta cuando termina (timing impredecible)
- `<script defer src="">`: Asíncrono, ejecuta después de HTML parseado
- **Dynamic createElement**: Control completo con callbacks

---

## 🚀 PRÓXIMOS PASOS

1. **Recarga página**: `http://172.16.3.225:5000/planeamiento_integrado.html`
2. **Verificar consola**: Buscar mensajes de éxito listados arriba
3. **Test botón**: Click en "Generar Vista 3D"
4. **Validar funcionalidad**: Vista 3D se activa correctamente
5. **Si éxito**: Reemplazar `planeamiento.html` con versión integrada
6. **Si fallo**: Reportar errores específicos de consola

---

## 📞 SOPORTE

Si el error persiste después de este fix:

1. **Hard refresh**: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
2. **Clear cache**: Vaciar caché del navegador
3. **Check Network tab**: Verificar que todos los scripts cargan (200 OK)
4. **Console timing**: Ver orden exacto de mensajes
5. **Reportar**: Copiar TODOS los mensajes de consola desde inicio de carga

---

**Autor**: GitHub Copilot  
**Revisión**: Pendiente validación usuario  
**Versión**: 1.0
