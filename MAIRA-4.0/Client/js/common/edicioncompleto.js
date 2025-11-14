// Namespace específico para edicioncompleto
window.MAIRA = window.MAIRA || {};
window.MAIRA.EdicionCompleto = window.MAIRA.EdicionCompleto || {};
let panelEdicionActualCompleto = null;

/**
 * 🔍 DETECTOR DE CONTEXTO - Determina el modo de juego para validación apropiada
 */
function detectarContextoJuego() {
    // 1. Detectar por URL
    const url = window.location.pathname;
    if (url.includes('planeamiento.html')) {
        return 'planeamiento';
    }
    if (url.includes('juegodeguerra.html')) {
        // Distinguir entre local y online
        return window.socket && window.socket.connected ? 'online' : 'local';
    }
    
    // 2. Detectar por variables globales
    if (window.modoPlaneamiento === true) {
        return 'planeamiento';
    }
    if (window.partidaOnline === true) {
        return 'online';
    }
    if (window.partidaLocal === true) {
        return 'local';
    }
    
    // 3. Detectar por elementos DOM
    if (document.getElementById('panelMarcha')) {
        return 'planeamiento';
    }
    if (document.getElementById('turnoInfo')) {
        return window.socket ? 'online' : 'local';
    }
    
    // Default: planeamiento (más permisivo)
    console.log('⚠️ Contexto no detectado, asumiendo planeamiento');
    return 'planeamiento';
}

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
    
    // Actualizar selector de tipo de vehículo según el arma y tipo seleccionado
    actualizarSelectorTipoVehiculo(categoria, arma, tipo);
}

/**
 * Obtiene vehículos disponibles desde velocidadesReales.json (datos BV8)
 * @param {String} filtroCategoria - Opcional: 'blindado', 'mecanizado', 'motorizado', null para todos
 * @returns {Array} Array de objetos {valor, texto, categoria, tipo}
 */
function obtenerVehiculosBV8Disponibles(filtroCategoria = null) {
    const vehiculosBV8 = window.MAIRA?.velocidadesReales?.vehiculos || {};
    const vehiculosDisponibles = [];

    // Mapear cada vehículo BV8 a formato del selector
    for (const [id, datosVehiculo] of Object.entries(vehiculosBV8)) {
        const categoria = datosVehiculo.categoria;

        // Aplicar filtro si se especificó
        if (filtroCategoria && categoria !== filtroCategoria) {
            continue;
        }

        vehiculosDisponibles.push({
            valor: id,  // ID BV8 (ej: 'tam_tanque', 'vctp_tam', 'm113')
            texto: datosVehiculo.nombre,  // Nombre amigable
            categoria: categoria,
            tipo: datosVehiculo.tipo,
            sidc_base: datosVehiculo.sidc_base
        });
    }

    // Ordenar por categoría y nombre
    vehiculosDisponibles.sort((a, b) => {
        if (a.categoria !== b.categoria) {
            const orden = { 'blindado': 1, 'mecanizado': 2, 'motorizado': 3 };
            return (orden[a.categoria] || 999) - (orden[b.categoria] || 999);
        }
        return a.texto.localeCompare(b.texto);
    });

    return vehiculosDisponibles;
}

/**
 * Determina qué categoría de vehículos usar según el arma/tipo
 * @param {String} categoria - Categoría del elemento
 * @param {String} arma - Arma del elemento
 * @param {String} tipo - Tipo del elemento
 * @returns {String|null} Categoría de vehículo ('blindado', 'mecanizado', 'motorizado') o null para todos
 */
function determinarCategoriaVehiculoPorUnidad(categoria, arma, tipo) {
    // Caballería Blindada → blindados
    if (arma === 'Caballería' && tipo === 'Blindada') {
        return 'blindado';
    }

    // Infantería Mecanizada → mecanizados
    if (arma === 'Infantería' && tipo === 'Mecanizada') {
        return 'mecanizado';
    }

    // Infantería Motorizada → motorizados
    if (arma === 'Infantería' && tipo === 'Motorizada') {
        return 'motorizado';
    }

    // Artillería → motorizados (para remolque)
    if (arma === 'Artillería') {
        return 'motorizado';
    }

    // Servicios → motorizados
    if (categoria === 'Servicios') {
        return 'motorizado';
    }

    // Por defecto: mostrar todos
    return null;
}

function actualizarSelectorTipoVehiculo(categoria, arma, tipo) {
    const tipoVehiculoSelect = document.getElementById('tipoVehiculo');
    const tipoVehiculoEquipoSelect = document.getElementById('tipoVehiculoEquipo');

    if (!tipoVehiculoSelect && !tipoVehiculoEquipoSelect) return;

    let vehiculosDisponibles = [];

    // 🎯 PRIORIDAD 1: Usar sistema jerárquico SIDC si está disponible
    if (window.sistemaJerarquicoSIDC && window.sistemaJerarquicoSIDC.obtenerVehiculosDisponibles) {
        vehiculosDisponibles = window.sistemaJerarquicoSIDC.obtenerVehiculosDisponibles(categoria, arma, tipo);
    }

    // 🎯 PRIORIDAD 2: Usar datos BV8 (velocidadesReales.json)
    if (vehiculosDisponibles.length === 0 && window.MAIRA?.velocidadesReales) {
        const filtroCategoria = determinarCategoriaVehiculoPorUnidad(categoria, arma, tipo);
        vehiculosDisponibles = obtenerVehiculosBV8Disponibles(filtroCategoria);

        console.log(`🚗 Vehículos BV8 cargados (filtro: ${filtroCategoria || 'todos'}): ${vehiculosDisponibles.length}`);
    }

    // 🎯 PRIORIDAD 3: Fallback a valores hardcoded (compatibilidad)
    if (vehiculosDisponibles.length === 0) {
        console.warn('⚠️ No hay datos BV8 disponibles, usando valores hardcoded');

        if (categoria === 'Armas' && arma === 'Caballería' && tipo === 'Blindada') {
            vehiculosDisponibles = [
                { valor: 'tam_tanque', texto: 'TAM - Tanque Argentino Mediano' },
                { valor: 'tam2c', texto: 'TAM 2C - Tanque Argentino Mediano 2C' }
            ];
        } else if (categoria === 'Armas' && arma === 'Infantería' && tipo === 'Mecanizada') {
            vehiculosDisponibles = [
                { valor: 'vctp_tam', texto: 'VCTP TAM - Vehículo de Combate Transporte Personal' },
                { valor: 'm113', texto: 'M113 APC' }
            ];
        } else if (categoria === 'Armas' && arma === 'Infantería' && tipo === 'Motorizada') {
            vehiculosDisponibles = [
                { valor: 'vlega', texto: 'VLEGA - Vehículo Ligero Ejército Argentino' },
                { valor: 'unimog', texto: 'Unimog - Camión todo terreno' }
            ];
        } else {
            vehiculosDisponibles = [
                { valor: 'vlega', texto: 'VLEGA - Vehículo Ligero' },
                { valor: 'unimog', texto: 'Unimog - Vehículo Logístico' }
            ];
        }
    }

    // Actualizar selector de unidades
    if (tipoVehiculoSelect) {
        tipoVehiculoSelect.innerHTML = '<option value="">Seleccionar tipo...</option>';
        vehiculosDisponibles.forEach(vehiculo => {
            let option = document.createElement('option');
            option.value = vehiculo.valor;
            option.textContent = vehiculo.texto;

            // Agregar datos adicionales como atributos
            if (vehiculo.categoria) {
                option.dataset.categoria = vehiculo.categoria;
            }
            if (vehiculo.tipo) {
                option.dataset.tipoVehiculo = vehiculo.tipo;
            }

            tipoVehiculoSelect.appendChild(option);
        });
    }

    // Actualizar selector de equipos
    if (tipoVehiculoEquipoSelect) {
        tipoVehiculoEquipoSelect.innerHTML = '<option value="">Seleccionar tipo...</option>';
        vehiculosDisponibles.forEach(vehiculo => {
            let option = document.createElement('option');
            option.value = vehiculo.valor;
            option.textContent = vehiculo.texto;

            // Agregar datos adicionales como atributos
            if (vehiculo.categoria) {
                option.dataset.categoria = vehiculo.categoria;
            }
            if (vehiculo.tipo) {
                option.dataset.tipoVehiculo = vehiculo.tipo;
            }

            tipoVehiculoEquipoSelect.appendChild(option);
        });
    }
}

// ✅ FUNCIÓN CERRAR TODOS LOS PANELES QUE FALTABA:
function cerrarTodosPaneles() {
    const paneles = ['panelEdicionLinea', 'panelEdicionUnidad', 'panelEdicionEquipo', 'panelEdicionMCC'];
    paneles.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'none';
            panel.classList.remove('show');
        }
    });
    console.log('🗂️ Todos los paneles de edición cerrados');
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
    console.log("📋 [DEBUG] mostrarPanelEdicionUnidad llamada con:", elemento);
    
    console.log("Mostrando panel de edición de unidad");
    mostrarPanelEdicion('panelEdicionUnidad');
    
    // ✅ CRÍTICO: Re-registrar event listeners cada vez que se abre el panel
    // Usar setTimeout para asegurar que el panel esté visible en el DOM
    setTimeout(function() {
        const listenersOk = registrarListenersPanelEdicion();
        
        if (!listenersOk) {
            console.error("❌ No se pudieron registrar los event listeners");
            console.error("❌ Los dropdowns NO responderán a cambios");
        }
        
        // Cargar datos del elemento DESPUÉS de registrar listeners
        if (elemento?.options?.sidc) {
            const sidc = elemento.options.sidc;
            const tipoUnidad = determinarTipoUnidad(sidc);
            
            console.log("💾 Cargando datos del elemento:", {
                sidc: sidc,
                tipoUnidad: tipoUnidad,
                options: elemento.options
            });
            
            document.getElementById('afiliacion').value = sidc.charAt(1);
            document.getElementById('estado').value = sidc.charAt(3);
            
            // ✅ CRÍTICO FIX #7: Leer TIPO y CARACTERÍSTICA custom si existen (prevalecen sobre decodificación SIDC)
            const tipoCustom = elemento.options.tipo || tipoUnidad.tipo;
            const caracteristicaCustom = elemento.options.caracteristica || tipoUnidad.caracteristica;
            
            console.log("💾 Valores a cargar:", {
                tipoSIDC: tipoUnidad.tipo,
                tipoCustom: tipoCustom,
                caracteristicaSIDC: tipoUnidad.caracteristica,
                caracteristicaCustom: caracteristicaCustom
            });
            
            if (tipoUnidad.categoria && tipoUnidad.arma) {
                const armaValue = `${tipoUnidad.categoria}|${tipoUnidad.arma}`;
                console.log("💾 Cargando arma:", armaValue);
                document.getElementById('arma').value = armaValue;
                actualizarTipos(armaValue);
                
                // ✅ ESPERAR a que se actualicen los tipos antes de cargar el valor
                setTimeout(function() {
                    const tipoSelect = document.getElementById('tipo');
                    console.log("💾 Cargando tipo CUSTOM:", tipoCustom, "Opciones disponibles:", tipoSelect.options.length);
                    tipoSelect.value = tipoCustom; // ✅ Usar valor custom, no decodificado
                    
                    actualizarCaracteristicas(armaValue, tipoCustom); // ✅ Usar valor custom
                    
                    // ✅ ESPERAR a que se actualicen las características antes de cargar el valor
                    setTimeout(function() {
                        const caracteristicaSelect = document.getElementById('caracteristica');
                        console.log("💾 Cargando característica CUSTOM:", caracteristicaCustom, "Opciones disponibles:", caracteristicaSelect.options.length);
                        caracteristicaSelect.value = caracteristicaCustom; // ✅ Usar valor custom
                        
                        actualizarPreviewSimbolo();
                    }, 50);
                }, 50);
            }
            
            document.getElementById('magnitud').value = sidc.charAt(11) || '-';
            document.getElementById('puestoComando').checked = ['A', 'D'].includes(sidc.charAt(10));
            document.getElementById('fuerzaTarea').checked = ['E', 'D'].includes(sidc.charAt(10));
            document.getElementById('designacion').value = elemento.options.designacion || '';
            document.getElementById('dependencia').value = elemento.options.dependencia || '';
            
            // ✅ CRÍTICO: Cargar tipo de vehículo si existe (campo custom)
            const tipoVehiculoSelect = document.getElementById('tipoVehiculo');
            if (tipoVehiculoSelect) {
                const tipoVehiculoGuardado = elemento.options.tipoVehiculo || '';
                console.log("💾 Cargando tipoVehiculo:", tipoVehiculoGuardado);
                if (tipoVehiculoGuardado) {
                    tipoVehiculoSelect.value = tipoVehiculoGuardado;
                }
            }
            
            // ✅ NUEVO: Cargar otros campos custom si existen
            if (elemento.options.tipo) {
                console.log("💾 Elemento tiene tipo custom guardado:", elemento.options.tipo);
            }
            if (elemento.options.caracteristica) {
                console.log("💾 Elemento tiene característica custom guardada:", elemento.options.caracteristica);
            }
        } else {
            // Panel abierto para crear nuevo elemento
            console.log("📝 Panel abierto para crear nuevo elemento");
            actualizarPreviewSimbolo();
        }
    }, 100); // 100ms para asegurar que el panel esté visible en el DOM
}

function mostrarPanelEdicionEquipo(elemento) {
    console.log("Mostrando panel de edición de equipo");
    mostrarPanelEdicion('panelEdicionEquipo');
    
    // ✅ CRÍTICO: Re-registrar event listeners para panel de equipo
    setTimeout(function() {
        // Registrar listeners específicos del panel de equipo
        const afiliacionEquipo = document.getElementById('afiliacionEquipo');
        const tipoVehiculoEquipo = document.getElementById('tipoVehiculoEquipo');
        const designacionEquipo = document.getElementById('designacionEquipo');
        const asignacionEquipo = document.getElementById('asignacionEquipo');
        
        if (afiliacionEquipo) {
            const clone = afiliacionEquipo.cloneNode(true);
            afiliacionEquipo.parentNode.replaceChild(clone, afiliacionEquipo);
            document.getElementById('afiliacionEquipo').addEventListener('change', actualizarPreviewSimboloEquipo);
        }
        
        if (tipoVehiculoEquipo) {
            const clone = tipoVehiculoEquipo.cloneNode(true);
            tipoVehiculoEquipo.parentNode.replaceChild(clone, tipoVehiculoEquipo);
            document.getElementById('tipoVehiculoEquipo').addEventListener('change', actualizarPreviewSimboloEquipo);
        }
        
        if (designacionEquipo) {
            const clone = designacionEquipo.cloneNode(true);
            designacionEquipo.parentNode.replaceChild(clone, designacionEquipo);
            document.getElementById('designacionEquipo').addEventListener('input', actualizarPreviewSimboloEquipo);
        }
        
        if (asignacionEquipo) {
            const clone = asignacionEquipo.cloneNode(true);
            asignacionEquipo.parentNode.replaceChild(clone, asignacionEquipo);
            document.getElementById('asignacionEquipo').addEventListener('input', actualizarPreviewSimboloEquipo);
        }
        
        console.log("✅ Event listeners de panel de equipo registrados");
        
        // Cargar datos del elemento
        if (elemento?.options?.sidc) {
            document.getElementById('afiliacionEquipo').value = elemento.options.sidc.charAt(1);
            document.getElementById('designacionEquipo').value = elemento.options.designacion || '';
            document.getElementById('asignacionEquipo').value = elemento.options.dependencia || '';
            
            // Determinar si es personal o vehículo y poblar opciones apropiadas
            const esPersonal = esEquipoPersonal(elemento.options.sidc);
            inicializarSelectorTipoEquipo(esPersonal);
            
            // Cargar tipo si existe
            const tipoEquipoSelect = document.getElementById('tipoVehiculoEquipo');
            if (tipoEquipoSelect && elemento.options.tipoVehiculo) {
                tipoEquipoSelect.value = elemento.options.tipoVehiculo;
            }
        }
        
        actualizarPreviewSimboloEquipo();
    }, 100);
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
    
    // Inicializar selector de tipo de vehículo
    // inicializarSelectorTipoVehiculo(); // ❌ Función no existe, comentada temporalmente
}

function esEquipoPersonal(sidc) {
    // Los equipos de personal tienen códigos que empiezan con UCI (Infantería)
    // Los equipos de vehículos tienen otros códigos
    const codigoUnidad = sidc.substr(4, 3); // Posiciones 4-6 (E + código de arma)
    return codigoUnidad === 'ECI' || codigoUnidad === 'E'; // Infantería o genérico
}

function inicializarSelectorTipoEquipo(esPersonal) {
    const tipoEquipoSelect = document.getElementById('tipoVehiculoEquipo');
    const tipoEquipoLabel = document.getElementById('labelTipoEquipo');
    
    if (!tipoEquipoSelect) return;
    
    // Cambiar el label según el tipo
    if (tipoEquipoLabel) {
        tipoEquipoLabel.textContent = esPersonal ? 'Tipo de Personal:' : 'Tipo de Vehículo:';
    }
    
    // Definir opciones según el tipo
    const opciones = esPersonal ? [
        { valor: 'TIRADOR', texto: 'Tirador - Soldado con fusil' },
        { valor: 'TIRADOR_PESADO', texto: 'Tirador Pesado - Ametralladora' },
        { valor: 'ATAN', texto: 'Arma ATAN - Antitanque' },
        { valor: 'MORTERO', texto: 'Mortero - Artillería ligera' },
        { valor: 'SNIPER', texto: 'Francotirador' },
        { valor: 'MEDICO', texto: 'Médico/Sanitario' },
        { valor: 'INGENIERO', texto: 'Ingeniero de Combate' },
        { valor: 'OBSERVADOR', texto: 'Observador/Oteador' }
    ] : [
        { valor: 'TAM', texto: 'TAM - Tanque Argentino Mediano' },
        { valor: 'TAM2C', texto: 'TAM 2C - Tanque Argentino Mediano 2C' },
        { valor: 'SK105', texto: 'SK-105 Kürassier' },
        { valor: 'VCTP', texto: 'VCTP - Vehículo de Combate de Transporte de Personal' },
        { valor: 'M113', texto: 'M113 - Transporte de Personal' },
        { valor: 'HUMVEE', texto: 'HUMVEE - Vehículo Multipropósito' },
        { valor: 'UNIMOG', texto: 'UNIMOG - Vehículo Logístico' },
        { valor: 'MERCEDES', texto: 'Mercedes-Benz - Vehículo de Apoyo' }
    ];
    
    // Poblar el selector
    tipoEquipoSelect.innerHTML = '<option value="">Seleccionar tipo...</option>';
    opciones.forEach(opcion => {
        let option = document.createElement('option');
        option.value = opcion.valor;
        option.textContent = opcion.texto;
        tipoEquipoSelect.appendChild(option);
    });
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
    
    window.map.off('zoomend', actualizarPosicionEtiqueta);
    window.map.on('zoomend', actualizarPosicionEtiqueta);
}

function actualizarEtiquetaEquipo(elemento) {
    // Reutilizar la misma lógica para unidades y equipos
    actualizarEtiquetaUnidad(elemento);
}

function validarDatosElemento(designacion, dependencia) {
    // ✅ CORREGIDO: Convertir a string ANTES de validar
    const desigStr = String(designacion || '').trim();
    const depStr = String(dependencia || '').trim();
    return desigStr && depStr;
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


function actualizarEstiloElemento() {
    if (!elementoSeleccionado) return;

    var color = document.getElementById('colorLinea').value;
    var ancho = parseInt(document.getElementById('anchoLinea').value);
    var tipo = document.getElementById('tipoLinea').value;

    console.log('💾 Guardando cambios:', { color, ancho, tipo });

    const nuevoEstilo = {
        color: color,
        weight: ancho,
        opacity: 1,
        dashArray: tipo === 'dashed' ? '5, 5' : null
    };

    console.log('💾 Guardando nuevo estilo completo:', nuevoEstilo);

    // ✅ GUARDAR EL ESTILO EDITADO EN EL ELEMENTO:
    elementoSeleccionado._editedStyle = { ...nuevoEstilo };
    
    // ✅ TAMBIÉN GUARDAR COMO PROPIEDADES DIRECTAS PARA COMPATIBILIDAD:
    elementoSeleccionado.color = color;
    elementoSeleccionado.ancho = ancho;
    elementoSeleccionado.tipo = tipo; // ✅ CRUCIAL: Guardar el tipo tal como viene del selector

    // ✅ APLICAR ESTILO MANTENIENDO COLOR EDITADO + GROSOR DE SELECCIÓN:
    const estiloConSeleccion = {
        ...nuevoEstilo,
        weight: ancho + 3 // Solo aumentar grosor para indicar selección
    };

    if (elementoSeleccionado instanceof L.Path) {
        elementoSeleccionado.setStyle(estiloConSeleccion);
    } else if (elementoSeleccionado.polyline) {
        elementoSeleccionado.polyline.setStyle(estiloConSeleccion);
        elementoSeleccionado.polyline._editedStyle = { ...nuevoEstilo };
        elementoSeleccionado.polyline.color = color;
        elementoSeleccionado.polyline.ancho = ancho;
        elementoSeleccionado.polyline.tipo = tipo; // ✅ También para polylines
    }

    console.log('✅ Estilo actualizado y guardado. Propiedades del elemento:', {
        _editedStyle: elementoSeleccionado._editedStyle,
        color: elementoSeleccionado.color,
        ancho: elementoSeleccionado.ancho,
        tipo: elementoSeleccionado.tipo
    });

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
        const tipoVehiculo = document.getElementById('tipoVehiculo')?.value || '';
        const esEquipoActual = esEquipo(nuevoSidc);
        
        // ✅ FIX #7: Guardar TIPO y CARACTERÍSTICA custom (no solo decodificado de SIDC)
        const tipoCustom = document.getElementById('tipo')?.value || tipo;
        const caracteristicaCustom = document.getElementById('caracteristica')?.value || '';
        
        console.log("💾 Guardando valores custom:", {
            tipoCustom: tipoCustom,
            caracteristicaCustom: caracteristicaCustom
        });
        
        // Validar campos requeridos: tipo, designación, magnitud, y propietario
        if (!tipo || tipo.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: El elemento debe tener un tipo definido", "error");
            }
            console.error('Validación fallida: falta tipo');
            return false;
        }
        
        if (!designacion || designacion.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar una designación para el elemento", "error");
            }
            console.error('Validación fallida: falta designación');
            return false;
        }
        
        if (!esEquipoActual && (!magnitud || magnitud.trim() === '')) {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar la magnitud del elemento", "error");
            }
            console.error('Validación fallida: falta magnitud');
            return false;
        }
        
        // ✅ VALIDACIÓN CONTEXTO-AWARE DE PROPIETARIO:
        const contextoJuego = detectarContextoJuego();
        console.log(`🎮 Contexto detectado: ${contextoJuego}`);
        
        let jugadorElemento = elementoSeleccionado.options.jugador || window.userId;
        
        switch (contextoJuego) {
            case 'planeamiento':
                // En planeamiento NO es necesario propietario, se puede editar libremente
                if (!jugadorElemento) {
                    jugadorElemento = 'planeamiento'; // Asignar valor por defecto
                    console.log('🎯 Planeamiento: Asignando propietario por defecto');
                }
                break;
                
            case 'local':
                // En juego local, auto-asignar el jugador actual en su turno
                if (!jugadorElemento) {
                    jugadorElemento = window.userId || window.jugadorActual || 'jugador1';
                    console.log(`🎲 Juego local: Auto-asignando jugador ${jugadorElemento}`);
                }
                break;
                
            case 'online':
                // En juego online, requiere propietario y emite cambios
                if (!jugadorElemento) {
                    if (window.MAIRA?.Utils?.mostrarNotificacion) {
                        window.MAIRA.Utils.mostrarNotificacion("Error: El elemento debe tener un propietario asignado", "error");
                    }
                    console.error('Validación fallida: falta propietario en modo online');
                    return false;
                }
                break;
        }
        
        console.log('✅ Validación completa - elemento tiene tipo, designación, magnitud y propietario');

        // Guardar la posición actual y el ID
        const posicionActual = elementoSeleccionado.getLatLng();
        const idElemento = elementoSeleccionado.options.id;
        const equipoElemento = elementoSeleccionado.options.equipo || window.equipoJugador;
        
        // Eliminar el marcador actual del calco
        window.calcoActivo.removeLayer(elementoSeleccionado);
        
        // Crear un nuevo marcador con todas las propiedades actualizadas PRIMERO
        const nuevoMarcador = L.marker(posicionActual, {
            draggable: true,
            id: idElemento,
            sidc: nuevoSidc,
            tipo: tipoCustom, // ✅ FIX #7: Guardar tipo custom
            caracteristica: caracteristicaCustom, // ✅ FIX #7: Guardar característica custom
            designacion: designacion,
            dependencia: dependencia,
            magnitud: !esEquipoActual ? magnitud : undefined,
            tipoVehiculo: tipoVehiculo,
            equipo: equipoElemento,
            jugador: jugadorElemento,
            nombre: `${designacion}${dependencia ? '/' + dependencia : ''}` // ✅ CORREGIDO: nombre completo
        });
        
        // ✅ AHORA sí crear el símbolo con las propiedades ya guardadas
        const sym = new ms.Symbol(nuevoSidc, { size: 35 });
        
        // Crear el icono y asignarlo al marcador
        const icon = L.divIcon({
            className: `custom-div-icon equipo-${equipoElemento}`,
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        });
        
        nuevoMarcador.setIcon(icon);

        // 🎯 ASIGNAR RECURSOS ORBAT AUTOMÁTICAMENTE
        if (typeof window.asignarRecursosORBATAlMarcador === 'function') {
            try {
                const asignado = window.asignarRecursosORBATAlMarcador(nuevoMarcador, nuevoSidc, tipoCustom);
                if (asignado) {
                    console.log('✅ Recursos ORBAT asignados automáticamente');
                }
            } catch (e) {
                console.warn('⚠️ Error asignando recursos ORBAT:', e);
            }
        }

        // Añadir el nuevo marcador al calco
        nuevoMarcador.addTo(window.calcoActivo);

        // ✅ DISPARAR EVENTO: Elemento modificado
        const eventoModificado = new CustomEvent('elementoModificado', {
            detail: {
                id: idElemento,
                sidc: nuevoSidc,
                jugador: jugadorElemento,
                equipo: equipoElemento,
                marcador: nuevoMarcador
            }
        });
        document.dispatchEvent(eventoModificado);
        console.log('📡 Evento elementoModificado disparado:', idElemento);
        
        // ✅ ACTUALIZAR LISTA DE ELEMENTOS DEL CALCO
        if (typeof window.actualizarElementosCalco === 'function') {
            window.actualizarElementosCalco();
            console.log('✅ Lista de elementos del calco actualizada después de crear marcador');
        }
        
        // ✅ ACTUALIZAR PANEL JUEGO V2 con DELAY (esperar a setIcon)
        setTimeout(() => {
            try {
                if (window.inicializadorV2 && 
                    typeof window.inicializadorV2.actualizarListaElementosPanel === 'function') {
                    console.log('🔍 Actualizando panel JuegoV2 con símbolo actualizado...');
                    window.inicializadorV2.actualizarListaElementosPanel();
                    console.log('✅ Panel JuegoV2 actualizado');
                }
            } catch(e) {
                console.warn('⚠️ Error actualizando panel JuegoV2:', e);
            }
        }, 150); // Delay para que setIcon complete el renderizado
        
        // Actualizar etiqueta
        actualizarEtiquetaUnidad(nuevoMarcador);
        
        // Actualizar referencia al elemento seleccionado
        elementoSeleccionado = nuevoMarcador;
        window.elementoSeleccionado = nuevoMarcador;
        
        // Cerrar panel
        cerrarPanelEdicion('panelEdicionUnidad');
        
        // ✅ GUARDAR SEGÚN CONTEXTO:
        console.log("Guardando elemento según contexto:", contextoJuego);
        let enviado = false;
        
        switch (contextoJuego) {
            case 'planeamiento':
                // En planeamiento, solo guardar localmente
                console.log("💾 Guardado local en planeamiento");
                enviado = true; // No necesita envío al servidor
                break;
                
            case 'local':
                // En juego local, guardar localmente y actualizar estado de partida
                console.log("🎲 Guardado local - Juego local");
                if (window.partidaLocal && typeof window.partidaLocal.actualizarElemento === 'function') {
                    window.partidaLocal.actualizarElemento(nuevoMarcador);
                }
                enviado = true;
                break;
                
            case 'online':
                // En juego online, emitir cambios via socket
                console.log("🌐 Enviando cambios - Juego online");
                enviado = enviarElementoAlServidor(nuevoMarcador);
                break;
        }
        
        if (enviado) {
            // Actualizar la lista de elementos del calco activo
            if (typeof window.actualizarElementosCalco === 'function') {
                window.actualizarElementosCalco();
            }
            
            // Notificar éxito
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Cambios guardados correctamente", "success");
            }
        }

        return enviado;
    } catch (error) {
        console.error('Error al guardar cambios:', error);
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
        
        // Validar campos requeridos para equipos: tipo, designación, y propietario
        // (Los equipos no requieren magnitud)
        
        if (!designacion || designacion.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar una designación para el equipo", "error");
            } else if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                window.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'Designación es obligatoria para equipos',
                    'error'
                );
            } else {
                alert('Designación es obligatoria para equipos');
            }
            return false;
        }
        
        if (!dependencia || dependencia.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar la dependencia/asignación para el equipo", "error");
            } else if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                window.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'Asignación es obligatoria para equipos',
                    'error'
                );
            } else {
                alert('Asignación es obligatoria para equipos');
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
        // Función auxiliar para obtener el jugador propietario correcto
        function obtenerJugadorPropietario() {
            if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
                return window.gestorTurnos.obtenerJugadorPropietario();
            }
            return window.userId;
        }

        const tipoVehiculoEquipo = document.getElementById('tipoVehiculoEquipo')?.value || '';
        
        // Lógica de modelo por defecto: si es personal y no hay modelo específico, usar SOLDADO_RIFLE
        let modelo3DAsignado = tipoVehiculoEquipo;
        if (esEquipoPersonal(elementoSeleccionado) && (!tipoVehiculoEquipo || tipoVehiculoEquipo.trim() === '')) {
            modelo3DAsignado = 'SOLDADO_RIFLE';
            console.log('🎯 Asignando modelo por defecto para personal: SOLDADO_RIFLE');
        }
        
        const nuevoMarcador = L.marker(posicionActual, {
            icon: icon,
            draggable: true,
            id: idElemento,
            sidc: nuevoSidc,
            tipo: tipo,
            designacion: designacion,
            dependencia: dependencia,
            tipoVehiculo: modelo3DAsignado, // ✅ Usar modelo asignado (con lógica de defecto)
            equipoJugador: equipoElemento,
            jugadorId: obtenerJugadorPropietario(),
            nombre: `${designacion}${dependencia ? '/' + dependencia : ''}` // ✅ CORREGIDO: nombre completo
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
        
        // Actualizar la lista de elementos del calco activo
        if (typeof window.actualizarElementosCalco === 'function') {
            window.actualizarElementosCalco();
        }
        
        // ✅ ACTUALIZAR PANEL JUEGO V2 (SIEMPRE si existe)
        try {
            if (window.inicializadorV2 && 
                typeof window.inicializadorV2.actualizarListaElementosPanel === 'function') {
                console.log('🔍 Intentando actualizar panel JuegoV2 después de editar equipo...');
                window.inicializadorV2.actualizarListaElementosPanel();
                console.log('✅ Panel JuegoV2 actualizado después de editar equipo');
            } else {
                console.log('⏭️ Panel JuegoV2 no disponible después de editar equipo');
            }
        } catch(e) {
            console.warn('⚠️ Error actualizando panel JuegoV2 después de editar equipo:', e);
        }
        
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
    try {
        // Modificar para usar el socket correcto desde MAIRA.GestionBatalla
        const socket = window.MAIRA?.GestionBatalla?.getSocket?.() || window.socket;
        
        if (!socket?.connected) {
            console.error('[EdicionCompleto] Socket no conectado');
            return false;
        }

        // Función auxiliar para obtener el jugador propietario correcto
        function obtenerJugadorPropietario() {
            if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
                return window.gestorTurnos.obtenerJugadorPropietario();
            }
            return window.userId;
        }

        const datosElemento = {
            id: elemento.options.id,
            tipo: elemento.options.tipo,
            sidc: elemento.options.sidc,
            designacion: elemento.options.designacion,
            dependencia: elemento.options.dependencia,
            magnitud: elemento.options.magnitud,
            coordenadas: elemento.getLatLng(),
            equipo: window.equipoJugador,
            jugadorId: obtenerJugadorPropietario(),
            operacion: window.MAIRA?.GestionBatalla?.operacionActual || window.operacionActual
        };

        // Emitir por múltiples canales para asegurar compatibilidad
        socket.emit('guardarElemento', datosElemento);
        socket.emit('actualizarElemento', datosElemento);
        socket.emit('nuevoElemento', datosElemento);

        return true;
    } catch (error) {
        console.error('[EdicionCompleto] Error:', error);
        return false;
    }
}

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

function guardarCambiosMCC(elemento, tipo) {
    let nuevoTexto = document.getElementById('textoMCC').value;
    let nuevoColor = document.getElementById('colorMCC').value;
    let nuevoAncho = parseInt(document.getElementById('anchoMCC').value);
    let nuevoTipoLinea = document.getElementById('tipoLineaMCC').value;

    console.log('💾 Guardando cambios MCC:', {
        texto: nuevoTexto,
        color: nuevoColor,
        ancho: nuevoAncho,
        tipoLinea: nuevoTipoLinea
    });

    // ✅ CRÍTICO: Actualizar PRIMERO elemento.options (persistencia)
    elemento.options.color = nuevoColor;
    elemento.options.weight = nuevoAncho;
    elemento.options.dashArray = nuevoTipoLinea === 'dashed' ? '5,5' : null;
    elemento.options.nombre = nuevoTexto;
    elemento.options.texto = nuevoTexto;

    // ✅ LUEGO actualizar el estilo visual
    elemento.setStyle({
        color: nuevoColor,
        weight: nuevoAncho,
        dashArray: nuevoTipoLinea === 'dashed' ? '5,5' : null
    });

    if (tipo === 'poligono') {
        let nuevoRelleno = document.getElementById('tipoRellenoMCC').value;
        let nuevoColorRelleno = document.getElementById('colorRellenoMCC').value;
        
        // ✅ CRÍTICO: Guardar en options
        elemento.options.tipoRelleno = nuevoRelleno;
        elemento.options.fillColor = nuevoColorRelleno;
        
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
        
        // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
        elemento.textoMarcador.on('click', function(e) {
            console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
            seleccionarElemento(elemento);
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('dblclick', function(e) {
            console.log('🎯 Doble click en textoMarcador - editando elemento padre');
            if (typeof editarElementoSeleccionado === 'function') {
                window.elementoSeleccionado = elemento;
                editarElementoSeleccionado();
            }
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('contextmenu', function(e) {
            console.log('🎯 Click derecho en textoMarcador - menú contextual del elemento padre');
            window.elementoSeleccionado = elemento;
            seleccionarElemento(elemento);
            // Permitir que el menú contextual se propague
        });
        
        // ✅ REFERENCIA BIDIRECCIONAL:
        elemento.textoMarcador.elementoPadre = elemento;
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
        
        // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
        elemento.textoMarcador.on('click', function(e) {
            console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
            seleccionarElemento(elemento);
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('dblclick', function(e) {
            console.log('🎯 Doble click en textoMarcador - editando elemento padre');
            if (typeof editarElementoSeleccionado === 'function') {
                window.elementoSeleccionado = elemento;
                editarElementoSeleccionado();
            }
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('contextmenu', function(e) {
            console.log('🎯 Click derecho en textoMarcador - menú contextual del elemento padre');
            window.elementoSeleccionado = elemento;
            seleccionarElemento(elemento);
            // Permitir que el menú contextual se propague
        });
        
        // ✅ REFERENCIA BIDIRECCIONAL:
        elemento.textoMarcador.elementoPadre = elemento;
    }

    cerrarPanelEdicion('panelEdicionMCC');
    console.log('Cambios MCC guardados');
    
    // ✅ ACTUALIZAR SOLO textoMarcador (NO TOOLTIP):
    if (elemento.textoMarcador && nuevoTexto && nuevoTexto.trim() !== '') {
        // Actualizar textoMarcador existente
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            divTexto.textContent = nuevoTexto;
            elemento.options.texto = nuevoTexto;
            elemento.texto = nuevoTexto;
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
            console.log(`✅ textoMarcador actualizado: "${nuevoTexto}"`);
        }
    } else if ((!elemento.textoMarcador || !nuevoTexto || nuevoTexto.trim() === '')) {
        // Eliminar textoMarcador si no hay texto
        if (elemento.textoMarcador) {
            calcoActivo.removeLayer(elemento.textoMarcador);
            elemento.textoMarcador = null;
            console.log(`🗑️ textoMarcador eliminado`);
        }
        elemento.options.texto = null;
        elemento.texto = null;
        elemento.options.nombre = null;
        elemento.nombre = null;
    } else if (nuevoTexto && nuevoTexto.trim() !== '' && !elemento.textoMarcador) {
        // Crear nuevo textoMarcador
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
        
        // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
        elemento.textoMarcador.on('click', function(e) {
            console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
            seleccionarElemento(elemento);
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('dblclick', function(e) {
            console.log('🎯 Doble click en textoMarcador - editando elemento padre');
            if (typeof editarElementoSeleccionado === 'function') {
                window.elementoSeleccionado = elemento;
                editarElementoSeleccionado();
            }
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('contextmenu', function(e) {
            console.log('🎯 Click derecho en textoMarcador - menú contextual del elemento padre');
            window.elementoSeleccionado = elemento;
            seleccionarElemento(elemento);
            // Permitir que el menú contextual se propague
        });
        
        // ✅ REFERENCIA BIDIRECCIONAL:
        elemento.textoMarcador.elementoPadre = elemento;
    }
    
    // Actualizar la lista de elementos del calco activo
    if (typeof window.actualizarElementosCalco === 'function') {
        window.actualizarElementosCalco();
    }
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
    elementoSeleccionado = elemento;
    
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

function guardarCambiosLinea() {
    if (!elementoSeleccionado) return;
    
    // Obtener los nuevos valores
    const nuevoNombre = document.getElementById('nombreLinea').value;
    const nuevoColor = document.getElementById('colorLinea').value;
    const nuevoAncho = parseInt(document.getElementById('anchoLinea').value);
    const nuevoDashArray = document.getElementById('tipoLinea').value === 'dashed' ? '5, 5' : null;
    
    console.log("Guardando cambios, nuevo nombre:", nuevoNombre);
    
    // Actualizar propiedades del elemento
    elementoSeleccionado.options = elementoSeleccionado.options || {};
    elementoSeleccionado.options.nombre = nuevoNombre;
    elementoSeleccionado.options.color = nuevoColor;
    elementoSeleccionado.options.weight = nuevoAncho;
    elementoSeleccionado.options.dashArray = nuevoDashArray;
    
    // También actualizar propiedades directas
    elementoSeleccionado.nombre = nuevoNombre;
    elementoSeleccionado.color = nuevoColor;
    elementoSeleccionado.ancho = nuevoAncho;
    elementoSeleccionado.tipo = document.getElementById('tipoLinea').value;
    
    // Aplicar estilo visual
    elementoSeleccionado.setStyle({
        color: nuevoColor,
        weight: nuevoAncho,
        dashArray: nuevoDashArray
    });
    
    // IMPORTANTE: Actualizar SOLO el textoMarcador existente, NO llamar a actualizarTextoElemento
    if (elementoSeleccionado.textoMarcador && elementoSeleccionado.textoMarcador._icon) {
        const divTexto = elementoSeleccionado.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            console.log("Actualizando texto directamente:", nuevoNombre);
            divTexto.textContent = nuevoNombre;
        }
    }
    
    // Eliminar cualquier textoAsociado que pudiera existir
    if (elementoSeleccionado.textoAsociado) {
        console.log("Eliminando textoAsociado duplicado");
        try {
            calcoActivo.removeLayer(elementoSeleccionado.textoAsociado);
            elementoSeleccionado.textoAsociado = null;
        } catch (e) {
            console.error("Error al eliminar textoAsociado:", e);
        }
    }
    
    // Actualizar la lista de elementos del calco activo
    if (typeof window.actualizarElementosCalco === 'function') {
        window.actualizarElementosCalco();
    }
    
    cerrarPanelEdicion('panelEdicionLinea');
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
        posicion = window.map.getCenter();
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
    }).addTo(calcoActivo || window.map);
    
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
                    e.target.setLatLng(map.layerPointToLatLng(closestPoint));
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
            } else if (window.map && window.map.hasLayer(capa)) {
                window.map.removeLayer(capa);
            }
        });
        elemento._capasSecundarias = null;
    }
    
    // Si hay algún patrón aplicado al elemento, eliminarlo
    if (elemento.options.fillPattern && elemento.options.fillPattern._removeShapes) {
        window.map.removePattern(elemento.options.fillPattern);
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
                // Añadir patrones al map
                patronCompuesto.patrones.forEach(patron => {
                    patron.addTo(window.map);
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
                }).addTo(window.calcoActivo || window.map);
                
                // Guardar referencia para poder eliminarlo después
                elemento._capasSecundarias = [segundaLayer];
            }
            break;
            
        case 'puntos':
            const patronPuntos = obtenerPatronRelleno(tipoRelleno, color);
            if (patronPuntos) {
                // Añadir el patrón al map
                patronPuntos.addTo(window.map);
                
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
                patron.addTo(window.map);
                elemento.setStyle({
                    fillPattern: patron,
                    fillOpacity: 1
                });
            }
            break;
    }
}

function inicializarValidacionesTiempoReal() {
    // Validaciones para panel de unidades
    const camposUnidad = ['designacion', 'dependencia', 'magnitud'];
    camposUnidad.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.addEventListener('input', () => validarCampoUnidad(campoId));
            campo.addEventListener('blur', () => validarCampoUnidad(campoId));
        }
    });

    // Validaciones para panel de equipos
    const camposEquipo = ['designacionEquipo', 'asignacionEquipo'];
    camposEquipo.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.addEventListener('input', () => validarCampoEquipo(campoId));
            campo.addEventListener('blur', () => validarCampoEquipo(campoId));
        }
    });

    // Validación del selector de tipo de vehículo/equipo
    const tipoVehiculoSelect = document.getElementById('tipoVehiculoEquipo');
    if (tipoVehiculoSelect) {
        tipoVehiculoSelect.addEventListener('change', () => validarTipoVehiculo());
    }
}

function validarCampoUnidad(campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    const valor = campo.value.trim();
    const esRequerido = ['designacion', 'dependencia', 'magnitud'].includes(campoId);

    // Remover clases de validación previas
    campo.classList.remove('campo-valido', 'campo-invalido');

    if (esRequerido && valor === '') {
        campo.classList.add('campo-invalido');
        mostrarTooltipCampo(campo, 'Este campo es obligatorio');
    } else if (esRequerido && valor !== '') {
        campo.classList.add('campo-valido');
        ocultarTooltipCampo(campo);
    }
}

function validarCampoEquipo(campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    const valor = campo.value.trim();
    const esRequerido = ['designacionEquipo', 'asignacionEquipo'].includes(campoId);

    // Remover clases de validación previas
    campo.classList.remove('campo-valido', 'campo-invalido');

    if (esRequerido && valor === '') {
        campo.classList.add('campo-invalido');
        mostrarTooltipCampo(campo, 'Este campo es obligatorio');
    } else if (esRequerido && valor !== '') {
        campo.classList.add('campo-valido');
        ocultarTooltipCampo(campo);
    }
}

function validarTipoVehiculo() {
    const select = document.getElementById('tipoVehiculoEquipo');
    if (!select) return;

    select.classList.remove('campo-valido', 'campo-invalido');

    if (select.value && select.value !== '') {
        select.classList.add('campo-valido');
        ocultarTooltipCampo(select);
    } else {
        // No marcar como inválido si no hay selección, solo como válido si hay
        ocultarTooltipCampo(select);
    }
}

function ocultarTooltipCampo(campo) {
    // Buscar y remover tooltip asociado al campo
    const tooltips = document.querySelectorAll('.tooltip-validacion');
    tooltips.forEach(tooltip => {
        if (tooltip.dataset.fieldId === campo.id) {
            tooltip.remove();
        }
    });
}

function mostrarTooltipCampo(campo, mensaje) {
    // Remover tooltip existente
    ocultarTooltipCampo(campo);

    // Crear nuevo tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-validacion';
    tooltip.textContent = mensaje;
    tooltip.dataset.fieldId = campo.id; // Asociar tooltip con el campo
    tooltip.style.cssText = `
        position: absolute;
        background: #ff6b6b;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        pointer-events: none;
        white-space: nowrap;
    `;

    // Posicionar tooltip
    const rect = campo.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 30) + 'px';

    document.body.appendChild(tooltip);
    campo._tooltipValidacion = tooltip;

    // Auto-ocultar después de 3 segundos
    setTimeout(() => ocultarTooltipCampo(campo), 3000);
}

function inicializarTooltipsInformativos() {
    // Tooltips para tipos de personal
    const opcionesPersonal = [
        { selector: 'option[value="TIRADOR"]', tooltip: 'Soldado con fusil de asalto estándar' },
        { selector: 'option[value="TIRADOR_PESADO"]', tooltip: 'Soldado equipado con ametralladora ligera' },
        { selector: 'option[value="ATAN"]', tooltip: 'Especialista en armas antitanque' },
        { selector: 'option[value="MORTERO"]', tooltip: 'Operador de mortero de infantería' },
        { selector: 'option[value="SNIPER"]', tooltip: 'Tirador de precisión de largo alcance' },
        { selector: 'option[value="MEDICO"]', tooltip: 'Personal médico de combate' },
        { selector: 'option[value="INGENIERO"]', tooltip: 'Ingeniero de combate' },
        { selector: 'option[value="OBSERVADOR"]', tooltip: 'Observador avanzado/oteador' }
    ];

    // Tooltips para tipos de vehículos
    const opcionesVehiculos = [
        { selector: 'option[value="TAM"]', tooltip: 'Tanque Argentino Mediano - Blindado principal' },
        { selector: 'option[value="TAM2C"]', tooltip: 'TAM 2C - Versión mejorada con mayor potencia de fuego' },
        { selector: 'option[value="SK105"]', tooltip: 'SK-105 Kürassier - Tanque ligero austríaco' },
        { selector: 'option[value="VCTP"]', tooltip: 'Vehículo de Combate de Transporte de Personal' },
        { selector: 'option[value="M113"]', tooltip: 'M113 - Transporte blindado de personal' },
        { selector: 'option[value="HUMVEE"]', tooltip: 'Vehículo multipropósito de alta movilidad' },
        { selector: 'option[value="UNIMOG"]', tooltip: 'Vehículo logístico todo terreno' },
        { selector: 'option[value="MERCEDES"]', tooltip: 'Vehículo de apoyo logístico' }
    ];

    // Agregar tooltips a opciones de personal
    opcionesPersonal.forEach(item => {
        const opciones = document.querySelectorAll(`#tipoVehiculoEquipo ${item.selector}`);
        opciones.forEach(opcion => {
            opcion.title = item.tooltip;
        });
    });

    // Agregar tooltips a opciones de vehículos
    opcionesVehiculos.forEach(item => {
        const opciones = document.querySelectorAll(`#tipoVehiculoEquipo ${item.selector}`);
        opciones.forEach(opcion => {
            opcion.title = item.tooltip;
        });
    });

    // Tooltips para campos de formulario
    const camposConTooltip = [
        { id: 'designacion', tooltip: 'Nombre o identificación del elemento (ej: "Batallón Alpha", "Compañía 1")' },
        { id: 'dependencia', tooltip: 'Unidad superior o dependencia (ej: "Brigada 1", "División A")' },
        { id: 'magnitud', tooltip: 'Tamaño de la unidad (ej: "1", "2", "3" para compañía, batallón, regimiento)' },
        { id: 'designacionEquipo', tooltip: 'Nombre del equipo o grupo (ej: "Pelotón Alfa", "Sección Bravo")' },
        { id: 'asignacionEquipo', tooltip: 'Unidad a la que pertenece (ej: "Compañía A", "Batallón 1")' }
    ];

    camposConTooltip.forEach(item => {
        const campo = document.getElementById(item.id);
        if (campo) {
            campo.title = item.tooltip;
        }
    });
}

function inicializarAtajosTeclado() {
    document.addEventListener('keydown', function(event) {
        // Solo procesar atajos si hay un panel de edición abierto
        const panelAbierto = document.querySelector('.panel-edicion-completo.show');
        if (!panelAbierto) return;

        // Ctrl+Enter: Guardar cambios
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();

            if (panelAbierto.id === 'panelEdicionUnidad') {
                guardarCambiosUnidad();
            } else if (panelAbierto.id === 'panelEdicionEquipo') {
                guardarCambiosEquipo();
            } else if (panelAbierto.id === 'panelEdicionLinea') {
                guardarCambiosLinea();
            } else if (panelAbierto.id === 'panelEdicionMCC') {
                guardarCambiosMCC(window.elementoSeleccionado, determinarTipoMCC(window.elementoSeleccionado));
            }

            console.log('🎯 Atajo Ctrl+Enter: Guardando cambios');
        }

        // Escape: Cerrar panel
        if (event.key === 'Escape') {
            event.preventDefault();
            cerrarTodosPaneles();
            console.log('🎯 Atajo Escape: Cerrando panel');
        }
    });
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

/**
 * Registra event listeners para el panel de edición de unidad
 * Se llama cada vez que se abre el panel para asegurar que los listeners existan
 * ✅ FIX 16/Oct/2025: Re-registrar listeners al abrir panel para evitar pérdida de eventos
 */
function registrarListenersPanelEdicion() {
    console.log("🔧 Registrando event listeners del panel de edición");
    
    // Verificar que los elementos existen
    const armaSelect = document.getElementById('arma');
    const tipoSelect = document.getElementById('tipo');
    const caracteristicaSelect = document.getElementById('caracteristica');
    
    if (!armaSelect || !tipoSelect || !caracteristicaSelect) {
        console.error("❌ No se encontraron los dropdowns del panel");
        console.log("arma:", !!armaSelect, "tipo:", !!tipoSelect, "caracteristica:", !!caracteristicaSelect);
        return false;
    }
    
    // Remover listeners antiguos clonando los elementos (truco para limpiar listeners)
    const armaClone = armaSelect.cloneNode(true);
    const tipoClone = tipoSelect.cloneNode(true);
    const caracteristicaClone = caracteristicaSelect.cloneNode(true);
    
    armaSelect.parentNode.replaceChild(armaClone, armaSelect);
    tipoSelect.parentNode.replaceChild(tipoClone, tipoSelect);
    caracteristicaSelect.parentNode.replaceChild(caracteristicaClone, caracteristicaSelect);
    
    // Registrar nuevos listeners en los elementos clonados
    document.getElementById('arma').addEventListener('change', function() {
        console.log("🔄 Arma cambiada a:", this.value);
        actualizarTipos(this.value);
        actualizarPreviewSimbolo();
    });
    
    document.getElementById('tipo').addEventListener('change', function() {
        console.log("🔄 Tipo cambiado a:", this.value);
        const armaVal = document.getElementById('arma').value;
        actualizarCaracteristicas(armaVal, this.value);
        actualizarPreviewSimbolo();
    });
    
    document.getElementById('caracteristica').addEventListener('change', function() {
        console.log("🔄 Característica cambiada a:", this.value);
        actualizarPreviewSimbolo();
    });
    
    // Registrar listeners para todos los campos que actualizan el preview
    ['afiliacion', 'estado', 'magnitud', 'puestoComando', 'fuerzaTarea', 'reforzado', 'disminuido', 'designacion', 'dependencia', 'tipoVehiculo'].forEach(function(id) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.removeEventListener('change', actualizarPreviewSimbolo); // Remover duplicados
            elemento.addEventListener('change', actualizarPreviewSimbolo);
            if (elemento.tagName === 'INPUT' && elemento.type === 'text') {
                elemento.removeEventListener('input', actualizarPreviewSimbolo);
                elemento.addEventListener('input', actualizarPreviewSimbolo);
            }
        }
    });
    
    console.log("✅ Event listeners registrados correctamente");
    return true;
}


// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    inicializarSelectores();
    inicializarValidacionesTiempoReal(); // ✅ Agregar validaciones en tiempo real
    inicializarTooltipsInformativos(); // ✅ Agregar tooltips informativos
    inicializarAtajosTeclado(); // ✅ Agregar atajos de teclado

    document.getElementById('arma').addEventListener('change', function() {
        actualizarTipos(this.value);
    });

    document.getElementById('tipo').addEventListener('change', function() {
        actualizarCaracteristicas(document.getElementById('arma').value, this.value);
    });

    ['afiliacion', 'estado', 'arma', 'tipo', 'caracteristica', 'magnitud', 'puestoComando', 'fuerzaTarea', 'reforzado', 'disminuido', 'designacion', 'dependencia', 'tipoVehiculo', 'tipoVehiculoEquipo'].forEach(function(id) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('change', actualizarPreviewSimbolo);
        }
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
    console.log("🎯 [DEBUG] editarElementoSeleccionado (original) llamada");
    
    // ✅ USAR WINDOW.ELEMENTOSELECCIONADO PARA CONSISTENCIA
    const elemento = window.elementoSeleccionado || elementoSeleccionado;
    console.log("🎯 [DEBUG] elementoSeleccionado:", elemento);
    
    if (!elemento) {
        console.warn("🎯 [DEBUG] No hay elementoSeleccionado");
        return;
    }

    console.log("🎯 [DEBUG] Tipo de elemento:", elemento.constructor.name);
    console.log("🎯 [DEBUG] Es marker:", elemento instanceof L.Marker);
    console.log("🎯 [DEBUG] Es polyline:", elemento instanceof L.Polyline);
    console.log("🎯 [DEBUG] Es polygon:", elemento instanceof L.Polygon);
    
    // ✅ VERIFICAR POLYLINE/POLYGON PRIMERO (antes de marker)
    if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        console.log("🎯 [DEBUG] Es polyline/polygon, mostrando panel MCC");
        const tipoMCC = determinarTipoMCC(elemento);
        console.log("🎯 [DEBUG] Tipo MCC determinado:", tipoMCC);
        mostrarPanelEdicionMCC(elemento, tipoMCC);
        return; // ✅ SALIR después de abrir panel
    }
    
    if (elemento instanceof L.Marker) {
        console.log("🎯 [DEBUG] options:", elemento.options);
        console.log("🎯 [DEBUG] sidc:", elemento.options.sidc);
        
        if (elemento.options.sidc) {
            console.log("🎯 [DEBUG] Verificando tipo de SIDC...");
            if (esEquipo(elemento.options.sidc)) {
                console.log("🎯 [DEBUG] Es equipo, mostrando panel equipo");
                mostrarPanelEdicionEquipo(elemento);
            } else if (esUnidad(elemento.options.sidc)) {
                console.log("🎯 [DEBUG] Es unidad, mostrando panel unidad");
                mostrarPanelEdicionUnidad(elemento);
            } else {
                console.log("🎯 [DEBUG] Elemento especial, tratando como MCC");
                // Para elementos sin SIDC específico, tratar como MCC
                mostrarPanelEdicionMCC(elemento, 'linea');
            }
        } else {
            console.log("🎯 [DEBUG] Elemento sin SIDC identificado");
        }
    } else {
        console.warn("🎯 [DEBUG] Tipo de elemento no reconocido:", elemento.constructor.name);
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
    // Función auxiliar para obtener el jugador propietario correcto
    function obtenerJugadorPropietario() {
        if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
            return window.gestorTurnos.obtenerJugadorPropietario();
        }
        return window.userId;
    }
    
    const jugadorId = obtenerJugadorPropietario();
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
    
    // En verificarElementosAntesDeEnviarListo(), agregar:
    if (window.gestorJuego?.gestorFases?.validarElementosJugador) {
        return window.gestorJuego.gestorFases.validarElementosJugador(jugadorId);
    }

    return elementos.length > 0;
}

// Usar esta función justo antes de enviar el estado "listo" al servidor



// Exportación de funciones para uso en otros archivos
window.mostrarPanelEdicionUnidad = mostrarPanelEdicionUnidad;
window.guardarCambiosUnidad = guardarCambiosUnidad;
window.cerrarPanelEdicion = cerrarPanelEdicion;
window.cerrarTodosPaneles = cerrarTodosPaneles; // ✅ AGREGAR FUNCIÓN FALTANTE
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

// Preservar la función original para uso en GB
window.editarElementoSeleccionadoOriginal = editarElementoSeleccionado;

// AGREGAR al final del archivo:
window.MAIRA = window.MAIRA || {};
window.MAIRA.EdicionCompleto = {
    verificarElementos: verificarElementosAntesDeEnviarListo,
    validarDatos: validarDatosElemento,
    aplicarRelleno: aplicarRelleno,
    obtenerPatronRelleno: obtenerPatronRelleno
};