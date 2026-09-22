/**
 * Database row shapes.
 *
 * These mirror the Postgres tables the real app uses in Supabase (snake_case,
 * one interface per table). Both adapters speak in rows: the mock adapter keeps
 * them in memory, the Supabase adapter would receive them from PostgREST.
 * Mapping rows to domain types happens once, in ./mappers.ts.
 *
 * Money is stored as integer minor units in bigint columns.
 */

import type { RateKind } from '@/domain/exchange';
import type { CurrencyCode } from '@/domain/money';

export interface UserProfileRow {
  id: string;
  display_name: string;
  email: string;
}

export interface BudgetRow {
  id: string;
  name: string;
  base_currency: CurrencyCode;
  created_by: string;
  created_at: string;
}

export interface BudgetMemberRow {
  id: string;
  budget_id: string;
  user_id: string;
  role: 'owner' | 'partner';
  status: 'active' | 'invited';
}

export interface AccountRow {
  id: string;
  budget_id: string;
  name: string;
  institution: string;
  owner_id: string | null;
  native_currency: CurrencyCode;
  sort_order: number;
}

export interface CategoryGroupRow {
  id: string;
  budget_id: string;
  name: string;
  sort_order: number;
}

export interface CategoryRow {
  id: string;
  budget_id: string;
  group_id: string;
  name: string;
  sort_order: number;
  archived: boolean;
}

export interface BudgetMonthRow {
  budget_id: string;
  /** First day of the month, e.g. 2026-10-01. */
  month: string;
  status: 'draft' | 'active';
  completed_at: string | null;
}

export interface IncomeExpectationRow {
  id: string;
  budget_id: string;
  month: string;
  label: string;
  member_id: string;
  account_id: string;
  expected_amount_minor: number;
  expected_currency: CurrencyCode;
  expected_base_minor: number;
  rate_value: number | null;
  rate_kind: RateKind | null;
}

export interface AccountBalanceRow {
  id: string;
  budget_id: string;
  account_id: string;
  month: string;
  starting_balance_minor: number;
}

export interface CategoryPlanRow {
  id: string;
  budget_id: string;
  category_id: string;
  month: string;
  planned_base_minor: number;
}

export interface CategoryAssignmentRow {
  id: string;
  budget_id: string;
  category_id: string;
  month: string;
  assigned_base_minor: number;
}

export interface TransactionRow {
  id: string;
  budget_id: string;
  account_id: string;
  category_id: string;
  logged_by: string;
  budget_month: string;
  transaction_date: string;
  description: string;
  original_amount_minor: number;
  original_currency: CurrencyCode;
  amount_base_minor: number;
  rate_value: number | null;
  rate_kind: RateKind | null;
  created_at: string;
}

export interface ExchangeRateRow {
  id: string;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  fixed_rate: number;
  live_rate: number;
  as_of: string;
}

export interface Tables {
  user_profiles: UserProfileRow[];
  budgets: BudgetRow[];
  budget_members: BudgetMemberRow[];
  accounts: AccountRow[];
  category_groups: CategoryGroupRow[];
  categories: CategoryRow[];
  budget_months: BudgetMonthRow[];
  income_expectations: IncomeExpectationRow[];
  account_balances: AccountBalanceRow[];
  category_plans: CategoryPlanRow[];
  category_assignments: CategoryAssignmentRow[];
  transactions: TransactionRow[];
  exchange_rates: ExchangeRateRow[];
}

export type TableName = keyof Tables;

export type ReadonlyTables = {
  readonly [K in TableName]: readonly Readonly<Tables[K][number]>[];
};
