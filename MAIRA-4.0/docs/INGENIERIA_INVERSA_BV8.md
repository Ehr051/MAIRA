# PLAN DE INGENIERÍA INVERSA BV8
**Fecha**: 2025-11-12  
**Objetivo**: Extraer algoritmos, dotaciones y fórmulas de los ejecutables BV8  
**Duración estimada**: 1-2 semanas  
**Método seleccionado**: Opción C - Ingeniería Inversa de Ejecutables

---

## 🎯 OBJETIVOS ESPECÍFICOS

### Datos a Extraer
1. **Dotaciones Iniciales**:
   - Agua (litros) por persona/día
   - Víveres (raciones) por persona/día
   - Munición inicial por rol (tirador_fal: X cartuchos, ametrallador_mag: Y cartuchos)
   - Combustible por tipo de vehículo (TAM: X litros diesel, M113: Y litros nafta)

2. **Algoritmos de Bajas**:
   - Fórmula de cálculo según: arma atacante, alcance, protección objetivo, moral
   - Factores de eficiencia de combate
   - Probabilidad de baja vs herido vs ileso

3. **Algoritmos de Fallas**:
   - MTBF (Mean Time Between Failures) por vehículo/equipo
   - Tiempo de reparación según tipo de daño
   - Probabilidad de falla según: kilómetros recorridos, terreno, clima

4. **Consumos**:
   - Agua: litros/persona/día según clima
   - Víveres: raciones/persona/día
   - Munición: cartuchos/combate según intensidad
   - Combustible: litros/km por tipo de vehículo

5. **Mapeo Símbolos**:
   - 596 iconos .ico → códigos SIDC APP-6
   - SimboloId → IconoPath → equivalente SIDC

---

## 🛠️ HERRAMIENTAS REQUERIDAS

### 1. Ghidra (RECOMENDADO)
**Versión**: 11.x o superior  
**Sitio**: https://ghidra-sre.org/  
**Funciones**:
- Decompilación de binarios Windows (PE32)
- Análisis de flujo de código
- Búsqueda de strings y constantes
- Exportación de pseudocódigo a C

**Instalación**:
```bash
# macOS (requiere Java 17+)
brew install --cask ghidra
# o descargar desde https://ghidra-sre.org/
```

**Configuración para BV8**:
- Processor: x86 (32-bit PE)
- Compiler: Visual C++ o Borland C++ (BV8 probablemente)
- Análisis automático: Activar todas las opciones

### 2. radare2
**Versión**: 5.x  
**Sitio**: https://rada.re/  
**Funciones**:
- Análisis binario rápido
- Extracción de strings
- Desensamblado interactivo

**Instalación**:
```bash
brew install radare2
```

**Uso básico**:
```bash
# Abrir ejecutable
r2 "/path/to/Administración de CCOO.exe"

# Análisis automático
> aaa

# Listar funciones
> afl

# Buscar strings
> izz~dotacion
> izz~agua
> izz~municion
```

### 3. UPX (desempaquetador)
**Versión**: 4.x  
**Función**: Descomprimir ejecutables empaquetados

**Instalación**:
```bash
brew install upx
```

**Uso**:
```bash
# Verificar si está empaquetado
upx -t "/path/to/app.exe"

# Desempaquetar
upx -d "/path/to/app.exe" -o app_unpacked.exe
```

### 4. strings (Unix built-in)
**Ya disponible** en macOS

**Uso avanzado**:
```bash
# Extraer strings con contexto
strings -a -t x "app.exe" | grep -C 5 "dotacion"

# Buscar números (posibles dotaciones)
strings -a "app.exe" | grep -E "^[0-9]+$"

# Buscar patrones de munición
strings -a "app.exe" | grep -iE "(cart|proyec|cohete|granada)"
```

### 5. Cutter (GUI para radare2)
**Opcional**: Interfaz gráfica si prefieres visual

**Instalación**:
```bash
brew install --cask cutter
```

---

## 📋 PLAN DE ATAQUE (2 SEMANAS)

### SEMANA 1: Preparación y Análisis Inicial

#### Día 1-2: Setup y Reconocimiento
**Tareas**:
1. ✅ Instalar Ghidra + radare2 + upx
2. ✅ Identificar ejecutables objetivo:
   ```
   Administración de CCOO/8/Administración de CCOO.exe
   Planeamiento Logístico/8/Planeamiento Logístico.exe
   Estimación de Bajas/8/Estimación de Bajas.exe
   Estimación de Fallas/8/Estimación de Fallas.exe
   ```
3. ✅ Verificar empaquetado con `upx -t`
4. ✅ Extraer strings de todos los ejecutables
5. ✅ Buscar patrones: "dotacion", "agua", "viveres", "municion", "combustible"

**Entregable**: `bv8_extraido/reconocimiento_binarios.json`

#### Día 3-4: Análisis de CCOO.exe
**Objetivo**: Extraer dotaciones iniciales

**Pasos**:
1. Abrir en Ghidra: `Administración de CCOO.exe`
2. Ejecutar análisis automático (Auto Analysis)
3. Buscar funciones relacionadas:
   - `inicializarDotacion`
   - `crearPersonaBatalla`
   - `asignarMunicion`
   - `calcularDotacionInicial`
4. Examinar sección `.data` para tablas hardcodeadas
5. Buscar referencias a "agua", "viveres", "claseV"
6. Decompilación de funciones críticas a C
7. Documentar pseudocódigo

**Entregable**: `docs/ALGORITMOS_BV8.md` (sección Dotaciones)

#### Día 5: Análisis de Planeamiento Logístico.exe
**Objetivo**: Extraer consumos y capacidades de cajones

**Pasos**:
1. Abrir en Ghidra
2. Buscar funciones:
   - `calcularConsumo`
   - `obtenerCapacidadCajon`
   - `calcularReabastecimiento`
3. Correlacionar con `configuracionCajones.xml`
4. Extraer fórmulas de consumo por día/combate
5. Documentar tasas de consumo

**Entregable**: `bv8_extraido/logistica/consumos_extraidos.json`

---

### SEMANA 2: Algoritmos de Combate y Validación

#### Día 6-7: Análisis de Estimación de Bajas.exe
**Objetivo**: Extraer algoritmo completo de cálculo de bajas

**Pasos**:
1. Abrir en Ghidra
2. Buscar funciones:
   - `calcularBajas`
   - `aplicarFactorEficiencia`
   - `calcularProbabilidadImpacto`
   - `determinarEstadoBaja` (muerto/herido/ileso)
3. Identificar factores:
   - Tipo de arma (FAL, MAG, TAM, mortero, etc.)
   - Alcance al objetivo
   - Protección (descubierto/atrincherado/blindado)
   - Moral/eficiencia combate
4. Extraer tablas de probabilidad
5. Documentar algoritmo completo

**Entregable**: `docs/ALGORITMOS_BV8.md` (sección Bajas de Combate)

#### Día 8: Análisis de Estimación de Fallas.exe
**Objetivo**: Extraer MTBF y algoritmo de fallas

**Pasos**:
1. Abrir en Ghidra
2. Buscar funciones:
   - `calcularProbabilidadFalla`
   - `obtenerMTBF`
   - `calcularTiempoReparacion`
3. Identificar variables:
   - Kilómetros recorridos
   - Tipo de terreno
   - Condiciones climáticas
   - Estado de mantenimiento
4. Extraer MTBF por vehículo:
   - TAM: X km
   - M113: Y km
   - VLEGA: Z km
5. Documentar tiempos de reparación

**Entregable**: `bv8_extraido/fallas/mtbf_extraidos.json`

#### Día 9-10: Validación y Documentación
**Objetivo**: Validar todos los datos extraídos

**Pasos**:
1. Crear casos de prueba en BV8:
   - Unidad conocida → verificar dotaciones iniciales
   - Combate conocido → verificar bajas calculadas
   - Movimiento conocido → verificar fallas generadas
2. Comparar resultados BV8 vs algoritmos extraídos
3. Ajustar pseudocódigo si hay diferencias
4. Documentar nivel de confianza (95%, 98%, 100%)
5. Crear ejemplos de uso

**Entregables**:
- `docs/VALIDACION_ALGORITMOS_BV8.md`
- `bv8_extraido/casos_prueba_validacion.json`

---

## 📁 ESTRUCTURA DE SALIDA

```
bv8_extraido/
├── README.md (índice de todo lo extraído)
├── metadata.json (versión BV8, fecha extracción, método)
│
├── ccoo/
│   ├── dotaciones_extraidas.json (agua, viveres, munición por rol)
│   ├── composiciones_unidades.json (estructura de equipos/grupos/secciones)
│   └── simbolos_mapeo.json (596 iconos → SIDC)
│
├── logistica/
│   ├── consumos_extraidos.json (tasas de consumo por tipo)
│   ├── capacidades_cajones.json (volúmenes y tipos)
│   └── algoritmo_reabastecimiento.json (fórmulas de cálculo)
│
├── bajas/
│   ├── algoritmo_completo.json (fórmula paso a paso)
│   ├── factores_eficiencia.json (moral, instrucción, liderazgo)
│   ├── probabilidades_arma.json (por tipo de arma y alcance)
│   └── tablas_proteccion.json (descubierto/atrincherado/blindado)
│
├── fallas/
│   ├── mtbf_vehiculos.json (MTBF por tipo)
│   ├── tiempos_reparacion.json (por tipo de falla)
│   └── factores_terreno.json (modificadores según terreno/clima)
│
├── terreno/
│   ├── factores_movilidad.json (velocidades por terreno)
│   ├── modificadores_combate.json (bonus/penalty según terreno)
│   └── clasificacion_terreno.json (bosque/urbano/desierto/etc)
│
└── validacion/
    ├── casos_prueba.json (inputs conocidos → outputs esperados)
    ├── resultados_validacion.json (comparación BV8 vs extraído)
    └── nivel_confianza.json (% de precisión por módulo)
```

---

## 🔍 TÉCNICAS DE INGENIERÍA INVERSA

### 1. Análisis de Strings
**Objetivo**: Encontrar nombres de variables/funciones

```bash
# Extraer todos los strings
strings -a "Administración de CCOO.exe" > ccoo_strings.txt

# Buscar dotaciones
grep -iE "(dotacion|agua|viveres|municion|combustible)" ccoo_strings.txt

# Buscar números sospechosos (posibles dotaciones)
grep -E "^(3|100|400|620)$" ccoo_strings.txt
```

**Patrones a buscar**:
- Nombres de variables: `dotacionAgua`, `municionInicial`, `consumoPorDia`
- Mensajes de error: "Dotación insuficiente", "Sin munición"
- Nombres de funciones: `calcular`, `inicializar`, `asignar`

### 2. Análisis de Sección .data
**Objetivo**: Encontrar tablas hardcodeadas

**En Ghidra**:
1. Window → Defined Data
2. Buscar arrays de enteros/floats
3. Examinar valores cerca de strings conocidos
4. Ejemplo:
   ```c
   // Si encontramos string "agua" en offset 0x12340
   // Buscar int32 cerca (0x12300-0x12400)
   // Valor 3 → posible dotación 3 litros/día
   ```

### 3. Análisis de Funciones
**Objetivo**: Entender algoritmos

**Pasos en Ghidra**:
1. Window → Symbol Table
2. Filtrar por nombres sospechosos
3. Doble clic → ver decompilación
4. Analizar flujo:
   ```c
   // Ejemplo de función encontrada
   int calcularDotacionMunicion(PersonaBatalla* persona) {
       if (persona->armamento == FAL) {
           return 5 * 20; // 5 cargadores × 20 cartuchos = 100
       } else if (persona->armamento == MAG) {
           return 2 * 200; // 2 cintas × 200 cartuchos = 400
       }
       // ...
   }
   ```

### 4. Cross-References (Xrefs)
**Objetivo**: Seguir llamadas a funciones

**En Ghidra**:
1. Clic derecho en función → References → Show References to
2. Ver dónde se llama
3. Rastrear parámetros pasados
4. Ejemplo:
   ```
   inicializarPersona() → llama a → asignarDotacion()
   Ver qué valores pasa como parámetros
   ```

### 5. Búsqueda de Constantes
**Objetivo**: Encontrar valores mágicos

**Valores sospechosos**:
- `3` → posible agua/víveres por día
- `100` → posible munición FAL
- `400` → posible munición MAG
- `620` → posible combustible TAM
- `360` → posible combustible M113

**En radare2**:
```bash
# Buscar constante 100 en código
> /v 100

# Buscar constante 3.0 (float)
> /v 3.0
```

---

## ⚠️ DESAFÍOS ESPERADOS

### 1. Smalltalk Runtime
**Problema**: BV8 usa Dolphin Smalltalk, no C/C++ nativo  
**Impacto**: Código puede estar en bytecode Smalltalk, no x86

**Soluciones**:
- Buscar en archivos `.img` (Smalltalk image files)
- Usar herramientas específicas de Smalltalk:
  - Dolphin Smalltalk Community Edition (para inspeccionar .img)
  - FileOut de clases Smalltalk
- Buscar tablas de datos en sección .data (independiente del lenguaje)

### 2. Ofuscación/Empaquetado
**Problema**: Ejecutables pueden estar comprimidos con UPX u otros

**Solución**:
```bash
# Intentar desempaquetar
upx -d "app.exe" -o app_unpacked.exe

# Si falla, buscar empaquetadores alternativos
file "app.exe" | grep -i "packed"
```

### 3. Código Compilado vs Interpretado
**Problema**: Parte del código puede estar en scripts externos

**Solución**:
- Buscar archivos `.st` (Smalltalk source)
- Buscar archivos `.dol` (Dolphin Smalltalk)
- Examinar carpeta `Recursos/` por scripts

### 4. Valores Dinámicos vs Hardcoded
**Problema**: Algunas dotaciones pueden calcularse en runtime

**Solución**:
- Ejecutar BV8 bajo debugger (Wine + winedbg)
- Capturar valores en memoria
- Comparar con análisis estático

---

## 📊 MÉTRICAS DE ÉXITO

### Nivel de Confianza Objetivo
- **Dotaciones iniciales**: 100% (valores exactos)
- **Consumos**: 95% (fórmulas pueden tener casos edge)
- **Algoritmo bajas**: 90% (puede haber factores aleatorios)
- **MTBF**: 95% (valores estadísticos)

### Criterios de Validación
1. ✅ 10 casos de prueba comparados con BV8
2. ✅ Diferencia < 5% en resultados numéricos
3. ✅ Documentación completa de algoritmos
4. ✅ Pseudocódigo comprobado funcionalmente

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### Ahora (Día 1)
1. ✅ Instalar Ghidra
2. ✅ Instalar radare2 y upx
3. ✅ Crear estructura de carpetas `bv8_extraido/`
4. ✅ Extraer strings de CCOO.exe
5. ✅ Buscar patrones de dotación en strings

### Mañana (Día 2)
1. Abrir CCOO.exe en Ghidra
2. Ejecutar Auto Analysis
3. Examinar Symbol Table
4. Buscar funciones relacionadas con dotación
5. Documentar primeros hallazgos

---

## 📝 PLANTILLA DE DOCUMENTACIÓN

```markdown
# Función: calcularDotacionMunicion

## Ubicación
- **Archivo**: Administración de CCOO.exe
- **Offset**: 0x00401234
- **Nombre en binario**: ?calcDotMun@PersonaBatalla@@QAEHXZ

## Pseudocódigo (Decompilado)
```c
int PersonaBatalla::calcularDotacionMunicion() {
    switch (this->armamento) {
        case ARMA_FAL:
            return 5 * 20; // 5 cargadores × 20 cartuchos
        case ARMA_MAG:
            return 2 * 200; // 2 cintas × 200 cartuchos
        case ARMA_M16:
            return 10 * 30; // 10 cargadores × 30 cartuchos
        default:
            return 0;
    }
}
```

## Validación
- **Caso 1**: Tirador FAL → BV8: 100 | Extraído: 100 ✅
- **Caso 2**: Ametrallador MAG → BV8: 400 | Extraído: 400 ✅
- **Nivel de confianza**: 100%

## Notas
- Valores hardcoded, no calculados dinámicamente
- Coincide exactamente con corrección del usuario (20 rounds/mag)
```

---

**Estado Actual**: Preparando herramientas  
**Próximo hito**: Instalación de Ghidra y primer análisis de CCOO.exe  
**Fecha objetivo**: Completar SEMANA 1 para 19/11/2025
