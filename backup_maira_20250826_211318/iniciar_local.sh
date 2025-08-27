#!/bin/bash
echo "🚀 INICIANDO MAIRA LOCAL..."

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está ejecutándose"
    exit 1
fi

# Iniciar base de datos
echo "🗄️  Iniciando PostgreSQL..."
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando PostgreSQL..."
sleep 10

# Verificar conexión
if docker exec maira_postgres_local pg_isready -U maira_user; then
    echo "✅ PostgreSQL listo"
else
    echo "❌ Error conectando a PostgreSQL"
    exit 1
fi

# Mostrar información
echo ""
echo "🎯 SISTEMA LISTO:"
echo "   PostgreSQL: localhost:5432"
echo "   Usuario: maira_user"
echo "   Base de datos: maira_db"
echo "   Adminer: http://localhost:8080"
echo ""
echo "📝 Para iniciar la app:"
echo "   export $(cat .env.local | xargs)"
echo "   python app.py"
