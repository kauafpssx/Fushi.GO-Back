import { describe, it, expect } from 'vitest';
import { metrics } from '../shared/metrics';

describe('Metrics', () => {
  it('should track request counts', () => {
    const before = metrics.totalRequests;
    metrics.totalRequests++;
    expect(metrics.totalRequests).toBe(before + 1);
  });

  it('should track pollers', () => {
    metrics.activePollers++;
    expect(metrics.activePollers).toBeGreaterThan(0);
    metrics.activePollers--;
  });

  it('should track SSE connections', () => {
    metrics.activeSSEConnections++;
    expect(metrics.activeSSEConnections).toBeGreaterThan(0);
    metrics.activeSSEConnections--;
  });
});
