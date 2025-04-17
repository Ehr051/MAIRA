// Variables globales
let socket;
let usuarioInfo = null;
let elementoInfo = null;
let operacionesActivas = [];
let operacionSeleccionada = null;
let usuariosConectados = [];


// Inicialización de namespace global
window.MAIRA = window.MAIRA || {};

// Si se espera que UserIdentity exista
window.MAIRA.UserIdentity = window.MAIRA.UserIdentity || {
    // Implementación básica de fallback
    loadFromStorage: function() { 
        console.warn("MAIRA.UserIdentity real no está disponible");
        return null; 
    },
    initialize: function(userId, username, elementoTrabajo) {
        console.warn("MAIRA.UserIdentity real no está disponible");
        // Almacenar en localStorage como alternativa
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
        if (elementoTrabajo) {
            localStorage.setItem('elemento_trabajo', JSON.stringify(elementoTrabajo));
        }
    },
    getUserId: function() {
        return localStorage.getItem('userId');
    },
    getUsername: function() {
        return localStorage.getItem('username') || "Usuario";
    }
};
// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sala de espera para Gestión de Batalla');
    
    // Conectar con el servidor
    iniciarConexion();
    
    // Configurar eventos de interfaz
    configurarEventos();
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    // Inicializar preview SIDC
    inicializarPreviewSIDC();

    setInterval(verificarOperacionesInactivas, 5 * 60 * 1000);
});



/**
 * Obtiene la URL del servidor
 */
function obtenerURLServidor() {
    if (window.SERVER_URL) {
        return window.SERVER_URL;
    }
    
    const currentHost = window.location.hostname;
    const probablePort = "5000";
    
    return `http://${currentHost}:${probablePort}`;
}

/**
 * Configura los eventos de la interfaz
 */
function configurarEventos() {
    // Botón de crear operación
    document.getElementById('crearOperacion').addEventListener('click', function() {
        document.getElementById('operacionesPanel').style.display = 'none';
        document.getElementById('formCrearOperacion').style.display = 'block';
    });
    
    // Cancelar creación de operación
    document.getElementById('cancelarCrearOperacion').addEventListener('click', function() {
        document.getElementById('formCrearOperacion').style.display = 'none';
        document.getElementById('operacionesPanel').style.display = 'block';
    });
    
    // Enviar formulario de nueva operación
    document.getElementById('nuevaOperacionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        crearNuevaOperacion();
    });
    
    // Cancelar unirse a operación
    document.getElementById('cancelarUnirseOperacion').addEventListener('click', function() {
        document.getElementById('configuracionElemento').style.display = 'none';
        document.getElementById('operacionesPanel').style.display = 'block';
    });
    
    // Enviar formulario de elemento para unirse a operación
    document.getElementById('elementoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        unirseOperacionExistente();
    });
    
    // Botón de unirse a operación desde detalles
    document.getElementById('unirseOperacionExistente').addEventListener('click', function() {
        if (!operacionSeleccionada) {
            mostrarError('No hay operación seleccionada');
            return;
        }
        
        document.getElementById('detallesOperacion').style.display = 'none';
        document.getElementById('nombreOperacionSeleccionada').querySelector('span').textContent = operacionSeleccionada.nombre;
        document.getElementById('configuracionElemento').style.display = 'block';
    });
    
    // Cerrar detalles de operación
    document.getElementById('cerrarDetallesOperacion').addEventListener('click', function() {
        document.getElementById('detallesOperacion').style.display = 'none';
        document.getElementById('operacionesPanel').style.display = 'block';
    });
    
    // Enviar mensaje de chat
    document.getElementById('btnEnviarMensaje').addEventListener('click', enviarMensaje);
    document.getElementById('inputChat').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            enviarMensaje();
        }
    });
    
    // Botón para volver al menú principal
    document.getElementById('btnVolver').addEventListener('click', function() {
        window.location.href = '/index.html';
    });
}

/**
 * Carga datos iniciales de localStorage
 */
function cargarDatosIniciales() {
    // Intentar recuperar información de usuario desde UserIdentity
    const usuarioInfo = MAIRA.UserIdentity.loadFromStorage();

    if (usuarioInfo) {
        try {
            document.getElementById('idUsuarioActual').textContent = usuarioInfo.id || '';
            document.getElementById('nombreUsuario').value = usuarioInfo.usuario || '';
        } catch (error) {
            console.error('Error al cargar información del usuario desde UserIdentity:', error);
        }
    } else {
        console.warn("No se encontró información de usuario en MAIRA.UserIdentity");
    }
}


/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = mensaje;
    errorContainer.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

/**
 * Muestra un mensaje del sistema en el chat
 * @param {string} mensaje - Mensaje del sistema
 */
function mostrarMensajeSistema(mensaje) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-system';
    messageDiv.textContent = mensaje;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// Añadir esto a inicioGBhandler.js, cerca de la función cargarDatosIniciales()
function verificarYLimpiarDatosAnteriores() {
    console.log("Verificando datos anteriores en localStorage...");
    
    // Verificar si hay una operación guardada
    const operacionGuardada = localStorage.getItem('gb_operacion_seleccionada');
    if (!operacionGuardada) {
        console.log("No hay operación guardada, limpiando datos huérfanos");
        limpiarDatosHuerfanos();
        return;
    }
    
    try {
        // Verificar si la operación es válida
        const datosOperacion = JSON.parse(operacionGuardada);
        const nombreOperacion = datosOperacion.nombre;
        
        // Preguntar al usuario si desea recuperar la sesión anterior
        if (confirm(`Se encontró una sesión anterior en la operación "${nombreOperacion}". ¿Desea recuperarla?\n\nSi selecciona "Cancelar", se limpiarán los datos de la sesión anterior.`)) {
            // Si el usuario quiere recuperar, simplemente guardamos el estado
            localStorage.setItem('en_operacion_gb', 'true');
            console.log(`✅ Usuario eligió recuperar sesión de operación "${nombreOperacion}"`);
        } else {
            // Si no, limpiamos todo
            limpiarLocalStorageOperacion(nombreOperacion);
            limpiarDatosHuerfanos();
            console.log(`✅ Usuario eligió NO recuperar sesión, datos limpiados`);
        }
    } catch (e) {
        console.error(`Error al procesar operación guardada: ${e}`);
        limpiarDatosHuerfanos();
    }
}


/**
 * Actualiza la lista de operaciones en la interfaz
 */
// Reemplazar en inicioGBhandler.js - función actualizarListaOperaciones
function actualizarListaOperaciones() {
    const listaOperaciones = document.querySelector('#listaOperaciones .list-group');
    listaOperaciones.innerHTML = '';
    
    if (operacionesActivas.length === 0) {
        const noOperaciones = document.createElement('div');
        noOperaciones.className = 'alert alert-info';
        noOperaciones.textContent = 'No hay operaciones activas. ¡Crea una nueva!';
        listaOperaciones.appendChild(noOperaciones);
        return;
    }
    
    operacionesActivas.forEach(operacion => {
        const operacionItem = document.createElement('div');
        operacionItem.className = 'operation-item';
        operacionItem.innerHTML = `
            <div class="operation-main">
                <div class="operation-name">${operacion.nombre}</div>
                <div class="operation-info">
                    <small>${operacion.participantes || 0} participantes · Creada por ${operacion.creador || 'Desconocido'}</small>
                </div>
            </div>
            <div class="operation-actions">
                <button class="btn btn-sm btn-info btn-details" data-id="${operacion.id}">
                    <i class="fas fa-info-circle"></i> Detalles
                </button>
                <button class="btn btn-sm btn-success btn-join" data-id="${operacion.id}">
                    <i class="fas fa-sign-in-alt"></i> Unirse
                </button>
            </div>
        `;
        
        // Agregar botón de eliminar si el usuario es el creador
        crearBotonEliminarOperacion(operacionItem, operacion);
        
        // Eventos para botones de detalles y unirse
        const btnDetalles = operacionItem.querySelector('.btn-details');
        const btnUnirse = operacionItem.querySelector('.btn-join');
        btnDetalles.addEventListener('click', function() {
            const operacionId = this.getAttribute('data-id');
            const operacion = operacionesActivas.find(op => op.id === operacionId);
            if (operacion) {
                operacionSeleccionada = operacion;
                mostrarDetallesOperacion(operacion);
            }
        });
        
        btnUnirse.addEventListener('click', function() {
            const operacionId = this.getAttribute('data-id');
            const operacion = operacionesActivas.find(op => op.id === operacionId);
            if (operacion) {
                operacionSeleccionada = operacion;
                document.getElementById('operacionesPanel').style.display = 'none';
                document.getElementById('nombreOperacionSeleccionada').querySelector('span').textContent = operacion.nombre;
                document.getElementById('configuracionElemento').style.display = 'block';
            }
        });
        
        listaOperaciones.appendChild(operacionItem);
    });
}

/**
 * Actualiza la lista de usuarios conectados
 */
function actualizarListaUsuarios() {
    const listaUsuarios = document.getElementById('listaUsuarios');
    listaUsuarios.innerHTML = '';
    
    if (usuariosConectados.length === 0) {
        const noUsuarios = document.createElement('li');
        noUsuarios.className = 'list-group-item text-center';
        noUsuarios.textContent = 'No hay usuarios conectados';
        listaUsuarios.appendChild(noUsuarios);
        return;
    }
    
    usuariosConectados.forEach(usuario => {
        const usuarioItem = document.createElement('li');
        usuarioItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Si el usuario está en una operación, mostrar esa info
        const infoOperacion = usuario.operacion ? 
            ` <span class="badge badge-primary">${usuario.operacion}</span>` : '';
            
        usuarioItem.innerHTML = `
            <div>
                <i class="fas fa-user"></i> ${usuario.nombre}
                ${infoOperacion}
            </div>
            <span class="badge badge-success">Conectado</span>
        `;
        
        listaUsuarios.appendChild(usuarioItem);
    });
}

/**
 * Muestra los detalles de una operación
 * @param {Object} operacion - Datos de la operación
 */
function mostrarDetallesOperacion(operacion) {
    document.getElementById('operacionesPanel').style.display = 'none';
    document.getElementById('detallesOperacion').style.display = 'block';
    
    document.getElementById('tituloDetallesOperacion').textContent = operacion.nombre;
    document.getElementById('descripcionDetallesOperacion').textContent = operacion.descripcion || 'Sin descripción';
    document.getElementById('areaDetallesOperacion').textContent = operacion.area || 'No especificada';
    document.getElementById('participantesDetallesOperacion').textContent = 
        operacion.participantes ? `${operacion.participantes} participantes` : 'Sin participantes';
    
    // Actualizar tabla de elementos
    const tablaElementos = document.getElementById('elementosOperacion');
    tablaElementos.innerHTML = '';
    
    if (!operacion.elementos || operacion.elementos.length === 0) {
        const fila = document.createElement('tr');
        fila.innerHTML = '<td colspan="2" class="text-center">No hay elementos en esta operación</td>';
        tablaElementos.appendChild(fila);
    } else {
        operacion.elementos.forEach(elemento => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${elemento.usuario || 'Desconocido'}</td>
                <td>${elemento.designacion || 'Sin designación'}${elemento.dependencia ? '/' + elemento.dependencia : ''}</td>
            `;
            tablaElementos.appendChild(fila);
        });
    }
}



// Simplificar inicializarPreviewSIDC para un elemento básico predeterminado
// Función actualizada para inicializar el preview con la designación/dependencia a la derecha
function inicializarPreviewSIDC() {
    console.log("Inicializando preview SIDC con elemento básico");
    
    // Referencias a los elementos del formulario
    const designacionInput = document.getElementById('elemento-designacion');
    const dependenciaInput = document.getElementById('elemento-dependencia');
    const previewDiv = document.getElementById('sidc-preview');
    
    if (!previewDiv) {
        console.error("No se encontró el elemento de preview");
        return;
    }
    
    // Definir un SIDC básico predeterminado (Unidad de Infantería Amiga)
    const sidc_basico = "SFGPUCI-----"; // Unidad de Infantería Amiga
    
    // Actualizar preview cuando cambien los campos de texto
    designacionInput.addEventListener('input', actualizarPreview);
    dependenciaInput.addEventListener('input', actualizarPreview);
    
    // Función para actualizar el preview
    function actualizarPreview() {
        if (!window.ms) {
            console.error("milsymbol no disponible para actualizar preview");
            previewDiv.innerHTML = "<p>Cargando biblioteca de símbolos...</p>";
            return;
        }
        
        // Obtener valores
        const designacion = designacionInput.value || '';
        const dependencia = dependenciaInput.value || '';
        
        // Crear y mostrar símbolo
        try {
            const sym = new ms.Symbol(sidc_basico, {
                size: 35,
                // Dejar el campo designación vacío
                uniqueDesignation: "",
                // Colocar tanto designación como dependencia en el campo de higherFormation
                higherFormation: designacion + (dependencia ? '/' + dependencia : '')
            });
            
            previewDiv.innerHTML = sym.asSVG();
            
            // Guardar SIDC para uso posterior
            previewDiv.setAttribute('data-sidc', sidc_basico);
            
            // Añadir texto con SIDC para debug
            const infoDiv = document.createElement('div');
            infoDiv.style.fontSize = '10px';
            infoDiv.style.marginTop = '5px';
            infoDiv.textContent = 'SIDC: ' + sidc_basico + ' (Infantería Amiga)';
            previewDiv.appendChild(infoDiv);
            
            // Añadir nota sobre edición posterior
            const notaDiv = document.createElement('div');
            notaDiv.className = 'alert alert-info mt-2';
            notaDiv.style.fontSize = '12px';
            notaDiv.innerHTML = 'Podrás editar completamente este elemento una vez estés en el mapa.';
            previewDiv.appendChild(notaDiv);
        } catch (error) {
            console.error("Error al generar símbolo:", error);
            previewDiv.innerHTML = "<p>Error al generar símbolo: " + error.message + "</p>";
        }
    }
    
    // Actualizar preview inicial
    setTimeout(actualizarPreview, 500);
    
    // Guardar función para acceso global
    window.actualizarPreview = actualizarPreview;
}

// Funciones auxiliares para añadir campos faltantes
function agregarCampoAfiliacion() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="afiliacion">Afiliación:</label>
        <select id="afiliacion" class="form-control">
            <option value="F">Amigo</option>
            <option value="H">Hostil</option>
            <option value="N">Neutral</option>
            <option value="U">Desconocido</option>
        </select>
    `;
    
    const primeraSeccion = document.querySelector('.form-section');
    const primerCampo = primeraSeccion.querySelector('.form-group');
    primeraSeccion.insertBefore(container, primerCampo);
}

function agregarCampoEstado() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="estado">Estado:</label>
        <select id="estado" class="form-control">
            <option value="P">Presente</option>
            <option value="A">Anticipado/Planeado</option>
        </select>
    `;
    
    const afiliacionGroup = document.getElementById('afiliacion').closest('.form-group');
    afiliacionGroup.parentNode.insertBefore(container, afiliacionGroup.nextSibling);
}

function agregarCampoTipo() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="tipo">Tipo:</label>
        <select id="tipo" class="form-control">
            <!-- Se llenará dinámicamente -->
        </select>
    `;
    
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup.nextSibling);
}

function agregarCampoCaracteristica() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="caracteristica">Característica:</label>
        <select id="caracteristica" class="form-control">
            <!-- Se llenará dinámicamente -->
        </select>
    `;
    
    const tipoGroup = document.getElementById('tipo').closest('.form-group');
    tipoGroup.parentNode.insertBefore(container, tipoGroup.nextSibling);
}



// Función para crear campo de identidad
function crearCampoIdentidad() {
    // Crear contenedor
    const container = document.createElement('div');
    container.className = 'form-group';
    
    // Crear etiqueta
    const label = document.createElement('label');
    label.textContent = 'Identidad:';
    label.htmlFor = 'elemento-identidad';
    
    // Crear select
    const select = document.createElement('select');
    select.id = 'elemento-identidad';
    select.className = 'form-control';
    
    // Añadir opciones
    const opciones = [
        { value: 'F', text: 'Amigo' },
        { value: 'H', text: 'Hostil' },
        { value: 'N', text: 'Neutral' },
        { value: 'U', text: 'Desconocido' }
    ];
    
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.text;
        select.appendChild(option);
    });
    
    // Seleccionar "Amigo" por defecto
    select.value = 'F';
    
    // Agregar elementos al contenedor
    container.appendChild(label);
    container.appendChild(select);
    
    // Insertar antes del campo de arma
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup);
    
    return select;
}

// Función para crear campo de dimensión de batalla
function crearCampoDimension() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = 'Dimensión:';
    label.htmlFor = 'elemento-dimension';
    
    const select = document.createElement('select');
    select.id = 'elemento-dimension';
    select.className = 'form-control';
    
    const opciones = [
        { value: 'G', text: 'Terrestre' },
        { value: 'A', text: 'Aéreo' },
        { value: 'S', text: 'Superficie (Naval)' },
        { value: 'U', text: 'Submarino' },
        { value: 'P', text: 'Espacio' }
    ];
    
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.text;
        select.appendChild(option);
    });
    
    select.value = 'G';
    
    container.appendChild(label);
    container.appendChild(select);
    
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup);
    
    return select;
}

// Función para crear campo de estado
function crearCampoEstado() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = 'Estado:';
    label.htmlFor = 'elemento-estado';
    
    const select = document.createElement('select');
    select.id = 'elemento-estado';
    select.className = 'form-control';
    
    const opciones = [
        { value: 'P', text: 'Presente' },
        { value: 'A', text: 'Anticipado/Planeado' }
    ];
    
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.text;
        select.appendChild(option);
    });
    
    select.value = 'P';
    
    container.appendChild(label);
    container.appendChild(select);
    
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup);
    
    return select;
}

/**
 * Carga opciones de armas desde unidadesMilitares
 * @param {HTMLSelectElement} selectElement - Elemento select a poblar
 */
function cargarOpcionesArmas(selectElement) {
    selectElement.innerHTML = ''; // Limpiar opciones
    
    // Añadir opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar arma...";
    selectElement.appendChild(defaultOption);
    
    // Añadir opciones de armas por categoría
    Object.entries(window.unidadesMilitares).forEach(([categoria, armas]) => {
        // Crear grupo de opciones para esta categoría
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoria;
        
        // Añadir cada arma como una opción
        Object.entries(armas).forEach(([arma, detalles]) => {
            const option = document.createElement('option');
            option.value = detalles.codigo; // Usar el código directamente
            option.textContent = arma;
            option.setAttribute('data-categoria', categoria);
            optgroup.appendChild(option);
        });
        
        selectElement.appendChild(optgroup);
    });
}

/**
 * Carga opciones básicas de armas
 * @param {HTMLSelectElement} selectElement - Elemento select a poblar
 */
function cargarOpcionesBasicas(selectElement) {
    const opcionesBasicas = [
        { value: "CI", text: "Infantería" },
        { value: "CR", text: "Caballería" },
        { value: "CF", text: "Artillería" },
        { value: "CE", text: "Ingenieros" },
        { value: "US", text: "Comunicaciones" }
    ];
    
    // Limpiar opciones existentes
    selectElement.innerHTML = '';
    
    // Añadir opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar arma...";
    selectElement.appendChild(defaultOption);
    
    // Añadir opciones básicas
    opcionesBasicas.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.value;
        option.textContent = opcion.text;
        selectElement.appendChild(option);
    });
}

/**
 * Carga el script de unidadesMilitares dinámicamente
 * @returns {Promise} Promesa que se resuelve cuando se carga el script
 */
function cargarScriptUnidadesMilitares() {
    return new Promise((resolve, reject) => {
        if (window.unidadesMilitares) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/Client/js/edicioncompleto.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Carga el script de milsymbol dinámicamente
 * @returns {Promise} Promesa que se resuelve cuando se carga el script
 */
function cargarScriptMilsymbol() {
    return new Promise((resolve, reject) => {
        if (window.ms) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/node_modules/milsymbol/dist/milsymbol.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}


/**
 * Envía un mensaje de chat
 */
function enviarMensaje() {
    const inputChat = document.getElementById('inputChat');
    const mensaje = inputChat.value.trim();
    
    if (!mensaje) return;
    
    // Crear objeto de mensaje
    const mensajeObj = {
        usuario: usuarioInfo ? usuarioInfo.usuario : 'Usuario',
        mensaje: mensaje,
        sala: 'general', // Añade la sala que espera el servidor
        timestamp: new Date().toISOString()
    };
    
    // Enviar al servidor
    socket.emit('mensajeChat', mensajeObj, respuesta => {
        if (respuesta && respuesta.error) {
            mostrarError(respuesta.error);
        }
    });
    
    // Agregar mensaje localmente
    agregarMensajeChat({
        emisor: 'Tú',
        contenido: mensaje,
        tipo: 'self',
        timestamp: new Date().toISOString()
    });
    
    // Limpiar input
    inputChat.value = '';
}

/**
 * Agrega un mensaje al chat
 * @param {Object} mensaje - Objeto del mensaje
 */
function agregarMensajeChat(mensaje) {
    console.log('Agregando mensaje a la interfaz:', mensaje);
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) {
        console.error('Contenedor de chat no encontrado');
        return;
    }
    
    const messageDiv = document.createElement('div');
    
    // Determinar el emisor, contenido y tipo correctamente
    let emisor = '';
    let contenido = '';
    let hora = '';
    let tipo = '';
    
    // Estructura normalizada
    if (mensaje.usuario) {
        // Formato desde el servidor
        emisor = mensaje.usuario;
        contenido = mensaje.mensaje;
        tipo = mensaje.tipo || 'other';
        hora = mensaje.timestamp ? new Date(mensaje.timestamp) : new Date();
    } else if (mensaje.emisor) {
        // Formato usado localmente
        emisor = mensaje.emisor;
        contenido = mensaje.contenido;
        tipo = mensaje.tipo || 'other';
        hora = mensaje.timestamp ? new Date(mensaje.timestamp) : new Date();
    } else {
        console.warn('Formato de mensaje desconocido:', mensaje);
        return; // No podemos mostrar este mensaje
    }
    
    // Determinar clase según tipo de mensaje
    let className = 'message ';
    if (tipo === 'self') {
        className += 'message-self';
    } else if (tipo === 'system') {
        className += 'message-system';
    } else {
        className += 'message-other';
    }
    
    messageDiv.className = className;
    
    // Formatear hora correctamente
    const horaFormateada = typeof hora === 'object' && hora.toLocaleTimeString ? 
        hora.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Sin hora';
    
    // Construir HTML del mensaje
    if (tipo === 'system') {
        messageDiv.textContent = contenido || 'Mensaje del sistema';
    } else {
        messageDiv.innerHTML = `
            <div><strong>${emisor || 'Desconocido'}</strong> <small>${horaFormateada}</small></div>
            <div>${contenido || 'Sin contenido'}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    console.log('Mensaje agregado correctamente:', emisor, contenido);
}

/**
 * Genera un ID único
 * @returns {string} ID generado
 */
function generarId() {
    return 'user_' + Date.now() + Math.random().toString(36).substr(2, 5);
}


function actualizarEstadoConexion(conectado) {
    console.log("Actualizando estado de conexión:", conectado ? "Conectado" : "Desconectado");
    
    // Buscar elementos de indicación de estado
    const indicator = document.getElementById('connection-indicator');
    const statusText = document.getElementById('status-text');
    
    // Si no se encuentran, no emitir error, simplemente registrar e ignorar
    if (!indicator) {
        console.log("Elemento indicator no encontrado");
    } else {
        // Actualizar clase y título según corresponda
        if (conectado) {
            indicator.className = 'connection-indicator connected';
            indicator.title = 'Conectado al servidor';
        } else {
            indicator.className = 'connection-indicator disconnected';
            indicator.title = 'Desconectado del servidor';
        }
    }
    
    if (!statusText) {
        console.log("Elemento status-text no encontrado");
    } else {
        statusText.textContent = conectado ? 'Conectado' : 'Desconectado';
        statusText.className = conectado ? 'text-success' : 'text-danger';
    }
    
    // Actualizar estado global
    window.conectadoAlServidor = conectado;
}


/**
 * Unirse a una operación existente
 */
function unirseOperacionExistente() {
    if (!operacionSeleccionada) {
        mostrarError('No hay operación seleccionada');
        return;
    }
    
    console.log("Intentando unirse a operación:", operacionSeleccionada);
    
    // Obtener datos del usuario y elemento
    const usuario = document.getElementById('nombreUsuario').value;
    const designacion = document.getElementById('elemento-designacion').value || "Elemento";
    const dependencia = document.getElementById('elemento-dependencia').value || "";
    
    if (!usuario) {
        mostrarError('El nombre de usuario es obligatorio');
        return;
    }
    
    // SIDC para una unidad de infantería amigable
    const sidc = "SFGPUCI-----";
    
    // Mostrar indicador de carga
    const botonSubmit = document.querySelector('#elementoForm button[type="submit"]');
    if (botonSubmit) {
        const textoOriginal = botonSubmit.innerHTML;
        botonSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uniéndose...';
        botonSubmit.disabled = true;
        
        // Restaurar después de 10 segundos como máximo si no hay respuesta
        setTimeout(() => {
            if (botonSubmit.disabled) {
                botonSubmit.innerHTML = textoOriginal;
                botonSubmit.disabled = false;
                mostrarError('No se recibió respuesta del servidor. Intenta nuevamente.');
            }
        }, 10000);
    }
    
    // Obtener o generar ID de usuario de forma robusta
    let usuarioId = null;
    
    // 1. Intentar obtener de UserIdentity
    if (window.MAIRA && window.MAIRA.UserIdentity) {
        usuarioId = window.MAIRA.UserIdentity.getUserId();
    }
    
    // 2. Si no, intentar obtener de localStorage
    if (!usuarioId) {
        usuarioId = localStorage.getItem('userId');
    }
    
    
    // Crear ID único para el elemento
    const elementoId = usuarioId
    // Crear info de usuario
    usuarioInfo = {
        id: usuarioId,
        usuario: usuario,
        operacion: operacionSeleccionada.nombre
    };
    
    // Elemento con información básica simplificada
    elementoTrabajo = {
        id: elementoId,
        sidc: sidc,
        designacion: designacion,
        dependencia: dependencia,
        magnitud: "E",
        estado: "operativo"
    };
    
    // Guardar en localStorage usando el módulo UserIdentity
    if (MAIRA.UserIdentity) {
        // Inicializar identidad de usuario
        MAIRA.UserIdentity.initialize(usuarioId, usuario, elementoTrabajo);
        
        // Guardar datos adicionales específicos para GB
        if (typeof MAIRA.UserIdentity.setUsuario === 'function') {
            MAIRA.UserIdentity.setUsuario(usuarioInfo);
        } else {
            // Fallback si la función no existe
            localStorage.setItem('gb_usuario_info', JSON.stringify(usuarioInfo));
        }
        
        if (typeof MAIRA.UserIdentity.setOperacion === 'function') {
            MAIRA.UserIdentity.setOperacion(operacionSeleccionada);
        } else {
            // Fallback si la función no existe
            localStorage.setItem('gb_operacion_seleccionada', JSON.stringify(operacionSeleccionada));
        }
    } else {
        // Guardar de forma estándar usando localStorage directo
        localStorage.setItem('gb_usuario_info', JSON.stringify(usuarioInfo));
        localStorage.setItem('gb_elemento_info', JSON.stringify(elementoTrabajo));
        localStorage.setItem('gb_operacion_seleccionada', JSON.stringify(operacionSeleccionada));
    }
    
    console.log("Datos a enviar para unirse:", {
        operacion: operacionSeleccionada,
        usuario: usuarioInfo,
        elemento: elementoTrabajo
    });
    
    // Enviar al servidor
    socket.emit('unirseOperacion', {
        operacion: operacionSeleccionada.nombre,
        usuario: usuarioInfo,
        elemento: elementoTrabajo
    }, function(respuesta) {
        console.log("Respuesta recibida para unirseOperacion:", respuesta);
        
        // Restaurar estado del botón
        if (botonSubmit) {
            botonSubmit.innerHTML = 'Unirse a la Operación';
            botonSubmit.disabled = false;
        }
        
        if (respuesta && respuesta.error) {
            mostrarError(respuesta.error);
            return;
        }
        
        mostrarMensajeSistema(`Unido correctamente a la operación "${operacionSeleccionada.nombre}"`);
        
        // Configurar estado de operación activa
        localStorage.setItem('en_operacion_gb', 'true');
        
        // Redirigir a página de batalla
        window.location.href = `/gestionbatalla.html?operacion=${encodeURIComponent(operacionSeleccionada.nombre)}`;
    });
    
    // Si después de 5 segundos no hay respuesta, asumir éxito y redireccionar
    // Esto es un respaldo en caso de que el callback no se ejecute
    setTimeout(() => {
        if (botonSubmit && botonSubmit.disabled) {
            console.log("No se recibió callback, redireccionando de todos modos");
            window.location.href = `/gestionbatalla.html?operacion=${encodeURIComponent(operacionSeleccionada.nombre)}`;
        }
    }, 5000);
}

/**
 * Carga información desde localStorage
 * @returns {boolean} - true si se cargó correctamente
 */
function cargarInfoDesdeLocalStorage() {
    try {
        console.log("Cargando información desde localStorage");
        
        // Primero intentar cargar usando UserIdentity
        if (MAIRA.UserIdentity) {
            const usuarioObj = MAIRA.UserIdentity.loadFromStorage();
            
            if (usuarioObj) {
                usuarioInfo = {
                    id: usuarioObj.id,
                    usuario: usuarioObj.username,
                    operacion: usuarioObj.operacion
                };
                
                elementoTrabajo = usuarioObj.elementoTrabajo || null;
                
                console.log("Información cargada desde UserIdentity:", {
                    usuario: usuarioInfo,
                    elemento: elementoTrabajo
                });
                
                // Intentar cargar operación seleccionada
                const operacionData = localStorage.getItem('gb_operacion_seleccionada');
                if (operacionData) {
                    try {
                        operacionSeleccionada = JSON.parse(operacionData);
                    } catch (e) {
                        console.error("Error al parsear operación seleccionada:", e);
                    }
                }
                
                return true;
            }
        }
        
        // Si no se pudo cargar desde UserIdentity, usar el método antiguo
        const usuarioData = localStorage.getItem('gb_usuario_info');
        const elementoData = localStorage.getItem('gb_elemento_info');
        const operacionData = localStorage.getItem('gb_operacion_seleccionada');

        // Verificar si hay datos mínimos necesarios
        if (!usuarioData && !elementoData) {
            console.log("No hay información guardada en localStorage");
            return true; // Permitir continuar sin datos previos
        }

        try {
            if (usuarioData) {
                usuarioInfo = JSON.parse(usuarioData);
            }
            
            if (elementoData) {
                elementoTrabajo = JSON.parse(elementoData);
            }
            
            if (operacionData) {
                operacionSeleccionada = JSON.parse(operacionData);
            }

            console.log("Información cargada desde localStorage:", {
                usuario: usuarioInfo,
                elemento: elementoTrabajo,
                operacion: operacionSeleccionada
            });

            return true;
        } catch (parseError) {
            console.error("Error parseando datos:", parseError);
            return true; // Permitir continuar sin datos previos
        }
    } catch (error) {
        console.error("Error cargando información:", error);
        return true; // Permitir continuar sin datos previos
    }
}

/**
 * Crea una nueva operación
 */
/**
 * Crea una nueva operación
 */
function crearNuevaOperacion() {
    const nombre = document.getElementById('nombreOperacion').value;
    const descripcion = document.getElementById('descripcionOperacion').value;
    
    if (!nombre) {
        mostrarError('El nombre de la operación es obligatorio');
        return;
    }
    
    // Mostrar indicador de carga
    const botonSubmit = document.querySelector('#nuevaOperacionForm button[type="submit"]');
    if (botonSubmit) {
        const textoOriginal = botonSubmit.innerHTML;
        botonSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        botonSubmit.disabled = true;
        
        // Restaurar después de 10 segundos como máximo
        setTimeout(() => {
            if (botonSubmit.disabled) {
                botonSubmit.innerHTML = textoOriginal;
                botonSubmit.disabled = false;
            }
        }, 10000);
    }
    
    // Obtener información del usuario actual de manera robusta
    let usuarioActual = "Usuario";
    let usuarioId = null;
    
    // 1. Intentar obtener de UserIdentity
    if (window.MAIRA && window.MAIRA.UserIdentity) {
        const userData = window.MAIRA.UserIdentity.loadFromStorage();
        if (userData) {
            usuarioActual = userData.username;
            usuarioId = userData.id;
            console.log('Usuario cargado desde UserIdentity:', usuarioActual, usuarioId);
        }
    }
    
    // 2. Si no funciona, intentar obtener de localStorage directamente
    if (!usuarioId) {
        usuarioId = localStorage.getItem('userId');
        const usernameFromStorage = localStorage.getItem('username');
        if (usernameFromStorage) {
            usuarioActual = usernameFromStorage;
            console.log('Usuario cargado desde localStorage:', usuarioActual, usuarioId);
        }
    }
    
    // 3. Si aún no hay usuario, verificar variables globales
    if (!usuarioId && window.usuarioInfo) {
        usuarioId = window.usuarioInfo.id;
        usuarioActual = window.usuarioInfo.usuario || window.usuarioInfo.username;
        console.log('Usuario cargado desde variables globales:', usuarioActual, usuarioId);
    }
    
    // Crear objeto de operación con toda la información necesaria
    const nuevaOperacion = {
        nombre: nombre,
        descripcion: descripcion,
        creador: usuarioActual,
        creadorId: usuarioId,
        fechaCreacion: new Date().toISOString(),
        elementos: [], // Array vacío inicial
        participantes: 0 // Contador inicial
    };
    
    console.log("Enviando solicitud de creación:", nuevaOperacion);
    
    // Enviar al servidor
    socket.emit('crearOperacionGB', nuevaOperacion, function(respuesta) {
        console.log("Respuesta recibida:", respuesta);
        
        // Restaurar estado del botón
        if (botonSubmit) {
            botonSubmit.innerHTML = 'Crear Operación';
            botonSubmit.disabled = false;
        }
        
        if (respuesta && respuesta.error) {
            mostrarError(respuesta.error);
            return;
        }
        
        mostrarMensajeSistema(`Operación "${nombre}" creada correctamente`);
        
        // Extraer la operación de la respuesta
        let operacionCreada = null;
        if (respuesta && respuesta.operacion) {
            operacionCreada = respuesta.operacion;
        } else if (respuesta && respuesta.success) {
            // Si la respuesta es exitosa pero no tiene la operación completa
            operacionCreada = nuevaOperacion;
            // Añadir ID si vino en la respuesta
            if (respuesta.operacionId) {
                operacionCreada.id = respuesta.operacionId;
            } else {
                // Generar un ID único si no hay uno del servidor
                operacionCreada.id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
        } else {
            // Si no hay nada válido, usar la operación original con un ID generado
            operacionCreada = {
                ...nuevaOperacion,
                id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        }
        
        // Actualizar variable global
        operacionSeleccionada = operacionCreada;
        
        // Guardar información en localStorage para GB.js
        localStorage.setItem('gb_operacion_seleccionada', JSON.stringify(operacionCreada));
        
        // Actualizar UserIdentity si está disponible
        if (window.MAIRA && window.MAIRA.UserIdentity && window.MAIRA.UserIdentity.setOperacion) {
            window.MAIRA.UserIdentity.setOperacion(operacionCreada);
        }
        
        // Mostrar panel de configuración de elemento
        document.getElementById('formCrearOperacion').style.display = 'none';
        document.getElementById('nombreOperacionSeleccionada').querySelector('span').textContent = nombre;
        document.getElementById('configuracionElemento').style.display = 'block';
    });
}

// Añadir a inicioGBhandler.js
function crearBotonEliminarOperacion(operacionItem, operacion) {
    // Solo mostrar botón de eliminar al creador
    const usuarioActual = localStorage.getItem('gb_usuario_info');
    const datosUsuario = usuarioActual ? JSON.parse(usuarioActual) : null;
    
    if (datosUsuario && (operacion.creador === datosUsuario.usuario || operacion.creadorId === datosUsuario.id)) {
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-sm btn-danger btn-delete ml-2';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar operación';
        
        btnEliminar.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Confirmar eliminación
            if (confirm(`¿Estás seguro de eliminar la operación "${operacion.nombre}"? Esta acción no se puede deshacer.`)) {
                eliminarOperacion(operacion.id);
            }
        });
        
        const actionsDiv = operacionItem.querySelector('.operation-actions');
        if (actionsDiv) {
            actionsDiv.appendChild(btnEliminar);
        }
    }
}

function eliminarOperacion(operacionId) {
    // Mostrar indicador de carga
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"><i class="fas fa-spinner fa-spin"></i></div><div>Eliminando operación...</div>';
    document.body.appendChild(loadingOverlay);
    
    // Enviar solicitud al servidor
    socket.emit('eliminarOperacionGB', { id: operacionId }, function(respuesta) {
        // Quitar indicador de carga
        document.body.removeChild(loadingOverlay);
        
        if (respuesta && respuesta.error) {
            mostrarError(respuesta.error);
            return;
        }
        
        // Actualizar la lista de operaciones
        const index = operacionesActivas.findIndex(op => op.id === operacionId);
        if (index !== -1) {
            operacionesActivas.splice(index, 1);
            actualizarListaOperaciones();
        }
        
        // Limpiar localStorage relacionado con esta operación
        limpiarDatosOperacion(operacionId);
        
        mostrarMensajeSistema(`Operación eliminada correctamente`);
    });
}

function limpiarDatosOperacion(operacionId) {
    // Buscar operación para obtener el nombre
    const operacion = operacionesActivas.find(op => op.id === operacionId);
    const nombreOperacion = operacion?.nombre || '';
    
    // Limpiar datos de esta operación en localStorage
    if (nombreOperacion) {
        localStorage.removeItem(`elementos_conectados_${nombreOperacion}`);
    }
    
    // Si el usuario estaba en esta operación, limpiar sus datos
    const operacionGuardada = localStorage.getItem('gb_operacion_seleccionada');
    if (operacionGuardada) {
        try {
            const datosOperacion = JSON.parse(operacionGuardada);
            if (datosOperacion.id === operacionId) {
                localStorage.removeItem('gb_operacion_seleccionada');
                localStorage.removeItem('gb_elemento_info');
                // No eliminamos usuario_info para mantener la identidad
            }
        } catch (e) {
            console.error("Error al leer operación guardada:", e);
        }
    }
}

// Añadir a inicioGBhandler.js
function verificarOperacionesInactivas() {
    // Solo el servidor debería hacer esta verificación normalmente,
    // pero agregamos este respaldo en el cliente
    console.log("Verificando operaciones inactivas...");
    
    socket.emit('verificarOperacionesInactivas', {}, function(respuesta) {
        if (respuesta && respuesta.operacionesEliminadas) {
            console.log(`Se eliminaron ${respuesta.operacionesEliminadas} operaciones inactivas`);
            
            // Actualizar la lista de operaciones
            socket.emit('obtenerOperacionesGB');
        }
    });
}



// Reemplaza la función iniciarConexion con esta versión mejorada
function iniciarConexion() {
    const serverURL = obtenerURLServidor();
    
    // Opciones de socket.io para mejorar la estabilidad de la conexión
    socket = io(serverURL, {
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
    });
    
    // Evento de conexión
    socket.on('connect', function() {
        console.log('Conectado al servidor. ID de socket:', socket.id);
        mostrarMensajeSistema('Conectado al servidor');
        actualizarEstadoConexion(true);
        
        // Solicitar operaciones activas
        socket.emit('obtenerOperacionesGB');
        
        // Solicitar usuarios conectados
        socket.emit('obtenerUsuariosConectados');
    });
    
    // Evento de desconexión
    socket.on('disconnect', function(reason) {
        console.log('Desconectado del servidor. Razón:', reason);
        mostrarMensajeSistema('Desconectado del servidor: ' + reason);
        actualizarEstadoConexion(false);
    });
    
    // Evento de error
    socket.on('error', function(error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión: ' + error);
    });
    
    // Evento de reconexión
    socket.on('reconnect', function(attemptNumber) {
        console.log('Reconectado al servidor después de', attemptNumber, 'intentos');
        mostrarMensajeSistema('Reconectado al servidor');
        actualizarEstadoConexion(true);
        
        // Volver a solicitar datos
        socket.emit('obtenerOperacionesGB');
        socket.emit('obtenerUsuariosConectados');
    });
    
    // Recibir operaciones
    socket.on('operacionesGB', function(data) {
        console.log('Operaciones recibidas:', data);
        operacionesActivas = data.operaciones || [];
        actualizarListaOperaciones();
    });
    
    // Recibir usuarios conectados
    socket.on('usuariosConectados', function(data) {
        console.log('Usuarios conectados recibidos:', data);
        usuariosConectados = data.usuarios || [];
        actualizarListaUsuarios();
    });
    
    // Recibir mensaje de chat
    socket.on('mensajeChat', function(mensaje) {
        console.log('Mensaje recibido en cliente:', mensaje);
        agregarMensajeChat(mensaje);
    });
    
    // AGREGAR: Ping periódico para mantener la conexión activa
    setInterval(function() {
        if (socket && socket.connected) {
            socket.emit('ping');
        }
    }, 30000); // Cada 30 segundos
}