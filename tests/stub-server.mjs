/**
 * Заглушка сервера Jarvis для тестов.
 *
 * Повторяет контракт настоящего сервиса (server/), но отвечает заранее
 * известным текстом. Так проверяется поведение приложения, а не модель:
 * тест не тратит токены и не зависит от сети.
 */
import http from 'node:http';

export function stubServer(port) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const origin = req.headers.origin || '*';
      const head = {
        'access-control-allow-origin': origin,
        'access-control-allow-headers': 'content-type, authorization',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'content-type': 'application/json'
      };
      if (req.method === 'OPTIONS') {
        res.writeHead(204, head);
        return res.end();
      }
      if (req.url.startsWith('/api/health')) {
        res.writeHead(200, head);
        return res.end(
          JSON.stringify({
            ok: true,
            configured: true,
            capabilities: {
              jarvis: true,
              seminar: true,
              github: true,
              githubPrivate: true,
              railway: false,
              provider: 'anthropic'
            }
          })
        );
      }
      if ((req.headers.authorization || '') !== 'Bearer secret-key') {
        res.writeHead(401, head);
        return res.end(JSON.stringify({ error: 'Неверный ключ доступа' }));
      }
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        const parsed = body ? JSON.parse(body) : {};
        res.writeHead(200, head);
        if (req.url.startsWith('/api/jarvis/chat')) {
          const snap = parsed.snapshot || {};
          return res.end(
            JSON.stringify({
              reply: `Вижу ${(snap.routine || []).length} пунктов режима и ${(snap.tasks || []).length} открытых задач. Вопрос был: ${parsed.messages.at(-1).content}`,
              model: 'stub'
            })
          );
        }
        if (req.url.startsWith('/api/seminar/review'))
          return res.end(
            JSON.stringify({ review: 'Разбор ответов: основное верно, уточните определение.', model: 'stub' })
          );
        res.end(JSON.stringify({ questions: ['Вопрос 1', 'Вопрос 2'], model: 'stub' }));
      });
    });
    server.listen(port, () => resolve(server));
  });
}

/** Простая отдача статики: приложение открывается так же, как с хостинга. */
export function staticServer(dir, port) {
  const MIME = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.map': 'application/json'
  };
  return new Promise(async resolve => {
    const { default: fs } = await import('node:fs');
    const { default: path } = await import('node:path');
    const server = http.createServer((req, res) => {
      let url = decodeURIComponent(req.url.split('?')[0]);
      if (url === '/') url = '/index.html';
      const file = path.join(dir, url);
      if (!file.startsWith(dir) || !fs.existsSync(file)) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(port, () => resolve(server));
  });
}
