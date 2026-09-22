import type { AppliedRate } from './exchange';
import type { CurrencyCode, Minor, Money } from './money';
import type { MonthKey } from './month';

/**
 * Domain entities. These are the shapes the UI works with. They are
 * deliberately independent of storage: the service layer maps database rows
 * (snake_case, see src/services/rows.ts) into these types.
 */

export type MemberRole = 'owner' | 'partner';
export type MemberStatus = 'active' | 'invited';

export interface Member {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly role: MemberRole;
  readonly status: MemberStatus;
}

export interface Budget {
  readonly id: string;
  readonly name: string;
  readonly baseCurrency: CurrencyCode;
  readonly members: readonly Member[];
}

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly institution: string;
  /** Null means the account is held jointly. */
  readonly ownerId: string | null;
  readonly currency: CurrencyCode;
}

export interface CategoryGroup {
  readonly id: string;
  readonly name: string;
  readonly sortOrder: number;
}

export interface Category {
  readonly id: string;
  readonly groupId: string;
  readonly name: string;
  readonly sortOrder: number;
}

export type MonthStatus = 'draft' | 'active';

export interface IncomeLine {
  readonly id: string;
  readonly label: string;
  readonly memberId: string;
  readonly accountId: string;
  readonly expected: Money;
  /** Expected amount converted with the conservative inflow rule. */
  readonly expectedBase: Minor;
  readonly rate: AppliedRate | null;
}

export interface AccountBalance {
  readonly accountId: string;
  readonly starting: Money;
}

export interface CategoryPlan {
  readonly categoryId: string;
  /** The blueprint target, in base currency. */
  readonly planned: Minor;
}

export interface CategorySeed {
  readonly categoryId: string;
  /** Money actually moved into the jar, in base currency. */
  readonly seeded: Minor;
}

export interface Transaction {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly categoryId: string;
  readonly accountId: string;
  readonly loggedBy: string;
  readonly original: Money;
  readonly base: Minor;
  readonly rate: AppliedRate | null;
}

/** Everything the budget screen needs for one month, fetched in one call. */
export interface MonthSnapshot {
  readonly month: MonthKey;
  readonly status: MonthStatus;
  readonly income: readonly IncomeLine[];
  readonly balances: readonly AccountBalance[];
  readonly plans: readonly CategoryPlan[];
  readonly seeds: readonly CategorySeed[];
  readonly transactions: readonly Transaction[];
}

/** Reference data that rarely changes within a session. */
export interface BudgetStructure {
  readonly accounts: readonly Account[];
  readonly groups: readonly CategoryGroup[];
  readonly categories: readonly Category[];
}
