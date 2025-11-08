# 🎮 ESTADO ACTUAL - JUEGO DE GUERRA V2

**Fecha última actualización:** 7 de Noviembre 2025
**Branch:** `feature/juego-guerra-v2`
**Progreso General:** ~45% completado

---

## 📊 RESUMEN EJECUTIVO

### Fase Actual: FASE 6 - Ejecución de Turnos

```
COMPLETADO (45%):
✅ FASE 1: Fundaciones (Sistema base, arquitectura)
✅ FASE 2: Integración con Iniciar Partida
✅ FASE 3: Fases y Territorio (parcial - bloqueado por Geoman→Leaflet.Draw)
✅ FASE 4: Despliegue (parcial - falta validaciones)
✅ FASE 5: Sistema de Órdenes ← Completado
✅ FASE 6: Ejecución de Turnos (básico)

EN PROGRESO (25%):
⏳ Validaciones de zona/sector
⏳ Sistema de turnos LOCAL
⏳ Modo online (endpoints servidor)

PENDIENTE (30%):
❌ FASE 7: Combate Básico (resolver daño, bajas, moral)
❌ FASE 8: Visibilidad (FOW, LOS con terreno)
❌ FASE 9: Vista 3D Táctica
❌ FASE 10: Pulido y Testing
```

---

## 🔥 BLOQUEOS CRÍTICOS

### 1. FaseManager.js usa Geoman (juegodeguerraV2.html tiene Leaflet.Draw)
**Impacto:** 🚨 CRÍTICO - Impide delimitar sector
**Bloquea:** Inicio completo de partida (Fase Preparación)
**Solución:** Migrar FaseManager.js de `map.pm.*` a `L.Draw.*`
**Tiempo estimado:** 2-3 horas
**Archivos:** `/Client/js/modules/juegoV2/core/FaseManager.js` (líneas 189-205, 282-307)

### 2. Endpoints servidor no verificados
**Impacto:** 🔶 ALTO - Modo online puede no funcionar
**Bloquea:** Sincronización online
**Solución:** Verificar/crear endpoints en serverhttps.py y app.py
**Tiempo estimado:** 3-4 horas

### 3. Validaciones de zona/sector faltantes
**Impacto:** 🔶 ALTO - Jugadores pueden hacer trampas
**Bloquea:** Juego justo
**Solución:** Implementar validaciones (ver sección Validaciones Pendientes)
**Tiempo estimado:** 4-5 horas

---

## ✅ COMPLETADO

### Arquitectura y Sistema Base
- ✅ Estructura de carpetas `js/modules/juegoV2/` completa
- ✅ EstadoJuego.js centralizado con patrón observer
- ✅ HexGrid V2 como canvas overlay (pointer-events: none)
- ✅ InicializadorJuegoV2.js con verificación de dependencias
- ✅ Reutilización completa de código de planeamiento.html

### Sistema de Órdenes Core
- ✅ **OrdenBase.js** - Clase abstracta con sistema de estados
- ✅ **OrdenMovimiento.js** - Movimiento con pathfinding A*
- ✅ **OrdenAtaque.js** - Ataque con línea de vista (LOS)
- ✅ **Pathfinding.js** - A* sobre hexgrid con costos de terreno
- ✅ **OrdenesQueueV2.js** - Cola secuencial + tiempo real
- ✅ Sistema de validación y ejecución de órdenes
- ✅ Serialización para sincronización online
- ✅ Cache LRU de pathfinding (100 rutas)

### Integración con UI
- ✅ **GestorOrdenesV2.js** - Sistema central (930+ líneas)
- ✅ Integración con menú radial (miradial.js)
- ✅ **PanelCoordinacionOrdenes.js** - Timeline visual de órdenes
- ✅ Preview visual de rutas y líneas de ataque
- ✅ Subfases de combate (planificación → ejecución → revisión)
- ✅ Manejo de turnos y tiempo simulado
- ✅ Panel coordinación NO se abre automáticamente (controlado por usuario)
- ✅ Z-index hierarchy corregido (menú principal sobre todo)

### Interfaz Usuario V2
- ✅ Badge V2 distintivo (superior derecha, gradiente morado/azul)
- ✅ Indicador de fase dinámico (azul/naranja/verde según subfase)
- ✅ Panel de coordinación temporal (inferior, tema oscuro táctico)
- ✅ Botones de control V2 (Confirmar Órdenes, Siguiente Turno, Toggle Panel)
- ✅ Sección Jugador/Equipo en panel inferior
- ✅ Chat integrado (MAIRAChat.js) en panel derecha
- ✅ Sistema de turnos de despliegue con "Jugador Listo"
- ✅ Rotación de jugadores en modo LOCAL

### Interacciones
- ✅ Doble-click en unidades abre menú radial
- ✅ Doble-click en hexágonos abre menú radial
- ✅ Eliminados paneles directos (todo pasa por menú radial)
- ✅ Adaptación para marcadores SIDC (Leaflet markers)
- ✅ Acciones del menú radial registradas globalmente
- ✅ Menú agregar validado por fase (despliegue/combate)

### Archivos HTML
- ✅ juegodeguerraV2.html configurado con scripts V2
- ✅ Inicialización usando InicializadorJuegoV2
- ✅ Carga correcta de dependencias en orden
- ✅ Z-index inline corregidos (3D, modals, loading)

---

## ⏳ EN PROGRESO

### Validaciones (Sesión actual)
- 🔄 Menú agregar solo habilitado en fase despliegue/combate
- 🔄 Elementos deben insertarse dentro de zona azul/roja según equipo
- 🔄 SIDC amigo→azul, enemigo→rojo con colores correspondientes
- 🔄 Zonas deben estar completamente dentro del sector
- 🔄 Órdenes de movimiento no pueden exceder límites del sector

### Sistema de Turnos LOCAL
- 🔄 Panel elementos debe filtrar por jugador actual en modo LOCAL
- 🔄 Solo mostrar unidades del jugador en turno

---

## ❌ PENDIENTE

### PRIORIDAD CRÍTICA

#### 1. Migrar FaseManager.js de Geoman a Leaflet.Draw
**Archivos:**
- `/Client/js/modules/juegoV2/core/FaseManager.js` (líneas 189-205, 282-307)

**Cambios necesarios:**
```javascript
// ANTES (Geoman):
this.map.pm.enableDraw('Polygon', { ... });

// DESPUÉS (Leaflet.Draw):
const drawControl = new L.Control.Draw({ ... });
this.map.addControl(drawControl);
new L.Draw.Polygon(this.map, { ... }).enable();
```

**Nota adicional:** Agregar check para NO abrir menú radial cuando Leaflet.Draw está dibujando activamente.

#### 2. Verificar endpoints servidor
**Archivos:**
- `/Server/serverhttps.py`
- `/Server/app.py`

**Endpoints necesarios:**
```python
# Gestión de Partida
@socketio.on('definirSector')
@socketio.on('definirZona')
@socketio.on('confirmarPreparacion')

# Gestión de Órdenes
@socketio.on('agregarOrden')
@socketio.on('validarOrdenes')
@socketio.on('ejecutarTurno')

# Sincronización
@socketio.on('sincronizarEstado')
```

**Verificar emisores en cliente:**
- InicializadorJuegoV2.js debe emitir eventos al servidor
- FaseManager.js debe sincronizar cambios de fase
- GestorOrdenesV2.js debe enviar órdenes

### PRIORIDAD ALTA

#### 3. Implementar órdenes faltantes
- **OrdenDefensa.js** - Fortificarse en posición
- **OrdenReconocimiento.js** - Explorar área
- **OrdenEspera.js** - Esperar tiempo específico
- **OrdenIngeniero.js** - Construcción/destrucción de obstáculos

**Ubicación:** `/Client/js/modules/juegoV2/ordenes/`

#### 4. Sistema de combate completo
- **CombateResolver.js** - Resolución de combates
- **CalculosBalísticos.js** - Cálculos de daño realista
- **BajasManager.js** - Sistema de bajas y moral
- **Efectos visuales de combate** (explosiones, humo, trazadores)
- **Sonidos de combate**

#### 5. Sistema de visibilidad (Niebla de Guerra)
- **NieblaDeGuerra.js** - FOW realista
- **LineaDeVista.js** - LOS con terreno 3D
- **SensoresManager.js** - Detección de unidades
- **Renderizado de hexgrid según visibilidad**

### PRIORIDAD MEDIA

#### 6. Ajustes CSS panel izquierda
**Objetivo:** Reducir tamaño de elementos en `#panel-seccion-estado`

**Cambios:**
- Fase: 16px → 14px
- Jugador/Equipo: 13px → 11px
- Turno: 14px → 12px
- Tiempo: 24px → 20px
- Padding: 10px → 8px
- Gap: 12px → 8px

**Archivo:** `InicializadorJuegoV2.js` líneas 383-464

#### 7. Modo oscuro táctico matriz de coordinación
**Objetivo:** Timeline con tonos oscuros tácticos (no colores claros)

**Cambios:**
- Fondo más oscuro: `rgba(10, 10, 10, 0.95)`
- Colores órdenes más saturados y oscuros
- Grid verde fosforescente: `rgba(0, 255, 0, 0.15)`
- Texto verde: `rgba(0, 255, 0, 0.8)`

**Archivo:** `/Client/js/modules/juegoV2/ui/PanelCoordinacionOrdenes.js`

#### 8. Limpiar UI: Sacar botones Deshacer/Rehacer/Volver
- Remover botones de UI inferior
- Mover Deshacer/Rehacer a menú Opciones (ya están en Ctrl+Z/Y)
- Botón "Volver" (🏠) agregar en menú principal

**Archivos:**
- planeamiento.html
- planeamiento_integrado.html
- gestionbatalla.html
- juegodeguerra.html
- juegodeguerraV2.html

#### 9. Reorganizar menús: Mover "Opciones 3D" a Herramientas
- Remover "Opciones 3D" funcional del menú principal
- Reemplazar el no-funcional dentro de Herramientas
- Agregar "🏠 Volver al Inicio" en menú principal

### PRIORIDAD BAJA

#### 10. Vista 3D táctica (integración completa)
- Integrar MAIRA 3D Master
- Renderizar unidades como modelos GLB
- Sistema de zoom multinivel 2D ↔ 3D
- Órdenes visualizadas en 3D
- Animaciones de combate 3D

#### 11-16. Otros
- Sistema de condiciones de victoria
- Sistema de guardado/carga de partidas
- Sistema de replay de batallas
- Estadísticas detalladas post-batalla
- Tutorial integrado
- Testing exhaustivo y documentación final

---

## 🔒 VALIDACIONES PENDIENTES

### Validaciones de Zonas y Sectores

#### Sector (Fase Preparación)
- ✅ **Área válida:** Entre 25 km² y 500 km² (implementado)
- ✅ **Forma:** Polígono dibujado con Leaflet.Draw
- ✅ **showArea: true** para mostrar área en tiempo real
- ❌ **Sin intersección consigo mismo** (pendiente)
- **Archivo:** FaseManager.js líneas 189-205

#### Zonas Azul y Roja (Fase Preparación)
- ❌ **Dentro del sector:** Ambas zonas completamente dentro del sector (PENDIENTE)
- ❌ **Sin superposición:** Zona azul y zona roja NO se sobreponen (PENDIENTE)
- ❌ **Distancia mínima:** Separación mínima entre zonas (PENDIENTE)
- **Archivo:** FaseManager.js, crear ValidacionesTerritorioManager.js

### Validaciones de Despliegue

#### Al colocar elementos (Fase Despliegue)
- ❌ **Dentro de zona del jugador:** Unidades azules en zona azul, rojas en zona roja (PENDIENTE)
- ❌ **SIDC válido:** Código SIDC bien formado (PENDIENTE)
- ❌ **Tipo de unidad reconocido:** Infantería, Blindado, Artillería, etc. (PENDIENTE)
- ❌ **Sin superposición de unidades** en mismo hexágono (PENDIENTE)
- **Archivos:** simbolosP.js, crear ValidacionesDespliegue.js

#### Validación de SIDC y Colores
- ❌ **SIDC amigo (S*F*...)** → Solo puede ir en zona azul, color azul (PENDIENTE)
- ❌ **SIDC enemigo (S*H*...)** → Solo puede ir en zona roja, color rojo (PENDIENTE)
- ❌ **Rechazar SIDC neutral/desconocido** durante despliegue (PENDIENTE)
- **Archivo:** simbolosP.js

### Validaciones de Órdenes

#### OrdenMovimiento
- ✅ **Hexágono destino existe** en el grid (implementado)
- ✅ **Hexágono destino es transitable** según tipo de unidad (implementado)
- ✅ **Ruta calculada válida** (pathfinding encuentra camino) (implementado)
- ✅ **Terreno considerado:** Vegetación, pendiente, tipo de unidad (implementado)
- ❌ **Destino dentro del sector:** Movimiento no puede salir del sector (PENDIENTE)
- ❌ **Pathfinding debe evitar salir del sector** (PENDIENTE)
- **Archivos:** OrdenMovimiento.js, Pathfinding.js

#### OrdenAtaque
- ✅ **Objetivo existe** y es válido (implementado)
- ✅ **Dentro de rango de ataque** según tipo de unidad (implementado)
- ✅ **Línea de vista (LOS)** existe (implementado)
- ❌ **LOS bloqueado por terreno 3D** (pendiente - actualmente 2D simple)
- ❌ **Objetivo dentro del sector** (PENDIENTE)
- **Archivo:** OrdenAtaque.js

### Validaciones de Hexágonos

#### Transitabilidad
- ✅ **Vegetación:** Bosque denso ×3, Bosque ×2, Ligera ×1.5 (implementado)
- ✅ **Pendiente:** >20° ×2.5, >10° ×1.5 (implementado)
- ❌ **Agua/Pantano/Roca intransitables** para vehículos (pendiente)
- **Archivo:** Pathfinding.js, transitabilidadHandler.js

#### Ocupación
- ❌ **Un hexágono = una unidad** (pendiente)
- ❌ **Validación de ocupante** antes de movimiento (pendiente)
- **Archivo:** Hexagono.js (sistema base)

### Validaciones de Turnos

#### Confirmación de órdenes
- ✅ **Todas las órdenes validadas** antes de confirmar (implementado)
- ❌ **Al menos una orden válida** (opcional, pendiente)
- ❌ **Tiempo de planificación no excedido** (pendiente)
- **Archivo:** GestorOrdenesV2.js

---

## 📁 ARCHIVOS CLAVE DEL SISTEMA

### CORE
```
/Client/js/modules/juegoV2/core/
├── InicializadorJuegoV2.js      (1650 líneas) - Inicialización y UI
├── GestorOrdenesV2.js           (930 líneas)  - Sistema central órdenes
├── FaseManager.js               (946 líneas)  - Gestión de fases ⚠️ BLOQUEADO
├── TurnosManager.js             (pendiente)   - Gestión de turnos
└── EstadoJuego.js              (pendiente)   - Estado centralizado
```

### ORDENES
```
/Client/js/modules/juegoV2/ordenes/
├── OrdenBase.js                 (280 líneas)  - Clase abstracta ✅
├── OrdenMovimiento.js           (350 líneas)  - Movimiento + A* ✅
├── OrdenAtaque.js              (400 líneas)  - Ataque + LOS ✅
├── OrdenesQueueV2.js           (500 líneas)  - Cola secuencial ✅
├── OrdenDefensa.js             (pendiente)   - Defensa ❌
├── OrdenReconocimiento.js      (pendiente)   - Reconocimiento ❌
└── OrdenEspera.js              (pendiente)   - Espera ❌
```

### UI
```
/Client/js/modules/juegoV2/ui/
├── PanelCoordinacionOrdenes.js  (778 líneas)  - Timeline visual ✅
├── PanelCoordinacionOrdenes.css (pendiente)   - Estilos (inline por ahora)
└── NotificacionesV2.js         (pendiente)   - Sistema notificaciones
```

### UTILS
```
/Client/js/modules/juegoV2/utils/
├── Pathfinding.js               (450 líneas)  - A* sobre hexgrid ✅
├── LineaDeVista.js             (pendiente)   - LOS con terreno 3D ❌
└── ValidacionesGeometricas.js  (pendiente)   - Validaciones zona/sector ❌
```

### HTML
```
/Client/
├── juegodeguerraV2.html         (3500 líneas) - Página principal V2 ✅
└── iniciarpartida.html          (modificar)   - Integración inicio ⚠️
```

---

## 🗺️ ROADMAP

### Sprint 1 (Esta semana) - Validaciones
- [x] Z-index hierarchy corregido
- [x] Panel coordinación controlado por usuario
- [x] Sistema turnos despliegue LOCAL
- [ ] Validar menú agregar por fase
- [ ] Validar elementos en zona correcta
- [ ] Validar zonas dentro de sector
- [ ] Validar órdenes dentro de sector

### Sprint 2 (Próxima semana) - Desbloqueo
- [ ] Migrar FaseManager.js a Leaflet.Draw
- [ ] Verificar endpoints servidor
- [ ] Arreglar creación partidas online
- [ ] Panel elementos LOCAL filtrado por turno

### Sprint 3 (2 semanas) - Combate
- [ ] CombateResolver.js básico
- [ ] Sistema de bajas
- [ ] Moral de unidades
- [ ] Efectos visuales básicos

### Sprint 4 (3 semanas) - Visibilidad
- [ ] Niebla de guerra
- [ ] LOS con terreno 3D
- [ ] Sistema de sensores

### Sprint 5-8 (2 meses) - 3D y Pulido
- [ ] Integración 3D completa
- [ ] Testing exhaustivo
- [ ] Documentación final
- [ ] Release v2.0

---

## 🔗 DOCUMENTACIÓN RELACIONADA

### Documentos Activos
- `PROYECTO_JUEGO_GUERRA_V2.md` - Visión y arquitectura completa
- `SISTEMA_ORDENES_V2_IMPLEMENTADO.md` - Referencia técnica sistema de órdenes
- `INTEGRACION_COMPLETA_JUEGO_V2.md` - Documentación integración UI
- `ESTADO_ACTUAL_JUEGOV2.md` - **Este documento** (estado consolidado)

### Documentos Archivados
- `GUIA_PRUEBA_JUEGOV2.md` → Archivar (info en SISTEMA_ORDENES)
- `PRUEBAS_JUEGO_V2_CON_MARCADORES.md` → Archivar (info en INTEGRACION_COMPLETA)
- `TAREAS_PENDIENTES_PANEL_JUEGOV2.md` → Archivar (info en ESTADO_ACTUAL)

---

## 📝 NOTAS IMPORTANTES

### Leaflet.Draw vs Geoman
- juegodeguerraV2.html usa **Leaflet.Draw** (cargado en HTML)
- FaseManager.js intenta usar **Geoman** (`map.pm.*`)
- **Por eso no funciona delimitar sector**
- Solución: Cambiar FaseManager a usar Leaflet.Draw

### Chat en Otros Módulos
- MAIRAChat maneja TODOS los chats: iniciarpartida, inicioGB, gestionbatalla, juegodeguerra
- ✅ Todos usan mismos nombres de contenedores, diferente ubicación
- ✅ No rompimos otros módulos con la integración de juegodeguerraV2

### Menús Contextuales
- ✅ **REGLA**: SIEMPRE usar MiRadial.js
- ✅ Excepción: 3D tiene su propio menuRadial3D.js
- ❌ NO usar menús contextuales nativos del navegador

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Implementar validaciones de zona/sector** (4-5 horas)
2. **Migrar FaseManager.js a Leaflet.Draw** (2-3 horas)
3. **Verificar endpoints servidor** (3-4 horas)
4. **Panel elementos LOCAL filtrado** (2 horas)
5. **Ajustes CSS y UX** (2-3 horas)

**Total estimado para flujo completo jugable:** ~15-20 horas

---

**Última actualización:** 2025-11-07
**Responsable:** Claude Code
**Cambios:** Documento consolidado creado, validaciones en progreso
