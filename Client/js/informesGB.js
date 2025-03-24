/**
 * informesGB.js
 * Módulo de informes para Gestión de Batalla en MAIRA
 * @version 1.0.0
 */

// Namespace principal
window.MAIRA = window.MAIRA || {};

// Módulo de informes
MAIRA.Informes = (function() {
    // Variables privadas
    let socket = null;
    let usuarioInfo = null;
    let operacionActual = "";
    let elementoTrabajo = null;
    let ultimaPosicion = null;
    let informesRecibidos = {};
    let informesEnviados = {};
    let filtroActual = 'todos';
    
    /**
     * Inicializa el módulo de informes
     * @param {Object} config - Configuración del módulo
     */
    function inicializar(config) {
        console.log("Inicializando módulo de informes");
        
        // Guardar referencias
        socket = config.socket;
        usuarioInfo = config.usuarioInfo;
        operacionActual = config.operacionActual;
        elementoTrabajo = config.elementoTrabajo;
        ultimaPosicion = config.ultimaPosicion;
        
        // Inicializar componentes UI
        inicializarInterfazInformes();
        
        // Configurar eventos
        configurarEventosInformes();
        
        // Cargar informes guardados en localStorage
        cargarInformesGuardados();
        
        // Mensaje de inicialización
        console.log("Módulo de informes inicializado");
    }
    
    /**
     * Inicializa la interfaz de informes
     */
    function inicializarInterfazInformes() {
        console.log("Inicializando interfaz de informes");
        
        // Limpiar listas de informes
        const listaInformes = document.getElementById('lista-informes');
        if (listaInformes) {
            listaInformes.innerHTML = '';
        }
        
        // Actualizar HTML del panel de informes
        actualizarHTML_Informes();
        
        // Inicializar estilos para informes
        inicializarEstilosInformes();
        
        console.log("Interfaz de informes inicializada");
    }
    
    /**
     * Actualiza el HTML del panel de informes para incorporar nuevas funcionalidades
     */
    function actualizarHTML_Informes() {
        // 1. Actualizar el formulario de crear informe para incluir adjuntos
        const formInforme = document.getElementById('form-informe');
        if (formInforme) {
            // Verificar si ya tiene el campo de adjunto
            if (!document.getElementById('adjunto-container')) {
                // Crear el contenedor para adjunto
                const adjuntoContainer = document.createElement('div');
                adjuntoContainer.id = 'adjunto-container';
                adjuntoContainer.className = 'form-group mt-3';
                
                // Campo de archivo con botones para multimedia
                adjuntoContainer.innerHTML = `
                    <label for="adjunto-informe">Adjuntar archivo:</label>
                    <div class="d-flex justify-content-between">
                        <input type="file" id="adjunto-informe" class="form-control" style="width: 75%;">
                        <div class="d-flex">
                            <button type="button" id="btn-foto-informe" class="btn-foto-informe ml-2" title="Tomar foto">
                                <i class="fas fa-camera"></i>
                            </button>
                            <button type="button" id="btn-audio-informe" class="btn-audio-informe ml-2" title="Grabar audio">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button type="button" id="btn-video-informe" class="btn-video-informe ml-2" title="Grabar video">
                                <i class="fas fa-video"></i>
                            </button>
                        </div>
                    </div>
                    <div id="preview-adjunto" style="margin-top: 10px; display: none;"></div>
                    <small class="form-text text-muted">Tamaño máximo: 5MB</small>
                `;
                
                // Insertar antes del botón de envío
                const formButtons = formInforme.querySelector('.form-buttons') || formInforme.querySelector('button[type="submit"]').parentNode;
                formInforme.insertBefore(adjuntoContainer, formButtons);
                
                // Configurar eventos
                setTimeout(() => {
                    if (document.getElementById('adjunto-informe')) {
                        document.getElementById('adjunto-informe').addEventListener('change', previewAdjunto);
                    }
                    if (document.getElementById('btn-foto-informe')) {
                        document.getElementById('btn-foto-informe').addEventListener('click', capturarFoto);
                    }
                    if (document.getElementById('btn-audio-informe')) {
                        document.getElementById('btn-audio-informe').addEventListener('click', grabarAudio);
                    }
                    if (document.getElementById('btn-video-informe')) {
                        document.getElementById('btn-video-informe').addEventListener('click', grabarVideo);
                    }
                }, 500);
            }
        }
        
        // 2. Mejorar el selector de destinatarios
        const destinatarioInforme = document.getElementById('destinatario-informe');
        if (destinatarioInforme) {
            // Añadir clases para mejor estilo
            destinatarioInforme.className = 'form-control custom-select';
            
            // Añadir opciones base si está vacío
            if (destinatarioInforme.options.length <= 1) {
                destinatarioInforme.innerHTML = `
                    <option value="">Seleccionar destinatario...</option>
                    <option value="todos">Todos los participantes</option>
                    <option value="comando">Comando/Central</option>
                    <option disabled>───────────────</option>
                `;
                
                // Actualizar con elementos conectados
                setTimeout(actualizarSelectorDestinatariosInforme, 500);
            }
        }
        
        // 3. Mejorar selector de tipo de informe
        const tipoInforme = document.getElementById('tipo-informe');
        if (tipoInforme) {
            // Añadir clases para mejor estilo
            tipoInforme.className = 'form-control custom-select';
            
            // Asegurar que tiene todas las opciones
            if (tipoInforme.options.length < 3) {
                tipoInforme.innerHTML = `
                    <option value="normal">Informe Normal</option>
                    <option value="urgente">Informe URGENTE</option>
                    <option value="orden">ORDEN</option>
                `;
            }
        }
        
        // 4. Agregar botones de acciones en la lista de informes
        const headerListaInformes = document.querySelector('.informes-header');
        if (!headerListaInformes) {
            const listaInformes = document.getElementById('lista-informes');
            if (listaInformes && !document.getElementById('informes-header')) {
                // Crear header con acciones
                const header = document.createElement('div');
                header.id = 'informes-header';
                header.className = 'informes-header d-flex justify-content-between align-items-center mb-3';
                header.innerHTML = `
                    <div>
                        <h5 class="m-0">Informes</h5>
                    </div>
                    <div class="informes-acciones">
                        <button id="btn-exportar-informes" class="btn btn-sm btn-outline-secondary mr-2" title="Exportar informes">
                            <i class="fas fa-file-export"></i>
                        </button>
                        <button id="btn-buscar-informes" class="btn btn-sm btn-outline-secondary" title="Buscar en informes">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                `;
                
                // Insertar antes de la lista
                listaInformes.parentNode.insertBefore(header, listaInformes);
                
                // Configurar eventos
                setTimeout(() => {
                    const btnExportar = document.getElementById('btn-exportar-informes');
                    const btnBuscar = document.getElementById('btn-buscar-informes');
                    
                    if (btnExportar) {
                        btnExportar.addEventListener('click', exportarInformes);
                    }
                    
                    if (btnBuscar) {
                        btnBuscar.addEventListener('click', function() {
                            // Mostrar/ocultar buscador
                            const buscador = document.getElementById('buscador-informes');
                            if (buscador) {
                                buscador.style.display = buscador.style.display === 'none' ? 'block' : 'none';
                                if (buscador.style.display === 'block') {
                                    buscador.querySelector('input').focus();
                                }
                            } else {
                                crearBuscadorInformes();
                            }
                        });
                    }
                }, 500);
            }
        }
    }
    
    /**
     * Crea un buscador de informes
     */
    function crearBuscadorInformes() {
        const header = document.getElementById('informes-header');
        if (!header) return;
        
        const buscador = document.createElement('div');
        buscador.id = 'buscador-informes';
        buscador.className = 'buscador-informes mt-2 mb-3';
        buscador.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control form-control-sm" placeholder="Buscar en informes...">
                <div class="input-group-append">
                    <button class="btn btn-sm btn-outline-secondary" type="button" id="btn-cerrar-buscador">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        header.parentNode.insertBefore(buscador, header.nextSibling);
        
        // Configurar eventos
        const input = buscador.querySelector('input');
        input.addEventListener('input', function() {
            buscarInformes(this.value);
        });
        
        document.getElementById('btn-cerrar-buscador').addEventListener('click', function() {
            buscador.style.display = 'none';
            buscarInformes(''); // Limpiar búsqueda
        });
        
        // Enfocar input
        input.focus();
    }
    
    /**
     * Busca texto en los informes
     * @param {string} texto - Texto a buscar
     */
    function buscarInformes(texto) {
        const informes = document.querySelectorAll('.informe');
        if (!informes.length) return;
        
        const busqueda = texto.toLowerCase().trim();
        let encontrados = 0;
        
        informes.forEach(informe => {
            // Solo buscar en informes que cumplan con el filtro actual
            if ((filtroActual === 'todos') || 
                (filtroActual === 'informes' && !informe.classList.contains('orden')) ||
                (filtroActual === 'ordenes' && informe.classList.contains('orden'))) {
                
                const asunto = informe.querySelector('.informe-titulo')?.textContent?.toLowerCase() || '';
                const contenido = informe.querySelector('.informe-contenido')?.textContent?.toLowerCase() || '';
                const remitente = informe.querySelector('.informe-remitente')?.textContent?.toLowerCase() || '';
                
                if (busqueda === '' || asunto.includes(busqueda) || contenido.includes(busqueda) || remitente.includes(busqueda)) {
                    informe.style.display = 'block';
                    encontrados++;
                    
                    // Resaltar coincidencias si hay texto de búsqueda
                    if (busqueda !== '') {
                        resaltarCoincidencias(informe, busqueda);
                    } else {
                        // Quitar resaltado si la búsqueda está vacía
                        quitarResaltado(informe);
                    }
                } else {
                    informe.style.display = 'none';
                }
            }
        });
        
        // Mostrar mensaje si no hay resultados
        const mensajeNoResultados = document.getElementById('no-resultados-informes');
        if (encontrados === 0 && busqueda !== '') {
            if (!mensajeNoResultados) {
                const mensaje = document.createElement('div');
                mensaje.id = 'no-resultados-informes';
                mensaje.className = 'alert alert-info';
                mensaje.textContent = `No se encontraron informes que coincidan con "${texto}"`;
                
                const listaInformes = document.getElementById('lista-informes');
                if (listaInformes) {
                    listaInformes.parentNode.insertBefore(mensaje, listaInformes);
                }
            }
        } else if (mensajeNoResultados) {
            mensajeNoResultados.remove();
        }
    }
    
    /**
     * Resalta coincidencias de búsqueda en un informe
     * @param {HTMLElement} informe - Elemento del informe
     * @param {string} texto - Texto a resaltar
     */
    function resaltarCoincidencias(informe, texto) {
        // Quitar resaltados previos
        quitarResaltado(informe);
        
        // Función para resaltar texto en un elemento
        function resaltarEnElemento(elemento) {
            if (!elemento || !elemento.textContent) return;
            
            const contenido = elemento.innerHTML;
            const regex = new RegExp(`(${texto})`, 'gi');
            elemento.innerHTML = contenido.replace(regex, '<mark>$1</mark>');
        }
        
        // Resaltar en título
        resaltarEnElemento(informe.querySelector('.informe-titulo strong'));
        
        // Resaltar en contenido
        resaltarEnElemento(informe.querySelector('.informe-contenido'));
        
        // Resaltar en remitente
        resaltarEnElemento(informe.querySelector('.informe-remitente'));
    }
    
    /**
     * Quita el resaltado de búsqueda de un informe
     * @param {HTMLElement} informe - Elemento del informe
     */
    function quitarResaltado(informe) {
        // Función para quitar resaltados en un elemento
        function quitarResaltadoEnElemento(elemento) {
            if (!elemento) return;
            
            // Guardar texto original
            const texto = elemento.textContent;
            
            // Verificar si hay resaltados
            if (elemento.querySelector('mark')) {
                // Restaurar texto original sin resaltados
                elemento.textContent = texto;
            }
        }
        
        // Quitar de los distintos elementos
        quitarResaltadoEnElemento(informe.querySelector('.informe-titulo strong'));
        quitarResaltadoEnElemento(informe.querySelector('.informe-contenido'));
        quitarResaltadoEnElemento(informe.querySelector('.informe-remitente'));
    }
    
    /**
     * Inicializa los estilos para informes
     */
    function inicializarEstilosInformes() {
        // Verificar si ya existe la hoja de estilos
        if (document.getElementById('estilos-informes')) {
            return;
        }
        
        // Crear hoja de estilos
        const style = document.createElement('style');
        style.id = 'estilos-informes';
        style.textContent = `
            /* Estilos para informes */
            .informe {
                transition: transform 0.2s;
                margin-bottom: 15px;
                border-radius: 8px;
                padding: 12px;
                background-color: #f8f9fa;
                border-left: 4px solid #6c757d;
            }
            
            .informe:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .informe .informe-acciones button {
                background: none;
                border: none;
                padding: 5px 8px;
                margin: 0 2px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .informe .informe-acciones button:hover {
                background-color: rgba(0,0,0,0.05);
            }
            
            .informe.informe-urgente {
                border-left: 4px solid #f44336;
                background-color: #fff8f8;
            }
            
            .informe.orden {
                border-left: 4px solid #ff9800;
                background-color: #fffaf4;
            }
            
            .informe.leido {
                opacity: 0.8;
            }
            
            .informe.propio {
                background-color: #f5f9ff;
                border-left: 4px solid #0288d1;
            }
            
            /* Estilos para adjuntos en informes */
            .informe-adjunto {
                margin-top: 10px;
                padding: 8px 12px;
                background-color: #f0f2f5;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .informe-adjunto i {
                font-size: 18px;
                color: #555;
            }
            
            .ver-adjunto {
                color: #0281a8;
                text-decoration: none;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 200px;
                display: inline-block;
            }
            
            .ver-adjunto:hover {
                text-decoration: underline;
            }
            
            /* Botones multimedia */
            .btn-foto-informe,
            .btn-audio-informe,
            .btn-video-informe {
                background: none;
                border: 1px solid #ddd;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .btn-foto-informe:hover,
            .btn-audio-informe:hover,
            .btn-video-informe:hover {
                transform: scale(1.1);
                background-color: #f5f5f5;
            }
            
            /* Buscador de informes */
            .buscador-informes {
                margin-bottom: 10px;
            }
            
            /* Filtros */
            .filtros-informes {
                display: flex;
                margin-bottom: 15px;
            }
            
            .filtros-informes button {
                margin-right: 5px;
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .filtros-informes button.active {
                background-color: #e3f2fd;
                border-color: #90caf9;
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Configura los eventos para el módulo de informes
     */
    function configurarEventosInformes() {
        console.log("Configurando eventos del módulo de informes");
        
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
                    
                    // Aplicar filtro
                    let filtro = 'todos';
                    if (this.id === 'btn-filtro-informes') filtro = 'informes';
                    else if (this.id === 'btn-filtro-ordenes') filtro = 'ordenes';
                    
                    filtrarInformes(filtro);
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
     * Configura los eventos de Socket.io para el módulo de informes
     * @param {Object} socket - Objeto socket.io
     */
    function configurarEventosSocket(socket) {
        if (!socket) return;
        
        // Limpiar eventos anteriores
        socket.off('nuevoInforme');
        socket.off('informeLeido');
        
        // Configurar evento para nuevos informes
        socket.on('nuevoInforme', function(informe) {
            console.log('Informe recibido:', informe);
            recibirInforme(informe);
        });
        
        // Configurar evento para marcar informes como leídos
        socket.on('informeLeido', function(data) {
            if (data && data.informeId) {
                marcarInformeLeido(data.informeId);
            }
        });
        
        console.log("Eventos de socket para informes configurados");
    }
    

    function cargarInformesRecibidos() {
        try {
            // Obtener informes guardados
            const informesGuardados = localStorage.getItem('informes_recibidos');
            if (!informesGuardados) {
                return [];
            }
            
            const informes = JSON.parse(informesGuardados);
            
            // NUEVO: Filtrar por operación actual
            const informesFiltrados = informes.filter(informe => {
                // Si no hay operación en el informe, lo incluimos por compatibilidad
                if (!informe.operacion) return true;
                
                // Solo incluir informes de la operación actual
                return informe.operacion === operacionActual;
            });
            
            console.log(`Cargados ${informesFiltrados.length} informes recibidos filtrados por operación ${operacionActual}`);
            return informesFiltrados;
        } catch (e) {
            console.error("Error al cargar informes recibidos:", e);
            return [];
        }
    }
    
    // También aplicar el mismo filtro en la función cargarInformesEnviados:
    function cargarInformesEnviados() {
        try {
            // Obtener informes guardados
            const informesGuardados = localStorage.getItem('informes_enviados');
            if (!informesGuardados) {
                return [];
            }
            
            const informes = JSON.parse(informesGuardados);
            
            // NUEVO: Filtrar por operación actual
            const informesFiltrados = informes.filter(informe => {
                // Si no hay operación en el informe, lo incluimos por compatibilidad
                if (!informe.operacion) return true;
                
                // Solo incluir informes de la operación actual
                return informe.operacion === operacionActual;
            });
            
            console.log(`Cargados ${informesFiltrados.length} informes enviados filtrados por operación ${operacionActual}`);
            return informesFiltrados;
        } catch (e) {
            console.error("Error al cargar informes enviados:", e);
            return [];
        }
    }


    /**
     * Carga informes guardados en localStorage
     */
    function cargarInformesGuardados() {
        try {
            // Cargar informes recibidos
            const informesRecibidosGuardados = localStorage.getItem('gb_informes_recibidos');
            if (informesRecibidosGuardados) {
                const informes = JSON.parse(informesRecibidosGuardados);
                informes.forEach(informe => {
                    informesRecibidos[informe.id] = informe;
                    agregarInforme(informe);
                });
                
                console.log(`Cargados ${informes.length} informes recibidos guardados`);
            }
            
            // Cargar informes enviados
            const informesEnviadosGuardados = localStorage.getItem('gb_informes_enviados');
            if (informesEnviadosGuardados) {
                const informes = JSON.parse(informesEnviadosGuardados);
                informes.forEach(informe => {
                    informesEnviados[informe.id] = informe;
                    agregarInforme(informe);
                });
                
                console.log(`Cargados ${informes.length} informes enviados guardados`);
            }
        } catch (error) {
            console.error("Error al cargar informes guardados:", error);
        }
    }
    
    /**
     * Filtra los informes según el tipo
     * @param {string} filtro - Tipo de filtro ('todos', 'informes', 'ordenes')
     */
    function filtrarInformes(filtro) {
        const informes = document.querySelectorAll('.informe');
        
        // Guardar filtro actual
        filtroActual = filtro;
        
        informes.forEach(informe => {
            const tipo = informe.getAttribute('data-tipo');
            
            if (filtro === 'informes') {
                // Mostrar solo informes normales y urgentes
                informe.style.display = (tipo === 'normal' || tipo === 'urgente') ? 'block' : 'none';
            } else if (filtro === 'ordenes') {
                // Mostrar solo órdenes
                informe.style.display = tipo === 'orden' ? 'block' : 'none';
            } else {
                // Mostrar todos
                informe.style.display = 'block';
            }
        });
    }
    
    /**
     * Mejora en la visualización de informes con adjuntos
     * @param {Object} informe - Informe a agregar a la lista
     */
    function agregarInforme(informe) {
        const listaInformes = document.getElementById('lista-informes');
        if (!listaInformes) {
            console.error("Lista de informes no encontrada");
            return;
        }
        
        // Verificar si ya existe el informe en la lista
        const informeExistente = document.querySelector(`.informe[data-id="${informe.id}"]`);
        if (informeExistente) {
            console.log("El informe ya existe en la lista, no se duplica:", informe.id);
            return;
        }
        
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
        
        // Agregar clase para informes propios
        if (esPropio) {
            claseCSS += " propio";
        }
        
        // Formato de fecha más legible
        const fecha = MAIRA.Utils.formatearFecha(informe.timestamp);
        
        // Preparar información sobre destinatario/remitente
        let infoRemitente = "";
        if (esPropio) {
            // Si es propio, mostrar a quién se envió
            let destinatarioNombre = "Desconocido";
            
            if (informe.destinatario === "todos") {
                destinatarioNombre = "Todos";
            } else if (informe.destinatario === "comando") {
                destinatarioNombre = "Comando/Central";
            } else if (informe.destinatario && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados && window.MAIRA.GestionBatalla.elementosConectados[informe.destinatario]?.datos?.usuario) {
                destinatarioNombre = window.MAIRA.GestionBatalla.elementosConectados[informe.destinatario].datos.usuario;
            }
            
            infoRemitente = `Enviado a: ${destinatarioNombre}`;
        } else {
            // Si no es propio, mostrar quién lo envió
            let elementoInfo = "";
            if (informe.emisor.elemento) {
                if (informe.emisor.elemento.designacion) {
                    elementoInfo = informe.emisor.elemento.designacion;
                    if (informe.emisor.elemento.dependencia) {
                        elementoInfo += "/" + informe.emisor.elemento.dependencia;
                    }
                }
            }
            
            infoRemitente = `De: ${informe.emisor.nombre}${elementoInfo ? ` (${elementoInfo})` : ''}`;
        }
        
        // Información sobre adjunto
        let adjuntoHTML = '';
        if (informe.tieneAdjunto && informe.adjunto) {
            const tipoArchivo = informe.adjunto.tipo || 'application/octet-stream';
            let iconoAdjunto = 'fa-file';
            
            // Determinar icono según tipo de archivo
            if (tipoArchivo.startsWith('image/')) {
                iconoAdjunto = 'fa-file-image';
            } else if (tipoArchivo.startsWith('audio/')) {
                iconoAdjunto = 'fa-file-audio';
            } else if (tipoArchivo.startsWith('video/')) {
                iconoAdjunto = 'fa-file-video';
            } else if (tipoArchivo.includes('pdf')) {
                iconoAdjunto = 'fa-file-pdf';
            } else if (tipoArchivo.includes('word') || tipoArchivo.includes('document')) {
                iconoAdjunto = 'fa-file-word';
            } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('sheet')) {
                iconoAdjunto = 'fa-file-excel';
            } else if (tipoArchivo.includes('zip') || tipoArchivo.includes('compressed')) {
                iconoAdjunto = 'fa-file-archive';
            }
            
            adjuntoHTML = `
                <div class="informe-adjunto">
                    <i class="fas ${iconoAdjunto}"></i> 
                    <a href="#" class="ver-adjunto" data-id="${informe.id}">
                        ${informe.adjunto.nombre} (${MAIRA.Utils.formatearTamaño(informe.adjunto.tamaño)})
                    </a>
                </div>
            `;
        }
        
        // Crear elemento HTML del informe
        const informeHTML = `
            <div class="informe ${claseCSS}" data-id="${informe.id}" data-tipo="${informe.tipo}">
                <div class="informe-header">
                    <div class="informe-tipo">${iconoTipo}</div>
                    <div class="informe-titulo">
                        <strong>${informe.asunto}</strong>
                        <small>${fecha}</small>
                    </div>
                    <div class="informe-acciones">
                        <button class="btn-responder" data-id="${informe.id}" title="Responder">
                            <i class="fas fa-reply"></i>
                        </button>
                        ${!esPropio ? `
                        <button class="btn-marcar-leido" data-id="${informe.id}" title="Marcar como leído">
                            <i class="fas fa-check"></i>
                        </button>` : ''}
                    </div>
                </div>
                
                <div class="informe-remitente">${infoRemitente}</div>
                
                <div class="informe-contenido mt-2">${informe.contenido}</div>
                
                ${adjuntoHTML}
                
                ${informe.posicion ? `
                <div class="informe-acciones mt-2">
                    <button class="btn-ubicacion" data-lat="${informe.posicion.lat}" data-lng="${informe.posicion.lng}">
                        <i class="fas fa-map-marker-alt"></i> Ver ubicación
                    </button>
                </div>` : ''}
            </div>
        `;
        
        // Añadir al inicio de la lista
        listaInformes.insertAdjacentHTML('afterbegin', informeHTML);
        
        // Configurar eventos para el nuevo informe
        configurarEventosInforme(informe.id);
    }
    
    /**
     * Configura eventos para un informe recién agregado
     * @param {string} informeId - ID del informe
     */
    function configurarEventosInforme(informeId) {
        // Botón de ver ubicación
        const btnUbicacion = document.querySelector(`.informe[data-id="${informeId}"] .btn-ubicacion`);
        if (btnUbicacion) {
            btnUbicacion.addEventListener('click', function() {
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lng = parseFloat(this.getAttribute('data-lng'));
                
                if (isNaN(lat) || isNaN(lng)) {
                    MAIRA.Utils.mostrarNotificacion("Coordenadas inválidas", "error");
                    return;
                }
                
                if (window.mapa) {
                    window.mapa.setView([lat, lng], 15);
                    
                    // Crear un marcador temporal
                    const tempMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'custom-div-icon temp-marker',
                            html: '<div class="temp-marker-pin"></div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    }).addTo(window.mapa);
                    
                    // Añadir popup con información
                    tempMarker.bindPopup(`<strong>Ubicación del informe</strong><br>${document.querySelector(`.informe[data-id="${informeId}"] .informe-titulo strong`).textContent}`).openPopup();
                    
                    // Eliminar el marcador después de 30 segundos
                    setTimeout(() => {
                        if (window.mapa && window.mapa.hasLayer(tempMarker)) {
                            window.mapa.removeLayer(tempMarker);
                        }
                    }, 30000);
                }
            });
        }
        
        // Botón para marcar como leído
        const btnMarcarLeido = document.querySelector(`.informe[data-id="${informeId}"] .btn-marcar-leido`);
        if (btnMarcarLeido) {
            btnMarcarLeido.addEventListener('click', function() {
                if (socket && socket.connected) {
                    socket.emit('informeLeido', { informeId: informeId });
                    
                    // Marcar visualmente como leído
                    document.querySelector(`.informe[data-id="${informeId}"]`).classList.add('leido');
                    this.style.display = 'none'; // Ocultar botón
                }
            });
        }
        
        // Botón para responder
        const btnResponder = document.querySelector(`.informe[data-id="${informeId}"] .btn-responder`);
        if (btnResponder) {
            btnResponder.addEventListener('click', function() {
                prepararRespuestaInforme(informeId);
            });
        }
        
        // Enlace para ver adjunto
        const verAdjunto = document.querySelector(`.informe[data-id="${informeId}"] .ver-adjunto`);
        if (verAdjunto) {
            verAdjunto.addEventListener('click', function(e) {
                e.preventDefault();
                mostrarAdjuntoInforme(informeId);
            });
        }
    }
    
    /**
     * Prepara el formulario para responder a un informe
     * @param {string} informeId - ID del informe a responder
     */
    function prepararRespuestaInforme(informeId) {
        // Obtener informe original
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (!informeElement) return;
        
        // Obtener datos básicos
        const asuntoOriginal = informeElement.querySelector('.informe-titulo strong').textContent;
        const remitente = informeElement.querySelector('.informe-remitente').textContent.replace('De:', '').trim();
        
        // Cambiar a la pestaña de crear informe
        const btnCrearInforme = document.getElementById('btn-crear-informe');
        if (btnCrearInforme) {
            btnCrearInforme.click();
        }
        
        // Preparar formulario de respuesta
        const tipoInforme = document.getElementById('tipo-informe');
        const asuntoInforme = document.getElementById('asunto-informe');
        const contenidoInforme = document.getElementById('contenido-informe');
        const destinatarioInforme = document.getElementById('destinatario-informe');
        
        if (tipoInforme && asuntoInforme && contenidoInforme && destinatarioInforme) {
            // Verificar si el informe original es de otro usuario para responder
            const esPropio = informeElement.classList.contains('propio');
            
            if (!esPropio) {
                // Si no es propio, responder al emisor original
                // Buscar el ID del emisor
                let emisorId = null;
                
                // Buscar en los informes recibidos
                if (informesRecibidos[informeId]) {
                    emisorId = informesRecibidos[informeId].emisor.id;
                } else {
                    // Buscar en los elementos conectados
                    if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
                        Object.entries(window.MAIRA.GestionBatalla.elementosConectados).forEach(([id, datos]) => {
                            if (datos.datos && datos.datos.usuario && datos.datos.usuario === remitente) {
                                emisorId = id;
                            }
                        });
                    }
                }
                
                if (emisorId) {
                    destinatarioInforme.value = emisorId;
                }
            }
            
            // Preparar asunto como respuesta
            if (!asuntoOriginal.startsWith('Re:')) {
                asuntoInforme.value = 'Re: ' + asuntoOriginal;
            } else {
                asuntoInforme.value = asuntoOriginal;
            }
            
            // Añadir cita del mensaje original
            const contenidoOriginal = informeElement.querySelector('.informe-contenido').innerHTML;
            contenidoInforme.value = '\n\n-------- Mensaje Original --------\n' + 
                contenidoOriginal.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
            
            // Enfocar al inicio para que el usuario escriba su respuesta
            contenidoInforme.setSelectionRange(0, 0);
            contenidoInforme.focus();
        }
    }
    
    /**
     * Muestra el archivo adjunto de un informe
     * @param {string} informeId - ID del informe
     */
    function mostrarAdjuntoInforme(informeId) {
        // Buscar el informe en registros existentes
        let informeData = null;
        
        // Buscar en informes recibidos
        if (informesRecibidos[informeId]) {
            informeData = informesRecibidos[informeId];
        } 
        // Buscar en informes enviados
        else if (informesEnviados[informeId]) {
            informeData = informesEnviados[informeId];
        }
        
        // Si no se encuentra en memoria, buscar en el almacenamiento local
        if (!informeData) {
            // Intentar recuperar de localStorage si está disponible
            const informesGuardados = localStorage.getItem('gb_informes_recibidos');
            if (informesGuardados) {
                try {
                    const informes = JSON.parse(informesGuardados);
                    informeData = informes.find(inf => inf.id === informeId);
                } catch (error) {
                    console.error("Error al recuperar informes del almacenamiento local:", error);
                }
            }
        }
        
        // Si aún no se encontró, solicitar al servidor
        if (!informeData && socket && socket.connected) {
            // Mostrar cargando
            MAIRA.Utils.mostrarNotificacion("Obteniendo archivo adjunto...", "info");
            
            // Solicitar al servidor el informe completo
            socket.emit('obtenerInformeCompleto', { informeId: informeId }, function(respuesta) {
                if (respuesta && respuesta.informe) {
                    mostrarVisorAdjunto(respuesta.informe);
                } else {
                    MAIRA.Utils.mostrarNotificacion("No se pudo obtener el archivo adjunto", "error");
                }
            });
            return;
        }
        
        // Si no se encontró o no tiene adjunto
        if (!informeData || !informeData.adjunto) {
            MAIRA.Utils.mostrarNotificacion("No se pudo acceder al archivo adjunto", "error");
            return;
        }
        
        // Mostrar el visor de adjuntos
        mostrarVisorAdjunto(informeData);
    }
    
    /**
     * Muestra un visor para el archivo adjunto
     * @param {Object} informe - Informe con el adjunto
     */
    function mostrarVisorAdjunto(informe) {
        if (!informe || !informe.adjunto) return;
        
        const adjunto = informe.adjunto;
        const tipoArchivo = adjunto.tipo || 'application/octet-stream';
        const tipoBase = tipoArchivo.split('/')[0];  // image, video, audio, etc.
        
        // Crear modal para visualizar el adjunto
        const modalVisor = document.createElement('div');
        modalVisor.className = 'modal-visor-adjunto';
        modalVisor.style.position = 'fixed';
        modalVisor.style.top = '0';
        modalVisor.style.left = '0';
        modalVisor.style.width = '100%';
        modalVisor.style.height = '100%';
        modalVisor.style.backgroundColor = 'rgba(0,0,0,0.85)';
        modalVisor.style.zIndex = '10000';
        modalVisor.style.display = 'flex';
        modalVisor.style.flexDirection = 'column';
        
        // Cabecera con información y botones
        const header = document.createElement('div');
        header.style.width = '100%';
        header.style.padding = '15px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.backgroundColor = 'rgba(0,0,0,0.7)';
        header.style.color = 'white';
        
        // Nombre del archivo e información
        const infoContainer = document.createElement('div');
        infoContainer.style.display = 'flex';
        infoContainer.style.flexDirection = 'column';
        
        const nombreArchivo = document.createElement('h3');
        nombreArchivo.textContent = adjunto.nombre;
        nombreArchivo.style.margin = '0';
        nombreArchivo.style.padding = '0';
        nombreArchivo.style.fontSize = '18px';
        
        const infoArchivo = document.createElement('span');
        infoArchivo.textContent = `${tipoArchivo} · ${MAIRA.Utils.formatearTamaño(adjunto.tamaño || 0)}`;
        infoArchivo.style.fontSize = '12px';
        infoArchivo.style.opacity = '0.8';
        
        infoContainer.appendChild(nombreArchivo);
        infoContainer.appendChild(infoArchivo);
        
        // Botones de acción
        const botones = document.createElement('div');
        
        // Botón para descargar
        const btnDescargar = document.createElement('button');
        btnDescargar.innerHTML = '<i class="fas fa-download"></i> Descargar';
        btnDescargar.style.marginRight = '10px';
        btnDescargar.style.padding = '8px 15px';
        btnDescargar.style.backgroundColor = '#4caf50';
        btnDescargar.style.color = 'white';
        btnDescargar.style.border = 'none';
        btnDescargar.style.borderRadius = '4px';
        btnDescargar.style.cursor = 'pointer';
        
        // Botón para cerrar
        const btnCerrar = document.createElement('button');
        btnCerrar.innerHTML = '<i class="fas fa-times"></i>';
        btnCerrar.style.padding = '8px 15px';
        btnCerrar.style.backgroundColor = '#f44336';
        btnCerrar.style.color = 'white';
        btnCerrar.style.border = 'none';
        btnCerrar.style.borderRadius = '4px';
        btnCerrar.style.cursor = 'pointer';
        
        botones.appendChild(btnDescargar);
        botones.appendChild(btnCerrar);
        
        header.appendChild(infoContainer);
        header.appendChild(botones);
        
        // Contenedor principal para el contenido
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.style.flex = '1';
        contenedorPrincipal.style.display = 'flex';
        contenedorPrincipal.style.alignItems = 'center';
        contenedorPrincipal.style.justifyContent = 'center';
        contenedorPrincipal.style.overflow = 'auto';
        contenedorPrincipal.style.padding = '20px';
        
        // Contenido según tipo de archivo
        const contenido = document.createElement('div');
        contenido.style.maxWidth = '90%';
        contenido.style.maxHeight = 'calc(100% - 40px)';
        contenido.style.display = 'flex';
        contenido.style.flexDirection = 'column';
        contenido.style.alignItems = 'center';
        contenido.style.justifyContent = 'center';
        
        // Preparar contenido en base al tipo
        if (tipoBase === 'image') {
            // Es una imagen
            const imagen = document.createElement('img');
            imagen.src = adjunto.datos;
            imagen.style.maxWidth = '100%';
            imagen.style.maxHeight = 'calc(100vh - 120px)';
            imagen.style.objectFit = 'contain';
            imagen.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            
            // Añadir controles de zoom
            const controles = document.createElement('div');
            controles.style.marginTop = '10px';
            controles.style.display = 'flex';
            controles.style.gap = '10px';
            
            const btnZoomIn = document.createElement('button');
            btnZoomIn.innerHTML = '<i class="fas fa-search-plus"></i>';
            btnZoomIn.style.padding = '5px 10px';
            btnZoomIn.style.backgroundColor = '#555';
            btnZoomIn.style.color = 'white';
            btnZoomIn.style.border = 'none';
            btnZoomIn.style.borderRadius = '4px';
            
            const btnZoomOut = document.createElement('button');
            btnZoomOut.innerHTML = '<i class="fas fa-search-minus"></i>';
            btnZoomOut.style.padding = '5px 10px';
            btnZoomOut.style.backgroundColor = '#555';
            btnZoomOut.style.color = 'white';
            btnZoomOut.style.border = 'none';
            btnZoomOut.style.borderRadius = '4px';
            
            const btnRotate = document.createElement('button');
            btnRotate.innerHTML = '<i class="fas fa-redo"></i>';
            btnRotate.style.padding = '5px 10px';
            btnRotate.style.backgroundColor = '#555';
            btnRotate.style.color = 'white';
            btnRotate.style.border = 'none';
            btnRotate.style.borderRadius = '4px';
            
            controles.appendChild(btnZoomIn);
            controles.appendChild(btnZoomOut);
            controles.appendChild(btnRotate);
            
            // Variables para zoom y rotación
            let zoomLevel = 1;
            let rotation = 0;
            
            btnZoomIn.addEventListener('click', () => {
                zoomLevel = Math.min(zoomLevel + 0.25, 3);
                imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
            });
            
            btnZoomOut.addEventListener('click', () => {
                zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
                imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
            });
            
            btnRotate.addEventListener('click', () => {
                rotation = (rotation + 90) % 360;
                imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
            });
            
            contenido.appendChild(imagen);
            contenido.appendChild(controles);
        } else if (tipoBase === 'audio') {
            // Es audio
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = adjunto.datos;
            audio.style.width = '100%';
            audio.style.minWidth = '300px';
            
            // Añadir elemento de visualización de onda de audio
            const waveformContainer = document.createElement('div');
            waveformContainer.style.width = '100%';
            waveformContainer.style.height = '60px';
            waveformContainer.style.backgroundColor = '#f0f0f0';
            waveformContainer.style.borderRadius = '4px';
            waveformContainer.style.marginTop = '10px';
            
            contenido.appendChild(audio);
            contenido.appendChild(waveformContainer);
        } else if (tipoBase === 'video') {
            // Es video
            const video = document.createElement('video');
            video.controls = true;
            video.src = adjunto.datos;
            video.style.maxWidth = '100%';
            video.style.maxHeight = 'calc(100vh - 150px)';
            video.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            
            // Añadir controles personalizados si lo deseas
            const videoControles = document.createElement('div');
            videoControles.style.marginTop = '10px';
            videoControles.style.width = '100%';
            videoControles.style.display = 'flex';
            videoControles.style.justifyContent = 'center';
            videoControles.style.gap = '10px';
            
            contenido.appendChild(video);
            contenido.appendChild(videoControles);
            
            // Reproducir automáticamente
            setTimeout(() => {
                video.play().catch(err => {
                    console.log("Reproducción automática bloqueada por el navegador:", err);
                });
            }, 100);
        } else {
            // Tipo no soportado para visualización directa
            const mensaje = document.createElement('div');
            mensaje.style.padding = '30px';
            mensaje.style.backgroundColor = 'white';
            mensaje.style.borderRadius = '8px';
            mensaje.style.textAlign = 'center';
            
            mensaje.innerHTML = `
                <i class="fas fa-file" style="font-size: 48px; color: #607d8b; margin-bottom: 20px;"></i>
                <h3>Tipo de archivo no soportado para visualización</h3>
                <p>Utilice el botón de descarga para guardar el archivo.</p>
                <p>Tipo: ${tipoArchivo}</p>
                <p>Tamaño: ${MAIRA.Utils.formatearTamaño(adjunto.tamaño || 0)}</p>
            `;
            
            contenido.appendChild(mensaje);
        }
        
        contenedorPrincipal.appendChild(contenido);
        
        // Añadir elementos al modal
        modalVisor.appendChild(header);
        modalVisor.appendChild(contenedorPrincipal);
        
        // Añadir modal al body
        document.body.appendChild(modalVisor);
        
        // Configurar eventos
        btnCerrar.addEventListener('click', function() {
            if (document.body.contains(modalVisor)) {
                document.body.removeChild(modalVisor);
            }
        });
        
        btnDescargar.addEventListener('click', function() {
            descargarAdjunto(adjunto);
        });
        
        // Permitir cerrar con Escape
        document.addEventListener('keydown', function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                if (document.body.contains(modalVisor)) {
                    document.body.removeChild(modalVisor);
                }
                document.removeEventListener('keydown', cerrarConEscape);
            }
        });
    }
    
    /**
     * Descarga un archivo adjunto
     * @param {Object} adjunto - Información del adjunto
     */
    function descargarAdjunto(adjunto) {
        if (!adjunto || !adjunto.datos) {
            MAIRA.Utils.mostrarNotificacion("No se puede descargar el archivo", "error");
            return;
        }
        
        // Crear elemento de enlace temporal
        const enlace = document.createElement('a');
        enlace.href = adjunto.datos;
        enlace.download = adjunto.nombre || 'archivo_adjunto';
        
        // Añadir al DOM, simular clic y eliminar
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        
        MAIRA.Utils.mostrarNotificacion("Descarga iniciada", "success");
    }
    
    /**
     * Muestra una previsualización del archivo adjunto seleccionado
     */
    function previewAdjunto() {
        const input = document.getElementById('adjunto-informe');
        const previewContainer = document.getElementById('preview-adjunto');
        
        if (!input || !previewContainer) return;
        
        // Limpiar previsualización anterior
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        
        if (!input.files || input.files.length === 0) return;
        
        const file = input.files[0];
        
        // Verificar tamaño máximo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            MAIRA.Utils.mostrarNotificacion("El archivo excede el tamaño máximo permitido (5MB)", "error");
            input.value = '';
            return;
        }
        
        // Mostrar previsualización según tipo de archivo
        if (file.type.startsWith('image/')) {
            // Previsualización de imagen
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">
                        <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                        <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                previewContainer.style.display = 'block';
                
                // Configurar evento de eliminar
                document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                    input.value = '';
                    previewContainer.innerHTML = '';
                    previewContainer.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('audio/')) {
            // Previsualización de audio
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <audio controls style="width: 100%;">
                            <source src="${e.target.result}" type="${file.type}">
                            Tu navegador no soporta la reproducción de audio.
                        </audio>
                        <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                        <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                previewContainer.style.display = 'block';
                
                // Configurar evento de eliminar
                document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                    input.value = '';
                    previewContainer.innerHTML = '';
                    previewContainer.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            // Previsualización de video
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <video controls style="max-width: 100%; max-height: 200px;">
                            <source src="${e.target.result}" type="${file.type}">
                            Tu navegador no soporta la reproducción de video.
                        </video>
                        <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                        <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                previewContainer.style.display = 'block';
                
                // Configurar evento de eliminar
                document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                    input.value = '';
                    previewContainer.innerHTML = '';
                    previewContainer.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        } else {
            // Cualquier otro tipo de archivo
            previewContainer.innerHTML = `
                <div style="text-align: center; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <i class="fas fa-file" style="font-size: 24px; color: #607d8b;"></i>
                    <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                    <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                        <i class="fas fa-trash"></i> Eliminarbutton>
                    </div>
                </div>
            `;
            previewContainer.style.display = 'block';
            
            // Configurar evento de eliminar
            document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                input.value = '';
                previewContainer.innerHTML = '';
                previewContainer.style.display = 'none';
            });
        }
    }
    
    /**
     * Captura una foto usando la cámara
     */
    function capturarFoto() {
        // Verificar soporte de getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta acceso a la cámara", "error");
            return;
        }
        
        // Crear elementos para la captura
        const modalCaptura = document.createElement('div');
        modalCaptura.className = 'modal-captura-multimedia';
        modalCaptura.style.position = 'fixed';
        modalCaptura.style.top = '0';
        modalCaptura.style.left = '0';
        modalCaptura.style.width = '100%';
        modalCaptura.style.height = '100%';
        modalCaptura.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalCaptura.style.zIndex = '10000';
        modalCaptura.style.display = 'flex';
        modalCaptura.style.flexDirection = 'column';
        modalCaptura.style.alignItems = 'center';
        modalCaptura.style.justifyContent = 'center';
        
        modalCaptura.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Capturar foto</h3>
            </div>
            <video id="camera-preview" style="max-width: 90%; max-height: 60vh; background: #000; border: 3px solid #fff;" autoplay></video>
            <canvas id="photo-canvas" style="display: none;"></canvas>
            <div style="margin-top: 20px;">
                <button id="btn-capturar" class="btn btn-primary mx-2">
                    <i class="fas fa-camera"></i> Capturar
                </button>
                <button id="btn-cambiar-camara" class="btn btn-info mx-2">
                    <i class="fas fa-sync"></i> Cambiar cámara
                </button>
                <button id="btn-cancelar-captura" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        `;
        
        document.body.appendChild(modalCaptura);
        
        // Variables para la captura
        let stream = null;
        let facingMode = 'environment'; // Comenzar con cámara trasera en móviles
        
        // Función para iniciar la cámara
        function iniciarCamara() {
            const constraints = {
                video: {
                    facingMode: facingMode
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(videoStream) {
                    stream = videoStream;
                    const video = document.getElementById('camera-preview');
                    video.srcObject = stream;
                })
                .catch(function(error) {
                    console.error("Error accediendo a la cámara:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder a la cámara: " + error.message, "error");
                    cerrarModalCaptura();
                });
        }
        
        // Función para cambiar de cámara
        function cambiarCamara() {
            if (stream) {
                // Detener stream actual
                stream.getTracks().forEach(track => track.stop());
                
                // Cambiar modo
                facingMode = facingMode === 'user' ? 'environment' : 'user';
                
                // Reiniciar cámara
                iniciarCamara();
            }
        }
        
        // Función para capturar foto
        function capturar() {
            const video = document.getElementById('camera-preview');
            const canvas = document.getElementById('photo-canvas');
            
            // Configurar canvas con dimensiones del video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Dibujar frame actual del video en el canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir a data URL (formato JPEG)
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            
            // Detener stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Cerrar modal
            cerrarModalCaptura();
            
            // Crear archivo desde dataURL
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `foto_${new Date().toISOString().replace(/:/g, '-')}.jpg`, { type: 'image/jpeg' });
                    
                    // Asignar al input de archivo y disparar evento change
                    const fileInput = document.getElementById('adjunto-informe');
                    
                    // Crear un DataTransfer para simular la selección de archivo
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                    
                    // Disparar evento change para actualizar la previsualización
                    const event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);
                })
                .catch(error => {
                    console.error("Error procesando la imagen:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al procesar la imagen", "error");
                });
        }
        
        // Función para cerrar el modal
        function cerrarModalCaptura() {
            // Detener stream si existe
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Eliminar modal
            if (document.body.contains(modalCaptura)) {
                document.body.removeChild(modalCaptura);
            }
        }
        
        // Configurar eventos
        iniciarCamara();
        
        document.getElementById('btn-capturar').addEventListener('click', capturar);
        document.getElementById('btn-cambiar-camara').addEventListener('click', cambiarCamara);
        document.getElementById('btn-cancelar-captura').addEventListener('click', cerrarModalCaptura);
        
        // Permitir cerrar con Escape
        document.addEventListener('keydown', function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                cerrarModalCaptura();
                document.removeEventListener('keydown', cerrarConEscape);
            }
        });
    }
    
    /**
     * Graba audio usando el micrófono
     */
    function grabarAudio() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta grabación de audio", "error");
            return;
        }
        
        // Crear elementos para la grabación
        const modalGrabacion = document.createElement('div');
        modalGrabacion.className = 'modal-grabacion-audio';
        modalGrabacion.style.position = 'fixed';
        modalGrabacion.style.top = '0';
        modalGrabacion.style.left = '0';
        modalGrabacion.style.width = '100%';
        modalGrabacion.style.height = '100%';
        modalGrabacion.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalGrabacion.style.zIndex = '10000';
        modalGrabacion.style.display = 'flex';
        modalGrabacion.style.flexDirection = 'column';
        modalGrabacion.style.alignItems = 'center';
        modalGrabacion.style.justifyContent = 'center';
        
        modalGrabacion.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Grabar audio</h3>
            </div>
            <div id="visualizador-audio" style="width: 300px; height: 60px; background: #333; border-radius: 8px; margin-bottom: 15px;"></div>
            <div id="tiempo-grabacion" style="font-size: 24px; color: white; margin-bottom: 20px;">00:00</div>
            <div>
                <button id="btn-iniciar-grabacion" class="btn btn-primary mx-2">
                    <i class="fas fa-microphone"></i> Iniciar grabación
                </button>
                <button id="btn-detener-grabacion" class="btn btn-warning mx-2" disabled>
                    <i class="fas fa-stop"></i> Detener
                </button>
                <button id="btn-cancelar-grabacion" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <div id="reproductor-audio" style="margin-top: 20px; display: none;">
                <audio id="audio-preview" controls style="width: 300px;"></audio>
                <div style="margin-top: 10px;">
                    <button id="btn-guardar-audio" class="btn btn-success mx-2">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                    <button id="btn-descartar-audio" class="btn btn-secondary mx-2">
                        <i class="fas fa-trash"></i> Descartar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalGrabacion);
        
        // Variables para la grabación
        let stream = null;
        let mediaRecorder = null;
        let chunks = [];
        let tiempoInicio = null;
        let timerInterval = null;
        let audioURL = null;
        let audioBlob = null;
        let visualizerInterval = null;
        
        // Función para actualizar el visualizador de audio
        function actualizarVisualizador() {
            if (!stream) return;
            
            // Crear un analizador de audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Actualizar visualizador
            visualizerInterval = setInterval(() => {
                if (!mediaRecorder || mediaRecorder.state !== 'recording') {
                    clearInterval(visualizerInterval);
                    return;
                }
                
                analyser.getByteFrequencyData(dataArray);
                
                // Calcular volumen promedio
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                
                // Actualizar visualizador
                const visualizer = document.getElementById('visualizador-audio');
                if (visualizer) {
                    // Crear representación visual de la onda de audio
                    let barHTML = '';
                    for (let i = 0; i < bufferLength; i++) {
                        const barHeight = Math.max(2, dataArray[i] / 2); // Escalar para que se vea bien
                        barHTML += `<div style="width: 2px; height: ${barHeight}px; background: #4CAF50; margin: 0 1px;"></div>`;
                    }
                    visualizer.innerHTML = `<div style="display: flex; align-items: flex-end; justify-content: center; height: 100%;">${barHTML}</div>`;
                }
            }, 100);
        }
        
        // Función para iniciar grabación
        function iniciarGrabacion() {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(audioStream) {
                    stream = audioStream;
                    
                    // Crear MediaRecorder con mejor tipo de MIME
                    const tiposMIME = [
                        'audio/webm',
                        'audio/ogg',
                        'audio/mp4'
                    ];
                    
                    let tipoSeleccionado = '';
                    for (const tipo of tiposMIME) {
                        if (MediaRecorder.isTypeSupported(tipo)) {
                            tipoSeleccionado = tipo;
                            break;
                        }
                    }
                    
                    if (!tipoSeleccionado) {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta ningún formato de audio compatible", "error");
                        cerrarModalGrabacion();
                        return;
                    }
                    
                    mediaRecorder = new MediaRecorder(stream, { mimeType: tipoSeleccionado });
                    
                    // Evento para capturar datos
                    mediaRecorder.ondataavailable = function(e) {
                        chunks.push(e.data);
                    };
                    
                    // Evento para cuando se completa la grabación
                    mediaRecorder.onstop = function() {
                        audioBlob = new Blob(chunks, { type: tipoSeleccionado });
                        audioURL = URL.createObjectURL(audioBlob);
                        
                        const audioPreview = document.getElementById('audio-preview');
                        audioPreview.src = audioURL;
                        audioPreview.style.display = 'block';
                        
                        document.getElementById('reproductor-audio').style.display = 'block';
                        document.getElementById('visualizador-audio').style.display = 'none';
                        
                        // Detener temporizador
                        clearInterval(timerInterval);
                    };
                    
                    // Iniciar grabación
                    mediaRecorder.start(100); // Guardar en fragmentos de 100ms
                    tiempoInicio = Date.now();
                    
                    // Iniciar temporizador
                    timerInterval = setInterval(actualizarTiempo, 1000);
                    
                    // Iniciar visualizador
                    actualizarVisualizador();
                    
                    // Actualizar botones
                    document.getElementById('btn-iniciar-grabacion').disabled = true;
                    document.getElementById('btn-detener-grabacion').disabled = false;
                })
                .catch(function(error) {
                    console.error("Error accediendo al micrófono:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder al micrófono: " + error.message, "error");
                    cerrarModalGrabacion();
                });
        }
        
        // Función para actualizar el tiempo de grabación
        function actualizarTiempo() {
            if (!tiempoInicio) return;
            
            const tiempoActual = Date.now();
            const duracion = Math.floor((tiempoActual - tiempoInicio) / 1000);
            const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
            const segundos = (duracion % 60).toString().padStart(2, '0');
            
            document.getElementById('tiempo-grabacion').textContent = `${minutos}:${segundos}`;
            
            // Limitar grabación a 60 segundos
            if (duracion >= 60) {
                detenerGrabacion();
                MAIRA.Utils.mostrarNotificacion("Límite de 1 minuto alcanzado", "info");
            }
        }
        
        // Función para detener grabación
        function detenerGrabacion() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                
                // Actualizar botones
                document.getElementById('btn-iniciar-grabacion').disabled = false;
                document.getElementById('btn-detener-grabacion').disabled = true;
            }
        }
        
        // Función para cerrar el modal de grabación
        function cerrarModalGrabacion() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            if (visualizerInterval) {
                clearInterval(visualizerInterval);
            }
            
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Función para guardar el audio
        function guardarAudio() {
            // Convertir Blob a File
            const file = new File([audioBlob], `audio_${new Date().toISOString().replace(/:/g, '-')}.webm`, { type: audioBlob.type });
            
            // Asignar al input de archivo
            const fileInput = document.getElementById('adjunto-informe');
            if (!fileInput) {
                MAIRA.Utils.mostrarNotificacion("No se pudo encontrar el campo de adjunto", "error");
                return;
            }
            
            try {
                // Crear un DataTransfer para simular la selección de archivo
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Disparar evento change para actualizar la previsualización
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
                
                // Cerrar modal
                cerrarModalGrabacion();
                
                MAIRA.Utils.mostrarNotificacion("Audio grabado correctamente", "success");
            } catch (error) {
                console.error("Error al guardar audio:", error);
                MAIRA.Utils.mostrarNotificacion("Error al guardar el audio: " + error.message, "error");
            }
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion').addEventListener('click', iniciarGrabacion);
        document.getElementById('btn-detener-grabacion').addEventListener('click', detenerGrabacion);
        document.getElementById('btn-cancelar-grabacion').addEventListener('click', cerrarModalGrabacion);
        document.getElementById('btn-guardar-audio').addEventListener('click', guardarAudio);
        document.getElementById('btn-descartar-audio').addEventListener('click', cerrarModalGrabacion);
    }
    
    /**
     * Graba video usando la cámara
     */
    function grabarVideo() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta grabación de video", "error");
            return;
        }
        
        // Crear elementos para la grabación
        const modalGrabacion = document.createElement('div');
        modalGrabacion.className = 'modal-grabacion-video';
        modalGrabacion.style.position = 'fixed';
        modalGrabacion.style.top = '0';
        modalGrabacion.style.left = '0';
        modalGrabacion.style.width = '100%';
        modalGrabacion.style.height = '100%';
        modalGrabacion.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalGrabacion.style.zIndex = '10000';
        modalGrabacion.style.display = 'flex';
        modalGrabacion.style.flexDirection = 'column';
        modalGrabacion.style.alignItems = 'center';
        modalGrabacion.style.justifyContent = 'center';
        
        modalGrabacion.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Grabar video</h3>
            </div>
            <video id="video-preview" style="max-width: 90%; max-height: 60vh; background: #000; border: 3px solid #fff;" autoplay muted></video>
            <div id="tiempo-grabacion-video" style="font-size: 24px; color: white; margin: 10px 0;">00:00</div>
            <div>
                <button id="btn-iniciar-grabacion-video" class="btn btn-primary mx-2">
                    <i class="fas fa-video"></i> Iniciar grabación
                </button>
                <button id="btn-detener-grabacion-video" class="btn btn-warning mx-2" disabled>
                    <i class="fas fa-stop"></i> Detener
                </button>
                <button id="btn-cancelar-grabacion-video" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <div id="reproductor-video" style="margin-top: 20px; display: none;">
                <video id="video-grabado" controls style="max-width: 300px; max-height: 200px;"></video>
                <div style="margin-top: 10px;">
                    <button id="btn-guardar-video" class="btn btn-success mx-2">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                    <button id="btn-descartar-video" class="btn btn-secondary mx-2">
                        <i class="fas fa-trash"></i> Descartar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalGrabacion);
        
        // Variables para la grabación
        let stream = null;
        let mediaRecorder = null;
        let chunks = [];
        let tiempoInicio = null;
        let timerInterval = null;
        let videoURL = null;
        let videoBlob = null;
        
        // Función para iniciar grabación
        function iniciarGrabacionVideo() {
            const constraints = {
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(videoStream) {
                    stream = videoStream;
                    
                    // Mostrar preview
                    const video = document.getElementById('video-preview');
                    video.srcObject = stream;
                    
                    // Crear MediaRecorder con mejor tipo de MIME
                    const tiposMIME = [
                        'video/webm;codecs=vp9,opus',
                        'video/webm;codecs=vp8,opus',
                        'video/webm',
                        'video/mp4'
                    ];
                    
                    let tipoSeleccionado = '';
                    for (const tipo of tiposMIME) {
                        if (MediaRecorder.isTypeSupported(tipo)) {
                            tipoSeleccionado = tipo;
                            break;
                        }
                    }
                    
                    if (!tipoSeleccionado) {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta ningún formato de video compatible", "error");
                        cerrarModalGrabacionVideo();
                        return;
                    }
                    
                    mediaRecorder = new MediaRecorder(stream, { mimeType: tipoSeleccionado });
                    
                    // Evento para capturar datos
                    mediaRecorder.ondataavailable = function(e) {
                        if (e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };
                    
                    // Evento para cuando se completa la grabación
                    mediaRecorder.onstop = function() {
                        videoBlob = new Blob(chunks, { type: tipoSeleccionado });
                        videoURL = URL.createObjectURL(videoBlob);
                        
                        const videoGrabado = document.getElementById('video-grabado');
                        videoGrabado.src = videoURL;
                        videoGrabado.style.display = 'block';
                        
                        document.getElementById('reproductor-video').style.display = 'block';
                        document.getElementById('video-preview').style.display = 'none';
                        
                        // Detener temporizador
                        clearInterval(timerInterval);
                    };
                    
                    // Iniciar grabación
                    mediaRecorder.start(1000); // Guardar en fragmentos de 1 segundo
                    tiempoInicio = Date.now();
                    
                    // Iniciar temporizador
                    timerInterval = setInterval(actualizarTiempoVideo, 1000);
                    
                    // Actualizar botones
                    document.getElementById('btn-iniciar-grabacion-video').disabled = true;
                    document.getElementById('btn-detener-grabacion-video').disabled = false;
                })
                .catch(function(error) {
                    console.error("Error accediendo a la cámara o micrófono:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder a la cámara o micrófono: " + error.message, "error");
                    cerrarModalGrabacionVideo();
                });
        }
        
        // Función para actualizar el tiempo de grabación
        function actualizarTiempoVideo() {
            if (!tiempoInicio) return;
            
            const tiempoActual = Date.now();
            const duracion = Math.floor((tiempoActual - tiempoInicio) / 1000);
            const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
            const segundos = (duracion % 60).toString().padStart(2, '0');
            
            document.getElementById('tiempo-grabacion-video').textContent = `${minutos}:${segundos}`;
            
            // Limitar grabación a 30 segundos para evitar archivos demasiado grandes
            if (duracion >= 30) {
                detenerGrabacionVideo();
                MAIRA.Utils.mostrarNotificacion("Límite de 30 segundos alcanzado", "info");
            }
        }
        
        // Función para detener grabación
        function detenerGrabacionVideo() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                
                // Detener preview
                const video = document.getElementById('video-preview');
                video.pause();
                video.style.display = 'none';
                
                // Actualizar botones
                document.getElementById('btn-iniciar-grabacion-video').disabled = false;
                document.getElementById('btn-detener-grabacion-video').disabled = true;
            }
        }
        
        // Función para cerrar el modal de grabación
        function cerrarModalGrabacionVideo() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Función para guardar el video
        function guardarVideo() {
            // Verificar tamaño máximo (5MB)
            if (videoBlob.size > 5 * 1024 * 1024) {
                MAIRA.Utils.mostrarNotificacion("El video excede el tamaño máximo permitido de 5MB. La calidad será reducida.", "warning");
                
                // Comprimir video
                MAIRA.Utils.comprimirVideo(videoBlob).then(videoComprimido => {
                    procesarEnvioVideo(videoComprimido);
                }).catch(error => {
                    console.error("Error al comprimir video:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al comprimir el video. Intente una grabación más corta.", "error");
                });
            } else {
                procesarEnvioVideo(videoBlob);
            }
        }
        
        // Función auxiliar para procesar y guardar el video
        function procesarEnvioVideo(blob) {
            // Convertir Blob a File
            const file = new File([blob], `video_${new Date().toISOString().replace(/:/g, '-')}.webm`, { type: blob.type });
            
            // Asignar al input de archivo
            const fileInput = document.getElementById('adjunto-informe');
            if (!fileInput) {
                MAIRA.Utils.mostrarNotificacion("No se pudo encontrar el campo de adjunto", "error");
                return;
            }
            
            try {
                // Crear un DataTransfer para simular la selección de archivo
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Disparar evento change para actualizar la previsualización
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
                
                // Cerrar modal
                cerrarModalGrabacionVideo();
                
                MAIRA.Utils.mostrarNotificacion("Video grabado correctamente", "success");
            } catch (error) {
                console.error("Error al guardar video:", error);
                MAIRA.Utils.mostrarNotificacion("Error al guardar el video: " + error.message, "error");
            }
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion-video').addEventListener('click', iniciarGrabacionVideo);
        document.getElementById('btn-detener-grabacion-video').addEventListener('click', detenerGrabacionVideo);
        document.getElementById('btn-cancelar-grabacion-video').addEventListener('click', cerrarModalGrabacionVideo);document.getElementById('btn-guardar-video').addEventListener('click', guardarVideo);
        document.getElementById('btn-descartar-video').addEventListener('click', cerrarModalGrabacionVideo);
    }
    
    /**
     * Mejora en el envío de informes
     */
    function enviarInforme() {
        console.log("Preparando envío de informe");
        
        // Obtener datos del formulario
        const tipoInforme = document.getElementById('tipo-informe');
        const destinatarioInforme = document.getElementById('destinatario-informe');
        const asuntoInforme = document.getElementById('asunto-informe');
        const contenidoInforme = document.getElementById('contenido-informe');
        const archivoAdjunto = document.getElementById('adjunto-informe');
        
        if (!tipoInforme || !destinatarioInforme || !asuntoInforme || !contenidoInforme) {
            MAIRA.Utils.mostrarNotificacion("Error al enviar informe: elementos del formulario no encontrados", "error");
            return;
        }
        
        const tipo = tipoInforme.value;
        const destinatario = destinatarioInforme.value;
        const asunto = asuntoInforme.value.trim();
        const contenido = contenidoInforme.value.trim();
        
        if (!asunto || !contenido) {
            MAIRA.Utils.mostrarNotificacion("Debes completar asunto y contenido del informe", "error");
            return;
        }
        
        if (!destinatario) {
            MAIRA.Utils.mostrarNotificacion("Debes seleccionar un destinatario para el informe", "error");
            return;
        }
        
        // Verificar si tenemos la información del usuario
        if (!usuarioInfo || !elementoTrabajo) {
            MAIRA.Chat.agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
            MAIRA.Utils.mostrarNotificacion("No se ha iniciado sesión correctamente", "error");
            return;
        }
        
        // Mostrar indicador de carga mientras se prepara el informe
        mostrarCargandoEnvio(true);
        
        // Crear ID único para el informe
        const informeId = MAIRA.Utils.generarId();
        
        // Crear objeto de informe básico
        const informe = {
            id: informeId,
            emisor: {
                id: usuarioInfo.id,
                nombre: usuarioInfo.usuario,
                elemento: elementoTrabajo
            },
            destinatario: destinatario,
            tipo: tipo,
            asunto: asunto,
            contenido: contenido,
            leido: false,
            posicion: ultimaPosicion ? { 
                lat: ultimaPosicion.lat, 
                lng: ultimaPosicion.lng,
                precision: ultimaPosicion.precision,
                rumbo: ultimaPosicion.rumbo || 0
            } : null,
            timestamp: new Date().toISOString(),
            operacion: operacionActual,
            tieneAdjunto: false,
            adjunto: null
        };
        
        // Verificar si hay archivo adjunto
        if (archivoAdjunto && archivoAdjunto.files && archivoAdjunto.files.length > 0) {
            const archivo = archivoAdjunto.files[0];
            
            // Verificar tamaño máximo (5MB)
            if (archivo.size > 5 * 1024 * 1024) {
                MAIRA.Utils.mostrarNotificacion("El archivo adjunto excede el tamaño máximo permitido (5MB)", "error");
                mostrarCargandoEnvio(false);
                return;
            }
            
            // Procesar archivo
            procesarArchivoAdjunto(informe, archivo)
                .then(informeConAdjunto => {
                    finalizarEnvioInforme(informeConAdjunto);
                })
                .catch(error => {
                    console.error("Error al procesar archivo adjunto:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al procesar archivo adjunto: " + error.message, "error");
                    mostrarCargandoEnvio(false);
                });
        } else {
            // No hay archivo adjunto, continuar directamente
            finalizarEnvioInforme(informe);
            // Cerrar el modal de informe
            cerrarModalNuevoInforme();
        }
    }
    
    // Verificar que esta función existe, si no, crearla:
function cerrarModalNuevoInforme() {
    const modalInforme = document.getElementById('modal-nuevo-informe');
    if (modalInforme) {
        // Ocultar modal
        modalInforme.style.display = 'none';
        
        // Limpiar campos
        const inputAsunto = document.getElementById('informe-asunto');
        const inputContenido = document.getElementById('informe-contenido');
        
        if (inputAsunto) inputAsunto.value = '';
        if (inputContenido) inputContenido.value = '';
        
        // Limpiar adjuntos si hay
        const contenedorAdjuntos = document.getElementById('informe-adjuntos-preview');
        if (contenedorAdjuntos) contenedorAdjuntos.innerHTML = '';
    }
}

    /**
     * Procesa un archivo adjunto para un informe
     * @param {Object} informe - Informe al que se adjuntará el archivo
     * @param {File} archivo - Archivo a adjuntar
     * @returns {Promise<Object>} Promesa que resuelve al informe con el archivo adjunto
     */
    function procesarArchivoAdjunto(informe, archivo) {
        return new Promise((resolve, reject) => {
            try {
                // Crear un FileReader para leer el archivo como Data URL
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        // Datos del archivo en formato Data URL
                        const datosArchivo = e.target.result;
                        
                        // Crear objeto adjunto con información del archivo
                        const adjunto = {
                            nombre: archivo.name,
                            tipo: archivo.type,
                            tamaño: archivo.size,
                            datos: datosArchivo,
                            timestamp: new Date().toISOString()
                        };
                        
                        // Actualizar informe con información del adjunto
                        informe.tieneAdjunto = true;
                        informe.adjunto = adjunto;
                        
                        // Resolver con el informe actualizado
                        resolve(informe);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error("Error al leer el archivo"));
                };
                
                // Leer el archivo como Data URL
                reader.readAsDataURL(archivo);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Finaliza el envío del informe
     * @param {Object} informe - Informe a enviar
     */
    function finalizarEnvioInforme(informe) {
        console.log("Finalizando envío de informe:", informe);
        
        // Enviar al servidor si estamos conectados
        if (socket && socket.connected) {
            // Emitir evento con timeout para manejar errores de envío
            let timeoutId = setTimeout(() => {
                MAIRA.Utils.mostrarNotificacion("Tiempo de espera agotado al enviar el informe. Guardado localmente.", "warning");
                
                // Guardar en memoria
                informesEnviados[informe.id] = informe;
                
                // Guardar en localStorage
                guardarInformesLocalmente();
                
                // Agregar a la interfaz
                agregarInforme(informe);
                
                // Ocultar cargando
                mostrarCargandoEnvio(false);
            }, 10000); // 10 segundos de timeout
            
            socket.emit('nuevoInforme', informe, function(respuesta) {
                // Limpiar timeout ya que recibimos respuesta
                clearTimeout(timeoutId);
                
                console.log("Respuesta del servidor al enviar informe:", respuesta);
                mostrarCargandoEnvio(false);
                
                if (respuesta && respuesta.error) {
                    MAIRA.Utils.mostrarNotificacion("Error al enviar informe: " + respuesta.error, "error");
                    
                    // Guardar en memoria
                    informesEnviados[informe.id] = informe;
                    
                    // Guardar en localStorage
                    guardarInformesLocalmente();
                    
                    // Agregar a la interfaz
                    agregarInforme(informe);
                    
                    return;
                }
                
                // Guardar en memoria
                informesEnviados[informe.id] = informe;
                
                // Guardar en localStorage
                guardarInformesLocalmente();
                
                // Añadir a la interfaz
                agregarInforme(informe);
                
                // Notificar envío exitoso
                const tipoTexto = informe.tipo === "urgente" ? "URGENTE" : 
                                  (informe.tipo === "orden" ? "ORDEN" : "Informe");
                
                MAIRA.Chat.agregarMensajeChat("Sistema", `${tipoTexto} "${informe.asunto}" enviado correctamente`, "sistema");
                MAIRA.Utils.mostrarNotificacion(`${tipoTexto} "${informe.asunto}" enviado correctamente`, "success");
                
                // Limpiar formulario
                limpiarFormularioInforme();
            });
        } else {
            // No hay conexión, guardar localmente
            
            // Guardar en memoria
            informesEnviados[informe.id] = informe;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
            
            // Añadir a la interfaz local
            agregarInforme(informe);
            
            // Notificar guardado para envío posterior
            if (MAIRA.Chat && typeof MAIRA.Chat.agregarMensajeChat === 'function') {
                MAIRA.Chat.agregarMensajeChat("Sistema", `Nuevo informe de ${emisor.nombre || emisor}`, "sistema");
            } else {
                console.log(`Nuevo informe de ${emisor.nombre || emisor}`);
            }
            MAIRA.Utils.mostrarNotificacion(`Informe guardado para envío posterior`, "info");
            
            // Limpiar formulario
            limpiarFormularioInforme();
            mostrarCargandoEnvio(false);
        }
    }
    
    /**
     * Guarda los informes en localStorage
     */
    function guardarInformesLocalmente() {
        // Guardar informes enviados
        try {
            localStorage.setItem('gb_informes_enviados', JSON.stringify(Object.values(informesEnviados)));
            console.log(`Guardados ${Object.keys(informesEnviados).length} informes enviados en localStorage`);
        } catch (error) {
            console.error("Error al guardar informes enviados en localStorage:", error);
        }
        
        // Guardar informes recibidos
        try {
            localStorage.setItem('gb_informes_recibidos', JSON.stringify(Object.values(informesRecibidos)));
            console.log(`Guardados ${Object.keys(informesRecibidos).length} informes recibidos en localStorage`);
        } catch (error) {
            console.error("Error al guardar informes recibidos en localStorage:", error);
        }
    }
    
    /**
     * Limpia el formulario de informes
     */
    function limpiarFormularioInforme() {
        const formInforme = document.getElementById('form-informe');
        if (formInforme) {
            formInforme.reset();
        }
        
        // Si hay previsualizaciones de adjuntos, limpiarlas
        const previewAdjunto = document.getElementById('preview-adjunto');
        if (previewAdjunto) {
            previewAdjunto.innerHTML = '';
            previewAdjunto.style.display = 'none';
        }
        
        // Volver a la vista de informes
        const btnVerInformes = document.getElementById('btn-ver-informes');
        if (btnVerInformes) {
            btnVerInformes.click();
        }
    }
    
    /**
     * Muestra u oculta indicador de carga durante el envío
     * @param {boolean} mostrar - Indica si mostrar u ocultar
     */
    function mostrarCargandoEnvio(mostrar) {
        // Botón de enviar informe
        const botonEnviar = document.querySelector('#form-informe button[type="submit"]');
        
        if (botonEnviar) {
            if (mostrar) {
                // Guardar texto original y mostrar spinner
                botonEnviar.setAttribute('data-original-text', botonEnviar.innerHTML);
                botonEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                botonEnviar.disabled = true;
            } else {
                // Restaurar texto original
                const textoOriginal = botonEnviar.getAttribute('data-original-text') || 'Enviar Informe';
                botonEnviar.innerHTML = textoOriginal;
                botonEnviar.disabled = false;
            }
        }
    }
    
    /**
     * Actualiza el selector de destinatarios para informes
     */
    function actualizarSelectorDestinatariosInforme() {
        const destinatarioSelect = document.getElementById('destinatario-informe');
        if (!destinatarioSelect) {
            console.error("Selector de destinatario no encontrado");
            return;
        }
        
        console.log("Actualizando lista de destinatarios para informes");
        
        // Guardar opción seleccionada actualmente si existe
        const destinatarioActual = destinatarioSelect.value;
        
        // Limpiar opciones actuales
        destinatarioSelect.innerHTML = '';
        
        // Opción predeterminada
        const optionDefault = document.createElement('option');
        optionDefault.value = "";
        optionDefault.textContent = "Seleccionar destinatario...";
        destinatarioSelect.appendChild(optionDefault);
        
        // Opción para todos (broadcast)
        const optionTodos = document.createElement('option');
        optionTodos.value = "todos";
        optionTodos.textContent = "Todos los participantes";
        destinatarioSelect.appendChild(optionTodos);
        
        // Agregar opción para Comando/Central
        const optionComando = document.createElement('option');
        optionComando.value = "comando";
        optionComando.textContent = "Comando/Central";
        destinatarioSelect.appendChild(optionComando);
        
        // Separador visual
        const optionSeparator = document.createElement('option');
        optionSeparator.disabled = true;
        optionSeparator.textContent = "───────────────";
        destinatarioSelect.appendChild(optionSeparator);
        
        // Contador de elementos añadidos
        let elementosAgregados = 0;
        
        // Añadir opciones para cada elemento conectado
        // Usar los elementos de GestionBatalla si están disponibles
        if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
            Object.entries(window.MAIRA.GestionBatalla.elementosConectados).forEach(([id, datos]) => {
                // No incluir al usuario actual en la lista
                if (id !== usuarioInfo?.id) {
                    const elemento = datos.datos;
                    if (elemento && elemento.usuario) {
                        const option = document.createElement('option');
                        option.value = id;
                        
                        // Texto informativo con usuario y elemento
                        let textoElemento = "";
                        if (elemento.elemento) {
                            if (elemento.elemento.designacion) {
                                textoElemento = elemento.elemento.designacion;
                                if (elemento.elemento.dependencia) {
                                    textoElemento += "/" + elemento.elemento.dependencia;
                                }
                            }
                        }
                        
                        option.textContent = elemento.usuario + (textoElemento ? ` (${textoElemento})` : '');
                        destinatarioSelect.appendChild(option);
                        elementosAgregados++;
                    }
                }
            });
        }
        
        // Restaurar selección previa si es posible
        if (destinatarioActual && destinatarioSelect.querySelector(`option[value="${destinatarioActual}"]`)) {
            destinatarioSelect.value = destinatarioActual;
        }
        
        // Log informativo
        console.log(`Lista de destinatarios de informes actualizada con ${elementosAgregados} participantes disponibles`);
        
        return elementosAgregados;
    }
    
    /**
     * Recibe un informe
     * @param {Object} informe - Informe recibido
     */
    function recibirInforme(informe) {
        if (!informe) {
            console.warn("Informe vacío recibido");
            return;
        }
        
        console.log("Procesando informe recibido:", informe);
        
        // Verificar si ya tenemos este informe
        if (informesRecibidos[informe.id]) {
            console.log("Informe ya recibido anteriormente:", informe.id);
            return;
        }
        
        // Guardar en memoria
        informesRecibidos[informe.id] = informe;
        
        // Guardar en localStorage
        guardarInformesLocalmente();
        
        // Añadir a la interfaz
        agregarInforme(informe);
        
        // Notificar llegada de informe
        let tipoTexto = "";
        let tipoNotificacion = "info";
        
        switch (informe.tipo) {
            case "urgente":
                tipoTexto = "INFORME URGENTE";
                tipoNotificacion = "error";
                break;
            case "orden":
                tipoTexto = "ORDEN";
                tipoNotificacion = "warning";
                break;
            default:
                tipoTexto = "Informe";
                tipoNotificacion = "info";
        }
        
        // Reproducir sonido según el tipo de informe
        try {
            let rutaSonido = '/Client/audio/notification.mp3'; // Sonido por defecto
            
            if (informe.tipo === "urgente") {
                rutaSonido = '/Client/audio/alert_urgente.mp3';
            } else if (informe.tipo === "orden") {
                rutaSonido = '/Client/audio/alert_orden.mp3';
            }
            
            const audio = new Audio(rutaSonido);
            audio.play().catch(err => {
                console.log("Error al reproducir sonido, intentando con sonido genérico", err);
                // Sonido genérico como fallback
                const audioGenerico = new Audio('/Client/audio/notification.mp3');
                audioGenerico.play().catch(e => console.log("No se pudo reproducir ningún sonido", e));
            });
        } catch (e) {
            console.warn("Error al reproducir sonido:", e);
        }
        
        // Mostrar notificación
        MAIRA.Utils.mostrarNotificacion(
            `${tipoTexto} de ${informe.emisor.nombre}: ${informe.asunto}`, 
            tipoNotificacion,
            10000 // Duración más larga para informes importantes
        );
        
        // Añadir mensaje al chat
        MAIRA.Utils.agregarMensajeChat(
            "Sistema", 
            `Nuevo ${tipoTexto.toLowerCase()} recibido de ${informe.emisor.nombre}: "${informe.asunto}"`, 
            "sistema"
        );
        
        // Si es urgente o una orden, mostrar notificación especial
        if (informe.tipo === "urgente" || informe.tipo === "orden") {
            // Verificar si estamos en la pestaña de informes
            const tabInformes = document.getElementById('tab-informes');
            if (tabInformes && !tabInformes.classList.contains('active')) {
                mostrarNotificacionInformeImportante(informe);
            }
        }
        
        // Marcar como leído si estamos en la pestaña de informes
        const tabInformes = document.getElementById('tab-informes');
        if (tabInformes && tabInformes.classList.contains('active') && socket && socket.connected) {
            setTimeout(() => {
                socket.emit('informeLeido', { informeId: informe.id });
            }, 3000);
        }
    }
    
    /**
     * Muestra una notificación especial para informes importantes
     * @param {Object} informe - Informe recibido
     */
    function mostrarNotificacionInformeImportante(informe) {
        // Crear notificación flotante
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-informe-importante';
        notificacion.style.position = 'fixed';
        notificacion.style.bottom = '20px';
        notificacion.style.right = '20px';
        notificacion.style.backgroundColor = informe.tipo === 'urgente' ? '#f44336' : '#ff9800';
        notificacion.style.color = 'white';
        notificacion.style.padding = '15px';
        notificacion.style.borderRadius = '8px';
        notificacion.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notificacion.style.zIndex = '10000';
        
        // Icono según tipo
        const icono = informe.tipo === 'urgente' ? 'fa-exclamation-triangle' : 'fa-clipboard-list';
        
        notificacion.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 8px;">
                <i class="fas ${icono}"></i> 
                ${informe.tipo === 'urgente' ? 'INFORME URGENTE' : 'ORDEN'} recibido
            </div>
            <div style="margin-bottom: 10px;">
                De: ${informe.emisor.nombre} - "${informe.asunto}"
            </div>
            <button id="btn-ir-informes" style="background-color: white; color: #333; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                Ver informes
            </button>
        `;
        
        document.body.appendChild(notificacion);
        
        document.getElementById('btn-ir-informes').addEventListener('click', function() {
            // Cambiar a pestaña de informes
            const btnTabInformes = document.querySelector('.tab-btn[data-tab="tab-informes"]');
            if (btnTabInformes) {
                btnTabInformes.click();
            }
            
            // Marcar como leído
            if (socket && socket.connected) {
                socket.emit('informeLeido', { informeId: informe.id });
            }
            
            // Eliminar notificación
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        });
        
        // Auto ocultar después de 15 segundos para informes urgentes
        const tiempoOcultar = informe.tipo === 'urgente' ? 15000 : 10000;
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        }, tiempoOcultar);
    }
    
    /**
     * Marca un informe como leído
     * @param {string} informeId - ID del informe a marcar
     */
    function marcarInformeLeido(informeId) {
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (informeElement) {
            informeElement.classList.add('leido');
            
            // Ocultar botón de marcar como leído si existe
            const btnMarcarLeido = informeElement.querySelector('.btn-marcar-leido');
            if (btnMarcarLeido) {
                btnMarcarLeido.style.display = 'none';
            }
        }
        
        // Actualizar en memoria si tenemos el informe
        if (informesRecibidos[informeId]) {
            informesRecibidos[informeId].leido = true;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
        }
    }
    
    /**
     * Exporta los informes a un archivo
     * @param {string} formato - Formato de exportación ('txt', 'json', 'html')
     */
    function exportarInformes(formato = 'html') {
        const listaInformes = document.querySelectorAll('.informe');
        if (!listaInformes.length) {
            MAIRA.Utils.mostrarNotificacion("No hay informes para exportar", "warning");
            return;
        }
        
        // Aplicar filtro actual
        const informesFiltrados = Array.from(listaInformes).filter(informe => {
            if (filtroActual === 'todos') {
                return true;
            } else if (filtroActual === 'informes') {
                return informe.getAttribute('data-tipo') !== 'orden';
            } else if (filtroActual === 'ordenes') {
                return informe.getAttribute('data-tipo') === 'orden';
            }
            return true;
        });
        
        if (!informesFiltrados.length) {
            MAIRA.Utils.mostrarNotificacion("No hay informes que cumplan con el filtro actual", "warning");
            return;
        }
        
        let contenido = '';
        let nombreArchivo = `informes_${operacionActual}_${new Date().toISOString().slice(0, 10)}.${formato}`;
        let tipoMIME = 'text/plain';
        
        switch (formato) {
            case 'txt':
                contenido = `=== INFORMES - OPERACIÓN ${operacionActual.toUpperCase()} ===\n`;
                contenido += `Fecha de exportación: ${new Date().toLocaleString()}\n\n`;
                
                informesFiltrados.forEach(informe => {
                    const tipo = informe.getAttribute('data-tipo');
                    const tipoTexto = tipo === 'urgente' ? 'URGENTE' : (tipo === 'orden' ? 'ORDEN' : 'Normal');
                    const asunto = informe.querySelector('.informe-titulo strong').textContent;
                    const fecha = informe.querySelector('.informe-titulo small').textContent;
                    const remitente = informe.querySelector('.informe-remitente').textContent;
                    const contenidoInforme = informe.querySelector('.informe-contenido').textContent;
                    
                    contenido += `====================\n`;
                    contenido += `TIPO: ${tipoTexto}\n`;
                    contenido += `ASUNTO: ${asunto}\n`;
                    contenido += `FECHA: ${fecha}\n`;
                    contenido += `${remitente}\n\n`;
                    contenido += `${contenidoInforme}\n\n`;
                });
                break;
                
            case 'json':
                const informesJSON = informesFiltrados.map(informe => {
                    const id = informe.getAttribute('data-id');
                    const tipo = informe.getAttribute('data-tipo');
                    const asunto = informe.querySelector('.informe-titulo strong').textContent;
                    const fecha = informe.querySelector('.informe-titulo small').textContent;
                    const remitente = informe.querySelector('.informe-remitente').textContent;
                    const contenido = informe.querySelector('.informe-contenido').textContent;
                    const leido = informe.classList.contains('leido');
                    
                    // Verificar si hay datos completos en memoria
                    let datosCompletos = null;
                    if (informesRecibidos[id]) {
                        datosCompletos = informesRecibidos[id];
                    } else if (informesEnviados[id]) {
                        datosCompletos = informesEnviados[id];
                    }
                    
                    if (datosCompletos) {
                        return datosCompletos;
                    } else {
                        // Datos básicos extraídos del DOM
                        return {
                            id,
                            tipo,
                            asunto,
                            fecha,
                            remitente,
                            contenido,
                            leido
                        };
                    }
                });
                
                contenido = JSON.stringify(informesJSON, null, 2);
                tipoMIME = 'application/json';
                break;
                
            case 'html':
            default:
                contenido = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informes - Operación ${operacionActual}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .informe { border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px; padding: 15px; }
        .informe-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
        .informe-urgente { border-left: 5px solid #f44336; }
        .informe-orden { border-left: 5px solid #ff9800; }
        .informe-normal { border-left: 5px solid #2196F3; }
        .fecha { color: #666; font-size: 0.9em; }
        .remitente { font-style: italic; margin-bottom: 10px; }
        .contenido { white-space: pre-line; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Informes - Operación ${operacionActual}</h1>
        <p>Fecha de exportación: ${new Date().toLocaleString()}</p>
    </div>
    <div class="informes">`;
                
                informesFiltrados.forEach(informe => {
                    const id = informe.getAttribute('data-id');
                    const tipo = informe.getAttribute('data-tipo');
                    const tipoTexto = tipo === 'urgente' ? 'URGENTE' : (tipo === 'orden' ? 'ORDEN' : 'Normal');
                    const tipoClase = tipo === 'urgente' ? 'informe-urgente' : (tipo === 'orden' ? 'informe-orden' : 'informe-normal');
                    const asunto = informe.querySelector('.informe-titulo strong').textContent;
                    const fecha = informe.querySelector('.informe-titulo small').textContent;
                    const remitente = informe.querySelector('.informe-remitente').textContent;
                    const contenidoInforme = informe.querySelector('.informe-contenido').textContent;
                    
                    contenido += `
        <div class="informe ${tipoClase}" id="informe-${id}">
            <div class="informe-header">
                <h2>${asunto}</h2>
                <span class="tipo">${tipoTexto}</span>
            </div>
            <div class="fecha">${fecha}</div>
            <div class="remitente">${remitente}</div>
            <div class="contenido">${contenidoInforme}</div>
        </div>`;
                });
                
                contenido += `
    </div>
</body>
</html>`;
                tipoMIME = 'text/html';
                break;
        }
        
        // Crear y descargar el archivo
        const blob = new Blob([contenido], { type: tipoMIME });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        MAIRA.Utils.mostrarNotificacion(`Informes exportados a ${formato.toUpperCase()}`, "success");
    }
    
    /**
     * Verifica si hay informes pendientes de enviar cuando se recupera la conexión
     */
    function enviarInformesPendientes() {
        if (!socket || !socket.connected) {
            console.warn("No se pueden enviar informes pendientes: sin conexión");
            return;
        }
        
        // Buscar informes pendientes (los que tienen id pero no se han confirmado por el servidor)
        const informesPendientes = Object.values(informesEnviados).filter(informe => {
            return informe.pendiente === true;
        });
        
        if (informesPendientes.length === 0) {
            console.log("No hay informes pendientes de envío");
            return;
        }
        
        console.log(`Enviando ${informesPendientes.length} informes pendientes`);
        
        // Enviar cada informe
        informesPendientes.forEach(informe => {
            socket.emit('nuevoInforme', informe, function(respuesta) {
                if (respuesta && respuesta.error) {
                    console.error("Error al enviar informe pendiente:", respuesta.error);
                } else {
                    // Marcar como enviado (no pendiente)
                    if (informesEnviados[informe.id]) {
                        informesEnviados[informe.id].pendiente = false;
                        
                        // Actualizar en localStorage
                        guardarInformesLocalmente();
                    }
                    
                    console.log(`Informe pendiente enviado correctamente: ${informe.id}`);
                }
            });
        });
        
        MAIRA.Utils.mostrarNotificacion(`Enviando ${informesPendientes.length} informes pendientes`, "info");
    }
    
    /**
     * Elimina un informe de la lista y de la memoria
     * @param {string} informeId - ID del informe a eliminar
     */
    function eliminarInforme(informeId) {
        // Eliminar de la lista
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (informeElement) {
            informeElement.remove();
        }
        
        // Eliminar de la memoria
        if (informesRecibidos[informeId]) {
            delete informesRecibidos[informeId];
        }
        
        if (informesEnviados[informeId]) {
            delete informesEnviados[informeId];
        }
        
        // Actualizar en localStorage
        guardarInformesLocalmente();
        
        console.log(`Informe ${informeId} eliminado`);
    }
    
    /**
     * Limpia todos los informes
     * @param {string} tipo - Tipo de informes a limpiar ('todos', 'recibidos', 'enviados')
     */
    function limpiarInformes(tipo = 'todos') {
        // Limpiar interfaz según filtro y tipo
        const informes = document.querySelectorAll('.informe');
        
        informes.forEach(informe => {
            const id = informe.getAttribute('data-id');
            const esPropio = informe.classList.contains('propio');
            
            if (tipo === 'todos' || 
                (tipo === 'recibidos' && !esPropio) || 
                (tipo === 'enviados' && esPropio)) {
                
                informe.remove();
                
                // Eliminar de la memoria
                if (esPropio && informesEnviados[id]) {
                    delete informesEnviados[id];
                } else if (!esPropio && informesRecibidos[id]) {
                    delete informesRecibidos[id];
                }
            }
        });
        
        // Actualizar en localStorage
        guardarInformesLocalmente();
        
        console.log(`Informes ${tipo} limpiados`);
        MAIRA.Utils.mostrarNotificacion(`Informes ${tipo} limpiados`, "success");
    }
    
    /**
     * Busca un informe por su ID
     * @param {string} informeId - ID del informe a buscar
     * @returns {Object|null} - Informe encontrado o null
     */
    function buscarInformePorId(informeId) {
        // Buscar en informes recibidos
        if (informesRecibidos[informeId]) {
            return informesRecibidos[informeId];
        }
        
        // Buscar en informes enviados
        if (informesEnviados[informeId]) {
            return informesEnviados[informeId];
        }
        
        return null;
    }
    
    /**
     * Obtiene todos los informes
     * @param {string} tipo - Tipo de informes ('todos', 'recibidos', 'enviados')
     * @param {string} filtroTipo - Filtro por tipo de informe ('todos', 'informes', 'ordenes')
     * @returns {Array} - Array de informes
     */
    function obtenerInformes(tipo = 'todos', filtroTipo = 'todos') {
        let resultado = [];
        
        // Recolectar según tipo
        if (tipo === 'todos' || tipo === 'recibidos') {
            resultado = resultado.concat(Object.values(informesRecibidos));
        }
        
        if (tipo === 'todos' || tipo === 'enviados') {
            resultado = resultado.concat(Object.values(informesEnviados));
        }
        
        // Filtrar por tipo de informe
        if (filtroTipo !== 'todos') {
            if (filtroTipo === 'informes') {
                resultado = resultado.filter(inf => inf.tipo !== 'orden');
            } else if (filtroTipo === 'ordenes') {
                resultado = resultado.filter(inf => inf.tipo === 'orden');
            }
        }
        
        // Ordenar por fecha (más recientes primero)
        resultado.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return resultado;
    }
    
    /**
     * Obtiene estadísticas sobre los informes
     * @returns {Object} - Estadísticas de informes
     */
    function obtenerEstadisticasInformes() {
        const recibidos = Object.values(informesRecibidos);
        const enviados = Object.values(informesEnviados);
        
        const estadisticas = {
            total: recibidos.length + enviados.length,
            recibidos: {
                total: recibidos.length,
                leidos: recibidos.filter(inf => inf.leido).length,
                noLeidos: recibidos.filter(inf => !inf.leido).length,
                normales: recibidos.filter(inf => inf.tipo !== 'urgente' && inf.tipo !== 'orden').length,
                urgentes: recibidos.filter(inf => inf.tipo === 'urgente').length,
                ordenes: recibidos.filter(inf => inf.tipo === 'orden').length
            },
            enviados: {
                total: enviados.length,
                normales: enviados.filter(inf => inf.tipo !== 'urgente' && inf.tipo !== 'orden').length,
                urgentes: enviados.filter(inf => inf.tipo === 'urgente').length,
                ordenes: enviados.filter(inf => inf.tipo === 'orden').length,
                pendientes: enviados.filter(inf => inf.pendiente).length
            }
        };
        
        return estadisticas;
    }
    
    // Exponer API pública
    return {
        // Funciones principales
        inicializar: inicializar,
        configurarEventosSocket: configurarEventosSocket,
        enviarInforme: enviarInforme,
        recibirInforme: recibirInforme,
        
        // Funciones de gestión
        agregarInforme: agregarInforme,
        marcarInformeLeido: marcarInformeLeido,
        eliminarInforme: eliminarInforme,
        limpiarInformes: limpiarInformes,
        enviarInformesPendientes: enviarInformesPendientes,
        
        // Funciones multimedia
        capturarFoto: capturarFoto,
        grabarAudio: grabarAudio,
        grabarVideo: grabarVideo,
        mostrarAdjuntoInforme: mostrarAdjuntoInforme,
        
        // Utilidades
        actualizarSelectorDestinatariosInforme: actualizarSelectorDestinatariosInforme,
        filtrarInformes: filtrarInformes,
        exportarInformes: exportarInformes,
        
        // Funciones de búsqueda y consulta
        buscarInformes: buscarInformes,
        buscarInformePorId: buscarInformePorId,
        obtenerInformes: obtenerInformes,
        obtenerEstadisticasInformes: obtenerEstadisticasInformes
    };
})();

// Registrar como módulo global
window.MAIRA.Informes = window.MAIRA.Informes || MAIRA.Informes;