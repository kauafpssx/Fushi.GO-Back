import { getPredictionService } from '../predictions/predictions.service';
import type { StopPredictionService } from '../predictions/predictions.types';
import { getAllPreferences, updateNotificationState, type NotificationPreference } from './notification.store';
import { sendPushNotification } from './notification.service';
import { getStop } from '../services/stops.service';
import type { Stop } from '../services/stops.service';
import type { FastifyBaseLogger } from 'fastify';

const CHECK_INTERVAL_MS = 30_000;
const APPROACH_THRESHOLD_MINUTES = 15;
const SAFETY_MARGIN_MINUTES = 2.5;

type NotificationState = 'normal' | 'approaching' | 'imminent' | 'arrived' | 'departureReminder';

interface LastSeenVehicle {
  prefix: string;
  prediction: number;
  notifiedPrefixes: Set<string>;
  seenAt: number;
}

const lastSeenByGroup = new Map<string, LastSeenVehicle>();

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

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLng = (bLng - aLng) * Math.PI / 180;
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
}

function calcWalkingMinutes(userLat: number, userLng: number, stopLat: number, stopLng: number): number {
  const meters = haversineMeters(userLat, userLng, stopLat, stopLng);
  return Math.ceil(meters / 72);
}

function determineState(
  etaMinutes: number,
  preference: NotificationPreference,
  stop: Stop | null,
  walkingMinutesOverride?: number | null
): NotificationState {
  const walkingMinutes = walkingMinutesOverride !== undefined
    ? walkingMinutesOverride
    : (preference.userLat && preference.userLng && stop?.lat && stop?.lng
      ? calcWalkingMinutes(preference.userLat, preference.userLng, stop.lat, stop.lng)
      : preference.walkingMinutes);

  if (preference.enableDepartureReminder !== false && walkingMinutes && walkingMinutes > 0) {
    if (etaMinutes <= walkingMinutes + SAFETY_MARGIN_MINUTES && etaMinutes >= Math.max(0.5, walkingMinutes - 1)) {
      return 'departureReminder';
    }
  }

  if (etaMinutes < 1) {
    return 'imminent';
  }
  if (etaMinutes <= 5) {
    return 'approaching';
  }
  return 'normal';
}

function buildNotification(state: NotificationState, routeCode: string, prefix: string, minute: number, distance?: number) {
  if (state === 'departureReminder') {
    return {
      title: `⏰ Hora de sair! Linha ${routeCode}`,
      body: `O ônibus ${prefix} chega em ${minute < 1 ? 0 : minute} min. Hora de ir para a parada!`,
    };
  }
  if (state === 'arrived') {
    return {
      title: `✅ Linha ${routeCode} – Chegou!`,
      body: `O ônibus ${prefix} chegou à tua parada.`,
    };
  }
  if (state === 'imminent') {
    return {
      title: `🚌 Linha ${routeCode} – Tá chegando!`,
      body: `O ônibus ${prefix} está a poucos metros da tua parada!`,
    };
  }
  if (state === 'approaching') {
    return {
      title: `🚌 Linha ${routeCode} – Faltam ${minute < 1 ? 0 : minute} min`,
      body: distance && distance > 0
        ? `O ônibus ${prefix} está a ${Math.round(distance)}m da tua parada.`
        : `O ônibus ${prefix} está a ${minute < 1 ? 0 : minute} min da tua parada.`,
    };
  }
  return {
    title: `🚌 Linha ${routeCode} – Chega em ${minute < 1 ? 0 : minute} min`,
    body: `O ônibus ${prefix} está a aproximadamente ${minute < 1 ? 0 : minute} min da tua parada.`,
  };
}

async function processGroup(preferences: NotificationPreference[]): Promise<void> {
  const first = preferences[0];
  if (!first || !first.serviceId) return;

  const groupKey = `${first.serviceId}:${first.stopId}`;

  const prediction = await getPredictionService(first.serviceId, first.stopId) as unknown as StopPredictionService;
  const vehicles = [...(prediction.vehicles || [])]
    .filter((candidate) => candidate.prediction >= 0)
    .sort((a, b) => a.prediction - b.prediction);
  const vehicle = vehicles[0];

  const lastSeen = lastSeenByGroup.get(groupKey);
  if (!vehicle && lastSeen && lastSeen.prefix && lastSeen.notifiedPrefixes.size > 0) {
    for (const preference of preferences) {
      if (!lastSeen.notifiedPrefixes.has(preference.id)) continue;
      if (preference.lastNotifiedState === 'arrived' && preference.lastNotifiedPrefix === lastSeen.prefix) continue;

      const sent = await sendPushNotification(
        preference.endpoint,
        preference.p256dh,
        preference.auth,
        {
          title: `✅ Linha ${prediction.routeCode} – Chegou!`,
          body: `O ônibus ${lastSeen.prefix} chegou à tua parada.`,
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          tag: `bus-${prediction.serviceId}-${prediction.stopId}`,
          data: {
            url: '/',
            stopId: prediction.stopId,
            serviceId: prediction.serviceId,
            state: 'arrived',
          },
        }
      );

      if (sent) {
        await updateNotificationState(
          preference.id,
          Date.now(),
          'arrived',
          lastSeen.prefix,
          lastSeen.prediction,
          null
        );
      }
    }
    lastSeenByGroup.delete(groupKey);
    return;
  }

  if (!vehicle) {
    lastSeenByGroup.delete(groupKey);
    return;
  }

  const etaSeconds = vehicle.prediction;
  const etaMinutes = etaSeconds / 60;
  if (etaMinutes > APPROACH_THRESHOLD_MINUTES) {
    lastSeenByGroup.set(groupKey, {
      prefix: vehicle.prefix,
      prediction: etaSeconds,
      notifiedPrefixes: lastSeen?.notifiedPrefixes ?? new Set(),
      seenAt: Date.now(),
    });
    return;
  }

  let stop: Stop | null = null;
  try {
    stop = await getStop(first.stopId);
  } catch (e) {
    stop = null;
  }

  const currentNotifiedSet = new Set<string>();

  for (const preference of preferences) {
    const isScheduled = vehicle.type === 'SCHEDULE';
    if (isScheduled ? !preference.notifyScheduled : !preference.notifyOnApproach) continue;

    let walkingMinutes: number | null = null;
    if (preference.userLat && preference.userLng && stop?.lat && stop?.lng) {
      walkingMinutes = calcWalkingMinutes(preference.userLat, preference.userLng, stop.lat, stop.lng);
    } else if (preference.walkingMinutes) {
      walkingMinutes = preference.walkingMinutes;
    }

    const state = determineState(etaMinutes, preference, stop, walkingMinutes);
    const minuteDisplay = Math.floor(etaMinutes);

    if (
      preference.lastNotifiedState === state &&
      preference.lastNotifiedPrefix === vehicle.prefix &&
      state !== 'departureReminder'
    ) {
      currentNotifiedSet.add(preference.id);
      continue;
    }

    if (preference.lastNotifiedState === state && preference.lastNotifiedPrefix === vehicle.prefix && state === 'departureReminder') {
      if (preference.lastNotified && Date.now() - preference.lastNotified < 5 * 60 * 1000) {
        currentNotifiedSet.add(preference.id);
        continue;
      }
    }

    const notification = buildNotification(
      state,
      prediction.routeCode,
      vehicle.prefix,
      minuteDisplay,
      (vehicle as any).distance
    );

    const sent = await sendPushNotification(
      preference.endpoint,
      preference.p256dh,
      preference.auth,
      {
        ...notification,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: `bus-${prediction.serviceId}-${prediction.stopId}`,
        data: {
          url: '/',
          stopId: prediction.stopId,
          serviceId: prediction.serviceId,
          state,
        },
      }
    );

    if (sent) {
      currentNotifiedSet.add(preference.id);
      await updateNotificationState(
        preference.id,
        Date.now(),
        state,
        vehicle.prefix,
        etaSeconds,
        minuteDisplay
      );
    }
  }

  lastSeenByGroup.set(groupKey, {
    prefix: vehicle.prefix,
    prediction: etaSeconds,
    notifiedPrefixes: currentNotifiedSet,
    seenAt: Date.now(),
  });
}

export async function runNotificationWorker(logger: FastifyBaseLogger): Promise<void>
{
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
