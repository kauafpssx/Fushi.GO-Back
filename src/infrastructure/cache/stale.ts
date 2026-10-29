const cache = new Map<string, { data: any; timestamp: number }>();
const STALE_MS = 30_000;

export function cacheSet(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function cacheGet(key: string): { data: any; stale: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  return {
    data: entry.data,
    stale: age > STALE_MS,
  };
}

export function cacheDelete(key: string): void {
  cache.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > 5 * 60_000) {
      cache.delete(key);
    }
  }
}, 60_000);
