/**
 * elementosGB.js
 * Módulo de gestión de elementos en el mapa para Gestión de Batalla en MAIRA
 * @version 1.0.0
 */

// Namespace principal
window.MAIRA = window.MAIRA || {};

// Módulo de elementos
MAIRA.Elementos = (function() {
    // Variables privadas
    let socket = null;
    let usuarioInfo = null;
    let operacionActual = "";
    let elementoTrabajo = null;
    let elementosConectados = {};
    let elementoSeleccionado = null;
    let marcadorUsuario = null;
    let ultimaPosicion = null;
    let siguiendoElemento = null;
    let seguimientoActivo = false;
    
    /**
     * Inicializa el módulo de elementos
     * @param {Object} config - Configuración del módulo
     */
    function inicializar(config) {
        console.log("Inicializando módulo de elementos");
        
        // Guardar referencias
        socket = config.socket;
        usuarioInfo = config.usuarioInfo;
        operacionActual = config.operacionActual;
        elementoTrabajo = config.elementoTrabajo;
        ultimaPosicion = config.ultimaPosicion;
        elementosConectados = config.elementosConectados || {};
        
        // Inicializar componentes UI
        inicializarInterfazElementos();
        
        // Configurar eventos
        configurarEventosElementos();
        
        // Mensaje de inicialización
        console.log("Módulo de elementos inicializado");
    }
    
    /**
     * Inicializa la interfaz de elementos
     */
    function inicializarInterfazElementos() {
        console.log("Inicializando interfaz de elementos");
        
        // Mejorar la lista de elementos
        mejorarListaElementos();
        
        // Inicializar estilos para elementos
        inicializarEstilosElementos();
        
        console.log("Interfaz de elementos inicializada");
    }
    
    /**
     * Inicializa los estilos para elementos
     */
    function inicializarEstilosElementos() {
        // Verificar si ya existe la hoja de estilos
        if (document.getElementById('estilos-elementos')) {
            return;
        }
        
        // Crear hoja de estilos
        const style = document.createElement('style');
        style.id = 'estilos-elementos';
        style.textContent = `
            /* Estilos para lista de elementos */
            .elemento-item {
                transition: background-color 0.2s;
                border-bottom: 1px solid #eee;
                margin-bottom: 8px;
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .elemento-item:hover {
                background-color: #f5f5f5;
            }
            
            .elemento-item.seleccionado {
                background-color: #e3f2fd;
                border-left: 3px solid #2196F3;
            }
            
            .elemento-item.usuario-actual {
                background-color: #e8f5e9;
                border-left: 3px solid #4CAF50;
            }
            
            .elemento-item .elemento-acciones button {
                background: none;
                border: none;
                color: #0281a8;
                padding: 5px;
                margin: 0 3px;
                cursor: pointer;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .elemento-item .elemento-acciones button:hover {
                background-color: rgba(2, 129, 168, 0.1);
            }
            
            .elemento-icon {
                position: relative;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .elemento-status {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 1px solid white;
            }
            
            .elemento-status.online {
                background-color: #4CAF50;
            }
            
            .elemento-status.offline {
                background-color: #9E9E9E;
            }
            
            /* Estilos para marcadores */
            .temp-marker-pin {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #2196F3;
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
            
            /* Estilos para menú contextual */
            .menu-contextual-elemento {
                position: absolute;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                padding: 5px 0;
                z-index: 1000;
                min-width: 180px;
            }
            
            .menu-contextual-elemento .menu-item {
                padding: 8px 15px;
                cursor: pointer;
                transition: background-color 0.2s;
                display: flex;
                align-items: center;
            }
            
            .menu-contextual-elemento .menu-item:hover {
                background-color: #f5f5f5;
            }
            
            .menu-contextual-elemento .menu-item i {
                margin-right: 8px;
                width: 16px;
                text-align: center;
                color: #555;
            }
            
            /* Estilos para seguimiento activo */
            .siguiendo-elemento {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background-color: rgba(33, 150, 243, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 50px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                display: flex;
                align-items: center;
                font-size: 14px;
            }
            
            .siguiendo-elemento i {
                margin-right: 8px;
            }
            
            .siguiendo-elemento button {
                margin-left: 10px;
                background-color: transparent;
                border: none;
                color: white;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .siguiendo-elemento button:hover {
                background-color: rgba(255,255,255,0.2);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Configura los eventos para el módulo de elementos
     */
    function configurarEventosElementos() {
        console.log("Configurando eventos del módulo de elementos");
        
        // Botones de acción para elementos
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        const btnCentrar = document.getElementById('btn-centrar');
        const btnVerTodos = document.getElementById('btn-ver-todos');
        const btnBuscarElemento = document.getElementById('btnBuscarElemento');
        
        if (btnSeguimiento) {
            btnSeguimiento.addEventListener('click', toggleSeguimiento);
        }
        
        if (btnCentrar) {
            btnCentrar.addEventListener('click', centrarEnPosicion);
        }
        
        if (btnVerTodos) {
            btnVerTodos.addEventListener('click', mostrarTodosElementos);
        }
        
        if (btnBuscarElemento) {
            btnBuscarElemento.addEventListener('click', function() {
                const modal = document.getElementById('modalBuscarElemento');
                if (modal) {
                    if (typeof $('#modalBuscarElemento').modal === 'function') {
                        $('#modalBuscarElemento').modal('show');
                    } else {
                        modal.style.display = 'block';
                    }
                }
            });
        }
        
        // Campo de búsqueda de elementos
        const busquedaElemento = document.getElementById('busqueda-elemento');
        if (busquedaElemento) {
            busquedaElemento.addEventListener('input', function() {
                buscarElementos(this.value);
            });
        }
        
        // Inicializar menú contextual para elementos
        inicializarMenuContextual();
        
        // Configurar eventos para el mapa
        configurarEventosMapa();
    }
    
    /**
     * Configura los eventos de Socket.io para el módulo de elementos
     * @param {Object} socket - Objeto socket.io
     */

function configurarEventosSocket(socket) {
    if (!socket) return;
    
    // Clear previous events
    socket.off('listaElementos');
    socket.off('nuevoElemento');
    socket.off('anunciarElemento');
    socket.off('actualizacionPosicion');
    socket.off('actualizarPosicion');
    socket.off('heartbeat');
    
    socket.on('listaElementos', function(elementos) {
        console.log(`Recibidos ${elementos?.length || 0} elementos del servidor:`, elementos);
        
        if (!elementos || !Array.isArray(elementos)) {
            console.warn("Lista de elementos inválida recibida:", elementos);
            return;
        }
        
        // Procesar elementos detalladamente
        elementos.forEach(elemento => {
            console.log(`Elemento recibido del servidor: ID=${elemento.id}, Usuario=${elemento.usuario || 'Sin nombre'}`);
        });
        
        // Inicializar lista con los elementos recibidos
        inicializarListaElementos(elementos);
        
        // Verificar que todos los elementos tengan marcadores
        elementos.forEach(elemento => {
            if (elemento && elemento.id && elemento.id !== usuarioInfo?.id) {
                if (elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
                    if (!elementosConectados[elemento.id]?.marcador) {
                        console.log(`Creando marcador para elemento ${elemento.id} que tiene posición válida`);
                        crearMarcadorElemento(elemento);
                    }
                }
            }
        });
        
        // Actualizar listas de destinatarios
        actualizarListaDestinatariosChat();
    });
    
    // Also listen for individual element events
    socket.on('nuevoElemento', function(elemento) {
        console.log("Nuevo elemento recibido:", elemento);
        procesarElementoRecibido(elemento);
    });
    
    socket.on('anunciarElemento', function(elemento) {
        console.log("Elemento anunciado recibido:", elemento);
        procesarElementoRecibido(elemento);
    });
    
    // Position update events
    socket.on('actualizacionPosicion', function(datos) {
        console.log("Recibida actualizacionPosicion:", datos);
        actualizarPosicionElemento(datos);
    });
    
    socket.on('actualizarPosicion', function(datos) {
        console.log("Recibido actualizarPosicion:", datos);
        actualizarPosicionElemento(datos);
    });
    
    // Process elements from chat messages too
    socket.on('mensajeChat', function(mensaje) {
        if (mensaje && mensaje.emisor && mensaje.emisor.id && mensaje.emisor.id !== usuarioInfo?.id) {
            console.log("Procesando emisor desde mensaje de chat:", mensaje.emisor);
            
            // Build element object from sender
            const elementoDesdeChat = {
                id: mensaje.emisor.id,
                usuario: mensaje.emisor.nombre || mensaje.usuario,
                elemento: mensaje.emisor.elemento || {},
                timestamp: mensaje.timestamp,
                conectado: true
            };
            
            // Process the element
            procesarElementoRecibido(elementoDesdeChat);
        }
    });
    
    console.log("Socket events for elements configured");
}

// Función auxiliar para procesar elementos recibidos de forma unificada
function procesarElementoRecibido(elemento) {
    if (!elemento || !elemento.id) {
        console.warn("Elemento inválido recibido:", elemento);
        return;
    }
    
    // Ignorar elementos propios
    if (elemento.id === usuarioInfo?.id) return;
    
    console.log(`Procesando elemento recibido: ${elemento.id}, usuario: ${elemento.usuario}`);
    
    // Verificar si ya existe este elemento
    const elementoExistente = elementosConectados[elemento.id];
    
    if (!elementoExistente) {
        // Crear nueva entrada para este elemento
        elementosConectados[elemento.id] = {
            datos: elemento,
            marcador: null
        };
        
        // Agregar a la interfaz visual
        agregarElementoALista(elemento);
        
        // Crear marcador si tiene posición válida
        if (elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
            crearMarcadorElemento(elemento);
        }
    } else {
        // Actualizar datos existentes
        elementosConectados[elemento.id].datos = {
            ...elementoExistente.datos,
            ...elemento,
            // Preservar posición y elemento con manejo explícito
            posicion: elemento.posicion || elementoExistente.datos.posicion,
            elemento: {
                ...elementoExistente.datos.elemento,
                ...(elemento.elemento || {})
            }
        };
        
        
        
        // Actualizar interfaz visual
        actualizarElementoVisual(elemento.id);
        
        // Actualizar marcador o crearlo si ahora tiene posición
        if (elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
            if (elementoExistente.marcador) {
                // Actualizar posición del marcador
                elementoExistente.marcador.setLatLng([
                    elemento.posicion.lat,
                    elemento.posicion.lng
                ]);
            } else {
                // Crear marcador nuevo
                crearMarcadorElemento(elemento);
            }
        }
    }
    
    // Actualizar lista de destinatarios de chat
    if (window.MAIRA.Chat && typeof window.MAIRA.Chat.actualizarListaDestinatarios === 'function') {
        window.MAIRA.Chat.actualizarListaDestinatarios();
    }
}

// Función auxiliar para actualizar elemento visual
function actualizarElementoVisual(elementoId) {
    const elementoVisual = document.querySelector(`.elemento-item[data-id="${elementoId}"]`);
    if (!elementoVisual) return;
    
    const datos = elementosConectados[elementoId]?.datos;
    if (!datos) return;
    
    // Actualizar campos visuales
    const nombreElement = elementoVisual.querySelector('.elemento-usuario');
    if (nombreElement && datos.usuario) {
        nombreElement.textContent = datos.usuario;
    }
    
    const designacionElement = elementoVisual.querySelector('.elemento-nombre');
    if (designacionElement && datos.elemento) {
        let textoDesignacion = datos.elemento.designacion || '';
        if (datos.elemento.dependencia) {
            textoDesignacion += '/' + datos.elemento.dependencia;
        }
        if (textoDesignacion) {
            designacionElement.textContent = textoDesignacion;
        }
    }
    
    const tiempoElement = elementoVisual.querySelector('.elemento-tiempo');
    if (tiempoElement && datos.timestamp) {
        tiempoElement.textContent = MAIRA.Utils.formatearFecha(datos.timestamp);
    }
    
    // Actualizar estado de conexión
    const statusElement = elementoVisual.querySelector('.elemento-status');
    if (statusElement) {
        statusElement.className = `elemento-status ${datos.conectado ? 'online' : 'offline'}`;
    }
}


    /**
     * Mejora en la inicialización de la lista de elementos
     * @param {Array} elementos - Lista de elementos conectados
     */
    function inicializarListaElementos(elementos) {
        console.log("Inicializando lista de elementos:", elementos?.length || 0, elementos);
        
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) {
            console.error("Contenedor de lista de elementos no encontrado (lista-elementos)");
            return;
        }
        
        // Guardar una copia del elemento propio si existe
        const elementoPropio = elementosConectados[usuarioInfo?.id];
        
        // Limpiar lista actual de elementos visuales
        listaElementos.innerHTML = '';
        
        // Inicializar con un objeto vacío pero conservando el elemento propio
        const elementosConectadosAnterior = {...elementosConectados};
        elementosConectados = {};
        if (elementoPropio) {
            elementosConectados[usuarioInfo.id] = elementoPropio;
        }
        
        // Si no hay elementos adicionales, mostrar al menos el elemento propio
        if (!elementos || elementos.length === 0) {
            if (elementoPropio && elementoPropio.datos) {
                // Si solo existe el elemento propio, añadirlo visualmente
                agregarElementoALista(elementoPropio.datos);
            } else {
                listaElementos.innerHTML = '<div class="no-elementos">No hay participantes conectados en esta operación</div>';
            }
            console.log("No hay elementos adicionales para mostrar");
            return;
        }
        
        // Mostrar el elemento propio primero si existe
        if (elementoPropio && elementoPropio.datos) {
            agregarElementoALista(elementoPropio.datos);
        }
        
        // Agregar cada elemento recibido
        elementos.forEach(function(elem) {
            // Asegurarse de que el elemento tiene datos válidos
            if (!elem || !elem.id) {
                console.warn("Elemento sin ID recibido:", elem);
                return;
            }
            
            // No volver a agregar el elemento propio si ya lo hicimos
            if (elem.id === usuarioInfo?.id) {
                console.log("Elemento propio ya agregado, no duplicando:", elem.id);
                return;
            }
            
            // Restaurar el marcador si existía previamente
            const marcadorExistente = elementosConectadosAnterior[elem.id]?.marcador || null;
            
            // Guardar en nuestra estructura de datos independientemente de si tiene posición
            elementosConectados[elem.id] = {
                datos: elem,
                marcador: marcadorExistente
            };
            
            // IMPORTANTE: Agregar a la interfaz visual aun sin posición
            agregarElementoALista(elem);
            
            // Intentar crear marcador en el mapa solo si hay posición
            if (elem.posicion && elem.posicion.lat && elem.posicion.lng) {
                // Si ya tiene marcador, lo usamos
                if (marcadorExistente) {
                    elementosConectados[elem.id].marcador = marcadorExistente;
                    // Actualizar posición por si cambió
                    marcadorExistente.setLatLng([elem.posicion.lat, elem.posicion.lng]);
                } else {
                    // Crear nuevo marcador
                    crearMarcadorElemento(elem);
                }
            } else {
                console.log(`Elemento sin posición (${elem.id} - ${elem.usuario}), se muestra en lista pero no en mapa`);
            }
        });
        
        console.log(`Inicializados ${Object.keys(elementosConectados).length} elementos conectados`);
        
        // Actualizar destinatarios para chat
        actualizarListaDestinatariosChat();
        
        // Mejorar la lista
        mejorarListaElementos();
    }
    
    // Función auxiliar para actualizar destinatarios
    function actualizarListaDestinatariosChat() {
        if (MAIRA.Chat && typeof MAIRA.Chat.actualizarListaDestinatarios === 'function') {
            console.log("Actualizando destinatarios de chat desde módulo Elementos");
            MAIRA.Chat.actualizarListaDestinatarios();
        } else {
            console.warn("Función actualizarListaDestinatarios no disponible");
        }
    }
    
    /**
     * Esta función mejora la lista de elementos conectados para mostrar más información
     * y permitir interacción directa con cada elemento.
     */
    function mejorarListaElementos() {
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) return;
        
        // Si no hay elementos, mostrar mensaje
        if (listaElementos.children.length === 0) {
            listaElementos.innerHTML = `
                <div class="no-elementos text-center p-3">
                    <i class="fas fa-users" style="font-size: 32px; color: #ccc;"></i>
                    <p class="mt-2">No hay participantes conectados en esta operación</p>
                    <button id="btn-actualizar-elementos" class="btn btn-sm btn-outline-primary mt-2">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                </div>
            `;
            
            // Configurar botón para actualizar
            const btnActualizar = document.getElementById('btn-actualizar-elementos');
            if (btnActualizar) {
                btnActualizar.addEventListener('click', function() {
                    solicitarListaElementos();
                    MAIRA.Utils.mostrarNotificacion("Solicitando lista de participantes...", "info");
                });
            }
        } else {
            // Agregar botón de actualizar en la parte superior
            if (!document.getElementById('header-lista-elementos')) {
                // Crear cabecera con título y botón de actualizar
                const headerLista = document.createElement('div');
                headerLista.id = 'header-lista-elementos';
                headerLista.className = 'd-flex justify-content-between align-items-center p-2 bg-light';
                headerLista.innerHTML = `
                    <h6 class="m-0">Participantes (${listaElementos.children.length})</h6>
                    <button id="btn-actualizar-lista" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-sync"></i>
                    </button>
                `;
                
                // Insertar al inicio de la lista
                listaElementos.parentNode.insertBefore(headerLista, listaElementos);
                
                // Configurar evento
                document.getElementById('btn-actualizar-lista').addEventListener('click', function() {
                    solicitarListaElementos();
                    MAIRA.Utils.mostrarNotificacion("Actualizando lista de participantes...", "info");
                });
            } else {
                // Actualizar contador si ya existe el header
                const contadorElementos = document.querySelector('#header-lista-elementos h6');
                if (contadorElementos) {
                    contadorElementos.textContent = `Participantes (${listaElementos.children.length})`;
                }
            }
        }
        
        // Mejorar cada elemento de la lista si no están mejorados
        document.querySelectorAll('.elemento-item').forEach(elemento => {
            // Verificar si ya tiene la clase mejorado
            if (!elemento.classList.contains('mejorado')) {
                // Agregar clase para no repetir
                elemento.classList.add('mejorado');
                
                // Obtener ID del elemento
                const elementoId = elemento.getAttribute('data-id');
                
                // Agregar botón para chat directo si existe módulo de chat
                const accionesDiv = elemento.querySelector('.elemento-acciones');
                if (accionesDiv && window.MAIRA.Chat && !accionesDiv.querySelector('.btn-chat-directo')) {
                    const btnChat = document.createElement('button');
                    btnChat.title = "Chat directo";
                    btnChat.innerHTML = '<i class="fas fa-comment"></i>';
                    btnChat.className = 'btn-chat-directo';
                    
                    // Evento para abrir chat privado con este elemento
                    btnChat.addEventListener('click', function(e) {
                        e.stopPropagation();
                        iniciarChatPrivado(elementoId);
                    });
                    
                    // Añadir antes del primer botón existente
                    accionesDiv.insertBefore(btnChat, accionesDiv.firstChild);
                }
                
                // Mejorar comportamiento del elemento (clic para ver detalle)
                elemento.addEventListener('click', function() {
                    mostrarDetallesElemento(elementoId);
                });
                
                // Añadir estilo de cursor para indicar que es clickeable
                elemento.style.cursor = 'pointer';
                
                // Añadir menú contextual
                elemento.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    mostrarMenuContextualElemento(e, elementoId);
                });
            }
        });
    }
    
    /**
     * Inicia un chat privado con un elemento específico
     * @param {string} elementoId - ID del elemento destinatario
     */
    function iniciarChatPrivado(elementoId) {
        if (!window.MAIRA.Chat) {
            console.warn("Módulo de chat no está disponible");
            return;
        }
        
        // Cambiar a la pestaña de chat
        const btnTabChat = document.querySelector('.tab-btn[data-tab="tab-chat"]');
        if (btnTabChat) {
            btnTabChat.click();
        }
        
        // Verificar si el elemento existe
        if (!elementosConectados[elementoId]) {
            MAIRA.Utils.mostrarNotificacion("No se encontró el destinatario seleccionado", "error");
            return;
        }
        
        // Iniciar chat privado
        if (typeof window.MAIRA.Chat.iniciarChatPrivado === 'function') {
            window.MAIRA.Chat.iniciarChatPrivado(elementoId);
        } else {
            // Implementación alternativa
            // Cambiar a modo chat privado
            const btnChatPrivado = document.getElementById('btn-chat-privado');
            if (btnChatPrivado) {
                btnChatPrivado.click();
            }
            
            // Seleccionar destinatario
            const selectDestinatario = document.getElementById('select-destinatario');
            if (selectDestinatario) {
                selectDestinatario.value = elementoId;
                
                // Si no existe la opción, actualizar la lista de destinatarios
                if (!selectDestinatario.value) {
                    if (typeof window.MAIRA.Chat.actualizarListaDestinatarios === 'function') {
                        window.MAIRA.Chat.actualizarListaDestinatarios();
                    }
                    setTimeout(() => {
                        selectDestinatario.value = elementoId;
                    }, 500);
                }
            }
            
            // Enfocar el campo de mensaje
            const mensajeInput = document.getElementById('mensaje-chat');
            if (mensajeInput) {
                mensajeInput.focus();
            }
        }
    }
    
    /**
     * Agrega un elemento a la lista del panel
     * @param {Object} elemento - Datos del elemento
     */

    function agregarElementoALista(elemento) {
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) {
            console.error("Lista de elementos no encontrada");
            return;
        }
        
        // Verificar si el elemento ya existe en la lista
        const elementoExistente = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
        if (elementoExistente) {
            console.log(`Elemento con ID ${elemento.id} ya existe en la lista visual`);
            return;
        }
        
        // Log detallado para depuración
        console.log(`Agregando a lista visual elemento: ${elemento.id}`, elemento);
        
        // Determinar si es el usuario actual
        const esUsuarioActual = elemento.id === usuarioInfo?.id;
        
        // Extraer correctamente la información del elemento
        let designacion = '';
        let dependencia = '';
        
        // Manejar diferentes estructuras de datos
        if (elemento.elemento) {
            designacion = elemento.elemento.designacion || '';
            dependencia = elemento.elemento.dependencia || '';
        }
        
        // Crear HTML del elemento para la lista
        const elementoHTML = `
            <div class="elemento-item ${esUsuarioActual ? 'usuario-actual' : ''}" data-id="${elemento.id}">
                <div class="elemento-icon">
                    <div class="sidc-preview"></div>
                    <span class="elemento-status ${elemento.conectado ? 'online' : 'offline'}"></span>
                </div>
                <div class="elemento-info">
                    <div class="elemento-nombre">${designacion || 'Sin designación'}${dependencia ? '/' + dependencia : ''}</div>
                    <div class="elemento-usuario">${elemento.usuario || 'Usuario desconocido'}</div>
                    <div class="elemento-tiempo">${MAIRA.Utils.formatearFecha(elemento.timestamp || new Date())}</div>
                </div>
                <div class="elemento-acciones">
                    <button title="Ver detalles" class="btn-detalles">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button title="Centrar en mapa" class="btn-centrar">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                    ${!esUsuarioActual ? `
                    <button title="Chat privado" class="btn-chat-privado">
                        <i class="fas fa-comment"></i>
                    </button>` : ''}
                </div>
            </div>
        `;
        
        // Si es el usuario actual, insertar al principio de la lista para que aparezca primero
        if (esUsuarioActual) {
            listaElementos.insertAdjacentHTML('afterbegin', elementoHTML);
        } else {
            listaElementos.insertAdjacentHTML('beforeend', elementoHTML);
        }
        
        // Actualizar el icono SIDC
        const contenedor = listaElementos.querySelector(`.elemento-item[data-id="${elemento.id}"] .sidc-preview`);
        let sidc = 'SFGPUCI-----'; // SIDC por defecto
        
        if (elemento.elemento && elemento.elemento.sidc) {
            sidc = elemento.elemento.sidc;
        }
        
        if (contenedor && typeof ms !== 'undefined') {
            try {
                const sym = new ms.Symbol(sidc, {size: 20});
                contenedor.innerHTML = sym.asSVG();
            } catch (e) {
                console.warn(`Error al generar símbolo para elemento ${elemento.id} en lista:`, e);
                contenedor.innerHTML = '<div style="width:20px;height:20px;background:#888;border-radius:50%;"></div>';
            }
        }
        
        // Configurar eventos para los botones
        const itemElemento = listaElementos.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
        if (itemElemento) {
            // Botón de detalles
            const btnDetalles = itemElemento.querySelector('.btn-detalles');
            if (btnDetalles) {
                btnDetalles.addEventListener('click', function(e) {
                    e.stopPropagation();
                    mostrarDetallesElemento(elemento.id);
                });
            }
            
            // Botón de centrar
            const btnCentrar = itemElemento.querySelector('.btn-centrar');
            if (btnCentrar) {
                btnCentrar.addEventListener('click', function(e) {
                    e.stopPropagation();
                    centrarEnElemento(elemento.id);
                });
            }
            
            // Botón de chat privado (solo para elementos de otros jugadores)
            const btnChatPrivado = itemElemento.querySelector('.btn-chat-privado');
            if (btnChatPrivado) {
                btnChatPrivado.addEventListener('click', function(e) {
                    e.stopPropagation();
                    // Iniciar chat privado con este elemento
                    iniciarChatPrivado(elemento.id);
                });
            }
            
            // Clic en el elemento completo
            itemElemento.addEventListener('click', function() {
                mostrarDetallesElemento(elemento.id);
            });
        }
        
        console.log(`Elemento con ID ${elemento.id} agregado a la lista visual`);
        
        // Actualizar contador
        actualizarContadorElementos();
    }
    
    /**
     * Actualiza la lista de elementos
     * @param {Object} elemento - Datos del nuevo elemento
     */
    function actualizarListaElementos(elemento) {
        if (!elemento || !elemento.id) return;
        
        // Añadir a nuestra estructura de datos
        elementosConectados[elemento.id] = {
            datos: elemento,
            marcador: null
        };
        
        // Añadir a la lista visual
        agregarElementoALista(elemento);
        
        // Crear marcador en el mapa
        crearMarcadorElemento(elemento);
        
        // Mejorar la lista de elementos
        mejorarListaElementos();
        
        // Actualizar contador en la cabecera
        actualizarContadorElementos();
    }
    
    /**
     * Elimina un elemento de la lista y del mapa
     * @param {string} id - ID del elemento a eliminar
     */
    function eliminarElementoLista(id) {
        if (!id) return;
        
        // Eliminar marcador del mapa
        if (elementosConectados[id]?.marcador && window.mapa) {
            try {
                window.mapa.removeLayer(elementosConectados[id].marcador);
            } catch (e) {
                console.warn("Error al eliminar marcador del mapa:", e);
            }
        }
        
        // Eliminar elemento de la lista
        const elementoItem = document.querySelector(`.elemento-item[data-id="${id}"]`);
        if (elementoItem) {
            elementoItem.remove();
        }
        
        // Eliminar de nuestro registro
        delete elementosConectados[id];
        
        // Actualizar contador en la cabecera
        actualizarContadorElementos();
        
        // Si estaba siguiendo este elemento, detener seguimiento
        if (siguiendoElemento === id) {
            detenerSeguimientoElemento();
        }
    }
    
    /**
     * Actualiza el contador de elementos en la cabecera
     */
    // En elementosGB.js - Función para actualizar el contador
function actualizarContadorElementos() {
    const contadorElementos = document.querySelector('#header-lista-elementos h6');
    if (contadorElementos) {
        // Contar solo elementos válidos (no nulos)
        const elementosValidos = Object.values(elementosConectados).filter(elem => 
            elem && elem.datos && elem.datos.usuario
        );
        
        const total = elementosValidos.length;
        contadorElementos.textContent = `Participantes (${total})`;
        
        console.log(`Contador actualizado: ${total} participantes válidos de ${Object.keys(elementosConectados).length} registrados`);
    }
}
    
    /**
     * Actualiza la posición de un elemento en el mapa
     * @param {Object} data - Datos de posición
     */
    
/**
 * Actualiza la posición de un elemento en el mapa
 * @param {Object} datos - Datos de posición
 */
function actualizarPosicionElemento(datos) {
    console.log("Procesando actualización de posición:", datos);
    
    // Validar que tengamos datos mínimos
    if (!datos || !datos.id) {
        console.warn("Datos de actualización incompletos");
        return;
    }
    
    // No procesar actualizaciones propias
    if (datos.id === usuarioInfo?.id) return;
    
    // Normalizar formato de posición
    let posicionValida = false;
    let posicionNormalizada = null;
    
    if (datos.posicion) {
        // Asegurar que posicion tiene lat/lng o latitude/longitude
        if (typeof datos.posicion.lat !== 'undefined' && typeof datos.posicion.lng !== 'undefined') {
            posicionValida = true;
            posicionNormalizada = datos.posicion;
        } else if (typeof datos.posicion.latitude !== 'undefined' && typeof datos.posicion.longitude !== 'undefined') {
            // Convertir formato alternativo
            posicionNormalizada = {
                lat: datos.posicion.latitude,
                lng: datos.posicion.longitude,
                precision: datos.posicion.accuracy || datos.posicion.precision || 10,
                rumbo: datos.posicion.heading || datos.posicion.rumbo || 0
            };
            posicionValida = true;
        }
    } else if (datos.coords) {
        // Formato de geolocalización del navegador
        posicionNormalizada = {
            lat: datos.coords.latitude || datos.coords.lat,
            lng: datos.coords.longitude || datos.coords.lng,
            precision: datos.coords.accuracy || 10,
            rumbo: datos.coords.heading || 0,
            velocidad: datos.coords.speed || 0
        };
        posicionValida = true;
    }
    
    // Si no se pudo normalizar la posición, intentar extraerla del elemento
    if (!posicionValida && datos.elemento && datos.elemento.posicion) {
        posicionNormalizada = datos.elemento.posicion;
        posicionValida = typeof posicionNormalizada.lat !== 'undefined' && 
                         typeof posicionNormalizada.lng !== 'undefined';
    }
    
    // Guardar los datos actualizados en la estructura de datos principal
    if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.actualizarElementoConectado) {
        // Usar la función centralizada para actualizar
        window.MAIRA.GestionBatalla.actualizarElementoConectado(datos.id, datos, posicionNormalizada);
    } else {
        // Actualización local como fallback
        // Asegurarnos de que existe la entrada para este elemento
        if (!elementosConectados[datos.id]) {
            elementosConectados[datos.id] = {
                datos: { ...datos, posicion: posicionNormalizada },
                marcador: null
            };
        } else {
            // IMPORTANTE: Actualizar posición preservando otros datos
            elementosConectados[datos.id].datos = {
                ...elementosConectados[datos.id].datos,
                ...datos,
                posicion: posicionNormalizada || elementosConectados[datos.id].datos.posicion
            };
        }
        
        // Actualizar marcador si existe o crear uno nuevo
        if (posicionValida) {
            if (elementosConectados[datos.id].marcador) {
                elementosConectados[datos.id].marcador.setLatLng([
                    posicionNormalizada.lat, 
                    posicionNormalizada.lng
                ]);
            } else {
                // Crear marcador solo si la función está disponible
                if (typeof crearMarcadorElemento === 'function') {
                    const marcador = crearMarcadorElemento(elementosConectados[datos.id].datos);
                    if (marcador) {
                        elementosConectados[datos.id].marcador = marcador;
                    }
                }
            }
        }
    }
    
    // Actualizar visualmente el elemento
    actualizarElementoVisual(datos.id);
    
    // Actualizar lista de destinatarios del chat
    if (MAIRA.Chat && typeof MAIRA.Chat.actualizarListaDestinatarios === 'function') {
        setTimeout(() => MAIRA.Chat.actualizarListaDestinatarios(), 200);
    }
}

// Añadir a GB.js una función centralizada para actualizar elementos conectados
function actualizarElementoConectado(id, datos, posicion) {
    // No procesar actualizaciones propias
    if (id === usuarioInfo?.id) return;
    
    console.log(`Actualizando elemento conectado: ${id}`, datos);
    
    // Asegurarnos de que existe la entrada
    if (!elementosConectados[id]) {
        elementosConectados[id] = {
            datos: datos,
            marcador: null
        };
        
        // Añadir visualmente si no existe
        añadirElementoVisual(datos);
    } else {
        // Actualizar preservando campos existentes
        elementosConectados[id].datos = {
            ...elementosConectados[id].datos,
            ...datos,
            // Si se proporciona posición, actualizarla
            posicion: posicion || elementosConectados[id].datos.posicion
        };
    }
    
    // Si hay posición válida, actualizar o crear marcador
    if (posicion && posicion.lat && posicion.lng) {
        if (elementosConectados[id].marcador) {
            // Actualizar posición
            elementosConectados[id].marcador.setLatLng([posicion.lat, posicion.lng]);
        } else if (MAIRA.Elementos && typeof MAIRA.Elementos.crearMarcadorElemento === 'function') {
            // Crear nuevo marcador
            const marcador = MAIRA.Elementos.crearMarcadorElemento(elementosConectados[id].datos);
            if (marcador) {
                elementosConectados[id].marcador = marcador;
            }
        }
    }
    
    // Sincronizar con los demás módulos
    sincronizarElementos();
}

// Exponer las funciones necesarias en el API público
if (window.MAIRA && window.MAIRA.GestionBatalla) {
    window.MAIRA.GestionBatalla.actualizarElementoConectado = actualizarElementoConectado;
} else {
    console.warn("MAIRA.GestionBatalla no disponible para asignar actualizarElementoConectado");
    // Make sure this function is available globally as a fallback
    window.actualizarElementoConectado = actualizarElementoConectado;
}

if (window.MAIRA && window.MAIRA.GestionBatalla) {
    window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
} else {
    // Como fallback, hacerlo disponible globalmente
    window.elementosConectados = elementosConectados;
    console.warn("MAIRA.GestionBatalla no disponible para asignar elementosConectados");
}
    /**
     * Crea un marcador para el elemento en el mapa
     * @param {Object} elemento - Datos del elemento
     * @returns {L.Marker} - Marcador creado
     */
    function crearMarcadorElemento(elemento) {
        if (!elemento) {
            console.error("No se proporcionaron datos para crear marcador");
            return null;
        }
        
        // Si no hay posición válida, solo registramos el elemento sin marcador
        if (!elemento.posicion || !elemento.posicion.lat || !elemento.posicion.lng) {
            console.log(`Elemento sin posición válida: ${elemento.id} (${elemento.usuario}). Se agregará a la lista sin marcador.`);
            
            // Asegurarnos de que se agregue a la lista visual aunque no tenga marcador
            if (!document.querySelector(`.elemento-item[data-id="${elemento.id}"]`)) {
                agregarElementoALista(elemento);
            }
            
            return null;
        }
        
        console.log("Creando marcador para elemento:", elemento);
        
        // Configurar SIDC
        let sidc = elemento.elemento?.sidc || 'SFGPUCI-----'; // Valor predeterminado si no hay SIDC
        
        // Crear etiqueta
        let etiqueta = "";
        if (elemento.elemento?.designacion) {
            etiqueta = elemento.elemento.designacion;
            if (elemento.elemento.dependencia) {
                etiqueta += "/" + elemento.elemento.dependencia;
            }
        } else if (elemento.usuario) {
            etiqueta = elemento.usuario;
        }
        
        try {
            // Crear símbolo
            const sym = new ms.Symbol(sidc, {
                size: 35,
                direction: elemento.posicion.rumbo || 0,
                uniqueDesignation: etiqueta
            });
            
            // Crear marcador
            const marcador = L.marker([elemento.posicion.lat, elemento.posicion.lng], {
                icon: L.divIcon({
                    className: 'elemento-militar',
                    html: sym.asSVG(),
                    iconSize: [70, 50],
                    iconAnchor: [35, 25]
                }),
                title: etiqueta ? `${etiqueta} (${elemento.usuario})` : elemento.usuario,
                draggable: false,
                elementoId: elemento.id
            });
            
            // Añadir al mapa
            if (window.mapa) {
                marcador.addTo(window.calcoActivo || window.mapa);
                
                // Configurar eventos
                marcador.on('click', function() {
                    mostrarDetallesElemento(elemento.id);
                });
                
                marcador.on('contextmenu', function(e) {
                    mostrarMenuContextualMarcador(e, elemento.id);
                });
            }
            
            // Guardar referencia
            elementosConectados[elemento.id] = elementosConectados[elemento.id] || {};
            elementosConectados[elemento.id].marcador = marcador;
            elementosConectados[elemento.id].datos = elemento;
            
            console.log(`Marcador creado exitosamente para: ${etiqueta || elemento.usuario}`);
            return marcador;
        } catch (e) {
            console.error("Error al crear marcador para elemento:", e);
            return null;
        }
    }
    
    /**
     * Actualiza el marcador del usuario
     * @param {number} lat - Latitud
     * @param {number} lng - Longitud
     * @param {number} heading - Rumbo en grados
     */
    function actualizarMarcadorUsuario(lat, lng, heading) {
        if (!window.mapa) {
            console.error("Mapa no disponible para actualizar marcador");
            return;
        }
        
        const nuevaPosicion = L.latLng(lat, lng);
        console.log(`Actualizando marcador de usuario en: ${lat}, ${lng}`);
        
        // Si el marcador no existe o no está en el mapa, lo creamos
        if (!marcadorUsuario || !window.mapa.hasLayer(marcadorUsuario)) {
            console.log("Creando nuevo marcador de usuario");
            
            // Verificar si existe función constructora para símbolos militares
            if (typeof ms !== 'undefined' && typeof ms.Symbol === 'function' && elementoTrabajo?.sidc) {
                console.log("Usando símbolo militar para el marcador:", elementoTrabajo.sidc);
                
                try {
                    // Crear etiqueta en formato correcto
                    let etiqueta = "";
                    if (elementoTrabajo.designacion) {
                        etiqueta = elementoTrabajo.designacion;
                        if (elementoTrabajo.dependencia) {
                            etiqueta += "/" + elementoTrabajo.dependencia;
                        }
                    }
                    
                    // Crear icono con SIDC
                    const symbol = new ms.Symbol(elementoTrabajo.sidc, {
                        size: 30,
                        direction: heading || 0,
                        uniqueDesignation: etiqueta
                    });
                    
                    // Comprobar que el símbolo se generó correctamente
                    if (symbol) {
                        // Crear marcador
                        marcadorUsuario = L.marker(nuevaPosicion, {
                            icon: L.divIcon({
                                className: 'custom-div-icon usuario',
                                html: symbol.asSVG(),
                                iconSize: [40, 40],
                                iconAnchor: [20, 20]
                            }),
                            title: 'Tu posición',
                            sidc: elementoTrabajo.sidc,
                            designacion: elementoTrabajo.designacion,
                            dependencia: elementoTrabajo.dependencia
                        });
                        
                        // Asegurarse de que se añada al calco activo o al mapa
                        if (window.calcoActivo) {
                            marcadorUsuario.addTo(window.calcoActivo);
                        } else {
                            marcadorUsuario.addTo(window.mapa);
                        }
                        
                        console.log("Marcador de usuario añadido al mapa");
                        
                        // Configurar evento de clic para el menú contextual
                        marcadorUsuario.on('contextmenu', function(e) {
                            mostrarMenuContextualMarcador(e, 'usuario');
                        });
                    } else {
                        console.error("No se pudo generar el símbolo militar");
                        crearMarcadorUsuarioSimple(nuevaPosicion);
                    }
                } catch (error) {
                    console.error("Error al crear símbolo militar:", error);
                    crearMarcadorUsuarioSimple(nuevaPosicion);
                }
            } else {
                console.log("Usando marcador estándar (no se encontró milsymbol o no hay SIDC)");
                crearMarcadorUsuarioSimple(nuevaPosicion);
            }
        } else {
            // Actualizar posición si ya existe
            console.log("Actualizando posición del marcador existente");
            marcadorUsuario.setLatLng(nuevaPosicion);
            
            // Actualizar dirección si está disponible
            if (heading !== null && heading !== undefined && typeof heading === 'number') {
                try {
                    if (marcadorUsuario.setRotationAngle) {
                        marcadorUsuario.setRotationAngle(heading);
                    } else if (marcadorUsuario.options.icon && marcadorUsuario.options.icon.options && marcadorUsuario.options.icon.options.html) {
                        // Si el marcador tiene un icono HTML, intenta actualizarlo
                        const container = marcadorUsuario.getElement();
                        if (container) {
                            const iconContainer = container.querySelector('div');
                            if (iconContainer) {
                                iconContainer.style.transform = `rotate(${heading}deg)`;
                            }
                        }
                    }
                } catch (error) {
                    console.warn("Error al actualizar rotación del marcador:", error);
                }
            }
        }
        
        // Centrar mapa si el seguimiento está activo
        if (seguimientoActivo && window.mapa) {
            window.mapa.setView(nuevaPosicion);
        }
    }
    
    /**
     * Función auxiliar para crear un marcador simple cuando no se puede usar milsymbol
     * @param {L.LatLng} posicion - Posición del marcador
     */
    function crearMarcadorUsuarioSimple(posicion) {
        marcadorUsuario = L.marker(posicion, {
            icon: L.divIcon({
                className: 'custom-div-icon usuario',
                html: '<div style="background-color:#0281a8;width:20px;height:20px;border-radius:50%;border:2px solid white;"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            title: 'Tu posición'
        });
        
        if (window.calcoActivo) {
            marcadorUsuario.addTo(window.calcoActivo);
        } else {
            marcadorUsuario.addTo(window.mapa);
        }
        
        // Configurar evento de clic para el menú contextual
        marcadorUsuario.on('contextmenu', function(e) {
            mostrarMenuContextualMarcador(e, 'usuario');
        });
        
        console.log("Marcador simple añadido al mapa");
    }
    
    /**
     * Inicia el seguimiento de posición del usuario
     */
    function iniciarSeguimiento() {
        console.log("Iniciando seguimiento de posición");
        
        // Comprobar si ya hay un seguimiento activo
        if (seguimientoActivo) {
            console.log("El seguimiento ya está activo");
            return;
        }
        
        // Comprobar soporte de geolocalización
        if (!navigator.geolocation) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
            MAIRA.Utils.agregarMensajeChat("Sistema", "Tu navegador no soporta geolocalización.", "sistema");
            return;
        }
        
        // Configurar botón de seguimiento como activo
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        if (btnSeguimiento) {
            btnSeguimiento.classList.add('active');
            btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow text-primary"></i> Seguimiento activo';
        }
        
        // Mostrar mensaje en el chat
        MAIRA.Utils.agregarMensajeChat("Sistema", "Iniciando seguimiento de posición...", "sistema");
        
        // Opciones de seguimiento optimizadas para móviles
        const opcionesSeguimiento = {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        };
        
        // Para dispositivos móviles, reducir frecuencia para ahorrar batería
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            opcionesSeguimiento.maximumAge = 10000; // Más tiempo entre actualizaciones
        }
        
        try {
            // Iniciar seguimiento continuo
            watchId = navigator.geolocation.watchPosition(
                posicionActualizada,
                errorPosicion,
                opcionesSeguimiento
            );
            
            // Activar la variable de seguimiento
            seguimientoActivo = true;
            
            MAIRA.Utils.agregarMensajeChat("Sistema", "Seguimiento de posición activado", "sistema");
            console.log("Seguimiento iniciado con éxito");
            
            // Guardar estado en localStorage
            localStorage.setItem('seguimiento_activo', 'true');
        } catch (e) {
            console.error("Error al iniciar seguimiento:", e);
            MAIRA.Utils.mostrarNotificacion("Error al iniciar seguimiento de posición", "error");
            
            // Revertir estado del botón
            if (btnSeguimiento) {
                btnSeguimiento.classList.remove('active');
                btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow"></i> Seguimiento';
            }
        }
    }
    
    /**
     * Detiene el seguimiento de posición del usuario
     */
    function detenerSeguimiento() {
        console.log("Deteniendo seguimiento de posición");
        
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        
        seguimientoActivo = false;
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        if (btnSeguimiento) {
            btnSeguimiento.classList.remove('active');
            btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow"></i> Seguimiento';
        }
        
        MAIRA.Utils.agregarMensajeChat("Sistema", "Seguimiento de posición desactivado", "sistema");
        
        // Actualizar localStorage
        localStorage.setItem('seguimiento_activo', 'false');
    }
    
    /**
     * Alterna el estado del seguimiento de posición del usuario
     */
    function toggleSeguimiento() {
        if (seguimientoActivo) {
            detenerSeguimiento();
        } else {
            iniciarSeguimiento();
        }
    }
    
    /**
     * Maneja la actualización de posición del usuario
     * @param {GeolocationPosition} posicion - Objeto de posición del navegador
     */
    function posicionActualizada(posicion) {
        console.log("Posición actualizada:", posicion.coords);
        
        const { latitude, longitude, accuracy, heading, speed } = posicion.coords;
        
        // Guardar información de la última posición
        ultimaPosicion = {
            lat: latitude,
            lng: longitude,
            precision: accuracy,
            rumbo: heading || 0,
            velocidad: speed || 0,
            timestamp: new Date()
        };
        
        // Guardar en localStorage
        localStorage.setItem('ultima_posicion', JSON.stringify(ultimaPosicion));
        
        // Actualizar posición en el mapa
        actualizarMarcadorUsuario(latitude, longitude, heading);
        
        // Enviar posición al servidor si estamos conectados
        if (socket && socket.connected && usuarioInfo) {
            socket.emit('actualizarPosicion', {
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                posicion: {
                    lat: latitude,
                    lng: longitude,
                    precision: accuracy,
                    rumbo: heading || 0,
                    velocidad: speed || 0
                },
                timestamp: new Date().toISOString()
            });
        } else if (usuarioInfo) {
            // Almacenar posición para enviar cuando se conecte
            if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.colaPendiente) {
                window.MAIRA.GestionBatalla.colaPendiente.posiciones.push({
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: {
                        lat: latitude,
                        lng: longitude,
                        precision: accuracy,
                        rumbo: heading || 0,
                        velocidad: speed || 0
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    /**
     * Maneja errores de geolocalización
     * @param {GeolocationPositionError} error - Error de geolocalización
     */
    function errorPosicion(error) {
        console.error("Error de geolocalización:", error);
        
        let mensaje = "Error al obtener posición";
        switch (error.code) {
            case error.PERMISSION_DENIED:
                mensaje = "Permiso de geolocalización denegado";
                break;
            case error.POSITION_UNAVAILABLE:
                mensaje = "Información de posición no disponible";
                break;
            case error.TIMEOUT:
                mensaje = "Tiempo de espera agotado para obtener posición";
                break;
        }
        
        MAIRA.Utils.agregarMensajeChat("Sistema", mensaje, "sistema");
        MAIRA.Utils.mostrarNotificacion(mensaje, "error");
        detenerSeguimiento();
    }
    
    /**
     * Centra el mapa en la posición actual del usuario
     */
    function centrarEnPosicion() {
        console.log("Centrando mapa en posición actual");
        
        if (marcadorUsuario && window.mapa && window.mapa.hasLayer(marcadorUsuario)) {
            window.mapa.setView(marcadorUsuario.getLatLng(), 15);
            MAIRA.Utils.mostrarNotificacion("Mapa centrado en tu posición", "info", 2000);
        } else {
            // Si no hay marcador, intentar obtener posición actual
            try {
                if (ultimaPosicion) {
                    if (window.mapa) {
                        window.mapa.setView([ultimaPosicion.lat, ultimaPosicion.lng], 15);
                        MAIRA.Utils.mostrarNotificacion("Mapa centrado en tu última posición", "info", 2000);
                    }
                } else {
                    // Intentar obtener posición actual
                    if (navigator.geolocation) {
                        MAIRA.Utils.mostrarNotificacion("Obteniendo tu ubicación...", "info");
                        navigator.geolocation.getCurrentPosition(
                            function(posicion) {
                                window.mapa.setView([posicion.coords.latitude, posicion.coords.longitude], 15);
                                MAIRA.Utils.mostrarNotificacion("Mapa centrado en tu posición", "success", 2000);
                            },
                            function(error) {
                                console.error("Error al obtener posición:", error);
                                MAIRA.Utils.mostrarNotificacion("No se pudo obtener tu posición", "error");
                            },
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                    } else {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
                    }
                }
            } catch (error) {
                console.error("Error al centrar en posición:", error);
                MAIRA.Utils.agregarMensajeChat("Sistema", "No se pudo obtener tu posición actual", "sistema");
                MAIRA.Utils.mostrarNotificacion("No se pudo centrar en tu posición", "error");
            }
        }
    }
    
    /**
     * Centra el mapa en un elemento específico
     * @param {string} elementoId - ID del elemento a centrar
     */
    function centrarEnElemento(elementoId) {
        if (!elementosConectados[elementoId] || !elementosConectados[elementoId].marcador) {
            MAIRA.Utils.mostrarNotificacion("Elemento no encontrado", "error");
            return;
        }
        
        const posicion = elementosConectados[elementoId].marcador.getLatLng();
        if (window.mapa) {
            window.mapa.setView(posicion, 15);
            elementosConectados[elementoId].marcador.openPopup();
            MAIRA.Utils.mostrarNotificacion("Mapa centrado en el elemento seleccionado", "info", 2000);
        }
    }
    
    /**
     * Inicia el seguimiento de un elemento en el mapa
     * @param {string} elementoId - ID del elemento a seguir
     */
    function iniciarSeguimientoElemento(elementoId) {
        if (!elementosConectados[elementoId]) {
            MAIRA.Utils.mostrarNotificacion("Elemento no encontrado", "error");
            return;
        }
        
        // Guardar elemento a seguir
        siguiendoElemento = elementoId;
        
        // Centrar inmediatamente
        if (elementosConectados[elementoId].marcador) {
            window.mapa.setView(elementosConectados[elementoId].marcador.getLatLng(), 15);
        }
        
        // Mostrar indicador visual de seguimiento
        mostrarIndicadorSeguimiento(elementoId);
        
        MAIRA.Utils.mostrarNotificacion(`Siguiendo a ${elementosConectados[elementoId].datos.usuario}`, "info");
    }
    
    /**
     * Detiene el seguimiento de un elemento
     */
    function detenerSeguimientoElemento() {
        siguiendoElemento = null;
        
        // Ocultar indicador de seguimiento
        ocultarIndicadorSeguimiento();
        
        MAIRA.Utils.mostrarNotificacion("Seguimiento finalizado", "info");
    }
    
    /**
     * Muestra un indicador visual del elemento que se está siguiendo
     * @param {string} elementoId - ID del elemento que se está siguiendo
     */
    function mostrarIndicadorSeguimiento(elementoId) {
        // Ocultar indicador existente si lo hay
        ocultarIndicadorSeguimiento();
        
        // Obtener datos del elemento
        const elemento = elementosConectados[elementoId]?.datos;
        if (!elemento) return;
        
        // Crear indicador
        const indicador = document.createElement('div');
        indicador.id = 'indicador-seguimiento';
        indicador.className = 'siguiendo-elemento';
        indicador.innerHTML = `
            <i class="fas fa-crosshairs"></i>
            <span>Siguiendo a ${elemento.usuario} (${elemento.elemento?.designacion || 'Sin designación'})</span>
            <button id="btn-detener-seguimiento" title="Detener seguimiento">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Añadir al DOM
        document.body.appendChild(indicador);
        
        // Configurar evento para detener seguimiento
        document.getElementById('btn-detener-seguimiento').addEventListener('click', detenerSeguimientoElemento);
    }
    
    /**
     * Oculta el indicador de seguimiento
     */
    function ocultarIndicadorSeguimiento() {
        const indicador = document.getElementById('indicador-seguimiento');
        if (indicador) {
            document.body.removeChild(indicador);
        }
    }
    
    /**
     * Muestra todos los elementos en el mapa
     */
    function mostrarTodosElementos() {
        console.log("Mostrando todos los elementos en el mapa");
        
        if (!window.mapa) {
            console.error("Mapa no disponible");
            return;
        }
        
        // Crear un grupo con todos los marcadores
        const grupo = new L.featureGroup();
        
        // Añadir marcador del usuario
        if (marcadorUsuario && window.mapa.hasLayer(marcadorUsuario)) {
            grupo.addLayer(marcadorUsuario);
            console.log("Marcador del usuario añadido al grupo");
        } else if (ultimaPosicion) {
            console.log("Creando marcador de usuario a partir de última posición conocida");
            actualizarMarcadorUsuario(ultimaPosicion.lat, ultimaPosicion.lng, ultimaPosicion.rumbo);
            if (marcadorUsuario) {
                grupo.addLayer(marcadorUsuario);
            }
        }
        
        // Añadir marcadores de otros elementos
        let elementosAñadidos = 0;
        
        if (elementosConectados && Object.keys(elementosConectados).length > 0) {
            Object.values(elementosConectados).forEach(elem => {
                if (elem.marcador) {
                    grupo.addLayer(elem.marcador);
                    elementosAñadidos++;
                    console.log(`Elemento añadido al grupo: ${elem.datos?.elemento?.designacion || 'Sin designación'}`);
                } else if (elem.datos && elem.datos.posicion) {
                    console.log("Elemento sin marcador pero con posición, creando marcador:", elem.datos);
                    crearMarcadorElemento(elem.datos);
                    if (elem.marcador) {
                        grupo.addLayer(elem.marcador);
                        elementosAñadidos++;
                    }
                }
            });
        } else {
            console.log("No hay elementos conectados para mostrar");
        }
        
        console.log(`Total de elementos añadidos al grupo: ${elementosAñadidos}`);
        
        // Si hay elementos, ajustar el mapa para mostrarlos todos
        if (grupo.getLayers().length > 0) {
            try {
                const bounds = grupo.getBounds();
                console.log("Ajustando vista a los límites:", bounds);
                window.mapa.fitBounds(bounds, { 
                    padding: [50, 50],
                    maxZoom: 15
                });
                MAIRA.Utils.mostrarNotificacion(`Mostrando ${grupo.getLayers().length} elementos en el mapa`, "success", 3000);
            } catch (error) {
                console.error("Error al ajustar vista:", error);
                
                // Si hay un error con los límites, intentar centrar en el primer elemento
                if (marcadorUsuario) {
                    window.mapa.setView(marcadorUsuario.getLatLng(), 13);
                } else if (Object.values(elementosConectados).length > 0) {
                    const primerElemento = Object.values(elementosConectados)[0];
                    if (primerElemento.marcador) {
                        window.mapa.setView(primerElemento.marcador.getLatLng(), 13);
                    } else if (primerElemento.datos && primerElemento.datos.posicion) {
                        window.mapa.setView([
                            primerElemento.datos.posicion.lat,
                            primerElemento.datos.posicion.lng
                        ], 13);
                    }
                }
            }
        } else {
            console.log("No hay elementos para mostrar en el mapa");
            MAIRA.Utils.agregarMensajeChat("Sistema", "No hay elementos para mostrar en el mapa", "sistema");
            MAIRA.Utils.mostrarNotificacion("No hay elementos para mostrar", "info");
        }
    }
    
    /**
     * Busca elementos según el texto ingresado
     * @param {string} texto - Texto para buscar
     */
    function buscarElementos(texto) {
        const resultadosDiv = document.getElementById('resultados-busqueda-elementos');
        if (!resultadosDiv) return;
        
        // Limpiar resultados anteriores
        resultadosDiv.innerHTML = '';
        
        if (!texto.trim()) return;
        
        const textoBusqueda = texto.toLowerCase();
        const resultados = [];
        
        // Buscar en elementos conectados
        Object.entries(elementosConectados).forEach(([id, datos]) => {
            if (!datos.datos || !datos.datos.elemento) return;
            
            const elemento = datos.datos.elemento;
            const usuario = datos.datos.usuario;
            
            if ((elemento.designacion && elemento.designacion.toLowerCase().includes(textoBusqueda)) || 
                (elemento.dependencia && elemento.dependencia.toLowerCase().includes(textoBusqueda)) || 
                (usuario && usuario.toLowerCase().includes(textoBusqueda))) {
                
                resultados.push({
                    id: id,
                    datos: datos.datos
                });
            }
        });
        
        // Si hay marcador propio y coincide con la búsqueda, agregarlo
        if (marcadorUsuario && usuarioInfo) {
            const designacion = elementoTrabajo.designacion || '';
            const dependencia = elementoTrabajo.dependencia || '';
            
            if (designacion.toLowerCase().includes(textoBusqueda) || 
                dependencia.toLowerCase().includes(textoBusqueda) || 
                usuarioInfo.usuario.toLowerCase().includes(textoBusqueda)) {
                
                resultados.unshift({
                    id: 'usuario-actual',
                    datos: {
                        elemento: {
                            designacion: designacion,
                            dependencia: dependencia
                        },
                        usuario: usuarioInfo.usuario,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        }
        
        // Mostrar resultados
        if (resultados.length > 0) {
            resultados.forEach(resultado => {
                const elementoItem = document.createElement('a');
                elementoItem.href = '#';
                elementoItem.className = 'list-group-item list-group-item-action';
                elementoItem.setAttribute('data-id', resultado.id);
                
                elementoItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${resultado.datos.elemento.designacion || 'Sin designación'}</h6>
                            <p class="mb-1">${resultado.datos.usuario}</p>
                        </div>
                        <small>${MAIRA.Utils.formatearFecha(resultado.datos.timestamp)}</small>
                    </div>
                `;
                
                elementoItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    const elementoId = this.getAttribute('data-id');
                    
                    if (elementoId === 'usuario-actual') {
                        centrarEnPosicion();
                    } else {
                        centrarEnElemento(elementoId);
                    }
                    
                    // Cerrar modal
                    if (typeof $('#modalBuscarElemento').modal === 'function') {
                        $('#modalBuscarElemento').modal('hide');
                    } else {
                        document.getElementById('modalBuscarElemento').style.display = 'none';
                    }
                });
                
                resultadosDiv.appendChild(elementoItem);
            });
        } else {
            const noResultados = document.createElement('div');
            noResultados.className = 'list-group-item';
            noResultados.textContent = 'No se encontraron elementos';
            resultadosDiv.appendChild(noResultados);
        }
    }
    
    /**
     * Muestra los detalles de un elemento
     * @param {string} id - ID del elemento
     */
    function mostrarDetallesElemento(id) {
        const elemento = elementosConectados[id]?.datos;
        if (!elemento) return;
        
        // Si estamos usando Bootstrap, mostrar en un modal
        const modalContenido = document.getElementById('detalles-elemento-contenido');
        if (modalContenido) {
            // Formato de la última actualización
            const ultimaActualizacion = elemento.timestamp ? 
                new Date(elemento.timestamp).toLocaleString() : 'No disponible';
            
            // Crear HTML con los detalles
            let detallesHTML = `
                <div class="detalles-elemento">
                    <div class="sidc-preview-grande"></div>
                    <table class="tabla-detalles">
                        <tr>
                            <th>Usuario:</th>
                            <td>${elemento.usuario || 'No disponible'}</td>
                        </tr>
                        <tr>
                            <th>Designación:</th>
                            <td>${elemento.elemento.designacion || 'No disponible'}</td>
                        </tr>
                        <tr>
                            <th>Dependencia:</th>
                            <td>${elemento.elemento.dependencia || 'No disponible'}</td>
                        </tr>
                        <tr>
                            <th>Estado:</th>
                            <td>${elemento.conectado ? 'Conectado' : 'Desconectado'}</td>
                        </tr>
                        <tr>
                            <th>Última actualización:</th>
                            <td>${ultimaActualizacion}</td>
                        </tr>
                `;
            
            // Añadir datos de posición si están disponibles
            if (elemento.posicion) {
                detallesHTML += `
                        <tr>
                            <th>Posición:</th>
                            <td>Lat: ${elemento.posicion.lat.toFixed(6)}, Lng: ${elemento.posicion.lng.toFixed(6)}</td>
                        </tr>`;
                        
                if (elemento.posicion.precision) {
                    detallesHTML += `
                        <tr>
                            <th>Precisión:</th>
                            <td>${elemento.posicion.precision.toFixed(1)} metros</td>
                        </tr>`;
                }
                
                if (elemento.posicion.rumbo !== undefined) {
                    detallesHTML += `
                        <tr>
                            <th>Rumbo:</th>
                            <td>${elemento.posicion.rumbo.toFixed(1)}°</td>
                        </tr>`;
                }
                
                if (elemento.posicion.velocidad !== undefined) {
                    detallesHTML += `
                        <tr>
                            <th>Velocidad:</th>
                            <td>${elemento.posicion.velocidad.toFixed(1)} m/s</td>
                        </tr>`;
                }
            }
            
            detallesHTML += `
                    </table>
                </div>
            `;
            
            modalContenido.innerHTML = detallesHTML;
            
            // Mostrar el símbolo SIDC
            const contenedorSIDC = modalContenido.querySelector('.sidc-preview-grande');
            if (contenedorSIDC && elemento.elemento.sidc && typeof ms !== 'undefined') {
                try {
                    const sym = new ms.Symbol(elemento.elemento.sidc, {size: 70});
                    contenedorSIDC.innerHTML = sym.asSVG();
                } catch (e) {
                    console.warn("Error al generar símbolo para detalles:", e);
                    contenedorSIDC.innerHTML = '<div style="width:70px;height:70px;background:#888;border-radius:50%;"></div>';
                }
            }
            
            // Configurar el botón para centrar en el mapa
            const btnCentrar = document.getElementById('btn-centrar-elemento');
            if (btnCentrar) {
                btnCentrar.onclick = function() {
                    centrarEnElemento(id);
                    $('#modalDetallesElemento').modal('hide');
                };
            }
            
            // Agregar botón de seguimiento
            const botonesModal = modalContenido.parentNode.querySelector('.modal-footer');
            if (botonesModal) {
                // Verificar si ya existe el botón
                let btnSeguir = botonesModal.querySelector('#btn-seguir-elemento');
                if (!btnSeguir) {
                    btnSeguir = document.createElement('button');
                    btnSeguir.id = 'btn-seguir-elemento';
                    btnSeguir.className = 'btn btn-info';
                    btnSeguir.innerHTML = '<i class="fas fa-crosshairs"></i> Seguir este elemento';
                    botonesModal.insertBefore(btnSeguir, botonesModal.firstChild);
                }
                
                btnSeguir.onclick = function() {
                    iniciarSeguimientoElemento(id);
                    $('#modalDetallesElemento').modal('hide');
                };
            }
            
            // Agregar botón de chat si el módulo está disponible
            if (window.MAIRA.Chat) {
                const botonesModal = modalContenido.parentNode.querySelector('.modal-footer');
                if (botonesModal) {
                    // Verificar si ya existe el botón
                    let btnChat = botonesModal.querySelector('#btn-chat-elemento');
                    if (!btnChat) {
                        btnChat = document.createElement('button');
                        btnChat.id = 'btn-chat-elemento';
                        btnChat.className = 'btn btn-primary';
                        btnChat.innerHTML = '<i class="fas fa-comment"></i> Chat privado';
                        botonesModal.insertBefore(btnChat, botonesModal.firstChild);
                    }
                    
                    btnChat.onclick = function() {
                        iniciarChatPrivado(id);
                        $('#modalDetallesElemento').modal('hide');
                    };
                }
            }
            
            // Mostrar modal
            $('#modalDetallesElemento').modal('show');
        } else {
            // Implementación alternativa si no está disponible Bootstrap
            MAIRA.Utils.mostrarNotificacion(`Elemento: ${elemento.elemento.designacion || 'Sin designación'} (${elemento.usuario})`, "info");
            centrarEnElemento(id);
        }
    }
    
    /**
     * Configura los eventos para el mapa
     */
    function configurarEventosMapa() {
        // Solo si el mapa está disponible
        if (!window.mapa) return;
        
        // Evento para clic derecho en el mapa
        window.mapa.on('contextmenu', function(e) {
            mostrarMenuContextualMapa(e);
        });
    }
    
    /**
     * Inicializa el menú contextual para elementos y marcadores
     */
    function inicializarMenuContextual() {
        // Verificar si ya existe
        if (document.getElementById('menu-contextual-elemento')) return;
        
        // Crear elemento para el menú contextual
        const menu = document.createElement('div');
        menu.id = 'menu-contextual-elemento';
        menu.className = 'menu-contextual-elemento';
        menu.style.display = 'none';
        
        // Añadir al DOM
        document.body.appendChild(menu);
        
        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', function() {
            menu.style.display = 'none';
        });
        
        // Cerrar menú al hacer scroll
        window.addEventListener('scroll', function() {
            menu.style.display = 'none';
        });
    }
    
    /**
     * Muestra el menú contextual para un elemento de la lista
     * @param {Event} e - Evento de clic derecho
     * @param {string} elementoId - ID del elemento
     */
    function mostrarMenuContextualElemento(e, elementoId) {
        e.preventDefault();
        e.stopPropagation();
        
        // Obtener el menú
        const menu = document.getElementById('menu-contextual-elemento');
        if (!menu) return;
        
        // Obtener datos del elemento
        const elemento = elementosConectados[elementoId]?.datos;
        if (!elemento) return;
        
        // Configurar opciones del menú
        menu.innerHTML = `
            <div class="menu-item" data-action="centrar" data-id="${elementoId}">
                <i class="fas fa-crosshairs"></i> Centrar en mapa
            </div>
            <div class="menu-item" data-action="seguir" data-id="${elementoId}">
                <i class="fas fa-location-arrow"></i> Seguir este elemento
            </div>
            <div class="menu-item" data-action="detalles" data-id="${elementoId}">
                <i class="fas fa-info-circle"></i> Ver detalles
            </div>
            ${window.MAIRA.Chat ? `
            <div class="menu-item" data-action="chat" data-id="${elementoId}">
                <i class="fas fa-comment"></i> Chat privado
            </div>
            ` : ''}
        `;
        
        // Posicionar menú
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        menu.style.display = 'block';
        
        // Configurar eventos de las opciones
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const accion = this.getAttribute('data-action');
                const id = this.getAttribute('data-id');
                
                menu.style.display = 'none';
                
                switch (accion) {
                    case 'centrar':
                        centrarEnElemento(id);
                        break;
                    case 'seguir':
                        iniciarSeguimientoElemento(id);
                        break;
                    case 'detalles':
                        mostrarDetallesElemento(id);
                        break;
                    case 'chat':
                        if (window.MAIRA.Chat) {
                            iniciarChatPrivado(id);
                        }
                        break;
                }
            });
        });
    }
    
    /**
     * Muestra el menú contextual para un marcador en el mapa
     * @param {Event} e - Evento de clic derecho
     * @param {string} elementoId - ID del elemento o 'usuario' para el marcador del usuario
     */
    function mostrarMenuContextualMarcador(e, elementoId) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        
        // Obtener el menú
        const menu = document.getElementById('menu-contextual-elemento');
        if (!menu) return;
        
        // Determinar opciones según si es marcador de usuario u otro elemento
        if (elementoId === 'usuario') {
            menu.innerHTML = `
                <div class="menu-item" data-action="centrar-usuario">
                    <i class="fas fa-crosshairs"></i> Centrar en mi posición
                </div>
                <div class="menu-item" data-action="seguimiento">
                    <i class="fas fa-location-arrow"></i> ${seguimientoActivo ? 'Detener seguimiento' : 'Iniciar seguimiento'}
                </div>
            `;
        } else {
            const elemento = elementosConectados[elementoId]?.datos;
            if (!elemento) return;
            
            menu.innerHTML = `
                <div class="menu-item" data-action="centrar" data-id="${elementoId}">
                    <i class="fas fa-crosshairs"></i> Centrar en mapa
                </div>
                <div class="menu-item" data-action="seguir" data-id="${elementoId}">
                    <i class="fas fa-location-arrow"></i> Seguir este elemento
                </div>
                <div class="menu-item" data-action="detalles" data-id="${elementoId}">
                    <i class="fas fa-info-circle"></i> Ver detalles
                </div>
                ${window.MAIRA.Chat ? `
                <div class="menu-item" data-action="chat" data-id="${elementoId}">
                    <i class="fas fa-comment"></i> Chat privado
                </div>
                ` : ''}
            `;
        }
        
        // Posicionar menú
        const containerPoint = e.containerPoint;
        const containerPos = e.target._container.getBoundingClientRect();
        
        menu.style.left = `${containerPos.left + containerPoint.x}px`;
        menu.style.top = `${containerPos.top + containerPoint.y}px`;
        menu.style.display = 'block';
        
        // Configurar eventos de las opciones
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const accion = this.getAttribute('data-action');
                const id = this.getAttribute('data-id');
                
                menu.style.display = 'none';
                
                switch (accion) {
                    case 'centrar-usuario':
                        centrarEnPosicion();
                        break;
                    case 'seguimiento':
                        toggleSeguimiento();
                        break;
                    case 'centrar':
                        centrarEnElemento(id);
                        break;
                    case 'seguir':
                        iniciarSeguimientoElemento(id);
                        break;
                    case 'detalles':
                        mostrarDetallesElemento(id);
                        break;
                    case 'chat':
                        if (window.MAIRA.Chat) {
                            iniciarChatPrivado(id);
                        }
                        break;
                }
            });
        });
    }
    
    /**
     * Muestra el menú contextual para el mapa
     * @param {Event} e - Evento de clic derecho
     */
    function mostrarMenuContextualMapa(e) {
        // Obtener el menú
        const menu = document.getElementById('menu-contextual-elemento');
        if (!menu) return;
        
        // Configurar opciones del menú
        menu.innerHTML = `
            <div class="menu-item" data-action="centrar-usuario">
                <i class="fas fa-crosshairs"></i> Centrar en mi posición
            </div>
            <div class="menu-item" data-action="seguimiento">
                <i class="fas fa-location-arrow"></i> ${seguimientoActivo ? 'Detener seguimiento' : 'Iniciar seguimiento'}
            </div>
            <div class="menu-item" data-action="mostrar-todos">
                <i class="fas fa-users"></i> Mostrar todos los elementos
            </div>
            ${window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.agregarMarcadorGB ? `
            <div class="menu-item" data-action="agregar-marcador">
                <i class="fas fa-map-marker-alt"></i> Agregar marcador
            </div>
            ` : ''}
        `;
        
        // Obtener coordenadas del clic
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Guardar coordenadas en atributos de datos
        menu.setAttribute('data-lat', lat);
        menu.setAttribute('data-lng', lng);
        
        // Posicionar menú
        menu.style.left = `${e.originalEvent.pageX}px`;
        menu.style.top = `${e.originalEvent.pageY}px`;
        menu.style.display = 'block';
        
        // Configurar eventos de las opciones
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const accion = this.getAttribute('data-action');
                
                menu.style.display = 'none';
                
                switch (accion) {
                    case 'centrar-usuario':
                        centrarEnPosicion();
                        break;
                    case 'seguimiento':
                        toggleSeguimiento();
                        break;
                    case 'mostrar-todos':
                        mostrarTodosElementos();
                        break;
                    case 'agregar-marcador':
                        if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.agregarMarcadorGB) {
                            // Obtener coordenadas del clic
                            const lat = parseFloat(menu.getAttribute('data-lat'));
                            const lng = parseFloat(menu.getAttribute('data-lng'));
                            
                            // Abrir selector de marcador en esa posición
                            MAIRA.Utils.mostrarNotificacion("Seleccione el tipo de marcador a agregar", "info");
                            
                            // Simulación de clic en esa posición
                            const evento = {
                                latlng: L.latLng(lat, lng)
                            };
                            
                            // Ejecutar función de agregar marcador
                            window.mapa.fire('click', evento);
                        }
                        break;
                }
            });
        });
    }
    
    /**
     * Solicita la lista de elementos de la operación actual
     */
    function solicitarListaElementos() {
        console.log("Solicitando lista de elementos para la operación:", operacionActual);
        
        if (!socket || !socket.connected) {
            console.warn("No se puede solicitar la lista de elementos: sin conexión");
            return;
        }
        
        socket.emit('solicitarElementos', { 
            operacion: operacionActual,
            solicitante: usuarioInfo?.id
        });
    }
    
    /**
     * Obtiene todos los elementos conectados
     * @returns {Object} - Objeto con todos los elementos conectados
     */
    function obtenerElementosConectados() {
        console.log("obtenerElementosConectados llamado, devolviendo:", elementosConectados);
        return elementosConectados;
    }
    // En elementosGB.js, añadir esta función si no existe
    function actualizarElementosConectados(nuevosElementos) {
        console.log("Actualizando elementosConectados con:", nuevosElementos);
        elementosConectados = nuevosElementos;
        return elementosConectados;
    }
    
    /**
     * Obtiene un elemento por su ID
     * @param {string} elementoId - ID del elemento
     * @returns {Object|null} - Datos del elemento o null si no existe
     */
    function obtenerElementoPorId(elementoId) {
        return elementosConectados[elementoId]?.datos || null;
    }

// Función de diagnóstico para listar todos los elementos conectados
function mostrarDiagnosticoElementos() {
    console.group("===== DIAGNÓSTICO DE ELEMENTOS CONECTADOS =====");
    console.log(`Total de elementos registrados: ${Object.keys(elementosConectados).length}`);
    
    Object.entries(elementosConectados).forEach(([id, elem]) => {
        console.group(`Elemento ID: ${id}`);
        console.log("Datos:", elem.datos);
        console.log("Marcador presente:", !!elem.marcador);
        console.log("Usuario:", elem.datos?.usuario || 'N/A');
        console.log("Designación:", elem.datos?.elemento?.designacion || 'N/A');
        console.log("Posición:", elem.datos?.posicion ? `Lat: ${elem.datos.posicion.lat}, Lng: ${elem.datos.posicion.lng}` : 'Sin posición');
        console.log("Elemento visual en DOM:", !!document.querySelector(`.elemento-item[data-id="${id}"]`));
        console.groupEnd();
    });
    
    console.log("===== ELEMENTOS VISUALES EN DOM =====");
    const elementosVisuales = document.querySelectorAll('.elemento-item');
    console.log(`Total elementos en DOM: ${elementosVisuales.length}`);
    
    elementosVisuales.forEach(elemento => {
        const elementoId = elemento.getAttribute('data-id');
        console.log(`Elemento visual ID: ${elementoId}, Existe en datos: ${!!elementosConectados[elementoId]}`);
    });
    
    console.groupEnd();
    
    // También verificar destinatarios del chat
    if (document.getElementById('select-destinatario')) {
        console.group("===== DESTINATARIOS DE CHAT =====");
        const options = document.getElementById('select-destinatario').options;
        console.log(`Total opciones en select: ${options.length}`);
        
        for (let i = 0; i < options.length; i++) {
            if (options[i].disabled) continue;
            console.log(`Opción ${i}: Valor=${options[i].value}, Texto=${options[i].textContent}`);
        }
        console.groupEnd();
    }
    
    return "Diagnóstico completado - Ver consola para detalles";
}
// Función para forzar sincronización de todos los elementos
function forzarSincronizacionElementos() {
    if (!socket || !socket.connected) {
        MAIRA.Utils.mostrarNotificacion("No hay conexión con el servidor", "error");
        return false;
    }
    
    // Solicitar lista de elementos al servidor
    socket.emit('solicitarElementos', {
        operacion: operacionActual,
        solicitante: usuarioInfo?.id,
        forzarSincronizacion: true
    });
    
    // Enviar broadcast de nuestro elemento para que nos detecten
    const datosPropios = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoTrabajo,
        posicion: ultimaPosicion,
        operacion: operacionActual,
        timestamp: new Date().toISOString(),
        conectado: true
    };
    
    // Enviar por múltiples canales para máxima compatibilidad
    socket.emit('actualizarPosicion', datosPropios);
    socket.emit('nuevoElemento', datosPropios);
    socket.emit('anunciarElemento', datosPropios);
    
    // Enviar mensaje al chat para forzar sincronización
    socket.emit('mensajeChat', {
        id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        usuario: usuarioInfo.usuario,
        mensaje: `${usuarioInfo.usuario} solicita sincronización de elementos`,
        tipo: 'sistema',
        sala: operacionActual,
        timestamp: new Date().toISOString(),
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
            elemento: elementoTrabajo
        }
    });
    
    // Notificar al usuario
    MAIRA.Utils.mostrarNotificacion("Solicitando sincronización de elementos...", "info");
    
    return true;
}

// Exponer para uso desde consola
window.forzarSincronizacionElementos = forzarSincronizacionElementos;

// Exponer la función para uso en la consola
window.diagnosticoElementos = mostrarDiagnosticoElementos;

    // Exponer API pública
    return {
        // Funciones principales
        inicializar: inicializar,
        configurarEventosSocket: configurarEventosSocket,
        
        // Funciones de gestión de elementos
        agregarElementoALista: agregarElementoALista,
        actualizarListaElementos: actualizarListaElementos,
        actualizarPosicionElemento: actualizarPosicionElemento,
        eliminarElementoLista: eliminarElementoLista,
        crearMarcadorElemento: crearMarcadorElemento,
        solicitarListaElementos: solicitarListaElementos,
        inicializarListaElementos: inicializarListaElementos,
        
        // Funciones de navegación
        centrarEnPosicion: centrarEnPosicion,
        centrarEnElemento: centrarEnElemento,
        mostrarTodosElementos: mostrarTodosElementos,
        iniciarSeguimientoElemento: iniciarSeguimientoElemento,
        detenerSeguimientoElemento: detenerSeguimientoElemento,
        
        // Funciones de seguimiento del usuario
        actualizarMarcadorUsuario: actualizarMarcadorUsuario,
        iniciarSeguimiento: iniciarSeguimiento,
        detenerSeguimiento: detenerSeguimiento,
        toggleSeguimiento: toggleSeguimiento,
        
        // Funciones de UI
        mostrarDetallesElemento: mostrarDetallesElemento,
        buscarElementos: buscarElementos,
        mejorarListaElementos: mejorarListaElementos,
        
        // Funciones de acceso a datos
        obtenerElementosConectados: obtenerElementosConectados,
        obtenerElementoPorId: obtenerElementoPorId
    };
})();

// Registrar como módulo global
window.MAIRA.Elementos = window.MAIRA.Elementos || MAIRA.Elementos;