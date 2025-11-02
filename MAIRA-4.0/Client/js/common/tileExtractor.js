// tileExtractor.js - Extractor universal para tiles empaquetados en tar.gz
// Compatible con Render y desarrollo local

class TileExtractor {
    constructor() {
        this.cache = new Map();
        this.tarCache = new Map();
        this.config = {
            maxCacheSize: 100,
            maxTarCacheSize: 10,
            cacheTimeout: 600000 // 10 minutos
        };
    }

    // Descargar y extraer archivo específico de un tar.gz
    async extractFileFromTarGz(tarUrl, targetFilename) {
        const cacheKey = `${tarUrl}_${targetFilename}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            // Descargar tar.gz (con cache)
            let tarData;
            if (this.tarCache.has(tarUrl)) {
                const cached = this.tarCache.get(tarUrl);
                if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                    tarData = cached.data;
                } else {
                    this.tarCache.delete(tarUrl);
                }
            }

            if (!tarData) {
                console.log(`📦 Descargando tar.gz: ${tarUrl}`);
                const response = await fetch(tarUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} para ${tarUrl}`);
                }
                tarData = await response.arrayBuffer();
                
                // Cache del tar (limitar tamaño)
                if (this.tarCache.size >= this.config.maxTarCacheSize) {
                    const firstKey = this.tarCache.keys().next().value;
                    this.tarCache.delete(firstKey);
                }
                this.tarCache.set(tarUrl, {
                    data: tarData,
                    timestamp: Date.now()
                });
            }

            // Extraer archivo específico usando tar.js o similar
            const extractedFile = await this.extractFromTar(tarData, targetFilename);
            
            // Cache del archivo extraído
            if (this.cache.size >= this.config.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            this.cache.set(cacheKey, {
                data: extractedFile,
                timestamp: Date.now()
            });

            return extractedFile;

        } catch (error) {
            console.error(`❌ Error extrayendo ${targetFilename} de ${tarUrl}:`, error);
            return null;
        }
    }

    // Extraer archivo específico de un tar usando implementación simple
    async extractFromTar(tarData, targetFilename) {
        try {
            // Para navegador: usar una implementación simple de tar
            // Esta es una versión simplificada - en producción usarías una librería como tar-js
            
            const dataView = new DataView(tarData);
            let offset = 0;
            
            while (offset < tarData.byteLength) {
                // Leer header de TAR (512 bytes)
                if (offset + 512 > tarData.byteLength) break;
                
                // Nombre del archivo (primeros 100 bytes del header)
                const nameBytes = new Uint8Array(tarData, offset, 100);
                let filename = '';
                for (let i = 0; i < 100 && nameBytes[i] !== 0; i++) {
                    filename += String.fromCharCode(nameBytes[i]);
                }
                
                // Tamaño del archivo (bytes 124-135 del header, en octal)
                const sizeBytes = new Uint8Array(tarData, offset + 124, 11);
                let sizeStr = '';
                for (let i = 0; i < 11 && sizeBytes[i] !== 0; i++) {
                    sizeStr += String.fromCharCode(sizeBytes[i]);
                }
                const fileSize = parseInt(sizeStr.trim(), 8);
                
                offset += 512; // Saltar header
                
                if (filename === targetFilename || filename.endsWith('/' + targetFilename)) {
                    // Encontramos nuestro archivo
                    console.log(`✅ Archivo encontrado en TAR: ${filename} (${fileSize} bytes)`);
                    return tarData.slice(offset, offset + fileSize);
                }
                
                // Saltar al siguiente archivo (archivos están alineados a 512 bytes)
                const paddedSize = Math.ceil(fileSize / 512) * 512;
                offset += paddedSize;
            }
            
            throw new Error(`Archivo ${targetFilename} no encontrado en TAR`);
            
        } catch (error) {
            console.error('❌ Error procesando TAR:', error);
            return null;
        }
    }

    // Determinar URLs de tar.gz para diferentes tipos de datos
    getTarUrls(dataType, region, tileName) {
        // Detectar si estamos en Render o local
        const isRender = window.location.hostname.includes('onrender.com');

        const baseUrls = {
            elevation: isRender ? [
                // En Render: usar proxy de GitHub
                '/api/proxy/github/Altimetria_Mini_Tiles/'
            ] : [
                // En local: usar rutas relativas
                '../Libs/datos_argentina/Altimetria_Mini_Tiles/'
            ],
            vegetation: isRender ? [
                // En Render: usar proxy de GitHub
                '/api/proxy/github/Vegetacion_Mini_Tiles/'
            ] : [
                // En local: usar rutas relativas
                '../Libs/datos_argentina/Vegetacion_Mini_Tiles/'
            ]
        };

        return baseUrls[dataType] || [];
    }

    // Método principal: obtener tile
    async getTile(dataType, region, tileName) {
        const tarUrls = this.getTarUrls(dataType, region, tileName);
        
        for (const tarUrl of tarUrls) {
            try {
                const tileData = await this.extractFileFromTarGz(tarUrl, tileName);
                if (tileData) {
                    return tileData;
                }
            } catch (error) {
                console.warn(`⚠️ Fallback: ${tarUrl} failed:`, error.message);
                continue;
            }
        }
        
        return null;
    }

    // Limpiar caches
    clearCache() {
        this.cache.clear();
        this.tarCache.clear();
    }

    // Información de cache
    getCacheInfo() {
        return {
            files: this.cache.size,
            tars: this.tarCache.size,
            maxFiles: this.config.maxCacheSize,
            maxTars: this.config.maxTarCacheSize
        };
    }
}

// Crear instancia global
window.TileExtractor = window.TileExtractor || new TileExtractor();

// Función helper para usar con elevation handler
window.extractTileFromTar = async function(region, tileName) {
    const extractor = window.TileExtractor;
    return await extractor.getTile('elevation', region, tileName);
};

console.log('🔧 TileExtractor cargado - Compatible con tar.gz empaquetados');
