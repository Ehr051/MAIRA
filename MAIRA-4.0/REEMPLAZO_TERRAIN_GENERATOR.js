// 🔄 REEMPLAZO PARA TerrainGenerator3D.js LÍNEAS 806-893
// Buscar: "console.log(`📊 Muestreando"
// Hasta: "const samplingTime = ((performance.now()"
// REEMPLAZAR TODO ESE BLOQUE CON ESTE CÓDIGO:

        console.log(`📊 Muestreando ${sampledPoints.length}/${points.length} puntos (${Math.round(sampledPoints.length/points.length*100)}%)`);
        
        // 🎯 PASO 2: Obtener elevaciones con BATCH API (1 request para todos los puntos)
        const sampledData = new Map();
        const samplingStart = performance.now();
        
        console.log(`🚀 Llamando a Batch API con ${sampledPoints.length} puntos...`);
        
        try {
            // 📡 BATCH API: Una sola llamada HTTP para todos los puntos
            const response = await fetch('/api/elevation/batch', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    points: sampledPoints.map(p => ({
                        lat: p.lat,
                        lon: p.lon,
                        index: p.originalIndex
                    }))
                })
            });
            
            if (!response.ok) {
                throw new Error(`Batch API respondió ${response.status}`);
            }
            
            const batchResult = await response.json();
            console.log(`✅ Batch API: ${batchResult.valid_count}/${batchResult.count} puntos válidos en ${batchResult.processing_time.toFixed(2)}s`);
            console.log(`   Tiles cargados: ${batchResult.tiles_loaded}`);
            
            // Procesar resultados del batch
            sampledPoints.forEach((point, i) => {
                let elevation = batchResult.elevations[i];
                
                // Fallback a procedimental si el batch no devolvió valor válido
                if (elevation === null || elevation === undefined || isNaN(elevation) || !isFinite(elevation)) {
                    elevation = this.generateProceduralHeight(point.lat, point.lon);
                }
                
                // Guardar en caché
                const key = cacheKey(point.lat, point.lon);
                elevationCache.set(key, elevation);
                
                // 🌿 NDVI procedimental (por ahora)
                let ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                vegetationCache.set(key, ndvi);
                
                sampledData.set(point.originalIndex, { elevation, ndvi });
            });
            
        } catch (error) {
            console.error(`❌ Batch API falló, usando elevación procedimental:`, error);
            
            // Si batch falla completamente, usar procedimental para todos
            sampledPoints.forEach(point => {
                const elevation = this.generateProceduralHeight(point.lat, point.lon);
                const ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                
                const key = cacheKey(point.lat, point.lon);
                elevationCache.set(key, elevation);
                vegetationCache.set(key, ndvi);
                
                sampledData.set(point.originalIndex, { elevation, ndvi });
            });
        }
        
        const samplingTime = ((performance.now() - samplingStart) / 1000).toFixed(2);
        console.log(`⚡ Elevaciones obtenidas en ${samplingTime}s`);
