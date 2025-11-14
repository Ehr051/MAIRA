# CORRECCIONES NECESARIAS - Feedback Usuario

## 1. Afiliación "J" (Joker) para Enemigo
✅ CORREGIDO en mapeo_sidc_bv8.json
- Usar "J" en lugar de "H" para enemigo
- Razón: "Joker" es más natural en español para ejercicios

## 2. Niveles Ya Existentes en MAIRA
⚠️ NO MODIFICAR edicioncompleto.js - ya tiene niveles definidos

Niveles actuales (planeamiento.html línea 862):
```html
<option value="A">Equipo/Tripulación</option>
<option value="B">Pelotón</option>
<option value="C">Grupo</option>
<option value="D">Sección</option>
<option value="E">Compañía/Escuadrón/Batería</option>
<option value="F">Regimiento/Batallón/Grupo</option>
<option value="H">Brigada</option>
<option value="I">División</option>
<option value="J">Cuerpo/MEF</option>
<option value="K">Ejército</option>
```

**IMPORTANTE**: No todos los niveles se usan en Argentina
- Cuerpo (J) - NO usado
- División (I) - Limitado
- Ejército (K) - NO usado operacionalmente

## 3. Cantidades = Sumatoria Bottom-Up
✅ IMPLEMENTADO en unidades_tipo.json
- Las cantidades se calculan automáticamente
- Si tenemos equipo (5) → grupo (2 equipos = 10) → sección (3 grupos = 30)
- **NO hardcodear números** - deben emerger de la estructura

## 4. Munición FAL INCORRECTA
❌ ERROR CRÍTICO - Corregir URGENTE

**MAL** (actual):
```json
"municion_inicial": 300,
"descripcion": "10 cargadores x 30 cartuchos"
```

**BIEN** (correcto):
```json
"municion_inicial": 100,
"descripcion": "5 cargadores x 20 cartuchos",
"nota": "Carga en cargadores: 100 cart. Resto en cajas (mochila/reserva unidad)"
```

**Razón**:
- Cargadores FAL tienen **20 cartuchos**, NO 30
- Soldado lleva 5 cargadores = 100 cartuchos listos
- Resto (200) va en cajas/mochila, NO en cargadores

**Afecta a**:
- tirador_fal ✅ CORREGIDO
- tirador_fal_para (¿también 20 por cargador?)
- auxiliar_mag ✅ CORREGIDO
- apuntador_at (secundario FAL)
- jefe_equipo
- jefe_grupo
- jefe_seccion

## 5. Validación Antes de Integrar
⚠️ CRÍTICO - NO integrar sin verificar:

1. ✅ Extraer datos REALES de dbDatos.data
2. ⏳ Parsear CCOO database completa
3. ⏳ Validar armamento con tablas BV8
4. ⏳ Validar dotaciones con factores logísticos BV8
5. ⏳ Verificar estructura jerárquica contra árbol CCOO
6. ⏳ Comprobar SIDC contra iconos BV8 (596 .ico files)

## Próximos Pasos

1. Corregir roles_personal.json completamente (munición FAL)
2. Validar con dbDatos.data (parsear o ejecutar CCOO)
3. Crear tabla de mapeo: BV8 iconoPath → APP-6 SIDC
4. Implementar ORBATBuilder solo después de validación
5. Integrar en MAIRA cuando TODO esté verificado

**NO asumir nada - usar SOLO datos BV8 reales**
