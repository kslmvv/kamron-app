"""
Сквозная проверка бота без единого платного запроса.

Поднимаются три поддельных сервера — Telegram, OpenAI и сервер приложения —
и бот прогоняется по настоящему пути: скачать голосовое, перекодировать,
расслышать, подумать, записать задачу, озвучить и отправить. Проверяется
то, что ломается молча: формат голосового (Telegram принимает только
OGG/Opus), запись в приложение и счётчик расхода.

Запуск: python -m tests.e2e из каталога jarvis-bot
"""
import asyncio
import json
import os
import subprocess
import sys
import tempfile

from aiohttp import web

TMP = tempfile.mkdtemp(prefix="jarvis-test-")
PORT_TG, PORT_AI, PORT_APP = 8191, 8192, 8193

os.environ.update(
    BOT_TOKEN="test-token",
    OPENAI_API_KEY="test-key",
    DATA_DIR=os.path.join(TMP, "data"),
    TELEGRAM_API=f"http://127.0.0.1:{PORT_TG}",
    OPENAI_BASE=f"http://127.0.0.1:{PORT_AI}/v1",
    JARVIS_URL=f"http://127.0.0.1:{PORT_APP}",
    JARVIS_TOKEN="test-app-token",
    TIMEZONE="Asia/Tashkent",
    MAX_DAY_COST="0.25",
)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src import audio, main as bot  # noqa: E402
from src.config import config  # noqa: E402
from src.state import state  # noqa: E402
from src.telegram import telegram  # noqa: E402

sent: dict = {"messages": [], "voices": [], "changes": [], "transcribed": 0, "spoken": []}
fails: list[str] = []
passed = 0


def ok(name: str, condition: bool) -> None:
    global passed
    if condition:
        passed += 1
        print("  ✓", name)
    else:
        fails.append(name)
        print("  ✗", name)


def make_ogg(path: str, seconds: float = 3.0) -> None:
    """Голосовое пользователя: настоящий OGG/Opus, как отдаёт Telegram."""
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
         "-i", f"sine=frequency=330:duration={seconds}",
         "-c:a", "libopus", "-b:a", "24k", "-ar", "24000", "-ac", "1", path],
        check=True,
    )


def make_wav(path: str, seconds: float = 2.0) -> None:
    """Ответ озвучки: WAV, как отдаёт OpenAI."""
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
         "-i", f"sine=frequency=220:duration={seconds}",
         "-ar", "24000", "-ac", "1", path],
        check=True,
    )


# ── поддельный Telegram ───────────────────────────────────────────────────
async def tg_handler(request: web.Request):
    method = request.path.rsplit("/", 1)[-1]
    if method == "getMe":
        return web.json_response({"ok": True, "result": {"username": "test_bot"}})
    if method == "getFile":
        return web.json_response({"ok": True, "result": {"file_path": "voice/in.oga"}})
    if method == "sendMessage":
        body = await request.json()
        sent["messages"].append(body["text"])
        return web.json_response({"ok": True, "result": {}})
    if method == "sendChatAction":
        return web.json_response({"ok": True, "result": True})
    if method == "sendVoice":
        reader = await request.multipart()
        got = {}
        while True:
            part = await reader.next()
            if part is None:
                break
            if part.name == "voice":
                data = await part.read()
                path = os.path.join(TMP, "sent.ogg")
                with open(path, "wb") as f:
                    f.write(data)
                got["path"] = path
                got["bytes"] = len(data)
            else:
                got[part.name] = (await part.read()).decode()
        sent["voices"].append(got)
        return web.json_response({"ok": True, "result": {}})
    return web.json_response({"ok": True, "result": []})


async def tg_file(request: web.Request):
    with open(os.path.join(TMP, "user.oga"), "rb") as f:
        return web.Response(body=f.read())


# ── поддельный OpenAI ─────────────────────────────────────────────────────
STEP = {"n": 0}


async def ai_transcribe(request: web.Request):
    reader = await request.multipart()
    seen_file = False
    while True:
        part = await reader.next()
        if part is None:
            break
        if part.name == "file":
            data = await part.read()
            seen_file = len(data) > 0
    sent["transcribed"] += 1
    ok("распознавание получило непустой файл", seen_file)
    return web.json_response({"text": "Запиши задачу: доделать презентацию завтра в восемь вечера"})


async def ai_chat(request: web.Request):
    body = await request.json()
    STEP["n"] += 1
    usage = {"prompt_tokens": 800, "completion_tokens": 60}
    if STEP["n"] == 1:
        ok("в запросе есть инструменты", bool(body.get("tools")))
        ok("в запросе есть данные дня", any("Сейчас" in m["content"] for m in body["messages"]))
        return web.json_response({
            "choices": [{"message": {
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id": "call_1",
                    "type": "function",
                    "function": {
                        "name": "add_task",
                        "arguments": json.dumps({"title": "Доделать презентацию", "date": "tomorrow", "time": "20:00"}),
                    },
                }],
            }}],
            "usage": usage,
        })
    if STEP["n"] == 2:
        # Только второй вызов идёт следом за инструментом — дальше в разговоре
        # его быть не должно, и проверять там нечего.
        ok("результат инструмента вернулся в модель",
           any(m.get("role") == "tool" for m in body["messages"]))
    return web.json_response({
        "choices": [{"message": {"role": "assistant", "content": "Записал: доделать презентацию, завтра в 20:00."}}],
        "usage": usage,
    })


async def ai_speech(request: web.Request):
    body = await request.json()
    sent["spoken"].append(body["input"])
    ok("озвучка получила текст в пределах лимита", len(body["input"]) <= config.max_reply_chars)
    path = os.path.join(TMP, "tts.wav")
    make_wav(path)
    with open(path, "rb") as f:
        return web.Response(body=f.read(), content_type="audio/wav")


# ── поддельный сервер приложения ──────────────────────────────────────────
SNAP = {"день": None, "blocks": []}


async def app_snapshot(request: web.Request):
    return web.json_response({
        "snapshot": {
            "день": SNAP["день"],
            "routine": ["08:30 Siyosatshunoslik", "17:05 Работа", "21:20 Уроки"],
            "blocks": SNAP["blocks"],
            "tasks": ["Сдать эссе"],
            "habits": ["Вода 2/6"],
        },
        "возрастМинут": 12,
    })


async def app_changes(request: web.Request):
    body = await request.json()
    sent["changes"].append(body)
    ok("запись ушла с авторизацией", request.headers.get("authorization", "").startswith("Bearer "))
    return web.json_response({"ok": True})


async def serve(app: web.Application, port: int):
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "127.0.0.1", port).start()
    return runner


async def run() -> None:
    make_ogg(os.path.join(TMP, "user.oga"))

    tg = web.Application()
    tg.router.add_post("/bot{token}/{method}", tg_handler)
    tg.router.add_get("/file/bot{token}/{path:.*}", tg_file)

    ai = web.Application()
    ai.router.add_post("/v1/audio/transcriptions", ai_transcribe)
    ai.router.add_post("/v1/chat/completions", ai_chat)
    ai.router.add_post("/v1/audio/speech", ai_speech)

    app = web.Application()
    app.router.add_get("/api/snapshot", app_snapshot)
    app.router.add_post("/api/changes", app_changes)

    runners = [await serve(tg, PORT_TG), await serve(ai, PORT_AI), await serve(app, PORT_APP)]
    await telegram.start()

    print("\nПривязка владельца")
    await bot.handle({"update_id": 1, "message": {"chat": {"id": 777}, "text": "/start"}})
    ok("первый написавший стал владельцем", state.owner == 777)
    ok("ответ о привязке отправлен", any("привязан" in m for m in sent["messages"]))

    print("\nЧужой чат")
    await bot.handle({"update_id": 2, "message": {"chat": {"id": 999}, "text": "привет"}})
    ok("чужому отказано", sent["messages"][-1] == "Это личный бот.")

    print("\nГолосовое сообщение")
    await bot.handle({
        "update_id": 3,
        "message": {"chat": {"id": 777}, "voice": {"file_id": "abc", "duration": 3}},
    })
    ok("файл распознан один раз", sent["transcribed"] == 1)
    ok("задача записана в приложение", len(sent["changes"]) == 1)
    if sent["changes"]:
        data = sent["changes"][0]
        ok("вид записи — задача", data["kind"] == "task")
        ok("«завтра» превратилось в дату", len(data["data"].get("date", "")) == 10)
        ok("время сохранено", data["data"].get("time") == "20:00")
    ok("ответ ушёл голосовым", len(sent["voices"]) == 1)

    if sent["voices"]:
        voice = sent["voices"][0]
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name",
             "-of", "default=noprint_wrappers=1:nokey=1", voice["path"]],
            capture_output=True, text=True,
        )
        ok("кодек голосового — opus", probe.stdout.strip() == "opus")
        ok("в подписи есть текст ответа", "Записал" in voice.get("caption", ""))
        ok("файл не пустой", voice["bytes"] > 500)

    ok("расход посчитан", state.cost > 0)
    ok("расход в пределах лимита", state.cost < config.max_day_cost)

    print("\nТекстовое сообщение")
    before_voices = len(sent["voices"])
    await bot.handle({"update_id": 4, "message": {"chat": {"id": 777}, "text": "что сейчас?"}})
    ok("на текст отвечает текстом, без озвучки", len(sent["voices"]) == before_voices)
    ok("текстовый ответ отправлен", "Записал" in sent["messages"][-1] or len(sent["messages"][-1]) > 0)

    print("\nКоманды")
    await bot.handle({"update_id": 5, "message": {"chat": {"id": 777}, "text": "/расход"}})
    ok("команда расхода показывает сумму", "$" in sent["messages"][-1])

    print("\nПотолок расхода")
    state.cost = config.max_day_cost + 1
    state.save()
    await bot.handle({
        "update_id": 6,
        "message": {"chat": {"id": 777}, "voice": {"file_id": "abc", "duration": 3}},
    })
    ok("за лимитом бот отказывается тратить", "лимит" in sent["messages"][-1].lower())
    ok("за лимитом распознавание не вызывалось", sent["transcribed"] == 1)

    print("\nСлишком длинное голосовое")
    state.cost = 0
    state.save()
    make_ogg(os.path.join(TMP, "user.oga"), seconds=config.max_voice_seconds + 5)
    await bot.handle({
        "update_id": 7,
        "message": {"chat": {"id": 777}, "voice": {"file_id": "abc", "duration": 200}},
    })
    ok("длинное отклонено", "длинное" in sent["messages"][-1].lower())
    ok("длинное не распознавалось", sent["transcribed"] == 1)

    print("\nСсылка восстановления")
    await bot.handle({"update_id": 8, "message": {"chat": {"id": 777}, "text": "/связь"}})
    link = sent["messages"][-1]
    ok("ссылка содержит адрес приложения", config.app_url.rstrip("/") in link)
    ok("ссылка несёт ключ", "#k=" in link and config.jarvis_token in link)
    ok("ссылка несёт адрес сервера", "&s=" in link)
    ok("предупреждение про ключ на месте", "не пересылай" in link)

    print("\nНапоминания по ходу дня")
    from datetime import datetime
    from zoneinfo import ZoneInfo
    from src import main as bot_main

    today = datetime.now(ZoneInfo(config.timezone))
    SNAP["день"] = today.strftime("%Y-%m-%d")
    SNAP["blocks"] = [
        {"from": "08:30", "to": "09:40", "name": "Siyosatshunoslik", "kind": "lesson", "отмечено": "open"},
        {"from": "09:40", "to": "11:20", "name": "Свободное окно", "kind": "window", "отмечено": "auto"},
        {"from": "11:20", "to": "12:30", "name": "Дорога на работу", "kind": "travel", "отмечено": "auto"},
    ]
    state.cost = 0
    state.nudges = 0
    state.save()

    def at(hhmm):
        hours, minutes = hhmm.split(":")
        return today.replace(hour=int(hours), minute=int(minutes), second=0)

    before = len(sent["voices"])
    await bot_main.nudges(at("07:00"))
    ok("в спокойное время не пишет", len(sent["voices"]) == before)

    await bot_main.nudges(at("08:20"))
    ok("за 10 минут до пары напоминает", len(sent["voices"]) == before + 1)
    if len(sent["voices"]) > before:
        ok("напоминание ушло голосовым", sent["voices"][-1]["bytes"] > 500)

    await bot_main.nudges(at("08:20"))
    ok("дважды про одно и то же не пишет", len(sent["voices"]) == before + 1)

    await bot_main.nudges(at("09:40"))
    ok("о начале свободного окна напоминает", len(sent["voices"]) == before + 2)

    await bot_main.nudges(at("11:10"))
    ok("про дорогу не напоминает", len(sent["voices"]) == before + 2)

    SNAP["блоки_день"] = None
    SNAP["день"] = "2000-01-01"
    await bot_main.nudges(at("08:20"))
    ok("по вчерашнему снимку молчит", len(sent["voices"]) == before + 2)
    SNAP["день"] = today.strftime("%Y-%m-%d")

    state.nudges = config.nudge_max
    state.save()
    await bot_main.nudges(at("09:40"))
    ok("упёршись в лимит напоминаний, молчит", len(sent["voices"]) == before + 2)

    ok("ночь считается тихим временем", bot_main.quiet_now(at("23:30")) and bot_main.quiet_now(at("05:00")))
    ok("день тихим не считается", not bot_main.quiet_now(at("12:00")))

    await telegram.stop()
    for runner in runners:
        await runner.cleanup()


asyncio.run(run())
print("\n" + "─" * 46)
print(f"Проверок пройдено: {passed}, провалено: {len(fails)}")
for f in fails:
    print("  ✗", f)
sys.exit(1 if fails else 0)
