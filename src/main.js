/** Точка входа: обработчик действий, жесты, запуск приложения и service worker. */
import { PREP_QUESTIONS, THEMES } from './core/constants.js';
import { getTaskList, nextSeminar } from './core/selectors.js';
import { data, defaults, onSaved, rt, save, setData, view } from './core/state.js';
import { toast } from './core/toast.js';
import {
  $,
  addDays,
  dateKey,
  downloadText,
  esc,
  fromKey,
  safeDownloadPart,
  safeId,
  today
} from './core/utils.js';
import {
  downloadPrep,
  downloadTechRequest,
  exportCalendar,
  exportData,
  importData,
  projectAiBrief,
  validGithubUrl
} from './features/export.js';
import { deletePrepFile, getPrepFile } from './features/files.js';
import { checkServer, githubCommit, serverConfigured, syncSnapshot } from './features/api.js';
import { pullChanges } from './features/incoming.js';
import { clearChat, sendChatMessage } from './features/chat.js';
import { reviewPrep } from './features/prep.js';
import { checkReminders } from './features/reminders.js';
import { postponeTask, toggleRoutine, toggleTask } from './features/tasks.js';
import {
  commandCenter,
  commandResults,
  eventForm,
  gymLogForm,
  lessonForm,
  moveDayForm,
  noteForm,
  prepFilesForm,
  projectAiForm,
  projectAiRequestForm,
  projectForm,
  projectNoteForm,
  quickUniTaskForm,
  quickWorkTaskForm,
  seminarPrepForm,
  serverForm,
  subjectForm,
  taskForm,
  techRequestForm
} from './forms/definitions.js';
import { closeModal, flushPrepAnswer, openModal, submitForm } from './forms/modal.js';
import { clearBlockPreview, newBlock, placeBlock, previewBlock } from './games/blocks.js';
import { persistGames } from './games/index.js';
import { flipMemory, newMemory } from './games/memory.js';
import { moveMerge, newMerge } from './games/merge.js';
import { empty } from './ui/components.js';
import {
  go,
  jumpToProjectNote,
  jumpToTask,
  pageFromLocation,
  refreshPage,
  rememberLocation,
  render
} from './ui/shell.js';
import { repairRoutineHistory } from './views/tech.js';

async function onAction(el) {
  const a = el.dataset.action,
    id = el.dataset.id;
  if (a === 'go') {
    go(el.dataset.page, id || null);
    return;
  }
  if (a === 'open-seminar') {
    view.prepId = null;
    go('seminar', id);
    return;
  }
  if (a === 'choose-project-ai') {
    openModal(
      'Выберите проект',
      `<div class="ai-chooser">${data.projects.map(p => `<button class="command-result" data-action="choose-project-ai-item" data-id="${safeId(p.id)}"><span class="command-result-icon">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || '🚀')}</span><span class="command-result-copy"><strong>${esc(p.name)}</strong><small>${(p.tasks || []).filter(t => !t.doneAt).length} задач в работе</small></span><span class="command-result-arrow">›</span></button>`).join('')}</div>`
    );
    return;
  }
  if (a === 'choose-project-ai-item') {
    closeModal();
    go('project-ai', id);
    return;
  }
  if (a === 'choose-seminar') {
    openModal(
      'Выберите предмет',
      `<div class="ai-chooser">${data.subjects.map(s => `<button class="command-result" data-action="choose-seminar-subject" data-id="${safeId(s.id)}"><span class="command-result-icon">${esc(s.icon || '📚')}</span><span class="command-result-copy"><strong>${esc(s.name)}</strong><small>${esc(nextSeminar(s)?.meeting.type || 'Занятие')}</small></span><span class="command-result-arrow">›</span></button>`).join('')}</div>`
    );
    return;
  }
  if (a === 'choose-seminar-subject') {
    closeModal();
    view.prepId = null;
    go('seminar', id);
    return;
  }
  if (a === 'new-seminar-prep') {
    seminarPrepForm(id || view.id);
    return;
  }
  if (a === 'edit-seminar-prep') {
    const p = data.seminarPreps.find(x => x.id === id);
    if (p) seminarPrepForm(p.subjectId, id);
    return;
  }
  if (a === 'select-prep') {
    view.prepId = id;
    refreshPage(false);
    return;
  }
  if (a === 'add-prep-files') {
    prepFilesForm(id);
    return;
  }
  if (a === 'open-prep-file') {
    const p = data.seminarPreps.find(x => x.id === el.dataset.prep);
    if (!p?.attachments?.some(f => f.id === id)) return;
    const file = await getPrepFile(id).catch(() => null);
    if (!file) {
      toast('Файл не найден на этом устройстве');
      return;
    }
    const url = URL.createObjectURL(file),
      link = document.createElement('a');
    link.href = url;
    link.download = p.attachments.find(f => f.id === id).name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return;
  }
  if (a === 'prep-review') {
    await reviewPrep(id);
    return;
  }
  if (a === 'export-prep') {
    const p = data.seminarPreps.find(x => x.id === id);
    if (p) await downloadPrep(p);
    return;
  }
  if (a === 'delete-prep') {
    const p = data.seminarPreps.find(x => x.id === id);
    if (!p || !confirm('Удалить подготовку и материалы на этом устройстве?')) return;
    const prior = data.seminarPreps;
    data.seminarPreps = prior.filter(x => x.id !== id);
    if (!save()) {
      data.seminarPreps = prior;
      return;
    }
    for (const f of p.attachments || []) await deletePrepFile(f.id).catch(() => {});
    view.prepId = null;
    refreshPage(false);
    toast('Подготовка удалена');
    return;
  }
  if (a === 'open-project-ai') {
    go('project-ai', id);
    return;
  }
  if (a === 'edit-project-ai') {
    projectAiForm(id);
    return;
  }
  if (a === 'new-project-ai-request') {
    projectAiRequestForm(id);
    return;
  }
  if (a === 'export-project-ai-request') {
    const p = data.projects.find(x => (x.ai?.requests || []).some(r => r.id === id)),
      r = p?.ai.requests.find(x => x.id === id);
    if (p && r) {
      downloadText(
        projectAiBrief(p, r),
        `project-${safeDownloadPart(p.name)}-${safeDownloadPart(r.title)}.md`
      );
      toast('Поручение скачано');
    }
    return;
  }
  if (a === 'delete-project-ai-request') {
    const p = data.projects.find(x => (x.ai?.requests || []).some(r => r.id === id));
    if (!p || !confirm('Удалить это поручение?')) return;
    const old = p.ai.requests;
    p.ai.requests = old.filter(x => x.id !== id);
    if (!save()) {
      p.ai.requests = old;
      return;
    }
    refreshPage(false);
    return;
  }
  if (a === 'server-form') {
    serverForm();
    return;
  }
  if (a === 'server-check') {
    const form = el.closest('form'),
      status = form?.querySelector('#server-status');
    const url = form?.querySelector('input[name="url"]')?.value || '';
    if (status) status.textContent = 'Проверяем…';
    try {
      const health = await checkServer(url);
      const caps = health.capabilities || {};
      const parts = [
        health.configured ? 'ключ доступа задан' : 'на сервере не задан APP_ACCESS_TOKEN',
        caps.jarvis ? `модель: ${caps.provider}` : 'модель не настроена',
        caps.githubPrivate ? 'GitHub с токеном' : 'GitHub только публичный',
        caps.railway ? 'Railway подключён' : 'Railway не настроен'
      ];
      if (status) status.textContent = `Связь есть. ${parts.join(', ')}.`;
    } catch (err) {
      if (status) status.textContent = `Не вышло: ${err.message}`;
    }
    return;
  }
  if (a === 'chat-starter') {
    await sendChatMessage(el.dataset.text || '');
    return;
  }
  if (a === 'chat-clear') {
    clearChat();
    return;
  }
  if (a === 'sync-github') {
    const p = data.projects.find(x => x.id === id),
      github = validGithubUrl(p?.ai?.githubUrl || '');
    if (!p || !github) return;
    const parts = new URL(github).pathname.split('/').filter(Boolean);
    el.disabled = true;
    el.textContent = 'Проверяем…';
    try {
      // С подключённым сервером работают и закрытые репозитории: токен GitHub
      // лежит там. Без сервера остаётся прямой запрос — он видит только публичные.
      let commit;
      if (serverConfigured()) {
        const result = await githubCommit(github);
        if (result.empty) throw new Error('empty');
        commit = { sha: result.sha, commit: { message: result.message, committer: { date: result.date } } };
      } else {
        const response = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}/commits?per_page=1`,
          { headers: { Accept: 'application/vnd.github+json' } }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const commits = await response.json();
        if (!Array.isArray(commits) || !commits[0]) throw new Error('empty');
        commit = commits[0];
      }
      p.ai.githubSnapshot = {
        sha: String(commit.sha || ''),
        message: String(commit.commit?.message || '')
          .split('\n')[0]
          .slice(0, 300),
        date: String(commit.commit?.committer?.date || ''),
        checkedAt: new Date().toISOString()
      };
      if (save()) {
        refreshPage(false);
        toast('Публичные изменения обновлены');
      }
    } catch (error) {
      el.disabled = false;
      el.textContent = 'Проверить публичные изменения';
      toast('Не удалось прочитать публичный GitHub. Проверьте сеть и доступ.');
    }
    return;
  }
  if (a === 'settings') {
    go('settings');
    return;
  }
  if (a === 'toggle-settings-more') {
    view.settingsMoreOpen = !view.settingsMoreOpen;
    refreshPage(false);
    return;
  }
  if (a === 'open-task') {
    if (el.dataset.kind === 'personal') taskForm('personal', '', id);
    else jumpToTask(el.dataset.kind, el.dataset.parent, id);
    return;
  }
  if (a === 'command-center') {
    commandCenter();
    return;
  }
  if (a === 'command-create') {
    closeModal();
    if (el.dataset.kind === 'personal-task') taskForm('personal', '');
    else if (el.dataset.kind === 'note') noteForm();
    else if (el.dataset.kind === 'event') eventForm();
    else if (el.dataset.kind === 'work-task') quickWorkTaskForm();
    else if (el.dataset.kind === 'uni-task') data.subjects.length ? quickUniTaskForm() : subjectForm();
    else if (el.dataset.kind === 'project') projectForm();
    else if (el.dataset.kind === 'subject') subjectForm();
    else if (el.dataset.kind === 'tasks') go('tasks');
    else if (el.dataset.kind === 'insights') go('insights');
    else if (el.dataset.kind === 'tech') go('tech');
    return;
  }
  if (a === 'command-open') {
    closeModal();
    const kind = el.dataset.kind;
    if (kind === 'personal-task') taskForm('personal', '', id);
    else if (kind === 'project') go('project', id);
    else if (kind === 'subject') go('subject', id);
    else if (kind === 'work-task') jumpToTask('work', el.dataset.parent, id);
    else if (kind === 'project-note') jumpToProjectNote(el.dataset.parent, id);
    else if (kind === 'uni-task') jumpToTask('uni', el.dataset.parent, id);
    else if (kind === 'note') noteForm(id);
    else if (kind === 'event') eventForm(id);
    return;
  }
  if (a === 'set-theme') {
    if (!THEMES[el.dataset.theme]) return;
    const pageEl = $('#page'),
      scroll = pageEl.scrollTop;
    data.theme = el.dataset.theme;
    save();
    render();
    pageEl.scrollTop = scroll;
    pageEl.classList.add('page-enter');
    setTimeout(() => pageEl.classList.remove('page-enter'), 420);
    return;
  }
  if (a === 'open-project') {
    go('project', id);
    return;
  }
  if (a === 'open-subject') {
    go('subject', id);
    return;
  }
  if (a === 'close-modal') {
    closeModal();
    return;
  }
  if (a === 'new-project' || a === 'edit-project') {
    projectForm(id);
    return;
  }
  if (a === 'new-subject' || a === 'edit-subject') {
    subjectForm(id);
    return;
  }
  if (a === 'new-event' || a === 'edit-event') {
    eventForm(id);
    return;
  }
  if (a === 'move-day') {
    moveDayForm(el.dataset.date || view.date);
    return;
  }
  if (a === 'new-gym-log' || a === 'edit-gym-log') {
    gymLogForm(id);
    return;
  }
  if (a === 'new-personal-task') {
    taskForm('personal', '');
    return;
  }
  if (a === 'new-task-hub') {
    openModal(
      'Новая задача',
      `<div class="ai-chooser"><button class="command-result" data-action="choose-task-kind" data-kind="personal"><span class="command-result-icon">📝</span><span class="command-result-copy"><strong>Личная</strong><small>Дело без проекта или предмета</small></span><span class="command-result-arrow">›</span></button><button class="command-result" data-action="choose-task-kind" data-kind="work"><span class="command-result-icon">💼</span><span class="command-result-copy"><strong>Работа</strong><small>${data.projects.length ? 'Задача внутри проекта' : 'Сначала создадим проект'}</small></span><span class="command-result-arrow">›</span></button><button class="command-result" data-action="choose-task-kind" data-kind="uni"><span class="command-result-icon">🎓</span><span class="command-result-copy"><strong>Универ</strong><small>${data.subjects.length ? 'Задание по предмету' : 'Сначала добавим предмет'}</small></span><span class="command-result-arrow">›</span></button></div>`
    );
    return;
  }
  if (a === 'choose-task-kind') {
    closeModal();
    if (el.dataset.kind === 'personal') taskForm('personal', '');
    else if (el.dataset.kind === 'work') quickWorkTaskForm();
    else if (el.dataset.kind === 'uni') quickUniTaskForm();
    return;
  }
  if (a === 'new-task' || a === 'edit-task') {
    taskForm(el.dataset.kind, el.dataset.parent, id);
    return;
  }
  if (a === 'quick-work-task') {
    quickWorkTaskForm();
    return;
  }
  if (a === 'quick-uni-task') {
    quickUniTaskForm();
    return;
  }
  if (a === 'lesson-options') {
    lessonForm(el.dataset.parent, el.dataset.date);
    return;
  }
  if (a === 'subject-filter') {
    view.subjectFilter = el.dataset.filter;
    refreshPage();
    return;
  }
  if (a === 'task-filter') {
    const left = $('#page').querySelector?.('.task-hub-filters')?.scrollLeft || 0;
    view.taskFilter = el.dataset.filter;
    refreshPage();
    const bar = $('#page').querySelector?.('.task-hub-filters');
    if (bar) bar.scrollLeft = left;
    return;
  }
  if (a === 'new-note' || a === 'edit-note') {
    noteForm(id);
    return;
  }
  if (a === 'new-tech-request') {
    techRequestForm();
    return;
  }
  if (a === 'run-tech-check') {
    view.techCheckedAt = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    refreshPage(false);
    toast('Проверка завершена');
    return;
  }
  if (a === 'repair-routine-data') {
    repairRoutineHistory();
    return;
  }
  if (a === 'download-tech-request') {
    const request = data.techRequests.find(x => x.id === id);
    if (request) downloadTechRequest(request);
    return;
  }
  if (a === 'delete-tech-request') {
    if (!confirm('Удалить этот запрос на изменение?')) return;
    const previous = data.techRequests;
    data.techRequests = previous.filter(x => x.id !== id);
    if (!save()) {
      data.techRequests = previous;
      return;
    }
    refreshPage(false);
    toast('Запрос удалён');
    return;
  }
  if (a === 'new-project-note' || a === 'edit-project-note') {
    projectNoteForm(el.dataset.parent, id);
    return;
  }
  if (a === 'edit-name') {
    openModal(
      'Ваше имя',
      `<form class="form-grid" data-form="name"><label>Как к вам обращаться?<input name="name" maxlength="25" required value="${esc(data.name)}"></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
    );
    return;
  }
  if (a === 'pick-emoji') {
    const picker = el.closest('form');
    picker.querySelector('[name="logo"]').value = el.dataset.emoji;
    picker.querySelector('[name="clearImage"]').value = '1';
    picker.querySelector('[name="logoFile"]').value = '';
    picker.querySelectorAll('.emoji-option').forEach(b => b.classList.toggle('active', b === el));
    return;
  }
  if (a === 'day-step') {
    view.date = addDays(view.date, Number(el.dataset.step));
    refreshPage();
    return;
  }
  if (a === 'routine-today') {
    view.date = today();
    view.routineMode = 'day';
    refreshPage(false);
    $('#page').scrollTop = 0;
    return;
  }
  if (a === 'gym-today') {
    view.date = today();
    refreshPage(false);
    return;
  }
  if (a === 'jump-routine-item') {
    const row = [...$('#page').querySelectorAll('[data-routine-item]')].find(
      item => item.dataset.routineItem === id
    );
    if (row) {
      row.scrollIntoView({ block: 'center', behavior: data.reduceMotion ? 'auto' : 'smooth' });
      row.classList.add('task-highlight');
      setTimeout(() => row.classList.remove('task-highlight'), 1400);
    }
    return;
  }
  if (a === 'toggle-routine-calendar') {
    view.routineCalendarOpen = !view.routineCalendarOpen;
    refreshPage(false);
    return;
  }
  if (a === 'routine-mode') {
    view.routineMode = el.dataset.mode === 'week' ? 'week' : 'day';
    refreshPage(false);
    $('#page').scrollTop = 0;
    return;
  }
  if (a === 'open-routine-day') {
    view.page = 'routine';
    view.date = el.dataset.date;
    view.routineMode = 'day';
    refreshPage(false);
    $('#page').scrollTop = 0;
    return;
  }
  if (a === 'pick-day') {
    view.date = el.dataset.date;
    refreshPage();
    return;
  }
  if (a === 'month-step') {
    const d = fromKey(view.date);
    d.setDate(1);
    d.setMonth(d.getMonth() + Number(el.dataset.step));
    view.date = dateKey(d);
    refreshPage();
    return;
  }
  if (a === 'note-filter') {
    view.noteFilter = el.dataset.filter;
    refreshPage();
    return;
  }
  if (a === 'toggle-note-pin') {
    const note = data.notes.find(x => x.id === id);
    if (!note) return;
    const old = note.pinned;
    note.pinned = !old;
    if (!save()) {
      note.pinned = old;
      return;
    }
    refreshPage(false);
    toast(note.pinned ? 'Заметка закреплена' : 'Заметка откреплена');
    return;
  }
  if (a === 'toggle-task') {
    toggleTask(el.dataset.kind, el.dataset.parent, id);
    return;
  }
  if (a === 'postpone-task') {
    postponeTask(el.dataset.kind, el.dataset.parent, id);
    return;
  }
  if (a === 'toggle-routine') {
    toggleRoutine(el.dataset.date, id);
    return;
  }
  if (a === 'undo-task') {
    const action = rt.undoTask;
    if (!action || Date.now() > action.expires) {
      toast('Время отмены вышло');
      return;
    }
    const task = getTaskList(action.kind, action.parent)?.find(x => x.id === action.id);
    if (!task) {
      toast('Задача больше не найдена');
      return;
    }
    const field = action.type === 'due' ? 'due' : 'doneAt',
      current = task[field];
    task[field] = action.previous;
    if (!save()) {
      task[field] = current;
      return;
    }
    rt.undoTask = null;
    refreshPage(false);
    toast('Действие отменено');
    return;
  }
  if (a === 'delete-task') {
    if (!confirm('Удалить эту задачу?')) return;
    const tasks = getTaskList(el.dataset.kind, el.dataset.parent);
    if (!tasks) return;
    const index = tasks.findIndex(x => x.id === id);
    if (index < 0) return;
    const [removed] = tasks.splice(index, 1);
    if (!save()) {
      tasks.splice(index, 0, removed);
      return;
    }
    closeModal(true);
    render();
    return;
  }
  if (a === 'delete-project') {
    if (!confirm('Удалить проект вместе с задачами, заметками и поручениями?')) return;
    const old = data.projects;
    data.projects = old.filter(x => x.id !== id);
    if (!save()) {
      data.projects = old;
      return;
    }
    go('work');
    return;
  }
  if (a === 'delete-subject') {
    if (!confirm('Удалить предмет, задания и все подготовки к нему?')) return;
    const oldSubjects = data.subjects,
      oldPreps = data.seminarPreps,
      removed = oldPreps.filter(p => p.subjectId === id);
    data.subjects = oldSubjects.filter(x => x.id !== id);
    data.seminarPreps = oldPreps.filter(p => p.subjectId !== id);
    if (!save()) {
      data.subjects = oldSubjects;
      data.seminarPreps = oldPreps;
      return;
    }
    for (const p of removed) for (const f of p.attachments || []) await deletePrepFile(f.id).catch(() => {});
    go('uni');
    return;
  }
  if (a === 'delete-event') {
    if (!confirm('Удалить событие из расписания?')) return;
    const before = JSON.stringify(data);
    data.routine = data.routine.filter(x => x.id !== id);
    for (const [key, ids] of Object.entries(data.routineDone)) {
      if (Array.isArray(ids)) {
        const remaining = ids.filter(x => x !== id);
        if (remaining.length) data.routineDone[key] = remaining;
        else delete data.routineDone[key];
      }
    }
    if (!save()) {
      setData(JSON.parse(before));
      return;
    }
    closeModal(true);
    render();
    return;
  }
  if (a === 'delete-gym-log') {
    if (!confirm('Удалить эту запись тренировки?')) return;
    const old = data.gym;
    data.gym = old.filter(x => x.id !== id);
    if (!save()) {
      data.gym = old;
      return;
    }
    closeModal(true);
    refreshPage(false);
    toast('Запись удалена');
    return;
  }
  if (a === 'delete-note') {
    if (!confirm('Удалить заметку?')) return;
    const old = data.notes;
    data.notes = old.filter(x => x.id !== id);
    if (!save()) {
      data.notes = old;
      return;
    }
    render();
    return;
  }
  if (a === 'delete-project-note') {
    if (!confirm('Удалить заметку проекта?')) return;
    const p = data.projects.find(x => x.id === el.dataset.parent);
    if (!p) return;
    const old = p.notes;
    p.notes = old.filter(x => x.id !== id);
    if (!save()) {
      p.notes = old;
      return;
    }
    render();
    return;
  }
  if (a === 'game-tab') {
    view.game = el.dataset.game;
    refreshPage();
    return;
  }
  if (a === 'reset-game') {
    const progress =
      view.game === 'block'
        ? view.block?.moves
        : view.game === 'merge'
          ? view.merge?.moves
          : view.memory?.moves;
    const finished =
      view.game === 'block'
        ? view.block?.over
        : view.game === 'merge'
          ? view.merge?.over
          : view.memory?.matched?.length === 16;
    if (progress && !finished && !confirm('Начать новую игру? Текущая партия будет потеряна.')) return;
    if (view.game === 'block') view.block = newBlock();
    else if (view.game === 'merge') view.merge = newMerge();
    else view.memory = newMemory();
    persistGames();
    render();
    return;
  }
  if (a === 'continue-merge') {
    if (view.merge?.won && !view.merge.over) {
      view.merge.keepPlaying = true;
      persistGames();
      render();
    }
    return;
  }
  if (a === 'select-piece') {
    if (Date.now() < rt.suppressPieceClickUntil) return;
    view.block.selected = Number(el.dataset.index);
    persistGames();
    render();
    return;
  }
  if (a === 'block-cell') {
    if (Date.now() < rt.suppressCellClickUntil) return;
    placeBlock(Number(el.dataset.row), Number(el.dataset.col));
    return;
  }
  if (a === 'merge-move') {
    moveMerge(el.dataset.dir);
    return;
  }
  if (a === 'memory-cell') {
    flipMemory(Number(el.dataset.index));
    return;
  }
  if (a === 'export') {
    exportData();
    return;
  }
  if (a === 'export-calendar') {
    exportCalendar(id);
    return;
  }
  if (a === 'import') {
    $('#import-file').click();
    return;
  }
  if (a === 'reset') {
    if (
      !confirm(
        'Удалить все задачи, планы, проекты, предметы, материалы, заметки и прогресс на этом устройстве?'
      )
    )
      return;
    const old = data;
    setData(defaults());
    if (!save()) {
      setData(old);
      return;
    }
    for (const p of old.seminarPreps || [])
      for (const f of p.attachments || []) await deletePrepFile(f.id).catch(() => {});
    view.page = 'home';
    view.id = null;
    view.prepId = null;
    view.date = today();
    view.routineMode = 'day';
    render();
    toast('Данные сброшены');
  }
}
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (target)
    onAction(target).catch(err => {
      console.error(err);
      toast('Не удалось выполнить действие');
    });
});
document.addEventListener('submit', event => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  submitForm(form).catch(err => {
    console.error(err);
    toast('Не удалось сохранить');
  });
});
document.addEventListener('change', async event => {
  const target = event.target;
  if (target.matches?.('[data-prep-answer]')) {
    rt.pendingPrepAnswer = {
      id: target.dataset.prep,
      key: target.dataset.prepAnswer,
      value: target.value.slice(0, 3000)
    };
    flushPrepAnswer();
    return;
  }
  if (target.id === 'event-repeat') {
    const once = target.value === 'once',
      form = target.closest('form'),
      date = form?.querySelector('[name="date"]');
    form.querySelector('#event-once').hidden = !once;
    form.querySelector('#event-weekly').hidden = once;
    if (date) {
      date.disabled = !once;
      date.required = once;
    }
  } else if (target.name === 'mode' && target.closest('form[data-form="subject"]')) {
    target.closest('form').querySelector('.first-type-row').hidden = target.value !== 'alternate';
  } else if (target.id === 'setting-motion') {
    data.reduceMotion = target.checked;
    save();
    refreshPage(false);
  } else if (target.id === 'setting-lead') {
    data.lead = Number(target.value);
    save();
  } else if (target.id === 'setting-weekly-goal') {
    const goal = Number(target.value);
    if ([3, 5, 7, 10, 15].includes(goal)) {
      data.weeklyGoal = goal;
      save();
      toast('Недельная цель обновлена');
    }
  } else if (target.id === 'setting-reminders') {
    data.reminders = target.checked;
    save();
    const lead = $('#setting-lead');
    if (lead) lead.disabled = !data.reminders;
    if (
      data.reminders &&
      'Notification' in window &&
      window.isSecureContext &&
      Notification.permission === 'default'
    )
      await Notification.requestPermission();
    toast(data.reminders ? 'Напоминания включены' : 'Напоминания выключены');
    checkReminders();
  } else if (target.id === 'import-file' && target.files?.[0]) {
    await importData(target.files[0]);
    target.value = '';
  }
});
document.addEventListener('input', event => {
  // Поле диалога растёт под длину сообщения и не прокручивается внутри себя.
  if (event.target.matches?.('.chat-composer textarea')) {
    const field = event.target;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }
  if (event.target.matches?.('[data-prep-answer]')) {
    const target = event.target;
    if (
      rt.pendingPrepAnswer &&
      (rt.pendingPrepAnswer.id !== target.dataset.prep ||
        rt.pendingPrepAnswer.key !== target.dataset.prepAnswer)
    )
      flushPrepAnswer();
    rt.pendingPrepAnswer = {
      id: target.dataset.prep,
      key: target.dataset.prepAnswer,
      value: target.value.slice(0, 3000)
    };
    clearTimeout(rt.prepAnswerTimer);
    rt.prepAnswerTimer = setTimeout(flushPrepAnswer, 450);
    const label = $(`#page [data-prep-save="${target.dataset.prepAnswer}"]`);
    if (label) label.textContent = 'Сохраняем…';
    const count = [...$('#page').querySelectorAll('[data-prep-answer]')].filter(field =>
      field.value.trim()
    ).length;
    const counter = $('#page').querySelector('[data-answer-count]');
    if (counter) counter.textContent = `${count}/${PREP_QUESTIONS.length}`;
  } else if (event.target.id === 'global-search') {
    const q = event.target.value.trim(),
      results = $('#command-results'),
      actions = $('#command-actions');
    if (results && actions) {
      results.hidden = !q;
      actions.hidden = !!q;
      results.innerHTML = q ? commandResults(q) : '';
    }
  } else if (event.target.id === 'subject-search') {
    view.uniQuery = event.target.value;
    const query = view.uniQuery.trim().toLowerCase();
    let matches = 0;
    document.querySelectorAll('[data-subject-card]').forEach(card => {
      card.hidden = !card.dataset.search.includes(query);
      if (!card.hidden) matches++;
    });
    const empty = $('#subject-search-empty');
    if (empty) empty.hidden = matches > 0;
  } else if (event.target.id === 'work-search') {
    view.workQuery = event.target.value;
    const query = view.workQuery.trim().toLocaleLowerCase('ru-RU');
    let count = 0;
    document.querySelectorAll('[data-project-card]').forEach(card => {
      const project = data.projects.find(p => p.id === card.dataset.id);
      card.hidden =
        !project ||
        !`${project.name} ${project.description || ''}`.toLocaleLowerCase('ru-RU').includes(query);
      if (!card.hidden) count++;
    });
    const empty = $('#work-search-empty');
    if (empty) empty.hidden = count > 0;
  } else if (event.target.id === 'note-search') {
    view.noteQuery = event.target.value;
    const query = view.noteQuery.trim().toLocaleLowerCase('ru-RU');
    let count = 0;
    document.querySelectorAll('[data-note-card]').forEach(card => {
      const note = data.notes.find(n => n.id === card.dataset.id);
      card.hidden =
        !note ||
        !`${note.title || ''} ${note.body || ''} ${note.category || ''}`
          .toLocaleLowerCase('ru-RU')
          .includes(query);
      if (!card.hidden) count++;
    });
    const empty = $('#note-search-empty');
    if (empty) empty.hidden = count > 0;
  } else if (event.target.id === 'task-search') {
    view.taskQuery = event.target.value;
    const query = view.taskQuery.trim().toLocaleLowerCase('ru-RU');
    let matches = 0;
    document.querySelectorAll('[data-task-card]').forEach(card => {
      card.hidden = !card.dataset.search.includes(query);
      if (!card.hidden) matches++;
    });
    const empty = $('#task-empty');
    if (empty) {
      empty.hidden = matches > 0;
      empty.textContent = query ? 'По этому запросу задач нет.' : 'В этом разделе пока нет задач.';
    }
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && event.target.matches?.('.chat-composer textarea')) {
    event.preventDefault();
    event.target.closest('form')?.requestSubmit();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (!$('#modal').open) commandCenter();
    $('#global-search')?.focus();
    return;
  }
  if (event.key === 'Enter' && event.target.matches('article[data-action]')) {
    event.preventDefault();
    onAction(event.target);
  }
  if (
    view.page === 'games' &&
    view.game === 'merge' &&
    !$('#modal').open &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
  ) {
    const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
    if (direction) {
      event.preventDefault();
      moveMerge(direction);
    }
  }
});
$('#modal').addEventListener('cancel', event => {
  event.preventDefault();
  closeModal();
});
window.addEventListener?.('pagehide', flushPrepAnswer);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushPrepAnswer();
});

let touchStart = null;
document.addEventListener(
  'touchstart',
  event => {
    if (event.target.closest('#merge-grid'))
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  },
  { passive: true }
);
document.addEventListener(
  'touchend',
  event => {
    if (!touchStart || view.page !== 'games' || view.game !== 'merge') return;
    const dx = event.changedTouches[0].clientX - touchStart.x,
      dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    moveMerge(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  },
  { passive: true }
);
document.addEventListener('pointerover', event => {
  const cell = event.target.closest?.('.block-cell');
  if (cell) previewBlock(cell);
});
document.addEventListener('pointerdown', event => {
  const piece = event.target.closest?.('.piece[data-index]');
  if (!piece || view.page !== 'games' || view.game !== 'block' || piece.disabled) return;
  view.block.selected = Number(piece.dataset.index);
  view.dragging = { index: view.block.selected, startX: event.clientX, startY: event.clientY };
  document.querySelectorAll('.piece').forEach(p => p.classList.toggle('active', p === piece));
});
document.addEventListener('pointermove', event => {
  if (!view.dragging) return;
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.block-cell');
  if (cell) previewBlock(cell);
  else clearBlockPreview();
});
document.addEventListener('pointerup', event => {
  if (!view.dragging) return;
  const drag = view.dragging;
  view.dragging = null;
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.block-cell');
  if (cell) {
    rt.suppressCellClickUntil = Date.now() + 250;
    rt.suppressPieceClickUntil = Date.now() + 250;
    clearBlockPreview();
    placeBlock(Number(cell.dataset.row), Number(cell.dataset.col));
  } else if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 12) {
    rt.suppressPieceClickUntil = Date.now() + 250;
    persistGames();
    render();
  }
});
document.addEventListener('pointercancel', () => {
  view.dragging = null;
  clearBlockPreview();
});
$('#modal').addEventListener('click', event => {
  if (event.target === $('#modal')) closeModal();
});
/**
 * Переход по ярлыку, когда приложение уже открыто.
 * Смена только хэша не перезагружает страницу, поэтому ярлык с домашнего
 * экрана без этого обработчика оставлял пользователя на прежнем разделе.
 */
window.addEventListener('hashchange', () => {
  const page = pageFromLocation();
  if (page && page !== view.page) go(page);
});

/**
 * Снимок состояния уходит на сервер при каждом сохранении и один раз при
 * запуске: утренний звонок делает сервер, когда телефон может быть выключен.
 */
onSaved.push(() => syncSnapshot());
syncSnapshot({ immediate: true });

/**
 * Записи, надиктованные в звонке. Забираем при открытии и раз в пять минут:
 * звонок мог случиться, пока приложение было закрыто.
 */
pullChanges().then(count => {
  if (count) refreshPage(false);
});
setInterval(() => {
  pullChanges().then(count => {
    if (count) refreshPage(false);
  });
}, 300000);

const deepLink = pageFromLocation();
if (deepLink) view.page = deepLink;
rememberLocation();
render();
checkReminders();
setInterval(checkReminders, 30000);
if ('serviceWorker' in navigator && window.isSecureContext)
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
