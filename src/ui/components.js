/** Повторяющиеся блоки разметки: заголовок, сводка, пустое состояние, список задач, календарь. */
import { DAY } from '../core/constants.js';
import { dayItems, dueTasks, routineProgress } from '../core/selectors.js';
import { data } from '../core/state.js';
import { $, dateKey, esc, fmt, fromKey, safeId, today } from '../core/utils.js';

export function heading(kicker, title, subtitle, action, label = '+') {
  const sticker =
    {
      Ещё: '•••',
      Jarvis: '✦',
      'Режим дня': '🗓️',
      Работа: '💼',
      Универ: '🎓',
      'Jarvis · учёба': '🎓',
      'Jarvis · проект': '✦',
      'Jarvis · приложение': '🛠️',
      Зал: '💪',
      Заметки: '📝',
      Игры: '🎮',
      Настройки: '⚙️',
      'Jarvis · голос': '📞'
    }[title] || '✦';
  return `<div class="page-heading"><div class="heading-copy"><div class="heading-kicker"><span class="heading-sticker" aria-hidden="true">${sticker}</span></div><h1>${title}</h1></div>${action ? `<button class="fab-small" data-action="${action}" aria-label="${label === '+' ? `Добавить в раздел «${title}»` : label}">${label}</button>` : ''}</div>`;
}

export function overview(items, extra = '') {
  return `<div class="overview-strip ${extra}">${items.map(([value, label, tone = '']) => `<div class="overview-item ${tone}"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>`;
}

export function empty(icon, title, desc, action, label) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${desc}</p>${action ? `<button class="primary-btn" data-action="${action}">${label}</button>` : ''}</div>`;
}

export function taskRows(tasks, kind, parentId) {
  if (!tasks.length)
    return `<p class="small muted">Пока нет задач. Добавьте первую — за выполнение получите 50 баллов.</p>`;
  return tasks
    .slice()
    .sort(
      (a, b) =>
        Number(!!a.doneAt) - Number(!!b.doneAt) ||
        (a.due || '9999').localeCompare(b.due || '9999') ||
        Number(b.priority === 'high') - Number(a.priority === 'high')
    )
    .map(
      t =>
        `<div class="task-row ${t.doneAt ? 'done' : ''}" data-task-row-id="${safeId(t.id)}"><button class="check-btn ${t.doneAt ? 'done' : ''}" data-action="toggle-task" data-kind="${kind}" data-parent="${safeId(parentId)}" data-id="${safeId(t.id)}" aria-label="${t.doneAt ? 'Вернуть задачу' : 'Выполнить задачу'}">${t.doneAt ? '✓' : ''}</button><div class="task-text">${esc(t.title)}<span class="task-meta">${t.priority === 'high' ? '● Важно · ' : ''}${t.due ? `${t.due < today() && !t.doneAt ? 'Просрочено · ' : ''}До ${esc(fmt(t.due, { day: 'numeric', month: 'short' }))}` : 'Без срока'}</span></div><button class="delete-btn" data-action="edit-task" data-kind="${kind}" data-parent="${safeId(parentId)}" data-id="${safeId(t.id)}" aria-label="Изменить задачу">✎</button><button class="delete-btn" data-action="delete-task" data-kind="${kind}" data-parent="${safeId(parentId)}" data-id="${safeId(t.id)}" aria-label="Удалить задачу">×</button></div>`
    )
    .join('');
}

export function calendar(key, scope) {
  const d = fromKey(key),
    year = d.getFullYear(),
    month = d.getMonth(),
    first = (new Date(year, month, 1).getDay() + 6) % 7,
    count = new Date(year, month + 1, 0).getDate();
  const head = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(x => `<span>${x}</span>`).join('');
  const blanks = '<span></span>'.repeat(first);
  const days = Array.from({ length: count }, (_, i) => {
    const k = dateKey(new Date(year, month, i + 1));
    const gymCount = scope === 'gym' ? data.gym.filter(x => x.date === k).length : 0,
      dot =
        scope === 'gym'
          ? gymCount > 0
          : dayItems(k).some(e => e.kind === 'subject' || !!e.date) || dueTasks(k).length > 0;
    const progress = scope === 'routine' ? routineProgress(k) : null;
    const complete = progress && progress.total > 0 && progress.done === progress.total;
    return `<button data-action="pick-day" data-date="${k}" class="${k === key ? 'selected' : ''} ${k === today() ? 'today' : ''} ${dot ? 'has-dot' : ''} ${complete ? 'routine-complete' : ''}" aria-label="${esc(fmt(k, { day: 'numeric', month: 'long' }))}${progress ? ` · ${progress.done} из ${progress.total} пунктов` : gymCount ? ` · тренировок ${gymCount}` : ''}" aria-pressed="${k === key}" ${k === today() ? 'aria-current="date"' : ''}>${i + 1}</button>`;
  }).join('');
  return `<div class="calendar-card"><div class="month"><button class="icon-btn" data-action="month-step" data-step="-1" aria-label="Предыдущий месяц">‹</button><strong>${esc(fmt(key, { month: 'long', year: 'numeric' }))}</strong><button class="icon-btn" data-action="month-step" data-step="1" aria-label="Следующий месяц">›</button></div><div class="calendar-grid">${head}${blanks}${days}</div></div>`;
}

export function agendaTaskRows(tasks) {
  return tasks
    .slice()
    .sort(
      (a, b) =>
        Number(!!a.doneAt) - Number(!!b.doneAt) ||
        Number(b.priority === 'high') - Number(a.priority === 'high')
    )
    .map(
      t =>
        `<div class="task-row ${t.doneAt ? 'done' : ''}"><button class="check-btn ${t.doneAt ? 'done' : ''}" data-action="toggle-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="${t.doneAt ? 'Вернуть задачу' : 'Выполнить задачу'}" aria-pressed="${!!t.doneAt}">${t.doneAt ? '✓' : ''}</button><div class="task-text">${esc(t.title)}<span class="task-meta">${t.kind === 'personal' ? '📝' : t.kind === 'work' ? '💼' : '🎓'} ${esc(t.source)}${t.priority === 'high' ? ' · Важно' : ''}${t.due && t.due < today() && !t.doneAt ? ' · Просрочено' : ''}</span></div>${t.due && t.due <= today() && !t.doneAt ? `<button class="postpone-btn" data-action="postpone-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Перенести задачу на завтра" title="Перенести на завтра">↪</button>` : ''}<button class="delete-btn" data-action="open-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Открыть задачу">›</button></div>`
    )
    .join('');
}

export function weekdayInputs(selected) {
  return `<div class="weekday-picker">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label><input type="checkbox" name="days" value="${d}" ${selected.includes(d) ? 'checked' : ''}><span>${DAY[d]}</span></label>`).join('')}</div>`;
}
