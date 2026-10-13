/** Состояние приложения: значения по умолчанию, нормализация, загрузка и запись в localStorage. */
import { KEY, OLD_THEMES, THEMES } from './constants.js';
import { toast } from './toast.js';
import { $, fromKey, today, uid } from './utils.js';
import { validGithubUrl, validRailwayUrl } from '../features/export.js';

export const defaultRoutine = () => [
  { id: uid(), time: '07:30', title: 'Подъём и вода', category: 'Личное', days: [1, 2, 3, 4, 5] },
  { id: uid(), time: '08:00', title: 'Завтрак и план дня', category: 'Личное', days: [1, 2, 3, 4, 5] },
  { id: uid(), time: '09:00', title: 'Главная задача', category: 'Работа', days: [1, 2, 3, 4, 5] },
  { id: uid(), time: '13:00', title: 'Обед и перерыв', category: 'Личное', days: [1, 2, 3, 4, 5] },
  { id: uid(), time: '17:00', title: 'Разбор задач и почты', category: 'Работа', days: [1, 2, 3, 4, 5] },
  { id: uid(), time: '22:30', title: 'Подготовка ко сну', category: 'Личное', days: [0, 1, 2, 3, 4, 5, 6] },
  { id: uid(), time: '09:00', title: 'Спокойное утро', category: 'Личное', days: [0, 6] },
  { id: uid(), time: '12:00', title: 'Свободный блок', category: 'Личное', days: [0, 6] }
];

export const resolveTheme = theme => (THEMES[theme] ? theme : OLD_THEMES[theme] || 'sky');

export const emptyVoiceReport = () => ({ done: '', missed: '', reason: '', tomorrow: '' });

export const defaultPhone = () => ({
  telegramUser: '',
  timezone: 'Asia/Tashkent',
  morning: '07:30',
  evening: '21:30',
  days: [0, 1, 2, 3, 4, 5, 6],
  tone: 'direct',
  reports: {}
});

export const defaults = () => ({
  version: 1,
  name: 'Камрон',
  theme: 'sky',
  reduceMotion: false,
  reminders: false,
  lead: 10,
  weeklyGoal: 5,
  routine: defaultRoutine(),
  routineDone: {},
  personalTasks: [],
  projects: [],
  subjects: [],
  seminarPreps: [],
  notes: [],
  techRequests: [],
  phone: defaultPhone(),
  gym: [],
  best: { block: 0, merge: 0, memory: 0 },
  games: {},
  server: defaultServer()
});

/**
 * Подключение к серверу Jarvis.
 * Ключ доступа — личный пропуск к вашему же сервису, а не ключ модели:
 * ключи провайдеров живут только на сервере, в переменных окружения.
 */
export const defaultServer = () => ({ url: '', token: '' });

export function normalizeData(raw) {
  const fresh = defaults();
  const { focus: unusedFocus, focusHistory: unusedHistory, ...rest } = raw;
  const isDate = value =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromKey(value).getTime());
  const tasks = list =>
    Array.isArray(list)
      ? list
          .filter(t => t && typeof t.id === 'string' && typeof t.title === 'string')
          .map(t => ({
            ...t,
            title: t.title.slice(0, 120),
            due: isDate(t.due) ? t.due : '',
            priority: t.priority === 'high' ? 'high' : 'normal',
            doneAt: typeof t.doneAt === 'string' && Number.isFinite(Date.parse(t.doneAt)) ? t.doneAt : null
          }))
      : [];
  const routine = rest.routine
    .filter(
      e =>
        e &&
        typeof e.id === 'string' &&
        typeof e.title === 'string' &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(e.time || '')
    )
    .map(e => ({
      ...e,
      title:
        e.title === 'Главный фокус' && e.time === '09:00' && e.category === 'Работа'
          ? 'Главная задача'
          : e.title,
      days: Array.isArray(e.days)
        ? [...new Set(e.days.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))]
        : [],
      ...(e.date ? { date: isDate(e.date) ? e.date : today() } : {})
    }));
  const projects = rest.projects
    .filter(p => p && typeof p.id === 'string' && typeof p.name === 'string')
    .map(p => ({
      ...p,
      tasks: tasks(p.tasks),
      notes: Array.isArray(p.notes)
        ? p.notes
            .filter(n => n && typeof n.id === 'string' && typeof n.text === 'string')
            .map(n => ({
              ...n,
              createdAt:
                typeof n.createdAt === 'string' && Number.isFinite(Date.parse(n.createdAt))
                  ? n.createdAt
                  : new Date().toISOString()
            }))
        : [],
      ai:
        p.ai && typeof p.ai === 'object'
          ? {
              goal: String(p.ai.goal || '').slice(0, 240),
              githubUrl: validGithubUrl(String(p.ai.githubUrl || '')) || '',
              railwayUrl: validRailwayUrl(String(p.ai.railwayUrl || '')) || '',
              githubSnapshot:
                p.ai.githubSnapshot && typeof p.ai.githubSnapshot === 'object'
                  ? {
                      sha: String(p.ai.githubSnapshot.sha || ''),
                      message: String(p.ai.githubSnapshot.message || '').slice(0, 300),
                      date: String(p.ai.githubSnapshot.date || '')
                    }
                  : null,
              requests: Array.isArray(p.ai.requests)
                ? p.ai.requests
                    .filter(
                      r =>
                        r &&
                        typeof r.id === 'string' &&
                        typeof r.title === 'string' &&
                        typeof r.description === 'string' &&
                        typeof r.createdAt === 'string'
                    )
                    .slice(-50)
                : []
            }
          : undefined
    }));
  const subjects = rest.subjects
    .filter(s => s && typeof s.id === 'string' && typeof s.name === 'string')
    .map(s => ({
      ...s,
      tasks: tasks(s.tasks),
      days: Array.isArray(s.days)
        ? [...new Set(s.days.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))]
        : [],
      startDate: isDate(s.startDate) ? s.startDate : today(),
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time || '') ? s.time : '10:00',
      duration: Math.min(300, Math.max(15, Number(s.duration) || 90)),
      mode: ['alternate', 'lecture', 'seminar', 'general'].includes(s.mode) ? s.mode : 'general',
      firstType: s.firstType === 'Семинар' ? 'Семинар' : 'Лекция',
      exceptions:
        s.exceptions && typeof s.exceptions === 'object' && !Array.isArray(s.exceptions) ? s.exceptions : {},
      attendance:
        s.attendance && typeof s.attendance === 'object' && !Array.isArray(s.attendance) ? s.attendance : {}
    }));
  const notes = rest.notes
    .filter(n => n && typeof n.id === 'string' && typeof n.body === 'string')
    .map(n => ({
      ...n,
      title: typeof n.title === 'string' ? n.title : '',
      category: ['Идея', 'Личное', 'Важное'].includes(n.category) ? n.category : 'Личное',
      pinned: !!n.pinned,
      createdAt:
        typeof n.createdAt === 'string' && Number.isFinite(Date.parse(n.createdAt))
          ? n.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof n.updatedAt === 'string' && Number.isFinite(Date.parse(n.updatedAt)) ? n.updatedAt : undefined
    }));
  const rawGames = rest.games && typeof rest.games === 'object' ? rest.games : {},
    games = {};
  const validBoard = (game, size) =>
    game &&
    Array.isArray(game.grid) &&
    game.grid.length === size &&
    game.grid.every(
      row =>
        Array.isArray(row) && row.length === size && row.every(value => Number.isFinite(value) && value >= 0)
    );
  if (
    validBoard(rawGames.block, 8) &&
    Array.isArray(rawGames.block.pieces) &&
    rawGames.block.pieces.length === 3 &&
    rawGames.block.pieces.every(
      shape =>
        shape === null ||
        (Array.isArray(shape) &&
          shape.length > 0 &&
          shape.length <= 9 &&
          shape.every(cell => Array.isArray(cell) && cell.length === 2 && cell.every(Number.isInteger)))
    )
  )
    games.block = rawGames.block;
  if (validBoard(rawGames.merge, 4) && rawGames.merge.grid.flat().some(value => value > 0))
    games.merge = rawGames.merge;
  if (
    Array.isArray(rawGames.memory?.cards) &&
    rawGames.memory.cards.length === 16 &&
    rawGames.memory.cards.every(card => typeof card === 'string') &&
    Array.isArray(rawGames.memory.matched) &&
    Array.isArray(rawGames.memory.flipped)
  ) {
    const matched = [
      ...new Set(rawGames.memory.matched.filter(index => Number.isInteger(index) && index >= 0 && index < 16))
    ];
    games.memory = {
      ...rawGames.memory,
      busy: false,
      moves:
        Number.isInteger(rawGames.memory.moves) && rawGames.memory.moves >= 0 ? rawGames.memory.moves : 0,
      flipped: rawGames.memory.busy
        ? []
        : rawGames.memory.flipped
            .filter(index => Number.isInteger(index) && index >= 0 && index < 16 && !matched.includes(index))
            .slice(0, 1),
      matched: matched.length % 2 === 0 ? matched : []
    };
  }
  const seminarPreps = Array.isArray(rest.seminarPreps)
    ? rest.seminarPreps
        .filter(
          p => p && typeof p.id === 'string' && typeof p.subjectId === 'string' && typeof p.topic === 'string'
        )
        .slice(-100)
        .map(p => ({
          ...p,
          createdAt:
            typeof p.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(p.createdAt)
              ? p.createdAt
              : new Date().toISOString(),
          attachments: Array.isArray(p.attachments)
            ? p.attachments
                .filter(
                  f => f && typeof f.id === 'string' && typeof f.name === 'string' && Number.isFinite(f.size)
                )
                .slice(0, 10)
            : [],
          answers: p.answers && typeof p.answers === 'object' && !Array.isArray(p.answers) ? p.answers : {}
        }))
    : [];
  const phoneRaw =
    rest.phone && typeof rest.phone === 'object' && !Array.isArray(rest.phone) ? rest.phone : {};
  const reports = {};
  if (phoneRaw.reports && typeof phoneRaw.reports === 'object' && !Array.isArray(phoneRaw.reports))
    for (const [key, report] of Object.entries(phoneRaw.reports).slice(-120))
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && report && typeof report === 'object')
        reports[key] = Object.fromEntries(
          Object.keys(emptyVoiceReport()).map(field => [
            field,
            String(report[field] || '').slice(0, field === 'tomorrow' ? 250 : 1000)
          ])
        );
  const phone = {
    ...defaultPhone(),
    telegramUser: /^@[A-Za-z0-9_]{5,32}$/.test(phoneRaw.telegramUser || '') ? phoneRaw.telegramUser : '',
    morning: /^([01]\d|2[0-3]):[0-5]\d$/.test(phoneRaw.morning || '') ? phoneRaw.morning : '07:30',
    evening: /^([01]\d|2[0-3]):[0-5]\d$/.test(phoneRaw.evening || '') ? phoneRaw.evening : '21:30',
    tone: ['supportive', 'direct', 'strict'].includes(phoneRaw.tone) ? phoneRaw.tone : 'direct',
    days: Array.isArray(phoneRaw.days)
      ? [...new Set(phoneRaw.days.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))]
      : [0, 1, 2, 3, 4, 5, 6],
    reports
  };
  const serverRaw = rest.server && typeof rest.server === 'object' ? rest.server : {};
  // Адрес сервера принимаем только по https — ключ доступа не должен уходить открытым текстом.
  const serverUrl = String(serverRaw.url || '').trim();
  const server = {
    url:
      /^https:\/\/[^\s]+$/.test(serverUrl) || /^http:\/\/localhost(:\d+)?$/.test(serverUrl) ? serverUrl : '',
    token: String(serverRaw.token || '')
      .trim()
      .slice(0, 200)
  };
  return {
    ...fresh,
    ...rest,
    server,
    projects,
    subjects,
    notes,
    routine,
    routineDone:
      rest.routineDone && typeof rest.routineDone === 'object' && !Array.isArray(rest.routineDone)
        ? rest.routineDone
        : {},
    personalTasks: tasks(rest.personalTasks),
    gym: Array.isArray(rest.gym)
      ? rest.gym
          .filter(x => x && typeof x.id === 'string' && isDate(x.date) && typeof x.title === 'string')
          .slice(-500)
      : [],
    seminarPreps,
    techRequests: Array.isArray(rest.techRequests)
      ? rest.techRequests
          .filter(
            r =>
              r &&
              typeof r.id === 'string' &&
              typeof r.description === 'string' &&
              typeof r.createdAt === 'string' &&
              /^\d{4}-\d{2}-\d{2}/.test(r.createdAt)
          )
          .slice(-100)
      : [],
    phone,
    theme: resolveTheme(raw.theme),
    best:
      rest.best && typeof rest.best === 'object'
        ? {
            block: Number(rest.best.block) || 0,
            merge: Number(rest.best.merge) || 0,
            memory: Number(rest.best.memory) || 0
          }
        : fresh.best,
    games,
    name: typeof rest.name === 'string' && rest.name.trim() ? rest.name.slice(0, 25) : fresh.name,
    reduceMotion: !!rest.reduceMotion,
    reminders: !!rest.reminders,
    lead: [0, 5, 10, 30].includes(Number(rest.lead)) ? Number(rest.lead) : 10,
    weeklyGoal: [3, 5, 7, 10, 15].includes(Number(raw.weeklyGoal)) ? Number(raw.weeklyGoal) : 5
  };
}

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (
      raw &&
      raw.version === 1 &&
      Array.isArray(raw.projects) &&
      Array.isArray(raw.subjects) &&
      Array.isArray(raw.notes) &&
      Array.isArray(raw.routine)
    ) {
      const clean = normalizeData(raw);
      if ('focus' in raw || 'focusHistory' in raw)
        try {
          localStorage.setItem(KEY, JSON.stringify(clean));
        } catch (_) {}
      return clean;
    }
  } catch (_) {}
  return defaults();
}

export let data = load();

export let view = {
  page: 'home',
  id: null,
  prepId: null,
  date: today(),
  routineMode: 'day',
  routineCalendarOpen: false,
  settingsMoreOpen: false,
  assistantBack: 'settings',
  noteFilter: 'all',
  noteQuery: '',
  workQuery: '',
  uniQuery: '',
  subjectFilter: 'open',
  taskFilter: 'all',
  taskQuery: '',
  game: 'block',
  block: null,
  merge: null,
  memory: null,
  dragging: null,
  techCheckedAt: null
};

export const scrollMemory = new Map();
// rt.toastTimer, rt.undoTask -> rt (core/state.js)
//
// rt.modalSnapshot, rt.prepAnswerTimer, rt.pendingPrepAnswer -> rt (core/state.js)
//
//
// rt.suppressCellClickUntil -> rt (core/state.js)
// rt.suppressPieceClickUntil -> rt (core/state.js)

export const shownReminders = new Set();

export function reminded(key) {
  if (shownReminders.has(key)) return true;
  try {
    return !!sessionStorage.getItem(key);
  } catch (_) {
    return false;
  }
}

export function markReminded(key) {
  shownReminders.add(key);
  try {
    sessionStorage.setItem(key, '1');
  } catch (_) {}
}

/**
 * Подписчики на сохранение. Нужны, чтобы синхронизация снимка с сервером
 * не требовала импорта features/api.js в ядро: ядро не должно знать о сети.
 */
export const onSaved = [];

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    onSaved.forEach(fn => fn());
    return true;
  } catch (_) {
    toast('Не удалось сохранить. Проверьте память устройства и скачайте копию данных.');
    return false;
  }
}

/**
 * Изменяемые значения времени выполнения, общие для нескольких модулей.
 * Собраны в один объект, потому что импортированную переменную нельзя
 * переназначить из другого модуля, а свойство объекта — можно.
 */
export const rt = {
  toastTimer: undefined,
  undoTask: null,
  modalSnapshot: null,
  prepAnswerTimer: null,
  pendingPrepAnswer: null,
  suppressCellClickUntil: 0,
  suppressPieceClickUntil: 0
};

/** Заменяет весь снимок данных (импорт копии, сброс, отмена импорта). */
export function setData(next) {
  data = next;
}
