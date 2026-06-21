import { createHmac, randomBytes } from 'crypto';

const ALGORITHM = 'sha256';

export interface JWTPayload {
  sub: string;
  deviceId: string;
  jti: string;
  iat: number;
  exp: number;
}

interface JWTHeader {
  alg: 'HS256';
  typ: 'JWT';
}

function base64url(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64url');
}

function sign(payload: string, secret: string): string {
  return createHmac(ALGORITHM, secret).update(payload).digest('base64url');
}

export function createJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds: number
): string {
  const header: JWTHeader = { alg: 'HS256', typ: 'JWT' };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJWT(token: string, secret: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);

    if (signature !== expectedSignature) return null;

    const payload: JWTPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString()
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function generateJTI(): string {
  return randomBytes(16).toString('hex');
}
