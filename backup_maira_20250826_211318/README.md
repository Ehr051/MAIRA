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
