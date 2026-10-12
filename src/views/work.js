/** Работа: проекты, страница проекта и Jarvis по проекту. */
import { svg } from '../core/icons.js';
import { allTasks } from '../core/selectors.js';
import { data, view } from '../core/state.js';
import { $, esc, fmt, plural, safeId, today } from '../core/utils.js';
import { validGithubUrl, validRailwayUrl } from '../features/export.js';
import { empty, heading, overview, taskRows } from '../ui/components.js';
import { go } from '../ui/shell.js';

export function renderWork() {
  const projects = data.projects.length,
    allTasks = data.projects.flatMap(p => p.tasks || []),
    open = allTasks.filter(t => !t.doneAt).length,
    done = allTasks.length - open;
  const query = view.workQuery.trim().toLocaleLowerCase('ru-RU');
  const list = data.projects
    .map(p => {
      const done = (p.tasks || []).filter(t => t.doneAt).length,
        total = (p.tasks || []).length,
        next = (p.tasks || [])
          .filter(t => !t.doneAt)
          .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))[0],
        late = !!next?.due && next.due < today(),
        matches = `${p.name} ${p.description || ''}`.toLocaleLowerCase('ru-RU').includes(query);
      return `<article class="card clickable" data-action="open-project" data-project-card data-id="${safeId(p.id)}" ${matches ? '' : 'hidden'} tabindex="0" role="button"><div class="row"><div class="project-logo" style="background:${esc(p.color || '#b16b4a')}33">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || '🚀')}</div><div class="grow"><div class="card-title">${esc(p.name)}</div><div class="card-sub">${esc(p.description || 'Документация пока не добавлена')}</div></div>${svg('chevron')}</div><div class="utility-row"><span class="tag mint">${done}/${total} готово</span><span class="tag purple">${(p.notes || []).length} ${plural((p.notes || []).length, 'заметка', 'заметки', 'заметок')}</span></div><div class="project-card-next ${late ? 'is-overdue' : ''}"><span>${late ? 'ПРОСРОЧЕНО' : next ? 'ДАЛЬШЕ' : 'СОСТОЯНИЕ'}</span><strong>${esc(next?.title || 'Активных задач нет')}</strong>${next?.due ? `<small>${esc(fmt(next.due, { day: 'numeric', month: 'short' }))}</small>` : ''}</div></article>`;
    })
    .join('');
  return `${heading('ТВОИ ИДЕИ В ДЕЛЕ', 'Работа', 'Проекты, документация и шаги к результату.', projects ? 'new-project' : null)}${
    projects
      ? overview([
          [projects, 'проектов'],
          [open, 'в работе'],
          [done, 'готово']
        ])
      : ''
  }${projects ? `<button class="task-hub-link" data-action="go" data-page="tasks">Все задачи <span>›</span></button>` : ''}${data.projects.length ? `<input class="subject-search" id="work-search" type="search" placeholder="Найти проект" value="${esc(view.workQuery)}" aria-label="Найти проект"><div id="project-list">${list}</div><div class="search-empty" id="work-search-empty" ${data.projects.some(p => `${p.name} ${p.description || ''}`.toLocaleLowerCase('ru-RU').includes(query)) ? 'hidden' : ''}>Проект не найден. Попробуйте другое слово.</div>` : empty('🚀', 'Начните с проекта', 'Создайте карточку, выберите логотип и запишите первую задачу.', 'new-project', 'Добавить проект')}`;
}

export function renderProject() {
  const p = data.projects.find(x => x.id === view.id);
  if (!p) {
    view.page = 'work';
    return renderWork();
  }
  const total = (p.tasks || []).length,
    done = (p.tasks || []).filter(t => t.doneAt).length,
    percent = total ? Math.round((done / total) * 100) : 0,
    next = (p.tasks || [])
      .filter(t => !t.doneAt)
      .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))[0];
  return `<button class="back-link" data-action="go" data-page="work">← Все проекты</button><div class="detail-head"><div class="row"><div class="project-logo" style="background:${esc(p.color || '#b16b4a')}55">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || '🚀')}</div><div class="grow"><h1>${esc(p.name)}</h1></div><button class="icon-btn" data-action="edit-project" data-id="${safeId(p.id)}" aria-label="Изменить проект">✎</button></div><div class="project-progress"><div><span>Прогресс</span><strong>${done}/${total} задач · ${percent}%</strong></div><div class="level-progress"><i style="width:${percent}%"></i></div></div></div>
      <button class="project-action ${next?.due && next.due < today() ? 'is-overdue' : ''}" data-action="${next ? 'open-task' : 'new-task'}" data-kind="work" data-parent="${safeId(p.id)}" ${next ? `data-id="${safeId(next.id)}"` : ''}><span class="grow"><small>${next?.due && next.due < today() ? 'ПРОСРОЧЕНО' : next ? 'СЛЕДУЮЩИЙ ШАГ' : 'ПЛАН ПРОЕКТА'}</small><strong>${esc(next?.title || 'Добавить первую задачу')}</strong></span><span aria-hidden="true">›</span></button>
      <button class="ai-entry" data-action="open-project-ai" data-id="${safeId(p.id)}"><span class="ai-entry-icon">✦</span><span class="grow"><strong>Jarvis · проект</strong><small>Контекст, GitHub, Railway и поручения</small></span><span aria-hidden="true">›</span></button>
      <div class="section-title">Документация <button class="text-btn" data-action="edit-project" data-id="${safeId(p.id)}">Изменить</button></div><div class="card"><p class="doc-text">${esc(p.description || 'Опишите здесь цель проекта, идею, ссылки и важный контекст.')}</p></div>
      <div class="section-title">Задачи <button class="text-btn" data-action="new-task" data-kind="work" data-parent="${safeId(p.id)}">+ Добавить</button></div><div class="card">${taskRows(p.tasks || [], 'work', p.id)}</div>
      <div class="section-title">Рабочие заметки <button class="text-btn" data-action="new-project-note" data-parent="${safeId(p.id)}">+ Добавить</button></div>${
        (p.notes || []).length
          ? p.notes
              .slice()
              .reverse()
              .map(
                n =>
                  `<div class="card note-card" data-project-note-id="${safeId(n.id)}"><p>${esc(n.text)}</p><div class="row"><span class="tiny muted grow">${esc(fmt(n.createdAt.slice(0, 10)))}</span><button class="text-btn" data-action="edit-project-note" data-parent="${safeId(p.id)}" data-id="${safeId(n.id)}">Изменить</button><button class="delete-btn" data-action="delete-project-note" data-parent="${safeId(p.id)}" data-id="${safeId(n.id)}" aria-label="Удалить заметку">×</button></div></div>`
              )
              .join('')
          : `<div class="card small muted">Заметок пока нет.</div>`
      }
      <div class="utility-row"><button class="secondary-btn" data-action="delete-project" data-id="${safeId(p.id)}">Удалить проект</button></div>`;
}

export function renderProjectAi() {
  const p = data.projects.find(x => x.id === view.id);
  if (!p) {
    view.page = 'work';
    return renderWork();
  }
  const ai = p.ai || {},
    githubUrl = validGithubUrl(ai.githubUrl || ''),
    railwayUrl = validRailwayUrl(ai.railwayUrl || ''),
    open = (p.tasks || []).filter(t => !t.doneAt),
    done = (p.tasks || []).length - open.length,
    requests = (ai.requests || []).slice().reverse();
  return `<button class="back-link" data-action="go" data-page="project" data-id="${safeId(p.id)}">← ${esc(p.name)}</button>${heading('КОНТЕКСТ ДЛЯ РАБОТЫ', 'Jarvis · проект', 'Помощник для проекта, который уже существует в приложении.')}
      <div class="ai-hero"><span aria-hidden="true">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || '🚀')}</span><div><strong>${esc(p.name)}</strong><small>${open.length} задач в работе · ${done} выполнено · ${(p.notes || []).length} заметок</small></div></div>
      <div class="ai-stage"><strong>Сейчас: память проекта и готовые запросы</strong><small>HTML собирает контекст из описания, задач и заметок. Ответы модели и доступ к закрытым данным появятся после серверного подключения.</small></div>
      <div class="section-title">Контекст Jarvis <button class="text-btn" data-action="edit-project-ai" data-id="${safeId(p.id)}">Настроить</button></div><div class="card ai-context"><div><span>Цель</span><strong>${esc(ai.goal || 'Укажи главный результат проекта')}</strong></div><div><span>Описание</span><p>${esc(p.description || 'Добавь документацию в карточке проекта.')}</p></div><div><span>Следующий шаг</span><strong>${esc(open.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))[0]?.title || 'Активных задач нет')}</strong></div><div><span>Последняя заметка</span><p>${esc((p.notes || []).at(-1)?.text || 'Заметок пока нет')}</p></div></div>
      <div class="section-title">Источники проекта <small>подключение</small></div><div class="card ai-connections"><div class="ai-connection"><span class="ai-source">GH</span><div class="grow"><strong>GitHub</strong><small>${githubUrl ? 'Ссылка сохранена · публичную историю можно проверить' : 'Ссылка не добавлена'}</small></div>${githubUrl ? `<a href="${esc(githubUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть GitHub">↗</a>` : ''}</div>${githubUrl ? `<button class="secondary-btn" data-action="sync-github" data-id="${safeId(p.id)}">Проверить публичные изменения</button>` : ''}${ai.githubSnapshot ? `<div class="ai-snapshot"><strong>Последний доступный коммит</strong><p>${esc(ai.githubSnapshot.message)}</p><small>${esc(ai.githubSnapshot.date?.slice(0, 10) || '')} · ${esc(ai.githubSnapshot.sha?.slice(0, 7) || '')}</small></div>` : ''}<div class="ai-connection"><span class="ai-source rail">R</span><div class="grow"><strong>Railway</strong><small>${railwayUrl ? 'Ссылка сохранена · данные развёртывания не читаются' : 'Ссылка не добавлена'}</small></div>${railwayUrl ? `<a href="${esc(railwayUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть Railway">↗</a>` : ''}</div><button class="text-btn" data-action="edit-project-ai" data-id="${safeId(p.id)}">Изменить ссылки и цель</button></div>
      <div class="section-title">Поручения Jarvis <button class="text-btn" data-action="new-project-ai-request" data-id="${safeId(p.id)}">+ Новое</button></div>${requests.length ? requests.map(r => `<div class="card ai-request"><div class="row"><strong class="grow">${esc(r.title)}</strong><span class="tiny muted">${esc(fmt(r.createdAt.slice(0, 10), { day: 'numeric', month: 'short' }))}</span></div><p>${esc(r.description)}</p><div class="ai-request-actions"><button class="secondary-btn" data-action="export-project-ai-request" data-id="${safeId(r.id)}">↓ Скачать для Claude Code</button><button class="text-btn danger-action" data-action="delete-project-ai-request" data-id="${safeId(r.id)}">Удалить</button></div></div>`).join('') : '<div class="card ai-empty"><strong>Что поручить?</strong><p>Например: изучить последний релиз, найти причину бага или составить план новой функции на основе задач проекта.</p><button class="primary-btn" data-action="new-project-ai-request" data-id="${safeId(p.id)}">+ Создать поручение</button></div>'}
      <button class="secondary-btn ai-tech-link" data-action="go" data-page="tech">🛠️ Jarvis · приложение →</button>`;
}
