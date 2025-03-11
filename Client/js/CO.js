/**
 * CO.js – Modo Cuadro de Organización Militar (sin mapa)
 * Funcionalidades: agregar, editar y conectar elementos en un canvas,
 * manejo de propiedades mediante panel lateral y menús independientes.
 * Se utiliza jsPlumb para conexiones y ms.Symbol para generar símbolos.
 */

/* Variables globales */
var canvas;
var jsPlumbInstance;
var selectedElement = null;
var currentZoom = 1;
var enModoConexion = false;
var connectionSource = null;
var symbolCounter = 0;
var historial = { acciones: [], indice: -1 };

/* Inicialización */
document.addEventListener('DOMContentLoaded', inicializarCuadroOrganizacion);



/* Inicializar símbolos en la paleta */
function inicializarSimbolos() {
  if (typeof ms === 'undefined') {
    console.error("La biblioteca milsymbol no está cargada");
    return;
  }

  var items = document.querySelectorAll('[data-sidc]');
  for (var i = 0; i < items.length; i++) {
    var sidc = items[i].getAttribute('data-sidc');
    var container = items[i].querySelector('.mil-symbol');
    if (container) {
      try {
        var symbol = new ms.Symbol(sidc, { size: 30, standard: 'APP6', fill: true });
        container.innerHTML = symbol.asSVG();
      } catch (error) {
        console.error("Error al crear símbolo militar:", error);
      }
    }
  }
}

/* Funciones para actualizar SIDC y botones amigo/enemigo */
function actualizarSidc(nuevoCaracter) {
  console.log("Actualizando SIDC con carácter: " + nuevoCaracter);
  var allElements = document.querySelectorAll('#agregar-menu .sidc-container a, #agregar-menu [data-sidc]');
  
  allElements.forEach(function(element) {
    var originalSidc = element.dataset.sidc;
    
    if (originalSidc && (originalSidc.length === 10 || originalSidc.length === 15)) {
      var newSidc;
      if (originalSidc.length === 10) {
        newSidc = originalSidc.substring(0, 1) + nuevoCaracter + originalSidc.substring(2);
      } else {
        newSidc = originalSidc.substring(0, 1) + nuevoCaracter + originalSidc.substring(2, 15);
      }
      
      element.dataset.sidc = newSidc;
      
      var span = element.querySelector('.mil-symbol');
      if (span && typeof ms !== 'undefined') {
        try {
          var symbol = new ms.Symbol(newSidc, {size: 30});
          span.innerHTML = symbol.asSVG();
        } catch (error) {
          console.error("Error al actualizar símbolo:", error);
        }
      }
      
      if (element.hasAttribute('onclick')) {
        var originalOnclick = element.getAttribute('onclick');
        var newOnclick = originalOnclick.replace(originalSidc, newSidc);
        element.setAttribute('onclick', newOnclick);
      }
    }
  });
}


function inicializarCuadroOrganizacion() {
    // Verificar que ms (milsymbol) esté disponible
    if (typeof ms === 'undefined') {
      console.error("La biblioteca milsymbol no está cargada. Asegúrate de incluir el script de milsymbol antes de CO.js");
      return;
    }
  
    canvas = document.getElementById('org-canvas');
    if (!canvas) {
      console.error("No se encontró el elemento con id 'org-canvas'");
      return;
    }
    
    // Inicializar jsPlumb
    jsPlumbInstance = jsPlumb.getInstance({
      Connector: ["Flowchart", { cornerRadius: 5, stub: 10 }],
      Anchors: ["Bottom", "Top"],
      Endpoint: ["Dot", { radius: 2 }],
      EndpointStyle: { fill: "#456" },
      PaintStyle: { stroke: "#456", strokeWidth: 2 },
      HoverPaintStyle: { stroke: "#0d6efd", strokeWidth: 3 },
      ConnectionOverlays: [
        ["Arrow", { location: 1, width: 10, length: 10, foldback: 0.7 }]
      ]
    });
    jsPlumbInstance.setContainer(canvas);
    
    // Inicializar símbolos
    inicializarSimbolos();
    
    // Inicializar botones de amigo/enemigo
    inicializarBotonesAmigoEnemigo();
    
    // Configurar eventos
    configurarEventosCanvas();
    configurarBotonesPrincipales();
    configurarAtajosTeclado();
    configurarPaneles();
    
    // Inicializar funcionalidades de conexiones (del módulo conexionesCO.js)
    if (window.inicializarConexiones) {
      window.inicializarConexiones();
    }
    
    // Configurar controles de zoom
    configurarControlesZoom();
    
    // Ajustar zoom responsivo
    ajustarZoomResponsive();
    
    // Inicializar el buscador
    var busquedaSimboloInput = document.getElementById('busquedaSimbolo');
    var btnBuscarSimbolo = document.getElementById('btnBuscarSimbolo');
    
    if (busquedaSimboloInput) {
      busquedaSimboloInput.addEventListener('input', buscarSimbolo);
    }
    
    if (btnBuscarSimbolo) {
      btnBuscarSimbolo.addEventListener('click', buscarSimbolo);
    }
  }
  

function inicializarBotonesAmigoEnemigo() {
  var amigoButton = document.querySelector('.botones-fuerza button:nth-child(1)');
  var enemigoButton = document.querySelector('.botones-fuerza button:nth-child(2)');

  if (amigoButton) {
    amigoButton.addEventListener('click', function() {
      this.classList.add('active-amigo');
      if (enemigoButton) enemigoButton.classList.remove('active-enemigo');
      actualizarSidc('F');
    });
    // Activar por defecto el botón de fuerza amiga
    amigoButton.click();
  } else {
    console.warn('Botón de fuerza amiga no encontrado');
  }

  if (enemigoButton) {
    enemigoButton.addEventListener('click', function() {
      this.classList.add('active-enemigo');
      if (amigoButton) amigoButton.classList.remove('active-amigo');
      actualizarSidc('J');
    });
  } else {
    console.warn('Botón de fuerza enemiga no encontrado');
  }
}

/* Búsqueda de símbolos */
function buscarSimbolo() {
  console.log("Iniciando búsqueda de símbolo");
  var query = document.getElementById('busquedaSimbolo').value.toLowerCase();
  var resultadosBusquedaDiv = document.getElementById('resultadosBusquedaSimbolos');
  resultadosBusquedaDiv.innerHTML = '';

  if (query.trim() !== "") {
    var elementos = recopilarElementosBuscables();
    var resultados = elementos.filter(function(elemento) {
      return elemento.texto.toLowerCase().includes(query);
    });

    mostrarResultadosBusqueda(resultados);
  }
}

function recopilarElementosBuscables() {
  var elementos = [];
  var links = document.querySelectorAll('#agregar-menu a');
  links.forEach(function(link) {
    var texto = link.textContent.trim();
    var sidc = link.dataset.sidc;
    var onclick = link.getAttribute('onclick');
    elementos.push({ texto: texto, sidc: sidc, onclick: onclick });
  });
  return elementos;
}

function mostrarResultadosBusqueda(resultados) {
  var resultadosBusquedaDiv = document.getElementById('resultadosBusquedaSimbolos');
  resultados.slice(0, 6).forEach(function(resultado) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.textContent = resultado.texto;

    if (resultado.sidc && typeof ms !== 'undefined') {
      try {
        var symbol = new ms.Symbol(resultado.sidc, {size: 30});
        var img = document.createElement('img');
        img.src = symbol.toDataURL();
        img.alt = resultado.texto;
        img.style.marginRight = '10px';
        a.prepend(img);
        a.onclick = function(e) { 
          e.preventDefault();
          agregarMarcador(resultado.sidc, resultado.texto); 
        };
      } catch (error) {
        console.error("Error al crear símbolo para búsqueda:", error);
      }
    } else if (resultado.onclick) {
      a.setAttribute('onclick', resultado.onclick);
    }

    li.appendChild(a);
    resultadosBusquedaDiv.appendChild(li);
  });
}

/* Funciones de menú */
function toggleMenu(menuId, e) {
  if (e && e.stopPropagation) { e.stopPropagation(); }
  var menu = document.getElementById(menuId);
  if (!menu) return;
  
  // Si estamos haciendo clic en un submenú, no cerramos los demás menús
  if (!menuId.includes('Btn')) {
    closeMenus();
  }
  
  // Mostrar/ocultar este menú
  menu.classList.toggle('show');
  
  // Si estamos mostrando un submenú con clase simbolo-grid, activarla
  if (menu.classList.contains('simbolo-grid')) {
    menu.classList.toggle('show');
  }
}

function closeMenus() {
  var menus = document.querySelectorAll('.menu.show');
  for (var i = 0; i < menus.length; i++) {
    menus[i].classList.remove('show');
  }
}

/* Configuración de paneles y tabs */
function configurarPaneles() {
  // Inicializar tabs en todos los paneles
  var tabs = document.querySelectorAll('.tab button');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      // Obtener el contenedor tab
      var tabContainer = this.closest('.tab');
      // Desactivar todos los botones
      var tabBtns = tabContainer.querySelectorAll('button');
      tabBtns.forEach(function(btn) { btn.classList.remove('active'); });
      // Activar este botón
      this.classList.add('active');
      
      // Obtener el contenido de tab a mostrar
      var tabName = this.getAttribute('data-tab');
      var parent = tabContainer.parentElement;
      var tabContents = parent.querySelectorAll('.tabcontent');
      
      // Ocultar todos los contenidos
      tabContents.forEach(function(content) { content.style.display = 'none'; });
      
      // Mostrar el contenido seleccionado
      var selectedTab = parent.querySelector('#' + tabName);
      if (selectedTab) {
        selectedTab.style.display = 'block';
      }
    });
  });
  
  // Activar la primera pestaña por defecto en cada tab
  document.querySelectorAll('.tab').forEach(function(tabContainer) {
    var firstButton = tabContainer.querySelector('button');
    if (firstButton) {
      firstButton.click();
    }
  });
  
  // Configurar botones para cerrar paneles
  document.querySelectorAll('.panel .panel-buttons button:last-child').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var panel = this.closest('.panel');
      panel.style.display = 'none';
    });
  });
}

/* Configurar eventos del canvas */
function configurarEventosCanvas() {
  var isDragging = false, startX, startY, scrollLeft, scrollTop;
  
  canvas.addEventListener('mousedown', function(e) {
    if (e.target === canvas) {
      isDragging = true;
      startX = e.pageX;
      startY = e.pageY;
      scrollLeft = canvas.parentElement.scrollLeft;
      scrollTop = canvas.parentElement.scrollTop;
      closeMenus();
      deseleccionarElemento();
    }
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    var walkX = e.pageX - startX;
    var walkY = e.pageY - startY;
    canvas.parentElement.scrollLeft = scrollLeft - walkX;
    canvas.parentElement.scrollTop = scrollTop - walkY;
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
  
  canvas.addEventListener('click', function(e) {
    if (e.target === canvas) {
      deseleccionarElemento();
      if (enModoConexion && connectionSource) {
        if (window.cancelarModoConexion) {
          window.cancelarModoConexion();
        } else {
          connectionSource.className = connectionSource.className.replace(" connection-source", "");
          connectionSource = null;
          enModoConexion = false;
          document.querySelectorAll('.menu-btn button.active').forEach(function(btn) {
            btn.classList.remove('active');
          });
        }
      }
    }
  });
  
  // Eventos para elementos existentes
  inicializarEventosElementos();
}

/* Inicializar eventos para elementos existentes */
function inicializarEventosElementos() {
  document.querySelectorAll('.military-symbol').forEach(function(elemento) {
    // Eliminar eventos previos para evitar duplicidad
    var nuevoElemento = elemento.cloneNode(true);
    if (elemento.parentNode) {
      elemento.parentNode.replaceChild(nuevoElemento, elemento);
    }
    
    // Agregar evento de clic
    nuevoElemento.addEventListener('click', function(e) {
      e.stopPropagation();
      if (enModoConexion) {
        if (window.manejarClickEnModoConexion) {
          window.manejarClickEnModoConexion(this);
        } else {
          manejarClickEnModoConexion(this);
        }
      } else {
        seleccionarElemento(this);
      }
    });
    
    // Agregar evento de doble clic para edición
    el.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        e.preventDefault();
        mostrarMenuContextual(e, el);
    });
    
    // Agregar menú contextual
    nuevoElemento.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      mostrarMenuContextual(e, this);
    });
    
    // Botones de edición en hover
    var editBtn = document.createElement('div');
    editBtn.className = 'symbol-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      editarElementoSeleccionado();
    });
    nuevoElemento.appendChild(editBtn);
    
    var deleteBtn = document.createElement('div');
    deleteBtn.className = 'symbol-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.style.display = 'none';
    deleteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      eliminarElementoSeleccionado();
    });
    nuevoElemento.appendChild(deleteBtn);
    
    nuevoElemento.addEventListener('mouseenter', function() {
      editBtn.style.display = 'block';
      deleteBtn.style.display = 'block';
    });
    
    nuevoElemento.addEventListener('mouseleave', function() {
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    });
  });
}



// Modificar la función mostrarMenuContextual para añadir auto-cierre al hacer clic
function mostrarMenuContextual(e, elemento) {
    // Seleccionar el elemento primero
    seleccionarElemento(elemento);
    
    // Eliminar cualquier menú contextual existente
    var menuAnterior = document.querySelector('.menu-contextual');
    if (menuAnterior) {
        document.body.removeChild(menuAnterior);
    }
    
    // Crear menú contextual
    var menuContextual = document.createElement('div');
    menuContextual.className = 'menu-contextual';
    menuContextual.innerHTML = `
        <ul>
            <li><a href="#" onclick="editarElementoSeleccionado(); document.body.removeChild(this.closest('.menu-contextual')); return false;"><i class="fas fa-edit"></i> Editar</a></li>
            <li><a href="#" onclick="eliminarElementoSeleccionado(); document.body.removeChild(this.closest('.menu-contextual')); return false;"><i class="fas fa-trash"></i> Eliminar</a></li>
            <li><a href="#" onclick="iniciarConexion(); document.body.removeChild(this.closest('.menu-contextual')); return false;"><i class="fas fa-link"></i> Conectar</a></li>
        </ul>
    `;
    
    // Posicionar el menú
    menuContextual.style.position = 'absolute';
    menuContextual.style.left = e.pageX + 'px';
    menuContextual.style.top = e.pageY + 'px';
    document.body.appendChild(menuContextual);
    
    // Configurar evento para cerrar el menú al hacer clic fuera
    function cerrarMenu(event) {
        if (!menuContextual.contains(event.target)) {
            if (document.body.contains(menuContextual)) {
                document.body.removeChild(menuContextual);
            }
            document.removeEventListener('click', cerrarMenu);
        }
    }
    
    // Añadir con ligero retraso para evitar que se cierre inmediatamente
    setTimeout(function() {
        document.addEventListener('click', cerrarMenu);
    }, 0);
}

/* Configurar botones principales */
/* Configurar botones principales */
function configurarBotonesPrincipales() {
    // Configuración para el modo de conexión
    var botonesPrincipales = document.getElementById('botones-principales');
    if (botonesPrincipales) {
        botonesPrincipales.addEventListener('click', function(e) {
            if (e.target.matches('button') || e.target.closest('button')) {
                var button = e.target.matches('button') ? e.target : e.target.closest('button');
                if (button.id !== 'crearConexionBtn') {
                    if (enModoConexion) {
                        enModoConexion = false;
                        if (connectionSource) {
                            connectionSource.className = connectionSource.className.replace(" connection-source", "");
                            connectionSource = null;
                        }
                    }
                }
            }
        });
    }
    
    // Configurar botones para exportar/guardar
    var exportarBtn = document.getElementById('exportarOrgBtn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', exportarComoImagen);
    }
    
    var guardarBtn = document.getElementById('guardarOrgBtn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarCuadroOrganizacion);
    }
    
    var cargarBtn = document.getElementById('cargarOrgBtn');
    if (cargarBtn) {
        cargarBtn.addEventListener('click', cargarCuadroOrganizacion);
    }
    
    var nuevoBtn = document.getElementById('nuevoOrgBtn');
    if (nuevoBtn) {
        nuevoBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro de crear un nuevo cuadro? Se perderán todos los cambios no guardados.')) {
                limpiarCanvas();
            }
        });
    }
    
    var imprimirBtn = document.getElementById('imprimirOrgBtn');
    if (imprimirBtn) {
        imprimirBtn.addEventListener('click', imprimirCuadro);
    }

    // Configurar botones de texto
    var agregarTextoBtn = document.getElementById('agregarTextoBtn');
    if (agregarTextoBtn) {
        agregarTextoBtn.addEventListener('click', function() {
            agregarTexto('Texto');
        });
    }
    
    var agregarTituloBtn = document.getElementById('agregarTituloBtn');
    if (agregarTituloBtn) {
        agregarTituloBtn.addEventListener('click', agregarTitulo);
    }
    
    var agregarLeyendaBtn = document.getElementById('agregarLeyendaBtn');
    if (agregarLeyendaBtn) {
        agregarLeyendaBtn.addEventListener('click', agregarLeyenda);
    }

    // Configurar botones secundarios
    var btnDeshacer = document.getElementById('btnDeshacer');
    if (btnDeshacer) {
        btnDeshacer.addEventListener('click', deshacerOrg);
    }

    var btnRehacer = document.getElementById('btnRehacer');
    if (btnRehacer) {
        btnRehacer.addEventListener('click', rehacerOrg);
    }

    var btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', eliminarElementoSeleccionado);
    }

    // Configurar botón de conexión
    var botonConexion = document.getElementById('crearConexionBtn');
    if (botonConexion) {
        botonConexion.addEventListener('click', function() {
            if (enModoConexion) {
                if (window.cancelarModoConexion) {
                    window.cancelarModoConexion();
                } else {
                    cancelarModoConexion();
                }
            } else {
                if (window.iniciarConexion) {
                    window.iniciarConexion();
                } else {
                    iniciarConexion();
                }
            }
        });
    }
}

/* Configurar atajos de teclado */
function configurarAtajosTeclado() {
  document.addEventListener('keydown', function(e) {
    // Escape: Cancelar modo conexión y deseleccionar
    if (e.key === 'Escape') {
      if (enModoConexion) {
        if (window.cancelarModoConexion) {
          window.cancelarModoConexion();
        } else {
          enModoConexion = false;
          document.querySelectorAll('.menu-btn button.active').forEach(function(btn) {
            btn.classList.remove('active');
          });
          if (connectionSource) {
            connectionSource.className = connectionSource.className.replace(" connection-source", "");
            connectionSource = null;
          }
        }
      }
      deseleccionarElemento();
    }
    
    // Delete: Eliminar elemento seleccionado
    if (e.key === 'Delete' && selectedElement) {
      eliminarElementoSeleccionado();
    }
    
    // Ctrl + Z: Deshacer
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      deshacerOrg();
    }
    
    // Ctrl + Y: Rehacer
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      rehacerOrg();
    }
    
    // Ctrl + S: Guardar
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      guardarCuadroOrganizacion();
    }
    
    // Ctrl + E: Editar elemento seleccionado
    if (e.ctrlKey && e.key === 'e' && selectedElement) {
      e.preventDefault();
      editarElementoSeleccionado();
    }
  });
}






/* Seleccionar un elemento */
function seleccionarElemento(el) {
  // Deseleccionar elementos anteriores
  deseleccionarElemento();
  
  // Marcar nuevo elemento como seleccionado
  selectedElement = el;
  if (selectedElement.classList) {
    selectedElement.classList.add('selected');
  }
  
  // Habilitar botón de eliminar en la barra de herramientas
  var btnEliminar = document.getElementById('btnEliminar');
  if (btnEliminar) {
    btnEliminar.disabled = false;
  }
}

/* Deseleccionar elemento */
/* Deseleccionar elemento */
function deseleccionarElemento() {
    if (selectedElement && selectedElement.classList) {
      selectedElement.classList.remove('selected');
    }
    
    selectedElement = null;
    
    // Deshabilitar botón de eliminar
    var btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
      btnEliminar.disabled = true;
    }
  }

  /* Editar elemento seleccionado */
function editarElementoSeleccionado() {
    if (!selectedElement) return;
    
    // Mostrar panel de edición adecuado según tipo de elemento
    var sidc = selectedElement.getAttribute('data-sidc');
    if (sidc) {
      // Usar función del módulo de edición si está disponible
      if (window.mostrarPanelEdicionUnidad) {
        window.mostrarPanelEdicionUnidad(selectedElement);
      } else {
        mostrarPanelEdicionUnidad(selectedElement);
      }
    }
  }
  

  /* Eliminar elemento seleccionado */
  function eliminarElementoSeleccionado() {
    if (!selectedElement) return;
    
    // Guardar información para deshacer
    var id = selectedElement.id;
    var sidc = selectedElement.getAttribute('data-sidc');
    var label = selectedElement.querySelector('.symbol-label');
    var labelText = label ? label.textContent : '';
    var style = {
      left: selectedElement.style.left,
      top: selectedElement.style.top
    };
    
    // Eliminar todas las conexiones
    jsPlumbInstance.removeAllEndpoints(selectedElement);
    
    // Eliminar el elemento del DOM
    canvas.removeChild(selectedElement);
    
    // Registrar la acción para deshacer
    registrarAccion({
      tipo: 'eliminar',
      id: id,
      sidc: sidc,
      label: labelText,
      style: style,
      conexiones: obtenerConexionesElemento(id)
    });
    
    // Actualizar estado
    selectedElement = null;
    actualizarBotonesHistorial();
    
    // Deshabilitar botón de eliminar
    var btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
      btnEliminar.disabled = true;
    }
  }
  
  /* Obtener las conexiones de un elemento para restaurarlas */
  function obtenerConexionesElemento(elementId) {
    var conexiones = [];
    var conectores = jsPlumbInstance.getAllConnections();
    
    for (var i = 0; i < conectores.length; i++) {
      var conector = conectores[i];
      if (conector.sourceId === elementId || conector.targetId === elementId) {
        conexiones.push({
          sourceId: conector.sourceId,
          targetId: conector.targetId,
          // Guardar configuración adicional si es necesario
          anchors: [conector.endpoints[0].anchor.type, conector.endpoints[1].anchor.type],
          paintStyle: conector.getPaintStyle()
        });
      }
    }
    
    return conexiones;
  }
  
  /* Historial: Deshacer/Rehacer */
  function registrarAccion(accion) {
    // Si hay acciones después del punto actual, eliminarlas
    if (historial.indice < historial.acciones.length - 1) {
      historial.acciones = historial.acciones.slice(0, historial.indice + 1);
    }
    
    // Agregar nueva acción
    historial.acciones.push(accion);
    historial.indice = historial.acciones.length - 1;
    
    // Limitar tamaño del historial (opcional)
    if (historial.acciones.length > 50) {
      historial.acciones.shift();
      historial.indice--;
    }
  }
  
  function actualizarBotonesHistorial() {
    var btnDeshacer = document.getElementById('btnDeshacer');
    var btnRehacer = document.getElementById('btnRehacer');
    
    if (btnDeshacer) {
      btnDeshacer.disabled = historial.indice < 0;
    }
    
    if (btnRehacer) {
      btnRehacer.disabled = historial.indice >= historial.acciones.length - 1;
    }
  }
  
  function deshacerOrg() {
    if (historial.indice < 0) return;
    
    var accion = historial.acciones[historial.indice];
    console.log("Deshaciendo acción:", accion);
    
    switch (accion.tipo) {
      case 'crear':
        var elemento = document.getElementById(accion.id);
        if (elemento) {
          jsPlumbInstance.removeAllEndpoints(elemento);
          canvas.removeChild(elemento);
        }
        break;
        
      case 'eliminar':
        // Restaurar el elemento eliminado
        recrearElemento(accion);
        break;
        
      case 'editar':
        var elemento = document.getElementById(accion.id);
        if (elemento) {
          // Restaurar SIDC
          elemento.setAttribute('data-sidc', accion.valorAnterior.sidc);
          
          // Restaurar símbolo
          var symbolContainer = elemento.querySelector('.symbol-container');
          if (symbolContainer) {
            try {
              var symbol = new ms.Symbol(accion.valorAnterior.sidc, { size: 40, standard: 'APP6', fill: true });
              symbolContainer.innerHTML = symbol.asSVG();
            } catch (error) {
              console.error("Error al restaurar símbolo:", error);
            }
          }
          
          // Restaurar etiqueta
          var label = elemento.querySelector('.symbol-label');
          if (label) {
            label.textContent = accion.valorAnterior.label;
          }
        }
        break;
        
      case 'mover':
        var elemento = document.getElementById(accion.id);
        if (elemento) {
          elemento.style.left = accion.posicionAnterior.left + 'px';
          elemento.style.top = accion.posicionAnterior.top + 'px';
          jsPlumbInstance.revalidate(elemento);
        }
        break;
        
      case 'conectar':
        jsPlumbInstance.deleteConnection(
          jsPlumbInstance.getConnections({
            source: accion.conexion.sourceId,
            target: accion.conexion.targetId
          })[0]
        );
        break;
    }
    
    historial.indice--;
    actualizarBotonesHistorial();
  }
  
  function rehacerOrg() {
    if (historial.indice >= historial.acciones.length - 1) return;
    
    historial.indice++;
    var accion = historial.acciones[historial.indice];
    console.log("Rehaciendo acción:", accion);
    
    switch (accion.tipo) {
      case 'crear':
        // Recrear el elemento
        var nuevoElemento = recrearElemento(accion);
        break;
        
      case 'eliminar':
        var elemento = document.getElementById(accion.id);
        if (elemento) {
          jsPlumbInstance.removeAllEndpoints(elemento);
          canvas.removeChild(elemento);
        }
        break;
        
      case 'editar':
        var elemento = document.getElementById(accion.id);
        if (elemento) {
          // Aplicar SIDC
          elemento.setAttribute('data-sidc', accion.valorNuevo.sidc);
          
          // Actualizar símbolo
          var symbolContainer = elemento.querySelector('.symbol-container');
          if (symbolContainer) {
            try {
              var symbol = new ms.Symbol(accion.valorNuevo.sidc, { size: 40, standard: 'APP6', fill: true });
              symbolContainer.innerHTML = symbol.asSVG();
            } catch (error) {
              console.error("Error al actualizar símbolo:", error);
            }
          }
          
          // Actualizar etiqueta
          var label = elemento.querySelector('.symbol-label');
          if (label) {
            label.textContent = accion.valorNuevo.label;
          }
        }
        break;
        
      case 'mover':
        var elemento = document.getElementById(accion.id);
        if (elemento) {
          elemento.style.left = accion.posicionNueva.left + 'px';
          elemento.style.top = accion.posicionNueva.top + 'px';
          jsPlumbInstance.revalidate(elemento);
        }
        break;
        
      case 'conectar':
        jsPlumbInstance.connect({
          source: accion.conexion.sourceId,
          target: accion.conexion.targetId,
          anchor: ["Bottom", "Top"]
        });
        break;
    }
    
    actualizarBotonesHistorial();
  }
  
  /* Recrear un elemento desde datos guardados (para deshacer/rehacer) */
  function recrearElemento(datos) {
    // Crear el contenedor del símbolo
    var el = document.createElement('div');
    el.id = datos.id;
    el.className = 'military-symbol';
    el.setAttribute('data-sidc', datos.sidc);
    
    // Configurar posición
    if (datos.style) {
      el.style.left = datos.style.left;
      el.style.top = datos.style.top;
    }
    
    // Crear el símbolo con la biblioteca milsymbol
    var container = document.createElement('div');
    container.className = 'symbol-container';
    try {
      var symbol = new ms.Symbol(datos.sidc, { size: 40, standard: 'APP6', fill: true });
      container.innerHTML = symbol.asSVG();
    } catch (error) {
      console.error("Error al recrear símbolo:", error);
    }
    el.appendChild(container);
    
    // Crear la etiqueta con el nombre
    var label = document.createElement('div');
    label.className = 'symbol-label';
    label.textContent = datos.label || '';
    el.appendChild(label);
    
    // Agregar al canvas
    canvas.appendChild(el);
    
    // Hacer arrastrable con jsPlumb
    jsPlumbInstance.draggable(el, {
      containment: "parent",
      grid: [10, 10]
    });
    
    // Configurar eventos del elemento
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      if (enModoConexion) {
        if (window.manejarClickEnModoConexion) {
          window.manejarClickEnModoConexion(el);
        } else {
          manejarClickEnModoConexion(el);
        }
      } else {
        seleccionarElemento(el);
      }
    });
    
    // Agregar evento de doble clic para edición
    el.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      e.preventDefault();
      mostrarMenuContextual();
    });
    
    // Agregar menú contextual
    el.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      mostrarMenuContextual(e, el);
    });
    
    // Añadir botones de edición al pasar el ratón
    var editBtn = document.createElement('div');
    editBtn.className = 'symbol-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      editarElementoSeleccionado();
    });
    el.appendChild(editBtn);
    
    var deleteBtn = document.createElement('div');
    deleteBtn.className = 'symbol-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.style.display = 'none';
    deleteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      eliminarElementoSeleccionado();
    });
    el.appendChild(deleteBtn);
    
    el.addEventListener('mouseenter', function() {
      editBtn.style.display = 'block';
      deleteBtn.style.display = 'block';
    });
    
    el.addEventListener('mouseleave', function() {
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    });
    
    // Restaurar conexiones si hay datos
    if (datos.conexiones) {
      for (var i = 0; i < datos.conexiones.length; i++) {
        var conexion = datos.conexiones[i];
        // Solo recrear conexiones donde ambos elementos existen
        var source = document.getElementById(conexion.sourceId);
        var target = document.getElementById(conexion.targetId);
        if (source && target) {
          jsPlumbInstance.connect({
            source: conexion.sourceId,
            target: conexion.targetId,
            anchors: conexion.anchors || ["Bottom", "Top"],
            paintStyle: conexion.paintStyle || { stroke: "#456", strokeWidth: 2 }
          });
        }
      }
    }
    
    return el;
  }
  
  /* Funciones para exportar e importar */
/* Funciones para exportar e importar */
function guardarCuadroOrganizacion() {
    console.log("Guardando cuadro de organización...");
    
    // Recopilar todas las entidades y conexiones
    var elementos = [];
    var elementosDOM = document.querySelectorAll('.military-symbol');
    
    elementosDOM.forEach(function(el) {
        var dataObj = { 
            id: el.id,
            position: {
                left: el.style.left,
                top: el.style.top
            }
        };
        
        // Guardar datos específicos según el tipo de elemento
        if (el.classList.contains('text-element')) {
            dataObj.tipo = 'texto';
            var textContent = el.querySelector('.text-content');
            dataObj.texto = textContent ? textContent.textContent : '';
            dataObj.estilo = {
                fontSize: textContent ? textContent.style.fontSize : '16px',
                color: textContent ? textContent.style.color : '#ffffff',
                fontWeight: textContent ? textContent.style.fontWeight : 'normal',
                fontStyle: textContent ? textContent.style.fontStyle : 'normal',
                textDecoration: textContent ? textContent.style.textDecoration : 'none'
            };
        } else {
            // Elemento de símbolo militar
            dataObj.tipo = 'simbolo';
            dataObj.sidc = el.getAttribute('data-sidc');
            var label = el.querySelector('.symbol-label');
            dataObj.label = label ? label.textContent : '';
        }
        
        elementos.push(dataObj);
    });
    
    var conexiones = [];
    var conexionesPlumb = jsPlumbInstance.getAllConnections();
    
    conexionesPlumb.forEach(function(conn) {
        conexiones.push({
            sourceId: conn.sourceId,
            targetId: conn.targetId,
            anchors: [conn.endpoints[0].anchor.type, conn.endpoints[1].anchor.type],
            paintStyle: conn.getPaintStyle()
        });
    });
    
    var datos = {
        elementos: elementos,
        conexiones: conexiones,
        fecha: new Date().toISOString(),
        version: '1.0'
    };
    
    try {
        // Convertir a JSON
        var jsonData = JSON.stringify(datos, null, 2);
        
        // Crear un enlace de descarga
        var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonData);
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', 'cuadro_organizacion_' + new Date().toISOString().slice(0,10) + '.json');
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        console.log("Cuadro guardado exitosamente");
        mostrarMensaje('Cuadro guardado exitosamente', 'success');
    } catch (error) {
        console.error("Error al guardar el cuadro:", error);
        mostrarMensaje('Error al guardar el cuadro: ' + error.message, 'error');
    }
}
  
function cargarCuadroOrganizacion() {
    console.log("Cargando cuadro de organización...");
    
    // Crear un input file invisible
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', function(event) {
        var file = event.target.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var datos = JSON.parse(e.target.result);
                
                // Verificar si los datos son válidos
                if (!datos || !datos.elementos || !Array.isArray(datos.elementos)) {
                    throw new Error("Formato de archivo inválido");
                }
                
                // Limpiar canvas actual
                limpiarCanvas();
                
                // Recrear elementos
                datos.elementos.forEach(function(elData) {
                    if (elData.tipo === 'texto') {
                        // Recrear elemento de texto
                        var el = document.createElement('div');
                        el.id = elData.id;
                        el.className = 'military-symbol text-element';
                        el.style.left = elData.position.left;
                        el.style.top = elData.position.top;
                        
                        var textContent = document.createElement('div');
                        textContent.className = 'text-content';
                        textContent.contentEditable = true;
                        textContent.textContent = elData.texto || '';
                        
                        // Aplicar estilos si existen
                        if (elData.estilo) {
                            textContent.style.fontSize = elData.estilo.fontSize || '16px';
                            textContent.style.color = elData.estilo.color || '#ffffff';
                            textContent.style.fontWeight = elData.estilo.fontWeight || 'normal';
                            textContent.style.fontStyle = elData.estilo.fontStyle || 'normal';
                            textContent.style.textDecoration = elData.estilo.textDecoration || 'none';
                        }
                        
                        el.appendChild(textContent);
                        el.setAttribute('data-texto-original', elData.texto || '');
                        
                        // Configurar eventos para el texto
                        configurarEventosElemento(el, true);
                        
                        canvas.appendChild(el);
                        jsPlumbInstance.draggable(el, {
                            containment: "parent",
                            grid: [10, 10]
                        });
                        
                    } else {
                        // Elemento de símbolo militar
                        var el = document.createElement('div');
                        el.id = elData.id;
                        el.className = 'military-symbol';
                        el.setAttribute('data-sidc', elData.sidc);
                        el.style.left = elData.position.left;
                        el.style.top = elData.position.top;
                        
                        // Crear símbolo
                        var container = document.createElement('div');
                        container.className = 'symbol-container';
                        try {
                            var symbol = new ms.Symbol(elData.sidc, { size: 40, standard: 'APP6', fill: true });
                            container.innerHTML = symbol.asSVG();
                        } catch (error) {
                            console.error("Error al cargar símbolo:", error);
                            container.textContent = "Error al cargar símbolo";
                        }
                        el.appendChild(container);
                        
                        // Crear etiqueta
                        var label = document.createElement('div');
                        label.className = 'symbol-label';
                        label.textContent = elData.label || '';
                        el.appendChild(label);
                        
                        // Configurar eventos
                        configurarEventosElemento(el);
                        
                        canvas.appendChild(el);
                        jsPlumbInstance.draggable(el, {
                            containment: "parent",
                            grid: [10, 10]
                        });
                    }
                });
                
                // Recrear conexiones
                if (datos.conexiones && datos.conexiones.length > 0) {
                    setTimeout(function() {
                        datos.conexiones.forEach(function(conn) {
                            try {
                                jsPlumbInstance.connect({
                                    source: conn.sourceId,
                                    target: conn.targetId,
                                    anchors: conn.anchors || ["Bottom", "Top"],
                                    paintStyle: conn.paintStyle || { stroke: "#456", strokeWidth: 3 }
                                });
                            } catch (error) {
                                console.error("Error al recrear conexión:", error);
                            }
                        });
                    }, 500); // Esperar para asegurar que los elementos estén listos
                }
                
                // Actualizar contador de símbolos
                actualizarContadorSimbolos();
                
                console.log("Cuadro cargado exitosamente");
                mostrarMensaje('Cuadro cargado exitosamente', 'success');
                
            } catch (error) {
                console.error("Error al cargar el archivo:", error);
                mostrarMensaje("Error al cargar el archivo: " + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
        fileInput.remove();
    });
    
    fileInput.click();
}

// Función auxiliar para configurar eventos en elementos cargados
function configurarEventosElemento(el, esTexto) {
    // Configurar eventos comunes
    el.addEventListener('click', function(e) {
        e.stopPropagation();
        if (enModoConexion) {
            if (window.manejarClickEnModoConexion) {
                window.manejarClickEnModoConexion(el);
            } else {
                manejarClickEnModoConexion(el);
            }
        } else {
            seleccionarElemento(el);
        }
    });
    
    // Configurar eventos específicos según el tipo
    if (esTexto) {
        // Eventos para elementos de texto
        var textContent = el.querySelector('.text-content');
        
        // Edición directa al hacer doble clic
        el.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (textContent) textContent.focus();
        });
        
        // Guardar cambios al perder el foco
        if (textContent) {
            textContent.addEventListener('blur', function() {
                registrarAccion({
                    tipo: 'editar',
                    id: el.id,
                    valorAnterior: { texto: el.getAttribute('data-texto-original') },
                    valorNuevo: { texto: textContent.textContent }
                });
                el.setAttribute('data-texto-original', textContent.textContent);
            });
        }
    } else {
        // Eventos para símbolos militares
        el.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            e.preventDefault();
            editarElementoSeleccionado();
        });
    }
    
    // Menú contextual
    el.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        mostrarMenuContextual(e, el);
    });
    
    // Botones de edición en hover
    var editBtn = document.createElement('div');
    editBtn.className = 'symbol-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (esTexto) {
            var textContent = el.querySelector('.text-content');
            if (textContent) textContent.focus();
        } else {
            editarElementoSeleccionado();
        }
    });
    el.appendChild(editBtn);
    
    var deleteBtn = document.createElement('div');
    deleteBtn.className = 'symbol-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.style.display = 'none';
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (el === selectedElement) {
            eliminarElementoSeleccionado();
        } else {
            seleccionarElemento(el);
            eliminarElementoSeleccionado();
        }
    });
    el.appendChild(deleteBtn);
    
    el.addEventListener('mouseenter', function() {
        editBtn.style.display = 'block';
        deleteBtn.style.display = 'block';
    });
    
    el.addEventListener('mouseleave', function() {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    });
}
  /* Actualizar contador de símbolos basado en IDs existentes */
  function actualizarContadorSimbolos() {
    var elementos = document.querySelectorAll('.military-symbol');
    var maxId = 0;
    
    elementos.forEach(function(el) {
      var idMatch = el.id.match(/symbol-(\d+)/);
      if (idMatch && idMatch[1]) {
        var num = parseInt(idMatch[1]);
        if (num > maxId) {
          maxId = num;
        }
      }
    });
    
    symbolCounter = maxId;
  }
  
  /* Limpiar canvas */
  function limpiarCanvas() {
    // Eliminar todas las conexiones
    jsPlumbInstance.deleteEveryEndpoint();
    
    // Eliminar todos los elementos
    var elementos = document.querySelectorAll('.military-symbol');
    elementos.forEach(function(el) {
      if (canvas.contains(el)) {
        canvas.removeChild(el);
      }
    });
    
    // Resetear contador y estado
    symbolCounter = 0;
    selectedElement = null;
    historial = { acciones: [], indice: -1 };
    actualizarBotonesHistorial();
  }
  
  /* Exportar como imagen */
  function exportarComoImagen() {
    if (typeof html2canvas === 'undefined') {
      console.error("La biblioteca html2canvas no está cargada");
      alert("No se pudo exportar como imagen. La biblioteca html2canvas no está disponible.");
      return;
    }
  
    // Mostrar indicador de carga
    var loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando imagen...';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.borderRadius = '5px';
    loadingIndicator.style.zIndex = '9999';
    document.body.appendChild(loadingIndicator);
    
    // Usar html2canvas para capturar el canvas
    setTimeout(function() {
      html2canvas(canvas, {
        backgroundColor: 'white',
        scale: 2 // Mejor calidad
      }).then(function(canvas) {
        // Convertir a PNG
        var imgData = canvas.toDataURL('image/png');
        
        // Crear enlace de descarga
        var link = document.createElement('a');
        link.href = imgData;
        link.download = 'cuadro_organizacion_' + new Date().toISOString().slice(0,10) + '.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Eliminar indicador de carga
        document.body.removeChild(loadingIndicator);
      }).catch(function(error) {
        console.error("Error al generar la imagen:", error);
        document.body.removeChild(loadingIndicator);
        alert("Error al generar la imagen. Intente nuevamente.");
      });
    }, 100);
  }
  
  /* Imprimir cuadro */
  /* Imprimir cuadro */
function imprimirCuadro() {
    // Crear un iframe oculto
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Escribir contenido al iframe
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.write('<!DOCTYPE html><html><head>');
    iframeDoc.write('<title>Cuadro de Organización</title>');
    
    // Incluir estilos
    var estilos = document.getElementsByTagName('style');
    for (var i = 0; i < estilos.length; i++) {
        iframeDoc.write(estilos[i].outerHTML);
    }
    
    // Incluir enlaces a hojas de estilo
    var hojas = document.getElementsByTagName('link');
    for (var i = 0; i < hojas.length; i++) {
        if (hojas[i].rel === 'stylesheet') {
            iframeDoc.write(hojas[i].outerHTML);
        }
    }
    
    // Estilos adicionales para impresión
    iframeDoc.write('<style>');
    iframeDoc.write('body { margin: 0; padding: 20px; }');
    iframeDoc.write('.org-canvas-print { background-color: white; position: relative; width: 100%; height: auto; border: 1px solid #ccc; }');
    iframeDoc.write('.military-symbol { position: absolute; background-color: white !important; }');
    iframeDoc.write('.symbol-container svg { display: block !important; visibility: visible !important; }');
    iframeDoc.write('.jtk-connector { stroke: #000 !important; stroke-width: 2px !important; }');
    iframeDoc.write('.jtk-endpoint { fill: #000 !important; }');
    iframeDoc.write('svg * { visibility: visible !important; }');
    iframeDoc.write('* { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }');
    iframeDoc.write('</style>');
    
    iframeDoc.write('</head><body>');
    
    // Título
    iframeDoc.write('<h1 style="text-align: center; margin-bottom: 20px;">Cuadro de Organización Militar</h1>');
    
    // Usar html2canvas para capturar el canvas si está disponible
    if (typeof html2canvas !== 'undefined') {
        html2canvas(canvas, {
            backgroundColor: 'white',
            scale: 2,
            allowTaint: true,
            useCORS: true,
            logging: true,
            onclone: function(clonedDoc) {
                var clonedCanvas = clonedDoc.getElementById('org-canvas');
                if (clonedCanvas) {
                    clonedCanvas.style.transform = 'none';
                    var elements = clonedCanvas.querySelectorAll('.military-symbol');
                    elements.forEach(function(el) {
                        el.style.boxShadow = 'none';
                        el.style.backgroundColor = 'white';
                    });
                }
            }
        }).then(function(canvas) {
            var img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.style.width = '100%';
            img.style.maxWidth = '1000px';
            img.style.margin = '0 auto';
            img.style.display = 'block';
            
            iframeDoc.body.appendChild(img);
            
            // Imprimir después de cargar la imagen
            setTimeout(function() {
                iframe.contentWindow.print();
                setTimeout(function() {
                    document.body.removeChild(iframe);
                }, 500);
            }, 500);
        });
        
        iframeDoc.write('</body></html>');
        iframeDoc.close();
        return;
    }
    
    // Respaldo si html2canvas no está disponible
    // Clonar el canvas y sus elementos (enfoque manual)
    var canvasClone = document.createElement('div');
    canvasClone.className = 'org-canvas-print';
    canvasClone.style.width = canvas.offsetWidth + 'px';
    canvasClone.style.height = canvas.offsetHeight + 'px';
    
    // Clonar elementos
    var elementos = canvas.querySelectorAll('.military-symbol');
    elementos.forEach(function(el) {
        var clon = el.cloneNode(true);
        clon.style.transform = '';
        canvasClone.appendChild(clon);
    });
    
    // Dibujar líneas manualmente si es posible
    var conexiones = jsPlumbInstance.getAllConnections();
    if (conexiones.length > 0) {
        var svgContainer = document.createElement('div');
        svgContainer.style.position = 'absolute';
        svgContainer.style.top = '0';
        svgContainer.style.left = '0';
        svgContainer.style.width = '100%';
        svgContainer.style.height = '100%';
        
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', canvas.offsetWidth);
        svg.setAttribute('height', canvas.offsetHeight);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        
        conexiones.forEach(function(conn) {
            try {
                var sourceEl = document.getElementById(conn.sourceId);
                var targetEl = document.getElementById(conn.targetId);
                
                if (sourceEl && targetEl) {
                    var sourceRect = sourceEl.getBoundingClientRect();
                    var targetRect = targetEl.getBoundingClientRect();
                    var canvasRect = canvas.getBoundingClientRect();
                    
                    var x1 = sourceRect.left + sourceRect.width/2 - canvasRect.left;
                    var y1 = sourceRect.top + sourceRect.height - canvasRect.top;
                    var x2 = targetRect.left + targetRect.width/2 - canvasRect.left;
                    var y2 = targetRect.top - canvasRect.top;
                    
                    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', '#000');
                    line.setAttribute('stroke-width', '2');
                    
                    // Añadir flecha
                    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                    marker.setAttribute('id', 'arrowhead');
                    marker.setAttribute('markerWidth', '10');
                    marker.setAttribute('markerHeight', '7');
                    marker.setAttribute('refX', '0');
                    marker.setAttribute('refY', '3.5');
                    marker.setAttribute('orient', 'auto');
                    
                    var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                    polygon.setAttribute('fill', '#000');
                    
                    marker.appendChild(polygon);
                    defs.appendChild(marker);
                    svg.appendChild(defs);
                    
                    line.setAttribute('marker-end', 'url(#arrowhead)');
                    svg.appendChild(line);
                }
            } catch (e) {
                console.warn('Error al clonar conexión:', e);
            }
        });
        
        svgContainer.appendChild(svg);
        canvasClone.appendChild(svgContainer);
    }
    
    // Agregar el clon al iframe
    iframeDoc.body.appendChild(canvasClone);
    iframeDoc.write('</body></html>');
    iframeDoc.close();
    
    // Imprimir cuando el iframe esté listo
    iframe.onload = function() {
        setTimeout(function() {
            iframe.contentWindow.print();
            setTimeout(function() {
                document.body.removeChild(iframe);
            }, 500);
        }, 500);
    };
}
  
  /* Verificar dependencias */
/* Verificar dependencias */
function verificarDependencias() {
    let dependenciasOK = true;
    
    if (typeof ms === 'undefined') {
      console.error("ERROR: La biblioteca milsymbol no está disponible. Asegúrate de incluirla en tu HTML.");
      alert("Error: No se pudo cargar la biblioteca de símbolos militares. Por favor, recargue la página o contacte con soporte técnico.");
      dependenciasOK = false;
    }
    
    if (typeof jsPlumb === 'undefined') {
      console.error("ERROR: La biblioteca jsPlumb no está disponible. Asegúrate de incluirla en tu HTML.");
      alert("Error: No se pudo cargar la biblioteca de conexiones jsPlumb. Por favor, recargue la página o contacte con soporte técnico.");
      dependenciasOK = false;
    }
    
    if (typeof html2canvas === 'undefined') {
      console.warn("ADVERTENCIA: La biblioteca html2canvas no está disponible. La exportación como imagen no funcionará.");
    }
    
    return dependenciasOK;
  }
  
  /**
 * Agrega controles de zoom al canvas
 */
function agregarControlesZoom() {
    // Crear el contenedor para los controles de zoom
    var zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    
    // Botón de zoom in
    var zoomInBtn = document.createElement('button');
    zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
    zoomInBtn.title = 'Acercar';
    zoomInBtn.addEventListener('click', function() {
        ajustarZoom(0.1);
        actualizarNivelZoom();
    });
    
    // Botón de zoom out
    var zoomOutBtn = document.createElement('button');
    zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
    zoomOutBtn.title = 'Alejar';
    zoomOutBtn.addEventListener('click', function() {
        ajustarZoom(-0.1);
        actualizarNivelZoom();
    });
    
    // Botón de reset zoom
    var zoomResetBtn = document.createElement('button');
    zoomResetBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    zoomResetBtn.title = 'Restablecer zoom';
    zoomResetBtn.addEventListener('click', function() {
        resetZoom();
        actualizarNivelZoom();
    });
    
    // Mostrar nivel de zoom
    var zoomLevel = document.createElement('div');
    zoomLevel.className = 'zoom-level';
    zoomLevel.id = 'zoomLevel';
    zoomLevel.textContent = '100%';
    
    // Agregar elementos al contenedor
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomLevel);
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(zoomResetBtn);
    
    // Agregar el contenedor al cuerpo del documento
    document.body.appendChild(zoomControls);
    
    // Configurar eventos de rueda del ratón para zoom
    canvas.parentElement.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            var delta = e.deltaY || e.detail || e.wheelDelta;
            
            // Determinar la dirección del zoom
            var zoomDelta = delta > 0 ? -0.05 : 0.05;
            
            ajustarZoom(zoomDelta);
            actualizarNivelZoom();
        }
    });
}

/* Modificaciones a la función inicializarCuadroOrganizacion */
function configurarControlesZoom() {
    // Configurar botones de zoom si existen en el HTML
    var zoomInBtn = document.getElementById('zoomInBtn');
    var zoomOutBtn = document.getElementById('zoomOutBtn');
    var zoomResetBtn = document.getElementById('zoomResetBtn');
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', function() {
        ajustarZoom(0.1);
        actualizarNivelZoom();
      });
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', function() {
        ajustarZoom(-0.1);
        actualizarNivelZoom();
      });
    }
    
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', function() {
        resetZoom();
        actualizarNivelZoom();
      });
    }
    
    // Configurar eventos de rueda del ratón para zoom
    canvas.parentElement.addEventListener('wheel', function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
        var delta = e.deltaY || e.detail || e.wheelDelta;
        
        // Determinar la dirección del zoom
        var zoomDelta = delta > 0 ? -0.05 : 0.05;
        
        ajustarZoom(zoomDelta);
        actualizarNivelZoom();
      }
    });
  }
  
  /* Actualiza el indicador de nivel de zoom */
function actualizarNivelZoom() {
    var zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
      zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
    }
    
    // Cambiar la clase del canvas según el nivel de zoom
    if (currentZoom > 1.3) {
      canvas.classList.add('zoom-high');
    } else {
      canvas.classList.remove('zoom-high');
    }
  }
  
  /* Restablece el zoom al nivel inicial */
function resetZoom() {
    currentZoom = 1;
    canvas.style.transform = 'scale(' + currentZoom + ')';
    jsPlumbInstance.setZoom(currentZoom);
  }
  
  /* Función mejorada para ajustar el zoom */
function ajustarZoom(delta) {
    currentZoom += delta;
    if (currentZoom < 0.3) currentZoom = 0.3;
    if (currentZoom > 2) currentZoom = 2;
    
    canvas.style.transform = 'scale(' + currentZoom + ')';
    jsPlumbInstance.setZoom(currentZoom);
    
    // Ajustar el tamaño aparente de los elementos según el zoom
    ajustarTamañoElementos();
  }
  
  /* Ajusta el tamaño de los elementos según el nivel de zoom */
function ajustarTamañoElementos() {
    // Si el zoom es muy bajo, aumentar el tamaño de los elementos para que se vean mejor
    const elementos = document.querySelectorAll('.military-symbol');
    elementos.forEach(function(elemento) {
      // Ajuste según nivel de zoom
      if (currentZoom < 0.5) {
        const symbolContainer = elemento.querySelector('.symbol-container');
        if (symbolContainer) {
          symbolContainer.style.transform = 'scale(1.5)';
        }
      } else {
        const symbolContainer = elemento.querySelector('.symbol-container');
        if (symbolContainer) {
          symbolContainer.style.transform = 'scale(1.3)';
        }
      }
    });
  }
  
  /* Ajusta el zoom responsivamente y centra el canvas */
function ajustarZoomResponsive() {
    var container = canvas.parentElement;
    if (container && canvas && jsPlumbInstance) {
      // Ajustar el tamaño del canvas
      const canvasWidth = Math.max(3000, container.clientWidth * 1.5);
      const canvasHeight = Math.max(2000, container.clientHeight * 1.5);
      
      canvas.style.minWidth = canvasWidth + 'px';
      canvas.style.minHeight = canvasHeight + 'px';
      
      // Centrar el canvas en la ventana
      setTimeout(function() {
        container.scrollLeft = (canvas.scrollWidth - container.clientWidth) / 2;
        container.scrollTop = (canvas.scrollHeight - container.clientHeight) / 2;
      }, 100);
      
      // Ajustar escala inicial según el tamaño de pantalla
      var scaleX = container.clientWidth / canvasWidth;
      var scaleY = container.clientHeight / canvasHeight;
      var scale = Math.min(scaleX, scaleY, 1) * 0.8; // Escala un poco menor para ver los bordes
      
      currentZoom = scale;
      canvas.style.transform = 'scale(' + scale + ')';
      jsPlumbInstance.setZoom(scale);
      
      // Actualizar indicador de zoom
      actualizarNivelZoom();
    }
  }
  
  /* Función mejorada para agregar un marcador */
/* Función mejorada para agregar un marcador */
// Variables globales para controlar el modo de inserción
var enModoInsercion = false;
var sidcAInsertar = null;
var nombreAInsertar = null;

function agregarMarcador(sidc, nombre) {
    // Si ya estamos en modo inserción, cancelarlo primero
    if (enModoInsercion) {
        enModoInsercion = false;
        document.body.classList.remove('modo-insercion');
        canvas.removeEventListener('click', handleCanvasClick);
        ocultarMensaje();
    }
    
    // Iniciar nuevo modo de inserción
    enModoInsercion = true;
    sidcAInsertar = sidc;
    nombreAInsertar = nombre;
    
    // Cambiar el cursor y mostrar mensaje de ayuda
    document.body.classList.add('modo-insercion');
    mostrarMensaje('Haga clic en el canvas para colocar el elemento', 'info');
    
    // Agregar evento al canvas para la inserción
    canvas.addEventListener('click', handleCanvasClick);
    
    // Cancelar cualquier otro modo activo
    if (enModoConexion) {
        if (window.cancelarModoConexion) {
            window.cancelarModoConexion();
        } else {
            enModoConexion = false;
            if (connectionSource) {
                connectionSource.className = connectionSource.className.replace(" connection-source", "");
                connectionSource = null;
            }
        }
    }
    
    // Cerrar menús
    closeMenus();
    
    // Función para manejar el clic en el canvas
    function handleCanvasClick(e) {
        // Si el clic no es directamente en el canvas, salir
        if (e.target !== canvas) return;
        
        // Detener la propagación del evento
        e.stopPropagation();
        
        console.log("Clic en el canvas:", e.clientX, e.clientY);
        
        // Obtener la matriz de transformación del canvas
        var transform = canvas.style.transform || '';
        var scale = 1;
        if (transform.includes('scale')) {
            var match = transform.match(/scale\(([^)]+)\)/);
            if (match && match[1]) {
                scale = parseFloat(match[1]);
            }
        }
        
        // Calcular la posición exacta del clic
        var rect = canvas.getBoundingClientRect();
        var x = (e.clientX - rect.left) / scale;
        var y = (e.clientY - rect.top) / scale;
        
        console.log("Posición calculada antes de ajustes:", x, y, "Scale:", scale);
        
        // Ajustar a la cuadrícula
        var left = Math.round(x / 10) * 10;
        var top = Math.round(y / 10) * 10;
        
        console.log("Posición final del elemento:", left, top);
        
        // Crear el contador
        symbolCounter++;
        var symbolId = 'symbol-' + symbolCounter;
        
        // Crear el contenedor del símbolo
        var el = document.createElement('div');
        el.id = symbolId;
        el.className = 'military-symbol';
        el.setAttribute('data-sidc', sidcAInsertar);
        
        try {
            // Crear el símbolo con la biblioteca milsymbol
            var container = document.createElement('div');
            container.className = 'symbol-container';
            var symbol = new ms.Symbol(sidcAInsertar, { size: 45, standard: 'APP6', fill: true });
            container.innerHTML = symbol.asSVG();
            el.appendChild(container);
            
            // Crear la etiqueta con el nombre
            var label = document.createElement('div');
            label.className = 'symbol-label';
            label.textContent = nombreAInsertar || 'Elemento ' + symbolCounter;
            el.appendChild(label);
            
            // Establecer la posición
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            
            // Agregar al canvas
            canvas.appendChild(el);
            
            // Hacer arrastrable con jsPlumb
            jsPlumbInstance.draggable(el, {
                containment: "parent",
                grid: [10, 10],
                stop: function(event) {
                    registrarAccion({
                        tipo: 'mover',
                        id: el.id,
                        posicionAnterior: {
                            left: parseInt(event.pos[0]),
                            top: parseInt(event.pos[1])
                        },
                        posicionNueva: {
                            left: parseInt(el.style.left),
                            top: parseInt(el.style.top)
                        }
                    });
                }
            });
            
            // El resto del código para configurar eventos y demás...
            
            // Configurar eventos del elemento
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                if (enModoConexion) {
                    if (window.manejarClickEnModoConexion) {
                        window.manejarClickEnModoConexion(el);
                    } else {
                        manejarClickEnModoConexion(el);
                    }
                } else {
                    seleccionarElemento(el);
                }
            });
            
            // Agregar evento de doble clic para edición
            el.addEventListener('dblclick', function(e) {
                e.stopPropagation();
                e.preventDefault();
                mostrarMenuContextual(e, el);
            });
            
            // Agregar menú contextual
            el.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
                mostrarMenuContextual(e, el);
            });
            
            // Añadir botones de edición al pasar el ratón
            var editBtn = document.createElement('div');
            editBtn.className = 'symbol-edit-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.style.display = 'none';
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                editarElementoSeleccionado();
            });
            el.appendChild(editBtn);
            
            var deleteBtn = document.createElement('div');
            deleteBtn.className = 'symbol-delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.style.display = 'none';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                eliminarElementoSeleccionado();
            });
            el.appendChild(deleteBtn);
            
            el.addEventListener('mouseenter', function() {
                editBtn.style.display = 'block';
                deleteBtn.style.display = 'block';
            });
            
            el.addEventListener('mouseleave', function() {
                editBtn.style.display = 'none';
                deleteBtn.style.display = 'none';
            });
            
            // Registrar la creación en el historial
            registrarAccion({
                tipo: 'crear',
                id: symbolId,
                sidc: sidcAInsertar,
                nombre: nombreAInsertar || 'Elemento ' + symbolCounter,
                posicion: {
                    left: parseInt(el.style.left),
                    top: parseInt(el.style.top)
                }
            });
            
            // Seleccionar el elemento recién creado
            seleccionarElemento(el);
            
            // Actualizar estado de los botones de deshacer/rehacer
            actualizarBotonesHistorial();
            
            // Limpiar el modo inserción
            enModoInsercion = false;
            document.body.classList.remove('modo-insercion');
            canvas.removeEventListener('click', handleCanvasClick);
            ocultarMensaje();
            
        } catch (error) {
            console.error("Error al crear marcador:", error);
            
            // Limpiar el modo inserción en caso de error
            enModoInsercion = false;
            document.body.classList.remove('modo-insercion');
            canvas.removeEventListener('click', handleCanvasClick);
            ocultarMensaje();
        }
    }
}

// Verificar dependencias al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    if (verificarDependencias()) {
      inicializarCuadroOrganizacion();
    }
  });

/**
 * Agrega un marcador de texto al canvas
 * @param {string} texto - Texto a mostrar
 * @param {object} opciones - Opciones para el texto (color, tamaño, etc)
 */
function agregarTexto(texto, opciones) {
    // Valores por defecto
    opciones = opciones || {};
    texto = texto || 'Texto';
    
    // Crear el contador
    symbolCounter++;
    var textId = 'text-' + symbolCounter;
    
    // Crear el contenedor del texto
    var el = document.createElement('div');
    el.id = textId;
    el.className = 'military-symbol text-element';
    
    // Crear el contenido de texto
    var textContent = document.createElement('div');
    textContent.className = 'text-content';
    textContent.contentEditable = true;
    textContent.textContent = texto;
    textContent.style.color = opciones.color || '#ffffff';
    textContent.style.fontSize = (opciones.fontSize || 16) + 'px';
    textContent.style.fontWeight = opciones.bold ? 'bold' : 'normal';
    textContent.style.fontStyle = opciones.italic ? 'italic' : 'normal';
    textContent.style.textDecoration = opciones.underline ? 'underline' : 'none';
    
    // Manejar eventos de edición directa
    textContent.addEventListener('blur', function() {
        // Registrar cambio para deshacer
        registrarAccion({
            tipo: 'editar',
            id: el.id,
            valorAnterior: { texto: el.getAttribute('data-texto-original') },
            valorNuevo: { texto: textContent.textContent }
        });
        
        // Actualizar valor original
        el.setAttribute('data-texto-original', textContent.textContent);
    });
    
    el.appendChild(textContent);
    
    // Guardar el texto original para deshacer/rehacer
    el.setAttribute('data-texto-original', texto);
    
    // Posicionar en el centro del canvas visible
    var canvasRect = canvas.getBoundingClientRect();
    var containerRect = canvas.parentElement.getBoundingClientRect();
    
    var scrollLeft = canvas.parentElement.scrollLeft;
    var scrollTop = canvas.parentElement.scrollTop;
    
    var centerX = containerRect.width / 2;
    var centerY = containerRect.height / 2;
    
    var left = scrollLeft + centerX - canvasRect.left;
    var top = scrollTop + centerY - canvasRect.top;
    
    // Ajustar a la cuadrícula
    left = Math.round(left / 10) * 10;
    top = Math.round(top / 10) * 10;
    
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    
    // Agregar al canvas
    canvas.appendChild(el);
    
    // Hacer arrastrable con jsPlumb
    jsPlumbInstance.draggable(el, {
        containment: "parent",
        grid: [10, 10],
        stop: function(event) {
            registrarAccion({
                tipo: 'mover',
                id: el.id,
                posicionAnterior: {
                    left: parseInt(event.pos[0]),
                    top: parseInt(event.pos[1])
                },
                posicionNueva: {
                    left: parseInt(el.style.left),
                    top: parseInt(el.style.top)
                }
            });
        }
    });
    
    // Configurar eventos del elemento
    el.addEventListener('click', function(e) {
        e.stopPropagation();
        if (enModoConexion) {
            if (window.manejarClickEnModoConexion) {
                window.manejarClickEnModoConexion(el);
            } else {
                manejarClickEnModoConexion(el);
            }
        } else {
            seleccionarElemento(el);
        }
    });
    
    // Agregar evento de doble clic para edición directa
    el.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        e.preventDefault();
        textContent.focus();
    });
    
    // Agregar menú contextual
    el.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        mostrarMenuContextual(e, el);
    });
    
    // Botones de edición en hover
    var editBtn = document.createElement('div');
    editBtn.className = 'symbol-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        textContent.focus();
    });
    el.appendChild(editBtn);
    
    var deleteBtn = document.createElement('div');
    deleteBtn.className = 'symbol-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.style.display = 'none';
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        eliminarElementoSeleccionado();
    });
    el.appendChild(deleteBtn);
    
    el.addEventListener('mouseenter', function() {
        editBtn.style.display = 'block';
        deleteBtn.style.display = 'block';
    });
    
    el.addEventListener('mouseleave', function() {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    });
    
    // Registrar la creación en el historial
    registrarAccion({
        tipo: 'crear',
        id: textId,
        texto: texto,
        posicion: {
            left: parseInt(el.style.left),
            top: parseInt(el.style.top)
        }
    });
    
    // Cerrar el menú
    closeMenus();
    
    // Seleccionar el elemento recién creado
    seleccionarElemento(el);
    
    // Actualizar estado de los botones de deshacer/rehacer
    actualizarBotonesHistorial();
    
    return el;
}

/**
 * Agrega un título al canvas
 */
function agregarTitulo() {
    agregarTexto('Título', {
        fontSize: 24,
        bold: true
    });
}

/**
 * Agrega una leyenda al canvas
 */
function agregarLeyenda() {
    agregarTexto('Leyenda', {
        fontSize: 14,
        italic: true
    });
}
  // Añadimos las funciones a window para que sean accesibles globalmente
    window.agregarMarcador = agregarMarcador;
    window.actualizarSidc = actualizarSidc;
    window.toggleMenu = toggleMenu;
    window.closeMenus = closeMenus;
    window.editarElementoSeleccionado = editarElementoSeleccionado;
    window.eliminarElementoSeleccionado = eliminarElementoSeleccionado;
    window.deshacerOrg = deshacerOrg;
    window.rehacerOrg = rehacerOrg;
    window.cerrarPanelEdicion = cerrarPanelEdicion;
    window.actualizarPreviewSimbolo = actualizarPreviewSimbolo;
    window.guardarCambiosUnidad = guardarCambiosUnidad;
    window.guardarCuadroOrganizacion = guardarCuadroOrganizacion;
    window.cargarCuadroOrganizacion = cargarCuadroOrganizacion;
    window.exportarComoImagen = exportarComoImagen;
    window.imprimirCuadro = imprimirCuadro;
    window.limpiarCanvas = limpiarCanvas;
    window.mostrarMenuContextual = mostrarMenuContextual;
    window.iniciarConexion = iniciarConexion;
    window.ajustarZoom = ajustarZoom;
    window.resetZoom = resetZoom;
    window.actualizarNivelZoom = actualizarNivelZoom;
    window.agregarTexto = agregarTexto;
    window.agregarTitulo = agregarTitulo;
    window.agregarLeyenda = agregarLeyenda;