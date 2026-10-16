/**
 * Резервные копии состояния приложения.
 *
 * Данные приложения живут в браузере телефона, а историю Safari легко
 * стереть одним движением — вместе с ней уходят отметки, привычки и
 * накопленная картина дней. Поэтому приложение присылает сюда полное
 * состояние, а сервер держит последнюю копию и несколько прошлых на том
 * же томе, где лежит очередь изменений.
 *
 * Прошлые копии нужны не для истории, а на случай, когда сломалась
 * последняя: пустое состояние, залитое поверх хорошего, тоже бывает.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.DATA_DIR || '/data';
const BACKUPS = join(DIR, 'backups');

/** Больше этого не держим: копии растут, а польза от старых падает. */
const KEEP = 10;

function ensure() {
  mkdirSync(BACKUPS, { recursive: true });
}

function files() {
  try {
    return readdirSync(BACKUPS)
      .filter(name => name.endsWith('.json'))
      .sort()
      .reverse();
  } catch (_) {
    return [];
  }
}

/** Короткая сводка копии — чтобы в приложении было видно, что в ней. */
function describe(state) {
  const done = state?.done && typeof state.done === 'object' ? Object.keys(state.done).length : 0;
  return {
    дней: done,
    задач: Array.isArray(state?.tasks) ? state.tasks.length : 0,
    привычек: Array.isArray(state?.habits) ? state.habits.length : 0,
    заметок: Array.isArray(state?.notes) ? state.notes.length : 0
  };
}

export function saveBackup(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw Object.assign(new Error('Нужен объект состояния'), { status: 400 });
  }
  ensure();
  const savedAt = new Date().toISOString();
  const body = JSON.stringify({ savedAt, state });
  const name = savedAt.replace(/[:.]/g, '-') + '.json';
  writeFileSync(join(BACKUPS, name), body);

  // Старые копии подчищаем сразу: том не резиновый.
  const extra = files().slice(KEEP);
  for (const old of extra) {
    try {
      unlinkSync(join(BACKUPS, old));
    } catch (_) {}
  }
  return { savedAt, байт: body.length, ...describe(state) };
}

export function readBackup(name) {
  const list = files();
  const file = name && list.includes(name) ? name : list[0];
  if (!file) return null;
  try {
    const raw = JSON.parse(readFileSync(join(BACKUPS, file), 'utf8'));
    return { имя: file, savedAt: raw.savedAt, state: raw.state };
  } catch (_) {
    return null;
  }
}

export function listBackups() {
  return files().map(name => {
    let savedAt = null;
    let about = {};
    let size = 0;
    try {
      const path = join(BACKUPS, name);
      size = statSync(path).size;
      const raw = JSON.parse(readFileSync(path, 'utf8'));
      savedAt = raw.savedAt;
      about = describe(raw.state);
    } catch (_) {}
    return { имя: name, savedAt, байт: size, ...about };
  });
}

/** Сколько минут назад сохраняли — приложению, чтобы показать статус. */
export function backupAge() {
  const last = files()[0];
  if (!last) return null;
  try {
    const raw = JSON.parse(readFileSync(join(BACKUPS, last), 'utf8'));
    return Math.round((Date.now() - Date.parse(raw.savedAt)) / 60000);
  } catch (_) {
    return null;
  }
}
