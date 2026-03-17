import os
import json
import litellm
from typing import List


class LLMService:
    @staticmethod
    def generate_transformation_code(prompt: str, columns: List[str], sample_data: dict = None) -> dict:
        model = os.getenv('LLM_MODEL', 'gemini/gemini-2.5-flash')

        sample_info = ""
        if sample_data:
            sample_info = f"\nSample data (first row): {sample_data}\n"

        system_content = f"""Act as the DataMind Intent Classifier. Your task is to analyze the user request and generate a valid JSON response to either modify a pandas DataFrame named 'df', generate a Plotly chart, or write Excel cell formulas.

The DataFrame 'df' has the following columns: {columns}
{sample_info}
Classification rules (apply before choosing intent):
- Use "DATA_MUTATION" for: setting/changing cell values, filtering rows, renaming columns, sorting, math on data, any change to data content. Setting a cell to a plain number (e.g. 999) is DATA_MUTATION.
- Use "FORMULA_WRITE" ONLY when the user explicitly asks to INSERT an Excel formula function that starts with = (e.g. =SUM, =AVERAGE, =IF). A plain value like 999 is NOT a formula.
- Use "VISUAL_UPDATE" for: charts, graphs, plots.

Rules:
1. Classify the action as one of: 'DATA_MUTATION', 'VISUAL_UPDATE', or 'FORMULA_WRITE'.
2. Output strictly valid JSON format.
3. The JSON must have the following keys:
    - "intent": one of "DATA_MUTATION", "VISUAL_UPDATE", or "FORMULA_WRITE".
    - "code": the operation payload (see intent-specific rules below).
    - "explanation": a brief summary of what the operation does.

Specifics for "intent": "DATA_MUTATION":
- Output Python code to modify the DataFrame 'df'.
- Assume 'df' is loaded. pd is pandas. No imports.
- Modify 'df' in place or reassign it.
- No markdown.

Specifics for "intent": "VISUAL_UPDATE":
- Output Plotly code using 'plotly.graph_objects' as 'go' or 'plotly.express' as 'px'.
- Create a plotly figure object named 'fig'. DO NOT use fig.show().
- Keep the dataframe 'df' READ-ONLY.

Specifics for "intent": "FORMULA_WRITE":
- ONLY use when the user explicitly requests an Excel formula function (=SUM, =AVERAGE, =IF, =VLOOKUP, etc.).
- The "code" field must be a JSON array of objects, each with keys "cell" (e.g. "B2") and "formula" (e.g. "=SUM(A1:A10)").
- Use English Excel function names (SUM, AVERAGE, IF, VLOOKUP, etc.).
- No Python code — only the JSON array of cell/formula pairs.
- Example: [{{"cell": "B2", "formula": "=SUM(A1:A10)"}}, {{"cell": "C2", "formula": "=AVERAGE(A1:A10)"}}]
"""

        try:
            response = litellm.completion(
                model=model,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )

            raw_text = response.choices[0].message.content.strip()

            # Fallback: strip markdown code blocks if present
            if raw_text.startswith("```json"):
                raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text.replace("```", "").strip()

            result = json.loads(raw_text)

            code = result.get('code', '')
            if isinstance(code, str):
                code = code.strip()
                if code.startswith("```python"):
                    code = code.replace("```python", "").replace("```", "").strip()

            explanation = result.get('explanation', '').strip()
            intent = result.get('intent', 'DATA_MUTATION').strip().upper()

            return {
                "code": code,
                "explanation": explanation,
                "intent": intent,
            }

        except Exception as e:
            print(f"LLM Error: {e}")
            raise Exception(f"No se pudo generar el codigo. Error: {type(e).__name__}")
