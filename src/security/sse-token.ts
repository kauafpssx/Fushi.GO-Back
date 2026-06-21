import { randomBytes } from 'crypto';
import { createJWT, verifyJWT } from './jwt';
import { env } from '../app/env';

const sseTokens = new Map<string, { deviceId: string; exp: number }>();

const SSE_TOKEN_TTL = 30;

export function createSSEToken(deviceId: string): string {
  const token = createJWT(
    { sub: 'sse', deviceId, jti: randomBytes(8).toString('hex') },
    env.jwtSecret,
    SSE_TOKEN_TTL
  );

  sseTokens.set(token, { deviceId, exp: Date.now() + SSE_TOKEN_TTL * 1000 });

  return token;
}

export function validateSSEToken(token: string, deviceId: string): boolean {
  const payload = verifyJWT(token, env.jwtSecret);
  if (!payload) return false;
  if (payload.deviceId !== deviceId) return false;

  sseTokens.delete(token);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [token, data] of sseTokens) {
    if (data.exp < now) {
      sseTokens.delete(token);
    }
  }
}, 10_000);
