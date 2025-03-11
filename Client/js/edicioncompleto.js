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
    if (!elementoSeleccionado?.options?.sidc) return '';

    let sidc = elementoSeleccionado.options.sidc;
    const afiliacion = document.getElementById('afiliacion').value;
    const estado = document.getElementById('estado').value;
    const [categoria, arma] = document.getElementById('arma').value.split('|');
    const tipo = document.getElementById('tipo').value;
    const caracteristica = document.getElementById('caracteristica').value;
    const magnitud = document.getElementById('magnitud').value;

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
    
    console.log("SIDC intermedio:", sidc, "Modificador:", modificador, "Magnitud:", magnitud);
    
    // Colocar el modificador y la magnitud en las posiciones correctas
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



function guardarCambiosUnidad() {
    console.log("Intentando guardar cambios de unidad");
    
    if (!elementoSeleccionado) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return false;
    }

    try {
        // Obtener el SIDC actualizado con todos los cambios
        const nuevoSidc = obtenerSIDCActual();
        console.log("SIDC generado:", nuevoSidc);
        
        const designacion = document.getElementById('designacion').value;
        const dependencia = document.getElementById('dependencia').value;
        const tipo = obtenerTipoDeElemento(nuevoSidc);
        const magnitud = document.getElementById('magnitud').value;
        const esEquipoActual = esEquipo(nuevoSidc);
        
        // Validar campos requeridos (código de validación...)

        // Guardar la posición actual y el ID
        const posicionActual = elementoSeleccionado.getLatLng();
        const idElemento = elementoSeleccionado.options.id;
        const equipoElemento = elementoSeleccionado.options.equipo || window.equipoJugador;
        const jugadorElemento = elementoSeleccionado.options.jugador || window.userId;
        
        // Eliminar el marcador actual del calco
        window.calcoActivo.removeLayer(elementoSeleccionado);
        
        // Crear un nuevo símbolo con el SIDC actualizado
        const sym = new ms.Symbol(nuevoSidc, { size: 35 });
        
        // Crear un nuevo icono
        const icon = L.divIcon({
            className: `custom-div-icon equipo-${equipoElemento}`,
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        });
        
        // Crear un nuevo marcador con todas las propiedades actualizadas
        const nuevoMarcador = L.marker(posicionActual, {
            icon: icon,
            draggable: true,
            id: idElemento,
            sidc: nuevoSidc,
            tipo: tipo,
            designacion: designacion,
            dependencia: dependencia,
            magnitud: !esEquipoActual ? magnitud : undefined,
            equipo: equipoElemento,
            jugador: jugadorElemento
        });
        
        // Añadir el nuevo marcador al calco
        nuevoMarcador.addTo(window.calcoActivo);
        
        // Actualizar etiqueta
        actualizarEtiquetaUnidad(nuevoMarcador);
        
        // Actualizar referencia al elemento seleccionado
        elementoSeleccionado = nuevoMarcador;
        window.elementoSeleccionado = nuevoMarcador;
        
        // Cerrar panel
        cerrarPanelEdicion('panelEdicionUnidad');
        
        // Enviar al servidor el nuevo marcador
        console.log("Enviando elemento actualizado al servidor");
        const enviado = enviarElementoAlServidor(nuevoMarcador);
        console.log("Resultado de envío:", enviado);
        
        // Actualizar botón listo si es necesario
        window.gestorJuego?.gestorFases?.actualizarBotonListo?.();
        
        return true;
    } catch (error) {
        console.error('Error al guardar cambios de unidad:', error);
        // Manejo de errores...
        return false;
    }
}

function guardarCambiosEquipo() {
    if (!elementoSeleccionado) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return false;
    }

    try {
        const nuevoSidc = obtenerSIDCActualEquipo();
        const designacion = document.getElementById('designacionEquipo').value;
        const dependencia = document.getElementById('asignacionEquipo').value;
        
        // Validar datos
        if (!designacion || !dependencia) {
            if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                window.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'Designación y asignación son obligatorios para equipos',
                    'error'
                );
            } else {
                alert('Designación y asignación son obligatorios para equipos');
            }
            return false;
        }
        
        // Obtener tipo de equipo
        const tipo = obtenerTipoDeElemento(nuevoSidc);
        if (!tipo) {
            if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                window.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'No se pudo determinar el tipo de equipo',
                    'error'
                );
            } else {
                alert('No se pudo determinar el tipo de equipo');
            }
            return false;
        }

        // Guardar posición actual e ID
        const posicionActual = elementoSeleccionado.getLatLng();
        const idElemento = elementoSeleccionado.options.id;
        const equipoElemento = window.equipoJugador;
        
        // Eliminar el elemento actual del calco
        window.calcoActivo.removeLayer(elementoSeleccionado);

        // Crear nuevo símbolo
        const sym = new ms.Symbol(nuevoSidc, {
            size: 35,
        });

        // Crear nuevo icono
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        });

        // Crear nuevo marcador con todas las propiedades
        const nuevoMarcador = L.marker(posicionActual, {
            icon: icon,
            draggable: true,
            id: idElemento,
            sidc: nuevoSidc,
            tipo: tipo,
            designacion: designacion,
            dependencia: dependencia,
            equipoJugador: equipoElemento,
            jugadorId: window.userId
        });
        
        // Añadir el nuevo marcador al calco
        nuevoMarcador.addTo(window.calcoActivo);
        
        // Actualizar etiqueta
        actualizarEtiquetaEquipo(nuevoMarcador);
        
        // Actualizar referencia al elemento seleccionado
        elementoSeleccionado = nuevoMarcador;
        window.elementoSeleccionado = nuevoMarcador;

        // Cerrar panel
        cerrarPanelEdicion('panelEdicionEquipo');
        
        // Enviar al servidor
        console.log("Enviando equipo actualizado al servidor");
        const enviado = enviarElementoAlServidor(nuevoMarcador);
        console.log("Resultado de envío de equipo:", enviado);
        
        // Actualizar botón listo si es necesario
        window.gestorJuego?.gestorFases?.actualizarBotonListo?.();
        
        return true;
    } catch (error) {
        console.error('Error al guardar cambios de equipo:', error);
        
        if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            window.gestorJuego.gestorInterfaz.mostrarMensaje(
                'Error al guardar cambios: ' + (error.message || 'Error desconocido'),
                'error'
            );
        } else {
            alert('Error al guardar cambios: ' + (error.message || 'Error desconocido'));
        }
        
        return false;
    }
}

function enviarElementoAlServidor(elemento) {
    console.log('Enviando elemento al servidor:', elemento);
    
    if (!window.gestorJuego?.gestorComunicacion?.socket) {
        console.error('No hay conexión disponible con el servidor');
        return false;
    }
    
    if (!elemento || !elemento.options) {
        console.error('Elemento no válido para enviar al servidor:', elemento);
        return false;
    }
    
    try {
        // Determinar si es equipo o unidad basado en el SIDC
        const esEquipoActual = elemento.options.sidc && elemento.options.sidc.charAt(4) === 'E';
        
        // Extraer todas las propiedades relevantes
        const datosElemento = {
            id: elemento.options.id,
            tipo: elemento.options.tipo,
            sidc: elemento.options.sidc,
            designacion: elemento.options.designacion,
            dependencia: elemento.options.dependencia,
            esEquipo: esEquipoActual,
            posicion: elemento.getLatLng(),
            jugadorId: window.userId,
            jugador: window.userId,  // Campo duplicado para compatibilidad
            partidaCodigo: window.codigoPartida,
            equipo: elemento.options.equipo || window.equipoJugador
        };
        
        // Añadir propiedades específicas según el tipo de elemento
        if (!esEquipoActual) {
            // Propiedades específicas para unidades
            datosElemento.magnitud = elemento.options.magnitud;
        } else {
            // Propiedades específicas para equipos
            // Por ejemplo, podríamos agregar propiedades como velocidad o alcance
            datosElemento.equipoAsignado = elemento.options.equipoJugador || window.equipoJugador;
        }
        
        console.log(`Emitiendo guardarElemento para ${esEquipoActual ? 'equipo' : 'unidad'} con datos:`, datosElemento);
        
        window.gestorJuego.gestorComunicacion.socket.emit('guardarElemento', datosElemento);
        console.log('Elemento enviado al servidor correctamente');
        return true;
    } catch (error) {
        console.error('Error al enviar elemento al servidor:', error);
        return false;
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

// Usar esta función justo antes de enviar el estado "listo" al servidor



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
