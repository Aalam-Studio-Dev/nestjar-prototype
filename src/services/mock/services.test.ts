/**
 * Executable specification for the service contracts. Any future adapter
 * (Supabase) should pass the same scenarios.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { planSeedAllToPlan, summarizeMonth } from '@/domain/budget';
import type { Services } from '../contracts';
import { ServiceError } from '../errors';
import { createMockServices } from '.';
import type { KeyValueStorage } from './database';

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

async function expectCode(promise: Promise<unknown>, code: ServiceError['code']) {
  await expect(promise).rejects.toSatisfy(
    (error: unknown) => error instanceof ServiceError && error.code === code,
  );
}

describe('mock services', () => {
  let services: Services;
  let storage: ReturnType<typeof memoryStorage>;
  const month = '2026-10' as const;

  beforeEach(() => {
    storage = memoryStorage();
    services = createMockServices({ storage, latencyMs: 0 });
  });

  async function onboard() {
    const budget = await services.budgets.createBudget({
      name: 'Leila & Zaid',
      baseCurrency: 'GBP',
    });
    await services.budgets.invitePartner({
      budgetId: budget.id,
      displayName: 'Zaid Hamza',
      email: 'zaid@example.com',
    });
    return budget;
  }

  async function plan() {
    const budget = await onboard();
    const draft = await services.months.getBlueprintDraft(budget.id, month);
    await services.months.completeBlueprint(budget.id, draft);
    return budget;
  }

  async function summary(budgetId: string) {
    const [snapshot, structure] = await Promise.all([
      services.months.getSnapshot(budgetId, month),
      services.budgets.getStructure(budgetId),
    ]);
    return summarizeMonth(snapshot, structure.groups, structure.categories);
  }

  it('starts with no budget', async () => {
    expect(await services.budgets.getCurrentBudget()).toBeNull();
  });

  it('creates a budget from the starter template and adds a partner', async () => {
    const budget = await onboard();
    const current = await services.budgets.getCurrentBudget();
    expect(current?.members.map((m) => [m.displayName, m.role])).toEqual([
      ['Leila Ali', 'owner'],
      ['Zaid Hamza', 'partner'],
    ]);
    const structure = await services.budgets.getStructure(budget.id);
    expect(structure.accounts).toHaveLength(3);
    expect(structure.accounts.every((a) => a.ownerId !== undefined)).toBe(true);
    expect(structure.categories.length).toBeGreaterThan(0);
  });

  it('refuses a second budget for the same person', async () => {
    await onboard();
    await expectCode(
      services.budgets.createBudget({ name: 'Another', baseCurrency: 'GBP' }),
      'already-exists',
    );
  });

  it('keeps a month in draft until the blueprint is complete', async () => {
    const budget = await onboard();
    const snapshot = await services.months.getSnapshot(budget.id, month);
    expect(snapshot.status).toBe('draft');
    await expectCode(
      services.months.seedCategory({
        budgetId: budget.id,
        month,
        categoryId: 'x',
        amount: 100,
      }),
      'month-not-active',
    );
  });

  it('writes the blueprint with conservative income conversion', async () => {
    const budget = await plan();
    const snapshot = await services.months.getSnapshot(budget.id, month);
    expect(snapshot.status).toBe('active');
    const usd = snapshot.income.find((i) => i.expected.currency === 'USD');
    expect(usd?.expectedBase).toBe(3_108_00);
    expect(usd?.rate?.kind).toBe('fixed');
    const s = await summary(budget.id);
    expect(s.income).toBe(5_758_00);
    expect(s.planned).toBe(5_700_00);
  });

  it('refuses an over-planned blueprint', async () => {
    const budget = await onboard();
    const draft = await services.months.getBlueprintDraft(budget.id, month);
    const greedy = {
      ...draft,
      plans: draft.plans.map((p, i) => (i === 0 ? { ...p, amount: 99_999_00 } : p)),
    };
    await expectCode(services.months.completeBlueprint(budget.id, greedy), 'invalid-input');
    expect((await services.months.getSnapshot(budget.id, month)).status).toBe('draft');
  });

  it('seeds every jar to plan and leaves the remainder in the central jar', async () => {
    const budget = await plan();
    const instructions = planSeedAllToPlan(await summary(budget.id));
    await services.months.seedMany({
      budgetId: budget.id,
      month,
      instructions,
    });
    const after = await summary(budget.id);
    expect(after.readyToSeed).toBe(58_00);
    expect(after.groups.flatMap((g) => g.jars).every((j) => j.shortfall === 0)).toBe(true);
  });

  it('refuses to seed more than is available, atomically', async () => {
    const budget = await plan();
    const structure = await services.budgets.getStructure(budget.id);
    const [first, second] = structure.categories;
    await expectCode(
      services.months.seedMany({
        budgetId: budget.id,
        month,
        instructions: [
          { categoryId: first!.id, amount: 5_000_00 },
          { categoryId: second!.id, amount: 5_000_00 },
        ],
      }),
      'exceeds-available',
    );
    expect((await summary(budget.id)).seeded).toBe(0);
  });

  it('logs spending with the conservative outflow rate', async () => {
    const budget = await plan();
    const structure = await services.budgets.getStructure(budget.id);
    const chase = structure.accounts.find((a) => a.currency === 'USD')!;
    const category = structure.categories[0]!;
    const txn = await services.transactions.logTransaction({
      budgetId: budget.id,
      month,
      accountId: chase.id,
      categoryId: category.id,
      date: '2026-10-03',
      description: 'Coffee beans',
      amount: 20_00,
      currency: 'USD',
    });
    expect(txn.base).toBe(15_62);
    expect(txn.rate?.kind).toBe('live');
    await expectCode(
      services.transactions.logTransaction({
        budgetId: budget.id,
        month,
        accountId: chase.id,
        categoryId: category.id,
        date: '2026-11-01',
        description: 'Wrong month',
        amount: 100,
        currency: 'USD',
      }),
      'invalid-input',
    );
  });

  it('persists across reloads and resets cleanly', async () => {
    await onboard();
    const reloaded = createMockServices({ storage, latencyMs: 0 });
    expect(await reloaded.budgets.getCurrentBudget()).not.toBeNull();
    await reloaded.demo.reset();
    expect(await reloaded.budgets.getCurrentBudget()).toBeNull();
  });
});
