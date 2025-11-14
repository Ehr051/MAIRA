# HALLAZGOS DE EXTRACCIÓN BV8
**Fecha**: 2025-11-12  
**Fase**: Extracción de Datos (FASE 1)  
**Estado**: En Proceso

---

## 📊 RESUMEN EJECUTIVO

### Extracciones Completadas
1. ✅ **dbDatos.data** - CCOO Database (485 KB)
   - Método 1: `strings` command → 17,050 líneas
   - Método 2: Smalltalk Binary parser → 13,246 registros posibles
   - Resultados: `bv8_extraido/ccoo/extraccion_*_20251112_195940.json`

2. ✅ **configuracionCajones.xml** - Planeamiento Logístico
   - 46 tipos de municiones con volúmenes exactos
   - Cart 7.62mm: 56 dm³
   - Cart 9x19mm: 63 dm³
   - Proyectiles 60/81/105/120mm
   - Cohetes 88.9mm, Granadas

3. ✅ **Estructura de Datos** - ejercicio.xml
   - `ElementoPosicionable` → personal[], vehiculos[], dotacion
   - `PersonaBatalla` → rolPrincipal, grado, arma, dotacion
   - `VehiculoGenerico` → MDTId, armamento, dotacion
   - `DotacionElemento` → insumos[]{nombre, cantInic, cantAct, clase}

### 🔍 HALLAZGO CRÍTICO: Dotaciones NO Están en XMLs

**Conclusión**: Las dotaciones iniciales (agua, viveres, munición por rol) **NO están predefinidas en archivos de configuración XML**.

**Evidencia**:
1. ✅ Estructura `DotacionElemento` está definida en `ejercicio.xml`
2. ✅ `PersonaBatalla` tiene campo `dotacion`
3. ✅ `VehiculoGenerico` tiene campo `dotacion`
4. ❌ **NO hay valores iniciales** en `dbDatos.data` (solo estructura)
5. ❌ **NO hay configuración** de dotaciones por rol en archivos XML
6. ✅ `ConfNivelesCriticos` existe (niveles críticos: agua, viveres, nafta, gasoil, claseV)

**Interpretación**:
Las dotaciones se **calculan dinámicamente** cuando se crea un ejercicio en BV8, probablemente usando:
- Tipo de unidad (`NivelElementoId`, `TipoElementoId`)
- Rol principal (`RolPrincipalId`)
- Armamento (`ArmamentoTropaId`)
- Tipo de vehículo (`MDTId`)
- Configuración de cajones (`configuracionCajones.xml`)

---

## 📁 ARCHIVOS EXTRAÍDOS

### CCOO - Administración de CCOO
```
bv8_extraido/ccoo/
├── extraccion_strings_command_20251112_195940.json (431 KB)
│   └── Método: Unix 'strings' command
│   └── Contenido: 17,050 líneas de texto extraídas
│   └── Categorizado: elementos, personas, vehículos, otros
│
└── extraccion_smalltalk_parser_20251112_195941.json (20 KB)
    └── Método: Parser Smalltalk Binary personalizado
    └── Firma: !STB 1 (Smalltalk Binary Object Format)
    └── Patrones encontrados:
        - elementos: 133 únicos
        - personas: 16 únicos
        - vehiculos: 28 únicos
        - registros posibles: 13,246
```

**Contenido de dbDatos.data**:
- **Tabla Elemento**: Brigadas, Batallones, Compañías, Secciones, Grupos, Equipos
  - Campos: Id, Nombre, NivelElementoId, TipoElementoId, SimboloId, Cantidad, Frente, Profundidad
  - Iconos: 596 archivos .ico (GrupoElectrogeno.ico, Brigada(EA).ico, etc.)

- **Tabla Persona**: Roles individuales de combate
  - Campos: Id, GradoId, RolPrincipalId, ArmamentoTropaId, OrganizacionCombateId
  - **NO contiene dotaciones iniciales** (se agregan al crear ejercicio)

- **Tabla Vehiculo**: MDT y vehículos
  - Campos: Id, MDTId, ArmamentoTropaId, MdtCargaId
  - **NO contiene dotaciones de combustible/munición** (se calculan dinámicamente)

### Logística - Planeamiento Logístico
```
hem_data/
└── logistica_cajones.xml (ya extraído previamente)
```

**configuracionCajones.xml** (46 tipos):
```xml
<cajon id="1" nombre="Cart 7,62" volumen="56"/>
<cajon id="2" nombre="Cart 9 x 19" volumen="63"/>
<cajon id="3" nombre="Cart 12,7 x 9" volumen="17.6"/>
<cajon id="4" nombre="Proy 60" volumen="0.25"/>
<cajon id="5" nombre="Proy 81" volumen="0.45"/>
<cajon id="6" nombre="Proy 105 HE" volumen="0.49"/>
<!-- ... 40 tipos más ... -->
```

### Configuraciones Generales - Batalla Virtual
```
Batalla Virtual/8/Simulador/Datos/Definiciones/
├── ejercicio.xml → Estructura de datos (DotacionElemento, PersonaBatalla, etc.)
├── general.xml → ConfNivelesCriticos (agua, viveres, nafta, gasoil, claseV)
├── ordenes.xml → Órdenes tácticas
└── comunicaciones.xml → Dispositivos DLI
```

**Niveles Críticos** (general.xml):
```xml
<definicion tipo="ConfNivelesCriticos">
    <campo nombre="agua" tipo="xsd:int"/>
    <campo nombre="viveres" tipo="xsd:int"/>
    <campo nombre="nafta" tipo="xsd:int"/>
    <campo nombre="gasoil" tipo="xsd:int"/>
    <campo nombre="claseV" tipo="xsd:int"/>
</definicion>
```

---

## 🎯 PRÓXIMOS PASOS

### Opción 1: Captura Dinámica (RECOMENDADO)
**Método**: Ejecutar componente CCOO y capturar ejercicio generado

**Pasos**:
1. Ejecutar `wine "Administración de CCOO.exe"`
2. Crear unidad de prueba (ej: Sección de Fusileros)
3. Exportar a XML con BV8
4. Extraer valores de dotación de PersonaBatalla
5. Documentar patrones y fórmulas

**Ventajas**:
- ✅ Obtiene valores **reales** del sistema
- ✅ Incluye lógica de cálculo de BV8
- ✅ Valida contra ejercicios funcionales

**Desventajas**:
- ⏱️ Requiere ejecución manual/automatizada
- 🔄 Necesita múltiples pruebas para diferentes roles

### Opción 2: Ingeniería Inversa del Ejecutable
**Método**: Decompilación de binarios .exe

**Herramientas**:
- `strings` (ya usado)
- `ghidra` - Reverse engineering framework
- `upx -d` - Descompresor de ejecutables

**Desventajas**:
- ⚠️ Muy complejo para binarios Smalltalk
- ⚠️ Código probablemente ofuscado/compilado
- ⚠️ Alto riesgo de interpretación incorrecta

### Opción 3: Valores Estimados + Validación Posterior
**Método**: Usar valores militares estándar argentinos

**Fuentes**:
- ✅ Manuales de Instrucción del Ejército Argentino
- ✅ Documentación COEM (Comando de Operaciones del Ejército)
- ✅ Tablas de dotación estándar FM 101-10-1/2 (adaptadas)

**Valores Base Estimados**:
```json
{
  "tirador_fal": {
    "municion_7.62": 100,  // 5 cargadores × 20 cartuchos (CORREGIDO)
    "agua": 3,             // litros/día
    "viveres": 3           // raciones/día
  },
  "ametrallador_mag": {
    "municion_7.62": 400,  // 2 cintas × 200 cartuchos
    "agua": 3,
    "viveres": 3
  }
  // ... etc
}
```

**Validación**:
1. Crear ejercicio BV8 de prueba
2. Comparar con valores estimados
3. Ajustar según diferencias
4. Marcar como "VALIDADO vs BV8 [fecha]"

---

## 🔬 ANÁLISIS DE EXTRACCIÓN

### strings Command (17,050 líneas)
**Contenido detectado**:
- ✅ Nombres de unidades (Brigada blindada, Sección de fusileros, etc.)
- ✅ Nombres de equipos (Bomba de Agua, Grupo Electrógeno, etc.)
- ✅ Referencias a iconos (.ico files)
- ✅ Cadenas de interfaz (mensajes, etiquetas)
- ❌ **NO valores numéricos de dotaciones**

**Ejemplo extraído**:
```
"Equipo de fusileros"
"Grupo de fusileros"
"Sección de fusileros"
"Brigada blindada"
"Instalaciones para Tratamiento de Agua"
"Bomba de Agua"
```

### Smalltalk Parser (13,246 registros)
**Patrones encontrados**:
- `elementos`: 133 tipos únicos
  - Brigadas (8 tipos)
  - Batallones, Compañías, Secciones, Grupos, Equipos
  - Centros de comunicaciones
  - Instalaciones de apoyo

- `personas`: 16 roles únicos
  - Tiradores, Ametralladores, Jefes, Conductores
  - **Roles identificados por nombre** (no por dotación)

- `vehiculos`: 28 tipos únicos
  - TAM, VCTP, VCA 155mm, VCDT
  - M113, VCPC, VCAMB, VCRECUP
  - VLEGA, Unimog

**Estructura identificada**:
```json
{
  "patterns": {
    "elementos": ["Brigada", "Sección", "Grupo", ...],
    "personas": ["Tirador FAL", "Ametrallador MAG", ...],
    "vehiculos": ["TAM", "M113", "VLEGA", ...]
  },
  "registros_posibles": 13246
}
```

---

## 📋 DATOS VALIDADOS vs ESTIMADOS

### ✅ VALIDADOS (Extraídos de BV8)
1. **Nombres de unidades**: 133 tipos de elementos
2. **Roles de personal**: 16 roles identificados
3. **Tipos de vehículos**: 28 MDT extraídos
4. **Municiones**: 46 tipos con volúmenes exactos
5. **Niveles críticos**: agua, viveres, nafta, gasoil, claseV

### ⚠️ ESTIMADOS (No Encontrados en XMLs)
1. **Dotación munición por rol**: 100 rounds tirador_fal (5×20), 400 rounds MAG (2×200)
2. **Dotación agua por persona**: 3 litros/día (estándar militar)
3. **Dotación víveres por persona**: 3 raciones/día (estándar)
4. **Combustible por vehículo**: 
   - TAM: 620 litros diésel
   - M113: 360 litros nafta
5. **Composiciones de unidades**: 
   - Equipo fusileros: 1 jefe + 2 tiradores
   - Grupo fusileros: 1 jefe + 3 equipos

**Estado**: Marcados como "0.1-DRAFT - NO VALIDADOS" en todos los JSONs

---

## 🛠️ HERRAMIENTAS UTILIZADAS

### 1. extract_ccoo_complete.py
**Ubicación**: `tools/reverse_engineering/extract_ccoo_complete.py`  
**Función**: Extractor exhaustivo de dbDatos.data  
**Métodos**:
- `extract_with_strings_command()`: Unix 'strings' + categorización
- `extract_with_parser()`: Parser Smalltalk Binary personalizado

**Resultados**:
```bash
$ python3 extract_ccoo_complete.py

Método 1: Comando 'strings'
✅ Extraídas 17050 líneas
💾 extraccion_strings_command_20251112_195940.json

Método 2: Parser Smalltalk
✅ Archivo cargado: 496252 bytes
✅ Patrones encontrados: 133 elementos, 16 personas, 28 vehículos
💾 extraccion_smalltalk_parser_20251112_195941.json
```

### 2. grep/find/cat (Unix Tools)
**Uso**:
```bash
# Buscar dotaciones en XMLs
grep -r "dotacion" /path/to/BV8/

# Listar configuraciones
find /path/to/BV8/ -name "*.xml"

# Analizar estructura
cat configuracionCajones.xml
```

### 3. Wine@staging 10.6
**Componentes ejecutables**:
- ✅ Administración de CCOO 8 rev 7.01.004
- ✅ Planeamiento Logístico 8 rev 7.01.004
- ✅ Batalla Virtual Usuario 8 rev 6.03.002

---

## 📝 CONCLUSIONES

### Lo Que Sabemos
1. ✅ **Estructura de datos completa**: DotacionElemento con insumos[] está bien definida
2. ✅ **Tipos de municiones**: 46 tipos con volúmenes exactos en dm³
3. ✅ **Jerarquía de unidades**: 133 elementos desde equipos hasta brigadas
4. ✅ **Roles de personal**: 16 roles identificados (nombres extraídos)
5. ✅ **Tipos de vehículos**: 28 MDT con nombres

### Lo Que NO Sabemos (Aún)
1. ❌ **Dotaciones iniciales por rol**: Agua, víveres, munición específica
2. ❌ **Fórmulas de cálculo**: Cómo BV8 calcula dotaciones al crear ejercicio
3. ❌ **Composiciones exactas**: Cuántos soldados/vehículos por unidad tipo
4. ❌ **Consumos**: Tasas de consumo de agua, víveres, combustible por hora/día
5. ❌ **Niveles críticos por defecto**: Valores de ConfNivelesCriticos

### Próxima Acción Recomendada
**OPCIÓN 1 - Captura Dinámica** (2-4 horas de trabajo):
1. Ejecutar CCOO y crear unidades de prueba
2. Exportar ejercicio a XML
3. Extraer valores reales de dotación
4. Documentar en `bv8_extraido/ccoo/dotaciones_capturadas.json`
5. Validar contra múltiples tipos de unidades

**Alternativa**: Usar valores estimados militares estándar + validación posterior (más rápido pero menos preciso)

---

**Siguiente Sprint**: Captura de dotaciones dinámicas o decisión sobre estimaciones validadas.
