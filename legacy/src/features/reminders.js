/** Напоминания о событиях и сроках, пока страница открыта. */
import { allOpenTasks, dayItems, routineCompleted } from '../core/selectors.js';
import { data, markReminded, reminded } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $, today } from '../core/utils.js';

export function checkReminders() {
  if (!data.reminders) return;
  const now = new Date(),
    key = today(),
    minutes = now.getHours() * 60 + now.getMinutes();
  for (const item of dayItems(key)) {
    if (item.kind === 'routine' && routineCompleted(key, item.id)) continue;
    const [h, m] = item.time.split(':').map(Number),
      target = h * 60 + m;
    if (minutes < target - data.lead || minutes > target) continue;
    const notificationKey = `kamron-${key}-${item.kind}-${item.id}-${item.time}`;
    if (reminded(notificationKey)) continue;
    markReminded(notificationKey);
    const message = `${item.title} · ${item.time}`;
    toast(`Скоро: ${message}`);
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      if (navigator.serviceWorker?.controller)
        navigator.serviceWorker.ready
          .then(reg =>
            reg.showNotification('Kamron APP', { body: message, icon: './icon.svg', tag: notificationKey })
          )
          .catch(() => {});
      else new Notification('Kamron APP', { body: message, tag: notificationKey });
    }
  }
  if (minutes >= 540) {
    for (const task of allOpenTasks().filter(t => t.due && t.due <= key)) {
      const k = `kamron-task-${key}-${task.id}`;
      if (reminded(k)) continue;
      markReminded(k);
      const message = `${task.due < key ? 'Просрочено' : 'Сегодня срок'}: ${task.title}`;
      toast(message);
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        if (navigator.serviceWorker?.controller)
          navigator.serviceWorker.ready
            .then(reg => reg.showNotification('Kamron APP', { body: message, icon: './icon.svg', tag: k }))
            .catch(() => {});
        else new Notification('Kamron APP', { body: message, tag: k });
      }
    }
  }
}
