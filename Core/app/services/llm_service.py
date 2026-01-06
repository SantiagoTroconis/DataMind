import os
import google.generativeai as genai
from typing import List
import json


class LLMService:
    @staticmethod
    def generate_transformation_code(prompt: str, columns: List[str], sample_data: dict = None) -> tuple[str, str]:
        api_key = os.getenv("GEMINI_API_KEY") # Use environment variable!

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})

        sample_info = ""
        if sample_data:
            sample_info = f"\n        Sample data (first row): {sample_data}\n"

        system_instruction = f"""
        You are a Python data expert. Your task is to analyze the User Request and generate a valid JSON response to either modify a pandas DataFrame named 'df' or generate a Plotly chart.

        The DataFrame 'df' has the following columns: {columns}
        {sample_info}
        User Request: "{prompt}"
        
        Rules:
        1. Output strictly valid JSON format.
        2. The JSON must have the following keys:
            - "intent": "UPDATE" (for data modification) or "CHART" (for visualization).
            - "code": The Python code to execute.
            - "explanation": A brief summary of what the code does.
        
        Specifics for "intent": "UPDATE":
        - Assume 'df' is loaded.
        - No markdown.
        - No imports (pd is pandas).
        - Modify 'df' in place or reassign it.
        
        Specifics for "intent": "CHART":
        - Assume 'df' is loaded.
        - Use 'plotly.graph_objects' as 'go' or 'plotly.express' as 'px'.
        - Create a plotly figure object named 'fig'.
        - DO NOT using fig.show().
        - Example: fig = px.bar(df, x='col1', y='col2')
        """
        
        try:
            response = model.generate_content(system_instruction)
            raw_text = response.text.strip()
            
            # Helper to strip markdown code blocks
            if raw_text.startswith("```json"):
                raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.replace("```", "").strip()

            result = json.loads(raw_text)
            
            code = result.get('code', '').strip()
            explanation = result.get('explanation', '').strip()
            intent = result.get('intent', 'UPDATE').strip().upper()
            
            # Cleanup code just in case
            if code.startswith("```python"):
                code = code.replace("```python", "").replace("```", "").strip()
            
            return {
                "code": code,
                "explanation": explanation,
                "intent": intent
            }

        except Exception as e:
            print(f"LLM Error: {e}")
            error_msg = f"No se pudo generar el código o la explicación. Error: {str(e)}"
            try:
                error_msg += f" Raw: {response.text}"
            except:
                pass
            raise Exception(error_msg)
