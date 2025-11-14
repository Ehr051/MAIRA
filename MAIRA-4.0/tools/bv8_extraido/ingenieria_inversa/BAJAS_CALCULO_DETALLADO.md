# CÁLCULO DE BAJAS BV8 - PROCESO DETALLADO

## 📋 RESUMEN EJECUTIVO

El cálculo de bajas en BV8 NO es una fórmula simple. Es un **proceso multi-fase** que ocurre DESPUÉS del combate (PCR), considerando:

1. **Elemento vs Elemento**: Qué unidad ataca a cuál
2. **Resultado PCR**: Power Combat Ratio determina ganador/perdedor
3. **Rol Táctico**: Quién ataca, quién defiende
4. **Magnitud Fuerzas**: Efectivos de cada lado
5. **Apoyos de Fuego**: Artillería, aéreo, naval
6. **Otros Factores**: Terreno, moral, fatiga, sorpresa

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                    ANTES DEL COMBATE                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Identificar elementos en contacto                        │
│    - Elemento Atacante (EA)                                 │
│    - Elemento Defensor (ED)                                 │
│                                                              │
│ 2. Calcular PCR (Power Combat Ratio)                        │
│    PCR = (Poder EA × Modificadores EA) /                    │
│          (Poder ED × Modificadores ED)                      │
│                                                              │
│    Modificadores incluyen:                                  │
│    - Apoyo artillería (+20%)                                │
│    - Apoyo aéreo (+30%)                                     │
│    - Terreno (urbano -20%, abierto +10%)                    │
│    - Postura (defensivo +30%, ofensivo -10%)                │
│    - Moral/Fatiga/Entrenamiento                             │
│                                                              │
│ 3. Determinar resultado combate según tabla PCR             │
│    PCR > 3:1  → Victoria decisiva atacante                  │
│    PCR 1:1-3:1 → Victoria atacante                          │
│    PCR 1:1     → Empate                                     │
│    PCR < 1:1   → Victoria defensor                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 CÁLCULO DE BAJAS (POST-PCR)                  │
├─────────────────────────────────────────────────────────────┤
│ PASO 1: Determinar Intensidad del Combate                   │
│                                                              │
│ Intensidad Base = f(PCR, Magnitud Fuerzas, Duración)        │
│                                                              │
│ - PCR > 3:1  → Intensidad = 0.8-1.0 (combate decisivo)      │
│ - PCR 1:1-3:1 → Intensidad = 0.5-0.8 (combate medio)        │
│ - PCR ≈ 1:1   → Intensidad = 0.3-0.5 (combate bajo)         │
│                                                              │
│ Ajustes:                                                     │
│ - Combate urbano: +0.2 intensidad                           │
│ - Apoyo artillería masivo: +0.15                            │
│ - Combate nocturno: -0.1                                    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ PASO 2: Calcular Bajas por Elemento                         │
│                                                              │
│ PARA EL PERDEDOR (mayor % de bajas):                        │
│ ─────────────────────────────────────────────────────────── │
│ Bajas_Base = Efectivos × Intensidad × Factor_Perdedor       │
│                                                              │
│ Factor_Perdedor según PCR:                                  │
│ - PCR 3:1+  → Factor = 0.15-0.25 (15-25% bajas)             │
│ - PCR 2:1   → Factor = 0.10-0.15                            │
│ - PCR 1:1   → Factor = 0.05-0.10                            │
│                                                              │
│ PARA EL GANADOR (menor % de bajas):                         │
│ ─────────────────────────────────────────────────────────── │
│ Bajas_Base = Efectivos × Intensidad × Factor_Ganador        │
│                                                              │
│ Factor_Ganador = Factor_Perdedor × 0.4-0.6                  │
│ (Ganador sufre 40-60% de las bajas del perdedor)            │
│                                                              │
│ MODIFICADORES ADICIONALES:                                  │
│ ─────────────────────────────────────────────────────────── │
│ × 1.3  si atacante en terreno abierto                       │
│ × 0.7  si defensor en posiciones fortificadas               │
│ × 1.5  si combate urbano (ambos bandos)                     │
│ × 1.2  si sin apoyo médico cercano                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ PASO 3: Clasificar Bajas (Ratios BV8)                       │
│                                                              │
│ Total_Bajas = Bajas_Combate + Bajas_No_Combate              │
│                                                              │
│ BAJAS DE COMBATE (90% del total):                           │
│ ────────────────────────────────────────────────────────────│
│ Bajas_Combate = Total_Bajas × 0.90                          │
│                                                              │
│ De estas bajas de combate:                                  │
│ - Muertos:      20% (bajasCombate × 0.20)                   │
│ - Heridos:      70% (bajasCombate × 0.70)                   │
│   · >72h:       60% de heridos (hospitalizados)             │
│   · <72h:       40% de heridos (retornan pronto)            │
│ - Desaparecidos: 5% (bajasCombate × 0.05)                   │
│ - Prisioneros:   5% (solo si perdedor) o 0% (ganador)       │
│                                                              │
│ BAJAS NO COMBATE (10% del total):                           │
│ ────────────────────────────────────────────────────────────│
│ Bajas_No_Combate = Total_Bajas × 0.10                       │
│                                                              │
│ - Enfermos:     50% (enfNoCombate × 0.50)                   │
│ - Heridos:      30% (enfNoCombate × 0.30)                   │
│ - Prófugos:     20% (enfNoCombate × 0.20)                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ PASO 4: Aplicar Efectos a Elementos                         │
│                                                              │
│ 1. Reducir efectivos actuales:                              │
│    Efectivos_Nuevos = Efectivos - (Muertos + Heridos_72h)   │
│                                                              │
│ 2. Generar eventos logísticos:                              │
│    - Evacuación heridos >72h (requiere ambulancias)         │
│    - Hospitalización (capacidad hospitales retaguardia)     │
│    - Reemplazo prófugos/desaparecidos                       │
│                                                              │
│ 3. Modificar moral:                                         │
│    - Perdedor: -15 a -30 moral                              │
│    - Ganador:  +5 a +10 moral                               │
│    - Si bajas >30%: -50 moral adicional (pánico)            │
│                                                              │
│ 4. Actualizar estado combate:                               │
│    - Si bajas >50%: Elemento destruido                      │
│    - Si bajas 30-50%: Elemento degradado                    │
│    - Si bajas <10%: Mantiene capacidad                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 EJEMPLO PRÁCTICO

### Escenario
- **Atacante**: Compañía Infantería (120 efectivos)
- **Defensor**: Compañía Infantería (110 efectivos)
- **Apoyo Atacante**: Artillería (+20%)
- **Terreno**: Urbano
- **Resultado PCR**: 2.5:1 (Victoria atacante)

### Paso 1: Intensidad
```
Intensidad_Base = 0.65 (PCR 2.5:1 = combate medio-alto)
+ Urbano: +0.2
= Intensidad Final: 0.85
```

### Paso 2: Bajas Totales

**DEFENSOR (Perdedor)**:
```
Bajas_Base = 110 × 0.85 × 0.15 (factor perdedor PCR 2.5:1)
           = 14 efectivos

Modificador Urbano: × 1.5
Bajas_Totales_Defensor = 14 × 1.5 = 21 efectivos (19% bajas)
```

**ATACANTE (Ganador)**:
```
Factor_Ganador = 0.15 × 0.5 = 0.075

Bajas_Base = 120 × 0.85 × 0.075
           = 8 efectivos

Modificador Urbano: × 1.5
Modificador Terreno Abierto (atacando): × 1.1
Bajas_Totales_Atacante = 8 × 1.5 × 1.1 = 13 efectivos (11% bajas)
```

### Paso 3: Clasificación Bajas

**DEFENSOR (21 bajas)**:
```
Bajas Combate:    21 × 0.90 = 19
  - Muertos:      19 × 0.20 = 4
  - Heridos:      19 × 0.70 = 13
    · >72h:       13 × 0.60 = 8 (hospitalizados)
    · <72h:       13 × 0.40 = 5 (retornan)
  - Desaparecidos: 19 × 0.05 = 1
  - Prisioneros:   19 × 0.05 = 1 (perdedor)

Bajas No Combate: 21 × 0.10 = 2
  - Enfermos:     2 × 0.50 = 1
  - Prófugos:     2 × 0.20 = 0
```

**ATACANTE (13 bajas)**:
```
Bajas Combate:    13 × 0.90 = 12
  - Muertos:      12 × 0.20 = 2
  - Heridos:      12 × 0.70 = 8
    · >72h:       8 × 0.60 = 5 (hospitalizados)
    · <72h:       8 × 0.40 = 3 (retornan)
  - Desaparecidos: 12 × 0.05 = 1
  - Prisioneros:   0 (ganador)

Bajas No Combate: 13 × 0.10 = 1
  - Enfermos:     1 × 0.50 = 1
```

### Paso 4: Estado Final

**DEFENSOR**:
```
Efectivos Iniciales:  110
Muertos:              -4
Heridos >72h:         -8
Efectivos Finales:    98 (10.9% reducción)

Moral: -20 (perdió combate, bajas 19%)
Estado: Operacional pero degradado
Requiere: 8 evacuaciones médicas
```

**ATACANTE**:
```
Efectivos Iniciales:  120
Muertos:              -2
Heridos >72h:         -5
Efectivos Finales:    113 (5.8% reducción)

Moral: +8 (ganó combate, bajas aceptables)
Estado: Operacional
Requiere: 5 evacuaciones médicas
```

---

## 🔗 INTEGRACIÓN CON SISTEMA EXISTENTE

### 1. Módulo PCR (Ya existe en MAIRA)
**Ubicación**: `Client/modules/pcr/pcr.js`

```javascript
// YA TENEMOS ESTO:
function calcularPCR(elementoAtacante, elementoDefensor) {
    const poderAtacante = calcularPoderCombate(elementoAtacante);
    const poderDefensor = calcularPoderCombate(elementoDefensor);
    
    const pcr = poderAtacante / poderDefensor;
    
    return {
        ratio: pcr,
        resultado: determinarResultado(pcr),
        ganador: pcr > 1 ? 'atacante' : 'defensor'
    };
}
```

### 2. Nuevo: Módulo Cálculo Bajas (INTEGRAR)

**Crear**: `Client/modules/jdg/calculoBajas.js`

```javascript
/**
 * Calcula bajas post-combate basado en resultado PCR
 * @param {Object} resultadoPCR - Resultado del PCR
 * @param {Object} atacante - Elemento atacante
 * @param {Object} defensor - Elemento defensor
 * @param {Object} contexto - Contexto combate (terreno, apoyos, etc.)
 * @returns {Object} Bajas de ambos elementos
 */
function calcularBajasPostCombate(resultadoPCR, atacante, defensor, contexto) {
    // PASO 1: Calcular intensidad
    const intensidad = calcularIntensidad(resultadoPCR, contexto);
    
    // PASO 2: Bajas base por elemento
    const bajasAtacante = calcularBajasElemento(
        atacante, 
        intensidad, 
        resultadoPCR.ganador === 'atacante' ? 'ganador' : 'perdedor',
        resultadoPCR.ratio,
        contexto
    );
    
    const bajasDefensor = calcularBajasElemento(
        defensor, 
        intensidad, 
        resultadoPCR.ganador === 'defensor' ? 'ganador' : 'perdedor',
        1 / resultadoPCR.ratio, // Invertir ratio para defensor
        contexto
    );
    
    // PASO 3: Clasificar bajas según ratios BV8
    const clasificacionAtacante = clasificarBajas(bajasAtacante, false); // ganador no tiene prisioneros
    const clasificacionDefensor = clasificarBajas(bajasDefensor, resultadoPCR.ganador === 'atacante');
    
    return {
        atacante: {
            total: bajasAtacante,
            clasificacion: clasificacionAtacante
        },
        defensor: {
            total: bajasDefensor,
            clasificacion: clasificacionDefensor
        }
    };
}

function calcularIntensidad(resultadoPCR, contexto) {
    let intensidad = 0.5; // Base
    
    // Ajustar por PCR
    if (resultadoPCR.ratio > 3) intensidad = 0.9;
    else if (resultadoPCR.ratio > 2) intensidad = 0.7;
    else if (resultadoPCR.ratio > 1.5) intensidad = 0.6;
    
    // Modificadores contexto
    if (contexto.terreno === 'urbano') intensidad += 0.2;
    if (contexto.apoyoArtilleria) intensidad += 0.15;
    if (contexto.combateNocturno) intensidad -= 0.1;
    
    return Math.min(1.0, Math.max(0.1, intensidad));
}

function calcularBajasElemento(elemento, intensidad, rol, pcr, contexto) {
    // Factor base según PCR y rol
    let factorBajas = rol === 'perdedor' ? 
        (pcr > 3 ? 0.20 : pcr > 2 ? 0.15 : 0.10) :
        (pcr > 3 ? 0.08 : pcr > 2 ? 0.06 : 0.04);
    
    // Modificadores
    if (contexto.terreno === 'urbano') factorBajas *= 1.5;
    if (contexto.terreno === 'abierto' && rol === 'atacante') factorBajas *= 1.3;
    if (contexto.posicionFortificada && rol === 'defensor') factorBajas *= 0.7;
    
    const bajas = Math.round(elemento.efectivos * intensidad * factorBajas);
    return bajas;
}

function clasificarBajas(totalBajas, esPerdedor) {
    const ratios = {
        bajasCombate: 0.9,
        muertosCombate: 0.2,
        heridosCombate: 0.7,
        heridos72Plus: 0.6,
        heridos72Minus: 0.4,
        desaparecidos: 0.05,
        prisioneros: esPerdedor ? 0.05 : 0.0,
        bajasNoCombate: 0.1,
        enfNoCombate: 0.5,
        heridosNoCombate: 0.3,
        profugos: 0.2
    };
    
    const bajasCombate = Math.round(totalBajas * ratios.bajasCombate);
    const bajasNoCombate = totalBajas - bajasCombate;
    
    const muertos = Math.round(bajasCombate * ratios.muertosCombate);
    const heridos = Math.round(bajasCombate * ratios.heridosCombate);
    const heridos72h = Math.round(heridos * ratios.heridos72Plus);
    const heridosMenos72h = heridos - heridos72h;
    
    return {
        total: totalBajas,
        combate: {
            muertos: muertos,
            heridos: heridos,
            heridos72Plus: heridos72h,
            heridos72Minus: heridosMenos72h,
            desaparecidos: Math.round(bajasCombate * ratios.desaparecidos),
            prisioneros: Math.round(bajasCombate * ratios.prisioneros)
        },
        noCombate: {
            enfermos: Math.round(bajasNoCombate * ratios.enfNoCombate),
            heridos: Math.round(bajasNoCombate * ratios.heridosNoCombate),
            profugos: Math.round(bajasNoCombate * ratios.profugos)
        },
        efectivosRetirados: muertos + heridos72h // Los que NO regresan al combate
    };
}
```

### 3. Integración con JDG

**Modificar**: `Client/modules/jdg/jdg.js`

```javascript
// DESPUÉS de calcular PCR y determinar ganador:
function resolverCombate(atacante, defensor, contexto) {
    // 1. Calcular PCR (YA EXISTE)
    const resultadoPCR = calcularPCR(atacante, defensor);
    
    // 2. NUEVO: Calcular bajas
    const bajas = calcularBajasPostCombate(resultadoPCR, atacante, defensor, contexto);
    
    // 3. Aplicar bajas a elementos
    aplicarBajasAElemento(atacante, bajas.atacante);
    aplicarBajasAElemento(defensor, bajas.defensor);
    
    // 4. Generar eventos logísticos
    generarEventosEvacuacion(atacante, bajas.atacante);
    generarEventosEvacuacion(defensor, bajas.defensor);
    
    // 5. Actualizar moral
    actualizarMoral(atacante, resultadoPCR.ganador === 'atacante', bajas.atacante);
    actualizarMoral(defensor, resultadoPCR.ganador === 'defensor', bajas.defensor);
    
    return {
        pcr: resultadoPCR,
        bajas: bajas,
        estado: determinarEstadoCombate(resultadoPCR, bajas)
    };
}

function aplicarBajasAElemento(elemento, bajasInfo) {
    elemento.efectivos -= bajasInfo.clasificacion.efectivosRetirados;
    
    // Actualizar estado
    const porcentajeBajas = (bajasInfo.total / elemento.efectivosIniciales) * 100;
    
    if (porcentajeBajas > 50) {
        elemento.estado = 'DESTRUIDO';
    } else if (porcentajeBajas > 30) {
        elemento.estado = 'DEGRADADO';
    } else if (porcentajeBajas > 10) {
        elemento.estado = 'OPERACIONAL_REDUCIDO';
    }
}
```

---

## 📊 DATOS NECESARIOS DE BV8

### Ya Tenemos ✅
- ✅ `estimacion_bajas_arbol.json` - Ratios de clasificación
- ✅ `armamento.json` - Datos armamento (para PCR)
- ✅ `tipos_vehiculos.json` - Vehículos (para PCR)

### Falta Extraer ⚠️
- ⚠️ **Tabla PCR → Factor Bajas**: Relación exacta PCR vs % bajas
- ⚠️ **Modificadores Terreno**: Factores urbano/abierto/montaña
- ⚠️ **Tabla Intensidad**: Cómo BV8 calcula intensidad exacta

**ESTRATEGIA**: Buscar en `batalla_virtual_usuario.img` o `jdg.img`:
```bash
strings jdg.img | grep -i -E "(bajas|casualties|factor.*pcr|intensidad)"
```

---

## 🎯 PRIORIDADES INMEDIATAS

1. **Ahora**: Continuar con plan propuesto (UI Análisis Terreno)
2. **Siguiente**: Integrar cálculo bajas DESPUÉS del PCR en JDG
3. **Futuro**: Extraer tablas exactas BV8 PCR→Bajas

---

## 📝 NOTAS TÉCNICAS

- **Diferencia clave**: Calculadora standalone asume intensidad/contexto genérico. Sistema real necesita PCR primero.
- **Ventaja**: Ya tenemos PCR funcionando en MAIRA, solo falta conectar el cálculo de bajas.
- **Complejidad**: BV8 probablemente usa tablas lookup PCR→Bajas. Debemos extraerlas o aproximarlas con fórmulas.

---

**Creado**: 13 Nov 2025  
**Contexto**: Aclaración usuario sobre flujo PCR → Bajas  
**Estado**: DOCUMENTADO - Listo para implementar después de UI Terreno
