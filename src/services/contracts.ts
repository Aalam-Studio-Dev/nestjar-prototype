/**
 * Service contracts.
 *
 * The UI depends on these interfaces only. An adapter (mock today, Supabase
 * later) implements them. Swapping adapters is a one-line change in
 * ./index.ts and requires no component changes.
 *
 * Rules every adapter follows:
 *   - Inputs and outputs are domain types, never rows.
 *   - Business rules the database would enforce (RLS, constraints) are
 *     enforced here too, and surface as ServiceError with a stable code.
 */

import type { SeedInstruction } from '@/domain/budget';
import type { BlueprintDraft } from '@/domain/blueprint';
import type { RatePair } from '@/domain/exchange';
import type { CurrencyCode, Minor } from '@/domain/money';
import type { MonthKey } from '@/domain/month';
import type {
  Budget,
  BudgetStructure,
  CategorySeed,
  Member,
  MonthSnapshot,
  Transaction,
} from '@/domain/types';

export interface Viewer {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
}

export interface SessionService {
  /** The signed-in person. The mock adapter signs in a fixed demo profile. */
  getViewer(): Promise<Viewer>;
}

export interface CreateBudgetInput {
  readonly name: string;
  readonly baseCurrency: CurrencyCode;
}

export interface InvitePartnerInput {
  readonly budgetId: string;
  readonly displayName: string;
  readonly email: string;
}

export interface BudgetService {
  /** The budget the viewer belongs to, or null before onboarding. */
  getCurrentBudget(): Promise<Budget | null>;
  createBudget(input: CreateBudgetInput): Promise<Budget>;
  invitePartner(input: InvitePartnerInput): Promise<Member>;
  /** Accounts, groups and categories for the budget. */
  getStructure(budgetId: string): Promise<BudgetStructure>;
}

export interface RatesService {
  getRates(): Promise<readonly RatePair[]>;
}

export interface SeedCategoryInput {
  readonly budgetId: string;
  readonly month: MonthKey;
  readonly categoryId: string;
  /** Amount to add to the jar, in base currency minor units. */
  readonly amount: Minor;
}

export interface SeedManyInput {
  readonly budgetId: string;
  readonly month: MonthKey;
  readonly instructions: readonly SeedInstruction[];
}

export interface MonthService {
  getSnapshot(budgetId: string, month: MonthKey): Promise<MonthSnapshot>;
  /** A draft blueprint pre-filled from the best available source. */
  getBlueprintDraft(budgetId: string, month: MonthKey): Promise<BlueprintDraft>;
  /** Writes the blueprint and activates the month. */
  completeBlueprint(budgetId: string, draft: BlueprintDraft): Promise<MonthSnapshot>;
  seedCategory(input: SeedCategoryInput): Promise<CategorySeed>;
  /** Applies several seeds atomically: all succeed or none do. */
  seedMany(input: SeedManyInput): Promise<readonly CategorySeed[]>;
}

export interface LogTransactionInput {
  readonly budgetId: string;
  readonly month: MonthKey;
  readonly accountId: string;
  readonly categoryId: string;
  readonly date: string;
  readonly description: string;
  readonly amount: Minor;
  readonly currency: CurrencyCode;
}

export interface TransactionService {
  /** Converts with the conservative outflow rule and records the spend. */
  logTransaction(input: LogTransactionInput): Promise<Transaction>;
}

/**
 * Values the demo pre-fills into forms so the happy path can be walked
 * without typing. A production adapter returns null and forms start empty.
 */
export interface DemoScript {
  readonly month: MonthKey;
  readonly budgetName: string;
  readonly baseCurrency: CurrencyCode;
  readonly partner: { readonly displayName: string; readonly email: string };
  readonly sampleSpend: {
    readonly description: string;
    readonly amount: Minor;
    readonly categoryName: string;
    readonly accountName: string;
    readonly day: number;
  };
}

export interface DemoService {
  getScript(): DemoScript | null;
  /** Clears all demo data and returns to the start of the story. */
  reset(): Promise<void>;
}

export interface Services {
  readonly session: SessionService;
  readonly budgets: BudgetService;
  readonly rates: RatesService;
  readonly months: MonthService;
  readonly transactions: TransactionService;
  readonly demo: DemoService;
}
