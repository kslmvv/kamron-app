/* Kamron APP 0.20.0 — собрано из src/. Не редактируйте этот файл: правки вносятся в src/ и применяются командой npm run build. */
(() => {
  // src/core/constants.js
  var KEY = "kamron-app-mvp-v1";
  var DAY = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  var TASK_POINTS = 50;
  var ROUTINE_POINTS = 10;
  var APP_BUILD = true ? "MVP 0.20" : "MVP (dev)";
  var LINKABLE_PAGES = [
    "home",
    "more",
    "jarvis",
    "chat",
    "routine",
    "work",
    "uni",
    "gym",
    "notes",
    "games",
    "settings",
    "phone",
    "tech",
    "tasks",
    "insights"
  ];
  var EMOJI = ["🚀", "💼", "💡", "🎨", "📱", "⚡", "🌿", "📚", "🧩", "🎯", "🛠️", "🪐"];
  var SHAPES = [
    [[0, 0]],
    [
      [0, 0],
      [0, 1]
    ],
    [
      [0, 0],
      [1, 0]
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2]
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0]
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3]
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0]
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1]
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1]
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0]
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1]
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1]
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1]
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2]
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1]
    ],
    [
      [0, 1],
      [1, 1],
      [2, 0],
      [2, 1]
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2]
    ],
    [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1]
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2]
    ]
  ];
  var THEMES = {
    sky: { name: "Небо", mood: "Лёгкий день", color: "#f3f5f7" },
    night: { name: "Ночь", mood: "Спокойный вечер", color: "#171d26" },
    sage: { name: "Шалфей", mood: "Спокойствие", color: "#f2f5ef" },
    sunset: { name: "Рассвет", mood: "Тёплый настрой", color: "#faf5f1" }
  };
  var OLD_THEMES = {
    light: "sky",
    dark: "night",
    graphite: "night",
    paper: "sky",
    forest: "sage",
    plum: "sunset"
  };
  var PREP_QUESTIONS = [
    "Объясни тему своими словами без конспекта.",
    "Назови ключевые понятия и связь между ними.",
    "Приведи пример или применение на практике.",
    "Какой вопрос может задать преподаватель и как ты ответишь?"
  ];

  // src/core/utils.js
  var $ = (selector) => document.querySelector(selector);
  var uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  var pad = (n) => String(n).padStart(2, "0");
  var dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  var fromKey = (key) => /* @__PURE__ */ new Date(`${key}T12:00:00`);
  var dayNumber = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 864e5);
  };
  var addDays = (key, n) => {
    const d = fromKey(key);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  };
  var today = () => dateKey(/* @__PURE__ */ new Date());
  var fmt = (key, opts = { day: "numeric", month: "long" }) => fromKey(key).toLocaleDateString("ru-RU", opts);
  var plural = (n, one, few, many) => {
    const v = Math.abs(Number(n)) % 100, last = v % 10;
    return v >= 11 && v <= 14 ? many : last === 1 ? one : last >= 2 && last <= 4 ? few : many;
  };
  var esc = (value) => String(value ?? "").replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );
  var safeId = (value) => esc(value);
  function downloadText(content, name) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" }), url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  var TRANSLIT = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    ў: "o",
    қ: "q",
    ғ: "g",
    ҳ: "h"
  };
  function safeDownloadPart(value) {
    return String(value || "file").toLowerCase().replace(/[а-яёўқғҳ]/g, (letter) => TRANSLIT[letter] ?? "").normalize("NFKD").replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "file";
  }

  // src/core/toast.js
  function toast(message, withUndo = false) {
    const el = $("#toast");
    el.innerHTML = withUndo ? `<span>${esc(message)}</span><button data-action="undo-task" aria-label="Отменить действие">Отменить</button>` : esc(message);
    el.classList.toggle("can-undo", withUndo);
    el.classList.add("show");
    clearTimeout(rt.toastTimer);
    rt.toastTimer = setTimeout(() => el.classList.remove("show"), withUndo ? 6e3 : 3e3);
  }

  // src/features/files.js
  function openFileDb() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("no-indexeddb"));
        return;
      }
      const request2 = indexedDB.open("kamron-app-files", 1);
      request2.onupgradeneeded = () => request2.result.createObjectStore("materials");
      request2.onsuccess = () => resolve(request2.result);
      request2.onerror = () => reject(request2.error);
    });
  }
  async function fileTransaction(mode, callback) {
    const db = await openFileDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction("materials", mode), store = tx.objectStore("materials");
        let result;
        try {
          result = callback(store);
        } catch (error) {
          reject(error);
          return;
        }
        tx.oncomplete = () => resolve(result?.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }
  var putPrepFile = (id, file) => fileTransaction("readwrite", (store) => store.put(file, id));
  var getPrepFile = (id) => fileTransaction("readonly", (store) => store.get(id));
  var deletePrepFile = (id) => fileTransaction("readwrite", (store) => store.delete(id));
  async function attachPrepFiles(prep, files) {
    const selected = files.filter((f) => f && f.size > 0);
    if (!selected.length) return true;
    if ((prep.attachments || []).length + selected.length > 10) {
      toast("Максимум 10 файлов в одной теме");
      return false;
    }
    if (selected.some((f) => f.size > 15 * 1024 * 1024)) {
      toast("Один из файлов больше 15 МБ");
      return false;
    }
    const added = [];
    try {
      for (const file of selected) {
        const id = uid();
        await putPrepFile(id, file);
        added.push({ id, name: file.name.slice(0, 160), type: file.type || "", size: file.size });
      }
      prep.attachments = [...prep.attachments || [], ...added];
      return true;
    } catch (error) {
      for (const entry of added) await deletePrepFile(entry.id).catch(() => {
      });
      toast("Не удалось сохранить файл. Проверьте память браузера.");
      return false;
    }
  }

  // src/ui/components.js
  function heading(kicker, title, subtitle, action, label = "+") {
    const sticker = {
      Ещё: "•••",
      Jarvis: "✦",
      "Режим дня": "🗓️",
      Работа: "💼",
      Универ: "🎓",
      "Jarvis · учёба": "🎓",
      "Jarvis · проект": "✦",
      "Jarvis · приложение": "🛠️",
      Зал: "💪",
      Заметки: "📝",
      Игры: "🎮",
      Настройки: "⚙️",
      "Jarvis · голос": "📞"
    }[title] || "✦";
    return `<div class="page-heading"><div class="heading-copy"><div class="heading-kicker"><span class="heading-sticker" aria-hidden="true">${sticker}</span></div><h1>${title}</h1></div>${action ? `<button class="fab-small" data-action="${action}" aria-label="${label === "+" ? `Добавить в раздел «${title}»` : label}">${label}</button>` : ""}</div>`;
  }
  function overview(items, extra = "") {
    return `<div class="overview-strip ${extra}">${items.map(([value, label, tone = ""]) => `<div class="overview-item ${tone}"><strong>${value}</strong><span>${label}</span></div>`).join("")}</div>`;
  }
  function empty(icon, title, desc, action, label) {
    return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${desc}</p>${action ? `<button class="primary-btn" data-action="${action}">${label}</button>` : ""}</div>`;
  }
  function taskRows(tasks, kind, parentId) {
    if (!tasks.length)
      return `<p class="small muted">Пока нет задач. Добавьте первую — за выполнение получите 50 баллов.</p>`;
    return tasks.slice().sort(
      (a, b) => Number(!!a.doneAt) - Number(!!b.doneAt) || (a.due || "9999").localeCompare(b.due || "9999") || Number(b.priority === "high") - Number(a.priority === "high")
    ).map(
      (t) => `<div class="task-row ${t.doneAt ? "done" : ""}" data-task-row-id="${safeId(t.id)}"><button class="check-btn ${t.doneAt ? "done" : ""}" data-action="toggle-task" data-kind="${kind}" data-parent="${safeId(parentId)}" data-id="${safeId(t.id)}" aria-label="${t.doneAt ? "Вернуть задачу" : "Выполнить задачу"}">${t.doneAt ? "✓" : ""}</button><div class="task-text">${esc(t.title)}<span class="task-meta">${t.priority === "high" ? "● Важно · " : ""}${t.due ? `${t.due < today() && !t.doneAt ? "Просрочено · " : ""}До ${esc(fmt(t.due, { day: "numeric", month: "short" }))}` : "Без срока"}</span></div><button class="delete-btn" data-action="edit-task" data-kind="${kind}" data-parent="${safeId(parentId)}" data-id="${safeId(t.id)}" aria-label="Изменить задачу">✎</button><button class="delete-btn" data-action="delete-task" data-kind="${kind}" data-parent="${safeId(parentId)}" data-id="${safeId(t.id)}" aria-label="Удалить задачу">×</button></div>`
    ).join("");
  }
  function calendar(key, scope) {
    const d = fromKey(key), year = d.getFullYear(), month = d.getMonth(), first = (new Date(year, month, 1).getDay() + 6) % 7, count = new Date(year, month + 1, 0).getDate();
    const head = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((x) => `<span>${x}</span>`).join("");
    const blanks = "<span></span>".repeat(first);
    const days = Array.from({ length: count }, (_, i) => {
      const k = dateKey(new Date(year, month, i + 1));
      const gymCount = scope === "gym" ? data.gym.filter((x) => x.date === k).length : 0, dot = scope === "gym" ? gymCount > 0 : dayItems(k).some((e) => e.kind === "subject" || !!e.date) || dueTasks(k).length > 0;
      const progress = scope === "routine" ? routineProgress(k) : null;
      const complete = progress && progress.total > 0 && progress.done === progress.total;
      return `<button data-action="pick-day" data-date="${k}" class="${k === key ? "selected" : ""} ${k === today() ? "today" : ""} ${dot ? "has-dot" : ""} ${complete ? "routine-complete" : ""}" aria-label="${esc(fmt(k, { day: "numeric", month: "long" }))}${progress ? ` · ${progress.done} из ${progress.total} пунктов` : gymCount ? ` · тренировок ${gymCount}` : ""}" aria-pressed="${k === key}" ${k === today() ? 'aria-current="date"' : ""}>${i + 1}</button>`;
    }).join("");
    return `<div class="calendar-card"><div class="month"><button class="icon-btn" data-action="month-step" data-step="-1" aria-label="Предыдущий месяц">‹</button><strong>${esc(fmt(key, { month: "long", year: "numeric" }))}</strong><button class="icon-btn" data-action="month-step" data-step="1" aria-label="Следующий месяц">›</button></div><div class="calendar-grid">${head}${blanks}${days}</div></div>`;
  }
  function agendaTaskRows(tasks) {
    return tasks.slice().sort(
      (a, b) => Number(!!a.doneAt) - Number(!!b.doneAt) || Number(b.priority === "high") - Number(a.priority === "high")
    ).map(
      (t) => `<div class="task-row ${t.doneAt ? "done" : ""}"><button class="check-btn ${t.doneAt ? "done" : ""}" data-action="toggle-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="${t.doneAt ? "Вернуть задачу" : "Выполнить задачу"}" aria-pressed="${!!t.doneAt}">${t.doneAt ? "✓" : ""}</button><div class="task-text">${esc(t.title)}<span class="task-meta">${t.kind === "personal" ? "📝" : t.kind === "work" ? "💼" : "🎓"} ${esc(t.source)}${t.priority === "high" ? " · Важно" : ""}${t.due && t.due < today() && !t.doneAt ? " · Просрочено" : ""}</span></div>${t.due && t.due <= today() && !t.doneAt ? `<button class="postpone-btn" data-action="postpone-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Перенести задачу на завтра" title="Перенести на завтра">↪</button>` : ""}<button class="delete-btn" data-action="open-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Открыть задачу">›</button></div>`
    ).join("");
  }
  function weekdayInputs(selected) {
    return `<div class="weekday-picker">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label><input type="checkbox" name="days" value="${d}" ${selected.includes(d) ? "checked" : ""}><span>${DAY[d]}</span></label>`).join("")}</div>`;
  }

  // src/core/icons.js
  var icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
    plan: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    notes: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 11h8M8 15h8M8 19h5"/>',
    games: '<path d="M7 8h10a5 5 0 0 1 4.7 3.3l1.1 3.2a3 3 0 0 1-4.5 3.4L15 16H9l-3.3 1.9a3 3 0 0 1-4.5-3.4l1.1-3.2A5 5 0 0 1 7 8z"/><path d="M7 11v4M5 13h4M16.5 12h.01M19 14h.01"/>',
    settings: '<path d="M9.55 4.60 L10.17 2.47 L13.83 2.47 L14.45 4.60 L15.50 5.03 L17.44 3.97 L20.03 6.56 L18.97 8.50 L19.40 9.55 L21.53 10.17 L21.53 13.83 L19.40 14.45 L18.97 15.50 L20.03 17.44 L17.44 20.03 L15.50 18.97 L14.45 19.40 L13.83 21.53 L10.17 21.53 L9.55 19.40 L8.50 18.97 L6.56 20.03 L3.97 17.44 L5.03 15.50 L4.60 14.45 L2.47 13.83 L2.47 10.17 L4.60 9.55 L5.03 8.50 L3.97 6.56 L6.56 3.97 L8.50 5.03 Z"/><circle cx="12" cy="12" r="3.1"/>',
    jarvis: '<path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z"/><path d="m19 17 .5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5L19 17Z"/>',
    more: '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.08 3h3a2 2 0 0 1 2 1.72l.4 2.81a2 2 0 0 1-.57 1.72L8.1 11.06a16 16 0 0 0 4.84 4.84l1.81-1.81a2 2 0 0 1 1.72-.57l2.81.4A2 2 0 0 1 22 16.92z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>'
  };
  var svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;

  // src/features/api.js
  function serverConfigured() {
    return !!(data.server?.url && data.server?.token);
  }
  function endpoint(path) {
    return `${String(data.server.url).replace(/\/+$/, "")}${path}`;
  }
  async function request(path, { method = "GET", body, timeout = 7e4 } = {}) {
    if (!serverConfigured()) throw new Error("Сервер Jarvis не подключён");
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), timeout);
    try {
      const response = await fetch(endpoint(path), {
        method,
        headers: {
          authorization: `Bearer ${data.server.token}`,
          ...body ? { "content-type": "application/json" } : {}
        },
        body: body ? JSON.stringify(body) : void 0,
        signal: control.signal
      });
      const text = await response.text();
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_) {
        throw new Error("Сервер вернул не тот формат ответа");
      }
      if (!response.ok) throw new Error(payload.error || `Сервер ответил ошибкой ${response.status}`);
      return payload;
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Сервер не ответил за отведённое время");
      if (err instanceof TypeError) throw new Error("Не удалось связаться с сервером. Проверьте адрес и сеть");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  async function checkServer(url) {
    const base = String(url || data.server?.url || "").replace(/\/+$/, "");
    if (!base) throw new Error("Адрес сервера не указан");
    const response = await fetch(`${base}/api/health`);
    if (!response.ok) throw new Error(`Сервер ответил ошибкой ${response.status}`);
    return response.json();
  }
  function snapshot() {
    const key = today();
    return {
      today: dateKey(/* @__PURE__ */ new Date()),
      name: data.name,
      routine: dayItems(key).slice(0, 30).map((item) => ({
        time: item.time,
        title: item.title,
        done: item.kind === "routine" ? routineCompleted(key, item.id) : false
      })),
      tasks: allOpenTasks().slice(0, 60).map((t) => ({ title: t.title, kind: t.kind, due: t.due || "", source: t.source || "" })),
      lessons: data.subjects.flatMap(
        (subject) => upcomingLessons(subject, 3).map((lesson) => ({
          date: lesson.key,
          time: subject.time || "",
          subject: subject.name,
          type: lesson.meeting?.type || ""
        }))
      ).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 12),
      projects: data.projects.slice(0, 20).map((p) => {
        const open = (p.tasks || []).filter((t) => !t.doneAt);
        return {
          name: p.name,
          open: open.length,
          done: (p.tasks || []).length - open.length,
          next: open[0]?.title || ""
        };
      }),
      notes: data.notes.slice(0, 10).map((n) => ({ title: n.title || "", body: (n.body || "").slice(0, 300) }))
    };
  }
  var syncTimer = null;
  var lastSent = "";
  function syncSnapshot({ immediate = false } = {}) {
    if (!serverConfigured()) return;
    clearTimeout(syncTimer);
    const send = async () => {
      const body = snapshot();
      const fingerprint = JSON.stringify(body);
      if (fingerprint === lastSent) return;
      try {
        await request("/api/snapshot", { method: "POST", body, timeout: 15e3 });
        lastSent = fingerprint;
      } catch (_) {
      }
    };
    if (immediate) return void send();
    syncTimer = setTimeout(send, 4e3);
  }
  function jarvisChat(messages) {
    return request("/api/jarvis/chat", { method: "POST", body: { messages, snapshot: snapshot() } });
  }
  function seminarReview(payload) {
    return request("/api/seminar/review", { method: "POST", body: payload });
  }
  function githubCommit(url) {
    return request(`/api/github/commit?url=${encodeURIComponent(url)}`);
  }

  // src/features/chat.js
  function ensure() {
    if (!view.chat) view.chat = { messages: [], busy: false, error: "" };
    return view.chat;
  }
  function scrollToEnd() {
    const stream = $("#chat-stream");
    if (stream) stream.scrollTop = stream.scrollHeight;
  }
  async function sendChatMessage(text) {
    const message = String(text || "").trim();
    const chat = ensure();
    if (!message || chat.busy) return;
    if (!serverConfigured()) {
      toast("Сервер Jarvis не подключён");
      return;
    }
    chat.messages.push({ role: "user", content: message.slice(0, 2e3) });
    chat.busy = true;
    chat.error = "";
    render();
    scrollToEnd();
    try {
      const result = await jarvisChat(chat.messages);
      chat.messages.push({ role: "assistant", content: result.reply || "Пустой ответ" });
    } catch (err) {
      chat.error = err.message;
      chat.pending = chat.messages.pop()?.content || "";
    } finally {
      chat.busy = false;
      render();
      scrollToEnd();
      const field = document.querySelector(".chat-composer textarea");
      if (field && chat.pending) {
        field.value = chat.pending;
        chat.pending = "";
      }
      field?.focus();
    }
  }
  function clearChat() {
    view.chat = { messages: [], busy: false, error: "" };
    render();
  }

  // src/views/settings.js
  function renderSettings() {
    const stats = gameStats(), next = nextThing();
    return `${heading("ПОД ТВОЙ РИТМ", "Настройки", "Оформление, напоминания и данные в одном месте.")}
      <div class="profile-card"><span class="profile-avatar">${esc(
      String(data.name || "Камрон").trim().slice(0, 1).toUpperCase() || "К"
    )}</span><div class="grow"><strong>${esc(data.name || "Камрон")}</strong><small>Мой профиль</small></div><button class="secondary-btn" data-action="edit-name" aria-label="Изменить имя">Изменить</button></div>
      <div class="settings-group-heading"><strong>Тема</strong></div>
      <div class="theme-grid">${Object.entries(THEMES).map(
      ([key, theme]) => `<button class="theme-option ${data.theme === key ? "active" : ""}" data-action="set-theme" data-theme="${key}" aria-pressed="${data.theme === key}" aria-label="Тема ${theme.name}"><span class="theme-swatch ${key}"><i></i><b></b></span><strong>${theme.name}</strong></button>`
    ).join("")}</div>
      <div class="settings-group-heading"><strong>Напоминания</strong></div>
      <div class="card settings-card"><div class="settings-row"><div><strong>Напоминать мне</strong><small>Пока приложение открыто</small></div><label class="switch" aria-label="Включить напоминания"><input type="checkbox" id="setting-reminders" ${data.reminders ? "checked" : ""}><span></span></label></div><div class="settings-row"><label for="setting-lead"><strong>Перед событием</strong></label><select id="setting-lead" ${data.reminders ? "" : "disabled"}><option value="0" ${data.lead === 0 ? "selected" : ""}>В момент</option><option value="5" ${data.lead === 5 ? "selected" : ""}>За 5 мин</option><option value="10" ${data.lead === 10 ? "selected" : ""}>За 10 мин</option><option value="30" ${data.lead === 30 ? "selected" : ""}>За 30 мин</option></select></div></div>
      <div class="settings-group-heading"><strong>Мои разделы</strong></div>
      <button class="settings-destination" data-action="go" data-page="jarvis"><span class="settings-destination-icon">✦</span><span class="grow"><strong>Jarvis</strong><small>Все сценарии помощника</small></span><span aria-hidden="true">›</span></button>
      <button class="settings-destination" data-action="go" data-page="insights"><span class="settings-destination-icon">✦</span><span class="grow"><strong>Мой прогресс</strong><small>${stats.points} ${plural(stats.points, "балл", "балла", "баллов")} · ${stats.streak} ${plural(stats.streak, "день", "дня", "дней")} подряд</small></span><span aria-hidden="true">›</span></button>
      <button class="settings-more-toggle" data-action="toggle-settings-more" aria-expanded="${view.settingsMoreOpen}"><span>Дополнительно</span><span aria-hidden="true">${view.settingsMoreOpen ? "−" : "+"}</span></button>
      ${view.settingsMoreOpen ? `<div class="settings-more-panel"><div class="card settings-card"><div class="settings-row"><div><strong>Меньше анимаций</strong></div><label class="switch" aria-label="Меньше анимаций"><input type="checkbox" id="setting-motion" ${data.reduceMotion ? "checked" : ""}><span></span></label></div><div class="settings-row"><label for="setting-weekly-goal"><strong>Цель на неделю</strong></label><select id="setting-weekly-goal">${[3, 5, 7, 10, 15].map((n) => `<option value="${n}" ${data.weeklyGoal === n ? "selected" : ""}>${n} задач</option>`).join("")}</select></div></div>
        <button class="settings-destination" data-action="go" data-page="phone"><span class="settings-destination-icon">📞</span><span class="grow"><strong>Голос Jarvis</strong><small>План утром и отчёт вечером</small></span><span aria-hidden="true">›</span></button>
        <button class="settings-destination" data-action="go" data-page="tech"><span class="settings-destination-icon">🛠️</span><span class="grow"><strong>Jarvis · приложение</strong><small>Проверки и запросы на изменения</small></span><span aria-hidden="true">›</span></button>
        <div class="settings-group-heading"><strong>Сервер Jarvis</strong></div>
        <div class="card settings-card"><div class="settings-action-row"><div class="grow"><strong>${serverConfigured() ? "Подключён" : "Не подключён"}</strong><small>${serverConfigured() ? esc(data.server.url) : "Без сервера помощник работает только с локальными данными"}</small></div><button class="secondary-btn" data-action="server-form">${serverConfigured() ? "Изменить" : "Подключить"}</button></div></div>
        <div class="settings-group-heading"><strong>Данные</strong></div><div class="card settings-card"><div class="settings-action-row"><div class="grow"><strong>Сохранить копию</strong><small>Без вложенных файлов</small></div><button class="secondary-btn" data-action="export">Скачать</button></div><div class="settings-action-row"><div class="grow"><strong>Восстановить копию</strong></div><button class="secondary-btn" data-action="import">Выбрать</button></div><div class="settings-action-row reset-row"><div class="grow"><strong>Сбросить данные</strong></div><button class="text-btn danger-action" data-action="reset">Сбросить</button></div><input id="import-file" type="file" accept="application/json,.json" hidden></div>
        <details class="settings-preview"><summary>Виджет iPhone <span>образец</span></summary><div class="widget-preview"><div class="row"><span>◉ Kamron APP</span><strong>${esc(fmt(today(), { day: "numeric", month: "short" }))}</strong></div><p>${next ? `Далее: ${esc(next.item.title)} · ${next.item.time}` : "Сегодня всё спокойно"}<br>🔥 ${stats.streak} · ✦ ${stats.points} баллов</p></div><small>Рабочий виджет появится в нативной версии.</small></details>
        <p class="settings-footnote">Фоновые уведомления появятся в версии для iPhone.</p></div>` : ""}`;
  }
  function phoneAgenda(key) {
    const events = dayItems(key).slice(0, 8).map((x) => `${x.time} ${x.title}${x.kind === "subject" ? ` (${x.category})` : ""}`);
    const tasks = allOpenTasks().filter((t) => t.due && t.due <= key).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5).map((t) => `${t.title} — ${t.source}${t.due < key ? " (просрочено)" : ""}`);
    return { events, tasks };
  }
  function voiceToday() {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tashkent",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(/* @__PURE__ */ new Date()).map((x) => [x.type, x.value])
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function renderPhone() {
    const p = data.phone, key = voiceToday(), agenda = phoneAgenda(key), tomorrow = phoneAgenda(addDays(key, 1)), report = p.reports?.[key] || emptyVoiceReport(), history2 = Object.entries(p.reports || {}).filter(([reportKey]) => reportKey < key).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
    const dayButtons = [1, 2, 3, 4, 5, 6, 0].map(
      (day) => `<label class="voice-day"><input type="checkbox" name="days" value="${day}" ${p.days.includes(day) ? "checked" : ""}><span>${DAY[day]}</span></label>`
    ).join("");
    const formatItems = (items) => items.length ? items.map((line) => `<li>${esc(line)}</li>`).join("") : "<li>Пока ничего не запланировано</li>";
    return `<button class="back-link" data-action="go" data-page="${view.assistantBack}">← ${view.assistantBack === "jarvis" ? "Jarvis" : "Настройки"}</button>${heading("НА СВЯЗИ", "Jarvis · голос", "Утром — план и разговор. Вечером — честный разбор дня.")}
      <div class="voice-lead card"><span class="voice-lead-icon" aria-hidden="true">☎</span><div><strong>Звонки Jarvis · подключение</strong><p>Настройки и отчёт сохраняются на устройстве. Входящие звонки пока не активны.</p></div></div>
      <div class="voice-two"><div class="card voice-summary"><span class="eyebrow">УТРО · ${esc(p.morning)}</span><strong>План на сегодня</strong><ul>${formatItems(agenda.events)}</ul>${agenda.tasks.length ? `<small>Задачи: ${esc(agenda.tasks.join(" · "))}</small>` : ""}</div><div class="card voice-summary"><span class="eyebrow">ЗАВТРА</span><strong>Что ждёт впереди</strong><ul>${formatItems(tomorrow.events)}</ul></div></div>
      <div class="section-title">Когда связываться</div>
      <form class="card voice-form" data-form="phone"><div class="voice-time-grid"><label>Утренний разговор<input type="time" name="morning" value="${esc(p.morning)}" required></label><label>Вечерний разбор<input type="time" name="evening" value="${esc(p.evening)}" required></label></div><div class="voice-days" role="group" aria-label="Дни звонков">${dayButtons}</div><label>Тон общения<select name="tone"><option value="supportive" ${p.tone === "supportive" ? "selected" : ""}>Поддерживающий</option><option value="direct" ${p.tone === "direct" ? "selected" : ""}>Прямой</option><option value="strict" ${p.tone === "strict" ? "selected" : ""}>Строгий, без оскорблений</option></select></label><label>Ваш профиль Telegram<input type="text" name="telegramUser" inputmode="text" autocomplete="off" placeholder="@username" value="${esc(p.telegramUser)}" maxlength="33"></label><p class="settings-note">Время — Ташкент (UTC+5). Профиль понадобится отдельному аккаунту помощника, чтобы позвонить именно вам. Код Telegram и пароль сюда не вводите.</p><button class="primary-btn" type="submit">Сохранить сценарий</button></form>
      <div class="section-title">Вечерний отчёт <small>${esc(fmt(key, { day: "numeric", month: "long" }))}</small></div><form class="card voice-form" data-form="phone-report"><label>Что получилось сегодня?<textarea name="done" rows="2" maxlength="1000" placeholder="Что сделал, где продвинулся">${esc(report.done)}</textarea></label><label>Что не получилось?<textarea name="missed" rows="2" maxlength="1000" placeholder="Что осталось открытым">${esc(report.missed)}</textarea></label><label>Что помешало?<textarea name="reason" rows="2" maxlength="1000" placeholder="Причина без оправданий">${esc(report.reason)}</textarea></label><label>Главный шаг завтра<input name="tomorrow" maxlength="250" placeholder="Одно конкретное действие" value="${esc(report.tomorrow)}"></label><button class="secondary-btn" type="submit">Сохранить отчёт</button></form>${history2.length ? `<div class="section-title">Прошлые отчёты</div>${history2.map(([key2, r]) => `<div class="card voice-history"><strong>${esc(fmt(key2, { day: "numeric", month: "long" }))}</strong><p>${esc(r.done || "Побед не записано")}</p>${r.missed ? `<small>Не получилось: ${esc(r.missed)}</small>` : ""}</div>`).join("")}` : ""}
      <details class="card voice-explain"><summary>Как заработают звонки</summary><p>Помощнику понадобится отдельный пользовательский аккаунт Telegram: ботам звонки недоступны. Сервер по расписанию начнёт вызов через Telegram-клиент и передаст звук в OpenAI GPT‑Live. Для работы нужны отдельный аккаунт, защищённый сервер и проверка звукового моста; один HTML-файл не может звонить в фоне.</p></details>`;
  }

  // src/forms/modal.js
  function formSnapshot(form) {
    return form ? JSON.stringify(
      [...new FormData(form)].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name ? [value.name, value.size, value.lastModified] : null
      ])
    ) : null;
  }
  function openModal(title, body) {
    const dialog = $("#modal");
    if (dialog.open && !closeModal()) return false;
    dialog.setAttribute("aria-label", title);
    dialog.innerHTML = `<div class="sheet-header"><h2>${esc(title)}</h2><button class="sheet-close" data-action="close-modal" aria-label="Закрыть">×</button></div>${body}`;
    dialog.showModal();
    rt.modalSnapshot = formSnapshot(dialog.querySelector?.("form[data-form]"));
    return true;
  }
  function closeModal(force = false) {
    const dialog = $("#modal");
    if (!dialog.open) return true;
    if (!force && rt.modalSnapshot !== null && rt.modalSnapshot !== formSnapshot(dialog.querySelector?.("form[data-form]")) && !confirm("Закрыть без сохранения изменений?"))
      return false;
    dialog.close();
    rt.modalSnapshot = null;
    return true;
  }
  function flushPrepAnswer() {
    if (!rt.pendingPrepAnswer) return;
    clearTimeout(rt.prepAnswerTimer);
    const { id, key, value } = rt.pendingPrepAnswer;
    rt.pendingPrepAnswer = null;
    const prep = data.seminarPreps.find((p) => p.id === id);
    if (!prep) return;
    prep.answers ||= {};
    const old = prep.answers[key];
    if (String(old || "") === value) return;
    prep.answers[key] = value;
    const label = $(`#page [data-prep-save="${key}"]`);
    if (!save()) {
      if (old === void 0) delete prep.answers[key];
      else prep.answers[key] = old;
      if (label) label.textContent = "Не сохранено";
      return;
    }
    if (label) label.textContent = "Сохранено";
  }
  async function submitForm(form) {
    const fd = new FormData(form), type = form.dataset.form, id = form.dataset.id;
    if (type === "chat") return sendChatMessage(String(fd.get("text") || ""));
    if (type === "server") {
      const url = String(fd.get("url") || "").trim().replace(/\/+$/, "");
      const token = String(fd.get("token") || "").trim();
      if (url && !/^https:\/\//.test(url) && !/^http:\/\/localhost(:\d+)?$/.test(url)) {
        toast("Адрес должен начинаться с https://");
        return;
      }
      data.server = { url, token };
      save();
      closeModal(true);
      toast(url && token ? "Сервер Jarvis подключён" : "Подключение сервера очищено");
      render();
      return;
    }
    const previous = JSON.stringify(data);
    const createdFromTasks = view.page === "tasks";
    if (type === "seminar-prep") {
      const subjectId = form.dataset.subject;
      if (!data.subjects.some((s) => s.id === subjectId)) return;
      let p = data.seminarPreps.find((x) => x.id === id && x.subjectId === subjectId);
      const isNew = !p;
      if (!p) p = { id: uid(), subjectId, createdAt: (/* @__PURE__ */ new Date()).toISOString(), attachments: [], answers: {} };
      p.topic = String(fd.get("topic") || "").trim().slice(0, 140);
      p.context = String(fd.get("context") || "").trim().slice(0, 4e3);
      if (!p.topic) {
        toast("Укажите тему");
        return;
      }
      if (isNew) {
        if (!await attachPrepFiles(p, fd.getAll("materials"))) return;
        data.seminarPreps.push(p);
      }
      view.page = "seminar";
      view.id = subjectId;
      view.prepId = p.id;
    } else if (type === "prep-files") {
      const p = data.seminarPreps.find((x) => x.id === id);
      if (!p) return;
      if (!await attachPrepFiles(p, fd.getAll("materials"))) return;
      view.page = "seminar";
      view.id = p.subjectId;
      view.prepId = p.id;
    } else if (type === "project-ai") {
      const p = data.projects.find((x) => x.id === id);
      if (!p) return;
      const githubUrl = validGithubUrl(String(fd.get("githubUrl") || "").trim()), railwayUrl = validRailwayUrl(String(fd.get("railwayUrl") || "").trim());
      if (githubUrl === null) {
        toast("Укажите ссылку на репозиторий github.com/владелец/репозиторий");
        return;
      }
      if (railwayUrl === null) {
        toast("Укажите ссылку на railway.com или railway.app");
        return;
      }
      p.ai ||= {};
      if (p.ai.githubUrl !== githubUrl) delete p.ai.githubSnapshot;
      p.ai.goal = String(fd.get("goal") || "").trim().slice(0, 240);
      p.ai.githubUrl = githubUrl;
      p.ai.railwayUrl = railwayUrl;
      view.page = "project-ai";
      view.id = p.id;
    } else if (type === "project-ai-request") {
      const p = data.projects.find((x) => x.id === id);
      if (!p) return;
      const title = String(fd.get("title") || "").trim(), description = String(fd.get("description") || "").trim();
      if (!title || !description) {
        toast("Заполните поручение");
        return;
      }
      p.ai ||= {};
      p.ai.requests ||= [];
      p.ai.requests.push({
        id: uid(),
        title: title.slice(0, 120),
        description: description.slice(0, 2500),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      p.ai.requests = p.ai.requests.slice(-50);
      view.page = "project-ai";
      view.id = p.id;
    } else if (type === "project") {
      let p = data.projects.find((x) => x.id === id), image = fd.get("clearImage") === "1" ? null : p?.logoImage || null;
      const file = fd.get("logoFile");
      if (file && file.size) {
        if (file.size > 4e5) {
          toast("Логотип должен быть меньше 400 КБ");
          return;
        }
        image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      if (!p) {
        p = { id: uid(), tasks: [], notes: [] };
        data.projects.push(p);
      }
      p.name = String(fd.get("name")).trim();
      p.description = String(fd.get("description")).trim();
      p.logo = String(fd.get("logo"));
      p.logoImage = image;
      p.color = String(fd.get("color"));
      view.page = "project";
      view.id = p.id;
    } else if (type === "subject") {
      const days = fd.getAll("days").map(Number);
      if (!days.length) {
        toast("Выберите хотя бы один день занятия");
        return;
      }
      let s = data.subjects.find((x) => x.id === id);
      if (!s) {
        s = { id: uid(), tasks: [], exceptions: {}, attendance: {} };
        data.subjects.push(s);
      }
      s.name = String(fd.get("name")).trim();
      s.time = String(fd.get("time"));
      s.duration = Math.min(300, Math.max(15, Number(fd.get("duration")) || 90));
      s.startDate = String(fd.get("startDate"));
      s.days = days;
      s.mode = String(fd.get("mode"));
      s.firstType = String(fd.get("firstType"));
      s.teacher = String(fd.get("teacher") || "").trim();
      s.room = String(fd.get("room") || "").trim();
      s.icon = String(fd.get("icon") || "📚");
      s.notes = String(fd.get("notes") || "").trim();
      view.page = "subject";
      view.id = s.id;
    } else if (type === "event") {
      const repeat = fd.get("repeat") === "weekly" ? "weekly" : "once", days = fd.getAll("days").map(Number), date = String(fd.get("date") || "");
      if (repeat === "weekly" && !days.length) {
        toast("Выберите хотя бы один день");
        return;
      }
      if (repeat === "once" && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        toast("Укажите дату");
        return;
      }
      let e = data.routine.find((x) => x.id === id);
      if (!e) {
        e = { id: uid() };
        data.routine.push(e);
      }
      e.title = String(fd.get("title")).trim();
      e.time = String(fd.get("time"));
      e.category = String(fd.get("category"));
      e.days = repeat === "weekly" ? days : [];
      if (repeat === "once") e.date = date;
      else delete e.date;
      for (const [markedDate, ids] of Object.entries(data.routineDone))
        if (Array.isArray(ids) && ids.includes(e.id) && !routineOccurs(e, markedDate)) {
          data.routineDone[markedDate] = ids.filter((x) => x !== e.id);
          if (!data.routineDone[markedDate].length) delete data.routineDone[markedDate];
        }
    } else if (type === "gym-log") {
      const date = String(fd.get("date") || ""), title = String(fd.get("title") || "").trim(), minutes = String(fd.get("duration") || "").trim(), duration = minutes ? Number(minutes) : 0;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today() || !title || minutes && (!Number.isInteger(duration) || duration < 1 || duration > 360)) {
        toast("Проверьте дату, название и время");
        return;
      }
      let log = data.gym.find((x) => x.id === id);
      if (!log) {
        log = { id: uid() };
        data.gym.push(log);
      }
      log.date = date;
      log.title = title.slice(0, 80);
      log.type = ["Силовая", "Кардио", "Растяжка", "Другое"].includes(fd.get("type")) ? String(fd.get("type")) : "Другое";
      log.duration = duration;
      log.notes = String(fd.get("notes") || "").trim().slice(0, 1500);
      view.date = date;
      view.page = "gym";
    } else if (type === "task") {
      const tasks = getTaskList(form.dataset.kind, form.dataset.parent);
      if (!tasks) return;
      let t = tasks.find((x) => x.id === id);
      if (!t) {
        t = { id: uid(), doneAt: null };
        tasks.push(t);
      }
      t.title = String(fd.get("title")).trim();
      t.due = String(fd.get("due") || "");
      t.priority = String(fd.get("priority") || "normal");
      if (form.dataset.kind === "personal" && view.page !== "routine") {
        view.page = "tasks";
        view.taskFilter = "all";
        view.taskQuery = "";
      }
    } else if (type === "quick-uni-task") {
      const s = data.subjects.find((x) => x.id === fd.get("subject"));
      if (!s) return;
      s.tasks.push({
        id: uid(),
        title: String(fd.get("title")).trim(),
        due: String(fd.get("due") || ""),
        priority: String(fd.get("priority") || "normal"),
        doneAt: null
      });
      if (createdFromTasks) {
        view.taskFilter = "all";
        view.taskQuery = "";
      } else {
        view.page = "subject";
        view.id = s.id;
        view.subjectFilter = "open";
      }
    } else if (type === "quick-work-task") {
      const p = data.projects.find((x) => x.id === fd.get("project"));
      if (!p) return;
      p.tasks.push({
        id: uid(),
        title: String(fd.get("title")).trim(),
        due: String(fd.get("due") || ""),
        priority: String(fd.get("priority") || "normal"),
        doneAt: null
      });
      if (createdFromTasks) {
        view.taskFilter = "all";
        view.taskQuery = "";
      } else {
        view.page = "project";
        view.id = p.id;
      }
    } else if (type === "lesson") {
      const s = data.subjects.find((x) => x.id === form.dataset.parent), key = form.dataset.date;
      if (!s || !scheduledOn(s, key)) return;
      s.exceptions ||= {};
      s.attendance ||= {};
      if (fd.has("cancelled")) s.exceptions[key] = { cancelled: true };
      else delete s.exceptions[key];
      const attendance = String(fd.get("attendance") || "");
      if (attendance && !fd.has("cancelled")) s.attendance[key] = attendance;
      else delete s.attendance[key];
    } else if (type === "note") {
      let n = data.notes.find((x) => x.id === id);
      if (!n) {
        n = { id: uid(), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
        data.notes.push(n);
      }
      n.title = String(fd.get("title")).trim();
      n.body = String(fd.get("body")).trim();
      n.category = String(fd.get("category"));
      n.pinned = fd.has("pinned");
      n.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    } else if (type === "project-note") {
      const p = data.projects.find((x) => x.id === form.dataset.parent), text = String(fd.get("text") || "").trim();
      if (!p || !text) return;
      p.notes ||= [];
      let note = p.notes.find((x) => x.id === id);
      if (!note) {
        note = { id: uid(), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
        p.notes.push(note);
      }
      note.text = text.slice(0, 4e3);
    } else if (type === "tech-request") {
      const description = String(fd.get("description") || "").trim();
      if (!description) {
        toast("Опишите, что нужно изменить");
        return;
      }
      data.techRequests ||= [];
      data.techRequests.push({
        id: uid(),
        kind: ["bug", "design", "feature"].includes(fd.get("kind")) ? String(fd.get("kind")) : "feature",
        area: String(fd.get("area") || "Всё приложение").slice(0, 60),
        description: description.slice(0, 2e3),
        expected: String(fd.get("expected") || "").trim().slice(0, 1e3),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      data.techRequests = data.techRequests.slice(-100);
      view.page = "tech";
    } else if (type === "phone") {
      const telegramUser = String(fd.get("telegramUser") || "").trim();
      if (telegramUser && !/^@[A-Za-z0-9_]{5,32}$/.test(telegramUser)) {
        toast("Укажите имя Telegram в формате @username");
        return;
      }
      const days = [
        ...new Set(
          fd.getAll("days").map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
        )
      ];
      if (!days.length) {
        toast("Выберите хотя бы один день");
        return;
      }
      const morning = String(fd.get("morning") || ""), evening = String(fd.get("evening") || "");
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(morning) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(evening)) {
        toast("Проверьте время звонков");
        return;
      }
      data.phone = {
        ...data.phone,
        telegramUser,
        days,
        morning,
        evening,
        tone: ["supportive", "direct", "strict"].includes(fd.get("tone")) ? String(fd.get("tone")) : "direct"
      };
    } else if (type === "phone-report") {
      data.phone.reports ||= {};
      data.phone.reports[voiceToday()] = {
        done: String(fd.get("done") || "").trim().slice(0, 1e3),
        missed: String(fd.get("missed") || "").trim().slice(0, 1e3),
        reason: String(fd.get("reason") || "").trim().slice(0, 1e3),
        tomorrow: String(fd.get("tomorrow") || "").trim().slice(0, 250)
      };
    } else if (type === "name") {
      data.name = String(fd.get("name")).trim() || "Друг";
    }
    if (!save()) {
      const old = JSON.parse(previous), known = new Set((old.seminarPreps || []).flatMap((p) => (p.attachments || []).map((f) => f.id)));
      for (const p of data.seminarPreps || [])
        for (const f of p.attachments || []) if (!known.has(f.id)) await deletePrepFile(f.id).catch(() => {
        });
      setData(old);
      return;
    }
    closeModal(true);
    render();
    toast("Сохранено");
  }

  // src/games/blocks.js
  function newBlock() {
    return {
      grid: Array.from({ length: 8 }, () => Array(8).fill(0)),
      pieces: Array.from({ length: 3 }, () => SHAPES[Math.floor(Math.random() * SHAPES.length)]),
      selected: 0,
      score: 0,
      combo: 0,
      lastClear: 0,
      moves: 0,
      over: false
    };
  }
  function canPlace(grid, shape, r, c) {
    return shape.every(([y, x]) => r + y < 8 && c + x < 8 && !grid[r + y][c + x]);
  }
  function anyBlockMove(game) {
    return game.pieces.some(
      (shape) => shape && Array.from(
        { length: 8 },
        (_, r) => Array.from({ length: 8 }, (_2, c) => canPlace(game.grid, shape, r, c)).some(Boolean)
      ).some(Boolean)
    );
  }
  function placeBlock(r, c) {
    const game = view.block, shape = game.pieces[game.selected];
    if (!shape || game.over) return;
    if (!canPlace(game.grid, shape, r, c)) {
      toast("Фигура не помещается здесь");
      return;
    }
    shape.forEach(([y, x]) => game.grid[r + y][c + x] = game.selected + 1);
    game.score += shape.length;
    game.moves++;
    game.pieces[game.selected] = null;
    const rows = [], cols = [];
    for (let i = 0; i < 8; i++) {
      if (game.grid[i].every(Boolean)) rows.push(i);
      if (game.grid.every((row) => row[i])) cols.push(i);
    }
    const cleared = rows.length + cols.length;
    rows.forEach((y) => game.grid[y].fill(0));
    cols.forEach((x) => game.grid.forEach((row) => row[x] = 0));
    if (cleared) {
      game.combo = (game.combo || 0) + 1;
      game.score += cleared * 10 + Math.max(0, cleared - 1) * 10 + Math.max(0, game.combo - 1) * 5;
      game.lastClear = cleared;
    } else {
      game.combo = 0;
      game.lastClear = 0;
    }
    if (game.pieces.every((x) => !x))
      game.pieces = Array.from({ length: 3 }, () => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    game.selected = game.pieces.findIndex(Boolean);
    if (!anyBlockMove(game)) {
      game.over = true;
      toast(`Игра окончена · ${game.score} очков`);
    } else if (cleared)
      toast(
        cleared > 1 ? `Комбо: ${cleared} линии · ${game.score} очков` : `Линия очищена · ${game.score} очков`
      );
    if (game.score > data.best.block) data.best.block = game.score;
    persistGames();
    render();
  }
  function pieceHTML(shape) {
    if (!shape) return '<span class="muted">✓</span>';
    const h = Math.max(...shape.map((x) => x[0])) + 1, w = Math.max(...shape.map((x) => x[1])) + 1;
    return `<div class="piece-grid" style="grid-template-columns:repeat(${w},11px)">${Array.from({ length: h * w }, (_, i) => `<span class="piece-cell ${shape.some(([r, c]) => r === Math.floor(i / w) && c === i % w) ? "on" : ""}"></span>`).join("")}</div>`;
  }
  function clearBlockPreview() {
    document.querySelectorAll(".block-cell.preview,.block-cell.invalid").forEach((cell) => cell.classList.remove("preview", "invalid"));
  }
  function previewBlock(cell) {
    if (!cell || view.page !== "games" || view.game !== "block") return;
    clearBlockPreview();
    const g = view.block, shape = g?.pieces[g.selected];
    if (!shape || g.over) return;
    const r = Number(cell.dataset.row), c = Number(cell.dataset.col), valid = canPlace(g.grid, shape, r, c);
    shape.forEach(([y, x]) => {
      const next = document.querySelector(`.block-cell[data-row="${r + y}"][data-col="${c + x}"]`);
      if (next) next.classList.add(valid ? "preview" : "invalid");
    });
  }

  // src/games/memory.js
  function newMemory() {
    const values = ["🌙", "🚀", "🍋", "🎧", "🪐", "🎨", "⚡", "🌿"];
    const cards = [...values, ...values];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return { cards, flipped: [], matched: [], moves: 0, busy: false };
  }
  function flipMemory(index) {
    const g = view.memory;
    if (g.busy || g.matched.includes(index) || g.flipped.includes(index)) return;
    g.flipped.push(index);
    if (g.flipped.length === 2) {
      g.moves++;
      const [a, b] = g.flipped;
      if (g.cards[a] === g.cards[b]) {
        g.matched.push(a, b);
        g.flipped = [];
        if (g.matched.length === 16) {
          if (!data.best.memory || g.moves < data.best.memory) data.best.memory = g.moves;
          toast(`Все пары найдены за ${g.moves} ходов!`);
        }
      } else {
        g.busy = true;
        setTimeout(() => {
          if (view.memory !== g) return;
          g.flipped = [];
          g.busy = false;
          persistGames();
          if (view.page === "games" && view.game === "memory") render();
        }, 750);
      }
    }
    persistGames();
    render();
  }

  // src/games/merge.js
  function randomEmpty(grid) {
    const spots = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!grid[r][c]) spots.push([r, c]);
    if (spots.length) {
      const [r, c] = spots[Math.floor(Math.random() * spots.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }
  function newMerge() {
    const game = {
      grid: Array.from({ length: 4 }, () => Array(4).fill(0)),
      score: 0,
      over: false,
      won: false,
      keepPlaying: false,
      lastGain: 0,
      moves: 0
    };
    randomEmpty(game.grid);
    randomEmpty(game.grid);
    return game;
  }
  function mergeMovesAvailable(grid) {
    return grid.some(
      (row, r) => row.some(
        (value, c) => !value || r < 3 && value === grid[r + 1][c] || c < 3 && value === grid[r][c + 1]
      )
    );
  }
  function moveMerge(direction) {
    const game = view.merge;
    if (game.over || game.won && !game.keepPlaying) return;
    const before = JSON.stringify(game.grid);
    let gain = 0;
    for (let i = 0; i < 4; i++) {
      const coords = Array.from(
        { length: 4 },
        (_, j) => direction === "left" ? [i, j] : direction === "right" ? [i, 3 - j] : direction === "up" ? [j, i] : [3 - j, i]
      );
      const vals = coords.map(([r, c]) => game.grid[r][c]).filter(Boolean), merged = [];
      for (let j = 0; j < vals.length; j++) {
        if (vals[j] === vals[j + 1]) {
          const next = vals[j] * 2;
          merged.push(next);
          game.score += next;
          gain += next;
          if (next === 2048 && !game.won) game.won = true;
          j++;
        } else merged.push(vals[j]);
      }
      coords.forEach(([r, c], j) => game.grid[r][c] = merged[j] || 0);
    }
    if (JSON.stringify(game.grid) === before) return;
    randomEmpty(game.grid);
    game.lastGain = gain;
    game.moves = (game.moves || 0) + 1;
    if (game.score > data.best.merge) data.best.merge = game.score;
    game.over = !mergeMovesAvailable(game.grid);
    if (game.over) toast(`Игра окончена · ${game.score} очков`);
    else if (game.won && !game.keepPlaying) toast("2048! Победа — можно продолжить");
    persistGames();
    render();
  }

  // src/games/index.js
  function persistGames() {
    data.games = {
      block: view.block,
      merge: view.merge,
      memory: view.memory ? { ...view.memory, flipped: [], busy: false } : null
    };
    save();
  }
  function renderGames() {
    if (!view.block) view.block = data.games?.block?.grid?.length === 8 ? data.games.block : newBlock();
    if (!view.merge) view.merge = data.games?.merge?.grid?.length === 4 ? data.games.merge : newMerge();
    if (!view.memory) view.memory = data.games?.memory?.cards?.length === 16 ? data.games.memory : newMemory();
    view.block.combo ??= 0;
    view.block.lastClear ??= 0;
    view.block.moves ??= 0;
    if (!view.block.over && !anyBlockMove(view.block)) view.block.over = true;
    view.merge.won ??= false;
    view.merge.keepPlaying ??= false;
    view.merge.lastGain ??= 0;
    view.merge.moves ??= 0;
    if (!mergeMovesAvailable(view.merge.grid)) view.merge.over = true;
    const tabs = [
      ["block", "🧩", "Блоки"],
      ["merge", "🔢", "2048"],
      ["memory", "🃏", "Пары"]
    ].map(
      ([id, icon, label]) => `<button class="game-tab ${view.game === id ? "active" : ""}" data-action="game-tab" data-game="${id}" aria-pressed="${view.game === id}"><span aria-hidden="true">${icon}</span><strong>${label}</strong></button>`
    ).join("");
    let game = "";
    if (view.game === "block") {
      const g = view.block;
      game = `<div class="game-info"><div class="game-scoreboard"><div><small>ОЧКИ</small><strong>${g.score}</strong></div><div><small>РЕКОРД</small><strong>${data.best.block}</strong></div></div><button class="secondary-btn" data-action="reset-game">Заново</button></div>
        <div class="game-board-wrap"><div class="block-grid" role="grid" aria-label="Поле 8 на 8">${g.grid.flatMap((row, r) => row.map((value, c) => `<button class="block-cell ${value ? `filled block-color-${value}` : ""}" data-action="block-cell" data-row="${r}" data-col="${c}" aria-label="Строка ${r + 1}, столбец ${c + 1}${value ? " занята" : " свободна"}"></button>`)).join("")}</div>${g.over ? `<div class="game-overlay"><strong>Игра окончена</strong><span>${g.score} очков</span><button data-action="reset-game">Играть снова</button></div>` : ""}</div>
        <div class="pieces">${g.pieces.map((shape, i) => `<button class="piece ${g.selected === i ? "active" : ""} ${shape && !g.over && !Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_2, c) => canPlace(g.grid, shape, r, c)).some(Boolean)).some(Boolean) ? "unavailable" : ""}" data-action="select-piece" data-index="${i}" style="--piece-color:${["#f5bb32", "#48baff", "#fa8161"][i]}" ${shape && !g.over ? "" : "disabled"} aria-label="Фигура ${i + 1}">${pieceHTML(shape)}</button>`).join("")}</div><div class="game-status">${g.combo > 1 ? `🔥 Комбо ×${g.combo}` : g.lastClear ? `✨ Очищено линий: ${g.lastClear}` : "Выберите фигуру и поставьте её на поле"}</div><details class="game-help"><summary>Как играть</summary><p>Выберите фигуру и нажмите на клетку или перетащите её. После трёх фигур появятся новые. Игра окончена, когда ни одна оставшаяся фигура не помещается.</p></details>`;
    } else if (view.game === "merge") {
      const g = view.merge;
      game = `<div class="game-info"><div class="game-scoreboard"><div><small>ОЧКИ</small><strong>${g.score}</strong></div><div><small>РЕКОРД</small><strong>${data.best.merge}</strong></div></div><button class="secondary-btn" data-action="reset-game">Заново</button></div>
        <div class="game-board-wrap"><div class="grid2048" id="merge-grid" aria-label="Поле 2048">${g.grid.flat().map(
        (value) => `<div class="tile2048 ${value >= 4096 ? "super" : ""}" ${value ? `data-value="${value}"` : ""}>${value || ""}</div>`
      ).join(
        ""
      )}</div>${g.over ? `<div class="game-overlay merge-overlay"><strong>Игра окончена</strong><span>${g.score} очков</span><button data-action="reset-game">Играть снова</button></div>` : g.won && !g.keepPlaying ? `<div class="game-overlay merge-overlay"><strong>2048! Победа</strong><span>Можно продолжить и набрать ещё больше.</span><button data-action="continue-merge">Продолжить</button></div>` : ""}</div>
        <div class="game-status">${g.lastGain ? `+${g.lastGain} за последний ход` : "Соединяйте одинаковые плитки"}</div><div class="arrow-pad"><span></span><button data-action="merge-move" data-dir="up" aria-label="Вверх" ${g.over || g.won && !g.keepPlaying ? "disabled" : ""}>↑</button><span></span><button data-action="merge-move" data-dir="left" aria-label="Влево" ${g.over || g.won && !g.keepPlaying ? "disabled" : ""}>←</button><button data-action="merge-move" data-dir="down" aria-label="Вниз" ${g.over || g.won && !g.keepPlaying ? "disabled" : ""}>↓</button><button data-action="merge-move" data-dir="right" aria-label="Вправо" ${g.over || g.won && !g.keepPlaying ? "disabled" : ""}>→</button></div><details class="game-help"><summary>Как играть</summary><p>Сдвигайте плитки свайпом, стрелками или кнопками. После каждого успешного хода появляется новая плитка. Соберите 2048.</p></details>`;
    } else {
      const g = view.memory;
      game = `<div class="game-info"><div class="game-scoreboard"><div><small>ХОДЫ</small><strong>${g.moves}</strong></div><div><small>РЕКОРД</small><strong>${data.best.memory || "—"}</strong></div></div><button class="secondary-btn" data-action="reset-game">Заново</button></div><div class="game-board-wrap"><div class="memory-grid">${g.cards.map((value, i) => `<button class="memory-cell ${g.matched.includes(i) ? "matched" : g.flipped.includes(i) ? "revealed" : ""}" data-action="memory-cell" data-index="${i}" aria-label="Карточка ${i + 1}${g.matched.includes(i) ? " найдена" : g.flipped.includes(i) ? " открыта" : " закрыта"}" ${g.matched.includes(i) ? "disabled" : ""}>${g.matched.includes(i) || g.flipped.includes(i) ? value : "?"}</button>`).join("")}</div>${g.matched.length === 16 ? `<div class="game-overlay memory-overlay"><strong>Все пары найдены!</strong><span>${g.moves} ходов</span><button data-action="reset-game">Играть снова</button></div>` : ""}</div><div class="game-status">Найдено пар: ${g.matched.length / 2} из 8</div><details class="game-help"><summary>Как играть</summary><p>Открывайте по две карточки. Одинаковые остаются открытыми; старайтесь уложиться в меньшее число ходов.</p></details>`;
    }
    return `${heading("ОТДОХНИ И ПЕРЕЗАГРУЗИСЬ", "Игры", "Короткий перерыв, который всегда под рукой.")}
      <div class="game-tabs">${tabs}</div><div class="game-panel game-${view.game}">${game}</div>`;
  }

  // src/views/chat.js
  var STARTERS = [
    "Что у меня сегодня важного?",
    "Какие задачи просрочены?",
    "С чего начать по проектам?",
    "Что подготовить к ближайшему занятию?"
  ];
  function renderChat() {
    if (!serverConfigured()) {
      return `${heading("JARVIS", "Живой диалог", "")}
      ${empty("✦", "Сервер не подключён", "Диалог отвечает через ваш сервер: там живут ключи модели. Подключите его в настройках — Дополнительно, «Сервер Jarvis».")}
      <button class="primary-btn" data-action="server-form">Подключить сервер</button>`;
    }
    const messages = view.chat?.messages || [];
    const bubbles = messages.map(
      (m) => `<div class="chat-bubble ${m.role === "user" ? "mine" : "his"}">${esc(m.content).replace(/\n/g, "<br>")}</div>`
    ).join("");
    return `${heading("JARVIS", "Живой диалог", "Отвечает по данным приложения на этом устройстве.")}
      <div class="chat-stream" id="chat-stream">
        ${bubbles || `<div class="chat-hint"><strong>Спросите что угодно о своём дне.</strong><small>Jarvis видит режим дня, задачи, занятия, проекты и заметки. Данные не сохраняются на сервере.</small></div>`}
        ${view.chat?.busy ? '<div class="chat-bubble his pending">Думаю…</div>' : ""}
        ${view.chat?.error ? `<div class="chat-error">${esc(view.chat.error)}</div>` : ""}
      </div>
      ${messages.length ? "" : `<div class="chat-starters">${STARTERS.map(
      (s) => `<button class="chat-starter" data-action="chat-starter" data-text="${esc(s)}">${esc(s)}</button>`
    ).join("")}</div>`}
      <form class="chat-composer" data-form="chat">
        <textarea name="text" rows="1" maxlength="2000" placeholder="Сообщение Jarvis" aria-label="Сообщение Jarvis" ${view.chat?.busy ? "disabled" : ""}></textarea>
        <button class="chat-send" type="submit" aria-label="Отправить" ${view.chat?.busy ? "disabled" : ""}>↑</button>
      </form>
      ${messages.length ? '<button class="secondary-btn" data-action="chat-clear">Очистить разговор</button>' : ""}`;
  }

  // src/views/gym.js
  function renderGym() {
    const logs = data.gym.filter((x) => x.date === view.date).slice().reverse(), month = view.date.slice(0, 7), monthCount = data.gym.filter((x) => x.date.startsWith(month)).length;
    return `${heading("ТВОЙ РИТМ", "Зал", "Записывай тренировки, план добавим вместе.", "new-gym-log")}
      <div class="gym-intro"><span aria-hidden="true">💪</span><div><strong>Журнал тренировок</strong><small>Записывай занятия сейчас. Персональный план составим, когда расскажешь о целях.</small></div></div>
      ${overview(
      [
        [monthCount, "в этом месяце"],
        [data.gym.length, "всего записей"]
      ],
      "gym-overview"
    )}
      <div class="section-title">Календарь <small>● день с тренировкой</small></div>${calendar(view.date, "gym")}
      <div class="section-title gym-date-heading"><span>${esc(fmt(view.date, { weekday: "long", day: "numeric", month: "long" }))}</span>${view.date !== today() ? `<button class="text-btn" data-action="gym-today">Сегодня</button>` : ""}${view.date <= today() ? `<button class="text-btn" data-action="new-gym-log">+ Записать</button>` : ""}</div>
      ${logs.length ? logs.map((x) => `<div class="card gym-log"><div class="row"><span class="gym-log-icon" aria-hidden="true">✦</span><div class="grow"><strong>${esc(x.title)}</strong><small>${x.duration ? `${Number(x.duration)} мин · ` : ""}${esc(x.type || "Тренировка")}</small></div><button class="icon-btn" data-action="edit-gym-log" data-id="${safeId(x.id)}" aria-label="Изменить тренировку">✎</button></div>${x.notes ? `<p>${esc(x.notes)}</p>` : ""}</div>`).join("") : `<div class="gym-empty"><strong>${view.date > today() ? "План добавим позже" : "На этот день записей нет"}</strong><span>${view.date > today() ? "Когда расскажешь о целях и графике, заполним будущие тренировки." : "После тренировки сохрани, что сделал и как себя чувствовал."}</span></div>`}`;
  }

  // src/views/home.js
  function renderHome() {
    const stats = gameStats(), upcoming = nextThing(), open = allOpenTasks(), routineToday = routineProgress(today()), note = [...data.notes].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
    )[0];
    const due = open.filter((t) => t.due).sort((a, b) => a.due.localeCompare(b.due))[0], workOpen = data.projects.reduce((n, p) => n + (p.tasks || []).filter((t) => !t.doneAt).length, 0), uniOpen = data.subjects.reduce((n, s) => n + (s.tasks || []).filter((t) => !t.doneAt).length, 0);
    return `<div class="dash-layout">
      <div class="dash-hero"><div><h1>Привет, ${esc(data.name)} 👋</h1></div><div class="dash-date">${esc(fmt(today(), { weekday: "short", day: "numeric", month: "short" }))}</div></div>
      <button class="progress-card" data-action="go" data-page="insights" style="color:inherit;text-align:left"><div class="score-main"><div class="score-orb">✦</div><div><div class="score-value">${stats.points} ${plural(stats.points, "балл", "балла", "баллов")}</div><div class="score-label">Уровень ${stats.level} · ещё ${250 - stats.points % 250}</div></div></div><div class="streak">🔥 ${stats.streak}<small>${plural(stats.streak, "день", "дня", "дней")}</small></div></button>
      <div class="dash-grid">
        <button class="dash-tile routine" data-action="go" data-page="routine"><div class="tile-top"><span class="tile-emoji">🕒</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Режим дня</span><span class="tile-caption">${routineToday.total ? `${routineToday.done}/${routineToday.total} выполнено` : "Добавьте первый пункт"}</span></div></button>
        <button class="dash-tile work" data-action="go" data-page="work"><div class="tile-top"><span class="tile-emoji">💼</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Работа</span><span class="tile-caption">${data.projects.length} ${plural(data.projects.length, "проект", "проекта", "проектов")} · ${workOpen} ${plural(workOpen, "задача", "задачи", "задач")}</span></div></button>
        <button class="dash-tile uni" data-action="go" data-page="uni"><div class="tile-top"><span class="tile-emoji">🎓</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Универ</span><span class="tile-caption">${data.subjects.length} ${plural(data.subjects.length, "предмет", "предмета", "предметов")} · ${uniOpen} ${plural(uniOpen, "задача", "задачи", "задач")}</span></div></button>
        <button class="dash-tile gym" data-action="go" data-page="gym"><div class="tile-top"><span class="tile-emoji">💪</span><span class="tile-arrow">↗</span></div><div><span class="tile-title">Зал</span><span class="tile-caption">${data.gym.length ? `${data.gym.length} ${plural(data.gym.length, "тренировка", "тренировки", "тренировок")} в журнале` : "Записать тренировку"}</span></div></button>
      </div>
      <div class="dash-bottom"><button class="mini-panel" data-action="go" data-page="routine"><div class="mini-title">ДАЛЬШЕ <span>↗</span></div><div class="mini-value">${upcoming ? esc(upcoming.item.title) : "Свободное время"}</div><div class="mini-sub">${upcoming ? `${upcoming.key === today() ? "Сегодня" : esc(fmt(upcoming.key, { weekday: "short", day: "numeric", month: "short" }))} · ${upcoming.item.time}` : "Можно запланировать день"}</div></button><button class="mini-panel" data-action="go" data-page="tasks"><div class="mini-title">ЗАДАЧИ <span>↗</span></div><div class="mini-value">${due ? esc(due.title) : open.length ? `${open.length} без срока` : "Всё под контролем"}</div><div class="mini-sub">${due ? `${esc(due.source)} · ${esc(fmt(due.due, { day: "numeric", month: "short" }))}` : "Все задачи в одном месте"}</div></button></div>
      <div class="quick-note"><button class="quick-note-open" data-action="go" data-page="notes"><strong>📝 Заметки</strong><span>${note ? esc(`${note.title ? `${note.title} · ` : ""}${note.body.slice(0, 45)}`) : "Здесь будут ваши записи"}</span></button><button class="quick-note-add" data-action="new-note" aria-label="Новая заметка">+</button></div>
    </div>`;
  }
  function renderMore() {
    const row = (icon, title, detail, page) => `<button class="more-row" data-action="go" data-page="${page}"><span class="more-icon" aria-hidden="true">${icon}</span><span class="grow"><strong>${title}</strong><small>${detail}</small></span><span class="more-arrow" aria-hidden="true">›</span></button>`;
    return `${heading("РАЗДЕЛЫ", "Ещё", "")}
      <div class="more-group"><div class="more-group-title">Каждый день</div>
        ${row("📝", "Заметки", `${data.notes.length} ${plural(data.notes.length, "запись", "записи", "записей")}`, "notes")}
        ${row("☑️", "Все задачи", `${allOpenTasks().length} ${plural(allOpenTasks().length, "активная", "активные", "активных")}`, "tasks")}
        ${row("✦", "Прогресс", `${gameStats().points} ${plural(gameStats().points, "балл", "балла", "баллов")}`, "insights")}
      </div>
      <div class="more-group"><div class="more-group-title">Мои разделы</div>
        ${row("💼", "Работа", `${data.projects.length} ${plural(data.projects.length, "проект", "проекта", "проектов")}`, "work")}
        ${row("🎓", "Универ", `${data.subjects.length} ${plural(data.subjects.length, "предмет", "предмета", "предметов")}`, "uni")}
        ${row("💪", "Зал", data.gym.length ? `${data.gym.length} ${plural(data.gym.length, "тренировка", "тренировки", "тренировок")}` : "Журнал тренировок", "gym")}
        ${row("🎮", "Игры", "Три игры без сети", "games")}
      </div>
      <div class="more-group"><div class="more-group-title">Приложение</div>
        ${row("⚙️", "Настройки", "Тема, напоминания, данные", "settings")}
      </div>`;
  }
  function renderJarvis() {
    const next = nextThing(), project = data.projects[0], subject = data.subjects[0];
    const projectAction = data.projects.length > 1 ? { action: "choose-project-ai" } : project ? { action: "open-project-ai", id: project.id } : { action: "new-project" };
    const subjectAction = data.subjects.length > 1 ? { action: "choose-seminar" } : subject ? { action: "open-seminar", id: subject.id } : { action: "new-subject" };
    const destination = (icon, title, detail, route) => `<button class="jarvis-card" data-action="${route.action}" ${route.page ? `data-page="${route.page}"` : ""} ${route.id ? `data-id="${safeId(route.id)}"` : ""}><span class="jarvis-card-icon" aria-hidden="true">${icon}</span><span class="jarvis-card-copy"><strong>${title}</strong><small>${detail}</small></span><span class="jarvis-card-arrow" aria-hidden="true">›</span></button>`;
    return `${heading("ТВОЙ ПОМОЩНИК", "Jarvis", "")}
      <div class="jarvis-hero"><div class="jarvis-orb" aria-hidden="true">✦</div><div class="grow"><strong>Всё важное под рукой</strong><small>План дня, учёба, проекты и изменения приложения.</small></div></div>
      <div class="jarvis-list">
        ${destination(
      "💬",
      "Живой диалог",
      serverConfigured() ? "Спросить о дне, задачах и занятиях" : "Нужен подключённый сервер",
      { action: "go", page: "chat" }
    )}
        ${destination("📞", "Мой день", "Утренний план и вечерний отчёт", { action: "go", page: "phone" })}
        ${destination("🎓", "Учёба", subject ? "Подготовка к семинару" : "Сначала добавь предмет", subjectAction)}
        ${destination("💼", "Проекты", project ? "Контекст, GitHub и поручения" : "Сначала добавь проект", projectAction)}
        ${destination("🛠️", "Приложение", "Проверки и запросы на исправление", { action: "go", page: "tech" })}
      </div>
      <button class="jarvis-next" data-action="go" data-page="routine"><span class="jarvis-next-label">ДАЛЬШЕ ПО ПЛАНУ</span><strong>${next ? esc(next.item.title) : "Свободное время"}</strong><small>${next ? `${next.key === today() ? "Сегодня" : esc(fmt(next.key, { weekday: "short", day: "numeric", month: "short" }))} · ${next.item.time}` : "Добавь событие в режим дня"}</small><span class="jarvis-next-arrow" aria-hidden="true">›</span></button><p class="jarvis-footnote">Живой разговор и анализ материалов заработают после подключения OpenAI API.</p>`;
  }

  // src/views/notes.js
  function renderNotes() {
    if (!data.notes.length) view.noteFilter = "all";
    const notes = data.notes.filter(
      (n) => view.noteFilter === "all" || (view.noteFilter === "pinned" ? n.pinned : n.category === view.noteFilter)
    ).sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt)
    );
    const query = view.noteQuery.trim().toLocaleLowerCase("ru-RU"), matches = (n) => `${n.title || ""} ${n.body || ""} ${n.category || ""}`.toLocaleLowerCase("ru-RU").includes(query);
    const chips = [
      ["all", "Все"],
      ["pinned", "Закреплённые"],
      ["Идея", "Идеи"],
      ["Личное", "Личное"],
      ["Важное", "Важное"]
    ].map(
      ([key, label]) => `<button class="filter-chip ${view.noteFilter === key ? "active" : ""}" data-action="note-filter" data-filter="${key}">${label}</button>`
    ).join("");
    return `${heading("БЫСТРО СОХРАНИТЬ", "Заметки", "Мысли всегда под рукой и на главном экране.")}
      <button class="capture-card" data-action="new-note"><span class="capture-icon">✎</span><span class="grow"><strong>Записать мысль</strong></span><span class="peek-arrow">+</span></button>
      ${data.notes.length ? overview(
      [
        [data.notes.length, "всего заметок"],
        [data.notes.filter((n) => n.pinned).length, "закреплено"]
      ],
      "notes-overview"
    ) : ""}
      ${data.notes.length ? `<div class="toolbar">${chips}</div><input class="subject-search" id="note-search" type="search" placeholder="Найти заметку" value="${esc(view.noteQuery)}" aria-label="Найти заметку">` : ""}<div class="notes-list">${notes.length ? notes.map((n) => `<div class="card note-card" data-note-card data-id="${safeId(n.id)}" ${matches(n) ? "" : "hidden"}><div class="row"><h3 class="grow">${esc(n.title || "Без названия")}</h3><button class="note-pin ${n.pinned ? "active" : ""}" data-action="toggle-note-pin" data-id="${safeId(n.id)}" aria-label="${n.pinned ? "Открепить" : "Закрепить"} заметку" aria-pressed="${!!n.pinned}" title="${n.pinned ? "Открепить" : "Закрепить"}">📌</button><span class="tag">${esc(n.category)}</span></div><p>${esc(n.body)}</p><div class="row"><span class="tiny muted grow">${esc(fmt(n.createdAt.slice(0, 10)))}</span><button class="text-btn" data-action="edit-note" data-id="${safeId(n.id)}">Изменить</button><button class="delete-btn" data-action="delete-note" data-id="${safeId(n.id)}" aria-label="Удалить заметку">×</button></div></div>`).join("") : empty("📝", view.noteFilter === "all" ? "Пока нет заметок" : "Ничего не найдено", view.noteFilter === "all" ? "Нажмите «Записать мысль» выше." : "Выберите другой фильтр.")}<div class="search-empty" id="note-search-empty" ${!notes.length || notes.some(matches) ? "hidden" : ""}>Заметки не найдены. Попробуйте другое слово или фильтр.</div></div>`;
  }

  // src/views/routine.js
  function renderRoutineWeek(start) {
    const cards = Array.from({ length: 7 }, (_, i) => {
      const key = addDays(start, i), items = dayItems(key), tasks = dueTasks(key), progress = routineProgress(key);
      const preview = items.slice(0, 3).map(
        (item) => `<span>${item.kind === "routine" && routineCompleted(key, item.id) ? "✓ " : ""}${item.time} · ${esc(item.title)}</span>`
      ).join("");
      return `<button class="routine-week-card ${key === today() ? "is-today" : ""}" data-action="open-routine-day" data-date="${key}"><div class="routine-week-head"><div><small>${esc(fmt(key, { weekday: "long" }))}</small><strong>${esc(fmt(key, { day: "numeric", month: "long" }))}</strong></div><span class="routine-week-done">${progress.total ? `${progress.done}/${progress.total}${progress.done === progress.total ? " ✓" : ""}` : "Свободно"}</span></div><div class="routine-week-preview">${preview || "<span>Нет событий</span>"}${items.length > 3 ? `<span>+ ещё ${items.length - 3}</span>` : ""}</div><div class="routine-week-foot"><span>🎓 ${items.filter((x) => x.kind === "subject").length} пар</span><span>☑️ ${tasks.filter((x) => !x.doneAt).length} задач</span><b>›</b></div></button>`;
    }).join("");
    return `<div class="routine-week-nav"><button class="day-step" data-action="day-step" data-step="-7" aria-label="Предыдущая неделя">‹</button><strong>${esc(fmt(start, { day: "numeric", month: "short" }))} — ${esc(fmt(addDays(start, 6), { day: "numeric", month: "short" }))}</strong><button class="day-step" data-action="day-step" data-step="7" aria-label="Следующая неделя">›</button></div>${today() >= start && today() <= addDays(start, 6) ? "" : `<button class="routine-today-link" data-action="routine-today">Вернуться к сегодня</button>`}<div class="routine-week-list">${cards}</div>`;
  }
  function renderRoutine() {
    const key = view.date, wd = fromKey(key).getDay(), start = addDays(key, -((wd + 6) % 7));
    const mode = `<div class="routine-mode" role="group" aria-label="Вид расписания"><button data-action="routine-mode" data-mode="day" class="${view.routineMode === "day" ? "active" : ""}" aria-pressed="${view.routineMode === "day"}">День</button><button data-action="routine-mode" data-mode="week" class="${view.routineMode === "week" ? "active" : ""}" aria-pressed="${view.routineMode === "week"}">Неделя</button></div>`;
    if (view.routineMode === "week")
      return `${heading("ОБЗОР ПЛАНОВ", "Режим дня", "События, пары и сроки на всю неделю.", "new-event")}${mode}${renderRoutineWeek(start)}`;
    const week = Array.from({ length: 7 }, (_, i) => {
      const k = addDays(start, i), p = routineProgress(k);
      return `<button class="week-day ${k === key ? "active" : ""} ${p.total && p.done === p.total ? "routine-complete" : ""}" data-action="pick-day" data-date="${k}" aria-label="${esc(fmt(k, { weekday: "long", day: "numeric", month: "long" }))} · ${p.done} из ${p.total} пунктов" aria-pressed="${k === key}" ${k === today() ? 'aria-current="date"' : ""}><span>${DAY[fromKey(k).getDay()]}</span><strong>${fromKey(k).getDate()}</strong></button>`;
    }).join("");
    const items = dayItems(key), deadlines = dueTasks(key), overdue = key === today() ? allOpenTasks().filter((t) => t.due && t.due < key) : [], progress = routineProgress(key);
    const currentHm = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5), next = key >= today() ? items.find(
      (item) => (key > today() || item.time >= currentHm) && (item.kind !== "routine" || !routineCompleted(key, item.id))
    ) || items.find((item) => item.kind === "routine" && !routineCompleted(key, item.id)) : null;
    const nextIsLate = next && key === today() && next.time < currentHm;
    const timeline = items.length ? `<div class="timeline">${items.map((item) => {
      const done = item.kind === "routine" && routineCompleted(key, item.id);
      const status = item.kind === "routine" ? done ? `Готово · +${ROUTINE_POINTS} баллов` : key > today() ? "В плане" : key === today() && item.time > currentHm ? "Впереди" : key === today() ? "Можно отметить" : "Без отметки" : item.attendance === "present" ? "Был на занятии" : item.attendance === "absent" ? "Пропустил занятие" : key <= today() ? "Посещаемость не отмечена" : "Пара впереди";
      return `<div class="timeline-item ${item.category === "Работа" ? "mint" : item.kind === "subject" ? "amber" : ""} ${done ? "routine-item-done" : ""}" data-routine-item="${safeId(item.id)}"><span class="time">${item.time}</span><div class="timeline-card ${item.kind === "routine" ? "routine-entry" : ""}"><div class="row">${item.kind === "routine" ? `<button class="check-btn routine-check ${done ? "done" : ""}" data-action="toggle-routine" data-date="${key}" data-id="${safeId(item.id)}" aria-label="${key > today() ? "Можно отметить после наступления дня" : done ? "Снять отметку выполнения" : "Отметить выполненным"}: ${esc(item.title)}" aria-pressed="${!!done}" ${key > today() ? "disabled" : ""}>${done ? "✓" : ""}</button>` : ""}<div class="grow"><strong>${esc(item.title)}</strong><small>${esc(item.category)}${item.room ? ` · ауд. ${esc(item.room)}` : ""}${item.kind === "routine" ? item.date ? " · Один раз" : " · Повтор" : ""}</small>${item.kind === "routine" ? `<span class="routine-entry-status ${done ? "is-done" : ""}">${status}</span>` : ""}</div>${item.kind === "routine" ? `<button class="delete-btn routine-edit" data-action="edit-event" data-id="${safeId(item.id)}" aria-label="Изменить пункт «${esc(item.title)}»">✎</button>` : `<button class="attendance-btn" data-action="lesson-options" data-parent="${safeId(item.id)}" data-date="${key}" aria-label="${key <= today() ? "Отметить посещаемость" : "Изменить пару"}">${item.attendance === "present" ? "✓ Был" : item.attendance === "absent" ? "Пропуск" : key <= today() ? "Отметить" : "⋯"}</button>`}</div>${item.kind === "subject" ? `<span class="lesson-status">${status}</span>` : ""}</div></div>`;
    }).join("")}</div>` : empty(
      "🗓️",
      "День пока свободен",
      "Добавьте пункт в расписание или занятие по предмету.",
      "new-event",
      "Добавить пункт"
    );
    return `${heading("ПЛАН НА КАЖДЫЙ ДЕНЬ", "Режим дня", "Отмечайте выполненное. Каждая дата хранит свой результат.", "new-event")}${mode}
      <div class="routine-date-bar"><strong>${esc(fmt(key, { weekday: "long", day: "numeric", month: "long" }))}</strong><div>${key !== today() ? `<button class="routine-date-today" data-action="routine-today">Сегодня</button>` : ""}<button class="routine-date-calendar" data-action="toggle-routine-calendar" aria-expanded="${view.routineCalendarOpen}" aria-label="${view.routineCalendarOpen ? "Скрыть" : "Открыть"} календарь месяца">${svg("plan")}</button></div></div>
      ${view.routineCalendarOpen ? calendar(key, "routine") : ""}<div class="week-strip">${week}</div>
      <div class="routine-progress-card" role="group" aria-label="Прогресс режима дня"><div class="row"><span class="routine-progress-icon" aria-hidden="true">${progress.total && progress.done === progress.total ? "✓" : "◉"}</span><div class="grow"><strong>${progress.total ? `${progress.done}/${progress.total} выполнено` : "Нет пунктов режима"}</strong><small>${progress.total ? key > today() ? "Отметить можно в выбранный день" : progress.done === progress.total ? "Все пункты отмечены" : `Осталось ${progress.total - progress.done} из ${progress.total}` : "Добавьте первый пункт"}</small></div><b>${progress.total ? `${Math.round(progress.done / progress.total * 100)}%` : "—"}</b></div><div class="level-progress"><i style="width:${progress.total ? progress.done / progress.total * 100 : 0}%"></i></div><div class="routine-reward">+${ROUTINE_POINTS} баллов за пункт · за день +${progress.done * ROUTINE_POINTS}</div></div>
      ${next ? `<div class="routine-next-row"><button class="routine-next" data-action="jump-routine-item" data-id="${safeId(next.id)}"><span class="routine-next-icon" aria-hidden="true">${next.kind === "subject" ? "🎓" : "◷"}</span><span class="grow"><small>${nextIsLate ? "ОСТАЛОСЬ ОТМЕТИТЬ" : "ДАЛЬШЕ ПО ПЛАНУ"}</small><strong>${esc(next.title)}</strong><span>${next.time}${next.kind === "subject" ? ` · ${esc(next.category)}` : ""}</span></span><b aria-hidden="true">›</b></button>${next.kind === "routine" && key <= today() ? `<button class="routine-next-done" data-action="toggle-routine" data-date="${key}" data-id="${safeId(next.id)}" aria-label="Отметить выполненным: ${esc(next.title)}"><span aria-hidden="true">✓</span><small>Готово</small></button>` : ""}</div>` : ""}
      <div class="section-title">Расписание <small>${items.length} событий</small></div>${timeline}
      ${deadlines.length ? `<div class="section-title">Сроки задач <small>${deadlines.filter((t) => !t.doneAt).length} осталось</small></div><div class="card">${agendaTaskRows(deadlines)}</div>` : ""}
      ${overdue.length ? `<div class="section-title">Просроченные задачи <small>${overdue.length}</small></div><div class="card">${agendaTaskRows(overdue)}</div>` : ""}
      <button class="routine-add-task" data-action="new-personal-task">+ Личная задача</button>`;
  }

  // src/views/tasks.js
  function renderTasks() {
    const tasks = allTasks(), open = tasks.filter((t) => !t.doneAt), completed = tasks.filter((t) => t.doneAt), todayKey = today();
    if (!tasks.length) {
      view.taskFilter = "all";
      view.taskQuery = "";
    }
    const filters = [
      ["all", "Активные"],
      ["today", "Сегодня + долг"],
      ["upcoming", "Впереди"],
      ["important", "Важные"],
      ["no-date", "Без срока"],
      ["done", "Готово"]
    ];
    const selected = tasks.filter((t) => {
      if (view.taskFilter === "done") return !!t.doneAt;
      if (t.doneAt) return false;
      if (view.taskFilter === "today") return !!t.due && t.due <= todayKey;
      if (view.taskFilter === "upcoming") return !!t.due && t.due > todayKey;
      if (view.taskFilter === "important") return t.priority === "high";
      if (view.taskFilter === "no-date") return !t.due;
      return true;
    }).sort(
      (a, b) => view.taskFilter === "done" ? (b.doneAt || "").localeCompare(a.doneAt || "") : (a.due || "9999").localeCompare(b.due || "9999") || Number(b.priority === "high") - Number(a.priority === "high")
    );
    const query = view.taskQuery.trim().toLocaleLowerCase("ru-RU");
    const matches = selected.filter((t) => `${t.title} ${t.source}`.toLocaleLowerCase("ru-RU").includes(query));
    const rows = selected.map(
      (t) => `<div class="task-hub-row ${t.doneAt ? "done" : ""}" data-task-card data-search="${esc(`${t.title} ${t.source}`.toLocaleLowerCase("ru-RU"))}" ${query && !`${t.title} ${t.source}`.toLocaleLowerCase("ru-RU").includes(query) ? "hidden" : ""}><button class="check-btn ${t.doneAt ? "done" : ""}" data-action="toggle-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="${t.doneAt ? "Вернуть задачу" : "Выполнить задачу"}" aria-pressed="${!!t.doneAt}">${t.doneAt ? "✓" : ""}</button><button class="task-hub-copy" data-action="open-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}"><strong>${esc(t.title)}</strong><small>${t.kind === "personal" ? "📝" : t.kind === "work" ? "💼" : "🎓"} ${esc(t.source)} · ${t.due ? `${t.due < todayKey && !t.doneAt ? "Просрочено · " : ""}${esc(fmt(t.due, { day: "numeric", month: "short" }))}` : "Без срока"}${t.priority === "high" ? " · Важно" : ""}</small></button>${t.due && t.due <= todayKey && !t.doneAt ? `<button class="postpone-btn" data-action="postpone-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Перенести задачу на завтра" title="Перенести на завтра">↪</button>` : ""}<button class="delete-btn" data-action="edit-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Изменить задачу">✎</button></div>`
    ).join("");
    return `${heading("ВСЕ ДЕЛА В ОДНОМ МЕСТЕ", "Все задачи", "Личные дела, проекты и задания со сроками.")}
      ${tasks.length ? overview(
      [
        [open.length, "активных"],
        [open.filter((t) => t.due && t.due < todayKey).length, "просрочено"],
        [completed.length, "готово"]
      ],
      "task-hub-overview"
    ) : ""}
      <button class="primary-btn task-hub-create" data-action="new-task-hub">+ Добавить задачу</button>
      ${tasks.length ? `<div class="task-hub-filters" role="group" aria-label="Фильтр задач">${filters.map(([key, label]) => `<button class="filter-chip ${view.taskFilter === key ? "active" : ""}" data-action="task-filter" data-filter="${key}" aria-pressed="${view.taskFilter === key}">${label}</button>`).join("")}</div>
      <input class="task-hub-search" id="task-search" type="search" placeholder="Найти задачу в списке" value="${esc(view.taskQuery)}" aria-label="Поиск задач">
      <div class="task-hub-list" id="task-hub-list">${rows}</div><div class="search-empty" id="task-empty" ${matches.length ? "hidden" : ""}>${query ? "По этому запросу задач нет." : "В этом разделе пока нет задач."}</div>` : empty("☑️", "Пока нет задач", "Добавьте личное дело или задачу для работы и универа.")}`;
  }
  function renderInsights() {
    const keys = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6)), keySet = new Set(keys);
    const routineDays = keys.map((key) => ({ key, ...routineProgress(key) })), routineScheduled = routineDays.filter((p) => p.total > 0).length, routineComplete = routineDays.filter((p) => p.total > 0 && p.done === p.total).length;
    const personalDone = (data.personalTasks || []).filter(
      (t) => t.doneAt && keySet.has(dateKey(new Date(t.doneAt)))
    );
    const workDone = data.projects.flatMap((p) => p.tasks || []).filter((t) => t.doneAt && keySet.has(dateKey(new Date(t.doneAt))));
    const uniDone = data.subjects.flatMap((s) => s.tasks || []).filter((t) => t.doneAt && keySet.has(dateKey(new Date(t.doneAt))));
    const allDone = [...personalDone, ...workDone, ...uniDone], gymDone = data.gym.filter((x) => keySet.has(x.date)), counts = keys.map((key) => allDone.filter((t) => dateKey(new Date(t.doneAt)) === key).length), max = Math.max(1, ...counts);
    const weekStart = addDays(today(), -((fromKey(today()).getDay() + 6) % 7));
    const weekDone = completedTasks().filter(
      (t) => dateKey(new Date(t.doneAt)) >= weekStart && dateKey(new Date(t.doneAt)) <= today()
    ).length;
    const overdue = allOpenTasks().filter((t) => t.due && t.due < today()).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3), stats = gameStats();
    return `${heading("ПОСЛЕДНИЕ 7 ДНЕЙ", "Мой прогресс", "Видно, где получилось продвинуться и что требует внимания.")}
      ${overview(
      [
        [allDone.length, "задач готово"],
        [allOpenTasks().length, "в работе"],
        [gameStats().streak, "дней серия"]
      ],
      "insight-overview"
    )}
      <div class="card points-breakdown"><strong>Баллы за всё время · ${stats.points}</strong><span>☑️ Задачи: ${stats.taskPoints}</span><span>🗓️ Режим дня: ${stats.routinePoints}</span></div>
      <div class="card weekly-goal-card"><div class="row"><div class="grow"><span class="eyebrow">ЦЕЛЬ НА ЭТУ НЕДЕЛЮ</span><strong>${weekDone} из ${data.weeklyGoal} задач</strong></div><span class="goal-badge">${weekDone >= data.weeklyGoal ? "✓ Готово" : `${Math.max(0, data.weeklyGoal - weekDone)} осталось`}</span></div><div class="level-progress"><i style="width:${Math.min(100, weekDone / data.weeklyGoal * 100)}%"></i></div><button class="text-btn" data-action="go" data-page="tasks">Открыть все задачи →</button></div>
      <div class="card insight-card"><div class="section-title">Задачи по дням</div><div class="insight-chart" role="img" aria-label="Выполненные задачи за последние семь дней">${keys.map((key, i) => `<div class="insight-day"><span class="insight-count">${counts[i] || ""}</span><div class="insight-track"><i style="height:${counts[i] ? Math.max(14, Math.round(counts[i] / max * 100)) : 5}%"></i></div><small>${DAY[fromKey(key).getDay()]}</small></div>`).join("")}</div><p class="hint">${allDone.length ? "Каждый столбец показывает задачи, завершённые в этот день." : "Пока нет выполненных задач за неделю. Начните с одного небольшого шага."}</p></div>
      <div class="card routine-insight-card"><div class="row"><div class="grow"><strong>Режим дня</strong><small>${routineScheduled ? `${routineComplete} из ${routineScheduled} дней отмечены полностью` : "Пока нет пунктов режима"}</small></div><span>🗓️</span></div><div class="routine-insight-days">${routineDays.map((p) => `<button data-action="open-routine-day" data-date="${p.key}" aria-label="${esc(fmt(p.key, { weekday: "long", day: "numeric", month: "long" }))}: ${p.done} из ${p.total} пунктов"><span>${DAY[fromKey(p.key).getDay()]}</span><strong class="${p.total && p.done === p.total ? "complete" : ""}">${p.total ? `${p.done}/${p.total}` : "—"}</strong></button>`).join("")}</div><p class="hint">Нажмите на день, чтобы открыть расписание и отметить пункты.</p></div>
      <div class="insight-split"><div class="card"><span>📝 Личное</span><strong>${personalDone.length}</strong><small>за 7 дней</small></div><div class="card"><span>💼 Работа</span><strong>${workDone.length}</strong><small>за 7 дней</small></div><div class="card"><span>🎓 Универ</span><strong>${uniDone.length}</strong><small>за 7 дней</small></div><button class="card insight-gym" data-action="go" data-page="gym"><span>💪 Зал</span><strong>${gymDone.length}</strong><small>за 7 дней · открыть ›</small></button></div>
      ${overdue.length ? `<div class="section-title">Нужно внимание <small>${overdue.length} ближайших</small></div><div class="card insight-overdue">${overdue.map((t) => `<button data-action="open-task" data-kind="${t.kind}" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}"><span><strong>${esc(t.title)}</strong><small>${esc(t.source)} · срок ${esc(fmt(t.due, { day: "numeric", month: "short" }))}</small></span><b>›</b></button>`).join("")}</div>` : ""}`;
  }

  // src/views/tech.js
  function techDiagnostics() {
    const checks = [];
    let bytes = 0;
    try {
      const raw = localStorage.getItem(KEY), saved = raw && JSON.parse(raw);
      bytes = raw ? new Blob([raw]).size : 0;
      checks.push({
        ok: !raw || !!(saved?.version === 1 && Array.isArray(saved.projects) && Array.isArray(saved.subjects) && Array.isArray(saved.routine)),
        title: "Сохранение данных",
        detail: saved ? "Локальная копия читается" : "Данные сохранятся после первого изменения"
      });
    } catch (_) {
      checks.push({ ok: false, title: "Сохранение данных", detail: "Не удалось прочитать локальную копию" });
    }
    const invalid = invalidRoutineDoneCount();
    checks.push({
      ok: !invalid,
      title: "Отметки режима дня",
      detail: invalid ? `${invalid} записей относятся к удалённым пунктам` : "Повреждённых отметок не найдено"
    });
    checks.push({
      ok: bytes < 35e5,
      title: "Объём данных",
      detail: `${Math.round(bytes / 1024)} КБ в памяти браузера${bytes >= 35e5 ? " · рекомендуется экспортировать копию" : ""}`
    });
    const page = $("#page"), overflow = Number(page?.clientWidth) > 0 && page.scrollWidth > page.clientWidth + 2;
    checks.push({
      ok: !overflow,
      title: "Ширина экрана",
      detail: overflow ? "Обнаружен выход содержимого за правый край" : "На текущем экране горизонтального выхода нет"
    });
    const protocol = window.location?.protocol;
    checks.push({
      ok: true,
      title: "Работа без сети",
      detail: protocol === "file:" ? "Локальный HTML-файл доступен без сети" : navigator.serviceWorker?.controller ? "Файлы приложения сохранены для офлайн-режима" : "Офлайн-кэш активируется после установки и повторного открытия"
    });
    return checks;
  }
  function repairRoutineHistory() {
    const before = JSON.stringify(data.routineDone), events = new Map(data.routine.map((x) => [x.id, x]));
    for (const [key, entries] of Object.entries(data.routineDone)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(entries)) {
        delete data.routineDone[key];
        continue;
      }
      const valid = [...new Set(entries.filter((id) => events.has(id) && routineOccurs(events.get(id), key)))];
      if (valid.length) data.routineDone[key] = valid;
      else delete data.routineDone[key];
    }
    if (!save()) {
      data.routineDone = JSON.parse(before);
      return;
    }
    refreshPage(false);
    toast("Повреждённые отметки исправлены");
  }
  function renderTech() {
    const checks = techDiagnostics(), issues = checks.filter((x) => !x.ok).length, requests = (data.techRequests || []).slice().reverse();
    return `<button class="back-link" data-action="go" data-page="${view.assistantBack}">← ${view.assistantBack === "jarvis" ? "Jarvis" : "Настройки"}</button>${heading("ПРОВЕРКА И ИЗМЕНЕНИЯ", "Jarvis · приложение", "Описывайте ошибки и улучшения прямо в приложении.")}
      <div class="tech-hero"><span aria-hidden="true">🛠️</span><div><strong>Что нужно изменить?</strong><p>Создайте запрос с точным описанием. Его можно скачать как готовое задание для Claude Code.</p></div><button class="primary-btn" data-action="new-tech-request">+ Новый запрос</button></div>
      <div class="tech-stage"><strong>Сейчас: проверка и подготовка задания</strong><small>Автоматические правки кода, доступ к закрытому GitHub и Railway появятся после подключения сервера. HTML-макет не меняет свой код автоматически.</small></div>
      <div class="section-title">Проверка приложения <small>${issues ? `${issues} требуют внимания` : "всё в порядке"}</small></div>
      <div class="card tech-check-card">${checks.map((item) => `<div class="tech-check"><span class="${item.ok ? "good" : "attention"}">${item.ok ? "✓" : "!"}</span><div class="grow"><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div></div>`).join("")}${invalidRoutineDoneCount() ? `<button class="primary-btn tech-repair" data-action="repair-routine-data">Исправить отметки режима дня</button>` : ""}<button class="secondary-btn tech-refresh" data-action="run-tech-check">Проверить снова</button>${view.techCheckedAt ? `<p class="tech-check-time">Последняя проверка: ${esc(view.techCheckedAt)}</p>` : ""}</div>
      <div class="section-title">Мои запросы <small>${requests.length}</small></div>
      ${requests.length ? requests.map((request2) => `<div class="card tech-request-card"><div class="row"><span class="tech-request-kind">${esc({ bug: "Ошибка", design: "Дизайн", feature: "Функция" }[request2.kind] || "Изменение")}</span><span class="tiny muted">${esc(fmt(request2.createdAt.slice(0, 10), { day: "numeric", month: "short" }))}</span></div><strong>${esc(request2.area || "Приложение")}</strong><p>${esc(request2.description)}</p>${request2.expected ? `<small>Нужно получить: ${esc(request2.expected)}</small>` : ""}<div class="tech-request-actions"><button class="secondary-btn" data-action="download-tech-request" data-id="${safeId(request2.id)}">Скачать задание</button><button class="text-btn" data-action="delete-tech-request" data-id="${safeId(request2.id)}" aria-label="Удалить запрос">Удалить</button></div></div>`).join("") : `<div class="card tech-empty"><strong>Запросов пока нет</strong><p>Опишите баг или изменение — детали сохранятся на этом устройстве и войдут в резервную копию.</p></div>`}`;
  }

  // src/views/uni.js
  function renderUni() {
    const open = universityTasks().filter((t) => !t.doneAt), overdue = open.filter((t) => t.due && t.due < today()), dueSoon = open.filter((t) => t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
    const lessons = [];
    for (let n = 0; n < 7; n++) {
      const key = addDays(today(), n);
      for (const s of data.subjects) {
        const meeting = subjectMeeting(s, key);
        if (meeting) lessons.push({ key, subject: s, meeting });
      }
    }
    lessons.sort((a, b) => a.key.localeCompare(b.key) || a.subject.time.localeCompare(b.subject.time));
    const next = lessons[0], todayCount = lessons.filter((x) => x.key === today()).length;
    const list = data.subjects.map((s) => {
      const next2 = nextLesson(s), count = (s.tasks || []).filter((t) => !t.doneAt).length;
      return `<article class="card clickable subject-card" data-action="open-subject" data-subject-card data-search="${esc(s.name.toLowerCase())}" data-id="${safeId(s.id)}" ${view.uniQuery && !s.name.toLowerCase().includes(view.uniQuery.toLowerCase()) ? "hidden" : ""} tabindex="0" role="button"><div class="row"><div class="subject-icon">${esc(s.icon || "📚")}</div><div class="grow"><div class="card-title">${esc(s.name)}</div><div class="card-sub">${next2 ? `${esc(fmt(next2.key, { weekday: "short", day: "numeric", month: "short" }))} · ${esc(s.time)} · ${esc(next2.type)}` : "Ближайших занятий нет"}</div></div>${svg("chevron")}</div><div class="utility-row"><span class="tag amber">${count} задач</span>${s.room ? `<span class="tag">Ауд. ${esc(s.room)}</span>` : ""}${s.teacher ? `<span class="tag">${esc(s.teacher)}</span>` : ""}</div></article>`;
    }).join("");
    return `${heading("ВСЁ ПО УЧЁБЕ", "Универ", "Расписание, задания и ближайшие пары.", data.subjects.length ? "new-subject" : null)}
      ${data.subjects.length ? `<div class="uni-summary"><div><strong>${todayCount}</strong><span>${plural(todayCount, "пара", "пары", "пар")} сегодня</span></div><div><strong>${open.length}</strong><span>${plural(open.length, "задача", "задачи", "задач")}</span></div><div class="${overdue.length ? "urgent" : ""}"><strong>${overdue.length}</strong><span>просрочено</span></div></div><button class="task-hub-link" data-action="go" data-page="tasks">Все задачи <span>›</span></button>` : ""}
      ${data.subjects.length ? `<div class="uni-actions"><button class="primary-btn" data-action="quick-uni-task">+ Новое задание</button><button class="secondary-btn" data-action="export-calendar">↓ В календарь</button></div><button class="ai-entry" data-action="choose-seminar"><span class="ai-entry-icon">🎓</span><span class="grow"><strong>Jarvis · подготовка</strong><small>Тема, материалы и тренировка</small></span><span aria-hidden="true">›</span></button>` : ""}
      ${next ? `<button class="uni-next" data-action="open-subject" data-id="${safeId(next.subject.id)}"><div class="eyebrow">БЛИЖАЙШАЯ ПАРА <span aria-hidden="true">›</span></div><div class="row"><div class="grow"><strong>${esc(next.subject.name)}</strong><span>${esc(fmt(next.key, { weekday: "long", day: "numeric", month: "short" }))} · ${esc(next.subject.time)}${next.subject.room ? ` · ауд. ${esc(next.subject.room)}` : ""}</span></div><span class="tag lesson-kind ${next.meeting.type === "Семинар" ? "seminar" : "lecture"}">${esc(next.meeting.type)}</span></div></button>` : ""}
      ${lessons.length > 1 ? `<div class="section-title">Следующие пары</div><div class="card lesson-peek-list">${lessons.slice(1, 4).map(
      (x) => `<button class="lesson-peek" data-action="open-subject" data-id="${safeId(x.subject.id)}"><span class="lesson-peek-date"><strong>${esc(fmt(x.key, { day: "numeric" }))}</strong><small>${esc(fmt(x.key, { month: "short" }))}</small></span><span class="grow"><strong>${esc(x.subject.name)}</strong><small>${esc(x.subject.time)} · ${esc(x.meeting.type)}${x.subject.room ? ` · ауд. ${esc(x.subject.room)}` : ""}</small></span><span class="peek-arrow">›</span></button>`
    ).join("")}</div>` : ""}
      ${dueSoon.length ? `<div class="section-title">Ближайшие дедлайны</div><div class="card">${dueSoon.map((t) => `<div class="task-row"><button class="check-btn" data-action="toggle-task" data-kind="uni" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Выполнить задачу"></button><div class="task-text">${esc(t.title)}<span class="task-meta">${esc(t.subject)} · ${t.due < today() ? "Просрочено · " : ""}${esc(fmt(t.due, { day: "numeric", month: "short" }))}</span></div><button class="delete-btn" data-action="open-task" data-kind="uni" data-parent="${safeId(t.parentId)}" data-id="${safeId(t.id)}" aria-label="Открыть задание">›</button></div>`).join("")}</div>` : ""}
      <div class="section-title">Предметы <small>${data.subjects.length}</small></div>${data.subjects.length ? `<input class="subject-search" id="subject-search" type="search" placeholder="Найти предмет" value="${esc(view.uniQuery || "")}" aria-label="Найти предмет"><div id="subject-list">${list}</div><div class="search-empty" id="subject-search-empty" ${data.subjects.some((s) => s.name.toLowerCase().includes((view.uniQuery || "").trim().toLowerCase())) ? "hidden" : ""}>По этому запросу предметов нет. Попробуйте другое название.</div>` : empty("🎓", "Добавьте предмет", "Укажите дни и время пар, затем заведите задания.", "new-subject", "Добавить предмет")}`;
  }
  function renderSubject() {
    const s = data.subjects.find((x) => x.id === view.id);
    if (!s) {
      view.page = "uni";
      return renderUni();
    }
    const upcoming = upcomingLessons(s, 6, true), recent = [];
    for (let n = 1; n < 45 && recent.length < 4; n++) {
      const key = addDays(today(), -n);
      if (scheduledOn(s, key)) recent.push({ key, meeting: subjectMeeting(s, key) });
    }
    const tasks = s.tasks || [], open = tasks.filter((t) => !t.doneAt), completed = tasks.filter((t) => t.doneAt), shown = view.subjectFilter === "done" ? completed : view.subjectFilter === "all" ? tasks : open;
    return `<button class="back-link" data-action="go" data-page="uni">← Все предметы</button><div class="detail-head"><div class="row"><div class="subject-icon">${esc(s.icon || "📚")}</div><div class="grow"><h1>${esc(s.name)}</h1><p>${(s.days || []).map((d) => DAY[d]).join(", ")} · ${esc(s.time)} · ${Number(s.duration) || 90} мин${s.room ? ` · ауд. ${esc(s.room)}` : ""}</p></div><button class="icon-btn" data-action="edit-subject" data-id="${safeId(s.id)}" aria-label="Изменить предмет">✎</button></div>${s.teacher ? `<div class="subject-detail-line">👤 ${esc(s.teacher)}</div>` : ""}${s.notes ? `<div class="subject-detail-line">${esc(s.notes)}</div>` : ""}</div>
      <button class="ai-entry" data-action="open-seminar" data-id="${safeId(s.id)}"><span class="ai-entry-icon">✦</span><span class="grow"><strong>Jarvis · подготовка к ${s.mode === "lecture" ? "лекции" : s.mode === "general" ? "занятию" : "семинару"}</strong><small>Тема, файлы и самопроверка</small></span><span aria-hidden="true">›</span></button>
      <div class="subject-calendar-action"><button class="secondary-btn" data-action="export-calendar" data-id="${safeId(s.id)}">↓ Пары в календарь</button></div>
      ${overview(
      [
        [open.length, "активных задач"],
        [completed.length, "выполнено"],
        [upcoming.filter((x) => !x.cancelled).length, "занятий впереди"]
      ],
      "subject-overview"
    )}
      <div class="section-title">Ближайшие занятия</div><div class="card">${upcoming.length ? upcoming.map((x) => `<div class="lesson-row"><div class="lesson-date"><strong>${esc(fmt(x.key, { day: "numeric" }))}</strong><span>${esc(fmt(x.key, { month: "short" }))}</span></div><div class="grow"><strong class="lesson-kind ${x.cancelled ? "cancelled" : x.meeting.type === "Семинар" ? "seminar" : "lecture"}">${esc(x.cancelled ? "Отменено" : x.meeting.type)}</strong><small>${esc(fmt(x.key, { weekday: "long" }))} · ${esc(s.time)}${s.room ? ` · ${esc(s.room)}` : ""}</small></div><button class="icon-btn" data-action="lesson-options" data-parent="${safeId(s.id)}" data-date="${x.key}" aria-label="Изменить занятие">⋯</button></div>`).join("") : "Ближайших занятий нет."}</div>
      <div class="section-title">Задания <button class="text-btn" data-action="new-task" data-kind="uni" data-parent="${safeId(s.id)}">+ Добавить</button></div><div class="toolbar"><button class="filter-chip ${view.subjectFilter === "open" ? "active" : ""}" data-action="subject-filter" data-filter="open">Активные ${open.length}</button><button class="filter-chip ${view.subjectFilter === "done" ? "active" : ""}" data-action="subject-filter" data-filter="done">Готово ${completed.length}</button><button class="filter-chip ${view.subjectFilter === "all" ? "active" : ""}" data-action="subject-filter" data-filter="all">Все</button></div><div class="card">${shown.length ? taskRows(shown, "uni", s.id) : `<p class="small muted">${view.subjectFilter === "done" ? "Пока нет выполненных заданий." : "Здесь пока пусто."}</p>`}</div>
      ${recent.length ? `<div class="section-title">Прошедшие занятия</div><div class="card">${recent.map((x) => `<div class="lesson-row"><div class="lesson-date"><strong>${esc(fmt(x.key, { day: "numeric" }))}</strong><span>${esc(fmt(x.key, { month: "short" }))}</span></div><div class="grow"><strong>${esc(x.meeting?.type || "Отменено")}</strong><small>${esc(s.attendance?.[x.key] === "present" ? "Был на занятии" : s.attendance?.[x.key] === "absent" ? "Пропустил" : "Статус не указан")}</small></div><button class="icon-btn" data-action="lesson-options" data-parent="${safeId(s.id)}" data-date="${x.key}" aria-label="Статус занятия">⋯</button></div>`).join("")}</div>` : ""}
      <div class="utility-row"><button class="secondary-btn" data-action="delete-subject" data-id="${safeId(s.id)}">Удалить предмет</button></div>`;
  }
  function renderSeminar() {
    const s = data.subjects.find((x) => x.id === view.id);
    if (!s) {
      view.page = "uni";
      return renderUni();
    }
    const sessions = prepFor(s.id), p = sessions.find((x) => x.id === view.prepId) || sessions[0], next = nextSeminar(s);
    const answers = p?.answers || {}, answered = PREP_QUESTIONS.filter((_, i) => String(answers[i] || "").trim()).length;
    return `<button class="back-link" data-action="go" data-page="subject" data-id="${safeId(s.id)}">← ${esc(s.name)}</button>${heading("УВЕРЕННЕЕ НА ЗАНЯТИИ", "Jarvis · учёба", "Собери материалы и проверь, что можешь объяснить тему.")}
      <div class="ai-hero"><span aria-hidden="true">🎓</span><div><strong>${esc(s.name)}</strong><small>${next ? `Следующий ${esc(next.meeting.type.toLowerCase())}: ${esc(fmt(next.key, { weekday: "long", day: "numeric", month: "long" }))} · ${esc(s.time)}` : "Будущая дата в расписании пока не найдена"}</small></div></div>
      <div class="ai-stage"><strong>Jarvis · подготовка</strong><small>Тема, файлы и ответы сохраняются здесь. Анализ материалов появится после подключения OpenAI API.</small></div>
      <div class="section-title">Мои подготовки <button class="text-btn" data-action="new-seminar-prep" data-id="${safeId(s.id)}">+ Новая тема</button></div>
      ${sessions.length ? `<div class="prep-tabs">${sessions.map((x) => `<button class="prep-tab ${x.id === p?.id ? "active" : ""}" data-action="select-prep" data-id="${safeId(x.id)}" aria-pressed="${x.id === p?.id}"><strong>${esc(x.topic)}</strong><small>${esc(fmt(x.createdAt.slice(0, 10), { day: "numeric", month: "short" }))}</small></button>`).join("")}</div>` : empty("📚", "Начни с темы", "Укажи тему семинара и приложи фото, презентацию или документ.", "new-seminar-prep", "Создать подготовку")}
      ${p ? `<div class="card prep-card"><div class="row"><div class="grow"><div class="eyebrow">ТЕКУЩАЯ ТЕМА</div><h2>${esc(p.topic)}</h2></div><button class="text-btn" data-action="edit-seminar-prep" data-id="${safeId(p.id)}">Изменить</button></div>${p.context ? `<p class="prep-context">${esc(p.context)}</p>` : ""}<div class="prep-meta">${(p.attachments || []).length} материалов · ${answered}/${PREP_QUESTIONS.length} ответов</div></div>
      <div class="section-title">Материалы <small>${(p.attachments || []).length}</small></div><div class="card prep-materials">${(p.attachments || []).length ? (p.attachments || []).map((f) => `<div class="prep-file"><span aria-hidden="true">${f.type?.startsWith("image/") ? "🖼️" : "📄"}</span><span class="grow"><strong>${esc(f.name)}</strong><small>${Math.max(1, Math.round(f.size / 1024))} КБ · отдельно от резервной копии</small></span><button class="text-btn" data-action="open-prep-file" data-id="${safeId(f.id)}" data-prep="${safeId(p.id)}" aria-label="Открыть файл ${esc(f.name)}">Открыть</button></div>`).join("") : '<p class="small muted">Добавь презентацию, документ, фото или текстовый файл.</p>'}<button class="secondary-btn prep-add" data-action="add-prep-files" data-id="${safeId(p.id)}">+ Добавить файлы</button></div>
      <div class="section-title">Тренировка ответа <small data-answer-count>${answered}/${PREP_QUESTIONS.length}</small></div><p class="ai-helper-copy">${serverConfigured() ? "Ответь без подсказки, затем попроси разбор — Jarvis сверит ответы с приложенными материалами." : "Ответь без подсказки, затем проверь себя по своим материалам. Разбор от Jarvis появится после подключения сервера."}</p>${PREP_QUESTIONS.map((q, i) => `<div class="card prep-question"><div class="prep-question-title"><span>${i + 1}</span><strong>${esc(q)}</strong></div><textarea data-prep-answer="${i}" data-prep="${safeId(p.id)}" maxlength="3000" placeholder="Мой ответ…">${esc(answers[i] || "")}</textarea><small data-prep-save="${i}">Сохраняется автоматически</small></div>`).join("")}
      ${prepReviewCard(p)}
      <div class="card prep-export"><strong>Передать в ChatGPT</strong><p>Скачай пакет с темой, контекстом и своими ответами. Приложи к нему исходные файлы вручную — в HTML нет отправки файлов модели.</p><button class="primary-btn" data-action="export-prep" data-id="${safeId(p.id)}">↓ Скачать пакет подготовки</button></div><button class="text-btn danger-action prep-delete" data-action="delete-prep" data-id="${safeId(p.id)}">Удалить эту подготовку</button>` : ""}`;
  }
  function prepReviewCard(prep) {
    if (!prep || !serverConfigured()) return "";
    const state = view.prepReview?.id === prep.id ? view.prepReview : null;
    const body = state?.busy ? '<p class="ai-helper-copy">Jarvis читает ответы и материалы…</p>' : state?.error ? `<p class="chat-error">${esc(state.error)}</p>` : state?.text ? `<div class="prep-review-text">${esc(state.text).replace(/\n/g, "<br>")}</div>` : '<p class="ai-helper-copy">Jarvis разберёт ответы, укажет пробелы и даст три пункта на повторение. Картинки и PDF из материалов уходят вместе с ответами.</p>';
    return `<div class="card prep-review"><strong>Разбор от Jarvis</strong>${body}
      <button class="primary-btn" data-action="prep-review" data-id="${safeId(prep.id)}" ${state?.busy ? "disabled" : ""}>${state?.text ? "Разобрать заново" : "Разобрать мои ответы"}</button></div>`;
  }

  // src/views/work.js
  function renderWork() {
    const projects = data.projects.length, allTasks2 = data.projects.flatMap((p) => p.tasks || []), open = allTasks2.filter((t) => !t.doneAt).length, done = allTasks2.length - open;
    const query = view.workQuery.trim().toLocaleLowerCase("ru-RU");
    const list = data.projects.map((p) => {
      const done2 = (p.tasks || []).filter((t) => t.doneAt).length, total = (p.tasks || []).length, next = (p.tasks || []).filter((t) => !t.doneAt).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))[0], late = !!next?.due && next.due < today(), matches = `${p.name} ${p.description || ""}`.toLocaleLowerCase("ru-RU").includes(query);
      return `<article class="card clickable" data-action="open-project" data-project-card data-id="${safeId(p.id)}" ${matches ? "" : "hidden"} tabindex="0" role="button"><div class="row"><div class="project-logo" style="background:${esc(p.color || "#b16b4a")}33">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || "🚀")}</div><div class="grow"><div class="card-title">${esc(p.name)}</div><div class="card-sub">${esc(p.description || "Документация пока не добавлена")}</div></div>${svg("chevron")}</div><div class="utility-row"><span class="tag mint">${done2}/${total} готово</span><span class="tag purple">${(p.notes || []).length} ${plural((p.notes || []).length, "заметка", "заметки", "заметок")}</span></div><div class="project-card-next ${late ? "is-overdue" : ""}"><span>${late ? "ПРОСРОЧЕНО" : next ? "ДАЛЬШЕ" : "СОСТОЯНИЕ"}</span><strong>${esc(next?.title || "Активных задач нет")}</strong>${next?.due ? `<small>${esc(fmt(next.due, { day: "numeric", month: "short" }))}</small>` : ""}</div></article>`;
    }).join("");
    return `${heading("ТВОИ ИДЕИ В ДЕЛЕ", "Работа", "Проекты, документация и шаги к результату.", projects ? "new-project" : null)}${projects ? overview([
      [projects, "проектов"],
      [open, "в работе"],
      [done, "готово"]
    ]) : ""}${projects ? `<button class="task-hub-link" data-action="go" data-page="tasks">Все задачи <span>›</span></button>` : ""}${data.projects.length ? `<input class="subject-search" id="work-search" type="search" placeholder="Найти проект" value="${esc(view.workQuery)}" aria-label="Найти проект"><div id="project-list">${list}</div><div class="search-empty" id="work-search-empty" ${data.projects.some((p) => `${p.name} ${p.description || ""}`.toLocaleLowerCase("ru-RU").includes(query)) ? "hidden" : ""}>Проект не найден. Попробуйте другое слово.</div>` : empty("🚀", "Начните с проекта", "Создайте карточку, выберите логотип и запишите первую задачу.", "new-project", "Добавить проект")}`;
  }
  function renderProject() {
    const p = data.projects.find((x) => x.id === view.id);
    if (!p) {
      view.page = "work";
      return renderWork();
    }
    const total = (p.tasks || []).length, done = (p.tasks || []).filter((t) => t.doneAt).length, percent = total ? Math.round(done / total * 100) : 0, next = (p.tasks || []).filter((t) => !t.doneAt).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))[0];
    return `<button class="back-link" data-action="go" data-page="work">← Все проекты</button><div class="detail-head"><div class="row"><div class="project-logo" style="background:${esc(p.color || "#b16b4a")}55">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || "🚀")}</div><div class="grow"><h1>${esc(p.name)}</h1></div><button class="icon-btn" data-action="edit-project" data-id="${safeId(p.id)}" aria-label="Изменить проект">✎</button></div><div class="project-progress"><div><span>Прогресс</span><strong>${done}/${total} задач · ${percent}%</strong></div><div class="level-progress"><i style="width:${percent}%"></i></div></div></div>
      <button class="project-action ${next?.due && next.due < today() ? "is-overdue" : ""}" data-action="${next ? "open-task" : "new-task"}" data-kind="work" data-parent="${safeId(p.id)}" ${next ? `data-id="${safeId(next.id)}"` : ""}><span class="grow"><small>${next?.due && next.due < today() ? "ПРОСРОЧЕНО" : next ? "СЛЕДУЮЩИЙ ШАГ" : "ПЛАН ПРОЕКТА"}</small><strong>${esc(next?.title || "Добавить первую задачу")}</strong></span><span aria-hidden="true">›</span></button>
      <button class="ai-entry" data-action="open-project-ai" data-id="${safeId(p.id)}"><span class="ai-entry-icon">✦</span><span class="grow"><strong>Jarvis · проект</strong><small>Контекст, GitHub, Railway и поручения</small></span><span aria-hidden="true">›</span></button>
      <div class="section-title">Документация <button class="text-btn" data-action="edit-project" data-id="${safeId(p.id)}">Изменить</button></div><div class="card"><p class="doc-text">${esc(p.description || "Опишите здесь цель проекта, идею, ссылки и важный контекст.")}</p></div>
      <div class="section-title">Задачи <button class="text-btn" data-action="new-task" data-kind="work" data-parent="${safeId(p.id)}">+ Добавить</button></div><div class="card">${taskRows(p.tasks || [], "work", p.id)}</div>
      <div class="section-title">Рабочие заметки <button class="text-btn" data-action="new-project-note" data-parent="${safeId(p.id)}">+ Добавить</button></div>${(p.notes || []).length ? p.notes.slice().reverse().map(
      (n) => `<div class="card note-card" data-project-note-id="${safeId(n.id)}"><p>${esc(n.text)}</p><div class="row"><span class="tiny muted grow">${esc(fmt(n.createdAt.slice(0, 10)))}</span><button class="text-btn" data-action="edit-project-note" data-parent="${safeId(p.id)}" data-id="${safeId(n.id)}">Изменить</button><button class="delete-btn" data-action="delete-project-note" data-parent="${safeId(p.id)}" data-id="${safeId(n.id)}" aria-label="Удалить заметку">×</button></div></div>`
    ).join("") : `<div class="card small muted">Заметок пока нет.</div>`}
      <div class="utility-row"><button class="secondary-btn" data-action="delete-project" data-id="${safeId(p.id)}">Удалить проект</button></div>`;
  }
  function renderProjectAi() {
    const p = data.projects.find((x) => x.id === view.id);
    if (!p) {
      view.page = "work";
      return renderWork();
    }
    const ai = p.ai || {}, githubUrl = validGithubUrl(ai.githubUrl || ""), railwayUrl = validRailwayUrl(ai.railwayUrl || ""), open = (p.tasks || []).filter((t) => !t.doneAt), done = (p.tasks || []).length - open.length, requests = (ai.requests || []).slice().reverse();
    return `<button class="back-link" data-action="go" data-page="project" data-id="${safeId(p.id)}">← ${esc(p.name)}</button>${heading("КОНТЕКСТ ДЛЯ РАБОТЫ", "Jarvis · проект", "Помощник для проекта, который уже существует в приложении.")}
      <div class="ai-hero"><span aria-hidden="true">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || "🚀")}</span><div><strong>${esc(p.name)}</strong><small>${open.length} задач в работе · ${done} выполнено · ${(p.notes || []).length} заметок</small></div></div>
      <div class="ai-stage"><strong>Сейчас: память проекта и готовые запросы</strong><small>HTML собирает контекст из описания, задач и заметок. Ответы модели и доступ к закрытым данным появятся после серверного подключения.</small></div>
      <div class="section-title">Контекст Jarvis <button class="text-btn" data-action="edit-project-ai" data-id="${safeId(p.id)}">Настроить</button></div><div class="card ai-context"><div><span>Цель</span><strong>${esc(ai.goal || "Укажи главный результат проекта")}</strong></div><div><span>Описание</span><p>${esc(p.description || "Добавь документацию в карточке проекта.")}</p></div><div><span>Следующий шаг</span><strong>${esc(open.sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))[0]?.title || "Активных задач нет")}</strong></div><div><span>Последняя заметка</span><p>${esc((p.notes || []).at(-1)?.text || "Заметок пока нет")}</p></div></div>
      <div class="section-title">Источники проекта <small>подключение</small></div><div class="card ai-connections"><div class="ai-connection"><span class="ai-source">GH</span><div class="grow"><strong>GitHub</strong><small>${githubUrl ? "Ссылка сохранена · публичную историю можно проверить" : "Ссылка не добавлена"}</small></div>${githubUrl ? `<a href="${esc(githubUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть GitHub">↗</a>` : ""}</div>${githubUrl ? `<button class="secondary-btn" data-action="sync-github" data-id="${safeId(p.id)}">Проверить публичные изменения</button>` : ""}${ai.githubSnapshot ? `<div class="ai-snapshot"><strong>Последний доступный коммит</strong><p>${esc(ai.githubSnapshot.message)}</p><small>${esc(ai.githubSnapshot.date?.slice(0, 10) || "")} · ${esc(ai.githubSnapshot.sha?.slice(0, 7) || "")}</small></div>` : ""}<div class="ai-connection"><span class="ai-source rail">R</span><div class="grow"><strong>Railway</strong><small>${railwayUrl ? "Ссылка сохранена · данные развёртывания не читаются" : "Ссылка не добавлена"}</small></div>${railwayUrl ? `<a href="${esc(railwayUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть Railway">↗</a>` : ""}</div><button class="text-btn" data-action="edit-project-ai" data-id="${safeId(p.id)}">Изменить ссылки и цель</button></div>
      <div class="section-title">Поручения Jarvis <button class="text-btn" data-action="new-project-ai-request" data-id="${safeId(p.id)}">+ Новое</button></div>${requests.length ? requests.map((r) => `<div class="card ai-request"><div class="row"><strong class="grow">${esc(r.title)}</strong><span class="tiny muted">${esc(fmt(r.createdAt.slice(0, 10), { day: "numeric", month: "short" }))}</span></div><p>${esc(r.description)}</p><div class="ai-request-actions"><button class="secondary-btn" data-action="export-project-ai-request" data-id="${safeId(r.id)}">↓ Скачать для Claude Code</button><button class="text-btn danger-action" data-action="delete-project-ai-request" data-id="${safeId(r.id)}">Удалить</button></div></div>`).join("") : '<div class="card ai-empty"><strong>Что поручить?</strong><p>Например: изучить последний релиз, найти причину бага или составить план новой функции на основе задач проекта.</p><button class="primary-btn" data-action="new-project-ai-request" data-id="${safeId(p.id)}">+ Создать поручение</button></div>'}
      <button class="secondary-btn ai-tech-link" data-action="go" data-page="tech">🛠️ Jarvis · приложение →</button>`;
  }

  // src/ui/shell.js
  function topbar() {
    const jarvisActive = ["jarvis", "project-ai", "seminar"].includes(view.page) || ["phone", "tech"].includes(view.page) && view.assistantBack === "jarvis";
    $("#topbar").innerHTML = `<div class="brand"><div class="brand-mark">◉</div><div class="brand-name">Kamron APP</div></div><div class="top-actions"><button class="icon-btn" data-action="command-center" aria-label="Поиск и быстрые действия" title="Поиск">${svg("search")}</button><button class="icon-btn jarvis-trigger ${jarvisActive ? "active" : ""}" data-action="go" data-page="jarvis" aria-label="Открыть Jarvis" title="Jarvis" ${view.page === "jarvis" ? 'aria-current="page"' : ""}>${svg("jarvis")}<span>Jarvis</span></button></div>`;
  }
  function nav() {
    const items = [
      ["home", "Главная"],
      ["routine", "День"],
      ["more", "Ещё"]
    ];
    const assistantPage = ["jarvis", "project-ai", "seminar"].includes(view.page) || ["tech", "phone"].includes(view.page) && view.assistantBack === "jarvis";
    const active = assistantPage ? "" : view.page === "home" || view.page === "routine" ? view.page : "more";
    $("#nav").innerHTML = items.map(
      ([key, label]) => `<button class="nav-item ${active === key ? "active" : ""}" data-action="go" data-page="${key}" aria-label="${label}" ${active === key ? 'aria-current="page"' : ""}>${svg(key === "routine" ? "plan" : key)}<span>${label}</span></button>`
    ).join("");
  }
  function go(page, id = null) {
    const previous = view.page, previousId = view.id, pageEl = $("#page");
    scrollMemory.set(`${previous}:${previousId || ""}`, pageEl.scrollTop || 0);
    const backTo = {
      project: "work",
      subject: "uni",
      seminar: "subject",
      "project-ai": "project",
      phone: view.assistantBack,
      tech: view.assistantBack
    };
    const restore = backTo[previous] === page;
    if (page === "phone" || page === "tech")
      view.assistantBack = view.page === "jarvis" ? "jarvis" : "settings";
    if (page === "routine" && view.page !== "routine") {
      view.date = today();
      view.routineMode = "day";
      view.routineCalendarOpen = false;
    }
    if (page === "gym" && view.page !== "gym") view.date = today();
    view.page = page;
    view.id = id;
    rememberLocation();
    render();
    pageEl.scrollTop = restore ? scrollMemory.get(`${page}:${id || ""}`) || 0 : 0;
    pageEl.classList.add("page-enter");
    setTimeout(() => pageEl.classList.remove("page-enter"), 320);
  }
  function jumpToTask(kind, parent, id) {
    if (kind === "uni") view.subjectFilter = "all";
    go(kind === "work" ? "project" : "subject", parent);
    const row = [...$("#page").querySelectorAll("[data-task-row-id]")].find(
      (item) => item.dataset.taskRowId === id
    );
    if (row) {
      row.scrollIntoView({ block: "center", behavior: data.reduceMotion ? "auto" : "smooth" });
      row.classList.add("task-highlight");
      setTimeout(() => row.classList.remove("task-highlight"), 1400);
    }
  }
  function jumpToProjectNote(parent, id) {
    go("project", parent);
    const row = [...$("#page").querySelectorAll("[data-project-note-id]")].find(
      (item) => item.dataset.projectNoteId === id
    );
    if (row) {
      row.scrollIntoView({ block: "center", behavior: data.reduceMotion ? "auto" : "smooth" });
      row.classList.add("task-highlight");
      setTimeout(() => row.classList.remove("task-highlight"), 1400);
    }
  }
  function refreshPage(animate = true) {
    const pageEl = $("#page"), scroll = pageEl.scrollTop;
    render();
    pageEl.scrollTop = scroll;
    if (animate && !data.reduceMotion) {
      pageEl.classList.add("page-refresh");
      setTimeout(() => pageEl.classList.remove("page-refresh"), 300);
    }
  }
  function render() {
    flushPrepAnswer();
    document.body.dataset.theme = resolveTheme(data.theme);
    document.querySelector('meta[name="theme-color"]').content = THEMES[resolveTheme(data.theme)].color;
    document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').content = data.theme === "night" ? "black-translucent" : "default";
    document.body.classList.toggle("reduce-motion", data.reduceMotion);
    topbar();
    nav();
    const page = $("#page");
    page.className = `page ${view.page === "home" ? "dashboard" : ""}`;
    const map = {
      home: renderHome,
      more: renderMore,
      jarvis: renderJarvis,
      chat: renderChat,
      routine: renderRoutine,
      work: renderWork,
      project: renderProject,
      "project-ai": renderProjectAi,
      uni: renderUni,
      subject: renderSubject,
      seminar: renderSeminar,
      gym: renderGym,
      notes: renderNotes,
      games: renderGames,
      settings: renderSettings,
      phone: renderPhone,
      tasks: renderTasks,
      insights: renderInsights,
      tech: renderTech
    };
    page.innerHTML = (map[view.page] || renderHome)();
  }
  function rememberLocation() {
    if (!LINKABLE_PAGES.includes(view.page)) return;
    try {
      const next = view.page === "home" ? " " : `#${view.page}`;
      if (location.hash !== next.trim()) history.replaceState(null, "", next);
    } catch (_) {
    }
  }
  function pageFromLocation() {
    const name = (location.hash || "").replace("#", "");
    return LINKABLE_PAGES.includes(name) ? name : null;
  }

  // src/features/export.js
  function validGithubUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
      if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password || url.search || url.hash || parts.length !== 2 || !parts.every((x) => /^[\w.-]+$/.test(x)))
        return null;
      const repo = parts[1].replace(/\.git$/, "");
      if (!repo || repo === "." || repo === "..") return null;
      return `https://github.com/${parts[0]}/${repo}`;
    } catch (_) {
      return null;
    }
  }
  function validRailwayUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" && ["railway.com", "railway.app"].includes(url.hostname) && !url.username && !url.password && !url.search && !url.hash ? url.href : null;
    } catch (_) {
      return null;
    }
  }
  async function downloadPrep(prep) {
    const s = data.subjects.find((x) => x.id === prep.subjectId);
    if (!s) return;
    const lines = [
      `# Jarvis · подготовка к занятию: ${prep.topic}`,
      `Предмет: ${s.name}`,
      `Контекст: ${prep.context || "Не указан"}`,
      "",
      "## Материалы",
      ...(prep.attachments || []).map(
        (f) => `- ${f.name} (${Math.round(f.size / 1024)} КБ) — приложить оригинал к запросу`
      ),
      "",
      "## Мои ответы",
      ...PREP_QUESTIONS.flatMap((q, i) => [
        `${i + 1}. ${q}`,
        String(prep.answers?.[i] || "Пока без ответа"),
        ""
      ]),
      "## Задание для Jarvis",
      "Изучи приложенные файлы и тему. Составь понятный план семинара, выдели главные идеи и возможные вопросы преподавателя. Задавай мне вопросы по одному, оценивай мои ответы по фактам из материалов, мягко исправляй ошибки и повторяй слабые темы. Не выдумывай содержание файлов, которые не получил."
    ];
    for (const meta of prep.attachments || []) {
      if (!/\.(txt|md)$/i.test(meta.name) && meta.type !== "text/plain") continue;
      const file = await getPrepFile(meta.id).catch(() => null);
      if (file && file.size <= 3e5) {
        lines.push("", `## Текст файла: ${meta.name}`, String(await file.text()).slice(0, 12e4));
      }
    }
    downloadText(lines.join("\n"), `seminar-${safeDownloadPart(prep.topic)}.md`);
    toast("Пакет подготовки скачан");
  }
  function projectAiBrief(project, request2) {
    const ai = project.ai || {};
    return [
      `# Jarvis · ${project.name}`,
      `Поручение: ${request2.title}`,
      `Создано: ${request2.createdAt}`,
      "",
      "## Что нужно сделать",
      request2.description,
      "",
      "## Цель проекта",
      ai.goal || "Не указана",
      "",
      "## Документация",
      project.description || "Не добавлена",
      "",
      "## Активные задачи",
      ...(project.tasks || []).filter((t) => !t.doneAt).map((t) => `- ${t.title}${t.due ? ` · срок ${t.due}` : ""}`),
      "",
      "## Последние заметки",
      ...(project.notes || []).slice(-8).map((n) => `- ${n.text}`),
      "",
      "## Подключённые ссылки",
      `GitHub: ${ai.githubUrl || "не указан"}`,
      `Railway: ${ai.railwayUrl || "не указан"}`,
      ai.githubSnapshot ? `Последний публичный коммит: ${ai.githubSnapshot.sha.slice(0, 7)} — ${ai.githubSnapshot.message}` : "",
      "",
      "Проверь актуальное состояние проекта самостоятельно. Не изменяй продакшен и не публикуй изменения без просмотра пользователем."
    ].join("\n");
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url;
    link.download = `kamron-app-${today()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
    toast("Копия данных скачана");
  }
  function techBrief(request2) {
    const kind = { bug: "Исправление ошибки", design: "Изменение дизайна", feature: "Новая функция" }[request2.kind] || "Изменение";
    const checks = techDiagnostics().map((x) => `- ${x.ok ? "OK" : "Проверить"}: ${x.title} — ${x.detail}`).join("\n");
    return `# Kamron APP — ${kind}

Раздел: ${request2.area}
Создано: ${request2.createdAt}
Версия: ${APP_BUILD}

## Что нужно сделать

${request2.description}

## Ожидаемый результат

${request2.expected || "Уточнить по описанию выше."}

## Состояние макета

${checks}

## Файлы

- index.html — оболочка приложения
- styles.css — интерфейс
- src/ — исходный код по модулям (core, ui, views, forms, games, features)
- app.js — сборка из src/, редактировать напрямую нельзя
- README.md — описание поведения

Проверьте изменение в смартфонном размере и не отмечайте пользовательские задачи выполненными автоматически. Для правки кода работайте с исходниками проекта; публикацию выполняйте отдельно после проверки.
`;
  }
  function downloadTechRequest(request2) {
    const blob = new Blob([techBrief(request2)], { type: "text/markdown;charset=utf-8" }), url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url;
    link.download = `kamron-izmenenie-${request2.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 36)}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
    toast("Задание для Claude Code скачано");
  }
  function calendarText(value) {
    const slash = String.fromCharCode(92);
    return String(value ?? "").replaceAll(slash, slash + slash).replace(/\r\n|\r|\n/g, slash + "n").replaceAll(";", slash + ";").replaceAll(",", slash + ",");
  }
  function calendarStamp(date, utc = false) {
    const year = utc ? date.getUTCFullYear() : date.getFullYear(), month = utc ? date.getUTCMonth() + 1 : date.getMonth() + 1, day = utc ? date.getUTCDate() : date.getDate();
    const hours = utc ? date.getUTCHours() : date.getHours(), minutes = utc ? date.getUTCMinutes() : date.getMinutes(), seconds = utc ? date.getUTCSeconds() : date.getSeconds();
    return `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}${pad(seconds)}${utc ? "Z" : ""}`;
  }
  function foldCalendarLine(line) {
    const encoder = new TextEncoder();
    let current = "", bytes = 0;
    const parts = [];
    for (const char of line) {
      const size = encoder.encode(char).length;
      if (bytes + size > 73) {
        parts.push(current);
        current = " ";
        bytes = 1;
      }
      current += char;
      bytes += size;
    }
    parts.push(current);
    return parts.join("\r\n");
  }
  function exportCalendar(subjectId) {
    const subjects = subjectId ? data.subjects.filter((s) => s.id === subjectId) : data.subjects;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kamron APP//University Schedule//RU",
      "CALSCALE:GREGORIAN",
      "X-WR-CALNAME:Kamron APP"
    ];
    const stamp = calendarStamp(/* @__PURE__ */ new Date(), true);
    let count = 0;
    for (let n = 0; n < 90; n++) {
      const key = addDays(today(), n);
      for (const subject of subjects) {
        const meeting = subjectMeeting(subject, key);
        if (!meeting) continue;
        const [hour, minute] = String(subject.time || "10:00").split(":").map(Number), start = fromKey(key);
        start.setHours(hour || 0, minute || 0, 0, 0);
        const end = new Date(start.getTime() + (Number(subject.duration) || 90) * 6e4);
        const id = String(subject.id).replace(/[^a-zA-Z0-9_-]/g, "");
        lines.push(
          "BEGIN:VEVENT",
          "UID:" + id + "-" + key + "@kamron-app.local",
          "DTSTAMP:" + stamp,
          "DTSTART:" + calendarStamp(start),
          "DTEND:" + calendarStamp(end),
          "SUMMARY:" + calendarText(subject.name + " · " + meeting.type)
        );
        if (subject.room) lines.push("LOCATION:" + calendarText(subject.room));
        if (subject.teacher) lines.push("DESCRIPTION:" + calendarText("Преподаватель: " + subject.teacher));
        lines.push("END:VEVENT");
        count++;
      }
    }
    if (!count) {
      toast("В ближайшие 90 дней занятий нет");
      return;
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.map(foldCalendarLine).join("\r\n") + "\r\n"], {
      type: "text/calendar;charset=utf-8"
    }), url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url;
    link.download = subjectId ? "kamron-predmet.ics" : "kamron-univer.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
    toast(`Скачано ${count} пар для календаря`);
  }
  async function importData(file) {
    try {
      const imported = JSON.parse(await file.text());
      if (imported.version !== 1 || !Array.isArray(imported.projects) || !Array.isArray(imported.subjects) || !Array.isArray(imported.routine) || !Array.isArray(imported.notes))
        throw Error("format");
      if (!confirm("Заменить текущие данные данными из файла?")) return;
      const old = data, next = normalizeData(imported), nextFileIds = new Set(next.seminarPreps.flatMap((p) => p.attachments.map((f) => f.id)));
      setData(next);
      if (!save()) {
        setData(old);
        return;
      }
      for (const p of old.seminarPreps || [])
        for (const f of p.attachments || [])
          if (!nextFileIds.has(f.id)) await deletePrepFile(f.id).catch(() => {
          });
      view.block = null;
      view.merge = null;
      view.memory = null;
      view.prepId = null;
      view.page = "home";
      view.id = null;
      render();
      toast("Данные импортированы");
    } catch (_) {
      toast("Не удалось прочитать файл Kamron APP");
    }
  }

  // src/core/state.js
  var defaultRoutine = () => [
    { id: uid(), time: "07:30", title: "Подъём и вода", category: "Личное", days: [1, 2, 3, 4, 5] },
    { id: uid(), time: "08:00", title: "Завтрак и план дня", category: "Личное", days: [1, 2, 3, 4, 5] },
    { id: uid(), time: "09:00", title: "Главная задача", category: "Работа", days: [1, 2, 3, 4, 5] },
    { id: uid(), time: "13:00", title: "Обед и перерыв", category: "Личное", days: [1, 2, 3, 4, 5] },
    { id: uid(), time: "17:00", title: "Разбор задач и почты", category: "Работа", days: [1, 2, 3, 4, 5] },
    { id: uid(), time: "22:30", title: "Подготовка ко сну", category: "Личное", days: [0, 1, 2, 3, 4, 5, 6] },
    { id: uid(), time: "09:00", title: "Спокойное утро", category: "Личное", days: [0, 6] },
    { id: uid(), time: "12:00", title: "Свободный блок", category: "Личное", days: [0, 6] }
  ];
  var resolveTheme = (theme) => THEMES[theme] ? theme : OLD_THEMES[theme] || "sky";
  var emptyVoiceReport = () => ({ done: "", missed: "", reason: "", tomorrow: "" });
  var defaultPhone = () => ({
    telegramUser: "",
    timezone: "Asia/Tashkent",
    morning: "07:30",
    evening: "21:30",
    days: [0, 1, 2, 3, 4, 5, 6],
    tone: "direct",
    reports: {}
  });
  var defaults = () => ({
    version: 1,
    name: "Камрон",
    theme: "sky",
    reduceMotion: false,
    reminders: false,
    lead: 10,
    weeklyGoal: 5,
    routine: defaultRoutine(),
    routineDone: {},
    personalTasks: [],
    projects: [],
    subjects: [],
    seminarPreps: [],
    notes: [],
    techRequests: [],
    phone: defaultPhone(),
    gym: [],
    best: { block: 0, merge: 0, memory: 0 },
    games: {},
    server: defaultServer()
  });
  var defaultServer = () => ({ url: "", token: "" });
  function normalizeData(raw) {
    const fresh = defaults();
    const { focus: unusedFocus, focusHistory: unusedHistory, ...rest } = raw;
    const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromKey(value).getTime());
    const tasks = (list) => Array.isArray(list) ? list.filter((t) => t && typeof t.id === "string" && typeof t.title === "string").map((t) => ({
      ...t,
      title: t.title.slice(0, 120),
      due: isDate(t.due) ? t.due : "",
      priority: t.priority === "high" ? "high" : "normal",
      doneAt: typeof t.doneAt === "string" && Number.isFinite(Date.parse(t.doneAt)) ? t.doneAt : null
    })) : [];
    const routine = rest.routine.filter(
      (e) => e && typeof e.id === "string" && typeof e.title === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(e.time || "")
    ).map((e) => ({
      ...e,
      title: e.title === "Главный фокус" && e.time === "09:00" && e.category === "Работа" ? "Главная задача" : e.title,
      days: Array.isArray(e.days) ? [...new Set(e.days.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))] : [],
      ...e.date ? { date: isDate(e.date) ? e.date : today() } : {}
    }));
    const projects = rest.projects.filter((p) => p && typeof p.id === "string" && typeof p.name === "string").map((p) => ({
      ...p,
      tasks: tasks(p.tasks),
      notes: Array.isArray(p.notes) ? p.notes.filter((n) => n && typeof n.id === "string" && typeof n.text === "string").map((n) => ({
        ...n,
        createdAt: typeof n.createdAt === "string" && Number.isFinite(Date.parse(n.createdAt)) ? n.createdAt : (/* @__PURE__ */ new Date()).toISOString()
      })) : [],
      ai: p.ai && typeof p.ai === "object" ? {
        goal: String(p.ai.goal || "").slice(0, 240),
        githubUrl: validGithubUrl(String(p.ai.githubUrl || "")) || "",
        railwayUrl: validRailwayUrl(String(p.ai.railwayUrl || "")) || "",
        githubSnapshot: p.ai.githubSnapshot && typeof p.ai.githubSnapshot === "object" ? {
          sha: String(p.ai.githubSnapshot.sha || ""),
          message: String(p.ai.githubSnapshot.message || "").slice(0, 300),
          date: String(p.ai.githubSnapshot.date || "")
        } : null,
        requests: Array.isArray(p.ai.requests) ? p.ai.requests.filter(
          (r) => r && typeof r.id === "string" && typeof r.title === "string" && typeof r.description === "string" && typeof r.createdAt === "string"
        ).slice(-50) : []
      } : void 0
    }));
    const subjects = rest.subjects.filter((s) => s && typeof s.id === "string" && typeof s.name === "string").map((s) => ({
      ...s,
      tasks: tasks(s.tasks),
      days: Array.isArray(s.days) ? [...new Set(s.days.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))] : [],
      startDate: isDate(s.startDate) ? s.startDate : today(),
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time || "") ? s.time : "10:00",
      duration: Math.min(300, Math.max(15, Number(s.duration) || 90)),
      mode: ["alternate", "lecture", "seminar", "general"].includes(s.mode) ? s.mode : "general",
      firstType: s.firstType === "Семинар" ? "Семинар" : "Лекция",
      exceptions: s.exceptions && typeof s.exceptions === "object" && !Array.isArray(s.exceptions) ? s.exceptions : {},
      attendance: s.attendance && typeof s.attendance === "object" && !Array.isArray(s.attendance) ? s.attendance : {}
    }));
    const notes = rest.notes.filter((n) => n && typeof n.id === "string" && typeof n.body === "string").map((n) => ({
      ...n,
      title: typeof n.title === "string" ? n.title : "",
      category: ["Идея", "Личное", "Важное"].includes(n.category) ? n.category : "Личное",
      pinned: !!n.pinned,
      createdAt: typeof n.createdAt === "string" && Number.isFinite(Date.parse(n.createdAt)) ? n.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: typeof n.updatedAt === "string" && Number.isFinite(Date.parse(n.updatedAt)) ? n.updatedAt : void 0
    }));
    const rawGames = rest.games && typeof rest.games === "object" ? rest.games : {}, games = {};
    const validBoard = (game, size) => game && Array.isArray(game.grid) && game.grid.length === size && game.grid.every(
      (row) => Array.isArray(row) && row.length === size && row.every((value) => Number.isFinite(value) && value >= 0)
    );
    if (validBoard(rawGames.block, 8) && Array.isArray(rawGames.block.pieces) && rawGames.block.pieces.length === 3 && rawGames.block.pieces.every(
      (shape) => shape === null || Array.isArray(shape) && shape.length > 0 && shape.length <= 9 && shape.every((cell) => Array.isArray(cell) && cell.length === 2 && cell.every(Number.isInteger))
    ))
      games.block = rawGames.block;
    if (validBoard(rawGames.merge, 4) && rawGames.merge.grid.flat().some((value) => value > 0))
      games.merge = rawGames.merge;
    if (Array.isArray(rawGames.memory?.cards) && rawGames.memory.cards.length === 16 && rawGames.memory.cards.every((card) => typeof card === "string") && Array.isArray(rawGames.memory.matched) && Array.isArray(rawGames.memory.flipped)) {
      const matched = [
        ...new Set(rawGames.memory.matched.filter((index) => Number.isInteger(index) && index >= 0 && index < 16))
      ];
      games.memory = {
        ...rawGames.memory,
        busy: false,
        moves: Number.isInteger(rawGames.memory.moves) && rawGames.memory.moves >= 0 ? rawGames.memory.moves : 0,
        flipped: rawGames.memory.busy ? [] : rawGames.memory.flipped.filter((index) => Number.isInteger(index) && index >= 0 && index < 16 && !matched.includes(index)).slice(0, 1),
        matched: matched.length % 2 === 0 ? matched : []
      };
    }
    const seminarPreps = Array.isArray(rest.seminarPreps) ? rest.seminarPreps.filter(
      (p) => p && typeof p.id === "string" && typeof p.subjectId === "string" && typeof p.topic === "string"
    ).slice(-100).map((p) => ({
      ...p,
      createdAt: typeof p.createdAt === "string" && /^\d{4}-\d{2}-\d{2}/.test(p.createdAt) ? p.createdAt : (/* @__PURE__ */ new Date()).toISOString(),
      attachments: Array.isArray(p.attachments) ? p.attachments.filter(
        (f) => f && typeof f.id === "string" && typeof f.name === "string" && Number.isFinite(f.size)
      ).slice(0, 10) : [],
      answers: p.answers && typeof p.answers === "object" && !Array.isArray(p.answers) ? p.answers : {}
    })) : [];
    const phoneRaw = rest.phone && typeof rest.phone === "object" && !Array.isArray(rest.phone) ? rest.phone : {};
    const reports = {};
    if (phoneRaw.reports && typeof phoneRaw.reports === "object" && !Array.isArray(phoneRaw.reports)) {
      for (const [key, report] of Object.entries(phoneRaw.reports).slice(-120))
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && report && typeof report === "object")
          reports[key] = Object.fromEntries(
            Object.keys(emptyVoiceReport()).map((field) => [
              field,
              String(report[field] || "").slice(0, field === "tomorrow" ? 250 : 1e3)
            ])
          );
    }
    const phone = {
      ...defaultPhone(),
      telegramUser: /^@[A-Za-z0-9_]{5,32}$/.test(phoneRaw.telegramUser || "") ? phoneRaw.telegramUser : "",
      morning: /^([01]\d|2[0-3]):[0-5]\d$/.test(phoneRaw.morning || "") ? phoneRaw.morning : "07:30",
      evening: /^([01]\d|2[0-3]):[0-5]\d$/.test(phoneRaw.evening || "") ? phoneRaw.evening : "21:30",
      tone: ["supportive", "direct", "strict"].includes(phoneRaw.tone) ? phoneRaw.tone : "direct",
      days: Array.isArray(phoneRaw.days) ? [...new Set(phoneRaw.days.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))] : [0, 1, 2, 3, 4, 5, 6],
      reports
    };
    const serverRaw = rest.server && typeof rest.server === "object" ? rest.server : {};
    const serverUrl = String(serverRaw.url || "").trim();
    const server = {
      url: /^https:\/\/[^\s]+$/.test(serverUrl) || /^http:\/\/localhost(:\d+)?$/.test(serverUrl) ? serverUrl : "",
      token: String(serverRaw.token || "").trim().slice(0, 200)
    };
    return {
      ...fresh,
      ...rest,
      server,
      projects,
      subjects,
      notes,
      routine,
      routineDone: rest.routineDone && typeof rest.routineDone === "object" && !Array.isArray(rest.routineDone) ? rest.routineDone : {},
      personalTasks: tasks(rest.personalTasks),
      gym: Array.isArray(rest.gym) ? rest.gym.filter((x) => x && typeof x.id === "string" && isDate(x.date) && typeof x.title === "string").slice(-500) : [],
      seminarPreps,
      techRequests: Array.isArray(rest.techRequests) ? rest.techRequests.filter(
        (r) => r && typeof r.id === "string" && typeof r.description === "string" && typeof r.createdAt === "string" && /^\d{4}-\d{2}-\d{2}/.test(r.createdAt)
      ).slice(-100) : [],
      phone,
      theme: resolveTheme(raw.theme),
      best: rest.best && typeof rest.best === "object" ? {
        block: Number(rest.best.block) || 0,
        merge: Number(rest.best.merge) || 0,
        memory: Number(rest.best.memory) || 0
      } : fresh.best,
      games,
      name: typeof rest.name === "string" && rest.name.trim() ? rest.name.slice(0, 25) : fresh.name,
      reduceMotion: !!rest.reduceMotion,
      reminders: !!rest.reminders,
      lead: [0, 5, 10, 30].includes(Number(rest.lead)) ? Number(rest.lead) : 10,
      weeklyGoal: [3, 5, 7, 10, 15].includes(Number(raw.weeklyGoal)) ? Number(raw.weeklyGoal) : 5
    };
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && raw.version === 1 && Array.isArray(raw.projects) && Array.isArray(raw.subjects) && Array.isArray(raw.notes) && Array.isArray(raw.routine)) {
        const clean = normalizeData(raw);
        if ("focus" in raw || "focusHistory" in raw)
          try {
            localStorage.setItem(KEY, JSON.stringify(clean));
          } catch (_) {
          }
        return clean;
      }
    } catch (_) {
    }
    return defaults();
  }
  var data = load();
  var view = {
    page: "home",
    id: null,
    prepId: null,
    date: today(),
    routineMode: "day",
    routineCalendarOpen: false,
    settingsMoreOpen: false,
    assistantBack: "settings",
    noteFilter: "all",
    noteQuery: "",
    workQuery: "",
    uniQuery: "",
    subjectFilter: "open",
    taskFilter: "all",
    taskQuery: "",
    game: "block",
    block: null,
    merge: null,
    memory: null,
    dragging: null,
    techCheckedAt: null
  };
  var scrollMemory = /* @__PURE__ */ new Map();
  var shownReminders = /* @__PURE__ */ new Set();
  function reminded(key) {
    if (shownReminders.has(key)) return true;
    try {
      return !!sessionStorage.getItem(key);
    } catch (_) {
      return false;
    }
  }
  function markReminded(key) {
    shownReminders.add(key);
    try {
      sessionStorage.setItem(key, "1");
    } catch (_) {
    }
  }
  var onSaved = [];
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      onSaved.forEach((fn) => fn());
      return true;
    } catch (_) {
      toast("Не удалось сохранить. Проверьте память устройства и скачайте копию данных.");
      return false;
    }
  }
  var rt = {
    toastTimer: void 0,
    undoTask: null,
    modalSnapshot: null,
    prepAnswerTimer: null,
    pendingPrepAnswer: null,
    suppressCellClickUntil: 0,
    suppressPieceClickUntil: 0
  };
  function setData(next) {
    data = next;
  }

  // src/core/selectors.js
  function allTasks() {
    return [
      ...(data.personalTasks || []).map((t) => ({ ...t, source: "Личное", kind: "personal", parentId: "" })),
      ...data.projects.flatMap(
        (p) => (p.tasks || []).map((t) => ({ ...t, source: p.name, kind: "work", parentId: p.id }))
      ),
      ...data.subjects.flatMap(
        (s) => (s.tasks || []).map((t) => ({ ...t, source: s.name, kind: "uni", parentId: s.id }))
      )
    ];
  }
  function completedTasks() {
    return allTasks().filter((t) => t.doneAt);
  }
  function allOpenTasks() {
    return allTasks().filter((t) => !t.doneAt);
  }
  function dueTasks(key) {
    return allTasks().filter((t) => t.due === key);
  }
  function routineOccurs(event, key) {
    return event.date ? event.date === key : Array.isArray(event.days) && event.days.includes(fromKey(key).getDay());
  }
  function routineProgress(key) {
    const items = data.routine.filter((e) => routineOccurs(e, key));
    const done = new Set(Array.isArray(data.routineDone[key]) ? data.routineDone[key] : []);
    return { total: items.length, done: items.filter((e) => done.has(e.id)).length };
  }
  function routineCompleted(key, id) {
    return Array.isArray(data.routineDone[key]) && data.routineDone[key].includes(id);
  }
  function completedRoutineEntries() {
    const events = new Map(data.routine.map((e) => [e.id, e]));
    return Object.entries(data.routineDone).flatMap(
      ([key, entries]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= today() && Array.isArray(entries) ? [...new Set(entries)].filter((id) => events.has(id) && routineOccurs(events.get(id), key)).map((id) => ({ key, id })) : []
    );
  }
  function gameStats() {
    const tasks = completedTasks(), routine = completedRoutineEntries(), taskPoints = tasks.length * TASK_POINTS, routinePoints = routine.length * ROUTINE_POINTS, points = taskPoints + routinePoints;
    return {
      points,
      taskPoints,
      routinePoints,
      routineCount: routine.length,
      level: Math.floor(points / 250) + 1,
      streak: streak(tasks, routine)
    };
  }
  function streak(tasks, routine) {
    const dates = /* @__PURE__ */ new Set([...tasks.map((t) => dateKey(new Date(t.doneAt))), ...routine.map((x) => x.key)]);
    let day = today();
    if (!dates.has(day)) day = addDays(day, -1);
    let count = 0;
    while (dates.has(day)) {
      count++;
      day = addDays(day, -1);
    }
    return count;
  }
  function subjectMeeting(subject, key) {
    const days = subject.days || [];
    if (!days.includes(fromKey(key).getDay()) || key < subject.startDate) return null;
    const span = dayNumber(key) - dayNumber(subject.startDate) + 1, startDay = fromKey(subject.startDate).getDay();
    let index = Math.floor(span / 7) * days.length;
    for (let i = 0; i < span % 7; i++) if (days.includes((startDay + i) % 7)) index++;
    const exceptions = subject.exceptions || {};
    for (const [cancelledDate, exception] of Object.entries(exceptions))
      if (exception?.cancelled && cancelledDate >= subject.startDate && cancelledDate <= key && days.includes(fromKey(cancelledDate).getDay()))
        index--;
    if (exceptions[key]?.cancelled) return null;
    const mode = subject.mode;
    const type = mode === "alternate" ? index % 2 === 1 ? subject.firstType : subject.firstType === "Лекция" ? "Семинар" : "Лекция" : mode === "lecture" ? "Лекция" : mode === "seminar" ? "Семинар" : "Занятие";
    return { type, index };
  }
  function scheduledOn(subject, key) {
    return key >= subject.startDate && (subject.days || []).includes(fromKey(key).getDay());
  }
  function upcomingLessons(subject, limit = 5, includeCancelled = false) {
    const lessons = [];
    for (let n = 0; n < 90 && lessons.length < limit; n++) {
      const key = addDays(today(), n);
      if (!scheduledOn(subject, key)) continue;
      const meeting = subjectMeeting(subject, key);
      if (meeting || includeCancelled) lessons.push({ key, meeting, cancelled: !meeting });
    }
    return lessons;
  }
  function universityTasks() {
    return data.subjects.flatMap((s) => (s.tasks || []).map((t) => ({ ...t, subject: s.name, parentId: s.id })));
  }
  function dayItems(key) {
    const routine = data.routine.filter((e) => routineOccurs(e, key)).map((e) => ({ ...e, kind: "routine" }));
    const lessons = data.subjects.flatMap((s) => {
      const meeting = subjectMeeting(s, key);
      return meeting ? [
        {
          id: s.id,
          time: s.time,
          title: s.name,
          category: meeting.type,
          kind: "subject",
          room: s.room || "",
          attendance: s.attendance?.[key] || ""
        }
      ] : [];
    });
    return [...routine, ...lessons].sort((a, b) => a.time.localeCompare(b.time));
  }
  function nextThing() {
    const now = /* @__PURE__ */ new Date();
    const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    for (let n = 0; n < 7; n++) {
      const key = addDays(today(), n);
      const item = dayItems(key).find(
        (e) => (n > 0 || e.time >= hm) && (e.kind !== "routine" || !routineCompleted(key, e.id))
      );
      if (item) return { key, item };
    }
    return null;
  }
  function nextLesson(subject) {
    const next = upcomingLessons(subject, 1)[0];
    return next ? { key: next.key, ...next.meeting } : null;
  }
  function prepFor(subjectId) {
    return data.seminarPreps.filter((p) => p.subjectId === subjectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  function nextSeminar(subject) {
    return upcomingLessons(subject, 40).find(
      (x) => x.meeting?.type === (subject.mode === "lecture" ? "Лекция" : subject.mode === "general" ? "Занятие" : "Семинар")
    ) || null;
  }
  function invalidRoutineDoneCount() {
    const events = new Map(data.routine.map((x) => [x.id, x]));
    return Object.entries(data.routineDone).reduce((count, [key, entries]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(entries)) return count + 1;
      const valid = entries.filter((id) => events.has(id) && routineOccurs(events.get(id), key));
      return count + entries.length - new Set(valid).size;
    }, 0);
  }
  function getParent(kind, id) {
    return kind === "work" ? data.projects.find((x) => x.id === id) : kind === "uni" ? data.subjects.find((x) => x.id === id) : null;
  }
  function getTaskList(kind, parent) {
    return kind === "personal" ? data.personalTasks : getParent(kind, parent)?.tasks;
  }

  // src/features/incoming.js
  var CATEGORIES = ["Идея", "Личное", "Важное"];
  var ROUTINE_CATEGORIES = ["Личное", "Работа", "Учёба"];
  function taskList(kind) {
    if (kind === "work") return data.projects[0]?.tasks;
    if (kind === "uni") return data.subjects[0]?.tasks;
    return data.personalTasks;
  }
  function sameTaskExists(list, title) {
    const needle = title.trim().toLowerCase();
    return (list || []).some((task) => !task.doneAt && task.title.trim().toLowerCase() === needle);
  }
  function applyTask(payload) {
    const title = String(payload.title || "").trim().slice(0, 120);
    if (!title) return false;
    const list = taskList(payload.kind) || data.personalTasks;
    if (sameTaskExists(list, title)) return true;
    list.push({
      id: uid(),
      title,
      due: /^\d{4}-\d{2}-\d{2}$/.test(payload.due || "") ? payload.due : "",
      priority: payload.priority === "high" ? "high" : "normal",
      source: "звонок",
      doneAt: null
    });
    return true;
  }
  function applyRoutine(payload) {
    const time = String(payload.time || "");
    const title = String(payload.title || "").trim().slice(0, 120);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !title) return false;
    const days = Array.isArray(payload.days) ? [...new Set(payload.days.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))] : [];
    if (data.routine.some((item) => item.time === time && item.title.trim().toLowerCase() === title.toLowerCase()))
      return true;
    data.routine.push({
      id: uid(),
      time,
      title,
      category: ROUTINE_CATEGORIES.includes(payload.category) ? payload.category : "Личное",
      // Без дней недели это разовое дело, и оно привязывается к сегодняшнему дню.
      ...days.length ? { days } : { days: [], date: today() }
    });
    return true;
  }
  function applyNote(payload) {
    const body = String(payload.body || "").trim().slice(0, 4e3);
    if (!body) return false;
    data.notes.unshift({
      id: uid(),
      title: String(payload.title || "").slice(0, 120),
      body,
      category: CATEGORIES.includes(payload.category) ? payload.category : "Личное",
      pinned: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return true;
  }
  function applyComplete(payload) {
    const needle = String(payload.title || "").trim().toLowerCase();
    if (!needle) return false;
    const lists = [
      data.personalTasks,
      ...data.projects.map((project) => project.tasks),
      ...data.subjects.map((subject) => subject.tasks)
    ];
    for (const list of lists) {
      const task = (list || []).find((x) => !x.doneAt && x.title.trim().toLowerCase() === needle);
      if (task) {
        task.doneAt = (/* @__PURE__ */ new Date()).toISOString();
        return true;
      }
    }
    return true;
  }
  var APPLY = {
    task: applyTask,
    routine: applyRoutine,
    note: applyNote,
    complete: applyComplete
  };
  async function pullChanges() {
    if (!serverConfigured()) return;
    let changes;
    try {
      ({ изменения: changes } = await request("/api/changes", { timeout: 15e3 }));
    } catch (_) {
      return;
    }
    if (!Array.isArray(changes) || !changes.length) return;
    const applied = [];
    for (const change of changes) {
      const handler = APPLY[change?.kind];
      if (!handler) {
        applied.push(change.id);
        continue;
      }
      try {
        if (handler(change.data || {})) applied.push(change.id);
      } catch (_) {
      }
    }
    if (!applied.length) return;
    if (!save()) return;
    try {
      await request("/api/changes/ack", { method: "POST", body: { ids: applied } });
    } catch (_) {
    }
    toast(
      applied.length === 1 ? "Добавлена запись из звонка" : `Добавлено записей из звонка: ${applied.length}`
    );
    return applied.length;
  }

  // src/features/prep.js
  var SENDABLE = /^(image\/(png|jpe?g|gif|webp)|application\/pdf)$/;
  var BUDGET = 8 * 1024 * 1024;
  function toBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error || new Error("Не удалось прочитать файл"));
      reader.readAsDataURL(blob);
    });
  }
  async function collectAttachments(prep) {
    const out = [];
    let total = 0;
    for (const entry of (prep.attachments || []).slice(0, 6)) {
      if (!SENDABLE.test(entry.type || "")) continue;
      if (total + entry.size > BUDGET) continue;
      const blob = await getPrepFile(entry.id).catch(() => null);
      if (!blob) continue;
      total += entry.size;
      out.push({ mime: entry.type, data: await toBase64(blob) });
    }
    return out;
  }
  async function reviewPrep(prepId) {
    const prep = data.seminarPreps.find((x) => x.id === prepId);
    if (!prep) return;
    if (!serverConfigured()) {
      toast("Сервер Jarvis не подключён");
      return;
    }
    const answers = PREP_QUESTIONS.map((question, i) => ({
      question,
      answer: String(prep.answers?.[i] || "").trim()
    }));
    if (!answers.some((a) => a.answer)) {
      toast("Сначала ответьте хотя бы на один вопрос");
      return;
    }
    const subject = data.subjects.find((s) => s.id === prep.subjectId);
    view.prepReview = { id: prepId, busy: true, text: "", error: "" };
    render();
    try {
      const result = await seminarReview({
        subject: subject?.name || "",
        topic: prep.topic,
        answers,
        attachments: await collectAttachments(prep)
      });
      view.prepReview = { id: prepId, busy: false, text: result.review || "", error: "" };
    } catch (err) {
      view.prepReview = { id: prepId, busy: false, text: "", error: err.message };
    }
    render();
  }

  // src/features/reminders.js
  function checkReminders() {
    if (!data.reminders) return;
    const now = /* @__PURE__ */ new Date(), key = today(), minutes = now.getHours() * 60 + now.getMinutes();
    for (const item of dayItems(key)) {
      if (item.kind === "routine" && routineCompleted(key, item.id)) continue;
      const [h, m] = item.time.split(":").map(Number), target = h * 60 + m;
      if (minutes < target - data.lead || minutes > target) continue;
      const notificationKey = `kamron-${key}-${item.kind}-${item.id}-${item.time}`;
      if (reminded(notificationKey)) continue;
      markReminded(notificationKey);
      const message = `${item.title} · ${item.time}`;
      toast(`Скоро: ${message}`);
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        if (navigator.serviceWorker?.controller)
          navigator.serviceWorker.ready.then(
            (reg) => reg.showNotification("Kamron APP", { body: message, icon: "./icon.svg", tag: notificationKey })
          ).catch(() => {
          });
        else new Notification("Kamron APP", { body: message, tag: notificationKey });
      }
    }
    if (minutes >= 540) {
      for (const task of allOpenTasks().filter((t) => t.due && t.due <= key)) {
        const k = `kamron-task-${key}-${task.id}`;
        if (reminded(k)) continue;
        markReminded(k);
        const message = `${task.due < key ? "Просрочено" : "Сегодня срок"}: ${task.title}`;
        toast(message);
        if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
          if (navigator.serviceWorker?.controller)
            navigator.serviceWorker.ready.then((reg) => reg.showNotification("Kamron APP", { body: message, icon: "./icon.svg", tag: k })).catch(() => {
            });
          else new Notification("Kamron APP", { body: message, tag: k });
        }
      }
    }
  }

  // src/features/tasks.js
  function toggleTask(kind, parent, id) {
    const task = getTaskList(kind, parent)?.find((x) => x.id === id);
    if (!task) return;
    const previous = task.doneAt;
    task.doneAt = previous ? null : (/* @__PURE__ */ new Date()).toISOString();
    if (!save()) {
      task.doneAt = previous;
      return;
    }
    rt.undoTask = { type: "completion", kind, parent, id, previous, expires: Date.now() + 6e3 };
    refreshPage(false);
    toast(task.doneAt ? "+50 баллов · задача выполнена" : "Задача снова в работе", true);
  }
  function postponeTask(kind, parent, id) {
    const task = getTaskList(kind, parent)?.find((x) => x.id === id);
    if (!task || task.doneAt || !task.due || task.due > today()) return;
    const previous = task.due;
    task.due = addDays(today(), 1);
    if (!save()) {
      task.due = previous;
      return;
    }
    rt.undoTask = { type: "due", kind, parent, id, previous, expires: Date.now() + 6e3 };
    refreshPage(false);
    toast("Задача перенесена на завтра", true);
  }
  function toggleRoutine(key, id) {
    if (key > today()) {
      toast("Будущий день пока нельзя отметить");
      return;
    }
    const event = data.routine.find((e) => e.id === id && routineOccurs(e, key));
    if (!event) return;
    const previous = Array.isArray(data.routineDone[key]) ? data.routineDone[key].slice() : [];
    const done = new Set(previous), wasDone = done.has(id);
    if (wasDone) done.delete(id);
    else done.add(id);
    if (done.size) data.routineDone[key] = [...done];
    else delete data.routineDone[key];
    if (!save()) {
      if (previous.length) data.routineDone[key] = previous;
      else delete data.routineDone[key];
      return;
    }
    refreshPage(false);
    toast(wasDone ? `−${ROUTINE_POINTS} баллов · отметка снята` : `+${ROUTINE_POINTS} баллов · пункт выполнен`);
  }

  // src/forms/definitions.js
  function commandResults(query) {
    const q = query.trim().toLocaleLowerCase("ru-RU");
    if (!q) return "";
    const items = [];
    const add = (kind, id, parent, label, detail, haystack) => {
      if (`${label} ${detail} ${haystack || ""}`.toLocaleLowerCase("ru-RU").includes(q))
        items.push({ kind, id, parent, label, detail });
    };
    (data.personalTasks || []).forEach(
      (t) => add("personal-task", t.id, "", t.title, `Личная задача${t.doneAt ? " · выполнено" : ""}`, t.due || "")
    );
    data.projects.forEach((p) => {
      add("project", p.id, "", p.name, "Проект", p.description);
      (p.tasks || []).forEach(
        (t) => add("work-task", t.id, p.id, t.title, `Задача · ${p.name}${t.doneAt ? " · выполнено" : ""}`, p.name)
      );
      (p.notes || []).forEach(
        (n) => add("project-note", n.id, p.id, n.text.slice(0, 55), `Заметка · ${p.name}`, n.text)
      );
    });
    data.subjects.forEach((s) => {
      add("subject", s.id, "", s.name, "Предмет", `${s.teacher || ""} ${s.room || ""} ${s.notes || ""}`);
      (s.tasks || []).forEach(
        (t) => add("uni-task", t.id, s.id, t.title, `Задание · ${s.name}${t.doneAt ? " · выполнено" : ""}`, s.name)
      );
    });
    data.notes.forEach((n) => add("note", n.id, "", n.title || n.body.slice(0, 45), "Заметка", n.body));
    data.routine.forEach((e) => add("event", e.id, "", e.title, `Режим дня · ${e.time}`, e.category));
    if (!items.length) return '<div class="command-empty">Ничего не найдено. Попробуйте другое слово.</div>';
    return items.slice(0, 16).map(
      (item) => `<button class="command-result" data-action="command-open" data-kind="${item.kind}" data-id="${safeId(item.id)}" data-parent="${safeId(item.parent)}"><span class="command-result-icon" aria-hidden="true">${{ project: "💼", "personal-task": "📝", "work-task": "☑️", "project-note": "🗒️", subject: "🎓", "uni-task": "📌", note: "📝", event: "🗓️" }[item.kind]}</span><span class="command-result-copy"><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small></span><span class="command-result-arrow" aria-hidden="true">›</span></button>`
    ).join("") + (items.length > 16 ? `<div class="command-hint">Показаны первые 16 из ${items.length} результатов</div>` : "");
  }
  function commandCenter() {
    openModal(
      "Найти и добавить",
      `<div class="command-center"><label class="command-search">${svg("search")}<input id="global-search" type="search" autocomplete="off" placeholder="Проект, предмет, задача, заметка…" aria-label="Поиск по приложению"></label><div class="command-actions" id="command-actions"><div class="command-kicker">БЫСТРЫЕ ДЕЙСТВИЯ</div><div class="command-grid"><button data-action="command-create" data-kind="personal-task"><span>✅</span><strong>Личная задача</strong></button><button data-action="command-create" data-kind="note"><span>📝</span><strong>Заметка</strong></button><button data-action="command-create" data-kind="event"><span>🗓️</span><strong>Событие</strong></button><button data-action="command-create" data-kind="work-task"><span>💼</span><strong>Задача по работе</strong></button><button data-action="command-create" data-kind="uni-task"><span>📚</span><strong>Задание</strong></button><button data-action="command-create" data-kind="project"><span>🚀</span><strong>Проект</strong></button><button data-action="command-create" data-kind="subject"><span>🎓</span><strong>Предмет</strong></button><button data-action="command-create" data-kind="tasks"><span>☑️</span><strong>Все задачи</strong></button><button data-action="command-create" data-kind="insights"><span>📊</span><strong>Прогресс</strong></button><button data-action="command-create" data-kind="tech"><span>🛠️</span><strong>Jarvis · приложение</strong></button></div><p class="command-hint">Поиск доступен из любого раздела. На компьютере — ⌘ K.</p></div><div class="command-results" id="command-results" aria-live="polite" hidden></div></div>`
    );
  }
  function techRequestForm() {
    openModal(
      "Запрос на изменение",
      `<form class="form-grid" data-form="tech-request"><label>Что нужно сделать?<select name="kind"><option value="bug">Исправить ошибку</option><option value="design">Изменить дизайн</option><option value="feature">Добавить функцию</option></select></label><label>Где?<select name="area">${["Главная", "Режим дня", "Работа", "Универ", "Зал", "Заметки", "Игры", "Настройки", "Всё приложение"].map((area) => `<option>${area}</option>`).join("")}</select></label><label>Опишите подробно<textarea name="description" required maxlength="2000" placeholder="Что происходит сейчас? Как повторить проблему? Что хотите изменить?"></textarea></label><label>Каким должен быть результат?<textarea name="expected" maxlength="1000" placeholder="Например, карточка полностью помещается на iPhone"></textarea></label><p class="hint">Запрос хранится только здесь. Для изменения кода скачайте задание и передайте его Claude Code.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить запрос</button></div></form>`
    );
  }
  function seminarPrepForm(subjectId, prepId) {
    const s = data.subjects.find((x) => x.id === subjectId), p = data.seminarPreps.find((x) => x.id === prepId && x.subjectId === subjectId);
    if (!s) return;
    openModal(
      p ? "Изменить подготовку" : "Новая подготовка",
      `<form class="form-grid" data-form="seminar-prep" data-subject="${safeId(s.id)}" data-id="${safeId(prepId || "")}"><label>Тема занятия<input name="topic" required maxlength="140" value="${esc(p?.topic || "")}" placeholder="Например, основы маркетинговой стратегии"></label><label>Что важно знать или разобрать?<textarea name="context" maxlength="4000" placeholder="Вопросы преподавателя, план семинара, непонятные моменты…">${esc(p?.context || "")}</textarea></label>${!p ? `<label>Материалы<input type="file" name="materials" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,image/*"></label><p class="hint">Фото, PDF, презентации и документы сохраняются на этом устройстве. До 10 файлов по 15 МБ. Файлы не входят в JSON-копию; сохраните оригиналы отдельно.</p>` : ""}<div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
    );
  }
  function prepFilesForm(prepId) {
    const p = data.seminarPreps.find((x) => x.id === prepId);
    if (!p) return;
    openModal(
      "Добавить материалы",
      `<form class="form-grid" data-form="prep-files" data-id="${safeId(prepId)}"><label>Выбрать файлы<input type="file" name="materials" multiple required accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,image/*"></label><p class="hint">Файлы остаются только в памяти браузера на этом устройстве. До 10 файлов в одной теме, каждый до 15 МБ.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Добавить</button></div></form>`
    );
  }
  function projectAiForm(id) {
    const p = data.projects.find((x) => x.id === id);
    if (!p) return;
    const ai = p.ai || {};
    openModal(
      "Контекст и подключения",
      `<form class="form-grid" data-form="project-ai" data-id="${safeId(id)}"><label>Главный результат проекта<input name="goal" maxlength="240" value="${esc(ai.goal || "")}" placeholder="Например, запустить первую версию для клиентов"></label><label>Ссылка на репозиторий GitHub<input name="githubUrl" type="url" value="${esc(ai.githubUrl || "")}" placeholder="https://github.com/owner/repo"></label><label>Ссылка на проект Railway<input name="railwayUrl" type="url" value="${esc(ai.railwayUrl || "")}" placeholder="https://railway.com/project/..."></label><p class="hint">Ссылки сохраняются только для этого проекта. Закрытые репозитории, деплои и логи не подключаются в HTML. Никогда не вставляйте сюда токены или пароли.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
    );
  }
  function projectAiRequestForm(id) {
    const p = data.projects.find((x) => x.id === id);
    if (!p) return;
    openModal(
      "Поручение по проекту",
      `<form class="form-grid" data-form="project-ai-request" data-id="${safeId(id)}"><label>Короткое название<input name="title" required maxlength="120" placeholder="Например, найти причину ошибки входа"></label><label>Что нужно получить?<textarea name="description" required maxlength="2500" placeholder="Опиши задачу и критерий готовности…"></textarea></label><p class="hint">Поручение сохранится в проекте. Скачай его с контекстом проекта и передай Claude Code.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
    );
  }
  function projectForm(id) {
    const p = data.projects.find((x) => x.id === id), logo = p?.logo || "🚀";
    openModal(
      p ? "Изменить проект" : "Новый проект",
      `<form class="form-grid" data-form="project" data-id="${safeId(id || "")}"><label>Название<input name="name" required maxlength="60" value="${esc(p?.name || "")}" placeholder="Например, мой стартап"></label><label>Описание и документация<textarea name="description" placeholder="Цель, идея, важные ссылки и контекст">${esc(p?.description || "")}</textarea></label><label>Логотип</label><div class="emoji-picker">${EMOJI.map((e) => `<button type="button" class="emoji-option ${e === logo ? "active" : ""}" data-action="pick-emoji" data-emoji="${e}">${e}</button>`).join("")}</div><input type="hidden" name="logo" value="${esc(logo)}"><input type="hidden" name="clearImage" value=""><div class="form-two"><label>Цвет<input type="color" name="color" value="${esc(p?.color || "#b16b4a")}"></label><label>Или загрузить логотип<input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp"></label></div><p class="hint">Изображение до 400 КБ сохранится только на этом устройстве. Выбор эмодзи заменит ранее загруженный логотип.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">${p ? "Сохранить" : "Создать проект"}</button></div></form>`
    );
  }
  function subjectForm(id) {
    const s = data.subjects.find((x) => x.id === id), icons2 = ["📚", "🧮", "💻", "🧪", "🌍", "⚖️", "🗣️", "🎨"];
    openModal(
      s ? "Изменить предмет" : "Новый предмет",
      `<form class="form-grid" data-form="subject" data-id="${safeId(id || "")}">
      <label>Название предмета<input name="name" required maxlength="60" value="${esc(s?.name || "")}" placeholder="Например, алгоритмы"></label>
      <div class="form-two"><label>Время занятия<input type="time" name="time" required value="${esc(s?.time || "10:00")}"></label><label>Длительность, мин<input type="number" name="duration" min="15" max="300" step="5" required value="${Number(s?.duration) || 90}"></label></div><label>Первое занятие с<input type="date" name="startDate" required value="${esc(s?.startDate || today())}"></label>
      <label>Дни занятий</label>${weekdayInputs(s?.days || [])}
      <div class="form-two"><label>Преподаватель<input name="teacher" maxlength="60" value="${esc(s?.teacher || "")}" placeholder="Необязательно"></label><label>Аудитория<input name="room" maxlength="30" value="${esc(s?.room || "")}" placeholder="Например, 204"></label></div>
      <label>Значок<select name="icon">${icons2.map((icon) => `<option value="${icon}" ${icon === (s?.icon || "📚") ? "selected" : ""}>${icon}</option>`).join("")}</select></label>
      <label>Тип занятий<select name="mode"><option value="alternate" ${!s || s.mode === "alternate" ? "selected" : ""}>Лекция ↔ Семинар</option><option value="lecture" ${s?.mode === "lecture" ? "selected" : ""}>Только лекции</option><option value="seminar" ${s?.mode === "seminar" ? "selected" : ""}>Только семинары</option><option value="general" ${s?.mode === "general" ? "selected" : ""}>Без деления</option></select></label>
      <label class="first-type-row" ${s && s.mode !== "alternate" ? "hidden" : ""}>Первым будет<select name="firstType"><option value="Лекция" ${s?.firstType !== "Семинар" ? "selected" : ""}>Лекция</option><option value="Семинар" ${s?.firstType === "Семинар" ? "selected" : ""}>Семинар</option></select></label>
      <label>Важное о предмете<textarea name="notes" placeholder="Ссылка на материалы, требования, контакты...">${esc(s?.notes || "")}</textarea></label>
      <p class="hint">Если пара отменена, следующая получит её тип. Дни и время можно менять позже.</p>
      <div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
    );
  }
  function eventForm(id) {
    const e = data.routine.find((x) => x.id === id), once = !!e?.date, selectedDate = e?.date || (view.page === "routine" ? view.date : today());
    openModal(
      e ? "Изменить пункт" : "Новый пункт режима",
      `<form class="form-grid" data-form="event" data-id="${safeId(id || "")}"><label>Что запланировано<input name="title" required maxlength="70" value="${esc(e?.title || "")}" placeholder="Например, утренняя прогулка"></label><div class="form-two"><label>Время<input type="time" name="time" required value="${esc(e?.time || "09:00")}"></label><label>Раздел<select name="category"><option ${e?.category === "Личное" ? "selected" : ""}>Личное</option><option ${e?.category === "Работа" ? "selected" : ""}>Работа</option><option ${e?.category === "Учёба" ? "selected" : ""}>Учёба</option><option ${e?.category === "Другое" ? "selected" : ""}>Другое</option></select></label></div><label>Когда?<select name="repeat" id="event-repeat"><option value="once" ${!e || once ? "selected" : ""}>Один раз</option><option value="weekly" ${e && !once ? "selected" : ""}>Повторять по дням</option></select></label><div id="event-once" ${e && !once ? "hidden" : ""}><label>Дата<input type="date" name="date" value="${esc(selectedDate)}" required ${e && !once ? "disabled" : ""}></label></div><div id="event-weekly" ${!e || once ? "hidden" : ""}><label>Дни недели</label>${weekdayInputs(e?.days || [fromKey(selectedDate).getDay()])}</div><p class="hint">Отметка выполнения и +${ROUTINE_POINTS} баллов сохраняются для каждой даты отдельно.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div>${e ? `<button type="button" class="text-btn danger-action" data-action="delete-event" data-id="${safeId(e.id)}">Удалить пункт</button>` : ""}</form>`
    );
  }
  function gymLogForm(id) {
    const log = data.gym.find((x) => x.id === id);
    openModal(
      log ? "Изменить тренировку" : "Записать тренировку",
      `<form class="form-grid" data-form="gym-log" data-id="${safeId(id || "")}"><label>Дата<input type="date" name="date" required max="${today()}" value="${esc(log?.date || (view.date <= today() ? view.date : today()))}"></label><label>Что делал?<input name="title" required maxlength="80" value="${esc(log?.title || "")}" placeholder="Например, ноги и плечи"></label><div class="form-two"><label>Тип<select name="type"><option ${log?.type === "Силовая" ? "selected" : ""}>Силовая</option><option ${log?.type === "Кардио" ? "selected" : ""}>Кардио</option><option ${log?.type === "Растяжка" ? "selected" : ""}>Растяжка</option><option ${log?.type === "Другое" ? "selected" : ""}>Другое</option></select></label><label>Минуты<input type="number" name="duration" min="1" max="360" inputmode="numeric" value="${log?.duration ? Number(log.duration) : ""}" placeholder="Необязательно"></label></div><label>Заметка<textarea name="notes" maxlength="1500" placeholder="Упражнения, веса, самочувствие…">${esc(log?.notes || "")}</textarea></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div>${log ? `<button type="button" class="text-btn danger-action" data-action="delete-gym-log" data-id="${safeId(log.id)}">Удалить запись</button>` : ""}</form>`
    );
  }
  function taskForm(kind, parent, id) {
    const t = getTaskList(kind, parent)?.find((x) => x.id === id), due = t ? t.due || "" : kind === "personal" && view.page === "routine" ? view.date : "";
    openModal(
      t ? "Изменить задачу" : kind === "personal" ? "Личная задача" : "Новая задача",
      `<form class="form-grid" data-form="task" data-kind="${kind}" data-parent="${safeId(parent || "")}" data-id="${safeId(id || "")}"><label>Задача<input name="title" required maxlength="120" value="${esc(t?.title || "")}" placeholder="Что нужно сделать?"></label><div class="form-two"><label>Срок<input type="date" name="due" value="${esc(due)}"></label><label>Приоритет<select name="priority"><option value="normal" ${t?.priority !== "high" ? "selected" : ""}>Обычный</option><option value="high" ${t?.priority === "high" ? "selected" : ""}>Важный</option></select></label></div><p class="hint">${kind === "personal" ? "Личная задача не требует проекта. " : ""}За выполнение начисляется 50 баллов.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div>${t ? `<button type="button" class="text-btn danger-action" data-action="delete-task" data-kind="${kind}" data-parent="${safeId(parent || "")}" data-id="${safeId(t.id)}">Удалить задачу</button>` : ""}</form>`
    );
  }
  function quickUniTaskForm() {
    if (!data.subjects.length) {
      subjectForm();
      return;
    }
    openModal(
      "Быстрое задание",
      `<form class="form-grid" data-form="quick-uni-task"><label>Предмет<select name="subject">${data.subjects.map((s) => `<option value="${safeId(s.id)}">${esc(s.name)}</option>`).join("")}</select></label><label>Что нужно сделать?<input name="title" required maxlength="120" placeholder="Например, решить задачи к семинару"></label><div class="form-two"><label>Срок<input type="date" name="due"></label><label>Приоритет<select name="priority"><option value="normal">Обычный</option><option value="high">Важный</option></select></label></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Добавить</button></div></form>`
    );
  }
  function quickWorkTaskForm() {
    if (!data.projects.length) {
      projectForm();
      return;
    }
    openModal(
      "Быстрая задача",
      `<form class="form-grid" data-form="quick-work-task"><label>Проект<select name="project">${data.projects.map((p) => `<option value="${safeId(p.id)}">${esc(p.name)}</option>`).join("")}</select></label><label>Что нужно сделать?<input name="title" required maxlength="120" placeholder="Например, подготовить первый экран"></label><div class="form-two"><label>Срок<input type="date" name="due"></label><label>Приоритет<select name="priority"><option value="normal">Обычный</option><option value="high">Важный</option></select></label></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Добавить</button></div></form>`
    );
  }
  function lessonForm(parent, key) {
    const s = data.subjects.find((x) => x.id === parent);
    if (!s) return;
    const canceled = !!s.exceptions?.[key]?.cancelled, attendance = s.attendance?.[key] || "";
    openModal(
      `Занятие · ${esc(fmt(key, { day: "numeric", month: "long" }))}`,
      `<form class="form-grid" data-form="lesson" data-parent="${safeId(parent)}" data-date="${key}"><div class="card-sub">${esc(s.name)} · ${esc(s.time)}</div><label class="lesson-check"><input type="checkbox" name="cancelled" ${canceled ? "checked" : ""}> Пара отменена</label>${key <= today() ? `<label>Посещаемость<select name="attendance"><option value="" ${!attendance ? "selected" : ""}>Не отмечено</option><option value="present" ${attendance === "present" ? "selected" : ""}>Был на занятии</option><option value="absent" ${attendance === "absent" ? "selected" : ""}>Пропустил</option></select></label>` : ""}<p class="hint">Отменённая пара не участвует в чередовании. Следующая пара автоматически получит её тип.</p><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
    );
  }
  function noteForm(id) {
    const n = data.notes.find((x) => x.id === id);
    openModal(
      n ? "Изменить заметку" : "Новая заметка",
      `<form class="form-grid" data-form="note" data-id="${safeId(id || "")}"><label>Заголовок<input name="title" maxlength="80" value="${esc(n?.title || "")}" placeholder="Коротко о главном"></label><label>Текст<textarea name="body" required placeholder="Запишите мысль...">${esc(n?.body || "")}</textarea></label><div class="form-two"><label>Категория<select name="category"><option ${n?.category === "Идея" ? "selected" : ""}>Идея</option><option ${n?.category === "Личное" ? "selected" : ""}>Личное</option><option ${n?.category === "Важное" ? "selected" : ""}>Важное</option></select></label><label style="align-content:center;display:flex;align-items:center;gap:8px"><input type="checkbox" name="pinned" ${n?.pinned ? "checked" : ""} style="width:auto;min-height:auto"> Закрепить</label></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
    );
  }
  function projectNoteForm(parent, id) {
    const p = data.projects.find((x) => x.id === parent), note = p?.notes?.find((x) => x.id === id);
    if (!p) return;
    openModal(
      note ? "Изменить заметку" : "Заметка по проекту",
      `<form class="form-grid" data-form="project-note" data-parent="${safeId(parent)}" data-id="${safeId(id || "")}"><label>Что важно сохранить?<textarea name="text" required maxlength="4000" placeholder="Идея, решение или прогресс...">${esc(note?.text || "")}</textarea></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">${note ? "Сохранить" : "Добавить"}</button></div></form>`
    );
  }
  function serverForm() {
    const server = data.server || { url: "", token: "" };
    openModal(
      "Сервер Jarvis",
      `<form class="form-grid" data-form="server">
      <label>Адрес сервера<input name="url" type="url" inputmode="url" autocomplete="off" placeholder="https://kamron-app-server.up.railway.app" value="${esc(server.url)}"></label>
      <label>Ключ доступа<input name="token" type="password" autocomplete="off" placeholder="Значение APP_ACCESS_TOKEN с сервера" value="${esc(server.token)}"></label>
      <p class="form-note">Ключи Anthropic, OpenAI, GitHub и Railway вводятся только на сервере, в переменных окружения. В приложение их вводить не нужно.</p>
      <div class="form-actions">
        <button type="button" class="secondary-btn" data-action="server-check">Проверить связь</button>
        <button class="primary-btn" type="submit">Сохранить</button>
      </div>
      <p class="form-note" id="server-status"></p>
    </form>`
    );
  }

  // src/main.js
  async function onAction(el) {
    const a = el.dataset.action, id = el.dataset.id;
    if (a === "go") {
      go(el.dataset.page, id || null);
      return;
    }
    if (a === "open-seminar") {
      view.prepId = null;
      go("seminar", id);
      return;
    }
    if (a === "choose-project-ai") {
      openModal(
        "Выберите проект",
        `<div class="ai-chooser">${data.projects.map((p) => `<button class="command-result" data-action="choose-project-ai-item" data-id="${safeId(p.id)}"><span class="command-result-icon">${p.logoImage ? `<img src="${esc(p.logoImage)}" alt="">` : esc(p.logo || "🚀")}</span><span class="command-result-copy"><strong>${esc(p.name)}</strong><small>${(p.tasks || []).filter((t) => !t.doneAt).length} задач в работе</small></span><span class="command-result-arrow">›</span></button>`).join("")}</div>`
      );
      return;
    }
    if (a === "choose-project-ai-item") {
      closeModal();
      go("project-ai", id);
      return;
    }
    if (a === "choose-seminar") {
      openModal(
        "Выберите предмет",
        `<div class="ai-chooser">${data.subjects.map((s) => `<button class="command-result" data-action="choose-seminar-subject" data-id="${safeId(s.id)}"><span class="command-result-icon">${esc(s.icon || "📚")}</span><span class="command-result-copy"><strong>${esc(s.name)}</strong><small>${esc(nextSeminar(s)?.meeting.type || "Занятие")}</small></span><span class="command-result-arrow">›</span></button>`).join("")}</div>`
      );
      return;
    }
    if (a === "choose-seminar-subject") {
      closeModal();
      view.prepId = null;
      go("seminar", id);
      return;
    }
    if (a === "new-seminar-prep") {
      seminarPrepForm(id || view.id);
      return;
    }
    if (a === "edit-seminar-prep") {
      const p = data.seminarPreps.find((x) => x.id === id);
      if (p) seminarPrepForm(p.subjectId, id);
      return;
    }
    if (a === "select-prep") {
      view.prepId = id;
      refreshPage(false);
      return;
    }
    if (a === "add-prep-files") {
      prepFilesForm(id);
      return;
    }
    if (a === "open-prep-file") {
      const p = data.seminarPreps.find((x) => x.id === el.dataset.prep);
      if (!p?.attachments?.some((f) => f.id === id)) return;
      const file = await getPrepFile(id).catch(() => null);
      if (!file) {
        toast("Файл не найден на этом устройстве");
        return;
      }
      const url = URL.createObjectURL(file), link = document.createElement("a");
      link.href = url;
      link.download = p.attachments.find((f) => f.id === id).name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 3e3);
      return;
    }
    if (a === "prep-review") {
      await reviewPrep(id);
      return;
    }
    if (a === "export-prep") {
      const p = data.seminarPreps.find((x) => x.id === id);
      if (p) await downloadPrep(p);
      return;
    }
    if (a === "delete-prep") {
      const p = data.seminarPreps.find((x) => x.id === id);
      if (!p || !confirm("Удалить подготовку и материалы на этом устройстве?")) return;
      const prior = data.seminarPreps;
      data.seminarPreps = prior.filter((x) => x.id !== id);
      if (!save()) {
        data.seminarPreps = prior;
        return;
      }
      for (const f of p.attachments || []) await deletePrepFile(f.id).catch(() => {
      });
      view.prepId = null;
      refreshPage(false);
      toast("Подготовка удалена");
      return;
    }
    if (a === "open-project-ai") {
      go("project-ai", id);
      return;
    }
    if (a === "edit-project-ai") {
      projectAiForm(id);
      return;
    }
    if (a === "new-project-ai-request") {
      projectAiRequestForm(id);
      return;
    }
    if (a === "export-project-ai-request") {
      const p = data.projects.find((x) => (x.ai?.requests || []).some((r2) => r2.id === id)), r = p?.ai.requests.find((x) => x.id === id);
      if (p && r) {
        downloadText(
          projectAiBrief(p, r),
          `project-${safeDownloadPart(p.name)}-${safeDownloadPart(r.title)}.md`
        );
        toast("Поручение скачано");
      }
      return;
    }
    if (a === "delete-project-ai-request") {
      const p = data.projects.find((x) => (x.ai?.requests || []).some((r) => r.id === id));
      if (!p || !confirm("Удалить это поручение?")) return;
      const old = p.ai.requests;
      p.ai.requests = old.filter((x) => x.id !== id);
      if (!save()) {
        p.ai.requests = old;
        return;
      }
      refreshPage(false);
      return;
    }
    if (a === "server-form") {
      serverForm();
      return;
    }
    if (a === "server-check") {
      const form = el.closest("form"), status = form?.querySelector("#server-status");
      const url = form?.querySelector('input[name="url"]')?.value || "";
      if (status) status.textContent = "Проверяем…";
      try {
        const health = await checkServer(url);
        const caps = health.capabilities || {};
        const parts = [
          health.configured ? "ключ доступа задан" : "на сервере не задан APP_ACCESS_TOKEN",
          caps.jarvis ? `модель: ${caps.provider}` : "модель не настроена",
          caps.githubPrivate ? "GitHub с токеном" : "GitHub только публичный",
          caps.railway ? "Railway подключён" : "Railway не настроен"
        ];
        if (status) status.textContent = `Связь есть. ${parts.join(", ")}.`;
      } catch (err) {
        if (status) status.textContent = `Не вышло: ${err.message}`;
      }
      return;
    }
    if (a === "chat-starter") {
      await sendChatMessage(el.dataset.text || "");
      return;
    }
    if (a === "chat-clear") {
      clearChat();
      return;
    }
    if (a === "sync-github") {
      const p = data.projects.find((x) => x.id === id), github = validGithubUrl(p?.ai?.githubUrl || "");
      if (!p || !github) return;
      const parts = new URL(github).pathname.split("/").filter(Boolean);
      el.disabled = true;
      el.textContent = "Проверяем…";
      try {
        let commit;
        if (serverConfigured()) {
          const result = await githubCommit(github);
          if (result.empty) throw new Error("empty");
          commit = { sha: result.sha, commit: { message: result.message, committer: { date: result.date } } };
        } else {
          const response = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}/commits?per_page=1`,
            { headers: { Accept: "application/vnd.github+json" } }
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const commits = await response.json();
          if (!Array.isArray(commits) || !commits[0]) throw new Error("empty");
          commit = commits[0];
        }
        p.ai.githubSnapshot = {
          sha: String(commit.sha || ""),
          message: String(commit.commit?.message || "").split("\n")[0].slice(0, 300),
          date: String(commit.commit?.committer?.date || ""),
          checkedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (save()) {
          refreshPage(false);
          toast("Публичные изменения обновлены");
        }
      } catch (error) {
        el.disabled = false;
        el.textContent = "Проверить публичные изменения";
        toast("Не удалось прочитать публичный GitHub. Проверьте сеть и доступ.");
      }
      return;
    }
    if (a === "settings") {
      go("settings");
      return;
    }
    if (a === "toggle-settings-more") {
      view.settingsMoreOpen = !view.settingsMoreOpen;
      refreshPage(false);
      return;
    }
    if (a === "open-task") {
      if (el.dataset.kind === "personal") taskForm("personal", "", id);
      else jumpToTask(el.dataset.kind, el.dataset.parent, id);
      return;
    }
    if (a === "command-center") {
      commandCenter();
      return;
    }
    if (a === "command-create") {
      closeModal();
      if (el.dataset.kind === "personal-task") taskForm("personal", "");
      else if (el.dataset.kind === "note") noteForm();
      else if (el.dataset.kind === "event") eventForm();
      else if (el.dataset.kind === "work-task") quickWorkTaskForm();
      else if (el.dataset.kind === "uni-task") data.subjects.length ? quickUniTaskForm() : subjectForm();
      else if (el.dataset.kind === "project") projectForm();
      else if (el.dataset.kind === "subject") subjectForm();
      else if (el.dataset.kind === "tasks") go("tasks");
      else if (el.dataset.kind === "insights") go("insights");
      else if (el.dataset.kind === "tech") go("tech");
      return;
    }
    if (a === "command-open") {
      closeModal();
      const kind = el.dataset.kind;
      if (kind === "personal-task") taskForm("personal", "", id);
      else if (kind === "project") go("project", id);
      else if (kind === "subject") go("subject", id);
      else if (kind === "work-task") jumpToTask("work", el.dataset.parent, id);
      else if (kind === "project-note") jumpToProjectNote(el.dataset.parent, id);
      else if (kind === "uni-task") jumpToTask("uni", el.dataset.parent, id);
      else if (kind === "note") noteForm(id);
      else if (kind === "event") eventForm(id);
      return;
    }
    if (a === "set-theme") {
      if (!THEMES[el.dataset.theme]) return;
      const pageEl = $("#page"), scroll = pageEl.scrollTop;
      data.theme = el.dataset.theme;
      save();
      render();
      pageEl.scrollTop = scroll;
      pageEl.classList.add("page-enter");
      setTimeout(() => pageEl.classList.remove("page-enter"), 420);
      return;
    }
    if (a === "open-project") {
      go("project", id);
      return;
    }
    if (a === "open-subject") {
      go("subject", id);
      return;
    }
    if (a === "close-modal") {
      closeModal();
      return;
    }
    if (a === "new-project" || a === "edit-project") {
      projectForm(id);
      return;
    }
    if (a === "new-subject" || a === "edit-subject") {
      subjectForm(id);
      return;
    }
    if (a === "new-event" || a === "edit-event") {
      eventForm(id);
      return;
    }
    if (a === "new-gym-log" || a === "edit-gym-log") {
      gymLogForm(id);
      return;
    }
    if (a === "new-personal-task") {
      taskForm("personal", "");
      return;
    }
    if (a === "new-task-hub") {
      openModal(
        "Новая задача",
        `<div class="ai-chooser"><button class="command-result" data-action="choose-task-kind" data-kind="personal"><span class="command-result-icon">📝</span><span class="command-result-copy"><strong>Личная</strong><small>Дело без проекта или предмета</small></span><span class="command-result-arrow">›</span></button><button class="command-result" data-action="choose-task-kind" data-kind="work"><span class="command-result-icon">💼</span><span class="command-result-copy"><strong>Работа</strong><small>${data.projects.length ? "Задача внутри проекта" : "Сначала создадим проект"}</small></span><span class="command-result-arrow">›</span></button><button class="command-result" data-action="choose-task-kind" data-kind="uni"><span class="command-result-icon">🎓</span><span class="command-result-copy"><strong>Универ</strong><small>${data.subjects.length ? "Задание по предмету" : "Сначала добавим предмет"}</small></span><span class="command-result-arrow">›</span></button></div>`
      );
      return;
    }
    if (a === "choose-task-kind") {
      closeModal();
      if (el.dataset.kind === "personal") taskForm("personal", "");
      else if (el.dataset.kind === "work") quickWorkTaskForm();
      else if (el.dataset.kind === "uni") quickUniTaskForm();
      return;
    }
    if (a === "new-task" || a === "edit-task") {
      taskForm(el.dataset.kind, el.dataset.parent, id);
      return;
    }
    if (a === "quick-work-task") {
      quickWorkTaskForm();
      return;
    }
    if (a === "quick-uni-task") {
      quickUniTaskForm();
      return;
    }
    if (a === "lesson-options") {
      lessonForm(el.dataset.parent, el.dataset.date);
      return;
    }
    if (a === "subject-filter") {
      view.subjectFilter = el.dataset.filter;
      refreshPage();
      return;
    }
    if (a === "task-filter") {
      const left = $("#page").querySelector?.(".task-hub-filters")?.scrollLeft || 0;
      view.taskFilter = el.dataset.filter;
      refreshPage();
      const bar = $("#page").querySelector?.(".task-hub-filters");
      if (bar) bar.scrollLeft = left;
      return;
    }
    if (a === "new-note" || a === "edit-note") {
      noteForm(id);
      return;
    }
    if (a === "new-tech-request") {
      techRequestForm();
      return;
    }
    if (a === "run-tech-check") {
      view.techCheckedAt = (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      refreshPage(false);
      toast("Проверка завершена");
      return;
    }
    if (a === "repair-routine-data") {
      repairRoutineHistory();
      return;
    }
    if (a === "download-tech-request") {
      const request2 = data.techRequests.find((x) => x.id === id);
      if (request2) downloadTechRequest(request2);
      return;
    }
    if (a === "delete-tech-request") {
      if (!confirm("Удалить этот запрос на изменение?")) return;
      const previous = data.techRequests;
      data.techRequests = previous.filter((x) => x.id !== id);
      if (!save()) {
        data.techRequests = previous;
        return;
      }
      refreshPage(false);
      toast("Запрос удалён");
      return;
    }
    if (a === "new-project-note" || a === "edit-project-note") {
      projectNoteForm(el.dataset.parent, id);
      return;
    }
    if (a === "edit-name") {
      openModal(
        "Ваше имя",
        `<form class="form-grid" data-form="name"><label>Как к вам обращаться?<input name="name" maxlength="25" required value="${esc(data.name)}"></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-modal">Отмена</button><button class="primary-btn">Сохранить</button></div></form>`
      );
      return;
    }
    if (a === "pick-emoji") {
      const picker = el.closest("form");
      picker.querySelector('[name="logo"]').value = el.dataset.emoji;
      picker.querySelector('[name="clearImage"]').value = "1";
      picker.querySelector('[name="logoFile"]').value = "";
      picker.querySelectorAll(".emoji-option").forEach((b) => b.classList.toggle("active", b === el));
      return;
    }
    if (a === "day-step") {
      view.date = addDays(view.date, Number(el.dataset.step));
      refreshPage();
      return;
    }
    if (a === "routine-today") {
      view.date = today();
      view.routineMode = "day";
      refreshPage(false);
      $("#page").scrollTop = 0;
      return;
    }
    if (a === "gym-today") {
      view.date = today();
      refreshPage(false);
      return;
    }
    if (a === "jump-routine-item") {
      const row = [...$("#page").querySelectorAll("[data-routine-item]")].find(
        (item) => item.dataset.routineItem === id
      );
      if (row) {
        row.scrollIntoView({ block: "center", behavior: data.reduceMotion ? "auto" : "smooth" });
        row.classList.add("task-highlight");
        setTimeout(() => row.classList.remove("task-highlight"), 1400);
      }
      return;
    }
    if (a === "toggle-routine-calendar") {
      view.routineCalendarOpen = !view.routineCalendarOpen;
      refreshPage(false);
      return;
    }
    if (a === "routine-mode") {
      view.routineMode = el.dataset.mode === "week" ? "week" : "day";
      refreshPage(false);
      $("#page").scrollTop = 0;
      return;
    }
    if (a === "open-routine-day") {
      view.page = "routine";
      view.date = el.dataset.date;
      view.routineMode = "day";
      refreshPage(false);
      $("#page").scrollTop = 0;
      return;
    }
    if (a === "pick-day") {
      view.date = el.dataset.date;
      refreshPage();
      return;
    }
    if (a === "month-step") {
      const d = fromKey(view.date);
      d.setDate(1);
      d.setMonth(d.getMonth() + Number(el.dataset.step));
      view.date = dateKey(d);
      refreshPage();
      return;
    }
    if (a === "note-filter") {
      view.noteFilter = el.dataset.filter;
      refreshPage();
      return;
    }
    if (a === "toggle-note-pin") {
      const note = data.notes.find((x) => x.id === id);
      if (!note) return;
      const old = note.pinned;
      note.pinned = !old;
      if (!save()) {
        note.pinned = old;
        return;
      }
      refreshPage(false);
      toast(note.pinned ? "Заметка закреплена" : "Заметка откреплена");
      return;
    }
    if (a === "toggle-task") {
      toggleTask(el.dataset.kind, el.dataset.parent, id);
      return;
    }
    if (a === "postpone-task") {
      postponeTask(el.dataset.kind, el.dataset.parent, id);
      return;
    }
    if (a === "toggle-routine") {
      toggleRoutine(el.dataset.date, id);
      return;
    }
    if (a === "undo-task") {
      const action = rt.undoTask;
      if (!action || Date.now() > action.expires) {
        toast("Время отмены вышло");
        return;
      }
      const task = getTaskList(action.kind, action.parent)?.find((x) => x.id === action.id);
      if (!task) {
        toast("Задача больше не найдена");
        return;
      }
      const field = action.type === "due" ? "due" : "doneAt", current = task[field];
      task[field] = action.previous;
      if (!save()) {
        task[field] = current;
        return;
      }
      rt.undoTask = null;
      refreshPage(false);
      toast("Действие отменено");
      return;
    }
    if (a === "delete-task") {
      if (!confirm("Удалить эту задачу?")) return;
      const tasks = getTaskList(el.dataset.kind, el.dataset.parent);
      if (!tasks) return;
      const index = tasks.findIndex((x) => x.id === id);
      if (index < 0) return;
      const [removed] = tasks.splice(index, 1);
      if (!save()) {
        tasks.splice(index, 0, removed);
        return;
      }
      closeModal(true);
      render();
      return;
    }
    if (a === "delete-project") {
      if (!confirm("Удалить проект вместе с задачами, заметками и поручениями?")) return;
      const old = data.projects;
      data.projects = old.filter((x) => x.id !== id);
      if (!save()) {
        data.projects = old;
        return;
      }
      go("work");
      return;
    }
    if (a === "delete-subject") {
      if (!confirm("Удалить предмет, задания и все подготовки к нему?")) return;
      const oldSubjects = data.subjects, oldPreps = data.seminarPreps, removed = oldPreps.filter((p) => p.subjectId === id);
      data.subjects = oldSubjects.filter((x) => x.id !== id);
      data.seminarPreps = oldPreps.filter((p) => p.subjectId !== id);
      if (!save()) {
        data.subjects = oldSubjects;
        data.seminarPreps = oldPreps;
        return;
      }
      for (const p of removed) for (const f of p.attachments || []) await deletePrepFile(f.id).catch(() => {
      });
      go("uni");
      return;
    }
    if (a === "delete-event") {
      if (!confirm("Удалить событие из расписания?")) return;
      const before = JSON.stringify(data);
      data.routine = data.routine.filter((x) => x.id !== id);
      for (const [key, ids] of Object.entries(data.routineDone)) {
        if (Array.isArray(ids)) {
          const remaining = ids.filter((x) => x !== id);
          if (remaining.length) data.routineDone[key] = remaining;
          else delete data.routineDone[key];
        }
      }
      if (!save()) {
        setData(JSON.parse(before));
        return;
      }
      closeModal(true);
      render();
      return;
    }
    if (a === "delete-gym-log") {
      if (!confirm("Удалить эту запись тренировки?")) return;
      const old = data.gym;
      data.gym = old.filter((x) => x.id !== id);
      if (!save()) {
        data.gym = old;
        return;
      }
      closeModal(true);
      refreshPage(false);
      toast("Запись удалена");
      return;
    }
    if (a === "delete-note") {
      if (!confirm("Удалить заметку?")) return;
      const old = data.notes;
      data.notes = old.filter((x) => x.id !== id);
      if (!save()) {
        data.notes = old;
        return;
      }
      render();
      return;
    }
    if (a === "delete-project-note") {
      if (!confirm("Удалить заметку проекта?")) return;
      const p = data.projects.find((x) => x.id === el.dataset.parent);
      if (!p) return;
      const old = p.notes;
      p.notes = old.filter((x) => x.id !== id);
      if (!save()) {
        p.notes = old;
        return;
      }
      render();
      return;
    }
    if (a === "game-tab") {
      view.game = el.dataset.game;
      refreshPage();
      return;
    }
    if (a === "reset-game") {
      const progress = view.game === "block" ? view.block?.moves : view.game === "merge" ? view.merge?.moves : view.memory?.moves;
      const finished = view.game === "block" ? view.block?.over : view.game === "merge" ? view.merge?.over : view.memory?.matched?.length === 16;
      if (progress && !finished && !confirm("Начать новую игру? Текущая партия будет потеряна.")) return;
      if (view.game === "block") view.block = newBlock();
      else if (view.game === "merge") view.merge = newMerge();
      else view.memory = newMemory();
      persistGames();
      render();
      return;
    }
    if (a === "continue-merge") {
      if (view.merge?.won && !view.merge.over) {
        view.merge.keepPlaying = true;
        persistGames();
        render();
      }
      return;
    }
    if (a === "select-piece") {
      if (Date.now() < rt.suppressPieceClickUntil) return;
      view.block.selected = Number(el.dataset.index);
      persistGames();
      render();
      return;
    }
    if (a === "block-cell") {
      if (Date.now() < rt.suppressCellClickUntil) return;
      placeBlock(Number(el.dataset.row), Number(el.dataset.col));
      return;
    }
    if (a === "merge-move") {
      moveMerge(el.dataset.dir);
      return;
    }
    if (a === "memory-cell") {
      flipMemory(Number(el.dataset.index));
      return;
    }
    if (a === "export") {
      exportData();
      return;
    }
    if (a === "export-calendar") {
      exportCalendar(id);
      return;
    }
    if (a === "import") {
      $("#import-file").click();
      return;
    }
    if (a === "reset") {
      if (!confirm(
        "Удалить все задачи, планы, проекты, предметы, материалы, заметки и прогресс на этом устройстве?"
      ))
        return;
      const old = data;
      setData(defaults());
      if (!save()) {
        setData(old);
        return;
      }
      for (const p of old.seminarPreps || [])
        for (const f of p.attachments || []) await deletePrepFile(f.id).catch(() => {
        });
      view.page = "home";
      view.id = null;
      view.prepId = null;
      view.date = today();
      view.routineMode = "day";
      render();
      toast("Данные сброшены");
    }
  }
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (target)
      onAction(target).catch((err) => {
        console.error(err);
        toast("Не удалось выполнить действие");
      });
  });
  document.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    submitForm(form).catch((err) => {
      console.error(err);
      toast("Не удалось сохранить");
    });
  });
  document.addEventListener("change", async (event) => {
    const target = event.target;
    if (target.matches?.("[data-prep-answer]")) {
      rt.pendingPrepAnswer = {
        id: target.dataset.prep,
        key: target.dataset.prepAnswer,
        value: target.value.slice(0, 3e3)
      };
      flushPrepAnswer();
      return;
    }
    if (target.id === "event-repeat") {
      const once = target.value === "once", form = target.closest("form"), date = form?.querySelector('[name="date"]');
      form.querySelector("#event-once").hidden = !once;
      form.querySelector("#event-weekly").hidden = once;
      if (date) {
        date.disabled = !once;
        date.required = once;
      }
    } else if (target.name === "mode" && target.closest('form[data-form="subject"]')) {
      target.closest("form").querySelector(".first-type-row").hidden = target.value !== "alternate";
    } else if (target.id === "setting-motion") {
      data.reduceMotion = target.checked;
      save();
      refreshPage(false);
    } else if (target.id === "setting-lead") {
      data.lead = Number(target.value);
      save();
    } else if (target.id === "setting-weekly-goal") {
      const goal = Number(target.value);
      if ([3, 5, 7, 10, 15].includes(goal)) {
        data.weeklyGoal = goal;
        save();
        toast("Недельная цель обновлена");
      }
    } else if (target.id === "setting-reminders") {
      data.reminders = target.checked;
      save();
      const lead = $("#setting-lead");
      if (lead) lead.disabled = !data.reminders;
      if (data.reminders && "Notification" in window && window.isSecureContext && Notification.permission === "default")
        await Notification.requestPermission();
      toast(data.reminders ? "Напоминания включены" : "Напоминания выключены");
      checkReminders();
    } else if (target.id === "import-file" && target.files?.[0]) {
      await importData(target.files[0]);
      target.value = "";
    }
  });
  document.addEventListener("input", (event) => {
    if (event.target.matches?.(".chat-composer textarea")) {
      const field = event.target;
      field.style.height = "auto";
      field.style.height = `${field.scrollHeight}px`;
    }
    if (event.target.matches?.("[data-prep-answer]")) {
      const target = event.target;
      if (rt.pendingPrepAnswer && (rt.pendingPrepAnswer.id !== target.dataset.prep || rt.pendingPrepAnswer.key !== target.dataset.prepAnswer))
        flushPrepAnswer();
      rt.pendingPrepAnswer = {
        id: target.dataset.prep,
        key: target.dataset.prepAnswer,
        value: target.value.slice(0, 3e3)
      };
      clearTimeout(rt.prepAnswerTimer);
      rt.prepAnswerTimer = setTimeout(flushPrepAnswer, 450);
      const label = $(`#page [data-prep-save="${target.dataset.prepAnswer}"]`);
      if (label) label.textContent = "Сохраняем…";
      const count = [...$("#page").querySelectorAll("[data-prep-answer]")].filter(
        (field) => field.value.trim()
      ).length;
      const counter = $("#page").querySelector("[data-answer-count]");
      if (counter) counter.textContent = `${count}/${PREP_QUESTIONS.length}`;
    } else if (event.target.id === "global-search") {
      const q = event.target.value.trim(), results = $("#command-results"), actions = $("#command-actions");
      if (results && actions) {
        results.hidden = !q;
        actions.hidden = !!q;
        results.innerHTML = q ? commandResults(q) : "";
      }
    } else if (event.target.id === "subject-search") {
      view.uniQuery = event.target.value;
      const query = view.uniQuery.trim().toLowerCase();
      let matches = 0;
      document.querySelectorAll("[data-subject-card]").forEach((card) => {
        card.hidden = !card.dataset.search.includes(query);
        if (!card.hidden) matches++;
      });
      const empty2 = $("#subject-search-empty");
      if (empty2) empty2.hidden = matches > 0;
    } else if (event.target.id === "work-search") {
      view.workQuery = event.target.value;
      const query = view.workQuery.trim().toLocaleLowerCase("ru-RU");
      let count = 0;
      document.querySelectorAll("[data-project-card]").forEach((card) => {
        const project = data.projects.find((p) => p.id === card.dataset.id);
        card.hidden = !project || !`${project.name} ${project.description || ""}`.toLocaleLowerCase("ru-RU").includes(query);
        if (!card.hidden) count++;
      });
      const empty2 = $("#work-search-empty");
      if (empty2) empty2.hidden = count > 0;
    } else if (event.target.id === "note-search") {
      view.noteQuery = event.target.value;
      const query = view.noteQuery.trim().toLocaleLowerCase("ru-RU");
      let count = 0;
      document.querySelectorAll("[data-note-card]").forEach((card) => {
        const note = data.notes.find((n) => n.id === card.dataset.id);
        card.hidden = !note || !`${note.title || ""} ${note.body || ""} ${note.category || ""}`.toLocaleLowerCase("ru-RU").includes(query);
        if (!card.hidden) count++;
      });
      const empty2 = $("#note-search-empty");
      if (empty2) empty2.hidden = count > 0;
    } else if (event.target.id === "task-search") {
      view.taskQuery = event.target.value;
      const query = view.taskQuery.trim().toLocaleLowerCase("ru-RU");
      let matches = 0;
      document.querySelectorAll("[data-task-card]").forEach((card) => {
        card.hidden = !card.dataset.search.includes(query);
        if (!card.hidden) matches++;
      });
      const empty2 = $("#task-empty");
      if (empty2) {
        empty2.hidden = matches > 0;
        empty2.textContent = query ? "По этому запросу задач нет." : "В этом разделе пока нет задач.";
      }
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && event.target.matches?.(".chat-composer textarea")) {
      event.preventDefault();
      event.target.closest("form")?.requestSubmit();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (!$("#modal").open) commandCenter();
      $("#global-search")?.focus();
      return;
    }
    if (event.key === "Enter" && event.target.matches("article[data-action]")) {
      event.preventDefault();
      onAction(event.target);
    }
    if (view.page === "games" && view.game === "merge" && !$("#modal").open && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      const direction = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[event.key];
      if (direction) {
        event.preventDefault();
        moveMerge(direction);
      }
    }
  });
  $("#modal").addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
  window.addEventListener?.("pagehide", flushPrepAnswer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushPrepAnswer();
  });
  var touchStart = null;
  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.target.closest("#merge-grid"))
        touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    },
    { passive: true }
  );
  document.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart || view.page !== "games" || view.game !== "merge") return;
      const dx = event.changedTouches[0].clientX - touchStart.x, dy = event.changedTouches[0].clientY - touchStart.y;
      touchStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
      moveMerge(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
    },
    { passive: true }
  );
  document.addEventListener("pointerover", (event) => {
    const cell = event.target.closest?.(".block-cell");
    if (cell) previewBlock(cell);
  });
  document.addEventListener("pointerdown", (event) => {
    const piece = event.target.closest?.(".piece[data-index]");
    if (!piece || view.page !== "games" || view.game !== "block" || piece.disabled) return;
    view.block.selected = Number(piece.dataset.index);
    view.dragging = { index: view.block.selected, startX: event.clientX, startY: event.clientY };
    document.querySelectorAll(".piece").forEach((p) => p.classList.toggle("active", p === piece));
  });
  document.addEventListener("pointermove", (event) => {
    if (!view.dragging) return;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".block-cell");
    if (cell) previewBlock(cell);
    else clearBlockPreview();
  });
  document.addEventListener("pointerup", (event) => {
    if (!view.dragging) return;
    const drag = view.dragging;
    view.dragging = null;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".block-cell");
    if (cell) {
      rt.suppressCellClickUntil = Date.now() + 250;
      rt.suppressPieceClickUntil = Date.now() + 250;
      clearBlockPreview();
      placeBlock(Number(cell.dataset.row), Number(cell.dataset.col));
    } else if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 12) {
      rt.suppressPieceClickUntil = Date.now() + 250;
      persistGames();
      render();
    }
  });
  document.addEventListener("pointercancel", () => {
    view.dragging = null;
    clearBlockPreview();
  });
  $("#modal").addEventListener("click", (event) => {
    if (event.target === $("#modal")) closeModal();
  });
  window.addEventListener("hashchange", () => {
    const page = pageFromLocation();
    if (page && page !== view.page) go(page);
  });
  onSaved.push(() => syncSnapshot());
  syncSnapshot({ immediate: true });
  pullChanges().then((count) => {
    if (count) refreshPage(false);
  });
  setInterval(() => {
    pullChanges().then((count) => {
      if (count) refreshPage(false);
    });
  }, 3e5);
  var deepLink = pageFromLocation();
  if (deepLink) view.page = deepLink;
  rememberLocation();
  render();
  checkReminders();
  setInterval(checkReminders, 3e4);
  if ("serviceWorker" in navigator && window.isSecureContext)
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {
    });
})();
//# sourceMappingURL=app.js.map
