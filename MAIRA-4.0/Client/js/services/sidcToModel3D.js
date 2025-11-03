/**
 * Sistema de Mapeo SIDC → 3D para MAIRA 4.0
 * Convierte códigos SIDC (Symbol Identification Code) en modelos 3D GLB
 *
 * Estructura SIDC (15 caracteres):
 * Posición 0-1: Coding scheme (S = Warfighting, I = Intelligence, etc.)
 * Posición 2: Standard identity (F = Friend, H = Hostile, etc.)
 * Posición 3: Battle dimension (P = Space, A = Air, G = Ground, etc.)
 * Posición 4-5: Status (P = Present, A = Anticipated, etc.)
 * Posición 6-7: Function ID (tipo de unidad)
 * Posición 8-9: Modifier (subtipo)
 * Posición 10-11: Additional info
 * Posición 12-13: Country code
 * Posición 14: Order of battle
 */

class SIDCToModel3D {
    constructor() {
        this.sidcMappings = this.initializeMappings();
        this.modelCache = new Map();
    }

    /**
     * Inicializar mapeos SIDC → modelos 3D
     */
    initializeMappings() {
        return {
            // INFANTERÍA (Ground Infantry)
            'SHGPUCII------': { // Infantry Squad
                model: 'fsb_operator.glb',
                scale: 0.02,
                type: 'infantry',
                category: 'unit'
            },
            'SHGPUCIG------': { // Infantry Platoon
                model: 'russian_soldier.glb',
                scale: 0.02,
                type: 'infantry',
                category: 'unit'
            },
            'SHGPUCIC------': { // Infantry Company
                model: 'fsb_operator.glb',
                scale: 0.02,
                type: 'infantry',
                category: 'unit'
            },

            // VEHÍCULOS BLINDADOS (Armored Vehicles)
            'SHGPUCAV------': { // Armored Vehicle
                model: 'm113.glb',
                scale: 0.05,
                type: 'vehicle',
                category: 'armored'
            },
            'SHGPUCAT------': { // Tank
                model: 'tam_tank.glb',
                scale: 0.08,
                type: 'vehicle',
                category: 'tank'
            },
            'SHGPUCAF------': { // Armored Fighting Vehicle
                model: 'tam_2ip_war_thunder.glb',
                scale: 0.06,
                type: 'vehicle',
                category: 'armored'
            },

            // VEHÍCULOS DE TRANSPORTE (Transport Vehicles)
            'SHGPUCV-------': { // Wheeled Vehicle
                model: 'ural_4320.glb',
                scale: 0.04,
                type: 'vehicle',
                category: 'transport'
            },
            'SHGPUCL-------': { // Wheeled Vehicle Light
                model: 'jeep.glb',
                scale: 0.03,
                type: 'vehicle',
                category: 'transport'
            },

            // ARTILLERÍA (Artillery)
            'SHGPUCH-------': { // Howitzer
                model: 'tam_2c_war_thunder.glb',
                scale: 0.07,
                type: 'artillery',
                category: 'howitzer'
            },

            // INFRAESTRUCTURA MILITAR (Military Infrastructure)
            'SHGPUCF-------': { // Fortification
                model: 'tent_military.glb',
                scale: 0.1,
                type: 'infrastructure',
                category: 'tent'
            },
            'SHGPUCM-------': { // Medical Facility
                model: 'medical_tent.glb',
                scale: 0.08,
                type: 'infrastructure',
                category: 'medical'
            },

            // VEGETACIÓN (Vegetation - para terreno)
            'SHGPUCVG------': { // Vegetation
                model: 'tree_medium.glb',
                scale: 0.5,
                type: 'vegetation',
                category: 'tree'
            },
            'SHGPUCVB------': { // Bush
                model: 'arbusto.glb',
                scale: 0.3,
                type: 'vegetation',
                category: 'bush'
            },
            'SHGPUCVGR-----': { // Grass
                model: 'grass.glb',
                scale: 0.2,
                type: 'vegetation',
                category: 'grass'
            }
        };
    }

    /**
     * Obtener modelo 3D para un código SIDC
     * @param {string} sidc - Código SIDC completo (15 caracteres)
     * @returns {Object} - Configuración del modelo {model, scale, type, category}
     */
    getModelForSIDC(sidc) {
        if (!sidc || typeof sidc !== 'string') {
            console.warn('SIDC inválido:', sidc);
            return this.getDefaultModel();
        }

        // Normalizar SIDC (asegurar 15 caracteres)
        const normalizedSIDC = sidc.padEnd(15, '-').substring(0, 15);

        // Buscar mapeo exacto
        if (this.sidcMappings[normalizedSIDC]) {
            return this.sidcMappings[normalizedSIDC];
        }

        // Buscar por patrón (primeros 8 caracteres para tipo general)
        const pattern = normalizedSIDC.substring(0, 8) + '------';
        if (this.sidcMappings[pattern]) {
            return this.sidcMappings[pattern];
        }

        // Buscar por tipo de unidad (posiciones 6-7)
        const functionId = normalizedSIDC.substring(6, 8);
        const fallbackMapping = this.getFallbackForFunctionId(functionId);
        if (fallbackMapping) {
            return fallbackMapping;
        }

        console.warn('No se encontró mapeo para SIDC:', normalizedSIDC);
        return this.getDefaultModel();
    }

    /**
     * Obtener modelo por defecto cuando no hay mapeo específico
     */
    getDefaultModel() {
        return {
            model: 'fsb_operator.glb', // Soldado por defecto
            scale: 0.02,
            type: 'unknown',
            category: 'unit'
        };
    }

    /**
     * Obtener modelo fallback basado en Function ID (posiciones 6-7)
     */
    getFallbackForFunctionId(functionId) {
        const fallbacks = {
            'UC': { model: 'fsb_operator.glb', scale: 0.02, type: 'infantry', category: 'unit' }, // Infantry
            'UA': { model: 'm113.glb', scale: 0.05, type: 'vehicle', category: 'armored' }, // Armored
            'UT': { model: 'tam_tank.glb', scale: 0.08, type: 'vehicle', category: 'tank' }, // Tank
            'UV': { model: 'ural_4320.glb', scale: 0.04, type: 'vehicle', category: 'transport' }, // Vehicle
            'UH': { model: 'tam_2c_war_thunder.glb', scale: 0.07, type: 'artillery', category: 'howitzer' }, // Howitzer
            'CF': { model: 'tent_military.glb', scale: 0.1, type: 'infrastructure', category: 'tent' } // Fortification
        };

        return fallbacks[functionId] || null;
    }

    /**
     * Obtener información del tipo de unidad desde SIDC
     * @param {string} sidc - Código SIDC
     * @returns {Object} - Información del tipo {type, category, description}
     */
    getUnitTypeInfo(sidc) {
        const modelConfig = this.getModelForSIDC(sidc);

        const typeDescriptions = {
            'infantry': 'Infantería',
            'vehicle': 'Vehículo',
            'artillery': 'Artillería',
            'infrastructure': 'Infraestructura',
            'vegetation': 'Vegetación',
            'unknown': 'Desconocido'
        };

        const categoryDescriptions = {
            'unit': 'Unidad',
            'armored': 'Blindado',
            'tank': 'Tanque',
            'transport': 'Transporte',
            'howitzer': 'Obús',
            'tent': 'Tienda',
            'medical': 'Médico',
            'tree': 'Árbol',
            'bush': 'Arbusto',
            'grass': 'Hierba'
        };

        return {
            type: modelConfig.type,
            category: modelConfig.category,
            typeDescription: typeDescriptions[modelConfig.type] || 'Desconocido',
            categoryDescription: categoryDescriptions[modelConfig.category] || 'Desconocido',
            model: modelConfig.model,
            scale: modelConfig.scale
        };
    }

    /**
     * Verificar si un modelo está disponible
     * @param {string} modelName - Nombre del archivo del modelo
     * @returns {boolean} - True si el modelo existe
     */
    isModelAvailable(modelName) {
        // En un entorno real, esto verificaría si el archivo existe
        // Por ahora, asumimos que todos los modelos mapeados existen
        return Object.values(this.sidcMappings).some(mapping => mapping.model === modelName);
    }

    /**
     * Obtener lista de todos los modelos disponibles
     * @returns {Array} - Lista de modelos únicos
     */
    getAvailableModels() {
        const models = new Set();
        Object.values(this.sidcMappings).forEach(mapping => {
            models.add(mapping.model);
        });
        return Array.from(models);
    }

    /**
     * Obtener estadísticas del sistema de mapeo
     * @returns {Object} - Estadísticas del sistema
     */
    getStats() {
        const models = this.getAvailableModels();
        const types = {};
        const categories = {};

        Object.values(this.sidcMappings).forEach(mapping => {
            types[mapping.type] = (types[mapping.type] || 0) + 1;
            categories[mapping.category] = (categories[mapping.category] || 0) + 1;
        });

        return {
            totalMappings: Object.keys(this.sidcMappings).length,
            uniqueModels: models.length,
            models: models,
            types: types,
            categories: categories
        };
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SIDCToModel3D;
}

// Hacer disponible globalmente para el navegador
if (typeof window !== 'undefined') {
    window.SIDCToModel3D = SIDCToModel3D;
}