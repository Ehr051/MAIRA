#!/usr/bin/env python3
"""
🔍 Diagnóstico de Partidas Online - MAIRA
Script de pruebas por consola para identificar problemas en el sistema online
"""

import socketio
import json
import time
import threading
from datetime import datetime

class MAIRADebugger:
    def __init__(self, server_url='http://localhost:5000'):
        self.server_url = server_url
        self.sio = None
        self.connected = False
        self.authenticated = False
        self.user_id = 'debug_user_001'
        self.username = 'DebuggerUser'
        self.test_results = {}
        
    def log(self, message, level='INFO'):
        timestamp = datetime.now().strftime('%H:%M:%S')
        prefix = {
            'INFO': '🔍',
            'SUCCESS': '✅',
            'ERROR': '❌',
            'WARNING': '⚠️'
        }.get(level, 'ℹ️')
        print(f"[{timestamp}] {prefix} {message}")
        
    def setup_socket(self):
        """Configurar socket con eventos"""
        self.sio = socketio.Client()
        
        @self.sio.event
        def connect():
            self.log(f"Conectado al servidor - Socket ID: {self.sio.sid}", 'SUCCESS')
            self.connected = True
            
        @self.sio.event
        def disconnect():
            self.log("Desconectado del servidor", 'WARNING')
            self.connected = False
            
        @self.sio.event
        def connect_error(data):
            self.log(f"Error de conexión: {data}", 'ERROR')
            
        @self.sio.on('loginExitoso')
        def on_login_success(data):
            self.log(f"Login exitoso: {data}", 'SUCCESS')
            self.authenticated = True
            self.test_results['auth'] = True
            
        @self.sio.on('partidaCreada')
        def on_partida_creada(data):
            self.log(f"Partida creada: {data.get('codigo', 'Sin código')}", 'SUCCESS')
            self.test_results['create_game'] = data
            
        @self.sio.on('errorCrearPartida')
        def on_error_crear_partida(data):
            self.log(f"Error crear partida: {data.get('mensaje', 'Sin mensaje')}", 'ERROR')
            self.test_results['create_game_error'] = data
            
        @self.sio.on('listaPartidas')
        def on_lista_partidas(data):
            self.log(f"Lista partidas recibida: {len(data)} partidas", 'SUCCESS')
            self.test_results['list_games'] = data
            for i, partida in enumerate(data):
                self.log(f"  #{i+1}: {partida.get('nombre', 'Sin nombre')} - {partida.get('codigo', 'Sin código')}")
                
        @self.sio.on('errorObtenerPartidas')
        def on_error_obtener_partidas(data):
            self.log(f"Error obtener partidas: {data.get('mensaje', 'Sin mensaje')}", 'ERROR')
            self.test_results['list_games_error'] = data
            
        @self.sio.on('unidoAPartida')
        def on_unido_partida(data):
            self.log(f"Unido a partida: {data.get('codigo', 'Sin código')}", 'SUCCESS')
            self.test_results['join_game'] = data
            
        @self.sio.on('errorunirseAPartida')
        def on_error_unirse_partida(data):
            self.log(f"Error unirse partida: {data.get('mensaje', 'Sin mensaje')}", 'ERROR')
            self.test_results['join_game_error'] = data

    def test_connection(self):
        """Test 1: Conectar al servidor"""
        self.log("=== TEST 1: CONEXIÓN ===")
        try:
            self.sio.connect(self.server_url, transports=['polling'])
            time.sleep(2)
            if self.connected:
                self.log("Conexión exitosa", 'SUCCESS')
                return True
            else:
                self.log("Falló la conexión", 'ERROR')
                return False
        except Exception as e:
            self.log(f"Error conectando: {e}", 'ERROR')
            return False
            
    def test_authentication(self):
        """Test 2: Autenticación"""
        self.log("=== TEST 2: AUTENTICACIÓN ===")
        if not self.connected:
            self.log("Socket no conectado", 'ERROR')
            return False
            
        try:
            self.sio.emit('login', {
                'userId': self.user_id,
                'username': self.username
            })
            
            # Esperar respuesta
            time.sleep(3)
            
            if self.authenticated:
                self.log("Autenticación exitosa", 'SUCCESS')
                return True
            else:
                self.log("Autenticación falló o no respondió", 'ERROR')
                return False
                
        except Exception as e:
            self.log(f"Error en autenticación: {e}", 'ERROR')
            return False
            
    def test_get_games_list(self):
        """Test 3: Obtener lista de partidas"""
        self.log("=== TEST 3: LISTA DE PARTIDAS ===")
        if not self.authenticated:
            self.log("Usuario no autenticado", 'ERROR')
            return False
            
        try:
            self.log("Solicitando lista de partidas...")
            self.sio.emit('obtenerPartidasDisponibles')
            
            # Esperar respuesta
            time.sleep(3)
            
            if 'list_games' in self.test_results:
                self.log(f"Lista obtenida: {len(self.test_results['list_games'])} partidas", 'SUCCESS')
                return True
            elif 'list_games_error' in self.test_results:
                error = self.test_results['list_games_error']
                self.log(f"Error en lista: {error}", 'ERROR')
                return False
            else:
                self.log("No se recibió respuesta", 'ERROR')
                return False
                
        except Exception as e:
            self.log(f"Error obteniendo lista: {e}", 'ERROR')
            return False
            
    def test_create_game(self):
        """Test 4: Crear partida"""
        self.log("=== TEST 4: CREAR PARTIDA ===")
        if not self.authenticated:
            self.log("Usuario no autenticado", 'ERROR')
            return False
            
        try:
            configuracion = {
                'nombrePartida': 'Test Debug Partida',
                'duracionPartida': 60,
                'duracionTurno': 30,
                'objetivoPartida': 'Diagnóstico del sistema',
                'modo': 'online',
                'creadorId': self.user_id
            }
            
            self.log("Creando partida de prueba...")
            self.sio.emit('crearPartida', {
                'configuracion': configuracion
            })
            
            # Esperar respuesta
            time.sleep(5)
            
            if 'create_game' in self.test_results:
                partida = self.test_results['create_game']
                self.log(f"Partida creada: {partida.get('codigo', 'Sin código')}", 'SUCCESS')
                return partida
            elif 'create_game_error' in self.test_results:
                error = self.test_results['create_game_error']
                self.log(f"Error creando partida: {error}", 'ERROR')
                return False
            else:
                self.log("No se recibió respuesta", 'ERROR')
                return False
                
        except Exception as e:
            self.log(f"Error creando partida: {e}", 'ERROR')
            return False
            
    def test_join_game(self, codigo_partida):
        """Test 5: Unirse a partida"""
        self.log("=== TEST 5: UNIRSE A PARTIDA ===")
        if not self.authenticated:
            self.log("Usuario no autenticado", 'ERROR')
            return False
            
        try:
            self.log(f"Intentando unirse a partida: {codigo_partida}")
            self.sio.emit('unirseAPartida', {
                'codigo': codigo_partida
            })
            
            # Esperar respuesta
            time.sleep(3)
            
            if 'join_game' in self.test_results:
                self.log("Unión exitosa", 'SUCCESS')
                return True
            elif 'join_game_error' in self.test_results:
                error = self.test_results['join_game_error']
                self.log(f"Error uniéndose: {error}", 'ERROR')
                return False
            else:
                self.log("No se recibió respuesta", 'ERROR')
                return False
                
        except Exception as e:
            self.log(f"Error uniéndose a partida: {e}", 'ERROR')
            return False
            
    def run_full_diagnostic(self):
        """Ejecutar diagnóstico completo"""
        self.log("🚀 INICIANDO DIAGNÓSTICO COMPLETO DE PARTIDAS ONLINE")
        self.log(f"🌐 Servidor: {self.server_url}")
        self.log("=" * 60)
        
        # Setup socket
        self.setup_socket()
        
        # Test 1: Conexión
        if not self.test_connection():
            self.log("❌ DIAGNÓSTICO FALLIDO: No se pudo conectar", 'ERROR')
            return False
            
        # Test 2: Autenticación
        if not self.test_authentication():
            self.log("❌ DIAGNÓSTICO FALLIDO: Autenticación falló", 'ERROR')
            return False
            
        # Test 3: Lista de partidas
        self.test_get_games_list()
        
        # Test 4: Crear partida
        nueva_partida = self.test_create_game()
        
        # Test 5: Unirse a partida (si se creó)
        if nueva_partida and nueva_partida.get('codigo'):
            self.test_join_game(nueva_partida['codigo'])
            
        # Test 6: Lista de partidas actualizada
        self.log("=== TEST 6: LISTA ACTUALIZADA ===")
        self.test_get_games_list()
        
        # Resumen final
        self.log("=" * 60)
        self.log("📊 RESUMEN DE RESULTADOS:")
        
        results_summary = {
            'Conexión': '✅' if self.connected else '❌',
            'Autenticación': '✅' if self.authenticated else '❌',
            'Lista partidas': '✅' if 'list_games' in self.test_results else '❌',
            'Crear partida': '✅' if 'create_game' in self.test_results else '❌',
            'Unirse partida': '✅' if 'join_game' in self.test_results else '❌'
        }
        
        for test, result in results_summary.items():
            self.log(f"  {test}: {result}")
            
        # Mostrar errores específicos
        if 'list_games_error' in self.test_results:
            self.log(f"🔍 Error lista partidas: {self.test_results['list_games_error']}", 'ERROR')
        if 'create_game_error' in self.test_results:
            self.log(f"🔍 Error crear partida: {self.test_results['create_game_error']}", 'ERROR')
        if 'join_game_error' in self.test_results:
            self.log(f"🔍 Error unirse partida: {self.test_results['join_game_error']}", 'ERROR')
            
        self.log("🏁 DIAGNÓSTICO COMPLETO FINALIZADO")
        
        # Desconectar
        if self.connected:
            self.sio.disconnect()
            
        return True

def main():
    print("🔍 MAIRA Debug Tool - Diagnóstico de Partidas Online")
    print("=" * 60)
    
    # Detectar servidor
    import sys
    server_url = 'http://localhost:5000'
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
        
    print(f"🌐 Servidor objetivo: {server_url}")
    
    debugger = MAIRADebugger(server_url)
    debugger.run_full_diagnostic()

if __name__ == "__main__":
    main()
