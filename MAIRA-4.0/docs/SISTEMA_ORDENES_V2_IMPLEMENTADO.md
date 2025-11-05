# ✅ SISTEMA DE ÓRDENES V2 - IMPLEMENTADO

**Fecha**: 5 de noviembre de 2025
**Estado**: Componentes Core Completados
**Branch**: feature/juego-guerra-v2

---

## 🎯 RESUMEN EJECUTIVO

Se ha implementado el **Sistema de Órdenes V2** completo para el Juego de Guerra, incluyendo:

- ✅ Arquitectura base de órdenes (OrdenBase)
- ✅ Sistema de movimiento con pathfinding A*
- ✅ Sistema de ataque con línea de vista
- ✅ Cola de órdenes por jugador/equipo
- ✅ Pathfinding A* sobre HexGrid con costos de terreno

---

## 📁 ARCHIVOS CREADOS

### Estructura de Carpetas

```
MAIRA-4.0/Client/js/modules/juegoV2/
├── ordenes/
│   ├── OrdenBase.js          ✅ Clase abstracta base
│   ├── OrdenMovimiento.js    ✅ Implementación de movimiento
│   ├── OrdenAtaque.js        ✅ Implementación de ataque
│   └── OrdenesQueue.js       ✅ Cola de órdenes
├── utils/
│   └── Pathfinding.js        ✅ A* sobre hexgrid
├── turnos/
│   └── (pendiente)
├── combate/
│   └── (pendiente)
└── visibilidad/
    └── (pendiente)

MAIRA-4.0/Client/css/modules/juegodeguerraV2/
└── (pendiente)
```

---

## 📋 COMPONENTES IMPLEMENTADOS

### 1. **OrdenBase.js** - Clase Abstracta Base

**Ubicación**: `js/modules/juegoV2/ordenes/OrdenBase.js`

**Funcionalidades**:
- Sistema de estados (pendiente → validando → valida/invalida → ejecutando → completada/cancelada)
- Timestamps para tracking
- Validación y ejecución abstractas (implementadas por subclases)
- Visualización en mapa (limpieza automática)
- Serialización para sincronización online
- Event bus integration
- Sistema de prioridades

**Métodos Principales**:
```javascript
async validar()           // Override en subclases
async ejecutar()          // Override en subclases
dibujarEnMapa()           // Override en subclases
cancelar()                // Cancela y limpia
limpiarVisualizacion()    // Limpia elementos del mapa
serializar()              // Para sync online
```

---

### 2. **Pathfinding.js** - A* sobre HexGrid

**Ubicación**: `js/modules/juegoV2/utils/Pathfinding.js`

**Funcionalidades**:
- Algoritmo A* optimizado para hexágonos axiales
- Cache de rutas calculadas (LRU, max 100)
- Costos de movimiento por terreno:
  - Vegetación (bosque denso x3, bosque x2, vegetación x1.5)
  - Pendiente (>20° x2.5, >10° x1.5)
  - Tipo de unidad (vehículos más rápidos en abierto, más lentos en vegetación)
- Verificación de transitabilidad
- Cálculo de distancia y tiempo estimado

**Métodos Principales**:
```javascript
async calcularRuta(hexInicio, hexDestino, tipoUnidad, opciones)
obtenerVecinos(hex)                    // 6 vecinos hexagonales
esTransitable(hex, tipoUnidad, config) // Validación
calcularCostoMovimiento(hexA, hexB, tipoUnidad, hexDestino)
calcularDistanciaRuta(ruta)            // En metros
calcularTiempoRuta(ruta, tipoUnidad)   // En segundos
```

**Rangos de Velocidad por Unidad**:
- Infantería: 4 km/h
- Vehículo: 30 km/h
- Blindado: 20 km/h
- Aéreo: 150 km/h

---

### 3. **OrdenMovimiento.js** - Movimiento con Pathfinding

**Ubicación**: `js/modules/juegoV2/ordenes/OrdenMovimiento.js`

**Funcionalidades**:
- Hereda de OrdenBase
- Calcula ruta automáticamente usando Pathfinding.js
- Visualización de ruta en mapa (línea + flechas decoradoras)
- Animación de movimiento paso a paso
- Validación de movimiento restante de la unidad
- Control de velocidad de animación
- Pausa/reanudación de animación

**Métodos Principales**:
```javascript
async inicializar()           // Setup inicial
async calcularRuta()          // Usa Pathfinding.js
async validar()               // Verifica movimiento válido
async ejecutar()              // Anima y mueve unidad
async animarMovimiento()      // Animación por hexágonos
actualizarVisualizacion()     // Dibuja ruta calculada
pausar() / reanudar()         // Control de animación
setVelocidadAnimacion(mult)   // Ajustar velocidad
```

**Visualización**:
- Línea punteada en color del equipo
- Marcador en destino
- Flechas direccionales (usando leaflet-polylinedecorator)

---

### 4. **OrdenAtaque.js** - Ataque con LOS

**Ubicación**: `js/modules/juegoV2/ordenes/OrdenAtaque.js`

**Funcionalidades**:
- Hereda de OrdenBase
- Cálculo de distancia al objetivo
- Verificación de rango de ataque
- **Línea de Vista (LOS)** con raycast sobre hexgrid:
  - Vegetación densa bloquea LOS
  - Edificios/obstáculos bloquean LOS
  - Fuego indirecto (artillería) no requiere LOS
- Cálculo de probabilidad de impacto (modificadores):
  - Distancia
  - LOS
  - Cobertura del objetivo
  - Moral del atacante
- Cálculo y aplicación de daño
- Animación de ataque con efectos visuales

**Métodos Principales**:
```javascript
async inicializar()              // Setup
async calcularDatosAtaque()      // Distancia, LOS, probabilidad
async calcularLineaVista(posA, posB)  // LOS
raycastLOS(hexInicio, hexFin)    // Raycast sobre hexgrid
calcularProbabilidadImpacto()    // 1%-99% con modificadores
calcularDañoEstimado()           // Daño esperado
async validar()                  // Verifica munición, rango, LOS
async ejecutar()                 // Dispara y resuelve
aplicarDaño(daño)                // Reduce salud del objetivo
async animarAtaque(impacta)      // Efectos visuales
```

**Rangos por Tipo de Unidad** (si no especificado):
- Infantería: 500m
- Tanques (Armor): 3km
- Artillería: 20km

**Modificadores de Probabilidad**:
- Base: 70%
- × factor distancia (50%-100%)
- × 0.3 si no hay LOS
- × cobertura objetivo (ligera 0.7, pesada 0.4, total 0.2)
- × moral/100

---

### 5. **OrdenesQueue.js** - Cola de Órdenes

**Ubicación**: `js/modules/juegoV2/ordenes/OrdenesQueue.js`

**Funcionalidades**:
- Gestiona órdenes por equipo/jugador
- Una orden por unidad (cancela anterior si existe)
- Validación masiva de órdenes
- Ejecución secuencial o en paralelo
- Sistema de prioridades (1-10)
- Historial de órdenes (últimas 100)
- Estadísticas completas
- Pausa/reanudación de ejecución

**Métodos Principales**:
```javascript
agregarOrden(orden)              // Agrega a cola
removerOrden(ordenId)            // Remueve
cancelarOrden(ordenId)           // Cancela y mueve a historial
getOrden(ordenId)                // Obtiene orden
getOrdenDeUnidad(unidadId)       // Orden de una unidad
getOrdenesPendientes()           // Todas pendientes
async validarOrdenes()           // Valida todas
async ejecutarOrdenes()          // Ejecuta válidas
pausar() / reanudar()            // Control ejecución
cancelarTodas()                  // Limpia cola
getEstadisticas()                // Stats completas
debug()                          // Info de debugging
```

**Configuración**:
```javascript
{
    ejecutarEnParalelo: false,    // Secuencial por defecto
    maxOrdenesParalelas: 5,       // Límite si paralelo
    validarAntesDeEjecutar: true  // Validar antes
}
```

**Estadísticas**:
- totalCreadas
- totalEjecutadas
- totalCanceladas
- totalFallidas
- pendientes (actual)
- enHistorial

---

## 🔗 INTEGRACIÓN CON SISTEMA EXISTENTE

### Dependencias Requeridas

**Del Sistema Actual**:
- ✅ `window.map` - Mapa Leaflet
- ✅ `window.HexGrid` - Sistema de hexágonos
- ✅ `window.eventBus` - Bus de eventos (opcional pero recomendado)
- ✅ `window.equipoJugador` - Equipo del jugador actual
- ✅ Leaflet y plugins (leaflet-polylinedecorator para flechas)

**Nuevas Variables Globales Creadas**:
- `window.OrdenBase`
- `window.OrdenMovimiento`
- `window.OrdenAtaque`
- `window.Pathfinding`
- `window.OrdenesQueue`

---

## 🚀 PRÓXIMOS PASOS

### 1. **Crear Gestor de Órdenes V2** (Próximo)

**Archivo**: `js/modules/juegoV2/ordenes/GestorOrdenesV2.js`

Necesita:
- Inicialización del pathfinding con HexGrid
- Crear colas de órdenes por equipo
- Integración con menú radial para dar órdenes
- Listeners de eventos del juego
- Sincronización online (modo multiplayer)

### 2. **Adaptar GestorFases para Subfases de Combate**

**Modificar**: `js/modules/juego/gestorFases.js`

Agregar subfases:
- `combate_planificacion` - Jugadores dan órdenes
- `combate_ejecucion` - Sistema ejecuta órdenes (auto)
- `combate_revision` - Mostrar resultados

### 3. **Integrar con Menu Radial**

**Modificar**: `js/common/miradial.js` o crear wrapper

Opciones del menú:
- Mover → Crea OrdenMovimiento
- Atacar → Crea OrdenAtaque
- Defender → Crea OrdenDefensa
- Cancelar órdenes

### 4. **Crear juegodeguerraV2.html**

Basado en `planeamiento_integrado.html` con:
- Scripts del sistema de órdenes V2
- Inicialización del pathfinding
- UI para ver órdenes pendientes
- Botones de control de turno

---

## 📖 CÓMO USAR EL SISTEMA

### Ejemplo: Orden de Movimiento

```javascript
// 1. Obtener/crear pathfinding
if (!window.pathfinding) {
    window.pathfinding = new Pathfinding(window.HexGrid);
}

// 2. Obtener/crear cola de órdenes
if (!window.colaOrdenesAzul) {
    window.colaOrdenesAzul = new OrdenesQueue('azul');
}

// 3. Crear orden de movimiento
const unidad = /* ... unidad seleccionada ... */;
const destino = { lat: -34.9, lng: -58.4 }; // o hexágono {q, r, s}

const orden = new OrdenMovimiento(unidad, destino, {
    mostrarRuta: true,
    considerarTerreno: true,
    evitarEnemigos: true
});

// 4. Agregar a cola
window.colaOrdenesAzul.agregarOrden(orden);

// 5. Cuando se termine el turno de planificación, ejecutar
await window.colaOrdenesAzul.ejecutarOrdenes();
```

### Ejemplo: Orden de Ataque

```javascript
// 1. Crear orden de ataque
const atacante = /* ... unidad atacante ... */;
const objetivo = /* ... unidad enemiga ... */;

const orden = new OrdenAtaque(atacante, objetivo, {
    fuegoDirecto: true,
    municionGastar: 1
});

// 2. Validar antes de agregar
const esValida = await orden.validar();

if (esValida) {
    window.colaOrdenesAzul.agregarOrden(orden);
} else {
    console.warn('Ataque inválido:', orden.mensajesValidacion);
}

// 3. Ejecutar en fase de ejecución
await window.colaOrdenesAzul.ejecutarOrdenes();
```

---

## ⚙️ CONFIGURACIÓN Y AJUSTES

### Modificar Velocidades de Unidades

En `Pathfinding.js`, línea ~384:
```javascript
const velocidades = {
    infanteria: 4,   // km/h
    vehiculo: 30,
    blindado: 20,
    aereo: 150
};
```

### Modificar Rangos de Ataque

En `OrdenAtaque.js`, método `getRangoSegunTipo()`:
```javascript
switch(tipo) {
    case 'A': // Armor
        return 3000; // 3km
    case 'F': // Artillery
        return 20000; // 20km
    // ...
}
```

### Modificar Probabilidad Base de Impacto

En `OrdenAtaque.js`, método `calcularProbabilidadImpacto()`:
```javascript
let prob = 0.7; // Base 70% - MODIFICAR AQUÍ
```

---

## 🐛 DEBUGGING

### Verificar que todo está cargado

```javascript
// En consola del navegador
console.log({
    OrdenBase: typeof OrdenBase,
    OrdenMovimiento: typeof OrdenMovimiento,
    OrdenAtaque: typeof OrdenAtaque,
    Pathfinding: typeof Pathfinding,
    OrdenesQueue: typeof OrdenesQueue
});

// Debe mostrar: { OrdenBase: "function", ... }
```

### Debug de Cola de Órdenes

```javascript
// Información completa de la cola
window.colaOrdenesAzul.debug();

// Estadísticas
console.log(window.colaOrdenesAzul.getEstadisticas());

// Historial
console.log(window.colaOrdenesAzul.getHistorial());
```

### Debug de Pathfinding

```javascript
// Limpiar cache
window.pathfinding.limpiarCache();

// Calcular ruta con logs
const ruta = await window.pathfinding.calcularRuta(
    hexOrigen,
    hexDestino,
    'infanteria',
    { maxIteraciones: 1000 }
);
```

---

## 📊 MÉTRICAS DE RENDIMIENTO

### Pathfinding
- Cache: 100 rutas máximo (LRU)
- Límite de iteraciones: 1000 por defecto
- Complejidad: O(n log n) donde n = número de hexágonos

### Animaciones
- 500ms por hexágono (movimiento)
- 2 segundos por ataque
- Configurable con `setVelocidadAnimacion(mult)`

### Cola de Órdenes
- Sin límite de órdenes por cola
- Historial limitado a 100 órdenes
- Ejecución paralela limitada a 5 órdenes simultáneas

---

## ✅ TESTING RECOMENDADO

### Test 1: Movimiento Simple
1. Crear unidad en mapa
2. Crear orden de movimiento a hex vecino
3. Validar orden
4. Ejecutar y verificar animación
5. Verificar que unidad llegó al destino

### Test 2: Movimiento con Obstáculos
1. Crear terreno con bosques densos
2. Crear orden de movimiento que debe rodear obstáculos
3. Verificar que pathfinding encuentra ruta alternativa
4. Ejecutar y ver que unidad rodea obstáculos

### Test 3: Ataque con LOS
1. Crear dos unidades enemigas con LOS clara
2. Crear orden de ataque
3. Verificar que `tieneLineaVista === true`
4. Ejecutar y ver resultado (impacto/fallo)

### Test 4: Ataque Sin LOS
1. Colocar bosque denso entre atacante y objetivo
2. Crear orden de ataque (fuego directo)
3. Verificar que `tieneLineaVista === false`
4. Validar → debe ser inválida

### Test 5: Cola Completa
1. Crear múltiples órdenes para diferentes unidades
2. Agregar todas a la cola
3. Validar todas
4. Ejecutar todas secuencialmente
5. Verificar historial y estadísticas

---

## 🔮 FUTURAS MEJORAS

### Corto Plazo
- [ ] OrdenDefensa.js - Fortificarse en posición
- [ ] OrdenReconocimiento.js - Explorar área
- [ ] Mejor raycast LOS (considerar elevación real)
- [ ] Efectos visuales mejorados (explosiones, humo)
- [ ] Sonidos de combate

### Medio Plazo
- [ ] Pathfinding con predicción de posiciones enemigas
- [ ] Formaciones de unidades
- [ ] Órdenes condicionales (if-then)
- [ ] Replay de batalla

### Largo Plazo
- [ ] IA para órdenes automáticas
- [ ] Machine learning para predicción de rutas
- [ ] Sistema de doctrina militar

---

## 📝 NOTAS IMPORTANTES

1. **Sistema 3D**: Los archivos V2 NO incluyen integración 3D aún. Se integrará cuando `planeamiento_integrado.html` esté completo.

2. **Menu Radial**: Se perdió en algún commit anterior. Debe recuperarse para dar órdenes interactivamente.

3. **Sincronización Online**: Los métodos `serializar()` están preparados pero falta implementar la lógica de sincronización con socket.io.

4. **Compatibilidad**: Los archivos V2 no interfieren con el sistema actual. Pueden coexistir.

5. **HexGrid**: El sistema asume que `window.HexGrid` tiene el método `getHexAtLatLng(latlng)` y el `grid` Map con las propiedades de cada hexágono.

---

**Estado**: ✅ Sistema Core Completado
**Siguiente Tarea**: Crear GestorOrdenesV2.js para integración completa
**Estimado**: 2-3 horas para gestor + integración con UI

---

**Creado por**: Claude (Sistema de Órdenes V2)
**Fecha**: 5 de noviembre de 2025
