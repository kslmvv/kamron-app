/**
 * Живой диалог с Jarvis.
 *
 * Работает только с подключённым сервером (папка server/): модель
 * вызывается там, ключи провайдера в приложение не попадают. Без
 * подключения экран объясняет, что нужно сделать.
 */
import { esc } from '../core/utils.js';
import { view } from '../core/state.js';
import { heading, empty } from '../ui/components.js';
import { serverConfigured } from '../features/api.js';

/** Подсказки: с пустого поля разговор обычно не начинается. */
const STARTERS = [
  'Что у меня сегодня важного?',
  'Какие задачи просрочены?',
  'С чего начать по проектам?',
  'Что подготовить к ближайшему занятию?'
];

export function renderChat() {
  if (!serverConfigured()) {
    return `${heading('JARVIS', 'Живой диалог', '')}
      ${empty('✦', 'Сервер не подключён', 'Диалог отвечает через ваш сервер: там живут ключи модели. Подключите его в настройках — Дополнительно, «Сервер Jarvis».')}
      <button class="primary-btn" data-action="server-form">Подключить сервер</button>`;
  }

  const messages = view.chat?.messages || [];
  const bubbles = messages
    .map(
      m =>
        `<div class="chat-bubble ${m.role === 'user' ? 'mine' : 'his'}">${esc(m.content).replace(/\n/g, '<br>')}</div>`
    )
    .join('');

  return `${heading('JARVIS', 'Живой диалог', 'Отвечает по данным приложения на этом устройстве.')}
      <div class="chat-stream" id="chat-stream">
        ${
          bubbles ||
          `<div class="chat-hint"><strong>Спросите что угодно о своём дне.</strong><small>Jarvis видит режим дня, задачи, занятия, проекты и заметки. Данные не сохраняются на сервере.</small></div>`
        }
        ${view.chat?.busy ? '<div class="chat-bubble his pending">Думаю…</div>' : ''}
        ${view.chat?.error ? `<div class="chat-error">${esc(view.chat.error)}</div>` : ''}
      </div>
      ${
        messages.length
          ? ''
          : `<div class="chat-starters">${STARTERS.map(
              s =>
                `<button class="chat-starter" data-action="chat-starter" data-text="${esc(s)}">${esc(s)}</button>`
            ).join('')}</div>`
      }
      <form class="chat-composer" data-form="chat">
        <textarea name="text" rows="1" maxlength="2000" placeholder="Сообщение Jarvis" aria-label="Сообщение Jarvis" ${view.chat?.busy ? 'disabled' : ''}></textarea>
        <button class="chat-send" type="submit" aria-label="Отправить" ${view.chat?.busy ? 'disabled' : ''}>↑</button>
      </form>
      ${messages.length ? '<button class="secondary-btn" data-action="chat-clear">Очистить разговор</button>' : ''}`;
}
