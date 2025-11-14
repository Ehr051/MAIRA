/**
 * velocidadUtils.js
 * Utilidades para obtener velocidades y consumos de elementos según su tipo
 */

(function() {
    'use strict';

    /**
     * Obtiene datos de velocidad, consumo y capacidad de combustible
     * según el tipo de elemento (blindado, mecanizado, motorizado, a pie, etc)
     * @param {Object} elemento - Marcador de Leaflet con datos del elemento
     * @returns {Object} {velocidad, consumo, capacidad, tipoMovimiento}
     */
    function obtenerVelocidadElemento(elemento) {
        // Obtener datos del elemento desde el marcador
        const datosElemento = window.obtenerDatosElemento ? 
            window.obtenerDatosElemento(elemento) : 
            elemento.options || {};
        
        console.log('🔍 Determinando tipo de movimiento para:', datosElemento);
        
        // Determinar tipo base de movimiento
        let tipoMovimiento = 'apie'; // Por defecto: a pie
        
        if (datosElemento.tipo) {
            const tipoLower = datosElemento.tipo.toLowerCase();
            
            // Mapeo de tipos según palabras clave
            if (tipoLower.includes('blindad')) {
                tipoMovimiento = 'blindado';
            } else if (tipoLower.includes('mecanizad')) {
                tipoMovimiento = 'mecanizado';
            } else if (tipoLower.includes('motorizado') || tipoLower.includes('motor')) {
                tipoMovimiento = 'motorizado';
            } else if (tipoLower.includes('remolcad') || tipoLower.includes('artilleria')) {
                tipoMovimiento = 'remolcado';
            } else if (tipoLower.includes('pie') || tipoLower.includes('infanteria')) {
                tipoMovimiento = 'apie';
            }
        }
        
        // Obtener velocidad del JSON cargado
        const velocidadesBase = window.MAIRA?.velocidadesBase || {};
        
        let velocidad = 4; // Fallback: a pie
        let consumo = 0;
        let capacidad = 0;
        let descripcion = 'Desconocido';
        
        // Buscar primero en vehículos
        if (velocidadesBase.vehiculos && velocidadesBase.vehiculos[tipoMovimiento]) {
            const datos = velocidadesBase.vehiculos[tipoMovimiento];
            velocidad = datos.velocidadPromedio;
            consumo = datos.consumoPromedio;
            capacidad = datos.capacidadCombustible;
            descripcion = datos.descripcion || tipoMovimiento;
        } 
        // Luego en personal
        else if (velocidadesBase.personal && velocidadesBase.personal[tipoMovimiento]) {
            const datos = velocidadesBase.personal[tipoMovimiento];
            velocidad = datos.velocidadPromedio;
            consumo = datos.consumoPromedio;
            capacidad = datos.capacidadCombustible;
            descripcion = datos.descripcion || tipoMovimiento;
        }
        
        console.log(`📊 Tipo: ${tipoMovimiento} → Vel: ${velocidad} km/h, Consumo: ${consumo} L/km`);
        
        return {
            velocidad,
            consumo,
            capacidad,
            tipoMovimiento,
            descripcion
        };
    }

    /**
     * Carga el archivo velocidadesBase.json
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
            
            console.log('✅ Velocidades base cargadas:', data);
            return data;
        } catch (error) {
            console.error('❌ Error cargando velocidadesBase.json:', error);
            // Valores fallback
            return {
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
        }
    }

    // Exportar funciones al objeto window
    window.obtenerVelocidadElemento = obtenerVelocidadElemento;
    window.cargarVelocidadesBase = cargarVelocidadesBase;

    console.log('✅ velocidadUtils.js cargado');
})();
