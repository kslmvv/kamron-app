/*
  Kamron APP — дневной режим.
  Один классический скрипт: страница должна открываться и с GitHub Pages,
  и напрямую из файла, где ES-модули запрещены политикой источников.
*/
(function () {
  'use strict';

  var VERSION = '1.2.1';
  var KEY = 'den-kamrona-v3';
  var GRACE = 15;        // минут после конца дела, пока ещё можно отметить

  var LESSONS = {
    1: [
      { from: '08:30', to: '09:40', name: 'Siyosatshunoslik', room: 'B-Kinozal' },
      { from: '09:55', to: '11:05', name: 'Jamiyat va din', room: 'B-410' },
      { from: '11:20', to: '12:30', name: 'Diplomatiya', room: 'A-311' }
    ],
    2: [{ from: '08:30', to: '09:40', name: 'Rus tili 1', room: 'D-325' }],
    3: [
      { from: '08:30', to: '09:40', name: 'Xalqaro munosabatlar', room: 'A-201' },
      { from: '09:55', to: '11:05', name: 'Ingliz tili 1', room: 'A-407' }
    ],
    4: [
      { from: '08:30', to: '09:40', name: 'Siyosatshunoslik', room: 'A-303' },
      { from: '11:20', to: '12:30', name: 'Rus tili 1', room: 'D-312' },
      { from: '14:30', to: '15:40', name: 'Diplomatiya', room: 'A-400' }
    ],
    5: [
      { from: '09:55', to: '11:05', name: 'Ingliz tili 1', room: 'B-208' },
      { from: '11:20', to: '12:30', name: 'Xalqaro munosabatlar', room: 'A-304' }
    ]
  };

  var FIELDS = [
    { key: 'wake', label: 'Подъём', type: 'time', def: '06:30' },
    { key: 'leave', label: 'Выход из дома', type: 'time', def: '07:00' },
    { key: 'lunch', label: 'Обед, минут', type: 'num', def: 55 },
    { key: 'toWork', label: 'Дорога на работу, минут', type: 'num', def: 30 },
    { key: 'workEnd', label: 'Конец работы', type: 'time', def: '19:30' },
    { key: 'toHome', label: 'Дорога домой, минут', type: 'num', def: 60 },
    { key: 'dinner', label: 'Ужин, минут', type: 'num', def: 30 },
    { key: 'shower', label: 'Душ, минут', type: 'num', def: 20 },
    { key: 'study', label: 'Уроки, минут', type: 'num', def: 60 },
    { key: 'sleep', label: 'Отбой', type: 'time', def: '23:00' }
  ];

  var S = { cfg: {}, done: {}, tasks: [], habits: null, chat: [], goal: 80, weekMon: true,
            sched: null, review: {}, focus: {}, reviewAt: '21:30',
            notif: { on: false, pre: true, win: true, end: true, rev: true }, fired: {},
            link: { url: '', token: '' }, notes: [] };

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw) raw = JSON.parse(localStorage.getItem('den-kamrona-v2'));
      if (!raw) raw = JSON.parse(localStorage.getItem('den-kamrona-v1'));
      if (raw) {
        S.cfg = raw.cfg || {}; S.done = raw.done || {}; S.tasks = raw.tasks || [];
        S.habits = raw.habits || null; S.chat = raw.chat || [];
        if (raw.goal) S.goal = raw.goal;
        if (raw.weekMon !== undefined) S.weekMon = raw.weekMon;
        S.sched = raw.sched || null;
        S.review = raw.review || {}; S.focus = raw.focus || {};
        S.reviewAt = raw.reviewAt || '21:30';
        if (raw.notif) S.notif = raw.notif;
        S.fired = raw.fired || {};
        S.link = raw.link || { url: '', token: '' };
        S.notes = raw.notes || [];
      }
    } catch (e) {}
    FIELDS.forEach(function (f) { if (S.cfg[f.key] === undefined) S.cfg[f.key] = f.def; });
    if (!S.sched) S.sched = JSON.parse(JSON.stringify(LESSONS));
    if (!S.habits) S.habits = [
      { id: 'h1', title: 'Вода', icon: '💧', times: 6, log: {} },
      { id: 'h2', title: 'Промты Claude', icon: '⌨️', times: 3, log: {} },
      { id: 'h3', title: 'Чтение', icon: '📖', times: 1, log: {} }
    ];
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    syncSoon();
    backupSoon();
  }

  function toMin(hm) { var p = String(hm).split(':'); return Number(p[0]) * 60 + Number(p[1] || 0); }
  function toHm(m) {
    var x = ((Math.round(m) % 1440) + 1440) % 1440;
    return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
  }
  /** Короткая длительность для колонки времени: «1 ч 10», «55 мин». */
  function shortSpan(min) {
    var m = Math.max(0, Math.round(min));
    if (m < 60) return m + ' мин';
    var h = Math.floor(m / 60), r = m % 60;
    return r ? h + ' ч ' + r : h + ' ч';
  }
  function human(min) {
    var m = Math.max(0, Math.round(min));
    if (m < 60) return m + ' мин';
    var h = Math.floor(m / 60), r = m % 60;
    return r ? h + ' ч ' + r + ' мин' : h + ' ч';
  }
  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }
  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fromKey(k) { var p = k.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  var DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  var MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var MONTHS_FULL = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

  var _uid = 0;
  function uid() { return Date.now().toString(36) + '-' + (++_uid) + '-' + Math.random().toString(36).slice(2, 6); }

  /* Эмодзи подбирается по смыслу названия: задача «посмотреть кино» должна
     выглядеть как кино, а не как одинаковая канцелярская кнопка. Словарь
     работает без интернета; если Jarvis прислал свой эмодзи — он главнее. */
  var ICONS = [
    [/кино|фильм|сериал|ютуб|youtube|нетфликс|netflix/, '🎬'],
    [/зал|трениров|спорт|бег|пробеж|отжим|турник|качал|фитнес/, '🏋️'],
    [/футбол|баскет|теннис|матч|игра в/, '⚽️'],
    [/обед|ужин|завтрак|поесть|покушать|еда|ресторан|кафе/, '🍽️'],
    [/кофе|чай|капучино|латте/, '☕️'],
    [/вода|попить|стакан/, '💧'],
    [/магаз|купить|покуп|базар|продукт|заказ/, '🛒'],
    [/урок|учёб|учеб|домашк|задани|эссе|реферат|курсов|экзамен|зачёт|зачет|пара/, '📚'],
    [/презентац|слайд|доклад/, '📊'],
    [/прочит|чтение|книг/, '📖'],
    [/написать|письмо|текст|статья|конспект/, '📝'],
    [/работ|проект|код|промт|claude|дедлайн|отчёт|отчет/, '💻'],
    [/звон|позвон|созвон|набрать/, '📞'],
    [/встреч|собрани|митинг|переговор/, '🤝'],
    [/врач|больниц|анализ|стоматолог|зуб|аптек|лекарств|таблет/, '🩺'],
    [/душ|помыть|ванн|зубы/, '🚿'],
    [/убра|уборк|пропылес|помыть пол|посуд/, '🧹'],
    [/стирк|постира|бель|порошок/, '🧺'],
    [/дорог|ехать|поехать|такси|автобус|метро/, '🚌'],
    [/самол|аэропорт|рейс|виза|поездк|путешеств/, '✈️'],
    [/деньг|оплат|заплат|счёт|счет|перевод|карт|банк|налог/, '💳'],
    [/подар|день рожден|днюх|поздрав/, '🎁'],
    [/музык|гитар|пианино|песн/, '🎧'],
    [/игр|пристав|катк|dota|cs/, '🎮'],
    [/спать|сон|отбой|лечь/, '😴'],
    [/мама|папа|брат|сестр|родител|семь|бабушк|дедушк/, '👨‍👩‍👦'],
    [/молит|намаз|мечет|коран|джума/, '🕌'],
    [/универ|институт|лекци|декан|деканат/, '🎓'],
    [/почта|письмо на|mail|имейл/, '✉️'],
    [/фото|фотк|сфотк|снять|камер|селфи/, '📷'],
    [/ремонт|почин|собрать|инструмент|кран|розетк|прикрут/, '🔧'],
    [/стрижк|стрич|стриж|парикмахер|барбер/, '💈'],
    [/прогул|погул|парк|улиц|пешком|подыш/, '🌳']
  ];
  function guessIcon(title) {
    var text = String(title || '').toLowerCase();
    for (var i = 0; i < ICONS.length; i++) if (ICONS[i][0].test(text)) return ICONS[i][1];
    return '📌';
  }
  function taskIcon(task) {
    return (task && task.icon) || guessIcon(task && task.title);
  }

  /* ── Анимации занятий ─────────────────────────────────────────────
     Файлы Lottie лежат в anim/ и называются по имени сцены. Нарисованы
     аниматорами, а не кодом: рисовать живого персонажа фигурами у меня
     выходило хуже, чем честно взять готовую анимацию.

     Файла нет — ничего не показываем. Это важнее, чем кажется: сцены
     добавляются по одной, и отсутствие половины файлов не должно
     ломать экран. */

  /* Сцена занятия.

     Разметка лежит в anim/scenes.js, движение — в anim/scenes.css; оба
     файла собирает tools/scenes/build.py из общего шаблона питомца.
     Вектор вместо Lottie: сцена появляется мгновенно, без запроса по
     сети, и это минус библиотека на 168 КБ.

     Сцены idle у слоя нет нарочно: когда дела нет, на виду остаётся
     живой питомец самого приложения со своим настроением. */
  var Anim = {
    current: '',

    stop: function () {
      el.scene.innerHTML = '';
      el.pet.dataset.anim2 = 'off';
    },

    show: function (name) {
      /* Без этой проверки перерисовка раз в минуту начинала бы все
         анимации заново, и питомец дёргался бы на каждом тике. */
      if (name === this.current) return;
      this.current = name;
      this.stop();
      if (!name || name === 'idle') return;
      var all = window.KAMRON_SCENES;
      if (!all || !all[name]) return;
      el.scene.innerHTML = all[name];
      el.pet.dataset.anim2 = 'on';
    }
  };

  /* Значок дела выбирает сцену. Тип блока — запасной путь: у режимных
     блоков значок стоит всегда, а у задач его подбирает guessIcon. */
  var SCENE_BY_ICON = {
    '📖': 'read', '📚': 'read', '🎓': 'read',
    '📝': 'write', '✉️': 'write',
    '📊': 'present',
    '🩺': 'health',
    '💻': 'work',
    '🚿': 'shower',
    '🍽️': 'eat', '🍲': 'eat',
    '☕️': 'drink', '💧': 'drink',
    '🚌': 'travel', '🚗': 'travel',
    '✈️': 'flight',
    '🏋️': 'sport',
    '⚽️': 'ball',
    '🎬': 'screen',
    '🎮': 'game',
    '🎧': 'music',
    '😴': 'sleep', '🌙': 'sleep',
    '🌅': 'wake',
    '📞': 'call',
    '🤝': 'meeting',
    '🛒': 'shop',
    '🎁': 'gift',
    '💳': 'money',
    '👨‍👩‍👦': 'family',
    '🧹': 'clean',
    '🧺': 'laundry',
    '🔧': 'repair',
    '💈': 'haircut',
    '🕌': 'pray',
    '📷': 'photo',
    '🌳': 'walk', '🌿': 'walk', '✨': 'walk'
  };
  var SCENE_BY_KIND = {
    lesson: 'read', study: 'read', work: 'work', meal: 'eat', travel: 'travel',
    chore: 'shower', home: 'wake', free: 'walk', window: 'idle', task: 'idle'
  };

  function sceneFor(block) {
    if (!block) return 'idle';
    return SCENE_BY_ICON[block.icon] || SCENE_BY_KIND[block.kind] || 'idle';
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  /* ── День ─────────────────────────────────────────────────────────── */
  function buildDay(date) {
    var lessons = (S.sched && S.sched[date.getDay()]) || [], out = [], cfg = S.cfg;
    var seq = {};
    var add = function (from, to, name, kind, icon, tile, room) {
      if (to <= from) return;
      seq[kind] = (seq[kind] || 0) + 1;
      var id = kind === 'lesson' ? 'lesson-' + name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '') : kind + '-' + seq[kind];
      out.push({ id: id, from: from, to: to, name: name, kind: kind, icon: icon, tile: tile, room: room || '' });
    };
    var wake = toMin(cfg.wake), leave = toMin(cfg.leave);
    add(wake, wake + 20, 'Подъём и завтрак', 'home', '🌅', 'sun');

    if (!lessons.length) {
      add(leave, toMin(cfg.sleep), 'Выходной', 'free', '🌿', 'mint');
    } else {
      add(leave, toMin(lessons[0].from), 'Дорога в университет', 'travel', '🚌', 'sky');
      lessons.forEach(function (l, i) {
        add(toMin(l.from), toMin(l.to), l.name, 'lesson', '🎓', 'sky', l.room);
        var nx = lessons[i + 1];
        if (nx && toMin(nx.from) - toMin(l.to) >= 40) add(toMin(l.to), toMin(nx.from), 'Свободное окно', 'window', '✨', 'lime');
      });
      var c = toMin(lessons[lessons.length - 1].to);
      add(c, c + Number(cfg.lunch), 'Обед', 'meal', '🍲', 'sun'); c += Number(cfg.lunch);
      add(c, c + Number(cfg.toWork), 'Дорога на работу', 'travel', '🚌', 'sky'); c += Number(cfg.toWork);
      var we = Math.max(c + 30, toMin(cfg.workEnd));
      add(c, we, 'Работа', 'work', '💻', 'rose'); c = we;
      add(c, c + Number(cfg.toHome), 'Дорога домой', 'travel', '🚗', 'sky'); c += Number(cfg.toHome);
      add(c, c + Number(cfg.dinner), 'Ужин', 'meal', '🍽️', 'sun'); c += Number(cfg.dinner);
      add(c, c + Number(cfg.shower), 'Душ', 'chore', '🚿', 'mint'); c += Number(cfg.shower);
      add(c, c + Number(cfg.study), 'Уроки', 'study', '📚', 'mint'); c += Number(cfg.study);
      var sl = toMin(cfg.sleep);
      if (sl > c) add(c, sl, 'Свободное время', 'free', '🌙', 'rose');
    }

    tasksOn(dateKey(date)).forEach(function (t) {
      var f = t.time ? toMin(t.time) : 1439;
      out.push({ id: 'task-' + t.id, taskId: t.id, from: f, to: t.time ? f + 30 : 1440,
                 name: t.title, kind: 'task', icon: taskIcon(t), tile: 'lime', free: !t.time });
    });
    out.sort(function (a, b) { return a.from - b.from; });
    return out;
  }
  function isCheckable(b) { return ['home', 'meal', 'chore', 'study', 'work', 'lesson', 'task'].indexOf(b.kind) >= 0; }
  function tasksOn(k) { return S.tasks.filter(function (t) { return t.date === k; }); }
  function marks(k) { if (!S.done[k]) S.done[k] = []; return S.done[k]; }

  /* Честная блокировка. Отметить можно, только пока дело идёт (плюс запас).
     Прошло — упущено навсегда. Систему не обмануть, в этом весь смысл. */
  function statusOf(b, dk, nowKey, nowMin) {
    if (marks(dk).indexOf(b.id) >= 0) return 'done';
    if (dk > nowKey) return 'early';
    if (dk < nowKey) return 'missed';
    if (b.free) return 'open';
    if (nowMin < b.from) return 'early';
    if (nowMin > b.to + GRACE) return 'missed';
    return 'open';
  }

  function tally(date) {
    var dk = dateKey(date), now = new Date(), nk = dateKey(now);
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var day = buildDay(date), m = marks(dk);
    var units = 0, hit = 0, miss = 0;
    day.filter(isCheckable).forEach(function (b) {
      units++;
      var st = statusOf(b, dk, nk, nowMin);
      if (st === 'done') hit++; else if (st === 'missed') miss++;
    });
    S.habits.forEach(function (h) {
      units += h.times;
      var n = Math.min(h.times, h.log[dk] || 0);
      hit += n;
      if (dk < nk) miss += h.times - n;
    });
    return { day: day, dk: dk, nk: nk, nowMin: nowMin, m: m, units: units, hit: hit, miss: miss,
             pct: units ? Math.round((hit / units) * 100) : 0, mpct: units ? Math.round((miss / units) * 100) : 0 };
  }

  var el = {};
  ['dayLabel','streak','pet','say','mouth','mouthbox','eyes','browL','browR','deco1','deco2','deco3',
   'doneCount','pct','praise','barHit','barMiss','lost','planMeta','list','habTop','habLink','addTask',
   'viewToday','viewChat','viewCal','viewSetup','navToday','navChat','navSetup','why','whyText','calBack','gv','wm',
   'chatLive','chatHist','toHist','histBack','histTabs','histBody','chatHello','chips','thread','chatInput','chatSend','composer',
   'calTitle','calGrid','calPrev','calNext','dayCard','stStreak','stAvg','stGoal','heat','heatMeta',
   'scene','setRoot','setSub','subBody','setBack','habCount','schedCount','focusBtn','revCall','revSub','crest','insights','notifSub','linkSub','noteBox','noteList'].forEach(function (id) { el[id] = document.getElementById(id); });

  var view = new Date();
  var calMonth = new Date();
  var schedDay = (new Date()).getDay() || 1;
  var tab = 'today';

  function vKey() { return dateKey(view); }
  function isToday() { return vKey() === dateKey(new Date()); }

  /* ══ Рост питомца ═══════════════════════════════════════════════════
     Уровень зависит только от реально закрытых дней за три недели —
     не от заходов в приложение. Провалы ослабляют его, но не обнуляют. */
  var STAGES = [
    { need: 0,  name: 'Зерно',   crest: '' },
    { need: 2,  name: 'Росток',  crest: '🌱' },
    { need: 5,  name: 'Живой',   crest: '🍀' },
    { need: 10, name: 'Крепкий', crest: '⭐️' },
    { need: 15, name: 'Сильный', crest: '👑' }
  ];
  function petLevel() {
    var good = 0, d = new Date(), tk = dateKey(d), weak = 0, checked = 0;
    for (var i = 0; i < 21; i++) {
      var k = dateKey(d);
      if (S.done[k] && S.done[k].length && tally(new Date(d)).pct >= S.goal) good++;
      if (k !== tk && checked < 3) { checked++; if (tally(new Date(d)).pct < 40) weak++; }
      d.setDate(d.getDate() - 1);
    }
    var idx = 0;
    STAGES.forEach(function (st, i) { if (good >= st.need) idx = i; });
    var next = STAGES[idx + 1];
    return { i: idx, good: good, stage: STAGES[idx], next: next, toNext: next ? next.need - good : 0, weak: weak >= 3 };
  }
  function paintLevel() {
    var L = petLevel();
    el.crest.textContent = L.stage.crest;
    el.pet.dataset.crest = L.stage.crest ? 'on' : 'off';
    el.pet.dataset.weak = L.weak ? 'on' : 'off';
    return L;
  }

  function streakDays() {
    var n = 0, d = new Date();
    for (var i = 0; i < 400; i++) {
      var k = dateKey(d);
      if (S.done[k] && S.done[k].length) n++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  /* ══ Питомец ═══════════════════════════════════════════════════════
     Он не «иконка настроения», а существо: дышит, моргает (иногда дважды),
     смотрит по сторонам, открывает рот, когда говорит, и реагирует сразу,
     как только что-то произошло. Эмоция складывается из пяти вещей:
     рот, брови, глаза, цвет и то, как он двигается.                   */
  var MOUTH = {
    grin:  'M -18 5 C -10 26, 10 26, 18 5',
    smile: 'M -16 9 C -8 22, 8 22, 16 9',
    soft:  'M -13 12 C -7 18, 7 18, 13 12',
    flat:  'M -13 14 C -6 14, 6 14, 13 14',
    wave:  'M -14 13 C -10 7, -4 19, 1 13 C 5 8, 10 17, 14 12',
    frown: 'M -16 18 C -9 7, 9 7, 16 18',
    deep:  'M -18 21 C -10 2, 10 2, 18 21',
    yawn:  'M -9 8 C -9 22, 9 22, 9 8 C 9 4, -9 4, -9 8',
    tiny:  'M -7 13 C -4 16, 4 16, 7 13'
  };
  var MOODS = {
    sleep:   { mouth: 'tiny',  eyes: 'closedline', brow: 0,  tone: 'night', anim: 'slow',  deco: ['💤', '💤', '🌙'], decoOn: true },
    wake:    { mouth: 'soft',  eyes: 'half',       brow: 0,  tone: 'plain', anim: 'slow'  },
    calm:    { mouth: 'soft',  eyes: '',           brow: 0,  tone: 'plain', anim: 'idle'  },
    happy:   { mouth: 'smile', eyes: '',           brow: -6, tone: 'lime',  anim: 'hop', blush: true },
    proud:   { mouth: 'grin',  eyes: 'shut',       brow: -8, tone: 'lime',  anim: 'hop',  deco: ['✨', '🎉', '⭐️'], decoOn: true, blush: true },
    cheer:   { mouth: 'grin',  eyes: 'wide',       brow: -10, tone: 'lime', anim: 'cheer', deco: ['🎉', '✨', '💚'], decoOn: true, blush: true },
    focus:   { mouth: 'flat',  eyes: 'narrow',     brow: 4,  tone: 'plain', anim: 'idle'  },
    guard:   { mouth: 'soft',  eyes: 'narrow',     brow: 2,  tone: 'lime',  anim: 'idle'  },
    hurry:   { mouth: 'wave',  eyes: 'wide',       brow: -4, tone: 'plain', anim: 'rush', deco: ['⏳', '⏳', '⏳'], decoOn: true },
    bored:   { mouth: 'yawn',  eyes: 'half',       brow: 0,  tone: 'plain', anim: 'slow'  },
    worry:   { mouth: 'wave',  eyes: '',           brow: 10, tone: 'plain', anim: 'idle'  },
    cross:   { mouth: 'flat',  eyes: 'narrow',     brow: 15, tone: 'warm',  anim: 'idle'  },
    angry:   { mouth: 'frown', eyes: 'narrow',     brow: 24, tone: 'warm',  anim: 'boil'  },
    furious: { mouth: 'deep',  eyes: 'narrow',     brow: 30, tone: 'hot',   anim: 'boilFast', deco: ['💢', '💢', '🔥'], decoOn: true },
    sad:     { mouth: 'frown', eyes: 'half',       brow: 12, tone: 'plain', anim: 'sink'  },
    tired:   { mouth: 'flat',  eyes: 'half',       brow: 0,  tone: 'night', anim: 'sink'  }
  };

  var Pet = {
    mood: null, lockUntil: 0, lastSay: '',
    apply: function (name) {
      var m = MOODS[name] || MOODS.calm;
      this.mood = name;
      el.pet.dataset.mood = name;
      el.mouth.setAttribute('d', MOUTH[m.mouth]);
      el.eyes.className.baseVal = 'eyes ' + (m.eyes || '');
      el.browL.style.opacity = m.brow ? 1 : 0;
      el.browR.style.opacity = m.brow ? 1 : 0;
      el.browL.style.transform = 'rotate(' + m.brow + 'deg) translateY(' + (m.brow > 0 ? m.brow / 4 : 0) + 'px)';
      el.browR.style.transform = 'rotate(' + (-m.brow) + 'deg) translateY(' + (m.brow > 0 ? m.brow / 4 : 0) + 'px)';
      el.pet.dataset.tone = m.tone;
      el.pet.dataset.anim = m.anim;
      el.pet.dataset.deco = m.decoOn ? 'on' : 'off';
      el.pet.dataset.blush = m.blush ? 'on' : 'off';
      if (m.deco) { el.deco1.textContent = m.deco[0]; el.deco2.textContent = m.deco[1]; el.deco3.textContent = m.deco[2]; }
    },
    /* Сцена занятия. Меняется только при смене дела: перерисовывать её
       каждые полминуты значит обрывать анимацию на середине. */
    setScene: function (name) {
      if (this.scene === name) return;
      this.scene = name;
      el.pet.dataset.scene = name;
      Anim.show(name);
    },

    /* Рот открывается и закрывается — ровно столько раз, сколько слов. */
    talk: function (words) {
      var n = Math.max(3, Math.min(9, words));
      var i = 0, self = this;
      clearInterval(this._t);
      this._t = setInterval(function () {
        el.mouthbox.classList.toggle('open');
        if (++i >= n * 2) { clearInterval(self._t); el.mouthbox.classList.remove('open'); }
      }, 135);
    },
    blink: function () {
      if (this.mood === 'sleep' || this.mood === 'proud') return;
      var base = el.eyes.className.baseVal;
      el.eyes.className.baseVal = base + ' shut';
      var self = this;
      setTimeout(function () { el.eyes.className.baseVal = base; }, 110);
    },
    look: function () {
      if (this.mood === 'sleep') return;
      var x = [-5, -3, 0, 3, 5][Math.floor(Math.random() * 5)];
      el.eyes.style.transform = 'translateX(' + x + 'px)';
      setTimeout(function () { el.eyes.style.transform = ''; }, 900 + Math.random() * 700);
    },
    /* Короткая реакция поверх настроения: отметил дело — он прыгает. */
    flash: function (name, text, ms) {
      this.apply(name);
      this.lockUntil = Date.now() + (ms || 2400);
      say(text, true);
    },
    /* Глаза следят за пальцем — от этого он кажется живым, а не нарисованным. */
    follow: function (x, y) {
      if (this.mood === 'sleep' || el.viewToday.hidden) return;
      var r = el.pet.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = Math.max(-6, Math.min(6, (x - cx) / 26));
      var dy = Math.max(-4, Math.min(4, (y - cy) / 30));
      el.eyes.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      clearTimeout(this._f);
      var self = this;
      this._f = setTimeout(function () { el.eyes.style.transform = ''; }, 2200);
    },
    /* Его потрогали. Он пружинит и объясняет, что с ним происходит. */
    poke: function () {
      el.pet.classList.remove('poked'); void el.pet.offsetWidth; el.pet.classList.add('poked');
      var self = this;
      setTimeout(function () { el.pet.classList.remove('poked'); }, 640);
      this.talk(4);
      showWhy(true);
    },
    /* Тело движется постоянно само по себе, поэтому здесь остались только
       живые мелочи — взгляд и двойное моргание. Никаких рывков. */
    fidget: function () {
      if (el.viewToday.hidden || Date.now() < this.lockUntil) return;
      if (Math.random() < .6) this.look();
      else { this.blink(); var s2 = this; setTimeout(function () { s2.blink(); }, 210); }
    }
  };
  (function loops() {
    (function b() {
      setTimeout(function () {
        Pet.blink();
        if (Math.random() < .28) setTimeout(function () { Pet.blink(); }, 230);
        b();
      }, 2200 + Math.random() * 4200);
    })();
    (function l() { setTimeout(function () { Pet.look(); l(); }, 5000 + Math.random() * 9000); })();
    (function f() { setTimeout(function () { Pet.fidget(); f(); }, 9000 + Math.random() * 11000); })();
  })();
  document.addEventListener('pointermove', function (e) { Pet.follow(e.clientX, e.clientY); }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (e.touches[0]) Pet.follow(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  el.pet.addEventListener('pointerdown', function () { Pet.poke(); });

  /* Он никогда не ругает просто так: на любое недовольство есть причина,
     и её можно прочитать. Кнопка «почему?» появляется, когда он хмурый. */
  var whyOpen = false, whyNow = '';
  function showWhy(toggle) {
    if (!whyNow) { el.whyText.hidden = true; return; }
    whyOpen = toggle ? !whyOpen : whyOpen;
    el.whyText.hidden = !whyOpen;
    if (whyOpen) {
      el.whyText.innerHTML = whyNow;
      el.whyText.classList.remove('flip'); void el.whyText.offsetWidth;
      el.why.textContent = 'понятно';
    } else el.why.textContent = 'почему?';
  }
  el.why.addEventListener('click', function (e) { e.stopPropagation(); showWhy(true); });

  function say(html, force) {
    if (!force && el.say.innerHTML === html) return;
    el.say.innerHTML = html;
    el.say.classList.remove('flip'); void el.say.offsetWidth; el.say.classList.add('flip');
    Pet.talk(String(html).replace(/<[^>]+>/g, '').split(/\s+/).length);
  }

  /* Что он думает и что командует. Приказ всегда конкретный, а недовольство
     всегда объяснено: сначала причина, потом что делать. Он не ругается сам
     по себе — на каждое его состояние можно нажать «почему?». */
  function think(t) {
    var day = t.day, nowMin = t.nowMin, future = t.dk > t.nk, past = t.dk < t.nk;
    var dd = fromKey(t.dk);
    if (future) return { mood: 'calm',
      text: 'План на <b>' + dd.getDate() + ' ' + MONTHS[dd.getMonth()] + '</b>. Пока только смотрим.',
      why: 'Это будущий день. Отмечать можно только в сам день.' };
    if (past) return { mood: t.pct >= S.goal ? 'proud' : t.pct >= 40 ? 'calm' : 'sad',
      text: 'Тот день закрыт на <b>' + t.pct + '%</b>' + (t.miss ? ', упущено ' + t.miss : '') + '.',
      why: 'День прошёл, менять в нём нечего.' };

    var wake = toMin(S.cfg.wake), sleep = toMin(S.cfg.sleep);
    if (nowMin < wake - 30 || nowMin >= sleep)
      return { mood: 'sleep', text: 'Спим. Подъём в <b>' + S.cfg.wake + '</b>.',
        why: 'Сон по твоему режиму. Разбужу утром.' };
    if (t.pct >= 100)
      return { mood: 'proud', text: 'Весь день закрыт. Иди отдыхать — ты заслужил.',
        why: 'Закрыто ' + t.hit + ' из ' + t.units + ', вместе с привычками.' };

    var live = day.find(function (b) { return !b.free && nowMin >= b.from && nowMin < b.to; });
    var next = day.find(function (b) { return !b.free && b.from > nowMin; });
    var missed = day.filter(function (b) { return isCheckable(b) && statusOf(b, t.dk, t.nk, nowMin) === 'missed'; });
    /* Список держим коротким: три названия читаются, восемь — уже нет. */
    var names = missed.slice(-3).map(function (b) { return b.name; }).join(', ') +
      (missed.length > 3 ? ' и ещё ' + (missed.length - 3) : '');
    var now = live ? live.name : next ? next.name + ' в ' + toHm(next.from) : 'пауза';

    if (live && isCheckable(live) && t.m.indexOf(live.id) < 0 && live.to - nowMin <= 15)
      return { mood: 'hurry', text: '<b>' + live.name + '</b> кончается через ' + human(live.to - nowMin) + '. Закрывай сейчас.',
        why: 'Отметить можно до <b>' + toHm(live.to + GRACE) + '</b>.' };

    if (missed.length >= 5)
      return { mood: 'furious', text: 'Я в бешенстве: за день потеряно <b>' + missed.length + '</b> ' + plural(missed.length, 'дело', 'дела', 'дел') + '.',
        why: 'Мимо: ' + names + '.<br>Сейчас: <b>' + now + '</b>.' };
    if (missed.length >= 3)
      return { mood: 'angry', text: 'Я злюсь: мимо прошли <b>' + missed.length + '</b> ' + plural(missed.length, 'дело', 'дела', 'дел') + '.',
        why: 'Мимо: ' + names + '.<br>Сейчас: <b>' + now + '</b>.' };
    if (missed.length === 2)
      return { mood: 'cross', text: 'Я недоволен: упущено два дела — <b>' + missed[0].name + '</b> и <b>' + missed[1].name + '</b>.',
        why: 'Отметка работает, только пока дело идёт.<br>Сейчас: <b>' + now + '</b>.' };
    if (missed.length === 1)
      return { mood: 'worry', text: 'Я насторожился: <b>' + missed[0].name + '</b> ушло без отметки.',
        why: 'Оно закрылось в ' + toHm(missed[0].to + GRACE) + '.<br>Дальше: <b>' + now + '</b>.' };

    if (nowMin < wake + 20)
      return { mood: 'wake', text: 'Подъём. Завтрак до <b>' + toHm(wake + 20) + '</b>, выход в ' + S.cfg.leave + '.',
        why: 'Опоздаешь на двадцать минут утром — потеряешь час вечером.' };
    if (nowMin > 1320)
      return { mood: 'tired', text: 'Поздно. Осталось: ' + (next ? next.name.toLowerCase() : 'ничего') + '. Отбой в <b>' + S.cfg.sleep + '</b>.',
        why: 'До отбоя ' + human(sleep - nowMin) + '. Сдвинешь сон — завтра тяжело.' };

    if (live && (live.kind === 'window' || live.kind === 'free'))
      return { mood: 'bored', text: 'Окно до <b>' + toHm(live.to) + '</b>. Сделай уроки сейчас — вечером их не будет.',
        why: 'Свободно ' + human(live.to - nowMin) + '. Вечером ужин, душ и уроки подряд.' };

    if (live && isCheckable(live))
      return { mood: 'focus', text: 'Сейчас <b>' + live.name + '</b>. До ' + toHm(live.to) + '. Не отвлекайся.',
        why: 'Отметить можно до ' + toHm(live.to + GRACE) + '.<br>Дальше: <b>' + (next ? next.name : 'свободно') + '</b>.' };

    if (t.pct >= 55)
      return { mood: 'happy', text: 'Сделано ' + t.pct + '%. Дальше — <b>' + (next ? next.name : 'свободно') + '</b>' + (next ? ' в ' + toHm(next.from) : '') + '.',
        why: 'Закрыто ' + t.hit + ' из ' + t.units + ', потерь нет.' };
    if (live)
      return { mood: 'calm', text: 'Сейчас ' + live.name.toLowerCase() + ', до ' + toHm(live.to) + '. Дальше <b>' + (next ? next.name : '—') + '</b>.',
        why: 'Пока всё по плану.' };
    return { mood: 'calm', text: next ? 'Ближайшее — <b>' + next.name + '</b> в ' + toHm(next.from) + '.' : 'На сегодня всё.',
      why: next ? 'До него ' + human(next.from - nowMin) + '. Можно закрыть привычки.' : 'Дел в плане больше нет.' };
  }

  /* ── Экран «Сегодня» ──────────────────────────────────────────────── */
  function renderToday() {
    var t = tally(view);
    var d = view;
    el.dayLabel.textContent = (isToday() ? 'сегодня, ' : DAYS[d.getDay()] + ', ') + d.getDate() + ' ' + MONTHS[d.getMonth()];
    el.streak.innerHTML = '<i>🔥</i> <b>' + streakDays() + '</b>';
    var L = paintLevel();
    document.body.classList.toggle('night', t.nowMin >= toMin(S.cfg.sleep) - 60 || t.nowMin < toMin(S.cfg.wake));

    if (Date.now() > Pet.lockUntil) {
      var th = think(t);
      Pet.apply(th.mood);
      say(th.text);
      whyNow = th.why || '';
      el.why.hidden = !whyNow;
      if (whyOpen && whyNow) el.whyText.innerHTML = whyNow;
      el.whyText.hidden = !(whyOpen && whyNow);
    }

    if (pctShown !== t.pct) countTo(t.pct); else el.pct.textContent = t.pct;
    el.barHit.style.width = t.pct + '%';
    el.barMiss.style.width = t.mpct + '%';
    el.doneCount.textContent = 'Сегодня уже сделано — ' + t.hit + ' из ' + t.units;
    el.praise.textContent = t.pct >= 100 ? 'Весь день закрыт' : t.pct >= 70 ? 'Отличный темп' : t.pct >= 40 ? 'Половина позади' : t.pct > 0 ? 'Начало положено' : 'Первое дело — и пошло';
    el.lost.hidden = !t.miss;
    el.lost.textContent = t.miss ? 'Упущено безвозвратно: ' + t.miss + ' — это уже не вернуть' : '';

    /* Чем занят питомец. Ночью он спит независимо от плана: если дело
       идёт в три часа ночи, это уже не повод бодриться. */
    var night = t.nowMin >= toMin(S.cfg.sleep) || t.nowMin < toMin(S.cfg.wake);
    /* Дел может идти сразу несколько: задача на 17:50 попадает внутрь
       блока «Работа». Побеждает начавшееся позже — оно конкретнее.
       Иначе личная задача всегда тонула бы под фоновым блоком. */
    var busy = null;
    t.day.forEach(function (b) {
      if (b.free || t.nowMin < b.from || t.nowMin >= b.to) return;
      if (!busy || b.from > busy.from || (b.from === busy.from && b.kind === 'task')) busy = b;
    });
    Pet.setScene(!isToday() ? 'idle' : night ? 'sleep' : sceneFor(busy));

    renderHabTop(t.dk);
    renderNotes();

    var live = t.day.find(function (b) { return !b.free && t.nowMin >= b.from && t.nowMin < b.to; });
    el.planMeta.textContent = isToday() && live ? 'сейчас ' + live.name.toLowerCase() : t.day.length ? 'до ' + toHm(t.day[t.day.length - 1].to) : '';
    syncQuick(t);

    el.list.innerHTML = '';
    t.day.forEach(function (b, i) {
      var can = isCheckable(b), st = can ? statusOf(b, t.dk, t.nk, t.nowMin) : 'auto';
      var soon = st === 'open' && !b.free && b.to - t.nowMin <= 15 && t.nowMin >= b.from;
      var row = document.createElement(can ? 'button' : 'div');
      if (can) row.type = 'button';
      row.className = 'row glass' + (can ? ' tap' : '') + (st === 'done' ? ' on' : '') + (st === 'missed' ? ' missed' : '') +
        (st === 'early' ? ' early' : '') + (isToday() && live === b ? ' live' : '');
      row.style.animationDelay = Math.min(i * 26, 300) + 'ms';
      /* Время — отдельной колонкой справа, а не хвостом из дат и точек.
         Сверху крупное число, под ним подпись: у текущего дела это остаток,
         у остальных — начало и длительность. Строка из «08:30 — 09:40 ·
         ауд. A-303 · 1 ч 10 мин» не читалась и ломалась на две. */
      var when;
      if (b.free) when = { big: '—', sub: 'без времени' };
      else if (isToday() && live === b && can) when = { big: shortSpan(b.to - t.nowMin), sub: 'осталось', cls: ' is-now' };
      else if (isToday() && live === b) when = { big: toHm(b.to), sub: 'до', cls: ' is-now' };
      else if (st === 'done') when = { big: toHm(b.from), sub: 'готово', cls: ' is-done' };
      else if (st === 'missed') when = { big: toHm(b.from), sub: 'упущено', cls: ' is-miss' };
      else when = { big: toHm(b.from), sub: shortSpan(b.to - b.from) };
      var tag = soon && st === 'open' ? '<span class="tag soon">успей</span>' : '';
      var btn = !can ? '<span class="mark auto" aria-hidden="true"></span>'
        : st === 'missed' ? '<button type="button" class="mark missed" aria-label="Упущено"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
        : st === 'early' ? '<button type="button" class="mark locked" aria-label="Ещё не время"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 1.8"/></svg></button>'
        : '<button type="button" class="mark" aria-label="Отметить"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg></button>';
      row.innerHTML = '<span class="tile ' + b.tile + '">' + b.icon + '</span>' +
        '<div class="meat"><b>' + esc(b.name) + tag + '</b>' +
        (b.room ? '<small>ауд. ' + esc(b.room) + '</small>' : '') + '</div>' +
        '<span class="when' + (when.cls || '') + '"><b></b><small></small></span>' + btn;
      row.querySelector('.when b').textContent = when.big;
      row.querySelector('.when small').textContent = when.sub;
      if (can) {
        /* Нажимается вся карточка — в неё легче попасть пальцем, чем в кружок. */
        var mk = row.querySelector('.mark');
        row.addEventListener('click', function () {
          if (st === 'missed') { deny(mk, 'Время прошло. Это уже не отметить — так честно.'); return; }
          if (st === 'early') { deny(mk, 'Ещё не началось. Отметишь в ' + toHm(b.from) + '.'); return; }
          toggle(b, row, mk, t.dk);
        });
      }
      el.list.appendChild(row);
    });
  }

  function deny(btn, text) {
    btn.classList.add('nope');
    setTimeout(function () { btn.classList.remove('nope'); }, 420);
    toast(text);
    Pet.flash('cross', text, 2200);
  }
  function toast(text) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var d = document.createElement('div'); d.className = 'toast'; d.textContent = text;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2700);
  }

  /* Маленький залп из точки, где была галочка. Награда должна быть видна. */
  function burst(node) {
    var r = node.getBoundingClientRect();
    var colors = ['#d6f24b', '#aacf24', '#ffd98a', '#9fe3c4', '#ffc4e1'];
    for (var i = 0; i < 14; i++) {
      (function (i) {
        var c = document.createElement('i');
        c.className = 'conf';
        c.style.background = colors[i % colors.length];
        c.style.left = (r.left + r.width / 2 - 4) + 'px';
        c.style.top = (r.top + r.height / 2 - 4) + 'px';
        document.body.appendChild(c);
        var a = (Math.PI * 2 * i) / 14 + Math.random() * .4;
        var d = 42 + Math.random() * 46;
        c.animate([
          { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d + 26) + 'px) scale(.3) rotate(' + (180 + Math.random() * 220) + 'deg)', opacity: 0 }
        ], { duration: 760 + Math.random() * 260, easing: 'cubic-bezier(.2,.7,.4,1)' });
        setTimeout(function () { c.remove(); }, 1060);
      })(i);
    }
  }
  /* Процент не перескакивает, а добегает — цифра должна ощущаться как движение. */
  var pctShown = 0;
  function countTo(target) {
    var from = pctShown, t0 = performance.now();
    el.pct.parentElement.classList.add('bump');
    setTimeout(function () { el.pct.parentElement.classList.remove('bump'); }, 320);
    (function step(now) {
      var k = Math.min(1, (now - t0) / 650);
      var e = 1 - Math.pow(1 - k, 3);
      el.pct.textContent = Math.round(from + (target - from) * e);
      if (k < 1) requestAnimationFrame(step); else pctShown = target;
    })(t0);
  }

  var CHEERS = ['Так и надо. Дальше.', 'Закрыто. Молодец.', 'Есть! Следующее.', 'Вот это по-нашему.', 'Красиво. Не сбавляй.'];
  function toggle(b, row, btn, dk) {
    var m = marks(dk), i = m.indexOf(b.id);
    if (i >= 0) { m.splice(i, 1); row.classList.remove('on'); }
    else {
      m.push(b.id); row.classList.add('on');
      btn.classList.add('pop'); setTimeout(function () { btn.classList.remove('pop'); }, 440);
      row.classList.add('just'); setTimeout(function () { row.classList.remove('just'); }, 620);
      burst(btn);
      Pet.flash('cheer', CHEERS[Math.floor(Math.random() * CHEERS.length)], 2300);
    }
    if (b.taskId) { var tk = S.tasks.find(function (x) { return x.id === b.taskId; }); if (tk) tk.done = i < 0; }
    save();
    var t = tally(view);
    countTo(t.pct); el.barHit.style.width = t.pct + '%'; el.barMiss.style.width = t.mpct + '%';
    el.doneCount.textContent = 'Сегодня уже сделано — ' + t.hit + ' из ' + t.units;
    el.streak.innerHTML = '<i>🔥</i> <b>' + streakDays() + '</b>';
    syncQuick(t);
    nativeSoon(true);
    if (t.pct >= 100) Pet.flash('proud', 'Весь день закрыт. Иди отдыхать — ты заслужил.', 4000);
  }

  /* Кнопки, зависящие от состояния дня, — обновляются без полной перерисовки. */
  function syncQuick(t) {
    var live = t.day.find(function (b) { return !b.free && t.nowMin >= b.from && t.nowMin < b.to; });
    el.focusBtn.hidden = !(isToday() && live && isCheckable(live) && t.m.indexOf(live.id) < 0);
    var revReady = isToday() && t.nowMin >= toMin(S.reviewAt) && !(S.review[t.dk] && S.review[t.dk].closed);
    el.revCall.hidden = !revReady;
    if (revReady) el.revSub.textContent = t.miss ? 'упущено ' + t.miss + ' — отметь причину за минуту' : 'день закрыт на ' + t.pct + '%, подведём итог';
  }

  /* Заметки показываются, только когда они есть: пустого раздела быть не должно. */
  function renderNotes() {
    el.noteBox.hidden = !S.notes.length;
    if (!S.notes.length) return;
    el.noteList.innerHTML = '';
    S.notes.slice(-5).reverse().forEach(function (n, i) {
      var row = document.createElement('div');
      row.className = 'row glass';
      row.style.animationDelay = (i * 50) + 'ms';
      row.innerHTML = '<span class="tile sun">📝</span><div class="meat"><b></b><small></small></div>' +
        '<button type="button" class="del" aria-label="Удалить">✕</button>';
      var title = row.querySelector('b');
      title.textContent = n.body;
      title.style.fontWeight = '600';
      row.querySelector('small').textContent = new Date(n.ts)
        .toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      row.querySelector('.del').addEventListener('click', function () {
        S.notes = S.notes.filter(function (x) { return x.id !== n.id; });
        save(); renderNotes();
      });
      el.noteList.appendChild(row);
    });
  }

  /* Привычки на дашборде — первые три. */
  function renderHabTop(dk) {
    el.habTop.innerHTML = '';
    var top = S.habits.slice(0, 3);
    if (!top.length) { el.habTop.innerHTML = '<p class="empty">Привычек нет. Добавь в настройках.</p>'; return; }
    top.forEach(function (h, i) { var r = habRow(h, dk, false); r.style.animationDelay = (i * 60) + 'ms'; el.habTop.appendChild(r); });
  }
  function habRow(h, dk, withDel) {
    var n = h.log[dk] || 0;
    var row = document.createElement('div');
    row.className = 'hab glass' + (n >= h.times ? ' full' : '');
    var dots = '';
    for (var i = 0; i < h.times; i++) dots += '<span class="' + (i < n ? 'fill' : '') + '"></span>';
    row.innerHTML =
      (withDel
        ? '<input type="text" class="tile mint ico" maxlength="4" aria-label="Значок привычки">'
        : '<span class="tile mint"></span>') +
      '<div class="meat"><b></b><div class="dots">' + dots + '</div></div>' +
      (withDel ? '<button type="button" class="del" aria-label="Удалить">✕</button>' : '') +
      '<button type="button" class="plus" aria-label="Отметить">+</button>';
    var tile = row.querySelector('.tile');
    if (withDel) {
      /* В настройках значок просто перепечатывается — своей клавиатурой эмодзи. */
      tile.value = h.icon || '🌱';
      tile.addEventListener('change', function () {
        h.icon = (tile.value || '🌱').slice(0, 4);
        save();
        renderSub('hab');
      });
    } else tile.textContent = h.icon || '🌱';
    row.querySelector('b').textContent = h.title + ' · ' + n + '/' + h.times;
    row.querySelector('.plus').addEventListener('click', function () {
      if (dk !== dateKey(new Date())) { toast('Привычки отмечаются только сегодня.'); return; }
      var was = h.log[dk] || 0;
      h.log[dk] = was + 1 > h.times ? 0 : was + 1;
      save();
      this.classList.add('pop');
      if (h.log[dk] === h.times) { burst(this); Pet.flash('cheer', h.title + ' — норма дня закрыта.', 2200); }
      var self = this;
      setTimeout(function () { self.classList.remove('pop'); if (tab === 'today') renderToday(); else renderSub('hab'); }, 200);
    });
    if (withDel) row.querySelector('.del').addEventListener('click', function () {
      S.habits = S.habits.filter(function (x) { return x.id !== h.id; }); save(); renderSub('hab');
    });
    return row;
  }
  el.habLink.addEventListener('click', function () { go('setup'); openSub('hab'); });

  /* ══ Фокус-режим ═══════════════════════════════════════════════════
     Одно дело во весь экран, питомец переезжает туда вместе с тобой и
     смотрит, как идёт время. Выйти можно, но это записывается.        */
  var focusOn = null, focusTimer = null, focusStart = 0;
  function openFocus(b) {
    if (focusOn) return;
    focusOn = b; focusStart = Date.now();
    document.body.classList.add('focusing');
    var f = document.createElement('div');
    f.className = 'focus'; f.id = 'focusLayer';
    f.innerHTML =
      '<div class="slot" id="petSlot"></div>' +
      '<div class="focus-ring"><span class="track" style="--p:0"></span>' +
      '<div><div class="focus-time" id="fTime">00:00</div></div></div>' +
      '<div class="focus-name"></div><div class="focus-sub" id="fSub"></div>' +
      '<div class="focus-acts"><button class="btn ghost" id="fQuit">Выйти</button>' +
      '<button class="btn" id="fDone">Сделано</button></div>' +
      '<p class="focus-hint">Он следит за временем. Выйдешь раньше — я это запомню.</p>';
    document.body.appendChild(f);
    f.querySelector('.focus-name').textContent = b.name;
    f.querySelector('#petSlot').appendChild(el.pet);
    Pet.apply('focus'); say('Работаем. Я рядом.', true); Pet.lockUntil = Date.now() + 4000;
    f.querySelector('#fQuit').addEventListener('click', function () { closeFocus(false); });
    f.querySelector('#fDone').addEventListener('click', function () { closeFocus(true); });
    tickFocus();
    focusTimer = setInterval(tickFocus, 1000);
  }
  function tickFocus() {
    if (!focusOn) return;
    var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    var left = Math.max(0, focusOn.to - nowMin);
    var total = Math.max(1, focusOn.to - focusOn.from);
    var done = Math.max(0, Math.min(100, ((total - left) / total) * 100));
    var mm = Math.floor(left), ss = Math.round((left - mm) * 60) % 60;
    var lay = document.getElementById('focusLayer'); if (!lay) return;
    var face = mm >= 60
      ? Math.floor(mm / 60) + ':' + String(mm % 60).padStart(2, '0') + ':' + String(ss).padStart(2, '0')
      : String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    lay.querySelector('#fTime').textContent = face;
    lay.querySelector('.track').style.setProperty('--p', done.toFixed(1));
    lay.querySelector('#fSub').textContent = 'до ' + toHm(focusOn.to) + ' · прошло ' + Math.round(done) + '%';
    if (left <= 0) { Pet.apply('hurry'); }
  }
  function closeFocus(done) {
    if (!focusOn) return;
    var mins = Math.round((Date.now() - focusStart) / 60000);
    var dk = dateKey(new Date());
    if (!S.focus[dk]) S.focus[dk] = { min: 0, runs: 0, quits: 0 };
    S.focus[dk].min += mins; S.focus[dk].runs++;
    if (!done) S.focus[dk].quits++;
    clearInterval(focusTimer); focusTimer = null;
    var b = focusOn; focusOn = null;
    el.viewToday.insertBefore(el.pet, el.viewToday.firstChild);
    var lay = document.getElementById('focusLayer'); if (lay) lay.remove();
    document.body.classList.remove('focusing');
    if (done) {
      var m = marks(dk);
      if (m.indexOf(b.id) < 0) m.push(b.id);
      if (b.taskId) { var tk = S.tasks.find(function (x) { return x.id === b.taskId; }); if (tk) tk.done = true; }
      Pet.flash('cheer', 'Закрыто за ' + human(mins) + ' фокуса.', 2600);
    } else {
      Pet.lockUntil = 0;
      toast(mins >= 1 ? 'Вышел через ' + human(mins) + '. Записал.' : 'Вышел сразу.');
    }
    save(); renderToday();
  }
  el.focusBtn.addEventListener('click', function () {
    var t = tally(view);
    var live = t.day.find(function (b) { return isCheckable(b) && !b.free && t.nowMin >= b.from && t.nowMin < b.to; });
    if (!live) { toast('Сейчас нет дела, на котором можно сфокусироваться.'); return; }
    openFocus(live);
  });

  /* ══ Разбор дня ════════════════════════════════════════════════════
     Вечером он спрашивает только одно: почему. Три кнопки, никакого ввода.
     Через две недели из этих ответов видно, где именно утекает день.   */
  var REASONS = [['late', 'не успел'], ['forgot', 'забыл'], ['skip', 'не захотел']];
  function openReview(dk) {
    closeSheet();
    var d = fromKey(dk), t = tally(d);
    var missed = t.day.filter(function (b) { return isCheckable(b) && statusOf(b, dk, t.nk, t.nowMin) === 'missed'; });
    var v = document.createElement('div'); v.className = 'veil'; v.addEventListener('click', closeSheet);
    var sh = document.createElement('div'); sh.className = 'sheet';
    sh.style.maxHeight = '86vh'; sh.style.overflowY = 'auto';
    sh.innerHTML = '<div class="grab"></div><h3>Разбор дня</h3>' +
      '<p style="margin:-8px 0 16px;font-size:13.5px;font-weight:600;color:var(--ink-soft)">' +
      'Закрыто ' + t.pct + '%' + (missed.length ? ', упущено ' + missed.length + '. Отметь причину — через пару недель я покажу закономерность.' : '. Потерь нет.') + '</p>' +
      '<div id="revList"></div><button class="btn" id="revDone" style="margin-top:14px">Готово</button>';
    document.body.appendChild(v); document.body.appendChild(sh); sheetNode = sh;
    var box = sh.querySelector('#revList');
    if (!S.review[dk]) S.review[dk] = {};
    if (!missed.length) box.innerHTML = '<p class="empty">Весь день закрыт. Так держать.</p>';
    missed.forEach(function (b) {
      var card = document.createElement('div'); card.className = 'rev glass';
      card.innerHTML = '<b></b><small></small><div class="why3"></div>';
      card.querySelector('b').textContent = b.name;
      card.querySelector('small').textContent = toHm(b.from) + ' — ' + toHm(b.to);
      var row = card.querySelector('.why3');
      REASONS.forEach(function (r) {
        var x = document.createElement('button');
        x.type = 'button'; x.textContent = r[1];
        x.className = S.review[dk][b.id] === r[0] ? 'on' : '';
        x.addEventListener('click', function () {
          S.review[dk][b.id] = S.review[dk][b.id] === r[0] ? null : r[0];
          save();
          row.querySelectorAll('button').forEach(function (y) { y.classList.remove('on'); });
          if (S.review[dk][b.id]) x.classList.add('on');
        });
        row.appendChild(x);
      });
      box.appendChild(card);
    });
    sh.querySelector('#revDone').addEventListener('click', function () {
      S.review[dk].closed = true; save(); closeSheet(); renderToday();
      Pet.flash('calm', 'Записал. Завтра начнём заново.', 2600);
    });
  }
  el.revCall.addEventListener('click', function () { openReview(vKey()); });

  /* ── Добавление задачи ────────────────────────────────────────────── */
  var sheetNode = null;
  function closeSheet() {
    document.querySelectorAll('.veil, .sheet').forEach(function (n) { n.remove(); });
    sheetNode = null;
  }
  el.addTask.addEventListener('click', function () {
    closeSheet();
    var v = document.createElement('div'); v.className = 'veil'; v.addEventListener('click', closeSheet);
    var s = document.createElement('div'); s.className = 'sheet';
    var base = new Date(view);
    var opts = [['сегодня', 0], ['завтра', 1], ['послезавтра', 2], ['через неделю', 7]];
    s.innerHTML = '<div class="grab"></div><h3>Новая задача</h3>' +
      '<div class="adder" style="margin:0"><span class="tile lime" id="nIcon" style="flex:none">📌</span>' +
      '<input type="text" id="nTitle" placeholder="Что сделать" maxlength="80"></div>' +
      '<div class="picks" id="nPicks"></div>' +
      '<div class="field"><label>Дата</label><input type="date" id="nDate"></div>' +
      '<div class="field"><label>Время (можно без него)</label><input type="time" id="nTime"></div>' +
      '<button class="btn" id="nSave" style="margin-top:14px">Добавить</button>';
    document.body.appendChild(v); document.body.appendChild(s); sheetNode = s;
    var dIn = s.querySelector('#nDate');
    dIn.value = dateKey(base);
    var picks = s.querySelector('#nPicks');
    opts.forEach(function (o, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pick' + (i === 0 ? ' on' : ''); b.textContent = o[0];
      b.addEventListener('click', function () {
        picks.querySelectorAll('.pick').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var d = new Date(); d.setDate(d.getDate() + o[1]); dIn.value = dateKey(d);
      });
      picks.appendChild(b);
    });
    dIn.addEventListener('change', function () { picks.querySelectorAll('.pick').forEach(function (x) { x.classList.remove('on'); }); });
    var titleInput = s.querySelector('#nTitle'), iconBox = s.querySelector('#nIcon');
    titleInput.addEventListener('input', function () { iconBox.textContent = guessIcon(titleInput.value); });
    titleInput.focus();
    s.querySelector('#nSave').addEventListener('click', function () {
      var title = s.querySelector('#nTitle').value.trim();
      if (!title) { toast('Нужно название.'); return; }
      S.tasks.push({ id: uid(), title: title, date: dIn.value,
                     time: s.querySelector('#nTime').value || '', icon: guessIcon(title), done: false });
      save(); closeSheet();
      var when = dIn.value === dateKey(new Date()) ? 'на сегодня' : 'на ' + fromKey(dIn.value).getDate() + ' ' + MONTHS[fromKey(dIn.value).getMonth()];
      toast('Добавлено ' + when + '.');
      if (dIn.value === vKey()) renderToday(); else { view = fromKey(dIn.value); renderToday(); }
    });
  });

  /* ── Календарь ────────────────────────────────────────────────────── */
  function dayPct(date) {
    var dk = dateKey(date), m = S.done[dk] || [];
    if (!m.length && dk >= dateKey(new Date())) return null;
    var t = tally(date);
    return t.pct;
  }
  function renderCal() {
    el.calTitle.textContent = MONTHS_FULL[calMonth.getMonth()] + ' ' + calMonth.getFullYear();
    el.calGrid.innerHTML = '';
    var dow = S.weekMon ? ['пн','вт','ср','чт','пт','сб','вс'] : ['вс','пн','вт','ср','чт','пт','сб'];
    dow.forEach(function (d) { var c = document.createElement('div'); c.className = 'cal-dow'; c.textContent = d; el.calGrid.appendChild(c); });

    var first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    var shift = S.weekMon ? (first.getDay() + 6) % 7 : first.getDay();
    var start = new Date(first); start.setDate(1 - shift);
    var tk = dateKey(new Date()), sk = vKey();
    var sum = 0, cnt = 0, goals = 0;

    for (var i = 0; i < 42; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var k = dateKey(d), inMonth = d.getMonth() === calMonth.getMonth();
      var p = (S.done[k] && S.done[k].length) || k < tk ? tally(d).pct : null;
      var used = S.done[k] && S.done[k].length;
      if (inMonth && k <= tk && used) { sum += p; cnt++; if (p >= S.goal) goals++; }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cal-cell' + (inMonth ? '' : ' out') + (k === tk ? ' today' : '') + (k === sk ? ' sel' : '') + (p !== null && p >= S.goal ? ' goal' : '');
      b.innerHTML = '<span class="ring" style="--p:' + (p || 0) + '"></span><span>' + d.getDate() + '</span>';
      b.style.animationDelay = Math.min(i * 9, 260) + 'ms';
      if (tasksOn(k).length) b.appendChild(document.createElement('i'));
      (function (dd) { b.addEventListener('click', function () { view = dd; renderCal(); renderDayCard(); }); })(d);
      el.calGrid.appendChild(b);
    }
    el.gv.value = S.goal; el.wm.checked = S.weekMon;
    el.stStreak.textContent = streakDays();
    el.stAvg.textContent = cnt ? Math.round(sum / cnt) + '%' : '—';
    el.stGoal.textContent = goals;
    renderHeat();
    renderInsights();
    renderDayCard();
    var L = petLevel();
    el.stGoal.title = 'Уровень питомца: ' + L.stage.name;
  }
  /* ══ Зеркало ════════════════════════════════════════════════════════
     Не оценка, а наблюдения: в какой день и в какое время дела утекают,
     какая привычка проседает и что ты сам назвал причиной.             */
  function insights() {
    var out = [], days = [], d = new Date();
    for (var i = 0; i < 30; i++) {
      var k = dateKey(d);
      if (S.done[k] && S.done[k].length) days.push({ k: k, date: new Date(d), t: tally(new Date(d)) });
      d.setDate(d.getDate() - 1);
    }
    if (days.length < 3) return [{ b: 'Пока мало данных', s: 'Нужно ещё ' + (3 - days.length) + ' ' + plural(3 - days.length, 'день', 'дня', 'дней') + ' с отметками. Потом я покажу, где именно у тебя утекает время.' }];

    var byDow = {}, lateMin = [], total = 0, miss = 0;
    days.forEach(function (x) {
      var w = x.date.getDay();
      if (!byDow[w]) byDow[w] = { sum: 0, n: 0 };
      byDow[w].sum += x.t.pct; byDow[w].n++;
      total += x.t.units; miss += x.t.miss;
      x.t.day.forEach(function (b) {
        if (isCheckable(b) && statusOf(b, x.k, x.t.nk, x.t.nowMin) === 'missed') lateMin.push(b.from);
      });
    });

    var worst = null, best = null;
    Object.keys(byDow).forEach(function (w) {
      var avg = byDow[w].sum / byDow[w].n;
      if (!worst || avg < worst.avg) worst = { w: Number(w), avg: avg };
      if (!best || avg > best.avg) best = { w: Number(w), avg: avg };
    });
    if (worst && best && worst.w !== best.w)
      out.push({ b: 'Худший день недели — ' + DAYS[worst.w], s: 'В среднем ' + Math.round(worst.avg) + '%, тогда как в ' + DAYS[best.w] + ' — ' + Math.round(best.avg) + '%. Разница в ' + Math.round(best.avg - worst.avg) + ' пунктов держится ' + days.length + ' ' + plural(days.length, 'день', 'дня', 'дней') + '.' });

    if (lateMin.length >= 3) {
      var after = lateMin.filter(function (m) { return m >= 1200; }).length;
      var share = Math.round((after / lateMin.length) * 100);
      out.push({ b: 'Дела теряются ' + (share >= 60 ? 'вечером' : share <= 25 ? 'днём' : 'в разное время'),
        s: share + '% упущенного приходится на время после 20:00. Средняя потеря — ' + (miss / days.length).toFixed(1) + ' ' + plural(Math.round(miss / days.length), 'дело', 'дела', 'дел') + ' в день.' });
    }

    var worstHab = null;
    S.habits.forEach(function (h) {
      var hit = 0, cap = 0;
      days.forEach(function (x) { hit += Math.min(h.times, h.log[x.k] || 0); cap += h.times; });
      var r = cap ? hit / cap : 0;
      if (!worstHab || r < worstHab.r) worstHab = { h: h, r: r };
    });
    if (worstHab && worstHab.r < .8)
      out.push({ b: 'Слабая привычка — ' + worstHab.h.title.toLowerCase(), s: 'Закрыта на ' + Math.round(worstHab.r * 100) + '% от нормы за ' + days.length + ' ' + plural(days.length, 'день', 'дня', 'дней') + '. Либо норма завышена, либо ей не хватает места в дне.' });

    var cnt = {};
    Object.keys(S.review).forEach(function (k) {
      Object.keys(S.review[k]).forEach(function (id) {
        var r = S.review[k][id]; if (r && r !== true) cnt[r] = (cnt[r] || 0) + 1;
      });
    });
    var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
    if (top) {
      var label = { late: 'не успеваю', forgot: 'забываю', skip: 'не хочу' }[top];
      var fix = { late: 'Значит, план плотнее, чем реальный день — сдвинь время в настройках, а не терпи.',
                  forgot: 'Это лечится напоминаниями, а не силой воли. Включи их в настройках.',
                  skip: 'Это честно. Тогда либо это дело не нужно, либо его надо ставить на раннее время, пока есть силы.' }[top];
      out.push({ b: 'Ты сам чаще всего говоришь: «' + label + '»', s: cnt[top] + ' ' + plural(cnt[top], 'раз', 'раза', 'раз') + ' из разборов. ' + fix });
    }

    var fmin = 0, fq = 0;
    Object.keys(S.focus).forEach(function (k) { fmin += S.focus[k].min || 0; fq += S.focus[k].quits || 0; });
    if (fmin) out.push({ b: 'Фокус: ' + human(fmin) + ' за всё время', s: fq ? 'Из них ' + fq + ' ' + plural(fq, 'раз', 'раза', 'раз') + ' ты выходил раньше конца.' : 'Ни одного досрочного выхода. Это редкость.' });

    return out.length ? out : [{ b: 'Пока ровно', s: 'Заметных перекосов в данных нет. Продолжай — через неделю картина станет точнее.' }];
  }
  function renderInsights() {
    el.insights.innerHTML = '';
    var L = petLevel();
    var level = {
      b: 'Питомец: ' + L.stage.name + (L.stage.crest ? ' ' + L.stage.crest : ''),
      s: (L.next
        ? 'До «' + L.next.name + '» — ещё ' + L.toNext + ' ' + plural(L.toNext, 'день', 'дня', 'дней') + ' на ' + S.goal + '%.'
        : 'Выше уровня нет.') + (L.weak ? ' Сейчас ослаб: три дня подряд ниже 40%.' : '')
    };
    [level].concat(insights()).forEach(function (x, i) {
      var c = document.createElement('div');
      c.className = 'insight glass'; c.style.animationDelay = (i * 70) + 'ms';
      c.innerHTML = '<b></b><small></small>';
      c.querySelector('b').textContent = x.b;
      c.querySelector('small').textContent = x.s;
      el.insights.appendChild(c);
    });
  }

  function renderHeat() {
    el.heat.innerHTML = '';
    var best = 0, d = new Date(); d.setDate(d.getDate() - 13);
    for (var i = 0; i < 14; i++) {
      var k = dateKey(d);
      var p = (S.done[k] && S.done[k].length) || k < dateKey(new Date()) ? tally(new Date(d)).pct : 0;
      best = Math.max(best, p);
      var c = document.createElement('i');
      c.style.background = p ? 'rgba(170,207,36,' + (0.3 + 0.7 * (p / 100)) + ')' : 'rgba(21,24,19,.1)';
      c.title = k + ' — ' + p + '%';
      el.heat.appendChild(c);
      d.setDate(d.getDate() + 1);
    }
    el.heatMeta.textContent = 'лучший день ' + best + '%';
  }
  function renderDayCard() {
    var t = tally(view), d = view, tk = dateKey(new Date());
    var tasks = tasksOn(t.dk);
    var head = (t.dk === tk ? 'Сегодня' : DAYS[d.getDay()][0].toUpperCase() + DAYS[d.getDay()].slice(1)) + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
    var future = t.dk > tk;
    var planned = t.day.filter(isCheckable).length;
    el.dayCard.innerHTML =
      '<small class="cap">' + head + '</small>' +
      (future
        ? '<div style="font-size:15px;font-weight:700">Запланировано ' + planned + ' ' + plural(planned, 'дело', 'дела', 'дел') + ' и ' + S.habits.length + ' ' + plural(S.habits.length, 'привычка', 'привычки', 'привычек') + '.</div>'
        : '<div class="progress-top"><div class="progress-num"><span>' + t.pct + '</span><small>%</small></div>' +
          '<div class="progress-word">' + t.hit + ' сделано<br>' + (t.miss ? t.miss + ' упущено' : 'без потерь') + '</div></div>' +
          '<div class="bar"><i class="hit" style="width:' + t.pct + '%"></i><i class="miss" style="width:' + t.mpct + '%"></i></div>') +
      (tasks.length ? '<div style="margin-top:14px;font-size:13.5px;font-weight:700;color:var(--ink-soft)">Задачи: ' + tasks.map(function (x) { return esc(x.title); }).join(', ') + '</div>' : '') +
      '<button class="btn ghost" id="openDay" style="margin-top:16px">Открыть план дня</button>' +
      (future || !t.miss ? '' : '<button class="btn" id="openRev" style="margin-top:10px">Разбор дня</button>');
    el.dayCard.querySelector('#openDay').addEventListener('click', function () { go('today'); });
    var orv = el.dayCard.querySelector('#openRev');
    if (orv) orv.addEventListener('click', function () { openReview(t.dk); });
  }
  el.gv.addEventListener('change', function () { S.goal = Math.max(40, Math.min(100, Number(el.gv.value) || 80)); save(); renderCal(); });
  el.wm.addEventListener('change', function () { S.weekMon = el.wm.checked; save(); renderCal(); });
  el.calBack.addEventListener('click', function () { go('setup'); });
  el.calPrev.addEventListener('click', function () { calMonth.setMonth(calMonth.getMonth() - 1); renderCal(); });
  el.calNext.addEventListener('click', function () { calMonth.setMonth(calMonth.getMonth() + 1); renderCal(); });
  el.streak.addEventListener('click', function () { calMonth = new Date(view); go('cal'); });

  /* ── Настройки ────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.go === 'calfull') { calMonth = new Date(view); go('cal'); return; }
      openSub(b.dataset.go);
    });
  });
  el.setBack.addEventListener('click', function () { el.setSub.hidden = true; el.setRoot.hidden = false; });
  function openSub(name) { el.setRoot.hidden = true; el.setSub.hidden = false; renderSub(name); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function renderSub(name) {
    var b = el.subBody; b.innerHTML = '';
    if (name === 'day') {
      b.innerHTML = '<div class="sec-head"><span class="cap">Режим дня</span><small>по будням</small></div><div class="card glass" id="ff"></div>' +
        '<p class="empty">Пары подставляются из расписания университета. Остальное считается от них.</p>';
      var box = b.querySelector('#ff');
      FIELDS.forEach(function (f) {
        var row = document.createElement('div'); row.className = 'field';
        row.innerHTML = '<label for="f-' + f.key + '">' + f.label + '</label><input id="f-' + f.key + '" type="' + (f.type === 'time' ? 'time' : 'number') + '">';
        var inp = row.querySelector('input'); inp.value = S.cfg[f.key];
        if (f.type === 'num') { inp.min = 5; inp.max = 300; inp.step = 5; }
        inp.addEventListener('change', function () { S.cfg[f.key] = f.type === 'num' ? Number(inp.value) : inp.value; save(); });
        box.appendChild(row);
      });
    }
    if (name === 'sched') {
      b.innerHTML = '<div class="sec-head"><span class="cap">Расписание</span><small>по дням недели</small></div>' +
        '<div class="picks" id="dayPicks"></div><div class="list" id="pairs"></div>' +
        '<button class="btn ghost" id="addPair" style="margin-top:12px">Добавить пару</button>' +
        '<p class="empty">День без пар считается выходным: подъём, свободное время и привычки.</p>';
      var picks = b.querySelector('#dayPicks');
      [[1,'пн'],[2,'вт'],[3,'ср'],[4,'чт'],[5,'пт'],[6,'сб'],[0,'вс']].forEach(function (d) {
        var x = document.createElement('button');
        x.type = 'button'; x.className = 'pick' + (schedDay === d[0] ? ' on' : '');
        x.textContent = d[1] + ((S.sched[d[0]] || []).length ? ' · ' + S.sched[d[0]].length : '');
        x.addEventListener('click', function () { schedDay = d[0]; renderSub('sched'); });
        picks.appendChild(x);
      });
      var box = b.querySelector('#pairs');
      var list = S.sched[schedDay] || (S.sched[schedDay] = []);
      if (!list.length) box.innerHTML = '<p class="empty">В этот день пар нет.</p>';
      list.forEach(function (l, idx) {
        var card = document.createElement('div');
        card.className = 'card glass'; card.style.padding = '14px 16px'; card.style.marginBottom = '10px';
        card.innerHTML =
          '<div class="field" style="padding-top:0"><label>Предмет</label><input type="text" class="n" maxlength="40"></div>' +
          '<div class="field"><label>Начало</label><input type="time" class="f"></div>' +
          '<div class="field"><label>Конец</label><input type="time" class="t"></div>' +
          '<div class="field"><label>Аудитория</label><input type="text" class="r" maxlength="14"></div>' +
          '<button class="btn ghost del-pair" style="margin-top:10px;padding:10px;font-size:13px">Удалить пару</button>';
        var n = card.querySelector('.n'), f = card.querySelector('.f'), t2 = card.querySelector('.t'), r = card.querySelector('.r');
        n.value = l.name; f.value = l.from; t2.value = l.to; r.value = l.room || '';
        n.style.textAlign = 'right'; r.style.textAlign = 'right';
        [n, f, t2, r].forEach(function (inp) {
          inp.addEventListener('change', function () {
            l.name = n.value.trim() || 'Пара'; l.from = f.value || '08:30'; l.to = t2.value || '09:40'; l.room = r.value.trim();
            S.sched[schedDay].sort(function (a, c) { return toMin(a.from) - toMin(c.from); });
            save();
          });
        });
        card.querySelector('.del-pair').addEventListener('click', function () {
          S.sched[schedDay].splice(idx, 1); save(); renderSub('sched');
        });
        box.appendChild(card);
      });
      b.querySelector('#addPair').addEventListener('click', function () {
        var last = list[list.length - 1];
        var from = last ? toHm(toMin(last.to) + 15) : '08:30';
        list.push({ from: from, to: toHm(toMin(from) + 70), name: 'Новый предмет', room: '' });
        save(); renderSub('sched');
      });
    }
    if (name === 'hab') {
      b.innerHTML = '<div class="sec-head"><span class="cap">Привычки</span><small>цифра — раз в день</small></div><div class="list" id="hl"></div>' +
        '<div class="adder"><input type="text" id="hIco" class="tile mint ico" maxlength="4" value="🌱" aria-label="Значок">' +
        '<input type="text" id="hNew" placeholder="Новая привычка" maxlength="40">' +
        '<input type="number" id="hN" min="1" max="12" value="1"><button type="button" id="hAdd">+</button></div>' +
        '<p class="empty">Первые три видны на главном экране.</p>';
      var list = b.querySelector('#hl'), dk = dateKey(new Date());
      if (!S.habits.length) list.innerHTML = '<p class="empty">Пока пусто.</p>';
      S.habits.forEach(function (h) { list.appendChild(habRow(h, dk, true)); });
      b.querySelector('#hAdd').addEventListener('click', function () {
        var v = b.querySelector('#hNew').value.trim(); if (!v) return;
        var n = Math.max(1, Math.min(12, Number(b.querySelector('#hN').value) || 1));
        var ico = (b.querySelector('#hIco').value || '🌱').slice(0, 4);
        S.habits.push({ id: 'h' + uid(), title: v, icon: ico, times: n, log: {} });
        save(); renderSub('hab');
      });
    }
    if (name === 'notif') {
      var perm = ('Notification' in window) ? Notification.permission : 'unsupported';
      b.innerHTML = '<div class="sec-head"><span class="cap">Напоминания</span><small>питомец стучится сам</small></div>' +
        (perm === 'granted' ? '' : '<button class="btn" id="askPerm" style="margin-bottom:12px">' +
          (perm === 'denied' ? 'Запрещено — включи в настройках браузера' : 'Разрешить уведомления') + '</button>') +
        '<div class="card glass">' +
        '<div class="field"><label for="nOn">Напоминать</label><input type="checkbox" id="nOn" style="width:24px;height:24px;accent-color:#151813"></div>' +
        '<div class="field"><label for="nPre">За 10 минут до дела</label><input type="checkbox" id="nPre" style="width:24px;height:24px;accent-color:#151813"></div>' +
        '<div class="field"><label for="nWin">Когда начинается окно</label><input type="checkbox" id="nWin" style="width:24px;height:24px;accent-color:#151813"></div>' +
        '<div class="field"><label for="nEnd">Когда дело вот-вот закроется</label><input type="checkbox" id="nEnd" style="width:24px;height:24px;accent-color:#151813"></div>' +
        '<div class="field"><label for="nRev">Вечерний разбор</label><input type="checkbox" id="nRev" style="width:24px;height:24px;accent-color:#151813"></div>' +
        '<div class="field"><label for="nAt">Время разбора</label><input type="time" id="nAt"></div>' +
        '</div>' +
        '<button class="btn ghost" id="nTest" style="margin-top:4px">Проверить уведомление</button>' +
        '<p class="empty" style="text-align:left;line-height:1.5">Пока приложение живёт в браузере, напоминания приходят, когда оно открыто или недавно свёрнуто. ' +
        'Чтобы они приходили всегда, приложение нужно добавить на домашний экран айфона — это следующий шаг.</p>';
      var ask = b.querySelector('#askPerm');
      if (ask) ask.addEventListener('click', function () {
        if (!('Notification' in window)) { toast('Браузер не умеет уведомления.'); return; }
        Notification.requestPermission().then(function (r) {
          if (r === 'granted') { S.notif.on = true; save(); push('Готово', 'Теперь я буду напоминать.', 'hello'); }
          else toast('Разрешение не выдано.');
          renderSub('notif');
        });
      });
      [['nOn', 'on'], ['nPre', 'pre'], ['nWin', 'win'], ['nEnd', 'end'], ['nRev', 'rev']].forEach(function (pair) {
        var c = b.querySelector('#' + pair[0]); c.checked = !!S.notif[pair[1]];
        c.addEventListener('change', function () { S.notif[pair[1]] = c.checked; save(); el.notifSub.textContent = notifSub(); });
      });
      var at = b.querySelector('#nAt'); at.value = S.reviewAt;
      at.addEventListener('change', function () { S.reviewAt = at.value || '21:30'; save(); });
      b.querySelector('#nTest').addEventListener('click', function () {
        var n = new Date();
        push('Проверка', 'Так выглядит напоминание. Сейчас ' + toHm(n.getHours() * 60 + n.getMinutes()) + '.', 'test');
      });
    }
    if (name === 'link') {
      b.innerHTML = '<div class="sec-head"><span class="cap">Связь с Jarvis</span><small>бот в Telegram</small></div>' +
        '<div class="card glass">' +
        '<div class="field" style="padding-top:0"><label for="lUrl">Адрес сервера</label></div>' +
        '<input type="text" id="lUrl" placeholder="https://…up.railway.app" style="width:100%;font:inherit;font-weight:600;border:none;border-radius:13px;padding:11px 12px;background:rgba(255,255,255,.62)">' +
        '<div class="field"><label for="lTok">Ключ доступа</label></div>' +
        '<input type="password" id="lTok" placeholder="APP_ACCESS_TOKEN" style="width:100%;font:inherit;font-weight:600;border:none;border-radius:13px;padding:11px 12px;background:rgba(255,255,255,.62)">' +
        '</div>' +
        '<button class="btn" id="lTest" style="margin-bottom:10px">Проверить связь</button>' +
        '<button class="btn ghost" id="lPull" style="margin-bottom:18px">Забрать записи от Jarvis</button>' +
        '<div class="sec-head"><span class="cap">Резервная копия</span><small id="lAge">—</small></div>' +
        '<button class="btn" id="lSave" style="margin-bottom:10px">Сохранить копию сейчас</button>' +
        '<button class="btn ghost" id="lLoad">Восстановить из копии</button>' +
        '<p class="empty" style="text-align:left;line-height:1.5">Копия уходит сама при каждом изменении. ' +
        'Если очистишь историю Safari, открой приложение — оно вернёт данные само, пока ключ на месте. ' +
        'Если и ключ стёрся, попроси у Jarvis команду <b>/связь</b>: он пришлёт ссылку, которая вернёт всё одним нажатием.</p>' +
        '<p class="empty" id="lState" style="text-align:left;line-height:1.5">Через этот адрес бот видит твой день и кладёт сюда то, что ты ему наговорил. Ключ тот же, что в переменной APP_ACCESS_TOKEN на сервере.</p>';
      var u = b.querySelector('#lUrl'), k = b.querySelector('#lTok'), st = b.querySelector('#lState');
      u.value = S.link.url || ''; k.value = S.link.token || '';
      u.addEventListener('change', function () { S.link.url = u.value.trim(); save(); });
      k.addEventListener('change', function () { S.link.token = k.value.trim(); save(); });
      b.querySelector('#lTest').addEventListener('click', function () {
        S.link.url = u.value.trim(); S.link.token = k.value.trim(); save();
        if (!linked()) { st.textContent = 'Заполни адрес и ключ.'; return; }
        st.textContent = 'Проверяю…';
        fetch(S.link.url.replace(/\/$/, '') + '/api/health')
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var age = d['снимокМинутНазад'];
            st.textContent = 'Сервер отвечает. Снимок обновлялся ' +
              (age === null || age === undefined ? 'ни разу' : age + ' мин назад') + '.';
            sendSnapshot();
          })
          .catch(function () { st.textContent = 'Сервер не отвечает. Проверь адрес.'; });
      });
      b.querySelector('#lPull').addEventListener('click', function () {
        if (!linked()) { st.textContent = 'Сначала заполни адрес и ключ.'; return; }
        pullChanges(); st.textContent = 'Запрос отправлен.';
      });

      var age = b.querySelector('#lAge');
      var showAge = function () {
        if (!linked()) { age.textContent = 'связь не настроена'; return; }
        fetch(S.link.url.replace(/\/$/, '') + '/api/backups', { headers: linkHeaders() })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            var list = (d && d['копии']) || [];
            if (!list.length) { age.textContent = 'копий ещё нет'; return; }
            var last = list[0];
            age.textContent = whenText(last.savedAt) + ' · ' + (last['дней'] || 0) + ' ' +
              plural(last['дней'] || 0, 'день', 'дня', 'дней');
          })
          .catch(function () { age.textContent = 'сервер не отвечает'; });
      };
      showAge();
      b.querySelector('#lSave').addEventListener('click', function () {
        if (!linked()) { st.textContent = 'Сначала заполни адрес и ключ.'; return; }
        lastBackup = ''; sendBackup();
        setTimeout(showAge, 900);
        toast('Копия сохранена.');
      });
      b.querySelector('#lLoad').addEventListener('click', function () {
        if (!linked()) { st.textContent = 'Сначала заполни адрес и ключ.'; return; }
        /* Восстановление затирает то, что сейчас на телефоне, поэтому
           спрашиваем прямо — это единственное место, где оно уместно. */
        confirmSheet('Восстановить из копии?', 'То, что сейчас в приложении, заменится копией с сервера.', function () {
          restore(false);
        });
      });
    }
    if (name === 'data') {
      b.innerHTML = '<div class="sec-head"><span class="cap">Данные</span><small></small></div>' +
        '<button class="btn ghost" id="rDay" style="margin-bottom:10px">Сбросить сегодняшние отметки</button>' +
        '<button class="btn ghost" id="rAll">Стереть всё и начать заново</button>' +
        '<p class="empty">Всё хранится только на этом телефоне. Версия ' + VERSION + '.</p>';
      b.querySelector('#rDay').addEventListener('click', function () {
        var k = dateKey(new Date());
        S.done[k] = []; S.habits.forEach(function (h) { delete h.log[k]; });
        save(); toast('Сегодня сброшено.');
      });
      b.querySelector('#rAll').addEventListener('click', function () {
        S.done = {}; S.tasks = []; S.chat = []; S.habits.forEach(function (h) { h.log = {}; });
        save(); toast('Всё стёрто.'); renderSub('data');
      });
    }
    el.habCount.textContent = S.habits.length + ' ' + plural(S.habits.length, 'привычка', 'привычки', 'привычек');
    el.schedCount.textContent = schedCount();
    el.notifSub.textContent = notifSub();
    el.linkSub.textContent = linkSub();
  }
  function linkSub() {
    if (!linked()) return 'не настроена';
    return linkState === 'fail' ? 'настроена, сервер молчит' : 'настроена';
  }
  function notifSub() {
    if (!('Notification' in window)) return 'браузер не поддерживает';
    if (Notification.permission !== 'granted') return 'не разрешены';
    return S.notif.on ? 'включены' : 'разрешены, но выключены';
  }
  function schedCount() {
    var n = 0, days = 0;
    [1,2,3,4,5,6,0].forEach(function (d) { var k = (S.sched[d] || []).length; n += k; if (k) days++; });
    return n + ' ' + plural(n, 'пара', 'пары', 'пар') + ' на ' + days + ' ' + plural(days, 'день', 'дня', 'дней');
  }

  /* ── Чат ──────────────────────────────────────────────────────────── */
  var CHIPS = ['Что сейчас?', 'Успеваю ли я?', 'Что осталось?', 'Когда уроки?'];
  function renderChips() {
    el.chips.innerHTML = '';
    CHIPS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c;
      b.addEventListener('click', function () { ask(c); });
      b.style.animationDelay = (el.chips.children.length * 60) + 'ms';
      el.chips.appendChild(b);
    });
  }
  function bubble(role, html) {
    var d = document.createElement('div'); d.className = 'msg ' + role; d.innerHTML = html;
    el.thread.appendChild(d);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    return d;
  }
  function ask(q) {
    el.chips.hidden = true; el.chatHello.hidden = true;
    var me = bubble('me', ''); me.textContent = q;
    var wait = bubble('ai', '<span class="dotting"><i></i><i></i><i></i></span>');
    setTimeout(function () {
      var a = answer(q);
      wait.innerHTML = a;
      S.chat.push({ id: uid(), ts: Date.now(), q: q, a: a, pin: false, arch: false });
      save();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 520);
  }
  function answer(q) {
    var t = q.toLowerCase(), d = tally(new Date()), day = d.day, nowMin = d.nowMin;
    var live = day.find(function (b) { return !b.free && nowMin >= b.from && nowMin < b.to; });
    var next = day.find(function (b) { return !b.free && b.from > nowMin; });
    var missed = day.filter(function (b) { return isCheckable(b) && statusOf(b, d.dk, d.nk, nowMin) === 'missed'; });

    if (/привет|салам|здаров|хай|ассалом/.test(t))
      return 'На связи. Сделано <b>' + d.pct + '%</b>. ' + (live ? 'Сейчас — ' + live.name + '.' : 'Сейчас по плану пусто.');
    if (/сейчас|чем занят|что делаю|где я|что делать/.test(t))
      return live ? '<b>' + live.name + '</b> — до ' + toHm(live.to) + ', осталось ' + human(live.to - nowMin) + '.' + (next ? ' Дальше ' + next.name + ' в ' + toHm(next.from) + '.' : '')
        : next ? 'Сейчас свободно. Ближайшее — ' + next.name + ' в ' + toHm(next.from) + '.' : 'На сегодня всё.';
    if (/дальше|потом|следующ/.test(t))
      return next ? '<b>' + next.name + '</b> в ' + toHm(next.from) + ', через ' + human(next.from - nowMin) + '.' : 'Дальше ничего — день закрыт.';
    if (/успева|отста|как я|норм/.test(t))
      return missed.length ? 'Нет. Упущено <b>' + missed.length + '</b>: ' + missed.map(function (b) { return b.name; }).join(', ') + '. Вернуть нельзя, но остальное ещё твоё.'
        : 'Да, идёшь ровно. Сделано ' + d.pct + '%, потерь нет.';
    if (/остал|сколько.*дел|не сделал/.test(t)) {
      var left = day.filter(function (b) { return isCheckable(b) && statusOf(b, d.dk, d.nk, nowMin) === 'open' || (isCheckable(b) && statusOf(b, d.dk, d.nk, nowMin) === 'early'); });
      var hl = S.habits.filter(function (h) { return (h.log[d.dk] || 0) < h.times; });
      return 'Впереди <b>' + left.length + '</b> ' + plural(left.length, 'дело', 'дела', 'дел') +
        (left.length ? ': ' + left.slice(0, 4).map(function (b) { return b.name; }).join(', ') : '') +
        (hl.length ? '. Привычки: ' + hl.map(function (h) { return h.title + ' ' + (h.log[d.dk] || 0) + '/' + h.times; }).join(', ') : '') + '.';
    }
    if (/урок|учёб|учеб|домашк|пары|пара|универ/.test(t)) {
      var st = day.find(function (b) { return b.kind === 'study'; });
      var ls = day.filter(function (b) { return b.kind === 'lesson'; });
      return (ls.length ? 'Пары: ' + ls.map(function (b) { return b.name + ' в ' + toHm(b.from); }).join(', ') + '. ' : 'Пар сегодня нет. ') +
        (st ? 'Уроки по плану — <b>' + toHm(st.from) + '</b>, ' + human(st.to - st.from) + '.' : '');
    }
    if (/окно|свободн|перерыв/.test(t)) {
      var w = day.filter(function (b) { return b.kind === 'window' || b.kind === 'free'; });
      return w.length ? 'Свободное: ' + w.map(function (b) { return toHm(b.from) + '–' + toHm(b.to) + ' (' + human(b.to - b.from) + ')'; }).join(', ') + '. Уроки лучше туда.' : 'Окон сегодня нет.';
    }
    if (/привыч/.test(t)) return S.habits.map(function (h) { return h.title + ' — ' + (h.log[d.dk] || 0) + '/' + h.times; }).join('<br>') || 'Привычек нет.';
    if (/задач/.test(t)) {
      var ts = tasksOn(d.dk);
      return ts.length ? 'Задачи на сегодня:<br>' + ts.map(function (x) { return (x.done ? '✓ ' : '• ') + esc(x.title) + (x.time ? ' в ' + x.time : ''); }).join('<br>') : 'Задач нет. Добавь плюсом на главном экране.';
    }
    if (/спать|сон|отбой/.test(t)) return 'Отбой в <b>' + S.cfg.sleep + '</b>, через ' + human(toMin(S.cfg.sleep) - nowMin) + '.';
    if (/прогресс|процент|сделал/.test(t)) return 'Сделано <b>' + d.pct + '%</b> — ' + d.hit + ' из ' + d.units + (d.miss ? ', упущено ' + d.miss : '') + '.';
    return 'Я отвечаю про день: что сейчас, что дальше, успеваешь ли, что осталось, пары, окна, привычки, задачи, отбой. Голосовой Jarvis подключится, когда вернём ключ.';
  }
  el.chatSend.addEventListener('click', function () {
    var v = el.chatInput.value.trim(); if (!v) return;
    el.chatInput.value = ''; ask(v);
  });
  el.chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') el.chatSend.click(); });

  /* История: по дням, с закреплением, архивом и удалением. */
  var histMode = 'all';
  el.toHist.addEventListener('click', function () { el.chatLive.hidden = true; el.chatHist.hidden = false; el.composer.hidden = true; renderHist(); window.scrollTo({ top: 0 }); });
  el.histBack.addEventListener('click', function () { el.chatHist.hidden = true; el.chatLive.hidden = false; el.composer.hidden = false; });

  function renderHist() {
    el.histTabs.innerHTML = '';
    [['all', 'Все'], ['pin', 'Закреплённые'], ['arch', 'Архив']].forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pick' + (histMode === p[0] ? ' on' : ''); b.textContent = p[1];
      b.addEventListener('click', function () { histMode = p[0]; renderHist(); });
      el.histTabs.appendChild(b);
    });

    var items = S.chat.filter(function (c) {
      return histMode === 'pin' ? c.pin : histMode === 'arch' ? c.arch : !c.arch;
    }).sort(function (a, b) { return (b.pin - a.pin) || (b.ts - a.ts); });

    el.histBody.innerHTML = '';
    if (!items.length) { el.histBody.innerHTML = '<p class="empty">Здесь пока пусто.</p>'; return; }

    var lastDay = '';
    items.forEach(function (c) {
      var d = new Date(c.ts), k = dateKey(d);
      var label = k === dateKey(new Date()) ? 'Сегодня' : DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
      if (c.pin && histMode === 'all') label = 'Закреплённое';
      if (label !== lastDay) {
        var sep = document.createElement('div'); sep.className = 'day-sep'; sep.textContent = label;
        el.histBody.appendChild(sep); lastDay = label;
      }
      var card = document.createElement('div');
      card.className = 'hist glass' + (c.pin ? ' pin' : '');
      card.innerHTML = '<div class="q"></div><div class="a">' + c.a + '</div>' +
        '<div class="acts"><button type="button" class="p">📌 ' + (c.pin ? 'Открепить' : 'Закрепить') + '</button>' +
        '<button type="button" class="r">🗄 ' + (c.arch ? 'Вернуть' : 'В архив') + '</button>' +
        '<button type="button" class="x">✕ Удалить</button></div>';
      card.querySelector('.q').textContent = c.q;
      card.querySelector('.p').addEventListener('click', function () { c.pin = !c.pin; save(); renderHist(); });
      card.querySelector('.r').addEventListener('click', function () { c.arch = !c.arch; save(); renderHist(); });
      card.querySelector('.x').addEventListener('click', function () {
        S.chat = S.chat.filter(function (x) { return x.id !== c.id; }); save(); renderHist();
      });
      el.histBody.appendChild(card);
    });
  }

  /* ══ Напоминания ═══════════════════════════════════════════════════
     Главное изменение уровня 2: не ты вспоминаешь о приложении, а оно
     о тебе. Каждое событие стреляет один раз за день — отметка об этом
     лежит на диске, чтобы перезагрузка не повторяла одно и то же.     */
  function push(title, body, tag) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: body, tag: tag });
        return true;
      }
    } catch (e) {}
    if (!document.hidden) toast(title + ' — ' + body);
    return false;
  }
  function checkNotify() {
    if (!S.notif.on) return;
    var now = new Date(), dk = dateKey(now), nowMin = now.getHours() * 60 + now.getMinutes();
    if (!S.fired[dk]) S.fired[dk] = {};
    var f = S.fired[dk], t = tally(now), hit = false;
    var within = function (at) { return nowMin >= at && nowMin < at + 2; };

    t.day.forEach(function (b) {
      if (b.free) return;
      if (S.notif.pre && isCheckable(b) && within(b.from - 10) && !f['p' + b.id]) {
        f['p' + b.id] = 1; hit = true;
        push('Через 10 минут: ' + b.name, toHm(b.from) + ' — ' + toHm(b.to) + '. Собирайся.', 'p' + b.id);
      }
      if (S.notif.win && b.kind === 'window' && within(b.from) && !f['w' + b.id]) {
        f['w' + b.id] = 1; hit = true;
        push('Окно ' + human(b.to - b.from), 'До ' + toHm(b.to) + '. Сделай уроки сейчас — вечером их не будет.', 'w' + b.id);
      }
      if (S.notif.end && isCheckable(b) && within(b.to) && t.m.indexOf(b.id) < 0 && !f['e' + b.id]) {
        f['e' + b.id] = 1; hit = true;
        push(b.name + ' закрывается', 'Отметить можно до ' + toHm(b.to + GRACE) + ', дальше дело уйдёт.', 'e' + b.id);
      }
    });

    if (S.notif.rev && within(toMin(S.reviewAt)) && !f.rev && !(S.review[dk] && S.review[dk].closed)) {
      f.rev = 1; hit = true;
      push('Разбор дня', t.miss ? 'Упущено ' + t.miss + '. Отметь причину — это займёт минуту.' : 'Закрыто ' + t.pct + '%. Подведём итог.', 'rev');
    }

    var cut = dateKey(new Date(Date.now() - 3 * 864e5));
    Object.keys(S.fired).forEach(function (k) { if (k < cut) delete S.fired[k]; });
    if (hit) save();
  }
  setInterval(checkNotify, 30000);

  /* ══ Связь с Jarvis ════════════════════════════════════════════════
     Приложение держит данные у себя в браузере, поэтому бот не может
     писать в него напрямую. Обмен идёт через сервер: сюда уходит снимок
     дня, оттуда забирается очередь того, что надиктовано боту.        */
  /* Адрес сервера не секрет — секрет только ключ. Держим его в коде,
     чтобы восстановление после очистки Safari требовало одного ключа. */
  var DEFAULT_SERVER = 'https://jarvis-production-d62d.up.railway.app';
  var linkState = 'idle';
  function linked() { return !!(S.link && S.link.url && S.link.token); }
  function linkHeaders() { return { 'content-type': 'application/json', authorization: 'Bearer ' + S.link.token }; }

  /** Что бот должен знать о дне. Отправляем словами — так модель читает лучше. */
  function dayDigest() {
    var t = tally(new Date());
    var fmt = function (b) {
      var st = statusOf(b, t.dk, t.nk, t.nowMin);
      var mark = !isCheckable(b) ? '' : st === 'done' ? ' — сделано' : st === 'missed' ? ' — упущено' : '';
      return toHm(b.from) + '–' + toHm(b.to) + ' ' + b.name + (b.room ? ' (ауд. ' + b.room + ')' : '') + mark;
    };
    var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      день: t.dk,
      процент: t.pct,
      сделано: t.hit,
      всего: t.units,
      упущено: t.miss,
      routine: t.day.map(fmt),
      blocks: t.day.map(function (b) {
        return {
          from: toHm(b.from), to: toHm(b.to), name: b.name, kind: b.kind,
          отмечено: isCheckable(b) ? statusOf(b, t.dk, t.nk, t.nowMin) : 'auto'
        };
      }),
      routineTomorrow: buildDay(tomorrow).map(function (b) { return toHm(b.from) + '–' + toHm(b.to) + ' ' + b.name; }),
      tasks: S.tasks.filter(function (x) { return x.date >= t.dk; })
        .map(function (x) { return x.title + (x.time ? ' в ' + x.time : '') + ' (' + x.date + ')' + (x.done ? ' — сделано' : ''); }),
      habits: S.habits.map(function (h) { return h.title + ' ' + (h.log[t.dk] || 0) + '/' + h.times; }),
      notes: S.notes.slice(-10).map(function (n) { return n.body; }),
      отбой: S.cfg.sleep
    };
  }

  var syncTimer = null, lastSent = '';
  function syncSoon(now) {
    if (!linked()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(sendSnapshot, now ? 0 : 4000);
  }
  function sendSnapshot() {
    if (!linked()) return;
    var body = JSON.stringify(dayDigest());
    if (body === lastSent) return;
    fetch(S.link.url.replace(/\/$/, '') + '/api/snapshot', {
      method: 'POST', headers: linkHeaders(), body: body
    }).then(function (r) {
      if (r.ok) { lastSent = body; linkState = 'ok'; } else linkState = 'fail';
    }).catch(function () { linkState = 'fail'; });
    sendWidgetDay();
  }

  /* Виджету на айфоне день может прийти двумя путями: через общий ящик
     на устройстве или, если Apple его не дала, через этот сервер.
     Второй путь не стоит ничего, поэтому держим его всегда открытым. */
  var widgetSent = '';
  function sendWidgetDay() {
    if (!linked()) return;
    var body = JSON.stringify(nativeDay());
    if (body === widgetSent) return;
    fetch(S.link.url.replace(/\/$/, '') + '/api/widget', {
      method: 'POST', headers: linkHeaders(), body: body
    }).then(function (r) { if (r.ok) widgetSent = body; }).catch(function () {});
  }

  /* ── Мост в приложение на айфоне ──────────────────────────────────
     Внутри нативной обёртки страница отдаёт снимок дня виджету и живому
     уведомлению, а обратно получает отметки, сделанные кнопкой в виджете.
     В обычном Safari моста нет, и весь этот кусок просто молчит. */

  function nativeBridge() {
    return window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.kamron;
  }

  /* Виджету хватает шести настроений: на иконке размером с ноготь
     разница между «устал» и «задумался» всё равно не видна. */
  function widgetMood(t) {
    if (t.nowMin >= toMin(S.cfg.sleep) || t.nowMin < toMin(S.cfg.wake)) return 'sleep';
    if (t.miss >= 3) return 'angry';
    if (t.miss >= 1) return 'worry';
    if (t.pct >= 80) return 'happy';
    var live = t.day.find(function (b) { return !b.free && t.nowMin >= b.from && t.nowMin < b.to; });
    return live ? 'focus' : 'calm';
  }

  function nativeDay() {
    var t = tally(new Date());
    return {
      dateKey: t.dk,
      updatedAt: Date.now() / 1000,
      pct: t.pct,
      missed: t.miss,
      mood: widgetMood(t),
      /* Дела без времени виджету не нужны: он показывает «что сейчас»,
         а у них никакого «сейчас» нет. */
      blocks: t.day.filter(function (b) { return !b.free; }).map(function (b) {
        return {
          id: b.id,
          title: b.name,
          icon: b.icon || '',
          from: b.from,
          to: b.to,
          status: isCheckable(b) ? statusOf(b, t.dk, t.nk, t.nowMin) : 'open'
        };
      })
    };
  }

  var natTimer = null, natLast = '';
  function nativeSoon(now) {
    if (!nativeBridge()) return;
    clearTimeout(natTimer);
    natTimer = setTimeout(nativeSend, now ? 0 : 1200);
  }
  function nativeSend() {
    var bridge = nativeBridge();
    if (!bridge) return;
    var day = nativeDay(), body = JSON.stringify(day);
    if (body === natLast) return;
    natLast = body;
    try { bridge.postMessage({ kind: 'day', day: day }); } catch (e) {}
  }

  /* Отметки из виджета. Виджет ничего не решает сам — он только
     передаёт нажатие, а честность времени проверяется здесь, по тем же
     правилам, что и в самом приложении. Нажатие, сделанное после того
     как дело прошло, не засчитывается: иначе блокировку можно было бы
     обойти через виджет. */
  function applyWidgetMark(mk) {
    if (!mk || !mk.id || !mk.dateKey) return false;
    var when = new Date((mk.at || 0) * 1000);
    if (dateKey(when) !== mk.dateKey) return false;
    var whenMin = when.getHours() * 60 + when.getMinutes();
    var day = buildDay(new Date(mk.dateKey + 'T12:00:00'));
    var b = day.find(function (x) { return x.id === mk.id; });
    if (!b || !isCheckable(b)) return false;
    if (whenMin < b.from || whenMin > b.to + GRACE) return false;
    var m = marks(mk.dateKey);
    if (m.indexOf(b.id) >= 0) return false;
    m.push(b.id);
    if (b.taskId) {
      var tk = S.tasks.find(function (x) { return x.id === b.taskId; });
      if (tk) tk.done = true;
    }
    return true;
  }

  /* Первый запуск в сборке из Xcode: у приложения своё хранилище, и оно
     пустое. Оболочка передаёт сюда ключ, и страница молча возвращает всё
     из последней копии — иначе человеку пришлось бы вбивать адрес и ключ
     руками в настройках, а это ровно тот шаг, на котором бросают. */
  window.kamronLink = function (url, token) {
    if (!url || !token || linked()) return false;
    S.link = { url: String(url), token: String(token) };
    save();
    restore(true).then(function (back) {
      if (back) toast('Данные вернулись из копии.');
      pullSoon();
      syncSoon(true);
      nativeSoon(true);
    });
    return true;
  };

  window.kamronApply = function (list) {
    if (!list || !list.length) return;
    var changed = false;
    list.forEach(function (mk) { if (applyWidgetMark(mk)) changed = true; });
    if (!changed) return;
    save();
    renderToday();
    syncSoon();
    backupSoon();
    Pet.flash('cheer', 'Отметил с виджета — засчитано.', 2600);
  };

  /** Забирает то, что надиктовано боту, применяет и подтверждает. */
  function pullChanges() {
    if (!linked()) return;
    fetch(S.link.url.replace(/\/$/, '') + '/api/changes', { headers: linkHeaders() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var list = (data && (data['изменения'] || data.changes)) || [];
        if (!list.length) return;
        var done = [];
        list.forEach(function (change) {
          if (applyChange(change)) done.push(change.id);
        });
        if (!done.length) return;
        save();
        fetch(S.link.url.replace(/\/$/, '') + '/api/changes/ack', {
          method: 'POST', headers: linkHeaders(), body: JSON.stringify({ ids: done })
        }).catch(function () {});
        toast('Из Jarvis: ' + done.length + ' ' + plural(done.length, 'запись', 'записи', 'записей'));
        // Перерисовываем всегда: записи могли прийти, пока открыт другой раздел.
        renderToday();
      })
      .catch(function () {});
  }

  function nextDateFor(days) {
    // Повторяющееся дело приложение не умеет, поэтому ставим ближайший раз.
    var d = new Date();
    for (var i = 0; i < 8; i++) {
      var w = d.getDay() === 0 ? 7 : d.getDay();
      if (days.indexOf(w) >= 0) return dateKey(d);
      d.setDate(d.getDate() + 1);
    }
    return dateKey(new Date());
  }

  function applyChange(change) {
    var kind = change && change.kind, p = (change && change.data) || {};
    if (kind === 'task' || kind === 'routine') {
      var title = String(p.title || '').trim();
      if (!title) return false;
      var date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date
        : (p.days && p.days.length ? nextDateFor(p.days) : dateKey(new Date()));
      var time = /^\d{2}:\d{2}$/.test(p.time || '') ? p.time : '';
      var twin = S.tasks.some(function (x) { return x.title === title && x.date === date && x.time === time; });
      if (!twin) S.tasks.push({
        id: uid(), title: title, date: date, time: time,
        icon: (p.icon && String(p.icon).slice(0, 4)) || guessIcon(title), done: false
      });
      return true;
    }
    if (kind === 'note') {
      var body = String(p.body || '').trim();
      if (!body) return false;
      S.notes.push({ id: uid(), ts: Date.now(), body: body });
      S.notes = S.notes.slice(-50);
      return true;
    }
    if (kind === 'mark') {
      return applyWidgetMark({ id: p.id, dateKey: p.dateKey, at: p.at });
    }
    if (kind === 'complete') {
      var want = String(p.title || '').trim().toLowerCase();
      if (!want) return false;
      var dk = dateKey(new Date()), m = marks(dk), hit = false;
      buildDay(new Date()).forEach(function (b) {
        if (!hit && isCheckable(b) && b.name.toLowerCase().indexOf(want) >= 0 && m.indexOf(b.id) < 0) {
          m.push(b.id); hit = true;
        }
      });
      S.tasks.forEach(function (x) {
        if (!hit && x.date === dk && x.title.toLowerCase().indexOf(want) >= 0 && !x.done) {
          x.done = true; m.push('task-' + x.id); hit = true;
        }
      });
      return hit;
    }
    return false;
  }

  function confirmSheet(title, text, onYes) {
    closeSheet();
    var v = document.createElement('div'); v.className = 'veil'; v.addEventListener('click', closeSheet);
    var sh = document.createElement('div'); sh.className = 'sheet';
    sh.innerHTML = '<div class="grab"></div><h3></h3>' +
      '<p style="margin:-8px 0 18px;font-size:14px;font-weight:600;color:var(--ink-soft);line-height:1.5"></p>' +
      '<button class="btn" id="cYes" style="margin-bottom:10px">Да</button>' +
      '<button class="btn ghost" id="cNo">Отмена</button>';
    sh.querySelector('h3').textContent = title;
    sh.querySelector('p').textContent = text;
    document.body.appendChild(v); document.body.appendChild(sh); sheetNode = sh;
    sh.querySelector('#cYes').addEventListener('click', function () { closeSheet(); onYes(); });
    sh.querySelector('#cNo').addEventListener('click', closeSheet);
  }

  /* ══ Резервная копия ═══════════════════════════════════════════════
     История Safari стирается одним движением, и вместе с ней ушло бы всё
     накопленное. Поэтому состояние целиком уезжает на сервер при каждом
     сохранении, а пустое приложение само забирает копию обратно.      */
  var backupTimer = null, lastBackup = '';

  function backupSoon(now) {
    if (!linked()) return;
    clearTimeout(backupTimer);
    backupTimer = setTimeout(sendBackup, now ? 0 : 10000);
  }
  function sendBackup() {
    if (!linked()) return;
    var body = JSON.stringify(S);
    if (body === lastBackup) return;
    fetch(S.link.url.replace(/\/$/, '') + '/api/backup', {
      method: 'POST', headers: linkHeaders(), body: body
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) lastBackup = body; })
      .catch(function () {});
  }

  /** Состояние считается пустым, когда в нём нет ничего своего. */
  function blank() {
    var marks = Object.keys(S.done || {}).some(function (k) { return (S.done[k] || []).length; });
    var habitLog = (S.habits || []).some(function (h) { return Object.keys(h.log || {}).length; });
    return !marks && !habitLog && !(S.tasks || []).length && !(S.notes || []).length && !(S.chat || []).length;
  }

  function whenText(iso) {
    try {
      return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '—'; }
  }

  function restore(silent) {
    if (!linked()) return Promise.resolve(false);
    return fetch(S.link.url.replace(/\/$/, '') + '/api/backup', { headers: linkHeaders() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var copy = d && d.state;
        if (!copy || typeof copy !== 'object') return false;
        var link = S.link;           // ключ берём свой: копия могла быть снята до его ввода
        Object.keys(copy).forEach(function (key) { S[key] = copy[key]; });
        S.link = link;
        lastBackup = '';
        save();
        renderToday();
        if (!silent) toast('Восстановлено из копии от ' + whenText(d.savedAt) + '.');
        return true;
      })
      .catch(function () { return false; });
  }

  /* Ключ можно передать ссылкой: открыл — и приложение само вернуло всё.
     Из адреса он сразу убирается, чтобы не остаться в истории. */
  function bootstrapLink() {
    var key = /[#&]k=([^&]*)/.exec(location.hash || '');
    if (!key || !key[1]) return false;
    var server = /[#&]s=([^&]*)/.exec(location.hash || '');
    S.link = {
      url: server ? decodeURIComponent(server[1]) : S.link.url || DEFAULT_SERVER,
      token: decodeURIComponent(key[1])
    };
    save();
    try { history.replaceState(null, '', location.pathname + '#today'); } catch (e) {}
    return true;
  }

  /* ── Навигация ────────────────────────────────────────────────────── */
  function go(name) {
    tab = name; closeSheet();
    el.viewToday.hidden = name !== 'today';
    el.viewChat.hidden = name !== 'chat';
    el.viewCal.hidden = name !== 'cal';
    el.viewSetup.hidden = name !== 'setup';
    el.composer.hidden = !(name === 'chat' && el.chatHist.hidden);
    [['today', el.navToday], ['chat', el.navChat], ['setup', el.navSetup]].forEach(function (p) {
      p[1].classList.toggle('active', p[0] === name || (name === 'cal' && p[0] === 'setup'));
    });
    if (name === 'today') { renderToday(); pullSoon(); }
    if (name === 'cal') renderCal();
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
    if (name === 'setup') { el.setSub.hidden = true; el.setRoot.hidden = false;
      el.linkSub.textContent = linkSub(); el.notifSub.textContent = notifSub(); el.schedCount.textContent = schedCount(); el.habCount.textContent = S.habits.length + ' ' + plural(S.habits.length, 'привычка', 'привычки', 'привычек'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  el.navToday.addEventListener('click', function () { view = new Date(); go('today'); });
  el.navChat.addEventListener('click', function () { go('chat'); });
  el.navSetup.addEventListener('click', function () { go('setup'); });

  /* ── Запуск ───────────────────────────────────────────────────────── */
  load();
  renderChips();

  /* Адрес запоминает вкладку: ярлыки с домашнего экрана ведут прямо в неё.
     День считается при старте всегда, даже если открыт другой раздел. */
  var TABS = { '#chat': 'chat', '#cal': 'cal', '#setup': 'setup', '#today': 'today' };
  /* Записи от бота забираются при открытии и при возврате в приложение,
     но не чаще раза в минуту — сервер считает запросы. Объявлено до первого
     вызова: иначе присваивание обнулит отметку уже после неё, и запрос
     уйдёт дважды подряд. */
  var lastPull = 0;
  function pullSoon() {
    if (!linked() || Date.now() - lastPull < 60000) return;
    lastPull = Date.now();
    pullChanges();
  }

  var fromLink = bootstrapLink();
  renderToday();
  go(fromLink ? 'today' : TABS[location.hash] || 'today');
  pullSoon();

  /* Приложение открылось пустым, а копия на сервере есть — значит историю
     Safari стёрли. Возвращаем молча: объяснять нечего, данные на месте. */
  if (linked() && blank()) {
    restore(true).then(function (ok) {
      if (ok) toast('Данные восстановлены из копии.');
    });
  }
  syncSoon(true);
  backupSoon(true);
  nativeSoon(true);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      /* Уходя в фон, успеваем положить копию: следующего открытия может и не быть. */
      backupSoon(true);
      return;
    }
    pullSoon();
    syncSoon(true);
  });
  window.addEventListener('hashchange', function () {
    var t = TABS[location.hash];
    if (t && t !== tab) go(t);
  });
  setInterval(function () { if (tab === 'today') renderToday(); }, 30000);
  /* Виджету снимок нужен и тогда, когда человек сидит в другой вкладке:
     минута идёт, блок кончается, а на домашнем экране об этом не знают. */
  setInterval(function () { nativeSoon(true); }, 30000);

  /* Офлайн-режим: страница должна открываться и без сети. */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }

  /* Пока приложение открыто в браузере, а не добавлено на домашний экран,
     уведомления на айфоне не работают вовсе. Поэтому говорим об этом прямо. */
  function standalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }
  if (!standalone()) {
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var hint = document.createElement('div');
    hint.className = 'nav-row';
    hint.style.cssText = 'display:block;cursor:default;margin-top:14px';
    hint.innerHTML = '<b>Добавь на домашний экран</b><small>' +
      (ios ? 'Поделиться → «На экран «Домой»». Только так айфон разрешает напоминания и приложение открывается без браузера.'
           : 'Меню браузера → «Установить приложение». Тогда оно работает офлайн и умеет напоминать.') + '</small>';
    var root = document.getElementById('setRoot');
    if (root) root.appendChild(hint);
  }
})();
