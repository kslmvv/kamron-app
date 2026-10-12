/** Главный экран, раздел «Ещё» и экран Jarvis. */
import { allOpenTasks, gameStats, nextThing, routineProgress, streak } from '../core/selectors.js';
import { data } from '../core/state.js';
import { $, esc, fmt, plural, safeId, today } from '../core/utils.js';
import { serverConfigured } from '../features/api.js';
import { heading } from '../ui/components.js';
import { go } from '../ui/shell.js';

export function renderHome() {
  const stats = gameStats(),
    upcoming = nextThing(),
    open = allOpenTasks(),
    routineToday = routineProgress(today()),
    note = [...data.notes].sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
    )[0];
  const due = open.filter(t => t.due).sort((a, b) => a.due.localeCompare(b.due))[0],
    workOpen = data.projects.reduce((n, p) => n + (p.tasks || []).filter(t => !t.doneAt).length, 0),
    uniOpen = data.subjects.reduce((n, s) => n + (s.tasks || []).filter(t => !t.doneAt).length, 0);
  return `<div class="dash-layout">
      <div class="dash-hero"><div><h1>Привет, ${esc(data.name)} 👋</h1></div><div class="dash-date">${esc(fmt(today(), { weekday: 'short', day: 'numeric', month: 'short' }))}</div></div>
      <button class="progress-card" data-action="go" data-page="insights" style="color:inherit;text-align:left"><div class="score-main"><div class="score-orb">✦</div><div><div class="score-value">${stats.points} ${plural(stats.points, 'балл', 'балла', 'баллов')}</div><div class="score-label">Уровень ${stats.level} · ещё ${250 - (stats.points % 250)}</div></div></div><div class="streak">🔥 ${stats.streak}<small>${plural(stats.streak, 'день', 'дня', 'дней')}</small></div></button>
      <div class="dash-grid">
        <button class="dash-tile routine" data-action="go" data-page="routine"><div class="tile-top"><span class="tile-emoji">🕒</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Режим дня</span><span class="tile-caption">${routineToday.total ? `${routineToday.done}/${routineToday.total} выполнено` : 'Добавьте первый пункт'}</span></div></button>
        <button class="dash-tile work" data-action="go" data-page="work"><div class="tile-top"><span class="tile-emoji">💼</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Работа</span><span class="tile-caption">${data.projects.length} ${plural(data.projects.length, 'проект', 'проекта', 'проектов')} · ${workOpen} ${plural(workOpen, 'задача', 'задачи', 'задач')}</span></div></button>
        <button class="dash-tile uni" data-action="go" data-page="uni"><div class="tile-top"><span class="tile-emoji">🎓</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Универ</span><span class="tile-caption">${data.subjects.length} ${plural(data.subjects.length, 'предмет', 'предмета', 'предметов')} · ${uniOpen} ${plural(uniOpen, 'задача', 'задачи', 'задач')}</span></div></button>
        <button class="dash-tile gym" data-action="go" data-page="gym"><div class="tile-top"><span class="tile-emoji">💪</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Зал</span><span class="tile-caption">${data.gym.length ? `${data.gym.length} ${plural(data.gym.length, 'тренировка', 'тренировки', 'тренировок')} в журнале` : 'Записать тренировку'}</span></div></button>
      </div>
      <div class="dash-bottom"><button class="mini-panel" data-action="go" data-page="routine"><div class="mini-title">ДАЛЬШЕ <span>↗</span></div><div class="mini-value">${upcoming ? esc(upcoming.item.title) : 'Свободное время'}</div><div class="mini-sub">${upcoming ? `${upcoming.key === today() ? 'Сегодня' : esc(fmt(upcoming.key, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${upcoming.item.time}` : 'Можно запланировать день'}</div></button><button class="mini-panel" data-action="go" data-page="tasks"><div class="mini-title">ЗАДАЧИ <span>↗</span></div><div class="mini-value">${due ? esc(due.title) : open.length ? `${open.length} без срока` : 'Всё под контролем'}</div><div class="mini-sub">${due ? `${esc(due.source)} · ${esc(fmt(due.due, { day: 'numeric', month: 'short' }))}` : 'Все задачи в одном месте'}</div></button></div>
      <div class="quick-note"><button class="quick-note-open" data-action="go" data-page="notes"><strong>📝 Заметки</strong><span>${note ? esc(`${note.title ? `${note.title} · ` : ''}${note.body.slice(0, 45)}`) : 'Здесь будут ваши записи'}</span></button><button class="quick-note-add" data-action="new-note" aria-label="Новая заметка">+</button></div>
    </div>`;
}

export function renderMore() {
  const row = (icon, title, detail, page) =>
    `<button class="more-row" data-action="go" data-page="${page}"><span class="more-icon" aria-hidden="true">${icon}</span><span class="grow"><strong>${title}</strong><small>${detail}</small></span><span class="more-arrow" aria-hidden="true">›</span></button>`;
  return `${heading('РАЗДЕЛЫ', 'Ещё', '')}
      <div class="more-group"><div class="more-group-title">Каждый день</div>
        ${row('📝', 'Заметки', `${data.notes.length} ${plural(data.notes.length, 'запись', 'записи', 'записей')}`, 'notes')}
        ${row('☑️', 'Все задачи', `${allOpenTasks().length} ${plural(allOpenTasks().length, 'активная', 'активные', 'активных')}`, 'tasks')}
        ${row('✦', 'Прогресс', `${gameStats().points} ${plural(gameStats().points, 'балл', 'балла', 'баллов')}`, 'insights')}
      </div>
      <div class="more-group"><div class="more-group-title">Мои разделы</div>
        ${row('💼', 'Работа', `${data.projects.length} ${plural(data.projects.length, 'проект', 'проекта', 'проектов')}`, 'work')}
        ${row('🎓', 'Универ', `${data.subjects.length} ${plural(data.subjects.length, 'предмет', 'предмета', 'предметов')}`, 'uni')}
        ${row('💪', 'Зал', data.gym.length ? `${data.gym.length} ${plural(data.gym.length, 'тренировка', 'тренировки', 'тренировок')}` : 'Журнал тренировок', 'gym')}
        ${row('🎮', 'Игры', 'Три игры без сети', 'games')}
      </div>
      <div class="more-group"><div class="more-group-title">Приложение</div>
        ${row('⚙️', 'Настройки', 'Тема, напоминания, данные', 'settings')}
      </div>`;
}

export function renderJarvis() {
  const next = nextThing(),
    project = data.projects[0],
    subject = data.subjects[0];
  const projectAction =
    data.projects.length > 1
      ? { action: 'choose-project-ai' }
      : project
        ? { action: 'open-project-ai', id: project.id }
        : { action: 'new-project' };
  const subjectAction =
    data.subjects.length > 1
      ? { action: 'choose-seminar' }
      : subject
        ? { action: 'open-seminar', id: subject.id }
        : { action: 'new-subject' };
  const destination = (icon, title, detail, route) =>
    `<button class="jarvis-card" data-action="${route.action}" ${route.page ? `data-page="${route.page}"` : ''} ${route.id ? `data-id="${safeId(route.id)}"` : ''}><span class="jarvis-card-icon" aria-hidden="true">${icon}</span><span class="jarvis-card-copy"><strong>${title}</strong><small>${detail}</small></span><span class="jarvis-card-arrow" aria-hidden="true">›</span></button>`;
  return `${heading('ТВОЙ ПОМОЩНИК', 'Jarvis', '')}
      <div class="jarvis-hero"><div class="jarvis-orb" aria-hidden="true">✦</div><div class="grow"><strong>Всё важное под рукой</strong><small>План дня, учёба, проекты и изменения приложения.</small></div></div>
      <div class="jarvis-list">
        ${destination(
          '💬',
          'Живой диалог',
          serverConfigured() ? 'Спросить о дне, задачах и занятиях' : 'Нужен подключённый сервер',
          { action: 'go', page: 'chat' }
        )}
        ${destination('📞', 'Мой день', 'Утренний план и вечерний отчёт', { action: 'go', page: 'phone' })}
        ${destination('🎓', 'Учёба', subject ? 'Подготовка к семинару' : 'Сначала добавь предмет', subjectAction)}
        ${destination('💼', 'Проекты', project ? 'Контекст, GitHub и поручения' : 'Сначала добавь проект', projectAction)}
        ${destination('🛠️', 'Приложение', 'Проверки и запросы на исправление', { action: 'go', page: 'tech' })}
      </div>
      <button class="jarvis-next" data-action="go" data-page="routine"><span class="jarvis-next-label">ДАЛЬШЕ ПО ПЛАНУ</span><strong>${next ? esc(next.item.title) : 'Свободное время'}</strong><small>${next ? `${next.key === today() ? 'Сегодня' : esc(fmt(next.key, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${next.item.time}` : 'Добавь событие в режим дня'}</small><span class="jarvis-next-arrow" aria-hidden="true">›</span></button><p class="jarvis-footnote">Живой разговор и анализ материалов заработают после подключения OpenAI API.</p>`;
}
