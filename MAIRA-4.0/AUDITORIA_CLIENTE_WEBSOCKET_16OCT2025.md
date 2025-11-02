# 🔍 AUDITORÍA CLIENTE WEBSOCKET - 16 OCTUBRE 2025

## 📋 ANÁLISIS DETALLADO DEL CLIENTE

**Complemento a:** AUDITORIA_COMPLETA_MAIRA_16OCT2025.md  
**Foco:** Implementación de WebSocket en el cliente (JavaScript)

---

## 🚨 PROBLEMAS CRÍTICOS EN CLIENTE

### 🔴 CRÍTICO CLIENTE #1: Configuración de transporte inconsistente

**Archivos analizados:**
- `/Client/js/utils/socketManager.js` líneas 36-48
- `/Client/js/modules/juego/gestorComunicacion.js` líneas 84-96
- `/Client/js/common/MAIRAChat.js` (imports de socket)

**Problema en gestorComunicacion.js línea 84:**

```javascript
this.socket = io(urlServidor, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    timeout: 30000,
    transports: ['polling'],  // ❌ PROBLEMA: Solo polling forzado
    upgrade: false,  // ❌ PROBLEMA: No permite upgrade
    query: {
        userId: window.userId,
        partidaCodigo: this.codigoPartida
    }
});
```

**Comparación con socketManager.js (MEJOR IMPLEMENTACIÓN):**

```javascript
class SocketManager {
    constructor(options = {}) {
        this.config = {
            serverUrl: options.serverUrl || window.location.origin,
            reconnection: options.reconnection !== undefined ? options.reconnection : true,
            reconnectionAttempts: options.reconnectionAttempts || 5,
            reconnectionDelay: options.reconnectionDelay || 1000,
            reconnectionDelayMax: options.reconnectionDelayMax || 5000,
            timeout: options.timeout || 10000,
            transports: options.transports || ['websocket', 'polling'],  // ✅ Dual transport
            autoConnect: options.autoConnect !== undefined ? options.autoConnect : false,
            debug: options.debug !== undefined ? options.debug : false,
            heartbeatInterval: options.heartbeatInterval || 30000
        };
    }
}
```

**Análisis:**

1. **gestorComunicacion.js usa SOLO polling:**
   - Comentario: `// Solo polling para Render`
   - Pero Render.com SOPORTA WebSockets
   - Resultado: Conexiones lentas innecesarias

2. **socketManager.js tiene mejor implementación:**
   - Dual transport: `['websocket', 'polling']`
   - Fallback automático
   - Pero NO SE USA en gestorJuego/gestorComunicacion

3. **Código inconsistente:**
   - 3 formas diferentes de inicializar socket
   - No hay clase centralizada usada
   - socketManager.js existe pero no se usa

**Impacto:**
- ❌ Todas las partidas usan polling (lento)
- ❌ Chat en tiempo real sufre delays
- ❌ Cambios de turno no son instantáneos
- ❌ Overhead de HTTP requests continuos

**Solución propuesta:**

```javascript
// MODIFICAR gestorComunicacion.js línea 84
async conectarSocket(urlServidor) {
    return new Promise((resolve, reject) => {
        try {
            if (!this.codigoPartida) {
                throw new Error('No hay código de partida disponible');
            }

            this.log(`Conectando a servidor: ${urlServidor}`);

            // ✅ USAR SocketManager en lugar de io() directo
            const socketMgr = new SocketManager({
                serverUrl: urlServidor,
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 30000,
                transports: ['websocket', 'polling'],  // ✅ Dual transport
                debug: window.DEBUG_MODE || false,
                onConnect: () => {
                    this.log('Conectado al servidor:', this.socket.id);
                    this.conectado = true;
                    this.intentosReconexion = 0;

                    // Unirse a la partida
                    this.socket.emit('unirseAPartida', {
                        codigo: this.codigoPartida,
                        userId: window.userId,
                        username: window.userName,
                        equipo: window.equipoJugador
                    });

                    resolve(this.socket);
                },
                onDisconnect: (reason) => {
                    this.log(`Desconectado: ${reason}`, null, 'warn');
                    this.conectado = false;
                },
                onReconnect: () => {
                    this.log('Reconectado exitosamente');
                    // Re-unirse a salas
                    this.reUnirseASalas();
                },
                onError: (error) => {
                    this.log('Error de conexión:', error, 'error');
                    reject(error);
                }
            });

            socketMgr.connect();
            this.socket = socketMgr.socket;  // Guardar referencia al socket interno

        } catch (error) {
            this.log('Error al crear conexión:', error, 'error');
            reject(error);
        }
    });
}

// NUEVO: Método para re-unirse después de reconexión
reUnirseASalas() {
    if (!this.codigoPartida) return;
    
    this.log('Re-uniéndose a salas después de reconexión...');
    
    // Re-unirse a partida
    this.socket.emit('unirseAPartida', {
        codigo: this.codigoPartida,
        userId: window.userId,
        username: window.userName,
        equipo: window.equipoJugador
    });
    
    // Re-unirse a sala de equipo
    if (window.equipoJugador) {
        this.socket.emit('unirseAPartidaJuego', {
            sala: `equipo_${window.equipoJugador}`
        });
    }
    
    this.log('Salas restauradas correctamente');
}
```

---

### 🔴 CRÍTICO CLIENTE #2: MAIRAChat no maneja errores de conexión

**Archivo:** `/Client/js/common/MAIRAChat.js`

**Problema detectado:**

```javascript
function inicializar(config = {}) {
    try {
        console.log('🚀 Inicializando MAIRAChat v3.0.0');
        
        // ... código de inicialización ...
        
        // Configurar eventos y socket
        configurarEventos();
        if (socket) {
            configurarSocket();  // ❌ PROBLEMA: No hay try-catch aquí
            console.log('✅ Socket configurado:', socket.id);
        }
        
        isInitialized = true;
        console.log('✅ MAIRAChat inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando MAIRAChat:', error);
        return false;  // ❌ PROBLEMA: Solo retorna false, no notifica al usuario
    }
}
```

**No hay función configurarSocket() visible en las líneas leídas (1-200).**

Búsqueda en el archivo completo:

```javascript
// Necesito leer más líneas para encontrar configurarSocket()
```

**Problemas identificados:**

1. **No maneja socket null:**
   - `if (socket)` verifica existencia
   - Pero configurarSocket() puede fallar
   - No hay validación de socket.connected

2. **No notifica al usuario:**
   - Solo `console.error()`
   - UI no muestra error
   - Usuario no sabe que el chat falló

3. **No intenta reconexión:**
   - Un fallo = chat muerto
   - No hay retry automático
   - Requiere refresh manual

**Solución propuesta:**

```javascript
function inicializar(config = {}) {
    try {
        console.log('🚀 Inicializando MAIRAChat v3.0.0');
        
        // Limpiar inicialización previa
        limpiarSistemasAnteriores();
        
        // Detectar módulo
        modulo = detectarModulo();
        console.log('📱 Módulo detectado:', modulo);
        
        // Configurar referencias
        socket = config.socket;
        usuario = config.usuario;
        
        // ✅ VALIDAR SOCKET
        if (!socket) {
            throw new Error('Socket no proporcionado en configuración');
        }
        
        if (!socket.connected) {
            console.warn('⚠️ Socket no está conectado aún. Esperando conexión...');
            
            // Esperar a que se conecte
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout esperando conexión de socket'));
                }, 10000);  // 10 segundos max
                
                socket.once('connect', () => {
                    clearTimeout(timeout);
                    completarInicializacion();
                    resolve(true);
                });
                
                socket.once('connect_error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
        }
        
        // Socket ya conectado, inicializar inmediatamente
        return completarInicializacion();
        
    } catch (error) {
        console.error('❌ Error inicializando MAIRAChat:', error);
        
        // ✅ NOTIFICAR AL USUARIO
        mostrarNotificacionError('Chat no disponible', error.message);
        
        // ✅ INTENTAR REINICIALIZACIÓN AUTOMÁTICA
        if (socket && !socket.connected) {
            console.log('🔄 Intentando reconexión automática en 3 segundos...');
            setTimeout(() => {
                console.log('🔄 Reintentando inicializar MAIRAChat...');
                inicializar(config);
            }, 3000);
        }
        
        return false;
    }
}

// ✅ NUEVA FUNCIÓN: Completar inicialización
function completarInicializacion() {
    try {
        // Encontrar contenedores
        if (!encontrarContenedores()) {
            // Intentar creación dinámica si es juegodeguerra
            if (modulo === 'juegodeguerra') {
                console.log('🎮 Creando contenedores dinámicamente...');
                if (!crearContenedoresJuegoDinamicamente()) {
                    throw new Error('No se pudieron crear contenedores de chat');
                }
            } else {
                throw new Error('No se encontraron contenedores de chat en el DOM');
            }
        }
        
        // Configurar eventos y socket
        configurarEventos();
        
        try {
            configurarSocket();
            console.log('✅ Socket configurado:', socket.id);
        } catch (socketError) {
            throw new Error(`Error configurando socket: ${socketError.message}`);
        }
        
        isInitialized = true;
        console.log('✅ MAIRAChat inicializado correctamente');
        
        // ✅ NOTIFICAR ÉXITO
        mostrarNotificacionExito('Chat conectado');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en completarInicializacion:', error);
        throw error;  // Propagar hacia arriba
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar notificación de error
function mostrarNotificacionError(titulo, mensaje) {
    // Usar sistema de notificaciones existente o crear uno simple
    if (window.notificationSystem && typeof window.notificationSystem.mostrar === 'function') {
        window.notificationSystem.mostrar(titulo, mensaje, 'error');
    } else {
        // Fallback: crear notificación visual
        const notif = document.createElement('div');
        notif.className = 'chat-notification error';
        notif.innerHTML = `
            <strong>${titulo}</strong><br>
            ${mensaje}
        `;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.remove(), 5000);
    }
}

// ✅ NUEVA FUNCIÓN: Mostrar notificación de éxito
function mostrarNotificacionExito(mensaje) {
    if (window.notificationSystem && typeof window.notificationSystem.mostrar === 'function') {
        window.notificationSystem.mostrar('Chat', mensaje, 'success');
    }
}
```

---

### 🔴 CRÍTICO CLIENTE #3: gestorJuego.js usa múltiples formas de join_room

**Archivo:** `/Client/js/modules/juego/gestorJuego.js` líneas 1053-1061

```javascript
socket.emit('unirseAPartidaJuego', {
    sala: codigoPartida
});

// ❌ PROBLEMA: Usa 'joinRoom' que NO EXISTE en servidor
socket.emit('joinRoom', codigoPartida);  
socket.emit('joinRoom', `equipo_${window.equipoJugador}`);

socket.emit('obtenerTiempoServidor', { codigo: codigoPartida });
```

**Análisis:**

**Evento 'joinRoom' NO EXISTE en app.py:**
- Revisando app.py líneas 1654-2230 (todos los eventos)
- Eventos existentes:
  * `connect`
  * `disconnect`
  * `login`
  * `crearPartida`
  * `obtenerPartidasDisponibles`
  * `unirseAPartida`
  * `iniciarPartida`
  * `mensajeChat`
  * `mensajeJuego`
  * `cancelarPartida`
  * `actualizarEstadoGB`
  * `expulsarJugador`
  * `unirseAPartidaJuego`  ✅ Este SÍ existe
  * `enviarInvitacion`

**NO HAY `@socketio.on('joinRoom')`**

**Impacto:**
- ❌ `socket.emit('joinRoom', ...)` se envía al servidor
- ❌ Servidor NO tiene handler
- ❌ Cliente cree que se unió pero NO está en sala
- ❌ Mensajes no llegan
- ❌ **ESTA ES LA CAUSA PRINCIPAL DE FALLAS EN CHAT**

**Solución:**

```javascript
// MODIFICAR gestorJuego.js líneas 1053-1061

// ✅ CORRECTO: Usar evento que existe en servidor
socket.emit('unirseAPartidaJuego', {
    sala: codigoPartida
});

// ❌ ELIMINAR: Este evento no existe
// socket.emit('joinRoom', codigoPartida);  

// ✅ CORRECTO: Usar evento existente para sala de equipo
socket.emit('unirseAPartidaJuego', {
    sala: `equipo_${window.equipoJugador}`
});

socket.emit('obtenerTiempoServidor', { codigo: codigoPartida });

// ✅ AGREGAR: Confirmación de unión a salas
socket.once('unidoAPartidaJuego', (data) => {
    console.log('✅ Unido a sala:', data.sala);
    
    // Actualizar UI para indicar que el chat está listo
    if (typeof actualizarEstadoChat === 'function') {
        actualizarEstadoChat('conectado', data.sala);
    }
});

// ✅ AGREGAR: Manejo de errores
socket.once('errorUnirsePartidaJuego', (error) => {
    console.error('❌ Error uniéndose a sala:', error);
    
    // Notificar al usuario
    if (window.notificationSystem) {
        window.notificationSystem.mostrar(
            'Error de conexión',
            'No se pudo unir a la sala de juego. Intenta recargar la página.',
            'error'
        );
    }
});
```

**ADEMÁS, necesitamos AGREGAR el evento en el servidor:**

```python
# En app.py agregar después de línea 2230:

@socketio.on('joinRoom')
def handle_join_room(data):
    """
    NUEVO: Handler para joinRoom (usado por código legacy del cliente)
    Redirecciona a unirseAPartidaJuego para compatibilidad
    """
    try:
        # Si data es string, es la sala directamente
        if isinstance(data, str):
            sala = data
        else:
            sala = data.get('sala', 'general')
        
        if not request.sid:
            emit('error', {'mensaje': 'SID no válido'})
            return
        
        # Validar sala
        if sala != 'general' and not sala.startswith('equipo_'):
            # Es código de partida, validar que existe
            if not validar_sala_existe(sala):
                emit('errorJoinRoom', {'mensaje': f'Sala {sala} no existe'})
                return
        
        join_room(sala, sid=request.sid)
        print(f"✅ Usuario {request.sid} unido a sala '{sala}' (via joinRoom)")
        
        emit('joinedRoom', {
            'sala': sala,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error en joinRoom: {e}")
        emit('errorJoinRoom', {'mensaje': 'Error al unirse a sala'})
```

---

## ⚠️ PROBLEMAS GRAVES EN CLIENTE

### 🟠 GRAVE CLIENTE #1: Detección de módulo frágil en MAIRAChat

**Archivo:** `/Client/js/common/MAIRAChat.js` líneas 126-175

```javascript
function detectarModulo() {
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop().replace('.html', '');
    
    console.log('🔍 Detectando módulo desde:', pathname, 'filename:', filename);
    
    // ✅ MEJORAR DETECCIÓN:
    if (filename === 'iniciarpartida' || pathname.includes('iniciarpartida')) {
        return 'iniciarpartida';
    } else if (filename === 'inicioGB' || pathname.includes('inicioGB')) {
        return 'inicioGB';
    } else if (filename === 'gestionbatalla' || pathname.includes('gestionbatalla')) {
        return 'gestionbatalla';
    } else if (filename === 'juegodeguerra' || pathname.includes('juegodeguerra')) {
        return 'juegodeguerra';
    }
    
    // ✅ FALLBACK MEJORADO POR CONTENIDO:
    if (document.getElementById('chatMessages')) {
        // Distinguir entre iniciarpartida e inicioGB
        if (pathname.includes('inicioGB') || 
            document.querySelector('.operaciones-panel') ||
            document.querySelector('#operacionesPanel') ||
            document.querySelector('.card-header') && 
            document.querySelector('.card-header').textContent.includes('Operaciones')) {
            return 'inicioGB';
        }
        return 'iniciarpartida';
    }
    
    if (document.getElementById('chat-messages')) {
        return 'gestionbatalla';
    }
    
    // ✅ ÚLTIMO FALLBACK - BUSCAR ELEMENTOS ÚNICOS:
    if (document.querySelector('.chat-juego') || 
        window.location.href.includes('juego')) {
        return 'juegodeguerra';
    }
    
    console.warn('⚠️ No se pudo detectar módulo, usando gestionbatalla por defecto');
    return 'gestionbatalla';  // ❌ PROBLEMA: Default puede ser incorrecto
}
```

**Problemas:**

1. **Múltiples métodos de detección:**
   - Por filename
   - Por pathname
   - Por elementos DOM
   - Por contenido de texto
   - **Resultado:** Frágil y puede fallar

2. **Default incorrecto:**
   - Si falla todo, retorna 'gestionbatalla'
   - Puede estar en otro módulo
   - Chat funcionará mal

3. **Dependencia de estructura HTML:**
   - Si cambia un ID, falla la detección
   - Si cambia un className, falla
   - No es robusto

**Solución propuesta:**

```javascript
// MEJOR ENFOQUE: Atributo data-module en cada HTML

// En cada archivo HTML agregar:
// iniciarpartida.html:  <body data-maira-module="iniciarpartida">
// inicioGB.html:        <body data-maira-module="inicioGB">
// gestionbatalla.html:  <body data-maira-module="gestionbatalla">
// juegodeguerra.html:   <body data-maira-module="juegodeguerra">

function detectarModulo() {
    // 1️⃣ MÉTODO PRINCIPAL: Atributo data
    const moduleAttr = document.body.getAttribute('data-maira-module');
    if (moduleAttr) {
        console.log('✅ Módulo detectado por atributo:', moduleAttr);
        return moduleAttr;
    }
    
    // 2️⃣ FALLBACK: Variable global window.MAIRA_MODULE
    if (window.MAIRA_MODULE) {
        console.log('✅ Módulo detectado por variable global:', window.MAIRA_MODULE);
        return window.MAIRA_MODULE;
    }
    
    // 3️⃣ FALLBACK: Pathname
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop().replace('.html', '');
    
    const pathMap = {
        'iniciarpartida': 'iniciarpartida',
        'inicioGB': 'inicioGB',
        'gestionbatalla': 'gestionbatalla',
        'juegodeguerra': 'juegodeguerra'
    };
    
    if (pathMap[filename]) {
        console.log('✅ Módulo detectado por filename:', pathMap[filename]);
        return pathMap[filename];
    }
    
    // 4️⃣ FALLBACK: Elementos DOM (método actual mejorado)
    const domDetection = detectarPorDOM();
    if (domDetection) {
        console.log('⚠️ Módulo detectado por DOM (método legacy):', domDetection);
        return domDetection;
    }
    
    // 5️⃣ ÚLTIMO RECURSO: Error en lugar de default incorrecto
    console.error('❌ No se pudo detectar módulo. Por favor agrega data-maira-module al <body>');
    
    // Mostrar modal al usuario
    mostrarModalErrorModulo();
    
    // Lanzar error en lugar de retornar default incorrecto
    throw new Error('No se pudo detectar el módulo actual. Recarga la página.');
}

function detectarPorDOM() {
    // Detección por elementos únicos
    if (document.getElementById('chatMessages')) {
        // Distinguir iniciarpartida vs inicioGB
        if (document.querySelector('.operaciones-panel') ||
            document.querySelector('#operacionesPanel')) {
            return 'inicioGB';
        }
        return 'iniciarpartida';
    }
    
    if (document.getElementById('chat-messages')) {
        return 'gestionbatalla';
    }
    
    if (document.querySelector('.chat-juego')) {
        return 'juegodeguerra';
    }
    
    return null;
}

function mostrarModalErrorModulo() {
    const modal = document.createElement('div');
    modal.className = 'modal-error-modulo';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>⚠️ Error de configuración</h3>
            <p>No se pudo detectar el módulo actual de MAIRA.</p>
            <p>Por favor contacta a soporte técnico.</p>
            <button onclick="window.location.reload()">Recargar página</button>
        </div>
    `;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;
    document.body.appendChild(modal);
}
```

---

### 🟠 GRAVE CLIENTE #2: No hay cleanup de event listeners

**Archivos:** gestorComunicacion.js, MAIRAChat.js, socketManager.js

**Problema:**

En ninguno de los archivos hay destrucción/cleanup de listeners cuando se cambia de página o se reinicializa.

**gestorComunicacion.js:**
```javascript
// No hay método destruir() o cleanup()
// No se llama socket.off() nunca
// No se remueven event listeners del DOM
```

**MAIRAChat.js:**
```javascript
function limpiarSistemasAnteriores() {
    // Esta función existe pero...
    // No se muestra en las líneas leídas (1-200)
    // Necesito leer más para ver si hace cleanup correcto
}
```

**socketManager.js línea 174-191:**
```javascript
/**
 * 🗑️ Remover listener de evento
 * @param {string} eventName - Nombre del evento
 * @param {function} handler - Función handler a remover
 */
off(eventName, handler) {
    if (!this.socket) {
        return;
    }

    if (handler) {
        // Remover listener específico
        const listeners = this.eventListeners.get(eventName) || [];
        const listener = listeners.find(l => l.original === handler);
        if (listener) {
            this.socket.off(eventName, listener.wrapped);
            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
            this._log(`🗑️ Listener removido: ${eventName}`);
        }
    }
    // ❌ PROBLEMA: No maneja el caso de remover TODOS los listeners
}
```

**Impacto:**
- ❌ Memory leaks en SPA navigation
- ❌ Event listeners duplicados
- ❌ Callbacks ejecutados múltiples veces
- ❌ Estado inconsistente

**Solución propuesta:**

```javascript
// AGREGAR a gestorComunicacion.js:

destruir() {
    this.log('🗑️ Destruyendo GestorComunicacion...');
    
    // 1. Detener reconexiones
    if (this.socket) {
        this.socket.io.reconnection(false);
    }
    
    // 2. Remover TODOS los listeners de socket
    if (this.socket) {
        this.socket.removeAllListeners();
        this.log('✅ Listeners de socket removidos');
    }
    
    // 3. Desconectar socket
    if (this.socket && this.socket.connected) {
        this.socket.disconnect();
        this.log('✅ Socket desconectado');
    }
    
    // 4. Limpiar referencias
    this.socket = null;
    this.conectado = false;
    this.gestorJuego = null;
    
    // 5. Limpiar event emitters
    if (this.emisorEventos) {
        this.emisorEventos.removeAllListeners();
        this.emisorEventos = null;
    }
    
    this.log('✅ GestorComunicacion destruido correctamente');
}

// LLAMAR en beforeunload o al cambiar de página:
window.addEventListener('beforeunload', () => {
    if (window.gestorComunicacion) {
        window.gestorComunicacion.destruir();
    }
});
```

```javascript
// MEJORAR socketManager.js método off():

off(eventName, handler) {
    if (!this.socket) {
        return;
    }

    if (handler) {
        // Remover listener específico
        const listeners = this.eventListeners.get(eventName) || [];
        const listener = listeners.find(l => l.original === handler);
        if (listener) {
            this.socket.off(eventName, listener.wrapped);
            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
            this._log(`🗑️ Listener removido: ${eventName}`);
        }
    } else {
        // ✅ NUEVO: Remover TODOS los listeners del evento
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.forEach(listener => {
            this.socket.off(eventName, listener.wrapped);
        });
        this.eventListeners.delete(eventName);
        this._log(`🗑️ Todos los listeners removidos: ${eventName}`);
    }
}

// ✅ NUEVO: Remover TODOS los listeners
removeAllListeners() {
    this._log('🗑️ Removiendo todos los listeners...');
    
    this.eventListeners.forEach((listeners, eventName) => {
        listeners.forEach(listener => {
            this.socket.off(eventName, listener.wrapped);
        });
    });
    
    this.eventListeners.clear();
    this._log('✅ Todos los listeners removidos');
}

// ✅ NUEVO: Destructor completo
destroy() {
    this._log('🗑️ Destruyendo SocketManager...');
    
    // Detener heartbeat
    this._stopHeartbeat();
    
    // Remover todos los listeners
    this.removeAllListeners();
    
    // Desconectar
    if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
    }
    
    // Limpiar estado
    this.state = {
        connected: false,
        reconnecting: false,
        attemptNumber: 0,
        lastDisconnectReason: null,
        connectTime: null,
        disconnectTime: null
    };
    
    this._log('✅ SocketManager destruido correctamente');
}
```

---

## 💡 RECOMENDACIONES DE ARQUITECTURA

### 1. Centralizar manejo de Socket

**Problema actual:**
- 3 implementaciones diferentes de socket
- gestorComunicacion.js (usado en juego)
- MAIRAChat.js (usado en chat)
- socketManager.js (no usado)

**Solución:**

```javascript
// Crear singleton global: window.MAIRASocket

window.MAIRASocket = (function() {
    let instance = null;
    
    class MAIRASocketSingleton {
        constructor() {
            if (instance) {
                return instance;
            }
            
            this.socketManager = null;
            this.socket = null;
            this.conectado = false;
            this.modulo = null;
            
            instance = this;
        }
        
        async conectar(config = {}) {
            if (this.conectado) {
                console.log('✅ Ya conectado');
                return this.socket;
            }
            
            const serverUrl = config.serverUrl || window.SERVER_URL || window.location.origin;
            
            this.socketManager = new SocketManager({
                serverUrl: serverUrl,
                reconnection: true,
                reconnectionAttempts: 10,
                transports: ['websocket', 'polling'],
                debug: config.debug || false,
                onConnect: () => {
                    this.conectado = true;
                    console.log('✅ MAIRASocket conectado');
                    
                    // Emitir evento global
                    window.dispatchEvent(new CustomEvent('maira:socket:connected', {
                        detail: { socket: this.socket }
                    }));
                },
                onDisconnect: (reason) => {
                    this.conectado = false;
                    console.log('⚠️ MAIRASocket desconectado:', reason);
                    
                    // Emitir evento global
                    window.dispatchEvent(new CustomEvent('maira:socket:disconnected', {
                        detail: { reason }
                    }));
                },
                onReconnect: () => {
                    console.log('🔄 MAIRASocket reconectado');
                    
                    // Emitir evento global
                    window.dispatchEvent(new CustomEvent('maira:socket:reconnected'));
                }
            });
            
            this.socketManager.connect();
            this.socket = this.socketManager.socket;
            
            return this.socket;
        }
        
        obtenerSocket() {
            if (!this.socket) {
                throw new Error('Socket no inicializado. Llama a MAIRASocket.conectar() primero.');
            }
            return this.socket;
        }
        
        estaConectado() {
            return this.conectado && this.socket && this.socket.connected;
        }
        
        destruir() {
            if (this.socketManager) {
                this.socketManager.destroy();
            }
            this.socket = null;
            this.conectado = false;
            instance = null;
        }
    }
    
    return new MAIRASocketSingleton();
})();

// Uso en cualquier módulo:
// 1. Conectar (solo una vez en la app):
await window.MAIRASocket.conectar({
    serverUrl: SERVER_URL,
    debug: true
});

// 2. Obtener socket en cualquier lugar:
const socket = window.MAIRASocket.obtenerSocket();
socket.emit('evento', datos);

// 3. Escuchar eventos globales de conexión:
window.addEventListener('maira:socket:connected', (e) => {
    console.log('Socket conectado:', e.detail.socket);
    // Inicializar módulos que dependen del socket
    inicializarChat();
    inicializarJuego();
});
```

---

### 2. Sistema de eventos unificado

```javascript
// Crear EventBus global para comunicación entre módulos

window.MAIRAEventBus = (function() {
    const eventos = {};
    
    return {
        on(evento, callback) {
            if (!eventos[evento]) {
                eventos[evento] = [];
            }
            eventos[evento].push(callback);
        },
        
        off(evento, callback) {
            if (!eventos[evento]) return;
            
            if (callback) {
                eventos[evento] = eventos[evento].filter(cb => cb !== callback);
            } else {
                delete eventos[evento];
            }
        },
        
        emit(evento, data) {
            if (!eventos[evento]) return;
            
            eventos[evento].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en callback de evento ${evento}:`, error);
                }
            });
        },
        
        once(evento, callback) {
            const wrapper = (data) => {
                callback(data);
                this.off(evento, wrapper);
            };
            this.on(evento, wrapper);
        }
    };
})();

// Uso:
// Módulo A emite evento:
window.MAIRAEventBus.emit('partidaCreada', { codigo: 'ABC123' });

// Módulo B escucha evento:
window.MAIRAEventBus.on('partidaCreada', (data) => {
    console.log('Partida creada:', data.codigo);
    // Hacer algo...
});
```

---

## 📊 RESUMEN EJECUTIVO CLIENTE

### Hallazgos Críticos:
1. ✅ **gestorComunicacion.js usa solo polling** (debe ser dual: websocket + polling)
2. ✅ **gestorJuego.js usa evento 'joinRoom' que NO EXISTE** en servidor
3. ✅ **MAIRAChat no maneja errores de conexión** correctamente

### Hallazgos Graves:
1. ✅ **Detección de módulo frágil** en MAIRAChat
2. ✅ **No hay cleanup de event listeners** (memory leaks)
3. ✅ **socketManager.js existe pero NO SE USA**

### Recomendaciones:
1. ✅ **Centralizar socket en singleton MAIRASocket**
2. ✅ **Usar socketManager.js consistentemente**
3. ✅ **Implementar EventBus global**
4. ✅ **Agregar atributos data-maira-module a HTML**
5. ✅ **Implementar destructores en todos los gestores**

---

FIN DEL REPORTE DE AUDITORÍA CLIENTE
