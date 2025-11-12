/**
 * BV8API - Cliente para consumir servicios basados en Batalla Virtual 8
 * 
 * Esta clase centraliza todas las llamadas a los endpoints del backend
 * que implementan funcionalidades extraídas de BV8.
 * 
 * @class BV8API
 * @author MAIRA Team
 * @date 2025-11-12
 * @version 1.0.0
 */

class BV8API {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.endpoints = {
            estimarBajas: '/api/bv8/estimar-bajas',
            calcularLogistica: '/api/bv8/calcular-logistica',
            calcularObraIngenieros: '/api/bv8/calcular-obra-ingenieros',
            climaActual: '/api/bv8/clima/actual',
            climaAvanzar: '/api/bv8/clima/avanzar-turno',
            analisisTerreno: '/api/bv8/analisis-terreno',
            estimarFallas: '/api/bv8/estimar-fallas'
        };
    }

    /**
     * Método genérico para hacer peticiones HTTP
     * @private
     */
    async _request(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error en petición a ${endpoint}:`, error);
            throw error;
        }
    }

    // ==========================================
    // ESTIMADOR DE BAJAS
    // ==========================================

    /**
     * Estima bajas en combate usando algoritmos de BV8
     * 
     * @param {Object} data - Datos del combate
     * @param {Object} data.atacante - Unidad atacante con PCR
     * @param {Object} data.defensor - Unidad defensora con PCR
     * @param {String} data.terreno - Tipo de terreno (BOSQUE_DENSO, ABIERTO, URBANO, etc.)
     * @param {String} data.clima - Condiciones climáticas (DESPEJADO, LLUVIA, NIEBLA, etc.)
     * @param {Number} data.duracion - Duración del combate en segundos
     * @returns {Promise<Object>} Bajas estimadas por bando
     * 
     * @example
     * const resultado = await bv8API.estimarBajas({
     *   atacante: { pcr: 1500, tipo: 'INFANTERIA' },
     *   defensor: { pcr: 1200, tipo: 'INFANTERIA' },
     *   terreno: 'BOSQUE_DENSO',
     *   clima: 'DESPEJADO',
     *   duracion: 3600
     * });
     */
    async estimarBajas(data) {
        return await this._request(this.endpoints.estimarBajas, 'POST', data);
    }

    // ==========================================
    // PLANEAMIENTO LOGÍSTICO
    // ==========================================

    /**
     * Calcula necesidades logísticas para operaciones
     * 
     * @param {Object} data - Datos de planeamiento
     * @param {Array} data.unidades - Array de unidades con tipo y cantidad
     * @param {Number} data.dias - Días de operación
     * @param {String} data.intensidad - Intensidad de operaciones (BAJA, NORMAL, ALTA, MUY_ALTA)
     * @returns {Promise<Object>} Necesidades logísticas calculadas
     * 
     * @example
     * const logistica = await bv8API.calcularLogistica({
     *   unidades: [
     *     { tipo: 'INFANTERIA', cantidad: 300 },
     *     { tipo: 'BLINDADO', cantidad: 20 }
     *   ],
     *   dias: 3,
     *   intensidad: 'ALTA'
     * });
     */
    async calcularLogistica(data) {
        return await this._request(this.endpoints.calcularLogistica, 'POST', data);
    }

    // ==========================================
    // PLANEAMIENTO DE INGENIEROS
    // ==========================================

    /**
     * Calcula tiempo y recursos para obra de ingenieros
     * 
     * @param {Object} data - Datos de la obra
     * @param {String} data.tipo - Tipo de obra (OBSTACULO, PUENTE, FORTIFICACION)
     * @param {String} data.subtipo - Subtipo específico (MGB_40M, TRINCHERA_IND, etc.)
     * @param {Object} data.unidad - Unidad de ingenieros disponible
     * @returns {Promise<Object>} Tiempo y recursos necesarios
     * 
     * @example
     * const obra = await bv8API.calcularObraIngenieros({
     *   tipo: 'PUENTE',
     *   subtipo: 'MGB_40M',
     *   unidad: { tipo: 'CIA_INGENIEROS', personal: 120 }
     * });
     */
    async calcularObraIngenieros(data) {
        return await this._request(this.endpoints.calcularObraIngenieros, 'POST', data);
    }

    // ==========================================
    // SISTEMA DE CLIMA
    // ==========================================

    /**
     * Obtiene el clima actual y forecast de 5 días
     * 
     * @returns {Promise<Object>} Clima actual y pronóstico
     * 
     * @example
     * const clima = await bv8API.getClimaActual();
     * // { climaActual: 'DESPEJADO', temperatura: 15, forecast: [...] }
     */
    async getClimaActual() {
        return await this._request(this.endpoints.climaActual, 'GET');
    }

    /**
     * Avanza el turno y actualiza el clima
     * 
     * @returns {Promise<Object>} Nuevo estado del clima
     * 
     * @example
     * const nuevoClima = await bv8API.avanzarTurnoClima();
     */
    async avanzarTurnoClima() {
        return await this._request(this.endpoints.climaAvanzar, 'POST');
    }

    // ==========================================
    // ANÁLISIS DE TERRENO (OCOKA)
    // ==========================================

    /**
     * Realiza análisis OCOKA de un sector
     * 
     * @param {Object} data - Sector a analizar
     * @param {Object} data.sector - Límites del sector (norte, sur, este, oeste)
     * @returns {Promise<Object>} Análisis OCOKA completo
     * 
     * @example
     * const analisis = await bv8API.analizarTerreno({
     *   sector: {
     *     norte: -34.5,
     *     sur: -34.6,
     *     este: -58.3,
     *     oeste: -58.5
     *   }
     * });
     */
    async analizarTerreno(data) {
        return await this._request(this.endpoints.analisisTerreno, 'POST', data);
    }

    // ==========================================
    // ESTIMADOR DE FALLAS (MTBF)
    // ==========================================

    /**
     * Estima fallas de equipamiento durante operaciones
     * 
     * @param {Object} data - Flota y horas de operación
     * @param {Array} data.vehiculos - Array de vehículos con tipo
     * @param {Number} data.horasOperacion - Horas totales de operación
     * @returns {Promise<Object>} Fallas estimadas
     * 
     * @example
     * const fallas = await bv8API.estimarFallas({
     *   vehiculos: [
     *     { id: 'TAM-001', tipo: 'TAM' },
     *     { id: 'VCTP-002', tipo: 'VCTP' }
     *   ],
     *   horasOperacion: 72
     * });
     */
    async estimarFallas(data) {
        return await this._request(this.endpoints.estimarFallas, 'POST', data);
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    /**
     * Verifica la disponibilidad del servidor BV8
     * 
     * @returns {Promise<Boolean>} True si el servidor responde
     */
    async healthCheck() {
        try {
            await this._request('/api/bv8/health', 'GET');
            return true;
        } catch (error) {
            console.error('Servidor BV8 no disponible:', error);
            return false;
        }
    }

    /**
     * Obtiene versión de los servicios BV8
     * 
     * @returns {Promise<Object>} Información de versión
     */
    async getVersion() {
        return await this._request('/api/bv8/version', 'GET');
    }
}

// Exportar como módulo ES6
export { BV8API };

// También crear instancia global para uso en scripts legacy
if (typeof window !== 'undefined') {
    window.BV8API = new BV8API();
}
