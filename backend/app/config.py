from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openweathermap_api_key: str = ""
    redis_host: str = "redis"
    redis_port: int = 6379

    class Config:
        env_file = ".env"

settings = Settings()
