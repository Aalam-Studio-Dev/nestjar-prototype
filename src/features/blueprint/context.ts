import { createContext, useContext } from 'react';
import type { BudgetMonthData } from '@/data/budget';
import type { BlueprintDraft, BlueprintTotals, FieldIssues, PlanIssue } from '@/domain/blueprint';
import type { DraftAction } from './draftReducer';

export interface BlueprintContextValue {
  readonly data: BudgetMonthData;
  readonly draft: BlueprintDraft;
  readonly dispatch: (action: DraftAction) => void;
  readonly totals: BlueprintTotals;
  /** Field issues for the current step. */
  readonly issues: FieldIssues;
  readonly planIssue: PlanIssue | null;
  /** Issues are only revealed once the person has tried to continue. */
  readonly showIssues: boolean;
}

export const BlueprintContext = createContext<BlueprintContextValue | null>(null);

export function useBlueprint(): BlueprintContextValue {
  const value = useContext(BlueprintContext);
  if (!value) throw new Error('useBlueprint must be used inside the blueprint flow');
  return value;
}
