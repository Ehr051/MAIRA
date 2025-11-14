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
     * Usa distancias REALES en metros (no píxeles)
     */
    calcularPosicionesDespliegue(posicionComandante, numeroSubordinados, formacion = 'linea') {
        if (!this.map || !posicionComandante) return [];

        // 📏 DISTANCIAS TÁCTICAS REALES EN METROS
        const config = this.orbatData?.configuracion?.desplieguePorDefecto || {
            distanciaEntreSub: 80,       // 80 metros entre subordinados
            offsetDesdeComandante: 100   // 100 metros desde comandante
        };

        const posiciones = [];
        const distanciaMetros = config.distanciaEntreSub;  // metros
        const offsetMetros = config.offsetDesdeComandante; // metros

        switch (formacion) {
            case 'linea':
                // Despliegue horizontal (Este-Oeste)
                const inicioLat = -(numeroSubordinados - 1) * distanciaMetros / 2;

                for (let i = 0; i < numeroSubordinados; i++) {
                    const offsetLat = inicioLat + (i * distanciaMetros);
                    const nuevaPos = this.calcularPosicionDesdeDistancia(
                        posicionComandante,
                        90,  // Bearing Este
                        offsetLat,
                        180, // Bearing Sur para offset
                        offsetMetros
                    );
                    posiciones.push(nuevaPos);
                }
                break;

            case 'columna':
                // Despliegue vertical (Norte-Sur)
                for (let i = 0; i < numeroSubordinados; i++) {
                    const nuevaPos = this.calcularPosicionDesdeDistancia(
                        posicionComandante,
                        180, // Bearing Sur
                        offsetMetros + (i * distanciaMetros)
                    );
                    posiciones.push(nuevaPos);
                }
                break;

            case 'cuña':
                // Formación en V
                const mitad = Math.floor(numeroSubordinados / 2);
                for (let i = 0; i < numeroSubordinados; i++) {
                    let bearing, distancia;
                    if (i < mitad) {
                        // Lado izquierdo de la V (Suroeste)
                        bearing = 225; // SW
                        distancia = offsetMetros + ((i + 1) * distanciaMetros);
                    } else {
                        // Lado derecho de la V (Sureste)
                        bearing = 135; // SE
                        const idx = i - mitad;
                        distancia = offsetMetros + ((idx + 1) * distanciaMetros);
                    }
                    const nuevaPos = this.calcularPosicionDesdeDistancia(
                        posicionComandante,
                        bearing,
                        distancia
                    );
                    posiciones.push(nuevaPos);
                }
                break;

            case 'escalon_derecha':
                // Escalonados a la derecha (SE)
                for (let i = 0; i < numeroSubordinados; i++) {
                    const bearing = 135; // SE
                    const distancia = offsetMetros + (i * distanciaMetros);
                    const nuevaPos = this.calcularPosicionDesdeDistancia(
                        posicionComandante,
                        bearing,
                        distancia
                    );
                    posiciones.push(nuevaPos);
                }
                break;

            case 'escalon_izquierda':
                // Escalonados a la izquierda (SW)
                for (let i = 0; i < numeroSubordinados; i++) {
                    const bearing = 225; // SW
                    const distancia = offsetMetros + (i * distanciaMetros);
                    const nuevaPos = this.calcularPosicionDesdeDistancia(
                        posicionComandante,
                        bearing,
                        distancia
                    );
                    posiciones.push(nuevaPos);
                }
                break;

            default:
                console.warn(`Formación desconocida: ${formacion}, usando línea`);
                return this.calcularPosicionesDespliegue(posicionComandante, numeroSubordinados, 'linea');
        }

        return posiciones;
    }

    /**
     * Calcula una nueva posición geográfica desde un punto, bearing y distancia
     * @param {L.LatLng} origen - Punto de origen
     * @param {Number} bearing1 - Bearing principal (grados 0-360)
     * @param {Number} distancia1 - Distancia en metros
     * @param {Number} bearing2 - Bearing secundario opcional
     * @param {Number} distancia2 - Distancia secundaria opcional
     * @returns {L.LatLng} Nueva posición
     */
    calcularPosicionDesdeDistancia(origen, bearing1, distancia1, bearing2 = null, distancia2 = 0) {
        const R = 6371000; // Radio de la Tierra en metros

        // Convertir a radianes
        const lat1 = origen.lat * Math.PI / 180;
        const lon1 = origen.lng * Math.PI / 180;
        const brng1 = bearing1 * Math.PI / 180;

        // Calcular nueva posición (bearing1 + distancia1)
        const lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(distancia1 / R) +
            Math.cos(lat1) * Math.sin(distancia1 / R) * Math.cos(brng1)
        );

        let lon2 = lon1 + Math.atan2(
            Math.sin(brng1) * Math.sin(distancia1 / R) * Math.cos(lat1),
            Math.cos(distancia1 / R) - Math.sin(lat1) * Math.sin(lat2)
        );

        // Si hay bearing/distancia secundaria, aplicarla
        if (bearing2 !== null && distancia2 > 0) {
            const brng2 = bearing2 * Math.PI / 180;
            const lat3 = Math.asin(
                Math.sin(lat2) * Math.cos(distancia2 / R) +
                Math.cos(lat2) * Math.sin(distancia2 / R) * Math.cos(brng2)
            );

            lon2 = lon2 + Math.atan2(
                Math.sin(brng2) * Math.sin(distancia2 / R) * Math.cos(lat2),
                Math.cos(distancia2 / R) - Math.sin(lat2) * Math.sin(lat3)
            );

            return L.latLng(lat3 * 180 / Math.PI, lon2 * 180 / Math.PI);
        }

        // Convertir de vuelta a grados
        return L.latLng(lat2 * 180 / Math.PI, lon2 * 180 / Math.PI);
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

        // 🔍 VALIDAR: Verificar si subordinados ya existen antes de crear
        // Si el padre ya tiene subordinados desplegados, restaurarlos en lugar de crear nuevos
        if (unidadPadre.subordinadosDesplegados && unidadPadre.subordinadosDesplegados.length > 0) {
            console.log('⚠️ Subordinados ya desplegados - restaurando en lugar de crear nuevos');
            
            // Restaurar subordinados existentes al mapa
            for (const subordinado of unidadPadre.subordinadosDesplegados) {
                if (subordinado && !this.map.hasLayer(subordinado)) {
                    subordinado.addTo(this.map);
                    subordinados.push(subordinado);
                    
                    // Restaurar estado guardado si existe
                    if (subordinado.unidadId && window.estadosUnidades) {
                        const estadoGuardado = window.estadosUnidades.get(subordinado.unidadId);
                        if (estadoGuardado) {
                            subordinado.estadoCombate = estadoGuardado;
                            console.log(`💾 Estado restaurado: ${subordinado.unidadId}`, estadoGuardado);
                        }
                    }
                }
            }
            
            unidadPadre.estaDesplegado = true;
            this.actualizarIconoPadre(unidadPadre, true);
            console.log(`✅ Restaurados ${subordinados.length} subordinados existentes`);
            return subordinados;
        }

        // Crear cada subordinado (SOLO si no existen)
        for (let i = 0; i < plantilla.subordinados.length; i++) {
            const subData = plantilla.subordinados[i];
            const posicion = posiciones[i];

            // Construir SIDC del subordinado
            const sidcSubordinado = this.construirSIDCSubordinado(
                sidcPadre,
                subData.tipo,
                subData.magnitud
            );

            // 🏷️ NOMENCLATURA AUTOMÁTICA: Generar nombre según doctrina argentina
            const nomenclatura = this.generarNombreSubordinado(
                unidadPadre,
                subData,
                i
            );

            // Crear marcador subordinado
            const subordinado = this.crearMarcadorSubordinado({
                sidc: sidcSubordinado,
                nombre: nomenclatura.nombreCompleto,    // "A/21"
                asignacion: nomenclatura.asignacion,     // "A"
                dependencia: nomenclatura.dependencia,   // "21
                posicion: posicion,
                equipoPadre: unidadPadre.options.equipo,
                jugadorPadre: unidadPadre.options.jugador, // ✅ AGREGADO: jugador propietario
                comandante: unidadPadre.options.id || unidadPadre.options.nombre,
                designacionPadre: unidadPadre.options.designacion, // Padre (ej: "11/XX")
                dependenciaPadre: unidadPadre.options.dependencia // ✅ Heredar dependencia recursiva
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

        // ✅ Emitir evento via EventBus
        if (window.eventBus) {
            window.eventBus.emit('subordinadosDesplegados', {
                comandante: unidadPadre,
                subordinados: subordinados,
                formacion: formacion
            });
        }

        // ✅ NUEVO: CustomEvent (compatible con document.addEventListener)
        const eventoDespliegue = new CustomEvent('subordinadosDesplegados', {
            detail: {
                comandante: unidadPadre,
                subordinados: subordinados,
                formacion: formacion
            }
        });
        document.dispatchEvent(eventoDespliegue);
        console.log('📡 CustomEvent subordinadosDesplegados disparado');

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
            // Crear símbolo militar (sin texto, lo agregamos después)
            const symbol = new ms.Symbol(config.sidc, { size: 35 });

            // Crear marcador con todas las propiedades necesarias
            const marcador = L.marker(config.posicion, {
                icon: L.divIcon({
                    className: 'milsymbol-marker',
                    html: symbol.asSVG(),
                    iconSize: [70, 50],
                    iconAnchor: [35, 25]
                }),
                draggable: (function() {
                    // ✅ RESPETAR FASE al crear hijo
                    if (window.faseManager) {
                        const fase = (window.faseManager.fase || '').toLowerCase();
                        const permitido = fase === 'preparacion' || fase === 'despliegue';
                        console.log(`🔍 Creando hijo - Fase: ${fase}, Draggable: ${permitido}`);
                        return permitido;
                    }
                    return true;
                })(), // ✅ Hacer draggable SOLO en prep/despliegue
                sidc: config.sidc,
                nombre: config.nombre, // Nombre completo "A/21" para display
                designacion: config.asignacion, // 🏷️ Asignación del hijo (ej: "A", "1")
                dependencia: config.dependencia, // 🏷️ Dependencia = padre (ej: "21", "11/XX")
                equipo: config.equipoPadre,
                jugador: config.jugadorPadre,
                comandante: config.comandante,
                magnitud: config.sidc.charAt(11) || '-',
                estado: 'operativo',
                id: `${config.comandante}_${config.nombre.replace(/\//g, '-').replace(/\s/g, '_')}_${Date.now()}`
            });

            // Agregar al mapa
            if (window.calcoActivo) {
                window.calcoActivo.addLayer(marcador);
            } else {
                marcador.addTo(this.map);
            }

            // 🏷️ ETIQUETA: Agregar texto designación/dependencia (como edicioncompleto.js)
            this.actualizarEtiquetaUnidad(marcador);

            // 🏷️ Tooltip: Asignación + Dependencia (properties separadas)
            // Ejemplo: "A 21" donde A es asignación, 21 es dependencia
            const asignacionTooltip = config.asignacion || 'S/N';
            const dependenciaTooltip = config.dependencia || '-';
            const tooltipText = `${asignacionTooltip} ${dependenciaTooltip}`;
            marcador.bindTooltip(tooltipText, {
                permanent: false,
                direction: 'top',
                className: 'tooltip-militar'
            });

            // ✅ DISPARAR EVENTO para que aparezca en lista de elementos
            if (window.faseManager) {
                const evento = new CustomEvent('elementoAgregado', {
                    detail: {
                        marcador: marcador,
                        sidc: config.sidc,
                        nombre: config.nombre,
                        equipo: config.equipoPadre || null,
                        jugador: config.jugadorPadre || null
                    }
                });
                document.dispatchEvent(evento);
                console.log('📡 Subordinado agregado al panel:', config.nombre);
            }

            // 🎖️ SISTEMA DE ESTADO PERSISTENTE
            // Inicializar estado de combate del subordinado
            marcador.estadoCombate = {
                salud: 100,          // 0-100%
                combustible: 100,    // 0-100%
                municion: 100,       // 0-100%
                moral: 100,          // 0-100%
                fatiga: 0,           // 0-100%
                bajas: 0,            // Número absoluto
                tiempoCreacion: Date.now(),
                ultimaActualizacion: Date.now()
            };
            
            // 🔑 ID único persistente basado en SIDC + nombre
            marcador.unidadId = `${config.sidc}-${config.nombre}`.replace(/[^a-zA-Z0-9-]/g, '_');
            
            // Guardar en registro global de estados
            if (!window.estadosUnidades) {
                window.estadosUnidades = new Map();
            }
            window.estadosUnidades.set(marcador.unidadId, marcador.estadoCombate);
            console.log(`💾 Estado inicial guardado: ${marcador.unidadId}`, marcador.estadoCombate);

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
     * 🏷️ NOMENCLATURA AUTOMÁTICA: Genera nombre según doctrina argentina
     * Reglas:
     * - Si tiene nombre específico (Mor, Expl) → nombre/designacion_padre
     * - Si tiene letra → letra/designacion_padre
     * - Si no tiene nada → generar letra automática (A, B, C...)
     *
     * Ejemplos:
     * - Padre "14" + letra "1" → "1/14"
     * - Padre "Suipacha" + letra "A" → "A/Suipacha"
     * - Padre "A/14" + letra "1" → "1/A"
     * - Padre "14" + nombre "Mor" → "Mor/14"
     */
    generarNombreSubordinado(unidadPadre, subData, indice) {
        // 1. Obtener designación del padre
        let designacionPadre = unidadPadre.options.designacion ||
                               unidadPadre.options.nombre ||
                               'Unidad';

        // 2. Determinar letra/nombre del subordinado
        let letraSubordinado = null;

        // 2a. Si tiene nombre específico (Mor, Expl, Franqueo, etc.)
        if (subData.nombre && !subData.nombre.includes('Sección') &&
            !subData.nombre.includes('Grupo') && !subData.nombre.includes('Pelotón')) {
            letraSubordinado = subData.nombre;
        }
        // 2b. Si tiene letra definida en ORBAT.json
        else if (subData.letra) {
            letraSubordinado = subData.letra;
        }
        // 2c. Generar letra automática (A, B, C, ...)
        else {
            // Para unidades: A, B, C, D...
            // Para secciones de compañías argentinas: 1, 2, 3...
            const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            const numeros = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

            // Si el padre es compañía/escuadrón (E,F), usar números para subordinados
            const magnitudPadre = this.extraerMagnitud(unidadPadre.options.sidc);
            if (magnitudPadre === 'E' || magnitudPadre === 'F') {
                letraSubordinado = numeros[indice] || `${indice + 1}`;
            } else {
                letraSubordinado = letras[indice] || String.fromCharCode(65 + indice);
            }
        }

        // 3. Retornar OBJETO con asignación y dependencia SEPARADAS
        // Asignación = letra del hijo (A, B, 1, 2, etc)
        // Dependencia = designación del padre (21, 11/XX, etc)
        const nomenclatura = {
            asignacion: letraSubordinado,      // "A", "B", "1", etc.
            dependencia: designacionPadre,     // "21", "11/XX", etc.
            nombreCompleto: `${letraSubordinado}/${designacionPadre}` // "A/21" (para display)
        };

        console.log(`📝 Nomenclatura: Asignación="${nomenclatura.asignacion}" Dependencia="${nomenclatura.dependencia}" → "${nomenclatura.nombreCompleto}"`);

        return nomenclatura;
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

        // ✅ Emitir evento via EventBus
        if (window.eventBus) {
            window.eventBus.emit('subordinadosReagrupados', {
                comandante: unidadPadre,
                cantidad: cantidad
            });
        }

        // ✅ NUEVO: CustomEvent (compatible con document.addEventListener)
        const eventoReagrupacion = new CustomEvent('subordinadosReagrupados', {
            detail: {
                comandante: unidadPadre,
                cantidad: cantidad
            }
        });
        document.dispatchEvent(eventoReagrupacion);
        console.log('📡 CustomEvent subordinadosReagrupados disparado');

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
     * 🏷️ Actualizar etiqueta de unidad con designación/dependencia
     * EXACTAMENTE como edicioncompleto.js
     */
    actualizarEtiquetaUnidad(elemento) {
        if (!elemento || !elemento.options) return;

        // Remover etiqueta existente
        if (elemento.etiquetaPersonalizada) {
            if (this.map && this.map.hasLayer(elemento.etiquetaPersonalizada)) {
                this.map.removeLayer(elemento.etiquetaPersonalizada);
            }
            elemento.etiquetaPersonalizada = null;
        }

        // Construir etiqueta con formato correcto
        const designacion = elemento.options.designacion || '';
        const dependencia = elemento.options.dependencia || '';
        let etiqueta = '';
        
        if (designacion && dependencia) {
            etiqueta = `${designacion}/${dependencia}`;
        } else if (designacion) {
            etiqueta = designacion;
        } else if (dependencia) {
            etiqueta = dependencia;
        }

        // No crear etiqueta si no hay texto
        if (!etiqueta.trim()) return;

        // Guardar texto original
        elemento.etiquetaTexto = etiqueta;
        
        // Función que actualiza la posición de la etiqueta
        const actualizarPosicionEtiqueta = function() {
            if (!elemento || !elemento._icon) return;
            
            // Crear o actualizar el div de etiqueta
            let etiquetaDiv = elemento._icon.querySelector('.etiqueta-unidad');
            if (!etiquetaDiv) {
                etiquetaDiv = document.createElement('div');
                etiquetaDiv.className = 'etiqueta-unidad';
                etiquetaDiv.style.cssText = `
                    position: absolute;
                    bottom: -10px;
                    right: -5px;
                    color: black;
                    font-weight: bold;
                    white-space: nowrap;
                    text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
                    pointer-events: none;
                    z-index: 1000;
                `;
                elemento._icon.appendChild(etiquetaDiv);
            }
            
            etiquetaDiv.textContent = elemento.etiquetaTexto;
        };
        
        // Aplicar inicialmente
        actualizarPosicionEtiqueta();
        
        // Actualizar cuando cambie el zoom o se agregue al mapa
        elemento.off('add');
        elemento.on('add', actualizarPosicionEtiqueta);
        
        if (this.map) {
            this.map.off('zoomend', actualizarPosicionEtiqueta);
            this.map.on('zoomend', actualizarPosicionEtiqueta);
        }
    }


    /**
     * Actualiza el icono del padre para indicar si está desplegado
     * Al desplegar: Convierte a Puesto Comando (SIDC pos 10 = 'A')
     * Al reagrupar: Restaura a normal (SIDC pos 10 = '-')
     */
    actualizarIconoPadre(unidadPadre, estaDesplegado) {
        if (!unidadPadre || !unidadPadre.options || !unidadPadre.options.sidc) return;

        try {
            // 🏛️ CONVERSIÓN A PUESTO COMANDO
            let sidcActual = unidadPadre.options.sidc;
            let sidcNuevo = sidcActual;

            if (estaDesplegado) {
                // Convertir a Puesto Comando (Headquarters): posición 10 = 'A'
                // Preservar si ya era Task Force ('E' o 'D')
                const modificadorActual = sidcActual.charAt(10);
                if (modificadorActual === 'E') {
                    // Ya es Task Force, convertir a HQ + Task Force
                    sidcNuevo = sidcActual.substring(0, 10) + 'D' + sidcActual.substring(11);
                } else if (modificadorActual !== 'A' && modificadorActual !== 'D') {
                    // Convertir a solo Headquarters
                    sidcNuevo = sidcActual.substring(0, 10) + 'A' + sidcActual.substring(11);
                }
                console.log(`🏛️ Convirtiendo a Puesto Comando: ${sidcActual} → ${sidcNuevo}`);
            } else {
                // Restaurar a normal: posición 10 = '-'
                sidcNuevo = sidcActual.substring(0, 10) + '-' + sidcActual.substring(11);
                console.log(`🔄 Restaurando a normal: ${sidcActual} → ${sidcNuevo}`);
            }

            // Actualizar SIDC en options
            unidadPadre.options.sidc = sidcNuevo;

            // Crear símbolo con el SIDC nuevo
            const symbol = new ms.Symbol(sidcNuevo, {
                size: 30
            });

            // Crear nuevo icono con indicador verde si está desplegado
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
