import type { FastifyInstance } from 'fastify';
import { createSession, refreshSession, revokeSession } from '../../security/session.store';
import { setRefreshCookie, clearRefreshCookie, getRefreshTokenFromRequest } from '../../security/cookies';
import { createSSEToken } from '../../security/sse-token';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (request, reply) => {
    const { deviceId } = request.body as { deviceId: string };
    const userAgent = request.headers['user-agent'] || '';

    const { accessToken, refreshToken, sessionId } = createSession(deviceId, userAgent);

    setRefreshCookie(reply, refreshToken);

    return { accessToken, sessionId };
  });

  app.post('/api/auth/refresh', async (request, reply) => {
    const deviceId = request.headers['x-device-id'] as string;
    const userAgent = request.headers['user-agent'] || '';
    const oldRefreshToken = getRefreshTokenFromRequest(request);

    if (!deviceId || !oldRefreshToken) {
      reply.code(401).send({ error: 'Missing credentials' });
      return;
    }

    const result = refreshSession(oldRefreshToken, deviceId, userAgent);

    if (!result) {
      clearRefreshCookie(reply);
      reply.code(401).send({ error: 'Invalid refresh token' });
      return;
    }

    setRefreshCookie(reply, result.refreshToken);

    return { accessToken: result.accessToken };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const sessionId = (request as any).sessionId;

    if (sessionId) {
      revokeSession(sessionId);
    }

    clearRefreshCookie(reply);

    return { ok: true };
  });

  app.post('/api/sse/token', async (request, reply) => {
    const deviceId = request.headers['x-device-id'] as string;

    if (!deviceId) {
      reply.code(401).send({ error: 'Missing X-Device-Id' });
      return;
    }

    const token = createSSEToken(deviceId);

    return { token };
  });
}
