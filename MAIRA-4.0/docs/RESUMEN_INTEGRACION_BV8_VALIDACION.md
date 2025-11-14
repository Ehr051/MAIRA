# RESUMEN: Integración BV8→MAIRA - Estado de Validación

## ✅ Correcciones Aplicadas

1. **Afiliación Joker (J)** - Cambiado de "H" (Hostile) a "J" (Joker)
   - Razón: Más natural en español para ejercicios
   - Archivo: `mapeo_sidc_bv8.json`

2. **Munición FAL Corregida Parcialmente**
   - tirador_fal: 300 → 100 (5 cargadores × 20 cart)
   - auxiliar_mag: 300 → 100 (5 cargadores × 20 cart)
   - **Pendiente**: jefe_equipo, jefe_grupo, jefe_seccion, apuntador_at

## ⚠️ Problemas Identificados

### 1. Datos Inventados vs Datos Reales BV8

**Lo que creé (INVENTADO)**:
- `roles_personal.json` - 15 roles con munición/dotaciones **ASUMIDAS**
- `tipos_vehiculos.json` - 10 vehículos con dotaciones **ESTIMADAS**
- `unidades_tipo.json` - 10 plantillas con composición **SUPUESTA**

**Lo que existe en BV8 (REAL)**:
- dbDatos.data (485KB) - Base de datos Smalltalk Binary
- arbolCO.xml (4.3KB) - Esquema de 3 niveles (Elemento/Persona/Vehiculo)
- 596 archivos .ico - Iconos militares propietarios

**Problema**: No puedo extraer dotaciones/munición exactas con `strings` - formato binario

### 2. Niveles MAIRA vs BV8

**MAIRA ya tiene (NO modificar)**:
```
A = Equipo/Tripulación
B = Pelotón
C = Grupo
D = Sección
E = Compañía/Escuadrón/Batería
F = Regimiento/Batallón/Grupo
H = Brigada
I = División (limitado Argentina)
J = Cuerpo/MEF (NO usado Argentina)
K = Ejército (NO usado Argentina)
```

**BV8 Observados** (strings dbDatos.data):
- Equipo de tiradores
- Grupo de tiradores
- Sección de tiradores
- **NO se observó**: Pelotón, División, Cuerpo

**Acción**: Usar solo niveles que existen en Argentina

### 3. Agregación Bottom-Up

**Implementado correctamente** en `unidades_tipo.json`:
```json
"equipo_fusileros": {
  "personal_total": 5,
  "composicion": {
    "personal": [
      {"rol": "jefe_equipo", "cantidad": 1},
      {"rol": "tirador_fal", "cantidad": 3},
      {"rol": "ametrallador_mag", "cantidad": 1}
    ]
  },
  "dotacion_agregada": {
    "agua": 17.5,  // 5 × 3.5
    "viveres": 15,  // 5 × 3
    "municion_762": 1500  // Calculado
  }
}
```

**Verificación Pendiente**: ¿Son estas composiciones correctas según BV8?

## 📋 Archivos Creados (DRAFT - No Validados)

### Catálogos BV8
1. `Server/data/catalogos_bv8/mapeo_sidc_bv8.json` (4.5KB)
   - ✅ Estructura SIDC correcta
   - ✅ Afiliación "J" corregida
   - ⚠️ Mapeos de unidades NO validados con BV8

2. `Server/data/catalogos_bv8/roles_personal.json` (9KB)
   - ❌ Municiones INVENTADAS (no extraídas de BV8)
   - ❌ Dotaciones ASUMIDAS
   - ⚠️ Nombres de roles verificados parcialmente con `strings`

3. `Server/data/catalogos_bv8/tipos_vehiculos.json` (13KB)
   - ❌ Dotaciones combustible ESTIMADAS
   - ❌ Munición vehículos INVENTADA
   - ✅ Nombres vehículos verificados (TAM, M113, VLEGA, UNIMOG)

### TOE (Table of Organization & Equipment)
4. `Server/data/toe_bv8/unidades_tipo.json` (16KB)
   - ❌ Composiciones NO verificadas con dbDatos.data
   - ✅ Algoritmo agregación correcto
   - ⚠️ Cantidades personal/vehículos SIN validar

### Servicios (NO Creados)
5. `Server/services/bv8/orbat_builder.py` - **CANCELADO por usuario**
   - Razón: Primero validar datos

## 🚫 Datos Reales BV8 Encontrados

### Desde `strings dbDatos.data`:

**Roles Personal** (confirmados):
- "Ap MAG" (Apuntador MAG)
- "Aux MAG" (Auxiliar MAG)
- Fusil Para Tirador Especial 762mm
- Fusil Para Tirador Especial 127mm

**Unidades** (confirmadas):
- Equipo de tiradores
- Grupo de tiradores
- Grupo de tiradores motorizado
- Sección de tiradores
- Sección de tiradores motorizada

**Vehículos** (confirmados):
- TAM variantes: VCA155mmTAM, VCTPTAM, VCDTTAM, VCPCTAM
- M113 variantes: VCPCM113, VCRecupM113, VCAmbBlM113, VCM113Descont
- VLEGA
- UNIMOG

**Armas** (confirmadas):
- FAL556mmPARA
- FAL762mm (implícito)
- MAG
- M2 BMG

## ❌ Datos Faltantes (NO Extraíbles con `strings`)

- Munición inicial por rol
- Dotaciones diarias (agua, viveres)
- Dotaciones vehículos (combustible exacto)
- Composición exacta de unidades
- Relaciones Elemento → Persona → Vehículo
- Mapeo SimboloId → iconoPath

## 🎯 Próximas Acciones Recomendadas

### Opción A: Parsear dbDatos.data (Técnico)
1. Investigar formato "Smalltalk Binary 1" (!STB 1)
2. Crear parser Python para extraer tablas
3. Obtener datos 100% reales

**Pros**: Datos exactos BV8
**Contras**: Complejidad técnica alta, sin documentación del formato

### Opción B: Ejecutar CCOO y Exportar (Práctico)
1. Intentar ejecutar Administración de CCOO (tiene error DLL actual)
2. Resolver dependencias faltantes
3. Usar interfaz para exportar/ver datos
4. Capturar pantallas/datos

**Pros**: Usa herramienta oficial BV8
**Contras**: Requiere resolver error c0000135 (DLL faltante)

### Opción C: Usar Datos Estimados + Validación Iterativa (Híbrido)
1. **Mantener** archivos creados como "v0.1 DRAFT"
2. Marcarlos explícitamente como NO VALIDADOS
3. Implementar ORBATBuilder con estos datos
4. Validar/corregir cuando obtengamos datos reales
5. Versionar cambios (v0.1 → v0.2 → v1.0)

**Pros**: Avance rápido, framework listo
**Contras**: Riesgo de perpetuar datos incorrectos

## �� Recomendación Usuario

> "hay que controlar muy bien antes de integrarlo"

**Acción**: PAUSAR desarrollo, VALIDAR primero

**Plan**:
1. ✅ Dejar archivos creados como referencia
2. ⏳ Agregar advertencias en cada JSON
3. ⏳ Intentar parsear dbDatos.data O resolver CCOO.exe
4. ⏳ Extraer tabla completa Elemento/Persona/Vehiculo
5. ⏳ Reemplazar TODOS los datos inventados con reales
6. ⏳ Solo entonces implementar ORBATBuilder
7. ⏳ Solo entonces integrar en MAIRA

**NO asumir - VERIFICAR TODO**
