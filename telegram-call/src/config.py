"""Настройки сервиса звонков. Всё из переменных окружения — секретов в коде нет."""
import os


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, "") or default)
    except ValueError:
        return default


class Config:
    port = _int("PORT", 8080)
    access_token = os.environ.get("APP_ACCESS_TOKEN", "")

    api_id = _int("TG_API_ID", 0)
    api_hash = os.environ.get("TG_API_HASH", "")
    session = os.environ.get("TG_SESSION", "")
    target = os.environ.get("TG_TARGET", "")

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    tts_model = os.environ.get("TTS_MODEL", "gpt-4o-mini-tts")
    tts_voice = os.environ.get("TTS_VOICE", "alloy")

    # Звонок будит человека, поэтому предохранители жёсткие и заданы по умолчанию,
    # а не «когда-нибудь настроим».
    max_calls_per_day = _int("MAX_CALLS_PER_DAY", 6)
    max_call_seconds = _int("MAX_CALL_SECONDS", 90)

    @classmethod
    def ready(cls) -> bool:
        return bool(cls.api_id and cls.api_hash and cls.session and cls.target)

    @classmethod
    def missing(cls) -> list[str]:
        pairs = {
            "APP_ACCESS_TOKEN": cls.access_token,
            "TG_API_ID": cls.api_id,
            "TG_API_HASH": cls.api_hash,
            "TG_SESSION": cls.session,
            "TG_TARGET": cls.target,
            "OPENAI_API_KEY": cls.openai_key,
        }
        return [name for name, value in pairs.items() if not value]


config = Config
