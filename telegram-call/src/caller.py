"""
Исходящий личный звонок в Telegram.

Бот звонить не может: метод начала личного вызова доступен только
пользовательскому аккаунту. Поэтому здесь MTProto-клиент отдельного
аккаунта-помощника, а звук в разговор подаёт pytgcalls.

Поведение намеренно скромное: дозвониться, проиграть одну реплику,
положить трубку и честно сказать, чем всё кончилось.
"""
import asyncio
import logging
import os
import tempfile
import traceback
from datetime import date

from pytgcalls import PyTgCalls
from pytgcalls.types import CallConfig, MediaStream
from telethon import TelegramClient
from telethon.sessions import StringSession

from .config import config
from .speech import synthesize

log = logging.getLogger("caller")


class Caller:
    def __init__(self) -> None:
        self.client: TelegramClient | None = None
        self.calls: PyTgCalls | None = None
        self.me = None
        self._day = ""
        self._today_calls = 0
        self._busy = asyncio.Lock()

    async def start(self) -> None:
        if not config.ready():
            return
        self.client = TelegramClient(
            StringSession(config.session), config.api_id, config.api_hash
        )
        await self.client.start()
        self.me = await self.client.get_me()
        self.calls = PyTgCalls(self.client)

        # Пустой TelegramServerError ничего не объясняет, поэтому слушаем
        # собственные события библиотеки: по ним видно, на каком шаге встал звонок.
        @self.calls.on_update()
        async def _trace(client, update):  # noqa: ANN001 — тип приходит из библиотеки
            log.info("Событие звонка: %s | %s", type(update).__name__, update)

        await self.calls.start()

    @property
    def authorized(self) -> bool:
        return self.me is not None

    def _roll(self) -> None:
        today = date.today().isoformat()
        if self._day != today:
            self._day = today
            self._today_calls = 0

    def quota(self) -> dict:
        self._roll()
        return {
            "звонков_сегодня": self._today_calls,
            "предел_в_сутки": config.max_calls_per_day,
            "предел_длительности_сек": config.max_call_seconds,
        }

    async def call_and_say(self, text: str) -> dict:
        """Звонит адресату и проигрывает реплику. Возвращает исход попытки."""
        if not self.authorized:
            raise RuntimeError("Аккаунт-помощник не авторизован")
        self._roll()
        if self._today_calls >= config.max_calls_per_day:
            raise RuntimeError(
                f"Дневной предел звонков исчерпан ({config.max_calls_per_day})"
            )
        if self._busy.locked():
            raise RuntimeError("Звонок уже идёт")

        async with self._busy:
            # Счётчик увеличиваем ДО набора: обрыв связи или перезапуск
            # не должен позволить позвонить второй раз за ту же попытку.
            self._today_calls += 1
            target = await self.client.get_entity(config.target)
            path = os.path.join(tempfile.gettempdir(), "phrase.wav")
            await synthesize(text, path)

            log.info("Звоню %s, файл %s", target.id, path)
            started = asyncio.get_running_loop().time()
            try:
                await self.calls.play(
                    target.id, MediaStream(path), config=CallConfig()
                )
            except Exception as error:  # noqa: BLE001 — исход нужен вызывающему целиком
                log.error("Звонок не поднялся:\n%s", traceback.format_exc())
                return {
                    "дозвонился": False,
                    "причина": f"{type(error).__name__}: {error}" or type(error).__name__,
                    "подробности": "смотрите логи сервиса",
                    "квота": self.quota(),
                }

            # Ждём конца реплики, но не дольше предела: зависший звонок
            # не должен висеть на линии и жечь минуты.
            # calls — асинхронное свойство: словарь активных звонков по chat_id.
            while asyncio.get_running_loop().time() - started < config.max_call_seconds:
                await asyncio.sleep(1)
                active = await self.calls.calls
                if target.id not in active:
                    log.info("Звонок завершился сам через %.1f с", asyncio.get_running_loop().time() - started)
                    break
            await self.hang_up(target.id)
            return {
                "дозвонился": True,
                "секунд": round(asyncio.get_running_loop().time() - started, 1),
                "квота": self.quota(),
            }

    async def hang_up(self, chat_id: int) -> None:
        try:
            await self.calls.leave_call(chat_id)
        except Exception:  # noqa: BLE001 — класть трубку можно только один раз
            pass


caller = Caller()
