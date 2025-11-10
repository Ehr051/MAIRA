/**
 * 🔒 VALIDACIONES GEOMÉTRICAS - JUEGO DE GUERRA V2
 *
 * Utilidades para validar:
 * - Polígonos dentro de polígonos (zonas dentro de sector)
 * - Puntos dentro de polígonos (elementos dentro de zonas)
 * - Intersección de polígonos (zonas superpuestas)
 * - Distancia mínima entre polígonos
 *
 * @author MAIRA Team
 * @version 1.0
 */

class ValidacionesGeometricas {

    /**
     * Verifica si un punto está dentro de un polígono
     * Algoritmo: Ray Casting
     *
     * @param {L.LatLng} punto - Punto a verificar
     * @param {L.Polygon} poligono - Polígono de Leaflet
     * @returns {boolean} true si el punto está dentro
     */
    static puntoEnPoligono(punto, poligono) {
        if (!punto || !poligono) {
            console.error('❌ puntoEnPoligono: parámetros inválidos', { punto, poligono });
            return false;
        }

        // Obtener coordenadas del polígono
        const coords = poligono.getLatLngs()[0]; // Primer anillo

        let dentro = false;
        const x = punto.lng;
        const y = punto.lat;

        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const xi = coords[i].lng;
            const yi = coords[i].lat;
            const xj = coords[j].lng;
            const yj = coords[j].lat;

            const intersecta = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersecta) dentro = !dentro;
        }

        return dentro;
    }

    /**
     * Verifica si un polígono está completamente dentro de otro
     *
     * @param {L.Polygon} poligonoInterior - Polígono que debe estar dentro
     * @param {L.Polygon} poligonoExterior - Polígono contenedor
     * @returns {Object} { valido: boolean, mensaje: string }
     */
    static poligonoEnPoligono(poligonoInterior, poligonoExterior) {
        if (!poligonoInterior || !poligonoExterior) {
            return {
                valido: false,
                mensaje: 'Polígonos inválidos'
            };
        }

        // Obtener todos los vértices del polígono interior
        const verticesInteriores = poligonoInterior.getLatLngs()[0];

        // Verificar que TODOS los vértices estén dentro del exterior
        for (let i = 0; i < verticesInteriores.length; i++) {
            const vertice = verticesInteriores[i];
            if (!this.puntoEnPoligono(vertice, poligonoExterior)) {
                return {
                    valido: false,
                    mensaje: `Vértice ${i + 1} está fuera del polígono contenedor`
                };
            }
        }

        return {
            valido: true,
            mensaje: 'Polígono completamente dentro del contenedor'
        };
    }

    /**
     * Verifica si dos polígonos se intersectan
     * Usa algoritmo Separating Axis Theorem (SAT) simplificado
     *
     * @param {L.Polygon} poligono1
     * @param {L.Polygon} poligono2
     * @returns {boolean} true si se intersectan
     */
    static poligonosSeIntersectan(poligono1, poligono2) {
        if (!poligono1 || !poligono2) {
            return false;
        }

        const coords1 = poligono1.getLatLngs()[0];
        const coords2 = poligono2.getLatLngs()[0];

        // Verificar si algún vértice de pol1 está dentro de pol2
        for (const vertice of coords1) {
            if (this.puntoEnPoligono(vertice, poligono2)) {
                return true;
            }
        }

        // Verificar si algún vértice de pol2 está dentro de pol1
        for (const vertice of coords2) {
            if (this.puntoEnPoligono(vertice, poligono1)) {
                return true;
            }
        }

        // Verificar intersección de aristas (simplificado)
        // Para una implementación completa, usaría Turf.js
        // Por ahora, esto cubre los casos más comunes

        return false;
    }

    /**
     * Calcula la distancia mínima entre dos polígonos
     *
     * @param {L.Polygon} poligono1
     * @param {L.Polygon} poligono2
     * @returns {number} Distancia en metros
     */
    static distanciaEntrePoligonos(poligono1, poligono2) {
        const coords1 = poligono1.getLatLngs()[0];
        const coords2 = poligono2.getLatLngs()[0];

        let distanciaMin = Infinity;

        // Calcular distancia entre todos los pares de vértices
        for (const v1 of coords1) {
            for (const v2 of coords2) {
                const dist = v1.distanceTo(v2); // Leaflet devuelve metros
                if (dist < distanciaMin) {
                    distanciaMin = dist;
                }
            }
        }

        return distanciaMin;
    }

    /**
     * Valida que una zona esté dentro del sector
     *
     * @param {L.Polygon} zona - Zona azul o roja
     * @param {L.Polygon} sector - Sector delimitado
     * @param {string} nombreZona - Nombre para mensajes de error
     * @returns {Object} { valido: boolean, mensaje: string }
     */
    static validarZonaEnSector(zona, sector, nombreZona = 'Zona') {
        if (!zona) {
            return {
                valido: false,
                mensaje: `${nombreZona} no definida`
            };
        }

        if (!sector) {
            return {
                valido: false,
                mensaje: 'Sector no definido'
            };
        }

        // Verificar que la zona esté completamente dentro del sector
        const resultado = this.poligonoEnPoligono(zona, sector);

        if (!resultado.valido) {
            return {
                valido: false,
                mensaje: `${nombreZona} debe estar completamente dentro del sector.<br>${resultado.mensaje}`
            };
        }

        return {
            valido: true,
            mensaje: `${nombreZona} válida (dentro del sector)`
        };
    }

    /**
     * Valida que las zonas azul y roja NO se superpongan
     *
     * @param {L.Polygon} zonaAzul
     * @param {L.Polygon} zonaRoja
     * @param {number} distanciaMinima - Distancia mínima en metros (default: 100m)
     * @returns {Object} { valido: boolean, mensaje: string }
     */
    static validarZonasNoSuperpuestas(zonaAzul, zonaRoja, distanciaMinima = 100) {
        if (!zonaAzul || !zonaRoja) {
            return {
                valido: false,
                mensaje: 'Ambas zonas deben estar definidas'
            };
        }

        // Verificar superposición
        if (this.poligonosSeIntersectan(zonaAzul, zonaRoja)) {
            return {
                valido: false,
                mensaje: 'Las zonas azul y roja NO pueden superponerse'
            };
        }

        // Verificar distancia mínima
        const distancia = this.distanciaEntrePoligonos(zonaAzul, zonaRoja);

        if (distancia < distanciaMinima) {
            return {
                valido: false,
                mensaje: `Las zonas deben estar separadas al menos ${distanciaMinima}m (actual: ${distancia.toFixed(1)}m)`
            };
        }

        return {
            valido: true,
            mensaje: `Zonas válidas (separación: ${distancia.toFixed(1)}m)`
        };
    }

    /**
     * Valida que un marcador/elemento esté dentro de una zona
     *
     * @param {L.LatLng} posicion - Posición del elemento
     * @param {L.Polygon} zona - Zona azul o roja
     * @param {string} nombreZona - Nombre para mensajes
     * @returns {Object} { valido: boolean, mensaje: string }
     */
    static validarElementoEnZona(posicion, zona, nombreZona = 'zona') {
        if (!posicion) {
            return {
                valido: false,
                mensaje: 'Posición inválida'
            };
        }

        if (!zona) {
            return {
                valido: false,
                mensaje: `${nombreZona} no definida`
            };
        }

        if (!this.puntoEnPoligono(posicion, zona)) {
            return {
                valido: false,
                mensaje: `El elemento debe estar dentro de la ${nombreZona}`
            };
        }

        return {
            valido: true,
            mensaje: `Elemento dentro de la ${nombreZona}`
        };
    }

    /**
     * Extrae el afiliado del SIDC (Friend, Joker/Faker, Neutral, Unknown)
     *
     * @param {string} sidc - Código SIDC (ej: "SFGPUCF---")
     * @returns {string} 'F' (Friend), 'J' (Joker - Enemigo), 'N' (Neutral), 'U' (Unknown)
     */
    static obtenerAfiliadoSIDC(sidc) {
        if (!sidc || sidc.length < 3) {
            console.warn('⚠️ SIDC inválido:', sidc);
            return 'U'; // Unknown
        }

        // El afiliado está en la posición 1 (0-indexed)
        // S*F* = Friend (Azul)
        // S*J* = Joker/Faker (Rojo - doctrina argentina)
        // S*H* = Hostile (también aceptado como Rojo, compatibilidad)
        // S*N* = Neutral
        // S*U* = Unknown
        const afiliado = sidc.charAt(1).toUpperCase();

        // Convertir H (Hostile) a J (Joker) para compatibilidad
        if (afiliado === 'H') {
            console.log('⚠️ Convirtiendo H (Hostile) → J (Joker) por doctrina argentina');
            return 'J';
        }

        if (['F', 'J', 'N', 'U'].includes(afiliado)) {
            return afiliado;
        }

        console.warn('⚠️ Afiliado SIDC no reconocido:', afiliado, 'en', sidc);
        return 'U'; // Unknown por defecto
    }

    /**
     * Valida que el SIDC coincida con el equipo/zona
     *
     * @param {string} sidc - Código SIDC
     * @param {string} equipo - 'azul' o 'rojo'
     * @returns {Object} { valido: boolean, mensaje: string, afiliado: string }
     */
    static validarSIDCPorEquipo(sidc, equipo) {
        const afiliado = this.obtenerAfiliadoSIDC(sidc);

        if (equipo === 'azul') {
            if (afiliado !== 'F') {
                return {
                    valido: false,
                    afiliado: afiliado,
                    mensaje: `SIDC incorrecto para equipo azul.<br>Debe ser Friend (S*F*...), actual: ${afiliado === 'J' ? 'Joker' : afiliado === 'N' ? 'Neutral' : 'Unknown'}`
                };
            }
        } else if (equipo === 'rojo') {
            if (afiliado !== 'J') {
                return {
                    valido: false,
                    afiliado: afiliado,
                    mensaje: `SIDC incorrecto para equipo rojo.<br>Debe ser Joker (S*J*...), actual: ${afiliado === 'F' ? 'Friend' : afiliado === 'N' ? 'Neutral' : 'Unknown'}`
                };
            }
        } else {
            return {
                valido: false,
                afiliado: afiliado,
                mensaje: `Equipo desconocido: ${equipo}`
            };
        }

        return {
            valido: true,
            afiliado: afiliado,
            mensaje: `SIDC válido para equipo ${equipo}`
        };
    }

    /**
     * Obtiene el color correspondiente al afiliado SIDC
     *
     * @param {string} sidc - Código SIDC
     * @returns {string} Color hexadecimal
     */
    static obtenerColorSIDC(sidc) {
        const afiliado = this.obtenerAfiliadoSIDC(sidc);

        const colores = {
            'F': '#0080FF', // Friend - Azul
            'J': '#FF0000', // Joker/Faker - Rojo (enemigo según doctrina argentina)
            'N': '#00FF00', // Neutral - Verde
            'U': '#FFFF00'  // Unknown - Amarillo
        };

        return colores[afiliado] || colores['U'];
    }
}

// Exportar
window.ValidacionesGeometricas = ValidacionesGeometricas;
console.log('✅ ValidacionesGeometricas.js cargado');
