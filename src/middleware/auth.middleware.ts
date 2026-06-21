import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateSession } from '../security/session.store';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  const deviceId = request.headers['x-device-id'] as string;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing authorization header' });
    return;
  }

  if (!deviceId) {
    reply.code(401).send({ error: 'Missing X-Device-Id header' });
    return;
  }

  const token = authHeader.slice(7);
  const session = validateSession(token, deviceId);

  if (!session) {
    reply.code(401).send({ error: 'Invalid or expired session' });
    return;
  }

  (request as any).sessionId = session.id;
  (request as any).deviceId = session.deviceId;
}
