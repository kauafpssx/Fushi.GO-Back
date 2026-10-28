import type { FastifyInstance } from 'fastify';
import { subscribePredictions } from './predictions.sse';
import { validateSSEToken } from '../../security/sse-token';
import { env } from '../../app/env';

export async function predictionsSSERoutes(app: FastifyInstance) {
  app.get('/live/predictions/:stopId', async (request, reply) => {
    const { stopId } = request.params as { stopId: string };
    const sseToken = (request.query as any).sseToken as string;
    const deviceId = request.headers['x-device-id'] as string;

    if (!sseToken || !deviceId || !validateSSEToken(sseToken, deviceId)) {
      reply.code(401).send({ error: 'Invalid SSE token' });
      return;
    }

    const corsOrigin = Array.isArray(env.corsOrigin) ? env.corsOrigin[0] : env.corsOrigin;

    reply.hijack();
    const socket = reply.raw;
    socket.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Accept, X-Device-Id',
      'X-Content-Type-Options': 'nosniff',
    });
    socket.flushHeaders();

    subscribePredictions(stopId, reply, socket);
  });
}
