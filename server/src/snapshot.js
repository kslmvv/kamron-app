/**
 * Снимок состояния приложения.
 *
 * Данные живут в браузере на телефоне, а утренний звонок делает сервер —
 * в 06:30 телефон может быть выключен. Поэтому приложение присылает сюда
 * снимок при каждом сохранении, а звонок читает последний присланный.
 *
 * Снимок пишется на диск: без этого перезапуск контейнера оставлял бы
 * звонок без данных до следующего открытия приложения.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const DIR = process.env.DATA_DIR || '/data';
const FILE = join(DIR, 'snapshot.json');

let current = null;
try {
  current = JSON.parse(readFileSync(FILE, 'utf8'));
} catch (_) {
  // Первый запуск или том не подключён — работаем из памяти.
}

export function saveSnapshot(snapshot) {
  current = { ...snapshot, savedAt: new Date().toISOString() };
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(current));
  } catch (error) {
    console.error('Снимок не записан на диск:', error.message);
  }
  return current;
}

export function readSnapshot() {
  return current;
}

export function snapshotAge() {
  if (!current?.savedAt) return null;
  return Math.round((Date.now() - Date.parse(current.savedAt)) / 60000);
}
