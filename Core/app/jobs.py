import os
from datetime import datetime


def cleanup_expired_files():
    """Remove disk files and deactivate DB records for conversations past their TTL."""
    from config.database import SessionLocal
    from app.models.conversation import Conversation

    session = SessionLocal()
    try:
        expired = session.query(Conversation).filter(
            Conversation.is_active == True,
            Conversation.expires_at != None,
            Conversation.expires_at <= datetime.utcnow()
        ).all()
        for conv in expired:
            if conv.file_path and os.path.exists(conv.file_path):
                os.remove(conv.file_path)
            conv.is_active = False
        session.commit()
        if expired:
            print(f"[TTL CLEANUP] Removed {len(expired)} expired conversation(s)")
    except Exception as e:
        session.rollback()
        print(f"[TTL CLEANUP] Error: {e}")
    finally:
        session.close()
