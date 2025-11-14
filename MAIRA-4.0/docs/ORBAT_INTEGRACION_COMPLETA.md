# Integración ORBAT Completa - Sistema Orgánico de Recursos

## 📋 Resumen

Sistema completo de vinculación automática entre elementos del mapa y plantillas ORBAT para asignación realista de recursos militares. Implementa el concepto de **elemento orgánico** donde cada unidad contiene sus vehículos, personal, munición, combustible y raciones según su magnitud y tipo.

---

## 🎯 Concepto: La Orquesta Militar

El sistema funciona como una orquesta:
- Cada **instrumento** (vehículo/soldado) tiene su **partitura** (recursos individuales)
- Cada **sección** (grupo/sección) agrupa instrumentos con **armonía**
- El **director** (comandante) puede **desplegar** (dividir) o **replegar** (reunir) la orquesta

### Flujo Completo

```
1. USUARIO INSERTA ELEMENTO
   └─> "Sección Infantería Mecanizada"

2. SISTEMA LEE ORBAT
   └─> Plantilla: Sección D, UCI (Infantería)
       ├─ Personal: 33 soldados
       ├─ Vehículos: 4 VCTP TAM
       ├─ Munición: 6600 tiros 7.62mm + 3200 tiros 20mm
       ├─ Combustible: 2040 L
       └─ Raciones: 3 días x 33 pers = 99 raciones

3. SISTEMA CALCULA STATS AGREGADOS
   ├─ 🧑‍✈️ Personal: 33 (12 trip + 21 emb)
   ├─ ⛽ Combustible: 2040 L
   ├─ 🔫 Munición: 2 tipos (7.62mm, 20mm)
   ├─ 💪 Moral: 100%
   └─ 🍽️ Raciones: 3 días

4. USUARIO HACE "DESPLEGAR"
   └─> Sección se divide:
       ├─ PC (Jefe Sec) → 1 VCTP + Grupo 1 (8 pers)
       ├─ Subsecc 1 → 1 VCTP + Grupo 2 (8 pers)
       ├─ Subsecc 2 → 1 VCTP + Grupo 3 (8 pers)
       └─ Subsecc 3 → 1 VCTP + Grupo 4 (8 pers)
```

---

## 📦 Archivos del Sistema

### 1. ORBATIntegrator.js

**Ubicación**: `Client/js/utils/ORBATIntegrator.js`

**Funciones principales**:
```javascript
// Cargar ORBAT.json al inicio
await cargarORBAT();

// Buscar plantilla para un SIDC
const plantilla = buscarPlantillaORBAT(sidc);

// Calcular recursos para un elemento
const recursos = calcularRecursosDesdeORBAT(sidc, tipo);

// Asignar recursos a un marcador
asignarRecursosORBATAlMarcador(marcador, sidc, tipo);

// Desplegar elemento en subordinados
const hijos = desplegarElemento(marcadorPadre, mapa);

// Replegar subordinados
replegarElemento(marcadorPadre, mapa, calco);
```

### 2. edicioncompleto.js (Modificado)

**Cambio en `guardarCambiosUnidad()`**:
```javascript
// Después de crear el marcador y antes de agregarlo al mapa:
if (typeof window.asignarRecursosORBATAlMarcador === 'function') {
    const asignado = window.asignarRecursosORBATAlMarcador(nuevoMarcador, nuevoSidc, tipoCustom);
    if (asignado) {
        console.log('✅ Recursos ORBAT asignados automáticamente');
    }
}
```

### 3. velocidadesReales.json (Completado)

**Vehículos totales**: 13

**Nuevos vehículos agregados**:
- Mercedes-Benz 1518 (camión logística)
- Mercedes-Benz 1114 (camión mediano)
- Mercedes-Benz 1720 (camión pesado)
- Royal Enfield Himalayan (moto exploración)
- Yamaha Ténéré 700 (moto exploración)
- Yaetsu 450 (moto táctica)

---

## 🔧 Uso del Sistema

### Cargar Datos al Iniciar

```html
<!-- En planeamiento_integrado.html o juegodeguerraV2.html -->

<!-- Utilidades ORBAT -->
<script src="js/utils/ORBATIntegrator.js"></script>

<!-- Inicialización -->
<script>
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar datos BV8
    await cargarVelocidades();

    // Cargar ORBAT
    await cargarORBAT();

    console.log('✅ Sistema completo cargado');
});
</script>
```

### Insertar Elemento con Recursos Automáticos

```javascript
// 1. Usuario selecciona "Infantería Mecanizada, Sección"
// 2. Panel de edición se abre
// 3. Usuario ingresa:
//    - Designación: "Sec 1"
//    - Dependencia: "Cia A"
// 4. Usuario hace clic en "Guardar"

// El sistema automáticamente:
// ✅ Lee ORBAT.json → Plantilla Sección UCI D
// ✅ Asigna 4 VCTP TAM
// ✅ Asigna 33 soldados distribuidos
// ✅ Calcula munición total
// ✅ Calcula combustible total
// ✅ Calcula raciones totales

// Resultado: Marcador con TODOS los recursos asignados
```

### Consultar Recursos de un Elemento

```javascript
const datos = obtenerDatosElemento(marcador);

console.log('Personal:', datos.stats.personal.total);  // 33
console.log('Combustible:', datos.stats.combustible.actual);  // 2040 L
console.log('Munición 7.62mm:', datos.stats.municion.tipos.municion_762);  // 6600
console.log('Munición 20mm:', datos.stats.municion.tipos.municion_20mm);  // 3200
console.log('Vehículos:', datos.orbat_recursos.vehiculos.length);  // 4
```

### Desplegar Elemento

```javascript
// Botón "Desplegar" en UI
function onDesplegarClick(marcador) {
    const hijos = desplegarElemento(marcador, window.mapa);

    console.log(`✅ ${hijos.length} subordinados creados`);

    // Ahora:
    // - Marcador padre está marcado como "desplegado"
    // - Recursos del padre se quedan en plana mayor
    // - Cada hijo tiene sus propios recursos
}
```

### Replegar Elemento

```javascript
// Botón "Replegar" en UI
function onReplegarClick(marcador) {
    const exito = replegarElemento(marcador, window.mapa, window.calcoActivo);

    if (exito) {
        console.log('✅ Elemento replegado, subordinados eliminados');
        // Padre recupera todos sus recursos
    }
}
```

---

## 📊 Estructura de Datos

### Recursos Asignados a un Marcador

```javascript
marcador.options = {
    // ... propiedades existentes (sidc, designacion, etc)

    // 🎯 NUEVO: Recursos ORBAT
    orbat_recursos: {
        personal_total: 33,
        vehiculos: [
            {
                tipo: 'vctp_tam',
                designacion: 'VCTP 1',
                personalEmbarcado: 8
            },
            // ... 3 VCTP más
        ],
        recursos_agregados: {
            combustible_litros: 2040,
            municion: {
                'municion_762': 6600,
                'municion_20mm': 3200
            },
            agua_litros: 115.5,
            raciones_total: 99
        },
        plantilla: {
            arma: 'UCI',
            magnitud: 'D',
            // ...
        }
    },

    // 🎯 NUEVO: Propiedades de vehículo principal
    tipoVehiculo: 'vctp_tam',
    esUnidadMultivehiculo: true,

    // 🎯 NUEVO: Control de despliegue
    estaDesplegado: false,
    subordinadosIds: [],  // IDs de hijos si está desplegado
    esDesplegado: false,  // true si es hijo de un despliegue
    elementoPadreId: null  // ID del padre si es hijo
}
```

### Stats Calculados

```javascript
const datos = obtenerDatosElemento(marcador);

datos.stats = {
    personal: {
        total: 33,
        tripulacion: 12,  // 3 x 4 VCTP
        embarcado: 21,    // 8 + 8 + 5 (distribuido)
        max_capacidad: 44 // 11 x 4 VCTP
    },

    combustible: {
        actual: 2040,     // 510 x 4 VCTP
        capacidad: 2040,
        tipo: 'gasoil',
        consumo_km: 1.02,
        autonomia_km: 500
    },

    municion: {
        tipos: {
            'municion_762': 6600,   // Vehículo + personal
            'municion_20mm': 3200   // 4 VCTP
        },
        total_tipos: 2
    },

    moral: {
        actual: 100,
        max: 100,
        estado: 'alta'
    },

    raciones: {
        total: 99,
        dias_disponibles: 3
    },

    agua: {
        actual: 115.5,  // 3.5L x 33 pers
        capacidad: 154  // 38.5L x 4 VCTP
    }
}
```

---

## 🎨 Integración con UI

### Panel de Stats

```javascript
// Mostrar stats en panel lateral
actualizarPanelStats('#panel-stats', marcador);

// El panel muestra:
// 🧑‍✈️ Personal: 100% (33/33 pers)
// ⛽ Combustible: 100% (2040/2040 L)
// 🔫 Munición: 100% (2 tipos)
// 💪 Moral: 100% (alta)
// 🍽️ Raciones: 100% (3 días)
```

### Botones Desplegar/Replegar

```html
<!-- En panel de elemento -->
<button onclick="onDesplegarElemento()">
    Desplegar
</button>

<button onclick="onReplegarElemento()">
    Replegar
</button>

<script>
function onDesplegarElemento() {
    const marcador = window.elementoSeleccionado;
    if (!marcador) return;

    const hijos = desplegarElemento(marcador, window.mapa);

    // Actualizar UI
    actualizarListaElementos();

    alert(`✅ ${hijos.length} subordinados creados`);
}

function onReplegarElemento() {
    const marcador = window.elementoSeleccionado;
    if (!marcador) return;

    const exito = replegarElemento(marcador, window.mapa, window.calcoActivo);

    if (exito) {
        // Actualizar UI
        actualizarListaElementos();

        alert('✅ Elemento replegado');
    }
}
</script>
```

---

## 🔄 Flujo de Despliegue Detallado

### Estado Inicial (Reunido)

```
Sec 1 (Reunida)
├─ Personal: 33
├─ Vehículos: 4 VCTP
├─ Combustible: 2040 L
├─ Munición: 6600 tiros 7.62mm + 3200 tiros 20mm
└─ Raciones: 99 (3 días)

Marcadores en mapa: 1
```

### Después de Desplegar

```
Sec 1 (PC)
├─ Personal: 11 (1 VCTP trip + 8 emb)
├─ Vehículos: 1 VCTP
├─ Combustible: 510 L
├─ Munición: 1800 tiros 7.62mm + 800 tiros 20mm
└─ Raciones: 33 (3 días x 11 pers)

    └─── Subsecc 1
         ├─ Personal: 11
         ├─ Vehículos: 1 VCTP
         ├─ Combustible: 510 L
         └─ ...

    └─── Subsecc 2
         ├─ Personal: 11
         └─ ...

    └─── Subsecc 3 (con jefe)
         ├─ Personal: 11
         └─ ...

Marcadores en mapa: 4
```

---

## 💡 Casos de Uso

### Caso 1: Compañía de Infantería Mecanizada

```javascript
// Usuario inserta "Compañía Inf Mec" (Magnitud E)
// Sistema asigna automáticamente:

{
    personal_total: 120,
    vehiculos: [
        { tipo: 'vcpc', designacion: 'VCPC PC' },  // Puesto comando
        { tipo: 'vctp_tam', designacion: 'VCTP 1' },
        { tipo: 'vctp_tam', designacion: 'VCTP 2' },
        // ... 10 VCTP más (3 secciones x 4 VCTP)
    ],
    combustible_total: 5610 L,  // 510 x 11
    municion: {
        'municion_762': 24000,  // 200 x 120 pers
        'municion_20mm': 8000   // 800 x 10 VCTP
    }
}

// Usuario hace "Desplegar":
// → 1 PC + 3 Secciones (cada sección con 4 VCTP)
```

### Caso 2: Sección de Caballería (Tanques)

```javascript
// Usuario inserta "Sección Cab Blindada" (Magnitud D)
// Sistema asigna automáticamente:

{
    personal_total: 12,  // Solo tripulación (4 pers x 3 tanques)
    vehiculos: [
        { tipo: 'tam_tanque', designacion: 'TAM 1', personalEmbarcado: 0 },
        { tipo: 'tam_tanque', designacion: 'TAM 2', personalEmbarcado: 0 },
        { tipo: 'tam_tanque', designacion: 'TAM 3', personalEmbarcado: 0 }
    ],
    combustible_total: 1950 L,  // 650 x 3
    municion: {
        'proyectil_105mm': 150,  // 50 x 3
        'municion_762': 18000,   // 6000 x 3
        'municion_127': 3000     // 1000 x 3
    }
}

// Los tanques NO tienen personal embarcado
// Solo tripulación fija
```

### Caso 3: Sección de Exploración (Motos)

```javascript
// Usuario inserta "Sección Exploración" (Magnitud D)
// Sistema asigna automáticamente:

{
    personal_total: 12,  // 1 conductor por moto
    vehiculos: [
        { tipo: 'himalayan', designacion: 'Moto 1' },
        { tipo: 'himalayan', designacion: 'Moto 2' },
        // ... 10 motos más
    ],
    combustible_total: 180 L,  // 15 x 12
    municion: {
        'municion_762': 2400  // 200 x 12 (FAL personal)
    },
    velocidad_promedio: 80 km/h  // Muy rápido
}

// Motos = alta movilidad, baja protección
```

---

## 🔍 Debugging

### Verificar ORBAT Cargado

```javascript
console.log(window.MAIRA.ORBAT);
// → { plantillas: {...}, magnitudes: {...} }
```

### Verificar Recursos Asignados

```javascript
const marcador = window.elementoSeleccionado;
console.log(marcador.options.orbat_recursos);

// → {
//     personal_total: 33,
//     vehiculos: [...],
//     recursos_agregados: {...}
//   }
```

### Logs Útiles

```
✅ ORBAT cargado
   2 tipos de unidades

🚗 Vehículos BV8 cargados (filtro: mecanizado): 2

✅ Plantilla ORBAT encontrada: UCI magnitud D

✅ Recursos ORBAT asignados a Sec 1:
   personal: 33
   vehiculos: 4
   combustible: 2040
   municion_tipos: 2

✅ Recursos ORBAT asignados automáticamente

✅ Elemento Sec 1 desplegado en 4 subordinados
```

---

## ⚠️ Limitaciones Actuales

1. **Despliegue simplificado**: Los recursos se mantienen en el padre, no se redistribuyen realmente (TODO)
2. **Sin cálculo de bajas**: El sistema de stats no se degrada con combate (siguiente fase)
3. **Sin consumo de recursos**: El movimiento no consume combustible aún (siguiente fase)
4. **Sin logística**: No hay reabastecimiento implementado (siguiente fase)

---

## 🚀 Próximos Pasos

1. ✅ **Sistema ORBAT funcionando**
2. ⏳ Reparar Panel de Coordinación de Órdenes
3. ⏳ API Cálculo de Bajas (backend + frontend)
4. ⏳ API Logística (backend + frontend)
5. ⏳ Consumo de recursos en movimiento
6. ⏳ Degradación de recursos en combate
7. ⏳ Reabastecimiento automático
8. ⏳ Ingeniería (tiempos construcción obstáculos)
9. ⏳ Artillería (datos de fuego)

---

**Fecha**: 14 de Noviembre de 2025
**Versión**: 3.0.0
**Estado**: ✅ Sistema ORBAT funcionando, listo para testing
