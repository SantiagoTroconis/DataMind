import pandas as pd
import numpy as np
import os
import uuid
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

class ExcelService:
    @staticmethod
    def allowed_file(filename):
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def save_file_to_disk(file, user_id):
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
            
        user_folder = os.path.join(UPLOAD_FOLDER, str(user_id))
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)

        filename = secure_filename(file.filename)
        # Use UUID to prevent overwrites/conflicts
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(user_folder, unique_filename)
        
        file.seek(0)
        file.save(file_path)
        return file_path, filename

    @staticmethod
    def upload_file_in_memory(file):
        if file.filename == '':
            raise ValueError("Nombre de archivo vacío")

        if not ExcelService.allowed_file(file.filename):
            raise ValueError("Extensión no permitida")

        try:
            if file.filename.lower().endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)            
            df.columns = df.columns.astype(str)
            
            columns = df.columns.tolist()
            
            # Convertimos a diccionario, manejando valores vacíos (NaN) de forma segura
            result_data = df.replace({np.nan: None}).to_dict(orient='records')
            
            return {
                "columns": columns,
                "rows": result_data
            }

        except Exception as e:
            raise Exception(f"Error procesando el archivo: {str(e)}")

    @staticmethod
    def read_full_excel(file):
        if file.filename == '' or not ExcelService.allowed_file(file.filename):
            raise ValueError("Archivo inválido")
        
        try:
            if file.filename.lower().endswith('.csv'):
                df = pd.read_csv(file)
            else:
                df = pd.read_excel(file)
            # Ensure column names are strings
            df.columns = df.columns.astype(str)
            return df
        except Exception as e:
            raise Exception(f"Error leyendo el archivo: {str(e)}")

    @staticmethod
    def format_dataframe_response(df: pd.DataFrame):
        columns = df.columns.tolist()
        result_data = df.replace({np.nan: None}).to_dict(orient='records')
        
        return {
            "columns": columns,
            "rows": result_data
        }