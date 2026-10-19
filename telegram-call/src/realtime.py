"""
Разговор с моделью по Realtime API.

Обычная связка «распознать → ответить текстом → озвучить» в звонке даёт
паузы по несколько секунд: человек успевает решить, что связь оборвалась.
Realtime API принимает звук потоком и отдаёт звук потоком, поэтому пауза
остаётся в пределах разговорной.

Формат с обеих сторон один и тот же — PCM16, 24 кГц, моно: столько же
отдаёт Telegram и столько же ждёт модель, пересчитывать нечего.
"""
import asyncio
import base64
import json
import logging

import aiohttp

from .actions import TOOLS, apply
from .config import config

log = logging.getLogger("realtime")

SAMPLE_RATE = 24000
# Telegram принимает звук кадрами по 10 мс. Для моно PCM16 это 480 байт.
FRAME_BYTES = SAMPLE_RATE // 100 * 2
SILENCE = b"\x00" * FRAME_BYTES
URL = "wss://api.openai.com/v1/realtime"

# Цены gpt-realtime-2.1-mini, доллары за миллион токенов.
# Бюджет маленький, поэтому расход считается по факту, а не на глаз.
PRICE = {
    "audio_in": 10.0,
    "audio_cached": 0.30,
    "text_cached": 0.06,
    "audio_out": 20.0,
    "text_in": 0.60,
    "text_out": 2.40,
}


class RealtimeSession:
    """Один разговор. Входящий звук отдаём методом, исходящий забираем из очереди."""

    def __init__(self, instructions: str) -> None:
        self.instructions = instructions
        self.outgoing: asyncio.Queue[bytes] = asyncio.Queue()
        # Человек заговорил — всё недосказанное надо выбросить, включая то,
        # что уже вынуто из очереди в буфер отправки.
        self.flush_requested = False
        self.actions: list[dict] = []
        # Пока ответ модели идёт, запрашивать новый нельзя: сервер отвечает
        # отказом. Когда вызовов несколько, второй и третий как раз в это
        # и упирались, и исход вызова оставался непроизнесённым.
        self._answering = False
        self._owed_answer = False
        # Человек сказал кодовое слово — договариваем и кладём трубку.
        self.should_end = False
        self.usage = {
            "audio_in": 0,
            "audio_cached": 0,
            "audio_out": 0,
            "text_in": 0,
            "text_cached": 0,
            "text_out": 0,
        }
        self._session: aiohttp.ClientSession | None = None
        self._ws: aiohttp.ClientWebSocketResponse | None = None
        self._reader: asyncio.Task | None = None
        self.closed = False

    async def start(self) -> None:
        if not config.ai_enabled:
            raise RuntimeError("ИИ выключен (AI_ENABLED=0), токены не тратятся. Включить — переменной AI_ENABLED=1 в Railway.")
        if not config.openai_key:
            raise RuntimeError("OPENAI_API_KEY не задан — разговаривать нечем")
        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=None, sock_read=None)
        )
        self._ws = await self._session.ws_connect(
            f"{URL}?model={config.realtime_model}",
            headers={"authorization": f"Bearer {config.openai_key}"},
            heartbeat=20,
        )
        await self._ws.send_json(
            {
                "type": "session.update",
                "session": {
                    "type": "realtime",
                    "output_modalities": ["audio"],
                    "instructions": self.instructions,
                    # Инструменты записи: без них разговор остаётся беседой,
                    # а сказанное никуда не попадает.
                    "tools": TOOLS,
                    "tool_choice": "auto",
                    "audio": {
                        "input": {
                            "format": {"type": "audio/pcm", "rate": SAMPLE_RATE},
                            # Полуавтоматическое определение конца фразы: модель ждёт,
                            # пока человек договорит, а не режет на первой паузе.
                            "turn_detection": {"type": "semantic_vad"},
                        },
                        "output": {
                            "format": {"type": "audio/pcm", "rate": SAMPLE_RATE},
                            "voice": config.realtime_voice,
                        },
                    },
                },
            }
        )
        self._reader = asyncio.create_task(self._read())
        # Звонит ассистент, значит и говорить первым должен он.
        await self._ws.send_json({"type": "response.create"})
        log.info("Разговор начат: модель %s, голос %s", config.realtime_model, config.realtime_voice)

    async def _read(self) -> None:
        try:
            async for message in self._ws:
                if message.type is not aiohttp.WSMsgType.TEXT:
                    continue
                event = json.loads(message.data)
                kind = event.get("type")
                if kind == "response.created":
                    self._answering = True
                elif kind == "response.output_audio.delta":
                    self.outgoing.put_nowait(base64.b64decode(event["delta"]))
                elif kind == "input_audio_buffer.speech_started":
                    # Человек заговорил — выбрасываем недосказанное,
                    # иначе ассистент продолжает говорить ему в ответ.
                    while not self.outgoing.empty():
                        self.outgoing.get_nowait()
                    self.flush_requested = True
                elif kind == "response.function_call_arguments.done":
                    # Вызов выполняем в отдельной задаче: чтение событий
                    # нельзя останавливать, иначе звук модели встанет.
                    asyncio.create_task(self._run_tool(event))
                elif kind == "response.done":
                    self._answering = False
                    self._count(event.get("response", {}).get("usage"))
                    if self._owed_answer:
                        self._owed_answer = False
                        await self._ws.send_json({"type": "response.create"})
                elif kind == "error":
                    log.error("Ошибка Realtime: %s", event.get("error"))
        except asyncio.CancelledError:
            raise
        except Exception as error:  # noqa: BLE001 — разговор важнее исключения
            log.error("Чтение Realtime прервано: %s", error)

    async def _run_tool(self, event: dict) -> None:
        """Выполняет вызов инструмента и возвращает модели исход."""
        name = event.get("name", "")
        call_id = event.get("call_id", "")
        try:
            arguments = json.loads(event.get("arguments") or "{}")
        except json.JSONDecodeError:
            arguments = {}
        self.actions.append({"действие": name, "аргументы": arguments})
        if name == "end_call":
            self.should_end = True
        try:
            result = await apply(name, arguments)
        except Exception as error:  # noqa: BLE001 — молчать об отказе нельзя
            log.error("Инструмент %s не отработал: %s", name, error)
            result = "Не записано: внутренняя ошибка"
        if self.closed or not self._ws or self._ws.closed:
            return
        await self._ws.send_json(
            {
                "type": "conversation.item.create",
                "item": {
                    "type": "function_call_output",
                    "call_id": call_id,
                    "output": result,
                },
            }
        )
        # Без ответа модель молчит: исход вызова сам речью не станет. Но
        # просить ответ поверх идущего нельзя — тогда дождёмся его конца.
        if self.should_end:
            # Прощание уже сказано, добавлять нечего.
            return
        if self._answering:
            self._owed_answer = True
        else:
            await self._ws.send_json({"type": "response.create"})

    def _count(self, usage: dict | None) -> None:
        """Складывает токены ответа. Без этого стоимость разговора — догадка."""
        if not usage:
            return
        incoming = usage.get("input_token_details") or {}
        outgoing = usage.get("output_token_details") or {}
        cached_details = incoming.get("cached_tokens_details") or {}
        cached_audio = cached_details.get("audio_tokens", 0)
        cached_text = cached_details.get("text_tokens", 0)
        # Кэшированные токены считаются отдельно: звук дешевле в тридцать
        # раз, текст — в десять. Без этого расход завышается в разы.
        self.usage["audio_cached"] += cached_audio
        self.usage["audio_in"] += max(0, incoming.get("audio_tokens", 0) - cached_audio)
        self.usage["text_cached"] += cached_text
        self.usage["text_in"] += max(0, incoming.get("text_tokens", 0) - cached_text)
        self.usage["audio_out"] += outgoing.get("audio_tokens", 0)
        self.usage["text_out"] += outgoing.get("text_tokens", 0)

    def cost(self) -> dict:
        dollars = sum(self.usage[key] * PRICE[key] / 1_000_000 for key in PRICE)
        return {"токены": dict(self.usage), "доллары": round(dollars, 4)}

    async def notify(self, text: str) -> None:
        """
        Служебная реплика модели — например, что время на исходе.
        Текстом, а не голосом: человек её не слышит, она только для модели.
        """
        if self.closed or not self._ws or self._ws.closed:
            return
        try:
            await self._ws.send_json(
                {
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message",
                        "role": "system",
                        "content": [{"type": "input_text", "text": text}],
                    },
                }
            )
        except Exception as error:  # noqa: BLE001 — предупреждение не главное
            log.warning("Служебная реплика не ушла: %s", error)

    async def send_audio(self, pcm: bytes) -> None:
        if self.closed or not self._ws or self._ws.closed:
            return
        try:
            await self._ws.send_json(
                {
                    "type": "input_audio_buffer.append",
                    "audio": base64.b64encode(pcm).decode("ascii"),
                }
            )
        except Exception as error:  # noqa: BLE001 — обрыв не должен валить звонок
            log.warning("Звук не ушёл в модель: %s", error)

    async def close(self) -> None:
        self.closed = True
        if self._reader:
            self._reader.cancel()
        if self._ws and not self._ws.closed:
            await self._ws.close()
        if self._session:
            await self._session.close()
