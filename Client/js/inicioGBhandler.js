// Variables globales
let socket;
let usuarioInfo = null;
let elementoInfo = null;
let operacionesActivas = [];
let operacionSeleccionada = null;
let usuariosConectados = [];

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
});

/**
 * Inicia la conexión con el servidor
 */
function iniciarConexion() {
    const serverURL = obtenerURLServidor();
    socket = io(serverURL);
    
    // Evento de conexión
    socket.on('connect', function() {
        console.log('Conectado al servidor');
        mostrarMensajeSistema('Conectado al servidor');
        actualizarEstadoConexion(true);
        
        // Solicitar operaciones activas
        socket.emit('obtenerOperacionesGB');
        
        // Solicitar usuarios conectados
        socket.emit('obtenerUsuariosConectados');
    });
    
    // Evento de desconexión
    socket.on('disconnect', function() {
        console.log('Desconectado del servidor');
        mostrarMensajeSistema('Desconectado del servidor');
        actualizarEstadoConexion(false);
    });
    
    // Evento de error
    socket.on('error', function(error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión: ' + error);
    });
    
    // Recibir operaciones
    socket.on('operacionesGB', function(data) {
        operacionesActivas = data.operaciones || [];
        actualizarListaOperaciones();
    });
    
    // Recibir usuarios conectados
    socket.on('usuariosConectados', function(data) {
        usuariosConectados = data.usuarios || [];
        actualizarListaUsuarios();
    });
    
    // Recibir mensaje de chat
    socket.on('mensajeChat', function(mensaje) {
        agregarMensajeChat(mensaje);
    });
    
    // Recibir actualización de operación
    socket.on('actualizacionOperacionGB', function(operacion) {
        const index = operacionesActivas.findIndex(op => op.id === operacion.id);
        if (index !== -1) {
            operacionesActivas[index] = operacion;
        } else {
            operacionesActivas.push(operacion);
        }
        actualizarListaOperaciones();
        
        // Si es la operación seleccionada, actualizar detalles
        if (operacionSeleccionada && operacionSeleccionada.id === operacion.id) {
            mostrarDetallesOperacion(operacion);
        }
    });
    
    // Usuario unido a operación con éxito
    socket.on('unidoOperacionGB', function(data) {
        usuarioInfo = data.usuario;
        elementoInfo = data.elemento;
        
        // Guardar en localStorage para recuperar en caso de recarga
        localStorage.setItem('gb_usuario_info', JSON.stringify(usuarioInfo));
        localStorage.setItem('gb_elemento_info', JSON.stringify(elementoInfo));
        
        // Redireccionar a la página de gestión de batalla
        window.location.href = `/gestionbatalla.html?operacion=${data.operacion.nombre}`;
    });
}

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
    // Intentar recuperar información de usuario
    const usuarioGuardado = localStorage.getItem('gb_usuario_info');
    if (usuarioGuardado) {
        try {
            usuarioInfo = JSON.parse(usuarioGuardado);
            document.getElementById('idUsuarioActual').textContent = usuarioInfo.id;
            document.getElementById('nombreUsuario').value = usuarioInfo.usuario || '';
        } catch (error) {
            console.error('Error al cargar información del usuario:', error);
        }
    }
}

/**
 * Actualiza el estado de conexión en la interfaz
 * @param {boolean} conectado - Estado de la conexión
 */
function actualizarEstadoConexion(conectado) {
    const estadoEl = document.getElementById('estadoConexion');
    if (estadoEl) {
        estadoEl.textContent = conectado ? 'Conectado' : 'Desconectado';
        estadoEl.className = conectado ? 'text-success' : 'text-danger';
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

/**
 * Actualiza la lista de operaciones en la interfaz
 */
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
            botonSubmit.innerHTML = textoOriginal;
            botonSubmit.disabled = false;
        }, 10000);
    }
    
    // Crear objeto de operación
    const nuevaOperacion = {
        nombre: nombre,
        descripcion: descripcion,
        creador: usuarioInfo ? usuarioInfo.usuario : 'Usuario',
        fechaCreacion: new Date().toISOString()
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
        } else {
            // Estructura alternativa de respuesta
            operacionCreada = {
                id: Date.now().toString(),
                nombre: nombre,
                descripcion: descripcion,
                creador: usuarioInfo ? usuarioInfo.usuario : 'Usuario'
            };
        }
        
        // Actualizar variable global
        operacionSeleccionada = operacionCreada;
        
        // Mostrar panel de configuración de elemento
        document.getElementById('formCrearOperacion').style.display = 'none';
        document.getElementById('nombreOperacionSeleccionada').querySelector('span').textContent = nombre;
        document.getElementById('configuracionElemento').style.display = 'block';
    });
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

function unirseOperacionExistente() {
    if (!operacionSeleccionada) {
        mostrarError('No hay operación seleccionada');
        return;
    }
    
    // Obtener solo el nombre de usuario, lo demás se configurará luego
    const usuario = document.getElementById('nombreUsuario').value;
    
    if (!usuario) {
        mostrarError('El nombre de usuario es obligatorio');
        return;
    }
    
    // Obtener SIDC básico para una unidad de infantería
    const sidc = "SFGPUCI-----"; // Unidad de Infantería Amiga básica
    
    // Mostrar indicador de carga
    const botonSubmit = document.querySelector('#elementoForm button[type="submit"]');
    if (botonSubmit) {
        const textoOriginal = botonSubmit.innerHTML;
        botonSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uniéndose...';
        botonSubmit.disabled = true;
        
        // Restaurar después de 10 segundos por seguridad
        setTimeout(() => {
            botonSubmit.innerHTML = textoOriginal;
            botonSubmit.disabled = false;
        }, 10000);
    }
    
    // Crear ID único para el elemento
    const elementoId = `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear info de usuario y elemento
    usuarioInfo = {
        id: generarId(),
        usuario: usuario
    };
    
    // Elemento completo con todos los campos que usan simbolosP.js y edicioncompleto.js
    elementoTrabajo = {
        // Campos básicos
        id: elementoId,
        sidc: sidc,
        tipo: "U",  // Unidad
        designacion: "",
        dependencia: "",
        magnitud: "E", // Magnitud por defecto (Compañía)
        
        // Campos adicionales usados en el mapa
        nombre: `Elemento de ${usuario}`,
        usuario: usuario,
        usuarioId: usuarioInfo.id,
        creado: new Date().toISOString(),
        
        // Campos para la visualización
        draggable: true, // Permitir arrastrar
        editable: true,  // Permitir editar
        visible: true,   // Visible inicialmente
        
        // Campos de estado
        estado: "operativo",
        edicionPendiente: true, // Flag para indicar que debe abrirse el editor
        
        // Campos de posición (inicialmente en el centro del mapa - se ajustará)
        posicion: null, // Se establecerá al cargar el mapa
        
        // Datos de la operación
        operacionId: operacionSeleccionada.id,
        operacionNombre: operacionSeleccionada.nombre
    };
    
    console.log("Datos de unión:", {
        operacionId: operacionSeleccionada.id,
        usuario: usuarioInfo,
        elemento: elementoTrabajo
    });
    
    // Enviar al servidor
    socket.emit('unirseOperacionGB', {
        operacionId: operacionSeleccionada.id,
        usuario: usuarioInfo,
        elemento: elementoTrabajo
    }, function(respuesta) {
        console.log("Respuesta recibida:", respuesta);
        
        // Restaurar botón
        if (botonSubmit) {
            botonSubmit.innerHTML = 'Unirse a la Operación';
            botonSubmit.disabled = false;
        }
        
        if (respuesta && respuesta.error) {
            mostrarError(respuesta.error);
            return;
        }
        
        // Guardar en localStorage para recuperar en caso de recarga
        localStorage.setItem('gb_usuario_info', JSON.stringify(usuarioInfo));
        localStorage.setItem('gb_elemento_info', JSON.stringify(elementoTrabajo));
        localStorage.setItem('gb_operacion_seleccionada', JSON.stringify(operacionSeleccionada));
        
        // Mensaje de éxito
        mostrarMensajeSistema(`Unido correctamente a la operación "${operacionSeleccionada.nombre}"`);
        
        // Redireccionar a gestión de batalla
        setTimeout(() => {
            window.location.href = `gestionbatalla.html?operacion=${encodeURIComponent(operacionSeleccionada.nombre)}&editar=true&elementoId=${elementoId}`;
        }, 1000);
    });
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
        emisor: usuarioInfo ? usuarioInfo.usuario : 'Usuario',
        contenido: mensaje,
        tipo: 'chat',
        timestamp: new Date().toISOString()
    };
    
    // Enviar al servidor
    socket.emit('enviarMensaje', mensajeObj, respuesta => {
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
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    
    // Determinar clase según tipo de mensaje
    let className = 'message ';
    if (mensaje.tipo === 'self') {
        className += 'message-self';
    } else if (mensaje.tipo === 'system') {
        className += 'message-system';
    } else {
        className += 'message-other';
    }
    
    messageDiv.className = className;
    
    // Formatear hora
    const hora = new Date(mensaje.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construir HTML del mensaje
    if (mensaje.tipo === 'system') {
        messageDiv.textContent = mensaje.contenido;
    } else {
        messageDiv.innerHTML = `
            <div><strong>${mensaje.emisor}</strong> <small>${hora}</small></div>
            <div>${mensaje.contenido}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Genera un ID único
 * @returns {string} ID generado
 */
function generarId() {
    return 'user_' + Date.now() + Math.random().toString(36).substr(2, 5);
}