/**
 * 🎖️ SISTEMA DE SÍMBOLOS ADAPTATIVOS - MAIRA 4.0
 * Gestiona la visualización de símbolos milsymbol según nivel de zoom:
 * - Zoom lejano: Estandartes con nombre y color
 * - Zoom medio: Símbolos milsymbol estándar
 * - Zoom cercano: Modelos 3D de vehículos (futuro)
 */

class AdaptiveSymbolManager {
    constructor() {
        this.zoomLevels = {
            LEJANO: { min: 1, max: 8 },      // Estandartes
            MEDIO: { min: 9, max: 14 },      // Milsymbol
            CERCANO: { min: 15, max: 20 }    // Modelos 3D (futuro)
        };
        
        this.simbolosActivos = new Map();
        this.estandartesActivos = new Map();
        this.gruposSimbologos = new Map();
        
        this.coloresEquipo = {
            azul: '#2563eb',
            rojo: '#dc2626',
            neutral: '#6b7280',
            director: '#059669'
        };
        
        console.log('🎖️ Adaptive Symbol Manager inicializado');
        this.inicializar();
    }

    inicializar() {
        this.configurarEventosZoom();
        this.configurarEstilos();
        this.registrarEventos();
    }

    /**
     * Configura eventos de zoom del mapa
     */
    configurarEventosZoom() {
        if (window.map) {
            window.map.on('zoomend', () => {
                this.actualizarVisualizacionPorZoom();
            });
            
            window.map.on('moveend', () => {
                this.optimizarElementosEnVista();
            });
        }
    }

    /**
     * Actualiza visualización según nivel de zoom actual
     */
    actualizarVisualizacionPorZoom() {
        const zoom = window.map ? window.map.getZoom() : 10;
        const nivelActual = this.determinarNivelZoom(zoom);
        
        console.log(`🔍 Zoom: ${zoom}, Nivel: ${nivelActual}`);
        
        switch (nivelActual) {
            case 'LEJANO':
                this.mostrarEstandartes();
                this.ocultarSimbolosMilsymbol();
                break;
            case 'MEDIO':
                this.mostrarSimbolosMilsymbol();
                this.ocultarEstandartes();
                break;
            case 'CERCANO':
                this.mostrarSimbolosMilsymbol(); // Por ahora igual que medio
                this.ocultarEstandartes();
                this.prepararModelos3D(); // Para futuro
                break;
        }
        
        this.actualizarAgrupacionElementos(nivelActual);
    }

    /**
     * Determina el nivel de zoom actual
     */
    determinarNivelZoom(zoom) {
        if (zoom >= this.zoomLevels.LEJANO.min && zoom <= this.zoomLevels.LEJANO.max) {
            return 'LEJANO';
        } else if (zoom >= this.zoomLevels.MEDIO.min && zoom <= this.zoomLevels.MEDIO.max) {
            return 'MEDIO';
        } else if (zoom >= this.zoomLevels.CERCANO.min && zoom <= this.zoomLevels.CERCANO.max) {
            return 'CERCANO';
        }
        return 'MEDIO'; // Por defecto
    }

    /**
     * Muestra estandartes para zoom lejano
     */
    mostrarEstandartes() {
        this.simbolosActivos.forEach((simbolo, elementoId) => {
            const elemento = simbolo.elemento;
            
            // Crear estandarte si no existe
            if (!this.estandartesActivos.has(elementoId)) {
                const estandarte = this.crearEstandarte(elemento);
                this.estandartesActivos.set(elementoId, estandarte);
                
                if (window.map && estandarte) {
                    estandarte.addTo(window.map);
                }
            }
        });
    }

    /**
     * Crea un estandarte para visualización lejana
     */
    crearEstandarte(elemento) {
        const color = this.obtenerColorElemento(elemento);
        const nombre = this.obtenerNombreElemento(elemento);
        const posicion = elemento.posicion || elemento.getLatLng();
        
        // HTML del estandarte
        const htmlEstandarte = `
            <div class="estandarte-militar" style="
                background: ${color};
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                border: 2px solid white;
                min-width: 60px;
                text-align: center;
                position: relative;
            ">
                <div class="nombre-elemento">${nombre}</div>
                <div class="tipo-elemento" style="font-size: 10px; opacity: 0.9;">
                    ${this.obtenerTipoElemento(elemento)}
                </div>
                <!-- Banderín -->
                <div style="
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 8px solid ${color};
                "></div>
            </div>
        `;
        
        try {
            return L.marker(posicion, {
                icon: L.divIcon({
                    html: htmlEstandarte,
                    className: 'estandarte-icon',
                    iconSize: [80, 40],
                    iconAnchor: [40, 40]
                }),
                elementoId: elemento.id,
                tipoVisualizacion: 'estandarte'
            });
        } catch (error) {
            console.error('Error creando estandarte:', error);
            return null;
        }
    }

    /**
     * Muestra símbolos milsymbol estándar
     */
    mostrarSimbolosMilsymbol() {
        this.simbolosActivos.forEach((simbolo, elementoId) => {
            const marcador = simbolo.marcador;
            if (marcador && window.map) {
                if (!window.map.hasLayer(marcador)) {
                    marcador.addTo(window.map);
                }
                
                // Ajustar tamaño según zoom
                this.ajustarTamanoSimbolo(marcador);
            }
        });
    }

    /**
     * Ajusta el tamaño del símbolo según el zoom
     */
    ajustarTamanoSimbolo(marcador) {
        if (!marcador || !marcador.options) return;
        
        const zoom = window.map ? window.map.getZoom() : 10;
        let size = 30; // Tamaño base
        
        if (zoom >= 12) size = 40;
        if (zoom >= 15) size = 50;
        if (zoom >= 18) size = 60;
        
        // Actualizar símbolo si es milsymbol
        if (marcador.options.sidc && typeof ms !== 'undefined') {
            try {
                const nuevoSimbolo = new ms.Symbol(marcador.options.sidc, { 
                    size: size,
                    frame: true,
                    fill: true,
                    strokeWidth: 2
                });
                
                const nuevoIcono = L.divIcon({
                    html: nuevoSimbolo.asSVG(),
                    className: 'military-symbol',
                    iconSize: [size + 10, size + 10],
                    iconAnchor: [size/2 + 5, size/2 + 5]
                });
                
                marcador.setIcon(nuevoIcono);
            } catch (error) {
                console.warn('Error actualizando símbolo:', error);
            }
        }
    }

    /**
     * Oculta estandartes
     */
    ocultarEstandartes() {
        this.estandartesActivos.forEach((estandarte, elementoId) => {
            if (estandarte && window.map && window.map.hasLayer(estandarte)) {
                window.map.removeLayer(estandarte);
            }
        });
    }

    /**
     * Oculta símbolos milsymbol
     */
    ocultarSimbolosMilsymbol() {
        this.simbolosActivos.forEach((simbolo, elementoId) => {
            const marcador = simbolo.marcador;
            if (marcador && window.map && window.map.hasLayer(marcador)) {
                window.map.removeLayer(marcador);
            }
        });
    }

    /**
     * Registra un nuevo elemento para gestión adaptativa
     */
    registrarElemento(elemento, marcador) {
        const elementoId = elemento.id || this.generarId();
        
        this.simbolosActivos.set(elementoId, {
            elemento: elemento,
            marcador: marcador,
            registrado: new Date().toISOString()
        });
        
        // Aplicar visualización según zoom actual
        this.actualizarVisualizacionPorZoom();
        
        console.log(`📍 Elemento registrado: ${elementoId}`);
        return elementoId;
    }

    /**
     * Desregistra un elemento
     */
    desregistrarElemento(elementoId) {
        // Remover marcador
        const simbolo = this.simbolosActivos.get(elementoId);
        if (simbolo && simbolo.marcador && window.map) {
            window.map.removeLayer(simbolo.marcador);
        }
        
        // Remover estandarte
        const estandarte = this.estandartesActivos.get(elementoId);
        if (estandarte && window.map) {
            window.map.removeLayer(estandarte);
        }
        
        this.simbolosActivos.delete(elementoId);
        this.estandartesActivos.delete(elementoId);
        
        console.log(`📍 Elemento desregistrado: ${elementoId}`);
    }

    /**
     * Actualiza posición de un elemento
     */
    actualizarPosicionElemento(elementoId, nuevaPosicion) {
        const simbolo = this.simbolosActivos.get(elementoId);
        if (simbolo && simbolo.marcador) {
            simbolo.marcador.setLatLng(nuevaPosicion);
        }
        
        const estandarte = this.estandartesActivos.get(elementoId);
        if (estandarte) {
            estandarte.setLatLng(nuevaPosicion);
        }
        
        // Actualizar datos del elemento
        if (simbolo) {
            simbolo.elemento.posicion = nuevaPosicion;
        }
    }

    /**
     * Agrupa elementos cercanos en zoom lejano
     */
    actualizarAgrupacionElementos(nivelZoom) {
        if (nivelZoom !== 'LEJANO') {
            this.limpiarGrupos();
            return;
        }
        
        // Implementar clustering de elementos cercanos
        this.crearGruposElementos();
    }

    /**
     * Crea grupos de elementos cercanos
     */
    crearGruposElementos() {
        const DISTANCIA_AGRUPACION = 1000; // 1km
        const grupos = new Map();
        
        this.simbolosActivos.forEach((simbolo, elementoId) => {
            const elemento = simbolo.elemento;
            const posicion = elemento.posicion;
            
            if (!posicion) return;
            
            // Buscar grupo existente cercano
            let grupoEncontrado = null;
            grupos.forEach((grupo, grupoId) => {
                const distancia = this.calcularDistancia(posicion, grupo.centro);
                if (distancia <= DISTANCIA_AGRUPACION) {
                    grupoEncontrado = grupoId;
                }
            });
            
            if (grupoEncontrado) {
                // Agregar al grupo existente
                grupos.get(grupoEncontrado).elementos.push(elementoId);
            } else {
                // Crear nuevo grupo
                const nuevoGrupoId = `grupo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                grupos.set(nuevoGrupoId, {
                    centro: posicion,
                    elementos: [elementoId]
                });
            }
        });
        
        this.gruposSimbologos = grupos;
        this.mostrarGrupos();
    }

    /**
     * Muestra grupos de elementos
     */
    mostrarGrupos() {
        this.gruposSimbologos.forEach((grupo, grupoId) => {
            if (grupo.elementos.length > 1) {
                this.crearMarcadorGrupo(grupoId, grupo);
                
                // Ocultar elementos individuales del grupo
                grupo.elementos.forEach(elementoId => {
                    const estandarte = this.estandartesActivos.get(elementoId);
                    if (estandarte && window.map) {
                        window.map.removeLayer(estandarte);
                    }
                });
            }
        });
    }

    /**
     * Crea marcador para grupo de elementos
     */
    crearMarcadorGrupo(grupoId, grupo) {
        const htmlGrupo = `
            <div class="grupo-elementos" style="
                background: rgba(59, 130, 246, 0.9);
                color: white;
                padding: 6px;
                border-radius: 50%;
                font-weight: bold;
                font-size: 14px;
                text-align: center;
                width: 30px;
                height: 30px;
                line-height: 18px;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
                ${grupo.elementos.length}
            </div>
        `;
        
        const marcadorGrupo = L.marker(grupo.centro, {
            icon: L.divIcon({
                html: htmlGrupo,
                className: 'grupo-icon',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            }),
            grupoId: grupoId
        });
        
        // Evento click para expandir grupo
        marcadorGrupo.on('click', () => {
            this.expandirGrupo(grupoId);
        });
        
        if (window.map) {
            marcadorGrupo.addTo(window.map);
        }
        
        grupo.marcador = marcadorGrupo;
    }

    /**
     * Expande un grupo mostrando elementos individuales
     */
    expandirGrupo(grupoId) {
        const grupo = this.gruposSimbologos.get(grupoId);
        if (!grupo) return;
        
        // Remover marcador de grupo
        if (grupo.marcador && window.map) {
            window.map.removeLayer(grupo.marcador);
        }
        
        // Mostrar elementos individuales
        grupo.elementos.forEach(elementoId => {
            const estandarte = this.estandartesActivos.get(elementoId);
            if (estandarte && window.map) {
                estandarte.addTo(window.map);
            }
        });
        
        // Remover grupo
        this.gruposSimbologos.delete(grupoId);
    }

    /**
     * Limpia todos los grupos
     */
    limpiarGrupos() {
        this.gruposSimbologos.forEach((grupo, grupoId) => {
            if (grupo.marcador && window.map) {
                window.map.removeLayer(grupo.marcador);
            }
        });
        this.gruposSimbologos.clear();
    }

    /**
     * Optimiza elementos según lo que está en vista
     */
    optimizarElementosEnVista() {
        if (!window.map) return;
        
        const bounds = window.map.getBounds();
        
        this.simbolosActivos.forEach((simbolo, elementoId) => {
            const posicion = simbolo.elemento.posicion;
            if (!posicion) return;
            
            const enVista = bounds.contains([posicion.lat, posicion.lng]);
            
            if (enVista) {
                // Asegurar que el elemento esté visible si debe estarlo
                this.asegurarVisibilidadElemento(elementoId);
            } else {
                // Ocultar elementos fuera de vista para optimizar
                this.ocultarElementoTemporalmente(elementoId);
            }
        });
    }

    /**
     * Funciones auxiliares
     */
    obtenerColorElemento(elemento) {
        const equipo = elemento.equipo || elemento.afiliacion || 'neutral';
        return this.coloresEquipo[equipo] || this.coloresEquipo.neutral;
    }

    obtenerNombreElemento(elemento) {
        return elemento.nombre || 
               elemento.designacion || 
               elemento.id || 
               'Elemento';
    }

    obtenerTipoElemento(elemento) {
        if (elemento.sidc) {
            // Interpretar SIDC para obtener tipo
            return this.interpretarSIDC(elemento.sidc);
        }
        return elemento.tipo || 'Unidad';
    }

    interpretarSIDC(sidc) {
        const tipos = {
            'I': 'Infantería',
            'A': 'Blindado',
            'R': 'Reconocimiento',
            'E': 'Ingenieros',
            'F': 'Apoyo de Fuego',
            'S': 'Apoyo',
            'H': 'Aviación'
        };
        
        const simboloPrincipal = sidc.charAt(4) || 'I';
        return tipos[simboloPrincipal] || 'Unidad';
    }

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

    generarId() {
        return `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    asegurarVisibilidadElemento(elementoId) {
        // Implementar lógica según nivel de zoom actual
        const zoom = window.map ? window.map.getZoom() : 10;
        const nivel = this.determinarNivelZoom(zoom);
        
        if (nivel === 'LEJANO') {
            const estandarte = this.estandartesActivos.get(elementoId);
            if (estandarte && window.map && !window.map.hasLayer(estandarte)) {
                estandarte.addTo(window.map);
            }
        } else {
            const simbolo = this.simbolosActivos.get(elementoId);
            if (simbolo && simbolo.marcador && window.map && !window.map.hasLayer(simbolo.marcador)) {
                simbolo.marcador.addTo(window.map);
            }
        }
    }

    ocultarElementoTemporalmente(elementoId) {
        // Ocultar tanto símbolo como estandarte para optimizar rendimiento
        const simbolo = this.simbolosActivos.get(elementoId);
        if (simbolo && simbolo.marcador && window.map) {
            window.map.removeLayer(simbolo.marcador);
        }
        
        const estandarte = this.estandartesActivos.get(elementoId);
        if (estandarte && window.map) {
            window.map.removeLayer(estandarte);
        }
    }

    prepararModelos3D() {
        // Placeholder para futura implementación de modelos 3D
        console.log('🎮 Preparando modelos 3D para zoom cercano (futuro)');
    }

    configurarEstilos() {
        // Agregar estilos CSS si no existen
        if (!document.getElementById('adaptive-symbols-styles')) {
            const style = document.createElement('style');
            style.id = 'adaptive-symbols-styles';
            style.textContent = `
                .estandarte-icon {
                    pointer-events: auto !important;
                }
                
                .estandarte-militar {
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }
                
                .estandarte-militar:hover {
                    transform: scale(1.1);
                }
                
                .grupo-icon {
                    pointer-events: auto !important;
                    cursor: pointer;
                }
                
                .grupo-elementos:hover {
                    transform: scale(1.1);
                    transition: transform 0.2s ease;
                }
                
                .military-symbol {
                    pointer-events: auto !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    registrarEventos() {
        // Registrar eventos del sistema
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.on('elemento_agregado', (data) => {
                if (data.marcador) {
                    this.registrarElemento(data.elemento, data.marcador);
                }
            });
            
            window.MAIRA.Events.on('elemento_removido', (data) => {
                this.desregistrarElemento(data.elementoId);
            });
            
            window.MAIRA.Events.on('elemento_movido', (data) => {
                this.actualizarPosicionElemento(data.elementoId, data.nuevaPosicion);
            });
        }
    }

    /**
     * Obtiene estadísticas del sistema
     */
    obtenerEstadisticas() {
        const zoom = window.map ? window.map.getZoom() : 10;
        return {
            elementosRegistrados: this.simbolosActivos.size,
            estandartesActivos: this.estandartesActivos.size,
            gruposActivos: this.gruposSimbologos.size,
            nivelZoomActual: this.determinarNivelZoom(zoom),
            zoomActual: zoom
        };
    }
}

// Singleton global
window.MAIRA = window.MAIRA || {};
window.MAIRA.AdaptiveSymbolManager = new AdaptiveSymbolManager();

console.log('[MAIRA] 🎖️ Adaptive Symbol Manager cargado - Símbolos adaptativos por zoom');
