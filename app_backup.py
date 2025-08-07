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
import psycopg2
import psycopg2.extras
import pymysql
from pymysql.cursors import DictCursor
import json
import random
import string
from werkzeug.utils import secure_filename
import time
import bcrypt
import traceback
from datetime import datetime
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
    CLIENT_URL = os.environ.get('CLIENT_URL', 'https://maira-3e76.onrender.com')
    SERVER_URL = os.environ.get('SERVER_URL', 'https://maira-3e76.onrender.com')
    CORS_ORIGINS = ["https://maira-3e76.onrender.com", "https://*.onrender.com", "*"]
else:
    # Desarrollo local con XAMPP
    CLIENT_URL = os.environ.get('CLIENT_URL', 'http://localhost:8080')
    SERVER_URL = os.environ.get('SERVER_URL', f'http://localhost:{PORT}')
    CORS_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:3000"]

# Configuración de Base de Datos
if IS_PRODUCTION or IS_RENDER:
    # PostgreSQL en producción (Render)
    DATABASE_URL = os.environ.get('DATABASE_URL', 
        'postgresql://maira_database_user:8aIryeDf36l4JnCGrRzXLKzBMeMnOiZv@dpg-d2a02qidbo4c73aqtcdg-a.oregon-postgres.render.com/maira_database')
    DATABASE_TYPE = 'postgresql'
    # Definir MYSQL_CONFIG vacío para evitar errores
    MYSQL_CONFIG = {}
    print("🔧 Configurando PostgreSQL para producción")
else:
    # MySQL local (XAMPP)
    MYSQL_CONFIG = {
        'host': os.environ.get('MYSQL_HOST', 'localhost'),
        'user': os.environ.get('MYSQL_USER', 'root'),
        'password': os.environ.get('MYSQL_PASSWORD', ''),
        'database': os.environ.get('MYSQL_DATABASE', 'maira'),
        'port': int(os.environ.get('MYSQL_PORT', 3306)),
        'charset': 'utf8mb4',
        'cursorclass': DictCursor
    }
    DATABASE_TYPE = 'mysql'
    print("🔧 Configurando MySQL para desarrollo local")

# Log de configuración
print(f"🚀 Iniciando MAIRA")
print(f"🌍 Ambiente: {'PRODUCCIÓN' if IS_PRODUCTION else 'DESARROLLO'}")
print(f"📡 Puerto: {PORT}")
if DATABASE_TYPE == 'postgresql':
    print(f"🗄️ Base de datos: PostgreSQL (Render)")
else:
    print(f"🗄️ Base de datos: MySQL - {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}")
print(f"🌐 Cliente URL: {CLIENT_URL}")
print(f"🔧 CORS Origins: {CORS_ORIGINS}")

# Variables globales
usuarios_conectados = {}  
operaciones_batalla = {}
informes_db = {}
adjuntos_info = {}

# Función para conectar a la base de datos (PostgreSQL o MySQL según ambiente)
def get_db_connection():
    try:
        if DATABASE_TYPE == 'postgresql':
            connection = psycopg2.connect(DATABASE_URL)
            return connection
        else:
            connection = pymysql.connect(**MYSQL_CONFIG)
            return connection
    except Exception as e:
        print(f"❌ Error conectando a la base de datos ({DATABASE_TYPE}): {e}")
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
        'database_type': DATABASE_TYPE,
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

# Servir archivos estáticos del cliente
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    try:
        return send_from_directory('.', filename)
    except:
        # Si no encuentra, intentar desde Client/
        try:
            return send_from_directory('Client', filename)
        except:
            # Fallback al index.html
            return send_from_directory('.', 'index.html')

# API endpoints
@app.route('/api/info')
def api_info():
    return jsonify({
        'message': 'MAIRA Backend API',
        'frontend': CLIENT_URL,
        'health': f'{SERVER_URL}/health',
        'info': f'{SERVER_URL}/api/info'
    })

# Ruta de login
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Usuario y contraseña son requeridos'}), 400
        
        # Conectar a la base de datos
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 500
            
        cursor = conn.cursor()
        
        # Verificar usuario
        cursor.execute("SELECT id, username, email, password FROM usuarios WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if user and user[3] == password:  # Verificación simple de contraseña
            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2]
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Credenciales inválidas'}), 401
            
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# Ruta para crear usuario
@app.route('/api/crear-usuario', methods=['POST'])
def crear_usuario():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'success': False, 'message': 'Todos los campos son requeridos'}), 400
        
        # Conectar a la base de datos
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 500
            
        cursor = conn.cursor()
        
        # Verificar si el usuario ya existe
        cursor.execute("SELECT username FROM usuarios WHERE username = %s OR email = %s", (username, email))
        existing_user = cursor.fetchone()
        
        if existing_user:
            return jsonify({'success': False, 'message': 'Usuario o email ya existe'}), 409
        
        # Crear nuevo usuario
        cursor.execute(
            "INSERT INTO usuarios (username, email, password, fecha_registro) VALUES (%s, %s, %s, %s) RETURNING id",
            (username, email, password, datetime.now())
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'username': username,
                'email': email
            }
        })
        
    except Exception as e:
        print(f"Error creando usuario: {e}")
        return jsonify({'success': False, 'message': 'Error interno del servidor'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

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

# Eventos de login y usuario
@socketio.on('login')
def handle_login(data):
    user_id = data.get('userId')
    username = data.get('username')
    
    usuarios_conectados[user_id] = {
        'socket_id': request.sid,
        'username': username,
        'connected_at': datetime.now().isoformat()
    }
    
    emit('loginSuccess', {'message': f'Usuario {username} conectado'})

# Eventos de partidas
@socketio.on('obtenerPartidasDisponibles')
def handle_obtener_partidas():
    try:
        conn = get_db_connection()
        if not conn:
            emit('error', {'message': 'Error de conexión a la base de datos'})
            return
            
        cursor = conn.cursor()
        
        if DATABASE_TYPE == 'postgresql':
            cursor.execute("SELECT * FROM partidas WHERE estado = 'esperando' ORDER BY fecha_creacion DESC")
            partidas = cursor.fetchall()
            # Convertir tuplas a diccionarios para PostgreSQL
            columns = [desc[0] for desc in cursor.description]
            partidas_dict = [dict(zip(columns, partida)) for partida in partidas]
        else:
            cursor.execute("SELECT * FROM partidas WHERE estado = 'esperando' ORDER BY fecha_creacion DESC")
            partidas_dict = cursor.fetchall()
        
        emit('partidasDisponibles', {'partidas': partidas_dict})
        
    except Exception as e:
        print(f"Error obteniendo partidas: {e}")
        emit('error', {'message': 'Error obteniendo partidas'})
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@socketio.on('crearPartida')
def handle_crear_partida(data):
    try:
        configuracion = data.get('configuracion', {})
        nombre_partida = configuracion.get('nombrePartida', 'Nueva Partida')
        
        # Generar código único
        import random
        import string
        codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        conn = get_db_connection()
        if not conn:
            emit('error', {'message': 'Error de conexión a la base de datos'})
            return
            
        cursor = conn.cursor()
        
        if DATABASE_TYPE == 'postgresql':
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                VALUES (%s, %s, 'esperando', %s) RETURNING id
            """, (codigo, str(configuracion), datetime.now()))
            partida_id = cursor.fetchone()[0]
        else:
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                VALUES (%s, %s, 'esperando', %s)
            """, (codigo, str(configuracion), datetime.now()))
            partida_id = cursor.lastrowid
            
        conn.commit()
        
        # Unir al jugador a la sala
        join_room(codigo)
        
        emit('partidaCreada', {
            'codigo': codigo,
            'id': partida_id,
            'configuracion': configuracion
        })
        
        # Notificar a todos sobre la nueva partida
        socketio.emit('nuevaPartidaDisponible', {
            'codigo': codigo,
            'nombre': nombre_partida,
            'estado': 'esperando'
        })
        
    except Exception as e:
        print(f"Error creando partida: {e}")
        emit('error', {'message': 'Error creando partida'})
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# Eventos de amigos básicos
@socketio.on('obtenerListaAmigos')
def handle_obtener_amigos():
    emit('listaAmigos', {'amigos': []})  # Lista vacía por ahora

# Eventos de salas
@socketio.on('joinRoom')
def handle_join_room(room):
    join_room(room)
    print(f"Usuario {request.sid} se unió a la sala {room}")

@socketio.on('leaveRoom')
def handle_leave_room(room):
    leave_room(room)
    print(f"Usuario {request.sid} dejó la sala {room}")

@socketio.on('unirseAPartida')
def handle_unirse_partida(data):
    codigo = data.get('codigo')
    if codigo:
        join_room(codigo)
        emit('partidaUnida', {'codigo': codigo})
        
        # Notificar a otros en la sala
        emit('jugadorSeUnio', {
            'socket_id': request.sid,
            'mensaje': 'Un jugador se ha unido'
        }, room=codigo, include_self=False)

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
