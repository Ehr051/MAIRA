# ⏱️ SISTEMA DE TIEMPO REAL Y COORDINACIÓN DE ÓRDENES

**Fecha**: 5 de noviembre de 2025
**Estado**: Implementado
**Branch**: feature/juego-guerra-v2

---

## 🎯 CONCEPTOS CLAVE

### Sistema de Tiempo Real

**1 TURNO = 1 HORA EN EL TERRENO**

- Independiente de la duración real del turno (2, 3, 5 minutos, etc.)
- Las órdenes tienen duración en tiempo real (segundos/minutos)
- Si una orden toma más de 1 hora → se ejecuta en múltiples turnos
- Si múltiples órdenes toman menos de 1 hora → se ejecutan en un solo turno

**Ejemplo**:
```
Turno real del jugador: 3 minutos
Tiempo que representa: 1 hora en el terreno

Orden 1: Marchar 10km → 2.5 horas (infantería a 4km/h)
  → Se ejecuta en los turnos 1, 2 y 3

Orden 2: Disparar mortero → 5 minutos
  → Se ejecuta completamente en el turno 1

Orden 3: Fortificar posición → 45 minutos
  → Se ejecuta completamente en el turno 1
```

### Órdenes Secuenciales por Unidad

Cada unidad puede tener una **cola de órdenes secuenciales**:

```
Infantería RI-3:
  1. Marchar hasta Punto A (30 min)
  2. Defender posición (permanente hasta nueva orden)

Artillería GA-5:
  1. Apoyo de fuego (10 min, inicia en T+0)
  2. Desplazamiento a nueva posición (20 min)

Tanques TAM-1:
  1. Esperar apoyo de fuego (10 min, empieza en T+0)
  2. Avanzar durante el fuego (10 min, empieza en T+5)
  3. Atacar (5 min, empieza en T+10)
```

### Coordinación Temporal

Las órdenes de diferentes unidades pueden coordinarse:

**Ejemplo táctico**:
```
T+00:00 → Morteros inician apoyo de fuego
T+05:00 → Tanques inician movimiento (durante fuego)
T+10:00 → Infantería inicia avance
T+15:00 → Cesa fuego de morteros
T+15:00 → Tanques atacan
T+20:00 → Infantería consolida posición
```

---

## 📋 COMPONENTES IMPLEMENTADOS

### 1. OrdenesQueueV2.js

**Mejoras sobre la versión anterior**:

✅ **Cola secuencial por unidad**: `Map<unidadId, Array<orden>>`
✅ **Cálculo de tiempo real** por tipo de orden
✅ **Sistema de turnos**: 1 turno = 1 hora = 3600 segundos
✅ **Timeline de coordinación**: visualiza todas las órdenes en el tiempo
✅ **Ejecución por turno**: solo ejecuta órdenes del turno actual
✅ **Órdenes paralelas**: diferentes unidades actúan simultáneamente

**Métodos Clave**:

```javascript
// Agregar orden en posición específica de la cola
agregarOrden(orden, posicion = null)

// Calcular tiempo real que tomará la orden
calcularTiempoReal(orden) // Retorna segundos

// Calcular cuántos turnos necesita
calcularTurnosNecesarios(tiempoSegundos) // 1 turno = 3600s

// Reordenar órdenes de una unidad
reordenarOrdenes(unidadId, ordenIds)

// Obtener órdenes del turno actual
getOrdenesDelTurno(numeroTurno)

// Ejecutar solo órdenes del turno
ejecutarTurno(numeroTurno)

// Recalcular timeline completo
recalcularTimeline()
```

**Cálculo de Tiempo por Tipo de Orden**:

| Tipo de Orden | Cálculo |
|---------------|---------|
| **Movimiento** | `distancia / velocidad` |
| **Ataque directo** | 3 minutos |
| **Artillería** | 5 min + 2 min por disparo |
| **Defensa/Fortificación** | 15 min × nivel |
| **Campo minado** | 30 minutos |
| **Alambrada** | 20 minutos |
| **Mejorar camino** | 1 hora |
| **Puente** | 2 horas |

**Velocidades por Tipo de Unidad**:

| Tipo | Velocidad Base | Modificadores |
|------|----------------|---------------|
| Infantería | 4 km/h | -30% si moral <50%, -20% si fatiga >70% |
| Vehículo | 30 km/h | +terreno |
| Blindado | 20 km/h | +terreno |
| Aéreo | 150 km/h | - |

---

### 2. PanelCoordinacionOrdenes.js

**Panel estilo timeline de PowerPoint** para coordinar órdenes visualmente.

**Características**:

✅ **Timeline horizontal**: muestra tiempo de 0 a 2+ horas
✅ **Filas por unidad**: cada unidad tiene su fila
✅ **Barras de órdenes**: color según tipo, duración proporcional
✅ **Marcadores de turnos**: líneas verticales cada hora
✅ **Escala de tiempo**: marcas cada 5 minutos
✅ **Panel lateral**: lista de unidades con número de órdenes
✅ **Controles de zoom**: acercar/alejar para ver detalles
✅ **Validación visual**: colores indican estado (válida/inválida)
✅ **Información en footer**: tiempo total, turnos necesarios, número de órdenes

**Layout**:

```
┌────────────────────────────────────────────────────────────────┐
│ 🎬 Coordinación de Órdenes [Azul]                  [🔍±] [✓] [▶️] │
├──────────────┬───────────────────────────────────────────────────┤
│              │ 0:00   0:15   0:30   0:45   1:00   1:15   1:30    │
│              │  │      │      │      │     │T2│    │      │       │
├──────────────┼───────────────────────────────────────────────────┤
│ Infantería   │ [====Marchar=====][=Atacar=]                      │
│ RI-3         │                                                    │
├──────────────┼───────────────────────────────────────────────────┤
│ Artillería   │ [Fuego]                                           │
│ GA-5         │       [===Desplazamiento===]                      │
├──────────────┼───────────────────────────────────────────────────┤
│ Tanques      │ [Esperar] [==Avanzar==][Atq]                      │
│ TAM-1        │                                                    │
└──────────────┴───────────────────────────────────────────────────┘
│ Tiempo Total: 1:30 │ Turnos: 2 │ Órdenes: 7 │ ◼️Mov ◼️Atq ◼️Def   │
└────────────────────────────────────────────────────────────────┘
```

**Colores**:
- 🟢 Verde: Movimiento
- 🔴 Rojo: Ataque
- 🔵 Azul: Defensa
- 🟠 Naranja: Ingeniero
- 🟣 Morado: Comunicaciones

**Interacción** (Pendiente implementar completamente):
- Click en orden → selecciona y muestra detalles
- Drag & drop → reordenar órdenes
- Doble click → editar orden
- Click derecho → menú contextual (cancelar, duplicar, etc.)

---

## 🎯 FLUJO DE USO

### 1. Fase de Planificación

```javascript
// Crear cola de órdenes
window.colaOrdenesAzul = new OrdenesQueueV2('azul');

// Crear pathfinding
window.pathfinding = new Pathfinding(window.HexGrid);

// Infantería: marchar y defender
const infanteria = obtenerUnidad('RI-3');

const orden1 = new OrdenMovimiento(infanteria, puntoA);
colaOrdenesAzul.agregarOrden(orden1);

const orden2 = new OrdenDefensa(infanteria, puntoA);
colaOrdenesAzul.agregarOrden(orden2);

// Artillería: fuego de apoyo y reposicionar
const artilleria = obtenerUnidad('GA-5');

const orden3 = new OrdenAtaque(artilleria, objetivoEnemigo, {
    fuegoDirecto: false, // Fuego indirecto
    municionGastar: 5
});
colaOrdenesAzul.agregarOrden(orden3);

const orden4 = new OrdenMovimiento(artilleria, nuevaPosicion);
colaOrdenesAzul.agregarOrden(orden4);

// Tanques: esperar y atacar
const tanques = obtenerUnidad('TAM-1');

const orden5 = new OrdenEspera(tanques, 600); // Esperar 10 minutos
colaOrdenesAzul.agregarOrden(orden5);

const orden6 = new OrdenMovimiento(tanques, puntoAtaque);
colaOrdenesAzul.agregarOrden(orden6);

const orden7 = new OrdenAtaque(tanques, objetivoTanque);
colaOrdenesAzul.agregarOrden(orden7);
```

### 2. Visualizar en Panel de Coordinación

```javascript
// Abrir panel de coordinación
const panel = new PanelCoordinacionOrdenes(colaOrdenesAzul);
panel.mostrar();

// El panel muestra:
// - Timeline con todas las órdenes
// - Duración de cada orden
// - Cuántos turnos se necesitan
// - Qué se ejecuta en paralelo
```

### 3. Validar Órdenes

```javascript
// Validar todas las órdenes
await colaOrdenesAzul.validarOrdenes();

// El panel actualiza colores:
// - Verde: válida
// - Rojo: inválida
// - Amarillo: en ejecución
```

### 4. Ejecutar Turno

```javascript
// Turno 1: Ejecutar órdenes de la primera hora
await colaOrdenesAzul.ejecutarTurno(1);

// Resultado:
// - Infantería: empieza a marchar (30 min → completa en turno 1)
// - Infantería: empieza a defender (completada en turno 1)
// - Artillería: fuego de apoyo (10 min → completa en turno 1)
// - Artillería: empieza desplazamiento (20 min → completa en turno 1)
// - Tanques: esperan (10 min → completa en turno 1)
// - Tanques: empiezan a avanzar (empieza a las 0:10, termina a las 0:30)
// - Tanques: atacan (5 min a las 0:30 → completa en turno 1)

// Si alguna orden tomara >1 hora:
// Turno 2: Continúa ejecutando la parte restante
```

---

## 📊 VENTAJAS DEL SISTEMA

### 1. Realismo Táctico

✅ Las órdenes toman tiempo real, no "1 acción por turno"
✅ Coordinación entre unidades (apoyo de fuego + avance)
✅ Órdenes complejas (marchar → defender → contraatacar)

### 2. Flexibilidad

✅ Órdenes secuenciales ilimitadas por unidad
✅ Reordenar órdenes antes de ejecutar
✅ Ver timeline completo antes de confirmar

### 3. Profundidad Estratégica

✅ Planificar varios turnos por adelantado
✅ Coordinación temporal precisa
✅ Órdenes condicionales (futuro)

---

## 🚀 PRÓXIMOS PASOS

### Implementar

1. **OrdenDefensa.js** - Fortificar posiciones
2. **OrdenIngeniero.js** - Minas, alambradas, puentes
3. **OrdenEspera.js** - Esperar tiempo específico
4. **OrdenComunicaciones.js** - Apoyo de comunicaciones

### Mejorar Panel

1. **Drag & drop** - Reordenar órdenes visualmente
2. **Tooltip** - Información al pasar sobre órdenes
3. **Edición inline** - Modificar duración, parámetros
4. **Zoom y scroll** - Para timelines largos

### Integrar

1. **Menú Radial Contextual** - Según tipo de unidad
2. **Sincronización 2D ↔ 3D** - Total War style
3. **Sistema de Revisión** - Info en menú radial de unidad

---

## 📝 NOTAS IMPORTANTES

### Menú Radial Contextual

Debe mostrar opciones según tipo de unidad:

**Infantería**:
- Mover
- Atacar
- Defender
- Reconocimiento
- Información (ver estado y combates)

**Infantería Paracaidista**:
- + Lanzamiento
- + Reagrupación

**Infantería Mecanizada**:
- + Embarcar/Desembarcar
- + Movimiento rápido

**Caballería** (reconocimiento):
- + Explorar área
- + Pantalla (screening)
- + Patrulla

**Artillería**:
- Fuego directo
- Fuego indirecto
- Cambiar posición
- Apoyo de fuego (misión)

**Ingenieros**:
- Instalar campo minado
- Colocar alambrada
- Mejorar camino
- Fortificar posición
- Construir puente
- Demolición

**Comunicaciones**:
- Apoyo de comunicaciones
- Retransmisión
- Interferencia

### Sincronización 2D ↔ 3D

**Requisitos**:
- Lo que pasa en 3D se refleja en 2D
- Lo que pasa en 2D se refleja en 3D
- Estados sincronizados (posición, salud, munición)
- Si destruyen en 3D → destruido en 2D
- Si mueven en 3D → nueva posición en 2D al salir

**Implementación** (Pendiente):
```javascript
class Sincronizador2D3D {
    // Sincroniza estado de unidad entre 2D y 3D
    sincronizarUnidad(unidad) {
        // Actualizar posición
        // Actualizar estado (salud, munición)
        // Actualizar visual (SIDC en 2D, modelo en 3D)
    }

    // Al salir de vista 3D
    on3DtoExit() {
        // Aplicar todos los cambios de 3D a 2D
        this.aplicarCambios3DaEstado2D();
    }

    // Al entrar a vista 3D
    on2Dto3D() {
        // Cargar estado actual de 2D en 3D
        this.cargarEstado2Den3D();
    }
}
```

---

**Creado por**: Claude (Sistema de Órdenes V2)
**Fecha**: 5 de noviembre de 2025
