/**
 * 🎖️ ORBAT MANAGER - Gestión de Organización para el Combate
 *
 * Maneja el despliegue de elementos subordinados según jerarquía militar
 * y configuración definida en ORBAT.json
 */

class ORBATManager {
    constructor() {
        this.orbatData = null;
        this.map = null;
        this.loadedPromise = this.cargarORBAT();
    }

    /**
     * Carga el archivo ORBAT.json
     */
    async cargarORBAT() {
        try {
            const response = await fetch('js/modules/juegoV2/config/ORBAT.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.orbatData = await response.json();
            console.log('✅ ORBAT.json cargado:', this.orbatData);
            return this.orbatData;
        } catch (error) {
            console.error('❌ Error cargando ORBAT.json:', error);
            return null;
        }
    }

    /**
     * Establece referencia al mapa
     */
    setMap(map) {
        this.map = map;
    }

    /**
     * Extrae tipo de arma del SIDC (posiciones 4-6)
     */
    extraerTipoArma(sidc) {
        if (!sidc || sidc.length < 7) return null;
        return sidc.substring(4, 7);
    }

    /**
     * Extrae magnitud del SIDC (posición 11)
     */
    extraerMagnitud(sidc) {
        if (!sidc || sidc.length < 12) return null;
        return sidc.charAt(11);
    }

    /**
     * Obtiene plantilla de subordinados para una unidad
     */
    obtenerPlantillaSubordinados(sidc) {
        if (!this.orbatData) return null;

        const tipoArma = this.extraerTipoArma(sidc);
        const magnitud = this.extraerMagnitud(sidc);

        if (!tipoArma || !magnitud) return null;

        const plantillasArma = this.orbatData.plantillas[tipoArma];
        if (!plantillasArma) {
            console.warn(`No hay plantilla ORBAT para arma: ${tipoArma}`);
            return null;
        }

        const plantillaMagnitud = plantillasArma[magnitud];
        if (!plantillaMagnitud) {
            console.warn(`No hay plantilla ORBAT para ${tipoArma} magnitud ${magnitud}`);
            return null;
        }

        return plantillaMagnitud;
    }

    /**
     * Construye SIDC para un subordinado
     */
    construirSIDCSubordinado(sidcPadre, tipoSubordinado, magnitudSubordinado) {
        // Copiar SIDC padre y modificar:
        // - Posiciones 4-6: tipo de arma del subordinado
        // - Posición 11: magnitud del subordinado

        let sidc = sidcPadre.split('');

        // Tipo de arma (posiciones 4-6)
        sidc[4] = tipoSubordinado[0];
        sidc[5] = tipoSubordinado[1];
        sidc[6] = tipoSubordinado[2];

        // Magnitud (posición 11)
        sidc[11] = magnitudSubordinado;

        return sidc.join('');
    }

    /**
     * Calcula posiciones de despliegue según formación
     */
    calcularPosicionesDespliegue(posicionComandante, numeroSubordinados, formacion = 'linea') {
        if (!this.map || !posicionComandante) return [];

        const config = this.orbatData?.configuracion?.desplieguePorDefecto || {
            distanciaEntreSub: 200,
            offsetDesdeComandante: 300
        };

        const posiciones = [];
        const distancia = config.distanciaEntreSub;
        const offset = config.offsetDesdeComandante;

        // Convertir posición comandante a píxeles
        const comandantePoint = this.map.latLngToLayerPoint(posicionComandante);

        switch (formacion) {
            case 'linea':
                // Despliegue horizontal
                const inicioX = comandantePoint.x - ((numeroSubordinados - 1) * distancia / 2);
                const y = comandantePoint.y + offset;

                for (let i = 0; i < numeroSubordinados; i++) {
                    const point = L.point(inicioX + (i * distancia), y);
                    posiciones.push(this.map.layerPointToLatLng(point));
                }
                break;

            case 'columna':
                // Despliegue vertical
                const x = comandantePoint.x;
                const inicioY = comandantePoint.y + offset;

                for (let i = 0; i < numeroSubordinados; i++) {
                    const point = L.point(x, inicioY + (i * distancia));
                    posiciones.push(this.map.layerPointToLatLng(point));
                }
                break;

            case 'cuña':
                // Formación en V
                const mitad = Math.floor(numeroSubordinados / 2);
                for (let i = 0; i < numeroSubordinados; i++) {
                    let offsetX, offsetY;
                    if (i < mitad) {
                        // Lado izquierdo de la V
                        offsetX = -(i + 1) * distancia;
                        offsetY = offset + (i + 1) * distancia;
                    } else {
                        // Lado derecho de la V
                        const idx = i - mitad;
                        offsetX = (idx + 1) * distancia;
                        offsetY = offset + (idx + 1) * distancia;
                    }
                    const point = L.point(comandantePoint.x + offsetX, comandantePoint.y + offsetY);
                    posiciones.push(this.map.layerPointToLatLng(point));
                }
                break;

            case 'escalon_derecha':
                // Escalonados a la derecha
                for (let i = 0; i < numeroSubordinados; i++) {
                    const point = L.point(
                        comandantePoint.x + (i * distancia),
                        comandantePoint.y + offset + (i * distancia / 2)
                    );
                    posiciones.push(this.map.layerPointToLatLng(point));
                }
                break;

            case 'escalon_izquierda':
                // Escalonados a la izquierda
                for (let i = 0; i < numeroSubordinados; i++) {
                    const point = L.point(
                        comandantePoint.x - (i * distancia),
                        comandantePoint.y + offset + (i * distancia / 2)
                    );
                    posiciones.push(this.map.layerPointToLatLng(point));
                }
                break;

            default:
                console.warn(`Formación desconocida: ${formacion}, usando línea`);
                return this.calcularPosicionesDespliegue(posicionComandante, numeroSubordinados, 'linea');
        }

        return posiciones;
    }

    /**
     * Despliega subordinados de una unidad
     * @param {Object} unidadPadre - Unidad comandante (L.Marker)
     * @param {Object} opciones - Opciones de despliegue
     * @returns {Array} Array de unidades subordinadas creadas
     */
    async desplegarSubordinados(unidadPadre, opciones = {}) {
        // Esperar a que ORBAT esté cargado
        await this.loadedPromise;

        if (!this.orbatData) {
            console.error('❌ ORBAT.json no está cargado');
            return [];
        }

        if (!unidadPadre || !unidadPadre.options || !unidadPadre.options.sidc) {
            console.error('❌ Unidad padre inválida o sin SIDC');
            return [];
        }

        const sidcPadre = unidadPadre.options.sidc;
        const plantilla = this.obtenerPlantillaSubordinados(sidcPadre);

        if (!plantilla || !plantilla.subordinados) {
            console.warn('⚠️ No hay subordinados definidos para este SIDC');
            return [];
        }

        console.log(`🎖️ Desplegando subordinados de: ${plantilla._magnitud || 'Unidad'}`);

        const subordinados = [];
        const posicionComandante = unidadPadre.getLatLng();
        const formacion = opciones.formacion || this.orbatData.configuracion.desplieguePorDefecto.formacion;

        // Calcular posiciones
        const posiciones = this.calcularPosicionesDespliegue(
            posicionComandante,
            plantilla.subordinados.length,
            formacion
        );

        // Crear cada subordinado
        for (let i = 0; i < plantilla.subordinados.length; i++) {
            const subData = plantilla.subordinados[i];
            const posicion = posiciones[i];

            // Construir SIDC del subordinado
            const sidcSubordinado = this.construirSIDCSubordinado(
                sidcPadre,
                subData.tipo,
                subData.magnitud
            );

            // Crear marcador subordinado
            const subordinado = this.crearMarcadorSubordinado({
                sidc: sidcSubordinado,
                nombre: subData.nombre,
                posicion: posicion,
                equipoPadre: unidadPadre.options.equipo,
                comandante: unidadPadre.options.id || unidadPadre.options.nombre
            });

            if (subordinado) {
                subordinados.push(subordinado);
            }
        }

        console.log(`✅ Desplegados ${subordinados.length} subordinados`);

        // 🔗 TRACKING: Guardar referencia de subordinados en el padre
        if (!unidadPadre.subordinadosDesplegados) {
            unidadPadre.subordinadosDesplegados = [];
        }
        unidadPadre.subordinadosDesplegados.push(...subordinados);

        // Marcar padre como "desplegado"
        unidadPadre.estaDesplegado = true;

        // Actualizar icono del padre para indicar que está desplegado
        this.actualizarIconoPadre(unidadPadre, true);

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('subordinadosDesplegados', {
                comandante: unidadPadre,
                subordinados: subordinados,
                formacion: formacion
            });
        }

        return subordinados;
    }

    /**
     * Crea un marcador subordinado en el mapa
     */
    crearMarcadorSubordinado(config) {
        if (!this.map) {
            console.error('❌ Mapa no configurado en ORBATManager');
            return null;
        }

        try {
            // Usar la función global agregarMarcadorConCoordenadas si existe
            if (typeof window.agregarMarcadorConCoordenadas === 'function') {
                return window.agregarMarcadorConCoordenadas(
                    config.sidc,
                    config.nombre,
                    config.posicion
                );
            }

            // Fallback: crear marcador manualmente
            const symbol = new ms.Symbol(config.sidc, { size: 30 });

            const marcador = L.marker(config.posicion, {
                icon: L.divIcon({
                    className: 'milsymbol-marker',
                    html: symbol.asSVG(),
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                }),
                sidc: config.sidc,
                nombre: config.nombre,
                equipo: config.equipoPadre,
                comandante: config.comandante,
                id: `${config.comandante}_${config.nombre.replace(/\s/g, '_')}_${Date.now()}`
            });

            marcador.addTo(this.map);

            // Tooltip
            marcador.bindTooltip(config.nombre, {
                permanent: false,
                direction: 'top'
            });

            return marcador;

        } catch (error) {
            console.error('❌ Error creando marcador subordinado:', error);
            return null;
        }
    }

    /**
     * Obtiene información de magnitud
     */
    obtenerInfoMagnitud(codigoMagnitud) {
        if (!this.orbatData) return null;
        return this.orbatData.magnitudes[codigoMagnitud] || null;
    }

    /**
     * Valida si una unidad puede desplegar subordinados
     */
    puedeDesplegar(sidc) {
        const plantilla = this.obtenerPlantillaSubordinados(sidc);
        return plantilla && plantilla.subordinados && plantilla.subordinados.length > 0;
    }

    /**
     * Obtiene la cantidad de subordinados que tendría una unidad
     */
    contarSubordinados(sidc) {
        const plantilla = this.obtenerPlantillaSubordinados(sidc);
        return plantilla?.subordinados?.length || 0;
    }

    /**
     * 🔄 REAGRUPAR: Oculta/elimina subordinados desplegados
     * @param {Object} unidadPadre - Unidad comandante
     * @returns {Number} Cantidad de subordinados reagrupados
     */
    reagruparSubordinados(unidadPadre) {
        if (!unidadPadre) {
            console.error('❌ Unidad padre inválida');
            return 0;
        }

        if (!unidadPadre.subordinadosDesplegados || unidadPadre.subordinadosDesplegados.length === 0) {
            console.warn('⚠️ Esta unidad no tiene subordinados desplegados');
            return 0;
        }

        const cantidad = unidadPadre.subordinadosDesplegados.length;
        console.log(`🔄 Reagrupando ${cantidad} subordinados...`);

        // Eliminar cada subordinado del mapa
        for (const subordinado of unidadPadre.subordinadosDesplegados) {
            if (subordinado && this.map && this.map.hasLayer(subordinado)) {
                this.map.removeLayer(subordinado);
            }
        }

        // Limpiar array de subordinados
        unidadPadre.subordinadosDesplegados = [];
        unidadPadre.estaDesplegado = false;

        // Actualizar icono del padre
        this.actualizarIconoPadre(unidadPadre, false);

        // Emitir evento
        if (window.eventBus) {
            window.eventBus.emit('subordinadosReagrupados', {
                comandante: unidadPadre,
                cantidad: cantidad
            });
        }

        console.log(`✅ ${cantidad} subordinados reagrupados`);
        return cantidad;
    }

    /**
     * Verifica si una unidad tiene subordinados desplegados
     */
    tieneSubordinadosDesplegados(unidad) {
        return unidad &&
               unidad.subordinadosDesplegados &&
               unidad.subordinadosDesplegados.length > 0;
    }

    /**
     * Actualiza el icono del padre para indicar si está desplegado
     */
    actualizarIconoPadre(unidadPadre, estaDesplegado) {
        if (!unidadPadre || !unidadPadre.options || !unidadPadre.options.sidc) return;

        try {
            // Agregar indicador visual (borde o badge)
            const sidc = unidadPadre.options.sidc;
            const symbol = new ms.Symbol(sidc, {
                size: 30,
                // Agregar modificador de "desplegado" (opcional)
            });

            // Crear nuevo icono con indicador
            const iconHtml = estaDesplegado
                ? `<div style="position: relative;">
                    ${symbol.asSVG()}
                    <div style="position: absolute; top: -5px; right: -5px; background: #00ff00; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>
                   </div>`
                : symbol.asSVG();

            const nuevoIcono = L.divIcon({
                className: 'milsymbol-marker',
                html: iconHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            unidadPadre.setIcon(nuevoIcono);
        } catch (error) {
            console.warn('⚠️ No se pudo actualizar icono del padre:', error);
        }
    }
}

// Crear instancia global
window.orbatManager = new ORBATManager();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ORBATManager;
}
window.ORBATManager = ORBATManager;

console.log('✅ ORBATManager.js cargado - Sistema de despliegue ORBAT');
