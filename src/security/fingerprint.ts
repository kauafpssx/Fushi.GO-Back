import { createHash } from 'crypto';

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateDeviceId(): string {
  const { randomUUID } = require('crypto');
  return randomUUID();
}

export interface Fingerprint {
  userAgentHash: string;
  acceptLanguage: string;
  timezone: string;
}

export function createFingerprint(
  userAgent: string,
  acceptLanguage: string,
  timezone: string
): Fingerprint {
  return {
    userAgentHash: hashValue(userAgent),
    acceptLanguage,
    timezone,
  };
}

export function fingerprintHash(fp: Fingerprint): string {
  return hashValue(
    `${fp.userAgentHash}:${fp.acceptLanguage}:${fp.timezone}`
  );
}
