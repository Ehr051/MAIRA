# 📊 Estrategia de Integración BV8 → MAIRA

## 🎯 Objetivo
Reemplazar datos preliminares de MAIRA con **datos reales validados de BV8**, mejorando el realismo del simulador.

---

## 📋 Comparativa: Datos Actuales vs BV8

### 1️⃣ **TERRENO**

#### **MAIRA Actual** (preliminar - 8 tipos genéricos):
```
BOSQUE_DENSO, BOSQUE_CLARO, ABIERTO, URBANO, 
MONTAÑA, COLINAS, PANTANO, DESIERTO
```
- **Problema**: Tipos genéricos militares, no categorías geográficas reales
- **Factores**: defensor, atacante, movimiento, observación (inventados)

#### **BV8 Real** (validado - 8 tipos con 30 variantes):
```
1. Arenal (3 variantes: Arenal, Médano/duna, Playa de arena)
2. Arenal con ripio (3 variantes: A1, con canto rodado, cordones conchilla)
3. Barrial (5 variantes: A5, barrizal/guadal, zona desmontada, paleocauce, uso mixto)
4. Escorial (1 variante)
5. Intransitable (12 variantes: nieve/hielo, cumbre rocosa, afloramiento rocoso, hoyal, 
   rajadural, tacuruzal, cangrejal, ciénaga/tremedal, huaico, bañados, esteros, cañadas)
6. Mallín (2 variantes: vega, A7)
7. Pedregal (2 variantes: Pedregal, playa de piedra/restinga)
8. Playa de grava (2 variantes: canto rodado, A1)
```

**✅ VENTAJA BV8**: 
- Clasificación geográfica real argentina (usada por Ejército)
- 30 variantes específicas vs 8 genéricas
- Traductor automático para mapas IGM/SIG

---

### 2️⃣ **CLIMA**

#### **MAIRA Actual** (preliminar - 10 estados):
```
DESPEJADO, NUBLADO, LLUVIA, LLUVIA_INTENSA, TORMENTA,
NIEBLA, NIEVE, VENTISCA, CALIDO, FRIO_EXTREMO
```
- **Factores**: visibilidad, movimiento, precisión, moral (inventados)
- **Transiciones**: probabilidades estimadas
- **Temperatura**: rangos arbitrarios

#### **BV8 Real** (validado - sistema climático completo):
```xml
<definicion tipo="Clima" abstracto="true">
    <campo nombre="cantidad" tipo="xsd:string" />
    <subclase tipo="Niebla" />
    <subclase tipo="Precipitacion" />
    <subclase tipo="Regular" />
</definicion>

<definicion tipo="Precipitacion">
    <campo nombre="tipo" tipo="xsd:string" />  <!-- lluvia, nieve, granizo -->
    <campo nombre="valor" tipo="xsd:float" />  <!-- intensidad mm/h -->
</definicion>

<definicion tipo="EventoClima">
    <campo nombre="horaDeInicio" tipo="xsd:string" />
    <campo nombre="fechaFin" tipo="xsd:string" />
    <campo nombre="clima" tipo="xsd:anyType" />
</definicion>
```

**✅ VENTAJA BV8**:
- Sistema de **eventos climáticos** con duración temporal
- Precipitaciones con **valores numéricos** (mm/h), no categorías
- Niebla como fenómeno separado con densidad variable
- Integrado con sistema de reloj del ejercicio

---

### 3️⃣ **BAJAS DE COMBATE**

#### **MAIRA Actual**: 
❌ **NO EXISTE** - Usa estimaciones genéricas en código JavaScript

#### **BV8 Real** (validado - 23 parámetros):

**Factores Cualitativos** (12):
```
1. apoyoDeMaterial      - Apoyo artillería/tanques/ingenieros
2. apoyoDePersonal      - Refuerzos/reservas
3. apoyoNaval           - Fuego naval
4. empleo               - Doctrina empleada
5. obstaculoNatural     - Ríos, montañas, etc.
6. pcr                  - Posición de combate de retaguardia
7. posicionOrganizada   - Fortificaciones/trincheras
8. situacionAerea       - Superioridad/paridad/inferioridad
9. tipoDeGUC           - Tipo de Gran Unidad de Combate
10. tipoDeOperacion     - Ofensiva/defensiva/encuentro
11. tropasEspeciales    - Comandos/paracaidistas
12. visionNocturna      - Disponibilidad NVG
```

**Factores Cuantitativos** (11):
```
%BajasCombate        = 90%   - Bajas totales en combate
%BajasNoCombate      = 10%   - Bajas accidentales/enfermedades
%MuertosComb         = 20%   - Muertos en combate (de bajas combate)
%HeridosComb         = 70%   - Heridos en combate (de bajas combate)
%DesaparecidosComb   = 10%   - Desaparecidos en combate
%PG                  = 5%    - Prisioneros de guerra
%Profugos            = 20%   - Desertores/profugos
%Heridos+72          = 60%   - Heridos graves (+72h evacuación)
%Heridos-72          = 40%   - Heridos leves (-72h recuperación)
%MuertosNoComb       = 10%   - Muertos no combate
%HeridosNoComb       = 90%   - Heridos no combate
```

**✅ VENTAJA BV8**:
- **23 parámetros militares reales** vs código genérico
- Separación combate/no-combate
- Clasificación heridos por gravedad (evacuación médica)
- Factores doctrinales (PCR, tropas especiales, visión nocturna)

---

### 4️⃣ **LOGÍSTICA**

#### **MAIRA Actual**: 
❌ **NO EXISTE** - Solo ORBAT con unidades, sin consumos

#### **BV8 Real** (validado - sistema completo):

**Cajones de Municiones** (46 tipos con volúmenes):
```
Cart 7.62              = 56 m³
Cart 9x19              = 63 m³
Cohetes 88.9           = 0.195 m³
Proy Mun 60            = 0.05 m³
Proy Mun 81            = 0.83 m³
Proy Mun 120 (largo)   = 0.6 m³
Proy Mun 120 (corto)   = 0.492 m³
Granadas 40mm          = 0.025 m³
Minas AP/AT            = variados
Cargas demolición      = variados
... (41 más)
```

**Efectos Logísticos** (relaciones causa-efecto):
```xml
<efectos size="X">
    <!-- Mapeo entre tipos de munición y efectos en combate -->
    <!-- Ej: Munición 105mm → Apoyo de fuego → Bajas enemigas -->
</efectos>
```

**Sistema de Insumos** (5 clases básicas):
```xml
<DotacionElemento>
    <campo nombre="agua"    tipo="xsd:float" />  <!-- litros -->
    <campo nombre="viveres" tipo="xsd:float" />  <!-- raciones -->
    <campo nombre="nafta"   tipo="xsd:float" />  <!-- litros -->
    <campo nombre="gasoil"  tipo="xsd:float" />  <!-- litros -->
    <campo nombre="claseV"  tipo="xsd:float" />  <!-- kg munición -->
</DotacionElemento>

<ConfNivelesCriticos>
    <!-- % crítico para cada insumo -->
    <campo nombre="agua"   tipo="xsd:int" />  <!-- % -->
    <campo nombre="viveres" tipo="xsd:int" />
    <campo nombre="nafta"  tipo="xsd:int" />
    <campo nombre="gasoil" tipo="xsd:int" />
    <campo nombre="claseV" tipo="xsd:int" />
</ConfNivelesCriticos>
```

**✅ VENTAJA BV8**:
- **46 tipos de munición** con volúmenes reales (m³)
- Sistema de **5 insumos básicos** (agua, víveres, combustibles, munición)
- **Niveles críticos** configurables
- Cálculo de transporte y almacenamiento

---

## 🎯 Estrategia de Integración

### **Fase 1: Datos Fundamentales** ⏱️ 2-3 horas

#### 1.1 **Reemplazar `factores_terreno.json`**
```bash
Server/data/factores_terreno.json (NUEVO - validado BV8)
```

**Estructura propuesta**:
```json
{
  "version": "2.0.0",
  "source": "Batalla Virtual 8 - Estudio del Terreno rev 7.01.005",
  "descripcion": "Tipos de terreno reales argentinos con traductor IGM",
  
  "tipos_modelados": {
    "ARENAL": {
      "id": 1,
      "nombre": "Arenal",
      "variantes": [
        "Arenal",
        "Médano, duna", 
        "Playa de arena"
      ],
      "efectos": {
        "movilidad_vehiculos": 0.4,
        "movilidad_personal": 0.7,
        "observacion": 1.0,
        "cobertura": 0.1
      }
    },
    "ARENAL_RIPIO": { ... },
    "BARRIAL": { ... },
    "ESCORIAL": { ... },
    "INTRANSITABLE": {
      "id": 5,
      "nombre": "Intransitable",
      "variantes": [
        "Nieve o hielo persistente, ventisquero, glaciar, morenas",
        "Cumbre rocosa",
        "Afloramiento rocoso",
        "Hoyal",
        "Rajadural",
        "Tacuruzal",
        "Cangrejal",
        "Ciénaga, tremedal, tembladeral embalsado, turbal, menuco",
        "Huaico",
        "Bañados",
        "Esteros",
        "Cañadas"
      ],
      "efectos": {
        "movilidad_vehiculos": 0.0,
        "movilidad_personal": 0.1,
        "observacion": 0.6,
        "cobertura": 0.3
      }
    },
    ... (8 tipos totales)
  },
  
  "traductor_igm": {
    "descripcion": "Mapeo automático de nomenclatura IGM a tipos modelados",
    "mapeo": {
      "Médano, duna": "ARENAL",
      "Playa de arena": "ARENAL",
      "Arenal con ripio A1": "ARENAL_RIPIO",
      ... (30 variantes)
    }
  }
}
```

**Acción**: 
- ✅ Crear nuevo JSON con 8 tipos + 30 variantes
- ⚠️ **Falta**: Factores de movilidad/cobertura (necesita ejecutar HEM Terreno)

---

#### 1.2 **Crear `factores_bajas.json`** (NUEVO)
```bash
Server/data/factores_bajas.json (NUEVO - validado BV8)
```

**Estructura**:
```json
{
  "version": "1.0.0",
  "source": "Batalla Virtual 8 - Estimación de Bajas rev 7.01.004",
  "descripcion": "Factores de bajas de combate del Ejército Argentino",
  
  "factores_cualitativos": {
    "apoyoDeMaterial": {
      "nombre": "Apoyo De Material",
      "valores": ["nulo", "bajo", "medio", "alto"],
      "descripcion": "Apoyo de artillería, tanques, ingenieros"
    },
    "apoyoDePersonal": { ... },
    "apoyoNaval": { ... },
    "empleo": { ... },
    "obstaculoNatural": { ... },
    "pcr": { ... },
    "posicionOrganizada": { ... },
    "situacionAerea": { ... },
    "tipoDeGUC": { ... },
    "tipoDeOperacion": { ... },
    "tropasEspeciales": { ... },
    "visionNocturna": { ... }
  },
  
  "factores_cuantitativos": {
    "distribucion_bajas": {
      "pct_bajas_combate": 0.9,
      "pct_bajas_no_combate": 0.1
    },
    "bajas_combate": {
      "pct_muertos": 0.2,
      "pct_heridos": 0.7,
      "pct_desaparecidos": 0.1,
      "pct_prisioneros": 0.05,
      "pct_profugos": 0.2
    },
    "clasificacion_heridos": {
      "pct_heridos_graves_mas_72h": 0.6,
      "pct_heridos_leves_menos_72h": 0.4
    },
    "bajas_no_combate": {
      "pct_muertos": 0.1,
      "pct_heridos": 0.9
    }
  }
}
```

**Acción**:
- ✅ Crear JSON con 23 parámetros reales
- ⚠️ **Falta**: Algoritmo de cálculo (necesita ejecutar HEM Bajas)

---

#### 1.3 **Crear `municiones_logistica.json`** (NUEVO)
```bash
Server/data/municiones_logistica.json (NUEVO - validado BV8)
```

**Estructura**:
```json
{
  "version": "1.0.0",
  "source": "Batalla Virtual 8 - Planeamiento Logístico rev 7.01.004",
  "descripcion": "Tipos de municiones y efectos logísticos reales",
  
  "cajones": {
    "CART_762": {
      "id": 1,
      "nombre": "Cart 7.62",
      "volumen_m3": 56,
      "peso_kg": 1200,
      "descripcion": "Cartuchos 7.62mm (FAL, MAG)"
    },
    "CART_9X19": {
      "id": 2,
      "nombre": "Cart 9x19",
      "volumen_m3": 63,
      "peso_kg": 800,
      "descripcion": "Cartuchos 9mm (pistolas, subametralladoras)"
    },
    "COH_889": {
      "id": 3,
      "nombre": "Cohetes 88.9",
      "volumen_m3": 0.195,
      "peso_kg": 25,
      "descripcion": "Cohetes LAW 88.9mm AT"
    },
    ... (46 tipos totales)
  },
  
  "insumos_basicos": {
    "agua": {
      "unidad": "litros",
      "consumo_diario_persona": 3.5,
      "nivel_critico_pct": 30
    },
    "viveres": {
      "unidad": "raciones",
      "consumo_diario_persona": 3,
      "nivel_critico_pct": 25
    },
    "nafta": {
      "unidad": "litros",
      "nivel_critico_pct": 20
    },
    "gasoil": {
      "unidad": "litros",
      "nivel_critico_pct": 20
    },
    "claseV": {
      "unidad": "kg",
      "nivel_critico_pct": 15,
      "descripcion": "Municiones y explosivos (Clase V OTAN)"
    }
  }
}
```

**Acción**:
- ✅ Crear JSON con 46 cajones + 5 insumos
- ⚠️ **Falta**: Pesos kg y consumos (necesita ejecutar HEM Logística)

---

#### 1.4 **Actualizar `factores_clima.json`** (REDISEÑO)

**Problema actual**: Estados discretos (LLUVIA, NIEVE, etc.)

**BV8 Real**: Sistema de eventos con valores continuos

**Nueva estructura**:
```json
{
  "version": "2.0.0",
  "source": "Batalla Virtual 8 - Sistema climático",
  "descripcion": "Sistema de eventos climáticos con valores continuos",
  
  "eventos_activos": [],
  
  "tipos_eventos": {
    "PRECIPITACION": {
      "subtipos": ["lluvia", "nieve", "granizo", "aguanieve"],
      "intensidad_mm_h": {
        "leve": [0.1, 2.5],
        "moderada": [2.5, 10],
        "fuerte": [10, 50],
        "torrencial": [50, 200]
      },
      "efectos": {
        "visibilidad_factor": "function(intensidad)",
        "movilidad_factor": "function(intensidad, tipo)",
        "moral_factor": "function(intensidad, duracion)"
      }
    },
    "NIEBLA": {
      "densidad_m": {
        "leve": [500, 1000],
        "moderada": [200, 500],
        "densa": [50, 200],
        "muy_densa": [0, 50]
      },
      "efectos": {
        "visibilidad_factor": "function(densidad)"
      }
    },
    "REGULAR": {
      "descripcion": "Clima normal sin eventos especiales",
      "temperatura_celsius": [-30, 50],
      "efectos": {
        "rendimiento_factor": "function(temperatura)"
      }
    }
  },
  
  "configuracion_ejercicio": {
    "temperatura_actual": 15,
    "iluminacion": "dia",
    "eventos_programados": []
  }
}
```

**Acción**:
- ✅ Rediseñar sistema climático completo
- ⚠️ **Falta**: Funciones de efectos (necesita reverse engineering BV8)

---

### **Fase 2: Servicios Python** ⏱️ 4-6 horas

#### 2.1 **Crear `Server/services/bv8/`**

**Estructura**:
```
Server/services/bv8/
├── __init__.py
├── bajas_service.py        # Cálculo de bajas (23 factores)
├── logistica_service.py    # Consumo insumos (46 cajones)
├── terreno_service.py      # Análisis terreno (8 tipos)
├── clima_service.py        # Sistema climático (eventos)
└── utils.py                # Funciones compartidas
```

**Prioridad**:
1. `terreno_service.py` - Más simple, solo mapeo
2. `bajas_service.py` - Crítico para combate
3. `logistica_service.py` - Necesario para sostenibilidad
4. `clima_service.py` - Efectos secundarios

---

#### 2.2 **Implementar `terreno_service.py`**

```python
"""
Servicio de análisis de terreno basado en BV8
"""
import json
from pathlib import Path

class TerrenoService:
    def __init__(self):
        # Cargar factores_terreno.json
        data_path = Path(__file__).parent.parent.parent / 'data' / 'factores_terreno.json'
        with open(data_path) as f:
            self.data = json.load(f)
    
    def traducir_igm(self, nombre_igm: str) -> dict:
        """
        Traduce nomenclatura IGM a tipo modelado
        
        Args:
            nombre_igm: Nombre según mapa IGM (ej: "Médano, duna")
        
        Returns:
            dict con tipo_modelado, efectos de movilidad/cobertura
        """
        tipo_id = self.data['traductor_igm']['mapeo'].get(nombre_igm)
        if not tipo_id:
            return {"error": f"Tipo '{nombre_igm}' no encontrado"}
        
        tipo_data = self.data['tipos_modelados'][tipo_id]
        return {
            "tipo": tipo_id,
            "nombre": tipo_data['nombre'],
            "efectos": tipo_data['efectos']
        }
    
    def calcular_movilidad(self, tipo_terreno: str, tipo_unidad: str) -> float:
        """
        Calcula factor de movilidad según terreno y tipo de unidad
        
        Args:
            tipo_terreno: ID del tipo (ej: "ARENAL", "INTRANSITABLE")
            tipo_unidad: "vehiculo" o "personal"
        
        Returns:
            float entre 0.0 (inmóvil) y 1.0 (velocidad normal)
        """
        tipo_data = self.data['tipos_modelados'].get(tipo_terreno)
        if not tipo_data:
            return 1.0  # Default
        
        if tipo_unidad == "vehiculo":
            return tipo_data['efectos']['movilidad_vehiculos']
        elif tipo_unidad == "personal":
            return tipo_data['efectos']['movilidad_personal']
        else:
            return 1.0
    
    def get_cobertura(self, tipo_terreno: str) -> float:
        """Factor de cobertura (0.0 = sin cobertura, 1.0 = cobertura total)"""
        tipo_data = self.data['tipos_modelados'].get(tipo_terreno)
        if not tipo_data:
            return 0.0
        return tipo_data['efectos']['cobertura']
```

---

#### 2.3 **Implementar `bajas_service.py`**

```python
"""
Servicio de cálculo de bajas basado en BV8 (23 factores)
"""
import json
from pathlib import Path

class BajasService:
    def __init__(self):
        data_path = Path(__file__).parent.parent.parent / 'data' / 'factores_bajas.json'
        with open(data_path) as f:
            self.data = json.load(f)
        
        self.factores = self.data['factores_cuantitativos']
    
    def calcular_bajas_combate(
        self, 
        efectivo_inicial: int,
        poder_fuego_atacante: float,
        poder_fuego_defensor: float,
        **factores_cualitativos
    ) -> dict:
        """
        Calcula distribución de bajas en combate
        
        Args:
            efectivo_inicial: Personal inicial
            poder_fuego_atacante: Índice poder de fuego (0-1000)
            poder_fuego_defensor: Índice poder de fuego (0-1000)
            **factores_cualitativos: 12 factores (apoyoDeMaterial, pcr, etc.)
        
        Returns:
            dict con muertos, heridos, desaparecidos, PG, profugos
        """
        
        # TODO: Implementar algoritmo real de BV8
        # Por ahora usamos factores base
        
        # 1. Calcular bajas totales (método simple)
        ratio_fuego = poder_fuego_atacante / max(poder_fuego_defensor, 1)
        bajas_totales = int(efectivo_inicial * 0.15 * ratio_fuego)  # Placeholder
        
        # 2. Separar combate/no combate
        bajas_combate = int(bajas_totales * self.factores['distribucion_bajas']['pct_bajas_combate'])
        bajas_no_combate = bajas_totales - bajas_combate
        
        # 3. Distribuir bajas de combate
        bc = self.factores['bajas_combate']
        muertos_comb = int(bajas_combate * bc['pct_muertos'])
        heridos_comb = int(bajas_combate * bc['pct_heridos'])
        desaparecidos = int(bajas_combate * bc['pct_desaparecidos'])
        prisioneros = int(bajas_combate * bc['pct_prisioneros'])
        profugos = int(bajas_combate * bc['pct_profugos'])
        
        # 4. Clasificar heridos
        ch = self.factores['clasificacion_heridos']
        heridos_graves = int(heridos_comb * ch['pct_heridos_graves_mas_72h'])
        heridos_leves = heridos_comb - heridos_graves
        
        # 5. Bajas no combate
        bnc = self.factores['bajas_no_combate']
        muertos_no_comb = int(bajas_no_combate * bnc['pct_muertos'])
        heridos_no_comb = bajas_no_combate - muertos_no_comb
        
        return {
            "total_bajas": bajas_totales,
            "combate": {
                "muertos": muertos_comb,
                "heridos_graves_mas_72h": heridos_graves,
                "heridos_leves_menos_72h": heridos_leves,
                "desaparecidos": desaparecidos,
                "prisioneros": prisioneros,
                "profugos": profugos
            },
            "no_combate": {
                "muertos": muertos_no_comb,
                "heridos": heridos_no_comb
            },
            "efectivo_final": efectivo_inicial - bajas_totales,
            "advertencia": "Algoritmo simplificado - requiere reverse engineering de BV8"
        }
```

**⚠️ CRÍTICO**: Necesitamos el **algoritmo real de BV8** para aplicar los 12 factores cualitativos.

---

### **Fase 3: Reverse Engineering de Algoritmos** ⏱️ 6-10 horas

**Objetivo**: Descubrir **cómo** BV8 usa los datos que ya extraímos.

#### 3.1 **Ejecutar HEM Bajas de Combate**

**Plan**:
1. Ejecutar `wine ~/.wine/drive_c/Program\ Files\ (x86)/Aplicaciones\ Militares/Estimación\ de\ Bajas\ de\ Combate/8/Bajas.exe`
2. Ingresar escenarios de prueba con valores conocidos
3. Capturar resultados y **reverse engineer** fórmula
4. Implementar en `bajas_service.py`

**Variables a probar**:
- Poder de fuego atacante/defensor (0-1000)
- Cada uno de los 12 factores cualitativos
- Observar cómo cambia distribución de bajas

---

#### 3.2 **Ejecutar HEM Planeamiento Logístico**

**Plan**:
1. Ejecutar `wine ~/.wine/drive_c/.../Planeamiento\ Logístico/8/Logistica.exe`
2. Crear unidades de prueba con diferentes dotaciones
3. Simular consumos en diferentes escenarios
4. Extraer fórmulas de consumo diario

**Descubrir**:
- Consumo agua/víveres por persona/día
- Consumo combustible por km/vehículo
- Consumo munición por disparo/arma
- Cálculo de transporte necesario (m³, ton)

---

#### 3.3 **Ejecutar HEM Estudio del Terreno**

**Plan**:
1. Ejecutar `wine ~/.wine/drive_c/.../Estudio\ del\ Terreno/8/Terreno.exe`
2. Cargar diferentes tipos de terreno
3. Analizar efectos en movilidad/observación
4. Extraer factores numéricos

**Descubrir**:
- Factores de movilidad vehicular/personal por tipo
- Factores de observación/cobertura
- Cómo se combinan múltiples tipos en un hex

---

#### 3.4 **Ejecutar Batalla Virtual Servidor**

**Plan**:
1. Ejecutar `wine ~/.wine/drive_c/.../Batalla\ Virtual/8/Servidor/BVServidor.exe`
2. Verificar REST API en `http://localhost:8080`
3. Analizar endpoints disponibles:
   - `GET /gestorSimulador/estado`
   - `POST /ejercicio/crear`
   - `GET /ambiente/clima`
   - etc.
4. Documentar API completa para `BV8API.js`

---

### **Fase 4: Implementación en MAIRA** ⏱️ 8-12 horas

#### 4.1 **Actualizar `BV8API.js`**

Conectar a servicios Python reales:

```javascript
// Client/js/modules/bv8/BV8API.js

async estimarBajas(parametros) {
    const response = await fetch('/api/bv8/bajas/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parametros)
    });
    return await response.json();
}

async analizarTerreno(coordenadas) {
    const response = await fetch(`/api/bv8/terreno/analizar`, {
        method: 'POST',
        body: JSON.stringify({ coordenadas })
    });
    return await response.json();
}
```

#### 4.2 **Integrar en simulador existente**

Modificar `Client/js/modules/juegoV2/` para usar datos BV8:

```javascript
// Antes (datos inventados):
const bajas = calcularBajasGenericas(atacante, defensor);

// Después (datos reales BV8):
const bajas = await BV8API.estimarBajas({
    efectivo_inicial: defensor.personal,
    poder_fuego_atacante: atacante.poderFuego,
    poder_fuego_defensor: defensor.poderFuego,
    apoyoDeMaterial: atacante.artilleria ? 'alto' : 'bajo',
    pcr: defensor.posicionOrganizada,
    tipoDeOperacion: 'ofensiva',
    // ... 12 factores
});
```

---

## 📊 Resumen de Acciones

### ✅ **HACER AHORA** (Fase 1 - 2-3 horas):
1. Crear `Server/data/factores_terreno.json` con 8 tipos BV8 + traductor IGM
2. Crear `Server/data/factores_bajas.json` con 23 parámetros reales
3. Crear `Server/data/municiones_logistica.json` con 46 cajones + 5 insumos
4. Rediseñar `Server/data/factores_clima.json` con sistema de eventos

### ⏳ **DESPUÉS** (Fase 2 - 4-6 horas):
5. Implementar `Server/services/bv8/terreno_service.py`
6. Implementar `Server/services/bv8/bajas_service.py` (simplificado)
7. Implementar `Server/services/bv8/logistica_service.py` (simplificado)
8. Implementar `Server/services/bv8/clima_service.py`

### 🔬 **INVESTIGACIÓN** (Fase 3 - 6-10 horas):
9. Ejecutar HEM Bajas → extraer algoritmo real
10. Ejecutar HEM Logística → extraer fórmulas consumo
11. Ejecutar HEM Terreno → extraer factores numéricos
12. Ejecutar BV Servidor → documentar REST API

### 🚀 **INTEGRACIÓN** (Fase 4 - 8-12 horas):
13. Actualizar servicios Python con algoritmos reales
14. Conectar `BV8API.js` a servicios
15. Modificar simulador para usar datos BV8
16. Testing y validación

---

## 🎯 Decisión: JSON vs Base de Datos

### **Recomendación: MANTENER JSON** (por ahora)

**Ventajas**:
- ✅ Datos de **configuración estática** (factores no cambian durante ejecución)
- ✅ Fácil **versionado con Git**
- ✅ **Rápido acceso** en memoria (cargar 1 vez al inicio)
- ✅ **Portable** sin dependencias DB

**Usar DB solo para**:
- Estado de ejercicios (posiciones, bajas acumuladas, consumos)
- Logs de combate
- Estadísticas de sesión

**Arquitectura propuesta**:
```
JSONs (configuración):
├── factores_terreno.json       (estático)
├── factores_bajas.json          (estático)
├── municiones_logistica.json    (estático)
└── factores_clima.json          (estático)

SQLite/PostgreSQL (estado dinámico):
├── ejercicios_activos
├── eventos_combate
├── consumos_logisticos
└── estadisticas_unidades
```

---

## 🚀 Siguiente Paso Inmediato

**¿Empezamos con la Fase 1?**

Creo 4 JSONs validados con datos reales de BV8 en 2-3 horas. Luego vemos si ejecutamos HEM tools o implementamos servicios Python primero.

**¿Procedo?** 🎯
