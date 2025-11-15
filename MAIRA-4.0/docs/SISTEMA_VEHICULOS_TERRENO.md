# 🚗 Sistema de Vehículos y Terreno - Guía Completa

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Tipos de Vehículos](#tipos-de-vehículos)
3. [Obstáculos Acuáticos](#obstáculos-acuáticos)
4. [Tipos de Suelo](#tipos-de-suelo)
5. [Vegetación](#vegetación)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Integración con Sistema GIS](#integración-con-sistema-gis)

---

## 🎯 Resumen Ejecutivo

Sistema realista de evaluación de transitabilidad que considera:

✅ **7 Tipos de Vehículos** con capacidades específicas
✅ **5 Clases de Ríos** con anchos y profundidades
✅ **7 Tipos de Suelos** con resistencias variables
✅ **5 Tipos de Vegetación** con densidades diferentes
✅ **Condiciones Meteorológicas** y hora del día
✅ **Cálculos dinámicos** vehículo-terreno

---

## 🚗 Tipos de Vehículos

### 1. Camión Logístico 4x4

**Capacidades**:
- Vadeo máximo: **0.6 m**
- Pendiente máxima: **25°**
- Velocidad en ruta: **80 km/h**
- Velocidad campo: **40 km/h**
- Terreno blando: **Limitado**

**Modificadores**:
```javascript
{
    arenal: -60%,
    barrial: -70%,
    pedregal: -40%,
    bosque_denso: -80%
}
```

**Uso Militar**:
- ✅ Logística en rutas pavimentadas
- ⚠️ Limitado en campo traviesa
- ❌ No cruza ríos >0.6m
- ❌ Muy vulnerable en terreno blando

---

### 2. Blindado de Ruedas 6x6

**Capacidades**:
- Vadeo máximo: **1.0 m**
- Pendiente máxima: **30°**
- Velocidad ruta: **100 km/h**
- Velocidad campo: **60 km/h**
- Terreno blando: **Moderado**

**Modificadores**:
```javascript
{
    arenal: -40%,
    barrial: -50%,
    pedregal: -30%,
    bosque_denso: -60%
}
```

**Uso Militar**:
- ✅ Exploración rápida
- ✅ Movimiento campo traviesa moderado
- ⚠️ Puede cruzar arroyos y ríos pequeños
- ❌ Requiere puentes para ríos >1m

---

### 3. Blindado Anfibio 8x8 ⭐

**Capacidades**:
- Vadeo máximo: **Ilimitado** (anfibio)
- Pendiente máxima: **30°**
- Velocidad ruta: **100 km/h**
- Velocidad campo: **60 km/h**
- **Velocidad agua: 10 km/h** 🌊
- Terreno blando: **Bueno**

**Modificadores**:
```javascript
{
    arenal: -30%,
    barrial: -40%,
    rio: 0%  // ← PUEDE NADAR
}
```

**Uso Militar**:
- ✅✅ **Cruza cualquier río nadando**
- ✅ Excelente movilidad campo traviesa
- ✅ Ideal para operaciones anfibias
- ⚠️ Vulnerable durante cruce acuático

**Procedimiento de Cruce**:
1. Preparación: **5 minutos**
2. Velocidad en agua: **10 km/h**
3. Personal: Cerrar escotillas
4. Navegación: Mantener ángulo 45° corriente

---

### 4. Tanque de Batalla Principal

**Capacidades**:
- Vadeo normal: **1.2 m**
- **Vadeo preparado: 1.8 m** (con kit especial)
- Pendiente máxima: **35°**
- Velocidad ruta: **70 km/h**
- Velocidad campo: **50 km/h**
- Terreno blando: **Excelente**
- **Puede destruir obstáculos** 💥

**Modificadores**:
```javascript
{
    arenal: -15%,
    barrial: -20%,
    bosque_denso: -30%,
    vegetacion_arbustiva: 0%  // ← Atraviesa sin problema
}
```

**Uso Militar**:
- ✅✅ Mejor movilidad campo traviesa
- ✅ Derriba árboles pequeños (<10m)
- ✅ Cruza vegetación arbustiva
- ⚠️ Requiere 30 min preparar vadeo profundo
- ❌ No cruza ríos >1.8m sin puente

**Vadeo Preparado (1.8m)**:
```
Procedimiento:
1. Instalar kit de vadeo (30 min)
2. Sellar todas las escotillas
3. Extender snorkel respiración motor
4. Personal entrenado requerido
5. Cruce lento: ~3 km/h
```

---

### 5. Transporte Blindado Oruga

**Capacidades**:
- Vadeo máximo: **1.0 m**
- Pendiente máxima: **32°**
- Velocidad ruta: **65 km/h**
- Velocidad campo: **45 km/h**
- Terreno blando: **Excelente**

**Modificadores**:
```javascript
{
    arenal: -20%,
    barrial: -25%,
    pedregal: -15%,
    bosque_denso: -40%
}
```

**Uso Militar**:
- ✅ Transporte de infantería campo traviesa
- ✅ Buena movilidad en terrenos difíciles
- ⚠️ Cruza arroyos y ríos pequeños
- ❌ No anfibio

---

### 6. Vehículo Anfibio Oruga ⭐⭐

**Capacidades**:
- Vadeo máximo: **Ilimitado**
- Velocidad ruta: **60 km/h**
- Velocidad campo: **40 km/h**
- **Velocidad agua: 8 km/h** 🌊
- Terreno blando: **Excelente**

**Uso Militar**:
- ✅✅ Operaciones anfibias
- ✅✅ Cruza ríos grandes
- ✅ Excelente en pantanos/humedales
- ⚠️ Más lento que blindados rueda

---

### 7. Infantería a Pie

**Capacidades**:
- Vadeo máximo: **1.5 m** (con equipo)
- Pendiente máxima: **60°** (muy alta)
- Velocidad ruta: **5 km/h**
- Velocidad campo: **3 km/h**
- Terreno blando: **Excelente**

**Modificadores**:
```javascript
{
    arenal: -30%,
    barrial: -40%,
    bosque_denso: -20%,  // ← Mejor que vehículos
    vegetacion_arbustiva: -10%
}
```

**Uso Militar**:
- ✅ Acceso a terreno inaccesible para vehículos
- ✅ Puede escalar cumbres rocosas
- ✅ Mejor en vegetación densa
- ❌ Muy lento
- ❌ Vulnerable en terreno abierto

---

## 💧 Obstáculos Acuáticos

### Clasificación de Ríos por Ancho

#### 1. Arroyo (0-3m)

**Características**:
- Profundidad: **~0.3 m**
- Corriente: Lenta
- Ancho: 0-3 metros

**Vadeable por**:
- ✅ Infantería
- ✅ Todos los vehículos 4x4
- ✅ Todos los vehículos oruga

**Procedimiento**:
1. Reconocer vado (5 min)
2. Cruzar en fila
3. Velocidad: 5 km/h

---

#### 2. Río Pequeño (3-10m)

**Características**:
- Profundidad: **~0.8 m**
- Corriente: Moderada
- Ancho: 3-10 metros

**Vadeable por**:
- ✅ Infantería (con cuidado)
- ⚠️ Vehículos oruga (si <1m profundidad)
- ✅ Anfibios
- ❌ Vehículos rueda 4x4

**Riesgos**:
- ⚠️ Motor ahogado (ruedas)
- ⚠️ Corriente puede arrastrar infantería

---

#### 3. Río Mediano (10-50m)

**Características**:
- Profundidad: **~1.5 m**
- Corriente: Moderada-Rápida
- Ancho: 10-50 metros

**Cruce**:
- ✅ Solo anfibios nadando
- ✅ Tanques con vadeo preparado (si <1.8m)
- ❌ Todos los demás
- **Requiere puente o ferry**

**Construcción de Puente**:
- Tiempo: 2-4 horas (ingenieros)
- Requiere: Equipo pontones

---

#### 4. Río Grande (50-200m)

**Características**:
- Profundidad: **~3.0 m**
- Corriente: Rápida
- Ancho: 50-200 metros

**Cruce**:
- ✅ Solo anfibios (con precaución)
- ❌ Todos los demás
- **Requiere puente pesado**

**Construcción de Puente**:
- Tiempo: 6-12 horas
- Requiere: Batallón de ingenieros
- Capacidad: Vehículos pesados

---

#### 5. Río Muy Grande (>200m)

**Ejemplos**: Paraná, Uruguay, Río de la Plata

**Características**:
- Profundidad: **>5 m**
- Corriente: Variable
- Ancho: >200 metros

**Cruce**:
- ⚠️ Anfibios solo en condiciones ideales
- **Requiere estudio ingeniero detallado**
- **Operación mayor**

**Alternativas**:
1. Puentes existentes (objetivos estratégicos)
2. Ferries
3. Puentes militares pesados (días)
4. Rodeo completo

---

## 🏜️ Tipos de Suelo

### 1. Arenal 🏜️

**Características**:
- Resistencia: **Muy Baja**
- Drenaje: Excelente
- Impacto lluvia: Ninguno

**Modificadores**:
```javascript
rueda_4x4:  -60%
rueda_6x6:  -40%
oruga:      -15%
```

**Efecto Táctico**:
- ❌ Vehículos rueda se hunden
- ⚠️ Vehículos oruga pueden transitar lento
- ✅ No afecta a infantería significativamente

**Regiones Argentina**:
- Dunas costeras (Buenos Aires)
- Médanos (San Luis, La Pampa)
- Desiertos (Catamarca, La Rioja)

---

### 2. Barrial 🟤

**Características**:
- Resistencia: **Muy Baja**
- Drenaje: Malo
- Impacto lluvia: **SEVERO**

**Modificadores (SECO)**:
```javascript
rueda_4x4:  -70%
rueda_6x6:  -50%
oruga:      -20%
```

**Modificadores (LLUVIA)**:
```javascript
rueda_4x4:  -90%  // ← CASI INTRANSITABLE
rueda_6x6:  -70%
oruga:      -40%
```

**Efecto Táctico**:
- ❌❌ **Trampa para vehículos rueda en lluvia**
- ⚠️ Vehículos oruga pueden cruzar pero lento
- 🕐 **Estacional**: Evitar en época de lluvias

**Planificación Operacional**:
```
SECO (verano):     Transitable con precaución
LLUVIA (invierno): EVITAR completamente
```

---

### 3. Pedregal 🪨

**Características**:
- Resistencia: Alta
- Drenaje: Excelente
- Impacto lluvia: Ninguno
- ⚠️ **Daña neumáticos y orugas**

**Modificadores**:
```javascript
rueda_4x4:  -40%
rueda_6x6:  -30%
oruga:      -10%
Velocidad:   50% normal
```

**Efecto Táctico**:
- ⚠️ Desgaste acelerado vehículos
- 🔧 Aumenta mantenimiento
- ⏱️ Velocidad reducida a la mitad
- ✅ Transitable todo el año

**Consideraciones Logísticas**:
- Tasa de fallas mecánicas: +30%
- Cambios de neumáticos frecuentes
- Inspecciones más frecuentes

---

### 4. Afloramiento Rocoso 🏔️

**Características**:
- Resistencia: **Muy Alta**
- **Roca sólida expuesta**

**Modificadores**:
```javascript
rueda_4x4:  -80%
rueda_6x6:  -70%
oruga:      -35%
infanteria: -25%  // ← Puede escalar
```

**Efecto Táctico**:
- ❌ Intransitable para vehículos rueda
- ⚠️ Muy difícil para vehículos oruga
- ✅ Infantería puede pasar (lento)
- 🛡️ **Excelente posición defensiva**

**Uso Defensivo**:
- Flancos naturales
- Posiciones elevadas
- Obstáculos anti-tanque natural

---

### 5. Sedimento Fluvial 🌊

**Características**:
- Resistencia: Baja
- **Cerca de ríos**
- Terreno inestable
- ⚠️ Riesgo hundimiento

**Modificadores**:
```javascript
rueda_4x4:  -45%
rueda_6x6:  -35%
oruga:      -15%
```

**Efecto Táctico**:
- ⚠️ Indica proximidad a río
- ⚠️ Puede ser trampa
- 🔍 Reconocer antes de cruzar

---

### 6. Cumbre Rocosa ⛰️

**Características**:
- Resistencia: **Muy Alta**
- Terreno escarpado
- **Solo infantería ligera**

**Modificadores**:
```javascript
rueda_4x4:  -90%
rueda_6x6:  -85%
oruga:      -60%
infanteria: -40%
```

**Efecto Táctico**:
- ❌❌ Intransitable para vehículos
- ⚠️ Infantería ligera con dificultad
- 🎯 **Posición de observación**
- 📡 Ideal para antenas/comunicaciones

**Uso Militar**:
- Puestos de observación
- Posiciones de artillería
- Estaciones repetidoras

---

### 7. Salina 🧂

**Características**:
- Resistencia: **Muy Baja**
- Costra de sal frágil
- ⚠️ Riesgo hundimiento
- ⚠️ **Corrosivo para vehículos**

**Modificadores**:
```javascript
rueda_4x4:  -50%
rueda_6x6:  -40%
oruga:      -25%
```

**Efecto Táctico**:
- ⚠️ Puede romperse bajo peso
- 🔧 Daña vehículos (corrosión)
- 💧 Peor después de lluvia

**Mantenimiento Requerido**:
- Lavado completo post-cruce
- Inspección corrosión
- Engrase reforzado

---

## 🌳 Vegetación

### 1. Bosque Denso (Bosque Nativo 1)

**Características**:
- Densidad: **Muy Alta**
- Altura: ~15 metros
- Visibilidad: -90%

**Modificadores**:
```javascript
rueda_4x4:  -80%
rueda_6x6:  -70%
oruga:      -40%
tanque:     -30%  // ← Puede derribar árboles
infanteria: -25%
```

**Efectos Tácticos**:
- 🛡️ Cobertura: **85%**
- 👁️ Ocultamiento: **90%**
- ❌ Reduce campo de tiro
- ⚠️ Dificulta maniobra vehículos

**Uso Defensivo**:
- ✅✅ Protección observación aérea
- ✅ Protección fuego directo
- ✅ Emboscadas
- ❌ Limita movilidad propia

---

### 2. Vegetación Arbustiva

**Características**:
- Densidad: Media
- Altura: ~2 metros
- Visibilidad: -40%

**Modificadores**:
```javascript
rueda_4x4:  -35%
oruga:      -15%
tanque:      0%   // ← Atraviesa sin problema
infanteria: -15%
```

**Efectos Tácticos**:
- 🛡️ Cobertura: 30%
- 👁️ Ocultamiento: **60%**
- ✅ Tanques pueden atravesar
- ✅ Buen ocultamiento infantería

**Uso Táctico**:
- Ocultamiento movimiento infantería
- Posiciones de tiradores
- Infiltración

---

### 3. Vegetación Hidrófila

**Características**:
- Densidad: Alta
- Altura: ~3 metros
- **Indica agua cercana/pantano**
- Terreno húmedo

**Modificadores**:
```javascript
rueda_4x4:  -70%
rueda_6x6:  -60%
oruga:      -35%
infanteria: -40%
```

**Efectos Tácticos**:
- ⚠️ **Indica terreno húmedo**
- 🛡️ Cobertura: 40%
- 👁️ Ocultamiento: 70%
- ❌ Difícil para todos

**Indicador Terreno**:
- Probablemente pantano
- Río/laguna cercana
- Evitar con vehículos pesados

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Cruce de Río

**Escenario**:
- Río de 8m ancho, 0.9m profundidad
- Corriente moderada

**Vehículos**:

```javascript
// Camión 4x4
const camion = TIPOS_VEHICULOS.CAMION_LOGISTICO;
const resultado1 = puedeVadearRio(camion, 8, 0.9);
console.log(resultado1);
// {
//   puede: false,
//   razon: "Profundidad 0.9m excede capacidad 0.6m",
//   requiere: "Puente o ferry"
// }

// Blindado 6x6
const blindado = TIPOS_VEHICULOS.BLINDADO_RUEDA;
const resultado2 = puedeVadearRio(blindado, 8, 0.9);
// {
//   puede: true,
//   metodo: "vadeo",
//   velocidad_cruce: 3,
//   riesgos: []
// }

// Anfibio 8x8
const anfibio = TIPOS_VEHICULOS.BLINDADO_RUEDA_ANFIBIO;
const resultado3 = puedeVadearRio(anfibio, 8, 0.9);
// {
//   puede: true,
//   metodo: "anfibio",
//   velocidad_cruce: 10,
//   tiempo_preparacion: 5
// }
```

**Resultado**:
- ❌ Camión: **NO** puede cruzar
- ✅ Blindado 6x6: Puede vadear (3 km/h)
- ✅✅ Anfibio: Nada (10 km/h)

---

### Ejemplo 2: Movimiento en Arenal

**Escenario**:
- Médanos (San Luis)
- Pendiente 15°
- Clima seco

```javascript
const terreno = {
    tipo: 'campo',
    pendiente: 15,
    suelo: 'ARENAL'
};

const condiciones = {
    meteo: 'seco',
    hora: 'dia'
};

// Camión 4x4
const v1 = calcularVelocidadMarcha(
    TIPOS_VEHICULOS.CAMION_LOGISTICO,
    terreno,
    condiciones
);
console.log(v1); // ~11 km/h (40 * 0.7 pendiente * 0.4 arenal)

// Tanque
const v2 = calcularVelocidadMarcha(
    TIPOS_VEHICULOS.TANQUE_BATALLA,
    terreno,
    condiciones
);
console.log(v2); // ~30 km/h (50 * 0.7 * 0.85)
```

**Resultado**:
- Camión: **11 km/h** (muy lento)
- Tanque: **30 km/h** (moderado)
- **Recomendación**: Usar vehículos oruga en arenal

---

### Ejemplo 3: Barrial con Lluvia

**Escenario**:
- Terreno barrial
- Lloviendo
- Pendiente 5°

```javascript
const terreno = {
    tipo: 'campo',
    pendiente: 5,
    suelo: 'BARRIAL'
};

const condiciones = {
    meteo: 'lluvia',
    hora: 'dia'
};

// Camión 4x4
const v1 = calcularVelocidadMarcha(
    TIPOS_VEHICULOS.CAMION_LOGISTICO,
    terreno,
    condiciones
);
console.log(v1); // ~0.3 km/h (CASI CERO!)

// Tanque
const v2 = calcularVelocidadMarcha(
    TIPOS_VEHICULOS.TANQUE_BATALLA,
    terreno,
    condiciones
);
console.log(v2); // ~16 km/h (todavía puede moverse)
```

**Resultado**:
- Camión: **0.3 km/h** ❌ (ATASCADO)
- Tanque: **16 km/h** ⚠️ (lento pero posible)
- **Recomendación**: **EVITAR** barrial en lluvia

---

## 🔗 Integración con Sistema GIS

### Detectar Tipo de Río por Ancho

```javascript
// En analisisTerreno.js
import { CLASES_RIOS, puedeVadearRio } from './vehiculosTerreno.js';

// Cuando detectamos un río en capas GIS
this.capasGIS.hidrografia.eachLayer(layer => {
    if (layer.feature.geometry.type === 'LineString') {
        // Estimar ancho del río por propiedades
        const ancho = layer.feature.properties.ancho_m || 5; // Default 5m
        
        // Clasificar río
        let claseRio = null;
        for (let [nombre, clase] of Object.entries(CLASES_RIOS)) {
            if (ancho >= clase.ancho_min && ancho < clase.ancho_max) {
                claseRio = clase;
                break;
            }
        }
        
        // Evaluar si vehículo actual puede cruzar
        const resultado = puedeVadearRio(vehiculoActual, ancho, claseRio.profundidad_media);
        
        if (!resultado.puede) {
            // Marcar como obstáculo
            modificadores.hidrografia.push(`Río ${claseRio.descripcion} - Requiere ${resultado.requiere}`);
            factorModificado = 0; // Intransitable
        } else if (resultado.metodo === 'vadeo') {
            // Reduce velocidad durante cruce
            modificadores.hidrografia.push(`Cruce vadeo (${resultado.velocidad_cruce} km/h)`);
            factorModificado *= 0.3;
        } else if (resultado.metodo === 'anfibio') {
            // Anfibio puede cruzar
            modificadores.hidrografia.push(`Cruce anfibio (${resultado.velocidad_cruce} km/h)`);
            factorModificado *= 0.5;
        }
    }
});
```

### Aplicar Modificadores de Suelo

```javascript
// Detectar tipo de suelo
this.capasGIS.suelos.eachLayer(layer => {
    const tipoSuelo = layer.feature.properties.tipo; // 'ARENAL', 'BARRIAL', etc.
    
    if (this.puntoEstaDentroDePoligono(puntoLatLng, coords)) {
        // Evaluar impacto en vehículo
        const evaluacion = evaluarImpactoSuelo(
            vehiculoActual,
            tipoSuelo,
            condicionesMeteorologicas
        );
        
        if (!evaluacion.puede) {
            modificadores.suelos.push(evaluacion.razon);
            factorModificado = 0;
        } else {
            factorModificado += evaluacion.modificador;
            
            if (evaluacion.advertencias.length > 0) {
                modificadores.suelos.push(...evaluacion.advertencias);
            }
        }
    }
});
```

---

## 🎯 Planificación Operacional

### Selección de Vehículos según Terreno

#### Terreno Abierto (Pampa, Estepa)
```
✅ Recomendado:
   - Blindados rueda (rápidos)
   - Camiones logísticos
   
⚠️ Evitar:
   - Vehículos lentos innecesarios
```

#### Terreno Montañoso (Andes, Sierras)
```
✅ Recomendado:
   - Vehículos oruga (pendientes)
   - Infantería (cumbres)
   
⚠️ Evitar:
   - Vehículos rueda pesados
   - Logística por rutas alternativas
```

#### Zona de Ríos/Pantanos (Litoral, Delta)
```
✅ Recomendado:
   - Vehículos anfibios
   - Vehículos oruga
   
⚠️ Evitar:
   - Vehículos rueda sin preparación
   
🌉 Requerido:
   - Equipos de ingenieros
   - Puentes/pontones
```

#### Desierto/Médanos (Cuyo, Patagonia)
```
✅ Recomendado:
   - Vehículos oruga
   - Vehículos 6x6 preparados
   
⚠️ Evitar:
   - Vehículos rueda 4x4 estándar
   
🔧 Mantenimiento:
   - Filtros aire reforzados
   - Limpieza frecuente
```

---

## 📈 Matriz de Decisión

### ¿Qué vehículo usar?

| Terreno | Camión 4x4 | Blindado 6x6 | Anfibio 8x8 | Tanque | Infantería |
|---------|------------|--------------|-------------|---------|------------|
| **Ruta pavimentada** | ✅✅ | ✅✅ | ✅ | ✅ | ❌ |
| **Campo abierto** | ✅ | ✅✅ | ✅✅ | ✅✅ | ⚠️ |
| **Arenal** | ❌ | ⚠️ | ✅ | ✅✅ | ⚠️ |
| **Barrial (seco)** | ❌ | ⚠️ | ✅ | ✅✅ | ⚠️ |
| **Barrial (lluvia)** | ❌❌ | ❌ | ⚠️ | ✅ | ❌ |
| **Pedregal** | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| **Río <1m** | ❌ | ✅ | ✅✅ | ✅✅ | ✅ |
| **Río >1m** | ❌ | ❌ | ✅✅ | ⚠️ | ❌ |
| **Bosque denso** | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| **Montaña** | ❌ | ❌ | ❌ | ⚠️ | ✅✅ |

**Leyenda**:
- ✅✅ = Ideal
- ✅ = Bueno
- ⚠️ = Posible pero difícil
- ❌ = No recomendado
- ❌❌ = Imposible

---

## 🚀 Próximos Pasos

### Fase 2: Integración Completa
- [ ] Selector de tipo de vehículo en UI
- [ ] Cálculo automático capacidad vadeo
- [ ] Detección automática ancho de ríos
- [ ] Alertas de obstáculos intransitables
- [ ] Rutas alternativas automáticas

### Fase 3: Condiciones Dinámicas
- [ ] Integración datos meteorológicos reales
- [ ] Variación estacional vegetación
- [ ] Nivel de ríos por época
- [ ] Predicción de barrial por lluvias

---

**Última actualización**: 15 de noviembre de 2025
**Versión**: 1.0 - Sistema Completo Vehículos-Terreno
