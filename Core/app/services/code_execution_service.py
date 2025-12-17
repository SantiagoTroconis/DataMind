import pandas as pd
import traceback

class CodeExecutionService:
    @staticmethod
    def execute_transformation(df: pd.DataFrame, code: str) -> pd.DataFrame:
        local_scope = {'df': df.copy()} # Work on a copy initially
        global_scope = {'pd': pd}

        try:
            exec(code, global_scope, local_scope)
            
            # Retrieve the modified dataframe
            modified_df = local_scope.get('df')
            
            if not isinstance(modified_df, pd.DataFrame):
                raise ValueError("The executed code did not result in a valid DataFrame named 'df'.")
                
            return modified_df
            
        except Exception as e:
            error_details = traceback.format_exc()
            raise Exception(f"Code execution error: {str(e)}\nDetails: {error_details}")
