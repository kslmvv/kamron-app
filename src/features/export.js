/** Экспорт и импорт данных, Markdown-брифы и выгрузка расписания в .ics. */
import { APP_BUILD, PREP_QUESTIONS } from '../core/constants.js';
import { subjectMeeting } from '../core/selectors.js';
import { data, normalizeData, save, setData, view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { $, addDays, downloadText, fromKey, pad, safeDownloadPart, today } from '../core/utils.js';
import { deletePrepFile, getPrepFile } from './files.js';
import { calendar } from '../ui/components.js';
import { render } from '../ui/shell.js';
import { techDiagnostics } from '../views/tech.js';

export function validGithubUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'github.com' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      parts.length !== 2 ||
      !parts.every(x => /^[\w.-]+$/.test(x))
    )
      return null;
    const repo = parts[1].replace(/\.git$/, '');
    if (!repo || repo === '.' || repo === '..') return null;
    return `https://github.com/${parts[0]}/${repo}`;
  } catch (_) {
    return null;
  }
}

export function validRailwayUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      ['railway.com', 'railway.app'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
      ? url.href
      : null;
  } catch (_) {
    return null;
  }
}

export async function downloadPrep(prep) {
  const s = data.subjects.find(x => x.id === prep.subjectId);
  if (!s) return;
  const lines = [
    `# Jarvis · подготовка к занятию: ${prep.topic}`,
    `Предмет: ${s.name}`,
    `Контекст: ${prep.context || 'Не указан'}`,
    '',
    '## Материалы',
    ...(prep.attachments || []).map(
      f => `- ${f.name} (${Math.round(f.size / 1024)} КБ) — приложить оригинал к запросу`
    ),
    '',
    '## Мои ответы',
    ...PREP_QUESTIONS.flatMap((q, i) => [
      `${i + 1}. ${q}`,
      String(prep.answers?.[i] || 'Пока без ответа'),
      ''
    ]),
    '## Задание для Jarvis',
    'Изучи приложенные файлы и тему. Составь понятный план семинара, выдели главные идеи и возможные вопросы преподавателя. Задавай мне вопросы по одному, оценивай мои ответы по фактам из материалов, мягко исправляй ошибки и повторяй слабые темы. Не выдумывай содержание файлов, которые не получил.'
  ];
  for (const meta of prep.attachments || []) {
    if (!/\.(txt|md)$/i.test(meta.name) && meta.type !== 'text/plain') continue;
    const file = await getPrepFile(meta.id).catch(() => null);
    if (file && file.size <= 300000) {
      lines.push('', `## Текст файла: ${meta.name}`, String(await file.text()).slice(0, 120000));
    }
  }
  downloadText(lines.join('\n'), `seminar-${safeDownloadPart(prep.topic)}.md`);
  toast('Пакет подготовки скачан');
}

export function projectAiBrief(project, request) {
  const ai = project.ai || {};
  return [
    `# Jarvis · ${project.name}`,
    `Поручение: ${request.title}`,
    `Создано: ${request.createdAt}`,
    '',
    '## Что нужно сделать',
    request.description,
    '',
    '## Цель проекта',
    ai.goal || 'Не указана',
    '',
    '## Документация',
    project.description || 'Не добавлена',
    '',
    '## Активные задачи',
    ...(project.tasks || [])
      .filter(t => !t.doneAt)
      .map(t => `- ${t.title}${t.due ? ` · срок ${t.due}` : ''}`),
    '',
    '## Последние заметки',
    ...(project.notes || []).slice(-8).map(n => `- ${n.text}`),
    '',
    '## Подключённые ссылки',
    `GitHub: ${ai.githubUrl || 'не указан'}`,
    `Railway: ${ai.railwayUrl || 'не указан'}`,
    ai.githubSnapshot
      ? `Последний публичный коммит: ${ai.githubSnapshot.sha.slice(0, 7)} — ${ai.githubSnapshot.message}`
      : '',
    '',
    'Проверь актуальное состояние проекта самостоятельно. Не изменяй продакшен и не публикуй изменения без просмотра пользователем.'
  ].join('\n');
}

export function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = `kamron-app-${today()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Копия данных скачана');
}

export function techBrief(request) {
  const kind =
    { bug: 'Исправление ошибки', design: 'Изменение дизайна', feature: 'Новая функция' }[request.kind] ||
    'Изменение';
  const checks = techDiagnostics()
    .map(x => `- ${x.ok ? 'OK' : 'Проверить'}: ${x.title} — ${x.detail}`)
    .join('\n');
  return `# Kamron APP — ${kind}\n\nРаздел: ${request.area}\nСоздано: ${request.createdAt}\nВерсия: ${APP_BUILD}\n\n## Что нужно сделать\n\n${request.description}\n\n## Ожидаемый результат\n\n${request.expected || 'Уточнить по описанию выше.'}\n\n## Состояние макета\n\n${checks}\n\n## Файлы\n\n- index.html — оболочка приложения\n- styles.css — интерфейс\n- app.js — логика\n- README.md — описание поведения\n\nПроверьте изменение в смартфонном размере и не отмечайте пользовательские задачи выполненными автоматически. Для правки кода работайте с исходниками проекта; публикацию выполняйте отдельно после проверки.\n`;
}

export function downloadTechRequest(request) {
  const blob = new Blob([techBrief(request)], { type: 'text/markdown;charset=utf-8' }),
    url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = `kamron-izmenenie-${request.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 36)}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Задание для Claude Code скачано');
}

export function calendarText(value) {
  const slash = String.fromCharCode(92);
  return String(value ?? '')
    .replaceAll(slash, slash + slash)
    .replace(/\r\n|\r|\n/g, slash + 'n')
    .replaceAll(';', slash + ';')
    .replaceAll(',', slash + ',');
}

export function calendarStamp(date, utc = false) {
  const year = utc ? date.getUTCFullYear() : date.getFullYear(),
    month = utc ? date.getUTCMonth() + 1 : date.getMonth() + 1,
    day = utc ? date.getUTCDate() : date.getDate();
  const hours = utc ? date.getUTCHours() : date.getHours(),
    minutes = utc ? date.getUTCMinutes() : date.getMinutes(),
    seconds = utc ? date.getUTCSeconds() : date.getSeconds();
  return `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}${pad(seconds)}${utc ? 'Z' : ''}`;
}

export function foldCalendarLine(line) {
  const encoder = new TextEncoder();
  let current = '',
    bytes = 0;
  const parts = [];
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 73) {
      parts.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n');
}

export function exportCalendar(subjectId) {
  const subjects = subjectId ? data.subjects.filter(s => s.id === subjectId) : data.subjects;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kamron APP//University Schedule//RU',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Kamron APP'
  ];
  const stamp = calendarStamp(new Date(), true);
  let count = 0;
  for (let n = 0; n < 90; n++) {
    const key = addDays(today(), n);
    for (const subject of subjects) {
      const meeting = subjectMeeting(subject, key);
      if (!meeting) continue;
      const [hour, minute] = String(subject.time || '10:00')
          .split(':')
          .map(Number),
        start = fromKey(key);
      start.setHours(hour || 0, minute || 0, 0, 0);
      const end = new Date(start.getTime() + (Number(subject.duration) || 90) * 60000);
      const id = String(subject.id).replace(/[^a-zA-Z0-9_-]/g, '');
      lines.push(
        'BEGIN:VEVENT',
        'UID:' + id + '-' + key + '@kamron-app.local',
        'DTSTAMP:' + stamp,
        'DTSTART:' + calendarStamp(start),
        'DTEND:' + calendarStamp(end),
        'SUMMARY:' + calendarText(subject.name + ' · ' + meeting.type)
      );
      if (subject.room) lines.push('LOCATION:' + calendarText(subject.room));
      if (subject.teacher) lines.push('DESCRIPTION:' + calendarText('Преподаватель: ' + subject.teacher));
      lines.push('END:VEVENT');
      count++;
    }
  }
  if (!count) {
    toast('В ближайшие 90 дней занятий нет');
    return;
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.map(foldCalendarLine).join('\r\n') + '\r\n'], {
      type: 'text/calendar;charset=utf-8'
    }),
    url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = subjectId ? 'kamron-predmet.ics' : 'kamron-univer.ics';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Скачано ${count} пар для календаря`);
}

export async function importData(file) {
  try {
    const imported = JSON.parse(await file.text());
    if (
      imported.version !== 1 ||
      !Array.isArray(imported.projects) ||
      !Array.isArray(imported.subjects) ||
      !Array.isArray(imported.routine) ||
      !Array.isArray(imported.notes)
    )
      throw Error('format');
    if (!confirm('Заменить текущие данные данными из файла?')) return;
    const old = data,
      next = normalizeData(imported),
      nextFileIds = new Set(next.seminarPreps.flatMap(p => p.attachments.map(f => f.id)));
    setData(next);
    if (!save()) {
      setData(old);
      return;
    }
    for (const p of old.seminarPreps || [])
      for (const f of p.attachments || [])
        if (!nextFileIds.has(f.id)) await deletePrepFile(f.id).catch(() => {});
    view.block = null;
    view.merge = null;
    view.memory = null;
    view.prepId = null;
    view.page = 'home';
    view.id = null;
    render();
    toast('Данные импортированы');
  } catch (_) {
    toast('Не удалось прочитать файл Kamron APP');
  }
}
