/**
 * Font Awesome Test & Fix
 * Verifica y corrige problemas de iconos de Font A                        fallbackEl.style.color = '#666';
                        fallbackEl.title = `Icono ${iconClass} no disponible`;
                        parent.replaceChild(fallbackEl, el);
                    }
                });
            }
        });
    }*/

(function() {
    'use strict';

    function testFontAwesome() {
        // 🔇 LOGS DESHABILITADOS - Solo mostrar errores críticos
        
        // Verificar si el CSS está cargado
        const faLink = document.querySelector('link[href*="fontawesome"], link[href*="font-awesome"]');
        if (!faLink) {
            console.error('❌ Font Awesome CSS no encontrado');
            return false;
        }

        // Verificar si hay iconos en el DOM
        const faIcons = document.querySelectorAll('[class*="fa-"]');

        // Test de renderizado de iconos específicos - INCLUYENDO LOS DE PLANEAMIENTO
        const testIcons = [
            'fa-eye', 'fa-mountain', 'fa-road', 'fa-satellite-dish', 
            'fa-bus', 'fa-tree', 'fa-tools', 'fa-search', 
            'fa-ruler-combined', 'fa-chart-line', 'fa-cube', 'fa-route',
            'fa-hand-paper', 'fa-plus', 'fa-question', 'fa-layer-group',
            'fa-upload', 'fa-save', 'fa-print'
        ];

        const problemIcons = [];

        testIcons.forEach(iconClass => {
            const icon = document.querySelector(`.${iconClass}`);
            if (icon) {
                const style = window.getComputedStyle(icon, '::before');
                const content = style.getPropertyValue('content');
                
                if (!content || content === 'none' || content === '""') {
                    problemIcons.push(iconClass);
                }
            }
        });

        if (problemIcons.length > 0) {
            console.warn('❌ Font Awesome: Iconos problemáticos:', problemIcons);
            fixProblemIcons(problemIcons);
        }

        return problemIcons.length === 0;
    }

    function fixProblemIcons(problemIcons) {
        // 🔇 LOGS DESHABILITADOS - Solo mostrar resumen

        // Mapeo de iconos problemáticos a alternativas
        const iconFixes = {
            'fa-satellite-dish': 'fa-satellite',
            'fa-ruler-combined': 'fa-ruler',
            'fa-chart-line': 'fa-chart-area'
        };

        problemIcons.forEach(iconClass => {
            const elements = document.querySelectorAll(`.${iconClass}`);
            const replacement = iconFixes[iconClass];

            if (replacement) {
                elements.forEach(el => {
                    el.classList.remove(iconClass);
                    el.classList.add(replacement);
                });
            } else {
                // Fallback más agresivo - reemplazar completamente el elemento
                elements.forEach(el => {
                    const parent = el.parentNode;
                    if (parent) {
                        // Crear un nuevo elemento con texto descriptivo
                        const fallbackText = el.textContent.trim() || el.className.split(' ').find(cls => cls.startsWith('fa-'))?.replace('fa-', '') || 'icon';
                        const fallbackEl = document.createElement('span');
                        fallbackEl.textContent = `[${fallbackText}]`;
                        fallbackEl.style.fontFamily = 'monospace';
                        fallbackEl.style.fontSize = '12px';
                        fallbackEl.style.color = '#666';
                        fallbackEl.title = `Icono ${iconClass} no disponible`;
                        parent.replaceChild(fallbackEl, el);
                    }                    
                });
            }
        });
    }

    function ensureFontAwesome() {
        return new Promise((resolve) => {
            // Si ya está cargado, test inmediatamente
            if (document.readyState === 'complete') {
                setTimeout(() => {
                    const result = testFontAwesome();
                    resolve(result);
                }, 500); // Dar tiempo para que los estilos se apliquen
            } else {
                // Esperar a que la página esté completamente cargada
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        const result = testFontAwesome();
                        resolve(result);
                    }, 500);
                });
            }
        });
    }

    // Auto-ejecutar cuando el DOM esté listo Y después de un delay para controles dinámicos
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Delay adicional para que se inicialicen los controles dinámicos
            setTimeout(ensureFontAwesome, 2000);
            // Ejecutar periódicamente durante los primeros 10 segundos por si hay controles muy tardíos
            let checkCount = 0;
            const periodicCheck = setInterval(() => {
                checkCount++;
                if (checkCount <= 5) { // 5 checks cada 2 segundos = 10 segundos
                    ensureFontAwesome();
                } else {
                    clearInterval(periodicCheck);
                }
            }, 2000);
        });
    } else {
        // Delay adicional para que se inicialicen los controles dinámicos
        setTimeout(ensureFontAwesome, 2000);
        // Ejecutar periódicamente durante los primeros 10 segundos
        let checkCount = 0;
        const periodicCheck = setInterval(() => {
            checkCount++;
            if (checkCount <= 5) {
                ensureFontAwesome();
            } else {
                clearInterval(periodicCheck);
            }
        }, 2000);
    }

    // Exportar función para uso manual
    window.testFontAwesome = testFontAwesome;
    window.fixFontAwesome = () => ensureFontAwesome();

    console.log('📦 Font Awesome Test & Fix cargado');
})();
