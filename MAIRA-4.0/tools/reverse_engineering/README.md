# 🔍 BV8 Reverse Engineering Toolkit

Herramientas para extraer datos de los ejecutables de Batalla Virtual 8 y convertirlos a formato JSON compatible con MAIRA 4.0

## 📦 Setup

### 1. Activar entorno virtual

```bash
cd tools/reverse_engineering
source venv_re/bin/activate  # macOS/Linux
```

### 2. Verificar instalación

```bash
pip list | grep pefile
# Debe mostrar: pefile, pe-tree, capstone, etc.
```

## 🛠️ Herramientas Disponibles

### 1. `extract_strings.py` - Extractor de Strings

Extrae todas las strings de texto de los ejecutables y las clasifica automáticamente.

**Uso básico:**
```bash
# Analizar un ejecutable específico
python extract_strings.py "/Users/mac/Downloads/Batalla Virtual 8 2019/2 HEM/Estimación de Bajas de Combate/Estimación de Bajas de Combate 8 rev 7.01.004.exe"

# Analizar TODOS los ejecutables de BV8
python extract_strings.py --all

# Especificar directorio de salida
python extract_strings.py <archivo.exe> --output mi_output
```

**Output:**
- `output/<nombre>_strings.json` - Strings clasificadas por categoría:
  - `numeros_flotantes`: Números decimales
  - `factores`: Números entre 0.0-2.0 (probables factores de combate)
  - `nombres_terreno`: BOSQUE, URBANO, etc.
  - `nombres_clima`: LLUVIA, NIEVE, etc.
  - `nombres_armas`: FAL, TAM, VCTP, etc.
  - `constantes`: Constantes numéricas del código

**Ejemplo de output:**
```json
{
  "factores": [0.5, 0.6, 0.7, 0.85, 1.0, 1.2],
  "nombres_terreno": ["BOSQUE_DENSO", "URBANO", "MONTAÑA"],
  "nombres_clima": ["DESPEJADO", "LLUVIA", "NIEBLA"]
}
```

---

### 2. `extract_resources.py` - Extractor de Recursos

Extrae recursos embebidos en el ejecutable (tablas, diálogos, datos binarios).

**Uso:**
```bash
# Analizar recursos
python extract_resources.py <archivo.exe>

# Extraer RT_RCDATA (datos personalizados - aquí pueden estar las tablas)
python extract_resources.py <archivo.exe> --rcdata

# Especificar salida
python extract_resources.py <archivo.exe> --output recursos_bv8
```

**Output:**
- `resources_output/<nombre>_resources.json` - Resumen de recursos
- `resources_output/rcdata/` - Archivos RT_RCDATA extraídos

**Tipos de recursos importantes:**
- `RT_RCDATA`: Datos personalizados (tablas, configuraciones)
- `RT_STRING`: Tablas de strings
- `RT_DIALOG`: Diálogos (labels, descripciones)

---

## 🎯 Workflow Recomendado

### Paso 1: Extraer strings de ejecutables críticos

```bash
# Estimación de Bajas (CRÍTICO)
python extract_strings.py "/Users/mac/Downloads/Batalla Virtual 8 2019/2 HEM/Estimación de Bajas de Combate/Estimación de Bajas de Combate 8 rev 7.01.004.exe"

# Planeamiento Logístico
python extract_strings.py "/Users/mac/Downloads/Batalla Virtual 8 2019/2 HEM/Planeamiento Logístico/Planeamiento Logístico 8 rev 7.01.004.exe"

# Planeamiento de Ingenieros
python extract_strings.py "/Users/mac/Downloads/Batalla Virtual 8 2019/2 HEM/Planeamiento de Ingenieros/Planeamiento de Ingenieros 8 rev 7.01.003.exe"
```

### Paso 2: Extraer recursos (tablas)

```bash
python extract_resources.py "/Users/mac/Downloads/Batalla Virtual 8 2019/2 HEM/Estimación de Bajas de Combate/Estimación de Bajas de Combate 8 rev 7.01.004.exe" --rcdata
```

### Paso 3: Analizar output

Los archivos JSON generados contendrán:
- Factores numéricos (modificadores de combate)
- Nombres de categorías (tipos de terreno, clima, armas)
- Constantes hardcodeadas

### Paso 4: Convertir a formato MAIRA

Usar los datos extraídos para completar:
- `Server/data/factores_terreno.json`
- `Server/data/factores_clima.json`
- `Server/data/alcances_armas.json`
- `Server/data/consumos_logisticos.json`
- `Server/data/tiempos_ingenieros.json`
- `Server/data/mtbf.json`

---

## 📊 Análisis Avanzado (Opcional)

### Instalar IDR (Interactive Delphi Reconstructor)

Si necesitas decompilación más profunda:

1. Descargar IDR de: https://github.com/crypto2011/IDR
2. Es una herramienta Windows, usar en VM o Wine
3. IDR puede extraer:
   - Clases Delphi
   - Métodos y funciones
   - Tablas VMT (Virtual Method Table)
   - Formularios completos

### Usar Radare2 (si se instaló)

```bash
# Instalar radare2 (opcional)
brew install radare2

# Analizar ejecutable
r2 -A <archivo.exe>

# Dentro de r2:
aaa      # Analizar todo
afl      # Listar funciones
pdf @main  # Disassembly de main
```

### Usar Ghidra (GUI, más potente)

1. Descargar: https://ghidra-sre.org/
2. Importar `.exe`
3. Auto-análisis
4. Buscar strings y constantes visualmente

---

## 📝 Notas Importantes

### Ejecutables Delphi

BV8 está hecho en Borland Delphi, características:
- **Muchas strings en texto plano** (fácil de extraer)
- **RT_RCDATA contiene tablas** (archivo binario o texto)
- **Constantes hardcodeadas** en sección `.data`
- **VCL (Visual Component Library)** - muchas strings de UI

### Factores de Combate

Buscar patrones como:
- Números entre `0.1` y `2.0`
- Cerca de strings como "BOSQUE", "LLUVIA", "DEFENSOR", "ATACANTE"
- En arrays o secuencias

### Tablas de Datos

Pueden estar en:
1. **RT_RCDATA**: Archivos CSV, TXT, o binarios
2. **Sección .data**: Arrays inicializados
3. **Strings concatenadas**: "FAL;400;600" (nombre;alcance_efectivo;alcance_max)

---

## 🔄 Convertir Output a JSON MAIRA

Script helper para convertir:

```python
# convert_to_maira.py (crear si es necesario)
import json

# Cargar strings extraídas
with open('output/Estimación_de_Bajas_strings.json') as f:
    data = json.load(f)

# Mapear a formato MAIRA
factores_terreno = {}
for factor in data['factores']:
    # Lógica de mapeo...
    pass

# Guardar en Server/data/
with open('../../Server/data/factores_terreno.json', 'w') as f:
    json.dump(factores_terreno, f, indent=2)
```

---

## ✅ Checklist de Extracción

- [ ] Estimación de Bajas → factores de combate
- [ ] Planeamiento Logístico → consumos estándar
- [ ] Planeamiento Ingenieros → tiempos de obras
- [ ] Estimación de Fallas → MTBF de vehículos
- [ ] Estudio del Terreno → factores OCOKA
- [ ] Documentación PDF → validar valores extraídos

---

## 🆘 Troubleshooting

### Error: `pefile not found`
```bash
pip install -r requirements.txt
```

### Error: `Permission denied`
```bash
chmod +x extract_strings.py extract_resources.py
```

### No encuentra ejecutables
Verificar ruta:
```bash
ls -la "/Users/mac/Downloads/Batalla Virtual 8 2019/2 HEM/"
```

### Output vacío
- BV8 puede estar comprimido/ofuscado
- Probar con `--rcdata` para recursos
- Usar IDR para análisis más profundo

---

## 📚 Referencias

- [PE Format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [Delphi Reverse Engineering](https://www.hex-rays.com/products/ida/support/tutorials/)
- [pefile Documentation](https://github.com/erocarrera/pefile)
- [Radare2 Book](https://book.rada.re/)

---

**Branch:** BV8TOMAIRA  
**Autor:** MAIRA Team  
**Fecha:** 2025-11-12
