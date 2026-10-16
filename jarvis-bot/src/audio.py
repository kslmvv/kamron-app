"""
Перекладка звука между форматами.

Telegram показывает сообщение голосовым только если это OGG с кодеком
Opus; любой другой формат прилетит файлом, который нужно скачивать.
Озвучка приходит в WAV, поэтому между ними всегда стоит ffmpeg.
"""
import asyncio
import logging
import os

log = logging.getLogger("audio")


async def _run(*args: str) -> None:
    process = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.PIPE,
    )
    _, err = await process.communicate()
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg: {err.decode('utf-8', 'ignore')[:300]}")


async def to_voice(src: str, dst: str) -> None:
    """WAV → OGG/Opus. Моно 24 кГц и 32 кбит/с: речь, а не музыка."""
    await _run(
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", src,
        "-c:a", "libopus", "-b:a", "32k", "-ar", "24000", "-ac", "1",
        "-application", "voip",
        dst,
    )


async def duration(path: str) -> float:
    """Длительность в секундах. Нужна, чтобы считать деньги и резать длинное."""
    process = await asyncio.create_subprocess_exec(
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )
    out, _ = await process.communicate()
    try:
        return float(out.decode().strip())
    except ValueError:
        return 0.0


def cleanup(*paths: str) -> None:
    for path in paths:
        try:
            os.remove(path)
        except OSError:
            pass


async def to_mp3(src: str, dst: str) -> None:
    """
    Любой вход → mp3 16 кГц моно.

    Телеграм отдаёт голосовое как .oga (Opus в контейнере Ogg). Отправлять
    его в распознавание как есть рискованно: формат принимается не всегда,
    а ошибка вылезет уже на живом сообщении. Перекладка стоит ничего и
    заодно уменьшает файл.
    """
    await _run(
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", src,
        "-ar", "16000", "-ac", "1", "-b:a", "48k",
        dst,
    )
