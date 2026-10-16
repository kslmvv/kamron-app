"""
Связь с приложением.

Данные приложения живут в браузере на телефоне, поэтому напрямую писать
в него нельзя. Обмен идёт через сервер: приложение выкладывает туда снимок
своего дня и забирает очередь изменений, когда его открывают. Бот читает
снимок и кладёт изменения в очередь.

Удаления в очереди нет намеренно: речь распознаётся с ошибками, и «удали
задачу про отчёт» слишком легко выполнить не над той задачей. Отметить
сделанным можно — это обратимо.
"""
import logging
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import aiohttp

from .config import config

log = logging.getLogger("app")


def _zone():
    try:
        return ZoneInfo(config.timezone)
    except Exception:
        return ZoneInfo("UTC")


def resolve_date(value: str) -> str:
    """«Сегодня» и «завтра» → дата. Модель говорит словами, приложению нужна дата."""
    text = (value or "").strip().lower()
    if not text:
        return ""
    today = datetime.now(_zone()).date()
    if text in ("today", "сегодня"):
        return today.isoformat()
    if text in ("tomorrow", "завтра"):
        return (today + timedelta(days=1)).isoformat()
    if text in ("послезавтра", "day_after_tomorrow"):
        return (today + timedelta(days=2)).isoformat()
    try:
        return date.fromisoformat(text).isoformat()
    except ValueError:
        log.warning("Дата «%s» не разобрана", value)
        return ""


def _auth() -> dict:
    return {"authorization": f"Bearer {config.jarvis_token}"}


async def snapshot() -> dict:
    """Снимок дня из приложения. Пусто — значит приложение давно не открывали."""
    if not config.jarvis_url:
        return {}
    url = f"{config.jarvis_url.rstrip('/')}/api/snapshot"
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=_auth()) as response:
                if response.status != 200:
                    return {}
                data = await response.json()
    except Exception as error:
        log.warning("Снимок не получен: %s", error)
        return {}
    # Сервер отдаёт снимок в обёртке вместе с возрастом — разворачиваем,
    # иначе модель увидит ключ «snapshot» вместо плана дня.
    snap = dict(data.get("snapshot") or {})
    if data.get("возрастМинут") is not None:
        snap["снимокМинутНазад"] = data["возрастМинут"]
    return snap


async def push(kind: str, payload: dict) -> bool:
    """Кладёт изменение в очередь приложения."""
    if not config.jarvis_url:
        return False
    url = f"{config.jarvis_url.rstrip('/')}/api/changes"
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(
                url, headers=_auth(), json={"kind": kind, "data": payload}
            ) as response:
                if response.status != 200:
                    detail = (await response.text())[:200]
                    log.error("Изменение не принято (%s): %s", response.status, detail)
                    return False
    except Exception as error:
        log.error("Изменение не ушло: %s", error)
        return False
    log.info("Записано: %s %s", kind, payload)
    return True
