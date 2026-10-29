import { describe, it, expect } from 'vitest';
import { createJWT, verifyJWT, generateJTI } from '../security/jwt';

describe('JWT', () => {
  const secret = 'test-secret-key-for-jwt-signing-1234567890';

  it('should create and verify JWT', () => {
    const token = createJWT(
      { sub: 'session-123', deviceId: 'device-456', jti: generateJTI() },
      secret,
      60
    );

    const payload = verifyJWT(token, secret);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('session-123');
    expect(payload!.deviceId).toBe('device-456');
  });

  it('should reject expired JWT', () => {
    const token = createJWT(
      { sub: 'session-123', deviceId: 'device-456', jti: generateJTI() },
      secret,
      -1
    );

    const payload = verifyJWT(token, secret);
    expect(payload).toBeNull();
  });

  it('should reject wrong secret', () => {
    const token = createJWT(
      { sub: 'session-123', deviceId: 'device-456', jti: generateJTI() },
      secret,
      60
    );

    const payload = verifyJWT(token, 'wrong-secret');
    expect(payload).toBeNull();
  });

  it('should generate unique JTIs', () => {
    const jti1 = generateJTI();
    const jti2 = generateJTI();
    expect(jti1).not.toBe(jti2);
    expect(jti1).toHaveLength(32);
  });
});
