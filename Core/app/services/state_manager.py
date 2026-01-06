import pandas as pd
from config.database import SessionLocal
from app.models.conversation import Conversation
from app.models.command import Command
from app.services.excel_service import ExcelService
from app.services.code_execution_service import CodeExecutionService

class StateManager:
    @staticmethod
    def create_session(user_id: int, file, filename: str) -> int:
        """
        Creates a new conversation in the DB.
        Saves file to disk.
        Returns conversation_id.
        """
        session = SessionLocal()
        try:
            # 1. Check Limits (Max 2 active sessions)
            count = session.query(Conversation).filter_by(user_id=user_id, is_active=True).count()
            if count >= 2:
                raise ValueError("Límite de 2 sesiones alcanzado. Elimine una anterior.")

            # 2. Save File
            file_path, secure_name = ExcelService.save_file_to_disk(file, user_id)

            # 3. Create Record
            new_conv = Conversation(
                user_id=user_id,
                file_path=file_path,
                filename=filename
            )
            session.add(new_conv)
            session.commit()
            return new_conv.id
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    @staticmethod
    def get_session(conversation_id: int, user_id: int):
        """
        Loads Conversation from DB
        Reads File from Disk -> initial_df
        Loads Commands from DB
        Returns dict similar to previous in-memory structure
        """
        session = SessionLocal()
        try:
            conv = session.query(Conversation).filter_by(id=conversation_id, user_id=user_id).first()
            if not conv:
                raise ValueError("Conversación no encontrada o acceso denegado.")

            if conv.file_path.endswith('.csv'):
                initial_df = pd.read_csv(conv.file_path)
            else:
                initial_df = pd.read_excel(conv.file_path)


            initial_df.columns = initial_df.columns.astype(str)

            # Load Commands (Ordered by ID/Created_at) - ONLY ACTIVE ONES
            commands_db = session.query(Command).filter_by(conversation_id=conversation_id, is_active=True).order_by(Command.id).all()
            
            return {
                'initial_df': initial_df,
                'commands': commands_db,
                'conversation': conv
            }
        finally:
            session.close()

    @staticmethod
    def add_command(conversation_id: int, prompt: str, code: str, explanation: str = None):
        session = SessionLocal()
        try:
            # Clean up "future" (inactive) commands to maintain linear history
            # If we are adding a new command, any command that was "undone" (is_active=False) 
            # and is chronologically "after" the current state should be removed.
            # Simplified approach: Delete ALL inactive commands for this conversation.
            session.query(Command).filter_by(conversation_id=conversation_id, is_active=False).delete()
            
            cmd = Command(
                conversation_id=conversation_id,
                prompt=prompt,
                generated_code=code,
                explanation=explanation,
                is_active=True
            )
            session.add(cmd)
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()

    @staticmethod
    def undo_last_command(conversation_id: int):
        session = SessionLocal()
        try:
            # Find last ACTIVE command
            last_cmd = session.query(Command).filter_by(conversation_id=conversation_id, is_active=True).order_by(Command.id.desc()).first()
            if last_cmd:
                # Soft Delete
                last_cmd.is_active = False
                session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
            
    @staticmethod
    def clear_commands(conversation_id: int):
        session = SessionLocal()
        try:
            # Soft delete ALL
            session.query(Command).filter_by(conversation_id=conversation_id).update({Command.is_active: False})
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()

    @staticmethod
    def get_user_conversations(user_id: int):
        session = SessionLocal()
        try:
            convs = session.query(Conversation).filter_by(user_id=user_id, is_active=True).order_by(Conversation.created_at.desc()).all()
            return [c.serialize() for c in convs]
        finally:
            session.close()

    @staticmethod
    def get_conversation_messages(conversation_id: int, user_id: int):
        session = SessionLocal()
        try:
            # Verify ownership
            conv = session.query(Conversation).filter_by(id=conversation_id, user_id=user_id).first()
            if not conv:
                raise ValueError("Conversación no encontrada.")
            
            # Return only ACTIVE messages
            commands = session.query(Command).filter_by(conversation_id=conversation_id, is_active=True).order_by(Command.id).all()
            return [c.serialize() for c in commands]
        finally:
            session.close()

    @staticmethod
    def delete_conversation(conversation_id: int, user_id: int):
        session = SessionLocal()
        try:
            conv = session.query(Conversation).filter_by(id=conversation_id, user_id=user_id).first()
            if not conv:
                raise ValueError("Conversación no encontrada.")
            
            conv.is_active = False
            session.commit()
        except:
            session.rollback()
            raise
        finally:
            session.close()
