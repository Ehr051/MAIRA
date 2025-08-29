# app.py - MAIRA Sistema completo para Render.com
# Versión simplificada Flask para máxima compatibilidad

import os
import sys
import json
import random
import string
import time
import traceback
import urllib.request
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix

# Cargar variables de entorno desde .env
from dotenv import load_dotenv

# Detectar entorno automáticamente
if os.environ.get('RENDER'):
    # Estamos en Render (producción)
    print("🌐 Entorno detectado: RENDER (Producción)")
    # En Render, las variables se configuran en el dashboard
else:
    # Desarrollo local - cargar .env.development si existe, sino .env
    env_file = '.env.development' if os.path.exists('.env.development') else '.env'
    load_dotenv(env_file)
    print(f"🏠 Entorno detectado: DESARROLLO LOCAL (usando {env_file})")

# ✅ MODO DESARROLLO EN MEMORIA
USE_MEMORY_MODE = os.environ.get('USE_MEMORY_MODE', 'False').lower() == 'true'

# Base de datos en memoria para desarrollo
memory_db = {
    'usuarios': [
        {'id': 1, 'usuario': 'admin', 'password': 'hashed_password', 'online': False},
        {'id': 2, 'usuario': 'player1', 'password': 'hashed_password', 'online': False},
        {'id': 3, 'usuario': 'player2', 'password': 'hashed_password', 'online': False},
        {'id': 4, 'usuario': 'testuser', 'password': 'hashed_password', 'online': False},
        {'id': 5, 'usuario': 'nova2', 'password': 'hashed_password', 'online': False}
    ],
    'partidas': [],
    'usuarios_partida': [],
    'amistades': [],
    'mensajes': []
} if USE_MEMORY_MODE else None

print(f"🗄️ Modo base de datos: {'MEMORIA (desarrollo)' if USE_MEMORY_MODE else 'PostgreSQL'}")

# Importaciones bajo demanda para mejor rendimiento

# ✅ FUNCIÓN HELPER PARA JSON SEGURO
def safe_json_parse(json_string):
    """Parsea JSON de forma segura, devuelve {} si falla"""
    if not json_string:
        return {}
    
    try:
        return json.loads(json_string)
    except (json.JSONDecodeError, TypeError) as e:
        print(f"⚠️ Error parsing JSON: {e}, contenido: {json_string[:100]}...")
        return {}
def lazy_import_psycopg2():
    """Importar psycopg2 solo cuando se necesite"""
    global psycopg2, RealDictCursor
    import psycopg2
    from psycopg2.extras import RealDictCursor
    return psycopg2, RealDictCursor

def lazy_import_bcrypt():
    """Importar bcrypt solo cuando se necesite"""
    global bcrypt
    import bcrypt
    return bcrypt

def lazy_import_tarfile():
    """Importar tarfile solo cuando se necesite"""
    global tarfile, traceback
    import tarfile
    import traceback
    return tarfile, traceback

# Variables globales
usuarios_conectados = {}  
operaciones_batalla = {}
informes_db = {}
adjuntos_info = {}
partidas = {}
user_sid_map = {}
user_id_sid_map = {} 

# Configuración de Flask
app = Flask(__name__, static_folder='.')
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configuración de SocketIO optimizada para Render.com + RENDIMIENTO
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    logger=False,  # ✅ OPTIMIZACIÓN: Desactivar logging detallado para mejor rendimiento
    engineio_logger=False,  # ✅ OPTIMIZACIÓN: Desactivar engineio logging
    ping_timeout=90,  # ✅ OPTIMIZADO: Reducido de 120 a 90 para detectar desconexiones más rápido
    ping_interval=45,  # ✅ OPTIMIZADO: Reducido de 60 a 45 para mejor responsividad
    transports=['polling'],  # ✅ FORZAR POLLING en lugar de websocket para Render
    upgrade=False,  # ✅ Evitar upgrade a websocket
    async_mode='threading',  # ✅ NUEVO: Modo threading para mejor concurrencia
    max_http_buffer_size=1000000  # ✅ NUEVO: Buffer de 1MB para mensajes grandes
)

# ✅ DATABASE POOLING - OPTIMIZACIÓN CRÍTICA DE RENDIMIENTO
import threading
from contextlib import contextmanager

# Pool de conexiones global
db_pool = None
pool_lock = threading.Lock()

def initialize_db_pool():
    """Inicializa el pool de conexiones PostgreSQL"""
    global db_pool
    try:
        # Lazy import de psycopg2 y pool
        psycopg2, RealDictCursor = lazy_import_psycopg2()
        
        # Importar pool de manera segura
        try:
            from psycopg2 import pool
        except ImportError:
            print("⚠️ psycopg2.pool no disponible, usando conexiones directas")
            return False
        
        DATABASE_URL = os.environ.get('DATABASE_URL')
        
        if DATABASE_URL:
            print("🏊‍♂️ Inicializando Connection Pool con DATABASE_URL...")
            # Crear pool de conexiones para producción
            db_pool = pool.ThreadedConnectionPool(
                minconn=1,      # Mínimo 1 conexión siempre activa
                maxconn=10,     # Máximo 10 conexiones para Render Free
                dsn=DATABASE_URL,
                cursor_factory=RealDictCursor
            )
            print("✅ Connection Pool inicializado exitosamente")
            return True
        else:
            print("⚠️ DATABASE_URL no disponible, usando conexiones directas")
            return False
            
    except Exception as e:
        print(f"❌ Error inicializando Connection Pool: {e}")
        return False

@contextmanager
def get_db_connection_pooled():
    """Context manager para obtener conexión del pool"""
    global db_pool
    
    if db_pool is None:
        # Fallback a conexión directa si no hay pool
        conn = get_db_connection_direct()
        if conn:
            try:
                yield conn
            finally:
                conn.close()
        else:
            yield None
        return
    
    conn = None
    try:
        # Obtener conexión del pool
        conn = db_pool.getconn()
        if conn:
            # Verificar que la conexión esté activa
            conn.autocommit = False
            yield conn
        else:
            yield None
    except Exception as e:
        print(f"❌ Error obteniendo conexión del pool: {e}")
        yield None
    finally:
        if conn:
            try:
                # Devolver conexión al pool
                db_pool.putconn(conn)
            except Exception as e:
                print(f"⚠️ Error devolviendo conexión al pool: {e}")

# Configuración de la base de datos PostgreSQL (función original como fallback)
def get_db_connection_direct():
    try:
        # Lazy import de psycopg2 solo cuando se necesite
        psycopg2, RealDictCursor = lazy_import_psycopg2()
        
        # Priorizar DATABASE_URL (para producción en Render)
        DATABASE_URL = os.environ.get('DATABASE_URL')
        print(f"🔍 DATABASE_URL presente: {'SÍ' if DATABASE_URL else 'NO'}")
        
        if DATABASE_URL:
            # Mostrar parte de la URL sin exponer credenciales completas
            url_preview = DATABASE_URL[:30] + "..." + DATABASE_URL[-15:] if len(DATABASE_URL) > 45 else DATABASE_URL
            print(f"🔗 Conectando con DATABASE_URL: {url_preview}")
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            print("✅ Conexión exitosa a PostgreSQL via DATABASE_URL")
            return conn
        
        # Fallback para desarrollo local con variables individuales
        host = os.environ.get('DB_HOST', 'localhost')
        database = os.environ.get('DB_NAME', 'maira_db')
        user = os.environ.get('DB_USER', 'postgres')
        password = os.environ.get('DB_PASSWORD', '')
        port = os.environ.get('DB_PORT', '5432')
        
        print(f"🔗 Intentando conexión local: {user}@{host}:{port}/{database}")
        
        if not password:
            print("⚠️ DB_PASSWORD no está configurado para conexión local")
            return None
            
        conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password,
            port=port,
            cursor_factory=RealDictCursor
        )
        print("✅ Conexión exitosa a PostgreSQL via credenciales individuales")
        return conn
        
    except psycopg2.OperationalError as e:
        print(f"❌ Error de conexión PostgreSQL: {e}")
        print(f"💡 Asegúrate de configurar DATABASE_URL en Render o las variables DB_* localmente")
        return None
    except psycopg2.Error as e:
        print(f"❌ Error de PostgreSQL: {e}")
        return None
    except Exception as e:
        print(f"❌ Error general conectando a PostgreSQL: {e}")
        return None

# ✅ NUEVA FUNCIÓN: Mantener compatibilidad con código existente
def get_db_connection():
    """Función de compatibilidad que usa pool si está disponible, sino conexión directa"""
    global db_pool
    
    # Si estamos en modo memoria, devolver un mock de conexión
    if USE_MEMORY_MODE:
        print("🧠 Usando base de datos en memoria")
        return MemoryDBConnection()
    
    if db_pool is not None:
        # Usar pool si está disponible (mejor rendimiento)
        try:
            conn = db_pool.getconn()
            if conn:
                conn.autocommit = False
                return conn
        except Exception as e:
            print(f"⚠️ Pool falló, usando conexión directa: {e}")
    
    # Fallback a conexión directa
    return get_db_connection_direct()

class MemoryDBConnection:
    """Mock de conexión de base de datos que usa memoria"""
    
    def __init__(self):
        self.closed = False
    
    def cursor(self):
        return MemoryDBCursor()
    
    def commit(self):
        pass
    
    def rollback(self):
        pass
    
    def close(self):
        self.closed = True

class MemoryDBCursor:
    """Mock de cursor que simula consultas SQL en memoria"""
    
    def __init__(self):
        self.results = []
        self.rowcount = 0
        
    def execute(self, query, params=None):
        """Simula ejecución de queries SQL"""
        global memory_db
        
        query_lower = query.lower().strip()
        
        # LOGIN - verificar usuario
        if 'select * from usuarios where usuario' in query_lower:
            username = params[0] if params else 'nova2'
            user = next((u for u in memory_db['usuarios'] if u['usuario'] == username), None)
            if user:
                self.results = [user]
                self.rowcount = 1
            else:
                self.results = []
                self.rowcount = 0
        
        # OBTENER PARTIDAS
        elif 'select * from partidas' in query_lower:
            self.results = memory_db['partidas']
            self.rowcount = len(self.results)
        
        # CREAR PARTIDA
        elif 'insert into partidas' in query_lower:
            # Simular inserción de partida
            nuevo_id = len(memory_db['partidas']) + 1
            codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            partida = {
                'id': nuevo_id,
                'codigo': codigo,
                'nombre': 'Partida Test',
                'estado': 'esperando',
                'configuracion': '{"nombrePartida": "Test", "duracionPartida": "30", "duracionTurno": "2"}',
                'fecha_creacion': datetime.now(),
                'max_jugadores': 8,
                'jugadores_actuales': 1
            }
            memory_db['partidas'].append(partida)
            self.results = [partida]
            self.rowcount = 1
        
        # ACTUALIZAR USUARIO ONLINE
        elif 'update usuarios set online' in query_lower:
            if params:
                user_id = params[0] if len(params) > 0 else None
                if user_id:
                    user = next((u for u in memory_db['usuarios'] if u['id'] == user_id), None)
                    if user:
                        user['online'] = True
            self.rowcount = 1
        
        # DEFAULT - simular éxito
        else:
            self.results = []
            self.rowcount = 1
    
    def fetchall(self):
        return self.results
    
    def fetchone(self):
        return self.results[0] if self.results else None
    
    def close(self):
        pass

# ✅ NUEVA FUNCIÓN: Devolver conexión al pool
def return_db_connection(conn):
    """Devolver conexión al pool o cerrarla si no hay pool"""
    global db_pool
    
    if conn is None:
        return
        
    try:
        if db_pool is not None:
            # Devolver al pool
            db_pool.putconn(conn)
        else:
            # Cerrar conexión directa
            conn.close()
    except Exception as e:
        print(f"⚠️ Error devolviendo conexión: {e}")
        try:
            conn.close()
        except:
            pass

# Rutas básicas
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        # Intentar servir desde static/ primero para archivos HTML
        if path.endswith('.html'):
            return send_from_directory('static', path)
        # Para otros archivos, intentar desde la raíz
        return send_from_directory('.', path)
    except:
        # Si falla, servir index.html desde static/
        return send_from_directory('static', 'index.html')

# ✅ NUEVAS: Rutas de archivos faltantes
@app.route('/Client/uploads/<path:filename>')
def serve_uploads(filename):
    """Servir archivos de uploads"""
    uploads_dir = os.path.join('.', 'Client', 'uploads')
    return send_from_directory(uploads_dir, filename)

@app.route('/Client/audio/<path:filename>')
def serve_audio(filename):
    """Servir archivos de audio"""
    audio_dir = os.path.join('.', 'Client', 'audio')
    return send_from_directory(audio_dir, filename)

@app.route('/Client/<path:path>')
def serve_client_files(path):
    """Servir archivos estáticos del cliente"""
    client_dir = os.path.join('.', 'Client')
    return send_from_directory(client_dir, path)

@app.route('/health')
def health_check():
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"})
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Ruta de configuración crítica - MIGRADA DE serverhttps.py"""
    return jsonify({
        'SERVER_URL': os.environ.get('SERVER_URL', request.host_url.rstrip('/')),
        'CLIENT_URL': os.environ.get('CLIENT_URL', request.host_url.rstrip('/')),
        'SERVER_IP': os.environ.get('SERVER_IP', '0.0.0.0')
    })

@app.route('/api/adjuntos/<informe_id>', methods=['GET'])
def obtener_adjunto_api(informe_id):
    """API de adjuntos - MIGRADA DE serverhttps.py"""
    try:
        # Implementación básica para Render
        return jsonify({"mensaje": "Adjuntos no implementados aún en versión Render"}), 501
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/debug/tables')
def debug_tables():
    """Debug endpoint para verificar tablas de la base de datos"""
    try:
        psycopg2, RealDictCursor = lazy_import_psycopg2()
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "No database connection"}), 500
        
        cursor = conn.cursor()
        
        # Listar todas las tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        # Verificar tabla partidas específicamente
        partidas_exists = 'partidas' in tables
        
        result = {
            "tables": tables,
            "partidas_table_exists": partidas_exists,
            "total_tables": len(tables)
        }
        
        # Si existe tabla partidas, obtener su estructura
        if partidas_exists:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'partidas' 
                ORDER BY ordinal_position;
            """)
            partidas_structure = cursor.fetchall()
            result["partidas_structure"] = partidas_structure
            
            # Contar registros
            cursor.execute("SELECT COUNT(*) FROM partidas;")
            result["partidas_count"] = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Debug error: {str(e)}"}), 500

@app.route('/api/proxy/github/<path:file_path>')
def proxy_github_file(file_path):
    """Proxy para archivos de GitHub Release para evitar CORS"""
    import requests
    
    try:
        # URL base del release tiles-v3.0
        base_url = 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/'
        github_url = base_url + file_path
        
        # Hacer la request al archivo de GitHub
        response = requests.get(github_url, stream=True)
        
        if response.status_code == 200:
            # Determinar el content-type basado en la extensión
            content_type = 'application/octet-stream'
            if file_path.endswith('.json'):
                content_type = 'application/json'
            elif file_path.endswith('.tar.gz'):
                content_type = 'application/gzip'
            
            # Agregar headers CORS
            headers = {
                'Content-Type': content_type,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
            
            return response.content, 200, headers
        else:
            return jsonify({"error": f"File not found: {file_path}"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Proxy error: {str(e)}"}), 500

@app.route('/api/extract-tile', methods=['POST'])
def extract_tile():
    """Endpoint para extraer un tile específico desde un archivo TAR.GZ"""
    try:
        data = request.json
        provincia = data.get('provincia')
        tile_filename = data.get('tile_filename')
        tar_filename = data.get('tar_filename')
        
        if not all([provincia, tile_filename, tar_filename]):
            return jsonify({"success": False, "message": "Faltan parámetros requeridos"}), 400
        
        # Construir rutas
        base_path = f"mini_tiles_github/{provincia}"
        tar_path = os.path.join(base_path, tar_filename)
        tiles_dir = os.path.join(base_path, "tiles")
        output_path = os.path.join(tiles_dir, tile_filename)
        
        # Verificar si el tile ya está extraído
        if os.path.exists(output_path):
            return jsonify({"success": True, "message": "Tile ya disponible", "path": f"/{output_path}"})
        
        # Crear directorio de tiles si no existe
        os.makedirs(tiles_dir, exist_ok=True)
        
        # Verificar que el archivo TAR.GZ existe
        if not os.path.exists(tar_path):
            return jsonify({"success": False, "message": f"Archivo TAR.GZ no encontrado: {tar_path}"}), 404
        
        # Extraer el tile específico
        tarfile_lib, traceback_lib = lazy_import_tarfile()
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
        base_path = "https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/"
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
        tarfile_lib, traceback_lib = lazy_import_tarfile()
        with tarfile_lib.open(local_tar_path, 'r:gz') as tar:
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

# API Routes
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

    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM usuarios WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and lazy_import_bcrypt().checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
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
        if cursor:
            cursor.close()
        # ✅ OPTIMIZACIÓN: Usar función optimizada para devolver conexión
        return_db_connection(conn)

@app.route('/api/crear-usuario', methods=['POST'])
def crear_usuario():
    try:
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
            
            # Verificar si el usuario ya existe
            cursor.execute("SELECT id FROM usuarios WHERE username = %s OR email = %s", (username, email))
            existing = cursor.fetchone()
            
            if existing:
                return jsonify({"success": False, "message": "El nombre de usuario o correo ya está en uso"}), 400
            
            bcrypt_lib = lazy_import_bcrypt()
            hashed_password = bcrypt_lib.hashpw(password.encode('utf-8'), bcrypt_lib.gensalt())
            
            cursor.execute(
                "INSERT INTO usuarios (username, password, email, unidad, is_online) VALUES (%s, %s, %s, %s, %s)",
                (username, hashed_password.decode('utf-8'), email, unidad, 0)
            )
            
            conn.commit()
            
            return jsonify({
                "success": True,
                "message": "Usuario creado exitosamente"
            })
            
        except Exception as e:
            conn.rollback()
            print(f"Error en la base de datos: {e}")
            return jsonify({"success": False, "message": "Error al crear usuario", "error": str(e)}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al crear usuario: {e}")
        return jsonify({"success": False, "message": "Error de servidor", "error": str(e)}), 500

# ========================
# FUNCIONES AUXILIARES CRÍTICAS
# ========================

def get_usuarios_conectados():
    """Obtiene lista de usuarios conectados activos"""
    try:
        conn = get_db_connection()
        if conn is None:
            return []
        
        cursor = conn.cursor()
        
        # ✅ CRÍTICO: Verificar tabla usuarios existe antes de consultar
        try:
            cursor.execute("""
                SELECT id, username, fecha_ultimo_acceso 
                FROM usuarios 
                WHERE is_online = %s 
                ORDER BY fecha_ultimo_acceso DESC
            """, (True,))
        except Exception as e:
            print(f"❌ Error consultando usuarios - Creando tabla: {e}")
            # Crear tabla usuarios si no existe
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usuarios (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    is_online BOOLEAN DEFAULT false,
                    fecha_ultimo_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    puntuacion INTEGER DEFAULT 0,
                    partidas_jugadas INTEGER DEFAULT 0,
                    partidas_ganadas INTEGER DEFAULT 0
                );
            """)
            conn.commit()
            print("✅ Tabla usuarios creada/verificada")
            return []  # Retorna vacío en primera ejecución
        
        usuarios = cursor.fetchall()
        print(f"📊 Usuarios conectados: {len(usuarios)}")
        
        return [dict(u) for u in usuarios]
        
    except Exception as e:
        print(f"❌ Error obteniendo usuarios conectados: {e}")
        return []
    finally:
        if conn:
            cursor.close()
            conn.close()

def get_user_sid(user_id):
    """Obtiene el SID de Socket.IO de un usuario por su ID"""
    # Buscar en usuarios_conectados (estructura de memoria)
    if hasattr(socketio, 'users_map'):
        for sid, user_data in socketio.users_map.items():
            if user_data.get('user_id') == user_id:
                return sid
    return None

def obtener_partida_por_codigo(codigo):
    """Obtiene información completa de una partida por su código"""
    try:
        conn = get_db_connection()
        if conn is None:
            return None
        
        cursor = conn.cursor()
        
        # ✅ Obtener partida principal
        cursor.execute("""
            SELECT p.*, u.username as creador_username 
            FROM partidas p 
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.\"esCreador\" = 1 
            LEFT JOIN usuarios u ON up.usuario_id = u.id 
            WHERE p.codigo = %s
        """, (codigo,))
        
        partida = cursor.fetchone()
        
        if not partida:
            return None
        
        # ✅ Obtener jugadores de la partida
        cursor.execute("""
            SELECT u.id, u.username, up.equipo, up.listo, up.\"esCreador\" 
            FROM usuarios_partida up 
            JOIN usuarios u ON up.usuario_id = u.id 
            WHERE up.partida_id = %s
        """, (partida['id'],))
        
        jugadores = cursor.fetchall()
        
        # ✅ Parsear configuración JSON de forma segura
        configuracion = {}
        if partida.get('configuracion'):
            try:
                if isinstance(partida['configuracion'], str):
                    configuracion = json.loads(partida['configuracion'])
                else:
                    configuracion = partida['configuracion']  # Ya es dict en PostgreSQL JSONB
            except json.JSONDecodeError:
                configuracion = {'nombre': 'Sin configuración'}
        
        partida_completa = {
            'id': partida['id'],
            'codigo': partida['codigo'],
            'configuracion': configuracion,
            'estado': partida['estado'],
            'fecha_creacion': partida['fecha_creacion'].isoformat() if partida['fecha_creacion'] else None,
            'creador_username': partida.get('creador_username'),
            'jugadores': [dict(j) for j in jugadores],
            'jugadores_count': len(jugadores)
        }
        
        return partida_completa
        
    except Exception as e:
        print(f"❌ Error obteniendo partida {codigo}: {e}")
        return None
    finally:
        if conn:
            cursor.close()
            conn.close()

def actualizar_estado_usuario_en_bd(user_id, online=True):
    """Actualiza el estado online/offline de un usuario en la base de datos"""
    try:
        conn = get_db_connection()
        if conn is None:
            return False
        
        cursor = conn.cursor()
        
        # ✅ ARREGLO PostgreSQL: Convertir boolean a smallint (0/1)
        is_online_value = 1 if online else 0
        cursor.execute("""
            UPDATE usuarios 
            SET is_online = %s, fecha_ultimo_acceso = CURRENT_TIMESTAMP 
            WHERE id = %s
        """, (is_online_value, user_id))
        
        conn.commit()
        
        affected_rows = cursor.rowcount
        if affected_rows > 0:
            print(f"✅ Usuario {user_id} marcado como {'ONLINE' if online else 'OFFLINE'} en PostgreSQL")
            return True
        else:
            print(f"⚠️ Usuario {user_id} no encontrado en BD")
            return False
        
    except Exception as e:
        print(f"❌ Error actualizando estado usuario {user_id}: {e}")
        return False
    finally:
        if conn:
            cursor.close()
            conn.close()

# Funciones auxiliares
def obtener_username(user_id):
    """Obtiene el username de un usuario por su ID"""
    if not user_id:
        return "Usuario desconocido"
    
    conn = get_db_connection()
    if conn is None:
        return "Usuario desconocido"
    
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM usuarios WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        return result['username'] if result else "Usuario desconocido"
    except Exception as e:
        print(f"Error obteniendo username: {e}")
        return "Usuario desconocido"
    finally:
        if cursor:
            cursor.close()
        # ✅ OPTIMIZACIÓN: Usar función optimizada para devolver conexión
        return_db_connection(conn)

def actualizar_lista_operaciones_gb():
    """Actualiza la lista de operaciones GB disponibles para todos los usuarios"""
    try:
        conn = get_db_connection()
        if conn is None:
            return
        
        cursor = conn.cursor()
        
        # ✅ DEBUG: Verificar estructura de tabla antes de hacer query
        try:
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'usuarios_partida' 
                ORDER BY ordinal_position
            """)
            columnas = cursor.fetchall()
            print(f"🔍 Columnas en usuarios_partida: {[col['column_name'] for col in columnas]}")
        except Exception as debug_e:
            print(f"⚠️ No se pudo verificar estructura: {debug_e}")
        
        cursor.execute("""
            SELECT p.*, u.username as creador_username 
            FROM partidas p 
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.\"esCreador\" = 1 
            LEFT JOIN usuarios u ON up.usuario_id = u.id 
            WHERE p.configuracion::text LIKE '%"tipo":"gestion_batalla"%' 
            AND p.estado IN ('preparacion', 'en_curso')
            ORDER BY p.fecha_creacion DESC
        """)
        
        operaciones_db = cursor.fetchall()
        operaciones_disponibles = []
        
        for operacion in operaciones_db:
            # Obtener participantes de la operación
            cursor.execute("""
                SELECT u.id, u.username, up.equipo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (operacion['id'],))
            
            participantes = cursor.fetchall()
            configuracion = json.loads(operacion['configuracion']) if operacion['configuracion'] else {}
            
            operacion_info = {
                'id': operacion['id'],
                'codigo': operacion['codigo'],
                'nombre': configuracion.get('nombre', 'Operación Sin Nombre'),
                'descripcion': configuracion.get('descripcion', ''),
                'creador': configuracion.get('creador', 'Desconocido'),
                'estado': operacion['estado'],
                'fecha_creacion': operacion['fecha_creacion'].isoformat() if operacion['fecha_creacion'] else None,
                'participantes': len(participantes),
                'elementos': [{'usuario': p['username'], 'equipo': p['equipo']} for p in participantes]
            }
            operaciones_disponibles.append(operacion_info)
        
        # Emitir a todos los usuarios conectados
        print(f"📡 Emitiendo lista de {len(operaciones_disponibles)} operaciones GB")
        socketio.emit('operacionesGB', {'operaciones': operaciones_disponibles})
        
    except Exception as e:
        print(f"❌ Error actualizando lista de operaciones GB: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

def actualizar_lista_partidas():
    """Actualiza la lista de partidas disponibles para todos los usuarios"""
    try:
        conn = get_db_connection()
        if conn is None:
            print("❌ No se pudo conectar a PostgreSQL para actualizar partidas")
            return
        
        cursor = conn.cursor()
        
        # ✅ ARREGLO PostgreSQL: Verificar que tabla partidas existe
        try:
            cursor.execute("""
                SELECT p.*, u.username as creador_username 
                FROM partidas p 
                LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.\"esCreador\" = 1 
                LEFT JOIN usuarios u ON up.usuario_id = u.id 
                WHERE p.estado IN ('esperando', 'en_curso')
                ORDER BY p.fecha_creacion DESC
            """)
        except Exception as e:
            print(f"❌ Error consultando partidas - Creando tabla: {e}")
            # Crear tabla partidas si no existe
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS partidas (
                    id SERIAL PRIMARY KEY,
                    codigo VARCHAR(20) UNIQUE NOT NULL,
                    configuracion JSONB DEFAULT '{}',
                    estado VARCHAR(20) DEFAULT 'esperando',
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    jugadores_actuales INTEGER DEFAULT 0
                );
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS usuarios_partida (
                    id SERIAL PRIMARY KEY,
                    partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
                    usuario_id INTEGER NOT NULL,
                    equipo VARCHAR(20) DEFAULT 'sin_equipo',
                    listo BOOLEAN DEFAULT false,
                    \"esCreador\" BOOLEAN DEFAULT false,
                    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(partida_id, usuario_id)
                );
            """)
            conn.commit()
            print("✅ Tablas de partidas creadas/verificadas")
            
            # Intentar la consulta nuevamente
            cursor.execute("""
                SELECT p.*, u.username as creador_username 
                FROM partidas p 
                LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.\"esCreador\" = 1 
                LEFT JOIN usuarios u ON up.usuario_id = u.id 
                WHERE p.estado IN ('esperando', 'en_curso')
                ORDER BY p.fecha_creacion DESC
            """)
        
        partidas_db = cursor.fetchall()
        partidas_disponibles = []
        
        print(f"📊 Encontradas {len(partidas_db)} partidas en PostgreSQL")
        
        for partida in partidas_db:
            # Obtener jugadores de la partida
            try:
                cursor.execute("""
                    SELECT u.id, u.username, up.equipo, up.listo 
                    FROM usuarios_partida up 
                    JOIN usuarios u ON up.usuario_id = u.id 
                    WHERE up.partida_id = %s
                """, (partida['id'],))
                
                jugadores = cursor.fetchall()
                
                # Parsear configuracion JSON de forma segura
                configuracion = {}
                if partida.get('configuracion'):
                    try:
                        if isinstance(partida['configuracion'], str):
                            configuracion = json.loads(partida['configuracion'])
                        else:
                            configuracion = partida['configuracion']  # Ya es dict en PostgreSQL JSONB
                    except json.JSONDecodeError:
                        configuracion = {'nombre': 'Configuración corrupta'}
                
                partida_info = {
                    'id': partida['id'],
                    'codigo': partida['codigo'],
                    'configuracion': configuracion,
                    'estado': partida['estado'],
                    'fecha_creacion': partida['fecha_creacion'].isoformat() if partida['fecha_creacion'] else None,
                    'creador_username': partida.get('creador_username'),
                    'jugadores': [dict(j) for j in jugadores],
                    'jugadores_count': len(jugadores)
                }
                partidas_disponibles.append(partida_info)
                
            except Exception as e:
                print(f"❌ Error procesando partida {partida.get('codigo', 'unknown')}: {e}")
        
        # Emitir a todos los usuarios conectados
        print(f"📡 Emitiendo {len(partidas_disponibles)} partidas a usuarios conectados")
        socketio.emit('partidasDisponibles', {'partidas': partidas_disponibles})
        
        # ✅ CRÍTICO: También emitir evento que frontend puede estar esperando
        socketio.emit('listaPartidasActualizada', room='general')
        
    except Exception as e:
        print(f"❌ Error crítico actualizando lista de partidas: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            cursor.close()
            conn.close()

# SocketIO Events
@socketio.on('connect')
def handle_connect():
    print(f"Cliente conectado: {request.sid}")
    
    # ✅ CRÍTICO: Auto-unir a sala general
    join_room('general')
    print(f"✅ Cliente {request.sid} añadido a sala general")
    
    emit('conectado', {'mensaje': 'Conectado al servidor'})
    
    # Enviar información inicial del servidor
    emit('servidorInfo', {
        'version': '2.0',
        'timestamp': datetime.now().isoformat(),
        'sala_default': 'general',
        'requiere_login': True,
        'sid': request.sid
    })
    
    # ✅ NUEVO: Enviar estado de autenticación
    user_id = user_sid_map.get(request.sid)
    if user_id:
        username = obtener_username(user_id)
        emit('estadoAutenticacion', {
            'autenticado': True,
            'user_id': user_id,
            'username': username
        })
        print(f"✅ Usuario ya autenticado: {username} (ID: {user_id})")
    else:
        emit('estadoAutenticacion', {
            'autenticado': False,
            'mensaje': 'Necesitas hacer login'
        })
        print(f"⚠️ Usuario no autenticado: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Cliente desconectado: {request.sid}")
    
    # Limpiar datos del usuario
    user_id = user_sid_map.get(request.sid)
    if user_id:
        # ✅ ARREGLO PostgreSQL: Usar sintaxis correcta
        actualizar_estado_usuario_en_bd(user_id, online=False)
        
        # Limpiar mapas
        if user_id in user_id_sid_map:
            del user_id_sid_map[user_id]
        del user_sid_map[request.sid]
        
        # Limpiar de usuarios conectados
        if user_id in usuarios_conectados:
            del usuarios_conectados[user_id]

# ============================================
# 🔧 EVENTOS SOCKET.IO CRÍTICOS FALTANTES
# ============================================

@socketio.on('mensaje')
def handle_mensaje(data):
    """Maneja envío de mensajes de chat"""
    try:
        print(f"💬 MENSAJE - SID: {request.sid}")
        print(f"💬 MENSAJE - Datos: {data}")
        
        # Obtener información del usuario
        user_id = user_sid_map.get(request.sid)
        print(f"🔍 DEBUG - SID: {request.sid}")
        print(f"🔍 DEBUG - user_sid_map: {user_sid_map}")
        print(f"🔍 DEBUG - user_id encontrado: {user_id}")
        
        if not user_id:
            print(f"❌ Usuario no identificado para SID: {request.sid}")
            print(f"❌ Mapas disponibles: user_sid_map={len(user_sid_map)}, user_id_sid_map={len(user_id_sid_map)}")
            emit('error', {'mensaje': 'Usuario no autenticado - Realiza login primero'})
            return
        
        # Obtener username del usuario
        username = obtener_username(user_id)
        
        # Estructura del mensaje
        mensaje_completo = {
            'id': data.get('id', f"msg_{int(time.time()*1000)}"),
            'contenido': data.get('contenido', ''),
            'mensaje': data.get('mensaje', data.get('contenido', '')),
            'emisor': username,
            'emisor_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'tipo': data.get('tipo', 'chat'),
            'sala': data.get('sala', 'general')
        }
        
        print(f"✅ Mensaje procesado: {mensaje_completo}")
        
        # Emitir a todos los usuarios en la sala
        socketio.emit('mensajeRecibido', mensaje_completo, room=data.get('sala', 'general'))
        
        # Confirmar al emisor
        emit('mensajeConfirmado', {
            'id': mensaje_completo['id'],
            'timestamp': mensaje_completo['timestamp']
        })
        
    except Exception as e:
        print(f"❌ Error procesando mensaje: {e}")
        emit('error', {'mensaje': 'Error enviando mensaje'})

@socketio.on('unirseASala')
def handle_unirse_sala(data):
    """Maneja unión a salas de chat"""
    try:
        sala = data.get('sala', 'general')
        join_room(sala)
        
        user_id = user_sid_map.get(request.sid)
        username = obtener_username(user_id) if user_id else 'Usuario desconocido'
        
        print(f"👥 Usuario {username} se unió a sala: {sala}")
        
        # Notificar a la sala
        emit('usuarioUnido', {
            'usuario': username,
            'sala': sala,
            'timestamp': datetime.now().isoformat()
        }, room=sala)
        
    except Exception as e:
        print(f"❌ Error uniéndose a sala: {e}")
        emit('error', {'mensaje': 'Error uniéndose a sala'})

@socketio.on('salirDeSala')
def handle_salir_sala(data):
    """Maneja salida de salas de chat"""
    try:
        sala = data.get('sala', 'general')
        leave_room(sala)
        
        user_id = user_sid_map.get(request.sid)
        username = obtener_username(user_id) if user_id else 'Usuario desconocido'
        
        print(f"👋 Usuario {username} salió de sala: {sala}")
        
        # Notificar a la sala
        emit('usuarioSalio', {
            'usuario': username,
            'sala': sala,
            'timestamp': datetime.now().isoformat()
        }, room=sala)
        
    except Exception as e:
        print(f"❌ Error saliendo de sala: {e}")
        emit('error', {'mensaje': 'Error saliendo de sala'})

@socketio.on('solicitar_amigos')
def handle_solicitar_amigos():
    """Maneja solicitud de lista de amigos"""
    try:
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        # Por ahora devolver lista vacía (implementar sistema de amigos después)
        emit('listaAmigos', {
            'amigos': [],
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"📋 Lista de amigos enviada a usuario {user_id}")
        
    except Exception as e:
        print(f"❌ Error obteniendo amigos: {e}")
        emit('error', {'mensaje': 'Error obteniendo lista de amigos'})

@socketio.on('obtenerListaAmigos')
def handle_obtener_lista_amigos():
    """Maneja solicitud de lista de amigos (evento faltante)"""
    try:
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        # Por ahora devolver lista vacía (implementar sistema de amigos después)
        emit('listaAmigos', {
            'amigos': [],
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"📋 Lista de amigos enviada a usuario {user_id}")
        
    except Exception as e:
        print(f"❌ Error obteniendo amigos: {e}")
        emit('error', {'mensaje': 'Error obteniendo lista de amigos'})

@socketio.on('mensajeChat')
def handle_mensaje_chat(data):
    """Maneja mensajes de chat (evento faltante - alias de mensaje)"""
    try:
        print(f"💬 MENSAJE CHAT - SID: {request.sid}")
        print(f"💬 MENSAJE CHAT - Datos: {data}")
        
        # Redirigir al handler principal de mensaje
        return handle_mensaje(data)
        
    except Exception as e:
        print(f"❌ Error procesando mensaje chat: {e}")
        emit('error', {'mensaje': 'Error enviando mensaje'})

@socketio.on('crearSalaGB')
def handle_crear_sala_gb(data):
    """Maneja creación de salas de Gestión de Batalla"""
    try:
        print(f"🎮 CREAR SALA GB - Datos: {data}")
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        username = obtener_username(user_id)
        
        # Validar datos requeridos
        nombre = data.get('nombre')
        if not nombre:
            emit('error', {'mensaje': 'Nombre de sala requerido'})
            return
        
        # Generar código único para la sala
        codigo_sala = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        # Crear registro en base de datos
        conn = get_db_connection()
        if conn is None:
            emit('error', {'mensaje': 'Error de conexión a base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Crear tabla salas_gb si no existe
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS salas_gb (
                    id SERIAL PRIMARY KEY,
                    codigo VARCHAR(20) UNIQUE NOT NULL,
                    nombre VARCHAR(255) NOT NULL,
                    descripcion TEXT,
                    creador_id INTEGER NOT NULL,
                    estado VARCHAR(20) DEFAULT 'activa',
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    configuracion JSONB DEFAULT '{}'
                );
            """)
            
            # Insertar nueva sala
            cursor.execute("""
                INSERT INTO salas_gb (codigo, nombre, descripcion, creador_id, configuracion)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                codigo_sala,
                nombre,
                data.get('descripcion', ''),
                user_id,
                json.dumps(data)
            ))
            
            sala_id = cursor.fetchone()['id']
            conn.commit()
            
            print(f"✅ Sala GB creada: {codigo_sala} por {username}")
            
            # Responder al cliente
            emit('salaGBCreada', {
                'id': sala_id,
                'codigo': codigo_sala,
                'nombre': nombre,
                'descripcion': data.get('descripcion', ''),
                'creador': username,
                'estado': 'activa',
                'timestamp': datetime.now().isoformat()
            })
            
            # Notificar a otros usuarios (opcional)
            socketio.emit('nuevaSalaGB', {
                'codigo': codigo_sala,
                'nombre': nombre,
                'creador': username
            }, room='general')
            
        finally:
            cursor.close()
            conn.close()
        
    except Exception as e:
        print(f"❌ Error creando sala GB: {e}")
        import traceback
        traceback.print_exc()
        emit('error', {'mensaje': 'Error creando sala de Gestión de Batalla'})

@socketio.on('listarSalasGB')
def handle_listar_salas_gb():
    """Lista salas de Gestión de Batalla disponibles"""
    try:
        conn = get_db_connection()
        if conn is None:
            emit('error', {'mensaje': 'Error de conexión a base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Obtener salas activas
            cursor.execute("""
                SELECT s.*, u.username as creador_username
                FROM salas_gb s
                LEFT JOIN usuarios u ON s.creador_id = u.id
                WHERE s.estado = 'activa'
                ORDER BY s.fecha_creacion DESC
            """)
            
            salas = cursor.fetchall()
            
            salas_info = []
            for sala in salas:
                salas_info.append({
                    'id': sala['id'],
                    'codigo': sala['codigo'],
                    'nombre': sala['nombre'],
                    'descripcion': sala['descripcion'],
                    'creador': sala['creador_username'],
                    'fecha_creacion': sala['fecha_creacion'].isoformat() if sala['fecha_creacion'] else None
                })
            
            emit('salasGBDisponibles', {
                'salas': salas_info,
                'total': len(salas_info)
            })
            
            print(f"📋 Enviadas {len(salas_info)} salas GB")
            
        finally:
            cursor.close()
            conn.close()
        
    except Exception as e:
        print(f"❌ Error listando salas GB: {e}")
        emit('error', {'mensaje': 'Error obteniendo salas GB'})

@socketio.on('login')
def handle_login(data):
    try:
        user_id = data.get('user_id')
        username = data.get('username')
        
        if not user_id or not username:
            emit('loginError', {'mensaje': 'Datos de login incompletos'})
            return
        
        # Registrar usuario en mapas de seguimiento
        user_sid_map[request.sid] = user_id
        user_id_sid_map[user_id] = request.sid
        usuarios_conectados[user_id] = {
            'username': username,
            'sid': request.sid,
            'fecha_conexion': datetime.now()
        }
        
        print(f"🔐 LOGIN - Usuario registrado: {username} (ID: {user_id}, SID: {request.sid})")
        print(f"🔐 LOGIN - user_sid_map actualizado: {user_sid_map}")
        
        # Marcar usuario como online en la base de datos (PostgreSQL compatible)
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                # ✅ ARREGLO PostgreSQL: Usar %s en lugar de ? para parámetros
                cursor.execute("UPDATE usuarios SET is_online = %s WHERE id = %s", (1, user_id))
                conn.commit()
                print(f"✅ Usuario {username} marcado como ONLINE en PostgreSQL")
            except Exception as e:
                print(f"❌ Error actualizando estado online: {e}")
                # Intentar crear tabla usuarios si no existe
                try:
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS usuarios (
                            id SERIAL PRIMARY KEY,
                            username VARCHAR(50) UNIQUE NOT NULL,
                            password VARCHAR(255) NOT NULL,
                            email VARCHAR(100) UNIQUE NOT NULL,
                            unidad VARCHAR(100),
                            is_online INTEGER DEFAULT 0,
                            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                    conn.commit()
                    print("✅ Tabla usuarios creada/verificada")
                    
                    # Intentar nuevamente el update
                    cursor.execute("UPDATE usuarios SET is_online = %s WHERE id = %s", (1, user_id))
                    conn.commit()
                    print(f"✅ Usuario {username} marcado como ONLINE (segundo intento)")
                except Exception as e2:
                    print(f"❌ Error crítico con tabla usuarios: {e2}")
            finally:
                cursor.close()
                conn.close()
        
        print(f"Usuario {username} (ID: {user_id}) ha hecho login")
        
        # ✅ NUEVO: Unir automáticamente al lobby general
        join_room('general', sid=request.sid)
        print(f"🏠 Usuario {username} unido a sala general")
        
        emit('loginExitoso', {
            'user_id': user_id,
            'username': username,
            'mensaje': 'Login exitoso via SocketIO'
        })
        
        # Enviar lista de partidas disponibles
        actualizar_lista_partidas()
        
    except Exception as e:
        print(f"Error en login SocketIO: {e}")
        emit('loginError', {'mensaje': 'Error interno del servidor'})

@socketio.on('crearPartida')
def crear_partida(data):
    print(f"🎮 CREAR PARTIDA - Datos recibidos: {data}")
    print(f"🎮 CREAR PARTIDA - SID: {request.sid}")
    print(f"🎮 CREAR PARTIDA - User ID: {user_sid_map.get(request.sid)}")
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
            cursor = conn.cursor()
            print("Insertando datos en la tabla partidas")
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s) RETURNING id
            """, (codigo_partida, configuracion_json, estado, fecha_creacion))
            
            partida_id = cursor.fetchone()['id']

            print("Insertando creador como primer jugador")
            creador_id = user_sid_map.get(request.sid)
            if creador_id is None:
                print("Error: No se encontró el ID del creador")
                emit('errorCrearPartida', {'mensaje': 'Error al obtener el ID del creador'})
                return

            # Insertar al creador en la tabla `usuarios_partida` con `esCreador` = true
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, \"esCreador\")
                VALUES (%s, %s, 'sin_equipo', false, true)
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
            print(f"🏠 Usuario {creador_id} unido a sala: {codigo_partida}")
            
            # ✅ NUEVO: También unir a sala de chat de la partida
            join_room(f"chat_{codigo_partida}", sid=request.sid)
            print(f"💬 Usuario {creador_id} unido a chat: chat_{codigo_partida}")
            
            print(f"📤 Emitiendo evento 'partidaCreada' con datos: {partida}")
            emit('partidaCreada', partida)
            
            print(f"📋 Actualizando lista de partidas globales...")
            actualizar_lista_partidas()
            
            # ✅ CRÍTICO: Emitir evento que el frontend espera (igual que serverhttps.py)
            socketio.emit('listaPartidasActualizada', room='general')
            
            print(f"✅ Partida creada exitosamente: {codigo_partida}")
            print(f"🎯 Usuario debería recibir evento 'partidaCreada' ahora")

        except Exception as e:
            conn.rollback()
            print(f"Error en la base de datos al crear partida: {e}")
            emit('errorCrearPartida', {'mensaje': f'Error en la base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Error general al crear partida: {e}")
        emit('errorCrearPartida', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('obtenerPartidasDisponibles')
def obtener_partidas_disponibles():
    """Envía la lista de partidas disponibles al cliente específico"""
    try:
        print(f"📋 Cliente {request.sid} solicitó lista de partidas disponibles")
        print(f"🔍 user_sid_map completo: {user_sid_map}")
        print(f"🔍 usuarios_conectados: {list(usuarios_conectados.keys())}")
        
        # Verificar si el usuario está autenticado
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            print(f"❌ Usuario {request.sid} no está autenticado en user_sid_map")
            print(f"❌ SIDs disponibles en user_sid_map: {list(user_sid_map.keys())}")
            emit('errorObtenerPartidas', {'mensaje': 'Usuario no autenticado'})
            return
        
        print(f"✅ Usuario autenticado: {user_id}")
        
        # Obtener partidas directamente para este cliente
        conn = get_db_connection()
        if conn is None:
            emit('errorObtenerPartidas', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.*, u.username as creador_username 
            FROM partidas p 
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.\"esCreador\" = 1 
            LEFT JOIN usuarios u ON up.usuario_id = u.id 
            WHERE p.estado IN ('esperando', 'en_curso')
            ORDER BY p.fecha_creacion DESC
        """)
        
        partidas_db = cursor.fetchall()
        partidas_disponibles = []
        
        for partida in partidas_db:
            # Obtener jugadores de la partida
            cursor.execute("""
                SELECT u.id, u.username, up.equipo, up.listo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (partida['id'],))
            
            jugadores = cursor.fetchall()
            
            partida_info = {
                'id': partida['id'],
                'codigo': partida['codigo'],
                'configuracion': safe_json_parse(partida['configuracion']),
                'estado': partida['estado'],
                'fecha_creacion': partida['fecha_creacion'].isoformat() if partida['fecha_creacion'] else None,
                'creador_username': partida['creador_username'],
                'jugadores': [dict(j) for j in jugadores],
                'jugadores_count': len(jugadores)
            }
            partidas_disponibles.append(partida_info)
        
        # Emitir solo al cliente que lo solicita (como en serverhttps.py)
        print(f"📡 Emitiendo lista de {len(partidas_disponibles)} partidas al cliente {request.sid}")
        emit('listaPartidas', partidas_disponibles, room=request.sid)
        print("✅ Lista de partidas enviada al cliente")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error obteniendo partidas disponibles: {e}")
        import traceback
        traceback.print_exc()
        emit('errorObtenerPartidas', {'mensaje': 'Error al obtener partidas'})

@socketio.on('unirseAPartida')
def unirse_a_partida(data):
    try:
        codigo_partida = data.get('codigo')
        if not codigo_partida:
            emit('errorUnirse', {'mensaje': 'Código de partida requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('errorUnirse', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('errorUnirse', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que la partida existe y está en estado esperando
            cursor.execute("SELECT * FROM partidas WHERE codigo = %s", (codigo_partida,))
            partida = cursor.fetchone()
            
            if not partida:
                emit('errorUnirse', {'mensaje': 'Partida no encontrada'})
                return
            
            if partida['estado'] != 'esperando':
                emit('errorUnirse', {'mensaje': 'La partida ya no está disponible'})
                return
            
            # Verificar que el usuario no esté ya en la partida
            cursor.execute("""
                SELECT * FROM usuarios_partida 
                WHERE partida_id = %s AND usuario_id = %s
            """, (partida['id'], user_id))
            
            if cursor.fetchone():
                emit('errorUnirse', {'mensaje': 'Ya estás en esta partida'})
                return
            
            # Verificar límite de jugadores
            configuracion = json.loads(partida['configuracion'])
            max_jugadores = configuracion.get('maxJugadores', 8)
            
            cursor.execute("""
                SELECT COUNT(*) as count FROM usuarios_partida 
                WHERE partida_id = %s
            """, (partida['id'],))
            
            jugadores_actuales = cursor.fetchone()['count']
            
            if jugadores_actuales >= max_jugadores:
                emit('errorUnirse', {'mensaje': 'La partida está llena'})
                return
            
            # Agregar usuario a la partida
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, \"esCreador\")
                VALUES (%s, %s, 'sin_equipo', false, false)
            """, (partida['id'], user_id))
            
            conn.commit()
            
            # Unir al usuario a la sala
            join_room(codigo_partida, sid=request.sid)
            
            # ✅ NUEVO: También unir a sala de chat de la partida
            join_room(f"chat_{codigo_partida}", sid=request.sid)
            print(f"💬 Usuario {user_id} unido a chat: chat_{codigo_partida}")
            
            # Obtener información actualizada de la partida
            cursor.execute("""
                SELECT u.id, u.username, up.equipo, up.listo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (partida['id'],))
            
            jugadores = cursor.fetchall()
            
            partida_info = {
                'id': partida['id'],
                'codigo': codigo_partida,
                'configuracion': configuracion,
                'estado': partida['estado'],
                'jugadores': [dict(j) for j in jugadores]
            }
            
            # Notificar a todos en la sala que un jugador se unió
            socketio.emit('jugadorSeUnio', {
                'jugador': {
                    'id': user_id,
                    'username': obtener_username(user_id),
                    'equipo': 'sin_equipo',
                    'listo': False
                },
                'partida': partida_info
            }, room=codigo_partida)
            
            # Confirmar al jugador que se unió
            emit('unidoAPartida', partida_info)
            
            # Actualizar lista global
            actualizar_lista_partidas()
            
        except Exception as e:
            conn.rollback()
            print(f"Error en base de datos al unirse a partida: {e}")
            emit('errorUnirse', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al unirse a partida: {e}")
        emit('errorUnirse', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('iniciarPartida')
def iniciar_partida(data):
    try:
        codigo_partida = data.get('codigo')
        if not codigo_partida:
            emit('errorIniciar', {'mensaje': 'Código de partida requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('errorIniciar', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('errorIniciar', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que el usuario es el creador
            cursor.execute("""
                SELECT p.* FROM partidas p
                JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.codigo = %s AND up.usuario_id = %s AND up.\"esCreador\" = 1
            """, (codigo_partida, user_id))
            
            partida = cursor.fetchone()
            
            if not partida:
                emit('errorIniciar', {'mensaje': 'Solo el creador puede iniciar la partida'})
                return
            
            if partida['estado'] != 'esperando':
                emit('errorIniciar', {'mensaje': 'La partida ya fue iniciada'})
                return
            
            # Actualizar estado de la partida
            cursor.execute("""
                UPDATE partidas SET estado = 'en_curso' WHERE id = %s
            """, (partida['id'],))
            
            conn.commit()
            
            # Notificar a todos en la sala que la partida ha iniciado
            socketio.emit('partidaIniciada', {
                'codigo': codigo_partida,
                'mensaje': 'La partida ha comenzado'
            }, room=codigo_partida)
            
            # Actualizar lista global
            actualizar_lista_partidas()
            
        except Exception as e:
            conn.rollback()
            print(f"Error en base de datos al iniciar partida: {e}")
            emit('errorIniciar', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al iniciar partida: {e}")
        emit('errorIniciar', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('mensajeChat')
def handle_mensaje_chat(data):
    try:
        mensaje = data.get('mensaje')
        sala = data.get('sala', 'general')
        user_id = user_sid_map.get(request.sid)
        
        print(f"📨 Chat recibido - Usuario: {user_id}, Sala: {sala}, Mensaje: {mensaje[:50]}...")
        
        if not user_id or not mensaje:
            print("❌ Chat rechazado - Falta user_id o mensaje")
            return
        
        username = obtener_username(user_id)
        
        mensaje_data = {
            'id': str(random.randint(1000, 9999)),
            'usuario_id': user_id,
            'username': username,
            'mensaje': mensaje,
            'timestamp': datetime.now().isoformat(),
            'sala': sala
        }
        
        # Emitir mensaje a la sala
        print(f"📤 Emitiendo 'nuevoMensajeChat' a sala '{sala}' desde {username}")
        socketio.emit('nuevoMensajeChat', mensaje_data, room=sala)
        
    except Exception as e:
        print(f"❌ Error manejando mensaje de chat: {e}")
        import traceback
        traceback.print_exc()

@socketio.on('mensajeJuego')
def handle_mensaje_juego(data):
    """Compatibilidad con mensajeJuego"""
    handle_mensaje_chat(data)

@socketio.on('cancelarPartida')
def cancelar_partida(data):
    try:
        codigo_partida = data.get('codigo')
        if not codigo_partida:
            emit('errorCancelar', {'mensaje': 'Código de partida requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('errorCancelar', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('errorCancelar', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que el usuario es el creador
            cursor.execute("""
                SELECT p.* FROM partidas p
                JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.codigo = %s AND up.usuario_id = %s AND up.\"esCreador\" = 1
            """, (codigo_partida, user_id))
            
            partida = cursor.fetchone()
            
            if not partida:
                emit('errorCancelar', {'mensaje': 'Solo el creador puede cancelar la partida'})
                return
            
            # Eliminar partida y relaciones
            cursor.execute("DELETE FROM usuarios_partida WHERE partida_id = %s", (partida['id'],))
            cursor.execute("DELETE FROM partidas WHERE id = %s", (partida['id'],))
            
            conn.commit()
            
            # Notificar a todos en la sala que la partida fue cancelada
            socketio.emit('partidaCancelada', {
                'codigo': codigo_partida,
                'mensaje': 'La partida ha sido cancelada'
            }, room=codigo_partida)
            
            # Actualizar lista global
            actualizar_lista_partidas()
            
        except Exception as e:
            conn.rollback()
            print(f"Error en base de datos al cancelar partida: {e}")
            emit('errorCancelar', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al cancelar partida: {e}")
        emit('errorCancelar', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('actualizarEstadoGB')
def actualizar_estado_gb(data):
    try:
        operacion = data.get('operacion')
        estado = data.get('estado')
        
        if operacion and estado:
            # Guardar en memoria
            if operacion not in operaciones_batalla:
                operaciones_batalla[operacion] = {}
            operaciones_batalla[operacion].update(estado)
            
            # Emitir actualización
            emit('estadoActualizadoGB', data, room=operacion)
    except Exception as e:
        print(f"Error actualizando estado GB: {e}")

# Eventos adicionales básicos para mantener funcionalidad mínima
@socketio.on('expulsarJugador')
def expulsar_jugador(data):
    emit('jugadorExpulsado', data, room=data.get('sala', 'general'))

@socketio.on('unirseAPartidaJuego')
def unirse_a_partida_juego(data):
    sala = data.get('sala')
    if sala:
        join_room(sala)
        emit('unidoAPartidaJuego', {'sala': sala})

@socketio.on('enviarInvitacion')
def enviar_invitacion(data):
    destinatario_id = data.get('destinatario_id')
    if destinatario_id and destinatario_id in user_id_sid_map:
        socketio.emit('invitacionRecibida', data, room=user_id_sid_map[destinatario_id])

@socketio.on('elementoConectado')
def elemento_conectado(data):
    emit('elementoConectado', data, broadcast=True)

@socketio.on('actualizarPosicionGB')
def actualizar_posicion_gb(data):
    sala = data.get('sala', 'general')
    emit('posicionActualizadaGB', data, room=sala)

@socketio.on('anunciarElemento')
def anunciar_elemento(data):
    sala = data.get('sala', 'general')
    emit('elementoAnunciado', data, room=sala)

@socketio.on('nuevoElemento')
def nuevo_elemento(data):
    sala = data.get('sala', 'general')
    emit('elementoCreado', data, room=sala)

@socketio.on('nuevoInforme')
def nuevo_informe(data):
    sala = data.get('sala', 'general')
    emit('informeCreado', data, room=sala)

@socketio.on('informeLeido')
def informe_leido(data):
    sala = data.get('sala', 'general')
    emit('informeLeido', data, room=sala)

@socketio.on('obtenerInformeCompleto')
def obtener_informe_completo(data):
    # Implementación básica
    emit('informeCompleto', data)

@socketio.on('actualizarJugador')
def actualizar_jugador(data):
    sala = data.get('sala', 'general')
    emit('jugadorActualizado', data, room=sala)

@socketio.on('sectorConfirmado')
def sector_confirmado(data):
    sala = data.get('sala', 'general')
    emit('sectorConfirmado', data, room=sala)

@socketio.on('estadoActual')
def estado_actual(data):
    emit('estadoActual', data)

@socketio.on('unidadDesplegada')
def unidad_desplegada(data):
    sala = data.get('sala', 'general')
    emit('unidadDesplegada', data, room=sala)

@socketio.on('crearOperacionGB')
def crear_operacion_gb(data):
    try:
        print("🎖️ Iniciando creación de operación GB con datos:", data)
        
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        creador = data.get('creador', 'Desconocido')
        
        if not nombre:
            print("Error: Nombre de operación faltante")
            emit('error', {'mensaje': 'Nombre de operación requerido'})
            return

        codigo_operacion = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        estado = 'esperando'
        fecha_creacion = datetime.now()

        conn = get_db_connection()
        if conn is None:
            print("Error: No se pudo establecer conexión con la base de datos")
            emit('error', {'mensaje': 'Error de conexión a la base de datos'})
            return

        try:
            cursor = conn.cursor()
            print("🗄️ Insertando operación GB en base de datos")
            
            # Usar la tabla partidas con un tipo específico para GB
            configuracion_gb = {
                'tipo': 'gestion_batalla',
                'nombre': nombre,
                'descripcion': descripcion,
                'area': data.get('area', ''),
                'creador': creador
            }
            
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s) RETURNING id
            """, (codigo_operacion, json.dumps(configuracion_gb), estado, fecha_creacion))
            
            operacion_id = cursor.fetchone()['id']

            creador_id = user_sid_map.get(request.sid)
            if creador_id:
                # Insertar al creador como director de operación
                cursor.execute("""
                    INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, \"esCreador\")
                    VALUES (%s, %s, 'director', false, true)
                """, (operacion_id, creador_id))
            
            conn.commit()
            print("✅ Operación GB creada exitosamente")

            operacion = {
                'id': operacion_id,
                'codigo': codigo_operacion,
                'nombre': nombre,
                'descripcion': descripcion,
                'creador': creador,
                'estado': estado,
                'fecha_creacion': fecha_creacion.isoformat(),
                'participantes': 1,
                'elementos': []
            }

            # Unir a sala específica de la operación
            join_room(f"gb_{codigo_operacion}", sid=request.sid)
            
            print(f"📤 Emitiendo 'operacionGBCreada' con datos: {operacion}")
            emit('operacionGBCreada', {'operacion': operacion})
            
            # Actualizar lista global de operaciones
            actualizar_lista_operaciones_gb()
            
            print(f"🎖️ Operación GB creada exitosamente: {codigo_operacion}")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error en la base de datos al crear operación GB: {e}")
            emit('error', {'mensaje': f'Error en la base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"❌ Error general al crear operación GB: {e}")
        emit('error', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('obtenerOperacionesGB')
def obtener_operaciones_gb(data=None):
    """Envía la lista de operaciones GB disponibles al cliente"""
    try:
        print("📋 Solicitando lista de operaciones GB")
        actualizar_lista_operaciones_gb()
    except Exception as e:
        print(f"❌ Error obteniendo operaciones GB: {e}")
        emit('error', {'mensaje': 'Error al obtener operaciones'})

@socketio.on('obtenerUsuariosConectados')
def handle_obtener_usuarios_conectados():
    """Maneja solicitud de lista de usuarios conectados"""
    try:
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        # Obtener usuarios conectados en memoria
        usuarios_en_memoria = []
        for sid, uid in user_sid_map.items():
            if uid in usuarios_conectados:
                usuario_data = usuarios_conectados[uid]
                usuarios_en_memoria.append({
                    'id': uid,
                    'username': usuario_data.get('username', 'Usuario'),
                    'sid': sid,
                    'conectado': True,
                    'fecha_conexion': usuario_data.get('fecha_conexion', '').isoformat() if usuario_data.get('fecha_conexion') else ''
                })
        
        emit('usuariosConectados', {
            'usuarios': usuarios_en_memoria,
            'total': len(usuarios_en_memoria),
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"📊 Enviando {len(usuarios_en_memoria)} usuarios conectados a usuario {user_id}")
        
    except Exception as e:
        print(f"❌ Error obteniendo usuarios conectados: {e}")
        emit('error', {'mensaje': 'Error obteniendo usuarios conectados'})

@socketio.on('unirseOperacionGB')
def unirse_operacion_gb(data):
    try:
        codigo_operacion = data.get('codigo')
        elemento_info = data.get('elemento', {})
        
        if not codigo_operacion:
            emit('error', {'mensaje': 'Código de operación requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('error', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que la operación existe
            cursor.execute("""
                SELECT * FROM partidas 
                WHERE codigo = %s AND configuracion::text LIKE '%"tipo":"gestion_batalla"%'
            """, (codigo_operacion,))
            operacion = cursor.fetchone()
            
            if not operacion:
                emit('error', {'mensaje': 'Operación no encontrada'})
                return
            
            if operacion['estado'] not in ['preparacion', 'en_curso']:
                emit('error', {'mensaje': 'La operación ya no está disponible'})
                return
            
            # Verificar que el usuario no esté ya en la operación
            cursor.execute("""
                SELECT * FROM usuarios_partida 
                WHERE partida_id = %s AND usuario_id = %s
            """, (operacion['id'], user_id))
            
            if cursor.fetchone():
                emit('error', {'mensaje': 'Ya estás en esta operación'})
                return
            
            # Agregar usuario a la operación
            equipo = elemento_info.get('designacion', 'elemento')
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, \"esCreador\")
                VALUES (%s, %s, %s, false, false)
            """, (operacion['id'], user_id, equipo))
            
            conn.commit()
            
            # Unir al usuario a la sala
            join_room(f"gb_{codigo_operacion}", sid=request.sid)
            
            # Notificar éxito
            emit('unidoOperacionGB', {
                'codigo': codigo_operacion,
                'operacion': operacion['id'],
                'elemento': elemento_info
            })
            
            # Notificar a todos en la operación
            socketio.emit('nuevoElementoOperacion', {
                'usuario': obtener_username(user_id),
                'elemento': elemento_info,
                'operacion': codigo_operacion
            }, room=f"gb_{codigo_operacion}")
            
            # Actualizar lista global
            actualizar_lista_operaciones_gb()
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error en base de datos al unirse a operación GB: {e}")
            emit('error', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Error al unirse a operación GB: {e}")
        emit('error', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('registrarOperacion')
def registrar_operacion(data):
    sala = data.get('sala', 'general')
    emit('operacionRegistrada', data, room=sala)

@socketio.on('zonaConfirmada')
def zona_confirmada(data):
    sala = data.get('sala', 'general')
    emit('zonaConfirmada', data, room=sala)

@socketio.on('cambioFase')
def cambio_fase(data):
    sala = data.get('sala', 'general')
    emit('faseActualizada', data, room=sala)

@socketio.on('inicioDespliegue')
def inicio_despliegue(data):
    sala = data.get('sala', 'general')
    emit('despliegueIniciado', data, room=sala)

@socketio.on('guardarElemento')
def guardar_elemento(data):
    emit('elementoGuardado', data)

@socketio.on('jugadorListo')
def jugador_listo(data):
    sala = data.get('sala', 'general')
    emit('jugadorListo', data, room=sala)

@socketio.on('jugadorListoDespliegue')
def jugador_listo_despliegue(data):
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        jugador_id = data.get('jugadorId') or user_sid_map.get(request.sid)
        
        if not codigo_partida or not jugador_id:
            print("❌ Datos incompletos en jugadorListoDespliegue")
            return
        
        print(f"🎯 Jugador {jugador_id} listo para despliegue en partida {codigo_partida}")
        
        # Emitir a toda la sala de la partida
        socketio.emit('jugadorListoDespliegue', {
            'jugador_id': jugador_id,
            'jugador': obtener_username(jugador_id),
            'partida_codigo': codigo_partida,
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
            'listo': True
        }, room=codigo_partida)
        
        print(f"✅ Estado de despliegue actualizado para {obtener_username(jugador_id)}")
        
    except Exception as e:
        print(f"❌ Error en jugadorListoDespliegue: {e}")
        emit('error', {'mensaje': 'Error procesando estado de despliegue'})

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

@socketio.on('finalizarDespliegue')
def finalizar_despliegue(data):
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        
        if not codigo_partida:
            print("❌ Código de partida faltante en finalizarDespliegue")
            return
        
        print(f"🎯 Finalizando despliegue en partida {codigo_partida}")
        
        # Emitir a toda la sala
        socketio.emit('despliegueCompleto', {
            'partida_codigo': codigo_partida,
            'siguiente_fase': 'combate',
            'timestamp': datetime.now().isoformat(),
            'mensaje': 'Despliegue finalizado. Iniciando combate...'
        }, room=codigo_partida)
        
        print(f"✅ Despliegue finalizado en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error finalizando despliegue: {e}")
        emit('error', {'mensaje': 'Error finalizando despliegue'})

@socketio.on('cambioTurno')
def cambio_turno(data):
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        turno_actual = data.get('turno')
        jugador_actual = data.get('jugador')
        
        if not codigo_partida:
            print("❌ Código de partida faltante en cambioTurno")
            return
        
        print(f"🔄 Cambio de turno en partida {codigo_partida} - Turno {turno_actual}")
        
        socketio.emit('turnoActualizado', {
            'partida_codigo': codigo_partida,
            'turno': turno_actual,
            'jugador_actual': jugador_actual,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        print(f"✅ Turno actualizado en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error en cambio de turno: {e}")
        emit('error', {'mensaje': 'Error en cambio de turno'})

@socketio.on('iniciarCombate')
def iniciar_combate(data):
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        
        if not codigo_partida:
            print("❌ Código de partida faltante en iniciarCombate")
            return
        
        print(f"⚔️ Iniciando combate en partida {codigo_partida}")
        
        # Emitir inicio de combate a toda la sala
        socketio.emit('combateIniciado', {
            'partida_codigo': codigo_partida,
            'fase': 'combate',
            'turno': 1,
            'timestamp': datetime.now().isoformat(),
            'mensaje': 'Combate iniciado. Comenzando turnos...'
        }, room=codigo_partida)
        
        # También emitir evento para actualizar la interfaz de turnos
        socketio.emit('iniciarTurnos', {
            'partida_codigo': codigo_partida,
            'turno_inicial': 1,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        print(f"✅ Combate iniciado en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error iniciando combate: {e}")
        emit('error', {'mensaje': 'Error iniciando combate'})

# ==============================================
# 🔧 EVENTOS SOCKET.IO ADICIONALES - MIGRADOS DE serverhttps.py
# ==============================================

@socketio.on('mensajeMultimedia')
def handle_mensaje_multimedia(data):
    """Maneja mensajes con contenido multimedia (imágenes, audio, video) - MIGRADO DE serverhttps.py"""
    try:
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
            
        # Validar datos mínimos
        if 'tipo_contenido' not in data or 'contenido' not in data:
            emit('error', {'mensaje': 'Formato de mensaje inválido'})
            return
            
        # Generar ID único para el mensaje
        mensaje_id = f"media_{time.time()}_{random.randint(1000, 9999)}"
        
        # Obtener sala/operación
        sala = data.get('sala', 'general')
        
        # Datos del usuario
        username = obtener_username(user_id)
        
        # Procesar contenido multimedia
        tipo_contenido = data['tipo_contenido']  # image, audio, video
        contenido_raw = data['contenido']  # base64
        
        mensaje_completo = {
            'id': mensaje_id,
            'usuario_id': user_id,
            'username': username,
            'tipo': 'multimedia',
            'tipo_contenido': tipo_contenido,
            'contenido': contenido_raw,
            'timestamp': datetime.now().isoformat(),
            'sala': sala
        }
        
        # Emitir a la sala correspondiente
        socketio.emit('mensajeMultimedia', mensaje_completo, room=sala)
        print(f"📱 Mensaje multimedia enviado - Usuario: {username}, Tipo: {tipo_contenido}, Sala: {sala}")
        
    except Exception as e:
        print(f"❌ Error en mensaje multimedia: {e}")
        emit('error', {'mensaje': f'Error procesando mensaje multimedia: {str(e)}'})

@socketio.on('mensajePrivado')
def handle_mensaje_privado(data):
    """Maneja mensajes privados entre usuarios - MIGRADO DE serverhttps.py"""
    try:
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
            
        destinatario_id = data.get('destinatario_id')
        mensaje = data.get('mensaje')
        
        if not destinatario_id or not mensaje:
            emit('error', {'mensaje': 'Datos de mensaje privado incompletos'})
            return
        
        # Verificar que el destinatario está conectado
        destinatario_sid = user_id_sid_map.get(destinatario_id)
        if not destinatario_sid:
            emit('error', {'mensaje': 'El destinatario no está conectado'})
            return
        
        mensaje_privado = {
            'id': f"private_{int(time.time())}_{random.randint(1000, 9999)}",
            'remitente_id': user_id,
            'remitente': obtener_username(user_id),
            'destinatario_id': destinatario_id,
            'destinatario': obtener_username(destinatario_id),
            'mensaje': mensaje,
            'timestamp': datetime.now().isoformat(),
            'tipo': 'privado'
        }
        
        # Enviar al destinatario
        socketio.emit('mensajePrivadoRecibido', mensaje_privado, room=destinatario_sid)
        
        # Confirmar al remitente
        emit('mensajePrivadoEnviado', mensaje_privado)
        
        print(f"📩 Mensaje privado enviado de {obtener_username(user_id)} a {obtener_username(destinatario_id)}")
        
    except Exception as e:
        print(f"❌ Error en mensaje privado: {e}")
        emit('error', {'mensaje': f'Error enviando mensaje privado: {str(e)}'})

@socketio.on('solicitarElementos')
def handle_solicitar_elementos(data):
    """Solicita elementos de una operación específica - MIGRADO DE serverhttps.py"""
    try:
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
            
        operacion = data.get('operacion')
        if not operacion:
            emit('error', {'mensaje': 'Operación no especificada'})
            return
        
        # En una implementación completa, aquí cargarías elementos desde la BD
        # Por ahora, devolvemos estructura básica
        elementos = operaciones_batalla.get(operacion, {}).get('elementos', [])
        
        emit('elementosOperacion', {
            'operacion': operacion,
            'elementos': elementos,
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"📋 Elementos solicitados para operación {operacion} por usuario {user_id}")
        
    except Exception as e:
        print(f"❌ Error solicitando elementos: {e}")
        emit('error', {'mensaje': 'Error al solicitar elementos'})

@socketio.on('joinRoom')
def handle_join_room(data):
    """Unirse a una sala específica - MIGRADO DE serverhttps.py"""
    try:
        # ✅ Verificar tipo de dato recibido
        if isinstance(data, str):
            # Si recibimos un string, asumimos que es el nombre de la sala
            sala = data
        elif isinstance(data, dict):
            # Si recibimos un dict, extraemos la sala
            sala = data.get('sala') or data.get('room')
        else:
            print(f"❌ Tipo de dato inesperado en joinRoom: {type(data)}, valor: {data}")
            emit('error', {'mensaje': 'Formato de datos inválido'})
            return
            
        if not sala:
            emit('error', {'mensaje': 'Sala no especificada'})
            return
        
        user_id = user_sid_map.get(request.sid)
        username = obtener_username(user_id) if user_id else 'Usuario anónimo'
        
        join_room(sala, sid=request.sid)
        
        # Notificar al usuario que se unió exitosamente
        emit('unidoASala', {
            'sala': sala,
            'usuario': username,
            'timestamp': datetime.now().isoformat()
        })
        
        # Notificar a otros en la sala (opcional)
        socketio.emit('usuarioSeUnioASala', {
            'usuario': username,
            'user_id': user_id,
            'sala': sala,
            'timestamp': datetime.now().isoformat()
        }, room=sala, include_self=False)
        
        print(f"🏠 Usuario {username} se unió a sala: {sala}")
        
    except Exception as e:
        print(f"❌ Error uniéndose a sala: {e}")
        emit('error', {'mensaje': 'Error al unirse a la sala'})

@socketio.on('salirSalaEspera')
def handle_salir_sala_espera(data):
    """Salir de sala de espera de partida - MIGRADO DE serverhttps.py"""
    try:
        codigo_partida = data.get('codigo') or data.get('partidaCodigo')
        user_id = user_sid_map.get(request.sid)
        
        if not codigo_partida or not user_id:
            emit('error', {'mensaje': 'Datos incompletos para salir de sala'})
            return
        
        # Salir de las salas relacionadas
        leave_room(codigo_partida, sid=request.sid)
        leave_room(f"chat_{codigo_partida}", sid=request.sid)
        
        # Notificar a otros en la partida
        socketio.emit('jugadorSalio', {
            'user_id': user_id,
            'username': obtener_username(user_id),
            'partida_codigo': codigo_partida,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        emit('salidaExitosa', {
            'partida_codigo': codigo_partida,
            'mensaje': 'Has salido de la partida'
        })
        
        # Actualizar lista de partidas
        actualizar_lista_partidas()
        
        print(f"🚪 Usuario {obtener_username(user_id)} salió de partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error saliendo de sala de espera: {e}")
        emit('error', {'mensaje': 'Error al salir de la sala'})

@socketio.on('reconectarAPartida')
def handle_reconectar_partida(data):
    """Reconectar a una partida existente - MIGRADO DE serverhttps.py"""
    try:
        codigo_partida = data.get('codigo')
        user_id = user_sid_map.get(request.sid)
        
        if not codigo_partida or not user_id:
            emit('error', {'mensaje': 'Datos incompletos para reconexión'})
            return
        
        # Verificar que el usuario estaba en la partida
        conn = get_db_connection()
        if not conn:
            emit('error', {'mensaje': 'Error de conexión a base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, up.equipo, up.listo 
                FROM partidas p
                JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.codigo = %s AND up.usuario_id = %s
            """, (codigo_partida, user_id))
            
            participacion = cursor.fetchone()
            
            if not participacion:
                emit('error', {'mensaje': 'No tienes acceso a esta partida'})
                return
            
            # Reincorporar a las salas
            join_room(codigo_partida, sid=request.sid)
            join_room(f"chat_{codigo_partida}", sid=request.sid)
            
            # Obtener estado actual de la partida
            cursor.execute("""
                SELECT u.id, u.username, up.equipo, up.listo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (participacion['id'],))
            
            jugadores = cursor.fetchall()
            
            partida_info = {
                'id': participacion['id'],
                'codigo': codigo_partida,
                'configuracion': safe_json_parse(participacion['configuracion']),
                'estado': participacion['estado'],
                'mi_equipo': participacion['equipo'],
                'mi_estado_listo': participacion['listo'],
                'jugadores': [dict(j) for j in jugadores]
            }
            
            emit('reconexionExitosa', partida_info)
            
            # Notificar a otros que el usuario se reconectó
            socketio.emit('jugadorReconectado', {
                'user_id': user_id,
                'username': obtener_username(user_id),
                'timestamp': datetime.now().isoformat()
            }, room=codigo_partida, include_self=False)
            
            print(f"🔄 Usuario {obtener_username(user_id)} reconectado a partida {codigo_partida}")
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Error en reconexión: {e}")
        emit('error', {'mensaje': 'Error durante la reconexión'})

@socketio.on('sectorDefinido')
def handle_sector_definido(data):
    """Maneja la definición de sector en una partida - MIGRADO DE serverhttps.py"""
    try:
        codigo_partida = data.get('partidaCodigo')
        sector_info = data.get('sector')
        
        if not codigo_partida or not sector_info:
            emit('error', {'mensaje': 'Datos de sector incompletos'})
            return
        
        # Emitir a todos en la partida
        socketio.emit('sectorDefinido', {
            'partida_codigo': codigo_partida,
            'sector': sector_info,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        print(f"🗺️ Sector definido en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error definiendo sector: {e}")
        emit('error', {'mensaje': 'Error al definir sector'})

@socketio.on('zonaDespliegueDefinida')
def handle_zona_despliegue_definida(data):
    """Maneja la definición de zona de despliegue - MIGRADO DE serverhttps.py"""
    try:
        codigo_partida = data.get('partidaCodigo')
        zona_info = data.get('zona')
        equipo = data.get('equipo')
        
        if not all([codigo_partida, zona_info, equipo]):
            emit('error', {'mensaje': 'Datos de zona de despliegue incompletos'})
            return
        
        # Emitir a todos en la partida
        socketio.emit('zonaDespliegueDefinida', {
            'partida_codigo': codigo_partida,
            'zona': zona_info,
            'equipo': equipo,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        print(f"⚔️ Zona de despliegue definida para equipo {equipo} en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error definiendo zona de despliegue: {e}")
        emit('error', {'mensaje': 'Error al definir zona de despliegue'})

@socketio.on('finTurno')
def handle_fin_turno(data):
    """Maneja el fin de turno de un jugador - MIGRADO DE serverhttps.py"""
    try:
        codigo_partida = data.get('partidaCodigo')
        jugador_id = data.get('jugadorId') or user_sid_map.get(request.sid)
        
        if not codigo_partida or not jugador_id:
            emit('error', {'mensaje': 'Datos de fin de turno incompletos'})
            return
        
        # Emitir fin de turno a toda la partida
        socketio.emit('finTurno', {
            'partida_codigo': codigo_partida,
            'jugador_id': jugador_id,
            'jugador': obtener_username(jugador_id),
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        print(f"⏱️ Fin de turno - Jugador: {obtener_username(jugador_id)}, Partida: {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error en fin de turno: {e}")
        emit('error', {'mensaje': 'Error procesando fin de turno'})

# ✅ FUNCIONALIDAD DE UPLOADS - Faltante de serverhttps.py

# ==============================================
# 🎮 ENDPOINTS HTTP CRÍTICOS - SISTEMA PARTIDAS
# ==============================================

@app.route('/api/crear_partida', methods=['POST'])
def api_crear_partida():
    """
    Endpoint HTTP para crear partida - Equivalente al socket event
    """
    try:
        print("🎮 API CREAR PARTIDA - Iniciando...")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Datos faltantes'}), 400
            
        configuracion = data.get('configuracion')
        if not configuracion:
            return jsonify({'error': 'Configuración de partida faltante'}), 400

        codigo_partida = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        estado = 'esperando'
        fecha_creacion = datetime.now()

        # Convertir la configuración a formato JSON
        configuracion_json = json.dumps(configuracion)

        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Insertar partida
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion, jugadores_actuales)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (codigo_partida, configuracion_json, estado, fecha_creacion, 0))
            
            partida_id = cursor.fetchone()['id']
            conn.commit()

            resultado = {
                'success': True,
                'partida': {
                    'id': partida_id,
                    'codigo': codigo_partida,
                    'configuracion': configuracion,
                    'estado': estado,
                    'fecha_creacion': fecha_creacion.isoformat()
                }
            }
            
            print(f"✅ Partida creada exitosamente: {codigo_partida}")
            return jsonify(resultado), 201
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"❌ Error creando partida: {e}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

@app.route('/api/partidas_disponibles', methods=['GET'])
def api_partidas_disponibles():
    """
    Obtener lista de partidas disponibles
    """
    try:
        print("📋 API PARTIDAS DISPONIBLES...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT p.id, p.codigo, p.estado, p.configuracion, p.fecha_creacion,
                       p.jugadores_actuales
                FROM partidas p
                WHERE p.estado = 'esperando'
                ORDER BY p.fecha_creacion DESC
                LIMIT 20;
            """)
            
            partidas = []
            for row in cursor.fetchall():
                # Manejar configuracion JSON que puede estar corrupta
                configuracion = {}
                if row['configuracion']:
                    try:
                        configuracion = json.loads(row['configuracion'])
                    except (json.JSONDecodeError, TypeError):
                        configuracion = {'nombre': 'Partida sin nombre', 'corrupta': True}
                
                partidas.append({
                    'id': row['id'],
                    'codigo': row['codigo'],
                    'estado': row['estado'],
                    'configuracion': configuracion,
                    'fecha_creacion': row['fecha_creacion'].isoformat() if row['fecha_creacion'] else None,
                    'jugadores_actuales': row['jugadores_actuales'] or 0
                })
            
            print(f"✅ Encontradas {len(partidas)} partidas disponibles")
            return jsonify({
                'success': True,
                'partidas': partidas,
                'total': len(partidas)
            })
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"❌ Error obteniendo partidas: {e}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

@app.route('/api/unirse_partida', methods=['POST'])
def api_unirse_partida():
    """
    Endpoint HTTP para unirse a una partida
    """
    try:
        print("🚪 API UNIRSE PARTIDA...")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Datos faltantes'}), 400
            
        codigo_partida = data.get('codigo')
        usuario_id = data.get('usuario_id')  # En producción esto vendría del token/sesión
        
        if not codigo_partida:
            return jsonify({'error': 'Código de partida faltante'}), 400
            
        if not usuario_id:
            return jsonify({'error': 'Usuario no identificado'}), 401

        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Verificar que la partida existe y está disponible
            cursor.execute("""
                SELECT id, estado FROM partidas WHERE codigo = %s
            """, (codigo_partida,))
            
            partida = cursor.fetchone()
            if not partida:
                return jsonify({'error': 'Partida no encontrada'}), 404
                
            partida_id, estado = partida
            
            if estado != 'esperando':
                return jsonify({'error': 'La partida ya no está disponible'}), 400
            
            # Verificar si el usuario ya está en la partida
            cursor.execute("""
                SELECT id FROM usuarios_partida 
                WHERE partida_id = %s AND usuario_id = %s
            """, (partida_id, usuario_id))
            
            if cursor.fetchone():
                return jsonify({'error': 'Ya estás en esta partida'}), 400
            
            # Unir al usuario a la partida
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, \"esCreador\")
                VALUES (%s, %s, 'sin_equipo', false, false)
            """, (partida_id, usuario_id))
            
            conn.commit()
            
            resultado = {
                'success': True,
                'mensaje': 'Te has unido a la partida exitosamente',
                'partida': {
                    'id': partida_id,
                    'codigo': codigo_partida,
                    'estado': estado
                }
            }
            
            print(f"✅ Usuario {usuario_id} se unió a partida {codigo_partida}")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"❌ Error uniéndose a partida: {e}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

# ==============================================
# 🔧 ENDPOINTS DE DEBUG CRÍTICOS - DIAGNÓSTICO PARTIDAS
# ==============================================

@app.route('/api/debug/db-complete')
def debug_db_complete():
    """
    DEBUG COMPLETO de base de datos - Diagnóstico exhaustivo
    """
    try:
        print("🔍 INICIANDO DEBUG COMPLETO DE BD...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL',
                'solucion': 'Verificar DATABASE_URL en variables de entorno'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # 1. Verificar conexión PostgreSQL primero
            cursor.execute("SELECT version() as version;")
            pg_version = cursor.fetchone()['version']
            
            # 2. Listar todas las tablas existentes
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tablas = [row['table_name'] for row in cursor.fetchall()]
            
            # 3. Verificar estructura de partidas específicamente (solo si existe)
            estructura_partidas = []
            if 'partidas' in tablas:
                try:
                    cursor.execute("""
                        SELECT column_name, data_type, is_nullable, column_default
                        FROM information_schema.columns 
                        WHERE table_name = 'partidas'
                        ORDER BY ordinal_position;
                    """)
                    estructura_partidas = [
                        {
                            'columna': row['column_name'],
                            'tipo': row['data_type'], 
                            'nullable': row['is_nullable'],
                            'default': row['column_default']
                        } for row in cursor.fetchall()
                    ]
                except Exception as e:
                    estructura_partidas = f"ERROR obteniendo estructura: {str(e)}"
            
            # 4. Contar registros en partidas (solo si existe)
            count_partidas = "TABLA NO EXISTE"
            if 'partidas' in tablas:
                try:
                    cursor.execute("SELECT COUNT(*) as count FROM partidas;")
                    count_partidas = cursor.fetchone()['count']
                except Exception as e:
                    count_partidas = f"ERROR contando registros: {str(e)}"
            
            # 5. Verificar partidas recientes (solo si existe)
            partidas_recientes = []
            if 'partidas' in tablas:
                try:
                    cursor.execute("""
                        SELECT codigo, estado, fecha_creacion 
                        FROM partidas 
                        ORDER BY fecha_creacion DESC 
                        LIMIT 5;
                    """)
                    partidas_recientes = [
                        {
                            'codigo': row['codigo'],
                            'estado': row['estado'],
                            'fecha': str(row['fecha_creacion'])
                        } for row in cursor.fetchall()
                    ]
                except Exception as e:
                    partidas_recientes = f"ERROR obteniendo partidas: {str(e)}"
            
            # 6. Verificar estructura de usuarios_partida (solo si existe)
            estructura_usuarios_partida = []
            if 'usuarios_partida' in tablas:
                try:
                    cursor.execute("""
                        SELECT column_name, data_type, is_nullable 
                        FROM information_schema.columns 
                        WHERE table_name = 'usuarios_partida'
                        ORDER BY ordinal_position;
                    """)
                    estructura_usuarios_partida = [
                        {
                            'columna': row['column_name'],
                            'tipo': row['data_type'], 
                            'nullable': row['is_nullable']
                        } for row in cursor.fetchall()
                    ]
                except Exception as e:
                    estructura_usuarios_partida = f"ERROR: {str(e)}"
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ DEBUG COMPLETADO',
                'postgres_version': pg_version,
                'total_tablas': len(tablas),
                'tablas_existentes': tablas,
                'analisis_partidas': {
                    'tabla_existe': 'partidas' in tablas,
                    'estructura': estructura_partidas,
                    'total_registros': count_partidas,
                    'registros_recientes': partidas_recientes
                },
                'analisis_usuarios_partida': {
                    'tabla_existe': 'usuarios_partida' in tablas,
                    'estructura': estructura_usuarios_partida
                },
                'otras_tablas': [tabla for tabla in tablas if tabla not in ['partidas', 'usuarios_partida']],
                'flask_config': {
                    'debug': app.debug,
                    'testing': app.testing,
                    'environment': os.environ.get('FLASK_ENV', 'production')
                }
            }
            
            print("✅ DEBUG COMPLETO EXITOSO")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR EN DEBUG',
            'error': str(e),
            'tipo': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error en debug completo: {e}")
        return jsonify(error_info), 500

@app.route('/api/debug/partidas-system')
def debug_partidas_system():
    """
    DEBUG ESPECÍFICO del sistema de partidas
    """
    try:
        print("🎮 DIAGNÓSTICO SISTEMA PARTIDAS...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # Verificar si tabla partidas existe y crearla si no
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'partidas'
                ) as exists;
            """)
            tabla_existe = cursor.fetchone()['exists']
            
            if not tabla_existe:
                print("⚠️ TABLA PARTIDAS NO EXISTE - CREANDO...")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS partidas (
                        id SERIAL PRIMARY KEY,
                        codigo VARCHAR(20) UNIQUE NOT NULL,
                        estado VARCHAR(20) DEFAULT 'esperando',
                        max_jugadores INTEGER DEFAULT 8,
                        jugadores_unidos INTEGER DEFAULT 0,
                        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        configuracion JSONB DEFAULT '{}',
                        datos_mapa JSONB DEFAULT '{}'
                    );
                """)
                conn.commit()
                tabla_creada = True
            else:
                tabla_creada = False
            
            # Verificar tabla usuarios_partida
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'usuarios_partida'
                ) as exists;
            """)
            tabla_usuarios_existe = cursor.fetchone()['exists']
            
            if not tabla_usuarios_existe:
                print("⚠️ TABLA USUARIOS_PARTIDA NO EXISTE - CREANDO...")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS usuarios_partida (
                        id SERIAL PRIMARY KEY,
                        partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
                        usuario_id INTEGER NOT NULL,
                        equipo VARCHAR(20) DEFAULT 'sin_equipo',
                        listo BOOLEAN DEFAULT false,
                        \"esCreador\" BOOLEAN DEFAULT false,
                        fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(partida_id, usuario_id)
                    );
                """)
                conn.commit()
                tabla_usuarios_creada = True
            else:
                tabla_usuarios_creada = False
            
            # Probar crear una partida de prueba
            codigo_test = f"TEST_{int(time.time())}"
            try:
                cursor.execute("""
                    INSERT INTO partidas (codigo, estado, max_jugadores) 
                    VALUES (%s, %s, %s) 
                    RETURNING id;
                """, (codigo_test, 'esperando', 8))
                partida_test_id = cursor.fetchone()['id']
                conn.commit()
                test_insert = "✅ INSERT EXITOSO"
                
                # Limpiar la partida de prueba
                cursor.execute("DELETE FROM partidas WHERE codigo = %s;", (codigo_test,))
                conn.commit()
                
            except Exception as e:
                test_insert = f"❌ ERROR INSERT: {str(e)}"
                partida_test_id = None
            
            # Verificar estructura final
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'partidas'
                ORDER BY ordinal_position;
            """)
            columnas = {row[0]: row[1] for row in cursor.fetchall()}
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '🎮 DIAGNÓSTICO PARTIDAS',
                'tabla_partidas': {
                    'existia_antes': tabla_existe,
                    'creada_ahora': tabla_creada,
                    'columnas': columnas,
                    'test_insert': test_insert,
                    'test_id': partida_test_id
                },
                'tabla_usuarios_partida': {
                    'existia_antes': tabla_usuarios_existe,
                    'creada_ahora': tabla_usuarios_creada
                },
                'endpoints_disponibles': [
                    '/api/crear_partida',
                    '/api/unirse_partida',
                    '/api/partidas_disponibles'
                ]
            }
            
            print("✅ DIAGNÓSTICO PARTIDAS COMPLETADO")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR DIAGNÓSTICO PARTIDAS',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error diagnóstico partidas: {e}")
        return jsonify(error_info), 500

@app.route('/api/debug/test-partida')
def debug_test_partida():
    """
    PRUEBA COMPLETA de crear partida desde cero
    """
    try:
        print("🧪 PRUEBA COMPLETA CREAR PARTIDA...")
        
        # Simular la misma lógica que usar crear_partida
        codigo = f"TEST_{random.randint(1000, 9999)}"
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # Intentar crear partida igual que el endpoint real
            cursor.execute("""
                INSERT INTO partidas (codigo, estado, jugadores_actuales) 
                VALUES (%s, %s, %s) 
                RETURNING id;
            """, (codigo, 'esperando', 0))
            
            partida_id = cursor.fetchone()['id']
            conn.commit()
            
            # Verificar que se creó correctamente
            cursor.execute("SELECT * FROM partidas WHERE codigo = %s;", (codigo,))
            partida_data = cursor.fetchone()
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ PRUEBA CREAR PARTIDA EXITOSA',
                'partida_creada': {
                    'id': partida_id,
                    'codigo': codigo,
                    'datos_completos': {
                        'id': partida_data['id'],
                        'codigo': partida_data['codigo'],
                        'estado': partida_data['estado'],
                        'jugadores_actuales': partida_data['jugadores_actuales'],
                        'fecha_creacion': str(partida_data['fecha_creacion'])
                    }
                },
                'siguiente_paso': f"Probar POST a /api/crear_partida con datos reales"
            }
            
            # Limpiar partida de prueba
            cursor.execute("DELETE FROM partidas WHERE codigo = %s;", (codigo,))
            conn.commit()
            
            print(f"✅ PRUEBA EXITOSA - Partida {codigo} creada y eliminada")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR EN PRUEBA',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error en prueba partida: {e}")
        return jsonify(error_info), 500

@app.route('/api/debug/fix-schema-partidas', methods=['POST'])
def fix_schema_partidas():
    """
    FIX CRÍTICO: Arreglar esquema tabla partidas para compatibilidad
    """
    try:
        print("🔧 INICIANDO FIX ESQUEMA TABLA PARTIDAS...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            cambios_realizados = []
            
            # 1. Verificar columnas existentes
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'partidas'
            """)
            columnas_existentes = [row['column_name'] for row in cursor.fetchall()]
            
            # 2. Agregar max_jugadores si no existe
            if 'max_jugadores' not in columnas_existentes:
                cursor.execute("""
                    ALTER TABLE partidas 
                    ADD COLUMN max_jugadores INTEGER DEFAULT 8
                """)
                cambios_realizados.append("✅ Agregada columna max_jugadores")
            else:
                cambios_realizados.append("ℹ️ Columna max_jugadores ya existe")
            
            # 3. Agregar jugadores_unidos si no existe
            if 'jugadores_unidos' not in columnas_existentes:
                cursor.execute("""
                    ALTER TABLE partidas 
                    ADD COLUMN jugadores_unidos INTEGER DEFAULT 0
                """)
                cambios_realizados.append("✅ Agregada columna jugadores_unidos")
            else:
                cambios_realizados.append("ℹ️ Columna jugadores_unidos ya existe")
            
            # 4. Actualizar jugadores_unidos basado en datos reales
            cursor.execute("""
                UPDATE partidas SET jugadores_unidos = (
                    SELECT COUNT(*) 
                    FROM usuarios_partida up 
                    WHERE up.partida_id = partidas.id
                )
            """)
            filas_actualizadas = cursor.rowcount
            cambios_realizados.append(f"✅ Actualizadas {filas_actualizadas} filas en jugadores_unidos")
            
            # 5. Establecer max_jugadores por defecto
            cursor.execute("""
                UPDATE partidas SET max_jugadores = 8 
                WHERE max_jugadores IS NULL
            """)
            filas_max = cursor.rowcount
            cambios_realizados.append(f"✅ Establecido max_jugadores en {filas_max} filas")
            
            # 6. Verificar estructura final
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'partidas'
                ORDER BY ordinal_position
            """)
            estructura_final = [
                {
                    'columna': row['column_name'],
                    'tipo': row['data_type'],
                    'nullable': row['is_nullable'],
                    'default': row['column_default']
                } for row in cursor.fetchall()
            ]
            
            conn.commit()
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ ESQUEMA REPARADO',
                'cambios_realizados': cambios_realizados,
                'estructura_final': estructura_final,
                'siguiente_paso': 'Probar endpoints de partidas'
            }
            
            print("✅ ESQUEMA TABLA PARTIDAS REPARADO")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR REPARANDO ESQUEMA',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error reparando esquema: {e}")
        return jsonify(error_info), 500

# ==============================================
# 🎮 RUTAS DE CONTROL DE GESTOS - MIGRADAS DE serverhttps.py
# ==============================================

@app.route('/gestos/iniciar', methods=['POST'])
def iniciar_gestos():
    """Control de gestos - MIGRADO DE serverhttps.py"""
    try:
        # En Render no usamos subprocess para gestos
        return jsonify({"success": True, "message": "Gestos no soportados en entorno Render"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/gestos/detener', methods=['POST'])
def detener_gestos():
    """Control de gestos - MIGRADO DE serverhttps.py"""
    try:
        return jsonify({"success": True, "message": "Gestos detenidos (no aplicable en Render)"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/gestos/estado', methods=['GET'])
def estado_gestos():
    """Estado de gestos - MIGRADO DE serverhttps.py"""
    try:
        return jsonify({"activo": False, "message": "Gestos no disponibles en entorno Render"}), 200
    except Exception as e:
        return jsonify({"activo": False, "error": str(e)}), 500

@app.route('/gestos/calibrar', methods=['POST'])
def calibrar_gestos():
    """Calibración de gestos - MIGRADO DE serverhttps.py"""
    try:
        return jsonify({"success": True, "message": "Calibración no aplicable en entorno Render"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/api/debug/fix-json-configuracion', methods=['POST'])
def fix_json_configuracion():
    """
    FIX CRÍTICO: Limpiar datos JSON corruptos en columna configuracion
    """
    try:
        print("🧹 INICIANDO LIMPIEZA JSON CONFIGURACIÓN...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # 1. Verificar registros con configuracion problemática
            cursor.execute("""
                SELECT id, codigo, configuracion 
                FROM partidas 
                WHERE configuracion IS NOT NULL 
                ORDER BY fecha_creacion DESC 
                LIMIT 20
            """)
            
            registros = cursor.fetchall()
            problemas_encontrados = []
            registros_limpiados = 0
            
            for registro in registros:
                partida_id = registro['id']
                codigo = registro['codigo']
                config = registro['configuracion']
                
                # Verificar si el JSON es válido
                try:
                    if config:
                        json.loads(config)
                    # Si llegamos aquí, el JSON es válido
                    problemas_encontrados.append(f"✅ Partida {codigo}: JSON válido")
                except (json.JSONDecodeError, TypeError):
                    # JSON inválido, establecer configuración por defecto
                    config_default = json.dumps({
                        "nombre": f"Partida {codigo}",
                        "max_jugadores": 8,
                        "tipo_juego": "estrategia",
                        "mapa": "default",
                        "duracion_turno": 60
                    })
                    
                    cursor.execute("""
                        UPDATE partidas 
                        SET configuracion = %s 
                        WHERE id = %s
                    """, (config_default, partida_id))
                    
                    registros_limpiados += 1
                    problemas_encontrados.append(f"🔧 Partida {codigo}: JSON reparado")
            
            # 2. Establecer configuración por defecto para registros NULL
            cursor.execute("""
                UPDATE partidas 
                SET configuracion = %s 
                WHERE configuracion IS NULL
            """, (json.dumps({"nombre": "Partida sin configuración", "max_jugadores": 8}),))
            
            registros_null = cursor.rowcount
            
            conn.commit()
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ JSON CONFIGURACIÓN LIMPIADO',
                'registros_analizados': len(registros),
                'registros_reparados': registros_limpiados,
                'registros_null_actualizados': registros_null,
                'detalles': problemas_encontrados,
                'siguiente_paso': 'Probar endpoints de partidas'
            }
            
            print(f"✅ JSON CONFIGURACIÓN LIMPIADO: {registros_limpiados} reparados, {registros_null} null actualizados")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR LIMPIANDO JSON',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error limpiando JSON: {e}")
        return jsonify(error_info), 500

# ==============================================
# 🔧 FUNCIONES AUXILIARES CRÍTICAS - MIGRADAS DE serverhttps.py
# ==============================================

def get_user_sid(user_id):
    """
    Obtiene el Socket ID (SID) de un usuario a partir de su ID.
    MIGRADA DE serverhttps.py
    """
    return user_id_sid_map.get(user_id)

def obtener_partida_por_codigo(codigo):
    """
    Obtiene información de partida por código desde BD
    MIGRADA DE serverhttps.py
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM partidas WHERE codigo = %s", (codigo,))
            partida = cursor.fetchone()
            cursor.close()
            conn.close()
            return partida
        except Exception as e:
            print(f"Error obteniendo partida por código: {e}")
            if conn:
                conn.close()
    return None

def update_user_status(user_id, is_online):
    """
    Actualiza estado online/offline del usuario
    MIGRADA DE serverhttps.py
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE usuarios SET is_online = %s WHERE id = %s", 
                (is_online, user_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error actualizando estado usuario: {e}")
            if conn:
                conn.close()

def limpiar_partidas_vacias():
    """
    Limpia partidas sin jugadores de la BD
    MIGRADA DE serverhttps.py
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            # Eliminar partidas sin jugadores (adaptado para PostgreSQL)
            cursor.execute("""
                DELETE FROM partidas 
                WHERE id NOT IN (
                    SELECT DISTINCT partida_id 
                    FROM usuarios_partida 
                    WHERE partida_id IS NOT NULL
                )
                AND estado = 'esperando'
                AND fecha_creacion < CURRENT_TIMESTAMP - INTERVAL '1 hour'
            """)
            eliminadas = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            print(f"🧹 Limpiadas {eliminadas} partidas vacías")
        except Exception as e:
            print(f"Error limpiando partidas vacías: {e}")
            if conn:
                conn.close()

# ==============================================
# 🎮 COMPATIBILIDAD CON NODE.JS GAMESERVER
# ==============================================

@socketio.on('manejarUnionPartida')
def handle_manejo_union_partida(data):
    """Compatibilidad con GameServer de Node.js - Unión a partida"""
    # Redirigir al evento estándar con datos compatibles
    if 'codigo' not in data and 'partidaCodigo' in data:
        data['codigo'] = data['partidaCodigo']
    unirse_a_partida(data)

@socketio.on('manejarCambioFase')
def handle_manejo_cambio_fase(data):
    """Compatibilidad con GameServer de Node.js - Cambio de fase"""
    try:
        codigo = data.get('codigo') or data.get('partidaCodigo')
        fase = data.get('fase')
        subfase = data.get('subfase')
        
        if not codigo:
            emit('error', {'mensaje': 'Código de partida requerido'})
            return
        
        # Emitir cambio de fase con formato compatible con Node.js
        socketio.emit('cambioFase', {
            'codigo': codigo,
            'partidaCodigo': codigo,
            'fase': fase,
            'subfase': subfase,
            'timestamp': datetime.now().isoformat()
        }, room=codigo)
        
        print(f"🔄 Cambio de fase Node.js compatible - Partida: {codigo}, Fase: {fase}")
        
    except Exception as e:
        print(f"❌ Error en cambio de fase compatible: {e}")
        emit('error', {'mensaje': 'Error en cambio de fase'})

@socketio.on('enviarEstadoPartida')
def handle_enviar_estado_partida(data):
    """Compatibilidad con GameServer de Node.js - Estado de partida"""
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        
        if not codigo_partida:
            emit('error', {'mensaje': 'Código de partida requerido'})
            return
        
        # Obtener estado actual de la partida
        partida_info = obtener_partida_por_codigo(codigo_partida)
        
        if partida_info:
            emit('estadoPartida', {
                'codigo': codigo_partida,
                'estado': partida_info.get('estado', 'desconocido'),
                'configuracion': json.loads(partida_info.get('configuracion', '{}')),
                'timestamp': datetime.now().isoformat()
            })
        else:
            emit('error', {'mensaje': 'Partida no encontrada'})
        
    except Exception as e:
        print(f"❌ Error enviando estado de partida: {e}")
        emit('error', {'mensaje': 'Error obteniendo estado de partida'})

# ==============================================
# � EVENTOS SOCKET.IO USUARIOS CONECTADOS
# ==============================================

@socketio.on('obtener_usuarios_conectados')
def handle_obtener_usuarios_conectados():
    """Maneja solicitud de lista de usuarios conectados"""
    try:
        usuarios_conectados = get_usuarios_conectados()
        
        emit('usuariosConectados', {
            'usuarios': usuarios_conectados,
            'total': len(usuarios_conectados),
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"📊 Enviando {len(usuarios_conectados)} usuarios conectados")
        
    except Exception as e:
        print(f"❌ Error obteniendo usuarios conectados: {e}")
        emit('error', {'mensaje': 'Error obteniendo usuarios conectados'})

@socketio.on('solicitar_lista_partidas')
def handle_solicitar_lista_partidas():
    """Maneja solicitud de actualización de lista de partidas"""
    try:
        print("📋 Cliente solicita lista de partidas")
        actualizar_lista_partidas()
        
    except Exception as e:
        print(f"❌ Error al solicitar lista de partidas: {e}")
        emit('error', {'mensaje': 'Error actualizando partidas'})

# ==============================================
# �🚀 INICIALIZACIÓN DEL SERVIDOR
# ==============================================

# ==============================================
# 🚀 INICIALIZACIÓN DEL SERVIDOR
# ==============================================

# Función de inicialización para la aplicación
def initialize_app():
    """Inicializa la aplicación Flask"""
    print("🏊‍♂️ Inicializando Connection Pool...")
    pool_initialized = initialize_db_pool()
    if pool_initialized:
        print("✅ Connection Pool activado - RENDIMIENTO OPTIMIZADO")
    else:
        print("⚠️ Connection Pool no disponible - usando conexiones directas")
    
    # Intentar conexión inicial a la base de datos
    conn = get_db_connection()
    if conn:
        print("✅ Conexión inicial a PostgreSQL exitosa")
        conn.close()
    else:
        print("❌ ADVERTENCIA: No se pudo conectar a PostgreSQL al iniciar")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print("="*50)
    print(f"🚀 INICIANDO MAIRA APP v2.0 - RENDER EDITION")
    print(f"🌐 Puerto: {port}")
    print(f"🐛 Debug: {debug}")
    print(f"🗄️ Base de datos: PostgreSQL")
    print(f"📡 SocketIO: Polling mode (Render optimized)")
    print("="*50)
    
    # Inicializar aplicación Flask
    initialize_app()
    
    # Iniciar servidor Flask + SocketIO
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=port, 
        debug=debug,
        allow_unsafe_werkzeug=True  # Para Render.com
    )
