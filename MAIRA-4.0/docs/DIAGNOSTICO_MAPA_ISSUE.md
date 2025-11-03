# 🔍 DIAGNÓSTICO: Mapa No Se Ve (Fondo Celeste)

**Fecha:** 19 oct 2025
**Archivo afectado:** `planeamiento_integrado.html`
**Síntoma:** Fondo celeste visible, mapa Leaflet no se renderiza

---

## ✅ Elementos PRESENTES (Correctos)

1. **Contenedor HTML:** `<div id="map">` existe en línea 879
2. **CSS:** `planeamiento.css` tiene estilos correctos (#map, #mapContainer)
3. **Script Leaflet:** Se carga desde `/node_modules/leaflet/dist/leaflet.js` (línea 78)
4. **Script mapaP.js:** Se carga correctamente (línea 302)
5. **Inicialización:** Log muestra "DOM completamente cargado. Iniciando configuración del map..."

---

## ❌ PROBLEMAS DETECTADOS

### PROBLEMA #1: Rutas `/node_modules/` relativas vs absolutas

**Contexto del log:**
```
planeamiento_integrado.html:1 Refused to apply style from 
'http://127.0.0.1:5500/node_modules/bootstrap/dist/css/bootstrap.min.css' 
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

**Causa:** Live Server (127.0.0.1:5500) está sirviendo desde `MAIRA-4.0/Client/` pero los archivos usan rutas `/node_modules/` que apuntan a root del servidor.

**Estructura real:**
```
MAIRA-4.0/
├── node_modules/          ← Los archivos están AQUÍ
│   ├── leaflet/
│   ├── bootstrap/
│   └── ...
└── Client/
    ├── planeamiento_integrado.html  ← Este archivo
    └── ...
```

**Problema:** Las rutas `/node_modules/` desde `planeamiento_integrado.html` deben ser `../node_modules/`

---

### PROBLEMA #2: Sistema modular 3D conflicto

**Log relevante:**
```javascript
🌍 MAIRA Terrain 3D cargado
🚀 Iniciando sistema de terreno 3D...
🗺️ Inicializando map...
♻️ Reutilizando mapa Leaflet existente
🛰️ Agregando capa satelital al mapa existente
✅ map satelital inicializado
```

**Análisis:** El sistema modular 3D se auto-inicia y **agrega una capa satelital al mapa** antes de que el usuario haga clic.

**Posible conflicto:** Si `window.map` no existe aún (porque `mapaP.js` no terminó de inicializar), el sistema modular podría estar intentando usar un mapa inexistente.

---

### PROBLEMA #3: Orden de inicialización

**Secuencia del log:**
```
1. "DOM completamente cargado. Iniciando configuración del map..." (mapaP.js)
2. "🌍 MAIRA Terrain 3D cargado" (terrain3d-init.js)
3. "♻️ Reutilizando mapa Leaflet existente" (TerrainController3D.js)
```

**Timeline sospechoso:**
- `mapaP.js` inicia configuración del mapa
- Antes de que termine, `terrain3d-init.js` se ejecuta
- `TerrainController3D` encuentra `window.map` y lo "reutiliza"
- ¿Pero el mapa original se completó correctamente?

---

## 🔬 VERIFICACIONES NECESARIAS

### Verificación #1: ¿Existe `window.map`?

Abrir consola del navegador y ejecutar:
```javascript
console.log('window.map:', window.map);
console.log('Leaflet L:', typeof L);
console.log('map _layers:', window.map ? Object.keys(window.map._layers) : 'NO MAP');
```

**Resultado esperado:**
- `window.map` debe ser un objeto Leaflet
- `typeof L` debe ser "object"
- `_layers` debe tener al menos 1 capa base

---

### Verificación #2: ¿Se está renderizando el mapa?

Verificar en DevTools → Elements:
```html
<div id="map">
  <div class="leaflet-pane leaflet-map-pane">
    <!-- Debe haber contenido aquí -->
  </div>
</div>
```

Si `<div id="map">` está **vacío**, Leaflet no se inicializó.

---

### Verificación #3: ¿Errores de red 404?

Del log vemos múltiples 404:
```
GET http://127.0.0.1:5500/node_modules/bootstrap/dist/css/bootstrap.min.css 404 (Not Found)
GET http://127.0.0.1:5500/node_modules/jspdf/dist/jspdf.umd.min.js 404 (Not Found)
GET http://127.0.0.1:5500/node_modules/pako/dist/pako.min.js 404 (Not Found)
```

**Estos 404s podrían estar bloqueando Leaflet también.**

---

## 🛠️ SOLUCIONES PROPUESTAS

### Solución #1: Corregir rutas `/node_modules/` → `../node_modules/`

**Archivos a modificar:**
1. `planeamiento_integrado.html` (líneas 18-78)

**Cambios:**
```html
<!-- ANTES (INCORRECTO) -->
<link rel="stylesheet" href="/node_modules/leaflet/dist/leaflet.css" />
<script src="/node_modules/leaflet/dist/leaflet.js"></script>

<!-- DESPUÉS (CORRECTO) -->
<link rel="stylesheet" href="../node_modules/leaflet/dist/leaflet.css" />
<script src="../node_modules/leaflet/dist/leaflet.js"></script>
```

**Alcance:** Aplicar a TODAS las rutas `/node_modules/` en el HTML.

---

### Solución #2: Desactivar auto-inicio del sistema 3D

**Archivo:** `Client/js/terrain3d/terrain3d-init.js`

**Cambio:**
```javascript
// ANTES
document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();
    initTerrainSystem();  // ❌ Auto-inicia
});

// DESPUÉS
document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();
    // ✅ No auto-iniciar - esperar clic del usuario
    console.log('✅ Sistema 3D listo - esperando interacción del usuario');
});
```

---

### Solución #3: Garantizar orden de inicialización

**Archivo:** `Client/js/terrain3d/terrain3d-init.js`

**Agregar verificación robusta:**
```javascript
async function initTerrainSystem() {
    // ✅ Esperar explícitamente a que window.map exista Y esté renderizado
    let attempts = 0;
    while ((!window.map || !window.map._loaded) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.map || !window.map._loaded) {
        console.error('❌ Timeout esperando mapa Leaflet');
        return;
    }
    
    // Ahora sí inicializar sistema 3D
    terrainController = new TerrainController3D();
    await terrainController.init();
}
```

---

## 📊 PRIORIDAD DE ACCIONES

1. **🔴 URGENTE:** Corregir rutas `/node_modules/` (Solución #1)
2. **🟠 ALTA:** Desactivar auto-inicio 3D (Solución #2)
3. **🟡 MEDIA:** Mejorar orden de inicialización (Solución #3)

---

## 🧪 PLAN DE TESTING

### Test #1: Rutas corregidas
```bash
cd MAIRA-4.0/Client
# Abrir planeamiento_integrado.html
# Verificar consola: NO debe haber 404s de node_modules
```

### Test #2: Mapa visible
```bash
# Abrir planeamiento_integrado.html
# Resultado esperado: Mapa Leaflet visible con tiles
# NO debe verse solo fondo celeste
```

### Test #3: Sistema 3D manual
```bash
# Hacer clic en botón "Generar Vista 3D"
# Verificar workflow: capture → analyze → generate
# Confirmar terreno 3D aparece
```

---

## 📝 NOTAS ADICIONALES

### Sobre planeamiento.html vs planeamiento_integrado.html

**planeamiento.html:**
- 1,357 líneas
- Producción estable
- NO tiene sistema modular 3D
- Rutas `/node_modules/` también incorrectas (pero funciona por contexto del servidor)

**planeamiento_integrado.html:**
- 1,974 líneas (+617 líneas)
- Staging con sistema 3D modular
- Mismas rutas incorrectas + nuevo código 3D
- **Necesita ambas correcciones**

### Sobre el servidor Live Server

Live Server en `127.0.0.1:5500` sirve desde `MAIRA-4.0/Client/`.

**Por qué `/node_modules/` falla:**
```
Request: http://127.0.0.1:5500/node_modules/leaflet/dist/leaflet.css
Busca en: MAIRA-4.0/Client/node_modules/ ← ❌ NO EXISTE
Debería buscar: MAIRA-4.0/node_modules/ ← ✅ AQUÍ ESTÁ
```

**Solución:** Usar rutas relativas `../node_modules/`

---

## 🚀 IMPLEMENTACIÓN

**Orden de ejecución:**
1. Backup de `planeamiento_integrado.html`
2. Aplicar Solución #1 (corregir rutas)
3. Aplicar Solución #2 (desactivar auto-inicio)
4. Test #1 y #2
5. Si funciona, aplicar Solución #3 (mejorar orden)
6. Test #3

**Tiempo estimado:** 30-45 minutos
