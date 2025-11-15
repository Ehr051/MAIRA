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

/**
 * 🔢 MinHeap - Priority Queue para Dijkstra
 * Complejidad: O(log n) para insert/extractMin
 */
class MinHeap {
    constructor() {
        this.heap = [];
    }

    insert(item) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return min;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].distancia >= this.heap[parentIndex].distancia) break;
            
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        while (true) {
            let minIndex = index;
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;

            if (leftChild < this.heap.length && this.heap[leftChild].distancia < this.heap[minIndex].distancia) {
                minIndex = leftChild;
            }

            if (rightChild < this.heap.length && this.heap[rightChild].distancia < this.heap[minIndex].distancia) {
                minIndex = rightChild;
            }

            if (minIndex === index) break;

            [this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
            index = minIndex;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    size() {
        return this.heap.length;
    }
}

class AnalisisTerreno {
    constructor(map) {
        this.map = map;
        this.modalActivo = false;
        this.poligonoActual = null;
        this.capaResultados = null;
        this.drawControl = null;
        this.resolucion = 50; // metros (25, 50, o 100)
        this.chartPendientes = null;
        
        // 🗺️ Capas GIS del IGN (7 categorías)
        this.capasGIS = {
            transporte: null,
            hidrografia: null,
            areas_urbanas: null,
            comunicaciones: null,
            suelos: null,
            vegetacion: null,
            geomorfologia: null
        };
        this.capasGISActivas = new Set();
        this.ultimosBounds = null;
        this.debounceTimerCapasGIS = null;
        
        // Configuración
        this.config = {
            apiUrl: 'http://localhost:5001/api/terreno',
            coloresPendientes: {
                '0-5': '#2ecc71',      // Verde - Transitable
                '5-15': '#f1c40f',     // Amarillo - Precaución
                '15-30': '#e67e22',    // Naranja - Difícil
                '30+': '#e74c3c'       // Rojo - Muy difícil
            },
            estilosGIS: {
                ruta_nacional: {
                    color: '#ff0000',
                    weight: 3,
                    opacity: 0.8
                },
                ruta_provincial: {
                    color: '#ff9900',
                    weight: 2,
                    opacity: 0.7
                },
                caminos: {
                    color: '#996633',
                    weight: 1.5,
                    opacity: 0.6
                },
                curso_agua_permanente: {
                    color: '#0066cc',
                    weight: 2,
                    opacity: 0.7
                },
                espejo_agua_permanente: {
                    color: '#0099ff',
                    weight: 0.5,
                    fillColor: '#66ccff',
                    fillOpacity: 0.3
                },
                localidades: {
                    color: '#ff6600',
                    weight: 2,
                    opacity: 0.9,
                    fillColor: '#ffaa66',
                    fillOpacity: 0.4
                }
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
        this.configurarRecargaAutomaticaCapasGIS();
        console.log('✅ Análisis de Terreno listo');
    }

    /**
     * Configurar recarga automática de capas GIS al mover el mapa
     */
    configurarRecargaAutomaticaCapasGIS() {
        this.map.on('moveend', () => {
            // Solo recargar si hay capas GIS activas
            if (this.capasGISActivas.size === 0) return;

            // Debounce: esperar 500ms después del último movimiento
            clearTimeout(this.debounceTimerCapasGIS);
            
            this.debounceTimerCapasGIS = setTimeout(() => {
                const boundsActuales = this.map.getBounds();
                
                // Verificar si los bounds cambiaron significativamente (>30%)
                if (this.boundsChangedSignificantly(boundsActuales)) {
                    console.log('📍 Bounds cambiaron significativamente, recargando capas GIS...');
                    this.ultimosBounds = boundsActuales;
                    
                    // Recargar solo las capas que están activas
                    const capasActivas = Array.from(this.capasGISActivas);
                    if (capasActivas.length > 0) {
                        this.cargarCapasGISArea(capasActivas).catch(err => {
                            console.warn('⚠️ Error recargando capas GIS automáticamente:', err);
                        });
                    }
                }
            }, 500); // 500ms debounce
        });
    }

    /**
     * Verificar si los bounds cambiaron significativamente
     */
    boundsChangedSignificantly(newBounds) {
        if (!this.ultimosBounds) {
            this.ultimosBounds = newBounds;
            return true;
        }

        const oldNorth = this.ultimosBounds.getNorth();
        const oldSouth = this.ultimosBounds.getSouth();
        const oldEast = this.ultimosBounds.getEast();
        const oldWest = this.ultimosBounds.getWest();

        const newNorth = newBounds.getNorth();
        const newSouth = newBounds.getSouth();
        const newEast = newBounds.getEast();
        const newWest = newBounds.getWest();

        // Calcular altura y ancho
        const oldHeight = oldNorth - oldSouth;
        const oldWidth = oldEast - oldWest;
        const newHeight = newNorth - newSouth;
        const newWidth = newEast - newWest;

        // Calcular solape
        const overlapNorth = Math.min(oldNorth, newNorth);
        const overlapSouth = Math.max(oldSouth, newSouth);
        const overlapEast = Math.min(oldEast, newEast);
        const overlapWest = Math.max(oldWest, newWest);

        if (overlapNorth <= overlapSouth || overlapEast <= overlapWest) {
            // No hay solape
            return true;
        }

        const overlapHeight = overlapNorth - overlapSouth;
        const overlapWidth = overlapEast - overlapWest;
        const overlapArea = overlapHeight * overlapWidth;
        const oldArea = oldHeight * oldWidth;

        // Si el solape es menor al 70%, recargar
        const overlapPercentage = (overlapArea / oldArea) * 100;
        return overlapPercentage < 70;
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

                        <div class="param-group param-capas-gis">
                            <label>
                                <i class="fas fa-map-marked-alt"></i> Capas GIS del IGN - Selección Individual:
                            </label>
                            
                            <!-- Grupo Transporte -->
                            <div class="grupo-capas-gis" style="margin-bottom: 10px;">
                                <label style="font-weight: bold; color: #e67e22; cursor: pointer;">
                                    <input type="checkbox" id="checkGrupoTransporte" class="check-grupo">
                                    🛣️ Transporte (6 capas)
                                </label>
                                <div class="capas-individuales" style="margin-left: 20px; font-size: 0.9em;">
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="ruta_nacional">
                                        Rutas Nacionales <span style="color: #95a5a6; font-size: 0.85em;">(3.7K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="ruta_provincial">
                                        Rutas Provinciales <span style="color: #95a5a6; font-size: 0.85em;">(16.2K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="caminos">
                                        Caminos <span style="color: #95a5a6; font-size: 0.85em;">(99.7K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="ferrocarril">
                                        Ferrocarril <span style="color: #95a5a6; font-size: 0.85em;">(2.1K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="infraestructura_vial">
                                        Infraestructura Vial <span style="color: #95a5a6; font-size: 0.85em;">(5.4K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="cruces_enlaces">
                                        Cruces y Enlaces <span style="color: #95a5a6; font-size: 0.85em;">(6.0K)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Grupo Hidrografía -->
                            <div class="grupo-capas-gis" style="margin-bottom: 10px;">
                                <label style="font-weight: bold; color: #3498db; cursor: pointer;">
                                    <input type="checkbox" id="checkGrupoHidrografia" class="check-grupo">
                                    💧 Hidrografía (2 capas)
                                </label>
                                <div class="capas-individuales" style="margin-left: 20px; font-size: 0.9em;">
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="curso_agua_permanente">
                                        Cursos de Agua <span style="color: #95a5a6; font-size: 0.85em;">(56.6K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="espejo_agua_permanente">
                                        Espejos de Agua <span style="color: #95a5a6; font-size: 0.85em;">(22.3K)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Grupo Áreas Urbanas -->
                            <div class="grupo-capas-gis" style="margin-bottom: 10px;">
                                <label style="font-weight: bold; color: #e74c3c; cursor: pointer;">
                                    <input type="checkbox" id="checkGrupoUrbanas" class="check-grupo">
                                    🏙️ Áreas Urbanas (1 capa)
                                </label>
                                <div class="capas-individuales" style="margin-left: 20px; font-size: 0.9em;">
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="localidades">
                                        Localidades <span style="color: #95a5a6; font-size: 0.85em;">(3.5K)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Grupo Comunicaciones -->
                            <div class="grupo-capas-gis" style="margin-bottom: 10px;">
                                <label style="font-weight: bold; color: #9b59b6; cursor: pointer;">
                                    <input type="checkbox" id="checkGrupoComunicaciones" class="check-grupo">
                                    📡 Comunicaciones (2 capas)
                                </label>
                                <div class="capas-individuales" style="margin-left: 20px; font-size: 0.9em;">
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="torres_comunicacion">
                                        Torres Comunicación <span style="color: #95a5a6; font-size: 0.85em;">(426)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="nodos_comunicacion">
                                        Nodos Comunicación <span style="color: #95a5a6; font-size: 0.85em;">(754)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Grupo Suelos -->
                            <div class="grupo-capas-gis" style="margin-bottom: 10px;">
                                <label style="font-weight: bold; color: #8e44ad; cursor: pointer;">
                                    <input type="checkbox" id="checkGrupoSuelos" class="check-grupo">
                                    🏜️ Suelos y Edafología (7 capas)
                                </label>
                                <div class="capas-individuales" style="margin-left: 20px; font-size: 0.9em;">
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="arenal">
                                        Arenal <span style="color: #95a5a6; font-size: 0.85em;">(4.8K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="afloramiento_rocoso">
                                        Afloramiento Rocoso <span style="color: #95a5a6; font-size: 0.85em;">(3.5K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="barrial">
                                        Barrial <span style="color: #95a5a6; font-size: 0.85em;">(3.4K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="pedregal">
                                        Pedregal <span style="color: #95a5a6; font-size: 0.85em;">(3.0K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="sedimento_fluvial">
                                        Sedimento Fluvial <span style="color: #95a5a6; font-size: 0.85em;">(2.6K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="cumbre_rocosa">
                                        Cumbre Rocosa <span style="color: #95a5a6; font-size: 0.85em;">(1.1K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="salina">
                                        Salina <span style="color: #95a5a6; font-size: 0.85em;">(544)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Grupo Vegetación -->
                            <div class="grupo-capas-gis" style="margin-bottom: 10px;">
                                <label style="font-weight: bold; color: #27ae60; cursor: pointer;">
                                    <input type="checkbox" id="checkGrupoVegetacion" class="check-grupo">
                                    🌳 Vegetación (6 capas)
                                </label>
                                <div class="capas-individuales" style="margin-left: 20px; font-size: 0.9em;">
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="vegetacion_hidrofila">
                                        Vegetación Hidrófila <span style="color: #95a5a6; font-size: 0.85em;">(8.7K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="bosque_tipo_3">
                                        Bosque Tipo 3 <span style="color: #95a5a6; font-size: 0.85em;">(8.6K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="bosque_nativo_1">
                                        Bosque Nativo 1 <span style="color: #95a5a6; font-size: 0.85em;">(3.2K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="vegetacion_arbustiva">
                                        Vegetación Arbustiva <span style="color: #95a5a6; font-size: 0.85em;">(2.3K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="bosque_nativo_2">
                                        Bosque Nativo 2 <span style="color: #95a5a6; font-size: 0.85em;">(1.1K)</span>
                                    </label>
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="cultivo_arboreo">
                                        Cultivo Arbóreo <span style="color: #95a5a6; font-size: 0.85em;">(405)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Grupo Geomorfología -->
                            <div class="grupo-capas-gis" style="margin-bottom: 10px;">
                                <label style="font-weight: bold; color: #d35400; cursor: pointer;">
                                    <input type="checkbox" id="checkGrupoGeomorfologia" class="check-grupo">
                                    ⛰️ Geomorfología (1 capa)
                                </label>
                                <div class="capas-individuales" style="margin-left: 20px; font-size: 0.9em;">
                                    <label style="display: block; margin: 3px 0;">
                                        <input type="checkbox" class="check-capa" data-capa="lineas_geomorfologia">
                                        Líneas Geomorfología <span style="color: #95a5a6; font-size: 0.85em;">(17.8K)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Botones de Control -->
                            <div style="margin-top: 15px;">
                                <button id="btnSeleccionarTodasCapas" class="btn-mini btn-secondary" style="margin-right: 5px;">
                                    <i class="fas fa-check-double"></i> Todas
                                </button>
                                <button id="btnCargarCapasGIS" class="btn-mini btn-primary">
                                    <i class="fas fa-download"></i> Cargar
                                </button>
                                <button id="btnLimpiarCapasGIS" class="btn-mini btn-danger">
                                    <i class="fas fa-trash-alt"></i> Limpiar
                                </button>
                            </div>
                            
                            <div id="statsCapasGIS" style="display: none; margin-top: 10px; padding: 10px; background: rgba(52, 152, 219, 0.1); border-radius: 5px; font-size: 0.85em;">
                                <strong style="color: #3498db;">📊 Capas cargadas:</strong><br>
                                <span id="statsCapasTexto"></span>
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
        const btnCargarCapasGIS = document.getElementById('btnCargarCapasGIS');
        const btnLimpiarCapasGIS = document.getElementById('btnLimpiarCapasGIS');
        const btnSeleccionarTodas = document.getElementById('btnSeleccionarTodasCapas');

        if (btnDibujar) {
            btnDibujar.addEventListener('click', () => this.activarDibujoPoligono());
        }

        if (btnAnalizar) {
            btnAnalizar.addEventListener('click', () => this.analizarTerreno());
        }

        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => this.limpiarAnalisis());
        }

        if (btnCargarCapasGIS) {
            btnCargarCapasGIS.addEventListener('click', () => this.cargarCapasGISDesdeUI());
        }

        if (btnLimpiarCapasGIS) {
            btnLimpiarCapasGIS.addEventListener('click', () => {
                this.limpiarCapasGIS();
                document.getElementById('statsCapasGIS').style.display = 'none';
            });
        }

        // Botón seleccionar todas las capas
        if (btnSeleccionarTodas) {
            btnSeleccionarTodas.addEventListener('click', () => {
                const checkboxes = document.querySelectorAll('.check-capa');
                const todosChecked = Array.from(checkboxes).every(cb => cb.checked);
                checkboxes.forEach(cb => cb.checked = !todosChecked);
            });
        }

        // Checkboxes de grupo
        const checkboxesGrupo = document.querySelectorAll('.check-grupo');
        checkboxesGrupo.forEach(grupoCheck => {
            grupoCheck.addEventListener('change', (e) => {
                const grupoContainer = e.target.closest('.grupo-capas-gis');
                const capasIndividuales = grupoContainer.querySelectorAll('.check-capa');
                capasIndividuales.forEach(capaCheck => {
                    capaCheck.checked = e.target.checked;
                });
            });
        });
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

        // 🔍 VALIDAR Y DIVIDIR ÁREA SI ES MUY GRANDE
        const geoJSON = this.poligonoActual.toGeoJSON();
        const area = this.calcularAreaPoligono(this.poligonoActual);
        const areaKm2 = area / 1000000;
        
        // 📏 LÍMITES OPERACIONALES
        // Chunk: 50km² (~7x7km) - suficiente para Batallón
        // Total: 2000km² (~45x45km) - cubre operaciones nivel División/Cuerpo
        const LIMITE_CHUNK_KM2 = 50; // Procesar chunks de 50km²
        const LIMITE_TOTAL_KM2 = 2000; // Máximo total procesable (operaciones División+)
        
        let procesarPorChunks = false;
        
        if (areaKm2 > LIMITE_TOTAL_KM2) {
            alert(
                `⚠️ ÁREA DEMASIADO GRANDE\n\n` +
                `Área seleccionada: ${areaKm2.toFixed(2)} km²\n` +
                `Límite máximo: ${LIMITE_TOTAL_KM2} km²\n\n` +
                `Referencia:\n` +
                `• Batallón: ~25-50 km²\n` +
                `• Brigada: ~100-300 km²\n` +
                `• División: ~500-1000 km²\n` +
                `• Cuerpo: ~1500-2000 km²\n\n` +
                `Por favor, seleccione un área menor.`
            );
            console.log(`❌ Análisis cancelado (${areaKm2.toFixed(2)}km² excede límite ${LIMITE_TOTAL_KM2}km²)`);
            return;
        }
        
        if (areaKm2 > LIMITE_CHUNK_KM2) {
            const numChunks = Math.ceil(areaKm2 / LIMITE_CHUNK_KM2);
            
            // Estimar nivel operacional
            let nivelOperacional = 'Batallón';
            if (areaKm2 > 1500) nivelOperacional = 'Cuerpo de Ejército';
            else if (areaKm2 > 500) nivelOperacional = 'División';
            else if (areaKm2 > 100) nivelOperacional = 'Brigada';
            
            const tiempoEstimado = Math.ceil(numChunks * 2); // ~2 seg por chunk
            
            const confirmacion = confirm(
                `📦 ÁREA GRANDE - PROCESAMIENTO POR PARTES\n\n` +
                `Área total: ${areaKm2.toFixed(2)} km² (~${nivelOperacional})\n` +
                `Se dividirá en ${numChunks} partes de ${LIMITE_CHUNK_KM2}km² cada una\n` +
                `Tiempo estimado: ~${tiempoEstimado} segundos\n\n` +
                `Esto procesará ${Math.round(areaKm2 * 40)} puntos aproximadamente.\n` +
                `¿Continuar?`
            );
            
            if (!confirmacion) {
                console.log('❌ Análisis cancelado por usuario');
                return;
            }
            
            procesarPorChunks = true;
        }

        // Mostrar indicador de carga
        document.getElementById('loadingAnalisis').style.display = 'flex';

        try {
            // 🎯 PASO 1: Generar grilla de puntos dentro del polígono
            const gridPoints = this.generarGrillaPuntos(geoJSON.geometry.coordinates[0], this.resolucion);
            
            console.log(`📐 Grilla generada: ${gridPoints.length} puntos (área ${areaKm2.toFixed(2)} km²)`);
            
            let resultados;
            
            // 📦 PROCESAR POR CHUNKS SI ES NECESARIO
            if (procesarPorChunks) {
                console.log('📦 Procesando por chunks...');
                resultados = await this.procesarPorChunks(gridPoints, geoJSON, vehiculo, clima, checkPendientes, checkTransitabilidad);
            } else {
                // Procesar normalmente
                const requestData = {
                    poligono: geoJSON.geometry.coordinates,
                    puntos: gridPoints,
                    vehiculo: vehiculo,
                    clima: clima,
                    capas: {
                        pendientes: checkPendientes,
                        transitabilidad: checkTransitabilidad
                    }
                };

                console.log('📡 Enviando solicitud de análisis:', requestData);

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

                resultados = await response.json();
            }
            
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
     * 📦 Procesa área grande dividiéndola en chunks
     */
    async procesarPorChunks(gridPoints, geoJSON, vehiculo, clima, checkPendientes, checkTransitabilidad) {
        const CHUNK_SIZE = 2000; // Máximo 2000 puntos por request
        const totalPuntos = gridPoints.length;
        const numChunks = Math.ceil(totalPuntos / CHUNK_SIZE);
        
        console.log(`📦 Dividiendo ${totalPuntos} puntos en ${numChunks} chunks de ~${CHUNK_SIZE} puntos`);
        
        let todosLosPuntosDetalle = [];
        let pendientePromedio = 0;
        let pendienteMaxima = -Infinity;
        let pendienteMinima = Infinity;
        let distribucionPendientes = {'0-5': 0, '5-15': 0, '15-30': 0, '30+': 0};
        let puntosCriticos = [];
        
        // Procesar cada chunk
        for (let i = 0; i < numChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalPuntos);
            const chunk = gridPoints.slice(start, end);
            
            console.log(`📦 Procesando chunk ${i + 1}/${numChunks} (${chunk.length} puntos)...`);
            
            // Actualizar indicador de progreso
            const progress = Math.round(((i + 1) / numChunks) * 100);
            document.getElementById('loadingAnalisis').querySelector('p').textContent = 
                `Analizando terreno... ${progress}% (${i + 1}/${numChunks} partes)`;
            
            const requestData = {
                poligono: geoJSON.geometry.coordinates,
                puntos: chunk,
                vehiculo: vehiculo,
                clima: clima,
                capas: {
                    pendientes: checkPendientes,
                    transitabilidad: checkTransitabilidad
                }
            };
            
            const response = await fetch(`${this.config.apiUrl}/analizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP en chunk ${i + 1}: ${response.status}`);
            }
            
            const resultado = await response.json();
            
            // Acumular resultados
            if (resultado.puntos_detalle) {
                todosLosPuntosDetalle = todosLosPuntosDetalle.concat(resultado.puntos_detalle);
            }
            
            // Actualizar estadísticas
            if (resultado.pendiente_maxima > pendienteMaxima) {
                pendienteMaxima = resultado.pendiente_maxima;
            }
            if (resultado.pendiente_minima < pendienteMinima) {
                pendienteMinima = resultado.pendiente_minima;
            }
            
            // Acumular distribución (promedio ponderado después)
            if (resultado.distribucion_pendientes) {
                Object.keys(resultado.distribucion_pendientes).forEach(key => {
                    distribucionPendientes[key] += resultado.distribucion_pendientes[key] * chunk.length;
                });
            }
            
            if (resultado.puntos_criticos) {
                puntosCriticos = puntosCriticos.concat(resultado.puntos_criticos);
            }
            
            // Pequeña pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Calcular promedios finales
        Object.keys(distribucionPendientes).forEach(key => {
            distribucionPendientes[key] = distribucionPendientes[key] / totalPuntos;
        });
        
        pendientePromedio = todosLosPuntosDetalle.reduce((sum, p) => sum + p.pendiente, 0) / todosLosPuntosDetalle.length;
        
        console.log(`✅ Procesamiento por chunks completado: ${todosLosPuntosDetalle.length} puntos totales`);
        
        // Restaurar texto loading
        document.getElementById('loadingAnalisis').querySelector('p').textContent = 'Analizando terreno...';
        
        return {
            success: true,
            puntos_detalle: todosLosPuntosDetalle,
            pendiente_promedio: pendientePromedio,
            pendiente_maxima: pendienteMaxima,
            pendiente_minima: pendienteMinima,
            pct_transitable: todosLosPuntosDetalle.filter(p => p.pendiente < 30).length / todosLosPuntosDetalle.length * 100,
            distribucion_pendientes: distribucionPendientes,
            puntos_criticos: puntosCriticos.slice(0, 10)
        };
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
            this.crearCalcoAvenidas(resultados.puntos_detalle); // 🛣️ NUEVO: Avenidas Aproximación
            
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

        // 🧹 LIMPIAR CHART ANTERIOR (Fix: "Canvas already in use")
        if (this.chartPendientes) {
            this.chartPendientes.destroy();
            this.chartPendientes = null;
            console.log('🧹 Chart anterior destruido');
        }

        this.chartPendientes = new Chart(ctx, {
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
                    const transitabilidadBase = this.calcularTransitabilidadBasica(punto);
                    const transitabilidad = this.aplicarModificadoresGIS(punto, transitabilidadBase);
                    const color = this.getColorTransitabilidad(transitabilidad.factor);
                    const bounds = this.crearCuadrado(punto.lat, punto.lon, this.resolucion);
                    
                    // Construir tooltip con modificadores GIS si existen
                    let tooltipContent = `<strong>🚗 Transitabilidad:</strong> ${transitabilidad.clasificacion}<br>` +
                        `<strong>📊 Factor:</strong> ${(transitabilidad.factor * 100).toFixed(0)}%<br>` +
                        `<strong>📐 Pendiente:</strong> ${punto.pendiente}°<br>` +
                        `<strong>🌿 NDVI:</strong> ${punto.ndvi.toFixed(2)}<br>`;
                    
                    if (transitabilidad.modificadores && transitabilidad.modificadores.detalles.length > 0) {
                        tooltipContent += `<br><strong>�️ Modificadores GIS:</strong><br>`;
                        transitabilidad.modificadores.detalles.forEach(mod => {
                            const signo = mod.modificador >= 0 ? '+' : '';
                            tooltipContent += `  • ${mod.descripcion} (${signo}${(mod.modificador * 100).toFixed(0)}%)<br>`;
                        });
                    }
                    
                    tooltipContent += `<strong>📍 Coord:</strong> ${punto.lat.toFixed(5)}, ${punto.lon.toFixed(5)}`;
                    
                    return L.rectangle(bounds, {
                        fillColor: color,
                        fillOpacity: 0.85,
                        color: color,
                        weight: 0,
                        className: 'calco-transitabilidad-square'
                    }).bindTooltip(
                        tooltipContent,
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
     * 🗺️ Aplicar modificadores GIS a transitabilidad
     * 
     * Sistema completo de modificadores basado en 25 capas GIS:
     * 
     * 🛣️ TRANSPORTE (6 capas):
     *   - Rutas Nacionales: +40% transitabilidad, +30 km/h velocidad
     *   - Rutas Provinciales: +35% transitabilidad, +25 km/h
     *   - Caminos: +25% transitabilidad, +15 km/h
     *   - Ferrocarril: -30% transitabilidad (obstáculo cruzar vías)
     *   - Infraestructura Vial: +20% (puentes, pasos)
     *   - Cruces/Enlaces: +15% (intersecciones mejoradas)
     * 
     * 💧 HIDROGRAFÍA (2 capas):
     *   - Cursos de Agua: -50% transitabilidad (ríos)
     *   - Espejos de Agua: -80% transitabilidad (lagos, lagunas)
     * 
     * 🏙️ ÁREAS URBANAS (1 capa):
     *   - Localidades: +15% cobertura, -10 km/h velocidad, +ocultamiento
     * 
     * 📡 COMUNICACIONES (2 capas):
     *   - Torres: +30% comunicaciones, punto estratégico
     *   - Nodos: +20% comunicaciones
     * 
     * 🏜️ SUELOS (7 capas):
     *   - Arenal: -40% transitabilidad, -20 km/h
     *   - Afloramiento Rocoso: -35% transitabilidad
     *   - Barrial: -45% transitabilidad (terreno blando)
     *   - Pedregal: -30% transitabilidad
     *   - Sedimento Fluvial: -25% transitabilidad
     *   - Cumbre Rocosa: -60% transitabilidad (terreno muy difícil)
     *   - Salina: -20% transitabilidad
     * 
     * 🌳 VEGETACIÓN (6 capas):
     *   - Vegetación Hidrófila: -35% transitabilidad, +ocultamiento
     *   - Bosque Tipo 3: -40% transitabilidad, +cobertura
     *   - Bosque Nativo 1: -45% transitabilidad, +cobertura
     *   - Vegetación Arbustiva: -25% transitabilidad, +ocultamiento
     *   - Bosque Nativo 2: -40% transitabilidad, +cobertura
     *   - Cultivo Arbóreo: -15% transitabilidad
     * 
     * ⛰️ GEOMORFOLOGÍA (1 capa):
     *   - Líneas Geomorfología: -20% transitabilidad (fallas, escarpes)
     */
    aplicarModificadoresGIS(punto, transitabilidadBase) {
        if (!this.capasGIS || this.capasGISActivas.size === 0) {
            return transitabilidadBase;
        }

        let factorModificado = transitabilidadBase.factor;
        let modificadores = {
            transporte: [],
            hidrografia: [],
            urbana: [],
            comunicaciones: [],
            suelos: [],
            vegetacion: [],
            geomorfologia: [],
            detalles: []
        };

        const puntoLatLng = [punto.lat, punto.lon];

        // ========================================
        // 🛣️ TRANSPORTE (6 capas)
        // ========================================
        this.capasGIS.transporte?.eachLayer(layer => {
            if (!layer.feature?.geometry) return;
            
            const coords = layer.feature.geometry.coordinates;
            const props = layer.feature.properties || {};
            const tipo = props.tipo || props.fna || '';
            
            // Rutas Nacionales
            if (tipo.includes('Ruta Nacional') || tipo.includes('ruta_nacional')) {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0005)) {
                    factorModificado = Math.min(1.0, factorModificado + 0.40);
                    modificadores.transporte.push('Ruta Nacional (+40%)');
                    modificadores.detalles.push({tipo: 'ruta_nacional', mod: +0.40, velocidad: +30});
                }
            }
            // Rutas Provinciales
            else if (tipo.includes('Ruta Provincial') || tipo.includes('ruta_provincial')) {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0005)) {
                    factorModificado = Math.min(1.0, factorModificado + 0.35);
                    modificadores.transporte.push('Ruta Provincial (+35%)');
                    modificadores.detalles.push({tipo: 'ruta_provincial', mod: +0.35, velocidad: +25});
                }
            }
            // Caminos
            else if (tipo.includes('Camino') || tipo.includes('caminos')) {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0003)) {
                    factorModificado = Math.min(1.0, factorModificado + 0.25);
                    modificadores.transporte.push('Camino (+25%)');
                    modificadores.detalles.push({tipo: 'camino', mod: +0.25, velocidad: +15});
                }
            }
            // Ferrocarril (obstáculo)
            else if (tipo.includes('Ferrocarril') || tipo.includes('ferrocarril')) {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0002)) {
                    factorModificado = Math.max(0.0, factorModificado - 0.30);
                    modificadores.transporte.push('Ferrocarril (-30%)');
                    modificadores.detalles.push({tipo: 'ferrocarril', mod: -0.30, obstáculo: true});
                }
            }
            // Infraestructura Vial
            else if (tipo.includes('Puente') || tipo.includes('infraestructura')) {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0002)) {
                    factorModificado = Math.min(1.0, factorModificado + 0.20);
                    modificadores.transporte.push('Infraestructura (+20%)');
                    modificadores.detalles.push({tipo: 'infraestructura', mod: +0.20});
                }
            }
            // Cruces/Enlaces
            else if (tipo.includes('Cruce') || tipo.includes('Enlace')) {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0001)) {
                    factorModificado = Math.min(1.0, factorModificado + 0.15);
                    modificadores.transporte.push('Cruce/Enlace (+15%)');
                    modificadores.detalles.push({tipo: 'cruce', mod: +0.15});
                }
            }
        });

        // ========================================
        // 💧 HIDROGRAFÍA (2 capas)
        // ========================================
        this.capasGIS.hidrografia?.eachLayer(layer => {
            if (!layer.feature?.geometry) return;
            
            const coords = layer.feature.geometry.coordinates;
            const tipo = layer.feature.geometry.type;
            
            // Cursos de Agua (LineString)
            if (tipo === 'LineString' || tipo === 'MultiLineString') {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0002)) {
                    factorModificado = Math.max(0.0, factorModificado - 0.50);
                    modificadores.hidrografia.push('Curso de Agua (-50%)');
                    modificadores.detalles.push({tipo: 'curso_agua', mod: -0.50, obstáculo: true});
                }
            }
            // Espejos de Agua (Polygon)
            else if (tipo === 'Polygon' || tipo === 'MultiPolygon') {
                if (this.puntoEstaDentroDePoligono(puntoLatLng, coords)) {
                    factorModificado = Math.max(0.0, factorModificado - 0.80);
                    modificadores.hidrografia.push('Espejo de Agua (-80%)');
                    modificadores.detalles.push({tipo: 'espejo_agua', mod: -0.80, obstáculo: true});
                }
            }
        });

        // ========================================
        // 🏙️ ÁREAS URBANAS (1 capa)
        // ========================================
        this.capasGIS.areas_urbanas?.eachLayer(layer => {
            if (!layer.feature?.geometry) return;
            
            const coords = layer.feature.geometry.coordinates;
            
            if (this.puntoEstaDentroDePoligono(puntoLatLng, coords)) {
                // Urbano: +cobertura/ocultamiento pero -velocidad
                modificadores.urbana.push('Área Urbana');
                modificadores.detalles.push({
                    tipo: 'urbana', 
                    mod: 0, 
                    cobertura: +15, 
                    ocultamiento: +20,
                    velocidad: -10
                });
            }
        });

        // ========================================
        // 📡 COMUNICACIONES (2 capas)
        // ========================================
        this.capasGIS.comunicaciones?.eachLayer(layer => {
            if (!layer.feature?.geometry) return;
            
            const coords = layer.feature.geometry.coordinates;
            const props = layer.feature.properties || {};
            
            // Torres de Comunicación
            if (props.tipo === 'torre' || props.fna?.includes('Torre')) {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0005)) {
                    modificadores.comunicaciones.push('Torre Comunicación');
                    modificadores.detalles.push({
                        tipo: 'torre_comunicacion', 
                        mod: 0, 
                        comunicaciones: +30,
                        estrategico: true
                    });
                }
            }
            // Nodos de Comunicación
            else {
                if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0003)) {
                    modificadores.comunicaciones.push('Nodo Comunicación');
                    modificadores.detalles.push({
                        tipo: 'nodo_comunicacion', 
                        mod: 0, 
                        comunicaciones: +20
                    });
                }
            }
        });

        // ========================================
        // 🏜️ SUELOS (7 capas)
        // ========================================
        this.capasGIS.suelos?.eachLayer(layer => {
            if (!layer.feature?.geometry) return;
            
            const coords = layer.feature.geometry.coordinates;
            const props = layer.feature.properties || {};
            const tipo = props.tipo || props.fna || '';
            
            if (this.puntoEstaDentroDePoligono(puntoLatLng, coords)) {
                // Arenal
                if (tipo.includes('Arenal') || tipo.includes('arenal')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.40);
                    modificadores.suelos.push('Arenal (-40%)');
                    modificadores.detalles.push({tipo: 'arenal', mod: -0.40, velocidad: -20});
                }
                // Afloramiento Rocoso
                else if (tipo.includes('Afloramiento') || tipo.includes('afloramiento')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.35);
                    modificadores.suelos.push('Afloramiento Rocoso (-35%)');
                    modificadores.detalles.push({tipo: 'afloramiento_rocoso', mod: -0.35});
                }
                // Barrial
                else if (tipo.includes('Barrial') || tipo.includes('barrial')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.45);
                    modificadores.suelos.push('Barrial (-45%)');
                    modificadores.detalles.push({tipo: 'barrial', mod: -0.45, velocidad: -25});
                }
                // Pedregal
                else if (tipo.includes('Pedregal') || tipo.includes('pedregal')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.30);
                    modificadores.suelos.push('Pedregal (-30%)');
                    modificadores.detalles.push({tipo: 'pedregal', mod: -0.30});
                }
                // Sedimento Fluvial
                else if (tipo.includes('Sedimento') || tipo.includes('sedimento')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.25);
                    modificadores.suelos.push('Sedimento Fluvial (-25%)');
                    modificadores.detalles.push({tipo: 'sedimento_fluvial', mod: -0.25});
                }
                // Cumbre Rocosa
                else if (tipo.includes('Cumbre') || tipo.includes('cumbre')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.60);
                    modificadores.suelos.push('Cumbre Rocosa (-60%)');
                    modificadores.detalles.push({tipo: 'cumbre_rocosa', mod: -0.60, obstáculo: true});
                }
                // Salina
                else if (tipo.includes('Salina') || tipo.includes('salina')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.20);
                    modificadores.suelos.push('Salina (-20%)');
                    modificadores.detalles.push({tipo: 'salina', mod: -0.20});
                }
            }
        });

        // ========================================
        // 🌳 VEGETACIÓN (6 capas)
        // ========================================
        this.capasGIS.vegetacion?.eachLayer(layer => {
            if (!layer.feature?.geometry) return;
            
            const coords = layer.feature.geometry.coordinates;
            const props = layer.feature.properties || {};
            const tipo = props.tipo || props.fna || '';
            
            if (this.puntoEstaDentroDePoligono(puntoLatLng, coords)) {
                // Vegetación Hidrófila
                if (tipo.includes('Hidrófila') || tipo.includes('hidrofila')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.35);
                    modificadores.vegetacion.push('Veg. Hidrófila (-35%)');
                    modificadores.detalles.push({tipo: 'vegetacion_hidrofila', mod: -0.35, ocultamiento: +25});
                }
                // Bosque Tipo 3
                else if (tipo.includes('Bosque Tipo 3') || tipo.includes('bosque_tipo_3')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.40);
                    modificadores.vegetacion.push('Bosque Tipo 3 (-40%)');
                    modificadores.detalles.push({tipo: 'bosque_tipo_3', mod: -0.40, cobertura: +30});
                }
                // Bosque Nativo 1
                else if (tipo.includes('Bosque Nativo 1') || tipo.includes('bosque_nativo_1')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.45);
                    modificadores.vegetacion.push('Bosque Nativo 1 (-45%)');
                    modificadores.detalles.push({tipo: 'bosque_nativo_1', mod: -0.45, cobertura: +35});
                }
                // Vegetación Arbustiva
                else if (tipo.includes('Arbustiva') || tipo.includes('arbustiva')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.25);
                    modificadores.vegetacion.push('Veg. Arbustiva (-25%)');
                    modificadores.detalles.push({tipo: 'vegetacion_arbustiva', mod: -0.25, ocultamiento: +20});
                }
                // Bosque Nativo 2
                else if (tipo.includes('Bosque Nativo 2') || tipo.includes('bosque_nativo_2')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.40);
                    modificadores.vegetacion.push('Bosque Nativo 2 (-40%)');
                    modificadores.detalles.push({tipo: 'bosque_nativo_2', mod: -0.40, cobertura: +30});
                }
                // Cultivo Arbóreo
                else if (tipo.includes('Cultivo') || tipo.includes('cultivo')) {
                    factorModificado = Math.max(0.0, factorModificado - 0.15);
                    modificadores.vegetacion.push('Cultivo Arbóreo (-15%)');
                    modificadores.detalles.push({tipo: 'cultivo_arboreo', mod: -0.15});
                }
            }
        });

        // ========================================
        // ⛰️ GEOMORFOLOGÍA (1 capa)
        // ========================================
        this.capasGIS.geomorfologia?.eachLayer(layer => {
            if (!layer.feature?.geometry) return;
            
            const coords = layer.feature.geometry.coordinates;
            
            if (this.puntoEstaCercaDe(puntoLatLng, coords, 0.0003)) {
                factorModificado = Math.max(0.0, factorModificado - 0.20);
                modificadores.geomorfologia.push('Línea Geomorfológica (-20%)');
                modificadores.detalles.push({tipo: 'geomorfologia', mod: -0.20});
            }
        });

        return {
            ...transitabilidadBase,
            factor: factorModificado,
            modificadores: modificadores,
            clasificacion: this.getClasificacionTransitabilidad(factorModificado)
        };
    }

    /**
     * Verificar si un punto está cerca de una línea/punto
     */
    puntoEstaCercaDe(punto, coords, umbral) {
        if (!Array.isArray(coords) || coords.length === 0) return false;

        // LineString
        if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
            for (let i = 0; i < coords.length; i++) {
                const [lon, lat] = coords[i];
                const dist = Math.sqrt(
                    Math.pow(punto[0] - lat, 2) + 
                    Math.pow(punto[1] - lon, 2)
                );
                if (dist < umbral) return true;
            }
        }
        // MultiLineString
        else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            for (let line of coords) {
                if (this.puntoEstaCercaDe(punto, line, umbral)) return true;
            }
        }

        return false;
    }

    /**
     * Verificar si un punto está dentro de un polígono
     */
    puntoEstaDentroDePoligono(punto, coords) {
        if (!Array.isArray(coords) || coords.length === 0) return false;

        // Polygon
        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0]) && typeof coords[0][0][0] === 'number') {
            const ring = coords[0]; // Exterior ring
            return this.pointInPolygon(punto, ring);
        }
        // MultiPolygon
        else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0]) && Array.isArray(coords[0][0][0])) {
            for (let polygon of coords) {
                if (this.puntoEstaDentroDePoligono(punto, polygon)) return true;
            }
        }

        return false;
    }

    /**
     * Ray casting algorithm para point-in-polygon
     */
    pointInPolygon(point, ring) {
        const [lat, lon] = point;
        let inside = false;

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [lonI, latI] = ring[i];
            const [lonJ, latJ] = ring[j];

            const intersect = ((latI > lat) !== (latJ > lat)) &&
                (lon < (lonJ - lonI) * (lat - latI) / (latJ - latI) + lonI);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Obtener clasificación de transitabilidad según factor
     */
    getClasificacionTransitabilidad(factor) {
        if (factor >= 0.7) return 'Transitable';
        if (factor >= 0.4) return 'Difícil';
        if (factor >= 0.2) return 'Muy difícil';
        return 'Obstáculo';
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

    /**
     * 🛣️ CREAR CALCO AVENIDAS DE APROXIMACIÓN
     * Identifica corredores óptimos de movimiento usando Dijkstra
     */
    crearCalcoAvenidas(puntos_detalle) {
        console.log('🛣️ Creando calco Avenidas de Aproximación (Dijkstra)...');
        
        // Timestamp para nombre único
        const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nombreCalco = `🛣️ Avenidas Aproximación ${timestamp}`;
        
        // Construir grafo de conectividad
        console.log('📊 Construyendo grafo de conectividad...');
        const grafo = this.construirGrafo(puntos_detalle);
        
        // Identificar puntos de entrada/salida (bordes del área)
        const puntosExtremos = this.identificarPuntosExtremos(puntos_detalle);
        console.log(`🎯 Puntos extremos: ${puntosExtremos.length}`);
        
        // Calcular rutas óptimas entre extremos
        console.log('🔍 Calculando rutas óptimas (Dijkstra)...');
        const rutas = [];
        
        // Tomar pares de puntos extremos para generar rutas
        for (let i = 0; i < Math.min(puntosExtremos.length - 1, 10); i++) {
            const origen = puntosExtremos[i];
            const destino = puntosExtremos[puntosExtremos.length - 1 - i];
            
            const ruta = this.calcularRutaDijkstra(grafo, origen, destino, puntos_detalle);
            
            if (ruta && ruta.length > 5) { // Solo rutas con mínimo 5 nodos
                rutas.push(ruta);
            }
        }
        
        console.log(`✅ ${rutas.length} rutas óptimas calculadas`);
        
        // Analizar ancho de cada ruta
        console.log('📏 Analizando ancho de avenidas...');
        const avenidas = rutas.map(ruta => {
            const ancho = this.calcularAnchoAvenida(ruta, puntos_detalle);
            return { ruta, ancho };
        });
        
        // Crear calco
        if (typeof window.crearNuevoCalco === 'function') {
            const calcosAnteriores = Object.keys(window.calcos || {}).length;
            window.crearNuevoCalco();
            
            const nuevoNombre = `Calco ${calcosAnteriores + 1}`;
            if (window.calcos && window.calcos[nuevoNombre]) {
                window.calcos[nombreCalco] = window.calcos[nuevoNombre];
                delete window.calcos[nuevoNombre];
                
                // Pintar avenidas
                avenidas.forEach((avenida, idx) => {
                    const { ruta, ancho } = avenida;
                    
                    // Clasificar por ancho
                    let color, grosor, magnitud;
                    if (ancho.metros > 200) {
                        color = '#00FF00'; // Verde
                        grosor = 8;
                        magnitud = 'Batallón';
                    } else if (ancho.metros > 100) {
                        color = '#FFFF00'; // Amarillo
                        grosor = 6;
                        magnitud = 'Compañía';
                    } else {
                        color = '#FFA500'; // Naranja
                        grosor = 4;
                        magnitud = 'Pelotón';
                    }
                    
                    // Crear polyline
                    const coordenadas = ruta.map(nodo => [nodo.lat, nodo.lon]);
                    const polyline = L.polyline(coordenadas, {
                        color: color,
                        weight: grosor,
                        opacity: 0.8,
                        className: 'avenida-aproximacion'
                    }).bindTooltip(
                        `<strong>🛣️ Avenida ${idx + 1}</strong><br>` +
                        `<hr style="margin: 5px 0; border-color: #ccc;">` +
                        `<strong>📏 Ancho:</strong> ${ancho.metros.toFixed(0)}m<br>` +
                        `<strong>⚔️ Magnitud:</strong> ${magnitud}<br>` +
                        `<strong>📐 Pendiente promedio:</strong> ${ancho.pendientePromedio.toFixed(1)}°<br>` +
                        `<strong>🚶 Transitabilidad:</strong> ${ancho.transitabilidad.toFixed(0)}%<br>` +
                        `<strong>📍 Longitud:</strong> ${ruta.length} nodos`,
                        { permanent: false, direction: 'top', opacity: 0.95 }
                    );
                    
                    polyline.addTo(window.calcos[nombreCalco]);
                });
                
                console.log(`✅ Calco Avenidas: ${avenidas.length} rutas visualizadas`);
            }
        } else {
            console.error('❌ Sistema de calcos no disponible');
        }
    }

    /**
     * 🏗️ Construir grafo de conectividad entre puntos
     */
    construirGrafo(puntos) {
        const grafo = new Map();
        
        puntos.forEach((punto, idx) => {
            const vecinos = [];
            
            // Buscar vecinos en radio de ~100m (8-conectividad)
            puntos.forEach((otroPunto, otroIdx) => {
                if (idx === otroIdx) return;
                
                const distancia = this.calcularDistanciaMetros(
                    punto.lat, punto.lon,
                    otroPunto.lat, otroPunto.lon
                );
                
                // Conectar si está dentro del radio de resolución * 1.5
                if (distancia < this.resolucion * 1.5) {
                    // Calcular costo del movimiento
                    const costo = this.calcularCostoMovimiento(punto, otroPunto, distancia);
                    
                    vecinos.push({
                        idx: otroIdx,
                        costo: costo,
                        distancia: distancia
                    });
                }
            });
            
            grafo.set(idx, vecinos);
        });
        
        return grafo;
    }

    /**
     * 💰 Calcular costo de movimiento entre dos puntos
     */
    calcularCostoMovimiento(puntoA, puntoB, distancia) {
        // Factores que afectan el costo:
        // 1. Distancia euclidiana (base)
        let costo = distancia;
        
        // 2. Pendiente promedio (penalizar pendientes altas)
        const pendientePromedio = (puntoA.pendiente + puntoB.pendiente) / 2;
        if (pendientePromedio > 30) {
            costo *= 10; // Muy difícil
        } else if (pendientePromedio > 15) {
            costo *= 3; // Difícil
        } else if (pendientePromedio > 5) {
            costo *= 1.5; // Moderado
        }
        
        // 3. NDVI (vegetación densa dificulta movimiento)
        const ndviPromedio = (puntoA.ndvi + puntoB.ndvi) / 2;
        if (ndviPromedio > 0.6) {
            costo *= 2; // Vegetación densa
        } else if (ndviPromedio > 0.3) {
            costo *= 1.3; // Vegetación moderada
        }
        
        // 4. Diferencia de elevación (penalizar cambios bruscos)
        const deltaElevacion = Math.abs(puntoA.elevation - puntoB.elevation);
        costo += deltaElevacion * 0.5;
        
        return costo;
    }

    /**
     * 🎯 Identificar puntos extremos (bordes del área)
     */
    identificarPuntosExtremos(puntos) {
        // Encontrar límites del área
        const lats = puntos.map(p => p.lat);
        const lons = puntos.map(p => p.lon);
        
        const latMin = Math.min(...lats);
        const latMax = Math.max(...lats);
        const lonMin = Math.min(...lons);
        const lonMax = Math.max(...lons);
        
        const margen = 0.001; // ~100m
        
        // Puntos en los bordes
        const extremos = puntos.filter(p => {
            return p.lat < latMin + margen || p.lat > latMax - margen ||
                   p.lon < lonMin + margen || p.lon > lonMax - margen;
        });
        
        return extremos;
    }

    /**
     * 🔍 Algoritmo de Dijkstra para encontrar ruta óptima
     * Optimizado con MinHeap - O(E log V)
     */
    calcularRutaDijkstra(grafo, puntoOrigen, puntoDestino, todosPuntos) {
        // Encontrar índices
        const idxOrigen = todosPuntos.findIndex(p => 
            p.lat === puntoOrigen.lat && p.lon === puntoOrigen.lon
        );
        const idxDestino = todosPuntos.findIndex(p => 
            p.lat === puntoDestino.lat && p.lon === puntoDestino.lon
        );
        
        if (idxOrigen === -1 || idxDestino === -1) {
            console.warn('⚠️ No se encontraron índices origen/destino');
            return null;
        }
        
        console.log(`🔍 Dijkstra: ${idxOrigen} → ${idxDestino} (${grafo.size} nodos)`);
        
        // Inicializar estructuras de Dijkstra
        const distancias = new Map();
        const previos = new Map();
        const visitados = new Set();
        const heap = new MinHeap(); // 🚀 Priority Queue optimizada
        
        // Inicializar distancias a infinito
        grafo.forEach((_, idx) => {
            distancias.set(idx, Infinity);
        });
        distancias.set(idxOrigen, 0);
        
        // Heap inicial
        heap.insert({ idx: idxOrigen, distancia: 0 });
        
        let nodosExplorados = 0;
        
        // Algoritmo principal
        while (!heap.isEmpty()) {
            // Extraer nodo con menor distancia - O(log n)
            const { idx: actualIdx, distancia: distanciaActual } = heap.extractMin();
            
            nodosExplorados++;
            
            // Early termination: Si ya llegamos al destino
            if (actualIdx === idxDestino) {
                console.log(`✅ Ruta encontrada! Nodos explorados: ${nodosExplorados}/${grafo.size}`);
                break;
            }
            
            // Skip si ya visitado (puede haber duplicados en heap)
            if (visitados.has(actualIdx)) continue;
            visitados.add(actualIdx);
            
            // Skip si distancia obsoleta
            if (distanciaActual > distancias.get(actualIdx)) continue;
            
            // Explorar vecinos
            const vecinos = grafo.get(actualIdx) || [];
            
            vecinos.forEach(vecino => {
                if (visitados.has(vecino.idx)) return;
                
                const nuevaDistancia = distancias.get(actualIdx) + vecino.costo;
                
                if (nuevaDistancia < distancias.get(vecino.idx)) {
                    distancias.set(vecino.idx, nuevaDistancia);
                    previos.set(vecino.idx, actualIdx);
                    heap.insert({ idx: vecino.idx, distancia: nuevaDistancia });
                }
            });
        }
        
        // Reconstruir ruta
        if (!previos.has(idxDestino)) {
            console.warn('⚠️ No se encontró ruta entre puntos');
            return null;
        }
        
        const ruta = [];
        let actualIdx = idxDestino;
        let pasos = 0;
        
        while (actualIdx !== undefined && pasos < 10000) { // Safety limit
            ruta.unshift(todosPuntos[actualIdx]);
            actualIdx = previos.get(actualIdx);
            pasos++;
        }
        
        console.log(`📍 Ruta reconstruida: ${ruta.length} nodos`);
        
        return ruta;
    }

    /**
     * 📏 Calcular ancho de una avenida de aproximación
     */
    calcularAnchoAvenida(ruta, todosPuntos) {
        let anchoTotal = 0;
        let pendienteTotal = 0;
        let transitabilidadTotal = 0;
        let muestras = 0;
        
        ruta.forEach((nodo, idx) => {
            if (idx === 0 || idx === ruta.length - 1) return;
            
            // Calcular perpendicular a la ruta
            const anterior = ruta[idx - 1];
            const siguiente = ruta[idx + 1];
            
            // Vector dirección
            const dirLat = siguiente.lat - anterior.lat;
            const dirLon = siguiente.lon - anterior.lon;
            
            // Vector perpendicular (rotación 90°)
            const perpLat = -dirLon;
            const perpLon = dirLat;
            
            // Normalizar
            const mag = Math.sqrt(perpLat * perpLat + perpLon * perpLon);
            const perpLatNorm = perpLat / mag;
            const perpLonNorm = perpLon / mag;
            
            // Buscar puntos transitables a los lados
            let anchoIzq = 0;
            let anchoDer = 0;
            
            // Explorar hasta 500m a cada lado
            for (let dist = 50; dist <= 500; dist += 50) {
                const offsetLat = perpLatNorm * (dist / 111320);
                const offsetLon = perpLonNorm * (dist / (111320 * Math.cos(nodo.lat * Math.PI / 180)));
                
                // Lado izquierdo
                const puntoIzq = todosPuntos.find(p => 
                    Math.abs(p.lat - (nodo.lat + offsetLat)) < 0.0005 &&
                    Math.abs(p.lon - (nodo.lon + offsetLon)) < 0.0005
                );
                
                if (puntoIzq && puntoIzq.pendiente < 30) {
                    anchoIzq = dist;
                }
                
                // Lado derecho
                const puntoDer = todosPuntos.find(p => 
                    Math.abs(p.lat - (nodo.lat - offsetLat)) < 0.0005 &&
                    Math.abs(p.lon - (nodo.lon - offsetLon)) < 0.0005
                );
                
                if (puntoDer && puntoDer.pendiente < 30) {
                    anchoDer = dist;
                }
            }
            
            anchoTotal += anchoIzq + anchoDer;
            pendienteTotal += nodo.pendiente;
            transitabilidadTotal += nodo.pendiente < 30 ? 100 : 0;
            muestras++;
        });
        
        return {
            metros: muestras > 0 ? anchoTotal / muestras : 0,
            pendientePromedio: muestras > 0 ? pendienteTotal / muestras : 0,
            transitabilidad: muestras > 0 ? transitabilidadTotal / muestras : 0
        };
    }

    /**
     * 📍 Calcular distancia entre dos coordenadas (metros)
     */
    calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 🗺️ CAPAS GIS DEL IGN - Sistema on-demand
     */

    /**
     * Cargar capas GIS desde la UI
     */
    async cargarCapasGISDesdeUI() {
        const capasSeleccionadas = [];
        
        // Obtener capas individuales seleccionadas
        document.querySelectorAll('.check-capa:checked').forEach(checkbox => {
            capasSeleccionadas.push(checkbox.dataset.capa);
        });

        if (capasSeleccionadas.length === 0) {
            alert('⚠️ Selecciona al menos una capa GIS para cargar');
            return;
        }

        const btnCargar = document.getElementById('btnCargarCapasGIS');
        btnCargar.disabled = true;
        btnCargar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';

        try {
            const data = await this.cargarCapasGISArea(capasSeleccionadas);
            
            // Mostrar estadísticas
            const statsDiv = document.getElementById('statsCapasGIS');
            const statsTexto = document.getElementById('statsCapasTexto');
            
            statsTexto.innerHTML = `
                ✅ ${data.tiles_cargados} tiles cargados<br>
                📍 ${data.features_totales} features<br>
                ⏱️ ${data.tiempo_ms.toFixed(1)} ms
            `;
            statsDiv.style.display = 'block';
            
        } catch (error) {
            alert(`❌ Error cargando capas GIS: ${error.message}`);
        } finally {
            btnCargar.disabled = false;
            btnCargar.innerHTML = '<i class="fas fa-download"></i> Cargar Capas para Área Visible';
        }
    }

    /**
     * Cargar capas GIS para el área visible del mapa
     */
    async cargarCapasGISArea(capas = ['transporte', 'hidrografia', 'areas_urbanas']) {
        try {
            const bounds = this.map.getBounds();
            
            console.log('🗺️ Cargando capas GIS:', capas);
            console.log('📍 Bounds:', bounds);
            
            const response = await fetch('http://localhost:5001/api/capas_gis/consultar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bounds: {
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest()
                    },
                    capas: capas
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ Capas cargadas: ${data.tiles_cargados} tiles, ${data.features_totales} features`);
                console.log(`⏱️ Tiempo: ${data.tiempo_ms.toFixed(1)} ms`);
                
                this.mostrarCapasGIS(data.capas);
                return data;
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
            
        } catch (error) {
            console.error('❌ Error cargando capas GIS:', error);
            throw error;
        }
    }

    /**
     * Mostrar capas GIS en el mapa
     */
    mostrarCapasGIS(capasData) {
        // Transporte (6 capas)
        if (capasData.transporte) {
            if (capasData.transporte.rutas_nacionales) {
                this.agregarCapaGeoJSON('ruta_nacional', capasData.transporte.rutas_nacionales, 'transporte');
            }
            if (capasData.transporte.rutas_provinciales) {
                this.agregarCapaGeoJSON('ruta_provincial', capasData.transporte.rutas_provinciales, 'transporte');
            }
            if (capasData.transporte.caminos) {
                this.agregarCapaGeoJSON('caminos', capasData.transporte.caminos, 'transporte');
            }
            if (capasData.transporte.ferrocarril) {
                this.agregarCapaGeoJSON('ferrocarril', capasData.transporte.ferrocarril, 'transporte');
            }
            if (capasData.transporte.infraestructura_vial) {
                this.agregarCapaGeoJSON('infraestructura_vial', capasData.transporte.infraestructura_vial, 'transporte');
            }
            if (capasData.transporte.cruces_enlaces) {
                this.agregarCapaGeoJSON('cruces_enlaces', capasData.transporte.cruces_enlaces, 'transporte');
            }
        }
        
        // Hidrografía (2 capas)
        if (capasData.hidrografia) {
            if (capasData.hidrografia.cursos_agua) {
                this.agregarCapaGeoJSON('curso_agua_permanente', capasData.hidrografia.cursos_agua, 'hidrografia');
            }
            if (capasData.hidrografia.espejos_agua) {
                this.agregarCapaGeoJSON('espejo_agua_permanente', capasData.hidrografia.espejos_agua, 'hidrografia');
            }
        }
        
        // Áreas urbanas (1 capa)
        if (capasData.areas_urbanas) {
            if (capasData.areas_urbanas.localidades) {
                this.agregarCapaGeoJSON('localidades', capasData.areas_urbanas.localidades, 'areas_urbanas');
            }
        }
        
        // Comunicaciones (2 capas)
        if (capasData.comunicaciones) {
            if (capasData.comunicaciones.torres_comunicacion) {
                this.agregarCapaGeoJSON('torres_comunicacion', capasData.comunicaciones.torres_comunicacion, 'comunicaciones');
            }
            if (capasData.comunicaciones.nodos_comunicacion) {
                this.agregarCapaGeoJSON('nodos_comunicacion', capasData.comunicaciones.nodos_comunicacion, 'comunicaciones');
            }
        }
        
        // Suelos (7 capas)
        if (capasData.suelos) {
            if (capasData.suelos.arenal) {
                this.agregarCapaGeoJSON('arenal', capasData.suelos.arenal, 'suelos');
            }
            if (capasData.suelos.afloramiento_rocoso) {
                this.agregarCapaGeoJSON('afloramiento_rocoso', capasData.suelos.afloramiento_rocoso, 'suelos');
            }
            if (capasData.suelos.barrial) {
                this.agregarCapaGeoJSON('barrial', capasData.suelos.barrial, 'suelos');
            }
            if (capasData.suelos.pedregal) {
                this.agregarCapaGeoJSON('pedregal', capasData.suelos.pedregal, 'suelos');
            }
            if (capasData.suelos.sedimento_fluvial) {
                this.agregarCapaGeoJSON('sedimento_fluvial', capasData.suelos.sedimento_fluvial, 'suelos');
            }
            if (capasData.suelos.cumbre_rocosa) {
                this.agregarCapaGeoJSON('cumbre_rocosa', capasData.suelos.cumbre_rocosa, 'suelos');
            }
            if (capasData.suelos.salina) {
                this.agregarCapaGeoJSON('salina', capasData.suelos.salina, 'suelos');
            }
        }
        
        // Vegetación (6 capas)
        if (capasData.vegetacion) {
            if (capasData.vegetacion.vegetacion_hidrofila) {
                this.agregarCapaGeoJSON('vegetacion_hidrofila', capasData.vegetacion.vegetacion_hidrofila, 'vegetacion');
            }
            if (capasData.vegetacion.bosque_tipo_3) {
                this.agregarCapaGeoJSON('bosque_tipo_3', capasData.vegetacion.bosque_tipo_3, 'vegetacion');
            }
            if (capasData.vegetacion.bosque_nativo_1) {
                this.agregarCapaGeoJSON('bosque_nativo_1', capasData.vegetacion.bosque_nativo_1, 'vegetacion');
            }
            if (capasData.vegetacion.vegetacion_arbustiva) {
                this.agregarCapaGeoJSON('vegetacion_arbustiva', capasData.vegetacion.vegetacion_arbustiva, 'vegetacion');
            }
            if (capasData.vegetacion.bosque_nativo_2) {
                this.agregarCapaGeoJSON('bosque_nativo_2', capasData.vegetacion.bosque_nativo_2, 'vegetacion');
            }
            if (capasData.vegetacion.cultivo_arboreo) {
                this.agregarCapaGeoJSON('cultivo_arboreo', capasData.vegetacion.cultivo_arboreo, 'vegetacion');
            }
        }
        
        // Geomorfología (1 capa)
        if (capasData.geomorfologia) {
            if (capasData.geomorfologia.lineas_geomorfologia) {
                this.agregarCapaGeoJSON('lineas_geomorfologia', capasData.geomorfologia.lineas_geomorfologia, 'geomorfologia');
            }
        }
    }

    /**
     * Agregar capa GeoJSON al mapa con estilo
     */
    agregarCapaGeoJSON(tipo, geojson, categoria) {
        // Limpiar capa anterior si existe
        if (this.capasGIS[categoria]) {
            this.map.removeLayer(this.capasGIS[categoria]);
        }
        
        const estilo = this.config.estilosGIS[tipo] || {};
        
        const capa = L.geoJSON(geojson, {
            style: estilo,
            onEachFeature: (feature, layer) => {
                // Popup con información
                if (feature.properties) {
                    const props = feature.properties;
                    let popupContent = `<strong>${tipo.replace(/_/g, ' ').toUpperCase()}</strong><br>`;
                    
                    if (props.nombre || props.nam) {
                        popupContent += `Nombre: ${props.nombre || props.nam}<br>`;
                    }
                    if (props.tipo) {
                        popupContent += `Tipo: ${props.tipo}<br>`;
                    }
                    if (props.poblacion || props.pob) {
                        popupContent += `Población: ${props.poblacion || props.pob}<br>`;
                    }
                    
                    layer.bindPopup(popupContent);
                }
            }
        });
        
        this.capasGIS[categoria] = capa;
        this.capasGISActivas.add(categoria);
        
        capa.addTo(this.map);
        
        console.log(`🗂️ Capa agregada: ${tipo} (${geojson.features.length} features)`);
    }

    /**
     * Activar/desactivar capa GIS
     */
    toggleCapaGIS(categoria) {
        if (this.capasGISActivas.has(categoria)) {
            // Desactivar
            if (this.capasGIS[categoria]) {
                this.map.removeLayer(this.capasGIS[categoria]);
            }
            this.capasGISActivas.delete(categoria);
            console.log(`🔴 Capa desactivada: ${categoria}`);
        } else {
            // Activar - cargar si no está cargada
            this.cargarCapasGISArea([categoria]);
            console.log(`🟢 Capa activada: ${categoria}`);
        }
    }

    /**
     * Limpiar todas las capas GIS
     */
    limpiarCapasGIS() {
        for (const categoria in this.capasGIS) {
            if (this.capasGIS[categoria]) {
                this.map.removeLayer(this.capasGIS[categoria]);
                this.capasGIS[categoria] = null;
            }
        }
        this.capasGISActivas.clear();
        console.log('🧹 Capas GIS limpiadas');
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
