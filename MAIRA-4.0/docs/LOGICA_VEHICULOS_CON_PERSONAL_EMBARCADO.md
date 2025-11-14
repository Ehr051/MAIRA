# 🚛 LÓGICA: Vehículos con Personal Embarcado

**Fecha**: 14 noviembre 2025
**Concepto clave**: "El grupo VA DENTRO del vehículo"

---

## 🎯 CONCEPTO MILITAR CORRECTO

### ❌ INCORRECTO (Como lo pensaba antes)

```
Sección Mecanizada
├─ VCTP 1 (vehículo solo)
├─ VCTP 2 (vehículo solo)
├─ VCTP 3 (vehículo solo)
├─ VCTP 4 (vehículo solo)
├─ Grupo 1 (a pie, separado) ← ❌ ESTÁ MAL
├─ Grupo 2 (a pie, separado) ← ❌ ESTÁ MAL
├─ Grupo 3 (a pie, separado) ← ❌ ESTÁ MAL
└─ Grupo 4 (a pie, separado) ← ❌ ESTÁ MAL
```

**Problema**: Los grupos están representados como elementos separados de los vehículos.

---

### ✅ CORRECTO (Como debe ser)

```
Sección Mecanizada
├─ VCTP 1
│   ├─ Tripulación fija:
│   │   ├─ Conductor
│   │   ├─ Jefe vehículo
│   │   └─ Apuntador cañón 20mm
│   └─ Personal embarcado (Grupo 1):
│       ├─ Equipo A: J Eq + 3 Tiradores FAL + 1 MAG
│       └─ Equipo B: J Eq + 3 Tiradores FAL + 1 MAG
│
├─ VCTP 2
│   ├─ Tripulación fija (3)
│   └─ Personal embarcado (Grupo 2) (8)
│
├─ VCTP 3
│   ├─ Tripulación fija (3)
│   └─ Personal embarcado (Grupo 3) (8)
│
└─ VCTP 4
    ├─ Tripulación fija (3)
    └─ Personal embarcado (Grupo 4) (8)
```

**Despliegue en JDG**: Se crean **4 marcadores** (uno por cada VCTP), cada marcador representa:
- El vehículo (VCTP con su blindaje, armamento, combustible)
- Su tripulación fija (3 personas)
- El personal embarcado (8 personas del grupo)

**Total por VCTP**: 11 personas (3 tripulación + 8 embarcados)

---

## 📊 ESTRUCTURA DE DATOS

### Vehículo con Personal Embarcado

```javascript
{
    // Identificación del marcador
    id: "vctp_1_seccion_1",
    sidc: "SFGPUCVI--D*---", // VCTP, nivel Sección
    designacion: "Sección 1ra",
    dependencia: "Cia Fus A",

    // Tipo de vehículo (para buscar en velocidadesReales.json)
    tipoVehiculo: "vctp_tam",

    // 🚛 DATOS DEL VEHÍCULO
    vehiculo: {
        tipo: "vctp_tam",
        nombre: "VCTP TAM",

        // Movilidad
        velocidad_max: 75,
        velocidad_promedio: 35,
        autonomia_km: 500,
        consumo_km: 1.02,

        // Combustible ACTUAL
        combustible_actual: 510,
        combustible_max: 510,

        // Armamento DEL VEHÍCULO
        armamento_vehiculo: {
            principal: {
                tipo: "Cañón 20mm Oerlikon",
                municion_tipo: "municion_20mm",
                municion_actual: 800,
                municion_max: 800
            },
            secundario: {
                tipo: "MAG 7.62mm coaxial",
                municion_tipo: "municion_762",
                municion_actual: 2000,
                municion_max: 2000
            }
        }
    },

    // 👥 TRIPULACIÓN FIJA (operadores del vehículo)
    tripulacion: {
        total: 3,
        roles: [
            {rol: "conductor_vctp", armamento: "pistola_9mm", municion: 30},
            {rol: "jefe_vctp", armamento: "fal_762", municion: 100},
            {rol: "apuntador_vctp", armamento: "ninguno", municion: 0}
        ],
        agua: 10.5, // 3 × 3.5L
        raciones: 9  // 3 × 3 días
    },

    // 🎖️ PERSONAL EMBARCADO (soldados transportados)
    personal_embarcado: {
        total: 8,
        organizacion: {
            grupo: "Grupo 1",
            equipos: [
                {
                    nombre: "Equipo A",
                    integrantes: [
                        {rol: "jefe_equipo", armamento: "fal_762", municion: 100},
                        {rol: "tirador_fal", armamento: "fal_762", municion: 100},
                        {rol: "tirador_fal", armamento: "fal_762", municion: 100},
                        {rol: "tirador_fal", armamento: "fal_762", municion: 100},
                        {rol: "ametrallador_mag", armamento: "mag_762", municion: 600}
                    ]
                },
                {
                    nombre: "Equipo B",
                    integrantes: [
                        {rol: "jefe_equipo", armamento: "fal_762", municion: 100},
                        {rol: "tirador_fal", armamento: "fal_762", municion: 100},
                        {rol: "ametrallador_mag", armamento: "mag_762", municion: 600}
                    ]
                }
            ]
        },

        // Munición AGREGADA del personal
        municion_agregada: {
            municion_762: 1800  // 6×100 (FAL) + 2×600 (MAG)
        },

        agua: 28,      // 8 × 3.5L
        raciones: 24   // 8 × 3 días
    },

    // 📊 STATS TOTALES (vehículo + tripulación + embarcados)
    stats: {
        personal_total: 11,           // 3 + 8
        combustible: 510,
        municion_vehiculo: {
            municion_20mm: 800,
            municion_762_coaxial: 2000
        },
        municion_personal: {
            municion_762: 2100,        // 300 (tripulación) + 1800 (embarcados)
            municion_9mm: 30           // pistola conductor
        },
        agua_total: 38.5,              // 10.5 + 28
        raciones_total: 33,            // 9 + 24
        moral: 100
    }
}
```

---

## 🎮 FLUJO DE DESPLIEGUE

### 1. Creación en CO.html

```
Usuario crea en CO.html:
┌─────────────────────────────────┐
│ Sección Mecanizada              │
│ ├─ VCTP 1                       │
│ │  └─ Grupo 1 (embarcado)       │
│ │     ├─ Eq A                   │
│ │     └─ Eq B                   │
│ ├─ VCTP 2                       │
│ │  └─ Grupo 2 (embarcado)       │
│ ├─ VCTP 3                       │
│ │  └─ Grupo 3 (embarcado)       │
│ └─ VCTP 4                       │
│    └─ Grupo 4 (embarcado)       │
└─────────────────────────────────┘
```

**Guardado**: JSON con jerarquía completa

### 2. Exportación desde CO.html

```javascript
function exportarSeccionMecanizada() {
    return {
        nombre: "Sección 1ra Mecanizada",
        tipo: "seccion_mecanizada",
        magnitud: "D", // Sección

        vehiculos: [
            {
                tipo: "vctp_tam",
                numero: 1,
                personal_embarcado: {
                    grupo: "Grupo 1",
                    equipos: [...] // Equipos A y B
                }
            },
            {
                tipo: "vctp_tam",
                numero: 2,
                personal_embarcado: {
                    grupo: "Grupo 2",
                    equipos: [...]
                }
            },
            // ... VCTP 3 y 4
        ]
    };
}
```

### 3. Importación en JDG

```javascript
function importarSeccionEnJDG(jsonCO) {
    const seccion = jsonCO;

    // Por CADA vehículo, crear UN marcador
    seccion.vehiculos.forEach((vehiculo, index) => {
        const marcador = crearMarcadorVehiculoConEmbarcados({
            // Datos del vehículo
            tipoVehiculo: vehiculo.tipo, // "vctp_tam"
            numero: vehiculo.numero,

            // Datos del elemento raíz
            designacion: seccion.nombre,
            dependencia: "Cia Fus A",
            sidc: calcularSIDC(vehiculo.tipo, seccion.magnitud),

            // Personal embarcado
            personalEmbarcado: vehiculo.personal_embarcado,

            // Posición (usuario clickea en mapa para cada vehículo)
            posicion: esperarClickEnMapa(`Ubicar ${vehiculo.tipo.toUpperCase()} ${vehiculo.numero}`)
        });

        marcador.addTo(mapaJDG);
    });

    // Resultado: 4 marcadores (4 VCTP) en el mapa
}
```

### 4. Renderizado en Mapa

```
Mapa JDG:
┌──────────────────────────────────────┐
│                                      │
│    [VCTP 1]  ← Stats: 11 pers       │
│              510L, 800 proy 20mm    │
│                                      │
│         [VCTP 2]                    │
│                                      │
│    [VCTP 3]        [VCTP 4]         │
│                                      │
└──────────────────────────────────────┘
```

Cada marcador `[VCTP X]`:
- Símbolo SIDC correcto (nivel Sección, Infantería Mecanizada)
- Al clickear: Muestra panel de stats
- Al mover: Consume combustible
- Al combatir: Usa munición del vehículo Y del personal

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Función: Crear Marcador Vehículo con Embarcados

```javascript
/**
 * Crea un marcador de Leaflet que representa un vehículo con personal embarcado
 * @param {Object} config - Configuración del vehículo
 * @returns {L.Marker} Marcador de Leaflet
 */
function crearMarcadorVehiculoConEmbarcados(config) {
    // 1. Obtener datos BV8 del vehículo
    const velocidadesReales = window.MAIRA?.velocidadesReales?.vehiculos || {};
    const datosVehiculo = velocidadesReales[config.tipoVehiculo];

    if (!datosVehiculo) {
        console.error(`❌ No se encontraron datos para: ${config.tipoVehiculo}`);
        return null;
    }

    // 2. Calcular stats agregados de personal embarcado
    const statsEmbarcados = calcularStatsPersonalEmbarcado(config.personalEmbarcado);

    // 3. Calcular stats de tripulación
    const statsTripulacion = calcularStatsTripulacion(datosVehiculo.tripulacion);

    // 4. Combinar todos los stats
    const statsTotal = {
        // Personal
        personal_total: datosVehiculo.tripulacion.total + statsEmbarcados.personal,
        tripulacion: statsTripulacion,
        embarcados: statsEmbarcados,

        // Vehículo
        combustible_actual: datosVehiculo.dotacion_inicial.combustible_litros,
        combustible_max: datosVehiculo.movilidad.capacidad_combustible_litros,

        // Munición del vehículo
        municion_vehiculo: datosVehiculo.dotacion_inicial.municion,

        // Munición del personal (tripulación + embarcados)
        municion_personal: combinarMunicion(
            statsTripulacion.municion,
            statsEmbarcados.municion
        ),

        // Agua y raciones (tripulación + embarcados)
        agua_total: statsTripulacion.agua + statsEmbarcados.agua,
        raciones_total: statsTripulacion.raciones + statsEmbarcados.raciones,

        // Moral inicial
        moral: 100
    };

    // 5. Crear marcador Leaflet
    const marcador = L.marker(config.posicion, {
        icon: crearIconoMilsymbol(config.sidc),
        draggable: true,

        // Datos del elemento
        id: `${config.tipoVehiculo}_${config.numero}_${config.designacion}`,
        sidc: config.sidc,
        designacion: config.designacion,
        dependencia: config.dependencia,

        // Tipo de vehículo (clave para obtener datos BV8)
        tipoVehiculo: config.tipoVehiculo,

        // Datos BV8 completos
        vehiculo: datosVehiculo,
        tripulacion: statsTripulacion,
        personalEmbarcado: statsEmbarcados,

        // Stats totales
        ...statsTotal
    });

    console.log(`✅ Marcador creado: ${config.tipoVehiculo} ${config.numero}`);
    console.log(`   Personal total: ${statsTotal.personal_total}`);
    console.log(`   Combustible: ${statsTotal.combustible_actual}L`);

    return marcador;
}

/**
 * Calcula stats del personal embarcado
 */
function calcularStatsPersonalEmbarcado(personalEmbarcado) {
    let personal = 0;
    let municion = {};
    let agua = 0;
    let raciones = 0;

    personalEmbarcado.equipos.forEach(equipo => {
        equipo.integrantes.forEach(integrante => {
            personal += 1;
            agua += 3.5; // L/día por persona
            raciones += 3; // raciones/día por persona

            // Agregar munición según armamento
            const tipoMunicion = obtenerTipoMunicion(integrante.armamento);
            if (tipoMunicion) {
                municion[tipoMunicion] = (municion[tipoMunicion] || 0) + integrante.municion;
            }
        });
    });

    return {
        personal,
        municion,
        agua,
        raciones,
        organizacion: personalEmbarcado
    };
}

/**
 * Calcula stats de la tripulación fija
 */
function calcularStatsTripulacion(tripulacion) {
    const roles = tripulacion.roles;
    const total = tripulacion.total;

    return {
        total: total,
        roles: roles,
        municion: {
            municion_762: 100, // FAL jefe vehículo
            municion_9mm: 30   // Pistola conductor
        },
        agua: total * 3.5,
        raciones: total * 3
    };
}
```

---

## 🎯 CASOS DE USO

### Caso 1: Desplegar Sección Mecanizada

**Input**: JSON de Sección con 4 VCTP + personal

**Output**: 4 marcadores en JDG

**Cada marcador tiene**:
- ✅ Datos del vehículo (combustible, munición 20mm)
- ✅ Datos de tripulación fija (3 personas)
- ✅ Datos de personal embarcado (8 personas)
- ✅ Stats agregados totales

---

### Caso 2: Movimiento de Vehículo

**Acción**: Usuario mueve VCTP 50 km

**Consumo**:
- Combustible: 50 × 1.02 = 51L
- Combustible restante: 510 → 459L
- Agua: 0 (no se consume durante movimiento corto)
- Raciones: 0

**Actualización**: Solo barra de combustible ⛽

---

### Caso 3: Combate de Vehículo

**Acción**: VCTP entra en combate

**Consumo**:
- Munición 20mm: 100 proyectiles (cañón principal)
- Munición 7.62 coaxial: 500 cartuchos (MAG coaxial)
- Munición 7.62 personal: 300 cartuchos (tiradores FAL embarcados)

**Bajas**: 2 soldados embarcados

**Actualización**:
- Barra munición 🔫
- Barra personal 🧑‍✈️ (11 → 9)
- Barra moral 💪 (100 → 90%)

---

### Caso 4: Desembarcar Personal

**Futuro**: Orden "Desembarcar Grupo"

**Efecto**:
- VCTP queda con solo tripulación (3 personas)
- Se crea nuevo marcador "Grupo 1 a pie" (8 personas)
- Stats se dividen correctamente

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [x] velocidadesReales.json con datos completos
- [ ] elementoUtils.js con soporte para personal embarcado
- [ ] Función `crearMarcadorVehiculoConEmbarcados()`
- [ ] Función `calcularStatsPersonalEmbarcado()`
- [ ] Función `calcularStatsTripulacion()`
- [ ] Función `importarSeccionEnJDG()`
- [ ] Panel de stats muestra personal embarcado
- [ ] Consumo de combustible por movimiento
- [ ] Consumo de munición en combate (vehículo + personal)
- [ ] Sistema de bajas (solo personal, no vehículo)
- [ ] Orden "Desembarcar" (futuro)

---

**Última actualización**: 14 noviembre 2025
**Estado**: En implementación
