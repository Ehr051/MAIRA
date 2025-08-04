class GestorInterfaz extends GestorBase {
    constructor() {
        super();
        this.contenedores = {
            principal: null,
            botones: null,
            panelTurno: null,
            panelEstado: null,
            mensajes: null
        };
        this.mensajesTimeout = 5000;
    }

    async inicializar(config) {
        try {
            console.log('Inicializando GestorInterfaz...');
            this.gestorJuego = config.gestorJuego;
            
            this.crearEstructuraBase();
            this.configurarEstilos();
            this.configurarEventosBasicos();

            return true;
        } catch (error) {
            console.error('Error al inicializar GestorInterfaz:', error);
            return false;
        }
    }

    crearEstructuraBase() {
        // Panel principal
        const interfaz = document.createElement('div');
        interfaz.id = 'interfaz-juego';
        interfaz.className = 'interfaz-contenedor';
        
        // Panel de mensajes
        const mensajes = document.createElement('div');
        mensajes.id = 'mensajes-container';
        mensajes.className = 'mensajes-container';
        
        // Panel de estado del juego
        const panelEstado = document.createElement('div');
        panelEstado.id = 'estado-juego';
        panelEstado.className = 'panel-estado';
        
        interfaz.appendChild(mensajes);
        interfaz.appendChild(panelEstado);
        document.body.appendChild(interfaz);

        this.contenedores = {
            principal: interfaz,
            mensajes: mensajes,
            panelEstado: panelEstado
        };
    }

    configurarEstilos() {
        const estilos = document.createElement('style');
        estilos.textContent = `
            .interfaz-contenedor {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                pointer-events: none;
                z-index: 1000;
            }
            
            .mensajes-container {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1001;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }
            
            .mensaje {
                padding: 10px 20px;
                border-radius: 5px;
                background: rgba(0, 0, 0, 0.8);
                color: black;
                animation: fadeInOut 5s ease-in-out;
                pointer-events: none;
            }
            
            .mensaje.error {
                background: rgba(244, 67, 54, 0.9);
            }
            
            .mensaje.success {
                background: rgba(76, 175, 80, 0.9);
            }
            
            .mensaje.warning {
                background: rgba(255, 152, 0, 0.9);
            }
            
            .panel-estado {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                pointer-events: auto;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(estilos);
    }

    mostrarMensaje(mensaje, tipo = 'info') {
        const mensajeElement = document.createElement('div');
        mensajeElement.className = `mensaje ${tipo}`;
        mensajeElement.textContent = mensaje;
        
        this.contenedores.mensajes.appendChild(mensajeElement);

        setTimeout(() => {
            mensajeElement.remove();
        }, this.mensajesTimeout);
    }

    actualizarEstadoJuego(estado) {
        if (!this.contenedores.panelEstado) return;
        
        let infoJugador = '';
        if (estado.fase === 'preparacion') {
            if (estado.subfase === 'definicion_sector' || estado.subfase === 'definicion_zonas') {
                const director = this.gestorJuego?.gestorFases?.director;
                const directorTemp = this.gestorJuego?.gestorFases?.primerJugador;
                if (director) {
                    infoJugador = `Director: ${director.username}`;
                } else if (directorTemp) {
                    infoJugador = `Director Temporal: ${directorTemp.username} (${directorTemp.equipo})`;
                }
            } else if (estado.subfase === 'despliegue') {
                infoJugador = 'Todos los jugadores desplegando';
            }
        } else if (estado.fase === 'combate') {
            const jugadorActual = estado.jugadorActual;
            if (jugadorActual) {
                infoJugador = `Jugador: ${jugadorActual.username} (${jugadorActual.equipo})`;
            }
        }

        this.contenedores.panelEstado.innerHTML = `
            <div class="fase-info">Fase: ${estado.fase}</div>
            <div class="subfase-info">Subfase: ${estado.subfase}</div>
            ${estado.fase === 'combate' ? `<div class="turno-info">Turno: ${estado.turnoActual}</div>` : ''}
            <div class="jugador-info">${infoJugador}</div>
        `;
    }

    actualizarInterfazFase(datos) {
        // Actualizar estado interno
        this.fase = datos.nuevaFase;
        this.subfase = datos.nuevaSubfase;
    
        // Actualizar mensajes según la fase y rol
        if (!this.gestorJuego?.gestorFases?.esDirector(window.userId)) {
            let mensaje = '';
            switch (this.subfase) {
                case 'definicion_sector':
                    mensaje = 'El director está definiendo el sector de juego';
                    break;
                case 'definicion_zonas':
                    mensaje = 'El director está definiendo las zonas de despliegue';
                    break;
                case 'despliegue':
                    mensaje = 'Fase de despliegue - Despliega tus unidades en tu zona asignada';
                    break;
                case 'combate':
                    mensaje = 'Fase de combate iniciada';
                    break;
            }
            this.mostrarMensaje(mensaje);
        }
    
        // Actualizar panel de estado
        this.actualizarEstadoJuego({
            fase: this.fase,
            subfase: this.subfase
        });
        // Force complete interface update
        this.actualizarInterfazCompleta();
    
        // Notify other managers
        this.emisorEventos.emit('faseCambiada', datos);
    }




    actualizarInterfazCompleta() {
    this.log('Actualizando interfaz completa');
    
    const estado = {
        fase: this.gestorJuego?.gestorFases?.fase,
        subfase: this.gestorJuego?.gestorFases?.subfase,
        jugadorActual: this.gestorJuego?.gestorTurnos?.obtenerJugadorActual(),
        turnoActual: this.gestorJuego?.gestorTurnos?.turnoActual,
        esDirector: this.gestorJuego?.gestorFases?.esDirector(window.userId)
    };

    if (!estado.fase) {
        this.mostrarMensaje('Error: Fase no definida', 'error');
        return;
    }

    try {
        switch(estado.fase) {
            case 'preparacion':
                this.actualizarInterfazPreparacion(estado);
                break;
            case 'combate':
                this.actualizarInterfazCombate(estado);
                break;
            case 'finalizacion':
                this.actualizarInterfazFinalizacion(estado);
                break;
            default:
                this.log(`Fase no reconocida: ${estado.fase}`, null, 'error');
                this.mostrarErrorFase();
                break;
        }

        this.actualizarEstadoJuego(estado);
        this.emisorEventos.emit('interfazActualizada', {
            ...estado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        this.log('Error actualizando interfaz:', error, 'error');
        this.mostrarMensaje('Error actualizando la interfaz', 'error');
    }
}

actualizarInterfazPreparacion(estado) {
    switch(estado.subfase) {
        case 'definicion_sector':
            if (estado.esDirector) {
                this.mostrarControlesSector();
            } else {
                this.mostrarMensajeEspera('sector');
            }
            this.ocultarControlesZonas();
            break;
            
        case 'definicion_zonas':
            this.ocultarControlesSector();
            if (estado.esDirector) {
                this.mostrarControlesZonas();
            } else {
                this.mostrarMensajeEspera('zonas');
            }
            break;
            
        case 'despliegue':
            this.ocultarControlesZonas();
            this.actualizarPanelEstado({
                fase: estado.fase,
                subfase: 'despliegue',
                mensaje: 'Fase de despliegue - Despliega tus unidades'
            });
            break;
    }
}

// En gestorInterfaz.js
actualizarPanelEstado(estado) {
    const panelEstado = document.getElementById('estado-juego');
    if (!panelEstado) return;

    panelEstado.innerHTML = `
        <div class="fase-info">Fase: ${estado.fase}</div>
        <div class="subfase-info">Subfase: ${estado.subfase}</div>
        ${estado.mensaje ? `<div class="mensaje-fase">${estado.mensaje}</div>` : ''}
    `;
}

mostrarControlesZonas() {
    const panelControl = document.getElementById('panel-fases');
    if (!panelControl) return;

    if (this.gestorJuego?.gestorFases?.esDirector(window.userId)) {
        const botones = `
            <button id="btn-zona-roja" ${this.gestorJuego.gestorFases.zonasDespliegue.rojo ? 'disabled' : ''}>
                Definir Zona Roja
            </button>
            <button id="btn-zona-azul" ${!this.gestorJuego.gestorFases.zonasDespliegue.rojo || this.gestorJuego.gestorFases.zonasDespliegue.azul ? 'disabled' : ''}>
                Definir Zona Azul
            </button>
        `;
        panelControl.querySelector('.botones-fase').innerHTML = botones;
    }
}

limpiarInterfazPostZona() {
    // Eliminar paneles de confirmación
    const confirmaciones = document.querySelectorAll(
        '.botones-confirmacion-zona, .botones-confirmacion-sector'
    );
    confirmaciones.forEach(elem => elem.remove());

    // Eliminar panel de despliegue 
    const panelDespliegue = document.getElementById('controles-despliegue');
    if (panelDespliegue) {
        panelDespliegue.remove();
    }

    // Mover panel de estado a ubicación del panel de control
    const panelEstado = document.getElementById('estado-juego');
    const panelControl = document.getElementById('panel-fases');
    if (panelEstado && panelControl) {
        panelEstado.style.cssText = panelControl.style.cssText;
        panelControl.remove();
    }
}

mostrarMensajeEspera(contexto) {
    const mensajes = {
        sector: 'El director está definiendo el sector de juego',
        zonas: 'El director está definiendo las zonas de despliegue',
        despliegue: 'Esperando que todos los jugadores completen el despliegue'
    };
    this.mostrarMensaje(mensajes[contexto] || 'Esperando...', 'info');
}

    actualizarMensajesFase(fase, subfase, esDirector) {
        let mensaje = '';
        if (esDirector) {
            if (subfase === 'definicion_sector') {
                mensaje = 'Define el sector de juego';
            }
        } else {
            if (subfase === 'definicion_sector') {
                mensaje = 'El director está definiendo el sector de juego';
            }
        }
        this.mostrarMensaje(mensaje);
    }

    configurarEventosBasicos() {
        // Configurar eventos del GestorFases
        this.gestorJuego?.gestorFases?.emisorEventos.on('faseCambiada', (datos) => {
            this.actualizarInterfazCompleta();
        });

        // Configurar eventos del GestorTurnos
        this.gestorJuego?.gestorTurnos?.emisorEventos.on('cambioTurno', (datos) => {
            this.actualizarInterfazCompleta();
        });
    }

   ocultarControlesSector() {
    // Buscar el contenedor de controles del sector si existe
    const controlesSector = document.getElementById('controles-sector');
    if (controlesSector) {
        // Ocultar el contenedor
        controlesSector.style.display = 'none';
        
        // Opcionalmente, eliminar los event listeners para liberar memoria
        const botones = controlesSector.getElementsByTagName('button');
        Array.from(botones).forEach(boton => {
            boton.replaceWith(boton.cloneNode(true));
        });
    }
}

ocultarControlesZonas() {
    // Buscar el contenedor de controles de zonas si existe
    const controlesZonas = document.getElementById('controles-zonas');
    if (controlesZonas) {
        // Ocultar el contenedor
        controlesZonas.style.display = 'none';
        
        // Opcionalmente, eliminar los event listeners
        const elementos = controlesZonas.getElementsByTagName('*');
        Array.from(elementos).forEach(elemento => {
            if (elemento.hasAttribute('onclick') || elemento.hasAttribute('onchange')) {
                elemento.replaceWith(elemento.cloneNode(true));
            }
        });
    }
}


// Método auxiliar para configurar los eventos de los controles de despliegue
configurarEventosDespliegue(contenedor) {
    // Botón de rotar unidad
    const btnRotar = contenedor.querySelector('#btn-rotar-unidad');
    if (btnRotar) {
        btnRotar.addEventListener('click', () => {
            // Implementar la lógica de rotación
            this.gestorJuego?.rotarUnidadSeleccionada();
        });
    }

    // Botón de confirmar despliegue
    const btnConfirmar = contenedor.querySelector('#btn-confirmar-despliegue');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            // Implementar la lógica de confirmación
            this.gestorJuego?.confirmarDespliegue();
        });
    }

    // Botón de cancelar despliegue
    const btnCancelar = contenedor.querySelector('#btn-cancelar-despliegue');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            // Implementar la lógica de cancelación
            this.gestorJuego?.cancelarDespliegue();
        });
    }
}

// Método auxiliar para actualizar la lista de unidades disponibles
actualizarListaUnidadesDisponibles() {
    const listaUnidades = document.getElementById('lista-unidades');
    if (!listaUnidades) return;

    // Obtener las unidades disponibles del gestor de juego
    const unidadesDisponibles = this.gestorJuego?.obtenerUnidadesDisponibles() || [];

    // Limpiar la lista actual
    listaUnidades.innerHTML = '';

    // Añadir cada unidad a la lista
    unidadesDisponibles.forEach(unidad => {
        const elementoUnidad = document.createElement('div');
        elementoUnidad.className = 'unidad-item';
        elementoUnidad.innerHTML = `
            <span class="nombre-unidad">${unidad.nombre}</span>
            <span class="tipo-unidad">${unidad.tipo}</span>
        `;
        
        elementoUnidad.addEventListener('click', () => {
            this.gestorJuego?.seleccionarUnidadParaDespliegue(unidad);
        });

        listaUnidades.appendChild(elementoUnidad);
    });
}



    destruir() {
        Object.values(this.contenedores).forEach(contenedor => {
            if (contenedor && contenedor.parentNode) {
                contenedor.parentNode.removeChild(contenedor);
            }
        });
        this.contenedores = {};
        super.destruir();
    }
}

window.GestorInterfaz = GestorInterfaz;