from dotenv import load_dotenv
load_dotenv()

import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# -------------------------
# MAIN AI FUNCTION
# -------------------------

def call_ai(data: dict) -> str:
    try:
        prompt = f"""
You are an astronomy assistant.

Explain stargazing conditions clearly using ONLY the given data.

Score: {data['score']}
Condition: {data['condition']}
Cloud cover: {data['cloud_cover']}%
Humidity: {data['humidity']}%
Moon illumination: {data['moon_illumination']}%
Altitude: {data['altitude_deg']} degrees
Bortle class: {data['bortle_class']}
Best window: {data['best_window']}

Rules:
- Keep it 2–3 sentences
- Do not calculate anything
- Do not change values
- Be simple and factual
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )

        return response.choices[0].message.content.strip()

    except Exception:
        return fallback_reason(data)


# -------------------------
# FALLBACK (NO AI NEEDED)
# -------------------------

def fallback_reason(data: dict) -> str:
    return (
        f"{data['condition']} stargazing conditions with "
        f"{data['cloud_cover']}% cloud cover, "
        f"{data['humidity']}% humidity, and "
        f"{data['altitude_deg']}° altitude. "
        "Visibility depends mainly on sky clarity and moonlight."
    )


# -------------------------
# MOCK TEST (RUN WITHOUT BACKEND)
# -------------------------

if __name__ == "__main__":
    mock_data = {
        "score": 78,
        "condition": "Good",
        "cloud_cover": 20,
        "humidity": 50,
        "moon_illumination": 30,
        "altitude_deg": 42,
        "bortle_class": 5,
        "best_window": "22:00-01:00"
    }

    print(call_ai(mock_data))