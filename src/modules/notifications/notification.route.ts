import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../app/env';
import { subscribe, unsubscribe, getByStopId, getDeviceSubscriptions } from './notification.service';
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

const stopIdParamsSchema = z.object({
  stopId: z.string().uuid(),
});

const subIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function notificationsRoutes(app: FastifyInstance) {
  app.get('/vapid-public-key', async () => {
    return { publicKey: env.vapidPublicKey };
  });

  app.post(
    '/notifications/subscribe',
    { preHandler: validate(subscribeBodySchema) },
    async (request, reply) => {
      const body = request.body as z.infer<typeof subscribeBodySchema>;
      const deviceId = (request as any).deviceId as string;

      const result = await subscribe({
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        stopId: body.stopId,
        serviceId: body.serviceId,
        deviceId,
        notifyOnApproach: body.notifyOnApproach,
        notifyScheduled: body.notifyScheduled,
      });
      return result;
    }
  );

  app.delete('/notifications/:id', async (request, reply) => {
    const { id } = subIdParamsSchema.parse(request.params);
    const deviceId = (request as any).deviceId as string;

    const result = await unsubscribe(id, deviceId);
    return result;
  });

  app.get('/notifications', async (request, reply) => {
    const deviceId = (request as any).deviceId as string;
    const subs = await getDeviceSubscriptions(deviceId);
    return subs.map((p) => ({
      id: p.id,
      stopId: p.stopId,
      serviceId: p.serviceId || undefined,
      deviceId: p.deviceId,
      notifyOnApproach: p.notifyOnApproach,
      notifyScheduled: p.notifyScheduled,
      createdAt: p.createdAt,
    }));
  });

  app.get('/notifications/stop/:stopId', async (request, reply) => {
    const { stopId } = stopIdParamsSchema.parse(request.params);
    const { serviceId } = request.query as { serviceId?: string };
    const subs = await getByStopId(stopId, serviceId);
    return subs.map((p) => ({
      id: p.id,
      stopId: p.stopId,
      serviceId: p.serviceId || undefined,
      deviceId: p.deviceId,
      notifyOnApproach: p.notifyOnApproach,
      notifyScheduled: p.notifyScheduled,
      createdAt: p.createdAt,
      lastNotified: p.lastNotified,
    }));
  });
}
