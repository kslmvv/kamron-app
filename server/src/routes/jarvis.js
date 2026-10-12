/** Диалог Jarvis: модель отвечает, зная снимок дня из приложения. */
import { Router } from 'express';
import { complete } from '../llm.js';

export const jarvis = Router();

const SYSTEM = `Ты — Jarvis, помощник в личном приложении Камрона. Отвечай по-русски, коротко и по делу.
Ты видишь снимок данных приложения: режим дня, задачи, проекты, предметы и заметки.
Правила:
- Отвечай только по тем данным, которые пришли в снимке. Если сведений нет, скажи об этом прямо.
- Никогда не утверждай, что задача выполнена, если в снимке нет отметки о выполнении.
- Ты не меняешь данные сам. Если нужно что-то изменить, назови конкретное действие в приложении.
- Без лишних вступлений и извинений. Сначала ответ, потом при необходимости пояснение.`;

/** Снимок приводится к компактному тексту: лишние поля только мешают модели. */
function describe(snapshot = {}) {
  const lines = [];
  const date = snapshot.today || new Date().toISOString().slice(0, 10);
  lines.push(`Сегодня: ${date}`);
  if (snapshot.name) lines.push(`Имя: ${snapshot.name}`);
  if (snapshot.routine?.length) {
    lines.push('\nРежим дня на сегодня:');
    for (const item of snapshot.routine.slice(0, 30))
      lines.push(`- ${item.time} ${item.title}${item.done ? ' — отмечено' : ''}`);
  }
  if (snapshot.tasks?.length) {
    lines.push('\nОткрытые задачи:');
    for (const t of snapshot.tasks.slice(0, 60))
      lines.push(
        `- [${t.kind}] ${t.title}${t.due ? ` (срок ${t.due})` : ''}${t.source ? ` — ${t.source}` : ''}`
      );
  }
  if (snapshot.lessons?.length) {
    lines.push('\nБлижайшие занятия:');
    for (const l of snapshot.lessons.slice(0, 20))
      lines.push(`- ${l.date} ${l.time} ${l.subject} (${l.type})`);
  }
  if (snapshot.projects?.length) {
    lines.push('\nПроекты:');
    for (const p of snapshot.projects.slice(0, 20))
      lines.push(
        `- ${p.name}: открыто ${p.open}, выполнено ${p.done}${p.next ? `, следующий шаг — ${p.next}` : ''}`
      );
  }
  if (snapshot.notes?.length) {
    lines.push('\nПоследние заметки:');
    for (const n of snapshot.notes.slice(0, 10)) lines.push(`- ${n.title || 'без заголовка'}: ${n.body}`);
  }
  return lines.join('\n');
}

jarvis.post('/chat', async (req, res, next) => {
  try {
    const { messages, snapshot } = req.body || {};
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ error: 'Нужен список сообщений' });

    const history = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      // Вся история уходит в каждый запрос и оплачивается заново,
      // поэтому держим её короткой: последние пары реплик решают дело.
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (!history.length) return res.status(400).json({ error: 'Пустой запрос' });

    const context = describe(snapshot);
    const first = history[0];
    history[0] = { ...first, content: `Снимок приложения:\n${context}\n\nВопрос: ${first.content}` };

    const result = await complete({ system: SYSTEM, messages: history, maxTokens: 1000 });
    res.json({ reply: result.text, model: result.model });
  } catch (err) {
    next(err);
  }
});
