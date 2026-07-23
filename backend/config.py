import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "studybuddy-secret-key-change-in-production-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "studybuddy-jwt-secret-key-super-secure")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/studybuddy")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    PORT = int(os.getenv("PORT", 5000))
