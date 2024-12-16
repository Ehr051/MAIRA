// herramientas.js
// Este archivo contiene funciones para herramientas de medición, búsqueda y manipulación del mapa

// Variables globales
var measuringDistance = false;
var distancePolyline;
var lineaActual = null;
var lineas = {};
var perfilElevacionDisplay = null;
var lineaSeleccionada = null;
let puntos = [];
var punto = null;
var calcoActivo;

function actualizarLinea(id) {
    const linea = lineas[id];
    if (linea) {
        // Actualizar geometría
        if (linea.marcadores) {
            const latlngs = linea.marcadores.map(m => m.getLatLng());
            linea.polyline.setLatLngs(latlngs);
        }
        
        // Actualizar estilo
        linea.polyline.setStyle({
            color: linea.color,
            weight: linea.ancho,
            dashArray: linea.tipo === 'dashed' ? '5, 5' : null
        });
        
        // Calcular y actualizar distancia
        const distancia = calcularDistancia(linea.polyline);
        linea.distancia = distancia;
        
        // Actualizar display de medición si está visible
        const medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay && medicionDisplay.style.display !== 'none') {
            medicionDisplay.textContent = `Distancia: ${distancia.toFixed(2)} metros`;
        }
    }
}

function calcularDistancia(puntos) {
    // Si es una polyline, obtener sus puntos
    if (puntos instanceof L.Polyline) {
        puntos = puntos.getLatLngs();
    }

    // Si no es array o no tiene puntos suficientes, retornar 0
    if (!Array.isArray(puntos) || puntos.length < 2) {
        return 0;
    }

    let distanciaTotal = 0;
    for (let i = 1; i < puntos.length; i++) {
        distanciaTotal += L.latLng(puntos[i-1]).distanceTo(L.latLng(puntos[i]));
    }
    return distanciaTotal;
}

function crearLinea() {
    var id = "linea_" + Date.now();
    var nuevaLinea = L.polyline([], {
        color: 'red',
        weight: 3,
        nombre: 'Línea de medición'
    }).addTo(calcoActivo);
  
    lineas[id] = {
        id: id,
        polyline: nuevaLinea,
        marcadores: [],
        nombre: "Línea " + (Object.keys(lineas).length + 1),
        color: 'red',
        ancho: 3,
        tipo: 'solid'
    };
  
    nuevaLinea.on('click', function() { seleccionarElemento(this); });
    nuevaLinea.on('dblclick', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        mostrarMenuContextual(e);
    });
    nuevaLinea.on('contextmenu', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        mostrarMenuContextual(e);
    });
    
    nuevaLinea.editing.enable();
    
    nuevaLinea.on('edit', function() {
        actualizarMedicion(id);
    });
    
    return id;
}

function actualizarMedicion(id) {
    const linea = lineas[id];
    if (linea && linea.polyline) {
        const distancia = calcularDistancia(linea.polyline);
        linea.distancia = distancia;
        const medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay) {
            medicionDisplay.textContent = `Distancia: ${distancia.toFixed(2)} metros`;
        }
    }
}

// Función para detener la medición
function stopMeasuring() {
    console.log("Deteniendo medición de distancia");
    measuringDistance = false;
    mapa.off('click', addDistancePoint);
    mapa.off('dblclick', stopMeasuring);
    if (lineaActual) {
        ocultarMarcadores(lineaActual);
        lineaActual = null;
    }
}


// Funciones auxiliares para manejar marcadores y líneas
function mostrarMarcadores(id) {
    if (lineas[id] && lineas[id].marcadores) {
        lineas[id].marcadores.forEach(function(marker) {
            marker.getElement().style.display = '';
        });
    }
}

function ocultarMarcadores(id) {
    if (lineas[id] && lineas[id].marcadores) {
        lineas[id].marcadores.forEach(function(marker) {
            marker.getElement().style.display = 'none';
        });
    }
}

function resaltarLinea(id) {
    if (lineas[id] && lineas[id].polyline) {
        lineas[id].polyline.setStyle({weight: lineas[id].ancho + 1});
    }
}

function desresaltarLinea(id) {
    if (lineas[id] && lineas[id].polyline) {
        lineas[id].polyline.setStyle({weight: lineas[id].ancho});
    }
}

// Función para actualizar la polyline cuando se arrastran los marcadores
function actualizarPolyline(id) {
    if (lineas[id] && lineas[id].polyline && lineas[id].marcadores) {
        var nuevosLatLngs = lineas[id].marcadores.map(function(marker) {
            return marker.getLatLng();
        });
        lineas[id].polyline.setLatLngs(nuevosLatLngs);
    }
}

// Función para actualizar la distancia mostrada
function updateDistanceDisplay(id) {
    if (lineas[id] && lineas[id].polyline) {
        var distancia = calcularDistancia(lineas[id].polyline);
        document.getElementById('medicionDistancia').textContent = "Distancia: " + distancia.toFixed(2) + " metros";
    }
}



// Función para inicializar la búsqueda de lugar
function initializeBuscarLugar() {
    console.log('Iniciando inicialización de buscarLugar');
    var busquedaLugarInput = document.getElementById('busquedaLugar');
    var btnBuscarLugar = document.getElementById('btnBuscarLugar');
    var resultadosBusquedaLugar = document.getElementById('resultadosBusquedaLugar');

    if (!busquedaLugarInput || !btnBuscarLugar || !resultadosBusquedaLugar || !mapa) {
        console.error('No se pueden inicializar los elementos de búsqueda o el mapa');
        return;
    }

    console.log('Todos los elementos necesarios encontrados, continuando con la inicialización');

    var geocoder = L.Control.Geocoder.nominatim();

    function handleSearch() {
        var busqueda = busquedaLugarInput.value.trim();
        if (busqueda.length === 0) return;

        console.log('Realizando búsqueda para:', busqueda);
        geocoder.geocode(busqueda, function(results) {
            console.log('Resultados de búsqueda:', results);
            resultadosBusquedaLugar.innerHTML = '';
            if (results.length > 0) {
                results.forEach(function(result) {
                    var li = document.createElement('li');
                    li.textContent = result.name;
                    li.addEventListener('click', function() {
                        mapa.setView(result.center, 13);
                        console.log('Mapa centrado en:', result.center);
                        busquedaLugarInput.value = '';
                        resultadosBusquedaLugar.innerHTML = '';
                    });
                    resultadosBusquedaLugar.appendChild(li);
                });
            } else {
                resultadosBusquedaLugar.innerHTML = '<li>No se encontraron resultados</li>';
            }
        });
    }

    busquedaLugarInput.addEventListener('input', function() {
        if (busquedaLugarInput.value.trim().length > 2) {
            handleSearch();
        } else {
            resultadosBusquedaLugar.innerHTML = '';
        }
    });

    btnBuscarLugar.addEventListener('click', handleSearch);
    
    busquedaLugarInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    console.log('Función buscarLugar inicializada correctamente');
}

// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando herramientas del mapa");
    initializeBuscarLugar();
    
    var btnMedirDistancia = document.getElementById('btnMedirDistancia');
    if (btnMedirDistancia) {
        btnMedirDistancia.addEventListener('click', medirDistancia);
    } else {
        console.warn("Botón de medir distancia no encontrado");
    }

    var perfilElevacionBtn = document.getElementById('PerfilElevacionBtn');
    if (perfilElevacionBtn) {
    perfilElevacionBtn.addEventListener('click', mostrarPerfilElevacion);
    } else {
    console.warn("Botón de perfil de elevación no encontrado");
    }
});

function actualizarLinea(id) {
    const linea = lineas[id];
        if (lineas[id]) {
        linea.polyline.setStyle({
            color: linea.color,
            weight: linea.ancho,
            dashArray: linea.tipo === 'dashed' ? '5, 5' : null
        });
    }
}

function medirDistancia() {
    console.log("Iniciando medición de distancia");
    if (measuringDistance) {
        finalizarMedicion();
    } else {
        measuringDistance = true;
        mapa.getContainer().style.cursor = 'crosshair';
        lineaActual = crearLinea();
        mapa.on('click', addDistancePoint);
        mapa.on('mousemove', actualizarDistanciaProvisional);
        mapa.once('dblclick', finalizarMedicion);
        
        // Mostrar el display de medición con un mensaje inicial
        let medicionDisplay = document.getElementById('medicionDistancia');
        medicionDisplay.innerHTML = `
            <span>Haga clic para comenzar la medición</span>
            <button onclick="finalizarMedicion()" style="float: right;">X</button>
        `;
        medicionDisplay.style.display = 'block';
    }
}

function addDistancePoint(e) {
    if (!lineaActual) return;
    const latlng = e.latlng;
    lineas[lineaActual].polyline.addLatLng(latlng);
    
    const marker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({className: 'vertex-marker', iconSize: [4, 4]})
    }).addTo(calcoActivo);
    
    marker.on('drag', function() {
        actualizarLinea(lineaActual);
    });
    
    lineas[lineaActual].marcadores.push(marker);
    actualizarLinea(lineaActual);
    actualizarMedicion(lineaActual);

    // Asegurarse de que el display de medición permanezca visible
    document.getElementById('medicionDistancia').style.display = 'block';
}

function actualizarDistanciaProvisional(e) {
    if (measuringDistance && lineaActual) {
        const latlngs = lineas[lineaActual].polyline.getLatLngs();
        if (latlngs.length > 0) {
            const distanciaProvisional = calcularDistancia(L.polyline([...latlngs, e.latlng]));
            document.getElementById('medicionDistancia').innerHTML = `
                <span>Distancia: ${distanciaProvisional.toFixed(2)} metros</span>
                <button onclick="finalizarMedicion()" style="float: right;">X</button>
            `;
            // Asegurarse de que el display de medición permanezca visible
            document.getElementById('medicionDistancia').style.display = 'block';
        }
    }
}

function finalizarMedicion(e) {
    if (e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
    }

    measuringDistance = false;
    mapa.getContainer().style.cursor = '';
    mapa.off('click', addDistancePoint);
    mapa.off('mousemove', actualizarDistanciaProvisional);
    mapa.off('dblclick', finalizarMedicion);
    
    if (lineaActual) {
        let linea = lineas[lineaActual];
        if (linea) {
            linea.distancia = calcularDistancia(linea.polyline);
            // Actualizar el nombre de la línea con la distancia
            linea.nombre = `Medición: ${linea.distancia.toFixed(2)}m`;
            linea.polyline.options.nombre = linea.nombre;
            linea.polyline.options.tipoElemento = 'lineaMedicion';
            
            if (linea.polyline) {
                seleccionarElemento(linea.polyline);
            }
        }
        
        let medicionDisplay = document.getElementById('medicionDistancia');
        if (medicionDisplay) {
            medicionDisplay.innerHTML = `
                <span>Distancia final: ${linea ? linea.distancia.toFixed(2) : 0} metros</span>
                <button onclick="cerrarMedicion()" style="float: right;">X</button>
            `;
            medicionDisplay.style.display = 'block';
        }
    }
    
    lineaActual = null;
    actualizarElementosCalco();
}

// Nueva función para mostrar perfil de elevación
async function mostrarPerfilElevacion() {
    // Verificaciones iniciales
    if (window.CalculoMarcha?.estado?.panelAbierto) {
        console.log('Usando display de cálculo de marcha');
        return;
    }

    if (!window.elementoSeleccionado || !(window.elementoSeleccionado instanceof L.Polyline)) {
        alert("Debe seleccionar una línea para ver su perfil de elevación");
        return;
    }

    // Obtener el contenedor y el display-content
    const perfilContainer = document.getElementById('perfilElevacionDisplay');
    const displayContent = perfilContainer.querySelector('.display-content');
    
    // Mostrar el panel y su contenido
    perfilContainer.style.display = 'block';
    displayContent.style.display = 'block';
    displayContent.innerHTML = '';

    // Crear estructura base
    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container';
    displayContent.appendChild(svgContainer);

    // Configurar dimensiones y proporciones
    const aspectRatio = 3; // Relación ancho/alto para mantener proporciones realistas
    const calculateDimensions = (container) => {
        const width = container.clientWidth;
        const height = width / aspectRatio;
        return { width, height };
    };

    // Obtener dimensiones iniciales
    let { width, height } = calculateDimensions(svgContainer);

    // Variables para selección y zoom
    let selectionStart = null;
    let isSelecting = false;
    let originalBounds = null;

    // Obtener los puntos del elemento
    const puntos = window.elementoSeleccionado.getLatLngs();
    const puntosInterpolados = interpolarPuntosRuta(puntos);

    if (!puntosInterpolados || puntosInterpolados.length < 2) {
        alert("No hay suficientes puntos para crear el perfil de elevación");
        return;
    }

    // Mostrar indicador de carga
    svgContainer.innerHTML = '<div class="loading">Calculando perfil de elevación...</div>';

    // Crear marcador de posición
    const positionMarker = L.circleMarker([0, 0], {
        radius: 5,
        color: '#ff0000',
        fillColor: '#ff0000',
        fillOpacity: 1,
        weight: 2
    }).addTo(mapa);
    positionMarker.setStyle({ opacity: 0 });

    try {
        // Obtener elevaciones y procesar datos
        const perfilDatos = await Promise.all(
            puntosInterpolados.map(async (punto, index) => {
                const elevacion = await window.elevationHandler.obtenerElevacion(punto.lat, punto.lng);
                return {
                    lat: punto.lat,
                    lng: punto.lng,
                    elevation: elevacion,
                    distance: index === 0 ? 0 : L.latLng(puntosInterpolados[index - 1]).distanceTo(L.latLng(punto))
                };
            })
        );

        // Calcular distancias acumuladas y pendientes
        let distanciaAcumulada = 0;
        const datosProcessed = perfilDatos.map((d, i, arr) => {
            distanciaAcumulada += d.distance;
            let pendiente = 0;
            if (i > 0) {
                const distanciaSegmento = d.distance;
                const elevacionDif = d.elevation - arr[i-1].elevation;
                pendiente = (distanciaSegmento > 0) ? (elevacionDif / distanciaSegmento) * 100 : 0;
            }
            return { 
                ...d, 
                distanciaAcumulada,
                pendiente 
            };
        });

        // Calcular estadísticas
        const stats = {
            min: d3.min(datosProcessed, d => d.elevation),
            max: d3.max(datosProcessed, d => d.elevation),
            promedio: d3.mean(datosProcessed, d => d.elevation),
            distanciaTotal: distanciaAcumulada,
            desnivel: 0,
            pendienteMax: d3.max(datosProcessed, d => Math.abs(d.pendiente)),
            pendienteMin: d3.min(datosProcessed, d => d.pendiente)
        };
        stats.desnivel = stats.max - stats.min;

        // Crear SVG con viewBox
        const svg = d3.select(svgContainer)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Configurar márgenes y área de dibujo
        const margin = { top: 20, right: 30, bottom: 30, left: 50 };
        const effectiveWidth = width - margin.left - margin.right;
        const effectiveHeight = height - margin.top - margin.bottom;

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calcular rango vertical ajustado
        const rangoElevacion = stats.max - stats.min;
        const rangoVerticalAjustado = rangoElevacion * 1.2;
        const elevacionMinAjustada = stats.min - (rangoElevacion * 0.1);
        const elevacionMaxAjustada = stats.min + rangoVerticalAjustado;

        // Crear escalas
        const x = d3.scaleLinear()
            .domain([0, distanciaAcumulada])
            .range([0, effectiveWidth]);

        const y = d3.scaleLinear()
            .domain([elevacionMinAjustada, elevacionMaxAjustada])
            .range([effectiveHeight, 0]);

        // Crear ejes
        const xAxis = d3.axisBottom(x)
            .ticks(10)
            .tickFormat(d => `${(d/1000).toFixed(1)}km`);

        const yAxis = d3.axisLeft(y)
            .ticks(10)
            .tickFormat(d => `${d.toFixed(0)}m`);

        // Agregar ejes al gráfico
        g.append('g')
            .attr('class', 'axis axis-x')
            .attr('transform', `translate(0,${effectiveHeight})`)
            .call(xAxis);

        g.append('g')
            .attr('class', 'axis axis-y')
            .call(yAxis);

        // Crear área y línea
        const area = d3.area()
            .x(d => x(d.distanciaAcumulada))
            .y0(effectiveHeight)
            .y1(d => y(d.elevation))
            .curve(d3.curveMonotoneX);

        const line = d3.line()
            .x(d => x(d.distanciaAcumulada))
            .y(d => y(d.elevation))
            .curve(d3.curveMonotoneX);

        // Dibujar área y línea
        g.append('path')
            .datum(datosProcessed)
            .attr('class', 'elevation-area')
            .attr('d', area);

        g.append('path')
            .datum(datosProcessed)
            .attr('class', 'elevation-line')
            .attr('d', line);

        // Agregar elementos interactivos
        const horizontalGuide = g.append('line')
            .attr('class', 'mouse-guide-horizontal')
            .style('opacity', 0);

        const verticalGuide = g.append('line')
            .attr('class', 'mouse-guide-vertical')
            .style('opacity', 0);

        const focusCircle = g.append('circle')
            .attr('class', 'selection-marker')
            .attr('r', 4)
            .style('opacity', 0);

        // Elemento de selección
        const selectionRect = g.append('rect')
            .attr('class', 'selection-area')
            .style('display', 'none');

        // Tooltips
        const tooltip = d3.select(svgContainer)
            .append('div')
            .attr('class', 'elevation-tooltip')
            .style('opacity', 0);

        const selectionInfo = d3.select(svgContainer)
            .append('div')
            .attr('class', 'selection-info')
            .style('display', 'none');

        // Área de interacción del mouse
        const mouseArea = g.append('rect')
            .attr('width', effectiveWidth)
            .attr('height', effectiveHeight)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        // Función para actualizar dimensiones
        const updateDimensions = () => {
            const container = svgContainer.getBoundingClientRect();
            const newWidth = container.width;
            const newHeight = Math.max(newWidth / aspectRatio, 100);

            const newEffectiveWidth = newWidth - margin.left - margin.right;
            const newEffectiveHeight = newHeight - margin.top - margin.bottom;

            svg
                .attr('width', newWidth)
                .attr('height', newHeight)
                .attr('viewBox', `0 0 ${newWidth} ${newHeight}`);

            x.range([0, newEffectiveWidth]);
            y.range([newEffectiveHeight, 0]);

            g.select('.axis-x')
                .attr('transform', `translate(0,${newEffectiveHeight})`)
                .call(xAxis);

            g.select('.axis-y')
                .call(yAxis);

            const updatedArea = d3.area()
                .x(d => x(d.distanciaAcumulada))
                .y0(newEffectiveHeight)
                .y1(d => y(d.elevation))
                .curve(d3.curveMonotoneX);

            const updatedLine = d3.line()
                .x(d => x(d.distanciaAcumulada))
                .y(d => y(d.elevation))
                .curve(d3.curveMonotoneX);

            g.select('.elevation-area')
                .attr('d', updatedArea(datosProcessed));
            g.select('.elevation-line')
                .attr('d', updatedLine(datosProcessed));

            mouseArea
                .attr('width', newEffectiveWidth)
                .attr('height', newEffectiveHeight);

            verticalGuide.attr('y2', newEffectiveHeight);
            selectionRect.attr('height', newEffectiveHeight);
        };

        // Interacciones del mouse
        mouseArea
            .on('mousedown', function(event) {
                const [mouseX, mouseY] = d3.pointer(event);
                isSelecting = true;
                selectionStart = mouseX;
                
                selectionRect
                    .attr('x', mouseX)
                    .attr('y', 0)
                    .attr('width', 0)
                    .attr('height', effectiveHeight)
                    .style('display', null);
                
                event.preventDefault();
            })
            .on('mousemove', function(event) {
                const [mouseX, mouseY] = d3.pointer(event);
                
                horizontalGuide
                    .style('opacity', 1)
                    .attr('x1', 0)
                    .attr('x2', mouseX)
                    .attr('y1', mouseY)
                    .attr('y2', mouseY);

                verticalGuide
                    .style('opacity', 1)
                    .attr('x1', mouseX)
                    .attr('x2', mouseX)
                    .attr('y1', 0)
                    .attr('y2', effectiveHeight);

                if (isSelecting) {
                    const currentX = mouseX;
                    const width = Math.abs(currentX - selectionStart);
                    const xPos = Math.min(currentX, selectionStart);
                    
                    selectionRect
                        .attr('x', xPos)
                        .attr('width', width);

                    const x0 = x.invert(Math.min(selectionStart, currentX));
                    const x1 = x.invert(Math.max(selectionStart, currentX));
                    
                    const seleccionDatos = datosProcessed.filter(d => 
                        d.distanciaAcumulada >= x0 && d.distanciaAcumulada <= x1
                    );

                    if (seleccionDatos.length > 0) {
                        const elevacionMin = d3.min(seleccionDatos, d => d.elevation);
                        const elevacionMax = d3.max(seleccionDatos, d => d.elevation);
                        const distanciaSeleccion = x1 - x0;
                        const desnivel = elevacionMax - elevacionMin;
                        const pendienteMedia = (desnivel / distanciaSeleccion) * 100;

                        selectionInfo
                            .style('display', 'block')
                            .html(`
                                <strong>Selección:</strong><br>
                                Distancia: ${(distanciaSeleccion/1000).toFixed(2)} km<br>
                                Desnivel: ${desnivel.toFixed(1)} m<br>
                                Pendiente media: ${pendienteMedia.toFixed(1)}%<br>
                                Elevación min: ${elevacionMin.toFixed(1)} m<br>
                                Elevación max: ${elevacionMax.toFixed(1)} m
                            `);
                    }
                }
                
                const x0 = x.invert(mouseX);
                const bisect = d3.bisector(d => d.distanciaAcumulada).left;
                const index = bisect(datosProcessed, x0);
                const d0 = datosProcessed[index - 1];
                const d1 = datosProcessed[index];
                const d = x0 - d0?.distanciaAcumulada > d1?.distanciaAcumulada - x0 ? d1 : d0;

                if (d) {
                    focusCircle
                        .style('opacity', 1)
                        .attr('cx', x(d.distanciaAcumulada))
                        .attr('cy', y(d.elevation));

                    positionMarker.setLatLng([d.lat, d.lng]);
                    positionMarker.setStyle({ opacity: 1 });

                    tooltip
                        .style('opacity', 1)
                        .html(`
                            Distancia: ${(d.distanciaAcumulada/1000).toFixed(2)} km<br>
                            Elevación: ${d.elevation.toFixed(0)} m<br>
                            Pendiente: ${d.pendiente.toFixed(1)}%
                        `)
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 28}px`);
                }
            })
            .on('mouseup', function() {
                isSelecting = false;
            })
            .on('mouseleave', function() {
                horizontalGuide.style('opacity', 0);
                verticalGuide.style('opacity', 0);
                focusCircle.style('opacity', 0);
                tooltip.style('opacity', 0);
                positionMarker.setStyle({ opacity: 0 });
                
                if (!isSelecting) {
                    selectionRect.style('display', 'none');
                    selectionInfo.style('display', 'none');
                }
            });

        // Observar cambios de tamaño
        const resizeObserver = new ResizeObserver(() => {
            if (perfilContainer.classList.contains('fullscreen')) {
                requestAnimationFrame(updateDimensions);
            }
        });

        resizeObserver.observe(svgContainer);

        // Escuchar cambios de fullscreen
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === perfilContainer) {
                requestAnimationFrame(updateDimensions);
            }
        });

        // Agregar panel de estadísticas
        const statsDiv = document.createElement('div');
        statsDiv.className = 'elevation-stats';
        statsDiv.innerHTML = `
            <div class="stats-group">
                <div>Min: ${stats.min.toFixed(0)}m</div>
                <div>Max: ${stats.max.toFixed(0)}m</div>
                <div>Promedio: ${stats.promedio.toFixed(0)}m</div>
                <div>Distancia: ${(stats.distanciaTotal/1000).toFixed(2)}km</div>
                <div>Desnivel: ${stats.desnivel.toFixed(0)}m</div>
                <div>Pendiente máx: ${Math.abs(stats.pendienteMax).toFixed(1)}%</div>
            </div>
        `;
        displayContent.appendChild(statsDiv);

    } catch (error) {
        console.error("Error al crear perfil de elevación:", error);
        svgContainer.innerHTML = `<div class="error-message">Error al crear el perfil de elevación: ${error.message}</div>`;
        if (positionMarker) {
            mapa.removeLayer(positionMarker);
        }
    } finally {
        const loading = svgContainer.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
}

function interpolarPuntosRuta(puntos) {
    if (!puntos || puntos.length < 2) return [];
    
    // Calcular distancia total
    let distanciaTotal = 0;
    for (let i = 0; i < puntos.length - 1; i++) {
        distanciaTotal += L.latLng(puntos[i]).distanceTo(L.latLng(puntos[i + 1]));
    }

    // Determinar el número de segmentos basado en la distancia
    let segmentosPorTramo;
    if (distanciaTotal < 500) { // Menos de 500m
        segmentosPorTramo = 50; // Un punto cada 10m aproximadamente
    } else if (distanciaTotal < 2000) { // Menos de 2km
        segmentosPorTramo = 40; // Un punto cada 50m aproximadamente
    } else if (distanciaTotal < 5000) { // Menos de 5km
        segmentosPorTramo = 10; // Un punto cada 167m aproximadamente
    } else {
        segmentosPorTramo = 20; // Un punto cada 250m o más
    }

    const puntosInterpolados = [];
    
    for (let i = 0; i < puntos.length - 1; i++) {
        const inicio = puntos[i];
        const fin = puntos[i + 1];
        const distanciaTramo = L.latLng(inicio).distanceTo(L.latLng(fin));
        
        // Ajustar segmentos proporcionalmente a la distancia del tramo
        const segmentosTramo = Math.max(
            5, // Mínimo 5 puntos por tramo
            Math.round(segmentosPorTramo * (distanciaTramo / distanciaTotal))
        );

        for (let j = 0; j <= segmentosTramo; j++) {
            const fraccion = j / segmentosTramo;
            const lat = inicio.lat + (fin.lat - inicio.lat) * fraccion;
            const lng = inicio.lng + (fin.lng - inicio.lng) * fraccion;
            puntosInterpolados.push({ lat, lng });
        }
    }

    return puntosInterpolados;
}

// Funciones auxiliares necesarias
function mostrarCargando() {
    const perfilContainer = document.getElementById('perfilElevacionDisplay');
    if (perfilContainer) {
        perfilContainer.innerHTML = '<div class="loading">Calculando perfil de elevación...</div>';
        perfilContainer.style.display = 'block';
    }
}

function ocultarCargando() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}

function interpolarPuntos(puntos) {
    if (!puntos || puntos.length < 2) return [];
    
    let puntosInterpolados = [];
    for (let i = 0; i < puntos.length - 1; i++) {
        const inicio = puntos[i];
        const fin = puntos[i + 1];
        const cantidad = 10; // Ajusta la cantidad de puntos según precisión deseada

        for (let j = 0; j <= cantidad; j++) {
            let lat = inicio.lat + (fin.lat - inicio.lat) * (j / cantidad);
            let lng = inicio.lng + (fin.lng - inicio.lng) * (j / cantidad);
            puntosInterpolados.push({lat, lng});
        }
    }
    return puntosInterpolados;
}

function calcularEstadisticas(elevationData) {
    const elevaciones = elevationData.map(d => d.elevation);
    const distanciaTotal = elevationData[elevationData.length - 1].distancia;
    
    return {
        min: Math.min(...elevaciones),
        max: Math.max(...elevaciones),
        promedio: elevaciones.reduce((a, b) => a + b, 0) / elevaciones.length,
        distanciaTotal: distanciaTotal,
        desnivel: Math.max(...elevaciones) - Math.min(...elevaciones)
    };
}

async function procesarDatosElevacion(puntosInterpolados) {
    try {
        // Preparar datos para el worker
        const datos = {
            type: 'PROCESS_ELEVATION_DATA',
            data: {
                puntos: puntosInterpolados.map(punto => ({
                    lat: punto.lat,
                    lng: punto.lng
                }))
            }
        };

        // Procesar usando el worker
        const resultados = await new Promise((resolve, reject) => {
            const worker = new Worker('elevation.worker.js');
            worker.postMessage(datos);

            worker.onmessage = (event) => {
                if (event.data.type === 'ELEVATION_RESULT') {
                    resolve(event.data.data);
                }
                worker.terminate();
            };

            worker.onerror = (error) => {
                reject(error);
                worker.terminate();
            };
        });

        // Procesar y estructurar los resultados
        let distanciaAcumulada = 0;
        const datosElevacion = resultados.map((resultado, index) => {
            if (index > 0) {
                const puntoActual = puntosInterpolados[index];
                const puntoAnterior = puntosInterpolados[index - 1];
                const distanciaParcial = L.latLng(puntoAnterior.lat, puntoAnterior.lng)
                    .distanceTo(L.latLng(puntoActual.lat, puntoActual.lng));
                distanciaAcumulada += distanciaParcial;
            }

            return {
                distancia: distanciaAcumulada,
                elevation: resultado.elevation,
                lat: puntosInterpolados[index].lat,
                lng: puntosInterpolados[index].lng
            };
        });

        // Calcular pendientes
        datosElevacion.forEach((dato, index) => {
            if (index > 0) {
                const anterior = datosElevacion[index - 1];
                const distanciaParcial = dato.distancia - anterior.distancia;
                const elevacionParcial = dato.elevation - anterior.elevation;
                dato.pendiente = distanciaParcial !== 0 ? (elevacionParcial / distanciaParcial) * 100 : 0;
            } else {
                dato.pendiente = 0;
            }
        });

        return datosElevacion;
    } catch (error) {
        console.error('Error procesando datos de elevación:', error);
        throw error;
    }
}

function calcularPendiente(punto1, punto2) {
    // Verifica que ambos puntos tengan lat, lng y elevation
    if (!punto1 || !punto2 || !punto1.lat || !punto1.lng || punto1.elevation === undefined || !punto2.lat || !punto2.lng || punto2.elevation === undefined) {
        console.warn("Datos incompletos para calcular pendiente.");
        return 0;
    }

    // Calcula la distancia horizontal entre los dos puntos
    const distanciaHorizontal = L.latLng(punto1.lat, punto1.lng).distanceTo(L.latLng(punto2.lat, punto2.lng));
    if (distanciaHorizontal === 0) return 0;

    // Diferencia de elevación entre los puntos
    const diferenciaElevacion = punto2.elevation - punto1.elevation;

    // Calcula la pendiente como porcentaje
    const pendientePorcentaje = (diferenciaElevacion / distanciaHorizontal) * 100;
    return pendientePorcentaje;
}






function cerrarMedicion() {
    document.getElementById('medicionDistancia').style.display = 'none';
}

function seleccionarElemento(elemento) {
    if (!elemento) return;

    if (window.elementoSeleccionado) {
        deseleccionarElemento(window.elementoSeleccionado);
    }

    window.elementoSeleccionado = elemento;

    // Primero verificar el tipo de elemento
    if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        elemento.setStyle({ color: '#FFFF00', weight: 4 });
        if (elemento.editing) {
            elemento.editing.enable();
        }
    } else if (elemento instanceof L.Marker) {
        elemento.setOpacity(0.7);
        if (elemento.dragging) {
            elemento.dragging.enable();
        }
    }

    // Para el resaltado del hexágono, obtener el centro del elemento
    if (window.HexGrid && window.HexGrid.getHexagonAt) {
        let centro;
        if (elemento instanceof L.Marker) {
            centro = elemento.getLatLng();
        } else if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
            centro = elemento.getBounds().getCenter();
        }

        if (centro) {
            const hexagono = window.HexGrid.getHexagonAt(centro);
            if (hexagono) {
                console.log('Hexágono encontrado:', hexagono);
                window.MiRadial.highlightHex(hexagono.polygon);
            }
        }
    }
}




function hacerEditableFlecha(flecha) {
    flecha.editing.enable();
    
    // Agregar marcadores para ajustar el ancho y la punta de la flecha
    let puntos = flecha.getLatLngs();
    let mitad = Math.floor(puntos.length / 2);
    
    let marcadorAncho = L.marker(puntos[mitad], {draggable: true}).addTo(calcoActivo);
    let marcadorPunta = L.marker(puntos[puntos.length - 2], {draggable: true}).addTo(calcoActivo);

    marcadorAncho.on('drag', function(e) {
        // Ajustar el ancho de la flecha
        let nuevaFlecha = crearFlechaAncha(flecha.getLatLngs().slice(0, mitad));
        flecha.setLatLngs(nuevaFlecha.getLatLngs());
    });

    marcadorPunta.on('drag', function(e) {
        // Ajustar la punta de la flecha
        let puntos = flecha.getLatLngs();
        puntos[puntos.length - 2] = e.latlng;
        puntos[puntos.length - 1] = e.latlng;
        flecha.setLatLngs(puntos);
    });
}

function agregarTextoPoligono(poligono, texto) {
    let bounds = poligono.getBounds();
    let centro = bounds.getCenter();
    
    let textoMarcador = L.marker(centro, {
        draggable: true,
        icon: L.divIcon({
            className: 'text-icon',
            html: `<input type="text" class="editable-text" value="${texto || 'Editar'}">`
        })
    }).addTo(calcoActivo);

    textoMarcador.on('drag', function(e) {
        // Mantener el texto dentro del polígono
        let punto = poligono.closestLayerPoint(e.target.getLatLng());
        e.target.setLatLng(mapa.layerPointToLatLng(punto));
    });
}

function agregarOpcionColor(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Color: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'color';
    input.value = elemento.options.color || '#ff0000';
    input.onchange = function() {
        elemento.setStyle({color: this.value});
    };
}

function agregarOpcionAncho(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Ancho de línea: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'number';
    input.min = '1';
    input.max = '10';
    input.value = elemento.options.weight || 3;
    input.onchange = function() {
        elemento.setStyle({weight: parseInt(this.value)});
    };
}

function agregarOpcionEstiloLinea(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Estilo de línea: ';
    let select = L.DomUtil.create('select', '', div);
    select.innerHTML = `
        <option value="">Sólida</option>
        <option value="5,5">Punteada</option>
        <option value="10,10">Discontinua</option>
    `;
    select.value = elemento.options.dashArray || '';
    select.onchange = function() {
        elemento.setStyle({dashArray: this.value});
    };
}

function agregarOpcionRelleno(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Relleno: ';
    let select = L.DomUtil.create('select', '', div);
    select.innerHTML = `
        <option value="none">Sin relleno</option>
        <option value="solid">Sólido</option>
        <option value="diagonal">Diagonal</option>
        <option value="rombos">Cuadrícula</option>
    `;
    select.value = elemento.options.fillPattern ? 'pattern' : (elemento.options.fillOpacity > 0 ? 'solid' : 'none');
    select.onchange = function() {
        switch(this.value) {
            case 'none':
                elemento.setStyle({fillOpacity: 0});
                break;
            case 'solid':
                elemento.setStyle({fillOpacity: 0.2, fillColor: elemento.options.color});
                break;
            case 'diagonal':
                elemento.setStyle({fillPattern: crearPatronRelleno('diagonal'), fillOpacity: 1});
                break;
            case 'rombos':
                elemento.setStyle({fillPattern: crearPatronRelleno('rombos'), fillOpacity: 1});
                break;
        }
    };
}

function agregarOpcionTexto(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Texto: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'text';
    input.value = elemento.options.texto || '';
    input.onchange = function() {
        elemento.options.texto = this.value;
        actualizarTextoElemento(elemento);
    };
}

function agregarOpcionAnchoFlecha(panel, elemento) {
    let div = L.DomUtil.create('div', '', panel);
    let label = L.DomUtil.create('label', '', div);
    label.innerHTML = 'Ancho de flecha: ';
    let input = L.DomUtil.create('input', '', div);
    input.type = 'number';
    input.min = '1';
    input.max = '50';
    input.value = elemento.options.anchoFlecha || 20;
    input.onchange = function() {
        elemento.options.anchoFlecha = parseInt(this.value);
        actualizarFlechaAncha(elemento);
    };
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

function actualizarFlechaAncha(elemento) {
    let latlngs = elemento.getLatLngs();
    let puntoInicio = latlngs[0];
    let puntoFin = latlngs[latlngs.length - 1];
    
    let angulo = Math.atan2(puntoFin.lat - puntoInicio.lat, puntoFin.lng - puntoInicio.lng);
    let longitud = puntoInicio.distanceTo(puntoFin);
    
    let anchoFlecha = elemento.options.anchoFlecha / 100000; // Ajusta este valor según sea necesario
    let tamañoPunta = elemento.options.tamañoPunta / 100000; // Ajusta este valor según sea necesario

    let puntoIzquierda = L.latLng(
        puntoInicio.lat + Math.sin(angulo - Math.PI/2) * anchoFlecha,
        puntoInicio.lng + Math.cos(angulo - Math.PI/2) * anchoFlecha
    );
    let puntoDerecha = L.latLng(
        puntoInicio.lat + Math.sin(angulo + Math.PI/2) * anchoFlecha,
        puntoInicio.lng + Math.cos(angulo + Math.PI/2) * anchoFlecha
    );
    
    let puntaIzquierda = L.latLng(
        puntoFin.lat + Math.sin(angulo - Math.PI/4) * tamañoPunta,
        puntoFin.lng + Math.cos(angulo - Math.PI/4) * tamañoPunta
    );
    let puntaDerecha = L.latLng(
        puntoFin.lat + Math.sin(angulo + Math.PI/4) * tamañoPunta,
        puntoFin.lng + Math.cos(angulo + Math.PI/4) * tamañoPunta
    );

    elemento.setLatLngs([
        puntoIzquierda,
        puntaIzquierda,
        puntoFin,
        puntaDerecha,
        puntoDerecha,
        puntoIzquierda
    ]);
}

function crearPuntaFlecha(penultimoPunto, ultimoPunto) {
    let angulo = Math.atan2(ultimoPunto.lat - penultimoPunto.lat, ultimoPunto.lng - penultimoPunto.lng);
    let tamañoPunta = 0.0010; // Ajusta este valor según sea necesario
    let punta1 = L.latLng(
    ultimoPunto.lat + Math.sin(angulo - Math.PI/6) * tamañoPunta,
    ultimoPunto.lng + Math.cos(angulo - Math.PI/6) * tamañoPunta
     );
    let punta2 = L.latLng(
    ultimoPunto.lat + Math.sin(angulo + Math.PI/6) * tamañoPunta,
    ultimoPunto.lng + Math.cos(angulo + Math.PI/6) * tamañoPunta
     );
    return [punta1, ultimoPunto, punta2];
    }

// En herramientasP.js

function dibujarElemento(tipo, sidc = null, nombre = '') {
    let opciones = {
        color: 'red',
        weight: 3,
        opacity: 0.7,
        fill: tipo === 'poligono',
        fillOpacity: 0.2
    };

    let puntos = [];
    let elemento;

    mapa.on('click', agregarPunto);
    mapa.once('dblclick', finalizarDibujo);

    function agregarPunto(e) {
        puntos.push(e.latlng);
        if (!elemento) {
                switch(tipo) {
                    case 'poligono':
                        elemento = L.polygon(puntos, opciones).addTo(calcoActivo);
                        break;
                    case 'lineaConTexto':
                    case 'linea':
                        elemento = L.polyline(puntos, opciones).addTo(calcoActivo);
                        break;
                    case 'flechaAncha':
                        elemento = crearFlechaAncha(puntos, sidc, nombre);
                        break;
                    default:
                        console.error('Tipo de elemento no reconocido:', tipo);
                        return;
            }
        } else {
            elemento.setLatLngs(puntos);
        }
    }

    function finalizarDibujo(e) {
        mapa.off('click', agregarPunto);
        mapa.off('dblclick', finalizarDibujo);
    
        if (tipo === 'linea' || tipo === 'lineaConTexto') {
            elemento.options.nombre = nombre || 'Línea sin nombre';
            let textoMarcador = L.marker(elemento.getCenter(), {
                icon: L.divIcon({
                    className: 'texto-linea',
                    html: `<div style="color: black;">${elemento.options.nombre}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,
                interactive: true
            }).addTo(calcoActivo);
            elemento.textoMarcador = textoMarcador;
    
            // Mantener el texto en la línea
            textoMarcador.on('drag', function(e) {
                let closestPoint = L.GeometryUtil.closest(mapa, elemento.getLatLngs(), e.latlng);
                this.setLatLng(closestPoint);
            });
        }
        if (tipo === 'poligono') {
            elemento.options.nombre = nombre || 'Polígono sin nombre';
            let textoMarcador = L.marker(elemento.getBounds().getCenter(), {
                icon: L.divIcon({
                    className: 'texto-poligono',
                    html: `<div style="color: black;">${elemento.options.nombre}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,
                interactive: true
            }).addTo(calcoActivo);
            elemento.textoMarcador = textoMarcador;
        }
        if (tipo === 'lineaSIDC' && sidc) {
            let puntos = elemento.getLatLngs();
            for (let i = 0; i < puntos.length - 1; i++) {
                let punto = L.GeometryUtil.interpolateOnLine(mapa, [puntos[i], puntos[i+1]], 0.5);
                let sym = new ms.Symbol(sidc, {size: 30});
                let marcadorSIDC = L.marker(punto.latLng, {
                    icon: L.divIcon({
                        className: 'sidc-icon',
                        html: sym.asSVG(),
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    }),
                    interactive: false
                }).addTo(calcoActivo);
                elemento.marcadoresSIDC = elemento.marcadoresSIDC || [];
                elemento.marcadoresSIDC.push(marcadorSIDC);
            }
        }
    
        elemento.off('dblclick').on('dblclick', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            mostrarMenuContextual(e);
        });
    
        elemento.on('click', function() { seleccionarElemento(this); });
    
        elemento.on('edit', function() {
            if (this.textoMarcador) {
                if (this instanceof L.Polyline) {
                    this.textoMarcador.setLatLng(this.getCenter());
                } else if (this instanceof L.Polygon) {
                    this.textoMarcador.setLatLng(this.getBounds().getCenter());
                }
            }
        });
    
        if (typeof registrarAccion === 'function') {
            registrarAccion({
                tipo: `agregar${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
                elemento: elemento
            });
        }
    
        hacerEditable(elemento, elemento.textoMarcador, tipo);
        habilitarDobleClicEnElementos();
    }
}

function ajustarFlechaAncha(linea) {
    let puntos = linea.getLatLngs();
    let flecha = crearFlechaAncha(puntos);
    calcoActivo.removeLayer(linea);
    flecha.addTo(calcoActivo);
    hacerEditableFlecha(flecha);
    return flecha;
}

function deseleccionarElemento(elemento) {
    // Se movió la función al objeto MiRadial y se corrigió su contexto
    if (elemento) {
        if (elemento instanceof L.Polygon || elemento instanceof L.Polyline) {
            elemento.setStyle(elemento.options.originalStyle || {
                color: '#3388ff',
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.1
            });
        } else if (elemento instanceof L.Marker) {
            elemento.setOpacity(1);
        }
        
        if (elemento === window.elementoSeleccionado) {
            window.elementoSeleccionado = null;
        }
    }
}

function cerrarTodosPaneles() {
    const paneles = ['panelEdicionUnidad', 'panelEdicionEquipo', 'panelEdicionLinea', 'panelEdicionMCC'];
    paneles.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'none';
            panel.classList.remove('show');
        }
    });
}

function resaltarElemento(elemento) {
    if (elemento instanceof L.Marker) {
        elemento.setOpacity(0.6);
    } else if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        elemento.setStyle({ color: '#FFFF00', weight: 4 });
        mostrarVertices(elemento);
    }
}

function quitarResaltado(elemento) {
    if (elemento instanceof L.Marker) {
        elemento.setOpacity(1);
    } else if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        elemento.setStyle(elemento.options.originalStyle || {});
    }
}

function mostrarVertices(elemento) {
    elemento.editMarkers = elemento.editMarkers || [];
    let latlngs = elemento.getLatLngs();
    if (latlngs[0] instanceof Array) {
        latlngs = latlngs[0];
    }
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
            
            // Actualizar posición de otros marcadores
            elemento.vertexMarkers.forEach((m, i) => {
                if (m !== e.target) {
                    m.setLatLng(newLatLngs[0][i] || newLatLngs[i]);
                }
            });
        });
        
        elemento.editMarkers.push(marker);
    });
}

function ocultarVertices(elemento) {
    if (elemento.editMarkers) {
        elemento.editMarkers.forEach(marker => calcoActivo.removeLayer(marker));
        elemento.editMarkers = [];
    }
}


function eliminarElementoSeleccionado() {
    if (elementoSeleccionado) {
        // Eliminar el elemento principal
        calcoActivo.removeLayer(elementoSeleccionado);

        // Eliminar texto asociado
        if (elementoSeleccionado.textoAsociado) {
            calcoActivo.removeLayer(elementoSeleccionado.textoAsociado);
        }

        // Eliminar etiqueta personalizada
        if (elementoSeleccionado.etiquetaPersonalizada) {
            calcoActivo.removeLayer(elementoSeleccionado.etiquetaPersonalizada);
        }

        // Eliminar marcadores de vértice
        if (elementoSeleccionado.vertexMarkers) {
            elementoSeleccionado.vertexMarkers.forEach(marker => calcoActivo.removeLayer(marker));
        }

        // Eliminar marcadores SIDC
        if (elementoSeleccionado.marcadoresSIDC) {
            elementoSeleccionado.marcadoresSIDC.forEach(marker => calcoActivo.removeLayer(marker));
        }

        // Eliminar texto marcador (para líneas y polígonos)
        if (elementoSeleccionado.textoMarcador) {
            calcoActivo.removeLayer(elementoSeleccionado.textoMarcador);
        }

        // Si es una flecha ancha, eliminar marcadores específicos
        if (elementoSeleccionado.options.tipoElemento === 'flechaAncha') {
            if (elementoSeleccionado.marcadorAncho) {
                calcoActivo.removeLayer(elementoSeleccionado.marcadorAncho);
            }
            if (elementoSeleccionado.marcadorPunta) {
                calcoActivo.removeLayer(elementoSeleccionado.marcadorPunta);
            }
        }

        if (elementoSeleccionado.options.tipoElemento === 'lineaMedicion') {
            if (elementoSeleccionado.marcadores) {
                elementoSeleccionado.marcadores.forEach(marker => calcoActivo.removeLayer(marker));
            }
        }
        // Actualizar la lista del calco
        actualizarElementosCalco();
        
        // Deseleccionar y cerrar paneles
        deseleccionarElemento();
        cerrarTodosPaneles();
        elementoSeleccionado = null;

        console.log('Elemento y sus componentes asociados eliminados');
    } else {
        console.log('No hay elemento seleccionado para eliminar');
    }
}

var acciones = [];
var indiceAccionActual = -1;
var maxAcciones = 10;

function registrarAccion(accion) {
    // Eliminar acciones futuras si estamos en medio de la historia
    acciones.splice(indiceAccionActual + 1);
    
    // Añadir la nueva acción
    acciones.push(accion);
    indiceAccionActual++;
    
    // Limitar el número de acciones almacenadas
    if (acciones.length > maxAcciones) {
        acciones.shift();
        indiceAccionActual--;
    }
    
    console.log('Acción registrada:', accion);
}

function deshacerAccion() {
    if (indiceAccionActual >= 0) {
        var accion = acciones[indiceAccionActual];
        console.log('Deshaciendo acción:', accion);
        
        switch(accion.tipo) {
            case 'agregar':
                window.calcoActivo.removeLayer(accion.elemento);
                break;
            case 'eliminar':
                window.calcoActivo.addLayer(accion.elemento);
                break;
            case 'mover':
                accion.elemento.setLatLng(accion.posicionAnterior);
                break;
            case 'editar':
                accion.elemento.setStyle(accion.estiloAnterior);
                if (accion.elemento.setLatLngs) {
                    accion.elemento.setLatLngs(accion.latlngsAnteriores);
                }
                break;
            // Añadir más casos según sea necesario
        }
        
        indiceAccionActual--;
    } else {
        console.log('No hay más acciones para deshacer');
    }
}

function rehacerAccion() {
    if (indiceAccionActual < acciones.length - 1) {
        indiceAccionActual++;
        var accion = acciones[indiceAccionActual];
        console.log('Rehaciendo acción:', accion);
        
        switch(accion.tipo) {
            case 'agregar':
                window.calcoActivo.addLayer(accion.elemento);
                break;
            case 'eliminar':
                window.calcoActivo.removeLayer(accion.elemento);
                break;
            case 'mover':
                accion.elemento.setLatLng(accion.posicionNueva);
                break;
            case 'editar':
                accion.elemento.setStyle(accion.estiloNuevo);
                if (accion.elemento.setLatLngs) {
                    accion.elemento.setLatLngs(accion.latlngsNuevas);
                }
                break;
            // Añadir más casos según sea necesario
        }
    } else {
        console.log('No hay más acciones para rehacer');
    }
}

// Funciones de copiar y pegar
var elementoCopiado = null;

function copiarElemento() {
    if (window.elementoSeleccionado) {
        elementoCopiado = window.elementoSeleccionado;
        console.log('Elemento copiado');
    } else {
        console.log('No hay elemento seleccionado para copiar');
    }
}

function pegarElemento() {
    if (elementoCopiado) {
        var nuevoElemento;
        if (elementoCopiado instanceof L.Marker) {
            nuevoElemento = L.marker(mapa.getCenter(), elementoCopiado.options);
        } else if (elementoCopiado instanceof L.Polyline) {
            var latlngs = elementoCopiado.getLatLngs().map(function(latlng) {
                return mapa.getCenter();
            });
            nuevoElemento = L.polyline(latlngs, elementoCopiado.options);
        } else if (elementoCopiado instanceof L.Polygon) {
            var latlngs = elementoCopiado.getLatLngs()[0].map(function(latlng) {
                return mapa.getCenter();
            });
            nuevoElemento = L.polygon(latlngs, elementoCopiado.options);
        }

        if (nuevoElemento) {
            nuevoElemento.addTo(window.calcoActivo);
            console.log('Elemento pegado');
            registrarAccion({
                tipo: 'agregar',
                elemento: nuevoElemento
            });
        }
    } else {
        console.log('No hay elemento para pegar');
    }
}
/**
 * Muestra el perfil de elevación para la línea seleccionada.
 */

function crearControlElevacion(stats, elevationData) {
    if (!stats || !elevationData || !Array.isArray(elevationData)) {
        console.error("Datos de elevación inválidos");
        return false;
    }

    const perfilContainer = document.getElementById('perfilElevacionDisplay');
    if (!perfilContainer) {
        console.error('No se encontró el contenedor del perfil de elevación');
        return false;
    }

    try {
        perfilContainer.innerHTML = '';

        // Botón de cierre
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'elevation-close-button';
        closeBtn.onclick = cerrarPerfilElevacion;
        perfilContainer.appendChild(closeBtn);

        // Contenedor del gráfico
        const chartContainer = document.createElement('div');
        chartContainer.style.width = '100%';
        chartContainer.style.height = '80%';
        perfilContainer.appendChild(chartContainer);

        // Dimensiones y márgenes
        const margin = {top: 20, right: 30, bottom: 30, left: 50};
        const width = chartContainer.clientWidth - margin.left - margin.right;
        const height = chartContainer.clientHeight - margin.top - margin.bottom;

        // Crear SVG
        const svg = d3.select(chartContainer)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Escalas
        const x = d3.scaleLinear()
            .domain([0, d3.max(elevationData, d => d.distancia)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([
                d3.min(elevationData, d => d.elevation) * 0.95,
                d3.max(elevationData, d => d.elevation) * 1.05
            ])
            .range([height, 0]);

        // Línea suavizada
        const line = d3.line()
            .x(d => x(d.distancia))
            .y(d => y(d.elevation))
            .curve(d3.curveMonotoneX);

        // Área bajo la curva
        const area = d3.area()
            .x(d => x(d.distancia))
            .y0(height)
            .y1(d => y(d.elevation))
            .curve(d3.curveMonotoneX);

        // Agregar área
        svg.append('path')
            .datum(elevationData)
            .attr('class', 'elevation-area')
            .attr('d', area)
            .attr('fill', 'rgba(33, 150, 243, 0.2)');

        // Agregar línea
        svg.append('path')
            .datum(elevationData)
            .attr('class', 'elevation-line')
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#2196F3')
            .attr('stroke-width', 2);

        // Ejes
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(d => `${(d/1000).toFixed(1)}km`));

        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => `${d.toFixed(0)}m`));

        // Estadísticas
        const pendientes = elevationData.map(d => d.pendiente).filter(p => isFinite(p));
        const statsDiv = document.createElement('div');
        statsDiv.className = 'elevation-stats';
        statsDiv.innerHTML = `
            <div class="stat-group">
                <div class="stat-item">
                    <span class="stat-label">Distancia:</span>
                    <span class="stat-value">${(stats.distanciaTotal/1000).toFixed(2)} km</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Elevación min:</span>
                    <span class="stat-value">${stats.min.toFixed(0)} m</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Elevación max:</span>
                    <span class="stat-value">${stats.max.toFixed(0)} m</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Desnivel:</span>
                    <span class="stat-value">${stats.desnivel.toFixed(0)} m</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Pendiente max:</span>
                    <span class="stat-value">${Math.max(...pendientes).toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Pendiente min:</span>
                    <span class="stat-value">${Math.min(...pendientes).toFixed(1)}%</span>
                </div>
            </div>
        `;
        perfilContainer.appendChild(statsDiv);

        return true;
    } catch (error) {
        console.error("Error al crear el control de elevación:", error);
        perfilContainer.innerHTML = '<div class="error">Error al generar el perfil de elevación</div>';
        return false;
    }
}

function cerrarPerfilElevacion() {
    const perfilContainer = document.getElementById('perfilElevacionDisplay');
    if (perfilContainer) {
        perfilContainer.style.display = 'none';
        perfilContainer.innerHTML = '';
    }
    // Limpiar recursos si es necesario
    if (window.elementoSeleccionado) {
        window.elementoSeleccionado = null;
    }
}

function agregarInteractividadPerfil(svg, data, x, y, width, height) {
    // Crear grupo para elementos interactivos
    const interactiveGroup = svg.append('g')
        .attr('class', 'interactive-layer');
    
    // Crear línea vertical de cursor
    const cursorLine = interactiveGroup.append('line')
        .attr('class', 'cursor-line')
        .attr('y1', 0)
        .attr('y2', height)
        .style('display', 'none');
    
    // Crear punto de cursor
    const cursorPoint = interactiveGroup.append('circle')
        .attr('class', 'cursor-point')
        .attr('r', 4)
        .style('display', 'none');
    
    // Crear tooltip
    const tooltip = d3.select('#perfilElevacionDisplay')
        .append('div')
        .attr('class', 'elevation-tooltip');
    
    // Área de captura de mouse
    const mouseArea = interactiveGroup.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');
    
    // Manejar movimiento del mouse
    mouseArea.on('mousemove', function(event) {
        const [xPos] = d3.pointer(event);
        const xValue = x.invert(xPos);
        
        // Encontrar el punto de datos más cercano
        const bisect = d3.bisector(d => d.distancia).left;
        const index = bisect(data, xValue);
        const dataPoint = data[index];
        
        if (dataPoint) {
            // Actualizar posición de la línea y punto
            cursorLine
                .attr('x1', x(dataPoint.distancia))
                .attr('x2', x(dataPoint.distancia))
                .style('display', null);
                
            cursorPoint
                .attr('cx', x(dataPoint.distancia))
                .attr('cy', y(dataPoint.elevation))
                .style('display', null);
            
            // Actualizar tooltip
            tooltip
                .style('display', 'block')
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 10}px`)
                .html(`
                    Distancia: ${(dataPoint.distancia/1000).toFixed(2)} km<br>
                    Elevación: ${dataPoint.elevation.toFixed(0)} m<br>
                    Pendiente: ${dataPoint.pendiente.toFixed(1)}%
                `);
        }
    });
    
    mouseArea.on('mouseleave', function() {
        cursorLine.style('display', 'none');
        cursorPoint.style('display', 'none');
        tooltip.style('display', 'none');
    });
}



// Hacer estas funciones disponibles globalmente
window.registrarAccion = registrarAccion;
window.deshacerAccion = deshacerAccion;
window.rehacerAccion = rehacerAccion;
window.copiarElemento = copiarElemento;
window.pegarElemento = pegarElemento;
window.eliminarElementoSeleccionado = eliminarElementoSeleccionado;
window.medirDistancia = medirDistancia;
window.mostrarPerfilElevacion = mostrarPerfilElevacion;
window.initializeBuscarLugar = initializeBuscarLugar;
window.actualizarLinea = actualizarLinea;
window.cerrarPerfilElevacion=cerrarPerfilElevacion;
window.seleccionarElemento = seleccionarElemento;
window.deseleccionarElemento = deseleccionarElemento;
window.actualizarDistanciaProvisional = actualizarDistanciaProvisional;
window.resaltarElemento = resaltarElemento;
window.quitarResaltado = quitarResaltado;
window.interpolarPuntos = interpolarPuntos;
window.crearControlElevacion = crearControlElevacion;
window.crearPuntaFlecha = crearPuntaFlecha;
window.eliminarElementoSeleccionado = eliminarElementoSeleccionado;
window.crearLinea = crearLinea;
window.calcularDistancia =calcularDistancia;
window.interpolarPuntosRuta = interpolarPuntosRuta