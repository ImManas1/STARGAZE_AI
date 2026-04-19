import os , httpx
from contracts import CONFIDENCE_HIGH , CONFIDENCE_MEDIUM , CONFIDENCE_LOW

OPENWEATHER_KEY=os.getenv("OPENWEATHER_API_KEY")
BASE_URL = 'https://api.openweathermap.org/data/2.5'

async def get_weather_data(lat:float , lon:float)->dict:
    async with httpx.AsyncClient() as client :
        r=await client.get(
            f'{BASE_URL}/forecast',
            params={
                'lat':lat,
                'lon':lon,  
                'appid':OPENWEATHER_KEY,
                'units':'metric',
            }
        )
        r.raise_for_status()
        data=r.json()
    current=data['list'][0]
    cloud_cover=current['clouds']['all']
    humidity=current['main']['humidity']
    
    hourly=[]
    for slot in data['list'][:24]:
        hourly.append({
            'time': slot['dt_txt'][11:16],
            'cloud_cover':slot['clouds']['all'],
            'humidity':slot['main']['humidity'],
        })
    
    hours_out=3
    if hours_out < 6:
        fc=CONFIDENCE_HIGH
    elif hours_out < 24:
        fc=CONFIDENCE_MEDIUM
    else:
        fc=CONFIDENCE_LOW
    return{
        'cloud_cover': cloud_cover,
        'humidity': humidity,
        'hourly': hourly,
        'hours_out': hours_out,
        'forecast_confidence': fc,
        
    }