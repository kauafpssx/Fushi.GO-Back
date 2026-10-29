import type { FastifyReply } from 'fastify';

export async function securityHeaders(request: any, reply: FastifyReply): Promise<void> {
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'no-referrer');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  reply.header('X-DNS-Prefetch-Control', 'off');
}
