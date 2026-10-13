"""
Получение строки сессии аккаунта-помощника. Запускается ОДИН РАЗ на вашей машине.

Скрипт печатает, КУДА Telegram отправил код: в приложение, по SMS или звонком.
Без этого «код не пришёл» превращается в гадание — чаще всего код лежит в
служебном чате «Telegram», а не в SMS.

    python3 -m venv ~/.tg-session
    ~/.tg-session/bin/pip install telethon
    ~/.tg-session/bin/python telegram-call/session.py
"""
import asyncio

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


async def main() -> None:
    print("Данные приложения: https://my.telegram.org → API development tools")
    api_id = int(input("api_id: ").strip())
    api_hash = input("api_hash: ").strip()
    phone = input("Телефон аккаунта-помощника (+998...): ").strip()

    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()

    sent = await client.send_code_request(phone)
    kind = type(sent.type).__name__
    print()
    print(f"Telegram отправил код: {WHERE.get(kind, kind)}")
    if getattr(sent, "next_type", None):
        print(f"Если не придёт, следующим способом будет: {type(sent.next_type).__name__}")
    print("Код состоит из 5 цифр.")
    print()

    print("Если код не приходит — введите resend: Telegram попробует следующий способ,")
    print("обычно это голосовой звонок с продиктованным кодом.")
    print()

    for attempt in range(5):
        code = input("Код (или resend): ").strip()
        if code.lower() == "resend":
            try:
                sent = await client(
                    functions.auth.ResendCodeRequest(
                        phone_number=phone, phone_code_hash=sent.phone_code_hash
                    )
                )
                kind = type(sent.type).__name__
                print(f"Теперь Telegram отправил код: {WHERE.get(kind, kind)}")
            except Exception as error:  # noqa: BLE001 — причина отказа нужна целиком
                print(f"Перезапрос не прошёл: {type(error).__name__}: {error}")
            continue
        try:
            await client.sign_in(phone, code, phone_code_hash=sent.phone_code_hash)
            break
        except PhoneCodeInvalidError:
            print("Неверный код. Проверьте, что ввели 5 цифр из последнего сообщения.")
        except PhoneCodeExpiredError:
            print("Код устарел. Запустите скрипт заново.")
            await client.disconnect()
            return
        except SessionPasswordNeededError:
            password = input("Облачный пароль аккаунта: ")
            await client.sign_in(password=password)
            break
    else:
        print("Попытки исчерпаны. Запустите скрипт заново через 15-20 минут.")
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
