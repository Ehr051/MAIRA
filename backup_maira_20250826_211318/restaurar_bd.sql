-- SCRIPT RESTAURACIÓN BASE DE DATOS MAIRA
-- Ejecutar en PostgreSQL para recrear estructura mínima

-- Tabla usuarios (básica)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(200) UNIQUE,
    password_hash VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Tabla partidas (estructura original corregida)
CREATE TABLE IF NOT EXISTS partidas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    configuracion TEXT DEFAULT '{}',
    estado VARCHAR(20) DEFAULT 'esperando',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jugadores_actuales INTEGER DEFAULT 0
);

-- Tabla usuarios_partida (relación jugadores-partidas)
CREATE TABLE IF NOT EXISTS usuarios_partida (
    id SERIAL PRIMARY KEY,
    partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    equipo VARCHAR(20) DEFAULT 'sin_equipo',
    listo BOOLEAN DEFAULT false,
    esCreador BOOLEAN DEFAULT false,
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(partida_id, usuario_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_partidas_estado ON partidas(estado);
CREATE INDEX IF NOT EXISTS idx_partidas_fecha ON partidas(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_usuarios_partida_partida ON usuarios_partida(partida_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_partida_usuario ON usuarios_partida(usuario_id);

-- Datos de ejemplo básicos
INSERT INTO usuarios (username, email) VALUES 
('admin', 'admin@maira.local'),
('jugador1', 'jugador1@test.local'),
('jugador2', 'jugador2@test.local')
ON CONFLICT (username) DO NOTHING;

INSERT INTO partidas (codigo, configuracion, estado, jugadores_actuales) VALUES 
('DEMO01', '{"nombre": "Partida Demo", "descripcion": "Partida de demostración"}', 'esperando', 0),
('TEST01', '{"nombre": "Partida Test", "descripcion": "Partida de prueba"}', 'esperando', 0)
ON CONFLICT (codigo) DO NOTHING;
