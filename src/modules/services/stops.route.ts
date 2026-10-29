import type { FastifyInstance } from 'fastify';
import { getStopsViewport, getStopsService } from './stops.service';

export async function stopsRoutes(app: FastifyInstance) {
  app.get('/stops/viewport', async (request, reply) => {
    const { nelat, nelng, swlat, swlng } = request.query as {
      nelat: string;
      nelng: string;
      swlat: string;
      swlng: string;
    };

    return getStopsViewport(
      Number(nelat),
      Number(nelng),
      Number(swlat),
      Number(swlng)
    );
  });

  app.get('/stops/service/:serviceId', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    return getStopsService(serviceId);
  });
}
