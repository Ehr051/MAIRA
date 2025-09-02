/**
 * 🎨 MÓDULO HERRAMIENTAS DE DIBUJO - MAIRA 4.0
 * Funcionalidades específicas de dibujo y anotación en el mapa
 * Optimizado para uso militar con símbolos y marcadores específicos
 */

class ModuloHerramientasDibujo {
    constructor() {
        this.capas_dibujo = new Map();
        this.herramientas_activas = new Map();
        this.elementos_dibujados = new Map();
        this.configuracion = {
            color_defecto: '#ff0000',
            grosor_defecto: 3,
            opacidad_defecto: 0.8,
            color_relleno: '#ff0000',
            opacidad_relleno: 0.2,
            simbolos_militares: true,
            snap_to_grid: false,
            grid_size: 100 // metros
        };
        
        console.log('🎨 ModuloHerramientasDibujo inicializado');
    }

    /**
     * INICIALIZAR MÓDULO
     */
    async init() {
        try {
            await this.configurarCapas();
            await this.configurarHerramientas();
            await this.configurarEventos();
            console.log('✅ ModuloHerramientasDibujo listo');
        } catch (error) {
            console.error('❌ Error inicializando ModuloHerramientasDibujo:', error);
        }
    }

    /**
     * CONFIGURAR CAPAS DE DIBUJO
     */
    async configurarCapas() {
        // Crear capas organizadas por tipo
        this.capas_dibujo.set('anotaciones', L.layerGroup());
        this.capas_dibujo.set('tacticas', L.layerGroup());
        this.capas_dibujo.set('unidades', L.layerGroup());
        this.capas_dibujo.set('objetivos', L.layerGroup());
        this.capas_dibujo.set('obstaculos', L.layerGroup());
        this.capas_dibujo.set('comunicaciones', L.layerGroup());

        // Agregar capas al mapa si está disponible
        if (window.mapa) {
            this.capas_dibujo.forEach((capa, nombre) => {
                capa.addTo(window.mapa);
            });
        }

        console.log('🗂️ Capas de dibujo configuradas');
    }

    /**
     * CONFIGURAR HERRAMIENTAS DISPONIBLES
     */
    async configurarHerramientas() {
        this.herramientas_disponibles = {
            marcador: {
                nombre: 'Marcador',
                descripcion: 'Colocar marcadores simples',
                icono: '📍',
                capa: 'anotaciones',
                tipo: 'punto'
            },
            
            linea: {
                nombre: 'Línea',
                descripcion: 'Dibujar líneas y rutas',
                icono: '📏',
                capa: 'tacticas',
                tipo: 'linea'
            },
            
            poligono: {
                nombre: 'Polígono',
                descripcion: 'Dibujar áreas y zonas',
                icono: '⬟',
                capa: 'tacticas',
                tipo: 'poligono'
            },
            
            rectangulo: {
                nombre: 'Rectángulo',
                descripcion: 'Dibujar rectángulos',
                icono: '⬜',
                capa: 'objetivos',
                tipo: 'rectangulo'
            },
            
            circulo: {
                nombre: 'Círculo',
                descripción: 'Dibujar círculos y radios',
                icono: '⭕',
                capa: 'objetivos',
                tipo: 'circulo'
            },
            
            texto: {
                nombre: 'Texto',
                descripcion: 'Agregar etiquetas de texto',
                icono: '📝',
                capa: 'anotaciones',
                tipo: 'texto'
            },
            
            flecha: {
                nombre: 'Flecha',
                descripcion: 'Dibujar flechas direccionales',
                icono: '➡️',
                capa: 'tacticas',
                tipo: 'flecha'
            },
            
            simbolo_militar: {
                nombre: 'Símbolo Militar',
                descripcion: 'Colocar símbolos militares estándar',
                icono: '🎖️',
                capa: 'unidades',
                tipo: 'simbolo'
            }
        };

        console.log('🛠️ Herramientas de dibujo configuradas');
    }

    /**
     * ACTIVAR HERRAMIENTA DE DIBUJO
     */
    async activarHerramienta(tipo, opciones = {}) {
        try {
            // Desactivar herramientas activas
            await this.desactivarTodasHerramientas();

            console.log(`🎨 Activando herramienta: ${tipo}`);

            const herramienta = this.herramientas_disponibles[tipo];
            if (!herramienta) {
                throw new Error(`Herramienta desconocida: ${tipo}`);
            }

            // Configurar opciones
            const config = {
                ...this.configuracion,
                ...opciones,
                capa: herramienta.capa
            };

            switch (tipo) {
                case 'marcador':
                    await this.activarMarcador(config);
                    break;
                case 'linea':
                    await this.activarLinea(config);
                    break;
                case 'poligono':
                    await this.activarPoligono(config);
                    break;
                case 'rectangulo':
                    await this.activarRectangulo(config);
                    break;
                case 'circulo':
                    await this.activarCirculo(config);
                    break;
                case 'texto':
                    await this.activarTexto(config);
                    break;
                case 'flecha':
                    await this.activarFlecha(config);
                    break;
                case 'simbolo_militar':
                    await this.activarSimboloMilitar(config);
                    break;
                default:
                    throw new Error(`Tipo de herramienta no implementado: ${tipo}`);
            }

            this.emitirEvento('herramienta-dibujo-activada', { tipo, config });

        } catch (error) {
            console.error(`❌ Error activando herramienta ${tipo}:`, error);
            throw error;
        }
    }

    /**
     * ACTIVAR HERRAMIENTA MARCADOR
     */
    async activarMarcador(config) {
        const manejadorClick = (e) => {
            const marcador = L.marker(e.latlng, {
                draggable: true,
                icon: this.crearIconoPersonalizado(config)
            });

            // Agregar popup editable
            const popup = this.crearPopupEditable({
                tipo: 'marcador',
                posicion: e.latlng
            });
            marcador.bindPopup(popup);

            // Agregar a la capa correspondiente
            const capa = this.capas_dibujo.get(config.capa);
            marcador.addTo(capa);

            // Guardar elemento
            const id = this.generarIdElemento();
            this.elementos_dibujados.set(id, {
                tipo: 'marcador',
                elemento: marcador,
                capa: config.capa,
                propiedades: { ...config }
            });

            // Configurar eventos del marcador
            this.configurarEventosElemento(marcador, id);

            console.log(`📍 Marcador creado en: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
            
            this.emitirEvento('elemento-dibujado', {
                id: id,
                tipo: 'marcador',
                posicion: e.latlng
            });
        };

        window.mapa.on('click', manejadorClick);
        window.mapa.getContainer().style.cursor = 'crosshair';

        this.herramientas_activas.set('marcador', {
            manejadores: { click: manejadorClick },
            limpiar: () => {
                window.mapa.off('click', manejadorClick);
                window.mapa.getContainer().style.cursor = '';
            }
        });

        console.log('📍 Herramienta marcador activada - Click para colocar');
    }

    /**
     * ACTIVAR HERRAMIENTA LÍNEA
     */
    async activarLinea(config) {
        let puntos = [];
        let lineaTemporal = null;
        let marcadoresPuntos = [];

        const manejadorClick = (e) => {
            puntos.push(e.latlng);

            // Crear marcador temporal para el punto
            const marcador = L.circleMarker(e.latlng, {
                radius: 4,
                color: config.color_defecto,
                fillColor: config.color_defecto,
                fillOpacity: 1
            });
            marcadoresPuntos.push(marcador);
            marcador.addTo(window.mapa);

            // Si hay más de un punto, crear/actualizar línea
            if (puntos.length > 1) {
                if (lineaTemporal) {
                    window.mapa.removeLayer(lineaTemporal);
                }

                lineaTemporal = L.polyline(puntos, {
                    color: config.color_defecto,
                    weight: config.grosor_defecto,
                    opacity: config.opacidad_defecto
                }).addTo(window.mapa);
            }

            console.log(`📏 Punto ${puntos.length} agregado: ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
        };

        const manejadorDobleClick = (e) => {
            if (puntos.length > 1) {
                // Finalizar línea
                const lineaFinal = L.polyline(puntos, {
                    color: config.color_defecto,
                    weight: config.grosor_defecto,
                    opacity: config.opacidad_defecto
                });

                // Limpiar elementos temporales
                if (lineaTemporal) window.mapa.removeLayer(lineaTemporal);
                marcadoresPuntos.forEach(m => window.mapa.removeLayer(m));

                // Agregar línea final a la capa
                const capa = this.capas_dibujo.get(config.capa);
                lineaFinal.addTo(capa);

                // Crear popup
                const distancia = this.calcularDistanciaPolyline(puntos);
                const popup = this.crearPopupLinea({
                    distancia: distancia,
                    puntos: puntos.length,
                    tipo: 'linea'
                });
                lineaFinal.bindPopup(popup);

                // Guardar elemento
                const id = this.generarIdElemento();
                this.elementos_dibujados.set(id, {
                    tipo: 'linea',
                    elemento: lineaFinal,
                    capa: config.capa,
                    propiedades: { ...config, puntos: puntos, distancia: distancia }
                });

                this.configurarEventosElemento(lineaFinal, id);

                console.log(`📏 Línea completada: ${distancia.toFixed(3)} km, ${puntos.length} puntos`);
                
                this.emitirEvento('linea-dibujada', {
                    id: id,
                    distancia: distancia,
                    puntos: puntos.length
                });

                // Resetear para nueva línea
                puntos = [];
                lineaTemporal = null;
                marcadoresPuntos = [];
            }
        };

        window.mapa.on('click', manejadorClick);
        window.mapa.on('dblclick', manejadorDobleClick);
        window.mapa.getContainer().style.cursor = 'crosshair';

        this.herramientas_activas.set('linea', {
            manejadores: { click: manejadorClick, dblclick: manejadorDobleClick },
            limpiar: () => {
                window.mapa.off('click', manejadorClick);
                window.mapa.off('dblclick', manejadorDobleClick);
                window.mapa.getContainer().style.cursor = '';
                if (lineaTemporal) window.mapa.removeLayer(lineaTemporal);
                marcadoresPuntos.forEach(m => window.mapa.removeLayer(m));
            }
        });

        console.log('📏 Herramienta línea activada - Click para puntos, doble-click para finalizar');
    }

    /**
     * ACTIVAR HERRAMIENTA POLÍGONO
     */
    async activarPoligono(config) {
        let puntos = [];
        let poligonoTemporal = null;
        let marcadoresPuntos = [];

        const manejadorClick = (e) => {
            puntos.push(e.latlng);

            // Crear marcador temporal
            const marcador = L.circleMarker(e.latlng, {
                radius: 4,
                color: config.color_defecto,
                fillColor: config.color_defecto,
                fillOpacity: 1
            });
            marcadoresPuntos.push(marcador);
            marcador.addTo(window.mapa);

            // Si hay más de 2 puntos, crear/actualizar polígono
            if (puntos.length > 2) {
                if (poligonoTemporal) {
                    window.mapa.removeLayer(poligonoTemporal);
                }

                poligonoTemporal = L.polygon(puntos, {
                    color: config.color_defecto,
                    weight: config.grosor_defecto,
                    opacity: config.opacidad_defecto,
                    fillColor: config.color_relleno,
                    fillOpacity: config.opacidad_relleno
                }).addTo(window.mapa);
            }

            console.log(`⬟ Punto ${puntos.length} agregado al polígono`);
        };

        const manejadorDobleClick = (e) => {
            if (puntos.length > 2) {
                // Finalizar polígono
                const poligonoFinal = L.polygon(puntos, {
                    color: config.color_defecto,
                    weight: config.grosor_defecto,
                    opacity: config.opacidad_defecto,
                    fillColor: config.color_relleno,
                    fillOpacity: config.opacidad_relleno
                });

                // Limpiar elementos temporales
                if (poligonoTemporal) window.mapa.removeLayer(poligonoTemporal);
                marcadoresPuntos.forEach(m => window.mapa.removeLayer(m));

                // Agregar a la capa
                const capa = this.capas_dibujo.get(config.capa);
                poligonoFinal.addTo(capa);

                // Calcular área
                const area = this.calcularAreaPoligono(puntos);
                const perimetro = this.calcularPerimetroPoligono(puntos);

                // Crear popup
                const popup = this.crearPopupPoligono({
                    area: area,
                    perimetro: perimetro,
                    puntos: puntos.length,
                    tipo: 'poligono'
                });
                poligonoFinal.bindPopup(popup);

                // Guardar elemento
                const id = this.generarIdElemento();
                this.elementos_dibujados.set(id, {
                    tipo: 'poligono',
                    elemento: poligonoFinal,
                    capa: config.capa,
                    propiedades: { ...config, puntos: puntos, area: area, perimetro: perimetro }
                });

                this.configurarEventosElemento(poligonoFinal, id);

                console.log(`⬟ Polígono completado: ${area.toFixed(3)} km², ${puntos.length} puntos`);
                
                this.emitirEvento('poligono-dibujado', {
                    id: id,
                    area: area,
                    perimetro: perimetro,
                    puntos: puntos.length
                });

                // Resetear
                puntos = [];
                poligonoTemporal = null;
                marcadoresPuntos = [];
            }
        };

        window.mapa.on('click', manejadorClick);
        window.mapa.on('dblclick', manejadorDobleClick);
        window.mapa.getContainer().style.cursor = 'crosshair';

        this.herramientas_activas.set('poligono', {
            manejadores: { click: manejadorClick, dblclick: manejadorDobleClick },
            limpiar: () => {
                window.mapa.off('click', manejadorClick);
                window.mapa.off('dblclick', manejadorDobleClick);
                window.mapa.getContainer().style.cursor = '';
                if (poligonoTemporal) window.mapa.removeLayer(poligonoTemporal);
                marcadoresPuntos.forEach(m => window.mapa.removeLayer(m));
            }
        });

        console.log('⬟ Herramienta polígono activada - Click para puntos, doble-click para finalizar');
    }

    /**
     * CREAR ICONO PERSONALIZADO
     */
    crearIconoPersonalizado(config) {
        return L.divIcon({
            className: 'marcador-personalizado',
            html: `<div style="
                background-color: ${config.color_defecto};
                width: 20px;
                height: 20px;
                border-radius: 50% 50% 50% 0;
                border: 2px solid #fff;
                transform: rotate(-45deg);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 20],
            popupAnchor: [0, -20]
        });
    }

    /**
     * CREAR POPUP EDITABLE
     */
    crearPopupEditable(datos) {
        const id = this.generarIdElemento();
        return `
            <div class="popup-elemento-dibujo">
                <h4>📍 ${datos.tipo.charAt(0).toUpperCase() + datos.tipo.slice(1)}</h4>
                <div class="campo-edicion">
                    <label>Título:</label>
                    <input type="text" id="titulo_${id}" placeholder="Ingrese título..." onchange="window.ModuloHerramientasDibujo.actualizarTitulo('${id}', this.value)">
                </div>
                <div class="campo-edicion">
                    <label>Descripción:</label>
                    <textarea id="desc_${id}" placeholder="Ingrese descripción..." onchange="window.ModuloHerramientasDibujo.actualizarDescripcion('${id}', this.value)"></textarea>
                </div>
                <div class="coordenadas">
                    <small>Lat: ${datos.posicion.lat.toFixed(6)}, Lng: ${datos.posicion.lng.toFixed(6)}</small>
                </div>
                <div class="acciones-elemento">
                    <button onclick="window.ModuloHerramientasDibujo.editarElemento('${id}')">✏️ Editar</button>
                    <button onclick="window.ModuloHerramientasDibujo.eliminarElemento('${id}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }

    /**
     * CONFIGURAR EVENTOS DE ELEMENTO
     */
    configurarEventosElemento(elemento, id) {
        elemento.on('dragend', (e) => {
            console.log(`📍 Elemento ${id} movido a nueva posición`);
            this.emitirEvento('elemento-movido', { id: id, nueva_posicion: e.target.getLatLng() });
        });

        elemento.on('click', (e) => {
            console.log(`📍 Elemento ${id} seleccionado`);
            this.emitirEvento('elemento-seleccionado', { id: id });
        });
    }

    /**
     * MÉTODOS DE CÁLCULO
     */
    calcularDistanciaPolyline(puntos) {
        let distancia = 0;
        for (let i = 1; i < puntos.length; i++) {
            distancia += this.calcularDistancia(puntos[i-1], puntos[i]);
        }
        return distancia;
    }

    calcularDistancia(punto1, punto2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(punto2.lat - punto1.lat);
        const dLon = this.toRad(punto2.lng - punto1.lng);
        
        const lat1 = this.toRad(punto1.lat);
        const lat2 = this.toRad(punto2.lat);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }

    calcularAreaPoligono(puntos) {
        // Usar fórmula de Shoelace para área aproximada
        let area = 0;
        const n = puntos.length;
        
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += puntos[i].lng * puntos[j].lat;
            area -= puntos[j].lng * puntos[i].lat;
        }
        
        area = Math.abs(area) / 2.0;
        
        // Convertir a km² (aproximado)
        const kmPerDegree = 111.32; // km por grado (aproximado)
        return area * kmPerDegree * kmPerDegree;
    }

    calcularPerimetroPoligono(puntos) {
        let perimetro = 0;
        for (let i = 0; i < puntos.length; i++) {
            const siguiente = (i + 1) % puntos.length;
            perimetro += this.calcularDistancia(puntos[i], puntos[siguiente]);
        }
        return perimetro;
    }

    toRad(grados) {
        return grados * (Math.PI / 180);
    }

    generarIdElemento() {
        return 'elemento_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * MÉTODOS PÚBLICOS PARA INTERFAZ
     */
    actualizarTitulo(id, titulo) {
        const elemento = this.elementos_dibujados.get(id);
        if (elemento) {
            elemento.propiedades.titulo = titulo;
            console.log(`📝 Título actualizado para ${id}: ${titulo}`);
        }
    }

    actualizarDescripcion(id, descripcion) {
        const elemento = this.elementos_dibujados.get(id);
        if (elemento) {
            elemento.propiedades.descripcion = descripcion;
            console.log(`📝 Descripción actualizada para ${id}`);
        }
    }

    editarElemento(id) {
        console.log(`✏️ Editando elemento: ${id}`);
        // Implementar lógica de edición específica
    }

    eliminarElemento(id) {
        const elemento = this.elementos_dibujados.get(id);
        if (elemento) {
            const capa = this.capas_dibujo.get(elemento.capa);
            if (capa.hasLayer(elemento.elemento)) {
                capa.removeLayer(elemento.elemento);
            }
            this.elementos_dibujados.delete(id);
            console.log(`🗑️ Elemento eliminado: ${id}`);
            
            this.emitirEvento('elemento-eliminado', { id: id });
        }
    }

    /**
     * DESACTIVAR TODAS LAS HERRAMIENTAS
     */
    async desactivarTodasHerramientas() {
        for (const [tipo, herramienta] of this.herramientas_activas) {
            if (herramienta.limpiar) {
                herramienta.limpiar();
            }
        }
        this.herramientas_activas.clear();
        console.log('🧹 Todas las herramientas de dibujo desactivadas');
    }

    /**
     * CONFIGURAR EVENTOS
     */
    configurarEventos() {
        if (window.EventBus) {
            window.EventBus.on('activar-dibujo', (data) => {
                this.activarHerramienta(data.tipo, data.opciones);
            });

            window.EventBus.on('limpiar-dibujos', () => {
                this.limpiarTodosElementos();
            });

            window.EventBus.on('mostrar-capa', (data) => {
                this.mostrarCapa(data.capa);
            });

            window.EventBus.on('ocultar-capa', (data) => {
                this.ocultarCapa(data.capa);
            });
        }
    }

    /**
     * GESTIÓN DE CAPAS
     */
    mostrarCapa(nombre) {
        const capa = this.capas_dibujo.get(nombre);
        if (capa && window.mapa) {
            if (!window.mapa.hasLayer(capa)) {
                capa.addTo(window.mapa);
            }
            console.log(`👁️ Capa '${nombre}' mostrada`);
        }
    }

    ocultarCapa(nombre) {
        const capa = this.capas_dibujo.get(nombre);
        if (capa && window.mapa) {
            if (window.mapa.hasLayer(capa)) {
                window.mapa.removeLayer(capa);
            }
            console.log(`🙈 Capa '${nombre}' oculta`);
        }
    }

    limpiarTodosElementos() {
        this.capas_dibujo.forEach((capa, nombre) => {
            capa.clearLayers();
        });
        this.elementos_dibujados.clear();
        console.log('🧹 Todos los elementos de dibujo eliminados');
    }

    /**
     * ACTIVAR MÓDULO
     */
    async activar(opciones = {}) {
        Object.assign(this.configuracion, opciones);
        console.log('✅ ModuloHerramientasDibujo activado');
    }

    /**
     * DESACTIVAR MÓDULO
     */
    async desactivar() {
        await this.desactivarTodasHerramientas();
        console.log('✅ ModuloHerramientasDibujo desactivado');
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
            elementos_dibujados: this.elementos_dibujados.size,
            capas_activas: Array.from(this.capas_dibujo.keys()),
            configuracion: this.configuracion
        };
    }
}

// Registrar módulo globalmente
window.HerramientaModule = new ModuloHerramientasDibujo();
window.ModuloHerramientasDibujo = window.HerramientaModule; // Para acceso desde HTML

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloHerramientasDibujo;
}

console.log('🎨 ModuloHerramientasDibujo disponible');
