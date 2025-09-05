# Gunicorn configuration file for Render deployment

bind = "0.0.0.0:{}".format(os.environ.get("PORT", 8000))
workers = 2
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "estate-manager"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190