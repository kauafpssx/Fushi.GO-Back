import { createHash, randomBytes } from 'crypto';
import { createJWT, verifyJWT, type JWTPayload } from './jwt';
import { env } from '../app/env';

export interface Session {
  id: string;
  deviceId: string;
  refreshHash: string;
  uaHash: string;
  createdAt: number;
  lastSeen: number;
}

const sessions = new Map<string, Session>();
const TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(deviceId: string, userAgent: string): {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
} {
  const sessionId = randomBytes(16).toString('hex');
  const accessToken = createJWT(
    { sub: sessionId, deviceId, jti: randomBytes(16).toString('hex') },
    env.jwtSecret,
    15 * 60
  );
  const refreshToken = randomBytes(48).toString('base64url');

  sessions.set(sessionId, {
    id: sessionId,
    deviceId,
    refreshHash: hashToken(refreshToken),
    uaHash: createHash('sha256').update(userAgent).digest('hex'),
    createdAt: Date.now(),
    lastSeen: Date.now(),
  });

  return { accessToken, refreshToken, sessionId };
}

export function refreshSession(
  oldRefreshToken: string,
  deviceId: string,
  userAgent: string
): { accessToken: string; refreshToken: string } | null {
  for (const [id, session] of sessions) {
    if (session.refreshHash !== hashToken(oldRefreshToken)) continue;
    if (session.deviceId !== deviceId) return null;

    sessions.delete(id);

    const newRefresh = randomBytes(48).toString('base64url');
    const newAccess = createJWT(
      { sub: id, deviceId, jti: randomBytes(16).toString('hex') },
      env.jwtSecret,
      15 * 60
    );

    sessions.set(id, {
      ...session,
      refreshHash: hashToken(newRefresh),
      uaHash: createHash('sha256').update(userAgent).digest('hex'),
      lastSeen: Date.now(),
    });

    return { accessToken: newAccess, refreshToken: newRefresh };
  }

  return null;
}

export function validateSession(token: string, deviceId: string): Session | null {
  const payload = verifyJWT(token, env.jwtSecret);
  if (!payload) return null;

  const session = sessions.get(payload.sub);
  if (!session) return null;
  if (session.deviceId !== deviceId) return null;

  session.lastSeen = Date.now();
  return session;
}

export function revokeSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function revokeAllForDevice(deviceId: string): void {
  for (const [id, session] of sessions) {
    if (session.deviceId === deviceId) {
      sessions.delete(id);
    }
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastSeen > TTL_MS) {
      sessions.delete(id);
    }
  }
}, 60 * 1000);
