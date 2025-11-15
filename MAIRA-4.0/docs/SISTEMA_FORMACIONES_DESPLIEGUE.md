# 🎖️ SISTEMA DE FORMACIONES DE DESPLIEGUE + VISUALIZACIÓN LOS

**Fecha**: 15 Noviembre 2025
**Estado**: ✅ Implementado y funcional
**Commit**: `45698ca0`

---

## 📋 Resumen Ejecutivo

Sistema completo de formaciones tácticas doctrinales para despliegue de subordinados, con selección de dirección de avance y visualización de línea de vista (LOS).

### Características Principales

- ✅ **5 formaciones tácticas** basadas en doctrina militar argentina
- ✅ **Selección de dirección** mediante 2 clicks con visualización de flecha
- ✅ **Visualización LOS** para unidades de combate
- ✅ **Rotación automática** de formaciones según dirección marcada
- ✅ **Menú contextual doctrinal** integrado en todas las armas

---

## 🎖️ Formaciones Implementadas

### 1. En Línea (Formación 213)

**Descripción**: Despliegue horizontal perpendicular a la dirección de avance
- 1 en el centro
- 2 a la izquierda
- 3 a la derecha

**Caso de uso**:
- Ataque en frente amplio
- Defensa estática
- Máxima capacidad de fuego frontal

**Configuración BAC** (Subunidades):
- Puesto Comando: izquierda del #1
- Logística: detrás del PC

**Código SIDC**: Aplicable a todas las armas de maniobra

```
Ejemplo con 3 subordinados (desde arriba):
        dirección ↓

    2     1     3

      Comandante
```

---

### 2. En Columna

**Descripción**: Despliegue vertical en la dirección de avance (uno detrás del otro)

**Caso de uso**:
- Marcha por caminos estrechos
- Movimiento en terreno boscoso
- Mínima exposición lateral

**Configuración BAC**:
- PC y LOG integrados en la columna

```
Ejemplo con 3 subordinados:
      Comandante

           1
           ↓
           2
           ↓
           3
```

---

### 3. Cuña

**Descripción**: Formación en V con punta hacia dirección de avance
- 1 subordinado adelante
- Resto formando V hacia atrás

**Lógica según cantidad**:
- **1 subordinado**: En línea con comandante
- **2 subordinados**: Línea perpendicular
- **3 subordinados**: 1 adelante, 2-3 atrás formando V
- **4+ subordinados**: 1 adelante, resto en V (patrón 2134 si son 4)

**Caso de uso**:
- Ataque con flexibilidad lateral
- Reconocimiento en fuerza
- Terreno abierto con amenaza indefinida

**Configuración BAC**:
- PC: centro de la cuña (detrás del #1, entre el 2 y 3)
- LOG: detrás del PC en medio

```
Ejemplo con 4 subordinados:
           1
         ↙   ↘
        2     3

           4
         (PC)
        (LOG)
```

---

### 4. Cuña Invertida

**Descripción**: V invertida (raramente usada)
- Elementos adelante formando V abierta
- Elementos atrás cerrando la formación

**Caso de uso**:
- Defensa móvil con flancos protegidos
- Repliegue táctico
- Situaciones especiales

**Configuración BAC**:
- PC y LOG siguen detrás del #1

```
Ejemplo con 4 subordinados:
      1       2
        ↘   ↙
          X
        ↗   ↖
      3       4
         (PC)
```

---

### 5. Zona de Reunión

**Descripción**: Distribución circular alrededor del comandante
- Subordinados en círculo equidistante
- Radio configurable (100m + distancia entre subordinados)

**Caso de uso**:
- Descanso/Reorganización
- Defensa perimetral
- Posición de espera antes de operación

**Configuración BAC**:
- PC: Centro del círculo (comandante)
- LOG: Centro del círculo junto al PC

```
Ejemplo con 4 subordinados:
         1

    4    PC    2

         3
```

---

## 📐 Sistema de Dirección de Avance

### Funcionamiento

1. **Usuario selecciona formación**: Click en submenu "Desplegar" → Formación
2. **Solicitud de dirección**: Mensaje en pantalla "Haz click en dos puntos..."
3. **Primer click**: Usuario marca punto en el mapa
4. **Visualización inmediata**:
   - Se dibuja línea verde punteada desde unidad hasta punto
   - Flecha verde al final mostrando dirección
   - Se calcula bearing (0-360°)
5. **Timeout**: 30 segundos para completar selección
6. **Despliegue**: Subordinados se despliegan según formación orientada

### Cálculo de Bearing

```javascript
calcularAngulo(p1, p2) {
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const angulo = Math.atan2(y, x) * 180 / Math.PI;

    // Normalizar a 0-360°
    return (angulo + 360) % 360;
}
```

### Visualización de Flecha

- **Plugin**: Leaflet.PolylineDecorator
- **Color**: Verde (#00ff00)
- **Estilo**: Línea punteada (dashArray: '10, 5')
- **Flecha**: 15px al final de la línea
- **Duración**: Se elimina después de 2 segundos

---

## 👁️ Visualización LOS (Line of Sight)

### Funcionalidad

- **Activación**: Click derecho en unidad → "Ver LOS"
- **Visualización**: Círculo amarillo semitransparente
- **Rango**:
  - Por defecto: 2000 metros (2 km)
  - Usa `unidad.options.stats.rangoVision` si está disponible
- **Toggle**: Click de nuevo para ocultar

### Características Actuales

- ✅ Círculo simple basado en rango
- ✅ Color amarillo (#ffff00) con 10% de opacidad
- ✅ Borde punteado para indicar que es estimación
- ✅ Mensaje informativo con rango en km

### Mejoras Futuras (TODO)

```javascript
// TODO: Implementar raycast con terreno para LOS realista
// Por ahora es un círculo simple, pero debería:
// 1. Usar datos de elevación para detectar obstáculos
// 2. Usar datos de vegetación (bosques bloquean LOS)
// 3. Usar edificios/construcciones
// 4. Crear polígono irregular según obstáculos visibles
```

**Propuesta de implementación**:
- Raycast en 360° desde unidad
- 1° de incremento = 360 rayos
- Por cada rayo: calcular distancia hasta obstáculo
- Crear polígono con puntos de intersección
- Integrar con datos de elevación existentes

---

## 🏗️ Arquitectura del Sistema

### Archivos Modificados

#### 1. MenusDoctrinales.js

**Cambios**:
- Añadido submenu `formaciones_despliegue` (líneas 528-535)
- Modificados todos los botones "Desplegar" para abrir submenu
- Añadida opción "Ver LOS" en infantería y caballería

```javascript
// Submenu de formaciones
formaciones_despliegue: [
    { title: 'En Línea', action: 'desplegarEnLinea', icon: 'fas fa-grip-lines', ... },
    { title: 'En Columna', action: 'desplegarEnColumna', icon: 'fas fa-grip-vertical', ... },
    { title: 'Cuña', action: 'desplegarEnCuna', icon: 'fas fa-caret-up', ... },
    { title: 'Cuña Invertida', action: 'desplegarCunaInvertida', icon: 'fas fa-caret-down', ... },
    { title: 'Zona Reunión', action: 'desplegarZonaReunion', icon: 'fas fa-circle-notch', ... },
    { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', ... }
]
```

#### 2. GestorOrdenesV2.js

**Nuevos métodos**:

| Método | Línea | Descripción |
|--------|-------|-------------|
| `desplegarConFormacion()` | 1249-1317 | Handler principal de despliegue con formación |
| `solicitarDireccionAvance()` | 1324-1391 | Promise para selección de dirección (2 clicks) |
| `calcularAngulo()` | 1396-1407 | Cálculo de bearing geográfico |
| `visualizarLOS()` | 1412-1463 | Toggle de visualización de línea de vista |

**Acciones registradas globalmente** (líneas 262-287):
```javascript
window.desplegarEnLinea
window.desplegarEnColumna
window.desplegarEnCuna
window.desplegarCunaInvertida
window.desplegarZonaReunion
window.verLOS
```

#### 3. ORBATManager.js

**Cambios en `calcularPosicionesDespliegue()`**:
- Nuevo parámetro: `direccionGrados = 180`
- Todas las formaciones rotadas según dirección
- Implementadas las 5 formaciones con lógica específica

**Cambios en `desplegarSubordinados()`**:
- Acepta `opciones.direccionGrados`
- Pasa dirección al calculador de posiciones
- Log de formación y dirección para debugging

---

## 🎯 Flujo de Uso

### 1. Despliegue con Formación

```
Usuario click derecho en unidad
    ↓
Menú radial se abre
    ↓
Click en "Desplegar"
    ↓
Submenu de formaciones se abre
    ↓
Usuario selecciona formación (ej: "Cuña")
    ↓
Mensaje: "Haz click en dos puntos para marcar dirección..."
    ↓
Usuario click en mapa
    ↓
Se dibuja flecha verde mostrando dirección
    ↓
Se calcula bearing (ej: 135° = SE)
    ↓
ORBATManager despliega subordinados
    ↓
Posiciones calculadas según formación + dirección
    ↓
Subordinados aparecen en mapa orientados correctamente
```

### 2. Visualización LOS

```
Usuario click derecho en unidad
    ↓
Menú radial se abre
    ↓
Click en "Ver LOS"
    ↓
Se dibuja círculo amarillo (rango de visión)
    ↓
Mensaje: "LOS visualizada (2.0 km) - Click de nuevo para ocultar"
    ↓
[Usuario puede hacer otras acciones]
    ↓
Usuario click derecho en misma unidad → "Ver LOS"
    ↓
Círculo se elimina del mapa
```

---

## 📊 Configuración de Distancias

### Valores por Defecto (ORBAT.json)

```json
{
    "configuracion": {
        "desplieguePorDefecto": {
            "formacion": "linea",
            "distanciaEntreSub": 80,        // metros entre subordinados
            "offsetDesdeComandante": 100    // metros desde comandante
        }
    }
}
```

### Distancias Tácticas Reales

| Elemento | Distancia | Justificación |
|----------|-----------|---------------|
| Entre subordinados | 80m | Evita destrucción en cadena por artillería |
| Desde comandante | 100m | Separación mínima PC del frente |
| Radio zona reunión | 180m | Basado en offset + distancia |

---

## 🧪 Testing

### Casos de Prueba

#### TP-01: Despliegue en Línea
**Precondición**: Unidad con 3 subordinados
**Pasos**:
1. Click derecho en unidad
2. Desplegar → En Línea
3. Click en mapa hacia el Sur
**Resultado esperado**: 3 subordinados en línea E-O, 100m al sur

#### TP-02: Despliegue en Cuña con 4 subordinados
**Precondición**: Unidad con 4 subordinados
**Pasos**:
1. Click derecho en unidad
2. Desplegar → Cuña
3. Click en mapa hacia el SE
**Resultado esperado**:
- 1 subordinado al frente (SE)
- 2 subordinados formando V hacia atrás
- Patrón 2134

#### TP-03: Visualización LOS
**Precondición**: Unidad de infantería
**Pasos**:
1. Click derecho en unidad
2. Ver LOS
**Resultado esperado**: Círculo amarillo de 2km de radio

#### TP-04: Toggle LOS
**Precondición**: LOS ya visualizada
**Pasos**:
1. Click derecho en misma unidad
2. Ver LOS nuevamente
**Resultado esperado**: Círculo desaparece

#### TP-05: Timeout de Dirección
**Precondición**: Unidad con subordinados
**Pasos**:
1. Click derecho → Desplegar → Columna
2. Esperar 30 segundos sin hacer click
**Resultado esperado**: Error "Timeout - No se seleccionó dirección"

---

## 🚀 Próximos Pasos

### Prioridad Alta

1. **LOS Raycast Realista**
   - Integrar con datos de elevación existentes
   - Raycast 360° desde unidad
   - Crear polígono irregular según obstáculos
   - Integrar vegetación como obstáculo

2. **BAC (Base de Apoyo de Combate)**
   - Despliegue automático de PC y LOG en formaciones
   - Símbolos específicos para PC/LOG
   - Separación visual del elemento de maniobra

3. **Configuración por Tipo de Unidad**
   - Distancias específicas por arma (infantería: 50m, blindados: 100m)
   - Rangos de visión por tipo (caballería > infantería)
   - Formaciones válidas por arma

### Prioridad Media

4. **Formaciones Avanzadas**
   - Escalón derecha/izquierda en submenu
   - Formaciones compuestas (batallón en cuña, compañías en línea)
   - Despliegue recursivo (subordinados de subordinados)

5. **Visualización Mejorada**
   - Preview de formación antes de confirmar
   - Ghost icons mostrando posiciones futuras
   - Líneas conectando subordinados según formación

6. **Integración con Fases**
   - Despliegue solo en fase correspondiente
   - Validación de formaciones según subfase
   - Cambio de formación durante ejecución

### Prioridad Baja

7. **Histórico de Formaciones**
   - Guardar formación actual de cada unidad
   - Restaurar formación al reagrupar/redesplegar
   - Exportar/importar configuraciones

8. **Análisis Táctico**
   - Sugerencias automáticas de formación según terreno
   - Alertas de formaciones vulnerables
   - Cálculo de frentes y profundidades

---

## 📚 Referencias

### Doctrina Militar Argentina

- **RC-3-2** - Reglamento de Conducción para las Fuerzas Terrestres
- **ROP-00-01** - Operaciones (Tomo I: Ofensivas)
- **ROP-00-02** - Operaciones (Tomo II: Defensivas)
- **RC-3-30** - Conducción del Combate de Infantería

### Estándares

- **MIL-STD-2525D** - Common Warfighting Symbology
- **APP-6D** - NATO Joint Military Symbology
- **Leaflet.js** - Biblioteca de mapeo interactivo
- **Leaflet.PolylineDecorator** - Plugin para flechas

---

## 💡 Notas Técnicas

### Bearing vs Azimuth

El sistema usa **bearing geográfico**:
- 0° = Norte
- 90° = Este
- 180° = Sur
- 270° = Oeste

### Coordenadas vs Distancias

- Todas las distancias son **métricas reales** (no píxeles)
- Conversión lat/lng a metros mediante fórmula haversine
- Método `calcularPosicionDesdeDistancia()` de ORBATManager

### Leaflet PolylineDecorator

**Dependencia**: `leaflet-polylinedecorator`
**Cargado en**: `juegodeguerraV2.html:189`
**Uso**: Dibujo de flecha de dirección

```javascript
const decorator = L.polylineDecorator(lineaTemp, {
    patterns: [{
        offset: '100%',
        repeat: 0,
        symbol: L.Symbol.arrowHead({
            pixelSize: 15,
            polygon: false,
            pathOptions: { stroke: true, color: '#00ff00', weight: 3 }
        })
    }]
}).addTo(this.map);
```

---

## 🤝 Contribuciones

**Autor**: MAIRA Team + Claude Code
**Fecha implementación**: 15 Noviembre 2025
**Commit**: `45698ca0`
**Branch**: `BV8TOMAIRA`

---

## 📝 Changelog

### v1.0.0 - 2025-11-15

**Añadido**:
- Sistema completo de 5 formaciones tácticas
- Selección de dirección con visualización de flecha
- Visualización LOS con toggle
- Menús contextuales por arma
- Rotación automática de formaciones

**Modificado**:
- MenusDoctrinales.js: Submenu formaciones
- GestorOrdenesV2.js: 4 nuevos métodos
- ORBATManager.js: Soporte de dirección

**Pendiente**:
- LOS raycast realista
- BAC automático
- Configuración por tipo de unidad

---

**Documento generado**: 2025-11-15
**Última actualización**: 2025-11-15
**Versión**: 1.0.0
