# serverhttps.py

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
import time
import bcrypt
import traceback
import subprocess
import signal
import ssl
from dotenv import load_dotenv
from datetime import datetime
from config import SERVER_URL, CLIENT_URL, SERVER_IP

# Obtener la ruta absoluta de la carpeta `server`
server_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(server_dir, '.env'))

# Ruta al directorio raíz del proyecto
BASE_DIR = os.path.dirname(server_dir)
CLIENT_DIR = os.path.join(BASE_DIR, 'Client')

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='/')
# Agregar soporte para proxy como ngrok
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Detectar si estamos usando ngrok
is_ngrok = 'ngrok' in request.headers.get('Host', '') if request else any('ngrok' in arg for arg in sys.argv)

# Configuración optimizada para Socket.IO
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    logger=True, 
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    transports=['polling'] if is_ngrok else ['websocket', 'polling'],
    upgrade=not is_ngrok
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

@app.route('/Client/<path:path>')
def serve_client_files(path):
    return send_from_directory(CLIENT_DIR, path)


 
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
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
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
    user_id = data.get('userId')
    username = data.get('username')
    if user_id and username:
        usuarios_conectados[user_id] = {'id': user_id, 'username': username, 'is_online': True}
        user_sid_map[request.sid] = user_id

        # Marcar al usuario como en línea
        connection = get_db_connection()
        if connection:
            with connection.cursor() as cursor:
                cursor.execute('UPDATE usuarios SET is_online = 1 WHERE id = %s', (user_id,))
            connection.commit()
            connection.close()

        # Emitir confirmación de login al cliente
        emit('loginExitoso', {'userId': user_id, 'username': username}, room=request.sid)

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

@socketio.on('login')
def handle_login(data):
    user_id = data.get('userId')
    username = data.get('username')
    if user_id and username:
        usuarios_conectados[user_id] = {'id': user_id, 'username': username, 'is_online': True}
        user_sid_map[request.sid] = user_id
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute('UPDATE usuarios SET is_online = 1 WHERE id = %s', (user_id,))
        connection.commit()
        connection.close()
        emit('usuariosConectados', list(usuarios_conectados.values()), broadcast=True)

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
        emit('errorUnirsePartida', {'mensaje': 'Usuario no autenticado'})
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
                emit('errorUnirsePartida', {'mensaje': 'La partida no existe'})
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
        emit('errorUnirsePartida', {'mensaje': f'Error al unirse a la partida: {str(e)}'})
    finally:
        if conn:
            conn.close()

@socketio.on('unirsePartidaJuego')
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
    
    # Crear operación si no existe
    if operacion not in operaciones_batalla:
        operaciones_batalla[operacion] = {
            'elementos': {},
            'info': {
                'creada': data.get('timestamp', ''),
                'creador': data.get('usuario', 'desconocido')
            }
        }
    
    # Unirse a la sala de la operación
    join_room(operacion)
    
    # Guardar datos del elemento
    operaciones_batalla[operacion]['elementos'][user_id] = data
    
    # Asociar sesión con usuario
    user_sid_map[sid] = user_id
    
    # Enviar lista de elementos existentes al nuevo elemento
    emit('elementosConectados', operaciones_batalla[operacion]['elementos'])
    
    # Notificar a otros elementos sobre la conexión
    emit('nuevoElementoConectado', data, room=operacion, skip_sid=sid)
    
    print(f"Elemento {user_id} conectado a operación {operacion}")

@socketio.on('actualizarPosicion')
def handle_actualizar_posicion_batalla(data):
    sid = request.sid
    user_id = data.get('id')
    
    if user_id not in user_sid_map.values():
        return
    
    # Buscar la operación del elemento
    operacion = None
    for op_nombre, op_data in operaciones_batalla.items():
        if user_id in op_data['elementos']:
            operacion = op_nombre
            break
    
    if not operacion:
        return
    
    # Actualizar datos del elemento
    operaciones_batalla[operacion]['elementos'][user_id].update(data)
    
    # Notificar a otros en la operación
    emit('actualizacionPosicion', data, room=operacion, skip_sid=sid)


@socketio.on('nuevoInforme')
def handle_nuevo_informe(data):
    sid = request.sid
    emisor_id = data.get('emisor', {}).get('id')
    
    if not emisor_id:
        return
    
    # Buscar la operación del emisor
    operacion = None
    for op_nombre, op_data in operaciones_batalla.items():
        if emisor_id in op_data['elementos']:
            operacion = op_nombre
            break
    
    if not operacion:
        return
    
    # Si tiene destinatario específico
    if data.get('destinatario') and data.get('destinatario') != "comando" and data.get('destinatario') != "todos":
        destinatario_id = data.get('destinatario')
        
        # Buscar el sid del destinatario
        dest_sid = None
        for s, uid in user_sid_map.items():
            if uid == destinatario_id:
                dest_sid = s
                break
        
        if dest_sid:
            emit('nuevoInforme', data, room=dest_sid)
    elif data.get('destinatario') == "todos":
        # Informe para todos en la operación
        emit('nuevoInforme', data, room=operacion, skip_sid=sid)
    else:
        # Informe para comando o sin destinatario específico
        emit('nuevoInforme', data, room=operacion)

@socketio.on('informeLeido')
def handle_informe_leido(data):
    # Marcar informe como leído (versión simple)
    informe_id = data.get('informeId')
    if informe_id:
        # Aquí podrías agregar lógica para actualizar el estado en una base de datos
        # Por ahora, solo emitimos confirmación
        emit('informeMarcadoLeido', {'informeId': informe_id})

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


@socketio.on('solicitarElementos')
def handle_request_elements(data):
    try:
        operacion = data.get('operacion')
        if not operacion:
            emit('error', {'mensaje': 'Operación no especificada'})
            return
        
        # Obtener y normalizar elementos
        elementos_raw = obtener_elementos_por_operacion(operacion)
        elementos_normalizados = []
        
        # Normalizar formato
        for elem in elementos_raw:
            # Asegurar que tiene ID único
            if 'id' not in elem:
                continue
                
            # Verificar si es duplicado (mismo ID)
            if any(e['id'] == elem['id'] for e in elementos_normalizados):
                continue
                
            # Añadir campos mínimos si faltan
            elem_normalizado = {
                'id': elem['id'],
                'usuario': elem.get('usuario', 'Desconocido'),
                'elemento': elem.get('elemento', {}),
                'conectado': elem.get('conectado', True),
                'timestamp': elem.get('timestamp', datetime.now().isoformat())
            }
            
            elementos_normalizados.append(elem_normalizado)
        
        print(f"Enviando {len(elementos_normalizados)} elementos normalizados para operación {operacion}")
        emit('listaElementos', elementos_normalizados)
        
        registrar_actividad('solicitud_elementos', request.sid, {
            'operacion': operacion, 
            'elementos_count': len(elementos_normalizados)
        })
        
    except Exception as e:
        print(f"Error en solicitarElementos: {e}")
        traceback.print_exc()
        emit('error', {'mensaje': f'Error al obtener lista de elementos: {str(e)}'})


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
        print(f"Zona confirmada recibida para partida {codigo_partida}")
        
        # Emitir a todos en la sala
        socketio.emit('zonaConfirmada', data, room=codigo_partida)
        
        # Si es zona azul, cambiar a fase despliegue
        if data['zona']['equipo'] == 'azul':
            socketio.emit('cambioFase', {
                'fase': 'preparacion',
                'subfase': 'despliegue',
                'jugadorId': data['jugadorId'],
                'timestamp': datetime.now().isoformat()
            }, room=codigo_partida)
    except Exception as e:
        print(f"Error en zonaConfirmada: {str(e)}")

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
def handle_guardar_elemento(datos):
    try:
        jugador_id = datos['jugadorId']
        partida_codigo = datos['partidaCodigo']
        
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Verificar si el elemento ya existe
            cursor.execute("""
                SELECT id 
                FROM marcadores_jugadores 
                WHERE id = %s
            """, (datos['id'],))
            
            existe = cursor.fetchone()
            
            if existe:
                # Actualizar elemento existente
                cursor.execute("""
                    UPDATE marcadores_jugadores 
                    SET tipo = %s, sidc = %s, designacion = %s, dependencia = %s, magnitud = %s,
                        posicion_lat = %s, posicion_lng = %s, actualizado_en = NOW()
                    WHERE id = %s
                """, (
                    datos['tipo'], datos['sidc'], datos['designacion'], datos['dependencia'], 
                    datos['magnitud'], datos['posicion'].get('lat'), datos['posicion'].get('lng'),
                    datos['id']
                ))
            else:
                # Insertar nuevo elemento
                cursor.execute("""
                    INSERT INTO marcadores_jugadores 
                    (id, jugador_id, partida_codigo, tipo, sidc, designacion, dependencia, magnitud,
                     posicion_lat, posicion_lng, creado_en)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, (
                    datos['id'], jugador_id, partida_codigo, datos['tipo'], datos['sidc'],
                    datos['designacion'], datos['dependencia'], datos['magnitud'],
                    datos['posicion'].get('lat'), datos['posicion'].get('lng')
                ))
            
            conn.commit()
            
            # Confirmar guardado exitoso
            emit('elementoGuardado', {
                'id': datos['id'],
                'exito': True
            })
            
    except Exception as e:
        print(f"Error al guardar elemento: {e}")
        traceback.print_exc()
        emit('error', {
            'mensaje': 'Error al guardar elemento en el servidor',
            'detalles': str(e)
        })

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
                    COUNT(CASE WHEN listo_despliegue = true THEN 1 END) as listos
                FROM usuarios_partida 
                WHERE partida_id = %s
            """, (codigo_partida,))
            
            estado = cursor.fetchone()
            if estado['total'] == estado['listos']:
                socketio.emit('iniciarCombate', {
                    'fase': 'combate',
                    'subfase': 'turno',
                    'timestamp': datetime.now().isoformat()
                }, room=codigo_partida)
                
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
                # Primero actualizar los contadores
                cursor.execute("""
                    UPDATE partidas p 
                    SET jugadores_actuales = (
                        SELECT COUNT(*) 
                        FROM usuarios_partida up 
                        WHERE up.partida_id = p.id
                    )
                """)
                
                # Luego eliminar las partidas vacías
                cursor.execute("""
                    DELETE p FROM partidas p
                    LEFT JOIN usuarios_partida up ON p.id = up.partida_id
                    WHERE up.partida_id IS NULL 
                    OR p.jugadores_actuales = 0
                    OR p.estado = 'esperando' AND 
                        (SELECT COUNT(*) FROM usuarios_partida WHERE partida_id = p.id) = 0
                """)
                conn.commit()
                
                if cursor.rowcount > 0:
                    print(f"Se eliminaron {cursor.rowcount} partidas vacías")
                    actualizar_lista_partidas()
        except Exception as e:
            print(f"Error al limpiar partidas vacías: {e}")
            conn.rollback()
        finally:
            conn.close()


@socketio.on('mensajeJuego')
def handle_mensaje_juego(data):
    try:
        print(f"Mensaje recibido: {data}")
        contenido = data.get('contenido')
        tipo = data.get('tipo')
        equipo = data.get('equipo')
        emisor = data.get('emisor')
        partida_codigo = data.get('partidaCodigo')

        mensaje = {
            'contenido': contenido,
            'tipo': tipo,
            'equipo': equipo,
            'emisor': emisor,
            'timestamp': datetime.now().isoformat()
        }

        if tipo == 'global':
            print(f"Enviando mensaje global a sala {partida_codigo}")
            emit('mensajeJuego', mensaje, room=partida_codigo, include_self=True)
        elif tipo == 'equipo':
            sala_equipo = f"equipo_{equipo}"
            print(f"Enviando mensaje de equipo a sala {sala_equipo}")
            emit('mensajeJuego', mensaje, room=sala_equipo, include_self=True)
        
        print(f"Mensaje enviado: {mensaje}")
        
    except Exception as e:
        print(f"Error al manejar mensaje: {e}")
        emit('errorChat', {'mensaje': str(e)})


@socketio.on('joinRoom')
def join_room_unified(data):
    """Handler unificado para unirse a salas"""
    # Normalizar el parámetro - podría ser un string o un objeto
    if isinstance(data, dict):
        room_name = data.get('sala') or data.get('codigo') or data.get('operacion')
    else:
        room_name = data
    
    if not room_name:
        emit('error', {'mensaje': 'No se proporcionó nombre de sala'})
        return
    
    # Guardar la sala actual del usuario
    user_id = user_sid_map.get(request.sid)
    if user_id:
        usuarios_conectados[user_id]['sala_actual'] = room_name
    
    # Unirse a la sala
    join_room(room_name)
    print(f"Usuario {user_id} ({request.sid}) unido a sala: {room_name}")
    
    # Notificar al usuario
    emit('salaActualizada', {'sala': room_name})
    
    # Si la sala está asociada a una operación/partida, también unir a subgrupos
    if user_id and 'equipo' in usuarios_conectados.get(user_id, {}):
        equipo = usuarios_conectados[user_id]['equipo']
        if equipo:
            room_equipo = f"{room_name}_{equipo}"
            join_room(room_equipo)
            print(f"Usuario {user_id} unido a sala de equipo: {room_equipo}")


@socketio.on('sectorDefinido')
def handle_sector_definido(data):
    try:
        partida_id = data['codigo']
        partida = partidas.get(partida_id)
        if not partida:
            return emit('error', {'mensaje': 'Partida no encontrada'})
        
        # Guardar el sector en la partida
        partida['sector'] = data['sector']
        
        # Emitir a todos los jugadores en la partida
        emit('sectorDefinido', {
            'sector': data['sector'],
            'definidoPor': data['definidoPor']
        }, room=partida_id)
        
        # Actualizar estado de la partida
        partida['estado'] = 'definiendo_zonas'
        
    except Exception as e:
        emit('error', {'mensaje': str(e)})


@socketio.on('mensajeMultimedia')
def handle_mensaje_multimedia(data):
    """Maneja mensajes con contenido multimedia (imágenes, audio, video)"""
    try:
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return {'error': 'Usuario no autenticado'}
            
        # Validar datos mínimos
        if 'tipo_contenido' not in data or 'contenido' not in data:
            emit('error', {'mensaje': 'Formato de mensaje inválido'})
            return {'error': 'Formato inválido'}
            
        # Generar ID único para el mensaje
        mensaje_id = f"media_{time.time()}_{random.randint(1000, 9999)}"
        
        # Obtener sala/operación
        sala = data.get('sala', 'general')
        
        # Datos del usuario
        username = usuarios_conectados.get(user_id, {}).get('username', 'Usuario')
        
        # Procesar contenido multimedia
        tipo_contenido = data['tipo_contenido']  # image, audio, video
        contenido_raw = data['contenido']  # base64
        
        # Crear objeto de adjunto para procesamiento
        adjunto = {
            'nombre': data.get('nombre_archivo', f"{tipo_contenido}_{mensaje_id}.{tipo_contenido}"),
            'tipo': data.get('mime_type', f"{tipo_contenido}/octet-stream"),
            'datos': contenido_raw,
            'timestamp': datetime.now().isoformat()
        }
        
        # Guardar archivo
        adjunto_info = guardar_adjunto_en_filesystem(
            mensaje_id, 
            adjunto, 
            tipo_origen='chat'
        )
        
        if not adjunto_info:
            emit('error', {'mensaje': 'Error al guardar archivo multimedia'})
            return {'error': 'Error al guardar archivo'}
            
        # Construir mensaje
        mensaje = {
            'id': mensaje_id,
            'usuario': username,
            'tipo_mensaje': 'multimedia',
            'tipo_contenido': tipo_contenido,
            'adjunto': adjunto_info,
            'texto': data.get('texto', ''),  # Texto opcional 
            'timestamp': datetime.now().isoformat()
        }
        
        # Enviar a la sala o destinatario específico
        if data.get('destinatario') and data.get('destinatario') != 'todos':
            # Mensaje privado
            dest_sid = None
            for s, uid in user_sid_map.items():
                if uid == data['destinatario']:
                    dest_sid = s
                    break
                    
            if dest_sid:
                mensaje['privado'] = True
                emit('mensajeMultimedia', mensaje, room=dest_sid)
                emit('mensajeMultimedia', mensaje, room=request.sid)  # Eco al emisor
            else:
                emit('error', {'mensaje': 'Destinatario no encontrado'})
        else:
            # Mensaje a toda la sala
            emit('mensajeMultimedia', mensaje, room=sala)
            
        # Guardar mensaje en historial si es necesario
        # guardar_mensaje_multimedia_en_db(mensaje)
        
        return {'success': True, 'mensaje_id': mensaje_id}
    except Exception as e:
        print(f"Error en mensajeMultimedia: {e}")
        traceback.print_exc()
        emit('error', {'mensaje': f'Error al procesar mensaje multimedia: {str(e)}'})
        return {'error': str(e)}


@socketio.on('zonaDespliegueDefinida')
def handle_zona_despliegue(data):
    try:
        partida_id = data['codigo']
        partida = partidas.get(partida_id)
        if not partida:
            return emit('error', {'mensaje': 'Partida no encontrada'})
        
        # Guardar la zona de despliegue
        if 'zonas_despliegue' not in partida:
            partida['zonas_despliegue'] = {}
        partida['zonas_despliegue'][data['equipo']] = data['zona']
        
        # Emitir a todos los jugadores
        emit('zonaDespliegueDefinida', {
            'equipo': data['equipo'],
            'zona': data['zona']
        }, room=partida_id)
        
        # Verificar si todas las zonas están definidas
        if len(partida['zonas_despliegue']) == 2:
            partida['estado'] = 'despliegue'
            emit('iniciandoDespliegue', partida['zonas_despliegue'], room=partida_id)
            
    except Exception as e:
        emit('error', {'mensaje': str(e)})

@socketio.on('iniciarCombate')
def handle_iniciar_combate(data):
    try:
        codigo_partida = data.get('partidaCodigo')
        print(f"[DEBUG] Iniciando fase de combate para partida {codigo_partida}")
        
        # Broadcast a todos en la sala
        socketio.emit('combateIniciado', {
            'partidaCodigo': codigo_partida,
            'fase': 'combate',
            'subfase': 'turno',
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
    except Exception as e:
        print(f"[ERROR] Error en iniciarCombate: {str(e)}")




## 1. Eventos para mensajes privados

@socketio.on('mensajePrivado')
def handle_private_message(mensaje):
    """Maneja mensajes privados entre usuarios"""
    try:
        # Validar mensaje
        if not mensaje or not isinstance(mensaje, dict):
            emit('error', {'mensaje': 'Formato de mensaje inválido'})
            return
        
        # Verificar campos requeridos
        if 'emisor' not in mensaje or 'contenido' not in mensaje or 'destinatario' not in mensaje:
            emit('error', {'mensaje': 'Faltan campos requeridos en el mensaje privado'})
            return
        
        # Añadir ID único si no lo tiene
        if 'id' not in mensaje:
            mensaje['id'] = f"msg_{time.time()}_{random.randint(1000, 9999)}"
        
        # Añadir timestamp si no lo tiene
        if 'timestamp' not in mensaje:
            mensaje['timestamp'] = datetime.now().isoformat()
        
        # Añadir estado de mensaje
        mensaje['estado'] = 'enviado'
        
        # Determinar destinatario(s)
        if mensaje['destinatario'] == 'todos':
            # Broadcast a todos en la sala (excepto el emisor)
            sala = mensaje.get('sala', 'general')
            mensaje_broadcast = mensaje.copy()
            emit('mensajePrivado', mensaje_broadcast, room=sala, include_self=False)
        elif mensaje['destinatario'] == 'comando':
            # Enviar a la central/comando (implementar según tu lógica)
            # Por ejemplo, podrías tener una lista de usuarios con rol de comando
            usuarios_comando = get_users_with_role('comando')
            for usuario_id in usuarios_comando:
                if usuario_id != mensaje['emisor']['id']:  # No enviar a sí mismo
                    emit('mensajePrivado', mensaje, room=usuario_id)
        else:
            # Mensaje a un usuario específico
            emit('mensajePrivado', mensaje, room=mensaje['destinatario'])
        
        # Echo al emisor (para confirmar envío)
        emit('mensajePrivado', mensaje)
        
        # Guardar en historial si es necesario
        guardar_mensaje_en_db(mensaje)
        
        return {'success': True, 'id': mensaje['id']}
    
    except Exception as e:
        print(f"Error en mensajePrivado: {e}")
        emit('error', {'mensaje': f'Error al procesar mensaje privado: {str(e)}'})
        return {'error': str(e)}


## 2. Soporte para archivos adjuntos en informes


@socketio.on('nuevoInforme')
def handle_new_report(informe):
    """Maneja nuevos informes con soporte para adjuntos"""
    try:
        # Validar informe
        if not informe or not isinstance(informe, dict):
            emit('error', {'mensaje': 'Formato de informe inválido'})
            return {'error': 'Formato inválido'}
        
        # Verificar campos requeridos
        campos_requeridos = ['id', 'emisor', 'destinatario', 'tipo', 'asunto', 'contenido']
        for campo in campos_requeridos:
            if campo not in informe:
                emit('error', {'mensaje': f'Falta campo requerido en informe: {campo}'})
                return {'error': f'Falta campo: {campo}'}
        
        # Añadir timestamp si no lo tiene
        if 'timestamp' not in informe:
            informe['timestamp'] = datetime.now().isoformat()
        
        # Manejar adjunto si existe
        if informe.get('tieneAdjunto') and informe.get('adjunto'):
            # Validar tamaño máximo (5MB)
            datos_adjunto = informe['adjunto'].get('datos', '')
            if len(datos_adjunto) > 5 * 1024 * 1024:  # 5MB en bytes
                emit('error', {'mensaje': 'El archivo adjunto excede el tamaño máximo permitido (5MB)'})
                return {'error': 'Archivo demasiado grande'}
            
            # Opcional: Guardar adjunto en sistema de archivos
            # Esta implementación depende de tu infraestructura
            # guardar_adjunto_en_filesystem(informe['id'], informe['adjunto'])
        
        # Guardar informe en la base de datos
        guardar_informe_en_db(informe)
        
        # Determinar destinatario(s)
        if informe['destinatario'] == 'todos':
            # Broadcast a todos en la operación
            sala = informe.get('operacion', 'general')
            emit('nuevoInforme', informe, room=sala, include_self=False)
        elif informe['destinatario'] == 'comando':
            # Enviar a la central/comando (implementar según tu lógica)
            usuarios_comando = get_users_with_role('comando')
            for usuario_id in usuarios_comando:
                if usuario_id != informe['emisor']['id']:  # No enviar a sí mismo
                    emit('nuevoInforme', informe, room=usuario_id)
        else:
            # Informe a un usuario específico
            emit('nuevoInforme', informe, room=informe['destinatario'])
        
        # Confirmar al emisor
        emit('informeEnviado', {'id': informe['id'], 'success': True})
        
        return {'success': True, 'id': informe['id']}
    
    except Exception as e:
        print(f"Error en nuevoInforme: {e}")
        emit('error', {'mensaje': f'Error al procesar informe: {str(e)}'})
        return {'error': str(e)}

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

## 3. Evento para obtener informe completo (para ver adjuntos)


@socketio.on('obtenerInformeCompleto')
def handle_get_full_report(data):
    """Obtiene un informe completo, incluyendo adjuntos"""
    try:
        if not data or 'informeId' not in data:
            emit('error', {'mensaje': 'ID de informe no especificado'})
            return {'error': 'ID no especificado'}
        
        # Obtener informe de la base de datos
        informe_id = data['informeId']
        informe = obtener_informe_por_id(informe_id)
        
        if not informe:
            print(f"Informe no encontrado: {informe_id}")
            emit('error', {'mensaje': 'Informe no encontrado'})
            return {'error': 'Informe no encontrado'}
        
        # Si el informe tiene adjunto pero no están los datos, intentar cargarlos
        if informe.get('tieneAdjunto') and informe.get('adjunto') and not informe['adjunto'].get('datos'):
            datos_adjunto = cargar_adjunto_desde_filesystem(informe_id)
            if datos_adjunto:
                informe['adjunto']['datos'] = datos_adjunto
                print(f"Adjunto cargado correctamente para informe {informe_id}")
            else:
                print(f"No se pudo cargar el adjunto para el informe {informe_id}")
        
        # Emitir el informe completo
        emit('informeCompleto', {'informe': informe})
        
        return {'success': True}
    except Exception as e:
        print(f"Error en obtenerInformeCompleto: {e}")
        traceback.print_exc()
        emit('error', {'mensaje': f'Error al obtener informe: {str(e)}'})
        return {'error': str(e)}

## 4. Mejorar el evento de lista de elementos


@socketio.on('solicitarElementos')
def handle_request_elements(data):
    """Proporciona la lista completa de elementos en una operación"""
    try:
        if not data or 'operacion' not in data:
            emit('error', {'mensaje': 'Operación no especificada'})
            return
        
        operacion = data['operacion']
        
        # Obtener lista de elementos/participantes para la operación
        elementos = obtener_elementos_por_operacion(operacion)
        
        # Enviar solo al solicitante
        emit('listaElementos', elementos)
        
        # Registrar actividad (opcional)
        registrar_actividad('solicitud_elementos', request.sid, {'operacion': operacion})
        
        return {'success': True, 'count': len(elementos)}
    
    except Exception as e:
        print(f"Error en solicitarElementos: {e}")
        emit('error', {'mensaje': f'Error al obtener lista de elementos: {str(e)}'})



## 7. Añadir soporte para usuarios con rol de comando

def get_users_with_role(rol):
    """Obtiene IDs de usuarios con un rol específico"""
    try:
        # Implementar según tu modelo de datos
        # Por ejemplo, si tienes una colección/tabla de usuarios con campo 'roles'
        usuarios = db.usuarios.find({'roles': rol})
        return [usuario['id'] for usuario in usuarios]
    except Exception as e:
        print(f"Error al obtener usuarios con rol {rol}: {e}")
        return []

## 8. Actualización de la función para unirse a operación


@socketio.on('unirseOperacionGB')
def handle_join_operation(data, callback=None):
    """Maneja la unión de un usuario a una operación"""
    try:
        # Validar datos
        if not data or not isinstance(data, dict):
            emit('error', {'mensaje': 'Formato de datos inválido'})
            if callback: callback({"error": "Formato de datos inválido"})
            return
            
        if 'operacionId' not in data and 'usuario' not in data and 'elemento' not in data:
            emit('error', {'mensaje': 'Datos incompletos para unirse a operación'})
            if callback: callback({"error": "Datos incompletos"})
            return
        
        # Obtener datos
        operacion_id = data.get('operacionId')
        usuario = data.get('usuario', {})
        elemento = data.get('elemento', {})
        posicion = data.get('posicion')
        
        # Buscar operación por ID
        operacion = None
        operacion_nombre = None
        
        for nombre, op_data in operaciones_batalla.items():
            if op_data['info'].get('id') == operacion_id:
                operacion = op_data
                operacion_nombre = nombre
                break
                
        if not operacion or not operacion_nombre:
            emit('error', {'mensaje': 'Operación no encontrada'})
            if callback: callback({"error": "Operación no encontrada"})
            return
            
        # Preparar datos del elemento
        datos_elemento = {
            'id': usuario.get('id'),
            'usuario': usuario.get('usuario'),
            'elemento': elemento,
            'conectado': True,
            'posicion': posicion,
            'timestamp': datetime.now().isoformat()
        }
        
        # Guardar en memoria
        operacion['elementos'][usuario.get('id')] = datos_elemento
        
        # Actualizar contador
        operacion['info']['participantes'] = len(operacion['elementos'])
        
        # Unir usuario a la sala
        join_room(operacion_nombre)
        
        # Registrar actividad
        registrar_actividad('union_operacion', request.sid, {
            'usuario': usuario.get('usuario'),
            'operacion': operacion_nombre
        })
        
        # Notificar a otros usuarios en la operación
        emit('nuevaConexion', datos_elemento, room=operacion_nombre, include_self=False)
        
        # Responder al usuario que se unió
        respuesta = {
            "usuario": usuario,
            "elemento": elemento,
            "operacion": {
                'id': operacion_id,
                'nombre': operacion_nombre,
                **operacion['info']
            }
        }
        
        emit('unidoOperacionGB', respuesta)
        
        if callback:
            callback({"success": True, "operacion": respuesta['operacion']})
            
        print(f"Usuario {usuario.get('usuario')} unido a operación {operacion_nombre}")
        
    except Exception as e:
        print(f"Error en unirseOperacionGB: {e}")
        traceback.print_exc()
        emit('error', {'mensaje': f'Error al unirse a operación: {str(e)}'})
        if callback:
            callback({"error": str(e)})

## Funciones adicionales para la base de datos
def obtener_elementos_por_operacion(operacion_nombre):
    """
    Obtiene todos los elementos de una operación
    
    Args:
        operacion_nombre (str): Nombre de la operación
        
    Returns:
        list: Lista de elementos en la operación
    """
    try:
        if operacion_nombre in operaciones_batalla:
            return list(operaciones_batalla[operacion_nombre]['elementos'].values())
        return []
    except Exception as e:
        print(f"Error al obtener elementos por operación: {e}")
        return []

def obtener_operacion_por_nombre(operacion_nombre):
    """
    Obtiene una operación por su nombre
    
    Args:
        operacion_nombre (str): Nombre de la operación
        
    Returns:
        dict: Datos de la operación o None si no existe
    """
    try:
        if operacion_nombre in operaciones_batalla:
            info = operaciones_batalla[operacion_nombre]['info']
            return {
                'id': info.get('id', operacion_nombre),
                'nombre': operacion_nombre,
                'creador': info.get('creador', 'Desconocido'),
                'fechaCreacion': info.get('fechaCreacion', ''),
                'descripcion': info.get('descripcion', ''),
                'elementos': len(operaciones_batalla[operacion_nombre]['elementos'])
            }
        return None
    except Exception as e:
        print(f"Error al obtener operación por nombre: {e}")
        return None

def guardar_elemento_en_operacion(operacion_id, datos_elemento):
    """
    Guarda un elemento en una operación
    
    Args:
        operacion_id (str): ID de la operación
        datos_elemento (dict): Datos del elemento a guardar
        
    Returns:
        bool: True si se guardó correctamente, False en caso contrario
    """
    try:
        # Buscar operación por ID
        for nombre_op, operacion_data in operaciones_batalla.items():
            if operacion_data['info'].get('id') == operacion_id:
                # Guardar elemento
                elemento_id = datos_elemento.get('id')
                if not elemento_id:
                    return False
                    
                operacion_data['elementos'][elemento_id] = datos_elemento
                
                # Actualizar contador de participantes
                operacion_data['info']['participantes'] = len(operacion_data['elementos'])
                
                return True
                
        # Si llegamos aquí, no se encontró la operación
        print(f"No se encontró operación con ID {operacion_id}")
        return False
    except Exception as e:
        print(f"Error al guardar elemento en operación: {e}")
        traceback.print_exc()
        return False
    
def guardar_mensaje_en_db(mensaje):
    """Guarda un mensaje en la base de datos"""
    try:
        # Implementar según tu base de datos
        # Ejemplo para MongoDB:
        db.mensajes.insert_one(mensaje)
    except Exception as e:
        print(f"Error al guardar mensaje: {e}")

# Variables globales para almacenamiento de informes y adjuntos
informes_db = {}
adjuntos_info = {}

# Definir la carpeta de subida
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def guardar_informe_en_db(informe):
    """Guarda un informe en memoria (versión simplificada)"""
    try:
        # Extraer ID del informe
        informe_id = informe['id']
        
        # Si tiene adjunto con datos binarios grandes, separarlos
        if informe.get('tieneAdjunto') and informe.get('adjunto') and informe['adjunto'].get('datos'):
            # Guardar adjunto en filesystem
            ruta = guardar_adjunto_en_filesystem(informe_id, informe['adjunto'])
            
            # Eliminar datos binarios para almacenamiento en memoria
            informe_memoria = informe.copy()
            if 'datos' in informe_memoria['adjunto']:
                del informe_memoria['adjunto']['datos']
            
            # Añadir ruta al adjunto
            informe_memoria['adjunto']['ruta'] = ruta
            
            # Guardar informe sin datos binarios
            informes_db[informe_id] = informe_memoria
        else:
            # Guardar informe completo
            informes_db[informe_id] = informe.copy()
        
        print(f"Informe {informe_id} guardado correctamente")
        return True
    except Exception as e:
        print(f"Error al guardar informe: {e}")
        traceback.print_exc()
        return False

def guardar_adjunto_en_filesystem(informe_id, adjunto, tipo_origen='informe'):
    """
    Guarda un archivo adjunto en el sistema de archivos
    
    Args:
        informe_id (str): ID del informe o mensaje
        adjunto (dict): Información del adjunto
        tipo_origen (str): 'informe' o 'chat'
        
    Returns:
        dict: Información del archivo guardado incluyendo ruta
    """
    try:
        # Determinar directorio base según origen
        if tipo_origen == 'informe':
            base_dir = INFORMES_DIR
        elif tipo_origen == 'chat':
            base_dir = CHAT_DIR
        else:
            base_dir = BASE_UPLOADS_DIR
        
        # Determinar subdirectorio según tipo de archivo
        tipo_base = adjunto.get('tipo', '').split('/')[0]  # Obtener 'image', 'audio', 'video', etc.
        
        if tipo_base == 'image':
            subdir = 'imagenes'
        elif tipo_base == 'audio':
            subdir = 'audio'
        elif tipo_base == 'video':
            subdir = 'video'
        else:
            subdir = 'documentos'
            
        # Construir ruta completa
        directorio = os.path.join(base_dir, subdir)
        os.makedirs(directorio, exist_ok=True)
        
        # Extraer datos del adjunto
        nombre_archivo = adjunto.get('nombre', f"adjunto_{informe_id}")
        tipo_archivo = adjunto.get('tipo', 'application/octet-stream')
        datos_base64 = adjunto.get('datos', '')
        
        # Asegurar nombre de archivo seguro
        nombre_seguro = secure_filename(nombre_archivo)
        
        # Añadir timestamp e ID para evitar colisiones
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_final = f"{timestamp}_{informe_id}_{nombre_seguro}"
        
        # Ruta relativa (para almacenar en BD)
        ruta_relativa = os.path.join(
            'uploads',
            'informes' if tipo_origen == 'informe' else 'chat', 
            subdir, 
            nombre_final
        )
        
        # Ruta absoluta (para sistema de archivos)
        ruta_absoluta = os.path.join(directorio, nombre_final)
        
        # Eliminar prefijo base64 si existe
        if ';base64,' in datos_base64:
            datos_base64 = datos_base64.split(';base64,')[1]
        
        # Convertir de base64 a binario
        import base64
        datos_binarios = base64.b64decode(datos_base64)
        
        # Guardar archivo
        with open(ruta_absoluta, 'wb') as f:
            f.write(datos_binarios)
        
        print(f"Archivo {tipo_base} guardado en: {ruta_absoluta}")
        
        # Para imágenes, crear versión en miniatura para previsualización
        if tipo_base == 'image':
            try:
                from PIL import Image
                import io
                
                # Crear miniatura
                with Image.open(io.BytesIO(datos_binarios)) as img:
                    img.thumbnail((300, 300))
                    thumb_path = os.path.join(directorio, f"thumb_{nombre_final}")
                    img.save(thumb_path)
                    
                    # Ruta de thumbnail (relativa)
                    thumb_relativa = os.path.join(
                        'uploads',
                        'informes' if tipo_origen == 'informe' else 'chat', 
                        subdir, 
                        f"thumb_{nombre_final}"
                    )
            except ImportError:
                print("Pillow no disponible, no se creó miniatura")
                thumb_relativa = None
            except Exception as e:
                print(f"Error al crear miniatura: {e}")
                thumb_relativa = None
        else:
            thumb_relativa = None
        
        # Guardar información del adjunto
        adjunto_info = {
            'nombre': nombre_archivo,
            'nombre_seguro': nombre_final,
            'tipo': tipo_archivo,
            'tipo_base': tipo_base,
            'tamaño': len(datos_binarios),
            'ruta': ruta_relativa,        # Ruta relativa para la BD
            'ruta_absoluta': ruta_absoluta,  # Ruta absoluta (opcional)
            'ruta_thumbnail': thumb_relativa,
            'timestamp': adjunto.get('timestamp', datetime.now().isoformat())
        }
        
        return adjunto_info
    except Exception as e:
        print(f"Error al guardar adjunto: {e}")
        traceback.print_exc()
        return None
    


def obtener_info_adjunto(informe_id):
    """Obtiene información de un adjunto por el ID del informe"""
    try:
        # Primero buscar en el diccionario de adjuntos
        if informe_id in adjuntos_info:
            return adjuntos_info[informe_id]
        
        # Si no está, buscar en el informe
        if informe_id in informes_db and informes_db[informe_id].get('adjunto'):
            return informes_db[informe_id]['adjunto']
            
        return None
    except Exception as e:
        print(f"Error al obtener información del adjunto: {e}")
        return None

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


def registrar_actividad(tipo_actividad, sid, datos=None):
    """
    Registra actividad en el sistema para fines de logging y depuración
    
    Args:
        tipo_actividad (str): Tipo de actividad realizada
        sid (str): Socket ID del usuario
        datos (dict, opcional): Datos adicionales sobre la actividad
    """
    try:
        # Obtener información del usuario si está disponible
        user_id = user_sid_map.get(sid)
        username = None
        
        if user_id and user_id in usuarios_conectados:
            username = usuarios_conectados[user_id].get('username', 'Unknown')
        
        # Crear registro de actividad
        actividad = {
            'tipo': tipo_actividad,
            'sid': sid,
            'user_id': user_id,
            'username': username,
            'timestamp': datetime.now().isoformat(),
            'datos': datos or {}
        }
        
        # Imprimir en consola para depuración
        print(f"Actividad: {tipo_actividad} por usuario {username or 'anónimo'} ({user_id or 'no identificado'})")
        
        # Aquí podrías guardar en una base de datos si es necesario
        # También podrías implementar algún tipo de sistema de rotación de logs
        
        return True
    except Exception as e:
        print(f"Error al registrar actividad: {e}")
        return False


# Variable global para guardar referencia al proceso del control de gestos
gesture_process = None

@app.route('/gestos/iniciar', methods=['POST'])
def iniciar_gestos():
    global gesture_process
    
    # Si ya hay un proceso en ejecución, no iniciamos otro
    if gesture_process is not None:
        return jsonify({"status": "error", "message": "El control de gestos ya está en ejecución"})
    
    try:
        # Ruta al script de control de gestos con la ruta correcta
        gestos_script = '/Users/mac/Documents/GitHub/MAIRA_git/Server/detectorGestos.py'
        
        # Inicia el script en un proceso separado
        gesture_process = subprocess.Popen([sys.executable, gestos_script])
        
        return jsonify({"status": "success", "message": "Control de gestos iniciado correctamente"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error al iniciar el control de gestos: {str(e)}"})

@app.route('/gestos/detener', methods=['POST'])
def detener_gestos():
    global gesture_process
    
    if gesture_process is None:
        return jsonify({"status": "error", "message": "El control de gestos no está en ejecución"})
    
    try:
        # Terminar el proceso
        gesture_process.terminate()
        gesture_process = None
        return jsonify({"status": "success", "message": "Control de gestos detenido correctamente"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error al detener el control de gestos: {str(e)}"})

@app.route('/gestos/estado', methods=['GET'])
def estado_gestos():
    global gesture_process
    
    estado = "activo" if gesture_process is not None else "inactivo"
    return jsonify({"status": estado})

@app.route('/gestos/calibrar', methods=['POST'])
def calibrar_gestos():
    global gesture_process
    
    if gesture_process is None:
        return jsonify({"status": "error", "message": "El control de gestos no está en ejecución"})
    
    try:
        # Terminar el proceso actual y reiniciarlo con flag de calibración
        gesture_process.terminate()
        
        gestos_script = '/Users/mac/Documents/GitHub/MAIRA_git/Server/detectorGestos.py'
        gesture_process = subprocess.Popen([sys.executable, gestos_script, "--calibrar"])
        
        return jsonify({"status": "success", "message": "Calibración iniciada"})
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error al iniciar calibración: {str(e)}"})
    



# actualizacion la sección de ejecución para usar SSL:
if __name__ == '__main__':
    # Detectar si estamos usando ngrok
    is_ngrok = any('ngrok' in arg for arg in sys.argv)
    
    # Ruta a los certificados
    cert_path = os.path.join(BASE_DIR, 'ssl', 'cert.pem')
    key_path = os.path.join(BASE_DIR, 'ssl', 'key.pem')
    
    # En modo ngrok, no usamos SSL ya que ngrok ya lo proporciona
    if is_ngrok:
        print("Modo ngrok detectado, optimizando configuración...")
        socketio.run(app, 
                     debug=True, 
                     host='0.0.0.0',
                     port=5000,
                     allow_unsafe_werkzeug=True)
    # Verificar si existen los certificados para modo normal
    elif os.path.exists(cert_path) and os.path.exists(key_path):
        print("Iniciando servidor con HTTPS...")
        socketio.run(app, 
                     debug=True, 
                     host='0.0.0.0',
                     port=5000,
                     ssl_context=(cert_path, key_path),
                     allow_unsafe_werkzeug=True)
    else:
        print("No se encontraron certificados SSL, iniciando sin HTTPS")
        print("ADVERTENCIA: La geolocalización no funcionará sin HTTPS")
        socketio.run(app, 
                     debug=True, 
                     host='0.0.0.0',
                     port=5000,
                     allow_unsafe_werkzeug=True)