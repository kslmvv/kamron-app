/** Заметки: категории, поиск и закрепление. */
import { data, view } from '../core/state.js';
import { $, esc, fmt, safeId } from '../core/utils.js';
import { empty, heading, overview } from '../ui/components.js';

export function renderNotes() {
  if (!data.notes.length) view.noteFilter = 'all';
  const notes = data.notes
    .filter(
      n =>
        view.noteFilter === 'all' ||
        (view.noteFilter === 'pinned' ? n.pinned : n.category === view.noteFilter)
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
    );
  const query = view.noteQuery.trim().toLocaleLowerCase('ru-RU'),
    matches = n =>
      `${n.title || ''} ${n.body || ''} ${n.category || ''}`.toLocaleLowerCase('ru-RU').includes(query);
  const chips = [
    ['all', 'Все'],
    ['pinned', 'Закреплённые'],
    ['Идея', 'Идеи'],
    ['Личное', 'Личное'],
    ['Важное', 'Важное']
  ]
    .map(
      ([key, label]) =>
        `<button class="filter-chip ${view.noteFilter === key ? 'active' : ''}" data-action="note-filter" data-filter="${key}">${label}</button>`
    )
    .join('');
  return `${heading('БЫСТРО СОХРАНИТЬ', 'Заметки', 'Мысли всегда под рукой и на главном экране.')}
      <button class="capture-card" data-action="new-note"><span class="capture-icon">✎</span><span class="grow"><strong>Записать мысль</strong></span><span class="peek-arrow">+</span></button>
      ${
        data.notes.length
          ? overview(
              [
                [data.notes.length, 'всего заметок'],
                [data.notes.filter(n => n.pinned).length, 'закреплено']
              ],
              'notes-overview'
            )
          : ''
      }
      ${data.notes.length ? `<div class="toolbar">${chips}</div><input class="subject-search" id="note-search" type="search" placeholder="Найти заметку" value="${esc(view.noteQuery)}" aria-label="Найти заметку">` : ''}<div class="notes-list">${notes.length ? notes.map(n => `<div class="card note-card" data-note-card data-id="${safeId(n.id)}" ${matches(n) ? '' : 'hidden'}><div class="row"><h3 class="grow">${esc(n.title || 'Без названия')}</h3><button class="note-pin ${n.pinned ? 'active' : ''}" data-action="toggle-note-pin" data-id="${safeId(n.id)}" aria-label="${n.pinned ? 'Открепить' : 'Закрепить'} заметку" aria-pressed="${!!n.pinned}" title="${n.pinned ? 'Открепить' : 'Закрепить'}">📌</button><span class="tag">${esc(n.category)}</span></div><p>${esc(n.body)}</p><div class="row"><span class="tiny muted grow">${esc(fmt(n.createdAt.slice(0, 10)))}</span><button class="text-btn" data-action="edit-note" data-id="${safeId(n.id)}">Изменить</button><button class="delete-btn" data-action="delete-note" data-id="${safeId(n.id)}" aria-label="Удалить заметку">×</button></div></div>`).join('') : empty('📝', view.noteFilter === 'all' ? 'Пока нет заметок' : 'Ничего не найдено', view.noteFilter === 'all' ? 'Нажмите «Записать мысль» выше.' : 'Выберите другой фильтр.')}<div class="search-empty" id="note-search-empty" ${!notes.length || notes.some(matches) ? 'hidden' : ''}>Заметки не найдены. Попробуйте другое слово или фильтр.</div></div>`;
}
