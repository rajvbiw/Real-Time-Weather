from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import redis.asyncio as redis
import json
from contextlib import asynccontextmanager
from .config import settings

# Redis connection
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)
    yield
    await redis_client.close()

app = FastAPI(title="Weather Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/readyz")
async def readyz():
    try:
        await redis_client.ping()
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Service Unavailable: Redis not reachable")

@app.get("/api/weather/{city}")
async def get_weather(city: str):
    cache_key = f"weather:{city.lower()}"
    cached_data = await redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
        
    if not settings.openweathermap_api_key:
        # Return realistic mock data so the dashboard can be previewed without an API key!
        import time
        now = int(time.time())
        return {
            "current": {
                "name": city.title(),
                "sys": {"country": "Demo (No API Key)"},
                "weather": [{"description": "scattered clouds"}],
                "main": {
                    "temp": 23.5,
                    "feels_like": 24.1,
                    "temp_min": 20.0,
                    "temp_max": 26.5,
                    "humidity": 55
                },
                "wind": {"speed": 4.1, "gust": 5.5},
                "clouds": {"all": 40}
            },
            "forecast": {
                "list": [
                    {
                        "dt": now + 10800 * i, 
                        "main": {
                            "temp": 23.5 + (-1)**i * 2, 
                            "feels_like": 24.1 + (-1)**i * 2.5
                        }
                    } for i in range(1, 9)
                ]
            }
        }

    async with httpx.AsyncClient() as client:
        # Get coordinates
        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={settings.openweathermap_api_key}"
        geo_resp = await client.get(geo_url)
        geo_data = geo_resp.json()
        
        if not geo_data:
            raise HTTPException(status_code=404, detail="City not found")
            
        lat, lon = geo_data[0]["lat"], geo_data[0]["lon"]
        
        # Get weather
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={settings.openweathermap_api_key}&units=metric"
        weather_resp = await client.get(weather_url)
        weather_data = weather_resp.json()
        
        # Get 5-day forecast
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={settings.openweathermap_api_key}&units=metric"
        forecast_resp = await client.get(forecast_url)
        forecast_data = forecast_resp.json()
        
        result = {
            "current": weather_data,
            "forecast": forecast_data
        }
        
        # Cache for 10 minutes (600 seconds)
        await redis_client.setex(cache_key, 600, json.dumps(result))
        
        return result
