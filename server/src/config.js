/** Настройки сервера. Всё приходит из переменных окружения — ключей в коде нет. */
const list = value =>
  (value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 8080,
  accessToken: process.env.APP_ACCESS_TOKEN || '',
  allowedOrigins: list(process.env.ALLOWED_ORIGINS),
  provider: (process.env.LLM_PROVIDER || 'anthropic').toLowerCase(),
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.LLM_MODEL || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  railwayToken: process.env.RAILWAY_TOKEN || '',
  // Цены за 1 млн токенов — их задаёт провайдер и они меняются,
  // поэтому это переменные окружения, а не константы в коде.
  priceInput: Number(process.env.PRICE_INPUT_PER_M) || 0.25,
  priceOutput: Number(process.env.PRICE_OUTPUT_PER_M) || 2,
  dailyLimit: Number(process.env.DAILY_USD_LIMIT ?? 0.15),
  // У моделей GPT-5 рассуждения по умолчанию «medium» и оплачиваются
  // как выходные токены. Для коротких ответов помощника это лишние деньги.
  reasoningEffort: process.env.OPENAI_REASONING_EFFORT || 'minimal'
};

/** Какие возможности реально настроены — приложение показывает это в интерфейсе. */
export function capabilities() {
  const llm = config.provider === 'openai' ? !!config.openaiKey : !!config.anthropicKey;
  return {
    jarvis: llm,
    seminar: llm,
    github: true,
    githubPrivate: !!config.githubToken,
    railway: !!config.railwayToken,
    provider: config.provider
  };
}
