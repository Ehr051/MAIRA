#!/bin/bash
# Script para cambiar entre entornos de desarrollo y producción

case "$1" in
    "dev"|"desarrollo")
        echo "🏠 Configurando entorno de DESARROLLO..."
        if [ -f ".env.development" ]; then
            cp .env.development .env
            echo "✅ Copiado .env.development → .env"
        else
            echo "❌ No se encontró .env.development"
            exit 1
        fi
        echo "🗄️ Modo: Memoria (sin PostgreSQL)"
        echo "🐛 Debug: Activado"
        echo "🌐 Puerto: 5000"
        echo ""
        echo "Para iniciar: python app.py"
        ;;
    "prod"|"produccion")
        echo "🌐 Configurando entorno de PRODUCCIÓN..."
        echo "FLASK_ENV=production" > .env
        echo "FLASK_DEBUG=False" >> .env
        echo "USE_MEMORY_MODE=False" >> .env
        echo "PORT=10000" >> .env
        echo "SECRET_KEY=maira_production_cambiar_en_render" >> .env
        echo "✅ Configuración de producción aplicada"
        echo "🗄️ Modo: PostgreSQL (DATABASE_URL requerido)"
        echo "🐛 Debug: Desactivado"
        echo "🌐 Puerto: 10000"
        echo ""
        echo "⚠️  Asegúrate de configurar DATABASE_URL en Render"
        ;;
    *)
        echo "Uso: $0 [dev|prod]"
        echo ""
        echo "  dev, desarrollo  - Configurar para desarrollo local"
        echo "  prod, produccion - Configurar para producción"
        echo ""
        echo "Ejemplos:"
        echo "  $0 dev     # Desarrollo local con memoria"
        echo "  $0 prod    # Producción con PostgreSQL"
        exit 1
        ;;
esac
