# Чужой код

## lottie.min.js

Проигрыватель Lottie — `lottie_light.min.js` из пакета `lottie-web`
версии 5.13.0, лицензия MIT (файл `lottie-LICENSE.md` рядом).

Лежит в репозитории, а не грузится с чужого адреса, по двум причинам:
приложение должно открываться без сети, и сторонний адрес в середине
страницы — это чужой код, который может поменяться без нашего ведома.

Обновляется вручную:

```sh
npm pack lottie-web@<версия>
tar -xzf lottie-web-<версия>.tgz
cp package/build/player/lottie_light.min.js vendor/lottie.min.js
cp package/LICENSE.md vendor/lottie-LICENSE.md
```

Берём именно `light`-сборку: она вдвое меньше полной, потому что в ней
нет поддержки выражений — в готовых анимациях они встречаются редко.
