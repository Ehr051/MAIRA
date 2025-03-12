# server.py

import os
from flask import Flask, request, jsonify, make_response
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import pymysql
from pymysql.cursors import DictCursor
import json
import random
import string
import bcrypt
import traceback
import subprocess
import signal
import sys
from dotenv import load_dotenv
from datetime import datetime
from config import SERVER_URL, CLIENT_URL, SERVER_IP

# Obtener la ruta absoluta de la carpeta `server`
server_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(server_dir, '.env'))


# Configuración de la aplicación y SocketIO

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

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


@app.route('/')
def index():
    return "Servidor en funcionamiento"

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
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    unidad = data.get('unidad')

    if not all([username, password, email, unidad]):
        return jsonify({"success": False, "message": "Todos los campos son requeridos"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Error conectando a la base de datos"}), 500

    try:
        cursor = conn.cursor()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        cursor.execute(
            "INSERT INTO usuarios (username, password, email, unidad) VALUES (%s, %s, %s, %s)",
            (username, hashed_password, email, unidad)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Usuario creado exitosamente"})
    except Exception as e:
        print("Error al crear usuario:", e)
        return jsonify({"success": False, "message": "Error al crear usuario", "error": str(e)}), 500
    finally:
        if conn:
            cursor.close()
            conn.close()


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


@socketio.on('disconnect')
def handle_disconnect():
    user_id = user_sid_map.pop(request.sid, None)
    if user_id:
        usuarios_conectados.pop(user_id, None)
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute('UPDATE usuarios SET is_online = 0 WHERE id = %s', (user_id,))
        connection.commit()
        connection.close()
        emit('usuariosConectados', list(usuarios_conectados.values()), broadcast=True)
    print(f'Cliente desconectado: {request.sid}')

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


# En server.py, modificar la función actualizar_lista_partidas
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
def handle_mensaje_chat(data):
    sala = data.get('sala', 'general')
    mensaje = data['mensaje']
    usuario = usuarios_conectados[user_sid_map[request.sid]]['username']
    emit('mensajeChat', {'usuario': usuario, 'mensaje': mensaje}, room=sala)

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
def join_room_handler(room):
    print(f"Usuario {request.sid} uniéndose a la sala: {room}")
    join_room(room)
    emit('salaActualizada', {'sala': room})


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
    
    
if __name__ == '__main__':
    socketio.run(app, 
                 debug=True, 
                 host='0.0.0.0',  # Escuchar en todas las interfaces
                 port=5000,
                 allow_unsafe_werkzeug=True)