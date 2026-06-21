const pending = new Map<string, Promise<any>>();

export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = pending.get(key);
  if (existing) return existing;

  const promise = fn().finally(() => {
    pending.delete(key);
  });

  pending.set(key, promise);
  return promise;
}
