/**
 * Read helpers over raw tables. Shared by the mock services so every write
 * validates against exactly what a read would return.
 */

import { sumMinor } from '@/domain/money';
import type { MonthKey } from '@/domain/month';
import type { BudgetStructure, MonthSnapshot } from '@/domain/types';
import {
  monthToDate,
  toAccount,
  toAccountBalance,
  toCategory,
  toCategoryGroup,
  toCategoryPlan,
  toCategorySeed,
  toIncomeLine,
  toRatePair,
  toTransaction,
} from '../mappers';
import type { BudgetMonthRow, ReadonlyTables } from '../rows';

export function findMonthRow(
  tables: ReadonlyTables,
  budgetId: string,
  month: MonthKey,
): BudgetMonthRow | undefined {
  const date = monthToDate(month);
  return tables.budget_months.find((m) => m.budget_id === budgetId && m.month === date);
}

export function buildStructure(tables: ReadonlyTables, budgetId: string): BudgetStructure {
  return {
    accounts: tables.accounts
      .filter((a) => a.budget_id === budgetId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(toAccount),
    groups: tables.category_groups.filter((g) => g.budget_id === budgetId).map(toCategoryGroup),
    categories: tables.categories
      .filter((c) => c.budget_id === budgetId && !c.archived)
      .map(toCategory),
  };
}

export function buildSnapshot(
  tables: ReadonlyTables,
  budgetId: string,
  month: MonthKey,
): MonthSnapshot {
  const date = monthToDate(month);
  const inMonth = <R extends { budget_id: string; month: string }>(rows: readonly R[]) =>
    rows.filter((r) => r.budget_id === budgetId && r.month === date);

  const accountsById = new Map(tables.accounts.map((a) => [a.id, a]));

  return {
    month,
    status: findMonthRow(tables, budgetId, month)?.status ?? 'draft',
    income: inMonth(tables.income_expectations).map(toIncomeLine),
    balances: inMonth(tables.account_balances).flatMap((row) => {
      const account = accountsById.get(row.account_id);
      return account ? [toAccountBalance(row, account)] : [];
    }),
    plans: inMonth(tables.category_plans).map(toCategoryPlan),
    seeds: inMonth(tables.category_assignments).map(toCategorySeed),
    transactions: tables.transactions
      .filter((t) => t.budget_id === budgetId && t.budget_month === date)
      .sort((a, b) =>
        a.transaction_date === b.transaction_date
          ? b.created_at.localeCompare(a.created_at)
          : b.transaction_date.localeCompare(a.transaction_date),
      )
      .map(toTransaction),
  };
}

/** Income minus everything already seeded. The server-side truth for validation. */
export function readyToSeed(tables: ReadonlyTables, budgetId: string, month: MonthKey): number {
  const date = monthToDate(month);
  const income = sumMinor(
    tables.income_expectations
      .filter((r) => r.budget_id === budgetId && r.month === date)
      .map((r) => r.expected_base_minor),
  );
  const seeded = sumMinor(
    tables.category_assignments
      .filter((r) => r.budget_id === budgetId && r.month === date)
      .map((r) => r.assigned_base_minor),
  );
  return income - seeded;
}

export function rates(tables: ReadonlyTables) {
  return tables.exchange_rates.map(toRatePair);
}
