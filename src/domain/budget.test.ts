import { describe, expect, it } from 'vitest';
import {
  jarState,
  planSeedAllToPlan,
  summarizeJar,
  summarizeMonth,
  validateSeedAmount,
} from './budget';
import { money } from './money';
import type { Category, CategoryGroup, MonthSnapshot } from './types';

const groups: CategoryGroup[] = [
  { id: 'g1', name: 'Essentials', sortOrder: 0 },
  { id: 'g2', name: 'Goals', sortOrder: 1 },
];
const categories: Category[] = [
  { id: 'rent', groupId: 'g1', name: 'Rent', sortOrder: 0 },
  { id: 'food', groupId: 'g1', name: 'Groceries', sortOrder: 1 },
  { id: 'trip', groupId: 'g2', name: 'Trip', sortOrder: 0 },
];

function snapshot(overrides: Partial<MonthSnapshot> = {}): MonthSnapshot {
  return {
    month: '2026-10',
    status: 'active',
    income: [
      {
        id: 'i1',
        label: 'Salary',
        memberId: 'm1',
        accountId: 'a1',
        expected: money(1000_00, 'GBP'),
        expectedBase: 1000_00,
        rate: null,
      },
    ],
    balances: [],
    plans: [
      { categoryId: 'rent', planned: 600_00 },
      { categoryId: 'food', planned: 200_00 },
      { categoryId: 'trip', planned: 150_00 },
    ],
    seeds: [],
    transactions: [],
    ...overrides,
  };
}

describe('jarState', () => {
  it.each([
    [0, 0, 0, 'unplanned'],
    [100, 0, 0, 'blueprint'],
    [100, 50, 0, 'seeding'],
    [100, 100, 20, 'spending'],
    [100, 50, 60, 'overspent'],
  ] as const)('planned %i seeded %i spent %i is %s', (planned, seeded, spent, expected) => {
    expect(jarState(planned, seeded, spent)).toBe(expected);
  });
});

describe('summarizeJar', () => {
  it('scales the indicator to the larger of plan and seeded', () => {
    const jar = summarizeJar(categories[0]!, 100, 200, 50);
    expect(jar.seededRatio).toBe(1);
    expect(jar.spentRatio).toBe(0.25);
    expect(jar.shortfall).toBe(0);
  });
});

describe('summarizeMonth', () => {
  it('starts with a full central jar', () => {
    const summary = summarizeMonth(snapshot(), groups, categories);
    expect(summary.income).toBe(1000_00);
    expect(summary.readyToSeed).toBe(1000_00);
    expect(summary.jarLevel).toBe(1);
    expect(summary.isFullySeeded).toBe(false);
  });

  it('drains the central jar as money is seeded', () => {
    const summary = summarizeMonth(
      snapshot({ seeds: [{ categoryId: 'rent', seeded: 600_00 }] }),
      groups,
      categories,
    );
    expect(summary.readyToSeed).toBe(400_00);
    expect(summary.jarLevel).toBeCloseTo(0.4);
  });

  it('groups jars in sort order and totals them', () => {
    const summary = summarizeMonth(snapshot(), groups, categories);
    expect(summary.groups.map((g) => g.group.name)).toEqual(['Essentials', 'Goals']);
    expect(summary.groups[0]?.planned).toBe(800_00);
  });

  it('reports fully seeded only when income exists and nothing is left', () => {
    const full = summarizeMonth(
      snapshot({ seeds: [{ categoryId: 'rent', seeded: 1000_00 }] }),
      groups,
      categories,
    );
    expect(full.isFullySeeded).toBe(true);
    expect(summarizeMonth(snapshot({ income: [] }), groups, categories).isFullySeeded).toBe(false);
  });
});

describe('planSeedAllToPlan', () => {
  it('tops every jar up to plan when there is enough', () => {
    const summary = summarizeMonth(
      snapshot({ seeds: [{ categoryId: 'food', seeded: 50_00 }] }),
      groups,
      categories,
    );
    expect(planSeedAllToPlan(summary)).toEqual([
      { categoryId: 'rent', amount: 600_00 },
      { categoryId: 'food', amount: 150_00 },
      { categoryId: 'trip', amount: 150_00 },
    ]);
  });

  it('never seeds more than the central jar holds', () => {
    const lean = snapshot({
      income: [{ ...snapshot().income[0]!, expectedBase: 700_00 }],
    });
    const instructions = planSeedAllToPlan(summarizeMonth(lean, groups, categories));
    expect(instructions).toEqual([
      { categoryId: 'rent', amount: 600_00 },
      { categoryId: 'food', amount: 100_00 },
    ]);
  });
});

describe('validateSeedAmount', () => {
  it('requires a positive amount within what is available', () => {
    expect(validateSeedAmount(null, 100)).toEqual({
      ok: false,
      reason: 'not-positive',
    });
    expect(validateSeedAmount(0, 100)).toEqual({
      ok: false,
      reason: 'not-positive',
    });
    expect(validateSeedAmount(101, 100)).toEqual({
      ok: false,
      reason: 'exceeds-available',
    });
    expect(validateSeedAmount(100, 100)).toEqual({ ok: true });
  });
});
