import type { FastifyBaseLogger } from 'fastify';
import { getPredictionService } from '../predictions/predictions.service';
import type { StopPredictionService } from '../predictions/predictions.types';
import {
  getAllPreferences,
  removeSubscription,
  updateLastNotifiedMinute,
  type NotificationPreference,
} from './notification.store';
import { sendPushNotification } from './notification.service';

const CHECK_INTERVAL_MS = 30_000;
const APPROACH_THRESHOLD_MINUTES = 15;

function groupByStopAndService(preferences: NotificationPreference[]): Map<string, NotificationPreference[]> {
  const groups = new Map<string, NotificationPreference[]>();
  for (const preference of preferences) {
    if (!preference.serviceId) continue;
    const key = `${preference.serviceId}:${preference.stopId}`;
    const group = groups.get(key) ?? [];
    group.push(preference);
    groups.set(key, group);
  }
  return groups;
}

async function processGroup(preferences: NotificationPreference[]): Promise<void> {
  const first = preferences[0];
  if (!first) return;

  const prediction = await getPredictionService(first.serviceId, first.stopId) as unknown as StopPredictionService;
  const vehicle = [...prediction.vehicles]
    .filter((candidate) => candidate.prediction >= 0)
    .sort((a, b) => a.prediction - b.prediction)[0];

  if (!vehicle) return;

  const minute = Math.floor(vehicle.prediction / 60);
  if (minute > APPROACH_THRESHOLD_MINUTES) return;

  for (const preference of preferences) {
    const isScheduled = vehicle.type === 'SCHEDULE';
    if (isScheduled ? !preference.notifyScheduled : !preference.notifyOnApproach) continue;
    if (preference.lastNotifiedMinute === minute) continue;

    // ← NOVO: Verificar se já notificamos este mesmo ônibus (mesmo prefix)
    const alreadyNotifiedSameBus = preference.lastNotifiedPrefix === vehicle.prefix;
    if (alreadyNotifiedSameBus) {
      // Mesmo ônibus já notificado - verificar se prediction mudou significativamente
      const predChanged = preference.lastNotifiedPrediction == null || 
        Math.abs(preference.lastNotifiedPrediction - vehicle.prediction) > 60;
      if (!predChanged) continue; // Mesmo ônibus, mesma posição -> não notifica novamente
    }

    const sent = await sendPushNotification(
      preference.endpoint,
      preference.p256dh,
      preference.auth,
      {
        title: `🚌 Linha ${prediction.routeCode} chegando!`,
        body: minute < 1
          ? `O ônibus ${vehicle.prefix} está chegando na tua parada.`
          : `O ônibus ${vehicle.prefix} está a aproximadamente ${minute} min da tua parada.`,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: `bus-${prediction.serviceId}-${prediction.stopId}`,
        data: {
          url: '/',
          stopId: prediction.stopId,
          serviceId: prediction.serviceId,
        },
      }
    );

    if (!sent) {
      await removeSubscription(preference.id);
      continue;
    }

    // ← NOVO: Atualizar rastreamento do último ônibus notificado
    await updateLastNotifiedMinute(
      preference.id,
      Date.now(),
      minute,
      vehicle.prefix,
      vehicle.prediction
    );
  }
}

export async function runNotificationWorker(logger: FastifyBaseLogger): Promise<void> {
  const preferences = await getAllPreferences();
  const groups = groupByStopAndService(preferences);

  const results = await Promise.allSettled(
    Array.from(groups.values(), (group) => processGroup(group))
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      logger.error(result.reason, 'Notification worker group failed');
    }
  }
}

export function startNotificationWorker(logger: FastifyBaseLogger): () => void {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runNotificationWorker(logger);
    } catch (error) {
      logger.error(error, 'Notification worker failed');
    } finally {
      running = false;
    }
  };

  void tick();
  const interval = setInterval(() => void tick(), CHECK_INTERVAL_MS);

  return () => clearInterval(interval);
}
