import { env } from '../app/env';

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuits = new Map<string, CircuitState>();
const FAILURE_THRESHOLD = 5;
const OPEN_DURATION_MS = 30_000;

export function circuitKey(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function isOpen(key: string): boolean {
  const state = circuits.get(key);
  if (!state) return false;

  if (state.isOpen) {
    if (Date.now() - state.lastFailure > OPEN_DURATION_MS) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }
    return true;
  }

  return false;
}

export function recordFailure(key: string): void {
  let state = circuits.get(key);
  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false };
    circuits.set(key, state);
  }

  state.failures++;
  state.lastFailure = Date.now();

  if (state.failures >= FAILURE_THRESHOLD) {
    state.isOpen = true;
    console.error(`[circuit] OPEN for ${key} (${state.failures} failures)`);
  }
}

export function recordSuccess(key: string): void {
  const state = circuits.get(key);
  if (state) {
    state.failures = 0;
    state.isOpen = false;
  }
}
