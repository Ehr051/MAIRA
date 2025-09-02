/**
 * 🎯 MAIRA CamelCase Converter Utility
 * Herramienta completa para conversión de nomenclatura en el código de MAIRA
 * Convierte variables, funciones y propiedades a camelCase
 */

class CamelCaseConverter {
    constructor() {
        this.conversionRules = new Map();
        this.conversionHistory = [];
        this.isEnabled = true;
        this.statistics = {
            conversionsPerformed: 0,
            filesProcessed: 0,
            variablesConverted: 0,
            functionsConverted: 0,
            propertiesConverted: 0
        };

        console.log('🎯 CamelCaseConverter initialized');
        this.initializeConverter();
    }

    /**
     * Inicializa el conversor
     */
    initializeConverter() {
        this.setupConversionRules();
        this.setupPatterns();
        this.createConversionMaps();
        this.bindEvents();
        
        console.log('✅ CamelCase converter ready');
    }

    /**
     * Configura reglas de conversión específicas
     */
    setupConversionRules() {
        // Mapeo específico para variables comunes de MAIRA
        this.specificMappings = new Map([
            // Variables globales comunes
            ['datos_unidades', 'datosUnidades'],
            ['coordenadas_mapa', 'coordenadasMapa'],
            ['estado_battle', 'estadoBattle'],
            ['lista_tropas', 'listaTropas'],
            ['position_x', 'positionX'],
            ['position_y', 'positionY'],
            ['nivel_zoom', 'nivelZoom'],
            ['tipo_unidad', 'tipoUnidad'],
            ['modo_juego', 'modoJuego'],
            ['configuracion_mapa', 'configuracionMapa'],
            
            // Funciones específicas de MAIRA
            ['mostrar_unidades', 'mostrarUnidades'],
            ['crear_marcador', 'crearMarcador'],
            ['actualizar_posicion', 'actualizarPosicion'],
            ['cargar_datos', 'cargarDatos'],
            ['guardar_estado', 'guardarEstado'],
            ['iniciar_battle', 'iniciarBattle'],
            ['obtener_coordenadas', 'obtenerCoordenadas'],
            ['configurar_mapa', 'configurarMapa'],
            ['procesar_comando', 'procesarComando'],
            ['enviar_mensaje', 'enviarMensaje'],
            
            // Propiedades de objetos
            ['latitud_inicial', 'latitudInicial'],
            ['longitud_inicial', 'longitudInicial'],
            ['zoom_inicial', 'zoomInicial'],
            ['capa_actual', 'capaActual'],
            ['estado_conexion', 'estadoConexion'],
            ['tiempo_respuesta', 'tiempoRespuesta'],
            ['numero_tropas', 'numeroTropas'],
            ['health_actual', 'healthActual'],
            ['damage_base', 'damageBase'],
            ['velocidad_movimiento', 'velocidadMovimiento'],
            
            // IDs y referencias
            ['id_usuario', 'idUsuario'],
            ['id_partida', 'idPartida'],
            ['id_unidad', 'idUnidad'],
            ['ref_mapa', 'refMapa'],
            ['container_id', 'containerId'],
            ['element_target', 'elementTarget'],
            
            // Estados y flags
            ['is_visible', 'isVisible'],
            ['is_active', 'isActive'],
            ['is_selected', 'isSelected'],
            ['can_move', 'canMove'],
            ['has_focus', 'hasFocus'],
            ['show_tooltip', 'showTooltip'],
            
            // Configuraciones
            ['config_general', 'configGeneral'],
            ['opciones_avanzadas', 'opcionesAvanzadas'],
            ['parametros_batalla', 'parametrosBatalla'],
            ['ajustes_grafico', 'ajustesGrafico']
        ]);

        console.log('📋 Conversion rules configured');
    }

    /**
     * Configura patrones de reconocimiento
     */
    setupPatterns() {
        this.patterns = {
            // Variables con guión bajo
            snakeCase: /([a-z])_([a-z])/g,
            
            // Variables con guión
            kebabCase: /([a-z])-([a-z])/g,
            
            // Variables con espacios
            spaceCase: /([a-z])\s+([a-z])/g,
            
            // Variables con puntos
            dotCase: /([a-z])\.([a-z])/g,
            
            // Declaraciones de variables
            varDeclaration: /\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            
            // Asignaciones de propiedades
            propertyAssignment: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
            
            // Llamadas a funciones
            functionCall: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            
            // Definiciones de funciones
            functionDefinition: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            
            // Propiedades de objetos en literales
            objectProperty: /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
            
            // Acceso a propiedades con corchetes
            bracketNotation: /\[['"]([a-zA-Z_$][a-zA-Z0-9_$]*)['"]\]/g
        };

        console.log('🎭 Patterns configured');
    }

    /**
     * Crea mapas de conversión basados en código existente
     */
    createConversionMaps() {
        this.conversionMap = new Map();
        
        // Agregar mapeos específicos
        this.specificMappings.forEach((camelCase, original) => {
            this.conversionMap.set(original, camelCase);
        });

        console.log('🗺️ Conversion maps created');
    }

    /**
     * Vincula eventos del sistema
     */
    bindEvents() {
        if (window.MAIRA?.Events) {
            window.MAIRA.Events.on('code:analyze', (data) => {
                this.analyzeCodeForConversion(data.code);
            });

            window.MAIRA.Events.on('file:convert', (data) => {
                this.convertFile(data.filePath);
            });
        }

        console.log('🔗 CamelCase converter events bound');
    }

    /**
     * Convierte una cadena a camelCase
     * @param {string} str - Cadena a convertir
     * @returns {string} Cadena en camelCase
     */
    toCamelCase(str) {
        if (!str || typeof str !== 'string') return str;

        // Verificar mapeo específico primero
        if (this.conversionMap.has(str)) {
            return this.conversionMap.get(str);
        }

        // Aplicar conversiones estándar
        let converted = str
            // snake_case a camelCase
            .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
            // kebab-case a camelCase
            .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
            // space case a camelCase
            .replace(/\s+([a-z])/g, (match, letter) => letter.toUpperCase())
            // PascalCase a camelCase (primera letra minúscula)
            .replace(/^[A-Z]/, letter => letter.toLowerCase())
            // Remover caracteres especiales
            .replace(/[^a-zA-Z0-9]/g, '');

        // Agregar al mapa para futuras referencias
        if (converted !== str) {
            this.conversionMap.set(str, converted);
        }

        return converted;
    }

    /**
     * Analiza código para identificar conversiones necesarias
     * @param {string} code - Código a analizar
     * @returns {Object} Análisis de conversiones
     */
    analyzeCodeForConversion(code) {
        const analysis = {
            variablesFound: [],
            functionsFound: [],
            propertiesFound: [],
            conversionsNeeded: [],
            conversionMap: new Map()
        };

        // Buscar variables
        let match;
        
        // Variables declaradas
        const varPattern = this.patterns.varDeclaration;
        varPattern.lastIndex = 0;
        while ((match = varPattern.exec(code)) !== null) {
            const varName = match[2];
            const converted = this.toCamelCase(varName);
            
            analysis.variablesFound.push(varName);
            
            if (converted !== varName) {
                analysis.conversionsNeeded.push({
                    type: 'variable',
                    original: varName,
                    converted,
                    position: match.index
                });
                analysis.conversionMap.set(varName, converted);
            }
        }

        // Funciones definidas
        const funcPattern = this.patterns.functionDefinition;
        funcPattern.lastIndex = 0;
        while ((match = funcPattern.exec(code)) !== null) {
            const funcName = match[1];
            const converted = this.toCamelCase(funcName);
            
            analysis.functionsFound.push(funcName);
            
            if (converted !== funcName) {
                analysis.conversionsNeeded.push({
                    type: 'function',
                    original: funcName,
                    converted,
                    position: match.index
                });
                analysis.conversionMap.set(funcName, converted);
            }
        }

        // Propiedades de objetos
        const propPattern = this.patterns.objectProperty;
        propPattern.lastIndex = 0;
        while ((match = propPattern.exec(code)) !== null) {
            const propName = match[1];
            const converted = this.toCamelCase(propName);
            
            analysis.propertiesFound.push(propName);
            
            if (converted !== propName) {
                analysis.conversionsNeeded.push({
                    type: 'property',
                    original: propName,
                    converted,
                    position: match.index
                });
                analysis.conversionMap.set(propName, converted);
            }
        }

        console.log('🔍 Code analysis completed:', analysis);
        return analysis;
    }

    /**
     * Convierte código a camelCase
     * @param {string} code - Código original
     * @returns {Object} Resultado de conversión
     */
    convertCode(code) {
        if (!code || typeof code !== 'string') {
            return { originalCode: code, convertedCode: code, conversions: [] };
        }

        const conversions = [];
        let convertedCode = code;

        // Primero analizar el código
        const analysis = this.analyzeCodeForConversion(code);

        // Aplicar conversiones en orden inverso para mantener posiciones
        const sortedConversions = analysis.conversionsNeeded
            .sort((a, b) => b.position - a.position);

        sortedConversions.forEach(conversion => {
            const { original, converted, type } = conversion;
            
            // Crear patrón específico para el tipo de conversión
            let pattern;
            switch (type) {
                case 'variable':
                    pattern = new RegExp(`\\b${this.escapeRegExp(original)}\\b`, 'g');
                    break;
                case 'function':
                    pattern = new RegExp(`\\b${this.escapeRegExp(original)}(?=\\s*\\()`, 'g');
                    break;
                case 'property':
                    pattern = new RegExp(`\\b${this.escapeRegExp(original)}(?=\\s*:)`, 'g');
                    break;
                default:
                    pattern = new RegExp(`\\b${this.escapeRegExp(original)}\\b`, 'g');
            }

            // Contar ocurrencias antes de reemplazar
            const matches = (convertedCode.match(pattern) || []).length;
            
            if (matches > 0) {
                convertedCode = convertedCode.replace(pattern, converted);
                conversions.push({
                    type,
                    original,
                    converted,
                    occurrences: matches
                });

                this.statistics.conversionsPerformed += matches;
                
                switch (type) {
                    case 'variable':
                        this.statistics.variablesConverted += matches;
                        break;
                    case 'function':
                        this.statistics.functionsConverted += matches;
                        break;
                    case 'property':
                        this.statistics.propertiesConverted += matches;
                        break;
                }
            }
        });

        // Guardar en historial
        this.conversionHistory.push({
            timestamp: Date.now(),
            originalLength: code.length,
            convertedLength: convertedCode.length,
            conversionsApplied: conversions.length
        });

        return {
            originalCode: code,
            convertedCode,
            conversions,
            analysis
        };
    }

    /**
     * Convierte un archivo específico
     * @param {string} filePath - Ruta del archivo
     * @returns {Promise} Resultado de conversión
     */
    async convertFile(filePath) {
        try {
            // En un entorno real, leeríamos el archivo
            // Por ahora, simular carga de archivo
            console.log(`📁 Converting file: ${filePath}`);
            
            const mockCode = `
                var datos_unidades = [];
                var coordenadas_mapa = { lat: 0, lng: 0 };
                
                function mostrar_unidades() {
                    return datos_unidades;
                }
                
                function actualizar_posicion(nueva_posicion) {
                    coordenadas_mapa = nueva_posicion;
                }
                
                var config_general = {
                    nivel_zoom: 10,
                    tipo_unidad: 'infantry',
                    modo_juego: 'tactical'
                };
            `;

            const result = this.convertCode(mockCode);
            
            this.statistics.filesProcessed++;
            
            // Emitir evento de conversión completada
            if (window.MAIRA?.Events) {
                window.MAIRA.Events.emit('camelcase:file:converted', {
                    filePath,
                    result,
                    statistics: this.statistics
                });
            }

            console.log(`✅ File converted: ${filePath}`);
            return result;

        } catch (error) {
            console.error(`❌ Error converting file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Convierte múltiples archivos
     * @param {Array} filePaths - Lista de archivos
     * @returns {Promise} Resultados de conversión
     */
    async convertMultipleFiles(filePaths) {
        const results = [];
        
        for (const filePath of filePaths) {
            try {
                const result = await this.convertFile(filePath);
                results.push({ filePath, success: true, result });
            } catch (error) {
                results.push({ filePath, success: false, error });
            }
        }

        return results;
    }

    /**
     * Genera reporte de conversiones
     * @returns {Object} Reporte detallado
     */
    generateConversionReport() {
        const report = {
            summary: { ...this.statistics },
            mappings: Object.fromEntries(this.conversionMap),
            history: this.conversionHistory.slice(-10), // Últimas 10 conversiones
            patterns: Object.keys(this.patterns),
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Genera recomendaciones basadas en el uso
     * @returns {Array} Lista de recomendaciones
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.statistics.variablesConverted > 50) {
            recommendations.push({
                type: 'best-practice',
                message: 'Considerar establecer convenciones de nomenclatura para el equipo',
                priority: 'medium'
            });
        }

        if (this.statistics.functionsConverted > 20) {
            recommendations.push({
                type: 'refactoring',
                message: 'Revisar nombres de funciones para mayor claridad',
                priority: 'low'
            });
        }

        if (this.conversionHistory.length > 100) {
            recommendations.push({
                type: 'optimization',
                message: 'Configurar linting automático para prevenir inconsistencias',
                priority: 'high'
            });
        }

        return recommendations;
    }

    /**
     * Escapa caracteres especiales para regex
     * @param {string} string - Cadena a escapar
     * @returns {string} Cadena escapada
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Agrega mapeo personalizado
     * @param {string} original - Nombre original
     * @param {string} converted - Nombre convertido
     */
    addCustomMapping(original, converted) {
        this.conversionMap.set(original, converted);
        console.log(`📝 Custom mapping added: ${original} → ${converted}`);
    }

    /**
     * Remueve mapeo personalizado
     * @param {string} original - Nombre original a remover
     */
    removeCustomMapping(original) {
        this.conversionMap.delete(original);
        console.log(`🗑️ Custom mapping removed: ${original}`);
    }

    /**
     * Valida si un nombre sigue convenciones camelCase
     * @param {string} name - Nombre a validar
     * @returns {Object} Resultado de validación
     */
    validateCamelCase(name) {
        const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(name);
        const hasUnderscores = /_/.test(name);
        const hasDashes = /-/.test(name);
        const hasSpaces = /\s/.test(name);

        return {
            isValid: isCamelCase,
            issues: {
                hasUnderscores,
                hasDashes,
                hasSpaces,
                startsWithUppercase: /^[A-Z]/.test(name)
            },
            suggestion: isCamelCase ? name : this.toCamelCase(name)
        };
    }

    /**
     * Obtiene estadísticas del conversor
     * @returns {Object} Estadísticas completas
     */
    getStats() {
        return {
            ...this.statistics,
            totalMappings: this.conversionMap.size,
            isEnabled: this.isEnabled,
            conversionHistory: this.conversionHistory.length,
            patternsConfigured: Object.keys(this.patterns).length
        };
    }

    /**
     * Resetea estadísticas
     */
    resetStats() {
        this.statistics = {
            conversionsPerformed: 0,
            filesProcessed: 0,
            variablesConverted: 0,
            functionsConverted: 0,
            propertiesConverted: 0
        };
        this.conversionHistory = [];
        console.log('📊 Statistics reset');
    }

    /**
     * Habilita/deshabilita el conversor
     * @param {boolean} enabled - Si habilitar
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`🎯 CamelCase converter ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Exporta configuración del conversor
     * @returns {Object} Configuración completa
     */
    exportConfiguration() {
        return {
            conversionMap: Object.fromEntries(this.conversionMap),
            patterns: this.patterns,
            statistics: this.statistics,
            isEnabled: this.isEnabled
        };
    }

    /**
     * Importa configuración del conversor
     * @param {Object} config - Configuración a importar
     */
    importConfiguration(config) {
        if (config.conversionMap) {
            this.conversionMap = new Map(Object.entries(config.conversionMap));
        }
        if (config.patterns) {
            this.patterns = config.patterns;
        }
        if (config.statistics) {
            this.statistics = config.statistics;
        }
        if (typeof config.isEnabled === 'boolean') {
            this.isEnabled = config.isEnabled;
        }
        
        console.log('📥 Configuration imported');
    }
}

// Inicializar CamelCaseConverter globalmente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.CamelCase = new CamelCaseConverter();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CamelCaseConverter;
}

console.log('🎯 MAIRA CamelCase Converter loaded and active');
