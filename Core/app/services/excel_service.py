import pandas as pd
import numpy as np

ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

class ExcelService:
    @staticmethod
    def allowed_file(filename):
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def upload_file_in_memory(file):
        if file.filename == '':
            raise ValueError("Nombre de archivo vacío")

        if not ExcelService.allowed_file(file.filename):
            raise ValueError("Extensión no permitida")

        try:
            # Leemos solo las primeras 10 filas para optimizar rendimiento (preview)
            if file.filename.lower().endswith('.csv'):
                df = pd.read_csv(file, nrows=10)
            else:
                df = pd.read_excel(file, nrows=10)            
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
        """Reads the entire excel file into a DataFrame"""
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
        """Formats a DataFrame into the standard JSON response structure"""
        columns = df.columns.tolist()
        result_data = df.replace({np.nan: None}).to_dict(orient='records')
        
        return {
            "columns": columns,
            "rows": result_data
        }