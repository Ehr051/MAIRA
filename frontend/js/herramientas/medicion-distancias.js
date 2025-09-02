/**
 * 📏 MÓDULO MEDICIÓN DE DISTANCIAS - MAIRA 4.0
 * Funcionalidades específicas de medición y cálculos geográficos
 * Integrado con cálculos de marcha y optimizado para uso militar
 */

class ModuloMedicion {
    constructor() {
        this.herramientas_activas = new Map();
        this.mediciones_activas = new Map();
        this.configuracion = {
            unidad_distancia: 'kilometers', // kilometers, meters, miles
            precision_decimal: 3,
            mostrar_azimut: true,
            mostrar_elevacion: true,
            color_linea: '#ff4444',
            color_punto: '#ff0000',
            grosor_linea: 3
        };
        
        console.log('📏 ModuloMedicion inicializado');
    }

    /**
     * INICIALIZAR MÓDULO
     */
    async init() {
        try {
            await this.configurarHerramientas();
            await this.configurarEventos();
            console.log('✅ ModuloMedicion listo');
        } catch (error) {
            console.error('❌ Error inicializando ModuloMedicion:', error);
        }
    }

    /**
     * CONFIGURAR HERRAMIENTAS DE MEDICIÓN
     */
    async configurarHerramientas() {
        // Verificar dependencias
        if (typeof L === 'undefined') {
            throw new Error('Leaflet no está disponible');
        }

        // Configurar herramientas según disponibilidad
        this.herramientas_disponibles = {
            distancia_simple: {
                nombre: 'Distancia Simple',
                descripcion: 'Medición directa entre dos puntos',
                icono: '📏',
                activa: false
            },
            
            distancia_multiple: {
                nombre: 'Distancia Múltiple',
                descripcion: 'Medición con múltiples puntos de waypoint',
                icono: '📐',
                activa: false
            },
            
            area_poligono: {
                nombre: 'Área Polígono',
                descripcion: 'Medición de área de polígonos',
                icono: '⬟',
                activa: false
            },
            
            perfil_elevacion: {
                nombre: 'Perfil Elevación',
                descripcion: 'Perfil de elevación entre puntos',
                icono: '🏔️',
                activa: false
            },
            
            azimut_brujula: {
                nombre: 'Azimut y Brújula',
                descripcion: 'Cálculo de azimut y rumbo magnético',
                icono: '🧭',
                activa: false
            }
        };

        console.log('🛠️ Herramientas de medición configuradas');
    }

    /**
     * ACTIVAR HERRAMIENTA DE MEDICIÓN
     */
    async activarHerramienta(tipo) {
        try {
            // Desactivar herramientas activas
            await this.desactivarTodasHerramientas();

            console.log(`📏 Activando herramienta: ${tipo}`);

            switch (tipo) {
                case 'distancia_simple':
                    await this.activarDistanciaSimple();
                    break;
                case 'distancia_multiple':
                    await this.activarDistanciaMultiple();
                    break;
                case 'area_poligono':
                    await this.activarAreaPoligono();
                    break;
                case 'perfil_elevacion':
                    await this.activarPerfilElevacion();
                    break;
                case 'azimut_brujula':
                    await this.activarAzimutBrujula();
                    break;
                default:
                    throw new Error(`Herramienta desconocida: ${tipo}`);
            }

            this.herramientas_disponibles[tipo].activa = true;
            this.emitirEvento('herramienta-medicion-activada', { tipo });

        } catch (error) {
            console.error(`❌ Error activando herramienta ${tipo}:`, error);
            throw error;
        }
    }

    /**
     * ACTIVAR DISTANCIA SIMPLE
     */
    async activarDistanciaSimple() {
        let puntoInicio = null;
        let lineaTemporal = null;
        let marcadorInicio = null;

        const manejadorClick = (e) => {
            if (!puntoInicio) {
                // Primer click - punto inicio
                puntoInicio = e.latlng;
                marcadorInicio = L.marker(puntoInicio, {
                    icon: this.crearIconoPunto('inicio')
                }).addTo(window.mapa);

                window.mapa.getContainer().style.cursor = 'crosshair';
                
            } else {
                // Segundo click - punto final
                const puntoFinal = e.latlng;
                
                // Calcular distancia
                const distancia = this.calcularDistancia(puntoInicio, puntoFinal);
                const azimut = this.calcularAzimut(puntoInicio, puntoFinal);
                
                // Crear línea final
                const linea = L.polyline([puntoInicio, puntoFinal], {
                    color: this.configuracion.color_linea,
                    weight: this.configuracion.grosor_linea,
                    opacity: 0.8
                }).addTo(window.mapa);

                // Crear marcador final
                const marcadorFinal = L.marker(puntoFinal, {
                    icon: this.crearIconoPunto('final')
                }).addTo(window.mapa);

                // Crear popup con información
                const popup = this.crearPopupMedicion({
                    distancia: distancia,
                    azimut: azimut,
                    puntoInicio: puntoInicio,
                    puntoFinal: puntoFinal
                });

                linea.bindPopup(popup).openPopup();

                // Guardar medición
                const idMedicion = this.generarIdMedicion();
                this.mediciones_activas.set(idMedicion, {
                    tipo: 'distancia_simple',
                    elementos: [marcadorInicio, marcadorFinal, linea],
                    datos: {
                        distancia: distancia,
                        azimut: azimut,
                        puntos: [puntoInicio, puntoFinal]
                    }
                });

                // Limpiar temporal
                if (lineaTemporal) {
                    window.mapa.removeLayer(lineaTemporal);
                }

                // Resetear para nueva medición
                puntoInicio = null;
                marcadorInicio = null;
                window.mapa.getContainer().style.cursor = '';

                this.emitirEvento('medicion-completada', {
                    id: idMedicion,
                    tipo: 'distancia_simple',
                    datos: { distancia, azimut }
                });
            }
        };

        const manejadorMovimiento = (e) => {
            if (puntoInicio) {
                // Mostrar línea temporal
                if (lineaTemporal) {
                    window.mapa.removeLayer(lineaTemporal);
                }
                
                lineaTemporal = L.polyline([puntoInicio, e.latlng], {
                    color: this.configuracion.color_linea,
                    weight: 2,
                    opacity: 0.5,
                    dashArray: '5, 10'
                }).addTo(window.mapa);
            }
        };

        // Registrar eventos
        window.mapa.on('click', manejadorClick);
        window.mapa.on('mousemove', manejadorMovimiento);

        // Guardar manejadores para limpieza posterior
        this.herramientas_activas.set('distancia_simple', {
            manejadores: { click: manejadorClick, mousemove: manejadorMovimiento },
            elementos_temporales: () => {
                if (lineaTemporal) window.mapa.removeLayer(lineaTemporal);
                if (marcadorInicio) window.mapa.removeLayer(marcadorInicio);
            }
        });

        console.log('📏 Distancia simple activada - Click para comenzar medición');
    }

    /**
     * ACTIVAR DISTANCIA MÚLTIPLE
     */
    async activarDistanciaMultiple() {
        let puntos = [];
        let lineas = [];
        let marcadores = [];
        let lineaTemporal = null;

        const manejadorClick = (e) => {
            const nuevoPunto = e.latlng;
            puntos.push(nuevoPunto);

            // Crear marcador
            const marcador = L.marker(nuevoPunto, {
                icon: this.crearIconoPunto(puntos.length === 1 ? 'inicio' : 'waypoint')
            }).addTo(window.mapa);
            marcadores.push(marcador);

            // Si hay punto anterior, crear línea
            if (puntos.length > 1) {
                const puntoAnterior = puntos[puntos.length - 2];
                const linea = L.polyline([puntoAnterior, nuevoPunto], {
                    color: this.configuracion.color_linea,
                    weight: this.configuracion.grosor_linea,
                    opacity: 0.8
                }).addTo(window.mapa);
                lineas.push(linea);

                // Calcular distancia acumulativa
                const distanciaSegmento = this.calcularDistancia(puntoAnterior, nuevoPunto);
                const distanciaTotal = this.calcularDistanciaTotal(puntos);

                console.log(`📏 Segmento ${puntos.length - 1}: ${distanciaSegmento.toFixed(3)} km`);
                console.log(`📏 Total acumulado: ${distanciaTotal.toFixed(3)} km`);
            }

            this.emitirEvento('punto-agregado', {
                punto: nuevoPunto,
                numero: puntos.length,
                distancia_total: puntos.length > 1 ? this.calcularDistanciaTotal(puntos) : 0
            });
        };

        const manejadorMovimiento = (e) => {
            if (puntos.length > 0) {
                if (lineaTemporal) {
                    window.mapa.removeLayer(lineaTemporal);
                }
                
                lineaTemporal = L.polyline([puntos[puntos.length - 1], e.latlng], {
                    color: this.configuracion.color_linea,
                    weight: 2,
                    opacity: 0.5,
                    dashArray: '5, 10'
                }).addTo(window.mapa);
            }
        };

        const manejadorDobleClick = (e) => {
            // Finalizar medición con doble click
            if (puntos.length > 1) {
                // Limpiar línea temporal
                if (lineaTemporal) {
                    window.mapa.removeLayer(lineaTemporal);
                }

                // Actualizar último marcador como final
                if (marcadores.length > 0) {
                    const ultimoMarcador = marcadores[marcadores.length - 1];
                    ultimoMarcador.setIcon(this.crearIconoPunto('final'));
                }

                // Crear popup resumen
                const distanciaTotal = this.calcularDistanciaTotal(puntos);
                const popup = this.crearPopupMedicionMultiple({
                    puntos: puntos,
                    distanciaTotal: distanciaTotal,
                    segmentos: lineas.length
                });

                // Mostrar popup en el último punto
                if (lineas.length > 0) {
                    lineas[lineas.length - 1].bindPopup(popup).openPopup();
                }

                // Guardar medición
                const idMedicion = this.generarIdMedicion();
                this.mediciones_activas.set(idMedicion, {
                    tipo: 'distancia_multiple',
                    elementos: [...marcadores, ...lineas],
                    datos: {
                        puntos: puntos,
                        distanciaTotal: distanciaTotal,
                        segmentos: lineas.length
                    }
                });

                console.log(`✅ Medición múltiple completada: ${distanciaTotal.toFixed(3)} km`);
                
                this.emitirEvento('medicion-multiple-completada', {
                    id: idMedicion,
                    distancia_total: distanciaTotal,
                    puntos: puntos.length
                });
            }
        };

        // Registrar eventos
        window.mapa.on('click', manejadorClick);
        window.mapa.on('mousemove', manejadorMovimiento);
        window.mapa.on('dblclick', manejadorDobleClick);

        // Guardar manejadores
        this.herramientas_activas.set('distancia_multiple', {
            manejadores: { 
                click: manejadorClick, 
                mousemove: manejadorMovimiento, 
                dblclick: manejadorDobleClick 
            },
            elementos_temporales: () => {
                if (lineaTemporal) window.mapa.removeLayer(lineaTemporal);
            }
        });

        console.log('📐 Distancia múltiple activada - Click para agregar puntos, doble-click para finalizar');
    }

    /**
     * CALCULAR DISTANCIA ENTRE DOS PUNTOS
     */
    calcularDistancia(punto1, punto2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(punto2.lat - punto1.lat);
        const dLon = this.toRad(punto2.lng - punto1.lng);
        
        const lat1 = this.toRad(punto1.lat);
        const lat2 = this.toRad(punto2.lat);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        const distancia = R * c;
        
        // Convertir según configuración
        switch (this.configuracion.unidad_distancia) {
            case 'meters':
                return distancia * 1000;
            case 'miles':
                return distancia * 0.621371;
            default:
                return distancia;
        }
    }

    /**
     * CALCULAR AZIMUT ENTRE DOS PUNTOS
     */
    calcularAzimut(punto1, punto2) {
        const dLon = this.toRad(punto2.lng - punto1.lng);
        const lat1 = this.toRad(punto1.lat);
        const lat2 = this.toRad(punto2.lat);
        
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        
        let azimut = this.toDeg(Math.atan2(y, x));
        azimut = (azimut + 360) % 360; // Normalizar a 0-360
        
        return azimut;
    }

    /**
     * CALCULAR DISTANCIA TOTAL DE MÚLTIPLES PUNTOS
     */
    calcularDistanciaTotal(puntos) {
        let total = 0;
        for (let i = 1; i < puntos.length; i++) {
            total += this.calcularDistancia(puntos[i-1], puntos[i]);
        }
        return total;
    }

    /**
     * CREAR ICONO PARA PUNTOS
     */
    crearIconoPunto(tipo) {
        const colores = {
            inicio: '#00ff00',
            final: '#ff0000',
            waypoint: '#ffff00'
        };

        return L.divIcon({
            className: 'marcador-medicion',
            html: `<div style="
                background-color: ${colores[tipo]};
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
    }

    /**
     * CREAR POPUP DE MEDICIÓN
     */
    crearPopupMedicion(datos) {
        const unidad = this.configuracion.unidad_distancia === 'meters' ? 'm' : 
                      this.configuracion.unidad_distancia === 'miles' ? 'mi' : 'km';
        
        return `
            <div class="popup-medicion">
                <h4>📏 Medición de Distancia</h4>
                <p><strong>Distancia:</strong> ${datos.distancia.toFixed(this.configuracion.precision_decimal)} ${unidad}</p>
                ${this.configuracion.mostrar_azimut ? 
                    `<p><strong>Azimut:</strong> ${datos.azimut.toFixed(1)}°</p>` : ''}
                <hr>
                <small>
                    Inicio: ${datos.puntoInicio.lat.toFixed(6)}, ${datos.puntoInicio.lng.toFixed(6)}<br>
                    Final: ${datos.puntoFinal.lat.toFixed(6)}, ${datos.puntoFinal.lng.toFixed(6)}
                </small>
                <div class="acciones-medicion">
                    <button onclick="window.ModuloMedicion.copiarMedicion('${datos.distancia}')">📋 Copiar</button>
                    <button onclick="window.ModuloMedicion.eliminarUltimaMedicion()">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }

    /**
     * CREAR POPUP MEDICIÓN MÚLTIPLE
     */
    crearPopupMedicionMultiple(datos) {
        const unidad = this.configuracion.unidad_distancia === 'meters' ? 'm' : 
                      this.configuracion.unidad_distancia === 'miles' ? 'mi' : 'km';
        
        return `
            <div class="popup-medicion-multiple">
                <h4>📐 Medición Múltiple</h4>
                <p><strong>Distancia Total:</strong> ${datos.distanciaTotal.toFixed(this.configuracion.precision_decimal)} ${unidad}</p>
                <p><strong>Puntos:</strong> ${datos.puntos.length}</p>
                <p><strong>Segmentos:</strong> ${datos.segmentos}</p>
                <div class="acciones-medicion">
                    <button onclick="window.ModuloMedicion.copiarMedicion('${datos.distanciaTotal}')">📋 Copiar</button>
                    <button onclick="window.ModuloMedicion.eliminarUltimaMedicion()">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }

    /**
     * UTILIDADES
     */
    toRad(grados) {
        return grados * (Math.PI / 180);
    }

    toDeg(radianes) {
        return radianes * (180 / Math.PI);
    }

    generarIdMedicion() {
        return 'medicion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * DESACTIVAR TODAS LAS HERRAMIENTAS
     */
    async desactivarTodasHerramientas() {
        for (const [tipo, herramienta] of this.herramientas_activas) {
            // Limpiar eventos
            if (herramienta.manejadores) {
                for (const [evento, manejador] of Object.entries(herramienta.manejadores)) {
                    window.mapa.off(evento, manejador);
                }
            }

            // Limpiar elementos temporales
            if (herramienta.elementos_temporales) {
                herramienta.elementos_temporales();
            }

            this.herramientas_disponibles[tipo].activa = false;
        }

        this.herramientas_activas.clear();
        window.mapa.getContainer().style.cursor = '';
        
        console.log('🧹 Todas las herramientas de medición desactivadas');
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        if (window.EventBus) {
            window.EventBus.on('activar-medicion', (data) => {
                this.activarHerramienta(data.tipo);
            });

            window.EventBus.on('limpiar-mediciones', () => {
                this.limpiarTodasMediciones();
            });
        }
    }

    /**
     * MÉTODOS PÚBLICOS PARA INTERFAZ
     */
    copiarMedicion(valor) {
        navigator.clipboard.writeText(valor).then(() => {
            console.log('📋 Medición copiada al portapapeles');
        });
    }

    eliminarUltimaMedicion() {
        const mediciones = Array.from(this.mediciones_activas.keys());
        if (mediciones.length > 0) {
            const ultimaId = mediciones[mediciones.length - 1];
            this.eliminarMedicion(ultimaId);
        }
    }

    eliminarMedicion(id) {
        const medicion = this.mediciones_activas.get(id);
        if (medicion) {
            // Eliminar elementos del mapa
            medicion.elementos.forEach(elemento => {
                if (window.mapa.hasLayer(elemento)) {
                    window.mapa.removeLayer(elemento);
                }
            });

            this.mediciones_activas.delete(id);
            console.log(`🗑️ Medición eliminada: ${id}`);
        }
    }

    limpiarTodasMediciones() {
        for (const id of this.mediciones_activas.keys()) {
            this.eliminarMedicion(id);
        }
        console.log('🧹 Todas las mediciones eliminadas');
    }

    /**
     * ACTIVAR MÓDULO
     */
    async activar(opciones = {}) {
        Object.assign(this.configuracion, opciones);
        console.log('✅ ModuloMedicion activado');
    }

    /**
     * DESACTIVAR MÓDULO
     */
    async desactivar() {
        await this.desactivarTodasHerramientas();
        this.limpiarTodasMediciones();
        console.log('✅ ModuloMedicion desactivado');
    }

    /**
     * EMITIR EVENTO
     */
    emitirEvento(evento, datos) {
        if (window.EventBus) {
            window.EventBus.emit(evento, datos);
        }
    }

    /**
     * OBTENER ESTADO
     */
    obtenerEstado() {
        return {
            herramientas_disponibles: Object.keys(this.herramientas_disponibles),
            herramientas_activas: Array.from(this.herramientas_activas.keys()),
            mediciones_activas: this.mediciones_activas.size,
            configuracion: this.configuracion
        };
    }
}

// Registrar módulo globalmente
window.HerramientaModule = new ModuloMedicion();
window.ModuloMedicion = window.HerramientaModule; // Para acceso desde HTML

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloMedicion;
}

console.log('📏 ModuloMedicion disponible');
