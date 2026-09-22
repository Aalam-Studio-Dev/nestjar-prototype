import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { summarizeMonth, type MonthSummary } from '@/domain/budget';
import type { RatePair } from '@/domain/exchange';
import { parseMonthKey, type MonthKey } from '@/domain/month';
import type { Budget, BudgetStructure, Member, MonthSnapshot } from '@/domain/types';
import type { CreateBudgetInput, InvitePartnerInput } from '@/services/contracts';
import { queryKeys } from './queryKeys';
import { useServices } from './ServicesProvider';

export function useViewer() {
  const services = useServices();
  return useQuery({
    queryKey: queryKeys.viewer,
    queryFn: () => services.session.getViewer(),
  });
}

export function useCurrentBudget() {
  const services = useServices();
  return useQuery({
    queryKey: queryKeys.currentBudget,
    queryFn: () => services.budgets.getCurrentBudget(),
  });
}

export function useStructure(budgetId: string | undefined) {
  const services = useServices();
  return useQuery({
    queryKey: queryKeys.structure(budgetId ?? ''),
    queryFn: () => services.budgets.getStructure(budgetId ?? ''),
    enabled: budgetId !== undefined,
  });
}

export function useRates() {
  const services = useServices();
  return useQuery({
    queryKey: queryKeys.rates,
    queryFn: () => services.rates.getRates(),
    staleTime: Infinity,
  });
}

/**
 * The month the demo is set in. A production adapter has no script, so the
 * app falls back to the calendar month.
 */
export function useActiveMonth(): MonthKey {
  const services = useServices();
  return useMemo(() => {
    const scripted = services.demo.getScript()?.month;
    if (scripted) return scripted;
    const now = new Date();
    return parseMonthKey(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, [services]);
}

export function useMonthSnapshot(budgetId: string | undefined, month: MonthKey) {
  const services = useServices();
  return useQuery({
    queryKey: queryKeys.month(budgetId ?? '', month),
    queryFn: () => services.months.getSnapshot(budgetId ?? '', month),
    enabled: budgetId !== undefined,
  });
}

export interface BudgetMonthData {
  readonly budget: Budget;
  readonly structure: BudgetStructure;
  readonly snapshot: MonthSnapshot;
  readonly rates: readonly RatePair[];
  readonly summary: MonthSummary;
  readonly month: MonthKey;
}

export type BudgetMonthState =
  | { readonly status: 'pending' }
  | { readonly status: 'no-budget' }
  | {
      readonly status: 'error';
      readonly error: unknown;
      readonly retry: () => void;
    }
  | { readonly status: 'ready'; readonly data: BudgetMonthData };

/**
 * Everything a month screen needs, combined into a single state so pages
 * handle loading, error and ready exactly once.
 */
export function useBudgetMonth(): BudgetMonthState {
  const month = useActiveMonth();
  const budgetQuery = useCurrentBudget();
  const budgetId = budgetQuery.data?.id;
  const structureQuery = useStructure(budgetId);
  const snapshotQuery = useMonthSnapshot(budgetId, month);
  const ratesQuery = useRates();

  const budget = budgetQuery.data;
  const structure = structureQuery.data;
  const snapshot = snapshotQuery.data;
  const rates = ratesQuery.data;

  const summary = useMemo(
    () =>
      structure && snapshot
        ? summarizeMonth(snapshot, structure.groups, structure.categories)
        : undefined,
    [structure, snapshot],
  );

  const queries = [budgetQuery, structureQuery, snapshotQuery, ratesQuery];
  const failed = queries.find((q) => q.isError);
  if (failed) {
    return {
      status: 'error',
      error: failed.error,
      retry: () => queries.forEach((q) => void q.refetch()),
    };
  }
  if (budgetQuery.isSuccess && budget === null) return { status: 'no-budget' };
  if (budget && structure && snapshot && rates && summary) {
    return {
      status: 'ready',
      data: { budget, structure, snapshot, rates, summary, month },
    };
  }
  return { status: 'pending' };
}

export function useCreateBudget() {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => services.budgets.createBudget(input),
    onSuccess: (budget) => {
      queryClient.setQueryData(queryKeys.currentBudget, budget);
    },
  });
}

/** See useCompleteBlueprint for why success work goes in `onCompleted`. */
export function useInvitePartner({
  onCompleted,
}: { readonly onCompleted?: (member: Member) => void } = {}) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvitePartnerInput) => services.budgets.invitePartner(input),
    onSuccess: async (member, input) => {
      queryClient.setQueryData<Budget | null>(queryKeys.currentBudget, (budget) =>
        budget ? { ...budget, members: [...budget.members, member] } : budget,
      );
      onCompleted?.(member);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.currentBudget }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.structure(input.budgetId),
        }),
      ]);
    },
  });
}

export function useResetDemo() {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => services.demo.reset(),
    onSuccess: () => {
      queryClient.removeQueries();
    },
  });
}
