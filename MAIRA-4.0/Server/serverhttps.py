# serverhttps.py

import os
import sys
from flask import Flask, request, jsonify, make_response, send_from_directory, send_file, Response
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
import subprocess
import signal
import ssl
from dotenv import load_dotenv
import requests
from datetime import datetime, timedelta
from config import SERVER_URL, CLIENT_URL, SERVER_IP

usuarios_conectados = {}  
operaciones_batalla = {}
informes_db = {}
adjuntos_info = {}

# Obtener la ruta absoluta de la carpeta `server`
server_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(server_dir, '.env'))

# Ruta al directorio raíz del proyecto
BASE_DIR = os.path.dirname(server_dir)
CLIENT_DIR = os.path.join(BASE_DIR, 'Client')

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='/')
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configuración optimizada para Socket.IO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    transports=['websocket', 'polling']
)

# Configuración de la base de datos
db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'db': os.getenv('DB_NAME'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'cursorclass': DictCursor
}

# Conectar a la base de datos
def get_db_connection():
    try:
        conn = pymysql.connect(**db_config)
        print("Conexión exitosa a la base de datos")
        return conn
    except Exception as e:
        print(f"Error conectando a la base de datos: {e}")
        return None

# Manejo de usuarios conectados y partidas activas
usuarios_conectados = {}
partidas = {}
user_sid_map = {}
user_id_sid_map = {} 

# Constantes para rutas de archivos
BASE_UPLOADS_DIR = os.path.join(CLIENT_DIR, 'uploads')
INFORMES_DIR = os.path.join(BASE_UPLOADS_DIR, 'informes')
CHAT_DIR = os.path.join(BASE_UPLOADS_DIR, 'chat')
OPERACIONES_DIR = os.path.join(BASE_UPLOADS_DIR, 'operaciones')
TEMP_DIR = os.path.join(BASE_UPLOADS_DIR, 'temp')

# Asegurar que los directorios existan
for dir_path in [
    BASE_UPLOADS_DIR, 
    INFORMES_DIR, 
    os.path.join(INFORMES_DIR, 'imagenes'),
    os.path.join(INFORMES_DIR, 'audio'),
    os.path.join(INFORMES_DIR, 'video'),
    os.path.join(INFORMES_DIR, 'documentos'),
    CHAT_DIR, 
    os.path.join(CHAT_DIR, 'imagenes'),
    os.path.join(CHAT_DIR, 'audio'),
    os.path.join(CHAT_DIR, 'video'),
    OPERACIONES_DIR,
    TEMP_DIR
]:
    os.makedirs(dir_path, exist_ok=True)

@app.route('/Client/uploads/<path:filename>')
def serve_upload(filename):
    """Sirve archivos desde el directorio de uploads"""
    # Extraer la primera parte de la ruta para determinar el tipo
    parts = filename.split('/')
    
    if len(parts) >= 1:
        if parts[0] in ['informes', 'chat', 'operaciones', 'temp']:
            return send_from_directory(BASE_UPLOADS_DIR, filename)
    
    # Si no es una ruta válida, devolver 404
    return "", 404

@app.route('/Client/audio/<path:filename>')
def serve_audio(filename):
    """Sirve archivos de audio desde el directorio correcto"""
    audio_dir = os.path.join(CLIENT_DIR, 'audio')
    try:
        # Verificar si existe el directorio, crearlo si no
        if not os.path.exists(audio_dir):
            os.makedirs(audio_dir)
            print(f"Directorio de audio creado: {audio_dir}")
            
        # Verificar si el archivo existe
        file_path = os.path.join(audio_dir, filename)
        if not os.path.exists(file_path):
            print(f"Archivo de audio no encontrado: {file_path}")
            return "", 404
            
        return send_from_directory(audio_dir, filename)
    except Exception as e:
        print(f"Error al servir archivo de audio {filename}: {e}")
        return "", 404


# Rutas para servir archivos estáticos
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/health')
def health_check():
    """Health check endpoint para verificar estado del servidor y base de datos"""
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            return jsonify({"status": "healthy", "database": "connected", "success": True})
        return jsonify({"status": "unhealthy", "database": "disconnected", "success": False}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "success": False}), 500

@app.route('/favicon.ico')
def favicon():
    """Servir favicon"""
    try:
        return send_from_directory(os.path.join(CLIENT_DIR, 'image', 'favicon_logoai'), 'favicon-32x32.png', mimetype='image/png')
    except:
        return '', 204  # No Content si no existe

@app.route('/client/<path:path>')
@app.route('/Client/<path:path>')
def serve_client_files(path):
    """Servir archivos desde el directorio Client/"""
    return send_from_directory(CLIENT_DIR, path)

# ✅ ENDPOINT CRÍTICO: Servir modelos 3D GLB/GLTF
@app.route('/Client/assets/models/<path:filename>')
@app.route('/assets/models/<path:filename>')  # Ruta adicional sin Client/
def serve_models(filename):
    """Servir archivos de modelos 3D GLB/GLTF con content-type correcto"""
    try:
        models_dir = os.path.join(CLIENT_DIR, 'assets', 'models')

        print(f"🎮 Sirviendo modelo 3D: {filename}")
        print(f"🔍 Directorio modelos: {models_dir}")
        print(f"🔍 ¿Existe archivo?: {os.path.exists(os.path.join(models_dir, filename))}")

        if not os.path.exists(models_dir):
            print(f"❌ Directorio de modelos no encontrado: {models_dir}")
            return "Directorio de modelos no encontrado", 404

        file_path = os.path.join(models_dir, filename)
        if not os.path.exists(file_path):
            print(f"❌ Modelo no encontrado: {file_path}")
            return "Modelo no encontrado", 404

        # Configurar content-type correcto para archivos GLB/GLTF
        if filename.endswith('.glb'):
            content_type = 'model/gltf-binary'
        elif filename.endswith('.gltf'):
            content_type = 'model/gltf+json'
        else:
            content_type = 'application/octet-stream'

        response = send_from_directory(models_dir, filename)
        response.headers['Content-Type'] = content_type
        response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache por 1 hora

        print(f"✅ Modelo servido correctamente: {filename} ({content_type})")
        return response

    except Exception as e:
        print(f"❌ Error sirviendo modelo {filename}: {e}")
        return f"Error cargando modelo: {str(e)}", 500

# ✅ ENDPOINT: Servir assets generales
@app.route('/Client/assets/<path:filename>')
def serve_assets(filename):
    """Servir archivos de assets (imágenes, sonidos, etc.)"""
    try:
        assets_dir = os.path.join(CLIENT_DIR, 'assets')

        print(f"📁 Sirviendo asset: {filename}")

        if not os.path.exists(assets_dir):
            print(f"❌ Directorio de assets no encontrado: {assets_dir}")
            return "Directorio de assets no encontrado", 404

        response = send_from_directory(assets_dir, filename)
        response.headers['Cache-Control'] = 'public, max-age=1800'  # Cache por 30 minutos

        return response

    except Exception as e:
        print(f"❌ Error sirviendo asset {filename}: {e}")
        return f"Error cargando asset: {str(e)}", 500

# ✅ ENDPOINT: Servir node_modules
@app.route('/node_modules/<path:filename>')
def serve_node_modules(filename):
    """Servir archivos de node_modules con content-type correcto"""
    try:
        node_modules_dir = os.path.join(BASE_DIR, 'node_modules')

        print(f"📦 Sirviendo node_modules: {filename}")
        print(f"🔍 Directorio: {node_modules_dir}")
        print(f"🔍 ¿Existe?: {os.path.exists(node_modules_dir)}")

        if not os.path.exists(node_modules_dir):
            print(f"❌ node_modules no encontrado en: {node_modules_dir}")
            return "node_modules no encontrado", 404

        file_path = os.path.join(node_modules_dir, filename)
        if not os.path.exists(file_path):
            print(f"❌ Archivo no encontrado: {file_path}")
            return "Archivo no encontrado", 404

        # Content-type apropiado por extensión
        content_type = None
        if filename.endswith('.js'):
            content_type = 'application/javascript'
        elif filename.endswith('.css'):
            content_type = 'text/css'
        elif filename.endswith('.json'):
            content_type = 'application/json'
        elif filename.endswith('.wasm'):
            content_type = 'application/wasm'

        response = send_from_directory(node_modules_dir, filename)
        if content_type:
            response.headers['Content-Type'] = content_type
        response.headers['Cache-Control'] = 'public, max-age=3600'

        print(f"✅ Servido: {filename}")
        return response

    except Exception as e:
        print(f"❌ Error sirviendo {filename}: {e}")
        return f"Error: {str(e)}", 500


@app.route('/<path:path>')
def serve_static(path):
    # Intenta servir el archivo directamente
    file_path = os.path.join(BASE_DIR, path)
    if os.path.isfile(file_path):
        return send_from_directory(BASE_DIR, path)
    
    # Si es un directorio, intenta servir index.html dentro de ese directorio
    dir_path = os.path.join(BASE_DIR, path)
    if os.path.isdir(dir_path) and os.path.isfile(os.path.join(dir_path, 'index.html')):
        return send_from_directory(dir_path, 'index.html')
    
    # Si es un archivo HTML específico que no existe, intenta servirlo de la raíz
    if path.endswith('.html') and not os.path.exists(file_path):
        filename = os.path.basename(path)
        if os.path.isfile(os.path.join(BASE_DIR, filename)):
            return send_from_directory(BASE_DIR, filename)
    
    # Por defecto, intenta servir index.html
    return send_from_directory(BASE_DIR, 'index.html')

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,cache-control'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

@app.route('/config', methods=['GET'])
def get_config():
    return jsonify({
        'SERVER_URL': SERVER_URL,
        'CLIENT_URL': CLIENT_URL,
        'SERVER_IP': SERVER_IP
    })

@app.route('/api/adjuntos/<informe_id>', methods=['GET'])
def obtener_adjunto_api(informe_id):
    try:
        # Obtener informe
        informe = obtener_informe_por_id(informe_id)
        
        if not informe:
            return jsonify({"error": "Informe no encontrado"}), 404
            
        if not informe.get('tieneAdjunto') or not informe.get('adjunto'):
            return jsonify({"error": "El informe no tiene adjunto"}), 404
            
        # Cargar datos del adjunto si están disponibles
        datos_adjunto = cargar_adjunto_desde_filesystem(informe_id)
        
        if not datos_adjunto:
            return jsonify({"error": "No se pudo cargar el adjunto"}), 500
            
        # Devolver información del adjunto con los datos
        return jsonify({
            "informe_id": informe_id,
            "datos": datos_adjunto,
            "tipo": informe['adjunto'].get('tipo', 'application/octet-stream'),
            "nombre": informe['adjunto'].get('nombre', 'adjunto')
        })
        
    except Exception as e:
        print(f"Error al obtener adjunto API: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def cargar_adjunto_desde_filesystem(adjunto_info):
    """
    Carga un archivo adjunto desde el sistema de archivos
    
    Args:
        adjunto_info (dict): Información del adjunto
        
    Returns:
        str: Datos del archivo en formato base64
    """
    try:
        # Determinar ruta del archivo
        if not adjunto_info or 'ruta' not in adjunto_info:
            print("Información de adjunto inválida o sin ruta")
            return None
            
        # Convertir ruta relativa a absoluta
        ruta_relativa = adjunto_info['ruta']
        ruta_absoluta = os.path.join(CLIENT_DIR, ruta_relativa)
        
        # Verificar que el archivo exista
        if not os.path.exists(ruta_absoluta):
            print(f"Archivo adjunto no encontrado: {ruta_absoluta}")
            
            # Intentar búsqueda alternativa si falla
            nombre_seguro = adjunto_info.get('nombre_seguro')
            tipo_base = adjunto_info.get('tipo_base', '').lower()
            
            if nombre_seguro and tipo_base:
                # Buscar en estructura alternativa
                posibles_rutas = [
                    os.path.join(INFORMES_DIR, 'imagenes' if tipo_base == 'image' else tipo_base, nombre_seguro),
                    os.path.join(CHAT_DIR, 'imagenes' if tipo_base == 'image' else tipo_base, nombre_seguro),
                ]
                
                for ruta in posibles_rutas:
                    if os.path.exists(ruta):
                        ruta_absoluta = ruta
                        print(f"Archivo encontrado en ruta alternativa: {ruta}")
                        break
                else:
                    print("No se encontró el archivo en rutas alternativas")
                    return None
            else:
                return None
        
        # Leer archivo
        with open(ruta_absoluta, 'rb') as f:
            datos_binarios = f.read()
        
        # Convertir a base64
        import base64
        datos_base64 = base64.b64encode(datos_binarios).decode('utf-8')
        
        # Añadir prefijo según tipo MIME
        tipo_mime = adjunto_info.get('tipo', 'application/octet-stream')
        prefijo = f"data:{tipo_mime};base64,"
        datos_completos = prefijo + datos_base64
        
        return datos_completos
    except Exception as e:
        print(f"Error al cargar adjunto: {e}")
        traceback.print_exc()
        return None

def obtener_informe_por_id(informe_id):
    """Obtiene un informe por su ID y carga su adjunto si existe"""
    try:
        # Obtener informe base
        informe = informes_db.get(informe_id)
        if not informe:
            return None
            
        # Si tiene adjunto, cargar el contenido
        if informe and informe.get('tieneAdjunto') and informe.get('adjunto'):
            adjunto_info = informe['adjunto']
            
            # Verificar si el adjunto tiene ruta
            if 'ruta' in adjunto_info:
                try:
                    # Cargar datos del archivo
                    with open(adjunto_info['ruta'], 'rb') as f:
                        datos_binarios = f.read()
                    
                    # Convertir a base64
                    import base64
                    datos_base64 = base64.b64encode(datos_binarios).decode('utf-8')
                    
                    # Añadir prefijo según tipo MIME
                    prefijo = f"data:{adjunto_info['tipo']};base64,"
                    datos_completos = prefijo + datos_base64
                    
                    # Añadir datos al adjunto
                    informe['adjunto']['datos'] = datos_completos
                except Exception as e:
                    print(f"Error al cargar adjunto del informe {informe_id}: {e}")
        
        return informe
    except Exception as e:
        print(f"Error al obtener informe: {e}")
        traceback.print_exc()
        return None

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Usuario y contraseña son requeridos"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Error conectando a la base de datos"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM usuarios WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({
                "success": True,
                "message": "Login exitoso",
                "user_id": user['id'],
                "username": user['username']
            })
        else:
            return jsonify({"success": False, "message": "Usuario o contraseña incorrectos"}), 401
    except Exception as e:
        print("Error durante el login:", e)
        return jsonify({"success": False, "message": "Error de servidor", "error": str(e)}), 500
    finally:
        if conn:
            cursor.close()
            conn.close()

@app.route('/api/crear-usuario', methods=['POST'])
def crear_usuario():
    try:
        app.logger.info("Recibida solicitud para crear usuario")
        data = request.json
        app.logger.info(f"Datos recibidos: {data}")
        
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        unidad = data.get('unidad')
        
        app.logger.info(f"Campos extraídos: username={username}, email={email}, unidad={unidad}")

        if not all([username, password, email, unidad]):
            app.logger.warning("Error: Campos incompletos")
            return jsonify({"success": False, "message": "Todos los campos son requeridos"}), 400

        conn = get_db_connection()
        if conn is None:
            app.logger.error("Error: No se pudo conectar a la base de datos")
            return jsonify({"success": False, "message": "Error conectando a la base de datos"}), 500

        try:
            cursor = conn.cursor()
            app.logger.info("Conexión a la base de datos establecida")
            
            # Verificar si el usuario ya existe
            cursor.execute("SELECT id FROM usuarios WHERE username = %s OR email = %s", (username, email))
            existing = cursor.fetchone()
            
            if existing:
                app.logger.info(f"Usuario o email ya existe: {existing}")
                return jsonify({"success": False, "message": "El nombre de usuario o correo ya está en uso"}), 400
            
            app.logger.info("Generando hash de contraseña...")
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            app.logger.info("Hash generado")
            
            app.logger.info("Ejecutando INSERT...")
            # Agregar el campo is_online con valor 0 (no en línea)
            cursor.execute(
                "INSERT INTO usuarios (username, password, email, unidad, is_online) VALUES (%s, %s, %s, %s, %s)",
                (username, hashed_password, email, unidad, 0)
            )
            app.logger.info("INSERT ejecutado, realizando commit...")
            conn.commit()
            app.logger.info("Usuario creado exitosamente")
            
            return jsonify({"success": True, "message": "Usuario creado exitosamente"})
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            app.logger.error(f"Error detallado al crear usuario: {e}")
            app.logger.error(error_trace)
            return jsonify({"success": False, "message": "Error al crear usuario", "error": str(e)}), 500
        finally:
            if conn:
                cursor.close()
                conn.close()
                app.logger.info("Conexión a la base de datos cerrada")
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        app.logger.error(f"Error general en crear_usuario: {e}")
        app.logger.error(error_trace)
        return jsonify({"success": False, "message": "Error interno del servidor", "error": str(e)}), 500
    
@socketio.on('connect')
def handle_connect():
    print(f'Cliente conectado: {request.sid}')
    user_sid_map[request.sid] = None
    join_room('general')  # Unirse a la sala general
    emit('mensajeChat', {'usuario': 'Servidor', 'mensaje': 'se ha unido un nuevo usuario'}, room='general')

@socketio.on('login')
def handle_login(data):
    user_id = data.get('userId') or data.get('user_id')
    username = data.get('username')
    if user_id and username:
        usuarios_conectados[user_id] = {'id': user_id, 'username': username, 'is_online': True}
        user_sid_map[request.sid] = user_id
        user_id_sid_map[user_id] = request.sid

        # Marcar al usuario como en línea
        connection = get_db_connection()
        if connection:
            with connection.cursor() as cursor:
                cursor.execute('UPDATE usuarios SET is_online = 1 WHERE id = %s', (user_id,))
            connection.commit()
            connection.close()

        # Emitir múltiples eventos para compatibilidad con diferentes clientes
        emit('loginExitoso', {'userId': user_id, 'username': username}, room=request.sid)
        emit('loginResponse', {'success': True, 'user': {'id': user_id, 'username': username}}, room=request.sid)
        emit('login_success', {'userId': user_id, 'username': username}, room=request.sid)

        # Emitir la lista de usuarios conectados a todos
        emit('usuariosConectados', list(usuarios_conectados.values()), broadcast=True)


# Revisar y eliminar estructuras de datos potencialmente huérfanas
@socketio.on('disconnect')
def handle_disconnect_improved():
    """Versión mejorada del manejo de desconexión con limpieza completa"""
    sid = request.sid
    user_id = user_sid_map.get(sid)
    
    # Limpiar mapeo de SID a user_id
    if sid in user_sid_map:
        del user_sid_map[sid]
    
    # Si el usuario estaba identificado
    if user_id:
        print(f"Desconexión: Usuario {user_id} ({sid})")
        
        # Actualizar estado en la base de datos
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute("UPDATE usuarios SET is_online = 0 WHERE id = %s", (user_id,))
                conn.commit()
            except Exception as e:
                print(f"Error al actualizar estado en BD: {e}")
            finally:
                conn.close()
        
        # Limpiar de estructuras en memoria
        if user_id in usuarios_conectados:
            # Notificar a otros usuarios
            sala_actual = usuarios_conectados[user_id].get('sala_actual')
            if sala_actual:
                emit('usuarioDesconectado', {
                    'id': user_id,
                    'username': usuarios_conectados[user_id].get('username', 'Usuario')
                }, room=sala_actual)
                
            # Eliminar de la lista
            del usuarios_conectados[user_id]
        
        # Notificar a todos los usuarios conectados
        emit('usuariosConectados', list(usuarios_conectados.values()), broadcast=True)
        
        # Limpiar partidas o operaciones huérfanas
        limpiar_recursos_inactivos()

def limpiar_recursos_inactivos():
    """
    Limpia recursos inactivos del servidor:
    - Usuarios desconectados
    - Partidas abandonadas
    - Elementos huérfanos
    """
    try:
        tiempo_actual = datetime.now()
        tiempo_limite = timedelta(minutes=30)  # 30 minutos de inactividad
        
        # 1. Limpiar usuarios inactivos
        usuarios_eliminar = []
        for user_id, user_data in usuarios_conectados.items():
            ultima_actividad = user_data.get('ultima_actividad')
            if ultima_actividad and (tiempo_actual - ultima_actividad) > tiempo_limite:
                usuarios_eliminar.append(user_id)
        
        for user_id in usuarios_eliminar:
            if user_id in usuarios_conectados:
                del usuarios_conectados[user_id]
                print(f"Usuario inactivo eliminado: {user_id}")
        
        # 2. Limpiar partidas abandonadas
        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor() as cursor:
                    # Marcar partidas sin jugadores como finalizadas
                    cursor.execute("""
                        UPDATE partidas p
                        SET estado = 'finalizada'
                        WHERE estado IN ('esperando', 'en_curso')
                        AND (
                            SELECT COUNT(*) 
                            FROM usuarios_partida up 
                            WHERE up.partida_id = p.id
                        ) = 0
                    """)
                    
                    # Limpiar registros de usuarios_partida huérfanos
                    cursor.execute("""
                        DELETE FROM usuarios_partida
                        WHERE partida_id NOT IN (
                            SELECT id FROM partidas
                            WHERE estado IN ('esperando', 'en_curso')
                        )
                    """)
                    
                conn.commit()
            except Exception as e:
                print(f"Error al limpiar partidas: {e}")
            finally:
                conn.close()
        
        # 3. Limpiar elementos sin usuario asociado
        for operacion in operaciones_batalla.values():
            elementos_eliminar = []
            for elemento_id, elemento in operacion['elementos'].items():
                if elemento_id not in usuarios_conectados:
                    elementos_eliminar.append(elemento_id)
            
            for elemento_id in elementos_eliminar:
                del operacion['elementos'][elemento_id]
                print(f"Elemento huérfano eliminado: {elemento_id}")
        
        print("Limpieza de recursos completada")
        
    except Exception as e:
        print(f"Error en limpieza de recursos: {e}")
        import traceback
        traceback.print_exc()


@socketio.on('actualizarEstadoGB')
def handle_actualizar_estado_gb(data):
    try:
        operacion = data.get('operacion')
        elemento_id = data.get('id')
        nuevo_estado = data.get('estado')
        
        if not all([operacion, elemento_id, nuevo_estado]):
            return
            
        if operacion in operaciones_batalla:
            if elemento_id in operaciones_batalla[operacion]['elementos']:
                # Actualizar estado
                operaciones_batalla[operacion]['elementos'][elemento_id]['estado'] = nuevo_estado
                # Emitir actualización
                emit('estadoActualizadoGB', data, room=operacion)
    except Exception as e:
        print(f"Error actualizando estado GB: {e}")

@socketio.on('crearPartida')
def crear_partida(data):
    try:
        print("Iniciando creación de partida con datos:", data)
        configuracion = data.get('configuracion')
        if not configuracion:
            print("Error: Configuración de partida faltante")
            emit('errorCrearPartida', {'mensaje': 'Configuración de partida faltante'})
            return

        codigo_partida = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        estado = 'esperando'
        fecha_creacion = datetime.now()

        # Convertir la configuración a formato JSON
        configuracion_json = json.dumps(configuracion)

        conn = get_db_connection()
        if conn is None:
            print("Error: No se pudo establecer conexión con la base de datos")
            emit('errorCrearPartida', {'mensaje': 'Error de conexión a la base de datos'})
            return

        try:
            with conn.cursor() as cursor:
                print("Insertando datos en la tabla partidas")
                cursor.execute("""
                    INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                    VALUES (%s, %s, %s, %s)
                """, (codigo_partida, configuracion_json, estado, fecha_creacion))
                
                partida_id = cursor.lastrowid

                print("Insertando creador como primer jugador")
                creador_id = user_sid_map.get(request.sid)
                if creador_id is None:
                    print("Error: No se encontró el ID del creador")
                    emit('errorCrearPartida', {'mensaje': 'Error al obtener el ID del creador'})
                    return

                # Insertar al creador en la tabla `usuarios_partida` con `esCreador` = 1
                cursor.execute("""
                    INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                    VALUES (%s, %s, 'sin_equipo', 0, 1)
                """, (partida_id, creador_id))
                
                conn.commit()
                print("Commit realizado con éxito")

            partida = {
                'id': partida_id,
                'codigo': codigo_partida,
                'configuracion': configuracion,
                'estado': estado,
                'fecha_creacion': fecha_creacion.isoformat(),
                'jugadores': [{
                    'id': creador_id,
                    'username': obtener_username(creador_id),
                    'equipo': 'sin_equipo',
                    'listo': False
                }]
            }

            join_room(codigo_partida, sid=request.sid)
            emit('partidaCreada', partida)
            actualizar_lista_partidas()
            print("Partida creada con éxito:", partida)

            # Emitir el evento para actualizar la lista de partidas disponibles
            emit('listaPartidasActualizada', room='general')

        except Exception as e:
            conn.rollback()
            print(f"Error al insertar en la base de datos: {e}")
            emit('errorCrearPartida', {'mensaje': f'Error al crear la partida: {str(e)}'})
        finally:
            conn.close()

    except Exception as e:
        print(f"Error general al crear la partida: {e}")
        emit('errorCrearPartida', {'mensaje': f'Error general al crear la partida: {str(e)}'})


# Agrega esta función en serverhttps.py donde están las demás funciones
def actualizar_estadisticas(sala, tipo_evento):
    """
    Actualiza las estadísticas de uso para una sala
    """
    try:
        # Implementación básica para evitar error
        print(f"Estadística: {tipo_evento} en sala {sala}")
        # Aquí podrías agregar el código real para actualizar estadísticas si es necesario
    except Exception as e:
        print(f"Error al actualizar estadísticas: {e}")


def actualizar_lista_partidas():
    conn = get_db_connection()
    if conn is None:
        return

    try:
        with conn.cursor(DictCursor) as cursor:
            # Actualizar primero el contador de jugadores en cada partida
            cursor.execute("""
                UPDATE partidas p 
                SET jugadores_actuales = (
                    SELECT COUNT(*) 
                    FROM usuarios_partida up 
                    WHERE up.partida_id = p.id
                )
            """)
            conn.commit()

            # Luego obtener la lista actualizada
            cursor.execute("""
                SELECT p.*, 
                       JSON_OBJECT(
                           'nombrePartida', JSON_EXTRACT(p.configuracion, '$.nombrePartida'),
                           'modo', JSON_EXTRACT(p.configuracion, '$.modo'),
                           'creadorId', JSON_EXTRACT(p.configuracion, '$.creadorId')
                       ) as config_parsed,
                       COUNT(up.usuario_id) as jugadores_actuales
                FROM partidas p
                LEFT JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.estado = 'esperando'
                GROUP BY p.id
            """)
            partidas = cursor.fetchall()

            partidas_info = [
                {
                    'id': partida['id'],
                    'codigo': partida['codigo'],
                    'nombre': json.loads(partida['config_parsed'])['nombrePartida'],
                    'modo': json.loads(partida['config_parsed'])['modo'],
                    'creadorId': json.loads(partida['config_parsed'])['creadorId'],
                    'jugadores_actuales': partida['jugadores_actuales']
                }
                for partida in partidas
            ]

            emit('listaPartidasActualizada', partidas_info, broadcast=True)
    except Exception as e:
        print(f"Error al actualizar lista de partidas: {e}")
    finally:
        conn.close()


def obtener_username(user_id):
    conn = get_db_connection()
    if conn is None:
        print(f"Error de conexión a la base de datos al obtener username para usuario {user_id}")
        return "Unknown"

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT username FROM usuarios WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            return result['username'] if result else "Unknown"
    except Exception as e:
        print(f"Error al obtener username para usuario {user_id}: {e}")
        return "Unknown"
    finally:
        conn.close()


@socketio.on('obtenerPartidasDisponibles')
def obtener_partidas_disponibles():
    user_id = user_sid_map.get(request.sid)
    if not user_id:
        emit('errorObtenerPartidas', {'mensaje': 'Usuario no autenticado'})
        return

    # Emitir la lista de partidas solo al cliente que lo solicita
    conn = get_db_connection()
    if conn is None:
        emit('errorObtenerPartidas', {'mensaje': 'Error de conexión a la base de datos'})
        return

    try:
        with conn.cursor(DictCursor) as cursor:
            cursor.execute("""
                SELECT p.*, COUNT(up.usuario_id) as jugadores_actuales
                FROM partidas p
                LEFT JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.estado = 'esperando'
                GROUP BY p.id
            """)
            partidas = cursor.fetchall()

            partidas_info = [
                {
                    'id': partida['id'],
                    'codigo': partida['codigo'],
                    'nombre': json.loads(partida['configuracion'])['nombrePartida'],
                    'modo': json.loads(partida['configuracion'])['modo'],
                    'creadorId': json.loads(partida['configuracion'])['creadorId'],
                    'jugadores_actuales': partida['jugadores_actuales']
                }
                for partida in partidas
            ]

            emit('listaPartidas', partidas_info, room=request.sid)  # Emitir solo al cliente que lo solicitó
    except Exception as e:
        print(f"Error al actualizar lista de partidas: {e}")
        emit('errorObtenerPartidas', {'mensaje': 'Error al obtener la lista de partidas'})
    finally:
        conn.close()


@socketio.on('iniciarPartida')
def iniciar_partida(data):
    codigo_partida = data['codigo']
    print(f"Intento de iniciar partida con código: {codigo_partida}")
    
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor(DictCursor) as cursor:
                # Verificar estado actual de la partida
                cursor.execute("""
                    SELECT p.*, p.configuracion as config_json, p.estado
                    FROM partidas p 
                    WHERE p.codigo = %s
                """, (codigo_partida,))
                
                partida = cursor.fetchone()
                print(f"Estado actual de la partida: {partida}")
                
                if not partida:
                    print(f"No se encontró la partida con código {codigo_partida}")
                    emit('errorIniciarPartida', {'mensaje': 'Partida no encontrada'})
                    return
                
                # Actualizar estado a 'en_curso' en lugar de 'iniciada'
                cursor.execute("""
                    UPDATE partidas 
                    SET estado = 'en_curso'
                    WHERE codigo = %s
                """, (codigo_partida,))
                
                conn.commit()

                # Obtener los jugadores de la partida
                cursor.execute("""
                    SELECT 
                        up.usuario_id as id,
                        u.username,
                        up.equipo,
                        up.listo,
                        up.esCreador
                    FROM usuarios_partida up
                    JOIN usuarios u ON up.usuario_id = u.id
                    WHERE up.partida_id = %s
                """, (partida['id'],))
                
                jugadores = cursor.fetchall()
                
                # Preparar datos para enviar
                datos_partida = {
                    'codigo': codigo_partida,
                    'configuracion': json.loads(partida['config_json']),
                    'jugadores': [
                        {
                            'id': str(jugador['id']),
                            'username': jugador['username'],
                            'equipo': jugador['equipo'],
                            'listo': bool(jugador['listo']),
                            'esCreador': bool(jugador['esCreador'])
                        } 
                        for jugador in jugadores
                    ],
                    'estado': 'en_curso'
                }

                print("Enviando datos de partida:", datos_partida)
                
                # Notificar a todos los jugadores en la sala
                socketio.emit('partidaIniciada', datos_partida, room=codigo_partida)

        except Exception as e:
            print(f"Error detallado al iniciar la partida: {e}")
            print(f"Traceback completo: {traceback.format_exc()}")
            emit('errorIniciarPartida', {'mensaje': f'Error al iniciar la partida: {str(e)}'})
        finally:
            conn.close()
            
def get_user_sid(user_id):
    """
    Obtiene el Socket ID (SID) de un usuario a partir de su ID.

    :param user_id: El ID del usuario.
    :return: El Socket ID del usuario o None si no se encuentra.
    """
    for sid, uid in user_sid_map.items():
        if uid == user_id:
            return sid
    return None


@socketio.on('expulsarJugador')
def handle_expulsar_jugador(data):
    jugador_id = data.get('jugadorId')
    partida_id = data.get('partidaId')
    
    if partida_id in partidas:
        partida = partidas[partida_id]
        partida['jugadores'] = [j for j in partida['jugadores'] if j['id'] != jugador_id]
        
        # Notificar al jugador expulsado
        sid_expulsado = next((sid for sid, uid in user_sid_map.items() if uid == jugador_id), None)
        if sid_expulsado:
            emit('expulsadoDeLaPartida', {'partidaId': partida_id}, room=sid_expulsado)
            leave_room(partida_id, sid=sid_expulsado)
        
        # Actualizar la sala de espera para los demás jugadores
        emit('actualizarSalaDeEspera', partida, room=partida_id)

@socketio.on('unirseAPartida')
def unirse_a_partida(data):
    codigo_partida = data['codigo']
    usuario_id = user_sid_map.get(request.sid)
    
    if not usuario_id:
        emit('errorunirseAPartida', {'mensaje': 'Usuario no autenticado'})
        return

    print(f"Intento de unirse a partida: código={codigo_partida}, usuario_id={usuario_id}")

    conn = get_db_connection()
    try:
        with conn.cursor(DictCursor) as cursor:
            # Verificar si la partida existe - Sin usar JSON_EXTRACT
            cursor.execute("""
                SELECT p.*, COUNT(up.usuario_id) as jugadores_actuales 
                FROM partidas p 
                LEFT JOIN usuarios_partida up ON p.id = up.partida_id 
                WHERE p.codigo = %s
                GROUP BY p.id
            """, (codigo_partida,))
            partida = cursor.fetchone()
            
            if not partida:
                emit('errorunirseAPartida', {'mensaje': 'La partida no existe'})
                return

            # Convertir la configuración a diccionario
            configuracion = json.loads(partida['configuracion'])
            creador_id = configuracion.get('creadorId')

            # Verificar si el jugador ya está en la partida
            cursor.execute("""
                SELECT COUNT(*) as esta_en_partida 
                FROM usuarios_partida 
                WHERE partida_id = %s AND usuario_id = %s
            """, (partida['id'], str(usuario_id)))
            
            ya_en_partida = cursor.fetchone()['esta_en_partida']

            if ya_en_partida > 0:
                # Si ya está en la partida, obtener datos actualizados
                cursor.execute("""
                    SELECT up.usuario_id as id, u.username, up.equipo, up.listo
                    FROM usuarios_partida up
                    JOIN usuarios u ON up.usuario_id = u.id
                    WHERE up.partida_id = %s
                """, (partida['id'],))
                jugadores = [{
                    'id': str(j['id']),
                    'username': j['username'],
                    'equipo': j['equipo'],
                    'listo': bool(j['listo'])
                } for j in cursor.fetchall()]
                
                leave_room('general')
                join_room(codigo_partida)
                
                partida_info = {
                    'id': partida['id'],
                    'codigo': codigo_partida,
                    'configuracion': configuracion,
                    'jugadores': jugadores
                }
                
                emit('unidoAPartida', partida_info)
                return

            # Si no está en la partida, unirlo
            try:
                cursor.execute("""
                    INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo) 
                    VALUES (%s, %s, 'sin_equipo', 0)
                """, (partida['id'], str(usuario_id)))
                
                conn.commit()

                cursor.execute("""
                    SELECT up.usuario_id as id, u.username, up.equipo, up.listo
                    FROM usuarios_partida up
                    JOIN usuarios u ON up.usuario_id = u.id
                    WHERE up.partida_id = %s
                """, (partida['id'],))
                
                jugadores = [{
                    'id': str(j['id']),
                    'username': j['username'],
                    'equipo': j['equipo'],
                    'listo': bool(j['listo'])
                } for j in cursor.fetchall()]

                partida_info = {
                    'id': partida['id'],
                    'codigo': codigo_partida,
                    'configuracion': configuracion,
                    'jugadores': jugadores
                }

                leave_room('general')
                join_room(codigo_partida)
                
                emit('unidoAPartida', partida_info)
                emit('actualizarSalaDeEspera', partida_info, room=codigo_partida)
                
                # Actualizar contador de jugadores
                cursor.execute("""
                    UPDATE partidas 
                    SET jugadores_actuales = (
                        SELECT COUNT(*) 
                        FROM usuarios_partida 
                        WHERE partida_id = %s
                    )
                    WHERE id = %s
                """, (partida['id'], partida['id']))
                
                conn.commit()
                actualizar_lista_partidas()

            except Exception as e:
                print(f"Error en la inserción del usuario: {e}")
                conn.rollback()
                raise

    except Exception as e:
        print(f"Error detallado al unirse a la partida: {str(e)}")
        emit('errorunirseAPartida', {'mensaje': f'Error al unirse a la partida: {str(e)}'})
    finally:
        if conn:
            conn.close()

@socketio.on('unirseAPartidaJuego')
def unirse_partida_juego(data):
    codigo_partida = data['codigo']
    usuario_id = data.get('userId')
    username = data.get('username')

    if not all([codigo_partida, usuario_id, username]):
        emit('errorUnirseJuego', {'mensaje': 'Datos incompletos'})
        return

    conn = get_db_connection()
    if conn is None:
        emit('errorUnirseJuego', {'mensaje': 'Error de conexión a la base de datos'})
        return

    try:
        with conn.cursor(DictCursor) as cursor:
            # Verificar que la partida existe y está iniciada
            cursor.execute("""
                SELECT p.*, p.configuracion as config_json 
                FROM partidas p 
                WHERE p.codigo = %s AND p.estado = 'iniciada'
            """, (codigo_partida,))
            
            partida = cursor.fetchone()
            if not partida:
                emit('errorUnirseJuego', {'mensaje': 'Partida no encontrada o no iniciada'})
                return

            # Verificar que el jugador pertenece a la partida
            cursor.execute("""
                SELECT up.*, u.username 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s AND up.usuario_id = %s
            """, (partida['id'], usuario_id))
            
            jugador = cursor.fetchone()
            if not jugador:
                emit('errorUnirseJuego', {'mensaje': 'No eres parte de esta partida'})
                return

            # Unir al jugador a la sala del juego
            join_room(codigo_partida)
            
            # Emitir estado actual del juego al jugador
            emit('estadoJuegoActualizado', {
                'partida': partida,
                'jugador': jugador,
                'timestamp': datetime.now().isoformat()
            })

            # Notificar a otros jugadores
            emit('jugadorUnido', {
                'username': username,
                'equipo': jugador['equipo']
            }, room=codigo_partida, include_self=False)

    except Exception as e:
        print(f"Error al unir jugador al juego: {e}")
        emit('errorUnirseJuego', {'mensaje': str(e)})
    finally:
        conn.close()

@socketio.on('enviarInvitacion')
def enviar_invitacion(data):
    invitador_id = user_sid_map.get(request.sid)
    invitado_id = data.get('invitado_id')
    codigo_partida = data['codigo']

    if invitado_id and codigo_partida:
        sid_invitado = next((sid for sid, uid in user_sid_map.items() if uid == invitado_id), None)
        if sid_invitado:
            emit('invitacionPartida', {'invitador': get_username_by_id(invitador_id), 'codigoPartida': codigo_partida}, room=sid_invitado)

@socketio.on('mensajeChat')
@socketio.on('mensajeJuego')  # Registrar ambos eventos para compatibilidad
def handle_all_messages(data):
    try:
        # Extraer información básica del mensaje
        user_id = user_sid_map.get(request.sid)
        
        # Determinar la sala correcta
        sala = (data.get('sala') or data.get('partidaCodigo') or 
                data.get('operacion') or 'general')
        
        # Normalizar el formato del mensaje
        mensaje_normalizado = {
            'id': data.get('id', f"msg_{time.time()}_{random.randint(1000, 9999)}"),
            'usuario': data.get('usuario') or data.get('emisor', {}).get('nombre') or 
                       usuarios_conectados.get(user_id, {}).get('username', 'Usuario'),
            'mensaje': data.get('mensaje') or data.get('contenido', ''),
            'tipo': data.get('tipo', 'global'),
            'timestamp': datetime.now().isoformat(),
            'estado': 'enviado'
        }
        
        # Manejar mensajes privados
        if data.get('privado') and data.get('destinatario'):
            destinatario_id = data.get('destinatario')
            dest_sid = next((sid for sid, uid in user_sid_map.items() if uid == destinatario_id), None)
            
            if dest_sid:
                # Enviar al destinatario
                emit('mensajeChat', mensaje_normalizado, room=dest_sid)
                # Confirmar al emisor
                emit('mensajeChat', {**mensaje_normalizado, 'estado': 'enviado'}, room=request.sid)
                print(f"Mensaje privado enviado: {user_id} -> {destinatario_id}")
            else:
                # Destinatario no conectado
                emit('mensajeChat', {**mensaje_normalizado, 'estado': 'error'}, room=request.sid)
                print(f"Destinatario no conectado: {destinatario_id}")
        else:
            # Mensaje para toda la sala
            emit('mensajeChat', mensaje_normalizado, room=sala)
            print(f"Mensaje enviado a sala: {sala}")
        
        # Registrar estadísticas si es necesario
        if sala not in ['general', 'lobby']:
            actualizar_estadisticas(sala, 'mensaje')
            
    except Exception as e:
        print(f"Error al procesar mensaje: {e}")
        traceback.print_exc()
        emit('error', {'mensaje': f'Error al procesar mensaje: {str(e)}'}, room=request.sid)
@socketio.on('cancelarPartida')
def cancelar_partida(data):
    codigo_partida = data['codigo']
    usuario_id = user_sid_map[request.sid]

    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                # Obtener ID y datos de la partida
                cursor.execute("""
                    SELECT p.id, p.configuracion 
                    FROM partidas p 
                    WHERE p.codigo = %s
                """, (codigo_partida,))
                partida = cursor.fetchone()

                if not partida:
                    emit('errorCancelarPartida', {'mensaje': 'La partida no existe'})
                    return

                # Verificar si es el creador
                configuracion = json.loads(partida['configuracion'])
                if str(configuracion['creadorId']) != str(usuario_id):
                    emit('errorCancelarPartida', {'mensaje': 'No tienes permiso para cancelar esta partida'})
                    return

                # Obtener jugadores antes de eliminar
                cursor.execute("""
                    SELECT usuario_id 
                    FROM usuarios_partida 
                    WHERE partida_id = %s
                """, (partida['id'],))
                jugadores = cursor.fetchall()

                # Eliminar usuarios_partida y la partida
                cursor.execute("DELETE FROM usuarios_partida WHERE partida_id = %s", (partida['id'],))
                cursor.execute("DELETE FROM partidas WHERE id = %s", (partida['id'],))
                conn.commit()

                # Notificar a todos los jugadores
                emit('partidaCancelada', {'codigo': codigo_partida}, room=codigo_partida)
                
                # Forzar a todos los jugadores a salir de la sala
                for jugador in jugadores:
                    sid = get_user_sid(jugador['usuario_id'])
                    if sid:
                        leave_room(codigo_partida, sid=sid)
                        join_room('general', sid=sid)

                # Actualizar lista de partidas para todos
                actualizar_lista_partidas()

        except Exception as e:
            conn.rollback()
            print(f"Error al cancelar la partida: {e}")
            emit('errorCancelarPartida', {'mensaje': str(e)})
        finally:
            conn.close()

# Estructuras de datos para gestión de batalla
operaciones_batalla = {}  # {nombre_operacion: {elementos: {}, info: {}}}

# Eventos Socket.IO para gestión de batalla
@socketio.on('elementoConectado')
def handle_elemento_conectado_batalla(data):
    sid = request.sid
    user_id = data.get('id')
    operacion = data.get('operacion')
    
    if not operacion or not user_id:
        return
    
    # Crear operación si no existe...
    
    # Unirse a la sala de la operación
    join_room(operacion)
    
    # Guardar datos del elemento
    operaciones_batalla[operacion]['elementos'][user_id] = data
    
    # Actualizar ambos mapeos
    user_sid_map[sid] = user_id
    user_id_sid_map[user_id] = sid
    
    print(f"GestionBatalla: Elemento {user_id} conectado a operación {operacion}, SID {sid}")
    
@socketio.on('actualizarPosicionGB')
def handle_actualizar_posicion_batalla(data):
    sid = request.sid
    user_id = data.get('id')
    
    print(f"🔄 Posición recibida: Usuario {user_id}, Coords: {data.get('posicion', {}).get('lat')}, {data.get('posicion', {}).get('lng')}")
    
    if user_id not in user_sid_map.values():
        print(f"⚠️ Usuario {user_id} no registrado en user_sid_map")
        return
    
    # Buscar la operación del elemento
    operacion = None
    for op_nombre, op_data in operaciones_batalla.items():
        if user_id in op_data['elementos']:
            operacion = op_nombre
            break
    
    if not operacion:
        print(f"⚠️ No se encontró operación para usuario {user_id}")
        return
    
    # Actualizar datos del elemento
    operaciones_batalla[operacion]['elementos'][user_id].update(data)
    
    # Notificar a otros en la operación
    print(f"📤 Enviando actualización a sala {operacion} (excepto {sid})")
    emit('actualizarPosicionGB', data, room=operacion, skip_sid=sid)
    
    # También emitir con nombre alternativo para retrocompatibilidad
    emit('actualizacionPosicion', data, room=operacion, skip_sid=sid)

@socketio.on('anunciarElemento')
def handle_anunciar_elemento(data):
    sid = request.sid
    elemento_id = data.get('id')
    operacion = data.get('operacion')
    
    print(f"📣 Elemento anunciado: ID={elemento_id}, operación={operacion}")
    
    if not operacion or not elemento_id:
        print("⚠️ Datos incompletos en anunciarElemento")
        return
    
    # Si la operación no existe, crearla
    if operacion not in operaciones_batalla:
        operaciones_batalla[operacion] = {
            'elementos': {},
            'info': {
                'id': f"op_{int(datetime.now().timestamp())}",
                'nombre': operacion,
                'creador': data.get('usuario', 'Usuario'),
                'fechaCreacion': datetime.now().isoformat()
            }
        }
    
    # Actualizar el elemento
    operaciones_batalla[operacion]['elementos'][elemento_id] = data
    
    # Notificar a otros clientes
    print(f"📤 Enviando elemento a sala {operacion} (excepto {sid})")
    emit('anunciarElemento', data, room=operacion, skip_sid=sid)
    emit('nuevoElemento', data, room=operacion, skip_sid=sid)
    emit('actualizarPosicionGB', data, room=operacion, skip_sid=sid)

@socketio.on('nuevoElemento')
def handle_nuevo_elemento(data):
    sid = request.sid
    elemento_id = data.get('id')
    operacion = data.get('operacion')
    
    print(f"🆕 Nuevo elemento: ID={elemento_id}, operación={operacion}")
    
    if not operacion or not elemento_id:
        print("⚠️ Datos incompletos en nuevoElemento")
        return
    
    # Si la operación no existe, crearla
    if operacion not in operaciones_batalla:
        operaciones_batalla[operacion] = {
            'elementos': {},
            'info': {
                'id': f"op_{int(datetime.now().timestamp())}",
                'nombre': operacion,
                'creador': data.get('usuario', 'Usuario'),
                'fechaCreacion': datetime.now().isoformat()
            }
        }
    
    # Actualizar el elemento
    operaciones_batalla[operacion]['elementos'][elemento_id] = data
    
    # Notificar a otros clientes
    print(f"📤 Enviando a sala {operacion} (excepto {sid})")
    emit('nuevoElemento', data, room=operacion, skip_sid=sid)
    
    # Confirmar al emisor
    emit('elementoRecibido', {
        'id': elemento_id,
        'timestamp': datetime.now().isoformat()
    }, room=sid)

    
@socketio.on('nuevoInforme')
def handle_nuevo_informe(data):
    """Maneja la recepción de un nuevo informe o documento"""
    try:
        # Añadir timestamp del servidor si no existe
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now().isoformat()
        
        # Obtener información de sala para reenvío
        sala = data.get('operacion', 'general')
        
        # Determinar a quién enviar el documento
        destinatario = data.get('destinatario')
        
        if destinatario == 'todos':
            # Reenviar a todos los clientes en la sala
            emit('nuevoInforme', data, room=sala)
            print(f"Informe enviado a todos: {data.get('id')} - {data.get('asunto')}")
        
        elif destinatario == 'comando':
            # Reenviar solo a quienes tengan rol de comando
            # Como implementación básica, lo enviamos a todos en la sala
            emit('nuevoInforme', data, room=sala)
            print(f"Informe enviado al comando: {data.get('id')} - {data.get('asunto')}")
        
        else:
            # Reenviar al destinatario específico
            # Encontrar el sid del destinatario
            destinatario_sid = None
            for sid, user_data in usuarios_conectados.items():  # Cambiar connected_users por usuarios_conectados
                if user_data.get('id') == destinatario:
                    destinatario_sid = sid
                    break
            
            if destinatario_sid:
                # Enviar al destinatario específico
                emit('nuevoInforme', data, room=destinatario_sid)
                print(f"Informe enviado a usuario específico: {destinatario} (sid: {destinatario_sid})")
            else:
                print(f"Destinatario {destinatario} no encontrado para enviar informe")
            
            # También enviar al emisor para que lo vea en su lista
            emit('nuevoInforme', data, room=request.sid)
        
        # Responder al emisor que se envió correctamente
        return {'success': True, 'id': data.get('id')}
    except Exception as e:
        print(f"Error al procesar nuevo informe: {e}")
        traceback.print_exc()
        return {'error': 'Error al procesar el informe', 'details': str(e)}

@socketio.on('informeLeido')
def handle_informe_leido(data):
    """Maneja la marcación de informes como leídos"""
    try:
        informe_id = data.get('informeId')
        
        if not informe_id:
            return {'error': 'ID de informe no especificado'}
        
        # Obtener información del usuario que lo marcó como leído
        usuario_id = request.sid
        
        # Buscar el usuario en la lista de usuarios conectados
        usuario_info = None
        for sid, user_data in usuarios_conectados.items():
            if sid == usuario_id:
                usuario_info = user_data
                break
        
        # Crear objeto de confirmación
        confirmacion = {
            'informeId': informe_id,
            'usuarioId': usuario_id,
            'usuario': usuario_info.get('usuario', 'Usuario desconocido') if usuario_info else 'Usuario desconocido',
            'timestamp': datetime.now().isoformat()
        }
        
        # Obtener la sala (operación) del usuario
        sala = usuario_info.get('operacion', 'general') if usuario_info else 'general'
        
        # Emitir confirmación a todos en la sala
        emit('informeMarcadoLeido', confirmacion, room=sala)
        
        print(f"Informe marcado como leído: {informe_id} por usuario {confirmacion.get('usuario')}")
        return {'success': True}
    
    except Exception as e:
        print(f"Error al marcar informe como leído: {e}")
        return {'error': 'Error al marcar informe como leído', 'details': str(e)}


@socketio.on('obtenerInformeCompleto')
def handle_obtener_informe(data):
    """Obtiene información completa de un informe por su ID"""
    try:
        # Aquí normalmente buscarías el informe en una base de datos
        # Como no tenemos implementado un almacenamiento permanente,
        # simplemente devolvemos lo que se recibió
        informe_id = data.get('informeId')
        
        if not informe_id:
            return {'error': 'ID de informe no especificado'}
        
        print(f"Solicitud de informe completo: {informe_id}")
        
        # En una implementación real, buscaríamos el informe por su ID
        # Por ahora, devolvemos un mensaje de éxito con los datos recibidos
        return {
            'success': True, 
            'informe': data
        }
    
    except Exception as e:
        print(f"Error al obtener informe completo: {e}")
        return {'error': 'Error al obtener el informe', 'details': str(e)}

# Rutas API para consulta de operaciones
@app.route('/api/operaciones', methods=['GET'])
def get_operaciones_batalla():
    return jsonify(list(operaciones_batalla.keys()))

@app.route('/api/operaciones/<nombre_operacion>/elementos', methods=['GET'])
def get_elementos_operacion_batalla(nombre_operacion):
    if nombre_operacion in operaciones_batalla:
        return jsonify(operaciones_batalla[nombre_operacion]['elementos'])
    return jsonify({"error": "Operación no encontrada"}), 404

@socketio.on('actualizarJugador')
def actualizar_jugador(data):
    codigo_partida = data['codigo']
    usuario_id = data['userId']
    listo = data.get('listo')
    equipo = data.get('equipo')
    
    print(f"Actualizando jugador: código={codigo_partida}, usuario={usuario_id}, listo={listo}, equipo={equipo}")
    
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                # Obtener ID de la partida
                cursor.execute("SELECT id FROM partidas WHERE codigo = %s", (codigo_partida,))
                partida = cursor.fetchone()
                if not partida:
                    emit('errorActualizarJugador', {'mensaje': 'Partida no encontrada'})
                    return

                # Construir el query de actualización dinámicamente
                update_fields = []
                update_values = []
                if listo is not None:
                    update_fields.append("listo = %s")
                    update_values.append(listo)
                if equipo is not None:
                    update_fields.append("equipo = %s")
                    update_values.append(equipo)

                if not update_fields:
                    emit('errorActualizarJugador', {'mensaje': 'No se proporcionaron campos para actualizar'})
                    return

                # Agregar partida_id y usuario_id a los valores
                update_values.extend([partida['id'], usuario_id])

                # Ejecutar la actualización
                update_query = f"""
                    UPDATE usuarios_partida 
                    SET {', '.join(update_fields)}
                    WHERE partida_id = %s AND usuario_id = %s
                """
                cursor.execute(update_query, update_values)
                conn.commit()

                # Obtener la lista actualizada de jugadores
                cursor.execute("""
                    SELECT up.usuario_id as id, u.username, up.equipo, up.listo
                    FROM usuarios_partida up
                    JOIN usuarios u ON up.usuario_id = u.id
                    WHERE up.partida_id = %s
                """, (partida['id'],))
                
                jugadores = [{
                    'id': str(j['id']),
                    'username': j['username'],
                    'equipo': j['equipo'],
                    'listo': bool(j['listo'])
                } for j in cursor.fetchall()]

                # Verificar si todos están listos y tienen equipo asignado
                todos_listos = all(j['listo'] for j in jugadores)
                todos_con_equipo = all(j['equipo'] != 'sin_equipo' for j in jugadores)

                # Emitir actualización a todos en la sala
                emit('actualizarSalaDeEspera', {
                    'codigo': codigo_partida,
                    'jugadores': jugadores,
                    'todosListos': todos_listos and todos_con_equipo
                }, room=codigo_partida)

        except Exception as e:
            print(f"Error al actualizar jugador: {e}")
            emit('errorActualizarJugador', {'mensaje': str(e)})
        finally:
            conn.close()



@socketio.on('sectorConfirmado')
def handle_sector_confirmado(datos):
    try:
        codigo_partida = datos.get('partidaCodigo')
        
        if not codigo_partida:
            return emit('error', {'mensaje': "'partidaCodigo' no definido"})

        # Emitir a todos menos al emisor original
        socketio.emit('sectorConfirmado', datos, room=codigo_partida, include_self=True)
        
        # Si hay cambio de fase, forzar actualización en todos los clientes
        if datos.get('cambiarFase'):
            socketio.emit('cambioFase', {
                'fase': 'preparacion',
                'subfase': 'definicion_zonas',
                'jugadorId': datos['jugadorId'],
                'timestamp': datetime.now().isoformat()
            }, room=codigo_partida)

        print(f"Sector confirmado enviado a sala {codigo_partida}")
    except Exception as e:
        print(f"Error al manejar sector confirmado: {e}")

        
@socketio.on('estadoActual')
def handle_estado_actual(data):
    try:
        codigo_partida = data['codigo']
        # Emitir estado a la sala
        emit('estadoActual', data, room=codigo_partida, include_self=False)
    except Exception as e:
        print(f'Error al enviar estado actual: {e}')

@socketio.on('unidadDesplegada')
def handle_unidad_desplegada(data):
    try:
        codigo_partida = data['codigo']
        emit('unidadDesplegada', data, room=codigo_partida, include_self=False)
    except Exception as e:
        print(f'Error al manejar despliegue de unidad: {e}')

# Eventos específicos para Gestión de Batalla (GB)
        

@socketio.on('crearOperacionGB')
def handle_crear_operacion_gb(data, callback=None):
    try:
        print("Recibiendo solicitud para crear operación GB:", data)
        
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        creador = data.get('creador', 'Usuario')
        
        if not nombre:
            if callback:
                callback({"error": "El nombre de la operación es obligatorio"})
            return
        
        # Obtener ID del usuario creador
        user_id = user_sid_map.get(request.sid)
        username = creador
        
        # Generar ID único para la operación
        operacion_id = f"op_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"
        
        # Crear estructura de operación
        nueva_operacion = {
            "id": operacion_id,
            "nombre": nombre,
            "descripcion": descripcion,
            "creador": username,
            "fechaCreacion": datetime.now().isoformat(),
            "elementos": {},
            "participantes": 0  # Se incrementará al añadir al creador
        }
        
        # Guardar en memoria
        if nombre not in operaciones_batalla:
            operaciones_batalla[nombre] = {
                'elementos': {},
                'info': nueva_operacion
            }
            
            # Añadir al creador como primer elemento
            if user_id:
                elemento_data = {
                    'id': user_id,
                    'usuario': username,
                    'elemento': data.get('elemento', {}),
                    'conectado': True,
                    'timestamp': datetime.now().isoformat()
                }
                operaciones_batalla[nombre]['elementos'][user_id] = elemento_data
                
                # Actualizar contador de participantes
                operaciones_batalla[nombre]['info']['participantes'] = len(operaciones_batalla[nombre]['elementos'])
                
                print(f"Usuario creador {username} añadido a la operación {nombre}")
        
        # Unir al creador a la sala
        join_room(nombre)
        
        # Almacenar la operación actual para este usuario
        if user_id in usuarios_conectados:
            usuarios_conectados[user_id]['operacion_actual'] = nombre
            usuarios_conectados[user_id]['sala_actual'] = nombre
        
        # Responder con la operación creada
        if callback:
            callback({
                "success": True, 
                "operacion": {
                    "id": operacion_id,
                    "nombre": nombre,
                    "descripcion": descripcion,
                    "creador": username,
                    "fechaCreacion": nueva_operacion["fechaCreacion"],
                    "participantes": operaciones_batalla[nombre]['info']['participantes']
                }
            })
        
        # Notificar a todos los usuarios sobre la nueva operación
        operaciones_lista = [
            {
                'id': op_data['info'].get('id', f"op_{i}"),
                'nombre': op_nombre,
                'descripcion': op_data['info'].get('descripcion', ''),
                'creador': op_data['info'].get('creador', 'Desconocido'),
                'fechaCreacion': op_data['info'].get('fechaCreacion', ''),
                'participantes': len(op_data['elementos'])
            }
            for i, (op_nombre, op_data) in enumerate(operaciones_batalla.items())
        ]
        
        emit('operacionesGB', {'operaciones': operaciones_lista}, broadcast=True)
        
        print(f"Operación GB '{nombre}' creada con éxito, ID: {operacion_id}")
        
    except Exception as e:
        print(f"Error al crear operación GB: {e}")
        traceback.print_exc()
        if callback:
            callback({"error": str(e)})


@socketio.on('obtenerOperacionesGB')
def handle_obtener_operaciones_gb():
    try:
        # Convertir las operaciones a formato lista para enviar al cliente
        operaciones_lista = [
            {
                'id': op_data['info'].get('id', f"op_{i}"),
                'nombre': nombre,
                'descripcion': op_data['info'].get('descripcion', ''),
                'creador': op_data['info'].get('creador', 'Desconocido'),
                'fechaCreacion': op_data['info'].get('fechaCreacion', ''),
                'participantes': len(op_data['elementos'])
            }
            for i, (nombre, op_data) in enumerate(operaciones_batalla.items())
        ]
        
        emit('operacionesGB', {'operaciones': operaciones_lista})
        
    except Exception as e:
        print(f"Error al obtener operaciones GB: {e}")
        emit('error', {'mensaje': f"Error al obtener operaciones: {str(e)}"})




@socketio.on('registrarOperacion')
def handle_registrar_operacion(data):
    try:
        operacion = data.get('operacion')
        creador = data.get('creador', 'Usuario')
        
        if not operacion:
            return
            
        # Si la operación no existe, crearla
        if operacion not in operaciones_batalla:
            operaciones_batalla[operacion] = {
                'elementos': {},
                'info': {
                    'id': f"op_{int(datetime.now().timestamp())}",
                    'nombre': operacion,
                    'creador': creador,
                    'fechaCreacion': datetime.now().isoformat()
                }
            }
            
            # Notificar a todos sobre la nueva operación
            emit('operacionesGB', {'operaciones': list(operaciones_batalla.keys())}, broadcast=True)
            
    except Exception as e:
        print(f"Error al registrar operación: {e}")


@socketio.on('zonaConfirmada')
def handle_zona_confirmada(data):
    try:
        codigo_partida = data.get('partidaCodigo')
        print(f"Recibiendo zonaConfirmada: {data}")
        
        # Emitir a todos en la sala incluyendo al emisor
        socketio.emit('zonaConfirmada', data, room=codigo_partida, include_self=True)
        
        # Si es zona azul, cambiar fase
        if data['zona']['equipo'] == 'azul':
            socketio.emit('cambioFase', {
                'fase': 'preparacion',
                'subfase': 'despliegue',
                'jugadorId': data['jugadorId'],
                'timestamp': datetime.now().isoformat()
            }, room=codigo_partida)
            
    except Exception as e:
        print(f"Error en zonaConfirmada: {str(e)}")
        emit('error', {'mensaje': str(e)})


@socketio.on('cambioFase')
def handle_cambio_fase(data):
    try:
        # Utilizamos partidaCodigo, igual que en el chat global
        partida_codigo = data.get('partidaCodigo')
        
        if not partida_codigo:
            print("Error: 'partidaCodigo' no definido para el evento 'cambioFase'")
            return emit('error', {'mensaje': "'partidaCodigo' no definido"})

        emit('cambioFase', data, room=partida_codigo, include_self=False)
        print(f"Cambio de fase enviado a sala {partida_codigo}")
    except Exception as e:
        print(f"Error al manejar cambio de fase: {e}")


@socketio.on('inicioDespliegue')
def handle_inicio_despliegue(data):
    try:
        codigo_partida = data.get('partidaCodigo')
        print(f"[DEBUG] Iniciando fase despliegue en partida {codigo_partida}")
        
        # Emitir a todos en la sala
        socketio.emit('inicioDespliegue', data, room=codigo_partida)
        
        # Cambiar estado en BD si es necesario
        conn = get_db_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE partidas 
                    SET estado = 'despliegue' 
                    WHERE codigo = %s
                """, (codigo_partida,))
                conn.commit()
            conn.close()
            
    except Exception as e:
        print(f"[ERROR] Error en inicio_despliegue: {str(e)}")

def verificar_elementos_jugador(cursor, jugador_id, codigo_partida):
    cursor.execute("""
        SELECT COUNT(*) as total_elementos
        FROM marcadores_jugadores 
        WHERE jugador_id = %s 
        AND partida_codigo = %s
    """, (jugador_id, codigo_partida))
    
    result = cursor.fetchone()
    return result['total_elementos'] > 0

def verificar_todos_jugadores_listos(codigo_partida):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Verificar jugadores listos y sus elementos
            cursor.execute("""
                SELECT j.id, j.listo
                FROM jugadores j
                WHERE j.partida_codigo = %s
            """, (codigo_partida,))
            
            jugadores = cursor.fetchall()
            
            for jugador in jugadores:
                if not jugador['listo']:
                    return False
                    
                # Verificar elementos del jugador
                if not verificar_elementos_jugador(cursor, jugador['id'], codigo_partida):
                    print(f"[DEBUG] Jugador {jugador['id']} sin elementos válidos")
                    return False
                    
            return True
            
    except Exception as e:
        print(f"[ERROR] verificar_todos_jugadores_listos: {str(e)}")
        return False
    finally:
        if conn:
            conn.close()

@socketio.on('guardarElemento')
def handle_guardar_elemento(data):
    try:
        partida_codigo = data.get('partidaCodigo')
        jugador_id = data.get('jugadorId')
        
        # Validar datos
        if not all([data.get('tipo'), data.get('magnitud'), 
                    data.get('designacion'), data.get('dependencia')]):
            emit('error', {
                'mensaje': 'Datos incompletos',
                'detalles': 'Verifique tipo, magnitud, designación y dependencia'
            })
            return

        # Emitir a todos en la sala
        socketio.emit('elementoCreado', data, room=partida_codigo)
        
        # Confirmar al emisor
        emit('elementoGuardado', {'success': True})

    except Exception as e:
        print(f"[ERROR] Error guardando elemento: {str(e)}")
        emit('error', {'mensaje': str(e)})

@socketio.on('jugadorListo')
def handle_jugador_listo(data):
    try:
        codigo_partida = data['partidaCodigo']
        jugador_id = data['jugadorId']
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Marcar jugador como listo en sala
            cursor.execute("""
                UPDATE usuarios_partida 
                SET listo_sala = true 
                WHERE usuario_id = %s AND partida_id = %s
            """, (jugador_id, codigo_partida))
            
            conn.commit()
            
            # Verificar si todos están listos para iniciar
            cursor.execute("""
                SELECT COUNT(*) as total, 
                    COUNT(CASE WHEN listo_sala = true THEN 1 END) as listos
                FROM usuarios_partida 
                WHERE partida_id = %s
            """, (codigo_partida,))
            
            estado = cursor.fetchone()
            if estado['total'] == estado['listos']:
                socketio.emit('iniciarPartida', {
                    'fase': 'preparacion',
                    'subfase': 'definicion_sector',
                    'timestamp': datetime.now().isoformat()
                }, room=codigo_partida)
                
    except Exception as e:
        print(f"[ERROR] Sala: {str(e)}")
        emit('error', {'mensaje': str(e)})

@socketio.on('jugadorListoDespliegue')  
def handle_jugador_listo_despliegue(data):
    try:
        codigo_partida = data['partidaCodigo']
        jugador_id = data['jugadorId']
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Verificar elementos desplegados
            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM marcadores_jugadores 
                WHERE jugador_id = %s 
                AND partida_codigo = %s
                AND tipo IS NOT NULL
                AND magnitud IS NOT NULL 
                AND designacion IS NOT NULL 
                AND dependencia IS NOT NULL
            """, (jugador_id, codigo_partida))
            
            resultado = cursor.fetchone()
            if not resultado or resultado['total'] == 0:
                emit('error', {
                    'mensaje': 'Debe desplegar al menos un elemento con todos sus datos',
                    'detalles': 'Verifique tipo, magnitud, designación y dependencia'
                })
                return
                
            # Marcar jugador como listo para combate
            cursor.execute("""
                UPDATE usuarios_partida 
                SET listo_despliegue = true 
                WHERE usuario_id = %s AND partida_id = %s
            """, (jugador_id, codigo_partida))
            
            conn.commit()
            
            # Verificar si todos completaron despliegue
            cursor.execute("""
                SELECT COUNT(*) as total, 
                    COUNT(CASE WHEN listo_despliegue = true THEN 1 END) as listos,
                    p.id as partida_id
                FROM usuarios_partida up
                JOIN partidas p ON p.id = up.partida_id 
                WHERE p.codigo = %s
                GROUP BY p.id
            """, (codigo_partida,))
            
            estado = cursor.fetchone()
            
            if estado and estado['total'] == estado['listos']:
                cursor.execute("""
                    SELECT up.usuario_id, u.username, up.equipo
                    FROM usuarios_partida up
                    JOIN usuarios u ON u.id = up.usuario_id
                    WHERE up.partida_id = %s
                    ORDER BY up.equipo, up.usuario_id
                """, (estado['partida_id'],))
                
                jugadores = cursor.fetchall()
                
                # Estructura de datos correcta para iniciar turnos
                datos_turnos = {
                    'fase': 'combate',
                    'subfase': 'turno',
                    'turnoActual': 1,
                    'equipoActual': 'azul',
                    'jugadores': {
                        'azul': [j for j in jugadores if j['equipo'] == 'azul'],
                        'rojo': [j for j in jugadores if j['equipo'] == 'rojo']
                    },
                    'timestamp': datetime.now().isoformat()
                }
                
                socketio.emit('iniciarCombate', datos_turnos, room=codigo_partida)
    except Exception as e:
        print(f"[ERROR] Despliegue: {str(e)}")
        emit('error', {'mensaje': str(e)})

@socketio.on('salirSalaEspera')
def salir_sala_espera(data):
    codigo_partida = data['codigo']
    usuario_id = user_sid_map[request.sid]

    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                # Eliminar al usuario de la partida
                cursor.execute("""
                    DELETE FROM usuarios_partida 
                    WHERE partida_id = (SELECT id FROM partidas WHERE codigo = %s) 
                    AND usuario_id = %s
                """, (codigo_partida, usuario_id))
                
                conn.commit()
                
                # Limpiar partidas vacías después de que un jugador sale
                limpiar_partidas_vacias()
                
                leave_room(codigo_partida)
                join_room('general')
                emit('salidaSalaEspera', {'mensaje': 'Has salido de la sala de espera'})
                
                actualizar_lista_partidas()

        except Exception as e:
            print(f"Error al salir de la sala de espera: {e}")
            emit('errorSalirSala', {'mensaje': 'Error al salir de la sala de espera'})
        finally:
            conn.close()

@socketio.on('reconectarAPartida')
def reconectar_partida(data):
    codigo_partida = data['codigo']
    usuario_id = data['userId']
    
    partida = obtener_partida_por_codigo(codigo_partida)
    if partida:
        # Aquí envías los datos de la partida al jugador para que se reconecte
        socketio.emit('datosPartida', {'partida': partida, 'jugadorId': usuario_id}, room=request.sid)
    else:
        socketio.emit('errorReconectar', {'mensaje': 'La partida no está disponible para reconexión.'}, room=request.sid)


@socketio.on('cambiarSala')
def handle_cambiar_sala(data):
    sala_anterior = next((sala for sala in request.sid.rooms if sala != request.sid), None)
    if sala_anterior:
        leave_room(sala_anterior)
    
    nueva_sala = data['sala']
    join_room(nueva_sala)
    emit('salaActualizada', {'sala': nueva_sala})

@socketio.on('obtenerListaAmigos')
def obtener_lista_amigos():
    usuario_id = user_sid_map.get(request.sid)
    
    if not usuario_id:
        emit('errorObtenerAmigos', {'mensaje': 'Usuario no identificado'})
        return

    conn = get_db_connection()
    if conn is None:
        emit('errorObtenerAmigos', {'mensaje': 'Error de conexión a la base de datos'})
        return

    try:
        with conn.cursor(DictCursor) as cursor:
            cursor.execute("""
                SELECT u.id, u.username 
                FROM usuarios u
                JOIN amigos a ON u.id = a.amigo_id
                WHERE a.usuario_id = %s
            """, (usuario_id,))
            amigos = cursor.fetchall()
            emit('listaAmigos', amigos if amigos else [])
    except Exception as e:
        print("Error al obtener lista de amigos:", e)
        emit('errorObtenerAmigos', {'mensaje': 'Error al obtener lista de amigos', 'error': str(e)})
    finally:
        if conn:
            conn.close()

@socketio.on('agregarAmigo')
def agregar_amigo(data):
    amigo_id = data['amigoId']
    usuario_id = user_sid_map[request.sid]
    
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                # Verificar si ya son amigos
                cursor.execute("SELECT * FROM amigos WHERE usuario_id = %s AND amigo_id = %s", (usuario_id, amigo_id))
                if cursor.fetchone():
                    emit('errorAgregarAmigo', {'mensaje': 'Ya son amigos'})
                    return

                # Agregar amigo
                cursor.execute("INSERT INTO amigos (usuario_id, amigo_id, fecha_creacion) VALUES (%s, %s, NOW())", (usuario_id, amigo_id))
                conn.commit()
                
                # Obtener nombre del amigo
                cursor.execute("SELECT username FROM usuarios WHERE id = %s", (amigo_id,))
                amigo_nombre = cursor.fetchone()['username']
                
                emit('amigoAgregado', {'amigoId': amigo_id, 'amigoNombre': amigo_nombre})
        except Exception as e:
            print(f"Error al agregar amigo: {e}")
            emit('errorAgregarAmigo', {'mensaje': 'Error al agregar amigo'})
        finally:
            conn.close()

@socketio.on('actualizarEquipoJugador')
def actualizar_equipo_jugador(data):
    codigo_partida = data['codigo']
    usuario_id = data['userId']
    nuevo_equipo = data['equipo']
    
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                # Obtener ID de la partida
                cursor.execute("SELECT id FROM partidas WHERE codigo = %s", (codigo_partida,))
                partida = cursor.fetchone()
                if not partida:
                    emit('errorActualizarEquipo', {'mensaje': 'Partida no encontrada'})
                    return

                # Actualizar el equipo
                cursor.execute("""
                    UPDATE usuarios_partida 
                    SET equipo = %s 
                    WHERE partida_id = %s AND usuario_id = %s
                """, (nuevo_equipo, partida['id'], usuario_id))
                
                conn.commit()
                
                # Obtener lista actualizada de jugadores
                cursor.execute("""
                    SELECT up.usuario_id as id, u.username, up.equipo, up.listo
                    FROM usuarios_partida up
                    JOIN usuarios u ON up.usuario_id = u.id
                    WHERE up.partida_id = %s
                """, (partida['id'],))
                
                jugadores = [{
                    'id': str(j['id']),
                    'username': j['username'],
                    'equipo': j['equipo'],
                    'listo': bool(j['listo'])
                } for j in cursor.fetchall()]

                # Emitir actualización a todos en la sala
                emit('actualizarSalaDeEspera', {
                    'codigo': codigo_partida,
                    'jugadores': jugadores
                }, room=codigo_partida)

        except Exception as e:
            print(f"Error al actualizar equipo del jugador: {e}")
            emit('errorActualizarEquipo', {'mensaje': 'Error al actualizar el equipo'})
        finally:
            conn.close()

@socketio.on('asignarDirectorTemporal')
def handle_asignar_director_temporal(data):
    try:
        codigo_partida = data.get('partidaCodigo')
        jugador_id = data.get('jugadorId')
        
        partida = partidas.get(codigo_partida)
        if not partida:
            return False
            
        jugador = next((j for j in partida['jugadores'] if j['id'] == jugador_id and j['equipo'] == 'azul'), None)
        if jugador:
            partida['director'] = jugador_id
            partida['director_temporal'] = True
            
            socketio.emit('directorAsignado', {
                'director': jugador_id,
                'temporal': True,
                'partidaCodigo': codigo_partida
            }, room=codigo_partida)
            
        return True
        
    except Exception as e:
        print(f"Error en handle_asignar_director_temporal: {str(e)}")
        return False

@socketio.on('obtenerInfoJugador')
def handle_obtener_info_jugador(data):
    try:
        codigo_partida = data['codigo']
        usuario_id = data.get('userId')

        conn = get_db_connection()
        if conn:
            try:
                with conn.cursor(DictCursor) as cursor:
                    # Obtener información del jugador y la partida
                    cursor.execute("""
                        SELECT up.*, u.username, p.configuracion
                        FROM usuarios_partida up
                        JOIN usuarios u ON up.usuario_id = u.id
                        JOIN partidas p ON up.partida_id = p.id
                        WHERE p.codigo = %s AND up.usuario_id = %s
                    """, (codigo_partida, usuario_id))
                    
                    resultado = cursor.fetchone()
                    if resultado:
                        # Convertir configuración de JSON string a dict
                        configuracion = json.loads(resultado['configuracion'])
                        
                        jugador_info = {
                            'id': resultado['usuario_id'],
                            'username': resultado['username'],
                            'equipo': resultado['equipo'],
                            'listo': bool(resultado['listo']),
                            'esCreador': bool(resultado['esCreador'])
                        }
                        
                        emit('infoJugador', jugador_info)
                    else:
                        emit('error', {'mensaje': 'Jugador no encontrado en la partida'})
                        
            except Exception as e:
                print(f"Error al obtener información del jugador: {e}")
                emit('error', {'mensaje': str(e)})
            finally:
                conn.close()
    except Exception as e:
        print(f"Error general al obtener información del jugador: {e}")
        emit('error', {'mensaje': str(e)})


@socketio.on('eliminarAmigo')
def eliminar_amigo(data):
    amigo_id = data['amigoId']
    usuario_id = user_sid_map[request.sid]
    
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM amigos WHERE usuario_id = %s AND amigo_id = %s", (usuario_id, amigo_id))
                conn.commit()
                
                if cursor.rowcount > 0:
                    emit('amigoEliminado', {'amigoId': amigo_id})
                else:
                    emit('errorEliminarAmigo', {'mensaje': 'No se encontró la relación de amistad'})
        except Exception as e:
            print(f"Error al eliminar amigo: {e}")
            emit('errorEliminarAmigo', {'mensaje': 'Error al eliminar amigo'})
        finally:
            conn.close()

def obtener_partida_por_codigo(codigo):
    conn = get_db_connection()  # Asegúrate de que tienes una función para obtener la conexión
    if conn:
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM partidas WHERE codigo = %s", (codigo,))
                partida = cursor.fetchone()
                return partida  # Devuelve la partida si existe
        except Exception as e:
            print(f"Error al obtener la partida: {e}")
            return None
        finally:
            conn.close()
    return None


def update_user_status(user_id, is_online):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE usuarios SET is_online = %s WHERE id = %s", (is_online, user_id))
            conn.commit()
        except Exception as e:
            print(f"Error al actualizar el estado del usuario: {e}")
        finally:
            cursor.close()
            conn.close()

def get_connected_users():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(DictCursor)
            cursor.execute("SELECT id, username FROM usuarios WHERE is_online = 1")
            return cursor.fetchall()
        except Exception as e:
            print(f"Error al obtener usuarios conectados: {e}")
            return []
        finally:
            cursor.close()
            conn.close()
    return []

def get_user_id_by_sid(sid):
    return user_sid_map.get(sid)

def get_partidas_activas():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(DictCursor)
            cursor.execute("SELECT * FROM partidas WHERE estado IN ('esperando', 'en_curso')")
            partidas = cursor.fetchall()
            for partida in partidas:
                partida['configuracion'] = json.loads(partida['configuracion'])
                partida['jugadores'] = get_jugadores_partida(partida['id'])
            return partidas
        except Exception as e:
            print(f"Error al obtener partidas activas: {e}")
            return []
        finally:
            cursor.close()
            conn.close()
    return []

def get_jugadores_partida(partida_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(DictCursor)
            cursor.execute("""
                SELECT u.id, u.username, up.equipo, up.listo
                FROM usuarios_partida up
                JOIN usuarios u ON up.usuario_id = u.id
                WHERE up.partida_id = %s
            """, (partida_id,))
            return cursor.fetchall()
        except Exception as e:
            print(f"Error al obtener jugadores de la partida: {e}")
            return []
        finally:
            cursor.close()
            conn.close()
    return []

def get_partida_id_by_codigo(codigo):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM partidas WHERE codigo = %s", (codigo,))
            result = cursor.fetchone()
            return result[0] if result else None
        except Exception as e:
            print(f"Error al obtener ID de partida por código: {e}")
            return None
        finally:
            cursor.close()
            conn.close()
    return None

def get_username_by_id(user_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT username FROM usuarios WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            return result[0] if result else None
        except Exception as e:
            print(f"Error al obtener username por ID: {e}")
            return None
        finally:
            cursor.close()
            conn.close()
    return None

@app.errorhandler(Exception)
def handle_exception(e):
    tb = traceback.format_exc()
    print("Error no manejado:", tb)
    return jsonify({
        "success": False,
        "message": "Error interno del servidor",
        "error": str(e),
        "traceback": tb
    }), 500

def limpiar_partidas_vacias():
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cursor:
                # Marcar partidas sin jugadores como finalizadas
                cursor.execute("""
                    UPDATE partidas p
                    SET estado = 'finalizada'
                    WHERE estado IN ('esperando', 'en_curso')
                    AND (
                        SELECT COUNT(*) 
                        FROM usuarios_partida up 
                        WHERE up.partida_id = p.id
                    ) = 0
                """)
                
                # Limpiar registros de usuarios_partida huérfanos
                cursor.execute("""
                    DELETE FROM usuarios_partida
                    WHERE partida_id NOT IN (
                        SELECT id FROM partidas
                        WHERE estado IN ('esperando', 'en_curso')
                    )
                """)
                
                conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Error al limpiar partidas: {e}")
        finally:
            conn.close()
    
    # 3. Limpiar elementos sin usuario asociado
    for operacion in operaciones_batalla.values():
        elementos_eliminar = []
        for elemento_id, elemento in operacion['elementos'].items():
            if elemento_id not in usuarios_conectados:
                elementos_eliminar.append(elemento_id)
        
        for elemento_id in elementos_eliminar:
            del operacion['elementos'][elemento_id]
            print(f"Elemento huérfano eliminado: {elemento_id}")
    
    print("Limpieza de recursos completada")
    

# 🗺️ SISTEMA DE TILES DE ELEVACIÓN Y VEGETACIÓN
def serve_altimetria_tiles(filename):
    """Servir tiles de altimetría locales con headers optimizados"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_dir = os.path.join(base_dir, '..', 'Client', 'Libs', 'datos_argentina', 'Altimetria_Mini_Tiles')
        
        print(f"🗺️ Sirviendo tile altimetría: {filename}")
        print(f"🗺️ Desde directorio: {tiles_dir}")
        
        if not os.path.exists(tiles_dir):
            print(f"❌ Directorio de tiles no encontrado: {tiles_dir}")
            return jsonify({'error': 'Tiles directory not found'}), 404
        
        file_path = os.path.join(tiles_dir, filename)
        if not os.path.exists(file_path):
            print(f"❌ Archivo de tile no encontrado: {file_path}")
            return jsonify({'error': f'Tile file not found: {filename}'}), 404
        
        response = send_from_directory(tiles_dir, filename)
        
        # Headers optimizados para tiles
        if filename.endswith('.json'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
        elif filename.endswith('.tar.gz'):
            response.headers['Content-Type'] = 'application/gzip'
        elif filename.endswith('.tiff') or filename.endswith('.tif'):
            response.headers['Content-Type'] = 'image/tiff'
        
        response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache por 1 hora
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        print(f"✅ Tile servido exitosamente: {filename}")
        return response
        
    except Exception as e:
        print(f"❌ Error sirviendo tile altimetría {filename}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/<path:filename>')
def serve_altimetria_tiles_route(filename):
    return serve_altimetria_tiles(filename)

@app.route('/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/<path:filename>')
def serve_vegetacion_tiles(filename):
    """Servir tiles de vegetación locales con headers optimizados"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_dir = os.path.join(base_dir, '..', 'Client', 'Libs', 'datos_argentina', 'Vegetacion_Mini_Tiles')
        
        print(f"🌿 Sirviendo tile vegetación: {filename}")
        print(f"🌿 Desde directorio: {tiles_dir}")
        
        if not os.path.exists(tiles_dir):
            print(f"❌ Directorio de tiles vegetación no encontrado: {tiles_dir}")
            return jsonify({'error': 'Vegetation tiles directory not found'}), 404
        
        file_path = os.path.join(tiles_dir, filename)
        if not os.path.exists(file_path):
            print(f"❌ Archivo de tile vegetación no encontrado: {file_path}")
            return jsonify({'error': f'Vegetation tile file not found: {filename}'}), 404
        
        response = send_from_directory(tiles_dir, filename)
        
        # Headers optimizados para tiles de vegetación
        if filename.endswith('.json'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
        elif filename.endswith('.tar.gz'):
            response.headers['Content-Type'] = 'application/gzip'
        elif filename.endswith('.tiff') or filename.endswith('.tif'):
            response.headers['Content-Type'] = 'image/tiff'
        
        response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache por 1 hora
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        print(f"✅ Tile vegetación servido exitosamente: {filename}")
        return response
        
    except Exception as e:
        print(f"❌ Error sirviendo tile vegetación {filename}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 📊 ENDPOINT: Diagnóstico completo de tiles
@app.route('/api/tiles/diagnostic')
def tiles_diagnostic():
    """Endpoint para diagnosticar el estado completo del sistema de tiles"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Verificar directorios
        altimetria_dir = os.path.join(base_dir, '..', 'Client', 'Libs', 'datos_argentina', 'Altimetria_Mini_Tiles')
        vegetacion_dir = os.path.join(base_dir, '..', 'Client', 'Libs', 'datos_argentina', 'Vegetacion_Mini_Tiles')
        
        diagnostic = {
            'timestamp': datetime.now().isoformat(),
            'base_directory': base_dir,
            'altimetria': {
                'directory': altimetria_dir,
                'exists': os.path.exists(altimetria_dir),
                'files': []
            },
            'vegetacion': {
                'directory': vegetacion_dir,
                'exists': os.path.exists(vegetacion_dir),
                'files': []
            }
        }
        
        # Listar archivos de altimetría
        if os.path.exists(altimetria_dir):
            for item in os.listdir(altimetria_dir):
                item_path = os.path.join(altimetria_dir, item)
                diagnostic['altimetria']['files'].append({
                    'name': item,
                    'is_directory': os.path.isdir(item_path),
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else None
                })
        
        # Listar archivos de vegetación
        if os.path.exists(vegetacion_dir):
            for item in os.listdir(vegetacion_dir):
                item_path = os.path.join(vegetacion_dir, item)
                diagnostic['vegetacion']['files'].append({
                    'name': item,
                    'is_directory': os.path.isdir(item_path),
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else None
                })
        
        return jsonify(diagnostic)
        
    except Exception as e:
        print(f"❌ Error en diagnóstico de tiles: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 🗺️ SISTEMA DE DESCARGA Y CACHE DE TILES
def descargar_tile(url, path_local):
    """Descargar un tile y guardarlo localmente"""
    try:
        import requests
        os.makedirs(os.path.dirname(path_local), exist_ok=True)
        
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()
        
        with open(path_local, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Tile descargado: {path_local}")
        return True
    except Exception as e:
        print(f"❌ Error descargando tile {url}: {e}")
        return False

@app.route('/tiles/<provider>/<int:z>/<int:x>/<int:y>.<ext>')
def proxy_tile(provider, z, x, y, ext):
    """Proxy/Cache para tiles de mapas - evita problemas de CORS"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_cache_dir = os.path.join(base_dir, '..', 'static', 'tiles', provider)
        tile_filename = f"{z}_{x}_{y}.{ext}"
        tile_path = os.path.join(tiles_cache_dir, tile_filename)
        
        # URLs de providers
        tile_urls = {
            'osm': f'https://tile.openstreetmap.org/{z}/{x}/{y}.{ext}',
            'satellite': f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            'terrain': f'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}',
            'cartodb': f'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.{ext}'
        }
        
        # Verificar si el tile ya existe en cache
        if os.path.exists(tile_path):
            print(f"🎯 Sirviendo tile desde cache: {tile_filename}")
            return send_from_directory(tiles_cache_dir, tile_filename)
        
        # Si no existe, intentar descargarlo
        if provider in tile_urls:
            tile_url = tile_urls[provider]
            
            if descargar_tile(tile_url, tile_path):
                response = send_from_directory(tiles_cache_dir, tile_filename)
                response.headers['Cache-Control'] = 'public, max-age=86400'  # Cache 24h
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response
        
        # Si falla la descarga, devolver error
        return jsonify({'error': f'Tile no disponible: {provider}/{z}/{x}/{y}.{ext}'}), 404
        
    except Exception as e:
        print(f"❌ Error en proxy de tiles: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tiles/clean_cache')
def clean_tiles_cache():
    """Limpiar cache de tiles descargados"""
    try:
        import shutil
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_cache_dir = os.path.join(base_dir, '..', 'static', 'tiles')
        
        if os.path.exists(tiles_cache_dir):
            shutil.rmtree(tiles_cache_dir)
            print("🧹 Cache de tiles limpiado")
            return jsonify({'message': 'Cache de tiles limpiado exitosamente'})
        else:
            return jsonify({'message': 'No hay cache para limpiar'})
            
    except Exception as e:
        print(f"❌ Error limpiando cache: {e}")
        return jsonify({'error': str(e)}), 500

# 🗺️ SISTEMA DE DESCARGA Y DESCOMPRESIÓN DE TILES DE ELEVACIÓN
@app.route('/api/tiles/elevation/<path:filepath>')
def serve_elevation_tile(filepath):
    """
    Sirve tiles de elevación desde GitHub releases.
    Si no existe localmente, descarga y descomprime el .tar.gz correspondiente.
    """
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_dir = os.path.join(base_dir, '..', 'static', 'tiles', 'data_argentina', 'Altimetria')
        tile_path = os.path.join(tiles_dir, filepath)

        # Verificar si el archivo ya existe localmente
        if os.path.exists(tile_path):
            print(f'✅ Sirviendo tile desde cache local: {filepath}')
            return send_from_directory(tiles_dir, filepath)

        # Si no existe, necesitamos descargarlo y descomprimirlo
        print(f'📦 Tile no encontrado localmente, descargando: {filepath}')

        # Determinar la provincia del archivo
        if filepath.startswith('centro_norte/'):
            provincia = 'centro_norte'
        elif filepath.startswith('centro/'):
            provincia = 'centro'
        elif filepath.startswith('norte/'):
            provincia = 'norte'
        elif filepath.startswith('patagonia/'):
            provincia = 'patagonia'
        elif filepath.startswith('sur/'):
            provincia = 'sur'
        else:
            return jsonify({'error': f'No se pudo determinar la provincia para {filepath}'}), 400

        # Descargar el .tar.gz de altimetría desde GitHub
        tar_gz_url = f'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_altimetria_tiles.tar.gz'
        print(f'📥 Descargando {tar_gz_url} para extraer {filepath}')

        response = requests.get(tar_gz_url, stream=True, timeout=300)
        if not response.ok:
            return jsonify({'error': f'Error descargando tar.gz: {response.status_code}'}), 500

        # Crear directorio si no existe
        os.makedirs(tiles_dir, exist_ok=True)

        # Procesar el archivo tar.gz y extraer el archivo específico
        import tarfile
        import io
        with tarfile.open(fileobj=io.BytesIO(response.content), mode='r:gz') as tar:
            # Buscar el archivo específico dentro del tar
            for member in tar.getmembers():
                # Buscar archivos que terminen con el filepath o que coincidan exactamente
                if member.name.endswith(filepath) or member.name == filepath or f'Altimetria_Mini_Tiles/{filepath}' in member.name:
                    print(f'📂 Extrayendo {member.name} a {tile_path}')

                    # Extraer el archivo con la ruta correcta
                    # Si el member tiene la ruta completa, extraerlo directamente
                    if member.name.startswith('Altimetria_Mini_Tiles/'):
                        # Crear el directorio padre si no existe
                        os.makedirs(os.path.dirname(tile_path), exist_ok=True)
                        # Extraer solo el contenido del archivo
                        with tar.extractfile(member) as source, open(tile_path, 'wb') as target:
                            target.write(source.read())
                    else:
                        # Extraer normalmente
                        tar.extract(member, tiles_dir)

                    # Verificar que se extrajo correctamente
                    if os.path.exists(tile_path):
                        print(f'✅ Tile extraído exitosamente: {filepath}')
                        return send_from_directory(tiles_dir, filepath)
                    else:
                        return jsonify({'error': f'Error extrayendo archivo: {filepath}'}), 500

        # Si no se encontró el archivo en el tar
        return jsonify({'error': f'Archivo no encontrado en tar.gz: {filepath}'}), 404

    except Exception as e:
        print(f'❌ Error sirviendo tile de elevación {filepath}: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/extract-tile', methods=['POST'])
def extract_tile():
    """Endpoint para obtener tiles desde GitHub Releases - CORREGIDO"""
    try:
        data = request.json
        provincia = data.get('provincia')
        tile_filename = data.get('tile_filename')
        
        if not all([provincia, tile_filename]):
            return jsonify({"success": False, "message": "Faltan parámetros requeridos"}), 400
        
        # ✅ CORREGIDO: Responder que el tile debe cargarse desde GitHub Releases
        # Los datos están en releases, no en archivos locales
        github_url = f"https://github.com/Ehr051/MAIRA-4.0/releases/download/tiles-data/{provincia}/{tile_filename}"
        
        return jsonify({
            "success": True, 
            "message": "Usar GitHub Releases",
            "github_url": github_url,
            "path": f"/{provincia}/{tile_filename}"
        })
        
        # Extraer el tile específico
        import tarfile
        import traceback as traceback_lib
        with tarfile_lib.open(tar_path, 'r:gz') as tar:
            try:
                tar.extract(tile_filename, tiles_dir)
                return jsonify({
                    "success": True, 
                    "message": "Tile extraído exitosamente",
                    "path": f"/{output_path}"
                })
            except KeyError:
                return jsonify({"success": False, "message": f"Tile {tile_filename} no encontrado en {tar_filename}"}), 404
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Error extrayendo tile: {str(e)}"}), 500

@app.route('/extraer_tile_vegetacion', methods=['POST'])
def extraer_tile_vegetacion():
    """Extraer un tile específico de vegetación desde archivos TAR.GZ del CDN"""
    try:
        data = request.json
        archivo_tar = data.get('archivo_tar')
        tile_filename = data.get('tile_filename')
        
        if not archivo_tar or not tile_filename:
            return jsonify({"success": False, "message": "Parámetros requeridos: archivo_tar, tile_filename"}), 400
        
        # Construir rutas
        base_path = "https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/"
        tar_url = base_path + archivo_tar
        tiles_dir = os.path.join("tiles", "vegetacion")
        output_path = os.path.join(tiles_dir, tile_filename)
        local_tar_path = os.path.join("temp_extract", archivo_tar)
        
        print(f"🌿 Solicitando tile de vegetación: {tile_filename} desde {archivo_tar}")
        
        # Verificar si el tile ya está extraído
        if os.path.exists(output_path):
            return jsonify({"success": True, "message": "Tile de vegetación ya disponible", "path": f"/{output_path}"})
        
        # Crear directorios si no existen
        os.makedirs(tiles_dir, exist_ok=True)
        os.makedirs("temp_extract", exist_ok=True)
        
        # Descargar el archivo TAR.GZ si no existe localmente
        if not os.path.exists(local_tar_path):
            print(f"📥 Descargando archivo TAR: {tar_url}")
            import urllib.request
            urllib.request.urlretrieve(tar_url, local_tar_path)
        
        # Extraer el tile específico de vegetación
        import tarfile
        import traceback as traceback_lib
        with tarfile.open(local_tar_path, 'r:gz') as tar:
            try:
                tar.extract(tile_filename, tiles_dir)
                return jsonify({
                    "success": True, 
                    "message": "Tile de vegetación extraído exitosamente",
                    "path": f"/{output_path}"
                })
            except KeyError:
                return jsonify({"success": False, "message": f"Tile de vegetación {tile_filename} no encontrado en {archivo_tar}"}), 404
    
    except Exception as e:
        print(f"❌ Error extrayendo tile de vegetación: {str(e)}")
        return jsonify({"success": False, "message": f"Error extrayendo tile de vegetación: {str(e)}"}), 500

# 🚀 ENDPOINT BATCH ELEVATION - Procesa múltiples coordenadas en una sola request
@app.route('/api/elevation/batch', methods=['POST'])
def get_elevation_batch():
    """
    Recibe un array de coordenadas y devuelve todas las elevaciones de una vez.
    Esto evita hacer miles de requests individuales.
    """
    import time
    import json
    start_time = time.time()

    try:
        # Importar rasterio
        try:
            import rasterio
            import numpy as np
        except ImportError:
            return jsonify({
                'error': 'rasterio no instalado',
                'message': 'pip install rasterio'
            }), 500

        data = request.get_json()
        if not data or 'points' not in data:
            return jsonify({'error': 'Se requiere points'}), 400

        points = data['points']
        print(f'📊 Batch: {len(points)} puntos')

        # Calcular bounds
        lats = [p['lat'] for p in points]
        lons = [p['lon'] for p in points]
        bounds = {
            'north': max(lats),
            'south': min(lats),
            'east': max(lons),
            'west': min(lons)
        }
        center_lat = (bounds['north'] + bounds['south']) / 2
        center_lon = (bounds['east'] + bounds['west']) / 2

        # Path base
        tiles_base = os.path.join(BASE_DIR, 'Client', 'Libs', 'datos_argentina', 'Altimetria_Mini_Tiles')

        # Determinar provincia según latitud
        provincia = None
        if center_lat > -30:
            provincia = 'norte'
        elif center_lat > -36:
            provincia = 'centro_norte'
        elif center_lat > -42:
            provincia = 'centro'
        elif center_lat > -48:
            provincia = 'sur'
        else:
            provincia = 'patagonia'

        print(f'📁 Usando provincia: {provincia}')

        # Cargar índice provincial
        provincial_index_path = os.path.join(tiles_base, provincia, f'{provincia}_mini_tiles_index.json')

        if not os.path.exists(provincial_index_path):
            return jsonify({'error': f'Índice provincial no existe: {provincial_index_path}'}), 404

        with open(provincial_index_path, 'r', encoding='utf-8') as f:
            provincial_index = json.load(f)

        # Filtrar tiles relevantes
        relevant_tiles = []
        tiles_dict = provincial_index.get('tiles', {})

        for tile_id, tile_info in tiles_dict.items():
            tile_bounds = tile_info.get('bounds', {})
            if not tile_bounds:
                continue

            if (tile_bounds['north'] >= bounds['south'] and
                tile_bounds['south'] <= bounds['north'] and
                tile_bounds['east'] >= bounds['west'] and
                tile_bounds['west'] <= bounds['east']):
                relevant_tiles.append(tile_info)

        print(f'🎯 {len(relevant_tiles)} tiles relevantes')

        # Cargar tiles
        tile_cache = {}
        for tile_info in relevant_tiles:
            filename = tile_info.get('filename')
            if not filename:
                continue

            tile_path = os.path.join(tiles_base, provincia, filename)
            if os.path.exists(tile_path):
                try:
                    src = rasterio.open(tile_path)
                    tile_cache[filename] = {
                        'src': src,
                        'bounds': src.bounds,
                        'info': tile_info
                    }
                except Exception as e:
                    print(f'⚠️ Error: {filename}: {e}')

        # Procesar puntos
        elevations = [None] * len(points)

        for point in points:
            lat = point['lat']
            lon = point['lon']
            idx = point.get('index', 0)

            for tile_name, tile_info in tile_cache.items():
                src = tile_info['src']
                bounds = tile_info['bounds']

                if bounds.left <= lon <= bounds.right and bounds.bottom <= lat <= bounds.top:
                    try:
                        py, px = src.index(lon, lat)
                        if 0 <= py < src.height and 0 <= px < src.width:
                            elevation = float(src.read(1)[py, px])
                            if elevation != -9999:
                                elevations[idx] = elevation
                                break
                    except:
                        pass

        # Cerrar tiles
        for tile_info in tile_cache.values():
            tile_info['src'].close()

        processing_time = time.time() - start_time
        valid_count = sum(1 for e in elevations if e is not None)

        print(f'✅ {valid_count}/{len(points)} en {processing_time:.2f}s')

        return jsonify({
            'elevations': elevations,
            'count': len(elevations),
            'valid_count': valid_count,
            'tiles_loaded': len(tile_cache),
            'processing_time': processing_time
        })

    except Exception as e:
        print(f'❌ Error batch: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 🌿 ENDPOINT BATCH VEGETATION
@app.route('/api/vegetation/batch', methods=['POST'])
def get_vegetation_batch():
    """Procesa múltiples coordenadas para obtener valores NDVI"""
    import time
    import json
    start_time = time.time()

    try:
        try:
            import rasterio
        except ImportError:
            return jsonify({'error': 'rasterio no instalado'}), 500

        data = request.get_json()
        if not data or 'points' not in data:
            return jsonify({'error': 'Se requiere points'}), 400

        points = data['points']
        print(f'📊 Batch vegetation: {len(points)} puntos')

        # Calcular bounds
        lats = [p['lat'] for p in points]
        lons = [p['lon'] for p in points]
        bounds = {
            'north': max(lats),
            'south': min(lats),
            'east': max(lons),
            'west': min(lons)
        }

        tiles_base = os.path.join(BASE_DIR, 'Client', 'Libs', 'datos_argentina', 'Vegetacion_Mini_Tiles')
        master_index_path = os.path.join(tiles_base, 'vegetation_master_index.json')

        if not os.path.exists(master_index_path):
            return jsonify({'error': f'Master index no existe'}), 404

        with open(master_index_path, 'r', encoding='utf-8') as f:
            master_index = json.load(f)

        # Filtrar tiles relevantes
        relevant_tiles = []
        tiles_dict = master_index.get('tiles', {})

        for tile_id, tile_info in tiles_dict.items():
            tile_bounds = tile_info.get('bounds', {})
            if not tile_bounds:
                continue

            if (tile_bounds['north'] >= bounds['south'] and
                tile_bounds['south'] <= bounds['north'] and
                tile_bounds['east'] >= bounds['west'] and
                tile_bounds['west'] <= bounds['east']):
                relevant_tiles.append(tile_info)

        # Cargar tiles
        tile_cache = {}
        for tile_info in relevant_tiles:
            filename = tile_info.get('filename')
            package = tile_info.get('package')

            if not filename or not package:
                continue

            tile_path = os.path.join(tiles_base, package, filename)

            if os.path.exists(tile_path):
                try:
                    src = rasterio.open(tile_path)
                    tile_cache[filename] = {
                        'src': src,
                        'bounds': src.bounds,
                        'info': tile_info
                    }
                except Exception as e:
                    print(f'⚠️ Error: {filename}: {e}')

        # Procesar puntos
        ndvi_values = [None] * len(points)

        for point in points:
            lat = point['lat']
            lon = point['lon']
            idx = point.get('index', 0)

            for tile_name, tile_info in tile_cache.items():
                src = tile_info['src']
                bounds = tile_info['bounds']

                if bounds.left <= lon <= bounds.right and bounds.bottom <= lat <= bounds.top:
                    try:
                        py, px = src.index(lon, lat)
                        if 0 <= py < src.height and 0 <= px < src.width:
                            ndvi_value = float(src.read(1)[py, px])
                            if ndvi_value != -9999:
                                if ndvi_value > 1:
                                    ndvi_value = ndvi_value / 255.0
                                ndvi_values[idx] = ndvi_value
                                break
                    except:
                        pass

        # Cerrar tiles
        for tile_info in tile_cache.values():
            tile_info['src'].close()

        processing_time = time.time() - start_time
        valid_count = sum(1 for v in ndvi_values if v is not None)

        print(f'✅ {valid_count}/{len(points)} en {processing_time:.2f}s')

        return jsonify({
            'ndvi_values': ndvi_values,
            'count': len(ndvi_values),
            'valid_count': valid_count,
            'tiles_loaded': len(tile_cache),
            'processing_time': processing_time
        })

    except Exception as e:
        print(f'❌ Error batch vegetation: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Definir la carpeta de subida
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def actualizar_adjunto_en_db(informe_id, adjunto_db):
    """Actualiza información de un adjunto en la base de datos (o memoria temporal)"""
    try:
        if 'adjuntos_info' not in globals():
            globals()['adjuntos_info'] = {}
        globals()['adjuntos_info'][informe_id] = adjunto_db
        return True
    except Exception as e:
        print(f"Error al actualizar adjunto en DB: {e}")
        return False




# ===============================================================================
# 🗺️ ENDPOINT ANÁLISIS DE TERRENO
# ===============================================================================
# Analiza un polígono para calcular pendientes, transitabilidad y estadísticas
# Reutiliza el patrón de get_elevation_batch con tiles provinciales
# ===============================================================================

@app.route('/api/terreno/analizar', methods=['POST'])
def analizar_terreno():
    """
    Analiza un polígono de terreno para obtener:
    - Pendientes (promedio, máxima, distribución)
    - Transitabilidad según vehículo/clima
    - Puntos críticos
    
    Request JSON:
    {
        "poligono": [[[lng, lat], [lng, lat], ...]], // GeoJSON coordinates
        "vehiculo": "TAM" | "VCLC" | "M113" | "infanteria",
        "clima": "seco" | "humedo" | "inundado",
        "capas": {
            "pendientes": true,
            "transitabilidad": true
        }
    }
    
    Response JSON:
    {
        "pendiente_promedio": 12.5,
        "pendiente_maxima": 34.2,
        "pct_transitable": 67.3,
        "distribucion_pendientes": {
            "0-5": 30,
            "5-15": 45,
            "15-30": 20,
            "30+": 5
        },
        "puntos_criticos": [...],
        "mapa_calor": [...] // Opcional: grid con pendientes para visualización
    }
    """
    import time
    import json
    import math
    
    start_time = time.time()
    
    try:
        # Importar rasterio
        try:
            import rasterio
            import numpy as np
        except ImportError:
            return jsonify({
                'error': 'rasterio no instalado',
                'message': 'pip install rasterio'
            }), 500
        
        # Validar request
        data = request.get_json()
        if not data or 'poligono' not in data:
            return jsonify({'error': 'Se requiere poligono en formato GeoJSON'}), 400
        
        poligono_coords = data['poligono'][0] if len(data['poligono']) > 0 else []
        vehiculo = data.get('vehiculo', 'TAM')
        clima = data.get('clima', 'seco')
        capas = data.get('capas', {'pendientes': True, 'transitabilidad': True})
        
        if len(poligono_coords) < 3:
            return jsonify({'error': 'El polígono debe tener al menos 3 puntos'}), 400
        
        print(f'🗺️ Análisis de terreno: {len(poligono_coords)} puntos, vehículo={vehiculo}, clima={clima}')
        
        # ========================================================================
        # PASO 1: Extraer latitudes/longitudes del polígono (GeoJSON es [lng, lat])
        # ========================================================================
        # ====================================================================
        # PASO 1: Obtener puntos para análisis (grilla o vértices)
        # ====================================================================
        grid_points = data.get('puntos', None)
        
        if grid_points and len(grid_points) > 0:
            # Usar grilla enviada desde frontend
            lats = [p['lat'] for p in grid_points]
            lons = [p['lon'] for p in grid_points]
            print(f'📐 Usando grilla: {len(grid_points)} puntos')
        else:
            # Fallback: usar solo vértices del polígono
            lons = [p[0] for p in poligono_coords]
            lats = [p[1] for p in poligono_coords]
            print(f'📐 Usando vértices: {len(poligono_coords)} puntos')
        bounds = {
            'north': max(lats),
            'south': min(lats),
            'east': max(lons),
            'west': min(lons)
        }
        center_lat = (bounds['north'] + bounds['south']) / 2
        center_lon = (bounds['east'] + bounds['west']) / 2
        
        print(f'📊 Bounds: N={bounds["north"]:.4f}, S={bounds["south"]:.4f}, E={bounds["east"]:.4f}, W={bounds["west"]:.4f}')
        
        # ========================================================================
        # PASO 2: Cargar tiles de elevación (mismo patrón que get_elevation_batch)
        # ========================================================================
        tiles_base = os.path.join(BASE_DIR, 'Client', 'Libs', 'datos_argentina', 'Altimetria_Mini_Tiles')
        
        # Determinar provincia según latitud
        provincia = None
        if center_lat > -30:
            provincia = 'norte'
        elif center_lat > -36:
            provincia = 'centro_norte'
        elif center_lat > -42:
            provincia = 'centro'
        elif center_lat > -48:
            provincia = 'sur'
        else:
            provincia = 'patagonia'
        
        print(f'📁 Provincia: {provincia}')
        
        # Cargar índice provincial
        provincial_index_path = os.path.join(tiles_base, provincia, f'{provincia}_mini_tiles_index.json')
        if not os.path.exists(provincial_index_path):
            return jsonify({'error': f'Índice provincial no existe: {provincial_index_path}'}), 404
        
        with open(provincial_index_path, 'r', encoding='utf-8') as f:
            provincial_index = json.load(f)
        
        # Filtrar tiles relevantes
        relevant_tiles = []
        tiles_dict = provincial_index.get('tiles', {})
        
        for tile_id, tile_info in tiles_dict.items():
            tile_bounds = tile_info.get('bounds', {})
            if not tile_bounds:
                continue
            
            if (tile_bounds['north'] >= bounds['south'] and
                tile_bounds['south'] <= bounds['north'] and
                tile_bounds['east'] >= bounds['west'] and
                tile_bounds['west'] <= bounds['east']):
                relevant_tiles.append(tile_info)
        
        print(f'🎯 {len(relevant_tiles)} tiles relevantes')
        
        if len(relevant_tiles) == 0:
            return jsonify({'error': 'No se encontraron tiles para el área seleccionada'}), 404
        
        # Cargar tiles en cache
        tile_cache = {}
        for tile_info in relevant_tiles:
            filename = tile_info.get('filename')
            if not filename:
                continue
            
            tile_path = os.path.join(tiles_base, provincia, filename)
            if os.path.exists(tile_path):
                try:
                    src = rasterio.open(tile_path)
                    tile_cache[filename] = {
                        'src': src,
                        'bounds': src.bounds,
                        'info': tile_info
                    }
                except Exception as e:
                    print(f'⚠️ Error cargando {filename}: {e}')
        
        print(f'💾 {len(tile_cache)} tiles cargados')
        
        # ========================================================================
        # PASO 3: Obtener elevaciones de cada punto del polígono
        # ========================================================================
        elevations = []
        valid_points = []
        
        for i, (lon, lat) in enumerate(zip(lons, lats)):
            elevation = None
            
            for tile_name, tile_info in tile_cache.items():
                src = tile_info['src']
                bounds_tile = tile_info['bounds']
                
                if bounds_tile.left <= lon <= bounds_tile.right and bounds_tile.bottom <= lat <= bounds_tile.top:
                    try:
                        py, px = src.index(lon, lat)
                        if 0 <= py < src.height and 0 <= px < src.width:
                            elev = float(src.read(1)[py, px])
                            if elev != -9999:
                                elevation = elev
                                break
                    except:
                        pass
            
            if elevation is not None:
                elevations.append(elevation)
                valid_points.append({'lat': lat, 'lon': lon, 'elevation': elevation, 'index': i})
        
        # Cerrar tiles
        for tile_info in tile_cache.values():
            tile_info['src'].close()
        
        if len(elevations) < 2:
            return jsonify({'error': 'No se pudieron obtener suficientes elevaciones del área'}), 500
        
        print(f'✅ {len(elevations)} elevaciones obtenidas')
        
        # ========================================================================
        # PASO 4: Calcular pendientes entre puntos consecutivos
        # ========================================================================
        pendientes = []
        distancias = []
        
        for i in range(len(valid_points) - 1):
            p1 = valid_points[i]
            p2 = valid_points[i + 1]
            
            # Calcular distancia horizontal usando fórmula de Haversine
            lat1_rad = math.radians(p1['lat'])
            lat2_rad = math.radians(p2['lat'])
            dlon = math.radians(p2['lon'] - p1['lon'])
            dlat = lat2_rad - lat1_rad
            
            a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
            c = 2 * math.asin(math.sqrt(a))
            distancia_horizontal = 6371000 * c  # Radio Tierra en metros
            
            # Diferencia de elevación
            delta_elevation = abs(p2['elevation'] - p1['elevation'])
            
            # Pendiente en grados (arctan de delta_h / distancia_h)
            if distancia_horizontal > 0:
                pendiente_rad = math.atan(delta_elevation / distancia_horizontal)
                pendiente_deg = math.degrees(pendiente_rad)
                pendientes.append(pendiente_deg)
                distancias.append(distancia_horizontal)
        
        if len(pendientes) == 0:
            return jsonify({'error': 'No se pudieron calcular pendientes'}), 500
        
        print(f'📐 {len(pendientes)} pendientes calculadas')
        
        # ========================================================================
        # PASO 5: Calcular estadísticas
        # ========================================================================
        pendiente_promedio = float(np.mean(pendientes))
        pendiente_maxima = float(np.max(pendientes))
        pendiente_minima = float(np.min(pendientes))
        
        # Distribución por rangos
        rango_0_5 = sum(1 for p in pendientes if p < 5)
        rango_5_15 = sum(1 for p in pendientes if 5 <= p < 15)
        rango_15_30 = sum(1 for p in pendientes if 15 <= p < 30)
        rango_30_plus = sum(1 for p in pendientes if p >= 30)
        
        total_segmentos = len(pendientes)
        
        distribucion_pendientes = {
            '0-5': round((rango_0_5 / total_segmentos) * 100, 1),
            '5-15': round((rango_5_15 / total_segmentos) * 100, 1),
            '15-30': round((rango_15_30 / total_segmentos) * 100, 1),
            '30+': round((rango_30_plus / total_segmentos) * 100, 1)
        }
        
        # ========================================================================
        # PASO 6: Calcular transitabilidad según vehículo/clima
        # ========================================================================
        # Límites de pendiente por vehículo (en grados)
        limites_vehiculos = {
            'TAM': 30,          # Tanque Argentino Mediano
            'VCLC': 25,         # Vehículo de Combate Ligero
            'M113': 20,         # Transporte Personal
            'infanteria': 45,   # Infantería a pie
            'camion': 15        # Camión logístico
        }
        
        # Factor de clima (multiplica el límite)
        factores_clima = {
            'seco': 1.0,
            'humedo': 0.8,      # Reduce 20% el límite
            'inundado': 0.6     # Reduce 40% el límite
        }
        
        limite_vehiculo = limites_vehiculos.get(vehiculo, 30)
        factor_clima = factores_clima.get(clima, 1.0)
        limite_efectivo = limite_vehiculo * factor_clima
        
        # Calcular % transitable (segmentos con pendiente <= límite)
        segmentos_transitables = sum(1 for p in pendientes if p <= limite_efectivo)
        pct_transitable = round((segmentos_transitables / total_segmentos) * 100, 1)
        
        print(f'✅ Transitabilidad: {pct_transitable}% (límite {limite_efectivo:.1f}°)')
        
        # ========================================================================
        # PASO 7: Identificar puntos críticos (pendiente > límite)
        # ========================================================================
        puntos_criticos = []
        for i, pendiente in enumerate(pendientes):
            if pendiente > limite_efectivo:
                p1 = valid_points[i]
                p2 = valid_points[i + 1]
                puntos_criticos.append({
                    'lat': (p1['lat'] + p2['lat']) / 2,
                    'lon': (p1['lon'] + p2['lon']) / 2,
                    'pendiente': round(pendiente, 1),
                    'limite': round(limite_efectivo, 1)
                })
        
        print(f'⚠️ {len(puntos_criticos)} puntos críticos')
        
        # ========================================================================
        # PASO 8: Retornar resultados
        # ========================================================================
        processing_time = time.time() - start_time
        # ========================================================================
        # 🎨 GENERAR PUNTOS_DETALLE PARA VISUALIZACIÓN
        # ========================================================================
        puntos_detalle = []
        
        # Iterar sobre los puntos con elevaciones válidas
        for i in range(len(lats)):
            if i < len(elevations):
                lat = lats[i]
                lon = lons[i]
                elevation = elevations[i]
                
                # Calcular pendiente en este punto (promedio con vecinos)
                pendiente_punto = 0.0
                
                if i > 0 and i < len(pendientes):
                    # Promedio de pendiente con segmento anterior y siguiente
                    count = 0
                    if i - 1 < len(pendientes):
                        pendiente_punto += pendientes[i - 1]
                        count += 1
                    if i < len(pendientes):
                        pendiente_punto += pendientes[i]
                        count += 1
                    if count > 0:
                        pendiente_punto = pendiente_punto / count
                elif i < len(pendientes):
                    pendiente_punto = pendientes[i]
                
                puntos_detalle.append({
                    'lat': float(lat),
                    'lon': float(lon),
                    'elevation': float(elevation),
                    'pendiente': round(float(pendiente_punto), 2),
                    'ndvi': 0.0  # Se actualizará después con valores reales
                })
        
        print(f'🎨 Puntos detalle generados: {len(puntos_detalle)}')
        
        # 🌿 INTEGRACIÓN NDVI - Obtener vegetación para todos los puntos
        try:
            print(f'🌿 Obteniendo NDVI para {len(puntos_detalle)} puntos...')
            
            # Preparar puntos para get_vegetation_batch (necesita formato {lat, lon, index})
            points_for_ndvi = []
            for idx, punto in enumerate(puntos_detalle):
                points_for_ndvi.append({
                    'lat': punto['lat'],
                    'lon': punto['lon'],
                    'index': idx
                })
            
            # Obtener tiles relevantes
            from shapely.geometry import box
            all_lats = [p['lat'] for p in points_for_ndvi]
            all_lons = [p['lon'] for p in points_for_ndvi]
            bbox_area = box(min(all_lons), min(all_lats), max(all_lons), max(all_lats))
            
            vegetation_tiles_path = 'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles'
            relevant_tiles = []
            
            if os.path.exists(vegetation_tiles_path):
                for package in os.listdir(vegetation_tiles_path):
                    package_path = os.path.join(vegetation_tiles_path, package)
                    if not os.path.isdir(package_path):
                        continue
                    
                    # Leer metadata
                    metadata_file = os.path.join(package_path, 'metadata.json')
                    if os.path.exists(metadata_file):
                        try:
                            with open(metadata_file, 'r') as f:
                                import json
                                metadata = json.load(f)
                                tiles = metadata.get('tiles', [])
                                for tile in tiles:
                                    bounds = tile.get('bounds', {})
                                    tile_bbox = box(
                                        bounds.get('left', 0),
                                        bounds.get('bottom', 0),
                                        bounds.get('right', 0),
                                        bounds.get('top', 0)
                                    )
                                    if bbox_area.intersects(tile_bbox):
                                        relevant_tiles.append({
                                            'filename': tile.get('file'),
                                            'package': package,
                                            'bounds': bounds
                                        })
                        except:
                            pass
                
                # Cargar tiles y obtener NDVI
                tile_cache = {}
                for tile_info in relevant_tiles:
                    filename = tile_info.get('filename')
                    package = tile_info.get('package')
                    
                    if not filename or not package:
                        continue
                    
                    tile_path = os.path.join(vegetation_tiles_path, package, filename)
                    
                    if os.path.exists(tile_path):
                        try:
                            import rasterio
                            src = rasterio.open(tile_path)
                            tile_cache[filename] = {
                                'src': src,
                                'bounds': src.bounds
                            }
                        except Exception as e:
                            print(f'⚠️ Error cargando {filename}: {e}')
                
                # Procesar puntos NDVI
                ndvi_count = 0
                for point in points_for_ndvi:
                    lat = point['lat']
                    lon = point['lon']
                    idx = point.get('index', 0)
                    
                    for tile_name, tile_info in tile_cache.items():
                        src = tile_info['src']
                        bounds = tile_info['bounds']
                        
                        if bounds.left <= lon <= bounds.right and bounds.bottom <= lat <= bounds.top:
                            try:
                                py, px = src.index(lon, lat)
                                if 0 <= py < src.height and 0 <= px < src.width:
                                    ndvi_value = float(src.read(1)[py, px])
                                    if ndvi_value != -9999:
                                        if ndvi_value > 1:
                                            ndvi_value = ndvi_value / 255.0
                                        puntos_detalle[idx]['ndvi'] = round(ndvi_value, 3)
                                        ndvi_count += 1
                                        break
                            except:
                                pass
                
                # Cerrar tiles
                for tile_info in tile_cache.values():
                    tile_info['src'].close()
                
                print(f'✅ NDVI integrado: {ndvi_count}/{len(puntos_detalle)} puntos con valores reales')
            else:
                print(f'⚠️ No existe directorio vegetación: {vegetation_tiles_path}')
        
        except Exception as e:
            print(f'⚠️ Error obteniendo NDVI (continuando con 0.0): {e}')
            import traceback
            traceback.print_exc()
        

        
        resultado = {
            'success': True,
            'puntos_detalle': puntos_detalle,
            'pendiente_promedio': round(pendiente_promedio, 1),
            'pendiente_maxima': round(pendiente_maxima, 1),
            'pendiente_minima': round(pendiente_minima, 1),
            'pct_transitable': pct_transitable,
            'distribucion_pendientes': distribucion_pendientes,
            'puntos_criticos': puntos_criticos[:10],  # Máximo 10 para no saturar
            'estadisticas': {
                'puntos_analizados': len(valid_points),
                'segmentos_calculados': total_segmentos,
                'tiles_usados': len(tile_cache),
                'vehiculo': vehiculo,
                'clima': clima,
                'limite_efectivo': round(limite_efectivo, 1),
                'processing_time': round(processing_time, 2)
            }
        }
        
        print(f'🎉 Análisis completado en {processing_time:.2f}s')
        
        return jsonify(resultado)
    
    except Exception as e:
        print(f'❌ Error en análisis de terreno: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500


if __name__ == '__main__':
    import sys
    import subprocess
    import threading
    import re
    import time

    # Verificar argumentos de línea de comandos
    https_mode = "--https" in sys.argv

    # Configurar host y puerto
    host = "127.0.0.1"  # localhost para desarrollo seguro
    port = 5001

    print("🚀 Iniciando servidor MAIRA...")
    print(f"📍 Host: {host}:{port}")
    print(f"🔒 Modo HTTPS: {'Activado' if https_mode else 'Desactivado'}")

    protocol = "https" if https_mode else "http"
    print("\n" + "="*60)
    print("✅ URLs LOCALES:")
    print("="*60)
    print(f"🏠 Página Principal:        {protocol}://{host}:{port}/client/index.html")
    print(f"🎮 Iniciar Partida:         {protocol}://{host}:{port}/client/iniciarpartida.html")
    print(f"⚔️  Gestión de Batalla:      {protocol}://{host}:{port}/client/inicioGB.html")
    print(f"📊 Cuadro de Organización:  {protocol}://{host}:{port}/client/CO.html")
    print(f"🗺️  Planeamiento:            {protocol}://{host}:{port}/client/planeamiento.html")
    print(f"💚 Health Check:            {protocol}://{host}:{port}/health")
    print("="*60 + "\n")

    try:
        if https_mode:
            # Verificar certificados SSL
            cert_file = os.path.join(BASE_DIR, "ssl", "cert.pem")
            key_file = os.path.join(BASE_DIR, "ssl", "key.pem")

            if not os.path.exists(cert_file) or not os.path.exists(key_file):
                print("❌ Error: Certificados SSL no encontrados. Ejecuta sin --https para modo HTTP.")
                sys.exit(1)

            # Crear contexto SSL
            import ssl
            ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ssl_context.load_cert_chain(cert_file, key_file)

            # Iniciar servidor con SSL
            print("🔐 Iniciando servidor HTTPS...")
            socketio.run(
                app,
                host=host,
                port=port,
                ssl_context=ssl_context,
                debug=True,
                allow_unsafe_werkzeug=True
            )
        else:
            # Iniciar servidor HTTP normal
            print("🌐 Iniciando servidor HTTP...")
            socketio.run(
                app,
                host=host,
                port=port,
                debug=True,
                allow_unsafe_werkzeug=True
            )
            
    except KeyboardInterrupt:
        print("\n🛑 Deteniendo servidor...")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error al iniciar el servidor: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
