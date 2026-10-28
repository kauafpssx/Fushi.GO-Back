import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { randomUUID } from 'crypto';
import { env } from './env';
import { authRoutes } from '../modules/auth/auth.route';
import { searchRoutes } from '../modules/search/search.route';
import { vehiclesRoutes } from '../modules/vehicles/vehicles.route';
import { vehiclesSSERoutes } from '../modules/vehicles/vehicles.route.sse';
import { predictionsRoutes } from '../modules/predictions/predictions.route';
import { predictionsSSERoutes } from '../modules/predictions/predictions.route.sse';
import { servicesRoutes } from '../modules/services/service.route';
import { stopsRoutes } from '../modules/services/stops.route';
import { notificationsRoutes } from '../modules/notifications/notification.route';
import { authMiddleware } from '../middleware/auth.middleware';
import { securityHeaders } from '../middleware/security-headers';
import { cacheControl, etagHandler } from '../middleware/cache.middleware';
import { metrics } from '../shared/metrics';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'warn',
    },
    genReqId: () => randomUUID().slice(0, 8),
  });

  await app.register(cors, {
    origin: env.corsOrigin,
    credentials: true,
    allowedHeaders: ['Accept', 'X-Device-Id', 'Origin', 'X-Requested-With', 'Accept-Encoding', 'Accept-Language', 'Host', 'Referer', 'User-Agent', 'Version'],
    methods: ['GET', 'OPTIONS'],
  });
  await app.register(compress, { threshold: 1024, removeContentLengthHeader: true });
  await app.register(cookie);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'FushiGO API',
        description: 'Proxy para Cittamobi com SSE para tracking de ônibus em tempo real',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${env.port}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
          },
          deviceId: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Device-Id',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.addHook('onSend', securityHeaders);

  app.addHook('onRequest', async (request) => {
    metrics.totalRequests++;
  });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.code(error.statusCode || 500).send({
      error: error.message || 'Internal Server Error',
      requestId: request.id,
    });
  });

  app.get('/health', async () => {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    return {
      status: 'ok',
      uptime: `${days}d ${hours}h ${minutes}m`,
      uptimeSeconds: Math.round(uptime),
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heap: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      metrics: {
        totalRequests: metrics.totalRequests,
        cittamobiRequests: metrics.cittamobiRequests,
        activePollers: metrics.activePollers,
        activeSSEConnections: metrics.activeSSEConnections,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
      },
    };
  });

  await app.register(authRoutes);

  await app.register(async (v1) => {
    v1.addHook('onRequest', authMiddleware);

    v1.addHook('onSend', cacheControl(60));
    v1.addHook('onSend', etagHandler());

    await v1.register(searchRoutes, { prefix: '/v1' });
    await v1.register(vehiclesRoutes, { prefix: '/v1' });
    await v1.register(predictionsRoutes, { prefix: '/v1' });
    await v1.register(servicesRoutes, { prefix: '/v1' });
    await v1.register(stopsRoutes, { prefix: '/v1' });
    await v1.register(notificationsRoutes, { prefix: '/v1' });
  });

  await app.register(vehiclesSSERoutes);
  await app.register(predictionsSSERoutes);

  return app;
}
