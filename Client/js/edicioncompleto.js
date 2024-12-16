let panelEdicionActual = null;


// Estructura de unidades militares según la doctrina argentina
const unidadesMilitares = {
    "Armas": {
        "Infantería": {
            codigo: "UCI",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": "",
                        "Aerotransportada": "A",
                        "De Montaña": "O",
                        "De Monte": "X"
                    }
                },
                "Mecanizada": {
                    codigo: "Z",
                    caracteristicas: {
                        "Normal": ""
                    }
                },
                "Motorizada": {
                    codigo: "M",
                    caracteristicas: {
                        "Normal": ""
                    }
                },
                "Ligera": {
                    codigo: "L",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Caballería": {
            codigo: "UCR",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": "",
                        "Aerotransportada": "A",
                        "De Montaña": "O"
                    }
                },
                "Blindada": {
                    codigo: "VA",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Artillería": {
            codigo: "UCF",
            tipos: {
                "Campaña": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": "",
                        "Autopropulsada": "HE"
                    }
                },
            }
        },
        "Antiaérea": {
            codigo: "UCD",
            tipo: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": "",
                        "De Montaña": "O"
                    }
                },
            }
        },
        "Ingenieros": {
            codigo: "UCE",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": "",
                        "De Montaña": "O"
                    }
                },
                "Pontoneros": {
                    codigo: "B",
                    caracteristicas: {
                        "Normal": ""
                    }
                },
                "Construcciones": {
                    codigo: "C",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Comunicaciones": {
            codigo: "UCS",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        }
    },
    "Servicios": {
        "Intendencia": {
            codigo: "USI",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Arsenales": {
            codigo: "USA",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Sanidad": {
            codigo: "USM",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Veterinaria": {
            codigo: "USV",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Justicia": {
            codigo: "USJ",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Construcciones": {
            codigo: "USC",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Transporte": {
            codigo: "UST",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        },
        "Finanzas": {
            codigo: "USF",
            tipos: {
                "Básica": {
                    codigo: "",
                    caracteristicas: {
                        "Normal": ""
                    }
                }
            }
        }
    }
};

function actualizarTipos(categoriaArma) {
    const [categoria, arma] = categoriaArma.split('|');
    const tipoSelect = document.getElementById('tipo');
    tipoSelect.innerHTML = '';
    const tipos = unidadesMilitares[categoria][arma].tipos;
    Object.keys(tipos).forEach(tipo => {
        let option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
    });
    actualizarCaracteristicas(categoriaArma, Object.keys(tipos)[0]);
}

function actualizarCaracteristicas(categoriaArma, tipo) {
    const [categoria, arma] = categoriaArma.split('|');
    const caracteristicaSelect = document.getElementById('caracteristica');
    caracteristicaSelect.innerHTML = '';
    const caracteristicas = unidadesMilitares[categoria][arma].tipos[tipo].caracteristicas;
    Object.keys(caracteristicas).forEach(caract => {
        let option = document.createElement('option');
        option.value = caract;
        option.textContent = caract;
        caracteristicaSelect.appendChild(option);
    });
}

function mostrarPanelEdicion(panelId) {
    console.log(`Intentando mostrar panel: ${panelId}`);
    cerrarTodosPaneles();
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        panel.classList.add('show');
        console.log(`Panel ${panelId} mostrado`);
        
        // Log de estilos específicos
        const styles = window.getComputedStyle(panel);
        console.log(`Estilos de ${panelId}:`, {
            display: styles.display,
            position: styles.position,
            top: styles.top,
            right: styles.right,
            zIndex: styles.zIndex,
            backgroundColor: styles.backgroundColor,
            visibility: styles.visibility,
            opacity: styles.opacity
        });
    } else {
        console.error(`Panel ${panelId} no encontrado`);
    }
}

function mostrarPanelEdicionUnidad(elemento) {
    console.log("Mostrando panel de edición de unidad");
    mostrarPanelEdicion('panelEdicionUnidad');
    
    if (elemento?.options?.sidc) {
        const sidc = elemento.options.sidc;
        const tipoUnidad = determinarTipoUnidad(sidc);
        
        document.getElementById('afiliacion').value = sidc.charAt(1);
        document.getElementById('estado').value = sidc.charAt(3);
        
        if (tipoUnidad.categoria && tipoUnidad.arma) {
            document.getElementById('arma').value = `${tipoUnidad.categoria}|${tipoUnidad.arma}`;
            actualizarTipos(`${tipoUnidad.categoria}|${tipoUnidad.arma}`);
            document.getElementById('tipo').value = tipoUnidad.tipo;
            actualizarCaracteristicas(`${tipoUnidad.categoria}|${tipoUnidad.arma}`, tipoUnidad.tipo);
            document.getElementById('caracteristica').value = tipoUnidad.caracteristica;
        }
        
        document.getElementById('magnitud').value = sidc.charAt(11) || '-';
        document.getElementById('puestoComando').checked = ['A', 'D'].includes(sidc.charAt(10));
        document.getElementById('fuerzaTarea').checked = ['E', 'D'].includes(sidc.charAt(10));
        document.getElementById('designacion').value = elemento.options.designacion || '';
        document.getElementById('dependencia').value = elemento.options.dependencia || '';
    }
    
    actualizarPreviewSimbolo();
}

function mostrarPanelEdicionEquipo(elemento) {
    console.log("Mostrando panel de edición de equipo");
    mostrarPanelEdicion('panelEdicionEquipo');
    
    if (elemento?.options?.sidc) {
        document.getElementById('afiliacionEquipo').value = elemento.options.sidc.charAt(1);
        document.getElementById('designacionEquipo').value = elemento.options.designacion || '';
        document.getElementById('asignacionEquipo').value = elemento.options.dependencia || '';
    }
    
    actualizarPreviewSimboloEquipo();
}


function actualizarCampoSIDC(id, valor) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor || '';
}

function determinarTipoUnidad(sidc) {
    const codigoUnidad = sidc.substr(4, 6);
    for (const [categoria, armas] of Object.entries(unidadesMilitares)) {
        for (const [arma, detalles] of Object.entries(armas)) {
            if (codigoUnidad.startsWith(detalles.codigo)) {
                const restoCodigo = codigoUnidad.substr(detalles.codigo.length);
                for (const [tipo, tipoDetalles] of Object.entries(detalles.tipos)) {
                    if (restoCodigo.startsWith(tipoDetalles.codigo)) {
                        const caracteristica = restoCodigo.substr(tipoDetalles.codigo.length, 1);
                        for (const [caract, caractCodigo] of Object.entries(tipoDetalles.caracteristicas)) {
                            if (caractCodigo === caracteristica) {
                                return { categoria, arma, tipo, caracteristica: caract };
                            }
                        }
                        return { categoria, arma, tipo, caracteristica: "Normal" };
                    }
                }
                return { categoria, arma, tipo: "Básica", caracteristica: "Normal" };
            }
        }
    }
    return { categoria: "Desconocido", arma: "Desconocido", tipo: "Desconocido", caracteristica: "Desconocido" };
}

function obtenerSIDCActual() {
    if (!elementoSeleccionado?.options?.sidc) return '';

    let sidc = elementoSeleccionado.options.sidc;
    const afiliacion = document.getElementById('afiliacion').value;
    const estado = document.getElementById('estado').value;
    const [categoria, arma] = document.getElementById('arma').value.split('|');
    const tipo = document.getElementById('tipo').value;
    const caracteristica = document.getElementById('caracteristica').value;
    const magnitud = document.getElementById('magnitud').value;

    const codigoArma = unidadesMilitares[categoria][arma].codigo;
    const codigoTipo = unidadesMilitares[categoria][arma].tipos[tipo].codigo;
    const codigoCaracteristica = unidadesMilitares[categoria][arma].tipos[tipo].caracteristicas[caracteristica];

    let centroParte = (codigoArma + codigoTipo + codigoCaracteristica).padEnd(6, '-');
    sidc = sidc.substr(0, 1) + afiliacion + sidc.substr(2, 1) + estado + centroParte;

    let modificador = '-';
    if (document.getElementById('puestoComando').checked && document.getElementById('fuerzaTarea').checked) {
        modificador = 'B';
    } else if (document.getElementById('puestoComando').checked) {
        modificador = 'A';
    } else if (document.getElementById('fuerzaTarea').checked) {
        modificador = 'E';
    }
    sidc = sidc.substr(0, 10) + modificador + magnitud + sidc.substr(12);

    return sidc.padEnd(15, '-').substr(0, 15);
}

function actualizarPreviewSimbolo() {
    const sidc = obtenerSIDCActual();
    const sym = new ms.Symbol(sidc, {size: 30});
    const sidcDisplay = document.getElementById('sidcDisplay');
    if (sidcDisplay) {
        sidcDisplay.innerHTML = sym.asSVG();
        sidcDisplay.innerHTML += '<br>SIDC: ' + sidc;

        const designacion = document.getElementById('designacion').value;
        const dependencia = document.getElementById('dependencia').value;

        if (designacion || dependencia) {
            const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
            texto.setAttribute("x", "35");
            texto.setAttribute("y", "35");
            texto.setAttribute("fill", "black");
            texto.textContent = designacion + (dependencia ? '/' + dependencia : '');
            sidcDisplay.appendChild(texto);
        }
    }
}


function cerrarPanelEdicion(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('show');
        console.log(`Panel ${panelId} cerrado`);
    } else {
        console.error(`Panel ${panelId} no encontrado al intentar cerrar`);
    }
}

function inicializarSelectores() {
    const armaSelect = document.getElementById('arma');
    if (armaSelect) {
        armaSelect.innerHTML = '';
        Object.entries(unidadesMilitares).forEach(([categoria, armas]) => {
            Object.keys(armas).forEach(arma => {
                let option = document.createElement('option');
                option.value = `${categoria}|${arma}`;
                option.textContent = arma;
                armaSelect.appendChild(option);
            });
        });
    }
}

function actualizarEtiquetaUnidad(elemento) {
    if (!elemento?.options) return;

    const etiqueta = elemento.options.designacion + (elemento.options.dependencia ? '/' + elemento.options.dependencia : '');

    // Remover etiqueta existente si la hay
    if (elemento.etiquetaPersonalizada) {
        calcoActivo.removeLayer(elemento.etiquetaPersonalizada);
    }

    // Crear nueva etiqueta solo si hay contenido
    if (etiqueta.trim() !== '') {
        const latLng = elemento.getLatLng();
        const desplazamientoX = 0.030; // Ajusta este valor para mover horizontalmente
        const desplazamientoY = -0.020; // Ajusta este valor para mover verticalmente

        elemento.etiquetaPersonalizada = L.marker([latLng.lat + desplazamientoY, latLng.lng + desplazamientoX], {
            icon: L.divIcon({
                className: 'etiqueta-personalizada',
                html: `<div style="color: black; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;">${etiqueta}</div>`,
                iconSize: [100, 20],
                iconAnchor: [0, 20] // Ancla en la esquina inferior izquierda del div
            }),
            interactive: false
        }).addTo(calcoActivo);

        elemento.on('move', function(e) {
            if (elemento.etiquetaPersonalizada) {
                const newLatLng = e.latlng;
                elemento.etiquetaPersonalizada.setLatLng([newLatLng.lat + desplazamientoY, newLatLng.lng + desplazamientoX]);
            }
        });
    } else {
        elemento.etiquetaPersonalizada = null;
    }
}

function actualizarEtiquetaEquipo(elemento) {
    actualizarEtiquetaUnidad(elemento);
}

function guardarCambiosUnidad() {
    if (!elementoSeleccionado) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return;
    }

    const nuevoSidc = obtenerSIDCActual();
    const designacion = document.getElementById('designacion').value;
    const dependencia = document.getElementById('dependencia').value;

    const sym = new ms.Symbol(nuevoSidc, {
        size: 35,
    });

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: sym.asSVG(),
        iconSize: [70, 50],
        iconAnchor: [35, 25]
    });

    elementoSeleccionado.setIcon(icon);
    elementoSeleccionado.options.sidc = nuevoSidc;
    elementoSeleccionado.options.designacion = designacion;
    elementoSeleccionado.options.dependencia = dependencia;

    actualizarEtiquetaUnidad(elementoSeleccionado);

    cerrarPanelEdicion('panelEdicionUnidad');
}

function guardarCambiosEquipo() {
    if (!elementoSeleccionado) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return;
    }

    const nuevoSidc = obtenerSIDCActualEquipo();
    const designacion = document.getElementById('designacionEquipo').value;
    const dependencia = document.getElementById('asignacionEquipo').value;

    const sym = new ms.Symbol(nuevoSidc, {
        size: 35,
    });

    const icon = L.divIcon({
        className: 'custom-div-icon',
        html: sym.asSVG(),
        iconSize: [70, 50],
        iconAnchor: [35, 25]
    });

    elementoSeleccionado.setIcon(icon);
    elementoSeleccionado.options.sidc = nuevoSidc;
    elementoSeleccionado.options.designacion = designacion;
    elementoSeleccionado.options.dependencia = dependencia;

    actualizarEtiquetaEquipo(elementoSeleccionado);

    cerrarPanelEdicion('panelEdicionEquipo');
}

function actualizarPreviewSimboloEquipo() {
    const sidc = obtenerSIDCActualEquipo();
    const sym = new ms.Symbol(sidc, {size: 30});
    const sidcDisplay = document.getElementById('sidcDisplayEquipo');
    if (sidcDisplay) {
        sidcDisplay.innerHTML = sym.asSVG();
    }
}

function obtenerSIDCActualEquipo() {
    if (!elementoSeleccionado?.options?.sidc) return '';
    let sidc = elementoSeleccionado.options.sidc;
    sidc = sidc.substr(0, 1) + document.getElementById('afiliacionEquipo').value + sidc.substr(2);
    return sidc;
}

function mostrarPanelEdicionLinea(elemento) {
    mostrarPanelEdicion('panelEdicionLinea');
    console.log("Mostrando panel de edición de línea");
    var panel = document.getElementById('panelEdicionLinea');
    if (!panel) {
        console.error('Panel de edición de línea no encontrado');
        return;
    }

    panel.style.display = 'block';
    elementoSeleccionado = elemento;

    document.getElementById('nombreLinea').value = elemento.nombre || '';
    document.getElementById('colorLinea').value = elemento.color || '#3388ff';
    document.getElementById('anchoLinea').value = elemento.ancho || 3;
    document.getElementById('tipoLinea').value = elemento.tipo || 'solid';
}

function guardarCambiosLinea() {
    if (!elementoSeleccionado) return;
    
    elementoSeleccionado.options.nombre = document.getElementById('nombreLinea').value;
    elementoSeleccionado.options.color = document.getElementById('colorLinea').value;
    elementoSeleccionado.options.weight = parseInt(document.getElementById('anchoLinea').value);
    elementoSeleccionado.options.dashArray = document.getElementById('tipoLinea').value === 'dashed' ? '5, 5' : null;
    elementoSeleccionado.setStyle(elementoSeleccionado.options);

    if (elementoSeleccionado.textoMarcador) {
        elementoSeleccionado.textoMarcador.setIcon(L.divIcon({
            className: 'texto-linea',
            html: `<div style="color: black;">${elementoSeleccionado.options.nombre}</div>`,
            iconSize: [100, 20]
        }));
    }

    cerrarPanelEdicion('panelEdicionLinea');
}

function actualizarEstiloElemento() {
    if (!elementoSeleccionado) return;

    var color = document.getElementById('colorLinea').value;
    var ancho = parseInt(document.getElementById('anchoLinea').value);
    var tipo = document.getElementById('tipoLinea').value;

    if (elementoSeleccionado instanceof L.Path) {
        elementoSeleccionado.setStyle({
            color: color,
            weight: ancho,
            dashArray: tipo === 'dashed' ? '5, 5' : null
        });
    } else if (elementoSeleccionado.polyline) {
        elementoSeleccionado.polyline.setStyle({
            color: color,
            weight: ancho,
            dashArray: tipo === 'dashed' ? '5, 5' : null
        });
    }

    elementoSeleccionado.color = color;
    elementoSeleccionado.ancho = ancho;
    elementoSeleccionado.tipo = tipo;

    if (elementoSeleccionado.id) {
        actualizarLinea(elementoSeleccionado.id);
    }
}

function mostrarPanelEdicionMCC(elemento, textoAsociado, tipo) {
    console.log("Mostrando panel de edición MCC para tipo:", tipo);
    mostrarPanelEdicion('panelEdicionMCC');
    
    let panel = document.getElementById('panelEdicionMCC');
    if (!panel) {
        console.error('Panel de edición MCC no encontrado');
        return;
    }

    // Obtener el texto actual del elemento
    let textoMCC = elemento.options.nombre || '';
    if (elemento.textoAsociado && elemento.textoAsociado.getIcon) {
        textoMCC = elemento.textoAsociado.getIcon().options.html.replace(/<div[^>]*>(.*?)<\/div>/g, '$1');
    }
    document.getElementById('textoMCC').value = textoMCC;

    // Cargar propiedades actuales
    document.getElementById('colorMCC').value = elemento.options.color || '#000000';
    document.getElementById('anchoMCC').value = elemento.options.weight || 3;
    document.getElementById('tipoLineaMCC').value = elemento.options.dashArray ? 'dashed' : 'solid';

    // Mostrar/ocultar opciones de relleno según el tipo
    if (tipo === 'poligono') {
        document.getElementById('rellenoMCC').style.display = 'block';
        let tipoRelleno = determinarTipoRelleno(elemento);
        document.getElementById('tipoRellenoMCC').value = tipoRelleno;
        document.getElementById('colorRellenoMCC').value = elemento.options.fillColor || '#ffffff';
    } else {
        document.getElementById('rellenoMCC').style.display = 'none';
    }

    document.getElementById('guardarCambiosMCC').onclick = function() {
        guardarCambiosMCC(elemento, tipo);
    };
}

function guardarCambiosMCC(elemento, tipo) {
    let nuevoTexto = document.getElementById('textoMCC').value;
    let nuevoColor = document.getElementById('colorMCC').value;
    let nuevoAncho = parseInt(document.getElementById('anchoMCC').value);
    let nuevoTipoLinea = document.getElementById('tipoLineaMCC').value;

    // Actualizar propiedades del elemento
    elemento.setStyle({
        color: nuevoColor,
        weight: nuevoAncho,
        dashArray: nuevoTipoLinea === 'dashed' ? '5,5' : null
    });

    if (tipo === 'poligono') {
        let nuevoRelleno = document.getElementById('tipoRellenoMCC').value;
        let nuevoColorRelleno = document.getElementById('colorRellenoMCC').value;
        aplicarRelleno(elemento, nuevoRelleno, nuevoColorRelleno);
    }

    // Actualizar el texto
    actualizarTextoElemento(elemento, nuevoTexto, tipo);

    cerrarPanelEdicion('panelEdicionMCC');
    console.log('Cambios MCC guardados');
}

function actualizarTextoElemento(elemento, nuevoTexto, tipo) {
    // Eliminar el texto asociado existente si lo hay
    if (elemento.textoAsociado) {
        calcoActivo.removeLayer(elemento.textoAsociado);
    }

    if (nuevoTexto.trim() !== '') {
        let posicion, draggable, dragConstraint;

        if (tipo === 'poligono' || tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
            let latlngs = elemento.getLatLngs();
            posicion = tipo === 'poligono' ? elemento.getBounds().getCenter() : latlngs[Math.floor(latlngs.length / 2)];
            draggable = true;
            dragConstraint = function(latlng) {
                return elemento.closestLayerPoint(latlng);
            };
        } else {
            posicion = elemento.getLatLng();
            draggable = false;
        }

        elemento.textoAsociado = L.marker(posicion, {
            icon: L.divIcon({
                className: 'texto-elemento',
                html: `<div style="color: black; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;">${nuevoTexto}</div>`,
                iconSize: [100, 40],
                iconAnchor: [50, 20]
            }),
            draggable: draggable
        }).addTo(calcoActivo);

        if (draggable) {
            elemento.textoAsociado.on('drag', function(e) {
                if (dragConstraint) {
                    let closestPoint = dragConstraint(e.latlng);
                    e.target.setLatLng(mapa.layerPointToLatLng(closestPoint));
                }
            });
        }

        // Para todos los tipos, actualizar la posición del texto cuando el elemento se mueve
        elemento.on('move', function() {
            actualizarPosicionTexto(elemento);
        });

        // Para polilíneas y polígonos, actualizar cuando se editan
        if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha' || tipo === 'poligono') {
            elemento.on('edit', function() {
                actualizarPosicionTexto(elemento);
            });
        }
    }

    // Actualizar el nombre del elemento
    elemento.options.nombre = nuevoTexto;
}

function actualizarPosicionTexto(elemento) {
    if (elemento.textoAsociado) {
        let nuevaPosicion;
        if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
            let latlngs = elemento.getLatLngs();
            nuevaPosicion = elemento instanceof L.Polygon ? 
                elemento.getBounds().getCenter() : 
                latlngs[Math.floor(latlngs.length / 2)];
        } else {
            nuevaPosicion = elemento.getLatLng();
        }
        elemento.textoAsociado.setLatLng(nuevaPosicion);
    }
}

function determinarTipoRelleno(elemento) {
    if (elemento.options.fillPattern) {
        if (elemento.options.fillPattern instanceof L.StripePattern) return 'diagonal';
        // Añadir más condiciones para otros tipos de patrones
    }
    return elemento.options.fillOpacity > 0 ? 'solid' : 'none';
}

function obtenerPatronRelleno(tipoRelleno, color) {
    switch(tipoRelleno) {
        case 'diagonal':
            return new L.StripePattern({color: color, weight: 2, spaceWeight: 4, angle: 45});
        // Añadir más casos para otros tipos de patrones
        default:
            return null;
    }
}

function aplicarRelleno(elemento, tipoRelleno, color) {
    switch(tipoRelleno) {
        case 'none':
            elemento.setStyle({fillOpacity: 0, fillPattern: null});
            break;
        case 'solid':
            elemento.setStyle({fillOpacity: 0.2, fillColor: color, fillPattern: null});
            break;
        default:
            let patron = obtenerPatronRelleno(tipoRelleno, color);
            if (patron) {
                patron.addTo(window.mapa);
                elemento.setStyle({fillPattern: patron, fillOpacity: 1});
            }
    }
}

function initializeTabs() {
    var tabs = document.querySelectorAll('.tablinks');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(event) {
            openTab(event, this.getAttribute('data-tab'));
        });
    });
    // Abrir la primera pestaña por defecto
    if (tabs.length > 0) {
        openTab({ currentTarget: tabs[0] }, tabs[0].getAttribute('data-tab'));
    }
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}


// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    inicializarSelectores();

    document.getElementById('arma').addEventListener('change', function() {
        actualizarTipos(this.value);
    });

    document.getElementById('tipo').addEventListener('change', function() {
        actualizarCaracteristicas(document.getElementById('arma').value, this.value);
    });

    ['afiliacion', 'estado', 'arma', 'tipo', 'caracteristica', 'magnitud', 'puestoComando', 'fuerzaTarea', 'reforzado', 'disminuido', 'designacion', 'dependencia'].forEach(function(id) {
        document.getElementById(id).addEventListener('change', actualizarPreviewSimbolo);
    });

    document.getElementById('guardarCambiosUnidad').addEventListener('click', guardarCambiosUnidad);
    document.getElementById('guardarCambiosEquipo').addEventListener('click', guardarCambiosEquipo);
    document.getElementById('guardarCambiosLinea').addEventListener('click', guardarCambiosLinea);

    // Añadir listeners para los botones de cerrar paneles
    ['panelEdicionUnidad', 'panelEdicionEquipo', 'panelEdicionLinea', 'panelEdicionMCC'].forEach(function(panelId) {
        var cerrarBtn = document.getElementById('cerrar' + panelId.charAt(0).toUpperCase() + panelId.slice(1));
        if (cerrarBtn) {
            cerrarBtn.addEventListener('click', function() {
                cerrarPanelEdicion(panelId);
            });
        }
    });
});

function editarElementoSeleccionado() {
    if (!elementoSeleccionado) return;

    if (elementoSeleccionado instanceof L.Marker) {
        if (elementoSeleccionado.options.sidc) {
            if (esEquipo(elementoSeleccionado.options.sidc)) {
                mostrarPanelEdicionEquipo(elementoSeleccionado);
            } else if (esUnidad(elementoSeleccionado.options.sidc)) {
                mostrarPanelEdicionUnidad(elementoSeleccionado);
            } else {
                mostrarPanelEdicionElementoEspecial(elementoSeleccionado);
            }
        } else {
            console.log("Elemento sin SIDC identificado");
        }
    } else if (elementoSeleccionado instanceof L.Polyline || elementoSeleccionado instanceof L.Polygon) {
        mostrarPanelEdicionMCC(elementoSeleccionado, elementoSeleccionado.textoAsociado, determinarTipoMCC(elementoSeleccionado));
    }
}

function determinarTipoMCC(elemento) {
    if (elemento instanceof L.Polygon) return 'poligono';
    if (elemento.options.tipoElemento === 'flechaAncha') return 'flechaAncha';
    if (elemento.options.tipoElemento === 'flecha') return 'flecha';
    return 'linea';
}

function esEquipo(sidc) {
    return sidc.charAt(4) === 'E';
}

function esUnidad(sidc) {
    return sidc.charAt(4) === 'U';
}

// Exportación de funciones para uso en otros archivos
window.mostrarPanelEdicionUnidad = mostrarPanelEdicionUnidad;
window.guardarCambiosUnidad = guardarCambiosUnidad;
window.cerrarPanelEdicion = cerrarPanelEdicion;
window.actualizarPreviewSimbolo = actualizarPreviewSimbolo;
window.mostrarPanelEdicionEquipo = mostrarPanelEdicionEquipo;
window.guardarCambiosEquipo = guardarCambiosEquipo;
window.mostrarPanelEdicionLinea = mostrarPanelEdicionLinea;
window.guardarCambiosLinea = guardarCambiosLinea;
window.actualizarEstiloElemento = actualizarEstiloElemento;
window.mostrarPanelEdicionMCC = mostrarPanelEdicionMCC;
window.guardarCambiosMCC = guardarCambiosMCC;
window.editarElementoSeleccionado = editarElementoSeleccionado;
window.actualizarCampoSIDC = actualizarCampoSIDC;
window.esEquipo = esEquipo;
window.esUnidad = esUnidad;
