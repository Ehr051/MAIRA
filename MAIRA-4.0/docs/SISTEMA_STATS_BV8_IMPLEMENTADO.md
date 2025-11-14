# Sistema de Stats BV8 - Implementación Completa

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de estadísticas y recursos basado en datos reales de BV8 para elementos militares en MAIRA. El sistema permite:

- ✅ Datos específicos de 7 vehículos argentinos con especificaciones BV8 reales
- ✅ Cálculo de stats agregados (tripulación + personal embarcado)
- ✅ Visualización de 5 stats clave: Personal, Combustible, Munición, Moral, Raciones
- ✅ Lógica de vehículos con personal embarcado (concepto militar correcto)
- ✅ Integración transparente con sistema existente (backward compatible)

---

## 🏗️ Arquitectura del Sistema

### 1. Módulos Implementados

```
Client/js/
├── data/
│   ├── velocidadesReales.json     ← Datos BV8 específicos (7 vehículos)
│   └── velocidadesBase.json       ← Datos genéricos (fallback)
├── utils/
│   ├── velocidadUtils.js          ← Carga y provee datos BV8
│   ├── elementoUtils.js           ← Extrae datos + calcula stats agregados
│   └── vehiculosConPersonal.js    ← Lógica vehículos con personal embarcado
└── ui/
    └── StatsBarras.js              ← Visualización de stats (barras + colores)
```

### 2. Flujo de Datos

```
┌─────────────────────┐
│ velocidadesReales   │  ← Datos BV8 específicos por vehículo
│ .json               │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ velocidadUtils.js   │  ← Carga JSONs y provee datos
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ elementoUtils.js    │  ← Calcula stats agregados
│                     │     (tripulación + embarcados)
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ StatsBarras.js      │  ← Renderiza barras visuales
└─────────────────────┘
```

---

## 📦 1. velocidadesReales.json

### Ubicación
`Client/js/data/velocidadesReales.json`

### Contenido
Datos BV8 específicos de 7 vehículos argentinos:

1. **tam_tanque** - TAM (Tanque Argentino Mediano)
2. **vctp_tam** - VCTP TAM (Vehículo Combate Transporte Personal)
3. **vca_155mm_tam** - VCA 155mm TAM (Autopropulsado)
4. **m113** - M113 APC
5. **vlega** - VLEGA (Vehículo Ligero Ejército Argentino)
6. **unimog** - Unimog (Camión todo terreno)
7. **vcpc** - VCPC (Vehículo Combate Puesto Comando)

### Estructura por Vehículo

```json
{
  "tam_tanque": {
    "id": "tam_tanque",
    "nombre": "TAM (Tanque Argentino Mediano)",
    "tipo": "main_battle_tank",
    "categoria": "blindado",
    "sidc_base": "SFGPUCRT---*----",

    "movilidad": {
      "velocidad_max_kmh": 75,
      "velocidad_promedio_kmh": 40,
      "autonomia_km": 550,
      "consumo_km_litros": 1.18,
      "capacidad_combustible_litros": 650,
      "combustible_tipo": "gasoil"
    },

    "tripulacion": {
      "total": 4,
      "roles": {
        "jefe_tam": 1,
        "tirador_tam": 1,
        "cargador_tam": 1,
        "conductor_tam": 1
      }
    },

    "armamento": {
      "principal": {
        "tipo": "Cañón 105mm L7",
        "calibre": 105,
        "municion_tipo": "proyectil_105mm",
        "capacidad_municion": 50
      },
      "secundario": [...]
    },

    "dotacion_inicial": {
      "combustible_litros": 650,
      "municion": {
        "proyectil_105mm": 50,
        "municion_762": 6000,
        "municion_127": 1000
      },
      "raciones_dias": 3,
      "agua_litros": 14
    },

    "caracteristicas": {
      "peso_kg": 30500,
      "blindaje_frontal_mm": 50,
      "altura_m": 2.42,
      "longitud_m": 6.77,
      "ancho_m": 3.25
    }
  }
}
```

---

## 🔧 2. velocidadUtils.js

### Función Principal: `obtenerVelocidadElemento(elemento)`

Obtiene datos completos de movilidad y BV8 para un elemento.

**Búsqueda en 3 niveles:**
1. **velocidadesReales** (específico por vehículo) → PRIORIDAD
2. **velocidadesBase** (genérico por categoría) → Fallback
3. **Valores hardcoded** (apie: 4 km/h) → Último recurso

**Retorno:**
```javascript
{
  // Movilidad
  velocidad: 40,
  velocidadMax: 75,
  velocidadTerreno: 20,
  autonomia: 550,
  consumo: 1.18,
  capacidad: 650,
  combustibleTipo: "gasoil",

  // Clasificación
  tipoMovimiento: "blindado",
  descripcion: "TAM (Tanque Argentino Mediano)",

  // 📦 DATOS BV8 COMPLETOS
  bv8: {
    vehiculo: {...},      // Datos completos del vehículo
    tripulacion: {...},   // Tripulación fija
    armamento: {...},     // Armamento del vehículo
    dotacion_inicial: {...}, // Dotación inicial
    caracteristicas: {...}   // Características físicas
  }
}
```

### Funciones de Carga

```javascript
// Cargar ambos JSONs en paralelo
await cargarVelocidades();

// O individualmente
await cargarVelocidadesReales();
await cargarVelocidadesBase();
```

### Integración
```javascript
// En inicialización del juego/planeamiento
document.addEventListener('DOMContentLoaded', async () => {
  await cargarVelocidades();
  console.log('Datos BV8 cargados');
});
```

---

## 🧮 3. elementoUtils.js (Enriquecido)

### Función Principal: `obtenerDatosElemento(elemento)`

Extrae **TODOS** los datos de un marcador, incluyendo stats BV8 agregados.

**Retorno extendido:**
```javascript
{
  // ... datos existentes (id, sidc, designacion, coordenadas, etc) ...

  // 📊 NUEVO: Datos BV8
  bv8: {
    vehiculo: {...},
    tripulacion: {...},
    armamento: {...},
    dotacion_inicial: {...}
  },

  // 📊 NUEVO: Movilidad completa
  movilidad: {
    velocidad: 40,
    consumo: 1.18,
    autonomia: 550,
    ...
  },

  // 📊 NUEVO: Stats agregados (tripulación + embarcados)
  stats: {
    personal: {
      total: 11,              // 3 tripulación + 8 embarcados
      tripulacion: 3,
      embarcado: 8,
      max_capacidad: 11
    },

    combustible: {
      actual: 510,
      capacidad: 510,
      tipo: "gasoil",
      consumo_km: 1.02,
      autonomia_km: 500
    },

    municion: {
      tipos: {
        "municion_20mm": 800,
        "municion_762": 3600,   // 2000 (vehículo) + 1600 (personal)
        ...
      },
      total_tipos: 2
    },

    moral: {
      actual: 100,
      max: 100,
      estado: "alta"
    },

    raciones: {
      total: 33,              // 11 personas x 3 días
      dias_disponibles: 3
    },

    agua: {
      actual: 38.5,           // 11 personas x 3.5L
      capacidad: 38.5
    },

    // Desglose detallado
    desglose: {
      tripulacion: {...},
      embarcado: {...}
    }
  },

  // 🔄 NUEVO: Personal embarcado (si aplica)
  personalEmbarcado: {
    grupos: [...],
    total_embarcados: 8
  }
}
```

### Nuevas Funciones Auxiliares

```javascript
// Calcula stats de tripulación fija
calcularStatsTripulacion(datosBV8);

// Calcula stats de personal embarcado
calcularStatsPersonalEmbarcado(elemento, datosBV8);

// Combina munición de múltiples fuentes
combinarMunicion(municionVehiculo, municionPersonal, ...);

// Calcula stats agregados totales
calcularStatsAgregados(elemento, datosBV8);
```

---

## 🚗 4. vehiculosConPersonal.js

### Concepto Militar

```
✅ CORRECTO:
┌────────────────────────────┐
│   VCTP 1 (1 marcador)      │
├────────────────────────────┤
│ Tripulación fija: 3        │
│  - Conductor               │
│  - Jefe                    │
│  - Apuntador               │
├────────────────────────────┤
│ Personal embarcado: 8      │
│  - Grupo 1                 │
│    ├─ Eq A (4 soldados)    │
│    └─ Eq B (3 soldados)    │
│    └─ Jefe Grupo (1)       │
└────────────────────────────┘
Total: 11 personas en 1 vehículo

❌ INCORRECTO:
VCTP 1 (marcador) + Grupo 1 (marcador separado)
```

### Funciones Principales

#### Crear Grupo de Infantería
```javascript
const grupo1 = crearGrupoInfanteria("Grupo 1", {
  tipoGrupo: 'infanteria_mecanizada',
  equipoA_cantidad: 4,
  equipoB_cantidad: 3,
  jefeGrupo: 1
});

// Retorna:
{
  nombre: "Grupo 1",
  tipo: "infanteria_mecanizada",
  cantidad: 8,
  equipos: [
    {
      nombre: "Eq A (Grupo 1)",
      cantidad: 4,
      roles: {
        ametrallador_m60: 1,
        fusilero_fal: 3
      }
    },
    {
      nombre: "Eq B (Grupo 1)",
      cantidad: 3,
      roles: {
        fusilero_fal: 3
      }
    }
  ],
  municion: {
    municion_762: 1600  // 200 tiros/FAL x 7 + 600 M60
  }
}
```

#### Crear Marcador de Vehículo con Personal
```javascript
const vctp1 = crearMarcadorVehiculoConPersonal({
  tipoVehiculo: 'vctp_tam',
  designacion: 'VCTP 1',
  dependencia: 'Sec Inf Mec 1',
  coordenadas: { lat: -31.4135, lng: -64.181 },
  sidc: 'SFGPUCVI---*----',
  gruposEmbarcados: [grupo1],  // Array de grupos
  equipo: 'azul',
  jugador: 'jugador1'
}, mapa);

// Crea UN solo marcador con:
// - Tripulación: 3 (conductor, jefe, tirador)
// - Embarcados: 8 (Grupo 1)
// - Total: 11 personas
```

### Funciones Auxiliares

```javascript
// Verificar si es vehículo con personal
esVehiculoConPersonal(marcador);  // → true/false

// Obtener info del personal embarcado
obtenerInfoPersonalEmbarcado(marcador);

// Desembarcar personal (para el futuro)
const personalDesembarcado = desembarcarPersonal(marcador);

// Embarcar personal
embarcarPersonal(marcador, [grupo1, grupo2]);
```

---

## 🎨 5. StatsBarras.js

### Visualización de Stats

Sistema de barras de progreso para visualizar los 5 stats clave:

1. 🧑‍✈️ **Personal** - Personal efectivo (tripulación + embarcados)
2. ⛽ **Combustible** - Combustible disponible / Capacidad
3. 🔫 **Munición** - Munición promedio de todos los tipos
4. 💪 **Moral** - Estado de ánimo y cohesión
5. 🍽️ **Raciones** - Días de raciones disponibles

### Función Principal

```javascript
// Crear panel completo de stats
const htmlPanel = crearPanelStats(marcador);

// Actualizar contenedor con stats
actualizarPanelStats('#contenedor-stats', marcador);
```

### Código de Colores

Cada stat tiene 3 niveles de color:

- **Verde**: OK (>60% para moral, >50% para personal/munición, >40% para combustible/raciones)
- **Naranja**: Medio (25-60% personal/munición, 15-40% combustible, etc)
- **Rojo**: Bajo (<25% personal/munición, <15% combustible, etc)

### HTML Generado (Ejemplo)

```html
<div class="panel-stats-completo">
  <div class="panel-stats-header">
    <h3>📊 Estado del Elemento</h3>
    <p class="elemento-nombre">VCTP 1 / Sec Inf Mec 1</p>
  </div>

  <div class="panel-stats-barras">
    <!-- Personal -->
    <div class="stat-barra-container" data-stat="personal">
      <div class="stat-header">
        <span class="stat-icono">🧑‍✈️</span>
        <span class="stat-label">Personal</span>
        <span class="stat-porcentaje">100%</span>
      </div>
      <div class="stat-barra-fondo">
        <div class="stat-barra-fill" style="width: 100%; background-color: #4CAF50"></div>
      </div>
      <div class="stat-detalle">11/11 pers (3 trip + 8 emb)</div>
    </div>

    <!-- Combustible -->
    <div class="stat-barra-container" data-stat="combustible">
      ...
    </div>

    <!-- ... resto de stats ... -->
  </div>
</div>
```

### Integración en UI

```javascript
// En panel de edición de unidad
document.getElementById('panel-edicion').addEventListener('show', (e) => {
  const marcador = e.detail.marcador;
  actualizarPanelStats('#contenedor-stats', marcador);
});

// En panel de coordinación de órdenes
actualizarPanelStats('.panel-coordinacion .stats', marcadorSeleccionado);
```

---

## 🔌 Integración Completa

### 1. Cargar Módulos en HTML

```html
<!-- En juegodeguerraV2.html o planeamiento_integrado.html -->

<!-- Datos BV8 -->
<!-- Los JSONs se cargan dinámicamente, no necesitan <script> -->

<!-- Utilidades BV8 -->
<script src="js/utils/velocidadUtils.js"></script>
<script src="js/utils/elementoUtils.js"></script>
<script src="js/utils/vehiculosConPersonal.js"></script>

<!-- UI Stats -->
<script src="js/ui/StatsBarras.js"></script>

<!-- Inicialización -->
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    // Cargar datos BV8
    await cargarVelocidades();
    console.log('✅ Sistema BV8 listo');
  });
</script>
```

### 2. Ejemplo de Uso Completo

```javascript
// 1. Cargar datos BV8 (al inicio)
await cargarVelocidades();

// 2. Crear grupo de infantería
const grupo1 = crearGrupoInfanteria("Grupo 1");

// 3. Crear vehículo con personal embarcado
const vctp1 = crearMarcadorVehiculoConPersonal({
  tipoVehiculo: 'vctp_tam',
  designacion: 'VCTP 1',
  dependencia: 'Sec Inf Mec 1',
  coordenadas: { lat: -31.4135, lng: -64.181 },
  sidc: 'SFGPUCVI---*----',
  gruposEmbarcados: [grupo1],
  equipo: 'azul'
}, mapa);

// 4. Obtener datos completos (incluyendo stats)
const datos = obtenerDatosElemento(vctp1);
console.log('Personal total:', datos.stats.personal.total);  // 11
console.log('Combustible:', datos.stats.combustible.actual);  // 510L
console.log('Munición 7.62mm:', datos.stats.municion.tipos.municion_762);  // 3600 tiros

// 5. Mostrar stats en UI
actualizarPanelStats('#panel-stats', vctp1);
```

---

## 🎯 Casos de Uso

### Caso 1: Desplegar Sección de Infantería Mecanizada

**Composición BV8:**
- 1 Jefe de Sección (VCPC)
- 4 VCTP TAM (cada uno con 1 grupo de 8 soldados)

**Código:**
```javascript
// Crear grupos
const grupo1 = crearGrupoInfanteria("Grupo 1");
const grupo2 = crearGrupoInfanteria("Grupo 2");
const grupo3 = crearGrupoInfanteria("Grupo 3");
const grupo4 = crearGrupoInfanteria("Grupo 4");

// Crear vehículos con personal
const vcpc = crearMarcadorVehiculoConPersonal({
  tipoVehiculo: 'vcpc',
  designacion: 'VCPC Jefe Sec',
  dependencia: 'Sec Inf Mec 1',
  coordenadas: { lat: -31.4135, lng: -64.181 },
  sidc: 'SFGPUCHQ---*----',
  gruposEmbarcados: [],  // Sin personal embarcado (es puesto comando)
  equipo: 'azul'
}, mapa);

const vctp1 = crearMarcadorVehiculoConPersonal({
  tipoVehiculo: 'vctp_tam',
  designacion: 'VCTP 1',
  dependencia: 'Sec Inf Mec 1',
  coordenadas: { lat: -31.4140, lng: -64.181 },
  sidc: 'SFGPUCVI---*----',
  gruposEmbarcados: [grupo1],
  equipo: 'azul'
}, mapa);

const vctp2 = crearMarcadorVehiculoConPersonal({
  tipoVehiculo: 'vctp_tam',
  designacion: 'VCTP 2',
  dependencia: 'Sec Inf Mec 1',
  coordenadas: { lat: -31.4145, lng: -64.181 },
  sidc: 'SFGPUCVI---*----',
  gruposEmbarcados: [grupo2],
  equipo: 'azul'
}, mapa);

// ... vctp3 y vctp4 igual

// Resultado: 5 marcadores en el mapa
// - 1 VCPC (5 tripulantes)
// - 4 VCTP (cada uno con 3 trip + 8 emb = 11 personas)
// Total: 5 vehículos, 49 personas
```

### Caso 2: Consultar Stats de un Vehículo

```javascript
// Obtener datos completos
const datos = obtenerDatosElemento(vctp1);

// Verificar combustible
if (datos.stats.combustible.actual < 100) {
  console.warn('Combustible bajo, necesita reabastecimiento');
}

// Verificar munición
const municion762 = datos.stats.municion.tipos.municion_762;
if (municion762 < 1000) {
  console.warn('Munición 7.62mm baja');
}

// Calcular autonomía restante
const autonomiaKm = datos.stats.combustible.autonomia_km;
const combustibleActual = datos.stats.combustible.actual;
const capacidad = datos.stats.combustible.capacidad;
const autonomiaRestante = autonomiaKm * (combustibleActual / capacidad);

console.log(`Autonomía restante: ${autonomiaRestante.toFixed(0)} km`);
```

### Caso 3: Mostrar Stats en Panel Lateral

```html
<!-- HTML -->
<div id="panel-lateral">
  <h2>Elemento Seleccionado</h2>
  <div id="stats-elemento"></div>
</div>

<script>
// JavaScript
mapa.on('click', (e) => {
  const marcador = e.target;

  if (marcador instanceof L.Marker) {
    actualizarPanelStats('#stats-elemento', marcador);
  }
});
</script>
```

---

## ✅ Compatibilidad y Backward Compatibility

### Elementos SIN datos BV8

Si un elemento **NO** tiene datos BV8 (ej: creado antes de la implementación):

```javascript
const datos = obtenerDatosElemento(marcadorAntiguo);

// datos.bv8 → null
// datos.movilidad → datos genéricos (velocidadesBase)
// datos.stats → null

// El sistema funciona normalmente, sin stats visuales
```

### Visualización sin BV8

```javascript
const htmlPanel = crearPanelStats(marcadorSinBV8);

// Retorna:
// <div class="panel-stats-sin-datos">
//   <p>📊 Sin datos BV8 disponibles</p>
// </div>
```

### Compatibilidad con Sistema Actual

✅ **NO se rompe nada existente**
- Los marcadores antiguos siguen funcionando
- Las funciones existentes siguen funcionando
- Solo se AGREGAN nuevas propiedades opcionales

✅ **Datos opcionales**
- `bv8`: `null` si no hay datos
- `stats`: `null` si no hay datos
- `personalEmbarcado`: `null` si no aplica

✅ **Fallbacks automáticos**
- velocidadesReales → velocidadesBase → hardcoded
- BV8 específico → genérico → valores por defecto

---

## 📊 Datos Disponibles por Vehículo

| Vehículo | Vel Max | Vel Prom | Combustible | Consumo | Personal | Munición Principal |
|----------|---------|----------|-------------|---------|----------|-------------------|
| TAM | 75 km/h | 40 km/h | 650 L | 1.18 L/km | 4 trip | 50 x 105mm |
| VCTP TAM | 75 km/h | 35 km/h | 510 L | 1.02 L/km | 3 trip + 8 emb | 800 x 20mm |
| VCA 155mm | 70 km/h | 35 km/h | 650 L | 1.18 L/km | 5 trip | 30 x 155mm |
| M113 | 65 km/h | 30 km/h | 360 L | 0.75 L/km | 2 trip + 11 emb | 2000 x 12.7mm |
| VLEGA | 120 km/h | 60 km/h | 90 L | 0.15 L/km | 1 trip + 3 pasaj | 1000 x 7.62mm |
| Unimog | 90 km/h | 50 km/h | 175 L | 0.25 L/km | 1 trip + 2 pasaj | - |
| VCPC | 75 km/h | 35 km/h | 510 L | 1.02 L/km | 5 trip | 1000 x 7.62mm |

---

## 🚀 Próximos Pasos

### Pendiente de Implementación

1. **API de Cálculo de Bajas** (backend + frontend)
   - Algoritmos BV8 para cálculo de bajas
   - Modificadores de terreno, moral, sorpresa
   - Degradación de stats tras combate

2. **API de Logística** (backend + frontend)
   - Cálculo de consumos en movimiento
   - Reabastecimiento automático
   - Rutas de suministro

3. **Inserción por Vehículo en JDG**
   - Integración con menú de inserción
   - Plantillas de organizaciones BV8
   - Despliegue automático de formaciones

4. **Panel de Coordinación de Órdenes (Reparar)**
   - No carga elementos
   - No muestra barra de tiempo
   - No muestra órdenes

5. **Ingeniería Inversa: Ingenieros**
   - Tiempos de construcción de obstáculos
   - Costos logísticos
   - API para cálculos externos

6. **Datos de Artillería**
   - Recopilar información BV8 de artillería
   - Integrar en sistema de stats

---

## 🔍 Debugging y Logs

### Verificar Carga de Datos BV8

```javascript
console.log(window.MAIRA.velocidadesReales);
// → { vehiculos: {...}, personal: {...}, ... }

console.log(window.MAIRA.velocidadesBase);
// → { vehiculos: {...}, personal: {...} }
```

### Verificar Funciones Disponibles

```javascript
console.log(typeof obtenerVelocidadElemento);  // → "function"
console.log(typeof obtenerDatosElemento);      // → "function"
console.log(typeof crearMarcadorVehiculoConPersonal);  // → "function"
console.log(typeof actualizarPanelStats);      // → "function"
```

### Logs en Consola

El sistema emite logs útiles:

```
✅ velocidadUtils.js cargado
📦 Cargando datos de velocidades...
✅ Velocidades reales BV8 cargadas
   7 vehículos específicos
   2 categorías personal
✅ Velocidades base (genéricas) cargadas
✅ Todos los datos de velocidades cargados

✅ elementoUtils.js cargado - Funciones de extracción centralizadas + BV8 stats disponibles
✅ vehiculosConPersonal.js cargado - Lógica de vehículos con personal embarcado disponible
✅ StatsBarras.js cargado - Sistema de visualización de stats disponible
✅ Estilos de stats inyectados

🔍 Determinando tipo de movimiento para: {...}
✅ Datos BV8 específicos encontrados para: vctp_tam
   Velocidad: 35 km/h
   Consumo: 1.02 L/km
   Capacidad: 510 L

✅ obtenerDatosElemento: {id: ..., designacion: "VCTP 1", ...}
✅ Marcador de vehículo con personal agregado: VCTP 1
```

---

## 📝 Notas Finales

- **Fuente de datos**: Batalla Virtual 8 (BV8), simulador táctico argentino
- **Validación**: Datos extraídos y validados desde BV8
- **Estándar**: 3.5L agua/persona/día, 3 días de raciones
- **Munición**: Capacidades máximas de dotación BV8
- **Velocidades**: Promedio para terreno mixto, reducidas 40-50% en terreno difícil

---

**Fecha de Implementación**: 14 de Noviembre de 2025
**Versión**: 2.0.0
**Estado**: ✅ Completado (Fases 1-5 del plan de integración BV8)
