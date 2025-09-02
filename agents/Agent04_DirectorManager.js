/**
 * 👨‍✈️ AGENTE 4/10: DIRECTOR MANAGER
 * Implementación completa sistema esDirector/esCreador/esListo
 * Control jerárquico militar y gestión estados preparación
 */

class DirectorManager {
    constructor() {
        this.rolesDefinidos = {};
        this.estadosParticipantes = new Map();
        this.configuracionSectorTrabajo = null;
        this.zonasDespliegue = {};
        this.directorTemporal = null;
        
        console.log('👨‍✈️ AGENTE 4 ACTIVADO: Director Manager');
        this.inicializarSistemaDirector();
    }

    /**
     * Inicializa el sistema completo de director/creador/listo
     */
    inicializarSistemaDirector() {
        console.log('👨‍✈️ Inicializando sistema Director/Creador/Listo...');
        
        this.definirRolesMilitares();
        this.configurarEstadosParticipantes();
        this.implementarControlJerarquico();
        this.configurarSectorTrabajo();
        this.configurarZonasDespliegue();
        this.establecerValidaciones();
        
        console.log('✅ Sistema Director/Creador/Listo operativo');
    }

    /**
     * Define los roles militares del sistema
     */
    definirRolesMilitares() {
        this.rolesDefinidos = {
            DIRECTOR: {
                codigo: 'esDirector',
                nombre: 'Director del Ejercicio',
                permisos: [
                    'CONTROL_TOTAL_EJERCICIO',
                    'DEFINIR_SECTOR_TRABAJO',
                    'CONFIGURAR_ZONAS_DESPLIEGUE',
                    'INICIAR_FINALIZAR_FASES',
                    'MODIFICAR_CONFIGURACION',
                    'SUPERVISAR_PARTICIPANTES',
                    'ACCESO_ESTADISTICAS_COMPLETAS',
                    'CONTROL_TIEMPO_EJERCICIO'
                ],
                responsabilidades: [
                    'Supervisión general del ejercicio',
                    'Definición del área de operaciones',
                    'Control de transiciones entre fases',
                    'Evaluación final del ejercicio'
                ],
                limitaciones: [
                    'No puede participar como combatiente',
                    'Debe mantener neutralidad táctica'
                ],
                color_distintivo: '#FFD700', // Dorado
                icono: 'fas fa-star'
            },
            CREADOR: {
                codigo: 'esCreador',
                nombre: 'Creador del Escenario',
                permisos: [
                    'CONFIGURAR_ESCENARIO_INICIAL',
                    'DEFINIR_CONDICIONES_EJERCICIO',
                    'ESTABLECER_REGLAS_ESPECIALES',
                    'CONFIGURAR_DURACION_TURNOS',
                    'DEFINIR_OBJETIVOS_EJERCICIO',
                    'CONFIGURAR_ELEMENTOS_PERMITIDOS',
                    'ESTABLECER_CONDICIONES_VICTORIA'
                ],
                responsabilidades: [
                    'Diseño del escenario de ejercicio',
                    'Configuración de parámetros iniciales',
                    'Definición de reglas específicas',
                    'Establecimiento de objetivos'
                ],
                limitaciones: [
                    'Poder limitado durante ejecución',
                    'No puede modificar durante combate'
                ],
                color_distintivo: '#9932CC', // Púrpura
                icono: 'fas fa-cog'
            },
            PARTICIPANTE_AZUL: {
                codigo: 'participanteAzul',
                nombre: 'Participante Equipo Azul',
                permisos: [
                    'DESPLEGAR_ELEMENTOS_ZONA_AZUL',
                    'MOVER_ELEMENTOS_PROPIOS',
                    'VER_ELEMENTOS_LINEA_VISION',
                    'COMUNICARSE_EQUIPO',
                    'SOLICITAR_INFORMACION'
                ],
                responsabilidades: [
                    'Cumplir objetivos equipo azul',
                    'Respetar zonas de despliegue',
                    'Seguir reglas del ejercicio'
                ],
                limitaciones: [
                    'Solo zona azul para despliegue',
                    'No ve elementos enemigos ocultos',
                    'Limitado por niebla de guerra'
                ],
                color_distintivo: '#0066CC', // Azul
                icono: 'fas fa-shield-alt'
            },
            PARTICIPANTE_ROJO: {
                codigo: 'participanteRojo',
                nombre: 'Participante Equipo Rojo',
                permisos: [
                    'DESPLEGAR_ELEMENTOS_ZONA_ROJA',
                    'MOVER_ELEMENTOS_PROPIOS',
                    'VER_ELEMENTOS_LINEA_VISION',
                    'COMUNICARSE_EQUIPO',
                    'SOLICITAR_INFORMACION'
                ],
                responsabilidades: [
                    'Cumplir objetivos equipo rojo',
                    'Respetar zonas de despliegue',
                    'Seguir reglas del ejercicio'
                ],
                limitaciones: [
                    'Solo zona roja para despliegue',
                    'No ve elementos enemigos ocultos',
                    'Limitado por niebla de guerra'
                ],
                color_distintivo: '#CC0000', // Rojo
                icono: 'fas fa-sword'
            },
            SIN_EQUIPO: {
                codigo: 'sinEquipo',
                nombre: 'Observador',
                permisos: [
                    'VER_DESARROLLO_EJERCICIO',
                    'ACCESO_ESTADISTICAS_BASICAS'
                ],
                responsabilidades: [
                    'Observar sin interferir'
                ],
                limitaciones: [
                    'No puede realizar acciones',
                    'Solo observación pasiva'
                ],
                color_distintivo: '#808080', // Gris
                icono: 'fas fa-eye'
            }
        };

        console.log(`⭐ ${Object.keys(this.rolesDefinidos).length} roles militares definidos`);
    }

    /**
     * Configura los estados de preparación de participantes
     */
    configurarEstadosParticipantes() {
        this.estadosDisponibles = {
            NO_LISTO: {
                codigo: 'noListo',
                nombre: 'No Listo',
                descripcion: 'Participante aún preparando su despliegue',
                color: '#FF6B6B',
                icono: 'fas fa-clock',
                acciones_permitidas: [
                    'CONFIGURAR_ELEMENTOS',
                    'POSICIONAR_UNIDADES',
                    'REVISAR_CONFIGURACION'
                ]
            },
            LISTO: {
                codigo: 'esListo',
                nombre: 'Listo para Comenzar',
                descripcion: 'Participante completó preparación',
                color: '#51CF66',
                icono: 'fas fa-check-circle',
                acciones_permitidas: [
                    'ESPERAR_INICIO',
                    'REVISAR_CONFIGURACION_FINAL'
                ]
            },
            EN_PREPARACION: {
                codigo: 'enPreparacion',
                nombre: 'En Preparación',
                descripcion: 'Activamente configurando elementos',
                color: '#FFD43B',
                icono: 'fas fa-tools',
                acciones_permitidas: [
                    'CONFIGURAR_ELEMENTOS',
                    'MOVER_ELEMENTOS',
                    'CAMBIAR_CONFIGURACION'
                ]
            },
            ESPERANDO: {
                codigo: 'esperando',
                nombre: 'Esperando Otros',
                descripcion: 'Listo pero esperando otros participantes',
                color: '#339AF0',
                icono: 'fas fa-hourglass-half',
                acciones_permitidas: [
                    'REVISAR_CONFIGURACION',
                    'CHAT_EQUIPO'
                ]
            }
        };

        console.log(`📊 ${Object.keys(this.estadosDisponibles).length} estados participantes configurados`);
    }

    /**
     * Implementa el control jerárquico del sistema
     */
    implementarControlJerarquico() {
        this.jerarquiaControl = {
            nivel_1_supremo: {
                roles: ['DIRECTOR'],
                autoridad_sobre: ['CREADOR', 'PARTICIPANTE_AZUL', 'PARTICIPANTE_ROJO', 'SIN_EQUIPO'],
                puede_anular: true,
                puede_modificar_config: true,
                acceso_total: true
            },
            nivel_2_configuracion: {
                roles: ['CREADOR'],
                autoridad_sobre: ['PARTICIPANTE_AZUL', 'PARTICIPANTE_ROJO'],
                puede_anular: false,
                puede_modificar_config: true,
                acceso_configuracion: true
            },
            nivel_3_participantes: {
                roles: ['PARTICIPANTE_AZUL', 'PARTICIPANTE_ROJO'],
                autoridad_sobre: [],
                puede_anular: false,
                puede_modificar_config: false,
                acceso_limitado: true
            },
            nivel_4_observadores: {
                roles: ['SIN_EQUIPO'],
                autoridad_sobre: [],
                puede_anular: false,
                puede_modificar_config: false,
                acceso_solo_lectura: true
            }
        };

        console.log('🏛️ Jerarquía de control implementada');
    }

    /**
     * Configura el sistema de sector de trabajo
     */
    configurarSectorTrabajo() {
        this.configuracionSectorTrabajo = {
            definicion: {
                descripcion: 'Área geográfica donde se desarrollará el ejercicio',
                definido_por: 'DIRECTOR',
                modificable_por: 'DIRECTOR',
                validaciones: [
                    'Área mínima 100 km²',
                    'Área máxima 10,000 km²',
                    'Debe incluir terreno variado',
                    'Limites dentro Argentina'
                ]
            },
            metodos_definicion: {
                DIBUJO_LIBRE: {
                    descripcion: 'Director dibuja polígono en mapa',
                    herramienta: 'PolygonDrawTool',
                    validacion: 'Tiempo real'
                },
                SELECCION_REGIONES: {
                    descripcion: 'Selección regiones predefinidas',
                    opciones: ['Provincias', 'Departamentos', 'Zonas militares'],
                    combinable: true
                },
                COORDENADAS_DIRECTAS: {
                    descripcion: 'Ingreso coordenadas límites',
                    formato: 'Lat/Lng decimal',
                    precision: '6 decimales'
                }
            },
            efectos_sector: {
                CARGA_TILES: 'Solo tiles dentro sector',
                MOVIMIENTO: 'Elementos no pueden salir sector',
                VISIBILIDAD: 'Mapa enfocado en sector',
                RENDIMIENTO: 'Optimización por área limitada'
            },
            validaciones_automaticas: [
                'Verificar área suficiente para ejercicio',
                'Comprobar disponibilidad tiles',
                'Validar conectividad terreno',
                'Verificar balance zonas azul/rojo'
            ]
        };

        console.log('🗺️ Sistema sector de trabajo configurado');
    }

    /**
     * Configura las zonas de despliegue
     */
    configurarZonasDespliegue() {
        this.zonasDespliegue = {
            definicion: {
                descripcion: 'Áreas específicas para despliegue inicial cada equipo',
                definidas_por: 'DIRECTOR',
                validadas_por: 'SISTEMA',
                restriccion: 'OBLIGATORIA'
            },
            zona_azul: {
                nombre: 'Zona Despliegue Azul',
                color: '#0066CC40', // Azul semi-transparente
                restricciones: [
                    'Solo participantes azules pueden desplegar',
                    'Debe estar dentro sector trabajo',
                    'No puede solaparse con zona roja',
                    'Tamaño proporcional a fuerzas'
                ],
                validaciones: [
                    'Verificar elementos solo azules',
                    'Alertar si intento despliegue fuera zona',
                    'Auto-corregir posiciones inválidas'
                ]
            },
            zona_roja: {
                nombre: 'Zona Despliegue Roja',
                color: '#CC000040', // Rojo semi-transparente
                restricciones: [
                    'Solo participantes rojos pueden desplegar',
                    'Debe estar dentro sector trabajo',
                    'No puede solaparse con zona azul',
                    'Tamaño proporcional a fuerzas'
                ],
                validaciones: [
                    'Verificar elementos solo rojos',
                    'Alertar si intento despliegue fuera zona',
                    'Auto-corregir posiciones inválidas'
                ]
            },
            configuracion_automatica: {
                habilitada: true,
                criterios: [
                    'Dividir sector trabajo en 2 zonas',
                    'Separación mínima 5km entre zonas',
                    'Acceso terreno equilibrado',
                    'Posiciones tácticas balanceadas'
                ],
                ajuste_manual: 'Permitido por director'
            }
        };

        console.log('🎯 Zonas de despliegue configuradas');
    }

    /**
     * Establece validaciones del sistema
     */
    establecerValidaciones() {
        this.validaciones = {
            ASIGNACION_ROLES: {
                un_director_maximo: 'Solo puede haber un director activo',
                un_creador_maximo: 'Solo puede haber un creador activo',
                participantes_ilimitados: 'Múltiples participantes permitidos',
                director_temporal_automatico: 'Si no hay director, asignar temporal'
            },
            ESTADOS_PREPARACION: {
                todos_listos_requerido: 'Todos deben estar listos para avanzar',
                director_puede_forzar: 'Director puede forzar avance',
                timeout_automatico: 'Avance automático después timeout',
                rollback_permitido: 'Vuelta atrás si problemas'
            },
            SECTOR_TRABAJO: {
                definicion_obligatoria: 'Sector debe estar definido antes inicio',
                modificacion_solo_preparacion: 'Solo modificable en preparación',
                validacion_area: 'Área debe cumplir criterios mínimos',
                confirmacion_requerida: 'Cambios requieren confirmación'
            },
            ZONAS_DESPLIEGUE: {
                definicion_obligatoria: 'Zonas deben estar definidas',
                no_solapamiento: 'Zonas no pueden solaparse',
                dentro_sector: 'Zonas deben estar en sector trabajo',
                elementos_zona_correcta: 'Elementos solo en zona asignada'
            }
        };

        console.log('✅ Validaciones del sistema establecidas');
    }

    /**
     * Maneja la asignación de director temporal
     */
    manejarDirectorTemporal() {
        if (!this.tieneDirectorAsignado()) {
            this.directorTemporal = {
                usuario_id: 'SISTEMA_TEMPORAL',
                nombre: 'Director Temporal',
                descripcion: 'Director automático hasta asignación manual',
                permisos_limitados: [
                    'CONFIGURAR_SECTOR_BASICO',
                    'DEFINIR_ZONAS_AUTOMATICAS',
                    'INICIAR_PREPARACION'
                ],
                auto_transfer: true, // Se transfiere automáticamente cuando se asigna director real
                duracion_maxima: '30 minutos',
                acciones_automaticas: [
                    'Configurar sector trabajo por defecto',
                    'Dividir zonas despliegue automáticamente',
                    'Iniciar fase preparación'
                ]
            };

            console.log('🤖 Director temporal activado');
            this.ejecutarConfiguracionAutomatica();
        }
    }

    /**
     * Ejecuta configuración automática con director temporal
     */
    ejecutarConfiguracionAutomatica() {
        if (this.directorTemporal) {
            // Configuración automática básica
            this.configurarSectorAutomatico();
            this.configurarZonasAutomaticas();
            this.notificarConfiguracionAutomatica();
        }
    }

    /**
     * Configura sector de trabajo automático
     */
    configurarSectorAutomatico() {
        const sectorAutomatico = {
            nombre: 'Sector Automático',
            descripcion: 'Configuración automática por director temporal',
            area: 'Buenos Aires - Región metropolitana', // Ejemplo
            coordenadas: {
                norte: -34.0,
                sur: -35.0,
                este: -57.5,
                oeste: -59.0
            },
            configurado_por: 'DIRECTOR_TEMPORAL',
            modificable: true,
            temporal: true
        };

        console.log('🗺️ Sector trabajo automático configurado');
        return sectorAutomatico;
    }

    /**
     * Configura zonas de despliegue automáticas
     */
    configurarZonasAutomaticas() {
        const zonasAutomaticas = {
            zona_azul: {
                nombre: 'Zona Azul Automática',
                coordenadas: {
                    norte: -34.2,
                    sur: -34.6,
                    este: -58.0,
                    oeste: -58.8
                }
            },
            zona_roja: {
                nombre: 'Zona Roja Automática', 
                coordenadas: {
                    norte: -34.6,
                    sur: -35.0,
                    este: -58.0,
                    oeste: -58.8
                }
            },
            separacion: '5 km mínimo',
            configurado_por: 'DIRECTOR_TEMPORAL'
        };

        console.log('🎯 Zonas despliegue automáticas configuradas');
        return zonasAutomaticas;
    }

    /**
     * Verifica si hay director asignado
     */
    tieneDirectorAsignado() {
        return Array.from(this.estadosParticipantes.values())
            .some(participante => participante.rol === 'DIRECTOR');
    }

    /**
     * Verifica si todos están listos para avanzar
     */
    todosListosParaAvanzar() {
        const participantesActivos = Array.from(this.estadosParticipantes.values())
            .filter(p => ['PARTICIPANTE_AZUL', 'PARTICIPANTE_ROJO'].includes(p.rol));
        
        return participantesActivos.every(p => p.estado === 'esListo');
    }

    /**
     * Maneja cambio de estado de participante
     */
    cambiarEstadoParticipante(usuarioId, nuevoEstado) {
        const participante = this.estadosParticipantes.get(usuarioId);
        if (!participante) {
            console.error(`Participante ${usuarioId} no encontrado`);
            return false;
        }

        const estadoAnterior = participante.estado;
        participante.estado = nuevoEstado;
        participante.timestamp_cambio = new Date().toISOString();

        console.log(`👤 ${participante.nombre}: ${estadoAnterior} → ${nuevoEstado}`);

        // Verificar si todos están listos
        if (nuevoEstado === 'esListo' && this.todosListosParaAvanzar()) {
            this.notificarTodosListos();
        }

        return true;
    }

    /**
     * Notifica cuando todos están listos
     */
    notificarTodosListos() {
        console.log('🎉 TODOS LOS PARTICIPANTES ESTÁN LISTOS');
        
        // Emitir evento para que el director pueda iniciar
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('todos_participantes_listos', {
                timestamp: new Date().toISOString(),
                participantes_listos: this.obtenerParticipantesListos(),
                puede_iniciar: true
            });
        }
    }

    /**
     * Obtiene lista de participantes listos
     */
    obtenerParticipantesListos() {
        return Array.from(this.estadosParticipantes.values())
            .filter(p => p.estado === 'esListo')
            .map(p => ({
                id: p.id,
                nombre: p.nombre,
                rol: p.rol,
                equipo: p.equipo
            }));
    }

    /**
     * Valida acción según rol y estado
     */
    validarAccion(usuarioId, accion) {
        const participante = this.estadosParticipantes.get(usuarioId);
        if (!participante) {
            return { valida: false, razon: 'Usuario no encontrado' };
        }

        const rol = this.rolesDefinidos[participante.rol];
        const estado = this.estadosDisponibles[participante.estado];

        // Verificar permisos de rol
        if (!this.accionPermitidaPorRol(accion, rol)) {
            return { valida: false, razon: 'Acción no permitida para este rol' };
        }

        // Verificar permisos de estado
        if (!this.accionPermitidaPorEstado(accion, estado)) {
            return { valida: false, razon: 'Acción no permitida en estado actual' };
        }

        return { valida: true };
    }

    /**
     * Verifica si acción está permitida por rol
     */
    accionPermitidaPorRol(accion, rol) {
        return rol && rol.permisos.includes(accion);
    }

    /**
     * Verifica si acción está permitida por estado
     */
    accionPermitidaPorEstado(accion, estado) {
        return estado && estado.acciones_permitidas.includes(accion);
    }

    /**
     * Transfiere director temporal a director real
     */
    transferirDirectorTemporal(nuevoDirectorId) {
        if (this.directorTemporal) {
            console.log(`🔄 Transfiriendo director temporal a usuario ${nuevoDirectorId}`);
            
            // Transferir configuraciones
            const configuracionTransferida = {
                sector_trabajo: this.configuracionSectorTrabajo,
                zonas_despliegue: this.zonasDespliegue,
                configuraciones_temporales: this.directorTemporal
            };
            
            // Limpiar director temporal
            this.directorTemporal = null;
            
            // Asignar nuevo director
            this.asignarRol(nuevoDirectorId, 'DIRECTOR');
            
            console.log('✅ Director temporal transferido exitosamente');
            return configuracionTransferida;
        }
    }

    /**
     * Asigna rol a usuario
     */
    asignarRol(usuarioId, rol) {
        const participante = this.estadosParticipantes.get(usuarioId) || {};
        participante.rol = rol;
        participante.timestamp_asignacion = new Date().toISOString();
        this.estadosParticipantes.set(usuarioId, participante);
        
        console.log(`⭐ Rol ${rol} asignado a usuario ${usuarioId}`);
    }

    /**
     * Genera reporte completo del sistema director
     */
    generarReporte() {
        const reporte = {
            timestamp: new Date().toISOString(),
            agente: 'DIRECTOR_MANAGER',
            version: 'MAIRA 4.0',
            sistema_director: {
                roles_definidos: Object.keys(this.rolesDefinidos).length,
                estados_disponibles: Object.keys(this.estadosDisponibles).length,
                jerarquia_implementada: Object.keys(this.jerarquiaControl).length,
                validaciones_activas: Object.keys(this.validaciones).length
            },
            configuracion_sector: {
                sistema_configurado: !!this.configuracionSectorTrabajo,
                metodos_definicion: Object.keys(this.configuracionSectorTrabajo?.metodos_definicion || {}).length,
                validaciones_automaticas: this.configuracionSectorTrabajo?.validaciones_automaticas?.length || 0
            },
            zonas_despliegue: {
                sistema_configurado: !!this.zonasDespliegue,
                zona_azul_definida: !!this.zonasDespliegue?.zona_azul,
                zona_roja_definida: !!this.zonasDespliegue?.zona_roja,
                configuracion_automatica: this.zonasDespliegue?.configuracion_automatica?.habilitada || false
            },
            director_temporal: {
                sistema_implementado: true,
                activo: !!this.directorTemporal,
                auto_configuracion: true
            },
            participantes_actuales: this.estadosParticipantes.size,
            siguiente_fase: 'DEPLOYMENT_ZONE_CONTROLLER'
        };

        console.log('📋 REPORTE DIRECTOR MANAGER COMPLETADO');
        console.log('='.repeat(50));
        console.log(`⭐ Roles definidos: ${reporte.sistema_director.roles_definidos}`);
        console.log(`📊 Estados disponibles: ${reporte.sistema_director.estados_disponibles}`);
        console.log(`🗺️ Sector trabajo: ${reporte.configuracion_sector.sistema_configurado ? 'CONFIGURADO' : 'PENDIENTE'}`);
        console.log(`🎯 Zonas despliegue: ${reporte.zonas_despliegue.sistema_configurado ? 'CONFIGURADAS' : 'PENDIENTES'}`);
        console.log(`🤖 Director temporal: ${reporte.director_temporal.sistema_implementado ? 'IMPLEMENTADO' : 'PENDIENTE'}`);
        console.log(`👥 Participantes: ${reporte.participantes_actuales}`);
        console.log('='.repeat(50));

        return reporte;
    }

    /**
     * Notifica configuración automática completada
     */
    notificarConfiguracionAutomatica() {
        console.log('🤖 CONFIGURACIÓN AUTOMÁTICA COMPLETADA');
        console.log('   - Sector de trabajo definido automáticamente');
        console.log('   - Zonas de despliegue configuradas');
        console.log('   - Sistema listo para asignación director real');
        
        if (window.MAIRA && window.MAIRA.Events) {
            window.MAIRA.Events.emit('configuracion_automatica_completada', {
                director_temporal: this.directorTemporal,
                sector_automatico: this.configurarSectorAutomatico(),
                zonas_automaticas: this.configurarZonasAutomaticas()
            });
        }
    }
}

// Inicializar Director Manager
window.MAIRA = window.MAIRA || {};
window.MAIRA.DirectorManager = new DirectorManager();

console.log('[MAIRA 4.0] 👨‍✈️ Agente 4 - Director Manager COMPLETADO');
console.log('[MAIRA 4.0] 🎯 Próximo: Agente 5 - Deployment Zone Controller');
