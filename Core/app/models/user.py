from sqlalchemy import Column, Integer, String, Boolean, DateTime
from config.database import Base
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True, nullable=False)
    created_at = Column(DateTime(), default=datetime.utcnow, nullable=False)


    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password:
            return False
        return check_password_hash(self.password, password)


    def serialize(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": None if not self.created_at else self.created_at.isoformat()
        }

