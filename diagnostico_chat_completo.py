#!/usr/bin/env python3
# diagnostico_chat_completo.py - Diagnóstico del sistema de chat

import os
import sys
import json
import time
from datetime import datetime

def diagnosticar_chat():
    """Diagnóstico completo del sistema de chat"""
    
    print("🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE CHAT")
    print("=" * 60)
    
    # 1. Verificar archivos de chat
    archivos_chat = [
        "Client/js/chat.js",
        "static/planeamiento.html",
        "static/juegodeguerra.html", 
        "static/CO.html",
        "static/gestionbatalla.html"
    ]
    
    print("\n📁 1. VERIFICACIÓN DE ARCHIVOS:")
    for archivo in archivos_chat:
        if os.path.exists(archivo):
            print(f"   ✅ {archivo}")
        else:
            print(f"   ❌ {archivo} - NO ENCONTRADO")
    
    # 2. Analizar eventos de socket en app.py
    print("\n🔌 2. EVENTOS DE SOCKET EN BACKEND:")
    with open("app.py", "r") as f:
        content = f.read()
        
    eventos_backend = {
        "mensajeChat": "@socketio.on('mensajeChat')" in content,
        "mensajeJuego": "@socketio.on('mensajeJuego')" in content,
        "cambiarSala": "@socketio.on('cambiarSala')" in content,
        "joinRoom": "@socketio.on('joinRoom')" in content
    }
    
    for evento, existe in eventos_backend.items():
        status = "✅" if existe else "❌"
        print(f"   {status} {evento}")
    
    # 3. Verificar emisiones del backend
    print("\n📤 3. EMISIONES DEL BACKEND:")
    emisiones = {
        "nuevoMensajeChat": "socketio.emit('nuevoMensajeChat'" in content,
        "mensajeRecibido": "emit('mensajeRecibido'" in content,
        "errorChat": "emit('errorChat'" in content
    }
    
    for emision, existe in emisiones.items():
        status = "✅" if existe else "❌"
        print(f"   {status} {emision}")
    
    # 4. Analizar frontend
    print("\n💻 4. EVENTOS EN FRONTEND (chat.js):")
    try:
        with open("Client/js/chat.js", "r") as f:
            chat_content = f.read()
            
        eventos_frontend = {
            "socket.on('mensajeChat')": "socket.on('mensajeChat'" in chat_content,
            "socket.on('nuevoMensajeChat')": "socket.on('nuevoMensajeChat'" in chat_content,
            "socket.emit('mensajeChat')": "socket.emit('mensajeChat'" in chat_content,
            "join_room automático": "join_room" in chat_content
        }
        
        for evento, existe in eventos_frontend.items():
            status = "✅" if existe else "❌"
            print(f"   {status} {evento}")
            
    except FileNotFoundError:
        print("   ❌ No se pudo leer Client/js/chat.js")
    
    # 5. Problemas identificados
    print("\n🚨 5. PROBLEMAS IDENTIFICADOS:")
    
    problemas = []
    
    # Verificar desajuste de eventos
    if eventos_backend.get("mensajeChat") and not eventos_frontend.get("socket.on('nuevoMensajeChat')", False):
        problemas.append("❌ Frontend escucha 'mensajeChat' pero backend emite 'nuevoMensajeChat'")
    
    if not eventos_backend.get("cambiarSala"):
        problemas.append("❌ No hay manejador para 'cambiarSala' en backend")
        
    if not eventos_frontend.get("join_room automático", False):
        problemas.append("❌ Frontend no une usuarios a salas automáticamente")
    
    if problemas:
        for problema in problemas:
            print(f"   {problema}")
    else:
        print("   ✅ No se detectaron problemas evidentes")
    
    # 6. Recomendaciones
    print("\n💡 6. RECOMENDACIONES DE CORRECCIÓN:")
    print("   1. Corregir event mismatch: frontend debe escuchar 'nuevoMensajeChat'")
    print("   2. Implementar unión automática a salas cuando se conecta/crea partida")
    print("   3. Agregar manejador 'cambiarSala' en backend")
    print("   4. Agregar logging para debug de salas")
    print("   5. Verificar que users se unan a rooms correctamente")
    
    print(f"\n⏰ Diagnóstico completado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    diagnosticar_chat()
