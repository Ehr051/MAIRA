# Instrucciones para Crear juegodeguerraV2.html

## Situación Actual

Debido a limitaciones técnicas en el entorno de ejecución (las herramientas Unix estándar como `sed`, `awk`, `cp`, `chmod`, `python`, `node` no están disponibles), no pude crear el archivo `juegodeguerraV2.html` directamente.

He creado un script de shell (`crear_juegodeguerraV2.sh`) que aplicará automáticamente los 4 cambios requeridos.

## Solución: Ejecutar el Script

### Opción 1: Ejecutar el script desde la terminal (RECOMENDADO)

Abre una terminal y ejecuta:

```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE
bash crear_juegodeguerraV2.sh
```

El script:
1. Copiará `planeamiento_integrado.html` → `juegodeguerraV2.html`
2. Aplicará los 4 cambios específicos
3. Mostrará un reporte de éxito con el número de líneas

### Opción 2: Aplicar los cambios manualmente

Si el script no funciona, sigue estos pasos:

#### Paso 1: Copiar archivo base
```bash
cp /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/planeamiento_integrado.html \\
   /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/juegodeguerraV2.html
```

#### Paso 2: Editar con tu editor preferido

Abre `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/juegodeguerraV2.html` y aplica estos 4 cambios:

##### ✏️ CAMBIO 1: Título (línea 4)
**Cambiar:**
```html
  <title>Modo Planeamiento</title>
```

**Por:**
```html
  <title>M.A.I.R.A. - Juego de Guerra V2</title>
```

##### ✏️ CAMBIO 2: Scripts V2 (insertar ANTES de línea 510: `</head>`)

Insertar este bloque JUSTO ANTES de `</head>`:

```html

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
```

##### ✏️ CAMBIO 3: Clase del body (línea 512 aprox)
**Cambiar:**
```html
<body class="maira-planeamiento">
```

**Por:**
```html
<body class="maira-juego-guerra-v2">
```

##### ✏️ CAMBIO 4: Script de inicialización (insertar ANTES de línea 3378: `</body>`)

Insertar este bloque JUSTO ANTES de `</body>`:

```html

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
```

## Verificación

Una vez aplicados los cambios, verifica que:

1. ✅ El título es "M.A.I.R.A. - Juego de Guerra V2"
2. ✅ Los scripts V2 están cargados (busca el comentario "🎮 SISTEMA DE ÓRDENES V2")
3. ✅ El body tiene la clase "maira-juego-guerra-v2"
4. ✅ El script de inicialización V2 está presente (busca "🎮 INICIALIZACIÓN JUEGO DE GUERRA V2")

## Archivos Generados

- ✅ `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/crear_juegodeguerraV2.sh` - Script automatizado
- ✅ `/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/INSTRUCCIONES_juegodeguerraV2.md` - Este archivo

## Resumen de Cambios

| # | Ubicación | Cambio | Descripción |
|---|-----------|--------|-------------|
| 1 | Línea 4 | Título | "Modo Planeamiento" → "M.A.I.R.A. - Juego de Guerra V2" |
| 2 | Antes de `</head>` | Scripts V2 | Agregar 8 scripts + verificación de componentes V2 |
| 3 | Línea 512 | Clase body | "maira-planeamiento" → "maira-juego-guerra-v2" |
| 4 | Antes de `</body>` | Inicialización | Script que espera el mapa y arranca InicializadorJuegoV2 |

---

**Nota:** El archivo base `planeamiento_integrado.html` tiene 3378 líneas. El archivo resultante tendrá aproximadamente **3430 líneas** (añadimos ~52 líneas con los scripts V2 y la inicialización).
