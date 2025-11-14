# 📊 RESUMEN EJECUTIVO: Integración BV8 → MAIRA

**Fecha**: 14 noviembre 2025
**Autor**: Análisis sistema BV8
**Estado**: Plan de trabajo listo para ejecución

---

## 🎯 ¿QUÉ ES BV8?

**Batalla Virtual 8 (2019)** es un simulador militar argentino desarrollado en Dolphin Smalltalk que contiene:

- ✅ Datos realistas de vehículos argentinos (TAM, VCTP, M113, VLEGA, etc.)
- ✅ Sistema logístico completo (munición, combustible, dotaciones)
- ✅ Cálculos de bajas basados en doctrina militar
- ✅ Análisis de terreno y movilidad
- ✅ Estructura ORBAT (Order of Battle) completa

---

## 🔍 ¿QUÉ SE HA EXTRAÍDO?

### Datos Validados (Listos para Usar)

1. **armamento.json** (12 armas)
   - FAL 7.62mm, MAG, Morteros, Cañones
   - Alcances, daño, precisión, cadencia
   - Fuente: Especificaciones técnicas argentinas + BV8

2. **tipos_vehiculos.json** (10 vehículos)
   - TAM, VCTP, M113, VLEGA, UNIMOG, etc.
   - Dotaciones, autonomía, consumo
   - Fuente: Código Smalltalk BV8 + docs

3. **mapeo_sidc_bv8.json**
   - Conversión BV8 → estándar APP-6 SIDC
   - Afiliaciones, niveles, símbolos
   - Fuente: Análisis BV8

4. **cajones_municion.json** (46 tipos)
   - Cartuchos 7.62, 5.56, 9mm, proyectiles, cohetes
   - Volúmenes, pesos
   - Fuente: XML BV8

5. **terreno_tipos.json** (8 tipos)
   - Bosque, urbano, despejado, barrial, etc.
   - Fuente: XML BV8

6. **bajas_ratios.json** (12 factores)
   - Combate vs no combate, muertos vs heridos
   - Evacuación, prisioneros, prófugos
   - Fuente: XML BV8

### Datos DRAFT (Requieren Validación)

- **roles_personal.json** (15 roles)
  - ⚠️ Dotaciones estimadas, NO extraídas
  - Acción: Validar ejecutando CCOO o usar doctrina argentina

- **unidades_tipo.json** (10 plantillas)
  - ⚠️ Composiciones supuestas, NO verificadas
  - Acción: Validar con CCOO ejecutado

### Datos Faltantes

- **terreno_movilidad.json**: Factores velocidad por vehículo/terreno
- **ingenieros_tiempos.json**: Construcción (encriptado)
- **consumo_logistico.json**: Ratios por actividad

---

## 🚀 PLAN DE INTEGRACIÓN (6 FASES, 17 DÍAS)

### FASE 1: Fundamentos (3 días)
**Objetivo**: Validar y completar todos los JSONs

- Día 1: Validar dotaciones (ejecutar CCOO o usar doctrina)
- Día 2: Crear terreno_movilidad.json
- Día 3: Documentar, testear, commit

**Entregable**: 8 JSONs validados

---

### FASE 2: Calculadora de Bajas (2 días)
**Objetivo**: Primer módulo standalone funcional

- Día 4: Backend API `/api/bv8/bajas/calcular`
- Día 5: Frontend HTML + gráficos + exportar PDF

**Entregable**: Módulo calculadora accesible desde MAIRA

---

### FASE 3: Editor ORBAT (3 días)
**Objetivo**: CO.html carga plantillas BV8

- Día 6: Backend API ORBAT (cargar/exportar plantillas)
- Día 7-8: Frontend CO.html (botón "Cargar Plantilla BV8", edición)

**Entregable**: CO.html integrado con BV8

---

### FASE 4: Planeamiento (2 días)
**Objetivo**: Importar elementos BV8 como calcos

- Día 9: Botón "Importar Elemento BV8" → colocar en mapa
- Día 10: Validación flujo completo (CO → Planeamiento → Guardar)

**Entregable**: Elementos BV8 en escenarios

---

### FASE 5: Juego de Guerra V2 (4 días)
**Objetivo**: Combates usan datos BV8 reales

- Día 11-12: APIs combate y logística (bajas, consumo)
- Día 13-14: Frontend JDG V2 (tracking logístico, actualización dotaciones)

**Entregable**: Simulación realista con BV8

---

### FASE 6: Módulos Adicionales (3 días) - Opcional
**Objetivo**: Herramientas extra

- Análisis de movilidad (trafficability map)
- Planificador logístico (necesidades por misión)

**Entregable**: 2 módulos adicionales

---

## 📊 IMPACTO EN MAIRA

### Antes de BV8
- ❌ Datos de vehículos estimados o inventados
- ❌ Combates sin cálculos realistas
- ❌ Sin tracking logístico
- ❌ Sin estructura ORBAT validada

### Después de BV8
- ✅ Datos de vehículos argentinos reales
- ✅ Bajas calculadas con doctrina militar
- ✅ Tracking de munición, combustible, agua, raciones
- ✅ Plantillas ORBAT predefinidas (Equipo → Batallón)
- ✅ Simulación realista de operaciones

---

## 🎯 PRÓXIMOS PASOS (HOY)

### Opción A: Validación Completa (Recomendada)
**Duración**: 2-3 horas

1. Ejecutar `wine "Administración de CCOO.exe"`
2. Crear unidad de prueba (Grupo de Fusileros)
3. Verificar dotaciones mostradas
4. Actualizar `roles_personal.json` con valores reales
5. Commit: "feat(bv8): dotaciones validadas con CCOO"

**Ventajas**:
- ✅ Datos 100% reales de BV8
- ✅ Sin estimaciones
- ✅ Base sólida para integración

**Desventajas**:
- ⏱️ Requiere tiempo
- 🔧 Puede tener problemas técnicos con Wine

---

### Opción B: Avance Rápido (Alternativa)
**Duración**: 1 hora

1. Crear `terreno_movilidad.json` con estimaciones
2. Marcar datos DRAFT como "ESTIMADO - Pendiente validación BV8"
3. Empezar Fase 2: Calculadora de Bajas
4. Validar con BV8 posteriormente

**Ventajas**:
- ✅ Avance rápido
- ✅ Módulo funcional hoy
- ✅ Validación iterativa

**Desventajas**:
- ⚠️ Puede requerir ajustes posteriores
- ⚠️ Datos estimados temporales

---

### Opción C: Híbrida (Equilibrada)
**Duración**: 2 horas

1. Usar doctrina argentina para dotaciones (FM 101-10)
2. Marcar como "DOCTRINA ARGENTINA - Compatible BV8"
3. Crear `terreno_movilidad.json`
4. Empezar Fase 2 con datos validados

**Ventajas**:
- ✅ Balance tiempo/calidad
- ✅ Datos basados en doctrina real
- ✅ Progreso visible hoy

**Desventajas**:
- ⚠️ Puede no coincidir 100% con BV8
- ⚠️ Requiere validación posterior

---

## 📋 ESTRUCTURA DE ARCHIVOS BV8

```
MAIRA-4.0/
│
├── Server/data/catalogos_bv8/
│   ├── armamento.json ✅ VALIDADO
│   ├── tipos_vehiculos.json ✅ VALIDADO
│   ├── mapeo_sidc_bv8.json ✅ VALIDADO
│   ├── cajones_municion.json ✅ VALIDADO
│   ├── terreno_tipos.json ✅ VALIDADO
│   ├── bajas_ratios.json ✅ VALIDADO
│   ├── terreno_movilidad.json ⏳ PENDIENTE
│   └── README.md ⏳ CREAR
│
├── Server/data/toe_bv8/
│   ├── roles_personal.json ⚠️ VALIDAR
│   └── unidades_tipo.json ⚠️ VALIDAR
│
├── Server/services/bv8/
│   ├── armamento_service.py ⏳ CREAR
│   ├── bajas_service.py ⏳ CREAR
│   ├── logistica_service.py ⏳ CREAR
│   ├── movilidad_service.py ⏳ CREAR
│   └── orbat_service.py ⏳ CREAR
│
├── Client/js/modules/bv8/
│   ├── BV8API.js ✅ EXISTENTE
│   ├── CalculadoraBajas.js ⏳ CREAR
│   ├── CalculadoraMovilidad.js ⏳ CREAR
│   └── ORBATBuilder.js ⏳ CREAR
│
└── Client/modules/
    ├── calculadora_bajas/ ⏳ CREAR
    ├── planificador_logistica/ ⏳ CREAR
    └── analisis_movilidad/ ⏳ CREAR
```

---

## 🎯 DECISIÓN REQUERIDA

**¿Qué opción prefieres para HOY?**

1. **Opción A**: Validar con CCOO (2-3h) → Datos 100% reales
2. **Opción B**: Crear módulo Bajas YA (1h) → Demo funcional hoy
3. **Opción C**: Híbrida (2h) → Balance tiempo/calidad

**Mi recomendación**: **Opción C** si no tienes tiempo para ejecutar CCOO, **Opción A** si quieres datos perfectos.

---

## 📞 DOCUMENTACIÓN COMPLETA

- **Plan Detallado**: `/docs/PLAN_INTEGRACION_BV8_GRADUAL.md` (este archivo)
- **Plan Maestro**: `/docs/PLAN_MAESTRO_BV8_MAIRA.md`
- **Extracción BV8**: `/docs/BV8_EXTRACCION_FINAL.md`
- **Validación**: `/docs/RESUMEN_INTEGRACION_BV8_VALIDACION.md`

---

**¿Por dónde empezamos?** 🚀
