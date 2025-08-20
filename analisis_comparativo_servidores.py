#!/usr/bin/env python3
# analisis_comparativo_servidores.py - Análisis completo de funcionalidades entre servidores

import os
import re
from datetime import datetime

def extraer_eventos_socketio(archivo):
    """Extrae todos los eventos de SocketIO de un archivo"""
    eventos = []
    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
            
        # Buscar eventos @socketio.on
        patron_python = r"@socketio\.on\(['\"]([^'\"]+)['\"]"
        matches_python = re.findall(patron_python, contenido)
        
        # Buscar eventos socket.on en JavaScript
        patron_js = r"socket\.on\(['\"]([^'\"]+)['\"]"
        matches_js = re.findall(patron_js, contenido)
        
        return matches_python + matches_js
        
    except Exception as e:
        print(f"Error leyendo {archivo}: {e}")
        return []

def extraer_rutas_api(archivo):
    """Extrae todas las rutas API de un archivo"""
    rutas = []
    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
            
        # Buscar rutas @app.route
        patron_rutas = r"@app\.route\(['\"]([^'\"]+)['\"]"
        matches = re.findall(patron_rutas, contenido)
        
        return matches
        
    except Exception as e:
        print(f"Error leyendo {archivo}: {e}")
        return []

def analizar_funcionalidades():
    """Análisis completo de funcionalidades entre servidores"""
    
    print("🔍 ANÁLISIS COMPARATIVO DE SERVIDORES MAIRA")
    print("=" * 70)
    
    archivos = {
        "app.py (ACTUAL)": "app.py",
        "serverhttps.py": "Server/serverhttps.py", 
        "node.js": "Server/node.js"
    }
    
    # Análisis de eventos SocketIO
    print("\n🔌 EVENTOS SOCKETIO:")
    print("-" * 50)
    
    eventos_por_servidor = {}
    for nombre, archivo in archivos.items():
        if os.path.exists(archivo):
            eventos = extraer_eventos_socketio(archivo)
            eventos_por_servidor[nombre] = set(eventos)
            print(f"\n{nombre}: {len(eventos)} eventos")
            for evento in sorted(eventos):
                print(f"   • {evento}")
        else:
            print(f"\n{nombre}: ❌ ARCHIVO NO ENCONTRADO")
            eventos_por_servidor[nombre] = set()
    
    # Análisis de rutas API
    print("\n\n🌐 RUTAS API:")
    print("-" * 50)
    
    rutas_por_servidor = {}
    for nombre, archivo in archivos.items():
        if os.path.exists(archivo) and archivo.endswith('.py'):
            rutas = extraer_rutas_api(archivo)
            rutas_por_servidor[nombre] = set(rutas)
            print(f"\n{nombre}: {len(rutas)} rutas")
            for ruta in sorted(rutas):
                print(f"   • {ruta}")
    
    # Comparación de eventos faltantes
    print("\n\n🔍 ANÁLISIS DE DIFERENCIAS:")
    print("-" * 50)
    
    if "serverhttps.py" in eventos_por_servidor and "app.py (ACTUAL)" in eventos_por_servidor:
        https_eventos = eventos_por_servidor["serverhttps.py"]
        app_eventos = eventos_por_servidor["app.py (ACTUAL)"]
        
        faltantes_en_app = https_eventos - app_eventos
        nuevos_en_app = app_eventos - https_eventos
        
        print(f"\n📉 EVENTOS PERDIDOS en app.py ({len(faltantes_en_app)}):")
        for evento in sorted(faltantes_en_app):
            print(f"   ❌ {evento}")
            
        print(f"\n📈 EVENTOS NUEVOS en app.py ({len(nuevos_en_app)}):")
        for evento in sorted(nuevos_en_app):
            print(f"   ✅ {evento}")
    
    if "serverhttps.py" in eventos_por_servidor and "node.js" in eventos_por_servidor:
        https_eventos = eventos_por_servidor["serverhttps.py"]
        node_eventos = eventos_por_servidor["node.js"]
        
        faltantes_en_node = https_eventos - node_eventos
        
        print(f"\n📉 EVENTOS NO IMPLEMENTADOS en node.js ({len(faltantes_en_node)}):")
        for evento in sorted(faltantes_en_node):
            print(f"   ❌ {evento}")
    
    # Funcionalidades específicas
    print("\n\n🎯 FUNCIONALIDADES ESPECÍFICAS:")
    print("-" * 50)
    
    funcionalidades_criticas = [
        'crearPartida', 'unirseAPartida', 'iniciarPartida', 'cancelarPartida',
        'mensajeChat', 'mensajeJuego', 'login', 'disconnect', 'connect',
        'actualizarPosicionGB', 'elementoConectado', 'nuevoElemento',
        'crearOperacionGB', 'unirseOperacionGB', 'sectorConfirmado',
        'cambioFase', 'inicioDespliegue', 'jugadorListo', 'enviarInvitacion'
    ]
    
    print("\nEstado de funcionalidades críticas:")
    for func in funcionalidades_criticas:
        estado_app = "✅" if func in eventos_por_servidor.get("app.py (ACTUAL)", set()) else "❌"
        estado_https = "✅" if func in eventos_por_servidor.get("serverhttps.py", set()) else "❌"
        estado_node = "✅" if func in eventos_por_servidor.get("node.js", set()) else "❌"
        
        print(f"   {func:20} | app.py: {estado_app} | https: {estado_https} | node: {estado_node}")
    
    # Características específicas por servidor
    print("\n\n🏗️ CARACTERÍSTICAS ESPECÍFICAS:")
    print("-" * 50)
    
    # Verificar manejo de archivos
    print("\n📁 MANEJO DE ARCHIVOS:")
    for nombre, archivo in archivos.items():
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
            tiene_uploads = 'upload' in contenido.lower()
            tiene_adjuntos = 'adjunto' in contenido.lower()
            tiene_ssl = 'ssl' in contenido.lower() or 'https' in contenido.lower()
            tiene_db_postgres = 'postgresql' in contenido.lower() or 'psycopg2' in contenido
            tiene_db_mysql = 'mysql' in contenido.lower() or 'pymysql' in contenido
            
            print(f"\n{nombre}:")
            print(f"   Uploads: {'✅' if tiene_uploads else '❌'}")
            print(f"   Adjuntos: {'✅' if tiene_adjuntos else '❌'}")
            print(f"   SSL/HTTPS: {'✅' if tiene_ssl else '❌'}")
            print(f"   PostgreSQL: {'✅' if tiene_db_postgres else '❌'}")
            print(f"   MySQL: {'✅' if tiene_db_mysql else '❌'}")
    
    print(f"\n⏰ Análisis completado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Recomendaciones
    print("\n\n💡 RECOMENDACIONES:")
    print("-" * 50)
    print("1. Migrar funcionalidades faltantes de serverhttps.py a app.py")
    print("2. Implementar manejo de uploads si no existe")
    print("3. Verificar compatibilidad de eventos con frontend")
    print("4. Considerar mantener node.js para funcionalidades específicas")
    print("5. Documentar diferencias para futura referencia")

if __name__ == "__main__":
    analizar_funcionalidades()
