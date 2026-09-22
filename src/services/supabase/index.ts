/**
 * Supabase adapter (not yet implemented).
 *
 * This file exists so the seam is real: it satisfies the same `Services`
 * contract as the mock adapter, and `src/services/index.ts` can select it
 * with VITE_DATA_SOURCE=supabase. Each method names the table it will read
 * or write. Implementing it means:
 *
 *   1. npm install @supabase/supabase-js
 *   2. Create a client from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 *   3. Query the tables typed in ../rows.ts and map results with ../mappers.ts.
 *   4. Move the multi-row writes (completeBlueprint, seedMany) into Postgres
 *      functions called through `rpc`, so they run in one transaction.
 *
 * The mock adapter in ../mock is the executable specification: its tests in
 * ../mock/services.test.ts describe the behaviour this adapter must match.
 */

import type { Services } from '../contracts';
import { ServiceError } from '../errors';

function pending(operation: string, tables: string): never {
  throw new ServiceError(
    'not-implemented',
    `${operation} (${tables}) is not wired to Supabase yet`,
  );
}

export function createSupabaseServices(): Services {
  return {
    session: {
      getViewer: () => pending('session.getViewer', 'auth.getUser, user_profiles'),
    },
    budgets: {
      getCurrentBudget: () => pending('budgets.getCurrentBudget', 'budget_members, budgets'),
      createBudget: () => pending('budgets.createBudget', 'rpc create_budget'),
      invitePartner: () => pending('budgets.invitePartner', 'rpc invite_partner'),
      getStructure: () => pending('budgets.getStructure', 'accounts, category_groups, categories'),
    },
    rates: {
      getRates: () => pending('rates.getRates', 'exchange_rates'),
    },
    months: {
      getSnapshot: () => pending('months.getSnapshot', 'budget_months and month-scoped tables'),
      getBlueprintDraft: () => pending('months.getBlueprintDraft', 'previous month tables'),
      completeBlueprint: () => pending('months.completeBlueprint', 'rpc complete_blueprint'),
      seedCategory: () => pending('months.seedCategory', 'rpc seed_category'),
      seedMany: () => pending('months.seedMany', 'rpc seed_many'),
    },
    transactions: {
      logTransaction: () => pending('transactions.logTransaction', 'transactions'),
    },
    demo: {
      getScript: () => null,
      reset: async () => undefined,
    },
  };
}
