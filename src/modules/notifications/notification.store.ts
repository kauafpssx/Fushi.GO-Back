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
  subscription: NotificationSubscription;
  stopId: string;
  serviceId: string | null;
  notifyOnApproach: boolean;
  notifyScheduled: boolean;
  createdAt: number;
}

const PREFIX = 'notif:';
const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias

export async function savePreference(pref: NotificationPreference): Promise<void> {
  await redis.set(`${PREFIX}${pref.id}`, JSON.stringify(pref), { ex: TTL_SECONDS });
  await redis.sadd(`${PREFIX}stop:${pref.stopId}`, pref.id);
  await redis.expire(`${PREFIX}stop:${pref.stopId}`, TTL_SECONDS);
  if (pref.serviceId) {
    await redis.sadd(`${PREFIX}service:${pref.serviceId}`, pref.id);
    await redis.expire(`${PREFIX}service:${pref.serviceId}`, TTL_SECONDS);
  }
}

export async function getPreference(id: string): Promise<NotificationPreference | null> {
  const data = await redis.get(`${PREFIX}${id}`);
  if (!data) return null;
  if (typeof data === 'string') return JSON.parse(data);
  return data as unknown as NotificationPreference;
}

export async function deletePreference(id: string): Promise<void> {
  const pref = await getPreference(id);
  if (!pref) return;

  await redis.del(`${PREFIX}${id}`);
  await redis.srem(`${PREFIX}stop:${pref.stopId}`, id);
  if (pref.serviceId) {
    await redis.srem(`${PREFIX}service:${pref.serviceId}`, id);
  }
}

export async function getByStopId(stopId: string): Promise<NotificationPreference[]> {
  const ids = await redis.smembers(`${PREFIX}stop:${stopId}`);
  if (!ids || ids.length === 0) return [];
  const prefs = await Promise.all(ids.map((id) => getPreference(id as string)));
  return prefs.filter(Boolean) as NotificationPreference[];
}

export async function getByServiceId(serviceId: string): Promise<NotificationPreference[]> {
  const ids = await redis.smembers(`${PREFIX}service:${serviceId}`);
  if (!ids || ids.length === 0) return [];
  const prefs = await Promise.all(ids.map((id) => getPreference(id as string)));
  return prefs.filter(Boolean) as NotificationPreference[];
}
