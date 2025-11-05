# INSTRUCCIONES MANUALES - FIX JUEGO DE GUERRA

## Problema Detectado
Las herramientas de edición automática de VS Code (replace_string_in_file, create_file) están fallando.
Reportan éxito pero no modifican los archivos reales.

## SOLUCIÓN: Edición Manual

### FIX 1: hexgrid.js - Agregar disable/enable
**Archivo:** `/Client/js/modules/juego/hexgrid.js`

**Línea 6:** Agregar después de `originLatLng: null,`:
```javascript
    enabled: true,
```

**Líneas 23-24:** Después de la función `initialize`, agregar:
```javascript
    disable: function() {
        console.log("🚫 HexGrid desactivado - clicks del map liberados");
        this.enabled = false;
        if (this.hexLayer) {
            this.hexLayer.eachLayer(function(layer) {
                if (layer.off) layer.off('click');
            });
        }
    },

    enable: function() {
        console.log("✅ HexGrid activado - clicks del map capturados");
        this.enabled = true;
        if (this.hexLayer) {
            this.hexLayer.eachLayer(function(layer) {
                if (layer.on) {
                    layer.on('click', this.handleHexagonClick.bind(this));
                }
            }.bind(this));
        }
    },
```

**Línea 76:** Modificar `handleMapClick` para verificar enabled:
```javascript
    handleMapClick: function(e) {
        if (!this.enabled) return;  // ⬅️ AGREGAR ESTA LÍNEA
        // ... resto del código
    },
```

---

### FIX 2: gestorFases.js - Llamar HexGrid.disable()
**Archivo:** `/Client/js/modules/juego/gestorFases.js`

**Línea 581:** En función `desactivarHexagonosInteractivos()`, agregar al inicio:
```javascript
    desactivarHexagonosInteractivos() {
        if (window.HexGrid && window.HexGrid.disable) {
            window.HexGrid.disable();  // ⬅️ AGREGAR ESTA LÍNEA
        }
        // ... resto del código
    },
```

**Línea ~608:** En función `activarHexagonosInteractivos()`, agregar:
```javascript
    activarHexagonosInteractivos() {
        if (window.HexGrid && window.HexGrid.enable) {
            window.HexGrid.enable();  // ⬅️ AGREGAR ESTA LÍNEA
        }
        // ... resto del código
    },
```

---

### FIX 3: indexP.js - Corregir nombre método MiRadial
**Archivo:** `/Client/js/common/indexP.js`

**Línea 155:** Cambiar:
```javascript
// ANTES:
window.MiRadial.inicializar(window.map, 'planeamiento');

// DESPUÉS:
window.MiRadial.init(window.map, 'planeamiento');
```

---

## Cómo Aplicar los Cambios

1. Abre cada archivo en VS Code
2. Busca las líneas indicadas (Cmd+G para ir a línea)
3. Agrega/modifica el código según las instrucciones
4. Guarda cada archivo (Cmd+S)
5. Recarga el navegador y prueba

## Verificación en Consola del Navegador

Después de aplicar cambios, ejecuta:
```javascript
console.log('HexGrid.disable:', typeof HexGrid.disable); // debe ser "function"
console.log('HexGrid.enable:', typeof HexGrid.enable);   // debe ser "function"
console.log('HexGrid.enabled:', HexGrid.enabled);        // debe ser true
console.log('MiRadial.init:', typeof MiRadial.init);     // debe ser "function"
```

## Prueba del Fix
1. Abre juegodeguerra.html
2. Click "Delimitar Sector"
3. Verifica en consola: "🚫 HexGrid desactivado"
4. Haz click en el map → debe permitir dibujar polígono
5. Completa el polígono → debe guardarse el sector

