# 🎮 PROYECTO: JUEGO DE GUERRA V2.0 - TOTAL WAR STYLE

> **Objetivo**: Reconstruir completamente `juegodeguerra.html` como una **subversión de planeamiento.html**, agregando mecánicas de juego de guerra por turnos con dos niveles: **estratégico (2D milsymbol)** y **táctico (3D models)**, inspirado en Total War Rome III y Steel Beasts.

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Arquitectura Base: Planeamiento](#arquitectura-base-planeamiento)
3. [Flujo Completo: Iniciar Partida → Juego](#flujo-completo)
4. [Dos Niveles de Juego](#dos-niveles-de-juego)
5. [Sistema de Hexágonos](#sistema-de-hexágonos)
6. [Sistema de Órdenes](#sistema-de-órdenes)
7. [Fases del Juego](#fases-del-juego)
8. [Interfaz de Usuario](#interfaz-de-usuario)
9. [Plan de Implementación](#plan-de-implementación)
10. [Estructura de Archivos](#estructura-de-archivos)
11. [Criterios de Éxito](#criterios-de-éxito)

---

## 🎯 VISIÓN GENERAL

### Concepto Core

**Juego de Guerra V2.0 es una EXTENSIÓN de planeamiento.html** que agrega:

- **Nivel Estratégico (2D)**: Milsymbol sobre mapa Leaflet + HexGrid para movimiento táctico
- **Nivel Táctico (3D)**: Modelos 3D detallados (como planeamiento_integrado.html) para combate cercano
- **Sistema de Turnos**: Planificación → Ejecución → Revisión
- **Órdenes Militares**: Movimiento, ataque, defensa, reconocimiento mediante menú radial
- **Niebla de Guerra**: FOW realista con LOS y sensores
- **Modo Local y Online**: Soporte para ambos desde iniciarpartida.html

### Inspiración Técnica

1. **Total War Rome III**:
   - Vista estratégica de campaña (mapa 2D con unidades)
   - Vista táctica de batalla (modelos 3D con combate detallado)
   - Transición fluida entre niveles
   - Sistema de órdenes visual (líneas de movimiento, objetivos)

2. **Steel Beasts**:
   - Simulación táctica militar realista
   - Control detallado de unidades individuales
   - Terreno afectando combate y movimiento
   - Sensores y detección realista

3. **Planeamiento.html (BASE)**:
   - Arquitectura de mapa y herramientas probada
   - Sistema de elementos militares con milsymbol
   - Calcos, mediciones, análisis de terreno
   - Gestión de estado y sincronización

4. **Planeamiento_Integrado.html (3D)**:
   - Sistema 3D MAIRA Master
   - Modelos GLB por SIDC
   - Zoom Multi-Nivel con transición 2D ↔ 3D
   - Sistema jerárquico de unidades

---

## 🏗️ ARQUITECTURA BASE: PLANEAMIENTO

### Juego de Guerra como Subversión

**Planeamiento.html es la FUNDACIÓN**, juegodeguerra.html agrega:

```
Planeamiento.html (BASE)
├── ✅ Mapa Leaflet funcional
├── ✅ Sistema de capas y overlays
├── ✅ Herramientas de dibujo (Leaflet.Draw)
├── ✅ Elementos militares (milsymbol + SIDC)
├── ✅ Calcos y mediciones
├── ✅ Análisis de terreno (elevación, pendiente, transitabilidad)
├── ✅ Sistema de zoom multinivel
├── ✅ Menu radial (miradial.js)
└── ✅ Chat y sincronización

JuegoDeGuerra.html (EXTENSIÓN)
├── ➕ HexGrid táctico superpuesto
├── ➕ Sistema de fases (preparación → despliegue → combate)
├── ➕ Sistema de turnos con reloj
├── ➕ Órdenes militares (no solo colocar, sino ORDENAR)
├── ➕ Cola de órdenes y ejecución automática
├── ➕ Resolución de combates
├── ➕ Niebla de guerra dinámica
├── ➕ Condiciones de victoria
└── ➕ Replay y estadísticas
```

### Reutilización de Código

**NO reinventar la rueda**, usar lo que funciona:

- ✅ **mapaP.js**: Inicialización y configuración de mapa
- ✅ **herramientasP.js**: Mediciones, búsqueda, navegación
- ✅ **simbolosP.js**: Creación y gestión de símbolos militares
- ✅ **calcosP.js**: Sistema de calcos y capas
- ✅ **miradial.js**: Menú radial contextual
- ✅ **elevationHandler.js, pendienteHandler.js**: Análisis de terreno
- ✅ **sistemaZoomMultiNivel.js**: Transición 2D ↔ 3D
- ✅ **modelos3DManager.js**: Gestión de modelos GLB

---

## 🎮 FLUJO COMPLETO: INICIAR PARTIDA → JUEGO

### 1. INICIAR PARTIDA (iniciarpartida.html)

**Punto de entrada del sistema**:

```
iniciarpartida.html
    ↓
Usuario elige:
├── Crear Nueva Partida
│   ├── Configurar: nombre, duración, modo (local/online)
│   ├── Asignar roles: Director, Jugador Azul, Jugador Rojo
│   ├── Configurar reglas: tipo de turnos, FOW, victorias
│   └── Guardar configuración → sessionStorage
│
└── Unirse a Partida Existente
    ├── Código de partida
    ├── Conectar via Socket.io
    └── Recibir estado inicial
    
    ↓
Transición a juegodeguerra.html con configuración
```

**Datos que pasa iniciarpartida.html**:

```javascript
const configuracionPartida = {
    id: "partida_abc123",
    nombre: "Operación Tormenta del Sur",
    modo: "local", // o "online"
    duracion: 3600, // segundos
    
    // Jugadores y roles
    jugadores: [
        { 
            id: "player_1", 
            nombre: "Comandante García", 
            equipo: "azul", 
            rol: "director",
            socket: null // en modo local
        },
        { 
            id: "player_2", 
            nombre: "Comandante López", 
            equipo: "rojo", 
            rol: "jugador",
            socket: null
        }
    ],
    
    // Reglas de juego
    reglas: {
        tipoTurnos: "simultaneo", // o "alternado"
        duracionTurno: 300, // segundos
        nieblaDeGuerra: true,
        modoVictoria: "aniquilacion", // o "objetivos", "territorio"
    },
    
    // Socket (solo online)
    socket: null, // o socket.io instance
    codigoPartida: "ABC-123" // para que otros se unan
};

// Guardar y redirigir
sessionStorage.setItem('configuracionPartida', JSON.stringify(configuracionPartida));
window.location.href = 'juegodeguerra.html';
```

### 2. JUEGO DE GUERRA (juegodeguerra.html)

**Carga configuración e inicializa**:

```javascript
// Al cargar juegodeguerra.html
const config = JSON.parse(sessionStorage.getItem('configuracionPartida'));

if (!config) {
    alert('No hay configuración de partida. Redirigiendo a iniciar partida...');
    window.location.href = 'iniciarpartida.html';
    return;
}

// Inicializar juego con configuración
const juego = new InicializadorJuegoGuerra(config);
await juego.inicializar();
```

---

## 🎮 DOS NIVELES DE JUEGO

### Nivel 1: ESTRATÉGICO (Vista 2D)

**Hereda TODO de planeamiento.html + agrega mecánicas de juego**:

**Vista**:
- Mapa Leaflet con terreno real
- **Milsymbol** para representar unidades (exactamente como planeamiento)
- **HexGrid superpuesto** (canvas overlay, no interfiere con clicks)
- Líneas de medición para rutas de movimiento
- Calcos para zonas (sector, zona azul, zona roja)

**Interacción**:
- Click en unidad → se selecciona
- Menu radial (miradial.js) → opciones de orden
- Click en mapa → destino de orden
- Leaflet.Draw → delimitar sectores y zonas (fase preparación)

**Órdenes en 2D**:
```javascript
// Orden de Movimiento
1. Jugador selecciona unidad (milsymbol)
2. Clic derecho → menu radial → "Mover"
3. Click en mapa → destino
4. Sistema dibuja línea de ruta (como medición)
5. Validación: dentro de rango, terreno transitable
6. Orden agregada a cola

// Orden de Ataque
1. Selecciona unidad
2. Menu radial → "Atacar"
3. Click en unidad enemiga (si visible)
4. Sistema dibuja línea de ataque
5. Validación: en rango, tiene LOS
6. Orden agregada a cola
```

**Display**:
- Unidades como **milsymbol** del tamaño apropiado según zoom
- Estados visuales:
  - Normal: símbolo estándar
  - Seleccionada: borde resaltado
  - Con orden: indicador visual (flecha, etc)
  - En movimiento: animación de traslado
  - En combate: efecto visual

### Nivel 2: TÁCTICO (Vista 3D)

**Hereda de planeamiento_integrado.html el sistema 3D**:

**Vista**:
- Canvas 3D con Three.js
- **Modelos GLB** por SIDC (sidcModelo3DBridge.js)
- Terreno 3D con elevación real
- Vegetación procedural
- Efectos visuales (humo, explosiones, trazadores)

**Cuándo se activa**:
```javascript
// Zoom automático (sistemaZoomMultiNivel.js)
if (zoom >= 14) {
    // Transición a vista 3D
    activarVista3D();
    renderizarUnidadesEn3D();
}

// O manual
if (jugador presiona tecla '3' o botón "Vista 3D") {
    toggleVista3D();
}
```

**Interacción 3D**:
- Controles OrbitControls para cámara
- Click en modelo 3D → seleccionar unidad
- Menu radial funciona igual pero en 3D
- Órdenes se visualizan en terreno 3D

**Órdenes en 3D**:
```javascript
// Mismas órdenes pero visualización mejorada
OrdenMovimiento:
    - Línea 3D sobre terreno
    - Animación de unidad moviéndose
    - Trail de polvo/humo
    
OrdenAtaque:
    - Línea de fuego 3D
    - Animación de disparo
    - Efectos visuales de impacto
    - Partículas y sonido
```

**Performance**:
- LOD (Level of Detail) según distancia
- Frustum culling (solo renderizar visibles)
- Instancing para unidades repetidas
- Degradación automática si FPS < 30

### Transición entre Niveles

**Fluida y automática**:

```javascript
class VistaManager {
    constructor() {
        this.vistaActual = '2d'; // o '3d'
        this.transicionando = false;
    }
    
    async cambiarVista(nuevaVista) {
        if (this.transicionando) return;
        this.transicionando = true;
        
        // Fade out
        await this.fadeOut(200);
        
        if (nuevaVista === '3d') {
            // Activar 3D
            document.getElementById('vista3D').style.display = 'block';
            await this.renderizarEscena3D();
        } else {
            // Activar 2D
            document.getElementById('vista3D').style.display = 'none';
            map.invalidateSize();
        }
        
        // Fade in
        await this.fadeIn(200);
        this.vistaActual = nuevaVista;
        this.transicionando = false;
    }
}
```

---

## ⬢ SISTEMA DE HEXÁGONOS

### Integración con Planeamiento

**HexGrid como capa táctica sobre mapa estratégico**:

```javascript
// HexGrid NO interfiere con funcionamiento de planeamiento
class HexGridV2 extends L.Layer {
    onAdd(map) {
        // Canvas con pointer-events: none
        this._canvas = L.DomUtil.create('canvas');
        this._canvas.style.pointerEvents = 'none'; // ¡CRÍTICO!
        this._canvas.style.zIndex = 400; // Sobre mapa, bajo controles
        
        map.getPanes().overlayPane.appendChild(this._canvas);
        this._reset();
    }
    
    // Detección matemática, NO eventos DOM
    getHexAtLatLng(latlng) {
        const axial = this.latlngToAxial(latlng);
        return this.hexagonos.get(`${axial.q},${axial.r}`);
    }
}

// Uso desde planeamiento
map.on('click', (e) => {
    // 1. Chequear si hay hexágono
    const hex = hexGrid.getHexAtLatLng(e.latlng);
    
    // 2. Según contexto (fase, modo), procesar
    if (esModoJuego && hex) {
        procesarClickEnHexagono(hex);
    } else {
        // Comportamiento normal de planeamiento
        procesarClickEnMapa(e);
    }
});
```

### Propiedades Tácticas

```javascript
class Hexagono {
    constructor(q, r, latlng) {
        // Coordenadas
        this.q = q;
        this.r = r;
        this.latlng = latlng;
        
        // Terreno (desde services de planeamiento)
        this.elevacion = await elevationHandler.getElevation(latlng);
        this.pendiente = await pendienteHandler.calcularPendiente(latlng);
        this.vegetacion = await vegetacionHandler.getVegetacion(latlng);
        this.transitabilidad = await transitabilidadHandler.calcular(latlng);
        
        // Estado táctico
        this.ocupante = null; // referencia a unidad
        this.visible = { azul: false, rojo: false };
        this.controlador = null;
        
        // Costos de movimiento (según tipo de unidad)
        this.costoMovimiento = this.calcularCostosSegunTerreno();
    }
}
```

---

## 📋 SISTEMA DE ÓRDENES

### Órdenes mediante Menu Radial

**Reutilización de miradial.js de planeamiento**:

```javascript
// Al seleccionar unidad
elementoMilitar.on('click', function(e) {
    L.DomEvent.stopPropagation(e);
    
    seleccionarUnidad(this);
    
    // Mostrar menu radial con opciones de orden
    const opciones = obtenerOpcionesSegunFase(this);
    mostrarMenuRadial(e.latlng, opciones);
});

function obtenerOpcionesSegunFase(unidad) {
    if (fase === 'combate' && subfase === 'planificacion') {
        return [
            { 
                id: 'mover', 
                icono: 'arrows-alt', 
                texto: 'Mover', 
                callback: () => iniciarOrdenMovimiento(unidad) 
            },
            { 
                id: 'atacar', 
                icono: 'crosshairs', 
                texto: 'Atacar', 
                callback: () => iniciarOrdenAtaque(unidad),
                disabled: !unidad.puedeAtacar()
            },
            { 
                id: 'defender', 
                icono: 'shield-alt', 
                texto: 'Defender', 
                callback: () => ordenDefensa(unidad) 
            },
            { 
                id: 'reconocer', 
                icono: 'binoculars', 
                texto: 'Reconocimiento', 
                callback: () => iniciarOrdenReconocimiento(unidad) 
            }
        ];
    }
    return [];
}
```

### Tipos de Órdenes

#### 1. Orden de Movimiento

```javascript
class OrdenMovimiento extends OrdenBase {
    constructor(unidad, destino) {
        super(unidad, 'movimiento');
        this.destino = destino; // {lat, lng}
        this.ruta = null; // calculada
        
        // Dibujar línea de medición (como en planeamiento)
        this.lineaRuta = L.polyline([unidad.latlng, destino], {
            color: unidad.equipo === 'azul' ? '#0066ff' : '#ff0000',
            weight: 3,
            dashArray: '10, 10',
            interactive: false
        }).addTo(map);
        
        // Calcular ruta óptima
        this.calcularRuta();
    }
    
    async calcularRuta() {
        // Pathfinding A* sobre hexgrid
        this.ruta = await pathfindingService.findPath(
            this.unidad.hexActual,
            hexGrid.getHexAtLatLng(this.destino),
            this.unidad.tipo
        );
        
        // Actualizar línea visual
        this.actualizarLineaRuta();
    }
}
```

#### 2. Orden de Ataque

```javascript
class OrdenAtaque extends OrdenBase {
    constructor(atacante, objetivo) {
        super(atacante, 'ataque');
        this.objetivo = objetivo; // unidad enemiga
        
        // Línea de ataque visual
        this.lineaAtaque = L.polyline([
            atacante.latlng, 
            objetivo.latlng
        ], {
            color: '#ff0000',
            weight: 2,
            dashArray: '5, 10',
            interactive: false
        }).addTo(map);
        
        // Validar LOS
        this.tieneLineaVista = this.validarLOS();
    }
    
    validarLOS() {
        return visibilidadManager.calcularLOS(
            this.unidad.hexActual,
            this.objetivo.hexActual
        );
    }
}
```

#### 3. Orden de Defensa

```javascript
class OrdenDefensa extends OrdenBase {
    constructor(unidad, posicion) {
        super(unidad, 'defensa');
        this.posicion = posicion;
        
        // Indicador visual de fortificación
        this.marcadorDefensa = L.circle(posicion, {
            radius: 50,
            color: unidad.equipo === 'azul' ? '#0066ff' : '#ff0000',
            fillOpacity: 0.2
        }).addTo(map);
    }
}
```

#### 4. Orden de Reconocimiento

```javascript
class OrdenReconocimiento extends OrdenBase {
    constructor(unidad, areaObjetivo) {
        super(unidad, 'reconocimiento');
        this.area = areaObjetivo; // círculo o polígono
        
        // Área de reconocimiento visual
        this.areaVisual = L.circle(areaObjetivo.center, {
            radius: areaObjetivo.radio,
            color: '#ffff00',
            fillOpacity: 0.1,
            dashArray: '10, 5'
        }).addTo(map);
    }
}
```

---

## 🎮 FASES DEL JUEGO

### FASE 0: Inicialización (desde iniciarpartida.html)

**Ya implementado en iniciarpartida.html**:
- Crear/unirse partida
- Configurar jugadores y roles
- Establecer reglas
- Conectar sockets (si online)
- Transición a juegodeguerra.html

### FASE 1: PREPARACIÓN

#### Subfase 1.1: Definición de Sector

**Director usa Leaflet.Draw (como en planeamiento)**:

```javascript
// Activar herramienta de dibujo
const drawControl = new L.Control.Draw({
    draw: {
        polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
                color: '#00ff00',
                weight: 3
            }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false
    }
});

map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function(event) {
    const layer = event.layer;
    const tipo = event.layerType;
    
    if (tipo === 'polygon' && fase === 'preparacion' && subfase === 'definicion_sector') {
        definirSector(layer);
    }
});

function definirSector(layer) {
    // Validar área
    const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    if (area < 25000000 || area > 500000000) {
        alert('Sector debe tener entre 25 y 500 km²');
        return;
    }
    
    // Guardar sector
    EstadoJuego.territorio.sector = layer.toGeoJSON();
    
    // Generar hexgrid dentro del sector
    hexGrid.generarDentroDeSector(layer);
    
    // Transición a siguiente subfase
    cambiarSubfase('definicion_zonas');
}
```

#### Subfase 1.2: Definición de Zonas

**Director delimita zona azul y roja**:

Similar al sector, pero dos polígonos con validaciones:
- Dentro del sector
- Sin superposición
- Distancia mínima entre zonas

### FASE 2: DESPLIEGUE

**Heredar sistema de planeamiento para agregar elementos**:

```javascript
// Jugador agrega unidades desde menu (como en planeamiento)
// Pero con restricciones de fase despliegue

function agregarUnidadEnDespliegue(sidc, latlng) {
    // Validar que está en zona del jugador
    const zona = jugadorActual.equipo === 'azul' ? 
        EstadoJuego.territorio.zonaAzul : 
        EstadoJuego.territorio.zonaRoja;
    
    if (!dentroDeZona(latlng, zona)) {
        notificar('Debes desplegar en tu zona', 'warning');
        return;
    }
    
    // Usar sistema de símbolos de planeamiento
    const simbolo = crearSimbolo(sidc, latlng);
    simbolo.equipo = jugadorActual.equipo;
    simbolo.enDespliegue = true;
    
    // Agregar a mapa
    simbolo.addTo(map);
    
    // Agregar a estado
    EstadoJuego.unidades.set(simbolo.id, simbolo);
}
```

### FASE 3: COMBATE

#### Subfase 3.1: Planificación

**Jugadores dan órdenes simultáneamente**:

```javascript
// UI muestra lista de unidades (como en calcos de planeamiento)
// Click en unidad → menú radial → seleccionar orden
// Órdenes se agregan a cola, NO se ejecutan aún

function confirmarOrdenes() {
    // Jugador presiona "Confirmar Órdenes"
    EstadoJuego.turnos.ordenesConfirmadas[jugadorActual.equipo] = true;
    
    // Si ambos confirmaron (o timeout)
    if (todosConfirmaron()) {
        cambiarSubfase('ejecucion');
    } else {
        notificar('Esperando a otros jugadores...', 'info');
    }
}
```

#### Subfase 3.2: Ejecución

**Sistema resuelve todas las órdenes automáticamente**:

```javascript
async function ejecutarTurno() {
    // UI bloqueada, solo observación
    
    // Ordenar órdenes por prioridad
    const ordenesOrdenadas = ordenarOrdenesPorPrioridad(
        EstadoJuego.ordenes.planificadas
    );
    
    // Ejecutar una por una
    for (const orden of ordenesOrdenadas) {
        await orden.ejecutar();
        
        // Animación visual (2D o 3D según vista)
        await animarOrden(orden);
        
        // Resolver combates si hay contacto
        if (hayContacto(orden)) {
            await resolverCombate(orden);
        }
        
        // Actualizar niebla de guerra
        actualizarVisibilidad();
    }
    
    // Transición a revisión
    cambiarSubfase('revision');
}
```

#### Subfase 3.3: Revisión

**Jugadores ven resultado**:

```javascript
function mostrarRevisionTurno() {
    // Mostrar log de eventos
    const eventos = EstadoJuego.turnos.eventosUltimoTurno;
    mostrarLogEventos(eventos);
    
    // Actualizar estadísticas
    actualizarEstadisticas();
    
    // Chequear victoria
    const resultado = chequearCondicionesVictoria();
    if (resultado.victoria) {
        finalizarPartida(resultado);
    } else {
        // Botón "Siguiente Turno"
        mostrarBotonSiguienteTurno();
    }
}
```

---

## 🎨 INTERFAZ DE USUARIO

### Layout General

```
┌─────────────────────────────────────────────────────────────┐
│ MENU LATERAL (planeamiento.html - sin modificar)           │
│ ├─ Agregar Elementos (con restricciones según fase)        │
│ ├─ Mediciones                                              │
│ ├─ Calcos (para órdenes)                                   │
│ ├─ Herramientas de Análisis                               │
│ └─ Vista 3D Toggle                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          MAPA PRINCIPAL (Leaflet + HexGrid)                │
│          o                                                  │
│          VISTA 3D (Three.js canvas)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────────────────────────┬──────────────────┐
│  ESTADO  │      UNIDADES ACTIVAS         │      CHAT       │
│          │                               │   (online only) │
│ Turno: 3 │ □ Infantería RI 3 (80%)       │                 │
│ Fase:    │ □ Tanque TAM 1 (100%)         │ [Mensajes...]   │
│ Combate  │ □ Artillería GA 5 (90%)       │                 │
│ 04:23    │ □ Reconocimiento R 2 (70%)    │ [Input]         │
│          │                               │                 │
│ [Confirmar Órdenes]                      │                 │
└──────────┴──────────────────────────────┴──────────────────┘
```

### Panel Inferior Unificado V2

**Tres secciones**:

1. **Estado** (izquierda):
   - Turno actual
   - Fase y subfase
   - Reloj cuenta regresiva
   - Botones de acción según fase

2. **Unidades** (centro):
   - Lista como en calcos de planeamiento
   - Click para seleccionar y centrar
   - Indicadores: salud, munición, estado, órdenes
   - Drag para reordenar (prioridad)

3. **Chat** (derecha, solo online):
   - Como en planeamiento.html
   - Mensajes entre jugadores
   - Notificaciones de sistema

---

## 📅 PLAN DE IMPLEMENTACIÓN

### FASE 1: Fundaciones (Semana 1) ✅

**Objetivo**: Base sólida reutilizando planeamiento

**Tareas**:
1. ✅ Copiar planeamiento.html → juegodeguerra_v2.html
2. ✅ Crear estructura de carpetas js/juegodeguerra/
3. ✅ Implementar EstadoJuego.js centralizado
4. ✅ Implementar InicializadorJuego.js que lee configuración
5. ✅ Crear HexGridV2.js con canvas overlay SIN interferencias
6. ✅ Integrar HexGrid con mapa de planeamiento
7. ✅ Validar: mapa funciona, hexgrid se dibuja, NO hay conflictos

**Entregable**: juegodeguerra_v2.html carga, muestra mapa de planeamiento + hexgrid perfecto

### FASE 2: Integración con Iniciar Partida (Semana 2)

**Objetivo**: Flujo completo desde iniciar hasta juego

**Tareas**:
1. ✅ Modificar iniciarpartida.html para guardar configuración completa
2. ✅ juegodeguerra.html lee configuración de sessionStorage
3. ✅ Implementar validación de configuración
4. ✅ Implementar fallback si no hay configuración
5. ✅ Modo local: asignar jugadores automáticamente
6. ✅ Modo online: conectar sockets y sincronizar
7. ✅ Validar: flujo iniciar → juego funciona end-to-end

**Entregable**: Poder crear partida en iniciarpartida.html y entrar a juego configurado

### FASE 3: Fases y Territorio (Semana 3)

**Objetivo**: Implementar fase preparación completa

**Tareas**:
1. ✅ FaseManager.js para controlar transiciones
2. ✅ FasePreparacion.js con Leaflet.Draw
3. ✅ TerritorioManager.js para validaciones
4. ✅ Delimitar sector funcional
5. ✅ Delimitar zonas funcional
6. ✅ Generar HexGrid dentro de sector
7. ✅ Transición a fase despliegue

**Entregable**: Fase preparación completa, director puede delimitar sector y zonas

### FASE 4: Despliegue (Semana 4)

**Objetivo**: Colocar unidades en mapa

**Tareas**:
1. ✅ FaseDespliegue.js
2. ✅ Reutilizar sistema de símbolos de planeamiento
3. ✅ Restricciones de zona por equipo
4. ✅ Lista de unidades disponibles
5. ✅ Validaciones de terreno
6. ✅ Botón "Listo para Combate"
7. ✅ Transición a fase combate

**Entregable**: Poder desplegar unidades en zonas correctas

### FASE 5: Sistema de Órdenes (Semana 5-6)

**Objetivo**: Mecánica core del juego

**Tareas**:
1. ✅ TurnosManager.js V2
2. ✅ OrdenBase.js + subclases
3. ✅ Integrar menú radial (miradial.js)
4. ✅ Orden de Movimiento completa
5. ✅ Líneas de ruta visuales
6. ✅ OrdenesQueue.js
7. ✅ Validaciones de órdenes

**Entregable**: Poder dar órdenes de movimiento, ver rutas, validar

### FASE 6: Ejecución de Turnos (Semana 7)

**Objetivo**: Resolver órdenes automáticamente

**Tareas**:
1. ✅ ResolucionOrdenes.js
2. ✅ Animaciones de movimiento 2D
3. ✅ Pathfinding A* sobre hexgrid
4. ✅ Actualización de posiciones
5. ✅ Log de eventos
6. ✅ Subfases: planificación → ejecución → revisión

**Entregable**: Turnos se ejecutan, unidades se mueven, animaciones funcionan

### FASE 7: Combate Básico (Semana 8-9)

**Objetivo**: Resolución de combates

**Tareas**:
1. ✅ CombateResolver.js
2. ✅ CalculosBalísticos.js
3. ✅ OrdenAtaque.js completa
4. ✅ OrdenDefensa.js
5. ✅ Sistema de bajas y moral
6. ✅ Efectos visuales de combate
7. ✅ Sonidos

**Entregable**: Combates se resuelven, bajas aplican, feedback visual

### FASE 8: Visibilidad (Semana 10)

**Objetivo**: FOW realista

**Tareas**:
1. ✅ NieblaDeGuerra.js
2. ✅ LineaDeVista.js con terreno
3. ✅ SensoresManager.js
4. ✅ Renderizado de hexgrid según visibilidad
5. ✅ Detección de unidades enemigas
6. ✅ Sistema de radar/sensores

**Entregable**: Solo ver unidades enemigas si hay LOS, FOW funciona

### FASE 9: Vista 3D Táctica (Semana 11-12)

**Objetivo**: Integrar sistema 3D de planeamiento_integrado

**Tareas**:
1. ✅ Integrar MAIRA 3D Master
2. ✅ Renderizar unidades como modelos GLB
3. ✅ Sistema de zoom multinivel funcional
4. ✅ Órdenes visualizadas en 3D
5. ✅ Animaciones de combate 3D
6. ✅ Efectos visuales (humo, explosiones)
7. ✅ Performance optimizada

**Entregable**: Vista 3D funcional, transición 2D ↔ 3D fluida

### FASE 10: Pulido (Semana 13-14)

**Objetivo**: Juego completo y pulido

**Tareas**:
1. ✅ Condiciones de victoria
2. ✅ Sistema de guardado/carga
3. ✅ Replay de partidas
4. ✅ Estadísticas detalladas
5. ✅ Tutorial integrado
6. ✅ Optimización general
7. ✅ Testing exhaustivo
8. ✅ Documentación

**Entregable**: Juego completo, pulido, sin bugs críticos

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
Client/
│
├── iniciarpartida.html                    ← PUNTO DE ENTRADA
│
├── juegodeguerra_v2.html                  ← JUEGO (extends planeamiento)
│
├── planeamiento.html                      ← BASE (sin modificar)
│
├── css/
│   ├── juegodeguerra/
│   │   ├── main.css
│   │   ├── panel_inferior.css
│   │   └── hexgrid.css
│   └── planeamiento/                      ← Existente, sin tocar
│
└── js/
    ├── juegodeguerra/                     ← NUEVO CÓDIGO
    │   ├── main.js                        ← Entry point
    │   │
    │   ├── core/
    │   │   ├── EstadoJuego.js             ← Estado centralizado
    │   │   ├── InicializadorJuego.js     ← Lee config, inicializa
    │   │   └── ConfiguracionJuego.js     ← Defaults, validación
    │   │
    │   ├── mapa/
    │   │   ├── HexGridV2.js               ← Canvas overlay
    │   │   └── TerritorioManager.js       ← Sectores, zonas
    │   │
    │   ├── fases/
    │   │   ├── FaseManager.js             ← Transiciones
    │   │   ├── FasePreparacion.js         ← Delimitar
    │   │   ├── FaseDespliegue.js          ← Colocar unidades
    │   │   └── FaseCombate.js             ← Turnos
    │   │
    │   ├── turnos/
    │   │   ├── TurnosManager.js           ← Gestión turnos
    │   │   ├── OrdenesQueue.js            ← Cola órdenes
    │   │   └── ResolucionOrdenes.js       ← Ejecutor
    │   │
    │   ├── ordenes/
    │   │   ├── OrdenBase.js               ← Clase abstracta
    │   │   ├── OrdenMovimiento.js         ← Implementación
    │   │   ├── OrdenAtaque.js
    │   │   ├── OrdenDefensa.js
    │   │   └── OrdenReconocimiento.js
    │   │
    │   ├── combate/
    │   │   ├── CombateResolver.js
    │   │   ├── CalculosBalísticos.js
    │   │   └── BajasManager.js
    │   │
    │   ├── visibilidad/
    │   │   ├── NieblaDeGuerra.js
    │   │   ├── LineaDeVista.js
    │   │   └── SensoresManager.js
    │   │
    │   ├── ui/
    │   │   ├── PanelInferiorUnificado.js
    │   │   ├── NotificacionesUI.js
    │   │   └── MenuContextual.js
    │   │
    │   └── utils/
    │       ├── HexMath.js
    │       ├── Pathfinding.js
    │       └── Validadores.js
    │
    └── planeamiento/                      ← REUTILIZAR TODO ESTO
        ├── mapaP.js                       ← ✅ Mapa base
        ├── herramientasP.js               ← ✅ Mediciones, etc
        ├── simbolosP.js                   ← ✅ Milsymbol
        ├── calcosP.js                     ← ✅ Capas
        ├── miradial.js                    ← ✅ Menu radial
        ├── elevationHandler.js            ← ✅ Elevación
        ├── pendienteHandler.js            ← ✅ Pendiente
        ├── transitabilidadHandler.js      ← ✅ Transitabilidad
        ├── sistemaZoomMultiNivel.js       ← ✅ Vista 3D
        └── modelos3DManager.js            ← ✅ Modelos GLB
```

---

## ✅ CRITERIOS DE ÉXITO

### Funcionalidad Core

- [ ] **Flujo completo**: iniciarpartida → juego → finalización
- [ ] **Fase Preparación**: Delimitar sector y zonas funciona perfectamente
- [ ] **Fase Despliegue**: Colocar unidades con validaciones
- [ ] **Sistema de Turnos**: Planificación → Ejecución → Revisión sin bugs
- [ ] **Órdenes**: Movimiento, ataque, defensa, reconocimiento funcionan
- [ ] **Combate**: Resolución con probabilidades y bajas correctas
- [ ] **Niebla de Guerra**: FOW realista con LOS
- [ ] **Vista 3D**: Transición fluida 2D ↔ 3D
- [ ] **Condiciones Victoria**: Detectar y mostrar ganador

### Integración con Planeamiento

- [ ] **Zero Breaking Changes**: Planeamiento.html sigue funcionando igual
- [ ] **Reutilización**: Usar código existente sin duplicar
- [ ] **Compatibilidad**: Mismos servicios (elevación, pendiente, etc)
- [ ] **HexGrid No Interfiere**: Canvas overlay no bloquea funcionalidad

### Calidad Técnica

- [ ] **Zero Console Errors**: Durante uso normal
- [ ] **Estado Centralizado**: Single source of truth
- [ ] **Performance**: 60 FPS con 100 hexágonos y 50 unidades
- [ ] **Código Documentado**: JSDoc en funciones críticas
- [ ] **Testing**: Casos de prueba para funciones core

### Experiencia de Usuario

- [ ] **Intuitive**: Usuario entiende qué hacer sin manual
- [ ] **Feedback Visual**: Inmediato en todas las acciones
- [ ] **Modo Local Funcional**: Sin necesidad de servidor
- [ ] **Modo Online Funcional**: Sincronización perfecta
- [ ] **Responsive**: Funciona en diferentes resoluciones

---

## 🚀 DECISIONES TÉCNICAS CLAVE

### 1. Planeamiento como Base (NO reinventar)

**Decisión**: Juego de Guerra es una EXTENSIÓN de planeamiento.html

**Razones**:
- ✅ Código probado y funcionando
- ✅ Infraestructura de mapa robusta
- ✅ Servicios de terreno ya implementados
- ✅ Sistema 3D en desarrollo (planeamiento_integrado)
- ✅ Ahorro masivo de tiempo
- ✅ Compatibilidad garantizada

### 2. Canvas Overlay para HexGrid

**Decisión**: HexGrid como canvas con pointer-events: none

**Razones**:
- ✅ NO interfiere con funcionalidad de planeamiento
- ✅ Performance superior a SVG/DOM
- ✅ Detección matemática precisa
- ✅ Fácil integrar con mapa existente

### 3. Estado Centralizado

**Decisión**: Un objeto EstadoJuego con patrón observer

**Razones**:
- ✅ Single source of truth
- ✅ Fácil debugging
- ✅ Sincronización para online
- ✅ Replay y undo/redo posibles

### 4. Órdenes como Objetos

**Decisión**: Jerarquía de clases con validar() y ejecutar()

**Razones**:
- ✅ Reutilizable
- ✅ Testeable aisladamente
- ✅ Extensible sin modificar core
- ✅ Cola flexible

### 5. Dos Niveles de Vista

**Decisión**: 2D estratégico + 3D táctico

**Razones**:
- ✅ Total War style
- ✅ Aprovechar sistema 3D existente
- ✅ Mejor UX según contexto
- ✅ Diferenciación clara

### 6. Iniciar Partida Separado

**Decisión**: iniciarpartida.html como punto de entrada

**Razones**:
- ✅ Configuración antes de cargar juego pesado
- ✅ Roles y jugadores claros desde inicio
- ✅ Modo local vs online decidido temprano
- ✅ Validación de configuración aislada

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Paso 1: Preparar Ambiente ✅

```bash
# Crear estructura de carpetas
cd Client/js
mkdir -p juegodeguerra/{core,mapa,fases,turnos,ordenes,combate,visibilidad,ui,utils}

# Crear CSS
cd ../css
mkdir juegodeguerra
```

### Paso 2: Copiar Base ✅

```bash
# Copiar planeamiento como punto de partida
cp planeamiento.html juegodeguerra_v2.html

# Modificar título y referencias
# Agregar script main.js de juegodeguerra
```

### Paso 3: Estado Centralizado ✅

```javascript
// js/juegodeguerra/core/EstadoJuego.js
class EstadoJuego {
    constructor() {
        this._observers = [];
        this._estado = {
            // ... estado completo
        };
    }
    
    subscribe(observer) {
        this._observers.push(observer);
    }
    
    setState(nuevoEstado) {
        this._estado = { ...this._estado, ...nuevoEstado };
        this.notify();
    }
    
    notify() {
        this._observers.forEach(obs => obs(this._estado));
    }
}
```

### Paso 4: HexGrid V2 ✅

```javascript
// js/juegodeguerra/mapa/HexGridV2.js
class HexGridV2 extends L.Layer {
    onAdd(map) {
        this._canvas = L.DomUtil.create('canvas');
        this._canvas.style.pointerEvents = 'none'; // ¡CRÍTICO!
        // ... resto
    }
}
```

### Paso 5: Inicializador ✅

```javascript
// js/juegodeguerra/core/InicializadorJuego.js
class InicializadorJuego {
    async inicializar() {
        // 1. Leer configuración
        const config = this.leerConfiguracion();
        
        // 2. Validar
        if (!this.validarConfiguracion(config)) {
            this.redirigirAIniciarPartida();
            return;
        }
        
        // 3. Inicializar estado
        EstadoJuego.setState(config);
        
        // 4. Inicializar mapa (planeamiento)
        await this.inicializarMapaBase();
        
        // 5. Agregar hexgrid
        this.hexGrid = new HexGridV2();
        this.hexGrid.addTo(map);
        
        // 6. Inicializar fases
        this.faseManager = new FaseManager();
        
        // 7. Listo!
        console.log('✅ Juego inicializado');
    }
}
```

---

## 📝 NOTAS FINALES

### Principio Rector

**"Planeamiento es la base, Juego de Guerra es la torre"**

- NO tocar código de planeamiento
- Reutilizar TODO lo posible
- Agregar solo lo necesario para mecánicas de juego
- Mantener compatibilidad total

### Workflow de Desarrollo

1. **Validar en planeamiento.html primero**
2. **Si funciona allí, integrarlo en juego**
3. **Nunca romper planeamiento**
4. **Una feature a la vez**
5. **Testing continuo**

### Visión a Largo Plazo

Este proyecto es la **evolución natural** de MAIRA:

```
Planeamiento.html
    ↓
Planeamiento_Integrado.html (+ 3D)
    ↓
Juego de Guerra V2.0 (+ Mecánicas de juego)
    ↓
Simulador Táctico Completo
```

---

**Fecha**: 5 de noviembre de 2025  
**Versión**: 2.0  
**Estado**: 📋 PLANIFICACIÓN COMPLETA ACTUALIZADA  
**Siguiente**: FASE 1 - Fundaciones (Copiar planeamiento + HexGrid)

---

**¿Listo para comenzar? 🚀**
