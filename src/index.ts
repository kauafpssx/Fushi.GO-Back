import 'dotenv/config';
import { buildServer } from './app/server';
import { env } from './app/env';

const server = await buildServer();

await server.listen({ port: env.port, host: env.host });

const shutdown = async (signal: string) => {
  server.log.info(`${signal} received, shutting down...`);
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  server.log.error(err, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  server.log.error(err as Error, 'Unhandled rejection');
});
