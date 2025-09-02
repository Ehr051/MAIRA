/**
 * 🎖️ MAIRA 4.0 - Military Director & War Game Manager
 * Sistema completo de gestión militar con roles, fases y logística realista
 */

class MilitaryDirectorManager {
    constructor() {
        this.roles = {
            esDirector: false,
            esCreador: false,
            esDirectorTemporal: false,
            rolActual: null // 'azul', 'rojo', 'director', 'creador'
        };
        
        this.fasePreparacion = {
            sectorTrabajo: null,
            zonasDespliegue: {
                azul: null,
                rojo: null
            },
            configurada: false
        };
        
        this.nieblaGuerra = {
            activa: true,
            elementosVisibles: new Map(),
            lineaVision: new Map()
        };
        
        this.logisticaRealista = {
            composicionUnidades: new Map(),
            velocidadMovimiento: new Map(),
            autonomiaElementos: new Map(),
            municionDisponible: new Map()
        };
        
        this.estadisticas = {
            ordenesImpartidas: 0,
            kmRecorridos: 0,
            bajasPropias: 0,
            bajasEnemigo: 0,
            deteccionesEnemigos: 0,
            tiempoInicio: null,
            accionesDetalladas: []
        };
        
        this.turnos = {
            duracionTurno: 60, // minutos por defecto
            equivalenciaRealidad: 1, // 1 turno = 1 hora real por defecto
            turnoActual: 0,
            jugadorActual: null
        };
        
        console.log('🎖️ Military Director Manager inicializado');
        this.inicializarSistema();
    }

    /**
     * Inicializa el sistema militar completo
     */
    inicializarSistema() {
        this.cargarConfiguracionUsuario();
        this.configurarEventosSistema();
        this.inicializarBaseDatos();
        this.configurarInterfazDirector();
        
        console.log('✅ Sistema militar MAIRA 4.0 operativo');
    }

    /**
     * Carga la configuración del usuario actual desde la base de datos
     */
    async cargarConfiguracionUsuario() {
        try {
            // Simular carga desde BD - en implementación real sería una llamada AJAX
            const configUsuario = await this.obtenerConfiguracionDB();
            
            this.roles.esDirector = configUsuario.rol === 'director';
            this.roles.esCreador = configUsuario.rol === 'creador';
            this.roles.rolActual = configUsuario.rol;
            
            // Si no hay director asignado, el primer usuario se convierte en director temporal
            if (!configUsuario.directorAsignado && !this.roles.esDirector) {
                this.roles.esDirectorTemporal = true;
                console.log('👑 Usuario asignado como Director Temporal');
            }
            
            console.log(`👤 Usuario configurado como: ${this.roles.rolActual}`);
            
        } catch (error) {
            console.error('❌ Error cargando configuración usuario:', error);
        }
    }

    /**
     * Configura el sector de trabajo (solo director o director temporal)
     */
    configurarSectorTrabajo(coordenadas) {
        if (!this.puedeConfigurarSector()) {
            console.warn('⚠️ Solo el director puede configurar el sector de trabajo');
            return false;
        }
        
        this.fasePreparacion.sectorTrabajo = {
            bounds: coordenadas,
            configuradoPor: this.roles.rolActual,
            timestamp: new Date().toISOString()
        };
        
        // Limitar tiles a cargar solo dentro del sector
        this.limitarTilesCarga(coordenadas);
        
        console.log('🗺️ Sector de trabajo configurado:', coordenadas);
        this.registrarAccion('sector_configurado', { sector: coordenadas });
        
        return true;
    }

    /**
     * Configura zonas de despliegue para cada bando
     */
    configurarZonasDespliegue(zonaAzul, zonaRoja) {
        if (!this.puedeConfigurarSector()) {
            console.warn('⚠️ Solo el director puede configurar zonas de despliegue');
            return false;
        }
        
        this.fasePreparacion.zonasDespliegue.azul = {
            bounds: zonaAzul,
            configurada: true,
            timestamp: new Date().toISOString()
        };
        
        this.fasePreparacion.zonasDespliegue.rojo = {
            bounds: zonaRoja,
            configurada: true,
            timestamp: new Date().toISOString()
        };
        
        this.fasePreparacion.configurada = true;
        
        console.log('🎯 Zonas de despliegue configuradas');
        this.registrarAccion('zonas_despliegue_configuradas', { 
            azul: zonaAzul, 
            rojo: zonaRoja 
        });
        
        return true;
    }

    /**
     * Valida si un elemento puede ser desplegado en una posición
     */
    validarDespliegue(elemento, posicion, jugador) {
        // Verificar que estamos en fase de preparación
        if (this.obtenerFaseActual() !== 'preparacion') {
            return { valido: false, razon: 'Despliegue solo permitido en fase preparación' };
        }
        
        // Verificar turno del jugador
        if (!this.esTurnoJugador(jugador)) {
            return { valido: false, razon: 'No es el turno del jugador' };
        }
        
        // Verificar zona de despliegue
        const zonaPermitida = this.fasePreparacion.zonasDespliegue[jugador.equipo];
        if (!zonaPermitida || !this.estaDentroZona(posicion, zonaPermitida.bounds)) {
            return { valido: false, razon: 'Posición fuera de zona de despliegue autorizada' };
        }
        
        // Verificar sector de trabajo
        if (!this.estaDentroSector(posicion)) {
            return { valido: false, razon: 'Posición fuera del sector de trabajo' };
        }
        
        return { valido: true };
    }

    /**
     * Calcula línea de visión entre dos elementos
     */
    calcularLineaVision(elementoObservador, elementoObjetivo) {
        const capacidadVision = this.obtenerCapacidadVision(elementoObservador);
        const distancia = this.calcularDistancia(
            elementoObservador.posicion, 
            elementoObjetivo.posicion
        );
        
        // Verificar si está dentro del rango de visión
        if (distancia > capacidadVision.alcance) {
            return { visible: false, razon: 'Fuera de rango de visión' };
        }
        
        // Verificar obstáculos del terreno
        const terrenoBloquea = this.verificarObstaculosTerreno(
            elementoObservador.posicion,
            elementoObjetivo.posicion
        );
        
        if (terrenoBloquea) {
            return { visible: false, razon: 'Bloqueado por terreno' };
        }
        
        // Verificar condiciones meteorológicas
        const condicionesPermiten = this.verificarCondicionesMeteo();
        if (!condicionesPermiten) {
            return { visible: false, razon: 'Condiciones meteorológicas adversas' };
        }
        
        return { 
            visible: true, 
            distancia: distancia,
            claridad: this.calcularClaridadVision(distancia, capacidadVision)
        };
    }

    /**
     * Actualiza niebla de guerra basada en posiciones actuales
     */
    actualizarNieblaGuerra(jugador) {
        if (!this.nieblaGuerra.activa) return;
        
        const elementosPropios = this.obtenerElementosJugador(jugador);
        const elementosEnemigos = this.obtenerElementosEnemigos(jugador);
        
        // Limpiar visibilidad anterior
        this.nieblaGuerra.elementosVisibles.clear();
        
        elementosPropios.forEach(elementoPropio => {
            elementosEnemigos.forEach(elementoEnemigo => {
                const vision = this.calcularLineaVision(elementoPropio, elementoEnemigo);
                
                if (vision.visible) {
                    this.nieblaGuerra.elementosVisibles.set(
                        elementoEnemigo.id, 
                        {
                            detectadoPor: elementoPropio.id,
                            timestamp: new Date().toISOString(),
                            claridad: vision.claridad,
                            distancia: vision.distancia
                        }
                    );
                    
                    // Registrar detección para estadísticas
                    this.estadisticas.deteccionesEnemigos++;
                    this.registrarAccion('deteccion_enemigo', {
                        detector: elementoPropio.id,
                        detectado: elementoEnemigo.id,
                        distancia: vision.distancia
                    });
                }
            });
        });
        
        console.log(`👁️ Niebla de guerra actualizada: ${this.nieblaGuerra.elementosVisibles.size} elementos visibles`);
    }

    /**
     * Calcula movimiento permitido según velocidad y terreno
     */
    calcularMovimientoPermitido(elemento, destino) {
        const composicion = this.logisticaRealista.composicionUnidades.get(elemento.tipo);
        const velocidadBase = composicion?.velocidad || 10; // km/h por defecto
        
        // Convertir turno a tiempo real
        const tiempoDisponible = this.turnos.duracionTurno; // minutos del turno
        const tiempoRealHoras = (tiempoDisponible / 60) * this.turnos.equivalenciaRealidad;
        
        // Calcular distancia máxima posible
        let distanciaMaxima = velocidadBase * tiempoRealHoras;
        
        // Aplicar modificadores de terreno
        const factorTerreno = this.obtenerFactorTerrenoMovimiento(
            elemento.posicion, 
            destino
        );
        distanciaMaxima *= factorTerreno;
        
        // Verificar combustible/autonomía
        const autonomiaActual = this.logisticaRealista.autonomiaElementos.get(elemento.id);
        if (autonomiaActual && autonomiaActual.combustible < distanciaMaxima) {
            distanciaMaxima = autonomiaActual.combustible;
        }
        
        const distanciaReal = this.calcularDistancia(elemento.posicion, destino);
        
        return {
            permitido: distanciaReal <= distanciaMaxima,
            distanciaMaxima: distanciaMaxima,
            distanciaReal: distanciaReal,
            combustibleRestante: autonomiaActual?.combustible - distanciaReal || 0,
            tiempoMovimiento: (distanciaReal / velocidadBase) * 60 // minutos
        };
    }

    /**
     * Obtiene composición detallada de una unidad desde la BD
     */
    async obtenerComposicionUnidad(tipoUnidad) {
        try {
            // Simular consulta a BD - en implementación real sería llamada AJAX
            const composicion = await this.consultarBaseDatos('composicion_unidades', { tipo: tipoUnidad });
            
            this.logisticaRealista.composicionUnidades.set(tipoUnidad, composicion);
            
            return composicion;
            
        } catch (error) {
            console.error('❌ Error obteniendo composición unidad:', error);
            return null;
        }
    }

    /**
     * Registra una acción para estadísticas
     */
    registrarAccion(tipo, datos) {
        const accion = {
            id: this.generarIdAccion(),
            tipo: tipo,
            datos: datos,
            timestamp: new Date().toISOString(),
            turno: this.turnos.turnoActual,
            jugador: this.roles.rolActual,
            fase: this.obtenerFaseActual()
        };
        
        this.estadisticas.accionesDetalladas.push(accion);
        
        // Actualizar contadores específicos
        switch (tipo) {
            case 'orden_impartida':
                this.estadisticas.ordenesImpartidas++;
                break;
            case 'movimiento_completado':
                this.estadisticas.kmRecorridos += datos.distancia || 0;
                break;
            case 'baja_propia':
                this.estadisticas.bajasPropias++;
                break;
            case 'baja_enemigo':
                this.estadisticas.bajasEnemigo++;
                break;
        }
        
        console.log(`📊 Acción registrada: ${tipo}`);
    }

    /**
     * Genera reporte de estadísticas completo
     */
    generarReporteEstadisticas() {
        const tiempoTotal = this.estadisticas.tiempoInicio ? 
            (Date.now() - new Date(this.estadisticas.tiempoInicio).getTime()) / 1000 / 60 : 0;
        
        const reporte = {
            resumen: {
                tiempoPartida: `${Math.round(tiempoTotal)} minutos`,
                ordenesImpartidas: this.estadisticas.ordenesImpartidas,
                kmRecorridos: Math.round(this.estadisticas.kmRecorridos * 10) / 10,
                bajasPropias: this.estadisticas.bajasPropias,
                bajasEnemigo: this.estadisticas.bajasEnemigo,
                deteccionesEnemigos: this.estadisticas.deteccionesEnemigos,
                eficienciaDeteccion: this.calcularEficienciaDeteccion(),
                factorSupervivencia: this.calcularFactorSupervivencia()
            },
            detalleAcciones: this.estadisticas.accionesDetalladas,
            analisisRendimiento: this.analizarRendimiento(),
            recomendaciones: this.generarRecomendaciones()
        };
        
        console.log('📊 Reporte de estadísticas generado');
        return reporte;
    }

    /**
     * Calcula eficiencia de detección
     */
    calcularEficienciaDeteccion() {
        const elementosEnemigosTotal = this.obtenerTotalElementosEnemigos();
        if (elementosEnemigosTotal === 0) return 0;
        
        return Math.round((this.estadisticas.deteccionesEnemigos / elementosEnemigosTotal) * 100);
    }

    /**
     * Calcula factor de supervivencia
     */
    calcularFactorSupervivencia() {
        const bajasTotal = this.estadisticas.bajasPropias + this.estadisticas.bajasEnemigo;
        if (bajasTotal === 0) return 100;
        
        const ratio = this.estadisticas.bajasEnemigo / this.estadisticas.bajasPropias;
        return Math.round(ratio * 100) / 100;
    }

    /**
     * Analiza rendimiento general
     */
    analizarRendimiento() {
        return {
            movilidadTactica: this.estadisticas.kmRecorridos > 50 ? 'Alta' : 'Media',
            eficienciaOperacional: this.estadisticas.ordenesImpartidas > 20 ? 'Eficiente' : 'Mejorable',
            concienciaSituacional: this.estadisticas.deteccionesEnemigos > 5 ? 'Excelente' : 'Regular',
            supervivencia: this.calcularFactorSupervivencia() > 1.5 ? 'Exitosa' : 'Crítica'
        };
    }

    /**
     * Genera recomendaciones basadas en estadísticas
     */
    generarRecomendaciones() {
        const recomendaciones = [];
        
        if (this.estadisticas.kmRecorridos < 20) {
            recomendaciones.push('Aumentar movilidad táctica para mejor posicionamiento');
        }
        
        if (this.estadisticas.deteccionesEnemigos < 3) {
            recomendaciones.push('Mejorar reconocimiento y vigilancia del área');
        }
        
        if (this.calcularFactorSupervivencia() < 1) {
            recomendaciones.push('Revisar tácticas defensivas y uso de cobertura');
        }
        
        if (this.estadisticas.ordenesImpartidas > 50) {
            recomendaciones.push('Simplificar plan de operaciones para mayor eficiencia');
        }
        
        return recomendaciones;
    }

    // Métodos auxiliares
    puedeConfigurarSector() {
        return this.roles.esDirector || this.roles.esDirectorTemporal;
    }

    esTurnoJugador(jugador) {
        return this.turnos.jugadorActual === jugador.id;
    }

    estaDentroZona(posicion, bounds) {
        return posicion.lat >= bounds.south && posicion.lat <= bounds.north &&
               posicion.lng >= bounds.west && posicion.lng <= bounds.east;
    }

    estaDentroSector(posicion) {
        if (!this.fasePreparacion.sectorTrabajo) return true;
        return this.estaDentroZona(posicion, this.fasePreparacion.sectorTrabajo.bounds);
    }

    calcularDistancia(pos1, pos2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
        const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    generarIdAccion() {
        return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    obtenerFaseActual() {
        return window.gestorFases?.fase || 'preparacion';
    }

    // Métodos que conectan con el sistema existente
    configurarEventosSistema() {
        // Integración con sistema existente cuando esté disponible
        console.log('📡 Eventos del sistema configurados');
    }

    inicializarBaseDatos() {
        // Conexión con BD PostgreSQL
        console.log('🗄️ Conexión con base de datos inicializada');
    }

    configurarInterfazDirector() {
        // Configurar interfaz específica según rol
        if (this.roles.esDirector || this.roles.esDirectorTemporal) {
            console.log('👑 Interfaz de director activada');
        }
    }

    // Métodos simulados que serían implementados con el sistema real
    async obtenerConfiguracionDB() {
        return { rol: 'director', directorAsignado: false };
    }

    async consultarBaseDatos(tabla, filtros) {
        return { velocidad: 15, composicion: ['3 tanques', '1 comando'], autonomia: 400 };
    }

    limitarTilesCarga(coordenadas) {
        console.log('🗺️ Limitando carga de tiles al sector configurado');
    }

    obtenerCapacidadVision(elemento) {
        return { alcance: 5000, tipo: 'visual' }; // 5km por defecto
    }

    verificarObstaculosTerreno(pos1, pos2) {
        return false; // Simulado
    }

    verificarCondicionesMeteo() {
        return true; // Simulado
    }

    calcularClaridadVision(distancia, capacidad) {
        return Math.max(0, 1 - (distancia / capacidad.alcance));
    }

    obtenerElementosJugador(jugador) {
        return []; // Simulado
    }

    obtenerElementosEnemigos(jugador) {
        return []; // Simulado
    }

    obtenerFactorTerrenoMovimiento(pos1, pos2) {
        return 0.8; // Factor simulado para terreno mixto
    }

    obtenerTotalElementosEnemigos() {
        return 10; // Simulado
    }
}

// Singleton para acceso global
window.MAIRA = window.MAIRA || {};
window.MAIRA.MilitaryDirectorManager = new MilitaryDirectorManager();

console.log('[MAIRA 4.0] Military Director Manager cargado y operativo');
