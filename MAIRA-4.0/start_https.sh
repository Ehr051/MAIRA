#!/bin/bash
# Script para iniciar servidor MAIRA con HTTPS
# Debe ejecutarse desde el directorio raíz de MAIRA-4.0

# Ir al directorio raíz del proyecto (donde está el script)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Iniciando MAIRA 4.0 - Servidor HTTPS Local"
echo "=============================================="
echo ""
echo "📂 Directorio raíz: $(pwd)"
echo ""

# Verificar certificados SSL en directorio raíz
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️  Certificados SSL no encontrados en ./ssl/"
    echo ""
    echo "Generando certificados autofirmados..."
    mkdir -p ssl

    openssl req -x509 -newkey rsa:4096 -nodes \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -days 365 \
        -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=MAIRA/CN=localhost" 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✅ Certificados SSL generados exitosamente"
    else
        echo "❌ Error generando certificados"
        exit 1
    fi
fi

echo "✅ Certificados SSL verificados: ./ssl/"
echo ""

# Verificar que Server/ existe
if [ ! -d "Server" ]; then
    echo "❌ Error: Directorio Server/ no encontrado"
    echo "   Asegúrate de ejecutar desde: MAIRA-4.0/"
    exit 1
fi

# Verificar que serverhttps.py existe
if [ ! -f "Server/serverhttps.py" ]; then
    echo "❌ Error: Server/serverhttps.py no encontrado"
    exit 1
fi

echo "✅ Archivo Server/serverhttps.py encontrado"
echo ""

# Verificar MySQL
echo "🔍 Verificando MySQL..."
if pgrep -x mysqld > /dev/null 2>&1; then
    echo "✅ MySQL está corriendo"
else
    echo "⚠️  MySQL no está corriendo"
    echo "   Iniciando MySQL..."
    brew services start mysql 2>/dev/null || mysql.server start 2>/dev/null || echo "   ⚠️  No se pudo iniciar MySQL automáticamente. Inícialo manualmente."
fi
echo ""

echo "🔧 Verificando dependencias Python..."

# Verificar e instalar dependencias Python si es necesario
python3 -c "import flask" 2>/dev/null || {
    echo "⚠️  Flask no encontrado, instalando..."
    pip3 install flask flask-socketio flask-cors pymysql python-dotenv bcrypt requests gevent
}

echo "✅ Dependencias Python OK"
echo ""

# Verificar y lanzar Cloudflare Tunnel si está disponible
echo "🌐 Verificando Cloudflare Tunnel..."
if command -v cloudflared &> /dev/null; then
    echo "✅ cloudflared encontrado"
    echo "   Iniciando túnel Cloudflare en segundo plano..."

    # Matar cualquier instancia previa de cloudflared
    pkill -f cloudflared 2>/dev/null

    # Iniciar tunnel en background y guardar PID
    cloudflared tunnel --url https://localhost:5001 > cloudflare_tunnel.log 2>&1 &
    TUNNEL_PID=$!

    # Esperar a que el tunnel inicie y obtener la URL
    echo "   Esperando URL pública del túnel..."
    sleep 3

    # Extraer URL del log
    TUNNEL_URL=$(grep -o 'https://.*\.trycloudflare.com' cloudflare_tunnel.log 2>/dev/null | head -n 1)

    if [ -n "$TUNNEL_URL" ]; then
        echo "✅ Túnel Cloudflare activo!"
        echo "   🌍 URL PÚBLICA: $TUNNEL_URL"
        echo "   📋 PID del túnel: $TUNNEL_PID"
        echo ""
        echo "   ⚠️  IMPORTANTE: Esta URL es temporal y cambia en cada ejecución"
        echo "   💡 Compártela con otros jugadores para pruebas multi-jugador"
        echo ""
    else
        echo "⚠️  No se pudo obtener URL del túnel (aún puede estar iniciando)"
        echo "   Revisa cloudflare_tunnel.log para ver la URL"
    fi
else
    echo "⚠️  cloudflared no encontrado"
    echo "   El servidor solo será accesible en la red local"
    echo "   Para instalar: brew install cloudflare/cloudflare/cloudflared"
    echo "   (Usuarios en la misma red pueden acceder sin el túnel)"
fi
echo ""

echo "🔐 Iniciando servidor HTTPS con certificados SSL..."
echo "   🏠 URL Local: https://localhost:5001"
echo "   🏠 URL alternativa: https://127.0.0.1:5001"
echo ""
echo "⚠️  NOTA: El navegador mostrará advertencia de certificado autofirmado"
echo "         Esto es normal para desarrollo local. Acepta la advertencia."
echo ""
echo "💡 Para detener el servidor: Ctrl+C"
echo ""
echo "=============================================="
echo ""

# Función para cleanup al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    if [ -n "$TUNNEL_PID" ]; then
        echo "   Cerrando túnel Cloudflare (PID: $TUNNEL_PID)..."
        kill $TUNNEL_PID 2>/dev/null
        pkill -f cloudflared 2>/dev/null
    fi
    echo "✅ Servicios detenidos"
    exit 0
}

# Registrar cleanup para Ctrl+C
trap cleanup SIGINT SIGTERM

# Cambiar a directorio Server e iniciar con flag --https
cd Server
python3 serverhttps.py --https

# Si falla, mostrar mensaje útil
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error iniciando el servidor"
    echo ""
    echo "💡 Posibles soluciones:"
    echo "   1. Verifica que MySQL esté corriendo: brew services list"
    echo "   2. Verifica archivo .env con credenciales DB"
    echo "   3. Instala dependencias: pip3 install -r requirements.txt"
    echo "   4. Puerto 5001 ya en uso: lsof -i :5001"
    echo ""
fi
