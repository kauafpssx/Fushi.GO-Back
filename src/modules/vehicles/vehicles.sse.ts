import type { FastifyReply } from 'fastify';
import { getVehicles, type Vehicle } from './vehicles.service';
import { validateSSEToken } from '../../security/sse-token';
import { metrics } from '../../shared/metrics';

const pollers = new Map<string, {
  sockets: Set<any>;
  lastData: string;
  polling: Promise<void>;
}>();

const MAX_PENDING = 3;

function broadcast(serviceId: string, data: Vehicle[]): void {
  const entry = pollers.get(serviceId);
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

async function pollLoop(serviceId: string): Promise<void> {
  const entry = pollers.get(serviceId);
  if (!entry) return;

  metrics.activePollers++;

  while (entry.sockets.size > 0) {
    const start = Date.now();

    try {
      const data = await getVehicles(serviceId);
      metrics.cittamobiRequests++;
      broadcast(serviceId, data);
    } catch (err) {
      console.error(`[sse] poll error ${serviceId}:`, err);
    }

    const elapsed = Date.now() - start;
    const delay = Math.max(5000 - elapsed, 1000);
    await new Promise((r) => setTimeout(r, delay));
  }

  metrics.activePollers--;
  pollers.delete(serviceId);
}

export function subscribeVehicles(serviceId: string, reply: FastifyReply, socket: any): void {
  let entry = pollers.get(serviceId);

  if (!entry) {
    entry = {
      sockets: new Set(),
      lastData: '',
      polling: Promise.resolve(),
    };
    pollers.set(serviceId, entry);
  }

  entry.sockets.add(socket);
  metrics.activeSSEConnections++;

  if (entry.sockets.size === 1) {
    entry.polling = pollLoop(serviceId);
  }

  socket.on('close', () => {
    entry!.sockets.delete(socket);
    metrics.activeSSEConnections--;
  });
}
