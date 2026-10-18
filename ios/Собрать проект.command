#!/bin/bash
#
# Двойной щелчок по этому файлу готовит проект Xcode и открывает его.
# Отдельный файл нужен потому, что печатать в Терминал за вас нельзя —
# а запустить готовый файл можно двойным щелчком.
#
cd "$(dirname "$0")" || exit 1

echo "Kamron APP — подготовка проекта Xcode"
echo "Папка: $(pwd)"
echo

if ! command -v xcodegen >/dev/null 2>&1; then
    echo "xcodegen не найден. Это единственная зависимость — она превращает"
    echo "описание project.yml в настоящий файл проекта Xcode."
    echo

    BREW=""
    for candidate in /opt/homebrew/bin/brew /usr/local/bin/brew "$(command -v brew 2>/dev/null)"; do
        [ -x "$candidate" ] && BREW="$candidate" && break
    done

    if [ -z "$BREW" ]; then
        echo "Homebrew тоже не найден, а без него xcodegen не поставить."
        echo "Установите Homebrew по инструкции с https://brew.sh и запустите этот"
        echo "файл снова. Либо соберите проект вручную — как, написано в README.md"
        echo "рядом с этим файлом."
        echo
        read -r -p "Нажмите Enter, чтобы закрыть."
        exit 1
    fi

    echo "Ставлю xcodegen через Homebrew. Это занимает минуту-две."
    echo
    if ! "$BREW" install xcodegen; then
        echo
        echo "Установка не прошла. Текст ошибки выше — пришлите его мне."
        read -r -p "Нажмите Enter, чтобы закрыть."
        exit 1
    fi
    export PATH="$(dirname "$BREW"):$PATH"
fi

# ── Ключи ────────────────────────────────────────────────────────────
#
# Нужны для двух вещей:
#   1. Приложение при первом запуске молча возвращает ваши данные из
#      копии — у сборки своё хранилище, из Safari оно ничего не видит.
#   2. Виджет на домашнем экране берёт день с сервера: напрямую данные
#      приложения он не видит, это отдельная программа со своей песочницей.
#
# Придумывать ничего не нужно. Всё берётся из ссылки восстановления —
# той, что бот присылает по команде /связь.

SECRETS="Shared/Secrets.swift"
APP_SECRETS="KamronAPP/AppSecrets.swift"
DEFAULT_SERVER="https://jarvis-production-d62d.up.railway.app"

urldecode() {
    printf '%s' "$1" | perl -pe 's/%([0-9A-Fa-f]{2})/chr(hex($1))/ge'
}

filled() {
    [ -f "$1" ] && grep -q 'token = "[^"]\+"' "$1"
}

[ -f "$SECRETS" ] || cp Shared/Secrets.example.swift "$SECRETS"
[ -f "$APP_SECRETS" ] || cp KamronAPP/AppSecrets.example.swift "$APP_SECRETS"

if filled "$SECRETS" && filled "$APP_SECRETS"; then
    echo "Ключи уже на месте."
else
    echo "Приложению нужен ключ: по нему оно вернёт ваши данные из копии"
    echo "и покажет день в виджете."
    echo
    echo "Откройте Telegram, отправьте боту /связь и вставьте ссылку сюда."
    echo "Можно пропустить — нажмите Enter. Тогда приложение соберётся, но"
    echo "начнёт с пустого дня, а виджет данных не покажет."
    echo
    read -r -p "Ссылка: " LINK

    if [ -z "$LINK" ]; then
        echo "Пропущено."
    else
        TOKEN=$(urldecode "$(printf '%s' "$LINK" | sed -n 's/.*[#&]k=\([^&]*\).*/\1/p')")
        SERVER=$(urldecode "$(printf '%s' "$LINK" | sed -n 's/.*[#&]s=\([^&]*\).*/\1/p')")
        [ -n "$SERVER" ] || SERVER="$DEFAULT_SERVER"
        SERVER="${SERVER%/}"

        if [ -z "$TOKEN" ]; then
            echo "В ссылке нет ключа — похоже, вставилось не то."
        else
            cat > "$APP_SECRETS" <<SWIFT
//
//  Создан скриптом сборки. В репозиторий не попадает (.gitignore).
//  Чтобы обновить — удалите файл и запустите «Собрать проект.command».
//
enum AppSecrets {
    /// Адрес сервера Jarvis, без косой черты в конце.
    static let server = "$SERVER"

    /// Главный ключ — им приложение возвращает данные из копии.
    static let token = "$TOKEN"
}
SWIFT
            echo "Ключ приложения записан — данные вернутся сами при первом запуске."

            echo "Спрашиваю у сервера отдельный ключ для виджета…"
            # Код ответа берём отдельно от тела: 401 и упавший сервер
            # чинятся по-разному, а без кода оба выглядят как пустой ответ.
            # Поэтому здесь нет -f: он прячет и тело, и код.
            ANSWER=$(mktemp)
            CODE=$(curl -sS -o "$ANSWER" -w '%{http_code}' --max-time 20 \
                -H "authorization: Bearer $TOKEN" \
                "$SERVER/api/widget/key" 2>/dev/null)
            KEY=$(sed -n 's/.*"key"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$ANSWER")
            rm -f "$ANSWER"

            if [ -z "$KEY" ]; then
                case "$CODE" in
                401|403)
                    echo "Сервер не признал ключ из ссылки (ответ $CODE)."
                    echo "Так бывает, если APP_ACCESS_TOKEN в Railway меняли, а"
                    echo "сервисы jarvis-bot и telegram-call после этого не"
                    echo "перезапускали: бот отдаёт команде /связь старый ключ."
                    echo "Перезапустите их в Railway, затем возьмите ссылку заново."
                    ;;
                000|"")
                    echo "Сервер не ответил. Проверьте интернет и что сервис"
                    echo "jarvis в Railway запущен."
                    ;;
                *)
                    echo "Сервер ответил $CODE, но ключа в ответе нет."
                    ;;
                esac
                echo "Соберу пока без виджета."
            else
                cat > "$SECRETS" <<SWIFT
//
//  Создан скриптом сборки. В репозиторий не попадает (.gitignore).
//  Чтобы обновить — удалите файл и запустите «Собрать проект.command».
//
enum Secrets {
    /// Адрес сервера Jarvis, без косой черты в конце.
    static let server = "$SERVER"

    /// Ключ виджета: открывает только сегодняшний день и приём отметки.
    static let widgetToken = "$KEY"
}
SWIFT
                echo "Ключ виджета получен. Виджет будет работать."
            fi
        fi
    fi
fi
echo

# Общий ящик включается отдельным описанием: с бесплатной учётной
# записью Apple его не подписывает, и сборка падает на подписи.
SPEC="project.yml"
if [ "$1" = "--app-group" ] || [ "$KAMRON_APP_GROUP" = "1" ]; then
    SPEC="project.appgroup.yml"
    echo "Собираю с общим ящиком (App Group)."
fi

echo
echo "Собираю файл проекта из $SPEC…"
if ! xcodegen generate --spec "$SPEC"; then
    echo
    echo "Сборка проекта не прошла. Текст ошибки выше — пришлите его мне."
    read -r -p "Нажмите Enter, чтобы закрыть."
    exit 1
fi

echo
echo "Готово. Открываю Xcode."
open KamronAPP.xcodeproj

cat <<'TEXT'

Дальше в Xcode, это делается один раз:

  1. Слева сверху выберите синий значок проекта KamronAPP,
     затем в списке TARGETS — KamronAPP.
  2. Вкладка «Signing & Capabilities» → поле «Team» → выберите свой Apple ID.
     Если его нет: меню Xcode → Settings… → Accounts → «+» → Apple ID.
  3. ТО ЖЕ САМОЕ для второй цели в списке TARGETS — KamronWidgetsExtension.
     Без своей команды она не подпишется, и сборка встанет на ней.
  4. Подключите iPhone кабелем и выберите его в списке устройств сверху,
     рядом с кнопкой запуска.
  5. Нажмите кнопку запуска (треугольник) или ⌘R.
  6. На iPhone: Настройки → Основные → VPN и управление устройством →
     доверять своему профилю разработчика.

Виджет добавляется на домашнем экране: долгое нажатие на пустом месте →
«+» слева сверху → найдите Kamron APP. Живое уведомление появится само,
когда начнётся блок режима дня.

Про срок: с бесплатной учётной записью подпись живёт 7 дней. Через неделю
приложение перестанет открываться — подключите телефон и нажмите ⌘R
снова. Данные при этом не теряются, они в копии на сервере.

Если появится платная учётная запись, можно собрать с общим ящиком —
виджет перестанет ходить в сеть и будет обновляться мгновенно:

     ./"Собрать проект.command" --app-group

TEXT
read -r -p "Нажмите Enter, чтобы закрыть это окно."
