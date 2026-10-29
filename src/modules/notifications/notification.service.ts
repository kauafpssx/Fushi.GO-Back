import webPush from 'web-push';
import { env } from '../../app/env';
import {
  savePreference,
  deletePreference,
  getPreference,
  getByDeviceId,
  getByStopId,
  updateLastNotified,
  removeSubscription,
  type NotificationPreference,
} from './notification.store';
import { randomUUID } from 'crypto';
import { UnauthorizedError } from '../../shared/errors';

webPush.setVapidDetails(
  env.vapidSubject,
  env.vapidPublicKey,
  env.vapidPrivateKey
);

const ANTI_SPAM_MS = 10 * 60 * 1000; // 10 minutos

export async function subscribe(params: {
  endpoint: string;
  p256dh: string;
  auth: string;
  stopId: string;
  serviceId?: string;
  deviceId: string;
  notifyOnApproach?: boolean;
  notifyScheduled?: boolean;
}): Promise<{ id: string }> {
  const id = randomUUID();
  const now = Date.now();

  await savePreference({
    id,
    endpoint: params.endpoint,
    p256dh: params.p256dh,
    auth: params.auth,
    stopId: params.stopId,
    serviceId: params.serviceId ?? '',
    deviceId: params.deviceId,
    notifyOnApproach: params.notifyOnApproach ?? true,
    notifyScheduled: params.notifyScheduled ?? false,
    createdAt: now,
    lastNotified: 0,
  });

  return { id };
}

export async function unsubscribe(id: string, deviceId: string): Promise<{ ok: boolean }> {
  const result = await deletePreference(id, deviceId);
  if (result.unauthorized) {
    throw new UnauthorizedError('Not allowed to delete this subscription');
  }
  return { ok: true };
}

export async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: { title: string; body: string; icon?: string; badge?: string; tag?: string; renotify?: boolean; data?: Record<string, unknown> }
): Promise<boolean> {
  try {
    await webPush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      return false;
    }
    throw err;
  }
}

export async function notifyStopArrival(
  stopId: string,
  serviceId: string,
  payload: { title: string; body: string; icon?: string; badge?: string; tag?: string; renotify?: boolean; data?: Record<string, unknown> }
): Promise<void> {
  const prefs = await getByStopId(stopId, serviceId);
  const now = Date.now();

  for (const pref of prefs) {
    // Anti-spam: não notificar se já notificou nos últimos 10 min
    if (now - pref.lastNotified < ANTI_SPAM_MS) continue;

    const sent = await sendPushNotification(
      pref.endpoint,
      pref.p256dh,
      pref.auth,
      payload
    );

    if (!sent) {
      // Inscrição inválida (410 Gone / 404), remove completamente
      await removeSubscription(pref.id);
      continue;
    }

    // Atualiza último envio
    await updateLastNotified(pref.id, now);
  }
}

export async function getDeviceSubscriptions(deviceId: string): Promise<NotificationPreference[]> {
  return getByDeviceId(deviceId);
}

export { getByStopId, type NotificationPreference };
