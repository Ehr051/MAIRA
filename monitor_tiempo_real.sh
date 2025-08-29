#!/bin/bash
# Monitor simple para MAIRA en tiempo real
# Simula actividad y reporta el estado

echo "🚀 MONITOR MAIRA - TIEMPO REAL"
echo "==============================="
echo "🕒 Inicio: $(date)"
echo ""

# Función para verificar salud del sistema
check_health() {
    local timestamp=$(date "+%H:%M:%S")
    echo "[$timestamp] 🩺 Verificando salud del sistema..."
    
    # Test básico de conectividad
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" https://maira-3e76.onrender.com)
    if [ "$http_status" = "200" ]; then
        echo "[$timestamp] ✅ HTTP Status: $http_status - SERVICIO ACTIVO"
    else
        echo "[$timestamp] ❌ HTTP Status: $http_status - PROBLEMA DETECTADO"
    fi
    
    # Test endpoint de salud si existe
    local health_status=$(curl -s -o /dev/null -w "%{http_code}" https://maira-3e76.onrender.com/health 2>/dev/null)
    if [ "$health_status" = "200" ]; then
        echo "[$timestamp] ✅ Health Check: $health_status - BASE DE DATOS CONECTADA"
    else
        echo "[$timestamp] ⚠️ Health Check: $health_status - Endpoint no disponible o problema DB"
    fi
    
    echo ""
}

# Función para simular carga de usuario
simulate_user_activity() {
    local timestamp=$(date "+%H:%M:%S")
    echo "[$timestamp] 👤 Simulando actividad de usuario..."
    
    # Simular carga de página principal
    curl -s https://maira-3e76.onrender.com > /dev/null
    echo "[$timestamp] 📄 Página principal cargada"
    
    # Simular navegación a iniciar partida
    curl -s https://maira-3e76.onrender.com/iniciarpartida.html > /dev/null
    echo "[$timestamp] 🎮 Página iniciar partida cargada"
    
    echo ""
}

echo "🔄 Iniciando monitoreo continuo..."
echo "   - Verificación cada 30 segundos"
echo "   - Presiona Ctrl+C para detener"
echo ""

# Loop de monitoreo
while true; do
    check_health
    simulate_user_activity
    echo "⏱️ Esperando 30 segundos..."
    echo "----------------------------------------"
    sleep 30
done
