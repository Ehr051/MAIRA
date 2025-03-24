/**
 * gestionBatalla.js
 * Core module for battle management in MAIRA
 * @version 2.0.0
 */

// Namespace principal para evitar conflictos
window.MAIRA = window.MAIRA || {};

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
        
        // Verificar modo correcto
        const esModoGestionBatalla = window.location.pathname.includes('gestionbatalla.html');
        if (!esModoGestionBatalla) {
            console.warn("No estamos en modo Gestión de Batalla");
            return;
        }
        
        // Cargar información
        if (!cargarInfoDesdeLocalStorage()) {
            console.warn("No se pudo cargar información del usuario");
            return; // Si falla, ya se redirigió a la sala de espera
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
        sincronizarElementos();
        configurarEventosSocket();
        console.log("Inicialización de Gestión de Batalla completada");
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
     * Carga la información de usuario y elemento desde localStorage
     * @returns {boolean} - Verdadero si se cargó correctamente
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
     * Carga la operación desde la URL o localStorage
     * @returns {boolean} - Verdadero si se cargó correctamente
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
        
        // Botón de pantalla completa
        const btnFullscreen = document.getElementById('fullscreenBtn');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', function() {
                toggleFullScreen();
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
    function cambiarTab(tabId) {
        console.log("Cambiando a pestaña:", tabId);
        
        // Desactivar todas las pestañas y contenidos
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(function(content) {
            content.classList.remove('active');
        });
        
        // Activar la pestaña seleccionada
        const botonTab = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (botonTab) {
            botonTab.classList.add('active');
            console.log("Botón de pestaña activado:", tabId);
        } else {
            console.error("Botón de pestaña no encontrado:", tabId);
        }
        
        const contenidoTab = document.getElementById(tabId);
        if (contenidoTab) {
            contenidoTab.classList.add('active');
            console.log("Contenido de pestaña activado:", tabId);
        } else {
            console.error("Contenido de pestaña no encontrado:", tabId);
        }
        
        // Guardar estado actual
        estadosUI.tabActiva = tabId;
        localStorage.setItem('gb_tab_activa', tabId);
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
    function obtenerPosicionInicial() {
        console.log("Obteniendo posición inicial (versión mejorada para móviles)");
        
        // Opciones optimizadas para dispositivos móviles
        const opcionesPosicion = {
            enableHighAccuracy: true,        // Usar GPS de alta precisión 
            timeout: 20000,                  // Tiempo más largo para móviles
            maximumAge: 0                    // No usar caché de posición
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
                            if (window.mostrarMenuContextual) {
                                window.mostrarMenuContextual(e, this);
                            }
                        });
                    } else {
                        console.error("No se pudo generar el símbolo militar");
                        crearMarcadorSimple(nuevaPosicion);
                    }
                } catch (error) {
                    console.error("Error al crear símbolo militar:", error);
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
        
        // Configurar evento de clic para el menú contextual
        marcadorUsuario.on('contextmenu', function(e) {
            if (window.mostrarMenuContextual) {
                window.mostrarMenuContextual(e, this);
            }
        });
        
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
        console.log("Iniciando seguimiento de posición");
        
        // Comprobar si ya hay un seguimiento activo
        if (seguimientoActivo) {
            console.log("El seguimiento ya está activo");
            return;
        }
        
        // Comprobar soporte de geolocalización
        if (!navigator.geolocation) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
            if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
                MAIRA.Chat.agregarMensajeChat("Sistema", "Tu navegador no soporta geolocalización.", "sistema");
            }
            return;
        }
        
        // Configurar botón de seguimiento como activo
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        if (btnSeguimiento) {
            btnSeguimiento.classList.add('active');
            btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow text-primary"></i> Seguimiento activo';
        }
        
        // Mostrar mensaje en el chat
        if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
            MAIRA.Chat.agregarMensajeChat("Sistema", "Iniciando seguimiento de posición...", "sistema");
        }
        
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
            
            if (MAIRA.Chat && MAIRA.Chat.agregarMensajeChat) {
                MAIRA.Chat.agregarMensajeChat("Sistema", "Seguimiento de posición activado", "sistema");
            }
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
            
            // Enviar al servidor - NOTA: cambiar 'actualizarPosicion' por el evento correcto
            socket.emit('actualizarPosicion', datosPosicion);
            
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
    

/**
 * Mejora en la configuración de Socket.io para gestión de batalla
 */
    
function conectarAlServidor() {
    try {
        const serverURL = MAIRA.Utils.obtenerURLServidor();
        socket = io(serverURL);
        
        socket.on('connect', function() {
            console.log('Conectado al servidor');
            MAIRA.Utils.actualizarEstadoConexion(true);
            
            // Unirse a salas necesarias
            socket.emit('joinRoom', 'general');
            
            if (operacionActual) {
                socket.emit('joinRoom', operacionActual);
                console.log(`Unido a sala de operación: ${operacionActual}`);
            }
            
            // Verificar si somos el creador
            const esCreador = new URLSearchParams(window.location.search).get('creador') === 'true';
            
            // Enviar datos de usuario/elemento
            if (usuarioInfo && elementoTrabajo) {
                const datosBroadcast = {
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: ultimaPosicion,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString(),
                    conectado: true,
                    esCreador: esCreador,
                    sala: operacionActual // Añadir sala explícitamente
                };
                
                console.log(`Enviando datos completos${esCreador ? ' como creador' : ''}:`, datosBroadcast);
                
                // MODIFICACIÓN: Usar múltiples eventos con alta prioridad
                // Evento anunciarElemento con más detalles
                socket.emit('anunciarElemento', datosBroadcast);
                
                // Evento nuevoElemento para compatibilidad
                socket.emit('nuevoElemento', datosBroadcast);
                
                // Evento unirseOperacion para registrar en la operación
                socket.emit('unirseOperacion', {
                    ...datosBroadcast,
                    operacionId: operacionActual // Añadir ID de operación explícitamente
                });
                
                // Evento actualizarPosicion para posicionamiento
                socket.emit('actualizarPosicion', datosBroadcast);
                
                // Eventos adicionales para máxima compatibilidad
                socket.emit('heartbeat', datosBroadcast);
                socket.emit('elementoConectado', datosBroadcast);
                
                // Si es creador, eventos adicionales
                if (esCreador) {
                    socket.emit('creadorConectado', datosBroadcast);
                    socket.emit('registrarParticipante', datosBroadcast);
                }
                
                // IMPORTANTE: Enviar mensaje al chat para forzar registro
                // Esto es crucial porque algunos servidores reconocen mejor los
                // elementos a través del chat
                socket.emit('mensajeChat', {
                    id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    usuario: "Sistema",
                    mensaje: `${usuarioInfo.usuario} se ha conectado a la operación`,
                    tipo: 'sistema',
                    sala: operacionActual,
                    timestamp: new Date().toISOString(),
                    emisor: {
                        id: usuarioInfo.id,
                        nombre: usuarioInfo.usuario,
                        elemento: elementoTrabajo
                    }
                });
                
                // Procesar nuestro propio elemento
                procesarElementosPropios();
                
                // Actualizar lista de destinatarios de chat con reintento
                const intentarActualizarDestinatarios = () => {
                    if (MAIRA.Chat && typeof MAIRA.Chat.actualizarListaDestinatarios === 'function') {
                        MAIRA.Chat.actualizarListaDestinatarios();
                    }
                };
                
                // Múltiples intentos con retraso creciente
                setTimeout(intentarActualizarDestinatarios, 500);
                setTimeout(intentarActualizarDestinatarios, 1500);
                setTimeout(intentarActualizarDestinatarios, 3000);
            }
            
            // Iniciar broadcast periódico (más frecuente para creador)
            iniciarBroadcastPeriodico(esCreador);
            
            // Solicitar elementos existentes con múltiples intentos
            const solicitarElementos = () => {
                socket.emit('solicitarElementos', { 
                    operacion: operacionActual,
                    solicitante: usuarioInfo?.id
                });
                console.log("Solicitando lista de elementos de la operación");
            };
            
            // Solicitar inmediatamente y luego con retraso
            solicitarElementos();
            setTimeout(solicitarElementos, 2000);
        });
        
        socket.on('disconnect', function(reason) {
            console.log('Desconectado del servidor. Razón:', reason);
            MAIRA.Utils.mostrarNotificacion("Desconectado del servidor: " + reason, "error", 5000);
            MAIRA.Utils.actualizarEstadoConexion(false);
        });

        socket.on('error', function(error) {
            console.error('Error de socket:', error);
            MAIRA.Utils.mostrarNotificacion("Error de socket: " + error, "error");
        });


        socket.on('reconnect', function() {
            console.log('Reconectado al servidor. Enviando datos actualizados...');
            
            if (usuarioInfo && elementoTrabajo) {
                // Anunciar elemento al reconectar
                socket.emit('anunciarElemento', {
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: ultimaPosicion,
                    operacion: operacionActual,
                    timestamp: new Date().toISOString()
                });
                
                // Solicitar elementos actualizados
                socket.emit('solicitarElementos', { 
                    operacion: operacionActual,
                    solicitante: usuarioInfo.id 
                });
            }
        });
        

        socket.on('listaElementos', function(elementos) {
            console.log(`Recibidos ${elementos?.length || 0} elementos del servidor`);
            
            if (!elementos || !Array.isArray(elementos)) {
                console.warn("Lista de elementos vacía o inválida recibida");
                return;
            }
            
            // Process directly with MAIRA.Elementos module if available
            if (MAIRA.Elementos && typeof MAIRA.Elementos.inicializarListaElementos === 'function') {
                MAIRA.Elementos.inicializarListaElementos(elementos);
                return;
            }

            // Initialize connected elements
            elementosConectados = {};
            
            // Process each received element
            elementos.forEach(elemento => {
                // Basic validation
                if (!elemento || !elemento.id) return;
                
                // Save element with existing marker if any
                elementosConectados[elemento.id] = {
                    datos: elemento,
                    marcador: null
                };
                
                // Create marker if position is available
                if (elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
                    if (MAIRA.Elementos && typeof MAIRA.Elementos.crearMarcadorElemento === 'function') {
                        MAIRA.Elementos.crearMarcadorElemento(elemento);
                    }
                }
            });
            
            // Also process own element
            procesarElementosPropios();
            
            // Synchronize with chat module for private messages
            if (MAIRA.Chat && typeof MAIRA.Chat.actualizarListaDestinatarios === 'function') {
                MAIRA.Chat.actualizarListaDestinatarios();
            }
        });


        
        // Configurar eventos específicos para mensajes
        socket.on('mensajeChat', function(mensaje) {
            console.log('Mensaje recibido:', mensaje);
            
            // Normalizar formato del mensaje
            const emisor = mensaje.usuario || mensaje.emisor?.nombre || 'Desconocido';
            const contenido = mensaje.mensaje || mensaje.contenido || '';
            const tipo = mensaje.tipo || 'other';
            const timestamp = mensaje.timestamp ? new Date(mensaje.timestamp) : new Date();
            const destinatario = mensaje.destinatario;
            
            // Incluir en el chat
            if (MAIRA.Chat && typeof MAIRA.Chat.agregarMensajeChat === 'function') {
                MAIRA.Chat.agregarMensajeChat(emisor, contenido, tipo, timestamp, { destinatario });
            }
        });
        
        // Evento para mensajes privados
        socket.on('mensajePrivado', function(mensaje) {
            console.log('Mensaje privado recibido:', mensaje);
            
            if (MAIRA.Chat && typeof MAIRA.Chat.agregarMensajeChat === 'function') {
                const emisor = mensaje.emisor?.nombre || 'Privado';
                const contenido = mensaje.contenido || '';
                const timestamp = mensaje.timestamp ? new Date(mensaje.timestamp) : new Date();
                
                MAIRA.Chat.agregarMensajeChat(emisor, contenido, 'privado', timestamp);
                
                // Mostrar notificación visual
                MAIRA.Utils.mostrarNotificacion(`Mensaje privado de ${emisor}`, "info", 3000);
            }
        });
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
    }
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
                posicion: ultimaPosicion,
                operacion: operacionActual,
                timestamp: new Date().toISOString(),
                conectado: true,
                esCreador: esCreador
            };
            
            // IMPORTANTE: Usar varios eventos para máxima compatibilidad
            socket.emit('actualizarPosicion', datosBroadcast);
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
        
        socket.emit('actualizarPosicion', datosBroadcast);
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
        // Este método será implementado por cada módulo según sus necesidades
        if (MAIRA.Chat && typeof MAIRA.Chat.configurarEventosSocket === 'function') {
            MAIRA.Chat.configurarEventosSocket(socket);
        }
        
        if (MAIRA.Informes && typeof MAIRA.Informes.configurarEventosSocket === 'function') {
            MAIRA.Informes.configurarEventosSocket(socket);
        }
        
        if (MAIRA.Elementos && typeof MAIRA.Elementos.configurarEventosSocket === 'function') {
            MAIRA.Elementos.configurarEventosSocket(socket);
        }
    }

    /**
     * Procesa el elemento propio para incluirlo en la lista de elementos conectados
     */

    function procesarElementosPropios() {
        console.log("Procesando elemento propio para incluirlo en la lista de elementos conectados");
        
        // Verificar que tengamos datos del usuario y su elemento
        if (!usuarioInfo || !elementoTrabajo) {
            console.warn("No hay información de usuario o elemento para procesar");
            return;
        }
        
        // Crear entrada para el elemento propio
        const elementoPropio = {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            elemento: elementoTrabajo,
            posicion: ultimaPosicion,
            conectado: true,
            timestamp: new Date().toISOString(),
            operacion: operacionActual
        };
        
        // Añadir a la lista de elementos conectados
        elementosConectados[usuarioInfo.id] = {
            datos: elementoPropio,
            marcador: marcadorUsuario
        };
        
        console.log("Elemento propio añadido a la lista de elementos conectados:", elementoPropio);
        
        // Agregar a la interfaz visual
        if (MAIRA.Elementos && typeof MAIRA.Elementos.agregarElementoALista === 'function') {
            MAIRA.Elementos.agregarElementoALista(elementoPropio);
        }
        
        // Actualizar lista de destinatarios de chat
        if (MAIRA.Chat && typeof MAIRA.Chat.actualizarListaDestinatarios === 'function') {
            MAIRA.Chat.actualizarListaDestinatarios();
        }
        
        // IMPORTANTE: Emitir nuestro elemento al servidor para que otros lo reciban
        if (socket && socket.connected) {
            // Usar varios eventos para máxima compatibilidad
            socket.emit('nuevoElemento', elementoPropio);
            socket.emit('anunciarElemento', elementoPropio);
            
            // Enviar mensaje explícito al chat
            socket.emit('mensajeChat', {
                id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                usuario: "Sistema",
                mensaje: `${usuarioInfo.usuario} está en línea`,
                tipo: 'sistema',
                sala: operacionActual,
                timestamp: new Date().toISOString(),
                emisor: {
                    id: usuarioInfo.id,
                    nombre: usuarioInfo.usuario,
                    elemento: elementoTrabajo
                }
            });
            
            console.log("Elemento propio emitido al servidor para otros jugadores");
        }
    }

// Añadir nueva función para sincronizar elementos entre módulos
    function sincronizarElementos() {
        // 1. Actualizar módulo de Elementos si está disponible
        if (MAIRA.Elementos) {
            // Si existe una función para actualizar los elementos, usarla
            if (typeof MAIRA.Elementos.actualizarElementosConectados === 'function') {
                MAIRA.Elementos.actualizarElementosConectados(elementosConectados);
            } else {
                // Si no existe, intentar asignar directamente a elementosConectados
                console.log("actualizarElementosConectados no disponible, asignando directamente");
                window.elementosConectados = elementosConectados;
            }
            
            // Actualizar UI
            if (typeof MAIRA.Elementos.mejorarListaElementos === 'function') {
                MAIRA.Elementos.mejorarListaElementos();
            }
        } else {
            // Hacer disponible globalmente como fallback
            window.elementosConectados = elementosConectados;
        }
        
        // 2. Actualizar lista de destinatarios para chat
        if (MAIRA.Chat && typeof MAIRA.Chat.actualizarListaDestinatarios === 'function') {
            setTimeout(() => {
                MAIRA.Chat.actualizarListaDestinatarios();
            }, 300); // Demora para permitir que el DOM se actualice
        }
    }


// In chatGB.js, replace actualizarListaDestinatarios
    function actualizarListaDestinatarios() {
        const selectDestinatario = document.getElementById('select-destinatario');
        if (!selectDestinatario) {
            console.error("Selector de destinatario no encontrado");
            return;
        }
        
        console.log("Actualizando lista de destinatarios para mensajes privados...");
        
        // Get connected elements from the global scope
        let elementos = {};
        if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
            elementos = window.MAIRA.GestionBatalla.elementosConectados;
        } else if (window.elementosConectados) {
            elementos = window.elementosConectados;
        } else {
            elementos = elementosConectados; // Local variable
        }
        
        console.log(`Elementos disponibles para chat privado: ${Object.keys(elementos).length}`, elementos);
        
        // Save currently selected option
        const destinatarioActual = selectDestinatario.value;
        
        // Clear current options
        selectDestinatario.innerHTML = '';
        
        // Default options
        selectDestinatario.innerHTML = `
            <option value="">Seleccionar destinatario...</option>
            <option value="comando">Puesto Comando</option>
            <option disabled>───────────────</option>
        `;
        
        // Counter of added elements
        let elementosAgregados = 0;
        
        // Process each element directly from the elementosConectados object
        Object.entries(elementos).forEach(([id, elem]) => {
            // Don't include current user
            if (id === usuarioInfo?.id) return;
            
            // Determine how to access the data based on structure
            let datosElemento;
            if (elem.datos) {
                datosElemento = elem.datos;
            } else {
                datosElemento = elem;
            }
            
            // Verify it has minimum necessary data
            if (!datosElemento || !datosElemento.usuario) {
                console.warn(`Elemento con ID ${id} no tiene datos suficientes para añadir como destinatario`);
                return;
            }
            
            // Create option for recipient
            const option = document.createElement('option');
            option.value = id;
            
            // Determine descriptive text
            let nombreUsuario = datosElemento.usuario;
            let infoElemento = "";
            
            // Add military element info if available
            if (datosElemento.elemento) {
                if (datosElemento.elemento.designacion) {
                    infoElemento = datosElemento.elemento.designacion;
                    if (datosElemento.elemento.dependencia) {
                        infoElemento += "/" + datosElemento.elemento.dependencia;
                    }
                }
            }
            
            option.textContent = nombreUsuario + (infoElemento ? ` (${infoElemento})` : '');
            selectDestinatario.appendChild(option);
            elementosAgregados++;
        });
        
        // Restore previous selection if exists
        if (destinatarioActual && Array.from(selectDestinatario.options).some(opt => opt.value === destinatarioActual)) {
            selectDestinatario.value = destinatarioActual;
        }
        
        console.log(`Lista de destinatarios actualizada con ${elementosAgregados} participantes disponibles`);
        return elementosAgregados;
    }

    /**
     * Envía los mensajes, informes y posiciones pendientes cuando se conecta
     */
    function enviarPendientes() {
        console.log("Intentando enviar datos pendientes");
        
        if (!socket || !socket.connected) {
            console.warn("No se pueden enviar datos pendientes: sin conexión");
            return;
        }
        
        // Enviar mensajes pendientes
        if (colaPendiente.mensajes && colaPendiente.mensajes.length > 0) {
            console.log(`Enviando ${colaPendiente.mensajes.length} mensajes pendientes`);
            
            colaPendiente.mensajes.forEach(mensaje => {
                socket.emit('mensajeChat', mensaje);
            });
            
            // Limpiar mensajes enviados
            colaPendiente.mensajes = [];
        }
        
        // Enviar informes pendientes
        if (colaPendiente.informes && colaPendiente.informes.length > 0) {
            console.log(`Enviando ${colaPendiente.informes.length} informes pendientes`);
            
            colaPendiente.informes.forEach(informe => {
                socket.emit('nuevoInforme', informe);
            });
            
            // Limpiar informes enviados
            colaPendiente.informes = [];
        }
        
        // Enviar posiciones pendientes
        if (colaPendiente.posiciones && colaPendiente.posiciones.length > 0) {
            console.log(`Enviando ${colaPendiente.posiciones.length} posiciones pendientes`);
            
            // Solo enviar la última posición para no sobrecargar
            const ultimaPosicionPendiente = colaPendiente.posiciones[colaPendiente.posiciones.length - 1];
            socket.emit('actualizarPosicion', ultimaPosicionPendiente);
            
            // Limpiar posiciones enviadas
            colaPendiente.posiciones = [];
        }
    }
    /**
     * Envía la posición actual al servidor
     */
    function enviarPosicionActual() {
        if (!socket || !socket.connected || !usuarioInfo) {
            console.warn("No se puede enviar posición: sin conexión o sin datos de usuario");
            return;
        }
        
        // Si no hay posición, intentar obtenerla
        if (!ultimaPosicion || !ultimaPosicion.lat || !ultimaPosicion.lng) {
            console.warn("No hay posición para enviar. Intentando obtener posición actual...");
            obtenerPosicionInicial();
            return;
        }
        
        console.log("Enviando posición actual al servidor:", ultimaPosicion);
        
        // Crear paquete de datos completo
        const datos = {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            elemento: elementoTrabajo,  // Incluir el elemento completo
            posicion: {
                lat: ultimaPosicion.lat,
                lng: ultimaPosicion.lng,
                precision: ultimaPosicion.precision || 10,
                rumbo: ultimaPosicion.rumbo || 0,
                velocidad: ultimaPosicion.velocidad || 0
            },
            conectado: true,
            timestamp: new Date().toISOString(),
            operacion: operacionActual
        };
        
        // Enviar al servidor - múltiples eventos para asegurar compatibilidad
        socket.emit('actualizarPosicion', datos);
        socket.emit('actualizacionPosicion', datos);  // Evento alternativo
        
        // IMPORTANTE: También actualizar nuestros datos locales
        if (elementosConectados[usuarioInfo.id]) {
            elementosConectados[usuarioInfo.id].datos.posicion = datos.posicion;
            elementosConectados[usuarioInfo.id].datos.timestamp = datos.timestamp;
        }
        
        console.log("Posición enviada al servidor");
    }
    
    function iniciarEnvioPosicionPeriodico() {
        // Limpiar intervalo existente si lo hay
        if (window.envioPosicionInterval) {
            clearInterval(window.envioPosicionInterval);
        }
        
        // Establecer intervalo para enviar posición cada 30 segundos
        window.envioPosicionInterval = setInterval(() => {
            if (socket && socket.connected && usuarioInfo) {
                enviarPosicionActual();
            }
        }, 30000);
        
        console.log("Iniciado envío periódico de posición");
        
        // Enviar posición inmediatamente
        enviarPosicionActual();
    }

    /**
     * Integra los datos del elemento de GBinicio con la función agregarMarcador
     * @param {Object} datosElemento - Datos del elemento recibidos de GBinicio
     */
    function inicializarElementoDesdeGBinicio(datosElemento) {
        console.log("Inicializando elemento desde GBinicio:", datosElemento);
        
        if (!datosElemento || !datosElemento.sidc) {
            console.error("Datos de elemento incompletos o inválidos");
            return;
        }
        
        // Guardar los datos en la variable global
        elementoTrabajo = datosElemento;
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('gb_elemento_info', JSON.stringify(datosElemento));
        
        // Si ya tenemos posición, crear el marcador
        if (ultimaPosicion) {
            console.log("Creando marcador con la posición actual y datos del elemento");
            // Actualizar el marcador del usuario con los datos del elemento
            setTimeout(() => {
                actualizarMarcadorUsuario(
                    ultimaPosicion.lat,
                    ultimaPosicion.lng,
                    ultimaPosicion.rumbo || 0
                );
            }, 500);
        } else {
            console.log("No hay posición disponible, intentando obtenerla");
            // Intentar obtener la posición
            obtenerPosicionInicial();
        }
        
        // Actualizar información en el panel lateral
        actualizarInfoUsuarioPanel();
    }
    
    function agregarMarcadorGB(sidc, nombre) {
        console.log("Agregando marcador con SIDC:", sidc, "Nombre:", nombre);
        
        // Verificar si existe la función global
        if (typeof window.agregarMarcador === 'function') {
            // Usar la función global pero con datos mejorados
            window.agregarMarcador(sidc, nombre, function(marcador) {
                // Callback cuando se crea el marcador
                if (marcador) {
                    // Añadir propiedades adicionales específicas de GB
                    marcador.options.usuario = usuarioInfo?.usuario || 'Usuario';
                    marcador.options.usuarioId = usuarioInfo?.id || '';
                    marcador.options.operacion = operacionActual;
                    marcador.options.timestamp = new Date().toISOString();
                    
                    // Notificar a otros usuarios si estamos conectados
                    if (socket && socket.connected) {
                        socket.emit('nuevoElemento', {
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
                            operacion: operacionActual,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    console.log("Marcador creado y notificado:", marcador.options);
                }
            });
        } else {
            console.warn("La función window.agregarMarcador no está disponible");
            MAIRA.Utils.mostrarNotificacion("Función de agregar marcador no disponible", "error");
            
            // Implementación alternativa
            window.mapa.once('click', function(event) {
                const latlng = event.latlng;
                crearMarcadorPersonalizado(latlng, sidc, nombre);
            });
        }
    }
    
    /**
     * Crea un marcador personalizado en caso de que no esté disponible window.agregarMarcador
     * @param {L.LatLng} latlng - Posición del marcador
     * @param {string} sidc - Código SIDC del marcador
     * @param {string} nombre - Nombre descriptivo del elemento
     */
    function crearMarcadorPersonalizado(latlng, sidc, nombre) {
        // Crear ID único para el elemento
        const elementoId = `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Configurar SIDC 
        let sidcFormateado = sidc;
        if (sidcFormateado.length < 15) {
            sidcFormateado = sidc.padEnd(15, '-');
        }
        
        try {
            // Crear símbolo militar
            if (typeof ms !== 'undefined' && typeof ms.Symbol === 'function') {
                const sym = new ms.Symbol(sidcFormateado, { 
                    size: 35,
                    uniqueDesignation: nombre || "",
                    higherFormation: ""
                });
                
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
                    if (window.seleccionarElemento) {
                        window.seleccionarElemento(this);
                    }
                });
                
                marcador.on('contextmenu', function(e) {
                    L.DomEvent.stopPropagation(e);
                    if (window.mostrarMenuContextual) {
                        window.mostrarMenuContextual(e, this);
                    }
                });
                
                // Agregar al mapa
                if (window.calcoActivo) {
                    window.calcoActivo.addLayer(marcador);
                } else if (window.mapa) {
                    window.mapa.addLayer(marcador);
                }
                
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
                        usuarioId: usuarioInfo?.id || '',
                        operacion: operacionActual,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Seleccionar automáticamente para edición
                if (window.seleccionarElemento && typeof window.seleccionarElemento === 'function') {
                    window.seleccionarElemento(marcador);
                }
                
                console.log("Marcador personalizado creado:", nombre || 'Elemento');
            } else {
                console.error("La biblioteca milsymbol no está disponible");
                MAIRA.Utils.mostrarNotificacion("No se puede crear el marcador: biblioteca de símbolos no disponible", "error");
            }
        } catch (e) {
            console.error("Error al crear marcador personalizado:", e);
            MAIRA.Utils.mostrarNotificacion("Error al crear el marcador", "error");
        }
    }
    
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


    // API pública del módulo
    return {
        inicializar,
        togglePanel,
        iniciarSeguimiento,
        detenerSeguimiento,
        toggleSeguimiento,
        centrarEnPosicion,
        mostrarTodosElementos,
        agregarMarcadorGB,
        inicializarElementoDesdeGBinicio,
        actualizarMarcadorUsuario,
        enviarPosicionActual,
        cambiarTab,
        procesarElementosPropios,
        // Importante: exponer elementosConectados
        elementosConectados: elementosConectados
    };

})();

// Conectar con agregarMarcador global para mantener compatibilidad
window.agregarMarcadorGB = MAIRA.GestionBatalla.agregarMarcadorGB;

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