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

# ── Ключ виджета ─────────────────────────────────────────────────────
#
# Виджет на домашнем экране — отдельная программа: данные приложения он
# напрямую не видит и берёт день с сервера. Для этого ему нужен ключ.
# Придумывать его не нужно — сервер завёл его сам, скрипт только заберёт.
# Единственное, что требуется от человека: вставить ссылку восстановления,
# ту самую, что бот присылает по команде /связь.

SECRETS="Shared/Secrets.swift"
DEFAULT_SERVER="https://jarvis-production-d62d.up.railway.app"

urldecode() {
    printf '%s' "$1" | perl -pe 's/%([0-9A-Fa-f]{2})/chr(hex($1))/ge'
}

has_key() {
    [ -f "$SECRETS" ] && grep -q 'widgetToken = "[^"]\+"' "$SECRETS"
}

if has_key; then
    echo "Ключ виджета уже на месте ($SECRETS)."
else
    [ -f "$SECRETS" ] || cp Shared/Secrets.example.swift "$SECRETS"
    echo "Виджету на домашнем экране нужен ключ к серверу."
    echo "Откройте Telegram, отправьте боту /связь и вставьте ссылку сюда."
    echo "Можно пропустить — нажмите Enter, тогда соберётся всё кроме"
    echo "виджета: живое уведомление и Динамический остров работают без ключа."
    echo
    read -r -p "Ссылка: " LINK

    if [ -n "$LINK" ]; then
        TOKEN=$(urldecode "$(printf '%s' "$LINK" | sed -n 's/.*[#&]k=\([^&]*\).*/\1/p')")
        SERVER=$(urldecode "$(printf '%s' "$LINK" | sed -n 's/.*[#&]s=\([^&]*\).*/\1/p')")
        [ -n "$SERVER" ] || SERVER="$DEFAULT_SERVER"
        SERVER="${SERVER%/}"

        if [ -z "$TOKEN" ]; then
            echo "В ссылке нет ключа — похоже, вставилось не то. Соберу без виджета."
        else
            echo "Спрашиваю у сервера ключ виджета…"
            KEY=$(curl -fsS --max-time 20 -H "authorization: Bearer $TOKEN" \
                "$SERVER/api/widget/key" 2>/dev/null |
                sed -n 's/.*"key"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

            if [ -z "$KEY" ]; then
                echo "Сервер ключ не отдал. Проверьте, что ссылка свежая и сервис"
                echo "jarvis в Railway запущен. Соберу пока без виджета."
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
                echo "Ключ получен и записан. Виджет будет работать."
            fi
        fi
    else
        echo "Пропущено. Виджет на домашнем экране данных не покажет."
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
  3. Подключите iPhone кабелем и выберите его в списке устройств сверху,
     рядом с кнопкой запуска.
  4. Нажмите кнопку запуска (треугольник) или ⌘R.
  5. На iPhone: Настройки → Основные → VPN и управление устройством →
     доверять своему профилю разработчика.

Виджет добавляется на домашнем экране: долгое нажатие на пустом месте →
«+» слева сверху → найдите Kamron APP. Живое уведомление появится само,
когда начнётся блок режима дня.

Если у вас платная учётная запись Apple, можно собрать с общим ящиком —
тогда виджет перестанет ходить в сеть и будет обновляться мгновенно:

     ./"Собрать проект.command" --app-group

TEXT
read -r -p "Нажмите Enter, чтобы закрыть это окно."
