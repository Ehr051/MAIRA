/**
 * 📍 ORDEN DE MOVIMIENTO V2 - Sistema Completo con Marcha
 * 
 * FLUJO CORRECTO (Doctrina Militar):
 * 1) Graficar camino de marcha con puntos de control
 * 2) PT (Punto Terminal) = destino final
 * 3) Destino = LatLng (NO hexágono)
 * 4) Puntos intermedios: PC, PI, PD, PE, PP
 * 5) Cálculo de tiempo/distancia
 * 6) Validación de terreno
 * 
 * @extends OrdenBase
 */

class OrdenMovimientoV2 extends OrdenBase {
    constructor(config) {
        super({
            tipo: 'MOVIMIENTO',
            ...config
        });

        // 🗺️ DATOS DE MARCHA (como panelMarcha.js)
        this.origen = config.origen; // LatLng de inicio
        this.destino = config.destino; // LatLng de PT (Punto Terminal)
        this.caminoMarcha = config.caminoMarcha || []; // Array de LatLng
        this.puntosControl = config.puntosControl || []; // {tipo: 'PC'|'PI'|'PD'|'PE'|'PP', latLng, nombre}
        
        // 📊 CÁLCULOS
        this.distanciaTotal = 0; // metros
        this.tiempoEstimado = 0; // minutos
        this.velocidad = config.velocidad || 20; // km/h (infantería ~4km/h, vehículos ~20-40km/h)
        
        // 🎨 GRÁFICOS EN MAPA
        this.lineaMarcha = null; // Leaflet polyline
        this.marcadoresPuntos = []; // Leaflet markers de PC, PI, etc
        this.etiquetas = []; // Labels de puntos
        
        // 🔒 VALIDACIÓN
        this.terrenoValidado = false;
        this.obstaculosEnRuta = [];
        
        console.log(`📍 OrdenMovimientoV2 creada: ${this.unidadId} → ${this.obtenerCoordenadasDestino()}`);
    }

    /**
     * 🎯 Configurar camino de marcha completo
     */
    configurarMarcha(puntosControl, caminoCompleto) {
        this.puntosControl = puntosControl;
        this.caminoMarcha = caminoCompleto;
        
        // Calcular distancia total
        this.calcularDistanciaTotal();
        
        // Estimar tiempo
        this.calcularTiempoEstimado();
        
        console.log(`📏 Marcha configurada: ${this.distanciaTotal}m, ${this.tiempoEstimado}min`);
    }

    /**
     * 📏 Calcular distancia total de la marcha
     */
    calcularDistanciaTotal() {
        if (this.caminoMarcha.length < 2) {
            this.distanciaTotal = L.latLng(this.origen).distanceTo(L.latLng(this.destino));
            return this.distanciaTotal;
        }

        let distancia = 0;
        for (let i = 0; i < this.caminoMarcha.length - 1; i++) {
            const p1 = L.latLng(this.caminoMarcha[i]);
            const p2 = L.latLng(this.caminoMarcha[i + 1]);
            distancia += p1.distanceTo(p2);
        }

        this.distanciaTotal = distancia;
        return distancia;
    }

    /**
     * ⏱️ Calcular tiempo estimado
     */
    calcularTiempoEstimado() {
        // Distancia en km
        const distanciaKm = this.distanciaTotal / 1000;
        
        // Tiempo = distancia / velocidad (en horas)
        const tiempoHoras = distanciaKm / this.velocidad;
        
        // Convertir a minutos
        this.tiempoEstimado = Math.round(tiempoHoras * 60);
        
        return this.tiempoEstimado;
    }

    /**
     * 🎨 Graficar marcha en mapa (como panelMarcha.js)
     */
    graficarEnMapa(map) {
        if (!map) {
            console.error('❌ Mapa no disponible para graficar');
            return;
        }

        // Limpiar gráficos anteriores
        this.limpiarGraficos();

        // 1️⃣ Dibujar línea de marcha
        this.lineaMarcha = L.polyline(this.caminoMarcha, {
            color: '#00ff00',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
            smoothFactor: 1
        }).addTo(map);

        // 2️⃣ Marcar puntos de control
        this.puntosControl.forEach(punto => {
            const marker = this.crearMarcadorPuntoControl(punto);
            if (marker) {
                marker.addTo(map);
                this.marcadoresPuntos.push(marker);
            }
        });

        // 3️⃣ Marcar PT (Punto Terminal)
        const markerPT = L.marker(this.destino, {
            icon: this.crearIconoPT()
        }).addTo(map);
        
        markerPT.bindPopup(`<b>PT (Punto Terminal)</b><br>${this.unidadId}`);
        this.marcadoresPuntos.push(markerPT);

        console.log(`✅ Marcha graficada en mapa: ${this.puntosControl.length} puntos de control`);
    }

    /**
     * 🏷️ Crear marcador de punto de control (PC, PI, PD, PE, PP)
     */
    crearMarcadorPuntoControl(punto) {
        const iconHtml = `
            <div style="
                background: #ff9800;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
                ${punto.tipo}
            </div>
        `;

        const icon = L.divIcon({
            html: iconHtml,
            className: 'punto-control-icon',
            iconSize: [40, 20],
            iconAnchor: [20, 10]
        });

        const marker = L.marker(punto.latLng, { icon });
        marker.bindPopup(`<b>${punto.tipo}</b><br>${punto.nombre || 'Sin nombre'}`);

        return marker;
    }

    /**
     * 🎯 Crear ícono PT
     */
    crearIconoPT() {
        const iconHtml = `
            <div style="
                background: #4CAF50;
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 14px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ">
                PT
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'pt-icon',
            iconSize: [50, 24],
            iconAnchor: [25, 12]
        });
    }

    /**
     * 🧹 Limpiar gráficos del mapa
     */
    limpiarGraficos() {
        if (this.lineaMarcha) {
            this.lineaMarcha.remove();
            this.lineaMarcha = null;
        }

        this.marcadoresPuntos.forEach(marker => marker.remove());
        this.marcadoresPuntos = [];
    }

    /**
     * ✅ Validar terreno de la ruta
     */
    validarTerreno() {
        // TODO: Integrar con sistema de terreno
        // - Verificar obstáculos en ruta
        // - Verificar transitabilidad
        // - Verificar enemigos en zona
        
        this.terrenoValidado = true;
        return { valido: true, obstaculos: [] };
    }

    /**
     * 🎮 Ejecutar movimiento (animación)
     */
    async ejecutar() {
        console.log(`⚡ Ejecutando movimiento: ${this.unidadId}`);
        
        this.estado = 'EJECUTANDO';
        this.horaInicio = Date.now();

        // TODO: Animación de movimiento a lo largo del camino
        // - Mover unidad paso a paso por caminoMarcha
        // - Velocidad según tipo de unidad y terreno
        // - Detecciones en puntos de control

        // Simulación simple por ahora
        await this.simularMovimiento();

        this.estado = 'COMPLETADA';
        this.horaFin = Date.now();
        
        console.log(`✅ Movimiento completado: ${this.unidadId}`);
    }

    /**
     * 🎬 Simular movimiento (temporal)
     */
    async simularMovimiento() {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log(`📍 Unidad ${this.unidadId} llegó al PT`);
                resolve();
            }, 2000);
        });
    }

    /**
     * 📊 Obtener coordenadas del destino
     */
    obtenerCoordenadasDestino() {
        if (!this.destino) return 'Sin destino';
        const latlng = L.latLng(this.destino);
        return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    }

    /**
     * 📝 Serializar para guardar
     */
    toJSON() {
        return {
            ...super.toJSON(),
            origen: this.origen,
            destino: this.destino,
            caminoMarcha: this.caminoMarcha,
            puntosControl: this.puntosControl,
            distanciaTotal: this.distanciaTotal,
            tiempoEstimado: this.tiempoEstimado,
            velocidad: this.velocidad
        };
    }
}

// Exportar globalmente
window.OrdenMovimientoV2 = OrdenMovimientoV2;
console.log('✅ OrdenMovimientoV2.js cargado');
