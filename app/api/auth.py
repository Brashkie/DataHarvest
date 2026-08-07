"""DataHarvest — Auth Blueprint (JWT)"""
from flask import Blueprint, request, jsonify
import jwt, time, uuid
from loguru import logger

auth_bp = Blueprint("auth", __name__)

# Demo user for development
DEMO_USER = {"id": "user-1", "username": "admin", "password": "dataharvest2024", "role": "admin"}

def _ok(d=None, s=200): return jsonify({"success": True, "data": d}), s
def _err(m, s=401): return jsonify({"success": False, "error": m}), s

def _make_token(user_id: str, secret: str, expires: int = 3600) -> str:
    payload = {"sub": user_id, "iat": int(time.time()), "exp": int(time.time()) + expires}
    return jwt.encode(payload, secret, algorithm="HS256")


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")

    if username == DEMO_USER["username"] and password == DEMO_USER["password"]:
        from flask import current_app
        secret = current_app.config.get("JWT_SECRET_KEY", "dev-secret")
        token = _make_token(DEMO_USER["id"], secret)
        return _ok({
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "user": {"id": DEMO_USER["id"], "username": DEMO_USER["username"], "role": DEMO_USER["role"]},
        })

    return _err("Invalid credentials", 401)


@auth_bp.post("/logout")
def logout():
    return _ok({"message": "Logged out"})


@auth_bp.get("/me")
def me():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return _err("Missing token", 401)
    try:
        from flask import current_app
        token = auth_header.split(" ", 1)[1]
        secret = current_app.config.get("JWT_SECRET_KEY", "dev-secret")
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return _ok({"id": payload["sub"], "username": "admin", "role": "admin"})
    except jwt.ExpiredSignatureError:
        return _err("Token expired", 401)
    except Exception:
        return _err("Invalid token", 401)