/**
 * 🚗 MAPEO DE VEHÍCULOS POR TIPO DE ELEMENTO (CCOO)
 * 
 * Define qué vehículos puede usar cada tipo de elemento según:
 * - Tablas de CCOO (Cuadros de Organización)
 * - Doctrina militar argentina
 * - Equipamiento disponible por unidad
 */

/**
 * Mapeo de tipo de elemento → vehículos disponibles
 * 
 * Basado en:
 * - RC-2-2 (Conducción Táctica de la Brigada)
 * - RC-3-2 (Conducción Táctica del Batallón)
 * - Tablas de CCOO actualizadas
 */
export const VEHICULOS_POR_TIPO_ELEMENTO = {
    
    // ========================================
    // INFANTERÍA
    // ========================================
    
    'infanteria_mecanizada': {
        nombre: 'Infantería Mecanizada',
        vehiculos: [
            {
                id: 'M113',
                nombre: 'M113 Transporte Blindado',
                tipo: 'blindado_oruga',
                dotacion: 'Estándar',
                capacidad: '11 soldados + tripulación',
                caracteristicas: {
                    vadeo: 1.0,
                    anfibio: false,
                    velocidad_ruta: 65,
                    velocidad_campo: 45,
                    armamento: 'Ametralladora 12.7mm o 7.62mm'
                }
            },
            {
                id: 'VCTP',
                nombre: 'VCTP (Vehículo Combate Transporte Personal)',
                tipo: 'blindado_oruga',
                dotacion: 'Brigadas mecanizadas modernas',
                capacidad: '9 soldados + tripulación',
                caracteristicas: {
                    vadeo: 1.0,
                    anfibio: false,
                    velocidad_ruta: 75,
                    velocidad_campo: 50,
                    armamento: 'Cañón 25mm + ametralladora'
                }
            },
            {
                id: 'STRIKER',
                nombre: 'Striker 8x8',
                tipo: 'blindado_rueda',
                dotacion: 'Próxima adquisición',
                capacidad: '9 soldados + tripulación',
                caracteristicas: {
                    vadeo: 1.0,
                    anfibio: false,
                    velocidad_ruta: 100,
                    velocidad_campo: 60,
                    armamento: 'Variable según versión'
                },
                nota: 'Aún no en servicio - planificación futura'
            }
        ],
        vehiculos_apoyo: ['Camión Logístico', 'Ambulancia M113']
    },

    'infanteria_motorizada': {
        nombre: 'Infantería Motorizada',
        vehiculos: [
            {
                id: 'UNIMOG',
                nombre: 'Unimog U-1300L',
                tipo: 'camion_4x4',
                dotacion: 'Estándar',
                capacidad: '16-20 soldados',
                caracteristicas: {
                    vadeo: 0.8,
                    velocidad_ruta: 90,
                    velocidad_campo: 50
                }
            },
            {
                id: 'TOYOTA_LAND_CRUISER',
                nombre: 'Toyota Land Cruiser',
                tipo: 'camion_4x4',
                dotacion: 'Unidades especiales',
                capacidad: '6-8 soldados',
                caracteristicas: {
                    vadeo: 0.7,
                    velocidad_ruta: 120,
                    velocidad_campo: 60
                }
            },
            {
                id: 'CAMION_MILITAR',
                nombre: 'Camión Militar 6x6',
                tipo: 'camion_6x6',
                dotacion: 'Transporte masivo',
                capacidad: '24-30 soldados',
                caracteristicas: {
                    vadeo: 0.8,
                    velocidad_ruta: 80,
                    velocidad_campo: 40
                }
            }
        ],
        operacion: 'Se aproximan montados, operan a pie'
    },

    'infanteria_a_pie': {
        nombre: 'Infantería a Pie',
        vehiculos: [
            {
                id: 'VEHICULO_APROXIMACION',
                nombre: 'Vehículo de Aproximación (Camión/4x4)',
                tipo: 'camion_4x4',
                dotacion: 'Solo para desplazamientos',
                uso: 'Aproximación inicial, luego operan a pie'
            },
            {
                id: 'A_PIE',
                nombre: 'A Pie',
                tipo: 'infanteria',
                dotacion: 'Operación principal',
                caracteristicas: {
                    vadeo: 1.5,
                    velocidad_campo: 5,
                    movilidad: 'Excelente en terreno difícil'
                }
            }
        ],
        nota: 'Casi siempre se mueven montados en vehículos para aproximación'
    },

    'infanteria_paracaidista': {
        nombre: 'Infantería Paracaidista',
        vehiculos: [
            {
                id: 'POLARIS',
                nombre: 'Polaris MRZR',
                tipo: 'vehiculo_ligero',
                dotacion: 'Mayoría de unidades aerotransportadas',
                capacidad: '2-4 soldados',
                caracteristicas: {
                    vadeo: 0.3,
                    velocidad_ruta: 80,
                    velocidad_campo: 60,
                    peso_transportable_avion: true
                }
            },
            {
                id: 'MOTO',
                nombre: 'Motocicleta Todo Terreno',
                tipo: 'moto',
                dotacion: 'Exploración',
                caracteristicas: {
                    velocidad_ruta: 100,
                    velocidad_campo: 50
                }
            }
        ]
    },

    'infanteria_montana': {
        nombre: 'Infantería de Montaña',
        vehiculos: [
            {
                id: 'MULA',
                nombre: 'Mula de Carga',
                tipo: 'animal',
                dotacion: 'Regimientos de Montaña',
                capacidad: '60-80 kg de carga',
                caracteristicas: {
                    terreno: 'Montaña escarpada',
                    pendiente_max: 60
                }
            },
            {
                id: 'VEHICULO_4X4_MONTANA',
                nombre: 'Vehículo 4x4 adaptado montaña',
                tipo: 'camion_4x4',
                dotacion: 'Zonas accesibles',
                uso: 'Solo en caminos de montaña'
            }
        ]
    },

    // ========================================
    // CABALLERÍA
    // ========================================

    'caballeria_tanques': {
        nombre: 'Caballería de Tanques',
        vehiculos: [
            {
                id: 'TAM',
                nombre: 'TAM (Tanque Argentino Mediano)',
                tipo: 'tanque_batalla',
                dotacion: 'Estándar brigadas blindadas',
                caracteristicas: {
                    vadeo: 1.4,
                    vadeo_preparado: 2.2,
                    velocidad_ruta: 75,
                    velocidad_campo: 50,
                    armamento: 'Cañón 105mm'
                }
            },
            {
                id: 'SK105',
                nombre: 'SK-105 Kürassier',
                tipo: 'tanque_ligero',
                dotacion: 'Regimientos blindados',
                caracteristicas: {
                    vadeo: 1.0,
                    velocidad_ruta: 65,
                    velocidad_campo: 45,
                    armamento: 'Cañón 105mm en torreta oscilante'
                }
            }
        ],
        vehiculos_apoyo: ['VCPC', 'Camión Logístico']
    },

    'caballeria_exploracion': {
        nombre: 'Caballería de Exploración',
        vehiculos: [
            {
                id: 'JEEP_230G',
                nombre: 'Jeep M-230G',
                tipo: 'vehiculo_4x4',
                dotacion: 'Estándar',
                capacidad: '4 soldados',
                caracteristicas: {
                    vadeo: 0.5,
                    velocidad_ruta: 110,
                    velocidad_campo: 65
                }
            },
            {
                id: 'POLARIS_EXPLORACION',
                nombre: 'Polaris MRZR',
                tipo: 'vehiculo_ligero',
                dotacion: 'Unidades modernas',
                caracteristicas: {
                    vadeo: 0.3,
                    velocidad_ruta: 80,
                    velocidad_campo: 60,
                    silencioso: true
                }
            },
            {
                id: 'MOTO_EXPLORACION',
                nombre: 'Motocicleta',
                tipo: 'moto',
                dotacion: 'Exploración rápida',
                caracteristicas: {
                    velocidad_ruta: 120,
                    velocidad_campo: 60
                }
            },
            {
                id: 'CABALLO',
                nombre: 'Caballo',
                tipo: 'animal',
                dotacion: 'Regimientos históricos / terreno muy difícil',
                caracteristicas: {
                    terreno: 'Montaña, bosque denso',
                    silencioso: true
                }
            }
        ]
    },

    'caballeria_mecanizada': {
        nombre: 'Caballería Mecanizada',
        vehiculos: [
            {
                id: 'VCTP_CAB',
                nombre: 'VCTP (versión caballería)',
                tipo: 'blindado_oruga',
                dotacion: 'Brigadas mecanizadas',
                armamento: 'Cañón 25mm'
            },
            {
                id: 'TAM_VCA',
                nombre: 'TAM VCA (Vehículo Combate Apoyo)',
                tipo: 'blindado_oruga',
                dotacion: 'Apoyo de fuego',
                armamento: 'Cañón 20mm'
            }
        ]
    },

    // ========================================
    // ARTILLERÍA
    // ========================================

    'artilleria_campana': {
        nombre: 'Artillería de Campaña',
        vehiculos: [
            {
                id: 'CAMION_TRACTOR',
                nombre: 'Camión Tractor',
                tipo: 'camion_6x6',
                dotacion: 'Tracción de piezas',
                remolca: 'Obús 155mm, 105mm'
            },
            {
                id: 'OBBUS_155',
                nombre: 'Obús 155mm remolcado',
                tipo: 'pieza_artilleria',
                alcance: '30 km (proyectil asistido)'
            },
            {
                id: 'OBBUS_105',
                nombre: 'Obús 105mm remolcado',
                tipo: 'pieza_artilleria',
                alcance: '11 km'
            }
        ]
    },

    'artilleria_blindada': {
        nombre: 'Artillería Blindada',
        vehiculos: [
            {
                id: 'PALMARIA',
                nombre: 'Palmaria 155mm autopropulsado',
                tipo: 'artilleria_autopropulsada',
                dotacion: 'Grupos de artillería blindada',
                caracteristicas: {
                    vadeo: 1.2,
                    velocidad_ruta: 60,
                    alcance: '24 km',
                    blindaje: true
                }
            },
            {
                id: 'TAM_VCA_155',
                nombre: 'TAM VCA 155mm (proyecto)',
                tipo: 'artilleria_autopropulsada',
                estado: 'En desarrollo'
            }
        ]
    },

    'artilleria_cohetes': {
        nombre: 'Artillería de Cohetes',
        vehiculos: [
            {
                id: 'CAMION_COHETERA',
                nombre: 'Camión con Lanzacohetes',
                tipo: 'camion_6x6',
                dotacion: 'Grupos de cohetes',
                sistema: 'SLAM PAMPERO',
                caracteristicas: {
                    alcance: '30-40 km',
                    calibre: '127mm'
                }
            }
        ]
    },

    'artilleria_montana': {
        nombre: 'Artillería de Montaña',
        vehiculos: [
            {
                id: 'MULA_ARTILLERIA',
                nombre: 'Mula de Carga',
                tipo: 'animal',
                dotacion: 'Transporte de piezas desmontadas',
                transporta: 'Obús 105mm en piezas'
            },
            {
                id: 'OBBUS_105_MONTANA',
                nombre: 'Obús 105mm Pack',
                tipo: 'pieza_artilleria',
                caracteristica: 'Desmontable para transporte en mula'
            }
        ]
    },

    // ========================================
    // INGENIEROS
    // ========================================

    'ingenieros': {
        nombre: 'Ingenieros',
        vehiculos: [
            {
                id: 'CAMION_INGENIEROS',
                nombre: 'Camión de Ingenieros',
                tipo: 'camion_6x6',
                dotacion: 'Transporte de equipo',
                equipo: 'Herramientas, explosivos, pontones'
            },
            {
                id: 'M113_INGENIEROS',
                nombre: 'M113 Ingenieros',
                tipo: 'blindado_oruga',
                dotacion: 'Ingenieros en combate',
                equipo: 'Pala mecánica, detector minas'
            },
            {
                id: 'BOTE_ASALTO',
                nombre: 'Bote de Asalto Inflable',
                tipo: 'embarcacion',
                dotacion: 'Cruce de ríos',
                capacidad: '8-12 soldados'
            },
            {
                id: 'PONTON',
                nombre: 'Pontón Modular',
                tipo: 'equipo_ingenieros',
                uso: 'Construcción de puentes'
            }
        ]
    },

    // ========================================
    // COMUNICACIONES
    // ========================================

    'comunicaciones': {
        nombre: 'Comunicaciones',
        vehiculos: [
            {
                id: 'CAMION_COMUNICACIONES',
                nombre: 'Camión de Comunicaciones',
                tipo: 'camion_4x4',
                dotacion: 'Centro de comunicaciones móvil',
                equipo: 'Radios HF/VHF, enlace satelital'
            },
            {
                id: 'TOYOTA_HILUX_COM',
                nombre: 'Toyota Hilux',
                tipo: 'camioneta_4x4',
                dotacion: 'Enlaces tácticos',
                equipo: 'Radio táctica'
            },
            {
                id: 'FORD_F350',
                nombre: 'Ford F-350 Heavy Duty',
                tipo: 'camioneta_4x4',
                dotacion: 'Equipos pesados',
                equipo: 'Centro de comunicaciones'
            }
        ]
    },

    // ========================================
    // LOGÍSTICA
    // ========================================

    'logistica': {
        nombre: 'Logística',
        vehiculos: [
            {
                id: 'CAMION_LOGISTICO_6X6',
                nombre: 'Camión Logístico 6x6',
                tipo: 'camion_6x6',
                dotacion: 'Transporte de carga estándar',
                capacidad: '5-10 toneladas'
            },
            {
                id: 'CAMION_CISTERNA',
                nombre: 'Camión Cisterna',
                tipo: 'camion_6x6',
                dotacion: 'Combustible/agua',
                capacidad: '8,000 litros'
            },
            {
                id: 'SK105_LOGISTICO',
                nombre: 'SK-105 versión Logística',
                tipo: 'blindado_oruga_logistico',
                dotacion: 'Algunas unidades blindadas',
                nota: 'Versión sin torreta para transporte',
                capacidad: '3 toneladas'
            },
            {
                id: 'UNIMOG_LOGISTICO',
                nombre: 'Unimog Logístico',
                tipo: 'camion_4x4',
                dotacion: 'Logística en terreno difícil',
                capacidad: '2-3 toneladas'
            }
        ]
    },

    'sanidad': {
        nombre: 'Sanidad',
        vehiculos: [
            {
                id: 'AMBULANCIA_M113',
                nombre: 'M113 Ambulancia',
                tipo: 'blindado_oruga',
                dotacion: 'Evacuación en combate',
                capacidad: '4-6 camillas'
            },
            {
                id: 'AMBULANCIA_4X4',
                nombre: 'Ambulancia 4x4',
                tipo: 'camion_4x4',
                dotacion: 'Evacuación táctica',
                capacidad: '2-4 camillas'
            }
        ]
    }
};

/**
 * Obtener vehículos disponibles para un tipo de elemento
 * @param {string} tipoElemento - Tipo de elemento (ej: 'infanteria_mecanizada')
 * @returns {Array} Lista de vehículos disponibles
 */
export function obtenerVehiculosDisponibles(tipoElemento) {
    const config = VEHICULOS_POR_TIPO_ELEMENTO[tipoElemento];
    if (!config) {
        console.warn(`⚠️ Tipo de elemento '${tipoElemento}' no encontrado`);
        return [];
    }
    
    return config.vehiculos || [];
}

/**
 * Obtener información completa de un vehículo
 * @param {string} tipoElemento - Tipo de elemento
 * @param {string} vehiculoId - ID del vehículo
 * @returns {Object} Información del vehículo
 */
export function obtenerInfoVehiculo(tipoElemento, vehiculoId) {
    const vehiculos = obtenerVehiculosDisponibles(tipoElemento);
    return vehiculos.find(v => v.id === vehiculoId) || null;
}

/**
 * Mapeo simplificado para el selector de UI
 * (solo IDs de vehículos principales)
 */
export const VEHICULOS_SELECTOR_SIMPLE = {
    'infanteria_mecanizada': ['M113', 'VCTP', 'STRIKER'],
    'infanteria_motorizada': ['UNIMOG', 'TOYOTA_LAND_CRUISER', 'CAMION_MILITAR'],
    'infanteria_a_pie': ['A_PIE', 'VEHICULO_APROXIMACION'],
    'infanteria_paracaidista': ['POLARIS', 'MOTO'],
    'infanteria_montana': ['MULA', 'VEHICULO_4X4_MONTANA'],
    'caballeria_tanques': ['TAM', 'SK105'],
    'caballeria_exploracion': ['JEEP_230G', 'POLARIS_EXPLORACION', 'MOTO_EXPLORACION', 'CABALLO'],
    'caballeria_mecanizada': ['VCTP_CAB', 'TAM_VCA'],
    'artilleria_campana': ['CAMION_TRACTOR', 'OBBUS_155', 'OBBUS_105'],
    'artilleria_blindada': ['PALMARIA'],
    'artilleria_cohetes': ['CAMION_COHETERA'],
    'artilleria_montana': ['MULA_ARTILLERIA', 'OBBUS_105_MONTANA'],
    'ingenieros': ['CAMION_INGENIEROS', 'M113_INGENIEROS', 'BOTE_ASALTO'],
    'comunicaciones': ['CAMION_COMUNICACIONES', 'TOYOTA_HILUX_COM', 'FORD_F350'],
    'logistica': ['CAMION_LOGISTICO_6X6', 'CAMION_CISTERNA', 'SK105_LOGISTICO', 'UNIMOG_LOGISTICO'],
    'sanidad': ['AMBULANCIA_M113', 'AMBULANCIA_4X4']
};

export default {
    VEHICULOS_POR_TIPO_ELEMENTO,
    VEHICULOS_SELECTOR_SIMPLE,
    obtenerVehiculosDisponibles,
    obtenerInfoVehiculo
};
