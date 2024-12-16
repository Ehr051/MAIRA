
class SistemaTurnos {
    // 1. MÉTODOS BÁSICOS DE CONSULTA Y VALIDACIÓN
    getJugadorActual() {
        if (!this.jugadores || this.jugadores.length === 0) {
            console.error('Error: Lista de jugadores vacía.');
            return null;
        }
        const jugador = this.jugadores[this.jugadorActualIndex];
        if (!jugador) {
            console.error(`Error: Jugador no encontrado en índice ${this.jugadorActualIndex}`);
        }
        return jugador;
    }
    
    getFaseActual() {
        return this.fase;
    }

    esJugadorActual(jugadorId) {
        if (!this.jugadores || !jugadorId) return false;
        const jugadorActual = this.jugadores[this.jugadorActualIndex];
        return jugadorActual && jugadorActual.id === jugadorId;
    }

    esDirector(jugadorId) {
        return this.director && this.director.id === jugadorId;
    }

    puedeDefinirSector(jugadorId) {
        console.log('Verificando permisos para definir sector:', {
            jugadorId,
            primerJugadorId: this.primerJugador?.id,
            esDirectorTemporal: this.esDirectorTemporal,
            fase: this.fase,
            subfase: this.subfase
        });

        // Solo en fase preparación y subfase definicion_sector
        if (this.fase !== 'preparacion' || this.subfase !== 'definicion_sector') {
            console.log('Fase o subfase incorrecta');
            return false;
        }

        // Si hay director asignado, solo él puede definir
        if (this.director) {
            const puedeDefinir = this.esDirector(jugadorId);
            console.log('Verificación con director asignado:', puedeDefinir);
            return puedeDefinir;
        }

        // Si no hay director, solo el director temporal (primer jugador) puede definir
        const puedeDefinir = this.esDirectorTemporal && jugadorId === this.primerJugador.id;
        console.log('Verificación con director temporal:', puedeDefinir);
        return puedeDefinir;
    }

    attachButtonListeners() {
            const botonesContainer = document.getElementById('botonesContainer');
            if (!botonesContainer) return;
    
            const buttons = {
                'btnDefinirSector': () => this.iniciarDefinicionSector(),
                'btnDefinirZonaAzul': () => this.iniciarDefinicionZona('azul'),
                'btnDefinirZonaRoja': () => this.iniciarDefinicionZona('rojo'),
                'btnFinalizarDespliegue': () => this.finalizarDespliegue(),
                'btnConfirmarSector': () => this.confirmarSector(),
                'btnCancelarSector': () => this.cancelarDefinicionSector()
            };
    
            // Remover listeners antiguos para evitar duplicados
            const oldButtons = botonesContainer.getElementsByTagName('button');
            Array.from(oldButtons).forEach(button => {
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
            });
    
            // Agregar nuevos listeners
            Array.from(botonesContainer.getElementsByTagName('button')).forEach(button => {
                const handler = buttons[button.id];
                if (handler) {
                    console.log(`Agregando listener para botón: ${button.id}`);
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        handler.call(this);
                    });
                }
            });
        }
    
        // Método auxiliar para agregar un solo botón
        addButton(containerId, buttonConfig) {
            const container = document.getElementById(containerId);
            if (!container) return null;
    
            const button = document.createElement('button');
            button.id = buttonConfig.id;
            button.className = buttonConfig.className || 'btn';
            button.textContent = buttonConfig.text;
            
            if (buttonConfig.handler) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    buttonConfig.handler.call(this);
                });
            }
    
            container.appendChild(button);
            return button;
        }
    
        // Método para limpiar listeners antiguos
        clearButtonListeners(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
    
            const buttons = container.getElementsByTagName('button');
            Array.from(buttons).forEach(button => {
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
            });
        }
    
        // Método para actualizar un botón específico
        updateButton(buttonId, config) {
            const button = document.getElementById(buttonId);
            if (!button) return;
    
            if (config.text) button.textContent = config.text;
            if (config.className) button.className = config.className;
            if (config.disabled !== undefined) button.disabled = config.disabled;
            
            // Reemplazar handler si se proporciona uno nuevo
            if (config.handler) {
                const newButton = button.cloneNode(true);
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    config.handler.call(this);
                });
                button.parentNode.replaceChild(newButton, button);
            }
        }
    
    
    // Añadir método para manejar la identificación de jugadores por equipo
    getJugadoresPorEquipo(equipo) {
        return this.jugadores.filter(j => j.equipo === equipo)
            .map(j => ({
                ...j,
                orden: j.id === this.primerJugador?.id ? 0 : parseInt(j.id)
            }))
            .sort((a, b) => a.orden - b.orden);
    }

    puedeDesplegarEnPosicion(equipo, posicion) {
        if (!this.zonasDespliegue[equipo]) {
            return false;
        }
        return this.zonasDespliegue[equipo].contains(posicion);
    }

    verificarTodosListos() {
        return this.jugadores.every(j => j.despliegueListo);
    }
    iniciarDefinicionZona(equipo) {
        console.log('Iniciando definición de zona para equipo:', equipo); // Añadir log
        
        if (!this.sectorDefinido || !this.sectorConfirmado) {
            this.mostrarMensajeAyuda('Primero debe confirmarse el sector');
            return false;
        }

        // Validar secuencia correcta
        if (equipo === 'azul' && !this.zonasDespliegue.rojo) {
            this.mostrarMensajeAyuda('Primero debe definirse y confirmarse la zona roja');
            return false;
        }

        // Validar que no haya una zona en definición actualmente
        if (this.zonaPendiente) {
            this.mostrarMensajeAyuda('Ya hay una zona en proceso de definición');
            return false;
        }

        // Validar equipo
        if (equipo !== 'azul' && equipo !== 'rojo') {
            console.error('Equipo inválido:', equipo);
            return false;
        }

        // Si ya existe una zona para este equipo, mostrar confirmación
        if (this.zonasDespliegue[equipo]) {
            if (!confirm(`¿Desea redefinir la zona del equipo ${equipo}?`)) {
                return false;
            }
        }

        // Deshabilitar herramienta activa si existe
        if (this.herramientaDibujoActiva) {
            this.herramientaDibujoActiva.disable();
        }

        // Obtener la herramienta correcta - Modificado aquí
        const nombreHerramienta = equipo === 'rojo' ? 'zonaRoja' : 'zonaAzul';
        const herramienta = this.herramientasDibujo[nombreHerramienta];

        console.log('Herramienta de dibujo:', nombreHerramienta, herramienta); // Añadir log para debug

        if (!herramienta) {
            console.error('Herramienta de dibujo no encontrada:', {
                equipo,
                nombreHerramienta,
                herramientasDisponibles: Object.keys(this.herramientasDibujo)
            });
            return false;
        }

        // Activar la nueva herramienta
        herramienta.enable();
        this.herramientaDibujoActiva = herramienta;
        this.zonaPendiente = equipo;
        this.dibujandoZona = equipo; // Asegurarse de establecer esto

        // Actualizar botones
        this.mostrarBotonesConfirmacionZona(equipo);
        this.mostrarMensajeAyuda(`Dibuje la zona de despliegue para el equipo ${equipo}`);
        return true;
    }

    // Modificar el método para mostrar los botones de confirmación de zona
    mostrarBotonesConfirmacionZona(equipo) {
        const botonesContainer = document.getElementById('botonesContainer');
        if (!botonesContainer) return;

        botonesContainer.innerHTML = `
            <button id="btnConfirmarZona${equipo}" class="btn btn-success">
                Confirmar Zona ${equipo}
            </button>
            <button id="btnCancelarZona${equipo}" class="btn btn-danger">
                Cancelar
            </button>
        `;

        document.getElementById(`btnConfirmarZona${equipo}`).addEventListener('click', () => this.confirmarZona(equipo));
        document.getElementById(`btnCancelarZona${equipo}`).addEventListener('click', () => this.cancelarDefinicionZona());
    }

    // Modificar el método para confirmar zona
    confirmarZona(equipo) {
        if (!this.zonaTemporalLayer) {
            this.mostrarMensajeAyuda('No hay zona para confirmar');
            return;
        }
    
        const bounds = this.zonaTemporalLayer.getBounds();
        
        // Validar que la zona esté dentro del sector
        if (!this.validarZonaEnSector(bounds)) {
            this.mostrarMensajeAyuda('La zona debe estar completamente dentro del sector de juego');
            return;
        }
    
        try {
            // Guardar la zona
            this.zonasDespliegue[equipo] = bounds;
            
            // Limpiar zona anterior si existe
            if (this.zonasLayers[equipo]) {
                window.calcoActivo.removeLayer(this.zonasLayers[equipo]);
            }
    
            // Aplicar estilo final
            this.zonaTemporalLayer.setStyle({
                color: equipo === 'azul' ? '#0000ff' : '#ff0000',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.2
            });
    
            // Actualizar referencias
            this.zonasLayers[equipo] = this.zonaTemporalLayer;
            this.zonaTemporalLayer = null;
            this.zonaPendiente = null;
    
            // Notificar al servidor en modo online
            if (this.socket) {
                this.socket.emit('zonaDespliegueDefinida', {
                    equipo,
                    zona: bounds,
                    jugadorId: this.getJugadorActual().id
                });
            }
    
            // Actualizar interfaz según la secuencia
            if (equipo === 'rojo') {
                this.actualizarBotonesParaZonaAzul();
            } else if (equipo === 'azul') {
                this.mostrarBotonFinalizarFase();
            }
    
            // Hacer zoom a la zona
            this.faseController.centrarVistaEnZona(equipo);
    
        } catch (error) {
            console.error('Error al confirmar zona:', error);
            this.mostrarMensajeAyuda('Error al confirmar la zona');
        }
    }

    // Nuevo método para mostrar el botón de zona azul
    actualizarBotonesParaZonaAzul() {
        const botonesContainer = document.getElementById('botonesContainer');
        if (!botonesContainer) return;

        botonesContainer.innerHTML = `
            <button id="btnDefinirZonaAzul" class="btn btn-info">
                Definir Zona Azul
            </button>
        `;

        document.getElementById('btnDefinirZonaAzul').addEventListener('click', 
            () => this.iniciarDefinicionZona('azul'));
    }

    // Nuevo método para mostrar el botón de finalizar fase
    mostrarBotonFinalizarFase() {
        const botonesContainer = document.getElementById('botonesContainer');
        if (!botonesContainer) return;

        botonesContainer.innerHTML = `
            <button id="btnFinalizarFasePreparacion" class="btn btn-success">
                Finalizar Fase de Preparación
            </button>
        `;

        document.getElementById('btnFinalizarFasePreparacion').addEventListener('click', 
            () => this.finalizarFasePreparacion());
    }

    // Nuevo método para finalizar la fase de preparación
    finalizarFasePreparacion() {
        // Restaurar el rol original del director temporal
        if (this.esDirectorTemporal) {
            console.log(`Restaurando rol de jugador para: ${this.primerJugador.username}`);
            this.director = null;
            this.esDirectorTemporal = false;
            this.primerJugador.rolTemporal = null;
            
            // Emitir evento si es online
            if (this.socket) {
                this.socket.emit('directorTemporalRestaurado', {
                    jugadorId: this.primerJugador.id,
                    equipoOriginal: this.directorTemporalEquipo
                });
            }
        }

        // Cambiar a la subfase de despliegue
        this.cambiarSubfase('despliegue');
        this.mostrarMensajeAyuda('Fase de preparación completada. Iniciando fase de despliegue...');
    }

    
    manejarDibujoSector(layer) {
        console.log('Procesando dibujo de sector');
    
        try {
            // Guardar referencias
            this.sectorLayer = layer;
            this.sectorTemporal = layer;
            
            // Agregar al mapa
            window.calcoActivo.addLayer(layer);
            
            // Hacer editable
            this.hacerLayerEditable(layer);
            
            // Mostrar botones
            this.actualizarBotonesConfirmacionSector();
            
            // Actualizar estado
            this.dibujandoSector = false;
            this.sectorDefinido = true;
            
            console.log('Sector procesado correctamente');
        } catch (error) {
            console.error('Error al procesar sector:', error);
            throw error;
        }
    }
    

    actualizarBotonesConfirmacionSector() {
        const botonesContainer = document.getElementById('botonesContainer');
        if (!botonesContainer) {
            console.error('Contenedor de botones no encontrado');
            return;
        }
    
        console.log('Actualizando botones de confirmación de sector');
        
        botonesContainer.innerHTML = `
            <button id="btnConfirmarSector" class="btn btn-success">
                Confirmar Sector
            </button>
            <button id="btnCancelarSector" class="btn btn-danger">
                Cancelar
            </button>
        `;
    
        // Agregar event listeners
        document.getElementById('btnConfirmarSector')?.addEventListener('click', () => {
            this.confirmarSector();
        });
        
        document.getElementById('btnCancelarSector')?.addEventListener('click', () => {
            this.cancelarDefinicionSector();
        });
    }

    // 1. En SistemaTurnos, agregar el método hacerLayerEditable que falta
    hacerLayerEditable(layer) {
        if (!layer) {
            console.error('Layer inválida para hacer editable');
            return;
        }

        console.log('Haciendo layer editable:', layer);

        if (layer.editing && typeof layer.editing.enable === 'function') {
            layer.editing.enable();
            
            layer.on('edit', (e) => {
                console.log('Sector siendo editado');
                if (this.sectorLayer === layer) {
                    this.sectorJuego = layer.getBounds();
                }
            });
        } else {
            console.warn('Las capacidades de edición no están disponibles para esta capa');
        }
    }

    // 2. Corregir manejarDibujoCreado
    manejarDibujoCreado(e) {
        console.log('Manejando dibujo creado:', {
            tipo: e.layerType,
            layer: e.layer,
            dibujandoSector: this.dibujandoSector,
            dibujandoZona: this.dibujandoZona,
            fase: this.fase,
            subfase: this.subfase
        });
    
        const jugadorActual = this.getJugadorActual();
        if (!jugadorActual) {
            console.error('No se pudo obtener el jugador actual');
            return;
        }
    
        try {
            const layer = e.layer;
    
            // PROBLEMA: this.dibujandoSector está perdiendo su valor
            // Necesitamos guardarlo en una variable local
            const estaDibujandoSector = this.dibujandoSector;
            console.log('Estado de dibujo al manejar:', {
                dibujandoSector: estaDibujandoSector,
                dibujandoZona: this.dibujandoZona
            });
    
            if (estaDibujandoSector) {
                console.log('Manejando dibujo de sector');
                if (!this.puedeDefinirSector(jugadorActual.id)) {
                    throw new Error('No tienes permisos para definir el sector');
                }
                
                this.manejarDibujoSector(layer);
            } else if (this.dibujandoZona) {
                console.log('Manejando dibujo de zona');
                if (!this.puedeDefinirZonas(jugadorActual.id)) {
                    throw new Error('No tienes permisos para definir zonas');
                }
                this.manejarDibujoZona(layer);
            } else {
                console.warn('No hay dibujo activo');
                throw new Error('No se están dibujando sector ni zonas');
            }
        } catch (error) {
            console.error('Error en manejo de dibujo:', error);
            this.mostrarMensajeAyuda(error.message);
            if (e.layer) {
                window.calcoActivo.removeLayer(e.layer);
            }
        }
    }

    // 3. Corregir iniciarDefinicionSector para asegurar que dibujandoSector se establece correctamente
    iniciarDefinicionSector() {
        console.log('Iniciando definición de sector');
        
        const jugadorActual = this.getJugadorActual();
        if (!jugadorActual) {
            console.error('No se pudo obtener el jugador actual');
            return;
        }
        
        if (!this.puedeDefinirSector(jugadorActual.id)) {
            this.mostrarMensajeAyuda('No tienes permisos para definir el sector');
            return;
        }

        // Limpiar sector anterior si existe
        if (this.sectorLayer) {
            window.calcoActivo.removeLayer(this.sectorLayer);
            this.sectorLayer = null;
        }
        if (this.sectorTemporal) {
            window.calcoActivo.removeLayer(this.sectorTemporal);
            this.sectorTemporal = null;
        }

        // Establecer estado de dibujo
        this.dibujandoSector = true;
        this.dibujandoZona = null;
        this.sectorDefinido = false;
        this.sectorConfirmado = false;

        console.log('Estado de dibujo establecido:', {
            dibujandoSector: this.dibujandoSector,
            dibujandoZona: this.dibujandoZona
        });

        // Activar herramienta de dibujo
        if (this.herramientasDibujo?.sector) {
            this.herramientasDibujo.sector.enable();
            this.mostrarMensajeAyuda('Dibuja un rectángulo para definir el sector de juego');
        } else {
            console.error('Herramienta de dibujo de sector no encontrada');
        }
    }
    // Modificar cambiarSubfase para que no inicie automáticamente la definición de zona
    cambiarSubfase(nuevaSubfase) {
        console.log('Cambiando subfase a:', nuevaSubfase);
        
        const subfaseAnterior = this.subfase;
        this.subfase = nuevaSubfase;
        
        // Limpiar estado según la subfase anterior
        switch (subfaseAnterior) {
            case 'definicion_sector':
                this.limpiarHerramientasDibujoSector();
                break;
            case 'definicion_zonas':
                this.limpiarHerramientasDibujoZonas();
                break;
        }
        
        // Actualizar la interfaz y botones
        this.actualizarInterfazCompleta();
        this.actualizarBotones();
        
        // Emitir evento de cambio de subfase
        this.eventos.dispatchEvent(new CustomEvent('cambioSubfase', {
            detail: {
                subfaseAnterior,
                nuevaSubfase,
                fase: this.fase
            }
        }));
    }

    // Función unificada para actualización de botones
    actualizarBotones() {
        const botonesContainer = document.getElementById('botonesContainer');
        if (!botonesContainer) return;

        botonesContainer.innerHTML = '';
        const jugadorActual = this.getJugadorActual();

        const configuracionBotones = {
            'definicion_sector': () => {
                if (this.puedeDefinirSector(jugadorActual.id)) {
                    return [{
                        id: 'btnDefinirSector',
                        texto: 'Definir Sector',
                        clase: 'btn-primary',
                        handler: () => this.iniciarDefinicionSector()
                    }];
                }
            },
            'definicion_zonas': () => {
                if (this.puedeDefinirZonas(jugadorActual.id)) {
                    if (!this.zonasDespliegue.rojo) {
                        return [{
                            id: 'btnDefinirZonaRoja',
                            texto: 'Definir Zona Roja',
                            clase: 'btn-danger',
                            handler: () => this.iniciarDefinicionZona('rojo')
                        }];
                    } else if (!this.zonasDespliegue.azul) {
                        return [{
                            id: 'btnDefinirZonaAzul',
                            texto: 'Definir Zona Azul',
                            clase: 'btn-info',
                            handler: () => this.iniciarDefinicionZona('azul')
                        }];
                    }
                } 
            },
            'despliegue': () => [{
                id: 'btnFinalizarDespliegue',
                texto: 'Finalizar Despliegue', // Cambiado de 'Listo para Combate'
                clase: 'btn-success',
                handler: () => this.finalizarDespliegue()
            }]
        };

        const botones = configuracionBotones[this.subfase] && configuracionBotones[this.subfase]();
        if (botones) {
            botones.forEach(boton => {
                const btn = document.createElement('button');
                btn.id = boton.id;
                btn.className = `btn ${boton.clase}`;
                btn.textContent = boton.texto;
                btn.addEventListener('click', boton.handler);
                botonesContainer.appendChild(btn);
            });
        }
    }

    // Modificar puedeDefinirZonas para una validación más clara
    puedeDefinirZonas(jugadorId) {
        const puedeDefinir = this.esDirector(jugadorId) || 
                            (this.esDirectorTemporal && jugadorId === this.primerJugador.id);
        console.log('Verificando permisos para definir zonas:', {
            jugadorId,
            esDirector: this.esDirector(jugadorId),
            esDirectorTemporal: this.esDirectorTemporal,
            primerJugadorId: this.primerJugador?.id,
            puedeDefinir
        });
        return puedeDefinir;
    }



    // 2. MÉTODOS DE CONTROL DE FASE Y TURNO
    cambiarFase(nuevaFase) {
        this.faseController.cambiarFase(nuevaFase);
        this.faseController.actualizarVisibilidad();
    }
    
    cambiarAFaseDespliegue() {
        if (!this.sectorDefinido || !this.zonasDespliegue.azul || !this.zonasDespliegue.rojo) {
            this.mostrarMensajeAyuda('Deben definirse el sector y ambas zonas antes de pasar a despliegue');
            return false;
        }
    
        this.fase = 'preparacion';
        this.subfase = 'despliegue';
        this.actualizarInterfazCompleta();
        this.mostrarMensajeAyuda('Fase de despliegue iniciada. Los jugadores pueden colocar sus elementos.');
        
        return true;
    }
    
    verificarFinPreparacion() {
        const todosListos = this.jugadores.every(j => j.despliegueListo);
        if (todosListos) {
            this.cambiarFase('combate');
            this.iniciarReloj();
        }
    }

    limpiarCapasMapa() {
        if (this.sectorLayer) this.sectorLayer.remove();
        if (this.zonasLayers) {
            Object.values(this.zonasLayers).forEach(layer => {
                if (layer && layer.remove) layer.remove();
            });
        }
    }

    limpiarHerramientasDibujoSector() {
        if (this.herramientasDibujo?.sector) {
            this.herramientasDibujo.sector.disable();
        }
    }

    limpiarHerramientasDibujoZonas() {
        ['zonaAzul', 'zonaRoja'].forEach(zona => {
            if (this.herramientasDibujo?.[zona]) {
                this.herramientasDibujo[zona].disable();
            }
        });
    }

    // 2. CONFIGURACIÓN UI
    getUIConfig() {
        return {
            preparacion: {
                definicion_sector: {
                    titulo: 'Definición de Sector',
                    descripcion: 'El director debe definir el sector de juego',
                    botones: [
                        {
                            id: 'btnDefinirSector',
                            texto: 'Definir Sector',
                            clase: 'btn-primary',
                            condicion: () => this.puedeDefinirSector(this.getJugadorActual().id)
                        }
                    ]
                },
                definicion_zonas: {
                    titulo: 'Definición de Zonas',
                    descripcion: 'Definir zonas de despliegue para cada equipo',
                    botones: [
                        {
                            id: 'btnDefinirZonaAzul',
                            texto: 'Definir Zona Azul',
                            clase: 'btn-info',
                            condicion: () => this.esDirector(this.getJugadorActual().id)
                        },
                        {
                            id: 'btnDefinirZonaRoja',
                            texto: 'Definir Zona Roja',
                            clase: 'btn-danger',
                            condicion: () => this.esDirector(this.getJugadorActual().id)
                        }
                    ]
                },
                despliegue: {
                    titulo: 'Fase de Despliegue',
                    descripcion: 'Despliegue de unidades en zonas asignadas',
                    botones: [
                        {
                            id: 'btnFinalizarDespliegue',
                            texto: 'Listo para Combate',
                            clase: 'btn-success',
                            condicion: () => true
                        }
                    ]
                }
            },
            combate: {
                titulo: 'Fase de Combate',
                descripcion: 'Ejecutar acciones de combate',
                botones: [
                    {
                        id: 'btnFinalizarTurno',
                        texto: 'Finalizar Turno',
                        clase: 'btn-warning',
                        condicion: () => this.esJugadorActual(this.getJugadorActual().id)
                    }
                ]
            }
        };
    }

    manejarFinDibujo(e) {
        console.log('Finalizando dibujo');
    }

    inicializarHerramientasDibujo() {
    if (!window.mapa) {
        console.error('Mapa no inicializado');
        return;
    }

    // Configuración base para las herramientas de dibujo
    const opcionesBase = {
        showArea: true,
        metric: true,
        repeatMode: false,
        shapeOptions: {
            stroke: true,
            clickable: true,
            draggable: true,
            transform: true
        }
    };

    try {
        this.herramientasDibujo = {
            
                sector: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    metric: true,
                    repeatMode: false,
                    shapeOptions: {
                        stroke: true,
                        color: '#ff7800',
                        weight: 2,
                        opacity: 0.8,
                        fill: false,
                        fillColor: '#ff7800',
                        fillOpacity: 0.2,
                        clickable: true,
                        editable: true
                    }
                }),
                
            
                zonaRoja: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    metric: true,
                    repeatMode: false,
                    shapeOptions: {
                        stroke: true,
                        color: '#ff0000',
                        weight: 2,
                        opacity: 0.8,
                        fill: true,
                        fillColor: '#ff0000',
                        fillOpacity: 0.1,
                        clickable: true
                    }
                }),
                zonaAzul: new L.Draw.Polygon(window.mapa, {
                    showArea: true,
                    metric: true,
                    repeatMode: false,
                    shapeOptions: {
                        stroke: true,
                        color: '#0000ff',
                        weight: 2,
                        opacity: 0.8,
                        fill: true,
                        fillColor: '#0000ff',
                        fillOpacity: 0.1,
                        clickable: true
                    }
                })
            };

        // Verificar que las herramientas se crearon correctamente
        Object.keys(this.herramientasDibujo).forEach(key => {
            if (!this.herramientasDibujo[key]) {
                throw new Error(`No se pudo crear la herramienta de dibujo: ${key}`);
            }
        });

        // Configurar eventos del mapa para las herramientas de dibujo
        window.mapa.on(L.Draw.Event.CREATED, this.manejarDibujoCreado.bind(this));
        window.mapa.on(L.Draw.Event.DRAWSTART, this.manejarInicioDibujo.bind(this));
        window.mapa.on(L.Draw.Event.DRAWSTOP, this.manejarFinDibujo.bind(this));

        console.log('Herramientas de dibujo inicializadas correctamente');

    } catch (error) {
        console.error('Error al inicializar herramientas de dibujo:', error);
        throw new Error('No se pudieron inicializar las herramientas de dibujo');
    }
    }

    // 1. Función consolidada para confirmación de sector
    confirmarSector() {
        console.log('Iniciando confirmación de sector');
        
        // Verificar sector
        const layerParaConfirmar = this.sectorLayer || this.sectorTemporal;
        if (!layerParaConfirmar) {
            this.mostrarMensajeAyuda('No hay sector para confirmar');
            return false;
        }
    
        try {
            // Actualizar capa y estado
            this.sectorLayer = layerParaConfirmar;
            this.sectorJuego = this.sectorLayer.getBounds();
            
            // Deshabilitar edición y aplicar estilo final
            if (this.sectorLayer.editing) {
                this.sectorLayer.editing.disable();
            }
            
            this.sectorLayer.setStyle({
                color: '#ff7800',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.2,
                zIndex: 1000
            });
    
            // Actualizar estado interno
            this.sectorDefinido = true;
            this.sectorConfirmado = true;
            this.dibujandoSector = false;
    
            // Notificar al servidor en modo online
            if (this.socket) {
                this.socket.emit('sectorConfirmado', {
                    bounds: this.sectorJuego,
                    jugadorId: this.getJugadorActual().id
                });
            }
    
            // Actualizar interfaz
            this.cambiarSubfase('definicion_zonas');
            this.actualizarBotones();
            this.mostrarMensajeAyuda('Sector confirmado. Define las zonas de despliegue.');
    
            return true;
    
        } catch (error) {
            console.error('Error al confirmar sector:', error);
            this.mostrarMensajeAyuda('Error al confirmar el sector');
            return false;
        }
    }

    
    actualizarInterfazSegunRol() {
        const jugadorActual = this.getJugadorActual();
        if (!jugadorActual) {
            console.warn('No se pudo obtener el jugador actual');
            return;
        }

        console.log('Actualizando interfaz para jugador:', {
            id: jugadorActual.id,
            equipo: jugadorActual.equipo,
            esDirector: this.esDirector(jugadorActual.id),
            fase: this.fase,
            subfase: this.subfase
        });

        const botonesContainer = document.getElementById('botonesContainer');
        const mensajesContainer = document.getElementById('mensajesPanel');
        
        if (!botonesContainer || !mensajesContainer) {
            console.error('Contenedores no encontrados');
            return;
        }

        // Limpiar contenedores
        botonesContainer.innerHTML = '';
        
        // Mostrar interfaz según fase y rol
        switch (this.subfase) {
            case 'definicion_sector':
                if (this.puedeDefinirSector(jugadorActual.id)) {
                    botonesContainer.innerHTML = `
                        <button id="btnDefinirSector" class="btn btn-primary">
                            Definir Sector
                        </button>
                    `;
                    this.attachButtonListeners();
                } else {
                    mensajesContainer.innerHTML = `
                        <div class="mensaje-espera">
                            El Director está estableciendo el sector de juego
                        </div>
                    `;
                }
                break;
                
            case 'definicion_zonas':
                if (this.puedeDefinirZonas(jugadorActual.id)) {
                    if (!this.zonasDespliegue.rojo) {
                        botonesContainer.innerHTML = `
                            <button id="btnDefinirZonaRoja" class="btn btn-danger">
                                Definir Zona Roja
                            </button>
                        `;
                    } else if (!this.zonasDespliegue.azul) {
                        botonesContainer.innerHTML = `
                            <button id="btnDefinirZonaAzul" class="btn btn-info">
                                Definir Zona Azul
                            </button>
                        `;
                    }
                    this.attachButtonListeners();
                } else {
                    mensajesContainer.innerHTML = `
                        <div class="mensaje-espera">
                            El Director está estableciendo las zonas de despliegue
                        </div>
                    `;
                }
                break;
                
            case 'despliegue':
                // Todos pueden desplegar
                botonesContainer.innerHTML = `
                    <button id="btnFinalizarDespliegue" class="btn btn-success">
                        Listo para Combate
                    </button>
                `;
                this.attachButtonListeners();
                break;
        }
    }

    // 2. Función consolidada para manejo de interfaz
    actualizarInterfazCompleta() {
        const jugadorActual = this.getJugadorActual();
        if (!jugadorActual) {
            console.error('No se pudo obtener el jugador actual');
            return;
        }

        // Actualizar panel principal
        this.actualizarPanelPrincipal(jugadorActual);
        
        // Actualizar estado del juego
        this.actualizarEstadoJuego();
        
        // Actualizar controles según el rol
        this.actualizarControlesSegunRol(jugadorActual);
        
        // Actualizar botones según la fase
        this.actualizarBotones();
    }

    // Funciones auxiliares para la actualización de interfaz
    actualizarPanelPrincipal(jugadorActual) {
        // Actualizar elementos del panel principal
        const elementos = {
            'faseActual': `Fase: ${this.fase}${this.subfase ? ` - ${this.subfase}` : ''}`,
            'turnoActual': `Turno: ${this.turnoActual}`,
            'jugadorActual': `Jugador: ${jugadorActual.nombre}${this.esDirectorTemporal ? ' (Director Temporal)' : ''}`
        };

        Object.entries(elementos).forEach(([id, texto]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = texto;
            }
        });

        // Actualizar reloj si estamos en fase de combate
        const relojElement = document.getElementById('relojTurno');
        if (relojElement) {
            if (this.fase === 'combate') {
                relojElement.style.display = 'block';
                relojElement.textContent = this.formatearTiempo(this.tiempoRestante);
            } else {
                relojElement.style.display = 'none';
            }
        }
    }

    actualizarEstadoJuego() {
        const contenedor = document.getElementById('estadoJuego');
        if (!contenedor) return;

        const estadoContainer = document.createElement('div');
        estadoContainer.className = 'estado-juego';
        
        // Crear contenido del estado
        const contenido = {
            fase: this.fase,
            subfase: this.subfase,
            director: this.director ? this.director.username : 'Jugador 1 (Temporal)',
            progreso: {
                sector: this.sectorDefinido,
                zonas: this.zonasDefinidas
            }
        };

        estadoContainer.innerHTML = `
            <div class="fase-actual">
                <strong>Fase:</strong> ${contenido.fase} - ${contenido.subfase}
            </div>
            <div class="director">
                <strong>Director:</strong> ${contenido.director}
            </div>
            <div class="progreso">
                <div class="sector ${contenido.progreso.sector ? 'completado' : ''}">
                    Sector ${contenido.progreso.sector ? '✓' : 'pendiente'}
                </div>
                <div class="zonas ${contenido.progreso.zonas ? 'completado' : ''}">
                    Zonas ${contenido.progreso.zonas ? '✓' : 'pendiente'}
                </div>
            </div>
        `;

        contenedor.innerHTML = '';
        contenedor.appendChild(estadoContainer);
    }

    actualizarControlesSegunRol(jugadorActual) {
        const esDirectorActual = this.esDirector(jugadorActual.id);
        
        // Actualizar visibilidad de controles según el rol
        document.querySelectorAll('[data-requiere-director]').forEach(control => {
            control.style.display = esDirectorActual ? 'block' : 'none';
        });

        // Actualizar controles específicos de fase
        const controlesEspecificos = {
            'preparacion': () => this.actualizarControlesPreparacion(jugadorActual),
            'combate': () => this.actualizarControlesCombate(jugadorActual)
        };

        if (controlesEspecificos[this.fase]) {
            controlesEspecificos[this.fase]();
        }
    }

    actualizarControlesPreparacion(jugadorActual) {
        const controles = document.querySelectorAll('[data-control-preparacion]');
        controles.forEach(control => {
            const requiereDirector = control.dataset.requiereDirector === 'true';
            const puedeUsar = requiereDirector ? 
                this.esDirector(jugadorActual.id) || this.esDirectorTemporal : 
                true;
            control.disabled = !puedeUsar;
        });
    }

    actualizarControlesCombate(jugadorActual) {
        const controles = document.querySelectorAll('[data-control-combate]');
        controles.forEach(control => {
            control.disabled = !this.esJugadorActual(jugadorActual.id);
        });
    }

    finalizarTurno() {
        if (this.socket) {
            this.socket.emit('finalizarTurno');
        } else {
            this.cambiarTurno();
        }
    }

    finalizarPreparacion() {
        if (this.socket) {
            this.socket.emit('finalizarPreparacion');
        } else {
            this.iniciarFaseCombate();
        }
    }

    

    // 4. MANEJADORES DE DIBUJO
    manejarInicioDibujo(e) {
        console.log('Iniciando dibujo:', e.layerType);
        if (this.fase === 'preparacion') {
            switch (this.subfase) {
                case 'definicion_sector':
                    this.mostrarMensajeAyuda('Dibuja el área del sector de juego');
                    break;
                case 'definicion_zonas':
                    this.mostrarMensajeAyuda(`Dibuja la zona de despliegue para el equipo ${this.dibujandoZona || ''}`);
                    break;
                default:
                    console.warn('Subfase no válida para dibujo:', this.subfase);
                    break;
            }
        }
    }

    initUI() {
        this.crearInterfazUI();
        this.setupEventListeners();
        if (this.socket) {
            this.setupSocketListeners();
        }
    }

    constructor(configuracion) {
        this.validarConfiguracion(configuracion);
        
        // Configuración básica
        this.configuracion = configuracion;
        this.fase = 'preparacion';
        this.subfase = 'definicion_sector';
        this.jugadores = configuracion.jugadores;
    
        // Asegurarse de que los jugadores tienen las propiedades necesarias
        this.jugadores = this.jugadores.map(j => ({
            ...j,
            nombre: j.username || j.nombre || 'Jugador sin nombre',
            despliegueListo: false
        }));
    
        // Determinar el director
        this.director = this.jugadores.find(j => j.rol === 'director');
        this.esDirectorTemporal = !this.director;
        
        if (this.esDirectorTemporal) {
            // El primer jugador del equipo azul será director temporal
            this.primerJugador = this.jugadores.find(j => j.equipo === 'azul');
            if (!this.primerJugador) {
                this.primerJugador = this.jugadores[0];
            }
            this.primerJugador.rolTemporal = 'director';
            this.directorTemporalEquipo = this.primerJugador.equipo;
        }
    
        this.jugadorActualIndex = this.jugadores.indexOf(this.primerJugador);
        this.turnoActual = 1;
        this.tiempoRestante = configuracion.duracionTurno * 60;
        this.socket = configuracion.modo === 'online' ? configuracion.socket : null;
        this.eventos = new EventTarget();
        this.intervalReloj = null;
        this.modoJuego = configuracion.modo || 'local';
        this.codigoPartida = configuracion.codigoPartida;
        
        if (this.modoJuego === 'online' && this.socket) {
            this.inicializarEventosSocket();
        }
    
        // Estado del juego
        this.sectorJuego = null;
        this.zonasDespliegue = { azul: null, rojo: null };
        this.sectorDefinido = false;
        this.zonasDefinidas = false;
        this.dibujandoSector = false;
        this.dibujandoZona = null;
        this.sectorTemporal = null;
        this.sectorConfirmado = false;
        this.zonasLayers = {};
        this.zonaTemporalLayer = null;
        this.faseController = new FaseController(this);

        
        // Inicializar configuración UI
        this.UIConfig = this.getUIConfig();

        // Inicializar herramientas de dibujo si el mapa está disponible
        if (window.mapa) {
            this.inicializarHerramientasDibujo();
        }

        // Inicializar UI y eventos
        this.initUI();

        // Solo en fase de combate se inicia el reloj
        if (this.fase === 'combate') {
            this.iniciarReloj();
        }
        this.validarMetodosNecesarios();
    }
    
    validarMetodosNecesarios() {
        const metodosRequeridos = [
            'hacerLayerEditable',
            'manejarDibujoSector',
            'actualizarBotonesConfirmacionSector',
            'confirmarSector',
            'cancelarDefinicionSector'
        ];
    
        metodosRequeridos.forEach(metodo => {
            if (typeof this[metodo] !== 'function') {
                console.error(`Método ${metodo} no está definido`);
            }
        });
    }
    
    // Asegurar el binding correcto de los métodos
    inicializarEventos() {
        // Crear bindings de métodos que pueden perder contexto
        this.manejarDibujoCreado = this.manejarDibujoCreado.bind(this);
        this.manejarDibujoSector = this.manejarDibujoSector.bind(this);
        this.actualizarBotonesConfirmacionSector = this.actualizarBotonesConfirmacionSector.bind(this);
        this.confirmarSector = this.confirmarSector.bind(this);
        this.cancelarDefinicionSector = this.cancelarDefinicionSector.bind(this);
    }

    inicializarEventosSocket() {
    if (!this.socket) return;

    // Eventos de estado de juego base
    this.socket.on('estadoJuego', (estado) => {
        console.log('Estado de juego recibido:', estado);
        this.fase = estado.fase;
        this.subfase = estado.subfase;
        this.jugadorActualIndex = estado.jugadorActualIndex;
        this.actualizarInterfazCompleta();
    });

    this.socket.on('permisosActualizados', (permisos) => {
        console.log('Permisos actualizados:', permisos);
        this.permisos = permisos;
        this.actualizarInterfazCompleta();
    });

    // Eventos para el sector
    this.socket.on('sectorDefinido', data => {
        console.log('Sector definido recibido:', data);
        if (!this.sectorLayer && !this.esDirectorTemporal) {
            this.crearSectorDesdeData(data);
            this.centrarYZoomearSector(data.bounds);
        }
    });

    // Eventos para zonas de despliegue
    this.socket.on('zonaDespliegueDefinida', data => {
        console.log('Zona de despliegue definida recibida:', data);
        const jugadorActual = this.getJugadorActual();
        if (data.equipo === jugadorActual.equipo || this.esDirector(jugadorActual.id)) {
            this.crearZonaDespliegueDesdeData(data);
            if (data.equipo === jugadorActual.equipo) {
                this.centrarYZoomearZona(data.bounds);
            }
        }
    });

    // Evento para inicio de fase combate
    this.socket.on('inicioCombate', () => {
        this.mostrarTransicionFaseCombate();
        this.iniciarFaseCombate();
    });

    // Evento para elementos visibles
    this.socket.on('elementosVisibles', data => {
        this.actualizarElementosVisibles(data);
    });

    // Emitir estado inicial si es director o director temporal
    if (this.esDirector(this.getJugadorActual().id) || this.esDirectorTemporal) {
        this.socket.emit('actualizarEstadoJuego', {
            fase: this.fase,
            subfase: this.subfase,
            jugadorActualIndex: this.jugadorActualIndex
        });
    }

    // Eventos adicionales para sincronización
    this.socket.on('jugadorListo', (data) => {
        console.log('Jugador listo:', data);
        this.actualizarEstadoJugador(data.jugadorId, { despliegueListo: true });
    });

    this.socket.on('directorTemporalRestaurado', (data) => {
        console.log('Director temporal restaurado:', data);
        if (data.jugadorId === this.primerJugador?.id) {
            this.esDirectorTemporal = false;
            this.primerJugador.rolTemporal = null;
            this.actualizarInterfazCompleta();
        }
    });
}

// Función auxiliar para actualizar el estado de un jugador
actualizarEstadoJugador(jugadorId, nuevoEstado) {
    const jugador = this.jugadores.find(j => j.id === jugadorId);
    if (jugador) {
        Object.assign(jugador, nuevoEstado);
        this.actualizarInterfazCompleta();
    }
}
    
    validarConfiguracion(config) {
        if (!config || !Array.isArray(config.jugadores) || config.jugadores.length === 0) {
            throw new Error("Configuración inválida: La lista de jugadores es obligatoria");
        }
        if (!config.duracionTurno || config.duracionTurno <= 0) {
            throw new Error("Configuración inválida: La duración del turno debe ser mayor a 0");
        }
    }

    crearInterfazUI() {
        let panelTurnos = document.getElementById('panelTurnos');
        if (!panelTurnos) {
            panelTurnos = document.createElement('div');
            panelTurnos.id = 'panelTurnos';
            document.body.appendChild(panelTurnos);
        }

        panelTurnos.innerHTML = `
            <div class="panel-header">
                <div id="faseActual"></div>
                <div id="turnoActual"></div>
                <div id="jugadorActual"></div>
            </div>
            <div id="relojTurno" style="display: none;"></div>
            <div id="botonesContainer"></div>
            <div id="mensajesPanel"></div>
        `;

        this.actualizarInterfazCompleta();
    }

    setupEventListeners() {
        const jugadorActual = this.getJugadorActual();
        const elementos = {
            'btnFinalizarTurno': {
                condicion: () => this.fase === 'combate',
                handler: () => this.finalizarTurno()
            },
            'btnFinalizarPreparacion': {
                condicion: () => this.fase === 'preparacion' && this.sectorConfirmado && this.zonasDefinidas,
                handler: () => this.finalizarPreparacion()
            },
            'btnDefinirSector': {
                condicion: () => this.puedeDefinirSector(jugadorActual.id) && !this.sectorConfirmado,
                handler: () => this.iniciarDefinicionSector()
            },
            'btnConfirmarSector': {
                condicion: () => this.puedeDefinirSector(jugadorActual.id) && this.sectorTemporal && !this.sectorConfirmado,
                handler: () => this.confirmarSector()
            },
        };

        Object.entries(elementos).forEach(([id, config]) => {
            const elemento = document.getElementById(id);
            if (elemento && config.condicion()) {
                elemento.addEventListener('click', config.handler);
            }
        });
    }

    setupSocketListeners() {
        if (!this.socket) return;
    
        const eventos = {
            'sectorDefinido': (data) => {
                if (!this.sectorLayer) {
                    const sector = L.rectangle(data.sector, {
                        color: '#ff7800',
                        weight: 3,
                        fill: false,
                        interactive: false
                    }).addTo(window.mapa);
                    this.sectorJuego = data.sector;
                    this.sectorDefinido = true;
                    window.mapa.fitBounds(data.sector);
                }
            },
            'zonaDespliegueDefinida': (data) => {
                const { equipo, zona } = data;
                if (!this.zonasLayers) this.zonasLayers = {};
                
                if (this.zonasLayers[equipo]) {
                    this.zonasLayers[equipo].remove();
                }
                
                this.zonasLayers[equipo] = L.rectangle(zona, {
                    color: equipo === 'azul' ? '#0000ff' : '#ff0000',
                    weight: 2,
                    fillOpacity: 0.2,
                    interactive: false
                }).addTo(window.mapa);
                
                this.zonasDespliegue[equipo] = zona;
            }
        };
    
        Object.entries(eventos).forEach(([evento, handler]) => {
            this.socket.on(evento, handler);
        });
    }



    cancelarDefinicionSector() {
        if (this.sectorTemporal) {
            window.mapa.removeLayer(this.sectorTemporal);
            this.sectorTemporal = null;
        }
        this.dibujandoSector = false;
        this.actualizarInterfazCompleta();
    }

    // Control de Turnos y Fases
    cambiarTurno() {
        if (this.fase === 'preparacion') {
            if (this.subfase === 'definicion_sector' || this.subfase === 'definicion_zonas') {
                return; // No hay turnos durante la definición de sector y zonas
            }
            // En despliegue, todos pueden desplegar simultáneamente
            return;
        }

        // Fase de combate
        this.jugadorActualIndex = (this.jugadorActualIndex + 1) % this.jugadores.length;
        
        // Saltar al director si existe
        while (this.director && this.esDirector(this.jugadores[this.jugadorActualIndex].id)) {
            this.jugadorActualIndex = (this.jugadorActualIndex + 1) % this.jugadores.length;
        }

        if (this.jugadorActualIndex === 0) {
            this.turnoActual++;
        }

        this.tiempoRestante = this.configuracion.duracionTurno * 60;
        this.actualizarInterfazCompleta();

        // Emitir evento de cambio de turno
        this.eventos.dispatchEvent(new CustomEvent('cambioTurno', {
            detail: {
                jugador: this.getJugadorActual(),
                turno: this.turnoActual,
                fase: this.fase,
                subfase: this.subfase
            }
        }));
    }

    manejarInicioPreparacion() {
        this.sectorDefinido = false;
        this.zonasDefinidas = false;
        this.sectorConfirmado = false;
        this.subfase = 'definicion_sector';
        
        // Limpiar capas del mapa
        if (this.sectorLayer) this.sectorLayer.remove();
        if (this.zonasLayers) {
            Object.values(this.zonasLayers).forEach(layer => layer.remove());
        }
    }

    iniciarFaseCombate() {
        this.jugadorActualIndex = 0;
        this.turnoActual = 1;
        this.tiempoRestante = this.configuracion.duracionTurno * 60;
        this.iniciarReloj();
    }

    // Manejo del Reloj
    iniciarReloj() {
        if (this.fase !== 'combate') return;
        
        if (this.intervalReloj) clearInterval(this.intervalReloj);
        
        this.intervalReloj = setInterval(() => {
            if (this.tiempoRestante > 0) {
                this.tiempoRestante--;
                this.actualizarReloj(this.tiempoRestante);
            } else {
                this.finalizarTurno();
            }
        }, 1000);

        this.actualizarReloj(this.tiempoRestante);
    }


    // Utilidades y Helpers
    mostrarMensajeAyuda(mensaje, tipo = 'info') {
        const contenedor = document.getElementById('mensajesPanel');
        if (!contenedor) return;

        const mensajeElement = document.createElement('div');
        mensajeElement.className = `mensaje mensaje-${tipo}`;
        mensajeElement.textContent = mensaje;
        
        contenedor.appendChild(mensajeElement);
        
        setTimeout(() => {
            mensajeElement.remove();
        }, 5000);
    }

    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }

    // Limpieza y Destrucción
    destruir() {
        if (this.intervalReloj) {
            clearInterval(this.intervalReloj);
        }

        // Limpiar eventos del mapa
        if (window.mapa) {
            window.mapa.off(L.Draw.Event.CREATED);
            window.mapa.off(L.Draw.Event.DRAWSTART);
            window.mapa.off(L.Draw.Event.DRAWSTOP);
        }

        // Limpiar capas
        if (this.sectorLayer) this.sectorLayer.remove();
        if (this.sectorTemporal) this.sectorTemporal.remove();
        if (this.zonasLayers) {
            Object.values(this.zonasLayers).forEach(layer => layer.remove());
        }

        // Limpiar UI
        const panelTurnos = document.getElementById('panelTurnos');
        if (panelTurnos) panelTurnos.remove();
    }

    crearSectorDesdeData(data) {
        this.sectorLayer = L.rectangle(data.bounds, {
            color: this.esDirectorTemporal ? '#ff7800' : '#ff0000',
            weight: this.esDirectorTemporal ? 3 : 5,
            opacity: this.esDirectorTemporal ? 0.8 : 0.5,
            fill: false,
            dashArray: this.esDirectorTemporal ? null : '10, 10'
        }).addTo(window.calcoActivo);
        
        this.sectorDefinido = true;
        this.sectorConfirmado = true;
        this.sectorJuego = data.bounds;
    }

    centrarYZoomearSector(bounds) {
        window.mapa.fitBounds(bounds, {
            padding: [50, 50]
        });
    }

    crearZonaDespliegueDesdeData(data) {
        if (this.zonasLayers[data.equipo]) {
            window.calcoActivo.removeLayer(this.zonasLayers[data.equipo]);
        }

        this.zonasLayers[data.equipo] = L.rectangle(data.bounds, {
            color: data.equipo === 'azul' ? '#0000ff' : '#ff0000',
            weight: 2,
            opacity: 0.8,
            fillColor: data.equipo === 'azul' ? '#0000ff' : '#ff0000',
            fillOpacity: 0.2
        }).addTo(window.calcoActivo);

        this.zonasDespliegue[data.equipo] = data.bounds;
    }

    centrarYZoomearZona(bounds) {
        window.mapa.fitBounds(bounds, {
            padding: [50, 50]
        });
    }

    mostrarTransicionFaseCombate() {
        const transicion = document.createElement('div');
        transicion.className = 'transicion-fase';
        transicion.innerHTML = `
            <div class="mensaje-transicion">
                <h2>¡Inicio de la Fase de Combate!</h2>
                <div class="reloj-cuenta-regresiva">5</div>
            </div>
        `;
        document.body.appendChild(transicion);

        let countdown = 5;
        const intervalo = setInterval(() => {
            countdown--;
            const reloj = transicion.querySelector('.reloj-cuenta-regresiva');
            if (reloj) reloj.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(intervalo);
                transicion.remove();
            }
        }, 1000);
    }

    finalizarDespliegue() {
        const jugadorActual = this.getJugadorActual();
        jugadorActual.despliegueListo = true;

        if (this.socket) {
            this.socket.emit('jugadorListo', {
                jugadorId: jugadorActual.id,
                equipo: jugadorActual.equipo
            });
        }

        // Si es el director temporal, restaurar su rol original
        if (this.esDirectorTemporal && jugadorActual.id === this.primerJugador.id) {
            console.log('Restaurando rol del director temporal');
            this.restaurarRolDirectorTemporal();
        }

        // Verificar si todos están listos
        if (this.verificarTodosListos()) {
            if (this.socket) {
                this.socket.emit('iniciarCombate');
            } else {
                this.iniciarFaseCombate();
            }
        }
    }

    restaurarRolDirectorTemporal() {
        this.director = null;
        this.esDirectorTemporal = false;
        this.primerJugador.rolTemporal = null;
        
        if (this.socket) {
            this.socket.emit('directorTemporalRestaurado', {
                jugadorId: this.primerJugador.id,
                equipoOriginal: this.directorTemporalEquipo
            });
        }
    }

    actualizarElementosVisibles(data) {
        const distanciaVisibilidad = 3000; // 3km en metros
        const jugadorActual = this.getJugadorActual();
        
        window.calcoActivo.eachLayer(layer => {
            if (!layer.options || !layer.options.equipoOriginal) return;

            const esElementoPropio = layer.options.equipoOriginal === jugadorActual.equipo;
            const elementoVisible = data.elementosVisibles.some(elem => 
                elem.id === layer.options.id && 
                elem.distancia <= distanciaVisibilidad
            );

            if (esElementoPropio || elementoVisible) {
                layer.setOpacity(1);
                if (layer.options.fillOpacity !== undefined) {
                    layer.setStyle({ fillOpacity: 0.2 });
                }
            } else {
                layer.setOpacity(0);
                if (layer.options.fillOpacity !== undefined) {
                    layer.setStyle({ fillOpacity: 0 });
                }
            }
        });
    }
}
// Exportar la clase
window.SistemaTurnos = SistemaTurnos;


class FaseController {
    constructor(sistemaTurnos) {
        this.sistemaTurnos = sistemaTurnos;
        this.fase = 'preparacion';
        this.subfase = 'definicion_sector';
        this.elementosPermitidos = new Set();
        this.elementosBloqueados = new Set();
        
        // Mapeo de permisos por fase
        this.permisosConfiguracion = {
            'preparacion': {
                'definicion_sector': {
                    permitidos: ['sector'],
                    bloquear: ['unidad', 'equipo', 'linea', 'poligono']
                },
                'definicion_zonas': {
                    permitidos: ['zona'],
                    bloquear: ['unidad', 'equipo', 'linea', 'poligono']
                },
                'despliegue': {
                    permitidos: ['unidad', 'equipo'],
                    bloquear: ['sector', 'zona']
                }
            },
            'combate': {
                permitidos: ['unidad', 'equipo', 'linea', 'poligono'],
                bloquear: ['sector', 'zona']
            }
        };
    }

    // En FaseController
    puedeRealizarAccion(fase, subfase, jugador) {
        if (!jugador) {
            console.warn('puedeRealizarAccion: jugador no definido');
            return false;
        }

        console.log('Verificando permisos para acción:', {
            fase,
            subfase,
            jugadorId: jugador.id,
            esDirector: this.sistemaTurnos.esDirector(jugador.id),
            esDirectorTemporal: this.sistemaTurnos.esDirectorTemporal
        });

        // En fase de preparación
        if (fase === 'preparacion') {
            switch (subfase) {
                case 'definicion_sector':
                    return this.sistemaTurnos.puedeDefinirSector(jugador.id);
                case 'definicion_zonas':
                    return this.sistemaTurnos.puedeDefinirZonas(jugador.id);
                case 'despliegue':
                    return true; // Todos pueden desplegar en su zona
                default:
                    return false;
            }
        }

        // En fase de combate
        if (fase === 'combate') {
            return this.sistemaTurnos.esJugadorActual(jugador.id);
        }

        return false;
    }

    cambiarFase(nuevaFase, subfase = null) {
        this.fase = nuevaFase;
        this.subfase = subfase;
        this.actualizarPermisos();
    }

    puedeAgregarElemento(tipoElemento, jugador) {
        if (!this.permisosConfiguracion[this.fase]) return false;

        const permisos = this.subfase ? 
            this.permisosConfiguracion[this.fase][this.subfase] :
            this.permisosConfiguracion[this.fase];

        // Verificar si el elemento está permitido en la fase actual
        if (!permisos.permitidos.includes(tipoElemento)) return false;

        // Verificaciones específicas por fase
        switch(this.fase) {
            case 'preparacion':
                switch(this.subfase) {
                    case 'definicion_sector':
                        return this.sistemaTurnos.puedeDefinirSector(jugador.id);
                    case 'definicion_zonas':
                        return this.sistemaTurnos.puedeDefinirZonas(jugador.id);
                    case 'despliegue':
                        return this.verificarZonaDespliegue(jugador);
                }
                break;
            case 'combate':
                return this.sistemaTurnos.esJugadorActual(jugador.id);
        }

        return false;
    }

    verificarZonaDespliegue(jugador) {
        const zona = this.sistemaTurnos.zonasDespliegue[jugador.equipo];
        if (!zona) return false;

        // Verificar si el jugador está intentando desplegar en su zona
        return zona.contains(jugador.posicionDespliegue);
    }

    actualizarVisibilidad() {
        const jugadorActual = this.sistemaTurnos.getJugadorActual();
        if (!jugadorActual) return;

        window.calcoActivo.eachLayer(layer => {
            if (!layer.options) return;

            // Configurar visibilidad según fase y tipo de elemento
            const visibilidad = this.calcularVisibilidad(layer, jugadorActual);
            this.aplicarVisibilidad(layer, visibilidad);
        });
    }

    calcularVisibilidad(layer, jugador) {
        const esDirector = this.sistemaTurnos.esDirector(jugador.id);
        const elementoPropio = layer.options.equipo === jugador.equipo;

        // Durante preparación
        if (this.fase === 'preparacion') {
            if (this.subfase === 'definicion_sector') {
                return esDirector || this.sistemaTurnos.esDirectorTemporal;
            }
            if (this.subfase === 'definicion_zonas') {
                return esDirector || elementoPropio;
            }
            if (this.subfase === 'despliegue') {
                return esDirector || elementoPropio;
            }
        }

        // Durante combate
        return true; // La visibilidad en combate se maneja por línea de vista
    }

    aplicarVisibilidad(layer, visible) {
        if (visible) {
            layer.setOpacity(1);
            if (layer.options.fillOpacity !== undefined) {
                layer.setStyle({ fillOpacity: 0.2 });
            }
        } else {
            layer.setOpacity(0);
            if (layer.options.fillOpacity !== undefined) {
                layer.setStyle({ fillOpacity: 0 });
            }
        }
    }

    centrarVistaEnZona(equipo) {
        const zona = this.sistemaTurnos.zonasDespliegue[equipo];
        if (zona) {
            window.mapa.fitBounds(zona, {
                padding: [50, 50],
                maxZoom: 13
            });
        }
    }

    bloquearEdicionSector() {
        if (this.sistemaTurnos.sectorLayer && this.sistemaTurnos.sectorLayer.editing) {
            this.sistemaTurnos.sectorLayer.editing.disable();
            this.sistemaTurnos.sectorLayer.dragging.disable();
        }
    }
}

// Exportar el controlador
window.FaseController = FaseController;