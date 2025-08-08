// github_releases_config.js
// Configuración automática para GitHub Releases tiles

(function() {
    console.log('🚀 Configurando GitHub Releases para tiles...');

    // URLs que estarán disponibles después del release
    const GITHUB_RELEASES_CONFIG = {
        release_tag: 'tiles-v1.0',
        base_url: 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v1.0',
        cdn_url: 'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@tiles-v1.0',
        files: {
            altimetria: 'altimetria_tiles.tar.gz',
            vegetacion: 'vegetacion_part_aa.tar.gz',
            manifest: 'files_manifest.json'
        }
    };

    // URLs completas
    const URLS = {
        // URLs directas de GitHub (disponibles inmediatamente)
        direct: {
            altimetria: `${GITHUB_RELEASES_CONFIG.base_url}/${GITHUB_RELEASES_CONFIG.files.altimetria}`,
            vegetacion: `${GITHUB_RELEASES_CONFIG.base_url}/${GITHUB_RELEASES_CONFIG.files.vegetacion}`,
            manifest: `${GITHUB_RELEASES_CONFIG.base_url}/${GITHUB_RELEASES_CONFIG.files.manifest}`
        },
        // URLs de CDN (disponibles en 5-10 minutos)
        cdn: {
            altimetria: `${GITHUB_RELEASES_CONFIG.cdn_url}/${GITHUB_RELEASES_CONFIG.files.altimetria}`,
            vegetacion: `${GITHUB_RELEASES_CONFIG.cdn_url}/${GITHUB_RELEASES_CONFIG.files.vegetacion}`,
            manifest: `${GITHUB_RELEASES_CONFIG.cdn_url}/${GITHUB_RELEASES_CONFIG.files.manifest}`
        }
    };

    // Función para verificar si el release está disponible
    async function checkReleaseAvailability() {
        try {
            console.log('🔍 Verificando disponibilidad del release...');
            
            // Probar URL directa primero
            const directResponse = await fetch(URLS.direct.manifest, { method: 'HEAD' });
            if (directResponse.ok) {
                console.log('✅ Release disponible (URL directa)');
                return { available: true, useCDN: false };
            }

            // Probar CDN
            const cdnResponse = await fetch(URLS.cdn.manifest, { method: 'HEAD' });
            if (cdnResponse.ok) {
                console.log('✅ Release disponible (CDN)');
                return { available: true, useCDN: true };
            }

            console.log('⏳ Release aún no disponible');
            return { available: false, useCDN: false };
        } catch (error) {
            console.log('⏳ Release aún no disponible:', error.message);
            return { available: false, useCDN: false };
        }
    }

    // Configurar el adaptador cuando el release esté listo
    async function configureGitHubReleases() {
        const status = await checkReleaseAvailability();
        
        if (status.available && window.externalTilesAdapter) {
            const config = window.externalTilesAdapter.getConfig();
            
            // Actualizar configuración del proveedor
            config.providers.github_releases_cdn.base_url = status.useCDN ? 
                GITHUB_RELEASES_CONFIG.cdn_url : GITHUB_RELEASES_CONFIG.base_url;
            config.providers.github_releases_cdn.cdn_url = status.useCDN ?
                GITHUB_RELEASES_CONFIG.cdn_url : GITHUB_RELEASES_CONFIG.base_url;
            
            config.github_release_ready = true;
            
            console.log('✅ GitHub Releases configurado');
            console.log('🌐 Usando:', status.useCDN ? 'CDN JSDelivr' : 'GitHub directo');
            console.log('📍 Base URL:', config.providers.github_releases_cdn.base_url);
            
            // Emitir evento de configuración completa
            window.dispatchEvent(new CustomEvent('githubReleasesReady', {
                detail: { 
                    useCDN: status.useCDN,
                    baseUrl: config.providers.github_releases_cdn.base_url,
                    urls: status.useCDN ? URLS.cdn : URLS.direct
                }
            }));
            
            // Actualizar banner temporal si existe
            if (window.updateTilesStatus) {
                window.updateTilesStatus('GitHub Releases CDN activo - tiles disponibles', 'success');
            }
            
            return true;
        }
        
        return false;
    }

    // Función para mostrar URLs de prueba
    function showTestUrls() {
        console.log('🔗 URLs de prueba:');
        console.log('📊 Manifest (directo):', URLS.direct.manifest);
        console.log('📊 Manifest (CDN):', URLS.cdn.manifest);
        console.log('⛰️ Altimetría (directo):', URLS.direct.altimetria);
        console.log('⛰️ Altimetría (CDN):', URLS.cdn.altimetria);
        console.log('🌿 Vegetación (directo):', URLS.direct.vegetacion);
        console.log('🌿 Vegetación (CDN):', URLS.cdn.vegetacion);
    }

    // Intentar configuración inmediata
    configureGitHubReleases().then(configured => {
        if (!configured) {
            console.log('⏳ Release aún no publicado, verificando cada 30 segundos...');
            
            // Verificar periódicamente hasta que esté disponible
            const checkInterval = setInterval(async () => {
                const configured = await configureGitHubReleases();
                if (configured) {
                    clearInterval(checkInterval);
                    console.log('🎉 GitHub Releases configurado exitosamente!');
                }
            }, 30000); // Verificar cada 30 segundos
            
            // Timeout después de 10 minutos
            setTimeout(() => {
                clearInterval(checkInterval);
                console.log('⚠️ Timeout: Release no disponible después de 10 minutos');
            }, 600000);
        }
    });

    // Exponer funciones para debugging
    window.githubReleasesConfig = {
        checkAvailability: checkReleaseAvailability,
        configure: configureGitHubReleases,
        showUrls: showTestUrls,
        urls: URLS,
        config: GITHUB_RELEASES_CONFIG
    };

    // Mostrar URLs para testing manual
    showTestUrls();

    console.log('✅ Configuración GitHub Releases cargada');

})();
