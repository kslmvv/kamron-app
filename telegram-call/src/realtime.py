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

from .config import config

log = logging.getLogger("realtime")

SAMPLE_RATE = 24000
# Telegram принимает звук кадрами по 10 мс. Для моно PCM16 это 480 байт.
FRAME_BYTES = SAMPLE_RATE // 100 * 2
SILENCE = b"\x00" * FRAME_BYTES
URL = "wss://api.openai.com/v1/realtime"


class RealtimeSession:
    """Один разговор. Входящий звук отдаём методом, исходящий забираем из очереди."""

    def __init__(self, instructions: str) -> None:
        self.instructions = instructions
        self.outgoing: asyncio.Queue[bytes] = asyncio.Queue()
        # Человек заговорил — всё недосказанное надо выбросить, включая то,
        # что уже вынуто из очереди в буфер отправки.
        self.flush_requested = False
        self._session: aiohttp.ClientSession | None = None
        self._ws: aiohttp.ClientWebSocketResponse | None = None
        self._reader: asyncio.Task | None = None
        self.closed = False

    async def start(self) -> None:
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
                if kind == "response.output_audio.delta":
                    self.outgoing.put_nowait(base64.b64decode(event["delta"]))
                elif kind == "input_audio_buffer.speech_started":
                    # Человек заговорил — выбрасываем недосказанное,
                    # иначе ассистент продолжает говорить ему в ответ.
                    while not self.outgoing.empty():
                        self.outgoing.get_nowait()
                    self.flush_requested = True
                elif kind == "error":
                    log.error("Ошибка Realtime: %s", event.get("error"))
        except asyncio.CancelledError:
            raise
        except Exception as error:  # noqa: BLE001 — разговор важнее исключения
            log.error("Чтение Realtime прервано: %s", error)

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
