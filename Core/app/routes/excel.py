from flask import Blueprint, request, jsonify
from app.services.excel_service import ExcelService
from app.services.llm_service import LLMService
from app.services.code_execution_service import CodeExecutionService

excel_bp = Blueprint('excel', __name__)


@excel_bp.post('/upload')
def upload_excel():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió el archivo"}), 400
    
    file = request.files['file']

    try:
        data = ExcelService.upload_file_in_memory(file)
        return jsonify({
            "status": "success",
            "message": "Archivo leído desde memoria RAM exitosamente",
            "data": data
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@excel_bp.post('/transform')
def transform_excel():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió el archivo"}), 400
    
    file = request.files['file']
    prompt = request.form.get('prompt')
    
    if not prompt:
        return jsonify({"error": "No se envió el prompt"}), 400

    try:
        df = ExcelService.read_full_excel(file)
        
        columns = df.columns.tolist()
        
        sample_data = None
        if not df.empty:
            sample_data = df.iloc[0].to_dict()
            
        code = LLMService.generate_transformation_code(prompt, columns, sample_data)
        
        modified_df = CodeExecutionService.execute_transformation(df, code)
        
        # Limit the response to 15 rows to avoid frontend performance issues
        data = ExcelService.format_dataframe_response(modified_df)
        
        return jsonify({
            "status": "success",
            "message": "Transformación exitosa",
            "executed_code": code,
            "data": data
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        import traceback
        return jsonify({"error": f"Error interno: {str(e)}", "trace": traceback.format_exc()}), 500