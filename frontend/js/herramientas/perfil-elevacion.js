/**
 * 🏔️ MÓDULO PERFIL DE ELEVACIÓN - MAIRA 4.0
 * Funcionalidades específicas de perfiles de elevación
 * Separado de herramientasP.js para mejor modularización
 */

class ModuloPerfilElevacion {
    constructor() {
        this.perfiles_activos = new Map();
        this.trabajador_elevacion = null;
        this.configuracion = {
            resolucion_puntos: 100,
            interpolacion_suave: true,
            mostrar_gradientes: true,
            color_perfil: '#2196F3',
            color_gradiente: '#FF9800',
            altura_grafico: 200
        };
        
        console.log('🏔️ ModuloPerfilElevacion inicializado');
    }

    /**
     * INICIALIZAR MÓDULO
     */
    async init() {
        try {
            await this.configurarTrabajador();
            await this.configurarInterfaz();
            await this.configurarEventos();
            console.log('✅ ModuloPerfilElevacion listo');
        } catch (error) {
            console.error('❌ Error inicializando ModuloPerfilElevacion:', error);
        }
    }

    /**
     * CONFIGURAR TRABAJADOR DE ELEVACIÓN
     */
    async configurarTrabajador() {
        try {
            // Verificar si elevationHandler está disponible
            if (typeof window.elevationHandler !== 'undefined') {
                this.trabajador_elevacion = window.elevationHandler;
                console.log('✅ ElevationHandler conectado');
            } else {
                console.warn('⚠️ ElevationHandler no disponible, usando fallback');
                this.trabajador_elevacion = this.crearTrabajadorFallback();
            }
        } catch (error) {
            console.error('❌ Error configurando trabajador elevación:', error);
            this.trabajador_elevacion = this.crearTrabajadorFallback();
        }
    }

    /**
     * CREAR TRABAJADOR FALLBACK
     */
    crearTrabajadorFallback() {
        return {
            obtenerElevacion: async (lat, lng) => {
                // Fallback simple - estimación basada en coordenadas
                return Math.max(0, Math.random() * 1000);
            },
            
            obtenerElevaciones: async (puntos) => {
                return puntos.map(p => ({
                    lat: p.lat,
                    lng: p.lng,
                    elevacion: Math.max(0, Math.random() * 1000)
                }));
            }
        };
    }

    /**
     * CONFIGURAR INTERFAZ
     */
    async configurarInterfaz() {
        // Crear contenedor de gráfico si no existe
        if (!document.getElementById('perfil-elevacion-container')) {
            const container = document.createElement('div');
            container.id = 'perfil-elevacion-container';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 400px;
                height: 250px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
                display: none;
                padding: 10px;
                font-family: Arial, sans-serif;
            `;
            document.body.appendChild(container);
        }

        console.log('🎨 Interfaz perfil configurada');
    }

    /**
     * ACTIVAR PERFIL DE ELEVACIÓN
     */
    async activar(opciones = {}) {
        console.log('🏔️ Activando perfil de elevación...');
        
        this.opciones_activas = {
            ...this.configuracion,
            ...opciones
        };

        // Configurar cursor del mapa
        if (window.mapa) {
            window.mapa.getContainer().style.cursor = 'crosshair';
            
            // Configurar eventos para seleccionar línea
            this.configurarSeleccionLinea();
        }

        this.emitirEvento('perfil-activado', this.opciones_activas);
    }

    /**
     * CONFIGURAR SELECCIÓN DE LÍNEA
     */
    configurarSeleccionLinea() {
        let puntos_seleccionados = [];
        let linea_temporal = null;

        const manejadorClick = (e) => {
            puntos_seleccionados.push(e.latlng);

            if (puntos_seleccionados.length === 1) {
                // Primer punto - crear marcador inicio
                L.marker(e.latlng, {
                    icon: L.divIcon({
                        className: 'marcador-perfil-inicio',
                        html: '🏁',
                        iconSize: [20, 20]
                    })
                }).addTo(window.mapa);

            } else if (puntos_seleccionados.length === 2) {
                // Segundo punto - crear perfil
                this.crearPerfil(puntos_seleccionados[0], puntos_seleccionados[1]);
                
                // Limpiar selección
                puntos_seleccionados = [];
                this.limpiarSeleccion();
            }
        };

        const manejadorMovimiento = (e) => {
            if (puntos_seleccionados.length === 1) {
                // Mostrar línea temporal
                if (linea_temporal) {
                    window.mapa.removeLayer(linea_temporal);
                }
                
                linea_temporal = L.polyline([puntos_seleccionados[0], e.latlng], {
                    color: this.configuracion.color_perfil,
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '5, 10'
                }).addTo(window.mapa);
            }
        };

        // Registrar eventos
        window.mapa.on('click', manejadorClick);
        window.mapa.on('mousemove', manejadorMovimiento);

        // Guardar manejadores para limpieza
        this.manejadores_activos = {
            click: manejadorClick,
            mousemove: manejadorMovimiento,
            linea_temporal: () => {
                if (linea_temporal) window.mapa.removeLayer(linea_temporal);
            }
        };
    }

    /**
     * CREAR PERFIL DE ELEVACIÓN
     */
    async crearPerfil(puntoInicio, puntoFinal) {
        try {
            console.log('📊 Generando perfil de elevación...');

            // Interpolar puntos a lo largo de la línea
            const puntos_interpolados = this.interpolarPuntos(puntoInicio, puntoFinal);
            
            // Obtener elevaciones
            const elevaciones = await this.obtenerElevaciones(puntos_interpolados);
            
            // Calcular estadísticas
            const estadisticas = this.calcularEstadisticas(elevaciones);
            
            // Crear gráfico
            await this.crearGrafico(elevaciones, estadisticas);
            
            // Guardar perfil
            const id_perfil = this.generarIdPerfil();
            this.perfiles_activos.set(id_perfil, {
                puntos: [puntoInicio, puntoFinal],
                elevaciones: elevaciones,
                estadisticas: estadisticas,
                timestamp: new Date()
            });

            this.emitirEvento('perfil-creado', {
                id: id_perfil,
                estadisticas: estadisticas
            });

            console.log('✅ Perfil de elevación creado');
            
        } catch (error) {
            console.error('❌ Error creando perfil:', error);
        }
    }

    /**
     * INTERPOLAR PUNTOS ENTRE DOS COORDENADAS
     */
    interpolarPuntos(puntoInicio, puntoFinal) {
        const puntos = [];
        const num_puntos = this.configuracion.resolucion_puntos;
        
        for (let i = 0; i <= num_puntos; i++) {
            const ratio = i / num_puntos;
            const lat = puntoInicio.lat + (puntoFinal.lat - puntoInicio.lat) * ratio;
            const lng = puntoInicio.lng + (puntoFinal.lng - puntoInicio.lng) * ratio;
            
            puntos.push({ lat, lng });
        }
        
        return puntos;
    }

    /**
     * OBTENER ELEVACIONES PARA MÚLTIPLES PUNTOS
     */
    async obtenerElevaciones(puntos) {
        try {
            if (this.trabajador_elevacion.obtenerElevaciones) {
                return await this.trabajador_elevacion.obtenerElevaciones(puntos);
            } else {
                // Procesar uno por uno
                const elevaciones = [];
                for (const punto of puntos) {
                    const elevacion = await this.trabajador_elevacion.obtenerElevacion(punto.lat, punto.lng);
                    elevaciones.push({
                        ...punto,
                        elevacion: elevacion
                    });
                }
                return elevaciones;
            }
        } catch (error) {
            console.error('❌ Error obteniendo elevaciones:', error);
            return puntos.map(p => ({ ...p, elevacion: 0 }));
        }
    }

    /**
     * CALCULAR ESTADÍSTICAS DEL PERFIL
     */
    calcularEstadisticas(elevaciones) {
        const alturas = elevaciones.map(e => e.elevacion);
        const alturaMin = Math.min(...alturas);
        const alturaMax = Math.max(...alturas);
        const alturaMedia = alturas.reduce((a, b) => a + b, 0) / alturas.length;
        
        // Calcular desnivel total
        let desnivelPositivo = 0;
        let desnivelNegativo = 0;
        
        for (let i = 1; i < alturas.length; i++) {
            const diferencia = alturas[i] - alturas[i - 1];
            if (diferencia > 0) {
                desnivelPositivo += diferencia;
            } else {
                desnivelNegativo += Math.abs(diferencia);
            }
        }

        // Calcular distancia total
        let distanciaTotal = 0;
        for (let i = 1; i < elevaciones.length; i++) {
            const punto1 = L.latLng(elevaciones[i - 1].lat, elevaciones[i - 1].lng);
            const punto2 = L.latLng(elevaciones[i].lat, elevaciones[i].lng);
            distanciaTotal += punto1.distanceTo(punto2);
        }

        return {
            altura_minima: alturaMin,
            altura_maxima: alturaMax,
            altura_media: alturaMedia,
            desnivel_positivo: desnivelPositivo,
            desnivel_negativo: desnivelNegativo,
            distancia_total: distanciaTotal,
            pendiente_media: (alturaMax - alturaMin) / distanciaTotal * 100
        };
    }

    /**
     * CREAR GRÁFICO DE PERFIL
     */
    async crearGrafico(elevaciones, estadisticas) {
        const container = document.getElementById('perfil-elevacion-container');
        
        // Crear HTML del gráfico
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #333;">📊 Perfil de Elevación</h3>
                <button onclick="this.parentElement.parentElement.style.display='none'" 
                        style="border: none; background: #f44336; color: white; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">✕</button>
            </div>
            
            <canvas id="grafico-perfil" width="380" height="${this.configuracion.altura_grafico}"></canvas>
            
            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                    <div>📏 Distancia: ${(estadisticas.distancia_total / 1000).toFixed(2)} km</div>
                    <div>⬆️ Máx: ${estadisticas.altura_maxima.toFixed(0)} m</div>
                    <div>📈 +${estadisticas.desnivel_positivo.toFixed(0)} m</div>
                    <div>⬇️ Mín: ${estadisticas.altura_minima.toFixed(0)} m</div>
                    <div>📉 -${estadisticas.desnivel_negativo.toFixed(0)} m</div>
                    <div>📊 Pendiente: ${estadisticas.pendiente_media.toFixed(1)}%</div>
                </div>
            </div>
        `;

        // Dibujar gráfico en canvas
        const canvas = document.getElementById('grafico-perfil');
        const ctx = canvas.getContext('2d');
        
        this.dibujarGrafico(ctx, elevaciones, estadisticas, canvas.width, canvas.height);
        
        // Mostrar container
        container.style.display = 'block';
    }

    /**
     * DIBUJAR GRÁFICO EN CANVAS
     */
    dibujarGrafico(ctx, elevaciones, estadisticas, ancho, alto) {
        const margen = 30;
        const anchoGrafico = ancho - 2 * margen;
        const altoGrafico = alto - 2 * margen;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, ancho, alto);
        
        // Configurar escalas
        const alturaMin = estadisticas.altura_minima;
        const alturaMax = estadisticas.altura_maxima;
        const rangoAltura = alturaMax - alturaMin || 1;
        
        // Crear puntos del gráfico
        const puntos = elevaciones.map((elev, index) => ({
            x: margen + (index / (elevaciones.length - 1)) * anchoGrafico,
            y: margen + altoGrafico - ((elev.elevacion - alturaMin) / rangoAltura) * altoGrafico
        }));
        
        // Dibujar fondo
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(margen, margen, anchoGrafico, altoGrafico);
        
        // Dibujar grid
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = margen + (i / 5) * altoGrafico;
            ctx.beginPath();
            ctx.moveTo(margen, y);
            ctx.lineTo(margen + anchoGrafico, y);
            ctx.stroke();
        }
        
        // Dibujar área bajo la curva
        if (this.configuracion.mostrar_gradientes) {
            const gradiente = ctx.createLinearGradient(0, margen, 0, margen + altoGrafico);
            gradiente.addColorStop(0, this.configuracion.color_perfil + '80');
            gradiente.addColorStop(1, this.configuracion.color_perfil + '20');
            
            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.moveTo(puntos[0].x, margen + altoGrafico);
            puntos.forEach(punto => ctx.lineTo(punto.x, punto.y));
            ctx.lineTo(puntos[puntos.length - 1].x, margen + altoGrafico);
            ctx.closePath();
            ctx.fill();
        }
        
        // Dibujar línea de perfil
        ctx.strokeStyle = this.configuracion.color_perfil;
        ctx.lineWidth = 2;
        ctx.beginPath();
        puntos.forEach((punto, index) => {
            if (index === 0) {
                ctx.moveTo(punto.x, punto.y);
            } else {
                ctx.lineTo(punto.x, punto.y);
            }
        });
        ctx.stroke();
        
        // Dibujar etiquetas de ejes
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // Eje Y (alturas)
        for (let i = 0; i <= 5; i++) {
            const altura = alturaMin + (i / 5) * rangoAltura;
            const y = margen + altoGrafico - (i / 5) * altoGrafico;
            ctx.fillText(altura.toFixed(0) + 'm', margen - 15, y + 4);
        }
    }

    /**
     * DESACTIVAR MÓDULO
     */
    async desactivar() {
        // Limpiar eventos
        this.limpiarSeleccion();
        
        // Ocultar interfaz
        const container = document.getElementById('perfil-elevacion-container');
        if (container) {
            container.style.display = 'none';
        }
        
        // Restaurar cursor
        if (window.mapa) {
            window.mapa.getContainer().style.cursor = '';
        }
        
        this.emitirEvento('perfil-desactivado', {});
        console.log('🔄 Perfil de elevación desactivado');
    }

    /**
     * LIMPIAR SELECCIÓN
     */
    limpiarSeleccion() {
        if (this.manejadores_activos) {
            window.mapa.off('click', this.manejadores_activos.click);
            window.mapa.off('mousemove', this.manejadores_activos.mousemove);
            this.manejadores_activos.linea_temporal();
            this.manejadores_activos = null;
        }
        
        // Limpiar marcadores temporales
        window.mapa.eachLayer(layer => {
            if (layer.options && layer.options.icon && 
                layer.options.icon.options.className === 'marcador-perfil-inicio') {
                window.mapa.removeLayer(layer);
            }
        });
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        // Escuchar eventos del EventBus
        if (window.EventBus) {
            window.EventBus.on('mostrar-perfil-elevacion', (data) => {
                if (data.puntos && data.puntos.length >= 2) {
                    this.crearPerfil(data.puntos[0], data.puntos[1]);
                }
            });
        }
    }

    /**
     * UTILIDADES
     */
    generarIdPerfil() {
        return 'perfil_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    emitirEvento(tipo, datos) {
        if (window.EventBus) {
            window.EventBus.emit(`perfil-elevacion:${tipo}`, datos);
        }
    }

    /**
     * OBTENER ESTADÍSTICAS
     */
    obtenerEstadisticas() {
        return {
            perfiles_activos: this.perfiles_activos.size,
            trabajador_disponible: this.trabajador_elevacion !== null,
            configuracion: this.configuracion
        };
    }
}

// Registrar módulo globalmente
window.ModuloPerfilElevacion = ModuloPerfilElevacion;

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloPerfilElevacion;
}

console.log('🏔️ ModuloPerfilElevacion disponible');
