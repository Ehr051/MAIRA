# 📋 TAREAS PENDIENTES - Panel Integrado Juego de Guerra V2

**Fecha**: 07 de Noviembre 2025
**Branch**: `feature/juego-guerra-v2`

## ✅ COMPLETADO

### 1. Chat Integrado en Panel
- ✅ MAIRAChat.js configurado para juegodeguerraV2
- ✅ Función `crearContenedoresEnPanel()` implementada
- ✅ Chat funcional en sección derecha del panel
- ✅ Selector de destino (Global/Equipo/Director)
- ✅ Estilos coherentes con tema militar

### 2. Doble Click Abre Menú Radial
- ✅ hexgrid.js: doble click en hexágonos abre MiRadial
- ✅ gestorAcciones.js: doble click en elementos abre MiRadial
- ✅ Eliminados paneles directos al hacer doble click

### 3. Panel Inferior con Info Jugador/Equipo
- ✅ Sección Jugador/Equipo agregada entre Fase y Reloj
- ✅ Lógica dinámica según fase (Director en PREPARACIÓN)
- ✅ Colores por equipo (azul/rojo) en COMBATE
- ✅ Rotación de jugadores por turno

### 4. Eliminado Panel Viejo
- ✅ Removido panelInferiorUnificado duplicado de HTML
- ✅ CSS comentado
- ✅ Toggle funciona con flexbox

## ⏳ PENDIENTE

### 1. 🗺️ Desbloquear Clicks para Delimitar Sector

**Problema**: No puedo delimitar el sector, pero desde menú radial "Agregar Objetivo" sí puedo dibujar.

**Causa**: FaseManager.js usa API de Geoman (`map.pm.enableDraw`) pero juegodeguerraV2.html tiene Leaflet.Draw cargado, no Geoman.

**Solución**:
```javascript
// OPCIÓN 1: Cambiar FaseManager.js para usar Leaflet.Draw
// En lugar de: this.map.pm.enableDraw('Polygon', {...})
// Usar: new L.Draw.Polygon(this.map, {...}).enable()

// OPCIÓN 2: Usar herramientas de dibujo existentes de miradial.js
// que ya funcionan para "Agregar Objetivo"
```

**Archivos a modificar**:
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/js/modules/juegoV2/core/FaseManager.js` (líneas 189-205, 282-307)

**Nota**: El doble click que agregamos NO debe abrir menú radial cuando Leaflet.Draw está activo dibujando. Agregar check:
```javascript
// En hexgrid.js y gestorAcciones.js
if (this.map._drawControl && this.map._drawControl._toolbars) {
    // No abrir menú si estamos dibujando
    return;
}
```

---

### 2. 🎨 Achicar Elementos CSS Panel Izquierda

**Objetivo**: Reducir tamaño de elementos en `#panel-seccion-estado` para mejor visualización.

**Cambios a realizar**:
```css
/* En InicializadorJuegoV2.js - seccionIzquierda.innerHTML */

/* Fase - Reducir de 16px a 14px */
#panel-fase-actual { font-size: 14px; }

/* Jugador/Equipo - Reducir de 13px a 11px */
#panel-jugador-actual, #panel-equipo-actual { font-size: 11px; }

/* Turno - Reducir de 14px a 12px */
#panel-turno-actual { font-size: 12px; }

/* Tiempo - Reducir de 24px a 20px */
#panel-tiempo-restante { font-size: 20px; }

/* Padding general - Reducir de 10px a 8px */
div[style*="padding: 10px"] { padding: 8px; }

/* Gap - Reducir de 12px a 8px */
seccionIzquierda gap: 8px;
```

**Archivo**: `InicializadorJuegoV2.js` líneas 383-464

---

### 3. 🌑 Modo Oscuro Matriz de Coordinación

**Objetivo**: Timeline de órdenes debe tener tonos oscuros tácticos, no colores claros.

**Archivo**: `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/js/modules/juegoV2/ui/PanelCoordinacionOrdenes.js`

**Cambios a realizar**:
```css
/* Fondo del timeline */
background: rgba(10, 10, 10, 0.95) → más oscuro

/* Colores de órdenes */
- Movimiento: rgba(33, 150, 243, 0.8) → rgba(33, 100, 180, 0.9)
- Ataque: rgba(244, 67, 54, 0.8) → rgba(180, 40, 30, 0.9)

/* Grid del timeline */
border-color: rgba(255, 255, 255, 0.1) → rgba(0, 255, 0, 0.15)

/* Texto */
color: rgba(255, 255, 255, 0.7) → rgba(0, 255, 0, 0.8)

/* Línea de tiempo actual */
border-left: rgba(255, 193, 7, 0.8) → rgba(0, 255, 0, 0.6)
```

**Principio de diseño**: Todo debe tener el look "militar táctico" con verde fosforescente sobre fondo muy oscuro.

---

### 4. 🔌 Verificar Endpoints Servidor

**Objetivo**: Verificar que serverhttps.py y app.py tienen endpoints para sincronizar:
- Sector delimitado
- Zonas (azul/roja)
- Turnos
- Movimientos
- Órdenes

**Archivos a revisar**:
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Server/serverhttps.py`
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Server/app.py`

**Endpoints necesarios**:
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

**Verificar emisores en cliente**:
- InicializadorJuegoV2.js debe emitir eventos al servidor
- FaseManager.js debe sincronizar cambios de fase
- GestorOrdenesV2.js debe enviar órdenes

---

### 5. 🗑️ Sacar Botones Deshacer/Rehacer/Volver

**Ubicación actual**: Panel inferior de planeamiento.html, gestionbatalla.html, juegodeguerra.html

**Acción**:
1. Remover botones de UI inferior (HTML inline o generados por JS)
2. Mover "Deshacer/Rehacer" a:
   - Menú > Opciones (opcional, ya están en atajos de teclado)
   - Documentar en Menú > Ayuda que Ctrl+Z / Ctrl+Y funcionan
3. Botón "Volver" (🏠):
   - Agregar en menú principal (donde está "Opciones 3D")
   - Debe llevar al carousel de inicio

**Archivos a modificar**:
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/planeamiento.html`
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/planeamiento_integrado.html`
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/gestionbatalla.html`
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/juegodeguerra.html`
- `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/juegodeguerraV2.html`

**Buscar por**:
```bash
grep -r "deshacer\|rehacer\|volver\|undo\|redo" *.html
```

---

### 6. 🛠️ Mover "Opciones 3D" a Menú Herramientas

**Problema**:
- Botón "Opciones 3D" está en menú principal pero debería estar en Herramientas
- Hay un botón dentro de Herramientas con ese nombre que NO funciona
- El del menú principal SÍ funciona

**Solución**:
1. Encontrar botón funcional "Opciones 3D" en menú principal
2. Removerlo del menú principal
3. Reemplazar el no-funcional dentro de Herramientas con el funcional
4. Agregar botón "🏠 Volver al Inicio" en su lugar (menú principal)

**Archivos a buscar**:
```bash
grep -r "Opciones 3D\|opciones3d\|toggleVista3D" Client/*.html Client/js/**/*.js
```

---

## 🔍 NOTAS IMPORTANTES

### Menús Contextuales
- ✅ **REGLA**: SIEMPRE usar MiRadial.js
- ✅ Excepción: 3D tiene su propio menuRadial3D.js
- ❌ NO usar menús contextuales nativos del navegador

### Leaflet.Draw vs Geoman
- juegodeguerraV2.html usa **Leaflet.Draw** (cargado en HTML)
- FaseManager.js intenta usar **Geoman** (`map.pm.*`)
- Por eso no funciona delimitar sector
- Solución: Cambiar FaseManager a usar Leaflet.Draw o herramientas existentes de miradial.js

### Chat en Otros Módulos
- MAIRAChat maneja TODOS los chats: iniciarpartida, inicioGB, gestionbatalla, juegodeguerra
- ✅ Todos usan mismos nombres de contenedores, diferente ubicación
- ✅ No rompimos otros módulos con la integración de juegodeguerraV2

### 3D en Planeamiento
- Sistema 3D disponible en planeamiento_integrado.html
- Revisar logs para verificar inicialización correcta
- toggleVista3D debe funcionar correctamente

---

## 📝 COMANDOS ÚTILES

```bash
# Ver estado del repositorio
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
git status

# Ver commits recientes
git log --oneline -10

# Buscar referencias a Geoman
grep -r "geoman\|pm.enableDraw\|map.pm" Client/js/

# Buscar botones de UI inferior
grep -r "deshacer\|rehacer\|volver" Client/*.html

# Ver diferencias desde main
git diff main --name-only
```

---

## 🚀 PRÓXIMOS PASOS

1. **PRIORIDAD ALTA**: Desbloquear sector (cambiar a Leaflet.Draw)
2. CSS panel izquierda (rápido, 10 min)
3. Modo oscuro matriz (medio, 20 min)
4. Verificar endpoints (importante para online)
5. Limpiar botones inferiores (rápido, 15 min)
6. Reorganizar menús (rápido, 10 min)

**Tiempo estimado total**: ~2 horas

---

## 📦 ARCHIVOS MODIFICADOS EN ESTA SESIÓN

```
Client/js/common/MAIRAChat.js
Client/js/modules/juegoV2/core/InicializadorJuegoV2.js
Client/js/modules/juego/hexgrid.js
Client/js/modules/juego/gestorAcciones.js
Client/juegodeguerraV2.html
```

**Commits realizados**:
1. `b2c83b9c` - 💬 Integrar MAIRAChat en panel JuegoV2
2. `37741db4` - 🖱️ Fix: Doble click abre menú radial (no paneles directos)
3. `8e92b0e7` - 🐛 Fix: Corregir toggle panel - Mantener layout flexbox
4. `43ec7ceb` - Eliminar panel viejo + Agregar info Jugador/Equipo

---

**Para continuar en próximo chat**: Leer este documento y comenzar con Tarea #1 (Desbloquear sector).
