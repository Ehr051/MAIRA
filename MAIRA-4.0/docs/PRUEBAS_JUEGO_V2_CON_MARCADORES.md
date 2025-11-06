# 🧪 GUÍA DE PRUEBAS - JUEGO V2 CON MARCADORES SIDC

**Fecha:** 05 Noviembre 2025
**Estado:** ✅ Listo para probar
**Integración:** Sistema de marcadores SIDC existente + Sistema de órdenes V2

---

## 📋 CAMBIOS IMPLEMENTADOS

### ✅ GestorOrdenesV2.js Actualizado

1. **Función `obtenerPosicionUnidad()`** adaptada para marcadores Leaflet
   - Detecta si es un `L.marker` (tiene método `getLatLng()`)
   - Convierte LatLng a coordenada hexagonal si HexGrid disponible
   - Maneja fallbacks para otros formatos

2. **Función `crearOrdenMovimiento()`** adaptada
   - Obtiene `unidadId` desde `marker.options.id`
   - Obtiene `equipo` desde `marker.options.equipo`
   - Guarda referencia al marcador en `unidadRef`

3. **Función `crearOrdenAtaque()`** adaptada
   - Misma lógica que movimiento
   - Funciona con marcadores SIDC

4. **Menú Radial Integrado**
   - Inyecta items V2 en `MENU_ITEMS.elemento`
   - Registra acciones como funciones globales:
     - `window.ordenMovimiento()`
     - `window.ordenAtaque()`
     - `window.ordenDefensa()`
     - `window.verOrdenesUnidad()`
   - Crea `window.acciones.ejecutarAccion()` para compatibilidad con miradial.js

### ✅ InicializadorJuegoV2.js Actualizado

1. **Menú Radial configurado**
   - Setea `MiRadial.faseJuego = 'combate'`
   - Esto permite que miradial.js ejecute acciones V2

---

## 🎮 FLUJO DE PRUEBA COMPLETO

### Paso 1: Cargar Juego V2

1. Abre tu navegador y navega a:
   ```
   http://localhost:5001/Client/juegodeguerraV2.html
   ```

2. Abre la **Consola del navegador** (F12)

3. Espera a ver el mensaje:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎮 JUEGO DE GUERRA V2 - INICIANDO
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

4. Verifica que todos los componentes digan `✅`

5. Busca el mensaje final:
   ```
   ✅ JUEGO DE GUERRA V2 LISTO
   ```

---

### Paso 2: Verificar Elementos Visuales V2

Deberías ver en pantalla:

1. **Badge V2** (arriba a la derecha, morado)
   ```
   🎮 JUEGO V2
   ```

2. **Indicador de Fase** (arriba a la derecha, azul)
   ```
   📋 Planificación
   ```

3. **Panel de Coordinación** (abajo, negro con borde verde)
   - Altura: 250px
   - Debe estar vacío inicialmente

4. **Botones de Control** (derecha)
   ```
   [✅ Confirmar Órdenes]
   [⏭️  Siguiente Turno]
   [📊 Toggle Panel]
   ```

---

### Paso 3: Agregar Unidades (Marcadores SIDC)

#### 3.1. Abrir Menú de Símbolos

1. Busca el botón **"Agregar"** en la interfaz
2. Se debería abrir un menú con categorías de símbolos militares

#### 3.2. Seleccionar Tipo de Unidad

1. Navega por las categorías (Infantería, Blindados, Artillería, etc.)
2. Selecciona un símbolo, por ejemplo:
   - **Infantería Motorizada**
   - **Tanque**
   - **Artillería**

#### 3.3. Colocar en el Mapa

1. Después de seleccionar el símbolo, **click en el mapa**
2. Aparecerá el símbolo militar en esa posición
3. Repite para agregar más unidades:
   - **3-4 unidades azules** (amigo)
   - Cambia a **enemigo** en el selector
   - **3-4 unidades rojas** (hostil)

#### 3.4. Verificar en Consola

```javascript
// En consola, ejecuta:
window.calcoActivo.eachLayer((layer) => {
    if (layer.options && layer.options.sidc) {
        console.log('Unidad:', {
            id: layer.options.id,
            equipo: layer.options.equipo,
            sidc: layer.options.sidc,
            pos: layer.getLatLng()
        });
    }
});
```

Deberías ver todas las unidades que agregaste.

---

### Paso 4: Dar Órdenes a una Unidad

#### 4.1. Seleccionar Unidad

1. **Doble-click** en una unidad azul
2. Debería aparecer el **menú radial** con opciones:
   ```
   • Mover
   • Atacar
   • Defender
   • Ver Órdenes
   • Cerrar
   ```

#### 4.2. Dar Orden de Movimiento

1. Click en **"Mover"**
2. El menú desaparece
3. El cursor cambia a **crosshair** (cruz)
4. Mueve el mouse sobre el mapa
   - Deberías ver un **preview de ruta** (línea verde punteada)
5. **Click en el destino**
6. Deberías ver notificación:
   ```
   ✅ Orden de movimiento agregada
   ```

#### 4.3. Verificar en Consola

```
[GestorOrdenesV2] 📍 Iniciando orden de movimiento...
[GestorOrdenesV2] ✅ Orden de movimiento agregada para unidad_XXXXX
```

#### 4.4. Verificar en Panel de Coordinación

1. Mira el **panel inferior**
2. Debería aparecer una **barra verde** representando la orden de movimiento
3. Con duración estimada según distancia

---

### Paso 5: Dar Orden de Ataque

1. **Doble-click** en otra unidad azul
2. Click en **"Atacar"**
3. El cursor cambia a crosshair
4. Mueve el mouse sobre el mapa
   - Deberías ver **preview de línea** (roja punteada)
5. **Click en objetivo** (puede ser una unidad roja o posición)
6. Notificación: `✅ Orden de ataque agregada`

---

### Paso 6: Revisar Panel de Coordinación

En el **panel inferior** deberías ver:

```
┌────────────────────────────────────────────────────┐
│ UNIDAD 1    [═══════════════►]  (verde = movimiento)│
│ UNIDAD 2      [═══►]            (rojo = ataque)      │
└────────────────────────────────────────────────────┘
```

- **Eje horizontal:** Tiempo (0 a 60 minutos)
- **Barras de color:**
  - Verde = Movimiento
  - Rojo = Ataque
  - Azul = Defensa

---

### Paso 7: Confirmar Órdenes

1. Click en botón **"✅ Confirmar Órdenes"**
2. En consola deberías ver:
   ```
   [GestorOrdenesV2] ✅ Confirmando órdenes...
   [OrdenesQueueV2] Validando órdenes del equipo azul...
   [OrdenesQueueV2] ✅ Todas las órdenes válidas
   ```

3. Si hay errores, aparecerá:
   ```
   ⚠️ Errores en órdenes del equipo azul
   ```

---

### Paso 8: Ejecutar Turno

1. Si la confirmación fue exitosa, el sistema pasa a **Ejecución**
2. El indicador de fase cambia:
   ```
   ⚡ Ejecución (color naranja)
   ```

3. En consola:
   ```
   [GestorOrdenesV2] ⚡ Iniciando fase de EJECUCIÓN
   [GestorOrdenesV2] ⚡ Ejecutando órdenes del equipo azul
   [OrdenMovimiento] Ejecutando movimiento...
   [OrdenAtaque] Ejecutando ataque...
   ```

4. Las órdenes se ejecutan automáticamente

---

### Paso 9: Revisión de Resultados

1. Después de la ejecución, el sistema pasa a **Revisión**:
   ```
   📊 Revisión (color verde)
   ```

2. En consola aparece:
   ```
   📊 LOG TURNO 1
   🎯 Equipo: azul
   ```

3. Con tabla de resultados de cada orden

---

### Paso 10: Siguiente Turno

1. Click en **"⏭️ Siguiente Turno"**
2. El sistema vuelve a **Planificación**
3. El contador de turno se incrementa
4. Puedes dar nuevas órdenes

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Menú radial no aparece"

**Causa:** MiRadial no inicializado
**Solución:**
```javascript
// En consola:
if (window.MiRadial && window.map) {
    window.MiRadial.init(window.map);
    window.MiRadial.faseJuego = 'combate';
}
```

### Problema 2: "Menú aparece pero no tiene opciones V2"

**Causa:** MENU_ITEMS.elemento no actualizado
**Solución:**
```javascript
// En consola:
window.gestorOrdenesV2.configurarMenuRadial();
```

### Problema 3: "Click en 'Mover' no hace nada"

**Causa:** Acciones no registradas
**Verificar:**
```javascript
console.log(typeof window.ordenMovimiento); // Debe ser 'function'
console.log(typeof window.acciones.ejecutarAccion); // Debe ser 'function'
```

**Solución:**
```javascript
window.gestorOrdenesV2.registrarAccionesMenu();
```

### Problema 4: "Preview de ruta no se muestra"

**Causa:** HexGrid no configurado o eventos de mapa no funcionan
**Verificar:**
```javascript
console.log(window.HexGrid); // Debe existir
console.log(window.gestorOrdenesV2.hexGrid); // Debe existir
```

### Problema 5: "Orden se crea pero no aparece en panel"

**Causa:** Panel no actualizado
**Solución:**
```javascript
window.gestorOrdenesV2.actualizarPanelCoordinacion();
```

### Problema 6: "No puedo agregar unidades"

**Causa:** Sistema de símbolos no cargado
**Verificar:**
```javascript
console.log(typeof window.agregarMarcador); // Debe ser 'function'
console.log(window.calcoActivo); // Debe existir
```

---

## 🔍 COMANDOS DE DEBUGGING

### Ver todas las órdenes de un equipo

```javascript
const colaAzul = window.gestorOrdenesV2.colasOrdenes.get('azul');
console.table(colaAzul.obtenerTodasLasOrdenes());
```

### Ver estadísticas

```javascript
const stats = window.inicializadorV2.obtenerEstadisticas();
console.log(stats);
```

### Ver todas las unidades en el mapa

```javascript
window.calcoActivo.eachLayer((layer) => {
    if (layer.options && layer.options.sidc) {
        console.log(layer.options);
    }
});
```

### Forzar subfase

```javascript
// Volver a planificación
window.gestorOrdenesV2.iniciarPlanificacion();

// Forzar ejecución
window.gestorOrdenesV2.iniciarEjecucion();

// Forzar revisión
window.gestorOrdenesV2.iniciarRevision();
```

### Limpiar todas las órdenes

```javascript
for (const [equipo, cola] of window.gestorOrdenesV2.colasOrdenes) {
    cola.ordenes = [];
    cola.historial = [];
}
window.gestorOrdenesV2.actualizarPanelCoordinacion();
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Marca cada item conforme lo pruebes:

- [ ] Juego V2 carga correctamente
- [ ] Badge "🎮 JUEGO V2" visible
- [ ] Indicador de fase visible
- [ ] Panel de coordinación visible
- [ ] Botones de control visibles
- [ ] Puedo agregar unidades azules
- [ ] Puedo agregar unidades rojas
- [ ] Doble-click en unidad abre menú radial
- [ ] Menú radial tiene opciones V2 (Mover, Atacar, etc.)
- [ ] Click en "Mover" cambia cursor a crosshair
- [ ] Preview de ruta se muestra (línea verde)
- [ ] Click en destino crea orden
- [ ] Orden aparece en panel de coordinación
- [ ] Click en "Atacar" cambia cursor
- [ ] Preview de ataque se muestra (línea roja)
- [ ] Orden de ataque aparece en panel
- [ ] "Confirmar Órdenes" valida correctamente
- [ ] Ejecución automática funciona
- [ ] Fase cambia a "Ejecución"
- [ ] Resultados se muestran en consola
- [ ] "Siguiente Turno" funciona
- [ ] Turno se incrementa

---

## 📸 CAPTURAS ESPERADAS

### Estado Inicial
- Badge V2 arriba derecha
- Indicador "📋 Planificación" azul
- Panel negro vacío abajo
- 3 botones derecha

### Después de Agregar Unidades
- Símbolos militares en el mapa (azules y rojos)
- Panel sigue vacío

### Después de Dar Órdenes
- Panel muestra barras de colores
- Timeline con marcadores de tiempo
- Estadísticas en footer del panel

### Durante Ejecución
- Indicador cambia a "⚡ Ejecución" naranja
- Logs en consola

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE PRUEBA EXITOSA

1. Implementar **OrdenDefensa.js**
2. Implementar **OrdenReconocimiento.js**
3. Implementar **OrdenEspera.js**
4. Mejorar animaciones de ejecución
5. Integrar con vista 3D
6. Sistema de combate con bajas
7. Niebla de guerra

---

**¡El sistema está COMPLETO y listo para probar! 🎉**

**Comparte los logs de la consola cuando pruebes para verificar que todo funciona correctamente.**
