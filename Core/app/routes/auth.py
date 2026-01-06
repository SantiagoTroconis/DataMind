from flask import Blueprint, request, jsonify
from app.services.auth_services import AuthService

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/login')
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    token, user, error = AuthService.login(email, password)

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "status": "success",
        "message": "Usuario logueado exitosamente",
        "token": token,
        "user": user.serialize()
    }), 200


@auth_bp.post('/register')
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    # purpose = data.get('purpose')

    user, error = AuthService.register(email, password)
    
    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "status": "success",
        "message": "Usuario registrado exitosamente",
        "user": user.serialize()
    }), 201
