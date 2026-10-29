import { describe, it, expect } from 'vitest';
import { dedupe } from '../infrastructure/cache/dedup';

describe('Dedup', () => {
  it('should dedupe concurrent calls', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return callCount;
    };

    const [a, b, c] = await Promise.all([
      dedupe('key-1', fn),
      dedupe('key-1', fn),
      dedupe('key-1', fn),
    ]);

    expect(callCount).toBe(1);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(1);
  });

  it('should allow new calls after previous completes', async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return callCount;
    };

    const first = await dedupe('key-2', fn);
    const second = await dedupe('key-2', fn);

    expect(first).toBe(1);
    expect(second).toBe(2);
  });

  it('should handle errors', async () => {
    const fn = async () => {
      throw new Error('fail');
    };

    await expect(dedupe('key-error', fn)).rejects.toThrow('fail');
  });
});
