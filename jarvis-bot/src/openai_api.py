"""
Три обращения к OpenAI: расслышать, подумать, озвучить.

Каждое платное, поэтому каждое возвращает ещё и цену — счётчик расхода
живёт на реальных числах, а не на догадках. Там, где API не сообщает
объём (озвучка), цена считается по длительности файла и помечается как
оценка.
"""
import json
import logging
import os

import aiohttp

from .config import config

log = logging.getLogger("openai")
# Как и у Telegram: подменяется в тесте на поддельный сервер.
BASE = os.environ.get("OPENAI_BASE", "https://api.openai.com/v1")


def _headers() -> dict:
    return {"authorization": f"Bearer {config.openai_key}"}


async def transcribe(path: str, seconds: float) -> tuple[str, float]:
    """Голосовое → текст. Возвращает текст и стоимость."""
    form = aiohttp.FormData()
    form.add_field("model", config.stt_model)
    form.add_field("language", "ru")
    with open(path, "rb") as f:
        form.add_field("file", f, filename="voice.mp3", content_type="audio/mpeg")
        timeout = aiohttp.ClientTimeout(total=120)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(
                f"{BASE}/audio/transcriptions", headers=_headers(), data=form
            ) as response:
                body = await response.text()
                if response.status != 200:
                    raise RuntimeError(f"Расшифровка не удалась ({response.status}): {body[:300]}")
                data = json.loads(body)
    cost = (seconds / 60.0) * config.price_stt_min
    return (data.get("text") or "").strip(), cost


async def think(messages: list[dict], tools: list[dict]) -> tuple[dict, float]:
    """Ответ модели вместе с вызовами инструментов. Цена — по фактическим токенам."""
    payload = {
        "model": config.brain_model,
        "messages": messages,
        "max_tokens": 500,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"
    timeout = aiohttp.ClientTimeout(total=90)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            f"{BASE}/chat/completions", headers=_headers(), json=payload
        ) as response:
            body = await response.text()
            if response.status != 200:
                raise RuntimeError(f"Модель не ответила ({response.status}): {body[:300]}")
            data = json.loads(body)
    usage = data.get("usage") or {}
    cost = (
        usage.get("prompt_tokens", 0) / 1_000_000 * config.price_brain_in
        + usage.get("completion_tokens", 0) / 1_000_000 * config.price_brain_out
    )
    return data["choices"][0]["message"], cost


async def speak(text: str, path: str) -> None:
    """Текст → WAV. В OGG его переложит ffmpeg: Telegram принимает только его."""
    payload = {
        "model": config.tts_model,
        "voice": config.tts_voice,
        "input": text[: config.max_reply_chars],
        "response_format": "wav",
        "instructions": (
            "Говори спокойно и собранно, как помощник, который следит за временем. "
            "Без театральности, без восторга. Ровный темп, короткие паузы между мыслями."
        ),
    }
    timeout = aiohttp.ClientTimeout(total=120)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            f"{BASE}/audio/speech", headers=_headers(), json=payload
        ) as response:
            if response.status != 200:
                detail = (await response.text())[:300]
                raise RuntimeError(f"Озвучка не удалась ({response.status}): {detail}")
            data = await response.read()
    with open(path, "wb") as f:
        f.write(data)
