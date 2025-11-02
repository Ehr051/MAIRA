# DIAGNÓSTICO: Panel de Edición No Funciona

**Fecha**: 16 de octubre de 2025  
**Problema reportado**: "no cambia el tipo de elemento y el SIDC al editar"  
**Estado**: 🔍 EN INVESTIGACIÓN

---

## 🔍 ANÁLISIS INICIAL

### Archivos Involucrados

**1. edicioncompleto.js** (para Planeamiento y Juego de Guerra)
- Ubicación: `Client/js/common/edicioncompleto.js`
- Línea 470: `function mostrarPanelEdicionUnidad(elemento)`
- Línea 2366-2372: Event listeners para dropdowns `arma` y `tipo`
- Páginas: planeamiento.html, juegodeguerra.html

**2. edicionGB.js** (para Gestión de Batalla)
- Ubicación: `Client/js/modules/gestion/edicionGB.js`
- Línea 325: `function mostrarPanelEdicionUnidad(elemento)`
- Línea 2398-2404: Event listeners para dropdowns `arma` y `tipo`
- Páginas: gestionbatalla.html

**3. elementosGB.js** (Delegación para GB)
- Ubicación: `Client/js/modules/gestion/elementosGB.js`
- Línea 3950: `window.editarElementoSeleccionadoGB`
- Línea 3986-3992: Delegación condicional
- Línea 4045: `function editarelementoSeleccionadoGB()`

### Arquitectura Detectada

```
┌─────────────────────────────────────────────────────────────┐
│                         HTML Pages                          │
│                                                             │
│  planeamiento.html          gestionbatalla.html            │
│         │                         │                         │
│         │                         │                         │
│         ▼                         ▼                         │
│  edicioncompleto.js          edicionGB.js                  │
│         │                         │                         │
│         │                         ├─────────────┐           │
│         │                         ▼             │           │
│         │                    elementosGB.js     │           │
│         │                         │             │           │
│         └─────────────────────────┴─────────────┘           │
│                         │                                   │
│                         ▼                                   │
│              mostrarPanelEdicionUnidad()                    │
│                         │                                   │
│                         ▼                                   │
│                   Actualizar DOM                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 POSIBLES CAUSAS DEL PROBLEMA

### Hipótesis 1: Event Listeners No Registrados

**Problema**: Los event listeners se agregan en `DOMContentLoaded`, pero si el panel se carga dinámicamente después, los dropdowns no existen aún.

**Verificación**:
```javascript
// En consola del navegador:
const armaSelect = document.getElementById('arma');
const tipoSelect = document.getElementById('tipo');
console.log('arma existe:', !!armaSelect);
console.log('tipo existe:', !!tipoSelect);
console.log('arma listeners:', getEventListeners(armaSelect));
console.log('tipo listeners:', getEventListeners(tipoSelect));
```

**Solución**: Agregar event listeners cada vez que se muestra el panel.

---

### Hipótesis 2: Conflicto entre edicioncompleto.js y edicionGB.js

**Problema**: Si ambos archivos se cargan (por ejemplo, en iframes o módulos), pueden sobrescribirse las funciones.

**Verificación**:
```javascript
// En consola:
console.log('Funciones disponibles:');
console.log('- mostrarPanelEdicionUnidad:', typeof window.mostrarPanelEdicionUnidad);
console.log('- actualizarTipos:', typeof window.actualizarTipos);
console.log('- actualizarCaracteristicas:', typeof window.actualizarCaracteristicas);
console.log('- determinarTipoUnidad:', typeof window.determinarTipoUnidad);
```

**Solución**: Verificar que solo se carga un archivo por página.

---

### Hipótesis 3: Dropdowns No Se Populan Correctamente

**Problema**: `actualizarTipos()` o `actualizarCaracteristicas()` fallan sin error visible.

**Verificación**:
```javascript
// En consola:
const arma = document.getElementById('arma').value;
const tipo = document.getElementById('tipo').value;
console.log('Valor arma:', arma);
console.log('Valor tipo:', tipo);
console.log('Options en tipo:', document.getElementById('tipo').options.length);
```

**Solución**: Agregar logs de debugging en las funciones de actualización.

---

### Hipótesis 4: Objeto `unidadesMilitares` o `unidadesMilitaresGB` No Cargado

**Problema**: Las funciones `actualizarTipos()` dependen de estos objetos. Si no se cargan, los dropdowns quedan vacíos.

**Verificación**:
```javascript
// En consola:
console.log('unidadesMilitares:', typeof window.unidadesMilitares);
console.log('unidadesMilitaresGB:', typeof window.unidadesMilitaresGB);
console.log('Keys unidadesMilitares:', Object.keys(window.unidadesMilitares || {}));
console.log('Keys unidadesMilitaresGB:', Object.keys(window.unidadesMilitaresGB || {}));
```

**Solución**: Verificar que el archivo de unidades se carga antes de edicion*.js.

---

### Hipótesis 5: Panel HTML Incorrecto

**Problema**: El HTML del panel podría tener IDs duplicados o incorrectos.

**Verificación**:
```javascript
// En consola:
console.log('Panel visible:', document.getElementById('panelEdicionUnidad').style.display);
console.log('Dropdowns:');
['afiliacion', 'estado', 'arma', 'tipo', 'caracteristica', 'magnitud'].forEach(id => {
    const elem = document.getElementById(id);
    console.log(`- ${id}:`, elem ? 'existe' : 'NO EXISTE');
});
```

**Solución**: Verificar que los IDs en HTML coinciden con los del JS.

---

## 🔧 TESTS MANUALES

### Test 1: Verificar que el Panel Abre

**Pasos**:
1. Abrir gestionbatalla.html (o la página donde falla)
2. Seleccionar un elemento en el map
3. Hacer click en "Editar"
4. Verificar que aparece el panel de edición

**Verificar**:
- [ ] Panel aparece
- [ ] Dropdowns tienen valores cargados
- [ ] Valores coinciden con el elemento seleccionado

---

### Test 2: Verificar Event Listeners

**Pasos**:
1. Abrir DevTools (F12)
2. En consola, ejecutar:

```javascript
// Test 1: Verificar elementos existen
console.log("=== TEST 1: Elementos DOM ===");
const arma = document.getElementById('arma');
const tipo = document.getElementById('tipo');
console.log('arma:', arma);
console.log('tipo:', tipo);

// Test 2: Verificar listeners
console.log("\n=== TEST 2: Event Listeners ===");
if (arma) {
    console.log('arma listeners:', getEventListeners(arma));
} else {
    console.error('❌ Dropdown arma NO EXISTE');
}

if (tipo) {
    console.log('tipo listeners:', getEventListeners(tipo));
} else {
    console.error('❌ Dropdown tipo NO EXISTE');
}

// Test 3: Verificar funciones
console.log("\n=== TEST 3: Funciones ===");
console.log('actualizarTipos:', typeof window.actualizarTipos);
console.log('actualizarCaracteristicas:', typeof window.actualizarCaracteristicas);

// Test 4: Verificar datos
console.log("\n=== TEST 4: Datos de Unidades ===");
console.log('unidadesMilitares:', typeof window.unidadesMilitares);
console.log('unidadesMilitaresGB:', typeof window.unidadesMilitaresGB);

// Test 5: Simular cambio
console.log("\n=== TEST 5: Simular Cambio ===");
if (arma && arma.value) {
    console.log('Valor actual arma:', arma.value);
    console.log('Intentando actualizar tipos...');
    if (window.actualizarTipos) {
        window.actualizarTipos(arma.value);
        console.log('✅ actualizarTipos() ejecutado');
        console.log('Options en tipo:', document.getElementById('tipo').options.length);
    } else {
        console.error('❌ actualizarTipos NO EXISTE');
    }
}
```

**Resultados esperados**:
- ✅ arma y tipo existen
- ✅ Ambos tienen event listeners de tipo 'change'
- ✅ Funciones actualizarTipos y actualizarCaracteristicas existen
- ✅ unidadesMilitares o unidadesMilitaresGB existen
- ✅ actualizarTipos() ejecuta sin errores

---

### Test 3: Cambiar Dropdowns Manualmente

**Pasos**:
1. Abrir panel de edición
2. Cambiar dropdown "arma"
3. Observar si dropdown "tipo" se actualiza

**Verificar**:
- [ ] Dropdown "tipo" cambia sus opciones
- [ ] Console.log muestra algo cuando se cambia
- [ ] No hay errores en consola

---

### Test 4: Verificar SIDC

**Pasos**:
1. Abrir panel de edición
2. Cambiar "arma", "tipo", "característica"
3. Verificar preview del símbolo

**Verificar**:
- [ ] Preview actualiza inmediatamente
- [ ] SIDC mostrado cambia
- [ ] Al guardar, cambios se aplican al map

---

## 💡 SOLUCIONES PROPUESTAS

### Solución 1: Agregar Event Listeners Cada Vez que se Abre el Panel

**Modificar `mostrarPanelEdicionUnidad()`**:

```javascript
// En edicioncompleto.js línea ~470
function mostrarPanelEdicionUnidad(elemento) {
    console.log("📋 [DEBUG] mostrarPanelEdicionUnidad llamada con:", elemento);
    
    console.log("Mostrando panel de edición de unidad");
    mostrarPanelEdicion('panelEdicionUnidad');
    
    // ✅ AGREGAR: Re-registrar event listeners
    registrarEventListenersPanelUnidad();
    
    if (elemento?.options?.sidc) {
        // ... código existente ...
    }
    
    actualizarPreviewSimbolo();
}

// ✅ NUEVA FUNCIÓN: Registrar listeners cada vez
function registrarEventListenersPanelUnidad() {
    console.log("📋 Registrando event listeners del panel");
    
    const armaSelect = document.getElementById('arma');
    const tipoSelect = document.getElementById('tipo');
    
    if (!armaSelect || !tipoSelect) {
        console.error("❌ Dropdowns no encontrados");
        return;
    }
    
    // Remover listeners antiguos (si existen)
    const armaClone = armaSelect.cloneNode(true);
    armaSelect.parentNode.replaceChild(armaClone, armaSelect);
    
    const tipoClone = tipoSelect.cloneNode(true);
    tipoSelect.parentNode.replaceChild(tipoClone, tipoSelect);
    
    // Agregar nuevos listeners
    document.getElementById('arma').addEventListener('change', function() {
        console.log("🔄 arma changed:", this.value);
        actualizarTipos(this.value);
    });
    
    document.getElementById('tipo').addEventListener('change', function() {
        console.log("🔄 tipo changed:", this.value);
        const armaVal = document.getElementById('arma').value;
        actualizarCaracteristicas(armaVal, this.value);
    });
    
    console.log("✅ Event listeners registrados");
}
```

**Aplicar en AMBOS archivos**:
- edicioncompleto.js línea ~470
- edicionGB.js línea ~325

---

### Solución 2: Agregar Logs de Debugging Temporales

**Modificar `actualizarTipos()`**:

```javascript
function actualizarTipos(categoriaArma) {
    console.log("🔄 actualizarTipos llamada con:", categoriaArma);
    
    const [categoria, arma] = categoriaArma.split('|');
    console.log("🔍 categoria:", categoria, "arma:", arma);
    
    const tipoSelect = document.getElementById('tipo');
    if (!tipoSelect) {
        console.error("❌ Dropdown 'tipo' no encontrado");
        return;
    }
    
    console.log("🔍 tipoSelect encontrado, limpiando...");
    tipoSelect.innerHTML = '';
    
    const unidades = window.unidadesMilitares || window.unidadesMilitaresGB;
    if (!unidades || !unidades[categoria] || !unidades[categoria][arma]) {
        console.error("❌ Datos de unidades no encontrados:", {
            unidades: !!unidades,
            categoria: !!unidades?.[categoria],
            arma: !!unidades?.[categoria]?.[arma]
        });
        return;
    }
    
    const tipos = unidades[categoria][arma].tipos;
    console.log("🔍 tipos encontrados:", Object.keys(tipos).length);
    
    Object.keys(tipos).forEach(tipo => {
        let option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
        console.log("✅ Agregado tipo:", tipo);
    });
    
    console.log("🔄 Actualizando características...");
    actualizarCaracteristicas(categoriaArma, Object.keys(tipos)[0]);
}
```

**Aplicar en AMBOS archivos**.

---

### Solución 3: Verificar Orden de Carga de Scripts

**Verificar en HTML**:

```html
<!-- gestionbatalla.html -->

<!-- ❌ INCORRECTO: unidades después de edición -->
<script src="js/modules/gestion/edicionGB.js"></script>
<script src="js/data/unidadesMilitares.js"></script>

<!-- ✅ CORRECTO: unidades ANTES de edición -->
<script src="js/data/unidadesMilitares.js"></script>
<script src="js/modules/gestion/edicionGB.js"></script>
```

**Acción**: Verificar orden en las 3 páginas (planeamiento.html, juegodeguerra.html, gestionbatalla.html).

---

## 🚀 PLAN DE ACCIÓN

### Paso 1: Diagnóstico (AHORA)

1. Abrir http://localhost:5000/gestionbatalla.html
2. Abrir DevTools → Console
3. Ejecutar los tests de arriba
4. Anotar resultados:
   - ¿Los dropdowns existen?
   - ¿Tienen event listeners?
   - ¿Las funciones existen?
   - ¿Los datos existen?

### Paso 2: Implementar Solución (DESPUÉS DE DIAGNÓSTICO)

**Si dropdowns no tienen listeners**: Aplicar Solución 1

**Si funciones fallan sin error**: Aplicar Solución 2

**Si datos no existen**: Aplicar Solución 3

### Paso 3: Testing

1. Reiniciar servidor (si se modificó código)
2. Recargar página con Ctrl+Shift+R (hard reload)
3. Seleccionar elemento
4. Editar elemento
5. Cambiar dropdowns
6. Verificar que funcionan

---

## 📊 CHECKLIST DE VERIFICACIÓN

- [ ] Servidor corriendo en http://localhost:5000
- [ ] Página gestionbatalla.html carga sin errores
- [ ] Tests manuales ejecutados (copiar resultados)
- [ ] Problema reproducido (confirmar que sí está roto)
- [ ] Solución identificada (cuál hipótesis es correcta)
- [ ] Código modificado (qué archivos)
- [ ] Servidor reiniciado (si fue necesario)
- [ ] Testing completado (verificar que funciona)

---

## 📝 NOTAS

### Hallazgos Importantes

1. **DOS implementaciones de `mostrarPanelEdicionUnidad`**:
   - edicioncompleto.js (línea 470)
   - edicionGB.js (línea 325)
   - Esto es CORRECTO (diferentes páginas usan diferentes archivos)

2. **Event listeners se registran en DOMContentLoaded**:
   - edicioncompleto.js (línea 2366-2372)
   - edicionGB.js (línea 2398-2404)
   - Esto puede causar problemas si el panel se carga dinámicamente

3. **Delegación en elementosGB.js**:
   - Línea 3986-3992: Sobrescribe `window.editarElementoSeleccionado`
   - Solo en gestionbatalla.html
   - Puede causar problemas si la delegación falla

4. **Dos objetos de datos**:
   - `unidadesMilitares` (para planeamiento/juegodeguerra)
   - `unidadesMilitaresGB` (para gestionbatalla)
   - Verificar que existen antes de usarse

---

## 🔍 SIGUIENTE PASO

**EJECUTAR TESTS MANUALES EN NAVEGADOR** y reportar resultados.

Una vez tengamos los resultados de los tests, sabremos exactamente qué solución aplicar.

---

**Estado**: ⏳ ESPERANDO RESULTADOS DE DIAGNÓSTICO

**Creado**: 16 de octubre de 2025  
**Última actualización**: 16 de octubre de 2025
