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
import { timingSafeEqual, randomBytes } from 'node:crypto';

const DIR = process.env.DATA_DIR || '/data';
const FILE = join(DIR, 'widget.json');
const KEY_FILE = join(DIR, 'widget-key.txt');

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

/**
 * Ключ виджета сервер заводит себе сам при первом обращении.
 *
 * Так его не нужно придумывать руками и класть в переменные: лишний шаг
 * настройки — лишний повод не довести дело до конца. Задан WIDGET_TOKEN
 * в переменных — берём его, это даёт возможность сменить ключ.
 */
let generated = null;
export function widgetKey() {
  if (config.widgetToken) return config.widgetToken;
  if (generated) return generated;
  try {
    const saved = readFileSync(KEY_FILE, 'utf8').trim();
    if (saved) return (generated = saved);
  } catch (_) {
    // Ключа ещё нет — заводим.
  }
  generated = randomBytes(24).toString('base64url');
  try {
    mkdirSync(dirname(KEY_FILE), { recursive: true });
    writeFileSync(KEY_FILE, generated);
  } catch (error) {
    // Том не подключён: ключ проживёт до перезапуска, и виджет попросит
    // пересобрать себя. Лучше так, чем отказ работать вовсе.
    console.error('Ключ виджета не записан на диск:', error.message);
  }
  return generated;
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
 * Главный ключ при этом тоже принимается — им пользуется страница.
 */
export function widgetAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const ok = same(token, widgetKey()) || (config.accessToken && same(token, config.accessToken));
  if (!ok) return res.status(401).json({ error: 'Неверный ключ виджета' });
  next();
}
