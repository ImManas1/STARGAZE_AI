from dotenv import load_dotenv
load_dotenv()

import os
from google import genai

# Configure API
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# Load model
MODEL="gemini-3.1-flash-lite-preview"

# -------------------------
# MAIN AI FUNCTION
# -------------------------

def call_ai(data: dict) -> str:
    try:
        print("CALLING NEW GEMINI...")

        prompt = f"""
Explain stargazing conditions in 2–3 natural, user-friendly sentences using the provided data.

IMPORTANT RULES:

- Overall condition MUST match the score.
- If score is low/moderate due to light pollution, DO NOT describe conditions as "excellent" or "clear".
- Always prioritize BORTLE CLASS over cloud/humidity.
- Even with clear skies, high light pollution reduces visibility significantly.

Guidelines:
- Stay accurate to the values (do not exaggerate)
- Do NOT just list data — interpret it
- Explain what the conditions mean for visibility
- You may simplify technical terms (e.g., Bortle class → light pollution level)
- End with a clear recommendation

Rules:
- Your explanation MUST align with the condition.
- High Bortle class (7–9) = poor visibility even if skies are clear.
- Do NOT call conditions "excellent" if score is moderate or low.
- Focus on visibility of celestial objects, not just sky clarity.

Score: {data.get('score')}
Condition: {data.get('condition')}
Cloud cover: {data.get('cloud_cover')}%
Humidity: {data.get('humidity')}%
Moon illumination: {data.get('moon_illumination')}%
Altitude: {data.get('altitude_deg')} degrees
Bortle class: {data.get('bortle_class')}
Best window: {data.get('best_window')}
"""

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt
        )

        print("RAW:", response)

        return response.text.strip()

    except Exception as e:
        print("AI ERROR:", e)
        return fallback_reason(data)


def fallback_reason(data: dict) -> str:
    return (
        f"{data['condition']} stargazing conditions with "
        f"{data['cloud_cover']}% cloud cover, "
        f"{data['humidity']}% humidity."
    )