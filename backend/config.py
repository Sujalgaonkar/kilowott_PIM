from pydantic import BaseModel, Field
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    # Server config
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    # WooCommerce configuration
    # By default, mock mode is active unless valid non-placeholder credentials are provided.
    wc_url: str = Field(default_factory=lambda: os.getenv("WC_URL", ""))
    wc_consumer_key: str = Field(default_factory=lambda: os.getenv("WC_CONSUMER_KEY", ""))
    wc_consumer_secret: str = Field(default_factory=lambda: os.getenv("WC_CONSUMER_SECRET", ""))
    force_mock_wc: bool = Field(default_factory=lambda: os.getenv("FORCE_MOCK_WC", "true").lower() in ("true", "1", "yes"))

    @property
    def is_real_wc_configured(self) -> bool:
        if self.force_mock_wc:
            return False
        return bool(self.wc_url and self.wc_consumer_key and self.wc_consumer_secret)

    # LLM configuration (Gemini / OpenAI / Fallback mock generator)
    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", "")))
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))

    # Maximum retries for Quality Agent -> Enrichment Agent cycle
    max_agent_retries: int = 2

settings = Settings()
