import { getPredictionService } from '../predictions/predictions.service';
import type { StopPredictionService } from '../predictions/predictions.types';
import { getAllPreferences, updateNotificationState, updateNotificationTracking, type NotificationPreference } from './notification.store';
import { sendPushNotification } from './notification.service';
import { getStop } from '../services/stops.service';
import type { Stop } from '../services/stops.service';
import type { FastifyBaseLogger } from 'fastify';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const CHECK_INTERVAL_MS = 30_000;
const APPROACH_THRESHOLD_MINUTES = 15;
const SAFETY_MARGIN_MINUTES = 2.5;
const WALKING_CORRECTION = 1.25;
const WALKING_SPEED_M_PER_MIN = 72;

type NotificationState = 'normal' | 'approaching' | 'imminent' | 'arrived' | 'departureReminder';

interface LastSeenVehicle {
  prefix: string;
  lastState: NotificationState;
  lastPrediction: number;
  missCount: number;
  lastSeenAt: number;
  notifiedPrefixes: string[]; // ids of preferences notified
}

const PREFIX_LAST_SEEN = 'notif:lastseen:';

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
  const meters = haversineMeters(userLat, userLng, stopLat, stopLng) * WALKING_CORRECTION;
  return Math.ceil(meters / WALKING_SPEED_M_PER_MIN);
}

function determineState(
  etaSeconds: number,
  preference: NotificationPreference,
  stop: Stop | null,
  walkingMinutesOverride?: number | null
): NotificationState {
  const walkingMinutes = walkingMinutesOverride !== undefined
    ? walkingMinutesOverride
    : (preference.userLat && preference.userLng && stop?.lat && stop?.lng
      ? calcWalkingMinutes(preference.userLat, preference.userLng, stop.lat, stop.lng)
      : preference.walkingMinutes);

  // Departure reminder tem prioridade relativa - será tratado na lógica de prioridade
  if (preference.enableDepartureReminder !== false && walkingMinutes && walkingMinutes > 0) {
    const etaMinutes = etaSeconds / 60;
    if (etaMinutes <= walkingMinutes + SAFETY_MARGIN_MINUTES && etaMinutes >= Math.max(0.5, walkingMinutes - 1)) {
      return 'departureReminder';
    }
  }

  if (etaSeconds < 60) {
    return 'imminent';
  }
  if (etaSeconds <= 300) {
    return 'approaching';
  }
  return 'normal';
}

function getStatePriority(state: NotificationState): number {
  if (state === 'arrived') return 1;
  if (state === 'departureReminder') return 2;
  if (state === 'imminent') return 3;
  if (state === 'approaching') return 4;
  if (state === 'normal') return 5;
  return 10;
}

function buildNotification(state: NotificationState, routeCode: string, prefix: string, minute: number, distance?: number) {
  const dist = distance && distance > 0 ? Math.round(distance) : null;

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
      body: dist && dist < 300
        ? `O ônibus ${prefix} está a ${dist}m da tua parada!`
        : `O ônibus ${prefix} está a poucos metros da tua parada!`,
    };
  }
  if (state === 'approaching') {
    return {
      title: `🚌 Linha ${routeCode} – Faltam ${minute < 1 ? 0 : minute} min`,
      body: dist
        ? `O ônibus ${prefix} está a ${dist}m da tua parada.`
        : `O ônibus ${prefix} está a ${minute < 1 ? 0 : minute} min da tua parada.`,
    };
  }
  return {
    title: `🚌 Linha ${routeCode} – Chega em ${minute < 1 ? 0 : minute} min`,
    body: `O ônibus ${prefix} está a aproximadamente ${minute < 1 ? 0 : minute} min da tua parada.`,
  };
}

async function getLastSeen(groupKey: string): Promise<LastSeenVehicle | null> {
  try {
    const data = await redis.get(`${PREFIX_LAST_SEEN}${groupKey}`);
    if (!data) return null;
    return JSON.parse(data as string) as LastSeenVehicle;
  } catch {
    return null;
  }
}

async function setLastSeen(groupKey: string, data: LastSeenVehicle): Promise<void> {
  try {
    await redis.set(`${PREFIX_LAST_SEEN}${groupKey}`, JSON.stringify(data), { ex: 600 }); // 10 min TTL
  } catch {
    // ignore
  }
}

async function deleteLastSeen(groupKey: string): Promise<void> {
  try {
    await redis.del(`${PREFIX_LAST_SEEN}${groupKey}`);
  } catch {
    // ignore
  }
}

async function processGroup(preferences: NotificationPreference[], sentThisTick?: Set<string>): Promise<void> {
  const first = preferences[0];
  if (!first || !first.serviceId) return;

  const groupKey = `${first.serviceId}:${first.stopId}`;

  const prediction = await getPredictionService(first.serviceId, first.stopId) as unknown as StopPredictionService;
  const vehicles = [...(prediction.vehicles || [])]
    .filter((candidate) => candidate.prediction >= 0)
    .sort((a, b) => a.prediction - b.prediction);
  const vehicle = vehicles[0];

  const lastSeen = await getLastSeen(groupKey);
  
  // Veículo sumiu - verificar se deve notificar chegada
  if (!vehicle && lastSeen && lastSeen.prefix && lastSeen.notifiedPrefixes && lastSeen.notifiedPrefixes.length > 0) {
    lastSeen.missCount = (lastSeen.missCount || 0) + 1;
    
    // Só notifica arrived se: sumiu por pelo menos 2 ciclos, estava próximo e foi notificado
    const shouldNotifyArrived = 
      lastSeen.missCount >= 2 &&
      lastSeen.lastPrediction <= 300 && // estava a <= 5 min
      (lastSeen.lastState === 'imminent' || lastSeen.lastState === 'approaching' || lastSeen.lastState === 'departureReminder');
    
    if (shouldNotifyArrived) {
      for (const preference of preferences) {
        if (!lastSeen.notifiedPrefixes.includes(preference.id)) continue;
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
            lastSeen.lastPrediction,
            null
          );
        }
      }
      await deleteLastSeen(groupKey);
      return;
    }
    
    // Ainda não confirmou chegada, atualiza contador
    if (lastSeen.missCount < 2) {
      await setLastSeen(groupKey, lastSeen);
      return;
    }
    
    // Já tentou confirmar mas não atingiu critérios ou já passou 2 ciclos sem confirmação
    await deleteLastSeen(groupKey);
    return;
  }

  if (!vehicle) {
    if (lastSeen) {
      await deleteLastSeen(groupKey);
    }
    return;
  }

  const etaSeconds = vehicle.prediction;
  if (etaSeconds / 60 > APPROACH_THRESHOLD_MINUTES) {
    await setLastSeen(groupKey, {
      prefix: vehicle.prefix,
      lastState: 'normal',
      lastPrediction: etaSeconds,
      missCount: 0,
      lastSeenAt: Date.now(),
      notifiedPrefixes: lastSeen?.notifiedPrefixes || [],
    });
    return;
  }

  let stop: Stop | null = null;
  try {
    stop = await getStop(first.stopId);
  } catch (e) {
    stop = null;
  }

  const currentNotifiedSet: string[] = [];

  for (const preference of preferences) {
    const isScheduled = vehicle.type === 'SCHEDULE';
    if (isScheduled ? !preference.notifyScheduled : !preference.notifyOnApproach) continue;

    let walkingMinutes: number | null = null;
    if (preference.userLat && preference.userLng && stop?.lat && stop?.lng) {
      walkingMinutes = calcWalkingMinutes(preference.userLat, preference.userLng, stop.lat, stop.lng);
    } else if (preference.walkingMinutes) {
      walkingMinutes = preference.walkingMinutes;
    }

    const etaMinutesCalc = etaSeconds / 60;
    // Calcular estado direto por segundos para garantir todos os estados
    let state: NotificationState;
    if (preference.enableDepartureReminder !== false && walkingMinutes && walkingMinutes > 0) {
      if (etaMinutesCalc <= walkingMinutes + SAFETY_MARGIN_MINUTES && etaMinutesCalc >= Math.max(0.5, walkingMinutes - 1)) {
        state = 'departureReminder';
      } else if (etaSeconds < 60) {
        state = 'imminent';
      } else if (etaSeconds <= 300) {
        state = 'approaching';
      } else {
        state = 'normal';
      }
    } else if (etaSeconds < 60) {
      state = 'imminent';
    } else if (etaSeconds <= 300) {
      state = 'approaching';
    } else {
      state = 'normal';
    }
    const minuteDisplay = Math.floor(etaSeconds / 60);

    // Lock por ciclo do worker
    const tickKey = `${preference.id}:${vehicle.prefix}:${minuteDisplay}:${state}`;
    if (sentThisTick?.has(tickKey)) {
      console.log(`[NOTIFY-SKIP-TICK] duplicate in same tick ${tickKey}`);
      await updateNotificationTracking(
        preference.id,
        state,
        vehicle.prefix,
        etaSeconds,
        minuteDisplay
      );
      currentNotifiedSet.push(preference.id);
      continue;
    }

    // Deduplicação rígida: mesmo estado, mesmo ônibus, mesmo minuto -> não reenviar
    if (
      preference.lastNotifiedState === state &&
      preference.lastNotifiedPrefix === vehicle.prefix &&
      preference.lastNotifiedMinute !== null &&
      preference.lastNotifiedMinute === minuteDisplay
    ) {
      console.log(`[NOTIFY-SKIP] same state+prefix+minute | sub=${preference.id} | prefix=${vehicle.prefix} | min=${minuteDisplay} | state=${state}`);
      await updateNotificationTracking(
        preference.id,
        state,
        vehicle.prefix,
        etaSeconds,
        minuteDisplay
      );
      currentNotifiedSet.push(preference.id);
      continue;
    }

    // Se já foi notificado neste mesmo minuto com qualquer estado -> bloquear
    if (
      preference.lastNotifiedMinute !== null &&
      preference.lastNotifiedMinute === minuteDisplay &&
      preference.lastNotifiedPrefix === vehicle.prefix
    ) {
      console.log(`[NOTIFY-SKIP] same minute+prefix different state | sub=${preference.id} | prefix=${vehicle.prefix} | min=${minuteDisplay} | oldState=${preference.lastNotifiedState} | newState=${state}`);
      await updateNotificationTracking(
        preference.id,
        state,
        vehicle.prefix,
        etaSeconds,
        minuteDisplay
      );
      currentNotifiedSet.push(preference.id);
      continue;
    }

    // Se já tem lastNotifiedMinute igual e foi notificado há menos de 90s -> bloquear
    if (
      preference.lastNotifiedMinute !== null &&
      preference.lastNotifiedMinute === minuteDisplay &&
      preference.lastNotified &&
      Date.now() - preference.lastNotified < 90000
    ) {
      console.log(`[NOTIFY-SKIP] recent notification same minute | sub=${preference.id} | min=${minuteDisplay}`);
      await updateNotificationTracking(
        preference.id,
        state,
        vehicle.prefix,
        etaSeconds,
        minuteDisplay
      );
      currentNotifiedSet.push(preference.id);
      continue;
    }

    // Aplicar prioridade - se já tem estado notificado com maior prioridade, não sobrepor indevidamente
    if (preference.lastNotifiedState && preference.lastNotifiedPrefix === vehicle.prefix) {
      const lastPriority = getStatePriority(preference.lastNotifiedState);
      const currentPriority = getStatePriority(state);
      
      // Não notificar se já tem estado com maior ou igual prioridade e não mudou
      if (lastPriority <= currentPriority && state !== 'departureReminder') {
        // Atualizar tracking mesmo sem enviar notificação
        await updateNotificationTracking(
          preference.id,
          state,
          vehicle.prefix,
          etaSeconds,
          minuteDisplay
        );
        currentNotifiedSet.push(preference.id);
        continue;
      }
      
      // departureReminder tem cooldown
      if (state === 'departureReminder' && preference.lastNotifiedState === 'departureReminder') {
        if (preference.lastNotified && Date.now() - preference.lastNotified < 5 * 60 * 1000) {
          await updateNotificationTracking(
            preference.id,
            state,
            vehicle.prefix,
            etaSeconds,
            minuteDisplay
          );
          currentNotifiedSet.push(preference.id);
          continue;
        }
      }
    } else {
      // Atualizar tracking sempre que processamos
      await updateNotificationTracking(
        preference.id,
        state,
        vehicle.prefix,
        etaSeconds,
        minuteDisplay
      );
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

    if (sent && sentThisTick) {
      sentThisTick.add(tickKey);
    }

    console.log(`[NOTIFY-SEND] sub=${preference.id} | prefix=${vehicle.prefix} | route=${prediction.routeCode} | state=${state} | etaSec=${etaSeconds} | min=${minuteDisplay} | sent=${sent}`);

    if (sent) {
      currentNotifiedSet.push(preference.id);
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

  await setLastSeen(groupKey, {
    prefix: vehicle.prefix,
    lastState: vehicle.type === 'SCHEDULE' ? 'normal' : (etaSeconds < 60 ? 'imminent' : etaSeconds <= 300 ? 'approaching' : 'normal'),
    lastPrediction: etaSeconds,
    missCount: 0,
    lastSeenAt: Date.now(),
    notifiedPrefixes: currentNotifiedSet,
  });
}
export async function runNotificationWorker(logger: FastifyBaseLogger): Promise<void>
{
  const preferences = await getAllPreferences();
  const groups = groupByStopAndService(preferences);
  const sentThisTick = new Set<string>();

  const results = await Promise.allSettled(
    Array.from(groups.values(), (group) => processGroup(group, sentThisTick))
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
