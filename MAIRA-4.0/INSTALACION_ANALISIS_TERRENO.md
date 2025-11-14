# 🗺️ INSTRUCCIONES INSTALACIÓN - MÓDULO ANÁLISIS DE TERRENO

## ✅ ARCHIVOS CREADOS

1. **JavaScript**: `/Client/js/modules/analisisTerreno.js` (525 líneas)
2. **CSS**: `/Client/css/modules/analisisTerreno.css` (475 líneas)

---

## 📝 PASO 1: Agregar CSS al HTML

Abrir el archivo: **`/Client/planeamiento_integrado.html`**

Buscar la sección de CSS (aprox. línea 20) donde está:
```html
<link rel="stylesheet" href="../node_modules/leaflet-draw/dist/leaflet.draw.css" />
```

**AGREGAR DESPUÉS**:
```html
<!-- 🗺️ Módulo Análisis de Terreno -->
<link rel="stylesheet" href="css/modules/analisisTerreno.css" />
```

---

## 📝 PASO 2: Agregar JavaScript al HTML

En el mismo archivo, buscar la sección de módulos (aprox. línea 502):
```html
<!-- Módulos específicos -->
<script src="js/modules/planeamiento/planeamiento.js"></script>
```

**AGREGAR DESPUÉS**:
```html
<!-- 🗺️ Módulo Análisis de Terreno -->
<script src="js/modules/analisisTerreno.js"></script>
```

---

## 📝 PASO 3: Verificar Chart.js (para gráficos)

Buscar si Chart.js está cargado (aprox. línea 280-430):
```bash
grep -n "chart.js" /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/planeamiento_integrado.html
```

**Si NO está**, agregar antes de los módulos:
```html
<!-- Chart.js para gráficos -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

---

## 🧪 PASO 4: Probar la Funcionalidad

1. **Abrir** `planeamiento_integrado.html` en el navegador
2. **Ir a** Menú > Herramientas
3. **Verificar** que aparece el botón: **"🏔️ Análisis de Terreno"**
4. **Hacer clic** en el botón
5. **Debe abrir** el modal con:
   - Instrucciones
   - Parámetros (Vehículo, Clima, Capas)
   - Botones (Dibujar Polígono, Analizar, Limpiar)

---

## 🎯 PASO 5: Probar Dibujo de Polígono

1. En el modal, clic en **"Dibujar Polígono"**
2. Aparecerán controles de Leaflet.draw en el mapa
3. **Dibujar un polígono** sobre una zona del mapa
4. El botón **"Analizar Terreno"** se habilitará (verde)

---

## 📡 PASO 6: Verificar Conexión API (Opcional)

Si quieres probar el análisis completo:

1. **Levantar el servidor API** (si ya existe):
   ```bash
   cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Server
   python app.py
   ```

2. **Verificar endpoint**:
   ```bash
   curl http://localhost:5000/api/terreno/analizar
   ```

3. **Si NO existe** el servidor API, crear el archivo:
   `/Server/api/terreno_analisis.py` (ya creado en sesión anterior)

---

## 🔧 TROUBLESHOOTING

### Problema: El botón no aparece
- **Verificar** que el archivo JS está cargado correctamente
- **Abrir consola** del navegador (F12) y buscar errores
- **Verificar** que `window.map` existe

### Problema: No se puede dibujar polígono
- **Verificar** que Leaflet.draw está cargado:
  ```javascript
  console.log(L.Draw); // Debe mostrar objeto
  ```

### Problema: Error al analizar
- **Verificar** que el servidor API está corriendo
- **Cambiar URL** en `analisisTerreno.js` línea 21:
  ```javascript
  apiUrl: 'http://localhost:5000/api/terreno'
  ```

---

## 📊 SIGUIENTE FASE

Una vez que FASE 1 funcione (botón + modal + dibujo):

**FASE 2**: Conectar con API y mostrar resultados
- Implementar endpoint `/api/terreno/analizar` en el servidor
- Cargar DEM/TIF
- Calcular pendientes con algoritmo Horn
- Retornar estadísticas

**FASE 3**: Overlay visual
- Pintar mapa de calor sobre el polígono
- Colores según pendiente: verde/amarillo/naranja/rojo

---

## ✅ CHECKLIST INSTALACIÓN

- [ ] CSS agregado a `planeamiento_integrado.html`
- [ ] JavaScript agregado a `planeamiento_integrado.html`
- [ ] Chart.js cargado (verificar)
- [ ] Página recargada (Ctrl+F5)
- [ ] Botón visible en menú Herramientas
- [ ] Modal se abre correctamente
- [ ] Se puede dibujar polígono
- [ ] Botón "Analizar" se habilita después de dibujar

---

**Creado**: 13 Nov 2025 - FASE 1 Completada
**Siguiente**: Conectar con API terreno_analisis.py
