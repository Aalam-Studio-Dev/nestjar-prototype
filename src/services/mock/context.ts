import type { MockDatabase } from './database';
import { delay } from './support';

export interface MockContext {
  readonly db: MockDatabase;
  readonly viewerId: string;
  /** Simulated round trip, applied to every call. */
  readonly latency: () => Promise<void>;
}

export function createContext(db: MockDatabase, viewerId: string, latencyMs: number): MockContext {
  return { db, viewerId, latency: () => delay(latencyMs) };
}
