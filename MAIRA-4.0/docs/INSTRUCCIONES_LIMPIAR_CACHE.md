# 🔄 INSTRUCCIONES PARA VER LOS NUEVOS LOGS

## ⚠️ IMPORTANTE: Los logs van a la CONSOLA DEL NAVEGADOR, NO al terminal

Los logs que agregamos son en **JavaScript del frontend**, por lo tanto:
- ✅ Se ven en la **Consola del Navegador** (Developer Tools)
- ❌ NO aparecen en el terminal donde corre el servidor Python

---

## Pasos EXACTOS para ver los logs:

### 1. Abre la Consola del Navegador (Developer Tools)

**En Chrome/Brave/Edge:**
- Presiona `Cmd + Option + I` (macOS)
- O clic derecho → "Inspeccionar" → pestaña "Console"

### 2. Limpia el Cache del Navegador

**Opción A - Empty Cache and Hard Reload (RECOMENDADO):**
1. Con las DevTools **ABIERTAS**
2. **Clic derecho** en el botón de recargar del navegador (←↻)
3. Selecciona "**Empty Cache and Hard Reload**"

**Opción B - Hard Refresh:**
- Con DevTools abiertas, presiona: `Cmd + Shift + R`

### 3. Verifica que se limpiaron los scripts

En la pestaña "Console", ejecuta:
```javascript
console.clear(); // Limpia la consola
console.log("Cache limpiado - listo para ver logs nuevos");
```

### 4. Genera el terreno 3D

1. En el map, navega a las sierras: **-38.07°, -62.00°**
2. Genera el terreno 3D
3. **INMEDIATAMENTE mira la consola del navegador**

---

## ✅ Logs que DEBES ver en la CONSOLA DEL NAVEGADOR:

Cuando generes el terreno, deberías ver estos logs **en la consola del navegador**:

```
🔍 BUSCAR TILE EN PROVINCIAS
   Bounds recibidos: {...}
   Centro calculado: lat=-38.071070, lng=-62.008210

🌍 PROVINCIA DETERMINADA: centro

📍 BOUNDS GEOGRÁFICOS DEL TERRENO
   Latitud:  -38.XXXXX a -38.XXXXX
   Longitud: -62.XXXXX a -62.XXXXX

📦 EXPORTANDO DATOS COMPLETOS
   Total de puntos: 4096
   Puntos muestreados: ~1600
   Puntos interpolados: ~2400

✅ Datos exportados a window.TERRAIN_DATA_EXPORT
💾 Para descargar, ejecuta en consola:
   const blob = new Blob([JSON.stringify(window.TERRAIN_DATA_EXPORT, null, 2)], {type: 'application/json'});
   ...
```

### ⚠️ Si NO ves estos logs en la CONSOLA DEL NAVEGADOR:

1. **Verifica que estás mirando el lugar correcto:**
   - Los logs van a la **CONSOLA DEL NAVEGADOR** (Developer Tools → Console)
   - NO van al terminal donde corre Python

2. **Limpieza más agresiva:**
   - Cierra completamente Chrome/Brave
   - Vuelve a abrir
   - Abre modo incógnito: `Cmd + Shift + N`
   - Ve a `http://localhost:5000/Client/planeamiento_integrado.html`

3. **Verifica que el archivo correcto se cargó:**
   En la consola del navegador ejecuta:
   ```javascript
   // Esto debe retornar la función con el código nuevo
   console.log(window.elevationHandler.buscarTileEnProvincias.toString().includes('🔍 BUSCAR TILE'));
   ```
   - Si retorna `true` → El código nuevo se cargó ✅
   - Si retorna `false` → Aún tiene cache ❌

---

## 📊 Una vez que veas los logs en la CONSOLA DEL NAVEGADOR:

### Opción 1: Ver datos directamente en la consola

En la consola del navegador, ejecuta:
```javascript
// Ver resumen
window.TERRAIN_DATA_EXPORT.metadata

// Ver primeros 10 puntos con sus elevaciones
window.TERRAIN_DATA_EXPORT.points.slice(0, 10)

// Ver rango de elevaciones
const elevs = window.TERRAIN_DATA_EXPORT.points.map(p => p.elevation);
console.log('Min:', Math.min(...elevs), 'Max:', Math.max(...elevs));
```

### Opción 2: Descargar JSON completo

En la consola del navegador, ejecuta:
```javascript
const blob = new Blob([JSON.stringify(window.TERRAIN_DATA_EXPORT, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'terrain_data.json';
a.click();
```

### Opción 3: Usar la página de exportación

Ve a: `http://localhost:5000/Client/export-terrain-data.html`
- Automáticamente detectará los datos
- Mostrará estadísticas
- Botón para descargar JSON

---

## 🎯 Qué buscar en los datos:

Una vez que veas `window.TERRAIN_DATA_EXPORT`, revisa:

### ✅ Si las elevaciones están entre **284-1195m**:
→ Los datos TIF son correctos
→ El problema está en el renderizado 3D

### ❌ Si las elevaciones están entre **433-438m**:
→ Los datos TIF son incorrectos
→ El problema está en la obtención/interpolación de datos

### ⚠️ Si hay mezcla de valores:
→ Problema en interpolación o caché

---

## 📸 Captura de pantalla para ayuda

Si sigues sin ver los logs, envía captura de:
1. La pestaña "Console" del navegador (Developer Tools)
2. La pestaña "Network" mostrando los archivos `.js` cargados

---

**RECUERDA: Los logs son JAVASCRIPT y van a la CONSOLA DEL NAVEGADOR, no al terminal del servidor Python.**
