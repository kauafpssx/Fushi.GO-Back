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
}

const PREFIX_SUB = 'notif:sub:';
const PREFIX_STOP = 'notif:stop:';
const PREFIX_DEVICE = 'notif:device:';
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
  });

  await redis.sadd(stopKey, pref.id);
  await redis.sadd(deviceKey, pref.id);

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
    notifyOnApproach: sub.notifyOnApproach === 'true',
    notifyScheduled: sub.notifyScheduled === 'true',
    createdAt: Number(sub.createdAt),
    lastNotified: Number(sub.lastNotified),
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

export async function removeSubscription(id: string): Promise<void> {
  const pref = await getPreference(id);
  if (!pref) return;

  const stopKey = `${PREFIX_STOP}${pref.stopId}:${pref.serviceId}`;
  const deviceKey = `${PREFIX_DEVICE}${pref.deviceId}`;
  const hashKey = `${PREFIX_SUB}${id}`;

  await redis.srem(stopKey, id);
  await redis.srem(deviceKey, id);
  await redis.del(hashKey);
}
