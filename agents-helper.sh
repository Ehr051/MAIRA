#!/bin/bash

# 🚀 MAIRA Agents Workflow Script

echo "🤖 MAIRA Agents Helper"
echo "====================="

case "$1" in
    "debug-js")
        echo "🔍 Usando @javascript-pro para debugging JavaScript"
        echo "Analizando: gestionBatalla.js, herramientasP.js, Socket.IO events"
        echo "Focus: Event loops, memory leaks, async patterns"
        ;;
    "debug-python")
        echo "🐍 Usando @python-pro para debugging Python"
        echo "Analizando: serverhttps.py, conexiones BD, Socket.IO server"
        echo "Focus: Flask routes, PyMySQL connections, async handling"
        ;;
    "security")
        echo "🔐 Usando @security-auditor para auditoría de seguridad"
        echo "Analizando: Autenticación, CORS, validación input, SQL injection"
        echo "Focus: OWASP compliance, secure headers, data validation"
        ;;
    "performance")
        echo "⚡ Usando @performance-engineer para optimización"
        echo "Analizando: Queries BD, Socket.IO performance, frontend caching"
        echo "Focus: Bottlenecks, memory usage, network optimization"
        ;;
    "testing")
        echo "🧪 Usando @test-automator para crear tests"
        echo "Creando: Unit tests, integration tests, e2e tests"
        echo "Focus: Jest/Pytest, mock strategies, CI/CD integration"
        ;;
    "review")
        echo "👁️ Usando @code-reviewer para revisión de código"
        echo "Revisando: Code quality, best practices, maintainability"
        echo "Focus: Clean code, SOLID principles, documentation"
        ;;
    *)
        echo "Uso: $0 {debug-js|debug-python|security|performance|testing|review}"
        echo ""
        echo "Agentes disponibles:"
        echo "  debug-js     - JavaScript debugging y optimización"
        echo "  debug-python - Python debugging y arquitectura"
        echo "  security     - Auditoría de seguridad"
        echo "  performance  - Optimización de rendimiento"
        echo "  testing      - Automatización de tests"
        echo "  review       - Revisión de código"
        ;;
esac
