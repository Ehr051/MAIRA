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

function agregarMarcador(sidc, nombre) {
    console.log("Agregando marcador con SIDC: " + sidc + " y nombre: " + nombre);
    mapa.once('click', function(event) {
        var latlng = event.latlng;
        
        if (sidc.length < 15) {
            sidc = sidc.padEnd(15, '-');
        } else if (sidc.length > 15) {
            sidc = sidc.substr(0, 15);
        }

        var sym = new ms.Symbol(sidc, {size: 35});

        var marcador = L.marker(latlng, {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: sym.asSVG(),
                iconSize: [70, 50],
                iconAnchor: [35, 25]
            }),
            draggable: true,
            sidc: sidc,
            nombre: nombre
        }).addTo(calcoActivo);

        marcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            seleccionarElemento(this);
        });

        marcador.off('dblclick').on('dblclick', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            mostrarMenuContextual(e);
        });

        marcador.on('contextmenu', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            mostrarMenuContextual(e);
        });

        console.log("Marcador agregado en", latlng);
        habilitarDobleClicEnElementos();
    });
}


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
