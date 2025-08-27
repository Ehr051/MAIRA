#!/bin/bash

# 📥 BACKUP COMPLETO SISTEMA MAIRA ARREGLADO
# Script para generar copia de respaldo local completa

BACKUP_DIR="backup_maira_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🚀 INICIANDO BACKUP COMPLETO SISTEMA MAIRA..."
echo "=============================================="
echo "📂 Directorio backup: $BACKUP_DIR"
echo ""

# 1. Backup del código fuente
echo "📁 1. BACKUP CÓDIGO FUENTE..."
cp -r . "$BACKUP_DIR/codigo_fuente/"
echo "✅ Código fuente copiado"

# 2. Backup de la base de datos
echo ""
echo "🗄️  2. BACKUP BASE DE DATOS..."

API_BASE="https://maira-3e76.onrender.com"

# Estructura de todas las tablas
echo "   📋 Obteniendo estructura de tablas..."
curl -s "$API_BASE/api/debug/db-complete" > "$BACKUP_DIR/estructura_bd.json"

# Datos de partidas
echo "   🎮 Exportando datos partidas..."
curl -s "$API_BASE/api/partidas_disponibles" > "$BACKUP_DIR/partidas_data.json"

# 3. Crear script de restauración de BD
echo ""
echo "🔧 3. GENERANDO SCRIPTS RESTAURACIÓN..."

cat > "$BACKUP_DIR/restaurar_bd.sql" << 'EOF'
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
EOF

# 4. Crear docker-compose para BD local
cat > "$BACKUP_DIR/docker-compose.yml" << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:17
    container_name: maira_postgres_local
    environment:
      POSTGRES_DB: maira_db
      POSTGRES_USER: maira_user
      POSTGRES_PASSWORD: maira_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./restaurar_bd.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  adminer:
    image: adminer
    container_name: maira_adminer
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# 5. Variables de entorno para desarrollo local
cat > "$BACKUP_DIR/.env.local" << 'EOF'
# Variables de entorno para desarrollo local MAIRA
DATABASE_URL=postgresql://maira_user:maira_password@localhost:5432/maira_db
DB_HOST=localhost
DB_NAME=maira_db
DB_USER=maira_user
DB_PASSWORD=maira_password
DB_PORT=5432
FLASK_ENV=development
FLASK_DEBUG=true
SECRET_KEY=desarrollo-local-secret-key
EOF

# 6. Script de inicio rápido
cat > "$BACKUP_DIR/iniciar_local.sh" << 'EOF'
#!/bin/bash
echo "🚀 INICIANDO MAIRA LOCAL..."

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose"
    exit 1
fi

# Iniciar base de datos
echo "🗄️  Iniciando PostgreSQL..."
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
sleep 10

# Verificar conexión
if docker exec maira_postgres_local pg_isready -U maira_user; then
    echo "✅ PostgreSQL listo"
else
    echo "❌ Error conectando a PostgreSQL"
    exit 1
fi

# Mostrar información
echo ""
echo "🎯 SISTEMA LISTO:"
echo "   PostgreSQL: localhost:5432"
echo "   Usuario: maira_user"
echo "   Base de datos: maira_db"
echo "   Adminer: http://localhost:8080"
echo ""
echo "📝 Para iniciar la app:"
echo "   export $(cat .env.local | xargs)"
echo "   python app.py"
EOF

chmod +x "$BACKUP_DIR/iniciar_local.sh"

# 7. README del backup
cat > "$BACKUP_DIR/README.md" << 'EOF'
# 📥 BACKUP COMPLETO SISTEMA MAIRA

## 📁 Contenido del Backup

- `codigo_fuente/` - Todo el código fuente del proyecto
- `estructura_bd.json` - Estructura completa de la base de datos
- `partidas_data.json` - Datos actuales de partidas
- `restaurar_bd.sql` - Script SQL para recrear BD
- `docker-compose.yml` - BD PostgreSQL local con Docker
- `.env.local` - Variables de entorno para desarrollo
- `iniciar_local.sh` - Script inicio rápido

## 🚀 Restauración Rápida

### Opción 1: Con Docker (Recomendado)
```bash
# 1. Iniciar BD local
./iniciar_local.sh

# 2. Configurar variables
export $(cat .env.local | xargs)

# 3. Iniciar aplicación
cd codigo_fuente/
python app.py
```

### Opción 2: PostgreSQL Manual
```bash
# 1. Crear BD PostgreSQL
createdb maira_db

# 2. Restaurar estructura
psql -d maira_db -f restaurar_bd.sql

# 3. Configurar variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/maira_db"

# 4. Iniciar app
cd codigo_fuente/
python app.py
```

## 🔧 Estructura BD Simplificada

### Tablas Principales:
- `usuarios` - Usuarios del sistema
- `partidas` - Partidas de juego  
- `usuarios_partida` - Relación jugadores-partidas

### Columnas Críticas `partidas`:
- `id` - ID único
- `codigo` - Código público de partida (ej: ABC123)
- `configuracion` - JSON con config de partida
- `estado` - 'esperando', 'en_curso', 'finalizada'
- `jugadores_actuales` - Cantidad de jugadores unidos

## 💡 Lógica de Partidas

1. Usuario crea partida → estado 'esperando'
2. Otros usuarios se unen → `jugadores_actuales++`
3. Creador inicia → estado 'en_curso' 
4. Ya no se permite unirse más
5. Partida termina → estado 'finalizada'

**NO hay límite máximo predefinido de jugadores**
EOF

# 8. Información final
echo ""
echo "✅ BACKUP COMPLETADO"
echo "=============================================="
echo "📂 Directorio: $BACKUP_DIR"
echo "📋 Archivos creados:"
echo "   - codigo_fuente/ (código completo)"
echo "   - estructura_bd.json (estructura BD)"
echo "   - restaurar_bd.sql (script restauración)"
echo "   - docker-compose.yml (BD local)"
echo "   - .env.local (variables entorno)"
echo "   - iniciar_local.sh (inicio rápido)"
echo "   - README.md (documentación)"
echo ""
echo "🚀 Para restaurar: cd $BACKUP_DIR && ./iniciar_local.sh"
echo "📖 Más info: cat $BACKUP_DIR/README.md"
