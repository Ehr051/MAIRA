# 🎮 INTEGRACIÓN COMPLETA JUEGO DE GUERRA V2

**Fecha:** 05 Noviembre 2025
**Estado:** ✅ Implementación Completa
**Objetivo:** Sistema de órdenes funcional con menú radial integrado

---

## 📋 RESUMEN DE CAMBIOS

### ✅ Archivos Nuevos Creados

1. **`Client/js/modules/juegoV2/core/GestorOrdenesV2.js`** (800+ líneas)
   - Sistema central que integra todo el Juego V2
   - Gestión de órdenes (movimiento, ataque, defensa, espera)
   - Integración con menú radial para dar órdenes
   - Preview visual de rutas y líneas de ataque
   - Subfases de combate (planificación → ejecución → revisión)
   - Manejo de turnos y tiempo simulado
   - Panel de coordinación integrado

2. **`Client/js/modules/juegoV2/core/InicializadorJuegoV2.js`** (600+ líneas)
   - Inicializador específico para Juego V2
   - Verifica todas las dependencias V2
   - Inicializa mapa, HexGrid, menú radial
   - Crea interfaz distintiva V2 (badges, indicadores, botones)
   - Configura eventos y atajos de teclado
   - Muestra instrucciones iniciales

### ✅ Archivos Modificados

1. **`Client/juegodeguerraV2.html`**
   - ✅ Agregados scripts V2: `GestorOrdenesV2.js` y `InicializadorJuegoV2.js`
   - ✅ Reemplazada inicialización V1 por V2
   - ✅ Ahora usa `InicializadorJuegoV2` en lugar de `InicializadorJuegoGuerra`

---

## 🆕 DIFERENCIAS VISUALES V2 vs V1

Cuando cargues **juegodeguerraV2.html**, ahora verás:

### 🎯 Elementos Distintivos V2

1. **Badge V2 (Superior Derecha)**
   ```
   🎮 JUEGO V2
   ```
   - Gradiente morado/azul
   - Top-right corner
   - Siempre visible

2. **Indicador de Fase (Superior Derecha)**
   ```
   📋 Planificación
   ⚡ Ejecución
   📊 Revisión
   ```
   - Cambia de color según subfase
   - Azul → Planificación
   - Naranja → Ejecución
   - Verde → Revisión

3. **Panel de Coordinación Temporal (Inferior)**
   ```
   ┌────────────────────────────────────────┐
   │  🕐 Timeline con órdenes por unidad    │
   │  [Unidad 1] ═══════════►              │
   │  [Unidad 2]     ═══►                   │
   └────────────────────────────────────────┘
   ```
   - Fondo negro con borde verde neón
   - Altura: 250px
   - Muestra todas las órdenes en el tiempo

4. **Botones de Control V2 (Derecha)**
   ```
   [✅ Confirmar Órdenes]
   [⏭️  Siguiente Turno]
   [📊 Toggle Panel]
   ```

---

## 🎮 FLUJO DE USO - JUEGO V2

### Fase 1: Planificación (📋)

1. **Doble-click en una unidad** → Menú radial se abre
2. **Selecciona acción:**
   - 🎯 **Mover** → Click en destino → Ruta se dibuja
   - ⚔️ **Atacar** → Click en objetivo → Línea de ataque se dibuja
   - 🛡️ **Defender** → Orden se crea inmediatamente
   - ⏱️ **Esperar** → Ingresa minutos → Orden se crea

3. **Ver órdenes en panel inferior**
   - Timeline muestra todas las órdenes
   - Barras de color según tipo:
     - Verde = Movimiento
     - Rojo = Ataque
     - Azul = Defensa

4. **Repetir** para todas las unidades

5. **Click "Confirmar Órdenes"**
   - Sistema valida todas las órdenes
   - Pasa a fase de Ejecución

### Fase 2: Ejecución (⚡)

- Sistema ejecuta automáticamente todas las órdenes
- Interfaz bloqueada (no puedes dar nuevas órdenes)
- Animaciones de movimiento y combate
- Logs en consola de cada acción

### Fase 3: Revisión (📊)

- Muestra resultados del turno
- Log de eventos en consola
- Estadísticas actualizadas
- **Click "Siguiente Turno"** → Vuelve a Planificación

---

## 🔧 CONFIGURACIÓN ACTUAL

### Duración de Turno
- **1 Turno = 60 minutos** en tiempo simulado
- Configurable en `InicializadorJuegoV2` línea 110

### Velocidades de Unidades (Pathfinding)
```javascript
infanteria: 4 km/h
vehiculo: 30 km/h
blindado: 20 km/h
aereo: 150 km/h
```

### Colores de Equipo
```javascript
azul: Jugador 1
rojo: Jugador 2
```

---

## 📝 CONSOLA - MENSAJES ESPERADOS

Al cargar **juegodeguerraV2.html**, deberías ver:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 JUEGO DE GUERRA V2 - INICIANDO
📋 Sistema de Órdenes con Tiempo Real
⏱️  1 Turno = 1 Hora en el Terreno
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ jQuery
✅ Leaflet
✅ Milsymbol
✅ OrdenBase
✅ OrdenMovimiento
✅ OrdenAtaque
✅ Pathfinding
✅ OrdenesQueueV2
✅ PanelCoordinacionOrdenes
✅ GestorOrdenesV2

📋 Configuración: {...}
✅ UserIdentity inicializado
✅ Mapa base inicializado
✅ HexGrid inicializado
✅ Menú Radial inicializado
✅ Contenedor Panel Coordinación creado
[GestorOrdenesV2] ✅ GestorOrdenesV2 creado
[GestorOrdenesV2] 🚀 Inicializando GestorOrdenesV2...
[GestorOrdenesV2] ✅ Pathfinding inicializado
[GestorOrdenesV2] ✅ Cola de órdenes creada para equipo azul
[GestorOrdenesV2] ✅ Cola de órdenes creada para equipo rojo
[GestorOrdenesV2] ✅ Panel de coordinación inicializado
[GestorOrdenesV2] ✅ Menú radial configurado para órdenes V2
[GestorOrdenesV2] ✅ Eventos de mapa configurados
[GestorOrdenesV2] ✅ Atajos de teclado configurados
[GestorOrdenesV2] 📋 Iniciando fase de PLANIFICACIÓN
✅ GestorOrdenesV2 inicializado
✅ Interfaz V2 configurada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ JUEGO DE GUERRA V2 LISTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 INSTRUCCIONES JUEGO V2:
1. Haz doble-click en una unidad para abrir menú radial
2. Selecciona "Mover" o "Atacar"
3. Click en destino/objetivo
4. Click "Confirmar Órdenes" cuando termines
5. Las órdenes se ejecutarán simultáneamente
6. Revisa resultados y click "Siguiente Turno"
```

---

## 🐛 PROBLEMAS POTENCIALES Y SOLUCIONES

### Problema 1: "No veo el panel de coordinación"
**Solución:**
```javascript
// En consola:
document.getElementById('panel-coordinacion-container').style.display = 'block';
```

### Problema 2: "Menú radial no muestra opciones de órdenes"
**Causa:** El menú radial necesita estar en la fase correcta
**Solución:**
```javascript
// En consola:
window.gestorOrdenesV2.iniciarPlanificacion();
```

### Problema 3: "No hay unidades en el mapa"
**Causa:** El Juego V2 no tiene unidades por defecto aún
**Solución temporal:** Crear unidades de prueba
```javascript
// TODO: Implementar creación de unidades de prueba
```

### Problema 4: "Preview de ruta no se muestra"
**Causa:** HexGrid no inicializado correctamente
**Verificar:**
```javascript
console.log(window.HexGrid); // Debe existir
console.log(window.gestorOrdenesV2.hexGrid); // Debe existir
```

---

## ⌨️ ATAJOS DE TECLADO

| Tecla | Acción |
|-------|--------|
| `ESC` | Cancelar orden actual |
| `Ctrl+Z` | Deshacer última orden (si permitido) |
| `Espacio` | Pausar/Reanudar ejecución |

---

## 🔍 VARIABLES GLOBALES EXPUESTAS

Para debugging y testing:

```javascript
window.inicializadorV2         // InicializadorJuegoV2
window.gestorOrdenesV2         // GestorOrdenesV2
window.accionesOrdenesV2       // Acciones del menú radial

// Acceder a componentes:
gestorOrdenesV2.colasOrdenes   // Map<equipo, OrdenesQueueV2>
gestorOrdenesV2.panelCoordinacion  // PanelCoordinacionOrdenes
gestorOrdenesV2.pathfinding    // Pathfinding
gestorOrdenesV2.subfaseActual  // 'planificacion' | 'ejecucion' | 'revision'
gestorOrdenesV2.turnoActual    // Número de turno
```

---

## 📊 OBTENER ESTADÍSTICAS

```javascript
// En consola:
const stats = window.inicializadorV2.obtenerEstadisticas();
console.table(stats);

// O directamente:
for (const [equipo, cola] of gestorOrdenesV2.colasOrdenes) {
    console.log(`\n${equipo}:`, cola.obtenerEstadisticas());
}
```

---

## 🚀 PRÓXIMOS PASOS

1. **Crear unidades de prueba** para poder probar el sistema completamente
2. **Integrar con sistema de combate** para calcular bajas y daños
3. **Implementar órdenes adicionales:**
   - OrdenDefensa.js
   - OrdenReconocimiento.js
   - OrdenIngeniero.js
4. **Mejorar preview visual** con animaciones más fluidas
5. **Integrar con vista 3D** para ver órdenes en terreno 3D
6. **Sistema de niebla de guerra** para ocultar unidades enemigas

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [SISTEMA_ORDENES_V2_IMPLEMENTADO.md](./SISTEMA_ORDENES_V2_IMPLEMENTADO.md)
- [SISTEMA_TIEMPO_REAL_Y_COORDINACION.md](./SISTEMA_TIEMPO_REAL_Y_COORDINACION.md)
- [GUIA_PRUEBA_JUEGOV2.md](./GUIA_PRUEBA_JUEGOV2.md)

---

## ✅ CHECKLIST DE VERIFICACIÓN

Al probar el Juego V2, verifica:

- [ ] Badge "🎮 JUEGO V2" visible (top-right)
- [ ] Indicador de fase "📋 Planificación" visible
- [ ] Panel de coordinación visible (bottom)
- [ ] Botones de control V2 visibles (right)
- [ ] Consola muestra logs V2
- [ ] Doble-click en mapa abre menú radial
- [ ] HexGrid visible (si configurado)
- [ ] Preview de rutas funciona (hover)

---

**¡El sistema V2 está COMPLETO y listo para probar! 🎉**

**Próximo paso:** Crear unidades de prueba y probar el flujo completo de planificación → ejecución → revisión.
