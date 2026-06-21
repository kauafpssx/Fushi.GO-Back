import type { FastifyInstance } from 'fastify';
import { subscribe, unsubscribe, getByStopId } from './notification.service';

export async function notificationsRoutes(app: FastifyInstance) {
  app.post('/notifications/subscribe', async (request, reply) => {
    const body = request.body as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      stopId: string;
      serviceId?: string;
      notifyOnApproach?: boolean;
      notifyScheduled?: boolean;
    };

    const result = await subscribe(body);
    return result;
  });

  app.delete('/notifications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await unsubscribe(id);
    return { ok: true };
  });

  app.get('/notifications/stop/:stopId', async (request, reply) => {
    const { stopId } = request.params as { stopId: string };
    const prefs = await getByStopId(stopId);
    return prefs.map((p) => ({
      id: p.id,
      stopId: p.stopId,
      serviceId: p.serviceId,
      notifyOnApproach: p.notifyOnApproach,
      notifyScheduled: p.notifyScheduled,
      createdAt: p.createdAt,
    }));
  });

  app.get('/vapid-public-key', async () => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY };
  });
}
