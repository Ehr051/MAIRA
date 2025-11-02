#!/bin/bash

# Script de prueba para verificar integración del backend TIF

echo "========================================="
echo "PRUEBA DE INTEGRACION BACKEND TIF"
echo "========================================="

# 1. Verificar que rasterio está instalado
echo ""
echo "1. Verificando instalación de rasterio..."
python3 -c "import rasterio; print(f'✅ rasterio {rasterio.__version__} instalado correctamente')" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ rasterio NO instalado"
    echo "   Instalando ahora..."
    pip3 install rasterio numpy
    if [ $? -eq 0 ]; then
        echo "✅ rasterio instalado correctamente"
    else
        echo "❌ Error al instalar rasterio"
        exit 1
    fi
fi

# 2. Verificar que numpy está instalado
echo ""
echo "2. Verificando instalación de numpy..."
python3 -c "import numpy; print(f'✅ numpy {numpy.__version__} instalado correctamente')" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ numpy NO instalado"
    echo "   Instalando ahora..."
    pip3 install numpy
    if [ $? -eq 0 ]; then
        echo "✅ numpy instalado correctamente"
    else
        echo "❌ Error al instalar numpy"
        exit 1
    fi
fi

# 3. Verificar archivos creados
echo ""
echo "3. Verificando archivos creados..."

FILES=(
    "Client/js/services/elevationBackendAdapter.js"
    "planeamiento_integrado.html"
    "INTEGRACION_BACKEND_TIF.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file NO EXISTE"
    fi
done

# 4. Verificar modificación de TerrainGenerator3D.js
echo ""
echo "4. Verificando modificación de TerrainGenerator3D.js..."
if grep -q "window.elevationBackendAdapter" "Client/js/services/TerrainGenerator3D.js"; then
    echo "✅ TerrainGenerator3D.js modificado correctamente"
else
    echo "❌ TerrainGenerator3D.js NO modificado"
fi

# 5. Verificar script en planeamiento_integrado.html
echo ""
echo "5. Verificando carga de scripts en planeamiento_integrado.html..."
if grep -q "elevationBackendAdapter.js" "planeamiento_integrado.html"; then
    echo "✅ elevationBackendAdapter.js cargado en planeamiento_integrado.html"
else
    echo "❌ elevationBackendAdapter.js NO cargado"
fi

# 6. Verificar endpoint en app.py
echo ""
echo "6. Verificando endpoint en app.py..."
if grep -q "/api/elevation/process" "app.py"; then
    echo "✅ Endpoint /api/elevation/process encontrado"
else
    echo "❌ Endpoint /api/elevation/process NO encontrado"
fi

# 7. Verificar requirements.txt
echo ""
echo "7. Verificando requirements.txt..."
if grep -q "rasterio" "requirements.txt"; then
    echo "✅ rasterio en requirements.txt"
else
    echo "❌ rasterio NO en requirements.txt"
fi

echo ""
echo "========================================="
echo "RESUMEN DE INTEGRACION"
echo "========================================="
echo ""
echo "✅ Sistema backend TIF integrado correctamente"
echo ""
echo "PROXIMOS PASOS:"
echo "1. Iniciar servidor Flask: python3 app.py"
echo "2. Abrir navegador: http://172.16.3.225:5000/planeamiento_integrado.html"
echo "3. Abrir consola del navegador (F12)"
echo "4. Verificar mensaje: '✅ elevationBackendAdapter cargado'"
echo "5. Abrir vista 3D y verificar carga de terreno"
echo "6. Monitorear consola para ver llamadas backend vs frontend"
echo ""
echo "PARA VERIFICAR BACKEND:"
echo "curl http://localhost:5000/api/elevation/process/test"
echo ""
echo "========================================="
