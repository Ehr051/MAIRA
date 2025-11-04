// map.js

// Variables globales
var map;
var capaOSM, capaCalles, capaSatelite, capaTransport, capaLandscape, capaOutdoors;
var gridLayer;
var capaActiva;
var calcoActivo;
var elementoSeleccionado = null;
var capas = {};
var calcos = {};
var mapaInicializado = false;
var sidc;
var currentCoordinateSystem = null;
var currentMapType = 'osm'; // Tipo de map base actual

// definiciones de las fajas
proj4.defs("EPSG:5344", "+proj=tmerc +lat_0=-90 +lon_0=-72 +k=1 +x_0=1500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:5345", "+proj=tmerc +lat_0=-90 +lon_0=-69 +k=1 +x_0=2500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:5346", "+proj=tmerc +lat_0=-90 +lon_0=-66 +k=1 +x_0=3500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:5347", "+proj=tmerc +lat_0=-90 +lon_0=-63 +k=1 +x_0=4500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:5348", "+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:5349", "+proj=tmerc +lat_0=-90 +lon_0=-57 +k=1 +x_0=6500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:5350", "+proj=tmerc +lat_0=-90 +lon_0=-54 +k=1 +x_0=7500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:32633", "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");

L.GridLayer.MGRS = L.GridLayer.extend({
    createTile: function (coords) {
        var tile = L.DomUtil.create('div', 'leaflet-tile');
        var size = this.getTileSize();
        tile.style.width = size.x + 'px';
        tile.style.height = size.y + 'px';
        
        var nw = this._map.unproject(coords.scaleBy(size), coords.z);
        var se = this._map.unproject(coords.add(L.point(1, 1)).scaleBy(size), coords.z);
        
        if (isFinite(nw.lat) && isFinite(nw.lng) && isFinite(se.lat) && isFinite(se.lng)) {
            try {
                // Verificar que mgrs esté disponible
                if (typeof window.mgrs !== 'undefined') {
                    var mgrsNW = window.mgrs.forward([nw.lng, nw.lat], 5);
                    var mgrsSE = window.mgrs.forward([se.lng, se.lat], 5);
                    
                    tile.innerHTML = '<div class="grid-label-text" style="position: absolute; top: 0; left: 0;">' + mgrsNW + '</div>' +
                                     '<div class="grid-label-text" style="position: absolute; bottom: 0; right: 0;">' + mgrsSE + '</div>';
                } else {
                    console.warn('⚠️ Librería MGRS no disponible - cargue dependency-manager.js primero');
                    tile.innerHTML = '<div class="grid-label-text">Grid</div>';
                }
            } catch (error) {
                console.error('Error al crear tile MGRS:', error);
                tile.innerHTML = '<div class="grid-label-text">Grid</div>';
            }
        }
        
        return tile;
    },
    redraw: function() {
        this.clearAllTiles();
        this.redrawAllTiles();
    }
});

L.GridLayer.UTM = L.GridLayer.extend({
    createTile: function (coords) {
        var tile = L.DomUtil.create('div', 'leaflet-tile');
        var size = this.getTileSize();
        tile.style.width = size.x + 'px';
        tile.style.height = size.y + 'px';
        
        var nw = this._map.unproject(coords.scaleBy(size), coords.z);
        var se = this._map.unproject(coords.add(L.point(1, 1)).scaleBy(size), coords.z);
        
        if (isFinite(nw.lat) && isFinite(nw.lng) && isFinite(se.lat) && isFinite(se.lng)) {
            try {
                var utmNW = proj4(proj4.defs('EPSG:4326'), proj4.defs('EPSG:32633'), [nw.lng, nw.lat]);
                var utmSE = proj4(proj4.defs('EPSG:4326'), proj4.defs('EPSG:32633'), [se.lng, se.lat]);
                
                tile.innerHTML = '<div class="grid-label-text" style="position: absolute; top: 0; left: 0;">' +
                    utmNW[0].toFixed(0) + ',' + utmNW[1].toFixed(0) + '</div>' +
                    '<div class="grid-label-text" style="position: absolute; bottom: 0; right: 0;">' +
                    utmSE[0].toFixed(0) + ',' + utmSE[1].toFixed(0) + '</div>';
            } catch (error) {
                console.error('Error al crear tile UTM:', error);
            }
        }
        
        return tile;
    },
    redraw: function() {
        this.clearAllTiles();
        this.redrawAllTiles();
    }
});

L.GridLayer.GaussKruger = L.GridLayer.extend({
    createTile: function (coords) {
        var tile = L.DomUtil.create('div', 'leaflet-tile');
        var size = this.getTileSize();
        tile.style.width = size.x + 'px';
        tile.style.height = size.y + 'px';
        
        var nw = this._map.unproject(coords.scaleBy(size), coords.z);
        var se = this._map.unproject(coords.add(L.point(1, 1)).scaleBy(size), coords.z);
        
        if (isFinite(nw.lat) && isFinite(nw.lng) && isFinite(se.lat) && isFinite(se.lng)) {
            var fajaGK = seleccionarFajaGK((nw.lng + se.lng) / 2);
            
            if (fajaGK) {
                try {
                    var gkNW = proj4('EPSG:4326', fajaGK, [nw.lng, nw.lat]);
                    var gkSE = proj4('EPSG:4326', fajaGK, [se.lng, se.lat]);
                    
                    tile.innerHTML = '<div class="grid-label-text" style="position: absolute; top: 0; left: 0;">' +
                        gkNW[0].toFixed(0) + ',' + gkNW[1].toFixed(0) + '</div>' +
                        '<div class="grid-label-text" style="position: absolute; bottom: 0; right: 0;">' +
                        gkSE[0].toFixed(0) + ',' + gkSE[1].toFixed(0) + '</div>';
                } catch (error) {
                    console.error('Error al crear tile Gauss-Krüger:', error);
                }
            }
        }
        
        return tile;
    },
    redraw: function() {
        this.clearAllTiles();
        this.redrawAllTiles();
    }
});

L.LatLngGraticule = L.LayerGroup.extend({
    options: {
        showLabel: true,
        opacity: 0.7,
        weight: 0.8,
        color: '#000',
        font: '12px Verdana',
        lngFormatter: function(lng) {
            return "Lng: " + lng.toFixed(2);
        },
        latFormatter: function(lat) {
            return "Lat: " + lat.toFixed(2);
        },
        zoomInterval: [
            {start: 2, end: 3, interval: 30},
            {start: 4, end: 5, interval: 10},
            {start: 6, end: 7, interval: 5},
            {start: 8, end: 9, interval: 1},
            {start: 10, end: 11, interval: 0.5},
            {start: 12, end: 13, interval: 0.25},
            {start: 14, end: 15, interval: 0.1},
            {start: 16, end: 17, interval: 0.05},
            {start: 18, end: 19, interval: 0.01},
            {start: 20, end: 21, interval: 0.005},
            {start: 22, end: 30, interval: 0.001}
        ]
    },

    initialize: function(options) {
        L.LayerGroup.prototype.initialize.call(this);
        L.Util.setOptions(this, options);
    },

    onAdd: function(map) {
        this._map = map;
        this._draw();
        this._map.on('moveend', this._draw, this);
    },

    onRemove: function(map) {
        this._map.off('moveend', this._draw, this);
        this.clearLayers();
    },

    _draw: function() {
        this.clearLayers();

        var bounds = this._map.getBounds();
        var zoom = this._map.getZoom();
        var interval = this._getInterval(zoom);

        var lines = [];

        for (var lng = Math.floor(bounds.getWest() / interval) * interval; lng <= bounds.getEast(); lng += interval) {
            lines.push(L.polyline([[bounds.getSouth(), lng], [bounds.getNorth(), lng]], this.options));
        }

        for (var lat = Math.floor(bounds.getSouth() / interval) * interval; lat <= bounds.getNorth(); lat += interval) {
            lines.push(L.polyline([[lat, bounds.getWest()], [lat, bounds.getEast()]], this.options));
        }

        this.addLayer(L.featureGroup(lines));

        if (this.options.showLabel) {
            this._drawLabels(interval, bounds);
        }
    },

    _drawLabels: function(interval, bounds) {
        for (var lng = Math.floor(bounds.getWest() / interval) * interval; lng <= bounds.getEast(); lng += interval) {
            this.addLayer(this._label(bounds.getNorth(), lng, this.options.lngFormatter(lng), 'gridLabel-lng'));
        }

        for (var lat = Math.floor(bounds.getSouth() / interval) * interval; lat <= bounds.getNorth(); lat += interval) {
            this.addLayer(this._label(lat, bounds.getWest(), this.options.latFormatter(lat), 'gridLabel-lat'));
        }
    },

    _label: function(lat, lng, text, cssClass) {
        return L.marker([lat, lng], {
            icon: L.divIcon({
                iconSize: [0, 0],
                className: 'gridLabel ' + cssClass,
                html: '<div class="grid-label-text">' + text + '</div>'
            })
        });
    },

    _getInterval: function(zoom) {
        var i;
        for (i = 0; i < this.options.zoomInterval.length; i++) {
            if (zoom >= this.options.zoomInterval[i].start && zoom <= this.options.zoomInterval[i].end) {
                return this.options.zoomInterval[i].interval;
            }
        }
        return 360;
    },
    redraw: function() {
        this.clearAllTiles();
        this.redrawAllTiles();
    }
});

// Asegúrate de que L.GridLayer.GaussKruger esté definido de manera similar


function inicializarMapa() {
    if (mapaInicializado) {
        console.warn("El map ya está inicializado. Saltando la inicialización.");
        return;
    }

    map = L.map('map',{
        doubleClickZoom: false
    }).setView([-38.07, -62.00], 13); // Sierras de Buenos Aires para pruebas 3D
   
    capaActiva = L.layerGroup();
    capas['Capa1'] = capaActiva;
    capaActiva.addTo(map);

    calcoActivo = L.layerGroup().addTo(map);
    calcos['Calco1'] = calcoActivo;
    
    // 🎮 INTEGRAR FUNCIONALIDADES 3D DIRECTAMENTE EN map BASE
    inicializarFuncionalidades3D();
    
    // 🔍 INICIALIZAR SISTEMA ZOOM MULTI-NIVEL (Total War Style)
    if (typeof window.inicializarSistemaZoom === 'function') {
        window.inicializarSistemaZoom(map);
        console.log('🔍 Sistema Zoom Multi-Nivel inicializado');
        
        console.log('⚠️ Elementos de prueba deshabilitados - Juego iniciará limpio');
    } else {
        console.warn('⚠️ Sistema Zoom Multi-Nivel no disponible');
    }
    
    // Asegúrate de que esta función esté definida en calcos.js
    if (typeof agregarCalcoALista === 'function') {
        agregarCalcoALista('Calco1');
    } else {
        console.warn("La función agregarCalcoALista no está definida. Asegúrate de cargar calcos.js antes que map2.js");
    }

    capaOSM = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.opentopomap.org/copyright">OpenStreetMap</a> contributors'
    });

    capaCalles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    capaSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.google.com/">Google</a>'
    });

    capaTransport = L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=c06b957582f643f99c630ec8e3fe7ff0', {
        attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors - Tiles style by <a href="https://www.thunderforest.com/">Thunderforest</a>'
    });

    capaLandscape = L.tileLayer('https://tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=c06b957582f643f99c630ec8e3fe7ff0', {
        attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors - Tiles style by <a href="https://www.thunderforest.com/">Thunderforest</a>'
    });

    capaOutdoors = L.tileLayer('https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=c06b957582f643f99c630ec8e3fe7ff0', {
        attribution: '&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors - Tiles style by <a href="https://www.thunderforest.com/">Thunderforest</a>'
    });

    capaLandscape.addTo(map);

    map.on('click', function(e) {
    if (e.originalEvent.target === map._container) {
        // ✅ VERIFICAR QUE EXISTE ANTES DE LLAMAR:
        if (typeof window.deseleccionarElemento === 'function') {
            window.deseleccionarElemento();
        } else if (window.elementoSeleccionado) {
            window.elementoSeleccionado = null; // Fallback
        }
    }
    });
   
    mapaInicializado = true;
    console.log("map inicializado correctamente");
    habilitarDobleClicEnElementos();

    map.on('load', function() {
        console.log('map cargado completamente');
        if (typeof window.inicializarPatrones === 'function') {
            window.inicializarPatrones();
        }
    });
    
}

function habilitarDobleClicEnElementos() {
    calcoActivo.eachLayer(function(layer) {
        if (layer instanceof L.Path || layer instanceof L.Marker) {
            layer.off('click').on('click', function(e) {
                L.DomEvent.stopPropagation(e);
                console.log('🎯 Click en elemento:', this.constructor.name);
                // Usar la función global de selección
                if (typeof window.seleccionarElemento === 'function') {
                    window.seleccionarElemento(this);
                } else if (window.mapInteractionHandler && window.mapInteractionHandler.seleccionarElemento) {
                    window.mapInteractionHandler.seleccionarElemento(this);
                } else {
                    console.warn('⚠️ Sistema de selección no disponible');
                    window.elementoSeleccionado = this;
                }
            });

            layer.off('dblclick').on('dblclick', function(e) {
                // ✅ COORDINACIÓN CON MENU RADIAL
                // Solo interceptar si hay una herramienta de edición activa específica
                // Si no, permitir que MiRadial maneje el evento
                const herramientasEdicion = ['editar', 'mover', 'edicion', 'editing'];
                const tieneHerramientaEdicion = window.herramientaActiva && 
                    herramientasEdicion.includes(window.herramientaActiva.toLowerCase());
                
                console.log('🔍 [mapaP] Doble click en elemento:', {
                    herramientaActiva: window.herramientaActiva,
                    tieneHerramientaEdicion,
                    MiRadialDisponible: !!window.MiRadial
                });
                
                if (tieneHerramientaEdicion) {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    console.log('🎯 Doble click en elemento - abriendo edición (herramienta activa)');
                    // Seleccionar primero
                    if (typeof window.seleccionarElemento === 'function') {
                        window.seleccionarElemento(this);
                    } else {
                        window.elementoSeleccionado = this;
                    }
                    // Luego editar
                    if (typeof window.editarElementoSeleccionado === 'function') {
                        window.editarElementoSeleccionado();
                    }
                } else {
                    // No interceptar - permitir que MiRadial maneje el evento
                    console.log('🎯 Doble click en elemento - delegando a MiRadial');
                    // Solo seleccionar el elemento, no bloquear el evento
                    if (typeof window.seleccionarElemento === 'function') {
                        window.seleccionarElemento(this);
                    } else {
                        window.elementoSeleccionado = this;
                    }
                    // NO usar stopPropagation/preventDefault para permitir MiRadial
                }
            });

            layer.off('contextmenu').on('contextmenu', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                
                // ✅ FIX URGENTE: Seleccionar elemento
                if (typeof window.seleccionarElemento === 'function') {
                    window.seleccionarElemento(this);
                } else {
                    window.elementoSeleccionado = this;
                }
                
                // ✅ FIX URGENTE: USAR MIRADIAL (NO mostrarMenuContextual)
                if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
                    // Obtener coordenadas del ELEMENTO (no del click)
                    const latlng = this.getLatLng ? this.getLatLng() : 
                                   (this.getBounds ? this.getBounds().getCenter() : null);
                    
                    if (latlng) {
                        const punto = map.latLngToContainerPoint(latlng);
                        
                        // ✅ CRÍTICO: Establecer elemento seleccionado en MiRadial
                        window.MiRadial.selectedUnit = this;
                        
                        // Determinar tipo según el elemento
                        let tipo = 'elemento';
                        if (this.options.sidc) {
                            tipo = 'simboloMilitar';
                        } else if (this instanceof L.Polygon) {
                            tipo = 'poligono';
                        } else if (this instanceof L.Polyline) {
                            tipo = 'linea';
                        }
                        
                        console.log('🎯 Abriendo MiRadial para:', tipo, 'en coordenadas del elemento:', punto);
                        window.MiRadial.mostrarMenu(punto.x, punto.y, tipo);
                    }
                } else {
                    console.error('❌ MiRadial no disponible - NO se usa menú contextual');
                }
            });
        }
    });
}

// variables y funciones estén disponibles globalmente
window.map = map;
window.capaActiva = capaActiva;
window.calcoActivo = calcoActivo;
window.capas = capas;
window.calcos = calcos;
window.inicializarMapa = inicializarMapa;

// 🔍 INICIALIZAR DETECTOR DE ZOOM 3D
if (typeof DetectorZoom3D !== 'undefined' && map) {
    try {
        window.detectorZoom3D = new DetectorZoom3D(map);
        console.log('✅ DetectorZoom3D inicializado desde mapaP.js');
    } catch (error) {
        console.warn('⚠️ Error inicializando DetectorZoom3D:', error);
    }
} else {
    console.log('🔍 DetectorZoom3D no disponible aún - se inicializará automáticamente');
}

// Función para desactivar el zoom con doble clic

function desactivarDobleClickZoom() {
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.enable();
}

// Función para determinar el contexto del map basado en el evento
function determinarContextoMapa(event) {
    // Verificar si hay elementos bajo el cursor
    const elementsAtPoint = [];
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) {
            try {
                if (layer instanceof L.Marker && layer.getBounds) {
                    if (layer.getBounds().contains(event.latlng)) {
                        elementsAtPoint.push(layer);
                    }
                } else if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
                    if (layer.getBounds && layer.getBounds().contains(event.latlng)) {
                        elementsAtPoint.push(layer);
                    }
                }
            } catch (error) {
                console.warn('Error checking layer bounds:', error);
            }
        }
    });

    // Determinar contexto basado en elementos encontrados
    if (elementsAtPoint.length > 0) {
        const element = elementsAtPoint[0]; // Tomar el primer elemento

        if (element instanceof L.Marker) {
            // Verificar si es una unidad (cualquier marcador con SIDC)
            if (element.options && element.options.sidc) {
                return 'unidad'; // Para unidades
            }
        } else if (element instanceof L.Polyline || element instanceof L.Polygon) {
            return 'elemento'; // Para elementos gráficos
        }
    }

    // En modo planeamiento, no mostrar menú de terreno si no hay elementos
    if (window.sistemaPl) {
        return 'nada'; // No mostrar menú en modo planeamiento sin elementos
    }

    return 'terreno'; // Por defecto, terreno
}

// Función para desactivar el menú contextual del clic derecho - REEMPLAZADO POR MENÚ RADIAL
function desactivarClickDerecho() {
    map.on('contextmenu', function(e) {
        L.DomEvent.preventDefault(e);

        // Usar menú radial en lugar del contextual tradicional
        if (window.MAIRARadialMenu) {
            const context = determinarContextoMapa(e);
            let element = null;

            // Buscar elemento bajo el cursor para centrar el menú
            const elementsAtPoint = [];
            map.eachLayer(function(layer) {
                if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) {
                    try {
                        if (layer instanceof L.Marker && layer.getBounds) {
                            if (layer.getBounds().contains(e.latlng)) {
                                elementsAtPoint.push(layer);
                            }
                        } else if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
                            if (layer.getBounds && layer.getBounds().contains(e.latlng)) {
                                elementsAtPoint.push(layer);
                            }
                        }
                    } catch (error) {
                        console.warn('Error checking layer bounds:', error);
                    }
                }
            });

            // Si hay elementos, calcular posición centrada en el primer elemento
            let x = e.originalEvent.clientX;
            let y = e.originalEvent.clientY;

            if (elementsAtPoint.length > 0) {
                const targetElement = elementsAtPoint[0];
                element = targetElement;

                try {
                    if (targetElement instanceof L.Marker) {
                        // Para marcadores, obtener la posición del pixel en pantalla
                        const pixelPoint = map.latLngToContainerPoint(targetElement.getLatLng());
                        x = pixelPoint.x;
                        y = pixelPoint.y;
                    } else if (targetElement instanceof L.Polyline || targetElement instanceof L.Polygon) {
                        // Para polígonos/polylines, obtener el centro de los bounds
                        const bounds = targetElement.getBounds();
                        const center = bounds.getCenter();
                        const pixelPoint = map.latLngToContainerPoint(center);
                        x = pixelPoint.x;
                        y = pixelPoint.y;
                    }
                } catch (error) {
                    console.warn('Error calculando posición del elemento:', error);
                    // Mantener posición del mouse como fallback
                }
            }

            window.MAIRARadialMenu.show(x, y, context, element);
        } else {
            // MiRadial debe estar siempre disponible - NO usar menú contextual
            console.error('❌ MAIRARadialMenu no disponible');
        }
    });
}

function inicializarEventosMapa() {
    map.on('click', function(e) {
        var elementosEnPunto = [];
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Polygon) {
                if (layer instanceof L.Marker && layer.getLatLng) {
                    var latLng = layer.getLatLng();
                    if (latLng && typeof latLng.distanceTo === 'function' && e.latlng) {
                        if (latLng.distanceTo(e.latlng) < 20) {
                            elementosEnPunto.push(layer);
                        }
                    }
                } else if ((layer instanceof L.Polyline || layer instanceof L.Polygon) && layer.getBounds) {
                    var bounds = layer.getBounds();
                    if (bounds && typeof bounds.contains === 'function' && e.latlng) {
                        if (bounds.contains(e.latlng)) {
                            elementosEnPunto.push(layer);
                        }
                    }
                }
            }
        });
    
        if (elementosEnPunto.length > 0) {
            // ✅ VERIFICAR QUE LA FUNCIÓN EXISTE ANTES DE LLAMAR:
            if (typeof window.seleccionarElemento === 'function') {
                window.seleccionarElemento(elementosEnPunto[0]);
            } else {
                console.warn('❌ seleccionarElemento no disponible');
            }
        } else {
            // ✅ VERIFICAR QUE LA FUNCIÓN EXISTE ANTES DE LLAMAR:
            if (typeof window.deseleccionarElemento === 'function') {
                window.deseleccionarElemento();
            } else {
                console.warn('❌ deseleccionarElemento no disponible');
            }
        }
    });

    map.on('contextmenu', function(e) {
        L.DomEvent.preventDefault(e);
        // Reemplazar menú contextual por menú radial
        if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
            window.MiRadial.selectedUnit = null;
            window.MiRadial.selectedHex = null;
            window.MiRadial.mostrarMenu(e.containerPoint.x, e.containerPoint.y, 'map', e.latlng);
        } else {
            console.warn('❌ MiRadial no disponible para menú contextual del map');
        }
    });
}



// FUNCIÓN consolidarEventListeners() - AGREGAR ANTES DEL DOMContentLoaded
function consolidarEventListeners() {
    console.log("Consolidando event listeners del map...");
    
    const elementos = [
        // Controles de cuadrícula
        { id: 'opacitySlider', evento: 'input', handler: actualizarEstiloCuadricula },
        { id: 'colorSelector', evento: 'input', handler: actualizarEstiloCuadricula },
        { id: 'gridWidthSlider', evento: 'input', handler: actualizarEstiloCuadricula },
        
        // Control de coordenadas
        { id: 'coordenadasCheckbox', evento: 'change', handler: toggleCursorCoordinates }
    ];
    
    // Event listeners individuales
    elementos.forEach(({ id, evento, handler }) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            // Remover listeners previos para evitar duplicación
            elemento.removeEventListener(evento, handler);
            elemento.addEventListener(evento, handler);
            console.log(`✅ Event listener configurado: ${id} -> ${evento}`);
        } else {
            console.warn(`⚠️ Elemento '${id}' no encontrado en el DOM`);
        }
    });
    
    // Event listeners para cambio de map
    const mapButtons = document.querySelectorAll('[data-map-type]');
    mapButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const mapType = this.getAttribute('data-map-type');
            cambiarTipoMapa(mapType);
        });
    });
    
    // Event listeners para tipos de cuadrícula
    const tiposCuadricula = document.querySelectorAll('#tipoCuadriculaBtn > div');
    tiposCuadricula.forEach(function(tipo) {
        tipo.addEventListener('click', function() {
            cambiarCuadricula(this.textContent.trim());
        });
    });
    
    console.log("Event listeners consolidados correctamente");
}

// 🎮 FUNCIONALIDADES 3D INTEGRADAS DIRECTAMENTE
function inicializarFuncionalidades3D() {
    console.log('🎮 Integrando funcionalidades 3D en map base...');
    
    // Solo inicializar si no existe ya
    if (window.visorMapa3D) {
        console.log('⚠️ Funcionalidades 3D ya inicializadas');
        return;
    }
    
    // Verificar si las clases 3D están disponibles
    if (typeof VisorMapa3DMejorado !== 'undefined') {
        try {
            // Crear instancia usando el map existente
            window.visorMapa3D = new VisorMapa3DMejorado('map');
            console.log('✅ Funcionalidades 3D integradas correctamente');
            
            // Agregar controles 3D al menú existente
            agregarControles3DAlMenu();
            
        } catch (error) {
            console.error('❌ Error integrando funcionalidades 3D:', error);
        }
    } else {
        console.warn('⚠️ Clases 3D no disponibles - funcionalidades limitadas');
    }
}

// 🎛️ AGREGAR CONTROLES 3D AL MENÚ EXISTENTE
function agregarControles3DAlMenu() {
    // === ELIMINADO: BOTONES 3D DUPLICADOS ===
    // Los botones 3D en zoom control y menú herramientas fueron eliminados
    // SOLO se usa el botón único en el menú lateral de planeamiento.html (#btnVista3D)
    // Ver: TRABAJO_PENDIENTE.md - Unificación Botón Vista 3D
    console.log('✅ Botones 3D duplicados eliminados - usar #btnVista3D del menú lateral');
}

// DOMContentLoaded SIMPLIFICADO Y OPTIMIZADO - ACTIVO (map base para planeamiento)
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM completamente cargado. Iniciando configuración del map...");   
    
    // Inicializar map
    inicializarMapa();
    
    // Consolidar TODOS los event listeners en una sola función
    consolidarEventListeners();
    
    console.log("Configuración del map completada");
});

// Función para cambiar el tipo de map
function cambiarTipoMapa(mapType) {
    console.log("Cambiando tipo de map a: " + mapType);
    currentMapType = mapType; // Actualizar tipo actual
    
    map.eachLayer(function (layer) {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
  
    switch (mapType) {
        case 'osm':
            capaOSM.addTo(map);
            break;
        case 'calles':
            capaCalles.addTo(map);
            break;
        case 'satelite':
            capaSatelite.addTo(map);
            break;
        case 'Transport':
            capaTransport.addTo(map);
            break;
        case 'Landscape':
            capaLandscape.addTo(map);
            break;
        case 'Outdoors':
            capaOutdoors.addTo(map);
            break;
    }
}

// Función para mostrar/ocultar las coordenadas del cursor
function toggleCursorCoordinates() {
    var checkbox = document.getElementById('coordenadasCheckbox');
    if (checkbox.checked) {
        map.on('mousemove', updateCoordinates);
    } else {
        map.off('mousemove', updateCoordinates);
        document.getElementById('coordenadas').innerHTML = '';
    }
}

// ❌ DEPRECADO: Menú contextual antiguo - NO USAR
// Se reemplazó completamente por MiRadial (menú radial)
// Mantener código comentado solo por referencia histórica
/*
function mostrarMenuContextual(e) {
    L.DomEvent.preventDefault(e);
    var menuContextual = L.DomUtil.create('div', 'menu-contextual', document.body);
    menuContextual.innerHTML = `
        <button onclick="editarElementoSeleccionado()">Editar elemento</button>
        <button onclick="eliminarElementoSeleccionado()">Eliminar elemento</button>
    `;
    menuContextual.style.position = 'absolute';
    menuContextual.style.left = e.containerPoint.x + 'px';
    menuContextual.style.top = e.containerPoint.y + 'px';

    document.addEventListener('click', function cerrarMenu() {
        if (document.body.contains(menuContextual)) {
            document.body.removeChild(menuContextual);
        }
        document.removeEventListener('click', cerrarMenu);
    });
}
*/

function cambiarCuadricula(tipo) {
    if (gridLayer) {
        map.removeLayer(gridLayer);
    }

    var options = {
        opacity: parseFloat(document.getElementById('opacitySlider').value),
        color: document.getElementById('colorSelector').value,
        weight: parseFloat(document.getElementById('gridWidthSlider').value)
    };

    switch(tipo) {
        case 'MGRS':
            gridLayer = new L.GridLayer.MGRS(options);
            break;
        case 'UTM':
            gridLayer = new L.GridLayer.UTM(options);
            break;
        case 'WGS84':
            gridLayer = new L.LatLngGraticule(Object.assign({}, options, {
                showLabel: true,
                zoomInterval: [
                    {start: 2, end: 3, interval: 30},
                    {start: 4, end: 5, interval: 10},
                    {start: 6, end: 7, interval: 5},
                    {start: 8, end: 9, interval: 1},
                    {start: 10, end: 11, interval: 0.5},
                    {start: 12, end: 13, interval: 0.25},
                    {start: 14, end: 15, interval: 0.1},
                    {start: 16, end: 17, interval: 0.05},
                    {start: 18, end: 19, interval: 0.01},
                    {start: 20, end: 21, interval: 0.005},
                    {start: 22, end: 30, interval: 0.001}
                ]
            }));
            break;
        case 'Planas':
            gridLayer = new L.GridLayer.GaussKruger(options);
            break;
        default:
            console.error('Tipo de cuadrícula no reconocido:', tipo);
            return;
    }

    if (gridLayer) {
        gridLayer.addTo(map);
        currentCoordinateSystem = tipo;
    }

    actualizarEstiloCuadricula();
}

function dibujarElemento(tipo, sidc = null,nombre = '') {
    let opciones = {
        color: 'black',
        weight: 3,
        opacity: 0.7,
        fill: tipo === 'poligono',
        fillOpacity: 0.2
    };

    let puntos = [];
    let elemento;

    map.on('click', agregarPunto);
    map.once('dblclick', finalizarDibujo);

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
                default:
                    console.error('Tipo de elemento no reconocido:', tipo);
                    return;
            }
        } else {
            elemento.setLatLngs(puntos);
        }
    }

    function finalizarDibujo(e) {
        // Para polígonos, necesitamos al menos 3 puntos
        if (tipo === 'poligono' && puntos.length < 3) {
            console.warn('⚠️ Se necesitan al menos 3 puntos para crear un polígono');
            return; // No finalizamos si no hay suficientes puntos
        }
        
        map.off('click', agregarPunto);
        map.off('dblclick', finalizarDibujo);

        if (tipo === 'linea' || tipo === 'lineaConTexto') {
            elemento.options.nombre = nombre || 'Línea sin nombre';
            let textoMarcador = L.marker(elemento.getCenter(), {
                icon: L.divIcon({
                    className: 'texto-linea',
                    html: `<div style="color: black; pointer-events: auto; cursor: move;">${elemento.options.nombre}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,  // ✅ HACER DRAGGABLE
                interactive: true  // ✅ HACER INTERACTIVE
            }).addTo(calcoActivo);
            
            // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
            textoMarcador.on('click', function(e) {
                console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
                if (typeof window.seleccionarElemento === 'function') {
                    window.seleccionarElemento(elemento);
                } else {
                    window.elementoSeleccionado = elemento;
                }
                e.originalEvent.stopPropagation();
            });
            
            textoMarcador.on('dblclick', function(e) {
                console.log('🎯 Doble click en textoMarcador - editando elemento padre');
                if (typeof editarElementoSeleccionado === 'function') {
                    window.elementoSeleccionado = elemento;
                    editarElementoSeleccionado();
                }
                e.originalEvent.stopPropagation();
            });
            
            elemento.textoMarcador = textoMarcador;
        }
        if (tipo === 'poligono') {
            elemento.options.nombre = nombre || 'Polígono sin nombre';
            let textoMarcador = L.marker(elemento.getBounds().getCenter(), {
                icon: L.divIcon({
                    className: 'texto-poligono',
                    html: `<div style="color: black; pointer-events: auto; cursor: move;">${elemento.options.nombre}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,  // ✅ HACER DRAGGABLE
                interactive: true  // ✅ HACER INTERACTIVE
            }).addTo(calcoActivo);
            
            // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
            textoMarcador.on('click', function(e) {
                console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
                if (typeof window.seleccionarElemento === 'function') {
                    window.seleccionarElemento(elemento);
                } else {
                    window.elementoSeleccionado = elemento;
                }
                e.originalEvent.stopPropagation();
            });
            
            textoMarcador.on('dblclick', function(e) {
                console.log('🎯 Doble click en textoMarcador - editando elemento padre');
                if (typeof editarElementoSeleccionado === 'function') {
                    window.elementoSeleccionado = elemento;
                    editarElementoSeleccionado();
                }
                e.originalEvent.stopPropagation();
            });
            
            elemento.textoMarcador = textoMarcador;
        }
        if (tipo === 'lineaSIDC' && sidc) {
            let puntos = elemento.getLatLngs();
            for (let i = 0; i < puntos.length - 1; i++) {
                let punto = L.GeometryUtil.interpolateOnLine(map, [puntos[i], puntos[i+1]], 0.5);
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
        

        // Event handler para selección con verificación de disponibilidad
        elemento.on('click', function(e) {
            console.log('🎯 Click en elemento creado:', this.constructor.name);
            L.DomEvent.stopPropagation(e);
            if (typeof window.seleccionarElemento === 'function') {
                window.seleccionarElemento(this);
            } else if (window.mapInteractionHandler && window.mapInteractionHandler.seleccionarElemento) {
                window.mapInteractionHandler.seleccionarElemento(this);
            } else {
                console.warn('⚠️ Sistema de selección no disponible');
                window.elementoSeleccionado = this;
            }
        });

        if (typeof registrarAccion === 'function') {
            registrarAccion({
                tipo: `agregar${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
                elemento: elemento
            });
        }
    

        elemento.on('edit', function() {
            if (this.textoMarcador) {
                if (this instanceof L.Polyline) {
                    this.textoMarcador.setLatLng(this.getCenter());
                } else if (this instanceof L.Polygon) {
                    this.textoMarcador.setLatLng(this.getBounds().getCenter());
                }
            }
        });
    }
}
    
function createGridLayer(type, options) {
        switch(type) {
            case 'MGRS':
                return new L.GridLayer.MGRS(options);
            case 'UTM':
                return new L.GridLayer.UTM(options);
            case 'Planas':
                return new L.GridLayer.GaussKruger(options);
            case 'WGS84':
                return new L.LatLngGraticule(Object.assign({}, options, {
                    font: 'bold 12px Arial',
                    showLabel: true,
                    color: '#333',
                    weight: 1.5,
                    opacity: 0.7,
                    zoomInterval: [
                        {start: 2, end: 3, interval: 30},
                        {start: 4, end: 5, interval: 10},
                        {start: 6, end: 7, interval: 5},
                        {start: 8, end: 9, interval: 1},
                        {start: 10, end: 11, interval: 0.5},
                        {start: 12, end: 13, interval: 0.25},
                        {start: 14, end: 15, interval: 0.1},
                        {start: 16, end: 17, interval: 0.05},
                        {start: 18, end: 19, interval: 0.01},
                        {start: 20, end: 21, interval: 0.005},
                        {start: 22, end: 30, interval: 0.001}
                    ]
                }));
            default:
                return null;
        }
    }
        
function updateCoordinates(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        if (!isFinite(lat) || !isFinite(lng)) {
            console.error('Coordenadas inválidas:', lat, lng);
            return;
        }
    
        var coordText = 'Lat: ' + lat.toFixed(5) + ', Lng: ' + lng.toFixed(5);
    
        if (currentCoordinateSystem) {
            switch (currentCoordinateSystem) {
                case 'MGRS':
                    var mgrsCoord = mgrs.forward([lng, lat]);
                    coordText += '<br>MGRS: ' + mgrsCoord;
                    break;
                    case 'UTM':
                        var utmResult = proj4(proj4.defs('EPSG:4326'), proj4.defs('EPSG:32633'), [lng, lat]);
                        var zone = Math.floor((lng + 180) / 6) + 1;
                        var hemisphere = lat >= 0 ? 'N' : 'S';
                        coordText += '<br>UTM: ' + zone + hemisphere + ' ' + 
                                        Math.abs(utmResult[0]).toFixed(0) + 'E ' + 
                                        Math.abs(utmResult[1]).toFixed(0) + 'N';
                        break;
                case 'Planas':
                    var fajaGK = seleccionarFajaGK(lng);
                    if (fajaGK) {
                        var gkCoord = proj4('EPSG:4326', fajaGK, [lng, lat]);
                        coordText += '<br>Planas: ' + gkCoord[0].toFixed(2) + 'E ' + gkCoord[1].toFixed(2) + 'N';
                        coordText += ' (Faja ' + fajaGK.split(':')[1] + ')';
                    }
                    break;
            }
        }
    
        document.getElementById('coordenadas').innerHTML = coordText;
    }

function actualizarEstiloCuadricula() {
        if (!gridLayer) return;
    
        var opacidad = parseFloat(document.getElementById('opacitySlider').value);
        var color = document.getElementById('colorSelector').value;
        var ancho = parseFloat(document.getElementById('gridWidthSlider').value);
    
        var nuevoEstilo = {
            opacity: opacidad,
            color: color,
            weight: ancho
        };
    
        if (gridLayer instanceof L.LatLngGraticule) {
            gridLayer.setStyle(nuevoEstilo);
            gridLayer.redraw();
        } else if (gridLayer instanceof L.GridLayer) {
            gridLayer.options.style = nuevoEstilo;
            gridLayer.redraw();
        }
    
        // Actualizar el estilo de las líneas de la cuadrícula
        var gridLines = document.querySelectorAll('.leaflet-tile-pane .leaflet-layer path');
        gridLines.forEach(function(line) {
            line.style.stroke = color;
            line.style.strokeOpacity = opacidad;
            line.style.strokeWidth = ancho + 'px';
        });
    
        // Actualizar el estilo de las etiquetas de la cuadrícula
        var gridLabels = document.querySelectorAll('.grid-label-text');
        gridLabels.forEach(function(label) {
            label.style.color = color;
            label.style.textShadow = '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff';
            label.style.opacity = opacidad;
        });
    }

function seleccionarFajaGK(longitud) {
    if (longitud >= -73.5 && longitud < -70.5) return "EPSG:5344";
    else if (longitud >= -70.5 && longitud < -67.5) return "EPSG:5345";
    else if (longitud >= -67.5 && longitud < -64.5) return "EPSG:5346";
    else if (longitud >= -64.5 && longitud < -61.5) return "EPSG:5347";
    else if (longitud >= -61.5 && longitud < -58.5) return "EPSG:5348";
    else if (longitud >= -58.5 && longitud < -55.5) return "EPSG:5349";
    else if (longitud >= -55.5 && longitud < -52.5) return "EPSG:5350";
    else return null; // Fuera del rango de Argentina
}

// Función para actualizar las coordenadas en el sistema Gauss-Krüger
function actualizarCoordenadasGK(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    var fajaGK = seleccionarFajaGK(lng);
    
    if (fajaGK) {
        var gkCoord = proj4('EPSG:4326', fajaGK, [lng, lat]);
        var coordText = 'Lat: ' + lat.toFixed(5) + ', Lng: ' + lng.toFixed(5);
        coordText += ' | GK: ' + gkCoord[0].toFixed(2) + 'E ' + gkCoord[1].toFixed(2) + 'N';
        coordText += ' (Faja ' + fajaGK.split(':')[1] + ')';
        
        document.getElementById('coordenadas').innerHTML = coordText;
    } else {
        document.getElementById('coordenadas').innerHTML = 'Fuera del rango de Argentina';
    }
}

// Función para crear la capa de cuadrícula Gauss-Krüger
function crearCapaGK(options) {
    return L.GridLayer.extend({
        createTile: function(coords) {
            var tile = L.DomUtil.create('div', 'leaflet-tile');
            var size = this.getTileSize();
            tile.style.width = size.x + 'px';
            tile.style.height = size.y + 'px';
            
            var nw = this._map.unproject([coords.x * size.x, coords.y * size.y], coords.z);
            var se = this._map.unproject([(coords.x + 1) * size.x, (coords.y + 1) * size.y], coords.z);
            
            var fajaGK = seleccionarFajaGK((nw.lng + se.lng) / 2);
            
            if (fajaGK) {
                try {
                    var gkNW = proj4('EPSG:4326', fajaGK, [nw.lng, nw.lat]);
                    var gkSE = proj4('EPSG:4326', fajaGK, [se.lng, se.lat]);
                    
                    var canvas = document.createElement('canvas');
                    canvas.width = size.x;
                    canvas.height = size.y;
                    var ctx = canvas.getContext('2d');
                    ctx.strokeStyle = options.color || 'rgba(0,0,0,0.3)';
                    ctx.lineWidth = options.weight || 1;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(size.x, 0);
                    ctx.lineTo(size.x, size.y);
                    ctx.lineTo(0, size.y);
                    ctx.closePath();
                    ctx.stroke();
            
                    tile.appendChild(canvas);
                    
                    tile.innerHTML += '<span style="font-size: 10px; position: absolute; top: 0; left: 0; background-color: rgba(255,255,255,0.5); padding: 2px;">' + 
                        gkNW[0].toFixed(0) + ',' + gkNW[1].toFixed(0) + '</span>';
                } catch (error) {
                    console.error('Error al crear tile Gauss-Krüger:', error);
                }
            }
            
            return tile;
        }
    });
}





// FUNCIONES GLOBALES
function getCurrentMapType() {
    return currentMapType;
}

// window.mostrarMenuContextual = mostrarMenuContextual; // ❌ ELIMINADO - usar MiRadial
window.actualizarEstiloCuadricula = actualizarEstiloCuadricula;
window.cambiarCuadricula = cambiarCuadricula;
window.habilitarDobleClicEnElementos = habilitarDobleClicEnElementos;
window.patronesRelleno = {}; // Inicializa el objeto para los patrones
window.inicializarMapa = inicializarMapa;
window.cambiarTipoMapa = cambiarTipoMapa;
window.getCurrentMapType = getCurrentMapType;

