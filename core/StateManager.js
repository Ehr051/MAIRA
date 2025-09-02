/**
 * 🗃️ MAIRA State Manager
 * Gestión centralizada del estado de la aplicación
 * Implementa patrón Redux-like para manejo de estado predecible
 */

class StateManager {
    constructor() {
        this.state = this.getInitialState();
        this.reducers = new Map();
        this.middleware = [];
        this.subscribers = new Set();
        this.stateHistory = [];
        this.maxHistorySize = 50;
        this.isDispatching = false;
        
        console.log('🗃️ StateManager initialized');
        this.initializeStateManager();
    }

    /**
     * Estado inicial de la aplicación
     * @returns {Object} Estado inicial
     */
    getInitialState() {
        return {
            // Sistema
            system: {
                initialized: false,
                loading: false,
                error: null,
                warnings: [],
                version: '2.0.0'
            },

            // Usuario
            user: {
                id: null,
                username: null,
                email: null,
                permissions: [],
                isAuthenticated: false,
                lastActivity: null
            },

            // Juego
            game: {
                id: null,
                code: null,
                name: null,
                status: 'waiting', // waiting, active, paused, ended
                phase: 'setup', // setup, deployment, combat, ended
                subphase: null,
                currentTurn: 1,
                currentPlayer: null,
                timeRemaining: 0,
                players: [],
                director: null,
                settings: {
                    maxPlayers: 8,
                    turnDuration: 300,
                    deploymentZones: {}
                }
            },

            // Mapa
            map: {
                initialized: false,
                center: [-34.6118, -58.3960], // Buenos Aires por defecto
                zoom: 10,
                bounds: null,
                layers: [],
                selectedElements: [],
                visibleElements: new Map(),
                filters: {
                    showFriendly: true,
                    showEnemy: true,
                    showNeutral: true
                }
            },

            // Elementos militares
            elements: {
                items: new Map(),
                byPlayer: new Map(),
                byType: new Map(),
                selected: null,
                clipboard: null,
                filters: {
                    types: [],
                    players: [],
                    status: []
                }
            },

            // Chat
            chat: {
                messages: [],
                activeChannels: ['general'],
                currentChannel: 'general',
                unreadCount: 0,
                typingUsers: [],
                connected: false
            },

            // Red
            network: {
                connected: false,
                reconnecting: false,
                lastConnected: null,
                latency: 0,
                roomId: null,
                socketId: null
            },

            // UI
            ui: {
                activePanel: null,
                openModals: [],
                sidebarOpen: false,
                chatOpen: false,
                fullscreen: false,
                mobile: false,
                notifications: [],
                theme: 'default'
            },

            // Performance
            performance: {
                fps: 60,
                memoryUsage: 0,
                renderTime: 0,
                visibleElementCount: 0,
                totalElementCount: 0
            }
        };
    }

    /**
     * Inicializa el gestor de estado
     */
    initializeStateManager() {
        // Configurar reducers básicos
        this.setupDefaultReducers();
        
        // Configurar middleware básico
        this.setupDefaultMiddleware();
        
        // Detectar si es dispositivo móvil
        this.detectMobileDevice();
        
        // Configurar limpieza del historial
        this.setupHistoryCleanup();
        
        console.log('✅ State Manager system active');
    }

    /**
     * Configura reducers por defecto
     */
    setupDefaultReducers() {
        // Reducer para sistema
        this.registerReducer('SYSTEM_SET_LOADING', (state, action) => ({
            ...state,
            system: {
                ...state.system,
                loading: action.payload
            }
        }));

        this.registerReducer('SYSTEM_SET_ERROR', (state, action) => ({
            ...state,
            system: {
                ...state.system,
                error: action.payload
            }
        }));

        this.registerReducer('SYSTEM_ADD_WARNING', (state, action) => ({
            ...state,
            system: {
                ...state.system,
                warnings: [...state.system.warnings, action.payload]
            }
        }));

        // Reducer para usuario
        this.registerReducer('USER_LOGIN', (state, action) => ({
            ...state,
            user: {
                ...state.user,
                ...action.payload,
                isAuthenticated: true,
                lastActivity: Date.now()
            }
        }));

        this.registerReducer('USER_LOGOUT', (state) => ({
            ...state,
            user: {
                ...this.getInitialState().user
            }
        }));

        // Reducer para juego
        this.registerReducer('GAME_CREATE', (state, action) => ({
            ...state,
            game: {
                ...state.game,
                ...action.payload,
                status: 'waiting'
            }
        }));

        this.registerReducer('GAME_START', (state) => ({
            ...state,
            game: {
                ...state.game,
                status: 'active',
                phase: 'deployment'
            }
        }));

        this.registerReducer('GAME_CHANGE_PHASE', (state, action) => ({
            ...state,
            game: {
                ...state.game,
                phase: action.payload.phase,
                subphase: action.payload.subphase || null
            }
        }));

        this.registerReducer('GAME_CHANGE_TURN', (state, action) => ({
            ...state,
            game: {
                ...state.game,
                currentTurn: action.payload.turn,
                currentPlayer: action.payload.player,
                timeRemaining: action.payload.timeRemaining || state.game.settings.turnDuration
            }
        }));

        // Reducer para elementos
        this.registerReducer('ELEMENTS_ADD', (state, action) => {
            const newElements = new Map(state.elements.items);
            newElements.set(action.payload.id, action.payload);
            
            return {
                ...state,
                elements: {
                    ...state.elements,
                    items: newElements
                }
            };
        });

        this.registerReducer('ELEMENTS_REMOVE', (state, action) => {
            const newElements = new Map(state.elements.items);
            newElements.delete(action.payload.id);
            
            return {
                ...state,
                elements: {
                    ...state.elements,
                    items: newElements,
                    selected: state.elements.selected === action.payload.id ? null : state.elements.selected
                }
            };
        });

        this.registerReducer('ELEMENTS_SELECT', (state, action) => ({
            ...state,
            elements: {
                ...state.elements,
                selected: action.payload.id
            }
        }));

        // Reducer para chat
        this.registerReducer('CHAT_ADD_MESSAGE', (state, action) => ({
            ...state,
            chat: {
                ...state.chat,
                messages: [...state.chat.messages, action.payload],
                unreadCount: state.chat.currentChannel !== action.payload.channel ? 
                    state.chat.unreadCount + 1 : state.chat.unreadCount
            }
        }));

        this.registerReducer('CHAT_SET_CHANNEL', (state, action) => ({
            ...state,
            chat: {
                ...state.chat,
                currentChannel: action.payload.channel,
                unreadCount: 0
            }
        }));

        // Reducer para red
        this.registerReducer('NETWORK_CONNECT', (state, action) => ({
            ...state,
            network: {
                ...state.network,
                connected: true,
                reconnecting: false,
                lastConnected: Date.now(),
                socketId: action.payload.socketId,
                roomId: action.payload.roomId
            }
        }));

        this.registerReducer('NETWORK_DISCONNECT', (state) => ({
            ...state,
            network: {
                ...state.network,
                connected: false,
                reconnecting: false,
                socketId: null
            }
        }));

        // Reducer para UI
        this.registerReducer('UI_OPEN_PANEL', (state, action) => ({
            ...state,
            ui: {
                ...state.ui,
                activePanel: action.payload.panel
            }
        }));

        this.registerReducer('UI_CLOSE_PANEL', (state) => ({
            ...state,
            ui: {
                ...state.ui,
                activePanel: null
            }
        }));

        this.registerReducer('UI_TOGGLE_SIDEBAR', (state) => ({
            ...state,
            ui: {
                ...state.ui,
                sidebarOpen: !state.ui.sidebarOpen
            }
        }));

        this.registerReducer('UI_ADD_NOTIFICATION', (state, action) => ({
            ...state,
            ui: {
                ...state.ui,
                notifications: [...state.ui.notifications, {
                    id: Date.now(),
                    ...action.payload,
                    timestamp: Date.now()
                }]
            }
        }));

        this.registerReducer('UI_REMOVE_NOTIFICATION', (state, action) => ({
            ...state,
            ui: {
                ...state.ui,
                notifications: state.ui.notifications.filter(n => n.id !== action.payload.id)
            }
        }));
    }

    /**
     * Configura middleware por defecto
     */
    setupDefaultMiddleware() {
        // Middleware de logging
        this.use((store, next, action) => {
            if (this.isDebugging()) {
                console.log('🗃️ Action dispatched:', action);
                console.log('🗃️ Previous state:', store.getState());
            }
            
            const result = next(action);
            
            if (this.isDebugging()) {
                console.log('🗃️ New state:', store.getState());
            }
            
            return result;
        });

        // Middleware de validación
        this.use((store, next, action) => {
            if (!action || typeof action.type !== 'string') {
                throw new Error('🗃️ Action must have a type property');
            }
            
            return next(action);
        });

        // Middleware de persistencia (localStorage)
        this.use((store, next, action) => {
            const result = next(action);
            
            // Persistir estado crítico
            this.persistCriticalState();
            
            return result;
        });

        // Middleware de eventos
        this.use((store, next, action) => {
            const result = next(action);
            
            // Emitir evento de cambio de estado
            if (window.MAIRA?.Events) {
                window.MAIRA.Events.emit('state:changed', {
                    action,
                    state: store.getState()
                });
            }
            
            return result;
        });
    }

    /**
     * Registra un reducer para un tipo de acción
     * @param {string} actionType - Tipo de acción
     * @param {Function} reducer - Función reducer
     */
    registerReducer(actionType, reducer) {
        this.reducers.set(actionType, reducer);
    }

    /**
     * Agrega middleware al pipeline
     * @param {Function} middleware - Función middleware
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Despacha una acción
     * @param {Object} action - Acción a despachar
     * @returns {Object} Acción despachada
     */
    dispatch(action) {
        if (this.isDispatching) {
            throw new Error('🗃️ Cannot dispatch action while dispatching');
        }

        try {
            this.isDispatching = true;
            
            // Ejecutar middleware
            let index = 0;
            const next = (currentAction) => {
                if (index >= this.middleware.length) {
                    return this.executeReducer(currentAction);
                }
                
                const middleware = this.middleware[index++];
                return middleware(this, next, currentAction);
            };

            return next(action);
            
        } finally {
            this.isDispatching = false;
        }
    }

    /**
     * Ejecuta el reducer apropiado
     * @param {Object} action - Acción
     * @returns {Object} Acción
     */
    executeReducer(action) {
        const reducer = this.reducers.get(action.type);
        
        if (!reducer) {
            console.warn(`🗃️ No reducer found for action type: ${action.type}`);
            return action;
        }

        // Guardar estado anterior
        const previousState = { ...this.state };
        
        try {
            // Aplicar reducer
            const newState = reducer(this.state, action);
            
            // Validar que el reducer retorne un objeto
            if (typeof newState !== 'object' || newState === null) {
                throw new Error('🗃️ Reducer must return an object');
            }
            
            // Actualizar estado
            this.state = newState;
            
            // Agregar al historial
            this.addToHistory(previousState, action);
            
            // Notificar suscriptores
            this.notifySubscribers(previousState, newState, action);
            
        } catch (error) {
            console.error('🗃️ Error in reducer:', error);
            
            // Reportar error
            if (window.MAIRA?.ErrorHandler) {
                window.MAIRA.ErrorHandler.handleError({
                    type: 'state_reducer',
                    message: `Error in reducer for ${action.type}: ${error.message}`,
                    error,
                    action
                });
            }
            
            // Restaurar estado anterior en caso de error
            this.state = previousState;
        }

        return action;
    }

    /**
     * Obtiene el estado actual
     * @returns {Object} Estado actual
     */
    getState() {
        return this.state;
    }

    /**
     * Suscribe un listener a cambios de estado
     * @param {Function} listener - Función listener
     * @returns {Function} Función para desuscribir
     */
    subscribe(listener) {
        this.subscribers.add(listener);
        
        // Función para desuscribir
        return () => {
            this.subscribers.delete(listener);
        };
    }

    /**
     * Notifica a los suscriptores de cambios de estado
     * @param {Object} previousState - Estado anterior
     * @param {Object} newState - Nuevo estado
     * @param {Object} action - Acción que causó el cambio
     */
    notifySubscribers(previousState, newState, action) {
        this.subscribers.forEach(listener => {
            try {
                listener(newState, previousState, action);
            } catch (error) {
                console.error('🗃️ Error in state subscriber:', error);
            }
        });
    }

    /**
     * Agrega estado al historial
     * @param {Object} previousState - Estado anterior
     * @param {Object} action - Acción
     */
    addToHistory(previousState, action) {
        this.stateHistory.push({
            state: previousState,
            action,
            timestamp: Date.now()
        });

        // Mantener tamaño del historial
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }

    /**
     * Persiste estado crítico en localStorage
     */
    persistCriticalState() {
        try {
            const criticalState = {
                user: this.state.user,
                game: {
                    id: this.state.game.id,
                    code: this.state.game.code,
                    name: this.state.game.name
                },
                ui: {
                    theme: this.state.ui.theme,
                    sidebarOpen: this.state.ui.sidebarOpen
                }
            };
            
            localStorage.setItem('maira_state', JSON.stringify(criticalState));
        } catch (error) {
            console.warn('🗃️ Failed to persist state:', error);
        }
    }

    /**
     * Restaura estado desde localStorage
     */
    restorePersistedState() {
        try {
            const persistedState = localStorage.getItem('maira_state');
            if (persistedState) {
                const parsed = JSON.parse(persistedState);
                
                // Mergear con estado actual
                this.state = {
                    ...this.state,
                    ...parsed
                };
                
                console.log('🗃️ State restored from localStorage');
            }
        } catch (error) {
            console.warn('🗃️ Failed to restore persisted state:', error);
        }
    }

    /**
     * Detecta si es dispositivo móvil
     */
    detectMobileDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.dispatch({
            type: 'UI_SET_MOBILE',
            payload: { mobile: isMobile }
        });

        // Registrar reducer para mobile
        this.registerReducer('UI_SET_MOBILE', (state, action) => ({
            ...state,
            ui: {
                ...state.ui,
                mobile: action.payload.mobile
            }
        }));
    }

    /**
     * Configura limpieza del historial
     */
    setupHistoryCleanup() {
        setInterval(() => {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            this.stateHistory = this.stateHistory.filter(entry => 
                entry.timestamp > oneHourAgo
            );
        }, 10 * 60 * 1000); // Cada 10 minutos
    }

    /**
     * Verifica si está en modo debugging
     * @returns {boolean} Si está en modo debug
     */
    isDebugging() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               localStorage.getItem('maira_debug') === 'true';
    }

    /**
     * Action creators para operaciones comunes
     */
    actions = {
        // Sistema
        setLoading: (loading) => this.dispatch({
            type: 'SYSTEM_SET_LOADING',
            payload: loading
        }),

        setError: (error) => this.dispatch({
            type: 'SYSTEM_SET_ERROR',
            payload: error
        }),

        // Usuario
        login: (userData) => this.dispatch({
            type: 'USER_LOGIN',
            payload: userData
        }),

        logout: () => this.dispatch({
            type: 'USER_LOGOUT'
        }),

        // Juego
        createGame: (gameData) => this.dispatch({
            type: 'GAME_CREATE',
            payload: gameData
        }),

        startGame: () => this.dispatch({
            type: 'GAME_START'
        }),

        changePhase: (phase, subphase) => this.dispatch({
            type: 'GAME_CHANGE_PHASE',
            payload: { phase, subphase }
        }),

        changeTurn: (turn, player, timeRemaining) => this.dispatch({
            type: 'GAME_CHANGE_TURN',
            payload: { turn, player, timeRemaining }
        }),

        // Elementos
        addElement: (element) => this.dispatch({
            type: 'ELEMENTS_ADD',
            payload: element
        }),

        removeElement: (id) => this.dispatch({
            type: 'ELEMENTS_REMOVE',
            payload: { id }
        }),

        selectElement: (id) => this.dispatch({
            type: 'ELEMENTS_SELECT',
            payload: { id }
        }),

        // Chat
        addMessage: (message) => this.dispatch({
            type: 'CHAT_ADD_MESSAGE',
            payload: message
        }),

        // Red
        connect: (socketId, roomId) => this.dispatch({
            type: 'NETWORK_CONNECT',
            payload: { socketId, roomId }
        }),

        disconnect: () => this.dispatch({
            type: 'NETWORK_DISCONNECT'
        }),

        // UI
        openPanel: (panel) => this.dispatch({
            type: 'UI_OPEN_PANEL',
            payload: { panel }
        }),

        closePanel: () => this.dispatch({
            type: 'UI_CLOSE_PANEL'
        }),

        toggleSidebar: () => this.dispatch({
            type: 'UI_TOGGLE_SIDEBAR'
        }),

        addNotification: (notification) => this.dispatch({
            type: 'UI_ADD_NOTIFICATION',
            payload: notification
        })
    };

    /**
     * Obtiene el historial de estados
     * @param {number} limit - Límite de resultados
     * @returns {Array} Historial
     */
    getHistory(limit = 10) {
        return this.stateHistory.slice(-limit);
    }

    /**
     * Reinicia el estado a valores iniciales
     */
    reset() {
        this.state = this.getInitialState();
        this.stateHistory = [];
        
        console.log('🗃️ State reset to initial values');
        
        // Notificar suscriptores
        this.notifySubscribers({}, this.state, { type: 'STATE_RESET' });
    }
}

// Inicializar StateManager globalmente
if (!window.MAIRA) window.MAIRA = {};
window.MAIRA.State = new StateManager();

// Restaurar estado persistido
window.MAIRA.State.restorePersistedState();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}

console.log('🗃️ MAIRA State Manager loaded and active');
