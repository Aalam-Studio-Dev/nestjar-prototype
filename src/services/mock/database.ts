/**
 * A tiny in-memory stand-in for Postgres.
 *
 * Tables hold plain rows (see ../rows.ts). Writes go through `transaction`,
 * which works on a copy and only commits if the callback succeeds, so a
 * failed multi-row write never leaves partial state behind. Committed state
 * is mirrored to sessionStorage so a refresh keeps the demo where it was.
 */

import type { ReadonlyTables, Tables } from '../rows';

const STORAGE_KEY = 'nestjar.demo.v1';

export function emptyTables(): Tables {
  return {
    user_profiles: [],
    budgets: [],
    budget_members: [],
    accounts: [],
    category_groups: [],
    categories: [],
    budget_months: [],
    income_expectations: [],
    account_balances: [],
    category_plans: [],
    category_assignments: [],
    transactions: [],
    exchange_rates: [],
  };
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Browser storage can be missing or throw (private mode, blocked cookies). */
export function safeSessionStorage(): KeyValueStorage | null {
  try {
    const storage = globalThis.sessionStorage;
    const probe = '__nestjar_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export class MockDatabase {
  private tables: Tables;
  private readonly storage: KeyValueStorage | null;
  private readonly seed: (tables: Tables) => void;

  constructor(options: { storage: KeyValueStorage | null; seed: (tables: Tables) => void }) {
    this.storage = options.storage;
    this.seed = options.seed;
    this.tables = this.load() ?? this.fresh();
  }

  /** Runs a read against committed state. Callers must not mutate what they receive. */
  read<R>(query: (tables: ReadonlyTables) => R): R {
    return query(this.tables);
  }

  /**
   * Runs `work` against a draft copy of every table. If it throws, nothing
   * changes. If it returns, the draft becomes the committed state.
   */
  transaction<R>(work: (draft: Tables) => R): R {
    const draft = structuredClone(this.tables);
    const result = work(draft);
    this.tables = draft;
    this.persist();
    return result;
  }

  reset(): void {
    this.tables = this.fresh();
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Storage is a convenience; losing it only means a refresh restarts the demo.
    }
  }

  private fresh(): Tables {
    const tables = emptyTables();
    this.seed(tables);
    return tables;
  }

  private load(): Tables | null {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Tables>;
      return { ...emptyTables(), ...parsed };
    } catch {
      return null;
    }
  }

  private persist(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.tables));
    } catch {
      // See reset().
    }
  }
}
