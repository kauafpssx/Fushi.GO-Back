import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateSession } from '../security/session.store';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  const deviceId = request.headers['x-device-id'] as string;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing authorization header' });
  }

  if (!deviceId) {
    return reply.code(401).send({ error: 'Missing X-Device-Id header' });
  }

  const token = authHeader.slice(7);
  const session = validateSession(token, deviceId);

  if (!session) {
    return reply.code(401).send({ error: 'Invalid or expired session' });
  }

  (request as any).sessionId = session.id;
  (request as any).deviceId = session.deviceId;
}
