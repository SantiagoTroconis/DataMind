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

    @staticmethod
    def execute_chart_generation(df: pd.DataFrame, code: str) -> str:
        import plotly.express as px
        import plotly.graph_objects as go
        import plotly
        import json

        local_scope = {'df': df.copy()}
        global_scope = {
            'pd': pd,
            'px': px,
            'go': go,
            'plotly': plotly,
            'json': json
        }

        try:
            exec(code, global_scope, local_scope)
            
            fig = local_scope.get('fig')
            
            if not fig:
                 raise ValueError("The executed code did not result in a variable named 'fig'.")

            # Basic check if it looks like a plotly figure (has to_json method)
            if not hasattr(fig, 'to_json'):
                raise ValueError("The variable 'fig' does not appear to be a Plotly figure.")
                
            return fig.to_json()
            
        except Exception as e:
            error_details = traceback.format_exc()
            raise Exception(f"Chart execution error: {str(e)}\nDetails: {error_details}")
