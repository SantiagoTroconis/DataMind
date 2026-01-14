from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from config.database import Base
from datetime import datetime

class Command(Base):
    __tablename__ = 'commands'
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey('conversations.id'), nullable=False)
    prompt = Column(Text, nullable=False)
    chart_generated_code = Column(Text, nullable=True)
    generated_code = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(), default=datetime.utcnow, nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "prompt": self.prompt,
            "chart_generated_code": self.chart_generated_code,
            "generated_code": self.generated_code,
            "explanation": self.explanation,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
        }
