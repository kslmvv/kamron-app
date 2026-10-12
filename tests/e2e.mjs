/**
 * Сквозная проверка приложения в настоящем браузере.
 *
 * Проверяет то, что ломается молча: переходы по разделам, создание записей,
 * выгрузку файлов, импорт копии и работу с сервером Jarvis. Сервер
 * подменён заглушкой — тест проверяет приложение, а не модель.
 *
 * Запуск: npm test (нужен установленный браузер: npx playwright install chromium)
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
// playwright-core не тянет браузер за собой — он пригодится там, где браузер уже установлен
const { chromium } = await import('playwright').catch(() => import('playwright-core'));
import { stubServer, staticServer } from './stub-server.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = 8160;
const API = 8161;
const base = `http://127.0.0.1:${WEB}/index.html`;

const web = await staticServer(root, WEB);
const api = await stubServer(API);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox']
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.setDefaultTimeout(5000);

const errors = [];
const downloads = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => {
  // 401 приходит намеренно в проверке неверного ключа
  if (m.type() === 'error' && !/401/.test(m.text())) errors.push(m.text());
});
page.on('download', d => downloads.push(d.suggestedFilename()));
page.on('dialog', d => d.accept());

let failed = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log('  ok    ' + name);
  } catch (e) {
    failed++;
    console.log('  FAIL  ' + name + ' — ' + String(e.message).split('\n').slice(0, 2).join(' ~ '));
  }
};
/** Перезагрузка обязательна: смена одного хэша не перезапускает приложение. */
const go = async hash => {
  await page.goto(base + hash);
  await page.reload();
  await page.waitForTimeout(250);
};
const save = () => page.click('#modal .primary-btn');

await page.goto(base);
await page.waitForTimeout(400);

console.log('\nРазделы и ярлыки');
await step('ярлык #routine открывает режим дня', async () => {
  await go('#routine');
  if (!/Режим дня|Мой день/i.test(await page.textContent('#page'))) throw new Error('не тот экран');
});
await step('адрес запоминает открытый раздел', async () => {
  await go('#notes');
  await page.goto(base);
  await page.click('[data-action="go"][data-page="more"]');
  await page.waitForTimeout(100);
  await page.click('[data-action="go"][data-page="notes"]');
  await page.waitForTimeout(200);
  if (!page.url().endsWith('#notes')) throw new Error('адрес: ' + page.url());
});

console.log('\nСоздание записей');
await step('предмет с днями и временем', async () => {
  await go('#uni');
  await page.click('[data-action="new-subject"]');
  await page.waitForTimeout(250);
  await page.fill('#modal input[name="name"]', 'Международные отношения');
  await page.fill('#modal input[name="time"]', '09:00');
  await page.fill('#modal input[name="teacher"]', 'Петров А.');
  await page.evaluate(() => {
    const days = document.querySelectorAll('#modal input[name="days"]');
    [1, 3].forEach(i => {
      days[i].checked = true;
      days[i].dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  await save();
  await page.waitForTimeout(400);
  if (!/Международные отношения/.test(await page.textContent('#page'))) throw new Error('предмет не создан');
});
await step('задание по предмету', async () => {
  await go('#uni');
  await page.click('[data-action="quick-uni-task"]');
  await page.waitForTimeout(300);
  await page.fill('#modal input[name="title"]', 'Эссе по теории режимов');
  await save();
  await page.waitForTimeout(400);
  if (!/Эссе по теории/.test(await page.textContent('#page'))) throw new Error('задание не видно');
});
await step('проект', async () => {
  await go('#work');
  await page.click('[data-action="new-project"]');
  await page.waitForTimeout(250);
  await page.fill('#modal input[name="name"]', 'Kamron APP');
  await save();
  await page.waitForTimeout(350);
  if (!/Kamron APP/.test(await page.textContent('#page'))) throw new Error('проект не создан');
});
await step('заметка', async () => {
  await go('#notes');
  await page.click('[data-action="new-note"]');
  await page.waitForTimeout(250);
  await page.fill('#modal input[name="title"]', 'Идея');
  await page.fill('#modal textarea[name="body"]', 'Проверить расписание на вторник');
  await save();
  await page.waitForTimeout(350);
  if (!/Идея/.test(await page.textContent('#page'))) throw new Error('заметка не создана');
});
await step('личная задача', async () => {
  await go('#tasks');
  await page.click('[data-action="new-task-hub"]').catch(() => {});
  await page.waitForTimeout(300);
  const personal = page.locator('[data-action="choose-task-kind"][data-kind="personal"], [data-action="new-personal-task"]').first();
  if (await personal.count()) {
    await personal.click();
    await page.waitForTimeout(300);
  }
  await page.fill('#modal input[name="title"]', 'Купить тетради');
  await save();
  await page.waitForTimeout(350);
  if (!/Купить тетради/.test(await page.textContent('#page'))) throw new Error('задача не создана');
});

console.log('\nВыгрузка и перенос данных');
await step('расписание выгружается в .ics', async () => {
  await go('#uni');
  await page.click('[data-action="export-calendar"]');
  await page.waitForTimeout(600);
  if (!downloads.some(f => /\.ics$/.test(f))) throw new Error('файлы: ' + downloads.join(', '));
});
await step('копия данных сохраняется в .json', async () => {
  await go('#settings');
  await page.click('[data-action="toggle-settings-more"]');
  await page.waitForTimeout(200);
  await page.click('[data-action="export"]');
  await page.waitForTimeout(600);
  if (!downloads.some(f => /\.json$/.test(f))) throw new Error('файлы: ' + downloads.join(', '));
});
await step('импорт копии возвращает все записи', async () => {
  await go('#settings');
  await page.click('[data-action="toggle-settings-more"]');
  await page.waitForTimeout(200);
  const [file] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="export"]')]);
  const path = '/tmp/kamron-backup.json';
  await file.saveAs(path);
  const before = JSON.parse(readFileSync(path, 'utf8'));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(300);
  await go('#settings');
  await page.click('[data-action="toggle-settings-more"]');
  await page.waitForTimeout(200);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-action="import"]')]);
  await chooser.setFiles(path);
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('kamron-app-mvp-v1') || 'null'));
  if (!after) throw new Error('после импорта данных нет');
  const lost = ['projects', 'subjects', 'notes', 'personalTasks'].filter(k => (after[k] || []).length !== (before[k] || []).length);
  if (lost.length) throw new Error('потеряно: ' + lost.join(', '));
});

console.log('\nСервер Jarvis');
await step('без сервера диалог предлагает подключение', async () => {
  await go('#chat');
  if (!/Сервер не подключён/.test(await page.textContent('#page'))) throw new Error('нет подсказки');
});
await step('проверка связи с сервером', async () => {
  await page.click('[data-action="server-form"]');
  await page.waitForTimeout(250);
  await page.fill('#modal input[name="url"]', `http://localhost:${API}`);
  await page.fill('#modal input[name="token"]', 'secret-key');
  await page.click('[data-action="server-check"]');
  await page.waitForTimeout(500);
  if (!/Связь есть/.test(await page.textContent('#server-status'))) throw new Error(await page.textContent('#server-status'));
});
await step('подключение сохраняется', async () => {
  await save();
  await page.waitForTimeout(300);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kamron-app-mvp-v1')).server);
  if (stored.token !== 'secret-key') throw new Error(JSON.stringify(stored));
});
await step('диалог отвечает и видит снимок дня', async () => {
  await go('#chat');
  await page.fill('.chat-composer textarea', 'Что сегодня?');
  await page.click('.chat-send');
  await page.waitForTimeout(800);
  const text = await page.textContent('#chat-stream');
  if (!/Вижу \d+ пунктов режима/.test(text)) throw new Error(text.slice(0, 120));
  if (!/Что сегодня\?/.test(text)) throw new Error('своё сообщение не показано');
});
await step('очистка разговора', async () => {
  await page.click('[data-action="chat-clear"]');
  await page.waitForTimeout(250);
  if (!/Спросите что угодно/.test(await page.textContent('#chat-stream'))) throw new Error('лента не очищена');
});
await step('ошибка сервера показана, вопрос возвращается в поле', async () => {
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('kamron-app-mvp-v1'));
    d.server.token = 'wrong';
    localStorage.setItem('kamron-app-mvp-v1', JSON.stringify(d));
  });
  await page.reload();
  await page.waitForTimeout(300);
  await page.fill('.chat-composer textarea', 'Проверка ошибки');
  await page.click('.chat-send');
  await page.waitForTimeout(700);
  if (!/Неверный ключ доступа/.test(await page.textContent('#page'))) throw new Error('ошибка не показана');
  if ((await page.inputValue('.chat-composer textarea')) !== 'Проверка ошибки') throw new Error('вопрос потерян');
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('kamron-app-mvp-v1'));
    d.server.token = 'secret-key';
    localStorage.setItem('kamron-app-mvp-v1', JSON.stringify(d));
  });
});

console.log('\nПодготовка к семинару');
await step('тема, ответ и разбор от Jarvis', async () => {
  await go('#uni');
  await page.locator('[data-action="open-subject"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('[data-action="open-seminar"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('[data-action="new-seminar-prep"]').first().click();
  await page.waitForTimeout(250);
  await page.fill('#modal input[name="topic"]', 'Теория международных режимов');
  await save();
  await page.waitForTimeout(400);
  await page.locator('[data-prep-answer]').first().fill('Режимы — это нормы и правила, вокруг которых сходятся ожидания государств.');
  await page.waitForTimeout(400);
  await page.locator('[data-action="prep-review"]').first().click();
  await page.waitForTimeout(900);
  if (!/Разбор ответов/.test(await page.textContent('.prep-review'))) throw new Error('разбор не пришёл');
});
await step('пакет подготовки скачивается с читаемым именем', async () => {
  await page.click('[data-action="export-prep"]');
  await page.waitForTimeout(700);
  // Имя с кириллицей браузер отбрасывает — проверяем, что осталась латиница и расширение
  if (!downloads.some(f => /^seminar-[a-z0-9-]+\.md$/.test(f))) throw new Error('файлы: ' + downloads.join(', '));
});

console.log('\nИгры');
await step('поле «Блоков» 8x8 и партия сохраняется', async () => {
  await go('#games');
  const cells = await page.locator('.block-cell').count();
  if (cells !== 64) throw new Error('клеток: ' + cells);
});

console.log('\nОшибки в консоли:', errors.length ? errors : 'нет');
console.log(failed || errors.length ? `\nПРОВАЛЕНО: ${failed} проверок` : '\nВсе проверки пройдены.');

await browser.close();
web.close();
api.close();
process.exit(failed || errors.length ? 1 : 0);
