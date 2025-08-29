# Configuración de Gunicorn para Render.com
# Optimizada para Socket.IO y aplicaciones Flask pesadas
# Fix: Python 3.13 + gevent compatibility + RENDIMIENTO OPTIMIZADO

import os
import multiprocessing

# Configuración del servidor
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
workers = 1  # Solo 1 worker para evitar problemas de sesión con Socket.IO
worker_class = "sync"  # Worker estándar compatible con todas las versiones
worker_connections = 200  # ✅ Aumentado de 100 a 200

# Timeouts críticos (optimizados para rendimiento)
timeout = 180  # ✅ Reducido de 300 a 180 (3 minutos)
keepalive = 60  # ✅ Aumentado de 30 a 60 segundos
graceful_timeout = 90  # ✅ Reducido de 120 a 90 segundos

# Configuración de memoria y procesos (optimizada)
max_requests = 800  # ✅ Aumentado de 500 a 800
max_requests_jitter = 50
preload_app = True

# Logs
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" in %(D)sµs'

# Configuración específica para Socket.IO
worker_tmp_dir = "/dev/shm"  # Usar memoria compartida si está disponible

# Configuración de señales para Socket.IO
def on_starting(server):
    server.log.info("🚀 MAIRA Server starting with Socket.IO support...")

def on_reload(server):
    server.log.info("🔄 MAIRA Server reloading...")

def when_ready(server):
    server.log.info("✅ MAIRA Server ready to accept connections")

def worker_abort(worker):
    worker.log.info(f"⚠️  Worker {worker.pid} aborted - Socket.IO sessions may be lost")
