/**
 * Учёт расхода на модель и дневной лимит.
 *
 * Бюджет маленький и пополняется вручную, поэтому одна ошибка — зацикленная
 * вкладка или забытый цикл — не должна съесть его за вечер. Каждый ответ
 * модели приносит фактическое число токенов; по нему считается стоимость,
 * и при превышении лимита запросы отклоняются до следующих суток.
 *
 * Счётчик живёт в памяти процесса: при передеплое он обнуляется. Это
 * ограничитель от случайностей, а не бухгалтерия. Настоящий предел
 * расходов задаётся в личном кабинете провайдера.
 */
import { config } from './config.js';

const state = { day: '', spent: 0, requests: 0, total: 0 };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function roll() {
  const now = today();
  if (state.day !== now) {
    state.day = now;
    state.spent = 0;
    state.requests = 0;
  }
}

/** Стоимость одного ответа по фактическим токенам. */
export function priceOf(usage = {}) {
  const input = usage.prompt_tokens ?? usage.input_tokens ?? 0;
  const output = usage.completion_tokens ?? usage.output_tokens ?? 0;
  return (input / 1e6) * config.priceInput + (output / 1e6) * config.priceOutput;
}

/** Вызывается перед обращением к модели. Бросает ошибку, если лимит исчерпан. */
export function assertWithinBudget() {
  roll();
  if (config.dailyLimit > 0 && state.spent >= config.dailyLimit) {
    throw Object.assign(
      new Error(
        `Дневной лимит расходов на модель исчерпан (${config.dailyLimit.toFixed(2)} $). Запросы снова пойдут завтра.`
      ),
      { status: 429 }
    );
  }
}

/** Вызывается после ответа модели. */
export function recordSpend(usage) {
  roll();
  const cost = priceOf(usage);
  state.spent += cost;
  state.total += cost;
  state.requests += 1;
  return cost;
}

export function spendReport() {
  roll();
  return {
    день: state.day,
    потрачено_сегодня: Number(state.spent.toFixed(4)),
    дневной_лимит: config.dailyLimit,
    запросов_сегодня: state.requests,
    потрачено_с_запуска: Number(state.total.toFixed(4))
  };
}
