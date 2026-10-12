/** Состояние сервисов Railway: последний деплой и его статус. */
import { Router } from 'express';
import { config } from '../config.js';

export const railway = Router();

const QUERY = `query($id: String!) {
  project(id: $id) {
    name
    services { edges { node { id name
      deployments(first: 1) { edges { node { id status createdAt staticUrl } } }
    } } }
  }
}`;

railway.get('/project', async (req, res, next) => {
  try {
    if (!config.railwayToken) return res.status(503).json({ error: 'RAILWAY_TOKEN не задан' });
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Нужен идентификатор проекта Railway' });

    const response = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.railwayToken}` },
      body: JSON.stringify({ query: QUERY, variables: { id } })
    });
    const data = await response.json();
    if (data.errors?.length) return res.status(502).json({ error: data.errors[0].message });

    const services = (data.data?.project?.services?.edges || []).map(({ node }) => {
      const last = node.deployments?.edges?.[0]?.node;
      return {
        name: node.name,
        status: last?.status || 'нет деплоев',
        updatedAt: last?.createdAt || '',
        url: last?.staticUrl ? `https://${last.staticUrl}` : ''
      };
    });
    res.json({ project: data.data?.project?.name || '', services });
  } catch (err) {
    next(err);
  }
});
