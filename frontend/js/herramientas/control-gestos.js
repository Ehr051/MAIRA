/**
 * 🖱️ MÓDULO CONTROL DE GESTOS - MAIRA 4.0
 * Manejo de interacciones táctiles y gestos del mouse
 * Separado de herramientasP.js para mejor modularización
 */

class ModuloControlGestos {
    constructor() {
        this.gestos_activos = new Map();
        this.estado_arrastre = false;
        this.ultimo_clic = null;
        this.configuracion = {
            sensibilidad_zoom: 1.0,
            velocidad_pan: 1.0,
            tiempo_doble_clic: 300,
            distancia_tap: 5,
            habilitado: true,
            debug_gestos: false
        };

        this.eventos_registrados = new Map();
        
        console.log('🖱️ ModuloControlGestos inicializado');
    }

    /**
     * INICIALIZAR MÓDULO
     */
    async init() {
        try {
            await this.configurarDetectores();
            await this.configurarEventos();
            await this.configurarTouch();
            console.log('✅ ModuloControlGestos listo');
        } catch (error) {
            console.error('❌ Error inicializando ModuloControlGestos:', error);
        }
    }

    /**
     * CONFIGURAR DETECTORES DE GESTOS
     */
    async configurarDetectores() {
        this.detectores = {
            click: {
                nombre: 'Click Simple',
                habilitado: true,
                handler: this.manejarClick.bind(this)
            },
            
            doble_click: {
                nombre: 'Doble Click',
                habilitado: true,
                handler: this.manejarDobleClick.bind(this)
            },
            
            click_derecho: {
                nombre: 'Click Derecho',
                habilitado: true,
                handler: this.manejarClickDerecho.bind(this)
            },
            
            arrastre: {
                nombre: 'Arrastre',
                habilitado: true,
                handler: this.manejarArrastre.bind(this)
            },
            
            zoom_rueda: {
                nombre: 'Zoom con Rueda',
                habilitado: true,
                handler: this.manejarZoomRueda.bind(this)
            },
            
            touch_tap: {
                nombre: 'Touch Tap',
                habilitado: true,
                handler: this.manejarTouchTap.bind(this)
            },
            
            touch_doble_tap: {
                nombre: 'Touch Doble Tap',
                habilitado: true,
                handler: this.manejarTouchDobleTap.bind(this)
            },
            
            pinch_zoom: {
                nombre: 'Pinch Zoom',
                habilitado: true,
                handler: this.manejarPinchZoom.bind(this)
            },
            
            touch_pan: {
                nombre: 'Touch Pan',
                habilitado: true,
                handler: this.manejarTouchPan.bind(this)
            }
        };

        console.log('🎯 Detectores de gestos configurados');
    }

    /**
     * MANEJAR CLICK SIMPLE
     */
    manejarClick(evento) {
        if (!this.configuracion.habilitado) return;

        const ahora = Date.now();
        const posicion = this.obtenerPosicionEvento(evento);
        
        // Verificar si es parte de un doble click
        if (this.ultimo_clic && 
            (ahora - this.ultimo_clic.tiempo) < this.configuracion.tiempo_doble_clic &&
            this.calcularDistancia(posicion, this.ultimo_clic.posicion) < this.configuracion.distancia_tap) {
            // Es un doble click, no procesar click simple
            return;
        }

        const datos_click = {
            tipo: 'click',
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            tiempo: ahora,
            boton: evento.button || 0,
            modificadores: this.obtenerModificadores(evento)
        };

        this.ultimo_clic = {
            tiempo: ahora,
            posicion: posicion
        };

        this.emitirEvento('click', datos_click);
        this.log('👆 Click:', datos_click);
    }

    /**
     * MANEJAR DOBLE CLICK
     */
    manejarDobleClick(evento) {
        if (!this.configuracion.habilitado) return;

        const posicion = this.obtenerPosicionEvento(evento);
        const datos_doble_click = {
            tipo: 'doble_click',
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            tiempo: Date.now(),
            modificadores: this.obtenerModificadores(evento)
        };

        // Limpiar último click para evitar conflictos
        this.ultimo_clic = null;

        this.emitirEvento('doble-click', datos_doble_click);
        this.log('👆👆 Doble Click:', datos_doble_click);
    }

    /**
     * MANEJAR CLICK DERECHO
     */
    manejarClickDerecho(evento) {
        if (!this.configuracion.habilitado) return;

        evento.preventDefault();
        
        const posicion = this.obtenerPosicionEvento(evento);
        const datos_click_derecho = {
            tipo: 'click_derecho',
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            tiempo: Date.now(),
            modificadores: this.obtenerModificadores(evento)
        };

        this.emitirEvento('click-derecho', datos_click_derecho);
        this.log('👆🖱️ Click Derecho:', datos_click_derecho);
    }

    /**
     * MANEJAR ARRASTRE
     */
    manejarArrastre(evento) {
        if (!this.configuracion.habilitado) return;

        const fase = evento.type;
        const posicion = this.obtenerPosicionEvento(evento);

        switch (fase) {
            case 'mousedown':
            case 'touchstart':
                this.iniciarArrastre(posicion, evento);
                break;
                
            case 'mousemove':
            case 'touchmove':
                this.actualizarArrastre(posicion, evento);
                break;
                
            case 'mouseup':
            case 'touchend':
                this.finalizarArrastre(posicion, evento);
                break;
        }
    }

    /**
     * INICIAR ARRASTRE
     */
    iniciarArrastre(posicion, evento) {
        this.estado_arrastre = {
            activo: true,
            inicio: posicion,
            actual: posicion,
            tiempo_inicio: Date.now(),
            modificadores: this.obtenerModificadores(evento)
        };

        const datos_inicio = {
            tipo: 'arrastre_inicio',
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            tiempo: this.estado_arrastre.tiempo_inicio,
            modificadores: this.estado_arrastre.modificadores
        };

        this.emitirEvento('arrastre-inicio', datos_inicio);
        this.log('🖱️⬇️ Arrastre Inicio:', datos_inicio);
    }

    /**
     * ACTUALIZAR ARRASTRE
     */
    actualizarArrastre(posicion, evento) {
        if (!this.estado_arrastre || !this.estado_arrastre.activo) return;

        const posicion_anterior = this.estado_arrastre.actual;
        this.estado_arrastre.actual = posicion;

        const delta = {
            x: posicion.x - posicion_anterior.x,
            y: posicion.y - posicion_anterior.y
        };

        const datos_movimiento = {
            tipo: 'arrastre_movimiento',
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            delta: delta,
            distancia_total: this.calcularDistancia(posicion, this.estado_arrastre.inicio),
            tiempo: Date.now(),
            modificadores: this.obtenerModificadores(evento)
        };

        this.emitirEvento('arrastre-movimiento', datos_movimiento);
        this.log('🖱️↔️ Arrastre Movimiento:', datos_movimiento);
    }

    /**
     * FINALIZAR ARRASTRE
     */
    finalizarArrastre(posicion, evento) {
        if (!this.estado_arrastre || !this.estado_arrastre.activo) return;

        const datos_final = {
            tipo: 'arrastre_final',
            posicion_inicio: this.estado_arrastre.inicio,
            posicion_final: posicion,
            posicion_mapa_inicio: this.convertirALatLng(this.estado_arrastre.inicio),
            posicion_mapa_final: this.convertirALatLng(posicion),
            distancia_total: this.calcularDistancia(posicion, this.estado_arrastre.inicio),
            duracion: Date.now() - this.estado_arrastre.tiempo_inicio,
            modificadores: this.obtenerModificadores(evento)
        };

        this.estado_arrastre = false;

        this.emitirEvento('arrastre-final', datos_final);
        this.log('🖱️⬆️ Arrastre Final:', datos_final);
    }

    /**
     * MANEJAR ZOOM CON RUEDA
     */
    manejarZoomRueda(evento) {
        if (!this.configuracion.habilitado) return;

        evento.preventDefault();
        
        const direccion = evento.deltaY > 0 ? 'out' : 'in';
        const factor = Math.abs(evento.deltaY) * this.configuracion.sensibilidad_zoom;
        const posicion = this.obtenerPosicionEvento(evento);

        const datos_zoom = {
            tipo: 'zoom_rueda',
            direccion: direccion,
            factor: factor,
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            modificadores: this.obtenerModificadores(evento)
        };

        this.emitirEvento('zoom-rueda', datos_zoom);
        this.log('🔍 Zoom Rueda:', datos_zoom);
    }

    /**
     * CONFIGURAR EVENTOS TOUCH
     */
    async configurarTouch() {
        this.estado_touch = {
            toques_activos: new Map(),
            ultimo_tap: null,
            pinch_inicial: null
        };
    }

    /**
     * MANEJAR TOUCH TAP
     */
    manejarTouchTap(evento) {
        if (!this.configuracion.habilitado) return;

        const toque = evento.touches[0] || evento.changedTouches[0];
        const posicion = this.obtenerPosicionTouch(toque);
        const ahora = Date.now();

        // Verificar doble tap
        if (this.estado_touch.ultimo_tap &&
            (ahora - this.estado_touch.ultimo_tap.tiempo) < this.configuracion.tiempo_doble_clic &&
            this.calcularDistancia(posicion, this.estado_touch.ultimo_tap.posicion) < this.configuracion.distancia_tap) {
            
            this.manejarTouchDobleTap(evento);
            return;
        }

        const datos_tap = {
            tipo: 'touch_tap',
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            tiempo: ahora,
            fuerza: toque.force || 1.0
        };

        this.estado_touch.ultimo_tap = {
            tiempo: ahora,
            posicion: posicion
        };

        this.emitirEvento('touch-tap', datos_tap);
        this.log('👆📱 Touch Tap:', datos_tap);
    }

    /**
     * MANEJAR TOUCH DOBLE TAP
     */
    manejarTouchDobleTap(evento) {
        if (!this.configuracion.habilitado) return;

        const toque = evento.touches[0] || evento.changedTouches[0];
        const posicion = this.obtenerPosicionTouch(toque);

        const datos_doble_tap = {
            tipo: 'touch_doble_tap',
            posicion: posicion,
            posicion_mapa: this.convertirALatLng(posicion),
            tiempo: Date.now(),
            fuerza: toque.force || 1.0
        };

        // Limpiar último tap
        this.estado_touch.ultimo_tap = null;

        this.emitirEvento('touch-doble-tap', datos_doble_tap);
        this.log('👆👆📱 Touch Doble Tap:', datos_doble_tap);
    }

    /**
     * MANEJAR PINCH ZOOM
     */
    manejarPinchZoom(evento) {
        if (!this.configuracion.habilitado) return;
        if (evento.touches.length !== 2) return;

        const toque1 = evento.touches[0];
        const toque2 = evento.touches[1];
        
        const distancia_actual = this.calcularDistanciaToques(toque1, toque2);
        const centro = this.calcularCentroToques(toque1, toque2);

        if (!this.estado_touch.pinch_inicial) {
            this.estado_touch.pinch_inicial = {
                distancia: distancia_actual,
                centro: centro,
                tiempo: Date.now()
            };
            return;
        }

        const factor_zoom = distancia_actual / this.estado_touch.pinch_inicial.distancia;
        const direccion = factor_zoom > 1 ? 'in' : 'out';

        const datos_pinch = {
            tipo: 'pinch_zoom',
            factor: Math.abs(factor_zoom - 1),
            direccion: direccion,
            centro: centro,
            centro_mapa: this.convertirALatLng(centro),
            distancia_actual: distancia_actual,
            distancia_inicial: this.estado_touch.pinch_inicial.distancia
        };

        this.emitirEvento('pinch-zoom', datos_pinch);
        this.log('🤏 Pinch Zoom:', datos_pinch);
    }

    /**
     * CONFIGURAR EVENTOS DEL MAPA
     */
    configurarEventos() {
        if (!window.mapa) {
            console.warn('⚠️ Mapa no disponible para configurar eventos');
            return;
        }

        const contenedor = window.mapa.getContainer();

        // Eventos de mouse
        this.registrarEvento(contenedor, 'click', this.detectores.click.handler);
        this.registrarEvento(contenedor, 'dblclick', this.detectores.doble_click.handler);
        this.registrarEvento(contenedor, 'contextmenu', this.detectores.click_derecho.handler);
        this.registrarEvento(contenedor, 'mousedown', this.detectores.arrastre.handler);
        this.registrarEvento(contenedor, 'mousemove', this.detectores.arrastre.handler);
        this.registrarEvento(contenedor, 'mouseup', this.detectores.arrastre.handler);
        this.registrarEvento(contenedor, 'wheel', this.detectores.zoom_rueda.handler);

        // Eventos touch
        this.registrarEvento(contenedor, 'touchstart', this.detectores.touch_tap.handler);
        this.registrarEvento(contenedor, 'touchend', this.detectores.touch_tap.handler);
        this.registrarEvento(contenedor, 'touchmove', this.detectores.pinch_zoom.handler);

        console.log('🎮 Eventos de gestos configurados');
    }

    /**
     * REGISTRAR EVENTO
     */
    registrarEvento(elemento, tipo, handler) {
        elemento.addEventListener(tipo, handler);
        
        if (!this.eventos_registrados.has(elemento)) {
            this.eventos_registrados.set(elemento, new Map());
        }
        this.eventos_registrados.get(elemento).set(tipo, handler);
    }

    /**
     * UTILIDADES PARA POSICIONES
     */
    obtenerPosicionEvento(evento) {
        return {
            x: evento.clientX,
            y: evento.clientY,
            timestamp: Date.now()
        };
    }

    obtenerPosicionTouch(toque) {
        return {
            x: toque.clientX,
            y: toque.clientY,
            timestamp: Date.now()
        };
    }

    convertirALatLng(posicion) {
        if (!window.mapa) return null;
        
        const punto = L.point(posicion.x, posicion.y);
        const contenedor = window.mapa.getContainer().getBoundingClientRect();
        
        const x_relativo = posicion.x - contenedor.left;
        const y_relativo = posicion.y - contenedor.top;
        
        return window.mapa.containerPointToLatLng(L.point(x_relativo, y_relativo));
    }

    calcularDistancia(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calcularDistanciaToques(toque1, toque2) {
        const dx = toque1.clientX - toque2.clientX;
        const dy = toque1.clientY - toque2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calcularCentroToques(toque1, toque2) {
        return {
            x: (toque1.clientX + toque2.clientX) / 2,
            y: (toque1.clientY + toque2.clientY) / 2
        };
    }

    obtenerModificadores(evento) {
        return {
            ctrl: evento.ctrlKey || false,
            shift: evento.shiftKey || false,
            alt: evento.altKey || false,
            meta: evento.metaKey || false
        };
    }

    /**
     * CONTROL DEL MÓDULO
     */
    async activar(opciones = {}) {
        this.configuracion = { ...this.configuracion, ...opciones };
        this.configuracion.habilitado = true;
        
        console.log('🖱️ Módulo control de gestos activado');
        this.emitirEvento('modulo-activado', opciones);
    }

    async desactivar() {
        this.configuracion.habilitado = false;
        
        // Limpiar estado
        this.estado_arrastre = false;
        this.ultimo_clic = null;
        this.estado_touch = {
            toques_activos: new Map(),
            ultimo_tap: null,
            pinch_inicial: null
        };
        
        console.log('🔄 Módulo control de gestos desactivado');
        this.emitirEvento('modulo-desactivado', {});
    }

    /**
     * HABILITAR/DESHABILITAR DETECTORES
     */
    habilitarDetector(tipo) {
        if (this.detectores[tipo]) {
            this.detectores[tipo].habilitado = true;
            this.log(`✅ Detector habilitado: ${tipo}`);
        }
    }

    deshabilitarDetector(tipo) {
        if (this.detectores[tipo]) {
            this.detectores[tipo].habilitado = false;
            this.log(`❌ Detector deshabilitado: ${tipo}`);
        }
    }

    /**
     * LIMPIAR EVENTOS
     */
    limpiarEventos() {
        for (const [elemento, eventos] of this.eventos_registrados) {
            for (const [tipo, handler] of eventos) {
                elemento.removeEventListener(tipo, handler);
            }
        }
        this.eventos_registrados.clear();
        console.log('🧹 Eventos de gestos limpiados');
    }

    /**
     * UTILIDADES
     */
    emitirEvento(tipo, datos) {
        if (window.EventBus) {
            window.EventBus.emit(`control-gestos:${tipo}`, datos);
        }
        
        // También emitir evento genérico
        if (window.EventBus) {
            window.EventBus.emit('gesto-detectado', { tipo, datos });
        }
    }

    log(mensaje, datos = null) {
        if (this.configuracion.debug_gestos) {
            console.log(mensaje, datos);
        }
    }

    /**
     * OBTENER ESTADÍSTICAS
     */
    obtenerEstadisticas() {
        const detectores_habilitados = Object.entries(this.detectores)
            .filter(([_, detector]) => detector.habilitado)
            .map(([tipo, _]) => tipo);

        return {
            habilitado: this.configuracion.habilitado,
            detectores_habilitados,
            total_detectores: Object.keys(this.detectores).length,
            estado_arrastre: !!this.estado_arrastre,
            eventos_registrados: this.eventos_registrados.size,
            configuracion: this.configuracion
        };
    }
}

// Registrar módulo globalmente
window.ModuloControlGestos = new ModuloControlGestos();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloControlGestos;
}

console.log('🖱️ ModuloControlGestos disponible');
