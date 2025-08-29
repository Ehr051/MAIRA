#!/usr/bin/env python3
"""
uvicorn_adaptive.py - Configuración adaptativa de Uvicorn
Detecta automáticamente uvloop y httptools disponibles
"""
import os
import sys

def get_uvicorn_config():
    """Obtiene configuración de Uvicorn basada en dependencias disponibles"""
    config = {
        'host': '0.0.0.0',
        'port': int(os.environ.get('PORT', 5000)),
        'access_log': True,
        'use_colors': False
    }
    
    # Detectar uvloop
    try:
        import uvloop
        config['loop'] = 'uvloop'
        print("✅ uvloop disponible - usando loop optimizado")
    except ImportError:
        print("⚠️ uvloop no disponible - usando asyncio estándar")
    
    # Detectar httptools
    try:
        import httptools
        config['http'] = 'httptools'
        print("✅ httptools disponible - usando HTTP optimizado")
    except ImportError:
        print("⚠️ httptools no disponible - usando h11 estándar")
    
    return config

def run_uvicorn():
    """Ejecuta Uvicorn con configuración adaptativa"""
    try:
        import uvicorn
    except ImportError:
        print("❌ Uvicorn no está instalado")
        print("💡 Instalar con: pip install uvicorn")
        sys.exit(1)
    
    config = get_uvicorn_config()
    
    print("🚀 MAIRA - Servidor Uvicorn (Configuración Adaptativa)")
    print("=" * 55)
    print(f"🌐 Host: {config['host']}")
    print(f"🔌 Puerto: {config['port']}")
    print(f"🔄 Loop: {config.get('loop', 'asyncio (estándar)')}")
    print(f"📡 HTTP: {config.get('http', 'h11 (estándar)')}")
    print("=" * 55)
    
    # Importar app
    from app import create_asgi_app
    
    # Ejecutar Uvicorn
    uvicorn.run(
        "app:create_asgi_app",
        factory=True,
        **config
    )

if __name__ == "__main__":
    run_uvicorn()
