import type { FastifyRequest, FastifyReply } from 'fastify';
import { type ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      (request as any).validated = schema.parse({
        body: request.body,
        query: request.query,
        params: request.params,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        reply.code(400).send({
          error: 'Validation error',
          details: err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      throw err;
    }
  };
}
