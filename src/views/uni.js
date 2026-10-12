/** Универ: предметы, страница предмета и подготовка к семинару. */
import { DAY, PREP_QUESTIONS } from '../core/constants.js';
import { svg } from '../core/icons.js';
import {
  nextLesson,
  nextSeminar,
  prepFor,
  scheduledOn,
  subjectMeeting,
  universityTasks,
  upcomingLessons
} from '../core/selectors.js';
import { data, view } from '../core/state.js';
import { $, addDays, esc, fmt, plural, safeId, today } from '../core/utils.js';
import { empty, heading, overview, taskRows } from '../ui/components.js';
import { go } from '../ui/shell.js';

export function renderUni() {
  const open = universityTasks().filter(t => !t.doneAt),
    overdue = open.filter(t => t.due && t.due < today()),
    dueSoon = open
      .filter(t => t.due)
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 4);
  const lessons = [];
  for (let n = 0; n < 7; n++) {
    const key = addDays(today(), n);
    for (const s of data.subjects) {
      const meeting = subjectMeeting(s, key);
      if (meeting) lessons.push({ key, subject: s, meeting });
    }
  }
  lessons.sort((a, b) => a.key.localeCompare(b.key) || a.subject.time.localeCompare(b.subject.time));
  const next = lessons[0],
    todayCount = lessons.filter(x => x.key === today()).length;
  const list = data.subjects
    .map(s => {
      const next = nextLesson(s),
        count = (s.tasks || []).filter(t => !t.doneAt).length;
      return `<article class="card clickable subject-card" data-action="open-subject" data-subject-card data-search="${esc(s.name.toLowerCase())}" data-id="${safeId(s.id)}" ${view.uniQuery && !s.name.toLowerCase().includes(view.uniQuery.toLowerCase()) ? 'hidden' : ''} tabindex="0" role="button"><div class="row"><div class="subject-icon">${esc(s.icon || '📚')}</div><div class="grow"><div class="card-title">${esc(s.name)}</div><div class="card-sub">${next ? `${esc(fmt(next.key, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${esc(s.time)} · ${esc(next.type)}` : 'Ближайших занятий нет'}</div></div>${svg('chevron')}</div><div class="utility-row"><span class="tag amber">${count} задач</span>${s.room ? `<span class="tag">Ауд. ${esc(s.room)}</span>` : ''}${s.teacher ? `<span class="tag">${esc(s.teacher)}</span>` : ''}</div></article>`;
    })
    .join('');
  return `${heading('ВСЁ ПО УЧЁБЕ', 'Универ', 'Расписание, задания и ближайшие пары.', data.subjects.length ? 'new-subject' : null)}
      ${data.subjects.length ? `<div class="uni-summary"><div><strong>${todayCount}</strong><span>${plural(todayCount, 'пара', 'пары', 'пар')} сегодня</span></div><div><strong>${open.length}</strong><span>${plural(open.length, 'задача', 'задачи', 'задач')}</span></div><div class="${overdue.length ? 'urgent' : ''}"><strong>${overdue.length}</strong><span>просрочено</span></div></div><button class="task-hub-link" data-action="go" data-page="tasks">Все задачи <span>›</span></button>` : ''}
      ${data.subjects.length ? `<div class="uni-actions"><button class="primary-btn" data-action="quick-uni-task">+ Новое задание</button><button class="secondary-btn" data-action="export-calendar">↓ В календарь</button></div><button class="ai-entry" data-action="choose-seminar"><span class="ai-entry-icon">🎓</span><span class="grow"><strong>Jarvis · подготовка</strong><small>Тема, материалы и тренировка</small></span><span aria-hidden="true">›</span></button>` : ''}
      ${next ? `<button class="uni-next" data-action="open-subject" data-id="${safeId(next.subject.id)}"><div class="eyebrow">БЛИЖАЙШАЯ ПАРА <span aria-hidden="true">›</span></div><div class="row"><div class="grow"><strong>${esc(next.subject.name)}</strong><span>${esc(fmt(next.key, { weekday: 'long', day: 'numeric', month: 'short' }))} · ${esc(next.subject.time)}${next.subject.room ? ` · ауд. ${esc(next.subject.room)}` : ''}</span></div><span class="tag lesson-kind ${next.meeting.type === 'Семинар' ? 'seminar' : 'lecture'}">${esc(next.meeting.type)}</span></div></button>` : ''}
      ${
        lessons.length > 1
          ? `<div class="section-title">Следующие пары</div><div class="card lesson-peek-list">${lessons
              .slice(1, 4)
              .map(
                x =>
                  `<button class="lesson-peek" data-action="open-subject" data-id="${safeId(x.subject.id)}"><span class="lesson-peek-date"><strong>${esc(fmt(x.key, { day: 'numeric' }))}</strong><small>${esc(fmt(x.key, { month: 'short' }))}</small></span><span class="grow"><strong>${esc(x.subject.name)}</strong><small>${esc(x.subject.time)} · ${esc(x.meeting.type)}${x.subject.room ? ` · ауд. ${esc(x.subject.room)}` : ''}</small></span><span class="peek-arrow">›</span></button>`
              )
              .join('')}</div>`
          : ''
      }
      ${dueSoon.length ? `<div class="section-title">Ближайшие дедлайны</div><div class="card">${dueSoon.map(t => `<div class="task-row"><button class="check-btn" data-action="toggle-task" data-kind="uni" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Выполнить задачу"></button><div class="task-text">${esc(t.title)}<span class="task-meta">${esc(t.subject)} · ${t.due < today() ? 'Просрочено · ' : ''}${esc(fmt(t.due, { day: 'numeric', month: 'short' }))}</span></div><button class="delete-btn" data-action="open-task" data-kind="uni" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Открыть задание">›</button></div>`).join('')}</div>` : ''}
      <div class="section-title">Предметы <small>${data.subjects.length}</small></div>${data.subjects.length ? `<input class="subject-search" id="subject-search" type="search" placeholder="Найти предмет" value="${esc(view.uniQuery || '')}" aria-label="Найти предмет"><div id="subject-list">${list}</div><div class="search-empty" id="subject-search-empty" ${data.subjects.some(s => s.name.toLowerCase().includes((view.uniQuery || '').trim().toLowerCase())) ? 'hidden' : ''}>По этому запросу предметов нет. Попробуйте другое название.</div>` : empty('🎓', 'Добавьте предмет', 'Укажите дни и время пар, затем заведите задания.', 'new-subject', 'Добавить предмет')}`;
}

export function renderSubject() {
  const s = data.subjects.find(x => x.id === view.id);
  if (!s) {
    view.page = 'uni';
    return renderUni();
  }
  const upcoming = upcomingLessons(s, 6, true),
    recent = [];
  for (let n = 1; n < 45 && recent.length < 4; n++) {
    const key = addDays(today(), -n);
    if (scheduledOn(s, key)) recent.push({ key, meeting: subjectMeeting(s, key) });
  }
  const tasks = s.tasks || [],
    open = tasks.filter(t => !t.doneAt),
    completed = tasks.filter(t => t.doneAt),
    shown = view.subjectFilter === 'done' ? completed : view.subjectFilter === 'all' ? tasks : open;
  return `<button class="back-link" data-action="go" data-page="uni">← Все предметы</button><div class="detail-head"><div class="row"><div class="subject-icon">${esc(s.icon || '📚')}</div><div class="grow"><h1>${esc(s.name)}</h1><p>${(s.days || []).map(d => DAY[d]).join(', ')} · ${esc(s.time)} · ${Number(s.duration) || 90} мин${s.room ? ` · ауд. ${esc(s.room)}` : ''}</p></div><button class="icon-btn" data-action="edit-subject" data-id="${safeId(s.id)}" aria-label="Изменить предмет">✎</button></div>${s.teacher ? `<div class="subject-detail-line">👤 ${esc(s.teacher)}</div>` : ''}${s.notes ? `<div class="subject-detail-line">${esc(s.notes)}</div>` : ''}</div>
      <button class="ai-entry" data-action="open-seminar" data-id="${safeId(s.id)}"><span class="ai-entry-icon">✦</span><span class="grow"><strong>Jarvis · подготовка к ${s.mode === 'lecture' ? 'лекции' : s.mode === 'general' ? 'занятию' : 'семинару'}</strong><small>Тема, файлы и самопроверка</small></span><span aria-hidden="true">›</span></button>
      <div class="subject-calendar-action"><button class="secondary-btn" data-action="export-calendar" data-id="${safeId(s.id)}">↓ Пары в календарь</button></div>
      ${overview(
        [
          [open.length, 'активных задач'],
          [completed.length, 'выполнено'],
          [upcoming.filter(x => !x.cancelled).length, 'занятий впереди']
        ],
        'subject-overview'
      )}
      <div class="section-title">Ближайшие занятия</div><div class="card">${upcoming.length ? upcoming.map(x => `<div class="lesson-row"><div class="lesson-date"><strong>${esc(fmt(x.key, { day: 'numeric' }))}</strong><span>${esc(fmt(x.key, { month: 'short' }))}</span></div><div class="grow"><strong class="lesson-kind ${x.cancelled ? 'cancelled' : x.meeting.type === 'Семинар' ? 'seminar' : 'lecture'}">${esc(x.cancelled ? 'Отменено' : x.meeting.type)}</strong><small>${esc(fmt(x.key, { weekday: 'long' }))} · ${esc(s.time)}${s.room ? ` · ${esc(s.room)}` : ''}</small></div><button class="icon-btn" data-action="lesson-options" data-parent="${safeId(s.id)}" data-date="${x.key}" aria-label="Изменить занятие">⋯</button></div>`).join('') : 'Ближайших занятий нет.'}</div>
      <div class="section-title">Задания <button class="text-btn" data-action="new-task" data-kind="uni" data-parent="${safeId(s.id)}">+ Добавить</button></div><div class="toolbar"><button class="filter-chip ${view.subjectFilter === 'open' ? 'active' : ''}" data-action="subject-filter" data-filter="open">Активные ${open.length}</button><button class="filter-chip ${view.subjectFilter === 'done' ? 'active' : ''}" data-action="subject-filter" data-filter="done">Готово ${completed.length}</button><button class="filter-chip ${view.subjectFilter === 'all' ? 'active' : ''}" data-action="subject-filter" data-filter="all">Все</button></div><div class="card">${shown.length ? taskRows(shown, 'uni', s.id) : `<p class="small muted">${view.subjectFilter === 'done' ? 'Пока нет выполненных заданий.' : 'Здесь пока пусто.'}</p>`}</div>
      ${recent.length ? `<div class="section-title">Прошедшие занятия</div><div class="card">${recent.map(x => `<div class="lesson-row"><div class="lesson-date"><strong>${esc(fmt(x.key, { day: 'numeric' }))}</strong><span>${esc(fmt(x.key, { month: 'short' }))}</span></div><div class="grow"><strong>${esc(x.meeting?.type || 'Отменено')}</strong><small>${esc(s.attendance?.[x.key] === 'present' ? 'Был на занятии' : s.attendance?.[x.key] === 'absent' ? 'Пропустил' : 'Статус не указан')}</small></div><button class="icon-btn" data-action="lesson-options" data-parent="${safeId(s.id)}" data-date="${x.key}" aria-label="Статус занятия">⋯</button></div>`).join('')}</div>` : ''}
      <div class="utility-row"><button class="secondary-btn" data-action="delete-subject" data-id="${safeId(s.id)}">Удалить предмет</button></div>`;
}

export function renderSeminar() {
  const s = data.subjects.find(x => x.id === view.id);
  if (!s) {
    view.page = 'uni';
    return renderUni();
  }
  const sessions = prepFor(s.id),
    p = sessions.find(x => x.id === view.prepId) || sessions[0],
    next = nextSeminar(s);
  const answers = p?.answers || {},
    answered = PREP_QUESTIONS.filter((_, i) => String(answers[i] || '').trim()).length;
  return `<button class="back-link" data-action="go" data-page="subject" data-id="${safeId(s.id)}">← ${esc(s.name)}</button>${heading('УВЕРЕННЕЕ НА ЗАНЯТИИ', 'Jarvis · учёба', 'Собери материалы и проверь, что можешь объяснить тему.')}
      <div class="ai-hero"><span aria-hidden="true">🎓</span><div><strong>${esc(s.name)}</strong><small>${next ? `Следующий ${esc(next.meeting.type.toLowerCase())}: ${esc(fmt(next.key, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${esc(s.time)}` : 'Будущая дата в расписании пока не найдена'}</small></div></div>
      <div class="ai-stage"><strong>Jarvis · подготовка</strong><small>Тема, файлы и ответы сохраняются здесь. Анализ материалов появится после подключения OpenAI API.</small></div>
      <div class="section-title">Мои подготовки <button class="text-btn" data-action="new-seminar-prep" data-id="${safeId(s.id)}">+ Новая тема</button></div>
      ${sessions.length ? `<div class="prep-tabs">${sessions.map(x => `<button class="prep-tab ${x.id === p?.id ? 'active' : ''}" data-action="select-prep" data-id="${safeId(x.id)}" aria-pressed="${x.id === p?.id}"><strong>${esc(x.topic)}</strong><small>${esc(fmt(x.createdAt.slice(0, 10), { day: 'numeric', month: 'short' }))}</small></button>`).join('')}</div>` : empty('📚', 'Начни с темы', 'Укажи тему семинара и приложи фото, презентацию или документ.', 'new-seminar-prep', 'Создать подготовку')}
      ${
        p
          ? `<div class="card prep-card"><div class="row"><div class="grow"><div class="eyebrow">ТЕКУЩАЯ ТЕМА</div><h2>${esc(p.topic)}</h2></div><button class="text-btn" data-action="edit-seminar-prep" data-id="${safeId(p.id)}">Изменить</button></div>${p.context ? `<p class="prep-context">${esc(p.context)}</p>` : ''}<div class="prep-meta">${(p.attachments || []).length} материалов · ${answered}/${PREP_QUESTIONS.length} ответов</div></div>
      <div class="section-title">Материалы <small>${(p.attachments || []).length}</small></div><div class="card prep-materials">${(p.attachments || []).length ? (p.attachments || []).map(f => `<div class="prep-file"><span aria-hidden="true">${f.type?.startsWith('image/') ? '🖼️' : '📄'}</span><span class="grow"><strong>${esc(f.name)}</strong><small>${Math.max(1, Math.round(f.size / 1024))} КБ · отдельно от резервной копии</small></span><button class="text-btn" data-action="open-prep-file" data-id="${safeId(f.id)}" data-prep="${safeId(p.id)}" aria-label="Открыть файл ${esc(f.name)}">Открыть</button></div>`).join('') : '<p class="small muted">Добавь презентацию, документ, фото или текстовый файл.</p>'}<button class="secondary-btn prep-add" data-action="add-prep-files" data-id="${safeId(p.id)}">+ Добавить файлы</button></div>
      <div class="section-title">Тренировка ответа <small data-answer-count>${answered}/${PREP_QUESTIONS.length}</small></div><p class="ai-helper-copy">Ответь без подсказки, затем проверь себя по своим материалам. Оценку ИИ этот макет пока не выдаёт.</p>${PREP_QUESTIONS.map((q, i) => `<div class="card prep-question"><div class="prep-question-title"><span>${i + 1}</span><strong>${esc(q)}</strong></div><textarea data-prep-answer="${i}" data-prep="${safeId(p.id)}" maxlength="3000" placeholder="Мой ответ…">${esc(answers[i] || '')}</textarea><small data-prep-save="${i}">Сохраняется автоматически</small></div>`).join('')}
      <div class="card prep-export"><strong>Передать в ChatGPT</strong><p>Скачай пакет с темой, контекстом и своими ответами. Приложи к нему исходные файлы вручную — в HTML нет отправки файлов модели.</p><button class="primary-btn" data-action="export-prep" data-id="${safeId(p.id)}">↓ Скачать пакет подготовки</button></div><button class="text-btn danger-action prep-delete" data-action="delete-prep" data-id="${safeId(p.id)}">Удалить эту подготовку</button>`
          : ''
      }`;
}
