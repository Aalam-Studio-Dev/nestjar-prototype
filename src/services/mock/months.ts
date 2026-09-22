import {
  blueprintTotals,
  validateBalancesStep,
  validateIncomeStep,
  validatePlanStep,
  type BlueprintDraft,
} from '@/domain/blueprint';
import { convertConservatively } from '@/domain/exchange';
import { money, sumMinor } from '@/domain/money';
import type { MonthKey } from '@/domain/month';
import type { CategorySeed } from '@/domain/types';
import type { MonthService, SeedCategoryInput, SeedManyInput } from '../contracts';
import { ServiceError } from '../errors';
import { monthToDate, toCategorySeed } from '../mappers';
import type { Tables } from '../rows';
import { templateIds } from './budgets';
import type { MockContext } from './context';
import { ACCOUNTS, GROUPS, INCOME } from './fixtures/demoHousehold';
import { buildSnapshot, findMonthRow, rates, readyToSeed } from './queries';
import { createId, required } from './support';

function requireActiveMonth(draft: Tables, budgetId: string, month: MonthKey): void {
  const row = findMonthRow(draft, budgetId, month);
  if (row?.status !== 'active') {
    throw new ServiceError('month-not-active', 'Plan this month before seeding or spending');
  }
}

function addToJar(
  draft: Tables,
  budgetId: string,
  month: MonthKey,
  categoryId: string,
  amount: number,
): CategorySeed {
  required(
    draft.categories.find((c) => c.id === categoryId && c.budget_id === budgetId),
    'Category',
  );
  const date = monthToDate(month);
  let row = draft.category_assignments.find(
    (a) => a.budget_id === budgetId && a.category_id === categoryId && a.month === date,
  );
  if (!row) {
    row = {
      id: createId('asg'),
      budget_id: budgetId,
      category_id: categoryId,
      month: date,
      assigned_base_minor: 0,
    };
    draft.category_assignments.push(row);
  }
  row.assigned_base_minor += amount;
  return toCategorySeed(row);
}

export function createMonthService(ctx: MockContext): MonthService {
  return {
    async getSnapshot(budgetId, month) {
      await ctx.latency();
      return ctx.db.read((tables) => buildSnapshot(tables, budgetId, month));
    },

    async getBlueprintDraft(budgetId, month) {
      await ctx.latency();
      return ctx.db.read((tables): BlueprintDraft => {
        const members = tables.budget_members.filter((m) => m.budget_id === budgetId);
        const ownerId = required(
          members.find((m) => m.role === 'owner'),
          'Budget owner',
        ).user_id;
        const partnerId = members.find((m) => m.role === 'partner')?.user_id ?? ownerId;

        // No earlier month exists in the demo, so suggestions come from the
        // starter template. A real adapter would copy the previous month.
        return {
          month,
          income: INCOME.map((line, index) => ({
            key: `suggested-${index}`,
            label: line.label,
            memberId: line.owner === 'viewer' ? ownerId : partnerId,
            accountId: templateIds.account(budgetId, line.accountKey),
            amount: line.amount,
            currency: line.currency,
          })),
          balances: ACCOUNTS.map((account) => ({
            accountId: templateIds.account(budgetId, account.key),
            amount: account.suggestedStartingBalance,
          })),
          plans: GROUPS.flatMap((group) =>
            group.categories.map((category) => ({
              categoryId: templateIds.category(budgetId, category.name),
              amount: category.suggestedPlan,
            })),
          ),
        };
      });
    },

    async completeBlueprint(budgetId, draft) {
      await ctx.latency();
      return ctx.db.transaction((tables) => {
        const monthRow = required(findMonthRow(tables, budgetId, draft.month), 'Budget month');
        if (monthRow.status === 'active') {
          throw new ServiceError('month-already-active', 'This month has already been planned');
        }
        const budget = required(
          tables.budgets.find((b) => b.id === budgetId),
          'Budget',
        );
        const rateTable = rates(tables);
        const totals = blueprintTotals(draft, budget.base_currency, rateTable);
        const invalid =
          Object.keys(validateIncomeStep(draft)).length > 0 ||
          Object.keys(validateBalancesStep(draft)).length > 0 ||
          validatePlanStep(totals) !== null;
        if (invalid) throw new ServiceError('invalid-input', 'The blueprint is incomplete');

        const date = monthToDate(draft.month);
        const forMonth = <R extends { budget_id: string; month: string }>(r: R) =>
          !(r.budget_id === budgetId && r.month === date);
        tables.income_expectations = tables.income_expectations.filter(forMonth);
        tables.account_balances = tables.account_balances.filter(forMonth);
        tables.category_plans = tables.category_plans.filter(forMonth);

        for (const line of draft.income) {
          const conversion = convertConservatively(
            money(line.amount ?? 0, line.currency),
            budget.base_currency,
            rateTable,
            'inflow',
          );
          tables.income_expectations.push({
            id: createId('inc'),
            budget_id: budgetId,
            month: date,
            label: line.label.trim(),
            member_id: line.memberId,
            account_id: line.accountId,
            expected_amount_minor: conversion.original.amount,
            expected_currency: conversion.original.currency,
            expected_base_minor: conversion.base.amount,
            rate_value: conversion.rate?.value ?? null,
            rate_kind: conversion.rate?.kind ?? null,
          });
        }
        for (const row of draft.balances) {
          tables.account_balances.push({
            id: createId('bal'),
            budget_id: budgetId,
            account_id: row.accountId,
            month: date,
            starting_balance_minor: row.amount ?? 0,
          });
        }
        for (const plan of draft.plans) {
          if ((plan.amount ?? 0) <= 0) continue;
          tables.category_plans.push({
            id: createId('pln'),
            budget_id: budgetId,
            category_id: plan.categoryId,
            month: date,
            planned_base_minor: plan.amount ?? 0,
          });
        }
        monthRow.status = 'active';
        monthRow.completed_at = new Date().toISOString();
        return buildSnapshot(tables, budgetId, draft.month);
      });
    },

    async seedCategory(input: SeedCategoryInput) {
      await ctx.latency();
      if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new ServiceError('invalid-input', 'Seed a positive amount');
      }
      return ctx.db.transaction((tables) => {
        requireActiveMonth(tables, input.budgetId, input.month);
        if (input.amount > readyToSeed(tables, input.budgetId, input.month)) {
          throw new ServiceError('exceeds-available', 'There is not enough left in the jar');
        }
        return addToJar(tables, input.budgetId, input.month, input.categoryId, input.amount);
      });
    },

    async seedMany(input: SeedManyInput) {
      await ctx.latency();
      if (input.instructions.some((i) => !Number.isInteger(i.amount) || i.amount <= 0)) {
        throw new ServiceError('invalid-input', 'Seed positive amounts only');
      }
      return ctx.db.transaction((tables) => {
        requireActiveMonth(tables, input.budgetId, input.month);
        const total = sumMinor(input.instructions.map((i) => i.amount));
        if (total > readyToSeed(tables, input.budgetId, input.month)) {
          throw new ServiceError('exceeds-available', 'There is not enough left in the jar');
        }
        return input.instructions.map((i) =>
          addToJar(tables, input.budgetId, input.month, i.categoryId, i.amount),
        );
      });
    },
  };
}
