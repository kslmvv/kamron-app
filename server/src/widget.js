/**
 * День для виджета на айфоне.
 *
 * Бесплатная учётная запись Apple не даёт приложению и виджету общий
 * ящик на устройстве, поэтому снимок дня ходит через сервер: страница
 * кладёт его сюда, виджет читает. Данных тут ровно столько, сколько
 * виджет рисует — ни задач на будущее, ни заметок, ни переписки.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { config } from './config.js';
import { timingSafeEqual } from 'node:crypto';

const DIR = process.env.DATA_DIR || '/data';
const FILE = join(DIR, 'widget.json');

let current = null;
try {
  current = JSON.parse(readFileSync(FILE, 'utf8'));
} catch (_) {
  // Первый запуск или том не подключён — работаем из памяти.
}

export function saveWidgetDay(day) {
  current = { ...day, savedAt: new Date().toISOString() };
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(current));
  } catch (error) {
    console.error('День для виджета не записан на диск:', error.message);
  }
  return current;
}

export function readWidgetDay() {
  return current;
}

function same(a, b) {
  const x = Buffer.from(a || '');
  const y = Buffer.from(b || '');
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Ключ виджета отдельный и живёт в собранном приложении на телефоне.
 * Главный ключ туда класть нельзя: он открывает переписку, резервные
 * копии и расходы, а виджету нужен только сегодняшний день.
 */
export function widgetAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const ok =
    (config.widgetToken && same(token, config.widgetToken)) ||
    (config.accessToken && same(token, config.accessToken));
  if (!ok) return res.status(401).json({ error: 'Неверный ключ виджета' });
  next();
}
