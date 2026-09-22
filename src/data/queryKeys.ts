import type { MonthKey } from '@/domain/month';

/**
 * Every cache key in one place, so invalidation after a write is explicit
 * and a typo cannot silently create a second copy of the same data.
 */
export const queryKeys = {
  viewer: ['viewer'] as const,
  currentBudget: ['budget', 'current'] as const,
  structure: (budgetId: string) => ['budget', budgetId, 'structure'] as const,
  rates: ['rates'] as const,
  month: (budgetId: string, month: MonthKey) => ['budget', budgetId, 'month', month] as const,
  blueprintDraft: (budgetId: string, month: MonthKey) =>
    ['budget', budgetId, 'month', month, 'blueprint-draft'] as const,
};
