/** Доступ к серверу по общему секрету и простое ограничение частоты. */
import { timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

function sameToken(a, b) {
  const x = Buffer.from(a || '');
  const y = Buffer.from(b || '');
  return x.length === y.length && timingSafeEqual(x, y);
}

export function requireToken(req, res, next) {
  if (!config.accessToken) {
    return res.status(503).json({ error: 'Сервер не настроен: не задан APP_ACCESS_TOKEN' });
  }
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!sameToken(token, config.accessToken)) {
    return res.status(401).json({ error: 'Неверный ключ доступа' });
  }
  next();
}

/** Защита от случайного цикла в приложении: не больше N запросов в минуту с адреса. */
export function rateLimit(perMinute = 30) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const window = hits.get(key)?.filter(t => now - t < 60000) || [];
    if (window.length >= perMinute) {
      return res.status(429).json({ error: 'Слишком много запросов, подождите минуту' });
    }
    window.push(now);
    hits.set(key, window);
    if (hits.size > 500) for (const [k, v] of hits) if (!v.some(t => now - t < 60000)) hits.delete(k);
    next();
  };
}
