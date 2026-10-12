/** Зал: календарь и журнал тренировок. */
import { data, view } from '../core/state.js';
import { $, esc, fmt, safeId, today } from '../core/utils.js';
import { calendar, heading, overview } from '../ui/components.js';

export function renderGym() {
  const logs = data.gym
      .filter(x => x.date === view.date)
      .slice()
      .reverse(),
    month = view.date.slice(0, 7),
    monthCount = data.gym.filter(x => x.date.startsWith(month)).length;
  return `${heading('ТВОЙ РИТМ', 'Зал', 'Записывай тренировки, план добавим вместе.', 'new-gym-log')}
      <div class="gym-intro"><span aria-hidden="true">💪</span><div><strong>Журнал тренировок</strong><small>Записывай занятия сейчас. Персональный план составим, когда расскажешь о целях.</small></div></div>
      ${overview(
        [
          [monthCount, 'в этом месяце'],
          [data.gym.length, 'всего записей']
        ],
        'gym-overview'
      )}
      <div class="section-title">Календарь <small>● день с тренировкой</small></div>${calendar(view.date, 'gym')}
      <div class="section-title gym-date-heading"><span>${esc(fmt(view.date, { weekday: 'long', day: 'numeric', month: 'long' }))}</span>${view.date !== today() ? `<button class="text-btn" data-action="gym-today">Сегодня</button>` : ''}${view.date <= today() ? `<button class="text-btn" data-action="new-gym-log">+ Записать</button>` : ''}</div>
      ${logs.length ? logs.map(x => `<div class="card gym-log"><div class="row"><span class="gym-log-icon" aria-hidden="true">✦</span><div class="grow"><strong>${esc(x.title)}</strong><small>${x.duration ? `${Number(x.duration)} мин · ` : ''}${esc(x.type || 'Тренировка')}</small></div><button class="icon-btn" data-action="edit-gym-log" data-id="${safeId(x.id)}" aria-label="Изменить тренировку">✎</button></div>${x.notes ? `<p>${esc(x.notes)}</p>` : ''}</div>`).join('') : `<div class="gym-empty"><strong>${view.date > today() ? 'План добавим позже' : 'На этот день записей нет'}</strong><span>${view.date > today() ? 'Когда расскажешь о целях и графике, заполним будущие тренировки.' : 'После тренировки сохрани, что сделал и как себя чувствовал.'}</span></div>`}`;
}
