# TESTING LOCAL - Servidor Iniciado Exitosamente

**Fecha**: 16 de octubre de 2025  
**Hora**: ~19:50  
**Estado**: ✅ SERVIDOR CORRIENDO

---

## ✅ SERVIDOR INICIADO

### Configuración
- **URL**: http://localhost:5000
- **Python**: 3.10 (con gevent instalado)
- **Proceso**: PID 68025
- **Logs**: `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/server.log`

### Verificaciones Automáticas
```
✅ Dependencias Node.js verificadas (7/7)
✅ Server initialized for gevent ← CRÍTICO
✅ Directorio tiles configurado
✅ Servidor respondiendo en puerto 5000
✅ Página principal carga correctamente
```

---

## 🎯 CHECKLIST DE TESTING MANUAL

### 1. Verificación Básica del Servidor
- [x] Servidor inicia sin errores
- [x] Página principal carga (http://localhost:5000)
- [ ] Verificar que aparece título "MAIRA - Mesa de Arena Interactiva"

### 2. Testing de WebSocket

**Pasos**:
1. Abrir http://localhost:5000 en navegador
2. Abrir DevTools (F12 o Cmd+Option+I)
3. Ir a tab **Network**
4. Filtrar por **WS** (WebSocket)
5. Recargar página

**Verificar**:
- [ ] Aparece conexión WebSocket en lista
- [ ] Status: **101 Switching Protocols** ← CRÍTICO
- [ ] Connection: Upgrade
- [ ] Upgrade: websocket
- [ ] Messages tab muestra eventos (ping/pong)

**Log esperado en consola**:
```javascript
[GestorComunicacion] Socket conectado
[GestorComunicacion] Transport: websocket ← DEBE SER 'websocket'
```

**Si muestra 'polling'**: WebSocket upgrade falló, pero funciona con fallback.

---

### 3. Testing de Chat

**Pasos**:
1. Iniciar sesión en MAIRA
2. Abrir el chat
3. Enviar un mensaje

**Verificar**:
- [ ] Mensaje se envía inmediatamente
- [ ] Mensaje aparece en el chat sin recargar
- [ ] Sin errores en consola

**Log esperado**:
```javascript
[Socket] Enviando mensaje al servidor
[Socket] Mensaje recibido del servidor
```

---

### 4. Testing de Rooms (Partidas)

**Pasos**:
1. Crear una partida nueva
2. En otra ventana/incógnito, unirse a la misma partida
3. Verificar sincronización

**Verificar**:
- [ ] Ambos jugadores se ven en la partida
- [ ] Cambios de un jugador se reflejan en el otro
- [ ] Sin errores de room no encontrada

---

### 5. Testing de Sistema de Turnos

#### 5.1 Fase Despliegue (SIN TIMER)

**Pasos**:
1. Iniciar partida nueva
2. Avanzar a fase **Preparación → Despliegue**
3. Observar interfaz

**Verificar**:
- [ ] **NO aparece** timer/reloj
- [ ] **SÍ aparece** indicador de turno
- [ ] Jugadores pueden actuar simultáneamente
- [ ] Console.log: `[GestorTurnos] inicializarTurnosDespliegue`

**Log esperado**:
```javascript
[GestorTurnos] Actualizando según fase: preparacion/despliegue
[GestorTurnos] Inicializando turnos para DESPLIEGUE (sin timer)
```

#### 5.2 Fase Combate (CON TIMER)

**Pasos**:
1. Completar despliegue de todos los jugadores
2. Iniciar fase **Combate**
3. Observar interfaz

**Verificar**:
- [ ] **SÍ aparece** timer/reloj funcionando
- [ ] Timer cuenta regresiva (60 segundos)
- [ ] Indicador de turno actualiza
- [ ] Console.log: `[GestorTurnos] inicializarTurnosCombate`

**Log esperado**:
```javascript
[GestorTurnos] Actualizando según fase: combate/combate
[GestorTurnos] Inicializando turnos para COMBATE (con timer)
[GestorTurnos] Timer iniciado: 60 segundos
```

---

### 6. Testing de Modal de Estado de Jugadores

**Pasos**:
1. Estar en fase despliegue con múltiples jugadores
2. Buscar botón "Ver Estado de Jugadores" o similar
3. Click en el botón

**Verificar**:
- [ ] Modal aparece con lista de jugadores
- [ ] Muestra estado de cada jugador:
  - ✅ Listo (completó despliegue)
  - ⏳ Desplegando... (aún no completa)
- [ ] Modal se actualiza en tiempo real
- [ ] Botón "Cerrar" funciona

**HTML esperado**:
```html
<div class="modal-estado-jugadores">
  <div class="jugador-item listo">
    <span>Jugador 1</span>
    <span>✅ Listo</span>
  </div>
  <div class="jugador-item pendiente">
    <span>Jugador 2</span>
    <span>⏳ Desplegando...</span>
  </div>
</div>
```

---

### 7. Testing de Clicks en map

#### 7.1 Delimitar Sector

**Pasos**:
1. Iniciar partida como Director
2. Fase **Preparación → Definición de Sector**
3. Click en botón "Definir Sector"
4. Hacer clicks en el map para crear polígono

**Verificar**:
- [ ] Log en consola: `🎨 Modo dibujo activo - L.Draw manejando clicks`
- [ ] Cada click crea un vértice del polígono
- [ ] Líneas amarillas conectan los vértices
- [ ] Polígono se cierra al hacer doble-click o click en primer punto
- [ ] Aparece botón "Confirmar Sector"

**Log esperado**:
```javascript
[GestorFases] iniciarDefinicionSector
🎨 Modo dibujo activo - L.Draw manejando clicks
[L.Draw] Vértice añadido: {lat: ..., lng: ...}
```

#### 7.2 Definir Zona Roja

**Pasos**:
1. Después de confirmar sector
2. Click en "Definir Zona Roja"
3. Hacer clicks en el map

**Verificar**:
- [ ] Log: `🎨 Modo dibujo activo - L.Draw manejando clicks`
- [ ] Polígono se dibuja con estilo rojo
- [ ] Aparece botón "Confirmar Zona Roja"

#### 7.3 Definir Zona Azul

**Pasos**:
1. Después de confirmar zona roja
2. Click en "Definir Zona Azul"
3. Hacer clicks en el map

**Verificar**:
- [ ] Log: `🎨 Modo dibujo activo - L.Draw manejando clicks`
- [ ] Polígono se dibuja con estilo azul
- [ ] Aparece botón "Confirmar Zona Azul"

---

### 8. Testing de Menú Radial

**Pasos**:
1. Estar en fase combate (NO en modo dibujo)
2. Click **izquierdo** en el map
3. Click **derecho** (contextmenu) en el map

**Verificar**:
- [ ] Menú radial aparece en ambos clicks
- [ ] Opciones del menú son relevantes a la posición
- [ ] Click fuera del menú lo cierra
- [ ] **NO interfiere** con modo dibujo cuando está activo

---

## 🐛 DEBUGGING - Comandos Útiles

### Ver logs del servidor en tiempo real
```bash
tail -f /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/server.log
```

### Verificar proceso corriendo
```bash
ps aux | grep 'python3.10 app.py'
```

### Detener servidor
```bash
kill 68025
# O más agresivo:
lsof -ti:5000 | xargs kill -9
```

### Reiniciar servidor
```bash
cd '/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0'
python3.10 app.py > server.log 2>&1 &
```

### Ver últimas líneas de log
```bash
tail -50 /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/server.log
```

---

## 🔍 DEBUGGING EN NAVEGADOR

### Console.log estratégicos a buscar:

**WebSocket**:
```javascript
🔌 [GestorComunicacion] Socket conectado
🔌 [GestorComunicacion] Transport: websocket
```

**Turnos**:
```javascript
[GestorTurnos] Inicializando turnos para DESPLIEGUE (sin timer)
[GestorTurnos] Inicializando turnos para COMBATE (con timer)
[GestorTurnos] Timer iniciado: 60 segundos
```

**Clicks en map**:
```javascript
🎨 Modo dibujo activo - L.Draw manejando clicks
[GestorFases] iniciarDefinicionSector
[GestorFases] Sector confirmado
```

### Verificar estado de objetos globales:

```javascript
// En consola del navegador:
console.log('Socket:', window.gestorJuego?.gestorComunicacion?.socket);
console.log('Connected:', window.gestorJuego?.gestorComunicacion?.socket?.connected);
console.log('Transport:', window.gestorJuego?.gestorComunicacion?.socket?.io?.engine?.transport?.name);
console.log('Fase:', window.gestorJuego?.gestorFases?.fase);
console.log('Subfase:', window.gestorJuego?.gestorFases?.subfase);
console.log('Temporizador:', window.gestorJuego?.gestorTurnos?.temporizador);
console.log('dibujandoSector:', window.gestorJuego?.gestorFases?.dibujandoSector);
```

---

## ⚠️ PROBLEMAS COMUNES

### Problema 1: WebSocket no funciona (muestra 'polling')

**Síntoma**: Transport muestra 'polling' en lugar de 'websocket'

**Posibles causas**:
1. Navegador no soporta WebSocket
2. Proxy/firewall bloqueando WebSocket
3. Error en upgrade del protocolo

**Solución**:
- Verificar que navegador soporta WebSocket
- Probar en otro navegador
- Verificar que no hay errores en Network tab
- **NOTA**: 'polling' funciona como fallback, no es crítico

### Problema 2: Timer aparece en despliegue

**Síntoma**: Timer cuenta regresiva durante fase despliegue

**Causa**: `inicializarTurnosDespliegue()` no se está llamando

**Solución**:
1. Verificar console.log de fase/subfase
2. Verificar que `actualizarSegunFase()` se llama
3. Verificar condición: `if (subfase === 'despliegue')`

### Problema 3: Clicks en map no funcionan

**Síntoma**: No se dibuja nada al hacer click

**Debugging**:
1. Buscar log `🎨 Modo dibujo activo`
   - Si NO aparece: `gestorFases.dibujandoSector` está en false
2. Verificar en consola:
   ```javascript
   window.gestorJuego?.gestorFases?.dibujandoSector
   window.gestorJuego?.gestorFases?.herramientasDibujo
   ```
3. Verificar que botón "Definir Sector" llama a `iniciarDefinicionSector()`

### Problema 4: Modal no aparece

**Síntoma**: Botón "Ver Estado" no muestra modal

**Causa**: Método `mostrarEstadoJugadores()` no se llama

**Solución**:
1. Verificar que botón tiene event listener
2. Verificar en consola:
   ```javascript
   window.gestorJuego?.gestorTurnos?.mostrarEstadoJugadores
   ```
3. Llamar manualmente:
   ```javascript
   window.gestorJuego?.gestorTurnos?.mostrarEstadoJugadores([])
   ```

---

## 📊 RESULTADOS ESPERADOS

Al completar todos los tests:

| Feature | Estado Esperado |
|---------|-----------------|
| Servidor inicia | ✅ Sin errores |
| WebSocket upgrade | ✅ 101 Switching Protocols |
| Chat tiempo real | ✅ Funciona sin recargar |
| Rooms sincronización | ✅ Cambios se reflejan |
| Turnos despliegue | ✅ Sin timer |
| Turnos combate | ✅ Con timer (60s) |
| Modal estado | ✅ Aparece y actualiza |
| Clicks sector | ✅ Dibuja polígono |
| Clicks zonas | ✅ Dibuja zonas roja/azul |
| Menú radial | ✅ Aparece fuera de modo dibujo |

---

## 🎯 SIGUIENTE PASO

Una vez completado el testing local exitosamente:

1. **Documentar resultados**: Marcar checklist con ✅ o ❌
2. **Reportar issues**: Si algo falla, documentar exactamente qué
3. **Deploy a producción**: Si todo funciona, push a repositorio
4. **Monitorear logs**: Verificar que funciona en Render.com

---

**Estado actual**: ✅ Servidor corriendo, listo para testing manual en navegador

**URL de testing**: http://localhost:5000

**Siguiente acción**: Abrir navegador y ejecutar checklist de testing
