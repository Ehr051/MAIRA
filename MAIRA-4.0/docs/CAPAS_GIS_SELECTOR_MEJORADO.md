# 🗺️ Selector Mejorado de Capas GIS - Propuesta

## 📋 Capas Individuales Disponibles

Basado en el índice maestro, tenemos **6 capas individuales**:

### 🛣️ Transporte (3 capas)
1. **Rutas Nacionales** → 2,723 features (720 tiles)
2. **Rutas Provinciales** → 12,936 features (1,128 tiles)
3. **Caminos** → 84,606 features (793 tiles)

### 💧 Hidrografía (2 capas)
4. **Cursos de Agua Permanentes** → 52,610 features (994 tiles)
5. **Espejos de Agua Permanentes** → 21,524 features (947 tiles)

### 🏘️ Áreas Urbanas (1 capa)
6. **Localidades** → 3,528 features (775 tiles)

---

## 🎨 Propuesta de UI - Selector Desplegable

### Opción 1: Lista de Checkboxes Expandible

```html
<div class="panel-capas-gis">
    <h4>🗺️ Capas GIS Disponibles</h4>
    
    <!-- Grupo Transporte -->
    <div class="grupo-capas">
        <label class="grupo-header">
            <input type="checkbox" id="checkGrupoTransporte" class="check-grupo">
            <strong>🛣️ Transporte</strong> (3 capas)
        </label>
        <div class="capas-individuales" style="margin-left: 20px;">
            <label>
                <input type="checkbox" class="check-capa" data-capa="ruta_nacional">
                Rutas Nacionales <span class="badge">2.7K features</span>
            </label>
            <label>
                <input type="checkbox" class="check-capa" data-capa="ruta_provincial">
                Rutas Provinciales <span class="badge">12.9K features</span>
            </label>
            <label>
                <input type="checkbox" class="check-capa" data-capa="caminos">
                Caminos <span class="badge">84.6K features</span>
            </label>
        </div>
    </div>
    
    <!-- Grupo Hidrografía -->
    <div class="grupo-capas">
        <label class="grupo-header">
            <input type="checkbox" id="checkGrupoHidrografia" class="check-grupo">
            <strong>💧 Hidrografía</strong> (2 capas)
        </label>
        <div class="capas-individuales" style="margin-left: 20px;">
            <label>
                <input type="checkbox" class="check-capa" data-capa="curso_agua_permanente">
                Cursos de Agua <span class="badge">52.6K features</span>
            </label>
            <label>
                <input type="checkbox" class="check-capa" data-capa="espejo_agua_permanente">
                Espejos de Agua <span class="badge">21.5K features</span>
            </label>
        </div>
    </div>
    
    <!-- Grupo Áreas Urbanas -->
    <div class="grupo-capas">
        <label class="grupo-header">
            <input type="checkbox" id="checkGrupoUrbanas" class="check-grupo">
            <strong>🏘️ Áreas Urbanas</strong> (1 capa)
        </label>
        <div class="capas-individuales" style="margin-left: 20px;">
            <label>
                <input type="checkbox" class="check-capa" data-capa="localidades">
                Localidades <span class="badge">3.5K features</span>
            </label>
        </div>
    </div>
    
    <!-- Botones de Control -->
    <div class="botones-control" style="margin-top: 15px;">
        <button id="btnCargarCapasGIS" class="btn btn-primary">
            <i class="fas fa-download"></i> Cargar Capas Seleccionadas
        </button>
        <button id="btnLimpiarCapasGIS" class="btn btn-warning">
            <i class="fas fa-eraser"></i> Limpiar Todo
        </button>
        <button id="btnSeleccionarTodas" class="btn btn-secondary">
            <i class="fas fa-check-double"></i> Seleccionar Todas
        </button>
    </div>
    
    <!-- Estadísticas -->
    <div id="statsCapasGIS" class="stats-capas" style="margin-top: 10px;">
        <small class="text-muted">Selecciona capas para cargar</small>
    </div>
</div>
```

### Opción 2: Select Múltiple con Búsqueda

```html
<div class="panel-capas-gis-compact">
    <h4>🗺️ Capas GIS</h4>
    
    <div class="form-group">
        <label>Seleccionar capas (Ctrl+Click para múltiple):</label>
        <select id="selectCapasGIS" class="form-control" multiple size="8">
            <optgroup label="🛣️ Transporte">
                <option value="ruta_nacional">Rutas Nacionales (2.7K)</option>
                <option value="ruta_provincial">Rutas Provinciales (12.9K)</option>
                <option value="caminos">Caminos (84.6K)</option>
            </optgroup>
            <optgroup label="💧 Hidrografía">
                <option value="curso_agua_permanente">Cursos de Agua (52.6K)</option>
                <option value="espejo_agua_permanente">Espejos de Agua (21.5K)</option>
            </optgroup>
            <optgroup label="🏘️ Áreas Urbanas">
                <option value="localidades">Localidades (3.5K)</option>
            </optgroup>
        </select>
    </div>
    
    <div class="botones-control">
        <button id="btnCargarCapasGIS" class="btn btn-primary btn-block">
            Cargar Capas
        </button>
    </div>
    
    <div id="statsCapasGIS" class="stats-capas"></div>
</div>
```

---

## 📊 Ventajas del Selector Mejorado

### ✅ Opción 1 (Checkboxes Agrupados)
- ✅ Visual e intuitivo
- ✅ Checkboxes de grupo para seleccionar todas de una categoría
- ✅ Badges muestran cantidad de features
- ✅ Botón "Seleccionar Todas"
- ✅ Fácil de entender

### ✅ Opción 2 (Select Múltiple)
- ✅ Compacto (menos espacio)
- ✅ HTML estándar (menos CSS custom)
- ✅ Búsqueda nativa en algunos browsers
- ✅ Más rápido de implementar

---

## 💻 Código JavaScript para Opción 1

```javascript
// Configurar checkboxes de grupo (marcar/desmarcar todos)
document.getElementById('checkGrupoTransporte').addEventListener('change', (e) => {
    const checks = document.querySelectorAll('[data-capa^="ruta_"], [data-capa="caminos"]');
    checks.forEach(check => check.checked = e.target.checked);
});

document.getElementById('checkGrupoHidrografia').addEventListener('change', (e) => {
    const checks = document.querySelectorAll('[data-capa^="curso_agua"], [data-capa^="espejo_agua"]');
    checks.forEach(check => check.checked = e.target.checked);
});

document.getElementById('checkGrupoUrbanas').addEventListener('change', (e) => {
    const checks = document.querySelectorAll('[data-capa="localidades"]');
    checks.forEach(check => check.checked = e.target.checked);
});

// Seleccionar todas
document.getElementById('btnSeleccionarTodas').addEventListener('click', () => {
    document.querySelectorAll('.check-capa').forEach(check => check.checked = true);
    document.querySelectorAll('.check-grupo').forEach(check => check.checked = true);
});

// Cargar capas seleccionadas
document.getElementById('btnCargarCapasGIS').addEventListener('click', async () => {
    const capasSeleccionadas = [];
    document.querySelectorAll('.check-capa:checked').forEach(check => {
        capasSeleccionadas.push(check.dataset.capa);
    });
    
    if (capasSeleccionadas.length === 0) {
        alert('⚠️ Selecciona al menos una capa');
        return;
    }
    
    console.log('🗺️ Cargando capas:', capasSeleccionadas);
    
    // Llamar al endpoint con capas individuales
    const data = await cargarCapasGISArea(capasSeleccionadas);
    
    // Actualizar stats
    const stats = document.getElementById('statsCapasGIS');
    stats.innerHTML = `
        ✅ <strong>${data.tiles_cargados}</strong> tiles cargados<br>
        📊 <strong>${data.features_totales}</strong> features renderizados<br>
        ⏱️ Tiempo: <strong>${data.tiempo_ms}</strong>ms
    `;
});
```

---

## 🔧 Modificación en Backend

El endpoint `/api/capas_gis/consultar` ya soporta capas individuales:

```python
# ANTES (categorías agrupadas)
capas = ['transporte', 'hidrografia', 'areas_urbanas']

# AHORA (capas individuales)
capas = ['ruta_nacional', 'caminos', 'curso_agua_permanente', 'localidades']
```

El backend ya maneja esto correctamente gracias a la estructura de tiles.

---

## 🎯 Recomendación

**Opción 1 (Checkboxes Agrupados)** es la mejor porque:

1. ✅ **UX superior**: Usuario ve exactamente qué está cargando
2. ✅ **Feedback visual**: Badges muestran cantidad de datos
3. ✅ **Flexibilidad**: Checkboxes de grupo para rapidez
4. ✅ **Consistente**: Similar a herramientas GIS profesionales (QGIS, ArcGIS)
5. ✅ **Performance visible**: Usuario puede cargar solo lo necesario

---

## 📈 Performance Esperada

### Carga Individual (ejemplos)

| Capa | Features | Tiempo Estimado |
|------|----------|-----------------|
| Rutas Nacionales | 2,723 | ~50-100ms |
| Caminos | 84,606 | ~200-400ms |
| Cursos de Agua | 52,610 | ~150-300ms |
| Localidades | 3,528 | ~80-150ms |

### Carga Combinada (ejemplos)

| Combinación | Features Totales | Tiempo Estimado |
|-------------|------------------|-----------------|
| Rutas Nac + Prov | 15,659 | ~150-250ms |
| Toda Hidrografía | 74,134 | ~300-500ms |
| Todo Transporte | 100,265 | ~400-700ms |
| **TODAS las 6 capas** | **177,927** | **600-1,200ms** |

**Conclusión**: Con este selector, el usuario puede:
- Cargar solo lo necesario (50-200ms)
- O cargar todo si necesita análisis completo (600-1,200ms)

---

## 🚀 Próximos Pasos

1. ✅ Implementar HTML con checkboxes agrupados
2. ✅ Agregar estilos CSS para badges y grupos
3. ✅ Conectar JavaScript con lógica de carga
4. ✅ Probar performance con diferentes combinaciones
5. ✅ Documentar casos de uso comunes

---

**Estado**: Propuesta lista para implementación  
**Esfuerzo estimado**: 1-2 horas  
**Impacto UX**: 🚀 ALTO (control granular sobre capas)
