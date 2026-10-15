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
ok(
  'в объяснении названа причина',
  (await page.textContent('#whyText')).includes('Мимо прошли') ||
    (await page.textContent('#whyText')).includes('отметка')
);

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
