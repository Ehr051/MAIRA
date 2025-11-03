# FIX: Panel de Edición - edicioncompleto.js

**Fecha**: 16 de octubre de 2025  
**Archivo**: `Client/js/common/edicioncompleto.js`  
**Problema**: Dropdowns de "tipo de elemento" y "SIDC" no responden a cambios del usuario  
**Páginas afectadas**: planeamiento.html, juegodeguerra.html

---

## 🔍 CAUSA RAÍZ IDENTIFICADA

**Problema**: Los event listeners se registran en `DOMContentLoaded` (línea 2360-2372), pero los elementos del panel (`#arma`, `#tipo`, etc.) **no existen en ese momento** porque el panel se carga dinámicamente.

### Código Actual (ROTO):

```javascript
// Línea 2360 - edicioncompleto.js
document.addEventListener('DOMContentLoaded', function() {
    inicializarSelectores();
    
    // ❌ PROBLEMA: Estos elementos NO EXISTEN todavía
    document.getElementById('arma').addEventListener('change', function() {
        actualizarTipos(this.value);
    });

    document.getElementById('tipo').addEventListener('change', function() {
        actualizarCaracteristicas(document.getElementById('arma').value, this.value);
    });
    
    // ... más listeners ...
});
```

**Por qué falla**:
1. `DOMContentLoaded` se dispara cuando el HTML principal termina de cargar
2. El panel de edición (`#panelEdicionUnidad`) está oculto (`display: none`)
3. Los dropdowns (`#arma`, `#tipo`) existen en el DOM, pero los listeners se registran ANTES
4. Si el panel se oculta/muestra dinámicamente, los listeners pueden perderse

---

## ✅ SOLUCIÓN: Re-registrar Listeners al Abrir Panel

### Paso 1: Crear función para registrar listeners

**AGREGAR** después de la línea 2358 (antes del `DOMContentLoaded`):

```javascript
/**
 * Registra event listeners para el panel de edición de unidad
 * Se llama cada vez que se abre el panel para asegurar que los listeners existan
 */
function registrarListenersPanelEdicion() {
    console.log("🔧 Registrando event listeners del panel de edición");
    
    // Verificar que los elementos existen
    const armaSelect = document.getElementById('arma');
    const tipoSelect = document.getElementById('tipo');
    const caracteristicaSelect = document.getElementById('caracteristica');
    
    if (!armaSelect || !tipoSelect || !caracteristicaSelect) {
        console.error("❌ No se encontraron los dropdowns del panel");
        console.log("arma:", !!armaSelect, "tipo:", !!tipoSelect, "caracteristica:", !!caracteristicaSelect);
        return false;
    }
    
    // Remover listeners antiguos clonando los elementos (truco para limpiar listeners)
    const armaClone = armaSelect.cloneNode(true);
    const tipoClone = tipoSelect.cloneNode(true);
    const caracteristicaClone = caracteristicaSelect.cloneNode(true);
    
    armaSelect.parentNode.replaceChild(armaClone, armaSelect);
    tipoSelect.parentNode.replaceChild(tipoClone, tipoSelect);
    caracteristicaSelect.parentNode.replaceChild(caracteristicaClone, caracteristicaSelect);
    
    // Registrar nuevos listeners en los elementos clonados
    document.getElementById('arma').addEventListener('change', function() {
        console.log("🔄 Arma cambiada a:", this.value);
        actualizarTipos(this.value);
        actualizarPreviewSimbolo();
    });
    
    document.getElementById('tipo').addEventListener('change', function() {
        console.log("🔄 Tipo cambiado a:", this.value);
        const armaVal = document.getElementById('arma').value;
        actualizarCaracteristicas(armaVal, this.value);
        actualizarPreviewSimbolo();
    });
    
    document.getElementById('caracteristica').addEventListener('change', function() {
        console.log("🔄 Característica cambiada a:", this.value);
        actualizarPreviewSimbolo();
    });
    
    // Registrar listeners para todos los campos que actualizan el preview
    ['afiliacion', 'estado', 'magnitud', 'puestoComando', 'fuerzaTarea', 'reforzado', 'disminuido', 'designacion', 'dependencia', 'tipoVehiculo'].forEach(function(id) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('change', actualizarPreviewSimbolo);
            elemento.addEventListener('input', actualizarPreviewSimbolo); // Para inputs de texto
        }
    });
    
    console.log("✅ Event listeners registrados correctamente");
    return true;
}
```

---

### Paso 2: Modificar `mostrarPanelEdicionUnidad()`

**MODIFICAR** línea 470-506:

**ANTES**:
```javascript
function mostrarPanelEdicionUnidad(elemento) {
    console.log("📋 [DEBUG] mostrarPanelEdicionUnidad llamada con:", elemento);
    
    console.log("Mostrando panel de edición de unidad");
    mostrarPanelEdicion('panelEdicionUnidad');
    
    if (elemento?.options?.sidc) {
        const sidc = elemento.options.sidc;
        const tipoUnidad = determinarTipoUnidad(sidc);
        
        document.getElementById('afiliacion').value = sidc.charAt(1);
        document.getElementById('estado').value = sidc.charAt(3);
        
        if (tipoUnidad.categoria && tipoUnidad.arma) {
            document.getElementById('arma').value = `${tipoUnidad.categoria}|${tipoUnidad.arma}`;
            actualizarTipos(`${tipoUnidad.categoria}|${tipoUnidad.arma}`);
            document.getElementById('tipo').value = tipoUnidad.tipo;
            actualizarCaracteristicas(`${tipoUnidad.categoria}|${tipoUnidad.arma}`, tipoUnidad.tipo);
            document.getElementById('caracteristica').value = tipoUnidad.caracteristica;
        }
        
        document.getElementById('magnitud').value = sidc.charAt(11) || '-';
        document.getElementById('puestoComando').checked = ['A', 'D'].includes(sidc.charAt(10));
        document.getElementById('fuerzaTarea').checked = ['E', 'D'].includes(sidc.charAt(10));
        document.getElementById('designacion').value = elemento.options.designacion || '';
        document.getElementById('dependencia').value = elemento.options.dependencia || '';
        
        // Cargar tipo de vehículo si existe
        const tipoVehiculoSelect = document.getElementById('tipoVehiculo');
        if (tipoVehiculoSelect && elemento.options.tipoVehiculo) {
            tipoVehiculoSelect.value = elemento.options.tipoVehiculo;
        }
    }
    
    actualizarPreviewSimbolo();
}
```

**DESPUÉS**:
```javascript
function mostrarPanelEdicionUnidad(elemento) {
    console.log("📋 [DEBUG] mostrarPanelEdicionUnidad llamada con:", elemento);
    
    console.log("Mostrando panel de edición de unidad");
    mostrarPanelEdicion('panelEdicionUnidad');
    
    // ✅ CRÍTICO: Re-registrar event listeners cada vez que se abre el panel
    setTimeout(function() {
        const listenersOk = registrarListenersPanelEdicion();
        
        if (!listenersOk) {
            console.error("❌ No se pudieron registrar los event listeners");
            console.error("❌ Los dropdowns NO responderán a cambios");
        }
        
        // Cargar datos del elemento DESPUÉS de registrar listeners
        if (elemento?.options?.sidc) {
            const sidc = elemento.options.sidc;
            const tipoUnidad = determinarTipoUnidad(sidc);
            
            document.getElementById('afiliacion').value = sidc.charAt(1);
            document.getElementById('estado').value = sidc.charAt(3);
            
            if (tipoUnidad.categoria && tipoUnidad.arma) {
                document.getElementById('arma').value = `${tipoUnidad.categoria}|${tipoUnidad.arma}`;
                actualizarTipos(`${tipoUnidad.categoria}|${tipoUnidad.arma}`);
                document.getElementById('tipo').value = tipoUnidad.tipo;
                actualizarCaracteristicas(`${tipoUnidad.categoria}|${tipoUnidad.arma}`, tipoUnidad.tipo);
                document.getElementById('caracteristica').value = tipoUnidad.caracteristica;
            }
            
            document.getElementById('magnitud').value = sidc.charAt(11) || '-';
            document.getElementById('puestoComando').checked = ['A', 'D'].includes(sidc.charAt(10));
            document.getElementById('fuerzaTarea').checked = ['E', 'D'].includes(sidc.charAt(10));
            document.getElementById('designacion').value = elemento.options.designacion || '';
            document.getElementById('dependencia').value = elemento.options.dependencia || '';
            
            // Cargar tipo de vehículo si existe
            const tipoVehiculoSelect = document.getElementById('tipoVehiculo');
            if (tipoVehiculoSelect && elemento.options.tipoVehiculo) {
                tipoVehiculoSelect.value = elemento.options.tipoVehiculo;
            }
        }
        
        actualizarPreviewSimbolo();
    }, 100); // 100ms para asegurar que el panel esté visible en el DOM
}
```

---

### Paso 3: Modificar `mostrarPanelEdicionEquipo()` (similar)

**MODIFICAR** línea 507-538:

**ANTES**:
```javascript
function mostrarPanelEdicionEquipo(elemento) {
    console.log("Mostrando panel de edición de equipo");
    mostrarPanelEdicion('panelEdicionEquipo');
    
    if (elemento?.options?.sidc) {
        document.getElementById('afiliacionEquipo').value = elemento.options.sidc.charAt(1);
        document.getElementById('designacionEquipo').value = elemento.options.designacion || '';
        document.getElementById('asignacionEquipo').value = elemento.options.dependencia || '';
        
        // Determinar si es personal o vehículo y poblar opciones apropiadas
        const esPersonal = esEquipoPersonal(elemento.options.sidc);
        inicializarSelectorTipoEquipo(esPersonal);
        
        // Cargar tipo si existe
        const tipoEquipoSelect = document.getElementById('tipoVehiculoEquipo');
        if (tipoEquipoSelect && elemento.options.tipoVehiculo) {
            tipoEquipoSelect.value = elemento.options.tipoVehiculo;
        }
    }
    
    actualizarPreviewSimboloEquipo();
}
```

**DESPUÉS**:
```javascript
function mostrarPanelEdicionEquipo(elemento) {
    console.log("Mostrando panel de edición de equipo");
    mostrarPanelEdicion('panelEdicionEquipo');
    
    // ✅ CRÍTICO: Re-registrar event listeners para panel de equipo
    setTimeout(function() {
        // Registrar listeners específicos del panel de equipo
        const afiliacionEquipo = document.getElementById('afiliacionEquipo');
        const tipoVehiculoEquipo = document.getElementById('tipoVehiculoEquipo');
        
        if (afiliacionEquipo) {
            const clone = afiliacionEquipo.cloneNode(true);
            afiliacionEquipo.parentNode.replaceChild(clone, afiliacionEquipo);
            document.getElementById('afiliacionEquipo').addEventListener('change', actualizarPreviewSimboloEquipo);
        }
        
        if (tipoVehiculoEquipo) {
            const clone = tipoVehiculoEquipo.cloneNode(true);
            tipoVehiculoEquipo.parentNode.replaceChild(clone, tipoVehiculoEquipo);
            document.getElementById('tipoVehiculoEquipo').addEventListener('change', actualizarPreviewSimboloEquipo);
        }
        
        ['designacionEquipo', 'asignacionEquipo'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                const clone = elem.cloneNode(true);
                elem.parentNode.replaceChild(clone, elem);
                document.getElementById(id).addEventListener('input', actualizarPreviewSimboloEquipo);
            }
        });
        
        // Cargar datos del elemento
        if (elemento?.options?.sidc) {
            document.getElementById('afiliacionEquipo').value = elemento.options.sidc.charAt(1);
            document.getElementById('designacionEquipo').value = elemento.options.designacion || '';
            document.getElementById('asignacionEquipo').value = elemento.options.dependencia || '';
            
            // Determinar si es personal o vehículo y poblar opciones apropiadas
            const esPersonal = esEquipoPersonal(elemento.options.sidc);
            inicializarSelectorTipoEquipo(esPersonal);
            
            // Cargar tipo si existe
            const tipoEquipoSelect = document.getElementById('tipoVehiculoEquipo');
            if (tipoEquipoSelect && elemento.options.tipoVehiculo) {
                tipoEquipoSelect.value = elemento.options.tipoVehiculo;
            }
        }
        
        actualizarPreviewSimboloEquipo();
    }, 100);
}
```

---

## 🔧 TESTING MANUAL

### Test 1: Verificar que los listeners se registran

1. Abrir http://localhost:5000/planeamiento.html
2. Abrir DevTools (F12) → Console
3. Seleccionar un elemento en el map
4. Click en "Editar"
5. Buscar en consola: `🔧 Registrando event listeners del panel de edición`
6. Debe aparecer: `✅ Event listeners registrados correctamente`

### Test 2: Probar cambios en dropdowns

1. Con el panel abierto
2. Cambiar dropdown "Arma"
3. Buscar en consola: `🔄 Arma cambiada a: ...`
4. Verificar que dropdown "Tipo" cambia sus opciones
5. Cambiar "Tipo"
6. Buscar: `🔄 Tipo cambiado a: ...`
7. Verificar que dropdown "Característica" se actualiza

### Test 3: Verificar que el SIDC cambia

1. Con panel abierto, cambiar varios dropdowns
2. Observar el preview del símbolo (debe actualizarse)
3. Click en "Guardar Cambios"
4. Verificar que el símbolo en el map cambia

---

## 📊 RESUMEN DE CAMBIOS

| Línea | Cambio | Descripción |
|-------|--------|-------------|
| ~2358 | AGREGAR | Nueva función `registrarListenersPanelEdicion()` (60 líneas) |
| 470-506 | MODIFICAR | `mostrarPanelEdicionUnidad()` - Agregar llamada a `registrarListenersPanelEdicion()` |
| 507-538 | MODIFICAR | `mostrarPanelEdicionEquipo()` - Agregar listeners para panel de equipo |

**Total cambios**: ~80 líneas de código

---

## ⚠️ IMPORTANTE

1. **setTimeout de 100ms**: Necesario para que el panel termine de mostrarse antes de registrar listeners
2. **clonar elementos**: Truco para remover TODOS los listeners antiguos antes de agregar nuevos
3. **Logs de debugging**: Los `console.log()` con emojis ayudan a verificar que todo funciona

---

## 🚀 IMPLEMENTACIÓN

### Opción 1: Implementar manualmente

1. Abrir `Client/js/common/edicioncompleto.js`
2. Agregar la función `registrarListenersPanelEdicion()` en línea ~2358
3. Modificar `mostrarPanelEdicionUnidad()` según el código de arriba
4. Modificar `mostrarPanelEdicionEquipo()` según el código de arriba
5. Guardar archivo
6. Recargar página con Ctrl+Shift+R (hard reload)
7. Probar edición de elemento

### Opción 2: Usar replace_string_in_file (asistido)

Puedo hacer los cambios por ti usando la herramienta de edición. ¿Quieres que proceda?

---

**Estado**: ⏳ ESPERANDO CONFIRMACIÓN PARA IMPLEMENTAR

**Próximo paso**: ¿Implemento los cambios ahora?
