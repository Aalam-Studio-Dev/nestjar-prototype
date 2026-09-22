import { sumMinor, type Minor } from './money';
import type { Category, CategoryGroup, MonthSnapshot } from './types';

/**
 * Zero-based budgeting maths.
 *
 * The central jar holds every pound of the month's income. Seeding moves money
 * out of the central jar into a category jar. The month is "fully seeded" when
 * the central jar is empty: every pound has a job.
 */

/**
 * The visual state of a category jar. Mirrors the four-state row indicator
 * from the original prototype, plus an explicit overspent state.
 *
 *   unplanned  no target and nothing seeded
 *   blueprint  has a target, nothing seeded yet (hatched track)
 *   seeding    money seeded, nothing spent (solid moss)
 *   spending   spending has started (honey overlay)
 *   overspent  spent more than was seeded
 */
export type JarState = 'unplanned' | 'blueprint' | 'seeding' | 'spending' | 'overspent';

export interface JarSummary {
  readonly category: Category;
  readonly planned: Minor;
  readonly seeded: Minor;
  readonly spent: Minor;
  readonly remaining: Minor;
  /** How much more is needed to reach the plan. Never negative. */
  readonly shortfall: Minor;
  readonly state: JarState;
  /** 0..1 widths for the row indicator, relative to the larger of plan or seeded. */
  readonly seededRatio: number;
  readonly spentRatio: number;
}

export interface GroupSummary {
  readonly group: CategoryGroup;
  readonly jars: readonly JarSummary[];
  readonly planned: Minor;
  readonly seeded: Minor;
  readonly spent: Minor;
}

export interface MonthSummary {
  readonly income: Minor;
  readonly planned: Minor;
  readonly seeded: Minor;
  readonly spent: Minor;
  /** Money still in the central jar. */
  readonly readyToSeed: Minor;
  /** 0..1, how full the central jar is. 1 means nothing has been seeded. */
  readonly jarLevel: number;
  readonly isFullySeeded: boolean;
  readonly groups: readonly GroupSummary[];
}

export function jarState(planned: Minor, seeded: Minor, spent: Minor): JarState {
  if (spent > seeded) return 'overspent';
  if (spent > 0) return 'spending';
  if (seeded > 0) return 'seeding';
  if (planned > 0) return 'blueprint';
  return 'unplanned';
}

function ratio(part: Minor, whole: Minor): number {
  if (whole <= 0) return 0;
  return Math.min(1, Math.max(0, part / whole));
}

export function summarizeJar(
  category: Category,
  planned: Minor,
  seeded: Minor,
  spent: Minor,
): JarSummary {
  const scale = Math.max(planned, seeded, spent);
  return {
    category,
    planned,
    seeded,
    spent,
    remaining: seeded - spent,
    shortfall: Math.max(0, planned - seeded),
    state: jarState(planned, seeded, spent),
    seededRatio: ratio(seeded, scale),
    spentRatio: ratio(spent, scale),
  };
}

export function summarizeMonth(
  snapshot: MonthSnapshot,
  groups: readonly CategoryGroup[],
  categories: readonly Category[],
): MonthSummary {
  const plannedBy = new Map(snapshot.plans.map((p) => [p.categoryId, p.planned]));
  const seededBy = new Map(snapshot.seeds.map((s) => [s.categoryId, s.seeded]));
  const spentBy = new Map<string, Minor>();
  for (const txn of snapshot.transactions) {
    spentBy.set(txn.categoryId, (spentBy.get(txn.categoryId) ?? 0) + txn.base);
  }

  const groupSummaries = [...groups]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group): GroupSummary => {
      const jars = categories
        .filter((c) => c.groupId === group.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) =>
          summarizeJar(
            c,
            plannedBy.get(c.id) ?? 0,
            seededBy.get(c.id) ?? 0,
            spentBy.get(c.id) ?? 0,
          ),
        );
      return {
        group,
        jars,
        planned: sumMinor(jars.map((j) => j.planned)),
        seeded: sumMinor(jars.map((j) => j.seeded)),
        spent: sumMinor(jars.map((j) => j.spent)),
      };
    })
    .filter((g) => g.jars.length > 0);

  const income = sumMinor(snapshot.income.map((line) => line.expectedBase));
  const seeded = sumMinor(snapshot.seeds.map((s) => s.seeded));
  const readyToSeed = income - seeded;

  return {
    income,
    planned: sumMinor(snapshot.plans.map((p) => p.planned)),
    seeded,
    spent: sumMinor(snapshot.transactions.map((t) => t.base)),
    readyToSeed,
    jarLevel: ratio(readyToSeed, income),
    isFullySeeded: income > 0 && readyToSeed === 0,
    groups: groupSummaries,
  };
}

export function findJar(summary: MonthSummary, categoryId: string): JarSummary | undefined {
  for (const group of summary.groups) {
    const jar = group.jars.find((j) => j.category.id === categoryId);
    if (jar) return jar;
  }
  return undefined;
}

export interface SeedInstruction {
  readonly categoryId: string;
  readonly amount: Minor;
}

/**
 * Works out how to top every jar up to its plan, in display order, without
 * seeding more than the central jar holds. Jars that cannot be fully topped up
 * receive whatever is left.
 */
export function planSeedAllToPlan(summary: MonthSummary): SeedInstruction[] {
  let available = summary.readyToSeed;
  const instructions: SeedInstruction[] = [];
  for (const group of summary.groups) {
    for (const jar of group.jars) {
      if (available <= 0) return instructions;
      if (jar.shortfall <= 0) continue;
      const amount = Math.min(jar.shortfall, available);
      instructions.push({ categoryId: jar.category.id, amount });
      available -= amount;
    }
  }
  return instructions;
}

export type SeedValidation =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'not-positive' | 'exceeds-available';
    };

export function validateSeedAmount(amount: Minor | null, readyToSeed: Minor): SeedValidation {
  if (amount === null || amount <= 0) return { ok: false, reason: 'not-positive' };
  if (amount > readyToSeed) return { ok: false, reason: 'exceeds-available' };
  return { ok: true };
}
