from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PDF OCR Service"
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://api-gateway:3000",
        "http://frontend:3000"
    ]
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]
    UPLOAD_DIR: str = "uploads"
    TEMP_DIR: str = "temp"
    
    # OCR Configuration
    OCR_LANGUAGE: str = "en"
    OCR_USE_ANGLE_CLS: bool = True
    OCR_USE_GPU: bool = False
    OCR_DET_DB_THRESH: float = 0.3
    OCR_DET_DB_BOX_THRESH: float = 0.5
    OCR_DET_DB_UN_CLIP_RATIO: float = 1.6
    OCR_REC_BATCH_NUM: int = 6
    OCR_REC_CHAR_DICT_PATH: str = ""
    
    # Image Processing Configuration
    IMAGE_DPI: int = 300
    IMAGE_FORMAT: str = "PNG"
    IMAGE_QUALITY: int = 95
    
    # Processing Configuration
    BATCH_SIZE: int = 5
    MAX_WORKERS: int = 4
    TIMEOUT: int = 300  # 5 minutes
    
    # Redis Configuration (for async processing)
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0
    
    # Celery Configuration (for async processing)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True) 