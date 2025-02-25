// simbolosP.js

// Función para buscar símbolos
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

// Función para recopilar elementos buscables
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

// Función para mostrar los resultados de la búsqueda
function mostrarResultadosBusqueda(resultados) {
    var resultadosBusquedaDiv = document.getElementById('resultadosBusquedaSimbolos');
    resultados.slice(0, 6).forEach(function(resultado) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = resultado.texto;

        if (resultado.sidc) {
            var symbol = new ms.Symbol(resultado.sidc, {size: 30});
            var img = document.createElement('img');
            img.src = symbol.toDataURL();
            img.alt = resultado.texto;
            img.style.marginRight = '10px';
            a.prepend(img);
            a.onclick = function() { agregarMarcador(resultado.sidc, resultado.texto); };
        } else if (resultado.onclick) {
            a.setAttribute('onclick', resultado.onclick);
        }

        li.appendChild(a);
        resultadosBusquedaDiv.appendChild(li);
    });
}

// Función para actualizar el SIDC (Symbol Identification Code)
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
            if (span) {
                var symbol = new ms.Symbol(newSidc, {size: 30});
                span.innerHTML = symbol.asSVG();
            }
            
            if (element.hasAttribute('onclick')) {
                var originalOnclick = element.getAttribute('onclick');
                var newOnclick = originalOnclick.replace(originalSidc, newSidc);
                element.setAttribute('onclick', newOnclick);
            }
        }
    });
}

// Función para inicializar los botones de amigo/enemigo
function inicializarBotonesAmigoEnemigo() {
    var amigoButton = document.querySelector('.botones-fuerza button:nth-child(1)');
    var enemigoButton = document.querySelector('.botones-fuerza button:nth-child(2)');
  
    if (amigoButton) {
        amigoButton.addEventListener('click', function() {
            this.classList.add('active-amigo');
            enemigoButton.classList.remove('active-enemigo');
            actualizarSidc('F');
        });
    } else {
        console.warn('Botón de fuerza amiga no encontrado');
    }
  
    if (enemigoButton) {
        enemigoButton.addEventListener('click', function() {
            this.classList.add('active-enemigo');
            amigoButton.classList.remove('active-amigo');
            actualizarSidc('J');
        });
    } else {
        console.warn('Botón de fuerza enemiga no encontrado');
    }
}

window.agregarMarcador = function(sidc, nombre) {
    // 1. Validación inicial modo y permisos
    const modoJuegoGuerra = window.gestorJuego?.gestorAcciones !== undefined;
    if (modoJuegoGuerra) {
        const fase = window.gestorJuego?.gestorFases?.fase;
        const subfase = window.gestorJuego?.gestorFases?.subfase;
        
        if (fase !== 'preparacion' || subfase !== 'despliegue') {
            window.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'Solo puedes agregar unidades en fase de despliegue', 
                'error'
            );
            return;
        }
        
        if (!window.gestorJuego.gestorAcciones.validarDespliegueUnidad()) {
            return;
        }
    }

    // 2. Handler para click en mapa
    window.mapa.once('click', function(event) {
        const latlng = event.latlng;

        // 3. Validación zona despliegue
        if (modoJuegoGuerra) {
            const zonaEquipo = window.gestorJuego?.gestorFases?.zonasDespliegue[window.equipoJugador];
            if (!zonaEquipo?.contains(latlng)) {
                window.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                    'Solo puedes desplegar unidades en tu zona asignada',
                    'error'
                );
                return;
            }
        }

        // 4. Configuración SIDC y símbolo
        let sidcFormateado = sidc.padEnd(15, '-');
        if (modoJuegoGuerra) {
            const sidcArray = sidcFormateado.split('');
            sidcArray[1] = window.equipoJugador === 'azul' ? 'F' : 'H';
            sidcFormateado = sidcArray.join('');
        }

        const sym = new ms.Symbol(sidcFormateado, { 
            size: 35,
            uniqueDesignation: ''
        });

        // 5. Crear marcador con propiedades específicas según modo
        const marcador = L.marker(latlng, {
            icon: L.divIcon({
                className: modoJuegoGuerra ? 
                    `custom-div-icon equipo-${window.equipoJugador}` : 
                    'elemento-militar',
                html: sym.asSVG(),
                iconSize: [70, 50],
                iconAnchor: [35, 25]
            }),
            draggable: modoJuegoGuerra ? 
                window.gestorJuego?.gestorFases?.fase === 'preparacion' : 
                true,
            sidc: sidcFormateado,
            nombre: nombre || '',
            ...(modoJuegoGuerra && {
                jugador: window.userId,
                equipo: window.equipoJugador,
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                designacion: '',
                dependencia: '',
                magnitud: sidcFormateado.charAt(11) || '-',
                estado: 'operativo'
            })
        });

        // 6. Configurar eventos según modo
        marcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.elementoSeleccionado = this;
            window.seleccionarElemento(this);
        });

        if (modoJuegoGuerra) {
            // Eventos específicos juego guerra
            marcador.on('dblclick', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                window.elementoSeleccionado = this;
                if (window.MiRadial) {
                    window.MiRadial.selectedUnit = this;
                    window.MiRadial.selectedHex = null;
                    const point = window.mapa.latLngToContainerPoint(e.latlng);
                    window.MiRadial.mostrarMenu(point.x, point.y, 'elemento');
                }
            });

            marcador.on('contextmenu', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                return false;
            });

            marcador.on('dragstart', function() {
                if (window.gestorJuego?.gestorFases?.fase !== 'preparacion') {
                    return false;
                }
                this._origLatLng = this.getLatLng();
            });

            marcador.on('drag', function(e) {
                if (window.gestorJuego?.gestorFases?.fase !== 'preparacion') {
                    this.setLatLng(this._origLatLng);
                    return;
                }
                const nuevaPosicion = e.latlng;
                const zonaEquipo = window.gestorJuego?.gestorFases?.zonasDespliegue[window.equipoJugador];
                if (!zonaEquipo?.contains(nuevaPosicion)) {
                    this.setLatLng(this._origLatLng);
                    window.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                        'No puedes mover unidades fuera de tu zona', 
                        'warning'
                    );
                }
            });
        } else {
            marcador.on('contextmenu', window.mostrarMenuContextual);
        }

        // 7. Agregar al mapa y notificar
        window.calcoActivo.addLayer(marcador);

        if (modoJuegoGuerra) {
            window.gestorJuego.gestorAcciones.configurarEventosElemento(marcador);
            window.gestorUnidades?.agregarUnidad(marcador);
            
            window.gestorJuego.gestorComunicacion?.socket?.emit('elementoCreado', {
                tipo: 'unidad',
                datos: {
                    id: marcador.options.id,
                    sidc: marcador.options.sidc,
                    nombre: marcador.options.nombre,
                    posicion: marcador.getLatLng(),
                    equipo: marcador.options.equipo,
                    jugador: marcador.options.jugador,
                    designacion: marcador.options.designacion,
                    dependencia: marcador.options.dependencia,
                    magnitud: marcador.options.magnitud
                },
                jugadorId: window.userId,
                partidaCodigo: window.codigoPartida
            });
        }
    });
};


// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando funcionalidades de símbolos");
    
    var busquedaSimboloInput = document.getElementById('busquedaSimbolo');
    var btnBuscarSimbolo = document.getElementById('btnBuscarSimbolo');
    
    if (busquedaSimboloInput) {
        busquedaSimboloInput.addEventListener('input', buscarSimbolo);
    } else {
        console.warn("Elemento 'busquedaSimbolo' no encontrado");
    }
    
    if (btnBuscarSimbolo) {
        btnBuscarSimbolo.addEventListener('click', buscarSimbolo);
    } else {
        console.warn("Elemento 'btnBuscarSimbolo' no encontrado");
    }

    inicializarBotonesAmigoEnemigo();
});

// Exportación de funciones para uso en otros archivos
window.buscarSimbolo = buscarSimbolo;
window.actualizarSidc = actualizarSidc;
window.agregarMarcador = agregarMarcador;
