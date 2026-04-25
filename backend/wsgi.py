"""
WSGI entry point for PythonAnywhere (or any WSGI host).

PythonAnywhere's web app config should point to this file. In the
PythonAnywhere "Web" tab, set the WSGI configuration file to import
`application` from this module.

Example minimal /var/www/<username>_pythonanywhere_com_wsgi.py contents:

    import sys, os
    project_home = '/home/<username>/pal-institute/backend'
    if project_home not in sys.path:
        sys.path.insert(0, project_home)

    # Load .env from the backend directory
    from dotenv import load_dotenv
    load_dotenv(os.path.join(project_home, '.env'))

    from wsgi import application

This file converts the FastAPI ASGI app into a WSGI application using
the a2wsgi adapter, which runs an internal asyncio loop per request.
Because all our routes are synchronous (def, not async def) and use
pymongo, this works reliably under PythonAnywhere's WSGI workers.
"""
import os
import sys
from pathlib import Path

# Ensure the backend directory is on sys.path so `import server` works
# regardless of how the WSGI host launches us.
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Load environment variables from .env if present (PythonAnywhere
# does not auto-load .env files).
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except Exception:
    pass

from a2wsgi import ASGIMiddleware  # noqa: E402
from server import app as fastapi_app  # noqa: E402

# WSGI servers (PythonAnywhere, gunicorn) look for `application`.
application = ASGIMiddleware(fastapi_app)
