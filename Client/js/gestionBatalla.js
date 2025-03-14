/**
 * gestionBatallaMejorado.js - Versión mejorada del script de Gestión de Batalla
 * Integra salas de operación, mejora el manejo de menús, y optimiza la interacción con el mapa
 */

// Variables globales
let marcadorUsuario = null;
let seguimientoActivo = false;
let watchId = null;
let usuarioInfo = null;
let socket = null;
let elementoTrabajo = null;
let panelVisible = false;
let elementosConectados = {};
let elementoSeleccionadoContextMenu = null;
let ultimaPosicion = null;
let menuAbierto = null;

// Configuración del sistema
const CONFIG = {
    // Configuración general
    MAX_INTENTOS_CONEXION: 10,
    INTERVALO_RECONEXION: 5000,
    HEARTBEAT_INTERVAL: 30000,
    
    // Configuración de geolocalización
    GEO_PRECISION_ALTA: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
        intervalo: 3000
    },
    GEO_PRECISION_MEDIA: {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
        intervalo: 10000
    },
    GEO_AHORRO_BATERIA: {
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 15000,
        intervalo: 30000
    },
    
    // URLs y endpoints
    URL_PARAM_OPERACION: 'operacion',
    HISTORIAL_OPERACIONES: 'gb_historial_operaciones',
    MAX_HISTORIAL: 10
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando modo Gestión de Batalla Mejorado");
    
    // Verificar parámetros de URL para operación predefinida
    const operacionUrl = obtenerOperacionDeUrl();
    if (operacionUrl) {
        console.log(`Operación detectada en URL: ${operacionUrl}`);
        precargarOperacion(operacionUrl);
    }
    
    // Simular carga
    simularCarga();
    
    // Configurar eventos de UI específicos de gestión de batalla
    configurarEventosUI();
    
    // Configurar formulario de unión a operación
    configurarFormularioLogin();
    
    // Verificar y actualizar vista previa SIDC
    actualizarPreviewSIDC();
    
    // Configurar menú contextual
    configurarMenuContextual();
    
    // Inicializar manejo de eventos de ventana
    inicializarEventosGlobales();
});

/**
 * Inicializa eventos globales como cambios de estado de conexión
 */
function inicializarEventosGlobales() {
    // Detectar cambios de conectividad
    window.addEventListener('online', function() {
        console.log("Dispositivo en línea, intentando reconectar...");
        mostrarNotificacion("Conexión de red detectada, reconectando...", "info");
        if (socket && !socket.connected && usuarioInfo) {
            reconectarSocket();
        }
    });
    
    window.addEventListener('offline', function() {
        console.log("Dispositivo sin conexión");
        mostrarNotificacion("Sin conexión de red", "error");
        actualizarEstadoConexion(false, "Sin conexión de red");
    });
    
    // Manejar cierre de ventana para desconectar gracefully
    window.addEventListener('beforeunload', function() {
        if (socket && socket.connected) {
            socket.disconnect();
        }
    });
    
    // Evento personalizado para notificar inicio de sesión
    document.addEventListener('usuarioConectado', function(e) {
        console.log("Evento usuarioConectado disparado", e.detail);
    });
}

/**
 * Obtiene el nombre de operación de la URL
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
    const operacionParam = params.get(CONFIG.URL_PARAM_OPERACION);
    
    return operacionParam || null;
}

/**
 * Precarga una operación en el formulario de login
 */
function precargarOperacion(operacion) {
    // Esperar a que el formulario esté disponible
    const interval = setInterval(() => {
        const operacionInput = document.getElementById('operacion');
        if (operacionInput) {
            operacionInput.value = operacion;
            clearInterval(interval);
        }
    }, 100);
}

/**
 * Actualiza la URL del navegador con la operación actual
 */
function actualizarUrlConOperacion(operacion) {
    if (!operacion) return;
    
    // Crear nueva URL con hash
    const newUrl = `${window.location.pathname}#${operacion}`;
    
    // Actualizar URL sin recargar la página
    try {
        window.history.pushState({ operacion: operacion }, '', newUrl);
    } catch (error) {
        console.error("Error al actualizar URL:", error);
    }
}

/**
 * Guarda una operación en el historial
 */
function guardarEnHistorial(operacion) {
    if (!operacion) return;
    
    // Obtener historial existente
    let historial = JSON.parse(localStorage.getItem(CONFIG.HISTORIAL_OPERACIONES) || '[]');
    
    // Eliminar si ya existe (para ponerla al principio)
    historial = historial.filter(op => op !== operacion);
    
    // Añadir al principio
    historial.unshift(operacion);
    
    // Limitar tamaño
    if (historial.length > CONFIG.MAX_HISTORIAL) {
        historial = historial.slice(0, CONFIG.MAX_HISTORIAL);
    }
    
    // Guardar
    localStorage.setItem(CONFIG.HISTORIAL_OPERACIONES, JSON.stringify(historial));
    
    // Actualizar datalist
    actualizarDatalistOperaciones(historial);
}

/**
 * Carga el historial de operaciones en el selector
 */
function cargarHistorialOperaciones() {
    // Obtener historial
    const historial = JSON.parse(localStorage.getItem(CONFIG.HISTORIAL_OPERACIONES) || '[]');
    
    // Actualizar datalist
    actualizarDatalistOperaciones(historial);
}

/**
 * Actualiza el datalist con las operaciones del historial
 */
function actualizarDatalistOperaciones(operaciones) {
    const datalistId = 'operaciones-sugeridas';
    let datalist = document.getElementById(datalistId);
    
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = datalistId;
        document.body.appendChild(datalist);
    }
    
    // Limpiar
    datalist.innerHTML = '';
    
    // Añadir opciones
    operaciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        datalist.appendChild(option);
    });
}

/**
 * Configura el menú contextual para elementos
 */
function configurarMenuContextual() {
    // Ocultar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && !contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });
    
    // Eventos de los botones del menú contextual
    document.getElementById('btn-editar-elemento').addEventListener('click', function() {
        if (elementoSeleccionadoContextMenu) {
            editarElemento(elementoSeleccionadoContextMenu);
            document.getElementById('context-menu').style.display = 'none';
        }
    });
    
    document.getElementById('btn-eliminar-elemento').addEventListener('click', function() {
        if (elementoSeleccionadoContextMenu) {
            if (confirm("¿Está seguro que desea eliminar este elemento?")) {
                eliminarElemento(elementoSeleccionadoContextMenu);
            }
            document.getElementById('context-menu').style.display = 'none';
        }
    });
    
    document.getElementById('btn-compartir-elemento').addEventListener('click', function() {
        if (elementoSeleccionadoContextMenu) {
            compartirElemento(elementoSeleccionadoContextMenu);
            document.getElementById('context-menu').style.display = 'none';
        }
    });
}

/**
 * Modifica el formulario de login para incluir historial y manejo de URL
 */
function configurarFormularioLogin() {
    // Verificar que el formulario exista
    const formulario = document.getElementById('login-form');
    if (!formulario) {
        console.error("Formulario de login no encontrado");
        return;
    }
    
    // Modificar el campo de operación para incluir datalist
    const operacionInput = document.getElementById('operacion');
    if (operacionInput) {
        // Crear datalist para sugerencias
        const datalistId = 'operaciones-sugeridas';
        let datalist = document.getElementById(datalistId);
        
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = datalistId;
            document.body.appendChild(datalist);
        }
        
        // Asociar datalist al input
        operacionInput.setAttribute('list', datalistId);
        
        // Añadir título indicando que es un campo editable con historial
        operacionInput.setAttribute('title', 'Introduzca el nombre de la operación o seleccione una del historial');
    }
    
    // Cargar historial inicial
    cargarHistorialOperaciones();
    
    // Modificar el evento submit
    formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value;
        const operacion = document.getElementById('operacion').value;
        
        if (!usuario || !operacion) {
            alert("Por favor complete todos los campos obligatorios");
            return;
        }
        
        // Guardar en historial
        guardarEnHistorial(operacion);
        
        // Actualizar URL con la operación
        actualizarUrlConOperacion(operacion);
        
        // Continuar con el inicio de sesión normal
        const arma = document.getElementById('elemento-arma').value;
        const magnitud = document.getElementById('elemento-magnitud').value;
        const designacion = document.getElementById('elemento-designacion').value;
        const dependencia = document.getElementById('elemento-dependencia').value;
        const fuerza = document.querySelector('input[name="fuerza"]:checked').value;
        
        // Construir SIDC
        const sidc = construirSIDC(arma, magnitud, fuerza);
        
        // Construir elemento
        const elemento = {
            id: generarId(),
            sidc: sidc,
            designacion: designacion,
            dependencia: dependencia || '',
            nombre: designacion + (dependencia ? ` (${dependencia})` : '')
        };
        
        iniciarSesion(usuario, operacion, elemento);
    }, true); // true para capturar el evento antes que el manejador original
}

/**
 * Muestra el menú contextual en la posición dada
 */
function mostrarMenuContextual(e, elemento) {
    // Guardar referencia al elemento
    elementoSeleccionadoContextMenu = elemento;
    
    // Posicionar menú
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    
    // Prevenir comportamiento por defecto
    e.preventDefault();
}

/**
 * Edita un elemento en el mapa
 */
function editarElemento(elemento) {
    // Si hay un panel de edición apropiado, mostrarlo
    if (typeof window.mostrarPanelEdicionUnidad === 'function' && elemento.options && elemento.options.sidc) {
        window.mostrarPanelEdicionUnidad(elemento);
    } else {
        console.log("Edición básica del elemento", elemento);
        // Implementación básica si no está disponible el panel de edición
        const nuevaDesignacion = prompt("Ingrese nueva designación:", elemento.options.designacion || elemento.options.nombre || "");
        if (nuevaDesignacion && nuevaDesignacion.trim() !== "") {
            elemento.options.designacion = nuevaDesignacion.trim();
            elemento.options.nombre = nuevaDesignacion.trim();
            
            // Si tiene popup, actualizarlo
            if (elemento.getPopup) {
                elemento.setPopupContent(`<strong>${nuevaDesignacion}</strong>`);
            }
        }
    }
}

/**
 * Elimina un elemento del mapa
 */
function eliminarElemento(elemento) {
    if (elemento && mapa.hasLayer(elemento)) {
        mapa.removeLayer(elemento);
        
        // Si era un elemento conectado, notificar eliminación
        for (const [id, datos] of Object.entries(elementosConectados)) {
            if (datos.marcador === elemento) {
                delete elementosConectados[id];
                actualizarListaElementosConectados();
                break;
            }
        }
    }
}

/**
 * Comparte un elemento con otros usuarios
 */
function compartirElemento(elemento) {
    if (!socket || !socket.connected) {
        mostrarNotificacion("No hay conexión con el servidor", "error");
        return;
    }
    
    // Preparar datos del elemento
    const elementoData = {
        tipo: 'marcador',
        sidc: elemento.options.sidc,
        nombre: elemento.options.nombre || elemento.options.designacion || "Elemento compartido",
        designacion: elemento.options.designacion || "",
        dependencia: elemento.options.dependencia || "",
        posicion: elemento.getLatLng ? elemento.getLatLng() : null,
        compartidoPor: usuarioInfo.usuario
    };
    
    // Enviar al servidor
    socket.emit('compartirElemento', {
        elemento: elementoData,
        operacion: usuarioInfo.operacion,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario
        }
    });
    
    agregarMensajeChat("Sistema", `Elemento compartido con todos los usuarios de la operación`, "sistema");
}

/**
 * Simula la carga inicial de recursos
 */
function simularCarga() {
    let progreso = 0;
    const intervalo = setInterval(() => {
        progreso += Math.floor(Math.random() * 10) + 1;
        if (progreso >= 100) {
            progreso = 100;
            clearInterval(intervalo);
            
            setTimeout(() => {
                $("#loading-container").fadeOut(500);
            }, 500);
        }
        
        $("#progreso").css("width", progreso + "%");
        $("#porcentajeCarga").text(progreso + "%");
        
        if (progreso < 30) {
            $("#loadingText").text("Cargando recursos...");
        } else if (progreso < 60) {
            $("#loadingText").text("Inicializando mapa...");
        } else if (progreso < 90) {
            $("#loadingText").text("Configurando sistema...");
        } else {
            $("#loadingText").text("¡Listo para iniciar!");
        }
    }, 200);
}

/**
 * Configura los eventos de la interfaz de usuario
 */
function configurarEventosUI() {
    console.log("Configurando eventos UI para gestión de batalla");
    
    // Toggle panel lateral - asegurarse de usar jQuery on para vincular el evento
    $(document).off("click", "#boton-panel").on("click", "#boton-panel", function(e) {
        e.preventDefault();
        togglePanel();
    });
    
    $(document).off("click", "#cerrar-panel").on("click", "#cerrar-panel", function(e) {
        e.preventDefault();
        togglePanel();
    });
    
    // Eventos de pestañas
    $(document).off("click", ".tab-btn").on("click", ".tab-btn", function() {
        const tabId = $(this).data("tab");
        $(".tab-btn").removeClass("active");
        $(this).addClass("active");
        $(".tab-content").removeClass("active");
        $("#" + tabId).addClass("active");
    });
    
    // Eventos de chat
    configurarEventosChat();
    
    // Eventos de informes
    configurarEventosInformes();
    
    // Eventos de herramientas
    configurarEventosHerramientas();
    
    // Eventos de menú contextual
    configurarMenuContextual();
    
    // Mejoras en eventos de menú
    mejorarComportamientoMenus();
}

/**
 * Mejora la gestión de menús para evitar cierre automático
 */
function mejorarComportamientoMenus() {
    console.log("Aplicando mejoras al comportamiento de menús");
    
    // Prevenir cierre automático de menús al hacer clic en su contenido
    $(document).off('click.menuFix').on('click.menuFix', '.menu, .submenu, .menu-btn button', function(e) {
        // Detener la propagación para evitar que los clics dentro del menú lo cierren
        e.stopPropagation();
    });
    
    // Reemplazamos la función toggleMenu original con nuestra versión mejorada
    window.toggleMenuMejorado = function(menuId) {
        console.log(`toggleMenuMejorado: ${menuId}, menuAbierto: ${menuAbierto}`);
        const menu = document.getElementById(menuId);
        if (!menu) {
            console.warn(`Menú con ID '${menuId}' no encontrado`);
            return;
        }
        
        // Si el menú está visible, ocultarlo
        if (menu.classList.contains('show') || window.getComputedStyle(menu).display !== 'none') {
            menu.classList.remove('show');
            menu.style.display = 'none';
            if (menuAbierto === menuId) {
                menuAbierto = null;
            }
            return;
        }
        
        // Si estamos abriendo un nuevo menú principal (no un submenú), cerrar otros menús
        if (!menu.closest('.submenu')) {
            // Cerrar todos los menús de nivel superior
            document.querySelectorAll('.menu').forEach(m => {
                if (m.id !== menuId) {
                    m.classList.remove('show');
                    m.style.display = 'none';
                }
            });
        }
        
        // Mantener abierto el menú padre si estamos abriendo un submenú
        let parentMenu = menu.closest('.submenu');
        if (parentMenu) {
            parentMenu.classList.add('show');
            parentMenu.style.display = 'block';
        }
        
        // Mostrar el menú
        menu.classList.add('show');
        menu.style.display = 'block';
        menuAbierto = menuId;
    };
    
    // Reemplazar eventos onclick en botones de menú
    document.querySelectorAll("[onclick*='toggleMenu']").forEach(function(button) {
        const onclickAttr = button.getAttribute('onclick');
        const match = onclickAttr.match(/toggleMenu\(['"]([^'"]+)['"]\)/);
        if (match) {
            const menuId = match[1];
            // Reemplazar evento
            button.setAttribute('onclick', `toggleMenuMejorado('${menuId}'); return false;`);
        }
    });
    
    // Cerrar menús solo al hacer clic fuera de cualquier menú o botón de menú
    $(document).off('click.closeMenus').on('click.closeMenus', function(e) {
        if (!$(e.target).closest('.menu, .menu-btn, .submenu').length) {
            $('.menu, .submenu').removeClass('show').hide();
            menuAbierto = null;
        }
    });
    
    // Permitir que los clics en elementos <a> dentro de menús funcionen correctamente
    $('.menu a, .submenu a').off('click.menuItemClick').on('click.menuItemClick', function(e) {
        // Solo si es un enlace con acción (href o onclick)
        if ($(this).attr('href') !== '#' && $(this).attr('href') !== '' && $(this).attr('onclick')) {
            // Permitir que la acción ocurra, pero cerrar menús después
            setTimeout(() => {
                if (!$(this).closest('.submenu').length) {
                    $('.menu, .submenu').removeClass('show').hide();
                    menuAbierto = null;
                }
            }, 100);
        }
    });
    
    // Reemplazar la función global
    window.toggleMenu = window.toggleMenuMejorado;
}

/**
 * Configura los eventos relacionados con el chat
 */
function configurarEventosChat() {
    // Cambiar entre chat general y privado
    $("#btn-chat-general, #btn-chat-privado").click(function() {
        $("#btn-chat-general, #btn-chat-privado").removeClass("active");
        $(this).addClass("active");
        
        if ($(this).attr("id") === "btn-chat-privado") {
            $("#chat-destinatario").removeClass("d-none");
        } else {
            $("#chat-destinatario").addClass("d-none");
        }
    });
    
    // Enviar mensaje de chat
    $("#enviar-mensaje").click(enviarMensajeChat);
    $("#mensaje-chat").keypress(function(e) {
        if (e.which === 13) {
            enviarMensajeChat();
            e.preventDefault();
        }
    });
}

/**
 * Configura los eventos relacionados con informes
 */
function configurarEventosInformes() {
    // Cambiar entre ver y crear informes
    $("#btn-ver-informes, #btn-crear-informe").click(function() {
        $("#btn-ver-informes, #btn-crear-informe").removeClass("active");
        $(this).addClass("active");
        
        if ($(this).attr("id") === "btn-crear-informe") {
            $("#ver-informes").addClass("d-none");
            $("#crear-informe").removeClass("d-none");
        } else {
            $("#ver-informes").removeClass("d-none");
            $("#crear-informe").addClass("d-none");
        }
    });
    
    // Cancelar creación de informe
    $("#cancelar-informe").click(function() {
        $("#btn-ver-informes").click();
    });
    
    // Envío de formulario de informe
    $("#form-informe").submit(function(e) {
        e.preventDefault();
        enviarInforme();
    });
    
    // Filtros de informes
    $("#btn-filtro-todos, #btn-filtro-informes, #btn-filtro-ordenes").click(function() {
        $("#btn-filtro-todos, #btn-filtro-informes, #btn-filtro-ordenes").removeClass("active");
        $(this).addClass("active");
        filtrarInformes($(this).attr("id"));
    });
}

/**
 * Configura los eventos de las herramientas del mapa
 */
function configurarEventosHerramientas() {
    // Botón de seguimiento
    $("#btn-seguimiento").click(function() {
        toggleSeguimiento();
    });
    
    // Botón centrar
    $("#btn-centrar").click(function() {
        centrarEnPosicion();
    });
    
    // Botón ver todos
    $("#btn-ver-todos").click(function() {
        mostrarTodosElementos();
    });
    
    // Búsqueda de elementos
    $("#btnBuscarElemento").click(function() {
        $('#modalBuscarElemento').modal('show');
    });
    
    // Búsqueda en tiempo real
    $("#busqueda-elemento").on("input", function() {
        buscarElementos($(this).val());
    });
}

/**
 * Configura el formulario de unión a operación
 */
function configurarFormularioLogin() {
    // Generar SIDC al cambiar selección
    $("#elemento-arma, #elemento-magnitud, input[name='fuerza']:radio").change(function() {
        actualizarPreviewSIDC();
    });
    
    // Manejar envío del formulario
    $("#login-form").submit(function(e) {
        e.preventDefault();
        
        const usuario = $("#usuario").val();
        const operacion = $("#operacion").val();
        const arma = $("#elemento-arma").val();
        const magnitud = $("#elemento-magnitud").val();
        const designacion = $("#elemento-designacion").val();
        const dependencia = $("#elemento-dependencia").val();
        const fuerza = $("input[name='fuerza']:checked").val();
        
        // Validar datos necesarios
        if (!usuario || !operacion || !arma || !designacion) {
            alert("Por favor complete todos los campos obligatorios");
            return;
        }
        
        // Guardar en historial y actualizar URL
        guardarEnHistorial(operacion);
        actualizarUrlConOperacion(operacion);
        
        // Construir SIDC
        const sidc = construirSIDC(arma, magnitud, fuerza);
        
        // Construir elemento
        const elemento = {
            id: generarId(),
            sidc: sidc,
            designacion: designacion,
            dependencia: dependencia || '',
            nombre: designacion + (dependencia ? ` (${dependencia})` : '')
        };
        
        iniciarSesion(usuario, operacion, elemento);
    });
}

/**
 * Construir SIDC basado en los valores seleccionados
 */
function construirSIDC(arma, magnitud, fuerza) {
    // S + Fuerza + GP + Estado + Arma + magnitud + extras
    let sidc = `S${fuerza}GP`;  // Esquema, Fuerza, Dimensión batalla
    sidc += 'P';                 // Estado (presente)
    sidc += 'U';                 // Unidad (U)
    
    // Arma seleccionada (ej: UCI - infantería, UCR - caballería)
    sidc += arma;
    
    // Padding hasta la posición 11 donde va la magnitud
    sidc = sidc.padEnd(10, '-');
    
    // Añadir magnitud
    sidc += magnitud;
    
    // Padding final
    sidc = sidc.padEnd(15, '-');
    
    console.log("SIDC construido:", sidc);
    
    return sidc;
}

/**
 * Actualiza la vista previa del símbolo basado en la selección
 */
function actualizarPreviewSIDC() {
    const arma = $("#elemento-arma").val() || '';
    const magnitud = $("#elemento-magnitud").val() || '-';
    const fuerza = $("input[name='fuerza']:checked").val() || 'F';
    
    if (!arma) return;
    
    const sidc = construirSIDC(arma, magnitud, fuerza);
    
    // Si existe un elemento para mostrar el preview, lo actualizamos
    const previewContainer = document.getElementById('sidc-preview');
    if (previewContainer) {
        const sym = new ms.Symbol(sidc, {size: 40});
        previewContainer.innerHTML = sym.asSVG();
    }
}

/**
 * Configura eventos de menú
 */
function configurarEventosMenu() {
    console.log("Configurando eventos de menú");
    
    // Configurar click en botones de tipo toggle
    $(document).off("click", "[onclick*='toggleMenu']").on("click", "[onclick*='toggleMenu']", function(e) {
        const menuId = $(this).attr("onclick").match(/toggleMenu\(['"]([^'"]+)['"]\)/)[1];
        toggleMenuMejorado(menuId);
        e.preventDefault();
    });
    
    // Configurar clic en elementos de menú
    $(document).off("click", ".menu a").on("click", ".menu a", function(e) {
        // Solo si el elemento no tiene otra acción, prevenir el default
        if (!$(this).attr("onclick")) {
            e.preventDefault();
        }
    });
    
    console.log("Eventos de menú configurados");
}

// Llama a esta función después de iniciar sesión
function inicializarInterfazCompleta() {
    console.log("Inicializando interfaz completa");
    
    // Configurar eventos de menú
    configurarEventosMenu();
    
    // Inicializar botones principales
    inicializarBotonesPrincipales();
    
    // Asegurarse de que el panel lateral funcione correctamente
    $("#cerrar-panel").off("click").on("click", function(e) {
        e.preventDefault();
        togglePanel();
    });
    
    // Configurar pestañas del panel
    $(".tab-btn").off("click").on("click", function() {
        const tabId = $(this).data("tab");
        $(".tab-btn").removeClass("active");
        $(this).addClass("active");
        $(".tab-content").removeClass("active");
        $("#" + tabId).addClass("active");
    });
    
    console.log("Interfaz inicializada correctamente");
}

function iniciarSesion(usuario, operacion, elemento) {
    console.log(`Iniciando unión a operación: ${operacion} como ${usuario}`);
    
    // Guardar información del usuario
    usuarioInfo = {
        id: generarId(),
        usuario: usuario,
        operacion: operacion,
        elemento: elemento
    };
    
    elementoTrabajo = elemento;
    
    // Actualizar interfaz
    $("#nombre-usuario").text(usuarioInfo.usuario);
    $("#nombre-operacion").text(usuarioInfo.operacion);
    $("#nombre-elemento").text(usuarioInfo.elemento.designacion + (usuarioInfo.elemento.dependencia ? ` (${usuarioInfo.elemento.dependencia})` : ''));
    
    // Ocultar login y mostrar contenido principal
    $("#login-container").fadeOut(500, function() {
        // Mostrar contenido principal
        $("#main-content").show();
        
        // Asegurarnos de que el mapa esté inicializado
        if (typeof window.inicializarMapa === 'function') {
            window.inicializarMapa();
        }
        
        // Inicializar la interfaz y los eventos de manera completa
        inicializarInterfazCompleta();
        
        // Mostrar panel
        togglePanel();
        
        // Iniciar seguimiento
        iniciarSeguimiento();
        
        // Conectar socket
        conectarSocket();
        
        // Añadir mensaje al chat
        agregarMensajeChat("Sistema", `Bienvenido ${usuario}. Conectado a operación "${operacion}"`, "sistema");
        
        // Actualizar URL con la operación
        actualizarUrlConOperacion(operacion);
        
        // Disparar evento personalizado de conexión
        document.dispatchEvent(new CustomEvent('usuarioConectado', { 
            detail: { usuario, operacion, elemento }
        }));
        
        // Guardar información de sesión para reconexiones
        guardarSesion();
    });
}

/**
 * Genera un ID único
 */
function generarId() {
    return 'gestionB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Inicia el seguimiento de posición
 */
function iniciarSeguimiento() {
    console.log("Iniciando seguimiento de posición");
    
    agregarMensajeChat("Sistema", "Iniciando seguimiento de posición...", "sistema");
    
    // Comprobar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
        agregarMensajeChat("Sistema", "Tu navegador no soporta geolocalización.", "sistema");
        actualizarEstadoConexion(false, "Geolocalización no disponible");
        return;
    }
    
    // Activar seguimiento
    seguimientoActivo = true;
    $("#btn-seguimiento").addClass("active");
    
    // Iniciar observación de posición
    watchId = navigator.geolocation.watchPosition(
        posicionActualizada,
        errorPosicion,
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    );
    
    // Actualizar UI
    $("#btn-seguimiento").html('<i class="fas fa-location-arrow text-primary"></i>');
    agregarMensajeChat("Sistema", "Seguimiento de posición activado", "sistema");
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
    $("#btn-seguimiento").removeClass("active");
    $("#btn-seguimiento").html('<i class="fas fa-location-arrow"></i>');
    
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
 */
function posicionActualizada(posicion) {
    console.log("Posición actualizada:", posicion.coords);
    
    const { latitude, longitude, accuracy, heading } = posicion.coords;
    
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
    }
}

/**
 * Maneja errores de geolocalización
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
    actualizarEstadoConexion(false, "Error de posición");
    detenerSeguimiento();
}

/**
 * Actualiza el marcador del usuario
 */
function actualizarMarcadorUsuario(lat, lng, heading) {
    console.log(`Actualizando marcador de usuario a: ${lat}, ${lng}, rumbo: ${heading || 'N/A'}`);
    
    const nuevaPosicion = L.latLng(lat, lng);
    
    // Si el marcador no está en el mapa, añadirlo
    if (!marcadorUsuario || !window.mapa.hasLayer(marcadorUsuario)) {
        // Crear icono con SIDC
        const symbol = new ms.Symbol(elementoTrabajo.sidc, {
            size: 30,
            direction: heading || 0
        });
        
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
        }).addTo(window.mapa);
        
        // Configurar evento de clic para el menú contextual
        marcadorUsuario.on('contextmenu', function(e) {
            mostrarMenuContextual(e, this);
        });
    } else {
        // Actualizar posición
        marcadorUsuario.setLatLng(nuevaPosicion);
        
        // Actualizar dirección si está disponible
        if (heading !== undefined && heading !== null) {
            const symbol = new ms.Symbol(elementoTrabajo.sidc, {
                size: 30,
                direction: heading
            });
            
            marcadorUsuario.setIcon(L.divIcon({
                className: 'custom-div-icon usuario',
                html: symbol.asSVG(),
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }));
        }
    }
    
    // Centrar mapa si el seguimiento está activo
    if (seguimientoActivo) {
        window.mapa.setView(nuevaPosicion);
    }
}

/**
 * Centra el mapa en la posición actual
 */
function centrarEnPosicion() {
    console.log("Centrando mapa en posición actual");
    
    if (marcadorUsuario && window.mapa.hasLayer(marcadorUsuario)) {
        window.mapa.setView(marcadorUsuario.getLatLng(), 15);
    } else {
        // Si no hay marcador, intentar obtener posición actual
        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const { latitude, longitude } = posicion.coords;
                window.mapa.setView([latitude, longitude], 15);
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
    
    // Crear un grupo con todos los marcadores
    const grupo = new L.featureGroup();
    
    // Añadir marcador del usuario
    if (marcadorUsuario && window.mapa.hasLayer(marcadorUsuario)) {
        grupo.addLayer(marcadorUsuario);
    }
    
    // Añadir marcadores de otros elementos
    Object.values(elementosConectados).forEach(elem => {
        if (elem.marcador) {
            grupo.addLayer(elem.marcador);
        }
    });
    
    // Si hay elementos, ajustar el mapa para mostrarlos todos
    if (grupo.getLayers().length > 0) {
        window.mapa.fitBounds(grupo.getBounds(), { padding: [50, 50] });
    } else {
        agregarMensajeChat("Sistema", "No hay elementos para mostrar", "sistema");
    }
}

/**
 * Alterna la visibilidad del panel lateral
 */
function togglePanel() {
    console.log("Alternando visibilidad del panel lateral");
    
    const panel = $("#panel-lateral");
    const boton = $("#boton-panel");
    
    if (panel.hasClass("oculto")) {
        panel.removeClass("oculto");
        boton.html('<i class="fas fa-chevron-right"></i>');
        panelVisible = true;
    } else {
        panel.addClass("oculto");
        boton.html('<i class="fas fa-chevron-left"></i>');
        panelVisible = false;
    }
    
    // Importante: Asegurar que el botón del panel siempre sea visible
    boton.show();
}
/**
 * Conecta con el servidor Socket.IO con soporte para salas de operación
 */
function conectarSocket() {
    console.log("Conectando al servidor para operación:", usuarioInfo.operacion);
    
    // Obtener la URL del servidor desde la configuración global o utilizar localhost
    const serverUrl = window.SERVER_URL || 'http://192.168.1.5:5000';
    
    agregarMensajeChat("Sistema", `Conectando al servidor (Operación: ${usuarioInfo.operacion})...`, "sistema");
    
    try {
        // Inicializar Socket.IO con configuración más robusta
        socket = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['polling', 'websocket'],
            forceNew: true,
            query: {
                userId: usuarioInfo.id,
                operacion: usuarioInfo.operacion
            }
        });
        
        // Configurar eventos de socket
        configurarEventosSocket();
        
        // Añadir eventos específicos para salas de operación
        configurarEventosSocketSala();
        
        console.log("Conexión Socket.IO iniciada para operación:", usuarioInfo.operacion);
    } catch (error) {
        console.error("Error al conectar socket:", error);
        actualizarEstadoConexion(false, "Error al conectar");
        agregarMensajeChat("Sistema", "Error al conectar: " + error.message, "sistema");
        
        // Reintentar después de un tiempo
        setTimeout(conectarSocket, 5000);
    }
}

/**
 * Configura eventos específicos para salas de operación
 */
function configurarEventosSocketSala() {
    // Verificar presencia en sala correcta
    socket.on('verificacion_sala', function(data) {
        if (data.operacion !== usuarioInfo.operacion) {
            // Estamos en la sala incorrecta
            console.error(`Error de sala: Conectado a ${data.operacion} pero deberíamos estar en ${usuarioInfo.operacion}`);
            
            // Desconectar y reconectar a la sala correcta
            socket.disconnect();
            
            // Notificar al usuario
            mostrarNotificacion(`Sala incorrecta. Reconectando a operación "${usuarioInfo.operacion}"...`, "error");
            
            // Reconectar
            setTimeout(conectarSocket, 1000);
        }
    });
    
    // Evento para unirse a sala
    socket.on('connect', function() {
        // Unirse a la sala específica de la operación
        socket.emit('unirse_sala', {
            operacion: usuarioInfo.operacion,
            usuario: usuarioInfo.usuario,
            id: usuarioInfo.id
        });
    });
}

/**
 * Configura los eventos del socket
 */
function configurarEventosSocket() {
    if (!socket) return;
    
    socket.on('connect', () => {
        console.log("Socket conectado");
        actualizarEstadoConexion(true, "Conectado");
        agregarMensajeChat("Sistema", "Conexión establecida con el servidor", "sistema");
        
        // Enviar información inicial
        socket.emit('elementoConectado', {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            operacion: usuarioInfo.operacion,
            elemento: elementoTrabajo,
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('disconnect', () => {
        console.log("Socket desconectado");
        actualizarEstadoConexion(false, "Desconectado");
        agregarMensajeChat("Sistema", "Desconectado del servidor", "sistema");
    });
    
    socket.on('error', (error) => {
        console.error("Error de socket:", error);
        actualizarEstadoConexion(false, "Error de conexión");
        agregarMensajeChat("Sistema", "Error de conexión: " + error.message, "sistema");
    });
    
    socket.on('mensajeChat', (mensaje) => {
        console.log("Mensaje de chat recibido:", mensaje);
        
        // Comprobar si el mensaje tiene el formato esperado
        if (mensaje.emisor && mensaje.emisor.id) {
            // Formato específico de gestión de batalla
            if (mensaje.emisor.id !== usuarioInfo.id) {
                agregarMensajeChat(mensaje.emisor.nombre, mensaje.contenido, "recibido");
            }
        } else if (mensaje.usuario) {
            // Formato del servidor existente
            agregarMensajeChat(mensaje.usuario, mensaje.mensaje, "recibido");
        } else {
            // Formato desconocido, mostrar como sistema
            agregarMensajeChat("Sistema", "Mensaje recibido en formato desconocido", "sistema");
            console.log("Formato de mensaje desconocido:", mensaje);
        }
    });
    
    socket.on('actualizacionPosicion', (datos) => {
        console.log("Actualización de posición recibida:", datos);
        // Actualizar posición de un elemento en el mapa
        actualizarPosicionElemento(datos);
    });
    
    socket.on('nuevoInforme', (informe) => {
        console.log("Nuevo informe recibido:", informe);
        // Agregar nuevo informe recibido
        agregarInforme(informe);
        
        // Notificar al usuario
        if (informe.tipo === 'orden') {
            agregarMensajeChat("Sistema", "Has recibido una nueva orden", "sistema");
            reproducirSonido('nuevaOrden');
        } else if (informe.tipo === 'urgente') {
            agregarMensajeChat("Sistema", "Has recibido un informe urgente", "sistema");
            reproducirSonido('informeUrgente');
        } else {
            agregarMensajeChat("Sistema", "Has recibido un nuevo informe", "sistema");
        }
    });
    
    socket.on('elementosConectados', (elementos) => {
        console.log("Lista de elementos conectados recibida:", elementos);
        // Actualizar lista de elementos conectados
        actualizarElementosConectados(elementos);
    });
    
    socket.on('nuevoElementoConectado', (elemento) => {
        console.log("Nuevo elemento conectado:", elemento);
        // Añadir el elemento a la lista
        agregarElementoConectado(elemento);
    });
    
    socket.on('elementoDesconectado', (elementoId) => {
        console.log("Elemento desconectado:", elementoId);
        // Eliminar elemento de la lista
        eliminarElementoConectado(elementoId);
    });
    
    socket.on('compartirElemento', (datos) => {
        console.log("Elemento compartido recibido:", datos);
        // Añadir elemento compartido al mapa
        agregarElementoCompartido(datos);
    });
    
    // Evento para reconexión automática en caso de caída del servidor
    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Intento de reconexión ${attemptNumber}`);
        actualizarEstadoConexion(false, `Reconectando (${attemptNumber})...`);
    });
    
    socket.on('reconnect', () => {
        console.log("Reconectado al servidor");
        actualizarEstadoConexion(true, "Reconectado");
        agregarMensajeChat("Sistema", "Reconectado al servidor", "sistema");
    });
}

/**
 * Actualiza el estado de conexión en la UI
 */
function actualizarEstadoConexion(conectado, texto) {
    console.log(`Actualizando estado de conexión: ${conectado ? 'Conectado' : 'Desconectado'} - ${texto}`);
    
    const indicadores = $(".indicator");
    const textoStatus = $("#status-text");
    
    if (conectado) {
        indicadores.removeClass("offline").addClass("online");
        textoStatus.text(texto);
    } else {
        indicadores.removeClass("online").addClass("offline");
        textoStatus.text(texto);
    }
}

/**
 * Envía un mensaje de chat
 */
function enviarMensajeChat() {
    console.log("Enviando mensaje de chat");
    
    const mensajeInput = $("#mensaje-chat");
    const contenido = mensajeInput.val().trim();
    
    if (!contenido) return;
    
    // Determinar si es mensaje privado o general
    const esPrivado = $("#btn-chat-privado").hasClass("active");
    const destinatarioId = esPrivado ? $("#select-destinatario").val() : null;
    
    if (esPrivado && !destinatarioId) {
        agregarMensajeChat("Sistema", "Selecciona un destinatario para el mensaje privado", "sistema");
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
        const textoDestinatario = esPrivado ? ` (a ${$("#select-destinatario option:selected").text()})` : '';
        agregarMensajeChat(`Tú${textoDestinatario}`, contenido, "enviado");
        
        // Limpiar input
        mensajeInput.val('');
        mensajeInput.focus();
    } else {
        // Almacenar mensaje para enviar cuando se recupere la conexión
        colaPendiente.mensajes.push(mensaje);
        
        agregarMensajeChat("Sistema", "No estás conectado al servidor. El mensaje se enviará cuando se restablezca la conexión.", "sistema");
        
        // Añadir a la interfaz
        const textoDestinatario = esPrivado ? ` (a ${$("#select-destinatario option:selected").text()})` : '';
        agregarMensajeChat(`Tú${textoDestinatario}`, contenido, "enviado");
        
        // Limpiar input
        mensajeInput.val('');
        mensajeInput.focus();
    }
}
function agregarMensajeChat(emisor, mensaje, tipo) {
    console.log(`Agregando mensaje de chat: ${emisor}: ${mensaje} (${tipo})`);
    
    const chatContainer = $("#chat-messages");
    const claseCSS = tipo === "enviado" ? "message-usuario" : 
                    (tipo === "sistema" ? "message-sistema" : "message-recibido");
    
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const mensajeHTML = `
        <div class="message ${claseCSS}">
            <div><strong>${emisor}</strong> <small>${hora}</small></div>
            <div>${mensaje}</div>
        </div>
    `;
    
    chatContainer.append(mensajeHTML);
    
    // Scroll al final
    chatContainer.scrollTop(chatContainer[0].scrollHeight);
    
    // Si es un mensaje recibido y no es foco de la ventana, mostrar notificación
    if (tipo === "recibido" && document.visibilityState !== "visible") {
        mostrarNotificacionEscritorio(emisor, mensaje);
    }
}

/**
 * Muestra una notificación de escritorio
 */
function mostrarNotificacionEscritorio(titulo, mensaje) {
    console.log(`Mostrando notificación de escritorio: ${titulo}: ${mensaje}`);
    
    // Verificar si las notificaciones están soportadas y permitidas
    if (!("Notification" in window)) {
        console.log("El navegador no soporta notificaciones de escritorio");
        return;
    }
    
    if (Notification.permission === "granted") {
        const notification = new Notification(titulo, {
            body: mensaje,
            icon: '/Client/image/favicon_logoai/favicon-32x32.png'
        });
        
        notification.onclick = function() {
            window.focus();
            this.close();
        };
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                mostrarNotificacionEscritorio(titulo, mensaje);
            }
        });
    }
}

/**
 * Reproduce un sonido de alerta
 */
function reproducirSonido(tipo) {
    console.log(`Reproduciendo sonido: ${tipo}`);
    
    let sonidoSrc;
    switch (tipo) {
        case 'nuevaOrden':
            sonidoSrc = '/Client/sounds/nueva_orden.mp3';
            break;
        case 'informeUrgente':
            sonidoSrc = '/Client/sounds/informe_urgente.mp3';
            break;
        case 'nuevoMensaje':
            sonidoSrc = '/Client/sounds/nuevo_mensaje.mp3';
            break;
        case 'nuevoElemento':
            sonidoSrc = '/Client/sounds/nuevo_elemento.mp3';
            break;
        default:
            sonidoSrc = '/Client/sounds/notificacion.mp3';
    }
    
    const audio = new Audio(sonidoSrc);
    audio.play().catch(e => {
        console.warn("No se pudo reproducir el sonido:", e);
    });
}

/**
 * Envía un informe
 */
function enviarInforme() {
    console.log("Enviando informe");
    
    const tipo = $("#tipo-informe").val();
    const destinatario = $("#destinatario-informe").val();
    const asunto = $("#asunto-informe").val();
    const contenido = $("#contenido-informe").val();
    
    if (!asunto || !contenido) {
        mostrarNotificacion("Debes completar asunto y contenido del informe", "error");
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
        
        // Resetear formulario y volver a vista de informes
        $("#form-informe")[0].reset();
        $("#btn-ver-informes").click();
        
        agregarMensajeChat("Sistema", `Informe "${asunto}" enviado`, "sistema");
    } else {
        // Encolar informe para enviar cuando se recupere la conexión
        colaPendiente.informes.push(informe);
        
        // Añadir a la interfaz
        agregarInforme(informe);
        
        // Resetear formulario y volver a vista de informes
        $("#form-informe")[0].reset();
        $("#btn-ver-informes").click();
        
        agregarMensajeChat("Sistema", `Informe "${asunto}" guardado y se enviará cuando se recupere la conexión`, "sistema");
    }
}

/**
 * Agrega un informe a la lista
 */
function agregarInforme(informe) {
    console.log("Agregando informe:", informe);
    
    const listaInformes = $("#lista-informes");
    const esPropio = informe.emisor.id === usuarioInfo.id;
    
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
    
    const fecha = new Date(informe.timestamp).toLocaleString();
    
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
                ${esPropio ? `Enviado a: ${informe.destinatario === "comando" ? "Comando" : 
                              (informe.destinatario === "todos" ? "Todos" : 
                              (elementosConectados[informe.destinatario]?.datos.usuario || "Desconocido"))}` : 
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
    const informeElement = $(informeHTML);
    listaInformes.prepend(informeElement);
    
    // Configurar evento para el botón de ubicación
    informeElement.find(".btn-ubicacion").click(function() {
        const lat = $(this).data("lat");
        const lng = $(this).data("lng");
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
    });
    
    // Marcar como leído si no es propio
    if (!esPropio && informe.leido === false && socket && socket.connected) {
        setTimeout(() => {
            socket.emit('informeLeido', { informeId: informe.id });
        }, 2000);
    }
}

/**
 * Filtra los informes según el tipo
 */
function filtrarInformes(filtroId) {
    console.log(`Filtrando informes por: ${filtroId}`);
    
    const informes = $(".informe");
    
    switch (filtroId) {
        case "btn-filtro-informes":
            informes.hide();
            informes.filter(function() {
                const tipo = $(this).data("tipo");
                return tipo === "normal" || tipo === "urgente";
            }).show();
            break;
        case "btn-filtro-ordenes":
            informes.hide();
            informes.filter('[data-tipo="orden"]').show();
            break;
        default: // Todos
            informes.show();
            break;
    }
}

/**
 * Actualiza la posición de un elemento en el mapa
 */
function actualizarPosicionElemento(datos) {
    console.log("Actualizando posición de elemento:", datos);
    
    const { id, elemento, posicion } = datos;
    
    // No actualizar si es nuestro propio elemento
    if (id === usuarioInfo.id) return;
    
    // Verificar si ya existe el marcador para este elemento
    if (!elementosConectados[id]) {
        console.log("Creando nuevo marcador para elemento:", elemento);
        
        // Verificar si posicion existe antes de usarla
        if (!posicion) {
            console.warn("El elemento no tiene posición definida:", id);
            return; // Salir de la función si no hay posición
        }
        
        // Crear nuevo marcador
        const symbol = new ms.Symbol(elemento.sidc, {
            size: 30,
            direction: posicion.rumbo || 0
        });
        
        const marcador = L.marker([posicion.lat, posicion.lng], {
            icon: L.divIcon({
                className: 'custom-div-icon elemento',
                html: symbol.asSVG(),
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }),
            title: elemento.nombre,
            sidc: elemento.sidc,
            nombre: elemento.nombre,
            designacion: elemento.designacion,
            dependencia: elemento.dependencia
        }).addTo(window.mapa);
        
        // Añadir popup
        marcador.bindPopup(`
            <strong>${elemento.nombre}</strong><br>
            Usuario: ${datos.usuario}<br>
            Última actualización: ${new Date(datos.timestamp).toLocaleTimeString()}
        `);
        
        // Añadir evento de clic para detalles
        marcador.on('click', function() {
            this.openPopup();
        });
        
        // Añadir evento de clic derecho para menú contextual
        marcador.on('contextmenu', function(e) {
            mostrarMenuContextual(e, this);
        });
        
        // Guardar referencia
        elementosConectados[id] = {
            marcador: marcador,
            datos: datos
        };
    } else {
        console.log("Actualizando marcador existente para elemento:", elemento);
        
        // Actualizar marcador existente
        const marcador = elementosConectados[id].marcador;
        
        // Definir una animación suave para el movimiento
        if (typeof L.Marker.prototype.slideTo === 'function') {
            marcador.slideTo([posicion.lat, posicion.lng], {
                duration: 2000,
                keepAtCenter: false
            });
        } else {
            marcador.setLatLng([posicion.lat, posicion.lng]);
        }
        
        // Actualizar dirección si está disponible
        if (posicion.rumbo !== undefined && posicion.rumbo !== null) {
            const symbol = new ms.Symbol(elemento.sidc, {
                size: 30,
                direction: posicion.rumbo
            });
            
            marcador.setIcon(L.divIcon({
                className: 'custom-div-icon elemento',
                html: symbol.asSVG(),
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }));
        }
        
        // Actualizar popup
        marcador.bindPopup(`
            <strong>${elemento.nombre}</strong><br>
            Usuario: ${datos.usuario}<br>
            Última actualización: ${new Date(datos.timestamp).toLocaleTimeString()}
        `);
        
        // Actualizar datos
        elementosConectados[id].datos = datos;
    }
    
    // Actualizar lista de elementos conectados en el panel
    actualizarListaElementosConectados();
}

/**
 * Actualiza la lista completa de elementos conectados
 */
function actualizarElementosConectados(elementos) {
    console.log("Actualizando lista completa de elementos conectados");
    
    // Limpiar marcadores actuales
    Object.values(elementosConectados).forEach(elem => {
        if (elem.marcador) {
            window.mapa.removeLayer(elem.marcador);
        }
    });
    
    // Restablecer el objeto
    elementosConectados = {};
    
    // Añadir cada elemento
    Object.values(elementos).forEach(datos => {
        // No añadir al usuario actual
        if (datos.id !== usuarioInfo.id) {
            actualizarPosicionElemento(datos);
        }
    });
    
    // Actualizar lista en el panel
    actualizarListaElementosConectados();
    
    // Actualizar selectores
    actualizarSelectoresDestinatario();
    
    // Actualizar conteo
    const totalConectados = Object.keys(elementosConectados).length + 1; // +1 por el usuario actual
    agregarMensajeChat("Sistema", `${totalConectados} elementos conectados a la operación`, "sistema");
}

/**
 * Actualiza la lista de elementos conectados en el panel
 */
function actualizarListaElementosConectados() {
    const listaElementos = $("#lista-elementos");
    listaElementos.empty();
    
    // Añadir el usuario actual primero
    if (usuarioInfo) {
        const itemUsuario = $(`
            <div class="elemento-item usuario-actual">
                <div class="elemento-icon">
                    <div class="elemento-status online"></div>
                </div>
                <div class="elemento-info">
                    <div class="elemento-nombre">${usuarioInfo.elemento.designacion}</div>
                    <div class="elemento-usuario">${usuarioInfo.usuario}</div>
                </div>
                <div class="elemento-acciones">
                    <button class="btn-centrar" title="Centrar en mapa"><i class="fas fa-crosshairs"></i></button>
                </div>
            </div>
        `);
        
        // Botón de centrar
        itemUsuario.find(".btn-centrar").click(function() {
            centrarEnPosicion();
        });
        
        listaElementos.append(itemUsuario);
    }
    
    // Añadir el resto de elementos
    Object.entries(elementosConectados).forEach(([id, datos]) => {
        const elemento = datos.datos.elemento;
        const usuario = datos.datos.usuario;
        const ultimaActualizacion = new Date(datos.datos.timestamp).toLocaleTimeString();
        
        const itemElemento = $(`
            <div class="elemento-item" data-id="${id}">
                <div class="elemento-icon">
                    <div class="elemento-status online"></div>
                </div>
                <div class="elemento-info">
                    <div class="elemento-nombre">${elemento.designacion || elemento.nombre}</div>
                    <div class="elemento-usuario">${usuario}</div>
                    <div class="elemento-tiempo">Última vez: ${ultimaActualizacion}</div>
                </div>
                <div class="elemento-acciones">
                    <button class="btn-centrar" title="Centrar en mapa"><i class="fas fa-crosshairs"></i></button>
                    <button class="btn-detalles" title="Ver detalles"><i class="fas fa-info-circle"></i></button>
                </div>
            </div>
        `);
        
        // Botón de centrar
        itemElemento.find(".btn-centrar").click(function() {
            centrarEnElemento(id);
        });
        
        // Botón de detalles
        itemElemento.find(".btn-detalles").click(function() {
            mostrarDetallesElemento(id);
        });
        
        listaElementos.append(itemElemento);
    });
}

/**
 * Actualiza los selectores de destinatario
 */
function actualizarSelectoresDestinatario() {
    // Actualizar selector de chat
    const selectDestinatario = $("#select-destinatario");
    selectDestinatario.empty();
    selectDestinatario.append('<option value="">Seleccionar destinatario...</option>');
    
    // Actualizar selector de informe
    const selectDestinatarioInforme = $("#destinatario-informe");
    selectDestinatarioInforme.empty();
    selectDestinatarioInforme.append('<option value="comando">Comando</option>');
    selectDestinatarioInforme.append('<option value="todos">Todos</option>');
    
    // Añadir cada elemento
    Object.entries(elementosConectados).forEach(([id, datos]) => {
        const elemento = datos.datos.elemento;
        const usuario = datos.datos.usuario;
        
        selectDestinatario.append(`<option value="${id}">${usuario} (${elemento.designacion || elemento.nombre})</option>`);
        selectDestinatarioInforme.append(`<option value="${id}">${usuario} (${elemento.designacion || elemento.nombre})</option>`);
    });
}

/**
 * Centra el mapa en un elemento específico
 */
function centrarEnElemento(elementoId) {
    console.log(`Centrando mapa en elemento: ${elementoId}`);
    
    if (elementosConectados[elementoId] && elementosConectados[elementoId].marcador) {
        const posicion = elementosConectados[elementoId].marcador.getLatLng();
        window.mapa.setView(posicion, 15);
        elementosConectados[elementoId].marcador.openPopup();
    }
}

/**
 * Muestra los detalles de un elemento
 */
function mostrarDetallesElemento(elementoId) {
    console.log(`Mostrando detalles de elemento: ${elementoId}`);
    
    if (elementosConectados[elementoId]) {
        const datos = elementosConectados[elementoId].datos;
        const elemento = datos.elemento;
        const posicion = datos.posicion;
        
        // Cargar contenido en el modal
        $("#detalles-elemento-contenido").html(`
            <div class="elemento-detalle">
                <div class="elemento-simbolo">
                    ${new ms.Symbol(elemento.sidc, {size: 50}).asSVG()}
                </div>
                <div class="elemento-datos">
                    <p><strong>Designación:</strong> ${elemento.designacion || 'No disponible'}</p>
                    <p><strong>Dependencia:</strong> ${elemento.dependencia || 'No disponible'}</p>
                    <p><strong>Usuario:</strong> ${datos.usuario}</p>
                    <p><strong>Última actualización:</strong> ${new Date(datos.timestamp).toLocaleString()}</p>
                    ${posicion ? `
                    <p><strong>Posición:</strong> Lat: ${posicion.lat.toFixed(6)}, Lng: ${posicion.lng.toFixed(6)}</p>
                    <p><strong>Precisión:</strong> ${posicion.precision ? `${posicion.precision.toFixed(1)} metros` : 'No disponible'}</p>
                    <p><strong>Rumbo:</strong> ${posicion.rumbo ? `${posicion.rumbo.toFixed(1)}°` : 'No disponible'}</p>
                    ` : '<p><strong>Posición:</strong> No disponible</p>'}
                </div>
            </div>
        `);
        
        // Guardar ID del elemento seleccionado
        $('#modalDetallesElemento').data('elementoId', elementoId);
        
        // Configurar botón de centrar
        $("#btn-centrar-elemento").off('click').on('click', function() {
            centrarEnElemento(elementoId);
            $('#modalDetallesElemento').modal('hide');
        });
        
        // Mostrar modal
        $('#modalDetallesElemento').modal('show');
    }
}

/**
 * Busca elementos según texto
 */
function buscarElementos(texto) {
    console.log(`Buscando elementos con texto: ${texto}`);
    
    const resultadosDiv = $("#resultados-busqueda-elementos");
    resultadosDiv.empty();
    
    if (!texto.trim()) return;
    
    const textoBusqueda = texto.toLowerCase();
    const resultados = [];
    
    // Buscar en elementos conectados
    Object.entries(elementosConectados).forEach(([id, datos]) => {
        const elemento = datos.datos.elemento;
        const usuario = datos.datos.usuario;
        
        if (elemento.designacion?.toLowerCase().includes(textoBusqueda) || 
            elemento.dependencia?.toLowerCase().includes(textoBusqueda) || 
            usuario.toLowerCase().includes(textoBusqueda)) {
            
            resultados.push({
                id: id,
                datos: datos.datos
            });
        }
    });
    
    // Añadir resultados a la lista
    if (resultados.length > 0) {
        resultados.forEach(resultado => {
            const elementoItem = $(`
                <a href="#" class="list-group-item list-group-item-action" data-id="${resultado.id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${resultado.datos.elemento.designacion || 'Sin designación'}</h6>
                            <p class="mb-1">${resultado.datos.usuario}</p>
                        </div>
                        <small>${new Date(resultado.datos.timestamp).toLocaleTimeString()}</small>
                    </div>
                </a>
            `);
            
            elementoItem.click(function(e) {
                e.preventDefault();
                const elementoId = $(this).data("id");
                centrarEnElemento(elementoId);
                $('#modalBuscarElemento').modal('hide');
            });
            
            resultadosDiv.append(elementoItem);
        });
    } else {
        resultadosDiv.append('<div class="list-group-item">No se encontraron elementos</div>');
    }
}

/**
 * Añade un elemento compartido al mapa
 */
function agregarElementoCompartido(datos) {
    const elemento = datos.elemento;
    
    if (!elemento.posicion) {
        agregarMensajeChat("Sistema", `${datos.emisor.nombre} ha compartido un elemento sin posición`, "sistema");
        return;
    }
    
    // Crear símbolo
    const symbol = new ms.Symbol(elemento.sidc, {
        size: 30
    });
    
    // Crear marcador
    const marcador = L.marker([elemento.posicion.lat, elemento.posicion.lng], {
        icon: L.divIcon({
            className: 'custom-div-icon compartido',
            html: symbol.asSVG(),
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        }),
        title: elemento.nombre,
        sidc: elemento.sidc,
        nombre: elemento.nombre,
        designacion: elemento.designacion,
        dependencia: elemento.dependencia,
        compartidoPor: elemento.compartidoPor
    }).addTo(window.mapa);
    
    // Añadir popup con información
    marcador.bindPopup(`
        <strong>${elemento.nombre}</strong><br>
        Compartido por: ${elemento.compartidoPor || datos.emisor.nombre}<br>
        ${new Date().toLocaleTimeString()}
    `).openPopup();
    
    // Añadir evento de clic derecho para menú contextual
    marcador.on('contextmenu', function(e) {
        mostrarMenuContextual(e, this);
    });
    
    // Animar brevemente el marcador para destacarlo
    const initialOpacity = marcador.options.opacity || 1;
    marcador.setOpacity(0.1);
    
    // Animación simple de aparición
    let opacity = 0.1;
    const interval = setInterval(() => {
        opacity += 0.05;
        marcador.setOpacity(opacity);
        if (opacity >= initialOpacity) {
            clearInterval(interval);
            marcador.setOpacity(initialOpacity);
        }
    }, 50);
    
    // Notificar al usuario
    agregarMensajeChat("Sistema", `${datos.emisor.nombre} ha compartido un elemento: ${elemento.nombre}`, "sistema");
    reproducirSonido('nuevoElemento');
}

/**
 * Muestra una notificación en la parte superior de la pantalla
 */
function mostrarNotificacion(mensaje, tipo = "info") {
    const existingNotifications = document.querySelectorAll('.notificacion');
    existingNotifications.forEach(n => n.remove());
    
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <div class="notificacion-mensaje">${mensaje}</div>
        <button class="notificacion-cerrar">&times;</button>
    `;
    
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => {
        notificacion.classList.add('show');
    }, 10);
    
    // Cerrar al hacer clic
    notificacion.querySelector('.notificacion-cerrar').addEventListener('click', () => {
        notificacion.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        }, 300);
    });
    
    // Cerrar automáticamente
    setTimeout(() => {
        if (document.body.contains(notificacion)) {
            notificacion.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notificacion)) {
                    document.body.removeChild(notificacion);
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Agrega un elemento conectado a la lista
 */
function agregarElementoConectado(datos) {
    // No añadir si ya existe o es el usuario actual
    if (elementosConectados[datos.id] || datos.id === usuarioInfo.id) return;
    
    // Actualizar posición (esto también lo añade a elementosConectados)
    actualizarPosicionElemento(datos);
    
    // Notificar
    agregarMensajeChat("Sistema", `${datos.usuario} (${datos.elemento.nombre}) se ha conectado`, "sistema");
}

/**
 * Elimina un elemento conectado de la lista
 */
function eliminarElementoConectado(elementoId) {
    if (elementosConectados[elementoId]) {
        const datos = elementosConectados[elementoId].datos;
        
        // Eliminar marcador del mapa
        if (elementosConectados[elementoId].marcador) {
            window.mapa.removeLayer(elementosConectados[elementoId].marcador);
        }
        
        // Guardar info para notificación
        const nombreUsuario = datos.usuario;
        const nombreElemento = datos.elemento.nombre;
        
        // Eliminar de la lista
        delete elementosConectados[elementoId];
        
        // Actualizar interfaz
        actualizarListaElementosConectados();
        actualizarSelectoresDestinatario();
        
        // Notificar
        agregarMensajeChat("Sistema", `${nombreUsuario} (${nombreElemento}) se ha desconectado`, "sistema");
    }
}

// Guardar función original de toggleMenu si existe para compatibilidad
const originalToggleMenu = window.toggleMenu;

// Exportar funciones necesarias al ámbito global
window.gestionBatalla = {
    toggleSeguimiento: toggleSeguimiento,
    centrarEnPosicion: centrarEnPosicion,
    mostrarTodosElementos: mostrarTodosElementos,
    enviarMensajeChat: enviarMensajeChat,
    enviarInforme: enviarInforme,
    buscarElementos: buscarElementos,
    togglePanel: togglePanel,
    mostrarMenuContextual: mostrarMenuContextual,
    compartirElemento: compartirElemento,
    toggleMenuMejorado: toggleMenuMejorado
};

// Reemplazar toggleMenu global para asegurar compatibilidad
window.toggleMenu = function(menuId) {
    return toggleMenuMejorado(menuId);
};

// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado - Inicializando Gestión de Batalla");
    
    // Verificar parámetros de URL para operación predefinida
    const operacionUrl = obtenerOperacionDeUrl();
    if (operacionUrl) {
        console.log(`Operación detectada en URL: ${operacionUrl}`);
        precargarOperacion(operacionUrl);
    }
    
    // Cargar historial de operaciones
    cargarHistorialOperaciones();
    
    // Verificar si hay sesión guardada para restaurar
    const sesionRestaurada = restaurarSesion();
    
    // Si se restauró sesión, conectar directamente
    if (sesionRestaurada && usuarioInfo) {
        // Mostrar contenido principal
        $("#login-container").hide();
        $("#main-content").show();
        
        // Inicializar mapa si es necesario
        if (typeof window.inicializarMapa === 'function') {
            window.inicializarMapa();
        }
        
        // Inicializar interfaz
        inicializarInterfazCompleta();
        
        // Conectar socket
        conectarSocket();
        
        // Iniciar seguimiento
        iniciarSeguimiento();
    }
});