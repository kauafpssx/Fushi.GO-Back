import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentMinute: 4,
  lastNotifiedState: null as string | null,
  lastNotifiedPrefix: null as string | null,
  sendPushNotification: vi.fn(async () => true),
  removeSubscription: vi.fn(async () => undefined),
  updateNotificationState: vi.fn(async (_id: string, _timestamp: number, state: string, prefix?: string | null, _prediction?: number | null, _minute?: number | null) => {
    mocks.lastNotifiedState = state;
    if (prefix) mocks.lastNotifiedPrefix = prefix;
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
    lastNotifiedState: mocks.lastNotifiedState,
    lastNotifiedPrefix: mocks.lastNotifiedPrefix,
    lastNotifiedPrediction: null,
    lastNotifiedMinute: null,
  }]),
  getStop: vi.fn(async () => ({ id: 'stop-1', name: 'Test', lat: -23.5, lng: -46.6 })),
}));

vi.mock('../modules/predictions/predictions.service', () => ({
  getPredictionService: mocks.getPredictionService,
}));

vi.mock('../modules/notifications/notification.store', () => ({
  getAllPreferences: mocks.getAllPreferences,
  removeSubscription: mocks.removeSubscription,
  updateNotificationState: mocks.updateNotificationState,
  updateLastNotifiedMinute: vi.fn(async () => undefined),
}));

vi.mock('../modules/notifications/notification.service', () => ({
  sendPushNotification: mocks.sendPushNotification,
}));

vi.mock('../modules/services/stops.service', () => ({
  getStop: mocks.getStop,
}));

import { runNotificationWorker } from '../modules/notifications/notification.worker';

const logger = { error: vi.fn() } as any;

describe('notification worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentMinute = 4;
    mocks.lastNotifiedState = null;
    mocks.lastNotifiedPrefix = null;
  });

  it('notifies once per state and sends again when state changes', async () => {
    await runNotificationWorker(logger);
    await runNotificationWorker(logger);

    expect(mocks.sendPushNotification).toHaveBeenCalledTimes(1);

    // Change to imminent state (< 1 min)
    mocks.getPredictionService.mockResolvedValueOnce({
      routeCode: '165',
      serviceId: 'service-1',
      stopId: 'stop-1',
      vehicles: [{ prefix: '2491', prediction: 30, type: null }], // 0.5 min
    } as any);
    await runNotificationWorker(logger);

    expect(mocks.sendPushNotification).toHaveBeenCalledTimes(2);
  });
});
