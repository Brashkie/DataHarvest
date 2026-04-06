"""
DataHarvest — Middleware: Auth, Error Handlers, Logging
"""
from __future__ import annotations
import time
import jwt
from functools import wraps
from flask import request, jsonify, current_app, g
from loguru import logger


# ── JWT Auth Decorator ────────────────────────────────────────────────────────

def require_auth(f):
    """Decorator — require valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                current_app.config.get("JWT_SECRET_KEY", "dev-secret"),
                algorithms=["HS256"],
            )
            g.user_id = payload.get("sub")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """Auth decorator — sets g.user_id if token present, doesn't reject if absent."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        g.user_id = None
        if auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ", 1)[1]
                payload = jwt.decode(
                    token,
                    current_app.config.get("JWT_SECRET_KEY", "dev-secret"),
                    algorithms=["HS256"],
                )
                g.user_id = payload.get("sub")
            except Exception:
                pass
        return f(*args, **kwargs)
    return decorated


# ── Request Logging Middleware ────────────────────────────────────────────────

def register_request_logging(app):
    @app.before_request
    def before():
        g.start_time = time.time()

    @app.after_request
    def after(response):
        duration_ms = round((time.time() - getattr(g, "start_time", time.time())) * 1000)
        if not request.path.startswith("/api/v1/health"):
            logger.debug(
                f"{request.method} {request.path} → {response.status_code} [{duration_ms}ms]"
            )
        return response


# ── Error Handlers ────────────────────────────────────────────────────────────

def register_error_handlers(app):

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "error": "Bad Request", "details": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"success": False, "error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Not Found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Method Not Allowed"}), 405

    @app.errorhandler(413)
    def payload_too_large(e):
        return jsonify({"success": False, "error": "File too large"}), 413

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({"success": False, "error": "Rate limit exceeded. Slow down."}), 429

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal Server Error: {e}")
        return jsonify({"success": False, "error": "Internal Server Error"}), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        logger.exception(f"Unhandled exception: {e}")
        return jsonify({"success": False, "error": str(e)}), 500