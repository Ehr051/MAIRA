/**
 * 🗺️ MÓDULO ANÁLISIS DE TERRENO - MAIRA 4.0
 * 
 * Sistema de capas múltiples para análisis integral del terreno:
 * - 📐 Altimetría (pendientes, COTA, talud)
 * - 🌳 Vegetación (bosque, arboleda, matorrales)
 * - 🚧 Obstáculos (ríos, edificaciones, minas)
 * - 🛣️ Avenidas de aproximación
 * - 📊 Análisis combinado
 * 
 * Integra algoritmos BV8:
 * - Algoritmo Horn (pendientes 3x3)
 * - OCOTA (intervisibilidad)
 * - Transitabilidad (suelo×clima×vehículo×pendiente)
 */

class AnalisisTerreno {
    constructor(map) {
        this.map = map;
        this.modalActivo = false;
        this.poligonoActual = null;
        this.capaResultados = null;
        this.drawControl = null;
        this.resolucion = 50; // metros (25, 50, o 100)
        this.chartPendientes = null;
        
        // Configuración
        this.config = {
            apiUrl: 'http://localhost:5001/api/terreno',
            coloresPendientes: {
                '0-5': '#2ecc71',      // Verde - Transitable
                '5-15': '#f1c40f',     // Amarillo - Precaución
                '15-30': '#e67e22',    // Naranja - Difícil
                '30+': '#e74c3c'       // Rojo - Muy difícil
            }
        };
        
        console.log('🗺️ Módulo Análisis de Terreno inicializado');
    }

    /**
     * Inicializa el módulo
     */
    inicializar() {
        this.crearBotonHerramientas();
        this.crearModal();
        this.inicializarLeafletDraw();
        console.log('✅ Análisis de Terreno listo');
    }

    /**
     * Crea el botón en el menú de Herramientas
     */
    crearBotonHerramientas() {
        const menuHerramientas = document.getElementById('herramientas-menu');
        if (!menuHerramientas) {
            console.warn('⚠️ No se encontró el menú de herramientas');
            return;
        }

        // Crear botón después de "Cálculo de Marcha"
        const btnCalculoMarcha = document.getElementById('btnCalculoMarcha');
        if (btnCalculoMarcha) {
            const btnAnalisisTerreno = document.createElement('a');
            btnAnalisisTerreno.href = '#';
            btnAnalisisTerreno.id = 'btnAnalisisTerreno';
            btnAnalisisTerreno.innerHTML = '<i class="fas fa-mountain"></i> Análisis de Terreno';
            btnAnalisisTerreno.addEventListener('click', (e) => {
                e.preventDefault();
                this.abrirModal();
            });

            btnCalculoMarcha.insertAdjacentElement('afterend', btnAnalisisTerreno);
            console.log('✅ Botón "Análisis de Terreno" agregado al menú');
        }
    }

    /**
     * Crea el modal de análisis de terreno
     */
    crearModal() {
        const modalHTML = `
            <div id="modalAnalisisTerreno" class="modal-analisis-terreno" style="display: none;">
                <div class="modal-analisis-content">
                    <!-- Header -->
                    <div class="modal-analisis-header">
                        <h2><i class="fas fa-mountain"></i> Análisis de Terreno</h2>
                        <button class="btn-cerrar-modal" onclick="window.analisisTerreno.cerrarModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Instrucciones -->
                    <div class="modal-analisis-instrucciones">
                        <p>
                            <i class="fas fa-info-circle"></i>
                            <strong>1.</strong> Dibuje un polígono en el mapa delimitando la zona a analizar
                        </p>
                        <p>
                            <strong>2.</strong> Configure los parámetros del análisis
                        </p>
                        <p>
                            <strong>3.</strong> Presione "Analizar Terreno"
                        </p>
                    </div>

                    <!-- Panel de parámetros -->
                    <div class="modal-analisis-parametros">
                        <h3>⚙️ Parámetros del Análisis</h3>
                        
                        <div class="param-group">
                            <label for="selectTipoVehiculo">
                                <i class="fas fa-truck-military"></i> Tipo de Vehículo:
                            </label>
                            <select id="selectTipoVehiculo">
                                <option value="Infanteria">Infantería (a pie)</option>
                                <option value="TAM">TAM (Tanque Argentino Mediano)</option>
                                <option value="VCTP">VCTP (Vehículo Combate Transporte Personal)</option>
                                <option value="VLEGA">VLEGA (Vehículo Ligero Ejército Argentino)</option>
                                <option value="Unimog">Unimog (Camión todo terreno)</option>
                                <option value="VCPC">VCPC (Vehículo Combate Puesto Comando)</option>
                            </select>
                        </div>

                        <div class="param-group">
                            <label for="selectClima">
                                <i class="fas fa-cloud-sun"></i> Condiciones Climáticas:
                            </label>
                            <select id="selectClima">
                                <option value="seco">Seco (normal)</option>
                                <option value="lluvioso">Lluvioso (reducida transitabilidad)</option>
                                <option value="nieve">Nieve (muy reducida)</option>
                            </select>
                        </div>

                        <div class="param-group">
                            <label for="selectResolucion">
                                <i class="fas fa-ruler-combined"></i> Resolución del Análisis:
                            </label>
                            <select id="selectResolucion">
                                <option value="25">25 metros (Alta precisión - más lento)</option>
                                <option value="50" selected>50 metros (Balanceado - recomendado)</option>
                                <option value="100">100 metros (Rápido - menor precisión)</option>
                            </select>
                            <small style="color: #888; font-size: 0.85em;">
                                💡 La resolución determina el tamaño de cada cuadrado de análisis
                            </small>
                        </div>

                        <div class="param-group">
                            <label for="selectTipoAnalisis">
                                <i class="fas fa-layer-group"></i> Capas a Analizar:
                            </label>
                            <div class="checkbox-group">
                                <label>
                                    <input type="checkbox" id="checkPendientes" checked>
                                    📐 Pendientes y Talud
                                </label>
                                <label>
                                    <input type="checkbox" id="checkTransitabilidad" checked>
                                    🚗 Transitabilidad
                                </label>
                                <label>
                                    <input type="checkbox" id="checkIntervisibilidad">
                                    👁️ Intervisibilidad (OCOTA)
                                </label>
                                <label>
                                    <input type="checkbox" id="checkVegetacion">
                                    🌳 Vegetación (si disponible)
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="modal-analisis-acciones">
                        <button id="btnDibujarPoligono" class="btn-primary">
                            <i class="fas fa-draw-polygon"></i> Dibujar Polígono
                        </button>
                        <button id="btnAnalizarTerreno" class="btn-success" disabled>
                            <i class="fas fa-chart-area"></i> Analizar Terreno
                        </button>
                        <button id="btnLimpiarAnalisis" class="btn-secondary">
                            <i class="fas fa-eraser"></i> Limpiar
                        </button>
                    </div>

                    <!-- Panel de resultados (inicialmente oculto) -->
                    <div id="panelResultados" class="modal-analisis-resultados" style="display: none;">
                        <h3>📊 Resultados del Análisis</h3>
                        
                        <div id="estadisticasTerreno" class="estadisticas-grid">
                            <!-- Se llenará dinámicamente -->
                        </div>

                        <div id="graficoDistribucion" class="grafico-container">
                            <canvas id="chartPendientes"></canvas>
                        </div>

                        <div id="tablaPuntosCriticos" class="tabla-criticos">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>

                    <!-- Indicador de carga -->
                    <div id="loadingAnalisis" class="loading-overlay" style="display: none;">
                        <div class="spinner"></div>
                        <p>Analizando terreno...</p>
                    </div>
                </div>
            </div>
        `;

        // Insertar modal en el body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar eventos
        this.configurarEventosModal();
    }

    /**
     * Configura los eventos del modal
     */
    configurarEventosModal() {
        const btnDibujar = document.getElementById('btnDibujarPoligono');
        const btnAnalizar = document.getElementById('btnAnalizarTerreno');
        const btnLimpiar = document.getElementById('btnLimpiarAnalisis');

        if (btnDibujar) {
            btnDibujar.addEventListener('click', () => this.activarDibujoPoligono());
        }

        if (btnAnalizar) {
            btnAnalizar.addEventListener('click', () => this.analizarTerreno());
        }

        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => this.limpiarAnalisis());
        }
    }

    /**
     * Inicializa Leaflet.draw para dibujar polígonos
     */
    inicializarLeafletDraw() {
        if (!L.Draw) {
            console.warn('⚠️ Leaflet.draw no está cargado. Agregue la biblioteca.');
            return;
        }

        // Crear capa para los dibujos
        this.capaResultados = new L.FeatureGroup();
        this.map.addLayer(this.capaResultados);

        // Configurar control de dibujo
        this.drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: {
                        color: '#3498db',
                        weight: 3,
                        fillOpacity: 0.2
                    }
                },
                polyline: false,
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: this.capaResultados,
                remove: true
            }
        });

        // Eventos de dibujo
        this.map.on(L.Draw.Event.CREATED, (e) => {
            this.capaResultados.clearLayers();
            this.poligonoActual = e.layer;
            this.capaResultados.addLayer(this.poligonoActual);
            
            // Habilitar botón de análisis
            document.getElementById('btnAnalizarTerreno').disabled = false;
            
            console.log('✅ Polígono dibujado:', this.poligonoActual.toGeoJSON());
        });

        this.map.on(L.Draw.Event.DELETED, () => {
            this.poligonoActual = null;
            document.getElementById('btnAnalizarTerreno').disabled = true;
        });
    }

    /**
     * Abre el modal de análisis
     */
    abrirModal() {
        const modal = document.getElementById('modalAnalisisTerreno');
        if (modal) {
            modal.style.display = 'block';
            this.modalActivo = true;
            document.body.classList.add('analisis-terreno-activo');
            console.log('🗺️ Modal de Análisis de Terreno abierto');
        }
    }

    /**
     * Cierra el modal de análisis
     */
    cerrarModal() {
        const modal = document.getElementById('modalAnalisisTerreno');
        if (modal) {
            modal.style.display = 'none';
            this.modalActivo = false;
            document.body.classList.remove('analisis-terreno-activo');
            this.desactivarDibujoPoligono();
        }
    }

    /**
     * Activa el modo de dibujo de polígono
     */
    activarDibujoPoligono() {
        if (!this.drawControl) {
            alert('Leaflet.draw no está disponible. Verifique la carga de bibliotecas.');
            return;
        }

        // Agregar control si no está en el mapa
        if (!this.map.hasLayer(this.drawControl)) {
            this.map.addControl(this.drawControl);
        }

        // Activar herramienta de polígono
        new L.Draw.Polygon(this.map, this.drawControl.options.draw.polygon).enable();
        
        console.log('🖊️ Modo dibujo de polígono activado');
    }

    /**
     * Desactiva el modo de dibujo
     */
    desactivarDibujoPoligono() {
        if (this.drawControl && this.map.hasLayer(this.drawControl)) {
            this.map.removeControl(this.drawControl);
        }
    }

    /**
     * Genera una grilla de puntos dentro de un polígono
     * @param {Array} polygonCoords - Coordenadas del polígono [[lng, lat], ...]
     * @param {Number} resolution - Resolución en metros (default: 100m)
     * @returns {Array} - Array de puntos {lat, lon}
     */
    generarGrillaPuntos(polygonCoords, resolution = 100) {
        // Calcular bounds del polígono
        const lngs = polygonCoords.map(p => p[0]);
        const lats = polygonCoords.map(p => p[1]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        // Calcular centro para ajuste de longitud
        const centerLat = (minLat + maxLat) / 2;
        
        // Conversión metros a grados
        const metersPerDegreeLat = 111320;
        const metersPerDegreeLon = 111320 * Math.cos(centerLat * Math.PI / 180);
        
        const latStep = resolution / metersPerDegreeLat;
        const lonStep = resolution / metersPerDegreeLon;
        
        console.log(`📐 Resolución: ${resolution}m → ${latStep.toFixed(6)}° lat, ${lonStep.toFixed(6)}° lon`);
        
        // Generar puntos
        const points = [];
        const polygon = L.polygon(polygonCoords.map(p => [p[1], p[0]])); // Leaflet usa [lat, lng]
        
        for (let lat = minLat; lat <= maxLat; lat += latStep) {
            for (let lon = minLng; lon <= maxLng; lon += lonStep) {
                // Verificar si el punto está dentro del polígono
                if (polygon.getBounds().contains([lat, lon])) {
                    // Verificación más precisa con contains (requiere que el polígono esté en el mapa)
                    const latLng = L.latLng(lat, lon);
                    
                    // Usar algoritmo punto-en-polígono simple
                    if (this.puntoEnPoligono(lat, lon, polygonCoords)) {
                        points.push({ lat, lon });
                    }
                }
            }
        }
        
        console.log(`✅ Grilla: ${points.length} puntos generados (resolución ${resolution}m)`);
        return points;
    }

    /**
     * Algoritmo punto-en-polígono (Ray Casting)
     * @param {Number} lat - Latitud del punto
     * @param {Number} lon - Longitud del punto
     * @param {Array} polygonCoords - Coordenadas del polígono [[lng, lat], ...]
     * @returns {Boolean}
     */
    puntoEnPoligono(lat, lon, polygonCoords) {
        let inside = false;
        
        for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
            const xi = polygonCoords[i][0], yi = polygonCoords[i][1];
            const xj = polygonCoords[j][0], yj = polygonCoords[j][1];
            
            const intersect = ((yi > lat) !== (yj > lat))
                && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    /**
     * Ejecuta el análisis de terreno
     */
    async analizarTerreno() {
        if (!this.poligonoActual) {
            alert('Primero debe dibujar un polígono en el mapa.');
            return;
        }

        // Obtener parámetros
        const vehiculo = document.getElementById('selectTipoVehiculo').value;
        const clima = document.getElementById('selectClima').value;
        const checkPendientes = document.getElementById('checkPendientes').checked;
        const checkTransitabilidad = document.getElementById('checkTransitabilidad').checked;
        this.resolucion = parseInt(document.getElementById('selectResolucion').value);
        
        console.log(`🎯 Resolución seleccionada: ${this.resolucion}m`);

        // 🔍 VALIDAR TAMAÑO DEL ÁREA
        const geoJSON = this.poligonoActual.toGeoJSON();
        const area = this.calcularAreaPoligono(this.poligonoActual);
        const areaKm2 = area / 1000000;
        
        const LIMITE_AREA_KM2 = 50;
        if (areaKm2 > LIMITE_AREA_KM2) {
            const confirmacion = confirm(
                `⚠️ ÁREA MUY GRANDE\n\n` +
                `Área: ${areaKm2.toFixed(2)} km²\n` +
                `Límite: ${LIMITE_AREA_KM2} km²\n\n` +
                `Procesar puede causar errores.\n` +
                `¿Continuar de todas formas?`
            );
            
            if (!confirmacion) {
                console.log('❌ Análisis cancelado (área muy grande)');
                return;
            }
        }

        // Mostrar indicador de carga
        document.getElementById('loadingAnalisis').style.display = 'flex';

        try {
            // 🎯 PASO 1: Generar grilla de puntos dentro del polígono
            const gridPoints = this.generarGrillaPuntos(geoJSON.geometry.coordinates[0], this.resolucion);
            
            console.log(`📐 Grilla generada: ${gridPoints.length} puntos (área ${areaKm2.toFixed(2)} km²)`);
            
            // Preparar datos para API
            const requestData = {
                poligono: geoJSON.geometry.coordinates,
                puntos: gridPoints, // ← Puntos de la grilla
                vehiculo: vehiculo,
                clima: clima,
                capas: {
                    pendientes: checkPendientes,
                    transitabilidad: checkTransitabilidad
                }
            };

            console.log('📡 Enviando solicitud de análisis:', requestData);

            // Llamar a la API
            const response = await fetch(`${this.config.apiUrl}/analizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const resultados = await response.json();
            console.log('✅ Resultados recibidos:', resultados);

            // Mostrar resultados
            this.mostrarResultados(resultados);

            // Pintar overlay en el mapa
            if (checkPendientes) {
                this.pintarMapaCalor(resultados);
            }

        } catch (error) {
            console.error('❌ Error en análisis de terreno:', error);
            alert(`Error al analizar el terreno: ${error.message}\n\nVerifique que el servidor API esté corriendo.`);
        } finally {
            // Ocultar indicador de carga
            document.getElementById('loadingAnalisis').style.display = 'none';
        }
    }

    /**
     * Muestra los resultados del análisis
     */
    mostrarResultados(resultados) {
        const panelResultados = document.getElementById('panelResultados');
        const estadisticas = document.getElementById('estadisticasTerreno');

        // Mostrar panel
        panelResultados.style.display = 'block';

        // Generar estadísticas
        const statsHTML = `
            <div class="stat-card">
                <i class="fas fa-chart-line"></i>
                <h4>Pendiente Promedio</h4>
                <p class="stat-value">${resultados.pendiente_promedio?.toFixed(2) || 'N/A'}°</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-angle-double-up"></i>
                <h4>Pendiente Máxima</h4>
                <p class="stat-value">${resultados.pendiente_maxima?.toFixed(2) || 'N/A'}°</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-road"></i>
                <h4>% Transitable</h4>
                <p class="stat-value">${resultados.pct_transitable?.toFixed(1) || 'N/A'}%</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Puntos Críticos</h4>
                <p class="stat-value">${resultados.puntos_criticos?.length || 0}</p>
            </div>
        `;

        estadisticas.innerHTML = statsHTML;

        // Generar gráfico de distribución (si Chart.js está disponible)
        if (typeof Chart !== 'undefined' && resultados.distribucion_pendientes) {
            this.generarGraficoPendientes(resultados.distribucion_pendientes);
        }

        // ====================================================================
        // 🎨 VISUALIZACIÓN DE PUNTOS DETALLE
        // ====================================================================
        if (resultados.puntos_detalle && resultados.puntos_detalle.length > 0) {
            console.log(`🎨 Creando visualización de ${resultados.puntos_detalle.length} puntos`);
            
            // Crear calcos SEPARADOS en sistema de calcos (sin polígono original)
            this.crearCalcoAltimetria(resultados.puntos_detalle);
            this.crearCalcoPendientes(resultados.puntos_detalle);
            this.crearCalcoVegetacion(resultados.puntos_detalle);
            this.crearCalcoTransitabilidad(resultados.puntos_detalle);
            this.crearCalcoOCOTA(resultados.puntos_detalle); // 🔭 NUEVO: OCOTA
            
            // 🗑️ ELIMINAR POLÍGONO ORIGINAL - Solo quedan cuadrados en calcos separados
            this.eliminarPoligonoOriginal();
            
            // Notificar al usuario
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion(
                    `✅ 5 capas de visualización creadas (${resultados.puntos_detalle.length} puntos) - Polígono original eliminado`,
                    'success'
                );
            }
        }

    }

    /**
     * Genera el gráfico de distribución de pendientes
     */
    generarGraficoPendientes(distribucion) {
        const ctx = document.getElementById('chartPendientes');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-5°', '5-15°', '15-30°', '>30°'],
                datasets: [{
                    label: 'Distribución de Pendientes (%)',
                    data: [
                        distribucion['0-5'] || 0,
                        distribucion['5-15'] || 0,
                        distribucion['15-30'] || 0,
                        distribucion['30+'] || 0
                    ],
                    backgroundColor: [
                        this.config.coloresPendientes['0-5'],
                        this.config.coloresPendientes['5-15'],
                        this.config.coloresPendientes['15-30'],
                        this.config.coloresPendientes['30+']
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Porcentaje (%)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Pinta un mapa de calor sobre el polígono analizado
     */
    pintarMapaCalor(resultados) {
        // TODO: Implementar overlay de colores según pendientes
        console.log('🎨 Pintando mapa de calor (PENDIENTE)');
    }

    /**
     * Limpia el análisis actual
     */
    limpiarAnalisis() {
        if (this.capaResultados) {
            this.capaResultados.clearLayers();
        }
        this.poligonoActual = null;
        
        document.getElementById('panelResultados').style.display = 'none';
        document.getElementById('btnAnalizarTerreno').disabled = true;
        
           console.log('🧹 Análisis limpiado');
    }

    /**
     * 🏔️ Crear calco de altimetría
     * Paleta agresiva de colores cada 25m-50m para visualización inmediata
     */
    crearCalcoAltimetria(puntos_detalle) {
        console.log('🏔️ Creando calco de altimetría...');
        
        // Crear nombre único para el calco
        const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nombreCalco = `🏔️ Altimetría ${timestamp}`;
        
        // Crear nuevo calco usando el sistema de calcos
        if (typeof window.crearNuevoCalco === 'function') {
            // El sistema crea un calco automáticamente, necesitamos obtener el último
            const calcosAnteriores = Object.keys(window.calcos || {}).length;
            window.crearNuevoCalco();
            
            // Obtener el calco recién creado y renombrarlo
            const nuevoNombre = `Calco ${calcosAnteriores + 1}`;
            if (window.calcos && window.calcos[nuevoNombre]) {
                window.calcos[nombreCalco] = window.calcos[nuevoNombre];
                delete window.calcos[nuevoNombre];
                
                // Agregar los rectángulos al calco
                const rectangles = puntos_detalle.map(punto => {
                    const color = this.getColorAltimetria(punto.elevation);
                    const bounds = this.crearCuadrado(punto.lat, punto.lon, this.resolucion);
                    
                    return L.rectangle(bounds, {
                        fillColor: color,
                        fillOpacity: 0.85,
                        color: color,
                        weight: 0,
                        className: 'calco-altimetria-square'
                    }).bindTooltip(
                        `<strong>🏔️ Altitud:</strong> ${punto.elevation.toFixed(1)}m<br>` +
                        `<strong>📐 Pendiente:</strong> ${punto.pendiente.toFixed(1)}°<br>` +
                        `<strong>📍 Coord:</strong> ${punto.lat.toFixed(5)}, ${punto.lon.toFixed(5)}`,
                        { permanent: false, direction: 'top', opacity: 0.95 }
                    );
                });
                
                // Agregar todos los rectángulos al calco
                rectangles.forEach(rect => rect.addTo(window.calcos[nombreCalco]));
                
                // Renombrar en la interfaz
                if (typeof window.renameCalco === 'function') {
                    window.renameCalco(nuevoNombre, nombreCalco);
                }
                
                console.log(`✅ Calco altimetría creado: ${puntos_detalle.length} cuadrados de ${this.resolucion}m`);
                console.log(`📊 Rango: ${Math.min(...puntos_detalle.map(p => p.elevation)).toFixed(1)}m - ${Math.max(...puntos_detalle.map(p => p.elevation)).toFixed(1)}m`);
            }
        } else {
            console.error('❌ Sistema de calcos no disponible');
        }
    }

    /**
     * 📐 Crear calco de pendientes
     */
    crearCalcoPendientes(puntos_detalle) {
        console.log('📐 Creando calco de pendientes...');
        
        // Crear nombre único para el calco
        const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nombreCalco = `⚠️ Obstáculos Pendiente ${timestamp}`;
        
        // Crear nuevo calco usando el sistema de calcos
        if (typeof window.crearNuevoCalco === 'function') {
            const calcosAnteriores = Object.keys(window.calcos || {}).length;
            window.crearNuevoCalco();
            
            const nuevoNombre = `Calco ${calcosAnteriores + 1}`;
            if (window.calcos && window.calcos[nuevoNombre]) {
                window.calcos[nombreCalco] = window.calcos[nuevoNombre];
                delete window.calcos[nuevoNombre];
                
                const rectangles = puntos_detalle.map(punto => {
                    const bounds = this.crearCuadrado(punto.lat, punto.lon, this.resolucion);
                    const clasificacion = this.getClasificacionPendiente(punto.pendiente);
                    
                    // ESTRATEGIA REDISEÑADA: Solo pintar obstáculos críticos (>30°)
                    const esObstaculo = punto.pendiente > 30;
                    const color = esObstaculo ? '#e74c3c' : '#D3D3D3'; // Rojo obstáculo vs gris neutral
                    const opacity = esObstaculo ? 0.85 : 0.15; // Muy bajo si no es obstáculo
                    
                    return L.rectangle(bounds, {
                        fillColor: color,
                        fillOpacity: opacity,
                        color: color,
                        weight: esObstaculo ? 2 : 0, // Borde solo en obstáculos
                        className: 'calco-pendientes-square'
                    }).bindTooltip(
                        `<strong>📐 ANÁLISIS PENDIENTE</strong><br>` +
                        `<hr style="margin: 5px 0; border-color: #ccc;">` +
                        `<strong>📊 Grados:</strong> ${punto.pendiente.toFixed(1)}°<br>` +
                        `<strong>🚦 Clasificación:</strong> ${clasificacion}<br>` +
                        `<strong>⚠️ Obstáculo crítico:</strong> ${esObstaculo ? '✅ SÍ (>30°)' : '❌ NO'}<br>` +
                        `<hr style="margin: 5px 0; border-color: #ccc;">` +
                        `<strong>🏔️ Altitud:</strong> ${punto.elevation.toFixed(1)}m<br>` +
                        `<strong>📍 Coord:</strong> ${punto.lat.toFixed(5)}, ${punto.lon.toFixed(5)}`,
                        { permanent: false, direction: 'top', opacity: 0.95 }
                    );
                });
                
                rectangles.forEach(rect => rect.addTo(window.calcos[nombreCalco]));
                
                const obstaculos = puntos_detalle.filter(p => p.pendiente > 30).length;
                console.log(`✅ Calco pendientes creado: ${obstaculos} obstáculos críticos de ${puntos_detalle.length} puntos`);
            }
        } else {
            console.error('❌ Sistema de calcos no disponible');
        }
    }

    /**
     * 🌲 Crear calco de vegetación
     */
    crearCalcoVegetacion(puntos_detalle) {
        console.log('🌲 Creando calco de vegetación...');
        
        // Crear nombre único para el calco
        const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nombreCalco = `🌿 Vegetación ${timestamp}`;
        
        // Crear nuevo calco usando el sistema de calcos
        if (typeof window.crearNuevoCalco === 'function') {
            const calcosAnteriores = Object.keys(window.calcos || {}).length;
            window.crearNuevoCalco();
            
            const nuevoNombre = `Calco ${calcosAnteriores + 1}`;
            if (window.calcos && window.calcos[nuevoNombre]) {
                window.calcos[nombreCalco] = window.calcos[nuevoNombre];
                delete window.calcos[nuevoNombre];
                
                const rectangles = puntos_detalle.map(punto => {
                    const color = this.getColorVegetacion(punto.ndvi);
                    const bounds = this.crearCuadrado(punto.lat, punto.lon, this.resolucion);
                    const tipo = this.getTipoVegetacion(punto.ndvi);
                    
                    return L.rectangle(bounds, {
                        fillColor: color,
                        fillOpacity: 0.85,
                        color: color,
                        weight: 0,
                        className: 'calco-vegetacion-square'
                    }).bindTooltip(
                        `<strong>🌿 NDVI:</strong> ${punto.ndvi.toFixed(2)} (${tipo})<br>` +
                        `<strong>🏔️ Altitud:</strong> ${punto.elevation.toFixed(1)}m<br>` +
                        `<strong>📍 Coord:</strong> ${punto.lat.toFixed(5)}, ${punto.lon.toFixed(5)}`,
                        { permanent: false, direction: 'top', opacity: 0.95 }
                    );
                });
                
                rectangles.forEach(rect => rect.addTo(window.calcos[nombreCalco]));
                
                console.log(`✅ Calco vegetación creado: ${puntos_detalle.length} cuadrados de ${this.resolucion}m`);
            }
        } else {
            console.error('❌ Sistema de calcos no disponible');
        }
    }

    /**
     * 🚗 Crear calco de transitabilidad
     * Algoritmo básico: pendiente + vegetación
     * TODO: Mejorar con datos BV8 (matriz suelo×clima×vehículo×pendiente)
     */
    crearCalcoTransitabilidad(puntos_detalle) {
        console.log('🚗 Creando calco de transitabilidad...');
        
        // Crear nombre único para el calco
        const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nombreCalco = `🚗 Transitabilidad ${timestamp}`;
        
        // Crear nuevo calco usando el sistema de calcos
        if (typeof window.crearNuevoCalco === 'function') {
            const calcosAnteriores = Object.keys(window.calcos || {}).length;
            window.crearNuevoCalco();
            
            const nuevoNombre = `Calco ${calcosAnteriores + 1}`;
            if (window.calcos && window.calcos[nuevoNombre]) {
                window.calcos[nombreCalco] = window.calcos[nuevoNombre];
                delete window.calcos[nuevoNombre];
                
                const rectangles = puntos_detalle.map(punto => {
                    const transitabilidad = this.calcularTransitabilidadBasica(punto);
                    const color = this.getColorTransitabilidad(transitabilidad.factor);
                    const bounds = this.crearCuadrado(punto.lat, punto.lon, this.resolucion);
                    
                    return L.rectangle(bounds, {
                        fillColor: color,
                        fillOpacity: 0.85,
                        color: color,
                        weight: 0,
                        className: 'calco-transitabilidad-square'
                    }).bindTooltip(
                        `<strong>🚗 Transitabilidad:</strong> ${transitabilidad.clasificacion}<br>` +
                        `<strong>📊 Factor:</strong> ${(transitabilidad.factor * 100).toFixed(0)}%<br>` +
                        `<strong>📐 Pendiente:</strong> ${punto.pendiente}°<br>` +
                        `<strong>🌿 NDVI:</strong> ${punto.ndvi.toFixed(2)}<br>` +
                        `<strong>📍 Coord:</strong> ${punto.lat.toFixed(5)}, ${punto.lon.toFixed(5)}`,
                        { permanent: false, direction: 'top', opacity: 0.95 }
                    );
                });
                
                rectangles.forEach(rect => rect.addTo(window.calcos[nombreCalco]));
                
                console.log(`✅ Calco transitabilidad creado: ${puntos_detalle.length} cuadrados de ${this.resolucion}m`);
            }
        } else {
            console.error('❌ Sistema de calcos no disponible');
        }
    }

    /**
     * � Crear calco OCOTA (Análisis Militar Integral)
     * OCOTA = Observación + Campo de tiro + Obstáculos + Terrenos llave + Avenidas aproximación
     */
    crearCalcoOCOTA(puntos_detalle) {
        console.log('🔭 Creando calco OCOTA (análisis militar)...');
        
        // Crear nombre único para el calco
        const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nombreCalco = `⭐ Terrenos Llave ${timestamp}`;
        
        // Analizar cada componente OCOTA
        const analisisOCOTA = puntos_detalle.map(punto => {
            return {
                ...punto,
                ocota: this.analizarOCOTA(punto, puntos_detalle)
            };
        });
        
        // Crear nuevo calco usando el sistema de calcos
        if (typeof window.crearNuevoCalco === 'function') {
            const calcosAnteriores = Object.keys(window.calcos || {}).length;
            window.crearNuevoCalco();
            
            const nuevoNombre = `Calco ${calcosAnteriores + 1}`;
            if (window.calcos && window.calcos[nuevoNombre]) {
                window.calcos[nombreCalco] = window.calcos[nuevoNombre];
                delete window.calcos[nuevoNombre];
                
                const rectangles = analisisOCOTA.map(punto => {
                    // ⭐ ESTRATEGIA REDISEÑADA: Solo pintar Terrenos Llave
                    // Resto: gris neutro con baja opacidad (tooltip tiene info completa)
                    const esTerreLlave = punto.ocota.terrenoLlave;
                    const color = esTerreLlave ? '#FFD700' : '#D3D3D3';
                    const opacity = esTerreLlave ? 0.85 : 0.15;
                    
                    const bounds = this.crearCuadrado(punto.lat, punto.lon, this.resolucion);
                    
                    return L.rectangle(bounds, {
                        fillColor: color,
                        fillOpacity: opacity,
                        color: color,
                        weight: esTerreLlave ? 2 : 0,
                        className: 'calco-ocota-square'
                    }).bindTooltip(
                        `<strong>🔭 ANÁLISIS OCOTA</strong><br>` +
                        `<hr style="margin: 5px 0; border-color: #ccc;">` +
                        `<strong>👁️ Observación:</strong> ${punto.ocota.observacion ? '✅ SÍ' : '❌ NO'}<br>` +
                        `<strong>🎯 Campo de tiro:</strong> ${punto.ocota.campoTiro ? '✅ SÍ' : '❌ NO'}<br>` +
                        `<strong>🚧 Obstáculo:</strong> ${punto.ocota.obstaculo ? '✅ SÍ' : '❌ NO'}<br>` +
                        `<strong>⭐ Terreno llave:</strong> ${punto.ocota.terrenoLlave ? '✅ SÍ (CRÍTICO)' : '❌ NO'}<br>` +
                        `<strong>🛣️ Avenida aprox:</strong> ${punto.ocota.avenidaAprox ? '✅ SÍ' : '❌ NO'}<br>` +
                        `<hr style="margin: 5px 0; border-color: #ccc;">` +
                        `<strong>📐 Pendiente:</strong> ${punto.pendiente.toFixed(1)}°<br>` +
                        `<strong>🏔️ Altitud:</strong> ${punto.elevation.toFixed(1)}m<br>` +
                        `<strong>🌿 NDVI:</strong> ${punto.ndvi.toFixed(2)}<br>` +
                        `<strong>📍 Coord:</strong> ${punto.lat.toFixed(5)}, ${punto.lon.toFixed(5)}`,
                        { permanent: false, direction: 'top', opacity: 0.95, className: 'tooltip-ocota' }
                    );
                });
                
                rectangles.forEach(rect => rect.addTo(window.calcos[nombreCalco]));
                
                const terrenosLlave = analisisOCOTA.filter(p => p.ocota.terrenoLlave).length;
                console.log(`✅ Calco OCOTA: ${terrenosLlave} terrenos llave identificados de ${puntos_detalle.length} puntos`);
            }
        } else {
            console.error('❌ Sistema de calcos no disponible');
        }
    }

    /**
     * Analizar componentes OCOTA para un punto
     */
    analizarOCOTA(punto, todosPuntos) {
        // Calcular percentiles para análisis relativo
        const elevaciones = todosPuntos.map(p => p.elevation);
        const percentil75 = this.calcularPercentil(elevaciones, 75);
        const percentil25 = this.calcularPercentil(elevaciones, 25);
        
        // O - OBSERVACIÓN: Elevación alta + sin obstáculos visuales
        const observacion = punto.elevation > percentil75 && punto.ndvi < 0.5;
        
        // C - CAMPO DE TIRO: Línea de fuego clara + vegetación baja
        const campoTiro = punto.pendiente < 15 && punto.ndvi < 0.4;
        
        // O - OBSTÁCULOS: Pendiente muy pronunciada + quebradas
        const obstaculo = punto.pendiente > 45;
        
        // T - TERRENOS LLAVE: Elevación relativa alta + ubicación estratégica
        const terrenoLlave = punto.elevation > percentil75 && punto.pendiente < 30;
        
        // A - AVENIDAS DE APROXIMACIÓN: Bajuras + pendiente suave
        const avenidaAprox = punto.elevation < percentil25 && punto.pendiente < 15;
        
        // Clasificación general
        let clasificacion = 'Neutro';
        if (terrenoLlave) clasificacion = 'Terreno llave';
        else if (observacion) clasificacion = 'Punto observación';
        else if (campoTiro) clasificacion = 'Campo de tiro';
        else if (obstaculo) clasificacion = 'Obstáculo';
        else if (avenidaAprox) clasificacion = 'Avenida aproximación';
        
        return {
            observacion,
            campoTiro,
            obstaculo,
            terrenoLlave,
            avenidaAprox,
            clasificacion
        };
    }

    /**
     * Color según clasificación OCOTA
     */
    getColorOCOTA(ocota) {
        if (ocota.terrenoLlave) return '#FFD700';    // 🟡 Dorado - Terreno llave (prioritario)
        if (ocota.observacion) return '#4169E1';     // 🔵 Azul - Punto de observación
        if (ocota.campoTiro) return '#32CD32';       // 🟢 Verde lima - Campo de tiro
        if (ocota.obstaculo) return '#DC143C';       // 🔴 Rojo - Obstáculo
        if (ocota.avenidaAprox) return '#00CED1';    // 🔷 Turquesa - Avenida aproximación
        return '#D3D3D3';                             // ⚪ Gris - Neutro
    }

    /**
     * Calcular percentil de un array
     */
    calcularPercentil(arr, percentil) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentil / 100) * sorted.length) - 1;
        return sorted[index];
    }

    /**
     * �🗑️ Eliminar polígono original después de análisis
     * Solo quedan los cuadrados en calcos separados
     */
    eliminarPoligonoOriginal() {
        if (this.poligonoActual) {
            console.log('🗑️ Eliminando polígono original del mapa...');
            
            // Eliminar del layer group
            if (this.capaResultados) {
                this.capaResultados.removeLayer(this.poligonoActual);
            }
            
            // Eliminar del mapa si está agregado directamente
            if (this.map.hasLayer(this.poligonoActual)) {
                this.map.removeLayer(this.poligonoActual);
            }
            
            this.poligonoActual = null;
            console.log('✅ Polígono original eliminado - Solo calcos de visualización permanecen');
        }
    }

    /**
     * Calcular transitabilidad básica
     * Algoritmo simplificado: factor_pendiente × factor_vegetacion
     * 
     * TODO: Mejorar con matriz BV8:
     * - Tipos de suelo (arcilla, arena, roca, etc)
     * - Condiciones climáticas (seco, húmedo, nieve)
     * - Tipo de vehículo (infantería, ligero, pesado, blindado)
     * - Matriz de transitabilidad compleja
     */
    calcularTransitabilidadBasica(punto) {
        // Factor de pendiente (0.0 = intransitable, 1.0 = ideal)
        let factorPendiente = 1.0;
        if (punto.pendiente > 45) {
            factorPendiente = 0.0; // Intransitable
        } else if (punto.pendiente > 30) {
            factorPendiente = 0.2; // Muy difícil
        } else if (punto.pendiente > 15) {
            factorPendiente = 0.5; // Difícil
        } else if (punto.pendiente > 5) {
            factorPendiente = 0.8; // Moderado
        }
        // else: factorPendiente = 1.0 (ideal)
        
        // Factor de vegetación (0.0 = muy denso, 1.0 = despejado)
        let factorVegetacion = 1.0;
        if (punto.ndvi > 0.6) {
            factorVegetacion = 0.3; // Vegetación muy densa
        } else if (punto.ndvi > 0.4) {
            factorVegetacion = 0.6; // Vegetación moderada
        } else if (punto.ndvi > 0.2) {
            factorVegetacion = 0.8; // Vegetación escasa
        }
        // else: factorVegetacion = 1.0 (despejado)
        
        // Factor total
        const factorTotal = factorPendiente * factorVegetacion;
        
        // Clasificación
        let clasificacion;
        if (factorTotal >= 0.7) {
            clasificacion = 'Transitable';
        } else if (factorTotal >= 0.4) {
            clasificacion = 'Difícil';
        } else if (factorTotal >= 0.2) {
            clasificacion = 'Muy difícil';
        } else {
            clasificacion = 'Obstáculo';
        }
        
        return {
            factor: factorTotal,
            clasificacion: clasificacion,
            pendiente: factorPendiente,
            vegetacion: factorVegetacion
        };
    }

    /**
     * Color según factor de transitabilidad
     */
    getColorTransitabilidad(factor) {
        if (factor >= 0.7) return '#2ecc71';  // Verde - Transitable
        if (factor >= 0.4) return '#f1c40f';  // Amarillo - Difícil
        if (factor >= 0.2) return '#e67e22';  // Naranja - Muy difícil
        return '#e74c3c';                      // Rojo - Obstáculo
    }

    /**
     * Paleta de colores TOPOGRÁFICA para altimetría
     * Verde → Marrón → Gris → Negro/Blanco (sin rojos que dan sensación intransitable)
     * Permite visualización clara de avenidas de aproximación en bajuras verdes
     * 
     * 🟢 Verde oscuro → Bajuras transitables (0-100m)
     * � Verde claro → Llanos (100-300m)
     * 🟤 Marrón claro → Colinas bajas (300-800m)
     * � Marrón oscuro → Montañas medias (800-1500m)
     * ⚫ Gris → Montañas altas (1500-2500m)
     * ⚪ Negro/Blanco → Picos/Nieve (>2500m)
     */
    getColorAltimetria(elevation) {
        // 🌊 AGUA/MAR - Azules (< 0m) - Obstáculos acuáticos naturales
        if (elevation < -50) return '#00004d';   // Azul muy oscuro (mar profundo)
        if (elevation < -30) return '#000066';   // Azul oscuro (mar)
        if (elevation < -10) return '#000080';   // Azul medio (aguas profundas)
        if (elevation < -5) return '#0000b3';    // Azul (agua)
        if (elevation < 0) return '#0000e6';     // Azul claro (costa, ríos, lagos)
        
        // Bajuras VERDES OSCUROS - Zonas transitables, avenidas de aproximación (0-100m)
        if (elevation < 10) return '#00331a';   // Verde muy muy oscuro (pantanos)
        if (elevation < 25) return '#004d26';   // Verde muy oscuro (bajuras)
        if (elevation < 50) return '#006633';   // Verde oscuro
        if (elevation < 75) return '#008040';   // Verde medio oscuro
        if (elevation < 100) return '#00994d';  // Verde medio
        
        // VERDES CLAROS - Llanos, buena transitabilidad (100-300m)
        if (elevation < 125) return '#00b359';  // Verde medio claro
        if (elevation < 150) return '#00cc66';  // Verde claro
        if (elevation < 175) return '#00e673';  // Verde muy claro
        if (elevation < 200) return '#1aff8c';  // Verde brillante
        if (elevation < 250) return '#4dffa6';  // Verde lima claro
        if (elevation < 300) return '#80ffbf';  // Verde agua
        
        // MARRONES CLAROS - Colinas bajas (300-800m)
        if (elevation < 350) return '#99cc99';  // Verde-gris (transición)
        if (elevation < 400) return '#a3a38f';  // Beige verdoso
        if (elevation < 450) return '#b8a882';  // Beige
        if (elevation < 500) return '#c2a676';  // Arena
        if (elevation < 600) return '#cd9f69';  // Marrón arena
        if (elevation < 700) return '#d4925c';  // Marrón claro
        if (elevation < 800) return '#d9864f';  // Marrón terracota
        
        // MARRONES OSCUROS - Montañas medias (800-1500m)
        if (elevation < 900) return '#b87333';   // Cobre
        if (elevation < 1000) return '#a0623d';  // Marrón medio
        if (elevation < 1100) return '#8b5a3c';  // Marrón oscuro
        if (elevation < 1200) return '#76513b';  // Marrón muy oscuro
        if (elevation < 1300) return '#61493a';  // Marrón casi negro
        if (elevation < 1400) return '#4d4139';  // Marrón negruzco
        if (elevation < 1500) return '#3d3530';  // Marrón chocolate oscuro
        
        // GRISES - Montañas altas, zona rocosa (1500-2500m)
        if (elevation < 1600) return '#595959';  // Gris medio oscuro
        if (elevation < 1800) return '#707070';  // Gris medio
        if (elevation < 2000) return '#878787';  // Gris claro
        if (elevation < 2200) return '#9e9e9e';  // Gris muy claro
        if (elevation < 2500) return '#b5b5b5';  // Gris casi blanco
        
        // NEGRO/BLANCO - Picos, nieve, glaciares (>2500m)
        if (elevation < 2750) return '#cccccc';  // Gris blanquecino (roca expuesta)
        if (elevation < 3000) return '#e0e0e0';  // Blanco grisáceo (nieve)
        if (elevation < 3250) return '#f0f0f0';  // Blanco casi puro (nieve profunda)
        if (elevation < 3500) return '#f8f8f8';  // Blanco puro (glaciares)
        if (elevation < 4000) return '#ffffff';  // Blanco total (picos nevados)
        return '#fafafa';                        // Blanco glaciar (>4000m)
    }

    getColorPendiente(pendiente) {
        if (pendiente < 5) return '#2ecc71';
        if (pendiente < 15) return '#f1c40f';
        if (pendiente < 30) return '#e67e22';
        return '#e74c3c';
    }

    getClasificacionPendiente(pendiente) {
        if (pendiente < 5) return 'Llano';
        if (pendiente < 15) return 'Moderado';
        if (pendiente < 30) return 'Difícil';
        return 'Muy difícil';
    }

    getColorVegetacion(ndvi) {
        if (ndvi < 0.2) return '#8b4513';
        if (ndvi < 0.4) return '#d4a574';
        if (ndvi < 0.6) return '#7cb342';
        return '#2e7d32';
    }

    getTipoVegetacion(ndvi) {
        if (ndvi < 0.2) return 'Suelo desnudo';
        if (ndvi < 0.4) return 'Vegetación escasa';
        if (ndvi < 0.6) return 'Vegetación moderada';
        return 'Vegetación densa';
    }

    /**
     * Crear bounds de un cuadrado en metros
     * @param {number} lat - Latitud central
     * @param {number} lon - Longitud central  
     * @param {number} sizeMeters - Tamaño del cuadrado en metros
     * @returns {Array} [[lat1, lon1], [lat2, lon2]] - Bounds del cuadrado
     */
    crearCuadrado(lat, lon, sizeMeters) {
        // Convertir metros a grados (aproximado)
        // 1 grado de latitud ≈ 111,320 metros
        // 1 grado de longitud ≈ 111,320 * cos(latitud) metros
        const halfSize = sizeMeters / 2;
        const latOffset = halfSize / 111320;
        const lonOffset = halfSize / (111320 * Math.cos(lat * Math.PI / 180));
        
        return [
            [lat - latOffset, lon - lonOffset], // esquina suroeste
            [lat + latOffset, lon + lonOffset]  // esquina noreste
        ];
    }

    /**
     * Calcular área de polígono en metros cuadrados
     */
    calcularAreaPoligono(polygon) {
        const coords = polygon.getLatLngs()[0];
        let area = 0;
        
        for (let i = 0; i < coords.length; i++) {
            const j = (i + 1) % coords.length;
            area += coords[i].lng * coords[j].lat;
            area -= coords[j].lng * coords[i].lat;
        }
        
        area = Math.abs(area / 2);
        
        // Convertir a metros cuadrados (aproximado)
        // 1 grado ≈ 111,320 metros
        return area * 111320 * 111320;
    }

}

// Inicializar automáticamente cuando el mapa esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el mapa esté disponible
    const checkMap = setInterval(() => {
        if (window.map) {
            window.analisisTerreno = new AnalisisTerreno(window.map);
            window.analisisTerreno.inicializar();
            clearInterval(checkMap);
        }
    }, 100);
});
