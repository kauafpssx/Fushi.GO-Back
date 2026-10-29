import type { FastifyInstance } from 'fastify';
import { getServiceDetails, getRouteServices } from './service.service';

export async function servicesRoutes(app: FastifyInstance) {
  app.get('/services/:serviceId', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    return getServiceDetails(serviceId);
  });

  app.get('/routes/:routeId/services', async (request, reply) => {
    const { routeId } = request.params as { routeId: string };
    return getRouteServices(routeId);
  });
}
