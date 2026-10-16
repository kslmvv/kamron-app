"""
Джарвис в Telegram: голосовое от Камрона — голосовой ответ по его дню.

Порядок внутри одного сообщения: расслышать, подумать (с правом записать
что-то в приложение), ответить голосом. Каждый платный шаг сверяется с
дневным потолком расхода — баланс маленький, и сорвавшийся цикл не должен
съесть его за ночь.
"""
import asyncio
import json
import logging
import os
import tempfile
import urllib.parse
from datetime import datetime
from zoneinfo import ZoneInfo

from aiohttp import web

from . import app_link, audio, brain, openai_api
from .config import config
from .state import state
from .telegram import telegram

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("bot")

HELP = (
    "Я Джарвис. Пиши или наговаривай голосовое — отвечу голосом.\n\n"
    "Что умею: сказать, что сейчас и что дальше, успеваешь ли ты, "
    "записать задачу или дело по времени, отметить сделанное.\n\n"
    "/план — что сегодня\n"
    "/расход — сколько потрачено за сутки\n"
    "/связь — ссылка, которая вернёт данные в приложение\n"
    "/помощь — это сообщение"
)


def zone():
    try:
        return ZoneInfo(config.timezone)
    except Exception:
        return ZoneInfo("UTC")


# ── разговор ──────────────────────────────────────────────────────────────
async def answer(text: str, extra: str = "") -> str:
    """
    Прогон через модель с правом вызвать инструменты.

    Циклов не больше трёх: модель должна успеть записать и ответить, а не
    ходить по кругу за наш счёт.
    """
    snap = await app_link.snapshot()
    messages = [
        {"role": "system", "content": brain.MANNER},
        {"role": "system", "content": brain.describe(snap)},
    ]
    if extra:
        messages.append({"role": "system", "content": extra})
    messages.extend(state.history[-8:])
    messages.append({"role": "user", "content": text})

    for _ in range(3):
        if not state.can_spend():
            return "Дневной лимит расхода исчерпан. Завтра продолжим."
        message, cost = await openai_api.think(messages, brain.TOOLS)
        state.spend(cost, "мозг")
        calls = message.get("tool_calls") or []
        if not calls:
            return (message.get("content") or "").strip()

        messages.append(message)
        for call in calls:
            name = call["function"]["name"]
            try:
                args = json.loads(call["function"].get("arguments") or "{}")
            except Exception:
                args = {}
            result = await brain.run_tool(name, args)
            messages.append(
                {"role": "tool", "tool_call_id": call["id"], "content": result}
            )
    return "Записал, что смог. Повтори, если что-то не попало."


async def reply(chat: int, text: str, voice: bool) -> None:
    """Отправка ответа. Голос — только если просили голосом: он стоит денег."""
    text = (text or "Не понял.").strip()[: config.max_reply_chars]
    if not voice or not state.can_spend():
        await telegram.send(chat, text)
        return

    wav = os.path.join(tempfile.gettempdir(), f"say-{chat}.wav")
    ogg = os.path.join(tempfile.gettempdir(), f"say-{chat}.ogg")
    try:
        await telegram.typing(chat, "record_voice")
        await openai_api.speak(text, wav)
        await audio.to_voice(wav, ogg)
        seconds = await audio.duration(ogg)
        state.spend(seconds / 60.0 * config.price_tts_min, "озвучка")
        await telegram.send_voice(chat, ogg, caption=text)
    except Exception as error:
        log.error("Озвучка не удалась: %s", error)
        await telegram.send(chat, text)
    finally:
        audio.cleanup(wav, ogg)


# ── входящие ──────────────────────────────────────────────────────────────
async def on_voice(chat: int, file_id: str) -> None:
    oga = os.path.join(tempfile.gettempdir(), f"in-{chat}.oga")
    mp3 = os.path.join(tempfile.gettempdir(), f"in-{chat}.mp3")
    try:
        await telegram.typing(chat)
        await telegram.download(file_id, oga)
        await audio.to_mp3(oga, mp3)
        seconds = await audio.duration(mp3)
        if seconds > config.max_voice_seconds:
            await telegram.send(
                chat,
                f"Слишком длинное — {int(seconds)} секунд при пределе "
                f"{config.max_voice_seconds}. Скажи короче.",
            )
            return
        if not state.can_spend():
            await telegram.send(chat, "Дневной лимит расхода исчерпан. Завтра продолжим.")
            return

        text, cost = await openai_api.transcribe(mp3, seconds)
        state.spend(cost, "расшифровка")
        if not text:
            await telegram.send(chat, "Не расслышал. Повтори.")
            return

        log.info("Услышал: %s", text[:120])
        state.remember("user", text)
        out = await answer(text)
        state.remember("assistant", out)
        await reply(chat, out, voice=True)
    except Exception as error:
        log.exception("Голосовое не обработано")
        await telegram.send(chat, f"Сломалось на обработке голосового: {error}")
    finally:
        audio.cleanup(oga, mp3)


async def on_text(chat: int, text: str) -> None:
    low = text.strip().lower()

    if low in ("/start", "/помощь", "/help"):
        await telegram.send(chat, HELP)
        return

    if low in ("/расход", "/cost", "/расходы"):
        state.roll()
        await telegram.send(
            chat,
            f"За сутки потрачено ${state.cost:.3f} из ${config.max_day_cost:.2f}.\n"
            f"Сообщений: {state.messages}. Остаток лимита ${state.left():.3f}.",
        )
        return

    if low in ("/связь", "/link", "/копия"):
        # Ключ внутри ссылки — поэтому её даём только по прямой просьбе и
        # сразу говорим, чем она является.
        if not config.jarvis_token:
            await telegram.send(chat, "Ключ сервера не задан, ссылку собрать не из чего.")
            return
        link = (
            config.app_url.rstrip("/")
            + "/#k="
            + urllib.parse.quote(config.jarvis_token, safe="")
            + "&s="
            + urllib.parse.quote(config.jarvis_url.rstrip("/"), safe="")
        )
        await telegram.send(
            chat,
            "Ссылка восстановления:\n" + link +
            "\n\nОткрой её на телефоне — приложение подхватит ключ и вернёт данные "
            "из последней копии. В ссылке лежит ключ доступа, поэтому не пересылай её никому.",
        )
        return

    if low in ("/план", "/day", "/сегодня"):
        await telegram.typing(chat)
        out = await answer("Что у меня сегодня? Коротко: что сейчас, что дальше, что ещё осталось.")
        await reply(chat, out, voice=False)
        return

    await telegram.typing(chat)
    state.remember("user", text)
    out = await answer(text)
    state.remember("assistant", out)
    await reply(chat, out, voice=False)


async def handle(update: dict) -> None:
    message = update.get("message") or {}
    chat = (message.get("chat") or {}).get("id")
    if not chat:
        return

    # Первый, кто написал, становится владельцем. Остальные идут мимо:
    # бот личный, и чужие сообщения не должны тратить его баланс.
    if state.owner is None:
        state.owner = chat
        state.save()
        log.info("Владелец бота: %s", chat)
        await telegram.send(chat, "Готово, бот привязан к этому чату.\n\n" + HELP)
        return
    if chat != state.owner:
        await telegram.send(chat, "Это личный бот.")
        return

    state.roll()
    state.messages += 1

    if message.get("voice"):
        await on_voice(chat, message["voice"]["file_id"])
    elif message.get("text"):
        await on_text(chat, message["text"])
    elif message.get("audio"):
        await on_voice(chat, message["audio"]["file_id"])
    else:
        await telegram.send(chat, "Принимаю текст и голосовые.")


# ── сам пишет ─────────────────────────────────────────────────────────────
MORNING = (
    "Это утреннее сообщение. Скажи, во сколько первое дело, сколько пар сегодня "
    "и где между ними свободное окно. Две-три фразы."
)
EVENING = (
    "Это вечернее сообщение. Скажи, сколько закрыто за день, что упущено и что "
    "осталось до отбоя. Две-три фразы, без нотаций."
)

# Дорога и свободное время — не дела: напоминать о них нечего.
SKIP_KINDS = {"travel", "free"}
CHECKABLE = {"home", "meal", "chore", "study", "work", "lesson", "task"}


def quiet_now(now: datetime) -> bool:
    """Ночью бот молчит. Окно тишины может переходить через полночь."""
    clock = now.strftime("%H:%M")
    start, end = config.quiet_from, config.quiet_to
    return clock >= start or clock < end if start > end else start <= clock < end


def hhmm(value: str) -> int:
    try:
        hours, minutes = value.split(":")
        return int(hours) * 60 + int(minutes)
    except Exception:
        return -1


async def nudge(text_prompt: str, tag: str) -> None:
    """Короткое голосовое по своей инициативе."""
    state.mark_fired(tag)
    state.nudges += 1
    state.save()
    log.info("Пинок %s", tag)
    out = await answer("Напомни одной фразой.", extra=text_prompt)
    await reply(state.owner, out, voice=True)


async def nudges(now: datetime) -> None:
    """
    Напоминания по ходу дня.

    Считаем по снимку приложения, а не по своему представлению о дне: план
    зависит от расписания пар и настроек, которые живут там. Снимок не за
    сегодня означает, что приложение сегодня не открывали — тогда молчим,
    чтобы не напоминать о вчерашнем.
    """
    if not config.nudge_enabled or state.nudges >= config.nudge_max:
        return
    snap = await app_link.snapshot()
    today = now.strftime("%Y-%m-%d")
    if not snap or snap.get("день") != today:
        return

    minute = now.hour * 60 + now.minute
    for block in snap.get("blocks") or []:
        kind = block.get("kind", "")
        if kind in SKIP_KINDS:
            continue
        start, end = hhmm(block.get("from", "")), hhmm(block.get("to", ""))
        name = block.get("name", "")
        if start < 0 or not name:
            continue
        mark = block.get("отмечено", "auto")

        # Каждое событие дня — один раз. Отметка лежит на диске, поэтому
        # перезапуск контейнера не заставит бота повторить напоминание.
        def fresh(tag: str) -> bool:
            return not state.was_fired(tag)

        # За сколько-то минут до дела — чтобы успеть переключиться.
        before = start - config.nudge_before
        tag = f"pre:{name}:{block['from']}"
        if before <= minute < before + 2 and kind in CHECKABLE and mark != "done" and fresh(tag):
            await nudge(
                f"Через {config.nudge_before} минут начинается: {name} ({block['from']}–{block['to']}). "
                "Скажи об этом одной фразой и что сделать прямо сейчас, чтобы не опоздать.",
                tag,
            )
            return

        # Начало свободного окна — самое ценное время в его дне.
        tag = f"win:{block['from']}"
        if kind == "window" and start <= minute < start + 2 and fresh(tag):
            await nudge(
                f"Началось свободное окно до {block['to']}. Скажи, сколько оно длится и "
                "что в него стоит уложить, чтобы вечером было легче. Одна-две фразы.",
                tag,
            )
            return

        # Дело вот-вот закроется, а отметки нет.
        closing = end - 15
        tag = f"end:{name}:{block['to']}"
        if closing <= minute < closing + 2 and kind in CHECKABLE and mark == "open" and fresh(tag):
            await nudge(
                f"Дело «{name}» заканчивается в {block['to']}, отметки ещё нет. "
                "Скажи об этом одной фразой, коротко и без нотаций.",
                tag,
            )
            return


async def scheduler() -> None:
    while True:
        try:
            if state.owner:
                now = datetime.now(zone())
                clock = now.strftime("%H:%M")
                if config.schedule_enabled:
                    for name, at, prompt in (
                        ("morning", config.morning_at, MORNING),
                        ("evening", config.evening_at, EVENING),
                    ):
                        if clock == at and not state.was_fired(name):
                            state.mark_fired(name)
                            log.info("Сводка %s", name)
                            out = await answer("Дай сводку.", extra=prompt)
                            await reply(state.owner, out, voice=True)
                if not quiet_now(now) and state.can_spend():
                    await nudges(now)
        except Exception:
            log.exception("Сообщение по своей инициативе не ушло")
        await asyncio.sleep(45)


# ── служебное ─────────────────────────────────────────────────────────────
async def health(_request):
    state.roll()
    return web.json_response(
        {
            "сервис": "jarvis-bot",
            "готов": not config.missing(),
            "неХватает": config.missing(),
            "владелец": bool(state.owner),
            "дискПодключен": state.persistent,
            "расходЗаСутки": round(state.cost, 4),
            "лимитЗаСутки": config.max_day_cost,
            "сообщенийЗаСутки": state.messages,
            "пинковЗаСутки": state.nudges,
            "лимитПинков": config.nudge_max,
            "приложение": bool(config.jarvis_url),
        }
    )


async def serve() -> None:
    app = web.Application()
    app.router.add_get("/", health)
    app.router.add_get("/api/health", health)
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", config.port).start()
    log.info("Здоровье на порту %s", config.port)


async def poll() -> None:
    offset = state.update_id + 1 if state.update_id else 0
    while True:
        updates = await telegram.updates(offset)
        for update in updates:
            offset = update["update_id"] + 1
            state.update_id = update["update_id"]
            state.save()
            try:
                await handle(update)
            except Exception:
                log.exception("Сообщение не обработано")


async def main() -> None:
    missing = config.missing()
    if missing:
        log.error("Не заданы переменные: %s", ", ".join(missing))
        await serve()
        while True:
            await asyncio.sleep(3600)

    await telegram.start()
    me = await telegram.call("getMe")
    log.info("Бот @%s запущен. Владелец: %s", me.get("username"), state.owner or "ещё не привязан")
    await serve()
    await asyncio.gather(poll(), scheduler())


if __name__ == "__main__":
    asyncio.run(main())
