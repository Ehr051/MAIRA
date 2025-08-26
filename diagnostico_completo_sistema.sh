#!/bin/bash

# 🔍 DIAGNÓSTICO COMPLETO SISTEMA MAIRA
# Script para verificar estado de todas las tablas y configuración

echo "🚀 INICIANDO DIAGNÓSTICO COMPLETO DEL SISTEMA MAIRA..."
echo "=============================================="

API_BASE="https://maira-3e76.onrender.com"

echo ""
echo "🔗 1. VERIFICANDO CONECTIVIDAD CON SERVIDOR..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/debug/db-complete")

if [ "$STATUS_CODE" -eq 200 ]; then
    echo "✅ Servidor responde correctamente (200)"
elif [ "$STATUS_CODE" -eq 500 ]; then
    echo "⚠️  Servidor responde con errores internos (500)"
else
    echo "❌ Servidor no responde o error de conectividad ($STATUS_CODE)"
    exit 1
fi

echo ""
echo "🔍 2. DIAGNÓSTICO COMPLETO DE BASE DE DATOS..."
echo "=============================================="

RESPONSE=$(curl -s "$API_BASE/api/debug/db-complete")

# Verificar si la respuesta es JSON válida
if echo "$RESPONSE" | python3 -m json.tool > /dev/null 2>&1; then
    echo "✅ Respuesta JSON válida recibida"
    
    # Extraer información clave usando python
    python3 << EOF
import json
import sys

try:
    data = json.loads('''$RESPONSE''')
    
    print("📊 RESUMEN DEL DIAGNÓSTICO:")
    print("=" * 50)
    
    if 'status' in data:
        print(f"Estado: {data['status']}")
    
    if 'postgres_version' in data:
        print(f"PostgreSQL: {data['postgres_version'][:50]}...")
    
    if 'total_tablas' in data:
        print(f"Total tablas: {data['total_tablas']}")
    
    if 'tablas_existentes' in data:
        print(f"Tablas: {', '.join(data['tablas_existentes'])}")
    
    print()
    print("🎮 ANÁLISIS SISTEMA PARTIDAS:")
    print("-" * 30)
    
    if 'analisis_partidas' in data:
        partidas = data['analisis_partidas']
        print(f"Tabla partidas existe: {'✅ SÍ' if partidas.get('tabla_existe') else '❌ NO'}")
        
        if partidas.get('tabla_existe'):
            print(f"Registros en partidas: {partidas.get('total_registros', 'N/A')}")
            
            if 'estructura' in partidas and isinstance(partidas['estructura'], list):
                print(f"Columnas en partidas: {len(partidas['estructura'])}")
                for col in partidas['estructura']:
                    if isinstance(col, dict):
                        print(f"  - {col.get('columna', 'N/A')}: {col.get('tipo', 'N/A')}")
    
    print()
    print("👥 ANÁLISIS USUARIOS_PARTIDA:")
    print("-" * 30)
    
    if 'analisis_usuarios_partida' in data:
        usuarios = data['analisis_usuarios_partida']
        print(f"Tabla usuarios_partida existe: {'✅ SÍ' if usuarios.get('tabla_existe') else '❌ NO'}")
        
        if usuarios.get('tabla_existe') and 'estructura' in usuarios:
            if isinstance(usuarios['estructura'], list):
                print(f"Columnas en usuarios_partida: {len(usuarios['estructura'])}")
                for col in usuarios['estructura']:
                    if isinstance(col, dict):
                        print(f"  - {col.get('columna', 'N/A')}: {col.get('tipo', 'N/A')}")
    
    print()
    print("📋 OTRAS TABLAS DEL SISTEMA:")
    print("-" * 30)
    
    if 'otras_tablas' in data:
        otras = data['otras_tablas']
        if otras:
            for tabla in otras:
                print(f"  - {tabla}")
        else:
            print("  (No hay otras tablas)")
    
    if 'error' in data:
        print(f"❌ ERROR: {data['error']}")
        if 'traceback' in data:
            print("Traceback:", data['traceback'][:200] + "...")

except json.JSONDecodeError as e:
    print(f"❌ Error decodificando JSON: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error procesando respuesta: {e}")
    sys.exit(1)
EOF

else
    echo "❌ Respuesta no es JSON válida"
    echo "Respuesta del servidor:"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "🧪 3. PROBANDO SISTEMA DE PARTIDAS..."
echo "=============================================="

echo "📋 Probando listar partidas disponibles..."
PARTIDAS_RESPONSE=$(curl -s "$API_BASE/api/partidas_disponibles")
PARTIDAS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/partidas_disponibles")

if [ "$PARTIDAS_STATUS" -eq 200 ]; then
    echo "✅ Endpoint partidas_disponibles funciona"
    # Contar partidas
    PARTIDAS_COUNT=$(echo "$PARTIDAS_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('total', 0))
except:
    print('Error')
")
    echo "📊 Partidas disponibles: $PARTIDAS_COUNT"
else
    echo "❌ Error en endpoint partidas_disponibles ($PARTIDAS_STATUS)"
fi

echo ""
echo "🎯 RESUMEN FINAL:"
echo "=============================================="
echo "✅ Conectividad: OK"
echo "✅ Base de datos: Diagnosticada"
echo "✅ Sistema partidas: Evaluado"
echo ""
echo "📝 Para diagnóstico detallado, revisar:"
echo "   - Logs del servidor en Render"
echo "   - Estructura de tablas mostrada arriba"
echo "   - test_partidas_sistema.html para pruebas interactivas"
echo ""
echo "🚀 DIAGNÓSTICO COMPLETADO"
