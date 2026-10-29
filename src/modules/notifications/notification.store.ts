import { Redis } from '@upstash/redis';
import { env } from '../../app/env';

const redis = new Redis({
  url: env.upstashRedisUrl,
  token: env.upstashRedisToken,
});

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreference {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  stopId: string;
  serviceId: string;
  deviceId: string;
  notifyOnApproach: boolean;
  notifyScheduled: boolean;
  createdAt: number;
  lastNotified: number;
  lastNotifiedMinute: number | null;
  lastNotifiedPrefix: string | null;
  lastNotifiedPrediction: number | null;
}

const PREFIX_SUB = 'notif:sub:';
const PREFIX_STOP = 'notif:stop:';
const PREFIX_DEVICE = 'notif:device:';
const ALL_SUBSCRIPTIONS_KEY = 'notif:all';
const TTL_SECONDS = 2592000; // 30 dias em segundos

export async function savePreference(pref: NotificationPreference): Promise<void> {
  const hashKey = `${PREFIX_SUB}${pref.id}`;
  const stopKey = `${PREFIX_STOP}${pref.stopId}:${pref.serviceId}`;
  const deviceKey = `${PREFIX_DEVICE}${pref.deviceId}`;

  await redis.hset(hashKey, {
    id: pref.id,
    endpoint: pref.endpoint,
    p256dh: pref.p256dh,
    auth: pref.auth,
    stopId: pref.stopId,
    serviceId: pref.serviceId,
    deviceId: pref.deviceId,
    notifyOnApproach: String(pref.notifyOnApproach),
    notifyScheduled: String(pref.notifyScheduled),
    createdAt: String(pref.createdAt),
    lastNotified: String(pref.lastNotified),
    lastNotifiedMinute: pref.lastNotifiedMinute == null ? '' : String(pref.lastNotifiedMinute),
    lastNotifiedPrefix: pref.lastNotifiedPrefix ?? '',
    lastNotifiedPrediction: String(pref.lastNotifiedPrediction ?? 0),
  });

  await redis.sadd(stopKey, pref.id);
  await redis.sadd(deviceKey, pref.id);
  await redis.sadd(ALL_SUBSCRIPTIONS_KEY, pref.id);

  await redis.expire(hashKey, TTL_SECONDS);
  await redis.expire(stopKey, TTL_SECONDS);
  await redis.expire(deviceKey, TTL_SECONDS);
}

export async function getPreference(id: string): Promise<NotificationPreference | null> {
  const hashKey = `${PREFIX_SUB}${id}`;
  const sub = (await redis.hgetall(hashKey)) as Record<string, string>;
  if (!sub || Object.keys(sub).length === 0) return null;

  return {
    id: sub.id,
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    stopId: sub.stopId,
    serviceId: sub.serviceId,
    deviceId: sub.deviceId,
    notifyOnApproach: String(sub.notifyOnApproach) === 'true',
    notifyScheduled: String(sub.notifyScheduled) === 'true',
    createdAt: Number(sub.createdAt),
    lastNotified: Number(sub.lastNotified),
    lastNotifiedMinute: sub.lastNotifiedMinute === '' || sub.lastNotifiedMinute == null
      ? null
      : Number(sub.lastNotifiedMinute),
    lastNotifiedPrefix: sub.lastNotifiedPrefix === '' ? null : sub.lastNotifiedPrefix,
    lastNotifiedPrediction: sub.lastNotifiedPrediction === '' || sub.lastNotifiedPrediction == null
      ? null
      : Number(sub.lastNotifiedPrediction),
  };
}

export async function deletePreference(id: string, deviceId: string): Promise<{ ok: boolean; unauthorized?: boolean }> {
  const pref = await getPreference(id);
  if (!pref) {
    return { ok: true }; // idempotente
  }

  if (pref.deviceId !== deviceId) {
    return { ok: false, unauthorized: true };
  }

  const stopKey = `${PREFIX_STOP}${pref.stopId}:${pref.serviceId}`;
  const deviceKey = `${PREFIX_DEVICE}${pref.deviceId}`;
  const hashKey = `${PREFIX_SUB}${id}`;

  await redis.srem(stopKey, id);
  await redis.srem(deviceKey, id);
  await redis.srem(ALL_SUBSCRIPTIONS_KEY, id);
  await redis.del(hashKey);

  return { ok: true };
}

export async function getByDeviceId(deviceId: string): Promise<NotificationPreference[]> {
  const deviceKey = `${PREFIX_DEVICE}${deviceId}`;
  const ids = await redis.smembers(deviceKey);
  if (!ids || ids.length === 0) return [];

  const subs = await Promise.all(ids.map((id) => getPreference(id)));
  return subs.filter(Boolean) as NotificationPreference[];
}

export async function getByStopId(
  stopId: string,
  serviceId?: string
): Promise<NotificationPreference[]> {
  const stopKey = `${PREFIX_STOP}${stopId}:${serviceId ?? 'null'}`;
  const ids = await redis.smembers(stopKey);
  if (!ids || ids.length === 0) return [];

  const subs = await Promise.all(ids.map((id) => getPreference(id)));
  return subs.filter(Boolean) as NotificationPreference[];
}

export async function updateLastNotified(id: string, timestamp: number): Promise<void> {
  const hashKey = `${PREFIX_SUB}${id}`;
  await redis.hset(hashKey, { lastNotified: String(timestamp) });
  await redis.expire(hashKey, TTL_SECONDS);
}

export async function updateLastNotifiedMinute(
  id: string, 
  timestamp: number, 
  minute: number,
  prefix: string | null = null,
  prediction: number | null = null
): Promise<void> {
  const hashKey = `${PREFIX_SUB}${id}`;
  const updates: Record<string, string> = {
    lastNotified: String(timestamp),
    lastNotifiedMinute: String(minute),
  };
  
  if (prefix !== null) {
    updates.lastNotifiedPrefix = prefix;
  }
  if (prediction !== null) {
    updates.lastNotifiedPrediction = String(prediction);
  }
  
  await redis.hset(hashKey, updates);
  await redis.expire(hashKey, TTL_SECONDS);
}

export async function getAllPreferences(): Promise<NotificationPreference[]> {
  let ids = await redis.smembers(ALL_SUBSCRIPTIONS_KEY);

  // Backfill subscriptions created before the global index existed.
  if (!ids || ids.length === 0) {
    let cursor = 0;
    const legacyIds: string[] = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: `${PREFIX_SUB}*`,
        count: 100,
      });
      legacyIds.push(...keys.map((key) => key.slice(PREFIX_SUB.length)));
      cursor = Number(nextCursor);
    } while (cursor !== 0);

    if (legacyIds.length > 0) {
      await Promise.all(legacyIds.map((id) => redis.sadd(ALL_SUBSCRIPTIONS_KEY, id)));
      ids = legacyIds;
    }
  }

  if (!ids || ids.length === 0) return [];

  const subs = await Promise.all(ids.map((id) => getPreference(id)));
  return subs.filter(Boolean) as NotificationPreference[];
}

export async function removeSubscription(id: string): Promise<void> {
  const pref = await getPreference(id);
  if (!pref) return;

  const stopKey = `${PREFIX_STOP}${pref.stopId}:${pref.serviceId}`;
  const deviceKey = `${PREFIX_DEVICE}${pref.deviceId}`;
  const hashKey = `${PREFIX_SUB}${id}`;

  await redis.srem(stopKey, id);
  await redis.srem(deviceKey, id);
  await redis.srem(ALL_SUBSCRIPTIONS_KEY, id);
  await redis.del(hashKey);
}
