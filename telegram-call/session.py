"""
Получение строки сессии аккаунта-помощника. Запускается ОДИН РАЗ на вашей машине.

Основной способ — вход по QR, тот самый «Привязать устройство» из официального
приложения. Код подтверждения при этом не нужен вообще: вход разрешает уже
авторизованное приложение. Это снимает главную проблему — Telegram часто не
доставляет коды входа для сторонних клиентов.

Запасной способ — обычный вход по коду, если QR почему-то не подходит.

    python3 -m venv ~/.tg-session
    ~/.tg-session/bin/pip install telethon qrcode
    ~/.tg-session/bin/python telegram-call/session.py
"""
import asyncio

import qrcode
from telethon import TelegramClient, functions
from telethon.errors import (
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    SessionPasswordNeededError,
)
from telethon.sessions import StringSession

WHERE = {
    "SentCodeTypeApp": "в приложение Telegram — ищите служебный чат «Telegram»",
    "SentCodeTypeSms": "по SMS на номер",
    "SentCodeTypeCall": "звонком — продиктуют голосом",
    "SentCodeTypeFlashCall": "сбросом звонка — код в номере звонящего",
    "SentCodeTypeMissedCall": "пропущенным звонком — код в последних цифрах номера",
    "SentCodeTypeEmailCode": "на почту, привязанную к аккаунту",
    "SentCodeTypeFragmentSms": "через Fragment",
}


def show_qr(url: str) -> None:
    """QR прямо в терминале: пересылать картинку никуда не нужно."""
    code = qrcode.QRCode(border=1)
    code.add_data(url)
    code.make(fit=True)
    code.print_ascii(invert=True)


async def password_if_needed(client: TelegramClient) -> None:
    password = input("Облачный пароль аккаунта (двухэтапная проверка): ")
    await client.sign_in(password=password)


async def login_by_qr(client: TelegramClient) -> bool:
    print()
    print("ВХОД ПО QR — код подтверждения не нужен.")
    print()
    print("На телефоне с аккаунтом-помощником откройте:")
    print("  Настройки → Устройства → Привязать устройство")
    print("и наведите камеру на этот QR. Он живёт около минуты и обновляется сам.")
    print()

    qr = await client.qr_login()
    for attempt in range(10):
        show_qr(qr.url)
        print(f"Ссылка, если камера не берёт: {qr.url}")
        print("Жду подтверждения…")
        try:
            await qr.wait(timeout=60)
            return True
        except SessionPasswordNeededError:
            await password_if_needed(client)
            return True
        except asyncio.TimeoutError:
            print("QR устарел, показываю новый.")
            await qr.recreate()
    print("Подтверждения не было. Попробуйте запасной способ — вход по коду.")
    return False


async def login_by_code(client: TelegramClient) -> bool:
    phone = input("Телефон аккаунта-помощника (+998...): ").strip()
    sent = await client.send_code_request(phone)
    kind = type(sent.type).__name__
    print(f"Telegram отправил код: {WHERE.get(kind, kind)}")
    print("Код состоит из 5 цифр. Команда resend меняет способ доставки.")

    for attempt in range(5):
        code = input("Код (или resend): ").strip()
        if code.lower() == "resend":
            try:
                sent = await client(
                    functions.auth.ResendCodeRequest(
                        phone_number=phone, phone_code_hash=sent.phone_code_hash
                    )
                )
                print(f"Теперь отправлен: {WHERE.get(type(sent.type).__name__, '?')}")
            except Exception as error:  # noqa: BLE001 — причина нужна целиком
                print(f"Перезапрос не прошёл: {type(error).__name__}: {error}")
            continue
        try:
            await client.sign_in(phone, code, phone_code_hash=sent.phone_code_hash)
            return True
        except PhoneCodeInvalidError:
            print("Неверный код.")
        except PhoneCodeExpiredError:
            print("Код устарел, запустите скрипт заново.")
            return False
        except SessionPasswordNeededError:
            await password_if_needed(client)
            return True
    return False


async def main() -> None:
    print("Данные приложения: https://my.telegram.org → API development tools")
    api_id = int(input("api_id: ").strip())
    api_hash = input("api_hash: ").strip()

    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()

    choice = input("Вход по QR (Enter) или по коду (введите code)? ").strip().lower()
    ok = await login_by_code(client) if choice == "code" else await login_by_qr(client)
    if not ok:
        await client.disconnect()
        return

    me = await client.get_me()
    print()
    print(f"Вошли как: {me.first_name} (@{me.username}, id {me.id})")
    print("Убедитесь, что это аккаунт-помощник, а не ваш основной.")
    print()
    print("Строка сессии для переменной TG_SESSION на Railway:")
    print()
    print(client.session.save())
    print()
    print("Это полный доступ к аккаунту. Никому не показывайте и не кладите в репозиторий.")
    await client.disconnect()


asyncio.run(main())
