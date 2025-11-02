// ============================================================================
// INSTRUCCIONES DE REEMPLAZO PARA TerrainGenerator3D.js
// ============================================================================
// 
// UBICACIÓN: Líneas 806-893 (dentro de función enrichPointsWithData)
// 
// BUSCAR la línea 806 que dice:
//     console.log(`📊 Muestreando ${sampledPoints.length}...
// 
// SELECCIONAR hasta la línea 893 que dice:
//     const samplingTime = ((performance.now() - samplingStart) / 1000).toFixed(2);
// 
// BORRAR todo ese bloque
// 
// PEGAR el siguiente código:
// ============================================================================

        console.log(`📊 Muestreando ${sampledPoints.length}/${points.length} puntos`);
        
        // 🎯 PASO 2: Obtener elevaciones con BATCH API
        const sampledData = new Map();
        const samplingStart = performance.now();
        
        // 🚀 Usar batch API si está disponible
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
                } else {
                    throw new Error('Batch devolvió datos inválidos');
                }
            } catch (error) {
                console.error(`❌ Batch falló:`, error);
            }
        }
        
        // 🔄 FALLBACK: Si batch falló, usar método individual
        if (sampledData.size === 0) {
            console.warn(`⚠️ Usando método individual (lento)`);
            const batchSize = 50;
            
            for (let i = 0; i < sampledPoints.length; i += batchSize) {
                const batch = sampledPoints.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (point) => {
                    let elevation = 0;
                    let ndvi = 0;
                    const key = cacheKey(point.lat, point.lon);
                    
                    if (elevationCache.has(key)) {
                        elevation = elevationCache.get(key);
                    } else if (this.heightmapHandler && typeof this.heightmapHandler.getElevation === 'function') {
                        try {
                            elevation = await this.heightmapHandler.getElevation(point.lat, point.lon);
                            if (isNaN(elevation) || elevation === null || elevation === undefined || !isFinite(elevation)) {
                                elevation = this.generateProceduralHeight(point.lat, point.lon);
                            }
                            elevationCache.set(key, elevation);
                        } catch (error) {
                            elevation = this.generateProceduralHeight(point.lat, point.lon);
                            elevationCache.set(key, elevation);
                        }
                    } else {
                        elevation = this.generateProceduralHeight(point.lat, point.lon);
                        elevationCache.set(key, elevation);
                    }
                    
                    if (vegetationCache.has(key)) {
                        ndvi = vegetationCache.get(key);
                    } else if (this.vegetationHandler && typeof this.vegetationHandler.getNDVI === 'function') {
                        try {
                            ndvi = await this.vegetationHandler.getNDVI(point.lat, point.lon, point.normX, point.normY);
                            if (isNaN(ndvi) || ndvi === null || ndvi === undefined || !isFinite(ndvi)) {
                                ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                            }
                            vegetationCache.set(key, ndvi);
                        } catch (error) {
                            ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                            vegetationCache.set(key, ndvi);
                        }
                    } else {
                        ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                        vegetationCache.set(key, ndvi);
                    }
                    
                    return { index: point.originalIndex, elevation, ndvi };
                });
                
                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(result => {
                    sampledData.set(result.index, { 
                        elevation: result.elevation, 
                        ndvi: result.ndvi 
                    });
                });
            }
        }
        
        const samplingTime = ((performance.now() - samplingStart) / 1000).toFixed(2);
        console.log(`⚡ Datos obtenidos en ${samplingTime}s`);
