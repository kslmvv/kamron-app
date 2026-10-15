/**
 * Разбор подготовки к семинару моделью.
 *
 * Отправляет на сервер тему, контекст и ответы студента, а вместе с ними
 * приложенные картинки и PDF. Разбор держится в памяти экрана: это текст
 * об учёбе конкретного дня, в резервной копии он не нужен.
 */
import { PREP_QUESTIONS } from '../core/constants.js';
import { data, view } from '../core/state.js';
import { toast } from '../core/toast.js';
import { render } from '../ui/shell.js';
import { seminarReview, serverConfigured } from './api.js';
import { getPrepFile } from './files.js';

const SENDABLE = /^(image\/(png|jpe?g|gif|webp)|application\/pdf)$/;
const BUDGET = 8 * 1024 * 1024; // столько исходных байт влезает в один запрос

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(blob);
  });
}

/** Берём только то, что модель действительно умеет читать, и не больше бюджета. */
async function collectAttachments(prep) {
  const out = [];
  let total = 0;
  for (const entry of (prep.attachments || []).slice(0, 6)) {
    if (!SENDABLE.test(entry.type || '')) continue;
    if (total + entry.size > BUDGET) continue;
    const blob = await getPrepFile(entry.id).catch(() => null);
    if (!blob) continue;
    total += entry.size;
    out.push({ mime: entry.type, data: await toBase64(blob) });
  }
  return out;
}

export async function reviewPrep(prepId) {
  const prep = data.seminarPreps.find(x => x.id === prepId);
  if (!prep) return;
  if (!serverConfigured()) {
    toast('Сервер Jarvis не подключён');
    return;
  }
  const answers = PREP_QUESTIONS.map((question, i) => ({
    question,
    answer: String(prep.answers?.[i] || '').trim()
  }));
  if (!answers.some(a => a.answer)) {
    toast('Сначала ответьте хотя бы на один вопрос');
    return;
  }
  const subject = data.subjects.find(s => s.id === prep.subjectId);
  view.prepReview = { id: prepId, busy: true, text: '', error: '' };
  render();
  try {
    const result = await seminarReview({
      subject: subject?.name || '',
      topic: prep.topic,
      answers,
      attachments: await collectAttachments(prep)
    });
    view.prepReview = { id: prepId, busy: false, text: result.review || '', error: '' };
  } catch (err) {
    view.prepReview = { id: prepId, busy: false, text: '', error: err.message };
  }
  render();
}
