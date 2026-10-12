/**
 * Сервер Kamron APP.
 *
 * Приложение на GitHub Pages — статика: ключи модели там держать нельзя,
 * а закрытый GitHub и Railway со страницы недоступны. Этот сервис берёт
 * такие вызовы на себя. Ключи живут только здесь, в переменных окружения.
 */
import express from 'express';
import { config, capabilities } from './config.js';
import { requireToken, rateLimit } from './auth.js';
import { jarvis } from './routes/jarvis.js';
import { seminar } from './routes/seminar.js';
import { github } from './routes/github.js';
import { railway } from './routes/railway.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '20mb' }));

/** Запросы идут из браузера с другого домена, поэтому список источников задаётся явно. */
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && config.allowedOrigins.includes(origin)) {
    res.set('access-control-allow-origin', origin);
    res.set('vary', 'Origin');
    res.set('access-control-allow-headers', 'content-type, authorization');
    res.set('access-control-allow-methods', 'GET, POST, OPTIONS');
    res.set('access-control-max-age', '600');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin ? 204 : 403);
  next();
});

/** Проверка доступности — без ключа, чтобы приложение видело статус до настройки. */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, configured: !!config.accessToken, capabilities: capabilities() });
});

app.use('/api', requireToken, rateLimit(30));
app.use('/api/jarvis', jarvis);
app.use('/api/seminar', seminar);
app.use('/api/github', github);
app.use('/api/railway', railway);

app.use((req, res) => res.status(404).json({ error: 'Нет такого метода' }));

// Текст ошибки провайдера наружу не отдаём: в нём бывают детали запроса.
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(`${req.method} ${req.path}:`, err.message, err.detail || '');
  res.status(status).json({ error: err.status ? err.message : 'Внутренняя ошибка сервера' });
});

app.listen(config.port, () => {
  const caps = capabilities();
  console.log(`Kamron APP server: порт ${config.port}`);
  console.log(`  ключ доступа: ${config.accessToken ? 'задан' : 'НЕ ЗАДАН — запросы будут отклоняться'}`);
  console.log(`  модель: ${caps.jarvis ? config.provider : 'не настроена'}`);
  console.log(`  GitHub: ${caps.githubPrivate ? 'с токеном (закрытые репозитории)' : 'только публичные'}`);
  console.log(`  Railway: ${caps.railway ? 'подключён' : 'не настроен'}`);
  console.log(`  разрешённые источники: ${config.allowedOrigins.join(', ') || 'нет — браузер получит отказ'}`);
});
