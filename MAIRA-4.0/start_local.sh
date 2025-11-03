#!/bin/bash
# Script de inicio para servidor local MAIRA 4.0
# Usa serverhttps.py con certificado autofirmado para HTTPS

cd "$(dirname "$0")"

echo "🚀 Iniciando MAIRA 4.0 - Servidor Local"
echo "========================================"
echo ""
echo "📂 Directorio: $(pwd)"
echo "🐍 Python: $(python3 --version)"
echo ""

# Verificar que Server/ existe
if [ ! -d "Server" ]; then
    echo "❌ Error: Directorio Server/ no encontrado"
    exit 1
fi

cd Server

# Verificar que serverhttps.py existe
if [ ! -f "serverhttps.py" ]; then
    echo "❌ Error: serverhttps.py no encontrado"
    exit 1
fi

echo "✅ Archivos encontrados"
echo ""
echo "🔧 Verificando dependencias Python..."

# Verificar e instalar dependencias Python si es necesario
python3 -c "import flask" 2>/dev/null || {
    echo "⚠️  Flask no encontrado, instalando..."
    pip3 install flask flask-socketio flask-cors pymysql python-dotenv bcrypt requests
}

echo "✅ Dependencias Python OK"
echo ""
echo "🌐 Iniciando servidor HTTPS..."
echo "   URL: https://localhost:5001"
echo "   URL alternativa: https://127.0.0.1:5001"
echo ""
echo "⚠️  NOTA: El navegador mostrará advertencia de certificado autofirmado"
echo "         Esto es normal para desarrollo local. Acepta la advertencia."
echo ""
echo "💡 Para detener el servidor: Ctrl+C"
echo ""
echo "========================================"
echo ""

# Iniciar servidor
python3 serverhttps.py

# Si falla, mostrar mensaje útil
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error iniciando el servidor"
    echo ""
    echo "💡 Posibles soluciones:"
    echo "   1. Verifica que MySQL esté corriendo"
    echo "   2. Verifica archivo .env con credenciales DB"
    echo "   3. Instala dependencias: pip3 install -r requirements.txt"
    echo ""
fi
