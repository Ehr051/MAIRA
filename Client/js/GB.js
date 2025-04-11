/**
 * gestionBatalla.js
 * Core module for battle management in MAIRA
 * @version 2.0.0
 */

// Namespace principal para evitar conflictos
window.MAIRA = window.MAIRA || {};


// Poner esto al principio del archivo GB.js, antes de la definición de MAIRA.GestionBatalla
(function() {
    // Inicialización inmediata de estructura MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.GestionBatalla) {
        window.MAIRA.GestionBatalla = {
            elementosConectados: {},
            usuarioInfo: null,
            elementoTrabajo: null,
            operacionActual: "",
            actualizarElementoConectado: function(id, datos, posicion) {
                if (!window.MAIRA.GestionBatalla.elementosConectados) {
                    window.MAIRA.GestionBatalla.elementosConectados = {};
                }
                
                if (!window.MAIRA.GestionBatalla.elementosConectados[id]) {
                    window.MAIRA.GestionBatalla.elementosConectados[id] = {
                        datos: datos || {},
                        marcador: null
                    };
                } else {
                    window.MAIRA.GestionBatalla.elementosConectados[id].datos = {
                        ...window.MAIRA.GestionBatalla.elementosConectados[id].datos,
                        ...(datos || {}),
                        posicion: posicion || window.MAIRA.GestionBatalla.elementosConectados[id].datos.posicion
                    };
                }
                
                window.elementosConectados = window.MAIRA.GestionBatalla.elementosConectados;
                return window.MAIRA.GestionBatalla.elementosConectados[id];
            }
        };
    }
    
    // Crear referencia global para elementosConectados
    window.elementosConectados = window.MAIRA.GestionBatalla.elementosConectados;
    
    console.log("Estructura MAIRA inicializada preventivamente");
})();


// Módulo principal de Gestión de Batalla
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
    let listaElementosDiv = null;
    let ultimaPosicion = null;
    let operacionActual = "";
    let colaPendiente = {
        mensajes: [],
        informes: [],
        posiciones: []
    };
    
    // Almacenamiento para estados de la interfaz
    let estadosUI = {
        tabActiva: 'tab-elementos',
        chatPrivado: false,
        filtroInformes: 'todos'
    };

    /**
     * Inicializa el módulo cuando el DOM está listo
     */
    function inicializar() {
        console.log("Inicializando modo Gestión de Batalla v2.0.0");
        // Al inicio del archivo o donde se inicializa GB
        window.MAIRA = window.MAIRA || {};
        window.MAIRA.modoGB = true;
        window.socket = window.socket || null;
        window.MAIRA.GestionBatalla = window.MAIRA.GestionBatalla || {};
            // Verificar modo correcto
        const esModoGestionBatalla = window.location.pathname.includes('gestionbatalla.html');
        if (!esModoGestionBatalla) {
            console.warn("No estamos en modo Gestión de Batalla");
            return;
        }
        
        if (!cargarInfoDesdeLocalStorage()) {
            return;
        }
        
        // Cargar operación
        if (!cargarOperacionDesdeURL()) {
            console.warn("No se pudo cargar información de la operación");
            return; // Si falla, ya se redirigió a la sala de espera
        }
        
        // Ocultar pantalla de carga
        mostrarCargando(false);
        
        // Inicializar componentes
        inicializarInterfaz();

        // Añadir al inicio de la función
        inicializarEstructuraElementos();

        // Mostrar contenido principal
        document.getElementById('main-content').style.display = 'block';
        
        // Inicializar el mapa si aún no se ha hecho
        if (!window.mapa || typeof window.inicializarMapa === 'function') {
            console.log("Inicializando mapa desde Gestión de Batalla");
            window.inicializarMapa();
        }
        

        // Establecer conexión con el servidor
        conectarAlServidor();
        
        // Configurar eventos de cierre
        window.addEventListener('beforeunload', guardarEstadoActual);
        
        if (MAIRA.Elementos && typeof MAIRA.Elementos.inicializar === 'function') {
            MAIRA.Elementos.inicializar({
                socket: socket,
                usuarioInfo: usuarioInfo,
                operacionActual: operacionActual,
                elementoTrabajo: elementoTrabajo,
                ultimaPosicion: ultimaPosicion,
                elementosConectados: elementosConectados
            });
        }

        if (MAIRA.Elementos && typeof MAIRA.Elementos.seleccionarElementoGB === 'function') {
            MAIRA.Elementos.seleccionarElementoGB(elemento);
        }
        
        // THEN initialize Chat module (after elements)
        if (MAIRA.Chat && typeof MAIRA.Chat.inicializar === 'function') {
            MAIRA.Chat.inicializar({
                socket: socket,
                usuarioInfo: usuarioInfo,
                operacionActual: operacionActual,
                elementoTrabajo: elementoTrabajo,  // Añadir esta línea
                elementosConectados: elementosConectados
            });
        }
        
        if (MAIRA.Informes && typeof MAIRA.Informes.inicializar === 'function') {
            MAIRA.Informes.inicializar({
                socket: socket,
                usuarioInfo: usuarioInfo,
                operacionActual: operacionActual,
                elementoTrabajo: elementoTrabajo,
                ultimaPosicion: ultimaPosicion
            });
        }
        // Obtener posición inicial
        obtenerPosicionInicial();

        // Iniciar envío periódico
        iniciarEnvioPeriodico();
        configurarEventosSocket();
        centralizarElementosConectados();
        // Añadir aquí:
        inicializarSistemaTracking();

        if (MAIRA.Chat && typeof MAIRA.Chat.inicializarNotificacionesChat === 'function') {
            MAIRA.Chat.inicializarNotificacionesChat();
        }
        
        // Sincronizar elementos con el chat
        if (MAIRA.Chat && typeof MAIRA.Chat.sincronizarElementosChat === 'function') {
            MAIRA.Chat.sincronizarElementosChat(elementosConectados);
        }
        if (!window.mapa || typeof window.inicializarMapa === 'function') {
            console.log("Inicializando mapa desde Gestión de Batalla");
            window.inicializarMapa();
        }
        // Inicializar MiRadial después de que el mapa esté listo
        if (window.mapa && window.MiRadial && typeof window.MiRadial.init === 'function') {
            console.log("Inicializando MiRadial para GB");
            window.MiRadial.init(window.mapa);
        } else {
            console.warn("MiRadial no disponible o mapa no inicializado");
        }
        configurarEventosMiRadialGB();

        console.log("Inicialización de Gestión de Batalla completada");
    }




// Integración del sistema de tracking
function inicializarSistemaTracking() {
    console.log("Inicializando sistema de tracking de elementos...");
    
    // Verificar si hay preferencia guardada
    const trackingActivadoPrevio = localStorage.getItem('tracking_activado') === 'true';
    
    // Añadir botón de tracking global en la interfaz
    const controlsContainer = document.querySelector('.leaflet-top.leaflet-right');
    if (controlsContainer) {
        const trackingControl = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function() {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control tracking-control');
                const button = L.DomUtil.create('a', 'tracking-button', container);
                button.id = 'btnTrackingGlobal';
                button.href = '#';
                button.title = 'Mostrar/ocultar recorrido de todos los elementos';
                button.innerHTML = '<i class="fas fa-route"></i>';
                
                // Aplicar clase activa si estaba activado previamente
                if (trackingActivadoPrevio) {
                    button.classList.add('active');
                }
                
                L.DomEvent.on(button, 'click', function(e) {
                    L.DomEvent.stop(e);
                    if (typeof toggleTracking === 'function') {
                        toggleTracking();
                        button.classList.toggle('active');
                    } else {
                        console.warn("Función toggleTracking no disponible");
                    }
                });
                
                return container;
            }
        });
        
        // Añadir al mapa
        if (window.mapa) {
            window.mapa.addControl(new trackingControl());
        }
    }
    
    // Activar tracking si estaba activo previamente
    if (trackingActivadoPrevio && typeof iniciarTrackingElementos === 'function') {
        setTimeout(iniciarTrackingElementos, 2000); // Retraso para asegurar que los elementos estén cargados
    }
    
    // Añadir estilos CSS para el botón de tracking
    const style = document.createElement('style');
    style.textContent = `
        .tracking-button {
            background-color: white;
            width: 30px;
            height: 30px;
            line-height: 30px;
            text-align: center;
            display: block;
            color: #333;
        }
        .tracking-button.active {
            background-color: #ffcc00;
            color: black;
        }
        .tracking-button:hover {
            background-color: #f4f4f4;
        }
        .btn-tracking {
            color: #f90;
        }
    `;
    document.head.appendChild(style);
    
    console.log("Sistema de tracking inicializado");
}




function inicializarEstructuraElementos() {
    console.log("Inicializando estructura centralizada para elementos");
    
    // Crear namespace MAIRA si no existe
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.GestionBatalla) window.MAIRA.GestionBatalla = {};
    
    // Inicializar elementosConectados de forma centralizada
    if (!window.MAIRA.GestionBatalla.elementosConectados) {
        window.MAIRA.GestionBatalla.elementosConectados = {};
    }
    
    // Crear referencia global para compatibilidad
    window.elementosConectados = window.MAIRA.GestionBatalla.elementosConectados;
    
    // Mejorar función de actualización de elementos
    window.MAIRA.GestionBatalla.actualizarElementoConectado = function(id, datos, posicion) {
        // No procesar actualizaciones vacías
        if (!id) {
            console.warn("ID no proporcionado para actualizar elemento");
            return null;
        }
        
        // Obtener referencia a elementosConectados centralizado
        const elementosConectados = window.MAIRA.GestionBatalla.elementosConectados;
        
        // Crear o actualizar elemento
        if (!elementosConectados[id]) {
            elementosConectados[id] = {
                datos: datos || {},
                marcador: null
            };
        } else {
            // Preservar marcador existente
            const marcadorExistente = elementosConectados[id].marcador;
            
            // Actualizar datos con cuidado para evitar pérdida de información
            elementosConectados[id].datos = {
                ...elementosConectados[id].datos,
                ...(datos || {}),
                posicion: posicion || (datos && datos.posicion) || elementosConectados[id].datos.posicion
            };
            
            // Asegurar que el marcador se conserva
            elementosConectados[id].marcador = marcadorExistente;
            
            // Actualizar posición del marcador si existe
            if (marcadorExistente && posicion && typeof posicion.lat !== 'undefined' && typeof posicion.lng !== 'undefined') {
                try {
                    marcadorExistente.setLatLng([posicion.lat, posicion.lng]);
                    console.log(`Posición de marcador ${id} actualizada: ${posicion.lat}, ${posicion.lng}`);
                } catch (e) {
                    console.error(`Error al actualizar posición de marcador ${id}:`, e);
                }
            }
        }
        
        // Sincronizar con referencias globales
        window.elementosConectados = window.MAIRA.GestionBatalla.elementosConectados;
        
        return elementosConectados[id];
    };
    
    console.log("Estructura de elementos inicializada correctamente");
    return true;
}



function enviarBroadcastPeriodico() {
    if (!socket?.connected || !usuarioInfo?.id) return;

    const datos = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoTrabajo,
        posicion: ultimaPosicion,
        operacion: operacionActual,
        conectado: true,
        timestamp: new Date().toISOString()
    };

    // Enviar usando múltiples canales para asegurar compatibilidad
    socket.emit('actualizarPosicionGB', datos);
    socket.emit('elementoConectado', datos);
    socket.emit('anunciarElemento', datos);
    socket.emit('nuevoElemento', datos);

    console.log("Broadcast periódico enviado:", datos);
}



/**
 * Maneja el estado de conexión de un elemento
 */
function manejarEstadoConexion(elementoId, estaConectado) {
    const elemento = elementosConectados[elementoId];
    if (!elemento) {
        console.warn(`Elemento ${elementoId} no encontrado para actualizar estado`);
        return;
    }

    // Actualizar estado en datos
    elemento.conectado = estaConectado;
    elemento.ultimaConexion = new Date().toISOString();

    // Actualizar visual en la lista
    const itemLista = document.querySelector(`.elemento-item[data-id="${elementoId}"]`);
    if (itemLista) {
        itemLista.classList.toggle('desconectado', !estaConectado);
        const indicadorEstado = itemLista.querySelector('.estado-conexion');
        if (indicadorEstado) {
            indicadorEstado.textContent = estaConectado ? '●' : '○';
            indicadorEstado.title = estaConectado ? 'Conectado' : 'Desconectado';
            indicadorEstado.className = `estado-conexion ${estaConectado ? 'conectado' : 'desconectado'}`;
        }
    }

    // Actualizar visual en el mapa
    if (elemento.marcador) {
        const opacidad = estaConectado ? 1 : 0.5;
        elemento.marcador.setOpacity(opacidad);
        
        // Actualizar estilo del icono
        const iconoActual = elemento.marcador.options.icon;
        if (iconoActual && iconoActual.options.html) {
            const nuevoIcono = L.divIcon({
                ...iconoActual.options,
                className: `elemento-militar ${estaConectado ? '' : 'desconectado'}`
            });
            elemento.marcador.setIcon(nuevoIcono);
        }
    }
}

/**
 * Maneja la reconexión de un elemento
 */
function manejarReconexion(datosElemento) {
    console.log("Manejando reconexión de elemento:", datosElemento);

    const elementoExistente = elementosConectados[datosElemento.id];
    
    if (elementoExistente) {
        // Actualizar posición y estado
        if (elementoExistente.marcador) {
            const nuevaPosicion = L.latLng(
                datosElemento.posicion.lat, 
                datosElemento.posicion.lng
            );
            elementoExistente.marcador.setLatLng(nuevaPosicion);
        }

        // Actualizar datos
        elementoExistente.datos = {
            ...elementoExistente.datos,
            ...datosElemento
        };

        // Marcar como conectado
        manejarEstadoConexion(datosElemento.id, true);

        console.log(`Elemento ${datosElemento.id} reconectado y actualizado`);
    } else {
        // Si no existe, crear nuevo
        agregarNuevoElemento(datosElemento);
    }
}

/**
 * Maneja la desconexión de un elemento
 */
function manejarDesconexion(elementoId) {
    console.log("Manejando desconexión de elemento:", elementoId);
    
    // Marcar como desconectado pero mantener en el mapa
    manejarEstadoConexion(elementoId, false);

    // Iniciar temporizador para limpieza si no se reconecta
    const TIEMPO_LIMPIEZA = 30 * 60 * 1000; // 30 minutos
    setTimeout(() => {
        const elemento = elementosConectados[elementoId];
        if (elemento && !elemento.conectado) {
            console.log(`Eliminando elemento ${elementoId} por inactividad`);
            eliminarElemento(elementoId);
        }
    }, TIEMPO_LIMPIEZA);
}





function centralizarElementosConectados() {
    console.log("Centralizando referencias de elementosConectados");
    
    // Si no existe estructura MAIRA, crearla
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.GestionBatalla) window.MAIRA.GestionBatalla = {};
    
    // Asegurar que existe elementosConectados
    if (!window.MAIRA.GestionBatalla.elementosConectados) {
        window.MAIRA.GestionBatalla.elementosConectados = {};
        
        // Si ya existe la referencia global, copiar sus datos
        if (window.elementosConectados) {
            Object.assign(window.MAIRA.GestionBatalla.elementosConectados, window.elementosConectados);
        }
    }
    
    // Hacer que la referencia global apunte a la referencia central
    window.elementosConectados = window.MAIRA.GestionBatalla.elementosConectados;
    
    // Retornar la referencia centralizada
    return window.MAIRA.GestionBatalla.elementosConectados;
}



    
    /**
     * Inicializa todos los componentes de la interfaz
     */
    function inicializarInterfaz() {
        console.log("Inicializando componentes de la interfaz");
        
        // Inicializar panel lateral
        inicializarPanelLateral();
        
        // Inicializar menús y controles
        inicializarMenusAvanzados();
        
        // Inicializar botones específicos
        inicializarBotones();
        
        // Inicializar notificaciones
        inicializarNotificaciones();
        
        // Actualizar información en el panel
        actualizarInfoUsuarioPanel();
        
        // Inicializar los eventos de las pestañas
        inicializarPestañas();
        
        console.log("Componentes de interfaz inicializados");
    }
    
   

    /**
     * Inicializa los eventos de click para las pestañas
     */
    function inicializarPestañas() {
        // Configurar event listeners para los botones de pestañas
        const botonesPestañas = document.querySelectorAll('.tab-btn');
        botonesPestañas.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                if (tabId) {
                    cambiarTab(tabId);
                }
            });
        });
        
        console.log("Pestañas inicializadas:", botonesPestañas.length);
        
        // Activar pestaña por defecto o guardada
        const tabGuardada = localStorage.getItem('gb_tab_activa');
        if (tabGuardada && document.getElementById(tabGuardada)) {
            cambiarTab(tabGuardada);
        } else {
            cambiarTab('tab-elementos'); // Pestaña por defecto
        }
    }
    
   
    /**
     * Carga la operación desde la URL o localStorage
     * @returns {boolean} - Verdadero si se cargó correctamente
     */
    function cargarOperacionDesdeURL() {
        // Intentar obtener operación desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const operacionParam = urlParams.get('operacion');
        // Añadir al inicio de cargarOperacionDesdeURL en GB.js
        if (!window.MAIRA) window.MAIRA = {};
        if (!window.MAIRA.GestionBatalla) window.MAIRA.GestionBatalla = {};
        window.MAIRA.GestionBatalla.operacionActual = operacionParam;
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
     * Inicializa el panel lateral
     */
    function inicializarPanelLateral() {
        console.log("Inicializando panel lateral");
        
        // Verificar existencia del panel
        const panel = document.getElementById('panel-lateral');
        if (!panel) {
            console.error("Panel lateral no encontrado. Revise la estructura HTML.");
            return;
        }
        
        // Configurar estado inicial - visible por defecto
        panel.classList.remove('oculto'); // Panel visible inicialmente
        panelVisible = true;
        
        // Configurar botón del panel
        const botonPanel = document.getElementById('boton-panel');
        if (botonPanel) {
            // Actualizar la flecha del botón para que indique cierre
            botonPanel.innerHTML = '<i class="fas fa-chevron-left"></i>';
            
            // Agregar listener de forma más simple
            botonPanel.addEventListener('click', function() {
                togglePanel();
            });
        } else {
            console.warn("Botón del panel no encontrado");
        }
        
        // Configurar evento para cerrar panel
        const cerrarPanel = document.getElementById('cerrar-panel');
        if (cerrarPanel) {
            cerrarPanel.addEventListener('click', function() {
                togglePanel(false); // Forzar cierre
            });
        }
        
        // Guardar estado en localStorage
        localStorage.setItem('panelVisible', 'true');
        
        console.log("Panel lateral inicializado (visible por defecto)");
    }
    /**
     * Inicializa el comportamiento de los menús desplegables
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
        
        // Cerrar menús al hacer clic fuera de ellos
        document.addEventListener('click', function() {
            document.querySelectorAll('.menu.show').forEach(openMenu => {
                openMenu.classList.remove('show');
            });
        });
    }
    
    /**
     * Inicializa los botones principales de acción
     */
    function inicializarBotones() {
        // Botón de volver
        const btnVolver = document.getElementById('btnVolver');
        if (btnVolver) {
            btnVolver.addEventListener('click', function() {
                window.location.href = '/Client/inicioGB.html';
            });
        }
        
        // Botón para salir de la operación
        const btnSalirOperacion = document.getElementById('btn-salir-operacion');
        if (btnSalirOperacion) {
            btnSalirOperacion.addEventListener('click', function() {
                if (confirm('¿Está seguro que desea salir de esta operación? Se perderá la conexión actual.')) {
                    salirDeOperacionGB();
                }
            });
        }

        // Botón de pantalla completa
        const btnFullscreen = document.getElementById('fullscreenBtn');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', function() {
                toggleFullScreen();
            });
        }
        // Botón de tracking
        const btnTracking = document.getElementById('btnTracking');
        if (btnTracking) {
            btnTracking.addEventListener('click', function() {
                if (MAIRA.Elementos && typeof MAIRA.Elementos.toggleTracking === 'function') {
                    MAIRA.Elementos.toggleTracking();
                }
            });
        }
    }
    
    /**
     * Función para alternar la pantalla completa
     */
    function toggleFullScreen() {
        if (!document.fullscreenElement &&    // método estándar
            !document.mozFullScreenElement && // Firefox
            !document.webkitFullscreenElement && // Chrome, Safari y Opera
            !document.msFullscreenElement) {  // IE/Edge
            // Activar pantalla completa
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } else {
            // Salir de pantalla completa
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    /**
     * Alterna la visibilidad del panel lateral
     * @param {boolean} forzarEstado - Si se proporciona, fuerza el estado del panel
     */
    function togglePanel(forzarEstado) {
        const panel = document.getElementById('panel-lateral');
        const boton = document.getElementById('boton-panel');
        
        if (!panel || !boton) {
            console.error("Panel lateral o botón no encontrados");
            return;
        }
        
        // Determinar si el panel debe mostrarse u ocultarse
        let mostrarPanel;
        
        if (forzarEstado !== undefined) {
            mostrarPanel = forzarEstado;
        } else {
            mostrarPanel = panel.classList.contains('oculto');
        }
        
        if (mostrarPanel) {
            panel.classList.remove('oculto');
            boton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            panelVisible = true;
            localStorage.setItem('panelVisible', 'true');
        } else {
            panel.classList.add('oculto');
            boton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            panelVisible = false;
            localStorage.setItem('panelVisible', 'false');
        }
        
        // Forzar re-renderizado para dispositivos que podrían tener problemas de visualización
        setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
        }, 100);
        
        console.log("Panel lateral: " + (mostrarPanel ? "visible" : "oculto"));
    }
    
    /**
     * Cambia la pestaña activa del panel
     * @param {string} tabId - ID de la pestaña a activar
     */
    // En GB.js, justo después de cambiar la pestaña
function cambiarTab(tabId) {
    console.log(`Cambiando a pestaña: ${tabId}`);
    
    // Ocultar todas las pestañas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Desactivar todos los botones
    const botones = document.querySelectorAll('.tab-btn');
    botones.forEach(btn => btn.classList.remove('active'));
    
    // Activar la pestaña solicitada
    const tabSeleccionado = document.getElementById(tabId);
    const btnSeleccionado = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    
    if (tabSeleccionado) {
        tabSeleccionado.classList.add('active');
        console.log(`Contenido de pestaña activado: ${tabId}`);
        
        // Verificar que realmente se muestre
        if (window.getComputedStyle(tabSeleccionado).display === 'none') {
            console.error(`El contenido de la pestaña ${tabId} está configurado como display:none a pesar de tener la clase active`);
            tabSeleccionado.style.display = 'block';
        }
    } else {
        console.error(`No se encontró la pestaña con ID: ${tabId}`);
    }
    
    if (btnSeleccionado) {
        btnSeleccionado.classList.add('active');
        console.log(`Botón de pestaña activado: ${tabId}`);
    } else {
        console.error(`No se encontró el botón para la pestaña: ${tabId}`);
    }
    
    // Si es la pestaña de informes, forzar la actualización de la lista
    if (tabId === 'tab-informes') {
        // Verificar si existe la función para actualizar informes
        if (MAIRA.Informes && typeof MAIRA.Informes.actualizarListaInformes === 'function') {
            MAIRA.Informes.actualizarListaInformes();
        }
        
        // Forzar el botón de "Ver Informes" a estar activo
        const btnVerInformes = document.getElementById('btn-ver-informes');
        const btnCrearInforme = document.getElementById('btn-crear-informe');
        
        if (btnVerInformes) {
            btnVerInformes.classList.add('active');
            
            // También mostrar la lista
            const verInformes = document.getElementById('ver-informes');
            if (verInformes) {
                verInformes.classList.remove('d-none');
            }
        }
        
        if (btnCrearInforme) {
            btnCrearInforme.classList.remove('active');
            
            // Ocultar el form de crear
            const crearInforme = document.getElementById('crear-informe');
            if (crearInforme) {
                crearInforme.classList.add('d-none');
            }
        }
    }
}
    /**
     * Inicializa el sistema de notificaciones
     */
    function inicializarNotificaciones() {
        // Verificar si ya existe el contenedor
        let container = document.getElementById('notificaciones-container');
        if (!container) {
            // Crear contenedor si no existe
            container = document.createElement('div');
            container.id = 'notificaciones-container';
            container.className = 'notificaciones-container';
            document.body.appendChild(container);
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
     * Obtiene la posición inicial con mejor soporte para dispositivos móviles
     */
    // Modificar en GB.js - función de inicialización
    function obtenerPosicionInicial() {
        console.log("Obteniendo posición inicial (versión mejorada para móviles)");
        
        // No crear marcador hasta tener posición
        window.esperandoPosicion = true;
        
        // Opciones optimizadas para dispositivos móviles
        const opcionesPosicion = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        };
        
        // Verificar si el navegador soporta geolocalización
        if (!navigator.geolocation) {
            console.error("La geolocalización no está soportada en este navegador");
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
            cargarPosicionPredeterminada();
            return;
        }
        
        try {
            // Primero mostrar que estamos buscando la ubicación
            MAIRA.Utils.mostrarNotificacion("Obteniendo tu ubicación...", "info");
            
            // Verificar si es un dispositivo móvil para mostrar instrucciones especiales
            const esMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (esMobile) {
                MAIRA.Utils.mostrarNotificacion("Dispositivo móvil detectado. Asegúrate de tener el GPS activado.", "info", 5000);
            }
            
            navigator.geolocation.getCurrentPosition(
                // Éxito
                function(posicion) {
                    console.log("Posición obtenida:", posicion.coords);
                    MAIRA.Utils.mostrarNotificacion("Posición obtenida correctamente", "success", 3000);
                    
                    // Resto del código para manejar la posición...
                    ultimaPosicion = {
                        lat: posicion.coords.latitude,
                        lng: posicion.coords.longitude,
                        precision: posicion.coords.accuracy,
                        rumbo: posicion.coords.heading || 0,
                        velocidad: posicion.coords.speed || 0,
                        timestamp: new Date()
                    };
                    
                    // Actualizar interfaz con retardo para asegurar que el mapa está listo
                    setTimeout(() => {
                        // Crear marcador solo si aún no existe
                        window.esperandoPosicion = false;
                        actualizarMarcadorUsuario(
                            posicion.coords.latitude, 
                            posicion.coords.longitude, 
                            posicion.coords.heading || 0
                        );
                        
                        // Centrar mapa en la posición obtenida
                        if (window.mapa) {
                            window.mapa.setView([posicion.coords.latitude, posicion.coords.longitude], 15);
                        }
                    }, 1000);
                },
                // Error
                function(error) {
                    console.error("Error al obtener posición:", error);
                    window.esperandoPosicion = false;
                    
                    let mensajeError = "Error al obtener tu posición";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            mensajeError = "Permiso de ubicación denegado. Activa la ubicación en tu dispositivo.";
                            
                            // Instrucciones específicas para móviles
                            if (esMobile) {
                                mostrarInstruccionesGPSMovil();
                            }
                            break;
                        case error.POSITION_UNAVAILABLE:
                            mensajeError = "Información de ubicación no disponible. Verifica tu GPS.";
                            break;
                        case error.TIMEOUT:
                            mensajeError = "Se agotó el tiempo para obtener tu ubicación.";
                            break;
                    }
                    
                    MAIRA.Utils.mostrarNotificacion(mensajeError, "error", 8000);
                    cargarPosicionPredeterminada();
                },
                opcionesPosicion
            );
        } catch (e) {
            console.error("Excepción al obtener posición:", e);
            window.esperandoPosicion = false;
            MAIRA.Utils.mostrarNotificacion("Error inesperado al acceder a tu ubicación", "error");
            cargarPosicionPredeterminada();
        }
    }
    /**
     * Muestra instrucciones específicas para activar GPS en dispositivos móviles
     */
    function mostrarInstruccionesGPSMovil() {
        // Crear modal o elemento de ayuda con instrucciones específicas
        const instrucciones = document.createElement('div');
        instrucciones.className = 'instrucciones-gps-movil';
        instrucciones.innerHTML = `
            <div class="instrucciones-contenedor">
                <h3>Activar GPS en tu dispositivo</h3>
                <p>Para usar correctamente esta aplicación:</p>
                <ol>
                    <li>Baja el panel de notificaciones y activa el GPS</li>
                    <li>Asegúrate de dar permiso a la aplicación para acceder a tu ubicación</li>
                    <li>Sal al exterior para mejor recepción GPS</li>
                </ol>
                <p>Para iPhone/iPad:</p>
                <ol>
                    <li>Ve a Configuración > Privacidad > Localización</li>
                    <li>Activa los Servicios de Localización</li>
                    <li>Busca tu navegador en la lista y selecciona "Al usar la app"</li>
                </ol>
                <p>Para Android:</p>
                <ol>
                    <li>Ve a Configuración > Ubicación</li>
                    <li>Activa la Ubicación</li>
                    <li>Asegúrate de usar el modo "Alta precisión"</li>
                </ol>
                <button id="btn-cerrar-instrucciones" class="btn btn-primary">Entendido</button>
            </div>
        `;
        
        // Agregar estilos inline
        instrucciones.style.position = 'fixed';
        instrucciones.style.top = '0';
        instrucciones.style.left = '0';
        instrucciones.style.width = '100%';
        instrucciones.style.height = '100%';
        instrucciones.style.backgroundColor = 'rgba(0,0,0,0.8)';
        instrucciones.style.zIndex = '9999';
        instrucciones.style.display = 'flex';
        instrucciones.style.alignItems = 'center';
        instrucciones.style.justifyContent = 'center';
        
        const contenedor = instrucciones.querySelector('.instrucciones-contenedor');
        contenedor.style.backgroundColor = 'white';
        contenedor.style.padding = '20px';
        contenedor.style.borderRadius = '8px';
        contenedor.style.maxWidth = '90%';
        contenedor.style.maxHeight = '80%';
        contenedor.style.overflow = 'auto';
        
        document.body.appendChild(instrucciones);
        
        document.getElementById('btn-cerrar-instrucciones').addEventListener('click', function() {
            document.body.removeChild(instrucciones);
        });
    }

    /**
     * Carga una posición predeterminada o la última conocida
     */
    function cargarPosicionPredeterminada() {
        // Intentar obtener la última posición conocida del localStorage
        const ultimaPosicionGuardada = localStorage.getItem('ultima_posicion');
        
        if (ultimaPosicionGuardada) {
            try {
                const posicion = JSON.parse(ultimaPosicionGuardada);
                ultimaPosicion = posicion;
                
                // Actualizar marcador con esta posición
                setTimeout(() => {
                    actualizarMarcadorUsuario(
                        posicion.lat, 
                        posicion.lng, 
                        posicion.rumbo || 0
                    );
                }, 1000);
                
                console.log("Usando última posición conocida:", posicion);
                return;
            } catch (e) {
                console.error("Error al parsear la última posición conocida:", e);
            }
        }
        
        // Si no hay última posición, usar una posición por defecto (puedes ajustar estas coordenadas)
        const posicionPredeterminada = {
            lat: -34.6037, // Buenos Aires como ejemplo
            lng: -58.3816,
            precision: 1000,
            rumbo: 0,
            timestamp: new Date()
        };
        
        ultimaPosicion = posicionPredeterminada;
        console.log("Usando posición predeterminada:", posicionPredeterminada);
    }
    /**
     * Actualiza el marcador del usuario
     * @param {number} lat - Latitud
     * @param {number} lng - Longitud
     * @param {number} heading - Rumbo en grados
     */
    // Modificar en GB.js - función actualizarMarcadorUsuario
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
                        size: 35,
                        direction: heading || 0,
                        uniqueDesignation: etiqueta
                    });
                    
                    // Comprobar que el símbolo se generó correctamente
                    if (symbol) {
                        // Crear marcador compatible con el sistema existente
                        marcadorUsuario = L.marker(nuevaPosicion, {
                            icon: L.divIcon({
                                className: 'elemento-militar usuario',
                                html: symbol.asSVG(),
                                iconSize: [70, 50],
                                iconAnchor: [35, 25]
                            }),
                            title: 'Tu posición',
                            sidc: elementoTrabajo.sidc,
                            nombre: etiqueta || usuarioInfo?.usuario || 'Mi posición',
                            id: elementoTrabajo.id || `usuario_${Date.now()}`,
                            designacion: elementoTrabajo.designacion || '',
                            dependencia: elementoTrabajo.dependencia || '',
                            magnitud: elementoTrabajo.magnitud || '-',
                            estado: 'operativo',
                            draggable: false
                        });
                        
                        // Asegurarse de que se añada al calco activo o al mapa
                        if (window.calcoActivo) {
                            window.calcoActivo.addLayer(marcadorUsuario);
                        } else {
                            window.mapa.addLayer(marcadorUsuario);
                        }
                        
                        console.log("Marcador de usuario añadido al mapa");
                        
                        // Actualizar referencia en elementosConectados
                        if (usuarioInfo?.id) {
                            if (!elementosConectados[usuarioInfo.id]) {
                                elementosConectados[usuarioInfo.id] = {
                                    datos: {
                                        id: usuarioInfo.id,
                                        usuario: usuarioInfo.usuario,
                                        elemento: elementoTrabajo,
                                        posicion: nuevaPosicion,
                                        conectado: true,
                                        timestamp: new Date().toISOString(),
                                        operacion: operacionActual // Añadir operación
                                    },
                                    marcador: marcadorUsuario
                                };
                            } else {
                                elementosConectados[usuarioInfo.id].marcador = marcadorUsuario;
                                elementosConectados[usuarioInfo.id].datos.posicion = nuevaPosicion;
                                elementosConectados[usuarioInfo.id].datos.operacion = operacionActual; // Añadir operación
                            }
                        }
                        
                        // Guardar en localStorage específico de la operación
                        guardarElementosEnLocalStorage();
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
            
            // Actualizar en elementosConectados
            if (usuarioInfo?.id && elementosConectados[usuarioInfo.id]) {
                elementosConectados[usuarioInfo.id].datos.posicion = nuevaPosicion;
                elementosConectados[usuarioInfo.id].datos.operacion = operacionActual; // Añadir operación
                guardarElementosEnLocalStorage(); // Guardar cambios
            }
            
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
    
    function crearMarcadorUsuarioSimple(posicion) {
        // Crear un marcador con las propiedades que espera el sistema
        marcadorUsuario = L.marker(posicion, {
            icon: L.divIcon({
                className: 'custom-div-icon usuario',
                html: '<div style="background-color:#0281a8;width:20px;height:20px;border-radius:50%;border:2px solid white;"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            title: 'Tu posición',
            nombre: usuarioInfo?.usuario || 'Mi posición',
            id: usuarioInfo?.id || `usuario_${Date.now()}`,
            draggable: false
        });
        
        if (window.calcoActivo) {
            window.calcoActivo.addLayer(marcadorUsuario);
        } else {
            window.mapa.addLayer(marcadorUsuario);
        }
        
        // Configurar eventos compatibles con edicioncompleto.js
        marcadorUsuario.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            if (window.seleccionarElemento) {
                window.seleccionarElemento(this);
            }
        });
        
        marcadorUsuario.on('contextmenu', function(e) {
            L.DomEvent.stopPropagation(e);
            if (window.mostrarMenuContextual) {
                window.mostrarMenuContextual(e, this);
            }
        });
        
        // Actualizar referencia en elementosConectados
        if (usuarioInfo?.id) {
            if (!elementosConectados[usuarioInfo.id]) {
                elementosConectados[usuarioInfo.id] = {
                    datos: {
                        id: usuarioInfo.id,
                        usuario: usuarioInfo.usuario,
                        elemento: elementoTrabajo,
                        posicion: posicion,
                        conectado: true,
                        timestamp: new Date().toISOString()
                    },
                    marcador: marcadorUsuario
                };
            } else {
                elementosConectados[usuarioInfo.id].marcador = marcadorUsuario;
                elementosConectados[usuarioInfo.id].datos.posicion = posicion;
            }
        }
        
        console.log("Marcador simple añadido al mapa");
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
        
        if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
            MAIRA.Chat.agregarMensajeChat("Sistema", mensaje, "sistema");
        }
        MAIRA.Utils.mostrarNotificacion(mensaje, "error");
        detenerSeguimiento();
    }
    /**
     * Inicia el seguimiento de posición
     */

function iniciarSeguimiento() {
    // Si ya hay seguimiento activo, simplemente regresar
    if (seguimientoActivo) return;
    
    console.log("Iniciando seguimiento en segundo plano");
    
    // Configurar botón de seguimiento como activo
    const btnSeguimiento = document.getElementById('btn-seguimiento');
    if (btnSeguimiento) {
        btnSeguimiento.classList.add('active');
        btnSeguimiento.innerHTML = '<i class="fas fa-broadcast-tower text-danger"></i> Compartiendo ubicación';
    }
    
    // Mostrar mensaje en el chat
    if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
        MAIRA.Chat.agregarMensajeChat("Sistema", "Compartiendo tu ubicación en tiempo real...", "sistema");
    }
    
    // Opciones optimizadas
    const opcionesSeguimiento = {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
    };
    
    // Inicia seguimiento continuo
    watchId = navigator.geolocation.watchPosition(
        posicionActualizada,
        errorPosicion,
        opcionesSeguimiento
    );
    
    // Activar envío periódico incluso si la app está en segundo plano
    intervaloPosicion = setInterval(() => {
        enviarPosicionActual();
    }, 15000); // Cada 15 segundos para ahorrar batería
    
    // Mostrar indicador permanente de compartir ubicación
    mostrarIndicadorCompartiendo();
    
    // Activar la variable de seguimiento
    seguimientoActivo = true;
    
    // Guardar estado en localStorage para recuperar si se cierra la app
    localStorage.setItem('seguimiento_activo', 'true');
    localStorage.setItem('tiempo_inicio_seguimiento', Date.now().toString());
    
    // Notificar al usuario
    MAIRA.Utils.mostrarNotificacion("Compartiendo ubicación en tiempo real", "success", 5000);
}

// Función para mostrar un indicador permanente
function mostrarIndicadorCompartiendo() {
    // Si ya existe, no crear otro
    if (document.getElementById('indicador-compartiendo')) return;
    
    // Crear elemento
    const indicador = document.createElement('div');
    indicador.id = 'indicador-compartiendo';
    indicador.className = 'indicador-compartiendo';
    indicador.innerHTML = `
        <div class="icono-pulsante"><i class="fas fa-broadcast-tower"></i></div>
        <div class="texto-indicador">
            <div>Compartiendo ubicación en tiempo real</div>
            <button id="btn-detener-compartir">Detener</button>
        </div>
    `;
    
    // Estilos
    indicador.style.position = 'fixed';
    indicador.style.bottom = '20px';
    indicador.style.left = '20px';
    indicador.style.backgroundColor = 'rgba(255, 59, 48, 0.9)';
    indicador.style.color = 'white';
    indicador.style.padding = '10px 15px';
    indicador.style.borderRadius = '30px';
    indicador.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    indicador.style.zIndex = '9999';
    indicador.style.display = 'flex';
    indicador.style.alignItems = 'center';
    indicador.style.fontWeight = 'bold';
    
    // Icono pulsante
    const iconoPulsante = indicador.querySelector('.icono-pulsante');
    iconoPulsante.style.marginRight = '10px';
    iconoPulsante.style.animation = 'pulsar 2s infinite';
    
    // Añadir estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulsar {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Configurar botón para detener
    document.body.appendChild(indicador);
    document.getElementById('btn-detener-compartir').addEventListener('click', function() {
        detenerSeguimiento();
    });
}

// Función para mostrar un indicador permanente
function mostrarIndicadorCompartiendo() {
    // Si ya existe, no crear otro
    if (document.getElementById('indicador-compartiendo')) return;
    
    // Crear elemento
    const indicador = document.createElement('div');
    indicador.id = 'indicador-compartiendo';
    indicador.className = 'indicador-compartiendo';
    indicador.innerHTML = `
        <div class="icono-pulsante"><i class="fas fa-broadcast-tower"></i></div>
        <div class="texto-indicador">
            <div>Compartiendo ubicación en tiempo real</div>
            <button id="btn-detener-compartir">Detener</button>
        </div>
    `;
    
    // Estilos
    indicador.style.position = 'fixed';
    indicador.style.bottom = '20px';
    indicador.style.left = '20px';
    indicador.style.backgroundColor = 'rgba(255, 59, 48, 0.9)';
    indicador.style.color = 'white';
    indicador.style.padding = '10px 15px';
    indicador.style.borderRadius = '30px';
    indicador.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    indicador.style.zIndex = '9999';
    indicador.style.display = 'flex';
    indicador.style.alignItems = 'center';
    indicador.style.fontWeight = 'bold';
    
    // Icono pulsante
    const iconoPulsante = indicador.querySelector('.icono-pulsante');
    iconoPulsante.style.marginRight = '10px';
    iconoPulsante.style.animation = 'pulsar 2s infinite';
    
    // Añadir estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulsar {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Configurar botón para detener
    document.body.appendChild(indicador);
    document.getElementById('btn-detener-compartir').addEventListener('click', function() {
        detenerSeguimiento();
    });
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
        
        if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
            MAIRA.Chat.agregarMensajeChat("Sistema", "Seguimiento de posición desactivado", "sistema");
        }
        
        // Actualizar localStorage
        localStorage.setItem('seguimiento_activo', 'false');
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
            console.log("Enviando posición actualizada al servidor");
            
            // Crear paquete de datos más completo
            const datosPosicion = {
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
                conectado: true,
                timestamp: new Date().toISOString(),
                operacion: operacionActual
            };
            
            // Enviar al servidor - NOTA: cambiar 'actualizarPosicionGBGB' por el evento correcto
            socket.emit('actualizarPosicionGB', datosPosicion);
            
            // IMPORTANTE: También actualizar la posición en elementosConectados local
            if (elementosConectados[usuarioInfo.id]) {
                elementosConectados[usuarioInfo.id].datos.posicion = datosPosicion.posicion;
                console.log("Posición actualizada en datos locales");
            }
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
                    rumbo: heading || 0,
                    velocidad: speed || 0
                },
                timestamp: new Date().toISOString(),
                operacion: operacionActual
            });
            
            console.log("Posición guardada en cola pendiente para envío posterior");
        }
    }
    


function conectarAlServidor() {
    try {
        // Obtener la URL del servidor (asegúrate de que esta función exista)
        const serverURL = MAIRA.Utils.obtenerURLServidor ? 
                          MAIRA.Utils.obtenerURLServidor() : 
                          (window.location.hostname === 'localhost' ? 
                           'http://localhost:3000' : window.location.origin);
        
        console.log("Conectando al servidor:", serverURL);
        window.socket = socket;
        window.MAIRA.GestionBatalla.socket = socket;

        // Configuración del socket con reconexión automática
        socket = io(serverURL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });
        
        
        socket.on('connect', function() {
            console.log("📡 Conectado al servidor");
            
            // Limpiar elementos al conectar
            limpiarElementosDuplicados();
            
            // Enviar nuestro propio elemento
            if (usuarioInfo && ultimaPosicion) {
                const datosPropios = {
                    id: usuarioInfo.id,  // Usar ID fijo del usuario
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: ultimaPosicion,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString(),
                    conectado: true
                };
                
                // Anunciar nuestra presencia
                socket.emit('actualizarPosicionGB', datosPropios);
                socket.emit('nuevoElemento', datosPropios);
                socket.emit('anunciarElemento', datosPropios);
            }
            
            // Solicitar la lista completa
            socket.emit('solicitarElementos', {
                operacion: operacionActual,
                solicitante: usuarioInfo?.id
            });
        });
        
        // Evento de desconexión
        socket.on('disconnect', function(reason) {
            console.log('Desconectado del servidor. Razón:', reason);
            
            // Mostrar notificación si existe la función
            if (typeof MAIRA.Utils.mostrarNotificacion === 'function') {
                MAIRA.Utils.mostrarNotificacion("Se perdió la conexión con el servidor: " + reason, "error", 5000);
            }
            
            // Actualizar estado de conexión en la UI si existe la función
            if (typeof MAIRA.Utils.actualizarEstadoConexion === 'function') {
                MAIRA.Utils.actualizarEstadoConexion(false);
            }
            
            // Marcar elementos como desconectados
            marcarElementosDesconectados();
        });
        
        // Evento de error
        socket.on('error', function(error) {
            console.error('Error de socket:', error);
            if (typeof MAIRA.Utils.mostrarNotificacion === 'function') {
                MAIRA.Utils.mostrarNotificacion("Error de conexión: " + error, "error");
            }
        });
        
        // Evento de reconexión exitosa
        socket.on('reconnect', function() {
            console.log('Reconectado al servidor');
            
            // Actualizar estado de conexión en la UI si existe la función
            if (typeof MAIRA.Utils.actualizarEstadoConexion === 'function') {
                MAIRA.Utils.actualizarEstadoConexion(true);
            }
            
            // Volver a anunciar nuestra presencia
            if (usuarioInfo && elementoTrabajo) {
                socket.emit('anunciarElemento', {
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: ultimaPosicion,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Solicitar elementos actualizados
            solicitarListaElementos();
            
            // Manejar reconexión del chat si existe la función
            if (MAIRA.Chat && typeof MAIRA.Chat.manejarReconexionChat === 'function') {
                MAIRA.Chat.manejarReconexionChat();
            }
        });
        
        // Configurar los eventos específicos de cada módulo
        configurarEventosSocket();
        
        return true;
    } catch (error) {
        console.error('Error crítico al conectar con el servidor:', error);
        if (typeof MAIRA.Utils.mostrarNotificacion === 'function') {
            MAIRA.Utils.mostrarNotificacion("Error al conectar con el servidor", "error");
        }
        return false;
    }
}


function obtenerURLServidor() {
        // Intentar obtener de la configuración global
        if (window.SERVER_URL) {
            return window.SERVER_URL;
        }
        
        // Obtener URL base del servidor
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        let port = window.location.port;
        
        // Si es localhost, usar puerto específico
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            port = port || '5000';
            return `${protocol}//${hostname}:${port}`;
        }
        
        // Si no hay puerto, usar el mismo protocolo y host
        if (!port) {
            return `${protocol}//${hostname}`;
        }
        
        return `${protocol}//${hostname}:${port}`;
    }

function marcarElementosDesconectados() {
    // Marcar elementos desconectados en la interfaz
    if (elementosLista) {
        elementosLista.forEach(elemento => {
            if (!elemento.conectado) {
                elemento.estado = 'desconectado';
                actualizarElementoEnInterfaz(elemento);
            }
        });
    }
}

function procesarElementosPropios() {
    console.log("Procesando elemento propio para incluirlo en la lista de elementos conectados");
    
    // Verificar que tengamos datos del usuario y elemento
    if (!usuarioInfo) {
        console.warn("No hay información de usuario para procesar");
        
        // Intentar obtener desde otras referencias
        if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.usuarioInfo) {
            usuarioInfo = window.MAIRA.GestionBatalla.usuarioInfo;
        } else if (window.usuarioInfo) {
            usuarioInfo = window.usuarioInfo;
        } else {
            return;
        }
    }
    
    if (!elementoTrabajo) {
        console.warn("No hay información de elemento de trabajo");
        
        // Intentar obtener desde otras referencias
        if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementoTrabajo) {
            elementoTrabajo = window.MAIRA.GestionBatalla.elementoTrabajo;
        } else if (window.elementoTrabajo) {
            elementoTrabajo = window.elementoTrabajo;
        } else {
            return;
        }
    }
    
    // Crear elemento propio
    const elementoPropio = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoTrabajo,
        posicion: ultimaPosicion,
        conectado: true,
        timestamp: new Date().toISOString()
    };
    
    // Añadir a la estructura global
    if (!elementosConectados) elementosConectados = {};
    
    elementosConectados[usuarioInfo.id] = {
        datos: elementoPropio,
        marcador: marcadorUsuario
    };
    
    // Asegurar que también está en la estructura de GestionBatalla
    if (window.MAIRA && window.MAIRA.GestionBatalla) {
        if (!window.MAIRA.GestionBatalla.elementosConectados) {
            window.MAIRA.GestionBatalla.elementosConectados = {};
        }
        window.MAIRA.GestionBatalla.elementosConectados[usuarioInfo.id] = elementosConectados[usuarioInfo.id];
    }
    
    // Actualizar referencia global
    window.elementosConectados = elementosConectados;
    
    // Añadir a la interfaz visual si no existe
    if (!document.querySelector(`.elemento-item[data-id="${usuarioInfo.id}"]`)) {
        agregarElementoALista(elementoPropio);
    }
    
    // Actualizar destinatarios de chat
    if (window.MAIRA && window.MAIRA.Chat && typeof window.MAIRA.Chat.actualizarListaDestinatarios === 'function') {
        window.MAIRA.Chat.actualizarListaDestinatarios();
    }
    
    console.log("Elemento propio procesado y añadido:", elementoPropio);
    return elementoPropio;
    
}


function diagnosticoElementos() {
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
    
    console.groupEnd();
    return "Diagnóstico completado - Ver consola para detalles";
}

window.diagnosticoElementos = diagnosticoElementos;

// Simplificación del cargarInfoDesdeLocalStorage para evitar redirecciones innecesarias
function cargarInfoDesdeLocalStorage() {
    try {
        const usuarioData = localStorage.getItem('gb_usuario_info');
        const elementoData = localStorage.getItem('gb_elemento_info');
        const operacionData = localStorage.getItem('gb_operacion_seleccionada');

        if (!usuarioData || !elementoData || !operacionData) {
            console.warn("Falta información necesaria en localStorage");
            return false;
        }

        try {
            usuarioInfo = JSON.parse(usuarioData);
            elementoTrabajo = JSON.parse(elementoData);
            operacionSeleccionada = JSON.parse(operacionData);

            console.log("Información cargada:", {
                usuario: usuarioInfo,
                elemento: elementoTrabajo,
                operacion: operacionSeleccionada
            });

            return true;
        } catch (parseError) {
            console.error("Error parseando datos:", parseError);
            return false;
        }
    } catch (error) {
        console.error("Error cargando información:", error);
        return false;
    }
}


window.enviarElementoAlServidor = function(elemento) {
    console.log("Procesando envío de elemento al servidor:", elemento);
    
    // Buscar el socket utilizando todas las rutas posibles
    let socket = null;
    
    // Opción 1: Socket en variables globales
    if (window.socket && window.socket.connected) {
        socket = window.socket;
    } 
    // Opción 2: Socket en MAIRA.GestionBatalla
    else if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.socket) {
        socket = window.MAIRA.GestionBatalla.socket;
    }
    // Opción 3: Socket del io global (solo como último recurso)
    else if (typeof io !== 'undefined') {
        socket = io.connect(); // Esto crea una nueva conexión
    }
    
    if (!socket) {
        console.error("No se pudo encontrar ningún socket disponible");
        
        // Como último recurso, intentar obtener el socket desde los eventos existentes
        try {
            const eventosPeriodicos = window.setInterval(function() {
                if (window.socket && window.socket.connected) {
                    console.log("Socket encontrado, reintentando envío...");
                    window.enviarElementoAlServidor(elemento);
                    clearInterval(eventosPeriodicos);
                }
            }, 1000);
            
            // Detener después de 10 segundos para no consumir recursos innecesariamente
            setTimeout(() => clearInterval(eventosPeriodicos), 10000);
        } catch (error) {
            console.error("Error al configurar reintento:", error);
        }
        
        return false;
    }
    
    try {
        // Obtener datos del usuario actual
        const idUsuarioActual = 
            elemento.options?.usuarioId || 
            elemento.options?.jugadorId || 
            window.usuarioInfo?.id || 
            (window.MAIRA?.GestionBatalla?.usuarioInfo?.id);
        
        // Obtener operación actual
        const operacionActual = 
            window.operacionActual || 
            window.MAIRA?.GestionBatalla?.operacionActual || 
            'general';
        
        // Preparar datos completos
        const datosElemento = {
            id: elemento.options.id || `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sidc: elemento.options.sidc || 'SFGPUCI-----',
            designacion: elemento.options.designacion || elemento.options.nombre || 'Elemento sin nombre',
            dependencia: elemento.options.dependencia || '',
            magnitud: elemento.options.magnitud || '-',
            coordenadas: elemento.getLatLng(),
            tipo: elemento.options.tipo || 'unidad',
            usuario: elemento.options.usuario || window.usuarioInfo?.usuario || 'Usuario',
            usuarioId: idUsuarioActual,
            jugadorId: idUsuarioActual, // Para compatibilidad
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            posicion: {
                lat: elemento.getLatLng().lat,
                lng: elemento.getLatLng().lng,
                precision: 10,
                rumbo: elemento.options.rumbo || 0,
                velocidad: 0
            },
            elemento: {
                sidc: elemento.options.sidc || 'SFGPUCI-----',
                designacion: elemento.options.designacion || elemento.options.nombre || '',
                dependencia: elemento.options.dependencia || '',
                magnitud: elemento.options.magnitud || '-'
            },
            conectado: true
        };
        
        console.log("Enviando elemento al servidor:", datosElemento);
        
        // Enviar a través de múltiples eventos para asegurar compatibilidad
        socket.emit('actualizarElemento', datosElemento);
        socket.emit('nuevoElemento', datosElemento);
        socket.emit('anunciarElemento', datosElemento);
        socket.emit('actualizarPosicionGB', datosElemento);
        
        // Actualizar estructura local de elementos conectados
        actualizarElementoConectadoLocal(datosElemento, elemento);
        
        return true;
    } catch (error) {
        console.error("Error enviando elemento:", error);
        return false;
    }
};


// Añadir este evento para guardar el estado cuando el usuario cierra/recarga la página
window.addEventListener('beforeunload', function() {
    // Guardar elementoTrabajo
    if (window.elementoTrabajo) {
        localStorage.setItem('elemento_trabajo', JSON.stringify(window.elementoTrabajo));
    }
    
    // Guardar elementosConectados
    if (window.elementosConectados) {
        try {
            const elementosParaGuardar = {};
            Object.entries(window.elementosConectados).forEach(([id, elem]) => {
                elementosParaGuardar[id] = { datos: elem.datos };
            });
            localStorage.setItem('elementos_conectados', JSON.stringify(elementosParaGuardar));
        } catch (e) {
            console.error("Error al guardar elementos en localStorage:", e);
        }
    }
});

function actualizarIconoMarcador(marcador, datos) {
    try {
        // Crear símbolo militar
        const sym = new ms.Symbol(datos.sidc, {
            size: 35,
            direction: datos.posicion?.rumbo || 0,
            uniqueDesignation: datos.designacion || datos.nombre || ''
        });
        
        // Actualizar icono
        marcador.setIcon(L.divIcon({
            className: 'elemento-militar',
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        }));
        
        // Actualizar opciones
        marcador.options.sidc = datos.sidc;
        marcador.options.designacion = datos.designacion;
        marcador.options.dependencia = datos.dependencia;
        marcador.options.magnitud = datos.magnitud;
        marcador.options.draggable = false;
        
        return true;
    } catch (e) {
        console.error("Error actualizando icono:", e);
        return false;
    }
}
/**
 * Función getSocket mejorada para acceder al socket desde cualquier parte
 */

function getSocket() {
    return window.socket;
}

// Asegúrate de que esté disponible globalmente
window.MAIRA.GestionBatalla.getSocket = getSocket;

/**
 * Verificador automático de conexión de socket
 * Añade esto al final de GB.js
 */
function iniciarVerificadorSocket() {
    console.log("Iniciando verificador automático de conexión de socket");
    
    // Intervalo para verificar y reparar conexión
    setInterval(() => {
        const _socket = getSocket();
        
        if (!_socket) {
            console.error("No se pudo obtener referencia al socket");
            return;
        }
        
        if (!_socket.connected) {
            console.warn("Socket desconectado detectado. Intentando reconectar...");
            
            if (typeof _socket.connect === 'function') {
                _socket.connect();
            }
            
            // Forzar sincronización si se reconecta
            setTimeout(() => {
                if (_socket.connected) {
                    console.log("Socket reconectado exitosamente");
                    
                    if (typeof forzarSincronizacionElementos === 'function') {
                        forzarSincronizacionElementos();
                    }
                }
            }, 1000);
        }
    }, 30000); // Cada 30 segundos
}

// Iniciar el verificador
iniciarVerificadorSocket();

// Exponer función a nivel global
window.getSocket = getSocket;



// Función auxiliar para añadir elemento visual si no existe
function añadirElementoVisual(elemento) {
    const elementoVisual = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
    if (!elementoVisual && MAIRA.Elementos && typeof MAIRA.Elementos.agregarElementoALista === 'function') {
        MAIRA.Elementos.agregarElementoALista(elemento);
    }
}

function iniciarBroadcastPeriodico(esCreador) {
    // Limpiar interval existente si lo hay
    if (window.broadcastInterval) {
        clearInterval(window.broadcastInterval);
    }
    
    // Intervalo más corto si es creador
    const intervalo = esCreador ? 5000 : 15000; // 5 segundos si es creador, 15 para los demás
    
    window.broadcastInterval = setInterval(() => {
        if (socket && socket.connected && usuarioInfo) {
            const datosBroadcast = {
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                posicion: ultimaPosicion,
                operacion: operacionActual,
                timestamp: new Date().toISOString(),
                conectado: true,
                esCreador: esCreador
            };
            
            // IMPORTANTE: Usar varios eventos para máxima compatibilidad
            socket.emit('actualizarPosicionGB', datosBroadcast);
            socket.emit('nuevoElemento', datosBroadcast);
            socket.emit('anunciarElemento', datosBroadcast);
            socket.emit('heartbeat', datosBroadcast); // Añadir evento heartbeat para compatibilidad
            
            // Si es creador, añadir otros eventos
            if (esCreador) {
                socket.emit('creadorDisponible', datosBroadcast);
                socket.emit('registrarParticipante', datosBroadcast);
            }
            
            console.log("Broadcast periódico enviado:", datosBroadcast);
        }
    }, intervalo);
    
    // Enviar inmediatamente el primer broadcast
    if (socket && socket.connected && usuarioInfo) {
        const datosBroadcast = {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            elemento: elementoTrabajo,
            posicion: ultimaPosicion,
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            conectado: true,
            esCreador: esCreador
        };
        
        socket.emit('actualizarPosicionGB', datosBroadcast);
        socket.emit('nuevoElemento', datosBroadcast);
        socket.emit('anunciarElemento', datosBroadcast);
        socket.emit('heartbeat', datosBroadcast);
        
        if (esCreador) {
            socket.emit('creadorDisponible', datosBroadcast);
            socket.emit('registrarParticipante', datosBroadcast);
        }
    }
    
    console.log(`Broadcast periódico iniciado (intervalo: ${intervalo}ms)`);
}
    /**
     * Configura los eventos específicos de Socket.io
     */
    function configurarEventosSocket() {
        if (!socket) {
            console.error("Socket no disponible para configurar eventos");
            return;
        }
    
        console.log("Configurando eventos centrales de socket para GB");
    
        // Limpiar eventos previos
        socket.off('listaElementos');
        socket.off('nuevoElemento');
        socket.off('anunciarElemento');
        socket.off('actualizarPosicionGB');
        socket.off('actualizacionPosicion');
        socket.off('elementoConectado');
        socket.off('elementoDesconectado');
        socket.off('actualizarElemento');
    
        // Añadir manejador para actualizarElemento
        socket.on('actualizarElemento', function(elemento) {
            console.log("Elemento actualizado recibido:", elemento);
            
            if (!elemento || !elemento.id) return;
            
            if (MAIRA.Elementos && typeof MAIRA.Elementos.procesarElementosRecibidos === 'function') {
                MAIRA.Elementos.procesarElementosRecibidos(elemento);
            }
        });
    
        // Evento para lista de elementos
        socket.on('listaElementos', function(elementos) {
            console.log(`Recibidos ${elementos?.length || 0} elementos del servidor:`, elementos);
            
            if (!elementos || !Array.isArray(elementos) || elementos.length === 0) {
                console.log("Lista de elementos vacía recibida");
                return;
            }
            
            // Procesar elementos recibidos
            if (MAIRA.Elementos && typeof MAIRA.Elementos.procesarElementosRecibidos === 'function') {
                MAIRA.Elementos.procesarElementosRecibidos(elementos);
            }
        });
    
        // Evento para nuevos elementos
        socket.on('nuevoElemento', function(elemento) {
            console.log("Nuevo elemento recibido:", elemento);
            
            if (!elemento || !elemento.id) return;
            
            if (MAIRA.Elementos && typeof MAIRA.Elementos.procesarElementosRecibidos === 'function') {
                MAIRA.Elementos.procesarElementosRecibidos(elemento);
            }
        });
    
        // Eventos similares para anunciarElemento
        socket.on('anunciarElemento', function(elemento) {
            console.log("Elemento anunciado recibido:", elemento);
            
            if (!elemento || !elemento.id) return;
            
            if (MAIRA.Elementos && typeof MAIRA.Elementos.procesarElementosRecibidos === 'function') {
                MAIRA.Elementos.procesarElementosRecibidos(elemento);
            }
        });
    
        socket.on('actualizarPosicionGB', function(datos) {
            if (!datos?.id || !datos?.posicion) return;
            
            console.log("🔍 POSICIÓN RECIBIDA:", datos.id, {
                lat: datos.posicion.lat,
                lng: datos.posicion.lng,
                rumbo: datos.posicion.rumbo,
                timestamp: new Date().toISOString()
            });
            
            // Actualizar en la estructura local mediante el módulo de elementos
            if (MAIRA.Elementos?.actualizarPosicionElemento) {
                MAIRA.Elementos.actualizarPosicionElemento(datos);
            } else if (elementosConectados[datos.id]) {
                // Actualización manual si el módulo no está disponible
                console.log("⚠️ Usando actualización manual (sin módulo Elementos)");
                elementosConectados[datos.id].datos.posicion = datos.posicion;
                
                if (elementosConectados[datos.id].marcador) {
                    try {
                        elementosConectados[datos.id].marcador.setLatLng([
                            datos.posicion.lat,
                            datos.posicion.lng
                        ]);
                        console.log(`✅ Posición de marcador ${datos.id} actualizada manualmente a:`, 
                                    datos.posicion.lat, datos.posicion.lng);
                    } catch (e) {
                        console.error(`❌ Error al actualizar posición manualmente:`, e);
                    }
                } else {
                    console.warn(`⚠️ Elemento ${datos.id} no tiene marcador para actualizar`);
                }
            } else {
                console.warn(`⚠️ Elemento ${datos.id} no encontrado en elementosConectados`);
            }
        });

        // Asegurar compatibilidad con otros nombres de evento
        socket.on('actualizacionPosicion', function(datos) {
            console.log("🔄 Evento actualizacionPosicion recibido:", datos.id);
            if (MAIRA.Elementos?.actualizarPosicionElemento) {
                MAIRA.Elementos.actualizarPosicionElemento(datos);
            }
        });
    
        // Delegar configuración a otros módulos
        if (MAIRA.Elementos && typeof MAIRA.Elementos.configurarEventosSocket === 'function') {
            MAIRA.Elementos.configurarEventosSocket(socket);
        }
        
        if (MAIRA.Chat && typeof MAIRA.Chat.configurarEventosSocket === 'function') {
            MAIRA.Chat.configurarEventosSocket(socket);
        }
        
        if (MAIRA.Informes && typeof MAIRA.Informes.configurarEventosSocket === 'function') {
            MAIRA.Informes.configurarEventosSocket(socket);
        }
        configurarEventoReconexion();
    }
    

    // Añadir en GB.js
function solicitarPosicionEnSegundoPlano() {
    // Verificar si la API está disponible
    if ('geolocation' in navigator && 'permissions' in navigator) {
        navigator.permissions.query({name: 'geolocation'}).then(result => {
            if (result.state === 'granted') {
                // Ya tenemos permiso, iniciar seguimiento con alta precisión
                iniciarSeguimiento();
            } else {
                // Solicitar explícitamente
                MAIRA.Utils.mostrarNotificacion(
                    "Para mejor experiencia, permite el acceso a la ubicación en segundo plano", 
                    "info", 
                    10000
                );
            }
        });
    }
}

// Añadir en GB.js
let colaPosiciones = [];
let enviandoPosiciones = false;

function encolarPosicion(posicion) {
    colaPosiciones.push(posicion);
    
    // Si no hay proceso de envío activo, iniciar uno
    if (!enviandoPosiciones) {
        procesarColaPosiciones();
    }
}

function procesarColaPosiciones() {
    enviandoPosiciones = true;
    
    // Si no hay posiciones o no hay conexión, terminar
    if (colaPosiciones.length === 0 || !socket?.connected) {
        enviandoPosiciones = false;
        return;
    }
    
    // Tomar la última posición (más reciente)
    const posicionAEnviar = colaPosiciones.pop();
    
    // Limpiar cola (solo enviar la más reciente)
    colaPosiciones = [];
    
    // Enviar al servidor
    socket.emit('actualizarPosicionGB', posicionAEnviar);
    
    // Programar siguiente verificación
    setTimeout(procesarColaPosiciones, 2000);
}

// Función para unificar las actualizaciones visuales
function actualizarVisualizacionElemento(elemento) {
    // 1. Actualizar marcador en el mapa
    if (elemento.posicion) {
        const elementoExistente = window.elementosConectados[elemento.id];
        
        if (elementoExistente && elementoExistente.marcador) {
            // Actualizar marcador existente
            elementoExistente.marcador.setLatLng([elemento.posicion.lat, elemento.posicion.lng]);
            
            // Actualizar icono si es necesario
            if (elemento.sidc && elementoExistente.marcador.options.sidc !== elemento.sidc) {
                actualizarIconoMarcador(elementoExistente.marcador, elemento);
            }
        } else {
            // Crear nuevo marcador
            crearMarcadorElemento(elemento);
        }
    }
    
    // 2. Actualizar/crear elemento en la lista visual
    const elementoExistenteEnLista = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
    if (elementoExistenteEnLista) {
        // Actualizar elemento existente
        actualizarElementoEnLista(elemento);
    } else {
        // Agregar nuevo elemento
        agregarElementoALista(elemento);
    }
}



// Modificacion en window.agregarMarcador para asignar correctamente el propietario
window.agregarMarcadorGB = function(sidc, nombre, callback) {
    console.log("Agregando marcador GB con SIDC:", sidc, "Nombre:", nombre);
    
    // Si no hay mapa, no podemos hacer nada
    if (!window.mapa) {
        console.error("No hay mapa disponible para agregar marcador");
        return;
    }
    
    // Usar la función global tradicional
    window.agregarMarcador(sidc, nombre, function(marcador) {
        // Callback cuando se crea el marcador
        if (marcador) {
            // Añadir propiedades adicionales específicas de GB
            marcador.options.usuario = usuarioInfo?.usuario || 'Usuario';
            marcador.options.usuarioId = usuarioInfo?.id || '';
            marcador.options.jugador = usuarioInfo?.id || '';  // Asegurarse de asignar el propietario
            marcador.options.jugadorId = usuarioInfo?.id || ''; // Redundancia para compatibilidad
            marcador.options.operacion = operacionActual;
            marcador.options.timestamp = new Date().toISOString();
            
            // Generar ID único si no tiene
            if (!marcador.options.id) {
                marcador.options.id = `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Notificar a otros usuarios si estamos conectados
            if (socket && socket.connected) {
                const elementoData = {
                    id: marcador.options.id,
                    sidc: marcador.options.sidc,
                    nombre: marcador.options.nombre,
                    posicion: marcador.getLatLng(),
                    designacion: marcador.options.designacion || '',
                    dependencia: marcador.options.dependencia || '',
                    magnitud: marcador.options.magnitud || '-',
                    estado: marcador.options.estado || 'operativo',
                    usuario: usuarioInfo?.usuario || 'Usuario',
                    usuarioId: usuarioInfo?.id || '',
                    jugador: usuarioInfo?.id || '',  // Importante: asignar propietario
                    jugadorId: usuarioInfo?.id || '',
                    operacion: operacionActual,
                    timestamp: new Date().toISOString()
                };
                
                // Enviar múltiples eventos para mejor compatibilidad
                socket.emit('nuevoElemento', elementoData);
                socket.emit('anunciarElemento', elementoData);
                
                // También almacenar localmente
                if (window.MAIRA?.GestionBatalla?.actualizarElementoConectado) {
                    window.MAIRA.GestionBatalla.actualizarElementoConectadoLocal(
                        elementoData.id, 
                        elementoData, 
                        elementoData.posicion
                    );
                } else if (window.elementosConectados) {
                    window.elementosConectados[elementoData.id] = {
                        datos: elementoData,
                        marcador: marcador
                    };
                }
            }
            
            // Si hay callback, ejecutarlo
            if (typeof callback === 'function') {
                callback(marcador);
            }
        }
    });
};
    
    
    /**
     * Guarda el estado actual de la sesión
     */
    function guardarEstadoActual() {
        console.log("Guardando estado actual antes de salir");
        
        if (operacionActual) {
            localStorage.setItem('ultima_operacion', operacionActual);
        }
        
        if (ultimaPosicion) {
            localStorage.setItem('ultima_posicion', JSON.stringify(ultimaPosicion));
        }
        
        if (panelVisible !== undefined) {
            localStorage.setItem('panelVisible', panelVisible ? 'true' : 'false');
        }
        
        if (seguimientoActivo !== undefined) {
            localStorage.setItem('seguimiento_activo', seguimientoActivo ? 'true' : 'false');
        }
        
        // Guardar estados de UI
        localStorage.setItem('gb_estados_ui', JSON.stringify(estadosUI));
    }
    /**
     * Restaura estado guardado de la sesión
     */
    function restaurarEstadoGuardado() {
        console.log("Restaurando estado guardado");
        
        // Restaurar panel visible
        if (localStorage.getItem('panelVisible') === 'true') {
            setTimeout(() => togglePanel(true), 1000);
        }
        
        // Restaurar seguimiento activo
        if (localStorage.getItem('seguimiento_activo') === 'true') {
            setTimeout(() => iniciarSeguimiento(), 2000);
        }
        
        // Restaurar estados de UI
        try {
            const estadosGuardados = localStorage.getItem('gb_estados_ui');
            if (estadosGuardados) {
                const estados = JSON.parse(estadosGuardados);
                estadosUI = { ...estadosUI, ...estados };
                
                // Aplicar estados restaurados
                if (estadosUI.tabActiva) {
                    setTimeout(() => cambiarTab(estadosUI.tabActiva), 1500);
                }
            }
        } catch (e) {
            console.warn("Error al restaurar estados de UI:", e);
        }
    }
    
    /**
     * Centra el mapa en la posición actual
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
                    obtenerPosicionInicial();
                }
            } catch (error) {
                console.error("Error al centrar en posición:", error);
                if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
                    MAIRA.Chat.agregarMensajeChat("Sistema", "No se pudo obtener tu posición actual", "sistema");
                }
                MAIRA.Utils.mostrarNotificacion("No se pudo centrar en tu posición", "error");
            }
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
                    if (MAIRA.Elementos && MAIRA.Elementos.crearMarcadorElemento) {
                        MAIRA.Elementos.crearMarcadorElemento(elem.datos);
                        if (elem.marcador) {
                            grupo.addLayer(elem.marcador);
                            elementosAñadidos++;
                        }
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
            if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
                MAIRA.Chat.agregarMensajeChat("Sistema", "No hay elementos para mostrar en el mapa", "sistema");
            }
            MAIRA.Utils.mostrarNotificacion("No hay elementos para mostrar", "info");
        }
    }
    
    // Inicialización al cargar el documento
    document.addEventListener('DOMContentLoaded', inicializar);

    function diagnosticoSistema() {
        console.group("=== DIAGNÓSTICO DEL SISTEMA ===");
        
        // 1. Estructura de elementos conectados
        console.log("Elementos conectados:", Object.keys(elementosConectados).length);
        Object.entries(elementosConectados).forEach(([id, elem]) => {
            console.group(`Elemento ID: ${id}`);
            console.log("Datos:", elem.datos);
            console.log("Tiene marcador:", !!elem.marcador);
            console.log("Tiene posición:", !!(elem.datos && elem.datos.posicion && elem.datos.posicion.lat));
            console.groupEnd();
        });
        
        // 2. Elementos en el DOM
        const elementosVisuales = document.querySelectorAll('.elemento-item');
        console.log(`Elementos en DOM: ${elementosVisuales.length}`);
        elementosVisuales.forEach(elem => {
            const id = elem.getAttribute('data-id');
            console.log(`- Elemento visual: ${id}, existe en datos: ${!!elementosConectados[id]}`);
        });
        
        // 3. Destinatarios en chat
        const selectDestinatario = document.getElementById('select-destinatario');
        if (selectDestinatario) {
            console.log(`Opciones de destinatarios: ${selectDestinatario.options.length}`);
            for (let i = 0; i < selectDestinatario.options.length; i++) {
                console.log(`- Opción ${i}: ${selectDestinatario.options[i].value}: ${selectDestinatario.options[i].text}`);
            }
        }
        
        // 4. Estado de la conexión
        if (socket) {
            console.log("Socket conectado:", socket.connected);
            console.log("Socket id:", socket.id);
        }
        
        console.groupEnd();
        return "Diagnóstico completado. Ver consola para detalles.";
    }
    
    // Exponer para uso desde la consola
    window.diagnosticoSistema = diagnosticoSistema;

    function actualizarElementoModificado(elementoId, nuevosDatos) {
        console.log(`Actualizando elemento modificado: ${elementoId}`);
        
        // Verificar que el elemento exista
        if (!elementosConectados[elementoId]) {
            console.warn(`No se encontró el elemento ${elementoId} para actualizar`);
            return false;
        }
        
        // Preservar el marcador y actualizar datos
        const marcadorExistente = elementosConectados[elementoId].marcador;
        
        // Actualizar datos del elemento
        elementosConectados[elementoId].datos = {
            ...elementosConectados[elementoId].datos,
            ...nuevosDatos
        };
        
        // Actualizar marcador si existe
        if (marcadorExistente) {
            // Actualizar icono si cambió el SIDC
            if (nuevosDatos.sidc && typeof ms !== 'undefined') {
                try {
                    // Crear etiqueta
                    let etiqueta = "";
                    if (nuevosDatos.designacion) {
                        etiqueta = nuevosDatos.designacion;
                        if (nuevosDatos.dependencia) {
                            etiqueta += "/" + nuevosDatos.dependencia;
                        }
                    }
                    
                    // Crear nuevo símbolo
                    const sym = new ms.Symbol(nuevosDatos.sidc, {
                        size: 35,
                        uniqueDesignation: etiqueta
                    });
                    
                    // Actualizar icono del marcador
                    marcadorExistente.setIcon(L.divIcon({
                        className: 'elemento-militar',
                        html: sym.asSVG(),
                        iconSize: [70, 50],
                        iconAnchor: [35, 25]
                    }));
                    
                    // Actualizar opciones del marcador
                    marcadorExistente.options.sidc = nuevosDatos.sidc;
                    marcadorExistente.options.nombre = nuevosDatos.nombre || etiqueta;
                    marcadorExistente.options.designacion = nuevosDatos.designacion || '';
                    marcadorExistente.options.dependencia = nuevosDatos.dependencia || '';
                    marcadorExistente.options.magnitud = nuevosDatos.magnitud || '-';
                    
                    console.log(`Marcador actualizado con nuevo SIDC: ${nuevosDatos.sidc}`);
                } catch (e) {
                    console.error("Error al actualizar símbolo del marcador:", e);
                }
            }
        }
        
        // Actualizar referencia en MAIRA.GestionBatalla
        if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
            window.MAIRA.GestionBatalla.elementosConectados[elementoId] = elementosConectados[elementoId];
        }
        
        // Actualizar elemento visual en la lista
        if (MAIRA.Elementos && typeof MAIRA.Elementos.actualizarElementoVisual === 'function') {
            MAIRA.Elementos.actualizarElementoVisual(elementoId);
        }
        
        // Enviar actualización al servidor si estamos conectados
        if (socket && socket.connected) {
            // Preparar datos para enviar
            const datosActualizados = {
                ...elementosConectados[elementoId].datos,
                timestamp: new Date().toISOString()
            };
            
            // Enviar a través de múltiples eventos para mejor compatibilidad
            socket.emit('actualizarElemento', datosActualizados);
            socket.emit('nuevoElemento', datosActualizados);
            socket.emit('anunciarElemento', datosActualizados);
            
            console.log("Datos del elemento enviados al servidor:", datosActualizados);
            return true;
        } else {
            console.warn("No se pudieron enviar datos actualizados: sin conexión");
            return false;
        }
    }

    function iniciarEnvioPeriodico() {
        // Limpiar intervalo existente si hay
        if (window.envioPosicionInterval) {
            clearInterval(window.envioPosicionInterval);
        }
        
        // Iniciar envío periódico de posición y heartbeat
        window.envioPosicionInterval = setInterval(() => {
            if (socket && socket.connected && usuarioInfo) {
                // Crear paquete de datos completo
                const datos = {
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: ultimaPosicion,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString(),
                    conectado: true
                };
                
                // Enviar por múltiples canales para máxima compatibilidad
                socket.emit('actualizarPosicionGB', datos);
                socket.emit('actualizacionPosicion', datos);
                socket.emit('anunciarElemento', datos);
                socket.emit('heartbeat', datos);
                
                console.log("Datos periódicos enviados al servidor");
            }
        }, 10000); // Cada 10 segundos
        
        // Enviar inmediatamente la primera vez
        if (socket && socket.connected && usuarioInfo) {
            enviarPosicionActual();
        }
        
        return true;
    }

    // Propuesta de función unificada en GB.js
    function guardarDatosLocalmente(tipoElemento, elementoId, datos) {
        if (!elementoId || !datos) return false;
        
        try {
            // Determinar clave según tipo
            const clave = tipoElemento === 'elemento' 
                ? `elementos_conectados_${operacionActual}` 
                : tipoElemento;
            
            // Cargar datos actuales
            let datosGuardados = {};
            const datosExistentes = localStorage.getItem(clave);
            if (datosExistentes) {
                datosGuardados = JSON.parse(datosExistentes);
            }
            
            // Actualizar elemento específico
            datosGuardados[elementoId] = datos;
            
            // Guardar de vuelta
            localStorage.setItem(clave, JSON.stringify(datosGuardados));
            console.log(`Datos de ${tipoElemento} guardados localmente para ${elementoId}`);
            return true;
        } catch (e) {
            console.error(`Error al guardar ${tipoElemento} localmente:`, e);
            return false;
        }
    }

    function configurarEventosMiRadialGB() {
        if (!window.MiRadial) {
            console.warn('MiRadial no disponible');
            return;
        }
    
        // Indicar que estamos en modo GB
        window.MAIRA = window.MAIRA || {};
        window.MAIRA.modoGB = true;
    
        // Establecer la fase correcta en MiRadial
        window.MiRadial.faseJuego = 'gb';
    
        // Asegurar la disponibilidad global de la función buscarElementoEnPosicion
        window.buscarElementoEnPosicion = function(latlng) {
            console.log("Buscando elemento en posición:", latlng);
            
            if (!window.mapa) {
                console.error("Mapa no disponible para buscar elementos");
                return null;
            }
            
            let elementoEncontrado = null;
            let distanciaMinima = Infinity;
            const puntoClick = window.mapa.latLngToContainerPoint(latlng);
            const radioDeteccion = 80; // Aumentado a 80 píxeles para ser más permisivo
            
            // Primero buscar en elementos conectados
            Object.values(window.elementosConectados || {}).forEach(elemento => {
                if (elemento.marcador) {
                    try {
                        const pos = elemento.marcador.getLatLng();
                        const puntoMarcador = window.mapa.latLngToContainerPoint(pos);
                        const distancia = puntoClick.distanceTo(puntoMarcador);
                        
                        console.log(`Distancia a elemento ${elemento.datos?.id}: ${distancia}px`);
                        
                        if (distancia < radioDeteccion && distancia < distanciaMinima) {
                            elementoEncontrado = elemento.marcador;
                            distanciaMinima = distancia;
                        }
                    } catch (e) {
                        console.error("Error al calcular distancia para elemento:", e);
                    }
                }
            });
            
            // Si no se encontró nada, buscar en todas las capas del mapa
            if (!elementoEncontrado) {
                window.mapa.eachLayer(function(layer) {
                    if (layer instanceof L.Marker && layer.options.isElementoMilitar) {
                        try {
                            const pos = layer.getLatLng();
                            const puntoMarcador = window.mapa.latLngToContainerPoint(pos);
                            const distancia = puntoClick.distanceTo(puntoMarcador);
                            
                            console.log(`Distancia a capa ${layer.options?.id}: ${distancia}px`);
                            
                            if (distancia < radioDeteccion && distancia < distanciaMinima) {
                                elementoEncontrado = layer;
                                distanciaMinima = distancia;
                            }
                        } catch (e) {
                            console.error("Error al procesar capa en mapa:", e);
                        }
                    }
                });
            }
            
            console.log(`Elemento encontrado: ${elementoEncontrado?.options?.id || null}, distancia: ${distanciaMinima}px`);
            return elementoEncontrado;
        };
    
        // Prevenir menú contextual del sistema en el mapa
        window.mapa.getContainer().addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
    
            // Convertir coordenadas del evento a coordenadas geográficas
            const containerPoint = L.point(e.clientX, e.clientY).subtract(
                L.DomUtil.getPosition(window.mapa.getContainer())
            );
            const latlng = window.mapa.containerPointToLatLng(containerPoint);
            
            console.log("Click derecho en posición:", latlng);
            
            // Buscar elemento en la posición usando la función global
            let elemento = window.buscarElementoEnPosicion(latlng);
            
            if (elemento) {
                // Si hay un elemento, seleccionarlo y mostrar menú de elemento
                console.log("Elemento encontrado, mostrando menú de elemento:", elemento);
                
                // CRÍTICO: Asignar ambas referencias
                window.elementoSeleccionadoGB = elemento;
                window.elementoSeleccionado = elemento;
                
                // Mostrar menú
                window.MiRadial.mostrarMenu(e.pageX, e.pageY, 'elemento', elemento);
            } else {
                // Si no hay elemento, mostrar menú de mapa
                console.log("No se encontró elemento, mostrando menú de mapa");
                window.MiRadial.mostrarMenu(e.pageX, e.pageY, 'mapa');
            }
        });
    }

    window.marcarElementosDesconectados = marcarElementosDesconectados;

    // Exponer globalmente
    window.actualizarElementoModificado = actualizarElementoModificado;

    // API pública del módulo
    return {
        inicializar,
        // acceso al sistema de tracking
        iniciarTracking: function() {
            if (typeof iniciarTrackingElementos === 'function') {
                iniciarTrackingElementos();
            }
        },
        detenerTracking: function() {
            if (typeof detenerTrackingElementos === 'function') {
                detenerTrackingElementos();
            }
        },
        toggleTracking: function() {
            if (typeof toggleTracking === 'function') {
                toggleTracking();
            }
        },
        togglePanel,
        iniciarSeguimiento,
        detenerSeguimiento,
        toggleSeguimiento,
        centrarEnPosicion,
        mostrarTodosElementos,
        actualizarMarcadorUsuario,
        marcarElementosDesconectados,
        actualizarMarcadorUsuario,
        
        cambiarTab,
        
        manejarEstadoConexion,
        manejarReconexion,
        manejarDesconexion,
        configurarEventosSocket,
        // Añadir esta función
        actualizarElementoModificado,
        // Importante: exponer elementosConectados
        elementosConectados: elementosConectados
    };

})();

// Conectar con agregarMarcador global para mantener compatibilidad
window.agregarMarcadorGB = MAIRA.GestionBatalla.agregarMarcadorGB;
// Exponer funciones globalmente

// Exponer togglePanel a nivel global para que los botones del HTML puedan acceder a él
window.togglePanel = function(forzarEstado) {
    MAIRA.GestionBatalla.togglePanel(forzarEstado);
};

// Exponer cambiarTab a nivel global para los botones de pestañas
window.cambiarTab = function(tabId) {
    MAIRA.GestionBatalla.cambiarTab(tabId);
};

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


// Añadir a GB.js
function salirDeOperacionGB() {
    console.log("Iniciando proceso de salida de operación GB");
    
    // Obtener información de la operación actual
    const operacionActual = localStorage.getItem('gb_operacion_seleccionada');
    if (!operacionActual) {
        console.warn("No hay operación activa de la cual salir");
        return false;
    }
    
    try {
        const datosOperacion = JSON.parse(operacionActual);
        const nombreOperacion = datosOperacion.nombre;
        
        // 1. Notificar al servidor de la desconexión
        if (socket && socket.connected) {
            const userId = usuarioInfo?.id;
            if (userId) {
                socket.emit('salirOperacionGB', {
                    operacion: nombreOperacion,
                    usuario: userId,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`📤 Notificación de salida enviada para operación ${nombreOperacion}`);
            }
        }
        
        // 2. Limpiar datos de localStorage
        limpiarLocalStorageOperacion(nombreOperacion);
        
        // 3. Redirigir al usuario a la página de inicio
        window.location.href = '/Client/inicioGB.html';
        
        return true;
    } catch (e) {
        console.error(`Error al salir de operación: ${e}`);
        
        // En caso de error, intentar limpiar datos de todas formas
        limpiarDatosHuerfanos();
        
        // Redirigir al usuario a la página de inicio
        window.location.href = '/Client/inicioGB.html';
        
        return false;
    }
}

// Implementar el método a nivel global
window.salirDeOperacionGB = salirDeOperacionGB;

// Añadir a GB.js o a elementosGB.js
function limpiarLocalStorageOperacion(nombreOperacion) {
    console.log(`🧹 Limpiando localStorage para operación: ${nombreOperacion}`);
    
    try {
        // Eliminar específicamente los datos de esta operación
        localStorage.removeItem(`elementos_conectados_${nombreOperacion}`);
        
        // Verificar si es la operación actual para limpiar datos relacionados
        const operacionActual = localStorage.getItem('gb_operacion_seleccionada');
        if (operacionActual) {
            try {
                const datosOperacion = JSON.parse(operacionActual);
                if (datosOperacion.nombre === nombreOperacion) {
                    // Limpiar datos de la operación actual
                    localStorage.removeItem('gb_operacion_seleccionada');
                    
                    // No eliminar elemento_trabajo para mantener consistencia de identidad
                    // pero sí marcar que ya no estamos en una operación
                    localStorage.setItem('en_operacion_gb', 'false');
                    
                    console.log(`✅ Datos de operación actual ${nombreOperacion} eliminados`);
                }
            } catch (e) {
                console.warn(`Error al verificar operación actual: ${e}`);
            }
        }
        
        // También limpiar datos de tracking si existieran
        localStorage.removeItem(`tracking_${nombreOperacion}`);
        
        console.log(`✅ Limpieza de localStorage completada para ${nombreOperacion}`);
        return true;
    } catch (e) {
        console.error(`❌ Error al limpiar localStorage para operación ${nombreOperacion}: ${e}`);
        return false;
    }
}

// Agregar o reemplazar en GB.js
window.editarelementoSeleccionadoGB = function() {
    console.log("Editando elemento seleccionado:", window.elementoSeleccionadoGB || window.elementoSeleccionado);
    
    // Asegurar que tenemos una referencia al elemento
    const elemento = window.elementoSeleccionadoGB || window.elementoSeleccionado;
    if (!elemento) {
        console.error("No hay elemento seleccionado para editar");
        return;
    }
    
    // Determinar qué tipo de elemento es y qué panel mostrar
    if (elemento instanceof L.Marker) {
        console.log("Editando marcador:", elemento);
        if (elemento.options && elemento.options.sidc) {
            if (window.esUnidad && window.esUnidad(elemento.options.sidc)) {
                console.log("Mostrando panel de edición de unidad");
                window.mostrarPanelEdicionUnidad(elemento);
            } else if (window.esEquipo && window.esEquipo(elemento.options.sidc)) {
                console.log("Mostrando panel de edición de equipo");
                window.mostrarPanelEdicionEquipo(elemento);
            } else {
                console.log("Mostrando panel de edición MCC para elemento");
                if (window.mostrarPanelEdicionMCC) {
                    window.mostrarPanelEdicionMCC(elemento, 'elemento');
                }
            }
        } else {
            console.log("Marcador sin SIDC, mostrando panel genérico");
            if (window.mostrarPanelEdicionMCC) {
                window.mostrarPanelEdicionMCC(elemento, 'elemento');
            }
        }
    } else if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        console.log("Editando línea/polígono");
        if (window.mostrarPanelEdicionMCC && window.determinarTipoMCC) {
            window.mostrarPanelEdicionMCC(elemento, window.determinarTipoMCC(elemento));
        }
    } else if (elemento instanceof L.Path) {
        console.log("Editando path");
        if (window.mostrarPanelEdicionLinea) {
            window.mostrarPanelEdicionLinea(elemento);
        }
    } else {
        console.error("Tipo de elemento no reconocido:", elemento);
    }
};
