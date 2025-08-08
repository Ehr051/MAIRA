// auditoria_repositorio.js
// Auditoría completa de dependencias del repositorio MAIRA

(function() {
    console.log('🔍 Iniciando auditoría completa de dependencias...');
    
    // Archivos HTML principales a verificar
    const htmlPrincipales = [
        'index.html',
        'iniciarpartida.html',
        'juegodeguerra.html',
        'planeamiento.html',
        'gestionbatalla.html',
        'CO.html',
        'inicioGB.html'
    ];
    
    // Dependencias críticas esperadas
    const dependenciasCriticas = {
        // Scripts de configuración
        'networkConfig.js': '/Client/js/networkConfig.js',
        
        // Handlers de datos
        'elevationHandler.js': '/Client/js/elevationHandler.js',
        'vegetacionhandler.js': '/Client/js/vegetacionhandler.js',
        'elevation.worker.js': '/Client/js/elevation.worker.js',
        
        // Lógica del juego
        'gestorJuego.js': '/Client/js/gestorJuego.js',
        'gestionBatalla.js': '/Client/js/gestionBatalla.js',
        'MAIRAChat.js': '/Client/js/MAIRAChat.js',
        'partidas.js': '/Client/js/partidas.js',
        
        // Mapa y herramientas
        'mapaP.js': '/Client/js/mapaP.js',
        'herramientasP.js': '/Client/js/herramientasP.js',
        'simbolosP.js': '/Client/js/simbolosP.js',
        'calcosP.js': '/Client/js/calcosP.js',
        'atajosP.js': '/Client/js/atajosP.js',
        
        // Elementos específicos
        'indexP.js': '/Client/js/indexP.js',
        'miradial.js': '/Client/js/miradial.js',
        'graficoMarcha.js': '/Client/js/graficoMarcha.js',
        'panelMarcha.js': '/Client/js/panelMarcha.js',
        
        // Edición y dibujos
        'edicioncompleto.js': '/Client/js/edicioncompleto.js',
        'dibujosMCCP.js': '/Client/js/dibujosMCCP.js',
        
        // Cálculos
        'CalculoMarcha.js': '/Client/js/CalculoMarcha.js'
    };
    
    // Índices de datos geográficos
    const indicesGeograficos = {
        'altimetria': '/Client/Libs/datos_argentina/Altimetria/index_tiles_altimetria.json',
        'vegetacion': '/Client/Libs/datos_argentina/Vegetacion/vegetacion_tile_index.json'
    };
    
    // Resultados de la auditoría
    const resultados = {
        archivosHTML: {},
        dependenciasJS: {},
        indicesGeo: {},
        errores: [],
        warnings: [],
        faltantes: []
    };
    
    // Función para verificar si un archivo existe
    async function verificarArchivo(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return {
                existe: response.ok,
                status: response.status,
                size: response.headers.get('content-length') || 'unknown'
            };
        } catch (error) {
            return {
                existe: false,
                error: error.message,
                status: 'ERROR'
            };
        }
    }
    
    // Función para extraer dependencias de un HTML
    async function extraerDependenciasHTML(nombreHTML) {
        try {
            const response = await fetch(`/${nombreHTML}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const contenido = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(contenido, 'text/html');
            
            const scripts = doc.querySelectorAll('script[src]');
            const dependencias = [];
            
            scripts.forEach(script => {
                const src = script.getAttribute('src');
                if (src && !src.startsWith('http')) {
                    dependencias.push(src);
                }
            });
            
            return dependencias;
        } catch (error) {
            console.error(`❌ Error al analizar ${nombreHTML}:`, error);
            return [];
        }
    }
    
    // Auditar archivos HTML
    async function auditarHTML() {
        console.log('📄 Auditando archivos HTML...');
        
        for (const html of htmlPrincipales) {
            console.log(`🔍 Verificando ${html}...`);
            
            const verificacion = await verificarArchivo(`/${html}`);
            resultados.archivosHTML[html] = verificacion;
            
            if (verificacion.existe) {
                const dependencias = await extraerDependenciasHTML(html);
                resultados.archivosHTML[html].dependencias = dependencias;
                console.log(`  ✅ ${html}: ${dependencias.length} dependencias encontradas`);
            } else {
                resultados.errores.push(`❌ ${html} no encontrado`);
                console.log(`  ❌ ${html}: No encontrado`);
            }
        }
    }
    
    // Auditar dependencias JavaScript
    async function auditarDependenciasJS() {
        console.log('📦 Auditando dependencias JavaScript...');
        
        for (const [nombre, ruta] of Object.entries(dependenciasCriticas)) {
            console.log(`🔍 Verificando ${nombre}...`);
            
            const verificacion = await verificarArchivo(ruta);
            resultados.dependenciasJS[nombre] = verificacion;
            
            if (verificacion.existe) {
                console.log(`  ✅ ${nombre}: OK (${verificacion.size} bytes)`);
            } else {
                resultados.faltantes.push(`❌ ${nombre} (${ruta})`);
                console.log(`  ❌ ${nombre}: FALTANTE`);
            }
        }
    }
    
    // Auditar índices geográficos
    async function auditarIndicesGeo() {
        console.log('🗺️ Auditando índices geográficos...');
        
        for (const [tipo, ruta] of Object.entries(indicesGeograficos)) {
            console.log(`🔍 Verificando índice de ${tipo}...`);
            
            const verificacion = await verificarArchivo(ruta);
            resultados.indicesGeo[tipo] = verificacion;
            
            if (verificacion.existe) {
                try {
                    const response = await fetch(ruta);
                    const data = await response.json();
                    const numTiles = Object.keys(data.tiles || {}).length;
                    resultados.indicesGeo[tipo].numTiles = numTiles;
                    console.log(`  ✅ ${tipo}: ${numTiles} tiles disponibles`);
                } catch (error) {
                    resultados.warnings.push(`⚠️ ${tipo}: Índice corrupto`);
                    console.log(`  ⚠️ ${tipo}: Error al leer índice`);
                }
            } else {
                resultados.faltantes.push(`❌ Índice ${tipo} (${ruta})`);
                console.log(`  ❌ ${tipo}: FALTANTE`);
            }
        }
    }
    
    // Generar reporte final
    function generarReporte() {
        console.log('\n📊 === REPORTE DE AUDITORÍA ===');
        
        console.log('\n📄 Archivos HTML:');
        for (const [html, info] of Object.entries(resultados.archivosHTML)) {
            const status = info.existe ? '✅' : '❌';
            console.log(`  ${status} ${html} (${info.dependencias?.length || 0} deps)`);
        }
        
        console.log('\n📦 Dependencias JavaScript:');
        const jsOK = Object.values(resultados.dependenciasJS).filter(d => d.existe).length;
        const jsTotal = Object.keys(resultados.dependenciasJS).length;
        console.log(`  Total: ${jsOK}/${jsTotal} archivos disponibles`);
        
        console.log('\n🗺️ Índices Geográficos:');
        for (const [tipo, info] of Object.entries(resultados.indicesGeo)) {
            if (info.existe) {
                console.log(`  ✅ ${tipo}: ${info.numTiles || 'N/A'} tiles`);
            } else {
                console.log(`  ❌ ${tipo}: FALTANTE`);
            }
        }
        
        if (resultados.faltantes.length > 0) {
            console.log('\n🚨 ARCHIVOS FALTANTES:');
            resultados.faltantes.forEach(faltante => console.log(`  ${faltante}`));
        }
        
        if (resultados.warnings.length > 0) {
            console.log('\n⚠️ ADVERTENCIAS:');
            resultados.warnings.forEach(warning => console.log(`  ${warning}`));
        }
        
        // Calcular puntuación general
        const totalArchivos = Object.keys(resultados.archivosHTML).length + 
                            Object.keys(resultados.dependenciasJS).length + 
                            Object.keys(resultados.indicesGeo).length;
        
        const archivosOK = Object.values(resultados.archivosHTML).filter(h => h.existe).length +
                         Object.values(resultados.dependenciasJS).filter(d => d.existe).length +
                         Object.values(resultados.indicesGeo).filter(i => i.existe).length;
        
        const porcentaje = Math.round((archivosOK / totalArchivos) * 100);
        
        console.log(`\n🎯 PUNTUACIÓN GENERAL: ${archivosOK}/${totalArchivos} (${porcentaje}%)`);
        
        if (porcentaje < 90) {
            console.log('🚨 REPOSITORIO INCOMPLETO - Faltan archivos críticos');
        } else if (porcentaje < 100) {
            console.log('⚠️ REPOSITORIO CASI COMPLETO - Algunos archivos menores faltan');
        } else {
            console.log('✅ REPOSITORIO COMPLETO - Todos los archivos están presentes');
        }
        
        return resultados;
    }
    
    // Función principal
    async function ejecutarAuditoria() {
        console.log('🚀 Iniciando auditoría completa...');
        
        await auditarHTML();
        await auditarDependenciasJS();
        await auditarIndicesGeo();
        
        const reporte = generarReporte();
        
        // Guardar resultados en el objeto global para acceso desde consola
        window.auditoriaMAIRA = reporte;
        
        // Enviar evento de auditoría completada
        window.dispatchEvent(new CustomEvent('auditoriaCompleta', {
            detail: reporte
        }));
        
        return reporte;
    }
    
    // Exportar función para uso manual
    window.auditarMAIRA = ejecutarAuditoria;
    
    // Ejecutar automáticamente
    ejecutarAuditoria();
    
})();
