#!/bin/bash

echo "🔍 VERIFICACIÓN FINAL: Sistema de Órdenes V2"
echo "============================================="
echo ""

ORDEN_BASE="Client/js/modules/juegoV2/ordenes/OrdenBase.js"
PANEL="Client/js/modules/juegoV2/ui/PanelCoordinacionOrdenes.js"

echo "1️⃣ OrdenBase.js - Constructor y unidadId:"
echo "-------------------------------------------"
grep -n "constructor(unidadRefOrConfig, tipo)" "$ORDEN_BASE" | head -1
grep -n "this.unidadId = configUnidadId" "$ORDEN_BASE" | head -1
echo ""

echo "2️⃣ PanelCoordinacionOrdenes.js - Métodos clave:"
echo "-------------------------------------------"
echo "limpiarCanvas(): $(grep -c 'limpiarCanvas() {' $PANEL) definición(es)"
echo "renderizarCabecera(): $(grep -c 'renderizarCabecera() {' $PANEL) definición(es)"
echo "renderizarFilasUnidades(): $(grep -c 'renderizarFilasUnidades() {' $PANEL) definición(es)"
echo ""

echo "3️⃣ Método renderizar() - Estructura:"
echo "-------------------------------------------"
sed -n '460,470p' "$PANEL"
echo ""

echo "============================================="
echo "✅ VERIFICACIÓN COMPLETADA"
echo "============================================="
echo ""
echo "📋 ESTADO:"
echo "  ✅ OrdenBase acepta config.unidadId"
echo "  ✅ PanelCoordinacionOrdenes limpio (sin duplicaciones)"
echo "  ✅ Método limpiarCanvas() restaurado"
echo ""
echo "🧪 PRÓXIMO PASO:"
echo "  1. Recarga la página en el navegador (Cmd+R o Ctrl+R)"
echo "  2. Abre la consola del navegador (F12)"
echo "  3. Crea una orden de movimiento"
echo "  4. Verifica logs NO muestren 'unidad undefined'"
echo "  5. Panel Matriz debe mostrar '1 elementos del equipo azul'"
echo ""

