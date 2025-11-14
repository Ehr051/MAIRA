# PROGRESO INGENIERÍA INVERSA BV8 - DÍA 1
**Fecha**: 2025-11-12  
**Sprint**: SEMANA 1 - Día 1-2 (Preparación y Reconocimiento)  
**Estado**: ✅ Setup completado | 🔄 Análisis inicial en progreso

---

## ✅ COMPLETADO HOY

### 1. Instalación de Herramientas
- ✅ **UPX 5.0.2**: Desempaquetador de ejecutables
- ✅ **radare2 6.0.4**: Framework de análisis binario
- ✅ **Ghidra 11.2.1**: Decompilador NSA (requiere abrir manualmente)
- ✅ **OpenJDK 25 (Temurin)**: Runtime para Ghidra

### 2. Identificación de Ejecutables
Todos los ejecutables son **Dolphin Smalltalk 7** compilados, NO C/C++ nativos:

| HEM | Ejecutable | Tamaño | Strings |
|-----|------------|--------|---------|
| CCOO | HACCOO_7_01_004.exe | ~4MB | 47,047 |
| Logística | HPL_7_01_004.exe | ~4MB | 47,320 |
| Bajas | HEBC_7_01_004.exe | ~4MB | 45,113 |
| Fallas | HEF_7_01_003.exe | ~4MB | 46,394 |
| Terreno | HET_7_01_005.exe | ~5MB | 50,328 |

**Total**: 236,202 strings extraídos de 5 ejecutables

### 3. Análisis Automático
Script Python creado: `tools/reverse_engineering/analizar_ejecutables_bv8.py`

**Funciones**:
- Extracción masiva de strings con `strings -a`
- Búsqueda de patrones (dotaciones, municiones, consumos, bajas, fallas)
- Detección de números sospechosos (3, 20, 100, 200, 400, 620, 360)
- Búsqueda de funciones Smalltalk
- Generación de informes JSON con contexto

**Resultados guardados en**:
```
bv8_extraido/ingenieria_inversa/
├── analisis_ccoo_20251112_230857.json (CCOO completo)
├── analisis_logistica_20251112_230900.json (Logística completo)
├── analisis_bajas_20251112_230904.json (Bajas completo)
├── analisis_fallas_20251112_230907.json (Fallas completo)
├── analisis_terreno_20251112_230913.json (Terreno completo)
└── resumen_global_20251112_230913.json (Resumen compacto)
```

### 4. Análisis de Estructura PE
**Secciones de HACCOO_7_01_004.exe** (radare2):

| Sección | Offset | Tamaño | Permisos | Descripción |
|---------|--------|--------|----------|-------------|
| .text | 0x401000 | 8 KB | r-x | Código ejecutable (bootstrap Smalltalk) |
| .rdata | 0x403000 | 3.5 KB | r-- | Datos de solo lectura |
| .data | 0x404000 | 512 B | rw- | Datos inicializados (variables globales) |
| .gfids | 0x405000 | 512 B | r-- | Guard Functions IDs (seguridad) |
| **.rsrc** | 0x406000 | **3.8 MB** | r-- | **RECURSOS (aquí está todo)** |

**Conclusión crítica**: El 99% del contenido está en `.rsrc` (recursos), NO en código compilado tradicional.

### 5. Verificación de Empaquetado
```bash
upx -t HACCOO_7_01_004.exe
# Resultado: NotPackedException (no empaquetado)
```

Ejecutables **NO comprimidos** con UPX ni otros empaquetadores comunes.

---

## 🔍 HALLAZGOS IMPORTANTES

### Arquitectura Dolphin Smalltalk
**Implicaciones**:
1. ❌ **NO es código C/C++ nativo** → decompilación tradicional NO funcionará bien
2. ✅ **Código Smalltalk compilado** → está en bytecode dentro de `.rsrc`
3. ✅ **Recursos empaquetados** → 3.8 MB de datos en sección `.rsrc`
4. ⚠️ **Necesita herramientas específicas** → Ghidra genérico tendrá limitaciones

**Dolphin Smalltalk Runtime**:
- DolphinVM7.dll (Virtual Machine)
- DolphinCR7.dll (Core Runtime)
- DolphinDR7.dll (Development Runtime)
- DolphinSureCrypto.dll (Cifrado)

### Números Sospechosos Encontrados
Análisis de contexto mostró **muy pocas ocurrencias útiles**:

| Número | Significado | Ocurrencias | Calidad |
|--------|-------------|-------------|---------|
| 3 | Agua/víveres litros/día | 10 | ⚠️ Baja (mayormente basura binaria) |
| 20 | Cartuchos/cargador FAL | 6-7 | ⚠️ Baja |
| 100 | Munición total FAL | 0 | ❌ No encontrado claramente |
| 400 | Munición total MAG | 0 | ❌ No encontrado claramente |
| 620 | Combustible TAM (litros) | 0 | ❌ No encontrado |
| 360 | Combustible M113 (litros) | 1 | ⚠️ Baja (solo en Terreno) |

**Conclusión**: Los valores de dotación probablemente **NO están hardcodeados como constantes simples**, sino calculados dinámicamente en código Smalltalk.

### "Funciones" Detectadas
El script encontró 19-21 "funciones" por ejecutable, pero son **símbolos de linker**, NO funciones útiles:
```
@@@D@@@
@@@A@@@
@@@ @@@:@@@H@@@L... (basura binaria)
```

**Conclusión**: Necesitamos Ghidra para decompilación seria.

---

## 🚧 DESAFÍOS IDENTIFICADOS

### 1. Smalltalk vs C/C++
**Problema**: Las herramientas tradicionales (Ghidra, IDA Pro) están optimizadas para C/C++/Assembly.  
**Impacto**: 
- Decompilación generará código difícil de leer
- Nombres de funciones/variables serán genéricos (sub_401234, var_8, etc.)
- Flujo de ejecución puede ser difícil de seguir

**Solución propuesta**:
1. Usar Ghidra para ubicar la sección de recursos `.rsrc`
2. Extraer recursos con herramientas PE (ResourceHacker, pe-bear)
3. Buscar archivos `.st` (Smalltalk source) o `.img` (Smalltalk image) dentro de recursos
4. Si no hay source: analizar bytecode Smalltalk directamente

### 2. Recursos Empaquetados (3.8 MB)
**Problema**: La sección `.rsrc` es enorme (99% del ejecutable).  
**Contenido probable**:
- Clases Smalltalk compiladas (bytecode)
- Imágenes Smalltalk (heap snapshot)
- Recursos UI (iconos, strings, diálogos)
- **Posiblemente**: Datos de dotaciones en formato binario

**Solución propuesta**:
1. Extraer recursos con ResourceHacker o similar
2. Buscar estructuras de datos conocidas (arrays, tablas)
3. Correlacionar con XMLs existentes (configuracionCajones.xml, etc.)

### 3. Falta de Código Fuente
**Problema**: No encontramos archivos `.st` (Smalltalk source) en las carpetas.  
**Búsqueda realizada**:
```bash
find ... -name "*.st" -o -name "*.img" -o -name "*.dol"
# Resultado: Solo 1 .img (Terreno 3D, no relevante)
```

**Solución propuesta**:
1. Los ejecutables Dolphin Smalltalk **pueden** tener source code empaquetado internamente
2. Herramientas específicas Dolphin:
   - Dolphin Smalltalk Community Edition (gratuito)
   - FileOut de clases desde image
3. Alternativa: Decompilación de bytecode Smalltalk (muy complejo)

---

## 📋 SIGUIENTE PASO INMEDIATO

### Opción A: Usar Ghidra (Manual - 2-4 horas)
1. Abrir HACCOO_7_01_004.exe en Ghidra
2. Auto-análisis completo
3. Examinar sección `.rsrc`:
   - Buscar strings conocidos ("agua", "viveres", "municion")
   - Identificar estructuras de datos
   - Exportar recursos interesantes
4. Buscar referencias cruzadas a números sospechosos
5. Documentar hallazgos

### Opción B: Extraer Recursos Primero (Automatizado - 30 min)
1. Instalar ResourceHacker o pe-bear (GUI)
2. Extraer todos los recursos de `.rsrc`
3. Analizar archivos extraídos:
   - Buscar binarios Smalltalk (.img, .bin)
   - Buscar XML/JSON embebidos
   - Buscar tablas de datos
4. Si encontramos Smalltalk image → usar Dolphin Community Edition

### Opción C: Análisis Dinámico (Wine + debugger - 4-8 horas)
1. Ejecutar CCOO bajo Wine con debugging
2. Usar `winedbg` o `x64dbg` (Windows debugger via Wine)
3. Crear unidad de prueba (Equipo de fusileros)
4. Poner breakpoints en funciones de inicialización
5. Capturar valores de dotación en memoria
6. Hacer "memory dump" y buscar patrones

---

## 🎯 RECOMENDACIÓN PARA MAÑANA (DÍA 2)

**Plan de acción**:
1. ✅ **Opción B primero** (30 min): Extraer recursos con ResourceHacker
   - Si encontramos Smalltalk image → usar Dolphin Community Edition
   - Si encontramos datos tabulados → extraer directamente

2. ✅ **Opción A después** (2-4h): Análisis Ghidra
   - Solo si Opción B no da resultados concretos
   - Enfoque en sección `.rsrc` y referencias a strings conocidos

3. ⏸️ **Opción C última** (reserva): Solo si A y B fallan completamente
   - Más lento pero garantiza captura de valores reales

**Criterio de éxito Día 2**:
- [ ] Encontrar valores de dotación de AL MENOS 3 roles (tirador_fal, ametrallador_mag, conductor_m113)
- [ ] Validar que FAL = 100 rounds (5×20) correctamente
- [ ] Encontrar dotación de agua/víveres por persona
- [ ] Documentar método de extracción para replicar

---

## 📊 MÉTRICAS DE PROGRESO

### Día 1 (Hoy)
- ✅ Setup herramientas: 100%
- ✅ Identificación ejecutables: 100%
- ✅ Análisis automático strings: 100%
- ✅ Análisis estructura PE: 100%
- 🔄 Decompilación Ghidra: 0% (pendiente mañana)
- 🔄 Extracción datos concretos: 0% (pendiente)

### SEMANA 1 (Objetivo)
- Setup y reconocimiento: 90% ✅ (falta Ghidra manual)
- Análisis CCOO: 20% (strings extraídos, falta decompilación)
- Análisis Logística: 10% (solo reconocimiento)
- Documentación: 30% (plan creado, falta algoritmos)

---

## 📁 ARCHIVOS GENERADOS HOY

```
docs/
├── INGENIERIA_INVERSA_BV8.md (Plan maestro 2 semanas)
├── HALLAZGOS_EXTRACCION_BV8.md (Resultados extracción dbDatos.data)
└── PROGRESO_DIA1_INGENIERIA_INVERSA.md (este documento)

tools/reverse_engineering/
├── analizar_ejecutables_bv8.py (Script Python análisis automático)
└── extract_ccoo_complete.py (Script extracción dbDatos.data)

tools/bv8_extraido/
├── ccoo/
│   ├── extraccion_strings_command_20251112_195940.json (431 KB)
│   └── extraccion_smalltalk_parser_20251112_195941.json (20 KB)
│
└── ingenieria_inversa/
    ├── analisis_ccoo_20251112_230857.json
    ├── analisis_logistica_20251112_230900.json
    ├── analisis_bajas_20251112_230904.json
    ├── analisis_fallas_20251112_230907.json
    ├── analisis_terreno_20251112_230913.json
    └── resumen_global_20251112_230913.json
```

**Total archivos**: 10 documentos + 9 JSONs de análisis

---

## 🔬 APRENDIZAJES CLAVE

1. **BV8 usa Dolphin Smalltalk**, no C/C++
   - Implica que no hay "main()" tradicional
   - Código está en bytecode Smalltalk
   - Recursos empaquetados en `.rsrc`

2. **Dotaciones NO están hardcoded como constantes simples**
   - Búsqueda de números (3, 100, 400) dio resultados basura
   - Probablemente calculados dinámicamente
   - Necesitamos decompilación o debugging dinámico

3. **99% del contenido está en sección `.rsrc`**
   - Solo 8 KB de código nativo (.text)
   - 3.8 MB de recursos (clases, datos, UI)
   - Extraer recursos es crítico

4. **Herramientas tradicionales tienen limitaciones**
   - Ghidra/IDA Pro optimizados para C/C++
   - Smalltalk bytecode es diferente
   - Podemos necesitar Dolphin Community Edition

---

**Próximo reporte**: Fin de Día 2 (13/11/2025)  
**Objetivo Día 2**: Extraer valores concretos de dotaciones de AL MENOS 3 roles diferentes
