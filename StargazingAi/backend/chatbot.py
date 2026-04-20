from dotenv import load_dotenv
load_dotenv()
import os , re
from google import genai
import json
from typing import Optional
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL="gemini-3.1-flash-lite-preview"

def chatbot(message:str)->dict:
    try:
        prompt = f"""
        Extract structured data from this user query.

        User query: "{message}"

        Return ONLY valid JSON in this format:
        {{
        "city": "...",
        "target": "...",
        "datetime": "...",
        "action": "recommend | answer"
        }}

        Rules:
        - city = location mentioned
        - target = celestial object
        - datetime = ISO format if time mentioned, else null
        - Decide:
        - If calculation needed → "recommend"
        - Else → "answer"
        - DO NOT add explanation
        """
        response = client.models.generate_content(
                model=MODEL,
                contents=prompt
            )
        print("RAW:", response)
        
        text=response.text.strip()
        text = re.sub(r"```json|```", "", text).strip()
        return json.loads(text)

    except Exception as e:
        print("AI ERROR:", e)
        return {
            "city": None,
            "target": None,
            "datetime":Optional[str], 
            "action": "recommend"
        }
        
print(chatbot("Where can I see Jupiter in Pune?"))
    