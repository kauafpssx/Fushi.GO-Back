import type { FastifyInstance } from 'fastify';
import { getVehicles } from './vehicles.service';

export async function vehiclesRoutes(app: FastifyInstance) {
  app.get('/vehicles/service/:serviceId', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    return getVehicles(serviceId);
  });
}
