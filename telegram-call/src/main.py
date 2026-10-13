"""
Сервис звонков Kamron APP — спайк.

Задача этого шага одна: выяснить, доходит ли реальный звонок от
аккаунта-помощника до телефона и слышно ли в нём речь. Разговора с
моделью здесь нет: он дороже на два порядка, и строить его имеет смысл
только после того, как звонок подтверждён.
"""
import asyncio
import hmac

from aiohttp import web

from .caller import caller
from .config import config


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
            "аккаунт": getattr(caller.me, "username", None) or getattr(caller.me, "id", None),
            "квота": caller.quota(),
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


async def build() -> web.Application:
    app = web.Application()
    app.add_routes([web.get("/", health), web.get("/health", health), web.post("/call", call)])
    await caller.start()
    missing = config.missing()
    print(f"Сервис звонков: порт {config.port}")
    print(f"  аккаунт: {'авторизован' if caller.authorized else 'НЕ авторизован'}")
    print(f"  не задано: {', '.join(missing) if missing else 'всё на месте'}")
    print(f"  пределы: {config.max_calls_per_day} звонков в сутки, {config.max_call_seconds} с на звонок")
    return app


if __name__ == "__main__":
    web.run_app(asyncio.get_event_loop().run_until_complete(build()), port=config.port)
