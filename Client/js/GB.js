/**
 * gestionBatalla.js
 * Core module for battle management in MAIRA
 * @version 2.0.0
 */

// Namespace principal para evitar conflictos
window.MAIRA.GestionBatalla = window.MAIRA.GestionBatalla || {};

    // Variables privadas del módulo
    let marcadorUsuario = null;
    let seguimientoActivo = false;
    let watchId = null;
    let usuarioInfo = null;
    let elementoTrabajo = null;
    let panelVisible = true;
    let elementosConectados = {};
    let listaElementos = null;
    // CORRECCIÓN: Declarar posicionActual con un valor por defecto
    let posicionActual = {
        lat: -34.6037, // Buenos Aires como posición predeterminada
        lng: -58.3816,
        precision: 1000,
        rumbo: 0,
        timestamp: new Date()
    };
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

    let socket = null;

    

function inicializar() {
    console.log("Inicializando modo Gestión de Batalla v2.0.0");
    
    // 1. Verificar modo correcto
    const esModoGestionBatalla = window.location.pathname.includes('gestionbatalla.html');
    if (!esModoGestionBatalla) {
        console.warn("No estamos en modo Gestión de Batalla");
        return;
    }
    
    // 2. Inicialización básica
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.modoGB = true;
    window.MAIRA.GestionBatalla = window.MAIRA.GestionBatalla || {};
        
    // 3. Cargar operación DESDE URL (prioritario)
    if (!cargarOperacionDesdeURL()) {
        console.warn("No se pudo cargar información de la operación");
        redirigirASalaEspera();
        return;
    }
    
    // 4. Mostrar carga mientras se inicializa
    mostrarCargando(true, 10, "Cargando información...");

    // 5. Cargar datos del usuario y elemento
    if (!cargarInfoDesdeLocalStorage()) {
        console.warn("No se pudo cargar información del usuario o elemento");
        redirigirASalaEspera();
        return;
    }
    
    try {
        // CORRECCIÓN: Asegurar que posicionActual existe antes de usarlo
        
            posicionActual = {
                lat: -34.6037, // Buenos Aires como ejemplo
                lng: -58.3816,
                precision: 1000,
                rumbo: 0,
                timestamp: new Date()
            };
            window.posicionActual = posicionActual;
            console.log("Inicializada posición predeterminada");
        
        
        // 6. Inicializar estructura central de elementos
        inicializarEstructuraElementos();
        
        // 7. Inicializar componentes de interfaz
        inicializarInterfaz();
        inicializarPestañas();
        // 8. Establecer conexión con servidor y DB
        mostrarCargando(true, 50, "Conectando al servidor...");
        conectarAlServidor();
        
        // 9. Inicializar mapa cuando la conexión esté establecida
        mostrarCargando(true, 70, "Cargando mapa...");
        if (!window.mapa) {
            window.inicializarMapa();
        }
        
        // 10. Configurar eventos
        configurarEventosSocket();
        
        // 11. Obtener posición inicial
        mostrarCargando(true, 90, "Obteniendo posición...");
        obtenerPosicionInicial();
        
        // 12. Finalizar carga
        mostrarCargando(false);
        document.getElementById('main-content').style.display = 'block';
        
        // 13. Iniciar sistemas de tracking y comunicación
        // CORRECCIÓN: Verificar que la función existe antes de llamarla
        if (typeof inicializarSistemaTracking === 'function') {
            inicializarSistemaTracking();
        } else {
            console.warn("Función inicializarSistemaTracking no disponible, se inicializa localmente");
            inicializarSistemaTracking(); // Usa nuestra implementación local
        }
        
        iniciarEnvioPeriodico();
        inicializarPanelLateral();
        configurarEventosMiRadialGB();
        
        crearMarcadorElementoPropio();
        enviarBroadcastPeriodico();
        actualizarListaElementos();
        console.log("Inicialización de Gestión de Batalla completada");
    } catch (error) {
        console.error("Error durante la inicialización:", error);
        mostrarCargando(false);
        document.getElementById('main-content').style.display = 'block';
    }
    
    return true;
}


/**
 * Crea un marcador para el elemento propio
 */
function crearMarcadorElementoPropio() {
    if (!usuarioInfo || !elementoTrabajo || !posicionActual) {
        console.warn("No hay suficiente información para crear marcador propio");
        return null;
    }
    
    if (!elementosConectados[usuarioInfo.id]) {
        console.warn("No hay datos de elemento propio en elementosConectados");
        return null;
    }
    
    // Combinar datos para crear marcador
    const datos = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        sidc: elementoTrabajo.sidc,
        designacion: elementoTrabajo.designacion,
        dependencia: elementoTrabajo.dependencia,
        magnitud: elementoTrabajo.magnitud,
        elemento: elementoTrabajo,
        posicion: posicionActual,
        conectado: true
    };
    
    // Crear marcador usando función existente
    const marcador = crearMarcadorElemento(datos);
    
    // Guardar referencia en elementosConectados
    if (marcador) {
        elementosConectados[usuarioInfo.id].marcador = marcador;
        console.log("Marcador propio creado correctamente");
    }
    
    return marcador;
}

    
function enviarBroadcastPeriodico() {
    if (!socket?.connected || !usuarioInfo?.id) return;

    const datos = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoTrabajo,
        posicion: posicionActual,
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
    const TIEMPO_LIMPIEZA = 30 * 60 * 100; // 30 minutos
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
     * Inicializa los eventos de click para las pestañas
     */
    function inicializarPestañas() {
        // Configure event listeners for tab buttons
        const botonesPestañas = document.querySelectorAll('.tab-btn');
        botonesPestañas.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                if (tabId) {
                    cambiarTab(tabId);
                }
            });
        });
        
        console.log("Tabs initialized:", botonesPestañas.length);
        
        // Activate default tab or saved one
        const tabGuardada = localStorage.getItem('gb_tab_activa');
        if (tabGuardada && document.getElementById(tabGuardada)) {
            cambiarTab(tabGuardada);
        } else {
            cambiarTab('tab-elementos'); // Default tab
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
    
    
    function cambiarTab(tabId) {
        console.log(`Cambiando a pestaña: ${tabId}`);
        
        // Hide all tabs
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // Deactivate all buttons
        const botones = document.querySelectorAll('.tab-btn');
        botones.forEach(btn => btn.classList.remove('active'));
        
        // Activate the requested tab
        const tabSeleccionado = document.getElementById(tabId);
        const btnSeleccionado = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        
        if (tabSeleccionado) {
            tabSeleccionado.classList.add('active');
            console.log(`Tab content activated: ${tabId}`);
        } else {
            console.error(`Tab with ID: ${tabId} not found`);
        }
        
        if (btnSeleccionado) {
            btnSeleccionado.classList.add('active');
            console.log(`Tab button activated: ${tabId}`);
        } else {
            console.error(`Button for tab: ${tabId} not found`);
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
        const posicionActualGuardada = localStorage.getItem('ultima_posicion');
        
        if (posicionActualGuardada) {
            try {
                const posicion = JSON.parse(posicionActualGuardada);
                posicionActual = posicion;
                
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
        
        posicionActual = posicionPredeterminada;
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
    
    
    




function obtenerSERVER_URL() {
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

window.obtenerSERVER_URL = obtenerSERVER_URL;


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
        posicion: posicionActual,
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
 * Conecta al servidor utilizando Socket.IO
 * 
 * @param {string} SERVER_URL - URL del servidor Socket.IO
 * @returns {Promise} - Promesa que se resuelve cuando la conexión sea exitosa
 */
function conectarAlServidor() {
    return new Promise((resolve, reject) => {
        try {
            if (!operacionActual) {
                console.error('No hay operación disponible para conectarse');
                reject(new Error('No hay operación disponible'));
                return;
            }

            console.log(`Conectando al servidor: ${SERVER_URL}`);
            console.log('Estado actual:', {
                usuarioId: usuarioInfo ? usuarioInfo.id : 'sin ID',
                operacion: operacionActual,
                elemento: elementoTrabajo ? elementoTrabajo.designacion : 'sin elemento'
            });

            // Cerrar socket anterior si existe
            if (socket && socket.connected) {
                socket.disconnect();
            }

            // Crear nuevo socket con configuración apropiada
            socket = io(SERVER_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 10,
                query: {
                    usuarioId: usuarioInfo ? usuarioInfo.id : 'visitante',
                    operacion: operacionActual,
                    elemento: elementoTrabajo ? elementoTrabajo.id : 'sin_elemento'
                }
            });

            // Evento connect - Cuando se establece la conexión
            socket.on('connect', () => {
                console.log('📡 Conectado al servidor. Socket ID:', socket.id);
                actualizarEstadoConexion(true);
                
                // Unirse a la sala de operación
                socket.emit('unirseOperacion', {
                    operacion: operacionActual,
                    usuarioId: usuarioInfo ? usuarioInfo.id : 'visitante',
                    usuario: usuarioInfo ? usuarioInfo.usuario : 'Visitante',
                    elemento: elementoTrabajo || { designacion: 'Sin elemento asignado' }
                });

                // Registrar elemento si tenemos uno asociado
                if (elementoTrabajo && usuarioInfo) {
                    socket.emit('registrarElemento', {
                        id: usuarioInfo.id,
                        usuario: usuarioInfo.usuario,
                        elemento: elementoTrabajo,
                        sidc: elementoTrabajo.sidc || 'SFGPEVC-------',
                        designacion: elementoTrabajo.designacion || 'Sin designación',
                        dependencia: elementoTrabajo.dependencia || '',
                        magnitud: elementoTrabajo.magnitud || 'equipo',
                        posicion: posicionActual,
                        operacion: operacionActual,
                        timestamp: new Date().toISOString(),
                        conectado: true
                    });
                }

                // Solicitar lista de elementos actuales
                socket.emit('solicitarElementos', { operacion: operacionActual });
                
                window.socket = socket; // Compartir referencia en scope global
                
                resolve(socket);
            });

            // Evento connect_error - Error al conectar
            socket.on('connect_error', (error) => {
                console.error('Error de conexión:', error);
                actualizarEstadoConexion(false);
                reject(error);
            });

            // Evento disconnect - Cuando se pierde la conexión
            socket.on('disconnect', (reason) => {
                console.warn('Socket desconectado:', reason);
                actualizarEstadoConexion(false);
                marcarElementosDesconectados();
            });

            // Evento reconnect - Cuando se recupera la conexión
            socket.on('reconnect', (attemptNumber) => {
                console.log('Reconexión exitosa después de', attemptNumber, 'intentos');
                actualizarEstadoConexion(true);
                
                // Unirse nuevamente a la sala y pedir datos
                socket.emit('unirseOperacion', {
                    operacion: operacionActual,
                    usuarioId: usuarioInfo ? usuarioInfo.id : 'visitante',
                    usuario: usuarioInfo ? usuarioInfo.usuario : 'Visitante',
                    elemento: elementoTrabajo
                });
                
                // Solicitar todo de nuevo
                socket.emit('solicitarElementos', { operacion: operacionActual });
                
                // Enviar posición actualizada
                if (elementoTrabajo && usuarioInfo && posicionActual) {
                    socket.emit('actualizarPosicion', {
                        id: usuarioInfo.id,
                        posicion: posicionActual,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            // Configurar los demás eventos después de la conexión
            configurarEventosSocket();

        } catch (error) {
            console.error('Error al crear conexión:', error);
            actualizarEstadoConexion(false);
            reject(error);
        }
    });
}

// AGREGAR/REEMPLAZAR EN GB.js - Función actualizarEstadoConexion
// ==============================================================

/**
 * Actualiza la interfaz para reflejar el estado de conexión
 * @param {boolean} estaConectado - Estado de la conexión
 */
function actualizarEstadoConexion(estaConectado) {
    // Actualizar variable de estado
    window.estaConectado = estaConectado;
    
    // Actualizar indicador visual si existe
    const indicadorConexion = document.getElementById('indicador-conexion');
    if (indicadorConexion) {
        indicadorConexion.className = estaConectado ? 'conectado' : 'desconectado';
        indicadorConexion.innerHTML = estaConectado 
            ? '<i class="fas fa-wifi"></i> Conectado' 
            : '<i class="fas fa-exclamation-triangle"></i> Desconectado';
    }
    
    // Actualizar botones que dependen de la conexión
    const botonesConexion = document.querySelectorAll('.requiere-conexion');
    botonesConexion.forEach(boton => {
        boton.disabled = !estaConectado;
        if (estaConectado) {
            boton.classList.remove('desactivado');
        } else {
            boton.classList.add('desactivado');
        }
    });
    
    // Actualizar mensaje en panel lateral si existe
    const estadoConexionPanel = document.getElementById('estado-conexion-panel');
    if (estadoConexionPanel) {
        estadoConexionPanel.innerHTML = estaConectado 
            ? '<span class="badge bg-success">Conectado</span>' 
            : '<span class="badge bg-danger">Desconectado</span>';
    }
    
    // Si está desconectado, mostrar mensaje en el panel de chat
    if (!estaConectado && window.MAIRA?.Chat?.agregarMensajeSistema) {
        window.MAIRA.Chat.agregarMensajeSistema('Conexión con el servidor perdida. Intentando reconectar...');
    }
    
    // Si se recuperó la conexión, también notificar
    if (estaConectado && window.MAIRA?.Chat?.agregarMensajeSistema && !window.ultimoEstadoConexion) {
        window.MAIRA.Chat.agregarMensajeSistema('Conexión con el servidor restablecida.');
    }
    
    // Guardar el estado para comparación
    window.ultimoEstadoConexion = estaConectado;
}


/**
 * Muestra u oculta el panel lateral
 * @param {boolean} [forzarEstado] - Opcional, true para mostrar, false para ocultar
 */
function togglePanel(forzarEstado) {
    const panel = document.getElementById('panel-lateral');
    const boton = document.getElementById('boton-panel');
    const mainContent = document.getElementById('main-content');
    
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
        // Mostrar panel
        panel.classList.remove('oculto');
        boton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        panelVisible = true;
        if (mainContent) mainContent.classList.remove('panel-oculto');
        localStorage.setItem('panelVisible', 'true');
    } else {
        // Ocultar panel
        panel.classList.add('oculto');
        boton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        panelVisible = false;
        if (mainContent) mainContent.classList.add('panel-oculto');
        localStorage.setItem('panelVisible', 'false');
    }
    
    // Forzar re-renderizado para dispositivos que podrían tener problemas de visualización
    setTimeout(function() {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}




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
                posicion: posicionActual,
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
            posicion: posicionActual,
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
                if (window.MAIRA.Elementos.actualizarElementoConectado) {
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
        
        if (posicionActual) {
            localStorage.setItem('ultima_posicion', JSON.stringify(posicionActual));
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
                if (posicionActual) {
                    if (window.mapa) {
                        window.mapa.setView([posicionActual.lat, posicionActual.lng], 15);
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
        } else if (posicionActual) {
            console.log("Creando marcador de usuario a partir de última posición conocida");
            actualizarMarcadorUsuario(posicionActual.lat, posicionActual.lng, posicionActual.rumbo);
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
    };

    window.marcarElementosDesconectados = marcarElementosDesconectados;

    // Exponer globalmente
    window.actualizarElementoModificado = actualizarElementoModificado;


// Exponer togglePanel a nivel global para que los botones del HTML puedan acceder a él
window.togglePanel = function(forzarEstado) {
    MAIRA.GestionBatalla.togglePanel(forzarEstado);
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



// Implementar el método a nivel global
window.salirDeOperacionGB = salirDeOperacionGB;


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


// Integración con la base de datos para Gestión de Batalla





/**
 * Función mejorada para enviar un elemento al servidor (DB)
 * @param {Object} elemento - Elemento a enviar
 * @returns {boolean} Éxito de la operación
 */
function enviarElementoAlServidor(elemento) {
    console.log("Enviando elemento al servidor para actualizar la DB:", elemento);
    
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
    
    if (!socket) {
        console.error("No se pudo encontrar ningún socket disponible");
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
        
        // Preparar datos completos para la DB
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
        
        console.log("Enviando elemento a la DB:", datosElemento);
        
        // Usar evento específico para DB
        socket.emit('actualizarElementoDB', datosElemento);
        
        // También enviar por canales tradicionales para compatibilidad
        socket.emit('actualizarElemento', datosElemento);
        socket.emit('nuevoElemento', datosElemento);
        
        // Actualizar estructura local de elementos conectados
        actualizarElementoConectadoLocal(datosElemento.id, datosElemento);
        
        return true;
    } catch (error) {
        console.error("Error enviando elemento a la DB:", error);
        return false;
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
    posicionActual = {
        lat: latitude,
        lng: longitude,
        precision: accuracy,
        rumbo: heading || 0,
        velocidad: speed || 0,
        timestamp: new Date()
    };
    
    // Guardar en localStorage
    localStorage.setItem('ultima_posicion', JSON.stringify(posicionActual));
    
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
        
        // Enviar al servidor
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


// Refactorizar guardarElementosEnLocalStorage para usar UserIdentity
function guardarElementosEnLocalStorage() {
    // Esta función debería ser reemplazada por persistencia en DB
    // Pero para compatibilidad, también actualizar UserIdentity
    
    try {
        // Solo guardar el elemento propio en UserIdentity
        if (usuarioInfo && usuarioInfo.id && elementosConectados[usuarioInfo.id]) {
            const elementoPropio = elementosConectados[usuarioInfo.id];
            MAIRA.UserIdentity.updateElementoTrabajo(elementoPropio.datos.elemento);
        }
        
        // Y como respaldo, guardar la estructura completa
        const elementosParaGuardar = {};
        Object.entries(elementosConectados).forEach(([id, elem]) => {
            elementosParaGuardar[id] = { datos: elem.datos };
        });
        
        localStorage.setItem(`elementos_conectados_${operacionActual}`, 
                            JSON.stringify(elementosParaGuardar));
        
        return true;
    } catch (e) {
        console.error("Error al guardar elementos:", e);
        return false;
    }
}



function limpiarDatosLocalesOperacion() {
    // Mantener identidad del usuario pero limpiar datos de operación
    if (MAIRA.UserIdentity) {
        const userData = MAIRA.UserIdentity.loadFromStorage();
        if (userData) {
            // Mantener ID y username, pero limpiar resto
            MAIRA.UserIdentity.initialize(userData.id, userData.username);
        }
    }
    
    // Limpiar localStorage relacionado con GB
    localStorage.removeItem('gb_operacion_seleccionada');
    localStorage.removeItem('gb_elemento_info');
    localStorage.removeItem(`elementos_conectados_${operacionActual}`);
    localStorage.setItem('en_operacion_gb', 'false');
}





function cargarOperacionDesdeURL() {
    // Intentar obtener operación desde URL (prioritario)
    const urlParams = new URLSearchParams(window.location.search);
    const operacionParam = urlParams.get('operacion');
    
    if (operacionParam) {
        // Guardar en variables locales y globales
        operacionActual = operacionParam;
        window.operacionActual = operacionParam;
        window.MAIRA.GestionBatalla.operacionActual = operacionParam;
        
        console.log("Operación cargada desde URL:", operacionActual);
        return true;
    } 
    
    // Si no está en URL, intentar cargar desde localStorage
    const operacionGuardada = localStorage.getItem('gb_operacion_seleccionada');
    if (operacionGuardada) {
        try {
            const operacion = JSON.parse(operacionGuardada);
            operacionActual = operacion.nombre;
            window.operacionActual = operacionActual;
            window.MAIRA.GestionBatalla.operacionActual = operacionActual;
            
            console.log("Operación cargada desde localStorage:", operacionActual);
            return true;
        } catch (error) {
            console.error("Error al cargar operación desde localStorage:", error);
        }
    }
    
    // Si llegamos aquí, no se encontró la operación
    console.warn("No se encontró operación en URL ni localStorage");
    return false;
}


function cargarInfoDesdeLocalStorage() {
    try {
        console.log("Cargando información desde localStorage");
        
        // Cargar desde UserIdentity si está disponible
        if (window.MAIRA.UserIdentity) {
            const userInfo = window.MAIRA.UserIdentity.loadFromStorage();
            if (userInfo) {
                usuarioInfo = {
                    id: userInfo.id,
                    usuario: userInfo.username
                };
                
                elementoTrabajo = window.MAIRA.UserIdentity.getElementoTrabajo();
                
                console.log("Información cargada desde UserIdentity:", {
                    usuario: usuarioInfo,
                    elemento: elementoTrabajo
                });
                
                // Exponer a variables globales
                window.usuarioInfo = usuarioInfo;
                window.elementoTrabajo = elementoTrabajo;
                window.MAIRA.GestionBatalla.usuarioInfo = usuarioInfo;
                window.MAIRA.GestionBatalla.elementoTrabajo = elementoTrabajo;
                
                return true;
            }
        }
        
        // Método antiguo si UserIdentity no funcionó
        const usuarioData = localStorage.getItem('gb_usuario_info');
        const elementoData = localStorage.getItem('gb_elemento_info');

        if (!usuarioData || !elementoData) {
            console.warn("Falta información necesaria en localStorage");
            return false;
        }

        try {
            usuarioInfo = JSON.parse(usuarioData);
            elementoTrabajo = JSON.parse(elementoData);

            // Exponer a variables globales
            window.usuarioInfo = usuarioInfo;
            window.elementoTrabajo = elementoTrabajo;
            window.MAIRA.GestionBatalla = window.MAIRA.GestionBatalla || {};
            window.MAIRA.GestionBatalla.usuarioInfo = usuarioInfo;
            window.MAIRA.GestionBatalla.elementoTrabajo = elementoTrabajo;

            console.log("Información cargada correctamente desde localStorage:", {
                usuario: usuarioInfo,
                elemento: elementoTrabajo
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



function configurarEventosSocket() {
    if (!socket) {
        console.error("Socket no disponible para configurar eventos");
        return;
    }

    console.log("Configurando eventos centrales de socket para GB");

    // Limpiar eventos previos
    socket.off('listaElementos');
    socket.off('listaElementosDB');
    socket.off('nuevoElemento');
    socket.off('anunciarElemento');
    socket.off('actualizarPosicionGB');
    socket.off('actualizacionPosicion');
    socket.off('elementoConectado');
    socket.off('elementoDesconectado');
    socket.off('actualizarPosicionDB');
    socket.off('elementoConectadoDB');

    // 1. EVENTOS DB ESPECÍFICOS (NUEVOS)
    
    // Recibir lista completa de elementos desde DB
    socket.on('listaElementosDB', function(elementos) {
        console.log(`📥 Recibidos ${elementos?.length || 0} elementos desde DB`);
        procesarElementosDB(elementos);
    });
    
    // Elemento conectado desde DB
    socket.on('elementoConectadoDB', function(elemento) {
        console.log("📥 Elemento conectado desde DB:", elemento?.id);
        // Usar mismo procesamiento que listaElementosDB
        procesarElementosDB([elemento]);
    });
    
    // Actualización de posición desde DB
    socket.on('actualizarPosicionDB', function(datos) {
        if (!datos?.id || !datos?.posicion) {
            console.warn("⚠️ Datos incompletos en actualizarPosicionDB");
            return;
        }
        
        console.log(`📍 Posición desde DB para ${datos.id}: ${datos.posicion.lat}, ${datos.posicion.lng}`);
        
        // Actualizar en la estructura local
        actualizarPosicionElemento(datos);
    });
    
    // Actualización de elemento desde DB
    socket.on('actualizarElementoDB', function(datos) {
        if (!datos?.id) {
            console.warn("⚠️ Datos incompletos en actualizarElementoDB");
            return;
        }
        
        console.log(`🔄 Actualización de elemento desde DB: ${datos.id}`);
        
        // Actualizar en la estructura local
        actualizarElementoModificado(datos.id, datos);
    });

    // 2. MANTENER EVENTOS ANTIGUOS PARA COMPATIBILIDAD
    
    // Evento para lista de elementos (formato antiguo)
    socket.on('listaElementos', function(elementos) {
        console.log(`Recibidos ${elementos?.length || 0} elementos del servidor (formato antiguo)`);
        
        if (!elementos || !Array.isArray(elementos) || elementos.length === 0) {
            console.log("Lista de elementos vacía recibida");
            return;
        }
        
        // Usar mismo método de procesamiento para mantener consistencia
        procesarElementosRecibidos(elementos);
    });

    // Eventos tradicionales para nuevos elementos y anuncios
    socket.on('nuevoElemento', function(elemento) {
        console.log("Nuevo elemento recibido:", elemento?.id);
        procesarElementosRecibidos([elemento]);
    });

    socket.on('anunciarElemento', function(elemento) {
        console.log("Elemento anunciado recibido:", elemento?.id);
        procesarElementosRecibidos([elemento]);
    });

    // Eventos de actualización de posición (formato antiguo)
    socket.on('actualizarPosicionGB', function(datos) {
        if (!datos?.id || !datos?.posicion) return;
        
        console.log(`Posición actualizada (formato antiguo): ${datos.id}`);
        actualizarPosicionElemento(datos);
    });

    socket.on('actualizacionPosicion', function(datos) {
        if (!datos?.id || !datos?.posicion) return;
        
        console.log(`Posición actualizada (formato compatibilidad): ${datos.id}`);
        actualizarPosicionElemento(datos);
    });

    console.log("Eventos Socket.IO configurados correctamente");
}


function procesarElementosDB(elementos) {
    if (!elementos || !Array.isArray(elementos) || elementos.length === 0) {
        console.log("Lista de elementos vacía recibida de la DB");
        return;
    }
    
    console.log(`Procesando ${elementos.length} elementos desde la base de datos`);
    
    // Preservar el elemento propio
    const elementoPropio = elementosConectados[usuarioInfo.id];
    
    // Recorrer todos los elementos recibidos
    elementos.forEach(elemento => {
        if (!elemento || !elemento.id) {
            console.warn("Elemento inválido recibido:", elemento);
            return;
        }
        
        // Identificar si es el elemento propio
        const esElementoPropio = elemento.id === usuarioInfo.id;
        
        if (esElementoPropio) {
            console.log("Elemento propio recibido de DB:", elemento.id);
            
            // Mantener posición propia pero actualizar otros datos
            const posicionActual = elementoPropio?.datos?.posicion || window.posicionActual || {lat: 0, lng: 0};
            
            // Actualizar estructura de elementos conectados
            elementosConectados[elemento.id] = {
                datos: {
                    ...elemento,
                    posicion: posicionActual // Mantener posición propia
                },
                marcador: elementoPropio?.marcador || null
            };
            
            // Actualizar referencia a elementoTrabajo con datos de la DB
            if (elemento.elemento) {
                // Solo actualizar si hay nueva información
                elementoTrabajo = { 
                    ...elementoTrabajo,
                    ...elemento.elemento
                };
                
                // Actualizar referencias globales
                window.elementoTrabajo = elementoTrabajo;
                window.MAIRA.GestionBatalla.elementoTrabajo = elementoTrabajo;
                
                // Actualizar también en UserIdentity si está disponible
                if (window.MAIRA.UserIdentity && window.MAIRA.UserIdentity.updateElementoTrabajo) {
                    window.MAIRA.UserIdentity.updateElementoTrabajo(elementoTrabajo);
                }
            }
            
            // Actualizar visualización si tenemos marcador propio
            if (elementoPropio?.marcador) {
                actualizarVisualizacionMarcador(elementoPropio.marcador, elemento);
            }
        } else {
            // Elemento de otro usuario
            console.log(`Recibido elemento ${elemento.id} de usuario ${elemento.usuario || 'Desconocido'}`);
            
            // Crear o actualizar entrada en elementosConectados
            if (!elementosConectados[elemento.id]) {
                // Crear nueva entrada
                elementosConectados[elemento.id] = {
                    datos: elemento,
                    marcador: null // Se creará después
                };
            } else {
                // Actualizar datos pero mantener marcador
                const marcadorExistente = elementosConectados[elemento.id].marcador;
                elementosConectados[elemento.id] = {
                    datos: elemento,
                    marcador: marcadorExistente
                };
                
                // Si hay marcador y posición nueva, actualizar
                if (marcadorExistente && elemento.posicion) {
                    try {
                        marcadorExistente.setLatLng([elemento.posicion.lat, elemento.posicion.lng]);
                        
                        // También actualizar icono si hay cambios relevantes
                        actualizarVisualizacionMarcador(marcadorExistente, elemento);
                    } catch (e) {
                        console.error(`Error al actualizar marcador: ${e}`);
                    }
                }
            }
            
            // Añadir a la lista visual si no existe
            const elementoVisual = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
            if (!elementoVisual) {
                agregarElementoALista(elemento);
            } else {
                actualizarElementoEnLista(elemento);
            }
        }
    });
    
    // Crear marcadores para elementos que no tienen
    regenerarMarcadoresParaElementos();
    
    // Actualizar interfaz
    actualizarListaElementos();
    
    console.log(`Procesamiento de elementos DB completado: ${Object.keys(elementosConectados).length} elementos activos`);
}

/**
 * Regenera marcadores para elementos que no los tienen
 */
function regenerarMarcadoresParaElementos() {
    console.log("Regenerando marcadores para elementos...");
    
    // Verificar que el mapa esté disponible
    if (!window.mapa) {
        console.warn("Mapa no disponible para crear marcadores");
        return;
    }
    
    // Recorrer todos los elementos conectados
    Object.entries(elementosConectados).forEach(([id, elemento]) => {
        // Si ya tiene marcador, no hacer nada
        if (elemento.marcador) return;
        
        // Si no tiene datos o posición, no podemos crear marcador
        if (!elemento.datos || !elemento.datos.posicion) return;
        
        // Obtener datos para crear marcador
        const { posicion } = elemento.datos;
        
        // Verificar que la posición tenga coordenadas válidas
        if (!posicion || typeof posicion.lat !== 'number' || typeof posicion.lng !== 'number') {
            console.warn(`Posición inválida para elemento ${id}:`, posicion);
            return;
        }
        
        try {
            // Crear marcador
            const marcador = crearMarcadorElemento(elemento.datos);
            
            // Guardar referencia al marcador
            if (marcador) {
                elemento.marcador = marcador;
                console.log(`Marcador creado para elemento ${id}`);
            }
        } catch (e) {
            console.error(`Error al crear marcador para elemento ${id}:`, e);
        }
    });
    
    console.log("Regeneración de marcadores completada");
}

/**
 * Actualiza la visualización de un marcador según datos
 */
function actualizarVisualizacionMarcador(marcador, datos) {
    if (!marcador || !datos) return;
    
    try {
        // Si hay cambio en SIDC y tenemos la librería milsymbol
        if (typeof ms !== 'undefined' && ms.Symbol && 
            ((datos.sidc && marcador.options.sidc !== datos.sidc) || 
             (datos.elemento?.sidc && marcador.options.sidc !== datos.elemento.sidc))) {
            
            // Obtener SIDC y datos
            const sidc = datos.sidc || datos.elemento?.sidc || marcador.options.sidc;
            const designacion = datos.designacion || datos.elemento?.designacion || marcador.options.designacion || '';
            const dependencia = datos.dependencia || datos.elemento?.dependencia || marcador.options.dependencia || '';
            
            // Crear etiqueta
            let etiqueta = designacion;
            if (dependencia) {
                etiqueta += "/" + dependencia;
            }
            
            // Crear símbolo militar
            try {
                const symbol = new ms.Symbol(sidc, {
                    size: 35,
                    direction: datos.posicion?.rumbo || 0,
                    uniqueDesignation: etiqueta
                });
                
                // Actualizar icono del marcador
                marcador.setIcon(L.divIcon({
                    className: 'elemento-militar',
                    html: symbol.asSVG(),
                    iconSize: [70, 50],
                    iconAnchor: [35, 25]
                }));
                
                // Actualizar opciones del marcador
                marcador.options.sidc = sidc;
                marcador.options.designacion = designacion;
                marcador.options.dependencia = dependencia;
                marcador.options.magnitud = datos.magnitud || datos.elemento?.magnitud || marcador.options.magnitud || '-';
                
                console.log(`Icono actualizado para marcador con SIDC: ${sidc}`);
            } catch (e) {
                console.error("Error al actualizar símbolo militar:", e);
            }
        }
        
        // Actualizar estado conectado/desconectado
        if (datos.conectado !== undefined) {
            const opacidad = datos.conectado ? 1 : 0.5;
            marcador.setOpacity(opacidad);
            
            // Actualizar clase del icono si existe
            const iconoActual = marcador.options.icon;
            if (iconoActual && iconoActual.options.html) {
                const nuevoIcono = L.divIcon({
                    ...iconoActual.options,
                    className: `elemento-militar ${datos.conectado ? '' : 'desconectado'}`
                });
                marcador.setIcon(nuevoIcono);
            }
        }
    } catch (e) {
        console.error("Error al actualizar visualización de marcador:", e);
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
                posicion: posicionActual,
                operacion: operacionActual,
                timestamp: new Date().toISOString(),
                conectado: true
            };
            
            // EVENTO DB ESPECÍFICO - CLAVE PARA PERSISTENCIA
            socket.emit('actualizarPosicionDB', datos);
            
            // Mantener eventos antiguos para compatibilidad
            socket.emit('actualizarPosicionGB', datos);
            socket.emit('actualizacionPosicion', datos);
            socket.emit('anunciarElemento', datos);
            socket.emit('heartbeat', datos);
            
            console.log("Datos periódicos enviados al servidor y DB");
        }
    }, 10000); // Cada 10 segundos
    
    // Enviar inmediatamente la primera vez
    if (socket && socket.connected && usuarioInfo) {
        enviarPosicionActual();
    }
    
    return true;
}
/**
 * Obtiene la posición inicial del usuario
 * Usa geolocalización si está disponible o una posición predeterminada
 */
function obtenerPosicionInicial() {
    console.log("Intentando obtener posición inicial...");
    
    // Verificar si hay posición guardada
    const posicionGuardada = localStorage.getItem(`posicion_${operacionActual}`);
    if (posicionGuardada) {
        try {
            const posicion = JSON.parse(posicionGuardada);
            console.log("Usando posición guardada:", posicion);
            
            // Asignar a variable global
            posicionActual = posicion;
            window.posicionActual = posicion;
            
            // Centrar mapa si existe
            if (window.mapa) {
                window.mapa.setView([posicion.lat, posicion.lng], window.mapa.getZoom());
            }
            
            // Si hay elemento propio, actualizar posición
            if (usuarioInfo && elementosConectados[usuarioInfo.id]) {
                elementosConectados[usuarioInfo.id].datos.posicion = posicion;
                
                // Actualizar marcador si existe
                if (elementosConectados[usuarioInfo.id].marcador) {
                    elementosConectados[usuarioInfo.id].marcador.setLatLng([posicion.lat, posicion.lng]);
                } else {
                    // Crear marcador si no existe
                    crearMarcadorElementoPropio();
                }
            }
            
            // Enviar al servidor
            enviarPosicionActual();
            
            return true;
        } catch (e) {
            console.error("Error al leer posición guardada:", e);
        }
    }
    
    // Intentar usar geolocalización
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Éxito
            function(position) {
                console.log("Posición obtenida por GPS:", position);
                
                // Crear objeto de posición
                const posicion = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    precision: position.coords.accuracy,
                    rumbo: position.coords.heading || 0,
                    timestamp: new Date()
                };
                
                // Asignar a variable global
                posicionActual = posicion;
                window.posicionActual = posicion;
                
                // Guardar en localStorage
                localStorage.setItem(`posicion_${operacionActual}`, JSON.stringify(posicion));
                
                // Centrar mapa si existe
                if (window.mapa) {
                    window.mapa.setView([posicion.lat, posicion.lng], window.mapa.getZoom());
                }
                
                // Si hay elemento propio, actualizar posición
                if (usuarioInfo && elementosConectados[usuarioInfo.id]) {
                    elementosConectados[usuarioInfo.id].datos.posicion = posicion;
                    
                    // Actualizar marcador si existe
                    if (elementosConectados[usuarioInfo.id].marcador) {
                        elementosConectados[usuarioInfo.id].marcador.setLatLng([posicion.lat, posicion.lng]);
                    } else {
                        // Crear marcador si no existe
                        crearMarcadorElementoPropio();
                    }
                }
                
                // Enviar al servidor
                enviarPosicionActual();
            },
            // Error
            function(error) {
                console.warn("Error al obtener posición GPS:", error);
            },
            // Opciones
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    } else {
        console.warn("Geolocalización no disponible");
    }
    
    // Por defecto, usar posición predeterminada mientras se espera el GPS
    
    
    return true;
}

/**
 * Usa una posición predeterminada si no hay otra disponible
 * Posición por defecto: Bogotá, Colombia
 */
function usarPosicionPredeterminada() {
    console.log("Usando posición predeterminada");
    
    // Posición predeterminada (Bogotá, Colombia)
    const posicion = {
        lat: 4.6534649,
        lng: -74.0836252,
        precision: 1000,
        rumbo: 0,
        timestamp: new Date()
    };
    
    // Asignar a variable global
    posicionActual = posicion;
    window.posicionActual = posicion;
    
    // Centrar mapa si existe
    if (window.mapa) {
        window.mapa.setView([posicion.lat, posicion.lng], window.mapa.getZoom());
    }
    
    // Si hay elemento propio, actualizar posición
    if (usuarioInfo && elementosConectados[usuarioInfo.id]) {
        elementosConectados[usuarioInfo.id].datos.posicion = posicion;
        
        // Actualizar marcador si existe
        if (elementosConectados[usuarioInfo.id].marcador) {
            elementosConectados[usuarioInfo.id].marcador.setLatLng([posicion.lat, posicion.lng]);
        } else {
            // Crear marcador si no existe
            crearMarcadorElementoPropio();
        }
    }
    
    return posicion;
}

// Añadir esta función al objeto MAIRA.GestionBatalla si no existe
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
                    } else if (MAIRA.Elementos && typeof MAIRA.Elementos.toggleTracking === 'function') {
                        MAIRA.Elementos.toggleTracking();
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
    if (trackingActivadoPrevio) {
        setTimeout(function() {
            if (typeof iniciarTrackingElementos === 'function') {
                iniciarTrackingElementos();
            } else if (MAIRA.Elementos && typeof MAIRA.Elementos.iniciarTrackingElementos === 'function') {
                MAIRA.Elementos.iniciarTrackingElementos();
            }
        }, 2000); // Retraso para asegurar que los elementos estén cargados
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

// ========================================
// CORRECCIÓN 3: Implementar actualizarElementoConectado
// ========================================

/**
 * Actualiza un elemento en elementosConectados 
 * @param {string} id - ID del elemento
 * @param {Object} datos - Datos del elemento
 * @param {Object|null} posicion - Posición del elemento (opcional)
 * @returns {Object} Elemento actualizado
 */



function inicializarEstructuraElementos() {
    try {
        console.log("Inicializando estructura central de elementos");
        
        // CORRECCIÓN: Crear la variable posicionActual si no existe
        if (!posicionActual) {
            posicionActual = {
                lat: -34.6037, // Buenos Aires como ejemplo
                lng: -58.3816,
                precision: 1000,
                rumbo: 0,
                timestamp: new Date()
            };
            window.posicionActual = posicionActual;
            console.log("Creada posición predeterminada:", posicionActual);
        }
        
        // Crear estructura si no existe
        if (!window.elementosConectados) {
            window.elementosConectados = {};
        }
        
        // Asignar a variable local
        elementosConectados = window.elementosConectados;
        
        // Asignar a estructura global MAIRA
        if (window.MAIRA && window.MAIRA.GestionBatalla) {
            window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
        }
        
        // Inicializar elemento propio si existe información
        if (usuarioInfo && elementoTrabajo) {
            // Crear entrada para elemento propio
            elementosConectados[usuarioInfo.id] = {
                datos: {
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    sidc: elementoTrabajo.sidc,
                    designacion: elementoTrabajo.designacion,
                    dependencia: elementoTrabajo.dependencia,
                    magnitud: elementoTrabajo.magnitud,
                    posicion: posicionActual,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString(),
                    conectado: true
                },
                marcador: null  // Se creará cuando tengamos mapa y posición
            };
            
            console.log("Elemento propio inicializado:", usuarioInfo.id);
        }
        
        console.log("Estructura de elementos inicializada");
        return true;
    } catch (e) {
        console.error("Error al inicializar estructura de elementos:", e);
        return false;
    }
}


window.inicializarSistemaTracking = inicializarSistemaTracking;


/**
 * Envía la posición actual al servidor (versión DB)
 */
function enviarPosicionActual() {
    if (!socket?.connected || !usuarioInfo || !posicionActual) {
        return false;
    }
    
    try {
        const datosPosicion = {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            elemento: elementoTrabajo,
            posicion: posicionActual,
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            conectado: true
        };
        
        // Usar evento específico para DB
        socket.emit('actualizarPosicionDB', datosPosicion);
        
        // Para compatibilidad, también usar eventos tradicionales
        socket.emit('actualizarPosicionGB', datosPosicion);
        socket.emit('actualizacionPosicion', datosPosicion);
        
        console.log("Posición enviada a la base de datos:", posicionActual.lat, posicionActual.lng);
        return true;
    } catch (e) {
        console.error("Error al enviar posición:", e);
        return false;
    }
}

/**
 * Guarda un elemento modificado en la DB
 */
function guardarElementoDB(elemento) {
    if (!socket || !socket.connected) {
        console.warn("No se puede guardar elemento en DB: sin conexión");
        return false;
    }
    
    if (!elemento || !elemento.id) {
        console.warn("Elemento inválido para guardar en DB");
        return false;
    }
    
    try {
        // Asegurar que el elemento tiene todos los datos necesarios
        const elementoCompleto = {
            ...elemento,
            operacion: operacionActual,
            timestamp: new Date().toISOString()
        };
        
        // Enviar al servidor específicamente para la DB
        socket.emit('guardarElementoDB', elementoCompleto);
        
        console.log(`Elemento ${elemento.id} enviado para guardar en DB`);
        return true;
    } catch (e) {
        console.error("Error al guardar elemento en DB:", e);
        return false;
    }
}

/**
 * Actualiza un elemento modificado
 * @param {string} elementoId - ID del elemento
 * @param {Object} nuevosDatos - Datos actualizados
 */
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
    } else {
        actualizarElementoEnLista(elementosConectados[elementoId].datos);
    }
    
    // Enviar actualización al servidor si estamos conectados
    if (socket && socket.connected) {
        // Preparar datos para enviar
        const datosActualizados = {
            ...elementosConectados[elementoId].datos,
            timestamp: new Date().toISOString()
        };
        
        // Evento específico para DB
        socket.emit('actualizarElementoDB', datosActualizados);
        
        // Eventos tradicionales para compatibilidad
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

/**
 * Actualiza la posición de un elemento
 */
function actualizarPosicionElemento(datos) {
    // Verificar datos mínimos
    if (!datos || !datos.id || !datos.posicion) {
        console.warn("Datos inválidos para actualizar posición");
        return false;
    }
    
    // Verificar si tenemos el elemento
    if (!elementosConectados[datos.id]) {
        console.log(`Elemento ${datos.id} no encontrado, creando entrada`);
        elementosConectados[datos.id] = {
            datos: datos,
            marcador: null
        };
    } else {
        // Actualizar posición
        elementosConectados[datos.id].datos.posicion = datos.posicion;
        
        // Actualizar otros campos si vienen
        if (datos.conectado !== undefined) {
            elementosConectados[datos.id].datos.conectado = datos.conectado;
        }
        
        if (datos.timestamp) {
            elementosConectados[datos.id].datos.timestamp = datos.timestamp;
        }
        
        if (datos.elemento) {
            elementosConectados[datos.id].datos.elemento = datos.elemento;
        }
        
        // Si hay marcador, actualizar su posición
        if (elementosConectados[datos.id].marcador) {
            try {
                elementosConectados[datos.id].marcador.setLatLng([
                    datos.posicion.lat, 
                    datos.posicion.lng
                ]);
                
                // Si hay rumbo, actualizarlo también
                if (datos.posicion.rumbo !== undefined) {
                    if (elementosConectados[datos.id].marcador.setRotationAngle) {
                        elementosConectados[datos.id].marcador.setRotationAngle(datos.posicion.rumbo);
                    }
                }
                
                console.log(`Posición de marcador ${datos.id} actualizada: ${datos.posicion.lat}, ${datos.posicion.lng}`);
            } catch (e) {
                console.error(`Error al actualizar posición de marcador: ${e}`);
            }
        } else if (window.mapa) {
            // Si no hay marcador pero tenemos mapa, considerar crearlo
            console.log(`Creando marcador para elemento ${datos.id}`);
            // Intentar crear marcador solo si tiene suficientes datos
            if (datos.elemento && datos.elemento.sidc) {
                try {
                    const marcador = crearMarcadorElemento(datos);
                    if (marcador) {
                        elementosConectados[datos.id].marcador = marcador;
                    }
                } catch (e) {
                    console.error(`Error al crear marcador: ${e}`);
                }
            }
        }
    }
    
    // Actualizar visualización en lista
    const elementoItem = document.querySelector(`.elemento-item[data-id="${datos.id}"]`);
    if (!elementoItem && elementosConectados[datos.id].datos) {
        // Si no existe en la lista, añadirlo
        agregarElementoALista(elementosConectados[datos.id].datos);
    }
    
    return true;
}


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
                // Evento específico para DB
                socket.emit('salirOperacionDB', {
                    operacion: nombreOperacion,
                    usuario: userId,
                    timestamp: new Date().toISOString()
                });
                
                // Evento tradicional para compatibilidad
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
        window.location.href = '/inicioGB.html';
        
        return true;
    } catch (e) {
        console.error(`Error al salir de operación: ${e}`);
        
        // En caso de error, intentar limpiar datos de todas formas
        limpiarDatosHuerfanos();
        
        // Redirigir al usuario a la página de inicio
        window.location.href = '/inicioGB.html';
        
        return false;
    }
}

/**
 * Limpia datos de localStorage relacionados con una operación
 */
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

// =====================================================================
// 9. CREAR MARCADOR (INTEGRACIÓN CON DB)
// =====================================================================

/**
 * Crea un marcador para un elemento y lo guarda en la DB
 */
function crearMarcadorElemento(elemento) {
    try {
        // Verificar que el elemento tenga datos mínimos necesarios
        if (!elemento || !elemento.posicion || !elemento.id) {
            console.warn("Elemento no válido para crear marcador");
            return null;
        }
        
        // Verificar que el mapa esté disponible
        if (!window.mapa) {
            console.warn("Mapa no disponible para crear marcador");
            return null;
        }
        
        // Crear opciones para el marcador
        let opciones = {
            title: elemento.designacion || elemento.nombre || 'Elemento',
            id: elemento.id,
            draggable: false // En general no permitimos arrastrar los marcadores de otros
        };
        
        // Añadir datos adicionales si están disponibles
        if (elemento.sidc) opciones.sidc = elemento.sidc;
        if (elemento.designacion) opciones.designacion = elemento.designacion;
        if (elemento.dependencia) opciones.dependencia = elemento.dependencia;
        if (elemento.magnitud) opciones.magnitud = elemento.magnitud;
        if (elemento.elementoId) opciones.elementoId = elemento.elementoId;
        if (elemento.usuario) opciones.usuario = elemento.usuario;
        if (elemento.usuarioId) opciones.usuarioId = elemento.usuarioId;
        
        // Determinar posición
        const lat = elemento.posicion.lat;
        const lng = elemento.posicion.lng;
        
        // Verificar si es nuestro propio elemento
        const esElementoPropio = elemento.id === usuarioInfo?.id;
        
        // Si es elemento propio, permitir arrastrar
        if (esElementoPropio) {
            opciones.draggable = false;
        }
        
        // Crear icono dependiendo de si es un símbolo militar o no
        let icon;
        
        if (elemento.sidc && typeof ms !== 'undefined' && ms.Symbol) {
            // Crear símbolo militar
            let etiqueta = elemento.designacion || '';
            if (elemento.dependencia) {
                etiqueta += "/" + elemento.dependencia;
            }
            
            try {
                // Intentar crear símbolo militar
                const sym = new ms.Symbol(elemento.sidc, {
                    size: 35,
                    direction: elemento.posicion.rumbo || 0,
                    uniqueDesignation: etiqueta,
                    staffComments: elemento.comentarios || ''
                });
                
                // Crear icono
                icon = L.divIcon({
                    className: `elemento-militar ${esElementoPropio ? 'elemento-propio' : ''}`,
                    html: sym.asSVG(),
                    iconSize: [70, 50],
                    iconAnchor: [35, 25]
                });
                
                // Añadir SIDC a opciones
                opciones.isElementoMilitar = true;
            } catch (e) {
                console.error("Error al crear símbolo militar:", e);
                
                // Crear icono básico como fallback
                icon = L.divIcon({
                    className: `custom-div-icon ${esElementoPropio ? 'elemento-propio' : ''}`,
                    html: `<div style="background-color:blue;width:16px;height:16px;border-radius:50%;"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
            }
        } else {
            // Crear icono básico
            icon = L.divIcon({
                className: `custom-div-icon ${esElementoPropio ? 'elemento-propio' : ''}`,
                html: `<div style="background-color:blue;width:16px;height:16px;border-radius:50%;"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
        }
        
        // Asignar icono a opciones
        opciones.icon = icon;
        
        // Crear marcador
        const marcador = L.marker([lat, lng], opciones);
        
        // Añadir al mapa
        if (window.calcoActivo) {
            window.calcoActivo.addLayer(marcador);
        } else {
            window.mapa.addLayer(marcador);
        }
        
        // Configurar eventos de clic
        marcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.elementoSeleccionado = this;
            window.elementoSeleccionadoGB = this;
            
            if (window.seleccionarElemento) {
                window.seleccionarElemento(this);
            }
        });
        
        // Configurar eventos de clic derecho
        marcador.on('contextmenu', function(e) {
            L.DomEvent.stopPropagation(e);
            window.elementoSeleccionado = this;
            window.elementoSeleccionadoGB = this;
            
            if (window.mostrarMenuContextual) {
                window.mostrarMenuContextual(e, this);
            }
        });
        
        // Si es arrastrable, configurar eventos
        if (opciones.draggable) {
            marcador.on('dragend', function(e) {
                const nuevaPos = this.getLatLng();
                // Actualizar posición actual
                posicionActual = {
                    lat: nuevaPos.lat,
                    lng: nuevaPos.lng,
                    precision: posicionActual?.precision || 10,
                    rumbo: posicionActual?.rumbo || 0,
                    timestamp: new Date()
                };
                
                // Enviar al servidor (DB)
                socket.emit('actualizarPosicionDB', {
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: posicionActual,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString()
                });
                
                console.log("Posición actualizada por arrastre:", posicionActual);
            });
        }
        
        // Guardar elemento en DB si lo hemos creado nosotros
        if (esElementoPropio) {
            guardarElementoDB(elemento);
        }
        
        return marcador;
    } catch (e) {
        console.error("Error al crear marcador:", e);
        return null;
    }
}


/**
 * GESTIÓN DE BATALLA - FUNCIONES AUXILIARES
 * 
 * Estas funciones complementan la integración con la base de datos
 * y aseguran que la experiencia del usuario sea fluida.
 */

/**
 * GESTIÓN DE BATALLA - FUNCIONES AUXILIARES
 * 
 * Estas funciones complementan la integración con la base de datos
 * y aseguran que la experiencia del usuario sea fluida.
 */

// =====================================================================
// 1. FUNCIONES PARA MANIPULACIÓN DE ELEMENTOS EN LA LISTA
// =====================================================================

/**
 * Agrega un elemento a la lista visual de elementos
 * @param {Object} elemento - Datos del elemento
 */
function agregarElementoALista(elemento) {
    if (!elemento || !elemento.id) {
        console.error("No se puede agregar elemento sin ID a la lista");
        return;
    }
    
    console.log(`Añadiendo elemento a lista visual: ${elemento.id} - ${elemento.usuario || 'Sin nombre'}`);
    
    const listaContenedor = document.getElementById('lista-elementos');
    if (!listaContenedor) {
        console.error("No se encontró el contenedor 'lista-elementos'");
        return;
    }
    
    // Check for duplicates
    const elementoExistente = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
    if (elementoExistente) {
        console.log(`Elemento ${elemento.id} ya existe en la lista, actualizando...`);
        actualizarElementoEnLista(elemento);
        return;
    }
    
    // Determine if it's the current user
    const idUsuarioActual = window.usuarioInfo?.id;
    const esUsuarioActual = elemento.id === idUsuarioActual;
    
    // Generate item HTML
    const sidc = elemento.elemento?.sidc || elemento.sidc || 'SFGPUCI-----';
    let symbolHtml = '';
    
    try {
        if (typeof ms !== 'undefined') {
            const sym = new ms.Symbol(sidc, {size: 20});
            symbolHtml = sym.asSVG();
        }
    } catch (e) {
        console.warn(`Error al generar símbolo para elemento ${elemento.id}:`, e);
        symbolHtml = '<div style="width:20px;height:20px;background:#ccc;border-radius:50%;"></div>';
    }
    
    const elementoHTML = `
        <div class="elemento-item ${esUsuarioActual ? 'usuario-actual' : ''}" data-id="${elemento.id}">
            <div class="elemento-icon">
                <div class="sidc-preview">${symbolHtml}</div>
                <span class="elemento-status ${elemento.conectado === false ? 'offline' : 'online'}"></span>
            </div>
            <div class="elemento-info">
                <div class="elemento-nombre">${elemento.elemento?.designacion || elemento.designacion || elemento.nombre || 'Sin nombre'}</div>
                <div class="elemento-usuario">${elemento.usuario || 'Usuario'}</div>
                <div class="elemento-tiempo">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
            <div class="elemento-acciones">
                <button title="Ver detalles" class="btn-detalles">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button title="Centrar en mapa" class="btn-centrar">
                    <i class="fas fa-crosshairs"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add to list
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = elementoHTML.trim();
    const elementoItem = tempDiv.firstChild;
    listaContenedor.appendChild(elementoItem);
    
    // Configure button events
    const btnDetalles = elementoItem.querySelector('.btn-detalles');
    if (btnDetalles) {
        btnDetalles.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof mostrarDetallesElemento === 'function') {
                mostrarDetallesElemento(elemento.id);
            }
        });
    }
    
    const btnCentrar = elementoItem.querySelector('.btn-centrar');
    if (btnCentrar) {
        btnCentrar.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof centrarEnElemento === 'function') {
                centrarEnElemento(elemento.id);
            }
        });
    }
    
    // Click on the item to select it
    elementoItem.addEventListener('click', function() {
        if (typeof seleccionarElementoGB === 'function') {
            seleccionarElementoGB(elementosConectados[elemento.id]?.marcador);
        }
    });
    
    console.log(`Elemento ${elemento.id} añadido a la lista visual`);
}

/**
 * Actualiza un elemento en la lista visual
 * @param {Object} elemento - Datos actualizados del elemento
 */
function actualizarElementoEnLista(elemento) {
    try {
        // Buscar el elemento en la lista
        const elementoItem = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
        if (!elementoItem) {
            return agregarElementoALista(elemento);
        }
        
        // Actualizar icono
        const iconoContainer = elementoItem.querySelector('.elemento-icon');
        if (iconoContainer) {
            iconoContainer.innerHTML = generarIconoMiniatura(elemento);
        }
        
        // Actualizar información
        const infoNombre = elementoItem.querySelector('.elemento-nombre');
        if (infoNombre) {
            const designacion = elemento.designacion || elemento.elemento?.designacion || 'Elemento';
            const dependencia = elemento.dependencia || elemento.elemento?.dependencia || '';
            infoNombre.textContent = `${designacion}${dependencia ? '/' + dependencia : ''}`;
        }
        
        // Actualizar usuario
        const infoUsuario = elementoItem.querySelector('.elemento-usuario');
        if (infoUsuario) {
            infoUsuario.textContent = elemento.usuario || 'Usuario';
        }
        
        // Actualizar estado de conexión
        const estadoConexion = elementoItem.querySelector('.estado-conexion');
        if (estadoConexion) {
            const conectado = elemento.conectado !== false;
            estadoConexion.className = `estado-conexion ${conectado ? 'conectado' : 'desconectado'}`;
            estadoConexion.title = conectado ? 'conectado' : 'desconectado';
            estadoConexion.textContent = conectado ? '●' : '○';
        }
        
        // Actualizar clase del elemento
        if (elemento.conectado === false) {
            elementoItem.classList.add('desconectado');
        } else {
            elementoItem.classList.remove('desconectado');
        }
        
        return true;
    } catch (e) {
        console.error("Error al actualizar elemento en lista:", e);
        return false;
    }
}

/**
 * Genera un icono en miniatura para un elemento
 * @param {Object} elemento - Datos del elemento
 * @returns {string} HTML del icono
 */
function generarIconoMiniatura(elemento) {
    try {
        // Si tiene SIDC y existe la librería milsymbol, generar símbolo militar
        if (elemento.sidc && typeof ms !== 'undefined' && ms.Symbol) {
            try {
                // Crear símbolo militar en miniatura
                const sym = new ms.Symbol(elemento.sidc, {
                    size: 20,
                    uniqueDesignation: '',
                    direction: 0
                });
                
                return sym.asSVG();
            } catch (e) {
                console.error("Error al generar símbolo militar en miniatura:", e);
            }
        } else if (elemento.elemento?.sidc && typeof ms !== 'undefined' && ms.Symbol) {
            try {
                // Crear símbolo militar en miniatura desde elemento.elemento
                const sym = new ms.Symbol(elemento.elemento.sidc, {
                    size: 20,
                    uniqueDesignation: '',
                    direction: 0
                });
                
                return sym.asSVG();
            } catch (e) {
                console.error("Error al generar símbolo militar desde elemento.elemento:", e);
            }
        }
        
        // Si no se pudo generar símbolo militar, usar icono genérico
        return `<div class="icono-generico"></div>`;
    } catch (e) {
        console.error("Error al generar icono miniatura:", e);
        return `<div class="icono-generico"></div>`;
    }
}

/**
 * Selecciona un elemento en la lista y lo centra en el mapa
 * @param {string} elementoId - ID del elemento
 */
function seleccionarElementoEnLista(elementoId) {
    try {
        // Desmarcar elementos previamente seleccionados
        document.querySelectorAll('.elemento-item.seleccionado').forEach(item => {
            item.classList.remove('seleccionado');
        });
        
        // Marcar el elemento seleccionado
        const elementoItem = document.querySelector(`.elemento-item[data-id="${elementoId}"]`);
        if (elementoItem) {
            elementoItem.classList.add('seleccionado');
        }
        
        // Buscar en elementosConectados
        const elemento = elementosConectados[elementoId];
        if (elemento && elemento.marcador) {
            // Centrar mapa en el elemento
            if (window.mapa) {
                window.mapa.setView(elemento.marcador.getLatLng(), window.mapa.getZoom());
            }
            
            // Establecer como elemento seleccionado global
            window.elementoSeleccionado = elemento.marcador;
            window.elementoSeleccionadoGB = elemento.marcador;
            
            // Llamar a función de selección si existe
            if (typeof window.seleccionarElemento === 'function') {
                window.seleccionarElemento(elemento.marcador);
            }
            
            return true;
        }
        
        return false;
    } catch (e) {
        console.error("Error al seleccionar elemento en lista:", e);
        return false;
    }
}

/**
 * Ordena la lista de elementos por estado y nombre
 */
function ordenarListaElementos() {
    try {
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) return;
        
        // Obtener todos los elementos
        const elementos = Array.from(listaElementos.querySelectorAll('.elemento-item'));
        
        // Ordenar: primero conectados, luego por nombre
        elementos.sort((a, b) => {
            // Prioridad 1: Conectados sobre desconectados
            const aConectado = !a.classList.contains('desconectado');
            const bConectado = !b.classList.contains('desconectado');
            
            if (aConectado !== bConectado) {
                return aConectado ? -1 : 1;
            }
            
            // Prioridad 2: Nombre del elemento
            const aNombre = a.querySelector('.elemento-nombre')?.textContent || '';
            const bNombre = b.querySelector('.elemento-nombre')?.textContent || '';
            
            return aNombre.localeCompare(bNombre);
        });
        
        // Reordenar en el DOM
        elementos.forEach(elemento => {
            listaElementos.appendChild(elemento);
        });
    } catch (e) {
        console.error("Error al ordenar lista de elementos:", e);
    }
}

/**
 * Actualiza la lista completa de elementos
 */
function actualizarListaElementos() {
    try {
        // Get the correct container (make sure ID is right)
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) {
            console.warn("Element list container not found");
            return;
        }
        
        // Clear current list
        listaElementos.innerHTML = '';
        
        // Add all connected elements
        Object.values(elementosConectados).forEach(elemento => {
            if (elemento.datos) {
                agregarElementoALista(elemento.datos);
            }
        });
        
        // Update element counter
        const contadorElementos = document.getElementById('contador-elementos');
        if (contadorElementos) {
            const total = Object.keys(elementosConectados).length;
            const conectados = Object.values(elementosConectados).filter(e => e.datos && e.datos.conectado !== false).length;
            contadorElementos.textContent = `${conectados}/${total}`;
        }
        
        return true;
    } catch (e) {
        console.error("Error updating element list:", e);
        return false;
    }
}

// =====================================================================
// 2. FUNCIONES PARA GESTIÓN DE ELEMENTOS
// =====================================================================

/**
 * Marca todos los elementos como desconectados
 * Útil cuando hay desconexión del servidor
 */
function marcarElementosDesconectados() {
    try {
        // Recorrer todos los elementos
        Object.values(elementosConectados).forEach(elemento => {
            // No marcar el elemento propio como desconectado
            if (elemento.datos && elemento.datos.id !== usuarioInfo?.id) {
                // Marcar como desconectado
                elemento.datos.conectado = false;
                
                // Actualizar marcador si existe
                if (elemento.marcador) {
                    elemento.marcador.setOpacity(0.5);
                    // Añadir clase a marcador si es posible
                    if (elemento.marcador.getElement) {
                        const markerElement = elemento.marcador.getElement();
                        if (markerElement) {
                            markerElement.classList.add('desconectado');
                        }
                    }
                }
                
                // Actualizar en la lista visual
                const elementoItem = document.querySelector(`.elemento-item[data-id="${elemento.datos.id}"]`);
                if (elementoItem) {
                    elementoItem.classList.add('desconectado');
                    const estadoConexion = elementoItem.querySelector('.estado-conexion');
                    if (estadoConexion) {
                        estadoConexion.className = 'estado-conexion desconectado';
                        estadoConexion.title = 'desconectado';
                        estadoConexion.textContent = '○';
                    }
                }
            }
        });
        
        // Actualizar contador
        const contadorElementos = document.getElementById('contador-elementos');
        if (contadorElementos) {
            const total = Object.keys(elementosConectados).length;
            const conectados = Object.values(elementosConectados).filter(e => e.datos && e.datos.conectado !== false).length;
            contadorElementos.textContent = `${conectados}/${total}`;
        }
        
        return true;
    } catch (e) {
        console.error("Error al marcar elementos como desconectados:", e);
        return false;
    }
}

/**
 * Limpia elementos duplicados en la estructura
 * Útil al reconectar
 */
function limpiarElementosDuplicados() {
    try {
        const idsUnicos = new Set();
        const elementosAConservar = {};
        
        // Identificar elementos duplicados
        Object.entries(elementosConectados).forEach(([id, elemento]) => {
            // Siempre mantener elemento propio
            if (id === usuarioInfo?.id) {
                elementosAConservar[id] = elemento;
                idsUnicos.add(id);
                return;
            }
            
            // Para los demás, verificar duplicados por ID
            if (!idsUnicos.has(id)) {
                elementosAConservar[id] = elemento;
                idsUnicos.add(id);
            } else {
                console.log(`Eliminando elemento duplicado: ${id}`);
                // Si hay marcador, eliminarlo del mapa
                if (elemento.marcador) {
                    if (window.calcoActivo) {
                        window.calcoActivo.removeLayer(elemento.marcador);
                    } else if (window.mapa) {
                        window.mapa.removeLayer(elemento.marcador);
                    }
                }
            }
        });
        
        // Actualizar estructura con elementos limpios
        elementosConectados = elementosAConservar;
        
        // Actualizar referencia global
        if (window.MAIRA && window.MAIRA.GestionBatalla) {
            window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
        }
        
        console.log(`Limpieza completada: ${Object.keys(elementosAConservar).length} elementos conservados`);
        return true;
    } catch (e) {
        console.error("Error al limpiar elementos duplicados:", e);
        return false;
    }
}

/**
 * Procesa elementos recibidos de forma estándar
 * @param {Array|Object} elementos - Elementos a procesar
 */
function procesarElementosRecibidos(elementos) {
    try {
        // Normalizar a array
        const elementosArray = Array.isArray(elementos) ? elementos : [elementos];
        
        // Procesar cada elemento
        elementosArray.forEach(elemento => {
            if (!elemento || !elemento.id) return;
            
            // Si ya existe, preservar marcador
            const marcadorExistente = elementosConectados[elemento.id]?.marcador || null;
            
            // Actualizar en la estructura
            elementosConectados[elemento.id] = {
                datos: elemento,
                marcador: marcadorExistente
            };
            
            // Si hay marcador y posición nueva, actualizar
            if (marcadorExistente && elemento.posicion) {
                try {
                    marcadorExistente.setLatLng([elemento.posicion.lat, elemento.posicion.lng]);
                    
                    // También actualizar visualización
                    actualizarVisualizacionMarcador(marcadorExistente, elemento);
                } catch (e) {
                    console.error(`Error al actualizar marcador: ${e}`);
                }
            } 
            // Si no hay marcador pero debería tenerlo, crearlo
            else if (!marcadorExistente && window.mapa && elemento.posicion) {
                try {
                    const nuevoMarcador = crearMarcadorElemento(elemento);
                    if (nuevoMarcador) {
                        elementosConectados[elemento.id].marcador = nuevoMarcador;
                    }
                } catch (e) {
                    console.error(`Error al crear nuevo marcador: ${e}`);
                }
            }
            
            // Actualizar en la lista visual
            const elementoVisual = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
            if (!elementoVisual) {
                agregarElementoALista(elemento);
            } else {
                actualizarElementoEnLista(elemento);
            }
        });
        
        // Actualizar referencia global
        if (window.MAIRA && window.MAIRA.GestionBatalla) {
            window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
        }
        
        // Actualizar contador
        actualizarListaElementos();
        
        return true;
    } catch (e) {
        console.error("Error al procesar elementos recibidos:", e);
        return false;
    }
}

// =====================================================================
// 3. GESTIÓN DE CARGA Y NOTIFICACIONES
// =====================================================================

/**
 * Muestra u oculta el indicador de carga
 * @param {boolean} mostrar - Mostrar/ocultar carga
 * @param {number} progreso - Porcentaje (0-100)
 * @param {string} mensaje - Mensaje opcional
 */
function mostrarCargando(mostrar, progreso = 0, mensaje = '') {
    try {
        // Buscar o crear contenedor de carga
        let cargandoOverlay = document.getElementById('cargando-overlay');
        
        if (!cargandoOverlay && mostrar) {
            // Crear si no existe y queremos mostrarlo
            cargandoOverlay = document.createElement('div');
            cargandoOverlay.id = 'cargando-overlay';
            cargandoOverlay.className = 'cargando-overlay';
            
            // Crear contenido
            cargandoOverlay.innerHTML = `
                <div class="cargando-contenedor">
                    <div class="spinner"></div>
                    <div class="cargando-mensaje">Cargando...</div>
                    <div class="cargando-barra-progreso">
                        <div class="cargando-progreso"></div>
                    </div>
                </div>
            `;
            
            // Añadir al cuerpo del documento
            document.body.appendChild(cargandoOverlay);
        }
        
        // Si no encontramos ni creamos, salir
        if (!cargandoOverlay) return;
        
        if (mostrar) {
            // Actualizar mensaje si se proporciona
            if (mensaje) {
                const mensajeElement = cargandoOverlay.querySelector('.cargando-mensaje');
                if (mensajeElement) {
                    mensajeElement.textContent = mensaje;
                }
            }
            
            // Actualizar barra de progreso si se proporciona
            if (progreso > 0) {
                const progresoElement = cargandoOverlay.querySelector('.cargando-progreso');
                if (progresoElement) {
                    progresoElement.style.width = `${progreso}%`;
                }
            }
            
            // Mostrar overlay
            cargandoOverlay.style.display = 'flex';
        } else {
            // Ocultar overlay
            cargandoOverlay.style.display = 'none';
        }
        
        return true;
    } catch (e) {
        console.error("Error en mostrarCargando:", e);
        return false;
    }
}

/**
 * Muestra una notificación al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo: 'info', 'exito', 'advertencia', 'error'
 * @param {number} duracion - Duración en ms (0 para persistente)
 */
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
    try {
        // Buscar o crear contenedor de notificaciones
        let notificacionesContainer = document.getElementById('notificaciones-container');
        
        if (!notificacionesContainer) {
            // Crear contenedor si no existe
            notificacionesContainer = document.createElement('div');
            notificacionesContainer.id = 'notificaciones-container';
            notificacionesContainer.className = 'notificaciones-container';
            document.body.appendChild(notificacionesContainer);
        }
        
        // Crear nueva notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion notificacion-${tipo}`;
        
        // Añadir contenido
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <div class="notificacion-icono">
                    ${getIconoNotificacion(tipo)}
                </div>
                <div class="notificacion-mensaje">${mensaje}</div>
                <div class="notificacion-cerrar">&times;</div>
            </div>
            <div class="notificacion-progreso"></div>
        `;
        
        // Configurar botón de cerrar
        const botonCerrar = notificacion.querySelector('.notificacion-cerrar');
        if (botonCerrar) {
            botonCerrar.addEventListener('click', function() {
                notificacion.classList.add('cerrando');
                setTimeout(() => {
                    if (notificacion.parentNode) {
                        notificacion.parentNode.removeChild(notificacion);
                    }
                }, 300);
            });
        }
        
        // Añadir al contenedor
        notificacionesContainer.appendChild(notificacion);
        
        // Efecto de entrada
        setTimeout(() => {
            notificacion.classList.add('visible');
        }, 10);
        
        // Auto-cerrar si tiene duración
        if (duracion > 0) {
            // Añadir barra de progreso
            const progresoElement = notificacion.querySelector('.notificacion-progreso');
            if (progresoElement) {
                progresoElement.style.animationDuration = `${duracion}ms`;
                progresoElement.classList.add('activo');
            }
            
            // Programar cierre
            setTimeout(() => {
                notificacion.classList.add('cerrando');
                setTimeout(() => {
                    if (notificacion.parentNode) {
                        notificacion.parentNode.removeChild(notificacion);
                    }
                }, 300);
            }, duracion);
        }
        
        return notificacion;
    } catch (e) {
        console.error("Error en mostrarNotificacion:", e);
        return null;
    }
}

/**
 * Obtiene el HTML del icono para una notificación
 * @param {string} tipo - Tipo de notificación
 * @returns {string} HTML del icono
 */
function getIconoNotificacion(tipo) {
    switch (tipo) {
        case 'exito':
            return '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>';
        case 'error':
            return '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>';
        case 'advertencia':
            return '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg>';
        case 'info':
        default:
            return '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v6h-2zm0-4h2v2h-2z"></path></svg>';
    }
}



/**
 * Redirecciona a la sala de espera
 */
function redirigirASalaEspera() {
    // Mostrar mensaje antes de redireccionar
    mostrarNotificacion("Redirigiendo a sala de espera...", "advertencia", 2000);
    
    // Esperar brevemente para que el usuario vea la notificación
    setTimeout(() => {
        // Intentar limpiar localStorage para evitar bucles
        try {
            localStorage.removeItem('gb_operacion_seleccionada');
            localStorage.setItem('en_operacion_gb', 'false');
        } catch (e) {
            console.error("Error al limpiar localStorage:", e);
        }
        
        // Redireccionar
        window.location.href = '/inicioGB.html';
    }, 2000);
}

/**
 * Inicializa la interfaz de usuario
 */
function inicializarInterfaz() {
    try {
        console.log("Inicializando interfaz...");
        
        // First check if the standard panel-lateral exists
        const panelLateral = document.getElementById('panel-lateral');
        
        if (panelLateral) {
            console.log("Panel lateral encontrado, usando estructura existente");
            
            // Update existing panel with operation info
            const nombreOperacionElement = document.getElementById('nombre-operacion');
            if (nombreOperacionElement) {
                nombreOperacionElement.textContent = operacionActual || 'Sin operación';
            }
            
            // Update user info
            const nombreUsuarioElement = document.getElementById('nombre-usuario');
            if (nombreUsuarioElement && usuarioInfo) {
                nombreUsuarioElement.textContent = usuarioInfo.usuario || 'Usuario';
            }
            
            // Update element info
            const nombreElementoElement = document.getElementById('nombre-elemento');
            if (nombreElementoElement && elementoTrabajo) {
                nombreElementoElement.textContent = elementoTrabajo.designacion || 'Sin elemento';
                if (elementoTrabajo.dependencia) {
                    nombreElementoElement.textContent += '/' + elementoTrabajo.dependencia;
                }
            }
            
            // No need to create a new structure, return
            return true;
        }
        
        // Only create the new gb-container if panel-lateral doesn't exist
        console.log("Panel lateral no encontrado, creando nueva interfaz");
        
        // Existing code to create new interface structure
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.warn("Contenedor principal no encontrado");
            return false;
        }
        
        // Create new interface structure (only if panel-lateral doesn't exist)
        mainContent.innerHTML = `
            <div id="gb-container" class="gb-container">
                <div id="gb-sidebar" class="gb-sidebar">
                    <div class="gb-sidebar-header">
                        <h3>Operación: ${operacionActual}</h3>
                        <div class="gb-contador">
                            <span id="contador-elementos">0/0</span> elementos
                        </div>
                    </div>
                    <div class="gb-search">
                        <input type="text" id="buscar-elementos" placeholder="Buscar elementos...">
                    </div>
                    <div id="lista-elementos" class="lista-elementos">
                        <!-- Elementos conectados -->
                    </div>
                    <div class="gb-sidebar-footer">
                        <button id="btn-crear-elemento" class="gb-btn">Crear Elemento</button>
                        <button id="btn-salir-operacion" class="gb-btn gb-btn-danger">Salir</button>
                    </div>
                </div>
                <div id="gb-main" class="gb-main">
                    <div id="mapa-container" class="mapa-container">
                        <!-- Mapa -->
                    </div>
                    <div id="gb-tools" class="gb-tools">
                        <!-- Herramientas -->
                    </div>
                </div>
            </div>
        `;
        
        console.log("Interfaz inicializada correctamente");
        return true;
    } catch (e) {
        console.error("Error al inicializar interfaz:", e);
        return false;
    }
}


function limpiarDatosHuerfanos() {
    try {
        // Lista de claves a inspeccionar
        const claves = [
            'gb_operacion_seleccionada',
            'gb_usuario_info',
            'gb_elemento_info',
            'en_operacion_gb'
        ];
        
        // Limpiar claves específicas
        claves.forEach(clave => {
            try {
                localStorage.removeItem(clave);
            } catch (innerError) {
                console.warn(`Error al eliminar clave ${clave}:`, innerError);
            }
        });
        
        // Buscar claves relacionadas con elementos (por si hay alguna huérfana)
        for (let i = 0; i < localStorage.length; i++) {
            const clave = localStorage.key(i);
            if (clave.startsWith('elementos_conectados_') || 
                clave.startsWith('tracking_')) {
                try {
                    localStorage.removeItem(clave);
                } catch (innerError) {
                    console.warn(`Error al eliminar clave ${clave}:`, innerError);
                }
            }
        }
        
        console.log("Limpieza de datos huérfanos completada");
        return true;
    } catch (e) {
        console.error("Error al limpiar datos huérfanos:", e);
        return false;
    }
}

// Importante: exportar funciones críticas al scope global
window.inicializarSistemaTracking = inicializarSistemaTracking;

window.togglePanel = togglePanel;
window.inicializarEstructuraElementos = inicializarEstructuraElementos;


