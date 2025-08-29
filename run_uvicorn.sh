#!/bin/bash
# run_uvicorn.sh - Script para ejecutar MAIRA con Uvicorn (Alto rendimiento)

echo "🚀 MAIRA - Servidor Uvicorn (Alto Rendimiento)"
echo "================================================"

# Verificar si Uvicorn está instalado
if ! command -v uvicorn &> /dev/null; then
    echo "❌ Uvicorn no está instalado. Instalando..."
    pip install uvicorn[standard] uvloop httptools
fi

echo "✅ Iniciando servidor con configuración optimizada:"
echo "   - Loop: uvloop (async nativo)"
echo "   - HTTP: httptools (C extensions)"
echo "   - Host: 0.0.0.0"
echo "   - Puerto: ${PORT:-5000}"
echo ""

# Ejecutar con configuración optimizada
uvicorn app:create_asgi_app \
    --factory \
    --host 0.0.0.0 \
    --port ${PORT:-5000} \
    --loop uvloop \
    --http httptools \
    --access-log \
    --no-use-colors \
    ${UVICORN_EXTRA_ARGS}
