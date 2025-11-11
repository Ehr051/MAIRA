#!/usr/bin/env python3
archivo = "Client/js/modules/juegoV2/core/ORBATManager.js"

with open(archivo, 'r', encoding='utf-8') as f:
    contenido = f.read()

# Buscar método desplegarSubordinados y agregar lógica de herencia al final
old_desplegar = """            console.log(`✅ ${subordinadosCreados} subordinados desplegados`, this.subordinados);
            
            return this.subordinados;
        } catch (error) {
            console.error('❌ Error desplegando subordinados:', error);
            return [];
        }
    }"""

new_desplegar = """            console.log(`✅ ${subordinadosCreados} subordinados desplegados`, this.subordinados);
            
            // 🆕 HERENCIA DE ÓRDENES: Si unidad padre tiene orden activa, subordinados heredan
            this.propagarOrdenASubordinados(unidadPadre, this.subordinados);
            
            return this.subordinados;
        } catch (error) {
            console.error('❌ Error desplegando subordinados:', error);
            return [];
        }
    }

    /**
     * 🆕 Propaga la orden del padre a subordinados recién desplegados
     * Uso: Si una sección con orden de ataque se despliega en equipos, los equipos heredan el ataque
     */
    propagarOrdenASubordinados(unidadPadre, subordinados) {
        if (!window.gestorOrdenes) return;

        // Buscar si el padre tiene orden activa
        const ordenesPadre = window.gestorOrdenes.obtenerOrdenesPorUnidad?.(unidadPadre.id);
        if (!ordenesPadre || ordenesPadre.length === 0) return;

        // Obtener la orden más reciente del padre
        const ordenPadre = ordenesPadre[ordenesPadre.length - 1];
        console.log(`📋 Propagando orden ${ordenPadre.tipo} a ${subordinados.length} subordinados`);

        // Crear la misma orden para cada subordinado
        subordinados.forEach(sub => {
            // Clonar configuración de la orden
            const configHeredada = {
                unidadId: sub.id,
                unidadRef: sub,
                destino: ordenPadre.destino,
                prioridad: ordenPadre.prioridad,
                tipo: ordenPadre.tipo
            };

            // Si tiene fases, clonarlas
            if (ordenPadre.fases && ordenPadre.fases.length > 0) {
                // Las fases se agregarán después de crear la orden
                configHeredada.fases = ordenPadre.fases.map(fase => ({
                    tipo: fase.tipo,
                    destino: fase.destino,
                    condiciones: [...(fase.condiciones || [])],
                    metadata: { ...fase.metadata }
                }));
            }

            // Crear orden según tipo
            try {
                switch(ordenPadre.tipo) {
                    case 'movimiento':
                        window.gestorOrdenes.crearOrdenMovimiento?.({ ...configHeredada, origen: sub.getLatLng() });
                        break;
                    case 'ataque':
                        if (ordenPadre.objetivo) configHeredada.objetivo = ordenPadre.objetivo;
                        window.gestorOrdenes.crearOrdenAtaque?.(configHeredada);
                        break;
                    case 'defensa':
                        window.gestorOrdenes.crearOrdenDefensa?.(configHeredada);
                        break;
                }
                console.log(`   ✅ Subordinado ${sub.id} heredó orden ${ordenPadre.tipo}`);
            } catch (error) {
                console.error(`   ❌ Error heredando orden a ${sub.id}:`, error);
            }
        });
    }"""

contenido = contenido.replace(old_desplegar, new_desplegar)

with open(archivo, 'w', encoding='utf-8') as f:
    f.write(contenido)

print("✅ Herencia de órdenes agregada a ORBATManager.js")
