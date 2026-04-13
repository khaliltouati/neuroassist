import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/neuroassist")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-to-a-long-random-string")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))
    MODEL_PATH: str = os.getenv("MODEL_PATH", "ai_model/weights/brain_tumor_classifier.keras")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    HEATMAP_DIR: str = os.getenv("HEATMAP_DIR", "heatmaps")


settings = Settings()
