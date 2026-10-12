/** Разметка всех форм и поиска по приложению. */
import { EMOJI, ROUTINE_POINTS } from '../core/constants.js';
import { icons, svg } from '../core/icons.js';
import { getTaskList } from '../core/selectors.js';
import { data, view } from '../core/state.js';
import { $, esc, fmt, fromKey, safeId, today } from '../core/utils.js';
import { openModal } from './modal.js';
import { weekdayInputs } from '../ui/components.js';

export function commandResults(query) {
  const q = query.trim().toLocaleLowerCase('ru-RU');
  if (!q) return '';
  const items = [];
  const add = (kind, id, parent, label, detail, haystack) => {
    if (`${label} ${detail} ${haystack || ''}`.toLocaleLowerCase('ru-RU').includes(q))
      items.push({ kind, id, parent, label, detail });
  };
  (data.personalTasks || []).forEach(t =>
    add('personal-task', t.id, '', t.title, `Личная задача${t.doneAt ? ' · выполнено' : ''}`, t.due || '')
  );
  data.projects.forEach(p => {
    add('project', p.id, '', p.name, 'Проект', p.description);
    (p.tasks || []).forEach(t =>
      add('work-task', t.id, p.id, t.title, `Задача · ${p.name}${t.doneAt ? ' · выполнено' : ''}`, p.name)
    );
    (p.notes || []).forEach(n =>
      add('project-note', n.id, p.id, n.text.slice(0, 55), `Заметка · ${p.name}`, n.text)
    );
  });
  data.subjects.forEach(s => {
    add('subject', s.id, '', s.name, 'Предмет', `${s.teacher || ''} ${s.room || ''} ${s.notes || ''}`);
    (s.tasks || []).forEach(t =>
      add('uni-task', t.id, s.id, t.title, `Задание · ${s.name}${t.doneAt ? ' · выполнено' : ''}`, s.name)
    );
  });
  data.notes.forEach(n => add('note', n.id, '', n.title || n.body.slice(0, 45), 'Заметка', n.body));
  data.routine.forEach(e => add('event', e.id, '', e.title, `Режим дня · ${e.time}`, e.category));
  if (!items.length) return '<div class="command-empty">Ничего не найдено. Попробуйте другое слово.</div>';
  return (
    items
      .slice(0, 16)
      .map(
        item =>
          `<button class="command-result" data-action="command-open" data-kind="${item.kind}" data-id="${safeId(item.id)}" data-parent="${safeId(item.parent)}"><span class="command-result-icon" aria-hidden="true">${{ project: '💼', 'personal-task': '📝', 'work-task': '☑️', 'project-note': '🗒️', subject: '🎓', 'uni-task': '📌', note: '📝', event: '🗓️' }[item.kind]}</span><span class="command-result-copy"><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small></span><span class="command-result-arrow" aria-hidden="true">›</span></button>`
      )
      .join('') +
    (items.length > 16
      ? `<div class="command-hint">Показаны первые 16 из ${items.length} результатов</div>`
      : '')
  );
}

export function commandCenter() {
  openModal(
    'Найти и добавить',
    `<div class="command-center"><label class="command-search">${svg('search')}<input id="global-search" type="search" autocomplete="off" placeholder="Проект, предмет, задача, заметка…" aria-label="Поиск по приложению"></label><div class="command-actions" id="command-actions"><div class="command-kicker">БЫСТРЫЕ ДЕЙСТВИЯ</div><div class="command-grid"><button data-action="command-create" data-kind="personal-task"><span>✅</span><strong>Личная задача</strong></button><button data-action="command-create" data-kind="note"><span>📝</span><strong>Заметка</strong></button><button data-action="command-create" data-kind="event"><span>🗓️</span><strong>Событие</strong></button><button data-action="command-create" data-kind="work-task"><span>💼</span><strong>Задача по работе</strong></button><button data-action="command-create" data-kind="uni-task"><span>📚</span><strong>Задание</strong></button><button data-action="command-create" data-kind="project"><span>🚀</span><strong>Проект</strong></button><button data-action="command-create" data-kind="subject"><span>🎓</span><strong>Предмет</strong></button><button data-action="command-create" data-kind="tasks"><span>☑️</span><strong>Все задачи</strong></button><button data-action="command-create" data-kind="insights"><span>📊</span><strong>Прогресс</strong></button><button data-action="command-create" data-kind="tech"><span>🛠️</span><strong>Jarvis · приложение</strong></button></div><p class="command-hint">Поиск доступен из любого раздела. На компьютере — ⌘ K.</p></div><div class="command-results" id="command-results" aria-live="polite" hidden></div></div>`
  );
}

export function techRequestForm() {
  openModal(
    'Запрос на изменение',
    `<form class="form-grid" data-form="tech-request"><label>Что нужно сделать?<select name="kind"><option value="bug">Исправить ошибку</option><option value="design">Изменить дизайн</option><option value="feature">Добавить функцию</option></select></label><label>Где?<select name="area">${['Главная', 'Режим дня', 'Работа', 'Универ', 'Зал', 'Заметки', 'Игры', 'Настройки', 'Всё приложение'].map(area => `<option>${area}</option>`).join('')}</select></label><label>Опишите подробно<textarea name="description" required maxlength="2000" placeholder="Что происходит сейчас? Как повторить проблему? Что хотите изменить?"></textarea></label><label>Каким должен быть результат?<textarea name="expected" maxlength="1000" placeholder="Например, карточка полностью помещается на iPhone"></textarea></label><p class="hint">Запрос хранится только здесь. Для изменения кода скачайте задание и передайте его Claude Code.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить запрос</button></div></form>`
  );
}

export function seminarPrepForm(subjectId, prepId) {
  const s = data.subjects.find(x => x.id === subjectId),
    p = data.seminarPreps.find(x => x.id === prepId && x.subjectId === subjectId);
  if (!s) return;
  openModal(
    p ? 'Изменить подготовку' : 'Новая подготовка',
    `<form class="form-grid" data-form="seminar-prep" data-subject="${safeId(s.id)}" data-id="${safeId(prepId || '')}"><label>Тема занятия<input name="topic" required maxlength="140" value="${esc(p?.topic || '')}" placeholder="Например, основы маркетинговой стратегии"></label><label>Что важно знать или разобрать?<textarea name="context" maxlength="4000" placeholder="Вопросы преподавателя, план семинара, непонятные моменты…">${esc(p?.context || '')}</textarea></label>${!p ? `<label>Материалы<input type="file" name="materials" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,image/*"></label><p class="hint">Фото, PDF, презентации и документы сохраняются на этом устройстве. До 10 файлов по 15 МБ. Файлы не входят в JSON-копию; сохраните оригиналы отдельно.</p>` : ''}<div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
  );
}

export function prepFilesForm(prepId) {
  const p = data.seminarPreps.find(x => x.id === prepId);
  if (!p) return;
  openModal(
    'Добавить материалы',
    `<form class="form-grid" data-form="prep-files" data-id="${safeId(prepId)}"><label>Выбрать файлы<input type="file" name="materials" multiple required accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,image/*"></label><p class="hint">Файлы остаются только в памяти браузера на этом устройстве. До 10 файлов в одной теме, каждый до 15 МБ.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Добавить</button></div></form>`
  );
}

export function projectAiForm(id) {
  const p = data.projects.find(x => x.id === id);
  if (!p) return;
  const ai = p.ai || {};
  openModal(
    'Контекст и подключения',
    `<form class="form-grid" data-form="project-ai" data-id="${safeId(id)}"><label>Главный результат проекта<input name="goal" maxlength="240" value="${esc(ai.goal || '')}" placeholder="Например, запустить первую версию для клиентов"></label><label>Ссылка на репозиторий GitHub<input name="githubUrl" type="url" value="${esc(ai.githubUrl || '')}" placeholder="https://github.com/owner/repo"></label><label>Ссылка на проект Railway<input name="railwayUrl" type="url" value="${esc(ai.railwayUrl || '')}" placeholder="https://railway.com/project/..."></label><p class="hint">Ссылки сохраняются только для этого проекта. Закрытые репозитории, деплои и логи не подключаются в HTML. Никогда не вставляйте сюда токены или пароли.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
  );
}

export function projectAiRequestForm(id) {
  const p = data.projects.find(x => x.id === id);
  if (!p) return;
  openModal(
    'Поручение по проекту',
    `<form class="form-grid" data-form="project-ai-request" data-id="${safeId(id)}"><label>Короткое название<input name="title" required maxlength="120" placeholder="Например, найти причину ошибки входа"></label><label>Что нужно получить?<textarea name="description" required maxlength="2500" placeholder="Опиши задачу и критерий готовности…"></textarea></label><p class="hint">Поручение сохранится в проекте. Скачай его с контекстом проекта и передай Claude Code.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
  );
}

export function projectForm(id) {
  const p = data.projects.find(x => x.id === id),
    logo = p?.logo || '🚀';
  openModal(
    p ? 'Изменить проект' : 'Новый проект',
    `<form class="form-grid" data-form="project" data-id="${safeId(id || '')}"><label>Название<input name="name" required maxlength="60" value="${esc(p?.name || '')}" placeholder="Например, мой стартап"></label><label>Описание и документация<textarea name="description" placeholder="Цель, идея, важные ссылки и контекст">${esc(p?.description || '')}</textarea></label><label>Логотип</label><div class="emoji-picker">${EMOJI.map(e => `<button type="button" class="emoji-option ${e === logo ? 'active' : ''}" data-action="pick-emoji" data-emoji="${e}">${e}</button>`).join('')}</div><input type="hidden" name="logo" value="${esc(logo)}"><input type="hidden" name="clearImage" value=""><div class="form-two"><label>Цвет<input type="color" name="color" value="${esc(p?.color || '#b16b4a')}"></label><label>Или загрузить логотип<input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp"></label></div><p class="hint">Изображение до 400 КБ сохранится только на этом устройстве. Выбор эмодзи заменит ранее загруженный логотип.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">${p ? 'Сохранить' : 'Создать проект'}</button></div></form>`
  );
}

export function subjectForm(id) {
  const s = data.subjects.find(x => x.id === id),
    icons = ['📚', '🧮', '💻', '🧪', '🌍', '⚖️', '🗣️', '🎨'];
  openModal(
    s ? 'Изменить предмет' : 'Новый предмет',
    `<form class="form-grid" data-form="subject" data-id="${safeId(id || '')}">
      <label>Название предмета<input name="name" required maxlength="60" value="${esc(s?.name || '')}" placeholder="Например, алгоритмы"></label>
      <div class="form-two"><label>Время занятия<input type="time" name="time" required value="${esc(s?.time || '10:00')}"></label><label>Длительность, мин<input type="number" name="duration" min="15" max="300" step="5" required value="${Number(s?.duration) || 90}"></label></div><label>Первое занятие с<input type="date" name="startDate" required value="${esc(s?.startDate || today())}"></label>
      <label>Дни занятий</label>${weekdayInputs(s?.days || [])}
      <div class="form-two"><label>Преподаватель<input name="teacher" maxlength="60" value="${esc(s?.teacher || '')}" placeholder="Необязательно"></label><label>Аудитория<input name="room" maxlength="30" value="${esc(s?.room || '')}" placeholder="Например, 204"></label></div>
      <label>Значок<select name="icon">${icons.map(icon => `<option value="${icon}" ${icon === (s?.icon || '📚') ? 'selected' : ''}>${icon}</option>`).join('')}</select></label>
      <label>Тип занятий<select name="mode"><option value="alternate" ${!s || s.mode === 'alternate' ? 'selected' : ''}>Лекция ↔ Семинар</option><option value="lecture" ${s?.mode === 'lecture' ? 'selected' : ''}>Только лекции</option><option value="seminar" ${s?.mode === 'seminar' ? 'selected' : ''}>Только семинары</option><option value="general" ${s?.mode === 'general' ? 'selected' : ''}>Без деления</option></select></label>
      <label class="first-type-row" ${s && s.mode !== 'alternate' ? 'hidden' : ''}>Первым будет<select name="firstType"><option value="Лекция" ${s?.firstType !== 'Семинар' ? 'selected' : ''}>Лекция</option><option value="Семинар" ${s?.firstType === 'Семинар' ? 'selected' : ''}>Семинар</option></select></label>
      <label>Важное о предмете<textarea name="notes" placeholder="Ссылка на материалы, требования, контакты...">${esc(s?.notes || '')}</textarea></label>
      <p class="hint">Если пара отменена, следующая получит её тип. Дни и время можно менять позже.</p>
      <div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
  );
}

export function eventForm(id) {
  const e = data.routine.find(x => x.id === id),
    once = !!e?.date,
    selectedDate = e?.date || (view.page === 'routine' ? view.date : today());
  openModal(
    e ? 'Изменить пункт' : 'Новый пункт режима',
    `<form class="form-grid" data-form="event" data-id="${safeId(id || '')}"><label>Что запланировано<input name="title" required maxlength="70" value="${esc(e?.title || '')}" placeholder="Например, утренняя прогулка"></label><div class="form-two"><label>Время<input type="time" name="time" required value="${esc(e?.time || '09:00')}"></label><label>Раздел<select name="category"><option ${e?.category === 'Личное' ? 'selected' : ''}>Личное</option><option ${e?.category === 'Работа' ? 'selected' : ''}>Работа</option><option ${e?.category === 'Учёба' ? 'selected' : ''}>Учёба</option><option ${e?.category === 'Другое' ? 'selected' : ''}>Другое</option></select></label></div><label>Когда?<select name="repeat" id="event-repeat"><option value="once" ${!e || once ? 'selected' : ''}>Один раз</option><option value="weekly" ${e && !once ? 'selected' : ''}>Повторять по дням</option></select></label><div id="event-once" ${e && !once ? 'hidden' : ''}><label>Дата<input type="date" name="date" value="${esc(selectedDate)}" required ${e && !once ? 'disabled' : ''}></label></div><div id="event-weekly" ${!e || once ? 'hidden' : ''}><label>Дни недели</label>${weekdayInputs(e?.days || [fromKey(selectedDate).getDay()])}</div><p class="hint">Отметка выполнения и +${ROUTINE_POINTS} баллов сохраняются для каждой даты отдельно.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div>${e ? `<button type="button" class="text-btn danger-action" data-action="delete-event" data-id="${safeId(e.id)}">Удалить пункт</button>` : ''}</form>`
  );
}

export function gymLogForm(id) {
  const log = data.gym.find(x => x.id === id);
  openModal(
    log ? 'Изменить тренировку' : 'Записать тренировку',
    `<form class="form-grid" data-form="gym-log" data-id="${safeId(id || '')}"><label>Дата<input type="date" name="date" required max="${today()}" value="${esc(log?.date || (view.date <= today() ? view.date : today()))}"></label><label>Что делал?<input name="title" required maxlength="80" value="${esc(log?.title || '')}" placeholder="Например, ноги и плечи"></label><div class="form-two"><label>Тип<select name="type"><option ${log?.type === 'Силовая' ? 'selected' : ''}>Силовая</option><option ${log?.type === 'Кардио' ? 'selected' : ''}>Кардио</option><option ${log?.type === 'Растяжка' ? 'selected' : ''}>Растяжка</option><option ${log?.type === 'Другое' ? 'selected' : ''}>Другое</option></select></label><label>Минуты<input type="number" name="duration" min="1" max="360" inputmode="numeric" value="${log?.duration ? Number(log.duration) : ''}" placeholder="Необязательно"></label></div><label>Заметка<textarea name="notes" maxlength="1500" placeholder="Упражнения, веса, самочувствие…">${esc(log?.notes || '')}</textarea></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div>${log ? `<button type="button" class="text-btn danger-action" data-action="delete-gym-log" data-id="${safeId(log.id)}">Удалить запись</button>` : ''}</form>`
  );
}

export function taskForm(kind, parent, id) {
  const t = getTaskList(kind, parent)?.find(x => x.id === id),
    due = t ? t.due || '' : kind === 'personal' && view.page === 'routine' ? view.date : '';
  openModal(
    t ? 'Изменить задачу' : kind === 'personal' ? 'Личная задача' : 'Новая задача',
    `<form class="form-grid" data-form="task" data-kind="${kind}" data-parent="${safeId(parent || '')}" data-id="${safeId(id || '')}"><label>Задача<input name="title" required maxlength="120" value="${esc(t?.title || '')}" placeholder="Что нужно сделать?"></label><div class="form-two"><label>Срок<input type="date" name="due" value="${esc(due)}"></label><label>Приоритет<select name="priority"><option value="normal" ${t?.priority !== 'high' ? 'selected' : ''}>Обычный</option><option value="high" ${t?.priority === 'high' ? 'selected' : ''}>Важный</option></select></label></div><p class="hint">${kind === 'personal' ? 'Личная задача не требует проекта. ' : ''}За выполнение начисляется 50 баллов.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div>${t ? `<button type="button" class="text-btn danger-action" data-action="delete-task" data-kind="${kind}" data-parent="${safeId(parent || '')}" data-id="${safeId(t.id)}">Удалить задачу</button>` : ''}</form>`
  );
}

export function quickUniTaskForm() {
  if (!data.subjects.length) {
    subjectForm();
    return;
  }
  openModal(
    'Быстрое задание',
    `<form class="form-grid" data-form="quick-uni-task"><label>Предмет<select name="subject">${data.subjects.map(s => `<option value="${safeId(s.id)}">${esc(s.name)}</option>`).join('')}</select></label><label>Что нужно сделать?<input name="title" required maxlength="120" placeholder="Например, решить задачи к семинару"></label><div class="form-two"><label>Срок<input type="date" name="due"></label><label>Приоритет<select name="priority"><option value="normal">Обычный</option><option value="high">Важный</option></select></label></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Добавить</button></div></form>`
  );
}

export function quickWorkTaskForm() {
  if (!data.projects.length) {
    projectForm();
    return;
  }
  openModal(
    'Быстрая задача',
    `<form class="form-grid" data-form="quick-work-task"><label>Проект<select name="project">${data.projects.map(p => `<option value="${safeId(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>Что нужно сделать?<input name="title" required maxlength="120" placeholder="Например, подготовить первый экран"></label><div class="form-two"><label>Срок<input type="date" name="due"></label><label>Приоритет<select name="priority"><option value="normal">Обычный</option><option value="high">Важный</option></select></label></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Добавить</button></div></form>`
  );
}

export function lessonForm(parent, key) {
  const s = data.subjects.find(x => x.id === parent);
  if (!s) return;
  const canceled = !!s.exceptions?.[key]?.cancelled,
    attendance = s.attendance?.[key] || '';
  openModal(
    `Занятие · ${esc(fmt(key, { day: 'numeric', month: 'long' }))}`,
    `<form class="form-grid" data-form="lesson" data-parent="${safeId(parent)}" data-date="${key}"><div class="card-sub">${esc(s.name)} · ${esc(s.time)}</div><label class="lesson-check"><input type="checkbox" name="cancelled" ${canceled ? 'checked' : ''}> Пара отменена</label>${key <= today() ? `<label>Посещаемость<select name="attendance"><option value="" ${!attendance ? 'selected' : ''}>Не отмечено</option><option value="present" ${attendance === 'present' ? 'selected' : ''}>Был на занятии</option><option value="absent" ${attendance === 'absent' ? 'selected' : ''}>Пропустил</option></select></label>` : ''}<p class="hint">Отменённая пара не участвует в чередовании. Следующая пара автоматически получит её тип.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
  );
}

export function noteForm(id) {
  const n = data.notes.find(x => x.id === id);
  openModal(
    n ? 'Изменить заметку' : 'Новая заметка',
    `<form class="form-grid" data-form="note" data-id="${safeId(id || '')}"><label>Заголовок<input name="title" maxlength="80" value="${esc(n?.title || '')}" placeholder="Коротко о главном"></label><label>Текст<textarea name="body" required placeholder="Запишите мысль...">${esc(n?.body || '')}</textarea></label><div class="form-two"><label>Категория<select name="category"><option ${n?.category === 'Идея' ? 'selected' : ''}>Идея</option><option ${n?.category === 'Личное' ? 'selected' : ''}>Личное</option><option ${n?.category === 'Важное' ? 'selected' : ''}>Важное</option></select></label><label style="align-content:center;display:flex;align-items:center;gap:8px"><input type="checkbox" name="pinned" ${n?.pinned ? 'checked' : ''} style="width:auto;min-height:auto"> Закрепить</label></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
  );
}

export function projectNoteForm(parent, id) {
  const p = data.projects.find(x => x.id === parent),
    note = p?.notes?.find(x => x.id === id);
  if (!p) return;
  openModal(
    note ? 'Изменить заметку' : 'Заметка по проекту',
    `<form class="form-grid" data-form="project-note" data-parent="${safeId(parent)}" data-id="${safeId(id || '')}"><label>Что важно сохранить?<textarea name="text" required maxlength="4000" placeholder="Идея, решение или прогресс...">${esc(note?.text || '')}</textarea></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">${note ? 'Сохранить' : 'Добавить'}</button></div></form>`
  );
}
