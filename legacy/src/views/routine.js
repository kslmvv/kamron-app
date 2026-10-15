/** Режим дня: недельная лента, список пунктов и обзор. */
import { DAY, ROUTINE_POINTS } from '../core/constants.js';
import { svg } from '../core/icons.js';
import { allOpenTasks, dayItems, dueTasks, routineCompleted, routineProgress } from '../core/selectors.js';
import { view } from '../core/state.js';
import { $, addDays, esc, fmt, fromKey, safeId, today } from '../core/utils.js';
import { agendaTaskRows, calendar, empty, heading } from '../ui/components.js';

export function renderRoutineWeek(start) {
  const cards = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(start, i),
      items = dayItems(key),
      tasks = dueTasks(key),
      progress = routineProgress(key);
    const preview = items
      .slice(0, 3)
      .map(
        item =>
          `<span>${item.kind === 'routine' && routineCompleted(key, item.id) ? '✓ ' : ''}${item.time} · ${esc(item.title)}</span>`
      )
      .join('');
    return `<button class="routine-week-card ${key === today() ? 'is-today' : ''}" data-action="open-routine-day" data-date="${key}"><div class="routine-week-head"><div><small>${esc(fmt(key, { weekday: 'long' }))}</small><strong>${esc(fmt(key, { day: 'numeric', month: 'long' }))}</strong></div><span class="routine-week-done">${progress.total ? `${progress.done}/${progress.total}${progress.done === progress.total ? ' ✓' : ''}` : 'Свободно'}</span></div><div class="routine-week-preview">${preview || '<span>Нет событий</span>'}${items.length > 3 ? `<span>+ ещё ${items.length - 3}</span>` : ''}</div><div class="routine-week-foot"><span>🎓 ${items.filter(x => x.kind === 'subject').length} пар</span><span>☑️ ${tasks.filter(x => !x.doneAt).length} задач</span><b>›</b></div></button>`;
  }).join('');
  return `<div class="routine-week-nav"><button class="day-step" data-action="day-step" data-step="-7" aria-label="Предыдущая неделя">‹</button><strong>${esc(fmt(start, { day: 'numeric', month: 'short' }))} — ${esc(fmt(addDays(start, 6), { day: 'numeric', month: 'short' }))}</strong><button class="day-step" data-action="day-step" data-step="7" aria-label="Следующая неделя">›</button></div>${today() >= start && today() <= addDays(start, 6) ? '' : `<button class="routine-today-link" data-action="routine-today">Вернуться к сегодня</button>`}<div class="routine-week-list">${cards}</div>`;
}

export function renderRoutine() {
  const key = view.date,
    wd = fromKey(key).getDay(),
    start = addDays(key, -((wd + 6) % 7));
  const mode = `<div class="routine-mode" role="group" aria-label="Вид расписания"><button data-action="routine-mode" data-mode="day" class="${view.routineMode === 'day' ? 'active' : ''}" aria-pressed="${view.routineMode === 'day'}">День</button><button data-action="routine-mode" data-mode="week" class="${view.routineMode === 'week' ? 'active' : ''}" aria-pressed="${view.routineMode === 'week'}">Неделя</button></div>`;
  if (view.routineMode === 'week')
    return `${heading('ОБЗОР ПЛАНОВ', 'Режим дня', 'События, пары и сроки на всю неделю.', 'new-event')}${mode}${renderRoutineWeek(start)}`;
  const week = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(start, i),
      p = routineProgress(k);
    return `<button class="week-day ${k === key ? 'active' : ''} ${p.total && p.done === p.total ? 'routine-complete' : ''}" data-action="pick-day" data-date="${k}" aria-label="${esc(fmt(k, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${p.done} из ${p.total} пунктов" aria-pressed="${k === key}" ${k === today() ? 'aria-current="date"' : ''}><span>${DAY[fromKey(k).getDay()]}</span><strong>${fromKey(k).getDate()}</strong></button>`;
  }).join('');
  const items = dayItems(key),
    deadlines = dueTasks(key),
    overdue = key === today() ? allOpenTasks().filter(t => t.due && t.due < key) : [],
    progress = routineProgress(key);
  const currentHm = new Date().toTimeString().slice(0, 5);
  const isToday = key === today();

  /** Минуты от полуночи — ими считаются промежутки и место отметки «сейчас». */
  const minutes = hm => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

  // Пересечения показываются явно: два дела на одно время — это ошибка
  // планирования, и человек должен увидеть её, а не искать глазами.
  const atSameTime = new Map();
  items.forEach(item => atSameTime.set(item.time, (atSameTime.get(item.time) || 0) + 1));

  const rows = [];
  let nowPlaced = false;
  items.forEach((item, index) => {
    const previous = items[index - 1];
    // Отметка «сейчас» встаёт между пунктами, а не поверх них.
    if (isToday && !nowPlaced && item.time > currentHm) {
      rows.push(`<div class="tl-now"><span>${currentHm}</span></div>`);
      nowPlaced = true;
    }
    // Длинный промежуток — это свободное время, и его стоит видеть:
    // именно в такие дыры и ставятся новые дела.
    if (previous) {
      const gap = minutes(item.time) - minutes(previous.time);
      if (gap >= 90)
        rows.push(
          `<div class="tl-gap"><span>${Math.floor(gap / 60)} ч ${gap % 60 ? `${gap % 60} мин ` : ''}свободно</span></div>`
        );
    }
    const done = item.kind === 'routine' && routineCompleted(key, item.id);
    const past = isToday && item.time <= currentHm;
    const clash = atSameTime.get(item.time) > 1;
    const meta =
      item.kind === 'routine'
        ? `${esc(item.category)}${item.date ? ' · один раз' : ''}`
        : `${esc(item.category)}${item.room ? ` · ауд. ${esc(item.room)}` : ''}`;
    const attendance =
      item.attendance === 'present'
        ? '✓ Был'
        : item.attendance === 'absent'
          ? 'Пропуск'
          : key <= today()
            ? 'Отметить'
            : '⋯';
    rows.push(
      `<div class="tl-row ${item.kind === 'subject' ? 'is-lesson' : ''} ${done ? 'is-done' : ''} ${past && !done && item.kind === 'routine' ? 'is-missed' : ''} ${clash ? 'is-clash' : ''}" data-routine-item="${safeId(item.id)}">` +
        `<span class="tl-time">${item.time}</span>` +
        `<div class="tl-card">` +
        (item.kind === 'routine'
          ? `<button class="check-btn routine-check ${done ? 'done' : ''}" data-action="toggle-routine" data-date="${key}" data-id="${safeId(item.id)}" aria-label="${key > today() ? 'Можно отметить после наступления дня' : done ? 'Снять отметку выполнения' : 'Отметить выполненным'}: ${esc(item.title)}" aria-pressed="${!!done}" ${key > today() ? 'disabled' : ''}>${done ? '✓' : ''}</button>`
          : `<span class="tl-lesson-mark" aria-hidden="true">🎓</span>`) +
        `<div class="grow"><strong>${esc(item.title)}</strong><small>${meta}${clash ? ' · <b class="tl-clash-note">пересечение</b>' : ''}</small></div>` +
        (item.kind === 'routine'
          ? `<button class="delete-btn routine-edit" data-action="edit-event" data-id="${safeId(item.id)}" aria-label="Изменить пункт «${esc(item.title)}»">✎</button>`
          : `<button class="attendance-btn" data-action="lesson-options" data-parent="${safeId(item.id)}" data-date="${key}" aria-label="${key <= today() ? 'Отметить посещаемость' : 'Изменить пару'}">${attendance}</button>`) +
        `</div></div>`
    );
  });
  // День ещё не начался или уже прошёл — отметка ставится по краю.
  if (isToday && !nowPlaced && items.length) rows.push(`<div class="tl-now"><span>${currentHm}</span></div>`);

  const timeline = items.length
    ? `<div class="timeline">${rows.join('')}</div>`
    : empty(
        '🗓️',
        'День пока свободен',
        'Добавьте пункт в расписание или занятие по предмету.',
        'new-event',
        'Добавить пункт'
      );

  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return `${heading('ПЛАН НА КАЖДЫЙ ДЕНЬ', 'Режим дня', 'Отмечайте выполненное. Каждая дата хранит свой результат.', 'new-event')}${mode}
      <div class="day-head">
        <div class="day-head-top"><strong>${esc(fmt(key, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong><div>${items.length ? `<button class="routine-date-today" data-action="move-day" data-date="${key}" title="Перенести все пункты этого дня на другую дату">Перенести</button>` : ''}${key !== today() ? `<button class="routine-date-today" data-action="routine-today">Сегодня</button>` : ''}<button class="routine-date-calendar" data-action="toggle-routine-calendar" aria-expanded="${view.routineCalendarOpen}" aria-label="${view.routineCalendarOpen ? 'Скрыть' : 'Открыть'} календарь месяца">${svg('plan')}</button></div></div>
        <div class="day-meter" role="img" aria-label="Выполнено ${progress.done} из ${progress.total}"><i style="width:${percent}%"></i></div>
        <div class="day-meter-note"><span>${progress.total ? `${progress.done} из ${progress.total} отмечено` : 'Пунктов режима нет'}</span><span>${progress.done ? `+${progress.done * ROUTINE_POINTS} баллов` : `+${ROUTINE_POINTS} за пункт`}</span></div>
      </div>
      ${view.routineCalendarOpen ? calendar(key, 'routine') : ''}<div class="week-strip">${week}</div>
      <div class="section-title">Расписание <small>${items.length} событий</small></div>${timeline}
      ${deadlines.length ? `<div class="section-title">Сроки задач <small>${deadlines.filter(t => !t.doneAt).length} осталось</small></div><div class="card">${agendaTaskRows(deadlines)}</div>` : ''}
      ${overdue.length ? `<div class="section-title">Просроченные задачи <small>${overdue.length}</small></div><div class="card">${agendaTaskRows(overdue)}</div>` : ''}
      <button class="routine-add-task" data-action="new-personal-task">+ Личная задача</button>`;
}
