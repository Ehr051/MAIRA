/**
 * Logistica.js
 * Módulo frontend para operaciones logísticas
 * Integra con endpoints /api/reabastecer y /api/calcular-consumo del backend
 * Maneja reabastecimientos y cálculos de consumo de recursos
 */

(function() {
    'use strict';

    const API_REABASTECER = '/api/reabastecer';
    const API_CALCULAR_CONSUMO = '/api/calcular-consumo';

    /**
     * Reabastecer un elemento militar
     * @param {L.Marker} elemento - Marcador del elemento
     * @param {Object} recursosDisponibles - Recursos del punto logístico
     * @param {String} tipoReabastecimiento - 'completo'|'combustible'|'municion'|'raciones'
     * @param {Number} tiempoDisponible - Tiempo disponible en minutos
     * @returns {Promise<Object>} Resultado del reabastecimiento
     */
    async function reabastecer(elemento, recursosDisponibles, tipoReabastecimiento = 'completo', tiempoDisponible = 60) {
        try {
            console.log('📦 Reabasteciendo elemento...');

            // ========== PASO 1: OBTENER DATOS DEL ELEMENTO ==========

            const datosElemento = window.obtenerDatosElemento(elemento);

            if (!datosElemento) {
                throw new Error('No se pudieron obtener los datos del elemento');
            }

            console.log('📊 Datos elemento:', datosElemento);

            // ========== PASO 2: PREPARAR REQUEST ==========

            const requestData = {
                elemento: {
                    id: datosElemento.id,
                    tipo: datosElemento.tipoVehiculo || datosElemento.tipo,
                    stats: datosElemento.stats || {}
                },
                recursos_disponibles: recursosDisponibles,
                tipo_reabastecimiento: tipoReabastecimiento,
                tiempo_disponible_minutos: tiempoDisponible
            };

            console.log('📤 Request a API:', requestData);

            // ========== PASO 3: LLAMAR AL ENDPOINT ==========

            const response = await fetch(API_REABASTECER, {
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
                throw new Error(`Reabastecimiento falló: ${resultado.message}`);
            }

            console.log('✅ Resultado reabastecimiento:', resultado.resultado);

            // ========== PASO 4: APLICAR STATS FINALES AL ELEMENTO ==========

            aplicarStatsFinales(elemento, resultado.resultado.stats_finales);

            // ========== PASO 5: RETORNAR RESULTADO ==========

            return {
                success: true,
                tiempoRequerido: resultado.resultado.tiempo_requerido_minutos,
                combustibleSuministrado: resultado.resultado.combustible_suministrado,
                municionSuministrada: resultado.resultado.municion_suministrada,
                racionesSuministradas: resultado.resultado.raciones_suministradas,
                aguaSuministrada: resultado.resultado.agua_suministrada,
                statsFinales: resultado.resultado.stats_finales,
                recursosRestantes: resultado.resultado.recursos_restantes,
                completado: resultado.resultado.completado,
                mensaje: resultado.resultado.mensaje
            };

        } catch (error) {
            console.error('❌ Error en reabastecimiento:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calcular consumo de un elemento durante una operación
     * @param {L.Marker} elemento - Marcador del elemento
     * @param {Object} operacion - Datos de la operación
     * @param {String} operacion.tipo - 'movimiento'|'combate'|'estacionario'
     * @param {Number} operacion.distancia_km - Distancia en km (para movimiento)
     * @param {Number} operacion.duracion_horas - Duración en horas
     * @param {Object} operacion.disparos_efectuados - Disparos por tipo (para combate)
     * @returns {Promise<Object>} Consumo calculado
     */
    async function calcularConsumo(elemento, operacion) {
        try {
            console.log('📊 Calculando consumo...');

            // ========== PASO 1: OBTENER DATOS DEL ELEMENTO ==========

            const datosElemento = window.obtenerDatosElemento(elemento);

            if (!datosElemento) {
                throw new Error('No se pudieron obtener los datos del elemento');
            }

            // ========== PASO 2: PREPARAR REQUEST ==========

            const requestData = {
                elemento: {
                    tipo_vehiculo: datosElemento.tipoVehiculo || datosElemento.tipo,
                    stats: datosElemento.stats || {}
                },
                operacion: operacion
            };

            console.log('📤 Request a API:', requestData);

            // ========== PASO 3: LLAMAR AL ENDPOINT ==========

            const response = await fetch(API_CALCULAR_CONSUMO, {
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
                throw new Error(`Cálculo de consumo falló: ${resultado.message}`);
            }

            console.log('✅ Consumo calculado:', resultado.consumo);

            return {
                success: true,
                combustibleLitros: resultado.consumo.combustible_litros,
                municion: resultado.consumo.municion,
                racionesUnidades: resultado.consumo.raciones_unidades,
                aguaLitros: resultado.consumo.agua_litros,
                tiempoAutonomiaRestante: resultado.consumo.tiempo_autonomia_restante_horas
            };

        } catch (error) {
            console.error('❌ Error calculando consumo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Aplicar consumo de recursos a un elemento
     * @param {L.Marker} elemento - Marcador del elemento
     * @param {Object} consumo - Consumo calculado
     */
    function aplicarConsumo(elemento, consumo) {
        if (!elemento || !elemento.options || !elemento.options.stats) {
            console.warn('⚠️ Elemento inválido para aplicar consumo');
            return;
        }

        const stats = elemento.options.stats;

        console.log(`📉 Aplicando consumo a ${elemento.options.designacion || 'elemento'}:`);

        // Aplicar combustible
        if (stats.combustible && consumo.combustibleLitros) {
            const combustibleAnterior = stats.combustible.actual;
            stats.combustible.actual = Math.max(0, combustibleAnterior - consumo.combustibleLitros);
            console.log(`   ⛽ Combustible: ${combustibleAnterior}L → ${stats.combustible.actual}L (${consumo.combustibleLitros}L consumidos)`);
        }

        // Aplicar munición
        if (stats.municion && stats.municion.tipos && consumo.municion) {
            for (const [tipo, cantidad] of Object.entries(consumo.municion)) {
                if (stats.municion.tipos[tipo]) {
                    const cantidadAnterior = stats.municion.tipos[tipo];
                    stats.municion.tipos[tipo] = Math.max(0, cantidadAnterior - cantidad);
                    console.log(`   🔫 ${tipo}: ${cantidadAnterior} → ${stats.municion.tipos[tipo]} (${cantidad} disparados)`);
                }
            }
        }

        // Aplicar raciones
        if (stats.raciones && consumo.racionesUnidades) {
            const racionesAnterior = stats.raciones.total;
            stats.raciones.total = Math.max(0, racionesAnterior - consumo.racionesUnidades);

            // Actualizar días disponibles
            const personalTotal = stats.personal?.total || 10;
            stats.raciones.dias_disponibles = personalTotal > 0 ? Math.floor(stats.raciones.total / personalTotal) : 0;

            console.log(`   🍽️ Raciones: ${racionesAnterior} → ${stats.raciones.total} (${consumo.racionesUnidades} consumidas)`);
        }

        // Aplicar agua
        if (stats.agua && consumo.aguaLitros) {
            const aguaAnterior = stats.agua.actual;
            stats.agua.actual = Math.max(0, aguaAnterior - consumo.aguaLitros);
            console.log(`   💧 Agua: ${aguaAnterior}L → ${stats.agua.actual}L (${consumo.aguaLitros}L consumidos)`);
        }

        // Actualizar visualización si existe el sistema de stats bars
        if (window.actualizarStatsBarras) {
            window.actualizarStatsBarras(elemento);
        }

        // Emitir evento de consumo
        if (window.eventBus) {
            window.eventBus.emit('elemento:consumo', {
                elementoId: elemento.options.id,
                consumo: consumo
            });
        }
    }

    /**
     * Aplicar stats finales después de reabastecimiento
     * @param {L.Marker} elemento - Marcador del elemento
     * @param {Object} statsFinales - Stats después del reabastecimiento
     */
    function aplicarStatsFinales(elemento, statsFinales) {
        if (!elemento || !elemento.options) {
            console.warn('⚠️ Elemento inválido para aplicar stats finales');
            return;
        }

        // Crear estructura de stats si no existe
        if (!elemento.options.stats) {
            elemento.options.stats = {};
        }

        // Aplicar stats finales
        if (statsFinales.combustible) {
            elemento.options.stats.combustible = statsFinales.combustible;
            console.log(`   ⛽ Combustible actualizado: ${statsFinales.combustible.actual}L/${statsFinales.combustible.capacidad}L (${statsFinales.combustible.porcentaje}%)`);
        }

        if (statsFinales.municion) {
            elemento.options.stats.municion = statsFinales.municion;
            console.log(`   🔫 Munición actualizada:`, statsFinales.municion.tipos);
        }

        if (statsFinales.raciones) {
            elemento.options.stats.raciones = statsFinales.raciones;
            console.log(`   🍽️ Raciones actualizadas: ${statsFinales.raciones.total} (${statsFinales.raciones.dias_disponibles} días)`);
        }

        if (statsFinales.agua) {
            elemento.options.stats.agua = statsFinales.agua;
            console.log(`   💧 Agua actualizada: ${statsFinales.agua.actual}L/${statsFinales.agua.capacidad}L (${statsFinales.agua.porcentaje}%)`);
        }

        // Actualizar visualización
        if (window.actualizarStatsBarras) {
            window.actualizarStatsBarras(elemento);
        }

        // Emitir evento de reabastecimiento
        if (window.eventBus) {
            window.eventBus.emit('elemento:reabastecido', {
                elementoId: elemento.options.id,
                statsFinales: statsFinales
            });
        }
    }

    /**
     * Verificar si un elemento necesita reabastecimiento
     * @param {L.Marker} elemento - Marcador del elemento
     * @param {Object} umbrales - Umbrales de alerta (opcional)
     * @returns {Object} Estado de necesidad de reabastecimiento
     */
    function verificarNecesidadReabastecimiento(elemento, umbrales = {}) {
        const umbralCombustible = umbrales.combustible || 30; // 30%
        const umbralMunicion = umbrales.municion || 50; // 50%
        const umbralRaciones = umbrales.raciones || 1; // 1 día
        const umbralAgua = umbrales.agua || 30; // 30%

        const datos = window.obtenerDatosElemento(elemento);

        if (!datos || !datos.stats) {
            return {
                necesita: false,
                urgente: false,
                detalles: {}
            };
        }

        const stats = datos.stats;
        const necesidades = {
            combustible: false,
            municion: false,
            raciones: false,
            agua: false
        };

        let necesita = false;
        let urgente = false;

        // Verificar combustible
        if (stats.combustible) {
            const porcentaje = (stats.combustible.actual / stats.combustible.capacidad) * 100;
            if (porcentaje < umbralCombustible) {
                necesidades.combustible = true;
                necesita = true;
                if (porcentaje < 10) urgente = true;
            }
        }

        // Verificar munición (promedio de todos los tipos)
        if (stats.municion && stats.municion.tipos) {
            // Comparar con dotación inicial (simplificado: asumimos que tenía el doble)
            let porcentajePromedio = 0;
            let tiposMunicion = Object.keys(stats.municion.tipos).length;

            for (const [tipo, cantidad] of Object.entries(stats.municion.tipos)) {
                const capacidadAsumida = cantidad * 2; // Asumimos que originalmente tenía el doble
                porcentajePromedio += (cantidad / capacidadAsumida) * 100;
            }

            porcentajePromedio = tiposMunicion > 0 ? porcentajePromedio / tiposMunicion : 100;

            if (porcentajePromedio < umbralMunicion) {
                necesidades.municion = true;
                necesita = true;
                if (porcentajePromedio < 20) urgente = true;
            }
        }

        // Verificar raciones
        if (stats.raciones) {
            if (stats.raciones.dias_disponibles < umbralRaciones) {
                necesidades.raciones = true;
                necesita = true;
                if (stats.raciones.dias_disponibles < 0.5) urgente = true;
            }
        }

        // Verificar agua
        if (stats.agua) {
            const porcentaje = (stats.agua.actual / stats.agua.capacidad) * 100;
            if (porcentaje < umbralAgua) {
                necesidades.agua = true;
                necesita = true;
                if (porcentaje < 10) urgente = true;
            }
        }

        return {
            necesita: necesita,
            urgente: urgente,
            detalles: necesidades
        };
    }

    /**
     * Obtener punto logístico más cercano
     * @param {L.Marker} elemento - Marcador del elemento
     * @param {L.Map} mapa - Mapa de Leaflet
     * @param {L.LayerGroup} calco - Calco con elementos
     * @returns {Object|null} Punto logístico más cercano
     */
    function obtenerPuntoLogisticoMasCercano(elemento, mapa, calco) {
        if (!calco) {
            console.warn('⚠️ No se proporcionó calco para buscar puntos logísticos');
            return null;
        }

        let puntoCercano = null;
        let distanciaMinima = Infinity;

        const posicionElemento = elemento.getLatLng();

        calco.eachLayer((layer) => {
            // Buscar elementos con tipo "logística" o "pc_logistica"
            if (layer.options && (layer.options.tipo === 'logistica' || layer.options.tipo === 'pc_logistica')) {
                const posicionPunto = layer.getLatLng();
                const distancia = posicionElemento.distanceTo(posicionPunto);

                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    puntoCercano = layer;
                }
            }
        });

        if (puntoCercano) {
            console.log(`📍 Punto logístico más cercano encontrado a ${Math.round(distanciaMinima)}m`);
            return {
                elemento: puntoCercano,
                distancia: distanciaMinima
            };
        }

        console.warn('⚠️ No se encontró ningún punto logístico en el mapa');
        return null;
    }

    // ========== EXPORTAR FUNCIONES ==========

    window.reabastecer = reabastecer;
    window.calcularConsumo = calcularConsumo;
    window.aplicarConsumo = aplicarConsumo;
    window.verificarNecesidadReabastecimiento = verificarNecesidadReabastecimiento;
    window.obtenerPuntoLogisticoMasCercano = obtenerPuntoLogisticoMasCercano;

    // Exportar en namespace MAIRA
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.Logistica = {
        reabastecer: reabastecer,
        calcularConsumo: calcularConsumo,
        aplicarConsumo: aplicarConsumo,
        verificarNecesidad: verificarNecesidadReabastecimiento,
        obtenerPuntoMasCercano: obtenerPuntoLogisticoMasCercano
    };

    console.log('✅ Logistica.js cargado - Sistema de logística disponible');

})();
