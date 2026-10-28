import type { FastifyInstance } from 'fastify';
import { subscribeVehicles } from './vehicles.sse';
import { validateSSEToken } from '../../security/sse-token';
import { env } from '../../app/env';

export async function vehiclesSSERoutes(app: FastifyInstance) {
  app.get('/live/vehicles/:serviceId', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    const sseToken = (request.query as any).sseToken as string;
    const deviceId = request.headers['x-device-id'] as string;

    if (!sseToken || !deviceId || !validateSSEToken(sseToken, deviceId)) {
      reply.code(401).send({ error: 'Invalid SSE token' });
      return;
    }

    const allowedOrigins = Array.isArray(env.corsOrigin) ? env.corsOrigin : [env.corsOrigin];
    const requestOrigin = request.headers.origin as string | undefined;
    const acao = requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : '';

    reply.hijack();
    const socket = reply.raw;
    socket.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': acao,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Accept, X-Device-Id',
      'X-Content-Type-Options': 'nosniff',
    });
    socket.flushHeaders();

    subscribeVehicles(serviceId, reply, socket);
  });
}
