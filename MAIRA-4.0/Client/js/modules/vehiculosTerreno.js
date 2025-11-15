/**
 * 🚗 SISTEMA DE CAPACIDADES DE VEHÍCULOS Y TERRENO
 * 
 * Define las capacidades de diferentes tipos de vehículos militares
 * y cómo interactúan con los obstáculos del terreno.
 * 
 * Basado en:
 * - FM 5-33 (Terrain Analysis)
 * - MC 3-21-50 (Estudio del Terreno)
 * - Características técnicas de vehículos
 */

// ========================================
// 🚗 TIPOS DE VEHÍCULOS MILITARES
// ========================================

export const TIPOS_VEHICULOS = {
    // VEHÍCULOS RUEDA
    CAMION_LOGISTICO: {
        id: 'camion_logistico',
        nombre: 'Camión Logístico 4x4',
        tipo: 'rueda',
        traccion: '4x4',
        capacidades: {
            vadeo_max: 0.6,           // metros
            pendiente_max: 25,        // grados
            velocidad_ruta: 80,       // km/h
            velocidad_campo: 40,      // km/h
            terreno_blando: 'limitado', // ninguno, limitado, moderado, bueno
            anfibio: false
        },
        modificadores: {
            arenal: -0.60,
            barrial: -0.70,
            pedregal: -0.40,
            nieve: -0.50,
            bosque_denso: -0.80
        }
    },
    
    BLINDADO_RUEDA: {
        id: 'blindado_rueda',
        nombre: 'Blindado de Ruedas 6x6',
        tipo: 'rueda',
        traccion: '6x6',
        capacidades: {
            vadeo_max: 1.0,
            pendiente_max: 30,
            velocidad_ruta: 100,
            velocidad_campo: 60,
            terreno_blando: 'moderado',
            anfibio: false
        },
        modificadores: {
            arenal: -0.40,
            barrial: -0.50,
            pedregal: -0.30,
            nieve: -0.40,
            bosque_denso: -0.60
        }
    },
    
    BLINDADO_RUEDA_ANFIBIO: {
        id: 'blindado_rueda_anfibio',
        nombre: 'Blindado Anfibio 8x8',
        tipo: 'rueda',
        traccion: '8x8',
        capacidades: {
            vadeo_max: 999,           // Ilimitado (anfibio)
            pendiente_max: 30,
            velocidad_ruta: 100,
            velocidad_campo: 60,
            velocidad_agua: 10,       // km/h en agua
            terreno_blando: 'bueno',
            anfibio: true
        },
        modificadores: {
            arenal: -0.30,
            barrial: -0.40,
            pedregal: -0.25,
            nieve: -0.35,
            bosque_denso: -0.60,
            rio: 0.0                  // Puede cruzar ríos nadando
        }
    },
    
    // VEHÍCULOS ORUGA
    TANQUE_BATALLA: {
        id: 'tanque_batalla',
        nombre: 'Tanque de Batalla Principal',
        tipo: 'oruga',
        traccion: 'oruga',
        capacidades: {
            vadeo_max: 1.2,           // Con preparación: 1.8m
            vadeo_preparado: 1.8,
            pendiente_max: 35,
            velocidad_ruta: 70,
            velocidad_campo: 50,
            terreno_blando: 'excelente',
            anfibio: false,
            puede_destruir_obstaculos: true
        },
        modificadores: {
            arenal: -0.15,
            barrial: -0.20,
            pedregal: -0.10,
            nieve: -0.15,
            bosque_denso: -0.30,
            vegetacion_arbustiva: 0.0  // Puede atravesar
        }
    },
    
    BLINDADO_ORUGA: {
        id: 'blindado_oruga',
        nombre: 'Transporte Blindado Oruga',
        tipo: 'oruga',
        traccion: 'oruga',
        capacidades: {
            vadeo_max: 1.0,
            pendiente_max: 32,
            velocidad_ruta: 65,
            velocidad_campo: 45,
            terreno_blando: 'excelente',
            anfibio: false
        },
        modificadores: {
            arenal: -0.20,
            barrial: -0.25,
            pedregal: -0.15,
            nieve: -0.20,
            bosque_denso: -0.40
        }
    },
    
    ANFIBIO_ORUGA: {
        id: 'anfibio_oruga',
        nombre: 'Vehículo Anfibio de Oruga',
        tipo: 'oruga',
        traccion: 'oruga',
        capacidades: {
            vadeo_max: 999,
            pendiente_max: 30,
            velocidad_ruta: 60,
            velocidad_campo: 40,
            velocidad_agua: 8,
            terreno_blando: 'excelente',
            anfibio: true
        },
        modificadores: {
            arenal: -0.15,
            barrial: -0.20,
            pedregal: -0.10,
            nieve: -0.15,
            bosque_denso: -0.35,
            rio: 0.0
        }
    },
    
    // INFANTERÍA
    INFANTERIA: {
        id: 'infanteria',
        nombre: 'Infantería a Pie',
        tipo: 'infanteria',
        traccion: 'pie',
        capacidades: {
            vadeo_max: 1.5,           // Con equipo especial
            pendiente_max: 60,        // Muy alta para infantería
            velocidad_ruta: 5,        // km/h caminando
            velocidad_campo: 3,
            terreno_blando: 'excelente',
            anfibio: false
        },
        modificadores: {
            arenal: -0.30,
            barrial: -0.40,
            pedregal: -0.25,
            nieve: -0.35,
            bosque_denso: -0.20,      // Infantería maneja mejor vegetación
            vegetacion_arbustiva: -0.10
        }
    }
};

// ========================================
// 💧 CARACTERÍSTICAS DE OBSTÁCULOS ACUÁTICOS
// ========================================

export const CLASES_RIOS = {
    ARROYO: {
        ancho_min: 0,
        ancho_max: 3,         // metros
        profundidad_media: 0.3,
        velocidad_corriente: 'lenta',
        descripcion: 'Arroyo pequeño',
        vadeable_infanteria: true,
        vadeable_rueda_4x4: true,
        vadeable_oruga: true
    },
    
    RIO_PEQUEÑO: {
        ancho_min: 3,
        ancho_max: 10,
        profundidad_media: 0.8,
        velocidad_corriente: 'moderada',
        descripcion: 'Río pequeño',
        vadeable_infanteria: true,  // Con cuidado
        vadeable_rueda_4x4: false,
        vadeable_oruga: true        // Si profundidad < vadeo_max
    },
    
    RIO_MEDIANO: {
        ancho_min: 10,
        ancho_max: 50,
        profundidad_media: 1.5,
        velocidad_corriente: 'moderada',
        descripcion: 'Río mediano',
        vadeable_infanteria: false,
        vadeable_rueda_4x4: false,
        vadeable_oruga: false,      // Requiere puente o anfibio
        requiere_puente: true
    },
    
    RIO_GRANDE: {
        ancho_min: 50,
        ancho_max: 200,
        profundidad_media: 3.0,
        velocidad_corriente: 'rápida',
        descripcion: 'Río grande',
        vadeable_infanteria: false,
        vadeable_rueda_4x4: false,
        vadeable_oruga: false,
        requiere_puente: true,
        requiere_puente_pesado: true
    },
    
    RIO_MUY_GRANDE: {
        ancho_min: 200,
        ancho_max: 999999,
        profundidad_media: 5.0,
        velocidad_corriente: 'rápida',
        descripcion: 'Río muy grande (Paraná, Uruguay)',
        vadeable_infanteria: false,
        vadeable_rueda_4x4: false,
        vadeable_oruga: false,
        requiere_puente: true,
        requiere_puente_pesado: true,
        requiere_estudio_detallado: true
    }
};

// ========================================
// 🏜️ CARACTERÍSTICAS DE SUELOS
// ========================================

export const CARACTERISTICAS_SUELOS = {
    ARENAL: {
        resistencia: 'muy_baja',
        drenaje: 'excelente',
        impacto_lluvia: 'ninguno',
        mejor_estacion: 'todo_año',
        descripcion: 'Arena suelta, vehículos se hunden',
        modificadores: {
            rueda_4x4: -0.60,
            rueda_6x6: -0.40,
            oruga: -0.15
        }
    },
    
    BARRIAL: {
        resistencia: 'muy_baja',
        drenaje: 'malo',
        impacto_lluvia: 'severo',
        mejor_estacion: 'seco',
        peor_estacion: 'lluvia',
        descripcion: 'Barro, terreno blando y resbaladizo',
        modificadores: {
            rueda_4x4: -0.70,
            rueda_6x6: -0.50,
            oruga: -0.20
        },
        modificadores_lluvia: {
            rueda_4x4: -0.90,   // Casi intransitable
            rueda_6x6: -0.70,
            oruga: -0.40
        }
    },
    
    PEDREGAL: {
        resistencia: 'alta',
        drenaje: 'excelente',
        impacto_lluvia: 'ninguno',
        mejor_estacion: 'todo_año',
        descripcion: 'Piedras sueltas, dañino para vehículos',
        modificadores: {
            rueda_4x4: -0.40,
            rueda_6x6: -0.30,
            oruga: -0.10
        },
        daño_vehiculos: true,
        velocidad_reducida: 0.5  // 50% velocidad normal
    },
    
    AFLORAMIENTO_ROCOSO: {
        resistencia: 'muy_alta',
        drenaje: 'excelente',
        impacto_lluvia: 'ninguno',
        mejor_estacion: 'todo_año',
        descripcion: 'Roca sólida, intransitable para vehículos',
        modificadores: {
            rueda_4x4: -0.80,
            rueda_6x6: -0.70,
            oruga: -0.35,
            infanteria: -0.25   // Infantería puede escalar
        }
    },
    
    SEDIMENTO_FLUVIAL: {
        resistencia: 'baja',
        drenaje: 'variable',
        impacto_lluvia: 'moderado',
        mejor_estacion: 'seco',
        descripcion: 'Sedimentos cerca de ríos, inestable',
        modificadores: {
            rueda_4x4: -0.45,
            rueda_6x6: -0.35,
            oruga: -0.15
        },
        riesgo_hundimiento: true
    },
    
    CUMBRE_ROCOSA: {
        resistencia: 'muy_alta',
        drenaje: 'excelente',
        impacto_lluvia: 'ninguno',
        mejor_estacion: 'todo_año',
        descripcion: 'Terreno rocoso escarpado',
        modificadores: {
            rueda_4x4: -0.90,
            rueda_6x6: -0.85,
            oruga: -0.60,
            infanteria: -0.40
        },
        solo_infanteria_ligera: true
    },
    
    SALINA: {
        resistencia: 'muy_baja',
        drenaje: 'malo',
        impacto_lluvia: 'severo',
        mejor_estacion: 'seco',
        descripcion: 'Sal cristalizada, frágil bajo peso',
        modificadores: {
            rueda_4x4: -0.50,
            rueda_6x6: -0.40,
            oruga: -0.25
        },
        riesgo_hundimiento: true,
        corrosivo: true  // Daña vehículos a largo plazo
    }
};

// ========================================
// 🌳 IMPACTO DE VEGETACIÓN
// ========================================

export const IMPACTO_VEGETACION = {
    BOSQUE_DENSO: {
        densidad: 'muy_alta',
        altura_media: 15,  // metros
        descripcion: 'Bosque nativo denso',
        modificadores: {
            rueda_4x4: -0.80,
            rueda_6x6: -0.70,
            oruga: -0.40,
            tanque: -0.30,        // Puede derribar árboles pequeños
            infanteria: -0.25
        },
        visibilidad_reducida: 0.9,  // 90% menos visibilidad
        cobertura: 0.85,
        ocultamiento: 0.90
    },
    
    BOSQUE_MODERADO: {
        densidad: 'media',
        altura_media: 12,
        descripcion: 'Bosque tipo 3',
        modificadores: {
            rueda_4x4: -0.60,
            rueda_6x6: -0.50,
            oruga: -0.30,
            tanque: -0.20,
            infanteria: -0.20
        },
        visibilidad_reducida: 0.7,
        cobertura: 0.70,
        ocultamiento: 0.75
    },
    
    VEGETACION_ARBUSTIVA: {
        densidad: 'media',
        altura_media: 2,
        descripcion: 'Arbustos y matorrales',
        modificadores: {
            rueda_4x4: -0.35,
            rueda_6x6: -0.30,
            oruga: -0.15,
            tanque: 0.0,          // Puede atravesar sin problema
            infanteria: -0.15
        },
        visibilidad_reducida: 0.4,
        cobertura: 0.30,
        ocultamiento: 0.60      // Buen ocultamiento
    },
    
    VEGETACION_HIDROFILA: {
        densidad: 'alta',
        altura_media: 3,
        descripcion: 'Vegetación de humedal',
        modificadores: {
            rueda_4x4: -0.70,
            rueda_6x6: -0.60,
            oruga: -0.35,
            tanque: -0.25,
            infanteria: -0.40
        },
        terreno_humedo: true,
        visibilidad_reducida: 0.6,
        cobertura: 0.40,
        ocultamiento: 0.70,
        indica_agua_cercana: true
    },
    
    CULTIVO_ARBOREO: {
        densidad: 'baja',
        altura_media: 4,
        descripcion: 'Frutales, olivares',
        modificadores: {
            rueda_4x4: -0.20,
            rueda_6x6: -0.15,
            oruga: -0.10,
            tanque: 0.0,
            infanteria: -0.10
        },
        visibilidad_reducida: 0.3,
        cobertura: 0.20,
        ocultamiento: 0.40,
        estacional: true        // Varía según época
    }
};

// ========================================
// 🎯 FUNCIONES DE EVALUACIÓN
// ========================================

/**
 * Evaluar si un vehículo puede cruzar un río
 */
export function puedeVadearRio(vehiculo, anchoRio, profundidadRio) {
    const caps = vehiculo.capacidades;
    
    // Vehículos anfibios pueden cruzar cualquier río
    if (caps.anfibio) {
        return {
            puede: true,
            metodo: 'anfibio',
            velocidad_cruce: caps.velocidad_agua || 10,
            tiempo_preparacion: 5  // minutos
        };
    }
    
    // Clasificar río
    let claseRio = null;
    for (let [nombre, clase] of Object.entries(CLASES_RIOS)) {
        if (anchoRio >= clase.ancho_min && anchoRio < clase.ancho_max) {
            claseRio = clase;
            break;
        }
    }
    
    if (!claseRio) {
        return { puede: false, razon: 'Río no clasificable' };
    }
    
    // Verificar profundidad vs capacidad de vadeo
    if (profundidadRio > caps.vadeo_max) {
        // Verificar si tiene vadeo preparado (tanques)
        if (caps.vadeo_preparado && profundidadRio <= caps.vadeo_preparado) {
            return {
                puede: true,
                metodo: 'vadeo_preparado',
                velocidad_cruce: 5,
                tiempo_preparacion: 30,  // 30 min para preparar
                riesgos: ['Requiere sellado especial', 'Personal entrenado']
            };
        }
        
        return {
            puede: false,
            razon: `Profundidad ${profundidadRio}m excede capacidad ${caps.vadeo_max}m`,
            requiere: 'Puente o ferry'
        };
    }
    
    // Puede vadear
    let velocidad = 3; // km/h base
    let riesgos = [];
    
    if (claseRio.velocidad_corriente === 'rápida') {
        velocidad = 2;
        riesgos.push('Corriente rápida');
    }
    
    if (vehiculo.tipo === 'rueda' && claseRio.profundidad_media > 0.5) {
        riesgos.push('Riesgo de motor ahogado');
    }
    
    return {
        puede: true,
        metodo: 'vadeo',
        velocidad_cruce: velocidad,
        tiempo_preparacion: 5,
        riesgos: riesgos,
        clase_rio: claseRio.descripcion
    };
}

/**
 * Calcular modificador de transitabilidad para un vehículo en un punto
 */
export function calcularModificadorVehiculo(vehiculo, tipoTerreno) {
    const mods = vehiculo.modificadores;
    
    if (!mods[tipoTerreno]) {
        return 0; // Sin modificador
    }
    
    return mods[tipoTerreno];
}

/**
 * Evaluar si vehículo puede atravesar vegetación
 */
export function puedeAtravesarVegetacion(vehiculo, tipoVegetacion) {
    const impacto = IMPACTO_VEGETACION[tipoVegetacion];
    
    if (!impacto) {
        return { puede: true, modificador: 0 };
    }
    
    const tipoKey = vehiculo.traccion === 'oruga' ? 'oruga' : 
                    vehiculo.traccion === '4x4' ? 'rueda_4x4' :
                    vehiculo.traccion === '6x6' || vehiculo.traccion === '8x8' ? 'rueda_6x6' :
                    'infanteria';
    
    const modificador = impacto.modificadores[tipoKey] || 0;
    
    // Tanques pueden derribar vegetación pequeña
    if (vehiculo.id === 'tanque_batalla' && impacto.altura_media < 10) {
        return {
            puede: true,
            modificador: modificador * 0.5,  // Mitad del impacto
            puede_destruir: true
        };
    }
    
    // Si modificador muy negativo, prácticamente intransitable
    if (modificador < -0.75) {
        return {
            puede: false,
            razon: `${impacto.descripcion} demasiado denso`,
            requiere: 'Ruta alternativa o despejar área'
        };
    }
    
    return {
        puede: true,
        modificador: modificador,
        visibilidad_reducida: impacto.visibilidad_reducida,
        cobertura: impacto.cobertura,
        ocultamiento: impacto.ocultamiento
    };
}

/**
 * Evaluar impacto de suelo en vehículo
 */
export function evaluarImpactoSuelo(vehiculo, tipoSuelo, condicionesMeteo = 'seco') {
    const suelo = CARACTERISTICAS_SUELOS[tipoSuelo];
    
    if (!suelo) {
        return { transitabilidad: 1.0 };
    }
    
    const tipoKey = vehiculo.traccion === 'oruga' ? 'oruga' : 
                    vehiculo.traccion === '4x4' ? 'rueda_4x4' :
                    vehiculo.traccion === '6x6' || vehiculo.traccion === '8x8' ? 'rueda_6x6' :
                    'infanteria';
    
    // Usar modificadores por lluvia si está lloviendo
    let modificador = suelo.modificadores[tipoKey] || 0;
    
    if (condicionesMeteo === 'lluvia' && suelo.modificadores_lluvia) {
        modificador = suelo.modificadores_lluvia[tipoKey] || modificador;
    }
    
    let advertencias = [];
    
    if (suelo.daño_vehiculos) {
        advertencias.push('Daño a vehículos');
    }
    
    if (suelo.riesgo_hundimiento) {
        advertencias.push('Riesgo de hundimiento');
    }
    
    if (suelo.solo_infanteria_ligera && vehiculo.tipo !== 'infanteria') {
        return {
            puede: false,
            razon: 'Solo accesible a infantería ligera'
        };
    }
    
    return {
        puede: true,
        modificador: modificador,
        velocidad_factor: suelo.velocidad_reducida || 1.0,
        advertencias: advertencias,
        mejor_estacion: suelo.mejor_estacion,
        impacto_lluvia: suelo.impacto_lluvia
    };
}

/**
 * Calcular velocidad de marcha considerando todo
 */
export function calcularVelocidadMarcha(vehiculo, terreno, condiciones) {
    let velocidadBase = terreno.tipo === 'ruta' ? 
                        vehiculo.capacidades.velocidad_ruta :
                        vehiculo.capacidades.velocidad_campo;
    
    let factorTotal = 1.0;
    
    // Factor pendiente
    if (terreno.pendiente > vehiculo.capacidades.pendiente_max) {
        return 0; // No puede pasar
    }
    
    if (terreno.pendiente > 20) factorTotal *= 0.5;
    else if (terreno.pendiente > 10) factorTotal *= 0.7;
    else if (terreno.pendiente > 5) factorTotal *= 0.85;
    
    // Factor vegetación
    if (terreno.vegetacion) {
        const vegEval = puedeAtravesarVegetacion(vehiculo, terreno.vegetacion);
        if (!vegEval.puede) return 0;
        factorTotal *= (1 + vegEval.modificador);
    }
    
    // Factor suelo
    if (terreno.suelo) {
        const sueloEval = evaluarImpactoSuelo(vehiculo, terreno.suelo, condiciones.meteo);
        if (!sueloEval.puede) return 0;
        factorTotal *= (1 + sueloEval.modificador);
        factorTotal *= sueloEval.velocidad_factor;
    }
    
    // Factor climático
    if (condiciones.meteo === 'lluvia') factorTotal *= 0.7;
    if (condiciones.meteo === 'nieve') factorTotal *= 0.5;
    if (condiciones.meteo === 'niebla') factorTotal *= 0.8;
    
    // Factor hora del día
    if (condiciones.hora === 'noche') factorTotal *= 0.6;
    
    return Math.max(0, velocidadBase * factorTotal);
}

export default {
    TIPOS_VEHICULOS,
    CLASES_RIOS,
    CARACTERISTICAS_SUELOS,
    IMPACTO_VEGETACION,
    puedeVadearRio,
    calcularModificadorVehiculo,
    puedeAtravesarVegetacion,
    evaluarImpactoSuelo,
    calcularVelocidadMarcha
};
