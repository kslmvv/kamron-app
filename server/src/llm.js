/**
 * Единая точка вызова модели.
 *
 * Поддержаны две линейки: Anthropic и OpenAI. Приложение о провайдере
 * ничего не знает — оно шлёт сообщения, а выбор делает переменная
 * окружения LLM_PROVIDER.
 */
import { config } from './config.js';

const DEFAULT_MODEL = { anthropic: 'claude-sonnet-5-5', openai: 'gpt-5-mini' };

/** Таймаут: зависший запрос к модели не должен держать соединение с телефоном. */
async function post(url, headers, body, timeoutMs = 60000) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: control.signal
    });
    const text = await response.text();
    if (!response.ok) {
      const error = new Error(`Модель ответила ошибкой ${response.status}`);
      error.status = response.status === 429 ? 429 : 502;
      error.detail = text.slice(0, 600);
      throw error;
    }
    return JSON.parse(text);
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('Модель не ответила за отведённое время');
      error.status = 504;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {{system?: string, messages: Array<{role: 'user'|'assistant', content: any}>, maxTokens?: number}} input
 * @returns {Promise<{text: string, model: string, usage: object}>}
 */
export async function complete({ system, messages, maxTokens = 1200 }) {
  const provider = config.provider;
  const model = config.model || DEFAULT_MODEL[provider];

  if (provider === 'openai') {
    if (!config.openaiKey) throw Object.assign(new Error('OPENAI_API_KEY не задан'), { status: 503 });
    const data = await post(
      'https://api.openai.com/v1/chat/completions',
      { authorization: `Bearer ${config.openaiKey}` },
      {
        model,
        max_completion_tokens: maxTokens,
        messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages]
      }
    );
    return { text: data.choices?.[0]?.message?.content || '', model, usage: data.usage || {} };
  }

  if (!config.anthropicKey) throw Object.assign(new Error('ANTHROPIC_API_KEY не задан'), { status: 503 });
  const data = await post(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
    { model, max_tokens: maxTokens, ...(system ? { system } : {}), messages }
  );
  const text = (data.content || [])
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('\n')
    .trim();
  return { text, model, usage: data.usage || {} };
}

/**
 * Вложение семинара в вид, понятный выбранному провайдеру.
 * Картинки уходят как изображение, PDF — как документ (только Anthropic),
 * остальное приложение присылает уже текстом.
 */
export function attachmentBlock({ mime, data }) {
  const isImage = /^image\/(png|jpe?g|gif|webp)$/.test(mime || '');
  if (config.provider === 'openai') {
    if (!isImage) return null;
    return { type: 'image_url', image_url: { url: `data:${mime};base64,${data}` } };
  }
  if (isImage) return { type: 'image', source: { type: 'base64', media_type: mime, data } };
  if (mime === 'application/pdf')
    return { type: 'document', source: { type: 'base64', media_type: mime, data } };
  return null;
}
