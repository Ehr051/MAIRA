/**
 * elementoUtils.js
 * Funciones centralizadas para extraer datos de elementos/marcadores
 * Usa la misma lógica que mostrarPanelEdicionUnidad() y calcosP.js
 */

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
        
        // �� PASO 8: Construir objeto de datos completo
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
    if (!datosElemento) return false;

    const esValido = !!(
        datosElemento.id &&
        datosElemento.designacion &&
        datosElemento.coordenadas
    );

    if (!esValido) {
        console.warn('⚠️ Datos de elemento incompletos:', {
            tieneId: !!datosElemento.id,
            tieneDesignacion: !!datosElemento.designacion,
            tieneCoordenadas: !!datosElemento.coordenadas
        });
    }

    return esValido;
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

// 📦 Exportar como módulo para namespace MAIRA
window.MAIRA = window.MAIRA || {};
window.MAIRA.ElementoUtils = {
    obtenerDatos: obtenerDatosElemento,
    buscarPorId: buscarMarcadorPorId,
    obtenerSeleccionado: obtenerDatosElementoSeleccionado,
    validar: validarDatosElemento
};

console.log('✅ elementoUtils.js cargado - Funciones de extracción centralizadas disponibles');
