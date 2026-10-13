/**
 * Изменения, надиктованные в звонке.
 *
 * Ассистент не может писать в приложение напрямую: данные лежат в браузере
 * на телефоне. Он складывает изменения на сервере, а приложение забирает
 * их при открытии и применяет здесь.
 *
 * Применённые подтверждаются по идентификаторам: подтверждение уходит
 * после сохранения, поэтому сорванная связь приводит к повторной попытке,
 * а не к потере. Повтор безопасен — одинаковая запись не задваивается.
 */
import { data, save } from '../core/state.js';
import { toast } from '../core/toast.js';
import { uid, today } from '../core/utils.js';
import { request, serverConfigured } from './api.js';

const CATEGORIES = ['Идея', 'Личное', 'Важное'];
const ROUTINE_CATEGORIES = ['Личное', 'Работа', 'Учёба'];

function taskList(kind) {
  if (kind === 'work') return data.projects[0]?.tasks;
  if (kind === 'uni') return data.subjects[0]?.tasks;
  return data.personalTasks;
}

/** Уже есть такая же открытая задача — второй раз не заводим. */
function sameTaskExists(list, title) {
  const needle = title.trim().toLowerCase();
  return (list || []).some(task => !task.doneAt && task.title.trim().toLowerCase() === needle);
}

function applyTask(payload) {
  const title = String(payload.title || '')
    .trim()
    .slice(0, 120);
  if (!title) return false;
  // Работа и университет складываются в первый проект или предмет. Если их
  // нет, задача не теряется, а становится личной: лучше не на своей полке,
  // чем нигде.
  const list = taskList(payload.kind) || data.personalTasks;
  if (sameTaskExists(list, title)) return true;
  list.push({
    id: uid(),
    title,
    due: /^\d{4}-\d{2}-\d{2}$/.test(payload.due || '') ? payload.due : '',
    priority: payload.priority === 'high' ? 'high' : 'normal',
    source: 'звонок',
    doneAt: null
  });
  return true;
}

function applyRoutine(payload) {
  const time = String(payload.time || '');
  const title = String(payload.title || '')
    .trim()
    .slice(0, 120);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !title) return false;
  const days = Array.isArray(payload.days)
    ? [...new Set(payload.days.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))]
    : [];
  if (
    data.routine.some(item => item.time === time && item.title.trim().toLowerCase() === title.toLowerCase())
  )
    return true;
  // Дни недели — повторяющееся дело. Иначе разовое, и день берётся из
  // названного: «завтра» без этого превращалось в сегодня.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(payload.date || '') ? payload.date : today();
  data.routine.push({
    id: uid(),
    time,
    title,
    category: ROUTINE_CATEGORIES.includes(payload.category) ? payload.category : 'Личное',
    ...(days.length ? { days } : { days: [], date })
  });
  return true;
}

function applyNote(payload) {
  const body = String(payload.body || '')
    .trim()
    .slice(0, 4000);
  if (!body) return false;
  data.notes.unshift({
    id: uid(),
    title: String(payload.title || '').slice(0, 120),
    body,
    category: CATEGORIES.includes(payload.category) ? payload.category : 'Личное',
    pinned: false,
    createdAt: new Date().toISOString()
  });
  return true;
}

function applyComplete(payload) {
  const needle = String(payload.title || '')
    .trim()
    .toLowerCase();
  if (!needle) return false;
  const lists = [
    data.personalTasks,
    ...data.projects.map(project => project.tasks),
    ...data.subjects.map(subject => subject.tasks)
  ];
  for (const list of lists) {
    const task = (list || []).find(x => !x.doneAt && x.title.trim().toLowerCase() === needle);
    if (task) {
      task.doneAt = new Date().toISOString();
      return true;
    }
  }
  // Задача не нашлась — считаем изменение разобранным, иначе оно будет
  // возвращаться при каждом открытии приложения.
  return true;
}

const APPLY = {
  task: applyTask,
  routine: applyRoutine,
  note: applyNote,
  complete: applyComplete
};

/** Забирает очередь с сервера и применяет. Молча: это фоновая услуга. */
export async function pullChanges() {
  if (!serverConfigured()) return;
  let changes;
  try {
    ({ изменения: changes } = await request('/api/changes', { timeout: 15000 }));
  } catch (_) {
    return;
  }
  if (!Array.isArray(changes) || !changes.length) return;

  const applied = [];
  for (const change of changes) {
    const handler = APPLY[change?.kind];
    if (!handler) {
      applied.push(change.id);
      continue;
    }
    try {
      if (handler(change.data || {})) applied.push(change.id);
    } catch (_) {
      // Одно сбойное изменение не должно останавливать остальные.
    }
  }
  if (!applied.length) return;
  if (!save()) return;

  try {
    await request('/api/changes/ack', { method: 'POST', body: { ids: applied } });
  } catch (_) {
    // Не подтвердилось — изменения придут снова, повтор безопасен.
  }
  toast(
    applied.length === 1 ? 'Добавлена запись из звонка' : `Добавлено записей из звонка: ${applied.length}`
  );
  return applied.length;
}
