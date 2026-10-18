# Анимации питомца

Сюда кладутся файлы Lottie — те самые, что рисуют аниматоры. Приложение
подхватывает их по имени: имя файла совпадает с названием сцены.

## Как добавить

1. Найти анимацию на lottiefiles.com. В фильтрах выбрать **Free** —
   платные скачиваются с водяным знаком, и использовать их нельзя.
2. Скачать как **Lottie JSON** (не GIF и не MP4).
3. Положить сюда под нужным именем из таблицы ниже, например
   `work.json`.
4. Закоммитить и запушить. Приложение подхватит файл само.

Файла нет — сцена просто не показывается, питомец остаётся обычным.
Ломаться ничего не будет, так что добавлять можно по одной.

## Имена файлов

| Файл | Когда показывается | Что искать на LottieFiles |
| --- | --- | --- |
| `work.json` | работа | working on laptop, coding |
| `read.json` | пара, университет | reading book, studying |
| `write.json` | письмо, эссе, конспект | writing, taking notes |
| `present.json` | доклад, презентация | presentation, chart |
| `shower.json` | душ | shower, bath |
| `eat.json` | завтрак, обед, ужин | eating, meal |
| `drink.json` | кофе, чай, вода | coffee, drinking |
| `travel.json` | дорога | bus, commute, driving |
| `flight.json` | рейс, аэропорт | airplane, travel |
| `sport.json` | зал, тренировка | workout, gym, dumbbell |
| `ball.json` | футбол, матч | football, soccer |
| `screen.json` | кино, сериал | watching tv, movie |
| `game.json` | игры, приставка | gaming, gamepad |
| `music.json` | музыка, наушники | listening music |
| `sleep.json` | ночь, сон | sleeping |
| `wake.json` | подъём | wake up, morning, alarm |
| `call.json` | звонок | phone call |
| `meeting.json` | встреча, собрание | meeting, handshake |
| `shop.json` | магазин, покупки | shopping, grocery |
| `gift.json` | подарок | gift box |
| `money.json` | оплата, счета | payment, money |
| `health.json` | врач, аптека | doctor, health |
| `family.json` | семья | family |
| `laundry.json` | стирка | laundry, washing machine |
| `repair.json` | ремонт, починить | repair, tools |
| `haircut.json` | стрижка | haircut, barber |
| `clean.json` | уборка | cleaning, broom |
| `walk.json` | прогулка, свободное время | walking, park |
| `pray.json` | намаз | praying |
| `photo.json` | фото | camera, photography |
| `idle.json` | ничего не идёт | idle, waiting, breathing |

## Про вес

Каждый файл лучше держать до 150 КБ: они загружаются на телефоне и
лежат в офлайн-кэше. Анимации с растровыми картинками внутри бывают по
несколько мегабайт — такие не берём, нужны векторные.

## Про лицензию

У бесплатных анимаций на LottieFiles лицензия разрешает использование,
но у каждой свои условия — у части требуется указать автора. Имена
авторов удобно сложить в `anim/AUTHORS.md`, чтобы потом не искать.
