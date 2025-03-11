/**
 * conexionesCO.js - Funciones para gestionar conexiones entre elementos
 * Parte del sistema de Cuadro de Organización Militar
 */

// Variables globales relacionadas a conexiones
var enModoConexion = false;
var connectionSource = null;

/**
 * Inicializa las funcionalidades de conexión
 */
function inicializarConexiones() {
    // Agregar botón de conexión si no existe
    agregarBotonConexion();
    
    // Configurar teclas de escape para cancelar conexión
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && enModoConexion) {
            cancelarModoConexion();
        }
    });
}

/**
 * Agrega un botón para crear conexiones en la barra de herramientas
 */
function agregarBotonConexion() {
    var botonesSecundarios = document.getElementById('botones-secundarios');
    if (!botonesSecundarios) return;
    
    // Verificar si ya existe el botón
    if (document.getElementById('crearConexionBtn')) return;
    
    // Crear botón de conexión
    var conexionBtn = document.createElement('button');
    conexionBtn.id = 'crearConexionBtn';
    conexionBtn.innerHTML = '<i class="fas fa-link"></i>';
    conexionBtn.title = 'Crear conexión entre elementos';
    
    // Agregar al contenedor
    botonesSecundarios.appendChild(conexionBtn);
    
    // Configurar evento
    conexionBtn.addEventListener('click', function() {
        if (enModoConexion) {
            cancelarModoConexion();
        } else {
            iniciarConexion();
        }
    });
    
    // Crear div para mensajes de ayuda si no existe
    if (!document.getElementById('mensaje-temporal')) {
        var mensajeDiv = document.createElement('div');
        mensajeDiv.id = 'mensaje-temporal';
        mensajeDiv.className = 'mensaje-temporal';
        mensajeDiv.style.display = 'none';
        document.body.appendChild(mensajeDiv);
    }
}

/**
 * Inicia el modo de conexión
 */
/**
 * Inicia el modo de conexión
 */
function iniciarConexion() {
    console.log("Iniciando modo de conexión");
    
    if (!window.selectedElement) {
        mostrarMensaje('Primero seleccione un elemento para iniciar la conexión.', 'warning');
        return;
    }
    
    enModoConexion = true;
    connectionSource = window.selectedElement;
    connectionSource.classList.add('connection-source');
    
    // Activar visualmente el botón de conexión
    var conBtn = document.getElementById('crearConexionBtn');
    if (conBtn) {
        conBtn.classList.add('active');
        console.log("Botón de conexión activado");
    } else {
        console.warn("Botón de conexión no encontrado al activar");
    }
    
    // Cambiar el cursor para indicar modo conexión
    document.body.classList.add('modo-conexion');
    
    // Mostrar mensaje de ayuda
    mostrarMensaje('Seleccione otro elemento para crear una conexión. Presione ESC para cancelar.', 'info');
}

/**
 * Cancela el modo de conexión
 */
/**
 * Cancela el modo de conexión
 */
function cancelarModoConexion() {
    console.log("Cancelando modo de conexión");
    
    if (!connectionSource) {
        console.warn("No hay elemento origen para cancelar");
        return;
    }
    
    connectionSource.classList.remove('connection-source');
    connectionSource = null;
    enModoConexion = false;
    
    // Desactivar botón de conexión
    var conBtn = document.getElementById('crearConexionBtn');
    if (conBtn) {
        conBtn.classList.remove('active');
        console.log("Botón de conexión desactivado");
    } else {
        console.warn("Botón de conexión no encontrado al desactivar");
    }
    
    // Restaurar cursor
    document.body.classList.remove('modo-conexion');
    
    // Ocultar mensaje de ayuda
    ocultarMensaje();
}

/**
 * Maneja el clic en un elemento durante el modo de conexión
 * @param {Object} elemento - Elemento DOM en el que se hizo clic
 */
function manejarClickEnModoConexion(elemento) {
    if (!connectionSource) {
        // Primer clic: seleccionar origen
        connectionSource = elemento;
        connectionSource.classList.add('connection-source');
        mostrarMensaje('Ahora seleccione el elemento destino para completar la conexión.', 'info');
    } else if (connectionSource === elemento) {
        // Click en el mismo elemento: cancelar
        cancelarModoConexion();
    } else {
        // Segundo clic: crear conexión
        crearConexion(connectionSource, elemento);
        
        // Mostrar mensaje de éxito
        mostrarMensaje('Conexión creada correctamente', 'success');
        
        // Resetear estado después de un breve momento
        setTimeout(function() {
            cancelarModoConexion();
        }, 1500);
    }
}

/**
 * Crea una conexión entre dos elementos
 * @param {Object} origen - Elemento DOM de origen
 * @param {Object} destino - Elemento DOM de destino
 * @returns {Object} - Objeto de conexión creado
 */
function crearConexion(origen, destino) {
    // Determinar tipo de conexión (jerárquica o coordinación)
    var tipoConexion = determinarTipoConexion(origen, destino);
    
    var conexion;
    if (tipoConexion === 'jerarquica') {
        // Conexión jerárquica (subordinación)
        conexion = window.jsPlumbInstance.connect({
            source: origen.id,
            target: destino.id,
            anchors: ["Bottom", "Top"],
            connector: ["Flowchart", { cornerRadius: 5, stub: [10, 30] }],
            paintStyle: { stroke: "#456", strokeWidth: 2 },
            overlays: [
                ["Arrow", { location: 1, width: 10, length: 10, foldback: 0.7 }]
            ]
        });
    } else {
        // Conexión de coordinación
        conexion = window.jsPlumbInstance.connect({
            source: origen.id,
            target: destino.id,
            anchors: ["Right", "Left"],
            connector: ["Flowchart", { cornerRadius: 5 }],
            paintStyle: { stroke: "#456", strokeWidth: 2, dashstyle: "2 2" }
        });
    }
    
    // Registrar para deshacer
    if (conexion && window.registrarAccion) {
        window.registrarAccion({
            tipo: 'conectar',
            conexion: {
                sourceId: origen.id,
                targetId: destino.id,
                tipoConexion: tipoConexion
            }
        });
        
        if (window.actualizarBotonesHistorial) {
            window.actualizarBotonesHistorial();
        }
    }
    
    return conexion;
}

/**
 * Determina el tipo de conexión basado en los elementos
 * @param {Object} origen - Elemento DOM de origen
 * @param {Object} destino - Elemento DOM de destino
 * @returns {string} - Tipo de conexión ('jerarquica' o 'coordinacion')
 */
function determinarTipoConexion(origen, destino) {
    // En esta versión simplificada, asumimos que es jerárquica si el origen
    // está por encima del destino visualmente, de lo contrario es coordinación
    var origenRect = origen.getBoundingClientRect();
    var destinoRect = destino.getBoundingClientRect();
    
    // Si el origen está por encima del destino, es jerárquica (subordinación)
    if (origenRect.bottom < destinoRect.top) {
        return 'jerarquica';
    } 
    // Si están aproximadamente al mismo nivel vertical, es coordinación
    else if (Math.abs(origenRect.top - destinoRect.top) < 100) {
        return 'coordinacion';
    }
    // Por defecto, es jerárquica
    return 'jerarquica';
}

/**
 * Muestra un mensaje de ayuda temporal
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - Tipo de mensaje ('info', 'warning', 'error', 'success')
 */
function mostrarMensaje(mensaje, tipo) {
    tipo = tipo || 'info';
    var msgContainer = document.getElementById('mensaje-temporal');
    
    if (!msgContainer) {
        msgContainer = document.createElement('div');
        msgContainer.id = 'mensaje-temporal';
        msgContainer.className = 'mensaje-temporal';
        document.body.appendChild(msgContainer);
    }
    
    // Asignar clase según el tipo
    msgContainer.className = 'mensaje-temporal mensaje-' + tipo;
    
    // Establecer texto y mostrar
    msgContainer.textContent = mensaje;
    msgContainer.style.display = 'block';
    
    // Auto-ocultarse después de 3 segundos
    clearTimeout(window.mensajeTimeout);
    window.mensajeTimeout = setTimeout(function() {
        ocultarMensaje();
    }, 3000);
}

/**
 * Oculta el mensaje temporal
 */
function ocultarMensaje() {
    var msgContainer = document.getElementById('mensaje-temporal');
    if (msgContainer) {
        msgContainer.style.display = 'none';
    }
}

// Exportar funciones para uso en CO.js
window.inicializarConexiones = inicializarConexiones;
window.iniciarConexion = iniciarConexion;
window.manejarClickEnModoConexion = manejarClickEnModoConexion;
window.cancelarModoConexion = cancelarModoConexion;
window.mostrarMensaje = mostrarMensaje;
window.ocultarMensaje = ocultarMensaje;