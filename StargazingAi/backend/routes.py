from fastapi import APIRouter
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
router = APIRouter()

@router.post('/recommend')
async def recommend(body: APIRequest):

    geo=await city_to_latlon(body["city"])
    lat=geo["lat"]
    lon=geo["lon"]
    
    weather=await get_weather_data(lat,lon)
    print("Weather : ",weather)
    cloud=weather['cloud_cover']
    humidity = weather["humidity"]
    fc = weather["forecast_confidence"].lower()
    hourly=weather['hourly']
    

    #TOTAL SCORE CALCULATIONS
    score=100
    score-=cloud*0.7                  #Used 0.7 due to cloud's coverage affects stargaze in more amount
    score-=humidity*0.2               #Used 0.2 due to humidity affects stargaze in less amount
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
    best_time=best_slot["time"]
    best_window = f"{best_time} - {int(best_time[:2]) + 2}:00"
    

    bortle_class=estimate_bortle(lat,lon)
    #AI INPUTS 
    ai_input = {
    "score": score,
    "condition": condition,
    "cloud_cover": weather["cloud_cover"],
    "humidity": weather["humidity"],
    "moon_illumination": 30,   # TEMP
    "altitude_deg": 40,        # TEMP
    "bortle_class": 5,         # TEMP
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