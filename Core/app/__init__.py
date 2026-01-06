from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.routes import register_blueprints
import os

def create_app():
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default_secret_key')  # Change this!
     
    CORS(app)
    JWTManager(app)
    
    register_blueprints(app)
    
    return app