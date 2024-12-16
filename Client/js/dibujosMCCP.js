// Variables globales
let elementoMCCActual = null;
var sidc ; 



function ajustarFlechaAncha(flecha) {
    let latlngs = flecha.getLatLngs()[0];
    let puntoInicio = latlngs[0];
    let puntoFin = latlngs[latlngs.length - 1];
    
    let angulo = Math.atan2(puntoFin.lat - puntoInicio.lat, puntoFin.lng - puntoInicio.lng);
    let longitud = puntoInicio.distanceTo(puntoFin);
    
    let anchoFlecha = flecha.options.anchoFlecha || 0.0002; // Ajusta según sea necesario
    
    let puntoIzquierda = L.latLng(
        puntoInicio.lat + Math.sin(angulo - Math.PI/2) * anchoFlecha,
        puntoInicio.lng + Math.cos(angulo - Math.PI/2) * anchoFlecha
    );
    let puntoDerecha = L.latLng(
        puntoInicio.lat + Math.sin(angulo + Math.PI/2) * anchoFlecha,
        puntoInicio.lng + Math.cos(angulo + Math.PI/2) * anchoFlecha
    );
    
    flecha.setLatLngs([puntoIzquierda, puntoFin, puntoDerecha, puntoIzquierda]);
}



function agregarTextoPoligono(poligono, texto) {
    let centro = poligono.getBounds().getCenter();
    return L.marker(centro, {
        icon: L.divIcon({
            className: 'texto-mcc',
            html: `<div>${texto}</div>`,
            iconSize: [100, 40]
        }),
        draggable: true
    }).addTo(calcoActivo);
}

function agregarCuadroTexto(elemento, texto) {
    let posicion = elemento instanceof L.Polyline ? 
        elemento.getLatLngs()[Math.floor(elemento.getLatLngs().length / 2)] :
        elemento.getBounds().getCenter();

    return L.marker(posicion, {
        icon: L.divIcon({
            className: 'texto-mcc',
            html: `<div>${texto}</div>`,
            iconSize: [100, 40]
        }),
        draggable: true
    }).addTo(calcoActivo);
}

function agregarSimbolosSidc(elemento, sidc) {
    let posiciones = elemento.getLatLngs();
    let simbolos = [];

    posiciones.forEach((pos, index) => {
        if (index % 2 === 0) {
            let simbolo = L.marker(pos, {
                icon: L.divIcon({
                    className: 'simbolo-sidc',
                    html: `<div>${sidc}</div>`,
                    iconSize: [30, 30]
                })
            }).addTo(calcoActivo);
            simbolos.push(simbolo);
        }
    });

    return simbolos;
}

function actualizarPosicionTexto(elemento, textoAsociado) {
    if (!elemento || !textoAsociado) return;

    let posicion;
    if (elemento instanceof L.Polyline) {
        let puntos = elemento.getLatLngs();
        if (puntos.length > 0) {
            posicion = puntos[Math.floor(puntos.length / 2)];
        }
    } else if (elemento instanceof L.Polygon) {
        posicion = elemento.getBounds().getCenter();
    } else if (elemento.getLatLng) {
        posicion = elemento.getLatLng();
    }

    if (posicion && posicion.lat && posicion.lng) {
        textoAsociado.setLatLng(posicion);
    } else {
        console.warn('No se pudo determinar la posición para el texto asociado', elemento);
    }
}

function actualizarTextoElemento(elemento, nuevoTexto, tipo) {
    elemento.options.nombre = nuevoTexto;

    if (elemento.textoAsociado) {
        calcoActivo.removeLayer(elemento.textoAsociado);
    }

    if (nuevoTexto.trim() !== '') {
        let posicion;
        let desplazamientoX = 0.030; // Ajusta según sea necesario
        let desplazamientoY = -0.020; // Ajusta según sea necesario

        if (tipo === 'poligono') {
            posicion = elemento.getBounds().getCenter();
        } else if (tipo === 'flecha' || tipo === 'flechaAncha' || tipo === 'linea') {
            let latlngs = elemento.getLatLngs();
            posicion = latlngs[Math.floor(latlngs.length / 2)];
        } else {
            posicion = elemento.getLatLng();
        }

        elemento.textoAsociado = L.marker([posicion.lat + desplazamientoY, posicion.lng + desplazamientoX], {
            icon: L.divIcon({
                className: 'texto-elemento',
                html: `<div style="color: black; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;">${nuevoTexto}</div>`,
                iconSize: [100, 40],
                iconAnchor: [0, 20]
            }),
            interactive: false
        }).addTo(calcoActivo);

        // Actualizar posición del texto cuando el elemento se mueve o el mapa hace zoom
        elemento.on('move', function(e) {
            actualizarPosicionTextoElemento(this);
        });

        mapa.on('zoomend', function() {
            actualizarPosicionTextoElemento(elemento);
        });
    }
}

function actualizarPosicionTextoElemento(elemento) {
    if (!elemento.textoAsociado) return;

    let posicion;
    let desplazamientoX = 0.030; // Ajusta según sea necesario
    let desplazamientoY = -0.020; // Ajusta según sea necesario

    if (elemento instanceof L.Polygon) {
        posicion = elemento.getBounds().getCenter();
    } else if (elemento instanceof L.Polyline) {
        let latlngs = elemento.getLatLngs();
        posicion = latlngs[Math.floor(latlngs.length / 2)];
    } else {
        posicion = elemento.getLatLng();
    }

    elemento.textoAsociado.setLatLng([posicion.lat + desplazamientoY, posicion.lng + desplazamientoX]);
}

function crearPoligono(puntos) {
    let nuevoPoligono = L.polygon(puntos, {
        color: 'blue',
        weight: 2,
        fillColor: '#3388ff',
        fillOpacity: 0.2
    }).addTo(calcoActivo);
    nuevoPoligono.options.tipoElemento = 'poligono';
    nuevoPoligono.options.nombre = 'Nuevo Polígono'; // Nombre por defecto
    actualizarTextoElemento(nuevoPoligono, nuevoPoligono.options.nombre, 'poligono');
    habilitarDobleClicEnElementos();
    return nuevoPoligono;
}



function dibujarFlechaAncha(sidc, texto) {
    let puntos = [];
    let flechaAncha;

    mapa.on('click', agregarPunto);
    mapa.once('dblclick', finalizarFlechaAncha);

    function agregarPunto(e) {
        puntos.push(e.latlng);
        if (!flechaAncha) {
            flechaAncha = L.polygon([], {color: 'red', fillColor: 'red', fillOpacity: 0.2}).addTo(calcoActivo);
            flechaAncha.options.tipoElemento = 'flechaAncha';
        }
        actualizarFlechaAncha(flechaAncha, puntos);
    }

    function finalizarFlechaAncha(e) {
        mapa.off('click', agregarPunto);
        mapa.off('dblclick', finalizarFlechaAncha);
        flechaAncha.options.sidc = sidc;
        flechaAncha.options.nombre = texto || 'Nueva Flecha Ancha';
        actualizarTextoElemento(flechaAncha, flechaAncha.options.nombre, 'flechaAncha');
        hacerEditable(flechaAncha);
        habilitarDobleClicEnElementos();
    }
}

function dibujarFlecha(sidc, texto) {
    let puntos = [];
    let flecha;

    mapa.on('click', agregarPunto);
    mapa.once('dblclick', finalizarFlecha);

    function agregarPunto(e) {
        puntos.push(e.latlng);
        if (!flecha) {
            flecha = L.polyline(puntos, {color: 'red'}).addTo(calcoActivo);
        } else {
            flecha.setLatLngs(puntos);
        }
    }

    function finalizarFlecha(e) {
        mapa.off('click', agregarPunto);
        mapa.off('dblclick', finalizarFlecha);
        let puntaFlecha = crearPuntaFlecha(puntos[puntos.length - 2], puntos[puntos.length - 1]);
        flecha.setLatLngs([...puntos, ...puntaFlecha]);
        flecha.options.tipoElemento = 'flecha';
        flecha.options.sidc = sidc;
        flecha.options.nombre = texto;
        actualizarTextoElemento(flecha, texto, 'flecha');
        hacerEditable(flecha);
        habilitarDobleClicEnElementos();
    }
}
// Asegúrate de que estas funciones estén disponibles globalmente

function hacerEditable(elemento, tipo) {
    if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        if (!elemento.editing) {
            elemento.editing = new L.Edit.Poly(elemento);
        }
        elemento.editing.enable();
        
        // Eliminar marcadores de vértice existentes si los hay
        if (elemento.vertexMarkers) {
            elemento.vertexMarkers.forEach(marker => calcoActivo.removeLayer(marker));
        }
        
        // Crear nuevos marcadores de vértice
        elemento.vertexMarkers = [];
        let latlngs = elemento.getLatLngs();
        if (latlngs[0] instanceof Array) latlngs = latlngs[0]; // Para polígonos
        
        latlngs.forEach((latlng, index) => {
            let marker = L.marker(latlng, {
                draggable: true,
                icon: L.divIcon({className: 'vertex-marker', iconSize: [8, 8]})
            }).addTo(calcoActivo);
            
            marker.on('drag', function(e) {
                let newLatLngs = elemento.getLatLngs();
                if (newLatLngs[0] instanceof Array) {
                    newLatLngs[0][index] = e.target.getLatLng();
                } else {
                    newLatLngs[index] = e.target.getLatLng();
                }
                elemento.setLatLngs(newLatLngs);
                
                if (tipo === 'flechaAncha') {
                    actualizarFlechaAncha(elemento, newLatLngs[0] || newLatLngs, true);
                }
                
                if (elemento.textoAsociado) {
                    actualizarPosicionTexto(elemento, elemento.textoAsociado);
                }
                
                // Actualizar medición si es una línea de medición
                if (elemento.options.distancia) {
                    elemento.options.distancia = calcularDistancia(elemento);
                    document.getElementById('medicionDistancia').textContent = `Distancia: ${elemento.options.distancia.toFixed(2)} metros`;
                }
            });
            
            elemento.vertexMarkers.push(marker);
        });
    } else if (elemento instanceof L.Marker) {
        elemento.dragging.enable();
    }

    elemento.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        seleccionarElemento(elemento);
    });

    if (elemento.textoAsociado && elemento.textoAsociado.dragging) {
        elemento.textoAsociado.dragging.enable();
    }
}

function crearFlecha(puntos) {
    let nuevaFlecha = L.polyline(puntos, {
        color: 'red',
        weight: 3
    }).addTo(calcoActivo);
    nuevaFlecha.options.tipoElemento = 'flecha';
    nuevaFlecha.options.nombre = 'Nueva Flecha'; // Nombre por defecto
    actualizarTextoElemento(nuevaFlecha, nuevaFlecha.options.nombre, 'flecha');
    habilitarDobleClicEnElementos();
    return nuevaFlecha;
}

function crearFlechaAncha(puntos) {
    let nuevaFlechaAncha = L.polygon(puntos, {
        color: 'red',
        weight: 2,
        fill: true,
        fillColor: 'red',
        fillOpacity: 0.2
    }).addTo(calcoActivo);
    nuevaFlechaAncha.options.tipoElemento = 'flechaAncha';
    nuevaFlechaAncha.options.nombre = 'Nueva Flecha Ancha'; // Nombre por defecto
    actualizarTextoElemento(nuevaFlechaAncha, nuevaFlechaAncha.options.nombre, 'flechaAncha');
    habilitarDobleClicEnElementos();
    return nuevaFlechaAncha;
}


window.hacerEditable = hacerEditable;
window.crearFlechaAncha = crearFlechaAncha;
window.crearFlecha= crearFlecha;
window.dibujarFlechaAncha = dibujarFlechaAncha;
