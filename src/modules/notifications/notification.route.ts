import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { subscribe, unsubscribe, getByStopId, getByDeviceId } from './notification.service';
import { validate } from '../../middleware/validate.middleware';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const subscribeBodySchema = z.object({
  subscription: subscriptionSchema,
  stopId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  notifyOnApproach: z.boolean().optional(),
  notifyScheduled: z.boolean().optional(),
});

export async function notificationsRoutes(app: FastifyInstance) {
  app.post(
    '/notifications/subscribe',
    { preHandler: validate(subscribeBodySchema) },
    async (request, reply) => {
      const body = request.body as z.infer<typeof subscribeBodySchema>;
      const deviceId = (request as any).deviceId as string;

      const result = await subscribe({
        ...body,
        deviceId,
      });
      return result;
    }
  );

  app.delete('/notifications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deviceId = (request as any).deviceId as string;
    await unsubscribe(id, deviceId);
    return { ok: true };
  });

  app.get('/notifications/stop/:stopId', async (request, reply) => {
    const { stopId } = request.params as { stopId: string };
    const prefs = await getByStopId(stopId);
    return prefs.map((p) => ({
      id: p.id,
      stopId: p.stopId,
      serviceId: p.serviceId,
      deviceId: p.deviceId,
      notifyOnApproach: p.notifyOnApproach,
      notifyScheduled: p.notifyScheduled,
      createdAt: p.createdAt,
    }));
  });

  app.get('/notifications', async (request, reply) => {
    const deviceId = (request as any).deviceId as string;
    const prefs = await getByDeviceId(deviceId);
    return prefs.map((p) => ({
      id: p.id,
      stopId: p.stopId,
      serviceId: p.serviceId,
      deviceId: p.deviceId,
      notifyOnApproach: p.notifyOnApproach,
      notifyScheduled: p.notifyScheduled,
      createdAt: p.createdAt,
    }));
  });

  app.get('/vapid-public-key', async () => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY };
  });
}
