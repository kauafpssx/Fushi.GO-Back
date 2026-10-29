import { env } from '../../app/env';
import { isOpen, recordFailure, recordSuccess, circuitKey } from './circuit';
import { dedupe } from '../cache/dedup';
import { cacheGet, cacheSet } from '../cache/stale';

interface RequestOptions {
  path: string;
  requiresAuth?: boolean;
  useCache?: boolean;
  timeoutMs?: number;
}

export async function request<T>({ path, requiresAuth = true, useCache = false, timeoutMs = 8000 }: RequestOptions): Promise<T> {
  const key = circuitKey(path);

  if (isOpen(key)) {
    if (useCache) {
      const cached = cacheGet(path);
      if (cached) return cached.data as T;
    }
    throw new Error(`Circuit open for ${key}`);
  }

  const doFetch = async (): Promise<T> => {
    const headers: Record<string, string> = {
      'accept-encoding': 'gzip',
      'content-type': 'application/json',
    };

    if (requiresAuth) {
      headers.username = env.cittamobiUsername;
    }

    const response = await fetch(path, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Cittamobi API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  };

  const cacheKey = path;

  try {
    const data = useCache
      ? await dedupe(cacheKey, doFetch)
      : await dedupe(cacheKey, doFetch);

    recordSuccess(key);

    if (useCache) {
      cacheSet(cacheKey, data);
    }

    return data;
  } catch (err) {
    recordFailure(key);

    if (useCache) {
      const cached = cacheGet(cacheKey);
      if (cached) return cached.data as T;
    }

    throw err;
  }
}
