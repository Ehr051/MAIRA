/**
 * elementoUtils.js
 * Funciones centralizadas para extraer datos de elementos/marcadores
 * Usa la misma lógica que mostrarPanelEdicionUnidad() y calcosP.js
 */

// ============================================================================
// FUNCIONES AUXILIARES PARA STATS BV8
// ============================================================================

/**
 * Calcula stats de la tripulación fija del vehículo
 * @param {Object} datosBV8 - Datos BV8 del vehículo
 * @returns {Object} Stats de tripulación
 */
function calcularStatsTripulacion(datosBV8) {
    if (!datosBV8?.vehiculo?.tripulacion) {
        return {
            personal: 0,
            agua: 0,
            raciones: 0,
            municion: {}
        };
    }

    const tripulacion = datosBV8.vehiculo.tripulacion;
    const dotacion = datosBV8.vehiculo.dotacion_inicial || {};
    const totalTripulacion = tripulacion.total || 0;

    // Agua y raciones por persona (BV8: 3.5L/persona/día)
    const aguaPorPersona = 3.5;
    const racionesPorPersona = dotacion.raciones_dias || 3;

    return {
        personal: totalTripulacion,
        agua: dotacion.agua_litros || (totalTripulacion * aguaPorPersona),
        raciones: totalTripulacion * racionesPorPersona,
        municion: dotacion.municion || {},
        roles: tripulacion.roles || {}
    };
}

/**
 * Calcula stats del personal embarcado (infantería dentro del vehículo)
 * @param {Object} elemento - Marcador del vehículo
 * @param {Object} datosBV8 - Datos BV8 del vehículo
 * @returns {Object} Stats del personal embarcado
 */
function calcularStatsPersonalEmbarcado(elemento, datosBV8) {
    const personalEmbarcado = elemento.options?.personalEmbarcado;

    if (!personalEmbarcado || !personalEmbarcado.grupos || personalEmbarcado.grupos.length === 0) {
        return {
            personal: 0,
            agua: 0,
            raciones: 0,
            municion: {},
            grupos: []
        };
    }

    let totalPersonal = 0;
    let totalAgua = 0;
    let totalRaciones = 0;
    let municionCombinada = {};
    const grupos = [];

    // Iterar sobre cada grupo embarcado
    personalEmbarcado.grupos.forEach(grupo => {
        const cantidadPersonal = grupo.cantidad || 0;
        const aguaPorPersona = 3.5; // BV8 estándar
        const racionesPorPersona = 3;

        totalPersonal += cantidadPersonal;
        totalAgua += cantidadPersonal * aguaPorPersona;
        totalRaciones += cantidadPersonal * racionesPorPersona;

        // Munición del grupo
        if (grupo.municion) {
            for (const [tipo, cantidad] of Object.entries(grupo.municion)) {
                municionCombinada[tipo] = (municionCombinada[tipo] || 0) + cantidad;
            }
        }

        grupos.push({
            nombre: grupo.nombre || 'Grupo',
            cantidad: cantidadPersonal,
            equipos: grupo.equipos || []
        });
    });

    return {
        personal: totalPersonal,
        agua: totalAgua,
        raciones: totalRaciones,
        municion: municionCombinada,
        grupos: grupos
    };
}

/**
 * Combina munición de múltiples fuentes
 * @param {...Object} fuentes - Objetos con munición
 * @returns {Object} Munición combinada
 */
function combinarMunicion(...fuentes) {
    const municionTotal = {};

    fuentes.forEach(fuente => {
        if (!fuente) return;

        for (const [tipo, cantidad] of Object.entries(fuente)) {
            municionTotal[tipo] = (municionTotal[tipo] || 0) + cantidad;
        }
    });

    return municionTotal;
}

/**
 * Calcula TODOS los stats agregados de un vehículo con personal embarcado
 * @param {Object} elemento - Marcador del vehículo
 * @param {Object} datosBV8 - Datos BV8 del vehículo
 * @returns {Object} Stats totales agregados
 */
function calcularStatsAgregados(elemento, datosBV8) {
    if (!datosBV8) {
        return null;
    }

    // Stats de tripulación fija
    const statsTripulacion = calcularStatsTripulacion(datosBV8);

    // Stats de personal embarcado
    const statsEmbarcado = calcularStatsPersonalEmbarcado(elemento, datosBV8);

    // Stats del vehículo (combustible, munición de vehículo)
    const dotacionVehiculo = datosBV8.vehiculo?.dotacion_inicial || {};
    const movilidad = datosBV8.vehiculo?.movilidad || {};

    // Combinar munición de todas las fuentes
    const municionTotal = combinarMunicion(
        statsTripulacion.municion,
        statsEmbarcado.municion,
        dotacionVehiculo.municion
    );

    // 📊 STATS AGREGADOS TOTALES
    return {
        // 🧑‍✈️ Personal total
        personal: {
            total: statsTripulacion.personal + statsEmbarcado.personal,
            tripulacion: statsTripulacion.personal,
            embarcado: statsEmbarcado.personal,
            max_capacidad: (datosBV8.vehiculo?.tripulacion?.total || 0) +
                          (datosBV8.vehiculo?.tripulacion?.pasajeros || 0)
        },

        // ⛽ Combustible
        combustible: {
            actual: dotacionVehiculo.combustible_litros || 0,
            capacidad: movilidad.capacidad_combustible_litros || 0,
            tipo: movilidad.combustible_tipo || 'gasoil',
            consumo_km: movilidad.consumo_km_litros || 0,
            autonomia_km: movilidad.autonomia_km || 0
        },

        // 🔫 Munición (vehículo + personal)
        municion: {
            tipos: municionTotal,
            total_tipos: Object.keys(municionTotal).length
        },

        // 💪 Moral (inicial 100%, se degrada con combate/tiempo)
        moral: {
            actual: 100,
            max: 100,
            estado: 'alta'
        },

        // 🍽️ Raciones
        raciones: {
            total: statsTripulacion.raciones + statsEmbarcado.raciones,
            dias_disponibles: dotacionVehiculo.raciones_dias || 3
        },

        // 💧 Agua
        agua: {
            actual: statsTripulacion.agua + statsEmbarcado.agua,
            capacidad: dotacionVehiculo.agua_litros ||
                      (statsTripulacion.agua + statsEmbarcado.agua)
        },

        // 📋 Desglose detallado
        desglose: {
            tripulacion: statsTripulacion,
            embarcado: statsEmbarcado
        }
    };
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE EXTRACCIÓN DE DATOS
// ============================================================================

/**
 * Extrae TODOS los datos de un elemento/marcador de forma coherente
 * Similar a cómo lo hace mostrarPanelEdicionUnidad() y calcosP.js
 *
 * @param {L.Marker|Object} elemento - Marcador de Leaflet o referencia al elemento
 * @returns {Object|null} Datos completos del elemento o null si no es válido
 */
function obtenerDatosElemento(elemento) {
    if (!elemento) {
        console.warn('⚠️ obtenerDatosElemento: elemento es null o undefined');
        return null;
    }

    try {
        // 🔍 PASO 1: Obtener SIDC
        const sidc = elemento.getAttribute?.('data-sidc') || 
                     elemento.options?.sidc || 
                     '';

        // 🔍 PASO 2: Extraer designación/dependencia del LABEL (como panel edición)
        let designacion = '';
        let dependencia = '';
        
        // Intentar extraer del label visual (PRIORIDAD MÁXIMA)
        const label = elemento.querySelector?.('.symbol-label');
        const labelText = label ? label.textContent : '';
        
        if (labelText) {
            const partes = labelText.split('/');
            designacion = partes[0]?.trim() || '';
            dependencia = partes[1]?.trim() || '';
            console.log(`📝 Datos extraídos del label: "${designacion}" / "${dependencia}"`);
        }

        // Fallback a options si no hay label
        if (!designacion) {
            designacion = elemento.options?.designacion || 
                          elemento.options?.nombre || 
                          elemento.options?.uniqueDesignation ||
                          'SIN_DESIG';
        }
        
        if (!dependencia) {
            dependencia = elemento.options?.dependencia || 
                          elemento.options?.higherFormation ||
                          'SIN_DEP';

        // GARANTIZAR que sean strings (FIX CRITICO TypeError)
        designacion = String(designacion || 'SIN_DESIG').trim();
        dependencia = String(dependencia || 'SIN_DEP').trim();
        }


        // 🔍 PASO 3: Extraer propiedades del SIDC
        let afiliacion = 'F';
        let estado = 'P';
        let magnitud = '-';
        
        if (sidc && sidc.length >= 12) {
            afiliacion = sidc.charAt(1) || 'F';
            estado = sidc.charAt(3) || 'P';
            magnitud = sidc.charAt(11) || '-';
        }

        // Fallback a options
        magnitud = elemento.options?.magnitud || magnitud;

        // 🔍 PASO 4: Obtener coordenadas
        // ✅ Obtener coordenadas de Leaflet correctamente (igual que gestionBatalla.js)
        let coordenadas = null;
        let lat = null;
        let lng = null;
        
        if (elemento.getLatLng && typeof elemento.getLatLng === 'function') {
            try {
                const latlng = elemento.getLatLng();
                // ✅ Extraer lat/lng directamente como hace gestionBatalla.js
                lat = latlng.lat;
                lng = latlng.lng;
                coordenadas = { lat, lng }; // Objeto simple con lat/lng
            } catch (e) {
                console.warn('⚠️ Error al llamar getLatLng():', e);
            }
        } else if (elemento.options?.latlng) {
            coordenadas = elemento.options.latlng;
            lat = coordenadas.lat;
            lng = coordenadas.lng;
        } else if (elemento._latlng) {
            // Fallback a propiedad interna de Leaflet
            lat = elemento._latlng.lat;
            lng = elemento._latlng.lng;
            coordenadas = { lat, lng };
        }

        // 🔍 PASO 5: Determinar ID único
        const id = elemento.options?.id || 
                   elemento._leaflet_id || 
                   `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 🔍 PASO 6: Equipo y jugador
        const equipo = elemento.options?.equipo || 
                       elemento.equipo || 
                       'azul';
        
        const jugador = elemento.options?.jugador || 
                        elemento.options?.jugadorId ||
                        window.jugadorActual ||
                        '';

        // 🔍 PASO 7: Tipo de vehículo y otras propiedades
        const tipoVehiculo = elemento.options?.tipoVehiculo || 'sin_vehiculo';

        // 🎯 PASO 8: Obtener datos BV8 (si existen)
        let datosBV8 = null;
        let datosMovilidad = null;

        if (tipoVehiculo !== 'sin_vehiculo') {
            // Usar velocidadUtils para obtener datos BV8 completos
            if (typeof window.obtenerVelocidadElemento === 'function') {
                try {
                    datosMovilidad = window.obtenerVelocidadElemento(elemento);
                    datosBV8 = datosMovilidad?.bv8 || null;
                } catch (e) {
                    console.warn('⚠️ Error obteniendo datos BV8:', e);
                }
            }
        }

        // 🎯 PASO 9: Calcular stats agregados (tripulación + personal embarcado)
        let statsAgregados = null;

        if (datosBV8) {
            statsAgregados = calcularStatsAgregados(elemento, datosBV8);
        }

        // 📦 PASO 10: Construir objeto de datos completo
        const datosCompletos = {
            // Identificación
            id: id,
            sidc: sidc,

            // Designación y organización
            designacion: designacion,
            dependencia: dependencia,
            uniqueDesignation: elemento.options?.uniqueDesignation || designacion,
            higherFormation: elemento.options?.higherFormation || dependencia,

            // Propiedades SIDC
            magnitud: magnitud,
            afiliacion: afiliacion,
            estado: estado,

            // Ubicación
            coordenadas: coordenadas,
            lat: lat,
            lng: lng,

            // Clasificación
            equipo: equipo,
            jugador: jugador,
            tipo: elemento.options?.tipo || 'unidad',
            tipoVehiculo: tipoVehiculo,

            // Nombre completo para UI
            nombre: elemento.options?.nombre || designacion,
            nombreCompleto: `${designacion}${dependencia ? ' / ' + dependencia : ''}`,

            // 📊 DATOS BV8 (NUEVO)
            bv8: datosBV8,
            movilidad: datosMovilidad,
            stats: statsAgregados,

            // 🔄 Personal embarcado (si aplica)
            personalEmbarcado: elemento.options?.personalEmbarcado || null,

            // Referencia original
            _elementoRef: elemento
        };

        console.log('✅ obtenerDatosElemento:', {
            id: datosCompletos.id,
            designacion: datosCompletos.designacion,
            dependencia: datosCompletos.dependencia,
            coordenadas: datosCompletos.coordenadas,
            nombreCompleto: datosCompletos.nombreCompleto,
            equipo: datosCompletos.equipo
        });

        return datosCompletos;

    } catch (error) {
        console.error('❌ Error en obtenerDatosElemento:', error);
        console.error('   Elemento problemático:', elemento);
        return null;
    }
}

/**
 * Busca un marcador en el mapa por unidadId
 * Similar a cómo calcosP.js busca con eachLayer()
 */
function buscarMarcadorPorId(unidadId, calco = window.calcoActivo) {
    if (!unidadId) {
        console.warn('⚠️ buscarMarcadorPorId: unidadId vacío');
        return null;
    }

    if (!calco) {
        console.warn('⚠️ buscarMarcadorPorId: no hay calco activo');
        return null;
    }

    let marcadorEncontrado = null;

    try {
        calco.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                // BUSCAR POR designacion/dependencia (SISTEMA CORRECTO)
                const layerDesignacion = String(layer.options?.designacion || "").trim();
                const layerDependencia = String(layer.options?.dependencia || "").trim();
                const layerId = `${layerDesignacion}/${layerDependencia}`;
                
                if (layerId === unidadId) {
                    marcadorEncontrado = layer;
                    console.log(`✅ Marcador encontrado: ${layerId}`);
                    return;
                }
                
                // Fallback: IDs antiguos (compatibilidad)
                if (layer.options?.id === unidadId || layer._leaflet_id === unidadId) {
                    marcadorEncontrado = layer;
                    console.warn(`⚠️ Marcador encontrado por ID obsoleto`);
                    return;
                }
            }
        });
    } catch (error) {
        console.error('❌ Error buscando marcador:', error);
    }

    if (marcadorEncontrado) {
        console.log(`✅ Marcador encontrado para ID: ${unidadId}`);
    } else {
        console.warn(`⚠️ No se encontró marcador para ID: ${unidadId}`);
    }

    return marcadorEncontrado;
}

/**
 * Valida que un elemento tenga datos mínimos requeridos
 */
function validarDatosElemento(datosElemento) {
    if (!datosElemento) {
        console.warn('⚠️ validarDatosElemento: datosElemento es null/undefined');
        return false;
    }

    // ✅ FIX CRÍTICO: Validar que coordenadas tenga lat/lng válidos
    const tieneId = !!datosElemento.id;
    const tieneDesignacion = !!datosElemento.designacion;
    const tieneCoordenadasObj = !!datosElemento.coordenadas;
    const tieneLatLng = tieneCoordenadasObj &&
                        typeof datosElemento.coordenadas.lat === 'number' &&
                        typeof datosElemento.coordenadas.lng === 'number' &&
                        !isNaN(datosElemento.coordenadas.lat) &&
                        !isNaN(datosElemento.coordenadas.lng);

    const esValido = tieneId && tieneDesignacion && tieneLatLng;

    if (!esValido) {
        console.warn('⚠️ Datos de elemento incompletos:', {
            tieneId: tieneId,
            tieneDesignacion: tieneDesignacion,
            tieneCoordenadasObj: tieneCoordenadasObj,
            tieneLatLng: tieneLatLng,
            coordenadas: datosElemento.coordenadas,
            designacion: datosElemento.designacion,
            id: datosElemento.id
        });
    }

    return esValido;
}

/**
 * 🔄 AGREGACIÓN DE STATS: Suma los stats de subordinados al padre cuando se reagrupan
 *
 * Cuando subordinados se reagrupan con el padre, sus recursos (personal, munición,
 * combustible, etc.) deben sumarse a los del padre.
 *
 * @param {L.Marker} elementoPadre - Marcador de la unidad padre (comandante)
 * @param {Array<L.Marker>} subordinados - Array de marcadores subordinados
 * @returns {Object} Stats totales agregados al padre
 */
function agregarStatsSubordinadosAPadre(elementoPadre, subordinados) {
    if (!elementoPadre || !subordinados || subordinados.length === 0) {
        console.warn('⚠️ agregarStatsSubordinadosAPadre: Parámetros inválidos');
        return null;
    }

    console.log(`🔄 Agregando stats de ${subordinados.length} subordinados al padre...`);

    // Obtener stats actuales del padre
    const datosPadre = obtenerDatosElemento(elementoPadre);
    if (!datosPadre || !datosPadre.stats) {
        console.error('❌ No se pudieron obtener stats del padre');
        return null;
    }

    const statsPadre = datosPadre.stats;
    console.log('📊 Stats iniciales del padre:', statsPadre);

    // Acumuladores para stats de subordinados
    let totalPersonal = 0;
    let totalCombustible = 0;
    let totalMunicion = {}; // { '7.62mm': cantidad, '12.7mm': cantidad, ... }
    let totalRaciones = 0;
    let totalAgua = 0;

    // Sumar stats de cada subordinado
    for (const subordinado of subordinados) {
        const datosSubordinado = obtenerDatosElemento(subordinado);
        if (!datosSubordinado || !datosSubordinado.stats) {
            console.warn('⚠️ Subordinado sin stats, saltando...');
            continue;
        }

        const stats = datosSubordinado.stats;
        console.log(`  📊 Sumando stats de ${datosSubordinado.designacion}:`, stats);

        // Sumar personal
        if (stats.personal?.total) {
            totalPersonal += stats.personal.total;
        }

        // Sumar combustible
        if (stats.combustible?.actual) {
            totalCombustible += stats.combustible.actual;
        }

        // Sumar munición por tipo
        if (stats.municion?.tipos) {
            for (const [tipo, cantidad] of Object.entries(stats.municion.tipos)) {
                totalMunicion[tipo] = (totalMunicion[tipo] || 0) + cantidad;
            }
        }

        // Sumar raciones
        if (stats.raciones?.actual) {
            totalRaciones += stats.raciones.actual;
        }

        // Sumar agua
        if (stats.agua?.actual) {
            totalAgua += stats.agua.actual;
        }
    }

    console.log('📊 Stats agregados de subordinados:', {
        personal: totalPersonal,
        combustible: totalCombustible,
        municion: totalMunicion,
        raciones: totalRaciones,
        agua: totalAgua
    });

    // ✅ APLICAR AGREGACIÓN AL PADRE
    // Sumar al personal total del padre
    if (statsPadre.personal) {
        statsPadre.personal.total += totalPersonal;
        statsPadre.personal.embarcado = (statsPadre.personal.embarcado || 0) + totalPersonal;
    }

    // Sumar al combustible actual del padre
    if (statsPadre.combustible) {
        statsPadre.combustible.actual += totalCombustible;
        // No exceder capacidad máxima
        if (statsPadre.combustible.actual > statsPadre.combustible.capacidad) {
            statsPadre.combustible.actual = statsPadre.combustible.capacidad;
        }
    }

    // Sumar munición por tipo
    if (statsPadre.municion?.tipos) {
        for (const [tipo, cantidad] of Object.entries(totalMunicion)) {
            statsPadre.municion.tipos[tipo] = (statsPadre.municion.tipos[tipo] || 0) + cantidad;
        }
    } else if (Object.keys(totalMunicion).length > 0) {
        // Si el padre no tenía munición, crear estructura
        statsPadre.municion = statsPadre.municion || {};
        statsPadre.municion.tipos = totalMunicion;
    }

    // Sumar raciones
    if (statsPadre.raciones) {
        statsPadre.raciones.actual += totalRaciones;
        // No exceder máximo
        if (statsPadre.raciones.actual > statsPadre.raciones.max) {
            statsPadre.raciones.actual = statsPadre.raciones.max;
        }
    }

    // Sumar agua
    if (statsPadre.agua) {
        statsPadre.agua.actual += totalAgua;
        // No exceder capacidad
        if (statsPadre.agua.actual > statsPadre.agua.capacidad) {
            statsPadre.agua.actual = statsPadre.agua.capacidad;
        }
    }

    // ✅ GUARDAR STATS ACTUALIZADOS en el elemento padre
    if (!elementoPadre.options.statsAgregados) {
        elementoPadre.options.statsAgregados = {};
    }
    elementoPadre.options.statsAgregados = statsPadre;

    console.log('✅ Stats finales del padre después de reagrupar:', statsPadre);

    // Emitir evento de actualización de stats
    if (window.eventBus) {
        window.eventBus.emit('statsActualizados', {
            elemento: elementoPadre,
            stats: statsPadre
        });
    }

    return statsPadre;
}

/**
 * Obtiene datos del elemento desde window.elementoSeleccionado
 */
function obtenerDatosElementoSeleccionado() {
    if (!window.elementoSeleccionado) {
        console.warn('⚠️ No hay elemento seleccionado');
        return null;
    }

    return obtenerDatosElemento(window.elementoSeleccionado);
}

// 🌍 Exportar funciones al scope global
window.obtenerDatosElemento = obtenerDatosElemento;
window.buscarMarcadorPorId = buscarMarcadorPorId;
window.obtenerDatosElementoSeleccionado = obtenerDatosElementoSeleccionado;
window.validarDatosElemento = validarDatosElemento;

// 🌍 Exportar funciones BV8 (nuevas)
window.calcularStatsAgregados = calcularStatsAgregados;
window.calcularStatsTripulacion = calcularStatsTripulacion;
window.calcularStatsPersonalEmbarcado = calcularStatsPersonalEmbarcado;
window.combinarMunicion = combinarMunicion;
window.agregarStatsSubordinadosAPadre = agregarStatsSubordinadosAPadre;

// 📦 Exportar como módulo para namespace MAIRA
window.MAIRA = window.MAIRA || {};
window.MAIRA.ElementoUtils = {
    // Funciones principales
    obtenerDatos: obtenerDatosElemento,
    buscarPorId: buscarMarcadorPorId,
    obtenerSeleccionado: obtenerDatosElementoSeleccionado,
    validar: validarDatosElemento,

    // Funciones BV8 (nuevas)
    calcularStatsAgregados: calcularStatsAgregados,
    calcularStatsTripulacion: calcularStatsTripulacion,
    calcularStatsPersonalEmbarcado: calcularStatsPersonalEmbarcado,
    combinarMunicion: combinarMunicion,
    agregarStatsSubordinadosAPadre: agregarStatsSubordinadosAPadre
};

console.log('✅ elementoUtils.js cargado - Funciones de extracción centralizadas + BV8 stats disponibles');
