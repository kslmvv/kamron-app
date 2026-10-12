/** Мелкие помощники: выборка узлов, даты, форматирование, экранирование, скачивание файла. */
export const $ = selector => document.querySelector(selector);

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export const pad = n => String(n).padStart(2, '0');

export const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = key => new Date(`${key}T12:00:00`);

export const dayNumber = key => {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

export const addDays = (key, n) => {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

export const today = () => dateKey(new Date());

export const fmt = (key, opts = { day: 'numeric', month: 'long' }) =>
  fromKey(key).toLocaleDateString('ru-RU', opts);

export const plural = (n, one, few, many) => {
  const v = Math.abs(Number(n)) % 100,
    last = v % 10;
  return v >= 11 && v <= 14 ? many : last === 1 ? one : last >= 2 && last <= 4 ? few : many;
};

export const esc = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

export const safeId = value => esc(value);

export function downloadText(content, name) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' }),
    url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Кириллица в латиницу: Chromium полностью отбрасывает имя файла с не-ASCII символами. */
const TRANSLIT = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: 'o',
  қ: 'q',
  ғ: 'g',
  ҳ: 'h'
};

/**
 * Безопасная часть имени скачиваемого файла.
 *
 * Имя с кириллицей браузер не сохраняет: файл приходит как «download» без
 * расширения. Поэтому буквы переводятся в латиницу, а всё прочее — в дефис.
 */
export function safeDownloadPart(value) {
  return (
    String(value || 'file')
      .toLowerCase()
      .replace(/[а-яёўқғҳ]/g, letter => TRANSLIT[letter] ?? '')
      .normalize('NFKD')
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'file'
  );
}
