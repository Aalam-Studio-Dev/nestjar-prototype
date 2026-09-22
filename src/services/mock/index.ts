import type { Services } from '../contracts';
import { createBudgetService } from './budgets';
import { createContext } from './context';
import { MockDatabase, type KeyValueStorage } from './database';
import {
  BUDGET_DEFAULTS,
  DEMO_MONTH,
  PARTNER,
  RATES,
  SAMPLE_SPEND,
  VIEWER,
} from './fixtures/demoHousehold';
import { createMonthService } from './months';
import { rates } from './queries';
import { createId } from './support';
import { createTransactionService } from './transactions';

export interface MockServicesOptions {
  readonly storage: KeyValueStorage | null;
  readonly latencyMs: number;
}

/**
 * Builds the in-browser adapter. The database starts with only the signed-in
 * viewer and exchange rates: the budget itself is created by the person,
 * during onboarding, exactly as it would be against a real backend.
 */
export function createMockServices(options: MockServicesOptions): Services {
  const db = new MockDatabase({
    storage: options.storage,
    seed: (tables) => {
      tables.user_profiles.push({
        id: VIEWER.id,
        display_name: VIEWER.displayName,
        email: VIEWER.email,
      });
      for (const rate of RATES) {
        tables.exchange_rates.push({
          id: createId('fx'),
          from_currency: rate.from,
          to_currency: rate.to,
          fixed_rate: rate.fixed,
          live_rate: rate.live,
          as_of: rate.asOf,
        });
      }
    },
  });
  const ctx = createContext(db, VIEWER.id, options.latencyMs);

  return {
    session: {
      async getViewer() {
        await ctx.latency();
        return {
          id: VIEWER.id,
          displayName: VIEWER.displayName,
          email: VIEWER.email,
        };
      },
    },
    budgets: createBudgetService(ctx),
    rates: {
      async getRates() {
        await ctx.latency();
        return db.read(rates);
      },
    },
    months: createMonthService(ctx),
    transactions: createTransactionService(ctx),
    demo: {
      getScript() {
        return {
          month: DEMO_MONTH,
          budgetName: BUDGET_DEFAULTS.name,
          baseCurrency: BUDGET_DEFAULTS.baseCurrency,
          partner: { displayName: PARTNER.displayName, email: PARTNER.email },
          sampleSpend: SAMPLE_SPEND,
        };
      },
      async reset() {
        db.reset();
      },
    },
  };
}
