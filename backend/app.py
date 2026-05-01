"""
Render / gunicorn entry point.

The user-facing FastAPI application lives in ``server.py``. We re-export it
as ``app`` so the canonical Render start command works:

    gunicorn app:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT

Both ``server:app`` and ``app:app`` are valid — pick whichever you prefer
in the Render dashboard.
"""
from server import app  # noqa: F401  (re-exported for gunicorn)
