/**
 * StatsBarras.js
 * Sistema de visualización de stats por elemento (Personal, Combustible, Munición, Moral, Raciones)
 * Inspirado en BV8 y sistemas de wargaming modernos
 */

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURACIÓN DE STATS
    // ============================================================================

    const STATS_CONFIG = {
        personal: {
            icono: '🧑‍✈️',
            label: 'Personal',
            color_ok: '#4CAF50',      // Verde
            color_medio: '#FF9800',   // Naranja
            color_bajo: '#F44336',    // Rojo
            umbral_medio: 0.5,        // 50%
            umbral_bajo: 0.25,        // 25%
            tooltip: 'Personal efectivo (tripulación + embarcados)'
        },
        combustible: {
            icono: '⛽',
            label: 'Combustible',
            color_ok: '#2196F3',      // Azul
            color_medio: '#FF9800',
            color_bajo: '#F44336',
            umbral_medio: 0.4,        // 40%
            umbral_bajo: 0.15,        // 15%
            tooltip: 'Combustible disponible / Capacidad máxima'
        },
        municion: {
            icono: '🔫',
            label: 'Munición',
            color_ok: '#9C27B0',      // Púrpura
            color_medio: '#FF9800',
            color_bajo: '#F44336',
            umbral_medio: 0.5,
            umbral_bajo: 0.25,
            tooltip: 'Munición disponible (promedio de todos los tipos)'
        },
        moral: {
            icono: '💪',
            label: 'Moral',
            color_ok: '#4CAF50',
            color_medio: '#FF9800',
            color_bajo: '#F44336',
            umbral_medio: 0.6,
            umbral_bajo: 0.3,
            tooltip: 'Estado de ánimo y cohesión de la unidad'
        },
        raciones: {
            icono: '🍽️',
            label: 'Raciones',
            color_ok: '#795548',      // Marrón
            color_medio: '#FF9800',
            color_bajo: '#F44336',
            umbral_medio: 0.4,
            umbral_bajo: 0.2,
            tooltip: 'Raciones disponibles en días'
        }
    };

    // ============================================================================
    // FUNCIONES DE CÁLCULO DE PORCENTAJES
    // ============================================================================

    /**
     * Calcula el porcentaje de personal disponible
     * @param {Object} stats - Stats del elemento (de elementoUtils)
     * @returns {Number} Porcentaje (0-100)
     */
    function calcularPorcentajePersonal(stats) {
        if (!stats?.personal) return 0;

        const actual = stats.personal.total || 0;
        const max = stats.personal.max_capacidad || actual;

        if (max === 0) return 0;

        return Math.round((actual / max) * 100);
    }

    /**
     * Calcula el porcentaje de combustible disponible
     * @param {Object} stats - Stats del elemento
     * @returns {Number} Porcentaje (0-100)
     */
    function calcularPorcentajeCombustible(stats) {
        if (!stats?.combustible) return 0;

        const actual = stats.combustible.actual || 0;
        const capacidad = stats.combustible.capacidad || 0;

        if (capacidad === 0) return 0;

        return Math.round((actual / capacidad) * 100);
    }

    /**
     * Calcula el porcentaje promedio de munición disponible
     * @param {Object} stats - Stats del elemento
     * @returns {Number} Porcentaje (0-100)
     */
    function calcularPorcentajeMunicion(stats) {
        if (!stats?.municion?.tipos) return 0;

        const tipos = stats.municion.tipos;
        const tiposArray = Object.entries(tipos);

        if (tiposArray.length === 0) return 0;

        // Para calcular porcentaje, necesitamos dotación inicial
        // Por ahora, usamos heurística: > 0 = 100%, 0 = 0%
        // TODO: Mejorar cuando tengamos dotación inicial vs actual

        const tiposConMunicion = tiposArray.filter(([tipo, cantidad]) => cantidad > 0);
        return Math.round((tiposConMunicion.length / tiposArray.length) * 100);
    }

    /**
     * Calcula el porcentaje de moral
     * @param {Object} stats - Stats del elemento
     * @returns {Number} Porcentaje (0-100)
     */
    function calcularPorcentajeMoral(stats) {
        if (!stats?.moral) return 100; // Default: moral alta

        const actual = stats.moral.actual || 100;
        const max = stats.moral.max || 100;

        return Math.round((actual / max) * 100);
    }

    /**
     * Calcula el porcentaje de raciones (días disponibles)
     * @param {Object} stats - Stats del elemento
     * @returns {Number} Porcentaje (0-100)
     */
    function calcularPorcentajeRaciones(stats) {
        if (!stats?.raciones) return 0;

        const dias = stats.raciones.dias_disponibles || 0;
        const maxDias = 5; // Asumimos 5 días como máximo estándar

        if (dias === 0) return 0;

        return Math.min(Math.round((dias / maxDias) * 100), 100);
    }

    // ============================================================================
    // FUNCIONES DE RENDERIZADO
    // ============================================================================

    /**
     * Obtiene el color de la barra según el porcentaje y umbrales
     * @param {String} statKey - Clave del stat (personal, combustible, etc)
     * @param {Number} porcentaje - Porcentaje actual (0-100)
     * @returns {String} Color CSS
     */
    function obtenerColorBarra(statKey, porcentaje) {
        const config = STATS_CONFIG[statKey];
        if (!config) return '#999';

        const fraccion = porcentaje / 100;

        if (fraccion <= config.umbral_bajo) {
            return config.color_bajo;
        } else if (fraccion <= config.umbral_medio) {
            return config.color_medio;
        } else {
            return config.color_ok;
        }
    }

    /**
     * Crea el HTML de una barra de stat individual
     * @param {String} statKey - Clave del stat
     * @param {Number} porcentaje - Porcentaje (0-100)
     * @param {String} textoDetalle - Texto adicional (ej: "11/13 pers")
     * @returns {String} HTML
     */
    function crearBarraStat(statKey, porcentaje, textoDetalle = '') {
        const config = STATS_CONFIG[statKey];
        if (!config) return '';

        const color = obtenerColorBarra(statKey, porcentaje);
        const anchoVisible = Math.max(porcentaje, 0);

        return `
            <div class="stat-barra-container" data-stat="${statKey}" title="${config.tooltip}">
                <div class="stat-header">
                    <span class="stat-icono">${config.icono}</span>
                    <span class="stat-label">${config.label}</span>
                    <span class="stat-porcentaje">${porcentaje}%</span>
                </div>
                <div class="stat-barra-fondo">
                    <div class="stat-barra-fill"
                         style="width: ${anchoVisible}%; background-color: ${color}">
                    </div>
                </div>
                ${textoDetalle ? `<div class="stat-detalle">${textoDetalle}</div>` : ''}
            </div>
        `;
    }

    /**
     * Crea el panel completo de stats para un elemento
     * @param {Object} elemento - Marcador de Leaflet
     * @returns {String} HTML completo del panel de stats
     */
    function crearPanelStats(elemento) {
        if (!elemento) return '<p>No hay elemento seleccionado</p>';

        // Obtener datos completos del elemento (incluyendo stats BV8)
        const datosElemento = window.obtenerDatosElemento?.(elemento);

        if (!datosElemento) {
            return '<p>No se pudieron obtener datos del elemento</p>';
        }

        const stats = datosElemento.stats;

        if (!stats) {
            return `
                <div class="panel-stats-sin-datos">
                    <p>📊 Sin datos BV8 disponibles</p>
                    <p class="texto-secundario">Este elemento no tiene datos de vehículo específico</p>
                </div>
            `;
        }

        // Calcular porcentajes
        const porcentajes = {
            personal: calcularPorcentajePersonal(stats),
            combustible: calcularPorcentajeCombustible(stats),
            municion: calcularPorcentajeMunicion(stats),
            moral: calcularPorcentajeMoral(stats),
            raciones: calcularPorcentajeRaciones(stats)
        };

        // Crear detalles textuales
        const detalles = {
            personal: `${stats.personal.total}/${stats.personal.max_capacidad} pers (${stats.personal.tripulacion} trip + ${stats.personal.embarcado} emb)`,
            combustible: `${stats.combustible.actual}/${stats.combustible.capacidad} L (${stats.combustible.tipo})`,
            municion: `${stats.municion.total_tipos} tipos disponibles`,
            moral: `Estado: ${stats.moral.estado}`,
            raciones: `${stats.raciones.dias_disponibles} días disponibles`
        };

        // Generar HTML de todas las barras
        let htmlBarras = '';
        for (const statKey of ['personal', 'combustible', 'municion', 'moral', 'raciones']) {
            htmlBarras += crearBarraStat(statKey, porcentajes[statKey], detalles[statKey]);
        }

        return `
            <div class="panel-stats-completo">
                <div class="panel-stats-header">
                    <h3>📊 Estado del Elemento</h3>
                    <p class="elemento-nombre">${datosElemento.nombreCompleto}</p>
                </div>
                <div class="panel-stats-barras">
                    ${htmlBarras}
                </div>
            </div>
        `;
    }

    /**
     * Actualiza el panel de stats en un contenedor específico
     * @param {String|HTMLElement} contenedor - Selector CSS o elemento DOM
     * @param {Object} elemento - Marcador de Leaflet
     */
    function actualizarPanelStats(contenedor, elemento) {
        const contenedorDOM = typeof contenedor === 'string' ?
            document.querySelector(contenedor) :
            contenedor;

        if (!contenedorDOM) {
            console.warn('⚠️ Contenedor de stats no encontrado');
            return;
        }

        const htmlPanel = crearPanelStats(elemento);
        contenedorDOM.innerHTML = htmlPanel;
    }

    /**
     * Crea el CSS necesario para las barras de stats e inyecta en el documento
     */
    function inyectarEstilosStats() {
        const estilosExistentes = document.getElementById('stats-barras-styles');
        if (estilosExistentes) {
            return; // Ya existe
        }

        const estilos = `
            <style id="stats-barras-styles">
                /* Panel de Stats Completo */
                .panel-stats-completo {
                    background: #1e1e1e;
                    border-radius: 8px;
                    padding: 16px;
                    color: #fff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                }

                .panel-stats-header {
                    margin-bottom: 16px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 12px;
                }

                .panel-stats-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .elemento-nombre {
                    margin: 0;
                    font-size: 14px;
                    color: #888;
                }

                .panel-stats-sin-datos {
                    background: #2a2a2a;
                    border-radius: 8px;
                    padding: 24px;
                    text-align: center;
                    color: #888;
                }

                .texto-secundario {
                    font-size: 12px;
                    color: #666;
                    margin-top: 8px;
                }

                /* Barras de Stats */
                .panel-stats-barras {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .stat-barra-container {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 500;
                }

                .stat-icono {
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
                }

                .stat-label {
                    flex: 1;
                }

                .stat-porcentaje {
                    font-weight: 700;
                    font-size: 12px;
                    color: #aaa;
                }

                .stat-barra-fondo {
                    height: 12px;
                    background: #333;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                }

                .stat-barra-fill {
                    height: 100%;
                    border-radius: 6px;
                    transition: width 0.3s ease, background-color 0.3s ease;
                    position: relative;
                }

                .stat-barra-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        to bottom,
                        rgba(255, 255, 255, 0.2) 0%,
                        rgba(255, 255, 255, 0) 50%,
                        rgba(0, 0, 0, 0.2) 100%
                    );
                    border-radius: 6px;
                }

                .stat-detalle {
                    font-size: 11px;
                    color: #888;
                    padding-left: 28px;
                }

                /* Animaciones */
                @keyframes pulse-barra {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }

                .stat-barra-container[data-stat="personal"] .stat-barra-fill {
                    box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
                }

                .stat-barra-container[data-stat="combustible"] .stat-barra-fill {
                    box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
                }

                .stat-barra-container[data-stat="municion"] .stat-barra-fill {
                    box-shadow: 0 0 8px rgba(156, 39, 176, 0.5);
                }

                .stat-barra-container[data-stat="moral"] .stat-barra-fill {
                    box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
                }

                .stat-barra-container[data-stat="raciones"] .stat-barra-fill {
                    box-shadow: 0 0 8px rgba(121, 85, 72, 0.5);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .panel-stats-completo {
                        padding: 12px;
                    }

                    .stat-header {
                        font-size: 12px;
                    }

                    .stat-barra-fondo {
                        height: 10px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', estilos);
        console.log('✅ Estilos de stats inyectados');
    }

    // ============================================================================
    // INICIALIZACIÓN
    // ============================================================================

    // Inyectar estilos al cargar el módulo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inyectarEstilosStats);
    } else {
        inyectarEstilosStats();
    }

    // ============================================================================
    // EXPORTAR FUNCIONES
    // ============================================================================

    // Exportar al scope global
    window.crearPanelStats = crearPanelStats;
    window.actualizarPanelStats = actualizarPanelStats;
    window.crearBarraStat = crearBarraStat;
    window.calcularPorcentajePersonal = calcularPorcentajePersonal;
    window.calcularPorcentajeCombustible = calcularPorcentajeCombustible;
    window.calcularPorcentajeMunicion = calcularPorcentajeMunicion;
    window.calcularPorcentajeMoral = calcularPorcentajeMoral;
    window.calcularPorcentajeRaciones = calcularPorcentajeRaciones;

    // Exportar en namespace MAIRA
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.StatsBarras = {
        crearPanel: crearPanelStats,
        actualizarPanel: actualizarPanelStats,
        crearBarra: crearBarraStat,

        // Funciones de cálculo
        calcularPorcentajes: {
            personal: calcularPorcentajePersonal,
            combustible: calcularPorcentajeCombustible,
            municion: calcularPorcentajeMunicion,
            moral: calcularPorcentajeMoral,
            raciones: calcularPorcentajeRaciones
        },

        // Configuración
        config: STATS_CONFIG
    };

    console.log('✅ StatsBarras.js cargado - Sistema de visualización de stats disponible');

})();
