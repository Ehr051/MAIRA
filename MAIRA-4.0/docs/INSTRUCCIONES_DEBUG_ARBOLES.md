# 🌳 INSTRUCCIONES PARA DIAGNOSTICAR ÁRBOLES 3D

## 🚨 PROBLEMA ACTUAL
Los árboles NO se ven, pero pueden estar cargados fuera de la vista de la cámara.

---

## 📋 PASO A PASO

### 1️⃣ **Refresca la Página**
```
Cmd+Shift+R (macOS) o Ctrl+Shift+R (Windows)
```

### 2️⃣ **Abre la Consola del Navegador**
```
F12 → Pestaña "Console"
```

### 3️⃣ **Genera un Terreno 3D**
- Haz clic derecho en el map → "🎮 Generar Terreno 3D"
- Selecciona una zona con **VEGETACIÓN VERDE OSCURA**
- Espera a que termine de generar

### 4️⃣ **Ejecuta el Script de Diagnóstico**
Copia y pega TODO el contenido del archivo `diagnostic_trees.js` en la consola:

```javascript
// 🔍 DIAGNÓSTICO COMPLETO DE ÁRBOLES 3D
console.log('🔍 ==================== DIAGNÓSTICO ÁRBOLES 3D ====================');
// ... (todo el contenido del archivo)
```

### 5️⃣ **Reporta la Salida**
Copia y pega en el chat TODO lo que aparezca en la consola después de ejecutar el diagnóstico.

Especialmente busca:
- ✅ **"Total Groups encontrados:"** → ¿Cuántos?
- 📍 **"Centro de árboles:"** → ¿Qué coordenadas?
- 📏 **"Distancia a centro árboles:"** → ¿Qué distancia?
- 🚨 **"COMANDO DE EMERGENCIA:"** → Si aparece, **cópialo y ejecútalo**

### 6️⃣ **Si Ves el Comando de Emergencia**
Copia y pega el comando que aparece (algo como):
```javascript
maira3DCamera.position.set(1234.5, 678.9, 2345.6);
maira3DCamera.lookAt(1234.5, 567.8, 2345.6);
maira3DControls.target.set(1234.5, 567.8, 2345.6);
maira3DControls.update();
```

### 7️⃣ **Reporta**
- ¿Ahora VES los árboles después de ejecutar el comando de emergencia?
- ¿De qué tamaño son?
- ¿Cuántos ves aproximadamente?

---

## 🎯 LO QUE ESTAMOS BUSCANDO

### Caso A: **NO hay Groups en la escena**
→ Los modelos NO se están cargando
→ Problema con GLTFModelLoader o rutas de archivos

### Caso B: **SÍ hay Groups pero muy lejos de la cámara**
→ Los modelos SÍ se cargan, pero la cámara no está bien posicionada
→ Solución: Ajustar posicionamiento automático de cámara

### Caso C: **Groups muy pequeños (escala < 1.0)**
→ Los modelos se cargan, pero son invisibles por tamaño
→ Solución: Aumentar escala (ya hicimos esto a 6-10)

---

## 🔧 ERRORES ARREGLADOS

### ✅ Error `leaflet-image.js:262`
**Causa:** Marcadores con URLs undefined
**Fix:** Ahora se remueven temporalmente antes de capturar

### ✅ Error `toggleVista3D no encontrada`
**Causa:** indexP.js busca función que no existe en planeamiento_integrado.html
**Fix:** Error silenciado, ahora solo se muestra en modo debug

---

## 📊 DATOS QUE NECESITAMOS

Por favor reporta:
1. **Console output completo** del script diagnostic_trees.js
2. **Screenshot** de la vista 3D (aunque no veas árboles)
3. **¿Ejecutaste el comando de emergencia?** ¿Funcionó?
4. **Posición de la cámara** vs **Centro de árboles** (el script lo calcula)

---

## 🌲 TEORÍA DEL PROBLEMA

Basándonos en conversación anterior:
- Los modelos **SÍ se cargan** (139 Groups confirmados antes)
- Los modelos **SÍ están en la escena** (children.length = 143)
- El problema es **posicionamiento de cámara**
- Árboles están en (±3000, 200, ±2000) pero cámara en (0, 1000, 400)

**Nueva escala aplicada:** 6.0-10.0 (antes 1.2-2.0)
**Deberían verse ahora** si la cámara apunta bien.
