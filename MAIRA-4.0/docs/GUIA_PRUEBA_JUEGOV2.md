# 🧪 GUÍA DE PRUEBA - JUEGO DE GUERRA V2

**Fecha**: 5 de noviembre de 2025
**Versión**: 2.0 Beta
**Branch**: feature/juego-guerra-v2

---

## ✅ LO QUE ESTÁ IMPLEMENTADO

### Sistema de Órdenes V2
- ✅ OrdenBase.js - Clase abstracta
- ✅ OrdenMovimiento.js - Movimiento con pathfinding A*
- ✅ OrdenAtaque.js - Ataque con línea de vista
- ✅ Pathfinding.js - A* sobre hexgrid
- ✅ OrdenesQueueV2.js - Cola secuencial + tiempo real
- ✅ PanelCoordinacionOrdenes.js - Timeline visual

### Integración
- ✅ juegodeguerraV2.html - Página principal
- ✅ iniciarpartida.js - Redirige a V2
- ✅ Scripts V2 cargados en orden correcto

---

## 🚀 CÓMO PROBAR EL FLUJO COMPLETO

### Paso 1: Iniciar Servidor

```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
python3 app.py
# O si usas HTTPS:
./start_https.sh
```

Verifica que el servidor está corriendo en: `http://localhost:5000` (o el puerto que uses)

---

### Paso 2: Abrir Iniciar Partida

1. Abre en el navegador: `http://localhost:5000/iniciarpartida.html`

2. Deberías ver la pantalla de "MAIRA - Iniciar Partida"

---

### Paso 3: Crear Partida Local

**Configuración General:**
1. Seleccionar "Modo Local"
2. Llenar datos:
   - Nombre: "Test Órdenes V2"
   - Duración partida: 60 minutos
   - Duración turno: 5 minutos (esto es el tiempo real del turno, recuerda que 1 turno = 1 hora en el terreno)
   - Objetivo: "Probar sistema de órdenes"
   - Cantidad jugadores: 2

3. Click "Continuar"

**Configuración Jugadores:**
1. Jugador 1: Nombre "Azul", Equipo "azul", IA desactivado
2. Jugador 2: Nombre "Rojo", Equipo "rojo", IA desactivado

3. Click "Iniciar Juego"

**Resultado esperado**:
- ✅ Redirige a `juegodeguerraV2.html`
- ✅ Se muestra el mapa
- ✅ Loading screen desaparece

---

### Paso 4: Verificar Carga de Scripts V2

Abre la **Consola del Navegador** (F12 → Console)

Deberías ver logs como:
```javascript
✅ OrdenBase.js cargado
✅ OrdenMovimiento.js cargado
✅ OrdenAtaque.js cargado
✅ Pathfinding.js cargado
✅ OrdenesQueueV2.js cargado
✅ PanelCoordinacionOrdenes.js cargado
🎮 JUEGO DE GUERRA V2 - Iniciando...
✅ Eventos V2 configurados
```

**Si ves errores**, anota cuáles y en qué línea ocurren.

---

### Paso 5: Verificar Variables Globales

En la **Consola del Navegador**, ejecuta:

```javascript
console.log({
    OrdenBase: typeof OrdenBase,
    OrdenMovimiento: typeof OrdenMovimiento,
    OrdenAtaque: typeof OrdenAtaque,
    Pathfinding: typeof Pathfinding,
    OrdenesQueueV2: typeof OrdenesQueueV2,
    PanelCoordinacionOrdenes: typeof PanelCoordinacionOrdenes,
    HexGrid: typeof HexGrid,
    map: typeof map
});
```

**Resultado esperado**:
```javascript
{
    OrdenBase: "function",
    OrdenMovimiento: "function",
    OrdenAtaque: "function",
    Pathfinding: "function",
    OrdenesQueueV2: "function",
    PanelCoordinacionOrdenes: "function",
    HexGrid: "object",
    map: "object"
}
```

---

### Paso 6: Probar Panel de Coordinación

1. **Abrir Sidebar**: Click en el icono de hamburguesa (☰) en la parte superior izquierda

2. **Ir a Panel de Órdenes**: Click en el tab "Órdenes" (icono de tareas)

3. **Abrir Panel de Coordinación**: Click en "Abrir Panel de Coordinación"

**Resultado esperado**:
- ✅ Se abre un panel en la parte inferior con un timeline
- ✅ El panel tiene cabecera azul con título "Coordinación de Órdenes"
- ✅ Se ve un timeline horizontal con escala de tiempo
- ✅ Panel lateral con "Unidades" (vacío por ahora)

---

### Paso 7: Probar Creación de Órdenes (Manualmente)

En la **Consola del Navegador**, ejecuta paso a paso:

```javascript
// 1. Crear pathfinding
window.pathfinding = new Pathfinding(window.HexGrid);
console.log('✅ Pathfinding creado');

// 2. Crear cola de órdenes
window.colaOrdenesAzul = new OrdenesQueueV2('azul');
console.log('✅ Cola de órdenes creada');

// 3. Crear unidad de prueba
const unidadPrueba = {
    id: 'test_unit_1',
    nombre: 'Infantería RI-3',
    equipo: 'azul',
    tipoUnidad: 'infanteria',
    sidc: 'SFGPUCII------',
    latlng: map.getCenter(),
    hexActual: null,
    getLatLng: function() { return this.latlng; }
};
console.log('✅ Unidad de prueba creada');

// 4. Crear destino a 1km al norte
const centroActual = map.getCenter();
const destino = {
    lat: centroActual.lat + 0.01, // ~1km al norte
    lng: centroActual.lng
};

// 5. Crear orden de movimiento
const ordenMovimiento = new OrdenMovimiento(unidadPrueba, destino);
console.log('✅ Orden de movimiento creada:', ordenMovimiento);

// 6. Agregar a cola
colaOrdenesAzul.agregarOrden(ordenMovimiento);
console.log('✅ Orden agregada a cola');

// 7. Ver estadísticas
console.log('📊 Estadísticas:', colaOrdenesAzul.getEstadisticas());
```

**Resultado esperado**:
- ✅ Todos los pasos se ejecutan sin errores
- ✅ Estadísticas muestran 1 orden pendiente

---

### Paso 8: Visualizar Orden en Timeline

```javascript
// Actualizar panel de coordinación
window.panelCoordinacion.renderizar();
```

**Resultado esperado**:
- ✅ En el panel de coordinación se ve la unidad "test_unit_1"
- ✅ Se ve una barra verde (movimiento) en el timeline
- ✅ La barra tiene duración proporcional al tiempo estimado

---

### Paso 9: Validar Orden

```javascript
// Validar todas las órdenes
await colaOrdenesAzul.validarOrdenes();
```

**Resultado esperado**:
- ✅ Mensaje en consola: "✅ Validación completa: 1 válidas, 0 inválidas"
- ✅ La barra en el timeline cambia de color (si era gris, ahora verde)

---

### Paso 10: Ejecutar Turno (Simulación)

```javascript
// Ejecutar turno 1
const resultado = await colaOrdenesAzul.ejecutarTurno(1);
console.log('Resultado ejecución:', resultado);
```

**Resultado esperado**:
- ✅ La orden se ejecuta (animación si está implementada)
- ✅ Mensaje en consola con resultado
- ✅ Estadísticas muestran 1 orden ejecutada

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "OrdenBase is not defined"

**Causa**: Scripts V2 no se cargaron

**Solución**:
1. Verifica que `juegodeguerraV2.html` tiene los scripts V2
2. Verifica la ruta: `js/modules/juegoV2/...`
3. Revisa la consola para errores 404

### Problema 2: "HexGrid is not defined"

**Causa**: HexGrid no se inicializó

**Solución**:
```javascript
// Verificar si existe
console.log(window.HexGrid);

// Si no existe, el sistema de hexgrid no está activo
// Revisar gestorFases.js y su inicialización
```

### Problema 3: Panel de Coordinación no se abre

**Causa**: Error en la inicialización del panel

**Solución**:
```javascript
// Ver errores en consola
console.log(window.panelCoordinacion);

// Intentar crear manualmente
window.colaOrdenesAzul = new OrdenesQueueV2('azul');
window.panelCoordinacion = new PanelCoordinacionOrdenes(window.colaOrdenesAzul);
window.panelCoordinacion.mostrar();
```

### Problema 4: "map.getCenter is not a function"

**Causa**: Mapa no está inicializado

**Solución**:
```javascript
// Esperar a que el mapa esté listo
setTimeout(() => {
    // Intentar de nuevo
}, 2000);
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

### Inicialización
- [ ] Servidor corriendo sin errores
- [ ] `iniciarpartida.html` carga correctamente
- [ ] Redirección a `juegodeguerraV2.html` funciona
- [ ] Mapa se carga y es visible

### Scripts V2
- [ ] Todos los logs de carga aparecen en consola
- [ ] No hay errores 404 en consola
- [ ] Variables globales están definidas
- [ ] EventBus está disponible (opcional)

### Panel de Coordinación
- [ ] Panel se abre sin errores
- [ ] Timeline se renderiza
- [ ] Zoom funciona (+/-)
- [ ] Panel lateral muestra unidades (cuando hay)

### Sistema de Órdenes
- [ ] Se pueden crear órdenes manualmente
- [ ] Órdenes se agregan a la cola
- [ ] Validación funciona
- [ ] Ejecución funciona (aunque sea simulada)

---

## 🚀 PRÓXIMAS PRUEBAS

Una vez que lo anterior funcione, probar:

### 1. Integración con Fases
- [ ] Fase Preparación → Definir Sector
- [ ] Fase Preparación → Definir Zonas
- [ ] Fase Despliegue → Colocar unidades
- [ ] Fase Combate → Dar órdenes

### 2. Órdenes Reales con Elementos del Mapa
- [ ] Crear unidad milsymbol en el mapa
- [ ] Darle orden de movimiento desde menú radial
- [ ] Ver ruta calculada en el mapa
- [ ] Ejecutar y ver animación

### 3. Órdenes Secuenciales
- [ ] Agregar múltiples órdenes a una unidad
- [ ] Ver en timeline que se ordenan correctamente
- [ ] Ejecutar y verificar que se ejecutan en orden

### 4. Coordinación Temporal
- [ ] Crear órdenes para múltiples unidades
- [ ] Configurar tiempos de inicio diferentes
- [ ] Verificar que se ejecutan en paralelo cuando corresponde

---

## 📝 NOTAS PARA EL DESARROLLADOR

### Estado Actual del Sistema

**Implementado** (Backend/Lógica):
- ✅ Sistema de órdenes completo
- ✅ Pathfinding A*
- ✅ Cola secuencial + tiempo real
- ✅ Panel de coordinación (UI básica)

**Pendiente** (Integración):
- ⏳ Menú radial para dar órdenes
- ⏳ Integración con fases del juego
- ⏳ Animaciones de ejecución
- ⏳ Sincronización 2D ↔ 3D
- ⏳ OrdenDefensa, OrdenIngeniero
- ⏳ Drag & drop en timeline

**Bugs Conocidos**:
- El panel de coordinación no actualiza automáticamente (necesita `renderizar()` manual)
- No hay feedback visual al agregar órdenes
- Faltan tooltips en el timeline

---

## 🆘 SI TODO FALLA

Si nada de lo anterior funciona:

1. **Revisa la consola** - Anota todos los errores
2. **Verifica rutas** - Asegúrate que los archivos existen
3. **Prueba archivos individuales**:
   ```javascript
   // Cargar y probar cada clase por separado
   const base = new OrdenBase(unidad, 'test'); // Debería dar error (clase abstracta)
   ```
4. **Compara con juegodeguerra.html** - Ver si falta algún script crítico

---

**Documentado por**: Claude (Sistema de Órdenes V2)
**Última actualización**: 5 de noviembre de 2025
**Próxima revisión**: Después de primeras pruebas
