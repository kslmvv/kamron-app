/**
 * Ход диалога с Jarvis.
 *
 * Переписка живёт только в памяти текущего экрана: на сервере она не
 * сохраняется, в резервную копию не попадает и исчезает при перезагрузке.
 * Так переписка о личных делах не копится ни в localStorage, ни в JSON.
 */
import { view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $ } from '../core/utils.js';
import { render } from '../ui/shell.js';
import { jarvisChat, serverConfigured } from './api.js';

function ensure() {
  if (!view.chat) view.chat = { messages: [], busy: false, error: '' };
  return view.chat;
}

/** Прокрутка к последнему сообщению: иначе ответ уходит за край экрана. */
function scrollToEnd() {
  const stream = $('#chat-stream');
  if (stream) stream.scrollTop = stream.scrollHeight;
}

export async function sendChatMessage(text) {
  const message = String(text || '').trim();
  const chat = ensure();
  if (!message || chat.busy) return;
  if (!serverConfigured()) {
    toast('Сервер Jarvis не подключён');
    return;
  }
  chat.messages.push({ role: 'user', content: message.slice(0, 2000) });
  chat.busy = true;
  chat.error = '';
  render();
  scrollToEnd();
  try {
    const result = await jarvisChat(chat.messages);
    chat.messages.push({ role: 'assistant', content: result.reply || 'Пустой ответ' });
  } catch (err) {
    chat.error = err.message;
    // Неотправленный вопрос возвращаем в поле, чтобы его не пришлось набирать заново.
    chat.pending = chat.messages.pop()?.content || '';
  } finally {
    chat.busy = false;
    render();
    scrollToEnd();
    const field = document.querySelector('.chat-composer textarea');
    if (field && chat.pending) {
      field.value = chat.pending;
      chat.pending = '';
    }
    field?.focus();
  }
}

export function clearChat() {
  view.chat = { messages: [], busy: false, error: '' };
  render();
}
