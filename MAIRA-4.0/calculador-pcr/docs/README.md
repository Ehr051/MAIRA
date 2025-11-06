# 🎯 CALCULADOR DE PODER DE COMBATE RELATIVO (PCR)

**Versión:** 1.1
**Fecha:** 06 Noviembre 2025
**Autor:** M.A.I.R.A. Team

### 🆕 Novedades v1.1
- ✅ Exportación a **Excel (XLSX)** con 4 hojas detalladas
- ✅ Exportación a **PDF** con formato profesional
- ✅ Dropdown de exportación con 3 opciones (JSON, Excel, PDF)

---

## 📋 DESCRIPCIÓN

El **Calculador de Poder de Combate Relativo (PCR)** es una herramienta web independiente que permite calcular y comparar el poder de combate entre dos fuerzas militares (Azul vs. Colorada).

Basado en la **Tabla de Poder de Combate Relativo** utilizada en análisis táctico militar, esta herramienta automatiza los cálculos complejos y proporciona una visualización clara del balance de fuerzas.

---

## 🎮 CARACTERÍSTICAS

### ✅ Funcionalidades Principales

1. **Gestión de Fuerzas**
   - Agregar elementos de combate de catálogo completo
   - Modificar cantidades en tiempo real
   - Eliminar elementos individuales
   - Visualización organizada por bando

2. **Factores Multiplicadores**
   - **Moral (5 niveles):** Muy Alta (2.0), Alta (1.5), Normal (1.0), Baja (0.5), Muy Baja (0.2)
   - **Experiencia (3 tipos):** Comb. Ofensivo (1.0), Comb. Defensivo (0.5), Sin Experiencia (0.1)
   - **Personal (6 niveles):** Profesional 100%, 75% Perm./25% Movil., 50%/50%, Conscripta, Conscripta 2 años, 100% Movilizado
   - **Oportunidad (6 condiciones):** Diurno, Diurno baja visibilidad, Nocturno sin capacidad, Nocturno con instrucción, Nocturno + amplificador luz, Nocturno + visión térmica
   - **Adaptación Terreno (8 opciones):** Con capacitación, Llanura, Monte, Baja/Media/Alta Montaña, Desierto, Urbano

3. **Cálculo Automático**
   - Fórmula: `Total = Cantidad × VRC × Moral × Exp × Pers × Opor × Adp`
   - PCR automático: `Total Azul / Total Rojo`
   - Interpretación de resultados

4. **Persistencia y Exportación**
   - Guardado automático en LocalStorage
   - Recuperación al recargar página
   - Exportación a **JSON** (datos completos)
   - Exportación a **Excel** (4 hojas: Resumen, Azul, Colorada, Fórmula)
   - Exportación a **PDF** (documento profesional formateado)

---

## 📊 FÓRMULA DE CÁLCULO

### Cálculo por Elemento

```
Total Elemento = Cantidad × VRC × (Moral × Experiencia × Personal × Oportunidad × Adaptación)
```

### Cálculo de PCR

```
PCR = Total Fuerza Azul / Total Fuerza Colorado

Donde:
- PCR > 1: Ventaja de Fuerza Azul
- PCR = 1: Fuerzas equilibradas
- PCR < 1: Ventaja de Fuerza Colorada
```

### Interpretación de Resultados

| PCR | Ratio | Interpretación |
|-----|-------|----------------|
| ≥ 3.0 | 3:1 | **SUPERIORIDAD AZUL** |
| 1.5 - 2.99 | ~2:1 | Ventaja Significativa Azul |
| 1.2 - 1.49 | ~1.2:1 | Ventaja Moderada Azul |
| 0.84 - 1.19 | ~1:1 | **FUERZAS EQUILIBRADAS** |
| 0.67 - 0.83 | ~1:1.2 | Ventaja Moderada Colorada |
| 0.34 - 0.66 | ~1:2 | Ventaja Significativa Colorada |
| ≤ 0.33 | 1:3 | **SUPERIORIDAD COLORADA** |

---

## 🚀 USO

### 1. Acceso

Desde el inicio de MAIRA 4.0, haz clic en la card:

```
📊 Calculador PCR
Poder de Combate Relativo
```

O accede directamente a: `/calculador-pcr/index.html`

### 2. Agregar Elementos

**FUERZA AZUL:**
1. Click en **"Agregar Elemento"** (botón azul)
2. Selecciona **Categoría** (Maniobra, Apoyo de Fuego, etc.)
3. Selecciona **Equipamiento** específico
4. Ingresa **Cantidad**
5. Marca **Munición Inteligente** si aplica (multiplica VRC × 1.5)
6. Click **"Agregar"**

**FUERZA COLORADA:**
- Mismo proceso con el botón rojo

### 3. Configurar Factores Globales

Cada bando tiene factores multiplicadores detallados:

- **Moral (5 niveles):**
  - Muy Alta (2.0): Tropa altamente motivada
  - Alta (1.5): Tropa motivada
  - Normal (1.0): Moral estándar
  - Baja (0.5): Tropa desmoralizada
  - Muy Baja (0.2): Moral crítica

- **Experiencia (3 tipos):**
  - Combate Ofensivo (1.0): Experiencia en operaciones ofensivas
  - Combate Defensivo (0.5): Solo experiencia defensiva
  - Sin Experiencia (0.1): Sin combate previo

- **Personal (6 niveles):**
  - Profesional 100% (1.0): Toda la tropa es profesional
  - 75% Permanente / 25% Movilizado (0.75)
  - 50% Permanente / 50% Movilizado (0.5)
  - Conscripta (0.5): Servicio militar obligatorio
  - Conscripta 2 años (0.375): Conscriptos con 2 años de servicio
  - 100% Movilizado (0.1): Unidad completamente movilizada

- **Oportunidad (6 condiciones):**
  - Diurno (1.0): Condiciones óptimas de visibilidad
  - Diurno baja visibilidad (0.5): Niebla, lluvia, humo
  - Nocturno sin capacidad (0.25): Sin equipamiento nocturno
  - Nocturno con instrucción (0.5): Entrenamiento nocturno
  - Nocturno + amplificador luz (0.75): Con amplificadores
  - Nocturno + visión térmica (1.0): Con equipamiento térmico

- **Adaptación Terreno (8 opciones):**
  - Con capacitación (1.0): Capacitado para el terreno
  - Llanura sin capacitación (0.9): Terreno abierto
  - Monte sin capacitación (0.5): Terreno boscoso
  - Baja Montaña sin cap. (0.5)
  - Media Montaña sin cap. (0.25)
  - Alta Montaña sin cap. (0.1): Terreno extremo
  - Desierto sin capacitación (0.8)
  - Urbano sin capacitación (0.3): Combate en ciudades

### 4. Ver Resultados

El PCR se calcula automáticamente y muestra:

```
┌─────────────────────────────────┐
│  PODER DE COMBATE RELATIVO      │
│                                  │
│  125.50 : 85.30                 │
│  Ratio 1.5:1 (Ventaja Azul)     │
│  - Ventaja Significativa Azul   │
│                                  │
│  TOTAL AZULES:      125.50      │
│  TOTAL COLORADOS:    85.30      │
└─────────────────────────────────┘
```

### 5. Modificar Cantidades

Puedes cambiar la cantidad de elementos directamente en la tabla sin eliminar y reagregar.

### 6. Exportar Datos

Click en el dropdown **"Exportar"** y elige el formato:

#### 📄 Exportar JSON
Archivo JSON con toda la información:
- Composición completa de fuerzas
- Factores configurados por bando
- Resultados calculados (totales y PCR)
- Timestamp de generación

#### 📊 Exportar Excel (XLSX)
Archivo Excel con **4 hojas**:
1. **Resumen PCR:** Resultados principales (PCR, totales, interpretación)
2. **Fuerza Azul:** Factores, elementos detallados y subtotal
3. **Fuerza Colorada:** Factores, elementos detallados y subtotal
4. **Fórmula:** Explicación completa del cálculo e interpretaciones

Ideal para reportes y análisis más profundos.

#### 📑 Exportar PDF
Documento PDF profesional con:
- Portada con título y fecha
- Sección de Resultados con PCR e interpretación
- Detalle completo de ambas fuerzas (factores y elementos)
- Página final con fórmula de cálculo y tabla de interpretaciones

Ideal para presentaciones y archivos formales.

---

## 📚 CATÁLOGO DE EQUIPAMIENTO

### Elementos de Maniobra (53 tipos)

**Infantería:**
- Ca I M (a pie): VRC 0.25
- Ca I M (montada): VRC 0.33
- Ca I Mte: VRC 0.33
- Ca Asal Ae: VRC 0.45
- Ca I Para: VRC 0.45
- Ca I Mot: VRC 0.4
- Ca I Mec (M113): VRC 0.6
- Ca I Mec (VCTP): VRC 1.0
- Ca I Mec (Marder): VRC 1.2
- Ca I Mec (Guaraní): VRC 0.7 - 0.75
- Ca I Mec (Piraña): VRC 0.85 - 0.9

**Tanques:**
- Esc Tan (SK 105): VRC 1.8
- Esc Tan (TAM): VRC 2.0
- Esc Tan (TAM 2C): VRC 2.5
- Esc Tan (TAM 2IP): VRC 3.0
- Esc Tan (LEOPARD 1): VRC 2.0
- Esc Tan (LEOPARD 2): VRC 2.5
- Esc Tan (LEOPARD 2 A4): VRC 3.0

**Exploración:**
- Esc Expl (Cascavel): VRC 1.25
- Esc Expl (Guaraní): VRC 0.9
- Esc Expl (Hummer): VRC 0.45 - 0.5

### Elementos de Apoyo de Fuego (49 tipos)

**Artillería:**
- GA 155mm (Palmaria): VRC 4.0
- GA 155mm (CITER): VRC 3.0
- GA 105mm: VRC 2.5 - 3.5
- Ba 155mm: VRC 0.75 - 1.0
- Ba 105mm: VRC 0.625 - 0.8

**SLAM (Lanzacohetes Múltiples):**
- PAMPERO Cal 105mm: VRC 1.0
- SLAM Cal 155mm: VRC 1.2
- SAPBA Cal 127mm: VRC 2.0
- BM 24 Cal 240mm: VRC 2.75
- SLAM Cal 306mm: VRC 3.0

**Sistemas Antitanque:**
- Misil Spike LR1: VRC 2.75
- Misil Spike LR2: VRC 3.5
- Misil TOW 2A: VRC 3.0

**Sistemas Antiaéreos:**
- BADA Misil: VRC 4.8
- BADA Cal 35mm: VRC 0.8
- BADA Cal 40mm: VRC 0.9
- Sec ADA Stinger: VRC 1.2
- Sec ADA Mistral: VRC 1.2

**Helicópteros y Drones:**
- Esc Helic Ataque: VRC 3.0
- Sec Av Ej (Ataque): VRC 2.5
- ANT Hermes 450: VRC 2.5
- ANT Hermes 900: VRC 3.0

### Elementos de Ingenieros (9 tipos)

- B Ing Liv: VRC 3.0
- B Ing Bl/Mec: VRC 4.0
- Ca Ing Pes: VRC 2.0
- Ca Ing Buzos: VRC 2.0
- Ca Ing Comb: VRC 1.0
- Ca Ing Franq: VRC 1.5
- Ca Ing Pte Flot: VRC 0.5 - 1.0

### Comunicaciones y Guerra Electrónica (3 tipos)

- Ca Com (s): VRC 1.5
- Sec GE (HF): VRC 3.0
- Sec GE (VHF): VRC 2.5

### TOE - Tropas de Operaciones Especiales (3 tipos)

- Ca Cdo (s): VRC 2.0
- Ca Caz (s) Mte: VRC 1.0
- Ca Caz (s) M: VRC 1.0

**TOTAL: 117 tipos de equipamiento**

---

## 💾 PERSISTENCIA DE DATOS

El calculador guarda automáticamente:
- ✅ Elementos agregados de ambos bandos
- ✅ Cantidades de cada elemento
- ✅ Factores multiplicadores configurados
- ✅ Timestamp de última modificación

Los datos se guardan en **localStorage** del navegador y se recuperan automáticamente al recargar la página.

### Limpiar Datos

Click en **"Limpiar"** para eliminar TODOS los datos guardados (requiere confirmación).

---

## 🔧 TECNOLOGÍAS UTILIZADAS

- **HTML5** - Estructura
- **CSS3** - Estilos y animaciones
- **JavaScript (Vanilla)** - Lógica de cálculo
- **Bootstrap 5** - Framework UI
- **Font Awesome** - Iconos
- **LocalStorage API** - Persistencia

---

## 📖 REFERENCIAS

### Documentos Base

- `Tabla Poder Combate Relativo.xlsx` - Tabla original
- `Tabla Poder Combate Relativo.csv` - Versión CSV

### Fórmulas y Cálculos

El sistema replica exactamente las fórmulas de la tabla Excel oficial, incluyendo:
- Valores Relativos de Combate (VRC) por equipamiento
- Multiplicadores de munición inteligente (×1.5)
- Factores de Moral (0.2 - 2.0)
- Factores de Experiencia (0.1 - 1.0)
- Factores de Personal (0.1 - 1.0)
- Factores de Oportunidad (0.25 - 1.0)
- Factores de Adaptación (0.1 - 1.0)

---

## 🚧 LIMITACIONES Y NOTAS

### Limitaciones Actuales

1. **Factores de Clima:** No implementados en esta versión (matriz 7×7)
2. **Factores por Elemento:** Los factores son globales por bando, no individuales
3. **Sin Validación Táctica:** El sistema calcula, no valida composiciones tácticas

### Notas Importantes

- **VRC son valores referenciales** basados en doctrina argentina
- Los **resultados son aproximados** y deben ser analizados por personal capacitado
- No reemplaza el análisis táctico profesional
- Útil para comparaciones rápidas y planificación inicial

---

## 🎯 CASOS DE USO

### 1. Planificación de Operaciones

Comparar fuerzas propias vs. enemigas para determinar necesidades de refuerzos.

### 2. Análisis de Escenarios

Evaluar diferentes composiciones de fuerza y sus efectos en el PCR.

### 3. Capacitación y Entrenamiento

Herramienta didáctica para comprender balance de poder.

### 4. Wargaming

Configurar escenarios equilibrados para juegos de guerra.

---

## 🔄 ACTUALIZACIONES FUTURAS

### Versión 1.1 (Próximamente)

- [ ] Factores de Clima implementados
- [ ] Factores individuales por elemento
- [ ] Gráficos comparativos
- [ ] Importar desde JSON
- [ ] Templates predefinidos de fuerzas

### Versión 2.0 (Planeado)

- [ ] Integración con Juego de Guerra
- [ ] Comparación histórica de configuraciones
- [ ] Exportar a PDF con reportes
- [ ] Múltiples escenarios simultáneos
- [ ] Base de datos de OdB reales

---

## 📞 SOPORTE

Para reportar bugs o sugerir mejoras:
- **GitHub Issues:** https://github.com/anthropics/MAIRA/issues
- **Documentación:** `/calculador-pcr/docs/`

---

## 📜 LICENCIA

© 2025 M.A.I.R.A. Team - Todos los derechos reservados

---

**¡Usa el PCR con responsabilidad y criterio táctico! 🎖️**
