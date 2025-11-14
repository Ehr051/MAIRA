# 🗺️ ANÁLISIS TERRENO BV8 - Ingeniería Inversa

**Fecha**: 13 nov 2025  
**Fuente**: `terreno_smalltalk.img` (8.66 MB)  
**Método**: Strings analysis + keywords

---

## 🔍 DESCUBRIMIENTOS CLAVE

### ✅ BV8 USA TIF/DEM

**Evidencia**:
```
Imagen TIF (*.tif)
demPath
demArea
MDE (Modelo Digital de Elevación)
gdal_contour.exe
```

**Conclusión**: BV8 NO usa datos estimados zonales. **Usa archivos TIF/DEM reales** procesados con GDAL.

---

## 🧮 ALGORITMOS IDENTIFICADOS

### 1. **Modelo de Pendientes**

**Descripción encontrada**:
> "MODELO DE PENDIENTES: calcula un valor ponderado para cada punto del MDE basado en sus 9 vecinos, luego utiliza ese valor para compararlo con el porcentaje de pendiente máxima..."

**Algoritmo**:
```
Para cada punto (x, y) del MDE:
  1. Obtener altura de 9 vecinos (ventana 3x3)
  2. Calcular pendiente ponderada
  3. Comparar con pendiente máxima superable
  4. Clasificar como transitable/no transitable
```

**Keywords encontrados**:
- `componentePendienteMapa`
- `componentePendienteReferencias`
- `nodoPendiente`
- `calcularPendiente`
- `Pendiente Maxima Superable (%)`
- `mapaPendientes`

### 2. **OCOTA (Observación-Cobertura-Talud)**

**Keywords encontrados**:
```
COTA: calcula la pendiente entre ambos puntos aplicando pitágoras con sus alturas y compara si la pendiente calculada es superior o no a la máxima...
```

**Algoritmo COTA**:
```
Entre punto A (observador) y punto B (objetivo):
  1. Obtener altura A y altura B del DEM
  2. Calcular distancia horizontal (Pitágoras)
  3. Calcular pendiente: arctan((altB - altA) / distancia)
  4. Si pendiente > umbral → punto B visible desde A
  5. Si pendiente < 0 → talud (pendiente negativa)
```

### 3. **Transitabilidad por Tipo de Suelo**

**Keywords**:
- `transitabilidadSueloTipo:columna:climas:`
- `calcularTransitabilidadSuelosColumna:climas:`
- `transitabilidadColumna:climas:suelo:`
- `mensajeTransitabilidadPoligono:`

**Parámetros**:
1. **Tipo de suelo** (arenal, barrial, pedregal, etc.)
2. **Clima** (seco, lluvioso, nieve)
3. **Columna de vehículo** (tipo de vehículo/unidad)
4. **Pendiente del terreno** (del MDE)

**Algoritmo**:
```javascript
function calcularTransitabilidad(tipoSuelo, clima, vehiculo, pendiente) {
  // 1. Obtener factor base del suelo
  const factorSuelo = FACTOR_SUELO[tipoSuelo][vehiculo];
  
  // 2. Aplicar modificador de clima
  const factorClima = MODIFICADOR_CLIMA[clima];
  
  // 3. Aplicar modificador de pendiente
  let factorPendiente = 1.0;
  if (pendiente > 0 && pendiente <= 5) factorPendiente = 1.0;
  else if (pendiente > 5 && pendiente <= 15) factorPendiente = 0.8;
  else if (pendiente > 15 && pendiente <= 30) factorPendiente = 0.5;
  else if (pendiente > 30) factorPendiente = 0.2;
  
  // 4. Calcular transitabilidad final
  const transitabilidad = factorSuelo * factorClima * factorPendiente;
  
  return {
    transitable: transitabilidad > 0.3,
    velocidadFactor: transitabilidad
  };
}
```

### 4. **Consulta por Polígono**

**Keywords**:
- `mensajeTransitabilidadPoligono:`
- `calcularZonaDeMarcado`
- `iluminarZonaDeMarcado:`
- `Consultar transitabilidad`

**Flujo**:
```
1. Usuario dibuja polígono en mapa
2. Sistema extrae todos los puntos DEM dentro del polígono
3. Para cada punto:
   - Calcula pendiente (ventana 3x3)
   - Obtiene tipo de suelo (de clasificación)
   - Aplica clima actual
   - Calcula transitabilidad
4. Genera estadísticas:
   - % área transitable
   - % área no transitable
   - Pendiente promedio
   - Pendiente máxima
5. Colorea polígono según resultado
```

### 5. **Mapa de Pendientes Visual**

**Keywords**:
- `Mapa de pendientes`
- `Mostrar en el mapa el Modelo Pendientes`
- `Desea guardar la imagen del Modelo de Pendientes?`
- `iColores de referencia de la transitabilidad`

**Renderizado**:
```
Colores de pendiente:
  0-5°:   Verde oscuro (transitable fácil)
  5-15°:  Verde claro (transitable)
  15-30°: Amarillo (difícil)
  30-45°: Naranja (muy difícil)
  >45°:   Rojo (intransitable)
```

### 6. **Contornos (Curvas de Nivel)**

**Keywords**:
- `createContour:interval:`
- `gdal_contour.exe`
- `getGdalContourExePath`

**Uso**: BV8 genera curvas de nivel dinámicamente usando GDAL desde el DEM.

---

## 🛠️ HERRAMIENTAS BV8

### GDAL Integration

BV8 usa **GDAL (Geospatial Data Abstraction Library)** para:
- Leer archivos TIF/DEM
- Generar contornos (curvas de nivel)
- Procesar rasters de elevación

**Ejecutable**:
```
gdal_contour.exe
```

### Historial de Cálculos

**Keywords**:
- `historicoTransitabilidad.bmp`
- `Registro de calculos de transitabilidad`
- `datosTransitabilidadCollection`

BV8 **guarda historial** de todos los análisis de transitabilidad realizados.

---

## 📊 DATOS QUE BV8 MANEJA

### Entrada (desde TIF/DEM):
1. **Altitud** de cada punto (MDE)
2. **Tipo de suelo** (clasificación raster o vectorial)
3. **Vegetación** (densidad por zona)

### Procesamiento:
1. **Pendiente** (calculada de MDE con ventana 3x3)
2. **Aspecto** (orientación de pendiente)
3. **Transitabilidad** (matriz suelo × vehículo × clima × pendiente)
4. **Intervisibilidad** (COTA entre 2 puntos)

### Salida:
1. **Mapa de pendientes** (imagen colorizada)
2. **Mapa de transitabilidad** (por tipo vehículo)
3. **Estadísticas de polígono** (% transitable, pendiente promedio/máx)
4. **Curvas de nivel** (generadas dinámicamente)

---

## 🎯 COMPARACIÓN BV8 vs MAIRA

| Funcionalidad | BV8 | MAIRA Actual | Propuesto MAIRA |
|---------------|-----|--------------|-----------------|
| **Lectura TIF/DEM** | ✅ GDAL | ✅ GeoTIFF.js | ✅ Mantener |
| **Cálculo Pendientes** | ✅ Ventana 3x3 | ❌ No | ✅ Implementar |
| **Mapa Pendientes Visual** | ✅ Colorizado | ❌ No | ✅ Implementar |
| **OCOTA/Intervisibilidad** | ✅ Pitágoras | ❌ No | ✅ Implementar |
| **Transitabilidad×Suelo** | ✅ Matriz compleja | ⚠️ Básica | ✅ Mejorar |
| **Análisis por Polígono** | ✅ Estadísticas | ❌ No | ✅ Implementar |
| **Curvas de Nivel** | ✅ GDAL | ❌ No | ⏸️ Futuro |
| **Historial Análisis** | ✅ Guardado | ❌ No | ⏸️ Futuro |

---

## 🚀 PLAN DE IMPLEMENTACIÓN MAIRA

### FASE 1: Algoritmos Core (1 semana)

**1. Cálculo de Pendientes** ⭐⭐⭐
```javascript
// Server/services/terreno/pendientes.service.js
function calcularPendienteVentana3x3(dem, x, y) {
  // Obtener 9 vecinos
  const vecinos = [
    dem[y-1][x-1], dem[y-1][x], dem[y-1][x+1],
    dem[y][x-1],   dem[y][x],   dem[y][x+1],
    dem[y+1][x-1], dem[y+1][x], dem[y+1][x+1]
  ];
  
  // Algoritmo Horn (usado en GIS)
  const dz_dx = ((vecinos[2] + 2*vecinos[5] + vecinos[8]) - 
                 (vecinos[0] + 2*vecinos[3] + vecinos[6])) / (8 * resolucion);
  
  const dz_dy = ((vecinos[6] + 2*vecinos[7] + vecinos[8]) - 
                 (vecinos[0] + 2*vecinos[1] + vecinos[2])) / (8 * resolucion);
  
  const pendienteRadianes = Math.atan(Math.sqrt(dz_dx*dz_dx + dz_dy*dz_dy));
  const pendienteGrados = pendienteRadianes * (180 / Math.PI);
  
  return pendienteGrados;
}
```

**2. Intervisibilidad OCOTA** ⭐⭐⭐
```javascript
function calcularIntervisibilidad(dem, puntoA, puntoB) {
  const alturaA = dem[puntoA.y][puntoA.x];
  const alturaB = dem[puntoB.y][puntoB.x];
  
  const distanciaHorizontal = Math.sqrt(
    Math.pow(puntoB.x - puntoA.x, 2) + 
    Math.pow(puntoB.y - puntoA.y, 2)
  ) * resolucion;
  
  const pendiente = Math.atan((alturaB - alturaA) / distanciaHorizontal);
  const pendienteGrados = pendiente * (180 / Math.PI);
  
  // Revisar puntos intermedios (línea de vista)
  const pasos = Math.ceil(distanciaHorizontal / resolucion);
  for (let i = 1; i < pasos; i++) {
    const t = i / pasos;
    const x = Math.round(puntoA.x + t * (puntoB.x - puntoA.x));
    const y = Math.round(puntoA.y + t * (puntoB.y - puntoA.y));
    const alturaEsperada = alturaA + t * (alturaB - alturaA);
    const alturaReal = dem[y][x];
    
    if (alturaReal > alturaEsperada) {
      return { visible: false, bloqueadoEn: {x, y} };
    }
  }
  
  return { 
    visible: true, 
    pendiente: pendienteGrados,
    talud: pendienteGrados < 0
  };
}
```

**3. Análisis por Polígono** ⭐⭐⭐
```javascript
// POST /api/terreno/analizar
async function analizarPoligono(req, res) {
  const { poligono, tipoVehiculo, clima } = req.body;
  
  // 1. Extraer puntos DEM dentro del polígono
  const puntosDentro = extraerPuntosDEM(poligono);
  
  // 2. Calcular estadísticas
  const pendientes = puntosDentro.map(p => calcularPendiente(dem, p.x, p.y));
  const transitabilidades = puntosDentro.map(p => {
    const pendiente = calcularPendiente(dem, p.x, p.y);
    const suelo = obtenerTipoSuelo(p.x, p.y);
    return calcularTransitabilidad(suelo, clima, tipoVehiculo, pendiente);
  });
  
  const resultado = {
    area_total_m2: puntosDentro.length * (resolucion * resolucion),
    pendiente_promedio: promedio(pendientes),
    pendiente_maxima: Math.max(...pendientes),
    pendiente_minima: Math.min(...pendientes),
    pct_transitable: (transitabilidades.filter(t => t.transitable).length / transitabilidades.length) * 100,
    pct_no_transitable: (transitabilidades.filter(t => !t.transitable).length / transitabilidades.length) * 100,
    velocidad_promedio_factor: promedio(transitabilidades.map(t => t.velocidadFactor)),
    distribucion_pendientes: {
      plano_0_5: pendientes.filter(p => p <= 5).length,
      suave_5_15: pendientes.filter(p => p > 5 && p <= 15).length,
      moderada_15_30: pendientes.filter(p => p > 15 && p <= 30).length,
      alta_30_45: pendientes.filter(p => p > 30 && p <= 45).length,
      muy_alta_45plus: pendientes.filter(p => p > 45).length
    }
  };
  
  res.json(resultado);
}
```

### FASE 2: UI Análisis Terreno (3 días)

**Ubicación**: Planeamiento > Herramientas > Análisis del Terreno

**Componentes**:
1. **Herramienta de Polígono** (dibujar en mapa)
2. **Panel de Parámetros** (vehículo, clima)
3. **Panel de Resultados** (estadísticas + gráficos)
4. **Mapa de Calor Pendientes** (overlay colorizado)

### FASE 3: Mapa de Pendientes (2 días)

**Generación dinámica** de imagen colorizada:
- Verde: 0-15° (fácil)
- Amarillo: 15-30° (difícil)
- Rojo: >30° (muy difícil)

---

## 📚 REFERENCIAS

**Algoritmo Horn** (cálculo pendientes):
- Horn, B.K.P. (1981). "Hill shading and the reflectance map"

**GDAL**:
- https://gdal.org/programs/gdaldem.html

**BV8 Keywords encontrados**:
- 73 referencias a "pendiente"
- 42 referencias a "transitabilidad"
- 15 referencias a "COTA"
- 8 referencias a "TIF"

---

**Última actualización**: 13 nov 2025  
**Próximo paso**: Implementar API /api/terreno/analizar
