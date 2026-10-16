"""
Тонкий клиент Telegram Bot API.

Длинный опрос, а не вебхук: боту не нужен публичный адрес, и один
исходящий запрос надёжнее, чем входящий через чужой прокси.
"""
import asyncio
import logging

import os

import aiohttp

from .config import config

log = logging.getLogger("telegram")
# Адрес вынесен в переменную не ради гибкости, а ради проверки: сквозной
# тест поднимает поддельный Telegram и направляет бота на него.
API = os.environ.get("TELEGRAM_API", "https://api.telegram.org")


class Telegram:
    def __init__(self) -> None:
        self.session: aiohttp.ClientSession | None = None

    async def start(self) -> None:
        timeout = aiohttp.ClientTimeout(total=90)
        self.session = aiohttp.ClientSession(timeout=timeout)

    async def stop(self) -> None:
        if self.session:
            await self.session.close()
            self.session = None

    def _url(self, method: str) -> str:
        return f"{API}/bot{config.bot_token}/{method}"

    async def call(self, method: str, **params):
        assert self.session
        async with self.session.post(self._url(method), json=params) as response:
            data = await response.json()
        if not data.get("ok"):
            raise RuntimeError(f"{method}: {data.get('description')}")
        return data.get("result")

    async def updates(self, offset: int, timeout: int = 50) -> list[dict]:
        """Один цикл опроса. Сетевые сбои здесь обычны и не должны ронять бота."""
        try:
            return await self.call(
                "getUpdates",
                offset=offset,
                timeout=timeout,
                allowed_updates=["message"],
            )
        except asyncio.TimeoutError:
            return []
        except Exception as error:
            log.warning("Опрос не удался: %s", error)
            await asyncio.sleep(3)
            return []

    async def send(self, chat: int, text: str) -> None:
        await self.call("sendMessage", chat_id=chat, text=text[:4000])

    async def typing(self, chat: int, action: str = "typing") -> None:
        try:
            await self.call("sendChatAction", chat_id=chat, action=action)
        except Exception:
            pass

    async def send_voice(self, chat: int, path: str, caption: str = "") -> None:
        """Голосовое уходит как multipart — файл, а не ссылка."""
        assert self.session
        form = aiohttp.FormData()
        form.add_field("chat_id", str(chat))
        if caption:
            form.add_field("caption", caption[:1000])
        with open(path, "rb") as f:
            form.add_field("voice", f, filename="jarvis.ogg", content_type="audio/ogg")
            async with self.session.post(self._url("sendVoice"), data=form) as response:
                data = await response.json()
        if not data.get("ok"):
            raise RuntimeError(f"sendVoice: {data.get('description')}")

    async def download(self, file_id: str, path: str) -> int:
        """Качает файл пользователя. Возвращает размер в байтах."""
        assert self.session
        info = await self.call("getFile", file_id=file_id)
        url = f"{API}/file/bot{config.bot_token}/{info['file_path']}"
        async with self.session.get(url) as response:
            response.raise_for_status()
            data = await response.read()
        with open(path, "wb") as f:
            f.write(data)
        return len(data)


telegram = Telegram()
