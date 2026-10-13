"""
Что ассистент говорит в звонке.

Утро и вечер — разные разговоры: утром план, вечером отчёт. Данные берутся
из снимка, который приложение присылает на сервер при каждом сохранении.

Главное правило в указаниях — не выдумывать. Ассистент, который утром
назовёт несуществующую задачу, хуже, чем ассистент, который честно скажет,
что данных нет: по первому нельзя строить день.
"""
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import aiohttp

from .config import config

log = logging.getLogger("brief")

COMMON = """
Ты — личный ассистент Камрона, звонишь ему по телефону. Говоришь по-русски,
коротко, по делу, спокойным живым голосом. Это разговор, а не объявление:
короткие фразы, даёшь ответить, не читаешь список подряд.

Сейчас {now} ({zone}).

Ты можешь записывать сказанное прямо в приложение — для этого есть
инструменты. Правила обращения с ними:
— Назвал дело — запиши сразу, в ходе разговора, не откладывая на конец.
— Со временем («в семь зарядка») — это пункт режима дня, add_routine.
  Без времени («нужно сдать отчёт») — задача, add_task.
  Мысль или обстоятельство — заметка, add_note.
— Срок считай от сегодняшней даты выше: «завтра» — это конкретный день.
— Несколько дел — несколько вызовов, по одному на каждое.
— Разбирайся сам, куда что отнести: личное, работа или университет видно
  по смыслу. Переспрашивай только если правда непонятно.
— Коротко подтверждай вслух, что записал: «записал на завтра».
— Если инструмент вернул «не записано» — так и скажи. Никогда не говори,
  что записал, когда запись не прошла.
— Удалять ты не умеешь. Попросят удалить — скажи, что это он сделает сам
  в приложении.

Жёсткие правила:
— Говори только о том, что есть в данных ниже. Ничего не придумывай:
  ни задач, ни занятий, ни договорённостей, ни чужих слов.
— Если данных нет или они устарели — скажи это прямо и спроси.
— Не утверждай, что что-то сделано, если в данных нет отметки.
— Не давай медицинских, юридических и финансовых советов.
— Разговор ограничен {limit} секундами. За двадцать секунд до конца
  подведи итог одной фразой и попрощайся.
""".strip()

MORNING = """
Сейчас утро. Задача звонка: за минуту-две собрать день.
Поздоровайся, назови главное на сегодня по данным, спроси, с чего он начнёт.
Всё, что он назовёт планом на день, записывай инструментами сразу.
Если занятий и задач нет — скажи, что день пустой, и спроси, что поставить.
""".strip()

EVENING = """
Сейчас вечер. Задача звонка: короткий разбор дня.
Спроси, что получилось, что нет и почему. Сделанное отмечай через
complete_task. Если по данным какие-то пункты остались без отметки —
назови их и спроси про них. В конце спроси главную задачу на завтра и
запиши её через add_task со сроком «завтра». Не хвали без повода и не упрекай.
""".strip()


def describe(snapshot: dict, age_minutes: int | None) -> str:
    """Переводит снимок в текст для указаний модели."""
    if not snapshot:
        return "ДАННЫХ НЕТ: приложение ещё не присылало состояние. Скажи об этом прямо."

    lines = [f"Данные приложения на {snapshot.get('today', 'сегодня')}:"]
    if age_minutes is not None and age_minutes > 180:
        hours = age_minutes // 60
        lines.append(
            f"ВНИМАНИЕ: снимок устарел — ему {hours} ч. Предупреди, что данные могут быть неполными."
        )

    routine = snapshot.get("routine") or []
    if routine:
        lines.append("Распорядок на сегодня:")
        for item in routine[:12]:
            mark = "сделано" if item.get("done") else "не отмечено"
            lines.append(f"  {item.get('time', '')} {item.get('title', '')} — {mark}")
    else:
        lines.append("Распорядок на сегодня пуст.")

    lessons = snapshot.get("lessons") or []
    if lessons:
        lines.append("Ближайшие занятия:")
        for lesson in lessons[:6]:
            kind = f" ({lesson['type']})" if lesson.get("type") else ""
            lines.append(
                f"  {lesson.get('date', '')} {lesson.get('time', '')} {lesson.get('subject', '')}{kind}"
            )

    tasks = snapshot.get("tasks") or []
    if tasks:
        lines.append(f"Открытых задач: {len(tasks)}. Первые:")
        for task in tasks[:10]:
            due = f", срок {task['due']}" if task.get("due") else ""
            lines.append(f"  {task.get('title', '')}{due}")
    else:
        lines.append("Открытых задач нет.")

    projects = snapshot.get("projects") or []
    if projects:
        lines.append("Проекты:")
        for project in projects[:6]:
            nxt = f", дальше: {project['next']}" if project.get("next") else ""
            lines.append(
                f"  {project.get('name', '')} — открыто {project.get('open', 0)}, "
                f"закрыто {project.get('done', 0)}{nxt}"
            )

    name = snapshot.get("name")
    if name:
        lines.insert(0, f"Собеседника зовут {name}.")
    return "\n".join(lines)


async def fetch_snapshot() -> tuple[dict | None, int | None]:
    """Берёт последний снимок с сервера Jarvis. Без него разговор всё равно состоится."""
    if not config.jarvis_url:
        return None, None
    url = f"{config.jarvis_url.rstrip('/')}/api/snapshot"
    token = config.jarvis_token or config.access_token
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers={"authorization": f"Bearer {token}"}) as response:
                if response.status == 404:
                    log.warning("Снимок на сервере отсутствует")
                    return None, None
                if response.status != 200:
                    log.warning("Сервер Jarvis ответил %s", response.status)
                    return None, None
                payload = await response.json()
        return payload.get("snapshot"), payload.get("возрастМинут")
    except Exception as error:  # noqa: BLE001 — звонок важнее снимка
        log.warning("Снимок не получен: %s", error)
        return None, None


def instructions_for(kind: str, snapshot: dict | None, age_minutes: int | None) -> str:
    part = EVENING if kind == "evening" else MORNING
    try:
        zone = ZoneInfo(config.timezone)
    except Exception:  # noqa: BLE001 — без базы зон считаем по UTC
        zone = ZoneInfo("UTC")
    now = datetime.now(zone).strftime("%Y-%m-%d, %A, %H:%M")
    head = COMMON.format(limit=config.max_talk_seconds, now=now, zone=config.timezone)
    return "\n\n".join([head, part, describe(snapshot or {}, age_minutes)])
