# 🔍 DEBUG: Contenedores 3D Duplicados

## Diagnóstico del Usuario
✅ **Síntomas observados:**
- Pantalla azul aparece al generar vista 3D
- Terreno plano sin relieve ni vegetación
- No aparece el botón "Cerrar Vista 3D"
- El sistema se pone muy lento (indica que está procesando algo)
- En el test optimizado funcionaba perfectamente

❗ **Conclusión:** Probablemente hay DOS contenedores 3D superpuestos y el usuario está viendo el incorrecto (el de abajo, vacío).

---

## Análisis de Contenedores

### 🎯 Sistema 1: terrainController (terrain3d-init.js)
**Archivo:** `Client/js/terrain3d/TerrainRenderer3D.js`

**Contenedor:**
- ID: `canvas-container`
- Creado en: `TerrainRenderer3D.init()` línea 40-45
- Agregado a: `#main-container`
- z-index: 1000
- Clase: `active`

```javascript
this.container = document.getElementById('canvas-container');
if (!this.container) {
    this.container = document.createElement('div');
    this.container.id = 'canvas-container';
    this.container.className = 'active';
    document.getElementById('main-container').appendChild(this.container);
}
```

**Scene:** `terrainController.scene`
**Renderer:** `terrainController.renderer`

---

### 🎯 Sistema 2: threeDMapService (POSIBLE CONFLICTO)
**Archivo:** `Client/js/services/threeDMapService.js`

**Contenedor:**
- ID: `vista3d-container` (línea 764)
- Hijo: `canvas3d` (línea 799-809)
- Creado en: `activarVista3D()` línea 764-809

```javascript
let container3D = document.getElementById('vista3d-container');
if (!container3D) {
    container3D = document.createElement('div');
    // ...
    const canvas3D = document.createElement('div');
    canvas3D.id = 'canvas3d';
    // ...
    container3D.appendChild(canvas3D);
}
```

**Scene:** `threeDMapInstance.scene`
**Renderer:** `threeDMapInstance.renderer`

---

## ⚠️ PROBLEMA DETECTADO

El botón `#btnVista3D` en `planeamiento_integrado.html` línea 1729-1761 hace:

1. **Llama:** `window.inicializarSistema()` → Crea `terrainController` con `canvas-container`
2. **Llama:** `window.createFullView3D()` → Workflow que usa `terrainController.generateTerrain()`
3. **Resultado:** Terreno se agrega a `terrainController.scene` en `canvas-container`

**PERO** si `threeDMapService.toggleVista3D()` también se ejecuta (línea 1224):
- Crea `vista3d-container` con `canvas3d`
- Este contenedor puede estar ENCIMA de `canvas-container`
- Si `canvas3d` está vacío → Usuario ve pantalla azul/plana

---

## 🔧 Soluciones Posibles

### Opción A: Deshabilitar threeDMapService
**Archivo:** `Client/planeamiento_integrado.html`

Comentar o eliminar la llamada a `toggleVista3D` (línea 1224):
```javascript
// COMENTAR ESTO:
if (typeof toggleVista3D === 'function') {
    toggleVista3D();
}
```

### Opción B: Usar solo threeDMapService
Modificar `terrain3d-init.js` para que NO cree su propio contenedor y use el de `threeDMapService`.

### Opción C: Unificar sistemas (RECOMENDADO)
Hacer que `createFullView3D()` use `threeDMapService` en lugar de `terrainController`.

---

## 🧪 Test Rápido en Consola del Navegador

```javascript
// Ver qué contenedores existen
console.log('canvas-container:', document.getElementById('canvas-container'));
console.log('vista3d-container:', document.getElementById('vista3d-container'));
console.log('canvas3d:', document.getElementById('canvas3d'));

// Ver qué sistemas están activos
console.log('terrainController:', window.terrainController);
console.log('threeDMapService:', window.threeDMapInstance);

// Ver qué escenas tienen objetos
if (window.terrainController?.scene) {
    console.log('Objetos en terrainController.scene:', window.terrainController.scene.children.length);
}
if (window.threeDMapInstance?.scene) {
    console.log('Objetos en threeDMapInstance.scene:', window.threeDMapInstance.scene.children.length);
}
```

---

## 🎯 Próximo Paso

Necesito que ejecutes el test en la consola del navegador y me digas:
1. ¿Cuántos contenedores aparecen?
2. ¿Cuál tiene objetos en su scene?
3. ¿Cuál es visible (está encima)?

Con esa info sabré exactamente qué arreglar.
