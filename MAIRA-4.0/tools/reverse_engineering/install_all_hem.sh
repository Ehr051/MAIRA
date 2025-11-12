#!/bin/bash
# Script para instalar todas las HEM de BV8

HEM_DIR="/Users/mac/Downloads/Batalla Virtual 8 2019/2 HEM"

echo "🎯 Instalando Herramientas de Estado Mayor (HEM) de BV8"
echo "=========================================================="
echo ""

# Ya instaladas:
# ✅ Estimación de Bajas de Combate - Clave: 100C-170D-1E04-1A05-0263-1861-5306-0B68
# ⏳ Planeamiento Logístico - Clave: 1406-0816-070C-1D06-0A7D-0CC3-0E0C-0F1D

# Pendientes:
echo "📋 HEM pendientes de instalar:"
echo ""

echo "3️⃣  Planeamiento de Ingenieros"
cat "$HEM_DIR/Planeamiento de Ingenieros/Clave de Instalación.txt"
echo "   Archivo: Planeamiento de Ingenieros 8 rev 7.01.003.exe"
echo ""

echo "4️⃣  Estimación de Fallas"
cat "$HEM_DIR/Estimación de Fallas/Clave de Instalación.txt"
echo "   Archivo: Estimación de Fallas 8 rev 7.01.003.exe"
echo ""

echo "5️⃣  Estudio del Terreno"
cat "$HEM_DIR/Estudio del Terreno/Clave de Instalación.txt"
echo "   Archivo: Estudio del Terreno 8 rev 7.01.005.exe"
echo ""

echo "6️⃣  Dibujo Militar (opcional)"
cat "$HEM_DIR/Dibujo Militar/Clave de Instalación.txt"
echo "   Archivo: Dibujo Militar 8 rev 7.01.003.exe"
echo ""

echo "=========================================================="
echo "Para instalar cada una, ejecuta:"
echo "cd '$HEM_DIR/<nombre_HEM>' && wine '<exe_file>' &"
echo ""
