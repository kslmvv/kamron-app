/**
 * Очередь изменений, надиктованных в звонке.
 *
 * Данные приложения живут в браузере на телефоне, и сервер не может
 * записать в них напрямую. Поэтому разговор складывает изменения сюда,
 * а приложение забирает их при открытии и применяет у себя.
 *
 * Очередь на диске: между звонком вечером и открытием приложения утром
 * контейнер успевает перезапуститься не один раз.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const DIR = process.env.DATA_DIR || '/data';
const FILE = join(DIR, 'changes.json');

/** Больше этого в очереди не держим: приложение могло не открываться неделями. */
const LIMIT = 200;

let pending = [];
try {
  const raw = JSON.parse(readFileSync(FILE, 'utf8'));
  if (Array.isArray(raw)) pending = raw;
} catch (_) {
  // Первый запуск или том не подключён — работаем из памяти.
}

function persist() {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(pending));
  } catch (error) {
    console.error('Очередь изменений не записана на диск:', error.message);
  }
}

/** Виды изменений и обязательные поля. Что не описано — не принимается. */
const KINDS = {
  task: ['title'],
  routine: ['time', 'title'],
  note: ['body'],
  complete: ['title']
};

export function addChange(kind, payload) {
  const required = KINDS[kind];
  if (!required) throw Object.assign(new Error(`Неизвестный вид изменения: ${kind}`), { status: 400 });
  const missing = required.filter(field => !String(payload?.[field] || '').trim());
  if (missing.length)
    throw Object.assign(new Error(`Не хватает полей: ${missing.join(', ')}`), { status: 400 });

  const change = {
    id: randomUUID(),
    kind,
    at: new Date().toISOString(),
    data: payload
  };
  pending.push(change);
  if (pending.length > LIMIT) pending = pending.slice(-LIMIT);
  persist();
  return change;
}

export function listChanges() {
  return pending;
}

/** Приложение подтверждает применённые по идентификаторам, остальные ждут. */
export function ackChanges(ids) {
  const done = new Set(Array.isArray(ids) ? ids : []);
  const before = pending.length;
  pending = pending.filter(change => !done.has(change.id));
  persist();
  return before - pending.length;
}
