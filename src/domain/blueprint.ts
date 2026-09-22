import { convertConservatively, type RatePair } from './exchange';
import { money, sumMinor, type CurrencyCode, type Minor } from './money';
import type { MonthKey } from './month';

/**
 * A blueprint is the plan for a month: expected income, where each account
 * starts, and a target for every jar. It is edited as a draft in the wizard
 * and only written when the person completes the final step.
 */

export interface IncomeDraft {
  /** Stable key for list rendering and field ids. */
  readonly key: string;
  readonly label: string;
  readonly memberId: string;
  readonly accountId: string;
  readonly amount: Minor | null;
  readonly currency: CurrencyCode;
}

export interface BalanceDraft {
  readonly accountId: string;
  readonly amount: Minor | null;
}

export interface PlanDraft {
  readonly categoryId: string;
  readonly amount: Minor | null;
}

export interface BlueprintDraft {
  readonly month: MonthKey;
  readonly income: readonly IncomeDraft[];
  readonly balances: readonly BalanceDraft[];
  readonly plans: readonly PlanDraft[];
}

export const BLUEPRINT_STEPS = ['income', 'balances', 'plan', 'review'] as const;
export type BlueprintStep = (typeof BLUEPRINT_STEPS)[number];

export type FieldIssue = 'required' | 'label-required';

/** Field-level issues keyed by the field's id, e.g. "income.<key>.amount". */
export type FieldIssues = Readonly<Record<string, FieldIssue>>;

export interface BlueprintTotals {
  readonly incomeBase: Minor;
  readonly plannedBase: Minor;
  /** Positive when there is income left without a plan, negative when over-planned. */
  readonly unplanned: Minor;
}

export function blueprintTotals(
  draft: BlueprintDraft,
  baseCurrency: CurrencyCode,
  rates: readonly RatePair[],
): BlueprintTotals {
  const incomeBase = sumMinor(
    draft.income.map((line) =>
      line.amount === null
        ? 0
        : convertConservatively(money(line.amount, line.currency), baseCurrency, rates, 'inflow')
            .base.amount,
    ),
  );
  const plannedBase = sumMinor(draft.plans.map((p) => p.amount ?? 0));
  return { incomeBase, plannedBase, unplanned: incomeBase - plannedBase };
}

export function validateIncomeStep(draft: BlueprintDraft): FieldIssues {
  const issues: Record<string, FieldIssue> = {};
  for (const line of draft.income) {
    if (line.label.trim() === '') issues[`income.${line.key}.label`] = 'label-required';
    if (line.amount === null || line.amount <= 0) issues[`income.${line.key}.amount`] = 'required';
  }
  return issues;
}

export function validateBalancesStep(draft: BlueprintDraft): FieldIssues {
  const issues: Record<string, FieldIssue> = {};
  for (const row of draft.balances) {
    if (row.amount === null) issues[`balance.${row.accountId}`] = 'required';
  }
  return issues;
}

export type PlanIssue = 'over-planned' | 'nothing-planned';

export function validatePlanStep(totals: BlueprintTotals): PlanIssue | null {
  if (totals.plannedBase <= 0) return 'nothing-planned';
  if (totals.unplanned < 0) return 'over-planned';
  return null;
}
