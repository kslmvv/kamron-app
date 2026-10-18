/**
 * Сквозная проверка Kamron APP в настоящем браузере.
 *
 * Время подменяется: только так можно проверить главное правило приложения —
 * дело отмечается, пока идёт, и закрывается навсегда, когда прошло. Берём
 * четверг 15 октября 2026, 18:00 по Ташкенту: часть дня уже упущена, одно
 * дело идёт, вечерние ещё впереди.
 *
 * Запуск: npm test (нужен браузер: npx playwright install chromium)
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const { chromium } = await import('playwright').catch(() => import('playwright-core'));
import { createServer } from 'node:http';
import { staticServer } from './stub-server.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8170;
const base = `http://127.0.0.1:${PORT}/index.html`;

const web = await staticServer(root, PORT);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox']
});

const fails = [];
const errors = [];
let passed = 0;
const ok = (name, condition) => {
  if (condition) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    fails.push(name);
    console.log('  ✗ ' + name);
  }
};
const part = name => console.log('\n' + name);

/** Замораживает часы страницы на заданном моменте. */
function freeze(iso) {
  return `(() => {
    const F = new Date('${iso}').getTime();
    const R = Date;
    class FD extends R { constructor(...a) { a.length ? super(...a) : super(F); } static now() { return F; } }
    window.Date = FD;
  })()`;
}

const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  timezoneId: 'Asia/Tashkent'
});
await context.addInitScript(freeze('2026-10-15T13:00:00Z')); // 18:00 Ташкент
const page = await context.newPage();
page.setDefaultTimeout(5000);
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
page.on('console', m => {
  if (m.type() === 'error' && !/favicon|fonts\.googleapis|TUNNEL/.test(m.text()))
    errors.push('CONSOLE ' + m.text());
});

await page.goto(base);
await page.waitForTimeout(700);

part('Экран дня');
ok('шапка показывает сегодняшнюю дату', (await page.textContent('#dayLabel')).includes('15 окт'));
const counts = await page.evaluate(() => ({
  rows: document.querySelectorAll('#list .row').length,
  missed: document.querySelectorAll('#list .row.missed').length,
  early: document.querySelectorAll('#list .row.early').length,
  live: document.querySelectorAll('#list .row.live').length,
  auto: document.querySelectorAll('#list .mark.auto').length,
  tap: document.querySelectorAll('#list .row.tap').length
}));
ok('план дня собран', counts.rows > 10);
ok('прошедшие без отметки помечены упущенными', counts.missed >= 3);
ok('будущие дела заблокированы', counts.early >= 2);
ok('ровно одно дело идёт сейчас', counts.live === 1);
ok('у дороги и окон пассивная метка', counts.auto >= 3);
ok('нажимаются только дела', counts.tap === counts.rows - counts.auto);
ok(
  'питомец недоволен потерями',
  ['worry', 'cross', 'angry', 'furious'].includes(await page.getAttribute('#pet', 'data-mood'))
);
ok('есть объяснение «почему»', await page.isVisible('#why'));
await page.click('#why');
await page.waitForTimeout(400);
ok('объяснение раскрывается', await page.isVisible('#whyText'));
ok('в объяснении названа причина', /Мимо:|Сейчас:|отмет/.test(await page.textContent('#whyText')));
ok('объяснение короткое', (await page.textContent('#whyText')).length < 160);

part('Питомец');
const pet = await page.evaluate(() => {
  const body = document.querySelector('.pet .body');
  const blob = document.querySelector('.pet .blob');
  const face = document.querySelector('.pet .face');
  return {
    faceInBody: !!(body && face && body.contains(face)),
    crestInBody: !!(body && body.contains(document.getElementById('crest'))),
    bodyAnim: body ? getComputedStyle(body).animationName : '',
    blobAnim: blob ? getComputedStyle(blob).animationName : ''
  };
});
ok('лицо находится внутри тела', pet.faceInBody);
ok('знак уровня движется с телом', pet.crestInBody);
ok('тело анимируется целиком', /breathe|boil|hop|rush|sink/.test(pet.bodyAnim));
ok('у тела нет поворота — его крутит только фигура', /turn/.test(pet.blobAnim) && !/turn/.test(pet.bodyAnim));

part('Честное время');
await page.evaluate(() => document.querySelector('#list .row.missed').click());
await page.waitForTimeout(300);
ok(
  'упущенное нельзя отметить',
  await page.evaluate(() => !document.querySelector('#list .row.missed').classList.contains('on'))
);
ok('отказ объяснён', await page.isVisible('.toast'));
await page.waitForTimeout(2800);
await page.evaluate(() => document.querySelector('#list .row.early').click());
await page.waitForTimeout(300);
ok(
  'будущее нельзя отметить заранее',
  await page.evaluate(() => !document.querySelector('#list .row.early').classList.contains('on'))
);
await page.waitForTimeout(2800);

part('Отметка и прогресс');
const pctBefore = Number(await page.textContent('#pct'));
await page.evaluate(() => document.querySelector('#list .row.live').click());
await page.waitForTimeout(900);
ok(
  'текущее дело отмечается нажатием на всю строку',
  await page.evaluate(() => document.querySelector('#list .row.live').classList.contains('on'))
);
ok('процент вырос', Number(await page.textContent('#pct')) > pctBefore);
ok('питомец радуется отметке', (await page.getAttribute('#pet', 'data-mood')) === 'cheer');
ok(
  'три привычки на главном экране',
  (await page.evaluate(() => document.querySelectorAll('#habTop .hab').length)) === 3
);
await page.evaluate(() => document.querySelector('#habTop .plus').click());
await page.waitForTimeout(400);
ok(
  'привычка считается по нажатию',
  await page.evaluate(() => /1\//.test(document.querySelector('#habTop .hab b').textContent))
);

part('Фокус-режим');
await page.waitForTimeout(2400);
await page.evaluate(() => document.querySelector('#list .row.live').click()); // снять отметку
await page.waitForTimeout(500);
ok(
  'кнопка фокуса появляется для текущего дела',
  await page.evaluate(() => !document.getElementById('focusBtn').hidden)
);
await page.click('#focusBtn');
await page.waitForTimeout(600);
ok('фокус открылся', await page.isVisible('#focusLayer'));
ok('таймер идёт', /\d+:\d\d/.test(await page.textContent('#fTime')));
ok('питомец переехал в фокус', await page.evaluate(() => !!document.querySelector('#petSlot #pet')));
ok(
  'нижнее меню спрятано',
  await page.evaluate(() => getComputedStyle(document.querySelector('nav')).display === 'none')
);
await page.click('#fDone');
await page.waitForTimeout(700);
ok(
  'после фокуса дело закрыто',
  await page.evaluate(() => document.querySelector('#list .row.live').classList.contains('on'))
);
ok('питомец вернулся на место', await page.evaluate(() => !!document.querySelector('#viewToday > #pet')));
ok(
  'время фокуса записано',
  await page.evaluate(
    () => Object.keys(JSON.parse(localStorage.getItem('den-kamrona-v3')).focus).length === 1
  )
);

part('Задачи');
await page.click('#addTask');
await page.waitForTimeout(450);
await page.fill('#nTitle', 'Презентация');
await page.evaluate(() =>
  [...document.querySelectorAll('.pick')].find(x => x.textContent === 'завтра').click()
);
await page.fill('#nTime', '20:00');
await page.click('#nSave');
await page.waitForTimeout(700);
ok('после добавления открыт нужный день', (await page.textContent('#dayLabel')).includes('16 окт'));
ok(
  'задача встала в план',
  await page.evaluate(() =>
    [...document.querySelectorAll('#list .meat b')].some(b => b.textContent.includes('Презентация'))
  )
);
ok(
  'задача будущего дня заблокирована',
  await page.evaluate(() =>
    [...document.querySelectorAll('#list .row')]
      .find(r => r.textContent.includes('Презентация'))
      .classList.contains('early')
  )
);
await page.click('#navToday');
await page.waitForTimeout(500);

part('Календарь и выводы');
await page.click('#navSetup');
await page.waitForTimeout(350);
await page.click('[data-go="calfull"]');
await page.waitForTimeout(700);
ok('календарь открывается из настроек', await page.isVisible('#calGrid'));
ok(
  'у каждого дня есть кольцо',
  (await page.evaluate(() => document.querySelectorAll('.cal-cell .ring').length)) === 42
);
ok(
  'выводы по данным отрисованы',
  (await page.evaluate(() => document.querySelectorAll('#insights .insight').length)) >= 1
);
await page.click('#calPrev');
await page.waitForTimeout(400);
ok('месяц листается назад', (await page.textContent('#calTitle')).includes('сентябрь'));
await page.click('#calNext');
await page.waitForTimeout(400);

part('Расписание');
await page.click('#calBack');
await page.waitForTimeout(400);
await page.click('[data-go="sched"]');
await page.waitForTimeout(500);
const pairs = await page.evaluate(() => document.querySelectorAll('#pairs .card').length);
await page.click('#addPair');
await page.waitForTimeout(400);
ok(
  'пара добавляется',
  (await page.evaluate(() => document.querySelectorAll('#pairs .card').length)) === pairs + 1
);
await page.evaluate(() => {
  const inputs = document.querySelectorAll('#pairs .card .n');
  const last = inputs[inputs.length - 1];
  last.value = 'Тестовая пара';
  last.dispatchEvent(new Event('change'));
});
await page.waitForTimeout(300);
await page.click('#navToday');
await page.waitForTimeout(600);
ok(
  'изменённое расписание попадает в план дня',
  await page.evaluate(() =>
    [...document.querySelectorAll('#list .meat b')].some(b => b.textContent.includes('Тестовая пара'))
  )
);
ok(
  'отметки переживают правку расписания',
  (await page.evaluate(() => document.querySelectorAll('#list .row.on').length)) >= 1
);

part('Напоминания');
await page.click('#navSetup');
await page.waitForTimeout(300);
await page.click('[data-go="notif"]');
await page.waitForTimeout(400);
ok('экран напоминаний открывается', await page.isVisible('#nOn'));
await page.evaluate(() => document.getElementById('nOn').click());
await page.waitForTimeout(300);
ok(
  'переключатель сохраняется',
  await page.evaluate(() => JSON.parse(localStorage.getItem('den-kamrona-v3')).notif.on === true)
);
await page.click('#nTest');
await page.waitForTimeout(400);
ok('без разрешения показан запасной способ', await page.isVisible('.toast'));
await page.waitForTimeout(2800);

part('Чат');
await page.click('#navChat');
await page.waitForTimeout(400);
await page.click('.chip');
await page.waitForTimeout(900);
ok(
  'помощник отвечает',
  (await page.evaluate(() => document.querySelectorAll('#thread .msg.ai').length)) === 1
);
await page.evaluate(() => {
  document.getElementById('chatInput').value = 'что осталось?';
  document.getElementById('chatSend').click();
});
await page.waitForTimeout(900);
await page.click('#toHist');
await page.waitForTimeout(500);
ok(
  'история хранит оба разговора',
  (await page.evaluate(() => document.querySelectorAll('#histBody .hist').length)) === 2
);
await page.evaluate(() => document.querySelector('.hist .p').click());
await page.waitForTimeout(400);
ok(
  'закрепление работает',
  await page.evaluate(() => JSON.parse(localStorage.getItem('den-kamrona-v3')).chat.some(c => c.pin))
);
await page.evaluate(() =>
  [...document.querySelectorAll('.pick')].find(x => x.textContent === 'Архив').click()
);
await page.waitForTimeout(300);
ok('архив пуст', await page.evaluate(() => !!document.querySelector('#histBody .empty')));
await page.evaluate(() => [...document.querySelectorAll('.pick')].find(x => x.textContent === 'Все').click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('.hist .x').click());
await page.waitForTimeout(300);
ok(
  'удаление убирает одну запись',
  (await page.evaluate(() => document.querySelectorAll('#histBody .hist').length)) === 1
);

part('Сохранение и PWA');
await page.reload();
await page.waitForTimeout(900);
ok(
  'состояние переживает перезагрузку',
  (await page.evaluate(() => document.querySelectorAll('#list .row.on').length)) >= 1
);
ok('адрес помнит вкладку', (await page.evaluate(() => location.hash)) === '#chat');
ok(
  'service worker зарегистрирован',
  await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length > 0))
);
const manifest = await page.evaluate(async () => {
  const r = await fetch('./manifest.webmanifest');
  return r.ok ? (await r.json()).name : null;
});
ok('манифест отдаётся', manifest === 'Kamron APP — мой день');
await page.goto(base + '#cal');
await page.waitForTimeout(700);
ok('ярлык открывает нужный раздел', await page.isVisible('#calGrid'));

part('Вечер');
const night = await context.newPage();
night.on('pageerror', e => errors.push('PAGEERROR(вечер) ' + e.message));
await night.addInitScript(freeze('2026-10-15T17:00:00Z')); // 22:00 Ташкент
await night.goto(base);
await night.waitForTimeout(800);
ok('вечером предлагается разбор дня', await night.evaluate(() => !document.getElementById('revCall').hidden));
await night.click('#revCall');
await night.waitForTimeout(600);
ok(
  'разбор перечисляет упущенное',
  (await night.evaluate(() => document.querySelectorAll('.rev').length)) > 0
);
await night.evaluate(() => document.querySelector('.rev .why3 button').click());
await night.waitForTimeout(300);
ok(
  'причина сохраняется',
  await night.evaluate(() => {
    const r = JSON.parse(localStorage.getItem('den-kamrona-v3')).review;
    return Object.values(r).some(d => Object.values(d).includes('late'));
  })
);
await night.click('#revDone');
await night.waitForTimeout(600);
ok(
  'закрытый разбор больше не навязывается',
  await night.evaluate(() => document.getElementById('revCall').hidden)
);

part('Новый пользователь');
const fresh = await browser.newContext({
  viewport: { width: 393, height: 852 },
  timezoneId: 'Asia/Tashkent'
});
await fresh.addInitScript(freeze('2026-10-18T04:00:00Z')); // воскресенье, 09:00 — пар нет
const clean = await fresh.newPage();
clean.on('pageerror', e => errors.push('PAGEERROR(новый) ' + e.message));
await clean.goto(base);
await clean.waitForTimeout(800);
ok(
  'выходной собирается без ошибок',
  (await clean.evaluate(() => document.querySelectorAll('#list .row').length)) >= 2
);
ok(
  'на пустых данных выводы не падают',
  await clean.evaluate(() => {
    document.getElementById('navSetup').click();
    return true;
  })
);
await clean.waitForTimeout(300);
await clean.click('[data-go="calfull"]');
await clean.waitForTimeout(600);
ok(
  'календарь работает без истории',
  (await clean.evaluate(() => document.querySelectorAll('#insights .insight').length)) >= 1
);
ok('средний процент не выдумывается', (await clean.textContent('#stAvg')) === '—');

part('Эмодзи по смыслу задачи');
// Словарь живёт внутри замыкания, поэтому проверяем через интерфейс:
// кладём задачу и смотрим, какой значок встал в плане дня.
const cases = [
  ['Посмотреть кино', '🎬'],
  ['Сходить в зал', '🏋️'],
  ['Купить продукты', '🛒'],
  ['Сделать уроки', '📚'],
  ['Позвонить маме', '📞'],
  ['Записаться к врачу', '🩺'],
  ['Полить цветы', '📌']
];
for (const [title, want] of cases) {
  await page.evaluate(t => {
    const s = JSON.parse(localStorage.getItem('den-kamrona-v3'));
    s.tasks = [{ id: 'probe', title: t, date: '2026-10-15', time: '', done: false }];
    localStorage.setItem('den-kamrona-v3', JSON.stringify(s));
  }, title);
  await page.reload();
  await page.waitForTimeout(400);
  const got = await page.evaluate(() => {
    const row = [...document.querySelectorAll('#list .row')].find(r => r.textContent.includes('без времени'));
    return row ? row.querySelector('.tile').textContent.trim() : '';
  });
  ok(`«${title}» → ${want}`, got === want);
}
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  s.tasks = [];
  localStorage.setItem('den-kamrona-v3', JSON.stringify(s));
});
await page.reload();
await page.waitForTimeout(300);

part('Чем занят питомец');

/* Имя занятия приложение всё равно считает: его забирает виджет. */
const scene = await page.evaluate(() => ({
  now: document.getElementById('pet').dataset.scene,
  actor: getComputedStyle(document.getElementById('actor')).opacity
}));
ok('у питомца есть занятие', typeof scene.now === 'string' && scene.now.length > 0);

/* Главное после отката: на экране живой питомец, а не рисунок вместо него. */
ok('питомец на виду', Number(scene.actor) === 1);
ok(
  'слой сцены убран со страницы',
  (await page.evaluate(() => !document.getElementById('scene') && !window.KAMRON_SCENES)) === true
);

/* После отбоя он спит, даже если в плане что-то стоит. */
const lateCtx = await browser.newContext({
  viewport: { width: 393, height: 852 },
  timezoneId: 'Asia/Tashkent'
});
await lateCtx.addInitScript(freeze('2026-10-15T19:30:00Z')); // 00:30 Ташкент
const afterHours = await lateCtx.newPage();
await afterHours.goto(base);
await afterHours.waitForTimeout(700);
ok(
  'после отбоя питомец спит',
  (await afterHours.evaluate(() => document.getElementById('pet').dataset.scene)) === 'sleep'
);
await lateCtx.close();

part('Связь с Jarvis');
// Поддельный сервер приложения: проверяем, что снимок уходит, а надиктованное
// боту приходит обратно и применяется.
const got = { snapshots: [], acked: [], widget: [] };
let queue = [
  { id: 'c1', kind: 'task', data: { title: 'Позвонить в деканат', date: '2026-10-15', time: '' } },
  { id: 'c2', kind: 'note', data: { body: 'Завтра занять очередь с утра' } }
];
const fake = createServer((req, res) => {
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization',
    'content-type': 'application/json'
  };
  if (req.method === 'OPTIONS') return res.writeHead(204, cors).end();
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    if (req.url === '/api/health')
      return res.writeHead(200, cors).end(JSON.stringify({ ok: true, снимокМинутНазад: 3 }));
    if (req.url === '/api/snapshot' && req.method === 'POST') {
      got.snapshots.push(JSON.parse(body || '{}'));
      return res.writeHead(200, cors).end('{"ok":true}');
    }
    if (req.url === '/api/widget' && req.method === 'POST') {
      got.widget.push(JSON.parse(body || '{}'));
      return res.writeHead(200, cors).end('{"ok":true}');
    }
    // Копий у этого стенда нет, но отвечать 404 нельзя: браузер пишет
    // это в консоль как ошибку, а приложение тут ни при чём.
    if (req.url === '/api/backup') return res.writeHead(200, cors).end('{"savedAt":null}');
    if (req.url === '/api/changes' && req.method === 'GET') {
      return res.writeHead(200, cors).end(JSON.stringify({ изменения: queue }));
    }
    if (req.url === '/api/changes/ack') {
      got.acked.push(...(JSON.parse(body || '{}').ids || []));
      queue = [];
      return res.writeHead(200, cors).end('{"ok":true}');
    }
    res.writeHead(404, cors).end('{}');
  });
});
await new Promise(resolve => fake.listen(8194, '127.0.0.1', resolve));

await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  s.link = { url: 'http://127.0.0.1:8194', token: 'test' };
  localStorage.setItem('den-kamrona-v3', JSON.stringify(s));
});
await page.goto(base + '#today');
await page.reload(); // hash-переход не перезагружает страницу сам
await page.waitForTimeout(1500);
ok('снимок дня ушёл на сервер', got.snapshots.length >= 1);
if (got.snapshots.length) {
  const snap = got.snapshots[got.snapshots.length - 1];
  ok('в снимке есть план дня', Array.isArray(snap.routine) && snap.routine.length > 5);
  ok(
    'в снимке отмечено упущенное',
    snap.routine.some(x => x.includes('упущено'))
  );
  ok('в снимке есть привычки', Array.isArray(snap.habits) && snap.habits.length === 3);
  ok('в снимке есть завтрашний план', Array.isArray(snap.routineTomorrow));
}
ok('надиктованное применено и подтверждено', got.acked.length === 2);
ok('день для виджета ушёл на сервер', got.widget.length >= 1);
if (got.widget.length) {
  const wd = got.widget[got.widget.length - 1];
  ok(
    'в дне для виджета есть блоки и настроение',
    Array.isArray(wd.blocks) && wd.blocks.length > 0 && typeof wd.mood === 'string'
  );
}
ok(
  'задача от бота появилась в плане',
  await page.evaluate(() =>
    [...document.querySelectorAll('#list .meat b')].some(b => b.textContent.includes('деканат'))
  )
);
ok(
  'заметка от бота показана',
  await page.evaluate(
    () =>
      !document.getElementById('noteBox').hidden &&
      document.getElementById('noteList').textContent.includes('очередь')
  )
);
await page.evaluate(() => {
  // Иначе страница продолжит стучаться в закрытый сервер по таймеру,
  // и в консоли появится ошибка сети, которой приложение не виновато.
  const s = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  delete s.link;
  localStorage.setItem('den-kamrona-v3', JSON.stringify(s));
});
await page.goto('about:blank');
await page.waitForTimeout(300);
fake.close();

part('Первый запуск в сборке из Xcode');

/* У сборки своё хранилище: оно пустое, и данные из Safari туда не
   переезжают. Оболочка передаёт ключ, страница возвращает копию сама. */
const shellSaved = {
  tasks: [{ id: 't9', title: 'Забрать посылку', date: '2026-10-15', time: '', done: false }],
  notes: [{ id: 'n9', ts: 1, body: 'Копия из облака' }],
  done: {},
  habits: []
};
const shellServer = createServer((req, res) => {
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization',
    'content-type': 'application/json'
  };
  if (req.method === 'OPTIONS') return res.writeHead(204, cors).end();
  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    if (req.url === '/api/backup' && req.method === 'GET')
      return res
        .writeHead(200, cors)
        .end(JSON.stringify({ savedAt: '2026-10-15T10:00:00.000Z', state: shellSaved }));
    if (req.url === '/api/changes') return res.writeHead(200, cors).end('{"изменения":[]}');
    res.writeHead(200, cors).end('{"ok":true}');
  });
});
await new Promise(resolve => shellServer.listen(8196, '127.0.0.1', resolve));

const shellCtx = await browser.newContext({
  locale: 'ru-RU',
  timezoneId: 'Asia/Tashkent',
  viewport: { width: 390, height: 844 }
});
await shellCtx.addInitScript(freeze('2026-10-15T13:00:00Z'));
const shell = await shellCtx.newPage();
await shell.goto(base, { waitUntil: 'networkidle' });

const restored = await shell.evaluate(async () => {
  const first = window.kamronLink('http://127.0.0.1:8196', 'test');
  await new Promise(r => setTimeout(r, 900));
  const s = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  // Повторный вызов на уже настроенной связи ничего не делает.
  const second = window.kamronLink('http://example.invalid', 'другой');
  const after = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  return {
    first,
    second,
    tasks: (s.tasks || []).length,
    notes: (s.notes || []).length,
    url: after.link && after.link.url
  };
});
ok('оболочка передала ключ странице', restored.first === true);
ok('данные вернулись из копии сами', restored.tasks === 1 && restored.notes === 1);
ok('повторная передача ключа игнорируется', restored.second === false);
ok('чужой адрес не перезаписал связь', restored.url === 'http://127.0.0.1:8196');
await shell.close();
shellServer.close();

part('Резервная копия');
// Сервер копий подделываем тем же сервером связи.
let saved = null;
const backup = createServer((req, res) => {
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization',
    'content-type': 'application/json'
  };
  if (req.method === 'OPTIONS') return res.writeHead(204, cors).end();
  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    if (req.url === '/api/backup' && req.method === 'POST') {
      saved = JSON.parse(body || '{}');
      return res.writeHead(200, cors).end('{"ok":true,"savedAt":"2026-10-15T10:00:00.000Z"}');
    }
    if (req.url === '/api/backup') {
      return saved
        ? res.writeHead(200, cors).end(JSON.stringify({ savedAt: '2026-10-15T10:00:00.000Z', state: saved }))
        : res.writeHead(404, cors).end('{}');
    }
    if (req.url === '/api/backups') {
      return res
        .writeHead(200, cors)
        .end(JSON.stringify({ копии: saved ? [{ savedAt: '2026-10-15T10:00:00.000Z', дней: 3 }] : [] }));
    }
    if (req.url === '/api/snapshot' && req.method === 'POST')
      return res.writeHead(200, cors).end('{"ok":true}');
    if (req.url === '/api/widget' && req.method === 'POST')
      return res.writeHead(200, cors).end('{"ok":true}');
    if (req.url === '/api/changes') return res.writeHead(200, cors).end('{"изменения":[]}');
    res.writeHead(404, cors).end('{}');
  });
});
await new Promise(r => backup.listen(8195, '127.0.0.1', r));

const copyPage = await context.newPage();
await copyPage.goto(base);
await copyPage.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  s.link = { url: 'http://127.0.0.1:8195', token: 'test' };
  s.tasks = [{ id: 'keep', title: 'Не потерять', date: '2026-10-15', time: '', done: false }];
  s.notes = [{ id: 'n1', ts: Date.now(), body: 'Важная мысль' }];
  localStorage.setItem('den-kamrona-v3', JSON.stringify(s));
});
await copyPage.reload();
await copyPage.waitForTimeout(1400);
ok('копия ушла на сервер', !!saved && Array.isArray(saved.tasks));
ok('в копии есть задачи и заметки', !!saved && saved.tasks.length === 1 && saved.notes.length === 1);

// Чистим «Safari»: остаётся только ключ связи, как после ссылки восстановления.
await copyPage.evaluate(() => localStorage.clear());
await copyPage.goto(base + '#k=test&s=' + encodeURIComponent('http://127.0.0.1:8195'));
await copyPage.reload();
await copyPage.waitForTimeout(1600);
const back = await copyPage.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('den-kamrona-v3') || '{}');
  return {
    tasks: (s.tasks || []).length,
    notes: (s.notes || []).length,
    token: s.link && s.link.token,
    hash: location.hash
  };
});
ok('ссылка с ключом настроила связь', back.token === 'test');
ok('ключ убран из адреса', !back.hash.includes('k='));
ok('задачи вернулись из копии', back.tasks === 1);
ok('заметки вернулись из копии', back.notes === 1);
await copyPage.close();
backup.close();

part('Мост в приложение на айфоне');

/* Нативной обёртки в браузере нет, поэтому подделываем её приёмник: он
   просто копит то, что страница пытается отправить виджету. */
const widget = await browser.newContext({
  locale: 'ru-RU',
  timezoneId: 'Asia/Tashkent',
  viewport: { width: 390, height: 844 }
});
await widget.addInitScript(freeze('2026-10-15T13:00:00Z')); // 18:00 Ташкент
await widget.addInitScript(() => {
  window.__sent = [];
  window.webkit = {
    messageHandlers: {
      kamron: { postMessage: m => window.__sent.push(m) }
    }
  };
});
const wp = await widget.newPage();
await wp.goto(base, { waitUntil: 'networkidle' });
await wp.waitForTimeout(400);

const sent = await wp.evaluate(() => window.__sent);
const day = sent.length ? sent[sent.length - 1].day : null;
ok('снимок дня ушёл виджету', !!day && sent[0].kind === 'day');
ok(
  'в снимке есть блоки со временем',
  !!day && day.blocks.length > 0 && day.blocks.every(b => typeof b.from === 'number')
);
ok('у блоков есть эмодзи', !!day && day.blocks.some(b => b.icon));
ok(
  'настроение из короткого списка',
  !!day && ['calm', 'focus', 'happy', 'worry', 'angry', 'sleep'].includes(day.mood)
);

/* Отметка из виджета, сделанная вовремя, засчитывается. */
const honest = await wp.evaluate(() => {
  const block = window.__sent[window.__sent.length - 1].day.blocks.find(
    b => b.id.indexOf('work') === 0 || b.id.indexOf('lesson') === 0
  );
  const day = window.__sent[window.__sent.length - 1].day;
  const at = new Date();
  at.setHours(Math.floor((block.from + block.to) / 2 / 60), 0, 0, 0);
  window.kamronApply([{ id: block.id, dateKey: day.dateKey, at: at.getTime() / 1000 }]);
  const saved = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  return { id: block.id, done: (saved.done[day.dateKey] || []).includes(block.id) };
});
ok('отметка из виджета вовремя засчитана', honest.done);

/* А сделанная после того, как дело прошло, — нет: иначе через виджет
   можно было бы обойти честную блокировку времени. */
const late = await wp.evaluate(() => {
  const day = window.__sent[window.__sent.length - 1].day;
  const block = day.blocks.find(
    b => b.status === 'missed' || b.to + 15 < new Date().getHours() * 60 + new Date().getMinutes()
  );
  if (!block) return { skipped: true };
  window.kamronApply([{ id: block.id, dateKey: day.dateKey, at: Date.now() / 1000 }]);
  const saved = JSON.parse(localStorage.getItem('den-kamrona-v3'));
  return { done: (saved.done[day.dateKey] || []).includes(block.id) };
});
ok('опоздавшая отметка не засчитана', late.skipped || !late.done);
await wp.close();

console.log('\n' + '─'.repeat(46));
if (errors.length) {
  console.log('Ошибки в консоли:');
  errors.forEach(e => console.log('  ' + e));
}
console.log(`Проверок пройдено: ${passed}, провалено: ${fails.length}`);
if (fails.length) fails.forEach(f => console.log('  ✗ ' + f));

await browser.close();
web.close();
process.exit(fails.length || errors.length ? 1 : 0);
