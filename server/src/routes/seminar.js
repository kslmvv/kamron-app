/** Подготовка к семинару: вопросы по теме и разбор ответов с материалами. */
import { Router } from 'express';
import { complete, attachmentBlock } from '../llm.js';

export const seminar = Router();

const LIMIT = 12 * 1024 * 1024; // суммарный объём вложений в одном запросе

/** Собирает одно сообщение: текст задания плюс приложенные материалы. */
function buildContent(text, attachments = []) {
  const blocks = [{ type: 'text', text }];
  let total = 0;
  for (const file of attachments.slice(0, 6)) {
    const size = (file.data || '').length;
    if (total + size > LIMIT) break;
    const block = attachmentBlock(file);
    if (!block) continue;
    total += size;
    blocks.push(block);
  }
  return blocks;
}

seminar.post('/questions', async (req, res, next) => {
  try {
    const { subject, topic, context, attachments } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'Нужна тема занятия' });
    const text = `Предмет: ${subject || 'не указан'}
Тема занятия: ${topic}
Материалы и контекст от студента: ${context || 'не предоставлен'}

Составь 5 вопросов для самопроверки по этой теме: от простого к сложному, последний — на применение.
Формат ответа: нумерованный список, по одному вопросу в строке, без пояснений.`;
    const result = await complete({
      messages: [{ role: 'user', content: buildContent(text, attachments) }],
      maxTokens: 700
    });
    const questions = result.text
      .split('\n')
      .map(l => l.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 5);
    res.json({ questions, model: result.model });
  } catch (err) {
    next(err);
  }
});

seminar.post('/review', async (req, res, next) => {
  try {
    const { subject, topic, answers, attachments } = req.body || {};
    if (!Array.isArray(answers) || !answers.length)
      return res.status(400).json({ error: 'Нужны ответы для разбора' });
    const body = answers
      .slice(0, 10)
      .map((a, i) => `${i + 1}. Вопрос: ${a.question}\n   Ответ студента: ${a.answer || '(пусто)'}`)
      .join('\n');
    const text = `Предмет: ${subject || 'не указан'}
Тема: ${topic || 'не указана'}

${body}

Разбери ответы. По каждому: что верно, чего не хватает, и одна конкретная поправка.
В конце — раздел «К занятию» с тремя пунктами, что повторить. Будь прямым, без похвалы ради похвалы.
Если ответ пустой, так и напиши и дай короткий правильный ответ.`;
    const result = await complete({
      messages: [{ role: 'user', content: buildContent(text, attachments) }],
      maxTokens: 1600
    });
    res.json({ review: result.text, model: result.model });
  } catch (err) {
    next(err);
  }
});
