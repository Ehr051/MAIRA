-- MAIRA 4.0 - Esquemas de Base de Datos PostgreSQL
-- Sistema completo de entrenamiento militar

-- =============================================
-- TABLAS DE CONFIGURACIÓN GENERAL
-- =============================================

-- Usuarios y roles
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('director', 'creador', 'azul', 'rojo')),
    rango_militar VARCHAR(50),
    unidad_pertenencia VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partidas/ejercicios
CREATE TABLE partidas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo_ejercicio VARCHAR(50) NOT NULL CHECK (tipo_ejercicio IN ('local', 'online')),
    director_id INTEGER REFERENCES usuarios(id),
    creador_id INTEGER REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'preparacion' CHECK (estado IN ('preparacion', 'en_curso', 'finalizada')),
    duracion_turno INTEGER DEFAULT 60, -- minutos
    equivalencia_realidad FLOAT DEFAULT 1.0, -- 1 turno = X horas reales
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    configuracion_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Participantes de partidas
CREATE TABLE participantes_partida (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    equipo VARCHAR(10) CHECK (equipo IN ('azul', 'rojo', 'director')),
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- =============================================
-- CONFIGURACIÓN GEOGRÁFICA Y SECTORES
-- =============================================

-- Sectores de trabajo configurados por director
CREATE TABLE sectores_trabajo (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    bounds JSONB NOT NULL, -- {"north": lat, "south": lat, "east": lng, "west": lng}
    configurado_por INTEGER REFERENCES usuarios(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zonas de despliegue para cada equipo
CREATE TABLE zonas_despliegue (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    zona_azul JSONB NOT NULL,
    zona_roja JSONB NOT NULL,
    configurado_por INTEGER REFERENCES usuarios(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- UNIDADES Y COMPOSICIÓN MILITAR
-- =============================================

-- Tipos de unidades militares
CREATE TABLE tipos_unidades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'infanteria', 'blindado', 'artilleria', etc.
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

-- Unidades con composición detallada
CREATE TABLE unidades (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    sidc VARCHAR(20), -- Symbol Identification Code (MilSymbol)
    nivel_jerarquico INTEGER, -- 1=soldado, 2=escuadra, 3=sección, etc.
    personal_total INTEGER,
    vehiculos_total INTEGER,
    frente_metros INTEGER, -- espacio que ocupa en el frente
    profundidad_metros INTEGER, -- profundidad que ocupa
    autonomia_horas INTEGER,
    municion_basica INTEGER,
    caracteristicas_json JSONB,
    activo BOOLEAN DEFAULT true
);

-- Subniveles/composición interna de unidades
CREATE TABLE subniveles_unidad (
    id SERIAL PRIMARY KEY,
    unidad_padre_id INTEGER REFERENCES unidades(id),
    unidad_hija_id INTEGER REFERENCES unidades(id),
    cantidad INTEGER NOT NULL,
    rol_tactico VARCHAR(50)
);

-- =============================================
-- MOVIMIENTO Y VELOCIDADES
-- =============================================

-- Velocidades de movimiento por tipo de unidad
CREATE TABLE velocidades_movimiento (
    id SERIAL PRIMARY KEY,
    tipo_unidad VARCHAR(50) NOT NULL,
    velocidad_carretera INTEGER, -- km/h
    velocidad_campo_traviesa INTEGER, -- km/h
    velocidad_terreno_dificil INTEGER, -- km/h
    factor_terreno FLOAT DEFAULT 1.0,
    consumo_combustible FLOAT, -- litros/km
    autonomia_maxima INTEGER -- km
);

-- Factores de terreno que afectan movimiento
CREATE TABLE factores_terreno (
    id SERIAL PRIMARY KEY,
    tipo_terreno VARCHAR(50) NOT NULL,
    factor_infanteria FLOAT DEFAULT 1.0,
    factor_blindado FLOAT DEFAULT 1.0,
    factor_ruedas FLOAT DEFAULT 1.0,
    factor_artilleria FLOAT DEFAULT 1.0,
    descripcion TEXT
);

-- =============================================
-- ELEMENTOS EN EL MAPA
-- =============================================

-- Elementos desplegados en el mapa
CREATE TABLE elementos_mapa (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    unidad_id INTEGER REFERENCES unidades(id),
    equipo VARCHAR(10) CHECK (equipo IN ('azul', 'rojo')),
    posicion_lat DECIMAL(10, 8) NOT NULL,
    posicion_lng DECIMAL(11, 8) NOT NULL,
    orientacion INTEGER DEFAULT 0, -- grados 0-359
    estado VARCHAR(20) DEFAULT 'operativo' CHECK (estado IN ('operativo', 'dañado', 'destruido')),
    municion_actual INTEGER,
    combustible_actual FLOAT,
    personal_actual INTEGER,
    fecha_despliegue TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historial de movimientos
CREATE TABLE movimientos_elementos (
    id SERIAL PRIMARY KEY,
    elemento_id INTEGER REFERENCES elementos_mapa(id),
    posicion_origen_lat DECIMAL(10, 8),
    posicion_origen_lng DECIMAL(11, 8),
    posicion_destino_lat DECIMAL(10, 8),
    posicion_destino_lng DECIMAL(11, 8),
    distancia_km FLOAT,
    tiempo_movimiento INTEGER, -- minutos
    combustible_consumido FLOAT,
    turno INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- NIEBLA DE GUERRA Y VISIBILIDAD
-- =============================================

-- Capacidades de visión por tipo de elemento
CREATE TABLE capacidades_vision (
    id SERIAL PRIMARY KEY,
    tipo_unidad VARCHAR(50) NOT NULL,
    alcance_visual_metros INTEGER DEFAULT 5000,
    alcance_optico_metros INTEGER,
    alcance_termal_metros INTEGER,
    alcance_radar_metros INTEGER,
    factores_climaticos JSONB, -- afectación por clima
    factores_terreno JSONB -- afectación por terreno
);

-- Detecciones registradas
CREATE TABLE detecciones (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    elemento_detector_id INTEGER REFERENCES elementos_mapa(id),
    elemento_detectado_id INTEGER REFERENCES elementos_mapa(id),
    distancia_metros INTEGER,
    claridad FLOAT, -- 0.0 a 1.0
    tipo_deteccion VARCHAR(20) CHECK (tipo_deteccion IN ('visual', 'optico', 'termal', 'radar')),
    turno INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- COMBATE Y BAJAS
-- =============================================

-- Eventos de combate
CREATE TABLE eventos_combate (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    elemento_atacante_id INTEGER REFERENCES elementos_mapa(id),
    elemento_objetivo_id INTEGER REFERENCES elementos_mapa(id),
    tipo_ataque VARCHAR(30),
    distancia_metros INTEGER,
    municion_empleada INTEGER,
    daño_causado INTEGER,
    resultado VARCHAR(20), -- 'impacto', 'miss', 'destruido', etc.
    turno INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bajas y pérdidas
CREATE TABLE bajas (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    elemento_id INTEGER REFERENCES elementos_mapa(id),
    tipo_baja VARCHAR(20) CHECK (tipo_baja IN ('personal', 'vehiculo', 'destruccion_total')),
    cantidad INTEGER,
    causa VARCHAR(50),
    turno INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ESTADÍSTICAS Y ANÁLISIS
-- =============================================

-- Estadísticas generales de partida
CREATE TABLE estadisticas_partida (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id) UNIQUE,
    ordenes_impartidas INTEGER DEFAULT 0,
    km_recorridos FLOAT DEFAULT 0,
    bajas_propias INTEGER DEFAULT 0,
    bajas_enemigo INTEGER DEFAULT 0,
    detecciones_enemigos INTEGER DEFAULT 0,
    tiempo_partida INTEGER, -- minutos
    datos_json JSONB, -- estadísticas detalladas
    generado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acciones detalladas para análisis
CREATE TABLE acciones_detalladas (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo_accion VARCHAR(50) NOT NULL,
    datos_accion JSONB NOT NULL,
    turno INTEGER,
    fase VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rendimiento por jugador
CREATE TABLE rendimiento_jugadores (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    ordenes_efectivas INTEGER DEFAULT 0,
    eficiencia_movimiento FLOAT DEFAULT 0,
    detecciones_realizadas INTEGER DEFAULT 0,
    supervivencia_elementos FLOAT DEFAULT 0,
    puntuacion_total FLOAT DEFAULT 0,
    datos_detallados JSONB
);

-- =============================================
-- CONFIGURACIONES DEL SISTEMA
-- =============================================

-- Configuraciones globales
CREATE TABLE configuraciones_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    descripcion TEXT,
    modificado_por INTEGER REFERENCES usuarios(id),
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ÍNDICES PARA RENDIMIENTO
-- =============================================

-- Índices para consultas frecuentes
CREATE INDEX idx_partidas_estado ON partidas(estado);
CREATE INDEX idx_participantes_partida ON participantes_partida(partida_id, equipo);
CREATE INDEX idx_elementos_mapa_partida ON elementos_mapa(partida_id, equipo);
CREATE INDEX idx_elementos_mapa_posicion ON elementos_mapa(posicion_lat, posicion_lng);
CREATE INDEX idx_movimientos_elemento ON movimientos_elementos(elemento_id, turno);
CREATE INDEX idx_detecciones_partida ON detecciones(partida_id, turno);
CREATE INDEX idx_acciones_partida_turno ON acciones_detalladas(partida_id, turno);

-- =============================================
-- DATOS INICIALES DE CONFIGURACIÓN
-- =============================================

-- Insertar tipos de unidades básicas
INSERT INTO tipos_unidades (codigo, nombre, categoria) VALUES
('INF_ESC', 'Escuadra de Infantería', 'infanteria'),
('INF_SEC', 'Sección de Infantería', 'infanteria'),
('TANK_SEC', 'Sección de Tanques', 'blindado'),
('ART_BAT', 'Batería de Artillería', 'artilleria'),
('REC_ESC', 'Escuadra de Reconocimiento', 'reconocimiento');

-- Insertar velocidades de movimiento típicas
INSERT INTO velocidades_movimiento (tipo_unidad, velocidad_carretera, velocidad_campo_traviesa, velocidad_terreno_dificil) VALUES
('infanteria', 6, 4, 2),
('blindado_ruedas', 80, 40, 20),
('blindado_orugas', 60, 35, 15),
('artilleria_remolcada', 50, 25, 10),
('artilleria_autopropulsada', 55, 30, 15);

-- Insertar capacidades de visión básicas
INSERT INTO capacidades_vision (tipo_unidad, alcance_visual_metros, alcance_optico_metros) VALUES
('infanteria', 3000, 8000),
('blindado', 4000, 12000),
('reconocimiento', 6000, 15000),
('artilleria', 2000, 10000);

-- Insertar factores de terreno
INSERT INTO factores_terreno (tipo_terreno, factor_infanteria, factor_blindado, factor_ruedas) VALUES
('urbano', 0.6, 0.4, 0.3),
('bosque', 0.8, 0.3, 0.2),
('montaña', 0.7, 0.2, 0.1),
('llanura', 1.0, 1.0, 1.0),
('pantano', 0.4, 0.1, 0.05);

-- Configuraciones iniciales del sistema
INSERT INTO configuraciones_sistema (clave, valor, descripcion) VALUES
('niebla_guerra_activa', 'true', 'Activar niebla de guerra por defecto'),
('turno_duracion_defecto', '60', 'Duración de turno por defecto en minutos'),
('equivalencia_tiempo_defecto', '1.0', 'Factor de equivalencia tiempo real'),
('distancia_deteccion_defecto', '5000', 'Distancia de detección por defecto en metros');

COMMENT ON DATABASE maira_4_0 IS 'MAIRA 4.0 - Sistema de Entrenamiento Militar Argentino';
COMMENT ON TABLE partidas IS 'Ejercicios militares configurados';
COMMENT ON TABLE elementos_mapa IS 'Elementos militares desplegados en el terreno';
COMMENT ON TABLE detecciones IS 'Registro de detecciones para niebla de guerra';
COMMENT ON TABLE estadisticas_partida IS 'Estadísticas completas de rendimiento';
