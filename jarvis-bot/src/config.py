"""Настройки бота. Всё из переменных окружения — секретов в коде нет."""
import os


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, "") or default)
    except ValueError:
        return default


def _float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, "") or default)
    except ValueError:
        return default


class Config:
    port = _int("PORT", 8080)

    bot_token = os.environ.get("BOT_TOKEN", "")
    openai_key = os.environ.get("OPENAI_API_KEY", "")

    # Какими моделями работаем. Вынесено в переменные, чтобы менять без правки кода.
    brain_model = os.environ.get("BRAIN_MODEL", "gpt-4o-mini")
    stt_model = os.environ.get("STT_MODEL", "gpt-4o-mini-transcribe")
    tts_model = os.environ.get("TTS_MODEL", "gpt-4o-mini-tts")
    tts_voice = os.environ.get("TTS_VOICE", "onyx")

    # Приложение держит данные в браузере, поэтому обмен идёт через сервер.
    jarvis_url = os.environ.get("JARVIS_URL", "")
    jarvis_token = os.environ.get("JARVIS_TOKEN", "")

    # Предохранители. Баланс маленький, и один сорвавшийся цикл не должен
    # съесть его за ночь. Потолок проверяется перед каждым платным вызовом.
    max_day_cost = _float("MAX_DAY_COST", 0.25)
    max_voice_seconds = _int("MAX_VOICE_SECONDS", 120)
    max_reply_chars = _int("MAX_REPLY_CHARS", 420)

    # Цены за единицу — для счётчика расхода. Меняются вместе с прайсом OpenAI.
    price_stt_min = _float("PRICE_STT_MIN", 0.003)
    price_tts_min = _float("PRICE_TTS_MIN", 0.015)
    price_brain_in = _float("PRICE_BRAIN_IN", 0.15)    # за 1M токенов
    price_brain_out = _float("PRICE_BRAIN_OUT", 0.60)  # за 1M токенов

    # Сам пишет голосом в течение дня: напоминает перед делом, в начале
    # свободного окна и когда дело вот-вот закроется. Потолок — чтобы в
    # плотный день он не завалил переписку.
    nudge_enabled = os.environ.get("NUDGE_ENABLED", "1") not in ("0", "false", "")
    nudge_max = _int("NUDGE_MAX", 8)
    nudge_before = _int("NUDGE_BEFORE_MIN", 10)
    quiet_from = os.environ.get("QUIET_FROM", "23:00")
    quiet_to = os.environ.get("QUIET_TO", "06:20")

    # Когда бот пишет сам.
    morning_at = os.environ.get("MORNING_AT", "06:35")
    evening_at = os.environ.get("EVENING_AT", "21:30")
    timezone = os.environ.get("TIMEZONE", "Asia/Tashkent")
    schedule_enabled = os.environ.get("SCHEDULE_ENABLED", "1") not in ("0", "false", "")

    data_dir = os.environ.get("DATA_DIR", "/data")

    @classmethod
    def missing(cls) -> list[str]:
        pairs = {"BOT_TOKEN": cls.bot_token, "OPENAI_API_KEY": cls.openai_key}
        return [name for name, value in pairs.items() if not value]


config = Config
