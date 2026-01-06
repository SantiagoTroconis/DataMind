from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from config.database import Base
from datetime import datetime

class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    file_path = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(), default=datetime.utcnow, nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active
        }
