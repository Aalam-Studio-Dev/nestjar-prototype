/**
 * Row to domain mappers. The only place snake_case meets camelCase.
 * Shared by every adapter so the UI sees identical shapes whichever one runs.
 */

import type { RatePair } from '@/domain/exchange';
import { money } from '@/domain/money';
import { parseMonthKey, type MonthKey } from '@/domain/month';
import type {
  Account,
  AccountBalance,
  Budget,
  Category,
  CategoryGroup,
  CategoryPlan,
  CategorySeed,
  IncomeLine,
  Member,
  Transaction,
} from '@/domain/types';
import type {
  AccountBalanceRow,
  AccountRow,
  BudgetMemberRow,
  BudgetRow,
  CategoryAssignmentRow,
  CategoryGroupRow,
  CategoryPlanRow,
  CategoryRow,
  ExchangeRateRow,
  IncomeExpectationRow,
  TransactionRow,
  UserProfileRow,
} from './rows';

/** Months are stored as the first day of the month. */
export function monthToDate(month: MonthKey): string {
  return `${month}-01`;
}

export function dateToMonth(date: string): MonthKey {
  return parseMonthKey(date.slice(0, 7));
}

export function toMember(row: BudgetMemberRow, profile: UserProfileRow): Member {
  return {
    id: row.user_id,
    displayName: profile.display_name,
    email: profile.email,
    role: row.role,
    status: row.status,
  };
}

export function toBudget(row: BudgetRow, members: readonly Member[]): Budget {
  return {
    id: row.id,
    name: row.name,
    baseCurrency: row.base_currency,
    members,
  };
}

export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    ownerId: row.owner_id,
    currency: row.native_currency,
  };
}

export function toCategoryGroup(row: CategoryGroupRow): CategoryGroup {
  return { id: row.id, name: row.name, sortOrder: row.sort_order };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

export function toIncomeLine(row: IncomeExpectationRow): IncomeLine {
  return {
    id: row.id,
    label: row.label,
    memberId: row.member_id,
    accountId: row.account_id,
    expected: money(row.expected_amount_minor, row.expected_currency),
    expectedBase: row.expected_base_minor,
    rate:
      row.rate_value !== null && row.rate_kind !== null
        ? { value: row.rate_value, kind: row.rate_kind }
        : null,
  };
}

export function toAccountBalance(row: AccountBalanceRow, account: AccountRow): AccountBalance {
  return {
    accountId: row.account_id,
    starting: money(row.starting_balance_minor, account.native_currency),
  };
}

export function toCategoryPlan(row: CategoryPlanRow): CategoryPlan {
  return { categoryId: row.category_id, planned: row.planned_base_minor };
}

export function toCategorySeed(row: CategoryAssignmentRow): CategorySeed {
  return { categoryId: row.category_id, seeded: row.assigned_base_minor };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.transaction_date,
    description: row.description,
    categoryId: row.category_id,
    accountId: row.account_id,
    loggedBy: row.logged_by,
    original: money(row.original_amount_minor, row.original_currency),
    base: row.amount_base_minor,
    rate:
      row.rate_value !== null && row.rate_kind !== null
        ? { value: row.rate_value, kind: row.rate_kind }
        : null,
  };
}

export function toRatePair(row: ExchangeRateRow): RatePair {
  return {
    from: row.from_currency,
    to: row.to_currency,
    fixed: row.fixed_rate,
    live: row.live_rate,
    asOf: row.as_of,
  };
}
