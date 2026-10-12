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
  const currentHm = new Date().toTimeString().slice(0, 5),
    next =
      key >= today()
        ? items.find(
            item =>
              (key > today() || item.time >= currentHm) &&
              (item.kind !== 'routine' || !routineCompleted(key, item.id))
          ) || items.find(item => item.kind === 'routine' && !routineCompleted(key, item.id))
        : null;
  const nextIsLate = next && key === today() && next.time < currentHm;
  const timeline = items.length
    ? `<div class="timeline">${items
        .map(item => {
          const done = item.kind === 'routine' && routineCompleted(key, item.id);
          const status =
            item.kind === 'routine'
              ? done
                ? `Готово · +${ROUTINE_POINTS} баллов`
                : key > today()
                  ? 'В плане'
                  : key === today() && item.time > currentHm
                    ? 'Впереди'
                    : key === today()
                      ? 'Можно отметить'
                      : 'Без отметки'
              : item.attendance === 'present'
                ? 'Был на занятии'
                : item.attendance === 'absent'
                  ? 'Пропустил занятие'
                  : key <= today()
                    ? 'Посещаемость не отмечена'
                    : 'Пара впереди';
          return `<div class="timeline-item ${item.category === 'Работа' ? 'mint' : item.kind === 'subject' ? 'amber' : ''} ${done ? 'routine-item-done' : ''}" data-routine-item="${safeId(item.id)}"><span class="time">${item.time}</span><div class="timeline-card ${item.kind === 'routine' ? 'routine-entry' : ''}"><div class="row">${item.kind === 'routine' ? `<button class="check-btn routine-check ${done ? 'done' : ''}" data-action="toggle-routine" data-date="${key}" data-id="${safeId(item.id)}" aria-label="${key > today() ? 'Можно отметить после наступления дня' : done ? 'Снять отметку выполнения' : 'Отметить выполненным'}: ${esc(item.title)}" aria-pressed="${!!done}" ${key > today() ? 'disabled' : ''}>${done ? '✓' : ''}</button>` : ''}<div class="grow"><strong>${esc(item.title)}</strong><small>${esc(item.category)}${item.room ? ` · ауд. ${esc(item.room)}` : ''}${item.kind === 'routine' ? (item.date ? ' · Один раз' : ' · Повтор') : ''}</small>${item.kind === 'routine' ? `<span class="routine-entry-status ${done ? 'is-done' : ''}">${status}</span>` : ''}</div>${item.kind === 'routine' ? `<button class="delete-btn routine-edit" data-action="edit-event" data-id="${safeId(item.id)}" aria-label="Изменить пункт «${esc(item.title)}»">✎</button>` : `<button class="attendance-btn" data-action="lesson-options" data-parent="${safeId(item.id)}" data-date="${key}" aria-label="${key <= today() ? 'Отметить посещаемость' : 'Изменить пару'}">${item.attendance === 'present' ? '✓ Был' : item.attendance === 'absent' ? 'Пропуск' : key <= today() ? 'Отметить' : '⋯'}</button>`}</div>${item.kind === 'subject' ? `<span class="lesson-status">${status}</span>` : ''}</div></div>`;
        })
        .join('')}</div>`
    : empty(
        '🗓️',
        'День пока свободен',
        'Добавьте пункт в расписание или занятие по предмету.',
        'new-event',
        'Добавить пункт'
      );
  return `${heading('ПЛАН НА КАЖДЫЙ ДЕНЬ', 'Режим дня', 'Отмечайте выполненное. Каждая дата хранит свой результат.', 'new-event')}${mode}
      <div class="routine-date-bar"><strong>${esc(fmt(key, { weekday: 'long', day: 'numeric', month: 'long' }))}</strong><div>${key !== today() ? `<button class="routine-date-today" data-action="routine-today">Сегодня</button>` : ''}<button class="routine-date-calendar" data-action="toggle-routine-calendar" aria-expanded="${view.routineCalendarOpen}" aria-label="${view.routineCalendarOpen ? 'Скрыть' : 'Открыть'} календарь месяца">${svg('plan')}</button></div></div>
      ${view.routineCalendarOpen ? calendar(key, 'routine') : ''}<div class="week-strip">${week}</div>
      <div class="routine-progress-card" role="group" aria-label="Прогресс режима дня"><div class="row"><span class="routine-progress-icon" aria-hidden="true">${progress.total && progress.done === progress.total ? '✓' : '◉'}</span><div class="grow"><strong>${progress.total ? `${progress.done}/${progress.total} выполнено` : 'Нет пунктов режима'}</strong><small>${progress.total ? (key > today() ? 'Отметить можно в выбранный день' : progress.done === progress.total ? 'Все пункты отмечены' : `Осталось ${progress.total - progress.done} из ${progress.total}`) : 'Добавьте первый пункт'}</small></div><b>${progress.total ? `${Math.round((progress.done / progress.total) * 100)}%` : '—'}</b></div><div class="level-progress"><i style="width:${progress.total ? (progress.done / progress.total) * 100 : 0}%"></i></div><div class="routine-reward">+${ROUTINE_POINTS} баллов за пункт · за день +${progress.done * ROUTINE_POINTS}</div></div>
      ${next ? `<div class="routine-next-row"><button class="routine-next" data-action="jump-routine-item" data-id="${safeId(next.id)}"><span class="routine-next-icon" aria-hidden="true">${next.kind === 'subject' ? '🎓' : '◷'}</span><span class="grow"><small>${nextIsLate ? 'ОСТАЛОСЬ ОТМЕТИТЬ' : 'ДАЛЬШЕ ПО ПЛАНУ'}</small><strong>${esc(next.title)}</strong><span>${next.time}${next.kind === 'subject' ? ` · ${esc(next.category)}` : ''}</span></span><b aria-hidden="true">›</b></button>${next.kind === 'routine' && key <= today() ? `<button class="routine-next-done" data-action="toggle-routine" data-date="${key}" data-id="${safeId(next.id)}" aria-label="Отметить выполненным: ${esc(next.title)}"><span aria-hidden="true">✓</span><small>Готово</small></button>` : ''}</div>` : ''}
      <div class="section-title">Расписание <small>${items.length} событий</small></div>${timeline}
      ${deadlines.length ? `<div class="section-title">Сроки задач <small>${deadlines.filter(t => !t.doneAt).length} осталось</small></div><div class="card">${agendaTaskRows(deadlines)}</div>` : ''}
      ${overdue.length ? `<div class="section-title">Просроченные задачи <small>${overdue.length}</small></div><div class="card">${agendaTaskRows(overdue)}</div>` : ''}
      <button class="routine-add-task" data-action="new-personal-task">+ Личная задача</button>`;
}
