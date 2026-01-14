from flask import Blueprint, request, jsonify
import json
import pandas as pd
from app.services.excel_service import ExcelService
from app.services.llm_service import LLMService
from app.services.code_execution_service import CodeExecutionService
from app.services.state_manager import StateManager
from flask_jwt_extended import jwt_required, get_jwt_identity

excel_bp = Blueprint('excel', __name__)

@excel_bp.post('/upload')
@jwt_required()
def upload_excel():
    current_user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({"error": "No se envió el archivo"}), 400
    
    file = request.files['file']

    try:
        session_id = StateManager.create_session(current_user_id, file, file.filename)
        session_data = StateManager.get_session(session_id, current_user_id)
        
        df = session_data['initial_df']
        data = ExcelService.format_dataframe_response(df)
        
        return jsonify({
            "status": "success",
            "message": "Archivo cargado y conversación creada",
            "session_id": session_id,
            "data": data
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@excel_bp.post('/transform')
@jwt_required()
def transform_excel():
    current_user_id = get_jwt_identity()
    session_id = request.form.get('session_id')
    prompt = request.form.get('prompt')
    
    if not session_id or not prompt:
        return jsonify({"error": "Faltan datos (session_id o prompt)"}), 400

    try:
        session = StateManager.get_session(session_id, current_user_id)

        # Obtenemos el DataFrame actual despues de aplicar todos los prompts
        current_df = _replay_session(session)
        
        # Obtenemos la lista de columnas
        columns = current_df.columns.tolist()
        
        # Obtenemos un sample de datos para el prompt
        sample_data = None
        if not current_df.empty:
            sample_data = current_df.iloc[0].where(pd.notnull(current_df.iloc[0]), None).to_dict()

        # Generamos el código
        code_data = LLMService.generate_transformation_code(prompt, columns, sample_data)
        
        # Manejamos el nuevo formato de diccionario o el formato heredado de tupla
        if isinstance(code_data, dict):
            code = code_data['code']
            explanation = code_data['explanation']
            intent = code_data.get('intent', 'DATA_MUTATION')
        else:
            code, explanation = code_data
            intent = 'DATA_MUTATION'

        if intent == 'VISUAL_UPDATE':
            chart_json = CodeExecutionService.execute_chart_generation(current_df, code)
            
            # Store in DB
            StateManager.add_command(
                session_id, 
                prompt, # User prompt
                "pass", # No DF transformation code needed for pure chart
                explanation,
                chart_code=code # Store the CHART code
            )
            
            return jsonify({
                "status": "success",
                "message": "Gráfico generado exitosamente",
                "type": "chart",
                "chart_data": json.loads(chart_json),
                "has_chart": True,
                "explanation": explanation,
                "executed_code": code
            }), 200
            
        else:
            # 4. Store Command (Transformation)
            StateManager.add_command(session_id, prompt, code, explanation)
            
            # 5. Execute New
            modified_df = CodeExecutionService.execute_transformation(current_df, code)
            
            data = ExcelService.format_dataframe_response(modified_df)
            
            # Reactivity: Check DB for active chart
            updated_chart_data = None
            has_chart = False
            chart_code = StateManager.get_active_chart_code(session_id)
            
            if chart_code:
                try:
                    chart_json = CodeExecutionService.execute_chart_generation(modified_df, chart_code)
                    updated_chart_data = json.loads(chart_json)
                    has_chart = True
                except Exception as e:
                    # Log error but don't fail request
                    print(f"Reactive chart update failed: {e}")
                    updated_chart_data = None

            return jsonify({
                "status": "success",
                "message": "Transformación exitosa",
                "type": "update",
                "executed_code": code,
                "explanation": explanation,
                "data": data,
                "chart_data": updated_chart_data,
                "has_chart": has_chart
            }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        import traceback
        return jsonify({"error": f"Error interno: {str(e)}", "trace": traceback.format_exc()}), 500


@excel_bp.post('/undo')
@jwt_required()
def undo_excel():
    current_user_id = get_jwt_identity()
    session_id = request.form.get('session_id')

    if not session_id:
        return jsonify({"error": "Faltan datos (session_id)"}), 400

    try:
        StateManager.undo_last_command(session_id)
        
        session = StateManager.get_session(session_id, current_user_id)
        current_df = _replay_session(session)
        
        data = ExcelService.format_dataframe_response(current_df)
        
        return jsonify({
            "status": "success",
            "message": "Deshacer exitoso",
            "data": data
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@excel_bp.post('/reset')
@jwt_required()
def reset_excel():
    current_user_id = get_jwt_identity()
    session_id = request.form.get('session_id')
    if not session_id:
        return jsonify({"error": "Faltan datos (session_id)"}), 400

    try:
        StateManager.clear_commands(session_id)
        
        session = StateManager.get_session(session_id, current_user_id)
        original_df = session['initial_df']
        
        data = ExcelService.format_dataframe_response(original_df)
        
        return jsonify({
            "status": "success",
            "message": "Reinicio exitoso",
            "data": data
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@excel_bp.get('/conversations')
@jwt_required()
def get_conversations():
    current_user_id = get_jwt_identity()
    try:
        conversations = StateManager.get_user_conversations(current_user_id)
        return jsonify({
            "status": "success",
            "conversations": conversations
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@excel_bp.get('/conversation/<int:session_id>')
@jwt_required()
def get_conversation_state(session_id):
    current_user_id = get_jwt_identity()
    try:
        # 1. Get Session
        session_data = StateManager.get_session(session_id, current_user_id)
        
        # 2. Replay to get current Grid
        current_df = _replay_session(session_data)
        grid_data = ExcelService.format_dataframe_response(current_df) # Limit to 10/15 rows for preview
        
        # 3. Get Active Chart (Persistence)
        chart_data = None
        has_chart = False
        chart_code = StateManager.get_active_chart_code(session_id)
        if chart_code:
            try:
                chart_json = CodeExecutionService.execute_chart_generation(current_df, chart_code)
                chart_data = json.loads(chart_json)
                has_chart = True
            except:
                pass
        
        # 3. Format Messages
        formatted_messages = []
        for cmd in session_data['commands']:
            # User Message
            formatted_messages.append({
                "id": f"msg_user_{cmd.id}",
                "role": "user",
                "content": cmd.prompt,
                "timestamp": cmd.created_at.isoformat()
            })
            
            # Assistant Message
            formatted_messages.append({
                "id": f"msg_asst_{cmd.id}",
                "role": "assistant",
                "content": cmd.explanation or "Transformation applied.",
                "executed_code": cmd.generated_code,
                "timestamp": cmd.created_at.isoformat() 
            })

        return jsonify({
            "status": "success",
            "data": {
                "filename": session_data['conversation'].filename,
                "grid": grid_data,
                "chart_data": chart_data,
                "has_chart": has_chart,
                "messages": formatted_messages
            }
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@excel_bp.delete('/conversation/<int:session_id>')
@jwt_required()
def delete_conversation(session_id):
    current_user_id = get_jwt_identity()
    try:
        StateManager.delete_conversation(session_id, current_user_id)
        conversations = StateManager.get_user_conversations(current_user_id)

        return jsonify({
            "status": "success",
            "message": "Conversación eliminada exitosamente",
            "conversations": conversations
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500




def _replay_session(session):
    """Helper to replay all commands from initial_df"""
    df = session['initial_df'].copy()
    for cmd in session['commands']:
        # Support both object (new way) or dict/string if legacy
        code = cmd.generated_code if hasattr(cmd, 'generated_code') else cmd
        df = CodeExecutionService.execute_transformation(df, code)
    return df