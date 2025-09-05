# Gunicorn configuration file for Render deployment
import os
import sys
import multiprocessing

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Server socket
bind = "0.0.0.0:{}".format(os.environ.get("PORT", 8000))
backlog = 2048

# Worker processes
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)  # Max 4 workers for Render
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info").lower()

# Process naming
proc_name = "estate-manager"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Performance tuning for Render
worker_tmp_dir = "/dev/shm"  # Use shared memory for worker temp files
forwarded_allow_ips = "*"  # Allow forwarded headers from Render's load balancer

# Graceful timeout for Render
graceful_timeout = 30

# Preload app for better memory usage
preload_app = True

# Worker lifecycle
def when_ready(server):
    server.log.info("Estate Manager server is ready. Workers: %s", server.cfg.workers)

def worker_int(worker):
    worker.log.info("worker received INT or QUIT signal")

def pre_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def worker_abort(worker):
    worker.log.info("worker received SIGABRT signal")