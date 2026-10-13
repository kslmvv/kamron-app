/**
 * Связь с сервером Jarvis.
 *
 * Страница на GitHub Pages — статика: ключ модели в неё класть нельзя,
 * а закрытый GitHub и Railway из браузера недоступны. Поэтому такие
 * вызовы уходят на отдельный сервис (папка server/), а здесь хранится
 * только его адрес и личный ключ доступа.
 *
 * Без настроенного адреса все функции сообщают, что сервер не подключён,
 * и приложение продолжает работать в локальном режиме.
 */
import { data } from '../core/state.js';
import { dateKey, today } from '../core/utils.js';
import { allOpenTasks, dayItems, routineCompleted, upcomingLessons } from '../core/selectors.js';

/** @returns {boolean} задан ли адрес сервера и ключ доступа */
export function serverConfigured() {
  return !!(data.server?.url && data.server?.token);
}

function endpoint(path) {
  return `${String(data.server.url).replace(/\/+$/, '')}${path}`;
}

async function request(path, { method = 'GET', body, timeout = 70000 } = {}) {
  if (!serverConfigured()) throw new Error('Сервер Jarvis не подключён');
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeout);
  try {
    const response = await fetch(endpoint(path), {
      method,
      headers: {
        authorization: `Bearer ${data.server.token}`,
        ...(body ? { 'content-type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: control.signal
    });
    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch (_) {
      throw new Error('Сервер вернул не тот формат ответа');
    }
    if (!response.ok) throw new Error(payload.error || `Сервер ответил ошибкой ${response.status}`);
    return payload;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Сервер не ответил за отведённое время');
    if (err instanceof TypeError) throw new Error('Не удалось связаться с сервером. Проверьте адрес и сеть');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Проверка связи. Отвечает и до ввода ключа, поэтому запрашивается напрямую. */
export async function checkServer(url) {
  const base = String(url || data.server?.url || '').replace(/\/+$/, '');
  if (!base) throw new Error('Адрес сервера не указан');
  const response = await fetch(`${base}/api/health`);
  if (!response.ok) throw new Error(`Сервер ответил ошибкой ${response.status}`);
  return response.json();
}

/**
 * Снимок приложения для модели.
 * Отдаём только то, что нужно для ответа: списки обрезаны, вложений нет.
 */
export function snapshot() {
  const key = today();
  return {
    today: dateKey(new Date()),
    name: data.name,
    routine: dayItems(key)
      .slice(0, 30)
      .map(item => ({
        time: item.time,
        title: item.title,
        done: item.kind === 'routine' ? routineCompleted(key, item.id) : false
      })),
    tasks: allOpenTasks()
      .slice(0, 60)
      .map(t => ({ title: t.title, kind: t.kind, due: t.due || '', source: t.source || '' })),
    lessons: data.subjects
      .flatMap(subject =>
        upcomingLessons(subject, 3).map(lesson => ({
          date: lesson.key,
          time: subject.time || '',
          subject: subject.name,
          type: lesson.meeting?.type || ''
        }))
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 12),
    projects: data.projects.slice(0, 20).map(p => {
      const open = (p.tasks || []).filter(t => !t.doneAt);
      return {
        name: p.name,
        open: open.length,
        done: (p.tasks || []).length - open.length,
        next: open[0]?.title || ''
      };
    }),
    notes: data.notes.slice(0, 10).map(n => ({ title: n.title || '', body: (n.body || '').slice(0, 300) }))
  };
}

/**
 * Отправка снимка на сервер.
 *
 * Утренний звонок делает сервер, а данные живут в браузере: в 06:30
 * телефон может быть выключен. Поэтому снимок уходит при каждом
 * сохранении — с задержкой, чтобы серия правок дала один запрос.
 *
 * Ошибки молчаливые: это фоновая услуга, приложение работает без сервера.
 */
let syncTimer = null;
let lastSent = '';

export function syncSnapshot({ immediate = false } = {}) {
  if (!serverConfigured()) return;
  clearTimeout(syncTimer);
  const send = async () => {
    const body = snapshot();
    const fingerprint = JSON.stringify(body);
    if (fingerprint === lastSent) return;
    try {
      await request('/api/snapshot', { method: 'POST', body, timeout: 15000 });
      lastSent = fingerprint;
    } catch (_) {}
  };
  if (immediate) return void send();
  syncTimer = setTimeout(send, 4000);
}

export function jarvisChat(messages) {
  return request('/api/jarvis/chat', { method: 'POST', body: { messages, snapshot: snapshot() } });
}

export function seminarQuestions(payload) {
  return request('/api/seminar/questions', { method: 'POST', body: payload });
}

export function seminarReview(payload) {
  return request('/api/seminar/review', { method: 'POST', body: payload });
}

export function githubCommit(url) {
  return request(`/api/github/commit?url=${encodeURIComponent(url)}`);
}
