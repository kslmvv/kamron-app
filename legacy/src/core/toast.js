/** Всплывающее сообщение внизу экрана. */
import { rt } from './state.js';
import { $, esc } from './utils.js';

export function toast(message, withUndo = false) {
  const el = $('#toast');
  el.innerHTML = withUndo
    ? `<span>${esc(message)}</span><button data-action="undo-task" aria-label="Отменить действие">Отменить</button>`
    : esc(message);
  el.classList.toggle('can-undo', withUndo);
  el.classList.add('show');
  clearTimeout(rt.toastTimer);
  rt.toastTimer = setTimeout(() => el.classList.remove('show'), withUndo ? 6000 : 3000);
}
