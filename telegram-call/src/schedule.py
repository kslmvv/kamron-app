"""
Расписание звонков.

Будильник должен звонить сам, без запроса извне: вся суть в том, чтобы
утром звонок пришёл, даже если телефон выключен и приложение закрыто.

Срабатывание записывается ДО набора. Контейнер перезапускается при каждом
деплое, и без этой записи перезапуск в 06:31 означал бы второй звонок за то
же утро. Лучше пропустить звонок, чем позвонить дважды.
"""
import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from .caller import caller
from .config import config

log = logging.getLogger("schedule")

# Опоздание, после которого звонок уже не нужен: будильник в 08:00 вместо
# 06:30 бесполезен, а вечерний разбор в полночь — тем более.
GRACE_SECONDS = 20 * 60


def _zone() -> ZoneInfo:
    """Зона из настроек. Без базы часовых поясов лучше UTC, чем падение."""
    try:
        return ZoneInfo(config.timezone)
    except Exception:  # noqa: BLE001 — ZoneInfoNotFoundError и прочее
        log.error("Часовая зона «%s» недоступна, считаю по UTC", config.timezone)
        return ZoneInfo("UTC")


def _parse(value: str, default: tuple[int, int]) -> tuple[int, int]:
    try:
        hour, minute = value.split(":")
        hour, minute = int(hour), int(minute)
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return hour, minute
    except (ValueError, AttributeError):
        pass
    log.warning("Время «%s» не разобрано, беру %02d:%02d", value, *default)
    return default


class Scheduler:
    def __init__(self) -> None:
        self._done: set[str] = set()
        self._task: asyncio.Task | None = None

    def plan(self) -> list[dict]:
        now = datetime.now(_zone())
        result = []
        for kind, raw, default in (
            ("morning", config.morning_at, (6, 30)),
            ("evening", config.evening_at, (21, 0)),
        ):
            hour, minute = _parse(raw, default)
            at = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            result.append(
                {
                    "вид": kind,
                    "время": f"{hour:02d}:{minute:02d}",
                    "уже_звонили_сегодня": f"{now.date().isoformat()}:{kind}" in self._done,
                    "осталось_минут": round((at - now).total_seconds() / 60),
                }
            )
        return result

    def status(self) -> dict:
        return {
            "включено": config.schedule_enabled,
            "зона": config.timezone,
            "запущен": bool(self._task and not self._task.done()),
            "звонки": self.plan(),
        }

    async def _tick(self) -> None:
        now = datetime.now(_zone())
        today = now.date().isoformat()
        # Ключи прошлых дней не нужны, но и памяти не жрут — чистим за сутки.
        self._done = {key for key in self._done if key.startswith(today)}

        for kind, raw, default in (
            ("morning", config.morning_at, (6, 30)),
            ("evening", config.evening_at, (21, 0)),
        ):
            hour, minute = _parse(raw, default)
            at = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            late = (now - at).total_seconds()
            if late < 0 or late > GRACE_SECONDS:
                continue
            key = f"{today}:{kind}"
            if key in self._done:
                continue
            # Запись до набора: перезапуск не должен дать второй звонок.
            self._done.add(key)
            log.info("Расписание: звоню (%s), опоздание %.0f с", kind, late)
            try:
                result = await caller.talk(kind)
                log.info("Расписание: исход %s", result)
            except Exception as error:  # noqa: BLE001 — цикл обязан выжить
                log.error("Расписание: звонок (%s) не вышел: %s", kind, error)

    async def _loop(self) -> None:
        while True:
            try:
                await self._tick()
            except asyncio.CancelledError:
                raise
            except Exception as error:  # noqa: BLE001 — цикл обязан выжить
                log.error("Сбой в расписании: %s", error)
            await asyncio.sleep(30)

    def start(self) -> None:
        if not config.schedule_enabled:
            log.info("Расписание выключено (SCHEDULE_ENABLED=0)")
            return
        self._task = asyncio.create_task(self._loop())
        log.info(
            "Расписание: %s утром, %s вечером (%s)",
            config.morning_at,
            config.evening_at,
            config.timezone,
        )


scheduler = Scheduler()
