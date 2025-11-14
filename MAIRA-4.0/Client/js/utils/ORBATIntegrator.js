/**
 * ORBATIntegrator.js
 * Vincula elementos del mapa con plantillas ORBAT para asignar recursos automáticamente
 *
 * Flujo:
 * 1. Usuario crea elemento "Sección Inf Mec"
 * 2. Sistema lee ORBAT.json → encuentra plantilla de Sección Mecanizada
 * 3. Asigna automáticamente: 4 VCTP, 33 soldados, munición, combustible, raciones
 * 4. Calcula stats agregados
 * 5. Si desplieg → divide recursos entre padre (PC) e hijos (secciones)
 */

(function() {
    'use strict';

    // ============================================================================
    // CARGA DE ORBAT
    // ============================================================================

    /**
     * Carga el archivo ORBAT.json
     * @returns {Promise<Object>} Datos del ORBAT
     */
    async function cargarORBAT() {
        try {
            const response = await fetch('js/modules/juegoV2/config/ORBAT.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Guardar en objeto global MAIRA
            if (!window.MAIRA) {
                window.MAIRA = {};
            }
            window.MAIRA.ORBAT = data;

            console.log('✅ ORBAT cargado');
            console.log(`   ${Object.keys(data.plantillas || {}).length} tipos de unidades`);

            return data;
        } catch (error) {
            console.error('❌ Error cargando ORBAT.json:', error);
            return null;
        }
    }

    // ============================================================================
    // EXTRACCIÓN DE PLANTILLA DESDE SIDC
    // ============================================================================

    /**
     * Obtiene el código de arma desde un SIDC
     * @param {String} sidc - Código SIDC completo
     * @returns {String} Código de arma (ej: 'UCI' para infantería)
     */
    function obtenerCodigoArmaSIDC(sidc) {
        if (!sidc || sidc.length < 10) return null;

        // Posiciones 4-6 del SIDC contienen el código de arma
        const codigo = sidc.substring(4, 10);

        // Mapeo de códigos SIDC a códigos ORBAT
        const mapeo = {
            'UCI---': 'UCI',  // Infantería
            'UCV---': 'UCV',  // Caballería/Blindados
            'UCF---': 'UCF',  // Artillería
            'UCE---': 'UCE',  // Ingenieros
            'UCS---': 'UCS',  // Apoyo
            'UCSSS-': 'UCSSS' // Logística
        };

        // Buscar match exacto o parcial
        for (const [patron, codigoORBAT] of Object.entries(mapeo)) {
            if (codigo.startsWith(patron.substring(0, 3))) {
                return codigoORBAT;
            }
        }

        return 'UCI'; // Fallback a infantería
    }

    /**
     * Obtiene la magnitud desde un SIDC
     * @param {String} sidc - Código SIDC completo
     * @returns {String} Letra de magnitud (ej: 'E' para compañía)
     */
    function obtenerMagnitudSIDC(sidc) {
        if (!sidc || sidc.length < 12) return null;
        return sidc.charAt(11);
    }

    /**
     * Busca la plantilla ORBAT para un elemento según su SIDC
     * @param {String} sidc - Código SIDC del elemento
     * @returns {Object|null} Plantilla ORBAT o null si no se encuentra
     */
    function buscarPlantillaORBAT(sidc) {
        const orbat = window.MAIRA?.ORBAT;
        if (!orbat || !orbat.plantillas) {
            console.warn('⚠️ ORBAT no cargado');
            return null;
        }

        const codigoArma = obtenerCodigoArmaSIDC(sidc);
        const magnitud = obtenerMagnitudSIDC(sidc);

        if (!codigoArma || !magnitud) {
            console.warn('⚠️ No se pudo extraer arma/magnitud del SIDC:', sidc);
            return null;
        }

        const plantillaArma = orbat.plantillas[codigoArma];
        if (!plantillaArma) {
            console.warn(`⚠️ No hay plantilla para arma: ${codigoArma}`);
            return null;
        }

        const plantillaMagnitud = plantillaArma[magnitud];
        if (!plantillaMagnitud) {
            console.warn(`⚠️ No hay plantilla para magnitud ${magnitud} en ${codigoArma}`);
            return null;
        }

        console.log(`✅ Plantilla ORBAT encontrada: ${codigoArma} magnitud ${magnitud}`);
        return {
            arma: codigoArma,
            magnitud: magnitud,
            plantilla: plantillaMagnitud,
            info_magnitud: orbat.magnitudes[magnitud]
        };
    }

    // ============================================================================
    // ASIGNACIÓN DE RECURSOS DESDE ORBAT
    // ============================================================================

    /**
     * Calcula recursos totales de un elemento según ORBAT
     * @param {String} sidc - Código SIDC del elemento
     * @param {String} tipo - Tipo específico (ej: 'Mecanizada', 'Blindada')
     * @returns {Object} Recursos calculados
     */
    function calcularRecursosDesdeORBAT(sidc, tipo) {
        const datosPlantilla = buscarPlantillaORBAT(sidc);
        if (!datosPlantilla) {
            return null;
        }

        const plantilla = datosPlantilla.plantilla;

        // Personal total
        const personalTotal = plantilla._personal || datosPlantilla.info_magnitud?.personal_promedio || 0;

        // Determinar vehículos según tipo
        let vehiculos = [];
        const cantidadVehiculos = plantilla._vehiculos || 0;

        if (tipo && tipo.toLowerCase().includes('mecanizada')) {
            // Infantería Mecanizada → VCTP o M113
            for (let i = 0; i < cantidadVehiculos; i++) {
                vehiculos.push({
                    tipo: 'vctp_tam',
                    designacion: `VCTP ${i + 1}`,
                    personalEmbarcado: Math.floor(personalTotal / cantidadVehiculos)
                });
            }
        } else if (tipo && tipo.toLowerCase().includes('blindada')) {
            // Caballería Blindada → TAM
            for (let i = 0; i < cantidadVehiculos; i++) {
                vehiculos.push({
                    tipo: 'tam_tanque',
                    designacion: `TAM ${i + 1}`,
                    personalEmbarcado: 0 // Los tanques no llevan personal embarcado, solo tripulación
                });
            }
        } else if (tipo && tipo.toLowerCase().includes('motorizada')) {
            // Infantería Motorizada → VLEGA
            for (let i = 0; i < cantidadVehiculos; i++) {
                vehiculos.push({
                    tipo: 'vlega',
                    designacion: `VLEGA ${i + 1}`,
                    personalEmbarcado: Math.floor(personalTotal / cantidadVehiculos)
                });
            }
        } else if (cantidadVehiculos > 0) {
            // Fallback genérico
            for (let i = 0; i < cantidadVehiculos; i++) {
                vehiculos.push({
                    tipo: 'unimog',
                    designacion: `Veh ${i + 1}`,
                    personalEmbarcado: Math.floor(personalTotal / cantidadVehiculos)
                });
            }
        }

        // Calcular recursos agregados de todos los vehículos
        let combustibleTotal = 0;
        let municionTotal = {};
        let aguaTotal = 0;
        let racionesTotal = 0;

        vehiculos.forEach(veh => {
            const datosVehiculo = window.MAIRA?.velocidadesReales?.vehiculos?.[veh.tipo];
            if (datosVehiculo) {
                // Combustible
                combustibleTotal += datosVehiculo.dotacion_inicial?.combustible_litros || 0;

                // Munición del vehículo
                const municionVeh = datosVehiculo.dotacion_inicial?.municion || {};
                for (const [tipoMun, cant] of Object.entries(municionVeh)) {
                    municionTotal[tipoMun] = (municionTotal[tipoMun] || 0) + cant;
                }

                // Agua de tripulación
                const tripulacion = datosVehiculo.tripulacion?.total || 0;
                aguaTotal += tripulacion * 3.5;

                // Raciones de tripulación
                racionesTotal += tripulacion * (datosVehiculo.dotacion_inicial?.raciones_dias || 3);

                // Agua y raciones de personal embarcado
                if (veh.personalEmbarcado > 0) {
                    aguaTotal += veh.personalEmbarcado * 3.5;
                    racionesTotal += veh.personalEmbarcado * 3;
                }

                // Munición de personal embarcado (FAL 7.62mm)
                if (veh.personalEmbarcado > 0) {
                    const municionPersonal = veh.personalEmbarcado * 200; // 200 tiros por soldado
                    municionTotal['municion_762'] = (municionTotal['municion_762'] || 0) + municionPersonal;
                }
            }
        });

        return {
            personal_total: personalTotal,
            vehiculos: vehiculos,
            recursos_agregados: {
                combustible_litros: combustibleTotal,
                municion: municionTotal,
                agua_litros: aguaTotal,
                raciones_total: racionesTotal
            },
            plantilla: datosPlantilla
        };
    }

    /**
     * Asigna recursos ORBAT a un marcador de Leaflet
     * @param {L.Marker} marcador - Marcador del elemento
     * @param {String} sidc - Código SIDC
     * @param {String} tipo - Tipo específico del elemento
     */
    function asignarRecursosORBATAlMarcador(marcador, sidc, tipo) {
        const recursos = calcularRecursosDesdeORBAT(sidc, tipo);
        if (!recursos) {
            console.warn('⚠️ No se pudieron calcular recursos ORBAT');
            return false;
        }

        // Asignar recursos al marcador
        marcador.options.orbat_recursos = recursos;
        marcador.options.personal_total = recursos.personal_total;
        marcador.options.vehiculos_asignados = recursos.vehiculos;

        // Si hay un solo vehículo principal, asignarlo como tipoVehiculo
        if (recursos.vehiculos.length === 1) {
            marcador.options.tipoVehiculo = recursos.vehiculos[0].tipo;
        } else if (recursos.vehiculos.length > 1) {
            // Si hay múltiples vehículos, usar el primero como principal
            marcador.options.tipoVehiculo = recursos.vehiculos[0].tipo;
            marcador.options.esUnidadMultivehiculo = true;
        }

        console.log(`✅ Recursos ORBAT asignados a ${marcador.options.designacion}:`, {
            personal: recursos.personal_total,
            vehiculos: recursos.vehiculos.length,
            combustible: recursos.recursos_agregados.combustible_litros,
            municion_tipos: Object.keys(recursos.recursos_agregados.municion).length
        });

        return true;
    }

    // ============================================================================
    // SISTEMA DE DESPLIEGUE/REPLIEGUE
    // ============================================================================

    /**
     * Despliega un elemento en sus subordinados según ORBAT
     * @param {L.Marker} marcadorPadre - Elemento a desplegar
     * @param {L.Map} mapa - Mapa de Leaflet
     * @returns {Array<L.Marker>} Marcadores de subordinados creados
     */
    function desplegarElemento(marcadorPadre, mapa) {
        const sidc = marcadorPadre.options.sidc;
        const datosPlantilla = buscarPlantillaORBAT(sidc);

        if (!datosPlantilla || !datosPlantilla.plantilla.subordinados) {
            console.warn('⚠️ No hay subordinados definidos en ORBAT para este elemento');
            return [];
        }

        const subordinados = datosPlantilla.plantilla.subordinados;
        const posicionPadre = marcadorPadre.getLatLng();
        const marcadoresHijos = [];

        // Offset para posicionar subordinados alrededor del padre
        const offsetRadio = 0.005; // ~500m
        let angulo = 0;
        const incrementoAngulo = (2 * Math.PI) / subordinados.length;

        subordinados.forEach((sub, index) => {
            // Calcular posición relativa
            const offsetLat = offsetRadio * Math.cos(angulo);
            const offsetLng = offsetRadio * Math.sin(angulo);

            const posicionHijo = {
                lat: posicionPadre.lat + offsetLat,
                lng: posicionPadre.lng + offsetLng
            };

            // Crear SIDC del hijo (misma afiliación/estado, diferente magnitud)
            const sidcHijo = sidc.substring(0, 4) + sub.tipo + sidc.substring(10, 11) + sub.magnitud;

            // Crear designación del hijo
            let designacionHijo;
            if (sub.letra) {
                designacionHijo = `Cia ${sub.letra}`;
            } else if (sub.nombre) {
                designacionHijo = sub.nombre;
            } else {
                designacionHijo = `Sec ${index + 1}`;
            }

            // Crear símbolo
            const sym = new ms.Symbol(sidcHijo, { size: 35 });
            const icon = L.divIcon({
                className: `custom-div-icon equipo-${marcadorPadre.options.equipo}`,
                html: sym.asSVG(),
                iconSize: [70, 50],
                iconAnchor: [35, 25]
            });

            // Crear marcador hijo
            const marcadorHijo = L.marker([posicionHijo.lat, posicionHijo.lng], {
                draggable: true,
                id: `${marcadorPadre.options.id}_sub_${index}`,
                sidc: sidcHijo,
                designacion: designacionHijo,
                dependencia: marcadorPadre.options.designacion,
                magnitud: sub.magnitud,
                tipo: sub.tipo,
                equipo: marcadorPadre.options.equipo,
                jugador: marcadorPadre.options.jugador,
                esDesplegado: true,
                elementoPadreId: marcadorPadre.options.id
            });

            marcadorHijo.setIcon(icon);
            marcadorHijo.addTo(mapa);

            // Asignar recursos ORBAT al hijo
            asignarRecursosORBATAlMarcador(marcadorHijo, sidcHijo, marcadorPadre.options.tipo);

            marcadoresHijos.push(marcadorHijo);

            // Incrementar ángulo para el siguiente
            angulo += incrementoAngulo;
        });

        // Marcar el padre como desplegado y convertir a PC
        marcadorPadre.options.estaDesplegado = true;
        marcadorPadre.options.subordinadosIds = marcadoresHijos.map(m => m.options.id);

        // TODO: Recalcular recursos del padre (solo plana mayor)
        // Por ahora dejamos los recursos completos en el padre

        console.log(`✅ Elemento ${marcadorPadre.options.designacion} desplegado en ${marcadoresHijos.length} subordinados`);

        return marcadoresHijos;
    }

    /**
     * Repliega un elemento (reunir subordinados con el padre)
     * @param {L.Marker} marcadorPadre - Elemento a replegar
     * @param {L.Map} mapa - Mapa de Leaflet
     * @param {L.LayerGroup} calco - Calco donde están los elementos
     * @returns {Boolean} Éxito de la operación
     */
    function replegarElemento(marcadorPadre, mapa, calco) {
        if (!marcadorPadre.options.estaDesplegado || !marcadorPadre.options.subordinadosIds) {
            console.warn('⚠️ El elemento no está desplegado');
            return false;
        }

        const subordinadosIds = marcadorPadre.options.subordinadosIds;
        let subordinadosEliminados = 0;

        // Buscar y eliminar subordinados
        calco.eachLayer((layer) => {
            if (layer instanceof L.Marker && subordinadosIds.includes(layer.options.id)) {
                calco.removeLayer(layer);
                subordinadosEliminados++;
            }
        });

        // Marcar padre como reunido
        marcadorPadre.options.estaDesplegado = false;
        delete marcadorPadre.options.subordinadosIds;

        // TODO: Recalcular recursos del padre (plana mayor + secciones)
        // Por ahora restauramos los recursos completos

        console.log(`✅ Elemento ${marcadorPadre.options.designacion} replegado (${subordinadosEliminados} subordinados eliminados)`);

        return true;
    }

    // ============================================================================
    // EXPORTAR FUNCIONES
    // ============================================================================

    // Exportar al scope global
    window.cargarORBAT = cargarORBAT;
    window.buscarPlantillaORBAT = buscarPlantillaORBAT;
    window.calcularRecursosDesdeORBAT = calcularRecursosDesdeORBAT;
    window.asignarRecursosORBATAlMarcador = asignarRecursosORBATAlMarcador;
    window.desplegarElemento = desplegarElemento;
    window.replegarElemento = replegarElemento;

    // Exportar en namespace MAIRA
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.ORBATIntegrator = {
        cargar: cargarORBAT,
        buscarPlantilla: buscarPlantillaORBAT,
        calcularRecursos: calcularRecursosDesdeORBAT,
        asignarRecursos: asignarRecursosORBATAlMarcador,
        desplegar: desplegarElemento,
        replegar: replegarElemento
    };

    console.log('✅ ORBATIntegrator.js cargado - Sistema de vinculación ORBAT disponible');

})();
