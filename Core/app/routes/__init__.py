from app.routes.excel import excel_bp
from app.routes.auth import auth_bp

def register_blueprints(app):
    app.register_blueprint(excel_bp, url_prefix='/excel')
    app.register_blueprint(auth_bp, url_prefix='/auth')