"""
Получение строки сессии аккаунта-помощника. Запускается ОДИН РАЗ на вашей машине.

Telegram пришлёт код подтверждения на аккаунт помощника — его нужно ввести
руками, поэтому сделать это за вас не может ни скрипт на сервере, ни я.
Полученную строку вставьте в переменную TG_SESSION на Railway и больше
нигде не храните: это полный доступ к аккаунту, равный паролю.

    pip install telethon
    python telegram-call/session.py
"""
from telethon import TelegramClient
from telethon.sessions import StringSession

print("Данные приложения возьмите на https://my.telegram.org → API development tools")
api_id = int(input("api_id: ").strip())
api_hash = input("api_hash: ").strip()

with TelegramClient(StringSession(), api_id, api_hash) as client:
    me = client.get_me()
    print()
    print(f"Вошли как: {me.first_name} (@{me.username}, id {me.id})")
    print()
    print("Строка сессии — скопируйте целиком в переменную TG_SESSION на Railway:")
    print()
    print(client.session.save())
    print()
    print("Никому её не показывайте и не кладите в репозиторий.")
