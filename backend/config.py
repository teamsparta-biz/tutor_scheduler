from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    NOTION_TOKEN: str = ""
    NOTION_DB_LECTURE: str = ""
    NOTION_DB_SCHEDULE: str = ""
    NOTION_DB_TUTOR: str = ""
    SUPABASE_JWT_SECRET: str = ""
    PORT: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
