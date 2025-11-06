#!/bin/bash

# Script para crear juegodeguerraV2.html basado en planeamiento_integrado.html
# con las 4 modificaciones específicas requeridas

ARCHIVO_BASE="/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/planeamiento_integrado.html"
ARCHIVO_DESTINO="/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/juegodeguerraV2.html"

echo "================================================================"
echo "🎮 CREANDO juegodeguerraV2.html"
echo "================================================================"

# Verificar que existe el archivo base
if [ ! -f "$ARCHIVO_BASE" ]; then
    echo "❌ Error: No se encontró $ARCHIVO_BASE"
    exit 1
fi

# Copiar archivo base
echo "📋 Copiando archivo base..."
cp "$ARCHIVO_BASE" "$ARCHIVO_DESTINO"

# Cambio 1: Cambiar título (línea 4)
echo "✏️  Cambio 1: Actualizando título..."
sed -i.bak '4s|.*|  <title>M.A.I.R.A. - Juego de Guerra V2</title>|' "$ARCHIVO_DESTINO"

# Cambio 2: Insertar scripts V2 ANTES de </head> (línea 510)
echo "✏️  Cambio 2: Insertando scripts V2 antes de </head>..."
# Crear archivo temporal con los scripts V2
cat > /tmp/scripts_v2.txt << 'SCRIPTS_V2'

  <!-- ================================================================
       🎮 SISTEMA DE ÓRDENES V2 - JUEGO DE GUERRA
       ================================================================ -->

  <!-- Utils V2 -->
  <script src="js/modules/juegoV2/utils/Pathfinding.js"></script>

  <!-- Órdenes Base V2 -->
  <script src="js/modules/juegoV2/ordenes/OrdenBase.js"></script>
  <script src="js/modules/juegoV2/ordenes/OrdenMovimiento.js"></script>
  <script src="js/modules/juegoV2/ordenes/OrdenAtaque.js"></script>

  <!-- Sistema de Cola V2 -->
  <script src="js/modules/juegoV2/ordenes/OrdenesQueueV2.js"></script>

  <!-- UI V2 -->
  <script src="js/modules/juegoV2/ui/PanelCoordinacionOrdenes.js"></script>

  <!-- Core V2 - Gestor y Inicializador -->
  <script src="js/modules/juegoV2/core/GestorOrdenesV2.js"></script>
  <script src="js/modules/juegoV2/core/InicializadorJuegoV2.js"></script>

  <!-- Script de verificación V2 -->
  <script>
    console.log('🎮 JUEGO DE GUERRA V2 - Verificando componentes...');
    console.log({
      OrdenBase: typeof OrdenBase,
      OrdenMovimiento: typeof OrdenMovimiento,
      OrdenAtaque: typeof OrdenAtaque,
      Pathfinding: typeof Pathfinding,
      OrdenesQueueV2: typeof OrdenesQueueV2,
      PanelCoordinacionOrdenes: typeof PanelCoordinacionOrdenes,
      GestorOrdenesV2: typeof GestorOrdenesV2,
      InicializadorJuegoV2: typeof InicializadorJuegoV2
    });
  </script>
SCRIPTS_V2

# Insertar en línea 509 (antes de </head>)
sed -i '509r /tmp/scripts_v2.txt' "$ARCHIVO_DESTINO"

# Cambio 3: Cambiar clase del body (buscar línea con 'maira-planeamiento')
echo "✏️  Cambio 3: Cambiando clase del body..."
sed -i 's|<body class="maira-planeamiento">|<body class="maira-juego-guerra-v2">|' "$ARCHIVO_DESTINO"

# Cambio 4: Agregar script de inicialización ANTES de </body>
echo "✏️  Cambio 4: Agregando script de inicialización V2..."
# Crear archivo temporal con el script de inicialización
cat > /tmp/init_v2.txt << 'INIT_V2'

<!-- ================================================================
     🎮 INICIALIZACIÓN JUEGO DE GUERRA V2
     ================================================================ -->
<script>
document.addEventListener('DOMContentLoaded', async function() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎮 JUEGO DE GUERRA V2 - INICIANDO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Esperar a que el mapa esté listo
    let intentos = 0;
    const maxIntentos = 50;

    const esperarMapa = setInterval(() => {
        intentos++;

        if (window.map && window.map._loaded) {
            clearInterval(esperarMapa);
            console.log('✅ Mapa listo, inicializando V2...');

            // Inicializar V2
            if (typeof InicializadorJuegoV2 !== 'undefined') {
                const inicializadorV2 = new InicializadorJuegoV2();
                window.inicializadorV2 = inicializadorV2;

                inicializadorV2.inicializar().then(exito => {
                    if (exito) {
                        console.log('✅✅✅ JUEGO V2 INICIALIZADO CORRECTAMENTE ✅✅✅');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    } else {
                        console.error('❌ Error inicializando Juego V2');
                    }
                }).catch(error => {
                    console.error('❌ Error crítico en inicialización V2:', error);
                });
            } else {
                console.error('❌ InicializadorJuegoV2 no está definido');
            }

        } else if (intentos >= maxIntentos) {
            clearInterval(esperarMapa);
            console.error('❌ Timeout esperando al mapa');
        } else {
            console.log(\`⏳ Esperando mapa... (\${intentos}/\${maxIntentos})\`);
        }
    }, 200);
});
</script>
INIT_V2

# Buscar línea con </body> e insertar antes
LINEA_BODY=$(grep -n "</body>" "$ARCHIVO_DESTINO" | head -1 | cut -d: -f1)
LINEA_INSERT=$((LINEA_BODY - 1))
sed -i "${LINEA_INSERT}r /tmp/init_v2.txt" "$ARCHIVO_DESTINO"

# Limpiar archivos temporales
rm /tmp/scripts_v2.txt /tmp/init_v2.txt

# Contar líneas del archivo resultante
TOTAL_LINEAS=$(wc -l < "$ARCHIVO_DESTINO")

echo ""
echo "================================================================"
echo "✅ ARCHIVO CREADO EXITOSAMENTE"
echo "================================================================"
echo "📄 Archivo: $ARCHIVO_DESTINO"
echo "📊 Total de líneas: $TOTAL_LINEAS"
echo ""
echo "Cambios aplicados:"
echo "  ✅ Cambio 1: Título actualizado a 'M.A.I.R.A. - Juego de Guerra V2'"
echo "  ✅ Cambio 2: Scripts V2 insertados antes de </head>"
echo "  ✅ Cambio 3: Clase del body cambiada a 'maira-juego-guerra-v2'"
echo "  ✅ Cambio 4: Script de inicialización V2 agregado antes de </body>"
echo ""
echo "================================================================"
