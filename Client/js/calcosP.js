// calcos.js
// Este archivo maneja la creación, gestión y guardado de calcos (capas) en el mapa

// Objeto para almacenar los calcos
var calcos = {};

// Función para crear un nuevo calco
function crearNuevoCalco() {
    console.log("Creando nuevo calco");
    var calcoCount = Object.keys(calcos).length + 1;
    var nombreCalco = "Calco " + calcoCount;
  
    var nuevoCalco = L.layerGroup();
    calcos[nombreCalco] = nuevoCalco;
  
    nuevoCalco.addTo(mapa); 
  
    setCalcoActivo(nombreCalco);
    agregarCalcoALista(nombreCalco);
    console.log("Nuevo calco creado:", nombreCalco);
}
  
// Función para establecer el calco activo
function setCalcoActivo(nombreCalco) {
    console.log("Estableciendo calco activo:", nombreCalco);
    if (window.calcoActivo) {
        mapa.removeLayer(window.calcoActivo);
    }
    window.calcoActivo = calcos[nombreCalco];
    mapa.addLayer(window.calcoActivo);
    actualizarInterfazCalcos();
}
  
// Función para agregar un calco a la lista en la interfaz
function agregarCalcoALista(nombreCalco) {
    var calcosLista = document.getElementById('calcosLista');
    var nuevoCalcoItem = document.createElement('div');
    nuevoCalcoItem.className = 'calco-item';
    nuevoCalcoItem.innerHTML = `
        <div class="calco-header">
            <input type="radio" name="calcoActivo" id="calcoRadio_${nombreCalco}" value="${nombreCalco}" ${window.calcoActivo === calcos[nombreCalco] ? 'checked' : ''}>
            <label for="calcoRadio_${nombreCalco}">${nombreCalco}</label>
            <div class="calco-buttons">
                <button onclick="toggleCalcoVisibility('${nombreCalco}')" title="Mostrar/Ocultar"><i class="fas fa-eye"></i></button>
                <button onclick="renameCalco('${nombreCalco}')" title="Renombrar"><i class="fas fa-pencil-alt"></i></button>
                <button onclick="eliminarCalco('${nombreCalco}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                <button onclick="toggleElementosList('${nombreCalco}')" title="Lista de elementos"><i class="fas fa-list"></i></button>
            </div>
        </div>
        <ul id="elementosList_${nombreCalco}" class="elementos-list" style="display: none;"></ul>
    `;
    calcosLista.appendChild(nuevoCalcoItem);

    document.getElementById(`calcoRadio_${nombreCalco}`).addEventListener('change', function() {
        setCalcoActivo(this.value);
    });
}

function toggleElementosList(nombreCalco) {
    var lista = document.getElementById(`elementosList_${nombreCalco}`);
    if (lista.style.display === 'none') {
        actualizarElementosList(nombreCalco);
        lista.style.display = 'block';
    } else {
        lista.style.display = 'none';
    }
}

// En calcosP.js
function actualizarElementosList(nombreCalco) {
    var lista = document.getElementById(`elementosList_${nombreCalco}`);
    if (!lista) {
        console.warn(`Lista de elementos no encontrada para el calco: ${nombreCalco}`);
        return;
    }
    lista.innerHTML = '';
    
    calcos[nombreCalco].eachLayer(function(layer) {
        // Solo procesar elementos con nombre y excluir marcadores sin nombre
        if ((layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) 
            && layer.options.nombre
            && layer.options.nombre !== 'Sin nombre'
            && !(layer instanceof L.Marker && layer.options.nombre === 'Sin nombre')) {
            
            var item = document.createElement('li');
            item.className = 'elemento-item';
            
            var nombreElemento = layer.options.nombre;
            var tipoElemento = obtenerTipoElemento(layer);
            
            item.innerHTML = `
                <span class="elemento-icono">${obtenerIconoElemento(layer)}</span>
                <span class="elemento-info">${tipoElemento}: ${nombreElemento}</span>
            `;
            
            item.addEventListener('click', function() {
                mapa.setView(layer.getLatLng ? layer.getLatLng() : layer.getBounds().getCenter());
                seleccionarElemento(layer);
            });
            lista.appendChild(item);
        }
    });
}

function obtenerTipoElemento(layer) {
    if (layer instanceof L.Marker) return 'Marcador';
    if (layer instanceof L.Polygon) return 'Polígono';
    if (layer instanceof L.Polyline) {
        if (layer.options.tipoElemento === 'flechaAncha') return 'Flecha Ancha';
        if (layer.options.tipoElemento === 'flecha') return 'Flecha';
        if (layer.options.tipoElemento === 'lineaMedicion') return 'Medición';
        return 'Línea';
    }
    return 'Desconocido';
}

function obtenerIconoElemento(layer) {
    if (layer instanceof L.Marker && layer.options.sidc) {
        var sym = new ms.Symbol(layer.options.sidc, {size: 20});
        return sym.asSVG();
    }
    if (layer instanceof L.Polygon) return '&#9633;'; // Cuadrado
    if (layer instanceof L.Polyline) return '&#9585;'; // Línea diagonal
    return '&#9679;'; // Círculo por defecto
}

// Asegúrate de que esta función esté definida y se llame después de cualquier modificación en el calco
function actualizarElementosCalco() {
    let nombreCalcoActivo = Object.keys(calcos).find(key => calcos[key] === calcoActivo);
    if (nombreCalcoActivo) {
        actualizarElementosList(nombreCalcoActivo);
    } else {
        console.warn('No se pudo determinar el calco activo para actualizar los elementos');
    }
}

// Función para alternar la visibilidad de un calco
function toggleCalcoVisibility(nombreCalco) {
    console.log("Alternando visibilidad del calco:", nombreCalco);
    var calco = calcos[nombreCalco];
    if (calco) {
        if (mapa.hasLayer(calco)) {
            mapa.removeLayer(calco);
        } else {
            calco.addTo(mapa);
        }
    } else {
        console.error("El calco '" + nombreCalco + "' no existe.");
    }
}

// Función para renombrar un calco
function renameCalco(nombreCalco) {
    var nuevoNombre = prompt("Ingrese el nuevo nombre para el calco:", nombreCalco);
    if (nuevoNombre && nuevoNombre.trim() !== "" && nuevoNombre !== nombreCalco) {
        if (calcos[nuevoNombre]) {
            alert("Ya existe un calco con ese nombre.");
            return; 
        }

        calcos[nuevoNombre] = calcos[nombreCalco];
        delete calcos[nombreCalco];

        if (window.calcoActivo === calcos[nuevoNombre]) {
            window.calcoActivo = calcos[nuevoNombre];
        }

        actualizarInterfazCalcos();
        console.log("Calco renombrado de", nombreCalco, "a", nuevoNombre);
    }
}

// Función para eliminar un calco
function eliminarCalco(nombreCalco) {
    if (confirm("¿Estás seguro de que quieres eliminar el calco \"" + nombreCalco + "\"?")) {
        mapa.removeLayer(calcos[nombreCalco]);
        delete calcos[nombreCalco];
        if (window.calcoActivo === calcos[nombreCalco]) {
            window.calcoActivo = null;
        }
        actualizarInterfazCalcos();
        console.log("Calco eliminado:", nombreCalco);
    }
}

// Función para actualizar la interfaz de calcos
function actualizarInterfazCalcos() {
    var calcosLista = document.getElementById('calcosLista');
    if (!calcosLista) {
        console.error('Elemento calcosLista no encontrado en el DOM');
        return;
    }
    calcosLista.innerHTML = '';
    Object.keys(calcos).forEach(agregarCalcoALista);
}

// Función para crear un elemento del calco
function crearElementoCalco(nuevoCalco) {
    return function(feature) {
        console.log("Procesando Feature:", feature);
        if (feature.tipo === "marcador") {
            var sym = new ms.Symbol(feature.sidc, {size: 35});
            var canvas = sym.asCanvas();
            var iconUrl = canvas.toDataURL();
            var icon = L.icon({
                iconUrl: iconUrl,
                iconSize: [50, 35],
                iconAnchor: [25, 17]
            });
            var marker = L.marker([feature.latlng.lat, feature.latlng.lng], { 
                icon: icon, 
                title: feature.nombre, 
                draggable: true,
                sidc: feature.sidc,
                nombre: feature.nombre
            }).addTo(nuevoCalco);
            marker.on('click', function () { seleccionarElemento(this); });
        } else if (feature.tipo === "polilinea" || feature.tipo === "poligono") {
            var PolyClass = feature.tipo === "poligono" ? L.polygon : L.polyline;
            var poly = new PolyClass(feature.latlngs, { 
                color: feature.color, 
                weight: feature.weight,
                sidc: feature.sidc,
                name: feature.name
            }).addTo(nuevoCalco);
            poly.on('click', function () { seleccionarElemento(this); });
        }
    };
}

// Función para guardar un calco
function guardarCalco() {
    if (!window.calcoActivo) {
        alert("No hay un calco activo para guardar.");
        return;
    }

    var escenario = {
        nombre: window.calcoActivo.options.nombre || "Escenario sin nombre",
        fecha: new Date().toISOString(),
        vista: {
            centro: mapa.getCenter(),
            zoom: mapa.getZoom()
        },
        elementos: []
    };

    window.calcoActivo.eachLayer(function(feature) {
        var elementoData;
        if (feature instanceof L.Marker) {
            elementoData = {
                tipo: "marcador",
                latlng: feature.getLatLng(),
                sidc: feature.options.sidc,
                nombre: feature.options.nombre,
                designacion: feature.options.designacion,
                dependencia: feature.options.dependencia,
                esEquipo: feature.options.esEquipo || false
            };
        } else if (feature instanceof L.Polyline) {
            elementoData = {
                tipo: feature instanceof L.Polygon ? "poligono" : "polilinea",
                latlngs: feature.getLatLngs(),
                color: feature.options.color,
                weight: feature.options.weight,
                dashArray: feature.options.dashArray,
                sidc: feature.options.sidc,
                nombre: feature.options.nombre
            };
        }
        if (elementoData) escenario.elementos.push(elementoData);
    });

    var filename = prompt("Ingrese el nombre del archivo:", "escenario_guardado.json");
    if (!filename) {
        alert("Se canceló la operación de guardado.");
        return;
    }

    var jsonDatos = JSON.stringify(escenario, null, 2);
    var blob = new Blob([jsonDatos], { type: 'application/json' });
    saveAs(blob, filename);
    console.log("Escenario guardado como:", filename);
}

function cargarCalco() {
    var inputArchivo = document.createElement('input');
    inputArchivo.type = 'file';
    inputArchivo.accept = '.json';
    inputArchivo.click();

    inputArchivo.onchange = function () {
        var archivo = inputArchivo.files[0];
        if (!archivo) return;

        var lector = new FileReader();
        lector.onload = function (event) {
            try {
                var escenario = JSON.parse(event.target.result);
                
                var nombreCalco = escenario.nombre || "Calco Importado";
                var nuevoCalco = L.layerGroup().addTo(mapa);
                calcos[nombreCalco] = nuevoCalco;
                
                if (escenario.vista) {
                    mapa.setView(escenario.vista.centro, escenario.vista.zoom);
                }

                escenario.elementos.forEach(function(elemento) {
                    if (elemento.tipo === "marcador") {
                        var infoAdicional = elemento.designacion + '/' + elemento.dependencia;
                
                        var sym = new ms.Symbol(elemento.sidc, {
                            size: 35,
                            additionalInformation: infoAdicional,
                           
                        });
                
                        var marcador = L.marker(elemento.latlng, {
                            icon: L.divIcon({
                                className: 'custom-div-icon',
                                html: sym.asSVG(),
                                iconSize: [70, 50],
                                iconAnchor: [35, 25]
                            }),
                            draggable: true,
                            sidc: elemento.sidc,
                            nombre: elemento.nombre,
                            designacion: elemento.designacion,
                            dependencia: elemento.dependencia
                        });

                        marcador.on('click', function() {
                            seleccionarElemento(this);
                            if (esEquipo(this.options.sidc)) {
                                mostrarPanelEdicionEquipo(this);
                            } else {
                                mostrarPanelEdicionUnidad(this);
                            }
                        });

                        marcador.addTo(nuevoCalco);
                    } else if (elemento.tipo === "polilinea" || elemento.tipo === "poligono") {
                        var options = {
                            color: elemento.color,
                            weight: elemento.weight,
                            dashArray: elemento.dashArray,
                            sidc: elemento.sidc,
                            nombre: elemento.nombre
                        };
                        var poly = (elemento.tipo === "poligono" ? L.polygon : L.polyline)(elemento.latlngs, options);
                        poly.on('click', function() { 
                            seleccionarElemento(this);
                            mostrarPanelEdicionLinea(this);
                        });
                        poly.addTo(nuevoCalco);
                    }
                });

                setCalcoActivo(nombreCalco);
                agregarCalcoALista(nombreCalco);
                console.log("Escenario cargado exitosamente:", nombreCalco);

            } catch (error) {
                console.error("Error al cargar el escenario:", error);
                alert("Error al cargar el escenario: " + error.message);
            }
        };
        lector.readAsText(archivo);
        habilitarDobleClicEnElementos();
    };
}


// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando funcionalidades de calcos");
    var nuevoCalcoBtn = document.getElementById('nuevoCalcoBtn');
    var cargarCalcoBtn = document.getElementById('cargarCalcoBtn');

    var guardarCalcoBtn = document.getElementById('guardarCalcoBtn');

    if (nuevoCalcoBtn) {
        nuevoCalcoBtn.addEventListener('click', crearNuevoCalco);
    } else {
        console.error('Botón nuevoCalcoBtn no encontrado en el DOM');
    }

    if (cargarCalcoBtn) {
        cargarCalcoBtn.addEventListener('click', cargarCalco);
    } else {
        console.error('Botón cargarCalcoBtn no encontrado en el DOM');
    }

    if (guardarCalcoBtn) {
        guardarCalcoBtn.addEventListener('click', guardarCalco);
    } else {
        console.error('Botón guardarCalcoBtn no encontrado en el DOM');
    }
});



// Exportación de funciones para uso en otros archivos
window.crearNuevoCalco = crearNuevoCalco;
window.setCalcoActivo = setCalcoActivo;
window.toggleCalcoVisibility = toggleCalcoVisibility;
window.renameCalco = renameCalco;
window.eliminarCalco = eliminarCalco;
window.cargarCalco = cargarCalco;
window.guardarCalco = guardarCalco;
window.actualizarElementosList = actualizarElementosList;
window.actualizarElementosCalco = actualizarElementosCalco;