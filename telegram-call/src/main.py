"""
Сервис звонков Kamron APP.

Звонит сам по расписанию — утром и вечером; маршруты нужны для проверки
и для внеплановых звонков. /call проигрывает одну реплику (дёшево, для
проверки связи), /talk ведёт живой разговор с моделью.
"""
import hmac
import logging

from aiohttp import web

from .caller import caller
from .config import config
from .schedule import scheduler


def _authorized(request: web.Request) -> bool:
    if not config.access_token:
        return False
    header = request.headers.get("authorization", "")
    token = header[7:] if header.startswith("Bearer ") else ""
    return hmac.compare_digest(token, config.access_token)


async def health(request: web.Request) -> web.Response:
    return web.json_response(
        {
            "сервис": "Kamron APP — звонки Telegram",
            "готов": config.ready() and caller.authorized,
            "не_задано": config.missing(),
            "ии_включен": config.ai_enabled,
            "аккаунт": getattr(caller.me, "username", None) or getattr(caller.me, "id", None),
            "квота": caller.quota(),
            "расписание": scheduler.status(),
        }
    )


async def call(request: web.Request) -> web.Response:
    if not _authorized(request):
        return web.json_response({"error": "Неверный ключ доступа"}, status=401)
    if not caller.authorized:
        return web.json_response(
            {"error": "Аккаунт-помощник не авторизован", "не_задано": config.missing()},
            status=503,
        )
    body = await request.json() if request.can_read_body else {}
    text = (body.get("text") or "").strip()
    if not text:
        return web.json_response({"error": "Нужен текст реплики"}, status=400)
    try:
        return web.json_response(await caller.call_and_say(text))
    except Exception as error:  # noqa: BLE001 — наружу уходит понятная причина
        return web.json_response({"error": str(error)}, status=409)


async def talk(request: web.Request) -> web.Response:
    """Живой разговор с моделью. kind: morning или evening."""
    if not _authorized(request):
        return web.json_response({"error": "Неверный ключ доступа"}, status=401)
    if not caller.authorized:
        return web.json_response(
            {"error": "Аккаунт-помощник не авторизован", "не_задано": config.missing()},
            status=503,
        )
    body = await request.json() if request.can_read_body else {}
    kind = (body.get("kind") or "morning").strip()
    try:
        return web.json_response(await caller.talk(kind))
    except Exception as error:  # noqa: BLE001 — наружу уходит понятная причина
        return web.json_response({"error": str(error)}, status=409)


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logging.getLogger("pytgcalls").setLevel(logging.DEBUG)
logging.getLogger("ntgcalls").setLevel(logging.DEBUG)
logging.getLogger("telethon").setLevel(logging.INFO)


async def on_startup(app: web.Application) -> None:
    """
    Подключение к Telegram обязано происходить в том же событийном цикле,
    в котором потом работает сервер: Telethon запоминает цикл при соединении
    и отказывается работать из другого. Поэтому вход здесь, а не до run_app.
    """
    await caller.start()
    missing = config.missing()
    print(f"Сервис звонков: порт {config.port}")
    print(f"  аккаунт: {'авторизован' if caller.authorized else 'НЕ авторизован'}")
    print(f"  не задано: {', '.join(missing) if missing else 'всё на месте'}")
    print(
        f"  пределы: {config.max_calls_per_day} звонков в сутки, "
        f"{config.max_talk_seconds} с на разговор"
    )
    scheduler.start()


def build() -> web.Application:
    app = web.Application()
    app.add_routes(
        [
            web.get("/", health),
            web.get("/health", health),
            web.post("/call", call),
            web.post("/talk", talk),
        ]
    )
    app.on_startup.append(on_startup)
    return app


if __name__ == "__main__":
    web.run_app(build(), port=config.port)
