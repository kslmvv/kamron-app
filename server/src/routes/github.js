/** Последний коммит репозитория. С токеном работают и закрытые репозитории. */
import { Router } from 'express';
import { config } from '../config.js';

export const github = Router();

/** Из ссылки вида https://github.com/owner/repo(/...) достаём владельца и имя. */
export function parseRepo(url) {
  const match = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i.exec(String(url || ''));
  return match ? { owner: match[1], repo: match[2] } : null;
}

github.get('/commit', async (req, res, next) => {
  try {
    const target = parseRepo(req.query.url);
    if (!target) return res.status(400).json({ error: 'Нужна ссылка вида https://github.com/владелец/репозиторий' });

    const headers = { accept: 'application/vnd.github+json', 'user-agent': 'kamron-app' };
    if (config.githubToken) headers.authorization = `Bearer ${config.githubToken}`;

    const url = `https://api.github.com/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}/commits?per_page=1`;
    const response = await fetch(url, { headers });
    if (response.status === 404)
      return res.status(404).json({
        error: config.githubToken
          ? 'Репозиторий не найден или токен не даёт к нему доступа'
          : 'Репозиторий не найден. Для закрытого репозитория задайте GITHUB_TOKEN'
      });
    if (!response.ok) return res.status(502).json({ error: `GitHub ответил ошибкой ${response.status}` });

    const [commit] = await response.json();
    if (!commit) return res.json({ empty: true });
    res.json({
      sha: commit.sha.slice(0, 7),
      message: (commit.commit?.message || '').split('\n')[0],
      author: commit.commit?.author?.name || '',
      date: commit.commit?.author?.date || '',
      url: commit.html_url,
      private: !!config.githubToken
    });
  } catch (err) {
    next(err);
  }
});
