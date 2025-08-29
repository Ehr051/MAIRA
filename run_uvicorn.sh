#!/bin/bash
# run_uvicorn.sh - Script para ejecutar MAIRA con Uvicorn (Alto rendimiento)

echo "🚀 MAIRA - Servidor Uvicorn (Alto Rendimiento)"
echo "================================================"

# Verificar si Uvicorn está instalado
if ! command -v uvicorn &> /dev/null; then
    echo "❌ Uvicorn no está instalado. Instalando..."
    pip install "uvicorn[standard]>=0.23.0,<1.0.0"
fi

# Detectar si uvloop y httptools están disponibles
LOOP_ARG=""
HTTP_ARG=""

if python -c "import uvloop" 2>/dev/null; then
    echo "✅ uvloop disponible - usando loop optimizado"
    LOOP_ARG="--loop uvloop"
else
    echo "⚠️ uvloop no disponible - usando loop estándar"
fi

if python -c "import httptools" 2>/dev/null; then
    echo "✅ httptools disponible - usando HTTP optimizado"
    HTTP_ARG="--http httptools"
else
    echo "⚠️ httptools no disponible - usando HTTP estándar"
fi

echo ""
echo "🔧 Configuración detectada:"
echo "   - Loop: ${LOOP_ARG:-asyncio (estándar)}"
echo "   - HTTP: ${HTTP_ARG:-h11 (estándar)}"
echo "   - Host: 0.0.0.0"
echo "   - Puerto: ${PORT:-5000}"
echo ""

# Ejecutar con configuración adaptativa
uvicorn app:create_asgi_app \
    --factory \
    --host 0.0.0.0 \
    --port ${PORT:-5000} \
    $LOOP_ARG \
    $HTTP_ARG \
    --access-log \
    --no-use-colors \
    ${UVICORN_EXTRA_ARGS}
