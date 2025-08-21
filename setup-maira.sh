#!/bin/bash

# Script de configuración automática para MAIRA
# =============================================

echo "🚀 MAIRA - Configuración Automática"
echo "===================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "package.json no encontrado. Ejecuta este script desde el directorio raíz de MAIRA."
    exit 1
fi

log_info "Directorio del proyecto: $(pwd)"

# 1. Verificar Node.js
log_info "Verificando Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    log_success "Node.js instalado: $NODE_VERSION"
else
    log_error "Node.js no está instalado. Instálalo desde: https://nodejs.org/"
    exit 1
fi

# 2. Verificar npm
log_info "Verificando npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    log_success "npm instalado: $NPM_VERSION"
else
    log_error "npm no está disponible"
    exit 1
fi

# 3. Instalar dependencias de Node.js
log_info "Instalando dependencias de Node.js..."
if npm install; then
    log_success "Dependencias de Node.js instaladas correctamente"
else
    log_error "Error instalando dependencias de Node.js"
    exit 1
fi

# 4. Verificar Python
log_info "Verificando Python..."
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python instalado: $PYTHON_VERSION"
elif command -v python >/dev/null 2>&1; then
    PYTHON_VERSION=$(python --version)
    log_success "Python instalado: $PYTHON_VERSION"
else
    log_error "Python no está instalado. Instálalo desde: https://python.org/"
    exit 1
fi

# 5. Instalar dependencias de Python
log_info "Instalando dependencias de Python..."
if [ -f "requirements.txt" ]; then
    if python3 -m pip install -r requirements.txt; then
        log_success "Dependencias de Python instaladas correctamente"
    else
        log_warning "Algunas dependencias de Python pueden haber fallado"
    fi
else
    log_warning "requirements.txt no encontrado"
fi

# 6. Verificar archivos críticos
log_info "Verificando archivos críticos del proyecto..."

critical_files=(
    "Client/js/mini_tiles_loader.js"
    "Client/js/dependency-manager.js"
    "scripts/servidor_demo.py"
    "scripts/crear_mini_tiles.py"
    "mini_tiles_github/master_mini_tiles_index.json"
)

all_files_ok=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "Encontrado: $file"
    else
        log_error "Faltante: $file"
        all_files_ok=false
    fi
done

if [ "$all_files_ok" = false ]; then
    log_error "Algunos archivos críticos están faltando"
    exit 1
fi

# 7. Verificar estructura de directorios
log_info "Verificando estructura de directorios..."

required_dirs=(
    "Client"
    "Server"
    "scripts"
    "dev-tools"
    "tools"
    "static"
    "docs"
    "mini_tiles_github"
    "indices"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        log_success "Directorio OK: $dir"
    else
        log_warning "Directorio faltante: $dir"
    fi
done

# 8. Generar configuración de desarrollo
log_info "Generando configuración de desarrollo..."

cat > .env.development << EOF
# Configuración de desarrollo para MAIRA
# =====================================

# Servidor de desarrollo
DEV_PORT=8000
DEV_HOST=localhost

# URLs de desarrollo
MINI_TILES_LOCAL_URL=./mini_tiles_github/
MINI_TILES_CDN_URL=https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/mini_tiles_github/
MINI_TILES_GITHUB_URL=https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/

# Configuración de CORS
CORS_ENABLED=true
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
DEBUG_MODE=true

# Base de datos (si se usa)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=maira_dev
# DB_USER=maira_user
# DB_PASS=maira_pass
EOF

log_success "Archivo .env.development generado"

# 9. Crear scripts de desarrollo
log_info "Creando scripts de desarrollo..."

# Script para servidor de desarrollo
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando servidor de desarrollo MAIRA..."
cd "$(dirname "$0")"
python3 scripts/servidor_demo.py
EOF

chmod +x start-dev.sh
log_success "Script start-dev.sh creado"

# Script para tests
cat > run-tests.sh << 'EOF'
#!/bin/bash
echo "🧪 Ejecutando tests de MAIRA..."
cd "$(dirname "$0")"

echo "📄 Test de verificación de rutas..."
python3 scripts/verificar_rutas.py

echo "🔗 Test de URLs..."
python3 scripts/test_urls.py

echo "✅ Tests completados"
EOF

chmod +x run-tests.sh
log_success "Script run-tests.sh creado"

# 10. Mostrar información final
echo ""
echo "🎉 ¡CONFIGURACIÓN COMPLETADA!"
echo "============================"
echo ""
log_info "Comandos disponibles:"
echo "  🚀 Servidor desarrollo:   ./start-dev.sh"
echo "  🧪 Ejecutar tests:        ./run-tests.sh"
echo "  📦 Instalar deps:         npm install"
echo "  🐍 Deps Python:           pip install -r requirements.txt"
echo ""
log_info "URLs de desarrollo:"
echo "  🌍 Servidor demo:         http://localhost:8000/static/demo_minitiles.html"
echo "  🔧 Template manager:      http://localhost:8000/static/template-dependency-manager.html"
echo "  📄 Docs:                  ./docs/"
echo ""
log_info "Estrategia de dependencias:"
echo "  📦 CDN primario (siempre funciona)"
echo "  💾 node_modules como fallback local"
echo "  🚀 Dependency Manager automático"
echo ""
log_success "MAIRA está listo para desarrollo! 🎯"
