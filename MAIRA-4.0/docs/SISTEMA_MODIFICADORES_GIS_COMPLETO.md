# 🎯 Sistema Completo de Modificadores GIS para Análisis Militar

## 📊 Resumen Ejecutivo

Sistema integrado que utiliza **25 capas GIS del IGN** para modificar los cálculos de análisis de terreno militar, incluyendo:
- Transitabilidad de vehículos
- Velocidad de desplazamiento
- Cobertura y ocultamiento
- Capacidad de comunicaciones
- Identificación de obstáculos

---

## 🗺️ Categorías y Modificadores

### 🛣️ 1. TRANSPORTE (6 capas)

| Capa | Modificador Transitabilidad | Velocidad | Efecto Táctico |
|------|---------------------------|-----------|----------------|
| **Rutas Nacionales** | +40% | +30 km/h | Movimiento rápido, vulnerable |
| **Rutas Provinciales** | +35% | +25 km/h | Buen movimiento |
| **Caminos** | +25% | +15 km/h | Movimiento moderado |
| **Ferrocarril** | -30% | 0 km/h | **Obstáculo** (cruce difícil) |
| **Infraestructura Vial** | +20% | 0 km/h | Puentes, pasos facilitados |
| **Cruces/Enlaces** | +15% | 0 km/h | Intersecciones mejoradas |

**Uso Militar**:
- ✅ Rutas: Ejes de avance rápido
- ❌ Rutas: Alta vulnerabilidad a emboscadas
- ⚠️ Ferrocarril: Obstáculo lineal, divide sectores

---

### 💧 2. HIDROGRAFÍA (2 capas)

| Capa | Modificador Transitabilidad | Efecto Táctico |
|------|---------------------------|----------------|
| **Cursos de Agua** | -50% | **Obstáculo Lineal** (ríos) |
| **Espejos de Agua** | -80% | **Obstáculo de Zona** (lagos, lagunas) |

**Uso Militar**:
- ❌ Obstáculos naturales críticos
- 🛡️ Líneas defensivas naturales
- 🌉 Puntos críticos: vados, puentes

**Consideraciones**:
- Ríos anchos (>50m): Requieren equipo anfibio o puentes
- Lagos: Requieren rodeo completo
- Estacionalidad: Nivel variable según época

---

### 🏙️ 3. ÁREAS URBANAS (1 capa)

| Capa | Cobertura | Ocultamiento | Velocidad | Efecto Táctico |
|------|----------|--------------|-----------|----------------|
| **Localidades** | +15% | +20% | -10 km/h | Combate urbano |

**Uso Militar**:
- 🏘️ Cobertura contra fuego directo
- 👁️ Ocultamiento para movimiento
- ⚠️ Reducción de velocidad
- 🎯 Objetivos estratégicos (población, infraestructura)

**Consideraciones**:
- Combate urbano: Requiere tácticas especiales
- Control de población civil
- Infraestructura crítica (hospitales, servicios)

---

### 📡 4. COMUNICACIONES (2 capas)

| Capa | Capacidad Comunicaciones | Efecto Táctico |
|------|------------------------|----------------|
| **Torres Comunicación** | +30% | **Objetivo Estratégico** |
| **Nodos Comunicación** | +20% | Punto crítico |

**Uso Militar**:
- 📶 Capacidad de comando y control
- 🎯 Objetivos de alto valor
- 🛡️ Puntos a defender/atacar
- 📡 Cobertura de área extendida

**Consideraciones**:
- Torres: Posiciones elevadas, visibles
- Nodos: Infraestructura crítica
- Vulnerabilidad: Sabotaje, fuego artillería

---

### 🏜️ 5. SUELOS Y EDAFOLOGÍA (7 capas)

| Capa | Modificador | Velocidad | Efecto Táctico |
|------|------------|-----------|----------------|
| **Cumbre Rocosa** | -60% | - | **Obstáculo Severo** |
| **Barrial** | -45% | -25 km/h | Terreno blando |
| **Arenal** | -40% | -20 km/h | Hundimiento vehículos |
| **Afloramiento Rocoso** | -35% | - | Terreno muy difícil |
| **Pedregal** | -30% | - | Dañino para vehículos |
| **Sedimento Fluvial** | -25% | - | Terreno inestable |
| **Salina** | -20% | - | Terreno frágil |

**Uso Militar**:
- ❌ **Zonas de evasión**: Evitar en movimientos rápidos
- 🛡️ **Flancos naturales**: Protección en defensa
- 🚜 **Necesidad de vehículos especiales**: Oruga vs rueda
- ⏱️ **Ralentización crítica**: Planificar tiempos extra

**Consideraciones Críticas**:
- **Barrial**: Intransitable después de lluvias
- **Arenal**: Requiere vehículos todo terreno
- **Cumbre Rocosa**: Solo infantería ligera
- **Salina**: Frágil bajo peso de vehículos

---

### 🌳 6. VEGETACIÓN (6 capas)

| Capa | Modificador | Cobertura | Ocultamiento | Efecto Táctico |
|------|------------|----------|--------------|----------------|
| **Bosque Nativo 1** | -45% | +35% | - | Cobertura densa |
| **Bosque Tipo 3** | -40% | +30% | - | Cobertura moderada |
| **Bosque Nativo 2** | -40% | +30% | - | Cobertura moderada |
| **Veg. Hidrófila** | -35% | - | +25% | Ocultamiento |
| **Veg. Arbustiva** | -25% | - | +20% | Ocultamiento |
| **Cultivo Arbóreo** | -15% | - | - | Impedimento menor |

**Uso Militar**:
- 🌲 **Bosques**: Cobertura contra observación aérea
- 🌿 **Vegetación Arbustiva**: Ocultamiento infantería
- 🚜 **Cultivos**: Impedimento menor, estacional
- ⚠️ **Reducción transitabilidad**: Movimiento lento

**Consideraciones Tácticas**:
- **Bosque Denso**: 
  - ✅ Protección contra observación
  - ✅ Protección contra fuego directo
  - ❌ Dificulta maniobra de vehículos
  - ❌ Reduce campo de tiro
- **Vegetación Hidrófila**: Indica terreno húmedo
- **Estacionalidad**: Varía según época del año

---

### ⛰️ 7. GEOMORFOLOGÍA (1 capa)

| Capa | Modificador | Efecto Táctico |
|------|------------|----------------|
| **Líneas Geomorfológicas** | -20% | Fallas, escarpes, cambios bruscos |

**Uso Militar**:
- 🏔️ **Escarpes**: Obstáculos verticales
- 📐 **Fallas geológicas**: Terreno irregular
- 🛡️ **Posiciones defensivas**: Aprovechamiento de desniveles
- ⚠️ **Impedimento movimiento**: Rodeos necesarios

---

## 🎮 Cálculo de Transitabilidad Final

### Fórmula Base
```javascript
Transitabilidad Base = Factor Pendiente × Factor Vegetación NDVI
```

### Aplicación de Modificadores GIS
```javascript
Transitabilidad Final = Transitabilidad Base + Σ(Modificadores GIS)

Donde:
- Modificadores Positivos: Rutas, caminos, infraestructura
- Modificadores Negativos: Ríos, suelos difíciles, vegetación densa
- Factor Final: [0.0 - 1.0]
```

### Clasificación Final
| Rango | Clasificación | Color | Descripción Militar |
|-------|--------------|-------|---------------------|
| 0.7 - 1.0 | **Transitable** | 🟢 Verde | Movimiento normal, todos los vehículos |
| 0.4 - 0.7 | **Difícil** | 🟡 Amarillo | Reducción velocidad 50%, solo vehículos TT |
| 0.2 - 0.4 | **Muy Difícil** | 🟠 Naranja | Reducción 75%, solo infantería/oruga |
| 0.0 - 0.2 | **Obstáculo** | 🔴 Rojo | Intransitable, requiere equipamiento especial |

---

## 📈 Ejemplo de Cálculo Completo

### Escenario: Punto de análisis en zona rural

**Datos Base**:
- Pendiente: 8° → Factor Pendiente = 0.8
- NDVI: 0.3 → Factor Vegetación = 0.8
- **Transitabilidad Base**: 0.8 × 0.8 = **0.64** (Difícil)

**Capas GIS Detectadas**:
1. ✅ **Camino**: +25% → +0.25
2. ❌ **Vegetación Arbustiva**: -25% → -0.25
3. ❌ **Pedregal**: -30% → -0.30

**Cálculo Final**:
```
Transitabilidad = 0.64 + 0.25 - 0.25 - 0.30
Transitabilidad = 0.34 (Difícil)
```

**Resultado Militar**:
- 🟡 **Clasificación**: Difícil
- 🚗 **Vehículos**: Solo todo terreno
- ⏱️ **Velocidad**: 50% normal
- 📋 **Recomendación**: Usar camino pero prever dificultades

---

## 🎯 Aplicaciones Militares

### 1. Planeamiento de Movimientos
```javascript
// Ejemplo: Calcular ruta óptima
const ruta = calcularRutaOptima(origen, destino, capasGIS);
// Considera: rutas, obstáculos, terreno difícil
```

**Output**:
- ⏱️ Tiempo estimado de movimiento
- 🚗 Tipo de vehículos necesarios
- ⚠️ Puntos críticos/obstáculos
- 🛣️ Rutas alternativas

### 2. Análisis de Avenidas de Aproximación
```javascript
// Evaluar corredor de movimiento
const avenida = analizarAvenida(poligono, capasGIS);
```

**Factores Evaluados**:
- Ancho transitable
- Obstáculos naturales (ríos, vegetación)
- Cobertura disponible
- Vulnerabilidades (rutas expuestas)

### 3. Selección de Posiciones
```javascript
// Encontrar mejores posiciones defensivas
const posiciones = seleccionarPosicionesDefensivas(area, capasGIS);
```

**Criterios**:
- ✅ Cobertura (vegetación, urbano)
- ✅ Campos de tiro despejados
- ✅ Obstáculos frontales (ríos, terreno difícil)
- ✅ Rutas de repliegue

### 4. Evaluación de Objetivos
```javascript
// Priorizar objetivos estratégicos
const objetivos = evaluarObjetivos(zona, capasGIS);
```

**Elementos Estratégicos**:
- 📡 Torres de comunicaciones
- 🏙️ Centros urbanos
- 🌉 Puentes/infraestructura crítica
- 🛣️ Nudos de comunicaciones

---

## 🔧 Implementación Técnica

### Estructura de Datos
```javascript
this.capasGIS = {
    transporte: LayerGroup,      // 6 capas
    hidrografia: LayerGroup,     // 2 capas
    areas_urbanas: LayerGroup,   // 1 capa
    comunicaciones: LayerGroup,  // 2 capas
    suelos: LayerGroup,          // 7 capas
    vegetacion: LayerGroup,      // 6 capas
    geomorfologia: LayerGroup    // 1 capa
}
```

### Método Principal
```javascript
aplicarModificadoresGIS(punto, transitabilidadBase) {
    // 1. Verificar cada categoría
    // 2. Detectar geometrías cercanas/contenedoras
    // 3. Aplicar modificadores correspondientes
    // 4. Retornar factor final + metadata
    
    return {
        factor: 0.45,
        clasificacion: 'Difícil',
        modificadores: {
            transporte: ['Camino (+25%)'],
            suelos: ['Arenal (-40%)'],
            vegetacion: ['Bosque (-40%)']
        }
    }
}
```

---

## 📊 Performance

### Optimizaciones Implementadas
- ✅ **Buffer de proximidad ajustado por tipo**:
  - Rutas: 50m (0.0005°)
  - Ríos: 20m (0.0002°)
  - Torres: 500m (0.005°)
  
- ✅ **Early termination**: Sale apenas encuentra modificador
- ✅ **Verificación solo capas activas**
- ✅ **GeoJSON optimizado** con simplificación Douglas-Peucker

### Métricas Esperadas
- ⏱️ Tiempo por punto: <5ms
- 📊 Análisis 100x100 grid: ~1-2 segundos
- 💾 Memoria: ~50-100 MB (25 capas cargadas)

---

## 🚀 Próximas Mejoras

### Fase 2: Análisis Avanzado
- [ ] **Matriz de visibilidad**: Cobertura desde posiciones
- [ ] **Cálculo de campos de tiro**: Zonas batidas
- [ ] **Análisis de observación**: Áreas observables
- [ ] **Red de comunicaciones**: Cobertura radial

### Fase 3: Integración Dinámica
- [ ] **Condiciones meteorológicas**: Modificadores por clima
- [ ] **Hora del día**: Iluminación, sombras
- [ ] **Estacionalidad**: Vegetación variable
- [ ] **Daños de combate**: Obstáculos creados

---

## 📚 Referencias

- Manual de Campaña MC 3-21-50 (Estudio del Terreno)
- FM 5-33 (Terrain Analysis)
- IGN Argentina - Capas Vectoriales
- Doctrina de Análisis de Terreno (DO 90-3)

---

**Última actualización**: 14 de noviembre de 2025
**Versión**: 2.0 - Sistema Completo 25 Capas
