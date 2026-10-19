"""Озвучка реплики. Телефон принимает звук, поэтому текст превращается в файл."""
import aiohttp
from .config import config


async def synthesize(text: str, path: str) -> None:
    """Сохраняет озвученный текст в файл. Формат wav — его читает ffmpeg без плясок."""
    if not config.ai_enabled:
        raise RuntimeError("ИИ выключен (AI_ENABLED=0), токены не тратятся. Включить — переменной AI_ENABLED=1 в Railway.")
    if not config.openai_key:
        raise RuntimeError("OPENAI_API_KEY не задан — озвучивать нечем")
    payload = {
        "model": config.tts_model,
        "voice": config.tts_voice,
        "input": text[:2000],
        "response_format": "wav",
    }
    timeout = aiohttp.ClientTimeout(total=60)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            "https://api.openai.com/v1/audio/speech",
            headers={"authorization": f"Bearer {config.openai_key}"},
            json=payload,
        ) as response:
            if response.status != 200:
                detail = (await response.text())[:300]
                raise RuntimeError(f"Озвучка не удалась ({response.status}): {detail}")
            data = await response.read()
    with open(path, "wb") as f:
        f.write(data)
