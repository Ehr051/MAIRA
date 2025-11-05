/**
 * 🗺️ PATHFINDING A* - Sistema de rutas sobre HexGrid
 * Parte del Sistema de Órdenes V2 para Juego de Guerra
 *
 * Implementa el algoritmo A* para calcular rutas óptimas
 * considerando costos de terreno y obstáculos
 */

class Pathfinding {
    constructor(hexGrid) {
        this.hexGrid = hexGrid;
        this.cache = new Map(); // Cache de rutas calculadas
        this.maxCacheSize = 100;
    }

    /**
     * Calcula la ruta óptima entre dos hexágonos
     * @param {Object} hexInicio - Hexágono de origen {q, r, s}
     * @param {Object} hexDestino - Hexágono de destino {q, r, s}
     * @param {String} tipoUnidad - Tipo de unidad (afecta costos)
     * @param {Object} opciones - Opciones adicionales
     * @returns {Array} Array de hexágonos que forman la ruta
     */
    async calcularRuta(hexInicio, hexDestino, tipoUnidad = 'infanteria', opciones = {}) {
        // Verificar entrada
        if (!hexInicio || !hexDestino) {
            console.error('Pathfinding: hexágonos inválidos', { hexInicio, hexDestino });
            return null;
        }

        // Verificar cache
        const cacheKey = this.getCacheKey(hexInicio, hexDestino, tipoUnidad);
        if (this.cache.has(cacheKey)) {
            console.log('✅ Ruta recuperada de cache');
            return this.cache.get(cacheKey);
        }

        // Configuración
        const config = {
            maxIteraciones: opciones.maxIteraciones || 1000,
            considerarTerreno: opciones.considerarTerreno !== false,
            evitarEnemigos: opciones.evitarEnemigos !== false,
            ...opciones
        };

        // Algoritmo A*
        const ruta = await this.aStar(hexInicio, hexDestino, tipoUnidad, config);

        // Guardar en cache si es válida
        if (ruta && ruta.length > 0) {
            this.guardarEnCache(cacheKey, ruta);
        }

        return ruta;
    }

    /**
     * Implementación del algoritmo A*
     */
    async aStar(inicio, destino, tipoUnidad, config) {
        // Conjuntos de nodos
        const abiertos = new Map(); // Nodos por explorar
        const cerrados = new Set(); // Nodos ya explorados
        const nodosPadre = new Map(); // Para reconstruir el camino
        const costoG = new Map(); // Costo desde inicio
        const costoF = new Map(); // Costo total estimado (g + h)

        // Nodo inicial
        const inicioKey = this.hexToKey(inicio);
        abiertos.set(inicioKey, inicio);
        costoG.set(inicioKey, 0);
        costoF.set(inicioKey, this.heuristica(inicio, destino));

        let iteraciones = 0;

        while (abiertos.size > 0 && iteraciones < config.maxIteraciones) {
            iteraciones++;

            // Obtener nodo con menor F
            const actualKey = this.obtenerMenorF(abiertos, costoF);
            const actual = abiertos.get(actualKey);

            // ¿Llegamos al destino?
            if (this.sonIguales(actual, destino)) {
                console.log(`✅ Ruta encontrada en ${iteraciones} iteraciones`);
                return this.reconstruirRuta(nodosPadre, actual);
            }

            // Mover a cerrados
            abiertos.delete(actualKey);
            cerrados.add(actualKey);

            // Explorar vecinos
            const vecinos = this.obtenerVecinos(actual);

            for (const vecino of vecinos) {
                const vecinoKey = this.hexToKey(vecino);

                // Ya explorado?
                if (cerrados.has(vecinoKey)) {
                    continue;
                }

                // Obtener hexágono con sus propiedades
                const hexVecino = this.hexGrid.grid.get(vecinoKey);

                // Verificar si es transitable
                if (!this.esTransitable(hexVecino, tipoUnidad, config)) {
                    cerrados.add(vecinoKey);
                    continue;
                }

                // Calcular costo de movimiento
                const costoMovimiento = this.calcularCostoMovimiento(actual, vecino, tipoUnidad, hexVecino);
                const nuevoCostoG = costoG.get(actualKey) + costoMovimiento;

                // ¿Es mejor ruta hacia este vecino?
                if (!abiertos.has(vecinoKey) || nuevoCostoG < costoG.get(vecinoKey)) {
                    nodosPadre.set(vecinoKey, actual);
                    costoG.set(vecinoKey, nuevoCostoG);
                    costoF.set(vecinoKey, nuevoCostoG + this.heuristica(vecino, destino));

                    if (!abiertos.has(vecinoKey)) {
                        abiertos.set(vecinoKey, vecino);
                    }
                }
            }
        }

        // No se encontró ruta
        console.warn('⚠️ No se encontró ruta al destino', { iteraciones });
        return null;
    }

    /**
     * Heurística para A* (distancia Manhattan en coordenadas axiales)
     */
    heuristica(hexA, hexB) {
        return (Math.abs(hexA.q - hexB.q) +
                Math.abs(hexA.r - hexB.r) +
                Math.abs(hexA.s - hexB.s)) / 2;
    }

    /**
     * Obtiene los 6 hexágonos vecinos
     */
    obtenerVecinos(hex) {
        // Direcciones en coordenadas axiales (cubicas)
        const direcciones = [
            {q:  1, r:  0, s: -1}, // E
            {q:  1, r: -1, s:  0}, // NE
            {q:  0, r: -1, s:  1}, // NW
            {q: -1, r:  0, s:  1}, // W
            {q: -1, r:  1, s:  0}, // SW
            {q:  0, r:  1, s: -1}  // SE
        ];

        return direcciones.map(dir => ({
            q: hex.q + dir.q,
            r: hex.r + dir.r,
            s: hex.s + dir.s
        }));
    }

    /**
     * Verifica si un hexágono es transitable
     */
    esTransitable(hex, tipoUnidad, config) {
        if (!hex) return false;

        // Ocupado por unidad enemiga?
        if (config.evitarEnemigos && hex.ocupante && hex.ocupante.equipo !== window.equipoJugador) {
            return false;
        }

        // Terreno intransitable?
        if (config.considerarTerreno && hex.transitabilidad === 'intransitable') {
            return false;
        }

        // Verificar tipo de unidad vs terreno
        if (tipoUnidad === 'vehiculo' && hex.pendiente > 30) {
            return false; // Vehículos no pueden subir pendientes >30°
        }

        return true;
    }

    /**
     * Calcula el costo de movimiento entre dos hexágonos
     */
    calcularCostoMovimiento(hexA, hexB, tipoUnidad, hexDestino) {
        let costo = 1.0; // Costo base

        if (!hexDestino) return costo;

        // Modificadores por terreno
        if (hexDestino.vegetacion) {
            switch(hexDestino.vegetacion) {
                case 'bosque_denso':
                    costo *= 3.0;
                    break;
                case 'bosque':
                    costo *= 2.0;
                    break;
                case 'vegetacion':
                    costo *= 1.5;
                    break;
            }
        }

        // Modificadores por pendiente
        if (hexDestino.pendiente) {
            const pendiente = hexDestino.pendiente;
            if (pendiente > 20) {
                costo *= 2.5;
            } else if (pendiente > 10) {
                costo *= 1.5;
            }
        }

        // Modificadores por tipo de unidad
        if (tipoUnidad === 'vehiculo') {
            costo *= 0.5; // Vehículos más rápidos en terreno abierto
            if (hexDestino.vegetacion) {
                costo *= 1.5; // Pero más lentos en vegetación
            }
        }

        // Modificador por transitabilidad calculada
        if (hexDestino.costoTransitabilidad) {
            costo *= hexDestino.costoTransitabilidad;
        }

        return costo;
    }

    /**
     * Reconstruye la ruta desde el mapa de padres
     */
    reconstruirRuta(nodosPadre, destinoHex) {
        const ruta = [destinoHex];
        let actual = destinoHex;

        while (nodosPadre.has(this.hexToKey(actual))) {
            actual = nodosPadre.get(this.hexToKey(actual));
            ruta.unshift(actual);
        }

        return ruta;
    }

    /**
     * Obtiene el nodo con menor valor F
     */
    obtenerMenorF(abiertos, costoF) {
        let menorKey = null;
        let menorF = Infinity;

        for (const [key] of abiertos) {
            const f = costoF.get(key);
            if (f < menorF) {
                menorF = f;
                menorKey = key;
            }
        }

        return menorKey;
    }

    /**
     * Convierte hexágono a string key
     */
    hexToKey(hex) {
        return `${hex.q},${hex.r},${hex.s}`;
    }

    /**
     * Verifica si dos hexágonos son iguales
     */
    sonIguales(hexA, hexB) {
        return hexA.q === hexB.q && hexA.r === hexB.r && hexA.s === hexB.s;
    }

    /**
     * Gestión de cache
     */
    getCacheKey(inicio, destino, tipoUnidad) {
        return `${this.hexToKey(inicio)}_${this.hexToKey(destino)}_${tipoUnidad}`;
    }

    guardarEnCache(key, ruta) {
        // Limpiar cache si está lleno
        if (this.cache.size >= this.maxCacheSize) {
            const primerKey = this.cache.keys().next().value;
            this.cache.delete(primerKey);
        }
        this.cache.set(key, ruta);
    }

    limpiarCache() {
        this.cache.clear();
        console.log('🧹 Cache de pathfinding limpiado');
    }

    /**
     * Calcula distancia de una ruta en metros
     */
    calcularDistanciaRuta(ruta) {
        if (!ruta || ruta.length < 2) return 0;

        let distanciaTotal = 0;
        for (let i = 0; i < ruta.length - 1; i++) {
            distanciaTotal += this.hexGrid.hexSize; // Cada hex = 3km
        }

        return distanciaTotal;
    }

    /**
     * Calcula tiempo estimado de recorrido (en segundos)
     */
    calcularTiempoRuta(ruta, tipoUnidad = 'infanteria') {
        if (!ruta || ruta.length < 2) return 0;

        const velocidades = {
            infanteria: 4, // 4 km/h
            vehiculo: 30,  // 30 km/h
            blindado: 20,  // 20 km/h
            aereo: 150     // 150 km/h
        };

        const velocidad = velocidades[tipoUnidad] || 4;
        const distanciaKm = this.calcularDistanciaRuta(ruta) / 1000;
        const tiempoHoras = distanciaKm / velocidad;

        return Math.ceil(tiempoHoras * 3600); // Convertir a segundos
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pathfinding;
}
window.Pathfinding = Pathfinding;

console.log('✅ Pathfinding.js cargado - Sistema A* sobre HexGrid');
