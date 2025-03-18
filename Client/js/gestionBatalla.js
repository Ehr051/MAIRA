/**
 * gestionBatalla.js
 * Módulo específico para el modo Gestión de Batalla en MAIRA
 * Se integra con la funcionalidad base existente
 * @version 1.2.0
 */

// Namespace principal para evitar conflictos
window.MAIRA = window.MAIRA || {};

// Módulo de Gestión de Batalla
MAIRA.GestionBatalla = (function() {
    // Variables privadas del módulo
    let marcadorUsuario = null;
    let seguimientoActivo = false;
    let watchId = null;
    let usuarioInfo = null;
    let elementoTrabajo = null;
    let socket = null;
    let panelVisible = true;
    let elementosConectados = {};
    let ultimaPosicion = null;
    let operacionActual = "";
    let colaPendiente = {
        mensajes: [],
        informes: [],
        posiciones: []
    };

    /**
     * Inicializa el módulo cuando el DOM está listo
     */
    function inicializar() {
        console.log("Inicializando modo Gestión de Batalla");
        
        // Verificar si estamos en el modo correcto
        const esModoGestionBatalla = window.location.pathname.includes('gestionbatalla.html');
        if (!esModoGestionBatalla) return;
        
        // Intentar cargar información de usuario y elemento desde localStorage
        if (!cargarInfoDesdeLocalStorage()) {
            return; // Si falla, ya se redirigió a la sala de espera
        }
        
        // Intentar cargar operación desde URL
        if (!cargarOperacionDesdeURL()) {
            return; // Si falla, ya se redirigió a la sala de espera
        }
        
        // Ocultar pantalla de carga inicial
        mostrarCargando(false);
        
        // Inicializar componentes específicos del modo
        inicializarPanelLateral();
        inicializarMenusAvanzados();
        
        // Configurar eventos generales
        window.addEventListener('beforeunload', guardarEstadoActual);
        
        // Mostrar contenido principal
        document.getElementById('main-content').style.display = 'block';
        
        // Actualizar información en el panel lateral
        actualizarInfoUsuarioPanel();
        
        // Inicializar el mapa si aún no se ha hecho
        if (!window.mapa || typeof window.inicializarMapa === 'function') {
            console.log("Inicializando mapa desde Gestión de Batalla");
            window.inicializarMapa();
        }
        
        // Establecer conexión con el servidor y unirse a la operación
        conectarAlServidor();
        
        // Obtener posición inicial
        obtenerPosicionInicial();
    }

    /**
     * Carga la información de usuario y elemento desde localStorage
     */
    function cargarInfoDesdeLocalStorage() {
        try {
            // Intentar cargar información de usuario
            const usuarioGuardado = localStorage.getItem('gb_usuario_info');
            if (usuarioGuardado) {
                usuarioInfo = JSON.parse(usuarioGuardado);
                console.log("Información de usuario cargada:", usuarioInfo);
            }
            
            // Intentar cargar información de elemento
            const elementoGuardado = localStorage.getItem('gb_elemento_info');
            if (elementoGuardado) {
                elementoTrabajo = JSON.parse(elementoGuardado);
                console.log("Información de elemento cargada:", elementoTrabajo);
            }
            
            // Verificar si se cargaron ambos
            if (!usuarioInfo || !elementoTrabajo) {
                console.warn("Información de usuario o elemento no encontrada en localStorage");
                redirigirASalaEspera();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Error al cargar información desde localStorage:", error);
            redirigirASalaEspera();
            return false;
        }
    }

    /**
     * Carga la operación desde la URL
     */
    function cargarOperacionDesdeURL() {
        // Intentar obtener operación desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const operacionParam = urlParams.get('operacion');
        
        if (operacionParam) {
            operacionActual = operacionParam;
            console.log("Operación cargada desde URL:", operacionActual);
            return true;
        } else {
            console.warn("No se encontró operación en la URL");
            // Intentar obtener desde localStorage
            const operacionGuardada = localStorage.getItem('gb_operacion_seleccionada');
            if (operacionGuardada) {
                try {
                    const operacion = JSON.parse(operacionGuardada);
                    operacionActual = operacion.nombre;
                    console.log("Operación cargada desde localStorage:", operacionActual);
                    return true;
                } catch (error) {
                    console.error("Error al cargar operación desde localStorage:", error);
                }
            }
            
            redirigirASalaEspera();
            return false;
        }
    }

    /**
     * Redirige a la sala de espera si no hay información suficiente
     */
    function redirigirASalaEspera() {
        console.warn("Redirigiendo a sala de espera por falta de información");
        window.location.href = '/Client/inicioGB.html';
    }

    /**
     * Inicializa los eventos de los menús desplegables para evitar que se cierren al hacer clic dentro
     */
    function inicializarMenusAvanzados() {
        console.log("Inicializando comportamiento de menús avanzados");
        
        // Prevenir que el clic dentro de los menús los cierre
        document.querySelectorAll('.menu').forEach(menu => {
            menu.addEventListener('click', function(e) {
                // Evitar que el clic se propague al contenedor principal
                e.stopPropagation();
            });
        });
        
        // Configurar los botones de menú principales
        document.querySelectorAll('.menu-btn > button').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Obtener el menú asociado a este botón
                const menuId = this.getAttribute('data-target') || 
                              this.nextElementSibling.id;
                
                const menu = document.getElementById(menuId);
                if (!menu) return;
                
                // Determinar si debemos abrir o cerrar este menú
                const isOpen = menu.classList.contains('show');
                
                // Cerrar todos los demás menús
                document.querySelectorAll('.menu.show').forEach(openMenu => {
                    if (openMenu.id !== menuId) {
                        openMenu.classList.remove('show');
                    }
                });
                
                // Alternar el estado de este menú
                if (isOpen) {
                    menu.classList.remove('show');
                } else {
                    menu.classList.add('show');
                }
            });
        });
        
        // Configurar submenús para que permanezcan abiertos cuando se hace clic en ellos
        document.querySelectorAll('.submenu, .collapse').forEach(submenu => {
            submenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
        
        // Cerrar menús al hacer clic fuera de ellos
        document.addEventListener('click', function() {
            document.querySelectorAll('.menu.show').forEach(openMenu => {
                openMenu.classList.remove('show');
            });
        });
    }

    /**
     * Obtiene la posición inicial del usuario
     */
    function obtenerPosicionInicial() {
        console.log("Obteniendo posición inicial");
        
        navigator.geolocation.getCurrentPosition(
            function(posicion) {
                console.log("Posición inicial obtenida:", posicion.coords);
                // Guardar la posición para usarla después
                ultimaPosicion = {
                    lat: posicion.coords.latitude,
                    lng: posicion.coords.longitude,
                    precision: posicion.coords.accuracy,
                    rumbo: posicion.coords.heading || 0,
                    timestamp: new Date()
                };
                
                // Actualizar el marcador del usuario
                setTimeout(() => {
                    actualizarMarcadorUsuario(
                        posicion.coords.latitude, 
                        posicion.coords.longitude, 
                        posicion.coords.heading || 0
                    );
                }, 500);
                
                // Iniciar seguimiento si está activado
                const btnSeguimiento = document.getElementById('btn-seguimiento');
                if (btnSeguimiento && btnSeguimiento.classList.contains('active')) {
                    setTimeout(iniciarSeguimiento, 1000);
                }
                
                // Mostrar todos los elementos
                setTimeout(mostrarTodosElementos, 2000);
            },
            function(error) {
                console.error("Error al obtener posición inicial:", error);
                mostrarNotificacion("No se pudo obtener tu posición inicial. Algunos elementos pueden no mostrarse correctamente.", "error");
                
                // Mostrar todos los elementos aunque no tengamos posición
                setTimeout(mostrarTodosElementos, 2000);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    }

    /**
     * Muestra u oculta la pantalla de carga
     * @param {boolean} mostrar - Indica si se debe mostrar la pantalla
     * @param {number} progreso - Valor de progreso (0-100)
     * @param {string} mensaje - Mensaje a mostrar
     */
    function mostrarCargando(mostrar, progreso = 0, mensaje = "Cargando...") {
        const loadingContainer = document.querySelector('.loading-container');
        if (!loadingContainer) return;
        
        if (mostrar) {
            loadingContainer.style.display = 'flex';
            document.getElementById('progreso').style.width = progreso + '%';
            document.getElementById('porcentajeCarga').textContent = progreso + '%';
            document.getElementById('loadingText').textContent = mensaje;
        } else {
            loadingContainer.style.display = 'none';
            setTimeout(() => {
                document.getElementById('main-content').style.display = 'block';
            }, 100);
        }
    }

    /**
     * Inicializa el panel lateral de gestión de batalla
     */
    function inicializarPanelLateral() {
        // Usar el panel existente o crearlo si no existe
        const panel = document.getElementById('panel-lateral');
        if (!panel) {
            console.warn("Panel lateral no encontrado. Revise la estructura HTML.");
            return;
        }
        
        // Configurar eventos del panel
        configurarEventosPanel();
        
        // Configurar el botón del panel
        const botonPanel = document.getElementById('boton-panel');
        if (botonPanel) {
            botonPanel.addEventListener('click', function(e) {
                e.preventDefault();
                togglePanel();
            });
        }
        
        // Configurar pestañas
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                cambiarTab(tabId);
            });
        });
    }

    /**
     * Configura los eventos específicos del panel lateral
     */
    function configurarEventosPanel() {
        // Evento para cerrar panel
        const cerrarPanel = document.getElementById('cerrar-panel');
        if (cerrarPanel) {
            cerrarPanel.addEventListener('click', togglePanel);
        }
        
        // Configurar eventos de chat
        configurarEventosChat();
        
        // Configurar eventos de informes
        configurarEventosInformes();
        
        // Configurar eventos de elementos
        configurarEventosElementos();
    }

    /**
     * Configura los eventos relacionados con el chat
     */
    function configurarEventosChat() {
        // Cambio entre chat general y privado
        const btnChatGeneral = document.getElementById('btn-chat-general');
        const btnChatPrivado = document.getElementById('btn-chat-privado');
        const chatDestinario = document.getElementById('chat-destinatario');
        
        if (btnChatGeneral && btnChatPrivado && chatDestinario) {
            btnChatGeneral.addEventListener('click', function() {
                btnChatGeneral.classList.add('active');
                btnChatPrivado.classList.remove('active');
                chatDestinario.classList.add('d-none');
            });
            
            btnChatPrivado.addEventListener('click', function() {
                btnChatPrivado.classList.add('active');
                btnChatGeneral.classList.remove('active');
                chatDestinario.classList.remove('d-none');
            });
        }
        
        // Envío de mensajes
        const enviarMensaje = document.getElementById('enviar-mensaje');
        const mensajeInput = document.getElementById('mensaje-chat');
        
        if (enviarMensaje && mensajeInput) {
            enviarMensaje.addEventListener('click', enviarMensajeChat);
            
            mensajeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    enviarMensajeChat();
                }
            });
        }
    }

    /**
     * Configura los eventos relacionados con los informes
     */
    function configurarEventosInformes() {
        // Cambio entre ver y crear informes
        const btnVerInformes = document.getElementById('btn-ver-informes');
        const btnCrearInforme = document.getElementById('btn-crear-informe');
        const verInformes = document.getElementById('ver-informes');
        const crearInforme = document.getElementById('crear-informe');
        
        if (btnVerInformes && btnCrearInforme && verInformes && crearInforme) {
            btnVerInformes.addEventListener('click', function() {
                btnVerInformes.classList.add('active');
                btnCrearInforme.classList.remove('active');
                verInformes.classList.remove('d-none');
                crearInforme.classList.add('d-none');
            });
            
            btnCrearInforme.addEventListener('click', function() {
                btnCrearInforme.classList.add('active');
                btnVerInformes.classList.remove('active');
                verInformes.classList.add('d-none');
                crearInforme.classList.remove('d-none');
            });
        }
        
        // Filtros de informes
        const btnFiltroTodos = document.getElementById('btn-filtro-todos');
        const btnFiltroInformes = document.getElementById('btn-filtro-informes');
        const btnFiltroOrdenes = document.getElementById('btn-filtro-ordenes');
        
        if (btnFiltroTodos && btnFiltroInformes && btnFiltroOrdenes) {
            [btnFiltroTodos, btnFiltroInformes, btnFiltroOrdenes].forEach(btn => {
                btn.addEventListener('click', function() {
                    [btnFiltroTodos, btnFiltroInformes, btnFiltroOrdenes].forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    filtrarInformes(this.id);
                });
            });
        }
        
        // Envío de informes
        const formInforme = document.getElementById('form-informe');
        const cancelarInforme = document.getElementById('cancelar-informe');
        
        if (formInforme) {
            formInforme.addEventListener('submit', function(e) {
                e.preventDefault();
                enviarInforme();
            });
        }
        
        if (cancelarInforme) {
            cancelarInforme.addEventListener('click', function() {
                if (btnVerInformes) btnVerInformes.click();
            });
        }
    }

    /**
     * Configura los eventos relacionados con los elementos
     */
    function configurarEventosElementos() {
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
    }

    /**
     * Conecta al servidor de websockets
     */
    function conectarAlServidor() {
        try {
            // Determinar la URL del servidor
            const serverURL = obtenerURLServidor();
            
            // Inicializar socket
            socket = io(serverURL);
            
            // Eventos del socket
            socket.on('connect', function() {
                console.log('Conectado al servidor');
                actualizarEstadoConexion(true);
                
                // Unirse a la operación con datos adicionales
                socket.emit('unirseOperacion', {
                    usuario: usuarioInfo,
                    elemento: elementoTrabajo,
                    posicion: ultimaPosicion,
                    operacion: operacionActual
                });
                
                // Solicitar lista de operaciones activas para actualizar el registro global
                socket.emit('registrarOperacion', {
                    operacion: operacionActual,
                    creador: usuarioInfo.usuario
                });
                
                // Enviar mensajes y posiciones pendientes
                enviarPendientes();
                
                // Solicitar lista de elementos explícitamente
                socket.emit('solicitarElementos', { operacion: operacionActual });
            });
            
            socket.on('disconnect', function() {
                console.log('Desconectado del servidor');
                actualizarEstadoConexion(false);
            });
            
            socket.on('error', function(error) {
                console.error('Error de conexión:', error);
                actualizarEstadoConexion(false);
            });
            
            socket.on('nuevaConexion', function(data) {
                console.log('Nueva conexión:', data);
                actualizarListaElementos(data);
                
                // Notificar en el chat
                agregarMensajeChat("Sistema", 
                    `${data.usuario} se ha unido a la operación con ${data.elemento.designacion}/${data.elemento.dependencia}`, 
                    "sistema");
            });
            
            socket.on('desconexion', function(data) {
                console.log('Desconexión:', data);
                eliminarElementoLista(data.id);
                
                // Notificar en el chat
                agregarMensajeChat("Sistema", 
                    `${data.usuario} se ha desconectado de la operación`, 
                    "sistema");
            });
            
            socket.on('actualizacionPosicion', function(data) {
                actualizarPosicionElemento(data);
            });
            
            socket.on('mensajeChat', function(mensaje) {
                recibirMensajeChat(mensaje);
            });
            
            socket.on('nuevoInforme', function(informe) {
                recibirInforme(informe);
            });
            
            socket.on('informeLeido', function(data) {
                marcarInformeLeido(data.informeId);
            });
            
            socket.on('listaElementos', function(elementos) {
                inicializarListaElementos(elementos);
            });
            
            // Añadir un evento para manejar actualizaciones de operaciones
            socket.on('actualizacionOperaciones', function(operaciones) {
                console.log('Lista de operaciones actualizada:', operaciones);
            });
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
            actualizarEstadoConexion(false);
        }
    }

    /**
     * Actualiza el indicador de estado de conexión
     * @param {boolean} conectado - Estado de la conexión
     */
    function actualizarEstadoConexion(conectado) {
        const indicator = document.querySelector('.indicator');
        const statusText = document.getElementById('status-text');
        
        if (indicator) {
            indicator.className = conectado ? 'indicator online' : 'indicator offline';
        }
        
        if (statusText) {
            statusText.textContent = conectado ? 'Conectado' : 'Desconectado';
        }
    }

    /**
     * Envía los mensajes, informes y posiciones pendientes
     */
    function enviarPendientes() {
        if (!socket || !socket.connected) return;
        
        // Enviar mensajes pendientes
        while (colaPendiente.mensajes.length > 0) {
            const mensaje = colaPendiente.mensajes.shift();
            socket.emit('mensajeChat', mensaje);
        }
        
        // Enviar informes pendientes
        while (colaPendiente.informes.length > 0) {
            const informe = colaPendiente.informes.shift();
            socket.emit('nuevoInforme', informe);
        }
        
        // Enviar posiciones pendientes
        while (colaPendiente.posiciones.length > 0) {
            const posicion = colaPendiente.posiciones.shift();
            socket.emit('actualizarPosicion', posicion);
        }
    }

    /**
     * Actualiza la información del usuario en el panel lateral
     */
    function actualizarInfoUsuarioPanel() {
        if (!usuarioInfo || !elementoTrabajo) return;
        
        const nombreUsuario = document.getElementById('nombre-usuario');
        const nombreOperacion = document.getElementById('nombre-operacion');
        const nombreElemento = document.getElementById('nombre-elemento');
        
        if (nombreUsuario) nombreUsuario.textContent = usuarioInfo.usuario;
        if (nombreOperacion) nombreOperacion.textContent = usuarioInfo.operacion || operacionActual;
        if (nombreElemento) {
            const texto = elementoTrabajo.designacion + 
                (elementoTrabajo.dependencia ? '/' + elementoTrabajo.dependencia : '');
            nombreElemento.textContent = texto;
        }
    }

    /**
     * Inicializa la lista de elementos conectados
     * @param {Array} elementos - Lista de elementos conectados
     */
    function inicializarListaElementos(elementos) {
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) return;
        
        // Limpiar lista actual
        listaElementos.innerHTML = '';
        elementosConectados = {};
        
        // Agregar cada elemento
        elementos.forEach(function(elem) {
            elementosConectados[elem.id] = {
                datos: elem,
                marcador: null
            };
            
            agregarElementoALista(elem);
            crearMarcadorElemento(elem);
        });
    }

    /**
     * Agrega un elemento a la lista del panel
     * @param {Object} elemento - Datos del elemento
     */
    function agregarElementoALista(elemento) {
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) return;
        
        const esUsuarioActual = elemento.id === usuarioInfo?.id;
        
        const elementoHTML = `
            <div class="elemento-item ${esUsuarioActual ? 'usuario-actual' : ''}" data-id="${elemento.id}">
                <div class="elemento-icon">
                    <div class="sidc-preview"></div>
                    <span class="elemento-status ${elemento.conectado ? 'online' : 'offline'}"></span>
                </div>
                <div class="elemento-info">
                    <div class="elemento-nombre">${elemento.elemento.designacion || 'Sin designación'}/${elemento.elemento.dependencia || ''}</div>
                    <div class="elemento-usuario">${elemento.usuario}</div>
                    <div class="elemento-tiempo">${formatearFecha(elemento.timestamp)}</div>
                </div>
                <div class="elemento-acciones">
                    <button title="Ver detalles" onclick="MAIRA.GestionBatalla.mostrarDetallesElemento('${elemento.id}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button title="Centrar en mapa" onclick="MAIRA.GestionBatalla.centrarEnElemento('${elemento.id}')">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                </div>
            </div>
        `;
        
        listaElementos.insertAdjacentHTML('beforeend', elementoHTML);
        
        // Actualizar el icono SIDC
        const contenedor = listaElementos.querySelector(`.elemento-item[data-id="${elemento.id}"] .sidc-preview`);
        if (contenedor && elemento.elemento.sidc && typeof ms !== 'undefined') {
            const sym = new ms.Symbol(elemento.elemento.sidc, {size: 20});
            contenedor.innerHTML = sym.asSVG();
        }
    }

    /**
     * Crea un marcador en el mapa para el elemento
     * @param {Object} elemento - Datos del elemento
     */
    function crearMarcadorElemento(elemento) {
        if (!elemento || !elemento.posicion) return;
        
        // Si ya existe el marcador, solo actualizar posición
        if (elementosConectados[elemento.id]?.marcador) {
            elementosConectados[elemento.id].marcador.setLatLng([
                elemento.posicion.lat, 
                elemento.posicion.lng
            ]);
            return;
        }
        
        // Crear etiqueta en formato correcto: designacion/dependencia
        let etiqueta = "";
        if (elemento.elemento.designacion) {
            etiqueta = elemento.elemento.designacion;
            if (elemento.elemento.dependencia) {
                etiqueta += "/" + elemento.elemento.dependencia;
            }
        }
        
        // Crear icono con SIDC
        let iconHTML = '';
        if (elemento.elemento.sidc && typeof ms !== 'undefined') {
            const sym = new ms.Symbol(elemento.elemento.sidc, {
                size: 35,
                direction: elemento.posicion.rumbo || 0,
                uniqueDesignation: etiqueta  // Formato correcto
            });
            iconHTML = sym.asSVG();
        } else {
            // Icono por defecto si no hay SIDC
            iconHTML = '<div style="width:35px;height:35px;background:blue;border-radius:50%;"></div>';
        }
        
        // Crear marcador
        const marcador = L.marker([elemento.posicion.lat, elemento.posicion.lng], {
            icon: L.divIcon({
                className: 'custom-div-icon elemento',
                html: iconHTML,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
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
        }
        
        // Guardar referencia
        elementosConectados[elemento.id] = elementosConectados[elemento.id] || {};
        elementosConectados[elemento.id].marcador = marcador;
    }

    /**
     * Actualiza la posición de un elemento en el mapa
     * @param {Object} data - Datos de posición
     */
    function actualizarPosicionElemento(data) {
        if (!data || !data.id || !data.posicion) return;
        
        // Actualizar datos
        if (elementosConectados[data.id]) {
            elementosConectados[data.id].datos.posicion = data.posicion;
            elementosConectados[data.id].datos.timestamp = data.timestamp;
            
            // Actualizar marcador si existe
            if (elementosConectados[data.id].marcador) {
                elementosConectados[data.id].marcador.setLatLng([
                    data.posicion.lat, 
                    data.posicion.lng
                ]);
                
                // Actualizar dirección si está disponible
                if (data.posicion.rumbo !== undefined && elementosConectados[data.id].marcador.setRotationAngle) {
                    elementosConectados[data.id].marcador.setRotationAngle(data.posicion.rumbo);
                }
            } else {
                // Crear marcador si no existe
                crearMarcadorElemento(elementosConectados[data.id].datos);
            }
            
            // Actualizar tiempo en la interfaz
            const elementoItem = document.querySelector(`.elemento-item[data-id="${data.id}"] .elemento-tiempo`);
            if (elementoItem) {
                elementoItem.textContent = formatearFecha(data.timestamp);
            }
        }
    }

    /**
     * Elimina un elemento de la lista y del mapa
     * @param {string} id - ID del elemento a eliminar
     */
    function eliminarElementoLista(id) {
        if (!id) return;
        
        // Eliminar marcador del mapa
        if (elementosConectados[id]?.marcador && window.mapa) {
            window.mapa.removeLayer(elementosConectados[id].marcador);
        }
        
        // Eliminar elemento de la lista
        // Eliminar elemento de la lista
        const elementoItem = document.querySelector(`.elemento-item[data-id="${id}"]`);
        if (elementoItem) {
            elementoItem.remove();
        }
        
        // Eliminar de nuestro registro
        delete elementosConectados[id];
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
    }

    /**
     * Muestra los detalles de un elemento
     * @param {string} id - ID del elemento
     */
    function mostrarDetallesElemento(id) {
        const elemento = elementosConectados[id]?.datos;
        if (!elemento) return;
        
        const modalContenido = document.getElementById('detalles-elemento-contenido');
        if (!modalContenido) return;
        
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
        }
        
        detallesHTML += `
                </table>
            </div>
        `;
        
        modalContenido.innerHTML = detallesHTML;
        
        // Mostrar el símbolo SIDC
        const contenedorSIDC = modalContenido.querySelector('.sidc-preview-grande');
        if (contenedorSIDC && elemento.elemento.sidc && typeof ms !== 'undefined') {
            const sym = new ms.Symbol(elemento.elemento.sidc, {size: 70});
            contenedorSIDC.innerHTML = sym.asSVG();
        }
        
        // Configurar el botón para centrar en el mapa
        const btnCentrar = document.getElementById('btn-centrar-elemento');
        if (btnCentrar) {
            btnCentrar.onclick = function() {
                centrarEnElemento(id);
                $('#modalDetallesElemento').modal('hide');
            };
        }
        
        // Mostrar modal
        $('#modalDetallesElemento').modal('show');
    }

    /**
     * Centra el mapa en un elemento específico
     * @param {string} elementoId - ID del elemento a centrar
     */
    function centrarEnElemento(elementoId) {
        if (!elementosConectados[elementoId] || !elementosConectados[elementoId].marcador) {
            mostrarNotificacion("Elemento no encontrado", "error");
            return;
        }
        
        const posicion = elementosConectados[elementoId].marcador.getLatLng();
        if (window.mapa) {
            window.mapa.setView(posicion, 15);
            elementosConectados[elementoId].marcador.openPopup();
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
                        <small>${formatearFecha(resultado.datos.timestamp)}</small>
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
     * Inicia el seguimiento de posición
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
            mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
            agregarMensajeChat("Sistema", "Tu navegador no soporta geolocalización.", "sistema");
            return;
        }
        
        // Configurar botón de seguimiento como activo
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        if (btnSeguimiento) {
            btnSeguimiento.classList.add('active');
            btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow text-primary"></i> Seguimiento activo';
        }
        
        // Mostrar mensaje en el chat
        agregarMensajeChat("Sistema", "Iniciando seguimiento de posición...", "sistema");
        
        // Obtener posición inicial antes de comenzar el seguimiento continuo
        navigator.geolocation.getCurrentPosition(
            function(posicion) {
                console.log("Posición inicial obtenida:", posicion.coords);
                posicionActualizada(posicion);
                
                // Iniciar seguimiento continuo
                watchId = navigator.geolocation.watchPosition(
                    posicionActualizada,
                    errorPosicion,
                    {
                        enableHighAccuracy: true,
                        maximumAge: 5000,
                        timeout: 10000
                    }
                );
                
                // Activar la variable de seguimiento
                seguimientoActivo = true;
                
                agregarMensajeChat("Sistema", "Seguimiento de posición activado", "sistema");
            },
            function(error) {
                console.error("Error al obtener posición inicial:", error);
                mostrarNotificacion("No se pudo obtener tu posición. Verifica los permisos de ubicación.", "error");
                
                // Revertir estado del botón
                if (btnSeguimiento) {
                    btnSeguimiento.classList.remove('active');
                    btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow"></i> Seguimiento';
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    }

    /**
     * Detiene el seguimiento de posición
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
        
        agregarMensajeChat("Sistema", "Seguimiento de posición desactivado", "sistema");
    }

    /**
     * Alterna el estado del seguimiento
     */
    function toggleSeguimiento() {
        if (seguimientoActivo) {
            detenerSeguimiento();
        } else {
            iniciarSeguimiento();
        }
    }

    /**
     * Maneja la actualización de posición
     * @param {GeolocationPosition} posicion - Objeto de posición del navegador
     */
    function posicionActualizada(posicion) {
        console.log("Posición actualizada:", posicion.coords);
        
        const { latitude, longitude, accuracy, heading } = posicion.coords;
        
        // Guardar información de la última posición
        ultimaPosicion = {
            lat: latitude,
            lng: longitude,
            precision: accuracy,
            rumbo: heading || 0,
            timestamp: new Date()
        };
        
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
                    rumbo: heading || 0
                },
                timestamp: new Date().toISOString()
            });
        } else if (usuarioInfo) {
            // Almacenar posición para enviar cuando se conecte
            colaPendiente.posiciones.push({
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                posicion: {
                    lat: latitude,
                    lng: longitude,
                    precision: accuracy,
                    rumbo: heading || 0
                },
                timestamp: new Date().toISOString()
            });
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
        
        agregarMensajeChat("Sistema", mensaje, "sistema");
        detenerSeguimiento();
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
                    console.log("Símbolo militar generado correctamente");
                    
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
                        if (window.mostrarMenuContextual) {
                            window.mostrarMenuContextual(e, this);
                        }
                    });
                } else {
                    console.error("No se pudo generar el símbolo militar");
                    crearMarcadorSimple(nuevaPosicion);
                }
            } else {
                console.log("Usando marcador estándar (no se encontró milsymbol o no hay SIDC)");
                crearMarcadorSimple(nuevaPosicion);
            }
        } else {
            // Actualizar posición si ya existe
            console.log("Actualizando posición del marcador existente");
            marcadorUsuario.setLatLng(nuevaPosicion);
            
            // Actualizar dirección si está disponible
            if (heading !== null && heading !== undefined && typeof heading === 'number') {
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
    function crearMarcadorSimple(posicion) {
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
        
        console.log("Marcador simple añadido al mapa");
    }

    /**
     * Centra el mapa en la posición actual
     */
    function centrarEnPosicion() {
        console.log("Centrando mapa en posición actual");
        
        if (marcadorUsuario && window.mapa && window.mapa.hasLayer(marcadorUsuario)) {
            window.mapa.setView(marcadorUsuario.getLatLng(), 15);
        } else {
            // Si no hay marcador, intentar obtener posición actual
            navigator.geolocation.getCurrentPosition(
                (posicion) => {
                    const { latitude, longitude } = posicion.coords;
                    if (window.mapa) {
                        window.mapa.setView([latitude, longitude], 15);
                    }
                },
                (error) => {
                    console.error("Error al obtener posición:", error);
                    agregarMensajeChat("Sistema", "No se pudo obtener tu posición actual", "sistema");
                }
            );
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
            agregarMensajeChat("Sistema", "No hay elementos para mostrar en el mapa", "sistema");
        }
    }

    /**
     * Envía un mensaje de chat
     */
    function enviarMensajeChat() {
        const mensajeInput = document.getElementById('mensaje-chat');
        if (!mensajeInput) return;
        
        const contenido = mensajeInput.value.trim();
        if (!contenido) return;
        
        // Determinar si es mensaje privado o general
        const btnChatPrivado = document.getElementById('btn-chat-privado');
        const selectDestinatario = document.getElementById('select-destinatario');
        
        const esPrivado = btnChatPrivado && btnChatPrivado.classList.contains('active');
        const destinatarioId = esPrivado && selectDestinatario ? selectDestinatario.value : null;
        
        if (esPrivado && !destinatarioId) {
            agregarMensajeChat("Sistema", "Selecciona un destinatario para el mensaje privado", "sistema");
            return;
        }
        
        // Verificar si tenemos la información del usuario
        if (!usuarioInfo) {
            agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
            return;
        }
        
        // Crear objeto de mensaje
        const mensaje = {
            emisor: {
                id: usuarioInfo.id,
                nombre: usuarioInfo.usuario
            },
            contenido: contenido,
            privado: esPrivado,
            destinatario: destinatarioId,
            timestamp: new Date().toISOString()
        };
        
        // Enviar al servidor si estamos conectados
        if (socket && socket.connected) {
            socket.emit('mensajeChat', mensaje);
            
            // Añadir a la interfaz
            const textoDestinatario = esPrivado && selectDestinatario ? 
                ` (a ${selectDestinatario.options[selectDestinatario.selectedIndex].text})` : '';
            
            agregarMensajeChat(`Tú${textoDestinatario}`, contenido, "enviado");
        } else {
            // Almacenar mensaje para enviar cuando se recupere la conexión
            colaPendiente.mensajes.push(mensaje);
            
            agregarMensajeChat("Sistema", "No estás conectado al servidor. El mensaje se enviará cuando se restablezca la conexión.", "sistema");
            agregarMensajeChat(`Tú${esPrivado ? ' (mensaje pendiente)' : ''}`, contenido, "enviado");
        }
        
        // Limpiar input
        mensajeInput.value = '';
        mensajeInput.focus();
    }

    /**
     * Recibe un mensaje de chat
     * @param {Object} mensaje - Mensaje recibido
     */
    function recibirMensajeChat(mensaje) {
        if (!mensaje) return;
        
        // Si el mensaje es privado, verificar si es para nosotros
        if (mensaje.privado) {
            // Si es un mensaje que enviamos nosotros, ya se mostró al enviarlo
            if (mensaje.emisor.id === usuarioInfo?.id) {
                return;
            }
            
            // Si es para nosotros, mostrar como mensaje privado
            if (mensaje.destinatario === usuarioInfo?.id) {
                agregarMensajeChat(`${mensaje.emisor.nombre} (privado)`, mensaje.contenido, "recibido");
                return;
            }
            
            // Si no es para nosotros, no mostrar
            return;
        }
        
        // Mensaje general
        agregarMensajeChat(mensaje.emisor.nombre, mensaje.contenido, "recibido");
    }

    /**
     * Agrega un mensaje al chat
     * @param {string} emisor - Nombre del emisor
     * @param {string} mensaje - Contenido del mensaje
     * @param {string} tipo - Tipo de mensaje (enviado, recibido, sistema)
     */
    function agregarMensajeChat(emisor, mensaje, tipo) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;
        
        const claseCSS = tipo === "enviado" ? "message-usuario" : 
                        (tipo === "sistema" ? "message-sistema" : "message-recibido");
        
        const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const mensajeHTML = `
            <div class="message ${claseCSS}">
                <div><strong>${emisor}</strong> <small>${hora}</small></div>
                <div>${mensaje}</div>
            </div>
        `;
        
        chatContainer.insertAdjacentHTML('beforeend', mensajeHTML);
        
        // Scroll al final
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Envía un informe
     */
    function enviarInforme() {
        // Obtener datos del formulario
        const tipoInforme = document.getElementById('tipo-informe');
        const destinatarioInforme = document.getElementById('destinatario-informe');
        const asuntoInforme = document.getElementById('asunto-informe');
        const contenidoInforme = document.getElementById('contenido-informe');
        
        if (!tipoInforme || !destinatarioInforme || !asuntoInforme || !contenidoInforme) {
            mostrarNotificacion("Error al enviar informe: elementos del formulario no encontrados", "error");
            return;
        }
        
        const tipo = tipoInforme.value;
        const destinatario = destinatarioInforme.value;
        const asunto = asuntoInforme.value.trim();
        const contenido = contenidoInforme.value.trim();
        
        if (!asunto || !contenido) {
            mostrarNotificacion("Debes completar asunto y contenido del informe", "error");
            return;
        }
        
        // Verificar si tenemos la información del usuario
        if (!usuarioInfo || !elementoTrabajo) {
            agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
            return;
        }
        
        // Crear objeto de informe
        const informe = {
            id: generarId(),
            emisor: {
                id: usuarioInfo.id,
                nombre: usuarioInfo.usuario,
                elemento: {
                    designacion: elementoTrabajo.designacion,
                    dependencia: elementoTrabajo.dependencia
                }
            },
            destinatario: destinatario,
            tipo: tipo,
            asunto: asunto,
            contenido: contenido,
            leido: false,
            posicion: marcadorUsuario ? marcadorUsuario.getLatLng() : null,
            timestamp: new Date().toISOString()
        };
        
        // Enviar al servidor si estamos conectados
        if (socket && socket.connected) {
            socket.emit('nuevoInforme', informe);
            
            // Añadir a la interfaz
            agregarInforme(informe);
            
            // Notificar envío
            agregarMensajeChat("Sistema", `Informe "${asunto}" enviado`, "sistema");
        } else {
            // Encolar informe para enviar cuando se recupere la conexión
            colaPendiente.informes.push(informe);
            
            // Añadir a la interfaz
            agregarInforme(informe);
            
            // Notificar encolado
            agregarMensajeChat("Sistema", `Informe "${asunto}" guardado y se enviará cuando se recupere la conexión`, "sistema");
        }
        
        // Resetear formulario y volver a vista de informes
        const formInforme = document.getElementById('form-informe');
        if (formInforme) formInforme.reset();
        
        const btnVerInformes = document.getElementById('btn-ver-informes');
        if (btnVerInformes) btnVerInformes.click();
    }

    /**
     * Recibe un informe
     * @param {Object} informe - Informe recibido
     */
    function recibirInforme(informe) {
        if (!informe) return;
        
        // Añadir a la interfaz
        agregarInforme(informe);
        
        // Notificar llegada de informe
        let tipoTexto = "";
        switch (informe.tipo) {
            case "urgente":
                tipoTexto = "URGENTE";
                break;
            case "orden":
                tipoTexto = "ORDEN";
                break;
            default:
                tipoTexto = "Informe";
        }
        
        // Mostrar notificación
        mostrarNotificacion(
            `${tipoTexto} de ${informe.emisor.nombre}: ${informe.asunto}`, 
            informe.tipo === "urgente" ? "error" : "info"
        );
        
        // Añadir mensaje al chat
        agregarMensajeChat(
            "Sistema", 
            `Nuevo ${tipoTexto.toLowerCase()} recibido de ${informe.emisor.nombre}: "${informe.asunto}"`, 
            "sistema"
        );
    }

    /**
     * Marca un informe como leído
     * @param {string} informeId - ID del informe a marcar
     */
    function marcarInformeLeido(informeId) {
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (informeElement) {
            informeElement.classList.add('leido');
        }
    }

    /**
     * Agrega un informe a la lista
     * @param {Object} informe - Informe a agregar
     */
    function agregarInforme(informe) {
        const listaInformes = document.getElementById('lista-informes');
        if (!listaInformes) return;
        
        const esPropio = informe.emisor.id === (usuarioInfo ? usuarioInfo.id : null);
        
        // Determinar clase CSS según el tipo
        let claseCSS = "";
        let iconoTipo = '<i class="fas fa-file-alt"></i>';
        
        if (informe.tipo === "urgente") {
            claseCSS = "informe-urgente";
            iconoTipo = '<i class="fas fa-exclamation-triangle"></i>';
        } else if (informe.tipo === "orden") {
            claseCSS = "orden";
            iconoTipo = '<i class="fas fa-tasks"></i>';
        }
        
        // Formato de fecha más legible
        const fecha = new Date(informe.timestamp).toLocaleString();
        
        // Crear elemento HTML
        const informeHTML = `
            <div class="informe ${claseCSS}" data-id="${informe.id}" data-tipo="${informe.tipo}">
                <div class="informe-header">
                    <div class="informe-tipo">${iconoTipo}</div>
                    <div class="informe-titulo">
                        <strong>${informe.asunto}</strong>
                        <small>${fecha}</small>
                    </div>
                </div>
                <div class="informe-remitente">
                    ${esPropio ? 
                        `Enviado a: ${informe.destinatario === "comando" ? "Comando" : 
                        (informe.destinatario === "todos" ? "Todos" : 
                        (elementosConectados[informe.destinatario]?.datos?.usuario || "Desconocido"))}` : 
                        `De: ${informe.emisor.nombre} (${informe.emisor.elemento.designacion})`}
                </div>
                <div class="informe-contenido mt-2">${informe.contenido}</div>
                ${informe.posicion ? `
                <div class="informe-acciones">
                    <button class="btn-ubicacion" data-lat="${informe.posicion.lat}" data-lng="${informe.posicion.lng}">
                        <i class="fas fa-map-marker-alt"></i> Ver ubicación
                    </button>
                </div>` : ''}
            </div>
        `;
        
        // Añadir al inicio de la lista
        listaInformes.insertAdjacentHTML('afterbegin', informeHTML);
        
        // Configurar evento para el botón de ubicación si existe
        const btnUbicacion = listaInformes.querySelector(`.informe[data-id="${informe.id}"] .btn-ubicacion`);
        if (btnUbicacion) {
            btnUbicacion.addEventListener('click', function() {
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lng = parseFloat(this.getAttribute('data-lng'));
                if (window.mapa) {
                    window.mapa.setView([lat, lng], 15);
                    
                    // Crear un marcador temporal
                    const tempMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'custom-div-icon temp-marker',
                            html: '<div class="temp-marker-pin"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }).addTo(window.mapa);
                    
                    tempMarker.bindPopup(`<strong>Ubicación del informe:</strong><br>${informe.asunto}`).openPopup();
                    
                    // Eliminar el marcador después de un tiempo
                    setTimeout(() => {
                        window.mapa.removeLayer(tempMarker);
                    }, 30000);
                }
            });
        }
        
        // Marcar como leído si no es propio
        if (!esPropio && informe.leido === false && socket && socket.connected) {
            setTimeout(() => {
                socket.emit('informeLeido', { informeId: informe.id });
            }, 2000);
        }
    }

    /**
     * Filtra los informes según el tipo
     * @param {string} filtroId - ID del filtro seleccionado
     */
    function filtrarInformes(filtroId) {
        const informes = document.querySelectorAll('.informe');
        
        informes.forEach(informe => {
            const tipo = informe.getAttribute('data-tipo');
            
            if (filtroId === 'btn-filtro-informes') {
                // Mostrar solo informes normales y urgentes
                informe.style.display = (tipo === 'normal' || tipo === 'urgente') ? 'block' : 'none';
            } else if (filtroId === 'btn-filtro-ordenes') {
                // Mostrar solo órdenes
                informe.style.display = tipo === 'orden' ? 'block' : 'none';
            } else {
                // Mostrar todos
                informe.style.display = 'block';
            }
        });
    }

    /**
     * Muestra una notificación en la interfaz
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación (info, success, error)
     * @param {number} duracion - Duración en milisegundos
     */
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        // Crear contenedor de notificaciones si no existe
        let container = document.getElementById('notificaciones-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificaciones-container';
            container.className = 'notificaciones-container';
            document.body.appendChild(container);
        }
        
        // Crear notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion notificacion-${tipo}`;
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <span class="notificacion-icono">
                    ${tipo === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
                     tipo === 'success' ? '<i class="fas fa-check-circle"></i>' : 
                     '<i class="fas fa-info-circle"></i>'}
                </span>
                <span class="notificacion-mensaje">${mensaje}</span>
            </div>
            <button class="notificacion-cerrar"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(notificacion);
        
        // Añadir clase para animar entrada
        setTimeout(() => {
            notificacion.classList.add('show');
        }, 10);
        
        // Evento para cerrar notificación
        const cerrarBtn = notificacion.querySelector('.notificacion-cerrar');
        cerrarBtn.addEventListener('click', () => {
            notificacion.classList.remove('show');
            setTimeout(() => {
                if (container.contains(notificacion)) {
                    container.removeChild(notificacion);
                }
            }, 300);
        });
        
        // Auto-cerrar después de duración
        setTimeout(() => {
            if (container.contains(notificacion)) {
                notificacion.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(notificacion)) {
                        container.removeChild(notificacion);
                    }
                }, 300);
            }
        }, duracion);
    }

    /**
     * Alterna la visibilidad del panel lateral
     */
    function togglePanel() {
        const panel = document.getElementById('panel-lateral');
        const boton = document.getElementById('boton-panel');
        
        if (!panel || !boton) {
            console.error("Panel lateral o botón no encontrados");
            return;
        }
        
        if (panel.classList.contains('oculto')) {
            panel.classList.remove('oculto');
            boton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            panelVisible = true;
        } else {
            panel.classList.add('oculto');
            boton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            panelVisible = false;
        }
    }

    /**
     * Cambia la pestaña activa del panel
     * @param {string} tabId - ID de la pestaña a activar
     */
    function cambiarTab(tabId) {
        // Desactivar todas las pestañas y contenidos
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(function(content) {
            content.classList.remove('active');
        });
        
        // Activar la pestaña seleccionada
        const botonTab = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (botonTab) botonTab.classList.add('active');
        
        const contenidoTab = document.getElementById(tabId);
        if (contenidoTab) contenidoTab.classList.add('active');
    }

    /**
     * Formatea una fecha ISO a formato legible
     * @param {string} fecha - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
    function formatearFecha(fecha) {
        if (!fecha) return 'Desconocido';
        
        try {
            const date = new Date(fecha);
            
            // Si la fecha es de hoy, mostrar solo la hora
            const hoy = new Date();
            if (date.toDateString() === hoy.toDateString()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            // Si la fecha es de esta semana, mostrar día y hora
            const unaSemana = 7 * 24 * 60 * 60 * 1000;
            if (hoy - date < unaSemana) {
                return date.toLocaleString([], { 
                    weekday: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
            
            // Para fechas más antiguas, mostrar fecha completa
            return date.toLocaleString([], { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return fecha;
        }
    }

    /**
     * Obtiene la URL del servidor
     * @returns {string} URL del servidor
     */
    function obtenerURLServidor() {
        // Opción 1: Usar la URL de la configuración global si está definida
        if (window.SERVER_URL) {
            return window.SERVER_URL;
        }
        
        // Opción 2: Intentar obtener de la configuración de red
        if (window.networkConfig && window.networkConfig.serverUrl) {
            return window.networkConfig.serverUrl;
        }
        
        // Opción 3: Construir URL basada en la ubicación actual
        const currentHost = window.location.hostname;
        const probablePort = "5000"; // Puerto donde suele correr el servidor
        
        return `http://${currentHost}:${probablePort}`;
    }

    /**
     * Obtiene el nombre de operación de la URL
     * @returns {string|null} Nombre de la operación o null si no existe
     */
    function obtenerOperacionDeUrl() {
        // Verificar hash en la URL (formato: #OpBelgrano)
        const hash = window.location.hash;
        if (hash && hash.startsWith('#')) {
            const operacion = hash.substring(1);
            if (operacion.length > 0) {
                return operacion;
            }
        }
        
        // Verificar parámetro en la URL (formato: ?operacion=Belgrano)
        const params = new URLSearchParams(window.location.search);
        const operacionParam = params.get('operacion');
        
        return operacionParam || null;
    }

    /**
     * Actualiza la URL del navegador con la operación actual
     * @param {string} operacion - Nombre de la operación
     */
    function actualizarUrlConOperacion(operacion) {
        if (!operacion) return;
        
        // Crear nueva URL con hash
        const newUrl = `${window.location.pathname}#${operacion}`;
        
        // Actualizar URL sin recargar la página
        try {
            window.history.pushState({ operacion: operacion }, '', newUrl);
            console.log(`URL actualizada a: ${newUrl}`);
        } catch (error) {
            console.error("Error al actualizar URL:", error);
        }
    }

    /**
     * Guarda el estado actual de la sesión
     */
    function guardarEstadoActual() {
        if (operacionActual) {
            localStorage.setItem('ultima_operacion', operacionActual);
        }
    }

    /**
     * Genera un ID único
     * @returns {string} ID generado
     */
    function generarId() {
        return 'gb_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    }

    // Eventos del ciclo de vida del documento
    document.addEventListener('DOMContentLoaded', inicializar);

    // API pública del módulo
    return {
        inicializar,
        togglePanel,
        iniciarSeguimiento,
        detenerSeguimiento,
        toggleSeguimiento,
        centrarEnPosicion,
        mostrarTodosElementos,
        enviarMensajeChat,
        agregarMensajeChat,
        enviarInforme,
        mostrarDetallesElemento,
        centrarEnElemento,
        mostrarNotificacion
    };
})();

/**
 * Mejoras para el archivo gestionBatalla.js
 * 
 * Estas funciones deben añadirse o modificarse en el archivo gestionBatalla.js
 * para mejorar la funcionalidad del panel lateral y la selección de elementos.
 */

/**
 * Inicializa el panel lateral y asegura que sea visible
 * Esta función debe ejecutarse durante la inicialización
 */
function inicializarPanelLateral() {
    // Buscar el panel lateral
    const panelLateral = document.getElementById('panel-lateral');
    if (!panelLateral) {
        console.error("Panel lateral no encontrado en el DOM");
        return;
    }

    // Asegurar que sea visible
    panelLateral.classList.remove('oculto');
    
    // Configurar botón para mostrar/ocultar el panel
    const botonPanel = document.querySelector('.boton-panel');
    if (botonPanel) {
        botonPanel.addEventListener('click', function() {
            panelLateral.classList.toggle('oculto');
        });
    } else {
        // Si no existe el botón, crearlo
        const nuevoBoton = document.createElement('div');
        nuevoBoton.className = 'boton-panel';
        nuevoBoton.innerHTML = '<i class="fas fa-bars"></i>';
        nuevoBoton.addEventListener('click', function() {
            panelLateral.classList.toggle('oculto');
        });
        document.body.appendChild(nuevoBoton);
    }
    
    // Inicializar pestañas del panel
    inicializarPestañasPanel();
    
    console.log("Panel lateral inicializado correctamente");
}

/**
 * Inicializa las pestañas del panel lateral
 */
function inicializarPestañasPanel() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0 || tabContents.length === 0) {
        console.warn("No se encontraron pestañas o contenidos de pestañas");
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Quitar clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Añadir clase active al botón clickeado
            button.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const tabId = button.getAttribute('data-tab');
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
    
    // Activar la primera pestaña por defecto
    if (tabButtons[0] && tabContents[0]) {
        tabButtons[0].classList.add('active');
        tabContents[0].classList.add('active');
    }
}

/**
 * Mejora la función para seleccionar un elemento en el mapa
 * Esta función debe reemplazar o complementar la existente
 */
function seleccionarElemento(elemento) {
    // Guardar referencia al elemento seleccionado
    window.elementoSeleccionado = elemento;
    
    // Cambiar estilo visual del elemento seleccionado (opcional)
    if (elemento) {
        // Obtener todos los marcadores y restaurar su estilo original
        window.calcoActivo.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                // Restaurar estilo original
                layer.setOpacity(1.0);
            }
        });
        
        // Destacar el elemento seleccionado
        elemento.setOpacity(0.8);
        
        // Mostrar panel de edición si existe
        const panelEdicion = document.getElementById('panel-edicion');
        if (panelEdicion) {
            panelEdicion.classList.remove('oculto');
            
            // Llenar el panel con los datos del elemento
            llenarPanelEdicion(elemento);
        }
        
        console.log("Elemento seleccionado:", elemento.options);
    }
}

/**
 * Llena el panel de edición con los datos del elemento seleccionado
 */
function llenarPanelEdicion(elemento) {
    if (!elemento) return;
    
    const opciones = elemento.options;
    
    // Llenar campos si existen
    const campoDesignacion = document.getElementById('editar-designacion');
    if (campoDesignacion && opciones.designacion !== undefined) {
        campoDesignacion.value = opciones.designacion;
    }
    
    const campoDependencia = document.getElementById('editar-dependencia');
    if (campoDependencia && opciones.dependencia !== undefined) {
        campoDependencia.value = opciones.dependencia;
    }
    
    const campoMagnitud = document.getElementById('editar-magnitud');
    if (campoMagnitud && opciones.magnitud !== undefined) {
        campoMagnitud.value = opciones.magnitud;
    }
    
    // Si hay un campo SIDC, actualizarlo
    const campoSIDC = document.getElementById('editar-sidc');
    if (campoSIDC && opciones.sidc !== undefined) {
        campoSIDC.value = opciones.sidc;
    }
    
    // Mostrar vista previa del símbolo
    const previewDiv = document.getElementById('symbol-preview');
    if (previewDiv && opciones.sidc && typeof ms !== 'undefined') {
        try {
            const symbol = new ms.Symbol(opciones.sidc, { size: 40 });
            previewDiv.innerHTML = symbol.asSVG();
        } catch (e) {
            console.error("Error al generar símbolo para vista previa:", e);
        }
    }
}

/**
 * Guarda los cambios del elemento que se está editando
 * Esta función se debe llamar desde el botón "Guardar Cambios" del panel
 */
function guardarCambiosElemento() {
    const elemento = window.elementoSeleccionado;
    if (!elemento) {
        console.warn("No hay elemento seleccionado para guardar cambios");
        return;
    }
    
    // Obtener valores de los campos
    const designacion = document.getElementById('editar-designacion')?.value || '';
    const dependencia = document.getElementById('editar-dependencia')?.value || '';
    const magnitud = document.getElementById('editar-magnitud')?.value || '';
    
    // Actualizar opciones del elemento
    elemento.options.designacion = designacion;
    elemento.options.dependencia = dependencia;
    elemento.options.magnitud = magnitud;
    
    // Si se cambió el símbolo, actualizar la visualización
    if (elemento.options.sidc) {
        const sym = new ms.Symbol(elemento.options.sidc, {
            size: 35,
            uniqueDesignation: designacion,
            higherFormation: dependencia
        });
        
        // Actualizar el icono
        elemento.setIcon(L.divIcon({
            className: 'elemento-militar',
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        }));
    }
    
    // Notificar cambios si es modo online
    if (socket && socket.connected) {
        socket.emit('actualizacionElemento', {
            id: elemento.options.id,
            designacion: designacion,
            dependencia: dependencia,
            magnitud: magnitud,
            sidc: elemento.options.sidc,
            posicion: elemento.getLatLng()
        });
    }
    
    // Cerrar panel de edición o mostrar mensaje
    const panelEdicion = document.getElementById('panel-edicion');
    if (panelEdicion) {
        panelEdicion.classList.add('oculto');
    }
    
    // Restaurar estilo visual
    elemento.setOpacity(1.0);
    
    // Limpiar referencia
    window.elementoSeleccionado = null;
    
    console.log("Cambios guardados:", elemento.options);
}

/**
 * Modificación a la función agregarMarcador para gestión de batalla
 * Esta función debe ser compatible con el contexto de gestionBatalla.js
 */
function agregarMarcadorGB(sidc, nombre) {
    window.mapa.once('click', function(event) {
        const latlng = event.latlng;
        
        // Configurar SIDC 
        let sidcFormateado = sidc.padEnd(15, '-');
        
        // Crear símbolo
        const sym = new ms.Symbol(sidcFormateado, { 
            size: 35,
            uniqueDesignation: "",  // Se llenará en la edición
            higherFormation: ""     // Se llenará en la edición
        });
        
        // Crear ID único para el elemento
        const elementoId = `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Crear marcador
        const marcador = L.marker(latlng, {
            icon: L.divIcon({
                className: 'elemento-militar',
                html: sym.asSVG(),
                iconSize: [70, 50],
                iconAnchor: [35, 25]
            }),
            draggable: true,
            sidc: sidcFormateado,
            nombre: nombre || 'Elemento',
            id: elementoId,
            designacion: '',
            dependencia: '',
            magnitud: sidcFormateado.charAt(11) || '-',
            estado: 'operativo',
            usuario: usuarioInfo?.usuario || 'Usuario',
            usuarioId: usuarioInfo?.id || ''
        });
        
        // Configurar eventos
        marcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            seleccionarElemento(this);
        });
        
        marcador.on('contextmenu', function(e) {
            L.DomEvent.stopPropagation(e);
            window.mostrarMenuContextual(e, this);
        });
        
        // Agregar al mapa
        window.calcoActivo.addLayer(marcador);
        
        // Notificar a otros usuarios
        if (socket && socket.connected) {
            socket.emit('nuevoElemento', {
                id: elementoId,
                sidc: sidcFormateado,
                nombre: nombre || 'Elemento',
                posicion: latlng,
                designacion: '',
                dependencia: '',
                magnitud: sidcFormateado.charAt(11) || '-',
                estado: 'operativo',
                usuario: usuarioInfo?.usuario || 'Usuario',
                usuarioId: usuarioInfo?.id || ''
            });
        }
        
        // Seleccionar automáticamente para edición
        seleccionarElemento(marcador);
    });
}

/**
 * Muestra un menú contextual para el elemento
 */
function mostrarMenuContextual(e, elemento) {
    L.DomEvent.stopPropagation(e);
    L.DomEvent.preventDefault(e);
    
    // Eliminar menú existente si lo hay
    const menuExistente = document.querySelector('.context-menu');
    if (menuExistente) {
        menuExistente.remove();
    }
    
    // Crear nuevo menú
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    // Agregar opciones al menú
    const opcionEditar = document.createElement('button');
    opcionEditar.textContent = 'Editar';
    opcionEditar.onclick = function() {
        seleccionarElemento(elemento);
        menu.remove();
    };
    menu.appendChild(opcionEditar);
    
    const opcionEliminar = document.createElement('button');
    opcionEliminar.textContent = 'Eliminar';
    opcionEliminar.onclick = function() {
        if (window.calcoActivo && elemento) {
            window.calcoActivo.removeLayer(elemento);
            
            // Notificar a otros usuarios
            if (socket && socket.connected && elemento.options.id) {
                socket.emit('eliminarElemento', {
                    id: elemento.options.id
                });
            }
        }
        menu.remove();
    };
    menu.appendChild(opcionEliminar);
    
    // Ubicar el menú en la posición del clic
    menu.style.left = e.originalEvent.clientX + 'px';
    menu.style.top = e.originalEvent.clientY + 'px';
    
    // Añadir al DOM
    document.body.appendChild(menu);
    
    // Cerrar el menú al hacer clic en cualquier otro lugar
    const cerrarMenu = function() {
        if (menu.parentNode) {
            menu.remove();
        }
        document.removeEventListener('click', cerrarMenu);
    };
    
    setTimeout(() => {
        document.addEventListener('click', cerrarMenu);
    }, 100);
    
    return false;
}

/**
 * Inicializa la funcionalidad de los botones de edición
 * Esta función se debe llamar durante la inicialización
 */
function inicializarBotonesEdicion() {
    // Botón guardar cambios
    const btnGuardar = document.getElementById('btn-guardar-cambios');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarCambiosElemento);
    } else {
        console.warn("Botón guardar cambios no encontrado");
    }
    
    // Botón cancelar 
    const btnCancelar = document.getElementById('btn-cancelar-edicion');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            // Ocultar panel de edición
            const panelEdicion = document.getElementById('panel-edicion');
            if (panelEdicion) {
                panelEdicion.classList.add('oculto');
            }
            
            // Restaurar estilo visual
            if (window.elementoSeleccionado) {
                window.elementoSeleccionado.setOpacity(1.0);
                window.elementoSeleccionado = null;
            }
        });
    }
}

// Conectar con agregarMarcador global para mantener compatibilidad
window.agregarMarcadorGB = agregarMarcadorGB;
window.seleccionarElemento = seleccionarElemento;
window.mostrarMenuContextual = mostrarMenuContextual;


// Configuración de la carga
(function() {
    // Muestra progreso de carga
    let progreso = 0;
    const intervalId = setInterval(function() {
        progreso += 5;
        if (progreso > 100) {
            clearInterval(intervalId);
            return;
        }
        
        const progressBar = document.getElementById('progreso');
        const porcentajeText = document.getElementById('porcentajeCarga');
        const loadingText = document.getElementById('loadingText');
        
        if (progressBar) progressBar.style.width = progreso + '%';
        if (porcentajeText) porcentajeText.textContent = progreso + '%';
        
        if (loadingText) {
            switch(true) {
                case progreso < 20:
                    loadingText.textContent = 'Inicializando componentes...';
                    break;
                case progreso < 40:
                    loadingText.textContent = 'Cargando bibliotecas...';
                    break;
                case progreso < 60:
                    loadingText.textContent = 'Preparando mapa...';
                    break;
                case progreso < 80:
                    loadingText.textContent = 'Configurando interfaz...';
                    break;
                default:
                    loadingText.textContent = 'Completando inicialización...';
            }
        }
    }, 100);
})();