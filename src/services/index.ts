/**
 * Composition root for the data layer. The only module that knows which
 * adapter is running. Everything else imports types from ./contracts and
 * receives an implementation through ServicesProvider.
 */

import type { Services } from './contracts';
import { createMockServices } from './mock';
import { safeSessionStorage } from './mock/database';
import { createSupabaseServices } from './supabase';

export type { Services } from './contracts';
export { ServiceError, isServiceError } from './errors';
export type { ServiceErrorCode } from './errors';

export function createServices(env: ImportMetaEnv = import.meta.env): Services {
  const source = env.VITE_DATA_SOURCE ?? 'mock';
  switch (source) {
    case 'supabase':
      return createSupabaseServices();
    case 'mock':
      return createMockServices({
        storage: safeSessionStorage(),
        latencyMs: Number(env.VITE_MOCK_LATENCY_MS ?? 180),
      });
    default:
      throw new Error(`Unknown VITE_DATA_SOURCE "${source}". Use "mock" or "supabase".`);
  }
}
