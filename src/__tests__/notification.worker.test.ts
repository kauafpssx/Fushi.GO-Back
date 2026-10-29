import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentMinute: 4,
  lastNotifiedMinute: null as number | null,
  sendPushNotification: vi.fn(async () => true),
  removeSubscription: vi.fn(async () => undefined),
  updateLastNotifiedMinute: vi.fn(async (_id: string, _timestamp: number, minute: number) => {
    mocks.lastNotifiedMinute = minute;
  }),
  getPredictionService: vi.fn(async () => ({
    routeCode: '165',
    serviceId: 'service-1',
    stopId: 'stop-1',
    vehicles: [{ prefix: '2491', prediction: mocks.currentMinute * 60 + 10, type: null }],
  })),
  getAllPreferences: vi.fn(async () => [{
    id: 'subscription-1',
    endpoint: 'https://push.example/subscription',
    p256dh: 'p256dh',
    auth: 'auth',
    stopId: 'stop-1',
    serviceId: 'service-1',
    deviceId: 'device-1',
    notifyOnApproach: true,
    notifyScheduled: false,
    createdAt: 0,
    lastNotified: 0,
    lastNotifiedMinute: mocks.lastNotifiedMinute,
  }]),
}));

vi.mock('../modules/predictions/predictions.service', () => ({
  getPredictionService: mocks.getPredictionService,
}));

vi.mock('../modules/notifications/notification.store', () => ({
  getAllPreferences: mocks.getAllPreferences,
  removeSubscription: mocks.removeSubscription,
  updateLastNotifiedMinute: mocks.updateLastNotifiedMinute,
}));

vi.mock('../modules/notifications/notification.service', () => ({
  sendPushNotification: mocks.sendPushNotification,
}));

import { runNotificationWorker } from '../modules/notifications/notification.worker';

const logger = { error: vi.fn() } as any;

describe('notification worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentMinute = 4;
    mocks.lastNotifiedMinute = null;
  });

  it('notifies once per minute value and sends again when the minute changes', async () => {
    await runNotificationWorker(logger);
    await runNotificationWorker(logger);

    expect(mocks.sendPushNotification).toHaveBeenCalledTimes(1);
    expect(mocks.updateLastNotifiedMinute).toHaveBeenLastCalledWith(
      'subscription-1',
      expect.any(Number),
      4,
      expect.any(String),
      expect.any(Number)
    );

    mocks.currentMinute = 3;
    await runNotificationWorker(logger);

    expect(mocks.sendPushNotification).toHaveBeenCalledTimes(2);
    expect(mocks.updateLastNotifiedMinute).toHaveBeenLastCalledWith(
      'subscription-1',
      expect.any(Number),
      3,
      expect.any(String),
      expect.any(Number)
    );
  });
});
