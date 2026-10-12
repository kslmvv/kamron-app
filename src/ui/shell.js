/** Каркас: верхняя панель, нижняя навигация, переходы и перерисовка страницы. */
import { THEMES } from '../core/constants.js';
import { svg } from '../core/icons.js';
import { data, resolveTheme, scrollMemory, view } from '../core/state.js';
import { $, today } from '../core/utils.js';
import { flushPrepAnswer } from '../forms/modal.js';
import { renderGames } from '../games/index.js';
import { renderGym } from '../views/gym.js';
import { renderHome, renderJarvis, renderMore } from '../views/home.js';
import { renderNotes } from '../views/notes.js';
import { renderRoutine } from '../views/routine.js';
import { renderPhone, renderSettings } from '../views/settings.js';
import { renderInsights, renderTasks } from '../views/tasks.js';
import { renderTech } from '../views/tech.js';
import { renderSeminar, renderSubject, renderUni } from '../views/uni.js';
import { renderProject, renderProjectAi, renderWork } from '../views/work.js';

export function topbar() {
  const jarvisActive =
    ['jarvis', 'project-ai', 'seminar'].includes(view.page) ||
    (['phone', 'tech'].includes(view.page) && view.assistantBack === 'jarvis');
  $('#topbar').innerHTML =
    `<div class="brand"><div class="brand-mark">◉</div><div class="brand-name">Kamron APP</div></div><div class="top-actions"><button class="icon-btn" data-action="command-center" aria-label="Поиск и быстрые действия" title="Поиск">${svg('search')}</button><button class="icon-btn jarvis-trigger ${jarvisActive ? 'active' : ''}" data-action="go" data-page="jarvis" aria-label="Открыть Jarvis" title="Jarvis" ${view.page === 'jarvis' ? 'aria-current="page"' : ''}>${svg('jarvis')}<span>Jarvis</span></button></div>`;
}

export function nav() {
  const items = [
    ['home', 'Главная'],
    ['routine', 'День'],
    ['more', 'Ещё']
  ];
  const assistantPage =
    ['jarvis', 'project-ai', 'seminar'].includes(view.page) ||
    (['tech', 'phone'].includes(view.page) && view.assistantBack === 'jarvis');
  const active = assistantPage ? '' : view.page === 'home' || view.page === 'routine' ? view.page : 'more';
  $('#nav').innerHTML = items
    .map(
      ([key, label]) =>
        `<button class="nav-item ${active === key ? 'active' : ''}" data-action="go" data-page="${key}" aria-label="${label}" ${active === key ? 'aria-current="page"' : ''}>${svg(key === 'routine' ? 'plan' : key)}<span>${label}</span></button>`
    )
    .join('');
}

export function go(page, id = null) {
  const previous = view.page,
    previousId = view.id,
    pageEl = $('#page');
  scrollMemory.set(`${previous}:${previousId || ''}`, pageEl.scrollTop || 0);
  const backTo = {
    project: 'work',
    subject: 'uni',
    seminar: 'subject',
    'project-ai': 'project',
    phone: view.assistantBack,
    tech: view.assistantBack
  };
  const restore = backTo[previous] === page;
  if (page === 'phone' || page === 'tech')
    view.assistantBack = view.page === 'jarvis' ? 'jarvis' : 'settings';
  if (page === 'routine' && view.page !== 'routine') {
    view.date = today();
    view.routineMode = 'day';
    view.routineCalendarOpen = false;
  }
  if (page === 'gym' && view.page !== 'gym') view.date = today();
  view.page = page;
  view.id = id;
  render();
  pageEl.scrollTop = restore ? scrollMemory.get(`${page}:${id || ''}`) || 0 : 0;
  pageEl.classList.add('page-enter');
  setTimeout(() => pageEl.classList.remove('page-enter'), 320);
}

export function jumpToTask(kind, parent, id) {
  if (kind === 'uni') view.subjectFilter = 'all';
  go(kind === 'work' ? 'project' : 'subject', parent);
  const row = [...$('#page').querySelectorAll('[data-task-row-id]')].find(
    item => item.dataset.taskRowId === id
  );
  if (row) {
    row.scrollIntoView({ block: 'center', behavior: data.reduceMotion ? 'auto' : 'smooth' });
    row.classList.add('task-highlight');
    setTimeout(() => row.classList.remove('task-highlight'), 1400);
  }
}

export function jumpToProjectNote(parent, id) {
  go('project', parent);
  const row = [...$('#page').querySelectorAll('[data-project-note-id]')].find(
    item => item.dataset.projectNoteId === id
  );
  if (row) {
    row.scrollIntoView({ block: 'center', behavior: data.reduceMotion ? 'auto' : 'smooth' });
    row.classList.add('task-highlight');
    setTimeout(() => row.classList.remove('task-highlight'), 1400);
  }
}

export function refreshPage(animate = true) {
  const pageEl = $('#page'),
    scroll = pageEl.scrollTop;
  render();
  pageEl.scrollTop = scroll;
  if (animate && !data.reduceMotion) {
    pageEl.classList.add('page-refresh');
    setTimeout(() => pageEl.classList.remove('page-refresh'), 300);
  }
}

export function render() {
  flushPrepAnswer();
  document.body.dataset.theme = resolveTheme(data.theme);
  document.querySelector('meta[name="theme-color"]').content = THEMES[resolveTheme(data.theme)].color;
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').content =
    data.theme === 'night' ? 'black-translucent' : 'default';
  document.body.classList.toggle('reduce-motion', data.reduceMotion);
  topbar();
  nav();
  const page = $('#page');
  page.className = `page ${view.page === 'home' ? 'dashboard' : ''}`;
  const map = {
    home: renderHome,
    more: renderMore,
    jarvis: renderJarvis,
    routine: renderRoutine,
    work: renderWork,
    project: renderProject,
    'project-ai': renderProjectAi,
    uni: renderUni,
    subject: renderSubject,
    seminar: renderSeminar,
    gym: renderGym,
    notes: renderNotes,
    games: renderGames,
    settings: renderSettings,
    phone: renderPhone,
    tasks: renderTasks,
    insights: renderInsights,
    tech: renderTech
  };
  page.innerHTML = (map[view.page] || renderHome)();
}
