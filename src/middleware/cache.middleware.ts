import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash } from 'crypto';

export function generateETag(data: any): string {
  const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `"${hash}"`;
}

export function cacheControl(maxAge: number) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.header('Cache-Control', `public, max-age=${maxAge}`);
  };
}

export function etagHandler() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const originalSend = reply.send.bind(reply);

    reply.send = function (data: any) {
      if (data && typeof data === 'object') {
        const etag = generateETag(data);
        reply.header('ETag', etag);

        const ifNoneMatch = request.headers['if-none-match'];
        if (ifNoneMatch === etag) {
          reply.code(304).send('');
          return reply;
        }
      }

      return originalSend(data);
    } as any;
  };
}
