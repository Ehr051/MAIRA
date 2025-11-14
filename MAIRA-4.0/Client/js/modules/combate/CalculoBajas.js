/**
 * CalculoBajas.js
 * Módulo frontend para cálculo de bajas en combate
 * Integra con endpoint /api/calcular-bajas del backend
 * Usa datos BV8 de elementos para simulación realista
 */

(function() {
    'use strict';

    const API_ENDPOINT = '/api/calcular-bajas';

    /**
     * Calcula las bajas en un enfrentamiento entre dos elementos
     * @param {L.Marker} elementoAtacante - Marcador del atacante
     * @param {L.Marker} elementoDefensor - Marcador del defensor
     * @param {Object} condiciones - Condiciones del combate
     * @param {Number} condiciones.distancia_m - Distancia en metros
     * @param {String} condiciones.visibilidad - 'buena'|'regular'|'mala'|'nula'
     * @param {String} condiciones.cobertura_defensor - 'ninguna'|'ligera'|'media'|'pesada'|'atrincherado'
     * @param {String} condiciones.terreno - 'abierto'|'bosque'|'urbano'|'montaña'
     * @param {String} condiciones.hora - 'dia'|'noche'|'crepusculo'
     * @param {Number} duracionMinutos - Duración del combate en minutos (default: 30)
     * @returns {Promise<Object>} Resultado del cálculo de bajas
     */
    async function calcularBajas(elementoAtacante, elementoDefensor, condiciones, duracionMinutos = 30) {
        try {
            console.log('🎯 Calculando bajas...');

            // ========== PASO 1: OBTENER DATOS COMPLETOS BV8 ==========

            // Usar elementoUtils para extraer datos completos
            const datosAtacante = window.obtenerDatosElemento(elementoAtacante);
            const datosDefensor = window.obtenerDatosElemento(elementoDefensor);

            if (!datosAtacante || !datosDefensor) {
                throw new Error('No se pudieron obtener los datos de los elementos');
            }

            console.log('📊 Datos atacante:', datosAtacante);
            console.log('📊 Datos defensor:', datosDefensor);

            // ========== PASO 2: PREPARAR DATOS PARA LA API ==========

            const payloadAtacante = prepararDatosElemento(datosAtacante, 'atacante');
            const payloadDefensor = prepararDatosElemento(datosDefensor, 'defensor');

            // ========== PASO 3: LLAMAR AL ENDPOINT ==========

            const requestData = {
                atacante: payloadAtacante,
                defensor: payloadDefensor,
                condiciones: {
                    distancia_m: condiciones.distancia_m || 1000,
                    visibilidad: condiciones.visibilidad || 'buena',
                    cobertura_defensor: condiciones.cobertura_defensor || 'ninguna',
                    terreno: condiciones.terreno || 'abierto',
                    hora: condiciones.hora || 'dia'
                },
                duracion_minutos: duracionMinutos
            };

            console.log('📤 Request a API:', requestData);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error en API: ${errorData.message || response.statusText}`);
            }

            const resultado = await response.json();

            if (!resultado.success) {
                throw new Error(`Cálculo falló: ${resultado.message}`);
            }

            console.log('✅ Resultado de bajas:', resultado.resultado);

            // ========== PASO 4: APLICAR BAJAS A LOS ELEMENTOS ==========

            aplicarBajasAElemento(elementoAtacante, resultado.resultado.bajas_atacante, resultado.resultado.municion_consumida.atacante, resultado.resultado.moral_final.atacante);
            aplicarBajasAElemento(elementoDefensor, resultado.resultado.bajas_defensor, resultado.resultado.municion_consumida.defensor, resultado.resultado.moral_final.defensor);

            // ========== PASO 5: RETORNAR RESULTADO ==========

            return {
                success: true,
                ganador: resultado.resultado.ganador,
                descripcion: resultado.resultado.descripcion,
                bajasAtacante: resultado.resultado.bajas_atacante,
                bajasDefensor: resultado.resultado.bajas_defensor,
                municionConsumida: resultado.resultado.municion_consumida,
                moralFinal: resultado.resultado.moral_final,
                detalles: resultado.resultado.detalles
            };

        } catch (error) {
            console.error('❌ Error calculando bajas:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Prepara los datos de un elemento para enviar a la API
     * Extrae: tipo, magnitud, personal, armamento, munición, blindaje, moral, entrenamiento
     * @param {Object} datosElemento - Datos del elemento desde elementoUtils
     * @param {String} rol - 'atacante' o 'defensor'
     * @returns {Object} Datos formateados para la API
     */
    function prepararDatosElemento(datosElemento, rol) {
        // Tipo de unidad (desde SIDC o tipo)
        let tipo = 'infanteria';
        const tipoOriginal = datosElemento.tipo || '';

        if (tipoOriginal.includes('blindad') || tipoOriginal.includes('tanque')) {
            tipo = 'blindado';
        } else if (tipoOriginal.includes('mecanizad')) {
            tipo = 'mecanizado';
        } else if (tipoOriginal.includes('motorizado')) {
            tipo = 'motorizado';
        }

        // Magnitud (desde SIDC o options)
        const magnitud = datosElemento.magnitud || 'F';

        // Personal (desde stats BV8)
        let personal = 0;
        let vehiculos = 0;

        if (datosElemento.stats && datosElemento.stats.personal) {
            personal = datosElemento.stats.personal.total || 0;
        } else if (datosElemento.personalEmbarcado) {
            // Fallback a personal embarcado
            personal = datosElemento.personalEmbarcado.total_embarcados || 0;
        }

        // Vehículos (simplificado: 1 si tiene vehículo, 0 si no)
        if (datosElemento.tipoVehiculo && datosElemento.tipoVehiculo !== 'sin_vehiculo') {
            vehiculos = 1;
        }

        // Armamento (desde datos BV8)
        let armamento = {
            principal: null,
            secundario: null
        };

        if (datosElemento.bv8 && datosElemento.bv8.armamento) {
            const arma = datosElemento.bv8.armamento;

            // Arma principal
            if (arma.principal) {
                armamento.principal = {
                    tipo: arma.principal.tipo || arma.principal.nombre || 'Cañón',
                    calibre: arma.principal.calibre || 105,
                    cadencia: arma.principal.cadencia_tiro_min || 8,
                    municion_tipo: arma.principal.municion_tipo || 'municion_principal'
                };
            }

            // Arma secundaria
            if (arma.secundario) {
                armamento.secundario = {
                    tipo: arma.secundario.tipo || arma.secundario.nombre || 'Ametralladora',
                    calibre: arma.secundario.calibre || 7.62,
                    cadencia: arma.secundario.cadencia_tiro_min || 600,
                    municion_tipo: arma.secundario.municion_tipo || 'municion_762'
                };
            } else if (arma.coaxial) {
                // Usar coaxial como secundaria
                armamento.secundario = {
                    tipo: arma.coaxial.tipo || 'Ametralladora coaxial',
                    calibre: arma.coaxial.calibre || 7.62,
                    cadencia: arma.coaxial.cadencia_tiro_min || 600,
                    municion_tipo: arma.coaxial.municion_tipo || 'municion_762'
                };
            }
        } else {
            // Fallback: arma de infantería estándar
            armamento.principal = {
                tipo: 'FAL 7.62mm',
                calibre: 7.62,
                cadencia: 40,  // Disparos por minuto por soldado
                municion_tipo: 'municion_762'
            };
        }

        // Munición (desde stats BV8)
        let municion = {};

        if (datosElemento.stats && datosElemento.stats.municion) {
            municion = datosElemento.stats.municion.tipos || {};
        } else if (datosElemento.bv8 && datosElemento.bv8.dotacion_inicial && datosElemento.bv8.dotacion_inicial.municion) {
            municion = datosElemento.bv8.dotacion_inicial.municion;
        } else {
            // Fallback: munición básica
            municion = {
                municion_762: personal * 200  // 200 tiros por soldado
            };
        }

        // Blindaje (desde datos BV8 del vehículo)
        let blindaje = 0;

        if (datosElemento.bv8 && datosElemento.bv8.vehiculo && datosElemento.bv8.vehiculo.caracteristicas) {
            blindaje = datosElemento.bv8.vehiculo.caracteristicas.blindaje_mm || 0;
        }

        // Moral (desde stats BV8 o default 80)
        let moral = 80;

        if (datosElemento.stats && datosElemento.stats.moral) {
            moral = datosElemento.stats.moral.actual || 80;
        }

        // Entrenamiento (simplificado: determinar por magnitud)
        let entrenamiento = 'regular';

        if (magnitud === 'E' || magnitud === 'F') {
            entrenamiento = 'regular';  // Escuadras y secciones
        } else if (magnitud === 'G' || magnitud === 'H') {
            entrenamiento = 'veterano';  // Pelotones y compañías
        } else if (magnitud === 'I' || magnitud === 'J') {
            entrenamiento = 'elite';  // Batallones+
        }

        return {
            tipo: tipo,
            magnitud: magnitud,
            personal: personal,
            vehiculos: vehiculos,
            armamento: armamento,
            municion: municion,
            blindaje: blindaje,
            moral: moral,
            entrenamiento: entrenamiento
        };
    }

    /**
     * Aplica las bajas calculadas a un elemento del mapa
     * Actualiza: personal, vehículos, munición, moral
     * @param {L.Marker} elemento - Marcador del elemento
     * @param {Object} bajas - Bajas calculadas {porcentaje, personal, vehiculos}
     * @param {Object} municionConsumida - Munición gastada {municion_tipo: cantidad}
     * @param {Number} moralFinal - Moral final después del combate
     */
    function aplicarBajasAElemento(elemento, bajas, municionConsumida, moralFinal) {
        if (!elemento || !elemento.options) {
            console.warn('⚠️ Elemento inválido para aplicar bajas');
            return;
        }

        console.log(`📉 Aplicando bajas a ${elemento.options.designacion || 'elemento'}:`, bajas);

        // ========== ACTUALIZAR STATS DEL ELEMENTO ==========

        // Crear estructura de stats si no existe
        if (!elemento.options.stats) {
            elemento.options.stats = window.calcularStatsAgregados(elemento, elemento.options.bv8);
        }

        if (!elemento.options.stats) {
            console.warn('⚠️ No se pudieron calcular stats para aplicar bajas');
            return;
        }

        // Aplicar bajas de personal
        if (elemento.options.stats.personal) {
            const personalAnterior = elemento.options.stats.personal.total;
            const personalNuevo = Math.max(0, personalAnterior - bajas.personal);

            elemento.options.stats.personal.total = personalNuevo;

            // Distribuir bajas entre tripulación y embarcado proporcionalmente
            const proporcionTripulacion = elemento.options.stats.personal.tripulacion / personalAnterior;
            const bajasTripulacion = Math.floor(bajas.personal * proporcionTripulacion);
            const bajasEmbarcado = bajas.personal - bajasTripulacion;

            elemento.options.stats.personal.tripulacion = Math.max(0, elemento.options.stats.personal.tripulacion - bajasTripulacion);
            elemento.options.stats.personal.embarcado = Math.max(0, elemento.options.stats.personal.embarcado - bajasEmbarcado);

            console.log(`   👥 Personal: ${personalAnterior} → ${personalNuevo} (${bajas.personal} bajas)`);
        }

        // Aplicar consumo de munición
        if (elemento.options.stats.municion && municionConsumida) {
            for (const [tipo, cantidad] of Object.entries(municionConsumida)) {
                if (elemento.options.stats.municion.tipos[tipo]) {
                    const cantidadAnterior = elemento.options.stats.municion.tipos[tipo];
                    const cantidadNueva = Math.max(0, cantidadAnterior - cantidad);
                    elemento.options.stats.municion.tipos[tipo] = cantidadNueva;

                    console.log(`   🔫 ${tipo}: ${cantidadAnterior} → ${cantidadNueva} (${cantidad} disparos)`);
                }
            }
        }

        // Actualizar moral
        if (elemento.options.stats.moral) {
            const moralAnterior = elemento.options.stats.moral.actual;
            elemento.options.stats.moral.actual = moralFinal;

            // Actualizar estado de moral
            if (moralFinal >= 80) {
                elemento.options.stats.moral.estado = 'alta';
            } else if (moralFinal >= 50) {
                elemento.options.stats.moral.estado = 'media';
            } else if (moralFinal >= 30) {
                elemento.options.stats.moral.estado = 'baja';
            } else {
                elemento.options.stats.moral.estado = 'rota';
            }

            console.log(`   💪 Moral: ${moralAnterior} → ${moralFinal} (${elemento.options.stats.moral.estado})`);
        }

        // TODO: Bajas de vehículos (si bajas.vehiculos > 0, marcar vehículo como destruido)
        if (bajas.vehiculos > 0) {
            console.log(`   🚗 Vehículos destruidos: ${bajas.vehiculos}`);
            // Implementar lógica para marcar vehículo como destruido
            elemento.options.vehiculoDestruido = true;
        }

        // ========== ACTUALIZAR VISUALIZACIÓN ==========

        // Si hay un sistema de stats bars, actualizarlo
        if (window.actualizarStatsBarras) {
            window.actualizarStatsBarras(elemento);
        }

        // Si hay un sistema de eventos, emitir evento de bajas
        if (window.eventBus) {
            window.eventBus.emit('elemento:bajas', {
                elementoId: elemento.options.id,
                bajas: bajas,
                moralFinal: moralFinal
            });
        }
    }

    /**
     * Calcula la distancia entre dos elementos en metros
     * @param {L.Marker} elemento1 - Primer marcador
     * @param {L.Marker} elemento2 - Segundo marcador
     * @returns {Number} Distancia en metros
     */
    function calcularDistanciaEnMetros(elemento1, elemento2) {
        const latlng1 = elemento1.getLatLng();
        const latlng2 = elemento2.getLatLng();

        // Fórmula de Haversine para distancia entre dos puntos en el globo
        const R = 6371000; // Radio de la Tierra en metros
        const φ1 = latlng1.lat * Math.PI / 180;
        const φ2 = latlng2.lat * Math.PI / 180;
        const Δφ = (latlng2.lat - latlng1.lat) * Math.PI / 180;
        const Δλ = (latlng2.lng - latlng1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    /**
     * Determina condiciones automáticas del combate basadas en el entorno
     * @param {L.Marker} elementoAtacante - Atacante
     * @param {L.Marker} elementoDefensor - Defensor
     * @param {L.Map} mapa - Mapa de Leaflet
     * @returns {Object} Condiciones del combate
     */
    function determinarCondicionesAutomaticas(elementoAtacante, elementoDefensor, mapa) {
        // Calcular distancia
        const distancia_m = Math.round(calcularDistanciaEnMetros(elementoAtacante, elementoDefensor));

        // TODO: Determinar visibilidad desde análisis de terreno (NDVI, niebla, etc)
        const visibilidad = 'buena';

        // TODO: Determinar cobertura desde análisis de terreno
        const cobertura_defensor = 'ninguna';

        // TODO: Determinar terreno desde capas GIS
        const terreno = 'abierto';

        // Determinar hora del día desde TurnosManager o reloj del juego
        let hora = 'dia';
        if (window.TurnosManager && window.TurnosManager.obtenerHoraActual) {
            const horaActual = window.TurnosManager.obtenerHoraActual();
            if (horaActual >= 6 && horaActual < 18) {
                hora = 'dia';
            } else if (horaActual >= 18 && horaActual < 20 || horaActual >= 5 && horaActual < 6) {
                hora = 'crepusculo';
            } else {
                hora = 'noche';
            }
        }

        return {
            distancia_m: distancia_m,
            visibilidad: visibilidad,
            cobertura_defensor: cobertura_defensor,
            terreno: terreno,
            hora: hora
        };
    }

    // ========== EXPORTAR FUNCIONES ==========

    window.calcularBajas = calcularBajas;
    window.calcularDistanciaEnMetros = calcularDistanciaEnMetros;
    window.determinarCondicionesAutomaticas = determinarCondicionesAutomaticas;

    // Exportar en namespace MAIRA
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.CalculoBajas = {
        calcular: calcularBajas,
        calcularDistancia: calcularDistanciaEnMetros,
        determinarCondiciones: determinarCondicionesAutomaticas
    };

    console.log('✅ CalculoBajas.js cargado - Sistema de cálculo de bajas disponible');

})();
