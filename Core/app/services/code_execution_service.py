import pandas as pd
import numpy as np
import traceback

FORBIDDEN_PATTERNS = [
    'import ',
    'open(',
    'os.',
    'sys.',
    'subprocess.',
    '__class__',
    '__subclasses__',
    '__import__',
    'eval(',
    'exec(',
]


class CodeExecutionService:
    @staticmethod
    def execute_transformation(df: pd.DataFrame, code: str) -> pd.DataFrame:
        # Pre-exec: reject forbidden patterns before any execution
        for pattern in FORBIDDEN_PATTERNS:
            if pattern in code:
                raise ValueError(f"Forbidden pattern in generated code: {pattern!r}")

        original_rows = len(df)
        local_scope = {'df': df.copy()}
        global_scope = {'__builtins__': {}, 'pd': pd, 'np': np}

        try:
            exec(code, global_scope, local_scope)

            modified_df = local_scope.get('df')

            if not isinstance(modified_df, pd.DataFrame):
                raise ValueError("The executed code did not result in a valid DataFrame named 'df'.")

            # Post-exec validation
            result_rows = len(modified_df)
            if result_rows == 0:
                raise ValueError("Result DataFrame is empty")
            if result_rows > original_rows * 10:
                raise ValueError(
                    f"Result DataFrame has suspicious row count: {result_rows} (input had {original_rows})"
                )

            return modified_df

        except ValueError:
            raise
        except Exception as e:
            error_details = traceback.format_exc()
            raise Exception(f"Code execution error: {str(e)}\nDetails: {error_details}")

    @staticmethod
    def apply_formula_write(file_path: str, formula_instructions: list) -> None:
        """Write formula strings to .xlsx cells on disk via openpyxl."""
        import openpyxl
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active
        for instruction in formula_instructions:
            ws[instruction["cell"]] = instruction["formula"]
        wb.save(file_path)

    @staticmethod
    def execute_chart_generation(df: pd.DataFrame, code: str) -> str:
        import plotly.express as px
        import plotly.graph_objects as go
        import plotly
        import json

        for pattern in FORBIDDEN_PATTERNS:
            if pattern in code:
                raise ValueError(f"Forbidden pattern in generated code: {pattern!r}")

        safe_builtins = {
            'len': len,
            'min': min,
            'max': max,
            'sum': sum,
            'abs': abs,
            'round': round,
            'sorted': sorted,
            'list': list,
            'dict': dict,
            'set': set,
            'tuple': tuple,
            'float': float,
            'int': int,
            'str': str,
            'bool': bool,
            'range': range,
            'enumerate': enumerate,
            'zip': zip,
            'any': any,
            'all': all,
        }

        local_scope = {'df': df.copy()}
        global_scope = {
            '__builtins__': safe_builtins,
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
