/**
 * 🎮 FASE MANAGER - Gestor de Fases y Subfases del Juego de Guerra V2
 *
 * Controla el flujo completo del juego:
 * - PREPARACIÓN: Director delimita sector y zonas
 * - DESPLIEGUE: Jugadores colocan unidades en sus zonas
 * - COMBATE: Subfases de Planificación → Ejecución → Revisión
 *
 * @version 2.0
 * @date 2025-11-07
 */

class FaseManager {
    constructor(opciones = {}) {
        // Referencias necesarias
        this.map = opciones.map || null;
        this.hexGrid = opciones.hexGrid || null;
        this.gestorOrdenes = opciones.gestorOrdenes || null;
        this.configuracion = opciones.configuracion || {};

        // Estado actual
        this.faseActual = 'preparacion'; // preparacion | despliegue | combate
        this.subfaseActual = null; // Para combate: planificacion | ejecucion | revision
        this.turnoActual = 0;

        // Datos de la partida
        this.sector = null; // Polígono del sector
        this.zonaAzul = null; // Polígono zona azul
        this.zonaRoja = null; // Polígono zona roja
        this.jugadores = opciones.jugadores || [];
        this.director = opciones.director || null;

        // Callbacks para eventos
        this.callbacks = {
            onFaseChange: opciones.onFaseChange || (() => {}),
            onSubfaseChange: opciones.onSubfaseChange || (() => {}),
            onTurnoChange: opciones.onTurnoChange || (() => {})
        };

        // UI Elements
        this.indicadorFase = null;

        console.log('🎯 FaseManager creado - Fase inicial: PREPARACIÓN');
    }

    /**
     * Inicializa el gestor de fases
     */
    async inicializar() {
        console.log('🔄 Inicializando FaseManager...');

        // Crear indicador visual de fase
        this.crearIndicadorFase();

        // Iniciar en fase de preparación
        await this.iniciarPreparacion();

        console.log('✅ FaseManager inicializado');
    }

    /**
     * Crea el indicador visual de fase en la UI
     */
    crearIndicadorFase() {
        this.indicadorFase = document.createElement('div');
        this.indicadorFase.id = 'indicador-fase-v2';
        this.indicadorFase.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #2196F3, #1976D2);
            border: 2px solid #fff;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            font-size: 16px;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(this.indicadorFase);
        this.actualizarIndicadorFase();
    }

    /**
     * Actualiza el texto y color del indicador de fase
     */
    actualizarIndicadorFase() {
        if (!this.indicadorFase) return;

        let texto = '';
        let gradiente = '';

        switch (this.faseActual) {
            case 'preparacion':
                texto = '📋 PREPARACIÓN';
                gradiente = 'linear-gradient(135deg, #9C27B0, #7B1FA2)';
                break;
            case 'despliegue':
                texto = '🎯 DESPLIEGUE';
                gradiente = 'linear-gradient(135deg, #FF9800, #F57C00)';
                break;
            case 'combate':
                switch (this.subfaseActual) {
                    case 'planificacion':
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual} - 📋 Planificación`;
                        gradiente = 'linear-gradient(135deg, #2196F3, #1976D2)';
                        break;
                    case 'ejecucion':
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual} - ⚡ Ejecución`;
                        gradiente = 'linear-gradient(135deg, #f44336, #d32f2f)';
                        break;
                    case 'revision':
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual} - 📊 Revisión`;
                        gradiente = 'linear-gradient(135deg, #4CAF50, #388E3C)';
                        break;
                    default:
                        texto = `⚔️ COMBATE - Turno ${this.turnoActual}`;
                        gradiente = 'linear-gradient(135deg, #2196F3, #1976D2)';
                }
                break;
        }

        this.indicadorFase.innerHTML = texto;
        this.indicadorFase.style.background = gradiente;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FASE 1: PREPARACIÓN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Inicia la fase de PREPARACIÓN
     * - Director delimita sector
     * - Director delimita zonas azul y roja
     */
    async iniciarPreparacion() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 INICIANDO FASE: PREPARACIÓN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.faseActual = 'preparacion';
        this.actualizarIndicadorFase();

        // Mostrar instrucciones
        this.mostrarNotificacion({
            tipo: 'info',
            titulo: 'Fase de Preparación',
            mensaje: `
                <strong>Director:</strong><br>
                1. Delimita el SECTOR de combate (polígono)<br>
                2. Delimita la ZONA AZUL<br>
                3. Delimita la ZONA ROJA<br>
                <br>
                Usa Leaflet.Draw para dibujar los polígonos.
            `,
            duracion: 10000
        });

        // Activar herramientas de dibujo si están disponibles
        if (window.activarHerramientasDibujo) {
            window.activarHerramientasDibujo();
        }

        // Callback
        this.callbacks.onFaseChange('preparacion', null);

        console.log('✅ Fase PREPARACIÓN iniciada');
    }

    /**
     * Define el sector de combate
     */
    definirSector(layer) {
        console.log('🗺️ Definiendo sector...');

        // Calcular área (sin validación de tamaño - libre)
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const areaKm2 = area / 1000000;

        this.sector = layer.toGeoJSON();
        layer.setStyle({ color: '#ffff00', weight: 3 });

        console.log(`✅ Sector definido: ${areaKm2.toFixed(2)} km²`);

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Sector definido',
            mensaje: `Sector de ${areaKm2.toFixed(2)} km² establecido.<br>Ahora delimita las zonas azul y roja DENTRO del sector.`
        });

        return true;
    }

    /**
     * Define la zona azul
     */
    definirZonaAzul(layer) {
        console.log('🔵 Definiendo zona azul...');

        if (!this.sector) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Primero debes definir el sector'
            });
            return false;
        }

        this.zonaAzul = layer.toGeoJSON();
        layer.setStyle({ color: '#0066ff', fillColor: '#0066ff', fillOpacity: 0.2, weight: 2 });

        console.log('✅ Zona azul definida');

        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Zona azul definida',
            mensaje: 'Ahora delimita la zona roja'
        });

        return true;
    }

    /**
     * Define la zona roja
     */
    definirZonaRoja(layer) {
        console.log('🔴 Definiendo zona roja...');

        if (!this.sector || !this.zonaAzul) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Primero debes definir el sector y la zona azul'
            });
            return false;
        }

        this.zonaRoja = layer.toGeoJSON();
        layer.setStyle({ color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.2, weight: 2 });

        console.log('✅ Zona roja definida');

        // Preparación completa - ofrecer pasar a despliegue
        this.mostrarNotificacion({
            tipo: 'success',
            titulo: 'Preparación completa',
            mensaje: 'Todas las zonas están definidas.<br><button onclick="window.faseManager.finalizarPreparacion()">Pasar a Despliegue</button>',
            duracion: null // No auto-cerrar
        });

        return true;
    }

    /**
     * Finaliza la preparación y pasa a despliegue
     */
    async finalizarPreparacion() {
        if (!this.sector || !this.zonaAzul || !this.zonaRoja) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Error',
                mensaje: 'Debes definir el sector y ambas zonas antes de continuar'
            });
            return;
        }

        console.log('✅ Preparación finalizada - Pasando a DESPLIEGUE');
        await this.iniciarDespliegue();
    }

    // ✅ HexGrid ya existe desde el inicio - NO se genera aquí

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FASE 2: DESPLIEGUE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Inicia la fase de DESPLIEGUE
     */
    async iniciarDespliegue() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 INICIANDO FASE: DESPLIEGUE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.faseActual = 'despliegue';
        this.actualizarIndicadorFase();

        this.mostrarNotificacion({
            tipo: 'info',
            titulo: 'Fase de Despliegue (SIN LÍMITE DE TIEMPO)',
            mensaje: `
                <strong>Jugadores:</strong><br>
                Coloca y edita tus unidades en tu zona asignada.<br>
                <br>
                <strong>Validación requerida:</strong><br>
                - Magnitud<br>
                - Designación<br>
                - Asignación<br>
                <br>
                Cuando termines, haz click en "Listo para Combate".
            `,
            duracion: 10000
        });

        // TODO: Implementar sistema de turnos de despliegue
        // Por ahora, modo libre

        // Callback
        this.callbacks.onFaseChange('despliegue', null);

        console.log('✅ Fase DESPLIEGUE iniciada');
    }

    /**
     * Valida que una posición esté dentro de la zona del jugador
     */
    validarPosicionDespliegue(latLng, equipo) {
        const zona = equipo === 'azul' ? this.zonaAzul : this.zonaRoja;

        if (!zona) {
            console.error('❌ Zona no definida para equipo:', equipo);
            return false;
        }

        // TODO: Implementar verificación geométrica point-in-polygon
        // Por ahora, retornar true
        return true;
    }

    /**
     * Valida que un elemento tenga todos los campos obligatorios
     */
    validarElemento(elemento) {
        const camposObligatorios = ['magnitud', 'designacion', 'asignacion'];
        const faltantes = [];

        for (const campo of camposObligatorios) {
            if (!elemento[campo] || elemento[campo].trim() === '') {
                faltantes.push(campo);
            }
        }

        if (faltantes.length > 0) {
            this.mostrarNotificacion({
                tipo: 'error',
                titulo: 'Elemento incompleto',
                mensaje: `Faltan campos obligatorios:<br>- ${faltantes.join('<br>- ')}`
            });
            return false;
        }

        return true;
    }

    /**
     * Valida todos los elementos del equipo antes de finalizar despliegue
     */
    validarElementosEquipo(equipo) {
        // TODO: Obtener todos los elementos del equipo del mapa
        // Por ahora, retornar true para testing
        console.log(`🔍 Validando elementos de equipo ${equipo}...`);
        return true;
    }

    /**
     * Finaliza el despliegue y pasa a combate
     */
    async finalizarDespliegue() {
        console.log('✅ Despliegue finalizado - Pasando a COMBATE');
        await this.iniciarCombate();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FASE 3: COMBATE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Inicia la fase de COMBATE
     */
    async iniciarCombate() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚔️ INICIANDO FASE: COMBATE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.faseActual = 'combate';
        this.turnoActual = 1;
        this.actualizarIndicadorFase();

        // Iniciar subfase de planificación
        await this.iniciarPlanificacion();

        // Callback
        this.callbacks.onFaseChange('combate', 'planificacion');

        console.log('✅ Fase COMBATE iniciada - Turno 1');
    }

    /**
     * Subfase de Planificación
     */
    async iniciarPlanificacion() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📋 SUBFASE: PLANIFICACIÓN - Turno ${this.turnoActual}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.subfaseActual = 'planificacion';
        this.actualizarIndicadorFase();

        this.mostrarNotificacion({
            tipo: 'info',
            titulo: `Planificación - Turno ${this.turnoActual}`,
            mensaje: `
                Da órdenes a tus unidades:<br>
                - Doble-click en unidad → Menú radial<br>
                - Selecciona acción (Mover, Atacar, Defender)<br>
                - Confirma cuando termines<br>
            `,
            duracion: 8000
        });

        // Activar gestor de órdenes
        if (this.gestorOrdenes) {
            this.gestorOrdenes.iniciarPlanificacion();
        }

        // Callback
        this.callbacks.onSubfaseChange('planificacion');

        console.log('✅ Planificación iniciada');
    }

    /**
     * Confirmar órdenes y pasar a ejecución
     */
    async confirmarOrdenes() {
        console.log('✅ Órdenes confirmadas - Pasando a EJECUCIÓN');
        await this.iniciarEjecucion();
    }

    /**
     * Subfase de Ejecución
     */
    async iniciarEjecucion() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`⚡ SUBFASE: EJECUCIÓN - Turno ${this.turnoActual}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.subfaseActual = 'ejecucion';
        this.actualizarIndicadorFase();

        this.mostrarNotificacion({
            tipo: 'warning',
            titulo: 'Ejecución en curso',
            mensaje: 'Las órdenes se están ejecutando automáticamente...',
            duracion: 3000
        });

        // Ejecutar órdenes
        if (this.gestorOrdenes) {
            await this.gestorOrdenes.ejecutarTurno();
        }

        // Callback
        this.callbacks.onSubfaseChange('ejecucion');

        console.log('✅ Ejecución completa - Pasando a REVISIÓN');

        // Pasar automáticamente a revisión
        await this.iniciarRevision();
    }

    /**
     * Subfase de Revisión (activa durante turno enemigo)
     */
    async iniciarRevision() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 SUBFASE: REVISIÓN - Turno ${this.turnoActual}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.subfaseActual = 'revision';
        this.actualizarIndicadorFase();

        // Mostrar resultados
        this.mostrarNotificacion({
            tipo: 'success',
            titulo: `Turno ${this.turnoActual} completado`,
            mensaje: `
                Revisa los resultados:<br>
                - Unidades movidas<br>
                - Combates resueltos<br>
                - Bajas reportadas<br>
                <br>
                Durante el turno enemigo puedes seleccionar elementos para revisarlos.<br>
                <br>
                <button onclick="window.faseManager.siguienteTurno()">Siguiente Turno</button>
            `,
            duracion: null // No auto-cerrar
        });

        // Callback
        this.callbacks.onSubfaseChange('revision');

        console.log('✅ Revisión iniciada - Puedes seleccionar elementos durante turno enemigo');
    }

    /**
     * Avanza al siguiente turno
     */
    async siguienteTurno() {
        this.turnoActual++;

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔄 SIGUIENTE TURNO: ${this.turnoActual}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Callback
        this.callbacks.onTurnoChange(this.turnoActual);

        // Volver a planificación
        await this.iniciarPlanificacion();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // UTILIDADES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Muestra una notificación en pantalla
     */
    mostrarNotificacion(opciones) {
        const { tipo, titulo, mensaje, duracion = 5000 } = opciones;

        // Crear elemento de notificación
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            max-width: 400px;
            padding: 16px;
            background: ${this.getColorNotificacion(tipo)};
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 4000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;

        notif.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">${titulo}</div>
            <div>${mensaje}</div>
        `;

        document.body.appendChild(notif);

        // Auto-cerrar si tiene duración
        if (duracion) {
            setTimeout(() => {
                notif.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notif.remove(), 300);
            }, duracion);
        }

        // Agregar estilos de animación si no existen
        if (!document.getElementById('notif-animations')) {
            const style = document.createElement('style');
            style.id = 'notif-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Obtiene el color para un tipo de notificación
     */
    getColorNotificacion(tipo) {
        const colores = {
            info: 'linear-gradient(135deg, #2196F3, #1976D2)',
            success: 'linear-gradient(135deg, #4CAF50, #388E3C)',
            warning: 'linear-gradient(135deg, #FF9800, #F57C00)',
            error: 'linear-gradient(135deg, #f44336, #d32f2f)'
        };
        return colores[tipo] || colores.info;
    }

    /**
     * Obtiene el estado actual del juego
     */
    getEstado() {
        return {
            fase: this.faseActual,
            subfase: this.subfaseActual,
            turno: this.turnoActual,
            sector: this.sector,
            zonaAzul: this.zonaAzul,
            zonaRoja: this.zonaRoja
        };
    }
}

// Exportar globalmente
window.FaseManager = FaseManager;
console.log('✅ FaseManager.js cargado');
