/** Все задачи и экран «Моя неделя». */
import { DAY } from '../core/constants.js';
import { allOpenTasks, allTasks, completedTasks, gameStats, routineProgress } from '../core/selectors.js';
import { data, view } from '../core/state.js';
import { $, addDays, dateKey, esc, fmt, fromKey, safeId, today } from '../core/utils.js';
import { empty, heading, overview } from '../ui/components.js';
import { go } from '../ui/shell.js';

export function renderTasks() {
  const tasks = allTasks(),
    open = tasks.filter(t => !t.doneAt),
    completed = tasks.filter(t => t.doneAt),
    todayKey = today();
  if (!tasks.length) {
    view.taskFilter = 'all';
    view.taskQuery = '';
  }
  const filters = [
    ['all', 'Активные'],
    ['today', 'Сегодня + долг'],
    ['upcoming', 'Впереди'],
    ['important', 'Важные'],
    ['no-date', 'Без срока'],
    ['done', 'Готово']
  ];
  const selected = tasks
    .filter(t => {
      if (view.taskFilter === 'done') return !!t.doneAt;
      if (t.doneAt) return false;
      if (view.taskFilter === 'today') return !!t.due && t.due <= todayKey;
      if (view.taskFilter === 'upcoming') return !!t.due && t.due > todayKey;
      if (view.taskFilter === 'important') return t.priority === 'high';
      if (view.taskFilter === 'no-date') return !t.due;
      return true;
    })
    .sort((a, b) =>
      view.taskFilter === 'done'
        ? (b.doneAt || '').localeCompare(a.doneAt || '')
        : (a.due || '9999').localeCompare(b.due || '9999') ||
          Number(b.priority === 'high') - Number(a.priority === 'high')
    );
  const query = view.taskQuery.trim().toLocaleLowerCase('ru-RU');
  const matches = selected.filter(t => `${t.title} ${t.source}`.toLocaleLowerCase('ru-RU').includes(query));
  const rows = selected
    .map(
      t =>
        `<div class="task-hub-row ${t.doneAt ? 'done' : ''}" data-task-card data-search="${esc(`${t.title} ${t.source}`.toLocaleLowerCase('ru-RU'))}" ${query && !`${t.title} ${t.source}`.toLocaleLowerCase('ru-RU').includes(query) ? 'hidden' : ''}><button class="check-btn ${t.doneAt ? 'done' : ''}" data-action="toggle-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="${t.doneAt ? 'Вернуть задачу' : 'Выполнить задачу'}" aria-pressed="${!!t.doneAt}">${t.doneAt ? '✓' : ''}</button><button class="task-hub-copy" data-action="open-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}"><strong>${esc(t.title)}</strong><small>${t.kind === 'personal' ? '📝' : t.kind === 'work' ? '💼' : '🎓'} ${esc(t.source)} · ${t.due ? `${t.due < todayKey && !t.doneAt ? 'Просрочено · ' : ''}${esc(fmt(t.due, { day: 'numeric', month: 'short' }))}` : 'Без срока'}${t.priority === 'high' ? ' · Важно' : ''}</small></button>${t.due && t.due <= todayKey && !t.doneAt ? `<button class="postpone-btn" data-action="postpone-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Перенести задачу на завтра" title="Перенести на завтра">↪</button>` : ''}<button class="delete-btn" data-action="edit-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Изменить задачу">✎</button></div>`
    )
    .join('');
  return `${heading('ВСЕ ДЕЛА В ОДНОМ МЕСТЕ', 'Все задачи', 'Личные дела, проекты и задания со сроками.')}
      ${
        tasks.length
          ? overview(
              [
                [open.length, 'активных'],
                [open.filter(t => t.due && t.due < todayKey).length, 'просрочено'],
                [completed.length, 'готово']
              ],
              'task-hub-overview'
            )
          : ''
      }
      <button class="primary-btn task-hub-create" data-action="new-task-hub">+ Добавить задачу</button>
      ${
        tasks.length
          ? `<div class="task-hub-filters" role="group" aria-label="Фильтр задач">${filters.map(([key, label]) => `<button class="filter-chip ${view.taskFilter === key ? 'active' : ''}" data-action="task-filter" data-filter="${key}" aria-pressed="${view.taskFilter === key}">${label}</button>`).join('')}</div>
      <input class="task-hub-search" id="task-search" type="search" placeholder="Найти задачу в списке" value="${esc(view.taskQuery)}" aria-label="Поиск задач">
      <div class="task-hub-list" id="task-hub-list">${rows}</div><div class="search-empty" id="task-empty" ${matches.length ? 'hidden' : ''}>${query ? 'По этому запросу задач нет.' : 'В этом разделе пока нет задач.'}</div>`
          : empty('☑️', 'Пока нет задач', 'Добавьте личное дело или задачу для работы и универа.')
      }`;
}

export function renderInsights() {
  const keys = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6)),
    keySet = new Set(keys);
  const routineDays = keys.map(key => ({ key, ...routineProgress(key) })),
    routineScheduled = routineDays.filter(p => p.total > 0).length,
    routineComplete = routineDays.filter(p => p.total > 0 && p.done === p.total).length;
  const personalDone = (data.personalTasks || []).filter(
    t => t.doneAt && keySet.has(dateKey(new Date(t.doneAt)))
  );
  const workDone = data.projects
    .flatMap(p => p.tasks || [])
    .filter(t => t.doneAt && keySet.has(dateKey(new Date(t.doneAt))));
  const uniDone = data.subjects
    .flatMap(s => s.tasks || [])
    .filter(t => t.doneAt && keySet.has(dateKey(new Date(t.doneAt))));
  const allDone = [...personalDone, ...workDone, ...uniDone],
    gymDone = data.gym.filter(x => keySet.has(x.date)),
    counts = keys.map(key => allDone.filter(t => dateKey(new Date(t.doneAt)) === key).length),
    max = Math.max(1, ...counts);
  const weekStart = addDays(today(), -((fromKey(today()).getDay() + 6) % 7));
  const weekDone = completedTasks().filter(
    t => dateKey(new Date(t.doneAt)) >= weekStart && dateKey(new Date(t.doneAt)) <= today()
  ).length;
  const overdue = allOpenTasks()
      .filter(t => t.due && t.due < today())
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 3),
    stats = gameStats();
  return `${heading('ПОСЛЕДНИЕ 7 ДНЕЙ', 'Мой прогресс', 'Видно, где получилось продвинуться и что требует внимания.')}
      ${overview(
        [
          [allDone.length, 'задач готово'],
          [allOpenTasks().length, 'в работе'],
          [gameStats().streak, 'дней серия']
        ],
        'insight-overview'
      )}
      <div class="card points-breakdown"><strong>Баллы за всё время · ${stats.points}</strong><span>☑️ Задачи: ${stats.taskPoints}</span><span>🗓️ Режим дня: ${stats.routinePoints}</span></div>
      <div class="card weekly-goal-card"><div class="row"><div class="grow"><span class="eyebrow">ЦЕЛЬ НА ЭТУ НЕДЕЛЮ</span><strong>${weekDone} из ${data.weeklyGoal} задач</strong></div><span class="goal-badge">${weekDone >= data.weeklyGoal ? '✓ Готово' : `${Math.max(0, data.weeklyGoal - weekDone)} осталось`}</span></div><div class="level-progress"><i style="width:${Math.min(100, (weekDone / data.weeklyGoal) * 100)}%"></i></div><button class="text-btn" data-action="go" data-page="tasks">Открыть все задачи →</button></div>
      <div class="card insight-card"><div class="section-title">Задачи по дням</div><div class="insight-chart" role="img" aria-label="Выполненные задачи за последние семь дней">${keys.map((key, i) => `<div class="insight-day"><span class="insight-count">${counts[i] || ''}</span><div class="insight-track"><i style="height:${counts[i] ? Math.max(14, Math.round((counts[i] / max) * 100)) : 5}%"></i></div><small>${DAY[fromKey(key).getDay()]}</small></div>`).join('')}</div><p class="hint">${allDone.length ? 'Каждый столбец показывает задачи, завершённые в этот день.' : 'Пока нет выполненных задач за неделю. Начните с одного небольшого шага.'}</p></div>
      <div class="card routine-insight-card"><div class="row"><div class="grow"><strong>Режим дня</strong><small>${routineScheduled ? `${routineComplete} из ${routineScheduled} дней отмечены полностью` : 'Пока нет пунктов режима'}</small></div><span>🗓️</span></div><div class="routine-insight-days">${routineDays.map(p => `<button data-action="open-routine-day" data-date="${p.key}" aria-label="${esc(fmt(p.key, { weekday: 'long', day: 'numeric', month: 'long' }))}: ${p.done} из ${p.total} пунктов"><span>${DAY[fromKey(p.key).getDay()]}</span><strong class="${p.total && p.done === p.total ? 'complete' : ''}">${p.total ? `${p.done}/${p.total}` : '—'}</strong></button>`).join('')}</div><p class="hint">Нажмите на день, чтобы открыть расписание и отметить пункты.</p></div>
      <div class="insight-split"><div class="card"><span>📝 Личное</span><strong>${personalDone.length}</strong><small>за 7 дней</small></div><div class="card"><span>💼 Работа</span><strong>${workDone.length}</strong><small>за 7 дней</small></div><div class="card"><span>🎓 Универ</span><strong>${uniDone.length}</strong><small>за 7 дней</small></div><button class="card insight-gym" data-action="go" data-page="gym"><span>💪 Зал</span><strong>${gymDone.length}</strong><small>за 7 дней · открыть ›</small></button></div>
      ${overdue.length ? `<div class="section-title">Нужно внимание <small>${overdue.length} ближайших</small></div><div class="card insight-overdue">${overdue.map(t => `<button data-action="open-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}"><span><strong>${esc(t.title)}</strong><small>${esc(t.source)} · срок ${esc(fmt(t.due, { day: 'numeric', month: 'short' }))}</small></span><b>›</b></button>`).join('')}</div>` : ''}`;
}
