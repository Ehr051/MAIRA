#!/usr/bin/env python3
# Script para modificar TerrainGenerator3D.js con batch API

import re

# Leer archivo
with open('Client/js/services/TerrainGenerator3D.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar el bloque específico
# Patrón: desde "const batchSize = 50;" hasta "const samplingTime ="
pattern = r"const batchSize = 50;.*?const samplingTime = \(\(performance\.now\(\) - samplingStart\) / 1000\)\.toFixed\(2\);"

replacement = """// 🚀 Usar batch API si está disponible
        if (this.heightmapHandler && typeof this.heightmapHandler.getElevationBatch === 'function') {
            console.log(`🚀 Batch API: ${sampledPoints.length} puntos`);
            
            try {
                const elevations = await this.heightmapHandler.getElevationBatch(sampledPoints);
                
                if (elevations && elevations.length === sampledPoints.length) {
                    sampledPoints.forEach((point, i) => {
                        let elevation = elevations[i];
                        
                        if (elevation === null || elevation === undefined || isNaN(elevation) || !isFinite(elevation)) {
                            elevation = this.generateProceduralHeight(point.lat, point.lon);
                        }
                        
                        const key = cacheKey(point.lat, point.lon);
                        elevationCache.set(key, elevation);
                        
                        let ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                        vegetationCache.set(key, ndvi);
                        
                        sampledData.set(point.originalIndex, { elevation, ndvi });
                    });
                    
                    console.log(`✅ Batch completado`);
                }
            } catch (error) {
                console.error(`❌ Batch falló:`, error);
            }
        }
        
        const samplingTime = ((performance.now() - samplingStart) / 1000).toFixed(2);"""

# Reemplazar usando regex con DOTALL flag
nuevo_content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

if nuevo_content == content:
    print("❌ No se encontró el patrón para reemplazar")
    exit(1)

# Escribir
with open('Client/js/services/TerrainGenerator3D.js', 'w', encoding='utf-8') as f:
    f.write(nuevo_content)

print("✅ Archivo modificado exitosamente")
print(f"   Batch API agregado al TerrainGenerator3D")
