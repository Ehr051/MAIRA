// index.js
// Archivo principal de la aplicación que coordina la inicialización de todos los componentes

// Variables globales
var mapaInicializado = false;
var medicionDistancia = false;

// Función principal que se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM completamente cargado y parseado");
    
    try {
        // Esperar a que el índice de tiles esté cargado antes de continuar
        await window.elevationHandler.cargarIndiceTiles;
        console.log('Índice de tiles cargado correctamente, inicializando elevación.');
    } catch (error) {
        console.error('Error al cargar el índice de tiles:', error);
        return;
    }
    
    
    
    // Definir bounds iniciales (puedes ajustar estos valores según la lógica de tu aplicación)
    const boundsIniciales = {
        north: -34.0,
        south: -34.1,
        east: -58.3,
        west: -58.4
    };
    
    // Inicializar datos de elevación
    try {
        await window.elevationHandler.inicializarDatosElevacion(boundsIniciales);
        console.log("Datos de elevación cargados");
    } catch (error) {
        console.error('Error durante la inicialización de datos de elevación:', error);
    }

    if (!window.mapaInicializado) {
        inicializarMapa();
        window.mapaInicializado = true;
    }

    

    inicializarControles();
    initializeBuscarLugar();
});

// Inicializar controles
function inicializarControles() {
    console.log('Inicializando controles...');
  // Lógica de inicialización de controles
    console.log('Controles inicializados con éxito');
}

async function inicializarDatosElevacion() {
    try {
        const resultado = await window.elevationHandler.cargarDatosElevacion();
        if (resultado) {
            console.log("Datos de elevación cargados");
            // Mostrar estado inicial
            const estado = window.elevationHandler.obtenerEstadoSistema();
            console.log("Estado del sistema de elevación:", estado);
        } else {
            console.error("Error al cargar datos de elevación");
        }
    } catch (error) {
        console.error("Error en la inicialización de datos de elevación:", error);
    }
}

// Función de ayuda para debug
function mostrarEstadoElevacion() {
    const estado = window.elevationHandler.obtenerEstadoSistema();
    console.table(estado);
}

// Puedes agregar esto para monitoreo continuo
const monitorElevacion = setInterval(() => {
    const estado = window.elevationHandler.obtenerEstadoSistema();
    if (estado.tilesCargando > 0) {
        console.log("Estado de carga de tiles:", estado);
    }
}, 1000);


// Inicializa todos los controles y event listeners de la aplicación
function inicializarControles() {
    console.log('Inicializando controles...');
    inicializarMenus();
    inicializarBotonesMapas();
    inicializarControlesCuadricula();
    inicializarBotonesHerramientas();
    inicializarBotonesCalcos();
    inicializarBotonesPanelEdicion();
    inicializarBusquedaSimbolos();
    inicializarBotonesAmigoEnemigo();
    inicializarControlCoordenadasCursor();
    inicializarBotonPantallaCompleta();
    inicializarBotonesAyuda();
    console.log('Controles inicializados con éxito');
}

// Inicializa los menús principales y submenús
function inicializarMenus() {
    var menus = ['ver-menu', 'herramientas-menu', 'calcos-menu', 'helpMenu'];
    menus.forEach(function(menuId) {
        var btn = document.querySelector('[data-toggle="collapse"][data-target="#' + menuId + '"]');
        if (btn) {
            btn.addEventListener('click', function() { toggleMenu(menuId); });
        } else {
            console.warn('Botón para menú ' + menuId + ' no encontrado');
        }
    });

    // Inicializar submenús
    var submenus = {
        'tipoMapaBtn': 'collapse',
        'cuadriculasBtn': 'cuadriculas',
        'tipoCuadriculaBtn': 'tipoCuadricula',
        'simbolosBasicosBtn': 'simbolosBasicos',
        'infanteriaBtn': 'infanteria',
        'caballeriaBtn': 'Caballeria',
        'apoyoFuegoBtn': 'apoyoFuego',
        'apoyoCombateBtn': 'apoyoCombate',
        'logisticaSanidadBtn': 'logistica-sanidad',
        'logisticaMaterialBtn': 'logistica-material',
        'mccGeneralesBtn': 'mcc-generales',
        'fuegosBtn': 'fuegos',
        'toeBtn': 'toe',
        'infanteriaArmamentoBtn': 'infanteria-armamento',
        'infanteriaVehiculosBtn': 'infanteria-vehiculos',
        'caballeriaArmamentoBtn': 'caballeria-armamento',
        'caballeriaVehiculosBtn': 'caballeria-vehiculos',
        'artilleriaCampanaBtn': 'artilleriaCampana',
        'artilleriaAntiareaBtn': 'artilleriaAntiaerea',
        'ingenierosBtn': 'ingenieros',
        'comunicacionesBtn': 'Comunicaciones',
        'ingenierosMovilidadBtn': 'ingenieros-movilidad',
        'ingenierosContramovilidadBtn': 'ingenieros-contramovilidad',
        'ingenierosProteccionBtn': 'ingenieros-proteccion',
        'ingenierosVehiculosEquiposBtn': 'ingenieros-vehiculos-equipos',
        'comunicacionesComandosBtn': 'comunicaciones-comandos',
        'radioelectricosBtn': 'radioelectricos',
        'telefoniaBtn': 'telefonia',
        'intendenciaBtn': 'intendencia',
        'arsenalesBtn': 'arsenales',
        'transporteBtn': 'transporte',
        'comandosTOEBtn': 'comandosTOE',
        'cazadoresBtn': 'cazadores'
    };

    Object.keys(submenus).forEach(function(btnId) {
        var btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function() { toggleMenu(submenus[btnId]); });
        } else {
            console.warn('Botón ' + btnId + ' no encontrado');
        }
    });
}


function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.toggle('show');
    } else {
        console.warn(`Menu with ID '${menuId}' not found.`);
    }
}

// Inicializa los botones para cambiar el tipo de mapa
function inicializarBotonesMapas() {
    var mapButtons = document.querySelectorAll('[data-map-type]');
    mapButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            cambiarTipoMapa(this.getAttribute('data-map-type'));
        });
    });
}

// Inicializa los controles de la cuadrícula
function inicializarControlesCuadricula() {
    var controles = ['opacitySlider', 'colorSelector', 'gridWidthSlider'];
    controles.forEach(function(id) {
        var control = document.getElementById(id);
        if (control) {
            control.addEventListener('input', actualizarEstiloCuadricula);
        } else {
            console.warn('Control de cuadrícula ' + id + ' no encontrado');
        }
    });

    var cuadriculaBtns = document.querySelectorAll('#tipoCuadriculaBtn > div');
    cuadriculaBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            cambiarCuadricula(this.textContent.trim());
        });
    });
}

// Inicializa los botones de herramientas
function inicializarBotonesHerramientas() {
    var btnMedirDistancia = document.getElementById('btnMedirDistancia');
    if (btnMedirDistancia) {
        btnMedirDistancia.addEventListener('click', medirDistancia);
    } else {
        console.warn('Botón de medir distancia no encontrado');
    }

    var perfilElevacionBtn = document.getElementById('PerfilElevacionBtn');
    if (perfilElevacionBtn) {
        perfilElevacionBtn.addEventListener('click', mostrarPerfilElevacion);
    } else {
        console.warn('Botón de perfil de elevación no encontrado');
    }

    var btnCalculoMarcha = document.getElementById('btnCalculoMarcha');
    if (btnCalculoMarcha) {
        btnCalculoMarcha.addEventListener('click', function() {
            const panelContainer = document.getElementById('panelMarchaContainer');
            if (panelContainer) {
                panelContainer.style.display = 'block'; // Mostrar el panel de marcha
                if (window.PanelMarcha && window.PanelMarcha.init) {
                    window.PanelMarcha.init();
                } else {
                    console.error('No se pudo inicializar el panel de marcha. Revisa si panelMarcha está cargado correctamente.');
                }
            } else {
                console.error('Contenedor del panel de marcha no encontrado.');
            }
        });
    } else {
        console.error('Botón btnCalculoMarcha no encontrado.');
    }
}




// Inicializa los botones relacionados con los calcos
function inicializarBotonesCalcos() {
    var nuevoCalcoBtn = document.getElementById('nuevoCalcoBtn');
    if (nuevoCalcoBtn) {
        nuevoCalcoBtn.addEventListener('click', crearNuevoCalco);
    } else {
        console.warn('Botón de nuevo calco no encontrado');
    }

    var cargarCalcoBtn = document.getElementById('cargarCalcoBtn');
    if (cargarCalcoBtn) {
        cargarCalcoBtn.addEventListener('click', cargarCalco);
    } else {
        console.warn('Botón de cargar calco no encontrado');
    }

    var guardarCalcoBtn = document.getElementById('guardarCalcoBtn');
    if (guardarCalcoBtn) {
        guardarCalcoBtn.addEventListener('click', guardarCalco);
    } else {
        console.warn('Botón de guardar calco no encontrado');
    }
    
    var imprimirBtn = document.getElementById('imprimirBtn');
    if (imprimirBtn) {
        imprimirBtn.addEventListener('click', function(event) {
            event.preventDefault();  // Prevenir comportamiento por defecto
            window.print();          // Mostrar el cuadro de impresión
        });
    } else {
        console.warn('Botón de imprimir no encontrado');
    }
}


// Inicializa los botones del panel de edición
function inicializarBotonesPanelEdicion() {
    var guardarCambiosUnidadBtn = document.getElementById('guardarCambiosUnidad');
    if (guardarCambiosUnidadBtn) {
        guardarCambiosUnidadBtn.addEventListener('click', guardarCambiosUnidad);
    } else {
        console.warn('Botón guardarCambiosUnidad no encontrado');
    }

    var guardarCambiosLineaBtn = document.getElementById('guardarCambiosLinea');
    if (guardarCambiosLineaBtn) {
        guardarCambiosLineaBtn.addEventListener('click', guardarCambiosLinea);
    } else {
        console.warn('Botón guardarCambiosLinea no encontrado');
    }

    
}

// Inicializa la búsqueda de símbolos
function inicializarBusquedaSimbolos() {
    var busquedaSimboloInput = document.getElementById('busquedaSimbolo');
    if (busquedaSimboloInput) {
        busquedaSimboloInput.addEventListener('input', buscarSimbolo);
    } else {
        console.warn('Input de búsqueda de símbolos no encontrado');
    }
}

// Inicializa los botones de amigo/enemigo
function inicializarBotonesAmigoEnemigo() {
    var amigoBtn = document.querySelector('.botones-fuerza button:nth-child(1)');
    var enemigoBtn = document.querySelector('.botones-fuerza button:nth-child(2)');

    if (amigoBtn) {
        amigoBtn.addEventListener('click', function() { actualizarSidc('F'); });
    } else {
        console.warn('Botón de fuerza amiga no encontrado');
    }

    if (enemigoBtn) {
        enemigoBtn.addEventListener('click', function() { actualizarSidc('J'); });
    } else {
        console.warn('Botón de fuerza enemiga no encontrado');
    }
}

// Inicializa el control de coordenadas del cursor
function inicializarControlCoordenadasCursor() {
    var coordenadasCheckbox = document.getElementById('coordenadasCheckbox');
    if (coordenadasCheckbox) {
        coordenadasCheckbox.addEventListener('change', toggleCursorCoordinates);
    } else {
        console.warn('Checkbox de coordenadas no encontrado');
    }
}

// Inicializa el botón de pantalla completa
function inicializarBotonPantallaCompleta() {
    var fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', togglePantallaCompleta);
    } else {
        console.warn('Botón de pantalla completa no encontrado');
    }
}

// Función para alternar el modo de pantalla completa
function togglePantallaCompleta() {
    var element = document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function mostrarAyuda(seccion) {
    if (seccion === 'documentacion') {
        // Crear un iframe para mostrar la documentación
        var iframe = document.createElement('iframe');
        iframe.src = 'documentacion.html';
        iframe.style.width = '80%';
        iframe.style.height = '80%';
        iframe.style.border = 'none';

        // Crear un contenedor modal
        var modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.left = '10%';
        modal.style.top = '10%';
        modal.style.width = '80%';
        modal.style.height = '80%';
        modal.style.backgroundColor = 'white';
        modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        modal.style.zIndex = '1000';

        // Botón para cerrar
        var closeButton = document.createElement('button');
        closeButton.innerHTML = 'Cerrar';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.onclick = function() {
            document.body.removeChild(modal);
        };

        modal.appendChild(closeButton);
        modal.appendChild(iframe);
        document.body.appendChild(modal);
    } else if (seccion === 'atajos') {
        mostrarAyudaAtajos();
    }
}

// Añadir esto a la función inicializarControles o donde inicialices tus botones
function inicializarBotonesAyuda() {
    var documentacionBtn = document.getElementById('documentacionBtn');
    var atajosBtn = document.getElementById('atajosBtn');

    if (documentacionBtn) {
        documentacionBtn.addEventListener('click', function() { mostrarAyuda('documentacion'); });
    } else {
        console.warn('Botón de documentación no encontrado');
    }

    if (atajosBtn) {
        atajosBtn.addEventListener('click', function() { mostrarAyuda('atajos'); });
    } else {
        console.warn('Botón de atajos no encontrado');
    }
}

function mostrarAyudaAtajos() {
    var modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '10%';
    modal.style.top = '10%';
    modal.style.width = '80%';
    modal.style.height = '80%';
    modal.style.backgroundColor = 'white';
    modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    modal.style.zIndex = '1000';
    modal.style.padding = '20px';
    modal.style.overflowY = 'auto';

    var closeButton = document.createElement('button');
    closeButton.innerHTML = 'Cerrar';
    closeButton.style.position = 'absolute';
    closeButton.style.right = '10px';
    closeButton.style.top = '10px';
    closeButton.onclick = function() {
        document.body.removeChild(modal);
    };

    var content = document.createElement('div');
    content.innerHTML = `
        <h2>Atajos de Teclado</h2>
        <ul>
            <li><strong>Ctrl + Z:</strong> Deshacer</li>
            <li><strong>Ctrl + Y:</strong> Rehacer</li>
            <li><strong>Ctrl + S:</strong> Guardar calco</li>
            <li><strong>Ctrl + O:</strong> Abrir calco</li>
            <li><strong>Ctrl + N:</strong> Nuevo calco</li>
            <li><strong>Ctrl + M:</strong> Medir distancia</li>
            <li><strong>Ctrl + E:</strong> Mostrar perfil de elevación</li>
            <li><strong>Delete:</strong> Eliminar elemento seleccionado</li>
            <li><strong>Ctrl + C:</strong> Copiar elemento</li>
            <li><strong>Ctrl + V:</strong> Pegar elemento</li>
        </ul>
    `;

    modal.appendChild(closeButton);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// Asegúrate de llamar a inicializarBotonesAyuda en tu función de inicialización principal

// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente cargado y parseado");
    
    if (!mapaInicializado) {
        inicializarMapa();
        mapaInicializado = true;
    }
    inicializarControles();
    initializeBuscarLugar();
});


// Exportación de funciones globales si es necesario
window.toggleMenu = toggleMenu;
window.togglePantallaCompleta = togglePantallaCompleta;
