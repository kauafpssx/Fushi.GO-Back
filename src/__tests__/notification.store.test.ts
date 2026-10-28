import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const redisMock: Record<string, unknown> = {};
  const setMock = vi.fn(async (key: string, value: string, opts?: { ex?: number }) => {
    redisMock[key] = value;
    return 'OK';
  });
  const getMock = vi.fn(async (key: string) => redisMock[key] ?? null);
  const delMock = vi.fn(async (...keys: string[]) => {
    let count = 0;
    for (const k of keys) {
      if (redisMock[k] !== undefined) { delete redisMock[k]; count++; }
    }
    return count;
  });
  const saddMock = vi.fn(async (key: string, ...members: string[]) => {
    const current = redisMock[key];
    const arr: string[] = current ? JSON.parse(String(current)) : [];
    arr.push(...members);
    redisMock[key] = JSON.stringify(arr);
    return members.length;
  });
  const smembersMock = vi.fn(async (key: string) => {
    const current = redisMock[key];
    return current ? JSON.parse(String(current)) : [];
  });
  const sremMock = vi.fn(async (key: string, ...members: string[]) => {
    const current = redisMock[key];
    if (!current) return 0;
    const arr: string[] = JSON.parse(String(current));
    const before = arr.length;
    const filtered = arr.filter((m) => !members.includes(m));
    redisMock[key] = JSON.stringify(filtered);
    return before - filtered.length;
  });
  const expireMock = vi.fn(async () => true);
  return { redisMock, setMock, getMock, delMock, saddMock, smembersMock, sremMock, expireMock };
});

vi.mock('../app/env', () => ({
  env: {
    upstashRedisUrl: 'https://mock.upstash.io',
    upstashRedisToken: 'mock-token',
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    set = mocks.setMock;
    get = mocks.getMock;
    del = mocks.delMock;
    sadd = mocks.saddMock;
    smembers = mocks.smembersMock;
    srem = mocks.sremMock;
    expire = mocks.expireMock;
  },
}));

import {
  savePreference,
  deletePreference,
  getPreference,
  getByStopId,
  getByDeviceId,
  type NotificationPreference,
  type NotificationSubscription,
} from '../modules/notifications/notification.store';

const subscription: NotificationSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
};

const basePref: NotificationPreference = {
  id: 'pref-1',
  subscription,
  stopId: '8a5197b2-d51d-49f5-8d30-d6a645a75685',
  serviceId: '0ebdad7f-d280-11f0-a0e6-02001705c31d',
  deviceId: 'device-123',
  notifyOnApproach: true,
  notifyScheduled: false,
  createdAt: Date.now(),
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(mocks.redisMock).forEach((k) => delete mocks.redisMock[k]);
});

describe('Notification Store', () => {
  it('should save and retrieve a preference', async () => {
    await savePreference(basePref);
    expect(mocks.setMock).toHaveBeenCalledWith(
      'notif:pref-1',
      expect.stringContaining('"deviceId":"device-123"'),
      { ex: 30 * 24 * 60 * 60 }
    );
    expect(mocks.saddMock).toHaveBeenCalledWith('notif:stop:8a5197b2-d51d-49f5-8d30-d6a645a75685', 'pref-1');
    expect(mocks.saddMock).toHaveBeenCalledWith('notif:device:device-123', 'pref-1');
    expect(mocks.saddMock).toHaveBeenCalledWith('notif:service:0ebdad7f-d280-11f0-a0e6-02001705c31d', 'pref-1');

    const got = await getPreference('pref-1');
    expect(got).not.toBeNull();
    expect(got!.id).toBe('pref-1');
    expect(got!.deviceId).toBe('device-123');
    expect(got!.stopId).toBe('8a5197b2-d51d-49f5-8d30-d6a645a75685');
  });

  it('should return null for missing preference', async () => {
    const got = await getPreference('missing-id');
    expect(got).toBeNull();
  });

  it('should delete a preference and clean indexes', async () => {
    await savePreference(basePref);
    await deletePreference('pref-1');
    expect(mocks.delMock).toHaveBeenCalledWith('notif:pref-1');
    expect(mocks.sremMock).toHaveBeenCalledWith('notif:stop:8a5197b2-d51d-49f5-8d30-d6a645a75685', 'pref-1');
    expect(mocks.sremMock).toHaveBeenCalledWith('notif:device:device-123', 'pref-1');
    expect(mocks.sremMock).toHaveBeenCalledWith('notif:service:0ebdad7f-d280-11f0-a0e6-02001705c31d', 'pref-1');
  });

  it('should get preferences by stop id', async () => {
    await savePreference({ ...basePref, id: 'p1' });
    await savePreference({ ...basePref, id: 'p2', stopId: 'other-stop' });
    const byStop = await getByStopId('8a5197b2-d51d-49f5-8d30-d6a645a75685');
    expect(byStop).toHaveLength(1);
    expect(byStop[0]!.id).toBe('p1');
  });

  it('should get preferences by device id', async () => {
    await savePreference({ ...basePref, id: 'p1', deviceId: 'device-123' });
    await savePreference({ ...basePref, id: 'p2', deviceId: 'other-device' });
    const byDevice = await getByDeviceId('device-123');
    expect(byDevice).toHaveLength(1);
    expect(byDevice[0]!.id).toBe('p1');
    expect(byDevice[0]!.deviceId).toBe('device-123');
  });

  it('should return empty array for device with no preferences', async () => {
    const byDevice = await getByDeviceId('no-device');
    expect(byDevice).toEqual([]);
  });
});
