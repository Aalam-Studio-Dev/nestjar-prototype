import type { BlueprintDraft, IncomeDraft } from '@/domain/blueprint';
import type { CurrencyCode, Minor } from '@/domain/money';

export type DraftAction =
  | {
      readonly type: 'income';
      readonly key: string;
      readonly patch: Partial<Pick<IncomeDraft, 'label' | 'amount' | 'accountId'>>;
      /** The account's currency, applied when the account changes. */
      readonly currency?: CurrencyCode;
    }
  | {
      readonly type: 'balance';
      readonly accountId: string;
      readonly amount: Minor | null;
    }
  | {
      readonly type: 'plan';
      readonly categoryId: string;
      readonly amount: Minor | null;
    };

export function draftReducer(draft: BlueprintDraft, action: DraftAction): BlueprintDraft {
  switch (action.type) {
    case 'income':
      return {
        ...draft,
        income: draft.income.map((line) =>
          line.key === action.key
            ? {
                ...line,
                ...action.patch,
                ...(action.currency ? { currency: action.currency } : {}),
              }
            : line,
        ),
      };
    case 'balance':
      return {
        ...draft,
        balances: draft.balances.map((row) =>
          row.accountId === action.accountId ? { ...row, amount: action.amount } : row,
        ),
      };
    case 'plan':
      return {
        ...draft,
        plans: draft.plans.map((row) =>
          row.categoryId === action.categoryId ? { ...row, amount: action.amount } : row,
        ),
      };
  }
}

/** DOM id for a field, derived from its validation key ("income.k1.amount" becomes "field-income-k1-amount"). */
export function fieldId(issueKey: string): string {
  return `field-${issueKey.replace(/[^a-zA-Z0-9]+/g, '-')}`;
}
