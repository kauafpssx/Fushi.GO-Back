import type { FastifyInstance } from 'fastify';
import { search } from './search.service';
import { startSession } from './session.service';
import { getViewportRecommendation } from './viewport.service';

export async function searchRoutes(app: FastifyInstance) {
  app.get('/session', async (request, reply) => {
    const { lat, lng } = request.query as { lat: string; lng: string };
    return startSession(Number(lat), Number(lng));
  });

  app.get('/search', async (request, reply) => {
    const { q, a, lat, lng } = request.query as {
      q: string;
      a: string;
      lat: string;
      lng: string;
    };
    return search(q, a, Number(lat), Number(lng));
  });

  app.get('/viewport/recommendation', async (request, reply) => {
    const { lat, lng } = request.query as {
      lat: string;
      lng: string;
    };
    return getViewportRecommendation(
      Number(lat),
      Number(lng)
    );
  });
}
