/** Настройки и экран голосового помощника. */
import { serverConfigured } from '../features/api.js';
import { DAY, THEMES } from '../core/constants.js';
import { allOpenTasks, dayItems, gameStats, nextThing } from '../core/selectors.js';
import { data, emptyVoiceReport, view } from '../core/state.js';
import { $, addDays, esc, fmt, plural, today } from '../core/utils.js';
import { heading } from '../ui/components.js';
import { go } from '../ui/shell.js';

export function renderSettings() {
  const stats = gameStats(),
    next = nextThing();
  return `${heading('ПОД ТВОЙ РИТМ', 'Настройки', 'Оформление, напоминания и данные в одном месте.')}
      <div class="profile-card"><span class="profile-avatar">${esc(
        String(data.name || 'Камрон')
          .trim()
          .slice(0, 1)
          .toUpperCase() || 'К'
      )}</span><div class="grow"><strong>${esc(data.name || 'Камрон')}</strong><small>Мой профиль</small></div><button class="secondary-btn" data-action="edit-name" aria-label="Изменить имя">Изменить</button></div>
      <div class="settings-group-heading"><strong>Тема</strong></div>
      <div class="theme-grid">${Object.entries(THEMES)
        .map(
          ([key, theme]) =>
            `<button class="theme-option ${data.theme === key ? 'active' : ''}" data-action="set-theme" data-theme="${key}" aria-pressed="${data.theme === key}" aria-label="Тема ${theme.name}"><span class="theme-swatch ${key}"><i></i><b></b></span><strong>${theme.name}</strong></button>`
        )
        .join('')}</div>
      <div class="settings-group-heading"><strong>Напоминания</strong></div>
      <div class="card settings-card"><div class="settings-row"><div><strong>Напоминать мне</strong><small>Пока приложение открыто</small></div><label class="switch" aria-label="Включить напоминания"><input type="checkbox" id="setting-reminders" ${data.reminders ? 'checked' : ''}><span></span></label></div><div class="settings-row"><label for="setting-lead"><strong>Перед событием</strong></label><select id="setting-lead" ${data.reminders ? '' : 'disabled'}><option value="0" ${data.lead === 0 ? 'selected' : ''}>В момент</option><option value="5" ${data.lead === 5 ? 'selected' : ''}>За 5 мин</option><option value="10" ${data.lead === 10 ? 'selected' : ''}>За 10 мин</option><option value="30" ${data.lead === 30 ? 'selected' : ''}>За 30 мин</option></select></div></div>
      <div class="settings-group-heading"><strong>Мои разделы</strong></div>
      <button class="settings-destination" data-action="go" data-page="jarvis"><span class="settings-destination-icon">✦</span><span class="grow"><strong>Jarvis</strong><small>Все сценарии помощника</small></span><span aria-hidden="true">›</span></button>
      <button class="settings-destination" data-action="go" data-page="insights"><span class="settings-destination-icon">✦</span><span class="grow"><strong>Мой прогресс</strong><small>${stats.points} ${plural(stats.points, 'балл', 'балла', 'баллов')} · ${stats.streak} ${plural(stats.streak, 'день', 'дня', 'дней')} подряд</small></span><span aria-hidden="true">›</span></button>
      <button class="settings-more-toggle" data-action="toggle-settings-more" aria-expanded="${view.settingsMoreOpen}"><span>Дополнительно</span><span aria-hidden="true">${view.settingsMoreOpen ? '−' : '+'}</span></button>
      ${
        view.settingsMoreOpen
          ? `<div class="settings-more-panel"><div class="card settings-card"><div class="settings-row"><div><strong>Меньше анимаций</strong></div><label class="switch" aria-label="Меньше анимаций"><input type="checkbox" id="setting-motion" ${data.reduceMotion ? 'checked' : ''}><span></span></label></div><div class="settings-row"><label for="setting-weekly-goal"><strong>Цель на неделю</strong></label><select id="setting-weekly-goal">${[3, 5, 7, 10, 15].map(n => `<option value="${n}" ${data.weeklyGoal === n ? 'selected' : ''}>${n} задач</option>`).join('')}</select></div></div>
        <button class="settings-destination" data-action="go" data-page="phone"><span class="settings-destination-icon">📞</span><span class="grow"><strong>Голос Jarvis</strong><small>План утром и отчёт вечером</small></span><span aria-hidden="true">›</span></button>
        <button class="settings-destination" data-action="go" data-page="tech"><span class="settings-destination-icon">🛠️</span><span class="grow"><strong>Jarvis · приложение</strong><small>Проверки и запросы на изменения</small></span><span aria-hidden="true">›</span></button>
        <div class="settings-group-heading"><strong>Сервер Jarvis</strong></div>
        <div class="card settings-card"><div class="settings-action-row"><div class="grow"><strong>${serverConfigured() ? 'Подключён' : 'Не подключён'}</strong><small>${serverConfigured() ? esc(data.server.url) : 'Без сервера помощник работает только с локальными данными'}</small></div><button class="secondary-btn" data-action="server-form">${serverConfigured() ? 'Изменить' : 'Подключить'}</button></div></div>
        <div class="settings-group-heading"><strong>Данные</strong></div><div class="card settings-card"><div class="settings-action-row"><div class="grow"><strong>Сохранить копию</strong><small>Без вложенных файлов</small></div><button class="secondary-btn" data-action="export">Скачать</button></div><div class="settings-action-row"><div class="grow"><strong>Восстановить копию</strong></div><button class="secondary-btn" data-action="import">Выбрать</button></div><div class="settings-action-row reset-row"><div class="grow"><strong>Сбросить данные</strong></div><button class="text-btn danger-action" data-action="reset">Сбросить</button></div><input id="import-file" type="file" accept="application/json,.json" hidden></div>
        <details class="settings-preview"><summary>Виджет iPhone <span>образец</span></summary><div class="widget-preview"><div class="row"><span>◉ Kamron APP</span><strong>${esc(fmt(today(), { day: 'numeric', month: 'short' }))}</strong></div><p>${next ? `Далее: ${esc(next.item.title)} · ${next.item.time}` : 'Сегодня всё спокойно'}<br>🔥 ${stats.streak} · ✦ ${stats.points} баллов</p></div><small>Рабочий виджет появится в нативной версии.</small></details>
        <p class="settings-footnote">Фоновые уведомления появятся в версии для iPhone.</p></div>`
          : ''
      }`;
}

export function phoneAgenda(key) {
  const events = dayItems(key)
    .slice(0, 8)
    .map(x => `${x.time} ${x.title}${x.kind === 'subject' ? ` (${x.category})` : ''}`);
  const tasks = allOpenTasks()
    .filter(t => t.due && t.due <= key)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5)
    .map(t => `${t.title} — ${t.source}${t.due < key ? ' (просрочено)' : ''}`);
  return { events, tasks };
}

export function voiceToday() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .formatToParts(new Date())
      .map(x => [x.type, x.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function renderPhone() {
  const p = data.phone,
    key = voiceToday(),
    agenda = phoneAgenda(key),
    tomorrow = phoneAgenda(addDays(key, 1)),
    report = p.reports?.[key] || emptyVoiceReport(),
    history = Object.entries(p.reports || {})
      .filter(([reportKey]) => reportKey < key)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 5);
  const dayButtons = [1, 2, 3, 4, 5, 6, 0]
    .map(
      day =>
        `<label class="voice-day"><input type="checkbox" name="days" value="${day}" ${p.days.includes(day) ? 'checked' : ''}><span>${DAY[day]}</span></label>`
    )
    .join('');
  const formatItems = items =>
    items.length
      ? items.map(line => `<li>${esc(line)}</li>`).join('')
      : '<li>Пока ничего не запланировано</li>';
  return `<button class="back-link" data-action="go" data-page="${view.assistantBack}">← ${view.assistantBack === 'jarvis' ? 'Jarvis' : 'Настройки'}</button>${heading('НА СВЯЗИ', 'Jarvis · голос', 'Утром — план и разговор. Вечером — честный разбор дня.')}
      <div class="voice-lead card"><span class="voice-lead-icon" aria-hidden="true">☎</span><div><strong>Звонки Jarvis · подключение</strong><p>Настройки и отчёт сохраняются на устройстве. Входящие звонки пока не активны.</p></div></div>
      <div class="voice-two"><div class="card voice-summary"><span class="eyebrow">УТРО · ${esc(p.morning)}</span><strong>План на сегодня</strong><ul>${formatItems(agenda.events)}</ul>${agenda.tasks.length ? `<small>Задачи: ${esc(agenda.tasks.join(' · '))}</small>` : ''}</div><div class="card voice-summary"><span class="eyebrow">ЗАВТРА</span><strong>Что ждёт впереди</strong><ul>${formatItems(tomorrow.events)}</ul></div></div>
      <div class="section-title">Когда связываться</div>
      <form class="card voice-form" data-form="phone"><div class="voice-time-grid"><label>Утренний разговор<input type="time" name="morning" value="${esc(p.morning)}" required></label><label>Вечерний разбор<input type="time" name="evening" value="${esc(p.evening)}" required></label></div><div class="voice-days" role="group" aria-label="Дни звонков">${dayButtons}</div><label>Тон общения<select name="tone"><option value="supportive" ${p.tone === 'supportive' ? 'selected' : ''}>Поддерживающий</option><option value="direct" ${p.tone === 'direct' ? 'selected' : ''}>Прямой</option><option value="strict" ${p.tone === 'strict' ? 'selected' : ''}>Строгий, без оскорблений</option></select></label><label>Ваш профиль Telegram<input type="text" name="telegramUser" inputmode="text" autocomplete="off" placeholder="@username" value="${esc(p.telegramUser)}" maxlength="33"></label><p class="settings-note">Время — Ташкент (UTC+5). Профиль понадобится отдельному аккаунту помощника, чтобы позвонить именно вам. Код Telegram и пароль сюда не вводите.</p><button class="primary-btn" type="submit">Сохранить сценарий</button></form>
      <div class="section-title">Вечерний отчёт <small>${esc(fmt(key, { day: 'numeric', month: 'long' }))}</small></div><form class="card voice-form" data-form="phone-report"><label>Что получилось сегодня?<textarea name="done" rows="2" maxlength="1000" placeholder="Что сделал, где продвинулся">${esc(report.done)}</textarea></label><label>Что не получилось?<textarea name="missed" rows="2" maxlength="1000" placeholder="Что осталось открытым">${esc(report.missed)}</textarea></label><label>Что помешало?<textarea name="reason" rows="2" maxlength="1000" placeholder="Причина без оправданий">${esc(report.reason)}</textarea></label><label>Главный шаг завтра<input name="tomorrow" maxlength="250" placeholder="Одно конкретное действие" value="${esc(report.tomorrow)}"></label><button class="secondary-btn" type="submit">Сохранить отчёт</button></form>${history.length ? `<div class="section-title">Прошлые отчёты</div>${history.map(([key, r]) => `<div class="card voice-history"><strong>${esc(fmt(key, { day: 'numeric', month: 'long' }))}</strong><p>${esc(r.done || 'Побед не записано')}</p>${r.missed ? `<small>Не получилось: ${esc(r.missed)}</small>` : ''}</div>`).join('')}` : ''}
      <details class="card voice-explain"><summary>Как заработают звонки</summary><p>Помощнику понадобится отдельный пользовательский аккаунт Telegram: ботам звонки недоступны. Сервер по расписанию начнёт вызов через Telegram-клиент и передаст звук в OpenAI GPT‑Live. Для работы нужны отдельный аккаунт, защищённый сервер и проверка звукового моста; один HTML-файл не может звонить в фоне.</p></details>`;
}
