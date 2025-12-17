from app.routes.excel import excel_bp

def register_blueprints(app):
    app.register_blueprint(excel_bp, url_prefix='/excel')