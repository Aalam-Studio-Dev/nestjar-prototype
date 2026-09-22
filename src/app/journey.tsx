import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useActiveMonth, useCurrentBudget, useMonthSnapshot } from '@/data/budget';
import type { Budget, MonthStatus } from '@/domain/types';
import { errorMessage } from '@/lib/errorMessages';
import { ErrorState, LoadingState } from '@/ui';

/**
 * The happy path is a line, and every screen belongs to one stage of it.
 * Stages are derived from server state, never from local flags, so refreshing
 * or deep-linking always lands somewhere that makes sense.
 */
export type Stage = 'create' | 'invite' | 'plan' | 'budget';

export const STAGE_HOME: Record<Stage, string> = {
  create: '/welcome',
  invite: '/setup',
  plan: '/plan',
  budget: '/budget',
};

export function stageFor(budget: Budget | null, monthStatus: MonthStatus | undefined): Stage {
  if (!budget) return 'create';
  if (!budget.members.some((m) => m.role === 'partner')) return 'invite';
  if (monthStatus !== 'active') return 'plan';
  return 'budget';
}

type JourneyState =
  | { readonly status: 'pending' }
  | {
      readonly status: 'error';
      readonly error: unknown;
      readonly retry: () => void;
    }
  | { readonly status: 'ready'; readonly stage: Stage };

export function useJourney(): JourneyState {
  const month = useActiveMonth();
  const budgetQuery = useCurrentBudget();
  const budget = budgetQuery.data;
  const snapshotQuery = useMonthSnapshot(budget?.id, month);

  if (budgetQuery.isError) {
    return {
      status: 'error',
      error: budgetQuery.error,
      retry: () => void budgetQuery.refetch(),
    };
  }
  if (snapshotQuery.isError) {
    return {
      status: 'error',
      error: snapshotQuery.error,
      retry: () => void snapshotQuery.refetch(),
    };
  }
  if (!budgetQuery.isSuccess) return { status: 'pending' };
  // Decide as much as possible without the month, so screens do not flash a
  // loading state (and lose focus) while it is fetched.
  const early = stageFor(budget ?? null, undefined);
  if (early === 'create' || early === 'invite') return { status: 'ready', stage: early };
  if (!snapshotQuery.isSuccess) return { status: 'pending' };
  return {
    status: 'ready',
    stage: stageFor(budget ?? null, snapshotQuery.data.status),
  };
}

/** Sends "/" to wherever the person is in the story. */
export function StartRedirect() {
  const journey = useJourney();
  if (journey.status === 'pending') return <LoadingState label="Opening nestjar" />;
  if (journey.status === 'error') {
    return <ErrorState onRetry={journey.retry}>{errorMessage(journey.error)}</ErrorState>;
  }
  return <Navigate to={STAGE_HOME[journey.stage]} replace />;
}

/**
 * Renders children only when the person is at one of the allowed stages.
 * Otherwise redirects to their current stage. This is what keeps every path
 * off the happy path closed.
 */
export function StageGate({
  allow,
  children,
}: {
  readonly allow: readonly Stage[];
  readonly children: ReactNode;
}) {
  const journey = useJourney();
  if (journey.status === 'pending') return <LoadingState />;
  if (journey.status === 'error') {
    return <ErrorState onRetry={journey.retry}>{errorMessage(journey.error)}</ErrorState>;
  }
  if (!allow.includes(journey.stage)) return <Navigate to={STAGE_HOME[journey.stage]} replace />;
  return <>{children}</>;
}
