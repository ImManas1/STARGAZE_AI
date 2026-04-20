import httpx
import os
from fastapi import APIRouter , Query
from pydantic import BaseModel
from contracts import (
    APIRequest,
    FIELD_SCORE , FIELD_CONF_BAND,
    FIELD_CONDITION,
    FIELD_BEST_WINDOW,
    FIELD_ERROR,
    FIELD_FORECAST_CONF,
    FIELD_OBJECTS,
    FIELD_REASON,
    CONDITION_GOOD,
)
from weather import get_weather_data
from ai_scorer import call_ai
from geocoder import city_to_latlon
from bortle import estimate_bortle
from chatbot import chatbot
from datetime import datetime

router = APIRouter()
class ChatRequest(BaseModel):
    message:str 
@router.post("/chat")
async def chat(body: ChatRequest):
    msg = body.message

    parsed = chatbot(msg)

    city = parsed.get("city")
    target = parsed.get("target")
    user_dt = parsed.get("datetime")   # ✅ FIX
    action = parsed.get("action", "answer")
    if city or target:
        action = "recommend"
    # 🔥 pure chatbot mode
    if action == "answer" or (not city and not target):
        reply = call_ai({
            "mode": "chat_response",
            "user_question": msg,
            "data": None
        })
        return {"reply": reply}

    # fallback defaults
    if not city:
        city = "mumbai"
    if not target:
        target = "jupiter"

    # 🔥 pass datetime
    result = await recommend({
        "city": city,
        "target": target,
        "datetime": user_dt
    })

    # AI generates final reply
    reply = call_ai({
        "mode": "chat_response",
        "user_question": msg,
        "data": result,
        "user_time": user_dt
    })

    return {
        "reply": reply,
        "data": result
    }
@router.get("/autocomplete")
async def autocomplete(city: str = Query(..., min_length=1)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "http://api.openweathermap.org/geo/1.0/direct",
                params={
                    "q": city,
                    "limit": 8,
                    "appid": os.getenv("OPENWEATHER_API_KEY")
                }
            )
            r.raise_for_status()
            data = r.json()

        query = city.lower()
        results = []

        for d in data:
            name = d["name"]
            country = d.get("country", "")

            if name.lower().startswith(query):
                priority = 0
            elif query in name.lower():
                priority = 1
            else:
                continue

            results.append({
                "name": name,
                "display": f"{name}, {country}",
                "priority": priority
            })

        # sort results
        results.sort(key=lambda x: x["priority"])

        return results[:5]

    except Exception as e:
        print("AUTOCOMPLETE ERROR:", e)
        return []

def hour_to_datetime(hour_str, base_date):
    hour = int(hour_str[:2])
    return base_date.replace(hour=hour, minute=0, second=0)
@router.post('/recommend')
async def recommend(body: APIRequest):
    user_dt = None
    if body.get("datetime"):
        try:
            user_dt = datetime.fromisoformat(body["datetime"])
        except:
            user_dt = None
    geo=await city_to_latlon(body["city"])
    lat=geo["lat"]
    lon=geo["lon"]
    
    weather=await get_weather_data(lat,lon)
    print("Weather : ",weather)
    fc = weather["forecast_confidence"].lower()
    hourly=weather['hourly']
    if user_dt:
        selected_hour = user_dt.hour
        selected_slot = next(
            (h for h in hourly if int(h["time"][:2]) == selected_hour),
            hourly[0]  # fallback
        )
    else:
        selected_slot = min(hourly, key=lambda h: h["cloud_cover"])
    cloud = selected_slot["cloud_cover"]
    humidity = weather["humidity"]
    bortle_class=estimate_bortle(lat,lon)

    #TOTAL SCORE CALCULATIONS
    score=100
    score-=cloud*0.7                  #Used 0.7 due to cloud's coverage affects stargaze in more amount
    score-=humidity*0.2               #Used 0.2 due to humidity affects stargaze in less amount
    score-=bortle_class*8
    score=int(max(0,min(100,score)))
    
    #STARGAZING CONDITIONS
    if score>=80:
        condition="Excellent"
    elif score >= 60:
        condition = "Good"
    elif score >= 40:
        condition = "Moderate"
    elif score >= 20:
        condition = "Poor"
    else:
        condition = "Bad"
        
    #CONFIDENCE BAND
    if fc=="high":
        confidence_band=8
    elif fc=="medium":
        confidence_band=15
    else:
        confidence_band=25
        
    #BEST TIME
    night_hours = [h for h in hourly if int(h["time"][:2]) >= 18 or int(h["time"][:2]) <= 5]
    if night_hours:
        best_slot = min(night_hours, key=lambda h: h["cloud_cover"])
    else:
        best_slot = min(hourly, key=lambda h: h["cloud_cover"])
    if user_dt:
        best_time = selected_slot["time"]
    else:
        best_time = best_slot["time"]
    hour = int(best_time[:2])
    end_hour = (hour + 2) % 24
    best_window = f"{best_time} - {end_hour:02d}:00"
    
    #AI INPUTS 
    ai_input = {
    "score": score,
    "condition": condition,
    "cloud_cover": cloud,
    "humidity": weather["humidity"],
    "moon_illumination": 30,   
    "altitude_deg": 40,        
    "bortle_class": bortle_class,         
    "best_window": best_window,
    }
    #CALLING AI 
    reason=call_ai(ai_input)
  
    return{
        FIELD_SCORE: score,
        FIELD_CONF_BAND: confidence_band,
        FIELD_CONDITION:condition,
        FIELD_BEST_WINDOW: best_time,
        FIELD_FORECAST_CONF: 'High',
        FIELD_REASON: reason,
        FIELD_OBJECTS: [
        {'name': 'Jupiter', 'altitude_deg': 42.0, 'visible': True},
        {'name': 'Saturn', 'altitude_deg': 28.0, 'visible': True},
        ],
        FIELD_ERROR: None,
    }