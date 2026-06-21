import webPush from 'web-push';
import { env } from '../../app/env';
import {
  savePreference,
  deletePreference,
  getByStopId,
  type NotificationSubscription,
  type NotificationPreference,
} from './notification.store';
import { randomUUID } from 'crypto';

webPush.setVapidDetails(
  env.vapidSubject,
  env.vapidPublicKey,
  env.vapidPrivateKey
);

export async function subscribe(params: {
  subscription: NotificationSubscription;
  stopId: string;
  serviceId?: string;
  notifyOnApproach?: boolean;
  notifyScheduled?: boolean;
}): Promise<{ id: string }> {
  const id = randomUUID();

  await savePreference({
    id,
    subscription: params.subscription,
    stopId: params.stopId,
    serviceId: params.serviceId ?? null,
    notifyOnApproach: params.notifyOnApproach ?? true,
    notifyScheduled: params.notifyScheduled ?? false,
    createdAt: Date.now(),
  });

  return { id };
}

export async function unsubscribe(id: string): Promise<void> {
  await deletePreference(id);
}

export async function sendNotification(
  subscription: NotificationSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    if (err.statusCode === 410) {
      return false;
    }
    throw err;
  }
}

export async function notifyStopApproach(
  stopId: string,
  serviceName: string,
  arrivalSeconds: number
): Promise<void> {
  const prefs = await getByStopId(stopId);
  const minutes = Math.ceil(arrivalSeconds / 60);

  const payload = {
    title: `${serviceName} chegando!`,
    body: `Faltam ${minutes} minuto${minutes > 1 ? 's' : ''}`,
    url: `/stop/${stopId}`,
  };

  for (const pref of prefs) {
    if (!pref.notifyOnApproach) continue;

    const sent = await sendNotification(pref.subscription, payload);
    if (!sent) {
      await deletePreference(pref.id);
    }
  }
}

export { getByStopId, type NotificationPreference };
