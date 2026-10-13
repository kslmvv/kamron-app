"""
Что модель умеет делать в приложении во время разговора.

Записать напрямую в приложение нельзя: его данные живут в браузере на
телефоне. Поэтому каждое действие кладётся в очередь на сервере, а
приложение забирает её при открытии.

Удаления здесь нет намеренно. Голос распознаётся с ошибками, и
«удали задачу про отчёт» слишком легко выполнить не над той задачей.
Отметить сделанным можно — это обратимо.
"""
import logging
from datetime import date, timedelta
from zoneinfo import ZoneInfo

import aiohttp

from .config import config

log = logging.getLogger("actions")

TOOLS = [
    {
        "type": "function",
        "name": "add_task",
        "description": (
            "Добавить задачу. Пользоваться, когда человек называет, что ему нужно "
            "сделать. Одна задача на вызов; если названо несколько — вызвать несколько раз."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Суть задачи своими словами, кратко"},
                "kind": {
                    "type": "string",
                    "enum": ["personal", "work", "uni"],
                    "description": "Личное, работа или университет",
                },
                "due": {
                    "type": "string",
                    "description": (
                        "Срок: today, tomorrow или дата в виде ГГГГ-ММ-ДД. "
                        "Не указывать, если человек срока не назвал."
                    ),
                },
                "priority": {"type": "string", "enum": ["normal", "high"]},
            },
            "required": ["title", "kind"],
        },
    },
    {
        "type": "function",
        "name": "add_routine",
        "description": (
            "Добавить пункт в режим дня — дело, привязанное ко времени. "
            "Пользоваться, когда человек называет время: «в семь зарядка»."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "time": {"type": "string", "description": "Время в виде ЧЧ:ММ, сутки 24-часовые"},
                "title": {"type": "string"},
                "category": {
                    "type": "string",
                    "enum": ["Личное", "Работа", "Учёба"],
                },
                "days": {
                    "type": "array",
                    "items": {"type": "integer", "minimum": 0, "maximum": 6},
                    "description": (
                        "Дни недели: 0 — воскресенье, 1 — понедельник и так далее. "
                        "Не указывать, если это разовое дело на сегодня."
                    ),
                },
            },
            "required": ["time", "title"],
        },
    },
    {
        "type": "function",
        "name": "add_note",
        "description": (
            "Записать заметку — мысль, решение, обстоятельство. Пользоваться, когда "
            "сказанное стоит сохранить, но это не задача и не дело по времени."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "body": {"type": "string", "description": "Текст заметки"},
                "category": {"type": "string", "enum": ["Идея", "Личное", "Важное"]},
            },
            "required": ["body"],
        },
    },
    {
        "type": "function",
        "name": "end_call",
        "description": (
            "Завершить звонок. Вызывать, когда человек сказал «конец связи» или "
            "иначе ясно дал понять, что разговор окончен. Перед вызовом коротко "
            "попрощайся — после него связь обрывается."
        ),
        "parameters": {"type": "object", "properties": {}},
    },
    {
        "type": "function",
        "name": "complete_task",
        "description": (
            "Отметить задачу сделанной. Название брать из списка задач, который дан "
            "в данных разговора, а не из слов человека дословно."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Название задачи как оно значится в списке"}
            },
            "required": ["title"],
        },
    },
]


def _resolve_due(value: str) -> str:
    """Переводит «сегодня» и «завтра» в дату. Считаем по местному времени."""
    text = (value or "").strip().lower()
    if not text:
        return ""
    try:
        zone = ZoneInfo(config.timezone)
    except Exception:  # noqa: BLE001 — без базы зон считаем по UTC
        zone = ZoneInfo("UTC")
    from datetime import datetime

    today = datetime.now(zone).date()
    if text in ("today", "сегодня"):
        return today.isoformat()
    if text in ("tomorrow", "завтра"):
        return (today + timedelta(days=1)).isoformat()
    try:
        return date.fromisoformat(text).isoformat()
    except ValueError:
        log.warning("Срок «%s» не разобран, оставляю пустым", value)
        return ""


async def apply(name: str, arguments: dict) -> str:
    """
    Выполняет вызов и возвращает короткий ответ модели.

    Ответ нужен, чтобы модель сказала человеку, что записала, — и чтобы при
    отказе не сделала вид, будто записала.
    """
    if not config.jarvis_url:
        return "Не записано: приложение не подключено"

    if name == "end_call":
        # Отбой делает звонящая сторона: здесь только подтверждение.
        return "Связь завершается"

    kinds = {
        "add_task": "task",
        "add_routine": "routine",
        "add_note": "note",
        "complete_task": "complete",
    }
    kind = kinds.get(name)
    if not kind:
        return f"Неизвестное действие: {name}"

    payload = dict(arguments or {})
    if kind == "task":
        payload["due"] = _resolve_due(payload.get("due", ""))

    url = f"{config.jarvis_url.rstrip('/')}/api/changes"
    token = config.jarvis_token or config.access_token
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(
                url,
                headers={"authorization": f"Bearer {token}"},
                json={"kind": kind, "data": payload},
            ) as response:
                if response.status != 200:
                    detail = (await response.text())[:200]
                    log.error("Изменение не принято (%s): %s", response.status, detail)
                    return "Не записано: сервер отклонил запись"
    except Exception as error:  # noqa: BLE001 — разговор важнее записи
        log.error("Изменение не ушло: %s", error)
        return "Не записано: сервер недоступен"

    log.info("Записано: %s %s", kind, payload)
    return "Записано"
