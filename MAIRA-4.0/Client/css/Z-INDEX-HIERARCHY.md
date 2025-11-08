# Jerarquía de Z-Index en MAIRA 4.0

Este documento define la jerarquía de z-index utilizada en toda la aplicación MAIRA para evitar superposiciones no deseadas.

## Principios

1. **Capas ordenadas**: Cada componente tiene un rango definido
2. **No usar valores arbitrarios**: Usar siempre los rangos definidos aquí
3. **Consistencia**: Todos los módulos siguen la misma jerarquía
4. **Modales sobre contenido**: Los elementos interactivos siempre están accesibles

## Rangos Definidos

### 1-99: map Base
- `1-49`: Capas base del map (terreno, satelital)
- `50-99`: Overlays del map (tiles, vectores)

### 100-499: Elementos del map
- `100-199`: Marcadores estándar
- `200-299`: Líneas y polígonos
- `300-399`: Etiquetas y tooltips del map
- `400-499`: Controles auxiliares del map

### 500-999: Herramientas Secundarias
- `500-599`: Botones flotantes del map
- `600-699`: Controles de zoom, escala
- `700-799`: Leaflet Draw toolbar
- `800-899`: Sidebar secundarios
- `900-999`: Tooltips y popups temporales

### 1000-1499: Paneles Laterales y Flotantes
- `1000-1099`: Panel lateral de Gestión de Batalla (colapsado)
- `1100-1199`: Panel lateral de Gestión de Batalla (expandido)
- `1200-1299`: **Paneles de Marcha (panel, gráfico, cálculo)**
- `1300-1399`: Otros paneles flotantes

### 1500-1999: Modales y Diálogos
- `1500-1599`: Modales estándar
- `1600-1699`: Formularios emergentes
- `1700-1799`: Confirmaciones
- `1800-1899`: Alertas
- `1900-1999`: RESERVADO (antes usado incorrectamente por paneles de marcha)

### 2000-2499: Navegación Principal
- `2000`: **Header principal**
- `2001`: **Contenedor de botones principales**
- `2002`: **Botones del menú principal**
- `2003`: **Botones individuales del menú**
- `2100`: **Menús desplegables (.menu, .menu.show)**
- `2200-2299`: Submenús
- `2300-2400`: Menús contextuales

### 2500-2999: Notificaciones y Tooltips Globales
- `2500-2599`: Tooltips informativos
- `2600-2699`: Notificaciones toast
- `2700-2799`: Mensajes de error
- `2800-2899`: Mensajes de éxito

### 3000+: Elementos Críticos
- `3000`: **Paneles en modo fullscreen**
- `3100-3199`: Loading overlays
- `3200-3299`: Splash screens
- `3300-9998`: RESERVADO para necesidades futuras
- `9999`: EVITAR (solo para debug temporal)

## Archivos Actualizados

### CYGMarcha.css (✅ Corregido)
- `#panelMarchaContainer`: 1900 → **1200**
- `#graficoMarchaPanel`: 1900 → **1200**
- `#calculoMarchaPanel`: 1900 → **1200**
- `.fullscreen`: 9999 → **3000**

### planeamiento.css (✅ Corregido)
- `header`: 10 → **2000**
- `#botones-principales`: 1 → **2001**
- `.menu-btn`: 10 → **2002**
- `.menu-btn button`: 10 → **2003**
- `.menu`: 10/1000 → **2100**
- `.menu.show`: 1000 → **2100**

### GBatalla.css (✅ Corregido - 4 Nov 2025)
- `.context-menu`: 1500 → **2300**
- `.boton-panel` (2x): 1500 → **550**
- `.loading-container`: 9999 → **3100**
- `.media-lightbox`: 1500 (correcto) ✅
- `.miradial-container`: 1500 → **2300**
- `.panel-toggle-btn`: 999 → **550**
- `.boton-test`: 998 → **550**
- `.menu-test-flotante`: 997 → **900**

### CO.css (✅ Corregido - 4 Nov 2025)
- `.sidebar`: 900 → **1000**
- Botón sidebar: 901 → **1001**
- `.zoom-controls`: 900 → **600**
- `.loading-indicator` (2x): 9999 → **3100**
- `.menu-contextual`: 9999 → **2300**
- `.modal-overlay`: 9998 → **1500**

### JuegoV2 - Panel de Coordinación (✅ Corregido - 7 Nov 2025)
- `PanelCoordinacionOrdenes`: 10000 → **1350** (Paneles Flotantes)
- `.orden-tooltip`: 10001 → **2500** (Tooltips Globales)
- `btnToggleCoordinacion`: 2002 → **1351** (Sobre panel coordinación)

### juegodeguerraV2.html - Inline z-index (✅ Corregido - 7 Nov 2025)
- `#panelControles3D`: 10000 → **1350** (Paneles Flotantes)
- `.fullscreen-3d #canvas-container`: 9999 → **3000** (Fullscreen mode)
- `#loading-modal`: 10000 → **3100** (Loading overlays)
- `#close-3d-button`: 10001 → **3101** (Sobre loading overlay)

### Pendientes de Revisión
- [ ] graficomarcha.css
- [ ] style.css (z-index: 999)

## Reglas de Uso

### ✅ Hacer
- Usar los rangos definidos según la función del elemento
- Agregar comentarios explicando el z-index elegido
- Documentar cambios en este archivo
- Usar `position: relative` cuando sea necesario para que z-index funcione

### ❌ Evitar
- Valores superiores a 3500 (excepto casos muy justificados)
- Usar `z-index: 9999` o `z-index: 999999`
- Cambiar z-index sin consultar esta jerarquía
- Valores arbitrarios sin comentarios

## Problemas Resueltos

### Problema 1: Panel de Marcha tapaba Menú Principal
**Antes:**
- Panel de Marcha: z-index 1900
- Menú Principal: z-index 10

**Después:**
- Panel de Marcha: z-index 1200 (Paneles Laterales)
- Menú Principal: z-index 2000-2100 (Navegación Principal)

**Resultado:** El menú ahora es accesible con el panel de marcha abierto

## Paleta de Colores Coherente

### Colores Primarios
- `--color-primary`: #0281a8 (Cyan/Turquesa - usado en paneles de marcha)
- `--color-primario`: #007bff (Azul - usado en planeamiento)
- Sugerencia: Unificar en un solo color primario

### Fondos de Paneles
- `--panel-bg`: rgba(56, 78, 85, 0.95) (CYGMarcha)
- `--color-secundario`: #333 (planeamiento)
- Sugerencia: Usar transparencias similares para coherencia visual

### Series de Marcha
- Serie 1: #2196F3 (Azul)
- Serie 2: #4CAF50 (Verde)
- Serie 3: #F44336 (Rojo)
- Serie 4: #FFC107 (Amarillo/Naranja)
- Serie 5: #9C27B0 (Púrpura)

## Cambios Adicionales (4 Nov 2025)

### Menús Contextuales → MiRadial
- **Archivo:** `Client/js/common/mapaP.js`
- **Cambio:** Eliminados menús contextuales tradicionales, usar solo MiRadial
- **Líneas:** 422, 561, 763-785, 1201

### Font Awesome
- **Archivo:** `Client/planeamiento.html`
- **Cambio:** Versión 6.5.1 → 6.4.0 (versión estable)
- **Razón:** Problemas con integrity check en 6.5.1

## Última Actualización
**Fecha:** 2025-11-04
**Responsable:** Claude Code
**Cambios:** Corrección completa de jerarquía z-index en 4 archivos CSS + eliminación menús contextuales + Font Awesome 6.4.0
