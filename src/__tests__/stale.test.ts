import { describe, it, expect } from 'vitest';
import { cacheSet, cacheGet, cacheDelete } from '../infrastructure/cache/stale';

describe('Stale Cache', () => {
  it('should store and retrieve data', () => {
    cacheSet('test-key', { id: 1, name: 'test' });
    const result = cacheGet('test-key');
    expect(result).not.toBeNull();
    expect(result!.data).toEqual({ id: 1, name: 'test' });
    expect(result!.stale).toBe(false);
  });

  it('should return null for missing key', () => {
    const result = cacheGet('missing-' + Date.now());
    expect(result).toBeNull();
  });

  it('should delete data', () => {
    const key = 'delete-me-' + Date.now();
    cacheSet(key, 'data');
    cacheDelete(key);
    expect(cacheGet(key)).toBeNull();
  });
});
