/** Выполнение и перенос задач, отметки режима дня. */
import { ROUTINE_POINTS } from '../core/constants.js';
import { getTaskList, routineOccurs } from '../core/selectors.js';
import { data, rt, save } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $, addDays, today } from '../core/utils.js';
import { refreshPage } from '../ui/shell.js';

export function toggleTask(kind, parent, id) {
  const task = getTaskList(kind, parent)?.find(x => x.id === id);
  if (!task) return;
  const previous = task.doneAt;
  task.doneAt = previous ? null : new Date().toISOString();
  if (!save()) {
    task.doneAt = previous;
    return;
  }
  rt.undoTask = { type: 'completion', kind, parent, id, previous, expires: Date.now() + 6000 };
  refreshPage(false);
  toast(task.doneAt ? '+50 баллов · задача выполнена' : 'Задача снова в работе', true);
}

export function postponeTask(kind, parent, id) {
  const task = getTaskList(kind, parent)?.find(x => x.id === id);
  if (!task || task.doneAt || !task.due || task.due > today()) return;
  const previous = task.due;
  task.due = addDays(today(), 1);
  if (!save()) {
    task.due = previous;
    return;
  }
  rt.undoTask = { type: 'due', kind, parent, id, previous, expires: Date.now() + 6000 };
  refreshPage(false);
  toast('Задача перенесена на завтра', true);
}

export function toggleRoutine(key, id) {
  if (key > today()) {
    toast('Будущий день пока нельзя отметить');
    return;
  }
  const event = data.routine.find(e => e.id === id && routineOccurs(e, key));
  if (!event) return;
  const previous = Array.isArray(data.routineDone[key]) ? data.routineDone[key].slice() : [];
  const done = new Set(previous),
    wasDone = done.has(id);
  if (wasDone) done.delete(id);
  else done.add(id);
  if (done.size) data.routineDone[key] = [...done];
  else delete data.routineDone[key];
  if (!save()) {
    if (previous.length) data.routineDone[key] = previous;
    else delete data.routineDone[key];
    return;
  }
  refreshPage(false);
  toast(wasDone ? `−${ROUTINE_POINTS} баллов · отметка снята` : `+${ROUTINE_POINTS} баллов · пункт выполнен`);
}
