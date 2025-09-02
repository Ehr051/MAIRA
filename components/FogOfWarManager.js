/**
 * 🌫️ FOG OF WAR MANAGER - MAIRA 4.0
 * Sistema avanzado de niebla de guerra que considera:
 * - Perfil del terreno (elevación)
 * - Vegetación (tipo, altura, densidad)
 * - Capacidades de observación de cada elemento
 * - Condiciones meteorológicas
 * - Línea de visión realista
 */

class FogOfWarManager {
    constructor() {
        this.elementosVisibles = new Map(); // Por jugador
        this.cacheLinesVision = new Map();
        this.condicionesMeteo = {
            visibilidad: 'buena', // buena, regular, mala
            precipitacion: false,
            niebla: false,
            viento: 'leve'
        };
        
        console.log('🌫️ Fog of War Manager inicializado');
        this.inicializar();
    }

    inicializar() {
        this.configurarEventosTerreno();
        this.configurarCapacidadesVision();
        this.inicializarCacheVision();
    }

    /**
     * Configura capacidades de visión por tipo de elemento
     */
    configurarCapacidadesVision() {
        this.capacidadesVision = {
            // Infantería
            'infanteria': {
                alcance: 2000, // 2km
                tipo: 'visual',
                factorElevacion: 1.2,
                factorVegetacion: 0.7
            },
            // Blindados
            'tanque': {
                alcance: 3000, // 3km
                tipo: 'visual+optico',
                factorElevacion: 1.3,
                factorVegetacion: 0.8
            },
            // Reconocimiento
            'reconocimiento': {
                alcance: 5000, // 5km
                tipo: 'optico+electronico',
                factorElevacion: 1.5,
                factorVegetacion: 0.9
            },
            // Observadores adelantados
            'observador': {
                alcance: 8000, // 8km
                tipo: 'optico+laser',
                factorElevacion: 1.8,
                factorVegetacion: 1.0
            },
            // Radar
            'radar': {
                alcance: 15000, // 15km
                tipo: 'electronico',
                factorElevacion: 1.0, // No afectado por terreno
                factorVegetacion: 1.0 // No afectado por vegetación
            },
            // Aviación
            'helicoptero': {
                alcance: 10000, // 10km
                tipo: 'aereo',
                factorElevacion: 2.0, // Ventaja altura
                factorVegetacion: 1.2
            }
        };
    }

    /**
     * Calcula visibilidad entre dos elementos
     */
    async calcularVisibilidad(observador, objetivo) {
        const cacheKey = `${observador.id}-${objetivo.id}-${observador.posicion.lat}-${observador.posicion.lng}`;
        
        // Verificar cache
        if (this.cacheLinesVision.has(cacheKey)) {
            return this.cacheLinesVision.get(cacheKey);
        }

        const resultado = await this.calcularLineaVisionCompleta(observador, objetivo);
        
        // Guardar en cache por 30 segundos
        this.cacheLinesVision.set(cacheKey, resultado);
        setTimeout(() => this.cacheLinesVision.delete(cacheKey), 30000);
        
        return resultado;
    }

    /**
     * Cálculo completo de línea de visión
     */
    async calcularLineaVisionCompleta(observador, objetivo) {
        try {
            // 1. Obtener capacidades del observador
            const capacidades = this.obtenerCapacidadesElemento(observador);
            
            // 2. Calcular distancia
            const distancia = this.calcularDistancia(observador.posicion, objetivo.posicion);
            
            // 3. Verificar rango máximo
            if (distancia > capacidades.alcance) {
                return {
                    visible: false,
                    razon: 'Fuera de rango',
                    distancia: distancia,
                    claridad: 0
                };
            }

            // 4. Obtener puntos intermedios para análisis de terreno
            const puntosRuta = this.generarPuntosRuta(observador.posicion, objetivo.posicion, 50);
            
            // 5. Analizar elevación del terreno
            const perfilElevacion = await this.obtenerPerfilElevacion(puntosRuta);
            const terrenoBloquea = this.verificarBloqueoPorElevacion(
                observador.posicion, 
                objetivo.posicion, 
                perfilElevacion
            );

            if (terrenoBloquea.bloqueado) {
                return {
                    visible: false,
                    razon: 'Bloqueado por terreno',
                    distancia: distancia,
                    claridad: 0,
                    detalles: terrenoBloquea
                };
            }

            // 6. Analizar vegetación
            const vegetacionRuta = await this.obtenerVegetacionRuta(puntosRuta);
            const factorVegetacion = this.calcularFactorVegetacion(vegetacionRuta, capacidades);

            // 7. Aplicar condiciones meteorológicas
            const factorMeteo = this.calcularFactorMeteorologico(distancia);

            // 8. Calcular claridad final
            const claridadBase = Math.max(0, 1 - (distancia / capacidades.alcance));
            const claridadFinal = claridadBase * factorVegetacion * factorMeteo;

            return {
                visible: claridadFinal > 0.1, // Umbral mínimo de visibilidad
                distancia: distancia,
                claridad: Math.round(claridadFinal * 100) / 100,
                factores: {
                    vegetacion: factorVegetacion,
                    meteorologia: factorMeteo,
                    terreno: terrenoBloquea.factor || 1.0
                },
                razon: claridadFinal > 0.5 ? 'Visión clara' : 
                       claridadFinal > 0.3 ? 'Visión parcial' : 
                       claridadFinal > 0.1 ? 'Visión difícil' : 'No visible'
            };

        } catch (error) {
            console.error('Error calculando visibilidad:', error);
            return {
                visible: false,
                razon: 'Error de cálculo',
                distancia: 0,
                claridad: 0
            };
        }
    }

    /**
     * Obtiene capacidades de un elemento
     */
    obtenerCapacidadesElemento(elemento) {
        const tipoBase = this.determinarTipoElemento(elemento);
        const capacidadesBase = this.capacidadesVision[tipoBase] || this.capacidadesVision['infanteria'];
        
        // Aplicar modificadores por elevación del observador
        const factorElevacion = this.calcularFactorElevacion(elemento.posicion);
        
        return {
            ...capacidadesBase,
            alcance: capacidadesBase.alcance * factorElevacion
        };
    }

    /**
     * Determina tipo de elemento para capacidades
     */
    determinarTipoElemento(elemento) {
        const sidc = elemento.sidc || elemento.tipo || '';
        
        if (sidc.includes('I') || elemento.tipo?.includes('infanteria')) return 'infanteria';
        if (sidc.includes('A') || elemento.tipo?.includes('blindado')) return 'tanque';
        if (sidc.includes('R') || elemento.tipo?.includes('reconocimiento')) return 'reconocimiento';
        if (sidc.includes('O') || elemento.tipo?.includes('observador')) return 'observador';
        if (sidc.includes('S') || elemento.tipo?.includes('radar')) return 'radar';
        if (sidc.includes('H') || elemento.tipo?.includes('helicoptero')) return 'helicoptero';
        
        return 'infanteria'; // Por defecto
    }

    /**
     * Genera puntos intermedios en la ruta
     */
    generarPuntosRuta(origen, destino, numPuntos = 50) {
        const puntos = [];
        const latStep = (destino.lat - origen.lat) / numPuntos;
        const lngStep = (destino.lng - origen.lng) / numPuntos;
        
        for (let i = 0; i <= numPuntos; i++) {
            puntos.push({
                lat: origen.lat + (latStep * i),
                lng: origen.lng + (lngStep * i)
            });
        }
        
        return puntos;
    }

    /**
     * Obtiene perfil de elevación a lo largo de la ruta
     */
    async obtenerPerfilElevacion(puntos) {
        const elevaciones = [];
        
        for (const punto of puntos) {
            try {
                // Integración con sistema de elevación existente
                const elevacion = await window.elevationHandler?.obtenerElevacionEnPunto?.(punto.lat, punto.lng);
                elevaciones.push({
                    posicion: punto,
                    elevacion: elevacion || 0
                });
            } catch (error) {
                elevaciones.push({
                    posicion: punto,
                    elevacion: 0
                });
            }
        }
        
        return elevaciones;
    }

    /**
     * Verifica si el terreno bloquea la línea de visión
     */
    verificarBloqueoPorElevacion(origen, destino, perfilElevacion) {
        if (perfilElevacion.length < 3) {
            return { bloqueado: false, factor: 1.0 };
        }

        const elevOrigen = perfilElevacion[0].elevacion;
        const elevDestino = perfilElevacion[perfilElevacion.length - 1].elevacion;
        
        // Calcular línea de visión directa
        const distanciaTotal = this.calcularDistancia(origen, destino);
        
        for (let i = 1; i < perfilElevacion.length - 1; i++) {
            const puntoActual = perfilElevacion[i];
            const distanciaParcial = this.calcularDistancia(origen, puntoActual.posicion);
            const proporcion = distanciaParcial / distanciaTotal;
            
            // Altura esperada en línea recta
            const alturaEsperada = elevOrigen + (elevDestino - elevOrigen) * proporcion;
            
            // Si el terreno está por encima de la línea de visión + margen
            const margenVisión = 5; // 5 metros de margen
            if (puntoActual.elevacion > alturaEsperada + margenVisión) {
                return {
                    bloqueado: true,
                    puntoBloqueo: puntoActual.posicion,
                    elevacionBloqueo: puntoActual.elevacion,
                    factor: 0
                };
            }
        }
        
        return { bloqueado: false, factor: 1.0 };
    }

    /**
     * Obtiene vegetación a lo largo de la ruta
     */
    async obtenerVegetacionRuta(puntos) {
        const vegetaciones = [];
        
        // Muestrear cada 10 puntos para optimizar
        const puntosVegetacion = puntos.filter((_, index) => index % 10 === 0);
        
        for (const punto of puntosVegetacion) {
            try {
                const vegetacion = await window.vegetacionHandler?.obtenerVegetacionEnPunto?.(punto.lat, punto.lng);
                if (vegetacion) {
                    vegetaciones.push(vegetacion);
                }
            } catch (error) {
                console.warn('Error obteniendo vegetación:', error);
            }
        }
        
        return vegetaciones;
    }

    /**
     * Calcula factor de reducción por vegetación
     */
    calcularFactorVegetacion(vegetacionRuta, capacidades) {
        if (vegetacionRuta.length === 0) return 1.0;
        
        let factorTotal = 1.0;
        const factorBase = capacidades.factorVegetacion || 0.8;
        
        vegetacionRuta.forEach(veg => {
            switch (veg.tipo) {
                case 'Bosque denso':
                    factorTotal *= factorBase * 0.3;
                    break;
                case 'Bosque poco denso':
                    factorTotal *= factorBase * 0.6;
                    break;
                case 'Pradera o arbustos':
                    factorTotal *= factorBase * 0.8;
                    break;
                case 'Vegetación escasa':
                    factorTotal *= factorBase * 0.9;
                    break;
                default:
                    factorTotal *= factorBase;
            }
        });
        
        return Math.max(0.1, factorTotal); // Mínimo 10% de visibilidad
    }

    /**
     * Calcula factor meteorológico
     */
    calcularFactorMeteorologico(distancia) {
        let factor = 1.0;
        
        // Aplicar condiciones meteorológicas
        switch (this.condicionesMeteo.visibilidad) {
            case 'mala':
                factor *= 0.5;
                break;
            case 'regular':
                factor *= 0.7;
                break;
            case 'buena':
                factor *= 1.0;
                break;
        }
        
        if (this.condicionesMeteo.precipitacion) {
            factor *= 0.6;
        }
        
        if (this.condicionesMeteo.niebla) {
            factor *= 0.3;
        }
        
        // Reducir visibilidad con la distancia
        const factorDistancia = Math.max(0.3, 1 - (distancia / 20000)); // 20km máximo
        factor *= factorDistancia;
        
        return Math.max(0.1, factor);
    }

    /**
     * Calcula factor de elevación para el observador
     */
    calcularFactorElevacion(posicion) {
        // Por cada 100m de elevación, +20% de alcance
        const elevacion = posicion.elevacion || 0;
        return 1 + (elevacion / 500); // Factor de 1.0 a 2.0+
    }

    /**
     * Actualiza elementos visibles para un jugador
     */
    async actualizarVisibilidadJugador(jugadorId) {
        const elementosJugador = this.obtenerElementosJugador(jugadorId);
        const elementosEnemigos = this.obtenerElementosEnemigos(jugadorId);
        
        const visibles = new Set();
        
        for (const observador of elementosJugador) {
            for (const objetivo of elementosEnemigos) {
                const visibilidad = await this.calcularVisibilidad(observador, objetivo);
                
                if (visibilidad.visible) {
                    visibles.add(objetivo.id);
                    
                    // Registrar detección para estadísticas
                    this.registrarDeteccion(jugadorId, observador, objetivo, visibilidad);
                }
            }
        }
        
        this.elementosVisibles.set(jugadorId, visibles);
        
        // Emitir evento de actualización
        this.emitirEventoVisibilidad(jugadorId, visibles);
        
        return visibles;
    }

    /**
     * Verifica si un elemento es visible para un jugador
     */
    esElementoVisible(jugadorId, elementoId) {
        const visibles = this.elementosVisibles.get(jugadorId);
        return visibles ? visibles.has(elementoId) : false;
    }

    /**
     * Configura condiciones meteorológicas
     */
    configurarCondicionesMeteorologicas(condiciones) {
        this.condicionesMeteo = { ...this.condicionesMeteo, ...condiciones };
        
        // Limpiar cache de visión al cambiar condiciones
        this.cacheLinesVision.clear();
        
        console.log('🌤️ Condiciones meteorológicas actualizadas:', this.condicionesMeteo);
    }

    /**
     * Funciones auxiliares y simuladas
     */
    calcularDistancia(pos1, pos2) {
        const R = 6371000; // Radio de la Tierra en metros
        const lat1Rad = pos1.lat * Math.PI / 180;
        const lat2Rad = pos2.lat * Math.PI / 180;
        const deltaLat = (pos2.lat - pos1.lat) * Math.PI / 180;
        const deltaLng = (pos2.lng - pos1.lng) * Math.PI / 180;

        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    obtenerElementosJugador(jugadorId) {
        // Integración con sistema existente
        return window.gestorJuego?.obtenerElementosJugador?.(jugadorId) || [];
    }

    obtenerElementosEnemigos(jugadorId) {
        // Integración con sistema existente
        return window.gestorJuego?.obtenerElementosEnemigos?.(jugadorId) || [];
    }

    registrarDeteccion(jugadorId, observador, objetivo, visibilidad) {
        // Integración con sistema de estadísticas
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('elemento_detectado', {
                jugador: jugadorId,
                observador: observador.id,
                objetivo: objetivo.id,
                distancia: visibilidad.distancia,
                claridad: visibilidad.claridad,
                timestamp: new Date().toISOString()
            });
        }
    }

    emitirEventoVisibilidad(jugadorId, elementosVisibles) {
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('visibilidad_actualizada', {
                jugador: jugadorId,
                elementosVisibles: Array.from(elementosVisibles),
                timestamp: new Date().toISOString()
            });
        }
    }

    configurarEventosTerreno() {
        // Escuchar cambios en el mapa para actualizar visibilidad
        if (window.map) {
            window.map.on('zoomend moveend', () => {
                this.cacheLinesVision.clear();
            });
        }
    }

    inicializarCacheVision() {
        // Limpiar cache cada 5 minutos
        setInterval(() => {
            this.cacheLinesVision.clear();
            console.log('🧹 Cache de líneas de visión limpiado');
        }, 5 * 60 * 1000);
    }

    /**
     * Obtiene estadísticas de fog of war
     */
    obtenerEstadisticas() {
        return {
            elementosVisible: this.elementosVisibles.size,
            lineasVisionCalculadas: this.cacheLinesVision.size,
            condicionesMeteo: this.condicionesMeteo,
            capacidadesTipos: Object.keys(this.capacidadesVision).length
        };
    }
}

// Singleton global
window.MAIRA = window.MAIRA || {};
window.MAIRA.FogOfWarManager = new FogOfWarManager();

console.log('[MAIRA] 🌫️ Fog of War Manager cargado - Sistema avanzado con terreno y vegetación');
