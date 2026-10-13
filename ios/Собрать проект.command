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

echo
echo "Собираю файл проекта из project.yml…"
if ! xcodegen generate; then
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

TEXT
read -r -p "Нажмите Enter, чтобы закрыть это окно."
