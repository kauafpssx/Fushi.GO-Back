import type { FastifyReply } from 'fastify';
import { getPredictions, type Prediction, type StopPredictionsResponse } from './predictions.service';
import { validateSSEToken } from '../../security/sse-token';
import { metrics } from '../../shared/metrics';

const pollers = new Map<string, {
  sockets: Set<any>;
  lastData: string;
  polling: Promise<void>;
}>();

function broadcast(stopId: string, data: Prediction[]): void {
  const entry = pollers.get(stopId);
  if (!entry) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;

  if (payload === entry.lastData) return;
  entry.lastData = payload;

  for (const socket of entry.sockets) {
    try {
      if (socket.writableLength > 1024) {
        socket.write(': skip\n\n');
        continue;
      }
      socket.write(payload);
    } catch {
      entry.sockets.delete(socket);
      metrics.activeSSEConnections--;
    }
  }
}

async function pollLoop(stopId: string): Promise<void> {
  const entry = pollers.get(stopId);
  if (!entry) return;

  metrics.activePollers++;

  while (entry.sockets.size > 0) {
    const start = Date.now();

    try {
      const data = await getPredictions(stopId);
      metrics.cittamobiRequests++;
      const predictions: Prediction[] = data.services.map((service) => ({
        stopId: service.stopId,
        stopName: service.serviceMnemonic,
        arrivals: service.vehicles.map((vehicle) => ({
          serviceId: service.serviceId,
          serviceName: service.serviceMnemonic,
          arrivalTime: vehicle.prediction,
          arrivalSeconds: vehicle.prediction,
        })),
      }));
      broadcast(stopId, predictions);
    } catch (err) {
      console.error(`[sse] poll error ${stopId}:`, err);
    }

    const elapsed = Date.now() - start;
    const delay = Math.max(5000 - elapsed, 1000);
    await new Promise((r) => setTimeout(r, delay));
  }

  metrics.activePollers--;
  pollers.delete(stopId);
}

export function subscribePredictions(stopId: string, reply: FastifyReply, socket: any): void {
  let entry = pollers.get(stopId);

  if (!entry) {
    entry = {
      sockets: new Set(),
      lastData: '',
      polling: Promise.resolve(),
    };
    pollers.set(stopId, entry);
  }

  entry.sockets.add(socket);
  metrics.activeSSEConnections++;

  if (entry.sockets.size === 1) {
    entry.polling = pollLoop(stopId);
  }

  socket.on('close', () => {
    entry!.sockets.delete(socket);
    metrics.activeSSEConnections--;
  });
}
