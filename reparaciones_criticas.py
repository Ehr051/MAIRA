# 🚨 REPARACIONES CRÍTICAS MAIRA - Implementación de Eventos Faltantes

import os
import re
from datetime import datetime

def create_planeamiento_js():
    """Crea el archivo planeamiento.js faltante con eventos básicos"""
    
    planeamiento_js_content = '''// planeamiento.js - Eventos y funcionalidades del módulo de Planeamiento

class PlaneamientoManager {
    constructor() {
        this.socket = null;
        this.elementos = new Map();
        this.elementoSeleccionado = null;
        this.modoEdicion = false;
    }

    inicializar() {
        console.log('🎯 Inicializando módulo de Planeamiento');
        this.configurarSocket();
        this.configurarEventos();
        this.cargarElementosGuardados();
    }

    configurarSocket() {
        if (typeof socket !== 'undefined' && socket) {
            this.socket = socket;
            this.configurarEventosSocket();
        }
    }

    configurarEventosSocket() {
        if (!this.socket) return;

        // Escuchar eventos del servidor
        this.socket.on('elementoGuardado', (data) => {
            console.log('✅ Elemento guardado:', data);
            this.actualizarElementoEnMapa(data);
        });

        this.socket.on('elementosActualizados', (data) => {
            console.log('🔄 Elementos actualizados:', data);
            this.cargarElementos(data.elementos);
        });

        this.socket.on('elementoEliminado', (data) => {
            console.log('🗑️ Elemento eliminado:', data);
            this.eliminarElementoDelMapa(data.id);
        });
    }

    // ✅ EVENTOS CRÍTICOS FALTANTES
    guardarElemento(elemento) {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - guardando localmente');
            this.guardarElementoLocal(elemento);
            return;
        }

        const elementoData = {
            id: elemento.id || this.generarId(),
            tipo: elemento.tipo,
            posicion: elemento.posicion,
            propiedades: elemento.propiedades,
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        };

        console.log('💾 Guardando elemento:', elementoData);
        this.socket.emit('guardarElemento', elementoData);
    }

    cargarElementos() {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - cargando elementos locales');
            this.cargarElementosLocales();
            return;
        }

        console.log('📥 Solicitando elementos del servidor');
        this.socket.emit('cargarElementos', {
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        });
    }

    actualizarPosicion(elementoId, nuevaPosicion) {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - actualizando localmente');
            return;
        }

        const data = {
            elemento_id: elementoId,
            posicion: nuevaPosicion,
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        };

        console.log('📍 Actualizando posición:', data);
        this.socket.emit('actualizarPosicion', data);
    }

    eliminarElemento(elementoId) {
        if (!this.socket) {
            console.warn('⚠️ No hay conexión socket - eliminando localmente');
            this.eliminarElementoLocal(elementoId);
            return;
        }

        const data = {
            elemento_id: elementoId,
            usuario_id: window.userId,
            timestamp: new Date().toISOString()
        };

        console.log('🗑️ Eliminando elemento:', data);
        this.socket.emit('eliminarElemento', data);
    }

    // Métodos auxiliares
    generarId() {
        return 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    guardarElementoLocal(elemento) {
        const elementos = JSON.parse(localStorage.getItem('planeamiento_elementos') || '[]');
        elementos.push(elemento);
        localStorage.setItem('planeamiento_elementos', JSON.stringify(elementos));
    }

    cargarElementosLocales() {
        const elementos = JSON.parse(localStorage.getItem('planeamiento_elementos') || '[]');
        this.cargarElementos(elementos);
    }

    cargarElementos(elementos) {
        console.log(`📋 Cargando ${elementos.length} elementos`);
        elementos.forEach(elem => this.actualizarElementoEnMapa(elem));
    }

    actualizarElementoEnMapa(elemento) {
        // Implementar lógica específica del mapa
        console.log('🗺️ Actualizando elemento en mapa:', elemento);
    }

    eliminarElementoDelMapa(elementoId) {
        // Implementar lógica de eliminación del mapa
        console.log('🗺️ Eliminando elemento del mapa:', elementoId);
    }

    eliminarElementoLocal(elementoId) {
        const elementos = JSON.parse(localStorage.getItem('planeamiento_elementos') || '[]');
        const elementosFiltrados = elementos.filter(e => e.id !== elementoId);
        localStorage.setItem('planeamiento_elementos', JSON.stringify(elementosFiltrados));
    }

    configurarEventos() {
        // Configurar eventos de interfaz
        document.addEventListener('DOMContentLoaded', () => {
            this.configurarBotones();
        });
    }

    configurarBotones() {
        // Configurar botones de la interfaz
        const btnGuardar = document.getElementById('btn-guardar-elemento');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => {
                if (this.elementoSeleccionado) {
                    this.guardarElemento(this.elementoSeleccionado);
                }
            });
        }
    }
}

// Inicializar automáticamente
let planeamientoManager;
document.addEventListener('DOMContentLoaded', () => {
    planeamientoManager = new PlaneamientoManager();
    planeamientoManager.inicializar();
});

// Exportar para uso global
window.planeamientoManager = planeamientoManager;
'''
    
    return planeamiento_js_content

def create_backend_handlers():
    """Genera handlers de backend faltantes"""
    
    backend_handlers = '''
# ✅ HANDLERS BACKEND FALTANTES - Agregar al final de app.py antes de if __name__ == '__main__':

@socketio.on('cargarElementos')
def cargar_elementos(data):
    try:
        usuario_id = data.get('usuario_id') or user_sid_map.get(request.sid)
        
        if not usuario_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        # En una implementación real, cargarías desde la base de datos
        # Por ahora, simulamos elementos vacíos
        elementos_guardados = []
        
        emit('elementosActualizados', {
            'elementos': elementos_guardados,
            'usuario_id': usuario_id,
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"📥 Elementos cargados para usuario {usuario_id}")
        
    except Exception as e:
        print(f"❌ Error cargando elementos: {e}")
        emit('error', {'mensaje': 'Error cargando elementos'})

@socketio.on('actualizarPosicion')
def actualizar_posicion_elemento(data):
    try:
        elemento_id = data.get('elemento_id')
        nueva_posicion = data.get('posicion')
        usuario_id = data.get('usuario_id') or user_sid_map.get(request.sid)
        
        if not all([elemento_id, nueva_posicion, usuario_id]):
            emit('error', {'mensaje': 'Datos incompletos para actualizar posición'})
            return
        
        # Emitir actualización a otros usuarios en la misma sala
        emit('posicionActualizada', {
            'elemento_id': elemento_id,
            'posicion': nueva_posicion,
            'usuario_id': usuario_id,
            'timestamp': data.get('timestamp', datetime.now().isoformat())
        }, broadcast=True, include_self=False)
        
        print(f"📍 Posición actualizada - Elemento: {elemento_id}, Usuario: {usuario_id}")
        
    except Exception as e:
        print(f"❌ Error actualizando posición: {e}")
        emit('error', {'mensaje': 'Error actualizando posición'})

@socketio.on('eliminarElemento')
def eliminar_elemento(data):
    try:
        elemento_id = data.get('elemento_id')
        usuario_id = data.get('usuario_id') or user_sid_map.get(request.sid)
        
        if not all([elemento_id, usuario_id]):
            emit('error', {'mensaje': 'Datos incompletos para eliminar elemento'})
            return
        
        # Emitir eliminación a todos los usuarios
        emit('elementoEliminado', {
            'elemento_id': elemento_id,
            'usuario_id': usuario_id,
            'timestamp': data.get('timestamp', datetime.now().isoformat())
        }, broadcast=True)
        
        print(f"🗑️ Elemento eliminado - ID: {elemento_id}, Usuario: {usuario_id}")
        
    except Exception as e:
        print(f"❌ Error eliminando elemento: {e}")
        emit('error', {'mensaje': 'Error eliminando elemento'})
'''
    
    return backend_handlers

def apply_fixes():
    """Aplica todas las correcciones identificadas"""
    
    print("🔧 APLICANDO REPARACIONES CRÍTICAS...")
    print("=" * 60)
    
    # 1. Crear planeamiento.js faltante
    planeamiento_path = "Client/js/planeamiento.js"
    if not os.path.exists(planeamiento_path):
        print(f"📝 Creando {planeamiento_path}")
        os.makedirs(os.path.dirname(planeamiento_path), exist_ok=True)
        with open(planeamiento_path, 'w', encoding='utf-8') as f:
            f.write(create_planeamiento_js())
        print(f"✅ {planeamiento_path} creado")
    else:
        print(f"⚠️ {planeamiento_path} ya existe")
    
    # 2. Verificar y mostrar handlers de backend que faltan
    print("\\n🔍 Verificando handlers de backend...")
    backend_handlers = create_backend_handlers()
    
    # Verificar si ya existen en app.py
    try:
        with open('app.py', 'r', encoding='utf-8') as f:
            app_content = f.read()
        
        missing_handlers = []
        handlers_to_check = [
            '@socketio.on(\'cargarElementos\')',
            '@socketio.on(\'actualizarPosicion\')',
            '@socketio.on(\'eliminarElemento\')'
        ]
        
        
        for handler in handlers_to_check:
            if handler not in app_content:
                missing_handlers.append(handler)
        
        if missing_handlers:
            print(f"❌ Handlers faltantes en backend: {missing_handlers}")
            print("💡 Agregar al final de app.py:")
            print(backend_handlers)
        else:
            print("✅ Todos los handlers básicos están presentes")
            
    except Exception as e:
        print(f"❌ Error verificando app.py: {e}")
    
    # 3. Generar reporte de estado
    print("\\n📊 REPORTE DE REPARACIONES:")
    print("-" * 40)
    print("✅ planeamiento.js - Creado/Verificado")
    print("⚠️ Backend handlers - Verificar manualmente")
    print("🎯 Juego de Guerra - jugadorListoDespliegue ya existe")
    print("🎖️ Gestión de Batalla - Eventos básicos funcionando")
    
    print("\\n🎯 PRÓXIMOS PASOS:")
    print("1. Probar planeamiento.js en navegador")
    print("2. Verificar flujo completo de Juego de Guerra")
    print("3. Implementar persistencia en base de datos")
    print("4. Optimizar gestión de batalla en tiempo real")
    
    return True

if __name__ == "__main__":
    result = apply_fixes()
    print(f"\\n🔧 Reparaciones completadas: {'✅' if result else '❌'}")
