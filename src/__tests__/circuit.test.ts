import { describe, it, expect } from 'vitest';
import { circuitKey, isOpen, recordFailure, recordSuccess } from '../infrastructure/cittamobi/circuit';

describe('Circuit Breaker', () => {
  it('should start closed', () => {
    const key = circuitKey('https://example.com/test');
    expect(isOpen(key)).toBe(false);
  });

  it('should open after 5 failures', () => {
    const key = 'test-circuit-' + Date.now();
    for (let i = 0; i < 5; i++) {
      recordFailure(key);
    }
    expect(isOpen(key)).toBe(true);
  });

  it('should close after success', () => {
    const key = 'test-circuit-reset-' + Date.now();
    for (let i = 0; i < 5; i++) {
      recordFailure(key);
    }
    expect(isOpen(key)).toBe(true);
    recordSuccess(key);
    expect(isOpen(key)).toBe(false);
  });

  it('should extract hostname from URL', () => {
    expect(circuitKey('https://example.com/test')).toBe('example.com');
    expect(circuitKey('https://api.test.org/v1')).toBe('api.test.org');
  });
});
