#!/usr/bin/env python3
"""
Script de servidor MAIRA - Compatible con XAMPP local y deployment en nube
Configurado para usar MySQL como base de datos
"""

import os
import sys
from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import pymysql
from pymysql.cursors import DictCursor
import json
import random
import string
from werkzeug.utils import secure_filename
import time
import bcrypt
import traceback
import ssl
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Cargar variables de entorno
load_dotenv()

# Detectar ambiente automáticamente
IS_PRODUCTION = os.environ.get('FLASK_ENV') == 'production'
IS_RENDER = 'RENDER' in os.environ
PORT = int(os.environ.get('PORT', 10000))

# Configuración de URLs según ambiente
if IS_PRODUCTION or IS_RENDER:
    CLIENT_URL = os.environ.get('CLIENT_URL', 'https://maira-frontend.onrender.com')
    SERVER_URL = os.environ.get('SERVER_URL', 'https://maira-backend.onrender.com')
    CORS_ORIGINS = [CLIENT_URL, "https://*.onrender.com"]
else:
    # Desarrollo local con XAMPP
    CLIENT_URL = os.environ.get('CLIENT_URL', 'http://localhost:8080')
    SERVER_URL = os.environ.get('SERVER_URL', f'http://localhost:{PORT}')
    CORS_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:3000"]

# Configuración MySQL (funciona tanto para XAMPP como producción)
MYSQL_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', 'localhost'),
    'user': os.environ.get('MYSQL_USER', 'root'),
    'password': os.environ.get('MYSQL_PASSWORD', ''),
    'database': os.environ.get('MYSQL_DATABASE', 'maira'),
    'port': int(os.environ.get('MYSQL_PORT', 3306)),
    'charset': 'utf8mb4',
    'cursorclass': DictCursor
}

# Log de configuración
print(f"🚀 Iniciando MAIRA")
print(f"🌍 Ambiente: {'PRODUCCIÓN' if IS_PRODUCTION else 'DESARROLLO'}")
print(f"📡 Puerto: {PORT}")
print(f"🗄️ Base de datos: MySQL - {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}")
print(f"🌐 Cliente URL: {CLIENT_URL}")
print(f"🔧 CORS Origins: {CORS_ORIGINS}")

# Variables globales
usuarios_conectados = {}  
operaciones_batalla = {}
informes_db = {}
adjuntos_info = {}

# Función para conectar a MySQL
def get_db_connection():
    try:
        connection = pymysql.connect(**MYSQL_CONFIG)
        return connection
    except Exception as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

# Crear aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'maira-secret-key-2024')

# Configurar CORS
CORS(app, origins=CORS_ORIGINS, 
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configurar SocketIO
socketio = SocketIO(app, 
                   cors_allowed_origins=CORS_ORIGINS,
                   logger=not IS_PRODUCTION, 
                   engineio_logger=not IS_PRODUCTION)

# Health check
@app.route('/health')
def health_check():
    db_status = "disconnected"
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = "connected"
    except:
        pass
    
    return jsonify({
        'status': 'healthy',
        'service': 'MAIRA Backend',
        'version': '1.4.1',
        'environment': 'production' if IS_PRODUCTION else 'development',
        'database': db_status,
        'mysql_host': MYSQL_CONFIG['host'],
        'timestamp': datetime.now().isoformat()
    })

# Endpoint de información del servidor
@app.route('/api/info')
def server_info():
    return jsonify({
        'name': 'MAIRA - Mesa de Arena Interactiva de Realidad Aumentada',
        'version': '1.4.1',
        'environment': 'production' if IS_PRODUCTION else 'development',
        'database': f"MySQL {MYSQL_CONFIG['host']}",
        'cors_origins': CORS_ORIGINS,
        'port': PORT
    })

# Servir archivos estáticos del cliente (fallback)
@app.route('/')
def serve_index():
    return jsonify({
        'message': 'MAIRA Backend API',
        'frontend': CLIENT_URL,
        'health': f'{SERVER_URL}/health',
        'info': f'{SERVER_URL}/api/info'
    })

# Eventos de SocketIO básicos
@socketio.on('connect')
def handle_connect():
    print(f'Cliente conectado: {request.sid}')
    emit('connected', {'message': 'Conectado al servidor MAIRA'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Cliente desconectado: {request.sid}')
    # Limpiar usuario de la lista de conectados
    for user_id, user_data in list(usuarios_conectados.items()):
        if user_data.get('socket_id') == request.sid:
            del usuarios_conectados[user_id]
            break

@socketio.on('join_operation')
def handle_join_operation(data):
    operation_id = data.get('operation_id')
    user_data = data.get('user_data', {})
    
    if operation_id:
        join_room(operation_id)
        usuarios_conectados[request.sid] = {
            'socket_id': request.sid,
            'operation_id': operation_id,
            'user_data': user_data,
            'connected_at': datetime.now().isoformat()
        }
        
        emit('joined_operation', {
            'operation_id': operation_id,
            'users_count': len([u for u in usuarios_conectados.values() 
                              if u.get('operation_id') == operation_id])
        }, room=operation_id)

# Eventos de chat
@socketio.on('send_message')
def handle_message(data):
    operation_id = data.get('operation_id')
    message = data.get('message')
    user_data = data.get('user_data', {})
    
    if operation_id and message:
        message_data = {
            'id': f"msg_{int(time.time() * 1000)}",
            'user': user_data.get('name', 'Anónimo'),
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'type': data.get('type', 'general')
        }
        
        emit('new_message', message_data, room=operation_id)

if __name__ == '__main__':
    print(f"🏁 Iniciando servidor en puerto {PORT}")
    socketio.run(app, 
                host='0.0.0.0', 
                port=PORT,
                debug=not IS_PRODUCTION,
                use_reloader=False)
