import os
import google.generativeai as genai
from typing import List

class LLMService:
    @staticmethod
    def generate_transformation_code(prompt: str, columns: List[str], sample_data: dict = None) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")


        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        sample_info = ""
        if sample_data:
            sample_info = f"\n        Sample data (first row): {sample_data}\n"

        system_instruction = f"""
        You are a Python data expert. Your task is to generate ONLY the Python code to modify a pandas DataFrame named 'df'.
        
        The DataFrame 'df' has the following columns: {columns}
        {sample_info}
        User Request: "{prompt}"
        
        Rules:
        1. Assume 'df' is already loaded.
        2. Write code to transform 'df' based on the request.
        3. Do NOT include markdown formatting (like ```python ... ```). 
        4. Do NOT include imports (assume 'pd' is imported as pandas).
        5. Do NOT print the dataframe, just modify it in place or reassign it.
        6. If the request implies filtering, reassign 'df'. e.g. df = df[df['age'] > 10].
        7. Output ONLY the code lines.
        """
        
        try:
            response = model.generate_content(system_instruction)
            code = response.text.strip()
            
            # Cleanup markdown if the model ignores the rule
            if code.startswith("```python"):
                code = code.replace("```python", "").replace("```", "").strip()
            elif code.startswith("```"):
                code = code.replace("```", "").strip()
                
            return code
        except Exception as e:
            raise Exception(f"AI Generation failed: {str(e)}")
