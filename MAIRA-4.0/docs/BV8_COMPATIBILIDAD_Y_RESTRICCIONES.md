# 🔒 BV8: Compatibilidad y Restricciones

**Fecha**: 14 noviembre 2025
**Principio**: "No romper nada existente - Solo agregar capacidades"

---

## 🎯 REGLA DE ORO

> **"Todo lo que hagamos debe mantener compatibilidad con lo actual"**

### Esto significa:

1. **No modificar funcionalidad existente** - Solo agregar nuevas opciones
2. **Usar mismos formatos** - JSON, estructuras de datos, eventos
3. **Reutilizar código existente** - No duplicar lógica
4. **Mismo comportamiento** - Si funciona ahora, debe seguir funcionando igual
5. **Opciones, no reemplazos** - BV8 es un complemento, no un sustituto

---

## 📋 RESTRICCIONES POR MÓDULO

### CO.html - Editor de Cuadros de Organización

#### ✅ LO QUE SÍ DEBEMOS HACER

```javascript
// Agregar botón "Cargar Plantilla BV8" al menú existente
const menuBotones = document.querySelector('.menu-co-buttons');
const botonBV8 = document.createElement('button');
botonBV8.textContent = 'Cargar Plantilla BV8';
botonBV8.onclick = mostrarDialogoBV8;
menuBotones.appendChild(botonBV8); // Agregar, no reemplazar
```

#### ❌ LO QUE NO DEBEMOS HACER

```javascript
// ❌ NO reemplazar el sistema de conexiones actual
// ❌ NO cambiar el formato de guardado de CO.html
// ❌ NO modificar la lógica de edición existente
```

#### ✅ Compatibilidad Requerida

**Inserción de Elementos**:
```javascript
// BV8 debe usar exactamente el mismo sistema que el menú manual
function insertarElementoBV8(tipo, datos) {
    // REUTILIZAR la función existente
    const elementoManual = crearElementoManual(tipo, datos.nombre);

    // AGREGAR datos BV8 como metadata
    elementoManual.dataset.plantillaBV8 = datos.plantilla_id;
    elementoManual.dataset.dotacionBV8 = JSON.stringify(datos.dotacion);

    // USAR el mismo método de inserción que el menú
    insertarEnCOCanvas(elementoManual);
}
```

**Conexiones**:
```javascript
// BV8 debe usar EXACTAMENTE el mismo tipo de conexiones que CO.html actual
function conectarElementosBV8(padre, hijo) {
    // REUTILIZAR función existente
    conectarElementosExistente(padre, hijo);

    // NO crear sistema de conexiones nuevo
    // NO cambiar el dibujado de líneas
    // NO modificar la lógica de jerarquía
}
```

**Guardado**:
```javascript
// El JSON exportado debe ser COMPATIBLE con el sistema actual
function exportarCOconBV8() {
    const coActual = exportarCOExistente(); // Sistema actual

    // AGREGAR metadata BV8, NO reemplazar estructura
    coActual.metadata = coActual.metadata || {};
    coActual.metadata.bv8_plantillas = obtenerPlantillasBV8Usadas();

    return coActual; // Mismo formato, con extras opcionales
}
```

---

### planeamiento_integrado.html - Importar Calcos/Elementos

#### ✅ Compatibilidad Requerida

**Importación de Elementos**:
```javascript
// BV8 debe usar el MISMO sistema de importación que los calcos actuales
function importarElementoBV8(jsonFile) {
    // REUTILIZAR la lógica de importarCalco()
    const elementoBase = {
        tipo: 'simbolo_militar',
        sidc: obtenerSIDCdesdeBV8(jsonFile),
        nombre: jsonFile.nombre,
        latLng: esperarClickEnMapa() // Mismo sistema de ubicación
    };

    // AGREGAR metadata BV8 como propiedades extras
    elementoBase.bv8 = {
        plantilla: jsonFile.plantilla_origen,
        composicion: jsonFile.composicion,
        dotacion: jsonFile.dotacion_agregada
    };

    // USAR función existente de creación de marcador
    crearMarcadorExistente(elementoBase);
}
```

**Marcadores en Mapa**:
```javascript
// Los elementos BV8 deben ser Leaflet markers normales
function crearMarcadorBV8(elemento) {
    // USAR mismo constructor que marcadores actuales
    const marker = L.marker(elemento.latLng, {
        icon: obtenerIconoMilsymbol(elemento.sidc), // Sistema actual
        draggable: true, // Mismo comportamiento
        // ... todas las opciones actuales
    });

    // AGREGAR listeners BV8 a los eventos existentes
    marker.on('click', function(e) {
        // Ejecutar callback existente
        onMarkerClickExistente(e);

        // AGREGAR panel BV8 si tiene datos
        if (elemento.bv8) {
            mostrarPanelBV8(elemento.bv8);
        }
    });

    return marker;
}
```

**Guardado de Escenarios**:
```javascript
// El escenario guardado debe ser COMPATIBLE con el formato actual
function guardarEscenarioConBV8() {
    const escenario = guardarEscenarioExistente(); // Sistema actual

    // AGREGAR sección BV8 opcional
    escenario.elementos.forEach(elem => {
        if (elem.bv8) {
            // Metadata BV8 como propiedad adicional
            elem.bv8_data = elem.bv8;
        }
    });

    return escenario; // Compatible con versiones sin BV8
}
```

---

### juegodeguerraV2.html - Simulación de Combate

#### ✅ Compatibilidad Requerida

**Carga de Unidades**:
```javascript
// Las unidades BV8 deben cargarse como unidades normales
function cargarUnidadBV8(elemento) {
    // USAR constructor existente de unidades
    const unidad = new UnidadJDG({
        id: elemento.id,
        tipo: elemento.tipo,
        sidc: elemento.sidc,
        posicion: elemento.latLng,
        // ... todas las propiedades actuales
    });

    // AGREGAR propiedades BV8 solo si existen
    if (elemento.bv8) {
        unidad.composicion = elemento.bv8.composicion;
        unidad.dotacion = elemento.bv8.dotacion;
        unidad.armamento = elemento.bv8.armamento;
    }

    return unidad;
}
```

**Sistema de Órdenes**:
```javascript
// BV8 debe EXTENDER el sistema de órdenes existente, no reemplazarlo
class OrdenMovimientoV2 extends OrdenBase {
    async ejecutar() {
        // Ejecutar lógica base (sistema actual)
        await super.ejecutar();

        // AGREGAR cálculos BV8 solo si la unidad tiene datos BV8
        if (this.unidad.dotacion) {
            const consumo = await calcularConsumoBV8(this.unidad, this.distancia);
            this.unidad.dotacion.combustible -= consumo.combustible;
            this.unidad.dotacion.agua -= consumo.agua;
        }

        // Sistema actual sigue funcionando igual para unidades sin BV8
    }
}
```

**Resolución de Combate**:
```javascript
// BV8 debe ser una OPCIÓN, no obligatorio
async function resolverCombate(atacante, defensor) {
    // ¿Ambas unidades tienen datos BV8?
    const usarBV8 = atacante.bv8 && defensor.bv8;

    if (usarBV8) {
        // Usar API BV8 para cálculo realista
        return await calcularCombateBV8(atacante, defensor);
    } else {
        // Usar sistema actual (simplificado)
        return calcularCombateExistente(atacante, defensor);
    }
}
```

**Interfaz de Usuario**:
```javascript
// Los paneles BV8 deben ser ADICIONALES, no reemplazar los actuales
function inicializarUI() {
    // Panel existente sigue funcionando
    inicializarPanelExistente();

    // AGREGAR panel BV8 solo si hay unidades con datos BV8
    if (hayUnidadesBV8()) {
        const panelBV8 = crearPanelLogisticoBV8();
        panelBV8.style.display = 'none'; // Oculto por defecto

        // Mostrar solo cuando se selecciona unidad BV8
        EventBus.on('unidad-seleccionada', (unidad) => {
            if (unidad.bv8) {
                panelBV8.style.display = 'block';
                actualizarPanelBV8(unidad);
            }
        });
    }
}
```

---

## 🔧 PATRONES DE INTEGRACIÓN

### Patrón 1: Detectar y Agregar

```javascript
// Detectar si existe capacidad BV8, agregar solo si está disponible
function procesarElemento(elemento) {
    // Lógica base (siempre funciona)
    procesarElementoBase(elemento);

    // Agregar capacidad BV8 solo si está disponible
    if (elemento.bv8 && window.BV8API) {
        procesarElementoBV8(elemento);
    }
}
```

### Patrón 2: Extender, No Reemplazar

```javascript
// Extender clases existentes, no crear nuevas desde cero
class ElementoBV8 extends ElementoExistente {
    constructor(datos) {
        super(datos); // Llamar constructor base

        // Agregar propiedades BV8
        if (datos.bv8) {
            this.composicion = datos.bv8.composicion;
            this.dotacion = datos.bv8.dotacion;
        }
    }

    // Sobrescribir métodos solo si es necesario
    calcularPotenciaCombate() {
        if (this.dotacion) {
            // Cálculo BV8 realista
            return this.calcularPotenciaBV8();
        } else {
            // Cálculo base (sistema actual)
            return super.calcularPotenciaCombate();
        }
    }
}
```

### Patrón 3: Metadata Opcional

```javascript
// Guardar datos BV8 como metadata opcional, no modificar estructura base
const elementoGuardado = {
    // Estructura base (SIEMPRE presente)
    id: '123',
    tipo: 'unidad_militar',
    sidc: 'SFGPUCIIM--F---',
    nombre: 'Sección 1ra',
    posicion: { lat: -34.603722, lng: -58.381592 },

    // Metadata BV8 (OPCIONAL - solo si la unidad fue creada con BV8)
    bv8: {
        plantilla: 'seccion_mecanizada',
        composicion: [...],
        dotacion: {...}
    }
};
```

### Patrón 4: Feature Flags

```javascript
// Usar feature flags para activar/desactivar funcionalidad BV8
const FEATURES = {
    BV8_ENABLED: true,
    BV8_CALCULADORA_BAJAS: true,
    BV8_TRACKING_LOGISTICA: true,
    BV8_MOVILIDAD_TERRENO: false // Desactivar si hay bugs
};

function ejecutarOrden(orden) {
    ejecutarOrdenBase(orden); // Siempre ejecutar lógica base

    if (FEATURES.BV8_TRACKING_LOGISTICA && orden.unidad.bv8) {
        actualizarDotaciones(orden.unidad);
    }
}
```

---

## ✅ CHECKLIST DE COMPATIBILIDAD

Antes de hacer commit de cualquier integración BV8, verificar:

### Código
- [ ] ¿La funcionalidad actual sigue funcionando SIN BV8?
- [ ] ¿Los archivos modificados mantienen su API pública?
- [ ] ¿Se reutilizan funciones existentes en vez de duplicar código?
- [ ] ¿Las extensiones usan herencia/composición, no reemplazo?
- [ ] ¿Los datos BV8 son opcionales, no obligatorios?

### Datos
- [ ] ¿El formato JSON es compatible con versiones sin BV8?
- [ ] ¿Los escenarios antiguos se cargan correctamente?
- [ ] ¿Los elementos creados manualmente siguen funcionando?
- [ ] ¿Las conexiones/relaciones usan el mismo sistema?

### UI/UX
- [ ] ¿Los botones BV8 son ADICIONALES, no reemplazan existentes?
- [ ] ¿El flujo de trabajo actual NO se modifica?
- [ ] ¿Los paneles BV8 son opcionales y se ocultan si no hay datos?
- [ ] ¿Los usuarios sin conocimientos de BV8 pueden seguir usando MAIRA?

### Testing
- [ ] ¿Tests existentes siguen pasando?
- [ ] ¿Funciona con escenarios creados ANTES de BV8?
- [ ] ¿Funciona si window.BV8API es undefined?
- [ ] ¿Funciona en Render (producción)?

---

## 🚨 SEÑALES DE ALERTA

### ❌ Estás rompiendo compatibilidad si:

1. **Modificas funciones existentes** sin verificar que todo sigue funcionando
2. **Cambias formatos de datos** sin migración/compatibilidad hacia atrás
3. **Reemplazas sistemas** en vez de extenderlos
4. **Eliminas código antiguo** antes de verificar que nada lo usa
5. **Haces BV8 obligatorio** en vez de opcional
6. **Cambias el comportamiento por defecto** de funciones existentes

### ✅ Estás integrando correctamente si:

1. **Agregas capacidades** sin modificar las existentes
2. **Usas feature flags** para activar/desactivar BV8
3. **Verificas existencia** antes de usar funcionalidad BV8
4. **Reutilizas código** existente cuando sea posible
5. **Mantienes retrocompatibilidad** en todos los formatos
6. **Documentas cambios** y puntos de integración

---

## 🔄 ESTRATEGIA DE MIGRACIÓN

### Para Usuarios Existentes

```javascript
// Al cargar escenario antiguo (sin BV8)
function cargarEscenario(jsonEscenario) {
    // Cargar con sistema actual (SIEMPRE funciona)
    const escenario = cargarEscenarioExistente(jsonEscenario);

    // Ofrecer enriquecer con BV8 (OPCIONAL)
    if (!tieneElementosBV8(escenario) && window.BV8API) {
        mostrarDialogo({
            mensaje: '¿Enriquecer este escenario con datos BV8?',
            opciones: ['Sí', 'No', 'Recordar mi elección'],
            callback: (respuesta) => {
                if (respuesta === 'Sí') {
                    enriquecerEscenarioConBV8(escenario);
                }
            }
        });
    }

    return escenario;
}

// Enriquecimiento es no destructivo
function enriquecerEscenarioConBV8(escenario) {
    escenario.elementos.forEach(elem => {
        // AGREGAR datos BV8, NO reemplazar
        if (elem.tipo === 'unidad_militar') {
            elem.bv8 = inferirDatosBV8(elem);
        }
    });

    // Guardar versión enriquecida como nuevo archivo
    guardarEscenarioEnriquecido(escenario);
}
```

---

## 📚 EJEMPLOS CONCRETOS

### Ejemplo 1: Insertar Elemento desde Plantilla BV8

```javascript
// ❌ INCORRECTO: Reemplazar sistema de inserción
function insertarDesdeBV8Incorrecto(plantilla) {
    // Crear sistema completamente nuevo
    const elemento = new ElementoBV8(plantilla);
    const canvas = document.getElementById('co-canvas');
    canvas.innerHTML = ''; // ❌ Borrar todo
    canvas.appendChild(elemento.render()); // ❌ Sistema nuevo
}

// ✅ CORRECTO: Reutilizar sistema existente
function insertarDesdeBV8Correcto(plantilla) {
    // Convertir plantilla BV8 a formato actual
    const datosElemento = {
        tipo: plantilla.tipo,
        nombre: plantilla.nombre,
        // ... campos estándar
    };

    // REUTILIZAR función existente de inserción
    const elemento = crearElementoManual(datosElemento);

    // AGREGAR metadata BV8
    elemento.dataset.bv8 = JSON.stringify(plantilla);

    // USAR sistema de inserción actual
    insertarElementoEnCO(elemento); // Función existente

    // Si hay subunidades, insertarlas con el mismo sistema
    if (plantilla.composicion) {
        plantilla.composicion.personal.forEach(rol => {
            const subElemento = crearElementoManual({
                tipo: 'rol',
                nombre: rol.rol
            });
            conectarElementos(elemento, subElemento); // Sistema actual
        });
    }
}
```

### Ejemplo 2: Importar en Planeamiento

```javascript
// ❌ INCORRECTO: Sistema de importación nuevo
function importarBV8Incorrecto(json) {
    const marcador = new MarcadorBV8(json); // ❌ Clase nueva
    map.clearLayers(); // ❌ Borrar marcadores existentes
    map.addLayer(marcador); // ❌ API diferente
}

// ✅ CORRECTO: Usar sistema de importación actual
function importarBV8Correcto(json) {
    // Convertir JSON BV8 a formato de calco actual
    const calco = {
        tipo: 'simbolo',
        sidc: json.sidc,
        nombre: json.nombre,
        geometria: 'Point',
        // ... campos estándar de calco

        // Agregar datos BV8 como propiedades extras
        propiedades: {
            bv8_plantilla: json.plantilla_origen,
            bv8_composicion: json.composicion,
            bv8_dotacion: json.dotacion_agregada
        }
    };

    // REUTILIZAR función de importar calco existente
    importarCalcoExistente(calco);

    // El sistema actual maneja:
    // - Click en mapa para ubicar
    // - Creación de marcador Leaflet
    // - Guardado en escenario
    // - Etc.
}
```

### Ejemplo 3: Combate en JDG V2

```javascript
// ❌ INCORRECTO: Reemplazar sistema de combate
async function combateBV8Incorrecto(atacante, defensor) {
    // Sistema completamente nuevo
    const resultado = await fetch('/api/bv8/combate/calcular', {
        // ... solo funciona con BV8
    });

    // ❌ Asume que todas las unidades tienen datos BV8
    atacante.efectivos = resultado.atacante_efectivos_final;
    defensor.efectivos = resultado.defensor_efectivos_final;

    return resultado;
}

// ✅ CORRECTO: Extender sistema existente
async function combateBV8Correcto(atacante, defensor) {
    // ¿Tienen ambas unidades datos BV8?
    const usarBV8 = atacante.bv8?.dotacion && defensor.bv8?.dotacion;

    let resultado;

    if (usarBV8) {
        // Usar API BV8 para cálculo realista
        resultado = await fetch('/api/bv8/combate/calcular', {
            method: 'POST',
            body: JSON.stringify({
                atacante: atacante.bv8,
                defensor: defensor.bv8,
                terreno: obtenerTerreno(),
                clima: obtenerClima()
            })
        }).then(r => r.json());

        // Actualizar dotaciones BV8
        atacante.bv8.dotacion.municion -= resultado.consumo_atacante.municion;
        defensor.bv8.dotacion.municion -= resultado.consumo_defensor.municion;
    } else {
        // Usar sistema actual (simplificado)
        resultado = calcularCombateExistente(atacante, defensor);
    }

    // Actualizar efectivos (sistema común para ambos casos)
    atacante.efectivos -= resultado.bajas_atacante;
    defensor.efectivos -= resultado.bajas_defensor;

    // Notificar al sistema de eventos (existente)
    EventBus.emit('combate-resuelto', { atacante, defensor, resultado });

    return resultado;
}
```

---

## 🎯 RESUMEN: 3 REGLAS DE ORO

### 1. **Agregar, No Reemplazar**
- Nuevas funciones, no modificar existentes
- Nuevos botones, no reemplazar menús
- Nuevas propiedades, no cambiar estructuras

### 2. **Reutilizar, No Duplicar**
- Usar funciones existentes cuando sea posible
- Extender clases existentes
- Integrar con sistemas actuales (Leaflet, EventBus, etc.)

### 3. **Opcional, No Obligatorio**
- BV8 siempre debe ser opcional
- Sistema actual debe funcionar sin BV8
- Feature flags para activar/desactivar

---

**Última actualización**: 14 noviembre 2025
**Revisión**: Antes de cada commit de integración BV8
