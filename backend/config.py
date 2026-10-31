import os
import tempfile
from typing import List, Union
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

# Explicitly load .env from the backend directory
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

def get_default_db_url() -> str:
    if os.getenv("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    # Check if running in Vercel or serverless (read-only filesystem)
    is_serverless = (
        bool(os.getenv("VERCEL"))
        or bool(os.getenv("VERCEL_ENV"))
        or bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
        or not os.access(".", os.W_OK)
    )
    if is_serverless:
        tmp_dir = tempfile.gettempdir().replace("\\", "/")
        return f"sqlite+aiosqlite:///{tmp_dir}/aivoa.db"
    return "sqlite+aiosqlite:///./aivoa.db"

class Settings(BaseSettings):
    APP_NAME: str = "AIVOA.AI - Root Cause Analysis (RCA) Module"
    APP_VERSION: str = "1.0.0"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    DATABASE_URL: str = get_default_db_url()
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = {
        "env_file": env_path,
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
