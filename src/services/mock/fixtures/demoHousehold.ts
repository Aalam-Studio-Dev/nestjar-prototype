/**
 * The demo household: Leila and Zaid, a cross-border couple in London.
 * Leila is paid in US dollars by a US employer; Zaid is paid in pounds.
 *
 * This file is the single source of demo data. Change the story here and
 * every screen follows. Amounts are in minor units.
 */

import type { CurrencyCode } from '@/domain/money';
import type { MonthKey } from '@/domain/month';

export const DEMO_MONTH: MonthKey = '2026-10';

export const VIEWER = {
  id: 'user-leila',
  displayName: 'Leila Ali',
  email: 'leila@example.com',
} as const;

export const PARTNER = {
  id: 'user-zaid',
  displayName: 'Zaid Hamza',
  email: 'zaid@example.com',
} as const;

export const BUDGET_DEFAULTS = {
  name: 'Leila & Zaid',
  baseCurrency: 'GBP' as CurrencyCode,
};

export const RATES = [
  { from: 'USD', to: 'GBP', fixed: 0.74, live: 0.781, asOf: '2026-09-21' },
] as const satisfies readonly {
  from: CurrencyCode;
  to: CurrencyCode;
  fixed: number;
  live: number;
  asOf: string;
}[];

type Owner = 'viewer' | 'partner' | 'joint';

export interface AccountTemplate {
  readonly key: string;
  readonly name: string;
  readonly institution: string;
  readonly owner: Owner;
  readonly currency: CurrencyCode;
  readonly suggestedStartingBalance: number;
}

export const ACCOUNTS: readonly AccountTemplate[] = [
  {
    key: 'chase',
    name: 'Checking',
    institution: 'Chase',
    owner: 'viewer',
    currency: 'USD',
    suggestedStartingBalance: 2_400_00,
  },
  {
    key: 'joint',
    name: 'Joint current',
    institution: 'Monzo',
    owner: 'joint',
    currency: 'GBP',
    suggestedStartingBalance: 1_850_00,
  },
  {
    key: 'starling',
    name: 'Personal current',
    institution: 'Starling',
    owner: 'partner',
    currency: 'GBP',
    suggestedStartingBalance: 920_00,
  },
];

export interface IncomeTemplate {
  readonly label: string;
  readonly owner: Exclude<Owner, 'joint'>;
  readonly accountKey: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export const INCOME: readonly IncomeTemplate[] = [
  {
    label: 'Salary',
    owner: 'viewer',
    accountKey: 'chase',
    amount: 4_200_00,
    currency: 'USD',
  },
  {
    label: 'Salary',
    owner: 'partner',
    accountKey: 'starling',
    amount: 2_650_00,
    currency: 'GBP',
  },
];

export interface GroupTemplate {
  readonly name: string;
  readonly categories: readonly {
    readonly name: string;
    readonly suggestedPlan: number;
  }[];
}

/**
 * Suggested plans add up to £5,700. Expected income converts to £5,758, so
 * seeding everything to plan leaves £58 in the central jar for the person to
 * give a home. That final decision is the payoff of zero-based budgeting.
 */
export const GROUPS: readonly GroupTemplate[] = [
  {
    name: 'Essentials',
    categories: [
      { name: 'Rent & bills', suggestedPlan: 1_950_00 },
      { name: 'Groceries', suggestedPlan: 520_00 },
      { name: 'Transport', suggestedPlan: 175_00 },
      { name: 'Phone & internet', suggestedPlan: 85_00 },
    ],
  },
  {
    name: 'Everyday',
    categories: [
      { name: 'Eating out', suggestedPlan: 180_00 },
      { name: 'Fun money', suggestedPlan: 240_00 },
    ],
  },
  {
    name: 'Goals',
    categories: [
      { name: 'Emergency fund', suggestedPlan: 800_00 },
      { name: 'Lisbon trip', suggestedPlan: 450_00 },
      { name: 'House deposit', suggestedPlan: 1_000_00 },
    ],
  },
  {
    name: 'Giving',
    categories: [{ name: 'Family support', suggestedPlan: 300_00 }],
  },
];

export const SAMPLE_SPEND = {
  description: "Sainsbury's weekly shop",
  amount: 64_20,
  categoryName: 'Groceries',
  accountName: 'Joint current',
  day: 3,
} as const;
