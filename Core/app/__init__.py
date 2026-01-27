from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_session import Session
from app.routes import register_blueprints
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default_secret_key_CHANGE_THIS')
    app.config["SESSION_TYPE"] = "filesystem"
    
    CORS(app)
    JWTManager(app)
    Session(app)
    
    register_blueprints(app)
    
    return app