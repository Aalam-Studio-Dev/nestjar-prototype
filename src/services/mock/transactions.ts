import { convertConservatively } from '@/domain/exchange';
import { money } from '@/domain/money';
import { isDateInMonth } from '@/domain/month';
import type { LogTransactionInput, TransactionService } from '../contracts';
import { ServiceError } from '../errors';
import { monthToDate, toTransaction } from '../mappers';
import type { MockContext } from './context';
import { findMonthRow, rates } from './queries';
import { createId, required } from './support';

export function createTransactionService(ctx: MockContext): TransactionService {
  return {
    async logTransaction(input: LogTransactionInput) {
      await ctx.latency();
      const description = input.description.trim();
      if (description === '') throw new ServiceError('invalid-input', 'Add a description');
      if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new ServiceError('invalid-input', 'Enter an amount above zero');
      }
      if (!isDateInMonth(input.date, input.month)) {
        throw new ServiceError('invalid-input', 'The date must fall within the budget month');
      }

      return ctx.db.transaction((tables) => {
        if (findMonthRow(tables, input.budgetId, input.month)?.status !== 'active') {
          throw new ServiceError('month-not-active', 'Plan this month before logging spending');
        }
        const budget = required(
          tables.budgets.find((b) => b.id === input.budgetId),
          'Budget',
        );
        required(
          tables.accounts.find((a) => a.id === input.accountId && a.budget_id === input.budgetId),
          'Account',
        );
        required(
          tables.categories.find(
            (c) => c.id === input.categoryId && c.budget_id === input.budgetId,
          ),
          'Category',
        );

        const conversion = convertConservatively(
          money(input.amount, input.currency),
          budget.base_currency,
          rates(tables),
          'outflow',
        );
        const row = {
          id: createId('txn'),
          budget_id: input.budgetId,
          account_id: input.accountId,
          category_id: input.categoryId,
          logged_by: ctx.viewerId,
          budget_month: monthToDate(input.month),
          transaction_date: input.date,
          description,
          original_amount_minor: input.amount,
          original_currency: input.currency,
          amount_base_minor: conversion.base.amount,
          rate_value: conversion.rate?.value ?? null,
          rate_kind: conversion.rate?.kind ?? null,
          created_at: new Date().toISOString(),
        };
        tables.transactions.push(row);
        return toTransaction(row);
      });
    },
  };
}
