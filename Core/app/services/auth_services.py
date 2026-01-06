# app/services/auth_service.py
from app.models import User
from config.database import SessionLocal
from flask_jwt_extended import create_access_token
from typing import Tuple, Optional
from datetime import timedelta

class AuthService:
    @staticmethod
    def register(email: str, password: str) -> Tuple[Optional[User], Optional[str]]:
        email = email.strip().lower()
        if not email or not password:
            return None, "Email y contraseña son requeridos."

        session = SessionLocal()
        try:
            if session.query(User).filter_by(email=email).first():
                return None, "El email ya está registrado."

            user = User(email=email)
            user.set_password(password)

            session.add(user)
            session.commit()
            session.refresh(user)
            
            return user, None
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    @staticmethod
    def login(email: str, password: str) -> Tuple[Optional[str], Optional[str], Optional[User]]:
        email = email.strip().lower()
        session = SessionLocal()
        try:
            user = session.query(User).filter_by(email=email).first()
            if not user or not user.check_password(password):
                return None, None, "Credenciales incorrectas."

            access_token_expires = timedelta(minutes=30)
            token = create_access_token(identity=str(user.id), expires_delta=access_token_expires)
            return token, user, None
        finally:
            session.close()