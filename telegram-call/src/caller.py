"""
Исходящий личный звонок в Telegram.

Бот звонить не может: метод начала личного вызова доступен только
пользовательскому аккаунту. Поэтому здесь MTProto-клиент отдельного
аккаунта-помощника, а звук в разговор подаёт pytgcalls.

Два режима. call_and_say — дозвониться и проиграть одну озвученную
реплику; осталось для проверки связи, потому что стоит копейки.
talk — живой разговор: звук с линии уходит модели, звук модели уходит
в линию. Разговор дороже на два порядка, поэтому пределы жёсткие.
"""
import asyncio
import logging
import os
import tempfile
import traceback

from pytgcalls import PyTgCalls
from pytgcalls.types import (
    CallConfig,
    Device,
    Direction,
    ExternalMedia,
    MediaStream,
    RecordStream,
    StreamFrames,
)
from pytgcalls.types.raw import AudioParameters
from telethon import TelegramClient
from telethon.sessions import StringSession

from .brief import fetch_snapshot, instructions_for
from .config import config
from .realtime import FRAME_BYTES, SAMPLE_RATE, SILENCE, RealtimeSession
from .state import state
from .speech import synthesize

log = logging.getLogger("caller")


class Caller:
    def __init__(self) -> None:
        self.client: TelegramClient | None = None
        self.calls: PyTgCalls | None = None
        self.me = None
        self.session: RealtimeSession | None = None
        self._frames_seen = False
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
        async def _handle(client, update):  # noqa: ANN001 — тип приходит из библиотеки
            # Кадры звука идут десятками в секунду — их не логируем,
            # а сразу передаём модели.
            if isinstance(update, StreamFrames):
                # Кадры звука идут сотнями в секунду — их не логируем,
                # а сразу передаём модели.
                #
                # Отбираем по направлению, а не по устройству. При записи
                # входящий поток кладётся в тот же слот микрофона, что и
                # исходящий: различает их только направление. Фильтр по
                # динамику не пропускал ни одного кадра — модель говорила,
                # но собеседника не слышала. Видео мы не записываем, поэтому
                # всё входящее — это звук.
                session = self.session
                if session and (update.direction & Direction.INCOMING):
                    if not self._frames_seen:
                        self._frames_seen = True
                        log.info(
                            "Первый кадр с линии: %s | %s | %d байт",
                            update.direction,
                            update.device,
                            len(update.frames[0].frame) if update.frames else 0,
                        )
                    for frame in update.frames:
                        await session.send_audio(frame.frame)
                return
            log.info("Событие звонка: %s | %s", type(update).__name__, update)

        await self.calls.start()

    @property
    def authorized(self) -> bool:
        return self.me is not None

    def quota(self) -> dict:
        state.roll()
        return {
            "звонков_сегодня": state.calls,
            "предел_в_сутки": config.max_calls_per_day,
            "предел_длительности_сек": config.max_call_seconds,
            "предел_разговора_сек": config.max_talk_seconds,
            "расход_сегодня_долларов": round(state.cost, 4),
            "счёт_на_диске": state.persistent,
        }

    async def call_and_say(self, text: str) -> dict:
        """Звонит адресату и проигрывает реплику. Возвращает исход попытки."""
        if not self.authorized:
            raise RuntimeError("Аккаунт-помощник не авторизован")
        state.roll()
        if state.calls >= config.max_calls_per_day:
            raise RuntimeError(
                f"Дневной предел звонков исчерпан ({config.max_calls_per_day})"
            )
        if self._busy.locked():
            raise RuntimeError("Звонок уже идёт")

        async with self._busy:
            # Счётчик увеличиваем ДО набора: обрыв связи или перезапуск
            # не должен позволить позвонить второй раз за ту же попытку.
            state.add_call()
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

    async def _dial(self, chat_id: int) -> None:
        """
        Поднимает звонок с внешним звуком.

        ExternalMedia встаёт не всегда: в ntgcalls есть известная беда —
        вызов звонит, его принимают, а медиаканал не соединяется, и через
        десять секунд приходит пустой TelegramServerError. Помогает только
        повторный набор. Это один звонок по квоте, а не три.

        Пауза между попытками длинная не от лени: сразу после сорванного
        звонка Telegram ещё держит номер занятым и отвечает CallBusy.
        """
        last = None
        for attempt in range(1, 4):
            if attempt > 1:
                pause = 25
                log.info("Жду %d с, прежде чем набрать снова", pause)
                await asyncio.sleep(pause)
                # Остатки прошлой попытки держат номер занятым.
                await self.hang_up(chat_id)
            try:
                await self.calls.play(
                    chat_id,
                    MediaStream(
                        ExternalMedia.AUDIO,
                        audio_parameters=AudioParameters(SAMPLE_RATE, 1),
                    ),
                    config=CallConfig(),
                )
                await self.calls.record(
                    chat_id,
                    RecordStream(audio=True, audio_parameters=AudioParameters(SAMPLE_RATE, 1)),
                )
                if attempt > 1:
                    log.info("Соединение поднялось с %d-й попытки", attempt)
                return
            except Exception as error:  # noqa: BLE001 — решение принимаем по исходу
                last = error
                log.warning(
                    "Попытка %d не удалась: %s: %s", attempt, type(error).__name__, error
                )
                await self.hang_up(chat_id)
        raise last

    async def _pump(self, chat_id: int, session: RealtimeSession, deadline: float) -> float:
        """
        Подаёт звук модели в линию и следит за пределами.

        Кадры уходят ровно по 10 мс в реальном времени: микрофон работает
        именно так, и «отдать всё сразу» в линию нельзя. Когда модель молчит,
        уходит тишина — поток не должен прерываться.

        Возвращает, сколько секунд говорила модель.
        """
        loop = asyncio.get_running_loop()
        buffer = bytearray()
        spoke = 0.0
        next_frame = loop.time()
        frames = 0
        while True:
            if loop.time() > deadline:
                log.info("Предел разговора %s с достигнут", config.max_talk_seconds)
                break
            # Раз в секунду проверяем, не положил ли собеседник трубку:
            # делать это на каждом кадре — сто проверок в секунду.
            if frames % 100 == 0 and chat_id not in await self.calls.calls:
                log.info("Собеседник положил трубку")
                break
            if session.flush_requested:
                buffer.clear()
                session.flush_requested = False
            while not session.outgoing.empty():
                buffer += session.outgoing.get_nowait()
            if len(buffer) >= FRAME_BYTES:
                chunk = bytes(buffer[:FRAME_BYTES])
                del buffer[:FRAME_BYTES]
                spoke += 0.01
            else:
                chunk = SILENCE
            try:
                await self.calls.send_frame(chat_id, Device.MICROPHONE, chunk)
            except Exception as error:  # noqa: BLE001 — обрыв линии виден здесь
                log.info("Линия закрылась: %s: %s", type(error).__name__, error)
                break
            frames += 1
            next_frame += 0.01
            delay = next_frame - loop.time()
            if delay > 0:
                await asyncio.sleep(delay)
            else:
                # Отстали — долг не копим, иначе дальше полетит скороговорка.
                next_frame = loop.time()
        return spoke

    async def talk(self, kind: str) -> dict:
        """
        Живой разговор. Звук с линии уходит модели, звук модели — в линию.

        Пределы здесь не декоративные: разговор стоит минут, а звонок будит
        человека. Счётчик растёт до набора, а длительность режется по
        max_talk_seconds независимо от того, договорила модель или нет.
        """
        if not self.authorized:
            raise RuntimeError("Аккаунт-помощник не авторизован")
        if kind not in ("morning", "evening"):
            raise RuntimeError("Вид звонка: morning или evening")
        state.roll()
        if state.calls >= config.max_calls_per_day:
            raise RuntimeError(f"Дневной предел звонков исчерпан ({config.max_calls_per_day})")
        if self._busy.locked():
            raise RuntimeError("Звонок уже идёт")

        async with self._busy:
            # Счётчик увеличиваем ДО набора: обрыв связи или перезапуск
            # не должен позволить позвонить второй раз за ту же попытку.
            state.add_call()
            target = await self.client.get_entity(config.target)
            snapshot, age = await fetch_snapshot()
            session = RealtimeSession(instructions_for(kind, snapshot, age))
            self._frames_seen = False
            loop = asyncio.get_running_loop()
            started = loop.time()
            try:
                await session.start()
            except Exception as error:  # noqa: BLE001 — без модели звонить незачем
                log.error("Модель недоступна:\n%s", traceback.format_exc())
                await session.close()
                return {
                    "дозвонился": False,
                    "причина": f"{type(error).__name__}: {error}",
                    "квота": self.quota(),
                }

            self.session = session
            try:
                await self._dial(target.id)
            except Exception as error:  # noqa: BLE001 — исход нужен вызывающему целиком
                log.error("Разговор не начался:\n%s", traceback.format_exc())
                await session.close()
                self.session = None
                return {
                    "дозвонился": False,
                    "причина": f"{type(error).__name__}: {error}",
                    "подробности": "смотрите логи сервиса",
                    "квота": self.quota(),
                }

            try:
                spoke = await self._pump(
                    target.id, session, started + config.max_talk_seconds
                )
            finally:
                await session.close()
                self.session = None
                await self.hang_up(target.id)

            spend = session.cost()
            state.add_cost(spend["доллары"])
            return {
                "дозвонился": True,
                "вид": kind,
                "секунд": round(loop.time() - started, 1),
                "секунд_речи_модели": round(spoke, 1),
                "снимок_минут": age,
                "записано": session.actions,
                "расход": spend,
                "квота": self.quota(),
            }

    async def hang_up(self, chat_id: int) -> None:
        try:
            await self.calls.leave_call(chat_id)
        except Exception:  # noqa: BLE001 — класть трубку можно только один раз
            pass


caller = Caller()
