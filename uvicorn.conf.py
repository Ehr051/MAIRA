# Configuración alternativa de Uvicorn para mejor performance con Socket.IO
# Uvicorn es más moderno y optimizado para aplicaciones asíncronas

import os

# Configuración del servidor
host = "0.0.0.0"
port = int(os.getenv('PORT', '10000'))

# Workers y concurrencia
workers = 1  # Para Socket.IO, mantener 1 worker para sesiones compartidas
worker_class = "uvicorn.workers.UvicornWorker"

# Performance optimizada para Socket.IO
loop = "uvloop"  # Event loop más rápido
http = "httptools"  # Parser HTTP más rápido

# Configuración de timeouts
timeout_keep_alive = 60
timeout_graceful_shutdown = 90

# Configuración de logs
log_level = "info"
access_log = True

# SSL/TLS (para producción)
ssl_version = 3
ssl_cert_reqs = 0

# Optimizaciones específicas para Socket.IO
backlog = 2048  # Cola de conexiones pendientes
limit_concurrency = 1000  # Límite de conexiones concurrentes
limit_max_requests = 1000  # Límite de requests por worker

# Headers y configuración HTTP
server_header = False  # No revelar versión del servidor
date_header = True
