import os
import google.generativeai as genai
from typing import List
import json


class LLMService:
    @staticmethod
    def generate_transformation_code(prompt: str, columns: List[str], sample_data: dict = None) -> tuple[str, str]:
        api_key = "AIzaSyA4SjXYjZpvqec2uLEn9ka0hlF1aekD0SQ"

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})

        sample_info = ""
        if sample_data:
            sample_info = f"\n        Sample data (first row): {sample_data}\n"

        system_instruction = f"""
            Act as the DataMind Intent Classifier. Your task is to analyze the User Request and generate a valid JSON response to either modify a pandas DataFrame named 'df' or generate a Plotly chart.

            The DataFrame 'df' has the following columns: {columns}
            {sample_info}
            User Request: "{prompt}"

    
            Rules:
            1. Classify the action as either 'DATA_MUTATION' (filtering, cleaning, feature engineering) or 'VISUAL_UPDATE' (creating or updating charts).
            2. Output strictly valid JSON format.
            3. The JSON must have the following keys:
                - "intent": "DATA_MUTATION" or "VISUAL_UPDATE".
                - "code": The Python code to execute.
                - "explanation": A brief summary of what the code does.

            Specifics for "intent": "DATA_MUTATION":
            - Output Python code to modify the DataFrame 'df'.
            - Assume 'df' is loaded.
            - No markdown.
            - No imports (pd is pandas).
            - Modify 'df' in place or reassign it.
            - This will automatically signal the system to refresh any active charts.

    

            Specifics for "intent": "VISUAL_UPDATE":
            - Output Plotly code using 'plotly.graph_objects' as 'go' or 'plotly.express' as 'px'.
            - Create a plotly figure object named 'fig'.
            - DO NOT use fig.show().
            - Keep the dataframe 'df' READ-ONLY.
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
            intent = result.get('intent', 'DATA_MUTATION').strip().upper()
            
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
