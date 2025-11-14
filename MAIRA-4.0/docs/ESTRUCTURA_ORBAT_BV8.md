# 🎖️ Estructura ORBAT de Batalla Virtual 8

## 📋 Modelo de Datos Descubierto

### **Jerarquía Completa**

```
ElementoJerarquico (abstracto)
├── id: int
├── identificador: string
├── nombre: string
├── tipo: string
├── clase: string
├── elementoDeQuienDepende: int (FK)
├── elementos[]: ElementoJerarquico (hijos)
│
├── Bando
│   └── color: string
│
└── ElementoPosicionable
    ├── poderDeCombate: float
    ├── coordenadas: Coordenada
    ├── estado: EstadoElemento
    ├── situacionDeCombate: SituacionCombate
    ├── frente: int (metros)
    ├── profundidad: int (metros)
    │
    ├── dotacion: DotacionElemento ← DOTACIÓN TOTAL UNIDAD
    │   └── insumos[]: Insumo
    │       ├── nombre: string (agua, viveres, nafta, gasoil, claseV)
    │       ├── cantInic: float (cantidad inicial)
    │       ├── cantAct: float (cantidad actual)
    │       └── clase: string
    │
    ├── reabastecimiento: DotacionElemento ← REABASTECIEMIENTO
    │
    ├── personal[]: PersonaBatalla ← PERSONAL INDIVIDUAL
    │   ├── id: int
    │   ├── rolPrincipal: string ← ¡ROL! (tirador, ametrallador, conductor, etc.)
    │   ├── grado: string (soldado, cabo, sargento, etc.)
    │   ├── numeroOrden: string
    │   ├── orgComb: int (organización de combate)
    │   ├── danio: EstadoDeDanio
    │   │   ├── categoria: int (0=sano, 1-5=herido, 6=muerto)
    │   │   └── descripcion: string
    │   ├── arma: Arma ← ARMAMENTO INDIVIDUAL
    │   │   ├── tipo: string (FAL, MAG, M2, LAW, etc.)
    │   │   ├── bdId: int (ID en base datos CCOO)
    │   │   └── danio: EstadoDeDanio
    │   ├── dispositivosDLI[]: DispositivoDLI
    │   └── dotacion: DotacionElemento ← ¡DOTACIÓN POR PERSONA!
    │       └── insumos[]: Insumo
    │           ├── agua: float (litros)
    │           ├── viveres: float (raciones)
    │           ├── municion: float (cantidad según arma)
    │
    └── vehiculos[]: VehiculoGenerico ← VEHÍCULOS
        ├── id: int
        ├── bdId: int (ID en CCOO: M113, TAM, VCTP, etc.)
        ├── danio: EstadoDeDanio
        ├── coordenadas: Coordenada
        ├── personal[]: PersonaBatalla ← TRIPULACIÓN del vehículo
        ├── armasColectivas[]: Arma ← ARMAMENTO del vehículo
        │   ├── MAG 7.62mm (coaxial)
        │   ├── M2 12.7mm (torre)
        │   ├── Cañón 105mm (TAM)
        │   └── etc.
        ├── acoplado: Acoplado ← REMOLQUE/TRAILER
        └── dotacion: DotacionElemento ← DOTACIÓN del vehículo
            └── insumos[]:
                ├── nafta/gasoil: float (litros)
                ├── municion_armasColectivas: float
                └── etc.
```

---

## 🎯 **CONCEPTO CLAVE: Dotaciones Bottom-Up**

### **Agregación Jerárquica**

```
TIRADOR (PersonaBatalla)
├── rolPrincipal: "Tirador FAL"
├── arma: FAL 7.62mm
└── dotacion:
    ├── agua: 3.5 litros
    ├── viveres: 3 raciones
    └── municion_762: 300 cartuchos (10 cargadores x 30)
                      ↓ multiplicar x cantidad tiradores
EQUIPO (4 tiradores FAL + 1 ametrallador MAG)
├── personal[5]:
│   ├── [0-3]: Tirador FAL (x4)
│   │   └── municion_762: 300 c/u = 1,200 cartuchos
│   └── [4]: Ametrallador MAG
│       └── municion_762: 600 cartuchos (cintas)
└── dotacion (SUMA):
    ├── agua: 17.5 litros (5 personas x 3.5)
    ├── viveres: 15 raciones (5 x 3)
    └── municion_762: 1,800 cartuchos TOTAL
                      ↓ multiplicar x cantidad equipos
GRUPO (2 equipos)
└── dotacion:
    ├── agua: 35 litros
    ├── viveres: 30 raciones
    └── municion_762: 3,600 cartuchos
                      ↓ multiplicar x cantidad grupos
SECCIÓN (3 grupos + 1 M113 con MAG 12.7)
├── personal[30]: (3 grupos x 10 personas)
├── vehiculos[1]:
│   └── M113:
│       ├── armasColectivas[1]:
│       │   └── M2 12.7mm
│       └── dotacion:
│           ├── gasoil: 360 litros (autonomía)
│           └── municion_127: 2,000 cartuchos (M2)
└── dotacion (SUMA):
    ├── agua: 105 litros
    ├── viveres: 90 raciones
    ├── municion_762: 10,800 cartuchos (personal)
    ├── municion_127: 2,000 cartuchos (M113)
    └── gasoil: 360 litros
                      ↓ multiplicar x cantidad secciones
COMPAÑÍA (4 secciones)
└── dotacion:
    ├── agua: 420 litros
    ├── viveres: 360 raciones
    ├── municion_762: 43,200 cartuchos
    ├── municion_127: 8,000 cartuchos
    └── gasoil: 1,440 litros
```

**¡ESTE ES EL MODELO QUE NECESITAMOS IMPLEMENTAR!**

---

## 🔍 Datos Descubiertos de CCOO

### **Tipos de Brigadas Argentinas** (8 tipos)

```
1. Brigada (EA) - Ejército Argentino genérica
2. Brigada Blindada
3. Brigada de Asalto Aéreo
4. Brigada de Montaña
5. Brigada de Monte
6. Brigada Mecanizada
7. Brigada Motorizada
8. Brigada Paracaidista
```

### **Vehículos Encontrados**

#### **TAM (Tanque Argentino Mediano)** - Familia completa:
```
- TAM (tanque base 105mm)
- VCTP TAM (Vehículo Comando y Transporte de Personal)
- VCA 155mm TAM (Vehículo de Combate Artillería)
- VCDT TAM (Vehículo Comando Director de Tiro)
- VCPC TAM (Vehículo Comando Puesto de Comando)
- VCAmb TAM (Ambulancia)
- VCAmun TAM (Municiones)
- VCRecup TAM (Recuperador)
- VCTM TAM (Taller Móvil)
```

#### **M113** - Variantes:
```
- M113 (transporte base)
- VCPC M113 (Puesto Comando)
- VCAmb M113 (Ambulancia)
- VCRecup M113 (Recuperador)
- M113 Descontaminación
```

#### **Otros**:
```
- VCTP (Vehículo Combate Transporte Personal genérico)
- VLEGA (Vehículo Ligero del Ejército Argentino)
- UNIMOG
- Grupo Electrógeno
```

### **Armamento Individual Encontrado**

```
FUSILES:
- FAL 7.62mm (estándar)
- FAL 5.56mm PARA (paracaidistas)
- Fusil Tirador Especial 7.62mm
- Fusil Tirador Especial 12.7mm

AMETRALLADORAS:
- MAG 7.62mm (ligera, bipode)
- M2 BMG 12.7mm (pesada, torre/tripode)
- MAG Torre (montada en vehículo)
- MAG POPA (puerta trasera vehículo)

ANTITANQUE:
- LAW 88.9mm (cohetes)
- Carl Gustav 84mm
- Misiles AT

APOYO:
- Mortero 60mm
- Mortero 81mm
- Mortero 120mm
- Lanzagranadas 40mm
```

### **Roles de PersonaBatalla Encontrados**

```
COMBATE:
- Tirador (FAL, FAL PARA)
- Tirador Especial (francotirador)
- Ametrallador (MAG)
- Apuntador MAG
- Auxiliar MAG
- Apuntador Mortero
- Auxiliar Mortero
- Apuntador AT (antitanque)
- Auxiliar AT

VEHÍCULOS:
- Conductor
- Jefe de Tanque
- Tirador (cañonero tanque)
- Cargador (municiones tanque)
- Radio-operador

COMANDO:
- Jefe de Grupo
- Jefe de Sección
- Jefe de Compañía
- Comandante de Batallón

APOYO:
- Enfermero
- Ingeniero
- Operador DLI
- Radio-operador
```

---

## 📦 Modelo de Dotaciones por Rol

### **Insumos Básicos** (5 clases)

```javascript
{
  "agua": {
    "unidad": "litros",
    "consumo_diario_persona": 3.5
  },
  "viveres": {
    "unidad": "raciones",
    "consumo_diario_persona": 3
  },
  "nafta": {
    "unidad": "litros",
    "uso": "vehiculos_livianos"
  },
  "gasoil": {
    "unidad": "litros",
    "uso": "vehiculos_pesados_tanques"
  },
  "claseV": {
    "unidad": "kg",
    "descripcion": "Municiones y explosivos (Clase V OTAN)",
    "subtipos": [
      "municion_762",    // Cart 7.62mm (FAL, MAG)
      "municion_556",    // Cart 5.56mm (FAL PARA)
      "municion_9mm",    // Cart 9x19mm (pistolas)
      "municion_127",    // Cart 12.7mm (M2)
      "municion_40mm",   // Granadas 40mm
      "cohetes_889",     // LAW 88.9mm
      "proy_60mm",       // Mortero 60mm
      "proy_81mm",       // Mortero 81mm
      "proy_120mm",      // Mortero 120mm
      "proy_105mm",      // Cañón TAM 105mm
      "proy_155mm"       // Obús 155mm
    ]
  }
}
```

### **Dotaciones por Rol** (ejemplos estimados - REQUIERE VALIDACIÓN)

```javascript
{
  "roles": {
    "tirador_fal": {
      "rol": "Tirador FAL",
      "arma": "FAL 7.62mm",
      "dotacion_inicial": {
        "agua": 3.5,              // litros (1 día)
        "viveres": 3,             // raciones (1 día)
        "municion_762": 300       // 10 cargadores x 30 cartuchos
      }
    },
    "ametrallador_mag": {
      "rol": "Ametrallador MAG",
      "arma": "MAG 7.62mm",
      "dotacion_inicial": {
        "agua": 3.5,
        "viveres": 3,
        "municion_762": 600       // Cintas (más que tirador)
      }
    },
    "apuntador_at": {
      "rol": "Apuntador Antitanque",
      "arma": "LAW 88.9mm",
      "dotacion_inicial": {
        "agua": 3.5,
        "viveres": 3,
        "municion_762": 150,      // FAL secundaria
        "cohetes_889": 4          // 4 cohetes LAW
      }
    },
    "tripulante_m113": {
      "rol": "Conductor M113",
      "vehiculo": "M113",
      "dotacion_inicial": {
        "agua": 3.5,
        "viveres": 3,
        "municion_9mm": 45        // Pistola 9mm
      }
    }
  },
  
  "vehiculos": {
    "m113": {
      "nombre": "M113",
      "tipo": "VehiculoGenerico",
      "bdId": 12345,              // ID en CCOO
      "tripulacion_minima": 2,    // conductor + jefe
      "capacidad_transporte": 11, // personas
      "armasColectivas": [
        {
          "tipo": "M2 12.7mm",
          "posicion": "torre",
          "municion_inicial": 2000
        }
      ],
      "dotacion_inicial": {
        "gasoil": 360,            // litros (autonomía ~300km)
        "municion_127": 2000      // M2
      },
      "consumo_por_km": {
        "gasoil": 1.2             // litros/km
      }
    },
    "tam": {
      "nombre": "TAM",
      "tipo": "VehiculoGenerico",
      "bdId": 12346,
      "tripulacion_minima": 4,    // jefe, tirador, cargador, conductor
      "armasColectivas": [
        {
          "tipo": "Cañón 105mm",
          "municion_inicial": 50
        },
        {
          "tipo": "MAG 7.62mm coaxial",
          "municion_inicial": 6000
        },
        {
          "tipo": "MAG 7.62mm torre",
          "municion_inicial": 2000
        }
      ],
      "dotacion_inicial": {
        "gasoil": 640,            // litros (autonomía ~500km)
        "proy_105mm": 50,
        "municion_762": 8000      // MAG coaxial + torre
      },
      "consumo_por_km": {
        "gasoil": 1.28            // litros/km
      }
    }
  }
}
```

---

## 🎯 Estrategia de Implementación

### **Fase 1: Extraer Catálogos Completos** ⏱️ 2-4 horas

#### 1.1 **Decodificar `dbDatos.data`**

**Objetivo**: Extraer tablas completas de CCOO:
- Tabla `Elemento` (Brigadas, Batallones, Compañías, etc.)
- Tabla `Persona` (Roles con armamento y dotaciones)
- Tabla `Vehiculo` (M113, TAM, etc. con tripulación y armamento)

**Opciones**:

**A) Ejecutar CCOO.exe y exportar** (preferido):
```bash
wine ~/.wine/drive_c/.../CCOO.exe
# Usar interfaz para:
# 1. Abrir base datos
# 2. Exportar a XML/CSV todas las unidades
# 3. Copiar resultados
```

**B) Reverse engineering del formato STB**:
```python
# Dolphin Smalltalk Binary format
# Buscar librería Python o escribir parser
import struct

def parse_stb_file(filepath):
    with open(filepath, 'rb') as f:
        magic = f.read(8)  # "!STB 1 \x06\x15\x07"
        # ... parsear estructuras
```

**C) Extraer strings y reconstruir** (última opción):
```bash
strings dbDatos.data | grep -E "^[A-Z]" > unidades.txt
# Procesar manualmente
```

#### 1.2 **Crear JSONs de Catálogos**

**Archivos a crear**:

```
Server/data/catalogos_bv8/
├── roles_personal.json          # 30+ roles con armamento
├── tipos_vehiculos.json         # M113, TAM, VCTP, etc.
├── tipos_armamento.json         # FAL, MAG, M2, LAW, etc.
├── tipos_unidades.json          # Brigada, Batallón, Compañía, etc.
└── dotaciones_por_rol.json      # Agua, víveres, munición por rol
```

**Ejemplo `roles_personal.json`**:
```json
{
  "version": "1.0.0",
  "source": "BV8 CCOO - dbDatos.data",
  "roles": [
    {
      "id": 1,
      "nombre": "Tirador FAL",
      "rolPrincipal": "tirador_fal",
      "grado_tipico": "soldado",
      "orgComb": 1,
      "armamento": {
        "principal": {
          "tipo": "FAL 7.62mm",
          "bdId": 101,
          "municion_tipo": "municion_762",
          "municion_inicial": 300
        },
        "secundario": null
      },
      "equipamiento": [
        "uniforme_combate",
        "casco",
        "chaleco_antibalas",
        "mochila_combate"
      ],
      "dotacion_diaria": {
        "agua": 3.5,
        "viveres": 3
      }
    },
    {
      "id": 2,
      "nombre": "Ametrallador MAG",
      "rolPrincipal": "ametrallador_mag",
      "grado_tipico": "soldado",
      "orgComb": 1,
      "armamento": {
        "principal": {
          "tipo": "MAG 7.62mm",
          "bdId": 102,
          "municion_tipo": "municion_762",
          "municion_inicial": 600
        },
        "secundario": {
          "tipo": "Pistola 9mm",
          "municion_tipo": "municion_9mm",
          "municion_inicial": 45
        }
      },
      "dotacion_diaria": {
        "agua": 3.5,
        "viveres": 3
      },
      "requiere_auxiliar": true
    }
    // ... 30+ roles más
  ]
}
```

---

### **Fase 2: Construir Unidades Tipo** ⏱️ 4-6 horas

#### 2.1 **Definir Estructuras Estándar**

**Archivo**: `Server/data/toe_bv8/unidades_tipo.json`

```json
{
  "version": "1.0.0",
  "source": "BV8 CCOO TO&E Argentina",
  
  "equipo_fusileros": {
    "nivel": "equipo",
    "tipo": "infanteria",
    "efectivo": 5,
    "composicion": [
      { "rol": "jefe_equipo", "grado": "cabo", "cantidad": 1 },
      { "rol": "tirador_fal", "grado": "soldado", "cantidad": 3 },
      { "rol": "ametrallador_mag", "grado": "soldado", "cantidad": 1 }
    ],
    "dotacion_agregada": {
      "agua": 17.5,
      "viveres": 15,
      "municion_762": 1800
    }
  },
  
  "grupo_fusileros": {
    "nivel": "grupo",
    "tipo": "infanteria",
    "efectivo": 10,
    "composicion": [
      { "rol": "jefe_grupo", "grado": "sargento", "cantidad": 1 },
      { "subunidad": "equipo_fusileros", "cantidad": 2 }
    ],
    "dotacion_agregada": {
      "agua": 35,
      "viveres": 30,
      "municion_762": 3600
    }
  },
  
  "seccion_fusileros_mecanizada": {
    "nivel": "seccion",
    "tipo": "infanteria_mecanizada",
    "efectivo": 31,
    "composicion": [
      { "rol": "jefe_seccion", "grado": "subteniente", "cantidad": 1 },
      { "subunidad": "grupo_fusileros", "cantidad": 3 },
      { "vehiculo": "m113", "tripulacion": 2, "cantidad": 1 }
    ],
    "vehiculos": [
      {
        "tipo": "m113",
        "cantidad": 1,
        "armamento": ["M2 12.7mm"],
        "transporte": 11
      }
    ],
    "dotacion_agregada": {
      "agua": 108.5,
      "viveres": 93,
      "municion_762": 10800,
      "municion_127": 2000,
      "gasoil": 360
    }
  }
  
  // ... Compañía, Batallón, Brigada...
}
```

#### 2.2 **Implementar Constructor de ORBAT**

**Archivo**: `Server/services/bv8/orbat_builder.py`

```python
"""
Constructor de ORBAT jerárquico con dotaciones bottom-up
Basado en modelo BV8 ElementoJerarquico → ElementoPosicionable
"""

import json
from pathlib import Path
from typing import Dict, List, Any

class ORBATBuilder:
    def __init__(self):
        # Cargar catálogos
        self.roles = self._load_json('catalogos_bv8/roles_personal.json')
        self.vehiculos = self._load_json('catalogos_bv8/tipos_vehiculos.json')
        self.unidades_tipo = self._load_json('toe_bv8/unidades_tipo.json')
    
    def construir_unidad(
        self, 
        tipo_unidad: str, 
        nombre: str,
        sidc: str = None
    ) -> Dict[str, Any]:
        """
        Construye una unidad completa con dotaciones agregadas
        
        Args:
            tipo_unidad: "equipo_fusileros", "seccion_mecanizada", etc.
            nombre: Nombre personalizado de la unidad
            sidc: Código SIDC/APP6 (opcional, se genera automático)
        
        Returns:
            ElementoPosicionable completo con personal[], vehiculos[], dotacion
        """
        plantilla = self.unidades_tipo[tipo_unidad]
        
        # Construir personal
        personal = []
        for composicion in plantilla['composicion']:
            if 'rol' in composicion:
                # Personal directo
                rol_data = self.roles[composicion['rol']]
                for i in range(composicion['cantidad']):
                    personal.append(self._crear_persona(rol_data, i))
            elif 'subunidad' in composicion:
                # Subunidad recursiva
                subunidad = self.construir_unidad(
                    composicion['subunidad'],
                    f"{nombre} - Sub {i}"
                )
                personal.extend(subunidad['personal'])
        
        # Construir vehículos
        vehiculos = []
        for vehiculo_config in plantilla.get('vehiculos', []):
            for i in range(vehiculo_config['cantidad']):
                vehiculos.append(self._crear_vehiculo(vehiculo_config, i))
        
        # Calcular dotación agregada
        dotacion = self._calcular_dotacion_total(personal, vehiculos)
        
        return {
            "tipo": "ElementoPosicionable",
            "nombre": nombre,
            "nivel": plantilla['nivel'],
            "efectivo": len(personal),
            "sidc": sidc or self._generar_sidc(plantilla),
            "poderDeCombate": self._calcular_poder_combate(personal, vehiculos),
            "personal": personal,
            "vehiculos": vehiculos,
            "dotacion": dotacion,
            "reabastecimiento": None,
            "estado": {"descripcion": "EnZonaDeReunion"},
            "situacionDeCombate": {"valor": "AptoParaCombate"}
        }
    
    def _crear_persona(self, rol_data: Dict, index: int) -> Dict:
        """Crea PersonaBatalla según rol"""
        return {
            "id": self._generate_id(),
            "rolPrincipal": rol_data['rolPrincipal'],
            "grado": rol_data['grado_tipico'],
            "numeroOrden": f"{rol_data['rolPrincipal']}_{index:03d}",
            "orgComb": rol_data['orgComb'],
            "arma": {
                "tipo": rol_data['armamento']['principal']['tipo'],
                "bdId": rol_data['armamento']['principal']['bdId'],
                "danio": {"categoria": 0, "descripcion": "Operativo"}
            },
            "dotacion": {
                "insumos": [
                    {
                        "nombre": "agua",
                        "cantInic": rol_data['dotacion_diaria']['agua'],
                        "cantAct": rol_data['dotacion_diaria']['agua'],
                        "clase": "agua"
                    },
                    {
                        "nombre": "viveres",
                        "cantInic": rol_data['dotacion_diaria']['viveres'],
                        "cantAct": rol_data['dotacion_diaria']['viveres'],
                        "clase": "viveres"
                    },
                    {
                        "nombre": rol_data['armamento']['principal']['municion_tipo'],
                        "cantInic": rol_data['armamento']['principal']['municion_inicial'],
                        "cantAct": rol_data['armamento']['principal']['municion_inicial'],
                        "clase": "claseV"
                    }
                ]
            },
            "dispositivosDLI": [],
            "danio": {"categoria": 0, "descripcion": "Sano"}
        }
    
    def _crear_vehiculo(self, config: Dict, index: int) -> Dict:
        """Crea VehiculoGenerico con tripulación y armamento"""
        vehiculo_data = self.vehiculos[config['tipo']]
        
        # Crear tripulación
        tripulacion = []
        for rol_tripulante in vehiculo_data['tripulacion_roles']:
            tripulacion.append(self._crear_persona(
                self.roles[rol_tripulante],
                index
            ))
        
        # Crear armas colectivas
        armas = []
        for arma_config in vehiculo_data['armasColectivas']:
            armas.append({
                "tipo": arma_config['tipo'],
                "bdId": arma_config['bdId'],
                "danio": {"categoria": 0, "descripcion": "Operativo"}
            })
        
        return {
            "id": self._generate_id(),
            "bdId": vehiculo_data['bdId'],
            "tipo": config['tipo'],
            "personal": tripulacion,
            "armasColectivas": armas,
            "acoplado": None,
            "dotacion": {
                "insumos": [
                    {
                        "nombre": "gasoil",
                        "cantInic": vehiculo_data['dotacion_inicial']['gasoil'],
                        "cantAct": vehiculo_data['dotacion_inicial']['gasoil'],
                        "clase": "gasoil"
                    },
                    # ... munición armas colectivas
                ]
            },
            "danio": {"categoria": 0, "descripcion": "Operativo"}
        }
    
    def _calcular_dotacion_total(
        self, 
        personal: List[Dict], 
        vehiculos: List[Dict]
    ) -> Dict:
        """Agrega dotaciones de personal + vehículos"""
        total = {
            "insumos": []
        }
        
        # Sumar dotaciones de personal
        insumos_dict = {}
        for persona in personal:
            for insumo in persona['dotacion']['insumos']:
                nombre = insumo['nombre']
                if nombre not in insumos_dict:
                    insumos_dict[nombre] = {
                        "nombre": nombre,
                        "cantInic": 0,
                        "cantAct": 0,
                        "clase": insumo['clase']
                    }
                insumos_dict[nombre]['cantInic'] += insumo['cantInic']
                insumos_dict[nombre]['cantAct'] += insumo['cantAct']
        
        # Sumar dotaciones de vehículos
        for vehiculo in vehiculos:
            for insumo in vehiculo['dotacion']['insumos']:
                nombre = insumo['nombre']
                if nombre not in insumos_dict:
                    insumos_dict[nombre] = {
                        "nombre": nombre,
                        "cantInic": 0,
                        "cantAct": 0,
                        "clase": insumo['clase']
                    }
                insumos_dict[nombre]['cantInic'] += insumo['cantInic']
                insumos_dict[nombre]['cantAct'] += insumo['cantAct']
        
        total['insumos'] = list(insumos_dict.values())
        return total
    
    def _calcular_poder_combate(
        self, 
        personal: List[Dict], 
        vehiculos: List[Dict]
    ) -> float:
        """Calcula índice de poder de combate (simplificado)"""
        # TODO: Usar algoritmo real de BV8
        poder = 0.0
        
        # Personal
        for persona in personal:
            if persona['rolPrincipal'].startswith('tirador'):
                poder += 1.0
            elif persona['rolPrincipal'].startswith('ametrallador'):
                poder += 1.5
            elif 'at' in persona['rolPrincipal']:
                poder += 2.0
        
        # Vehículos
        for vehiculo in vehiculos:
            if 'TAM' in vehiculo['tipo']:
                poder += 10.0  # Tanque
            elif 'M113' in vehiculo['tipo']:
                poder += 2.0   # APC
        
        return poder
    
    def _generar_sidc(self, plantilla: Dict) -> str:
        """Genera código SIDC/APP6 automático"""
        # TODO: Implementar generación real SIDC
        nivel_map = {
            "equipo": "H",      # Team/Crew
            "grupo": "G",       # Squad
            "seccion": "F",     # Section
            "compania": "E",    # Company
            "batallon": "D",    # Battalion
            "brigada": "C"      # Brigade
        }
        
        return f"2.X.1.1.{nivel_map.get(plantilla['nivel'], 'X')}.-----"
    
    def _load_json(self, rel_path: str) -> Dict:
        """Carga JSON desde Server/data/"""
        path = Path(__file__).parent.parent.parent / 'data' / rel_path
        with open(path) as f:
            return json.load(f)
    
    def _generate_id(self) -> int:
        """Genera ID único"""
        import time
        return int(time.time() * 1000000) % 2**31
```

---

### **Fase 3: Integrar con MAIRA** ⏱️ 4-6 horas

#### 3.1 **Endpoint API**

**Archivo**: `Server/routes/bv8_routes.py`

```python
from flask import Blueprint, request, jsonify
from services.bv8.orbat_builder import ORBATBuilder

bv8_bp = Blueprint('bv8', __name__, url_prefix='/api/bv8')
builder = ORBATBuilder()

@bv8_bp.route('/orbat/construir', methods=['POST'])
def construir_unidad():
    """
    Construye unidad con dotaciones agregadas
    
    POST /api/bv8/orbat/construir
    {
      "tipo": "seccion_fusileros_mecanizada",
      "nombre": "Sección 1 - Compañía A",
      "sidc": "2.X.1.1.F.-----" (opcional)
    }
    
    Returns:
        ElementoPosicionable completo
    """
    data = request.get_json()
    
    unidad = builder.construir_unidad(
        tipo_unidad=data['tipo'],
        nombre=data['nombre'],
        sidc=data.get('sidc')
    )
    
    return jsonify(unidad), 200

@bv8_bp.route('/orbat/catalogos/roles', methods=['GET'])
def get_roles():
    """Lista todos los roles disponibles"""
    return jsonify(builder.roles), 200

@bv8_bp.route('/orbat/catalogos/vehiculos', methods=['GET'])
def get_vehiculos():
    """Lista todos los vehículos disponibles"""
    return jsonify(builder.vehiculos), 200

@bv8_bp.route('/orbat/catalogos/unidades-tipo', methods=['GET'])
def get_unidades_tipo():
    """Lista todas las unidades tipo (plantillas)"""
    return jsonify(builder.unidades_tipo), 200
```

#### 3.2 **Cliente JavaScript**

**Actualizar**: `Client/js/modules/bv8/BV8API.js`

```javascript
// Agregar métodos de ORBAT

async construirUnidad(tipo, nombre, sidc = null) {
    const response = await fetch('/api/bv8/orbat/construir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, nombre, sidc })
    });
    return await response.json();
}

async getCatalogos() {
    const [roles, vehiculos, unidadesTipo] = await Promise.all([
        fetch('/api/bv8/orbat/catalogos/roles').then(r => r.json()),
        fetch('/api/bv8/orbat/catalogos/vehiculos').then(r => r.json()),
        fetch('/api/bv8/orbat/catalogos/unidades-tipo').then(r => r.json())
    ]);
    
    return { roles, vehiculos, unidadesTipo };
}
```

#### 3.3 **Reemplazar ORBAT.json**

```javascript
// Antes (ORBAT.json estático):
const orbat = await fetch('/config/ORBAT.json').then(r => r.json());

// Después (dinámico con BV8):
const seccion1 = await BV8API.construirUnidad(
    'seccion_fusileros_mecanizada',
    'Sección 1 - Cía A - RI 6'
);

// Acceso a dotaciones:
console.log(seccion1.dotacion.insumos);
// [
//   { nombre: "agua", cantAct: 108.5, clase: "agua" },
//   { nombre: "viveres", cantAct: 93, clase: "viveres" },
//   { nombre: "municion_762", cantAct: 10800, clase: "claseV" },
//   { nombre: "municion_127", cantAct: 2000, clase: "claseV" },
//   { nombre: "gasoil", cantAct: 360, clase: "gasoil" }
// ]

// Acceso a personal individual:
seccion1.personal.forEach(persona => {
    console.log(`${persona.grado} - ${persona.rolPrincipal}`);
    console.log(`  Munición: ${persona.dotacion.insumos.find(i => i.clase === 'claseV').cantAct}`);
});
```

---

## 📊 Próximos Pasos Inmediatos

### **¿Qué hacer ahora?** (orden sugerido)

1. **Extraer catálogo completo de `dbDatos.data`** (2-4h)
   - Intentar ejecutar CCOO.exe (resolver DLL faltante)
   - O parsear formato STB
   - O extraer strings y reconstruir manualmente
   
2. **Crear JSONs de catálogos** (2h)
   - `roles_personal.json` (30+ roles)
   - `tipos_vehiculos.json` (20+ vehículos)
   - `dotaciones_por_rol.json`

3. **Definir unidades tipo** (2h)
   - Equipo → Grupo → Sección → Compañía
   - Con composición y dotaciones agregadas

4. **Implementar `ORBATBuilder`** (4h)
   - Constructor recursivo bottom-up
   - Cálculo automático dotaciones
   - Generación SIDC

5. **Integrar en MAIRA** (2h)
   - Endpoints Flask
   - Cliente BV8API.js
   - Reemplazar ORBAT.json estático

---

## 🎯 ¿Por dónde empezamos?

**Opción A**: Ejecutar CCOO.exe (rápido si funciona)  
**Opción B**: Parsear dbDatos.data (más robusto)  
**Opción C**: Crear catálogos manualmente desde strings (lento pero seguro)

**¿Cuál prefieres?** 🚀
