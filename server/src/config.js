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
  railwayToken: process.env.RAILWAY_TOKEN || ''
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
