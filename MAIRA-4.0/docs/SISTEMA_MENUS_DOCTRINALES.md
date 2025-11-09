# 📋 SISTEMA DE MENÚS DOCTRINALES V2

**Fecha:** 8 de Noviembre 2025
**Commit:** En desarrollo
**Archivos:**
- [MenusDoctrinales.js](../Client/js/modules/juegoV2/config/MenusDoctrinales.js)
- [GestorOrdenesV2.js](../Client/js/modules/juegoV2/core/GestorOrdenesV2.js)
- [miradial.js](../Client/js/common/miradial.js)

---

## 🎯 OBJETIVO

Implementar menús contextuales basados en **doctrina militar** según el **Reglamento de Conducción de Fuerzas Terrestres**, donde cada arma/especialidad tiene órdenes específicas según su función táctica.

---

## 📚 FUNDAMENTOS DOCTRINALES

### Estados Tácticos Básicos

Todas las fuerzas operan bajo 3 estados tácticos fundamentales:

1. **MARCHA**
   - Movimiento táctico
   - Cambio de posición
   - Desplazamiento

2. **COMBATE**
   - Ofensivo: Ataque, asalto, persecución
   - Defensivo: Defensa, retardo, repliegue

3. **DESCANSO**
   - Espera
   - Reorganización
   - Recuperación

### Clasificación de Armas/Especialidades

Según código SIDC (posiciones 4-6):

```
ARMAS DE COMBATE (MANIOBRA):
├─ UCI - Infantería
├─ UCR - Caballería/Blindados
└─ (Combate directo con el enemigo)

ARMAS DE APOYO DE COMBATE:
├─ UCF - Artillería
├─ UCE - Ingenieros
├─ UCD - Defensa Antiaérea
├─ UUS - Comunicaciones
├─ UUM - Inteligencia
└─ (Apoyan el combate de maniobra)

SERVICIOS DE APOYO LOGÍSTICO:
├─ USM - Sanidad
├─ USS - Abastecimiento
├─ UST - Transporte
├─ USA - Personal
├─ UUA - QBN
├─ UUL - Policía Militar
└─ (Sostienen la fuerza)
```

---

## 🗂️ ESTRUCTURA DEL SISTEMA

### Archivo: MenusDoctrinales.js

```javascript
const MenusDoctrinales = {
    // Extrae tipo de arma desde SIDC
    obtenerTipoArma(sidc) { /* ... */ },

    // Obtiene menú principal según arma
    obtenerMenu(unidad) { /* ... */ },

    // Menús específicos por arma
    menus: {
        infanteria() { /* ... */ },
        caballeria() { /* ... */ },
        artilleria() { /* ... */ },
        // ... etc
    },

    // Submenús específicos
    submenus: {
        infanteria_combate: [ /* ... */ ],
        ingenieros_movilidad: [ /* ... */ ],
        // ... etc
    },

    // Obtiene submenu por nombre
    obtenerSubmenu(nombre) { /* ... */ }
};
```

---

## 📋 MENÚS POR ARMA

### 1. INFANTERÍA (UCI)

**Función:** Combate a pie, ocupación de terreno, combate cercano

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Combate → SUBMENU
│  ├─ Atacar (ordenAtaque)
│  ├─ Defender (ordenDefensa)
│  └─ Volver
├─ Reconocer (ordenReconocimiento)
└─ Descanso (ordenEspera)
```

### 2. CABALLERÍA / BLINDADOS (UCR)

**Función:** Reconocimiento, combate móvil, explotación

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Combate → SUBMENU
│  ├─ Atacar (ordenAtaque)
│  ├─ Defender (ordenDefensa)
│  └─ Volver
├─ Reconocer (ordenReconocimiento)
└─ Descanso (ordenEspera)
```

### 3. ARTILLERÍA (UCF)

**Función:** Apoyo de fuego, supresión, neutralización

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Fuego → SUBMENU
│  ├─ Apoyo Directo (apoyoDirecto)
│  ├─ Apoyo General (apoyoGeneral)
│  ├─ Preparación (preparacionFuego)
│  └─ Volver
└─ Espera (ordenEspera)
```

**Tipos de apoyo:**
- **Apoyo Directo:** Asignada a una unidad específica
- **Apoyo General:** Apoyo a toda la fuerza
- **Preparación:** Fuegos antes del asalto

### 4. INGENIEROS (UCE)

**Función:** Movilidad, contramovilidad, supervivencia

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Movilidad → SUBMENU
│  ├─ Mejorar Camino
│  ├─ Instalar Puente
│  ├─ Limpiar Obstáculos
│  └─ Volver
├─ Contramovilidad → SUBMENU
│  ├─ Campo Minado AT
│  ├─ Campo Minado AP
│  ├─ Obstáculos
│  └─ Volver
├─ Supervivencia → SUBMENU
│  ├─ Fortificar Posición
│  ├─ Abrigo Personal
│  ├─ Bunker
│  └─ Volver
└─ Descanso (ordenEspera)
```

**Funciones de ingenieros:**
- **Movilidad:** Facilitar el movimiento propio
- **Contramovilidad:** Obstaculizar movimiento enemigo
- **Supervivencia:** Protección de fuerzas

### 5. COMUNICACIONES (UUS)

**Función:** Enlaces, redes, criptología

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Enlaces → SUBMENU
│  ├─ Red Radio
│  ├─ Enlace Datos
│  ├─ Mantener Red
│  └─ Volver
└─ Espera (ordenEspera)
```

### 6. INTELIGENCIA (UUM)

**Función:** Reconocimiento, vigilancia, adquisición de objetivos

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Reconocimiento → SUBMENU
│  ├─ Vigilancia
│  ├─ Adquisición
│  ├─ Interrogatorio
│  └─ Volver
└─ Espera (ordenEspera)
```

### 7. SANIDAD (USM)

**Función:** Tratamiento, evacuación, hospitalización

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Apoyo Sanitario → SUBMENU
│  ├─ Tratamiento
│  ├─ Evacuación
│  ├─ Puesto Socorro
│  └─ Volver
└─ Espera (ordenEspera)
```

### 8. ABASTECIMIENTO (USS)

**Función:** Provisión de material, municiones, combustible

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Abastecimiento → SUBMENU
│  ├─ Distribuir Munición
│  ├─ Combustible
│  ├─ Víveres
│  └─ Volver
└─ Espera (ordenEspera)
```

### 9. TRANSPORTE (UST)

**Función:** Movimiento de personal y material

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Transporte → SUBMENU
│  ├─ Transportar Personal
│  ├─ Transportar Material
│  └─ Volver
└─ Espera (ordenEspera)
```

### 10. MANTENIMIENTO

**Función:** Reparación, recuperación de material

**Menú:**
```
├─ Marcha (ordenMovimiento)
├─ Mantenimiento → SUBMENU
│  ├─ Reparar Vehículo
│  ├─ Recuperar Material
│  └─ Volver
└─ Espera (ordenEspera)
```

---

## 🔧 INTEGRACIÓN TÉCNICA

### GestorOrdenesV2.js

```javascript
/**
 * Obtiene opciones de menú según tipo de arma (doctrina)
 */
obtenerOpcionesMenu(unidad) {
    // Delegar a MenusDoctrinales
    if (typeof MenusDoctrinales !== 'undefined') {
        return MenusDoctrinales.obtenerMenu(unidad);
    }

    // Fallback: menú genérico
    return [ /* ... */ ];
}
```

### miradial.js

**Llamada desde getMenuItems():**
```javascript
// Si hay gestorOrdenesV2, usar sus opciones
if (window.gestorOrdenesV2 && window.gestorOrdenesV2.obtenerOpcionesMenu) {
    return window.gestorOrdenesV2.obtenerOpcionesMenu(window.elementoSeleccionado);
}
```

**Manejo de submenús:**
```javascript
case 'submenu':
    // Buscar en MenusDoctrinales primero (V2)
    if (submenu && typeof MenusDoctrinales !== 'undefined') {
        const submenuItems = MenusDoctrinales.obtenerSubmenu(submenu);
        if (submenuItems && submenuItems.length > 0) {
            this.showSubmenu(submenu);
            return;
        }
    }
    break;
```

---

## 🎮 FLUJO DE USO

1. **Usuario hace doble click en unidad**
   → MiRadial.init() detecta unidad

2. **getMenuItems('elemento') se ejecuta**
   → Llama a `gestorOrdenesV2.obtenerOpcionesMenu(unidad)`

3. **GestorOrdenesV2 delega a MenusDoctrinales**
   → `MenusDoctrinales.obtenerMenu(unidad)`

4. **MenusDoctrinales extrae tipo de arma del SIDC**
   → Código posiciones 4-6 del SIDC
   → Ejemplo: "SG-GUCI------" → "UCI" → infanteria

5. **Retorna menú específico según arma**
   → `menus.infanteria()` → 4 opciones principales

6. **Usuario selecciona opción con submenu**
   → action: 'submenu', submenu: 'infanteria_combate'

7. **miradial.js muestra submenu**
   → `MenusDoctrinales.obtenerSubmenu('infanteria_combate')`
   → Retorna: Atacar, Defender, Volver

8. **Usuario selecciona acción final**
   → action: 'ordenAtaque'
   → Llama a `window.ordenAtaque()`

---

## 📊 EJEMPLO COMPLETO

### Unidad: Compañía de Infantería

**SIDC:** `SG-GUCII-----`
**Posiciones 4-6:** `UCI` → Infantería

**Menú Principal:**
```
🏃 Marcha
⚔️  Combate → [SUBMENU]
🔍 Reconocer
💤 Descanso
```

**Usuario selecciona "Combate":**
```
✊ Atacar
🛡️  Defender
⬅️  Volver
```

**Usuario selecciona "Atacar":**
```javascript
→ window.ordenAtaque() ejecuta
→ GestorOrdenesV2.iniciarOrdenAtaque()
→ Modo orden = 'ataque'
→ Cursor = crosshair
→ Espera click en objetivo
```

---

## ✅ VENTAJAS DEL SISTEMA

### 1. Doctrina Correcta
- ✅ Cada arma tiene funciones específicas
- ✅ No aparecen opciones no aplicables
- ✅ Basado en reglamento real

### 2. Escalabilidad
- ✅ Fácil agregar nuevas armas
- ✅ Fácil agregar nuevas órdenes
- ✅ Centralizado en un archivo

### 3. Realismo Táctico
- ✅ Artillería hace apoyo de fuego (no ataca directamente)
- ✅ Ingenieros hacen movilidad/contramovilidad
- ✅ Sanidad hace evacuación (no combate)

### 4. Usabilidad
- ✅ Menús pequeños y enfocados
- ✅ Navegación intuitiva
- ✅ Tooltips descriptivos

---

## 🚀 PRÓXIMAS EXPANSIONES

### Pendiente de Implementación

1. **Handlers de órdenes específicas:**
   - `apoyoDirecto()`, `apoyoGeneral()`
   - `mejorarCamino()`, `instalarPuente()`
   - `campoMinadoAT()`, `campoMinadoAP()`
   - `evacuacionHeridos()`, `puestoSocorro()`
   - etc.

2. **Clases de orden adicionales:**
   - `OrdenApoyoFuego.js`
   - `OrdenIngenieros.js`
   - `OrdenLogistica.js`
   - `OrdenSanitaria.js`

3. **Validaciones doctrinales:**
   - Artillería no puede atacar sin observador
   - Ingenieros requieren materiales
   - Sanidad solo trata bajas propias

4. **Menús dinámicos:**
   - Mostrar solo órdenes disponibles según:
     - Munición disponible
     - Material disponible
     - Estado de la unidad
     - Fase del juego

---

## 📖 REFERENCIAS

- **Reglamento de Conducción de Fuerzas Terrestres** (doctrina base)
- **MIL-STD-2525D** (códigos SIDC)
- **Manual de Empleo de Ingenieros** (movilidad/contramovilidad)
- **Manual de Apoyo de Fuego** (artillería)

---

## 🔗 ARCHIVOS RELACIONADOS

- [MenusDoctrinales.js](../Client/js/modules/juegoV2/config/MenusDoctrinales.js) - Sistema doctrinal
- [GestorOrdenesV2.js](../Client/js/modules/juegoV2/core/GestorOrdenesV2.js) - Integración
- [miradial.js](../Client/js/common/miradial.js) - Menú radial
- [edicionGB.js](../Client/js/modules/gestion/edicionGB.js) - Funciones de mapeo SIDC
- [juegodeguerraV2.html](../Client/juegodeguerraV2.html) - Carga de scripts

---

**Última actualización:** 2025-11-08
**Estado:** ✅ Implementado
**Responsable:** Claude Code
