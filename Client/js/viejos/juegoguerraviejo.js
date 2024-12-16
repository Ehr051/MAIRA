// juegoGuerra.js

// Variables globales
let calcoGlobal;
let modoJuego = 'local';
let calcosPorJugador = {};
let faseActual = 'preparacion';
let usuariosConectados = new Map();
let listaAmigos = new Set();
let socket = null; // Inicializa la variable para el socket


// Primero, eliminar uno de los event listeners duplicados y unificar la lógica
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 1. Intentar recuperar datos de sessionStorage primero
        const datosSession = sessionStorage.getItem('datosPartidaActual');
        let datosPartida, userId, userName;

        if (datosSession) {
            const datos = JSON.parse(datosSession);
            datosPartida = datos.partidaActual;
            userId = datos.userId;
            userName = datos.userName;
            sessionStorage.removeItem('datosPartidaActual'); // Limpiar después de usar
        } else {
            // 2. Si no hay datos en session, usar el código existente
            const datosPartidaStr = localStorage.getItem('datosPartida');
            if (!datosPartidaStr) throw new Error('No se encontraron los datos de la partida');
            datosPartida = JSON.parse(datosPartidaStr);
            
            userId = localStorage.getItem('userId');
            userName = localStorage.getItem('username');
            if (!userId || !userName) throw new Error('No se encontraron las credenciales del usuario');
        }

        // 3. Establecer variables globales
        window.userId = userId;
        window.userName = userName;
        window.partidaActual = datosPartida;

        // 4. Usar el código existente para iniciar la partida
        modoJuego = datosPartida.configuracion?.modo || 'local';
        if (modoJuego === 'local') {
            await iniciarPartidaLocal(datosPartida);
        } else {
            const codigoPartida = new URLSearchParams(window.location.search).get('codigo');
            await iniciarPartidaOnline(datosPartida, codigoPartida);
        }

    } catch (error) {
        console.error('Error en la inicialización:', error);
        mostrarError(error.message);
    }
});


// Modificar la función que maneja el clic derecho o doble clic
function mostrarMenuContextual(e) {
    const latlng = e.latlng;

    // Verificar si el clic fue sobre un marcador
    let elementoSeleccionado = null;
    window.calcoGlobal.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.getLatLng().equals(latlng)) {
            elementoSeleccionado = layer;
        }
    });

    if (elementoSeleccionado) {
        console.log("Elemento seleccionado:", elementoSeleccionado);
        window.MiRadial.selectedUnit = elementoSeleccionado;
        window.MiRadial.selectedHex = null;
    } else {
        // Si no hay elemento, verificar el hexágono
        const hex = window.HexGrid.getHexagonAt(latlng);
        if (hex) {
            console.log("Hexágono seleccionado:", hex);
            window.MiRadial.selectedHex = hex;
            window.MiRadial.selectedUnit = null;
        } else {
            console.warn("No se encontró un hexágono ni un elemento en la ubicación seleccionada");
        }
    }

    // Mostrar el menú radial en las coordenadas del clic
    window.MiRadial.mostrarMenu(e.originalEvent.pageX, e.originalEvent.pageY, elementoSeleccionado ? 'elemento' : 'terreno');
}

function verificarHexagonoParaMarcador(latlng) {
    // Usa las coordenadas del marcador para encontrar el hexágono correspondiente
    const hexEnMarcador = HexGrid.getHexagonAt(latlng);

    if (hexEnMarcador) {
        console.log("El marcador está en el hexágono:", hexEnMarcador);

        // Opcional: Marca el hexágono visualmente para indicar la presencia de un marcador
        hexEnMarcador.polygon.setStyle({
            color: '#ff4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff4444',
            fillOpacity: 0.3
        });
    } else {
        console.warn("No se encontró un hexágono para las coordenadas del marcador.");
    }
}

function mostrarMenuRadial(evento) {
    const x = evento.originalEvent.pageX;
    const y = evento.originalEvent.pageY;

    if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
        window.MiRadial.mostrarMenu(x, y);
    } else {
        console.error('Error al intentar mostrar el menú radial: función mostrarMenu no disponible.');
    }
}


async function iniciarPartidaLocal(datosPartida) {
    try {
        console.log('Iniciando partida local');
        await iniciarPartida(datosPartida);
    } catch (error) {
        console.error('Error al iniciar partida local:', error);
        throw error;
    }
}


// Primero, asegurémonos de que el socket se inicialice correctamente
function conectarAlServidor() {
    return new Promise((resolve, reject) => {
        if (socket && socket.connected) {
            console.log('Ya conectado al servidor');
            return resolve(socket);
        }

        try {
            socket = io('SERVER_URL', {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            });

            socket.on('connect', () => {
                console.log('Conectado al servidor del juego');
                resolve(socket);
            });

            socket.on('connect_error', (error) => {
                console.error('Error de conexión:', error);
                reject(error);
            });

            // Configurar otros eventos del socket
            socket.on('estadoJuegoActualizado', actualizarEstadoJuego);
            socket.on('reconnect', manejarReconexion);

        } catch (error) {
            console.error('Error al crear conexión socket:', error);
            reject(error);
        }
    });
}

// Modificar iniciarPartidaOnline para esperar la conexión
async function iniciarPartidaOnline(datosPartida, codigoPartida) {
    try {
        console.log('Iniciando partida online');
        console.log('Datos partida recibidos:', datosPartida);
        console.log('ID usuario actual:', window.userId);
        
        // Esperar a que el socket se conecte
        socket = await conectarAlServidor();
        console.log('Socket conectado correctamente');

        // Ahora que sabemos que el socket está conectado, continuar con la inicialización
        let jugadorActual = datosPartida.jugadores.find(j => j.id.toString() === window.userId.toString());
        console.log('Jugador encontrado en datos partida:', jugadorActual);

        if (!jugadorActual) {
            console.log('Solicitando información del jugador al servidor...');
            jugadorActual = await new Promise((resolve, reject) => {
                socket.emit('obtenerInfoJugador', {
                    codigo: codigoPartida,
                    userId: window.userId
                });

                socket.once('infoJugador', (data) => resolve(data));
                socket.once('error', (error) => reject(error));

                // Timeout más largo para dar tiempo a la conexión
                setTimeout(() => reject(new Error('Tiempo de espera agotado')), 10000);
            });
        }

        // Continuar con el resto de la inicialización...
        datosPartida.jugadorActual = jugadorActual;
        window.equipoJugador = jugadorActual.equipo;

        // Una vez que tenemos todo configurado, iniciar la partida
        await iniciarPartida(datosPartida);

        // Emitir eventos de unión a salas
        socket.emit('unirsePartidaJuego', {
            codigo: codigoPartida,
            userId: window.userId,
            username: window.userName,
            equipo: window.equipoJugador
        });

        socket.emit('joinRoom', codigoPartida);
        socket.emit('joinRoom', `equipo_${window.equipoJugador}`);

        // Solicitar sincronización de tiempo
        socket.emit('obtenerTiempoServidor', { codigo: codigoPartida });

    } catch (error) {
        console.error('Error al iniciar partida online:', error);
        mostrarError(`Error al iniciar partida online: ${error.message}`);
        throw error;
    }
}

// Modificar la función verificarModoYPermisos
async function verificarModoYPermisos() {
    const params = new URLSearchParams(window.location.search);
    const codigoPartida = params.get('codigo');
    modoJuego = codigoPartida ? 'online' : 'local';
    
    if (modoJuego === 'online') {
        try {
            await conectarAlServidor();
            return true;
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            mostrarError('Error de conexión con el servidor');
            return false;
        }
    }
    return true;
}






// Ampliar la función cargarRecursos para incluir todas las funciones necesarias
async function cargarRecursos() {
    mostrarPantallaCargando();
    const tareasCarga = [
        { nombre: 'Iniciando sistemas', funcion: iniciarSistemas },
        { nombre: 'Cargando mapas', funcion: cargarMapas },
        { nombre: 'Configurando simbología militar', funcion: configurarSimbologiaMilitar },
        { nombre: 'Generando hexágonos', funcion: generarHexagonos },
        { nombre: 'Cargando datos de elevación', funcion: async () => {
            if (window.elevationHandler && typeof window.elevationHandler.cargarGeoTIFFs === 'function') {
                await window.elevationHandler.cargarGeoTIFFs();
            }
        }},
        { nombre: 'Cargando datos de vegetación', funcion: window.vegetacionHandler?.cargarDatosVeg || (() => Promise.resolve()) }
    ];

    const totalTareas = tareasCarga.length;
    try {
        for (let [index, tarea] of tareasCarga.entries()) {
            actualizarEstadoCarga(tarea.nombre);
            await tarea.funcion();
            actualizarBarraProgreso(((index + 1) / totalTareas) * 100);
        }
    } catch (error) {
        console.error('Error al cargar recursos:', error);
        mostrarError(`Error al cargar recursos: ${error.message}`);
        throw error;
    } finally {
        ocultarPantallaCargando();
    }
}


function mostrarPantallaCargando() {
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
    } else {
        console.error('Elemento loading-container no encontrado.');
    }
}

function ocultarPantallaCargando() {
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.style.display = 'none';
    } else {
        console.error('Elemento loading-container no encontrado.');
    }
}

function mostrarError(mensaje) {
    const errorContainer = document.getElementById('errorContainer'); // Supongamos que tienes un contenedor de errores
    if (errorContainer) {
        errorContainer.textContent = `Error: ${mensaje}`;
        errorContainer.style.color = 'red';
        errorContainer.style.display = 'block'; // Mostrar el mensaje de error
    } else {
        console.error('Elemento errorContainer no encontrado.');
    }
}

function actualizarEstadoCarga(mensaje) {
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = mensaje;
    } else {
        console.error('Elemento loadingText no encontrado.');
    }
}


function declararSistemaTurnos() {
    try {
        let jugadores;
        const jugadoresStr = localStorage.getItem('jugadoresPartida');
        const datosPartida = window.partidaActual;

        if (jugadoresStr) {
            jugadores = JSON.parse(jugadoresStr);
        } else if (datosPartida && datosPartida.jugadores) {
            jugadores = datosPartida.jugadores;
            localStorage.setItem('jugadoresPartida', JSON.stringify(jugadores));
        } else {
            throw new Error('No se encontraron datos de jugadores');
        }

        if (!Array.isArray(jugadores) || jugadores.length === 0) {
            throw new Error('Datos de jugadores inválidos');
        }

        const configuracion = {
            jugadores: jugadores,
            duracionTurno: window.configuracionPartida?.duracionTurno || 5,
            modo: modoJuego,
            socket: socket
        };

        if (!window.TurnosManager) {
            throw new Error('TurnosManager no está definido');
        }

        window.turnos = new TurnosManager(configuracion);  // Cambiado de SistemaTurnos a TurnosManager
        console.log('Sistema de turnos inicializado correctamente con', jugadores.length, 'jugadores');
        return true;
    } catch (error) {
        console.error('Error al declarar sistema de turnos:', error);
        throw new Error(`Error al inicializar el sistema de turnos: ${error.message}`);
    }
}

function actualizarBarraProgreso(valor) {
    const progreso = document.getElementById('progreso');
    if (progreso) {
        progreso.style.width = `${valor}%`;
        progreso.style.transition = 'width 0.5s ease'; // Añade una transición suave
    } else {
        console.error('Elemento progreso no encontrado');
    }
}

async function iniciarSistemas() {
    try {
        console.log('Iniciando sistemas básicos...');

        // Crear el sistema de turnos
        declararSistemaTurnos();

        // Crear el calco global del mapa
        crearCalcoGlobal();

        // Configurar eventos necesarios
        configurarEventos();

        console.log('Sistemas básicos iniciados correctamente');
    } catch (error) {
        console.error('Error al iniciar sistemas:', error);
        throw error;
    }
}

async function cargarMapas() {
    return new Promise((resolve) => {
        try {
            console.log('Cargando mapas...');
            resolve();
        } catch (error) {
            console.error('Error al cargar mapas:', error);
            throw error;
        }
    });
}

async function configurarSimbologiaMilitar() {
    return new Promise((resolve) => {
        try {
            console.log('Configurando simbología militar...');
            if (typeof ms === 'undefined') {
                throw new Error('Librería de simbología militar no encontrada');
            }
            resolve();
        } catch (error) {
            console.error('Error al configurar simbología militar:', error);
            throw error;
        }
    });
}

async function generarHexagonos() {
    return new Promise((resolve, reject) => {
        try {
            console.log('Generando grid hexagonal...');
            if (!window.HexGrid) {
                throw new Error('Módulo HexGrid no encontrado');
            }
            // Verificar si la hexgrid ya fue inicializada
            if (window.hexGridInitialized) {
                console.warn('HexGrid ya está inicializada. No se realizará una nueva inicialización.');
                return resolve();
            }

            // Código de inicialización del hexgrid
            window.HexGrid.initialize(window.mapa);
            window.hexGridInitialized = true;

            console.log('Grid hexagonal inicializado correctamente');
            resolve();
        } catch (error) {
            console.error('Error al generar hexágonos:', error);
            reject(error);
        }
    });
}

function crearCalcoGlobal() {
    try {
        if (typeof L === 'undefined') {
            throw new Error('Leaflet no está disponible');
        }
        if (!window.mapa) {
            throw new Error('El mapa no está inicializado');
        }
        window.calcoGlobal = L.layerGroup().addTo(window.mapa);
        window.calcoActivo = window.calcoGlobal;
        console.log('Calco global creado exitosamente');
    } catch (error) {
        console.error('Error al crear calco global:', error);
        throw error;
    }
}

function configurarEventos() {
    try {
        if (!window.turnos || !window.turnos.eventos) {
            throw new Error('Sistema de turnos no inicializado correctamente');
        }

        window.turnos.eventos.addEventListener('cambioTurno', manejarCambioTurno);
        window.turnos.eventos.addEventListener('cambioFase', manejarCambioFase);
        console.log('Eventos configurados exitosamente');
    } catch (error) {
        console.error('Error al configurar eventos:', error);
        throw error;
    }
}

function actualizarEstadoJuego(datos) {
    console.log('Estado del juego actualizado:', datos);
}

function manejarErrorConexion(error) {
    console.error('Error de conexión:', error);
    mostrarError('Error de conexión con el servidor');
}

function manejarReconexion(attemptNumber) {
    console.log('Reconectado al servidor después de', attemptNumber, 'intentos');
    if (window.partidaActual && window.partidaActual.codigo) {
        socket.emit('unirsePartidaJuego', { 
            codigo: window.partidaActual.codigo,
            userId: window.userId,
            username: window.userName
        });
    }
}

async function iniciarPartida(config) {
    console.log("Iniciando Juego de Guerra con configuración:", config);
    try {
        // Validar configuración básica
        if (!config.configuracion) {
            throw new Error('Configuración de partida no válida');
        }

        // Verificar modo de juego y conexión
        const params = new URLSearchParams(window.location.search);
        const codigoPartida = params.get('codigo');
        modoJuego = codigoPartida ? 'online' : 'local';
        
        if (modoJuego === 'online' && (!socket || !socket.connected)) {
            throw new Error('Error: Modo online pero sin conexión al servidor');
        }

        // Guardar datos globales
        window.configuracionPartida = config.configuracion;
        window.jugadoresPartida = config.jugadores;
        window.estadoPartida = config.estado || 'iniciada';
        window.codigoPartida = codigoPartida;

        // Identificar jugador actual
        const jugadorActual = config.jugadores.find(j => j.id === window.userId);
        if (!jugadorActual) {
            throw new Error('No se encontró el jugador actual en la configuración');
        }

        // Guardar datos en localStorage
        localStorage.setItem('jugadorActual', JSON.stringify({
            id: jugadorActual.id,
            nombre: jugadorActual.username,
            equipo: jugadorActual.equipo
        }));
        localStorage.setItem('jugadoresPartida', JSON.stringify(config.jugadores));
        localStorage.setItem('configuracionPartida', JSON.stringify(config.configuracion));

        // Inicializar sistemas base
        await iniciarSistemas();
        await cargarRecursos();

        // Inicializar sistema de turnos
        window.turnos = new SistemaTurnos({
            jugadores: config.jugadores,
            duracionTurno: config.configuracion.duracionTurno || 5,
            modo: modoJuego,
            socket: socket,
            jugadorActualId: jugadorActual.id,
            codigoPartida: codigoPartida
        });

        // Inicializar menú radial
        if (window.MiRadial && typeof window.MiRadial.init === 'function') {
            window.MiRadial.init(window.mapa);
        } else {
            console.warn('El módulo MiRadial no está disponible');
        }

        // Configurar interfaz y eventos
        configurarInterfazJugador(jugadorActual);
        configurarEventosMapa();
        inicializarSistemaCalcos();

        // Inicializar sistemas de comunicación
        if (modoJuego === 'online') {
            await inicializarSistemasComunicacion(codigoPartida, jugadorActual);
        }

        // Inicializar estado del juego
        actualizarEstadoJuego();

        console.log('Juego inicializado correctamente');
        ocultarPantallaCargando();
        mostrarMensajeBienvenida(jugadorActual);

        return true;

    } catch (error) {
        console.error('Error al iniciar la partida:', error);
        mostrarError(`Error al iniciar la partida: ${error.message}`);
        ocultarPantallaCargando();
        throw error;
    }
}

// Funciones auxiliares
function configurarEventosMapa() {
    window.mapa.off('dblclick').on('dblclick', mostrarMenuContextual);
    window.mapa.off('contextmenu').on('contextmenu', mostrarMenuContextual);
}

function inicializarSistemaCalcos() {
    if (window.calcoGlobal) {
        window.calcoGlobal.clearLayers();
    } else {
        crearCalcoGlobal();
    }
}

async function inicializarSistemasComunicacion(codigoPartida, jugadorActual) {
    // Inicializar chat
    if (window.inicializarChat) {
        window.inicializarChat(socket);
    }
    
    // Inicializar chat del juego
    window.chatJuego = inicializarChatJuego();
    window.chatJuego.mostrarMensajeSistema(`Bienvenido al juego, ${jugadorActual.username}`);

    // Unirse a las salas correspondientes
    if (socket) {
        socket.emit('unirsePartidaJuego', {
            codigo: codigoPartida,
            userId: window.userId,
            username: jugadorActual.username,
            equipo: jugadorActual.equipo
        });

        socket.emit('joinRoom', codigoPartida);
        socket.emit('joinRoom', `equipo_${jugadorActual.equipo}`);
        
        socket.emit('jugadorListoParaJugar', {
            codigo: codigoPartida,
            userId: window.userId
        });
    }
}

function actualizarEstadoJuego() {
    // Actualizar interfaz según fase actual
    if (window.turnos) {
        actualizarInterfazSegunFase(window.turnos.getFaseActual());
        window.turnos.iniciarReloj();
    }

    // Cargar calcos del jugador si existen
    const jugadorActual = JSON.parse(localStorage.getItem('jugadorActual'));
    if (jugadorActual?.calcos) {
        cargarCalcosJugador(jugadorActual.calcos);
    }

    // Habilitar controles según el rol
    habilitarControlesJugador(jugadorActual);
}

function mostrarMensajeBienvenida(jugadorActual) {
    const mensaje = `Bienvenido al juego, ${jugadorActual?.username || 'Jugador'}`;
    mostrarMensaje(mensaje);
    if (window.chatJuego) {
        window.chatJuego.mostrarMensajeSistema(mensaje);
    }
}

function cargarCalcosJugador(calcos) {
    try {
        calcos.forEach(calco => {
            if (calco.elementos) {
                calco.elementos.forEach(elemento => {
                    agregarElementoACalco(elemento);
                });
            }
        });
    } catch (error) {
        console.error('Error al cargar calcos del jugador:', error);
    }
}

function actualizarInterfazSegunFase(fase) {
    const contenedorControles = document.getElementById('controlesJuego');
    if (!contenedorControles) return;

    // Limpiar clases existentes
    contenedorControles.className = 'controles-juego';
    contenedorControles.classList.add(`fase-${fase}`);

    // Actualizar visibilidad de botones según la fase
    const botonesPreparacion = document.querySelectorAll('.control-preparacion');
    const botonesCombate = document.querySelectorAll('.control-combate');

    botonesPreparacion.forEach(btn => btn.style.display = fase === 'preparacion' ? 'block' : 'none');
    botonesCombate.forEach(btn => btn.style.display = fase === 'combate' ? 'block' : 'none');
}

function habilitarControlesJugador(jugador) {
    if (!jugador) return;

    const controles = document.querySelectorAll('[data-requiere-rol]');
    controles.forEach(control => {
        const rolesPermitidos = control.dataset.requiereRol.split(',');
        control.disabled = !rolesPermitidos.includes(jugador.rol);
    });

    // Habilitar/deshabilitar controles específicos según el equipo
    const controlesEquipo = document.querySelectorAll('[data-equipo]');
    controlesEquipo.forEach(control => {
        control.style.display = control.dataset.equipo === jugador.equipo ? 'block' : 'none';
    });
}

// En juegoGuerra.js
function mostrarMensaje(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('mensajesContainer');
    if (!contenedor) {
        console.warn('Contenedor de mensajes no encontrado');
        return;
    }

    const mensajeElement = document.createElement('div');
    mensajeElement.className = `mensaje mensaje-${tipo}`;
    mensajeElement.textContent = mensaje;
    contenedor.appendChild(mensajeElement);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        mensajeElement.remove();
    }, 5000);
}

function configurarInterfazJugador(jugador) {
    if (!jugador) {
        console.warn('No se encontró información del jugador');
        return;
    }

    // Configurar el equipo global
    window.equipoJugador = jugador.equipo;
    
    // Actualizar la interfaz según el equipo
    const contenedorControles = document.getElementById('controlesJuego');
    if (contenedorControles) {
        // Limpiar clases existentes
        contenedorControles.className = 'controles-juego';
        contenedorControles.classList.add(`equipo-${jugador.equipo}`);
    }

    // Actualizar botón de equipo
    const botonEquipo = document.getElementById('boton-equipo');
    if (botonEquipo) {
        botonEquipo.textContent = `Equipo ${jugador.equipo.toUpperCase()}`;
        botonEquipo.className = `btn btn-${jugador.equipo}`;
    }

    // Configurar el SIDC base según el equipo
    window.sidcBase = jugador.equipo === 'azul' ? 'F' : 'H';
    
    // Actualizar información del jugador
    const infoJugador = document.getElementById('infoJugador');
    if (infoJugador) {
        infoJugador.innerHTML = `
            <div class="jugador-info">
                <span>Jugador: ${jugador.username}</span>
                <span class="equipo-${jugador.equipo}">Equipo: ${jugador.equipo}</span>
            </div>
        `;
    }
}

function manejarCambioTurno(e) {
    console.log('Cambio de turno:', e.detail.jugador);
    actualizarInterfazJugadorActual(e.detail.jugador);
}

function manejarCambioFase(e) {
    console.log('Cambio de fase:', e.detail.fase);
    if (e.detail.fase === 'combate') {
        iniciarFaseCombate();
    }
}

function actualizarInterfazJugadorActual(jugador) {
    document.getElementById('jugadorActual').textContent = `Jugador actual: ${jugador.nombre}`;
    actualizarVisibilidadElementos(jugador);
}

function actualizarVisibilidadElementos(jugadorActual) {
    if (!window.calcoGlobal) {
        console.warn('Calco global no inicializado');
        return;
    }

    window.calcoGlobal.eachLayer(function(layer) {
        if (typeof layer.setStyle === 'function') {
            const esElementoJugadorActual = layer.options.jugador === jugadorActual.id; // Cambiado a id en lugar de nombre
            layer.setStyle({
                opacity: esElementoJugadorActual ? 1 : 0.5,
                fillOpacity: esElementoJugadorActual ? 0.7 : 0.3
            });
            // Actualizar también la interactividad
            if (layer.getElement()) {
                layer.getElement().style.pointerEvents = esElementoJugadorActual ? 'auto' : 'none';
            }
        }
    });
}

function iniciarFaseCombate() {
    console.log('Iniciando fase de combate');
    mostrarMensaje('Fase de combate iniciada', 'warning');
    // Aquí podríamos agregar la lógica de combate
}

function moverUnidad(unidad, destino) {
    if (window.turnos.esJugadorActual(unidad.options.jugador)) {
        console.log(`Moviendo unidad ${unidad.options.nombre} a ${destino}`);
        unidad.setLatLng(destino);
        
        if (modoJuego === 'online') {
            socket.emit('moverUnidad', { unidadId: unidad.options.id, destino });
        }
    } else {
        console.log('No es el turno del jugador para mover esta unidad');
    }
}

function iniciarAtaque(unidadAtacante, objetivo) {
    if (window.turnos.esJugadorActual(unidadAtacante.options.jugador)) {
        console.log(`Unidad ${unidadAtacante.options.nombre} atacando a ${objetivo.options.nombre}`);
        
        if (modoJuego === 'online') {
            socket.emit('iniciarAtaque', { atacanteId: unidadAtacante.options.id, objetivoId: objetivo.options.id });
        }
    } else {
        console.log('No es el turno del jugador para atacar con esta unidad');
    }
}

function cargarCalco() {
    var inputArchivo = document.createElement('input');
    inputArchivo.type = 'file';
    inputArchivo.accept = '.json';
    inputArchivo.click();

    inputArchivo.onchange = function() {
        var archivo = inputArchivo.files[0];
        if (!archivo) return;

        var lector = new FileReader();
        lector.onload = function(event) {
            try {
                var escenario = JSON.parse(event.target.result);
                
                // Crear calco privado para el jugador actual
                var calcoPrivado = L.layerGroup().addTo(mapa);
                calcoPrivado.id = `calcoPrivado_${window.userId}`;
                calcos[calcoPrivado.id] = calcoPrivado;

                escenario.elementos.forEach(function(elemento) {
                    if (elemento.tipo === "marcador" && elemento.sidc) {
                        // Elementos de tipo unidad o equipo van al calco global
                        // con el jugador actual como propietario
                        const marcador = L.marker(elemento.latlng, {
                            icon: L.divIcon({
                                className: 'custom-div-icon',
                                html: new ms.Symbol(elemento.sidc, { size: 35 }).asSVG(),
                                iconSize: [70, 50],
                                iconAnchor: [35, 25]
                            }),
                            draggable: true,
                            sidc: elemento.sidc,
                            nombre: elemento.nombre,
                            jugador: window.userId, // Asignar al jugador actual
                            designacion: elemento.designacion,
                            dependencia: elemento.dependencia
                        });

                        marcador.on('click', function() {
                            seleccionarElemento(this);
                        });

                        window.calcoGlobal.addLayer(marcador);

                    } else {
                        // Otros elementos (líneas, polígonos, etc.) van al calco privado
                        let nuevoElemento;
                        if (elemento.tipo === "polilinea" || elemento.tipo === "poligono") {
                            const PolyClass = elemento.tipo === "poligono" ? L.polygon : L.polyline;
                            nuevoElemento = new PolyClass(elemento.latlngs, {
                                color: elemento.color,
                                weight: elemento.weight,
                                dashArray: elemento.dashArray,
                                nombre: elemento.nombre
                            });
                        }
                        
                        if (nuevoElemento) {
                            nuevoElemento.on('click', function() {
                                seleccionarElemento(this);
                            });
                            calcoPrivado.addLayer(nuevoElemento);
                        }
                    }
                });

                console.log("Calco cargado y separado entre global y privado");

            } catch (error) {
                console.error("Error al cargar el calco:", error);
                mostrarError("Error al cargar el calco: " + error.message);
            }
        };
        lector.readAsText(archivo);
    };
}

function inicializarChatJuego() {
    // Obtener o crear el contenedor principal
    let chatContainer = document.getElementById('chatJuego');
    if (!chatContainer) {
        chatContainer = document.createElement('div');
        chatContainer.id = 'chatJuego';
        chatContainer.className = 'chat-juego minimizado';
        document.body.appendChild(chatContainer);
    }

    // Construir estructura interna del chat
    chatContainer.innerHTML = `
        <div class="chat-header">
            <span>Chat de Juego</span>
            <div class="chat-controls">
                <select id="chatDestino" class="chat-destino">
                    <option value="equipo">Equipo</option>
                    <option value="global">Global</option>
                    ${window.equipoJugador === 'Director' ? '<option value="director">Mensaje Directo</option>' : ''}
                </select>
                <button class="btn-minimizar-chat">_</button>
            </div>
        </div>
        <div class="chat-mensajes"></div>
        <div class="chat-input">
            <input type="text" id="chatInputMensaje" placeholder="Escribe un mensaje...">
            <button id="btnEnviarChat" class="btn-enviar-chat">Enviar</button>
        </div>
    `;

    // Agregar estilos dinámicamente si no existen
    if (!document.getElementById('chatJuegoStyles')) {
        const styles = document.createElement('style');
        styles.id = 'chatJuegoStyles';
        styles.textContent = `
            .chat-juego {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                height: 400px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #ccc;
                border-radius: 5px;
                display: flex;
                flex-direction: column;
                z-index: 1000;
                transition: height 0.3s ease;
            }

            .chat-juego.minimizado {
                height: 40px;
                overflow: hidden;
            }

            .chat-header {
                padding: 10px;
                background: #2c3e50;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .chat-controls {
                display: flex;
                gap: 10px;
            }

            .chat-destino {
                padding: 2px 5px;
                border-radius: 3px;
            }

            .chat-mensajes {
                flex-grow: 1;
                overflow-y: auto;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                background: #fff;
            }

            .mensaje-chat {
                padding: 5px 10px;
                border-radius: 5px;
                max-width: 85%;
                word-break: break-word;
            }

            .mensaje-equipo {
                background: #e3f2fd;
                align-self: flex-start;
            }

            .mensaje-global {
                background: #f5f5f5;
            }

            .mensaje-director {
                background: #fff3e0;
                font-weight: bold;
            }

            .mensaje-sistema {
                background: #f3f3f3;
                color: #666;
                font-style: italic;
                text-align: center;
                width: 100%;
            }

            .chat-input {
                padding: 10px;
                display: flex;
                gap: 5px;
                background: #f5f5f5;
                border-top: 1px solid #ddd;
            }

            .chat-input input {
                flex-grow: 1;
                padding: 5px 10px;
                border: 1px solid #ddd;
                border-radius: 3px;
                outline: none;
            }

            .btn-enviar-chat {
                padding: 5px 10px;
                background: #2c3e50;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }

            .btn-minimizar-chat {
                padding: 2px 8px;
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 3px;
                color: white;
                cursor: pointer;
            }

            .mensaje-tiempo {
                font-size: 0.8em;
                color: #666;
                margin-right: 5px;
            }
        `;
        document.head.appendChild(styles);
    }

    // Obtener referencias a los elementos
    const btnMinimizar = chatContainer.querySelector('.btn-minimizar-chat');
    const chatInput = chatContainer.querySelector('#chatInputMensaje');
    const btnEnviar = chatContainer.querySelector('#btnEnviarChat');
    const selectDestino = chatContainer.querySelector('#chatDestino');
    const mensajesContainer = chatContainer.querySelector('.chat-mensajes');
    const chatHeader = chatContainer.querySelector('.chat-header');

    // Event listeners
    btnMinimizar.addEventListener('click', (e) => {
        e.stopPropagation();
        chatContainer.classList.toggle('minimizado');
    });

    chatHeader.addEventListener('click', () => {
        if (chatContainer.classList.contains('minimizado')) {
            chatContainer.classList.remove('minimizado');
        }
    });

    function enviarMensaje() {
        const mensaje = chatInput.value.trim();
        if (!mensaje) return;
    
        const datosMsg = {
            contenido: mensaje,
            tipo: selectDestino.value,
            equipo: window.equipoJugador,
            emisor: window.userName,
            partidaCodigo: window.partidaActual.codigo
        };
    
        console.log('Enviando mensaje:', datosMsg);  // Log para debug
        
        socket.emit('mensajeJuego', datosMsg);
        chatInput.value = '';
    }
    
    // Al recibir mensajes
    socket.on('mensajeJuego', (datos) => {
        console.log('Mensaje recibido:', datos);  // Log para debug
        const { contenido, tipo, equipo, emisor } = datos;
        
        // Verificar si el usuario debe ver este mensaje
        const puedeVerMensaje = 
            tipo === 'global' || 
            (tipo === 'equipo' && equipo === window.equipoJugador) ||
            (tipo === 'director' && (window.equipoJugador === 'Director' || equipo === 'Director'));
    
        console.log('Puede ver mensaje:', puedeVerMensaje, 'Tipo:', tipo, 'Equipo actual:', window.equipoJugador);  // Log para debug
    
        if (puedeVerMensaje) {
            mostrarMensaje(datos);
        }
    });

    btnEnviar.addEventListener('click', enviarMensaje);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    });

    // Función para mostrar mensajes en el chat
    function mostrarMensaje(datos) {
        const { contenido, tipo, equipo, emisor } = datos;
        
        // Verificar si el usuario debe ver este mensaje
        const puedeVerMensaje = 
            tipo === 'global' || 
            (tipo === 'equipo' && equipo === window.equipoJugador) ||
            (tipo === 'director' && (window.equipoJugador === 'Director' || equipo === 'Director'));

        if (puedeVerMensaje) {
            const msgElement = document.createElement('div');
            msgElement.className = `mensaje-chat mensaje-${tipo}`;
            
            const equipoIndicador = tipo === 'global' ? `[${equipo}] ` : '';
            
            msgElement.innerHTML = `
                <span class="mensaje-tiempo">${new Date().toLocaleTimeString()}</span>
                <strong>${equipoIndicador}${emisor}:</strong> 
                <span class="mensaje-contenido">${contenido}</span>
            `;
            
            mensajesContainer.appendChild(msgElement);
            mensajesContainer.scrollTop = mensajesContainer.scrollHeight;

            // Si el chat está minimizado, mostrar una notificación
            if (chatContainer.classList.contains('minimizado')) {
                mostrarNotificacionChat(emisor, contenido);
            }
        }
    }

    // Función para mostrar mensajes del sistema
    function mostrarMensajeSistema(mensaje) {
        const msgElement = document.createElement('div');
        msgElement.className = 'mensaje-chat mensaje-sistema';
        msgElement.innerHTML = `
            <span class="mensaje-tiempo">${new Date().toLocaleTimeString()}</span>
            <span class="mensaje-contenido">${mensaje}</span>
        `;
        mensajesContainer.appendChild(msgElement);
        mensajesContainer.scrollTop = mensajesContainer.scrollHeight;
    }

    // Configurar el socket para recibir mensajes
    if (socket) {
        socket.on('mensajeJuego', mostrarMensaje);
    }

    // Función para mostrar notificaciones cuando el chat está minimizado
    function mostrarNotificacionChat(emisor, mensaje) {
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-chat';
        notificacion.innerHTML = `
            <strong>${emisor}:</strong> ${mensaje.substring(0, 30)}${mensaje.length > 30 ? '...' : ''}
        `;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }

    // Retornar las funciones públicas
    return {
        mostrarMensajeSistema,
        mostrarMensaje,
        minimizar: () => chatContainer.classList.add('minimizado'),
        maximizar: () => chatContainer.classList.remove('minimizado'),
        limpiar: () => {
            mensajesContainer.innerHTML = '';
        }
    };
}


function finalizarPartida() {
    console.log("Partida finalizada");
    if (modoJuego === 'online') {
        socket.emit('finalizarPartida');
    }
}

window.agregarMarcador = function(sidc, nombre) {
    try {
        const turnos = window.turnos;
        const jugadorActual = turnos.getJugadorActual();
        
        if (!jugadorActual) {
            console.error('No se pudo obtener el jugador actual');
            return;
        }

        console.log('Intentando agregar marcador:', {
            sidc,
            nombre,
            jugador: jugadorActual.id,
            equipo: jugadorActual.equipo,
            fase: turnos.fase,
            subfase: turnos.subfase
        });

        // Validación de fase y subfase
        if (turnos.fase !== 'preparacion' || turnos.subfase !== 'despliegue') {
            mostrarMensaje('Solo se pueden agregar unidades en la fase de despliegue', 'error');
            return;
        }

        if (!jugadorActual.equipo) {
            mostrarMensaje('Debes tener un equipo asignado para desplegar unidades', 'error');
            return;
        }

        // Formatear SIDC
        let sidcFormateado = sidc;
        if (sidc.length < 15) {
            sidcFormateado = sidc.padEnd(15, '-');
        } else if (sidc.length > 15) {
            sidcFormateado = sidc.substr(0, 15);
        }

        // Modificar según equipo
        const sidcArray = sidcFormateado.split('');
        sidcArray[1] = jugadorActual.equipo === 'azul' ? 'F' : 'J';
        sidcFormateado = sidcArray.join('');

        console.log("SIDC modificado según equipo:", sidcFormateado);

        // Generar icono del marcador
        const sym = new ms.Symbol(sidcFormateado, { size: 35 });
        
        // Manejar el clic en el mapa para colocar el marcador
        mapa.once('click', function(event) {
            const latlng = event.latlng;
            
            // Validar zona de despliegue
            const zonaEquipo = turnos.zonasDespliegue[jugadorActual.equipo];
            if (!zonaEquipo || !zonaEquipo.contains(latlng)) {
                mostrarMensaje('Solo puedes desplegar unidades en tu zona asignada', 'error');
                return;
            }

            // Crear el marcador
            const marcador = L.marker(latlng, {
                icon: L.divIcon({
                    className: `custom-div-icon equipo-${jugadorActual.equipo}`,
                    html: sym.asSVG(),
                    iconSize: [70, 50],
                    iconAnchor: [35, 25]
                }),
                draggable: true,
                sidc: sidcFormateado,
                nombre: nombre,
                jugador: jugadorActual.id,
                equipo: jugadorActual.equipo,
                id: Date.now() // Identificador único para el marcador
            });

            // Eventos del marcador
            marcador.on('click', function(e) {
                L.DomEvent.stopPropagation(e);
                seleccionarElemento(this);
            });

            marcador.on('dblclick', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                window.elementoSeleccionado = this;
                mostrarMenuRadial(e);
            });

            marcador.on('contextmenu', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                window.elementoSeleccionado = this;
                mostrarMenuRadial(e);
            });

            // Validar límites durante el arrastre
            marcador.on('drag', function(e) {
                const nuevaPosicion = e.latlng;
                if (!zonaEquipo.contains(nuevaPosicion)) {
                    mostrarMensaje('No puedes mover unidades fuera de tu zona de despliegue', 'warning');
                    marcador.setLatLng(latlng); // Volver a la posición original
                }
            });

            // Agregar al mapa
            if (window.calcoActivo) {
                window.calcoActivo.addLayer(marcador);
                console.log("Marcador agregado en", latlng);

                // Emitir al servidor si es modo online
                if (turnos.socket) {
                    turnos.socket.emit('elementoAgregado', {
                        tipo: 'marcador',
                        datos: {
                            sidc: sidcFormateado,
                            nombre: nombre,
                            posicion: latlng,
                            jugador: jugadorActual.id,
                            equipo: jugadorActual.equipo,
                            id: marcador._leaflet_id
                        }
                    });
                }
            }
        });

    } catch (error) {
        console.error('Error al agregar marcador:', error);
        mostrarMensaje('Error al agregar el marcador: ' + error.message, 'error');
    }
};