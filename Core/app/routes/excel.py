from flask import Blueprint, request, jsonify, Response, stream_with_context
import json
import pandas as pd
import openpyxl
from app.services.excel_service import ExcelService
from app.services.llm_service import LLMService
from app.services.code_execution_service import CodeExecutionService
from app.services.state_manager import StateManager
from flask_jwt_extended import jwt_required, get_jwt_identity

excel_bp = Blueprint('excel', __name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def format_sse(data: str, event: str = None) -> str:
    """Format a Server-Sent Event frame."""
    msg = f'event: {event}\n' if event else ''
    return msg + f'data: {data}\n\n'


@excel_bp.post('/upload')
@jwt_required()
def upload_excel():
    current_user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({"error": "No se envió el archivo"}), 400

    file = request.files['file']

    # Extension check — only .xlsx and .xls allowed
    filename = file.filename or ''
    if not filename.lower().endswith(('.xlsx', '.xls')):
        return jsonify({"error": "Solo se permiten archivos .xlsx o .xls"}), 400

    # Size check — must use seek/tell pattern; MUST reset with seek(0) afterwards
    file.seek(0, 2)          # seek to end
    file_size = file.tell()  # get size in bytes
    file.seek(0)             # CRITICAL: reset to start — without this, file.save() writes 0 bytes
    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": "El archivo supera el límite de 10 MB"}), 400

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

    # Validate before entering SSE generator — return plain JSON 400 for missing/bad input
    if not session_id or not prompt:
        return jsonify({"error": "Faltan datos (session_id o prompt)"}), 400

    if len(prompt) > 2000:
        return jsonify({"error": "El prompt es demasiado largo (máximo 2000 caracteres)"}), 400

    def generate():
        try:
            yield format_sse(json.dumps({"step": "Interpretando..."}), event="progress")

            session = StateManager.get_session(session_id, current_user_id)
            file_path = session['conversation'].file_path

            # Replay to get current DataFrame
            current_df = _replay_session(session)

            columns = current_df.columns.tolist()
            sample_data = None
            if not current_df.empty:
                sample_data = current_df.iloc[0].where(pd.notnull(current_df.iloc[0]), None).to_dict()

            # Generate transformation code from LLM
            code_data = LLMService.generate_transformation_code(prompt, columns, sample_data)

            if isinstance(code_data, dict):
                code = code_data['code']
                explanation = code_data['explanation']
                intent = code_data.get('intent', 'DATA_MUTATION')
            else:
                code, explanation = code_data
                intent = 'DATA_MUTATION'

            yield format_sse(json.dumps({"step": "Ejecutando..."}), event="progress")

            if intent == 'FORMULA_WRITE':
                # code may be already a list (parsed by LLM service) or a JSON string
                formula_instructions = code if isinstance(code, list) else json.loads(code)
                CodeExecutionService.apply_formula_write(file_path, formula_instructions)
                StateManager.add_command(
                    session_id, prompt,
                    json.dumps(formula_instructions),  # must be a string for Text column
                    explanation,
                    intent_type='FORMULA_WRITE'
                )
                # Re-read keeping formula strings — pd.read_excel can't do this,
                # so we use openpyxl directly (data_only=False preserves formula text)
                wb = openpyxl.load_workbook(file_path, data_only=False)
                ws = wb.active
                rows = list(ws.values)
                if rows:
                    headers = [str(c) if c is not None else '' for c in rows[0]]
                    updated_df = pd.DataFrame(rows[1:], columns=headers)
                else:
                    updated_df = pd.DataFrame()
                data = ExcelService.format_dataframe_response(updated_df)
                yield format_sse(json.dumps({
                    "step": "Listo",
                    "type": "formula",
                    "data": data,
                    "explanation": explanation,
                    "chart_data": None,
                    "has_chart": False
                }), event="done")

            elif intent == 'VISUAL_UPDATE':
                chart_json = CodeExecutionService.execute_chart_generation(current_df, code)
                StateManager.add_command(
                    session_id, prompt,
                    "pass",
                    explanation,
                    chart_code=code,
                    intent_type='VISUAL_UPDATE'
                )
                yield format_sse(json.dumps({
                    "step": "Listo",
                    "type": "chart",
                    "data": None,
                    "explanation": explanation,
                    "chart_data": json.loads(chart_json),
                    "has_chart": True
                }), event="done")

            else:
                # DATA_MUTATION — pre-exec validate, execute, store
                for pattern in ['import ', 'open(', 'os.', 'sys.', 'subprocess.', '__class__', '__subclasses__']:
                    if pattern in code:
                        raise ValueError(f"Forbidden pattern in generated code: {pattern!r}")

                StateManager.add_command(
                    session_id, prompt,
                    code,
                    explanation,
                    intent_type='DATA_MUTATION'
                )
                modified_df = CodeExecutionService.execute_transformation(current_df, code)
                data = ExcelService.format_dataframe_response(modified_df)

                # Reactive chart update if one is active
                updated_chart_data = None
                has_chart = False
                chart_code = StateManager.get_active_chart_code(session_id)
                if chart_code:
                    try:
                        chart_json = CodeExecutionService.execute_chart_generation(modified_df, chart_code)
                        updated_chart_data = json.loads(chart_json)
                        has_chart = True
                    except Exception as chart_err:
                        print(f"Reactive chart update failed: {chart_err}")

                yield format_sse(json.dumps({
                    "step": "Listo",
                    "type": "update",
                    "data": data,
                    "explanation": explanation,
                    "chart_data": updated_chart_data,
                    "has_chart": has_chart
                }), event="done")

        except Exception as e:
            print(f"[TRANSFORM ERROR] prompt={prompt!r} error={e}")
            yield format_sse(json.dumps({"error": "No pude aplicar ese cambio. Intenta ser más específico."}), event="error")

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


@excel_bp.post('/undo')
@jwt_required()
def undo_excel():
    current_user_id = get_jwt_identity()
    session_id = request.form.get('session_id')

    if not session_id:
        return jsonify({"error": "Faltan datos (session_id)"}), 400

    try:
        # Peek at command count before undo to detect no-op
        pre_session = StateManager.get_session(session_id, current_user_id)
        had_commands = len(pre_session['commands']) > 0

        StateManager.undo_last_command(session_id)

        session = StateManager.get_session(session_id, current_user_id)
        current_df = _replay_session(session)

        data = ExcelService.format_dataframe_response(current_df)

        # Chart sync — re-execute active chart code post-undo
        chart_data = None
        has_chart = False
        chart_code = StateManager.get_active_chart_code(session_id)
        if chart_code:
            try:
                chart_json = CodeExecutionService.execute_chart_generation(current_df, chart_code)
                chart_data = json.loads(chart_json)
                has_chart = True
            except Exception as chart_err:
                print(f"[UNDO] Chart re-execution failed: {chart_err}")

        return jsonify({
            "status": "success",
            "message": "Deshacer exitoso",
            "data": data,
            "chart_data": chart_data,
            "has_chart": has_chart,
            "undone": had_commands
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
        grid_data = ExcelService.format_dataframe_response(current_df)

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

        # 4. Format Messages
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
    """Helper to replay all commands from initial_df, routing by intent_type."""
    df = session['initial_df'].copy()
    file_path = session['conversation'].file_path

    for cmd in session['commands']:
        intent = getattr(cmd, 'intent_type', 'DATA_MUTATION') or 'DATA_MUTATION'
        code = cmd.generated_code if hasattr(cmd, 'generated_code') else cmd

        if intent == 'FORMULA_WRITE':
            # Apply formula to disk; do not update in-memory df
            # (formula_instructions stored as JSON string in generated_code)
            try:
                formula_instructions = json.loads(code)
                CodeExecutionService.apply_formula_write(file_path, formula_instructions)
            except Exception as e:
                print(f"[_replay_session] FORMULA_WRITE failed for cmd {getattr(cmd, 'id', '?')}: {e}")
        else:
            # DATA_MUTATION or VISUAL_UPDATE — execute against df
            if code and code != 'pass':
                df = CodeExecutionService.execute_transformation(df, code)

    return df
