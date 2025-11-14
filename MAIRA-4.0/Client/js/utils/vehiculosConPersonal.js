/**
 * vehiculosConPersonal.js
 * Lógica para manejar vehículos con personal embarcado (tripulación + infantería)
 *
 * Concepto militar:
 * - La tripulación FIJA (conductor, jefe, apuntador) opera el vehículo
 * - El personal EMBARCADO (grupo de infantería) va transportado dentro
 * - UN solo marcador representa: vehículo + tripulación + embarcados
 *
 * Ejemplo: VCTP TAM
 * - Tripulación: 3 (conductor, jefe, tirador)
 * - Embarcados: 8 (Grupo 1 → Eq A + Eq B)
 * - Total: 11 personas en 1 marcador
 */

(function() {
    'use strict';

    // ============================================================================
    // ESTRUCTURAS DE DATOS PARA PERSONAL EMBARCADO
    // ============================================================================

    /**
     * Crea la estructura de personal embarcado para un grupo de infantería
     * Según BV8, un grupo de infantería mecanizada tiene:
     * - 1 Jefe de Grupo
     * - Equipo A (4 soldados)
     * - Equipo B (3 soldados)
     * Total: 8 soldados embarcados
     *
     * @param {String} nombreGrupo - Nombre del grupo (ej: "Grupo 1")
     * @param {Object} configuracion - Configuración opcional del grupo
     * @returns {Object} Estructura de personal embarcado
     */
    function crearGrupoInfanteria(nombreGrupo, configuracion = {}) {
        const config = {
            tipoGrupo: configuracion.tipoGrupo || 'infanteria_mecanizada',
            equipoA_cantidad: configuracion.equipoA_cantidad || 4,
            equipoB_cantidad: configuracion.equipoB_cantidad || 3,
            jefeGrupo: configuracion.jefeGrupo || 1,
            ...configuracion
        };

        // Munición estándar BV8 por soldado
        const municionFAL = 200; // 200 tiros 7.62mm por FAL
        const municionM60 = 600; // 600 tiros 7.62mm para ametralladora M60

        const totalPersonal = config.jefeGrupo + config.equipoA_cantidad + config.equipoB_cantidad;

        return {
            nombre: nombreGrupo,
            tipo: config.tipoGrupo,
            cantidad: totalPersonal,

            equipos: [
                {
                    nombre: `Eq A (${nombreGrupo})`,
                    cantidad: config.equipoA_cantidad,
                    roles: {
                        ametrallador_m60: 1,
                        fusilero_fal: config.equipoA_cantidad - 1
                    }
                },
                {
                    nombre: `Eq B (${nombreGrupo})`,
                    cantidad: config.equipoB_cantidad,
                    roles: {
                        fusilero_fal: config.equipoB_cantidad
                    }
                }
            ],

            // Munición total del grupo
            municion: {
                municion_762: (municionFAL * (totalPersonal - 1)) + municionM60 // FAL + M60
            },

            // Agua y raciones (se calculan automáticamente en elementoUtils)
            dotacion_individual: {
                agua_litros_dia: 3.5,
                raciones_dias: 3
            }
        };
    }

    /**
     * Crea la estructura completa de personal embarcado para un vehículo
     * @param {Array} grupos - Array de grupos creados con crearGrupoInfanteria()
     * @returns {Object} Estructura completa de personal embarcado
     */
    function crearPersonalEmbarcado(grupos) {
        if (!Array.isArray(grupos)) {
            grupos = [grupos];
        }

        let totalPersonal = 0;
        grupos.forEach(grupo => {
            totalPersonal += grupo.cantidad;
        });

        return {
            grupos: grupos,
            total_embarcados: totalPersonal,
            fecha_embarcacion: new Date().toISOString()
        };
    }

    // ============================================================================
    // FUNCIONES PARA CREAR MARCADORES DE VEHÍCULOS CON PERSONAL
    // ============================================================================

    /**
     * Crea las opciones completas para un marcador de vehículo con personal embarcado
     *
     * @param {Object} params - Parámetros del vehículo
     * @param {String} params.tipoVehiculo - ID del vehículo (ej: 'vctp_tam', 'm113')
     * @param {String} params.designacion - Designación del vehículo (ej: 'VCTP 1')
     * @param {String} params.dependencia - Dependencia (ej: 'Sec Inf Mec 1')
     * @param {Object} params.coordenadas - {lat, lng}
     * @param {String} params.sidc - Código SIDC
     * @param {Array} params.gruposEmbarcados - Array de grupos creados con crearGrupoInfanteria()
     * @param {String} params.equipo - Equipo ('azul', 'rojo', etc)
     * @returns {Object} Opciones completas para crear marcador Leaflet
     */
    function crearOpcionesVehiculoConPersonal(params) {
        const {
            tipoVehiculo,
            designacion,
            dependencia,
            coordenadas,
            sidc,
            gruposEmbarcados = [],
            equipo = 'azul',
            jugador = '',
            tipo = 'mecanizado'
        } = params;

        // Validación básica
        if (!tipoVehiculo || !designacion || !coordenadas || !sidc) {
            console.error('❌ Faltan parámetros obligatorios para crear vehículo con personal');
            return null;
        }

        // Crear estructura de personal embarcado
        let personalEmbarcado = null;
        if (gruposEmbarcados && gruposEmbarcados.length > 0) {
            personalEmbarcado = crearPersonalEmbarcado(gruposEmbarcados);
        }

        // Opciones del marcador (compatibles con sistema actual)
        const opciones = {
            // Identificación
            sidc: sidc,
            designacion: designacion,
            dependencia: dependencia,
            uniqueDesignation: designacion,
            higherFormation: dependencia,

            // Tipo y clasificación
            tipo: tipo,
            tipoVehiculo: tipoVehiculo,
            equipo: equipo,
            jugador: jugador,

            // 🎯 NUEVO: Personal embarcado (estructura BV8)
            personalEmbarcado: personalEmbarcado,

            // Coordenadas
            latlng: coordenadas,

            // Flags de compatibilidad
            draggable: true,
            esVehiculoConPersonal: true, // Flag para identificar estos elementos

            // Metadata
            fechaCreacion: new Date().toISOString()
        };

        return opciones;
    }

    /**
     * Crea un marcador Leaflet de vehículo con personal embarcado
     * IMPORTANTE: Este marcador ya incluye tripulación + embarcados
     * NO crear marcadores separados para los grupos
     *
     * @param {Object} params - Mismos parámetros que crearOpcionesVehiculoConPersonal()
     * @param {L.Map} mapa - Instancia del mapa Leaflet (opcional, si se quiere agregar directamente)
     * @returns {L.Marker} Marcador de Leaflet creado
     */
    function crearMarcadorVehiculoConPersonal(params, mapa = null) {
        const opciones = crearOpcionesVehiculoConPersonal(params);

        if (!opciones) {
            console.error('❌ No se pudieron crear las opciones del vehículo');
            return null;
        }

        const { coordenadas } = params;

        // Crear símbolo militar usando milsymbol
        let simbolo;
        try {
            if (typeof ms !== 'undefined') {
                const symbol = new ms.Symbol(opciones.sidc, {
                    size: 30,
                    uniqueDesignation: opciones.designacion,
                    higherFormation: opciones.dependencia
                });

                simbolo = symbol.asCanvas();
            } else {
                console.warn('⚠️ milsymbol no disponible, usando marcador simple');
                simbolo = null;
            }
        } catch (error) {
            console.error('❌ Error creando símbolo militar:', error);
            simbolo = null;
        }

        // Crear marcador Leaflet
        let marcador;
        if (simbolo && typeof L !== 'undefined') {
            const icon = L.icon({
                iconUrl: simbolo.toDataURL(),
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            marcador = L.marker([coordenadas.lat, coordenadas.lng], {
                icon: icon,
                ...opciones
            });
        } else if (typeof L !== 'undefined') {
            // Fallback: marcador simple sin símbolo
            marcador = L.marker([coordenadas.lat, coordenadas.lng], opciones);
        } else {
            console.error('❌ Leaflet no disponible');
            return null;
        }

        // Agregar al mapa si se proporcionó
        if (mapa && marcador) {
            marcador.addTo(mapa);
            console.log(`✅ Marcador de vehículo con personal agregado: ${opciones.designacion}`);
        }

        return marcador;
    }

    // ============================================================================
    // FUNCIONES PARA TRABAJAR CON VEHÍCULOS CON PERSONAL
    // ============================================================================

    /**
     * Verifica si un marcador es un vehículo con personal embarcado
     * @param {L.Marker} marcador - Marcador de Leaflet
     * @returns {Boolean}
     */
    function esVehiculoConPersonal(marcador) {
        return marcador?.options?.esVehiculoConPersonal === true ||
               marcador?.options?.personalEmbarcado !== null;
    }

    /**
     * Obtiene información resumida del personal embarcado en un vehículo
     * @param {L.Marker} marcador - Marcador del vehículo
     * @returns {Object|null} Información del personal o null
     */
    function obtenerInfoPersonalEmbarcado(marcador) {
        if (!esVehiculoConPersonal(marcador)) {
            return null;
        }

        const personalEmbarcado = marcador.options?.personalEmbarcado;

        if (!personalEmbarcado) {
            return null;
        }

        return {
            total_embarcados: personalEmbarcado.total_embarcados,
            cantidad_grupos: personalEmbarcado.grupos.length,
            grupos: personalEmbarcado.grupos.map(g => ({
                nombre: g.nombre,
                cantidad: g.cantidad
            }))
        };
    }

    /**
     * Simula desembarcar personal (convierte el vehículo en vehículo vacío)
     * NOTA: Esta funcionalidad es para el futuro, cuando se implemente
     * desembarco táctico de tropas
     *
     * @param {L.Marker} marcador - Marcador del vehículo
     * @returns {Object} Datos del personal desembarcado
     */
    function desembarcarPersonal(marcador) {
        if (!esVehiculoConPersonal(marcador)) {
            console.warn('⚠️ El marcador no es un vehículo con personal');
            return null;
        }

        const personalEmbarcado = marcador.options?.personalEmbarcado;

        if (!personalEmbarcado) {
            console.warn('⚠️ No hay personal embarcado para desembarcar');
            return null;
        }

        // Copiar datos del personal antes de eliminarlo
        const datosPersonalDesembarcado = JSON.parse(JSON.stringify(personalEmbarcado));

        // Limpiar personal embarcado del vehículo
        marcador.options.personalEmbarcado = null;
        marcador.options.esVehiculoConPersonal = false;

        console.log(`✅ Personal desembarcado de ${marcador.options.designacion}`);
        console.log(`   ${datosPersonalDesembarcado.total_embarcados} soldados en ${datosPersonalDesembarcado.grupos.length} grupos`);

        return datosPersonalDesembarcado;
    }

    /**
     * Simula embarcar personal en un vehículo
     * @param {L.Marker} marcador - Marcador del vehículo
     * @param {Array} grupos - Grupos a embarcar
     * @returns {Boolean} Éxito de la operación
     */
    function embarcarPersonal(marcador, grupos) {
        if (!marcador || !grupos) {
            console.error('❌ Faltan parámetros para embarcar personal');
            return false;
        }

        // Obtener datos BV8 del vehículo para verificar capacidad
        const datosVehiculo = window.obtenerDatosElemento?.(marcador);
        const capacidadMax = datosVehiculo?.bv8?.vehiculo?.tripulacion?.pasajeros || 0;

        // Calcular total de personal a embarcar
        const totalPersonalEmbarcar = grupos.reduce((total, grupo) => total + grupo.cantidad, 0);

        if (totalPersonalEmbarcar > capacidadMax) {
            console.error(`❌ Capacidad excedida: ${totalPersonalEmbarcar} soldados > ${capacidadMax} max`);
            return false;
        }

        // Crear estructura de personal embarcado
        const personalEmbarcado = crearPersonalEmbarcado(grupos);

        // Asignar al marcador
        marcador.options.personalEmbarcado = personalEmbarcado;
        marcador.options.esVehiculoConPersonal = true;

        console.log(`✅ Personal embarcado en ${marcador.options.designacion}`);
        console.log(`   ${personalEmbarcado.total_embarcados} soldados en ${personalEmbarcado.grupos.length} grupos`);

        return true;
    }

    // ============================================================================
    // EXPORTAR FUNCIONES
    // ============================================================================

    // Exportar al scope global
    window.crearGrupoInfanteria = crearGrupoInfanteria;
    window.crearPersonalEmbarcado = crearPersonalEmbarcado;
    window.crearOpcionesVehiculoConPersonal = crearOpcionesVehiculoConPersonal;
    window.crearMarcadorVehiculoConPersonal = crearMarcadorVehiculoConPersonal;
    window.esVehiculoConPersonal = esVehiculoConPersonal;
    window.obtenerInfoPersonalEmbarcado = obtenerInfoPersonalEmbarcado;
    window.desembarcarPersonal = desembarcarPersonal;
    window.embarcarPersonal = embarcarPersonal;

    // Exportar en namespace MAIRA
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.VehiculosConPersonal = {
        // Creación de estructuras
        crearGrupoInfanteria: crearGrupoInfanteria,
        crearPersonalEmbarcado: crearPersonalEmbarcado,
        crearOpcionesVehiculo: crearOpcionesVehiculoConPersonal,
        crearMarcador: crearMarcadorVehiculoConPersonal,

        // Utilidades
        esVehiculoConPersonal: esVehiculoConPersonal,
        obtenerInfoPersonal: obtenerInfoPersonalEmbarcado,
        desembarcar: desembarcarPersonal,
        embarcar: embarcarPersonal
    };

    console.log('✅ vehiculosConPersonal.js cargado - Lógica de vehículos con personal embarcado disponible');

})();
