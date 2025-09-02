# MAIRA 4.0 - Backend Server
# Sistema de entrenamiento militar con Flask y PostgreSQL

from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import json
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app)

# Configuración de base de datos
DB_CONFIG = {
    'host': 'localhost',
    'database': 'maira_4_0',
    'user': 'maira_user',
    'password': 'maira_pass'
}

class MairaDatabase:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        try:
            self.connection = psycopg2.connect(**DB_CONFIG)
            print("✅ Conexión con PostgreSQL establecida")
        except Exception as e:
            print(f"❌ Error conectando a BD: {e}")
    
    def execute_query(self, query, params=None):
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            return cursor.fetchall()
        except Exception as e:
            print(f"❌ Error ejecutando query: {e}")
            return None
    
    def get_unit_composition(self, unit_type):
        """Obtiene composición detallada de una unidad militar"""
        query = """
        SELECT u.*, 
               json_agg(
                   json_build_object(
                       'subnivel', s.nombre,
                       'cantidad', s.cantidad,
                       'caracteristicas', s.caracteristicas
                   )
               ) as composicion
        FROM unidades u
        LEFT JOIN subniveles s ON u.id = s.unidad_id
        WHERE u.tipo = %s
        GROUP BY u.id
        """
        return self.execute_query(query, (unit_type,))
    
    def get_movement_speeds(self):
        """Obtiene velocidades de movimiento por tipo de unidad"""
        query = """
        SELECT tipo_unidad, 
               velocidad_carretera,
               velocidad_campo_traviesa,
               velocidad_terreno_dificil,
               factor_terreno
        FROM velocidades_movimiento
        """
        return self.execute_query(query)
    
    def save_game_statistics(self, game_id, stats):
        """Guarda estadísticas de la partida"""
        query = """
        INSERT INTO estadisticas_partida 
        (partida_id, ordenes_impartidas, km_recorridos, bajas_propias, 
         bajas_enemigo, detecciones_enemigos, tiempo_partida, datos_json)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            game_id,
            stats.get('ordenesImpartidas', 0),
            stats.get('kmRecorridos', 0),
            stats.get('bajasPropias', 0),
            stats.get('bajasEnemigo', 0),
            stats.get('deteccionesEnemigos', 0),
            stats.get('tiempoPartida', 0),
            json.dumps(stats)
        )
        return self.execute_query(query, params)

# Instancia global de la base de datos
db = MairaDatabase()

def require_role(required_role):
    """Decorador para verificar roles de usuario"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_role = request.headers.get('X-User-Role', '')
            if user_role != required_role and required_role not in ['director', 'creador']:
                return jsonify({'error': 'Rol insuficiente'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificación de estado del servidor"""
    return jsonify({
        'status': 'operational',
        'version': '4.0.0',
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/api/director/sector', methods=['POST'])
@require_role('director')
def configure_work_sector():
    """Configura el sector de trabajo (solo director)"""
    data = request.json
    
    # Validar coordenadas
    if not all(key in data for key in ['north', 'south', 'east', 'west']):
        return jsonify({'error': 'Coordenadas incompletas'}), 400
    
    # Guardar sector en BD
    query = """
    INSERT INTO sectores_trabajo (partida_id, bounds, configurado_por, timestamp)
    VALUES (%s, %s, %s, %s)
    """
    
    result = db.execute_query(query, (
        data.get('partida_id'),
        json.dumps(data['bounds']),
        request.headers.get('X-User-ID'),
        datetime.datetime.now()
    ))
    
    if result is not None:
        return jsonify({'success': True, 'sector': data['bounds']})
    else:
        return jsonify({'error': 'Error configurando sector'}), 500

@app.route('/api/director/deployment-zones', methods=['POST'])
@require_role('director')
def configure_deployment_zones():
    """Configura zonas de despliegue para azules y rojos"""
    data = request.json
    
    if not all(key in data for key in ['zona_azul', 'zona_roja']):
        return jsonify({'error': 'Zonas incompletas'}), 400
    
    query = """
    INSERT INTO zonas_despliegue (partida_id, zona_azul, zona_roja, configurado_por)
    VALUES (%s, %s, %s, %s)
    """
    
    result = db.execute_query(query, (
        data.get('partida_id'),
        json.dumps(data['zona_azul']),
        json.dumps(data['zona_roja']),
        request.headers.get('X-User-ID')
    ))
    
    return jsonify({'success': True})

@app.route('/api/units/composition/<unit_type>', methods=['GET'])
def get_unit_composition(unit_type):
    """Obtiene composición detallada de una unidad"""
    composition = db.get_unit_composition(unit_type)
    
    if composition:
        return jsonify(composition[0])
    else:
        return jsonify({'error': 'Unidad no encontrada'}), 404

@app.route('/api/movement/speeds', methods=['GET'])
def get_movement_speeds():
    """Obtiene tabla de velocidades de movimiento"""
    speeds = db.get_movement_speeds()
    
    if speeds:
        return jsonify([{
            'tipo': speed[0],
            'carretera': speed[1],
            'campo_traviesa': speed[2],
            'terreno_dificil': speed[3],
            'factor_terreno': speed[4]
        } for speed in speeds])
    else:
        return jsonify([])

@app.route('/api/game/validate-deployment', methods=['POST'])
def validate_deployment():
    """Valida si un despliegue es permitido"""
    data = request.json
    
    # Obtener zona de despliegue del equipo
    query = """
    SELECT zona_azul, zona_roja FROM zonas_despliegue 
    WHERE partida_id = %s
    """
    
    zones = db.execute_query(query, (data.get('partida_id'),))
    
    if not zones:
        return jsonify({'valido': False, 'razon': 'Zonas no configuradas'})
    
    team = data.get('equipo')
    position = data.get('posicion')
    
    # Validar posición dentro de zona permitida
    zone_data = zones[0]
    allowed_zone = json.loads(zone_data[0] if team == 'azul' else zone_data[1])
    
    is_valid = (
        position['lat'] >= allowed_zone['south'] and
        position['lat'] <= allowed_zone['north'] and
        position['lng'] >= allowed_zone['west'] and
        position['lng'] <= allowed_zone['east']
    )
    
    return jsonify({
        'valido': is_valid,
        'razon': 'Válido' if is_valid else 'Fuera de zona de despliegue'
    })

@app.route('/api/game/calculate-movement', methods=['POST'])
def calculate_movement():
    """Calcula movimiento permitido basado en velocidad y terreno"""
    data = request.json
    
    unit_type = data.get('tipo_unidad')
    origin = data.get('origen')
    destination = data.get('destino')
    turn_duration = data.get('duracion_turno', 60)  # minutos
    reality_factor = data.get('factor_realidad', 1)  # 1 turno = X horas reales
    
    # Obtener velocidad de la unidad
    speeds = db.get_movement_speeds()
    unit_speed = None
    
    for speed in speeds:
        if speed[0] == unit_type:
            unit_speed = speed[2]  # campo traviesa por defecto
            break
    
    if unit_speed is None:
        unit_speed = 10  # km/h por defecto
    
    # Calcular distancia
    import math
    R = 6371  # Radio de la Tierra en km
    
    lat1, lon1 = math.radians(origin['lat']), math.radians(origin['lng'])
    lat2, lon2 = math.radians(destination['lat']), math.radians(destination['lng'])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    # Calcular movimiento máximo permitido
    time_hours = (turn_duration / 60) * reality_factor
    max_distance = unit_speed * time_hours
    
    return jsonify({
        'permitido': distance <= max_distance,
        'distancia_real': round(distance, 2),
        'distancia_maxima': round(max_distance, 2),
        'tiempo_movimiento': round((distance / unit_speed) * 60, 1),  # minutos
        'combustible_necesario': round(distance * 0.1, 2)  # factor simulado
    })

@app.route('/api/fog-of-war/visibility', methods=['POST'])
def calculate_visibility():
    """Calcula visibilidad entre elementos para niebla de guerra"""
    data = request.json
    
    observer = data.get('observador')
    target = data.get('objetivo')
    
    # Simular cálculo de visibilidad
    # En implementación real incluiría: terreno, meteorología, capacidades del observador
    
    distance = calculate_distance(observer['posicion'], target['posicion'])
    vision_range = observer.get('alcance_vision', 5000)  # metros
    
    visible = distance <= vision_range
    clarity = max(0, 1 - (distance / vision_range)) if visible else 0
    
    return jsonify({
        'visible': visible,
        'distancia': round(distance, 0),
        'claridad': round(clarity, 2),
        'razon': 'En rango' if visible else 'Fuera de rango'
    })

@app.route('/api/statistics/save', methods=['POST'])
def save_statistics():
    """Guarda estadísticas de la partida"""
    data = request.json
    
    game_id = data.get('partida_id')
    stats = data.get('estadisticas')
    
    result = db.save_game_statistics(game_id, stats)
    
    if result is not None:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Error guardando estadísticas'}), 500

@app.route('/api/statistics/report/<game_id>', methods=['GET'])
def get_statistics_report(game_id):
    """Obtiene reporte de estadísticas de una partida"""
    query = """
    SELECT * FROM estadisticas_partida WHERE partida_id = %s
    """
    
    stats = db.execute_query(query, (game_id,))
    
    if stats:
        stat = stats[0]
        return jsonify({
            'partida_id': stat[1],
            'ordenes_impartidas': stat[2],
            'km_recorridos': stat[3],
            'bajas_propias': stat[4],
            'bajas_enemigo': stat[5],
            'detecciones_enemigos': stat[6],
            'tiempo_partida': stat[7],
            'datos_completos': json.loads(stat[8]) if stat[8] else {}
        })
    else:
        return jsonify({'error': 'Estadísticas no encontradas'}), 404

def calculate_distance(pos1, pos2):
    """Calcula distancia entre dos posiciones en metros"""
    import math
    
    R = 6371000  # Radio de la Tierra en metros
    lat1, lon1 = math.radians(pos1['lat']), math.radians(pos1['lng'])
    lat2, lon2 = math.radians(pos2['lat']), math.radians(pos2['lng'])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

if __name__ == '__main__':
    print("🚀 Iniciando servidor MAIRA 4.0...")
    app.run(debug=True, host='0.0.0.0', port=5000)
