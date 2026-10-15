/** Технический помощник: локальные проверки и запросы на изменения. */
import { KEY } from '../core/constants.js';
import { invalidRoutineDoneCount, routineOccurs } from '../core/selectors.js';
import { data, save, view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $, esc, fmt, safeId } from '../core/utils.js';
import { heading } from '../ui/components.js';
import { go, refreshPage } from '../ui/shell.js';

export function techDiagnostics() {
  const checks = [];
  let bytes = 0;
  try {
    const raw = localStorage.getItem(KEY),
      saved = raw && JSON.parse(raw);
    bytes = raw ? new Blob([raw]).size : 0;
    checks.push({
      ok:
        !raw ||
        !!(
          saved?.version === 1 &&
          Array.isArray(saved.projects) &&
          Array.isArray(saved.subjects) &&
          Array.isArray(saved.routine)
        ),
      title: 'Сохранение данных',
      detail: saved ? 'Локальная копия читается' : 'Данные сохранятся после первого изменения'
    });
  } catch (_) {
    checks.push({ ok: false, title: 'Сохранение данных', detail: 'Не удалось прочитать локальную копию' });
  }
  const invalid = invalidRoutineDoneCount();
  checks.push({
    ok: !invalid,
    title: 'Отметки режима дня',
    detail: invalid ? `${invalid} записей относятся к удалённым пунктам` : 'Повреждённых отметок не найдено'
  });
  checks.push({
    ok: bytes < 3500000,
    title: 'Объём данных',
    detail: `${Math.round(bytes / 1024)} КБ в памяти браузера${bytes >= 3500000 ? ' · рекомендуется экспортировать копию' : ''}`
  });
  const page = $('#page'),
    overflow = Number(page?.clientWidth) > 0 && page.scrollWidth > page.clientWidth + 2;
  checks.push({
    ok: !overflow,
    title: 'Ширина экрана',
    detail: overflow
      ? 'Обнаружен выход содержимого за правый край'
      : 'На текущем экране горизонтального выхода нет'
  });
  const protocol = window.location?.protocol;
  checks.push({
    ok: true,
    title: 'Работа без сети',
    detail:
      protocol === 'file:'
        ? 'Локальный HTML-файл доступен без сети'
        : navigator.serviceWorker?.controller
          ? 'Файлы приложения сохранены для офлайн-режима'
          : 'Офлайн-кэш активируется после установки и повторного открытия'
  });
  return checks;
}

export function repairRoutineHistory() {
  const before = JSON.stringify(data.routineDone),
    events = new Map(data.routine.map(x => [x.id, x]));
  for (const [key, entries] of Object.entries(data.routineDone)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(entries)) {
      delete data.routineDone[key];
      continue;
    }
    const valid = [...new Set(entries.filter(id => events.has(id) && routineOccurs(events.get(id), key)))];
    if (valid.length) data.routineDone[key] = valid;
    else delete data.routineDone[key];
  }
  if (!save()) {
    data.routineDone = JSON.parse(before);
    return;
  }
  refreshPage(false);
  toast('Повреждённые отметки исправлены');
}

export function renderTech() {
  const checks = techDiagnostics(),
    issues = checks.filter(x => !x.ok).length,
    requests = (data.techRequests || []).slice().reverse();
  return `<button class="back-link" data-action="go" data-page="${view.assistantBack}">← ${view.assistantBack === 'jarvis' ? 'Jarvis' : 'Настройки'}</button>${heading('ПРОВЕРКА И ИЗМЕНЕНИЯ', 'Jarvis · приложение', 'Описывайте ошибки и улучшения прямо в приложении.')}
      <div class="tech-hero"><span aria-hidden="true">🛠️</span><div><strong>Что нужно изменить?</strong><p>Создайте запрос с точным описанием. Его можно скачать как готовое задание для Claude Code.</p></div><button class="primary-btn" data-action="new-tech-request">+ Новый запрос</button></div>
      <div class="tech-stage"><strong>Сейчас: проверка и подготовка задания</strong><small>Автоматические правки кода, доступ к закрытому GitHub и Railway появятся после подключения сервера. HTML-макет не меняет свой код автоматически.</small></div>
      <div class="section-title">Проверка приложения <small>${issues ? `${issues} требуют внимания` : 'всё в порядке'}</small></div>
      <div class="card tech-check-card">${checks.map(item => `<div class="tech-check"><span class="${item.ok ? 'good' : 'attention'}">${item.ok ? '✓' : '!'}</span><div class="grow"><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div></div>`).join('')}${invalidRoutineDoneCount() ? `<button class="primary-btn tech-repair" data-action="repair-routine-data">Исправить отметки режима дня</button>` : ''}<button class="secondary-btn tech-refresh" data-action="run-tech-check">Проверить снова</button>${view.techCheckedAt ? `<p class="tech-check-time">Последняя проверка: ${esc(view.techCheckedAt)}</p>` : ''}</div>
      <div class="section-title">Мои запросы <small>${requests.length}</small></div>
      ${requests.length ? requests.map(request => `<div class="card tech-request-card"><div class="row"><span class="tech-request-kind">${esc({ bug: 'Ошибка', design: 'Дизайн', feature: 'Функция' }[request.kind] || 'Изменение')}</span><span class="tiny muted">${esc(fmt(request.createdAt.slice(0, 10), { day: 'numeric', month: 'short' }))}</span></div><strong>${esc(request.area || 'Приложение')}</strong><p>${esc(request.description)}</p>${request.expected ? `<small>Нужно получить: ${esc(request.expected)}</small>` : ''}<div class="tech-request-actions"><button class="secondary-btn" data-action="download-tech-request" data-id="${safeId(request.id)}">Скачать задание</button><button class="text-btn" data-action="delete-tech-request" data-id="${safeId(request.id)}" aria-label="Удалить запрос">Удалить</button></div></div>`).join('') : `<div class="card tech-empty"><strong>Запросов пока нет</strong><p>Опишите баг или изменение — детали сохранятся на этом устройстве и войдут в резервную копию.</p></div>`}`;
}
