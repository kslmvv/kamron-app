/** Модальное окно: открытие, закрытие, защита от потери ввода и обработка отправки. */
import { getTaskList, routineOccurs, scheduledOn } from '../core/selectors.js';
import { data, rt, save, setData, view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $, esc, today, uid } from '../core/utils.js';
import { validGithubUrl, validRailwayUrl } from '../features/export.js';
import { sendChatMessage } from '../features/chat.js';
import { attachPrepFiles, deletePrepFile } from '../features/files.js';
import { render } from '../ui/shell.js';
import { voiceToday } from '../views/settings.js';

export function formSnapshot(form) {
  return form
    ? JSON.stringify(
        [...new FormData(form)].map(([key, value]) => [
          key,
          typeof value === 'string' ? value : value.name ? [value.name, value.size, value.lastModified] : null
        ])
      )
    : null;
}

export function openModal(title, body) {
  const dialog = $('#modal');
  if (dialog.open && !closeModal()) return false;
  dialog.setAttribute('aria-label', title);
  dialog.innerHTML = `<div class="sheet-header"><h2>${esc(title)}</h2><button class="sheet-close" data-action="close-modal" aria-label="Закрыть">×</button></div>${body}`;
  dialog.showModal();
  rt.modalSnapshot = formSnapshot(dialog.querySelector?.('form[data-form]'));
  return true;
}

export function closeModal(force = false) {
  const dialog = $('#modal');
  if (!dialog.open) return true;
  if (
    !force &&
    rt.modalSnapshot !== null &&
    rt.modalSnapshot !== formSnapshot(dialog.querySelector?.('form[data-form]')) &&
    !confirm('Закрыть без сохранения изменений?')
  )
    return false;
  dialog.close();
  rt.modalSnapshot = null;
  return true;
}

export function flushPrepAnswer() {
  if (!rt.pendingPrepAnswer) return;
  clearTimeout(rt.prepAnswerTimer);
  const { id, key, value } = rt.pendingPrepAnswer;
  rt.pendingPrepAnswer = null;
  const prep = data.seminarPreps.find(p => p.id === id);
  if (!prep) return;
  prep.answers ||= {};
  const old = prep.answers[key];
  if (String(old || '') === value) return;
  prep.answers[key] = value;
  const label = $(`#page [data-prep-save="${key}"]`);
  if (!save()) {
    if (old === undefined) delete prep.answers[key];
    else prep.answers[key] = old;
    if (label) label.textContent = 'Не сохранено';
    return;
  }
  if (label) label.textContent = 'Сохранено';
}

export async function submitForm(form) {
  const fd = new FormData(form),
    type = form.dataset.form,
    id = form.dataset.id;
  // Диалог и подключение к серверу обрабатываются отдельно: у них свой
  // жизненный цикл и общая логика сохранения ниже им не подходит.
  if (type === 'chat') return sendChatMessage(String(fd.get('text') || ''));
  if (type === 'server') {
    const url = String(fd.get('url') || '')
      .trim()
      .replace(/\/+$/, '');
    const token = String(fd.get('token') || '').trim();
    if (url && !/^https:\/\//.test(url) && !/^http:\/\/localhost(:\d+)?$/.test(url)) {
      toast('Адрес должен начинаться с https://');
      return;
    }
    data.server = { url, token };
    save();
    closeModal(true);
    toast(url && token ? 'Сервер Jarvis подключён' : 'Подключение сервера очищено');
    render();
    return;
  }
  const previous = JSON.stringify(data);
  const createdFromTasks = view.page === 'tasks';
  if (type === 'seminar-prep') {
    const subjectId = form.dataset.subject;
    if (!data.subjects.some(s => s.id === subjectId)) return;
    let p = data.seminarPreps.find(x => x.id === id && x.subjectId === subjectId);
    const isNew = !p;
    if (!p) p = { id: uid(), subjectId, createdAt: new Date().toISOString(), attachments: [], answers: {} };
    p.topic = String(fd.get('topic') || '')
      .trim()
      .slice(0, 140);
    p.context = String(fd.get('context') || '')
      .trim()
      .slice(0, 4000);
    if (!p.topic) {
      toast('Укажите тему');
      return;
    }
    if (isNew) {
      if (!(await attachPrepFiles(p, fd.getAll('materials')))) return;
      data.seminarPreps.push(p);
    }
    view.page = 'seminar';
    view.id = subjectId;
    view.prepId = p.id;
  } else if (type === 'prep-files') {
    const p = data.seminarPreps.find(x => x.id === id);
    if (!p) return;
    if (!(await attachPrepFiles(p, fd.getAll('materials')))) return;
    view.page = 'seminar';
    view.id = p.subjectId;
    view.prepId = p.id;
  } else if (type === 'project-ai') {
    const p = data.projects.find(x => x.id === id);
    if (!p) return;
    const githubUrl = validGithubUrl(String(fd.get('githubUrl') || '').trim()),
      railwayUrl = validRailwayUrl(String(fd.get('railwayUrl') || '').trim());
    if (githubUrl === null) {
      toast('Укажите ссылку на репозиторий github.com/владелец/репозиторий');
      return;
    }
    if (railwayUrl === null) {
      toast('Укажите ссылку на railway.com или railway.app');
      return;
    }
    p.ai ||= {};
    if (p.ai.githubUrl !== githubUrl) delete p.ai.githubSnapshot;
    p.ai.goal = String(fd.get('goal') || '')
      .trim()
      .slice(0, 240);
    p.ai.githubUrl = githubUrl;
    p.ai.railwayUrl = railwayUrl;
    view.page = 'project-ai';
    view.id = p.id;
  } else if (type === 'project-ai-request') {
    const p = data.projects.find(x => x.id === id);
    if (!p) return;
    const title = String(fd.get('title') || '').trim(),
      description = String(fd.get('description') || '').trim();
    if (!title || !description) {
      toast('Заполните поручение');
      return;
    }
    p.ai ||= {};
    p.ai.requests ||= [];
    p.ai.requests.push({
      id: uid(),
      title: title.slice(0, 120),
      description: description.slice(0, 2500),
      createdAt: new Date().toISOString()
    });
    p.ai.requests = p.ai.requests.slice(-50);
    view.page = 'project-ai';
    view.id = p.id;
  } else if (type === 'project') {
    let p = data.projects.find(x => x.id === id),
      image = fd.get('clearImage') === '1' ? null : p?.logoImage || null;
    const file = fd.get('logoFile');
    if (file && file.size) {
      if (file.size > 400000) {
        toast('Логотип должен быть меньше 400 КБ');
        return;
      }
      image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    if (!p) {
      p = { id: uid(), tasks: [], notes: [] };
      data.projects.push(p);
    }
    p.name = String(fd.get('name')).trim();
    p.description = String(fd.get('description')).trim();
    p.logo = String(fd.get('logo'));
    p.logoImage = image;
    p.color = String(fd.get('color'));
    view.page = 'project';
    view.id = p.id;
  } else if (type === 'subject') {
    const days = fd.getAll('days').map(Number);
    if (!days.length) {
      toast('Выберите хотя бы один день занятия');
      return;
    }
    let s = data.subjects.find(x => x.id === id);
    if (!s) {
      s = { id: uid(), tasks: [], exceptions: {}, attendance: {} };
      data.subjects.push(s);
    }
    s.name = String(fd.get('name')).trim();
    s.time = String(fd.get('time'));
    s.duration = Math.min(300, Math.max(15, Number(fd.get('duration')) || 90));
    s.startDate = String(fd.get('startDate'));
    s.days = days;
    s.mode = String(fd.get('mode'));
    s.firstType = String(fd.get('firstType'));
    s.teacher = String(fd.get('teacher') || '').trim();
    s.room = String(fd.get('room') || '').trim();
    s.icon = String(fd.get('icon') || '📚');
    s.notes = String(fd.get('notes') || '').trim();
    view.page = 'subject';
    view.id = s.id;
  } else if (type === 'event') {
    const repeat = fd.get('repeat') === 'weekly' ? 'weekly' : 'once',
      days = fd.getAll('days').map(Number),
      date = String(fd.get('date') || '');
    if (repeat === 'weekly' && !days.length) {
      toast('Выберите хотя бы один день');
      return;
    }
    if (repeat === 'once' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast('Укажите дату');
      return;
    }
    let e = data.routine.find(x => x.id === id);
    if (!e) {
      e = { id: uid() };
      data.routine.push(e);
    }
    e.title = String(fd.get('title')).trim();
    e.time = String(fd.get('time'));
    e.category = String(fd.get('category'));
    e.days = repeat === 'weekly' ? days : [];
    if (repeat === 'once') e.date = date;
    else delete e.date;
    for (const [markedDate, ids] of Object.entries(data.routineDone))
      if (Array.isArray(ids) && ids.includes(e.id) && !routineOccurs(e, markedDate)) {
        data.routineDone[markedDate] = ids.filter(x => x !== e.id);
        if (!data.routineDone[markedDate].length) delete data.routineDone[markedDate];
      }
  } else if (type === 'gym-log') {
    const date = String(fd.get('date') || ''),
      title = String(fd.get('title') || '').trim(),
      minutes = String(fd.get('duration') || '').trim(),
      duration = minutes ? Number(minutes) : 0;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date > today() ||
      !title ||
      (minutes && (!Number.isInteger(duration) || duration < 1 || duration > 360))
    ) {
      toast('Проверьте дату, название и время');
      return;
    }
    let log = data.gym.find(x => x.id === id);
    if (!log) {
      log = { id: uid() };
      data.gym.push(log);
    }
    log.date = date;
    log.title = title.slice(0, 80);
    log.type = ['Силовая', 'Кардио', 'Растяжка', 'Другое'].includes(fd.get('type'))
      ? String(fd.get('type'))
      : 'Другое';
    log.duration = duration;
    log.notes = String(fd.get('notes') || '')
      .trim()
      .slice(0, 1500);
    view.date = date;
    view.page = 'gym';
  } else if (type === 'task') {
    const tasks = getTaskList(form.dataset.kind, form.dataset.parent);
    if (!tasks) return;
    let t = tasks.find(x => x.id === id);
    if (!t) {
      t = { id: uid(), doneAt: null };
      tasks.push(t);
    }
    t.title = String(fd.get('title')).trim();
    t.due = String(fd.get('due') || '');
    t.priority = String(fd.get('priority') || 'normal');
    if (form.dataset.kind === 'personal' && view.page !== 'routine') {
      view.page = 'tasks';
      view.taskFilter = 'all';
      view.taskQuery = '';
    }
  } else if (type === 'quick-uni-task') {
    const s = data.subjects.find(x => x.id === fd.get('subject'));
    if (!s) return;
    s.tasks.push({
      id: uid(),
      title: String(fd.get('title')).trim(),
      due: String(fd.get('due') || ''),
      priority: String(fd.get('priority') || 'normal'),
      doneAt: null
    });
    if (createdFromTasks) {
      view.taskFilter = 'all';
      view.taskQuery = '';
    } else {
      view.page = 'subject';
      view.id = s.id;
      view.subjectFilter = 'open';
    }
  } else if (type === 'quick-work-task') {
    const p = data.projects.find(x => x.id === fd.get('project'));
    if (!p) return;
    p.tasks.push({
      id: uid(),
      title: String(fd.get('title')).trim(),
      due: String(fd.get('due') || ''),
      priority: String(fd.get('priority') || 'normal'),
      doneAt: null
    });
    if (createdFromTasks) {
      view.taskFilter = 'all';
      view.taskQuery = '';
    } else {
      view.page = 'project';
      view.id = p.id;
    }
  } else if (type === 'lesson') {
    const s = data.subjects.find(x => x.id === form.dataset.parent),
      key = form.dataset.date;
    if (!s || !scheduledOn(s, key)) return;
    s.exceptions ||= {};
    s.attendance ||= {};
    if (fd.has('cancelled')) s.exceptions[key] = { cancelled: true };
    else delete s.exceptions[key];
    const attendance = String(fd.get('attendance') || '');
    if (attendance && !fd.has('cancelled')) s.attendance[key] = attendance;
    else delete s.attendance[key];
  } else if (type === 'note') {
    let n = data.notes.find(x => x.id === id);
    if (!n) {
      n = { id: uid(), createdAt: new Date().toISOString() };
      data.notes.push(n);
    }
    n.title = String(fd.get('title')).trim();
    n.body = String(fd.get('body')).trim();
    n.category = String(fd.get('category'));
    n.pinned = fd.has('pinned');
    n.updatedAt = new Date().toISOString();
  } else if (type === 'project-note') {
    const p = data.projects.find(x => x.id === form.dataset.parent),
      text = String(fd.get('text') || '').trim();
    if (!p || !text) return;
    p.notes ||= [];
    let note = p.notes.find(x => x.id === id);
    if (!note) {
      note = { id: uid(), createdAt: new Date().toISOString() };
      p.notes.push(note);
    }
    note.text = text.slice(0, 4000);
  } else if (type === 'tech-request') {
    const description = String(fd.get('description') || '').trim();
    if (!description) {
      toast('Опишите, что нужно изменить');
      return;
    }
    data.techRequests ||= [];
    data.techRequests.push({
      id: uid(),
      kind: ['bug', 'design', 'feature'].includes(fd.get('kind')) ? String(fd.get('kind')) : 'feature',
      area: String(fd.get('area') || 'Всё приложение').slice(0, 60),
      description: description.slice(0, 2000),
      expected: String(fd.get('expected') || '')
        .trim()
        .slice(0, 1000),
      createdAt: new Date().toISOString()
    });
    data.techRequests = data.techRequests.slice(-100);
    view.page = 'tech';
  } else if (type === 'phone') {
    const telegramUser = String(fd.get('telegramUser') || '').trim();
    if (telegramUser && !/^@[A-Za-z0-9_]{5,32}$/.test(telegramUser)) {
      toast('Укажите имя Telegram в формате @username');
      return;
    }
    const days = [
      ...new Set(
        fd
          .getAll('days')
          .map(Number)
          .filter(n => Number.isInteger(n) && n >= 0 && n <= 6)
      )
    ];
    if (!days.length) {
      toast('Выберите хотя бы один день');
      return;
    }
    const morning = String(fd.get('morning') || ''),
      evening = String(fd.get('evening') || '');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(morning) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(evening)) {
      toast('Проверьте время звонков');
      return;
    }
    data.phone = {
      ...data.phone,
      telegramUser,
      days,
      morning,
      evening,
      tone: ['supportive', 'direct', 'strict'].includes(fd.get('tone')) ? String(fd.get('tone')) : 'direct'
    };
  } else if (type === 'phone-report') {
    data.phone.reports ||= {};
    data.phone.reports[voiceToday()] = {
      done: String(fd.get('done') || '')
        .trim()
        .slice(0, 1000),
      missed: String(fd.get('missed') || '')
        .trim()
        .slice(0, 1000),
      reason: String(fd.get('reason') || '')
        .trim()
        .slice(0, 1000),
      tomorrow: String(fd.get('tomorrow') || '')
        .trim()
        .slice(0, 250)
    };
  } else if (type === 'name') {
    data.name = String(fd.get('name')).trim() || 'Друг';
  }
  if (!save()) {
    const old = JSON.parse(previous),
      known = new Set((old.seminarPreps || []).flatMap(p => (p.attachments || []).map(f => f.id)));
    for (const p of data.seminarPreps || [])
      for (const f of p.attachments || []) if (!known.has(f.id)) await deletePrepFile(f.id).catch(() => {});
    setData(old);
    return;
  }
  closeModal(true);
  render();
  toast('Сохранено');
}
