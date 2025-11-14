/**
 * velocidadUtils.js
 * Utilidades para obtener velocidades y consumos de elementos según su tipo
 */

(function() {
    'use strict';

    /**
     * Obtiene datos COMPLETOS de velocidad, consumo, dotaciones y armamento
     * según el tipo de vehículo específico o categoría
     * @param {Object} elemento - Marcador de Leaflet con datos del elemento
     * @returns {Object} Datos completos BV8 + movilidad
     */
    function obtenerVelocidadElemento(elemento) {
        // Obtener datos del elemento desde el marcador
        const datosElemento = window.obtenerDatosElemento ?
            window.obtenerDatosElemento(elemento) :
            elemento.options || {};

        console.log('🔍 Determinando tipo de movimiento para:', datosElemento);

        // 🎯 PASO 1: Buscar primero en velocidadesReales (datos BV8 específicos)
        const velocidadesReales = window.MAIRA?.velocidadesReales || {};
        const tipoVehiculo = datosElemento.tipoVehiculo || elemento.options?.tipoVehiculo;

        if (tipoVehiculo && velocidadesReales.vehiculos && velocidadesReales.vehiculos[tipoVehiculo]) {
            const datosVehiculo = velocidadesReales.vehiculos[tipoVehiculo];
            const movilidad = datosVehiculo.movilidad;

            console.log(`✅ Datos BV8 específicos encontrados para: ${tipoVehiculo}`);
            console.log(`   Velocidad: ${movilidad.velocidad_promedio_kmh} km/h`);
            console.log(`   Consumo: ${movilidad.consumo_km_litros} L/km`);
            console.log(`   Capacidad: ${movilidad.capacidad_combustible_litros} L`);

            return {
                // Movilidad
                velocidad: movilidad.velocidad_promedio_kmh,
                velocidadMax: movilidad.velocidad_max_kmh,
                velocidadTerreno: movilidad.velocidad_terreno_dificil_kmh,
                autonomia: movilidad.autonomia_km,
                consumo: movilidad.consumo_km_litros,
                capacidad: movilidad.capacidad_combustible_litros,
                combustibleTipo: movilidad.combustible_tipo,

                // Clasificación
                tipoMovimiento: datosVehiculo.categoria,
                descripcion: datosVehiculo.nombre,

                // 📦 DATOS BV8 COMPLETOS (NUEVO)
                bv8: {
                    vehiculo: datosVehiculo,
                    tripulacion: datosVehiculo.tripulacion,
                    armamento: datosVehiculo.armamento,
                    dotacion_inicial: datosVehiculo.dotacion_inicial,
                    caracteristicas: datosVehiculo.caracteristicas
                }
            };
        }

        // 🎯 PASO 2: Si no hay vehículo específico, buscar por categoría (velocidadesBase)
        let tipoMovimiento = determinarTipoMovimiento(datosElemento);

        const velocidadesBase = window.MAIRA?.velocidadesBase || {};

        // Buscar primero en vehículos
        if (velocidadesBase.vehiculos && velocidadesBase.vehiculos[tipoMovimiento]) {
            const datos = velocidadesBase.vehiculos[tipoMovimiento];
            console.log(`📊 Datos genéricos encontrados: ${tipoMovimiento}`);

            return {
                velocidad: datos.velocidadPromedio,
                consumo: datos.consumoPromedio,
                capacidad: datos.capacidadCombustible,
                tipoMovimiento: tipoMovimiento,
                descripcion: datos.descripcion || tipoMovimiento,
                bv8: null // Sin datos BV8 específicos
            };
        }

        // Luego en personal
        if (velocidadesBase.personal && velocidadesBase.personal[tipoMovimiento]) {
            const datos = velocidadesBase.personal[tipoMovimiento];
            console.log(`📊 Datos personal encontrados: ${tipoMovimiento}`);

            return {
                velocidad: datos.velocidadPromedio,
                consumo: datos.consumoPromedio,
                capacidad: datos.capacidadCombustible,
                tipoMovimiento: tipoMovimiento,
                descripcion: datos.descripcion || tipoMovimiento,
                bv8: null
            };
        }

        // 🎯 PASO 3: Fallback a valores por defecto
        console.warn(`⚠️ No se encontraron datos para: ${tipoVehiculo || tipoMovimiento}`);

        return {
            velocidad: 4,
            consumo: 0,
            capacidad: 0,
            tipoMovimiento: 'apie',
            descripcion: 'Desconocido (a pie)',
            bv8: null
        };
    }

    /**
     * Determina el tipo de movimiento según las características del elemento
     * @param {Object} datosElemento - Datos del elemento
     * @returns {String} Tipo de movimiento
     */
    function determinarTipoMovimiento(datosElemento) {
        if (!datosElemento.tipo) return 'apie';

        const tipoLower = datosElemento.tipo.toLowerCase();

        if (tipoLower.includes('blindad')) return 'blindado';
        if (tipoLower.includes('mecanizad')) return 'mecanizado';
        if (tipoLower.includes('motorizado') || tipoLower.includes('motor')) return 'motorizado';
        if (tipoLower.includes('remolcad') || tipoLower.includes('artilleria')) return 'remolcado';
        if (tipoLower.includes('pie') || tipoLower.includes('infanteria')) return 'apie';

        return 'apie';
    }

    /**
     * Carga el archivo velocidadesReales.json (datos BV8 específicos)
     * @returns {Promise} Promesa que se resuelve cuando el JSON está cargado
     */
    async function cargarVelocidadesReales() {
        try {
            const response = await fetch('js/data/velocidadesReales.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Guardar en objeto global MAIRA
            if (!window.MAIRA) {
                window.MAIRA = {};
            }
            window.MAIRA.velocidadesReales = data;

            console.log('✅ Velocidades reales BV8 cargadas');
            console.log(`   ${Object.keys(data.vehiculos || {}).length} vehículos específicos`);
            console.log(`   ${Object.keys(data.personal || {}).length} categorías personal`);

            return data;
        } catch (error) {
            console.warn('⚠️ Error cargando velocidadesReales.json:', error);
            console.warn('   Fallback a velocidadesBase');
            // Intentar cargar velocidadesBase como fallback
            return await cargarVelocidadesBase();
        }
    }

    /**
     * Carga el archivo velocidadesBase.json (datos genéricos por categoría)
     * @returns {Promise} Promesa que se resuelve cuando el JSON está cargado
     */
    async function cargarVelocidadesBase() {
        try {
            const response = await fetch('js/data/velocidadesBase.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Guardar en objeto global MAIRA
            if (!window.MAIRA) {
                window.MAIRA = {};
            }
            window.MAIRA.velocidadesBase = data;

            console.log('✅ Velocidades base (genéricas) cargadas');
            return data;
        } catch (error) {
            console.error('❌ Error cargando velocidadesBase.json:', error);
            // Valores fallback hardcoded
            const fallback = {
                vehiculos: {
                    blindado: { velocidadPromedio: 40, consumoPromedio: 3.0, capacidadCombustible: 500 },
                    mecanizado: { velocidadPromedio: 35, consumoPromedio: 2.5, capacidadCombustible: 400 },
                    motorizado: { velocidadPromedio: 60, consumoPromedio: 0.15, capacidadCombustible: 80 },
                    remolcado: { velocidadPromedio: 40, consumoPromedio: 0.2, capacidadCombustible: 80 }
                },
                personal: {
                    apie: { velocidadPromedio: 4, consumoPromedio: 0, capacidadCombustible: 0 },
                    trote: { velocidadPromedio: 8, consumoPromedio: 0, capacidadCombustible: 0 }
                }
            };

            if (!window.MAIRA) {
                window.MAIRA = {};
            }
            window.MAIRA.velocidadesBase = fallback;

            return fallback;
        }
    }

    /**
     * Carga TODOS los datos de velocidades (reales + base)
     * @returns {Promise} Promesa que se resuelve cuando ambos JSONs están cargados
     */
    async function cargarVelocidades() {
        console.log('📦 Cargando datos de velocidades...');

        try {
            // Cargar en paralelo
            const [datosReales, datosBase] = await Promise.all([
                cargarVelocidadesReales().catch(e => {
                    console.warn('⚠️ velocidadesReales falló, continuando solo con base');
                    return null;
                }),
                cargarVelocidadesBase()
            ]);

            console.log('✅ Todos los datos de velocidades cargados');
            return {
                reales: datosReales,
                base: datosBase
            };
        } catch (error) {
            console.error('❌ Error crítico cargando velocidades:', error);
            return {
                reales: null,
                base: window.MAIRA?.velocidadesBase || {}
            };
        }
    }

    // Exportar funciones al objeto window
    window.obtenerVelocidadElemento = obtenerVelocidadElemento;
    window.cargarVelocidadesBase = cargarVelocidadesBase;
    window.cargarVelocidadesReales = cargarVelocidadesReales;
    window.cargarVelocidades = cargarVelocidades; // ← Función principal

    console.log('✅ velocidadUtils.js cargado');
})();
