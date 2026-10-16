"""
Что бот умеет и как разговаривает.

Главное ограничение — длина. Ответ озвучивается, а озвучка считается по
символам, поэтому краткость здесь не стиль, а статья расходов. Второе
ограничение — честность: если запись в приложение не прошла, бот говорит
об этом, а не делает вид, что записал.
"""
import json
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from . import app_link
from .config import config

log = logging.getLogger("brain")

DAYS = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": (
                "Добавить задачу в приложение. Вызывать, когда человек называет, "
                "что ему нужно сделать. Одна задача на вызов."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Суть задачи, кратко"},
                    "date": {
                        "type": "string",
                        "description": "today, tomorrow или ГГГГ-ММ-ДД. Пусто, если срок не назван.",
                    },
                    "time": {
                        "type": "string",
                        "description": "ЧЧ:ММ, если человек назвал время. Иначе пусто.",
                    },
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_routine",
            "description": (
                "Добавить дело в режим дня — привязанное ко времени. Вызывать, когда "
                "человек называет время: «в семь зарядка»."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "time": {"type": "string", "description": "ЧЧ:ММ"},
                    "date": {
                        "type": "string",
                        "description": "today, tomorrow или ГГГГ-ММ-ДД для разового дела",
                    },
                    "days": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "Дни недели для повторяющегося дела: 1 понедельник … 7 воскресенье",
                    },
                },
                "required": ["title", "time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_note",
            "description": "Записать заметку — мысль или факт, который не является делом.",
            "parameters": {
                "type": "object",
                "properties": {"body": {"type": "string"}},
                "required": ["body"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": (
                "Отметить дело сделанным. Название брать из плана дня, который дан "
                "в данных, а не из слов человека дословно."
            ),
            "parameters": {
                "type": "object",
                "properties": {"title": {"type": "string"}},
                "required": ["title"],
            },
        },
    },
]

MANNER = """Ты Джарвис — помощник Камрона по режиму дня. Говоришь по-русски.

Как ты говоришь:
— Коротко. Два-три предложения, максимум четыре. Твой ответ озвучивается, и каждая лишняя фраза стоит денег.
— Конкретно. Не «постарайся успеть», а «до 19:30 осталось сорок минут».
— Спокойно и собранно. Без восторгов, без «отлично!» и «супер!». Без смайликов.
— На «ты». Обращаешься по имени редко, только когда это к месту.
— Если человек отстаёт — говоришь прямо и называешь причину, но не читаешь нотаций.

Что ты делаешь:
— Отвечаешь на вопросы про сегодняшний день по данным ниже.
— Записываешь в приложение то, что он просит: задачи, дела по времени, заметки, отметки о сделанном.
— Если записал — говоришь одной фразой что именно. Если запись не прошла — говоришь честно, что не записал.
— Ничего не предлагаешь по своей инициативе и не задаёшь лишних вопросов. Спрашиваешь только если без ответа нельзя записать.

Чего не делаешь:
— Не выдумываешь дела, которых нет в данных.
— Не пересказываешь весь план, если спросили про одно.
— Не извиняешься без повода."""


def describe(snap: dict) -> str:
    """Данные дня для модели. Пусто — честно говорим, что данных нет."""
    try:
        zone = ZoneInfo(config.timezone)
    except Exception:
        zone = ZoneInfo("UTC")
    now = datetime.now(zone)
    head = (
        f"Сейчас {now.strftime('%H:%M')}, {DAYS[now.weekday()]}, "
        f"{now.strftime('%d.%m.%Y')}. Часовой пояс {config.timezone}."
    )
    if not snap:
        return head + "\n\nДанных из приложения нет — его давно не открывали. Отвечай по общему смыслу и честно скажи, что плана перед тобой нет."

    lines = [head, ""]
    age = snap.get("снимокМинутНазад")
    if isinstance(age, (int, float)) and age > 180:
        lines.append(f"Внимание: данные обновлялись {int(age)} минут назад, могли устареть.")

    for key, label in (
        ("routine", "План дня"),
        ("routineTomorrow", "План на завтра"),
        ("tasks", "Задачи"),
        ("habits", "Привычки"),
        ("notes", "Заметки"),
    ):
        items = snap.get(key)
        if not items:
            continue
        lines.append(f"{label}:")
        for item in items[:30]:
            lines.append(f"  — {item}" if isinstance(item, str) else f"  — {json.dumps(item, ensure_ascii=False)}")
        lines.append("")
    return "\n".join(lines).strip()


async def run_tool(name: str, arguments: dict) -> str:
    """Выполняет вызов и возвращает модели короткий результат."""
    kinds = {
        "add_task": "task",
        "add_routine": "routine",
        "add_note": "note",
        "complete_task": "complete",
    }
    kind = kinds.get(name)
    if not kind:
        return "Неизвестное действие"

    payload = dict(arguments or {})
    if kind in ("task", "routine"):
        payload["date"] = app_link.resolve_date(payload.get("date", ""))
    if kind == "routine" and payload.get("days"):
        payload["date"] = ""  # повторяющееся дело к одной дате не привязано

    ok = await app_link.push(kind, payload)
    return "Записано в приложение" if ok else "Не записано: приложение недоступно"
