import type { FastifyInstance } from 'fastify';
import { getPredictions, getPredictionService, getPredictionDeparture, getServiceSchedule } from './predictions.service';

export async function predictionsRoutes(app: FastifyInstance) {
  app.get('/predictions/stop/:stopId', async (request, reply) => {
    const { stopId } = request.params as { stopId: string };
    return getPredictions(stopId);
  });

  app.get('/predictions/:serviceId/:stopId', async (request, reply) => {
    const { serviceId, stopId } = request.params as { serviceId: string; stopId: string };
    return getPredictionService(serviceId, stopId);
  });

  app.get('/predictions/departure', async (request, reply) => {
    const { serviceId, date, time } = request.query as {
      serviceId: string;
      date: string;
      time?: string;
    };
    return getPredictionDeparture(serviceId, date, time);
  });

  app.get('/predictions/departure/schedule', async (request, reply) => {
    const { serviceId, days } = request.query as {
      serviceId: string;
      days?: string;
    };
    return getServiceSchedule(serviceId, days ? parseInt(days, 10) : 7);
  });
}
