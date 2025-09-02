/**
 * 🎖️ MAIRA Advanced Gaming Director
 * Sistema completo de dirección y control de ejercicios militares
 * Incluye roles de director, creador, preparación, niebla de guerra, etc.
 */

class AdvancedGamingDirector {
    constructor() {
        this.roles = {
            esDirector: false,
            esCreador: false,
            listo: false,
            temporalDirector: false
        };
        
        this.fasePreparacion = {
            sectorTrabajo: null,
            zonasDespliegue: {
                azul: null,
                rojo: null
            },
            tilesLimitadas: [],
            configurada: false
        };
        
        this.nieblaGuerra = {
            activa: true,
            elementosVisibles: new Map(),
            lineaVision: new Map(),
            rangoDeteccion: new Map()
        };
        
        this.elementosDB = new Map(); // Datos de elementos desde BD
        this.estadisticasPartida = {
            ordenesImpartidas: 0,
            kmRecorridos: 0,
            bajasPropias: 0,
            bajasEnemigo: 0,
            deteccionesEnemigas: 0,
            inicioPartida: null,
            finPartida: null
        };
        
        this.configuracionTempo = {
            turnoEquivaleA: 'hora', // 'hora', 'minuto'
            duracionPartida: 30, // minutos reales
            equivalenciaRealidad: 0 // calculado
        };
        
        console.log('🎖️ Advanced Gaming Director inicializado');
        this.inicializarSistema();
    }

    /**
     * Inicializa el sistema completo
     */
    inicializarSistema() {
        this.configurarRoles();
        this.inicializarFasePreparacion();
        this.configurarNieblaGuerra();
        this.cargarDatosElementosDB();
        this.configurarEstadisticas();
        
        console.log('✅ Sistema de dirección avanzada activo');
    }

    /**
     * Configura roles de usuario (director, creador, etc.)
     */
    configurarRoles() {
        // Detectar rol del usuario actual
        const usuario = window.usuarioActual || {};
        
        this.roles.esDirector = usuario.rol === 'director';
        this.roles.esCreador = usuario.esCreador === true;
        this.roles.listo = false; // Se marca cuando termina preparación
        
        // Si no hay director, el creador actúa como director temporal
        if (!this.roles.esDirector && this.roles.esCreador) {
            this.roles.temporalDirector = true;
            console.log('👑 Creador actuando como director temporal');
        }
        
        console.log('🎭 Roles configurados:', this.roles);
    }

    /**
     * Inicializa la fase de preparación
     */
    inicializarFasePreparacion() {
        if (!this.puedeConfigurarPreparacion()) {
            console.log('⏳ Esperando director para configurar preparación');
            return;
        }
        
        this.configurarSectorTrabajo();
        this.configurarZonasDespliegue();
        this.limitarTilesCarga();
        
        console.log('🎯 Fase de preparación configurada');
    }

    /**
     * Verifica si el usuario puede configurar la preparación
     */
    puedeConfigurarPreparacion() {
        return this.roles.esDirector || this.roles.temporalDirector;
    }

    /**
     * Configura el sector de trabajo (límites del escenario)
     */
    configurarSectorTrabajo() {
        // En implementación real, esto se haría con interfaz de mapa
        // Por ahora simulamos configuración
        
        this.fasePreparacion.sectorTrabajo = {
            norte: -34.0, // Coordenadas límite Argentina
            sur: -35.0,
            este: -58.0,
            oeste: -59.0,
            configuradoPor: window.usuarioActual?.username || 'director',
            timestamp: new Date().toISOString()
        };
        
        console.log('🗺️ Sector de trabajo configurado:', this.fasePreparacion.sectorTrabajo);
        this.limitarElementosASector();
    }

    /**
     * Limita elementos al sector de trabajo
     */
    limitarElementosASector() {
        // Interceptar funciones de colocación de elementos
        const originalAgregarMarcador = window.agregarMarcador;
        
        if (originalAgregarMarcador) {
            window.agregarMarcador = (sidc, descripcion, coordenadas) => {
                if (!this.coordenadasEnSector(coordenadas)) {
                    console.warn('⚠️ Elemento fuera del sector de trabajo');
                    this.mostrarAlertaSector();
                    return false;
                }
                
                return originalAgregarMarcador.call(this, sidc, descripcion, coordenadas);
            };
        }
    }

    /**
     * Verifica si coordenadas están dentro del sector
     */
    coordenadasEnSector(coordenadas) {
        if (!this.fasePreparacion.sectorTrabajo || !coordenadas) return true;
        
        const sector = this.fasePreparacion.sectorTrabajo;
        return (
            coordenadas.lat >= sector.sur &&
            coordenadas.lat <= sector.norte &&
            coordenadas.lng >= sector.oeste &&
            coordenadas.lng <= sector.este
        );
    }

    /**
     * Configura zonas de despliegue para cada bando
     */
    configurarZonasDespliegue() {
        // Zonas donde cada bando puede desplegar inicialmente
        this.fasePreparacion.zonasDespliegue = {
            azul: {
                norte: -34.2,
                sur: -34.5,
                este: -58.2,
                oeste: -58.5,
                configurada: true
            },
            rojo: {
                norte: -34.6,
                sur: -34.9,
                este: -58.6,
                oeste: -58.9,
                configurada: true
            }
        };
        
        console.log('🎯 Zonas de despliegue configuradas');
        this.aplicarRestriccionesDespliegue();
    }

    /**
     * Aplica restricciones de despliegue por bando
     */
    aplicarRestriccionesDespliegue() {
        // Verificar que cada bando solo despliegue en su zona
        const originalMoverElemento = window.moverElemento;
        
        if (originalMoverElemento) {
            window.moverElemento = (elemento, destino) => {
                const bandoUsuario = this.obtenerBandoUsuario();
                const zonaPermitida = this.fasePreparacion.zonasDespliegue[bandoUsuario];
                
                if (zonaPermitida && !this.coordenadasEnZona(destino, zonaPermitida)) {
                    console.warn(`⚠️ ${bandoUsuario} no puede desplegar fuera de su zona`);
                    this.mostrarAlertaZona(bandoUsuario);
                    return false;
                }
                
                // Registrar estadística
                this.registrarMovimiento(elemento, destino);
                
                return originalMoverElemento.call(this, elemento, destino);
            };
        }
    }

    /**
     * Verifica si coordenadas están en zona permitida
     */
    coordenadasEnZona(coordenadas, zona) {
        if (!zona || !coordenadas) return true;
        
        return (
            coordenadas.lat >= zona.sur &&
            coordenadas.lat <= zona.norte &&
            coordenadas.lng >= zona.oeste &&
            coordenadas.lng <= zona.este
        );
    }

    /**
     * Obtiene el bando del usuario actual
     */
    obtenerBandoUsuario() {
        const usuario = window.usuarioActual || {};
        return usuario.equipo || usuario.rol || 'sin_equipo';
    }

    /**
     * Limita tiles a cargar según sector de trabajo
     */
    limitarTilesCarga() {
        if (!this.fasePreparacion.sectorTrabajo) return;
        
        const sector = this.fasePreparacion.sectorTrabajo;
        
        // Calcular tiles necesarias para el sector
        this.fasePreparacion.tilesLimitadas = this.calcularTilesNecesarias(sector);
        
        console.log(`🗺️ Limitando carga a ${this.fasePreparacion.tilesLimitadas.length} tiles`);
    }

    /**
     * Calcula tiles necesarias para un sector
     */
    calcularTilesNecesarias(sector) {
        // Implementación simplificada - en realidad calcularía tiles específicas
        const tiles = [];
        
        // Ejemplo de cálculo de tiles por coordenadas
        const latRange = Math.abs(sector.norte - sector.sur);
        const lngRange = Math.abs(sector.este - sector.oeste);
        
        for (let lat = sector.sur; lat <= sector.norte; lat += latRange / 10) {
            for (let lng = sector.oeste; lng <= sector.este; lng += lngRange / 10) {
                tiles.push({
                    lat: lat,
                    lng: lng,
                    zoom: 12 // Zoom base
                });
            }
        }
        
        return tiles;
    }

    /**
     * Configura sistema de niebla de guerra
     */
    configurarNieblaGuerra() {
        this.nieblaGuerra.activa = true;
        
        // Interceptar visualización de elementos enemigos
        this.configurarDeteccionEnemigos();
        this.configurarLineaVision();
        
        console.log('🌫️ Niebla de guerra configurada');
    }

    /**
     * Configura detección de elementos enemigos
     */
    configurarDeteccionEnemigos() {
        // Solo mostrar enemigos si están en línea de visión
        const originalMostrarElemento = window.mostrarElemento;
        
        if (originalMostrarElemento) {
            window.mostrarElemento = (elemento) => {
                if (this.esElementoEnemigo(elemento)) {
                    if (!this.elementoEnLineaVision(elemento)) {
                        // No mostrar elemento enemigo
                        return false;
                    } else {
                        // Registrar detección
                        this.registrarDeteccionEnemiga(elemento);
                    }
                }
                
                return originalMostrarElemento.call(this, elemento);
            };
        }
    }

    /**
     * Verifica si elemento es enemigo
     */
    esElementoEnemigo(elemento) {
        const bandoUsuario = this.obtenerBandoUsuario();
        const bandoElemento = elemento.bando || elemento.equipo;
        
        return bandoElemento !== bandoUsuario && bandoElemento !== 'neutral';
    }

    /**
     * Verifica si elemento está en línea de visión
     */
    elementoEnLineaVision(elemento) {
        const elementosPropios = this.obtenerElementosPropios();
        
        // Verificar si algún elemento propio puede ver al enemigo
        return elementosPropios.some(elementoPropio => {
            return this.calcularLineaVision(elementoPropio, elemento);
        });
    }

    /**
     * Calcula línea de visión entre dos elementos
     */
    calcularLineaVision(observador, objetivo) {
        const distancia = this.calcularDistancia(
            observador.coordenadas, 
            objetivo.coordenadas
        );
        
        const rangoVision = this.obtenerRangoVision(observador);
        
        // Verificar obstáculos del terreno (simplificado)
        const tieneObstaculos = this.verificarObstaculosTerreno(
            observador.coordenadas,
            objetivo.coordenadas
        );
        
        return distancia <= rangoVision && !tieneObstaculos;
    }

    /**
     * Obtiene rango de visión de un elemento según sus características
     */
    obtenerRangoVision(elemento) {
        const datosDB = this.elementosDB.get(elemento.tipo) || {};
        
        // Rangos base por tipo (en km)
        const rangosBase = {
            'infanteria': 2,
            'reconocimiento': 5,
            'blindado': 3,
            'artilleria': 1,
            'comando': 4
        };
        
        return datosDB.rangoVision || rangosBase[elemento.tipo] || 2;
    }

    /**
     * Carga datos de elementos desde base de datos
     */
    async cargarDatosElementosDB() {
        // En implementación real, esto vendría de la BD
        // Por ahora simulamos datos
        
        const elementosTipo = [
            {
                tipo: 'escuadron_tanques',
                composicion: {
                    secciones: 3,
                    puestoComando: 1,
                    tanquesPorSeccion: 3
                },
                personal: 36,
                vehiculos: 10,
                autonomia: 400, // km
                municion: {
                    principal: 120,
                    secundaria: 3000
                },
                velocidad: 35, // km/h campo traviesa
                velocidadTurno: 35, // km por turno (1 hora)
                rangoVision: 3,
                alcanceAtaque: 2.5
            },
            {
                tipo: 'compania_infanteria',
                composicion: {
                    pelotones: 3,
                    puestoComando: 1,
                    escuadrasPorPeloton: 3
                },
                personal: 120,
                vehiculos: 12,
                autonomia: 200,
                municion: {
                    individual: 300,
                    apoyo: 150
                },
                velocidad: 4, // km/h a pie
                velocidadTurno: 4,
                rangoVision: 2,
                alcanceAtaque: 0.5
            },
            {
                tipo: 'bateria_artilleria',
                composicion: {
                    piezas: 6,
                    puestoComando: 1,
                    observadores: 2
                },
                personal: 48,
                vehiculos: 8,
                autonomia: 300,
                municion: {
                    proyectiles: 480
                },
                velocidad: 25,
                velocidadTurno: 25,
                rangoVision: 1,
                alcanceAtaque: 15
            }
        ];
        
        elementosTipo.forEach(elemento => {
            this.elementosDB.set(elemento.tipo, elemento);
        });
        
        console.log(`📊 ${this.elementosDB.size} tipos de elementos cargados desde BD`);
    }

    /**
     * Configura equivalencia temporal de turnos
     */
    configurarEquivalenciaTemporal() {
        const config = this.configuracionTempo;
        
        if (config.turnoEquivaleA === 'minuto') {
            // Si partida dura 30 min y cada turno = 1 min real
            // Entonces 30 turnos = 30 horas de combate simulado
            config.equivalenciaRealidad = config.duracionPartida; // horas simuladas
        } else {
            // Si cada turno = 1 hora real de combate
            config.equivalenciaRealidad = config.duracionPartida / 60; // fracción de hora
        }
        
        console.log(`⏰ Configuración temporal: ${config.duracionPartida} min = ${config.equivalenciaRealidad} horas simuladas`);
    }

    /**
     * Calcula velocidad de movimiento por turno
     */
    calcularVelocidadPorTurno(elemento) {
        const datosDB = this.elementosDB.get(elemento.tipo) || {};
        const velocidadBase = datosDB.velocidadTurno || 10;
        
        // Factores que afectan velocidad
        const factorTerreno = this.obtenerFactorTerreno(elemento.coordenadas);
        const factorVegetacion = this.obtenerFactorVegetacion(elemento.coordenadas);
        const factorRelieve = this.obtenerFactorRelieve(elemento.coordenadas);
        
        const velocidadFinal = velocidadBase * factorTerreno * factorVegetacion * factorRelieve;
        
        return Math.max(velocidadFinal, 1); // Mínimo 1 km por turno
    }

    /**
     * Registra movimiento para estadísticas
     */
    registrarMovimiento(elemento, destino) {
        const distancia = this.calcularDistancia(elemento.coordenadas, destino);
        this.estadisticasPartida.kmRecorridos += distancia;
        
        console.log(`📊 Movimiento registrado: ${distancia.toFixed(2)} km`);
    }

    /**
     * Registra detección enemiga
     */
    registrarDeteccionEnemiga(elemento) {
        this.estadisticasPartida.deteccionesEnemigas++;
        
        console.log(`👁️ Detección enemiga registrada: ${elemento.tipo}`);
    }

    /**
     * Registra orden/acción impartida
     */
    registrarOrden(tipo, datos) {
        this.estadisticasPartida.ordenesImpartidas++;
        
        // Log detallado de la orden
        console.log(`📋 Orden registrada: ${tipo}`, datos);
    }

    /**
     * Obtiene información completa de un elemento
     */
    obtenerInformacionElemento(elemento) {
        const datosDB = this.elementosDB.get(elemento.tipo) || {};
        
        return {
            identificacion: {
                tipo: elemento.tipo,
                denominacion: elemento.denominacion || 'Sin denominación',
                bando: elemento.bando
            },
            composicion: datosDB.composicion || {},
            personal: {
                total: datosDB.personal || 0,
                bajas: elemento.bajas || 0,
                efectivos: (datosDB.personal || 0) - (elemento.bajas || 0)
            },
            vehiculos: {
                total: datosDB.vehiculos || 0,
                operativos: datosDB.vehiculos - (elemento.vehiculosDañados || 0)
            },
            logistica: {
                autonomia: datosDB.autonomia || 0,
                combustibleRestante: elemento.combustible || 100, // %
                municion: {
                    ...datosDB.municion,
                    restante: elemento.municionRestante || 100 // %
                }
            },
            capacidades: {
                velocidadMaxima: datosDB.velocidad || 0,
                velocidadActual: this.calcularVelocidadPorTurno(elemento),
                rangoVision: datosDB.rangoVision || 0,
                alcanceAtaque: datosDB.alcanceAtaque || 0
            },
            estado: {
                moral: elemento.moral || 100,
                fatiga: elemento.fatiga || 0,
                operativo: elemento.operativo !== false
            }
        };
    }

    /**
     * Genera estadísticas finales de la partida
     */
    generarEstadisticasFinales() {
        const duracion = this.estadisticasPartida.finPartida - this.estadisticasPartida.inicioPartida;
        
        const estadisticas = {
            resumenGeneral: {
                duracionPartida: duracion / 1000 / 60, // minutos
                ordenesTotales: this.estadisticasPartida.ordenesImpartidas,
                distanciaTotal: this.estadisticasPartida.kmRecorridos,
                deteccionesRealizadas: this.estadisticasPartida.deteccionesEnemigas
            },
            rendimientoTactico: {
                ordenesPromedioTurno: this.estadisticasPartida.ordenesImpartidas / this.obtenerTotalTurnos(),
                kmPromedioTurno: this.estadisticasPartida.kmRecorridos / this.obtenerTotalTurnos(),
                eficienciaDeteccion: this.calcularEficienciaDeteccion()
            },
            bajas: {
                propias: this.estadisticasPartida.bajasPropias,
                enemigas: this.estadisticasPartida.bajasEnemigo,
                ratio: this.estadisticasPartida.bajasEnemigo / Math.max(this.estadisticasPartida.bajasPropias, 1)
            },
            evaluacionPlan: {
                cumplimientoObjetivos: this.evaluarCumplimientoObjetivos(),
                adaptabilidad: this.evaluarAdaptabilidad(),
                liderazgo: this.evaluarLiderazgo()
            }
        };
        
        console.log('📊 ESTADÍSTICAS FINALES DE PARTIDA:');
        console.log(JSON.stringify(estadisticas, null, 2));
        
        return estadisticas;
    }

    /**
     * Muestra alerta de sector
     */
    mostrarAlertaSector() {
        // En implementación real, mostraría alerta visual
        console.warn('🚫 ELEMENTO FUERA DEL SECTOR DE TRABAJO');
    }

    /**
     * Muestra alerta de zona
     */
    mostrarAlertaZona(bando) {
        console.warn(`🚫 ${bando.toUpperCase()} NO PUEDE DESPLEGAR FUERA DE SU ZONA`);
    }

    // Métodos auxiliares simplificados
    calcularDistancia(coord1, coord2) {
        const R = 6371;
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    obtenerFactorTerreno(coordenadas) { return 1.0; }
    obtenerFactorVegetacion(coordenadas) { return 0.9; }
    obtenerFactorRelieve(coordenadas) { return 0.95; }
    obtenerElementosPropios() { return []; }
    verificarObstaculosTerreno(origen, destino) { return false; }
    obtenerTotalTurnos() { return 10; }
    calcularEficienciaDeteccion() { return 0.75; }
    evaluarCumplimientoObjetivos() { return 0.8; }
    evaluarAdaptabilidad() { return 0.7; }
    evaluarLiderazgo() { return 0.85; }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.AdvancedGamingDirector = new AdvancedGamingDirector();

console.log('[MAIRA] Advanced Gaming Director cargado - Sistema completo activo');
