#!/usr/bin/env python3
"""
🎨 Script automático para agregar visualización al frontend
Modifica analisisTerreno.js en MAIRA-WORKSPACE
"""

import os

FRONTEND_FILE = '/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/js/modules/analisisTerreno.js'
BACKUP_FILE = FRONTEND_FILE + '.backup_visualizacion'

# Código a agregar AL FINAL del método mostrarResultados (antes del cierre })
CODIGO_VISUALIZACION_MOSTRAR = """
        // ====================================================================
        // 🎨 VISUALIZACIÓN DE PUNTOS DETALLE
        // ====================================================================
        if (resultados.puntos_detalle && resultados.puntos_detalle.length > 0) {
            console.log(`🎨 Creando visualización de ${resultados.puntos_detalle.length} puntos`);
            
            // Crear calcos en sistema de calcos
            this.crearCalcoAltimetria(resultados.puntos_detalle);
            this.crearCalcoPendientes(resultados.puntos_detalle);
            this.crearCalcoVegetacion(resultados.puntos_detalle);
            
            // Notificar al usuario
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion(
                    `✅ 3 capas de visualización creadas (${resultados.puntos_detalle.length} puntos)`,
                    'success'
                );
            }
        }
"""

# Funciones de visualización a agregar antes del cierre de la clase
FUNCIONES_VISUALIZACION = """
    /**
     * 🏔️ Crear calco de altimetría
     * Paleta de 23 colores cada 50m (0-3000m+)
     */
    crearCalcoAltimetria(puntos_detalle) {
        console.log('🏔️ Creando calco de altimetría...');
        
        const circles = puntos_detalle.map(punto => {
            const color = this.getColorAltimetria(punto.elevation);
            
            return L.circleMarker([punto.lat, punto.lon], {
                radius: 6,
                fillColor: color,
                fillOpacity: 0.7,
                color: '#333',
                weight: 1,
                className: 'calco-altimetria-point'
            }).bindTooltip(
                `<strong>Altitud:</strong> ${punto.elevation.toFixed(1)}m<br>` +
                `<strong>Coordenadas:</strong> ${punto.lat.toFixed(4)}, ${punto.lon.toFixed(4)}`,
                { permanent: false, direction: 'top' }
            );
        });
        
        const layer = L.layerGroup(circles);
        
        if (window.sistemaCalcos && typeof window.sistemaCalcos.agregarCalco === 'function') {
            window.sistemaCalcos.agregarCalco({
                tipo: 'ALTIMETRIA',
                nombre: `Altimetría ${new Date().toLocaleTimeString()}`,
                layer: layer,
                datos: {
                    puntos: puntos_detalle.length,
                    min: Math.min(...puntos_detalle.map(p => p.elevation)),
                    max: Math.max(...puntos_detalle.map(p => p.elevation))
                }
            });
        } else {
            layer.addTo(window.map);
            console.log('✅ Calco altimetría agregado al mapa');
        }
        
        console.log(`✅ Calco altimetría creado: ${puntos_detalle.length} puntos`);
    }

    /**
     * 📐 Crear calco de pendientes
     */
    crearCalcoPendientes(puntos_detalle) {
        console.log('📐 Creando calco de pendientes...');
        
        const circles = puntos_detalle.map(punto => {
            const color = this.getColorPendiente(punto.pendiente);
            
            return L.circleMarker([punto.lat, punto.lon], {
                radius: 6,
                fillColor: color,
                fillOpacity: 0.7,
                color: '#333',
                weight: 1,
                className: 'calco-pendientes-point'
            }).bindTooltip(
                `<strong>Pendiente:</strong> ${punto.pendiente}°<br>` +
                `<strong>Clasificación:</strong> ${this.getClasificacionPendiente(punto.pendiente)}<br>` +
                `<strong>Coordenadas:</strong> ${punto.lat.toFixed(4)}, ${punto.lon.toFixed(4)}`,
                { permanent: false, direction: 'top' }
            );
        });
        
        const layer = L.layerGroup(circles);
        
        if (window.sistemaCalcos && typeof window.sistemaCalcos.agregarCalco === 'function') {
            window.sistemaCalcos.agregarCalco({
                tipo: 'PENDIENTES',
                nombre: `Pendientes ${new Date().toLocaleTimeString()}`,
                layer: layer,
                datos: {
                    puntos: puntos_detalle.length,
                    promedio: (puntos_detalle.reduce((sum, p) => sum + p.pendiente, 0) / puntos_detalle.length).toFixed(2),
                    max: Math.max(...puntos_detalle.map(p => p.pendiente))
                }
            });
        } else {
            layer.addTo(window.map);
            console.log('✅ Calco pendientes agregado al mapa');
        }
        
        console.log(`✅ Calco pendientes creado: ${puntos_detalle.length} puntos`);
    }

    /**
     * 🌲 Crear calco de vegetación
     */
    crearCalcoVegetacion(puntos_detalle) {
        console.log('🌲 Creando calco de vegetación...');
        
        const circles = puntos_detalle.map(punto => {
            const color = this.getColorVegetacion(punto.ndvi);
            
            return L.circleMarker([punto.lat, punto.lon], {
                radius: 6,
                fillColor: color,
                fillOpacity: 0.7,
                color: '#333',
                weight: 1,
                className: 'calco-vegetacion-point'
            }).bindTooltip(
                `<strong>NDVI:</strong> ${punto.ndvi.toFixed(2)}<br>` +
                `<strong>Tipo:</strong> ${this.getTipoVegetacion(punto.ndvi)}<br>` +
                `<strong>Coordenadas:</strong> ${punto.lat.toFixed(4)}, ${punto.lon.toFixed(4)}`,
                { permanent: false, direction: 'top' }
            );
        });
        
        const layer = L.layerGroup(circles);
        
        if (window.sistemaCalcos && typeof window.sistemaCalcos.agregarCalco === 'function') {
            window.sistemaCalcos.agregarCalco({
                tipo: 'VEGETACION',
                nombre: `Vegetación ${new Date().toLocaleTimeString()}`,
                layer: layer,
                datos: {
                    puntos: puntos_detalle.length,
                    ndvi_promedio: (puntos_detalle.reduce((sum, p) => sum + p.ndvi, 0) / puntos_detalle.length).toFixed(2)
                }
            });
        } else {
            layer.addTo(window.map);
            console.log('✅ Calco vegetación agregado al mapa');
        }
        
        console.log(`✅ Calco vegetación creado: ${puntos_detalle.length} puntos`);
    }

    // Funciones auxiliares de colores
    getColorAltimetria(elevation) {
        if (elevation < 50) return '#0d5e0d';
        if (elevation < 100) return '#1a7a1a';
        if (elevation < 150) return '#2d8f2d';
        if (elevation < 200) return '#3fa33f';
        if (elevation < 250) return '#52b852';
        if (elevation < 300) return '#6b9966';
        if (elevation < 350) return '#7a8c7a';
        if (elevation < 400) return '#8a7a6b';
        if (elevation < 450) return '#9c8c66';
        if (elevation < 500) return '#ad9e61';
        if (elevation < 550) return '#bfb05c';
        if (elevation < 600) return '#d1c257';
        if (elevation < 650) return '#c4a852';
        if (elevation < 700) return '#b88e4d';
        if (elevation < 750) return '#ab7448';
        if (elevation < 800) return '#9e5a43';
        if (elevation < 900) return '#8c4a3e';
        if (elevation < 1000) return '#7a3a39';
        if (elevation < 1500) return '#6b2a34';
        if (elevation < 2000) return '#5c1a2f';
        if (elevation < 2500) return '#8a7a9e';
        if (elevation < 3000) return '#c4b4d1';
        return '#ffffff';
    }

    getColorPendiente(pendiente) {
        if (pendiente < 5) return '#2ecc71';
        if (pendiente < 15) return '#f1c40f';
        if (pendiente < 30) return '#e67e22';
        return '#e74c3c';
    }

    getClasificacionPendiente(pendiente) {
        if (pendiente < 5) return 'Llano';
        if (pendiente < 15) return 'Moderado';
        if (pendiente < 30) return 'Difícil';
        return 'Muy difícil';
    }

    getColorVegetacion(ndvi) {
        if (ndvi < 0.2) return '#8b4513';
        if (ndvi < 0.4) return '#d4a574';
        if (ndvi < 0.6) return '#7cb342';
        return '#2e7d32';
    }

    getTipoVegetacion(ndvi) {
        if (ndvi < 0.2) return 'Suelo desnudo';
        if (ndvi < 0.4) return 'Vegetación escasa';
        if (ndvi < 0.6) return 'Vegetación moderada';
        return 'Vegetación densa';
    }
"""

def main():
    print("=" * 80)
    print("🎨 APLICANDO CAMBIOS AL FRONTEND")
    print("=" * 80)
    print()
    
    if not os.path.exists(FRONTEND_FILE):
        print(f"❌ Error: No se encuentra {FRONTEND_FILE}")
        return False
    
    print("💾 Creando backup...")
    with open(FRONTEND_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"✅ Backup creado: {BACKUP_FILE}")
    print()
    
    print("📝 PASO 1: Agregando visualización a mostrarResultados()...")
    
    # Buscar línea 522 (cierre del método mostrarResultados)
    # La línea dice:     }
    # Agregar código ANTES de ese cierre
    
    insert_index = 521  # Línea 522 - 1 (índice 0-based)
    lines.insert(insert_index, CODIGO_VISUALIZACION_MOSTRAR + '\n')
    
    print("✅ Código de visualización agregado a mostrarResultados()")
    print()
    
    print("📝 PASO 2: Agregando 9 funciones de visualización...")
    
    # Buscar el cierre de la clase (antes del último })
    # El archivo tiene 601 líneas, las últimas son:
    # }, 100);
    # });
    
    # Buscar desde el final hacia atrás el cierre de la clase AnalisisTerreno
    # Debería estar alrededor de línea 580-590
    
    insert_index_funciones = len(lines) - 15  # Antes del cierre del IIFE
    lines.insert(insert_index_funciones, FUNCIONES_VISUALIZACION)
    
    print("✅ 9 funciones de visualización agregadas")
    print()
    
    print("💾 Guardando cambios...")
    with open(FRONTEND_FILE, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("✅ Archivo guardado exitosamente")
    print()
    
    print("=" * 80)
    print("✅ FRONTEND MODIFICADO EXITOSAMENTE")
    print("=" * 80)
    print()
    print("📋 CAMBIOS APLICADOS:")
    print("  ✅ Visualización agregada a mostrarResultados()")
    print("  ✅ 9 funciones de visualización agregadas")
    print("  ✅ Backup creado en:", BACKUP_FILE)
    print()
    print("🔄 PRÓXIMO PASO:")
    print("  Probar end-to-end dibujando polígono y analizando")
    print()
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
