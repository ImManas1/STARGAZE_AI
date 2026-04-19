from dotenv import load_dotenv
load_dotenv()

import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

response = model.generate_content("Say hello in one sentence.")

print("RAW:", response)

try:
    print("TEXT:", response.text)
except:
    print("ALT:", response.candidates[0].content.parts[0].text)