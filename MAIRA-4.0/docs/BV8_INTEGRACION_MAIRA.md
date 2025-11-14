# 🎯 PLAN DE INTEGRACIÓN BV8 → MAIRA

**Fecha**: 13 noviembre 2025  
**Objetivo**: Integrar datos extraídos de BV8 a MAIRA siguiendo cadena de Cuadros de Organización

---

## 📊 ESTADO ACTUAL

### ✅ Datos Disponibles

| Archivo | Estado | Tamaño | Registros | Validado | Prioridad |
|---------|--------|--------|-----------|----------|-----------|
| **tipos_vehiculos.json** | ✅ COMPLETO | 18KB | 10 vehículos | ✅ Sí | ⭐⭐⭐ |
| **cajones.json** | ✅ COMPLETO | 5.5KB | 46 cajones | ✅ Sí | ⭐⭐⭐ |
| **estimacion_bajas_arbol.json** | ✅ COMPLETO | 1KB | 12 ratios | ✅ Sí | ⭐⭐⭐ |
| **roles_personal.json** | ⚠️ DRAFT | 11KB | 15 roles | ❌ No validado | ⭐⭐ |
| **terreno_tipos_suelo.json** | ✅ COMPLETO | 997B | 8 tipos | ✅ Sí | ⭐⭐ |
| **relacion_cajon_efecto.json** | ✅ COMPLETO | 1.7KB | 22 relaciones | ✅ Sí | ⭐ |

### ❌ Datos Faltantes

| Dato | Fuente Potencial | Prioridad | Dificultad | Impacto |
|------|------------------|-----------|------------|---------|
| **Armamento completo** | Smalltalk + cajones | ⭐⭐⭐ | Media | ALTO |
| **Terreno→Movilidad** | Terreno.img + XMLs | ⭐⭐ | Media | MEDIO |
| **Dotaciones dinámicas** | BD MySQL (vacía) | ⭐ | Alta | BAJO |
| **Ingenieros tiempos** | Ingenieros.img (encriptado) | ⭐⭐⭐ | ALTA | ALTO |
| **Cadena CO completa** | CCOO.img + manual | ⭐⭐ | Media | MEDIO |

---

## 🏗️ ARQUITECTURA DE DATOS

### Opción A: **JSON Locales** (RECOMENDADO FASE 1)

**Ventajas**:
- ✅ Rápido de implementar
- ✅ No requiere migraciones DB
- ✅ Fácil versionado (Git)
- ✅ Portable entre entornos

**Desventajas**:
- ❌ Sin validación de integridad
- ❌ Difícil actualizar dinámicamente
- ❌ No escala para datos masivos

**Ubicación**:
```
Server/data/catalogos_bv8/
├── armamento.json         ← NUEVO
├── terreno_movilidad.json ← NUEVO
├── tipos_vehiculos.json   ← EXISTENTE
├── roles_personal.json    ← VALIDAR
├── cajones.json           ← COPIAR desde tools/
├── bajas_ratios.json      ← COPIAR desde tools/
└── relacion_cajon_efecto.json
```

### Opción B: **PostgreSQL** (FASE 2 - Largo plazo)

**Ventajas**:
- ✅ Integridad referencial
- ✅ Queries complejas eficientes
- ✅ Actualización dinámica
- ✅ Escalabilidad

**Desventajas**:
- ❌ Requiere migraciones
- ❌ Más complejo mantener
- ❌ Dependencia de DB

**Schema Propuesto**:
```sql
-- Tablas principales
CREATE TABLE vehiculos (
    id SERIAL PRIMARY KEY,
    bd_id VARCHAR(50) UNIQUE,
    nombre VARCHAR(255),
    tipo VARCHAR(100),
    sidc_base VARCHAR(20),
    blindaje_frontal INT,
    velocidad_max INT,
    autonomia INT,
    consumo_km DECIMAL(5,2),
    capacidad_combustible INT,
    tripulacion INT,
    pasajeros INT DEFAULT 0,
    caracteristicas JSONB
);

CREATE TABLE armamento (
    id SERIAL PRIMARY KEY,
    bd_id INT,
    nombre VARCHAR(255),
    calibre DECIMAL(5,2),
    alcance_max INT,
    alcance_efectivo INT,
    cadencia INT,
    danio_personal INT,
    danio_blindado INT,
    tipo_municion VARCHAR(100),
    categoria VARCHAR(50) -- personal, blindado, aereo
);

CREATE TABLE roles_personal (
    id SERIAL PRIMARY KEY,
    rol VARCHAR(100) UNIQUE,
    grado_tipico VARCHAR(50),
    armamento_principal_id INT REFERENCES armamento(id),
    armamento_secundario_id INT REFERENCES armamento(id),
    municion_principal INT,
    municion_secundaria INT,
    es_comandante BOOLEAN DEFAULT FALSE,
    es_conductor BOOLEAN DEFAULT FALSE,
    dotacion_diaria JSONB
);

CREATE TABLE vehiculo_armamento (
    vehiculo_id INT REFERENCES vehiculos(id),
    armamento_id INT REFERENCES armamento(id),
    tipo VARCHAR(20), -- 'principal', 'secundario'
    capacidad_municion INT,
    PRIMARY KEY (vehiculo_id, armamento_id, tipo)
);

CREATE TABLE terreno_movilidad (
    id SERIAL PRIMARY KEY,
    tipo_terreno VARCHAR(100),
    tipo_vehiculo VARCHAR(100),
    pendiente_categoria VARCHAR(20), -- 'plano', 'suave', 'moderada', 'alta'
    vegetacion VARCHAR(50),
    factor_velocidad DECIMAL(3,2), -- 1.0 = normal, 0.5 = mitad velocidad
    transitable BOOLEAN DEFAULT TRUE
);

CREATE TABLE cajones (
    id SERIAL PRIMARY KEY,
    bd_id INT UNIQUE,
    nombre VARCHAR(255),
    volumen DECIMAL(10,4), -- m³
    peso DECIMAL(10,2),    -- kg
    descripcion TEXT
);
```

### Opción C: **Híbrida** (RECOMENDADO)

**Estrategia**:
1. **JSONs**: Datos estáticos (vehículos, armamento, ratios bajas)
2. **PostgreSQL**: Datos dinámicos (dotaciones, efectivos, estado unidades)
3. **Server API**: Cálculos complejos (bajas, movilidad)

---

## 🔗 CADENA DE CUADROS DE ORGANIZACIÓN

### Nivel 1: **Personal Individual**

**Estructura**:
```json
{
  "rol": "tirador_fal",
  "grado": "soldado",
  "armamento_principal": {
    "tipo": "FAL 7.62mm",
    "alcance_efectivo": 400,
    "alcance_max": 800,
    "danio_personal": 45,
    "danio_blindado": 5,
    "cadencia": 650,
    "municion_inicial": 100,
    "municion_tipo": "municion_762"
  },
  "dotacion_individual": {
    "agua_litros": 3.5,
    "raciones": 3,
    "municion_762": 100
  }
}
```

**Armamento a Mapear**:

| Arma | Calibre | Alcance Efectivo | Alcance Máx | Daño Personal | Daño Blindado | Cadencia | Munición |
|------|---------|------------------|-------------|---------------|---------------|----------|----------|
| **FAL 7.62mm** | 7.62 | 400m | 800m | 45 | 5 | 650 rpm | municion_762 |
| **FAL PARA 5.56mm** | 5.56 | 300m | 550m | 35 | 3 | 700 rpm | municion_556 |
| **MAG 7.62mm** | 7.62 | 800m | 1800m | 50 | 8 | 850 rpm | municion_762 |
| **Pistola 9mm** | 9 | 25m | 50m | 20 | 0 | - | municion_9mm |
| **LAW 88.9mm** | 88.9 | 200m | 1000m | 10 | 95 | 1 disparo | cohetes_889 |
| **Mortero 60mm** | 60 | 70m | 1800m | 70 | 20 | 18 rpm | proy_60mm |
| **Mortero 81mm** | 81 | 100m | 4500m | 85 | 30 | 15 rpm | proy_81mm |
| **Mortero 120mm** | 120 | 500m | 7200m | 95 | 45 | 6 rpm | proy_120mm |
| **Cañón TAM 105mm** | 105 | 300m | 4000m | 30 | 98 | 6 rpm | proyectil_105mm |
| **Cañón VCTP 20mm** | 20 | 1000m | 2000m | 60 | 25 | 1000 rpm | municion_20mm |
| **M2 12.7mm** | 12.7 | 1500m | 2000m | 70 | 15 | 550 rpm | municion_127 |
| **Obús 155mm** | 155 | 1km | 30km | 98 | 80 | 4 rpm | proyectil_155mm |

**Fuentes**:
- Alcances: Manuales técnicos argentinos + BV8 Smalltalk
- Daño: Estimado según calibre y tipo proyectil
- Cadencia: Estándares fabricante

### Nivel 2: **Equipo de Fuego** (3-4 pers)

**Composición**:
- 1x Jefe de Equipo (Cabo)
- 2x Tiradores FAL
- 1x Ametrallador MAG + Auxiliar

**Cálculos**:
```javascript
{
  "efectivos": 4,
  "armamento": {
    "FAL_762": 3,
    "MAG_762": 1
  },
  "municion_total": {
    "municion_762": 900, // 3*100 (FAL) + 600 (MAG)
  },
  "dotacion_diaria": {
    "agua_litros": 14,  // 4 * 3.5
    "raciones": 12       // 4 * 3
  },
  "capacidad_combate": {
    "alcance_efectivo_max": 800,  // MAG
    "danio_combinado_personal": 195, // 3*45 + 50
    "volumen_fuego_rpm": 2800 // 3*650 + 850
  }
}
```

### Nivel 3: **Grupo de Combate** (8 pers)

**Composición**:
- 2x Equipos de Fuego (4 cada uno)

### Nivel 4: **Sección** (27 pers)

**Composición**:
- 1x Jefe de Sección (Subteniente)
- 3x Grupos de Combate (8 cada uno)
- 1x Equipo de Comando (3 pers)

### Nivel 5: **Pelotón** (~40 pers)

**Composición**:
- 1x Jefe de Pelotón (Teniente)
- 3x Secciones (27 cada una)
- 1x Sección de Apoyo (morteros, AT)

### Nivel 6: **Compañía** (120 pers)

**Composición**:
- 1x Jefe de Compañía (Capitán)
- 3x Pelotones (40 cada uno)
- 1x Pelotón de Apoyo
- 1x Plana Mayor

### Nivel 7: **Batallón** (600+ pers)

**Composición**:
- 1x Jefe de Batallón (Teniente Coronel)
- 3-4x Compañías (120 cada una)
- 1x Compañía de Apoyo de Fuego
- 1x Compañía Logística
- 1x Plana Mayor

---

## 🎮 MÓDULO: Calculadora de Bajas (Standalone)

### Diseño HTML

**Ubicación**: `Client/modules/calculadora_bajas/index.html`

**Inputs**:
```html
<form id="calculadora-bajas">
  <label>Efectivos Iniciales</label>
  <input type="number" id="efectivos" value="100" min="1" max="10000">
  
  <label>Intensidad Combate (%)</label>
  <input type="range" id="intensidad" min="1" max="100" value="20">
  <span id="intensidad-valor">20%</span>
  
  <label>Tipo Combate</label>
  <select id="tipo-combate">
    <option value="defensivo">Defensivo</option>
    <option value="ofensivo">Ofensivo</option>
    <option value="encuentro">Encuentro</option>
  </select>
  
  <label>Apoyo de Fuego</label>
  <select id="apoyo-fuego">
    <option value="ninguno">Ninguno</option>
    <option value="artilleria">Artillería</option>
    <option value="aereo">Aéreo</option>
    <option value="ambos">Ambos</option>
  </select>
  
  <button type="submit">Calcular Bajas</button>
</form>
```

**Outputs**:
```html
<div id="resultados-bajas">
  <h3>Total Bajas: <span id="total-bajas">18</span></h3>
  
  <div class="categoria-bajas">
    <h4>Bajas de Combate (90%): <span id="bajas-combate">16</span></h4>
    <ul>
      <li>Muertos (20%): <span id="muertos-combate">3</span></li>
      <li>Heridos (70%): <span id="heridos-combate">11</span>
        <ul>
          <li>Evacuación >72h (60%): <span id="heridos-graves">7</span></li>
          <li>Evacuación <72h (40%): <span id="heridos-leves">4</span></li>
        </ul>
      </li>
      <li>Desaparecidos (10%): <span id="desaparecidos">2</span></li>
    </ul>
  </div>
  
  <div class="categoria-bajas">
    <h4>Bajas No Combate (10%): <span id="bajas-no-combate">2</span></h4>
    <ul>
      <li>Heridos (90%): <span id="heridos-no-combate">2</span></li>
      <li>Muertos (10%): <span id="muertos-no-combate">0</span></li>
    </ul>
  </div>
  
  <div class="otros">
    <h4>Otros</h4>
    <ul>
      <li>Prisioneros (5%): <span id="prisioneros">1</span></li>
      <li>Prófugos (20%): <span id="profugos">4</span></li>
    </ul>
  </div>
  
  <h3>Efectivos Resultantes: <span id="efectivos-finales">82</span></h3>
</div>
```

**Lógica JavaScript**:
```javascript
// Cargar ratios desde BV8
const ratiosBV8 = {
  bajasCombate: 0.9,
  bajasNoCombate: 0.1,
  muertosCombate: 0.2,
  heridosCombate: 0.7,
  desaparecidosCombate: 0.1,
  heridos72Plus: 0.6,
  heridos72Minus: 0.4,
  heridosNoCombate: 0.9,
  muertosNoCombate: 0.1,
  prisioneros: 0.05,
  profugos: 0.2
};

// Modificadores por tipo de combate
const modificadores = {
  defensivo: 0.7,    // 30% menos bajas
  ofensivo: 1.3,     // 30% más bajas
  encuentro: 1.0     // Normal
};

// Modificadores por apoyo de fuego
const apoyoModificadores = {
  ninguno: 1.0,
  artilleria: 1.2,   // 20% más bajas al enemigo
  aereo: 1.3,
  ambos: 1.5
};

function calcularBajas(efectivos, intensidad, tipoCombate, apoyoFuego) {
  // Calcular bajas base
  const factorIntensidad = intensidad / 100;
  const modificadorCombate = modificadores[tipoCombate];
  const modificadorApoyo = apoyoModificadores[apoyoFuego];
  
  const totalBajasBase = efectivos * factorIntensidad * modificadorCombate * modificadorApoyo;
  
  // Aplicar ratios BV8
  const bajasCombate = totalBajasBase * ratiosBV8.bajasCombate;
  const muertosCombate = Math.round(bajasCombate * ratiosBV8.muertosCombate);
  const heridosCombate = Math.round(bajasCombate * ratiosBV8.heridosCombate);
  const desaparecidos = Math.round(bajasCombate * ratiosBV8.desaparecidosCombate);
  
  const heridosGraves = Math.round(heridosCombate * ratiosBV8.heridos72Plus);
  const heridosLeves = Math.round(heridosCombate * ratiosBV8.heridos72Minus);
  
  const bajasNoCombate = totalBajasBase * ratiosBV8.bajasNoCombate;
  const heridosNoCombate = Math.round(bajasNoCombate * ratiosBV8.heridosNoCombate);
  const muertosNoCombate = Math.round(bajasNoCombate * ratiosBV8.muertosNoCombate);
  
  const prisioneros = Math.round(totalBajasBase * ratiosBV8.prisioneros);
  const profugos = Math.round(totalBajasBase * ratiosBV8.profugos);
  
  const totalBajas = Math.round(totalBajasBase);
  const efectivosFinales = efectivos - totalBajas;
  
  return {
    totalBajas,
    bajasCombate: Math.round(bajasCombate),
    muertosCombate,
    heridosCombate,
    heridosGraves,
    heridosLeves,
    desaparecidos,
    bajasNoCombate: Math.round(bajasNoCombate),
    heridosNoCombate,
    muertosNoCombate,
    prisioneros,
    profugos,
    efectivosFinales
  };
}
```

---

## 🗺️ SISTEMA: Terreno → Movilidad

### Matriz de Transitabilidad

**Archivo**: `Server/data/catalogos_bv8/terreno_movilidad.json`

**Estructura**:
```json
{
  "version": "1.0.0",
  "source": "BV8 Estudio del Terreno + análisis Smalltalk",
  
  "factores": {
    "pendiente": {
      "plano": { "grados": "0-5°", "factor_base": 1.0 },
      "suave": { "grados": "5-15°", "factor_base": 0.8 },
      "moderada": { "grados": "15-30°", "factor_base": 0.5 },
      "alta": { "grados": "30-45°", "factor_base": 0.2 },
      "muy_alta": { "grados": ">45°", "factor_base": 0.0 }
    },
    
    "vegetacion": {
      "ninguna": { "factor": 1.0 },
      "dispersa": { "factor": 0.9 },
      "moderada": { "factor": 0.7 },
      "densa": { "factor": 0.5 },
      "muy_densa": { "factor": 0.2 }
    },
    
    "clima": {
      "seco": { "factor": 1.0 },
      "lluvioso": { "factor": 0.7 },
      "nieve": { "factor": 0.4 },
      "barro": { "factor": 0.3 }
    }
  },
  
  "transitabilidad": [
    {
      "tipo_terreno": "Intransitable",
      "vehiculos": {
        "tam_tanque": { "transitable": false, "factor": 0.0 },
        "vctp_tam": { "transitable": false, "factor": 0.0 },
        "m113": { "transitable": false, "factor": 0.0 },
        "vlega": { "transitable": false, "factor": 0.0 },
        "unimog": { "transitable": false, "factor": 0.0 }
      }
    },
    {
      "tipo_terreno": "Barrial",
      "vehiculos": {
        "tam_tanque": { "transitable": true, "factor": 0.6 },
        "vctp_tam": { "transitable": true, "factor": 0.5 },
        "m113": { "transitable": true, "factor": 0.5 },
        "vlega": { "transitable": false, "factor": 0.0 },
        "unimog": { "transitable": true, "factor": 0.3 }
      }
    },
    {
      "tipo_terreno": "Arenal",
      "vehiculos": {
        "tam_tanque": { "transitable": true, "factor": 0.7 },
        "vctp_tam": { "transitable": true, "factor": 0.6 },
        "m113": { "transitable": true, "factor": 0.6 },
        "vlega": { "transitable": true, "factor": 0.4 },
        "unimog": { "transitable": true, "factor": 0.5 }
      }
    },
    {
      "tipo_terreno": "Pedregal",
      "vehiculos": {
        "tam_tanque": { "transitable": true, "factor": 0.5 },
        "vctp_tam": { "transitable": true, "factor": 0.4 },
        "m113": { "transitable": true, "factor": 0.4 },
        "vlega": { "transitable": true, "factor": 0.6 },
        "unimog": { "transitable": true, "factor": 0.5 }
      }
    },
    {
      "tipo_terreno": "Escorial",
      "vehiculos": {
        "tam_tanque": { "transitable": true, "factor": 0.4 },
        "vctp_tam": { "transitable": true, "factor": 0.3 },
        "m113": { "transitable": true, "factor": 0.3 },
        "vlega": { "transitable": false, "factor": 0.0 },
        "unimog": { "transitable": true, "factor": 0.2 }
      }
    }
  ]
}
```

**Cálculo de Velocidad**:
```javascript
function calcularVelocidadReal(vehiculo, terreno, pendiente, vegetacion, clima) {
  // Velocidad base del vehículo
  const velocidadBase = vehiculo.velocidad_max; // ej: TAM = 75 km/h
  
  // Factor terreno
  const factorTerreno = obtenerFactorTerreno(vehiculo.id, terreno.tipo);
  if (!factorTerreno.transitable) return 0;
  
  // Factor pendiente
  const factorPendiente = obtenerFactorPendiente(pendiente);
  
  // Factor vegetación
  const factorVegetacion = obtenerFactorVegetacion(vegetacion);
  
  // Factor clima
  const factorClima = obtenerFactorClima(clima);
  
  // Velocidad final
  const velocidadFinal = velocidadBase * 
                         factorTerreno.factor * 
                         factorPendiente * 
                         factorVegetacion * 
                         factorClima;
  
  return Math.max(5, velocidadFinal); // Mínimo 5 km/h si transitable
}

// Ejemplo:
// TAM en arenal, pendiente suave, vegetación dispersa, clima seco
// 75 * 0.7 * 0.8 * 0.9 * 1.0 = 37.8 km/h
```

---

## 🚧 INGENIEROS: Datos Críticos Faltantes

### Necesario para JDG

**Órdenes a Implementar**:
1. **Instalar Campo Minado**
   - Tiempo: ¿? min por 100m lineales
   - Cantidad minas: ¿? unidades por 100m
   - Personal necesario: ¿? ingenieros
   
2. **Zanja Antitanque**
   - Tiempo excavación: ¿? horas por 100m
   - Profundidad: 2-3m
   - Ancho: 3-4m
   - Equipamiento: excavadora (¿tiempo?)
   
3. **Obstáculos**
   - Alambre de púas: ¿? min por 100m
   - Caballos de Frisia: ¿? unidades, ¿tiempo?
   - Erizos checos: ¿? tiempo instalación

**Fuentes Alternativas** (si no se desencripta):
- Manuales argentinos de Ingenieros
- FM 3-34 (US Army Engineering)
- Estimaciones basadas en estándares OTAN

---

## 📋 ROADMAP DE INTEGRACIÓN

### FASE 1: Fundamentos (1 semana)

**Objetivo**: Datos estáticos listos

- [x] Auditar datos BV8 vs MAIRA
- [ ] Crear `armamento.json` completo
- [ ] Crear `terreno_movilidad.json`
- [ ] Validar `roles_personal.json`
- [ ] Copiar JSONs BV8 a `Server/data/catalogos_bv8/`
- [ ] Documentar estructura en README.md

**Entregable**: Todos los JSONs validados y documentados

### FASE 2: Calculadora de Bajas (3 días)

**Objetivo**: Módulo standalone funcionando

- [ ] HTML `calculadora_bajas/index.html`
- [ ] CSS responsive
- [ ] JS con ratios BV8
- [ ] Gráficos de resultados (Chart.js)
- [ ] Exportar PDF de resultados
- [ ] Tests unitarios

**Entregable**: Calculadora accesible como PCR

### FASE 3: Cadena CO (1 semana)

**Objetivo**: Personal → Escuadra → Grupo → Sección

- [ ] Definir estructura jerárquica
- [ ] Cálculos agregados (munición, dotación)
- [ ] Capacidad de combate por nivel
- [ ] Visualización en MAIRA

**Entregable**: CCOO completos en MAIRA

### FASE 4: Integración JDG (2 semanas)

**Objetivo**: Combates usan datos BV8

- [ ] Conectar calculadora_bajas a JDG
- [ ] Actualizar efectivos post-combate
- [ ] Sistema de armamento con alcances
- [ ] Terreno afecta movilidad
- [ ] Consumo combustible/munición

**Entregable**: JDG realista con BV8

### FASE 5: Ingenieros (SI se desencripta)

**Objetivo**: Órdenes de ingenieros funcionales

- [ ] Desencriptar Ingenieros.img
- [ ] Extraer tiempos de trabajo
- [ ] Crear órdenes JDG
- [ ] Visualización en mapa

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **CREAR armamento.json** ← EN CURSO
2. Crear terreno_movilidad.json
3. Validar roles_personal.json
4. Copiar JSONs a catalogos_bv8/
5. Crear calculadora_bajas.html

**¿Por dónde empezamos?**
