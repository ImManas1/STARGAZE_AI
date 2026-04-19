import httpx
import os

BASE_URL = "http://api.openweathermap.org/geo/1.0/direct"
API_KEY = os.getenv("OPENWEATHER_API_KEY")

FALLBACK_CITIES={
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.7041, 77.1025),
    "pune": (18.5204, 73.8567),
    "bangalore": (12.9716, 77.5946),
}

async def city_to_latlon(city:str)->tuple[float,float]:
    try:
        async with httpx.AsyncClient() as client:
            r=await client.get(
                BASE_URL,
                params={
                    "q":city,
                    "limit":1,
                    "appid":API_KEY
                }
            )
            r.raise_for_status()
            data=r.json()
        
        if not data:
            raise ValueError("City not found")
        return {
            "lat":data[0]["lat"],
            "lon":data[0]["lon"],
            "name":data[0]["name"],
            "country":data[0].get("country","?")
        }
    except Exception as e:
        print("GEOCODER ERROR : ",e)
        
        city_lower=city.lower()
        if city_lower in FALLBACK_CITIES:
            print("Using fallback city: ",city_lower)
            return FALLBACK_CITIES[city_lower]
        
        raise ValueError(f"City not found : {city}")