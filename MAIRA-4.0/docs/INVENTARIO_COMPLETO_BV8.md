# 📊 INVENTARIO COMPLETO - BATALLA VIRTUAL 8 (2019)

**Fecha extracción**: 13 noviembre 2025  
**Ubicación**: `/Users/mac/.wine/drive_c/Program Files (x86)/Aplicaciones Militares`

---

## 🗂️ MÓDULOS IDENTIFICADOS

### 📁 HERRAMIENTAS DE ESTADO MAYOR (HEM) - 8 módulos

#### 1. ✅ Administración de CCOO (Cuadros de Organización)
```
Ejecutable: HACCOO_7_01_004.exe
Versión: 7.01.004
Carpeta: Administración de CCOO/8/
Status: ✅ EXTRAÍDO (ccoo_smalltalk.img - 8.12 MB)

Archivos clave:
- Datos/dbDatos.data (Dolphin STB - íconos)
- Smalltalk image en RCDATA
```

#### 2. ✅ Planeamiento Logístico
```
Ejecutable: HPL_7_01_004.exe
Versión: 7.01.004
Carpeta: Planeamiento Logístico/8/
Status: ✅ EXTRAÍDO (logistica_smalltalk.img - 8.09 MB)

Archivos clave:
- Recursos/Datos/configuracionCajones.xml ⭐
- Recursos/Datos/configuracionTransporte.xml ⭐
- Recursos/Datos/idRelacionCajonEfecto.xml ⭐
- Smalltalk image en RCDATA
```

#### 3. ✅ Estimación de Bajas de Combate
```
Ejecutable: HEBC_7_01_004.exe
Versión: 7.01.004
Carpeta: Estimación de Bajas de Combate/8/
Status: ✅ EXTRAÍDO (bajas_smalltalk.img - 7.59 MB)

Archivos clave:
- Smalltalk image en RCDATA
- Clases: BajasCombate, EstimacionDeBajas (22 clases)
```

#### 4. ✅ Estimación de Fallas
```
Ejecutable: HEF_7_01_003.exe
Versión: 7.01.003
Carpeta: Estimación de Fallas/8/
Status: ✅ EXTRAÍDO (fallas_smalltalk.img - 7.84 MB)

Archivos clave:
- Smalltalk image en RCDATA
- Clases: EstimacionDeFallas (44 clases)
```

#### 5. ✅ Estudio del Terreno
```
Ejecutable: HET_7_01_005.exe
Versión: 7.01.005
Carpeta: Estudio del Terreno/8/
Status: ✅ EXTRAÍDO (terreno_smalltalk.img - 8.66 MB)

Archivos clave:
- Recursos/Gdal_apps_dlls/ (GDAL GIS tools)
- Smalltalk image en RCDATA
- Clases: 26 relevantes para análisis terreno
```

#### 6. ⏳ Planeamiento de Ingenieros
```
Ejecutable: HPI_7_01_003.exe
Versión: 7.01.003
Carpeta: Planeamiento de Ingenieros/8/
Status: ⏳ PENDIENTE EXTRACCIÓN

Archivos a buscar:
- Smalltalk image en RCDATA
- XMLs de configuración (si hay)
```

#### 7. ❌ Dibujo Militar
```
Ejecutable: NO ENCONTRADO en instalación
Carpeta: (debería estar en /Dibujo Militar/8/)
Status: ❌ NO INSTALADO

Notas: Mencionado en documentación pero no instalado
```

#### 8. ❌ Planeamiento de Aerotransporte
```
Ejecutable: NO ENCONTRADO en instalación
Carpeta: (debería estar en /Planeamiento de Aerotransporte/)
Status: ❌ NO INSTALADO

Notas: Versión Beta según docs, no instalado
```

---

### 📁 BATALLA VIRTUAL (Simulación) - 3 módulos

#### 9. Batalla Virtual - Servidor
```
Ejecutable: Servidor_5_02_005.exe
Versión: 5.02.005
Carpeta: Batalla Virtual/8/Servidor/
Status: ⏳ NO ANALIZADO

Tipo: Servidor de simulación (probablemente C++ nativo)
```

#### 10. Batalla Virtual - Simulador
```
Ejecutable: Simulador_6_02_005.exe
Versión: 6.02.005
Carpeta: Batalla Virtual/8/Simulador/
Status: ⏳ NO ANALIZADO

Tipo: Motor de simulación (probablemente C++ nativo)
Archivos: CE_6_Plennus_v0.1.exe (compatibilizador)
```

#### 11. Batalla Virtual - Usuario
```
Ejecutable: Usuario_6_03_002.exe
Versión: 6.03.002
Carpeta: Batalla Virtual/8/Usuario/
Status: ⏳ NO ANALIZADO

Tipo: Cliente UI (probablemente C++ nativo)
```

#### 12. Batalla Virtual - CDT (Control De Tiro)
```
Ejecutable: CDT_3_02_005.exe
Versión: 3.02.005
Carpeta: Batalla Virtual/8/CDT/
Status: ⏳ NO ANALIZADO

Tipo: Control de tiro (probablemente C++ nativo)
```

---

### 📁 COMPONENTES BASE - 3 módulos

#### 13. Componente SIG (Sistema de Información Geográfica)
```
Ejecutable: (unins000.exe - instalador)
Carpeta: Componente SIG/
Subcarpetas:
- VistaSatelital/1.02/vistasatelital.exe

Status: ⏳ NO ANALIZADO
Tipo: Componente compartido para mapas
```

#### 14. Terreno 3D
```
Ejecutable: Terreno 3D.exe
Versión: 2.0
Carpeta: Terreno 3D/Terreno 3D 2.0/
Status: ⏳ NO ANALIZADO

Tipo: Visualización 3D terreno
```

#### 15. Plataformas (Runtime/Dependencies)
```
Carpeta: Plataformas/
Archivos:
- dotNetFx40_Full_x86_x64.exe (.NET Framework 4.0)
- jre-8u112-windows-i586.exe (Java Runtime 8)
- jre-8u112-windows-x64.exe (Java Runtime 64-bit)
- vc_redist.x86.exe (Visual C++ Redistributable)
- NDP47-KB3186497-x86-x64-AllOS-ENU.exe (.NET 4.7)

Status: ✅ IDENTIFICADO (no requiere extracción)
```

---

## 📊 RESUMEN ESTADÍSTICO

### Por Status de Extracción

| Status | Cantidad | Módulos |
|--------|----------|---------|
| ✅ EXTRAÍDO | 5 | CCOO, Logística, Bajas, Fallas, Terreno |
| ⏳ PENDIENTE | 1 | Ingenieros |
| ❌ NO INSTALADO | 2 | Dibujo Militar, Aerotransporte |
| ⏳ NO ANALIZADO | 5 | BV Servidor, Simulador, Usuario, CDT, SIG |
| ✅ IDENTIFICADO | 1 | Plataformas (runtime) |

**Total**: 14 módulos/componentes identificados

### Por Tecnología

| Tecnología | Cantidad | Módulos |
|------------|----------|---------|
| **Dolphin Smalltalk 7** | 6 | CCOO, Logística, Bajas, Fallas, Terreno, Ingenieros |
| **C/C++ Nativo** | 4-5 | BV Servidor, Simulador, Usuario, CDT (probablemente) |
| **Mixto/Desconocido** | 2 | SIG, Terreno 3D |
| **Runtime** | 1 | Plataformas |

### Archivos Extraídos (Hasta ahora)

| Tipo | Cantidad | Tamaño Total |
|------|----------|--------------|
| **Smalltalk Images (.img)** | 5 | 40.1 MB |
| **XMLs Configuración** | 3 | 17.5 KB |
| **STB Data Files (.data)** | 1 | ~varios KB |
| **Scripts Python** | 6 | 1,230 líneas |
| **Documentación** | 7 | 4,000+ líneas |

---

## 🎯 PRIORIDADES PARA EXTRACCIÓN

### ALTA Prioridad (Útil para MAIRA)

1. **✅ Planeamiento Logístico** - COMPLETADO
   - Dotaciones, consumos, cajones
   - **Utilidad MAIRA**: Cálculos logísticos realistas

2. **✅ Administración de CCOO** - COMPLETADO
   - Cuadros de organización, roles
   - **Utilidad MAIRA**: Estructuras organizativas validadas

3. **✅ Estimación de Bajas** - COMPLETADO
   - Algoritmos de cálculo de bajas
   - **Utilidad MAIRA**: Bajas realistas en JDG

4. **⏳ Planeamiento de Ingenieros** - PENDIENTE
   - Cálculos de ingeniería militar
   - **Utilidad MAIRA**: Planeamiento de obstáculos, fortificaciones

### MEDIA Prioridad (Posible utilidad)

5. **✅ Estimación de Fallas** - COMPLETADO
   - MTBF, tasas de falla vehículos
   - **Utilidad MAIRA**: Mantenimiento realista

6. **✅ Estudio del Terreno** - COMPLETADO
   - Análisis de terreno, GDAL
   - **Utilidad MAIRA**: Mejor análisis cartográfico

7. **⏳ Componente SIG** - NO ANALIZADO
   - Mapas, capas GIS
   - **Utilidad MAIRA**: Mejorar mapas existentes

### BAJA Prioridad (Más complejo, menos útil)

8. **⏳ Batalla Virtual Simulador** - NO ANALIZADO
   - Motor de simulación C++
   - **Utilidad MAIRA**: Muy complejo, código nativo

9. **❌ Dibujo Militar** - NO INSTALADO
   - Símbolos militares
   - **Utilidad MAIRA**: Ya tenemos símbolos en MAIRA

10. **❌ Aerotransporte** - NO INSTALADO
    - Planeamiento aéreo
    - **Utilidad MAIRA**: Fuera de scope actual

---

## 📁 ESTRUCTURA DE ARCHIVOS ENCONTRADA

### Patrón común en módulos Smalltalk:

```
Módulo/8/
├── {Ejecutable}.exe          (RCDATA tipo 10 → Smalltalk .img)
├── DolphinVM7.dll            (Runtime Smalltalk)
├── DolphinCR7.dll
├── DolphinDR7.dll
├── DolphinSureCrypto.dll
├── Recursos/
│   ├── Datos/               (XMLs de configuración)
│   ├── Imagenes/
│   ├── Impresion/
│   └── Skins/
├── Managers/                (Data managers)
└── Manuales/                (PDFs ayuda)
```

### XMLs por módulo:

| Módulo | XMLs Encontrados | Status |
|--------|------------------|--------|
| **Logística** | 3 (cajones, transporte, relaciones) | ✅ COPIADOS |
| **CCOO** | ? | ⏳ POR BUSCAR |
| **Bajas** | ? | ⏳ POR BUSCAR |
| **Fallas** | ? | ⏳ POR BUSCAR |
| **Terreno** | ? | ⏳ POR BUSCAR |
| **Ingenieros** | ? | ⏳ POR EXTRAER + BUSCAR |

---

## 🚀 PRÓXIMOS PASOS

### Fase 1: Completar Extracción Smalltalk (30 min)
- [ ] Extraer HPI_7_01_003.exe (Ingenieros)
- [ ] Buscar XMLs en CCOO, Bajas, Fallas, Terreno
- [ ] Copiar todos los XMLs encontrados

### Fase 2: Parseo y Conversión (1 hora)
- [ ] Parser universal de XMLs Smalltalk
- [ ] Convertir todos a JSON estructurado
- [ ] Categorizar por tipo de dato

### Fase 3: Análisis de Clases (2 horas)
- [ ] Para cada .img: listar clases críticas
- [ ] Identificar métodos con valores numéricos
- [ ] Crear índice maestro de clases/métodos

### Fase 4: Organización (1 hora)
- [ ] Crear estructura limpia bv8_extraido/
- [ ] Mover archivos a carpetas por módulo
- [ ] Archivar lo no útil

### Fase 5: Documentación (2 horas)
- [ ] BV8_MODULO_{nombre}.md para cada uno
- [ ] Índice maestro de hallazgos
- [ ] Priorización para integración MAIRA

### Fase 6: Integración Selectiva (3-4 horas)
- [ ] Dotaciones (Logística) → MAIRA
- [ ] CCOO (organizaciones) → MAIRA
- [ ] Bajas (algoritmos) → MAIRA
- [ ] Resto: archivar para futuro

---

## 📋 ARCHIVOS DE REFERENCIA

### Documentación Original BV8

```
Batalla Virtual 8 2019/Documentación/
├── Guia de Instalacion Batalla Virtual 2019 v1.5.pdf
├── Manual Bat Vir 2.03.doc
├── Notas de Lanzamiento 2019 v0.7.pdf
└── Tolerancia a Fallos 2019 v0.1.pdf
```

### Manuales por Módulo

- CCOO: `Administración de CCOO/8/Manuales/`
- Logística: `Planeamiento Logístico/8/Manuales/`
- Bajas: `Estimación de Bajas de Combate/8/Manuales/`
- Etc.

---

**Última actualización**: 13 nov 2025 - Día 2
**Progreso total**: 35% completado (5 de 14 módulos analizados)
