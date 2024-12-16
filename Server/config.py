# config.py
import socket

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))  # Conectar a DNS de Google
        IP = s.getsockname()[0]
        s.close()
        return IP
    except Exception as e:
        print(f"Error obteniendo IP: {e}")
        return 'localhost'

SERVER_PORT = 5000
CLIENT_PORT = 8080
SERVER_IP = get_local_ip()
SERVER_URL = f'http://{SERVER_IP}:{SERVER_PORT}'
CLIENT_URL = f'http://{SERVER_IP}:{CLIENT_PORT}'