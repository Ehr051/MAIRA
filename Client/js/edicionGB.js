let panelEdicionActual = null;

/**
 * Estructura SIDC completa (15 posiciones):
 * Pos 1: Esquema de codificación (S)
 * Pos 2: Identidad (F,H,U,N,etc)
 * Pos 3: Dimensión batalla (P,A,G,S,U)
 * Pos 4: Estado (P,A)
 * Pos 5: Función ID 1 (U=Unidad)
 * Pos 6: Función ID 2 (C=Combate)
 * Pos 7: Función ID 3 (I,R,F=Inf,Cab,Art)
 * Pos 8: -
 * Pos 9-10: Modificadores (VA,HE,etc)
 * Pos 11-15: ---
 */
const unidadesMilitares = {
    "Armas": {
        "Infantería": {
            codigo: "UCI",
            tipos: {
                "a Pie": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-UCI---
                        "Paracaidista": "A",     // S-G-UCIA--
                        "De Montaña": "O",          // S-G-UCIO--
                        "De Asalto Aéreo": "S",     // S-G-UCIS--
                        "Naval": "N",        // S-G-UCIN--  
                    }
                },
                "Motorizada": {
                    codigo: "M",
                    caracteristicas: {
                        "--": ""                     // S-G-UCIM--
                    }
                },
                "Mecanizada": {
                    codigo: "Z",
                    caracteristicas: {
                        "--":""
                    }
                }
            }
        },
        "Caballería": {
            codigo: "UCR",
            tipos: {
                "Exploración": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-UCR---
                        "Paracaidista": "A",     // S-G-UCRA--
                        "De Montaña": "O"           // S-G-UCRO--
                    }
                },
                "Blindada": {
                    codigo: "VA",                    // S-G-UCRVA-
                    caracteristicas: {
                        "--": ""
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
                        "--": "",                    // S-G-UCF---
                        "De Montaña": "O",          // S-G-UCFO--
                        "Autopropulsada": "HE",     // S-G-UCFHE-
                        "Cohetes": "R"              // S-G-UCFR--
                    }
                },
                "Antiaérea": {
                    codigo: "AD",
                    caracteristicas: {
                        "--": "",                    // S-G-UCDM--
                        "Misiles": "M",             // S-G-UCDML-
                        "Autopropulsada": "HE"      // S-G-UCDH--
                    }
                }
            }
        },
        "Ingenieros": {
            codigo: "UCE",
            tipos: {
                "Combate": {
                    codigo: "C",
                    caracteristicas: {
                        "--": "",                    // S-G-UCE---
                        "De Montaña": "O",          // S-G-UCEO--
                        "Paracaidista": "A",   
                        "Mecanizado": "Z",          // S-G-UCEZ--
                        "Asalto Aéreo": "S"         // S-G-UCES--
                    }
                },
                "Construcción": {
                    codigo: "N",                    // Construction
                    caracteristicas: {
                        "--": ""                    // S-G-UCEN--
                    }
                }
            }
        },
        "Comunicaciones": {
                    codigo: "UUS",
                    tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUS---
                                "Área": "A",               // S-G-UUSA--
                                "Radio": "R",              // S-G-UUSR--
                                "Centro": "C",             // S-G-UUSC--
                                "Satélite": "RS",           // S-G-UUSRS-
                                "Soporte": "S"              // S-G-UUSS--
                            }
                        }
                    }
                },
        "Defensa Antiaérea": {
            codigo: "UCD",
            tipos: {
                "Misiles": {
                    codigo: "M",
                    caracteristicas: {
                        "--": "",                    // S-G-UCDM--
                        "Ligero": "L",              // S-G-UCDML-
                        "Pesado": "H"               // S-G-UCDMH-
                    }
                },
                "Cañones": {
                    codigo: "G",
                    caracteristicas: {
                        "--": ""                     // S-G-UCDG--
                    }
                }
            }
        }
    },
            "Servicios": {
            "Sanidad": {  // S-G-USM---
                codigo: "USM",
                tipos: {
                    "General": {
                        codigo: "",
                        caracteristicas: {
                            "--": "",                    // S-G-USM---
                            "Veterinaria": "V",         // S-G-USMV--
                            "Dental": "D",              // S-G-USMD--
                            "Psicológico": "P"          // S-G-USMP--
                        }
                    },
                }
            },
            
            "Abastecimiento": {  // S-G-USS---
                codigo: "USS",
                tipos: {
                    "General": {
                        codigo: "",
                        caracteristicas: {
                            "--": "",                    // S-G-USS---
                            "Clase I": "1",             // S-G-USS1--
                            "Clase II": "2",            // S-G-USS2--
                            "Clase III": "3",           // S-G-USS3--
                            "Clase V": "5"              // S-G-USS5--
                        }
                    },
                    
                }
            },
            "Transporte": {  // S-G-UST---
                codigo: "UST", 
                tipos: {
                    "General": {
                        codigo: "",
                        caracteristicas: {
                            "--": "",                    // S-G-UST---
                            "Motorizado": "M",          // S-G-USTMO-
                            "Ferroviario": "R",         // S-G-USTR--
                            "Naval": "S",               // S-G-USTS--
                            "Aéreo": "A"                // S-G-USTA--
                        }
                    }
                }
            },
            "Personal": {  // S-G-USA---
                codigo: "USA",
                tipos: {
                    "General": {
                        codigo: "",
                        caracteristicas: {
                            "--": "",                    // S-G-USA---
                            "Teatro": "T",               // S-G-USAT--
                            "Postal": "O",              // S-G-USAO--
                            "Mortuorio": "M",           // S-G-USAM--
                            "Religioso": "R"            // S-G-USAR--
                        }
                    }
                }
            },
            "Inteligencia": {
                codigo: "UUM",
                tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUM---
                                "Señales": "S",             // S-G-UUMS--
                                "Guerra Electrónica": "SE",  // S-G-UUMSE-
                                "Contrainteligencia": "C",   // S-G-UUMC--
                                "Radar": "RG",              // S-G-UUMRG-
                                "Meteorológica": "MO"       // S-G-UUMMO-
                            }
                        }
                    }
                },    
                "QBN": {  // Nuclear, Biológico, Químico
                    codigo: "UUA",
                    tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUA---
                                "Químico": "C",             // S-G-UUAC--
                                "Nuclear": "N",             // S-G-UUAN--
                                "Biológico": "B",           // S-G-UUAB--
                                "Descontaminación": "D"     // S-G-UUAD--
                            }
                        }
                    }
                },    
                "Policía Militar": {
                    codigo: "UUL",
                    tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUL---
                                "Criminal": "C",            // S-G-UULC--
                                "Seguridad": "S"            // S-G-UULS--
                            }
                        }
                    }
                },
                
                    "Topográfico": {
                        codigo: "UUT",
                        tipos: {
                            "General": {
                                codigo: "",
                                caracteristicas: {
                                    "--": "",                    // S-G-UUT---
                                    "Teatro": "T",               // S-G-UUTT--
                                    "Cuerpo": "C"               // S-G-UUTC--
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
    if (!elementoSeleccionadoGB?.options?.sidc) return '';

    let sidc = elementoSeleccionadoGB.options.sidc;
    const afiliacion = document.getElementById('afiliacion')?.value || 'F';
    const estado = document.getElementById('estado')?.value || 'P';
    
    // Safely get and validate category and arm
    const armaSelect = document.getElementById('arma');
    if (!armaSelect || !armaSelect.value || !armaSelect.value.includes('|')) {
        console.warn("Invalid 'arma' value or element not found:", armaSelect?.value);
        return sidc; // Return original SIDC to avoid errors
    }
    
    const [categoria, arma] = armaSelect.value.split('|');
    
    // Validate that category and arm exist in unidadesMilitares
    if (!unidadesMilitares[categoria] || !unidadesMilitares[categoria][arma]) {
        console.error(`Category '${categoria}' or arm '${arma}' not found in unidadesMilitares`);
        return sidc; // Return original SIDC to avoid errors
    }
    
    const tipo = document.getElementById('tipo')?.value || '';
    const caracteristica = document.getElementById('caracteristica')?.value || '';
    const magnitud = document.getElementById('magnitud')?.value || '-';

    console.log("Construyendo SIDC:", {
        sidc_original: sidc,
        afiliacion,
        estado,
        categoria,
        arma,
        tipo,
        caracteristica,
        magnitud
    });

    // Get codes with safety checks
    const codigoArma = unidadesMilitares[categoria][arma]?.codigo || '';
    
    // Also safely check tipo and caracteristica
    if (!unidadesMilitares[categoria][arma].tipos[tipo]) {
        console.warn(`Type '${tipo}' not found for arm '${arma}'`);
        return sidc;
    }
    
    const codigoTipo = unidadesMilitares[categoria][arma].tipos[tipo]?.codigo || '';
    const codigoCaracteristica = unidadesMilitares[categoria][arma].tipos[tipo].caracteristicas[caracteristica] || '';

    let centroParte = (codigoArma + codigoTipo + codigoCaracteristica).padEnd(6, '-');
    sidc = sidc.substr(0, 1) + afiliacion + sidc.substr(2, 1) + estado + centroParte;

    let modificador = '-';
    if (document.getElementById('puestoComando')?.checked && document.getElementById('fuerzaTarea')?.checked) {
        modificador = 'B';
    } else if (document.getElementById('puestoComando')?.checked) {
        modificador = 'A';
    } else if (document.getElementById('fuerzaTarea')?.checked) {
        modificador = 'E';
    }
    
    console.log("SIDC intermedio:", sidc, "Modificador:", modificador, "Magnitud:", magnitud);
    
    // Place modifier and magnitude in correct positions
    sidc = sidc.substr(0, 10) + modificador + magnitud + sidc.substr(12);
    
    console.log("SIDC final:", sidc);

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

/**
 * Función mejorada para guardar los cambios en una unidad con DB
 * @param {Element} elemento - Elemento al que aplicar los cambios
 * @returns {boolean} - Éxito de la operación
 */
function guardarCambiosUnidad() {
    console.log("Intentando guardar cambios de unidad");
    return guardarCambiosUnidadGB();  // Delegate to the GB version
}

function guardarCambiosUnidadGB() {
    console.log("Guardando cambios de unidad en modo GB");
    
    if (!window.elementoSeleccionadoGB && !window.elementoSeleccionado) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return false;
    }

    // Use whichever reference is available
    const elemento = window.elementoSeleccionadoGB || window.elementoSeleccionado;

    try {
        // Get the updated SIDC with all changes
        const nuevoSidc = obtenerSIDCActual();
        console.log("SIDC generado:", nuevoSidc);
        
        // Get values from form fields
        const designacion = document.getElementById('designacion').value;
        const dependencia = document.getElementById('dependencia').value;
        const tipo = obtenerTipoDeElemento(nuevoSidc);
        const magnitud = document.getElementById('magnitud').value;
        const esEquipoActual = typeof window.esEquipo === 'function' ? 
                              window.esEquipo(nuevoSidc) : 
                              nuevoSidc.charAt(4) === 'E';
        
        // Preserve important original IDs
        const elementoOriginalId = elemento.options.id;
        const jugadorOriginal = elemento.options.jugador || elemento.options.jugadorId || window.usuarioInfo?.id;
        const usuarioOriginal = elemento.options.usuario || window.usuarioInfo?.usuario || 'Usuario';
        
        // Save current position and other important data
        const posicionActual = elemento.getLatLng();
        const equipoElemento = elemento.options.equipo || window.equipoJugador;
        
        // Remove current marker from calco
        if (window.calcoActivo && window.calcoActivo.hasLayer(elemento)) {
            window.calcoActivo.removeLayer(elemento);
        }
        
        // Create new symbol with updated SIDC
        const sym = new ms.Symbol(nuevoSidc, { size: 35 });
        
        // Create new icon
        const icon = L.divIcon({
            className: `custom-div-icon equipo-${equipoElemento}`,
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        });
        
        // Create new marker with all updated properties
        // CRITICAL: Maintain ALL original identifiers
        const nuevoMarcador = L.marker(posicionActual, {
            icon: icon,
            draggable: false,
            id: elementoOriginalId,  // Keep original ID
            sidc: nuevoSidc,
            tipo: tipo,
            designacion: designacion,
            dependencia: dependencia,
            magnitud: !esEquipoActual ? magnitud : undefined,
            equipo: equipoElemento,
            jugador: jugadorOriginal,         // Preserve original player
            jugadorId: jugadorOriginal,       // Preserve original playerId
            usuarioId: jugadorOriginal,       // Preserve original userId
            usuario: usuarioOriginal,         // Preserve original username
            creador: jugadorOriginal,         // Preserve original creator
            isElementoMilitar: true
        });
        
        // Add new marker to calco
        nuevoMarcador.addTo(window.calcoActivo);
        
        // Configure events
        nuevoMarcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            if (typeof window.seleccionarElementoGB === 'function') {
                window.seleccionarElementoGB(this);
            }
        });
        
        nuevoMarcador.on('contextmenu', function(e) {
            L.DomEvent.stopPropagation(e);
            window.elementoSeleccionadoGB = this;
            window.elementoSeleccionado = this;
            if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
                window.MiRadial.mostrarMenu(
                    e.originalEvent.pageX,
                    e.originalEvent.pageY,
                    'elemento',
                    this
                );
            }
        });
        
        // Update label
        if (typeof actualizarEtiquetaUnidad === 'function') {
            actualizarEtiquetaUnidad(nuevoMarcador);
        }
        
        // Update selected element reference
        window.elementoSeleccionadoGB = nuevoMarcador;
        window.elementoSeleccionado = nuevoMarcador;
        
        // Create clean data structure to update elementosConectados
        // CRITICAL: Keep all identifiers consistent
        const datosElemento = {
            id: elementoOriginalId,
            sidc: nuevoSidc,
            designacion: designacion,
            dependencia: dependencia,
            magnitud: !esEquipoActual ? magnitud : undefined,
            elemento: {
                sidc: nuevoSidc,
                designacion: designacion,
                dependencia: dependencia,
                magnitud: !esEquipoActual ? magnitud : undefined,
            },
            posicion: {
                lat: posicionActual.lat,
                lng: posicionActual.lng,
                precision: 10,
                rumbo: 0,
                velocidad: 0
            },
            tipo: tipo,
            // Keep ALL identity data
            usuario: usuarioOriginal,
            usuarioId: jugadorOriginal,
            jugador: jugadorOriginal,
            jugadorId: jugadorOriginal,
            creador: jugadorOriginal,
            operacion: window.operacionActual || (window.MAIRA?.GestionBatalla?.operacionActual) || 'general',
            timestamp: new Date().toISOString(),
            conectado: true
        };
        
        // Update in elementosConectados
        if (window.elementosConectados && elementoOriginalId) {
            // If doesn't exist, create it
            if (!window.elementosConectados[elementoOriginalId]) {
                window.elementosConectados[elementoOriginalId] = {
                    datos: datosElemento,
                    marcador: nuevoMarcador
                };
            } else {
                // IMPORTANT: Preserve identity data when updating
                window.elementosConectados[elementoOriginalId].datos = {
                    ...window.elementosConectados[elementoOriginalId].datos,
                    ...datosElemento,
                    // Explicitly maintain these critical fields
                    id: elementoOriginalId,
                    usuario: usuarioOriginal,
                    usuarioId: jugadorOriginal,
                    jugadorId: jugadorOriginal,
                    jugador: jugadorOriginal,
                    creador: jugadorOriginal
                };
                window.elementosConectados[elementoOriginalId].marcador = nuevoMarcador;
            }
            
            // Sync with MAIRA central
            if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
                window.MAIRA.GestionBatalla.elementosConectados[elementoOriginalId] = window.elementosConectados[elementoOriginalId];
            }
            
            // If it's the user's own element, update global elementoTrabajo
            if (jugadorOriginal === window.usuarioInfo?.id) {
                // Update elementoTrabajo
                window.elementoTrabajo = {
                    ...window.elementoTrabajo,
                    sidc: nuevoSidc,
                    designacion: designacion,
                    dependencia: dependencia,
                    magnitud: !esEquipoActual ? magnitud : undefined
                };
                
                // Save to localStorage safely
                try {
                    localStorage.setItem('elemento_trabajo', JSON.stringify(window.elementoTrabajo));
                    
                    // Update reference in MAIRA
                    if (window.MAIRA && window.MAIRA.GestionBatalla) {
                        window.MAIRA.GestionBatalla.elementoTrabajo = window.elementoTrabajo;
                    }
                } catch (error) {
                    console.error("Error saving elementoTrabajo:", error);
                }
            }
            
            // Save all elements to localStorage for persistence
            if (typeof window.guardarElementosEnLocalStorage === 'function') {
                window.guardarElementosEnLocalStorage();
            }
        }
        
        // Close panel
        if (typeof window.cerrarPanelEdicion === 'function') {
            window.cerrarPanelEdicion('panelEdicionUnidad');
        }
        
        // Send to server using global function
        console.log("Sending updated element to server (with preserved identity data)");
        let enviado = false;
        
        if (typeof window.enviarElementoAlServidor === 'function') {
            enviado = window.enviarElementoAlServidor(nuevoMarcador);
        }
        
        // Update element in visual list
        if (typeof window.actualizarIconoEnLista === 'function') {
            window.actualizarIconoEnLista(elementoOriginalId, nuevoSidc);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving changes:', error);
        
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion("Error al guardar cambios: " + error.message, "error");
        }
        
        return false;
    }
}

function obtenerCamposFormularioUnidad() {
    return {
        sidc: obtenerSIDCActual(),
        designacion: document.getElementById('designacion').value,
        dependencia: document.getElementById('dependencia').value,
        magnitud: document.getElementById('magnitud').value
    };
}

function actualizarEtiquetaUnidad(elemento) {
    if (!elemento?.options) return;

    // Remover etiqueta existente
    if (elemento.etiquetaPersonalizada) {
        calcoActivo.removeLayer(elemento.etiquetaPersonalizada);
        elemento.etiquetaPersonalizada = null;
    }

    // Construir etiqueta con formato correcto
    const designacion = elemento.options.designacion || '';
    const dependencia = elemento.options.dependencia || '';
    let etiqueta = '';
    
    if (designacion && dependencia) {
        etiqueta = `${designacion}/${dependencia}`;
    } else if (designacion) {
        etiqueta = designacion;
    } else if (dependencia) {
        etiqueta = dependencia;
    }

    // No crear etiqueta si no hay texto
    if (!etiqueta.trim()) return;

    // Añadir estado reforzado/disminuido
    if (elemento.options.estado) {
        if (elemento.options.estado === 'reforzado') etiqueta += ' (+)';
        if (elemento.options.estado === 'disminuido') etiqueta += ' (-)';
    }

    // En lugar de crear un marcador separado, añadimos la etiqueta directamente al div icon
    // Para futuras manipulaciones, guardaremos referencia al texto original
    elemento.etiquetaTexto = etiqueta;
    
    // Función que actualiza la posición de la etiqueta basada en el zoom actual
    const actualizarPosicionEtiqueta = function() {
        if (!elemento || !elemento._icon) return;
        
        // Crear o actualizar el div de etiqueta
        let etiquetaDiv = elemento._icon.querySelector('.etiqueta-unidad');
        if (!etiquetaDiv) {
            etiquetaDiv = document.createElement('div');
            etiquetaDiv.className = 'etiqueta-unidad';
            etiquetaDiv.style = `
                position: absolute;
                bottom: -10px;
                right: -5px;
                color: black;
                font-weight: bold;
                white-space: nowrap;
                text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
                pointer-events: none;
                z-index: 1000;
            `;
            elemento._icon.appendChild(etiquetaDiv);
        }
        
        etiquetaDiv.textContent = elemento.etiquetaTexto;
    };
    
    // Aplicar inicialmente
    actualizarPosicionEtiqueta();
    
    // Actualizar cuando cambie el zoom
    elemento.off('add'); // Remover eventos previos
    elemento.on('add', actualizarPosicionEtiqueta);
    
    window.mapa.off('zoomend', actualizarPosicionEtiqueta);
    window.mapa.on('zoomend', actualizarPosicionEtiqueta);
}

function actualizarEtiquetaEquipo(elemento) {
    // Reutilizar la misma lógica para unidades y equipos
    actualizarEtiquetaUnidad(elemento);
}

function validarDatosElemento(designacion, dependencia) {
    return designacion?.trim() && dependencia?.trim();
}

function obtenerTipoDeElemento(sidc) {
    // Asegurarse de que el SIDC tiene al menos 15 caracteres
    if (!sidc || sidc.length < 15) {
        console.warn(`SIDC inválido o demasiado corto: ${sidc}`);
        return "desconocido";
    }

    try {
        // Extraer código (ejemplo: UCI, UCR, etc)
        // Asumimos que el código comienza en la posición 4 y tiene 3 caracteres
        const codigo = sidc.substring(4, 7);
        
        // Para equipos, la lógica puede ser diferente
        if (sidc.charAt(4) === 'E') {
            // Manejar equipos especialmente
            const codigoEquipo = sidc.substring(5, 7);
            
            // Mapeo de códigos de equipo a tipos
            const tiposEquipo = {
                'VA': 'vehiculo_armado',
                'VC': 'vehiculo_combate',
                'VU': 'vehiculo_utilitario',
                'AI': 'aeronave',
                'AH': 'helicoptero',
                // Añadir más mapeos según sea necesario
            };
            
            return tiposEquipo[codigoEquipo] || 'equipo_general';
        }
        
        // Buscar en unidadesMilitares
        for (const categoria in unidadesMilitares) {
            for (const arma in unidadesMilitares[categoria]) {
                if (unidadesMilitares[categoria][arma].codigo === codigo) {
                    return arma.toLowerCase();
                }
            }
        }
        
        // Si llegamos aquí y no encontramos un tipo, verificar códigos específicos
        switch(codigo) {
            case 'UCI':
                return 'infanteria';
            case 'UCR':
                return 'caballeria';
            case 'UCF':
                return 'artilleria';
            case 'UCE':
                return 'ingenieros';
            case 'UCD':
                return 'defensa_antiaerea';
            case 'UUS':
                return 'comunicaciones';
            case 'USM':
                return 'sanidad';
            case 'USS':
                return 'abastecimiento';
            case 'UST':
                return 'transporte';
            case 'USA':
                return 'personal';
            case 'UUM':
                return 'inteligencia';
            case 'UUA':
                return 'qbn';
            case 'UUL':
                return 'policia_militar';
            case 'UUT':
                return 'topografico';
            default:
                console.warn(`Código de unidad no reconocido: ${codigo} en SIDC: ${sidc}`);
                return "unidad_general";
        }
    } catch (error) {
        console.error(`Error al obtener tipo de elemento con SIDC: ${sidc}`, error);
        return "unidad_general";
    }
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
    if (!elementoSeleccionadoGB?.options?.sidc) return '';
    let sidc = elementoSeleccionadoGB.options.sidc;
    sidc = sidc.substr(0, 1) + document.getElementById('afiliacionEquipo').value + sidc.substr(2);
    return sidc;
}


function actualizarEstiloElemento() {
    if (!elementoSeleccionadoGB) return;

    var color = document.getElementById('colorLinea').value;
    var ancho = parseInt(document.getElementById('anchoLinea').value);
    var tipo = document.getElementById('tipoLinea').value;

    if (elementoSeleccionadoGB instanceof L.Path) {
        elementoSeleccionadoGB.setStyle({
            color: color,
            weight: ancho,
            dashArray: tipo === 'dashed' ? '5, 5' : null
        });
    } else if (elementoSeleccionadoGB.polyline) {
        elementoSeleccionadoGB.polyline.setStyle({
            color: color,
            weight: ancho,
            dashArray: tipo === 'dashed' ? '5, 5' : null
        });
    }

    elementoSeleccionadoGB.color = color;
    elementoSeleccionadoGB.ancho = ancho;
    elementoSeleccionadoGB.tipo = tipo;

    if (elementoSeleccionadoGB.id) {
        actualizarLinea(elementoSeleccionadoGB.id);
    }
}


function actualizarIconoUnidad(elemento) {
    if (!elemento || !elemento.options) {
        console.warn('Elemento no válido para actualizar ícono');
        return;
    }

    const sym = new ms.Symbol(elemento.options.sidc, {
        size: 35,
        uniqueDesignation: elemento.options.designacion || ''
    });

    const icon = L.divIcon({
        className: `custom-div-icon equipo-${elemento.options.equipo}`,
        html: sym.asSVG(),
        iconSize: [70, 50],
        iconAnchor: [35, 25]
    });

    elemento.setIcon(icon);
}













function configurarEventoReconexion() {
    if (socket) {
        socket.on('connect', function() {
            console.log("📡 Reconectado al servidor, sincronizando elementos");
            
            // Primero cargar y crear marcadores desde localStorage
            cargarElementosDesdeDB();
            
            // Esperar un momento para que la conexión se estabilice
            setTimeout(() => {
                // Limpiar duplicados
                limpiarElementosDuplicados();
                
                // Forzar sincronización completa
                if (typeof forzarSincronizacionElementos === 'function') {
                    forzarSincronizacionElementos();
                }
            }, 1000);
        });
    }
}



/**
 * Updates the icon in the elements list for an element with the specified ID and SIDC
 * @param {string} elementoId - ID of the element to update
 * @param {string} sidc - New SIDC (Symbol Identification Code) for the element
 */
function actualizarIconoEnLista(elementoId, sidc) {
    console.log(`Actualizando icono en lista para elemento ${elementoId} con SIDC ${sidc}`);
    
    // If element doesn't exist in the list, it might need to be created first
    let elementoItem = document.querySelector(`.elemento-item[data-id="${elementoId}"]`);
    
    // If element not found in the list but exists in elementosConectados, create it
    if (!elementoItem && window.elementosConectados && window.elementosConectados[elementoId]) {
        console.log(`Elemento no encontrado en la lista visual. Creando elemento para ${elementoId}`);
        
        // Get the container for the elements list
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) {
            console.error("Container 'lista-elementos' not found");
            return;
        }
        
        // Create a new element item
        const elementoData = window.elementosConectados[elementoId].datos;
        elementoItem = document.createElement('div');
        elementoItem.className = 'elemento-item';
        elementoItem.setAttribute('data-id', elementoId);
        
        // Determine connected status
        const estadoConexion = elementoData.conectado === false ? 'desconectado' : 'conectado';
        
        // Get element information
        const nombreUsuario = elementoData.usuario || 'Usuario';
        const designacion = elementoData.designacion || elementoData.elemento?.designacion || 'Elemento';
        const dependencia = elementoData.dependencia || elementoData.elemento?.dependencia || '';
        
        // Generate simple empty placeholder for now, we'll update the icon right after
        elementoItem.innerHTML = `
            <div class="elemento-icon">
                <div class="sidc-preview"></div>
            </div>
            <div class="elemento-info">
                <div class="elemento-nombre">${designacion}${dependencia ? '/' + dependencia : ''}</div>
                <div class="elemento-usuario">${nombreUsuario}</div>
            </div>
            <div class="elemento-estado">
                <span class="estado-conexion ${estadoConexion}" title="${estadoConexion}">
                    ${estadoConexion === 'conectado' ? '●' : '○'}
                </span>
            </div>
        `;
        
        // Add click event to select the element
        elementoItem.addEventListener('click', function() {
            if (typeof window.seleccionarElementoEnLista === 'function') {
                window.seleccionarElementoEnLista(elementoId);
            } else if (typeof window.MAIRA?.Elementos?.seleccionarElementoEnLista === 'function') {
                window.MAIRA.Elementos.seleccionarElementoEnLista(elementoId);
            }
        });
        
        // Add to the list
        listaElementos.appendChild(elementoItem);
        console.log(`Elemento visual creado para ${elementoId}`);
    }
    
    // Try again to find the element after possibly creating it
    if (!elementoItem) {
        elementoItem = document.querySelector(`.elemento-item[data-id="${elementoId}"]`);
    }
    
    // If still not found, abort
    if (!elementoItem) {
        console.warn(`No se pudo encontrar ni crear elemento visual para ID ${elementoId}`);
        return;
    }
    
    // Find the icon container
    const iconContainer = elementoItem.querySelector('.sidc-preview');
    if (!iconContainer) {
        console.warn("No se encontró contenedor para el icono '.sidc-preview'");
        return;
    }
    
    try {
        // Generate new icon using milsymbol library
        if (typeof ms !== 'undefined' && typeof ms.Symbol === 'function') {
            const sym = new ms.Symbol(sidc, {size: 20});
            iconContainer.innerHTML = sym.asSVG();
            console.log(`✅ Icono actualizado en la lista para SIDC ${sidc}`);
        } else {
            console.warn("Biblioteca milsymbol no disponible");
            // Fallback - use a simple colored box
            iconContainer.innerHTML = `<div style="width:20px;height:20px;background-color:#3388ff;border-radius:3px;"></div>`;
        }
        
        // Also update other data if needed
        const nombreElement = elementoItem.querySelector('.elemento-nombre');
        if (nombreElement && window.elementosConectados && window.elementosConectados[elementoId]) {
            const elementoData = window.elementosConectados[elementoId].datos;
            if (elementoData) {
                // Format name correctly
                const designacion = elementoData.designacion || elementoData.elemento?.designacion || '';
                const dependencia = elementoData.dependencia || elementoData.elemento?.dependencia || '';
                nombreElement.textContent = designacion + (dependencia ? '/' + dependencia : '');
            }
        }
    } catch (e) {
        console.error("Error al actualizar icono en lista:", e);
    }
    
    // Make sure the element is visible
    elementoItem.style.display = '';
}

// Make it available globally
window.actualizarIconoEnLista = actualizarIconoEnLista;



// Función auxiliar para actualizar el icono
function actualizarIconoGB(elemento, datos) {
    const sym = new ms.Symbol(datos.sidc, {
        size: 35,
        uniqueDesignation: datos.designacion
    });

    const icon = L.divIcon({
        className: 'simbolo-militar',
        html: sym.asSVG(),
        iconSize: [70, 50],
        iconAnchor: [35, 25]
    });

    // Actualizar propiedades
    elemento.setIcon(icon);
    elemento.options = {
        ...elemento.options,
        ...datos
    };

    // Actualizar etiqueta
    actualizarEtiquetaGB(elemento);
}



// Función auxiliar para preparar datos de elemento
function prepararDatosElemento(elemento) {
    const idUsuarioActual = 
        elemento.options?.usuarioId || 
        elemento.options?.jugadorId || 
        window.usuarioInfo?.id || 
        (window.MAIRA?.GestionBatalla?.usuarioInfo?.id);
    
    const operacionActual = 
        window.operacionActual || 
        window.MAIRA?.GestionBatalla?.operacionActual || 
        'general';
    
    return {
        id: elemento.options.id || `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sidc: elemento.options.sidc || 'SFGPUCI-----',
        designacion: elemento.options.designacion || elemento.options.nombre || 'Elemento sin nombre',
        dependencia: elemento.options.dependencia || '',
        magnitud: elemento.options.magnitud || '-',
        coordenadas: elemento.getLatLng(),
        tipo: elemento.options.tipo || 'unidad',
        usuario: elemento.options.usuario || window.usuarioInfo?.usuario || 'Usuario',
        usuarioId: idUsuarioActual,
        jugadorId: idUsuarioActual,
        operacion: operacionActual,
        timestamp: new Date().toISOString(),
        posicion: {
            lat: elemento.getLatLng().lat,
            lng: elemento.getLatLng().lng,
            precision: 10,
            rumbo: elemento.options.rumbo || 0,
            velocidad: 0
        },
        elemento: {
            sidc: elemento.options.sidc || 'SFGPUCI-----',
            designacion: elemento.options.designacion || elemento.options.nombre || '',
            dependencia: elemento.options.dependencia || '',
            magnitud: elemento.options.magnitud || '-'
        },
        conectado: true
    };
}

// Función para guardar elemento en localStorage
function guardarElementoLocalStorage(datosElemento) {
    try {
        // Cargar elementos actuales
        let elementosGuardados = {};
        const datosAlmacenados = localStorage.getItem('elementos_conectados');
        if (datosAlmacenados) {
            elementosGuardados = JSON.parse(datosAlmacenados);
        }
        
        // Actualizar elemento específico
        elementosGuardados[datosElemento.id] = {
            datos: datosElemento
        };
        
        // Guardar de vuelta en localStorage
        localStorage.setItem('elementos_conectados', JSON.stringify(elementosGuardados));
        console.log(`✅ Elemento ${datosElemento.id} guardado en localStorage correctamente`);
        
        return true;
    } catch (e) {
        console.error(`❌ Error al guardar elemento ${datosElemento.id} en localStorage:`, e);
        return false;
    }
}

// Función auxiliar mejorada para actualizar elementos localmente
function actualizarElementoConectadoLocal(datosElemento, marcador) {
    console.log("🔄 Actualizando elemento local:", datosElemento.id);
    
    // Si no existe el objeto elementosConectados, crearlo
    if (!window.elementosConectados) {
        window.elementosConectados = {};
    }
    
    // Guardar una referencia previa si existe
    const elementoExistentePrevio = window.elementosConectados[datosElemento.id] 
                                  ? JSON.parse(JSON.stringify(window.elementosConectados[datosElemento.id].datos)) 
                                  : null;
    
    // Si el elemento no existe, añadirlo
    if (!window.elementosConectados[datosElemento.id]) {
        window.elementosConectados[datosElemento.id] = {
            datos: datosElemento,
            marcador: marcador
        };
        console.log(`✅ Nuevo elemento añadido a elementosConectados: ${datosElemento.id}`);
    } else {
        // Si existe, mantener los datos SIDC, designación, etc. (no sobreescribir)
        if (elementoExistentePrevio && elementoExistentePrevio.sidc) {
            // Conservar los datos importantes anteriores que podrían perderse
            datosElemento.sidc = datosElemento.sidc || elementoExistentePrevio.sidc;
            datosElemento.designacion = datosElemento.designacion || elementoExistentePrevio.designacion;
            datosElemento.dependencia = datosElemento.dependencia || elementoExistentePrevio.dependencia;
            datosElemento.magnitud = datosElemento.magnitud || elementoExistentePrevio.magnitud;
            
            // También asegurar que elemento.sidc se mantiene
            if (datosElemento.elemento) {
                datosElemento.elemento.sidc = datosElemento.sidc;
                datosElemento.elemento.designacion = datosElemento.designacion;
                datosElemento.elemento.dependencia = datosElemento.dependencia;
                datosElemento.elemento.magnitud = datosElemento.magnitud;
            }
        }
        
        // Actualizar datos
        window.elementosConectados[datosElemento.id].datos = datosElemento;
        
        // Si el marcador es diferente, reemplazarlo
        if (window.elementosConectados[datosElemento.id].marcador !== marcador && marcador) {
            // Eliminar marcador anterior del mapa
            const marcadorAnterior = window.elementosConectados[datosElemento.id].marcador;
            if (marcadorAnterior && window.mapa) {
                if (window.mapa.hasLayer(marcadorAnterior)) {
                    window.mapa.removeLayer(marcadorAnterior);
                    console.log(`🔄 Marcador anterior eliminado del mapa`);
                }
            }
            
            window.elementosConectados[datosElemento.id].marcador = marcador;
            console.log(`✅ Marcador actualizado para elemento: ${datosElemento.id}`);
        }
    }
    
    // NUEVO: Guardar cambios en localStorage para mayor persistencia
    try {
        const elementosParaGuardar = {};
        
        // Solo guardar los datos, no los marcadores (no son serializables)
        Object.entries(window.elementosConectados).forEach(([id, elem]) => {
            elementosParaGuardar[id] = { datos: elem.datos };
        });
        
        localStorage.setItem('elementos_conectados', JSON.stringify(elementosParaGuardar));
        console.log("✅ Elementos conectados guardados en localStorage");
    } catch (e) {
        console.error("❌ Error al guardar elementos en localStorage:", e);
    }
    
    // Sincronizar con MAIRA.GestionBatalla
    if (window.MAIRA && window.MAIRA.GestionBatalla) {
        window.MAIRA.GestionBatalla.elementosConectados = window.elementosConectados;
    }
    
    // Si existe la función para actualizar la lista visual, usarla
    if (typeof window.MAIRA?.Elementos?.actualizarElementoVisual === 'function') {
        try {
            window.MAIRA.Elementos.actualizarElementoVisual(datosElemento.id);
            console.log(`✅ Interfaz visual actualizada para elemento: ${datosElemento.id}`);
        } catch (e) {
            console.error(`❌ Error al actualizar interfaz visual:`, e);
        }
    }
}

// Hacerla disponible globalmente
window.actualizarElementoConectadoLocal = actualizarElementoConectadoLocal;


function mostrarPanelEdicionMCC(elemento, tipo) {
    console.log("Mostrando panel de edición MCC para tipo:", tipo);
    mostrarPanelEdicion('panelEdicionMCC');
    
    let panel = document.getElementById('panelEdicionMCC');
    if (!panel) {
        console.error('Panel de edición MCC no encontrado');
        return;
    }

    // Eliminar cualquier textoAsociado existente y quedarse solo con textoMarcador
    if (elemento.textoAsociado && elemento.textoMarcador) {
        console.log("Eliminando textoAsociado duplicado antes de editar");
        calcoActivo.removeLayer(elemento.textoAsociado);
        elemento.textoAsociado = null;
    }

    // Obtener el texto actual del elemento
    let textoMCC = '';
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            textoMCC = divTexto.textContent;
        }
    } else if (elemento.textoAsociado && elemento.textoAsociado._icon) {
        const divTexto = elemento.textoAsociado._icon.querySelector('div');
        if (divTexto) {
            textoMCC = divTexto.textContent;
        }
    } else {
        textoMCC = elemento.options.nombre || elemento.nombre || '';
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

/**
 * Muestra el panel de edición de línea
 * @param {Object} elemento - El elemento de línea a editar
 */
function mostrarPanelEdicionLinea(elemento) {
    mostrarPanelEdicion('panelEdicionLinea');
    console.log("Mostrando panel de edición de línea para:", elemento);
    var panel = document.getElementById('panelEdicionLinea');
    if (!panel) {
        console.error('Panel de edición de línea no encontrado');
        return;
    }

    panel.style.display = 'block';
    elementoSeleccionadoGB = elemento;
    
    // Detectar nombre actual examinando todas las posibles fuentes
    let nombreActual = '';
    
    // Prioridad 1: Verificar textoMarcador
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            nombreActual = divTexto.textContent;
            console.log("Nombre obtenido de textoMarcador:", nombreActual);
        }
    }
    
    // Prioridad 2: Verificar textoAsociado
    if (!nombreActual && elemento.textoAsociado) {
        if (elemento.textoAsociado._icon) {
            const divTexto = elemento.textoAsociado._icon.querySelector('div');
            if (divTexto) {
                nombreActual = divTexto.textContent;
                console.log("Nombre obtenido de textoAsociado:", nombreActual);
            }
        }
    }
    
    // Prioridad 3: Verificar propiedades del elemento
    if (!nombreActual) {
        nombreActual = elemento.options?.nombre || elemento.nombre || '';
        console.log("Nombre obtenido de propiedades:", nombreActual);
    }

    document.getElementById('nombreLinea').value = nombreActual;
    document.getElementById('colorLinea').value = elemento.options?.color || elemento.color || '#3388ff';
    document.getElementById('anchoLinea').value = elemento.options?.weight || elemento.ancho || 3;
    document.getElementById('tipoLinea').value = (elemento.options?.dashArray || elemento.tipo === 'dashed') ? 'dashed' : 'solid';
}



function crearNuevoTextoMarcador(elemento, texto) {
    // Calcular posición adecuada
    let posicion;
    if (elemento instanceof L.Polygon) {
        posicion = elemento.getBounds().getCenter();
    } else if (elemento instanceof L.Polyline) {
        const latlngs = elemento.getLatLngs();
        posicion = latlngs[Math.floor(latlngs.length / 2)];
    } else {
        posicion = elemento.getLatLng();
    }
    
    // Crear el marcador con la clase correcta
    elemento.textoMarcador = L.marker(posicion, {
        icon: L.divIcon({
            className: elemento instanceof L.Polygon ? 'texto-poligono' : 'texto-linea',
            html: `<div style="color: black;">${texto}</div>`,
            iconSize: [100, 20]
        }),
        draggable: true,
        interactive: true
    }).addTo(window.calcoActivo);
    
    console.log("Nuevo textoMarcador creado:", elemento.textoMarcador);
    
    // Configurar eventos para mantener sincronización
    if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        elemento.on('edit', function() {
            if (this.textoMarcador) {
                let nuevaPos;
                if (this instanceof L.Polygon) {
                    nuevaPos = this.getBounds().getCenter();
                } else {
                    const pts = this.getLatLngs();
                    nuevaPos = pts[Math.floor(pts.length / 2)];
                }
                this.textoMarcador.setLatLng(nuevaPos);
            }
        });
    }
    
    return elemento.textoMarcador;
}

function actualizarTextoElemento(elemento, nuevoTexto, tipo) {
    console.log(`Actualizando texto de ${tipo} a "${nuevoTexto}"`);
    
    // 1. Eliminar textoAsociado si existe (para evitar duplicados)
    if (elemento.textoAsociado) {
        console.log("Eliminando textoAsociado existente");
        calcoActivo.removeLayer(elemento.textoAsociado);
        elemento.textoAsociado = null;
    }
    
    // 2. Verificar si existe un textoMarcador y actualizarlo
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        console.log("Actualizando textoMarcador existente");
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            divTexto.textContent = nuevoTexto;
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
            return; // Terminamos aquí
        }
    }
    
    // 3. Si no existe textoMarcador, creamos uno nuevo
    if (nuevoTexto.trim() !== '') {
        console.log("Creando nuevo textoMarcador");
        let posicion;
        
        if (tipo === 'poligono') {
            posicion = elemento.getBounds().getCenter();
        } else if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
            const latlngs = elemento.getLatLngs();
            posicion = latlngs[Math.floor(latlngs.length / 2)];
        } else {
            posicion = elemento.getLatLng();
        }
        
        // Crear textoMarcador en lugar de textoAsociado
        elemento.textoMarcador = L.marker(posicion, {
            icon: L.divIcon({
                className: tipo === 'poligono' ? 'texto-poligono' : 'texto-linea',
                html: `<div style="color: black;">${nuevoTexto}</div>`,
                iconSize: [100, 20]
            }),
            draggable: true,
            interactive: true
        }).addTo(calcoActivo);
        
        // Configurar eventos para mantener el texto en la línea/polígono
        if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha' || tipo === 'poligono') {
            elemento.on('edit', function() {
                if (this.textoMarcador) {
                    let nuevaPosicion;
                    if (this instanceof L.Polygon) {
                        nuevaPosicion = this.getBounds().getCenter();
                    } else if (this instanceof L.Polyline) {
                        const latlngs = this.getLatLngs();
                        nuevaPosicion = latlngs[Math.floor(latlngs.length / 2)];
                    }
                    this.textoMarcador.setLatLng(nuevaPosicion);
                }
            });
        }
    }
    
    // Actualizar el nombre del elemento
    elemento.options.nombre = nuevoTexto;
    elemento.nombre = nuevoTexto;
}

/**
 * Crea un textoMarcador para el elemento
 * @param {Object} elemento - El elemento al que se asociará el textoMarcador
 * @param {string} texto - El texto a mostrar
 */
function crearTextoMarcador(elemento, texto) {
    // Determinar la posición según el tipo de elemento
    let posicion;
    if (elemento instanceof L.Polygon) {
        posicion = elemento.getBounds().getCenter();
    } else if (elemento instanceof L.Polyline || elemento._latlngs) {
        const latlngs = elemento.getLatLngs();
        posicion = latlngs[Math.floor(latlngs.length / 2)];
    } else {
        posicion = window.mapa.getCenter();
    }
    
    // Determinar la clase CSS correcta
    let claseCss = 'texto-linea';
    if (elemento instanceof L.Polygon) {
        claseCss = 'texto-poligono';
    }
    
    // Crear el marcador con las propiedades correctas
    const textoMarcador = L.marker(posicion, {
        icon: L.divIcon({
            className: claseCss,
            html: `<div style="color: black;">${texto}</div>`,
            iconSize: [100, 20]
        }),
        draggable: true,
        interactive: true
    }).addTo(calcoActivo || window.mapa);
    
    // Asignar al elemento
    elemento.textoMarcador = textoMarcador;
    
    console.log(`Creado nuevo textoMarcador con clase ${claseCss} y texto "${texto}"`);
    return textoMarcador;
}

/**
 * Versión modificada de actualizarTextoElemento que respeta textoMarcador
 * @param {Object} elemento - El elemento cuyo texto se actualizará
 * @param {string} nuevoTexto - El nuevo texto
 * @param {string} tipo - El tipo de elemento ('linea', 'poligono', etc.)
 */
function actualizarTextoElemento(elemento, nuevoTexto, tipo) {
    // Verificar si ya existe un textoMarcador y actualizarlo
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            divTexto.textContent = nuevoTexto;
            // Actualizar el nombre del elemento
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
            return; // Terminamos aquí si actualizamos el textoMarcador
        }
    }
    
    // Si no hay textoMarcador, continuar con la lógica original
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
    elemento.nombre = nuevoTexto;
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
            // Patrón de líneas diagonales
            return new L.StripePattern({
                color: color,
                weight: 2,
                spaceWeight: 4,
                angle: 45
            });
            
        case 'rombos':
            // Patrón de rombos (dos patrones diagonales superpuestos)
            return {
                tipo: 'compuesto',
                patrones: [
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: 45
                    }),
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: -45
                    })
                ]
            };
            
        case 'cuadros':
            // Patrón de cuadrícula (dos patrones rectos superpuestos)
            return {
                tipo: 'compuesto',
                patrones: [
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: 0  // Horizontal
                    }),
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: 90  // Vertical
                    })
                ]
            };
            
        case 'puntos':
            // Creamos un patrón de puntos real utilizando un patrón SVG
            const dotPattern = new L.PatternCircle({
                x: 5,
                y: 5,
                radius: 2,
                fill: true,
                color: color,
                fillColor: color,
                fillOpacity: 1.0,
                weight: 0
            });
            
            // Creamos un contenedor para los puntos
            const pattern = new L.Pattern({
                width: 10,
                height: 10
            });
            
            // Agregamos el círculo al patrón
            pattern.addShape(dotPattern);
            
            return pattern;
            
        default:
            return null;
    }
}

function aplicarRelleno(elemento, tipoRelleno, color) {
    // Limpiar patrones anteriores
    if (elemento._capasSecundarias) {
        elemento._capasSecundarias.forEach(capa => {
            if (window.calcoActivo && window.calcoActivo.hasLayer(capa)) {
                window.calcoActivo.removeLayer(capa);
            } else if (window.mapa && window.mapa.hasLayer(capa)) {
                window.mapa.removeLayer(capa);
            }
        });
        elemento._capasSecundarias = null;
    }
    
    // Si hay algún patrón aplicado al elemento, eliminarlo
    if (elemento.options.fillPattern && elemento.options.fillPattern._removeShapes) {
        window.mapa.removePattern(elemento.options.fillPattern);
    }
    
    switch(tipoRelleno) {
        case 'none':
            elemento.setStyle({fillOpacity: 0, fillPattern: null});
            break;
            
        case 'solid':
            elemento.setStyle({
                fillOpacity: 0.2, 
                fillColor: color, 
                fillPattern: null
            });
            break;
            
        case 'rombos':
        case 'cuadros':
            const patronCompuesto = obtenerPatronRelleno(tipoRelleno, color);
            if (patronCompuesto && patronCompuesto.tipo === 'compuesto') {
                // Añadir patrones al mapa
                patronCompuesto.patrones.forEach(patron => {
                    patron.addTo(window.mapa);
                });
                
                // Aplicar el primer patrón al elemento principal
                elemento.setStyle({
                    fillPattern: patronCompuesto.patrones[0],
                    fillOpacity: 0.7
                });
                
                // Crear un duplicado del polígono para el segundo patrón
                const coords = elemento.getLatLngs();
                const segundaLayer = L.polygon(coords, {
                    fillPattern: patronCompuesto.patrones[1],
                    fillOpacity: 0.7,
                    color: 'transparent', // Sin borde
                    weight: 0
                }).addTo(window.calcoActivo || window.mapa);
                
                // Guardar referencia para poder eliminarlo después
                elemento._capasSecundarias = [segundaLayer];
            }
            break;
            
        case 'puntos':
            const patronPuntos = obtenerPatronRelleno(tipoRelleno, color);
            if (patronPuntos) {
                // Añadir el patrón al mapa
                patronPuntos.addTo(window.mapa);
                
                // Aplicar el patrón directamente al elemento
                elemento.setStyle({
                    fillPattern: patronPuntos,
                    fillOpacity: 1
                });
            }
            break;
            
        default:
            // Para diagonal y otros patrones simples
            let patron = obtenerPatronRelleno(tipoRelleno, color);
            if (patron && patron.addTo) {
                patron.addTo(window.mapa);
                elemento.setStyle({
                    fillPattern: patron,
                    fillOpacity: 1
                });
            }
            break;
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
    // Configurar eventos base
    inicializarSelectores();
    
    // Configurar eventos de elementos de formulario
    document.getElementById('arma')?.addEventListener('change', function() {
        actualizarTipos(this.value);
    });
    
    document.getElementById('tipo')?.addEventListener('change', function() {
        actualizarCaracteristicas(document.getElementById('arma').value, this.value);
    });
    
    // Configurar botones de guardar
    document.getElementById('guardarCambiosUnidad')?.addEventListener('click', guardarCambiosUnidadGB);
    document.getElementById('guardarCambiosEquipo')?.addEventListener('click', guardarCambiosEquipoGB);
    document.getElementById('guardarCambiosLinea')?.addEventListener('click', guardarCambiosLinea);
    
    // Configurar eventos para actualizar previews
    ['afiliacion', 'estado', 'arma', 'tipo', 'caracteristica', 'magnitud', 'puestoComando', 'fuerzaTarea', 'designacion', 'dependencia'].forEach(function(id) {
        document.getElementById(id)?.addEventListener('change', actualizarPreviewSimbolo);
        document.getElementById(id)?.addEventListener('input', actualizarPreviewSimbolo);
    });
    
    // Configurar evento para Lista de Elementos
    configurarEventoListaElementos();
    
    console.log("✅ Eventos de edicionGB inicializados con integración a BD");
});

function editarelementoSeleccionadoGB() {
    if (!elementoSeleccionadoGB) return;

    if (elementoSeleccionadoGB instanceof L.Marker) {
        if (elementoSeleccionadoGB.options.sidc) {
            if (esEquipo(elementoSeleccionadoGB.options.sidc)) {
                mostrarPanelEdicionEquipo(elementoSeleccionadoGB);
            } else if (esUnidad(elementoSeleccionadoGB.options.sidc)) {
                mostrarPanelEdicionUnidad(elementoSeleccionadoGB);
            } else {
                mostrarPanelEdicionElementoEspecial(elementoSeleccionadoGB);
            }
        } else {
            console.log("Elemento sin SIDC identificado");
        }
    } else if (elementoSeleccionadoGB instanceof L.Polyline || elementoSeleccionadoGB instanceof L.Polygon) {
        mostrarPanelEdicionMCC(elementoSeleccionadoGB, determinarTipoMCC(elementoSeleccionadoGB));
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

function verificarElementosAntesDeEnviarListo() {
    const jugadorId = window.userId;
    if (!jugadorId) {
        console.error('No hay ID de jugador disponible');
        return false;
    }
    
    // Obtener y mostrar todos los elementos
    const elementos = [];
    if (window.calcoActivo) {
        window.calcoActivo.eachLayer(layer => {
            if (layer.options && 
                (layer.options.jugadorId === jugadorId || layer.options.jugador === jugadorId)) {
                elementos.push(layer);
            }
        });
    }
    
    console.group(`[Diagnóstico] Elementos para jugador ${jugadorId} antes de marcar como listo`);
    console.log(`Total elementos: ${elementos.length}`);
    
    elementos.forEach((elem, i) => {
        const esEquipo = elem.options?.sidc?.charAt(4) === 'E';
        console.log(`Elemento #${i+1}:`, {
            id: elem.options?.id,
            tipo: elem.options?.tipo,
            designacion: elem.options?.designacion,
            dependencia: elem.options?.dependencia,
            magnitud: elem.options?.magnitud,
            sidc: elem.options?.sidc,
            esEquipo
        });
    });
    
    console.groupEnd();
    return elementos.length > 0;
}



// Modificar la función guardarCambiosEquipoGB
function guardarCambiosEquipoGB() {
    if (!elementoSeleccionadoGB) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return false;
    }

    try {
        const nuevoSidc = obtenerSIDCActualEquipo();
        const designacion = document.getElementById('designacionEquipo').value;
        const dependencia = document.getElementById('asignacionEquipo').value;
        const posicionActual = elementoSeleccionadoGB.getLatLng();
        
        // Validar datos
        if (!designacion && !dependencia) {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion(
                    'Designación o asignación son obligatorios',
                    'error'
                );
            }
            return false;
        }

        // Preservar identificadores originales
        const elementoId = elementoSeleccionadoGB.options.id;
        const jugadorId = elementoSeleccionadoGB.options.jugador || elementoSeleccionadoGB.options.jugadorId || window.usuarioInfo?.id;
        const usuarioNombre = elementoSeleccionadoGB.options.usuario || window.usuarioInfo?.usuario || 'Usuario';
        
        // Datos completos del elemento
        const datosActualizados = {
            id: elementoId,
            sidc: nuevoSidc,
            tipo: obtenerTipoDeElemento(nuevoSidc),
            designacion: designacion,
            dependencia: dependencia,
            posicion: {
                lat: posicionActual.lat,
                lng: posicionActual.lng,
                precision: 10
            },
            elemento: {
                sidc: nuevoSidc,
                designacion: designacion,
                dependencia: dependencia
            },
            usuario: usuarioNombre,
            usuarioId: jugadorId,
            jugador: jugadorId,
            jugadorId: jugadorId,
            operacion: window.operacionActual || window.MAIRA?.GestionBatalla?.operacionActual || 'general',
            timestamp: new Date().toISOString(),
            conectado: true
        };

        // Actualizar visualmente
        const sym = new ms.Symbol(nuevoSidc, {
            size: 35,
            uniqueDesignation: designacion
        });

        const icon = L.divIcon({
            className: 'simbolo-militar',
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        });

        // Actualizar propiedades del marcador
        elementoSeleccionadoGB.setIcon(icon);
        elementoSeleccionadoGB.options.sidc = nuevoSidc;
        elementoSeleccionadoGB.options.designacion = designacion;
        elementoSeleccionadoGB.options.dependencia = dependencia;

        // Actualizar etiqueta
        if (typeof actualizarEtiquetaEquipo === 'function') {
            actualizarEtiquetaEquipo(elementoSeleccionadoGB);
        }

        // Actualizar elementosConectados
        if (window.elementosConectados && elementosConectados[elementoId]) {
            elementosConectados[elementoId].datos = {
                ...elementosConectados[elementoId].datos,
                ...datosActualizados
            };
        }

        // MODIFICACIÓN PRINCIPAL: Guardar en la BD usando Socket.IO
        const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
        if (socket && socket.connected) {
            // Enviar actualización al servidor
            socket.emit('guardarElementoDB', datosActualizados);
            
            // Notificar a todos los clientes
            socket.emit('elementoActualizado', datosActualizados);
            
            if (typeof MAIRA?.Utils?.mostrarNotificacion === 'function') {
                MAIRA.Utils.mostrarNotificacion("Equipo guardado en base de datos", "success");
            }
        } else {
            console.warn("No hay conexión con el servidor. Guardando solo localmente.");
            
            // Guardar en localStorage como fallback
            if (typeof window.guardarElementosEnDB === 'function') {
                window.guardarElementosEnDB();
            } else if (typeof window.guardarElementosEnLocalStorage === 'function') {
                window.guardarElementosEnLocalStorage();
            }
            
            if (typeof MAIRA?.Utils?.mostrarNotificacion === 'function') {
                MAIRA.Utils.mostrarNotificacion("Equipo guardado localmente (sin conexión)", "warning");
            }
        }

        // Cerrar panel
        cerrarPanelEdicion('panelEdicionEquipo');

        return true;
    } catch (error) {
        console.error('Error al guardar cambios de equipo:', error);
        
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion("Error al guardar equipo: " + error.message, "error");
        }
        
        return false;
    }
}

// Modificar la función guardarCambiosLinea
function guardarCambiosLinea() {
    if (!elementoSeleccionadoGB) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return false;
    }
    
    try {
        // Obtener los nuevos valores
        const nuevoNombre = document.getElementById('nombreLinea').value;
        const nuevoColor = document.getElementById('colorLinea').value;
        const nuevoAncho = parseInt(document.getElementById('anchoLinea').value);
        const nuevoDashArray = document.getElementById('tipoLinea').value === 'dashed' ? '5, 5' : null;
        
        console.log("Guardando cambios de línea, nuevo nombre:", nuevoNombre);
        
        // Identificadores originales
        const elementoId = elementoSeleccionadoGB.options?.id || elementoSeleccionadoGB._leaflet_id;
        const creadorId = elementoSeleccionadoGB.options?.creador || elementoSeleccionadoGB.options?.jugador || window.usuarioInfo?.id;
        const usuarioNombre = elementoSeleccionadoGB.options?.usuario || window.usuarioInfo?.usuario || 'Usuario';
        
        // Actualizar propiedades del elemento
        elementoSeleccionadoGB.options = elementoSeleccionadoGB.options || {};
        elementoSeleccionadoGB.options.nombre = nuevoNombre;
        elementoSeleccionadoGB.options.color = nuevoColor;
        elementoSeleccionadoGB.options.weight = nuevoAncho;
        elementoSeleccionadoGB.options.dashArray = nuevoDashArray;
        
        // También actualizar propiedades directas
        elementoSeleccionadoGB.nombre = nuevoNombre;
        elementoSeleccionadoGB.color = nuevoColor;
        elementoSeleccionadoGB.ancho = nuevoAncho;
        elementoSeleccionadoGB.tipo = document.getElementById('tipoLinea').value;
        
        // Aplicar estilo visual
        elementoSeleccionadoGB.setStyle({
            color: nuevoColor,
            weight: nuevoAncho,
            dashArray: nuevoDashArray
        });
        
        // Actualizar SOLO el textoMarcador existente
        if (elementoSeleccionadoGB.textoMarcador && elementoSeleccionadoGB.textoMarcador._icon) {
            const divTexto = elementoSeleccionadoGB.textoMarcador._icon.querySelector('div');
            if (divTexto) {
                console.log("Actualizando texto directamente:", nuevoNombre);
                divTexto.textContent = nuevoNombre;
            }
        }
        
        // Eliminar cualquier textoAsociado que pudiera existir
        if (elementoSeleccionadoGB.textoAsociado) {
            console.log("Eliminando textoAsociado duplicado");
            try {
                calcoActivo.removeLayer(elementoSeleccionadoGB.textoAsociado);
                elementoSeleccionadoGB.textoAsociado = null;
            } catch (e) {
                console.error("Error al eliminar textoAsociado:", e);
            }
        }
        
        // MODIFICACIÓN PRINCIPAL: Guardar en base de datos
        // Preparar datos para guardar
        const latlngs = elementoSeleccionadoGB.getLatLngs();
        const puntos = Array.isArray(latlngs[0]) 
            ? latlngs.map(arr => arr.map(p => [p.lat, p.lng])) 
            : latlngs.map(p => [p.lat, p.lng]);
        
        const datosLinea = {
            id: elementoId,
            tipo: 'linea',
            nombre: nuevoNombre,
            color: nuevoColor,
            ancho: nuevoAncho,
            estilo: document.getElementById('tipoLinea').value,
            puntos: puntos,
            creador: creadorId,
            usuario: usuarioNombre,
            usuarioId: creadorId,
            operacion: window.operacionActual || window.MAIRA?.GestionBatalla?.operacionActual || 'general',
            timestamp: new Date().toISOString()
        };
        
        const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
        if (socket && socket.connected) {
            // Guardar la línea usando un evento específico o genérico
            socket.emit('guardarLinea', datosLinea);
            
            // O usar el evento más genérico
            socket.emit('guardarElementoDB', {
                ...datosLinea,
                tipo_elemento: 'linea'
            });
            
            if (typeof MAIRA?.Utils?.mostrarNotificacion === 'function') {
                MAIRA.Utils.mostrarNotificacion("Línea guardada en base de datos", "success");
            }
        } else {
            console.warn("No hay conexión con el servidor. Guardando solo localmente.");
            
            // Guardar en localStorage como fallback - adaptar para líneas
            try {
                const elementosGuardados = JSON.parse(localStorage.getItem('lineas_guardadas') || '{}');
                elementosGuardados[elementoId] = datosLinea;
                localStorage.setItem('lineas_guardadas', JSON.stringify(elementosGuardados));
                
                if (typeof MAIRA?.Utils?.mostrarNotificacion === 'function') {
                    MAIRA.Utils.mostrarNotificacion("Línea guardada localmente (sin conexión)", "warning");
                }
            } catch (e) {
                console.error("Error al guardar línea en localStorage:", e);
            }
        }
        
        cerrarPanelEdicion('panelEdicionLinea');
        return true;
    } catch (error) {
        console.error("Error al guardar cambios de línea:", error);
        
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion("Error al guardar línea: " + error.message, "error");
        }
        
        return false;
    }
}

// Modificar la función guardarCambiosMCC para guardar en BD
function guardarCambiosMCC(elemento, tipo) {
    try {
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

        // Actualizar directamente el textoMarcador si existe
        if (elemento.textoMarcador && elemento.textoMarcador._icon) {
            const divTexto = elemento.textoMarcador._icon.querySelector('div');
            if (divTexto) {
                divTexto.textContent = nuevoTexto;
                // Actualizar también las propiedades
                elemento.options.nombre = nuevoTexto;
                elemento.nombre = nuevoTexto;
            }
        } 
        // Si no existe textoMarcador pero sí textoAsociado, eliminarlo y crear textoMarcador
        else if (elemento.textoAsociado) {
            calcoActivo.removeLayer(elemento.textoAsociado);
            elemento.textoAsociado = null;
            
            // Crear nuevo textoMarcador con las propiedades correctas
            let posicion;
            if (tipo === 'poligono') {
                posicion = elemento.getBounds().getCenter();
            } else if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
                const latlngs = elemento.getLatLngs();
                posicion = latlngs[Math.floor(latlngs.length / 2)];
            } else {
                posicion = elemento.getLatLng();
            }
            
            elemento.textoMarcador = L.marker(posicion, {
                icon: L.divIcon({
                    className: tipo === 'poligono' ? 'texto-poligono' : 'texto-linea',
                    html: `<div style="color: black;">${nuevoTexto}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,
                interactive: true
            }).addTo(calcoActivo);
            
            // Actualizar propiedades
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
        }
        // Si no existe ninguno, crear textoMarcador
        else if (nuevoTexto.trim() !== '') {
            let posicion;
            if (tipo === 'poligono') {
                posicion = elemento.getBounds().getCenter();
            } else if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
                const latlngs = elemento.getLatLngs();
                posicion = latlngs[Math.floor(latlngs.length / 2)];
            } else {
                posicion = elemento.getLatLng();
            }
            
            elemento.textoMarcador = L.marker(posicion, {
                icon: L.divIcon({
                    className: tipo === 'poligono' ? 'texto-poligono' : 'texto-linea',
                    html: `<div style="color: black;">${nuevoTexto}</div>`,
                    iconSize: [100, 20]
                }),
                draggable: true,
                interactive: true
            }).addTo(calcoActivo);
            
            // Actualizar propiedades
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
        }

        // MODIFICACIÓN PRINCIPAL: Guardar en base de datos
        const elementoId = elemento.options?.id || elemento._leaflet_id;
        const creadorId = elemento.options?.creador || elemento.options?.jugador || window.usuarioInfo?.id;
        const usuarioNombre = elemento.options?.usuario || window.usuarioInfo?.usuario || 'Usuario';
        
        // Preparar datos para guardar según tipo
        let datosMCC = {
            id: elementoId,
            tipo_elemento: tipo,
            nombre: nuevoTexto,
            color: nuevoColor,
            ancho: nuevoAncho,
            estilo: nuevoTipoLinea,
            creador: creadorId,
            usuario: usuarioNombre,
            usuarioId: creadorId,
            operacion: window.operacionActual || window.MAIRA?.GestionBatalla?.operacionActual || 'general',
            timestamp: new Date().toISOString()
        };
        
        // Añadir datos específicos según tipo
        if (tipo === 'poligono') {
            const coords = elemento.getLatLngs();
            datosMCC.puntos = Array.isArray(coords[0]) 
                ? coords.map(ring => ring.map(p => [p.lat, p.lng]))
                : coords.map(p => [p.lat, p.lng]);
            
            datosMCC.tipoRelleno = document.getElementById('tipoRellenoMCC').value;
            datosMCC.colorRelleno = document.getElementById('colorRellenoMCC').value;
        } else {
            const coords = elemento.getLatLngs();
            datosMCC.puntos = Array.isArray(coords[0]) 
                ? coords.map(arr => arr.map(p => [p.lat, p.lng])) 
                : coords.map(p => [p.lat, p.lng]);
        }
        
        const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
        if (socket && socket.connected) {
            // Guardar usando un evento específico o genérico
            socket.emit('guardarMCC', datosMCC);
            
            // O usar el evento más genérico
            socket.emit('guardarElementoDB', {
                ...datosMCC,
                tipo: datosMCC.tipo_elemento  // Asegurar compatibilidad con evento general
            });
            
            if (typeof MAIRA?.Utils?.mostrarNotificacion === 'function') {
                MAIRA.Utils.mostrarNotificacion(`${tipo} guardado en base de datos`, "success");
            }
        } else {
            console.warn("No hay conexión con el servidor. Guardando solo localmente.");
            
            // Guardar en localStorage como fallback
            try {
                const elementosGuardados = JSON.parse(localStorage.getItem('mcc_guardados') || '{}');
                elementosGuardados[elementoId] = datosMCC;
                localStorage.setItem('mcc_guardados', JSON.stringify(elementosGuardados));
                
                if (typeof MAIRA?.Utils?.mostrarNotificacion === 'function') {
                    MAIRA.Utils.mostrarNotificacion(`${tipo} guardado localmente (sin conexión)`, "warning");
                }
            } catch (e) {
                console.error(`Error al guardar ${tipo} en localStorage:`, e);
            }
        }

        cerrarPanelEdicion('panelEdicionMCC');
        console.log('Cambios MCC guardados');
        return true;
    } catch (error) {
        console.error("Error al guardar cambios MCC:", error);
        
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion("Error al guardar elemento MCC: " + error.message, "error");
        }
        
        return false;
    }
}

// Modificar window.enviarElementoAlServidor para mayor robustez en caso de
window.enviarElementoAlServidor = function(elemento) {
    console.log("🔄 Enviando elemento al servidor con integración a BD:", elemento);
    
    // Verificar conexión al servidor
    const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
    if (!socket || !socket.connected) {
        console.error("❌ No hay conexión de socket disponible");
        
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion("Error: No hay conexión con el servidor", "error");
        }
        
        // Guardar en localStorage como fallback
        if (typeof window.guardarElementosEnLocalStorage === 'function') {
            window.guardarElementosEnLocalStorage();
        }
        
        return false;
    }
    
    try {
        // IMPORTANTE: Asegurar que todos los ID y referencias sean consistentes
        const idUsuarioActual = 
            elemento.options?.usuarioId || 
            elemento.options?.jugadorId || 
            window.usuarioInfo?.id || 
            (window.MAIRA?.GestionBatalla?.usuarioInfo?.id);
        
        const nombreUsuarioActual = 
            elemento.options?.usuario || 
            window.usuarioInfo?.usuario || 
            'Usuario';
        
        const operacionActual = 
            window.operacionActual || 
            window.MAIRA?.GestionBatalla?.operacionActual || 
            'general';
        
        // Preparar datos completos del elemento
        const datosElemento = {
            id: elemento.options.id || `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sidc: elemento.options.sidc || 'SFGPUCI-----',
            designacion: elemento.options.designacion || elemento.options.nombre || 'Elemento sin nombre',
            dependencia: elemento.options.dependencia || '',
            magnitud: elemento.options.magnitud || '-',
            tipo: elemento.options.tipo || obtenerTipoDeElemento(elemento.options.sidc) || 'unidad',
            usuario: nombreUsuarioActual,
            usuarioId: idUsuarioActual,
            jugadorId: idUsuarioActual,  // Mantener para compatibilidad
            jugador: idUsuarioActual,    // Mantener para compatibilidad
            creador: idUsuarioActual,    // Mantener para compatibilidad
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            conectado: true,
            elemento: {
                sidc: elemento.options.sidc || 'SFGPUCI-----',
                designacion: elemento.options.designacion || elemento.options.nombre || '',
                dependencia: elemento.options.dependencia || '',
                magnitud: elemento.options.magnitud || '-'
            }
        };
        
        // Añadir posición si existe
        if (typeof elemento.getLatLng === 'function') {
            const pos = elemento.getLatLng();
            datosElemento.posicion = {
                lat: pos.lat,
                lng: pos.lng,
                precision: 10,
                rumbo: elemento.options.rumbo || 0,
                velocidad: 0
            };
        }
        
        // MODIFICACIÓN PRINCIPAL: Enviar utilizando guardarElementoDB para DB
        console.log("📤 Enviando elemento a la base de datos:", datosElemento);
        socket.emit('guardarElementoDB', datosElemento);
        
        // También enviar con eventos adicionales para compatibilidad
        socket.emit('nuevoElemento', datosElemento);
        socket.emit('anunciarElemento', datosElemento);
        
        // Si tiene posición, enviar actualización de posición también
        if (datosElemento.posicion) {
            socket.emit('actualizarPosicionGB', datosElemento);
        }
        
        // Actualizar estructura local - elementosConectados
        if (window.elementosConectados) {
            if (!window.elementosConectados[datosElemento.id]) {
                window.elementosConectados[datosElemento.id] = {
                    datos: datosElemento,
                    marcador: elemento
                };
            } else {
                // Preservar datos existentes y sobrescribir con nuevos
                window.elementosConectados[datosElemento.id].datos = {
                    ...window.elementosConectados[datosElemento.id].datos,
                    ...datosElemento,
                    // Asegurar que estos campos se mantengan consistentes
                    id: datosElemento.id,
                    usuario: datosElemento.usuario,
                    usuarioId: datosElemento.usuarioId,
                    jugadorId: datosElemento.jugadorId
                };
                window.elementosConectados[datosElemento.id].marcador = elemento;
            }
        }
        
        // Sincronizar con MAIRA si está disponible
        if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
            window.MAIRA.GestionBatalla.elementosConectados[datosElemento.id] = 
                window.elementosConectados[datosElemento.id];
        }
        
        // Si es el elemento del usuario actual, actualizar elementoTrabajo
        if (idUsuarioActual === window.usuarioInfo?.id) {
            window.elementoTrabajo = {
                ...window.elementoTrabajo,
                sidc: datosElemento.sidc,
                designacion: datosElemento.designacion,
                dependencia: datosElemento.dependencia,
                magnitud: datosElemento.magnitud
            };
            
            // Actualizar también en MAIRA central
            if (window.MAIRA && window.MAIRA.GestionBatalla) {
                window.MAIRA.GestionBatalla.elementoTrabajo = window.elementoTrabajo;
            }
        }
        
        // Notificar éxito al usuario
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion("Elemento guardado en base de datos", "success");
        }
        
        return true;
    } catch (error) {
        console.error("❌ Error al enviar elemento:", error);
        
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion("Error al guardar el elemento: " + error.message, "error");
        }
        
        return false;
    }
};

/**
 * Función mejorada para cargar elementos desde DB
 */
window.cargarElementosDesdeDB = function() {
    console.log("🔄 Solicitando elementos desde base de datos");
    
    const operacionActual = 
        window.operacionActual || 
        window.MAIRA?.GestionBatalla?.operacionActual || 
        'general';
    
    const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
    
    if (!socket || !socket.connected) {
        console.warn("⚠️ No hay conexión al servidor. Intentando cargar desde localStorage");
        return cargarElementosDesdeLocalStorage();
    }
    
    // Solicitar elementos al servidor
    socket.emit('obtenerElementosDB', {
        operacion: operacionActual
    });
    
    // La respuesta se procesará en el evento 'listaElementos'
    // Configurar un timeout para fallback si no hay respuesta
    setTimeout(() => {
        // Si después de 5 segundos no llegan datos, intentar localStorage
        if (!window.elementosDBCargados) {
            console.warn("⏱️ Timeout esperando datos del servidor. Intentando localStorage");
            cargarElementosDesdeLocalStorage();
        }
    }, 5000);
    
    return true;
};

/**
 * Función de respaldo para cargar desde localStorage
 */
function cargarElementosDesdeLocalStorage() {
    console.log("📂 Cargando elementos desde localStorage como fallback");
    
    try {
        const operacionActual = 
            window.operacionActual || 
            window.MAIRA?.GestionBatalla?.operacionActual || 
            'general';
        
        const elementosGuardados = localStorage.getItem(`elementos_conectados_${operacionActual}`);
        if (!elementosGuardados) {
            console.log("📭 No hay elementos guardados en localStorage para esta operación");
            return 0;
        }
        
        const elementosParsed = JSON.parse(elementosGuardados);
        console.log(`📥 Encontrados ${Object.keys(elementosParsed).length} elementos en localStorage`);
        
        // Convertir a formato esperado por procesarElementosRecibidos
        const elementosArray = Object.values(elementosParsed).map(elem => elem.datos);
        
        // Actualizar elementos usando el sistema existente
        if (typeof window.procesarElementosRecibidos === 'function') {
            window.procesarElementosRecibidos(elementosArray);
        } else {
            console.warn("⚠️ Función procesarElementosRecibidos no disponible");
            
            // Fallback: actualizar manualmente
            elementosArray.forEach(elemento => {
                if (!window.elementosConectados) window.elementosConectados = {};
                
                window.elementosConectados[elemento.id] = {
                    datos: elemento,
                    marcador: null
                };
                
                // Crear marcador si hay función disponible
                if (typeof window.crearMarcadorElemento === 'function' && elemento.posicion) {
                    window.elementosConectados[elemento.id].marcador = 
                        window.crearMarcadorElemento(elemento);
                }
            });
        }
        
        return elementosArray.length;
    } catch (e) {
        console.error("❌ Error al cargar elementos desde localStorage:", e);
        return 0;
    }
}

/**
 * Evento para escuchar respuestas del servidor con elementos
 */
function configurarEventoListaElementos() {
    const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
    
    if (!socket) {
        console.warn("⚠️ No se puede configurar evento listaElementos: socket no disponible");
        return false;
    }
    
    socket.off('listaElementos'); // Evitar duplicados
    
    socket.on('listaElementos', function(elementos) {
        console.log(`📥 Recibidos ${elementos?.length || 0} elementos del servidor`);
        
        if (!elementos || !Array.isArray(elementos) || elementos.length === 0) {
            console.log("📭 No se recibieron elementos válidos del servidor");
            return;
        }
        
        // Marcar que se recibieron datos
        window.elementosDBCargados = true;
        
        // Procesar elementos usando la función existente
        if (typeof window.procesarElementosRecibidos === 'function') {
            window.procesarElementosRecibidos(elementos);
        } else {
            console.warn("⚠️ Función procesarElementosRecibidos no disponible");
            
            // Fallback: crear estructuras básicas
            elementos.forEach(elemento => {
                if (!window.elementosConectados) window.elementosConectados = {};
                
                window.elementosConectados[elemento.id] = {
                    datos: elemento,
                    marcador: null
                };
                
                // Crear marcador si hay función disponible
                if (typeof window.crearMarcadorElemento === 'function' && elemento.posicion) {
                    window.elementosConectados[elemento.id].marcador = 
                        window.crearMarcadorElemento(elemento);
                }
            });
        }
        
        console.log("✅ Elementos cargados desde la base de datos");
    });
    
    return true;
}

/**
 * Función auxiliar para limpiar elementos duplicados
 */
function limpiarElementosDuplicados() {
    if (!window.elementosConectados) return;
    
    const elementosUnicos = {};
    const elementosEliminados = [];
    
    // Identificar elementos más recientes por ID
    Object.entries(window.elementosConectados).forEach(([id, elem]) => {
        if (!elem || !elem.datos) return;
        
        // Normalizar ID (algunos pueden tener formatos ligeramente diferentes)
        const idNormalizado = elem.datos.id || id;
        
        // Si es la primera vez que vemos este ID o es más reciente que el anterior
        if (!elementosUnicos[idNormalizado] || 
            (elem.datos.timestamp && elementosUnicos[idNormalizado].datos.timestamp &&
             new Date(elem.datos.timestamp) > new Date(elementosUnicos[idNormalizado].datos.timestamp))) {
            elementosUnicos[idNormalizado] = elem;
        } else {
            elementosEliminados.push(id);
        }
    });
    
    // Eliminar duplicados
    elementosEliminados.forEach(id => {
        if (window.elementosConectados[id]?.marcador) {
            try {
                if (window.calcoActivo && window.calcoActivo.hasLayer(window.elementosConectados[id].marcador)) {
                    window.calcoActivo.removeLayer(window.elementosConectados[id].marcador);
                } else if (window.mapa && window.mapa.hasLayer(window.elementosConectados[id].marcador)) {
                    window.mapa.removeLayer(window.elementosConectados[id].marcador);
                }
            } catch (e) {
                console.error(`Error al eliminar marcador ${id}:`, e);
            }
        }
        delete window.elementosConectados[id];
    });
    
    if (elementosEliminados.length > 0) {
        console.log(`🧹 Se eliminaron ${elementosEliminados.length} elementos duplicados`);
    }
    
    return elementosEliminados.length;
}

// Auxiliar para integrar con sistemas existentes
window.forzarSincronizacionElementosConDB = function() {
    console.log("🔄 Forzando sincronización de elementos con la BD");
    
    // 1. Solicitar elementos actuales del servidor
    window.cargarElementosDesdeDB();
    
    // 2. Enviar nuestros elementos al servidor
    const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
    
    if (!socket || !socket.connected) {
        console.warn("⚠️ No se puede sincronizar sin conexión al servidor");
        return false;
    }
    
    // Limpiar duplicados antes de enviar
    limpiarElementosDuplicados();
    
    // Enviar cada elemento al servidor
    if (window.elementosConectados) {
        let contador = 0;
        Object.entries(window.elementosConectados).forEach(([id, elem]) => {
            if (elem && elem.datos) {
                socket.emit('guardarElementoDB', elem.datos);
                contador++;
            }
        });
        
        console.log(`📤 Enviados ${contador} elementos al servidor para sincronización`);
        
        // Notificar al usuario
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion(
                `Sincronizados ${contador} elementos con la base de datos`, 
                "success"
            );
        }
    }
    
    return true;
};

// Función para sincronizar tracking con la BD
window.guardarTrackingEnDB = function(elementoId, puntos) {
    console.log(`🔄 Guardando tracking para elemento ${elementoId}`);
    
    if (!puntos || !Array.isArray(puntos) || puntos.length === 0) {
        console.warn("⚠️ No hay puntos para guardar");
        return false;
    }
    
    const operacionActual = 
        window.operacionActual || 
        window.MAIRA?.GestionBatalla?.operacionActual || 
        'general';
    
    const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
    
    if (!socket || !socket.connected) {
        console.warn("⚠️ No hay conexión al servidor para guardar tracking");
        
        // Guardar en localStorage como fallback
        try {
            const trackingGuardado = JSON.parse(localStorage.getItem(`tracking_${operacionActual}`) || '{}');
            trackingGuardado[elementoId] = puntos;
            localStorage.setItem(`tracking_${operacionActual}`, JSON.stringify(trackingGuardado));
            console.log(`✅ Tracking guardado en localStorage para ${elementoId}`);
        } catch (e) {
            console.error("❌ Error al guardar tracking en localStorage:", e);
        }
        
        return false;
    }
    
    // Enviar al servidor
    socket.emit('guardarTracking', {
        elementoId: elementoId,
        operacion: operacionActual,
        puntos: puntos
    }, function(respuesta) {
        if (respuesta && respuesta.success) {
            console.log(`✅ Tracking guardado en la base de datos para ${elementoId}`);
        } else if (respuesta && respuesta.error) {
            console.error(`❌ Error al guardar tracking: ${respuesta.error}`);
        }
    });
    
    return true;
};

// Función para cargar tracking desde BD
window.cargarTrackingDesdeBD = function(elementoId, callback) {
    console.log(`🔄 Cargando tracking para elemento ${elementoId}`);
    
    const operacionActual = 
        window.operacionActual || 
        window.MAIRA?.GestionBatalla?.operacionActual || 
        'general';
    
    const socket = window.socket || window.MAIRA?.GestionBatalla?.socket;
    
    if (!socket || !socket.connected) {
        console.warn("⚠️ No hay conexión al servidor para cargar tracking");
        
        // Intentar cargar desde localStorage
        try {
            const trackingGuardado = JSON.parse(localStorage.getItem(`tracking_${operacionActual}`) || '{}');
            const puntos = trackingGuardado[elementoId] || [];
            console.log(`📂 Tracking cargado desde localStorage para ${elementoId}: ${puntos.length} puntos`);
            
            if (typeof callback === 'function') {
                callback(puntos);
            }
            
            return puntos;
        } catch (e) {
            console.error("❌ Error al cargar tracking desde localStorage:", e);
            
            if (typeof callback === 'function') {
                callback([]);
            }
            
            return [];
        }
    }
    
    // Solicitar al servidor
    socket.emit('cargarTracking', {
        elementoId: elementoId,
        operacion: operacionActual
    }, function(respuesta) {
        if (respuesta && respuesta.success) {
            const puntos = respuesta.puntos || [];
            console.log(`📂 Tracking cargado desde la base de datos para ${elementoId}: ${puntos.length} puntos`);
            
            if (typeof callback === 'function') {
                callback(puntos);
            }
        } else {
            console.warn(`⚠️ No se pudo cargar el tracking: ${respuesta?.error || 'Error desconocido'}`);
            
            if (typeof callback === 'function') {
                callback([]);
            }
        }
    });
};















// Exportación de funciones para uso en otros archivos
window.mostrarPanelEdicionUnidad = mostrarPanelEdicionUnidad;
window.guardarCambiosUnidadGB = guardarCambiosUnidadGB;
window.cerrarPanelEdicion = cerrarPanelEdicion;
window.actualizarPreviewSimbolo = actualizarPreviewSimbolo;
window.mostrarPanelEdicionEquipo = mostrarPanelEdicionEquipo;
window.guardarCambiosEquipoGB = guardarCambiosEquipoGB;
window.mostrarPanelEdicionLinea = mostrarPanelEdicionLinea;
window.guardarCambiosLinea = guardarCambiosLinea;
window.actualizarEstiloElemento = actualizarEstiloElemento;
window.mostrarPanelEdicionMCC = mostrarPanelEdicionMCC;
window.editarelementoSeleccionadoGB = editarelementoSeleccionadoGB;
window.actualizarCampoSIDC = actualizarCampoSIDC;
window.esEquipo = esEquipo;
window.esUnidad = esUnidad;
window.actualizarIconoEnLista = actualizarIconoEnLista;
window.configurarEventoReconexion = configurarEventoReconexion;
window.actualizarElementoConectadoLocal = actualizarElementoConectadoLocal;
window.determinarTipoRelleno = determinarTipoRelleno;
window.obtenerPatronRelleno = obtenerPatronRelleno;
window.aplicarRelleno = aplicarRelleno;
window.crearTextoMarcador = crearTextoMarcador;
window.actualizarTextoElemento = actualizarTextoElemento;
window.guardarCambiosUnidadGB= guardarCambiosUnidadGB;
window.guardarCambiosEquipoGB = guardarCambiosEquipoGB;
window.guardarCambiosLinea = guardarCambiosLinea;
window.guardarCambiosMCC = guardarCambiosMCC;
window.cargarElementosDesdeDB = cargarElementosDesdeDB;
window.forzarSincronizacionElementosConDB = forzarSincronizacionElementosConDB;
window.guardarTrackingEnDB = guardarTrackingEnDB;
window.cargarTrackingDesdeBD = cargarTrackingDesdeBD;
window.limpiarElementosDuplicados = limpiarElementosDuplicados;
window.configurarEventoListaElementos = configurarEventoListaElementos;
