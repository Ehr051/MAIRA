/**
 * 📋 MENÚS DOCTRINALES V2 - Órdenes según Arma y Especialidad
 *
 * Basado en el Reglamento de Conducción de Fuerzas Terrestres
 *
 * ESTADOS TÁCTICOS BÁSICOS:
 * 1. MARCHA - Movimiento táctico
 * 2. COMBATE - Ofensivo (Ataque) o Defensivo (Defensa)
 * 3. DESCANSO - Espera/Recuperación
 *
 * CÓDIGOS SIDC (posiciones 4-6):
 * - UCI: Infantería
 * - UCR: Caballería
 * - UCF: Artillería
 * - UCE: Ingenieros
 * - UCD: Defensa Antiaérea
 * - UUS: Comunicaciones
 * - USM: Sanidad
 * - USS: Abastecimiento
 * - UST: Transporte
 * - UUM: Inteligencia
 * - UUA: QBN (Químico, Biológico, Nuclear)
 * - UUL: Policía Militar
 */

const MenusDoctrinales = {

    /**
     * Extrae el tipo de arma desde el SIDC
     * @param {string} sidc - Código SIDC de 15 caracteres
     * @returns {string} Tipo de arma
     */
    obtenerTipoArma(sidc) {
        if (!sidc || sidc.length < 7) return 'desconocido';

        const codigo = sidc.substring(4, 7);

        const mapeo = {
            'UCI': 'infanteria',
            'UCR': 'caballeria',
            'UCF': 'artilleria',
            'UCE': 'ingenieros',
            'UCD': 'defensa_antiaerea',
            'UUS': 'comunicaciones',
            'USM': 'sanidad',
            'USS': 'abastecimiento',
            'UST': 'transporte',
            'USA': 'personal',
            'UUM': 'inteligencia',
            'UUA': 'qbn',
            'UUL': 'policia_militar',
            'UUT': 'topografico'
        };

        return mapeo[codigo] || 'desconocido';
    },

    /**
     * Determina si un arma es de armas de combate (maniobra)
     */
    esArmaDeCombate(tipoArma) {
        return ['infanteria', 'caballeria', 'blindados'].includes(tipoArma);
    },

    /**
     * Obtiene el menú doctrinal para una unidad según su SIDC
     * @param {Object} unidad - Unidad (marker de Leaflet)
     * @returns {Array} Items del menú radial
     */
    obtenerMenu(unidad) {
        if (!unidad || !unidad.options || !unidad.options.sidc) {
            return this.menuGenerico();
        }

        const tipoArma = this.obtenerTipoArma(unidad.options.sidc);

        // Obtener menú específico según doctrina
        const menuFn = this.menus[tipoArma];
        if (menuFn) {
            return menuFn.call(this);
        }

        return this.menuGenerico();
    },

    /**
     * Menú genérico (cuando no se identifica el tipo)
     */
    menuGenerico() {
        return [
            { title: 'Mover', action: 'ordenMovimiento', icon: 'fas fa-arrows-alt', tooltip: 'Orden de movimiento' },
            { title: 'Esperar', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Orden de espera' }
        ];
    },

    /**
     * DEFINICIÓN DE MENÚS POR ARMA/ESPECIALIDAD
     */
    menus: {

        // ======================================
        // ARMAS DE COMBATE (MANIOBRA)
        // ======================================

        /**
         * INFANTERÍA
         * Funciones: Combate a pie, ocupación terreno, combate cercano
         */
        infanteria() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-walking', tooltip: 'Movimiento táctico' },

                // COMBATE
                {
                    title: 'Combate',
                    action: 'submenu',
                    submenu: 'infanteria_combate',
                    icon: 'fas fa-crosshairs',
                    tooltip: 'Opciones de combate'
                },

                // RECONOCIMIENTO
                { title: 'Reconocer', action: 'ordenReconocimiento', icon: 'fas fa-binoculars', tooltip: 'Reconocimiento de zona' },

                // DESCANSO
                { title: 'Descanso', action: 'ordenEspera', icon: 'fas fa-bed', tooltip: 'Descanso y reorganización' }
            ];
        },

        /**
         * CABALLERÍA / BLINDADOS
         * Funciones: Reconocimiento, combate móvil, explotación
         */
        caballeria() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-truck', tooltip: 'Movimiento motorizado' },

                // COMBATE
                {
                    title: 'Combate',
                    action: 'submenu',
                    submenu: 'caballeria_combate',
                    icon: 'fas fa-crosshairs',
                    tooltip: 'Opciones de combate'
                },

                // RECONOCIMIENTO
                { title: 'Reconocer', action: 'ordenReconocimiento', icon: 'fas fa-binoculars', tooltip: 'Reconocimiento en fuerza' },

                // DESCANSO
                { title: 'Descanso', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Reagrupamiento' }
            ];
        },

        /**
         * ARTILLERÍA
         * Funciones: Apoyo de fuego, supresión, neutralización
         */
        artilleria() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-truck-moving', tooltip: 'Cambio de posición' },

                // APOYO DE FUEGO
                {
                    title: 'Fuego',
                    action: 'submenu',
                    submenu: 'artilleria_fuego',
                    icon: 'fas fa-bullseye',
                    tooltip: 'Misiones de fuego'
                },

                // DESCANSO
                { title: 'Espera', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'En posición lista' }
            ];
        },

        // ======================================
        // ARMA DE APOYO DE COMBATE
        // ======================================

        /**
         * INGENIEROS
         * Funciones: Movilidad, contramovilidad, supervivencia
         */
        ingenieros() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-truck', tooltip: 'Movimiento' },

                // MOVILIDAD
                {
                    title: 'Movilidad',
                    action: 'submenu',
                    submenu: 'ingenieros_movilidad',
                    icon: 'fas fa-road',
                    tooltip: 'Facilitar movimiento'
                },

                // CONTRAMOVILIDAD
                {
                    title: 'Contramovilidad',
                    action: 'submenu',
                    submenu: 'ingenieros_contramovilidad',
                    icon: 'fas fa-ban',
                    tooltip: 'Obstaculizar enemigo'
                },

                // SUPERVIVENCIA (Fortificación)
                {
                    title: 'Supervivencia',
                    action: 'submenu',
                    submenu: 'ingenieros_supervivencia',
                    icon: 'fas fa-shield-alt',
                    tooltip: 'Fortificaciones'
                },

                // DESCANSO
                { title: 'Descanso', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Espera' }
            ];
        },

        /**
         * COMUNICACIONES
         * Funciones: Enlaces, redes, criptología
         */
        comunicaciones() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-truck', tooltip: 'Movimiento' },

                // COMUNICACIONES
                {
                    title: 'Enlaces',
                    action: 'submenu',
                    submenu: 'comunicaciones_enlaces',
                    icon: 'fas fa-broadcast-tower',
                    tooltip: 'Establecer comunicaciones'
                },

                // DESCANSO
                { title: 'Espera', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Mantener enlaces' }
            ];
        },

        /**
         * INTELIGENCIA
         * Funciones: Reconocimiento, vigilancia, adquisición de objetivos
         */
        inteligencia() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-walking', tooltip: 'Movimiento táctico' },

                // RECONOCIMIENTO
                {
                    title: 'Reconocimiento',
                    action: 'submenu',
                    submenu: 'inteligencia_recon',
                    icon: 'fas fa-eye',
                    tooltip: 'Operaciones de inteligencia'
                },

                // DESCANSO
                { title: 'Espera', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Espera' }
            ];
        },

        // ======================================
        // SERVICIOS DE APOYO LOGÍSTICO
        // ======================================

        /**
         * SANIDAD
         * Funciones: Tratamiento, evacuación, hospitalización
         */
        sanidad() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-ambulance', tooltip: 'Movimiento' },

                // APOYO SANITARIO
                {
                    title: 'Apoyo Sanitario',
                    action: 'submenu',
                    submenu: 'sanidad_apoyo',
                    icon: 'fas fa-briefcase-medical',
                    tooltip: 'Operaciones sanitarias'
                },

                // DESCANSO
                { title: 'Espera', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'En posición' }
            ];
        },

        /**
         * ABASTECIMIENTO
         * Funciones: Provisión de material, municiones, combustible
         */
        abastecimiento() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-truck-loading', tooltip: 'Movimiento logístico' },

                // ABASTECIMIENTO
                {
                    title: 'Abastecimiento',
                    action: 'submenu',
                    submenu: 'abastecimiento_ops',
                    icon: 'fas fa-boxes',
                    tooltip: 'Operaciones de abastecimiento'
                },

                // DESCANSO
                { title: 'Espera', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Espera' }
            ];
        },

        /**
         * TRANSPORTE
         * Funciones: Movimiento de personal y material
         */
        transporte() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-truck', tooltip: 'Movimiento' },

                // TRANSPORTE
                {
                    title: 'Transporte',
                    action: 'submenu',
                    submenu: 'transporte_ops',
                    icon: 'fas fa-shipping-fast',
                    tooltip: 'Operaciones de transporte'
                },

                // DESCANSO
                { title: 'Espera', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Espera' }
            ];
        },

        /**
         * MANTENIMIENTO
         * Funciones: Reparación, recuperación de material
         */
        mantenimiento() {
            return [
                // MARCHA
                { title: 'Marcha', action: 'ordenMovimiento', icon: 'fas fa-truck', tooltip: 'Movimiento' },

                // MANTENIMIENTO
                {
                    title: 'Mantenimiento',
                    action: 'submenu',
                    submenu: 'mantenimiento_ops',
                    icon: 'fas fa-wrench',
                    tooltip: 'Operaciones de mantenimiento'
                },

                // DESCANSO
                { title: 'Espera', action: 'ordenEspera', icon: 'fas fa-pause', tooltip: 'Espera' }
            ];
        }
    },

    /**
     * SUBMENÚS ESPECÍFICOS
     */
    submenus: {

        // COMBATE - Infantería
        infanteria_combate: [
            { title: 'Atacar', action: 'ordenAtaque', icon: 'fas fa-hand-rock', tooltip: 'Ataque de infantería' },
            { title: 'Defender', action: 'ordenDefensa', icon: 'fas fa-shield-alt', tooltip: 'Defensa de posición' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // COMBATE - Caballería
        caballeria_combate: [
            { title: 'Atacar', action: 'ordenAtaque', icon: 'fas fa-bolt', tooltip: 'Ataque motorizado' },
            { title: 'Defender', action: 'ordenDefensa', icon: 'fas fa-shield-alt', tooltip: 'Defensa móvil' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // FUEGO - Artillería
        artilleria_fuego: [
            { title: 'Apoyo Directo', action: 'apoyoDirecto', icon: 'fas fa-bullseye', tooltip: 'Apoyo de fuego directo' },
            { title: 'Apoyo General', action: 'apoyoGeneral', icon: 'fas fa-crosshairs', tooltip: 'Apoyo de fuego general' },
            { title: 'Preparación', action: 'preparacionFuego', icon: 'fas fa-fire', tooltip: 'Preparación de fuegos' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // MOVILIDAD - Ingenieros
        ingenieros_movilidad: [
            { title: 'Mejorar Camino', action: 'mejorarCamino', icon: 'fas fa-road', tooltip: 'Mejorar vía de acceso' },
            { title: 'Instalar Puente', action: 'instalarPuente', icon: 'fas fa-archway', tooltip: 'Establecer cruce' },
            { title: 'Limpiar Obstáculos', action: 'limpiarObstaculos', icon: 'fas fa-broom', tooltip: 'Remover obstáculos' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // CONTRAMOVILIDAD - Ingenieros
        ingenieros_contramovilidad: [
            { title: 'Campo Minado AT', action: 'campoMinadoAT', icon: 'fas fa-bullseye', tooltip: 'Minas antitanque' },
            { title: 'Campo Minado AP', action: 'campoMinadoAP', icon: 'fas fa-user-slash', tooltip: 'Minas antipersonal' },
            { title: 'Obstáculos', action: 'colocarObstaculos', icon: 'fas fa-ban', tooltip: 'Obstáculos naturales/artificiales' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // SUPERVIVENCIA - Ingenieros
        ingenieros_supervivencia: [
            { title: 'Fortificar Posición', action: 'fortificarPosicion', icon: 'fas fa-building', tooltip: 'Fortificación de combate' },
            { title: 'Abrigo Personal', action: 'abrigoPersonal', icon: 'fas fa-home', tooltip: 'Pozos de tirador' },
            { title: 'Bunker', action: 'construirBunker', icon: 'fas fa-fort-awesome', tooltip: 'Construcción fortificada' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // ENLACES - Comunicaciones
        comunicaciones_enlaces: [
            { title: 'Red Radio', action: 'establecerRadio', icon: 'fas fa-wifi', tooltip: 'Establecer red de radio' },
            { title: 'Enlace Datos', action: 'enlaceDatos', icon: 'fas fa-ethernet', tooltip: 'Enlace de datos táctico' },
            { title: 'Mantener Red', action: 'mantenerRed', icon: 'fas fa-network-wired', tooltip: 'Mantenimiento de enlaces' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // RECONOCIMIENTO - Inteligencia
        inteligencia_recon: [
            { title: 'Vigilancia', action: 'ordenReconocimiento', icon: 'fas fa-eye', tooltip: 'Vigilancia de zona' },
            { title: 'Adquisición', action: 'adquisicionObjetivos', icon: 'fas fa-crosshairs', tooltip: 'Adquisición de objetivos' },
            { title: 'Interrogatorio', action: 'interrogatorio', icon: 'fas fa-question-circle', tooltip: 'Interrogatorio táctico' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // APOYO SANITARIO - Sanidad
        sanidad_apoyo: [
            { title: 'Tratamiento', action: 'tratamientoHeridos', icon: 'fas fa-first-aid', tooltip: 'Atención médica' },
            { title: 'Evacuación', action: 'evacuacionHeridos', icon: 'fas fa-ambulance', tooltip: 'Evacuación de bajas' },
            { title: 'Puesto Socorro', action: 'puestoSocorro', icon: 'fas fa-hospital', tooltip: 'Establecer puesto de socorro' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // ABASTECIMIENTO
        abastecimiento_ops: [
            { title: 'Distribuir Munición', action: 'distribuirMunicion', icon: 'fas fa-box', tooltip: 'Distribución de municiones' },
            { title: 'Combustible', action: 'abastecerCombustible', icon: 'fas fa-gas-pump', tooltip: 'Abastecimiento de combustible' },
            { title: 'Víveres', action: 'distribuirViveres', icon: 'fas fa-utensils', tooltip: 'Distribución de víveres' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // TRANSPORTE
        transporte_ops: [
            { title: 'Transportar Personal', action: 'transportePersonal', icon: 'fas fa-users', tooltip: 'Movimiento de personal' },
            { title: 'Transportar Material', action: 'transporteMaterial', icon: 'fas fa-boxes', tooltip: 'Movimiento de material' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ],

        // MANTENIMIENTO
        mantenimiento_ops: [
            { title: 'Reparar Vehículo', action: 'repararVehiculo', icon: 'fas fa-wrench', tooltip: 'Reparación de vehículos' },
            { title: 'Recuperar Material', action: 'recuperarMaterial', icon: 'fas fa-dolly', tooltip: 'Recuperación de material' },
            { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver' }
        ]
    },

    /**
     * Obtiene submenu específico
     */
    obtenerSubmenu(nombre) {
        return this.submenus[nombre] || [];
    }
};

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenusDoctrinales;
}
window.MenusDoctrinales = MenusDoctrinales;

console.log('✅ MenusDoctrinales.js cargado - Sistema doctrinal completo');
