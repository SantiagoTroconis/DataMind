from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_session import Session
from app.routes import register_blueprints
from apscheduler.schedulers.background import BackgroundScheduler
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

_scheduler = BackgroundScheduler()


def create_app():
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default_secret_key_CHANGE_THIS')
    app.config["SESSION_TYPE"] = "filesystem"

    CORS(app)
    JWTManager(app)
    Session(app)

    register_blueprints(app)

    if not app.testing:
        import os as _os
        if _os.environ.get('WERKZEUG_RUN_MAIN', 'true') == 'true':
            from app.jobs import cleanup_expired_files
            _scheduler.add_job(
                cleanup_expired_files,
                'interval',
                hours=1,
                id='ttl_cleanup',
                replace_existing=True
            )
            if not _scheduler.running:
                _scheduler.start()

    return app