# 🚨 FIX URGENTE - Menú Radial Planeamiento

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Menú contextual duplicado (NO usa MiRadial)**
**Ubicación**: `Client/js/common/mapaP.js` línea ~385-396
**Problema**: El evento `contextmenu` llama a `mostrarMenuContextual(e)` en vez de `MiRadial.mostrarMenu()`

**Código actual**:
```javascript
layer.off('contextmenu').on('contextmenu', function(e) {
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);
    window.seleccionarElemento(this);
    mostrarMenuContextual(e); // ❌ NO usa MiRadial
});
```

**SOLUCIÓN**:
```javascript
layer.off('contextmenu').on('contextmenu', function(e) {
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);
    
    // Seleccionar elemento
    if (typeof window.seleccionarElemento === 'function') {
        window.seleccionarElemento(this);
    } else {
        window.elementoSeleccionado = this;
    }
    
    // ✅ USAR MIRADIAL
    if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
        // Obtener coordenadas del ELEMENTO (no del click)
        const latlng = this.getLatLng ? this.getLatLng() : this.getBounds().getCenter();
        const punto = map.latLngToContainerPoint(latlng);
        
        // Establecer elemento seleccionado en MiRadial
        window.MiRadial.selectedUnit = this;
        
        // Determinar tipo según el elemento
        let tipo = 'elemento';
        if (this.options.sidc) tipo = 'simboloMilitar';
        else if (this instanceof L.Polyline) tipo = 'linea';
        else if (this instanceof L.Polygon) tipo = 'poligono';
        
        console.log('🎯 Abriendo MiRadial para:', tipo, 'en:', punto);
        window.MiRadial.mostrarMenu(punto.x, punto.y, tipo);
    }
});
```

---

### 2. **MiRadial no posiciona sobre el elemento**
**Ubicación**: `Client/js/common/miradial.js` línea ~687-696
**Problema**: `this.selectedUnit` no se establece correctamente antes de llamar `mostrarMenu()`

**Código actual**:
```javascript
// Si se ha seleccionado una unidad, muestra el menú en sus coordenadas
if (this.selectedUnit) {
    const { lat, lng } = this.selectedUnit.getLatLng();
    const punto = this.map.latLngToContainerPoint([lat, lng]);
    this.positionMenu(punto.x, punto.y);
} else {
    // Si no hay unidad seleccionada, usa las coordenadas del clic
    this.positionMenu(x, y);
}
```

**PROBLEMA**: `this.selectedUnit` NO se establece ANTES de llamar `mostrarMenu()`, entonces siempre usa coordenadas del click.

**SOLUCIÓN**: Establecer `selectedUnit` ANTES de llamar `mostrarMenu()` (ya mostrado arriba en fix #1)

---

### 3. **Font Awesome incompleto**
**Ubicación**: `Client/planeamiento.html` (head section)

**Problema**: Solo carga Font Awesome 5.15.4 que no tiene todos los iconos. Faltan:
- `fa-ruler` (medición)
- `fa-chart-line` (perfil)
- Otros iconos nuevos

**SOLUCIÓN**: Agregar Font Awesome 6 completo:
```html
<!-- Font Awesome 6 - FREE (todos los estilos) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

---

### 4. **Falta tooltips en menú radial**
**Ubicación**: `Client/js/common/miradial.js` línea ~700-800 (función `createMenuSVG`)

**Problema**: Los items del menú tienen `tooltip` definido pero NO se renderizan visualmente.

**SOLUCIÓN**: Agregar `<title>` SVG a cada item:
```javascript
// En la función createMenuSVG, agregar:
const title = document.createElementNS(svgNS, 'title');
title.textContent = item.tooltip || item.title;
group.appendChild(title);
```

---

## 🎯 PRIORIDAD DE FIXES

### **INMEDIATO** (antes de clase):
1. ✅ **Fix #1**: Reemplazar `mostrarMenuContextual()` por `MiRadial.mostrarMenu()`
2. ✅ **Fix #2**: Establecer `selectedUnit` correctamente
3. ✅ **Fix #3**: Agregar Font Awesome 6

### **DESPUÉS DE CLASE**:
4. ⏳ **Fix #4**: Implementar tooltips SVG
5. ⏳ **Testing**: Verificar todos los tipos de elementos
6. ⏳ **Documentación**: Actualizar guía

---

## 📝 ARCHIVO DE IMPLEMENTACIÓN

**Archivo principal**: `Client/js/common/mapaP.js`
**Línea crítica**: ~385-396
**Función**: Event listener `contextmenu`

**Cambio requerido**:
- ❌ QUITAR: `mostrarMenuContextual(e)`
- ✅ AGREGAR: `MiRadial.mostrarMenu(punto.x, punto.y, tipo)` con `selectedUnit` establecido

---

## 🧪 TESTING RÁPIDO

1. Crear marcador/línea/polígono
2. Click derecho sobre elemento
3. VERIFICAR:
   - ✅ Se abre MiRadial (NO menú contextual nativo)
   - ✅ Menú aparece SOBRE el elemento (no en otro lugar)
   - ✅ Iconos se ven correctamente (Font Awesome funciona)
   - ✅ Al hacer hover sobre icono, aparece descripción

---

## ⏰ ESTIMACIÓN

- **Fix #1**: 5 minutos
- **Fix #2**: Ya incluido en Fix #1
- **Fix #3**: 2 minutos (agregar línea en HTML)
- **Testing**: 3 minutos

**TOTAL**: ~10 minutos

---

## 🚀 SIGUIENTE PASO

**EJECUTAR AHORA**:
```bash
# 1. Abrir mapaP.js línea 385
# 2. Reemplazar código del contextmenu
# 3. Guardar
# 4. Abrir planeamiento.html <head>
# 5. Agregar Font Awesome 6
# 6. Recargar página
# 7. Probar click derecho
```
