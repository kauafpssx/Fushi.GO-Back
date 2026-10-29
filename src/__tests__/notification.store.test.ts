import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const hashes: Record<string, Record<string, string>> = {};
  const sets: Record<string, string[]> = {};

  const hsetMock = vi.fn(async (key: string, fields: Record<string, string>) => {
    hashes[key] = { ...(hashes[key] ?? {}), ...fields };
    return Object.keys(fields).length;
  });
  const hgetallMock = vi.fn(async (key: string) => hashes[key] ?? {});
  const delMock = vi.fn(async (...keys: string[]) => {
    let count = 0;
    for (const k of keys) {
      if (hashes[k] !== undefined) { delete hashes[k]; count++; }
      if (sets[k] !== undefined) { delete sets[k]; count++; }
    }
    return count;
  });
  const saddMock = vi.fn(async (key: string, ...members: string[]) => {
    const arr = sets[key] ?? [];
    sets[key] = [...new Set([...arr, ...members])];
    return members.length;
  });
  const smembersMock = vi.fn(async (key: string) => sets[key] ?? []);
  const sremMock = vi.fn(async (key: string, ...members: string[]) => {
    const arr = sets[key] ?? [];
    const before = arr.length;
    sets[key] = arr.filter((m) => !members.includes(m));
    return before - sets[key]!.length;
  });
  const expireMock = vi.fn(async () => true);
  const scanMock = vi.fn(async () => [0, []] as [number, string[]]);

  return { hashes, sets, hsetMock, hgetallMock, delMock, saddMock, smembersMock, sremMock, expireMock, scanMock };
});

vi.mock('../app/env', () => ({
  env: {
    upstashRedisUrl: 'https://mock.upstash.io',
    upstashRedisToken: 'mock-token',
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    hset = mocks.hsetMock;
    hgetall = mocks.hgetallMock;
    del = mocks.delMock;
    sadd = mocks.saddMock;
    smembers = mocks.smembersMock;
    srem = mocks.sremMock;
    expire = mocks.expireMock;
    scan = mocks.scanMock;
  },
}));

import {
  savePreference,
  deletePreference,
  getPreference,
  getByStopId,
  getByDeviceId,
  updateLastNotified,
  removeSubscription,
  type NotificationPreference,
} from '../modules/notifications/notification.store';

const basePref: NotificationPreference = {
  id: 'pref-1',
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
  stopId: '8a5197b2-d51d-49f5-8d30-d6a645a75685',
  serviceId: '0ebdad7f-d280-11f0-a0e6-02001705c31d',
  deviceId: 'device-123',
  notifyOnApproach: true,
  notifyScheduled: false,
  createdAt: Date.now(),
  lastNotified: 0,
  lastNotifiedMinute: null,
  lastNotifiedPrefix: null,
  lastNotifiedPrediction: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(mocks.hashes).forEach((k) => delete mocks.hashes[k]);
  Object.keys(mocks.sets).forEach((k) => delete mocks.sets[k]);
});

describe('Notification Store', () => {
  it('should save and retrieve a preference', async () => {
    await savePreference(basePref);
    expect(mocks.hsetMock).toHaveBeenCalledWith(
      'notif:sub:pref-1',
      expect.objectContaining({
        id: 'pref-1',
        deviceId: 'device-123',
        stopId: '8a5197b2-d51d-49f5-8d30-d6a645a75685',
        lastNotified: '0',
      })
    );
    expect(mocks.hsetMock).toHaveBeenCalledWith(
      'notif:sub:pref-1',
      expect.objectContaining({
        notifyOnApproach: 'true',
        notifyScheduled: 'false',
        createdAt: expect.any(String),
      })
    );
    expect(mocks.saddMock).toHaveBeenCalledWith(
      'notif:stop:8a5197b2-d51d-49f5-8d30-d6a645a75685:0ebdad7f-d280-11f0-a0e6-02001705c31d',
      'pref-1'
    );
    expect(mocks.saddMock).toHaveBeenCalledWith('notif:device:device-123', 'pref-1');
    expect(mocks.expireMock).toHaveBeenCalledWith('notif:sub:pref-1', 2592000);
    expect(mocks.expireMock).toHaveBeenCalledWith(
      'notif:stop:8a5197b2-d51d-49f5-8d30-d6a645a75685:0ebdad7f-d280-11f0-a0e6-02001705c31d',
      2592000
    );
    expect(mocks.expireMock).toHaveBeenCalledWith('notif:device:device-123', 2592000);

    const got = await getPreference('pref-1');
    expect(got).not.toBeNull();
    expect(got!.id).toBe('pref-1');
    expect(got!.deviceId).toBe('device-123');
    expect(got!.stopId).toBe('8a5197b2-d51d-49f5-8d30-d6a645a75685');
    expect(got!.endpoint).toBe('https://fcm.googleapis.com/fcm/send/abc');
    expect(got!.lastNotified).toBe(0);
  });

  it('should return null for missing preference', async () => {
    const got = await getPreference('missing-id');
    expect(got).toBeNull();
  });

  it('should delete a preference and clean indexes', async () => {
    await savePreference(basePref);
    const result = await deletePreference('pref-1', 'device-123');
    expect(result.ok).toBe(true);
    expect(mocks.delMock).toHaveBeenCalledWith('notif:sub:pref-1');
    expect(mocks.sremMock).toHaveBeenCalledWith(
      'notif:stop:8a5197b2-d51d-49f5-8d30-d6a645a75685:0ebdad7f-d280-11f0-a0e6-02001705c31d',
      'pref-1'
    );
    expect(mocks.sremMock).toHaveBeenCalledWith('notif:device:device-123', 'pref-1');
  });

  it('should return unauthorized when deleting another device subscription', async () => {
    await savePreference(basePref);
    const result = await deletePreference('pref-1', 'other-device');
    expect(result.ok).toBe(false);
    expect(result.unauthorized).toBe(true);
  });

  it('should be idempotent when deleting missing preference', async () => {
    const result = await deletePreference('missing-id', 'device-123');
    expect(result.ok).toBe(true);
  });

  it('should get preferences by stop id', async () => {
    await savePreference({ ...basePref, id: 'p1' });
    await savePreference({ ...basePref, id: 'p2', stopId: 'other-stop', serviceId: '' });
    const byStop = await getByStopId('8a5197b2-d51d-49f5-8d30-d6a645a75685', '0ebdad7f-d280-11f0-a0e6-02001705c31d');
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

  it('should update lastNotified timestamp', async () => {
    await savePreference(basePref);
    await updateLastNotified('pref-1', Date.now());
    expect(mocks.hsetMock).toHaveBeenCalledWith('notif:sub:pref-1', {
      lastNotified: expect.any(String),
    });
  });

  it('should remove subscription completely', async () => {
    await savePreference(basePref);
    await removeSubscription('pref-1');
    expect(mocks.delMock).toHaveBeenCalledWith('notif:sub:pref-1');
    expect(mocks.sremMock).toHaveBeenCalledWith('notif:device:device-123', 'pref-1');
  });
});
