/** Производные данные: задачи, режим дня, баллы, занятия и ближайшие события. */
import { ROUTINE_POINTS, TASK_POINTS } from './constants.js';
import { data } from './state.js';
import { $, addDays, dateKey, dayNumber, fromKey, pad, today } from './utils.js';

export function allTasks() {
  return [
    ...(data.personalTasks || []).map(t => ({ ...t, source: 'Личное', kind: 'personal', parentId: '' })),
    ...data.projects.flatMap(p =>
      (p.tasks || []).map(t => ({ ...t, source: p.name, kind: 'work', parentId: p.id }))
    ),
    ...data.subjects.flatMap(s =>
      (s.tasks || []).map(t => ({ ...t, source: s.name, kind: 'uni', parentId: s.id }))
    )
  ];
}

export function completedTasks() {
  return allTasks().filter(t => t.doneAt);
}

export function allOpenTasks() {
  return allTasks().filter(t => !t.doneAt);
}

export function dueTasks(key) {
  return allTasks().filter(t => t.due === key);
}

export function routineOccurs(event, key) {
  return event.date
    ? event.date === key
    : Array.isArray(event.days) && event.days.includes(fromKey(key).getDay());
}

export function routineProgress(key) {
  const items = data.routine.filter(e => routineOccurs(e, key));
  const done = new Set(Array.isArray(data.routineDone[key]) ? data.routineDone[key] : []);
  return { total: items.length, done: items.filter(e => done.has(e.id)).length };
}

export function routineCompleted(key, id) {
  return Array.isArray(data.routineDone[key]) && data.routineDone[key].includes(id);
}

export function completedRoutineEntries() {
  const events = new Map(data.routine.map(e => [e.id, e]));
  return Object.entries(data.routineDone).flatMap(([key, entries]) =>
    /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= today() && Array.isArray(entries)
      ? [...new Set(entries)]
          .filter(id => events.has(id) && routineOccurs(events.get(id), key))
          .map(id => ({ key, id }))
      : []
  );
}

export function gameStats() {
  const tasks = completedTasks(),
    routine = completedRoutineEntries(),
    taskPoints = tasks.length * TASK_POINTS,
    routinePoints = routine.length * ROUTINE_POINTS,
    points = taskPoints + routinePoints;
  return {
    points,
    taskPoints,
    routinePoints,
    routineCount: routine.length,
    level: Math.floor(points / 250) + 1,
    streak: streak(tasks, routine)
  };
}

export function streak(tasks, routine) {
  const dates = new Set([...tasks.map(t => dateKey(new Date(t.doneAt))), ...routine.map(x => x.key)]);
  let day = today();
  if (!dates.has(day)) day = addDays(day, -1);
  let count = 0;
  while (dates.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export function subjectMeeting(subject, key) {
  const days = subject.days || [];
  if (!days.includes(fromKey(key).getDay()) || key < subject.startDate) return null;
  const span = dayNumber(key) - dayNumber(subject.startDate) + 1,
    startDay = fromKey(subject.startDate).getDay();
  let index = Math.floor(span / 7) * days.length;
  for (let i = 0; i < span % 7; i++) if (days.includes((startDay + i) % 7)) index++;
  const exceptions = subject.exceptions || {};
  for (const [cancelledDate, exception] of Object.entries(exceptions))
    if (
      exception?.cancelled &&
      cancelledDate >= subject.startDate &&
      cancelledDate <= key &&
      days.includes(fromKey(cancelledDate).getDay())
    )
      index--;
  if (exceptions[key]?.cancelled) return null;
  const mode = subject.mode;
  const type =
    mode === 'alternate'
      ? index % 2 === 1
        ? subject.firstType
        : subject.firstType === 'Лекция'
          ? 'Семинар'
          : 'Лекция'
      : mode === 'lecture'
        ? 'Лекция'
        : mode === 'seminar'
          ? 'Семинар'
          : 'Занятие';
  return { type, index };
}

export function scheduledOn(subject, key) {
  return key >= subject.startDate && (subject.days || []).includes(fromKey(key).getDay());
}

export function upcomingLessons(subject, limit = 5, includeCancelled = false) {
  const lessons = [];
  for (let n = 0; n < 90 && lessons.length < limit; n++) {
    const key = addDays(today(), n);
    if (!scheduledOn(subject, key)) continue;
    const meeting = subjectMeeting(subject, key);
    if (meeting || includeCancelled) lessons.push({ key, meeting, cancelled: !meeting });
  }
  return lessons;
}

export function universityTasks() {
  return data.subjects.flatMap(s => (s.tasks || []).map(t => ({ ...t, subject: s.name, parentId: s.id })));
}

export function dayItems(key) {
  const routine = data.routine.filter(e => routineOccurs(e, key)).map(e => ({ ...e, kind: 'routine' }));
  const lessons = data.subjects.flatMap(s => {
    const meeting = subjectMeeting(s, key);
    return meeting
      ? [
          {
            id: s.id,
            time: s.time,
            title: s.name,
            category: meeting.type,
            kind: 'subject',
            room: s.room || '',
            attendance: s.attendance?.[key] || ''
          }
        ]
      : [];
  });
  return [...routine, ...lessons].sort((a, b) => a.time.localeCompare(b.time));
}

export function nextThing() {
  const now = new Date();
  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  for (let n = 0; n < 7; n++) {
    const key = addDays(today(), n);
    const item = dayItems(key).find(
      e => (n > 0 || e.time >= hm) && (e.kind !== 'routine' || !routineCompleted(key, e.id))
    );
    if (item) return { key, item };
  }
  return null;
}

export function nextLesson(subject) {
  const next = upcomingLessons(subject, 1)[0];
  return next ? { key: next.key, ...next.meeting } : null;
}

export function prepFor(subjectId) {
  return data.seminarPreps
    .filter(p => p.subjectId === subjectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function nextSeminar(subject) {
  return (
    upcomingLessons(subject, 40).find(
      x =>
        x.meeting?.type ===
        (subject.mode === 'lecture' ? 'Лекция' : subject.mode === 'general' ? 'Занятие' : 'Семинар')
    ) || null
  );
}

export function invalidRoutineDoneCount() {
  const events = new Map(data.routine.map(x => [x.id, x]));
  return Object.entries(data.routineDone).reduce((count, [key, entries]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(entries)) return count + 1;
    const valid = entries.filter(id => events.has(id) && routineOccurs(events.get(id), key));
    return count + entries.length - new Set(valid).size;
  }, 0);
}

export function getParent(kind, id) {
  return kind === 'work'
    ? data.projects.find(x => x.id === id)
    : kind === 'uni'
      ? data.subjects.find(x => x.id === id)
      : null;
}

export function getTaskList(kind, parent) {
  return kind === 'personal' ? data.personalTasks : getParent(kind, parent)?.tasks;
}
